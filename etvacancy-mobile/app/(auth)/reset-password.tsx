import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useLocalSearchParams, Link } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { AuthScreenContainer } from '@components/ui/Screen';
import { Input } from '@components/ui/Input';
import Button from '@components/ui/Button';
import { resetPasswordSchema, type ResetPasswordFormValues } from '@lib/validations';
import { useAuthStore } from '@store/index';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token?: string }>();
  const { resetPassword, isLoading, error, clearError } = useAuthStore();

  const {
    control,
    handleSubmit,
    formState: { errors },
    trigger,
    watch,
  } = useForm<ResetPasswordFormValues>({
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const validateField = async <K extends keyof ResetPasswordFormValues>(
    field: K,
    value: ResetPasswordFormValues[K],
  ) => {
    try {
      const shape = resetPasswordSchema.innerType().shape;
      const fieldSchema = shape[field];
      await fieldSchema.parseAsync(value);
      return undefined;
    } catch (err: unknown) {
      const zodError = err as { issues?: Array<{ message: string }> };
      return zodError.issues?.[0]?.message ?? 'Invalid value';
    }
  };

  const onSubmit = async (data: ResetPasswordFormValues) => {
    clearError();
    if (!token) {
      Alert.alert('Invalid Request', 'Reset token is missing. Please request a new password reset link.');
      return;
    }
    const success = await resetPassword(token, data.password);
    if (success) {
      Alert.alert(
        'Password Reset Successful',
        'Your password has been updated. You can now sign in with your new password.',
        [{ text: 'Sign In', onPress: () => router.replace('/(auth)/login') }],
      );
    } else {
      const currentError = useAuthStore.getState().error;
      if (currentError) {
        Alert.alert('Reset Failed', currentError);
      }
    }
  };

  return (
    <AuthScreenContainer
      title="Set New Password"
      subtitle="Choose a strong, unique password that you don't use for any other accounts."
    >
      <View className="gap-5">
        {error && (
          <View className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 mb-2">
            <Text className="text-sm text-red-600 dark:text-red-400">{error}</Text>
          </View>
        )}

        <Controller
          control={control}
          name="password"
          rules={{
            validate: async (v) => await validateField('password', v),
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="New Password"
              placeholder="Create a strong password"
              value={value}
              onChangeText={(text) => {
                onChange(text);
                trigger('password');
                trigger('confirmPassword');
              }}
              onBlur={() => {
                onBlur();
                trigger('password');
              }}
              leftIcon="lock-closed-outline"
              secureTextEntry
              error={errors.password?.message}
              variant="outlined"
              helper="At least 8 chars, 1 uppercase, 1 lowercase, 1 number"
            />
          )}
        />

        <Controller
          control={control}
          name="confirmPassword"
          rules={{
            validate: async (v) => {
              const pwd = watch('password');
              if (v !== pwd) return 'Passwords do not match';
              return await validateField('confirmPassword', v);
            },
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Confirm New Password"
              placeholder="Re-enter your new password"
              value={value}
              onChangeText={(text) => {
                onChange(text);
                trigger('confirmPassword');
              }}
              onBlur={() => {
                onBlur();
                trigger('confirmPassword');
              }}
              leftIcon="lock-closed-outline"
              secureTextEntry
              error={errors.confirmPassword?.message}
              variant="outlined"
            />
          )}
        />

        <Button
          title="Reset Password"
          variant="primary"
          size="lg"
          fullWidth
          loading={isLoading}
          onPress={handleSubmit(onSubmit)}
          leftIcon="refresh-outline"
          className="mt-2"
        />

        <View className="flex-row justify-center items-center gap-1 mt-4">
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text
              className="text-sm font-semibold text-primary-700 dark:text-primary-400 flex-row items-center gap-1">
              ← Back to Sign In
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </AuthScreenContainer>
  );
}
