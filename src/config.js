// src/config.js
// Only EXPO_PUBLIC_* values reach the app bundle, so never put secrets here.
// The default only works on the Android emulator; set EXPO_PUBLIC_API_BASE_URL
// for iOS simulators and real devices (e.g. http://<your-LAN-IP>:3001/api).
const defaultApiBaseUrl = typeof window !== 'undefined' ? 'http://localhost:3001/api' : 'http://10.0.2.2:3001/api';
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || defaultApiBaseUrl;
