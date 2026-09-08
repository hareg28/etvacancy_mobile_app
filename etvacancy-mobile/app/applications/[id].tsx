import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback, useMemo } from 'react';
import { Screen } from '@components/ui/Screen';
import { Card, CardHeader } from '@components/ui/Card';
import { Avatar } from '@components/ui/Avatar';
import { Divider } from '@components/ui/Divider';
import Button from '@components/ui/Button';
import { Ionicons } from '@expo/vector-icons';
import { applications as applicationsApi, interviews as interviewsApi } from '@api/index';
import { useAuthStore } from '@store/index';
import { COLORS, APPLICATION_STATUS_LABELS, APPLICATION_STATUS_NEXT_ACTIONS, EMPLOYMENT_TYPES } from '@constants/index';
import { formatDate, formatDateTime, truncate, getFullName } from '@utils/index';
import type { JobApplication, Interview } from '@/types/index';
import { Image } from 'expo-image';

function StatusPill({ status }: { status: string }) {
  const cfg = APPLICATION_STATUS_LABELS[status];
  const bgMap: Record<string, string> = {
    PENDING: 'bg-amber-100 dark:bg-amber-900/30',
    REVIEWED: 'bg-blue-100 dark:bg-blue-900/30',
    SHORTLISTED: 'bg-primary-100 dark:bg-primary-900/30',
    INTERVIEW: 'bg-purple-100 dark:bg-purple-900/30',
    OFFERED: 'bg-green-100 dark:bg-green-900/30',
    HIRED: 'bg-green-100 dark:bg-green-900/30',
    REJECTED: 'bg-red-100 dark:bg-red-900/30',
    WITHDRAWN: 'bg-gray-100 dark:bg-neutral-700',
  };
  const textMap: Record<string, string> = {
    PENDING: 'text-amber-700 dark:text-amber-400',
    REVIEWED: 'text-blue-700 dark:text-blue-400',
    SHORTLISTED: 'text-primary-700 dark:text-primary-300',
    INTERVIEW: 'text-purple-700 dark:text-purple-400',
    OFFERED: 'text-green-700 dark:text-green-400',
    HIRED: 'text-green-700 dark:text-green-400',
    REJECTED: 'text-red-700 dark:text-red-400',
    WITHDRAWN: 'text-gray-700 dark:text-gray-400',
  };
  return (
    <View className={`px-3 py-1.5 rounded-full flex-row items-center ${bgMap[status] ?? bgMap.PENDING}`}>
      <Ionicons name={(cfg?.icon as keyof typeof Ionicons.glyphMap) ?? 'time-outline'} size={12} color={cfg?.color} style={{ marginRight: 5 }} />
      <Text className={`text-xs font-bold ${textMap[status] ?? textMap.PENDING}`} style={{ includeFontPadding: false }}>
        {cfg?.label ?? status}
      </Text>
    </View>
  );
}

function TimelineRow({
  icon,
  title,
  subtitle,
  time,
  color,
  isLast,
  active,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  time?: string;
  color: string;
  isLast?: boolean;
  active?: boolean;
}) {
  return (
    <View className="flex-row">
      <View className="items-center mr-4">
        <View
          className={`w-10 h-10 rounded-2xl items-center justify-center border-2 border-white dark:border-neutral-900 shadow-card-sm`}
          style={{ backgroundColor: color }}
        >
          <Ionicons name={icon} size={18} color="#FFFFFF" />
        </View>
        {!isLast && <View className="w-0.5 flex-1 bg-gray-200 dark:bg-neutral-700 mt-1" style={{ minHeight: 30 }} />}
      </View>
      <View className={`flex-1 ${!isLast ? 'pb-5' : ''}`}>
        <View className="flex-row items-center justify-between mb-0.5">
          <Text className={`text-sm font-bold ${active ? 'text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-300'}`} style={{ includeFontPadding: false }}>
            {title}
          </Text>
          {time && (
            <Text className="text-[11px] text-gray-400 dark:text-gray-500" style={{ includeFontPadding: false }}>
              {time}
            </Text>
          )}
        </View>
        {subtitle ? (
          <Text className="text-xs text-gray-500 dark:text-gray-400 leading-5" style={{ includeFontPadding: false }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export default function ApplicationDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const id = params.id;
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isSeeker = user?.role === 'JOB_SEEKER';
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<'overview' | 'interviews'>('overview');

  const { data: application, isLoading } = useQuery<JobApplication | null>({
    queryKey: ['applications', 'detail', id],
    queryFn: async () => {
      if (!id) return null;
      return applicationsApi.get(id);
    },
    enabled: !!id,
  });

  const { data: interviews = [] } = useQuery<Interview[]>({
    queryKey: ['applications', 'interviews', id],
    queryFn: () => {
      if (!id) return Promise.resolve([]);
      try {
        return interviewsApi.list({ applicationId: id } as any).then((r: any) => r.data ?? []);
      } catch {
        return [];
      }
    },
    enabled: !!id,
  });

  const updateStatus = useMutation({
    mutationFn: ({ status, notes }: { status: string; notes?: string }) => {
      if (!id) return Promise.reject();
      return applicationsApi.updateStatus(id, status, notes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });

  const withdraw = useMutation({
    mutationFn: () => {
      if (!id) return Promise.reject();
      return applicationsApi.withdraw(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      Alert.alert('Application Withdrawn', 'Good luck on your next opportunity!');
    },
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['applications'] }),
      queryClient.invalidateQueries({ queryKey: ['applications', 'interviews'] }),
    ]);
    setRefreshing(false);
  }, [queryClient]);

  if (!application && !isLoading) {
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
            <Ionicons name="document-text-outline" size={56} color={COLORS.danger} />
          </View>
          <Text className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2" style={{ includeFontPadding: false }}>Application Not Found</Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400 text-center px-10 mb-8" style={{ includeFontPadding: false }}>
            This application may have been withdrawn or removed.
          </Text>
          <Button
            title={isSeeker ? 'My Applications' : 'Applicants'}
            variant="primary"
            size="md"
            leftIcon="list-outline"
            onPress={() => router.back()}
          />
        </View>
      </Screen>
    );
  }

  const job = application?.job;
  const applicant = application?.applicant;
  const company = job?.company;

  const nextActions = useMemo(() => {
    if (isSeeker) {
      if (application?.status === 'PENDING' || application?.status === 'REVIEWED') {
        return [
          { key: 'withdraw', title: 'Withdraw Application', variant: 'danger' as const, icon: 'close-circle-outline' },
        ];
      }
      return [];
    }
    // Employer side
    const next = APPLICATION_STATUS_NEXT_ACTIONS[application?.status ?? ''];
    return (next ?? [])
      .filter((a: any) => a.status !== 'WITHDRAWN' && a.status !== 'REJECTED_BY_SYSTEM')
      .map((a: any) => ({
        key: a.status,
        title: a.label,
        variant: (a.status === 'REJECTED' ? 'danger' : a.status === 'HIRED' || a.status === 'OFFERED' ? 'primary' : 'secondary') as any,
        icon: (a.icon ?? 'arrow-forward-outline') as keyof typeof Ionicons.glyphMap,
        status: a.status,
      }));
  }, [application?.status, isSeeker]);

  const timeline = useMemo(() => {
    const items: any[] = [];
    items.push({ key: 'applied', icon: 'send', title: 'Application Submitted', subtitle: isSeeker ? 'You applied to this role' : 'Candidate submitted their application', time: application?.appliedAt ? formatDateTime(application.appliedAt) : undefined, color: COLORS.primary, active: true });
    if (application?.reviewedAt || application?.status !== 'PENDING') {
      items.push({ key: 'reviewed', icon: 'eye-outline', title: 'Application Reviewed', subtitle: 'An employer member of the team reviewed this application', time: application?.reviewedAt ? formatDateTime(application.reviewedAt) : undefined, color: '#2563EB', active: true });
    }
    if (application?.shortlistedAt || ['SHORTLISTED', 'INTERVIEW', 'OFFERED', 'HIRED'].includes(application?.status ?? '')) {
      items.push({ key: 'shortlisted', icon: 'heart-outline', title: 'Shortlisted', subtitle: 'Candidate moved to the shortlist', time: application?.shortlistedAt ? formatDateTime(application.shortlistedAt) : undefined, color: COLORS.primary, active: true });
    }
    if ((interviews?.length ?? 0) > 0 || application?.status === 'INTERVIEW' || application?.status === 'OFFERED' || application?.status === 'HIRED') {
      items.push({ key: 'interview', icon: 'calendar', title: 'Interview', subtitle: (interviews?.length ?? 0) > 0 ? `${interviews.length} interview${(interviews.length ?? 0) > 1 ? 's' : ''} scheduled` : 'Scheduled for interview', time: interviews?.[0]?.scheduledAt ? formatDateTime(interviews[0].scheduledAt) : undefined, color: '#9333EA', active: true });
    }
    if (application?.status === 'OFFERED' || application?.status === 'HIRED') {
      items.push({ key: 'offer', icon: 'gift-outline', title: 'Offer Extended', color: COLORS.success, active: true });
    }
    if (application?.status === 'HIRED') {
      items.push({ key: 'hired', icon: 'checkmark-done-circle', title: 'Candidate Hired 🎉', subtitle: 'Welcome aboard!', time: application?.hiredAt ? formatDateTime(application.hiredAt) : undefined, color: COLORS.success, active: true, isLast: true });
    }
    if (application?.status === 'REJECTED') {
      items.push({ key: 'rejected', icon: 'close-circle', title: 'Application Closed', subtitle: application?.hiringNotes ?? 'Not selected for this role', time: application?.rejectedAt ? formatDateTime(application.rejectedAt) : undefined, color: COLORS.danger, active: true, isLast: true });
    }
    if (application?.status === 'WITHDRAWN') {
      items.push({ key: 'withdrawn', icon: 'arrow-undo', title: 'Application Withdrawn', subtitle: 'Candidate withdrew from this process', time: application?.withdrawnAt ? formatDateTime(application.withdrawnAt) : undefined, color: '#6B7280', active: true, isLast: true });
    }
    if (items.length > 0 && !items[items.length - 1].isLast) {
      items[items.length - 1].isLast = true;
    }
    return items;
  }, [application, interviews, isSeeker]);

  const doAction = (action: any) => {
    if (isSeeker && action.key === 'withdraw') {
      Alert.alert('Withdraw Application', 'Are you sure? This cannot be undone.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Yes, Withdraw', style: 'destructive', onPress: () => withdraw.mutate() },
      ]);
      return;
    }
    if (!isSeeker && action.status) {
      const status = action.status;
      Alert.alert(
        `Update Status → ${action.title}`,
        `Are you sure you want to move this application to "${action.title}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Confirm',
            onPress: () => {
              if (status === 'REJECTED') {
                updateStatus.mutate({ status, notes: 'Application status marked as Rejected.' });
              } else if (status === 'INTERVIEW') {
                updateStatus.mutate({ status });
              } else {
                updateStatus.mutate({ status });
              }
            },
          },
        ],
      );
    }
  };

  return (
    <Screen scrollable={false}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mb-4 mt-2">
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <View className="w-10 h-10 rounded-xl bg-white dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 items-center justify-center shadow-card-sm">
              <Ionicons name="arrow-back" size={22} color="#111827" />
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => Alert.alert('Share Application', 'Coming soon.')}
            activeOpacity={0.7}
            className="w-10 h-10 rounded-xl bg-white dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 items-center justify-center shadow-card-sm"
          >
            <Ionicons name="share-outline" size={20} color="#111827" />
          </TouchableOpacity>
        </View>

        {/* Status Hero */}
        <Card padding="lg" variant="elevated" className="mb-4">
          <View className="flex-row items-start justify-between mb-3">
            <View className="flex-1 pr-3">
              <Text className="text-[11px] font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wide mb-1" style={{ includeFontPadding: false }}>
                Application Status
              </Text>
              <View className="mb-2">
                <StatusPill status={application?.status ?? 'PENDING'} />
              </View>
              {application?.status === 'REJECTED' && application?.hiringNotes ? (
                <Text className="text-xs text-red-600 dark:text-red-400 leading-5 italic" style={{ includeFontPadding: false }}>
                  &ldquo;{application.hiringNotes}&rdquo;
                </Text>
              ) : application?.hiringNotes ? (
                <Text className="text-xs text-gray-500 dark:text-gray-400 leading-5 italic" style={{ includeFontPadding: false }}>
                  &ldquo;{truncate(application.hiringNotes, 180)}&rdquo;
                </Text>
              ) : null}
            </View>
          </View>
          <View className="flex-row items-center justify-between mt-2 pt-3 border-t border-gray-100 dark:border-neutral-700">
            <View className="flex-row items-center">
              <Ionicons name="calendar-outline" size={14} color="#6B7280" />
              <Text className="text-[11px] text-gray-500 dark:text-gray-400 ml-1.5 mr-4" style={{ includeFontPadding: false }}>
                Applied {application?.appliedAt ? formatDate(application.appliedAt, 'relative') : '—'}
              </Text>
            </View>
            <Text className="text-[11px] text-gray-400 dark:text-gray-500" style={{ includeFontPadding: false }}>
              #{id?.slice(0, 8).toUpperCase()}
            </Text>
          </View>
        </Card>

        {/* Tabs */}
        <View className="flex-row bg-gray-100 dark:bg-neutral-800 rounded-2xl p-1 mb-5">
          {(['overview', 'interviews'] as const).map((t) => {
            const active = t === tab;
            return (
              <TouchableOpacity
                key={t}
                onPress={() => setTab(t)}
                activeOpacity={0.8}
                className={`flex-1 rounded-xl py-2.5 items-center ${active ? 'bg-white dark:bg-neutral-700 shadow-card-sm' : ''}`}
              >
                <View className="flex-row items-center gap-2">
                  <Ionicons
                    name={t === 'overview' ? 'document-text-outline' : 'calendar-outline'}
                    size={16}
                    color={active ? COLORS.primary : '#6B7280'}
                  />
                  <Text
                    className={`text-sm font-semibold ${active ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}
                    style={{ includeFontPadding: false }}
                  >
                    {t === 'overview' ? 'Overview' : `Interviews (${interviews?.length ?? 0})`}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {tab === 'overview' ? (
          <>
            {/* Job Card */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => job?.id && router.push(`/jobs/${job.id}`)}
              className="mb-4"
            >
              <Card padding="md" variant="elevated">
                <CardHeader
                  title="Position Applied For"
                  right={
                    <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                  }
                />
                <View className="flex-row items-center">
                  <View className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-900/30 border border-primary-100 dark:border-primary-900 items-center justify-center mr-4 overflow-hidden">
                    {company?.logo ? (
                      <Image source={{ uri: company.logo }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                    ) : (
                      <Ionicons name="business" size={24} color={COLORS.primary} />
                    )}
                  </View>
                  <View className="flex-1 pr-2">
                    <Text className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-0.5 leading-tight" style={{ includeFontPadding: false }}>
                      {job?.title ?? 'Vacancy'}
                    </Text>
                    <Text className="text-sm font-semibold text-primary-700 dark:text-primary-300 mb-1" style={{ includeFontPadding: false }}>
                      {company?.name ?? 'Company'}
                    </Text>
                    <View className="flex-row items-center flex-wrap gap-2">
                      {job?.type && (
                        <Text className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-neutral-700 px-2 py-0.5 rounded-full" style={{ includeFontPadding: false }}>
                          {job.type.replace(/_/g, ' ')}
                        </Text>
                      )}
                      {job?.employmentType && (
                        <Text className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-neutral-700 px-2 py-0.5 rounded-full" style={{ includeFontPadding: false }}>
                          {EMPLOYMENT_TYPES.find((e) => e.value === job.employmentType)?.label ?? job.employmentType.replace(/_/g, ' ')}
                        </Text>
                      )}
                      {job?.city && (
                        <Text className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-neutral-700 px-2 py-0.5 rounded-full flex-row items-center" style={{ includeFontPadding: false }}>
                          📍 {job.city}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>

            {/* Applicant Card (for employer) */}
            {!isSeeker && applicant && (
              <Card padding="md" className="mb-4" variant="elevated">
                <CardHeader title={isSeeker ? 'Your Profile' : 'Applicant Profile'} />
                <View className="flex-row items-center mb-3">
                  <Avatar
                    uri={applicant.avatar ?? undefined}
                    firstName={applicant.firstName}
                    lastName={applicant.lastName}
                    email={applicant.email}
                    size="xl"
                    ring
                  />
                  <View className="flex-1 ml-4 pr-2">
                    <Text className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-0.5" style={{ includeFontPadding: false }}>
                      {getFullName(applicant.firstName, applicant.lastName, applicant.fullName)}
                    </Text>
                    <Text className="text-sm text-gray-500 dark:text-gray-400 mb-1" style={{ includeFontPadding: false }}>
                      {applicant.jobSeekerProfile?.headline ?? applicant.email}
                    </Text>
                    <View className="flex-row flex-wrap gap-1.5 mt-1">
                      {applicant.jobSeekerProfile?.currentSalary && (
                        <View className="bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">
                          <Text className="text-[10px] font-semibold text-green-700 dark:text-green-400" style={{ includeFontPadding: false }}>
                            Current: {applicant.jobSeekerProfile.currentSalary}
                          </Text>
                        </View>
                      )}
                      {applicant.jobSeekerProfile?.expectedSalary && (
                        <View className="bg-primary-50 dark:bg-primary-900/30 px-2 py-0.5 rounded-full">
                          <Text className="text-[10px] font-semibold text-primary-700 dark:text-primary-300" style={{ includeFontPadding: false }}>
                            Expecting: {applicant.jobSeekerProfile.expectedSalary}
                          </Text>
                        </View>
                      )}
                      {applicant.jobSeekerProfile?.isOpenToWork && (
                        <View className="bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                          <Text className="text-[10px] font-semibold text-blue-700 dark:text-blue-400" style={{ includeFontPadding: false }}>
                            Open to Work
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
                <View className="flex-row gap-2">
                  <Button
                    title="Message"
                    variant="outline"
                    size="sm"
                    leftIcon="chatbubble-ellipses-outline"
                    style={{ flex: 1 } as any}
                    onPress={() => Alert.alert('Contact Candidate', `Email: ${application?.applicant?.email ?? 'N/A'}`)}
                  />
                  <Button
                    title="View Full Profile"
                    variant="secondary"
                    size="sm"
                    leftIcon="person-outline"
                    style={{ flex: 1 } as any}
                    onPress={() => Alert.alert('Candidate Profile', `${application?.applicant?.firstName ?? ''} ${application?.applicant?.lastName ?? ''}\nEmail: ${application?.applicant?.email ?? 'N/A'}`)}
                  />
                </View>
              </Card>
            )}

            {/* Cover Letter */}
            {application?.coverLetter && (
              <Card padding="md" className="mb-4">
                <CardHeader title="Cover Letter" leftIcon={<Ionicons name="document-text-outline" size={18} color={COLORS.primary} />} />
                <Text className="text-sm text-gray-700 dark:text-gray-300 leading-6 whitespace-pre-line" style={{ includeFontPadding: false }}>
                  {application.coverLetter}
                </Text>
              </Card>
            )}

            {/* Resume / Attachments */}
            {application?.resume && (
              <Card padding="md" className="mb-4">
                <CardHeader title="Attachments" />
                <TouchableOpacity
                  onPress={() => Alert.alert('Resume File', `Downloaded ${(application.resume as any)?.originalName ?? 'Resume.pdf'}`)}
                  activeOpacity={0.7}
                  className="flex-row items-center p-3 bg-gray-50 dark:bg-neutral-700/50 rounded-xl"
                >
                  <View className="w-11 h-11 rounded-xl bg-red-50 dark:bg-red-900/30 items-center justify-center mr-3">
                    <Ionicons name="document-text" size={22} color={COLORS.danger} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-0.5" style={{ includeFontPadding: false }}>
                      {(application.resume as { originalName?: string })?.originalName ?? 'Resume.pdf'}
                    </Text>
                    <Text className="text-[11px] text-gray-500 dark:text-gray-400" style={{ includeFontPadding: false }}>
                      {(application.resume as { fileType?: string })?.fileType ?? 'PDF'} • uploaded
                    </Text>
                  </View>
                  <Ionicons name="download-outline" size={18} color={COLORS.primary} />
                </TouchableOpacity>
              </Card>
            )}

            {/* Status Timeline */}
            <Card padding="md" className="mb-4">
              <CardHeader title={isSeeker ? 'Process Timeline' : 'Evaluation Timeline'} />
              <View className="pt-3">
                {timeline.map((t, idx) => (
                  <TimelineRow
                    key={t.key}
                    icon={t.icon}
                    title={t.title}
                    subtitle={t.subtitle}
                    time={t.time}
                    color={t.color}
                    active={t.active}
                    isLast={t.isLast || idx === timeline.length - 1}
                  />
                ))}
              </View>
            </Card>
          </>
        ) : (
          <>
            {!isSeeker && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  updateStatus.mutate({ status: 'INTERVIEW' });
                  Alert.alert('Interview Scheduled', 'Candidate status updated to Interview stage.');
                }}
                className="flex-row items-center p-4 mb-4 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-700"
              >
                <View className="w-11 h-11 rounded-xl bg-white/20 items-center justify-center mr-4">
                  <Ionicons name="add" size={22} color="#FFFFFF" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-bold text-white mb-0.5" style={{ includeFontPadding: false }}>
                    Schedule Interview
                  </Text>
                  <Text className="text-xs text-white/80" style={{ includeFontPadding: false }}>
                    Invite candidate for an interview
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            {(interviews?.length ?? 0) === 0 ? (
              <Card padding="lg" className="mb-4">
                <View className="items-center py-8">
                  <View className="w-20 h-20 bg-purple-50 dark:bg-purple-900/20 rounded-full items-center justify-center mb-4">
                    <Ionicons name="calendar-clear-outline" size={36} color="#9333EA" />
                  </View>
                  <Text className="text-base font-bold text-gray-900 dark:text-gray-100 mb-1" style={{ includeFontPadding: false }}>
                    No Interviews Yet
                  </Text>
                  <Text className="text-sm text-gray-500 dark:text-gray-400 text-center mb-4" style={{ includeFontPadding: false }}>
                    {isSeeker
                      ? 'If shortlisted, interviews will be scheduled here.'
                      : 'Schedule an interview with this candidate.'}
                  </Text>
                </View>
              </Card>
            ) : (
              interviews?.map((i: Interview) => (
                <Card padding="md" key={i.id} className="mb-3" variant="elevated">
                  <View className="flex-row items-start mb-3">
                    <View className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/30 items-center justify-center mr-3 flex-shrink-0">
                      <Ionicons name="calendar" size={24} color="#9333EA" />
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-start justify-between mb-1">
                        <Text className="text-base font-bold text-gray-900 dark:text-gray-100 flex-1 pr-2" style={{ includeFontPadding: false }}>
                          {truncate(i.title ?? 'Interview', 30)}
                        </Text>
                        <View className={`px-2.5 py-1 rounded-full ${
                          i.status === 'SCHEDULED' ? 'bg-primary-100 dark:bg-primary-900/30' :
                          i.status === 'COMPLETED' ? 'bg-green-100 dark:bg-green-900/30' :
                          i.status === 'CANCELLED' ? 'bg-gray-100 dark:bg-neutral-700' :
                          'bg-amber-100 dark:bg-amber-900/30'
                        }`}>
                          <Text className={`text-[10px] font-bold ${
                            i.status === 'SCHEDULED' ? 'text-primary-700 dark:text-primary-300' :
                            i.status === 'COMPLETED' ? 'text-green-700 dark:text-green-400' :
                            i.status === 'CANCELLED' ? 'text-gray-700 dark:text-gray-400' :
                            'text-amber-700 dark:text-amber-400'
                          }`} style={{ includeFontPadding: false }}>
                            {i.status}
                          </Text>
                        </View>
                      </View>
                      <Text className="text-xs text-gray-500 dark:text-gray-400 mb-2" style={{ includeFontPadding: false }}>
                        {i.type} • {i.durationMinutes ?? 30} minutes
                      </Text>
                      <View className="flex-row items-center gap-3">
                        <View className="flex-row items-center">
                          <Ionicons name="calendar-outline" size={13} color={COLORS.primary} />
                          <Text className="text-xs font-semibold text-gray-700 dark:text-gray-300 ml-1" style={{ includeFontPadding: false }}>
                            {formatDate(i.scheduledAt, 'short')}
                          </Text>
                        </View>
                        <View className="flex-row items-center">
                          <Ionicons name="time-outline" size={13} color={COLORS.primary} />
                          <Text className="text-xs font-semibold text-gray-700 dark:text-gray-300 ml-1" style={{ includeFontPadding: false }}>
                            {formatDate(i.scheduledAt, 'time')}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                  {(i.location || i.meetingUrl) && (
                    <View className="flex-row items-start p-3 bg-gray-50 dark:bg-neutral-700/50 rounded-xl mb-3">
                      <Ionicons
                        name={i.meetingUrl ? 'videocam-outline' : 'location-outline'}
                        size={16}
                        color={COLORS.primary}
                        style={{ marginTop: 1, marginRight: 8 }}
                      />
                      <View className="flex-1">
                        <Text className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5" style={{ includeFontPadding: false }}>
                          {i.meetingUrl ? 'Meeting Link' : 'Location'}
                        </Text>
                        <Text className="text-xs font-medium text-gray-800 dark:text-gray-200" style={{ includeFontPadding: false }}>
                          {truncate(i.location ?? i.meetingUrl ?? 'TBD', 40)}
                        </Text>
                      </View>
                    </View>
                  )}
                  <View className="flex-row gap-2">
                    <Button
                      title="View Details"
                      variant="outline"
                      size="sm"
                      leftIcon="eye-outline"
                      style={{ flex: 1 } as any}
                      onPress={() => Alert.alert('Interview Details', `Interview: ${i.title}\nScheduled: ${formatDate(i.scheduledAt, 'full')}\nType: ${i.type}`)}
                    />
                    {i.status === 'SCHEDULED' && i.meetingUrl && (
                      <Button
                        title="Join"
                        variant="primary"
                        size="sm"
                        leftIcon="videocam"
                        style={{ flex: 0.8 } as any}
                        onPress={() => Alert.alert('Join Meeting', `Opening video call link: ${i.meetingUrl}`)}
                      />
                    )}
                  </View>
                </Card>
              ))
            )}
          </>
        )}
      </ScrollView>

      {/* Sticky action bar */}
      <View
        className="absolute left-0 right-0 bottom-0 px-5 py-4 bg-white dark:bg-neutral-900 border-t border-gray-100 dark:border-neutral-800"
        style={{ paddingBottom: Math.max(16, 16) }}
      >
        {nextActions.length > 0 ? (
          <View className="flex-row gap-2 flex-wrap">
            {nextActions.slice(0, 2).map((a, idx) => (
              <Button
                key={a.key}
                title={a.title}
                variant={a.variant}
                size="md"
                leftIcon={a.icon as any}
                style={{ flex: 1, minWidth: 120 } as any}
                onPress={() => doAction(a)}
                loading={(a.key === 'withdraw' && withdraw.isPending) || (idx === 0 && updateStatus.isPending)}
              />
            ))}
          </View>
        ) : (
          <Button
            title={isSeeker ? 'Browse More Jobs' : 'Done'}
            variant="primary"
            size="md"
            leftIcon={isSeeker ? 'search-outline' : 'checkmark'}
            fullWidth
            onPress={() => {
              if (isSeeker) {
                router.push('/jobs');
              } else {
                router.back();
              }
            }}
          />
        )}
      </View>
    </Screen>
  );
}
