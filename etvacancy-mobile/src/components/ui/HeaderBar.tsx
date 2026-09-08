import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@store/index';
import { COLORS } from '@constants/index';

interface HeaderBarProps {
  title?: string;
  subtitle?: string;
  showHomeButton?: boolean;
  showRoleBadge?: boolean;
}

export default function HeaderBar({
  title = 'EtVacancy',
  subtitle,
  showHomeButton = true,
  showRoleBadge = true,
}: HeaderBarProps) {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const userRole = user?.role ?? 'PUBLIC';

  const roleLabel =
    userRole === 'ADMIN'
      ? 'Admin'
      : userRole === 'EMPLOYER'
      ? 'Employer'
      : userRole === 'JOB_SEEKER'
      ? 'Job Seeker'
      : 'Guest';

  const roleBgColor =
    userRole === 'ADMIN'
      ? '#EDE9FE'
      : userRole === 'EMPLOYER'
      ? '#DBEAFE'
      : '#D1FAE5';

  const roleTextColorVal =
    userRole === 'ADMIN'
      ? '#6D28D9'
      : userRole === 'EMPLOYER'
      ? '#1D4ED8'
      : '#065F46';

  const handleHomePress = () => {
    if (role === 'ADMIN') {
      router.replace('/admin');
    } else if (role === 'EMPLOYER') {
      router.replace('/employer/vacancies');
    } else {
      router.replace('/');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.innerWrapper}>
        {/* Left: Home button + Title */}
        <View style={styles.left}>
          {showHomeButton && (
            <TouchableOpacity
              onPress={handleHomePress}
              activeOpacity={0.7}
              style={styles.homeBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="home" size={16} color={COLORS.primary} />
              <Text style={[styles.homeBtnText, { color: COLORS.primary }]}>Home</Text>
            </TouchableOpacity>
          )}
          <View style={showHomeButton ? { marginLeft: 10 } : undefined}>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
        </View>

        {/* Right: Role badge + Logout/Sign In */}
        <View style={styles.right}>
          {showRoleBadge && isAuthenticated && (
            <View style={[styles.roleBadge, { backgroundColor: roleBgColor }]}>
              <Text style={[styles.roleText, { color: roleTextColorVal }]}>{roleLabel}</Text>
            </View>
          )}

          {isAuthenticated ? (
            <TouchableOpacity
              onPress={async () => {
                await logout();
                router.replace('/(auth)/login');
              }}
              activeOpacity={0.7}
              style={styles.iconBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="log-out-outline" size={18} color="#64748B" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => router.push('/(auth)/login')}
              activeOpacity={0.7}
              style={styles.iconBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="person-outline" size={18} color={COLORS.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  innerWrapper: {
    width: '100%',
    maxWidth: 1280,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  homeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
    backgroundColor: COLORS.primary + '12',
  },
  homeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginRight: 8,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700',
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signInBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signInText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
