// Types for the mobile app's goal calculator (../src/utils/calculations.js),
// imported as-is so web and mobile show the same daily targets.
declare module '@shared/calculations.js' {
  export function buildProfileGoals(profile: Record<string, unknown>): {
    bmr: number
    tdee: number
    calorieGoal: number
    macroGoals: { protein: number; carbs: number; fat: number }
  }
}
