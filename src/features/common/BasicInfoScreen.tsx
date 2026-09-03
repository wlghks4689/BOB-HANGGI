import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { OnboardingLayout } from '../../components/OnboardingLayout';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Gender } from '../../model/onboarding';
import { useOnboarding } from '../../store/OnboardingContext';
import { colors, radius, spacing, typography } from '../../theme/tokens';
import { isValidBirthDate } from '../../utils/validation';

const genderOptions: Array<{ value: Gender; label: string }> = [
  { value: 'male', label: '남성' },
  { value: 'female', label: '여성' },
  { value: 'undisclosed', label: '선택 안 함' },
];

export function BasicInfoScreen() {
  const { state, updateUserProfile, completeSection, setScreen } = useOnboarding();
  const [showErrors, setShowErrors] = useState(false);
  const profile = state.userProfile;
  const valid = useMemo(
    () =>
      profile.nickname.trim().length >= 2 &&
      isValidBirthDate(profile.birthDate) &&
      Boolean(profile.gender) &&
      profile.region.trim().length >= 2,
    [profile],
  );

  const next = () => {
    if (!valid) {
      setShowErrors(true);
      return;
    }
    completeSection('basic_info');
    setScreen('verification');
  };

  return (
    <OnboardingLayout
      eyebrow="공통 가입 단계 · 기본정보"
      footer={<PrimaryButton label="다음 단계로" onPress={next} />}
      onBack={() => setScreen('matching_mode')}
      step={{ current: 1, total: 2 }}
      title="가입하기"
    >
      <Text style={styles.title}>기본 정보를{`\n`}입력해 주세요.</Text>
      <Text style={styles.description}>
        지금은 가입에 필요한 정보만 받아요. 공개 범위는 프로필 설정에서 따로 관리할 수 있게 연결할 예정이에요.
      </Text>

      <View style={styles.form}>
        <Field label="이름 또는 닉네임">
          <TextInput
            autoCapitalize="none"
            maxLength={20}
            onChangeText={(nickname) => updateUserProfile({ nickname })}
            placeholder="어떻게 불러드릴까요?"
            placeholderTextColor={colors.subtle}
            style={styles.input}
            value={profile.nickname}
          />
        </Field>
        <Field label="생년월일">
          <TextInput
            keyboardType="numbers-and-punctuation"
            maxLength={10}
            onChangeText={(birthDate) => updateUserProfile({ birthDate })}
            placeholder="예: 1997. 08. 08"
            placeholderTextColor={colors.subtle}
            style={styles.input}
            value={profile.birthDate}
          />
        </Field>
        <Field label="성별">
          <View style={styles.segmentRow}>
            {genderOptions.map((option) => {
              const selected = profile.gender === option.value;
              return (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  key={option.value}
                  onPress={() => updateUserProfile({ gender: option.value })}
                  style={[styles.segment, selected && styles.segmentSelected]}
                >
                  <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Field>
        <Field label="거주지역">
          <TextInput
            maxLength={30}
            onChangeText={(region) => updateUserProfile({ region })}
            placeholder="예: 서울 · 마포구"
            placeholderTextColor={colors.subtle}
            style={styles.input}
            value={profile.region}
          />
        </Field>
      </View>

      {showErrors && !valid && (
        <Text accessibilityRole="alert" style={styles.error}>
          입력하지 않은 항목이 있거나 생년월일 형식이 맞지 않아요.
        </Text>
      )}
    </OnboardingLayout>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.ink, fontFamily: typography.medium, fontSize: 25, lineHeight: 34, fontWeight: '800' },
  description: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 10 },
  form: { gap: 14, marginTop: spacing.lg },
  field: { gap: 7 },
  label: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  input: {
    minHeight: 54,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    color: colors.ink,
    fontSize: 15,
    paddingHorizontal: 14,
  },
  segmentRow: { flexDirection: 'row', gap: 8 },
  segment: {
    flex: 1,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    paddingHorizontal: 4,
  },
  segmentSelected: { borderColor: colors.coral, backgroundColor: colors.coralSoft },
  segmentText: { color: colors.muted, fontSize: 13 },
  segmentTextSelected: { color: colors.coral, fontWeight: '800' },
  error: {
    color: colors.warning,
    backgroundColor: colors.coralSoft,
    borderRadius: radius.sm,
    padding: 12,
    marginTop: 16,
    fontSize: 12,
    lineHeight: 18,
  },
});
