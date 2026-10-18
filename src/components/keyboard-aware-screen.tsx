import type { PropsWithChildren } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

type KeyboardAwareScreenProps = PropsWithChildren<{
  /** Style for the outer ScrollView. */
  style?: StyleProp<ViewStyle>;
  /** Style for the inner content container. */
  contentContainerStyle?: StyleProp<ViewStyle>;
}>;

/**
 * Drop-in wrapper for screens that contain input fields.
 *
 * Replaces the common pattern of `ScrollView` + `KeyboardAvoidingView`
 * (and the fragile `keyboardVerticalOffset` hacks that come with it).
 *
 * Usage:
 * ```tsx
 * <KeyboardAwareScreen contentContainerStyle={{ padding: 16 }}>
 *   ...fields...
 * </KeyboardAwareScreen>
 * ```
 */
export function KeyboardAwareScreen({
  children,
  style,
  contentContainerStyle,
}: KeyboardAwareScreenProps) {
  return (
    <KeyboardAwareScrollView
      style={style}
      contentContainerStyle={[{ flexGrow: 1 }, contentContainerStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </KeyboardAwareScrollView>
  );
}
