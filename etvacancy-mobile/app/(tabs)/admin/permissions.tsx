import { View, Text, FlatList, RefreshControl, Alert, TouchableOpacity } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { Screen } from '@components/ui/Screen';
import { Card, CardHeader } from '@components/ui/Card';
import { Divider } from '@components/ui/Divider';
import Button from '@components/ui/Button';
import { Ionicons } from '@expo/vector-icons';
import { admin as adminApi } from '@api/index';
import { COLORS, ROLE_LABELS } from '@constants/index';
import type { Permission, UserRole } from '@/types/index';
import { abacRules, getAbilitiesForRole } from '@lib/abac';

const ROLES: Exclude<UserRole, 'PUBLIC'>[] = ['JOB_SEEKER', 'EMPLOYER', 'ADMIN'];

export default function AdminPermissionsScreen() {
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<UserRole>('JOB_SEEKER');
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, refetch } = useQuery<Permission[]>({
    queryKey: ['admin', 'permissions'],
    queryFn: () => adminApi.permissions.list(),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => adminApi.permissions.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'permissions'] }),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const customPermissions = data ?? [];
  const roleRules = selectedRole === 'PUBLIC' ? [] : getAbilitiesForRole(selectedRole);

  const totalActions = roleRules.length;

  const subjectSummary = roleRules.reduce<Record<string, { read: number; write: number; special: number }>>((acc, r) => {
    const bucket = acc[r.subject] ?? { read: 0, write: 0, special: 0 };
    if (r.action === 'read' || r.action === 'list') bucket.read += 1;
    else if (r.action === 'create' || r.action === 'update' || r.action === 'delete') bucket.write += 1;
    else bucket.special += 1;
    acc[r.subject] = bucket;
    return acc;
  }, {});

  const openCreate = () =>
    Alert.alert(
      'Create Permission',
      'Custom permission overrides can be added per-role in the web admin panel.',
      [{ text: 'OK' }],
    );

  return (
    <Screen scrollable={false}>
      <View className="mb-4 mt-2">
        <Text
          className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1"
          style={{ includeFontPadding: false }}
        >
          Permissions
        </Text>
        <Text
          className="text-sm text-gray-500 dark:text-gray-400"
          style={{ includeFontPadding: false }}
        >
          ABAC rules matrix: {abacRules.length} rules across all roles
        </Text>
      </View>

      <Card padding="md" className="mb-4">
        <CardHeader
          title="Select Role"
          subtitle="View effective permissions for each role"
        />
        <View className="flex-row flex-wrap gap-2 mt-2">
          {(['JOB_SEEKER', 'EMPLOYER', 'ADMIN'] as Exclude<UserRole, 'PUBLIC'>[]).map((role) => {
            const active = selectedRole === role;
            return (
              <TouchableOpacity
                key={role}
                activeOpacity={0.7}
                onPress={() => setSelectedRole(role)}
                className={`px-4 py-2 rounded-xl border ${
                  active
                    ? role === 'ADMIN'
                      ? 'bg-purple-700 border-purple-700'
                      : role === 'EMPLOYER'
                      ? 'bg-blue-700 border-blue-700'
                      : 'bg-primary-700 border-primary-700'
                    : 'bg-transparent border-gray-200 dark:border-neutral-700'
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    active ? 'text-white' : 'text-gray-700 dark:text-gray-300'
                  }`}
                  style={{ includeFontPadding: false }}
                >
                  {ROLE_LABELS[role]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Divider className="my-4" />
        <View className="flex-row gap-3 flex-wrap">
          <View className="flex-1 min-w-[30%] p-3 rounded-xl bg-primary-50 dark:bg-primary-900/30 border border-primary-100 dark:border-primary-900/50">
            <Text
              className="text-xl font-bold text-primary-700 dark:text-primary-400 mb-0.5"
              style={{ includeFontPadding: false }}
            >
              {totalActions}
            </Text>
            <Text
              className="text-[10px] text-primary-700/80 dark:text-primary-400/80"
              style={{ includeFontPadding: false }}
            >
              Rules
            </Text>
          </View>
          <View className="flex-1 min-w-[30%] p-3 rounded-xl bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-900/50">
            <Text
              className="text-xl font-bold text-blue-700 dark:text-blue-400 mb-0.5"
              style={{ includeFontPadding: false }}
            >
              {Object.keys(subjectSummary).length}
            </Text>
            <Text
              className="text-[10px] text-blue-700/80 dark:text-blue-400/80"
              style={{ includeFontPadding: false }}
            >
              Subjects
            </Text>
          </View>
          <View className="flex-1 min-w-[30%] p-3 rounded-xl bg-green-50 dark:bg-green-900/30 border border-green-100 dark:border-green-900/50">
            <Text
              className="text-xl font-bold text-green-700 dark:text-green-400 mb-0.5"
              style={{ includeFontPadding: false }}
            >
              {selectedRole === 'ADMIN' ? '∞' : customPermissions.length}
            </Text>
            <Text
              className="text-[10px] text-green-700/80 dark:text-green-400/80"
              style={{ includeFontPadding: false }}
            >
              Overrides
            </Text>
          </View>
        </View>
      </Card>

      <Card padding="md" className="mb-4">
        <CardHeader
          title={`${ROLE_LABELS[selectedRole]} Capabilities`}
          subtitle="Subject-level permission summary"
          right={
            <Button
              title="Add"
              variant="outline"
              size="sm"
              leftIcon="add-outline"
              onPress={openCreate}
            />
          }
        />
        <FlatList
          scrollEnabled={false}
          data={Object.entries(subjectSummary)}
          keyExtractor={(entry) => entry[0]}
          renderItem={({ item }) => {
            const [subject, caps] = item;
            return (
              <View className="flex-row items-center py-2 border-b border-gray-100 dark:border-neutral-800 last:border-b-0">
                <Text
                  className="text-sm font-semibold text-gray-900 dark:text-gray-100 w-40"
                  style={{ includeFontPadding: false }}
                >
                  {subject}
                </Text>
                <View className="flex-row items-center gap-3 flex-1 flex-wrap">
                  <View className="flex-row items-center">
                    <Ionicons
                      name={caps.read > 0 ? 'eye' : 'eye-outline'}
                      size={14}
                      color={caps.read > 0 ? COLORS.success : '#94A3B8'}
                    />
                    <Text
                      className={`text-[10px] ml-1 ${
                        caps.read > 0
                          ? 'text-green-700 dark:text-green-400'
                          : 'text-gray-400 dark:text-gray-500'
                      }`}
                      style={{ includeFontPadding: false }}
                    >
                      Read
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <Ionicons
                      name={caps.write > 0 ? 'create' : 'create-outline'}
                      size={14}
                      color={caps.write > 0 ? COLORS.primary : '#94A3B8'}
                    />
                    <Text
                      className={`text-[10px] ml-1 ${
                        caps.write > 0
                          ? 'text-primary-700 dark:text-primary-400'
                          : 'text-gray-400 dark:text-gray-500'
                      }`}
                      style={{ includeFontPadding: false }}
                    >
                      Write
                    </Text>
                  </View>
                  {caps.special > 0 && (
                    <View className="flex-row items-center">
                      <Ionicons name="sparkles" size={14} color="#9333EA" />
                      <Text
                        className="text-[10px] ml-1 text-purple-700 dark:text-purple-400"
                        style={{ includeFontPadding: false }}
                      >
                        +{caps.special} actions
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            );
          }}
        />
      </Card>

      <Card padding="md" className="mb-4">
        <CardHeader
          title="All Rules"
          subtitle={`${roleRules.length} ABAC rules effective for ${ROLE_LABELS[selectedRole]}`}
        />
        <FlatList
          scrollEnabled={false}
          data={roleRules}
          keyExtractor={(_r, idx) => `${selectedRole}-rule-${idx}`}
          refreshControl={
            <RefreshControl
              refreshing={refreshing || isLoading}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
            />
          }
          renderItem={({ item: rule }) => {
            const hasConditions = (rule.conditions?.length ?? 0) > 0;
            return (
              <View className="py-2.5 border-b border-gray-100 dark:border-neutral-800 last:border-b-0">
                <View className="flex-row items-center flex-wrap">
                  <View
                    className="px-2 py-0.5 rounded-md mr-2 mb-1"
                    style={{
                      backgroundColor:
                        rule.inverted ? COLORS.danger + '15' : COLORS.primary + '15',
                    }}
                  >
                    <Text
                      className="text-[10px] font-bold uppercase tracking-wider"
                      style={{
                        color: rule.inverted ? COLORS.danger : COLORS.primary,
                        includeFontPadding: false,
                      }}
                    >
                      {rule.inverted ? 'DENY' : 'ALLOW'}
                    </Text>
                  </View>
                  <Text
                    className="text-sm font-bold text-gray-900 dark:text-gray-100 mr-2"
                    style={{ includeFontPadding: false }}
                  >
                    {rule.action.toUpperCase()}
                  </Text>
                  <Text
                    className="text-xs text-gray-500 dark:text-gray-400"
                    style={{ includeFontPadding: false }}
                  >
                    on {rule.subject}
                  </Text>
                  {hasConditions && (
                    <View className="w-full mt-2">
                      {rule.conditions?.map((cond, idx) => (
                        <View
                          key={idx}
                          className="flex-row items-center bg-gray-50 dark:bg-neutral-800 rounded-lg px-2.5 py-1.5 mb-1.5"
                        >
                          <Ionicons
                            name="filter-outline"
                            size={12}
                            color="#64748B"
                            style={{ marginRight: 6 }}
                          />
                          <Text
                            className="text-[11px] text-gray-700 dark:text-gray-300"
                            style={{ includeFontPadding: false }}
                          >
                            where <Text className="font-semibold">{cond.field}</Text>{' '}
                            <Text className="text-primary-700 dark:text-primary-400">
                              {cond.operator}
                            </Text>{' '}
                            <Text className="font-semibold">
                              {typeof cond.value === 'string'
                                ? cond.value
                                : Array.isArray(cond.value)
                                ? cond.value.join(', ')
                                : JSON.stringify(cond.value)}
                            </Text>
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            );
          }}
        />
      </Card>

      {customPermissions.length > 0 && (
        <Card padding="md" className="mb-4">
          <CardHeader title="Custom Overrides" subtitle="Fine-grained permission exceptions" />
          <FlatList
            scrollEnabled={false}
            data={customPermissions}
            keyExtractor={(p) => p.id}
            renderItem={({ item }) => (
              <View className="py-2 border-b border-gray-100 dark:border-neutral-800 last:border-b-0">
                <View className="flex-row justify-between items-start">
                  <View className="flex-1">
                    <View className="flex-row items-center">
                      <Text
                        className="text-sm font-bold text-gray-900 dark:text-gray-100 mr-2"
                        style={{ includeFontPadding: false }}
                      >
                        {item.action}
                      </Text>
                      <Text
                        className="text-xs text-gray-500 dark:text-gray-400"
                        style={{ includeFontPadding: false }}
                      >
                        / {item.subject}
                      </Text>
                      {item.inverted && (
                        <View className="ml-2 px-1.5 py-0.5 rounded bg-red-50 dark:bg-red-900/20">
                          <Text
                            className="text-[9px] font-bold text-red-700 dark:text-red-400"
                            style={{ includeFontPadding: false }}
                          >
                            INVERTED
                          </Text>
                        </View>
                      )}
                    </View>
                    {item.reason && (
                      <Text
                        className="text-[11px] text-gray-500 dark:text-gray-400 mt-1"
                        style={{ includeFontPadding: false }}
                      >
                        {item.reason}
                      </Text>
                    )}
                  </View>
                  <Button
                    title=""
                    variant="ghost"
                    size="sm"
                    leftIcon="trash-outline"
                    onPress={() =>
                      Alert.alert(
                        'Remove Override',
                        'Delete this custom permission override?',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Delete',
                            style: 'destructive',
                            onPress: () => removeMutation.mutate(item.id),
                          },
                        ],
                      )
                    }
                  />
                </View>
              </View>
            )}
          />
        </Card>
      )}
    </Screen>
  );
}
