import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { OnboardingLayout } from '../../components/OnboardingLayout';
import { PrimaryButton } from '../../components/PrimaryButton';
import { TagSelector } from '../../components/TagSelector';
import { CHARM_POINTS, FIRST_IMPRESSION_PROFILE_LABEL } from '../../data/profileOptions';
import { useOnboarding } from '../../store/OnboardingContext';
import { colors, radius, spacing, typography } from '../../theme/tokens';

export function CharmPointsScreen() {
  const { state, updateFirstImpression, setScreen } = useOnboarding();
  const profile = state.firstImpressionProfile;

  return (
    <OnboardingLayout
      eyebrow="첫눈에 끌리는 만남 · 프로필 만들기"
      footer={
        <PrimaryButton
          disabled={profile.charmPoints.length === 0}
          label="선택하고 다음으로"
          onPress={() => setScreen('first_preferences')}
        />
      }
      onBack={() => setScreen('first_photos')}
      step={{ current: 2, total: 3 }}
      title={FIRST_IMPRESSION_PROFILE_LABEL}
    >
      <Text style={styles.title}>나의 매력 포인트는?</Text>
      <Text style={styles.description}>스스로 생각했을 때 나에게 가장 눈에 띄는 매력을 골라주세요.</Text>

      <View style={styles.selector}>
        <TagSelector
          custom={profile.customCharmPoints}
          onChange={(selected, custom) => updateFirstImpression('charms', selected, custom)}
          options={CHARM_POINTS}
          selected={profile.charmPoints}
        />
      </View>

      <View style={styles.info}>
        <Text style={styles.infoText}>선택한 매력은 내 프로필에 자연스럽게 표시돼요.</Text>
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.ink, fontFamily: typography.medium, fontSize: 27, lineHeight: 36, fontWeight: '800' },
  description: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 9 },
  selector: { marginTop: spacing.lg },
  info: { borderRadius: radius.sm, backgroundColor: '#F8F4F7', padding: 13, marginTop: 24 },
  infoText: { color: colors.muted, fontSize: 12, lineHeight: 18 },
});
