import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { MEAL_LABELS, formatKcal, type FoodEntry, type Meal } from '@/lib/nutrition'

const MEALS: Meal[] = ['breakfast', 'lunch', 'dinner', 'snack']

export function MealsCard({ entries }: { entries: FoodEntry[] }) {
  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">มื้ออาหารวันนี้</CardTitle>
        <CardDescription>{entries.length} รายการ</CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        {MEALS.map((meal, index) => {
          const items = entries.filter((e) => e.meal === meal)
          const kcal = items.reduce((s, e) => s + e.kcal, 0)
          return (
            <section key={meal} aria-labelledby={`meal-${meal}`}>
              {index > 0 && <Separator className="my-2" />}
              <div className="flex items-center justify-between gap-2">
                <h3 id={`meal-${meal}`} className="text-sm font-semibold">
                  {MEAL_LABELS[meal]}
                  {kcal > 0 && <span className="ml-2 font-normal text-muted-foreground tabular-nums">{formatKcal(kcal)} kcal</span>}
                </h3>
                <Button variant="ghost" size="icon" className="size-9" aria-label={`เพิ่มอาหาร${MEAL_LABELS[meal]}`}>
                  <Plus className="size-4" />
                </Button>
              </div>
              {items.length === 0 ? (
                <p className="pb-1 text-sm text-muted-foreground">ยังไม่ได้บันทึก</p>
              ) : (
                <ul className="space-y-1 pb-1">
                  {items.map((item) => (
                    <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
                      <span className="truncate">{item.name}</span>
                      <span className="shrink-0 tabular-nums text-muted-foreground">{formatKcal(item.kcal)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )
        })}
      </CardContent>
    </Card>
  )
}
