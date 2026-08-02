// src/data/foodDatabase.js
// This file now delegates all data access to the MongoDB service layer.
// The static seed array has been moved to MongoDB Atlas collection foods.
import { getAllFoods as _getAllFoods, searchFood as _searchFood } from '../services/foodService';

export const getAllFoods = _getAllFoods;
export const searchFood = _searchFood;

// Backward-compatible placeholder (some components may still import it)
export const FOOD_DATABASE = [];
