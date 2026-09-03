import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { OnboardingLayout } from '../../components/OnboardingLayout';
import { PrimaryButton } from '../../components/PrimaryButton';
import { FIRST_IMPRESSION_PROFILE_LABEL } from '../../data/profileOptions';
import { ProfilePhoto } from '../../model/onboarding';
import { useOnboarding } from '../../store/OnboardingContext';
import { colors, radius, spacing, typography } from '../../theme/tokens';

export function PhotoUploadScreen() {
  const { state, setPhotos, setScreen } = useOnboarding();
  const [managedPhoto, setManagedPhoto] = useState<ProfilePhoto | null>(null);
  const photos = state.firstImpressionProfile.photos;
  const primary = photos.find((photo) => photo.isPrimary);
  const extras = photos.filter((photo) => !photo.isPrimary);
  const slots = useMemo(() => [primary, extras[0], extras[1]], [primary, extras]);

  const addAsset = (asset: ImagePicker.ImagePickerAsset, slotIndex: number, replaceId?: string) => {
    const replacing = photos.find((photo) => photo.id === replaceId);
    const newPhoto: ProfilePhoto = {
      id: replaceId ?? `local_${Date.now()}_${slotIndex}`,
      localUri: asset.uri,
      fileName: asset.fileName ?? undefined,
      mimeType: asset.mimeType ?? undefined,
      width: asset.width,
      height: asset.height,
      isPrimary: replacing?.isPrimary ?? slotIndex === 0,
    };
    const withoutOld = photos.filter((photo) => photo.id !== replaceId);
    setPhotos([...withoutOld, newPhoto].slice(0, 3));
  };

  const pickPhoto = async (slotIndex: number, replaceId?: string) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('사진 접근 권한이 필요해요', '기기 설정에서 사진 접근을 허용한 뒤 다시 시도해주세요.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.9,
    });
    if (!result.canceled && result.assets[0]) addAsset(result.assets[0], slotIndex, replaceId);
  };

  useEffect(() => {
    ImagePicker.getPendingResultAsync()
      .then((pending) => {
        if (pending && 'canceled' in pending && !pending.canceled && pending.assets?.[0]) {
          const nextSlot = photos.length === 0 ? 0 : Math.min(photos.length, 2);
          addAsset(pending.assets[0], nextSlot);
        }
      })
      .catch(() => undefined);
    // Android can restore a picker result after the activity was recreated.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const removePhoto = (photo: ProfilePhoto) => {
    const remaining = photos.filter((item) => item.id !== photo.id);
    if (photo.isPrimary && remaining[0]) remaining[0] = { ...remaining[0], isPrimary: true };
    setPhotos(remaining);
    setManagedPhoto(null);
  };

  const makePrimary = (photo: ProfilePhoto) => {
    setPhotos(photos.map((item) => ({ ...item, isPrimary: item.id === photo.id })));
    setManagedPhoto(null);
  };

  return (
    <OnboardingLayout
      eyebrow="첫눈에 끌리는 만남 · 프로필 만들기"
      footer={
        <PrimaryButton
          disabled={!primary}
          label="사진 저장하고 다음으로"
          onPress={() => setScreen('first_charms')}
        />
      }
      onBack={() => setScreen('verification')}
      step={{ current: 1, total: 3 }}
      title={FIRST_IMPRESSION_PROFILE_LABEL}
    >
      <Text style={styles.title}>첫인상을 중요하게 생각한다면{`\n`}멋지고 예쁜 사진으로!</Text>
      <Text style={styles.description}>나다운 분위기가 잘 보이는 사진을 등록해주세요.</Text>

      <View style={styles.photoGrid}>
        <PhotoSlot
          label="메인 사진"
          onPress={() => slots[0] ? setManagedPhoto(slots[0]) : pickPhoto(0)}
          photo={slots[0]}
          primary
        />
        <View style={styles.extraColumn}>
          <PhotoSlot
            label="추가 사진 1"
            onPress={() => slots[1] ? setManagedPhoto(slots[1]) : pickPhoto(1)}
            photo={slots[1]}
          />
          <PhotoSlot
            label="추가 사진 2"
            onPress={() => slots[2] ? setManagedPhoto(slots[2]) : pickPhoto(2)}
            photo={slots[2]}
          />
        </View>
      </View>
      {!primary && <Text style={styles.validation}>메인 사진 1장을 등록해야 다음으로 갈 수 있어요.</Text>}

      <View style={styles.guide}>
        <Text style={styles.guideTitle}>💡 어떤 사진이 좋은 프로필인가요?</Text>
        <Text style={styles.guideLine}>• 얼굴이 충분히 보이는 현재 모습의 사진</Text>
        <Text style={styles.guideLine}>• 혼자 나온 자연스러운 사진 권장</Text>
        <Text style={styles.guideLine}>• 지나치게 강한 필터는 가볍게 줄이기</Text>
        <Text style={styles.guideLine}>• 선정적이거나 부적절한 사진은 등록할 수 없어요</Text>
      </View>

      <Modal
        animationType="fade"
        transparent
        visible={Boolean(managedPhoto)}
        onRequestClose={() => setManagedPhoto(null)}
      >
        <Pressable style={styles.scrim} onPress={() => setManagedPhoto(null)}>
          <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.sheetTitle}>이 사진을 어떻게 할까요?</Text>
            {managedPhoto && !managedPhoto.isPrimary && (
              <Action label="메인 사진으로 지정" onPress={() => makePrimary(managedPhoto)} />
            )}
            {managedPhoto && (
              <Action
                label="사진 변경"
                onPress={() => {
                  const slotIndex = managedPhoto.isPrimary ? 0 : Math.max(1, extras.findIndex((item) => item.id === managedPhoto.id) + 1);
                  const id = managedPhoto.id;
                  setManagedPhoto(null);
                  pickPhoto(slotIndex, id);
                }}
              />
            )}
            {managedPhoto && <Action destructive label="사진 삭제" onPress={() => removePhoto(managedPhoto)} />}
            <Action label="취소" onPress={() => setManagedPhoto(null)} />
          </Pressable>
        </Pressable>
      </Modal>
    </OnboardingLayout>
  );
}

function PhotoSlot({
  photo,
  label,
  primary = false,
  onPress,
}: {
  photo?: ProfilePhoto;
  label: string;
  primary?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={`${label}${photo ? ' 변경' : ' 선택'}`}
      onPress={onPress}
      style={[styles.photoSlot, primary ? styles.primarySlot : styles.extraSlot, primary && styles.primaryBorder]}
    >
      {photo ? (
        <>
          <Image resizeMode="cover" source={{ uri: photo.localUri }} style={styles.photo} />
          <View style={styles.photoOverlay}>
            <Text style={styles.photoLabel}>{label}{primary ? ' · 필수' : ''}</Text>
            <Text style={styles.changeLabel}>탭하여 관리</Text>
          </View>
        </>
      ) : (
        <View style={styles.emptyPhoto}>
          <Text style={styles.plus}>＋</Text>
          <Text style={[styles.emptyLabel, primary && styles.primaryEmptyLabel]}>{label}</Text>
          {primary && <Text style={styles.required}>필수</Text>}
        </View>
      )}
    </Pressable>
  );
}

function Action({ label, onPress, destructive = false }: { label: string; onPress: () => void; destructive?: boolean }) {
  return (
    <Pressable onPress={onPress} style={styles.action}>
      <Text style={[styles.actionText, destructive && styles.destructive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.ink, fontFamily: typography.medium, fontSize: 24, lineHeight: 34, fontWeight: '800', letterSpacing: -0.4 },
  description: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 10 },
  photoGrid: { flexDirection: 'row', gap: 10, marginTop: spacing.lg, height: 272 },
  extraColumn: { flex: 1, gap: 10 },
  photoSlot: { overflow: 'hidden', backgroundColor: '#FAF7FB', borderRadius: radius.md, borderWidth: 1, borderColor: colors.line },
  primarySlot: { flex: 1.08 },
  extraSlot: { flex: 1 },
  primaryBorder: { borderColor: colors.coral, borderWidth: 1.5, borderStyle: 'dashed' },
  photo: { width: '100%', height: '100%' },
  photoOverlay: { position: 'absolute', left: 8, right: 8, bottom: 8, borderRadius: 9, backgroundColor: 'rgba(31,25,35,0.72)', padding: 8 },
  photoLabel: { color: colors.surface, fontSize: 11, fontWeight: '800' },
  changeLabel: { color: '#E9E2ED', fontSize: 10, marginTop: 2 },
  emptyPhoto: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 8 },
  plus: { color: colors.ink, fontSize: 30, fontWeight: '300' },
  emptyLabel: { color: colors.muted, fontSize: 12, marginTop: 3 },
  primaryEmptyLabel: { color: colors.coral, fontWeight: '800' },
  required: { color: colors.coral, fontSize: 10, fontWeight: '700', marginTop: 3 },
  validation: { color: colors.warning, fontSize: 11, marginTop: 9 },
  guide: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, backgroundColor: colors.surface, padding: 15, marginTop: 20, gap: 5 },
  guideTitle: { color: colors.ink, fontSize: 13, fontWeight: '800', marginBottom: 5 },
  guideLine: { color: colors.muted, fontSize: 11.5, lineHeight: 17 },
  scrim: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(31,25,35,0.42)' },
  sheet: { width: '100%', maxWidth: 480, alignSelf: 'center', backgroundColor: colors.background, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: 20, paddingBottom: 32 },
  sheetTitle: { color: colors.ink, fontSize: 17, fontWeight: '800', marginBottom: 12 },
  action: { minHeight: 52, justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: colors.line },
  actionText: { color: colors.ink, fontSize: 15 },
  destructive: { color: colors.warning },
});
