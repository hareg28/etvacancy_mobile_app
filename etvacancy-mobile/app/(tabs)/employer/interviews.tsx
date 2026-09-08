import { View, Text, FlatList, TouchableOpacity, RefreshControl, Alert, Modal, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { Screen } from '@components/ui/Screen';
import { Card } from '@components/ui/Card';
import { Avatar, AvatarGroup } from '@components/ui/Avatar';
import Button from '@components/ui/Button';
import { Ionicons } from '@expo/vector-icons';
import { interviews as interviewsApi } from '@api/index';
import { COLORS, INTERVIEW_STATUS_LABELS, INTERVIEW_TYPES } from '@constants/index';
import { formatDateTime, formatDate, formatTime, truncate, getFullName } from '@utils/index';
import type { Interview } from '@/types/index';

type FilterTab = 'all' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

const tabs: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'SCHEDULED', label: 'Upcoming' },
  { key: 'IN_PROGRESS', label: 'Live' },
  { key: 'COMPLETED', label: 'Done' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

const statusMap = {
  SCHEDULED: { bg: 'bg-primary-100 dark:bg-primary-900/30', text: 'text-primary-700 dark:text-primary-300', dot: COLORS.primary },
  IN_PROGRESS: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', dot: COLORS.accent },
  COMPLETED: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', dot: COLORS.success },
  CANCELLED: { bg: 'bg-gray-100 dark:bg-neutral-700', text: 'text-gray-700 dark:text-gray-400', dot: '#6B7280' },
  NO_SHOW: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', dot: COLORS.danger },
};

export default function EmployerInterviewsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [targetInterview, setTargetInterview] = useState<Interview | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['interviews', 'list', activeTab],
    queryFn: () => interviewsApi.list({ limit: 50, status: activeTab === 'all' ? undefined : activeTab }),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      interviewsApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interviews'] });
    },
  });

  const addFeedback = useMutation({
    mutationFn: ({ id, feedback, rating }: { id: string; feedback: string; rating?: number }) =>
      interviewsApi.addFeedback(id, feedback, rating),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interviews'] });
      Alert.alert('Feedback Added', 'Thank you! Your feedback has been saved.');
    },
  });

  const filteredData = data?.data ?? [];

  const handleAction = (interview: Interview, action: 'start' | 'complete' | 'cancel' | 'reschedule' | 'feedback') => {
    setTargetInterview(interview);
    switch (action) {
      case 'start':
        updateStatus.mutate({ id: interview.id, status: 'IN_PROGRESS' });
        break;
      case 'complete':
        updateStatus.mutate({ id: interview.id, status: 'COMPLETED' });
        setFeedbackText('');
        setFeedbackModalVisible(true);
        break;
      case 'cancel':
        Alert.alert('Cancel Interview', 'Are you sure? The candidate will be notified.', [
          { text: 'Keep It', style: 'cancel' },
          {
            text: 'Yes, Cancel',
            style: 'destructive',
            onPress: () => updateStatus.mutate({ id: interview.id, status: 'CANCELLED' }),
          },
        ]);
        break;
      case 'reschedule':
        Alert.alert('Reschedule Interview', 'Select applicant from Applicants list to reschedule.');
        break;
      case 'feedback':
        setFeedbackText('');
        setFeedbackModalVisible(true);
        break;
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['interviews'] });
    setRefreshing(false);
  }, [queryClient]);

  const renderInterview = ({ item }: { item: Interview }) => {
    const type = INTERVIEW_TYPES.find((t) => t.value === item.type) ?? INTERVIEW_TYPES[0];
    const style = statusMap[item.status] ?? statusMap.SCHEDULED;

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        className="mb-3"
      >
        <Card padding="md" variant="elevated">
          <View className="flex-row items-start mb-3">
            <View className={`w-14 h-14 rounded-2xl ${style.bg} items-center justify-center mr-4 flex-shrink-0`}>
              <Ionicons name={type.icon as any} size={26} color={style.dot} />
            </View>
            <View className="flex-1">
              <View className="flex-row items-start justify-between mb-1">
                <Text
                  className="font-bold text-gray-900 dark:text-gray-100 text-base flex-shrink-0 pr-2"
                  style={{ includeFontPadding: false }}
                >
                  {truncate(item.title, 35)}
                </Text>
                <View
                  className={`px-2.5 py-1 rounded-full flex-row items-center gap-1 ${style.bg}`}
                >
                  <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: style.dot }} />
                  <Text
                    className={`text-[10px] font-bold ${style.text}`}
                    style={{ includeFontPadding: false }}
                  >
                    {INTERVIEW_STATUS_LABELS[item.status]?.label ?? item.status}
                  </Text>
                </View>
              </View>
              <Text
                className="text-xs text-gray-500 dark:text-gray-400 mb-2"
                style={{ includeFontPadding: false }}
              >
                {type.label} • {item.job?.title ?? 'Unknown Position'}
              </Text>
              <View className="flex-row items-center gap-3">
                <View className="flex-row items-center gap-1">
                  <Ionicons name="calendar-outline" size={14} color={COLORS.primary} />
                  <Text
                    className="text-xs font-semibold text-gray-700 dark:text-gray-300"
                    style={{ includeFontPadding: false }}
                  >
                    {formatDate(item.scheduledAt, 'short')}
                  </Text>
                </View>
                <View className="flex-row items-center gap-1">
                  <Ionicons name="time-outline" size={14} color={COLORS.primary} />
                  <Text
                    className="text-xs font-semibold text-gray-700 dark:text-gray-300"
                    style={{ includeFontPadding: false }}
                  >
                    {formatTime(item.scheduledAt)} • {item.durationMinutes}m
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Location / Meeting URL */}
          {(item.location || item.meetingUrl) && (
            <View className="flex-row items-start p-3 bg-gray-50 dark:bg-neutral-700/50 rounded-xl mb-3">
              <Ionicons
                name={item.meetingUrl ? 'videocam-outline' : 'location-outline'}
                size={16}
                color={COLORS.primary}
                style={{ marginTop: 2, marginRight: 8 }}
              />
              <View className="flex-1">
                <Text
                  className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5"
                  style={{ includeFontPadding: false }}
                >
                  {item.meetingUrl ? 'Meeting Link' : 'Location'}
                </Text>
                <Text
                  className="text-xs font-medium text-gray-800 dark:text-gray-200"
                  style={{ includeFontPadding: false }}
                >
                  {truncate(item.location ?? item.meetingUrl ?? 'TBD', 45)}
                </Text>
              </View>
            </View>
          )}

          {/* Interviewers */}
          {item.interviewerIds && item.interviewerIds.length > 0 && (
            <View className="flex-row items-center mb-3">
              <Text
                className="text-[11px] text-gray-500 dark:text-gray-400 mr-3"
                style={{ includeFontPadding: false }}
              >
                {item.interviewerIds.length} interviewer{item.interviewerIds.length > 1 ? 's' : ''}
              </Text>
            </View>
          )}

          {/* Actions */}
          <View className="flex-row gap-2 flex-wrap">
            {item.status === 'SCHEDULED' && (
              <>
                <Button
                  title="Start Now"
                  size="sm"
                  variant="primary"
                  leftIcon="play-outline"
                  style={{ flex: 1 } as any}
                  onPress={() => handleAction(item, 'start')}
                />
                <Button
                  title="Reschedule"
                  size="sm"
                  variant="outline"
                  leftIcon="calendar-outline"
                  style={{ flex: 1 } as any}
                  onPress={() => handleAction(item, 'reschedule')}
                />
                <Button
                  title="Cancel"
                  size="sm"
                  variant="ghost"
                  leftIcon="close-circle-outline"
                  style={{ flex: 0.8 } as any}
                  onPress={() => handleAction(item, 'cancel')}
                />
              </>
            )}
            {item.status === 'IN_PROGRESS' && (
              <Button
                title="Complete Interview"
                size="sm"
                variant="primary"
                leftIcon="checkmark-done-circle-outline"
                fullWidth
                onPress={() => handleAction(item, 'complete')}
              />
            )}
            {item.status === 'COMPLETED' && (
              <Button
                title="Add / View Feedback"
                size="sm"
                variant="outline"
                leftIcon="chatbubble-ellipses-outline"
                fullWidth
                onPress={() => handleAction(item, 'feedback')}
              />
            )}
            {item.status === 'CANCELLED' && (
              <Button
                title="Reschedule"
                size="sm"
                variant="secondary"
                leftIcon="refresh-outline"
                fullWidth
                onPress={() => handleAction(item, 'reschedule')}
              />
            )}
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <Screen scrollable={false}>
      <View className="mb-4">
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text
              className="text-2xl font-bold text-gray-900 dark:text-gray-100"
              style={{ includeFontPadding: false }}
            >
              📅 Interviews
            </Text>
            <Text
              className="text-sm text-gray-500 dark:text-gray-400"
              style={{ includeFontPadding: false }}
            >
              {filteredData.length} scheduled
            </Text>
          </View>
          <TouchableOpacity
            className="w-11 h-11 bg-primary-700 rounded-xl items-center justify-center"
            onPress={() => router.push('/(tabs)/employer/applicants')}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={tabs}
          keyExtractor={(t) => t.key}
          renderItem={({ item }) => {
            const active = activeTab === item.key;
            return (
              <TouchableOpacity
                onPress={() => setActiveTab(item.key)}
                className={`px-4 py-2 mr-2 rounded-xl ${
                  active
                    ? 'bg-primary-700'
                    : 'bg-gray-100 dark:bg-neutral-700'
                }`}
                activeOpacity={0.7}
              >
                <Text
                  className={`text-sm font-semibold ${
                    active ? 'text-white' : 'text-gray-700 dark:text-gray-300'
                  }`}
                  style={{ includeFontPadding: false }}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      <FlatList
        data={filteredData}
        renderItem={renderInterview}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !isLoading ? (
            <View className="items-center py-20">
              <View className="w-28 h-28 bg-purple-50 dark:bg-purple-900/20 rounded-full items-center justify-center mb-6">
                <Ionicons name="calendar-clear-outline" size={56} color="#9333EA" />
              </View>
              <Text
                className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2"
                style={{ includeFontPadding: false }}
              >
                No Interviews Scheduled
              </Text>
              <Text
                className="text-sm text-gray-500 dark:text-gray-400 text-center px-10 mb-8"
                style={{ includeFontPadding: false }}
              >
                {activeTab === 'all'
                  ? 'Shortlist candidates to invite them for interviews. All your upcoming and past interviews will appear here.'
                  : `No interviews with status "${activeTab}".`}
              </Text>
              <View className="flex-row gap-3 w-full px-8">
                <Button
                  title="View Applicants"
                  variant="primary"
                  size="md"
                  leftIcon="people-outline"
                  style={{ flex: 1 } as any}
                  onPress={() => router.push('/(tabs)/employer/applicants')}
                />
                <Button
                  title="Schedule"
                  variant="outline"
                  size="md"
                  leftIcon="calendar-outline"
                  style={{ flex: 1 } as any}
                  onPress={() => router.push('/(tabs)/employer/applicants')}
                />
              </View>
            </View>
          ) : null
        }
      />

      {/* Feedback Modal */}
      <Modal
        visible={feedbackModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFeedbackModalVisible(false)}
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
          onPress={() => setFeedbackModalVisible(false)}
        >
          <View
            style={{
              width: '100%',
              maxWidth: 400,
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 24,
            }}
            onStartShouldSetResponder={() => true}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#0F172A' }}>Interview Feedback</Text>
              <TouchableOpacity onPress={() => setFeedbackModalVisible(false)}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 13, color: '#64748B', marginBottom: 12 }}>
              Add evaluation notes or feedback for {targetInterview?.title ?? 'candidate'}.
            </Text>

            <TextInput
              style={{
                borderWidth: 1,
                borderColor: '#CBD5E1',
                borderRadius: 10,
                padding: 12,
                fontSize: 14,
                color: '#0F172A',
                height: 100,
                textAlignVertical: 'top',
                marginBottom: 16,
                backgroundColor: '#F8FAFC',
              }}
              multiline
              placeholder="Candidate performance notes..."
              placeholderTextColor="#94A3B8"
              value={feedbackText}
              onChangeText={setFeedbackText}
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Button
                  title="Cancel"
                  variant="outline"
                  size="md"
                  onPress={() => setFeedbackModalVisible(false)}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  title="Save Feedback"
                  variant="primary"
                  size="md"
                  onPress={() => {
                    if (targetInterview && feedbackText.trim()) {
                      addFeedback.mutate({ id: targetInterview.id, feedback: feedbackText.trim() });
                    }
                    setFeedbackModalVisible(false);
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
