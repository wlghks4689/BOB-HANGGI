import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { DeveloperNote } from '../../components/DeveloperNote';
import { OnboardingLayout } from '../../components/OnboardingLayout';
import { PrimaryButton } from '../../components/PrimaryButton';
import { TagSelector } from '../../components/TagSelector';
import { APPEARANCE_PREFERENCES, FIRST_IMPRESSION_PROFILE_LABEL } from '../../data/profileOptions';
import { useOnboarding } from '../../store/OnboardingContext';
import { colors, spacing, typography } from '../../theme/tokens';

export function AppearancePreferencesScreen() {
  const { state, updateFirstImpression, completeSection, setScreen } = useOnboarding();
  const profile = state.firstImpressionProfile;

  const complete = () => {
    completeSection('first_impression');
    setScreen('complete');
  };

  return (
    <OnboardingLayout
      eyebrow="첫눈에 끌리는 만남 · 프로필 만들기"
      footer={
        <PrimaryButton
          disabled={profile.appearancePreferences.length === 0}
          label="프로필 만들기 완료"
          onPress={complete}
        />
      }
      onBack={() => setScreen('first_charms')}
      step={{ current: 3, total: 3 }}
      title={FIRST_IMPRESSION_PROFILE_LABEL}
    >
      <Text style={styles.title}>이성을 볼 때 가장{`\n`}중요하게 생각하는 것!</Text>
      <Text style={styles.description}>처음 만났을 때 자연스럽게 눈길이 가는 요소를 골라주세요.</Text>

      <View style={styles.note}>
        <DeveloperNote>
          취향은 취향이니까 솔직하게 갑시다.{`\n`}대신 사람을 하나의 조건으로만 판단하지는 말기로 해요 :)
        </DeveloperNote>
      </View>

      <View style={styles.selector}>
        <TagSelector
          custom={profile.customAppearancePreferences}
          customPlaceholder="예: 안경이 잘 어울리는 사람"
          customPrompt="내가 끌리는 분위기를 입력해주세요."
          onChange={(selected, custom) => updateFirstImpression('preferences', selected, custom)}
          options={APPEARANCE_PREFERENCES}
          selected={profile.appearancePreferences}
        />
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.ink, fontFamily: typography.medium, fontSize: 25, lineHeight: 35, fontWeight: '800' },
  description: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 9 },
  note: { marginTop: spacing.lg },
  selector: { marginTop: spacing.lg, paddingBottom: spacing.md },
});
