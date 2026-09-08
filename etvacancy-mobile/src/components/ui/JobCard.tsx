import React from 'react';
import { View, Text, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, JOB_TYPES, EXPERIENCE_LEVELS } from '@constants/index';
import { formatDate, formatSalaryRange } from '@utils/index';
import type { Job } from '@/types/index';

interface JobCardProps {
  job: Job;
  saved?: boolean;
  onToggleSave?: (job: Job) => void;
  aiScoreData?: { score: number; reason: string };
  style?: any;
  cardWidth?: number | string;
  isCarousel?: boolean;
}

export function JobCard({
  job,
  saved = false,
  onToggleSave,
  aiScoreData,
  style,
  cardWidth,
  isCarousel = false,
}: JobCardProps) {
  const router = useRouter();

  const handlePress = () => {
    router.push(`/jobs/${job.id}` as any);
  };

  const jobTypeLabel =
    JOB_TYPES.find((t) => t.value === job.type)?.label ?? job.type ?? 'Full Time';
  const experienceLabel =
    EXPERIENCE_LEVELS.find((e) => e.value === job.experienceLevel)?.label ??
    job.experienceLevel ??
    'Any Experience';
  const location =
    [job.city, job.country].filter(Boolean).join(', ') || 'Addis Ababa, Ethiopia';

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={handlePress}
      style={[
        isCarousel ? styles.carouselCardContainer : styles.cardContainer,
        cardWidth ? { width: cardWidth } : {},
        Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {},
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`View job: ${job.title}`}
    >
      <View
        className="bg-white dark:bg-neutral-800 rounded-2xl p-4 border border-gray-100 dark:border-neutral-700 shadow-sm justify-between"
        style={[
          isCarousel
            ? {
                height: 195,
                justifyContent: 'space-between',
              }
            : undefined,
        ]}
      >
        {/* Optional AI Match Banner */}
        {aiScoreData && (
          <View className="mb-2 flex-row items-center justify-between bg-primary-50 dark:bg-primary-900/30 px-2.5 py-1 rounded-xl border border-primary-100 dark:border-primary-800">
            <View className="flex-row items-center gap-1.5 flex-1 mr-2">
              <Ionicons name="sparkles" size={12} color={COLORS.primary} />
              <Text
                className="text-[11px] font-semibold text-primary-800 dark:text-primary-300 flex-1"
                numberOfLines={1}
                style={{ includeFontPadding: false }}
              >
                {aiScoreData.reason}
              </Text>
            </View>
            <View className="bg-primary-700 px-2 py-0.5 rounded-full">
              <Text
                className="text-[9px] font-bold text-white"
                style={{ includeFontPadding: false }}
              >
                {aiScoreData.score}% Match
              </Text>
            </View>
          </View>
        )}

        {/* Header: Icon, Full Title, Company, Urgent & Save Button */}
        <View className="flex-row items-start justify-between mb-1.5">
          <View className="flex-1 flex-row items-start gap-2.5 mr-1.5">
            <View className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/40 items-center justify-center flex-shrink-0 border border-primary-100 dark:border-primary-800/60">
              <Ionicons name="briefcase-outline" size={18} color={COLORS.primary} />
            </View>
            <View className="flex-1">
              <Text
                className="font-bold text-gray-900 dark:text-gray-100 text-sm leading-5 mb-0.5"
                numberOfLines={1}
                style={{ includeFontPadding: false }}
              >
                {job.title}
              </Text>
              <Text
                className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-0.5"
                numberOfLines={1}
                style={{ includeFontPadding: false }}
              >
                {job.company?.name ?? 'Company Name'}
              </Text>
              <View className="flex-row items-center gap-1">
                <Ionicons name="location-outline" size={12} color="#6B7280" />
                <Text
                  className="text-[11px] text-gray-500 dark:text-gray-400"
                  numberOfLines={1}
                  style={{ includeFontPadding: false }}
                >
                  {location}
                </Text>
              </View>
            </View>
          </View>

          <View className="flex-row items-center gap-1.5 flex-shrink-0">
            {job.urgentHiring && (
              <View className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 px-1.5 py-0.5 rounded-lg flex-shrink-0">
                <Text
                  className="text-[9px] font-bold text-red-600 dark:text-red-400"
                  style={{ includeFontPadding: false }}
                >
                  🔥 Urgent
                </Text>
              </View>
            )}
            {onToggleSave && (
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  onToggleSave(job);
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                className={`w-7 h-7 rounded-xl items-center justify-center ${
                  saved
                    ? 'bg-amber-100 dark:bg-amber-900/40 border border-amber-300 dark:border-amber-700'
                    : 'bg-gray-50 dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600'
                }`}
                activeOpacity={0.7}
                accessibilityLabel={saved ? 'Remove job from saved' : 'Save job'}
              >
                <Ionicons
                  name={saved ? 'bookmark' : 'bookmark-outline'}
                  size={13}
                  color={saved ? '#F59E0B' : '#6B7280'}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Badges / Meta Info */}
        <View
          className="flex-row items-center gap-1.5 my-1"
          style={{ height: 26, overflow: 'hidden' }}
        >
          <View className="bg-primary-50 dark:bg-primary-900/20 px-2 py-0.5 rounded-lg border border-primary-100/60 dark:border-primary-800/40">
            <Text
              className="text-[10px] font-semibold text-primary-700 dark:text-primary-300"
              numberOfLines={1}
              style={{ includeFontPadding: false }}
            >
              {jobTypeLabel}
            </Text>
          </View>
          <View className="bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-lg border border-blue-100/60 dark:border-blue-800/40">
            <Text
              className="text-[10px] font-semibold text-blue-700 dark:text-blue-300"
              numberOfLines={1}
              style={{ includeFontPadding: false }}
            >
              {experienceLabel}
            </Text>
          </View>
          {job.employmentType && (
            <View className="bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 rounded-lg border border-purple-100/60 dark:border-purple-800/40">
              <Text
                className="text-[10px] font-semibold text-purple-700 dark:text-purple-300"
                numberOfLines={1}
                style={{ includeFontPadding: false }}
              >
                {job.employmentType}
              </Text>
            </View>
          )}
        </View>

        {/* Footer: Salary & Posted Date */}
        <View className="flex-row items-center justify-between pt-2 border-t border-gray-100 dark:border-neutral-700/80 mt-1">
          <Text
            className="text-xs font-bold text-primary-700 dark:text-primary-300 flex-1 mr-2"
            numberOfLines={1}
            style={{ includeFontPadding: false }}
          >
            {formatSalaryRange(job.salaryMin, job.salaryMax, job.salaryPeriod, job.salaryCurrency)}
          </Text>
          <View className="flex-row items-center gap-1 flex-shrink-0">
            <Ionicons name="time-outline" size={11} color="#9CA3AF" />
            <Text
              className="text-[10px] text-gray-500 dark:text-gray-400"
              style={{ includeFontPadding: false }}
            >
              {formatDate(job.createdAt, 'relative')}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: '100%',
    marginBottom: 12,
  },
  carouselCardContainer: {
    marginBottom: 0,
  },
});
