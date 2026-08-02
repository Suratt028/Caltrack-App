# CalTrack — แอปนับแคลอรี่ (React Native + Expo)

แอปตัวอย่างที่รวมแนวคิดเด่นจาก 3 แอปที่เคยคุยกันไว้:

- **MyFitnessPal** → ค้นหา/บันทึกอาหารด้วยตนเอง + แถบสารอาหาร (โปรตีน/คาร์บ/ไขมัน)
- **NubCal / Kalguroo** → ถ่ายรูปอาหารแล้วให้ "AI" ช่วยประเมินแคลอรี่ (ในโปรเจคนี้ทำเป็น **mock/จำลอง** ไว้ก่อน ดูหัวข้อด้านล่าง)
- แนวคิด **dashboard วิเคราะห์เทรนด์สุขภาพ** จากบทสนทนาก่อนหน้า → หน้า "เทรนด์" ที่มีกราฟแคลอรี่ 7 วันและกราฟน้ำหนัก

สร้างด้วย `npx create-expo-app` (blank template) + React Navigation — ไม่ได้ก็อปโค้ดจากแอปใดๆ มาโดยตรง เป็นการ implement ฟีเจอร์แนวเดียวกันขึ้นใหม่ทั้งหมด

## เริ่มต้นใช้งาน

ต้องมี **Node.js 18+** และ **npm** ในเครื่องก่อน

```bash
cd CalTrackApp
npm install
```

### วิธีที่ 1 — รันเร็วที่สุดด้วย Expo Go (แนะนำระหว่างพัฒนา)

```bash
npx expo start
```

จะได้ QR code ขึ้นมา ให้เปิดแอป **Expo Go** (โหลดจาก Play Store) ในมือถือ แล้วสแกน QR — ไม่ต้องใช้ Android Studio เลยในขั้นนี้ เหมาะกับตอนพัฒนา/เดโมให้อาจารย์ดูไว

### วิธีที่ 2 — เปิดเป็นโปรเจค Android จริงใน Android Studio

Expo (managed workflow) ไม่ได้มีโฟลเดอร์ `android/` มาให้ตั้งแต่แรก ต้อง "prebuild" ให้ Expo สร้างโปรเจค native ให้ก่อน:

```bash
npx expo prebuild --platform android
```

คำสั่งนี้จะสร้างโฟลเดอร์ `android/` ขึ้นมา จากนั้น:

1. เปิด Android Studio
2. เลือก **Open** แล้วชี้ไปที่โฟลเดอร์ `CalTrackApp/android`
3. รอ Gradle sync เสร็จ แล้วกด Run ▶ บน emulator หรือมือถือจริงที่เปิด USB debugging

หรือจะให้ Expo จัดการทั้ง prebuild + build + ติดตั้งให้อัตโนมัติในคำสั่งเดียวก็ได้:

```bash
npx expo run:android
```

(ต้องมี Android SDK/Android Studio ติดตั้งและตั้งค่า `ANDROID_HOME` ไว้แล้ว)

## โครงสร้างโปรเจค

```
CalTrackApp/
├── App.js                     # entry point, ต่อ Context + เช็ค onboarding
├── app.json                   # ชื่อแอป, ไอคอน, permission กล้อง/คลังภาพ
└── src/
    ├── theme/colors.js         # สี/ระยะห่าง/ตัวอักษร (design tokens)
    ├── context/AppContext.js   # state กลาง + persist ด้วย AsyncStorage
    ├── utils/calculations.js   # สูตร BMR/TDEE (Mifflin-St Jeor) + เป้าหมายแคลอรี่
    ├── data/foodDatabase.js    # ฐานข้อมูลอาหารไทย+สากลตัวอย่าง (แทนที่ด้วย API จริงภายหลัง)
    ├── navigation/RootNavigator.js  # bottom tabs
    ├── screens/
    │   ├── OnboardingScreen.js  # กรอกข้อมูลครั้งแรก คำนวณเป้าหมาย
    │   ├── HomeScreen.js        # dashboard วันนี้ (วงแหวนแคลอรี่ + macro)
    │   ├── LogScreen.js         # ค้นหา/บันทึกอาหารด้วยตนเอง
    │   ├── ScanScreen.js        # ถ่ายรูป + ผล AI (mock)
    │   ├── TrendsScreen.js      # กราฟแคลอรี่ 7 วัน + กราฟน้ำหนัก
    │   └── ProfileScreen.js     # แก้ไขข้อมูล/เป้าหมาย, ล้างข้อมูล
    └── components/              # CalorieRing, MacroBar, Card, ปุ่ม, ฯลฯ
```

## ⚠️ ส่วนที่ยังเป็น "ของจำลอง" ต้องทำต่อก่อนใช้จริง

1. **AI วิเคราะห์รูปอาหาร (`src/screens/ScanScreen.js` → ฟังก์ชัน `mockRecognize`)**
   ตอนนี้แค่สุ่มเมนูจาก `foodDatabase.js` มาแสดง เพื่อโชว์ flow การใช้งานเฉยๆ
   ของจริงต้องต่อกับโมเดล image classification (เช่น เทรนบน MobileNetV2/EfficientNet ด้วย dataset
   อาหารไทยจาก Kaggle แล้ว deploy เป็น API แยก) หรือ vision API ตัวใดตัวหนึ่ง แล้วส่งผลลัพธ์กลับมาในรูปแบบ
   `{ name, kcal, protein, carbs, fat }` เหมือนเดิม โค้ดส่วนอื่นจะยังทำงานได้โดยไม่ต้องแก้

2. **ฐานข้อมูลอาหาร (`src/data/foodDatabase.js`)**
   มีแค่ ~40 เมนูตัวอย่าง ของจริงควรต่อกับฐานข้อมูลอาหารไทยของสถาบันโภชนาการ มหาวิทยาลัยมหิดล (INMU)
   และ/หรือ USDA FoodData Central API สำหรับเมนูสากล

3. **ไม่มี backend/บัญชีผู้ใช้** — ข้อมูลตอนนี้เก็บในเครื่องด้วย AsyncStorage เท่านั้น (ใช้คนเดียว, ข้อมูลหายถ้าลบแอป)
   ถ้าต้องการ sync ข้ามเครื่องหรือมีระบบสมาชิก ต้องเพิ่ม backend (เช่น Firebase หรือ Node.js + PostgreSQL) และ auth

4. **ยังไม่ได้ต่อ wearable API** (Google Fit/Health Connect, Fitbit ฯลฯ) — ตอนนี้ผู้ใช้กรอกน้ำหนัก/ข้อมูลเองทั้งหมด

## Known dependencies

ติดตั้งไว้แล้วใน `package.json`: `@react-navigation/native`, `@react-navigation/bottom-tabs`,
`react-native-screens`, `react-native-safe-area-context`, `@react-native-async-storage/async-storage`,
`react-native-svg` (ใช้วาดวงแหวน/กราฟเอง ไม่พึ่ง chart library ภายนอก), `expo-image-picker`, `@expo/vector-icons`

โปรเจคนี้ถูก bundle ทดสอบผ่าน Metro แล้ว (`npx expo export --platform android`) ไม่มี syntax/import error
