import { View, Text, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { Screen } from '@components/ui/Screen';
import { Card } from '@components/ui/Card';
import Button from '@components/ui/Button';
import { Ionicons } from '@expo/vector-icons';
import { useSavedJobs } from '@hooks/index';
import { COLORS, JOB_TYPES, EXPERIENCE_LEVELS } from '@constants/index';
import { formatDate, truncate, formatSalaryRange } from '@utils/index';
import type { SavedJob, Job } from '@/types/index';

export default function SavedJobsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const { savedJobs, savedCount, isLoading, toggleSave } = useSavedJobs();

  const toggleSaved = useCallback(
    (savedJob: SavedJob) => {
      const job = savedJob.job as Job | null | undefined;
      Alert.alert(
        'Remove Saved Job',
        `Are you sure you want to remove "${job?.title ?? 'this job'}" from saved jobs?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => {
              if (job) {
                toggleSave(job);
              }
            },
          },
        ],
      );
    },
    [toggleSave],
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['saved-jobs'] });
    setRefreshing(false);
  }, [queryClient]);

  const renderSavedJob = ({ item }: { item: SavedJob }) => {
    const job = item.job as Job | null | undefined;
    if (!job) return null;

    return (
      <TouchableOpacity
        onPress={() => router.push(`/jobs/${job.id}`)}
        activeOpacity={0.7}
        className="mb-3"
      >
        <Card padding="md" variant="elevated">
          <View className="flex-row items-start justify-between mb-3">
            <View className="flex-1 flex-row items-start gap-3">
              <View className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 items-center justify-center flex-shrink-0">
                <Ionicons name="bookmark" size={20} color={COLORS.accent} />
              </View>
              <View className="flex-1">
                <Text
                  className="font-bold text-gray-900 dark:text-gray-100 text-base mb-1"
                  style={{ includeFontPadding: false }}
                >
                  {truncate(job.title, 45)}
                </Text>
                <Text
                  className="text-sm text-gray-500 dark:text-gray-400 mb-1"
                  style={{ includeFontPadding: false }}
                >
                  {job.company?.name ?? 'Unknown Company'}
                </Text>
                <View className="flex-row items-center gap-1">
                  <Ionicons name="location-outline" size={14} color="#6B7280" />
                  <Text
                    className="text-xs text-gray-500 dark:text-gray-400"
                    style={{ includeFontPadding: false }}
                  >
                    {[job.city, job.country].filter(Boolean).join(', ') || 'Ethiopia'}
                  </Text>
                </View>
              </View>
            </View>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                toggleSaved(item);
              }}
              className="p-2 -mr-2 -mt-2"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.6}
            >
              <Ionicons name="bookmark" size={22} color={COLORS.accent} />
            </TouchableOpacity>
          </View>
          <View className="flex-row flex-wrap gap-2 mb-3">
            <View className="bg-primary-50 dark:bg-primary-900/20 px-3 py-1.5 rounded-lg">
              <Text
                className="text-xs font-medium text-primary-700 dark:text-primary-300"
                style={{ includeFontPadding: false }}
              >
                {JOB_TYPES.find((t) => t.value === job.type)?.label ?? job.type}
              </Text>
            </View>
            <View className="bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg">
              <Text
                className="text-xs font-medium text-blue-700 dark:text-blue-300"
                style={{ includeFontPadding: false }}
              >
                {EXPERIENCE_LEVELS.find((e) => e.value === job.experienceLevel)?.label ??
                  job.experienceLevel}
              </Text>
            </View>
          </View>
          <View className="flex-row items-center justify-between pt-2 border-t border-gray-100 dark:border-neutral-700">
            <Text
              className="text-sm font-semibold text-primary-700 dark:text-primary-300"
              style={{ includeFontPadding: false }}
            >
              {formatSalaryRange(job.salaryMin, job.salaryMax, job.salaryPeriod, job.salaryCurrency)}
            </Text>
            <View className="flex-row items-center gap-3">
              <View className="flex-row items-center gap-1">
                <Ionicons name="time-outline" size={12} color="#F59E0B" />
                <Text
                  className="text-xs text-amber-600 dark:text-amber-400 font-medium"
                  style={{ includeFontPadding: false }}
                >
                  Saved {formatDate(item.savedAt, 'relative')}
                </Text>
              </View>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <Screen scrollable={false}>
      <View className="mb-4">
        <View className="flex-row items-center justify-between mb-2">
          <Text
            className="text-2xl font-bold text-gray-900 dark:text-gray-100"
            style={{ includeFontPadding: false }}
          >
            📌 Saved Jobs
          </Text>
          {savedCount > 0 && (
            <View className="bg-primary-100 dark:bg-primary-900/30 px-3 py-1 rounded-full">
              <Text
                className="text-sm font-bold text-primary-700 dark:text-primary-300"
                style={{ includeFontPadding: false }}
              >
                {savedCount}
              </Text>
            </View>
          )}
        </View>
        <Text
          className="text-sm text-gray-500 dark:text-gray-400"
          style={{ includeFontPadding: false }}
        >
          {savedCount > 0 ? 'Your bookmarked opportunities' : 'Start saving jobs to apply later'}
        </Text>
      </View>

      <FlatList
        data={savedJobs}
        renderItem={renderSavedJob}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !isLoading ? (
            <View className="items-center py-20">
              <View className="w-28 h-28 bg-amber-50 dark:bg-amber-900/20 rounded-full items-center justify-center mb-6">
                <Ionicons name="bookmark-outline" size={56} color={COLORS.accent} />
              </View>
              <Text
                className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2"
                style={{ includeFontPadding: false }}
              >
                No Saved Jobs Yet
              </Text>
              <Text
                className="text-sm text-gray-500 dark:text-gray-400 text-center px-10 mb-8"
                style={{ includeFontPadding: false }}
              >
                Tap the bookmark icon on any job to save it here. Build your shortlist and apply when you&apos;re ready!
              </Text>
              <Button
                title="Browse Jobs"
                variant="primary"
                size="lg"
                leftIcon="briefcase-outline"
                onPress={() => router.push('/jobs')}
              />
            </View>
          ) : null
        }
      />
    </Screen>
  );
}
