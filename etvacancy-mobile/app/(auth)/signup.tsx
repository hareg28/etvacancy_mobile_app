import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Input } from '@components/ui/Input';
import GoogleAuthButton from '@components/auth/GoogleAuthButton';
import { type RegisterFormValues } from '@lib/validations';
import { useAuthStore } from '@store/index';
import { Ionicons } from '@expo/vector-icons';

export default function SignupScreen() {
  const router = useRouter();
  const { register, isLoading, error, clearError, pendingJobId, setPendingJobId } = useAuthStore();
  const [selectedRole, setSelectedRole] = useState<'JOB_SEEKER' | 'EMPLOYER'>('JOB_SEEKER');
  const [agreeTerms, setAgreeTerms] = useState(false);

  const {
    control,
    getValues,
    setValue,
  } = useForm<RegisterFormValues>({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'JOB_SEEKER',
      phone: '',
      agreeToTerms: false,
    },
  });

  const handleSignUp = async () => {
    clearError();
    const data = getValues();
    const firstName = (data.firstName || '').trim();
    const lastName = (data.lastName || '').trim();
    const email = (data.email || '').trim();
    const password = (data.password || '').trim();
    const confirmPassword = (data.confirmPassword || '').trim();

    if (!firstName) {
      Alert.alert('First Name Required', 'Please enter your first name.');
      return;
    }
    if (!lastName) {
      Alert.alert('Last Name Required', 'Please enter your last name.');
      return;
    }
    if (!email || !email.includes('@')) {
      Alert.alert('Email Required', 'Please enter a valid email address.');
      return;
    }
    if (!password) {
      Alert.alert('Password Required', 'Please enter a password.');
      return;
    }
    if (confirmPassword && password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match.');
      return;
    }
    if (!agreeTerms) {
      Alert.alert('Terms Required', 'Please agree to the Terms of Service and Privacy Policy.');
      return;
    }

    const finalData: RegisterFormValues = {
      ...data,
      firstName,
      lastName,
      email,
      password,
      confirmPassword: password,
      role: selectedRole,
      agreeToTerms: true,
    };

    const success = await register(finalData);
    if (success) {
      const state = useAuthStore.getState();
      const userRole = state.user?.role || selectedRole;
      const targetJobId = state.pendingJobId;
      if (targetJobId) {
        setPendingJobId(null);
        router.replace(`/jobs/${targetJobId}?apply=true`);
      } else if (userRole === 'EMPLOYER') {
        router.replace('/(tabs)/employer');
      } else {
        router.replace('/(tabs)/(seeker)');
      }
    } else {
      const currentError = useAuthStore.getState().error;
      Alert.alert('Registration Failed', currentError || 'Unable to create account. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
        >
          {/* ─── Card ─────────────────────────────────────── */}
          <View style={styles.card}>
            <Text style={styles.heading}>Create an account</Text>
            <Text style={styles.subheading}>
              Enter your information below to get started with EtVacancy.
            </Text>

            {/* Pending job banner */}
            {pendingJobId && (
              <View style={styles.infoBanner}>
                <Ionicons name="briefcase-outline" size={16} color="#1D4ED8" />
                <Text style={styles.infoBannerText}>
                  Create your account to complete your job application.
                </Text>
              </View>
            )}

            {/* Error */}
            {error && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle-outline" size={16} color="#DC2626" />
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            )}

            {/* ─── Role Selector ────────────────────────────── */}
            <Text style={styles.label}>I want to…</Text>
            <View style={styles.roleRow}>
              {/* Find Jobs (Job Seeker) */}
              <TouchableOpacity
                style={[
                  styles.roleCard,
                  selectedRole === 'JOB_SEEKER' && styles.roleCardActive,
                  Platform.OS === 'web' ? ({ cursor: 'pointer', userSelect: 'none' } as any) : {},
                  { minHeight: 110, zIndex: 10 },
                ]}
                onPress={() => {
                  setSelectedRole('JOB_SEEKER');
                  setValue('role', 'JOB_SEEKER');
                }}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name="search-outline"
                  size={22}
                  color={selectedRole === 'JOB_SEEKER' ? '#1D4ED8' : '#64748B'}
                />
                <Text
                  style={[
                    styles.roleCardTitle,
                    selectedRole === 'JOB_SEEKER' && styles.roleCardTitleActive,
                  ]}
                >
                  Find Jobs
                </Text>
                <Text style={styles.roleCardSub}>Job Seeker</Text>
              </TouchableOpacity>

              {/* Hire Talent (Employer) */}
              <TouchableOpacity
                style={[
                  styles.roleCard,
                  selectedRole === 'EMPLOYER' && styles.roleCardActive,
                  Platform.OS === 'web' ? ({ cursor: 'pointer', userSelect: 'none' } as any) : {},
                  { minHeight: 110, zIndex: 10 },
                ]}
                onPress={() => {
                  setSelectedRole('EMPLOYER');
                  setValue('role', 'EMPLOYER');
                }}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name="business-outline"
                  size={22}
                  color={selectedRole === 'EMPLOYER' ? '#1D4ED8' : '#64748B'}
                />
                <Text
                  style={[
                    styles.roleCardTitle,
                    selectedRole === 'EMPLOYER' && styles.roleCardTitleActive,
                  ]}
                >
                  Hire Talent
                </Text>
                <Text style={styles.roleCardSub}>Employer</Text>
              </TouchableOpacity>
            </View>

            {/* ─── Name Row ─────────────────────────────────── */}
            <View style={styles.nameRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>First name</Text>
                <Controller
                  control={control}
                  name="firstName"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      placeholder="John"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      variant="outlined"
                    />
                  )}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Last name</Text>
                <Controller
                  control={control}
                  name="lastName"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      placeholder="Doe"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      variant="outlined"
                    />
                  )}
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email address</Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    placeholder="name@example.com"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    variant="outlined"
                  />
                )}
              />
            </View>

            {/* Phone */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                Phone <Text style={styles.optionalTag}>(optional)</Text>
              </Text>
              <Controller
                control={control}
                name="phone"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    placeholder="+251 91 123 4567"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    keyboardType="phone-pad"
                    variant="outlined"
                  />
                )}
              />
            </View>

            {/* Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Password</Text>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    placeholder="••••••••"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    secureTextEntry
                    variant="outlined"
                    helper="Min 8 chars, 1 uppercase, 1 lowercase, 1 number"
                  />
                )}
              />
            </View>

            {/* Confirm Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Confirm password</Text>
              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    placeholder="••••••••"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    secureTextEntry
                    variant="outlined"
                  />
                )}
              />
            </View>

            {/* Terms checkbox */}
            <TouchableOpacity
              style={[
                styles.termsRow,
                Platform.OS === 'web' ? ({ cursor: 'pointer', userSelect: 'none' } as any) : {},
                { minHeight: 44, zIndex: 10 },
              ]}
              onPress={() => setAgreeTerms((v) => !v)}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <View style={[styles.checkbox, agreeTerms && styles.checkboxActive]}>
                {agreeTerms && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
              </View>
              <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap' }}>
                <Text style={styles.termsLabel}>
                  I agree to the{' '}
                </Text>
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    Alert.alert('Terms of Service', 'By accessing EtVacancy, you agree to adhere to standard community rules, privacy terms, and vacancy guidelines.');
                  }}
                  hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                  activeOpacity={0.7}
                  zIndex={15}
                >
                  <Text style={styles.termsLinkInline}>
                    Terms of Service
                  </Text>
                </TouchableOpacity>
                <Text style={styles.termsLabel}> and </Text>
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    Alert.alert('Privacy Policy', 'EtVacancy respects your personal privacy. Your data is never sold to third parties.');
                  }}
                  hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                  activeOpacity={0.7}
                  zIndex={15}
                >
                  <Text style={styles.termsLinkInline}>
                    Privacy Policy
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>

            {/* Submit */}
            <TouchableOpacity
              style={[
                styles.submitBtn,
                isLoading && styles.submitBtnDisabled,
                Platform.OS === 'web' ? ({ cursor: 'pointer', userSelect: 'none' } as any) : {},
                { minHeight: 52, zIndex: 10 },
              ]}
              onPress={handleSignUp}
              disabled={isLoading}
              activeOpacity={0.85}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.submitBtnText}>
                {isLoading ? 'Creating account…' : 'Create account'}
              </Text>
            </TouchableOpacity>

            {/* ─── Google OAuth (below form) ──────────── */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>
            <GoogleAuthButton mode="signup" role={selectedRole} size="md" fullWidth />

            {/* Sign in link */}
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Already have an account?</Text>
              <TouchableOpacity
                onPress={() => router.push('/(auth)/login')}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                activeOpacity={0.7}
                zIndex={10}
                style={[
                  Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {},
                  { paddingVertical: 4, paddingHorizontal: 4, minHeight: 32 },
                ]}
              >
                <Text style={styles.footerLink}>Sign in</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.termsNotice}>
            <Text style={{ color: '#94A3B8', fontSize: 12, textAlign: 'center', lineHeight: 18 }}>
              By creating an account you agree to our{' '}
            </Text>
            <TouchableOpacity
              onPress={() => Alert.alert('Terms of Service', 'By accessing EtVacancy, you agree to adhere to standard community rules, privacy terms, and vacancy guidelines.')}
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              activeOpacity={0.7}
              zIndex={10}
              style={Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}}
            >
              <Text style={[styles.termsNoticeLink, { textDecorationLine: 'underline' }]}>
                Terms of Service
              </Text>
            </TouchableOpacity>
            <Text style={{ color: '#94A3B8', fontSize: 12, textAlign: 'center', lineHeight: 18 }}>{' '}and{' '}</Text>
            <TouchableOpacity
              onPress={() => Alert.alert('Privacy Policy', 'EtVacancy respects your personal privacy. Your data is never sold to third parties.')}
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              activeOpacity={0.7}
              zIndex={10}
              style={Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}}
            >
              <Text style={[styles.termsNoticeLink, { textDecorationLine: 'underline' }]}>
                Privacy Policy
              </Text>
            </TouchableOpacity>
            <Text style={{ color: '#94A3B8', fontSize: 12, textAlign: 'center', lineHeight: 18 }}>.</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subheading: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  infoBannerText: {
    fontSize: 13,
    color: '#1D4ED8',
    flex: 1,
    lineHeight: 18,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  errorBannerText: {
    fontSize: 13,
    color: '#DC2626',
    flex: 1,
    lineHeight: 18,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  roleCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    gap: 4,
  },
  roleCardActive: {
    borderColor: '#1D4ED8',
    backgroundColor: '#EFF6FF',
  },
  roleCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    marginTop: 4,
  },
  roleCardTitleActive: {
    color: '#1D4ED8',
  },
  roleCardSub: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  optionalTag: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '400',
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 4,
    marginBottom: 20,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  checkboxActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  termsLabel: {
    flex: 1,
    fontSize: 13,
    color: '#475569',
    lineHeight: 19,
  },
  termsLinkInline: {
    color: '#0F172A',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  submitBtn: {
    width: '100%',
    backgroundColor: '#0F172A',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#64748B',
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    textDecorationLine: 'underline',
  },
  termsNotice: {
    marginTop: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
  termsNoticeLink: {
    textDecorationLine: 'underline',
    color: '#64748B',
  },
});
