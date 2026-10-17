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
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PrimaryButton from '../components/PrimaryButton';
import Banner from '../components/Banner';
import { useApp } from '../context/AppContext';
import { API_BASE_URL } from '../config';
import { colors } from '../theme/colors';
import styles from '../style/screens/AuthScreenStyles';

const ADMIN_TOKEN_KEY = '@caltrack/admin-token';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function friendlyAuthError(error) {
  const msg = typeof error === 'string' ? error : error?.message || '';
  if (msg.toLowerCase().includes('invalid credentials')) {
    return 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
  }
  if (msg.toLowerCase().includes('failed to fetch') || msg.toLowerCase().includes('network error')) {
    return 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่อ';
  }
  return msg || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';
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
  const trimmedEmail = email.trim();
  // Field-level messages only appear once the person starts typing.
  const emailError = trimmedEmail.length > 0 && !EMAIL_PATTERN.test(trimmedEmail)
    ? 'รูปแบบอีเมลยังไม่ถูกต้อง เช่น name@example.com'
    : '';
  const passwordError = password.length > 0 && password.length < 6
    ? 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'
    : '';
  const canSubmit = trimmedEmail.length > 3 && password.length >= 6 && !submitting;

  const fillAdminCredentials = () => {
    setEmail('admin@caltrack.app');
    setPassword('Admin@1234');
    setError('');
  };

  const submit = async () => {
    if (!canSubmit) return;
    setError('');
    setSubmitting(true);
    const cleanEmail = trimmedEmail;

    try {
      if (isSignup) {
        await register(cleanEmail, password, displayName.trim());
      } else {
        if (cleanEmail === 'admin@caltrack.app') {
          const response = await fetch(`${API_BASE_URL}/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: cleanEmail, password }),
          });

          const data = await response.json().catch(() => ({}));
          if (!response.ok) {
            throw new Error(data.error || 'อีเมลหรือรหัสผ่าน Admin ไม่ถูกต้อง');
          }

          await AsyncStorage.setItem(ADMIN_TOKEN_KEY, data.token);
          await AsyncStorage.setItem('@caltrack/token', data.token);

          try {
            await login(cleanEmail, password);
          } catch (userLoginErr) {
            try {
              await register(cleanEmail, password, 'Administrator');
            } catch (regErr) {
              await login(cleanEmail, password).catch(() => {});
            }
          }
        } else {
          await login(cleanEmail, password);
        }
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
              <View style={styles.brandBadge}>
                <Ionicons name="nutrition" size={32} color={colors.white} />
              </View>
              <Text style={styles.brandName}>CalTrack</Text>
              <Text style={styles.brandTagline}>บันทึกอาหารง่าย ๆ เข้าใจโภชนาการของตัวเอง</Text>
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
                    placeholderTextColor={colors.inkFaint}
                    autoCapitalize="words"
                  />
                </>
              )}

              <Text style={styles.fieldLabel}>อีเมล / เบอร์โทรศัพท์</Text>
              <TextInput
                style={[styles.input, !!emailError && styles.inputError]}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (error) setError('');
                }}
                placeholder="name@example.com"
                placeholderTextColor={colors.inkFaint}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {!!emailError && <Text style={styles.fieldError}>{emailError}</Text>}

              <Text style={styles.fieldLabel}>รหัสผ่าน</Text>
              <TextInput
                style={[styles.input, !!passwordError && styles.inputError]}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (error) setError('');
                }}
                placeholder="อย่างน้อย 6 ตัวอักษร"
                placeholderTextColor={colors.inkFaint}
                secureTextEntry
                autoCapitalize="none"
              />
              {!!passwordError && <Text style={styles.fieldError}>{passwordError}</Text>}

              {!isSignup && (
                <View style={styles.rowBetween}>
                  <Pressable
                    onPress={fillAdminCredentials}
                    accessibilityRole="button"
                    accessibilityLabel="กรอกข้อมูลบัญชีผู้ดูแลระบบ"
                    style={({ pressed }) => [styles.adminLink, pressed && { opacity: 0.7 }]}
                  >
                    <Ionicons name="key-outline" size={16} color={colors.primary} />
                    <Text style={styles.linkText}>กรอกข้อมูล Admin</Text>
                  </Pressable>
                  <Text style={styles.linkText}>ลืมรหัสผ่าน?</Text>
                </View>
              )}

              {!!error && (
                <View style={styles.errorBox}>
                  <Banner tone="error" message={error} />
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

              {!isSignup && (
                <Text style={styles.helperText}>
                  ข้อมูลของคุณจะถูกเก็บไว้อย่างปลอดภัย และใช้เพื่อคำนวณเป้าหมายโภชนาการเท่านั้น
                </Text>
              )}
            </View>

            {!isSignup && (
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>หรือ</Text>
                <View style={styles.dividerLine} />
              </View>
            )}

            {!isSignup && (
              <View style={styles.socialRow}>
                <Pressable style={styles.socialButton} accessibilityRole="button" accessibilityLabel="เข้าสู่ระบบด้วย Google">
                  <Ionicons name="logo-google" size={18} color={colors.ink} />
                  <Text style={styles.socialText}>Google</Text>
                </Pressable>
                <Pressable style={styles.socialButton} accessibilityRole="button" accessibilityLabel="เข้าสู่ระบบด้วย Apple">
                  <Ionicons name="logo-apple" size={18} color={colors.ink} />
                  <Text style={styles.socialText}>Apple</Text>
                </Pressable>
              </View>
            )}

            <Pressable
              onPress={() => {
                setError('');
                setMode(isSignup ? 'login' : 'signup');
              }}
              accessibilityRole="button"
              accessibilityLabel={isSignup ? 'ไปหน้าเข้าสู่ระบบ' : 'ไปหน้าสมัครสมาชิก'}
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
