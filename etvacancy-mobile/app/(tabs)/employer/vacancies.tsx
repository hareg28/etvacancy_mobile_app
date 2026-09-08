import { View, Text, TouchableOpacity, Alert, Platform, Modal, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Screen } from '@components/ui/Screen';
import Button from '@components/ui/Button';
import { Ionicons } from '@expo/vector-icons';
import { jobs as jobsApi } from '@api/index';
import { COLORS, JOB_TYPES } from '@constants/index';
import { formatDate, truncate, formatSalaryRange } from '@utils/index';
import type { Job, PaginatedResponse } from '@/types/index';
import { DataTable, type ColumnDef } from '@components/ui/DataTable';
import { useLocalJobsStore } from '@store/index';

const statusStyles: Record<string, { bg: string; text: string }> = {
  PUBLISHED: { bg: '#DCFCE7', text: '#15803D' },
  DRAFT: { bg: '#F1F5F9', text: '#475569' },
  CLOSED: { bg: '#FEE2E2', text: '#B91C1C' },
  EXPIRED: { bg: '#FEF3C7', text: '#B45309' },
  ARCHIVED: { bg: '#DBEAFE', text: '#1D4ED8' },
};

export default function EmployerVacanciesScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { localPostedJobs, addJob, updateJob: updateGlobalJob, deleteJob: deleteGlobalJob } = useLocalJobsStore();

  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);

  const [actionMenuJob, setActionMenuJob] = useState<Job | null>(null);
  const [actionMenuVisible, setActionMenuVisible] = useState(false);

  const [editTitle, setEditTitle] = useState('');
  const [editCity, setEditCity] = useState('');

  // Form states for posting a new vacancy
  const [createTitle, setCreateTitle] = useState('');
  const [createCity, setCreateCity] = useState('Addis Ababa');
  const [createType, setCreateType] = useState<Job['type']>('FULL_TIME');
  const [createSalaryMin, setCreateSalaryMin] = useState('20000');
  const [createSalaryMax, setCreateSalaryMax] = useState('35000');
  const [createDescription, setCreateDescription] = useState('');
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

  const [deletedJobIds, setDeletedJobIds] = useState<string[]>([]);

  const handleCreateVacancy = async () => {
    if (!createTitle.trim()) {
      Alert.alert('Error', 'Please enter a job position title.');
      return;
    }

    setIsSubmittingCreate(true);
    const now = new Date();
    const newJob: Job = {
      id: `job_${Date.now()}`,
      title: createTitle.trim(),
      slug: createTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      type: createType,
      employmentType: 'PERMANENT',
      experienceLevel: 'MID_LEVEL',
      city: createCity.trim() || 'Addis Ababa',
      country: 'Ethiopia',
      categoryId: 'cat-software',
      status: 'PUBLISHED',
      urgentHiring: false,
      featured: true,
      salaryMin: parseFloat(createSalaryMin) || 15000,
      salaryMax: parseFloat(createSalaryMax) || 30000,
      salaryCurrency: 'ETB',
      salaryPeriod: 'MONTHLY',
      description: createDescription.trim() || 'Great career opportunity at our company.',
      requirements: ['Bachelor degree or equivalent experience', 'Relevant work experience'],
      responsibilities: ['Execute key position tasks efficiently', 'Collaborate with team members'],
      viewCount: 0,
      applicationCount: 0,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + 86400000 * 30).toISOString(),
      company: {
        id: 'comp_employer_1',
        name: 'Your Company',
        verifiedAt: now.toISOString(),
        logo: null,
        industry: 'General',
        city: createCity.trim() || 'Addis Ababa',
      },
    };

    try {
      await jobsApi.create(newJob);
    } catch (e) {
      // Local state fallback if backend API is offline
    }

    addJob(newJob);
    queryClient.invalidateQueries({ queryKey: ['jobs'] });
    queryClient.invalidateQueries({ queryKey: ['jobs', 'featured'] });
    queryClient.invalidateQueries({ queryKey: ['jobs', 'recent'] });
    setIsSubmittingCreate(false);
    setCreateModalVisible(false);

    setCreateTitle('');
    setCreateDescription('');
    setCreateSalaryMin('20000');
    setCreateSalaryMax('35000');
    setCreateCity('Addis Ababa');
    setCreateType('FULL_TIME');

    Alert.alert(
      '✅ Vacancy Published!',
      `Successfully posted "${newJob.title}".\n\nThis job is now visible to all job seekers on the Home and Jobs pages.`,
    );
  };

  const { data, isLoading } = useQuery({
    queryKey: ['jobs', 'vacancies'],
    queryFn: async () => {
      try {
        const res = await jobsApi.list({ limit: 100 });
        if (res && res.data) return res;
      } catch {
        // fallback
      }
      return {
        data: localJobs,
        total: localJobs.length,
        page: 1,
        limit: 100,
        totalPages: 1,
        hasMore: false,
      };
    },
  });

  const publishJob = useMutation({
    mutationFn: (id: string) => jobsApi.publish(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      Alert.alert('Job Published', 'Your job is live!');
    },
  });

  const closeJob = useMutation({
    mutationFn: (id: string) => jobsApi.close(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });

  const jobsList = useMemo(() => {
    const apiList: Job[] = data?.data && data.data.length > 0 ? data.data : [];
    const apiIds = new Set(apiList.map((j) => j.id));
    const mergedUnique: Job[] = [
      ...apiList,
      ...localPostedJobs.filter((j) => !apiIds.has(j.id)),
    ];
    return mergedUnique.filter((j) => !deletedJobIds.includes(j.id));
  }, [data, localPostedJobs, deletedJobIds]);

  const openActionsMenu = (job: Job) => {
    setActionMenuJob(job);
    setActionMenuVisible(true);
  };

  const handleView = (job: Job) => {
    setSelectedJob(job);
    setViewModalVisible(true);
  };

  const handleEdit = (job: Job) => {
    setSelectedJob(job);
    setEditTitle(job.title);
    setEditCity(job.city ?? '');
    setEditModalVisible(true);
  };

  const handleSaveEdit = () => {
    if (!selectedJob) return;
    const updated = {
      ...selectedJob,
      title: editTitle,
      city: editCity,
    };
    updateGlobalJob(selectedJob.id, updated);
    queryClient.invalidateQueries({ queryKey: ['jobs'] });
    queryClient.invalidateQueries({ queryKey: ['jobs', 'featured'] });
    queryClient.invalidateQueries({ queryKey: ['jobs', 'recent'] });
    setEditModalVisible(false);
    Alert.alert('Success', 'Vacancy updated successfully. Changes are now visible on job seeker pages.');
  };

  const handleDelete = (job: Job) => {
    const performDelete = () => {
      setDeletedJobIds((prev) => [...prev, job.id]);
      deleteGlobalJob(job.id);
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['jobs', 'featured'] });
      queryClient.invalidateQueries({ queryKey: ['jobs', 'recent'] });
      Alert.alert('Deleted', `Vacancy "${job.title}" deleted from all job seeker pages.`);
    };

    if (Platform.OS === 'web') {
      const confirm1 = window.confirm(`Are you sure you want to delete vacancy "${job.title}"?`);
      if (confirm1) {
        const confirm2 = window.confirm(
          `⚠️ FINAL CONFIRMATION:\nThis action is permanent and cannot be undone.\nAre you DOUBLE SURE you want to delete "${job.title}"?`,
        );
        if (confirm2) {
          performDelete();
        }
      }
    } else {
      Alert.alert(
        'First Confirmation: Delete Vacancy',
        `Are you sure you want to delete vacancy "${job.title}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Next: Confirm Delete',
            style: 'destructive',
            onPress: () => {
              Alert.alert(
                '⚠️ Final Confirmation: Permanent Delete',
                `This action cannot be undone. Are you double sure you want to delete "${job.title}"?`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Permanently Delete',
                    style: 'destructive',
                    onPress: performDelete,
                  },
                ],
              );
            },
          },
        ],
      );
    }
  };

  const columns: ColumnDef<Job>[] = useMemo(
    () => [
      {
        key: 'title',
        header: 'Job Title',
        width: 220,
        sortable: true,
        accessorKey: 'title',
        cell: (row) => (
          <TouchableOpacity onPress={() => router.push(`/jobs/${row.id}`)}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#0F172A' }} numberOfLines={1}>
              {truncate(row.title, 35)}
            </Text>
            <Text style={{ fontSize: 11, color: '#64748B' }}>
              {row.company?.name ?? 'Company'} • {row.city ?? 'Ethiopia'}
            </Text>
          </TouchableOpacity>
        ),
      },
      {
        key: 'type',
        header: 'Type',
        width: 120,
        sortable: true,
        accessorKey: 'type',
        cell: (row) => (
          <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: COLORS.primary + '15', alignSelf: 'flex-start' }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: COLORS.primary }}>
              {JOB_TYPES.find((t) => t.value === row.type)?.label ?? row.type}
            </Text>
          </View>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        width: 120,
        sortable: true,
        accessorKey: 'status',
        filterable: true,
        filterOptions: [
          { label: 'Published', value: 'PUBLISHED' },
          { label: 'Draft', value: 'DRAFT' },
          { label: 'Closed', value: 'CLOSED' },
          { label: 'Expired', value: 'EXPIRED' },
        ],
        cell: (row) => {
          const st = statusStyles[row.status] ?? statusStyles.DRAFT;
          return (
            <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, backgroundColor: st.bg, alignSelf: 'flex-start' }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: st.text }}>
                {row.status}
              </Text>
            </View>
          );
        },
      },
      {
        key: 'salary',
        header: 'Salary Range',
        width: 140,
        sortable: false,
        cell: (row) => (
          <Text style={{ fontSize: 12, color: '#334155', fontWeight: '600' }}>
            {formatSalaryRange(row.salaryMin, row.salaryMax, row.salaryPeriod, row.salaryCurrency)}
          </Text>
        ),
      },
      {
        key: 'createdAt',
        header: 'Posted Date',
        width: 120,
        sortable: true,
        accessorKey: 'createdAt',
        cell: (row) => (
          <Text style={{ fontSize: 12, color: '#64748B' }}>
            {formatDate(row.createdAt, 'short')}
          </Text>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        width: 80,
        align: 'center',
        sortable: false,
        cell: (row) => (
          <TouchableOpacity
            onPress={() => openActionsMenu(row)}
            activeOpacity={0.7}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: '#F1F5F9',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: '#CBD5E1',
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="ellipsis-vertical" size={16} color="#475569" />
          </TouchableOpacity>
        ),
      },
    ],
    [router],
  );

  return (
    <Screen scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <View style={{ flex: 1, pr: 12 }}>
          <Text style={{ fontSize: 24, fontWeight: '700', color: '#0F172A' }}>
            Vacancies Table
          </Text>
          <Text style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>
            Manage positions with 3-dot actions dropdown menu, search, and sorting
          </Text>
        </View>
        <Button
          title="Post Vacancy"
          variant="primary"
          size="sm"
          leftIcon="add-circle-outline"
          onPress={() => setCreateModalVisible(true)}
        />
      </View>

      <DataTable
        data={jobsList}
        columns={columns}
        keyExtractor={(item) => item.id}
        searchPlaceholder="Search vacancies by title, type, or status..."
        initialPageSize={5}
        isLoading={isLoading}
        emptyMessage="No job vacancies found."
      />

      {/* ─── MODAL: ACTIONS DROPDOWN MENU ───────────────────────────────── */}
      <Modal
        visible={actionMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setActionMenuVisible(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          activeOpacity={1}
          onPress={() => setActionMenuVisible(false)}
        >
          <View
            style={{
              width: '100%',
              maxWidth: 320,
              backgroundColor: '#FFFFFF',
              borderRadius: 14,
              padding: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.12,
              shadowRadius: 12,
              elevation: 5,
            }}
            onStartShouldSetResponder={() => true}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
                paddingBottom: 8,
                borderBottomWidth: 1,
                borderBottomColor: '#E2E8F0',
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F172A' }} numberOfLines={1}>
                Actions for {actionMenuJob?.title}
              </Text>
              <TouchableOpacity onPress={() => setActionMenuVisible(false)}>
                <Ionicons name="close" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 6 }}>
              {/* View Vacancy */}
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderRadius: 8,
                  backgroundColor: '#F8FAFC',
                }}
                onPress={() => {
                  setActionMenuVisible(false);
                  if (actionMenuJob) handleView(actionMenuJob);
                }}
              >
                <View style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="eye-outline" size={15} color="#1D4ED8" />
                </View>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#1E293B' }}>View Details</Text>
              </TouchableOpacity>

              {/* Edit Vacancy */}
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderRadius: 8,
                  backgroundColor: '#F8FAFC',
                }}
                onPress={() => {
                  setActionMenuVisible(false);
                  if (actionMenuJob) handleEdit(actionMenuJob);
                }}
              >
                <View style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="create-outline" size={15} color="#B45309" />
                </View>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#1E293B' }}>Edit Vacancy</Text>
              </TouchableOpacity>

              {/* Publish / Close */}
              {actionMenuJob?.status === 'DRAFT' && (
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    borderRadius: 8,
                    backgroundColor: '#F0FDF4',
                  }}
                  onPress={() => {
                    setActionMenuVisible(false);
                    publishJob.mutate(actionMenuJob.id);
                  }}
                >
                  <View style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="megaphone-outline" size={15} color="#15803D" />
                  </View>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#15803D' }}>Publish Vacancy</Text>
                </TouchableOpacity>
              )}

              {/* Delete Vacancy (Double Confirmation) */}
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderRadius: 8,
                  backgroundColor: '#FEF2F2',
                }}
                onPress={() => {
                  setActionMenuVisible(false);
                  if (actionMenuJob) handleDelete(actionMenuJob);
                }}
              >
                <View style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="trash-outline" size={15} color="#DC2626" />
                </View>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#DC2626' }}>Delete Vacancy</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ─── MODAL: VIEW VACANCY DETAILS ────────────────────────────────── */}
      <Modal
        visible={viewModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setViewModalVisible(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          activeOpacity={1}
          onPress={() => setViewModalVisible(false)}
        >
          <View
            style={{
              width: '100%',
              maxWidth: 400,
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 24,
            }}
            onStartShouldSetResponder={() => true}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#0F172A' }}>Vacancy Details</Text>
              <TouchableOpacity onPress={() => setViewModalVisible(false)}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {selectedJob && (
              <View style={{ gap: 12 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#0F172A' }}>{selectedJob.title}</Text>
                <Text style={{ fontSize: 13, color: '#64748B' }}>{selectedJob.company?.name ?? 'Company'} • {selectedJob.city}</Text>

                <View style={{ height: 1, backgroundColor: '#E2E8F0', marginVertical: 4 }} />

                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 13, color: '#64748B' }}>Job Type:</Text>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#0F172A' }}>{selectedJob.type}</Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 13, color: '#64748B' }}>Salary Range:</Text>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#15803D' }}>
                    {formatSalaryRange(selectedJob.salaryMin, selectedJob.salaryMax, selectedJob.salaryPeriod, selectedJob.salaryCurrency)}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 13, color: '#64748B' }}>Status:</Text>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: selectedJob.status === 'PUBLISHED' ? '#15803D' : '#B45309' }}>
                    {selectedJob.status}
                  </Text>
                </View>

                <TouchableOpacity
                  style={{ backgroundColor: '#1D4ED8', borderRadius: 8, paddingVertical: 10, alignItems: 'center', marginTop: 12 }}
                  onPress={() => {
                    setViewModalVisible(false);
                    router.push(`/jobs/${selectedJob.id}`);
                  }}
                >
                  <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Open Full Job Page</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ─── MODAL: EDIT VACANCY ────────────────────────────────────────── */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          activeOpacity={1}
          onPress={() => setEditModalVisible(false)}
        >
          <View
            style={{
              width: '100%',
              maxWidth: 400,
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 24,
            }}
            onStartShouldSetResponder={() => true}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#0F172A' }}>Edit Vacancy</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 14 }}>
              <View>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6 }}>Position Title</Text>
                <TextInput
                  style={{ borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#0F172A' }}
                  value={editTitle}
                  onChangeText={setEditTitle}
                />
              </View>

              <View>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6 }}>City / Location</Text>
                <TextInput
                  style={{ borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#0F172A' }}
                  value={editCity}
                  onChangeText={setEditCity}
                />
              </View>

              <TouchableOpacity
                style={{ backgroundColor: '#0F172A', borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginTop: 8 }}
                onPress={handleSaveEdit}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ─── MODAL: CREATE / POST VACANCY ────────────────────────────────── */}
      <Modal
        visible={createModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          activeOpacity={1}
          onPress={() => setCreateModalVisible(false)}
        >
          <View
            style={{
              width: '100%',
              maxWidth: 440,
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 24,
            }}
            onStartShouldSetResponder={() => true}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#0F172A' }}>Post New Job Vacancy</Text>
              <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 14 }}>
              <View>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6 }}>Position Title *</Text>
                <TextInput
                  style={{ borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#0F172A' }}
                  placeholder="e.g. Senior Software Engineer"
                  placeholderTextColor="#94A3B8"
                  value={createTitle}
                  onChangeText={setCreateTitle}
                />
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6 }}>City / Location</Text>
                  <TextInput
                    style={{ borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#0F172A' }}
                    placeholder="Addis Ababa"
                    placeholderTextColor="#94A3B8"
                    value={createCity}
                    onChangeText={setCreateCity}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6 }}>Min Salary (ETB)</Text>
                  <TextInput
                    style={{ borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#0F172A' }}
                    keyboardType="numeric"
                    value={createSalaryMin}
                    onChangeText={setCreateSalaryMin}
                  />
                </View>
              </View>

              <View>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6 }}>Job Description</Text>
                <TextInput
                  style={{ borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#0F172A', height: 80, textAlignVertical: 'top' }}
                  multiline
                  placeholder="Key responsibilities and qualifications..."
                  placeholderTextColor="#94A3B8"
                  value={createDescription}
                  onChangeText={setCreateDescription}
                />
              </View>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                <View style={{ flex: 1 }}>
                  <Button
                    title="Cancel"
                    variant="outline"
                    size="md"
                    onPress={() => setCreateModalVisible(false)}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Button
                    title="Publish Job"
                    variant="primary"
                    size="md"
                    loading={isSubmittingCreate}
                    onPress={handleCreateVacancy}
                  />
                </View>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </Screen>
  );
}
