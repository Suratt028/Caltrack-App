// src/config.js
export const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/caltrack?retryWrites=true&w=majority';
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://10.0.2.2:3001/api';
