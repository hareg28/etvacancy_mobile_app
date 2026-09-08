import { View, Text } from 'react-native';

interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  thickness?: number;
  color?: string;
  className?: string;
  styleClass?: string;
  margin?: number;
}

export function Divider({
  orientation = 'horizontal',
  thickness = 1,
  className = '',
  styleClass = '',
  margin,
}: DividerProps) {
  const combinedClass = `${className} ${styleClass}`.trim();
  if (orientation === 'horizontal') {
    return (
      <View
        className={`bg-gray-200 dark:bg-neutral-700 w-full ${combinedClass}`}
        style={{
          height: thickness,
          marginTop: margin,
          marginBottom: margin,
        }}
      />
    );
  }
  return (
    <View
      className={`bg-gray-200 dark:bg-neutral-700 h-full ${combinedClass}`}
      style={{
        width: thickness,
        marginLeft: margin,
        marginRight: margin,
      }}
    />
  );
}

interface DividerWithTextProps {
  text: string;
  color?: string;
  textClassName?: string;
  lineClassName?: string;
}

export function DividerWithText({
  text,
  textClassName = '',
  lineClassName = '',
}: DividerWithTextProps) {
  return (
    <View className="flex-row items-center gap-4 my-4">
      <View className={`flex-1 h-[1px] bg-gray-200 dark:bg-neutral-700 ${lineClassName}`} />
      <Text
        className={`text-sm text-gray-500 dark:text-gray-400 font-medium ${textClassName}`}
        style={{ includeFontPadding: false }}
      >
        {text}
      </Text>
      <View className={`flex-1 h-[1px] bg-gray-200 dark:bg-neutral-700 ${lineClassName}`} />
    </View>
  );
}

export default Divider;
