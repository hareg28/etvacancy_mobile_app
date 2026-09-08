import { View, Text, TouchableOpacity, Alert, Platform, Modal, TextInput } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Screen } from '@components/ui/Screen';
import { Avatar } from '@components/ui/Avatar';
import { Ionicons } from '@expo/vector-icons';
import { users as usersApi } from '@api/index';
import { ROLE_LABELS } from '@constants/index';
import { getFullName, formatDate } from '@utils/index';
import type { User, PaginatedResponse } from '@/types/index';
import { DataTable, type ColumnDef } from '@components/ui/DataTable';
import { useAuthStore } from '@store/index';

export default function AdminUsersScreen() {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const storeRegisteredUsers = useAuthStore((s) => s.registeredUsers ?? []);

  // Modals for View & Edit
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);

  // Actions Dropdown Menu state
  const [actionMenuUser, setActionMenuUser] = useState<User | null>(null);
  const [actionMenuVisible, setActionMenuVisible] = useState(false);

  // Edit form state
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editRole, setEditRole] = useState<'JOB_SEEKER' | 'EMPLOYER' | 'ADMIN'>('JOB_SEEKER');

  // Deleted IDs in local session state
  const [deletedUserIds, setDeletedUserIds] = useState<string[]>([]);

  const { data, isLoading } = useQuery<PaginatedResponse<User>>({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      try {
        const res = await usersApi.list({ limit: 100 });
        if (res && res.data && res.data.length > 0) return res;
      } catch {
        // fallback to store registered users
      }
      return {
        data: storeRegisteredUsers,
        total: storeRegisteredUsers.length,
        page: 1,
        limit: 100,
        totalPages: 1,
        hasMore: false,
      };
    },
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => usersApi.activate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => usersApi.deactivate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });

  const usersList = useMemo(() => {
    const rawList = data?.data && data.data.length > 0 ? data.data : storeRegisteredUsers;
    const combined = currentUser
      ? rawList.some((u) => u.email.toLowerCase() === currentUser.email.toLowerCase())
        ? rawList
        : [currentUser, ...rawList]
      : rawList;
    return combined.filter((u) => !deletedUserIds.includes(u.id));
  }, [data, storeRegisteredUsers, currentUser, deletedUserIds]);

  // Open Actions Dropdown Menu
  const openActionsMenu = (user: User) => {
    setActionMenuUser(user);
    setActionMenuVisible(true);
  };

  // Handle View
  const handleView = (user: User) => {
    setSelectedUser(user);
    setViewModalVisible(true);
  };

  // Handle Edit
  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setEditFirstName(user.firstName ?? '');
    setEditLastName(user.lastName ?? '');
    setEditRole(user.role as any);
    setEditModalVisible(true);
  };

  // Save Edit
  const handleSaveEdit = () => {
    if (!selectedUser) return;
    const updated = {
      ...selectedUser,
      firstName: editFirstName,
      lastName: editLastName,
      role: editRole,
    };
    useAuthStore.setState((s) => ({
      registeredUsers: s.registeredUsers.map((u) => (u.id === selectedUser.id ? updated : u)),
      user: s.user?.id === selectedUser.id ? updated : s.user,
    }));
    setEditModalVisible(false);
    Alert.alert('Success', 'User details updated successfully.');
  };

  // Double Confirmation Delete
  const handleDelete = (user: User) => {
    const userName = getFullName(user.firstName, user.lastName, user.email);

    const performDelete = () => {
      setDeletedUserIds((prev) => [...prev, user.id]);
      useAuthStore.setState((s) => ({
        registeredUsers: s.registeredUsers.filter((u) => u.id !== user.id),
      }));
      Alert.alert('Deleted', `${userName} has been deleted.`);
    };

    if (Platform.OS === 'web') {
      const confirm1 = window.confirm(`Are you sure you want to delete user "${userName}"?`);
      if (confirm1) {
        const confirm2 = window.confirm(
          `⚠️ FINAL CONFIRMATION:\nThis action is permanent and cannot be undone.\nAre you DOUBLE SURE you want to delete "${userName}"?`,
        );
        if (confirm2) {
          performDelete();
        }
      }
    } else {
      Alert.alert(
        'First Confirmation: Delete User',
        `Are you sure you want to delete user "${userName}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Next: Confirm Delete',
            style: 'destructive',
            onPress: () => {
              Alert.alert(
                '⚠️ Final Confirmation: Permanent Delete',
                `This action cannot be undone. Are you double sure you want to delete "${userName}"?`,
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

  const columns: ColumnDef<User>[] = useMemo(
    () => [
      {
        key: 'user',
        header: 'User',
        width: 240,
        sortable: true,
        accessorKey: 'firstName',
        cell: (row) => (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Avatar
              uri={row.avatar ?? undefined}
              firstName={row.firstName ?? row.email.split('@')[0]}
              lastName={row.lastName ?? ''}
              email={row.email}
              size="md"
            />
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text
                style={{ fontSize: 13, fontWeight: '700', color: '#0F172A' }}
                numberOfLines={1}
              >
                {getFullName(row.firstName, row.lastName, row.fullName)}
              </Text>
              <Text style={{ fontSize: 11, color: '#64748B' }} numberOfLines={1}>
                {row.email}
              </Text>
            </View>
          </View>
        ),
      },
      {
        key: 'role',
        header: 'Role',
        width: 130,
        sortable: true,
        accessorKey: 'role',
        filterable: true,
        filterOptions: [
          { label: 'Job Seeker', value: 'JOB_SEEKER' },
          { label: 'Employer', value: 'EMPLOYER' },
          { label: 'Admin', value: 'ADMIN' },
        ],
        cell: (row) => {
          const isAppAdmin = row.role === 'ADMIN';
          const isEmp = row.role === 'EMPLOYER';
          return (
            <View
              style={{
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 12,
                backgroundColor: isAppAdmin ? '#EDE9FE' : isEmp ? '#DBEAFE' : '#D1FAE5',
                alignSelf: 'flex-start',
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  color: isAppAdmin ? '#6D28D9' : isEmp ? '#1D4ED8' : '#065F46',
                }}
              >
                {ROLE_LABELS[row.role as keyof typeof ROLE_LABELS] ?? row.role}
              </Text>
            </View>
          );
        },
      },
      {
        key: 'status',
        header: 'Status',
        width: 110,
        sortable: true,
        accessorKey: 'isActive',
        filterable: true,
        filterOptions: [
          { label: 'Active', value: 'true' },
          { label: 'Inactive', value: 'false' },
        ],
        cell: (row) => (
          <TouchableOpacity
            onPress={() => {
              if (row.isActive !== false) {
                deactivateMutation.mutate(row.id);
              } else {
                activateMutation.mutate(row.id);
              }
            }}
            style={{
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 12,
              backgroundColor: row.isActive !== false ? '#DCFCE7' : '#FEE2E2',
              alignSelf: 'flex-start',
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: '700',
                color: row.isActive !== false ? '#15803D' : '#B91C1C',
              }}
            >
              {row.isActive !== false ? 'Active' : 'Inactive'}
            </Text>
          </TouchableOpacity>
        ),
      },
      {
        key: 'createdAt',
        header: 'Joined Date',
        width: 120,
        sortable: true,
        accessorKey: 'createdAt',
        cell: (row) => (
          <Text style={{ fontSize: 12, color: '#475569' }}>
            {formatDate(row.createdAt ?? new Date().toISOString(), 'short')}
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
    [deactivateMutation, activateMutation],
  );

  return (
    <Screen scrollable>
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: '700', color: '#0F172A' }}>
          User Management
        </Text>
        <Text style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>
          Manage user accounts with Actions dropdown, search, and sorting
        </Text>
      </View>

      <DataTable
        data={usersList}
        columns={columns}
        keyExtractor={(item) => item.id}
        searchPlaceholder="Search users by name, email, or role..."
        initialPageSize={5}
        isLoading={isLoading}
        emptyMessage="No registered users found."
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
                Actions for {actionMenuUser?.firstName ?? actionMenuUser?.email}
              </Text>
              <TouchableOpacity onPress={() => setActionMenuVisible(false)}>
                <Ionicons name="close" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 6 }}>
              {/* View Details Option */}
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
                  if (actionMenuUser) handleView(actionMenuUser);
                }}
              >
                <View style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="eye-outline" size={15} color="#1D4ED8" />
                </View>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#1E293B' }}>View Details</Text>
              </TouchableOpacity>

              {/* Edit User Option */}
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
                  if (actionMenuUser) handleEdit(actionMenuUser);
                }}
              >
                <View style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="create-outline" size={15} color="#B45309" />
                </View>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#1E293B' }}>Edit User</Text>
              </TouchableOpacity>

              {/* Delete User Option (Double Confirmation) */}
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
                  if (actionMenuUser) handleDelete(actionMenuUser);
                }}
              >
                <View style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="trash-outline" size={15} color="#DC2626" />
                </View>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#DC2626' }}>Delete User</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ─── MODAL: VIEW USER DETAILS ───────────────────────────────────── */}
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
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#0F172A' }}>User Details</Text>
              <TouchableOpacity onPress={() => setViewModalVisible(false)}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {selectedUser && (
              <View style={{ gap: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Avatar
                    uri={selectedUser.avatar ?? undefined}
                    firstName={selectedUser.firstName ?? 'U'}
                    lastName={selectedUser.lastName ?? ''}
                    email={selectedUser.email}
                    size="lg"
                  />
                  <View>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#0F172A' }}>
                      {getFullName(selectedUser.firstName, selectedUser.lastName, selectedUser.fullName)}
                    </Text>
                    <Text style={{ fontSize: 13, color: '#64748B' }}>{selectedUser.email}</Text>
                  </View>
                </View>

                <View style={{ height: 1, backgroundColor: '#E2E8F0', marginVertical: 4 }} />

                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 13, color: '#64748B' }}>User ID:</Text>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#0F172A' }}>{selectedUser.id}</Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 13, color: '#64748B' }}>Role:</Text>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#1D4ED8' }}>{selectedUser.role}</Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 13, color: '#64748B' }}>Status:</Text>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: selectedUser.isActive !== false ? '#16A34A' : '#DC2626' }}>
                    {selectedUser.isActive !== false ? 'Active' : 'Inactive'}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 13, color: '#64748B' }}>Joined Date:</Text>
                  <Text style={{ fontSize: 13, color: '#334155' }}>
                    {formatDate(selectedUser.createdAt ?? new Date().toISOString(), 'long')}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ─── MODAL: EDIT USER ───────────────────────────────────────────── */}
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
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#0F172A' }}>Edit User</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 14 }}>
              <View>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6 }}>First Name</Text>
                <TextInput
                  style={{ borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#0F172A' }}
                  value={editFirstName}
                  onChangeText={setEditFirstName}
                />
              </View>

              <View>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6 }}>Last Name</Text>
                <TextInput
                  style={{ borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#0F172A' }}
                  value={editLastName}
                  onChangeText={setEditLastName}
                />
              </View>

              <View>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6 }}>Role</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {(['JOB_SEEKER', 'EMPLOYER', 'ADMIN'] as const).map((r) => (
                    <TouchableOpacity
                      key={r}
                      style={{
                        flex: 1,
                        paddingVertical: 8,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: editRole === r ? '#1D4ED8' : '#CBD5E1',
                        backgroundColor: editRole === r ? '#EFF6FF' : '#F8FAFC',
                        alignItems: 'center',
                      }}
                      onPress={() => setEditRole(r)}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '700', color: editRole === r ? '#1D4ED8' : '#475569' }}>
                        {r === 'JOB_SEEKER' ? 'Seeker' : r === 'EMPLOYER' ? 'Employer' : 'Admin'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
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
