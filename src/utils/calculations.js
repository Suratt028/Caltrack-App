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

export const WORK_ACTIVITY_LEVELS = [
  { key: 'sedentary', label: 'นั่งทำงานเป็นหลัก', sublabel: 'เช่น งานออฟฟิศ/ขับรถ', factor: 1.2 },
  { key: 'light', label: 'ยืนหรือเดินเบา ๆ', sublabel: 'เช่น งานบริการ/เดินเป็นช่วง ๆ', factor: 1.3 },
  { key: 'moderate', label: 'เดินหรือใช้แรงปานกลาง', sublabel: 'เช่น งานที่ต้องเดินหรือยกของเป็นประจำ', factor: 1.45 },
  { key: 'active', label: 'ใช้แรงมากเป็นประจำ', sublabel: 'เช่น งานใช้แรงหรืองานกลางแจ้ง', factor: 1.6 },
  { key: 'very_active', label: 'ใช้แรงหนักเกือบทั้งวัน', sublabel: 'เช่น งานใช้แรงต่อเนื่องเป็นเวลานาน', factor: 1.75 },
];

export const EXERCISE_INTENSITIES = [
  { key: 'moderate', label: 'การออกกำลังกายระดับเบาถึงปานกลาง', sublabel: 'เช่น เดินเร็ว ปั่นจักรยานเบา หรือเวททั่วไป', met: 4 },
  { key: 'vigorous', label: 'การออกกำลังกายระดับหนักถึงสูง', sublabel: 'เช่น วิ่งเร็ว ปั่นหนัก หรือเวทหนัก', met: 7 },
];

export const GOALS = [
  { key: 'lose', label: 'ลดน้ำหนัก', adjustment: -500 },
  { key: 'maintain', label: 'รักษาน้ำหนัก', adjustment: 0 },
  { key: 'gain', label: 'เพิ่มมวลกล้ามเนื้อ/น้ำหนัก', adjustment: 300 },
];

export const DEFAULT_MACRO_SPLIT = { protein: 0.25, carbs: 0.45, fat: 0.30 };

export const BMI_CATEGORIES = [
  { key: 'low', label: 'น้ำหนักต่ำกว่าเกณฑ์', range: 'น้อยกว่า 18.5', min: 0, max: 18.5, color: 'sky' },
  { key: 'normal', label: 'น้ำหนักตามเกณฑ์', range: '18.5–22.9', min: 18.5, max: 23, color: 'success' },
  { key: 'at_risk', label: 'น้ำหนักเกิน / เริ่มเสี่ยง', range: '23.0–24.9', min: 23, max: 25, color: 'warning' },
  { key: 'obesity_1', label: 'อ้วนระดับ 1', range: '25.0–29.9', min: 25, max: 30, color: 'danger' },
  { key: 'obesity_2', label: 'อ้วนระดับ 2', range: '30 ขึ้นไป', min: 30, max: Infinity, color: 'danger' },
];

const PROTEIN_RDA_G_PER_KG = [
  { maxAge: 4, gramsPerKg: 1.05 },
  { maxAge: 14, gramsPerKg: 0.95 },
  { maxAge: 19, gramsPerKg: 0.85 },
  { maxAge: Infinity, gramsPerKg: 0.8 },
];

export function calculateBMR({ gender, weightKg, heightCm, age }) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return gender === 'male' ? base + 5 : base - 161;
}

export function getActivityFactor(activityKey) {
  const found = ACTIVITY_LEVELS.find((a) => a.key === activityKey);
  return found ? found.factor : 1.2;
}

export function getWorkActivityFactor(activityKey) {
  const found = WORK_ACTIVITY_LEVELS.find((a) => a.key === activityKey);
  return found ? found.factor : 1.2;
}

export function calculateBMI(weightKg, heightCm) {
  const weight = Number(weightKg);
  const heightM = Number(heightCm) / 100;
  if (!Number.isFinite(weight) || weight <= 0 || !Number.isFinite(heightM) || heightM <= 0) return null;
  return weight / (heightM * heightM);
}

export function getBMICategory(bmi) {
  const value = Number(bmi);
  return Number.isFinite(value) && value > 0
    ? BMI_CATEGORIES.find((category) => value >= category.min && value < category.max) || null
    : null;
}

export function getBMIRecommendedGoal(age, bmi) {
  if (Number(age) < 18) return 'maintain';
  const category = getBMICategory(bmi);
  if (category?.key === 'low') return 'gain';
  if (category?.key === 'at_risk' || category?.key === 'obesity_1' || category?.key === 'obesity_2') {
    return 'lose';
  }
  return 'maintain';
}

export function getGoalAdjustment(goalKey) {
  const found = GOALS.find((g) => g.key === goalKey);
  return found ? found.adjustment : 0;
}

export function calculateTDEE({
  bmr,
  activityKey,
  weightKg,
  workActivityLevel,
  exerciseDaysPerWeek = 0,
  exerciseMinutes = 0,
  exerciseIntensity = 'moderate',
}) {
  if (!workActivityLevel) return bmr * getActivityFactor(activityKey);
  const workTdee = bmr * getWorkActivityFactor(workActivityLevel);
  const days = Math.min(7, Math.max(0, Number(exerciseDaysPerWeek) || 0));
  const minutes = Math.min(300, Math.max(0, Number(exerciseMinutes) || 0));
  const intensity = EXERCISE_INTENSITIES.find((item) => item.key === exerciseIntensity);
  const met = intensity?.met || EXERCISE_INTENSITIES[0].met;
  const exerciseKcalPerWeek = ((met - 1) * 3.5 * (Number(weightKg) || 0) / 200) * minutes * days;
  return workTdee + exerciseKcalPerWeek / 7;
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

export function calculateAgeBasedMacroGoals(calorieGoal, { age, weightKg }) {
  const ageYears = Number(age);
  const weight = Number(weightKg);
  const rda = PROTEIN_RDA_G_PER_KG.find((item) => ageYears < item.maxAge)?.gramsPerKg ?? 0.8;
  const protein = Math.round(weight * rda);
  const remainingKcal = Math.max(0, calorieGoal - protein * 4);
  const carbs = Math.round((remainingKcal * 0.6) / 4);
  const fat = Math.round((remainingKcal * 0.4) / 9);
  return { protein, carbs, fat };
}

export function buildProfileGoals(profile) {
  const bmr = calculateBMR(profile);
  const tdee = calculateTDEE({
    bmr,
    activityKey: profile.activityLevel,
    weightKg: profile.weightKg,
    workActivityLevel: profile.workActivityLevel,
    exerciseDaysPerWeek: profile.exerciseDaysPerWeek,
    exerciseMinutes: profile.exerciseMinutes,
    exerciseIntensity: profile.exerciseIntensity,
  });
  const calorieGoal = calculateCalorieGoal({ tdee, goalKey: profile.goal });
  const macroGoals = calculateAgeBasedMacroGoals(calorieGoal, profile);
  return { bmr: Math.round(bmr), tdee: Math.round(tdee), calorieGoal, macroGoals };
}

export function todayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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
