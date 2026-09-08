import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { AuthScreenContainer } from '@components/ui/Screen';
import { Input } from '@components/ui/Input';
import Button from '@components/ui/Button';
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '@lib/validations';
import { useAuthStore } from '@store/index';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { forgotPassword, isLoading, error, clearError } = useAuthStore();

  const {
    control,
    handleSubmit,
    formState: { errors },
    trigger,
  } = useForm<ForgotPasswordFormValues>({
    defaultValues: {
      email: '',
    },
  });

  const validateField = async <K extends keyof ForgotPasswordFormValues>(
    field: K,
    value: ForgotPasswordFormValues[K],
  ) => {
    try {
      const shape = forgotPasswordSchema.shape;
      const fieldSchema = shape[field];
      await fieldSchema.parseAsync(value);
      return undefined;
    } catch (err: unknown) {
      const zodError = err as { issues?: Array<{ message: string }> };
      return zodError.issues?.[0]?.message ?? 'Invalid value';
    }
  };

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    clearError();
    const success = await forgotPassword(data.email);
    if (success) {
      Alert.alert(
        'Reset Link Sent',
        'If an account exists with this email, you will receive a password reset link shortly.',
        [{ text: 'Back to Login', onPress: () => router.replace('/(auth)/login') }],
      );
    } else {
      const currentError = useAuthStore.getState().error;
      if (currentError) {
        Alert.alert('Request Failed', currentError);
      }
    }
  };

  return (
    <AuthScreenContainer
      title="Reset Password"
      subtitle="Enter your email address and we'll send you a link to reset your password."
    >
      <View className="gap-5">
        {error && (
          <View className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 mb-2">
            <Text className="text-sm text-red-600 dark:text-red-400">{error}</Text>
          </View>
        )}

        <Controller
          control={control}
          name="email"
          rules={{
            validate: async (v) => await validateField('email', v),
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Email Address"
              placeholder="you@example.com"
              value={value}
              onChangeText={(text) => {
                onChange(text);
                trigger('email');
              }}
              onBlur={() => {
                onBlur();
                trigger('email');
              }}
              leftIcon="mail-outline"
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email?.message}
              variant="outlined"
            />
          )}
        />

        <Button
          title="Send Reset Link"
          variant="primary"
          size="lg"
          fullWidth
          loading={isLoading}
          onPress={handleSubmit(onSubmit)}
          leftIcon="mail-unread-outline"
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
