import React, { useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, TextInput, Image, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuth';
import { dayNumberFromStart, nowIstIso, todayIst } from '@/lib/time';
import { theme } from '@/theme';
import { RootStackParamList } from '@/navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Upload'>;

export default function UploadScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [permission, requestPermission] = useCameraPermissions();
  const { programme, refreshProgramme } = useAuthStore();
  const cameraRef = useRef<CameraView>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  if (!permission) return <SafeAreaView style={styles.safe} />;

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.msg}>{t('upload.permission')}</Text>
          <Pressable style={styles.button} onPress={requestPermission}>
            <Text style={styles.buttonText}>{t('upload.grant')}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const capture = async () => {
    if (!cameraRef.current) return;
    const shot = await cameraRef.current.takePictureAsync({ quality: 0.7 });
    if (!shot?.uri) return;

    const stamp = `${todayIst()}  ${new Date().toTimeString().slice(0, 5)} IST`;
    const manipulated = await ImageManipulator.manipulateAsync(
      shot.uri,
      [{ resize: { width: 1080 } }],
      { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG }
    );
    setPhotoUri(manipulated.uri);
    // date stamp is burned in by the server-side function too; we only resize/compress client-side
    // kept simple here — a full overlay can be added via Skia/Canvas later
    console.log('captured', stamp);
  };

  const submit = async () => {
    if (!photoUri || !programme) return;
    setBusy(true);
    try {
      const uid = programme.user_id;
      const day = Math.min(60, Math.max(1, dayNumberFromStart(programme.start_date)));
      const path = `${uid}/${programme.id}/day-${day}-${Date.now()}.jpg`;

      const resp = await fetch(photoUri);
      const blob = await resp.blob();
      const arrayBuffer = await new Response(blob).arrayBuffer();

      const { error: upErr } = await supabase.storage
        .from('rrr-uploads')
        .upload(path, arrayBuffer, { contentType: 'image/jpeg', upsert: false });
      if (upErr) throw upErr;

      const { error: insErr } = await supabase.from('daily_uploads').insert({
        user_id: uid,
        programme_id: programme.id,
        day_number: day,
        image_path: path,
        note: note.trim() || null,
        uploaded_at: nowIstIso(),
      });
      if (insErr) throw insErr;

      await refreshProgramme();
      navigation.replace('Celebration', { day });
    } catch (e: any) {
      Alert.alert('Upload failed', e.message ?? String(e));
    } finally {
      setBusy(false);
    }
  };

  if (photoUri) {
    return (
      <SafeAreaView style={styles.safe}>
        <Image source={{ uri: photoUri }} style={styles.preview} resizeMode="cover" />
        <View style={styles.panel}>
          <Text style={styles.noteLabel}>{t('upload.note')}</Text>
          <TextInput
            style={styles.noteInput}
            value={note}
            onChangeText={setNote}
            placeholder={t('upload.notePlaceholder')}
            maxLength={120}
          />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Pressable style={[styles.ghost]} onPress={() => setPhotoUri(null)} disabled={busy}>
              <Text style={styles.ghostText}>{t('upload.retake')}</Text>
            </Pressable>
            <Pressable style={[styles.button, { flex: 1 }]} onPress={submit} disabled={busy}>
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{t('upload.submit')}</Text>}
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back" />
      <View style={styles.shutterWrap}>
        <Pressable style={styles.shutter} onPress={capture} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  msg: { color: '#fff', marginBottom: 20 },
  camera: { flex: 1 },
  preview: { width: '100%', aspectRatio: 1, backgroundColor: '#000' },
  panel: { padding: 20, backgroundColor: theme.colors.bg, flex: 1 },
  noteLabel: { color: theme.colors.textSoft, marginBottom: 8 },
  noteInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: 14,
    backgroundColor: theme.colors.card,
    marginBottom: 20,
  },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  ghost: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  ghostText: { color: theme.colors.text, fontWeight: '600' },
  shutterWrap: { position: 'absolute', bottom: 40, left: 0, right: 0, alignItems: 'center' },
  shutter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#fff',
    borderWidth: 6,
    borderColor: 'rgba(255,255,255,0.4)',
  },
});
