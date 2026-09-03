import React, { useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { MAX_CUSTOM_TAG_LENGTH, MAX_TAG_SELECTION } from '../data/profileOptions';
import { colors, FlowTone, radius, toneColor, toneSoftColor, typography } from '../theme/tokens';
import { PrimaryButton } from './PrimaryButton';

type Props = {
  options: readonly string[];
  selected: string[];
  custom: string[];
  onChange: (selected: string[], custom: string[]) => void;
  tone?: FlowTone;
  max?: number;
  customPrompt?: string;
  customPlaceholder?: string;
};

export function TagSelector({
  options,
  selected,
  custom,
  onChange,
  tone = 'coral',
  max = MAX_TAG_SELECTION,
  customPrompt = '나만의 매력 포인트를 입력해주세요.',
  customPlaceholder = '예: 보조개가 있어요',
}: Props) {
  const [modalVisible, setModalVisible] = useState(false);
  const [draft, setDraft] = useState('');
  const accent = toneColor(tone);

  const toggle = (tag: string) => {
    if (selected.includes(tag)) {
      onChange(selected.filter((item) => item !== tag), custom);
      return;
    }
    if (selected.length >= max) {
      Alert.alert('최대 선택 개수', `최대 ${max}개까지 선택할 수 있어요.`);
      return;
    }
    onChange([...selected, tag], custom);
  };

  const addCustom = () => {
    const value = draft.trim();
    if (!value) return;
    if (selected.includes(value)) {
      Alert.alert('이미 추가한 항목이에요');
      return;
    }
    if (selected.length >= max) {
      Alert.alert('최대 선택 개수', `최대 ${max}개까지 선택할 수 있어요.`);
      return;
    }
    onChange([...selected, value], [...custom, value]);
    setDraft('');
    setModalVisible(false);
  };

  return (
    <>
      <View style={styles.counterRow}>
        <Text style={styles.counter}>선택 {selected.length} / {max}</Text>
      </View>
      <View style={styles.tags}>
        {[...options, ...custom].map((tag) => {
          const active = selected.includes(tag);
          return (
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: active }}
              key={tag}
              onPress={() => toggle(tag)}
              style={[
                styles.tag,
                active && { borderColor: accent, backgroundColor: toneSoftColor(tone) },
              ]}
            >
              <Text style={[styles.tagText, active && { color: accent, fontWeight: '700' }]}>
                {active ? '✓ ' : ''}{tag}
              </Text>
            </Pressable>
          );
        })}
        <Pressable
          accessibilityRole="button"
          onPress={() => setModalVisible(true)}
          style={[styles.tag, styles.customTag, { borderColor: accent }]}
        >
          <Text style={[styles.tagText, { color: accent, fontWeight: '700' }]}>＋ 직접 입력</Text>
        </Pressable>
      </View>

      <Modal
        animationType="fade"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.scrim} onPress={() => setModalVisible(false)}>
          <Pressable style={styles.dialog} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.dialogTitle}>{customPrompt}</Text>
            <Text style={styles.dialogDescription}>짧고 자연스러운 문장으로 적어주세요.</Text>
            <TextInput
              autoFocus
              maxLength={MAX_CUSTOM_TAG_LENGTH}
              onChangeText={setDraft}
              onSubmitEditing={addCustom}
              placeholder={customPlaceholder}
              placeholderTextColor={colors.subtle}
              returnKeyType="done"
              style={[styles.input, { borderColor: draft ? accent : colors.line }]}
              value={draft}
            />
            <Text style={styles.length}>{draft.length} / {MAX_CUSTOM_TAG_LENGTH}</Text>
            <PrimaryButton
              disabled={!draft.trim()}
              label="추가하기"
              onPress={addCustom}
              tone={tone}
              style={styles.dialogButton}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  counterRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 10 },
  counter: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  tag: {
    minHeight: 44,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  customTag: { borderStyle: 'dashed', backgroundColor: 'transparent' },
  tagText: { color: colors.muted, fontFamily: typography.regular, fontSize: 14, lineHeight: 20 },
  scrim: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(31, 25, 35, 0.42)',
  },
  dialog: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    padding: 22,
  },
  dialogTitle: { color: colors.ink, fontSize: 19, lineHeight: 27, fontWeight: '800' },
  dialogDescription: { color: colors.muted, fontSize: 13, marginTop: 6, marginBottom: 18 },
  input: {
    minHeight: 54,
    borderWidth: 1,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    color: colors.ink,
    fontSize: 16,
    paddingHorizontal: 14,
  },
  length: { color: colors.subtle, textAlign: 'right', fontSize: 12, marginTop: 6 },
  dialogButton: { marginTop: 16 },
});
