Design the remaining screens and states of **CalTrack**, a Thai calorie-tracking app (iOS, Android, responsive web) with an admin web console. All UI copy is Thai. Build on the existing design language below; do not restyle the screens listed under "Already designed".

## Design language (use exactly)

- Font: Noto Sans Thai. Sizes: display 32/800, h1 26/700, h2 20/700, h3 17/700, body 15/400, label 13/600. Smallest text anywhere: 13 px (Thai tone marks need room); line height ≥ 1.5 for Thai body text.
- Colors: background #F7F5F0, surface #FFFFFF, muted surface #F1EFE9, border #E4E8E2. Ink #1F3A2F, muted ink #5F6F67, faint ink #7E8A83. Primary #21634C, primary dark #1B3D2F, mint #E6F0E7. Gold #B5832E (text-safe gold #8A611F), gold soft #F6EEDB. Danger #B23E28 (real errors only), danger soft #F7E3DC.
- Macro colors, always paired with a text label: protein #4A7BA7, carbs #B5832E, fat #B26B5A.
- Radius: inputs 14, cards 16–22, chips pill. Spacing scale 4/8/16/24/32/48. Soft shadow: 0 4 16 rgba(31,58,47,0.06).
- Icons: outline style (Ionicons-like), 20–24 px, with a filled variant for the active tab.
- Touch targets ≥ 44×44 pt (iOS) / 48×48 dp (Android). Text contrast ≥ 4.5:1, graphics ≥ 3:1.
- Tone: supportive, never judgmental. Never use red for eating over goal or for AI mistakes; use gold or neutral. No scores, no streak shaming, no emoji.
- Mobile frame 390×844, tablet 834×1194, desktop 1440 wide. Bottom tab bar on mobile: หน้าหลัก, บันทึก, center raised camera button สแกน, แนวโน้ม, โปรไฟล์. Desktop: left sidebar with the same items.

## Already designed (reference only, keep consistent)

Home with day switcher (‹ วันนี้ ›), calorie ring, macro bars and food grouped by meal with a "+" per meal; AI scan review with numbered items, "เมนูที่ใกล้เคียง" candidate chips, portion chips ½ 1 1½ 2 and a gram field; Trends with a dashed-outline bar for today (incomplete) and three small macro charts, each with its own dashed goal line.

## Screens to design

### 1. Welcome, sign in, sign up
- Welcome: app name, one-line value ("บันทึกอาหารไทยง่าย ๆ ด้วยรูปถ่าย"), two buttons: "เริ่มต้นใช้งาน" and "มีบัญชีแล้ว".
- Sign in: email, password with show/hide, "ลืมรหัสผ่าน?", primary button, divider "หรือ", Google and Apple buttons following each brand's guidelines.
- Sign up: name, email, password with live rule checklist (8+ characters, a number), terms checkbox with linked text.
- States: field errors under each field, wrong password banner, rate-limited message ("ลองใหม่อีกครั้งใน 1 นาที"), loading on the button.

### 2. Onboarding (3 short steps, skippable)
- Progress dots and "ข้าม" top-right on every step.
- Step 1 About you: sex (segmented), age, height (cm), weight (kg) as numeric fields with units inside the field.
- Step 2 Activity: 4 selectable cards with icon, title and one-line example (นั่งทำงานเป็นส่วนใหญ่, เดินบ้าง, ออกกำลังกาย 3–5 วัน/สัปดาห์, ออกกำลังกายหนักเกือบทุกวัน).
- Step 3 Goal: ลดน้ำหนัก / คงน้ำหนัก / เพิ่มน้ำหนัก, then a summary card showing the calculated daily kcal and protein/carbs/fat grams with an "ปรับเอง" link. Note: "ตัวเลขนี้เป็นค่าประมาณ ไม่ใช่คำแนะนำทางการแพทย์".
- Final: "พร้อมแล้ว" with a button to log the first meal and a secondary button to go to Home.

### 3. Profile and goals
- Header: avatar initial, display name, email.
- Goal card: daily kcal and macro grams with an "แก้ไขเป้าหมาย" button.
- Edit goal screen: the same calculator as onboarding with a live preview. Add a manual mode where the user types kcal; macros then follow a selectable split (สมดุล, โปรตีนสูง, คาร์บต่ำ), shown as grams and %.
- Body data: weight, height, age, activity, each row tappable to edit in a bottom sheet.
- Settings: notification reminders (meal-time toggles with times), units, language (ไทย/English).
- Privacy: toggle "เก็บรูปที่สแกนไว้ทบทวน" with a one-line explanation, "ดาวน์โหลดข้อมูลของฉัน", "ลบข้อมูลทั้งหมด" (danger, confirm dialog requiring the user to type ลบ), sign out.
- Footer: data source credit "ข้อมูลโภชนาการ: สถาบันโภชนาการ มหาวิทยาลัยมหิดล (INMU) และตารางคุณค่าทางโภชนาการของอาหารไทย กรมอนามัย", app version.

### 4. Log: search and add food
- Top: meal segmented control (เช้า กลางวัน เย็น ว่าง), preselected by time of day or by the meal whose "+" was tapped.
- Search field with clear button and a camera shortcut icon inside the field.
- Before typing: tabs "ล่าสุด" and "บ่อย". Rows show name, usual portion and kcal, with a quick "+" that adds the last-used portion instantly and shows an undo snackbar ("เพิ่มข้าวกะเพราไก่แล้ว · เลิกทำ").
- While typing: results with the matched text in bold, food group icon, portion hint, "≈" before estimated values, and a small "ค่าประมาณ" tag when nutrition is partly estimated.
- States: loading skeleton rows, no results ("ไม่พบ 'xxx'") with two actions (ลองสแกนรูป, เพิ่มเมนูเอง), network error with retry.
- Manual add form: name, kcal (required), protein/carbs/fat (optional), portion text, a "บันทึกเป็นเมนูของฉัน" toggle.

### 5. Portion confirmation (from search)
- No food photo (the database has none): show a food-group icon tile and the food name.
- Meal and time row (editable), quantity stepper with chips ½ 1 1½ 2, unit picker (จาน, ถ้วย, ชิ้น, กรัม) and the resulting grams shown under it.
- Live result card: kcal large, macro grams with colored dots, "ข้อมูลต่อ 100 กรัม" disclosure for full nutrients (fiber, sugar, sodium).
- Primary: "บันทึก 1.5 จาน · 840 kcal".

### 6. Edit a logged entry
- Bottom sheet opened by tapping an entry on Home: name, meal, time, quantity stepper, live kcal, buttons "บันทึกการแก้ไข" and "ลบรายการ".
- After delete: snackbar with "เลิกทำ" for 5 seconds instead of a confirm dialog.
- Also show the swipe-left-to-delete affordance on a Home row.

### 7. Home states not yet covered
- Over goal: the ring is full in gold, center text "เกินเป้าหมาย 240 kcal" in neutral wording, no red, no warning icon.
- No goal set: show kcal eaten only, with a card "ตั้งเป้าหมายเพื่อดูพลังงานที่เหลือ".
- A past day with no entries: empty illustration, "ไม่มีบันทึกในวันนี้", and a note that empty days are not counted in trends.
- First launch: all four meals empty with their "+" buttons, plus one hint card pointing to the camera button.
- Just saved: the new entry briefly highlighted in mint.

### 8. AI scan flow states
- Camera permission denied: explanation and buttons "เปิดการตั้งค่า" and "เลือกจากคลังภาพ".
- Analyzing: the chosen photo, a progress indicator, the text "ใช้เวลาประมาณ 5–15 วินาที", and a cancel button.
- Low confidence: a gold info line on the item card ("AI ไม่แน่ใจ ลองเลือกเมนูที่ใกล้เคียง") with the candidate chips expanded.
- Nothing recognised / failed: three actions (ลองอีกครั้ง, เลือกรูปอื่น, ค้นหาเอง) and photo tips.
- Saved: a success toast and return to Home with the entries highlighted.

### 9. Trends extras
- Range picker: 7 วัน, 30 วัน, เลือกช่วง. For "เลือกช่วง", use a calendar bottom sheet (Buddhist-era year display, max 60 days), not typed dates.
- The 30-day view: thinner bars, day labels every 5 days, tap a bar to show a tooltip with that day's kcal and macros.
- Weight: a line chart with a "บันทึกน้ำหนัก" button opening a sheet with a numeric keypad field and date.
- Insufficient data (fewer than 3 logged days): illustration, explanation, and "บันทึกอาหารมื้อแรก".
- Daily table under the charts, today's row labeled "วันนี้ (ยังไม่ครบ)".

### 10. System states and components
- Offline banner ("ออฟไลน์อยู่ บันทึกไว้ในเครื่องก่อน จะซิงก์เมื่อออนไลน์").
- Maintenance screen ("ระบบปิดปรับปรุงชั่วคราว").
- Session expired dialog.
- Generic error screen with retry.
- Components sheet: buttons (primary, secondary, outline, text, danger; default/pressed/disabled/loading), inputs (default, focus, error, disabled), chips (default, selected, dashed "add"), segmented control, bottom sheet, dialog, snackbar with action, banner (info, success, warning, error), empty state, skeleton row, food row, meal group header, macro bar, calorie ring (under, at, over goal, no goal), mini bar chart.

### 11. Responsive layouts
- Tablet: top navigation; on Home, the ring card and the meal list sit side by side.
- Desktop web (1440): left sidebar, Home as two columns (summary + week mini-trend on the left, meals on the right), Trends with stat cards in a row and charts side by side, and the data table full width.

### 12. Admin console (desktop web, 1440)
- Sidebar: ภาพรวม, ฐานข้อมูลอาหาร, AI Scan, แจ้งปัญหา, ผู้ใช้, ตั้งค่า.
- Overview: KPI cards (active users, meals logged today, scans today, scan success rate), a 30-day scans line chart, and the latest failed scans list.
- Food database: table with search and filters (group, missing nutrients, estimated values), and a row detail drawer showing nutrients per 100 g with source and "originalValues".
- Data update review: a diff view for a proposed import (for example from INMU). Each change shows field, before, after, source and reason, with approve or reject per row, a "อนุมัติทั้งหมดที่เลือก" button and a summary (new 14, changed 8). This must make clear that nothing is written until approved.
- AI scan monitoring: list with thumbnail (only if the user consented), detected names, chosen database food, whether the user corrected it, and the model used; filter by "ผู้ใช้แก้ไข".
- Support tickets: inbox list and a detail view with a reply box.
- Settings: maintenance-mode toggle with a confirm dialog, the AI scan prompt editor with character count (max 4000), and the model fallback order.

## Accessibility

Every chart has a text alternative (the daily table) and labels on its axes. Color is never the only cue: macros always carry their name, and today's incomplete bar is dashed, not just lighter. Show the focus ring on web. Show Home and Log at 200% text size to prove nothing is cut off.

## Deliverables

One page per section above. Mobile first, with tablet and desktop versions for Home, Trends and the admin pages. Build everything from components and variables (colors, type, spacing, radius) defined on a "Foundations" page, and connect a clickable prototype for: onboarding → Home → scan → review → Home, and Home → Log → Portion → Home.
