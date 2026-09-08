import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
  Modal,
  Alert,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { useAuthStore } from '@store/index';
import GoogleAccountChooserModal from './GoogleAccountChooserModal';
import { Ionicons } from '@expo/vector-icons';
import type { User, UserRole } from '@/types/index';

interface GoogleAuthButtonProps {
  mode?: 'login' | 'signup';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  role?: Exclude<UserRole, 'PUBLIC' | 'ADMIN'> | null;
}

/** Authentic 4-color Google "G" logo */
function GoogleGIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <Path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <Path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <Path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </Svg>
  );
}

export default function GoogleAuthButton({
  mode = 'login',
  role = null,
}: GoogleAuthButtonProps) {
  const router = useRouter();

  const {
    loginWithGoogle,
    registerWithGoogle,
    oauthError,
    clearOAuthError,
    setPreselectedOAuthRole,
  } = useAuthStore();

  const [buttonLoading, setButtonLoading] = useState(false);
  const [accountChooserVisible, setAccountChooserVisible] = useState(false);
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [pendingGoogleUser, setPendingGoogleUser] = useState<{ user: User; token: string; refreshToken?: string } | null>(null);

  const navigateAfterAuth = (finalRole: UserRole, pendingJobId: string | null, state: any) => {
    if (pendingJobId) {
      state.setPendingJobId(null);
      router.replace(`/jobs/${pendingJobId}?apply=true`);
    } else if (finalRole === 'EMPLOYER') {
      router.replace('/(tabs)/employer');
    } else if (finalRole === 'ADMIN') {
      router.replace('/(tabs)/admin');
    } else {
      router.replace('/(tabs)/(seeker)');
    }
  };

  const completeAuthWithRole = (chosenRole: Exclude<UserRole, 'PUBLIC' | 'ADMIN'>) => {
    if (!pendingGoogleUser) return;

    const authData = {
      ...pendingGoogleUser,
      role: chosenRole,
    };

    let ok = false;
    if (mode === 'signup') {
      ok = registerWithGoogle(authData);
      if (!ok) ok = loginWithGoogle(authData);
    } else {
      ok = loginWithGoogle(authData);
      if (!ok) ok = registerWithGoogle(authData);
    }

    setButtonLoading(false);
    setRoleModalVisible(false);
    setPendingGoogleUser(null);

    if (ok) {
      const state = useAuthStore.getState();
      navigateAfterAuth(chosenRole, state.pendingJobId, state);
    } else {
      Alert.alert('Authentication Failed', 'Unable to complete sign-in. Please try again.');
    }
  };

  const handlePress = () => {
    clearOAuthError();
    setPreselectedOAuthRole(role);
    // Open the Google Account Chooser screen
    setAccountChooserVisible(true);
  };

  const handleAccountSelected = (selectedAcc: Partial<User> & { email: string; fullName: string }) => {
    setAccountChooserVisible(false);
    setButtonLoading(true);

    const now = new Date().toISOString();
    const existingUser = useAuthStore
      .getState()
      .registeredUsers?.find(
        (u) => u.email.toLowerCase() === selectedAcc.email.toLowerCase(),
      );

    const determinedRole: UserRole =
      role ?? (existingUser?.role && existingUser.role !== 'PUBLIC' ? existingUser.role : null) ?? 'JOB_SEEKER';

    const fullUser: User = {
      id: selectedAcc.id || `google_${Date.now()}`,
      email: selectedAcc.email,
      firstName: selectedAcc.firstName || selectedAcc.fullName.split(' ')[0] || 'User',
      lastName: selectedAcc.lastName || selectedAcc.fullName.split(' ').slice(1).join(' ') || '',
      fullName: selectedAcc.fullName,
      avatar: selectedAcc.avatar ?? null,
      role: determinedRole,
      isActive: true,
      emailVerified: true,
      verificationStatus: 'VERIFIED',
      createdAt: existingUser?.createdAt || now,
      updatedAt: now,
      lastLoginAt: now,
    };

    const token = `google_oauth_token_${Date.now()}`;
    const authData = {
      user: fullUser,
      token,
    };

    // If role was explicitly specified (e.g. from signup page with role tabs) or existing user
    if (role || existingUser) {
      let ok = false;
      if (mode === 'signup') {
        ok = registerWithGoogle(authData);
        if (!ok) ok = loginWithGoogle(authData);
      } else {
        ok = loginWithGoogle(authData);
        if (!ok) ok = registerWithGoogle(authData);
      }

      setButtonLoading(false);
      if (ok) {
        const state = useAuthStore.getState();
        navigateAfterAuth(determinedRole, state.pendingJobId, state);
      } else {
        Alert.alert('Authentication Failed', 'Unable to complete Google sign-in.');
      }
    } else {
      // If logging in without preselected role, offer the friendly role confirmation
      setPendingGoogleUser({
        user: fullUser,
        token,
      });
      setButtonLoading(false);
      setRoleModalVisible(true);
    }
  };

  const isLoading = buttonLoading;

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        style={[
          styles.btn,
          isLoading && styles.btnDisabled,
          Platform.OS === 'web' ? ({ cursor: isLoading ? 'not-allowed' : 'pointer', userSelect: 'none' } as any) : {},
          { minHeight: 52, zIndex: 10 },
        ]}
        onPress={handlePress}
        disabled={isLoading}
        activeOpacity={0.85}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#4285F4" />
        ) : (
          <View style={styles.btnInner}>
            <GoogleGIcon size={20} />
            <Text style={styles.btnText}>Continue with Google</Text>
          </View>
        )}
      </TouchableOpacity>

      {oauthError && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{oauthError}</Text>
        </View>
      )}

      {/* ─── Google Account Chooser Modal (Image 1) ─── */}
      <GoogleAccountChooserModal
        visible={accountChooserVisible}
        onClose={() => setAccountChooserVisible(false)}
        onSelectAccount={handleAccountSelected}
      />

      {/* ─── Role Selection Modal after Google Auth ─── */}
      <Modal
        visible={roleModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setRoleModalVisible(false);
          setPendingGoogleUser(null);
        }}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          activeOpacity={1}
          onPress={() => {
            setRoleModalVisible(false);
            setPendingGoogleUser(null);
          }}
        >
          <View
            style={{
              width: '100%',
              maxWidth: 420,
              backgroundColor: '#FFFFFF',
              borderRadius: 20,
              padding: 28,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.2,
              shadowRadius: 30,
              elevation: 10,
            }}
            onStartShouldSetResponder={() => true}
          >
            <View style={{ alignItems: 'center', marginBottom: 24 }}>
              <View style={styles.logoCircle}>
                <Ionicons name="sparkles" size={28} color="#FFFFFF" />
              </View>
              <Text style={styles.modalTitle}>Welcome to EtVacancy!</Text>
              <Text style={styles.modalSubtitle}>
                Signed in as {pendingGoogleUser?.user.email || 'your Google account'}
              </Text>
              <Text style={styles.modalQuestion}>
                What would you like to do today?
              </Text>
            </View>

            <View style={{ gap: 14 }}>
              <TouchableOpacity
                style={[
                  styles.roleCardBig,
                  { borderColor: '#1D4ED8', backgroundColor: '#EFF6FF' },
                ]}
                onPress={() => completeAuthWithRole('JOB_SEEKER')}
                activeOpacity={0.8}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <View style={[styles.roleIconWrap, { backgroundColor: '#1D4ED8' }]}>
                  <Ionicons name="search-outline" size={26} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.roleTitleBig}>Find Jobs</Text>
                  <Text style={styles.roleSubBig}>
                    Search, apply for positions, and track your career journey
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={22} color="#1D4ED8" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.roleCardBig,
                  { borderColor: '#0F172A', backgroundColor: '#F8FAFC' },
                ]}
                onPress={() => completeAuthWithRole('EMPLOYER')}
                activeOpacity={0.8}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <View style={[styles.roleIconWrap, { backgroundColor: '#0F172A' }]}>
                  <Ionicons name="business-outline" size={26} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.roleTitleBig, { color: '#0F172A' }]}>Hire Talent</Text>
                  <Text style={styles.roleSubBig}>
                    Post vacancies, review applicants, and build your team
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={22} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={{
                marginTop: 20,
                alignItems: 'center',
                paddingVertical: 10,
              }}
              onPress={() => {
                setRoleModalVisible(false);
                setPendingGoogleUser(null);
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={{ color: '#64748B', fontSize: 13, fontWeight: '500' }}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  btn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingVertical: 13,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  btnDisabled: {
    opacity: 0.65,
  },
  btnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  btnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    letterSpacing: 0.1,
  },
  errorBanner: {
    marginTop: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    lineHeight: 16,
  },
  logoCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 10,
  },
  modalQuestion: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
  },
  roleCardBig: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 14,
    borderWidth: 2,
    minHeight: 92,
  },
  roleIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleTitleBig: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1D4ED8',
    marginBottom: 4,
  },
  roleSubBig: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
  },
});
