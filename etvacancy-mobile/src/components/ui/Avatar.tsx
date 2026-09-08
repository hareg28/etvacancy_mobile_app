import React from 'react';
import { View, Text, TouchableOpacity, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { User } from '@/types/index';
import { getInitials, getFullName } from '@utils/index';
import { COLORS } from '@constants/index';
import { Image } from 'expo-image';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const sizeMap: Record<AvatarSize, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 72,
  '2xl': 96,
};

const fontSizeMap: Record<AvatarSize, number> = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 20,
  xl: 24,
  '2xl': 32,
};

interface AvatarProps {
  user?: Partial<User> | null;
  uri?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  size?: AvatarSize;
  rounded?: boolean;
  bordered?: boolean;
  borderColor?: string;
  ring?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export function Avatar({
  user,
  uri,
  firstName,
  lastName,
  email,
  size = 'md',
  rounded = true,
  bordered = false,
  borderColor = '#FFFFFF',
  ring = false,
  onPress,
  style,
}: AvatarProps) {
  const avatarSize = sizeMap[size];
  const fontSize = fontSizeMap[size];
  const imageUri = uri ?? user?.avatar;
  const fName = firstName ?? user?.firstName;
  const lName = lastName ?? user?.lastName;
  const mail = email ?? user?.email;

  const initials = getInitials(fName, lName, mail);
  const fullName = getFullName(fName, lName);

  const Container = (onPress ? TouchableOpacity : View) as React.ComponentType<any>;

  const containerStyle: ViewStyle = {
    width: avatarSize,
    height: avatarSize,
    borderRadius: rounded ? avatarSize / 2 : avatarSize / 4,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: bordered || ring ? 2 : 0,
    borderColor: ring ? COLORS.primaryLight : borderColor,
    ...style,
  };

  return (
    <Container style={containerStyle} onPress={onPress} activeOpacity={0.8}>
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <Text
          style={{
            color: '#FFFFFF',
            fontSize,
            fontWeight: '600',
            includeFontPadding: false,
          }}
        >
          {initials}
        </Text>
      )}
    </Container>
  );
}

interface AvatarWithBadgeProps extends AvatarProps {
  badge?: React.ReactNode;
  badgePosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  badgeSize?: number;
}

export function AvatarWithBadge({
  badge,
  badgePosition = 'bottom-right',
  badgeSize,
  ...props
}: AvatarWithBadgeProps) {
  const size = sizeMap[props.size ?? 'md'];
  const actualBadgeSize = badgeSize ?? Math.round(size * 0.35);

  const positionStyles = {
    'top-right': { top: -2, right: -2 },
    'top-left': { top: -2, left: -2 },
    'bottom-right': { bottom: -2, right: -2 },
    'bottom-left': { bottom: -2, left: -2 },
  };

  return (
    <View style={{ width: size, height: size }}>
      <Avatar {...props} />
      <View
        style={{
          position: 'absolute',
          width: actualBadgeSize,
          height: actualBadgeSize,
          borderRadius: actualBadgeSize / 2,
          backgroundColor: '#FFFFFF',
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 2,
          borderColor: '#FFFFFF',
          ...positionStyles[badgePosition],
        }}
      >
        {badge}
      </View>
    </View>
  );
}

interface AvatarGroupProps {
  users: Array<Partial<User> | { uri?: string; firstName?: string; lastName?: string }>;
  max?: number;
  size?: AvatarSize;
  overlap?: number;
}

export function AvatarGroup({ users, max = 4, size = 'md', overlap }: AvatarGroupProps) {
  const avatarSize = sizeMap[size];
  const actualOverlap = overlap ?? Math.round(avatarSize * 0.3);
  const visibleUsers = users.slice(0, max);
  const remainingCount = Math.max(0, users.length - max);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {visibleUsers.map((user, index) => (
        <View
          key={index}
          style={{
            marginLeft: index > 0 ? -actualOverlap : 0,
            zIndex: visibleUsers.length - index,
          }}
        >
          <Avatar
            user={user as Partial<User>}
            size={size}
            bordered
            borderColor="#FFFFFF"
          />
        </View>
      ))}
      {remainingCount > 0 && (
        <View
          style={{
            marginLeft: -actualOverlap,
            zIndex: 0,
            width: avatarSize,
            height: avatarSize,
            borderRadius: avatarSize / 2,
            backgroundColor: '#E5E7EB',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 2,
            borderColor: '#FFFFFF',
          }}
        >
          <Text
            style={{
              fontSize: fontSizeMap[size],
              fontWeight: '600',
              color: '#374151',
              includeFontPadding: false,
            }}
          >
            +{remainingCount}
          </Text>
        </View>
      )}
    </View>
  );
}

export default Avatar;
