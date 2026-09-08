import { View, Text, ScrollView, TouchableOpacity, Alert, Modal, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Screen } from '@components/ui/Screen';
import { Card, CardHeader, CardSection } from '@components/ui/Card';
import { Divider } from '@components/ui/Divider';
import Button from '@components/ui/Button';
import Input from '@components/ui/Input';
import { Avatar } from '@components/ui/Avatar';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@store/index';
import { companies as companiesApi, profile as profileApi } from '@api/index';
import { COLORS, COMPANY_SIZES, MAJOR_INDUSTRIES, ROLE_LABELS } from '@constants/index';
import { formatDate } from '@utils/index';
import type { Company, EmployerProfile, WorkExperience, Job } from '@/types/index';
import { Image } from 'expo-image';

function InfoRow({
  icon,
  label,
  value,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string | null;
  onPress?: () => void;
}) {
  if (!value && !onPress) return null;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      className="flex-row items-start py-2.5"
      activeOpacity={0.7}
    >
      <View className="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-900/30 items-center justify-center mr-3 mt-0.5">
        <Ionicons name={icon} size={18} color={COLORS.primary} />
      </View>
      <View className="flex-1">
        <Text
          className="text-[11px] font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wide mb-0.5"
          style={{ includeFontPadding: false }}
        >
          {label}
        </Text>
        <Text
          className="text-sm font-medium text-gray-900 dark:text-gray-100"
          style={{ includeFontPadding: false }}
        >
          {value ?? '—'}
        </Text>
      </View>
      {onPress && <Ionicons name="create-outline" size={16} color="#9CA3AF" />}
    </TouchableOpacity>
  );
}

function StatPill({ icon, label, value, tint }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: number | string; tint: string }) {
  return (
    <View className="flex-1 bg-white dark:bg-neutral-800 rounded-2xl p-3 items-center shadow-card border border-gray-100 dark:border-neutral-700">
      <View
        className="w-10 h-10 rounded-xl items-center justify-center mb-2"
        style={{ backgroundColor: tint + '20' }}
      >
        <Ionicons name={icon} size={20} color={tint} />
      </View>
      <Text
        className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-0.5"
        style={{ includeFontPadding: false }}
      >
        {value}
      </Text>
      <Text
        className="text-[10px] text-gray-500 dark:text-gray-400 text-center"
        style={{ includeFontPadding: false }}
      >
        {label}
      </Text>
    </View>
  );
}

export default function EmployerCompanyScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, logout } = useAuthStore();
  const companyId = user?.employerProfile?.companyId;
  const profile = user?.employerProfile;
  const company = profile?.company;

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [compName, setCompName] = useState(company?.name ?? 'Ethio Innovations');
  const [compIndustry, setCompIndustry] = useState(company?.industry ?? 'Technology');
  const [compTagline, setCompTagline] = useState(company?.tagline ?? 'Transforming Digital Services in Ethiopia');
  const [compWebsite, setCompWebsite] = useState(company?.website ?? 'https://ethioinnovations.et');
  const [compPhone, setCompPhone] = useState(company?.phone ?? '+251 11 654 3210');
  const [compEmail, setCompEmail] = useState(company?.supportEmail ?? 'contact@ethioinnovations.et');
  const [compLocation, setCompLocation] = useState(company?.city ?? 'Addis Ababa');

  const { data: companyDetails } = useQuery<Company | null>({
    queryKey: ['companies', 'my-company', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      return companiesApi.get(companyId);
    },
    enabled: !!companyId,
  });

  const activeCompany = companyDetails ?? company ?? {
    id: companyId ?? 'cmp_mine',
    name: compName,
    slug: 'ethio-innovations',
    industry: compIndustry,
    tagline: compTagline,
    website: compWebsite,
    phone: compPhone,
    supportEmail: compEmail,
    city: compLocation,
    country: 'Ethiopia',
    size: '11_50',
    verificationStatus: 'VERIFIED',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: new Date().toISOString(),
  } as Company;

  const handleOpenEdit = () => {
    setCompName(activeCompany?.name ?? '');
    setCompIndustry(activeCompany?.industry ?? '');
    setCompTagline(activeCompany?.tagline ?? '');
    setCompWebsite(activeCompany?.website ?? '');
    setCompPhone(activeCompany?.phone ?? '');
    setCompEmail(activeCompany?.supportEmail ?? '');
    setCompLocation(activeCompany?.city ?? '');
    setEditModalVisible(true);
  };

  const handleSaveCompany = () => {
    if (!compName.trim()) {
      Alert.alert('Company Name Required', 'Please enter a valid company name.');
      return;
    }
    const updatedCompany: Company = {
      ...activeCompany,
      name: compName.trim(),
      industry: compIndustry.trim() || activeCompany.industry,
      tagline: compTagline.trim() || activeCompany.tagline,
      website: compWebsite.trim() || activeCompany.website,
      phone: compPhone.trim() || activeCompany.phone,
      supportEmail: compEmail.trim() || activeCompany.supportEmail,
      city: compLocation.trim() || activeCompany.city,
      updatedAt: new Date().toISOString(),
    };

    if (user && user.employerProfile) {
      const updatedUser: User = {
        ...user,
        employerProfile: {
          ...user.employerProfile,
          company: updatedCompany,
        },
      };
      useAuthStore.setState((s) => ({
        user: updatedUser,
        registeredUsers: s.registeredUsers.map((u) => (u.id === user.id ? updatedUser : u)),
      }));
    }

    queryClient.setQueryData(['companies', 'my-company', companyId], updatedCompany);
    setEditModalVisible(false);
    Alert.alert('Company Updated', 'Company details saved successfully.');
  };

  const { data: companyJobs } = useQuery({
    queryKey: ['companies', 'jobs', companyId],
    queryFn: async () => {
      if (!companyId) {
        return {
          data: [],
          total: 0,
          page: 1,
          limit: 5,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
        };
      }
      return companiesApi.jobs(companyId, { limit: 5 });
    },
    enabled: !!companyId,
  });

  const { data: companyStats } = useQuery<Record<string, number>>({
    queryKey: ['companies', 'stats', companyId],
    queryFn: () => {
      if (!companyId) return Promise.resolve({});
      return companiesApi.stats(companyId);
    },
    enabled: !!companyId,
  });

  const verificationIcon =
    activeCompany?.verificationStatus === 'VERIFIED'
      ? { name: 'shield-checkmark' as const, color: COLORS.success, bg: 'bg-green-100 dark:bg-green-900/30', label: 'Verified' }
      : activeCompany?.verificationStatus === 'PENDING'
      ? { name: 'shield-half' as const, color: COLORS.accent, bg: 'bg-amber-100 dark:bg-amber-900/30', label: 'Under Review' }
      : activeCompany?.verificationStatus === 'REJECTED'
      ? { name: 'shield' as const, color: COLORS.danger, bg: 'bg-red-100 dark:bg-red-900/30', label: 'Rejected' }
      : { name: 'shield-outline' as const, color: '#9CA3AF', bg: 'bg-gray-100 dark:bg-neutral-700', label: 'Unverified' };

  return (
    <Screen scrollable>
      {/* Banner + Logo */}
      <View className="-mx-5 -mt-6 mb-4 relative">
        <View className="h-36 bg-gradient-to-br from-primary-700 via-primary-600 to-primary-500 relative">
          {activeCompany?.bannerImage ? (
            <Image
              source={{ uri: activeCompany.bannerImage }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
            />
          ) : (
            <View className="absolute inset-0 opacity-10">
              <View className="absolute top-8 left-8 w-28 h-28 rounded-full bg-white" />
              <View className="absolute top-4 right-12 w-20 h-20 rounded-full bg-white" />
              <View className="absolute bottom-6 left-1/3 w-32 h-32 rounded-full bg-white" />
            </View>
          )}
          <TouchableOpacity
            className="absolute top-3 right-3 w-9 h-9 rounded-xl bg-black/25 backdrop-blur-sm items-center justify-center"
            onPress={() => Alert.alert('Update Banner', 'Select a new cover banner image from your device gallery.')}
            activeOpacity={0.7}
          >
            <Ionicons name="camera" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <View className="px-5">
          <View className="-mt-12 flex-row items-end justify-between">
            <View className="relative">
              <View className="w-24 h-24 rounded-2xl bg-white dark:bg-neutral-800 border-4 border-white dark:border-neutral-800 items-center justify-center shadow-card-lg overflow-hidden">
                {activeCompany?.logo ? (
                  <Image
                    source={{ uri: activeCompany.logo }}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                  />
                ) : (
                  <Ionicons name="business" size={40} color={COLORS.primary} />
                )}
              </View>
              <TouchableOpacity
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl bg-primary-700 border-2 border-white dark:border-neutral-800 items-center justify-center shadow-card"
                onPress={() => Alert.alert('Update Logo', 'Select a new company logo from your device gallery.')}
                activeOpacity={0.7}
              >
                <Ionicons name="camera" size={14} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <View className={`px-3 py-1.5 rounded-full flex-row items-center gap-1.5 ${verificationIcon.bg} mb-1.5`}>
              <Ionicons name={verificationIcon.name} size={14} color={verificationIcon.color} />
              <Text
                className={`text-[11px] font-bold ${
                  activeCompany?.verificationStatus === 'VERIFIED'
                    ? 'text-green-700 dark:text-green-400'
                    : activeCompany?.verificationStatus === 'PENDING'
                    ? 'text-amber-700 dark:text-amber-400'
                    : activeCompany?.verificationStatus === 'REJECTED'
                    ? 'text-red-700 dark:text-red-400'
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

      {/* Company Title */}
      <View className="mb-4">
        <Text
          className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1"
          style={{ includeFontPadding: false }}
        >
          {activeCompany?.name ?? 'Set Up Your Company'}
        </Text>
        {activeCompany?.tagline && (
          <Text
            className="text-sm text-gray-600 dark:text-gray-400 mb-2"
            style={{ includeFontPadding: false }}
          >
            {activeCompany.tagline}
          </Text>
        )}
        <View className="flex-row flex-wrap gap-2 mt-3">
          {activeCompany?.industry && (
            <View className="bg-primary-50 dark:bg-primary-900/30 px-3 py-1.5 rounded-full">
              <Text
                className="text-xs font-semibold text-primary-700 dark:text-primary-300"
                style={{ includeFontPadding: false }}
              >
                {activeCompany.industry}
              </Text>
            </View>
          )}
          <View className="bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-full">
            <Text
              className="text-xs font-semibold text-blue-700 dark:text-blue-400"
              style={{ includeFontPadding: false }}
            >
              {COMPANY_SIZES.find((s) => s.value === (activeCompany?.size ?? '1_10'))?.label ??
                'Specify size'}
            </Text>
          </View>
        </View>
      </View>

      {/* Company Stats */}
      {activeCompany && (
        <View className="flex-row gap-3 mb-6">
          <StatPill
            icon="briefcase-outline"
            label="Open Positions"
            value={companyJobs?.total ?? companyStats?.vacancies ?? '--'}
            tint={COLORS.primary}
          />
          <StatPill
            icon="people-outline"
            label="Total Applicants"
            value={companyStats?.applications ?? '--'}
            tint="#2563EB"
          />
          <StatPill
            icon="people"
            label="Team Size"
            value={
              COMPANY_SIZES.find((s) => s.value === activeCompany.size)?.employees ?? '+'
            }
            tint="#9333EA"
          />
        </View>
      )}

      {/* Action Buttons */}
      <View className="flex-row gap-3 mb-6">
        <Button
          title="Edit Company"
          variant="primary"
          size="md"
          leftIcon="create-outline"
          style={{ flex: 1 } as any}
          onPress={handleOpenEdit}
        />
        {activeCompany?.verificationStatus !== 'VERIFIED' && (
          <Button
            title={activeCompany ? 'Request Verification' : 'Create Company'}
            variant="outline"
            size="md"
            leftIcon="shield-checkmark-outline"
            style={{ flex: 1 } as any}
            onPress={() =>
              Alert.alert(
                'Verification Submitted',
                'Your company verification request has been sent to our admin team for review.'
              )
            }
          />
        )}
      </View>

      {/* Company Information Card */}
      <Card padding="md" className="mb-4">
        <CardHeader
          title="Company Information"
          subtitle="Overview of your organization"
          right={
            <TouchableOpacity
              onPress={handleOpenEdit}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="create-outline" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          }
        />
        <InfoRow
          icon="document-text-outline"
          label="Legal / Registered Name"
          value={activeCompany?.legalName ?? activeCompany?.name}
        />
        <Divider />
        <InfoRow
          icon="business-outline"
          label="Industry"
          value={activeCompany?.industry ?? 'Select an industry'}
        />
        <Divider />
        <InfoRow
          icon="people-outline"
          label="Company Size"
          value={COMPANY_SIZES.find((s) => s.value === (activeCompany?.size ?? ''))?.label}
        />
        <Divider />
        <InfoRow
          icon="calendar-outline"
          label="Founded"
          value={activeCompany?.foundedYear ? `Year ${activeCompany.foundedYear}` : undefined}
        />
        <Divider />
        <InfoRow
          icon="location-outline"
          label="Headquarters"
          value={
            [activeCompany?.headquarters, activeCompany?.city, activeCompany?.region, activeCompany?.country]
              .filter(Boolean)
              .join(', ') || undefined
          }
        />
        <Divider />
        <InfoRow
          icon="globe-outline"
          label="Website"
          value={activeCompany?.website}
        />
        <Divider />
        <InfoRow
          icon="call-outline"
          label="Support Phone"
          value={activeCompany?.phone}
        />
        <Divider />
        <InfoRow
          icon="mail-outline"
          label="Support Email"
          value={activeCompany?.supportEmail}
        />
        <Divider />
        <InfoRow
          icon="card-outline"
          label="Tax ID"
          value={activeCompany?.taxId ? '•••••' + (activeCompany.taxId.slice(-3) ?? '') : undefined}
        />
        <Divider />
        <InfoRow
          icon="document-text-outline"
          label="Registration #"
          value={activeCompany?.registrationNumber}
        />
      </Card>

      {/* About / Description */}
      <Card padding="md" className="mb-4">
        <CardHeader title="About the Company" right={<Ionicons name="book-outline" size={18} color={COLORS.primary} />} />
        {activeCompany?.description ? (
          <Text
            className="text-sm text-gray-700 dark:text-gray-300 leading-6"
            style={{ includeFontPadding: false }}
          >
            {activeCompany.description}
          </Text>
        ) : (
          <View className="items-center py-4">
            <Ionicons name="create-outline" size={32} color="#9CA3AF" className="mb-2" />
            <Text
              className="text-sm text-gray-500 dark:text-gray-400 text-center mb-3"
              style={{ includeFontPadding: false }}
            >
              Tell candidates about your company&apos;s mission, culture and what makes it special.
            </Text>
            <Button
              title="Write Description"
              variant="outline"
              size="sm"
              leftIcon="create-outline"
              onPress={() => Alert.alert('Company Description', 'Company description updated.')}
            />
          </View>
        )}
      </Card>

      {/* Benefits */}
      {activeCompany?.benefits && activeCompany.benefits.length > 0 && (
        <Card padding="md" className="mb-4">
          <CardHeader title="Company Benefits" subtitle="Why candidates will love working here" />
          <View className="flex-row flex-wrap gap-2">
            {activeCompany.benefits.map((b: { id: string; icon?: string | null; name: string }) => (
              <View
                key={b.id}
                className="flex-row items-center bg-green-50 dark:bg-green-900/20 pl-3 pr-4 py-2 rounded-full"
              >
                <View className="w-5 h-5 rounded-full bg-white dark:bg-neutral-800 mr-2 items-center justify-center">
                  <Ionicons
                    name={(b.icon ?? 'gift-outline') as keyof typeof Ionicons.glyphMap}
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

      {/* Social Links */}
      {(activeCompany?.linkedinUrl ||
        activeCompany?.twitterUrl ||
        activeCompany?.facebookUrl ||
        activeCompany?.youtubeUrl ||
        activeCompany?.instagramUrl) && (
        <Card padding="md" className="mb-4">
          <CardHeader title="Social Channels" />
          <View className="flex-row gap-2">
            {activeCompany?.linkedinUrl && (
              <TouchableOpacity className="flex-1 bg-[#0A66C2] rounded-xl py-3 items-center" activeOpacity={0.7}>
                <Ionicons name="logo-linkedin" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            {activeCompany?.twitterUrl && (
              <TouchableOpacity className="flex-1 bg-black rounded-xl py-3 items-center" activeOpacity={0.7}>
                <Ionicons name="logo-twitter" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            {activeCompany?.facebookUrl && (
              <TouchableOpacity className="flex-1 bg-[#1877F2] rounded-xl py-3 items-center" activeOpacity={0.7}>
                <Ionicons name="logo-facebook" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            {activeCompany?.youtubeUrl && (
              <TouchableOpacity className="flex-1 bg-[#FF0000] rounded-xl py-3 items-center" activeOpacity={0.7}>
                <Ionicons name="logo-youtube" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            {activeCompany?.instagramUrl && (
              <TouchableOpacity
                className="flex-1 rounded-xl py-3 items-center"
                style={{ backgroundColor: '#E1306C' }}
                activeOpacity={0.7}
              >
                <Ionicons name="logo-instagram" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        </Card>
      )}

      {/* My Open Vacancies */}
      <CardHeader
        title="Your Open Vacancies"
        subtitle={`${companyJobs?.total ?? 0} posted`}
        right={
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/employer/vacancies')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text
              className="text-sm font-semibold text-primary-700 dark:text-primary-400"
              style={{ includeFontPadding: false }}
            >
              Manage →
            </Text>
          </TouchableOpacity>
        }
        className="mb-3"
      />
      {(companyJobs?.data ?? []).length > 0 ? (
        (companyJobs?.data ?? []).slice(0, 4).map((j: Job) => (
          <Card padding="md" key={j.id} className="mb-2">
            <View className="flex-row items-center justify-between">
              <View>
                <Text
                  className="font-semibold text-gray-900 dark:text-gray-100 mb-0.5"
                  style={{ includeFontPadding: false }}
                >
                  {j.title}
                </Text>
                <Text
                  className="text-xs text-gray-500 dark:text-gray-400 mb-1"
                  style={{ includeFontPadding: false }}
                >
                  {j.type.replace('_', ' ')} • {j.applicationsCount ?? 0} applicants
                </Text>
                <Text
                  className="text-[11px] text-gray-400 dark:text-gray-500"
                  style={{ includeFontPadding: false }}
                >
                  Posted {formatDate(j.createdAt, 'relative')}
                </Text>
              </View>
              <View
                className={`px-2.5 py-1 rounded-full ${
                  j.status === 'PUBLISHED'
                    ? 'bg-green-100 dark:bg-green-900/30'
                    : 'bg-gray-100 dark:bg-neutral-700'
                }`}
              >
                <Text
                  className={`text-[10px] font-bold ${
                    j.status === 'PUBLISHED' ? 'text-green-700 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'
                  }`}
                  style={{ includeFontPadding: false }}
                >
                  {j.status}
                </Text>
              </View>
            </View>
          </Card>
        ))
      ) : (
        <Card padding="md" className="mb-4">
          <View className="items-center py-3">
            <Ionicons name="briefcase-outline" size={28} color="#9CA3AF" className="mb-2" />
            <Text
              className="text-sm text-gray-500 dark:text-gray-400 text-center mb-3"
              style={{ includeFontPadding: false }}
            >
              You haven&apos;t posted any jobs yet.
            </Text>
            <Button
              title="Post a Job"
              variant="primary"
              size="sm"
              leftIcon="add-circle-outline"
              onPress={() => router.push('/(tabs)/employer/vacancies')}
            />
          </View>
        </Card>
      )}

      {/* Created / Updated */}
      {activeCompany && (
        <View className="flex-row justify-between items-center mt-4 mb-4 px-1">
          <Text
            className="text-[11px] text-gray-400 dark:text-gray-500"
            style={{ includeFontPadding: false }}
          >
            Created {formatDate(activeCompany.createdAt, 'long')}
          </Text>
          <Text
            className="text-[11px] text-gray-400 dark:text-gray-500"
            style={{ includeFontPadding: false }}
          >
            Updated {formatDate(activeCompany.updatedAt, 'relative')}
          </Text>
        </View>
      )}

      {/* Edit Company Modal */}
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
              maxWidth: 460,
              maxHeight: '85%',
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 24,
            }}
            onStartShouldSetResponder={() => true}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#0F172A' }}>Edit Company Details</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
              <View style={{ gap: 12 }}>
                <View>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 4 }}>Company Name</Text>
                  <Input value={compName} onChangeText={setCompName} placeholder="e.g. Ethio Telecom" />
                </View>

                <View>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 4 }}>Industry</Text>
                  <Input value={compIndustry} onChangeText={setCompIndustry} placeholder="e.g. Telecommunications, IT" />
                </View>

                <View>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 4 }}>Tagline / Slogan</Text>
                  <Input value={compTagline} onChangeText={setCompTagline} placeholder="e.g. Empowering digital lifestyles" />
                </View>

                <View>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 4 }}>Headquarters / City</Text>
                  <Input value={compLocation} onChangeText={setCompLocation} placeholder="e.g. Addis Ababa" />
                </View>

                <View>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 4 }}>Website</Text>
                  <Input value={compWebsite} onChangeText={setCompWebsite} placeholder="https://..." />
                </View>

                <View>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 4 }}>Support Phone</Text>
                  <Input value={compPhone} onChangeText={setCompPhone} placeholder="+251 11 123 4567" />
                </View>

                <View>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 4 }}>Support Email</Text>
                  <Input value={compEmail} onChangeText={setCompEmail} placeholder="support@company.et" />
                </View>
              </View>
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <View style={{ flex: 1 }}>
                <Button
                  title="Cancel"
                  variant="outline"
                  size="md"
                  onPress={() => setEditModalVisible(false)}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  title="Save Changes"
                  variant="primary"
                  size="md"
                  onPress={handleSaveCompany}
                />
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </Screen>
  );
}
