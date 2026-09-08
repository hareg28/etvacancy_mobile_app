import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { Screen } from '@components/ui/Screen';
import { Card, CardHeader } from '@components/ui/Card';
import { Avatar } from '@components/ui/Avatar';
import Button from '@components/ui/Button';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore, selectUserRole } from '@store/index';
import { jobs as jobsApi, applications as applicationsApi, interviews as interviewsApi, companies as companiesApi, admin as adminApi } from '@api/index';
import { COLORS, APPLICATION_STATUS_LABELS, INTERVIEW_STATUS_LABELS } from '@constants/index';
import { formatDate, formatDateTime } from '@utils/index';
import type { Job, JobApplication, Interview, AnalyticsData } from '@/types/index';

import HeaderBar from '@components/ui/HeaderBar';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: keyof typeof Ionicons.glyphMap;
  bgClass: string;
  iconColor: string;
  onPress?: () => void;
  trend?: { direction: 'up' | 'down'; value: string };
}

function StatCard({
  label,
  value,
  icon,
  bgClass,
  iconColor,
  onPress,
  trend,
}: StatCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className="bg-white dark:bg-neutral-800 rounded-2xl p-4 shadow-card flex-1"
    >
      <View className="flex-row items-start justify-between mb-3">
        <View className={`w-11 h-11 rounded-xl ${bgClass} items-center justify-center`}>
          <Ionicons name={icon} size={20} color={iconColor} />
        </View>
        {trend && (
          <View className={`flex-row items-center gap-1 px-2 py-0.5 rounded-lg ${
              trend.direction === 'up'
                ? 'bg-primary-100 dark:bg-primary-900/30'
                : 'bg-red-100 dark:bg-red-900/30'
            }`}>
            <Ionicons
              name={trend.direction === 'up' ? 'trending-up' : 'trending-down'}
              size={12}
              color={trend.direction === 'up' ? '#1D4ED8' : '#DC2626'}
            />
            <Text
              className={`text-[10px] font-bold ${
                trend.direction === 'up' ? 'text-primary-700 dark:text-primary-400' : 'text-red-700 dark:text-red-400'
              }`}
              style={{ includeFontPadding: false }}
            >
              {trend.value}
            </Text>
          </View>
        )}
      </View>
      <Text
        className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1"
        style={{ includeFontPadding: false }}
      >
        {value}
      </Text>
      <Text
        className="text-xs text-gray-500 dark:text-gray-400"
        style={{ includeFontPadding: false }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function EmployerDashboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const userRole = useAuthStore(selectUserRole);
  const [refreshing, setRefreshing] = useState(false);
  const isAdmin = userRole === 'ADMIN';
  const companyId = user?.employerProfile?.companyId;

  const { data: analytics, isLoading: loadingAnalytics } = useQuery<AnalyticsData>({
    queryKey: ['admin', 'analytics'],
    queryFn: () => adminApi.analytics(),
    enabled: isAdmin,
  });

  const { data: myJobs, isLoading: loadingJobs } = useQuery({
    queryKey: ['jobs', 'my-vacancies', companyId],
    queryFn: () => jobsApi.list({ limit: 10 }),
  });

  const { data: applications, isLoading: loadingApps } = useQuery({
    queryKey: ['applications', 'recent'],
    queryFn: () => applicationsApi.list({ limit: 5, sortBy: 'appliedAt', sortOrder: 'desc' }),
  });

  const { data: interviews, isLoading: loadingInterviews } = useQuery({
    queryKey: ['interviews', 'upcoming'],
    queryFn: () => interviewsApi.list({ limit: 5 }),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      isAdmin ? adminApi.analytics() : Promise.resolve(),
      jobsApi.list({ limit: 10 }),
      applicationsApi.list({ limit: 5 }),
      interviewsApi.list({ limit: 5 }),
    ]);
    setRefreshing(false);
  }, [isAdmin]);

  return (
    <Screen scrollable={false} padding={false}>
      <HeaderBar
        title={isAdmin ? 'Admin Panel' : 'Employer Dashboard'}
        subtitle="Manage Recruitment"
        showHomeButton
        showRoleBadge
      />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >

      {/* Header */}
      <View className="flex-row items-center justify-between mb-6">
        <View className="flex-1 pr-3">
          <Text
            className="text-sm text-gray-500 dark:text-gray-400 mb-1"
            style={{ includeFontPadding: false }}
          >
            {isAdmin ? 'Admin Panel' : 'Employer Dashboard'}
          </Text>
          <Text
            className="text-2xl font-bold text-gray-900 dark:text-gray-100"
            style={{ includeFontPadding: false }}
          >
            Welcome back, {user?.firstName ?? user?.fullName ?? 'User'} 👋
          </Text>
        </View>
        <Button
          title="Post Job"
          variant="primary"
          size="sm"
          leftIcon="add-circle-outline"
          onPress={() => router.push('/(tabs)/employer/vacancies')}
        />
      </View>

      {/* Quick Stats */}
      {isAdmin ? (
        <>
          <View className="flex-row gap-3 mb-3">
            <StatCard
              label="Total Users"
              value={analytics?.totalUsers ?? '--'}
              icon="people"
              bgClass="bg-blue-100 dark:bg-blue-900/30"
              iconColor="#2563EB"
            />
            <StatCard
              label="Job Seekers"
              value={analytics?.totalJobSeekers ?? '--'}
              icon="person"
              bgClass="bg-primary-100 dark:bg-primary-900/30"
              iconColor={COLORS.primary}
            />
          </View>
          <View className="flex-row gap-3 mb-3">
            <StatCard
              label="Employers"
              value={analytics?.totalEmployers ?? '--'}
              icon="business"
              bgClass="bg-purple-100 dark:bg-purple-900/30"
              iconColor="#9333EA"
            />
            <StatCard
              label="Active Jobs"
              value={analytics?.activeJobs ?? '--'}
              icon="briefcase"
              bgClass="bg-amber-100 dark:bg-amber-900/30"
              iconColor="#D97706"
              onPress={() => router.push('/(tabs)/employer/vacancies')}
            />
          </View>
          <View className="flex-row gap-3 mb-6">
            <StatCard
              label="Applications"
              value={analytics?.totalApplications ?? '--'}
              icon="document-text"
              bgClass="bg-primary-100 dark:bg-primary-900/30"
              iconColor="#1D4ED8"
            />
            <StatCard
              label="Companies"
              value={analytics?.verifiedCompanies ?? '--'}
              icon="aperture"
              bgClass="bg-rose-100 dark:bg-rose-900/30"
              iconColor="#E11D48"
            />
          </View>
        </>
      ) : (
        <View className="flex-row gap-3 mb-6">
          <StatCard
            label="Active Jobs"
            value={myJobs?.total ?? '--'}
            icon="briefcase"
            bgClass="bg-primary-100 dark:bg-primary-900/30"
            iconColor={COLORS.primary}
            onPress={() => router.push('/(tabs)/employer/vacancies')}
          />
          <StatCard
            label="Applicants"
            value={applications?.total ?? '--'}
            icon="people"
            bgClass="bg-blue-100 dark:bg-blue-900/30"
            iconColor="#2563EB"
            onPress={() => router.push('/(tabs)/employer/applicants')}
          />
        </View>
      )}

      {isAdmin && (
        <View className="flex-row gap-3 mb-6">
          <StatCard
            label="Pending Review"
            value={analytics?.pendingApplications ?? '--'}
            icon="time-outline"
            bgClass="bg-amber-100 dark:bg-amber-900/30"
            iconColor="#D97706"
          />
          <StatCard
            label="Verified Companies"
            value={analytics?.verifiedCompanies ?? '--'}
            icon="shield-checkmark"
            bgClass="bg-primary-100 dark:bg-primary-900/30"
            iconColor="#1D4ED8"
          />
        </View>
      )}

      {/* Quick Actions */}
      <Card padding="md" variant="elevated" className="mb-6">
        <CardHeader title="Quick Actions" subtitle="Start hiring right now" />
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Button
              title="Post Job"
              variant="primary"
              size="md"
              leftIcon="add-circle-outline"
              fullWidth
              onPress={() => router.push('/(tabs)/employer/vacancies')}
            />
          </View>
          <View className="flex-1">
            <Button
              title="Invite Interview"
              variant="secondary"
              size="md"
              leftIcon="calendar-outline"
              fullWidth
              onPress={() => router.push('/(tabs)/employer/interviews')}
            />
          </View>
        </View>
      </Card>

      {/* Recent Applications */}
      <CardHeader
        title="Recent Applications"
        subtitle="New candidates for your vacancies"
        right={
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/employer/applicants')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text
              className="text-sm font-semibold text-primary-700 dark:text-primary-400"
              style={{ includeFontPadding: false }}
            >
              See All →
            </Text>
          </TouchableOpacity>
        }
        className="mb-4"
      />
      <Card padding="sm" variant="outlined" className="mb-2">
        {applications?.data && applications.data.length > 0 ? (
          applications.data.slice(0, 4).map((app: JobApplication) => (
            <View key={app.id}>
              <View className="flex-row items-center p-3">
                <Avatar
                  uri={app.applicant?.avatar ?? undefined}
                  firstName={app.applicant?.firstName}
                  lastName={app.applicant?.lastName}
                  email={app.applicant?.email}
                  size="md"
                />
                <View className="flex-1 ml-3">
                  <Text
                    className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-0.5"
                    style={{ includeFontPadding: false }}
                  >
                    {app.applicant?.firstName
                      ? `${app.applicant.firstName} ${app.applicant.lastName ?? ''}`
                      : app.applicant?.email ?? 'Unknown Applicant'}
                  </Text>
                  <Text
                    className="text-xs text-gray-500 dark:text-gray-400 mb-1"
                    style={{ includeFontPadding: false }}
                  >
                    applied for {app.job?.title ?? 'a job'}
                  </Text>
                  <Text
                    className="text-[11px] text-gray-400 dark:text-gray-500"
                    style={{ includeFontPadding: false }}
                  >
                    {formatDate(app.appliedAt, 'relative')}
                  </Text>
                </View>
                <View
                  className={`px-2.5 py-1 rounded-full ${
                    APPLICATION_STATUS_LABELS[app.status]?.color === 'success'
                      ? 'bg-green-100 dark:bg-green-900/30'
                      : APPLICATION_STATUS_LABELS[app.status]?.color === 'danger'
                      ? 'bg-red-100 dark:bg-red-900/30'
                      : APPLICATION_STATUS_LABELS[app.status]?.color === 'primary'
                      ? 'bg-primary-100 dark:bg-primary-900/30'
                      : APPLICATION_STATUS_LABELS[app.status]?.color === 'warning'
                      ? 'bg-amber-100 dark:bg-amber-900/30'
                      : APPLICATION_STATUS_LABELS[app.status]?.color === 'info'
                      ? 'bg-blue-100 dark:bg-blue-900/30'
                      : 'bg-gray-100 dark:bg-neutral-700'
                  }`}
                >
                  <Text
                    className={`text-[10px] font-bold ${
                      APPLICATION_STATUS_LABELS[app.status]?.color === 'success'
                        ? 'text-green-700 dark:text-green-400'
                        : APPLICATION_STATUS_LABELS[app.status]?.color === 'danger'
                        ? 'text-red-700 dark:text-red-400'
                        : APPLICATION_STATUS_LABELS[app.status]?.color === 'primary'
                        ? 'text-primary-700 dark:text-primary-300'
                        : APPLICATION_STATUS_LABELS[app.status]?.color === 'warning'
                        ? 'text-amber-700 dark:text-amber-400'
                        : APPLICATION_STATUS_LABELS[app.status]?.color === 'info'
                        ? 'text-blue-700 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-400'
                    }`}
                    style={{ includeFontPadding: false }}
                  >
                    {APPLICATION_STATUS_LABELS[app.status]?.label ?? app.status}
                  </Text>
                </View>
              </View>
              <View className="h-px bg-gray-100 dark:bg-neutral-700 ml-16 last:h-0" />
            </View>
          ))
        ) : (
          <View className="py-8 items-center">
            <Ionicons name="document-text-outline" size={36} color="#9CA3AF" />
            <Text
              className="text-sm text-gray-500 dark:text-gray-400 mt-3"
              style={{ includeFontPadding: false }}
            >
              No applications yet. Post a job to start receiving!
            </Text>
          </View>
        )}
      </Card>

      {/* Upcoming Interviews */}
      <CardHeader
        title="Upcoming Interviews"
        subtitle="Your scheduled meetings"
        right={
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/employer/interviews')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text
              className="text-sm font-semibold text-primary-700 dark:text-primary-400"
              style={{ includeFontPadding: false }}
            >
              See All →
            </Text>
          </TouchableOpacity>
        }
        className="mt-6 mb-4"
      />
      <Card padding="sm" variant="outlined" className="mb-4">
        {interviews?.data && interviews.data.length > 0 ? (
          interviews.data.slice(0, 3).map((interview: Interview) => {
            const statusConfig = INTERVIEW_STATUS_LABELS[interview.status];
            return (
              <View key={interview.id}>
                <View className="flex-row items-center p-3">
                  <View className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 items-center justify-center mr-3">
                    <Ionicons
                      name={
                        interview.type === 'VIDEO'
                          ? 'videocam-outline'
                          : interview.type === 'PHONE'
                          ? 'call-outline'
                          : interview.type === 'ASSESSMENT'
                          ? 'document-outline'
                          : 'people-outline'
                      }
                      size={22}
                      color="#2563EB"
                    />
                  </View>
                  <View className="flex-1">
                    <Text
                      className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-0.5"
                      style={{ includeFontPadding: false }}
                    >
                      {interview.title}
                    </Text>
                    <View className="flex-row items-center gap-1">
                      <Ionicons name="calendar-outline" size={12} color="#6B7280" />
                      <Text
                        className="text-xs text-gray-500 dark:text-gray-400"
                        style={{ includeFontPadding: false }}
                      >
                        {formatDateTime(interview.scheduledAt)}
                      </Text>
                    </View>
                  </View>
                  <View
                    className={`px-2.5 py-1 rounded-full ${
                      statusConfig?.color === 'success'
                        ? 'bg-green-100 dark:bg-green-900/30'
                        : statusConfig?.color === 'danger'
                        ? 'bg-red-100 dark:bg-red-900/30'
                        : statusConfig?.color === 'warning'
                        ? 'bg-amber-100 dark:bg-amber-900/30'
                        : 'bg-primary-100 dark:bg-primary-900/30'
                    }`}
                  >
                    <Text
                      className={`text-[10px] font-bold ${
                        statusConfig?.color === 'success'
                          ? 'text-green-700 dark:text-green-400'
                          : statusConfig?.color === 'danger'
                          ? 'text-red-700 dark:text-red-400'
                          : statusConfig?.color === 'warning'
                          ? 'text-amber-700 dark:text-amber-400'
                          : 'text-primary-700 dark:text-primary-300'
                      }`}
                      style={{ includeFontPadding: false }}
                    >
                      {statusConfig?.label ?? interview.status}
                    </Text>
                  </View>
                </View>
                <View className="h-px bg-gray-100 dark:bg-neutral-700 ml-[72px] last:h-0" />
              </View>
            );
          })
        ) : (
          <View className="py-8 items-center">
            <Ionicons name="calendar-outline" size={36} color="#9CA3AF" />
            <Text
              className="text-sm text-gray-500 dark:text-gray-400 mt-3 text-center px-8"
              style={{ includeFontPadding: false }}
            >
              No interviews scheduled. Review applicants to invite for interviews!
            </Text>
          </View>
        )}
      </Card>

      <View className="mb-4">
        <Button
          title="Manage All Vacancies"
          variant="outline"
          size="md"
          fullWidth
          leftIcon="briefcase-outline"
          onPress={() => router.push('/(tabs)/employer/vacancies')}
        />
      </View>
      </ScrollView>
    </Screen>
  );
}
