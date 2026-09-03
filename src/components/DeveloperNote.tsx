import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, FlowTone, radius, toneColor, toneSoftColor, typography } from '../theme/tokens';

type Props = {
  children: React.ReactNode;
  tone?: FlowTone;
};

export function DeveloperNote({ children, tone = 'coral' }: Props) {
  const accent = toneColor(tone);
  return (
    <View style={[styles.container, { backgroundColor: toneSoftColor(tone), borderColor: `${accent}3D` }]}>
      <Text style={[styles.eyebrow, { color: accent }]}>✎ 개발자 한마디</Text>
      <Text style={styles.body}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    transform: [{ rotate: '-0.35deg' }],
  },
  eyebrow: {
    fontFamily: typography.note,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  body: {
    color: colors.ink,
    fontFamily: typography.note,
    fontSize: 14,
    lineHeight: 21,
  },
});
