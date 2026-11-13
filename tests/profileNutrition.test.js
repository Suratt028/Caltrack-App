const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { transformFileSync } = require('@babel/core');

function loadUtility(relativePath) {
  const filePath = path.resolve(__dirname, '..', relativePath);
  const source = transformFileSync(filePath, {
    plugins: ['@babel/plugin-transform-modules-commonjs'],
  }).code;
  const utilityModule = { exports: {} };
  new Function('module', 'exports', 'require', source)(
    utilityModule,
    utilityModule.exports,
    require
  );
  return utilityModule.exports;
}

const calculations = loadUtility('src/utils/calculations.js');
const foodPortions = loadUtility('src/utils/foodPortions.js');

test('calculates adult BMI and assigns Asian screening categories at cutoffs', () => {
  assert.equal(calculations.calculateBMI(70, 178).toFixed(1), '22.1');
  assert.equal(calculations.getBMICategory(22.9).key, 'normal');
  assert.equal(calculations.getBMICategory(23).key, 'at_risk');
  assert.equal(calculations.getBMICategory(25).key, 'obesity_1');
  assert.equal(calculations.getBMICategory(18.4).key, 'low');
  assert.equal(calculations.getBMICategory(29.9).key, 'obesity_1');
  assert.equal(calculations.getBMICategory(30).key, 'obesity_2');
});

test('recommends a weight goal from adult BMI and avoids adult BMI guidance for minors', () => {
  assert.equal(calculations.getBMIRecommendedGoal(30, 17.9), 'gain');
  assert.equal(calculations.getBMIRecommendedGoal(30, 22.9), 'maintain');
  assert.equal(calculations.getBMIRecommendedGoal(30, 23), 'lose');
  assert.equal(calculations.getBMIRecommendedGoal(30, 30), 'lose');
  assert.equal(calculations.getBMIRecommendedGoal(17, 30), 'maintain');
  assert.equal(calculations.getBMIRecommendedGoal(30, null), 'maintain');
});

test('adds weekly exercise energy to work activity without changing legacy profiles', () => {
  const bmr = 1517.5;
  const legacy = calculations.calculateTDEE({ bmr, activityKey: 'light' });
  assert.equal(legacy, bmr * 1.375);

  const combined = calculations.calculateTDEE({
    bmr,
    weightKg: 70,
    workActivityLevel: 'sedentary',
    exerciseDaysPerWeek: 3,
    exerciseMinutes: 45,
    exerciseIntensity: 'moderate',
  });
  const dailyExerciseKcal = (((4 - 1) * 3.5 * 70) / 200 * 45 * 3) / 7;
  assert.equal(combined, bmr * 1.2 + dailyExerciseKcal);
  assert.equal(calculations.calculateTDEE({ bmr, workActivityLevel: 'light' }), bmr * 1.3);
});

test('sets protein targets by age reference and allocates remaining calories', () => {
  assert.deepEqual(calculations.calculateAgeBasedMacroGoals(2087, { age: 60, weightKg: 70 }), {
    protein: 56,
    carbs: 279,
    fat: 83,
  });
  assert.equal(
    calculations.calculateAgeBasedMacroGoals(2000, { age: 16, weightKg: 60 }).protein,
    51
  );
});

test('infers standard single-item portions only for matching foods', () => {
  assert.deepEqual(foodPortions.inferServingUnit({ nameTh: 'ไข่ไก่, ทั้งฟอง' }), {
    unit: 'ฟอง',
    grams: 50,
    eggSize: '3',
  });
  assert.deepEqual(foodPortions.inferServingUnit({ nameTh: 'ไข่ไก่ เบอร์ 0' }), {
    unit: 'ฟอง',
    grams: 62,
    eggSize: '0',
  });
  assert.deepEqual(foodPortions.inferServingUnit({ nameTh: 'ไข่ไก่ เบอร์ 5' }), {
    unit: 'ฟอง',
    grams: 42,
    eggSize: '5',
  });
  assert.deepEqual(foodPortions.inferServingUnit({ nameTh: 'ไข่ไก่ เบอร์ 6' }), {
    unit: 'ฟอง',
    grams: 37,
    eggSize: '6',
  });
  assert.deepEqual(foodPortions.inferServingUnit({ nameEn: 'Chicken egg, whole, No. 2' }), {
    unit: 'ฟอง',
    grams: 55,
    eggSize: '2',
  });
  assert.deepEqual(foodPortions.inferServingUnit({ nameTh: 'ไข่เป็ด เบอร์ 1' }), {
    unit: 'ฟอง',
    grams: 50,
  });
  assert.deepEqual(foodPortions.inferServingUnit({ nameTh: 'ส้มเขียวหวาน' }), {
    unit: 'ลูก',
    grams: 130,
  });
  assert.equal(foodPortions.inferServingUnit({ nameTh: 'ส้มตำไทย' }), null);
  assert.equal(foodPortions.inferServingUnit({ nameTh: 'น้ำส้ม' }), null);
  assert.equal(foodPortions.inferServingUnit({ nameTh: 'กล้วยทอด' }), null);
});
