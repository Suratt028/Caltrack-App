import React, { useEffect, useRef, useState } from 'react';
import { View, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text } from '../components/AppText';
import { TextInput } from '../components/AppTextInput';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import PrimaryButton from '../components/PrimaryButton';
import Banner from '../components/Banner';
import { useApp } from '../context/AppContext';
import { requestPasswordReset, resetPassword } from '../services/atlasService';
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
  if (msg.toLowerCase().includes('invalid or expired code')) {
    return 'รหัสยืนยันไม่ถูกต้องหรือหมดอายุแล้ว กรุณาตรวจสอบหรือขอรหัสใหม่';
  }
  if (msg.toLowerCase().includes('password reset email is not configured')) {
    return 'ระบบยังไม่ได้ตั้งค่าการส่งอีเมล กรุณาติดต่อผู้ดูแลระบบ';
  }
  if (msg.toLowerCase().includes('could not send the reset code')) {
    return 'ส่งอีเมลไม่สำเร็จ กรุณาลองใหม่ภายหลัง';
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
  const [notice, setNotice] = useState('');
  const [toast, setToast] = useState('');
  const toastTimer = useRef(null);
  // Forgot password: 'email' asks for the address, 'code' takes the emailed code + new password.
  const [resetStep, setResetStep] = useState('email');
  const [resetCode, setResetCode] = useState('');

  const isSignup = mode === 'signup';
  const isForgot = mode === 'forgot';
  const isLogin = mode === 'login';
  const trimmedEmail = email.trim();
  // Field-level messages only appear once the person starts typing.
  const emailError = trimmedEmail.length > 0 && !EMAIL_PATTERN.test(trimmedEmail)
    ? 'รูปแบบอีเมลยังไม่ถูกต้อง เช่น name@example.com'
    : '';
  const passwordError = password.length > 0 && password.length < 6
    ? 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'
    : '';
  const cleanCode = resetCode.replace(/\D/g, '');
  const emailValid = EMAIL_PATTERN.test(trimmedEmail);
  let canSubmit = trimmedEmail.length > 3 && password.length >= 6 && !submitting;
  if (isForgot) {
    canSubmit = resetStep === 'email'
      ? emailValid && !submitting
      : emailValid && cleanCode.length === 6 && password.length >= 6 && !submitting;
  }

  const switchMode = (next) => {
    setError('');
    setNotice('');
    setPassword('');
    setResetCode('');
    setResetStep('email');
    setMode(next);
  };

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

  const sendResetCode = async () => {
    await requestPasswordReset(trimmedEmail);
    setResetCode('');
    setResetStep('code');
    setNotice(`ถ้า ${trimmedEmail} มีบัญชีอยู่ เราได้ส่งรหัส 6 หลักไปทางอีเมลแล้ว (ใช้ได้ 15 นาที)`);
  };

  const resendResetCode = async () => {
    if (submitting) return;
    setError('');
    setSubmitting(true);
    try {
      await sendResetCode();
    } catch (e) {
      setError(friendlyAuthError(e));
    } finally {
      setSubmitting(false);
    }
  };

  const submit = async () => {
    if (!canSubmit) return;
    setError('');
    setSubmitting(true);
    const cleanEmail = trimmedEmail;

    try {
      if (isForgot && resetStep === 'email') {
        await sendResetCode();
      } else if (isForgot) {
        await resetPassword(cleanEmail, cleanCode, password);
        // The new password works right away, so sign straight in.
        await login(cleanEmail, password);
      } else if (isSignup) {
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

            <Text style={styles.eyebrow}>
              {isSignup ? 'เริ่มต้นเส้นทางสุขภาพ' : isForgot ? 'กู้คืนบัญชี' : 'ยินดีต้อนรับกลับ'}
            </Text>
            <Text style={styles.title}>
              {isSignup ? 'สร้างบัญชีใหม่' : isForgot ? 'ลืมรหัสผ่าน' : 'เข้าสู่ระบบ'}
            </Text>
            <Text style={styles.subtitle}>
              {isSignup
                ? 'ข้อมูลจะซิงค์กับคลาวด์ ใช้ได้ทุกอุปกรณ์'
                : isForgot
                  ? resetStep === 'email'
                    ? 'กรอกอีเมลที่ใช้สมัคร เราจะส่งรหัสยืนยันไปให้'
                    : 'กรอกรหัสจากอีเมล แล้วตั้งรหัสผ่านใหม่'
                  : 'เข้าสู่ระบบเพื่อดูข้อมูลของคุณ'}
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

              <Text style={styles.fieldLabel}>{isForgot ? 'อีเมล' : 'อีเมล / เบอร์โทรศัพท์'}</Text>
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
                editable={!(isForgot && resetStep === 'code')}
              />
              {!!emailError && <Text style={styles.fieldError}>{emailError}</Text>}

              {isForgot && resetStep === 'code' && (
                <>
                  <Text style={styles.fieldLabel}>รหัสยืนยัน 6 หลัก</Text>
                  <TextInput
                    style={styles.input}
                    value={resetCode}
                    onChangeText={(text) => {
                      setResetCode(text.replace(/\D/g, '').slice(0, 6));
                      if (error) setError('');
                    }}
                    placeholder="123456"
                    placeholderTextColor={colors.inkFaint}
                    keyboardType="number-pad"
                    maxLength={6}
                    autoComplete="one-time-code"
                    textContentType="oneTimeCode"
                  />
                </>
              )}

              {!(isForgot && resetStep === 'email') && (
                <>
                  <Text style={styles.fieldLabel}>{isForgot ? 'รหัสผ่านใหม่' : 'รหัสผ่าน'}</Text>
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
                    autoComplete={isForgot ? 'new-password' : undefined}
                  />
                  {!!passwordError && <Text style={styles.fieldError}>{passwordError}</Text>}
                </>
              )}

              {isLogin && (
                <View style={[styles.rowBetween, styles.rowEnd]}>
                  <Pressable
                    onPress={() => switchMode('forgot')}
                    accessibilityRole="button"
                    accessibilityLabel="ลืมรหัสผ่าน"
                    hitSlop={8}
                  >
                    <Text style={styles.linkText}>ลืมรหัสผ่าน?</Text>
                  </Pressable>
                </View>
              )}

              {isForgot && resetStep === 'code' && (
                <View style={[styles.rowBetween, styles.rowEnd]}>
                  <Pressable
                    onPress={resendResetCode}
                    disabled={submitting}
                    accessibilityRole="button"
                    accessibilityLabel="ส่งรหัสยืนยันอีกครั้ง"
                    hitSlop={8}
                  >
                    <Text style={styles.linkText}>ส่งรหัสอีกครั้ง</Text>
                  </Pressable>
                </View>
              )}

              {!!notice && !error && (
                <View style={styles.errorBox}>
                  <Banner tone="success" message={notice} />
                </View>
              )}

              {!!error && (
                <View style={styles.errorBox}>
                  <Banner tone="error" message={error} />
                </View>
              )}

              <View style={styles.buttonGroup}>
                <PrimaryButton
                  title={
                    isSignup
                      ? 'สมัครสมาชิก'
                      : isForgot
                        ? resetStep === 'email' ? 'ส่งรหัสยืนยัน' : 'ตั้งรหัสผ่านใหม่'
                        : 'เข้าสู่ระบบ'
                  }
                  onPress={submit}
                  disabled={!canSubmit}
                  loading={submitting}
                />
              </View>

              {isLogin && (
                <Text style={styles.helperText}>
                  ข้อมูลของคุณจะถูกเก็บไว้อย่างปลอดภัย และใช้เพื่อคำนวณเป้าหมายโภชนาการเท่านั้น
                </Text>
              )}
            </View>

            {isLogin && (
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>หรือ</Text>
                <View style={styles.dividerLine} />
              </View>
            )}

            {isLogin && (
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
              onPress={() => switchMode(isLogin ? 'signup' : 'login')}
              accessibilityRole="button"
              accessibilityLabel={isLogin ? 'ไปหน้าสมัครสมาชิก' : 'ไปหน้าเข้าสู่ระบบ'}
              style={{ marginTop: 18 }}
            >
              <Text style={styles.footerText}>
                {isSignup ? 'มีบัญชีอยู่แล้ว? ' : isForgot ? 'จำรหัสผ่านได้แล้ว? ' : 'ยังไม่มีบัญชี? '}
                <Text style={styles.footerLink}>{isLogin ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}</Text>
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