import { View, Text, TouchableOpacity, FlatList, RefreshControl, ActivityIndicator, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { Screen } from '@components/ui/Screen';
import { Input } from '@components/ui/Input';
import Button from '@components/ui/Button';
import { JobCard } from '@components/ui/JobCard';
import { Ionicons } from '@expo/vector-icons';
import { jobs as jobsApi, categories as categoriesApi } from '@api/index';
import { useJobFilterStore, useLocalJobsStore } from '@store/index';
import { useSavedJobs } from '@hooks/index';
import { COLORS, JOB_TYPES, EXPERIENCE_LEVELS, EMPLOYMENT_TYPES, ETHIOPIAN_CITIES } from '@constants/index';

import {
  parseNaturalLanguageJobFilter,
  scoreAndFilterJobsWithAI,
  AIScoredJob,
} from '@/services/ai.service';
import type { Job, Category, JobFilterParams, JobType, EmploymentType, ExperienceLevel } from '@/types/index';

const AI_FILTER_PRESETS = [
  { id: '1', title: '⚡ Urgent Tech Roles', prompt: 'Urgent hiring software and tech developer jobs' },
  { id: '2', title: '🌐 Remote Positions', prompt: 'Remote work from home jobs with good salary' },
  { id: '3', title: '🎓 Entry Level / Fresh Grad', prompt: 'Entry level and junior jobs for fresh graduates in Ethiopia' },
  { id: '4', title: '💰 High Paying (>30k)', prompt: 'High salary positions above 30000 ETB' },
  { id: '5', title: '📍 Addis Ababa Onsite', prompt: 'Full time onsite jobs in Addis Ababa' },
];

export default function JobsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ query?: string; categoryId?: string }>();
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showAiFilter, setShowAiFilter] = useState(false);
  const [aiSearchInput, setAiSearchInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [activeAiSummary, setActiveAiSummary] = useState<string | null>(null);
  const [aiScoresMap, setAiScoresMap] = useState<Record<string, { score: number; reason: string }>>({});
  const [savedOnly, setSavedOnly] = useState(false);

  const { isSaved, toggleSave, savedCount } = useSavedJobs();
  const { localPostedJobs, getPublishedJobs } = useLocalJobsStore();
  const {
    query,
    setQuery,
    categoryId,
    setCategoryId,
    type,
    setType,
    employmentType,
    setEmploymentType,
    experienceLevel,
    setExperienceLevel,
    city,
    setCity,
    remoteOnly,
    setRemoteOnly,
    urgentOnly,
    setUrgentOnly,
    clearFilters,
    page,
    nextPage,
    limit,
    sortBy,
    sortOrder,
  } = useJobFilterStore();

  const [searchText, setSearchText] = useState(params.query || query || '');

  useEffect(() => {
    if (params.query !== undefined) {
      setQuery(params.query);
      setSearchText(params.query);
    }
  }, [params.query, setQuery]);

  useEffect(() => {
    if (params.categoryId) {
      setCategoryId(params.categoryId);
    }
  }, [params.categoryId, setCategoryId]);

  useEffect(() => {
    setSearchText(query || '');
  }, [query]);

  const filterParams = useMemo<JobFilterParams>(
    () => ({
      query: searchText || undefined,
      categoryId: categoryId ?? undefined,
      type: (type as JobType | undefined) ?? undefined,
      employmentType: (employmentType as EmploymentType | undefined) ?? undefined,
      experienceLevel: (experienceLevel as ExperienceLevel | undefined) ?? undefined,
      city: city ?? undefined,
      remoteOnly: remoteOnly || undefined,
      urgentOnly: urgentOnly || undefined,
      page,
      limit,
      sortBy,
      sortOrder,
    }),
    [searchText, categoryId, type, employmentType, experienceLevel, city, remoteOnly, urgentOnly, page, limit, sortBy, sortOrder],
  );

  const { data, isLoading, fetchNextPage, hasNextPage } = useQuery<any>({
    queryKey: ['jobs', 'list', filterParams],
    queryFn: () => jobsApi.list(filterParams),
  }) as any;

  const { data: categories } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list({ active: true }),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await jobsApi.list(filterParams);
    setRefreshing(false);
  }, [filterParams]);

  const onEndReached = () => {
    if (hasNextPage) {
      nextPage();
      fetchNextPage();
    }
  };

  const handleApplyAiFilter = async (customPrompt?: string) => {
    const promptToUse = (customPrompt ?? aiSearchInput).trim();
    if (!promptToUse || isAiLoading) return;

    setIsAiLoading(true);
    try {
      // 1. Extract structured filters from natural language with Gemini AI
      const parsedFilters = await parseNaturalLanguageJobFilter(
        promptToUse,
        (categories || []).map((c) => ({ id: c.id, name: c.name })),
      );

      // 2. Apply extracted filters to store
      if (parsedFilters.query) {
        setQuery(parsedFilters.query);
        setSearchText(parsedFilters.query);
      }
      if (parsedFilters.city) setCity(parsedFilters.city);
      if (parsedFilters.type) setType(parsedFilters.type);
      if (parsedFilters.employmentType) setEmploymentType(parsedFilters.employmentType);
      if (parsedFilters.experienceLevel) setExperienceLevel(parsedFilters.experienceLevel);
      if (parsedFilters.remoteOnly) setRemoteOnly(true);
      if (parsedFilters.urgentOnly) setUrgentOnly(true);
      if (parsedFilters.categoryId) setCategoryId(parsedFilters.categoryId);

      setActiveAiSummary(parsedFilters.summary);

      // 3. Compute semantic AI scores for all available jobs
      const apiJobs: Job[] = Array.isArray(data?.data) ? data.data : [];
      const localJobs = getPublishedJobs();
      const combined = [...apiJobs, ...localJobs];

      const scored = await scoreAndFilterJobsWithAI(combined, promptToUse);
      const scoreMap: Record<string, { score: number; reason: string }> = {};
      for (const item of scored) {
        scoreMap[item.job.id] = {
          score: item.matchScore,
          reason: item.highlights || item.matchReasons[0] || 'AI Matched',
        };
      }
      setAiScoresMap(scoreMap);
      setShowAiFilter(false);
    } catch (err) {
      console.warn('AI Filter Error:', err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleClearAllFilters = () => {
    clearFilters();
    setActiveAiSummary(null);
    setAiScoresMap({});
    setAiSearchInput('');
    setSavedOnly(false);
  };

  const Chip = ({
    label,
    active,
    onPress,
    icon,
  }: {
    label: string;
    active?: boolean;
    onPress: () => void;
    icon?: keyof typeof Ionicons.glyphMap;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      className={`px-4 py-2 rounded-full mr-2 mb-2 flex-row items-center gap-1.5 ${
        active
          ? 'bg-primary-700'
          : 'bg-gray-100 dark:bg-neutral-700'
      }`}
      activeOpacity={0.7}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={14}
          color={active ? '#FFFFFF' : '#6B7280'}
        />
      )}
      <Text
        className={`text-sm font-medium ${
          active ? 'text-white' : 'text-gray-700 dark:text-gray-300'
        }`}
        style={{ includeFontPadding: false }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderJob = ({ item }: { item: Job }) => {
    const aiScoreData = aiScoresMap[item.id];
    const saved = isSaved(item.id);

    return (
      <JobCard
        job={item}
        saved={saved}
        onToggleSave={toggleSave}
        aiScoreData={aiScoreData}
      />
    );
  };

  const activeFilterCount = [
    categoryId,
    type,
    employmentType,
    experienceLevel,
    city,
    remoteOnly,
    urgentOnly,
    savedOnly,
  ].filter((v): v is string | true => Boolean(v)).length;

  const mergedJobs = useMemo<Job[]>(() => {
    const apiJobs: Job[] = Array.isArray(data?.data) ? data.data : [];
    const apiIds = new Set(apiJobs.map((j) => j.id));
    const publishedLocal = getPublishedJobs();

    const filteredLocal = publishedLocal.filter((j) => {
      if (searchText) {
        const q = searchText.toLowerCase();
        const matchesSearch =
          j.title.toLowerCase().includes(q) ||
          (j.company?.name ?? '').toLowerCase().includes(q) ||
          (j.description ?? '').toLowerCase().includes(q) ||
          ((j.requirements ?? []) as string[]).some((r) => r.toLowerCase().includes(q));
        if (!matchesSearch) return false;
      }
      if (categoryId && j.categoryId !== categoryId) return false;
      if (type && j.type !== type) return false;
      if (employmentType && j.employmentType !== employmentType) return false;
      if (experienceLevel && j.experienceLevel !== experienceLevel) return false;
      if (city) {
        const cityLower = city.toLowerCase();
        if ((j.city ?? '').toLowerCase() !== cityLower) return false;
      }
      if (remoteOnly) {
        const remoteMatch =
          (j.city ?? '').toLowerCase() === 'remote' ||
          (j.description ?? '').toLowerCase().includes('remote');
        if (!remoteMatch) return false;
      }
      if (urgentOnly && !j.urgentHiring) return false;
      if (savedOnly && !isSaved(j.id)) return false;
      return true;
    });

    let all = [
      ...apiJobs,
      ...filteredLocal.filter((j) => !apiIds.has(j.id)),
    ];

    if (savedOnly) {
      all = all.filter((j) => isSaved(j.id));
    }

    // If AI scores exist, sort by AI match score descending
    if (Object.keys(aiScoresMap).length > 0) {
      all.sort((a, b) => {
        const scoreA = aiScoresMap[a.id]?.score ?? 0;
        const scoreB = aiScoresMap[b.id]?.score ?? 0;
        return scoreB - scoreA;
      });
      return all;
    }

    if (sortOrder === 'asc') {
      all.sort((a, b) => {
        if (sortBy === 'createdAt') return +new Date(a.createdAt) - +new Date(b.createdAt);
        if (sortBy === 'salaryMin') return (a.salaryMin ?? 0) - (b.salaryMin ?? 0);
        if (sortBy === 'title') return (a.title ?? '').localeCompare(b.title ?? '');
        return 0;
      });
    } else {
      all.sort((a, b) => {
        if (sortBy === 'createdAt') return +new Date(b.createdAt) - +new Date(a.createdAt);
        if (sortBy === 'salaryMin') return (b.salaryMin ?? 0) - (a.salaryMin ?? 0);
        if (sortBy === 'title') return (b.title ?? '').localeCompare(a.title ?? '');
        return +new Date(b.createdAt) - +new Date(a.createdAt);
      });
    }

    return all;
  }, [
    data,
    localPostedJobs,
    getPublishedJobs,
    searchText,
    categoryId,
    type,
    employmentType,
    experienceLevel,
    city,
    remoteOnly,
    urgentOnly,
    savedOnly,
    isSaved,
    sortBy,
    sortOrder,
    aiScoresMap,
  ]);

  return (
    <Screen scrollable={false}>
      <View className="mb-4 -mx-5 px-5 pt-2 pb-1 bg-white dark:bg-neutral-800 -mt-6">
        <View className="flex-row items-center justify-between mb-3">
          <Text
            className="text-2xl font-bold text-gray-900 dark:text-gray-100"
            style={{ includeFontPadding: false }}
          >
            🎯 Find Jobs
          </Text>

        </View>

        {/* AI Smart Filter Bar / Prompt Trigger */}
        <TouchableOpacity
          onPress={() => setShowAiFilter((v) => !v)}
          className="mb-3 p-3 rounded-xl bg-gradient-to-r bg-primary-50 dark:bg-neutral-700/60 border border-primary-200 dark:border-neutral-600 flex-row items-center justify-between shadow-sm"
          activeOpacity={0.8}
        >
          <View className="flex-row items-center gap-2.5 flex-1">
            <View className="w-8 h-8 rounded-lg bg-primary-700 items-center justify-center">
              <Ionicons name="sparkles" size={16} color="#FFFFFF" />
            </View>
            <View className="flex-1">
              <Text
                className="text-xs font-bold text-primary-900 dark:text-primary-200"
                style={{ includeFontPadding: false }}
              >
                ✨ AI Smart Filter & Job Match
              </Text>
              <Text
                className="text-[11px] text-primary-700 dark:text-primary-300"
                style={{ includeFontPadding: false }}
                numberOfLines={1}
              >
                {activeAiSummary || 'Describe what job you want in plain words...'}
              </Text>
            </View>
          </View>
          <Ionicons
            name={showAiFilter ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={COLORS.primary}
          />
        </TouchableOpacity>

        {/* Expanded AI Search Section */}
        {showAiFilter && (
          <View className="mb-4 p-4 rounded-2xl bg-white dark:bg-neutral-800 border border-primary-100 dark:border-neutral-700 shadow-md">
            <Text
              className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1"
              style={{ includeFontPadding: false }}
            >
              Ask AI to Filter & Rank Vacancies
            </Text>
            <Text
              className="text-xs text-gray-500 dark:text-gray-400 mb-3"
              style={{ includeFontPadding: false }}
            >
              Type naturally (e.g. &ldquo;Remote React developer junior with high salary&rdquo;)
            </Text>

            <View className="flex-row items-center gap-2 mb-3">
              <View className="flex-1 bg-gray-50 dark:bg-neutral-700 rounded-xl px-3 py-2 border border-gray-200 dark:border-neutral-600">
                <TextInput
                  placeholder="Describe your ideal vacancy..."
                  placeholderTextColor="#9CA3AF"
                  value={aiSearchInput}
                  onChangeText={setAiSearchInput}
                  onSubmitEditing={() => handleApplyAiFilter()}
                  className="text-sm text-gray-900 dark:text-gray-100 py-0.5"
                  style={{ includeFontPadding: false }}
                />
              </View>
              <TouchableOpacity
                onPress={() => handleApplyAiFilter()}
                disabled={!aiSearchInput.trim() || isAiLoading}
                className={`px-4 py-2.5 rounded-xl flex-row items-center gap-1.5 ${
                  aiSearchInput.trim() && !isAiLoading
                    ? 'bg-primary-700'
                    : 'bg-gray-300 dark:bg-neutral-600'
                }`}
                activeOpacity={0.8}
              >
                {isAiLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="sparkles" size={14} color="#FFFFFF" />
                    <Text
                      className="text-xs font-bold text-white"
                      style={{ includeFontPadding: false }}
                    >
                      Filter
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* AI Presets */}
            <Text
              className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5"
              style={{ includeFontPadding: false }}
            >
              Quick AI Presets:
            </Text>
            <View className="flex-row flex-wrap gap-1.5">
              {AI_FILTER_PRESETS.map((preset) => (
                <TouchableOpacity
                  key={preset.id}
                  onPress={() => {
                    setAiSearchInput(preset.prompt);
                    handleApplyAiFilter(preset.prompt);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-gray-100 dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600"
                  activeOpacity={0.7}
                >
                  <Text
                    className="text-[11px] font-medium text-gray-700 dark:text-gray-300"
                    style={{ includeFontPadding: false }}
                  >
                    {preset.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Standard Search Bar */}
        <View className="mb-3 flex-row gap-2">
          <View className="flex-1">
            <Input
              variant="outlined"
              placeholder="Search jobs, skills, companies..."
              value={searchText}
              onChangeText={setSearchText}
              onSubmitEditing={() => setQuery(searchText)}
              leftIcon="search-outline"
              returnKeyType="search"
            />
          </View>
          <TouchableOpacity
            onPress={() => setShowFilters((v) => !v)}
            className={`w-14 h-14 items-center justify-center rounded-xl border ${
              showFilters || activeFilterCount > 0
                ? 'bg-primary-700 border-primary-700'
                : 'bg-gray-50 dark:bg-neutral-700 border-gray-200 dark:border-neutral-600'
            }`}
            activeOpacity={0.7}
          >
            <View className="relative">
              <Ionicons
                name="options-outline"
                size={22}
                color={showFilters || activeFilterCount > 0 ? '#FFFFFF' : '#374151'}
              />
              {activeFilterCount > 0 && (
                <View className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full items-center justify-center">
                  <Text
                    className="text-white text-[10px] font-bold"
                    style={{ includeFontPadding: false }}
                  >
                    {activeFilterCount}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Filter Chips & Active AI Tag */}
        <View className="flex-row flex-wrap -mx-1 items-center">
          {activeAiSummary && (
            <TouchableOpacity
              onPress={handleClearAllFilters}
              className="px-3 py-1.5 rounded-full mr-2 mb-2 flex-row items-center gap-1 bg-primary-700"
            >
              <Ionicons name="sparkles" size={13} color="#FFFFFF" />
              <Text
                className="text-xs font-bold text-white"
                style={{ includeFontPadding: false }}
              >
                AI Filter Active ✕
              </Text>
            </TouchableOpacity>
          )}

          {categoryId && (
            <Chip
              label={categories?.find((c) => c.id === categoryId || c.slug === categoryId)?.name ?? 'Category'}
              active
              icon="grid-outline"
              onPress={() => setCategoryId(null)}
            />
          )}
          <Chip
            label={savedCount > 0 ? `Saved (${savedCount})` : 'Saved'}
            active={savedOnly}
            icon={savedOnly ? 'bookmark' : 'bookmark-outline'}
            onPress={() => setSavedOnly(!savedOnly)}
          />
          <Chip
            label="Remote Only"
            active={remoteOnly}
            icon="globe-outline"
            onPress={() => setRemoteOnly(!remoteOnly)}
          />
          <Chip
            label="Urgent"
            active={urgentOnly}
            icon="flame-outline"
            onPress={() => setUrgentOnly(!urgentOnly)}
          />
        </View>

        {/* Expanded Standard Filters */}
        {showFilters && (
          <View className="mt-4 p-4 bg-gray-50 dark:bg-neutral-700/50 rounded-2xl">
            <View className="flex-row items-center justify-between mb-4">
              <Text
                className="font-bold text-gray-900 dark:text-gray-100"
                style={{ includeFontPadding: false }}
              >
                Filters
              </Text>
              <TouchableOpacity
                onPress={handleClearAllFilters}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text
                  className="text-sm font-semibold text-primary-700 dark:text-primary-400"
                  style={{ includeFontPadding: false }}
                >
                  Clear All
                </Text>
              </TouchableOpacity>
            </View>

            {/* Quick Status / Saved Filter */}
            <View className="mb-4">
              <Text
                className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                style={{ includeFontPadding: false }}
              >
                Special Filters
              </Text>
              <View className="flex-row flex-wrap">
                <Chip
                  label={savedCount > 0 ? `Saved Vacancies (${savedCount})` : 'Saved Vacancies'}
                  active={savedOnly}
                  icon={savedOnly ? 'bookmark' : 'bookmark-outline'}
                  onPress={() => setSavedOnly(!savedOnly)}
                />
                <Chip
                  label="Remote Only"
                  active={remoteOnly}
                  icon="globe-outline"
                  onPress={() => setRemoteOnly(!remoteOnly)}
                />
                <Chip
                  label="Urgent Hiring"
                  active={urgentOnly}
                  icon="flame-outline"
                  onPress={() => setUrgentOnly(!urgentOnly)}
                />
              </View>
            </View>

            {categories && categories.length > 0 && (
              <View className="mb-4">
                <Text
                  className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                  style={{ includeFontPadding: false }}
                >
                  Category
                </Text>
                <View className="flex-row flex-wrap">
                  {categories.map((c) => (
                    <Chip
                      key={c.id}
                      label={c.name}
                      active={categoryId === c.id || categoryId === c.slug}
                      onPress={() =>
                        setCategoryId(categoryId === c.id || categoryId === c.slug ? null : c.id)
                      }
                    />
                  ))}
                </View>
              </View>
            )}

            <View className="mb-4">
              <Text
                className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                style={{ includeFontPadding: false }}
              >
                Job Type
              </Text>
              <View className="flex-row flex-wrap">
                {JOB_TYPES.map((t) => (
                  <Chip
                    key={t.value}
                    label={t.label}
                    active={type === t.value}
                    onPress={() => setType(type === t.value ? null : t.value)}
                  />
                ))}
              </View>
            </View>

            <View className="mb-4">
              <Text
                className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                style={{ includeFontPadding: false }}
              >
                Experience Level
              </Text>
              <View className="flex-row flex-wrap">
                {EXPERIENCE_LEVELS.map((e) => (
                  <Chip
                    key={e.value}
                    label={e.label}
                    active={experienceLevel === e.value}
                    onPress={() =>
                      setExperienceLevel(experienceLevel === e.value ? null : e.value)
                    }
                  />
                ))}
              </View>
            </View>

            <View className="mb-4">
              <Text
                className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                style={{ includeFontPadding: false }}
              >
                Work Type
              </Text>
              <View className="flex-row flex-wrap">
                {EMPLOYMENT_TYPES.map((e) => (
                  <Chip
                    key={e.value}
                    label={e.label}
                    active={employmentType === e.value}
                    onPress={() =>
                      setEmploymentType(employmentType === e.value ? null : e.value)
                    }
                  />
                ))}
              </View>
            </View>

            <View>
              <Text
                className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                style={{ includeFontPadding: false }}
              >
                City
              </Text>
              <View className="flex-row flex-wrap">
                {ETHIOPIAN_CITIES.slice(0, 8).map((c) => (
                  <Chip
                    key={c}
                    label={c}
                    active={city === c}
                    icon="location-outline"
                    onPress={() => setCity(city === c ? null : c)}
                  />
                ))}
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Results Count & Filter notice */}
      <View className="flex-row items-center justify-between mb-4">
        <Text
          className="text-sm text-gray-600 dark:text-gray-400"
          style={{ includeFontPadding: false }}
        >
          <Text className="font-bold text-gray-900 dark:text-gray-100">
            {mergedJobs.length}
          </Text>{' '}
          {savedOnly
            ? 'saved jobs'
            : Object.keys(aiScoresMap).length > 0
            ? 'jobs ranked by AI'
            : 'jobs found'}
        </Text>

        {(Object.keys(aiScoresMap).length > 0 || savedOnly || activeFilterCount > 0) && (
          <TouchableOpacity
            onPress={handleClearAllFilters}
            className="flex-row items-center gap-1"
          >
            <Text className="text-xs font-semibold text-primary-700 dark:text-primary-400">
              Reset Filters
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={mergedJobs}
        renderItem={renderJob}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.3}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !isLoading ? (
            <View className="items-center py-16">
              <View className="w-24 h-24 bg-gray-100 dark:bg-neutral-800 rounded-full items-center justify-center mb-4">
                <Ionicons
                  name={savedOnly ? 'bookmark-outline' : 'search-outline'}
                  size={40}
                  color="#9CA3AF"
                />
              </View>
              <Text
                className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2"
                style={{ includeFontPadding: false }}
              >
                {savedOnly ? 'No Saved Jobs' : 'No Jobs Found'}
              </Text>
              <Text
                className="text-sm text-gray-500 dark:text-gray-400 text-center px-8 mb-6"
                style={{ includeFontPadding: false }}
              >
                {savedOnly
                  ? 'You have not saved any jobs yet. Tap the bookmark icon on any job card to save it for later!'
                  : 'Try adjusting your search or ask the AI Assistant to find matching opportunities.'}
              </Text>
              <View className="flex-row gap-2">
                <Button
                  title={savedOnly ? 'View All Jobs' : 'Clear Filters'}
                  variant="outline"
                  size="md"
                  onPress={handleClearAllFilters}
                />
                <Button
                  title="Ask AI Assistant"
                  variant="primary"
                  size="md"
                  onPress={() => router.push('/(tabs)/(seeker)/assistant')}
                />
              </View>
            </View>
          ) : null
        }
      />
    </Screen>
  );
}
