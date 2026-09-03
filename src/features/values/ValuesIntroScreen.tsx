import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { DeveloperNote } from '../../components/DeveloperNote';
import { OnboardingLayout } from '../../components/OnboardingLayout';
import { PrimaryButton } from '../../components/PrimaryButton';
import { VALUE_QUESTIONS } from '../../data/valueQuestions';
import { useOnboarding } from '../../store/OnboardingContext';
import { colors, radius, spacing, typography } from '../../theme/tokens';

export function ValuesIntroScreen() {
  const { setScreen, setValueQuestionIndex } = useOnboarding();

  return (
    <OnboardingLayout
      eyebrow="대화로 깊어지는 만남 · 프로필 만들기"
      footer={
        <PrimaryButton
          label="진지모드 Q&A 시작하기"
          onPress={() => {
            setValueQuestionIndex(0);
            setScreen('values_question');
          }}
          tone="violet"
        />
      }
      onBack={() => setScreen('verification')}
      title="가치관 & 내면 프로필"
      tone="violet"
    >
      <View style={styles.heroIcon}>
        <Text style={styles.heroEmoji}>☕</Text>
      </View>
      <Text style={styles.title}>대화 코드, 가치관이 맞는{`\n`}사람을 찾아봅시다!</Text>
      <Text style={styles.description}>
        서로 어떤 생각을 가지고 살아가는지, 어떤 관계를 원하는지 조금 더 알아볼게요.
      </Text>

      <View style={styles.note}>
        <DeveloperNote tone="violet">
          가치관 & 내면 고르신 분들은{`\n`}여기서부터 잠깐 진지모드 Q&A 갑시다 ^^ {`\n`}너무 오래 걸리지는 않게 준비했습니다.
        </DeveloperNote>
      </View>

      <View style={styles.summary}>
        <SummaryItem count="5" label="가치관" />
        <View style={styles.divider} />
        <SummaryItem count="8" label="라이프스타일" />
        <View style={styles.divider} />
        <SummaryItem count="7" label="연애관" />
      </View>
      <Text style={styles.summaryCaption}>
        총 {VALUE_QUESTIONS.length}문항 · 정답이나 점수는 없어요 · 언제든 수정 가능
      </Text>
    </OnboardingLayout>
  );
}

function SummaryItem({ count, label }: { count: string; label: string }) {
  return (
    <View style={styles.summaryItem}>
      <Text style={styles.summaryCount}>{count}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  heroIcon: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: colors.violetSoft, marginTop: 6, marginBottom: 18 },
  heroEmoji: { fontSize: 29 },
  title: { color: colors.ink, fontFamily: typography.medium, fontSize: 26, lineHeight: 36, fontWeight: '800' },
  description: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 11 },
  note: { marginTop: spacing.xl },
  summary: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, paddingVertical: 18, marginTop: spacing.lg },
  summaryItem: { flex: 1, alignItems: 'center', gap: 4 },
  summaryCount: { color: colors.violet, fontSize: 20, fontWeight: '900' },
  summaryLabel: { color: colors.muted, fontSize: 11.5 },
  divider: { width: 1, height: 28, backgroundColor: colors.line },
  summaryCaption: { color: colors.subtle, textAlign: 'center', fontSize: 11, marginTop: 10 },
});
