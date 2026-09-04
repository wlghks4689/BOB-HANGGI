import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { OnboardingLayout } from '../../components/OnboardingLayout';
import { PrimaryButton } from '../../components/PrimaryButton';
import { MatchingMode } from '../../model/onboarding';
import { useOnboarding } from '../../store/OnboardingContext';
import { colors, radius, spacing, typography } from '../../theme/tokens';

const choices: Array<{
  id: MatchingMode;
  emoji: string;
  title: string;
  description: string;
  soft: string;
}> = [
  {
    id: 'first_impression',
    emoji: '⚡',
    title: '첫눈에 끌리는 만남',
    description: '처음 느껴지는 분위기와 스타일도 중요한 만남의 시작이라고 생각해요.',
    soft: colors.coralSoft,
  },
  {
    id: 'values',
    emoji: '☕',
    title: '대화로 깊어지는 만남',
    description: '어떤 이야기가 통하는지 알아보는 것부터 만남을 시작하고 싶어요.',
    soft: colors.violetSoft,
  },
];

export function MatchingModeScreen() {
  const { state, setMatchingMode, setScreen, completeSection } = useOnboarding();

  const continueFlow = () => {
    if (!state.matchingMode) return;
    completeSection('matching_mode');
    setScreen('basic_info');
  };

  return (
    <OnboardingLayout
      footer={
        <PrimaryButton
          disabled={!state.matchingMode}
          label="선택하고 시작하기"
          onPress={continueFlow}
        />
      }
    >
      <View style={styles.intro}>
        <Text style={styles.brand}>무지개색의 남녀</Text>
        <Text style={styles.title}>어떤 만남으로{`\n`}시작하시겠어요?</Text>
        <Text style={styles.description}>
          지금 더 끌리는 시작을 골라주세요.{`\n`}두 방식 모두 좋은 만남으로 이어질 수 있어요.
        </Text>
        <View style={styles.changeableNote}>
          <Text style={styles.changeableIcon}>↻</Text>
          <Text style={styles.changeableText}>가입 후에도 내 프로필에서 언제든 변경할 수 있어요.</Text>
        </View>
      </View>

      <View style={styles.choices}>
        {choices.map((choice) => {
          const selected = state.matchingMode === choice.id;
          const accent = choice.id === 'first_impression' ? colors.coral : colors.violet;
          return (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              key={choice.id}
              onPress={() => setMatchingMode(choice.id)}
              style={({ pressed }) => [
                styles.card,
                selected && { borderColor: accent, backgroundColor: `${choice.soft}99` },
                pressed && styles.pressed,
              ]}
            >
              <View style={[styles.emojiBox, { backgroundColor: choice.soft }]}>
                <Text style={styles.emoji}>{choice.emoji}</Text>
              </View>
              <View style={styles.cardCopy}>
                <Text style={styles.cardTitle}>{choice.title}</Text>
                <Text style={styles.cardDescription}>{choice.description}</Text>
              </View>
              <View style={[styles.radio, selected && { borderColor: accent }]}>
                {selected && <View style={[styles.radioDot, { backgroundColor: accent }]} />}
              </View>
            </Pressable>
          );
        })}
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  intro: { paddingTop: spacing.xl },
  brand: { color: colors.coral, fontSize: 13, fontWeight: '800', marginBottom: 14 },
  title: {
    color: colors.ink,
    fontFamily: typography.medium,
    fontSize: 30,
    lineHeight: 40,
    fontWeight: '800',
    letterSpacing: -0.7,
  },
  description: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: 14 },
  changeableNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 22,
    paddingHorizontal: 13,
    paddingVertical: 11,
    borderRadius: radius.sm,
    backgroundColor: '#F8F4F7',
  },
  changeableIcon: { color: colors.coral, fontSize: 17, fontWeight: '700' },
  changeableText: { flex: 1, color: colors.muted, fontSize: 12, lineHeight: 17 },
  choices: { gap: 12, marginTop: spacing.xl, paddingBottom: spacing.lg },
  card: {
    minHeight: 132,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    padding: 16,
  },
  pressed: { opacity: 0.78 },
  emojiBox: { width: 58, height: 68, alignItems: 'center', justifyContent: 'center', borderRadius: 18 },
  emoji: { fontSize: 26 },
  cardCopy: { flex: 1 },
  cardTitle: { color: colors.ink, fontSize: 16, fontWeight: '800', marginBottom: 7 },
  cardDescription: { color: colors.muted, fontSize: 12.5, lineHeight: 18 },
  radio: {
    width: 22,
    height: 22,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  radioDot: { width: 12, height: 12, borderRadius: 6 },
});
