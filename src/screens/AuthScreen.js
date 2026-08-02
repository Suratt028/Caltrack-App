import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { spacing } from '../theme/colors';
import PrimaryButton from '../components/PrimaryButton';
import { useApp } from '../context/AppContext';
import styles from '../style/screens/AuthScreenStyles';

function friendlyAuthError(error) {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  return 'เกิดข้อผิดพลาด กรุณาลองใหม่';
}

export default function AuthScreen() {
  const { login, register } = useApp();
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isSignup = mode === 'signup';
  const canSubmit = email.trim().length > 3 && password.length >= 6 && !submitting;

  const submit = async () => {
    setError('');
    setSubmitting(true);
    try {
      if (isSignup) {
        await register(email, password, displayName.trim());
      } else {
        await login(email, password);
      }
      // On success, onAuthStateChanged in AppContext flips `user` and App.js
      // swaps to Onboarding/RootNavigator automatically — nothing to do here.
    } catch (e) {
      setError(friendlyAuthError(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.eyebrow}>CalTrack</Text>
          <Text style={styles.title}>{isSignup ? 'สร้างบัญชีใหม่' : 'ยินดีต้อนรับกลับ'}</Text>
          <Text style={styles.subtitle}>
            {isSignup ? 'ข้อมูลจะซิงค์กับคลาวด์ ใช้ได้ทุกอุปกรณ์' : 'เข้าสู่ระบบเพื่อดูข้อมูลของคุณ'}
          </Text>

          {isSignup && (
            <>
              <Text style={styles.fieldLabel}>ชื่อที่แสดง</Text>
              <TextInput
                style={styles.input}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="เช่น มะปราง"
                autoCapitalize="words"
              />
            </>
          )}

          <Text style={styles.fieldLabel}>อีเมล</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.fieldLabel}>รหัสผ่าน</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="อย่างน้อย 6 ตัวอักษร"
            secureTextEntry
            autoCapitalize="none"
          />

          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <PrimaryButton
            title={isSignup ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}
            onPress={submit}
            disabled={!canSubmit}
            loading={submitting}
            style={{ marginTop: spacing.lg }}
          />

          <Pressable
            onPress={() => {
              setError('');
              setMode(isSignup ? 'login' : 'signup');
            }}
            style={styles.switchRow}
          >
            <Text style={styles.switchText}>
              {isSignup ? 'มีบัญชีอยู่แล้ว? ' : 'ยังไม่มีบัญชี? '}
              <Text style={styles.switchLink}>{isSignup ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}


