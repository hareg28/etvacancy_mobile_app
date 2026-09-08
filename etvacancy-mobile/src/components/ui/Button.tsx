import { forwardRef } from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  View,
  Platform,
  type PressableProps,
  type ViewStyle,
  type TextStyle,
  type Insets,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@constants/index';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'google';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<PressableProps, 'style'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  title: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  iconSize?: number;
  fullWidth?: boolean;
  className?: string;
  style?: ViewStyle | ((state: { pressed: boolean }) => ViewStyle);
  hitSlop?: Insets | number;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-primary-700',
  secondary: 'bg-secondary-600',
  outline: 'bg-transparent border-2 border-primary-700',
  ghost: 'bg-transparent',
  danger: 'bg-red-500',
  google: 'bg-white border border-slate-200 shadow-sm',
};

const variantTextStyles: Record<ButtonVariant, string> = {
  primary: 'text-white',
  secondary: 'text-white',
  outline: 'text-primary-700',
  ghost: 'text-primary-700',
  danger: 'text-white',
  google: 'text-slate-800',
};

const sizeStyles: Record<ButtonSize, { container: string; text: string; icon: number }> = {
  sm: { container: 'px-4 py-2 rounded-lg', text: 'text-sm font-medium', icon: 16 },
  md: { container: 'px-6 py-3 rounded-xl', text: 'text-base font-semibold', icon: 18 },
  lg: { container: 'px-8 py-4 rounded-2xl', text: 'text-lg font-semibold', icon: 20 },
};

const Button = forwardRef<View, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled = false,
      title,
      leftIcon,
      rightIcon,
      iconSize,
      fullWidth = false,
      style,
      className = '',
      onPress,
      hitSlop,
      ...props
    },
    ref,
  ) => {
    const sizeConfig = sizeStyles[size];
    const variantStyle = variantStyles[variant];
    const textStyle = variantTextStyles[variant];

    const iconColor =
      variant === 'primary' || variant === 'secondary' || variant === 'danger'
        ? '#FFFFFF'
        : variant === 'google'
        ? '#4285F4'
        : COLORS.primary;

    const isDisabled = disabled || loading;

    const minHeightMap: Record<ButtonSize, number> = {
      sm: 36,
      md: 48,
      lg: 56,
    };

    const defaultHitSlop: Insets = { top: 8, bottom: 8, left: 8, right: 8 };
    const resolvedHitSlop: Insets | undefined = hitSlop
      ? typeof hitSlop === 'number'
        ? { top: hitSlop, bottom: hitSlop, left: hitSlop, right: hitSlop }
        : hitSlop
      : defaultHitSlop;

    const combinedClassName = [
      'flex-row items-center justify-center gap-2',
      variantStyle,
      sizeConfig.container,
      fullWidth ? 'w-full' : '',
      isDisabled ? 'opacity-60' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    return (
      <Pressable
        ref={ref}
        disabled={isDisabled}
        role="button"
        accessibilityRole="button"
        hitSlop={resolvedHitSlop}
        onPress={(e) => {
          if (!isDisabled && onPress) {
            onPress(e);
          }
        }}
        onPressIn={props.onPressIn}
        onPressOut={props.onPressOut}
        onLongPress={props.onLongPress}
        className={combinedClassName}
        style={({ pressed }) => [
          Platform.OS === 'web'
            ? ({
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                userSelect: 'none',
                outline: 'none',
                WebkitTapHighlightColor: 'transparent',
              } as any)
            : undefined,
          { minHeight: minHeightMap[size], zIndex: 10 },
          pressed && !isDisabled ? { opacity: 0.75, transform: [{ scale: 0.98 }] } : undefined,
          typeof style === 'function' ? style({ pressed }) : style,
        ]}
        {...props}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={
              variant === 'primary' || variant === 'secondary' || variant === 'danger'
                ? '#FFFFFF'
                : variant === 'google'
                ? '#4285F4'
                : COLORS.primary
            }
          />
        ) : (
          <>
            {leftIcon && (
              <Ionicons
                name={leftIcon}
                size={iconSize ?? sizeConfig.icon}
                color={iconColor}
              />
            )}
            <Text
              className={`${sizeConfig.text} ${textStyle}`}
              style={{ includeFontPadding: false } as TextStyle}
            >
              {title}
            </Text>
            {rightIcon && (
              <Ionicons
                name={rightIcon}
                size={iconSize ?? sizeConfig.icon}
                color={iconColor}
              />
            )}
          </>
        )}
      </Pressable>
    );
  },
);

Button.displayName = 'Button';

export default Button;
