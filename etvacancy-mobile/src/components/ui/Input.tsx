import { forwardRef, useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  type TextInputProps,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { COLORS } from '@constants/index';

type InputVariant = 'default' | 'outlined' | 'filled';
type InputSize = 'sm' | 'md' | 'lg';

interface BaseInputProps extends Omit<TextInputProps, 'placeholderTextColor'> {
  variant?: InputVariant;
  size?: InputSize;
  label?: string;
  error?: string;
  helper?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  secureTextEntry?: boolean;
  fullWidth?: boolean;
  className?: string;
  containerClassName?: string;
}

const variantStyles: Record<InputVariant, { container: string; focused: string }> = {
  default: {
    container: 'border-b-2 border-gray-200 bg-transparent',
    focused: 'border-primary-700',
  },
  outlined: {
    container: 'border border-gray-300 rounded-xl bg-white dark:bg-neutral-800 dark:border-neutral-700',
    focused: 'border-primary-700 dark:border-primary-500',
  },
  filled: {
    container: 'border border-transparent rounded-xl bg-gray-100 dark:bg-neutral-800',
    focused: 'bg-gray-50 dark:bg-neutral-700 border-primary-700',
  },
};

const sizeStyles: Record<InputSize, { container: string; text: string; icon: number }> = {
  sm: { container: 'px-3 py-2', text: 'text-sm', icon: 16 },
  md: { container: 'px-4 py-3', text: 'text-base', icon: 18 },
  lg: { container: 'px-5 py-4', text: 'text-lg', icon: 20 },
};

const BaseInput = forwardRef<TextInput, BaseInputProps>(
  (
    {
      variant = 'outlined',
      size = 'md',
      label,
      error,
      helper,
      leftIcon,
      rightIcon,
      onRightIconPress,
      secureTextEntry,
      fullWidth = true,
      className = '',
      containerClassName = '',
      style,
      ...props
    },
    ref,
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(!secureTextEntry);

    const variantConfig = variantStyles[variant];
    const sizeConfig = sizeStyles[size];
    const hasError = !!error;

    return (
      <View className={`${fullWidth ? 'w-full' : ''} ${containerClassName}`}>
        {label && (
          <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            {label}
          </Text>
        )}
        <View
          className={`
            flex-row items-center
            ${variantConfig.container}
            ${isFocused ? variantConfig.focused : ''}
            ${hasError ? 'border-red-500' : ''}
            ${sizeConfig.container}
            ${className}
          `}
        >
          {leftIcon && (
            <Ionicons
              name={leftIcon}
              size={sizeConfig.icon}
              color={hasError ? COLORS.danger : isFocused ? COLORS.primary : '#9CA3AF'}
              style={{ marginRight: 8 }}
            />
          )}
          <TextInput
            ref={ref}
            className={`flex-1 ${sizeConfig.text} text-gray-900 dark:text-gray-100`}
            style={[
              {
                includeFontPadding: false,
                textAlignVertical: 'center',
                outlineStyle: 'none',
                outlineWidth: 0,
                outlineColor: 'transparent',
                borderWidth: 0,
              } as any,
              style,
            ]}
            placeholderTextColor={hasError ? '#EF4444' : '#9CA3AF'}
            secureTextEntry={secureTextEntry && !isPasswordVisible}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            {...props}
          />
          {secureTextEntry ? (
            <TouchableOpacity
              onPress={() => setIsPasswordVisible((v) => !v)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
                size={sizeConfig.icon}
                color={isFocused ? COLORS.primary : '#9CA3AF'}
              />
            </TouchableOpacity>
          ) : (
            rightIcon && (
              <TouchableOpacity
                onPress={onRightIconPress}
                disabled={!onRightIconPress}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name={rightIcon}
                  size={sizeConfig.icon}
                  color={hasError ? COLORS.danger : isFocused ? COLORS.primary : '#9CA3AF'}
                />
              </TouchableOpacity>
            )
          )}
        </View>
        {error ? (
          <View className="flex-row items-center gap-1 mt-1.5">
            <Ionicons name="alert-circle" size={14} color={COLORS.danger} />
            <Text className="text-xs text-red-500">{error}</Text>
          </View>
        ) : helper ? (
          <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">{helper}</Text>
        ) : null}
      </View>
    );
  },
);

BaseInput.displayName = 'Input';

interface FormInputProps<T extends FieldValues> extends BaseInputProps {
  control: Control<T>;
  name: Path<T>;
}

function FormInput<T extends FieldValues>({ control, name, ...props }: FormInputProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <BaseInput
          {...props}
          value={value as string | undefined}
          onChangeText={(text) => onChange(text)}
          onBlur={onBlur}
          error={error?.message ?? props.error}
        />
      )}
    />
  );
}

export { BaseInput as Input, FormInput };
export default BaseInput;
