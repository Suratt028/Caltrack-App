// Nutrition math helpers.
// BMR uses the Mifflin-St Jeor equation (a standard public formula used across
// nutrition science, not tied to any one commercial app).

export const ACTIVITY_LEVELS = [
  { key: 'sedentary', label: 'นั่งทำงานเป็นหลัก', sublabel: 'แทบไม่ออกกำลังกาย', factor: 1.2 },
  { key: 'light', label: 'กิจกรรมเบา', sublabel: 'ออกกำลังกาย 1-3 วัน/สัปดาห์', factor: 1.375 },
  { key: 'moderate', label: 'กิจกรรมปานกลาง', sublabel: 'ออกกำลังกาย 3-5 วัน/สัปดาห์', factor: 1.55 },
  { key: 'active', label: 'กิจกรรมหนัก', sublabel: 'ออกกำลังกาย 6-7 วัน/สัปดาห์', factor: 1.725 },
  { key: 'very_active', label: 'หนักมาก', sublabel: 'ออกกำลังกาย 2 ครั้ง/วัน หรืองานใช้แรงมาก', factor: 1.9 },
];

export const GOALS = [
  { key: 'lose', label: 'ลดน้ำหนัก', adjustment: -500 },
  { key: 'maintain', label: 'รักษาน้ำหนัก', adjustment: 0 },
  { key: 'gain', label: 'เพิ่มน้ำหนัก/กล้ามเนื้อ', adjustment: 300 },
];

// Default macro split of total daily calories.
export const DEFAULT_MACRO_SPLIT = { protein: 0.25, carbs: 0.45, fat: 0.30 };

export function calculateBMR({ gender, weightKg, heightCm, age }) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return gender === 'male' ? base + 5 : base - 161;
}

export function getActivityFactor(activityKey) {
  const found = ACTIVITY_LEVELS.find((a) => a.key === activityKey);
  return found ? found.factor : 1.2;
}

export function getGoalAdjustment(goalKey) {
  const found = GOALS.find((g) => g.key === goalKey);
  return found ? found.adjustment : 0;
}

export function calculateTDEE({ bmr, activityKey }) {
  return bmr * getActivityFactor(activityKey);
}

export function calculateCalorieGoal({ tdee, goalKey }) {
  const goalCalories = tdee + getGoalAdjustment(goalKey);
  // Keep a safe floor so the app never recommends an unsafe deficit.
  return Math.max(Math.round(goalCalories), 1200);
}

// Converts a calorie goal into grams of protein/carbs/fat using a macro split.
export function calculateMacroGoals(calorieGoal, split = DEFAULT_MACRO_SPLIT) {
  return {
    protein: Math.round((calorieGoal * split.protein) / 4),
    carbs: Math.round((calorieGoal * split.carbs) / 4),
    fat: Math.round((calorieGoal * split.fat) / 9),
  };
}

export function buildProfileGoals(profile) {
  const bmr = calculateBMR(profile);
  const tdee = calculateTDEE({ bmr, activityKey: profile.activityLevel });
  const calorieGoal = calculateCalorieGoal({ tdee, goalKey: profile.goal });
  const macroGoals = calculateMacroGoals(calorieGoal);
  return { bmr: Math.round(bmr), tdee: Math.round(tdee), calorieGoal, macroGoals };
}

export function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10); // YYYY-MM-DD
}

export function lastNDays(n) {
  const days = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(todayKey(d));
  }
  return days;
}
