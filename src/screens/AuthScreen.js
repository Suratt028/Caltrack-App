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
import PrimaryButton from '../components/PrimaryButton';
import { useApp } from '../context/AppContext';
import styles from '../style/screens/AuthScreenStyles';

function friendlyAuthError(error) {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  return 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';
}

export default function AuthScreen() {
  const { login, register } = useApp();
  const [mode, setMode] = useState('login');
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
    } catch (e) {
      setError(friendlyAuthError(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.ambient}>
            <View style={styles.blobOne} />
            <View style={styles.blobTwo} />
            <View style={styles.blobThree} />
          </View>

          <View style={styles.screen}>
            <View style={styles.brandWrap}>
              <View style={styles.logoRow}>
                <Text style={styles.logoEmoji}>🥑</Text>
                <Text style={styles.brandName}>CalTrack</Text>
              </View>
            </View>

            <Text style={styles.eyebrow}>{isSignup ? 'เริ่มต้นเส้นทางสุขภาพ' : 'ยินดีต้อนรับกลับ'}</Text>
            <Text style={styles.title}>{isSignup ? 'สร้างบัญชีใหม่' : 'เข้าสู่ระบบ'}</Text>
            <Text style={styles.subtitle}>
              {isSignup ? 'ข้อมูลจะซิงค์กับคลาวด์ ใช้ได้ทุกอุปกรณ์' : 'เข้าสู่ระบบเพื่อดูข้อมูลของคุณ'}
            </Text>

            <View style={styles.formCard}>
              {isSignup && (
                <>
                  <Text style={styles.fieldLabel}>ชื่อที่แสดง</Text>
                  <TextInput
                    style={styles.input}
                    value={displayName}
                    onChangeText={setDisplayName}
                    placeholder="เช่น สุรัตน์"
                    autoCapitalize="words"
                  />
                </>
              )}

              <Text style={styles.fieldLabel}>อีเมล / เบอร์โทรศัพท์</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="pad@ssru.ac.th"
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

              {!isSignup && (
                <View style={styles.rowBetween}>
                  <View style={styles.rememberWrap}>
                    <Text>✓</Text>
                    <Text style={styles.rememberText}>จดจำฉัน</Text>
                  </View>
                  <Text style={styles.linkText}>ลืมรหัสผ่าน?</Text>
                </View>
              )}

              {!!error && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <View style={styles.buttonGroup}>
                <PrimaryButton
                  title={isSignup ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}
                  onPress={submit}
                  disabled={!canSubmit}
                  loading={submitting}
                />
              </View>

              {!isSignup && <Text style={styles.helperText}>ข้อมูลของคุณจะถูกเก็บไว้อย่างปลอดภัย</Text>}
            </View>

            {!isSignup && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 18 }}>
                <View style={{ flex: 1, height: 1, backgroundColor: '#ECE1D2' }} />
                <Text style={{ color: '#B0A79C', fontSize: 12.5, marginHorizontal: 10 }}>หรือ</Text>
                <View style={{ flex: 1, height: 1, backgroundColor: '#ECE1D2' }} />
              </View>
            )}

            {!isSignup && (
              <View style={styles.socialRow}>
                <Pressable style={styles.socialButton}>
                  <Text style={styles.socialText}>G Google</Text>
                </Pressable>
                <Pressable style={styles.socialButton}>
                  <Text style={styles.socialText}> Apple</Text>
                </Pressable>
              </View>
            )}

            <Pressable
              onPress={() => {
                setError('');
                setMode(isSignup ? 'login' : 'signup');
              }}
              style={{ marginTop: 18 }}
            >
              <Text style={styles.footerText}>
                {isSignup ? 'มีบัญชีอยู่แล้ว? ' : 'ยังไม่มีบัญชี? '}
                <Text style={styles.footerLink}>{isSignup ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}</Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}