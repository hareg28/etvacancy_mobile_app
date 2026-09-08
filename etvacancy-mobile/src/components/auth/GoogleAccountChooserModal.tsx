import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  StyleSheet,
  TextInput,
  Platform,
} from 'react-native';
import { useState } from 'react';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import type { User } from '@/types/index';

/** Authentic 4-color Google "G" logo */
function GoogleGIcon({ size = 18 }: { size?: number }) {
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

/** Glowing App Chevron Icon */
function AppBrandIcon() {
  return (
    <View style={styles.brandIconContainer}>
      <Svg width={36} height={36} viewBox="0 0 36 36">
        <Path
          d="M18 4 L30 28 L23 28 L18 17 L13 28 L6 28 Z"
          fill="url(#brandGrad)"
        />
        <Path
          d="M14 22 L22 22 L18 14 Z"
          fill="#131314"
        />
      </Svg>
      {/* Decorative gradient glow */}
      <View style={styles.brandIconGlow} />
    </View>
  );
}

export interface GoogleAccountItem {
  id: string;
  name: string;
  email: string;
  avatarLetter: string;
  avatarBg: string;
  signedOut?: boolean;
}

const DEFAULT_GOOGLE_ACCOUNTS: GoogleAccountItem[] = [
  {
    id: 'g_1',
    name: 'Hareg Hareg T',
    email: 'haregetewabe47@gmail.com',
    avatarLetter: 'H',
    avatarBg: '#0288D1',
    signedOut: false,
  },
  {
    id: 'g_2',
    name: 'HAREGEWEYN TEWABE',
    email: 'haregetewabe28@gmail.com',
    avatarLetter: 'H',
    avatarBg: '#2E7D32',
    signedOut: false,
  },
  {
    id: 'g_3',
    name: 'Haregeweyn Tewabe',
    email: 'haregeweyn.tewabe@aastustudent.edu.et',
    avatarLetter: 'H',
    avatarBg: '#5D4037',
    signedOut: true,
  },
  {
    id: 'g_4',
    name: 'Hareg Tewabe',
    email: 'haregtewabe8@gmail.com',
    avatarLetter: 'H',
    avatarBg: '#00796B',
    signedOut: true,
  },
  {
    id: 'g_5',
    name: 'Haregeweyn Afework',
    email: 'haregeweynafework@gmail.com',
    avatarLetter: 'H',
    avatarBg: '#5D4037',
    signedOut: true,
  },
  {
    id: 'g_6',
    name: 'Haregeweyn Afework',
    email: 'haregeweynafework89@gmail.com',
    avatarLetter: 'H',
    avatarBg: '#2E7D32',
    signedOut: true,
  },
  {
    id: 'g_7',
    name: 'Samuel Tewabe',
    email: 'samueltewabe4756@gmail.com',
    avatarLetter: 'S',
    avatarBg: '#D84315',
    signedOut: true,
  },
  {
    id: 'g_8',
    name: 'Yengus K',
    email: 'yengusk21@gmail.com',
    avatarLetter: 'Y',
    avatarBg: '#C2185B',
    signedOut: true,
  },
];

interface GoogleAccountChooserModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectAccount: (user: Partial<User> & { email: string; fullName: string }) => void;
}

export default function GoogleAccountChooserModal({
  visible,
  onClose,
  onSelectAccount,
}: GoogleAccountChooserModalProps) {
  const [selectedId, setSelectedId] = useState<string>('g_1');
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [customError, setCustomError] = useState('');

  const handleSelect = (acc: GoogleAccountItem) => {
    setSelectedId(acc.id);
    const nameParts = acc.name.split(' ');
    const firstName = nameParts[0] || 'User';
    const lastName = nameParts.slice(1).join(' ') || '';

    onSelectAccount({
      id: `google_${acc.id}_${Date.now()}`,
      email: acc.email,
      fullName: acc.name,
      firstName,
      lastName,
      avatar: null,
      emailVerified: true,
      verificationStatus: 'VERIFIED',
    });
  };

  const handleAddCustomAccount = () => {
    if (!customEmail || !customEmail.includes('@')) {
      setCustomError('Please enter a valid Gmail address');
      return;
    }
    const name = customName.trim() || customEmail.split('@')[0];
    const nameParts = name.split(' ');

    onSelectAccount({
      id: `google_custom_${Date.now()}`,
      email: customEmail.trim().toLowerCase(),
      fullName: name,
      firstName: nameParts[0] || 'User',
      lastName: nameParts.slice(1).join(' ') || '',
      avatar: null,
      emailVerified: true,
      verificationStatus: 'VERIFIED',
    });
    setShowAddAccount(false);
    setCustomName('');
    setCustomEmail('');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.cardContainer}>
          {/* Top Bar: Sign in with Google */}
          <View style={styles.topBar}>
            <View style={styles.topBarLeft}>
              <GoogleGIcon size={18} />
              <Text style={styles.topBarTitle}>Sign in with Google</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={20} color="#9AA0A6" />
            </TouchableOpacity>
          </View>

          {/* Body Section */}
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header / Brand Area */}
            <View style={styles.headerSection}>
              <View style={styles.brandIconWrap}>
                <Ionicons name="infinite" size={28} color="#60A5FA" />
              </View>
              <Text style={styles.mainTitle}>Choose an account</Text>
              <Text style={styles.subTitle}>
                to continue to <Text style={styles.appNameLink}>EtVacancy</Text>
              </Text>
            </View>

            {/* Account List */}
            {!showAddAccount ? (
              <View style={styles.accountList}>
                {DEFAULT_GOOGLE_ACCOUNTS.map((acc) => {
                  const isSelected = selectedId === acc.id;
                  return (
                    <TouchableOpacity
                      key={acc.id}
                      style={[
                        styles.accountRow,
                        isSelected && styles.accountRowSelected,
                        Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {},
                      ]}
                      onPress={() => handleSelect(acc)}
                      activeOpacity={0.7}
                    >
                      {/* Avatar */}
                      <View
                        style={[
                          styles.avatarCircle,
                          { backgroundColor: acc.avatarBg },
                        ]}
                      >
                        <Text style={styles.avatarLetter}>{acc.avatarLetter}</Text>
                      </View>

                      {/* Info */}
                      <View style={styles.accountInfo}>
                        <Text style={styles.accountName} numberOfLines={1}>
                          {acc.name}
                        </Text>
                        <Text style={styles.accountEmail} numberOfLines={1}>
                          {acc.email}
                        </Text>
                      </View>

                      {/* Status */}
                      {acc.signedOut && (
                        <Text style={styles.signedOutText}>Signed out</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}

                {/* Divider */}
                <View style={styles.divider} />

                {/* Use Another Account Button */}
                <TouchableOpacity
                  style={[
                    styles.useAnotherRow,
                    Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {},
                  ]}
                  onPress={() => setShowAddAccount(true)}
                  activeOpacity={0.7}
                >
                  <View style={styles.useAnotherIconWrap}>
                    <Ionicons name="person-add-outline" size={18} color="#9AA0A6" />
                  </View>
                  <Text style={styles.useAnotherText}>Use another account</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* Add Custom Google Account Form */
              <View style={styles.addAccountForm}>
                <Text style={styles.formHeading}>Enter your Google account</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email address</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="example@gmail.com"
                    placeholderTextColor="#5F6368"
                    value={customEmail}
                    onChangeText={(val) => {
                      setCustomEmail(val);
                      setCustomError('');
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Full Name (optional)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="John Doe"
                    placeholderTextColor="#5F6368"
                    value={customName}
                    onChangeText={setCustomName}
                  />
                </View>

                {customError ? (
                  <Text style={styles.formErrorText}>{customError}</Text>
                ) : null}

                <View style={styles.formButtonsRow}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => setShowAddAccount(false)}
                  >
                    <Text style={styles.cancelBtnText}>Back</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.continueBtn}
                    onPress={handleAddCustomAccount}
                  >
                    <Text style={styles.continueBtnText}>Continue</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Footer Notice */}
            <View style={styles.footerNotice}>
              <Text style={styles.footerNoticeText}>
                To continue, Google will share your name, email address, and language
                preference with EtVacancy. Before using this app, review EtVacancy's{' '}
                <Text style={styles.footerNoticeLink}>privacy policy</Text> and{' '}
                <Text style={styles.footerNoticeLink}>terms of service</Text>.
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '90%',
    backgroundColor: '#1E1F20',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#303134',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 28,
    elevation: 20,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2D2E30',
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topBarTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#E8EAED',
    letterSpacing: 0.2,
  },
  closeBtn: {
    padding: 4,
    borderRadius: 16,
  },
  scrollArea: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  headerSection: {
    marginBottom: 20,
  },
  brandIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  brandIconContainer: {
    width: 36,
    height: 36,
    position: 'relative',
    marginBottom: 12,
  },
  brandIconGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 18,
    backgroundColor: '#3B82F6',
    opacity: 0.15,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F1F3F4',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  subTitle: {
    fontSize: 14,
    color: '#9AA0A6',
    lineHeight: 20,
  },
  appNameLink: {
    color: '#8AB4F8',
    fontWeight: '600',
  },
  accountList: {
    gap: 4,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  accountRowSelected: {
    backgroundColor: '#2A2B2D',
    borderColor: '#3C4043',
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarLetter: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  accountInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  accountName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E8EAED',
    marginBottom: 2,
  },
  accountEmail: {
    fontSize: 12,
    color: '#9AA0A6',
  },
  signedOutText: {
    fontSize: 12,
    color: '#9AA0A6',
    marginLeft: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#2D2E30',
    marginVertical: 10,
  },
  useAnotherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  useAnotherIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#2A2B2D',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  useAnotherText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#E8EAED',
  },
  addAccountForm: {
    paddingVertical: 8,
    gap: 16,
  },
  formHeading: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E8EAED',
    marginBottom: 4,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9AA0A6',
  },
  textInput: {
    backgroundColor: '#131314',
    borderWidth: 1,
    borderColor: '#3C4043',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#F1F3F4',
  },
  formErrorText: {
    color: '#F28B82',
    fontSize: 12,
  },
  formButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  cancelBtnText: {
    color: '#9AA0A6',
    fontSize: 14,
    fontWeight: '600',
  },
  continueBtn: {
    backgroundColor: '#8AB4F8',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  continueBtnText: {
    color: '#131314',
    fontSize: 14,
    fontWeight: '700',
  },
  footerNotice: {
    marginTop: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#2D2E30',
  },
  footerNoticeText: {
    fontSize: 11,
    color: '#5F6368',
    lineHeight: 16,
  },
  footerNoticeLink: {
    color: '#8AB4F8',
  },
});
