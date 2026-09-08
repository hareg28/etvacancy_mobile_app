import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Alert, Share, Modal, TextInput, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { Screen } from '@components/ui/Screen';
import { Card, CardHeader } from '@components/ui/Card';
import { Avatar } from '@components/ui/Avatar';
import Button from '@components/ui/Button';
import { Ionicons } from '@expo/vector-icons';
import { jobs as jobsApi, savedJobs as savedJobsApi, applications as applicationsApi } from '@api/index';
import { useAuthStore, useUIStore, usePermission, useLocalJobsStore } from '@store/index';
import { COLORS, JOB_TYPES, EXPERIENCE_LEVELS, EMPLOYMENT_TYPES, SALARY_CURRENCIES } from '@constants/index';
import { formatDate, formatCurrency, truncate, getFullName } from '@utils/index';
import type { Job, Company } from '@/types/index';
import { Image } from 'expo-image';

function Chip({
  icon,
  label,
  tint = COLORS.primary,
  faint = false,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  label: string;
  tint?: string;
  faint?: boolean;
}) {
  return (
    <View
      className={`flex-row items-center rounded-full px-3 py-1.5 ${
        faint ? 'bg-gray-100 dark:bg-neutral-700' : ''
      }`}
      style={!faint ? { backgroundColor: tint + '15' } : undefined}
    >
      {icon && <Ionicons name={icon} size={14} color={faint ? '#6B7280' : tint} style={{ marginRight: 6 }} />}
      <Text
        className={`text-xs font-semibold ${faint ? 'text-gray-700 dark:text-gray-300' : ''}`}
        style={!faint ? { color: tint } : undefined}
      >
        {label}
      </Text>
    </View>
  );
}

function parseArrayField(value: unknown): string[] {
  if (Array.isArray(value)) return value as string[];
  if (typeof value === 'string' && value.trim().length > 0) {
    return value
      .split(/\n+|(?:\s*[-*•]\s+)/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

export default function JobDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; apply?: string }>();
  const jobId = params.id;
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const setPendingJobId = useAuthStore((s) => s.setPendingJobId);
  const isSeeker = user?.role === 'JOB_SEEKER';
  const isPublic = !user || user.role === 'PUBLIC';
  const can = usePermission();
  const [refreshing, setRefreshing] = useState(false);
  const [authModalVisible, setAuthModalVisible] = useState(false);

  const handleAuthToApply = (mode: 'login' | 'signup' = 'login') => {
    setAuthModalVisible(false);
    if (jobId) {
      setPendingJobId(jobId);
    }
    router.push(mode === 'signup' ? '/(auth)/signup' : '/(auth)/login');
  };

  const { data: job, isLoading } = useQuery<Job | null>({
    queryKey: ['jobs', 'detail', jobId],
    queryFn: async () => {
      if (!jobId) return null;
      try {
        const j = await jobsApi.get(jobId);
        if (j && ((j as any).id || (j as any).data?.id)) {
          return (j as any).data ?? j;
        }
      } catch {
        // Fallback to local store
      }
      const localJobs = useLocalJobsStore.getState().localPostedJobs || [];
      const found = localJobs.find((j) => j.id === jobId || j.slug === jobId);
      return found ?? null;
    },
    enabled: !!jobId,
  });

  const { data: savedInfo } = useQuery<{ isSaved: boolean; savedId?: string }>({
    queryKey: ['saved-jobs', 'check', jobId],
    queryFn: async () => {
      if (!jobId || !isSeeker) return { isSaved: false };
      try {
        return await savedJobsApi.check(jobId);
      } catch {
        return { isSaved: false };
      }
    },
    enabled: !!jobId && isSeeker,
  });

  const { data: applicationInfo } = useQuery<{ hasApplied: boolean; applicationId?: string }>({
    queryKey: ['applications', 'check', jobId],
    queryFn: async () => {
      if (!jobId || !isSeeker) return { hasApplied: false };
      return applicationsApi.checkJob(jobId);
    },
    enabled: !!jobId && isSeeker,
  });

  const saveToggle = useMutation({
    mutationFn: async (): Promise<void> => {
      if (!jobId) return;
      if (savedInfo?.isSaved) {
        await savedJobsApi.remove(savedInfo.savedId ?? jobId);
      } else {
        await savedJobsApi.create({ jobId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-jobs'] });
    },
  });

  const applyJob = useMutation({
    mutationFn: (payload: { coverLetter?: string }) => {
      if (!jobId) return Promise.reject(new Error('No job id'));
      return applicationsApi.create({ jobId, coverLetter: payload.coverLetter ?? '' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      Alert.alert('🎉 Application Sent', 'Good luck! The hiring team will review your profile.');
    },
    onError: (e) => {
      Alert.alert('Could not Apply', (e as Error)?.message ?? 'Please try again later.');
    },
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['jobs'] }),
      queryClient.invalidateQueries({ queryKey: ['saved-jobs'] }),
      queryClient.invalidateQueries({ queryKey: ['applications'] }),
    ]);
    setRefreshing(false);
  }, [queryClient]);

  const company = job?.company as Company | undefined;

  const jobType = JOB_TYPES.find((t) => t.value === job?.type)?.label ?? job?.type;
  const exp = EXPERIENCE_LEVELS.find((e) => e.value === job?.experienceLevel)?.label ?? job?.experienceLevel;
  const work = EMPLOYMENT_TYPES.find((w) => w.value === job?.employmentType)?.label ?? job?.employmentType;
  const city = typeof job?.city === 'string' ? job.city : undefined;

  const salaryDisplay = useMemo(() => {
    if (!job?.salaryMin && !job?.salaryMax) return undefined;
    const cur = SALARY_CURRENCIES.find((c) => c.value === (job?.salaryCurrency ?? 'ETB'))?.symbol ?? 'Br';
    const period = job?.salaryPeriod
      ? ' per ' + job.salaryPeriod.charAt(0).toUpperCase() + job.salaryPeriod.slice(1).toLowerCase()
      : '';
    if (job.salaryMin && job.salaryMax)
      return `${formatCurrency(job.salaryMin, { symbol: cur, noDecimals: true })} – ${formatCurrency(job.salaryMax, { symbol: cur, noDecimals: true })}${period}`;
    if (job.salaryMin) return `From ${formatCurrency(job.salaryMin, { symbol: cur, noDecimals: true })}${period}`;
    if (job.salaryMax) return `Up to ${formatCurrency(job.salaryMax, { symbol: cur, noDecimals: true })}${period}`;
    return undefined;
  }, [job]);

  const onShare = async () => {
    try {
      await Share.share({
        message: `${job?.title} at ${company?.name ?? 'EtVacancy'} — Apply now on EtVacancy!`,
      });
    } catch {}
  };

  const [applyModalVisible, setApplyModalVisible] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');

  // Auto-open application modal when user returns from login/signup with ?apply=true
  useEffect(() => {
    if (params.apply === 'true' && user && isSeeker && job) {
      if (applicationInfo?.hasApplied) {
        if (applicationInfo.applicationId) {
          router.push(`/applications/${applicationInfo.applicationId}`);
        }
      } else {
        setCoverLetter('');
        setApplyModalVisible(true);
      }
    }
  }, [params.apply, user, isSeeker, job, applicationInfo?.hasApplied, applicationInfo?.applicationId]);

  const openApply = () => {
    if (!user || isPublic) {
      setAuthModalVisible(true);
      return;
    }
    if (applicationInfo?.hasApplied) {
      if (applicationInfo.applicationId) {
        router.push(`/applications/${applicationInfo.applicationId}`);
      }
      return;
    }
    setCoverLetter('');
    setApplyModalVisible(true);
  };

  const responsibilities = parseArrayField(job?.responsibilities);
  const requirements = parseArrayField(job?.requirements);
  const benefitsList = parseArrayField(job?.benefits);

  if (isLoading) {
    return (
      <Screen scrollable={false}>
        <View className="flex-1 items-center justify-center p-6">
          <View className="w-12 h-12 rounded-2xl bg-primary-100 dark:bg-primary-900/30 items-center justify-center mb-3">
            <Ionicons name="briefcase-outline" size={24} color={COLORS.primary} />
          </View>
          <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Loading job details...
          </Text>
        </View>
      </Screen>
    );
  }

  if (!job) {
    return (
      <Screen scrollable padded>
        <View className="flex-row items-center justify-between mb-8">
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <View className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-neutral-700 items-center justify-center">
              <Ionicons name="arrow-back" size={22} color="#111827" />
            </View>
          </TouchableOpacity>
        </View>
        <View className="items-center py-20">
          <View className="w-28 h-28 bg-red-50 dark:bg-red-900/20 rounded-full items-center justify-center mb-6">
            <Ionicons name="alert-circle-outline" size={56} color={COLORS.danger} />
          </View>
          <Text
            className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2"
            style={{ includeFontPadding: false }}
          >
            Job Not Found
          </Text>
          <Text
            className="text-sm text-gray-500 dark:text-gray-400 text-center px-10 mb-8"
            style={{ includeFontPadding: false }}
          >
            The job listing may have expired or been removed.
          </Text>
          <Button
            title="Browse All Jobs"
            variant="primary"
            size="md"
            leftIcon="search-outline"
            onPress={() => router.push('/(tabs)/(seeker)/jobs')}
          />
        </View>
      </Screen>
    );
  }

  const safeBottom = 16;

  return (
    <Screen scrollable={false}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 160 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        {/* Header Bar */}
        <View className="flex-row items-center justify-between mb-4 mt-2">
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <View className="w-10 h-10 rounded-xl bg-white dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 items-center justify-center shadow-card-sm">
              <Ionicons name="arrow-back" size={22} color="#111827" />
            </View>
          </TouchableOpacity>
          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              onPress={onShare}
              activeOpacity={0.7}
              className="w-10 h-10 rounded-xl bg-white dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 items-center justify-center shadow-card-sm"
            >
              <Ionicons name="share-outline" size={20} color="#111827" />
            </TouchableOpacity>
            {isSeeker && (
              <TouchableOpacity
                onPress={() => saveToggle.mutate()}
                activeOpacity={0.7}
                className="w-10 h-10 rounded-xl bg-white dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 items-center justify-center shadow-card-sm"
              >
                <Ionicons
                  name={savedInfo?.isSaved ? 'bookmark' : 'bookmark-outline'}
                  size={20}
                  color={savedInfo?.isSaved ? COLORS.primary : '#111827'}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Hero */}
        <Card padding="lg" variant="elevated" className="mb-5">
          <View className="flex-row items-start mb-4">
            <View className="w-16 h-16 rounded-2xl bg-primary-50 dark:bg-primary-900/30 border border-primary-100 dark:border-primary-900 items-center justify-center mr-4 overflow-hidden">
              {company?.logo ? (
                <Image source={{ uri: company.logo }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
              ) : (
                <Ionicons name="business" size={28} color={COLORS.primary} />
              )}
            </View>
            <View className="flex-1">
              {company?.verificationStatus === 'VERIFIED' && (
                <View className="flex-row items-center mb-1.5">
                  <Ionicons name="shield-checkmark" size={14} color={COLORS.success} />
                  <Text
                    className="text-[11px] font-bold text-green-700 dark:text-green-400 ml-1"
                    style={{ includeFontPadding: false }}
                  >
                    Verified Employer
                  </Text>
                </View>
              )}
              <Text
                className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1 leading-tight"
                style={{ includeFontPadding: false }}
              >
                {job?.title}
              </Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => company?.id && router.push(`/companies/${company.id}`)}
              >
                <Text
                  className="text-base font-semibold text-primary-700 dark:text-primary-400 mb-0.5"
                  style={{ includeFontPadding: false }}
                >
                  {company?.name ?? 'Private Employer'}
                </Text>
              </TouchableOpacity>
              <View className="flex-row items-center mt-1.5">
                <Ionicons name="location-outline" size={14} color="#6B7280" />
                <Text
                  className="text-sm text-gray-500 dark:text-gray-400 ml-1"
                  style={{ includeFontPadding: false }}
                >
                  {city ?? 'Ethiopia'}
                  {job?.country ? ` • ${job.country}` : ''}
                </Text>
              </View>
            </View>
          </View>

          {salaryDisplay && (
            <View className="flex-row items-center p-3 rounded-xl bg-green-50 dark:bg-green-900/20 mb-4">
              <Ionicons name="wallet-outline" size={20} color={COLORS.success} />
              <View className="ml-3 flex-1">
                <Text
                  className="text-[11px] font-bold uppercase text-green-700 dark:text-green-400 tracking-wider mb-0.5"
                  style={{ includeFontPadding: false }}
                >
                  Salary
                </Text>
                <Text
                  className="text-lg font-bold text-green-900 dark:text-green-300"
                  style={{ includeFontPadding: false }}
                >
                  {salaryDisplay}
                </Text>
              </View>
            </View>
          )}

          <View className="flex-row flex-wrap gap-2 mb-4">
            <Chip icon="briefcase-outline" label={jobType ?? 'Job'} tint={COLORS.primary} />
            <Chip icon="time-outline" label={work ?? 'Work Type'} tint="#2563EB" />
            <Chip icon="trending-up-outline" label={exp ?? 'Experience'} tint="#9333EA" />
            <Chip icon="calendar-outline" label={`Posted ${formatDate(job?.createdAt ?? new Date(), 'relative')}`} faint />
          </View>

          {/* Apply CTA inside card for logged-in seekers */}
          {isSeeker && (
            <View className="flex-row gap-2">
              <Button
                title={
                  applicationInfo?.hasApplied
                    ? 'View My Application'
                    : applyJob.isPending
                    ? 'Applying…'
                    : 'Apply Now'
                }
                variant="primary"
                size="lg"
                leftIcon={applicationInfo?.hasApplied ? 'document-text-outline' : 'send-outline'}
                style={{ flex: 1 } as any}
                loading={applyJob.isPending}
                onPress={openApply}
              />
              {!applicationInfo?.hasApplied && (
                <Button
                  title="Save"
                  variant="outline"
                  size="lg"
                  leftIcon={savedInfo?.isSaved ? 'bookmark' : 'bookmark-outline'}
                  onPress={() => saveToggle.mutate()}
                  disabled={saveToggle.isPending}
                />
              )}
            </View>
          )}
        </Card>

        {/* About This Role */}
        <Card padding="md" className="mb-4">
          <CardHeader title="About This Role" subtitle="Key information at a glance" />
          <View className="flex-row flex-wrap gap-3">
            <View className="flex-1 min-w-[42%]">
              <Text className="text-[11px] font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wide mb-1">Closes</Text>
              <Text className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {job?.expiresAt ? formatDate(job.expiresAt, 'long') : 'Open until filled'}
              </Text>
            </View>
            <View className="flex-1 min-w-[42%]">
              <Text className="text-[11px] font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wide mb-1">Openings</Text>
              <Text className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {job?.vacancyCount ?? 1} position{(job?.vacancyCount ?? 1) > 1 ? 's' : ''}
              </Text>
            </View>
            <View className="flex-1 min-w-[42%]">
              <Text className="text-[11px] font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wide mb-1">Status</Text>
              <Text
                className={`text-sm font-semibold ${
                  job?.status === 'PUBLISHED' ? 'text-green-700 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                {job?.status ?? 'Draft'}
              </Text>
            </View>
            <View className="flex-1 min-w-[42%]">
              <Text className="text-[11px] font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wide mb-1">Views</Text>
              <Text className="text-sm font-semibold text-gray-900 dark:text-gray-100">{job?.viewsCount ?? 0}</Text>
            </View>
          </View>
        </Card>

        {/* About The Company */}
        {company && (
          <Card padding="md" className="mb-4">
            <CardHeader
              title="About the Company"
              right={
                <TouchableOpacity
                  onPress={() => router.push(`/companies/${company.id}`)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text
                    className="text-sm font-semibold text-primary-700 dark:text-primary-400"
                    style={{ includeFontPadding: false }}
                  >
                    Profile →
                  </Text>
                </TouchableOpacity>
              }
            />
            <View className="flex-row items-start mb-3">
              <Avatar
                uri={company.logo ?? undefined}
                firstName={company.name}
                lastName=" "
                email={company.supportEmail ?? 'company@etvacancy.app'}
                size="lg"
              />
              <View className="ml-3 flex-1">
                <Text
                  className="text-base font-bold text-gray-900 dark:text-gray-100 mb-0.5"
                  style={{ includeFontPadding: false }}
                >
                  {company.name}
                </Text>
                <Text
                  className="text-xs text-gray-500 dark:text-gray-400 mb-1"
                  style={{ includeFontPadding: false }}
                >
                  {company.industry ?? '—'}
                </Text>
                <View className="flex-row items-center mt-1">
                  <Ionicons name="people-outline" size={12} color="#6B7280" />
                  <Text
                    className="text-[11px] text-gray-500 dark:text-gray-400 ml-1 mr-4"
                    style={{ includeFontPadding: false }}
                  >
                    {
                      (
                        [
                          '1–10',
                          '11–50',
                          '51–200',
                          '201–500',
                          '501–1000',
                          '1000+',
                        ] as any
                      )[
                        Math.min(
                          Math.max(
                            ['1_10', '11_50', '51_200', '201_500', '501_1000', '1000_PLUS'].indexOf(
                              company.size ?? '1_10',
                            ),
                            0,
                          ),
                          5,
                        )
                      ] ?? 'Team'
                    }
                  </Text>
                  <Ionicons name="location-outline" size={12} color="#6B7280" />
                  <Text
                    className="text-[11px] text-gray-500 dark:text-gray-400 ml-1"
                    style={{ includeFontPadding: false }}
                  >
                    {company.city ?? company.headquarters ?? '—'}
                  </Text>
                </View>
              </View>
            </View>
            {company.description ? (
              <Text
                numberOfLines={4}
                className="text-sm text-gray-700 dark:text-gray-300 leading-6"
                style={{ includeFontPadding: false }}
              >
                {company.description}
              </Text>
            ) : null}
          </Card>
        )}

        {/* Description */}
        {job?.description && (
          <Card padding="md" className="mb-4">
            <CardHeader title="Job Description" leftIcon={<Ionicons name="document-text-outline" size={18} color={COLORS.primary} />} />
            <Text
              className="text-sm text-gray-700 dark:text-gray-300 leading-6 whitespace-pre-line"
              style={{ includeFontPadding: false }}
            >
              {job.description}
            </Text>
          </Card>
        )}

        {/* Responsibilities */}
        {responsibilities.length > 0 && (
          <Card padding="md" className="mb-4">
            <CardHeader title="What You&apos;ll Do" subtitle="Key responsibilities" />
            {responsibilities.map((r, i) => (
              <View key={i} className="flex-row items-start py-2">
                <View className="w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-900/40 items-center justify-center mt-0.5 mr-3 flex-shrink-0">
                  <Ionicons name="checkmark" size={12} color={COLORS.primary} />
                </View>
                <Text
                  className="text-sm text-gray-800 dark:text-gray-200 leading-6 flex-1"
                  style={{ includeFontPadding: false }}
                >
                  {r}
                </Text>
              </View>
            ))}
          </Card>
        )}

        {/* Requirements */}
        {requirements.length > 0 && (
          <Card padding="md" className="mb-4">
            <CardHeader title="What You&apos;ll Need" subtitle="Minimum qualifications" />
            {requirements.map((r, i) => (
              <View key={i} className="flex-row items-start py-2">
                <View className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/40 items-center justify-center mt-0.5 mr-3 flex-shrink-0">
                  <Ionicons name="star" size={10} color="#2563EB" />
                </View>
                <Text
                  className="text-sm text-gray-800 dark:text-gray-200 leading-6 flex-1"
                  style={{ includeFontPadding: false }}
                >
                  {r}
                </Text>
              </View>
            ))}
          </Card>
        )}

        {/* Skills */}
        {job?.skills && job.skills.length > 0 && (
          <Card padding="md" className="mb-4">
            <CardHeader title="Skills & Technologies" />
            <View className="flex-row flex-wrap gap-2">
              {job.skills.map((s: { id: string; name: string }) => (
                <View
                  key={s.id}
                  className="flex-row items-center bg-gray-100 dark:bg-neutral-700 pl-3 pr-4 py-1.5 rounded-full"
                >
                  <Ionicons name="code-working-outline" size={12} color="#6B7280" style={{ marginRight: 6 }} />
                  <Text
                    className="text-xs font-semibold text-gray-800 dark:text-gray-200"
                    style={{ includeFontPadding: false }}
                  >
                    {s.name}
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Benefits */}
        {benefitsList.length > 0 && (
          <Card padding="md" className="mb-4">
            <CardHeader title="Compensation & Benefits" />
            <View className="flex-row flex-wrap gap-2">
              {benefitsList.map((b, idx) => (
                <View
                  key={idx}
                  className="flex-row items-center bg-green-50 dark:bg-green-900/20 pl-3 pr-4 py-1.5 rounded-full"
                >
                  <Ionicons name="gift-outline" size={12} color={COLORS.success} style={{ marginRight: 6 }} />
                  <Text
                    className="text-xs font-semibold text-green-800 dark:text-green-300"
                    style={{ includeFontPadding: false }}
                  >
                    {b}
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* How to Apply / Instructions */}
        {job?.howToApply ? (
          <Card padding="md" className="mb-4">
            <CardHeader title="How to Apply" />
            <Text
              className="text-sm text-gray-700 dark:text-gray-300 leading-6"
              style={{ includeFontPadding: false }}
            >
              {job.howToApply}
            </Text>
          </Card>
        ) : (
          isSeeker ? (
            <Card padding="md" className="mb-4">
              <CardHeader title="Ready to Apply?" />
              <Text
                className="text-sm text-gray-700 dark:text-gray-300 leading-6 mb-4"
                style={{ includeFontPadding: false }}
              >
                Make sure your profile and resume are updated, then tap &quot;Apply Now&quot; below. The employer will receive your application and may reach out for an interview.
              </Text>
              <View className="flex-row gap-2">
                <Button
                  title="Edit My Profile"
                  variant="outline"
                  size="sm"
                  leftIcon="person-outline"
                  style={{ flex: 1 } as any}
                  onPress={() => router.push('/profile')}
                />
                <Button
                  title={applicationInfo?.hasApplied ? 'View Application' : 'Apply Now'}
                  variant="primary"
                  size="sm"
                  leftIcon={applicationInfo?.hasApplied ? 'document-text-outline' : 'send-outline'}
                  style={{ flex: 1 } as any}
                  onPress={openApply}
                />
              </View>
            </Card>
          ) : isPublic ? (
            <Card padding="md" className="mb-4">
              <CardHeader title="Ready to Apply?" />
              <Text
                className="text-sm text-gray-700 dark:text-gray-300 leading-6 mb-4"
                style={{ includeFontPadding: false }}
              >
                Sign in or create a free EtVacancy account to submit your application. You&apos;ll be able to build your profile, upload your resume, and track all your applications in one place.
              </Text>
              <View className="flex-row gap-2">
                <Button
                  title="Sign In"
                  variant="outline"
                  size="sm"
                  leftIcon="log-in-outline"
                  style={{ flex: 1 } as any}
                  onPress={() => handleAuthToApply('login')}
                />
                <Button
                  title="Sign Up to Apply"
                  variant="primary"
                  size="sm"
                  leftIcon="person-add-outline"
                  style={{ flex: 1 } as any}
                  onPress={() => handleAuthToApply('signup')}
                />
              </View>
            </Card>
          ) : null
        )}

        {/* Equal Opportunity */}
        <Card padding="md" className="mb-4" variant="outlined">
          <View className="flex-row items-start">
            <View className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/30 items-center justify-center mr-3 flex-shrink-0">
              <Ionicons name="scale-outline" size={20} color={COLORS.primary} />
            </View>
            <View className="flex-1">
              <Text
                className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1"
                style={{ includeFontPadding: false }}
              >
                Equal Opportunity Employer
              </Text>
              <Text
                className="text-xs text-gray-600 dark:text-gray-400 leading-5"
                style={{ includeFontPadding: false }}
              >
                We celebrate diversity and are committed to creating an inclusive environment for all employees. Qualified applicants will receive consideration for employment without regard to race, color, religion, sex, or any other protected status.
              </Text>
            </View>
          </View>
        </Card>

        {/* Meta footer */}
        <View className="flex-row justify-between items-center mt-2 mb-6 px-1">
          <Text
            className="text-[11px] text-gray-400 dark:text-gray-500"
            style={{ includeFontPadding: false }}
          >
            Posted by {company?.name ?? 'Employer'}
          </Text>
          <Text
            className="text-[11px] text-gray-400 dark:text-gray-500"
            style={{ includeFontPadding: false }}
          >
            Job ID: #{jobId?.slice(0, 8)}
          </Text>
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      {isSeeker && (
        <View
          className="absolute left-0 right-0 bottom-0 px-5 py-4 bg-white dark:bg-neutral-900 border-t border-gray-100 dark:border-neutral-800"
          style={{ paddingBottom: Math.max(16, safeBottom) }}
        >
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => saveToggle.mutate()}
              activeOpacity={0.7}
              className="w-12 h-12 rounded-xl border border-gray-200 dark:border-neutral-700 items-center justify-center bg-gray-50 dark:bg-neutral-800"
              style={Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : undefined}
            >
              <Ionicons
                name={savedInfo?.isSaved ? 'bookmark' : 'bookmark-outline'}
                size={24}
                color={savedInfo?.isSaved ? COLORS.primary : '#374151'}
              />
            </TouchableOpacity>
            <Button
              title={applicationInfo?.hasApplied ? 'View My Application' : 'Apply Now'}
              variant="primary"
              size="lg"
              leftIcon={applicationInfo?.hasApplied ? 'document-text-outline' : 'send-outline'}
              loading={applyJob.isPending}
              style={{ flex: 1 } as any}
              onPress={openApply}
            />
          </View>
        </View>
      )}
      {isPublic && (
        <View
          className="absolute left-0 right-0 bottom-0 px-5 py-4 bg-white dark:bg-neutral-900 border-t border-gray-100 dark:border-neutral-800"
          style={{ paddingBottom: Math.max(16, safeBottom) }}
        >
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => handleAuthToApply('login')}
              activeOpacity={0.7}
              className="w-12 h-12 rounded-xl border border-gray-200 dark:border-neutral-700 items-center justify-center bg-gray-50 dark:bg-neutral-800"
              style={Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : undefined}
            >
              <Ionicons
                name="bookmark-outline"
                size={24}
                color="#6B7280"
              />
            </TouchableOpacity>
            <Button
              title="Apply Now"
              variant="primary"
              size="lg"
              leftIcon="send-outline"
              style={{ flex: 1 } as any}
              onPress={() => setAuthModalVisible(true)}
            />
          </View>
        </View>
      )}

      {/* Auth Prompt Modal (for unauthenticated applicants) */}
      <Modal
        visible={authModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAuthModalVisible(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          activeOpacity={1}
          onPress={() => setAuthModalVisible(false)}
        >
          <View
            style={{
              width: '100%',
              maxWidth: 440,
              backgroundColor: '#FFFFFF',
              borderRadius: 20,
              padding: 24,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 16,
              elevation: 8,
            }}
            onStartShouldSetResponder={() => true}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="briefcase" size={22} color={COLORS.primary} />
              </View>
              <TouchableOpacity onPress={() => setAuthModalVisible(false)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 18, fontWeight: '700', color: '#0F172A', marginBottom: 4 }}>
              Apply to {job?.title ?? 'Position'}
            </Text>
            <Text style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>
              {company?.name ?? 'Company'} • {job?.city || 'Ethiopia'}
            </Text>

            <View style={{ backgroundColor: '#F8FAFC', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 20 }}>
              <Text style={{ fontSize: 13, color: '#334155', lineHeight: 19 }}>
                Sign in or create a free job seeker account to apply. Your progress will be saved and you can submit your application right after.
              </Text>
            </View>

            <View style={{ gap: 10 }}>
              <Button
                title="Sign In to Apply"
                variant="primary"
                size="lg"
                leftIcon="log-in-outline"
                onPress={() => handleAuthToApply('login')}
              />
              <Button
                title="Create Account (Sign Up)"
                variant="outline"
                size="lg"
                leftIcon="person-add-outline"
                onPress={() => handleAuthToApply('signup')}
              />
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Apply Job Modal */}
      <Modal
        visible={applyModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setApplyModalVisible(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          activeOpacity={1}
          onPress={() => setApplyModalVisible(false)}
        >
          <View
            style={{
              width: '100%',
              maxWidth: 440,
              backgroundColor: '#FFFFFF',
              borderRadius: 20,
              padding: 24,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 16,
              elevation: 8,
            }}
            onStartShouldSetResponder={() => true}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#0F172A' }}>
                Submit Application
              </Text>
              <TouchableOpacity onPress={() => setApplyModalVisible(false)}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Applicant Summary */}
            {user && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F1F5F9', padding: 10, borderRadius: 10, marginBottom: 14 }}>
                <Ionicons name="person-circle-outline" size={22} color={COLORS.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#0F172A' }}>
                    Applying as: {user.fullName || user.firstName || 'Job Seeker'}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#64748B' }}>
                    {user.email}
                  </Text>
                </View>
              </View>
            )}

            <Text style={{ fontSize: 13, color: '#475569', marginBottom: 8 }}>
              Cover Letter / Message to Employer (Optional):
            </Text>

            <TextInput
              style={{
                borderWidth: 1,
                borderColor: '#CBD5E1',
                borderRadius: 12,
                padding: 12,
                fontSize: 14,
                color: '#0F172A',
                height: 120,
                textAlignVertical: 'top',
                marginBottom: 18,
                backgroundColor: '#F8FAFC',
              }}
              multiline
              placeholder="Introduce yourself and explain why you're a great fit for this role..."
              placeholderTextColor="#94A3B8"
              value={coverLetter}
              onChangeText={setCoverLetter}
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Button
                  title="Cancel"
                  variant="outline"
                  size="md"
                  onPress={() => setApplyModalVisible(false)}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  title="Submit Application"
                  variant="primary"
                  size="md"
                  loading={applyJob.isPending}
                  onPress={() => {
                    setApplyModalVisible(false);
                    applyJob.mutate({ coverLetter });
                  }}
                />
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </Screen>
  );
}
