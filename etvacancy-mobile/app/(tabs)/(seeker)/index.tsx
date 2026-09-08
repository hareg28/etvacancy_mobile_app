import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useState, useCallback, useMemo, useRef } from 'react';
import { Screen } from '@components/ui/Screen';
import { Avatar } from '@components/ui/Avatar';
import { JobCard } from '@components/ui/JobCard';
import { useAuthStore, useJobFilterStore, useLocalJobsStore } from '@store/index';
import { useSavedJobs } from '@hooks/index';
import { jobs as jobsApi, categories as categoriesApi, REAL_CATEGORIES } from '@api/index';
import { COLORS } from '@constants/index';
import { Ionicons } from '@expo/vector-icons';
import type { Job, Category } from '@/types/index';

export default function JobSeekerHomeScreen() {
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  const { user } = useAuthStore();
  const { isSaved, toggleSave } = useSavedJobs();
  const { setCategoryId, setQuery } = useJobFilterStore();
  const { getFeaturedJobs: getLocalFeatured, getRecentJobs: getLocalRecent, localPostedJobs } = useLocalJobsStore();
  const [refreshing, setRefreshing] = useState(false);
  const [homeSearchInput, setHomeSearchInput] = useState('');
  const [activeFeaturedIndex, setActiveFeaturedIndex] = useState(0);
  const featuredScrollRef = useRef<ScrollView>(null);

  // Horizontal Card dimensions with peek allowance for the next slide
  const CARD_WIDTH = Math.min(Math.max(windowWidth * 0.82, 280), 380);
  const CARD_GAP = 12;
  const SNAP_INTERVAL = CARD_WIDTH + CARD_GAP;

  const [activeCategoryPage, setActiveCategoryPage] = useState(0);
  const categoryScrollRef = useRef<ScrollView>(null);

  // Responsive category grid dimensions (exact whole cards, zero half-cuts)
  const CAT_PAGE_WIDTH = windowWidth - 32;
  const CAT_COLS = windowWidth >= 600 ? 4 : 3;
  const CAT_ROWS = 2;
  const CAT_PER_PAGE = CAT_COLS * CAT_ROWS;
  const CAT_GAP = 10;
  const CAT_ITEM_WIDTH = Math.floor((CAT_PAGE_WIDTH - (CAT_COLS - 1) * CAT_GAP) / CAT_COLS);
  const CAT_PAGE_SNAP = CAT_PAGE_WIDTH + 14;

  const handleNextFeaturedSlide = () => {
    if (featuredScrollRef.current && featuredJobs.length > 0) {
      const nextIdx = Math.min(activeFeaturedIndex + 1, featuredJobs.length - 1);
      featuredScrollRef.current.scrollTo({
        x: nextIdx * SNAP_INTERVAL,
        animated: true,
      });
      setActiveFeaturedIndex(nextIdx);
    }
  };

  const handlePrevFeaturedSlide = () => {
    if (featuredScrollRef.current && featuredJobs.length > 0) {
      const prevIdx = Math.max(activeFeaturedIndex - 1, 0);
      featuredScrollRef.current.scrollTo({
        x: prevIdx * SNAP_INTERVAL,
        animated: true,
      });
      setActiveFeaturedIndex(prevIdx);
    }
  };

  const handleNextCategoryPage = () => {
    if (categoryScrollRef.current && categoryPages.length > 0) {
      const nextIdx = Math.min(activeCategoryPage + 1, categoryPages.length - 1);
      categoryScrollRef.current.scrollTo({
        x: nextIdx * CAT_PAGE_SNAP,
        animated: true,
      });
      setActiveCategoryPage(nextIdx);
    }
  };

  const { data: featuredJobsData, isLoading: loadingJobs } = useQuery<Job[]>({
    queryKey: ['jobs', 'featured'],
    queryFn: () => jobsApi.featured(6),
  });

  const { data: recentJobsData } = useQuery<Job[]>({
    queryKey: ['jobs', 'recent'],
    queryFn: () => jobsApi.recent(8),
  });

  const { data: categoriesData } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list({ active: true, withCounts: true }),
  });

  const { data: stats } = useQuery<Record<string, number>>({
    queryKey: ['jobs', 'stats'],
    queryFn: () => jobsApi.stats(),
  });

  const featuredJobs: Job[] = useMemo(() => {
    const apiJobs: Job[] = Array.isArray(featuredJobsData)
      ? featuredJobsData
      : (featuredJobsData as any)?.data ?? [];
    const localFeatured = getLocalFeatured(6);
    const apiIds = new Set(apiJobs.map((j) => j.id));
    const merged = [
      ...apiJobs,
      ...localFeatured.filter((j) => !apiIds.has(j.id)),
    ];
    return merged.slice(0, 6);
  }, [featuredJobsData, localPostedJobs, getLocalFeatured]);

  const recentJobs: Job[] = useMemo(() => {
    const apiJobs: Job[] = Array.isArray(recentJobsData)
      ? recentJobsData
      : (recentJobsData as any)?.data ?? [];
    const localRecent = getLocalRecent(10);
    const apiIds = new Set(apiJobs.map((j) => j.id));
    const merged = [
      ...apiJobs,
      ...localRecent.filter((j) => !apiIds.has(j.id)),
    ];
    return merged.slice(0, 8);
  }, [recentJobsData, localPostedJobs, getLocalRecent]);

  const categories: Category[] = Array.isArray(categoriesData) && categoriesData.length > 0
    ? categoriesData
    : (categoriesData as any)?.data && (categoriesData as any).data.length > 0
    ? (categoriesData as any).data
    : REAL_CATEGORIES;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      jobsApi.featured(6),
      jobsApi.recent(8),
      categoriesApi.list({ active: true, withCounts: true }),
      jobsApi.stats(),
    ]);
    setRefreshing(false);
  }, []);

  const handleSearch = (searchTerm?: string) => {
    const text = (searchTerm !== undefined ? searchTerm : homeSearchInput).trim();
    setQuery(text);
    router.push('/(tabs)/(seeker)/jobs');
  };

  const handleCategoryPress = (category: Category) => {
    if (category?.id) setCategoryId(category.id);
    router.push('/(tabs)/(seeker)/jobs');
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getCategoryIcon = (s?: string | null): keyof typeof Ionicons.glyphMap => {
    const m: Record<string, keyof typeof Ionicons.glyphMap> = {
      software: 'code-slash-outline',
      it: 'hardware-chip-outline',
      accounting: 'calculator-outline',
      medicine: 'medical-outline',
      engineering: 'construct-outline',
      education: 'school-outline',
      banking: 'card-outline',
      marketing: 'trending-up-outline',
      'customer-service': 'headset-outline',
      'human-resources': 'people-outline',
      logistics: 'bus-outline',
      ngo: 'globe-outline',
    };
    if (s && m[s.toLowerCase()]) return m[s.toLowerCase()];
    return 'briefcase-outline';
  };

  return (
    <Screen scrollable={false} padding={false}>
      <ScrollView
        style={{ flex: 1, width: '100%' }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16, paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        {/* ── Header ─────────────────────────── */}
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-1 pr-3">
            <Text className="text-sm text-gray-500 dark:text-gray-400 mb-0.5">
              {user ? `${greeting()}, 👋` : '👋 Welcome to'}
            </Text>
            <Text className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {user ? (user.firstName || user.fullName || 'Job Seeker') : 'EtVacancy'}
            </Text>
          </View>

          {/* Profile icon only if logged in */}
          {user ? (
            <Link href="/(tabs)/(seeker)/profile" style={Platform.OS === 'web' ? { cursor: 'pointer' } as any : undefined}>
              <Avatar user={user} size="md" bordered ring />
            </Link>
          ) : null}
        </View>

        {/* ── Search Bar ─────────────────────── */}
        <View className="mb-6">
          <View className="flex-row items-center gap-2">
            <View className="flex-1 flex-row items-center bg-gray-100 dark:bg-neutral-800 rounded-2xl px-3.5 py-2.5">
              <Ionicons name="search-outline" size={18} color="#9CA3AF" style={{ marginRight: 8 }} />
              <TextInput
                value={homeSearchInput}
                onChangeText={setHomeSearchInput}
                placeholder="Search job title, skills, company..."
                placeholderTextColor="#9CA3AF"
                returnKeyType="search"
                onSubmitEditing={() => handleSearch()}
                style={{
                  flex: 1,
                  fontSize: 14,
                  color: Platform.OS === 'web' ? '#111827' : undefined,
                  outlineStyle: 'none',
                } as any}
              />
              {homeSearchInput.length > 0 && (
                <TouchableOpacity onPress={() => setHomeSearchInput('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              onPress={() => handleSearch()}
              activeOpacity={0.8}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              className="bg-primary-700 px-4 py-2.5 rounded-2xl flex-row items-center justify-center"
              style={[
                Platform.OS === 'web' ? { cursor: 'pointer' } as any : {},
                { backgroundColor: COLORS.primary, minHeight: 44 },
              ]}
            >
              <Ionicons name="search" size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Quick trending tags */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mt-2.5"
            contentContainerStyle={{ gap: 6, paddingRight: 8 }}
          >
            {['Software', 'Finance', 'Remote', 'Healthcare', 'Addis Ababa', 'Marketing', 'Engineering'].map((kw) => (
              <TouchableOpacity
                key={kw}
                onPress={() => {
                  setHomeSearchInput(kw);
                  handleSearch(kw);
                }}
                activeOpacity={0.7}
                className="bg-gray-100 dark:bg-neutral-800 px-3 py-1.5 rounded-full"
                style={Platform.OS === 'web' ? { cursor: 'pointer' } as any : {}}
              >
                <Text className="text-xs font-medium text-gray-600 dark:text-gray-300">{kw}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── Featured Jobs (Horizontal Sliding Carousel with Next Slide Cue) ──── */}
        <View className="flex-row items-center justify-between mb-3">
          <View>
            <View className="flex-row items-center gap-2">
              <Text className="text-lg font-bold text-gray-900 dark:text-gray-100">Featured Jobs</Text>
              {featuredJobs.length > 1 && (
                <View className="bg-primary-50 dark:bg-primary-900/30 px-2 py-0.5 rounded-full border border-primary-100 dark:border-primary-800">
                  <Text className="text-[10px] font-bold text-primary-700 dark:text-primary-300">
                    {activeFeaturedIndex + 1}/{featuredJobs.length}
                  </Text>
                </View>
              )}
            </View>
            <Text className="text-xs text-gray-500">Hand-picked opportunities for you</Text>
          </View>

          <View className="flex-row items-center gap-2">
            {featuredJobs.length > 1 && activeFeaturedIndex < featuredJobs.length - 1 && (
              <TouchableOpacity
                onPress={handleNextFeaturedSlide}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                className="flex-row items-center gap-1 bg-primary-50 dark:bg-primary-900/30 px-2.5 py-1 rounded-lg border border-primary-200 dark:border-primary-800"
                style={Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}}
              >
                <Text className="text-xs font-bold text-primary-700 dark:text-primary-300">Next</Text>
                <Ionicons name="chevron-forward" size={13} color={COLORS.primary} />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={() => router.push('/(tabs)/(seeker)/jobs')}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={[
                Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {},
                { paddingVertical: 4, paddingHorizontal: 6 },
              ]}
            >
              <Text className="text-sm font-bold text-primary-700 dark:text-primary-400">See All →</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="mb-6">
          {featuredJobs.length > 0 ? (
            <View>
              <ScrollView
                ref={featuredScrollRef}
                horizontal
                pagingEnabled={false}
                snapToInterval={SNAP_INTERVAL}
                snapToAlignment="start"
                decelerationRate="fast"
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  gap: CARD_GAP,
                  paddingRight: 24, // allows next card to peek clearly
                }}
                onScroll={(e) => {
                  const offsetX = e.nativeEvent.contentOffset.x;
                  const idx = Math.round(offsetX / SNAP_INTERVAL);
                  if (idx !== activeFeaturedIndex && idx >= 0 && idx < featuredJobs.length) {
                    setActiveFeaturedIndex(idx);
                  }
                }}
                scrollEventThrottle={16}
              >
                {featuredJobs.map((job: Job, index: number) => (
                  <JobCard
                    key={`featured-${job.id}`}
                    job={job}
                    saved={isSaved(job.id)}
                    onToggleSave={toggleSave}
                    cardWidth={CARD_WIDTH}
                    isCarousel={true}
                  />
                ))}
              </ScrollView>

              {/* Horizontal Pagination & Next Slide Indicator */}
              {featuredJobs.length > 1 && (
                <View className="flex-row items-center justify-between mt-3 px-1">
                  {/* Pagination Dots */}
                  <View className="flex-row items-center gap-1.5">
                    {featuredJobs.map((_, i) => (
                      <TouchableOpacity
                        key={`dot-${i}`}
                        onPress={() => {
                          featuredScrollRef.current?.scrollTo({
                            x: i * SNAP_INTERVAL,
                            animated: true,
                          });
                          setActiveFeaturedIndex(i);
                        }}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        className={`h-2 rounded-full ${
                          activeFeaturedIndex === i
                            ? 'w-6 bg-primary-700 dark:bg-primary-500'
                            : 'w-2 bg-gray-300 dark:bg-neutral-600'
                        }`}
                        style={Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}}
                      />
                    ))}
                  </View>

                  {/* Next Slide Cue / Advance Button */}
                  <TouchableOpacity
                    onPress={
                      activeFeaturedIndex < featuredJobs.length - 1
                        ? handleNextFeaturedSlide
                        : () => {
                            featuredScrollRef.current?.scrollTo({ x: 0, animated: true });
                            setActiveFeaturedIndex(0);
                          }
                    }
                    activeOpacity={0.7}
                    className="flex-row items-center gap-1"
                    style={Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}}
                  >
                    <Text className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                      {activeFeaturedIndex < featuredJobs.length - 1
                        ? `Next slide (${activeFeaturedIndex + 2}/${featuredJobs.length})`
                        : 'Back to first slide'}
                    </Text>
                    <Ionicons
                      name={
                        activeFeaturedIndex < featuredJobs.length - 1
                          ? 'arrow-forward'
                          : 'refresh-outline'
                      }
                      size={12}
                      color={COLORS.primary}
                    />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ) : loadingJobs ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: CARD_GAP }}>
              {[1, 2, 3].map((i) => (
                <View
                  key={i}
                  style={{ height: 180, width: CARD_WIDTH }}
                  className="rounded-2xl bg-gray-100 dark:bg-neutral-800 opacity-50"
                />
              ))}
            </ScrollView>
          ) : null}
        </View>

        {/* ── Categories ─────────────────────── */}
        {(() => {
          // Chunk categories into pages of CAT_PER_PAGE (3 cols × 2 rows = 6 per page)
          const categoryPages: Category[][] = [];
          for (let i = 0; i < categories.length; i += CAT_PER_PAGE) {
            categoryPages.push(categories.slice(i, i + CAT_PER_PAGE));
          }
          const totalPages = categoryPages.length;

          return (
            <>
              <View className="flex-row items-center justify-between mt-2 mb-3">
                <View>
                  <View className="flex-row items-center gap-2">
                    <Text className="text-lg font-bold text-gray-900 dark:text-gray-100">Browse Categories</Text>
                    {totalPages > 1 && (
                      <View className="bg-primary-50 dark:bg-primary-900/30 px-2 py-0.5 rounded-full border border-primary-100 dark:border-primary-800">
                        <Text className="text-[10px] font-bold text-primary-700 dark:text-primary-300">
                          {activeCategoryPage + 1}/{totalPages}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-xs text-gray-500">Explore jobs by industry</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  {totalPages > 1 && activeCategoryPage < totalPages - 1 && (
                    <TouchableOpacity
                      onPress={handleNextCategoryPage}
                      activeOpacity={0.7}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      className="flex-row items-center gap-1 bg-primary-50 dark:bg-primary-900/30 px-2.5 py-1 rounded-lg border border-primary-200 dark:border-primary-800"
                      style={Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}}
                    >
                      <Text className="text-xs font-bold text-primary-700 dark:text-primary-300">Next</Text>
                      <Ionicons name="chevron-forward" size={13} color={COLORS.primary} />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={() => router.push('/(tabs)/(seeker)/jobs')}
                    activeOpacity={0.7}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={[
                      Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {},
                      { paddingVertical: 4, paddingHorizontal: 6 },
                    ]}
                  >
                    <Text className="text-sm font-bold text-primary-700 dark:text-primary-400">See All →</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Paginated category grid — snaps full pages, no half-cuts */}
              <ScrollView
                ref={categoryScrollRef}
                horizontal
                pagingEnabled={false}
                snapToInterval={CAT_PAGE_SNAP}
                snapToAlignment="start"
                decelerationRate="fast"
                showsHorizontalScrollIndicator={false}
                scrollEnabled={totalPages > 1}
                className="mb-3"
                contentContainerStyle={{
                  // Last page gets a 14px right margin so the outer border is visible
                  paddingRight: totalPages > 1 ? 14 : 0,
                  gap: 14,
                }}
                onScroll={(e) => {
                  const offsetX = e.nativeEvent.contentOffset.x;
                  const idx = Math.round(offsetX / CAT_PAGE_SNAP);
                  if (idx !== activeCategoryPage && idx >= 0 && idx < totalPages) {
                    setActiveCategoryPage(idx);
                  }
                }}
                scrollEventThrottle={16}
              >
                {categoryPages.map((page, pageIdx) => (
                  <View
                    key={`cat-page-${pageIdx}`}
                    style={{ width: CAT_PAGE_WIDTH }}
                  >
                    {/* Row 1 */}
                    <View style={{ flexDirection: 'row', gap: CAT_GAP, marginBottom: CAT_GAP }}>
                      {page.slice(0, CAT_COLS).map((category, idx) => (
                        <TouchableOpacity
                          key={category.id ?? `cat-${pageIdx}-${idx}`}
                          onPress={() => handleCategoryPress(category)}
                          activeOpacity={0.75}
                          style={[
                            {
                              width: CAT_ITEM_WIDTH,
                              paddingVertical: 14,
                              paddingHorizontal: 8,
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: 14,
                              backgroundColor: 'white',
                              borderWidth: 1,
                              borderColor: '#F3F4F6',
                            },
                            Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {},
                          ]}
                        >
                          <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                            <Ionicons name={getCategoryIcon(category.slug || category.icon)} size={20} color={COLORS.primary} />
                          </View>
                          <Text style={{ fontSize: 10, fontWeight: '600', color: '#1F2937', textAlign: 'center' }} numberOfLines={2}>
                            {category.name}
                          </Text>
                          {category.jobsCount != null && (
                            <Text style={{ fontSize: 9, color: '#6B7280', marginTop: 2 }}>{category.jobsCount} jobs</Text>
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                    {/* Row 2 */}
                    {page.length > CAT_COLS && (
                      <View style={{ flexDirection: 'row', gap: CAT_GAP }}>
                        {page.slice(CAT_COLS, CAT_COLS * 2).map((category, idx) => (
                          <TouchableOpacity
                            key={category.id ?? `cat-${pageIdx}-r2-${idx}`}
                            onPress={() => handleCategoryPress(category)}
                            activeOpacity={0.75}
                            style={[
                              {
                                width: CAT_ITEM_WIDTH,
                                paddingVertical: 14,
                                paddingHorizontal: 8,
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: 14,
                                backgroundColor: 'white',
                                borderWidth: 1,
                                borderColor: '#F3F4F6',
                              },
                              Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {},
                            ]}
                          >
                            <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                              <Ionicons name={getCategoryIcon(category.slug || category.icon)} size={20} color={COLORS.primary} />
                            </View>
                            <Text style={{ fontSize: 10, fontWeight: '600', color: '#1F2937', textAlign: 'center' }} numberOfLines={2}>
                              {category.name}
                            </Text>
                            {category.jobsCount != null && (
                              <Text style={{ fontSize: 9, color: '#6B7280', marginTop: 2 }}>{category.jobsCount} jobs</Text>
                            )}
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                ))}
              </ScrollView>

              {/* Page dots */}
              {totalPages > 1 && (
                <View className="flex-row justify-center items-center gap-1.5 mb-5">
                  {categoryPages.map((_, i) => (
                    <TouchableOpacity
                      key={`cat-dot-${i}`}
                      onPress={() => {
                        categoryScrollRef.current?.scrollTo({ x: i * CAT_PAGE_SNAP, animated: true });
                        setActiveCategoryPage(i);
                      }}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      style={[
                        { height: 7, borderRadius: 4 },
                        activeCategoryPage === i
                          ? { width: 22, backgroundColor: COLORS.primary }
                          : { width: 7, backgroundColor: '#D1D5DB' },
                        Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {},
                      ]}
                    />
                  ))}
                </View>
              )}
            </>
          );
        })()}

        {/* ── Recently Posted (Equal Full-Width Cards) ── */}
        <View className="flex-row items-center justify-between mb-3">
          <View>
            <Text className="text-lg font-bold text-gray-900 dark:text-gray-100">Recently Posted</Text>
            <Text className="text-xs text-gray-500">Fresh opportunities every day</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/(seeker)/jobs')}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={[
              Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {},
              { paddingVertical: 4, paddingHorizontal: 8 },
            ]}
          >
            <Text className="text-sm font-bold text-primary-700 dark:text-primary-400">See All →</Text>
          </TouchableOpacity>
        </View>

        <View className="mb-4">
          {recentJobs.map((job: Job) => (
            <JobCard
              key={`recent-${job.id}`}
              job={job}
              saved={isSaved(job.id)}
              onToggleSave={toggleSave}
            />
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}
