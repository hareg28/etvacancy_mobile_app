import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { Screen } from '@components/ui/Screen';
import { Card } from '@components/ui/Card';
import { Input } from '@components/ui/Input';
import { Ionicons } from '@expo/vector-icons';
import { companies as companiesApi } from '@api/index';
import { COLORS, MAJOR_INDUSTRIES, COMPANY_SIZES } from '@constants/index';
import { truncate } from '@utils/index';
import type { Company } from '@/types/index';
import { Image } from 'expo-image';

export default function CompaniesScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['companies', 'list', searchText, selectedIndustry, verifiedOnly],
    queryFn: () =>
      companiesApi.list({
        query: searchText || undefined,
        industry: selectedIndustry || undefined,
        verified: verifiedOnly || undefined,
        limit: 50,
      }),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await companiesApi.list({
      query: searchText || undefined,
      industry: selectedIndustry || undefined,
      verified: verifiedOnly || undefined,
    });
    setRefreshing(false);
  }, [searchText, selectedIndustry, verifiedOnly]);

  const renderCompany = ({ item }: { item: Company }) => (
    <TouchableOpacity
      onPress={() => router.push(`/companies/${item.id}`)}
      activeOpacity={0.7}
      className="mb-3"
    >
      <Card padding="md" variant="elevated">
        <View className="flex-row items-start gap-4">
          <View className="w-16 h-16 rounded-xl bg-gray-100 dark:bg-neutral-700 items-center justify-center overflow-hidden flex-shrink-0 border border-gray-100 dark:border-neutral-600">
            {item.logo ? (
              <Image
                source={{ uri: item.logo }}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <Ionicons name="business" size={28} color={COLORS.primary} />
            )}
          </View>
          <View className="flex-1">
            <View className="flex-row items-start justify-between mb-1">
              <View className="flex-1 flex-row items-center gap-2 pr-2">
                <Text
                  className="font-bold text-gray-900 dark:text-gray-100 text-base flex-shrink-0"
                  style={{ includeFontPadding: false }}
                >
                  {truncate(item.name, 28)}
                </Text>
                {item.verificationStatus === 'VERIFIED' && (
                  <View className="w-5 h-5 bg-blue-500 rounded-full items-center justify-center flex-shrink-0">
                    <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                  </View>
                )}
              </View>
            </View>
            {item.tagline && (
              <Text
                className="text-sm text-gray-600 dark:text-gray-400 mb-2"
                style={{ includeFontPadding: false }}
              >
                {truncate(item.tagline, 50)}
              </Text>
            )}
            <View className="flex-row flex-wrap gap-2">
              {item.industry && (
                <View className="bg-primary-50 dark:bg-primary-900/20 px-2.5 py-1 rounded-lg">
                  <Text
                    className="text-xs font-medium text-primary-700 dark:text-primary-300"
                    style={{ includeFontPadding: false }}
                  >
                    {truncate(item.industry, 20)}
                  </Text>
                </View>
              )}
              <View className="bg-gray-100 dark:bg-neutral-700 px-2.5 py-1 rounded-lg flex-row items-center gap-1">
                <Ionicons name="people-outline" size={12} color="#6B7280" />
                <Text
                  className="text-xs font-medium text-gray-600 dark:text-gray-300"
                  style={{ includeFontPadding: false }}
                >
                  {COMPANY_SIZES.find((s) => s.value === item.size)?.label ?? item.size}
                </Text>
              </View>
              {item.city && (
                <View className="bg-gray-100 dark:bg-neutral-700 px-2.5 py-1 rounded-lg flex-row items-center gap-1">
                  <Ionicons name="location-outline" size={12} color="#6B7280" />
                  <Text
                    className="text-xs font-medium text-gray-600 dark:text-gray-300"
                    style={{ includeFontPadding: false }}
                  >
                    {item.city}
                  </Text>
                </View>
              )}
              {(item.vacanciesCount ?? item.jobsCount ?? item.vacancies?.length ?? 0) > 0 && (
                <View className="bg-primary-50 dark:bg-primary-900/20 px-2.5 py-1 rounded-lg flex-row items-center gap-1">
                  <Ionicons name="briefcase-outline" size={12} color="#1D4ED8" />
                  <Text
                    className="text-xs font-medium text-primary-700 dark:text-primary-300"
                    style={{ includeFontPadding: false }}
                  >
                    {item.vacanciesCount ?? item.jobsCount ?? item.vacancies?.length ?? 0} Open
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <Screen scrollable={false}>
      <View className="mb-4 -mx-5 px-5 pt-2 pb-1 bg-white dark:bg-neutral-800 -mt-6">
        <Text
          className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4"
          style={{ includeFontPadding: false }}
        >
          🏢 Companies
        </Text>

        <Input
          variant="outlined"
          placeholder="Search companies by name or industry"
          value={searchText}
          onChangeText={setSearchText}
          leftIcon="search-outline"
          returnKeyType="search"
          className="mb-4"
        />

        <View className="flex-row gap-2 mb-4">
          <TouchableOpacity
            onPress={() => setVerifiedOnly((v) => !v)}
            className={`px-4 py-2 rounded-xl flex-row items-center gap-2 ${
              verifiedOnly
                ? 'bg-blue-600'
                : 'bg-gray-100 dark:bg-neutral-700'
            }`}
            activeOpacity={0.7}
          >
            <Ionicons
              name="shield-checkmark-outline"
              size={16}
              color={verifiedOnly ? '#FFFFFF' : '#3B82F6'}
            />
            <Text
              className={`text-sm font-semibold ${
                verifiedOnly ? 'text-white' : 'text-blue-600 dark:text-blue-400'
              }`}
              style={{ includeFontPadding: false }}
            >
              Verified Only
            </Text>
          </TouchableOpacity>
        </View>

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={MAJOR_INDUSTRIES.slice(0, 12)}
          keyExtractor={(item) => item}
          contentContainerStyle={{ paddingBottom: 16, paddingRight: 8 }}
          renderItem={({ item }) => {
            const active = selectedIndustry === item;
            return (
              <TouchableOpacity
                onPress={() => setSelectedIndustry(active ? null : item)}
                className={`px-4 py-2 rounded-xl mr-2 ${
                  active
                    ? 'bg-primary-700'
                    : 'bg-gray-100 dark:bg-neutral-700'
                }`}
                activeOpacity={0.7}
              >
                <Text
                  className={`text-sm font-medium ${
                    active ? 'text-white' : 'text-gray-700 dark:text-gray-300'
                  }`}
                  style={{ includeFontPadding: false }}
                >
                  {truncate(item, 18)}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      <View className="flex-row items-center justify-between mb-4">
        <Text
          className="text-sm text-gray-600 dark:text-gray-400"
          style={{ includeFontPadding: false }}
        >
          <Text className="font-bold text-gray-900 dark:text-gray-100">
            {data?.total ?? 0}
          </Text>{' '}
          companies
        </Text>
      </View>

      <FlatList
        data={data?.data ?? []}
        renderItem={renderCompany}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !isLoading ? (
            <View className="items-center py-16">
              <View className="w-24 h-24 bg-gray-100 dark:bg-neutral-800 rounded-full items-center justify-center mb-4">
                <Ionicons name="business-outline" size={40} color="#9CA3AF" />
              </View>
              <Text
                className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2"
                style={{ includeFontPadding: false }}
              >
                No Companies Found
              </Text>
              <Text
                className="text-sm text-gray-500 dark:text-gray-400 text-center px-8"
                style={{ includeFontPadding: false }}
              >
                Try adjusting your search or industry filter to explore more companies.
              </Text>
            </View>
          ) : null
        }
      />
    </Screen>
  );
}
