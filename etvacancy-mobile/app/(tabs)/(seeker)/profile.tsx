import { View, Text, ScrollView, TouchableOpacity, Alert, Platform, Modal, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Screen } from '@components/ui/Screen';
import { Card, CardSection } from '@components/ui/Card';
import { Avatar, AvatarWithBadge } from '@components/ui/Avatar';
import { Divider } from '@components/ui/Divider';
import Button from '@components/ui/Button';
import Input from '@components/ui/Input';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore, selectIsJobSeeker, selectIsEmployer } from '@store/index';
import { useUIStore } from '@store/index';
import { COLORS, ROLE_LABELS, LANGUAGES, THEME } from '@constants/index';
import { getFullName, formatDate } from '@utils/index';
import type { User, JobSeekerProfile, EmployerProfile, WorkExperience, Education } from '@/types/index';

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  danger?: boolean;
  tint?: string;
}

function MenuItem({
  icon,
  label,
  value,
  onPress,
  rightIcon = 'chevron-forward',
  danger,
  tint,
}: MenuItemProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      className={`flex-row items-center py-3.5 ${onPress ? 'opacity-100' : 'opacity-90'}`}
      activeOpacity={0.6}
      style={Platform.OS === 'web' && onPress ? ({ cursor: 'pointer' } as any) : undefined}
    >
      <View
        className={`w-10 h-10 rounded-xl items-center justify-center mr-4 ${
          danger ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-100 dark:bg-neutral-700'
        }`}
      >
        <Ionicons
          name={icon}
          size={20}
          color={danger ? COLORS.danger : tint ?? COLORS.primary}
        />
      </View>
      <View className="flex-1">
        <Text
          className={`text-sm font-semibold ${
            danger ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'
          }`}
          style={{ includeFontPadding: false }}
        >
          {label}
        </Text>
        {value && (
          <Text
            className="text-xs text-gray-500 dark:text-gray-400 mt-0.5"
            style={{ includeFontPadding: false }}
          >
            {value}
          </Text>
        )}
      </View>
      {onPress && rightIcon && (
        <Ionicons name={rightIcon} size={18} color="#9CA3AF" />
      )}
    </TouchableOpacity>
  );
}

interface SectionHeaderProps {
  title: string;
  action?: { label: string; onPress: () => void };
}

function SectionHeader({ title, action }: SectionHeaderProps) {
  return (
    <View className="flex-row items-center justify-between mb-1 mt-2">
      <Text
        className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wider"
        style={{ includeFontPadding: false }}
      >
        {title}
      </Text>
      {action && (
        <TouchableOpacity onPress={action.onPress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text
            className="text-xs font-bold text-primary-700 dark:text-primary-400"
            style={{ includeFontPadding: false }}
          >
            {action.label}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, isAuthenticated, clearError } = useAuthStore();
  const isJobSeeker = useAuthStore(selectIsJobSeeker);
  const isEmployer = useAuthStore(selectIsEmployer);
  const { theme, language, setTheme, setLanguage } = useUIStore();

  // Modal visibility states
  const [showThemeSheet, setShowThemeSheet] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [resumeModalVisible, setResumeModalVisible] = useState(false);
  const [experienceModalVisible, setExperienceModalVisible] = useState(false);
  const [educationModalVisible, setEducationModalVisible] = useState(false);
  const [skillsModalVisible, setSkillsModalVisible] = useState(false);
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [notificationsModalVisible, setNotificationsModalVisible] = useState(false);

  // Form states for Personal Edit
  const [editFirstName, setEditFirstName] = useState(user?.firstName ?? '');
  const [editLastName, setEditLastName] = useState(user?.lastName ?? '');
  const [editPhone, setEditPhone] = useState(user?.phone ?? '');
  const [editHeadline, setEditHeadline] = useState(user?.jobSeekerProfile?.headline ?? '');

  // Form states for Experience
  const [expTitle, setExpTitle] = useState('');
  const [expCompany, setExpCompany] = useState('');
  const [expLocation, setExpLocation] = useState('');
  const [expPeriod, setExpPeriod] = useState('');

  // Form states for Education
  const [eduDegree, setEduDegree] = useState('');
  const [eduInstitution, setEduInstitution] = useState('');
  const [eduYear, setEduYear] = useState('');

  // Form states for Skills
  const [newSkillText, setNewSkillText] = useState('');

  // Form state for Resume
  const [customResumeName, setCustomResumeName] = useState(user?.jobSeekerProfile?.resumeFileName ?? 'Resume_CV_2026.pdf');

  // Notification toggles
  const [notifJobs, setNotifJobs] = useState(true);
  const [notifApplications, setNotifApplications] = useState(true);
  const [notifMarketing, setNotifMarketing] = useState(false);

  const handleLogout = () => {
    const doLogout = async () => {
      clearError();
      await logout();
      router.replace('/(auth)/login');
    };

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm('Are you sure you want to sign out?')) {
        doLogout();
      }
    } else {
      Alert.alert(
        'Sign Out',
        'Are you sure you want to sign out of your account?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Sign Out',
            style: 'destructive',
            onPress: doLogout,
          },
        ],
      );
    }
  };

  const handleOpenEdit = () => {
    if (!user) return;
    setEditFirstName(user.firstName ?? '');
    setEditLastName(user.lastName ?? '');
    setEditPhone(user.phone ?? '');
    setEditHeadline(user.jobSeekerProfile?.headline ?? '');
    setEditModalVisible(true);
  };

  const handleSaveProfile = () => {
    if (!user) return;
    const updatedProfile = user.jobSeekerProfile ? {
      ...user.jobSeekerProfile,
      headline: editHeadline.trim() || user.jobSeekerProfile.headline,
    } : user.jobSeekerProfile;

    const updatedUser: User = {
      ...user,
      firstName: editFirstName.trim() || user.firstName,
      lastName: editLastName.trim() || user.lastName,
      fullName: `${editFirstName.trim() || user.firstName} ${editLastName.trim() || user.lastName}`.trim(),
      phone: editPhone.trim() || user.phone,
      jobSeekerProfile: updatedProfile,
    };

    useAuthStore.setState((s) => ({
      user: updatedUser,
      registeredUsers: s.registeredUsers.map((u) => (u.id === user.id ? updatedUser : u)),
    }));
    setEditModalVisible(false);
    Alert.alert('Profile Updated', 'Your profile details have been saved successfully.');
  };

  const handleSaveResume = () => {
    if (!user || !user.jobSeekerProfile) return;
    const updatedUser: User = {
      ...user,
      jobSeekerProfile: {
        ...user.jobSeekerProfile,
        resumeFileName: customResumeName.trim() || 'Resume_CV.pdf',
        resumeUrl: 'https://etvacancy.com/uploads/resumes/my_resume.pdf',
      },
    };
    useAuthStore.setState((s) => ({
      user: updatedUser,
      registeredUsers: s.registeredUsers.map((u) => (u.id === user.id ? updatedUser : u)),
    }));
    setResumeModalVisible(false);
    Alert.alert('Resume Saved', 'Your resume file details have been updated.');
  };

  const handleAddExperience = () => {
    if (!user || !user.jobSeekerProfile || !expTitle.trim() || !expCompany.trim()) {
      Alert.alert('Incomplete Form', 'Please enter at least job title and company.');
      return;
    }
    const currentList = user.jobSeekerProfile.experiences ?? [];
    const newEntry: WorkExperience = {
      id: `exp_${Date.now()}`,
      jobTitle: expTitle.trim(),
      companyName: expCompany.trim(),
      location: expLocation.trim() || 'Addis Ababa',
      startDate: expPeriod.trim() || '2023',
      endDate: 'Present',
      isCurrent: true,
      description: 'Handled key responsibilities and delivered projects.',
    };

    const updatedUser: User = {
      ...user,
      jobSeekerProfile: {
        ...user.jobSeekerProfile,
        experiences: [newEntry, ...currentList],
      },
    };

    useAuthStore.setState((s) => ({
      user: updatedUser,
      registeredUsers: s.registeredUsers.map((u) => (u.id === user.id ? updatedUser : u)),
    }));

    setExpTitle('');
    setExpCompany('');
    setExpLocation('');
    setExpPeriod('');
    Alert.alert('Experience Added', `Added ${newEntry.jobTitle} at ${newEntry.companyName}.`);
  };

  const handleDeleteExperience = (expId: string) => {
    if (!user || !user.jobSeekerProfile) return;
    const currentList = user.jobSeekerProfile.experiences ?? [];
    const updatedUser: User = {
      ...user,
      jobSeekerProfile: {
        ...user.jobSeekerProfile,
        experiences: currentList.filter((e) => e.id !== expId),
      },
    };
    useAuthStore.setState((s) => ({
      user: updatedUser,
      registeredUsers: s.registeredUsers.map((u) => (u.id === user.id ? updatedUser : u)),
    }));
  };

  const handleAddEducation = () => {
    if (!user || !user.jobSeekerProfile || !eduDegree.trim() || !eduInstitution.trim()) {
      Alert.alert('Incomplete Form', 'Please enter at least degree and institution.');
      return;
    }
    const currentList = user.jobSeekerProfile.education ?? [];
    const newEntry: Education = {
      id: `edu_${Date.now()}`,
      degree: eduDegree.trim(),
      institution: eduInstitution.trim(),
      fieldOfStudy: 'Information Technology',
      graduationYear: eduYear ? parseInt(eduYear, 10) : 2024,
      startDate: '2020',
      endDate: eduYear || '2024',
    };

    const updatedUser: User = {
      ...user,
      jobSeekerProfile: {
        ...user.jobSeekerProfile,
        education: [newEntry, ...currentList],
      },
    };

    useAuthStore.setState((s) => ({
      user: updatedUser,
      registeredUsers: s.registeredUsers.map((u) => (u.id === user.id ? updatedUser : u)),
    }));

    setEduDegree('');
    setEduInstitution('');
    setEduYear('');
    Alert.alert('Education Added', `Added ${newEntry.degree} from ${newEntry.institution}.`);
  };

  const handleDeleteEducation = (eduId: string) => {
    if (!user || !user.jobSeekerProfile) return;
    const currentList = user.jobSeekerProfile.education ?? [];
    const updatedUser: User = {
      ...user,
      jobSeekerProfile: {
        ...user.jobSeekerProfile,
        education: currentList.filter((e) => e.id !== eduId),
      },
    };
    useAuthStore.setState((s) => ({
      user: updatedUser,
      registeredUsers: s.registeredUsers.map((u) => (u.id === user.id ? updatedUser : u)),
    }));
  };

  const handleAddSkill = () => {
    if (!user || !user.jobSeekerProfile || !newSkillText.trim()) return;
    const currentSkills = user.jobSeekerProfile.skills ?? [];
    if (currentSkills.includes(newSkillText.trim())) {
      setNewSkillText('');
      return;
    }
    const updatedSkills = [...currentSkills, newSkillText.trim()];
    const updatedUser: User = {
      ...user,
      jobSeekerProfile: {
        ...user.jobSeekerProfile,
        skills: updatedSkills,
      },
    };
    useAuthStore.setState((s) => ({
      user: updatedUser,
      registeredUsers: s.registeredUsers.map((u) => (u.id === user.id ? updatedUser : u)),
    }));
    setNewSkillText('');
  };

  const handleRemoveSkill = (skill: string) => {
    if (!user || !user.jobSeekerProfile) return;
    const currentSkills = user.jobSeekerProfile.skills ?? [];
    const updatedUser: User = {
      ...user,
      jobSeekerProfile: {
        ...user.jobSeekerProfile,
        skills: currentSkills.filter((s) => s !== skill),
      },
    };
    useAuthStore.setState((s) => ({
      user: updatedUser,
      registeredUsers: s.registeredUsers.map((u) => (u.id === user.id ? updatedUser : u)),
    }));
  };

  const handleRoleSwitch = (newRole: 'JOB_SEEKER' | 'EMPLOYER' | 'ADMIN') => {
    if (!user) return;
    const updatedUser: User = {
      ...user,
      role: newRole,
    };
    useAuthStore.setState((s) => ({
      user: updatedUser,
      registeredUsers: s.registeredUsers.map((u) => (u.id === user.id ? updatedUser : u)),
    }));
    setRoleModalVisible(false);

    if (newRole === 'JOB_SEEKER') {
      router.replace('/(tabs)/(seeker)');
    } else if (newRole === 'EMPLOYER') {
      router.replace('/(tabs)/employer/vacancies');
    } else if (newRole === 'ADMIN') {
      router.replace('/(tabs)/admin');
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <Screen scrollable>
        <View className="py-8 px-4 items-center">
          <View className="w-24 h-24 rounded-full bg-primary-100 dark:bg-primary-900/30 border-4 border-primary-200 dark:border-primary-800 items-center justify-center mb-5">
            <Ionicons name="person-outline" size={48} color={COLORS.primary} />
          </View>

          <Text
            className="text-2xl font-bold text-gray-900 dark:text-gray-100 text-center mb-2"
            style={{ includeFontPadding: false }}
          >
            Welcome to EtVacancy
          </Text>
          <Text
            className="text-sm text-gray-500 dark:text-gray-400 text-center mb-8 px-6 leading-5"
            style={{ includeFontPadding: false }}
          >
            Sign in to apply for jobs, save listings, track applications, or post job vacancies for your company.
          </Text>

          <View className="w-full gap-3 mb-8">
            <Button
              title="Sign In to Your Account"
              variant="primary"
              size="lg"
              fullWidth
              leftIcon="log-in-outline"
              onPress={() => router.push('/(auth)/login')}
            />
            <Button
              title="Create New Account"
              variant="outline"
              size="lg"
              fullWidth
              leftIcon="person-add-outline"
              onPress={() => router.push('/(auth)/signup')}
            />
          </View>

          <Card padding="md" variant="elevated" className="w-full">
            <Text
              className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wider mb-3"
              style={{ includeFontPadding: false }}
            >
              Quick Portals & Role Access
            </Text>
            <TouchableOpacity
              className="flex-row items-center py-3 border-b border-gray-100 dark:border-neutral-700"
              onPress={() => router.push('/(auth)/login')}
              activeOpacity={0.7}
            >
              <View className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 items-center justify-center mr-3">
                <Ionicons name="briefcase-outline" size={20} color={COLORS.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-gray-900 dark:text-gray-100">Job Seeker Portal</Text>
                <Text className="text-xs text-gray-500 dark:text-gray-400">Search, save, & apply for jobs</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center py-3"
              onPress={() => router.push('/(auth)/login')}
              activeOpacity={0.7}
            >
              <View className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 items-center justify-center mr-3">
                <Ionicons name="business-outline" size={20} color={COLORS.secondary} />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-gray-900 dark:text-gray-100">Employer Portal</Text>
                <Text className="text-xs text-gray-500 dark:text-gray-400">Post jobs & hire talent</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          </Card>
        </View>
      </Screen>
    );
  }

  const profile = isJobSeeker ? user.jobSeekerProfile : user.employerProfile;
  const jsProfile = profile as JobSeekerProfile | undefined | null;
  const empProfile = profile as EmployerProfile | undefined | null;
  const company = isEmployer ? user.employerProfile?.company : undefined;

  return (
    <Screen scrollable>
      {/* Profile Header Card */}
      <Card padding="lg" variant="elevated" className="mb-6">
        <View className="flex-row items-center gap-4 mb-5">
          <AvatarWithBadge
            user={user}
            size="xl"
            ring
            onPress={handleOpenEdit}
            badge={
              <View className="w-full h-full bg-primary-700 rounded-full items-center justify-center">
                <Ionicons name="camera" size={10} color="#FFFFFF" />
              </View>
            }
          />
          <View className="flex-1">
            <Text
              className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-0.5"
              style={{ includeFontPadding: false }}
            >
              {getFullName(user.firstName, user.lastName, user.fullName)}
            </Text>
            <Text
              className="text-sm text-gray-500 dark:text-gray-400 mb-1.5"
              style={{ includeFontPadding: false }}
            >
              {user.email}
            </Text>
            <View className="flex-row items-center gap-2">
              <TouchableOpacity
                onPress={() => setRoleModalVisible(true)}
                className={`px-2.5 py-1 rounded-full flex-row items-center gap-1 ${
                  user.role === 'ADMIN'
                    ? 'bg-purple-100 dark:bg-purple-900/30'
                    : user.role === 'EMPLOYER'
                    ? 'bg-blue-100 dark:bg-blue-900/30'
                    : 'bg-primary-100 dark:bg-primary-900/30'
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    user.role === 'ADMIN'
                      ? 'text-purple-700 dark:text-purple-400'
                      : user.role === 'EMPLOYER'
                      ? 'text-blue-700 dark:text-blue-400'
                      : 'text-primary-700 dark:text-primary-400'
                  }`}
                  style={{ includeFontPadding: false }}
                >
                  {ROLE_LABELS[user.role]}
                </Text>
                <Ionicons name="swap-horizontal" size={12} color={COLORS.primary} />
              </TouchableOpacity>
              {user.emailVerified ? (
                <View className="bg-primary-100 dark:bg-primary-900/30 px-2.5 py-1 rounded-full flex-row items-center gap-1">
                  <Ionicons name="checkmark-circle" size={12} color="#1D4ED8" />
                  <Text
                    className="text-xs font-bold text-primary-700 dark:text-primary-400"
                    style={{ includeFontPadding: false }}
                  >
                    Verified
                  </Text>
                </View>
              ) : (
                <View className="bg-amber-100 dark:bg-amber-900/30 px-2.5 py-1 rounded-full flex-row items-center gap-1">
                  <Ionicons name="alert-circle-outline" size={12} color="#D97706" />
                  <Text
                    className="text-xs font-bold text-amber-700 dark:text-amber-400"
                    style={{ includeFontPadding: false }}
                  >
                    Unverified
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Profile headline */}
        {isJobSeeker && (
          <TouchableOpacity onPress={handleOpenEdit} className="mb-4">
            <Text
              className="text-base text-gray-700 dark:text-gray-300 italic leading-6"
              style={{ includeFontPadding: false }}
            >
              &ldquo;{jsProfile?.headline || 'Passionate professional looking for new career opportunities.'}&rdquo;
            </Text>
          </TouchableOpacity>
        )}
        {isEmployer && (
          <View className="mb-4 flex-row items-center gap-2">
            <Ionicons name="briefcase-outline" size={16} color={COLORS.primary} />
            <Text
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
              style={{ includeFontPadding: false }}
            >
              {empProfile?.position ?? 'Staff Member'}
              {company?.name ? ` at ${company.name}` : ''}
            </Text>
          </View>
        )}

        <View className="flex-row gap-2">
          <Button
            title="Edit Profile"
            variant="primary"
            size="md"
            fullWidth
            leftIcon="create-outline"
            style={{ flex: 1 } as any}
            onPress={handleOpenEdit}
          />
          <Button
            title="Share"
            variant="outline"
            size="md"
            leftIcon="share-social-outline"
            style={{ width: 90 } as any}
            onPress={() => Alert.alert('Share Profile', `Profile URL: https://etvacancy.com/profile/${user.id}\n${user.fullName} (${ROLE_LABELS[user.role]})`)}
          />
        </View>
      </Card>

      {/* Job Seeker specific stats */}
      {isJobSeeker && (
        <Card padding="md" variant="outlined" className="mb-6">
          <View className="flex-row justify-between">
            <TouchableOpacity onPress={() => setExperienceModalVisible(true)} className="items-center flex-1">
              <Text
                className="text-2xl font-bold text-primary-700 dark:text-primary-300 mb-1"
                style={{ includeFontPadding: false }}
              >
                {jsProfile?.experiences?.length ?? 1}
              </Text>
              <Text
                className="text-xs text-gray-500 dark:text-gray-400 text-center"
                style={{ includeFontPadding: false }}
              >
                Experiences
              </Text>
            </TouchableOpacity>
            <View className="w-px bg-gray-200 dark:bg-neutral-700" />
            <TouchableOpacity onPress={() => setEducationModalVisible(true)} className="items-center flex-1">
              <Text
                className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1"
                style={{ includeFontPadding: false }}
              >
                {jsProfile?.education?.length ?? 1}
              </Text>
              <Text
                className="text-xs text-gray-500 dark:text-gray-400 text-center"
                style={{ includeFontPadding: false }}
              >
                Education
              </Text>
            </TouchableOpacity>
            <View className="w-px bg-gray-200 dark:bg-neutral-700" />
            <TouchableOpacity onPress={() => setSkillsModalVisible(true)} className="items-center flex-1">
              <Text
                className="text-2xl font-bold text-amber-600 dark:text-amber-400 mb-1"
                style={{ includeFontPadding: false }}
              >
                {jsProfile?.skills?.length ?? 4}
              </Text>
              <Text
                className="text-xs text-gray-500 dark:text-gray-400 text-center"
                style={{ includeFontPadding: false }}
              >
                Skills
              </Text>
            </TouchableOpacity>
            <View className="w-px bg-gray-200 dark:bg-neutral-700" />
            <TouchableOpacity onPress={() => setResumeModalVisible(true)} className="items-center flex-1">
              <Text
                className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-1"
                style={{ includeFontPadding: false }}
              >
                ✓
              </Text>
              <Text
                className="text-xs text-gray-500 dark:text-gray-400 text-center"
                style={{ includeFontPadding: false }}
              >
                Resume
              </Text>
            </TouchableOpacity>
          </View>
        </Card>
      )}

      {/* Account Menu */}
      <Card padding="md" className="mb-4">
        <SectionHeader title="Account" />
        <MenuItem
          icon="person-outline"
          label="Personal Information"
          value="Name, Headline, Phone"
          onPress={handleOpenEdit}
        />
        <Divider />
        {isJobSeeker && (
          <>
            <MenuItem
              icon="document-text-outline"
              label="Resume & Documents"
              value={jsProfile?.resumeFileName ?? 'Resume_CV.pdf'}
              onPress={() => setResumeModalVisible(true)}
            />
            <Divider />
            <MenuItem
              icon="briefcase-outline"
              label="Work Experience"
              value={jsProfile?.experiences ? `${jsProfile.experiences.length} entries` : 'Add experiences'}
              onPress={() => setExperienceModalVisible(true)}
            />
            <Divider />
            <MenuItem
              icon="school-outline"
              label="Education"
              value={jsProfile?.education ? `${jsProfile.education.length} entries` : 'Add education'}
              onPress={() => setEducationModalVisible(true)}
            />
            <Divider />
            <MenuItem
              icon="code-slash-outline"
              label="Skills & Expertise"
              value={jsProfile?.skills ? `${jsProfile.skills.length} skills listed` : 'Add skills'}
              onPress={() => setSkillsModalVisible(true)}
            />
            <Divider />
          </>
        )}
        {isEmployer && (
          <>
            <MenuItem
              icon="business-outline"
              label="Company Profile"
              value={company?.name ?? 'Manage Company'}
              onPress={() => router.push('/employer/company')}
            />
            <Divider />
          </>
        )}
        <MenuItem
          icon="mail-outline"
          label="Email Address"
          value={user.email}
          rightIcon={user.emailVerified ? 'checkmark-circle' : 'alert-circle-outline'}
          tint={user.emailVerified ? COLORS.success : COLORS.warning}
          onPress={() => Alert.alert('Email Information', `Current email: ${user.email}\nStatus: ${user.emailVerified ? 'Verified' : 'Verification email sent.'}`)}
        />
        <Divider />
        <MenuItem
          icon="call-outline"
          label="Phone Number"
          value={user.phone ?? 'Tap to add'}
          onPress={handleOpenEdit}
        />
      </Card>

      {/* My Activity */}
      <Card padding="md" className="mb-4">
        <SectionHeader title="My Activity" />
        {isJobSeeker ? (
          <>
            <MenuItem
              icon="paper-plane-outline"
              label="My Applications"
              onPress={() => router.push('/applications')}
            />
            <Divider />
            <MenuItem
              icon="bookmark-outline"
              label="Saved Jobs"
              onPress={() => router.push('/saved')}
            />
            <Divider />
            <MenuItem
              icon="calendar-outline"
              label="Job Applications Status"
              onPress={() => router.push('/applications')}
            />
          </>
        ) : (
          <>
            <MenuItem
              icon="document-text-outline"
              label="My Vacancies"
              onPress={() => router.push('/employer/vacancies')}
            />
            <Divider />
            <MenuItem
              icon="people-outline"
              label="Applicants"
              onPress={() => router.push('/employer/applicants')}
            />
            <Divider />
            <MenuItem
              icon="calendar-outline"
              label="Interviews"
              onPress={() => router.push('/employer/interviews')}
            />
          </>
        )}
      </Card>

      {/* Preferences */}
      <Card padding="md" className="mb-4">
        <SectionHeader title="Preferences" />
        <MenuItem
          icon={
            theme === THEME.DARK
              ? 'moon'
              : theme === THEME.LIGHT
              ? 'sunny'
              : 'phone-portrait-outline'
          }
          label="Appearance"
          value={
            theme === THEME.DARK ? 'Dark' : theme === THEME.LIGHT ? 'Light' : 'System'
          }
          onPress={() => setShowThemeSheet(true)}
        />
        <Divider />
        <MenuItem
          icon="globe-outline"
          label="Language"
          value={LANGUAGES.find((l) => l.code === language)?.nativeName ?? 'English'}
          onPress={() => {
            const next = LANGUAGES.findIndex((l) => l.code === language);
            const target = LANGUAGES[(next + 1) % LANGUAGES.length];
            setLanguage(target.code);
            Alert.alert('Language Updated', `Switched to ${target.nativeName}.`);
          }}
        />
        <Divider />
        <MenuItem
          icon="notifications-outline"
          label="Notifications"
          value={notifJobs && notifApplications ? 'All enabled' : 'Custom'}
          onPress={() => setNotificationsModalVisible(true)}
        />
        <Divider />
        <MenuItem
          icon="swap-horizontal-outline"
          label="Switch Role / Portal"
          value={ROLE_LABELS[user.role]}
          onPress={() => setRoleModalVisible(true)}
        />
      </Card>

      {/* Support */}
      <Card padding="md" className="mb-4">
        <SectionHeader title="Support & About" />
        <MenuItem
          icon="help-circle-outline"
          label="Help & FAQ"
          onPress={() => Alert.alert('Help & FAQ', 'EtVacancy Support:\nEmail: support@etvacancy.com\nPhone: +251 11 654 3210\nOffice: Bole, Addis Ababa, Ethiopia')}
        />
        <Divider />
        <MenuItem
          icon="mail-unread-outline"
          label="Contact Support"
          onPress={() => Alert.alert('Contact Support', 'Get assistance anytime by emailing support@etvacancy.com.')}
        />
        <Divider />
        <MenuItem
          icon="shield-checkmark-outline"
          label="Privacy Policy"
          onPress={() => Alert.alert('Privacy Policy', 'EtVacancy is committed to keeping candidate and company data safe.')}
        />
        <Divider />
        <MenuItem
          icon="information-circle-outline"
          label="About EtVacancy"
          value="v1.0.0"
          onPress={() =>
            Alert.alert(
              'About EtVacancy',
              'EtVacancy v1.0.0\n\nEthiopia\'s premier job marketplace connecting talented professionals with forward-thinking employers.',
            )
          }
        />
      </Card>

      {/* Member since */}
      <View className="items-center py-2 mb-4">
        <Text
          className="text-xs text-gray-400 dark:text-gray-500"
          style={{ includeFontPadding: false }}
        >
          Member since {formatDate(user.createdAt, 'long')}
        </Text>
      </View>

      {/* Logout */}
      <Card padding="md" className="mb-8">
        <MenuItem
          icon="log-out-outline"
          label="Sign Out"
          danger
          onPress={handleLogout}
        />
      </Card>

      {/* Theme selection action sheet */}
      {showThemeSheet && (
        <TouchableOpacity
          className="absolute inset-0 bg-black/40 items-end justify-end z-50"
          activeOpacity={1}
          onPress={() => setShowThemeSheet(false)}
        >
          <View
            className="w-full bg-white dark:bg-neutral-800 rounded-t-3xl p-6 pb-10"
            onStartShouldSetResponder={() => true}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <View className="w-10 h-1 bg-gray-300 dark:bg-neutral-600 rounded-full mx-auto mb-6" />
            <Text
              className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center"
              style={{ includeFontPadding: false }}
            >
              Appearance
            </Text>
            <View className="gap-3">
              {[
                { value: THEME.SYSTEM, label: 'System Default', icon: 'phone-portrait-outline' as const },
                { value: THEME.LIGHT, label: 'Light Mode', icon: 'sunny-outline' as const },
                { value: THEME.DARK, label: 'Dark Mode', icon: 'moon-outline' as const },
              ].map((option) => {
                const selected = theme === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    className={`flex-row items-center p-4 rounded-2xl border-2 ${
                      selected
                        ? 'border-primary-700 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-700/50'
                    }`}
                    onPress={() => {
                      setTheme(option.value as 'light' | 'dark' | 'system');
                      setShowThemeSheet(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View className={`w-11 h-11 rounded-xl items-center justify-center mr-4 ${
                      selected ? 'bg-primary-700' : 'bg-gray-200 dark:bg-neutral-600'
                    }`}>
                      <Ionicons
                        name={option.icon}
                        size={22}
                        color={selected ? '#FFFFFF' : '#6B7280'}
                      />
                    </View>
                    <View className="flex-1">
                      <Text
                        className={`font-semibold ${
                          selected
                            ? 'text-primary-700 dark:text-primary-300'
                            : 'text-gray-900 dark:text-gray-100'
                        }`}
                        style={{ includeFontPadding: false }}
                      >
                        {option.label}
                      </Text>
                    </View>
                    {selected && (
                      <View className="w-6 h-6 bg-primary-700 rounded-full items-center justify-center">
                        <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </TouchableOpacity>
      )}

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
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
          onPress={() => setEditModalVisible(false)}
        >
          <View
            style={{
              width: '100%',
              maxWidth: 440,
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 24,
            }}
            onStartShouldSetResponder={() => true}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#0F172A' }}>Edit Personal Profile</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 12 }}>
              <View>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 4 }}>First Name</Text>
                <Input
                  value={editFirstName}
                  onChangeText={setEditFirstName}
                  placeholder="First name"
                />
              </View>

              <View>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 4 }}>Last Name</Text>
                <Input
                  value={editLastName}
                  onChangeText={setEditLastName}
                  placeholder="Last name"
                />
              </View>

              <View>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 4 }}>Professional Headline</Text>
                <Input
                  value={editHeadline}
                  onChangeText={setEditHeadline}
                  placeholder="e.g. Senior Mobile Developer | React Native"
                />
              </View>

              <View>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 4 }}>Phone Number</Text>
                <Input
                  placeholder="+251 911 234 567"
                  value={editPhone}
                  onChangeText={setEditPhone}
                />
              </View>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                <View style={{ flex: 1 }}>
                  <Button
                    title="Cancel"
                    variant="outline"
                    size="md"
                    onPress={() => setEditModalVisible(false)}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Button
                    title="Save Profile"
                    variant="primary"
                    size="md"
                    onPress={handleSaveProfile}
                  />
                </View>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Resume Modal */}
      <Modal
        visible={resumeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setResumeModalVisible(false)}
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
          onPress={() => setResumeModalVisible(false)}
        >
          <View
            style={{
              width: '100%',
              maxWidth: 440,
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 24,
            }}
            onStartShouldSetResponder={() => true}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#0F172A' }}>Resume & Documents</Text>
              <TouchableOpacity onPress={() => setResumeModalVisible(false)}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={{ backgroundColor: '#F1F5F9', padding: 16, borderRadius: 12, marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="document-text" size={24} color="#1D4ED8" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F172A' }}>{customResumeName}</Text>
                  <Text style={{ fontSize: 12, color: '#64748B' }}>PDF Document • Updated recently</Text>
                </View>
              </View>
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6 }}>Resume Document Name</Text>
              <Input
                value={customResumeName}
                onChangeText={setCustomResumeName}
                placeholder="e.g. My_Updated_Resume_2026.pdf"
              />
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Button
                  title="Upload New File"
                  variant="outline"
                  size="md"
                  leftIcon="cloud-upload-outline"
                  onPress={() => {
                    setCustomResumeName(`CV_${user.firstName ?? 'Candidate'}_${new Date().getFullYear()}.pdf`);
                    Alert.alert('File Selected', 'New resume document attached.');
                  }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  title="Save Resume"
                  variant="primary"
                  size="md"
                  onPress={handleSaveResume}
                />
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Experience Modal */}
      <Modal
        visible={experienceModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setExperienceModalVisible(false)}
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
          onPress={() => setExperienceModalVisible(false)}
        >
          <View
            style={{
              width: '100%',
              maxWidth: 480,
              maxHeight: '85%',
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 24,
            }}
            onStartShouldSetResponder={() => true}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#0F172A' }}>Work Experiences</Text>
              <TouchableOpacity onPress={() => setExperienceModalVisible(false)}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
              {/* Existing List */}
              {(jsProfile?.experiences ?? []).map((exp) => (
                <View key={exp.id} style={{ padding: 12, borderRadius: 10, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F172A' }}>{exp.jobTitle}</Text>
                    <Text style={{ fontSize: 12, color: '#475569' }}>{exp.companyName} • {exp.location}</Text>
                    <Text style={{ fontSize: 11, color: '#94A3B8' }}>{exp.startDate} - {exp.endDate ?? 'Present'}</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDeleteExperience(exp.id)} style={{ padding: 6 }}>
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}

              {/* Add New Section */}
              <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderColor: '#E2E8F0' }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F172A', marginBottom: 10 }}>Add New Experience</Text>
                <View style={{ gap: 10 }}>
                  <Input placeholder="Job Title (e.g. Frontend Developer)" value={expTitle} onChangeText={setExpTitle} />
                  <Input placeholder="Company Name (e.g. TeleSoft Ltd)" value={expCompany} onChangeText={setExpCompany} />
                  <Input placeholder="Location (e.g. Addis Ababa)" value={expLocation} onChangeText={setExpLocation} />
                  <Input placeholder="Time Period (e.g. 2023 - Present)" value={expPeriod} onChangeText={setExpPeriod} />
                  <Button title="+ Add Experience" variant="primary" size="md" onPress={handleAddExperience} />
                </View>
              </View>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Education Modal */}
      <Modal
        visible={educationModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEducationModalVisible(false)}
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
          onPress={() => setEducationModalVisible(false)}
        >
          <View
            style={{
              width: '100%',
              maxWidth: 480,
              maxHeight: '85%',
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 24,
            }}
            onStartShouldSetResponder={() => true}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#0F172A' }}>Education History</Text>
              <TouchableOpacity onPress={() => setEducationModalVisible(false)}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
              {(jsProfile?.education ?? []).map((edu) => (
                <View key={edu.id} style={{ padding: 12, borderRadius: 10, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F172A' }}>{edu.degree}</Text>
                    <Text style={{ fontSize: 12, color: '#475569' }}>{edu.institution}</Text>
                    <Text style={{ fontSize: 11, color: '#94A3B8' }}>Graduation: {edu.graduationYear ?? edu.endDate}</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDeleteEducation(edu.id)} style={{ padding: 6 }}>
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}

              <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderColor: '#E2E8F0' }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F172A', marginBottom: 10 }}>Add New Education</Text>
                <View style={{ gap: 10 }}>
                  <Input placeholder="Degree (e.g. BSc in Computer Science)" value={eduDegree} onChangeText={setEduDegree} />
                  <Input placeholder="Institution (e.g. Addis Ababa University)" value={eduInstitution} onChangeText={setEduInstitution} />
                  <Input placeholder="Graduation Year (e.g. 2024)" value={eduYear} onChangeText={setEduYear} />
                  <Button title="+ Add Education" variant="primary" size="md" onPress={handleAddEducation} />
                </View>
              </View>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Skills Modal */}
      <Modal
        visible={skillsModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSkillsModalVisible(false)}
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
          onPress={() => setSkillsModalVisible(false)}
        >
          <View
            style={{
              width: '100%',
              maxWidth: 440,
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 24,
            }}
            onStartShouldSetResponder={() => true}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#0F172A' }}>Skills & Expertise</Text>
              <TouchableOpacity onPress={() => setSkillsModalVisible(false)}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
              <View style={{ flex: 1 }}>
                <Input
                  placeholder="e.g. React Native, Python, SQL"
                  value={newSkillText}
                  onChangeText={setNewSkillText}
                  onSubmitEditing={handleAddSkill}
                />
              </View>
              <Button title="Add" variant="primary" size="md" onPress={handleAddSkill} />
            </View>

            <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748B', marginBottom: 10, textTransform: 'uppercase' }}>
              Your Skills ({(jsProfile?.skills ?? []).length})
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, maxHeight: 200 }}>
              {(jsProfile?.skills ?? ['React Native', 'TypeScript', 'Node.js', 'UI/UX Design']).map((skill) => (
                <View
                  key={skill}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#EFF6FF',
                    paddingVertical: 6,
                    paddingHorizontal: 10,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: '#BFDBFE',
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#1D4ED8', marginRight: 6 }}>{skill}</Text>
                  <TouchableOpacity onPress={() => handleRemoveSkill(skill)}>
                    <Ionicons name="close-circle" size={16} color="#3B82F6" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <Button
              title="Done"
              variant="outline"
              size="md"
              fullWidth
              style={{ marginTop: 20 } as any}
              onPress={() => setSkillsModalVisible(false)}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Role Switcher Modal */}
      <Modal
        visible={roleModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRoleModalVisible(false)}
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
          onPress={() => setRoleModalVisible(false)}
        >
          <View
            style={{
              width: '100%',
              maxWidth: 440,
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 24,
            }}
            onStartShouldSetResponder={() => true}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#0F172A' }}>Switch Active Role</Text>
              <TouchableOpacity onPress={() => setRoleModalVisible(false)}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>
              Select a role to preview and navigate across the different portals of the app.
            </Text>

            <View style={{ gap: 10 }}>
              {[
                { role: 'JOB_SEEKER' as const, title: 'Job Seeker', desc: 'Browse, save, and apply to job openings', icon: 'person' as const, color: '#2563EB' },
                { role: 'EMPLOYER' as const, title: 'Employer / Recruiter', desc: 'Post vacancies, review applicants, & schedule interviews', icon: 'business' as const, color: '#D97706' },
                { role: 'ADMIN' as const, title: 'System Administrator', desc: 'Manage users, companies, categories, and site health', icon: 'shield-checkmark' as const, color: '#7C3AED' },
              ].map((item) => {
                const isActive = user.role === item.role;
                return (
                  <TouchableOpacity
                    key={item.role}
                    onPress={() => handleRoleSwitch(item.role)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: 14,
                      borderRadius: 12,
                      borderWidth: 2,
                      borderColor: isActive ? item.color : '#E2E8F0',
                      backgroundColor: isActive ? `${item.color}10` : '#F8FAFC',
                    }}
                  >
                    <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: `${item.color}20`, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                      <Ionicons name={item.icon} size={20} color={item.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: '700', color: '#0F172A' }}>{item.title}</Text>
                      <Text style={{ fontSize: 12, color: '#64748B' }}>{item.desc}</Text>
                    </View>
                    {isActive && (
                      <Ionicons name="checkmark-circle" size={22} color={item.color} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Notifications Modal */}
      <Modal
        visible={notificationsModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setNotificationsModalVisible(false)}
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
          onPress={() => setNotificationsModalVisible(false)}
        >
          <View
            style={{
              width: '100%',
              maxWidth: 420,
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 24,
            }}
            onStartShouldSetResponder={() => true}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#0F172A' }}>Notification Preferences</Text>
              <TouchableOpacity onPress={() => setNotificationsModalVisible(false)}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 14 }}>
              <TouchableOpacity
                onPress={() => setNotifJobs(!notifJobs)}
                style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 }}
              >
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#0F172A' }}>Job Alerts & Matches</Text>
                  <Text style={{ fontSize: 12, color: '#64748B' }}>Get notified when new jobs match your skills</Text>
                </View>
                <Ionicons name={notifJobs ? 'checkbox' : 'square-outline'} size={22} color={COLORS.primary} />
              </TouchableOpacity>

              <Divider />

              <TouchableOpacity
                onPress={() => setNotifApplications(!notifApplications)}
                style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 }}
              >
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#0F172A' }}>Application Updates</Text>
                  <Text style={{ fontSize: 12, color: '#64748B' }}>Status changes, interview requests, and feedback</Text>
                </View>
                <Ionicons name={notifApplications ? 'checkbox' : 'square-outline'} size={22} color={COLORS.primary} />
              </TouchableOpacity>

              <Divider />

              <TouchableOpacity
                onPress={() => setNotifMarketing(!notifMarketing)}
                style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 }}
              >
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#0F172A' }}>Newsletter & Tips</Text>
                  <Text style={{ fontSize: 12, color: '#64748B' }}>Career advice and platform updates</Text>
                </View>
                <Ionicons name={notifMarketing ? 'checkbox' : 'square-outline'} size={22} color={COLORS.primary} />
              </TouchableOpacity>

              <Button
                title="Save Preferences"
                variant="primary"
                size="md"
                style={{ marginTop: 12 } as any}
                onPress={() => {
                  setNotificationsModalVisible(false);
                  Alert.alert('Saved', 'Your notification settings have been updated.');
                }}
              />
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </Screen>
  );
}
