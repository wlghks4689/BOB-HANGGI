import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { OnboardingLayout } from '../../components/OnboardingLayout';
import { PrimaryButton } from '../../components/PrimaryButton';
import { VALUE_QUESTIONS } from '../../data/valueQuestions';
import { useOnboarding } from '../../store/OnboardingContext';
import { colors, radius, spacing, typography } from '../../theme/tokens';

export function ValueQuestionScreen() {
  const {
    state,
    setValueAnswer,
    setValueQuestionIndex,
    completeSection,
    setScreen,
  } = useOnboarding();
  const index = Math.min(state.valueQuestionIndex, VALUE_QUESTIONS.length - 1);
  const question = VALUE_QUESTIONS[index];
  const answer = state.valuesProfile.answers.find((item) => item.questionId === question.id);
  const isLast = index === VALUE_QUESTIONS.length - 1;

  const back = () => {
    if (index === 0) {
      setScreen('values_intro');
      return;
    }
    setValueQuestionIndex(index - 1);
  };

  const next = () => {
    if (!answer) return;
    if (isLast) {
      completeSection('values');
      setScreen('complete');
      return;
    }
    setValueQuestionIndex(index + 1);
  };

  return (
    <OnboardingLayout
      eyebrow={`대화로 깊어지는 만남 · ${question.categoryLabel}`}
      footer={
        <PrimaryButton
          disabled={!answer}
          label={isLast ? '답변 저장하고 완료' : '선택 후 다음 질문'}
          onPress={next}
          tone="violet"
        />
      }
      onBack={back}
      step={{ current: index + 1, total: VALUE_QUESTIONS.length }}
      title="가치관 & 내면 프로필"
      tone="violet"
    >
      <View style={styles.headingRow}>
        <View style={styles.categoryPill}>
          <Text style={styles.categoryPillText}>{question.categoryLabel}</Text>
        </View>
        <Text style={styles.savedCount}>저장 {state.valuesProfile.answers.length} / {VALUE_QUESTIONS.length}</Text>
      </View>

      <Text style={styles.title}>{headlineFor(index)}</Text>
      <Text style={styles.description}>정답은 없어요. 지금의 나와 가장 가까운 답을 골라주세요.</Text>

      <View style={styles.questionCard}>
        <Text style={styles.questionMeta}>{question.emoji} 질문 {String(index + 1).padStart(2, '0')} · {question.topic}</Text>
        <Text style={styles.question}>{question.question}</Text>
      </View>

      <View style={styles.options}>
        {question.options.map((option) => {
          const selected = answer?.optionId === option.id;
          return (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              key={option.id}
              onPress={() => setValueAnswer({ questionId: question.id, optionId: option.id })}
              style={({ pressed }) => [
                styles.option,
                selected && styles.optionSelected,
                pressed && styles.optionPressed,
              ]}
            >
              <View style={[styles.radio, selected && styles.radioSelected]}>
                {selected && <View style={styles.radioDot} />}
              </View>
              <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </OnboardingLayout>
  );
}

function headlineFor(index: number) {
  if (index === 0) return '대화 코드와 가치관이 맞는 사람을 찾아드릴게요.';
  if (index === 5) return '이제 평소의 라이프스타일을 알아볼게요.';
  if (index === 13) return '마지막으로, 편안한 연애의 모습을 알려주세요.';
  if (index === 19) return '거의 다 됐어요! 우리가 원하는 관계를 그려볼게요.';
  return '조금 더 서로를 잘 소개하기 위한 질문이에요.';
}

const styles = StyleSheet.create({
  headingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  categoryPill: { borderRadius: radius.pill, backgroundColor: colors.violetSoft, paddingHorizontal: 12, paddingVertical: 7 },
  categoryPillText: { color: colors.violet, fontSize: 12, fontWeight: '800' },
  savedCount: { color: colors.subtle, fontSize: 11.5, fontWeight: '600' },
  title: { color: colors.ink, fontFamily: typography.medium, fontSize: 23, lineHeight: 32, fontWeight: '800', marginTop: 15 },
  description: { color: colors.muted, fontSize: 12.5, lineHeight: 19, marginTop: 8 },
  questionCard: { borderWidth: 2, borderColor: colors.violet, borderRadius: radius.md, backgroundColor: colors.surface, padding: 18, marginTop: spacing.lg },
  questionMeta: { color: colors.violet, fontSize: 12, fontWeight: '800', marginBottom: 13 },
  question: { color: colors.ink, fontSize: 18, lineHeight: 27, fontWeight: '800', letterSpacing: -0.2 },
  options: { gap: 10, marginTop: 18, paddingBottom: spacing.md },
  option: { minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, backgroundColor: colors.surface, paddingHorizontal: 16, paddingVertical: 11 },
  optionSelected: { borderColor: colors.violet, backgroundColor: colors.violetSoft },
  optionPressed: { opacity: 0.78 },
  radio: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center', borderRadius: 11, borderWidth: 2, borderColor: colors.line },
  radioSelected: { borderColor: colors.violet },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.violet },
  optionText: { flex: 1, color: colors.muted, fontSize: 14, lineHeight: 20 },
  optionTextSelected: { color: colors.violet, fontWeight: '700' },
});
