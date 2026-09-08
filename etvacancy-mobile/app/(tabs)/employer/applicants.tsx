import { View, Text, TouchableOpacity, Alert, Platform, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Screen } from '@components/ui/Screen';
import { Avatar } from '@components/ui/Avatar';
import { Ionicons } from '@expo/vector-icons';
import { applications as applicationsApi } from '@api/index';
import { COLORS, APPLICATION_STATUS_LABELS } from '@constants/index';
import { formatDate, truncate, getFullName } from '@utils/index';
import type { JobApplication, PaginatedResponse } from '@/types/index';
import { DataTable, type ColumnDef } from '@components/ui/DataTable';

const MOCK_APPLICANTS: JobApplication[] = [
  {
    id: 'app_1',
    jobId: 'job_1',
    jobSeekerId: 'js_1',
    status: 'PENDING',
    appliedAt: '2024-01-20T10:00:00.000Z',
    updatedAt: '2024-01-20T10:00:00.000Z',
    jobSeeker: {
      id: 'js_1',
      user: {
        id: 'usr_2',
        email: 'tigist.alemu@gmail.com',
        firstName: 'Tigist',
        lastName: 'Alemu',
        role: 'JOB_SEEKER',
      },
    } as any,
    job: {
      id: 'job_1',
      title: 'Senior Software Engineer (Full Stack)',
      company: { name: 'Ethio Telecom' },
    } as any,
  },
  {
    id: 'app_2',
    jobId: 'job_2',
    jobSeekerId: 'js_2',
    status: 'SHORTLISTED',
    appliedAt: '2024-02-05T14:30:00.000Z',
    updatedAt: '2024-02-05T14:30:00.000Z',
    jobSeeker: {
      id: 'js_2',
      user: {
        id: 'usr_4',
        email: 'kebede.tafese@yahoo.com',
        firstName: 'Kebede',
        lastName: 'Tafese',
        role: 'JOB_SEEKER',
      },
    } as any,
    job: {
      id: 'job_2',
      title: 'IT Support & Systems Specialist',
      company: { name: 'Commercial Bank of Ethiopia' },
    } as any,
  },
  {
    id: 'app_3',
    jobId: 'job_4',
    jobSeekerId: 'js_3',
    status: 'INTERVIEW',
    appliedAt: '2024-04-10T11:15:00.000Z',
    updatedAt: '2024-04-10T11:15:00.000Z',
    jobSeeker: {
      id: 'js_3',
      user: {
        id: 'usr_6',
        email: 'marta.hailu@outlook.com',
        firstName: 'Marta',
        lastName: 'Hailu',
        role: 'JOB_SEEKER',
      },
    } as any,
    job: {
      id: 'job_4',
      title: 'UI/UX Mobile Product Designer',
      company: { name: 'iCog Labs' },
    } as any,
  },
  {
    id: 'app_4',
    jobId: 'job_1',
    jobSeekerId: 'js_4',
    status: 'HIRED',
    appliedAt: '2024-01-22T09:00:00.000Z',
    updatedAt: '2024-01-22T09:00:00.000Z',
    jobSeeker: {
      id: 'js_4',
      user: {
        id: 'usr_8',
        email: 'selam.yohannes@gmail.com',
        firstName: 'Selam',
        lastName: 'Yohannes',
        role: 'JOB_SEEKER',
      },
    } as any,
    job: {
      id: 'job_1',
      title: 'Senior Software Engineer (Full Stack)',
      company: { name: 'Ethio Telecom' },
    } as any,
  },
];

const statusStyles: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: '#FEF3C7', text: '#B45309' },
  SHORTLISTED: { bg: '#DBEAFE', text: '#1D4ED8' },
  INTERVIEW: { bg: '#EDE9FE', text: '#6D28D9' },
  HIRED: { bg: '#DCFCE7', text: '#15803D' },
  REJECTED: { bg: '#FEE2E2', text: '#B91C1C' },
  WITHDRAWN: { bg: '#F1F5F9', text: '#64748B' },
};

export default function EmployerApplicantsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [selectedApp, setSelectedApp] = useState<JobApplication | null>(null);
  const [viewModalVisible, setViewModalVisible] = useState(false);

  const [actionMenuApp, setActionMenuApp] = useState<JobApplication | null>(null);
  const [actionMenuVisible, setActionMenuVisible] = useState(false);

  const [deletedAppIds, setDeletedAppIds] = useState<string[]>([]);
  const [localApplicants, setLocalApplicants] = useState<JobApplication[]>(MOCK_APPLICANTS);

  const { data, isLoading } = useQuery<PaginatedResponse<JobApplication>>({
    queryKey: ['applications', 'list'],
    queryFn: async () => {
      try {
        const res = await applicationsApi.list({ limit: 100 });
        if (res && res.data && res.data.length > 0) return res;
      } catch {
        // fallback
      }
      return {
        data: localApplicants,
        total: localApplicants.length,
        page: 1,
        limit: 100,
        totalPages: 1,
        hasMore: false,
      };
    },
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: string; notes?: string }) =>
      applicationsApi.updateStatus(id, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      Alert.alert('Status Updated', 'Applicant status has been updated.');
    },
  });

  const applicationsList = useMemo(() => {
    const rawList = data?.data && data.data.length > 0 ? data.data : localApplicants;
    return rawList.filter((a) => !deletedAppIds.includes(a.id));
  }, [data, localApplicants, deletedAppIds]);

  const openActionsMenu = (app: JobApplication) => {
    setActionMenuApp(app);
    setActionMenuVisible(true);
  };

  const handleView = (app: JobApplication) => {
    setSelectedApp(app);
    setViewModalVisible(true);
  };

  const handleDelete = (app: JobApplication) => {
    const candidateName = getFullName(
      app.jobSeeker?.user?.firstName,
      app.jobSeeker?.user?.lastName,
      app.jobSeeker?.user?.email ?? 'Candidate',
    );

    const performDelete = () => {
      setDeletedAppIds((prev) => [...prev, app.id]);
      setLocalApplicants((prev) => prev.filter((a) => a.id !== app.id));
      Alert.alert('Deleted', `Application for ${candidateName} has been deleted.`);
    };

    if (Platform.OS === 'web') {
      const confirm1 = window.confirm(`Are you sure you want to delete application from "${candidateName}"?`);
      if (confirm1) {
        const confirm2 = window.confirm(
          `⚠️ FINAL CONFIRMATION:\nThis action is permanent and cannot be undone.\nAre you DOUBLE SURE you want to delete application from "${candidateName}"?`,
        );
        if (confirm2) {
          performDelete();
        }
      }
    } else {
      Alert.alert(
        'First Confirmation: Delete Application',
        `Are you sure you want to delete application from "${candidateName}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Next: Confirm Delete',
            style: 'destructive',
            onPress: () => {
              Alert.alert(
                '⚠️ Final Confirmation: Permanent Delete',
                `This action cannot be undone. Are you double sure you want to delete application from "${candidateName}"?`,
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

  const columns: ColumnDef<JobApplication>[] = useMemo(
    () => [
      {
        key: 'candidate',
        header: 'Candidate',
        width: 220,
        sortable: true,
        accessorKey: 'jobSeeker',
        cell: (row) => {
          const user = row.jobSeeker?.user;
          return (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Avatar
                uri={user?.avatar ?? undefined}
                firstName={user?.firstName ?? 'Applicant'}
                lastName={user?.lastName ?? ''}
                email={user?.email ?? ''}
                size="md"
              />
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#0F172A' }} numberOfLines={1}>
                  {getFullName(user?.firstName, user?.lastName, user?.fullName ?? 'Applicant')}
                </Text>
                <Text style={{ fontSize: 11, color: '#64748B' }} numberOfLines={1}>
                  {user?.email ?? 'Candidate'}
                </Text>
              </View>
            </View>
          );
        },
      },
      {
        key: 'job',
        header: 'Position Applied',
        width: 180,
        sortable: true,
        cell: (row) => (
          <TouchableOpacity onPress={() => router.push(`/jobs/${row.jobId}`)}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: COLORS.primary }} numberOfLines={1}>
              {truncate(row.job?.title ?? 'Position', 28)}
            </Text>
            <Text style={{ fontSize: 11, color: '#64748B' }}>
              {row.job?.company?.name ?? 'Company'}
            </Text>
          </TouchableOpacity>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        width: 130,
        sortable: true,
        accessorKey: 'status',
        filterable: true,
        filterOptions: [
          { label: 'Pending', value: 'PENDING' },
          { label: 'Shortlisted', value: 'SHORTLISTED' },
          { label: 'Interview', value: 'INTERVIEW' },
          { label: 'Hired', value: 'HIRED' },
          { label: 'Rejected', value: 'REJECTED' },
        ],
        cell: (row) => {
          const st = statusStyles[row.status] ?? statusStyles.PENDING;
          return (
            <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, backgroundColor: st.bg, alignSelf: 'flex-start' }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: st.text }}>
                {APPLICATION_STATUS_LABELS[row.status] ?? row.status}
              </Text>
            </View>
          );
        },
      },
      {
        key: 'appliedAt',
        header: 'Applied Date',
        width: 120,
        sortable: true,
        accessorKey: 'appliedAt',
        cell: (row) => (
          <Text style={{ fontSize: 12, color: '#64748B' }}>
            {formatDate(row.appliedAt, 'short')}
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
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: '700', color: '#0F172A' }}>
          Applicants Table
        </Text>
        <Text style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>
          Manage candidates with 3-dot dropdown actions menu, search, and sorting
        </Text>
      </View>

      <DataTable
        data={applicationsList}
        columns={columns}
        keyExtractor={(item) => item.id}
        searchPlaceholder="Search applicants by name, email, position, or status..."
        initialPageSize={5}
        isLoading={isLoading}
        emptyMessage="No applicant records found."
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
                Actions for {actionMenuApp?.jobSeeker?.user?.firstName ?? 'Candidate'}
              </Text>
              <TouchableOpacity onPress={() => setActionMenuVisible(false)}>
                <Ionicons name="close" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 6 }}>
              {/* View Details */}
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
                  if (actionMenuApp) handleView(actionMenuApp);
                }}
              >
                <View style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="eye-outline" size={15} color="#1D4ED8" />
                </View>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#1E293B' }}>View Details</Text>
              </TouchableOpacity>

              {/* Shortlist */}
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderRadius: 8,
                  backgroundColor: '#EFF6FF',
                }}
                onPress={() => {
                  setActionMenuVisible(false);
                  if (actionMenuApp) updateStatus.mutate({ id: actionMenuApp.id, status: 'SHORTLISTED' });
                }}
              >
                <View style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="star-outline" size={15} color="#1D4ED8" />
                </View>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#1D4ED8' }}>Shortlist Candidate</Text>
              </TouchableOpacity>

              {/* Schedule Interview */}
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderRadius: 8,
                  backgroundColor: '#F5F3FF',
                }}
                onPress={() => {
                  setActionMenuVisible(false);
                  if (actionMenuApp) updateStatus.mutate({ id: actionMenuApp.id, status: 'INTERVIEW' });
                }}
              >
                <View style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: '#EDE9FE', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="calendar-outline" size={15} color="#6D28D9" />
                </View>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#6D28D9' }}>Schedule Interview</Text>
              </TouchableOpacity>

              {/* Hire */}
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
                  if (actionMenuApp) updateStatus.mutate({ id: actionMenuApp.id, status: 'HIRED' });
                }}
              >
                <View style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="checkmark-circle-outline" size={15} color="#15803D" />
                </View>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#15803D' }}>Hire Candidate</Text>
              </TouchableOpacity>

              {/* Delete Application (Double Confirmation) */}
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
                  if (actionMenuApp) handleDelete(actionMenuApp);
                }}
              >
                <View style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="trash-outline" size={15} color="#DC2626" />
                </View>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#DC2626' }}>Delete Application</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ─── MODAL: VIEW APPLICATION DETAILS ───────────────────────────── */}
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
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#0F172A' }}>Application Details</Text>
              <TouchableOpacity onPress={() => setViewModalVisible(false)}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {selectedApp && (
              <View style={{ gap: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Avatar
                    uri={selectedApp.jobSeeker?.user?.avatar ?? undefined}
                    firstName={selectedApp.jobSeeker?.user?.firstName ?? 'C'}
                    lastName={selectedApp.jobSeeker?.user?.lastName ?? ''}
                    email={selectedApp.jobSeeker?.user?.email ?? ''}
                    size="lg"
                  />
                  <View>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#0F172A' }}>
                      {getFullName(selectedApp.jobSeeker?.user?.firstName, selectedApp.jobSeeker?.user?.lastName, 'Candidate')}
                    </Text>
                    <Text style={{ fontSize: 13, color: '#64748B' }}>{selectedApp.jobSeeker?.user?.email}</Text>
                  </View>
                </View>

                <View style={{ height: 1, backgroundColor: '#E2E8F0', marginVertical: 4 }} />

                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 13, color: '#64748B' }}>Position Applied:</Text>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#1D4ED8' }}>{selectedApp.job?.title ?? 'Position'}</Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 13, color: '#64748B' }}>Application Status:</Text>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#15803D' }}>{selectedApp.status}</Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 13, color: '#64748B' }}>Applied Date:</Text>
                  <Text style={{ fontSize: 13, color: '#334155' }}>{formatDate(selectedApp.appliedAt, 'long')}</Text>
                </View>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </Screen>
  );
}
