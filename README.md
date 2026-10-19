# CalTrack

แอปนับแคลอรี่และติดตามโภชนาการภาษาไทย สร้างด้วย React Native + Expo โดยมี Node.js/Express เป็น backend และ MongoDB เป็นฐานข้อมูล การสมัครและเข้าสู่ระบบต้องเชื่อมต่อ backend และ MongoDB เพื่อให้บัญชีใช้งานได้ต่อเนื่องข้ามอุปกรณ์

## ฟีเจอร์หลัก

- สมัครสมาชิกและเข้าสู่ระบบผ่าน backend โดยบันทึกบัญชีไว้ใน MongoDB
- กรอกข้อมูลส่วนตัวเพื่อคำนวณ BMR, TDEE และเป้าหมายแคลอรี่รายวัน
- ค้นหาอาหารจากฐานข้อมูลอาหารไทยและคำนวณสารอาหารตามน้ำหนักเป็นกรัม
- บันทึกอาหารรายวัน พร้อมแคลอรี่ โปรตีน คาร์โบไฮเดรต และไขมัน
- ถ่ายรูปหรือเลือกรูปอาหารจากคลังภาพ แล้วให้ Gemini Vision ประเมินโภชนาการ
- จับคู่ผลจาก AI กับฐานข้อมูลอาหารเพื่อใช้ค่าต่อ 100 กรัมที่ละเอียดขึ้น
- ดูสรุปแคลอรี่ 7 วันและแนวโน้มน้ำหนัก
- เก็บข้อมูลในเครื่องด้วย AsyncStorage และ sync profile/logs ไปยัง backend สำหรับบัญชี remote

## เทคโนโลยี

- **Mobile:** React Native 0.86, Expo 57, React Navigation
- **Backend:** Node.js, Express, Mongoose, Multer
- **Database:** MongoDB / MongoDB Atlas
- **AI:** Gemini Vision ผ่าน backend
- **Storage ฝั่ง mobile:** AsyncStorage
- **Charts:** วาดด้วย `react-native-svg` โดยไม่ใช้ chart library เพิ่มเติม

## ความต้องการของระบบ

- Node.js 18 ขึ้นไป
- npm
- MongoDB หรือ MongoDB Atlas หากต้องการใช้ backend และข้อมูล remote
- Expo Go สำหรับทดสอบบนมือถือ หรือ Android Studio สำหรับ emulator/native build
- Gemini API key หากต้องการวิเคราะห์ภาพด้วย Gemini จริง

## เริ่มต้นใช้งาน

### 1. ติดตั้ง dependencies

```bash
git clone https://github.com/Suratt028/Caltrack-App.git
cd Caltrack-App
npm install
```

### 2. ตั้งค่า environment

คัดลอก `.env.example` เป็น `.env` แล้วแก้ค่าตามสภาพแวดล้อม:

```env
MONGODB_URI="mongodb+srv://<username>:<password>@<cluster>.mongodb.net/caltrack?retryWrites=true&w=majority"
MONGODB_DB_NAME="caltrack"
AUTH_SECRET="เปลี่ยนเป็นค่าลับที่แข็งแรง"
PORT=3001
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:3001/api
GEMINI_API_KEY="your-gemini-api-key"
GEMINI_SCAN_MODELS="gemini-3.6-flash,gemini-3.5-flash-lite"
ADMIN_EMAIL="admin@caltrack.app"
ADMIN_PASSWORD="Admin@1234"
ADMIN_DISPLAY_NAME="CalTrack Administrator"
```

| ตัวแปร | ใช้สำหรับ |
| --- | --- |
| `MONGODB_URI` | connection string ของ MongoDB |
| `MONGODB_DB_NAME` | ชื่อฐานข้อมูล ค่าเริ่มต้นคือ `caltrack` |
| `AUTH_SECRET` | secret ที่ใช้ hash password ฝั่ง backend |
| `PORT` | พอร์ต backend ค่าเริ่มต้นคือ `3001` |
| `EXPO_PUBLIC_API_BASE_URL` | URL ที่ mobile และ Expo Web ใช้เรียก API |
| `EXPO_PUBLIC_GOOGLE_*_CLIENT_ID` | Google OAuth client ID สำหรับ web, Android และ iOS ตามลำดับ |
| `GOOGLE_OAUTH_CLIENT_IDS` | รายการ Google client IDs ที่ backend อนุญาต คั่นด้วย comma |
| `APPLE_SERVICE_ID` | Apple Services ID สำหรับ OAuth บน Android/เว็บ |
| `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY` | Apple credentials สำหรับแลก authorization code ฝั่ง backend; ห้ามใส่ใน Expo/client variables |
| `APPLE_OAUTH_CLIENT_IDS` | Apple audience IDs ที่ backend ยอมรับ; ใส่ Services ID และ iOS Bundle ID คั่นด้วย comma |
| `APPLE_REDIRECT_URI` | HTTPS callback URL ที่ลงทะเบียนใน Apple Developer และชี้มายัง `/api/auth/apple/callback` |
| `GEMINI_API_KEY` | API key ของ Google Gemini ที่ควรเก็บไว้ฝั่ง server เท่านั้น |
| `GEMINI_SCAN_MODELS` | ลำดับโมเดล Gemini สำหรับสแกนภาพ คั่นด้วย comma; ค่าเริ่มต้นคือ `gemini-3.6-flash,gemini-3.5-flash-lite` ระบบ retry แบบ backoff ก่อนสลับไปโมเดลถัดไป |
| `ADMIN_EMAIL` | อีเมลสำหรับเข้าสู่ระบบ Admin Web |
| `ADMIN_PASSWORD` | รหัสผ่านสำหรับเข้าสู่ระบบ Admin Web ควรเก็บใน backend เท่านั้น |
| `ADMIN_DISPLAY_NAME` | ชื่อแสดงของ Admin ค่าเริ่มต้นคือ `CalTrack Administrator` |

Backend ยังรองรับตัวแปรทางเลือก `MONGODB_USERNAME`, `MONGODB_PASSWORD`, `MONGODB_HOST`, `FATSECRET_CLIENT_ID`, `FATSECRET_CLIENT_SECRET`, `FATSECRET_CUSTOMER_KEY` และ `FATSECRET_OAUTH_URL`

### 3. รัน backend

```bash
npm run server
```

เมื่อเชื่อมต่อสำเร็จ backend จะฟังที่ `http://localhost:3001` ตรวจสอบได้ด้วย `GET /health` หรือ `GET /api/health` หากไม่มี `MONGODB_URI` server อาจเริ่มทำงานได้ แต่ route ที่อ่านหรือเขียนข้อมูล MongoDB จะใช้ไม่ได้

### 4. รัน mobile app

```bash
npm start
npm run android
npm run ios
npm run web
```

หน้า Admin ใช้งานผ่านหน้า Login หลักที่ `http://localhost:8081/` โดยกรอก `ADMIN_EMAIL` และ `ADMIN_PASSWORD` ระบบจะเปิด Dashboard Admin อัตโนมัติ โดยต้องเปิด backend ควบคู่กันด้วย `npm run server`

เมื่อ backend เชื่อมต่อ MongoDB สำเร็จ ระบบจะสร้างบัญชี Admin เริ่มต้นใน collection `users` อัตโนมัติด้วยค่าเริ่มต้น `admin@caltrack.app` / `Admin@1234` และกำหนด `role: "admin"` หากมีบัญชีอีเมลนี้อยู่แล้ว ระบบจะปรับ role เป็น Admin โดยไม่เขียนทับรหัสผ่านเดิม ควรเปลี่ยนค่าทั้งสองใน `.env` ก่อนใช้งานจริง

ค่า API URL ตามอุปกรณ์:

- Android emulator: `http://10.0.2.2:3001/api`
- iOS simulator: `http://localhost:3001/api`
- Expo Go หรือมือถือจริง: ใช้ IP ของคอมพิวเตอร์ในวง LAN เช่น `http://192.168.1.10:3001/api`

ต้องเปิด backend และให้มือถือกับคอมพิวเตอร์อยู่เครือข่ายเดียวกันเมื่อใช้ Expo Go หรือมือถือจริง

### รันเว็บแอป (Expo Web)

```bash
npm run web
```

Expo Web ใช้หน้าจอ, components, navigation และ state จาก `App.js` ชุดเดียวกับแอป Android/iOS ผ่าน entry ใน `src/App.web.js` จึงใช้ UX และข้อมูลชุดเดียวกัน รวมถึง onboarding, โปรไฟล์, บันทึกอาหาร, สแกน และแนวโน้ม บน desktop จำกัดความกว้างเนื้อหาไว้ที่ 1,120 px และจัดกึ่งกลางเพื่อให้มีระยะขอบเหมาะกับจอใหญ่ ทั้งเว็บและแอปใช้บัญชีจาก MongoDB ร่วมกัน

ผู้ใช้เว็บที่เคยเข้าสู่ระบบผ่านหน้าเว็บชุดเดิมจะย้าย session เดิมไปยัง storage ที่แอปใช้ให้อัตโนมัติเมื่อเปิดเว็บครั้งแรก

### ตั้งค่า Google / Apple Sign In

- Google: สร้าง OAuth client IDs ใน Google Cloud Console สำหรับ Web, Android และ iOS จากนั้นใส่ client ID ที่ตรงกับแพลตฟอร์มใน `EXPO_PUBLIC_GOOGLE_*_CLIENT_ID` และใส่ชุดเดียวกันใน `GOOGLE_OAUTH_CLIENT_IDS` เพื่อให้ backend ตรวจสอบ ID token ได้ โดย Android ต้องใช้ package name และ SHA-1 ของ signing certificate ที่ตรงกับ build; iOS ต้องใช้ bundle ID จริง
- Apple บน iOS: เปิด Sign in with Apple capability ให้ App ID และตั้ง `APPLE_OAUTH_CLIENT_IDS` ให้มี iOS Bundle ID (`com.example.caltrack` หรือ bundle ID จริง)
- Apple บน Android: สร้าง Services ID และ Sign in with Apple key ใน Apple Developer, ตั้งค่าตัวแปร `APPLE_*` ฝั่ง backend และจดทะเบียน `APPLE_REDIRECT_URI` แบบ HTTPS ให้ตรงกับ callback ที่ server ใช้ (`https://<api-host>/api/auth/apple/callback`)
- Apple private key ต้องอยู่ใน environment ของ backend เท่านั้น ห้ามใช้ prefix `EXPO_PUBLIC_` หรือ commit ลง repository
- การเข้าสู่ระบบด้วย social ต้องใช้ backend ที่เชื่อม MongoDB
- หลังเปลี่ยน plugin/config ให้สร้าง native app ใหม่; hot reload อย่างเดียวไม่เพิ่ม capability ของ Apple
- Expo Web ใช้หน้าจอ `AuthScreen` ชุดเดียวกับ Android/iOS และใช้อีเมล/รหัสผ่านกับ backend ชุดเดียวกัน

### 5. Android native build

โปรเจกต์นี้ยังไม่เก็บโฟลเดอร์ `android/` และ `ios/` ไว้ใน repository เพราะเป็น Expo managed workflow:

```bash
npx expo prebuild --platform android
npx expo run:android
```

## โครงสร้างโปรเจกต์

```text
CalTrackApp/
├── App.js                         # จุดเริ่มต้นของแอปและหน้าตรวจสถานะผู้ใช้
├── index.js                       # register root component
├── app.json                       # Expo metadata, icon และ permissions
├── package.json                   # dependencies และ scripts
├── server.js                      # Express server, models และ API routes
├── server/nutritionMath.js        # pure helpers สำหรับคำนวณสารอาหารต่อกรัม
├── seed-foods.js                  # นำเข้า thaiFoods_full.json ลง collection foods
├── thaiFoods_full.json            # dataset อาหารไทยฉบับเต็ม
├── controllers/                   # controller สำหรับ food upload/scan
├── models/                        # Mongoose models
├── services/                      # backend services เช่น Gemini และ FatSecret
├── scripts/                       # scripts เสริม
├── src/
│   ├── config.js                  # API URL และ MongoDB Data API settings
│   ├── context/AppContext.js      # state กลางและ AsyncStorage persistence
│   ├── components/                # UI components รวมถึงหน้าทบทวนผลสแกนอาหาร
│   ├── data/foodDatabase.js       # local food database/fallback
│   ├── navigation/RootNavigator.js# bottom tab navigation
│   ├── screens/                   # Auth, onboarding, dashboard, log, scan, trends, profile
│   ├── screens/Admin/AdminScreen.js # Admin dashboard สำหรับผู้ดูแลระบบ
│   ├── services/                  # mobile auth, API, AI vision และ nutrition services
│   ├── style/                     # styles ของ app, screens และ components
│   ├── theme/colors.js            # design tokens ด้านสี
│   ├── utils/calculations.js      # สูตร BMR/TDEE และเป้าหมายสารอาหาร
│   └── web/                       # ชุดหน้าเว็บเดิม (ไม่ได้ใช้โดย Expo Web entry ปัจจุบัน)
├── App.web.js                     # Expo Web entry
├── webpack.config.js              # Expo Web bundler config
├── tests/                         # unit tests สำหรับ authentication และ nutrition math
└── docs/CalTrack_Chapter1-4.md    # เอกสารประกอบโครงงาน
```

## Flow ของแอป

1. `App.js` โหลด `AppProvider` และ state จาก AsyncStorage
2. หากยังไม่มี user จะแสดง `AuthScreen`
3. หาก login แล้วแต่ยังไม่มี profile จะแสดง `OnboardingScreen`
4. เมื่อ onboarding เสร็จ จะเข้าสู่ `RootNavigator`
5. Bottom tabs ประกอบด้วย `Home`, `Log`, `Scan`, `Trends` และ `Profile`
6. ผู้ใช้ remote จะ sync profile และ food logs ไปยัง backend แต่ข้อมูล local ยังถูกเก็บไว้ในเครื่องเสมอ

สูตรใช้ Mifflin-St Jeor, activity factors `1.2`, `1.375`, `1.55`, `1.725`, `1.9`, เป้าหมายลดน้ำหนัก `TDEE - 500 kcal`, รักษาน้ำหนัก `TDEE`, เพิ่มน้ำหนัก `TDEE + 300 kcal`, calorie floor `1,200 kcal` และ macro split เริ่มต้น โปรตีน 25%, คาร์โบไฮเดรต 45%, ไขมัน 30%

## Backend API

```text
GET    /health
GET    /api/health
GET    /api/diagnostics
POST   /api/auth/register
POST   /api/auth/login
POST   /api/admin/login
GET    /api/admin/overview        # ต้องใช้ Admin Bearer token
GET    /api/admin/users           # ต้องใช้ Admin Bearer token
GET    /api/admin/foods           # ต้องใช้ Admin Bearer token
POST   /api/admin/foods           # ต้องใช้ Admin Bearer token
PATCH  /api/admin/foods/:foodId   # ต้องใช้ Admin Bearer token
DELETE /api/admin/foods/:foodId   # ต้องใช้ Admin Bearer token
GET    /api/profiles/:userId
PUT    /api/profiles/:userId
DELETE /api/profiles/:userId
GET    /api/logs/:userId
POST   /api/logs/:userId
PATCH  /api/logs/:userId/:logId
DELETE /api/logs/:userId/:logId   # ลบ log และ mirror ใน userfoods
GET    /api/foods/search?q=<query>&limit=<number>
GET    /api/foods/:foodId
POST   /api/nutrition/calculate
POST   /api/food/scan
POST   /api/food/upload
POST   /api/ai/scan
GET    /api/scan-images/:scanId
GET/POST /api/seed-demo
POST   /api/fatsecret/token
```

`/api/ai/scan` เป็น endpoint ที่ mobile ใช้จริง รับ JSON `imageBase64`, `mimeType`, `userId` และ `storeImage` (ต้องเป็น `true` เมื่อผู้ใช้ยินยอมให้เก็บรูป) ผลวิเคราะห์คืน `result.items` ซึ่งมีชื่ออาหาร กรอบภาพ ปริมาณโดยประมาณเป็นช่วง สารอาหารที่ AI ประเมิน และตัวเลือกอาหารจากฐานข้อมูล ผู้ใช้ต้องยืนยันชื่อและกรัมก่อนบันทึก หาก Gemini ใช้งานไม่ได้ API จะแจ้ง error แทนการคืนค่าอาหารตัวอย่าง ส่วน `/api/food/scan` และ `/api/food/upload` รับ multipart field ชื่อ `image` ขนาดสูงสุด 5 MB

สำหรับการคำนวณโภชนาการ ส่ง `POST /api/nutrition/calculate` ด้วย body เช่น:

```json
{
  "items": [
    { "foodId": "1001", "grams": 150 },
    { "foodId": "4012", "grams": 80 }
  ]
}
```

ข้อมูลในฐานอาหารเก็บต่อ 100 กรัม และ endpoint จะคืน `totals`, `breakdown` และ `notFound` โดยรับน้ำหนัก 1–5,000 กรัมต่อรายการ

`DELETE /api/logs/:userId/:logId` ลบเอกสาร log และ mirror ใน collection `userfoods` ที่มี `logId` ตรงกันในคำสั่งเดียว

## นำเข้าฐานข้อมูลอาหาร

ตั้งค่า `MONGODB_URI` และ `MONGODB_DB_NAME` ใน `.env` แล้วใช้:

```bash
node seed-foods.js
```

สคริปต์จะอ่าน `thaiFoods_full.json`, ลบข้อมูลเดิมใน collection `foods` แล้ว insert ข้อมูลชุดใหม่ จึงควรสำรองข้อมูลก่อนใช้กับฐานข้อมูลที่มีข้อมูลอยู่แล้ว

## การทดสอบและตรวจสอบ

```bash
npm test
node --check server.js
node --check seed-foods.js
npx expo export --platform android
```

## ความปลอดภัยและข้อจำกัด

- ห้าม commit `.env`, MongoDB URI, password, Gemini key หรือ FatSecret secret
- ตัวแปร `EXPO_PUBLIC_*` ถูกส่งไปฝั่ง client และไม่ควรใช้เก็บ secret
- เก็บ `GEMINI_API_KEY` ไว้ที่ backend เท่านั้น
- ตั้ง `AUTH_SECRET` ให้แข็งแรงก่อนเปิดใช้งานจริงและคงค่าเดิมหลังเริ่มมีบัญชี เพราะระบบใช้ค่านี้ตรวจรหัสผ่านที่บันทึกไว้
- การสมัคร/เข้าสู่ระบบต้องใช้ MongoDB ที่เชื่อมต่อได้ หาก backend หรือฐานข้อมูลไม่พร้อม ระบบจะแจ้งข้อผิดพลาดและจะไม่สร้างบัญชี local แทน
- backend ยังไม่มี authentication middleware สำหรับตรวจสิทธิ์ตาม `userId`
- CORS เปิดกว้างด้วยค่าเริ่มต้นของ `cors()` ควรจำกัด origin ก่อน deploy จริง
- diagnostics, seed demo และ FatSecret ยังไม่มี access control
- Admin Web ต้องตั้งค่า `ADMIN_EMAIL` และ `ADMIN_PASSWORD` ใน backend และควรใช้ HTTPS เมื่อ deploy จริง
- Admin token มีอายุ 8 ชั่วโมง และห้ามนำค่า credential ไปใส่ใน `EXPO_PUBLIC_*`
- ผลวิเคราะห์จากภาพเป็นค่าประมาณ ไม่ใช่ผลตรวจทางห้องปฏิบัติการ
- หาก Gemini หรือ backend ใช้งานไม่ได้ แอปจะใช้ sample fallback เพื่อให้หน้าสแกนยังทำงานต่อได้
- backend รับ JSON body สูงสุด 10 MB และรูปภาพผ่าน Multer สูงสุด 5 MB

## License

ดูรายละเอียดใน [LICENSE](LICENSE)
