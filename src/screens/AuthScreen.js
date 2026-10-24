import React, { useEffect, useRef, useState } from 'react';
import { View, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text } from '../components/AppText';
import { TextInput } from '../components/AppTextInput';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import PrimaryButton from '../components/PrimaryButton';
import Banner from '../components/Banner';
import { useApp } from '../context/AppContext';
import { colors } from '../theme/colors';
import styles from '../style/screens/AuthScreenStyles';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TOAST_DURATION_MS = 2500;

function friendlyAuthError(error) {
  const msg = typeof error === 'string' ? error : error?.message || '';
  if (msg.toLowerCase().includes('invalid credentials')) {
    return 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
  }
  if (msg.toLowerCase().includes('email already exists')) {
    return 'อีเมลนี้มีบัญชีอยู่แล้ว กรุณาเข้าสู่ระบบแทน';
  }
  if (msg.toLowerCase().includes('database is unavailable')) {
    return 'ฐานข้อมูลยังไม่พร้อม กรุณาลองใหม่ภายหลัง';
  }
  if (
    msg.toLowerCase().includes('failed to fetch') ||
    msg.toLowerCase().includes('network error') ||
    msg.toLowerCase().includes('network request failed')
  ) {
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
  const [toast, setToast] = useState('');
  const toastTimer = useRef(null);

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

  // เคลียร์ timer ตอนออกจากหน้านี้
  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  // แสดงบับเบิลข้อความสั้น ๆ แล้วหายเอง
  const showToast = (message) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(''), TOAST_DURATION_MS);
  };

  const handleSocialLogin = () => {
    showToast('อยู่ในส่วนที่กำลังพัฒนา');
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
        // Admin accounts get their adminToken from /auth/login (stored by AppContext).
        await login(cleanEmail, password);
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
                <View style={[styles.rowBetween, styles.rowEnd]}>
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
                <Pressable
                  style={styles.socialButton}
                  onPress={handleSocialLogin}
                  accessibilityRole="button"
                  accessibilityLabel="เข้าสู่ระบบด้วย Google"
                >
                  <Ionicons name="logo-google" size={18} color={colors.ink} />
                  <Text style={styles.socialText}>Google</Text>
                </Pressable>
                <Pressable
                  style={styles.socialButton}
                  onPress={handleSocialLogin}
                  accessibilityRole="button"
                  accessibilityLabel="เข้าสู่ระบบด้วย Apple"
                >
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

      {!!toast && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 20,
            right: 20,
            bottom: 48,
            alignItems: 'center',
            zIndex: 10,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.ink,
              borderRadius: 999,
              paddingHorizontal: 18,
              paddingVertical: 12,
              elevation: 6,
              boxShadow: '0px 6px 14px rgba(0, 0, 0, 0.2)',
            }}
          >
            <Ionicons name="construct-outline" size={16} color={colors.white} />
            <Text style={{ color: colors.white, fontSize: 14, fontWeight: '600', marginLeft: 8 }}>
              {toast}
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}