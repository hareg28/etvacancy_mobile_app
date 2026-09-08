import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { Screen } from '@components/ui/Screen';
import { Card, CardHeader } from '@components/ui/Card';
import { Divider } from '@components/ui/Divider';
import Button from '@components/ui/Button';
import { Ionicons } from '@expo/vector-icons';
import { admin as adminApi } from '@api/index';
import { COLORS } from '@constants/index';
import type { AnalyticsData } from '@/types/index';
import { formatCurrency } from '@utils/index';

import HeaderBar from '@components/ui/HeaderBar';

interface StatProps {
  label: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  trend?: string;
}

function StatCard({ label, value, icon, tint, trend }: StatProps) {
  return (
    <Card padding="md" variant="elevated" style={{ flex: 1, minWidth: '46%' } as any}>
      <View className="flex-row items-start justify-between mb-2">
        <View
          className="w-10 h-10 rounded-xl items-center justify-center"
          style={{ backgroundColor: tint + '15' }}
        >
          <Ionicons name={icon} size={20} color={tint} />
        </View>
        {trend && (
          <View className="flex-row items-center">
            <Ionicons name="trending-up-outline" size={12} color={COLORS.success} />
            <Text className="text-[10px] font-bold text-green-700 dark:text-green-400 ml-1">
              {trend}
            </Text>
          </View>
        )}
      </View>
      <Text
        className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-0.5"
        style={{ includeFontPadding: false }}
      >
        {value}
      </Text>
      <Text
        className="text-[11px] text-gray-500 dark:text-gray-400"
        style={{ includeFontPadding: false }}
      >
        {label}
      </Text>
    </Card>
  );
}

export default function AdminAnalyticsScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const { data: analytics, isLoading, refetch } = useQuery<AnalyticsData>({
    queryKey: ['admin', 'analytics'],
    queryFn: () => adminApi.analytics(),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const data = analytics;

  return (
    <Screen scrollable={false} padding={false}>
      <HeaderBar title="Admin Dashboard" subtitle="Platform Overview" showHomeButton showRoleBadge />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        refreshControl={
          <RefreshControl refreshing={refreshing || isLoading} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        <View className="mb-5 mt-2 flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Text
              className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1"
              style={{ includeFontPadding: false }}
            >
              Admin Dashboard
            </Text>
            <Text
              className="text-sm text-gray-500 dark:text-gray-400"
              style={{ includeFontPadding: false }}
            >
              Full platform management &amp; analytics overview
            </Text>
          </View>
          <Button
            title="Post Vacancy"
            variant="primary"
            size="sm"
            leftIcon="add-circle-outline"
            onPress={() => router.push('/(tabs)/employer/vacancies')}
          />
        </View>

        <View className="flex-row flex-wrap gap-3 mb-5">
          <StatCard
            label="Total Users"
            value={data?.totalUsers ?? '--'}
            icon="people-outline"
            tint={COLORS.primary}
          />
          <StatCard
            label="Job Seekers"
            value={data?.totalJobSeekers ?? '--'}
            icon="person-outline"
            tint="#0891B2"
          />
          <StatCard
            label="Employers"
            value={data?.totalEmployers ?? '--'}
            icon="briefcase-outline"
            tint={COLORS.secondary}
          />
          <StatCard
            label="Active Jobs"
            value={data?.activeJobs ?? '--'}
            icon="document-text-outline"
            tint="#1D4ED8"
          />
          <StatCard
            label="Applications"
            value={data?.totalApplications ?? '--'}
            icon="paper-plane-outline"
            tint="#7C3AED"
          />
          <StatCard
            label="Pending Review"
            value={data?.pendingApplications ?? '--'}
            icon="hourglass-outline"
            tint={COLORS.warning}
          />
          <StatCard
            label="Companies"
            value={data?.totalCompanies ?? '--'}
            icon="business-outline"
            tint="#DB2777"
          />
          <StatCard
            label="Verified Companies"
            value={data?.verifiedCompanies ?? '--'}
            icon="shield-checkmark-outline"
            tint={COLORS.success}
          />
        </View>

        <Card padding="md" className="mb-4">
          <CardHeader
            title="Quick Actions"
            subtitle="Jump to management tools"
          />
          <View className="flex-row flex-wrap gap-2 mt-2">
            <View style={{ flex: 1, minWidth: '45%' }}>
              <Button
                title="Manage Users"
                variant="outline"
                size="md"
                leftIcon="people-outline"
                onPress={() => router.push('/(tabs)/admin/users')}
                fullWidth
              />
            </View>
            <View style={{ flex: 1, minWidth: '45%' }}>
              <Button
                title="Review Companies"
                variant="outline"
                size="md"
                leftIcon="business-outline"
                onPress={() => router.push('/(tabs)/admin/companies')}
                fullWidth
              />
            </View>
            <View style={{ flex: 1, minWidth: '45%' }}>
              <Button
                title="Categories"
                variant="outline"
                size="md"
                leftIcon="pricetags-outline"
                onPress={() => router.push('/(tabs)/admin/categories')}
                fullWidth
              />
            </View>
            <View style={{ flex: 1, minWidth: '45%' }}>
              <Button
                title="Permissions"
                variant="outline"
                size="md"
                leftIcon="key-outline"
                onPress={() => router.push('/(tabs)/admin/permissions')}
                fullWidth
              />
            </View>
          </View>
        </Card>

        <Card padding="md" className="mb-4">
          <CardHeader title="Jobs by Category" leftIcon={<Ionicons name="bar-chart-outline" size={18} color={COLORS.primary} />} />
          <View className="mt-3 gap-2">
            {(data?.jobsByCategory?.length ?? 0) > 0 ? (
              (data!.jobsByCategory as Array<{ category: string; count: number }>).map((row: { category: string; count: number }, idx: number) => {
                const max = Math.max(...(data!.jobsByCategory as Array<{ category: string; count: number }>).map((r: { count: number }) => r.count), 1);
                const pct = (row.count / max) * 100;
                return (
                  <View key={idx} className="mb-2">
                    <View className="flex-row justify-between mb-1">
                      <Text className="text-xs font-semibold text-gray-800 dark:text-gray-200" style={{ includeFontPadding: false }}>
                        {row.category}
                      </Text>
                      <Text className="text-xs text-gray-500 dark:text-gray-400" style={{ includeFontPadding: false }}>
                        {row.count} jobs
                      </Text>
                    </View>
                    <View className="h-2 w-full rounded-full bg-gray-100 dark:bg-neutral-700 overflow-hidden">
                      <View
                        className="h-full rounded-full bg-primary-600"
                        style={{ width: `${pct}%` }}
                      />
                    </View>
                  </View>
                );
              })
            ) : (
              <Text className="text-sm text-gray-500 dark:text-gray-400 italic" style={{ includeFontPadding: false }}>
                No category data available yet.
              </Text>
            )}
          </View>
        </Card>

        <Card padding="md" className="mb-4">
          <CardHeader title="Applications by Status" leftIcon={<Ionicons name="pie-chart-outline" size={18} color={COLORS.secondary} />} />
          <View className="flex-row flex-wrap gap-3 mt-2">
            {(data?.applicationsByStatus?.length ?? 0) > 0 ? (
              data!.applicationsByStatus.map((row: { status: string; count: number }) => (
                <View
                  key={row.status}
                  className="flex-row items-center bg-gray-50 dark:bg-neutral-800 px-3 py-2 rounded-xl border border-gray-100 dark:border-neutral-700"
                >
                  <View className="w-2 h-2 rounded-full mr-2" style={{
                    backgroundColor:
                      row.status === 'HIRED' ? COLORS.success :
                      row.status === 'REJECTED' ? COLORS.danger :
                      row.status === 'PENDING' ? COLORS.warning :
                      row.status === 'INTERVIEW' ? COLORS.secondary :
                      COLORS.primary,
                  }} />
                  <Text className="text-xs font-semibold text-gray-800 dark:text-gray-200 mr-2" style={{ includeFontPadding: false }}>
                    {row.status.replace('_', ' ')}
                  </Text>
                  <Text className="text-[11px] text-gray-500 dark:text-gray-400" style={{ includeFontPadding: false }}>
                    {row.count}
                  </Text>
                </View>
              ))
            ) : (
              <Text className="text-sm text-gray-500 dark:text-gray-400 italic" style={{ includeFontPadding: false }}>
                No application status data yet.
              </Text>
            )}
          </View>
        </Card>
      </ScrollView>
    </Screen>
  );
}
