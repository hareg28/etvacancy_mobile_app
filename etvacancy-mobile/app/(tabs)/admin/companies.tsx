import { View, Text, TouchableOpacity, Alert, Platform, Modal, TextInput } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Screen } from '@components/ui/Screen';
import { Ionicons } from '@expo/vector-icons';
import { companies as companiesApi } from '@api/index';
import { COLORS } from '@constants/index';
import { formatDate, truncate } from '@utils/index';
import type { Company, PaginatedResponse } from '@/types/index';
import { DataTable, type ColumnDef } from '@components/ui/DataTable';

const MOCK_COMPANIES: Company[] = [
  {
    id: 'cmp_1',
    name: 'Ethio Telecom',
    slug: 'ethio-telecom',
    industry: 'Telecommunications',
    city: 'Addis Ababa',
    country: 'Ethiopia',
    size: '1000+',
    verificationStatus: 'VERIFIED',
    description: 'National telecommunications services provider in Ethiopia.',
    createdAt: '2024-01-10T08:00:00.000Z',
    updatedAt: '2024-01-10T08:00:00.000Z',
  },
  {
    id: 'cmp_2',
    name: 'Commercial Bank of Ethiopia',
    slug: 'cbe',
    industry: 'Banking & Financial',
    city: 'Addis Ababa',
    country: 'Ethiopia',
    size: '1000+',
    verificationStatus: 'VERIFIED',
    description: 'Largest commercial bank in Ethiopia.',
    createdAt: '2024-02-01T09:30:00.000Z',
    updatedAt: '2024-02-01T09:30:00.000Z',
  },
  {
    id: 'cmp_3',
    name: 'Awash Bank',
    slug: 'awash-bank',
    industry: 'Banking & Financial',
    city: 'Addis Ababa',
    country: 'Ethiopia',
    size: '500-1000',
    verificationStatus: 'VERIFIED',
    description: 'First private bank established in Ethiopia.',
    createdAt: '2024-03-05T11:00:00.000Z',
    updatedAt: '2024-03-05T11:00:00.000Z',
  },
  {
    id: 'cmp_4',
    name: 'Ethiopian Airlines',
    slug: 'ethiopian-airlines',
    industry: 'Aviation & Logistics',
    city: 'Addis Ababa',
    country: 'Ethiopia',
    size: '1000+',
    verificationStatus: 'VERIFIED',
    description: 'Ethiopias flag carrier airline.',
    createdAt: '2024-03-20T14:15:00.000Z',
    updatedAt: '2024-03-20T14:15:00.000Z',
  },
  {
    id: 'cmp_5',
    name: 'iCog Labs',
    slug: 'icog-labs',
    industry: 'Technology & AI',
    city: 'Addis Ababa',
    country: 'Ethiopia',
    size: '50-200',
    verificationStatus: 'PENDING',
    description: 'AI research and software development company.',
    createdAt: '2024-04-12T10:00:00.000Z',
    updatedAt: '2024-04-12T10:00:00.000Z',
  },
  {
    id: 'cmp_6',
    name: 'Safaricom Telecommunications Ethiopia',
    slug: 'safaricom-ethiopia',
    industry: 'Telecommunications',
    city: 'Addis Ababa',
    country: 'Ethiopia',
    size: '500-1000',
    verificationStatus: 'VERIFIED',
    description: 'Mobile network provider in Ethiopia.',
    createdAt: '2024-05-01T12:00:00.000Z',
    updatedAt: '2024-05-01T12:00:00.000Z',
  },
];

const statusBadgeStyles: Record<string, { bg: string; text: string }> = {
  VERIFIED: { bg: '#DCFCE7', text: '#15803D' },
  PENDING: { bg: '#FEF3C7', text: '#B45309' },
  UNVERIFIED: { bg: '#F1F5F9', text: '#475569' },
  REJECTED: { bg: '#FEE2E2', text: '#B91C1C' },
};

export default function AdminCompaniesScreen() {
  const queryClient = useQueryClient();

  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);

  const [actionMenuCompany, setActionMenuCompany] = useState<Company | null>(null);
  const [actionMenuVisible, setActionMenuVisible] = useState(false);

  const [editName, setEditName] = useState('');
  const [editIndustry, setEditIndustry] = useState('');
  const [editCity, setEditCity] = useState('');

  const [deletedCompanyIds, setDeletedCompanyIds] = useState<string[]>([]);
  const [localCompanies, setLocalCompanies] = useState<Company[]>(MOCK_COMPANIES);

  const { data, isLoading } = useQuery<PaginatedResponse<Company>>({
    queryKey: ['admin', 'companies'],
    queryFn: async () => {
      try {
        const res = await companiesApi.list({ limit: 100 });
        if (res && res.data && res.data.length > 0) return res;
      } catch {
        // fallback
      }
      return {
        data: localCompanies,
        total: localCompanies.length,
        page: 1,
        limit: 100,
        totalPages: 1,
        hasMore: false,
      };
    },
  });

  const verifyMutation = useMutation({
    mutationFn: (id: string) => companiesApi.verify(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'companies'] });
      Alert.alert('Success', 'Company has been verified!');
    },
  });

  const companiesList = useMemo(() => {
    const rawList = data?.data && data.data.length > 0 ? data.data : localCompanies;
    return rawList.filter((c) => !deletedCompanyIds.includes(c.id));
  }, [data, localCompanies, deletedCompanyIds]);

  const openActionsMenu = (company: Company) => {
    setActionMenuCompany(company);
    setActionMenuVisible(true);
  };

  const handleView = (company: Company) => {
    setSelectedCompany(company);
    setViewModalVisible(true);
  };

  const handleEdit = (company: Company) => {
    setSelectedCompany(company);
    setEditName(company.name);
    setEditIndustry(company.industry ?? '');
    setEditCity(company.city ?? '');
    setEditModalVisible(true);
  };

  const handleSaveEdit = () => {
    if (!selectedCompany) return;
    const updated = {
      ...selectedCompany,
      name: editName,
      industry: editIndustry,
      city: editCity,
    };
    setLocalCompanies((prev) => prev.map((c) => (c.id === selectedCompany.id ? updated : c)));
    setEditModalVisible(false);
    Alert.alert('Success', 'Company details updated.');
  };

  const handleDelete = (company: Company) => {
    const performDelete = () => {
      setDeletedCompanyIds((prev) => [...prev, company.id]);
      setLocalCompanies((prev) => prev.filter((c) => c.id !== company.id));
      Alert.alert('Deleted', `${company.name} has been deleted.`);
    };

    if (Platform.OS === 'web') {
      const confirm1 = window.confirm(`Are you sure you want to delete company "${company.name}"?`);
      if (confirm1) {
        const confirm2 = window.confirm(
          `⚠️ FINAL CONFIRMATION:\nThis action is permanent and cannot be undone.\nAre you DOUBLE SURE you want to delete "${company.name}"?`,
        );
        if (confirm2) {
          performDelete();
        }
      }
    } else {
      Alert.alert(
        'First Confirmation: Delete Company',
        `Are you sure you want to delete company "${company.name}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Next: Confirm Delete',
            style: 'destructive',
            onPress: () => {
              Alert.alert(
                '⚠️ Final Confirmation: Permanent Delete',
                `This action cannot be undone. Are you double sure you want to delete "${company.name}"?`,
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

  const columns: ColumnDef<Company>[] = useMemo(
    () => [
      {
        key: 'name',
        header: 'Company Name',
        width: 220,
        sortable: true,
        accessorKey: 'name',
        cell: (row) => (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                backgroundColor: '#EFF6FF',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 10,
              }}
            >
              <Ionicons name="business" size={18} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{ fontSize: 13, fontWeight: '700', color: '#0F172A' }}
                numberOfLines={1}
              >
                {truncate(row.name, 30)}
              </Text>
              <Text style={{ fontSize: 11, color: '#64748B' }} numberOfLines={1}>
                {row.city ?? 'Ethiopia'} • {row.size ?? '10-50'}
              </Text>
            </View>
          </View>
        ),
      },
      {
        key: 'industry',
        header: 'Industry',
        width: 140,
        sortable: true,
        accessorKey: 'industry',
        cell: (row) => (
          <Text style={{ fontSize: 12, color: '#334155', fontWeight: '500' }}>
            {row.industry ?? 'Technology'}
          </Text>
        ),
      },
      {
        key: 'status',
        header: 'Verification',
        width: 130,
        sortable: true,
        accessorKey: 'verificationStatus',
        filterable: true,
        filterOptions: [
          { label: 'Verified', value: 'VERIFIED' },
          { label: 'Pending', value: 'PENDING' },
          { label: 'Unverified', value: 'UNVERIFIED' },
          { label: 'Rejected', value: 'REJECTED' },
        ],
        cell: (row) => {
          const st = statusBadgeStyles[row.verificationStatus] ?? statusBadgeStyles.UNVERIFIED;
          return (
            <View
              style={{
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 12,
                backgroundColor: st.bg,
                alignSelf: 'flex-start',
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: '700', color: st.text }}>
                {row.verificationStatus}
              </Text>
            </View>
          );
        },
      },
      {
        key: 'createdAt',
        header: 'Registered',
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
    [],
  );

  return (
    <Screen scrollable>
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: '700', color: '#0F172A' }}>
          Company Management
        </Text>
        <Text style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>
          Manage employer profiles, verification, and actions with 3-dot dropdown
        </Text>
      </View>

      <DataTable
        data={companiesList}
        columns={columns}
        keyExtractor={(item) => item.id}
        searchPlaceholder="Search companies by name, industry, or city..."
        initialPageSize={5}
        isLoading={isLoading}
        emptyMessage="No companies found."
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
                Actions for {actionMenuCompany?.name}
              </Text>
              <TouchableOpacity onPress={() => setActionMenuVisible(false)}>
                <Ionicons name="close" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 6 }}>
              {/* View Company Details */}
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
                  if (actionMenuCompany) handleView(actionMenuCompany);
                }}
              >
                <View style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="eye-outline" size={15} color="#1D4ED8" />
                </View>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#1E293B' }}>View Details</Text>
              </TouchableOpacity>

              {/* Edit Company */}
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
                  if (actionMenuCompany) handleEdit(actionMenuCompany);
                }}
              >
                <View style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="create-outline" size={15} color="#B45309" />
                </View>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#1E293B' }}>Edit Company</Text>
              </TouchableOpacity>

              {/* Verify Company */}
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
                  if (actionMenuCompany) {
                    verifyMutation.mutate(actionMenuCompany.id);
                  }
                }}
              >
                <View style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="checkmark-circle-outline" size={15} color="#15803D" />
                </View>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#15803D' }}>
                  {actionMenuCompany?.verificationStatus === 'VERIFIED' ? 'Re-Verify Company' : 'Verify Company'}
                </Text>
              </TouchableOpacity>

              {/* Delete Company (Double Confirmation) */}
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
                  if (actionMenuCompany) handleDelete(actionMenuCompany);
                }}
              >
                <View style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="trash-outline" size={15} color="#DC2626" />
                </View>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#DC2626' }}>Delete Company</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ─── MODAL: VIEW COMPANY DETAILS ────────────────────────────────── */}
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
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#0F172A' }}>Company Details</Text>
              <TouchableOpacity onPress={() => setViewModalVisible(false)}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {selectedCompany && (
              <View style={{ gap: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="business" size={22} color={COLORS.primary} />
                  </View>
                  <View>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#0F172A' }}>{selectedCompany.name}</Text>
                    <Text style={{ fontSize: 13, color: '#64748B' }}>{selectedCompany.industry}</Text>
                  </View>
                </View>

                <View style={{ height: 1, backgroundColor: '#E2E8F0', marginVertical: 4 }} />

                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 13, color: '#64748B' }}>Location:</Text>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#0F172A' }}>{selectedCompany.city}, Ethiopia</Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 13, color: '#64748B' }}>Company Size:</Text>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#0F172A' }}>{selectedCompany.size ?? '10-50'}</Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 13, color: '#64748B' }}>Verification:</Text>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: selectedCompany.verificationStatus === 'VERIFIED' ? '#15803D' : '#B45309' }}>
                    {selectedCompany.verificationStatus}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ─── MODAL: EDIT COMPANY ────────────────────────────────────────── */}
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
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#0F172A' }}>Edit Company</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 14 }}>
              <View>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6 }}>Company Name</Text>
                <TextInput
                  style={{ borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#0F172A' }}
                  value={editName}
                  onChangeText={setEditName}
                />
              </View>

              <View>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6 }}>Industry</Text>
                <TextInput
                  style={{ borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#0F172A' }}
                  value={editIndustry}
                  onChangeText={setEditIndustry}
                />
              </View>

              <View>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6 }}>City</Text>
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
    </Screen>
  );
}
