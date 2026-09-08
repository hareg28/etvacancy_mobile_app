import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Modal,
  StyleSheet,
  Alert,
  useWindowDimensions,
  Share,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import RenderHtml, { defaultSystemFonts } from 'react-native-render-html';
import { Screen } from '@components/ui/Screen';
import { ChatInput } from '@components/chat/ChatInput';
import { COLORS } from '@constants/index';
import { jobs as jobsApi, profile as profileApi } from '@api/index';
import { useLocalJobsStore, useJobFilterStore } from '@store/index';
import { chatWithAIAssistant, ChatMessage } from '@/services/ai.service';
import { formatSalaryRange, truncate, markdownToHtml, markdownToHtmlDark } from '@utils/index';
import type { Job } from '@/types/index';
import { useColorScheme } from 'nativewind';

const SUGGESTED_PROMPTS = [
  { id: '1', title: '📊 Software developer salary in Addis Ababa', icon: 'cash-outline' },
  { id: '2', title: '🎯 Software engineer interview prep & STAR answers', icon: 'help-circle-outline' },
  { id: '3', title: '⚖️ Ethiopian labor law rules on probation & leave', icon: 'shield-checkmark-outline' },
  { id: '4', title: '📝 How to optimize my CV for top companies', icon: 'document-text-outline' },
  { id: '5', title: '🌐 High-paying remote tech jobs for Ethiopians', icon: 'globe-outline' },
  { id: '6', title: '⚡ Urgent hiring vacancies this week', icon: 'flame-outline' },
];

export default function AIAssistantScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { width: screenWidth } = useWindowDimensions();
  const htmlContentWidth = Math.min(screenWidth - 96, screenWidth * 0.82);

  const flatListRef = useRef<FlatList>(null);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPlusModal, setShowPlusModal] = useState(false);
  const [showGetPlusModal, setShowGetPlusModal] = useState(false);
  const typewriterTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [feedbackMap, setFeedbackMap] = useState<Record<string, 'up' | 'down'>>({});

  const { getPublishedJobs } = useLocalJobsStore();
  const { setQuery, setRemoteOnly, setCity, setUrgentOnly } = useJobFilterStore();

  // Fetch available live jobs for contextual AI recommendations
  const { data: apiJobsData } = useQuery({
    queryKey: ['jobs', 'list', { limit: 25 }],
    queryFn: () => jobsApi.list({ limit: 25 }),
  });

  const { data: userProfile } = useQuery({
    queryKey: ['profile', 'me'],
    queryFn: () => profileApi.get(),
  });

  const allJobs = React.useMemo<Job[]>(() => {
    const apiJobs: Job[] = Array.isArray(apiJobsData?.data) ? apiJobsData.data : [];
    const localJobs = getPublishedJobs();
    const seenIds = new Set(apiJobs.map((j) => j.id));
    return [...apiJobs, ...localJobs.filter((j) => !seenIds.has(j.id))];
  }, [apiJobsData, getPublishedJobs]);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content: `Hello! 👋 I'm your **EtVacancy AI Career Assistant**.\n\nI can help you:\n• 🔍 **Find and recommend jobs** tailored to your skills & preferred salary\n• 📝 **Polish your resume / CV** for Ethiopian and remote employers\n• 🎯 **Prepare for interviews** with real situational questions & STAR answers\n• 💼 **Analyze career paths & salary benchmarks**\n\nHow can I help you take the next step in your career today?`,
      createdAt: new Date(),
    },
  ]);

  const stopTypewriter = useCallback(() => {
    if (typewriterTimerRef.current) {
      clearTimeout(typewriterTimerRef.current);
      typewriterTimerRef.current = null;
    }
  }, []);

  const startTypewriterEffect = useCallback(
    (messageId: string, fullText: string) => {
      stopTypewriter();
      setStreamingMessageId(messageId);
      let charIndex = 0;
      // Ultra-fast streaming: chunk text so the response completes smoothly in ~250-450ms
      const chunkSize = Math.max(12, Math.ceil(fullText.length / 22));
      const speed = 12;

      const tick = () => {
        charIndex += chunkSize;
        if (charIndex >= fullText.length) {
          setMessages((prev) =>
            prev.map((m) => (m.id === messageId ? { ...m, content: fullText } : m)),
          );
          setStreamingMessageId(null);
          typewriterTimerRef.current = null;
          return;
        }
        const partial = fullText.substring(0, charIndex) + '▌';
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, content: partial } : m)),
        );
        typewriterTimerRef.current = setTimeout(tick, speed);
      };
      tick();
    },
    [stopTypewriter],
  );

  useEffect(() => {
    return () => stopTypewriter();
  }, [stopTypewriter]);

  const handleSendMessage = useCallback(
    async (textToSend?: string) => {
      const text = (textToSend ?? inputText).trim();
      if (!text || isLoading) return;

      stopTypewriter();

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: text,
        createdAt: new Date(),
      };

      const assistantMsgId = `ai-${Date.now() + 1}`;
      const assistantMsg: ChatMessage = {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        createdAt: new Date(),
      };

      const updatedHistory = [...messages, userMsg, assistantMsg];
      setMessages(updatedHistory);
      setInputText('');
      setIsLoading(true);

      try {
        const conversationForAi = updatedHistory
          .filter((m) => m.id !== assistantMsgId)
          .map((m) => ({
            role: m.role === 'user' ? ('user' as const) : ('assistant' as const),
            content: m.content,
          }));

        const result = await chatWithAIAssistant({
          messages: conversationForAi,
          availableJobs: allJobs,
          userProfile: userProfile || null,
        });

        const matchScoreMap: Record<string, { score: number; reasons: string[] }> = {};
        if (result.matchScores) {
          Object.assign(matchScoreMap, result.matchScores);
        }

        const finalAssistantMsg: ChatMessage = {
          id: assistantMsgId,
          role: 'assistant',
          content: result.reply,
          createdAt: new Date(),
          jobRecommendations: result.recommendedJobs,
          jobMatchScores: Object.keys(matchScoreMap).length > 0 ? matchScoreMap : undefined,
          toolUsed: result.toolUsed,
          suggestedFollowUps: result.suggestedFollowUps,
        };

        setMessages((prev) =>
          prev.map((m) => (m.id === assistantMsgId ? finalAssistantMsg : m)),
        );
        startTypewriterEffect(assistantMsgId, result.reply);
      } catch (err) {
        console.error('Chat error:', err);
        const errorMsg: ChatMessage = {
          id: assistantMsgId,
          role: 'assistant',
          content:
            'Sorry, I encountered an issue processing that. Please try asking again or select a suggested topic.',
          createdAt: new Date(),
          isError: true,
        };
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantMsgId ? errorMsg : m)),
        );
      } finally {
        setIsLoading(false);
      }
    },
    [inputText, isLoading, messages, allJobs, userProfile, stopTypewriter, startTypewriterEffect],
  );

  useEffect(() => {
    if (messages.length > 1) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 150);
    }
  }, [messages, isLoading]);

  const handleApplyAIFilterToJobs = (filterType: 'remote' | 'tech' | 'urgent' | 'addis') => {
    if (filterType === 'remote') {
      setRemoteOnly(true);
      setQuery('');
    } else if (filterType === 'tech') {
      setQuery('Developer');
    } else if (filterType === 'urgent') {
      setUrgentOnly(true);
    } else if (filterType === 'addis') {
      setCity('Addis Ababa');
    }
    router.push('/(tabs)/(seeker)/jobs');
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: `Chat cleared! ✨ How can I assist you with your job search or career today?`,
        createdAt: new Date(),
      },
    ]);
  };

  const handlePlusActionSelect = (promptText: string) => {
    setShowPlusModal(false);
    handleSendMessage(promptText);
  };

  const handleCopyMessage = useCallback((messageId: string, content: string) => {
    const plainText = content.replace(/<[^>]*>/g, '').replace(/\[JOB_REC:\s*[^\]]+\]/g, '');
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(plainText);
    }
    setCopiedId(messageId);
    setTimeout(() => setCopiedId(null), 2500);
  }, []);

  const handleShareMessage = useCallback(async (content: string) => {
    const plainText = content.replace(/<[^>]*>/g, '').replace(/\[JOB_REC:\s*[^\]]+\]/g, '');
    try {
      await Share.share({
        message: `${plainText}\n\nShared via EtVacancy AI Career Assistant`,
        title: 'EtVacancy AI Career Insights',
      });
    } catch {
      // safe fallback
    }
  }, []);

  const handleRegenerateMessage = useCallback(
    (aiMessageId: string) => {
      const aiIndex = messages.findIndex((m) => m.id === aiMessageId);
      if (aiIndex > 0) {
        const prevUserMsg = messages[aiIndex - 1];
        if (prevUserMsg && prevUserMsg.role === 'user') {
          stopTypewriter();
          handleSendMessage(prevUserMsg.content);
        }
      }
    },
    [messages, stopTypewriter, handleSendMessage],
  );

  const handleFeedback = useCallback((messageId: string, type: 'up' | 'down') => {
    setFeedbackMap((prev) => ({
      ...prev,
      [messageId]: prev[messageId] === type ? (undefined as any) : type,
    }));
    Alert.alert(
      type === 'up' ? '👍 Thank You!' : '👎 Feedback Received',
      type === 'up'
        ? 'Glad this AI career advice was helpful!'
        : 'Thanks for the feedback. We will refine our AI responses further.',
      [{ text: 'OK' }],
    );
  }, []);

  const renderJobCard = (job: Job, matchScore?: { score: number; reasons: string[] }) => {
    const score = matchScore?.score ?? 0;
    const scoreColor =
      score >= 80 ? '#10B981' : score >= 60 ? '#F59E0B' : score >= 40 ? '#3B82F6' : '#6B7280';
    const scoreBg =
      score >= 80
        ? isDark
          ? 'rgba(16,185,129,0.15)'
          : '#ECFDF5'
        : score >= 60
        ? isDark
          ? 'rgba(245,158,11,0.15)'
          : '#FFFBEB'
        : isDark
        ? 'rgba(59,130,246,0.15)'
        : '#EFF6FF';

    return (
      <TouchableOpacity
        key={job.id}
        onPress={() => router.push(`/jobs/${job.id}`)}
        activeOpacity={0.7}
        style={[
          styles.jobCard,
          isDark ? styles.jobCardDark : styles.jobCardLight,
        ]}
      >
        <View className="flex-row items-start justify-between">
          <View className="flex-1 mr-2">
            <View className="flex-row items-center gap-1.5 mb-0.5">
              <Text
                className="font-bold text-gray-900 dark:text-gray-100 text-sm flex-1"
                style={{ includeFontPadding: false }}
                numberOfLines={1}
              >
                {truncate(job.title, 36)}
              </Text>
              {job.urgentHiring && (
                <View className="bg-red-50 dark:bg-red-900/30 px-1.5 py-0.5 rounded">
                  <Text
                    className="text-[9px] font-bold text-red-600 dark:text-red-400"
                    style={{ includeFontPadding: false }}
                  >
                    ⚡ URGENT
                  </Text>
                </View>
              )}
            </View>
            <Text
              className="text-xs text-gray-600 dark:text-gray-400 mb-1"
              style={{ includeFontPadding: false }}
            >
              {job.company?.name || 'Company'} • {job.city || 'Addis Ababa'}
            </Text>
          </View>
          <View className="flex-col items-end gap-1">
            <View className="bg-primary-50 dark:bg-primary-900/40 px-2 py-1 rounded-md">
              <Text
                className="text-[10px] font-bold text-primary-700 dark:text-primary-300"
                style={{ includeFontPadding: false }}
              >
                {job.employmentType || job.type || 'Full Time'}
              </Text>
            </View>
            {score > 0 && (
              <View
                style={{
                  backgroundColor: scoreBg,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 3,
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: '800',
                    color: scoreColor,
                    includeFontPadding: false,
                  }}
                >
                  {score}%
                </Text>
                <Text
                  style={{
                    fontSize: 9,
                    fontWeight: '600',
                    color: scoreColor,
                    includeFontPadding: false,
                  }}
                >
                  MATCH
                </Text>
              </View>
            )}
          </View>
        </View>

        {matchScore?.reasons && matchScore.reasons.length > 0 && (
          <Text
            className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 italic"
            style={{ includeFontPadding: false }}
            numberOfLines={2}
          >
            ✦ {matchScore.reasons[0]}
          </Text>
        )}

        <View className="flex-row items-center justify-between mt-2 pt-2 border-t border-gray-100 dark:border-neutral-700">
          <Text
            className="text-xs font-semibold text-primary-700 dark:text-primary-300"
            style={{ includeFontPadding: false }}
          >
            {formatSalaryRange(job.salaryMin, job.salaryMax, job.salaryPeriod, job.salaryCurrency)}
          </Text>
          <View className="flex-row items-center gap-1">
            <Text
              className="text-[11px] font-semibold text-primary-600 dark:text-primary-400"
              style={{ includeFontPadding: false }}
            >
              View Details
            </Text>
            <Ionicons name="arrow-forward" size={12} color={COLORS.primary} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderMessageItem = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';
    const cleanContent = streamingMessageId === item.id
      ? item.content.replace(/▌$/, '')
      : item.content;
    const htmlSrc = {
      html: isDark
        ? markdownToHtmlDark(cleanContent || '')
        : markdownToHtml(cleanContent || ''),
    };

    return (
      <View
        className={`mb-4 flex-row ${
          isUser ? 'justify-end' : 'justify-start'
        }`}
      >
        {!isUser && (
          <View className="w-8 h-8 rounded-full bg-primary-700 items-center justify-center mr-2 mt-1 flex-shrink-0 shadow-sm">
            <Ionicons name="sparkles" size={15} color="#FFFFFF" />
          </View>
        )}

        <View
          className={`max-w-[84%] p-3.5 rounded-2xl ${
            isUser
              ? 'bg-primary-700 rounded-tr-none'
              : 'bg-gray-100 dark:bg-neutral-800 rounded-tl-none border border-gray-200 dark:border-neutral-700'
          } ${item.isError ? 'border-2 border-red-400 dark:border-red-600' : ''}`}
        >
          {isUser ? (
            <Text
              className="text-sm leading-5 text-white font-medium"
              style={{ includeFontPadding: false }}
            >
              {item.content}
            </Text>
          ) : item.content === '' ? (
            <View className="flex-row items-center py-1">
              <ActivityIndicator size={14} color={COLORS.primary} style={{ marginRight: 8 }} />
              <Text
                className="text-xs text-gray-500 dark:text-gray-400 italic"
                style={{ includeFontPadding: false }}
              >
                Thinking...
              </Text>
            </View>
          ) : (
            <View style={{ overflow: 'hidden' }}>
              <RenderHtml
                contentWidth={htmlContentWidth}
                source={htmlSrc}
                systemFonts={defaultSystemFonts}
                enableExperimentalMarginCollapsing={true}
                enableRemoteImages={false}
                defaultTextProps={{
                  selectable: true,
                  textBreakStrategy: 'simple',
                }}
                tagsStyles={{
                  p: { color: isDark ? '#F1F5F9' : '#0F172A', fontSize: 13.5, lineHeight: 21 },
                  li: { color: isDark ? '#F1F5F9' : '#0F172A', fontSize: 13, lineHeight: 20 },
                  td: { color: isDark ? '#F1F5F9' : '#0F172A' },
                  th: { color: isDark ? '#F1F5F9' : '#0F172A' },
                  a: { color: isDark ? '#60A5FA' : '#2563EB' },
                  code: { color: isDark ? '#FDA4AF' : '#BE123C', fontFamily: 'monospace' },
                }}
                baseStyle={{
                  color: isDark ? '#F1F5F9' : '#0F172A',
                  fontSize: 13.5,
                  lineHeight: 21,
                }}
              />
              {streamingMessageId === item.id && (
                <Text
                  style={{
                    color: COLORS.primary,
                    fontWeight: '700',
                    fontSize: 14,
                    marginTop: -4,
                    includeFontPadding: false,
                  }}
                >
                  ▌
                </Text>
              )}
            </View>
          )}

          {!isUser && item.toolUsed && item.content !== '' && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                alignSelf: 'flex-start',
                marginTop: 10,
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 999,
                backgroundColor: isDark ? 'rgba(139,92,246,0.15)' : 'rgba(139,92,246,0.10)',
                gap: 4,
              }}
            >
              <Ionicons name="settings-outline" size={10} color={isDark ? '#A78BFA' : '#7C3AED'} />
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '700',
                  color: isDark ? '#A78BFA' : '#7C3AED',
                  includeFontPadding: false,
                  letterSpacing: 0.2,
                }}
              >
                {item.toolUsed.toUpperCase()}
              </Text>
            </View>
          )}

          {item.jobRecommendations && item.jobRecommendations.length > 0 && (
            <View className="mt-3">
              <View
                className="flex-row items-center gap-1.5 mb-1.5"
                style={{ paddingHorizontal: 2 }}
              >
                <Ionicons
                  name="briefcase-outline"
                  size={12}
                  color={isDark ? '#9CA3AF' : '#6B7280'}
                />
                <Text
                  className="text-[11px] font-bold text-gray-600 dark:text-gray-300"
                  style={{ includeFontPadding: false, letterSpacing: 0.15 }}
                >
                  RECOMMENDED VACANCIES · {item.jobRecommendations.length}
                </Text>
              </View>
              {item.jobRecommendations.map((job) =>
                renderJobCard(job, item.jobMatchScores?.[job.id]),
              )}
            </View>
          )}

          {!isUser &&
            item.suggestedFollowUps &&
            item.suggestedFollowUps.length > 0 &&
            item.content !== '' &&
            !streamingMessageId && (
              <View style={{ marginTop: 12, marginHorizontal: -2 }}>
                <Text
                  className="text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1.5"
                  style={{ includeFontPadding: false, letterSpacing: 0.3 }}
                >
                  FOLLOW-UP QUESTIONS
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 6, paddingRight: 4 }}
                >
                  {item.suggestedFollowUps.map((q, idx) => (
                    <TouchableOpacity
                      key={`${item.id}-fq-${idx}`}
                      disabled={isLoading}
                      onPress={() => {
                        stopTypewriter();
                        handleSendMessage(q);
                      }}
                      activeOpacity={0.7}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                        borderWidth: 1,
                        borderColor: isDark ? '#334155' : '#E2E8F0',
                        borderRadius: 999,
                        paddingHorizontal: 12,
                        paddingVertical: 7,
                        gap: 5,
                        marginRight: 6,
                      }}
                    >
                      <Ionicons
                        name="chatbubble-ellipses-outline"
                        size={11}
                        color={COLORS.primary}
                      />
                      <Text
                        numberOfLines={1}
                        style={{
                          maxWidth: htmlContentWidth * 0.8,
                          fontSize: 11.5,
                          fontWeight: '600',
                          color: isDark ? '#E2E8F0' : '#334155',
                          includeFontPadding: false,
                        }}
                      >
                        {q}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

          {/* ── ChatGPT-Style Interactive Utility Toolbar (Copy, Share, Retry, Feedback) ── */}
          {!isUser && item.content !== '' && streamingMessageId !== item.id && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: 10,
                paddingTop: 8,
                borderTopWidth: 1,
                borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                {/* Copy Button */}
                <TouchableOpacity
                  onPress={() => handleCopyMessage(item.id, item.content)}
                  activeOpacity={0.7}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                >
                  <Ionicons
                    name={copiedId === item.id ? 'checkmark-circle' : 'copy-outline'}
                    size={13}
                    color={copiedId === item.id ? '#10B981' : isDark ? '#9CA3AF' : '#6B7280'}
                  />
                  <Text
                    style={{
                      fontSize: 10.5,
                      fontWeight: '600',
                      color: copiedId === item.id ? '#10B981' : isDark ? '#9CA3AF' : '#6B7280',
                      includeFontPadding: false,
                    }}
                  >
                    {copiedId === item.id ? 'Copied' : 'Copy'}
                  </Text>
                </TouchableOpacity>

                {/* Share Button */}
                <TouchableOpacity
                  onPress={() => handleShareMessage(item.content)}
                  activeOpacity={0.7}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                >
                  <Ionicons
                    name="share-social-outline"
                    size={13}
                    color={isDark ? '#9CA3AF' : '#6B7280'}
                  />
                  <Text
                    style={{
                      fontSize: 10.5,
                      fontWeight: '600',
                      color: isDark ? '#9CA3AF' : '#6B7280',
                      includeFontPadding: false,
                    }}
                  >
                    Share
                  </Text>
                </TouchableOpacity>

                {/* Retry / Regenerate Button */}
                {!isLoading && (
                  <TouchableOpacity
                    onPress={() => handleRegenerateMessage(item.id)}
                    activeOpacity={0.7}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                  >
                    <Ionicons
                      name="refresh-outline"
                      size={13}
                      color={isDark ? '#9CA3AF' : '#6B7280'}
                    />
                    <Text
                      style={{
                        fontSize: 10.5,
                        fontWeight: '600',
                        color: isDark ? '#9CA3AF' : '#6B7280',
                        includeFontPadding: false,
                      }}
                    >
                      Retry
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Feedback Thumbs Up / Down */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <TouchableOpacity
                  onPress={() => handleFeedback(item.id, 'up')}
                  activeOpacity={0.7}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Ionicons
                    name={feedbackMap[item.id] === 'up' ? 'thumbs-up' : 'thumbs-up-outline'}
                    size={13}
                    color={feedbackMap[item.id] === 'up' ? '#2563EB' : isDark ? '#9CA3AF' : '#6B7280'}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleFeedback(item.id, 'down')}
                  activeOpacity={0.7}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Ionicons
                    name={feedbackMap[item.id] === 'down' ? 'thumbs-down' : 'thumbs-down-outline'}
                    size={13}
                    color={feedbackMap[item.id] === 'down' ? '#EF4444' : isDark ? '#9CA3AF' : '#6B7280'}
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}

          <Text
            className={`text-[10px] mt-2 self-end ${
              isUser ? 'text-blue-200' : 'text-gray-500 dark:text-gray-400'
            }`}
            style={{ includeFontPadding: false }}
          >
            {new Date(item.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>

        {isUser && (
          <View className="w-8 h-8 rounded-full bg-blue-100 dark:bg-neutral-700 items-center justify-center ml-2 mt-1 flex-shrink-0">
            <Ionicons name="person" size={16} color={COLORS.primary} />
          </View>
        )}
      </View>
    );
  };

  return (
    <Screen scrollable={false} withTabBar={true} padded={false} keyboardAvoiding={false}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* ── Top Header Matching Reference Design ── */}
        <View
          style={[
            styles.headerContainer,
            isDark ? styles.headerDark : styles.headerLight,
          ]}
        >
          {/* Left Menu / Navigation Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.back()}
            style={[
              styles.headerCircleBtn,
              isDark ? styles.headerCircleBtnDark : styles.headerCircleBtnLight,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Go back or open menu"
          >
            <Ionicons
              name="reorder-two-outline"
              size={22}
              color={isDark ? '#E5E7EB' : '#1F2937'}
            />
          </TouchableOpacity>

          {/* Center '+ Get Plus' Pill Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setShowGetPlusModal(true)}
            style={styles.getPlusPill}
            accessibilityRole="button"
            accessibilityLabel="Get Plus"
          >
            <Ionicons name="sparkles" size={14} color="#2563EB" />
            <Text style={styles.getPlusText}>Get Plus</Text>
          </TouchableOpacity>

          {/* Right New Chat / Clear Icon Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleClearChat}
            style={[
              styles.headerCircleBtn,
              isDark ? styles.headerCircleBtnDark : styles.headerCircleBtnLight,
            ]}
            accessibilityRole="button"
            accessibilityLabel="New Chat"
          >
            <Ionicons
              name="chatbubble-outline"
              size={18}
              color={isDark ? '#E5E7EB' : '#1F2937'}
            />
          </TouchableOpacity>
        </View>

        {/* Suggested Prompt Chips */}
        <View className="py-2 px-3">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 10, gap: 8 }}
          >
            {SUGGESTED_PROMPTS.map((prompt) => (
              <TouchableOpacity
                key={prompt.id}
                onPress={() => handleSendMessage(prompt.title)}
                className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-50 dark:bg-neutral-800 border border-primary-100 dark:border-neutral-700"
                activeOpacity={0.7}
              >
                <Ionicons
                  name={prompt.icon as any}
                  size={13}
                  color={COLORS.primary}
                />
                <Text
                  className="text-xs font-semibold text-primary-800 dark:text-primary-300"
                  style={{ includeFontPadding: false }}
                >
                  {prompt.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Chat Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessageItem}
          keyExtractor={(item) => item.id}
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingVertical: 10,
            paddingBottom: 16,
          }}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            isLoading ? (
              <View className="flex-row items-center gap-2 mb-4">
                <View className="w-8 h-8 rounded-full bg-primary-700 items-center justify-center">
                  <Ionicons name="sparkles" size={15} color="#FFFFFF" />
                </View>
                <View className="bg-gray-100 dark:bg-neutral-800 px-4 py-3 rounded-2xl rounded-tl-none border border-gray-200 dark:border-neutral-700 flex-row items-center gap-2">
                  <ActivityIndicator size="small" color={COLORS.primary} />
                  <Text
                    className="text-xs text-gray-500 dark:text-gray-400 font-medium"
                    style={{ includeFontPadding: false }}
                  >
                    AI Assistant is thinking...
                  </Text>
                </View>
              </View>
            ) : null
          }
        />

        {/* Quick Search Shortcuts */}
        <View className="flex-row items-center justify-around py-1.5 px-3 border-t border-gray-100 dark:border-neutral-800">
          <TouchableOpacity
            onPress={() => handleApplyAIFilterToJobs('remote')}
            className="flex-row items-center gap-1 py-1 px-2 rounded-lg"
          >
            <Ionicons name="globe-outline" size={13} color={COLORS.primary} />
            <Text className="text-[11px] font-medium text-primary-700 dark:text-primary-300">
              Remote Jobs
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleApplyAIFilterToJobs('tech')}
            className="flex-row items-center gap-1 py-1 px-2 rounded-lg"
          >
            <Ionicons name="code-slash-outline" size={13} color={COLORS.primary} />
            <Text className="text-[11px] font-medium text-primary-700 dark:text-primary-300">
              Tech Vacancies
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleApplyAIFilterToJobs('urgent')}
            className="flex-row items-center gap-1 py-1 px-2 rounded-lg"
          >
            <Ionicons name="flame-outline" size={13} color="#EF4444" />
            <Text className="text-[11px] font-medium text-red-600 dark:text-red-400">
              Urgent Openings
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Chat Input Capsule Matching Reference Design ── */}
        <ChatInput
          value={inputText}
          onChangeText={setInputText}
          onSend={handleSendMessage}
          isLoading={isLoading}
          onPressPlus={() => setShowPlusModal(true)}
          onPressMic={() => {
            Alert.alert(
              '🎙️ Voice Assistant',
              'Listening to your voice query for career assistance...',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Simulate Prompt',
                  onPress: () =>
                    setInputText(
                      'Find me junior front-end developer jobs in Addis Ababa with competitive salary',
                    ),
                },
              ],
            );
          }}
          placeholder="Message EtVacancy AI..."
        />
      </KeyboardAvoidingView>

      {/* ── '+' Action Drawer / Modal ── */}
      <Modal
        visible={showPlusModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPlusModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPlusModal(false)}
        >
          <View
            style={[
              styles.plusMenuContainer,
              isDark ? styles.plusMenuDark : styles.plusMenuLight,
            ]}
          >
            <Text
              style={[
                styles.plusMenuTitle,
                isDark ? styles.textLight : styles.textDark,
              ]}
            >
              AI Assistant Actions
            </Text>

            <TouchableOpacity
              style={styles.plusMenuItem}
              onPress={() =>
                handlePlusActionSelect(
                  'Please review my profile and CV to suggest improvements for high-paying vacancies.',
                )
              }
            >
              <View style={[styles.menuIconBg, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="document-text" size={18} color="#2563EB" />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.menuItemTitle,
                    isDark ? styles.textLight : styles.textDark,
                  ]}
                >
                  CV / Resume Review
                </Text>
                <Text style={styles.menuItemSubtitle}>
                  Get AI suggestions to improve interview conversion
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.plusMenuItem}
              onPress={() =>
                handlePlusActionSelect(
                  'Conduct a mock behavioral & technical interview with me for my desired position.',
                )
              }
            >
              <View style={[styles.menuIconBg, { backgroundColor: '#F0FDF4' }]}>
                <Ionicons name="help-buoy" size={18} color="#16A34A" />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.menuItemTitle,
                    isDark ? styles.textLight : styles.textDark,
                  ]}
                >
                  Mock Interview Coach
                </Text>
                <Text style={styles.menuItemSubtitle}>
                  Practice situational & STAR interview questions
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.plusMenuItem}
              onPress={() =>
                handlePlusActionSelect(
                  'What are the legal regulations in Ethiopia for probation period, severance pay, and paid leave?',
                )
              }
            >
              <View style={[styles.menuIconBg, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="shield-checkmark" size={18} color="#D97706" />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.menuItemTitle,
                    isDark ? styles.textLight : styles.textDark,
                  ]}
                >
                  Ethiopian Labor Law Guide
                </Text>
                <Text style={styles.menuItemSubtitle}>
                  Verified knowledge on severance, probation & contracts
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.plusMenuItem}
              onPress={() =>
                handlePlusActionSelect(
                  'Show me the highest paying tech and remote job vacancies available today.',
                )
              }
            >
              <View style={[styles.menuIconBg, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="flame" size={18} color="#DC2626" />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.menuItemTitle,
                    isDark ? styles.textLight : styles.textDark,
                  ]}
                >
                  Urgent & Top Paying Jobs
                </Text>
                <Text style={styles.menuItemSubtitle}>
                  Instant recommendations with salary estimates
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── '+ Get Plus' Modal ── */}
      <Modal
        visible={showGetPlusModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGetPlusModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.getPlusModalContainer,
              isDark ? styles.plusMenuDark : styles.plusMenuLight,
            ]}
          >
            <View style={styles.getPlusBadge}>
              <Ionicons name="sparkles" size={24} color="#2563EB" />
            </View>
            <Text
              style={[
                styles.getPlusModalTitle,
                isDark ? styles.textLight : styles.textDark,
              ]}
            >
              EtVacancy AI Plus
            </Text>
            <Text style={styles.getPlusModalDesc}>
              Supercharge your career growth with full access to advanced AI intelligence and personalized career tools.
            </Text>

            <View style={styles.perksList}>
              <View style={styles.perkItem}>
                <Ionicons name="checkmark-circle" size={18} color="#16A34A" />
                <Text
                  style={[
                    styles.perkText,
                    isDark ? styles.textLight : styles.textDark,
                  ]}
                >
                  Unlimited AI Career Consultations & Cover Letters
                </Text>
              </View>
              <View style={styles.perkItem}>
                <Ionicons name="checkmark-circle" size={18} color="#16A34A" />
                <Text
                  style={[
                    styles.perkText,
                    isDark ? styles.textLight : styles.textDark,
                  ]}
                >
                  Real-time Addis Ababa Salary Benchmark Insights
                </Text>
              </View>
              <View style={styles.perkItem}>
                <Ionicons name="checkmark-circle" size={18} color="#16A34A" />
                <Text
                  style={[
                    styles.perkText,
                    isDark ? styles.textLight : styles.textDark,
                  ]}
                >
                  Priority Application Highlighting for Employers
                </Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                setShowGetPlusModal(false);
                Alert.alert(
                  '🎉 EtVacancy Plus Activated',
                  'You now have full access to all AI Career Assistant features!',
                );
              }}
              style={styles.upgradeBtn}
            >
              <Text style={styles.upgradeBtnText}>Upgrade to Plus — Free Beta</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowGetPlusModal(false)}
              style={styles.closeBtn}
            >
              <Text style={styles.closeBtnText}>Maybe Later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  headerLight: {
    backgroundColor: '#FFFFFF',
    borderBottomColor: '#F3F4F6',
  },
  headerDark: {
    backgroundColor: '#0F172A',
    borderBottomColor: '#1E293B',
  },
  headerCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCircleBtnLight: {
    backgroundColor: '#F3F4F6',
  },
  headerCircleBtnDark: {
    backgroundColor: '#1E293B',
  },
  getPlusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  getPlusText: {
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '700',
    includeFontPadding: false,
  },
  jobCard: {
    marginTop: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  jobCardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E0E7FF',
  },
  jobCardDark: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  plusMenuContainer: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 60,
    borderWidth: 1,
  },
  plusMenuLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  plusMenuDark: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
  },
  plusMenuTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 14,
  },
  plusMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  menuIconBg: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  menuItemSubtitle: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  textLight: {
    color: '#F9FAFB',
  },
  textDark: {
    color: '#111827',
  },
  getPlusModalContainer: {
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginHorizontal: 8,
    marginBottom: 30,
    borderWidth: 1,
  },
  getPlusBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  getPlusModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  getPlusModalDesc: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 18,
  },
  perksList: {
    width: '100%',
    gap: 12,
    marginBottom: 22,
  },
  perkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  perkText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  upgradeBtn: {
    backgroundColor: '#2563EB',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upgradeBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  closeBtn: {
    marginTop: 12,
    paddingVertical: 8,
  },
  closeBtnText: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '600',
  },
});
