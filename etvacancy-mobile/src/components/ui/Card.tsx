import React from 'react';
import { View, Text, type ViewProps, type ViewStyle } from 'react-native';

type CardVariant = 'default' | 'elevated' | 'outlined' | 'flat';

interface CardProps extends ViewProps {
  variant?: CardVariant;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const variantStyles: Record<CardVariant, string> = {
  default: 'bg-white dark:bg-neutral-800 rounded-2xl shadow-card',
  elevated: 'bg-white dark:bg-neutral-800 rounded-2xl shadow-card-lg',
  outlined: 'bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700',
  flat: 'bg-gray-50 dark:bg-neutral-800 rounded-2xl',
};

const paddingStyles: Record<string, string> = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
  xl: 'p-8',
};

export function Card({
  variant = 'default',
  padding = 'md',
  className = '',
  style,
  children,
  ...props
}: CardProps) {
  return (
    <View
      className={`${variantStyles[variant]} ${paddingStyles[padding]} ${className}`}
      style={style as ViewStyle}
      {...props}
    >
      {children}
    </View>
  );
}

interface CardHeaderProps extends ViewProps {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  leftIcon?: React.ReactNode;
  className?: string;
}

export function CardHeader({
  title,
  subtitle,
  right,
  leftIcon,
  className = '',
  children,
  ...props
}: CardHeaderProps) {
  return (
    <View
      className={`flex-row items-center justify-between mb-4 ${className}`}
      {...props}
    >
      <View className="flex-1 flex-row items-center gap-3">
        {leftIcon}
        <View className="flex-1">
          <Text className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {title}
          </Text>
          {subtitle && (
            <Text className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {subtitle}
            </Text>
          )}
          {children}
        </View>
      </View>
      {right}
    </View>
  );
}

interface CardSectionProps extends ViewProps {
  className?: string;
  divider?: boolean;
}

export function CardSection({
  className = '',
  divider = false,
  children,
  ...props
}: CardSectionProps) {
  return (
    <View
      className={`${divider ? 'border-t border-gray-100 dark:border-neutral-700 pt-4 mt-4' : ''} ${className}`}
      {...props}
    >
      {children}
    </View>
  );
}

interface CardFooterProps extends ViewProps {
  className?: string;
}

export function CardFooter({ className = '', children, ...props }: CardFooterProps) {
  return (
    <View
      className={`flex-row items-center justify-between border-t border-gray-100 dark:border-neutral-700 pt-4 mt-4 ${className}`}
      {...props}
    >
      {children}
    </View>
  );
}

export default Card;
