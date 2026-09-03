import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { OnboardingLayout } from '../../components/OnboardingLayout';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useOnboarding } from '../../store/OnboardingContext';
import { colors, radius, spacing, typography } from '../../theme/tokens';
import { isValidPhoneNumber } from '../../utils/validation';

const MOCK_CODE = '123456';

export function VerificationScreen() {
  const { state, updateVerification, completeSection, setScreen } = useOnboarding();
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const verification = state.verification;

  const sendCode = () => {
    if (!isValidPhoneNumber(verification.phoneNumber)) {
      Alert.alert('휴대폰 번호를 확인해주세요', '숫자 10~11자리로 입력해주세요.');
      return;
    }
    updateVerification({ codeSent: true, verified: false });
    setCode('');
    setCodeError('');
  };

  const confirmCode = () => {
    if (code !== MOCK_CODE) {
      setCodeError('Mock 인증번호 123456을 입력해주세요.');
      return;
    }
    updateVerification({ verified: true });
    setCodeError('');
  };

  const next = () => {
    if (!verification.verified || !state.matchingMode) return;
    completeSection('verification');
    setScreen(state.matchingMode === 'first_impression' ? 'first_photos' : 'values_intro');
  };

  return (
    <OnboardingLayout
      eyebrow="공통 가입 단계 · 본인인증"
      footer={
        <PrimaryButton
          disabled={!verification.verified}
          label="인증 완료하고 다음으로"
          onPress={next}
        />
      }
      onBack={() => setScreen('basic_info')}
      step={{ current: 2, total: 2 }}
      title="본인 인증"
    >
      <Text style={styles.title}>안전하고 신뢰할 수 있는{`\n`}만남을 위해 인증해 주세요.</Text>
      <Text style={styles.description}>실제 SMS 연결 전 단계라 현재는 테스트용 Mock 인증으로 동작해요.</Text>

      <View style={styles.mockBadge}>
        <Text style={styles.mockBadgeTitle}>DEMO · MOCK SMS</Text>
        <Text style={styles.mockBadgeText}>번호 전송 후 인증번호 {MOCK_CODE}을 입력해 주세요.</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>휴대폰 번호</Text>
        <View style={styles.row}>
          <TextInput
            accessibilityLabel="휴대폰 번호"
            keyboardType="phone-pad"
            maxLength={13}
            onChangeText={(phoneNumber) =>
              updateVerification({ phoneNumber, codeSent: false, verified: false })
            }
            placeholder="010-1234-5678"
            placeholderTextColor={colors.subtle}
            style={[styles.input, styles.flexInput]}
            value={verification.phoneNumber}
          />
          <Pressable onPress={sendCode} style={styles.sendButton}>
            <Text style={styles.sendButtonText}>{verification.codeSent ? '다시 전송' : '번호 전송'}</Text>
          </Pressable>
        </View>

        <Text style={styles.label}>인증번호 6자리</Text>
        <View style={styles.row}>
          <TextInput
            accessibilityLabel="인증번호"
            editable={verification.codeSent && !verification.verified}
            keyboardType="number-pad"
            maxLength={6}
            onChangeText={setCode}
            placeholder={verification.codeSent ? '인증번호 입력' : '먼저 번호를 전송해주세요'}
            placeholderTextColor={colors.subtle}
            style={[styles.input, styles.flexInput, !verification.codeSent && styles.disabledInput]}
            value={code}
          />
          <Pressable
            disabled={!verification.codeSent || verification.verified}
            onPress={confirmCode}
            style={[
              styles.confirmButton,
              (!verification.codeSent || verification.verified) && styles.disabledButton,
            ]}
          >
            <Text style={styles.confirmButtonText}>{verification.verified ? '확인 완료' : '인증 확인'}</Text>
          </Pressable>
        </View>
        {!!codeError && <Text accessibilityRole="alert" style={styles.error}>{codeError}</Text>}
      </View>

      <View style={styles.privacyBox}>
        <Text style={styles.privacyText}>✓ 실제 연결 시 가입 여부 확인에만 사용</Text>
        <Text style={styles.privacyText}>✓ 개인 휴대폰 번호는 다른 사용자에게 공개하지 않음</Text>
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.ink, fontFamily: typography.medium, fontSize: 24, lineHeight: 33, fontWeight: '800' },
  description: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 10 },
  mockBadge: {
    borderRadius: radius.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#D8C9E8',
    backgroundColor: colors.violetSoft,
    padding: 12,
    marginTop: spacing.lg,
  },
  mockBadgeTitle: { color: colors.violet, fontSize: 11, fontWeight: '900', letterSpacing: 0.6 },
  mockBadgeText: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 3 },
  form: { marginTop: spacing.lg, gap: 8 },
  label: { color: colors.muted, fontSize: 12, fontWeight: '700', marginTop: 5 },
  row: { flexDirection: 'row', gap: 8 },
  input: {
    minHeight: 54,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    color: colors.ink,
    fontSize: 14,
    paddingHorizontal: 13,
  },
  flexInput: { flex: 1 },
  disabledInput: { backgroundColor: '#F4F1F4' },
  sendButton: {
    minWidth: 92,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    backgroundColor: colors.ink,
    paddingHorizontal: 10,
  },
  sendButtonText: { color: colors.surface, fontSize: 13, fontWeight: '800' },
  confirmButton: {
    minWidth: 92,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    backgroundColor: colors.coral,
    paddingHorizontal: 10,
  },
  disabledButton: { backgroundColor: colors.line },
  confirmButtonText: { color: colors.surface, fontSize: 13, fontWeight: '800' },
  error: { color: colors.warning, fontSize: 12, lineHeight: 17 },
  privacyBox: { gap: 7, borderRadius: radius.sm, backgroundColor: '#F8F4F7', padding: 14, marginTop: 20 },
  privacyText: { color: colors.muted, fontSize: 12, lineHeight: 17 },
});
