import './global.css'
import React, { useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Pressable, Text, View } from 'react-native'
// The explicit extension prevents Metro from resolving this import back to App.web.js.
import App from '../App.js'

const USER_KEY = '@caltrack/user'
const LEGACY_SESSION_KEY = 'caltrack_session'

async function migrateWebSession() {
  const existingUser = await AsyncStorage.getItem(USER_KEY)
  const legacyRaw = window.localStorage.getItem(LEGACY_SESSION_KEY)
  if (!legacyRaw) return

  if (!existingUser) {
    let legacyUser
    try {
      legacyUser = JSON.parse(legacyRaw)
    } catch {
      window.localStorage.removeItem(LEGACY_SESSION_KEY)
      return
    }
    if (!legacyUser || typeof legacyUser.id !== 'string' || !legacyUser.id) {
      window.localStorage.removeItem(LEGACY_SESSION_KEY)
      return
    }

    await AsyncStorage.setItem(
      USER_KEY,
      JSON.stringify({
        id: legacyUser.id,
        email: typeof legacyUser.email === 'string' ? legacyUser.email : '',
        displayName:
          typeof legacyUser.displayName === 'string' && legacyUser.displayName
            ? legacyUser.displayName
            : 'ผู้ใช้ CalTrack',
        role: 'user',
      }),
    )
  }

  window.localStorage.removeItem(LEGACY_SESSION_KEY)
}

export default function AppWeb() {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    setReady(false)
    setError('')
    migrateWebSession()
      .then(() => {
        if (active) setReady(true)
      })
      .catch((migrationError) => {
        if (active) {
          setError(migrationError instanceof Error ? migrationError.message : 'เกิดข้อผิดพลาด')
        }
      })
    return () => {
      active = false
    }
  }, [attempt])

  if (error) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ color: '#1f3a2f', fontSize: 16, textAlign: 'center' }}>
          โหลดข้อมูลบัญชีเดิมไม่สำเร็จ: {error}
        </Text>
        <Pressable
          onPress={() => setAttempt((previous) => previous + 1)}
          style={{ marginTop: 16, padding: 12, backgroundColor: '#21634c', borderRadius: 12 }}
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>ลองอีกครั้ง</Text>
        </Pressable>
      </View>
    )
  }

  return ready ? <App /> : null
}
