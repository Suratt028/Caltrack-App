// src/config.js
export const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/caltrack?retryWrites=true&w=majority';
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://10.0.2.2:3001/api';
export const MONGODB_DATA_API_ENDPOINT = process.env.EXPO_PUBLIC_MONGODB_DATA_API_ENDPOINT || 'https://data.mongodb-api.com/app/data-xxxxx/endpoint/data/v1';
export const MONGODB_DATA_API_KEY = process.env.EXPO_PUBLIC_MONGODB_DATA_API_KEY || 'YOUR_MONGODB_DATA_API_KEY';
export const MONGODB_DATA_API_DATABASE = process.env.EXPO_PUBLIC_MONGODB_DATA_API_DATABASE || 'caltrack';
export const MONGODB_DATA_API_COLLECTION = process.env.EXPO_PUBLIC_MONGODB_DATA_API_COLLECTION || 'foods';
export const MONGODB_DATA_SOURCE = process.env.EXPO_PUBLIC_MONGODB_DATA_SOURCE || 'Cluster0';

