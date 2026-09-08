import { View, Text, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { Screen } from '@components/ui/Screen';
import { Card, CardHeader } from '@components/ui/Card';
import { Divider } from '@components/ui/Divider';
import Button from '@components/ui/Button';
import { Avatar } from '@components/ui/Avatar';
import { Ionicons } from '@expo/vector-icons';
import { applications as applicationsApi } from '@api/index';
import { useAuthStore, selectIsAuthenticated } from '@store/index';
import { COLORS, APPLICATION_STATUS_LABELS } from '@constants/index';
import { formatDate, getFullName } from '@utils/index';
import type { JobApplication, PaginatedResponse, ApplicationStatus } from '@/types/index';
import { Image } from 'expo-image';

const STATUS_TABS: (ApplicationStatus | 'ALL')[] = [
  'ALL',
  'PENDING',
  'SHORTLISTED',
  'INTERVIEW',
  'HIRED',
  'REJECTED',
  'WITHDRAWN',
];

export default function SeekerApplicationsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const user = useAuthStore((s) => s.user);
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_TABS)[number]>('ALL');
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, refetch } = useQuery<PaginatedResponse<JobApplication>>({
    queryKey: ['applications', 'my', statusFilter],
    queryFn: () =>
      applicationsApi.list({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        limit: 50,
      }),
    enabled: isAuthenticated && !!user,
  });

  const withdrawMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      applicationsApi.withdraw(id, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['applications'] }),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const applications = data?.data ?? [];

  const statusMeta = (s: ApplicationStatus) => APPLICATION_STATUS_LABELS[s] ?? { label: s, color: 'info' };

  const colorFor = (c: string) =>
    c === 'success'
      ? { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400' }
      : c === 'danger'
      ? { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400' }
      : c === 'warning'
      ? { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400' }
      : c === 'primary'
      ? { bg: 'bg-primary-100 dark:bg-primary-900/30', text: 'text-primary-700 dark:text-primary-400' }
      : { bg: 'bg-gray-100 dark:bg-neutral-700', text: 'text-gray-700 dark:text-gray-300' };

  if (!isAuthenticated) {
    return (
      <Screen scrollable padded>
        <View className="items-center py-20">
          <View className="w-24 h-24 rounded-full bg-primary-50 dark:bg-primary-900/20 items-center justify-center mb-6">
            <Ionicons name="paper-plane-outline" size={48} color={COLORS.primary} />
          </View>
          <Text
            className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 text-center"
            style={{ includeFontPadding: false }}
          >
            Sign in to view applications
          </Text>
          <Text
            className="text-sm text-gray-500 dark:text-gray-400 text-center px-8 mb-6"
            style={{ includeFontPadding: false }}
          >
            Keep track of every job you&apos;ve applied to and their status in one place.
          </Text>
          <Button
            title="Sign In"
            variant="primary"
            size="md"
            onPress={() => router.push('/(auth)/login')}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scrollable={false}>
      <View className="mb-4 mt-2">
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.back()}
          className="flex-row items-center mb-3"
        >
          <Ionicons name="arrow-back" size={20} color="#111827" style={{ marginRight: 8 }} />
          <Text
            className="text-sm font-semibold text-gray-700 dark:text-gray-300"
            style={{ includeFontPadding: false }}
          >
            Back
          </Text>
        </TouchableOpacity>
        <Text
          className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1"
          style={{ includeFontPadding: false }}
        >
          My Applications
        </Text>
        <Text
          className="text-sm text-gray-500 dark:text-gray-400"
          style={{ includeFontPadding: false }}
        >
          {data?.total ?? 0} total applications
        </Text>
      </View>

      <Card padding="md" className="mb-4">
        <CardHeader title="Filter by Status" />
        <FlatList
          horizontal
          data={STATUS_TABS}
          keyExtractor={(s) => s}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => {
            const active = statusFilter === item;
            const label =
              item === 'ALL'
                ? 'All'
                : APPLICATION_STATUS_LABELS[item]?.label ?? item.replace(/_/g, ' ');
            return (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setStatusFilter(item)}
                className={`px-3 py-2 rounded-xl mr-2 border ${
                  active
                    ? 'bg-primary-700 border-primary-700'
                    : 'bg-transparent border-gray-200 dark:border-neutral-700'
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    active ? 'text-white' : 'text-gray-700 dark:text-gray-300'
                  }`}
                  style={{ includeFontPadding: false }}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </Card>

      <FlatList
        data={applications}
        keyExtractor={(a) => a.id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || isLoading}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <Card padding="lg" variant="outlined">
            <View className="items-center py-12">
              <View className="w-20 h-20 rounded-full bg-gray-100 dark:bg-neutral-800 items-center justify-center mb-4">
                <Ionicons name="mail-open-outline" size={36} color="#94A3B8" />
              </View>
              <Text
                className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1 text-center"
                style={{ includeFontPadding: false }}
              >
                No applications yet
              </Text>
              <Text
                className="text-sm text-gray-500 dark:text-gray-400 text-center px-6 mb-4"
                style={{ includeFontPadding: false }}
              >
                {statusFilter === 'ALL'
                  ? 'You haven\u2019t applied to any jobs yet. Start exploring open roles today!'
                  : `No applications match status \u201C${
                      APPLICATION_STATUS_LABELS[statusFilter as ApplicationStatus]?.label ??
                      statusFilter
                    }\u201D.`}
              </Text>
              <Button
                title="Browse Jobs"
                variant="primary"
                size="sm"
                leftIcon="search-outline"
                onPress={() => router.push('/jobs')}
              />
            </View>
          </Card>
        }
        renderItem={({ item }) => {
          const job = item.job;
          const company = job?.company;
          const meta = statusMeta(item.status);
          const cc = colorFor(meta.color);
          const canWithdraw =
            item.status === 'PENDING' ||
            item.status === 'REVIEWED' ||
            item.status === 'SHORTLISTED';
          return (
            <Card padding="md" className="mb-3">
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => router.push(`/applications/${item.id}`)}
              >
                <View className="flex-row items-start">
                  <View className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-900/30 border border-primary-100 dark:border-primary-900/50 items-center justify-center mr-3 overflow-hidden">
                    {company?.logo ? (
                      <Image
                        source={{ uri: company.logo }}
                        style={{ width: '100%', height: '100%' }}
                        contentFit="cover"
                      />
                    ) : (
                      <Ionicons name="briefcase" size={22} color={COLORS.primary} />
                    )}
                  </View>
                  <View className="flex-1">
                    <View className="flex-row justify-between items-start flex-wrap">
                      <View className="flex-1 min-w-[60%]">
                        <Text
                          className="text-base font-bold text-gray-900 dark:text-gray-100 mb-0.5"
                          style={{ includeFontPadding: false }}
                        >
                          {job?.title ?? 'Job'}
                        </Text>
                        <Text
                          className="text-xs text-gray-500 dark:text-gray-400 mb-1.5"
                          style={{ includeFontPadding: false }}
                        >
                          {company?.name ?? 'Private Employer'}
                          {company?.city ? ` • ${company.city}` : ''}
                        </Text>
                        <View className={`self-start px-2 py-0.5 rounded-full ${cc.bg}`}>
                          <Text
                            className={`text-[10px] font-bold ${cc.text}`}
                            style={{ includeFontPadding: false }}
                          >
                            {meta.label}
                          </Text>
                        </View>
                      </View>
                      <Text
                        className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 ml-2"
                        style={{ includeFontPadding: false }}
                      >
                        {formatDate(item.appliedAt, 'relative')}
                      </Text>
                    </View>
                    {item.coverLetter ? (
                      <Text
                        numberOfLines={2}
                        className="text-xs text-gray-600 dark:text-gray-400 mt-2 leading-5"
                        style={{ includeFontPadding: false }}
                      >
                        {item.coverLetter}
                      </Text>
                    ) : null}
                    {(item.interviews?.length ?? 0) > 0 && (
                      <View className="flex-row items-center mt-2">
                        <Ionicons name="calendar" size={12} color={COLORS.secondary} />
                        <Text
                          className="text-[11px] text-blue-700 dark:text-blue-400 ml-1 font-semibold"
                          style={{ includeFontPadding: false }}
                        >
                          {item.interviews!.length} interview
                          {item.interviews!.length > 1 ? 's' : ''} scheduled
                        </Text>
                      </View>
                    )}
                    <Divider className="my-3" />
                    <View className="flex-row flex-wrap gap-2">
                      <Button
                        title="View Details"
                        variant="primary"
                        size="sm"
                        leftIcon="eye-outline"
                        onPress={() => router.push(`/applications/${item.id}`)}
                      />
                      {canWithdraw && (
                        <Button
                          title="Withdraw"
                          variant="outline"
                          size="sm"
                          leftIcon="close-circle-outline"
                          onPress={() =>
                            Alert.alert(
                              'Withdraw Application',
                              'Are you sure you want to withdraw this application?',
                              [
                                { text: 'Cancel', style: 'cancel' },
                                {
                                  text: 'Withdraw',
                                  style: 'destructive',
                                  onPress: () =>
                                    withdrawMutation.mutate({ id: item.id }),
                                },
                              ],
                            )
                          }
                        />
                      )}
                      {job?.id && (
                        <Button
                          title="Open Job"
                          variant="outline"
                          size="sm"
                          leftIcon="briefcase-outline"
                          onPress={() => router.push(`/jobs/${job.id}`)}
                        />
                      )}
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            </Card>
          );
        }}
      />
    </Screen>
  );
}
