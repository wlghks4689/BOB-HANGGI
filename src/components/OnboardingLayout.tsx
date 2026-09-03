import React, { PropsWithChildren } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, FlowTone, spacing, toneColor, typography } from '../theme/tokens';

type Props = PropsWithChildren<{
  title?: string;
  eyebrow?: string;
  step?: { current: number; total: number };
  tone?: FlowTone;
  onBack?: () => void;
  footer?: React.ReactNode;
  scroll?: boolean;
}>;

export function OnboardingLayout({
  title,
  eyebrow,
  step,
  tone = 'coral',
  onBack,
  footer,
  children,
  scroll = true,
}: Props) {
  const accent = toneColor(tone);
  const body = (
    <View style={styles.content}>
      {(title || onBack) && (
        <View style={styles.header}>
          <View style={styles.headerSide}>
            {onBack && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="이전 화면"
                hitSlop={10}
                onPress={onBack}
                style={styles.backButton}
              >
                <Text style={styles.backIcon}>‹</Text>
              </Pressable>
            )}
          </View>
          <Text numberOfLines={1} style={styles.headerTitle}>{title}</Text>
          <View style={styles.headerSide} />
        </View>
      )}

      {(eyebrow || step) && (
        <View style={styles.progressBlock}>
          <View style={styles.progressLabels}>
            <Text style={[styles.eyebrow, { color: accent }]}>{eyebrow}</Text>
            {step && <Text style={styles.stepLabel}>{step.current} / {step.total}</Text>}
          </View>
          {step && (
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { backgroundColor: accent, width: `${(step.current / step.total) * 100}%` },
                ]}
              />
            </View>
          )}
        </View>
      )}

      {children}
    </View>
  );

  return (
    <View style={styles.canvas}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.phone}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboard}
        >
          {scroll ? (
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {body}
            </ScrollView>
          ) : body}
          {footer && <View style={styles.footer}>{footer}</View>}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: { flex: 1, backgroundColor: colors.canvas, alignItems: 'center' },
  phone: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    backgroundColor: colors.background,
    ...Platform.select({
      web: {
        boxShadow: '0 12px 45px rgba(42, 31, 47, 0.10)',
      } as object,
      default: {},
    }),
  },
  keyboard: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  content: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  header: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerSide: { width: 40 },
  backButton: { width: 40, minHeight: 48, justifyContent: 'center' },
  backIcon: { color: colors.ink, fontSize: 38, lineHeight: 38, fontWeight: '300' },
  headerTitle: {
    flex: 1,
    color: colors.ink,
    textAlign: 'center',
    fontFamily: typography.medium,
    fontWeight: '700',
    fontSize: 17,
  },
  progressBlock: { marginTop: 4, marginBottom: spacing.lg },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  eyebrow: { flex: 1, fontFamily: typography.medium, fontSize: 13, fontWeight: '700' },
  stepLabel: { color: colors.muted, fontSize: 13, fontWeight: '700' },
  progressTrack: {
    height: 5,
    backgroundColor: colors.line,
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 13,
  },
  progressFill: { height: '100%', borderRadius: 999 },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'android' ? 12 : 8,
    backgroundColor: colors.background,
  },
});
