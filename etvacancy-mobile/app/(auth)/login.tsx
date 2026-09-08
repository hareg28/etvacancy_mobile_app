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
import { useForm } from 'react-hook-form';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FormInput } from '@components/ui/Input';
import GoogleAuthButton from '@components/auth/GoogleAuthButton';
import { type LoginFormValues } from '@lib/validations';
import { useAuthStore } from '@store/index';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading, error, clearError, pendingJobId, setPendingJobId } = useAuthStore();

  const {
    control,
    getValues,
    formState: { errors },
  } = useForm<LoginFormValues>({
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const handleSignIn = async () => {
    clearError();
    const data = getValues();
    const email = (data.email || '').trim();
    const password = (data.password || '').trim();

    if (!email) {
      Alert.alert('Email Required', 'Please enter your email address.');
      return;
    }
    if (!password) {
      Alert.alert('Password Required', 'Please enter your password.');
      return;
    }

    const success = await login({ email, password });
    if (success) {
      const state = useAuthStore.getState();
      const userRole = state.user?.role || 'JOB_SEEKER';
      const targetJobId = state.pendingJobId;
      if (targetJobId) {
        setPendingJobId(null);
        router.replace(`/jobs/${targetJobId}?apply=true`);
      } else if (userRole === 'ADMIN') {
        router.replace('/(tabs)/admin');
      } else if (userRole === 'EMPLOYER') {
        router.replace('/(tabs)/employer');
      } else {
        router.replace('/(tabs)/(seeker)');
      }
    } else {
      const currentError = useAuthStore.getState().error;
      Alert.alert('Login Failed', currentError || 'Unable to sign in. Please verify your credentials.');
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
            {/* Logo mark */}
            <View style={styles.logoWrap}>
              <View style={styles.logo}>
                <Text style={styles.logoText}>Et</Text>
              </View>
            </View>

            {/* Heading */}
            <Text style={styles.heading}>Welcome back</Text>
            <Text style={styles.subheading}>
              Enter your credentials to access your account.
            </Text>

            {/* Pending job banner */}
            {pendingJobId && (
              <View style={styles.infoBanner}>
                <Ionicons name="briefcase-outline" size={16} color="#1D4ED8" />
                <Text style={styles.infoBannerText}>
                  Sign in to complete your job application.
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

            {/* Email */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email address</Text>
              <FormInput
                control={control}
                name="email"
                placeholder="name@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                variant="outlined"
                error={errors.email?.message}
              />
            </View>

            {/* Password */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Password</Text>
                <TouchableOpacity
                  onPress={() => router.push('/(auth)/forgot-password')}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  activeOpacity={0.7}
                  zIndex={10}
                  style={[
                    Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {},
                    { paddingVertical: 4, paddingHorizontal: 4, minHeight: 32 },
                  ]}
                >
                  <Text style={styles.forgotLink}>Forgot password?</Text>
                </TouchableOpacity>
              </View>
              <FormInput
                control={control}
                name="password"
                placeholder="••••••••"
                secureTextEntry
                autoComplete="password"
                variant="outlined"
                error={errors.password?.message}
              />
            </View>

            {/* Submit */}
            <TouchableOpacity
              style={[
                styles.submitBtn,
                isLoading && styles.submitBtnDisabled,
                Platform.OS === 'web' ? ({ cursor: 'pointer', userSelect: 'none' } as any) : {},
                { minHeight: 52, zIndex: 10 },
              ]}
              onPress={handleSignIn}
              disabled={isLoading}
              activeOpacity={0.85}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.submitBtnText}>
                {isLoading ? 'Signing in…' : 'Sign in'}
              </Text>
            </TouchableOpacity>

            {/* ─── Google OAuth (below form) ──────────── */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>
            <GoogleAuthButton mode="login" size="md" fullWidth />

            {/* Sign up link */}
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Don&apos;t have an account?</Text>
              <TouchableOpacity
                onPress={() => router.push('/(auth)/signup')}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                activeOpacity={0.7}
                zIndex={10}
                style={[
                  Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {},
                  { paddingVertical: 4, paddingHorizontal: 4, minHeight: 32 },
                ]}
              >
                <Text style={styles.footerLink}>Sign up</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Terms notice */}
          <View style={styles.termsNotice}>
            <Text style={{ color: '#94A3B8', fontSize: 12, textAlign: 'center', lineHeight: 18 }}>
              By continuing you agree to our{' '}
            </Text>
            <TouchableOpacity
              onPress={() => Alert.alert('Terms of Service', 'By accessing EtVacancy, you agree to adhere to standard community rules, privacy terms, and vacancy guidelines.')}
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              activeOpacity={0.7}
              zIndex={10}
              style={Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}}
            >
              <Text style={[styles.termsLink, { textDecorationLine: 'underline' }]}>
                Terms of Service
              </Text>
            </TouchableOpacity>
            <Text style={{ color: '#94A3B8', fontSize: 12, textAlign: 'center', lineHeight: 18 }}> and </Text>
            <TouchableOpacity
              onPress={() => Alert.alert('Privacy Policy', 'EtVacancy respects your personal privacy. Your data is never sold to third parties.')}
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              activeOpacity={0.7}
              zIndex={10}
              style={Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}}
            >
              <Text style={[styles.termsLink, { textDecorationLine: 'underline' }]}>
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
    maxWidth: 400,
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
  logoWrap: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 44,
    height: 44,
    backgroundColor: '#0F172A',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
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
    marginBottom: 16,
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
    marginBottom: 16,
  },
  errorBannerText: {
    fontSize: 13,
    color: '#DC2626',
    flex: 1,
    lineHeight: 18,
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
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  forgotLink: {
    fontSize: 13,
    color: '#1D4ED8',
    fontWeight: '600',
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
  termsLink: {
    textDecorationLine: 'underline',
    color: '#64748B',
  },
});
