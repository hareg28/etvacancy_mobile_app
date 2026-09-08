import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { Screen } from '@components/ui/Screen';
import { Card, CardHeader } from '@components/ui/Card';
import { Avatar } from '@components/ui/Avatar';
import Button from '@components/ui/Button';
import { Ionicons } from '@expo/vector-icons';
import { companies as companiesApi } from '@api/index';
import { COLORS, COMPANY_SIZES, EMPLOYMENT_TYPES } from '@constants/index';
import { formatDate, truncate } from '@utils/index';
import type { Company, Job } from '@/types/index';
import { Image } from 'expo-image';

export default function CompanyDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const companyId = params.id;
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<'about' | 'jobs'>('about');

  const { data: company, isLoading } = useQuery<Company | null>({
    queryKey: ['companies', 'detail', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      return companiesApi.get(companyId);
    },
    enabled: !!companyId,
  });

  const { data: jobs } = useQuery<{ data: Job[]; total: number }>({
    queryKey: ['companies', 'jobs', companyId],
    queryFn: () => {
      if (!companyId) return Promise.resolve({ data: [], total: 0 });
      return companiesApi.jobs(companyId, { limit: 20 });
    },
    enabled: !!companyId,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['companies'] }),
      queryClient.invalidateQueries({ queryKey: ['companies', 'jobs'] }),
    ]);
    setRefreshing(false);
  }, [queryClient]);

  if (!company && !isLoading) {
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
            <Ionicons name="business-outline" size={56} color={COLORS.danger} />
          </View>
          <Text
            className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2"
            style={{ includeFontPadding: false }}
          >
            Company Not Found
          </Text>
          <Text
            className="text-sm text-gray-500 dark:text-gray-400 text-center px-10 mb-8"
            style={{ includeFontPadding: false }}
          >
            This company profile may have been removed.
          </Text>
          <Button title="Browse Companies" variant="primary" size="md" leftIcon="business-outline" onPress={() => router.push('/companies')} />
        </View>
      </Screen>
    );
  }

  const verificationIcon =
    company?.verificationStatus === 'VERIFIED'
      ? { name: 'shield-checkmark' as const, color: COLORS.success, bg: 'bg-green-100 dark:bg-green-900/30', label: 'Verified' }
      : company?.verificationStatus === 'PENDING'
      ? { name: 'shield-half' as const, color: COLORS.accent, bg: 'bg-amber-100 dark:bg-amber-900/30', label: 'Under Review' }
      : company?.verificationStatus === 'REJECTED'
      ? { name: 'shield' as const, color: COLORS.danger, bg: 'bg-red-100 dark:bg-red-900/30', label: 'Rejected' }
      : { name: 'shield-outline' as const, color: '#9CA3AF', bg: 'bg-gray-100 dark:bg-neutral-700', label: 'Unverified' };

  const sizeLabel = COMPANY_SIZES.find((s) => s.value === (company?.size ?? '1_10'));

  const [isFollowing, setIsFollowing] = useState(false);
  const followCompany = () => {
    setIsFollowing((prev) => {
      const next = !prev;
      Alert.alert(next ? 'Following' : 'Unfollowed', next ? `You are now following ${company?.name ?? 'this company'}.` : `Unfollowed ${company?.name ?? 'this company'}.`);
      return next;
    });
  };

  return (
    <Screen scrollable={false}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 60 }}
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
          <TouchableOpacity
            onPress={() => Alert.alert('Share Company', `EtVacancy Link: https://etvacancy.com/companies/${companyId}`)}
            activeOpacity={0.7}
            className="w-10 h-10 rounded-xl bg-white dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 items-center justify-center shadow-card-sm"
          >
            <Ionicons name="share-outline" size={20} color="#111827" />
          </TouchableOpacity>
        </View>

        {/* Banner */}
        <View className="-mx-5 -mt-6 mb-5 relative rounded-b-3xl overflow-hidden">
          <View className="h-36 bg-gradient-to-br from-primary-700 via-primary-600 to-primary-500">
            {company?.bannerImage ? (
              <Image source={{ uri: company.bannerImage }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
            ) : (
              <View className="absolute inset-0 opacity-10">
                <View className="absolute top-8 left-8 w-28 h-28 rounded-full bg-white" />
                <View className="absolute top-4 right-12 w-20 h-20 rounded-full bg-white" />
                <View className="absolute bottom-6 left-1/3 w-32 h-32 rounded-full bg-white" />
              </View>
            )}
          </View>
          <View className="px-5 pb-5">
            <View className="-mt-14 flex-row items-end justify-between">
              <View className="w-24 h-24 rounded-2xl bg-white dark:bg-neutral-800 border-4 border-white dark:border-neutral-900 items-center justify-center shadow-card-lg overflow-hidden">
                {company?.logo ? (
                  <Image source={{ uri: company.logo }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                ) : (
                  <Ionicons name="business" size={40} color={COLORS.primary} />
                )}
              </View>
              <View className={`px-3 py-1.5 rounded-full flex-row items-center gap-1.5 ${verificationIcon.bg} mb-1.5`}>
                <Ionicons name={verificationIcon.name} size={14} color={verificationIcon.color} />
                <Text
                  className={`text-[11px] font-bold ${
                    company?.verificationStatus === 'VERIFIED'
                      ? 'text-green-700 dark:text-green-400'
                      : company?.verificationStatus === 'PENDING'
                      ? 'text-amber-700 dark:text-amber-400'
                      : 'text-gray-700 dark:text-gray-400'
                  }`}
                  style={{ includeFontPadding: false }}
                >
                  {verificationIcon.label}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Title */}
        <View className="mb-5">
          <Text
            className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1"
            style={{ includeFontPadding: false }}
          >
            {company?.name}
          </Text>
          {company?.tagline && (
            <Text
              className="text-sm text-gray-600 dark:text-gray-400 mb-2"
              style={{ includeFontPadding: false }}
            >
              {company.tagline}
            </Text>
          )}
          <View className="flex-row flex-wrap gap-2 mt-3">
            {company?.industry && (
              <View className="bg-primary-50 dark:bg-primary-900/30 px-3 py-1.5 rounded-full">
                <Text
                  className="text-xs font-semibold text-primary-700 dark:text-primary-300"
                  style={{ includeFontPadding: false }}
                >
                  {company.industry}
                </Text>
              </View>
            )}
            {sizeLabel && (
              <View className="bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-full">
                <Text
                  className="text-xs font-semibold text-blue-700 dark:text-blue-400"
                  style={{ includeFontPadding: false }}
                >
                  {sizeLabel.label}
                </Text>
              </View>
            )}
            {company?.foundedYear && (
              <View className="bg-amber-50 dark:bg-amber-900/30 px-3 py-1.5 rounded-full">
                <Text
                  className="text-xs font-semibold text-amber-700 dark:text-amber-400"
                  style={{ includeFontPadding: false }}
                >
                  Est. {company.foundedYear}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Actions */}
        <View className="flex-row gap-3 mb-5">
          <Button
            title="Follow Company"
            variant="primary"
            size="md"
            leftIcon="person-add-outline"
            style={{ flex: 1 } as any}
            onPress={followCompany}
          />
          <Button
            title="View Jobs"
            variant="outline"
            size="md"
            leftIcon="briefcase-outline"
            style={{ flex: 1 } as any}
            onPress={() => setTab('jobs')}
          />
        </View>

        {/* Tabs */}
        <View className="flex-row bg-gray-100 dark:bg-neutral-800 rounded-2xl p-1 mb-5">
          {(['about', 'jobs'] as const).map((t) => {
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
                    name={t === 'about' ? 'information-circle-outline' : 'briefcase-outline'}
                    size={16}
                    color={active ? COLORS.primary : '#6B7280'}
                  />
                  <Text
                    className={`text-sm font-semibold ${active ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}
                    style={{ includeFontPadding: false }}
                  >
                    {t === 'about' ? 'About' : `Jobs (${jobs?.total ?? 0})`}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {tab === 'about' ? (
          <>
            {/* Location & contact summary */}
            <Card padding="md" className="mb-4">
              <CardHeader title="Company Overview" />
              <View className="flex-row items-start py-2.5">
                <View className="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-900/30 items-center justify-center mr-3 mt-0.5">
                  <Ionicons name="location-outline" size={18} color={COLORS.primary} />
                </View>
                <View className="flex-1">
                  <Text className="text-[11px] font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wide mb-0.5">Headquarters</Text>
                  <Text className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {[company?.headquarters, company?.city, company?.region, company?.country].filter(Boolean).join(', ') || '—'}
                  </Text>
                </View>
              </View>
              <View className="border-b border-gray-100 dark:border-neutral-700 my-1" />
              <View className="flex-row items-start py-2.5">
                <View className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/30 items-center justify-center mr-3 mt-0.5">
                  <Ionicons name="people-outline" size={18} color="#2563EB" />
                </View>
                <View className="flex-1">
                  <Text className="text-[11px] font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wide mb-0.5">Company Size</Text>
                  <Text className="text-sm font-medium text-gray-900 dark:text-gray-100">{sizeLabel?.label ?? '—'}</Text>
                </View>
              </View>
              {company?.website && (
                <>
                  <View className="border-b border-gray-100 dark:border-neutral-700 my-1" />
                  <View className="flex-row items-start py-2.5">
                    <View className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-900/30 items-center justify-center mr-3 mt-0.5">
                      <Ionicons name="globe-outline" size={18} color="#9333EA" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-[11px] font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wide mb-0.5">Website</Text>
                      <Text className="text-sm font-medium text-primary-700 dark:text-primary-300">{company.website}</Text>
                    </View>
                  </View>
                </>
              )}
            </Card>

            {/* About */}
            {company?.description && (
              <Card padding="md" className="mb-4">
                <CardHeader title="About" />
                <Text
                  className="text-sm text-gray-700 dark:text-gray-300 leading-6 whitespace-pre-line"
                  style={{ includeFontPadding: false }}
                >
                  {company.description}
                </Text>
              </Card>
            )}

            {/* Benefits */}
            {company?.benefits && company.benefits.length > 0 && (
              <Card padding="md" className="mb-4">
                <CardHeader title="Why Work Here?" subtitle="Our benefits & perks" />
                <View className="flex-row flex-wrap gap-2">
                  {company.benefits.map((b: { id: string; name: string; icon?: string | null }) => (
                    <View
                      key={b.id}
                      className="flex-row items-center bg-green-50 dark:bg-green-900/20 pl-3 pr-4 py-2 rounded-full"
                    >
                      <View className="w-5 h-5 rounded-full bg-white dark:bg-neutral-800 mr-2 items-center justify-center">
                        <Ionicons
                          name={(b.icon as keyof typeof Ionicons.glyphMap) ?? 'gift-outline'}
                          size={12}
                          color={COLORS.success}
                        />
                      </View>
                      <Text
                        className="text-xs font-semibold text-green-800 dark:text-green-300"
                        style={{ includeFontPadding: false }}
                      >
                        {b.name}
                      </Text>
                    </View>
                  ))}
                </View>
              </Card>
            )}

            {/* Social */}
            {(company?.linkedinUrl || company?.twitterUrl || company?.facebookUrl || company?.youtubeUrl || company?.instagramUrl) && (
              <Card padding="md" className="mb-4">
                <CardHeader title="Connect Online" />
                <View className="flex-row gap-2">
                  {company?.linkedinUrl && (
                    <TouchableOpacity className="flex-1 bg-[#0A66C2] rounded-xl py-3 items-center" activeOpacity={0.7}>
                      <Ionicons name="logo-linkedin" size={22} color="#FFFFFF" />
                    </TouchableOpacity>
                  )}
                  {company?.twitterUrl && (
                    <TouchableOpacity className="flex-1 bg-black rounded-xl py-3 items-center" activeOpacity={0.7}>
                      <Ionicons name="logo-twitter" size={22} color="#FFFFFF" />
                    </TouchableOpacity>
                  )}
                  {company?.facebookUrl && (
                    <TouchableOpacity className="flex-1 bg-[#1877F2] rounded-xl py-3 items-center" activeOpacity={0.7}>
                      <Ionicons name="logo-facebook" size={22} color="#FFFFFF" />
                    </TouchableOpacity>
                  )}
                  {company?.youtubeUrl && (
                    <TouchableOpacity className="flex-1 bg-[#FF0000] rounded-xl py-3 items-center" activeOpacity={0.7}>
                      <Ionicons name="logo-youtube" size={22} color="#FFFFFF" />
                    </TouchableOpacity>
                  )}
                  {company?.instagramUrl && (
                    <TouchableOpacity className="flex-1 rounded-xl py-3 items-center" style={{ backgroundColor: '#E1306C' }} activeOpacity={0.7}>
                      <Ionicons name="logo-instagram" size={22} color="#FFFFFF" />
                    </TouchableOpacity>
                  )}
                </View>
              </Card>
            )}

            {/* Office locations */}
            {company?.city && (
              <Card padding="md" className="mb-4">
                <CardHeader title="Office Locations" leftIcon={<Ionicons name="map-outline" size={18} color={COLORS.primary} />} />
                <View className="flex-row items-center p-3 rounded-xl bg-gray-50 dark:bg-neutral-700/50">
                  <Ionicons name="location" size={18} color={COLORS.danger} />
                  <Text className="ml-3 text-sm font-semibold text-gray-800 dark:text-gray-200 flex-1">
                    {[company?.city, company?.region, company?.country].filter(Boolean).join(', ')}
                  </Text>
                </View>
              </Card>
            )}

            {/* Stats */}
            <Card padding="md" className="mb-4">
              <CardHeader title="On EtVacancy" />
              <View className="flex-row gap-3">
                <View className="flex-1 rounded-2xl bg-primary-50 dark:bg-primary-900/20 p-3 items-center">
                  <Ionicons name="briefcase-outline" size={22} color={COLORS.primary} style={{ marginBottom: 4 }} />
                  <Text className="text-lg font-bold text-gray-900 dark:text-gray-100">{jobs?.total ?? 0}</Text>
                  <Text className="text-[11px] text-gray-500 dark:text-gray-400">Open Jobs</Text>
                </View>
                <View className="flex-1 rounded-2xl bg-blue-50 dark:bg-blue-900/20 p-3 items-center">
                  <Ionicons name="people-outline" size={22} color="#2563EB" style={{ marginBottom: 4 }} />
                  <Text className="text-lg font-bold text-gray-900 dark:text-gray-100">{sizeLabel?.employees ?? '+'}</Text>
                  <Text className="text-[11px] text-gray-500 dark:text-gray-400">Team</Text>
                </View>
                <View className="flex-1 rounded-2xl bg-amber-50 dark:bg-amber-900/20 p-3 items-center">
                  <Ionicons name="calendar-outline" size={22} color={COLORS.accent} style={{ marginBottom: 4 }} />
                  <Text className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {company?.createdAt ? formatDate(company.createdAt, 'relative').replace(/^Posted /, '') : '—'}
                  </Text>
                  <Text className="text-[11px] text-gray-500 dark:text-gray-400">Joined</Text>
                </View>
              </View>
            </Card>
          </>
        ) : (
          <>
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Open Positions ({jobs?.total ?? 0})
              </Text>
            </View>
            {(jobs?.data ?? []).length === 0 ? (
              <Card padding="lg" className="mb-4">
                <View className="items-center py-8">
                  <View className="w-20 h-20 bg-primary-50 dark:bg-primary-900/20 rounded-full items-center justify-center mb-4">
                    <Ionicons name="briefcase-outline" size={36} color={COLORS.primary} />
                  </View>
                  <Text
                    className="text-base font-bold text-gray-900 dark:text-gray-100 mb-1"
                    style={{ includeFontPadding: false }}
                  >
                    No Open Positions
                  </Text>
                  <Text
                    className="text-sm text-gray-500 dark:text-gray-400 text-center mb-5"
                    style={{ includeFontPadding: false }}
                  >
                    This company is not hiring right now. Follow to be notified when new jobs are posted.
                  </Text>
                  <Button title="Follow Company" variant="primary" size="sm" leftIcon="person-add-outline" onPress={followCompany} />
                </View>
              </Card>
            ) : (
              (jobs?.data ?? []).map((j: Job) => (
                <TouchableOpacity key={j.id} activeOpacity={0.7} onPress={() => openJob(j.id)} className="mb-3">
                  <Card padding="md" variant="elevated">
                    <View className="flex-row items-start justify-between mb-2">
                      <Text className="text-base font-bold text-gray-900 dark:text-gray-100 flex-1 pr-2">{j.title}</Text>
                      <View className={`px-2.5 py-1 rounded-full ${j.status === 'PUBLISHED' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-neutral-700'}`}>
                        <Text className={`text-[10px] font-bold ${j.status === 'PUBLISHED' ? 'text-green-700 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>{j.status}</Text>
                      </View>
                    </View>
                    <View className="flex-row flex-wrap gap-1.5 mb-2">
                      {j.type && (
                        <View className="bg-primary-50 dark:bg-primary-900/30 px-2.5 py-1 rounded-full">
                          <Text className="text-[10px] font-semibold text-primary-700 dark:text-primary-300">{j.type.replace('_', ' ')}</Text>
                        </View>
                      )}
                      {j.employmentType && (
                        <View className="bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 rounded-full">
                          <Text className="text-[10px] font-semibold text-blue-700 dark:text-blue-400">{EMPLOYMENT_TYPES.find((e) => e.value === j.employmentType)?.label ?? j.employmentType}</Text>
                        </View>
                      )}
                      {j.city && (
                        <View className="bg-gray-100 dark:bg-neutral-700 px-2.5 py-1 rounded-full flex-row items-center">
                          <Ionicons name="location-outline" size={10} color="#6B7280" style={{ marginRight: 3 }} />
                          <Text className="text-[10px] font-semibold text-gray-600 dark:text-gray-300">{j.city}</Text>
                        </View>
                      )}
                    </View>
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center">
                        <Ionicons name="people-outline" size={12} color="#6B7280" />
                        <Text className="text-[11px] text-gray-500 dark:text-gray-400 ml-1 mr-4">
                          {j.applicationsCount ?? 0} applicants
                        </Text>
                        <Ionicons name="time-outline" size={12} color="#6B7280" />
                        <Text className="text-[11px] text-gray-500 dark:text-gray-400 ml-1">
                          {formatDate(j.createdAt, 'relative')}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                    </View>
                  </Card>
                </TouchableOpacity>
              ))
            )}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
