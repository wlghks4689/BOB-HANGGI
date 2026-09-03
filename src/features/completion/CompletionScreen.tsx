import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { OnboardingLayout } from '../../components/OnboardingLayout';
import { PrimaryButton } from '../../components/PrimaryButton';
import { VALUE_QUESTIONS } from '../../data/valueQuestions';
import { useOnboarding } from '../../store/OnboardingContext';
import { colors, radius, spacing, typography } from '../../theme/tokens';

export function CompletionScreen() {
  const { state, setScreen, reset } = useOnboarding();
  const isValues = state.matchingMode === 'values';
  const tone = isValues ? 'violet' : 'coral';
  const accent = isValues ? colors.violet : colors.coral;

  return (
    <OnboardingLayout
      footer={
        <PrimaryButton
          label="가입 온보딩 완료"
          onPress={() =>
            Alert.alert(
              '온보딩을 완료했어요',
              '추천·피드 화면은 이번 Phase 범위에 포함되지 않아 여기까지 준비되어 있어요.',
            )
          }
          tone={tone}
        />
      }
      scroll
    >
      <View style={styles.hero}>
        <View style={[styles.icon, { backgroundColor: isValues ? colors.violetSoft : colors.coralSoft }]}>
          <Text style={styles.iconText}>{isValues ? '☕' : '⚡'}</Text>
        </View>
        <Text style={[styles.kicker, { color: accent }]}>{isValues ? '20 / 20 · 답변 저장 완료' : '3 / 3 · 프로필 만들기 완료'}</Text>
        <Text style={styles.title}>{isValues ? '답변을 저장했어요.' : '첫인상 프로필을 만들었어요.'}</Text>
        <Text style={styles.description}>
          {isValues
            ? '비슷한 대화 코드와 가치관을 가진 사람을 소개할 때 참고할게요.'
            : '등록한 사진과 취향을 바탕으로 자연스러운 만남을 시작할 준비가 됐어요.'}
        </Text>
      </View>

      <View style={styles.summaryCard}>
        {isValues ? (
          <>
            <SummaryRow label="답변한 질문" value={`${state.valuesProfile.answers.length} / ${VALUE_QUESTIONS.length}`} />
            <SummaryRow label="질문 범위" value="가치관 · 라이프스타일 · 연애관" />
          </>
        ) : (
          <>
            <SummaryRow label="등록한 사진" value={`${state.firstImpressionProfile.photos.length}장`} />
            <SummaryRow label="나의 매력" value={`${state.firstImpressionProfile.charmPoints.length}개`} />
            <SummaryRow label="첫인상 취향" value={`${state.firstImpressionProfile.appearancePreferences.length}개`} />
          </>
        )}
      </View>

      <View style={styles.changeBox}>
        <Text style={styles.changeTitle}>지금 고른 방식은 정체성 테스트 결과가 아니에요.</Text>
        <Text style={styles.changeDescription}>
          오늘의 만남 방식일 뿐이에요. 가입 후에도 내 프로필 → 만남 방식에서 언제든 바꿀 수 있어요.
        </Text>
        <Pressable onPress={() => setScreen('matching_mode')} style={styles.changeButton}>
          <Text style={[styles.changeButtonText, { color: accent }]}>다른 만남 방식 살펴보기</Text>
        </Pressable>
      </View>

      <Pressable
        onPress={reset}
        style={styles.resetButton}
      >
        <Text style={styles.resetText}>테스트 데이터 지우고 처음부터</Text>
      </Pressable>
    </OnboardingLayout>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', paddingTop: 70 },
  icon: { width: 78, height: 78, alignItems: 'center', justifyContent: 'center', borderRadius: 28, marginBottom: 24 },
  iconText: { fontSize: 34 },
  kicker: { fontSize: 12, fontWeight: '900', letterSpacing: 0.3, marginBottom: 12 },
  title: { color: colors.ink, fontFamily: typography.medium, textAlign: 'center', fontSize: 28, lineHeight: 38, fontWeight: '800' },
  description: { color: colors.muted, textAlign: 'center', fontSize: 14, lineHeight: 22, maxWidth: 330, marginTop: 12 },
  summaryCard: { gap: 13, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, backgroundColor: colors.surface, padding: 17, marginTop: spacing.xl },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 16 },
  summaryLabel: { color: colors.muted, fontSize: 12.5 },
  summaryValue: { flex: 1, color: colors.ink, textAlign: 'right', fontSize: 12.5, fontWeight: '700' },
  changeBox: { borderRadius: radius.md, backgroundColor: '#F8F4F7', padding: 16, marginTop: 16 },
  changeTitle: { color: colors.ink, fontSize: 13, fontWeight: '800', lineHeight: 19 },
  changeDescription: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 6 },
  changeButton: { minHeight: 44, alignSelf: 'flex-start', justifyContent: 'center', marginTop: 5 },
  changeButtonText: { fontSize: 12.5, fontWeight: '800' },
  resetButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 8, marginBottom: 12 },
  resetText: { color: colors.subtle, fontSize: 12, textDecorationLine: 'underline' },
});
