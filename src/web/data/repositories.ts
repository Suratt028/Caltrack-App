/**
 * Data layer backed by the CalTrack API (`server.js` → MongoDB).
 *
 * The web app reads and writes real data through these repositories:
 *  - foods come from the food-composition dataset (`/api/foods/...`, per 100 g)
 *  - the profile (name + daily goal) lives in the `profiles` collection
 *  - AI estimates go through `/api/ai/scan` (Gemini Vision on the server)
 */
import type { AiEstimate, FoodCatalogItem, NutritionGoal, UserProfile } from '../types'
import { api, ApiError } from '../lib/api'
import { getSession } from '../auth/session'

/** The food dataset is stored per 100 g; that is the base serving we expose. */
const BASE_SERVING_GRAMS = 100

interface FoodDoc {
  foodId: string | number
  nameTh?: string | null
  nameEn?: string | null
  kcal?: number | null
  protein_g?: number | null
  fat_g?: number | null
  carbAvailable_g?: number | null
}

function num(value: unknown): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

/** Maps a per-100 g food-composition doc onto the catalogue shape. */
export function mapFoodDoc(doc: FoodDoc): FoodCatalogItem {
  return {
    id: String(doc.foodId),
    name: doc.nameTh || doc.nameEn || 'อาหารไม่ทราบชื่อ',
    servingLabel: 'ต่อ 100 กรัม',
    servingAmount: 1,
    unit: 'กรัม',
    grams: BASE_SERVING_GRAMS,
    kcal: num(doc.kcal),
    macros: {
      protein: num(doc.protein_g),
      carb: num(doc.carbAvailable_g),
      fat: num(doc.fat_g),
    },
  }
}

export interface FoodRepository {
  search(query: string): Promise<FoodCatalogItem[]>
  getById(id: string): Promise<FoodCatalogItem | null>
}

export const foodRepository: FoodRepository = {
  async search(query) {
    const q = query.trim()
    if (!q) return []
    const data = await api.get<{ results?: FoodDoc[] }>(
      `/foods/search?q=${encodeURIComponent(q)}&limit=20`,
    )
    return (data.results ?? []).map(mapFoodDoc)
  },

  async getById(id) {
    try {
      const data = await api.get<{ food?: FoodDoc | null }>(`/foods/${encodeURIComponent(id)}`)
      return data.food ? mapFoodDoc(data.food) : null
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null
      throw error
    }
  },
}

/** Profile doc as stored by the backend (`profiles` collection). */
interface ServerProfile {
  name?: string | null
  kcalGoal?: number | null
  proteinGoal?: number | null
  carbsGoal?: number | null
  fatGoal?: number | null
}

function mapProfile(
  profile: ServerProfile | null | undefined,
  fallbackName: string,
): UserProfile {
  const kcal = Number(profile?.kcalGoal)
  const goal: NutritionGoal | null =
    profile && Number.isFinite(kcal) && kcal > 0
      ? {
          kcal,
          macros: {
            protein: num(profile.proteinGoal),
            carb: num(profile.carbsGoal),
            fat: num(profile.fatGoal),
          },
        }
      : null
  const name =
    typeof profile?.name === 'string' && profile.name.trim() ? profile.name.trim() : fallbackName
  return { name, goal }
}

export const profileRepository = {
  /** Loads the signed-in user's profile; `fallbackName` is the account display name. */
  async getUser(fallbackName: string): Promise<UserProfile> {
    const user = getSession()
    if (!user) return { name: fallbackName, goal: null }
    const data = await api.get<{ profile?: ServerProfile | null }>(`/profiles/${user.id}`)
    return mapProfile(data.profile, fallbackName)
  },

  /** PUTs the name + daily goal and returns the updated profile. */
  async saveProfile(next: { name: string; goal: NutritionGoal | null }): Promise<UserProfile> {
    const user = getSession()
    if (!user) throw new ApiError('ยังไม่ได้เข้าสู่ระบบ', 401)
    const data = await api.put<{ profile?: ServerProfile | null }>(`/profiles/${user.id}`, {
      name: next.name,
      kcalGoal: next.goal?.kcal ?? null,
      proteinGoal: next.goal?.macros.protein ?? null,
      carbsGoal: next.goal?.macros.carb ?? null,
      fatGoal: next.goal?.macros.fat ?? null,
    })
    return mapProfile(data.profile, next.name)
  },
}

/** A photo picked on the capture screen, ready to send to the AI endpoint. */
export interface ScanImage {
  dataUrl: string
  mimeType: string
}

/** One normalized item returned by `/api/ai/scan`. */
interface ScanItem {
  name_th?: string
  name_en?: string
  estimated_grams?: { min?: number; likely?: number; max?: number }
  estimated_nutrition?: {
    kcal?: number | null
    protein?: number | null
    carbs?: number | null
    fat?: number | null
  }
}

export const aiEstimator = {
  /** Sends the photo to the server (Gemini Vision) and maps the first item. */
  async estimate(image: ScanImage): Promise<AiEstimate> {
    const data = await api.post<{ result?: { items?: ScanItem[] } }>('/ai/scan', {
      imageBase64: image.dataUrl,
      mimeType: image.mimeType,
      userId: getSession()?.id ?? null,
      // The photo is analysed then discarded — never persisted server-side.
      storeImage: false,
    })
    const item = data.result?.items?.[0]
    if (!item) throw new ApiError('ไม่พบผลประเมินจากภาพนี้', 422)

    const nutrition = item.estimated_nutrition ?? {}
    const likely = Math.round(Number(item.estimated_grams?.likely) || 0)
    return {
      name: item.name_th || item.name_en || 'อาหารจากภาพ',
      amount: 1,
      unit: 'จาน',
      grams: likely > 0 ? likely : 100,
      kcal: Math.round(num(nutrition.kcal)),
      macros: {
        protein: Math.round(num(nutrition.protein)),
        carb: Math.round(num(nutrition.carbs)),
        fat: Math.round(num(nutrition.fat)),
      },
    }
  },
}
