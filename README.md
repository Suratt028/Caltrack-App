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
- **Backend:** Node.js, Express, Mongoose
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
ADMIN_PASSWORD="ตั้งรหัสผ่านแอดมินที่แข็งแรง"
ADMIN_DISPLAY_NAME="CalTrack Administrator"
REPORT_TIMEZONE="Asia/Bangkok"
```

| ตัวแปร | ใช้สำหรับ |
| --- | --- |
| `MONGODB_URI` | connection string ของ MongoDB |
| `MONGODB_DB_NAME` | ชื่อฐานข้อมูล ค่าเริ่มต้นคือ `caltrack` |
| `AUTH_SECRET` | secret สำหรับเซ็น token การล็อกอิน (ผู้ใช้และแอดมิน) ควรเป็นค่าสุ่มยาวอย่างน้อย 32 ตัวอักษร |
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
| `REPORT_TIMEZONE` | โซนเวลาที่ใช้แบ่งวันในรายงานแอดมินและโควตาสแกนรายวัน ค่าเริ่มต้นคือ `Asia/Bangkok` |

Backend ยังรองรับตัวแปรทางเลือก `MONGODB_USERNAME`, `MONGODB_PASSWORD` และ `MONGODB_HOST` (ใช้แทน `MONGODB_URI` ได้)

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

หน้า Admin เปิดได้ที่ `http://localhost:8081/admin` (มีหน้าเข้าสู่ระบบของแอดมินเอง) หรือเข้าสู่ระบบด้วยบัญชีแอดมินจากหน้า Login หลักก็ได้ โดยต้องเปิด backend ควบคู่กันด้วย `npm run server`

เมื่อ backend เชื่อมต่อ MongoDB สำเร็จ ระบบจะสร้างบัญชี Admin ใน collection `users` จาก `ADMIN_EMAIL` / `ADMIN_PASSWORD` และกำหนด `role: "admin"` หากมีบัญชีอีเมลนี้อยู่แล้ว ระบบจะปรับ role เป็น Admin โดยไม่เขียนทับรหัสผ่านเดิม ถ้าไม่ได้ตั้ง `ADMIN_PASSWORD` จะใช้รหัสเริ่มต้นสำหรับพัฒนาเท่านั้นและ server จะแสดงคำเตือน ต้องตั้งค่าก่อนใช้งานจริง

ค่า API URL ตามอุปกรณ์:

- Android emulator: `http://10.0.2.2:3001/api`
- iOS simulator: `http://localhost:3001/api`
- Expo Go หรือมือถือจริง: ใช้ IP ของคอมพิวเตอร์ในวง LAN เช่น `http://192.168.1.10:3001/api`

ต้องเปิด backend และให้มือถือกับคอมพิวเตอร์อยู่เครือข่ายเดียวกันเมื่อใช้ Expo Go หรือมือถือจริง

### รันเว็บแอป (Expo Web)

```bash
npm run web
```

Expo Web ใช้หน้าจอ, components, navigation และ state จาก `App.js` ชุดเดียวกับแอป Android/iOS ผ่าน entry `index.web.js` (เพิ่มเฉพาะ CSS ระดับหน้าเว็บใน `src/global.css`) จึงใช้ UX และข้อมูลชุดเดียวกัน รวมถึง onboarding, โปรไฟล์, บันทึกอาหาร, สแกน และแนวโน้ม บน desktop จำกัดความกว้างเนื้อหาไว้ที่ 1,120 px และจัดกึ่งกลางเพื่อให้มีระยะขอบเหมาะกับจอใหญ่ ทั้งเว็บและแอปใช้บัญชีจาก MongoDB ร่วมกัน

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
├── index.js                       # register root component (Android/iOS)
├── index.web.js                   # entry ของ Expo Web + src/global.css
├── app.json                       # Expo metadata, icon และ permissions
├── package.json                   # dependencies และ scripts
├── server.js                      # Express server, models และ API routes
├── server/                        # pure helpers: nutritionMath, Gemini fallback/error mapping
├── seed-foods.js                  # นำเข้า thaiFoods_full.json ลง collection foods
├── thaiFoods_full.json            # dataset อาหารไทยฉบับเต็ม
├── src/
│   ├── config.js                  # API URL ที่แอปใช้เรียก backend
│   ├── global.css                 # CSS ระดับหน้าเว็บ (Expo Web เท่านั้น)
│   ├── context/AppContext.js      # state กลาง, token ผู้ใช้ และ AsyncStorage persistence
│   ├── components/                # UI components รวมถึงหน้าทบทวนผลสแกนอาหาร
│   ├── components/admin/          # หน้าย่อยของ Admin (AI Scan, Reports, Settings, Support)
│   ├── navigation/RootNavigator.js# bottom tab navigation
│   ├── screens/                   # Auth, onboarding, dashboard, log, scan, trends, profile
│   ├── screens/Admin/AdminScreen.js # Admin dashboard สำหรับผู้ดูแลระบบ
│   ├── services/                  # API, AI vision, food และ nutrition services
│   ├── style/                     # styles ของ app, screens และ components
│   ├── theme/colors.js            # design tokens ด้านสี
│   └── utils/                     # สูตร BMR/TDEE และ helper ยืนยันการกระทำ
├── tests/                         # unit tests สำหรับ nutrition math และ Gemini helpers
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

การยืนยันตัวตน: `/api/auth/login`, `/api/auth/register` และ OAuth คืน `user.token` (อายุ 30 วัน) ให้ส่งเป็น `Authorization: Bearer <token>` ส่วน route แอดมินใช้ token จาก `/api/admin/login` (อายุ 8 ชั่วโมง) route ล็อกอินและสมัครมี rate limit

```text
# สาธารณะ
GET    /health
GET    /api/health
GET    /api/diagnostics
POST   /api/auth/register
POST   /api/auth/login
POST   /api/admin/login
GET    /api/foods/search?q=<query>&limit=<number>
GET    /api/foods/:foodId
POST   /api/nutrition/calculate

# ต้องใช้ user token (และ :userId ต้องเป็นของเจ้าของ token, แอดมินเข้าถึงได้ทุกคน)
GET    /api/profiles/:userId
PUT    /api/profiles/:userId
DELETE /api/profiles/:userId
GET    /api/weights/:userId
PUT    /api/weights/:userId/:dateKey
DELETE /api/users/:userId/data
GET    /api/logs/:userId
POST   /api/logs/:userId
PATCH  /api/logs/:userId/:logId
DELETE /api/logs/:userId/:logId   # ลบ log และ mirror ใน user.foods
POST   /api/ai/scan
GET    /api/scan-images/:scanId   # เฉพาะรูปของตัวเอง
GET    /api/tickets               # ผู้ใช้เห็นเฉพาะของตัวเอง แอดมินเห็นทั้งหมด
POST   /api/tickets

# ต้องใช้ admin token
GET    /api/admin/overview
GET    /api/admin/reports
GET    /api/admin/export/user-foods.csv
GET    /api/admin/export/foods.json
GET    /api/admin/scan-logs
GET    /api/admin/users?q=<query>&limit=<number>
POST   /api/admin/users
PATCH  /api/admin/users/:userId
DELETE /api/admin/users/:userId
GET    /api/admin/users/:userId/logs
GET    /api/admin/foods
POST   /api/admin/foods
PATCH  /api/admin/foods/:foodId
DELETE /api/admin/foods/:foodId
GET    /api/admin/ai-scan-config
PUT    /api/admin/ai-scan-config
GET    /api/admin/system-settings
PUT    /api/admin/system-settings
PATCH  /api/tickets/:id
DELETE /api/tickets/:id
GET/POST /api/seed-demo
```

`/api/ai/scan` เป็น endpoint ที่แอปใช้สแกนอาหาร รับ JSON `imageBase64`, `mimeType` และ `storeImage` (ต้องเป็น `true` เมื่อผู้ใช้ยินยอมให้เก็บรูป) ผู้ใช้ระบุจาก token ซึ่งใช้นับโควตาสแกนรายวันที่ตั้งในหน้า Admin ด้วย ผลวิเคราะห์คืน `result.items` ซึ่งมีชื่ออาหาร กรอบภาพ ปริมาณโดยประมาณเป็นช่วง สารอาหารที่ AI ประเมิน และตัวเลือกอาหารจากฐานข้อมูล ผู้ใช้ต้องยืนยันชื่อและกรัมก่อนบันทึก หาก Gemini ใช้งานไม่ได้ API จะแจ้ง error แทนการคืนค่าอาหารตัวอย่าง

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

`DELETE /api/logs/:userId/:logId` ลบเอกสาร log และ mirror ใน collection `user.foods` ที่มี `logId` ตรงกันในคำสั่งเดียว

## นำเข้าฐานข้อมูลอาหาร

ตั้งค่า `MONGODB_URI` และ `MONGODB_DB_NAME` ใน `.env` แล้วใช้:

```bash
node seed-foods.js
```

สคริปต์จะอ่าน `thaiFoods_full.json` แล้ว upsert ตาม `foodId` คืออัปเดตรายการที่มีอยู่และเพิ่มรายการใหม่ โดยไม่ลบอาหารที่แอดมินเพิ่มเอง หากต้องการลบทั้ง collection แล้วนำเข้าใหม่ทั้งหมด (อาหารที่แอดมินเพิ่มจะหายด้วย) ใช้:

```bash
node seed-foods.js --replace --yes
```

## การทดสอบและตรวจสอบ

```bash
npm test
node --check server.js
node --check seed-foods.js
npx expo export --platform android
```

## ความปลอดภัยและข้อจำกัด

- ห้าม commit `.env`, MongoDB URI, password หรือ Gemini key
- ตัวแปร `EXPO_PUBLIC_*` ถูกส่งไปฝั่ง client และไม่ควรใช้เก็บ secret
- เก็บ `GEMINI_API_KEY` ไว้ที่ backend เท่านั้น
- ตั้ง `AUTH_SECRET` เป็นค่าสุ่มยาวอย่างน้อย 32 ตัวอักษรก่อนเปิดใช้งานจริง ค่านี้ใช้เซ็น token การล็อกอิน ถ้าเปลี่ยนค่า ผู้ใช้ทุกคนต้องล็อกอินใหม่ (รหัสผ่านเก็บด้วย scrypt แบบมี salt จึงไม่ขึ้นกับค่านี้ ยกเว้นบัญชีเก่าที่ยังไม่เคยล็อกอินหลังอัปเกรด)
- การสมัคร/เข้าสู่ระบบต้องใช้ MongoDB ที่เชื่อมต่อได้ หาก backend หรือฐานข้อมูลไม่พร้อม ระบบจะแจ้งข้อผิดพลาดและจะไม่สร้างบัญชี local แทน
- route ข้อมูลผู้ใช้ตรวจ user token และอนุญาตเฉพาะเจ้าของ `userId` (หรือแอดมิน); seed demo ใช้ได้เฉพาะแอดมิน
- rate limit ของการล็อกอิน/สมัครเก็บในหน่วยความจำของ server process เดียว ถ้ารันหลาย instance ต้องย้ายไปเก็บร่วมกัน (เช่น Redis)
- CORS เปิดกว้างด้วยค่าเริ่มต้นของ `cors()` ควรจำกัด origin ก่อน deploy จริง
- `/api/diagnostics` เปิดสาธารณะ บอกเพียงว่าตั้ง Gemini key แล้วหรือยัง
- Admin Web ต้องตั้งค่า `ADMIN_EMAIL` และ `ADMIN_PASSWORD` ใน backend และควรใช้ HTTPS เมื่อ deploy จริง
- Admin token มีอายุ 8 ชั่วโมง และห้ามนำค่า credential ไปใส่ใน `EXPO_PUBLIC_*`
- ผลวิเคราะห์จากภาพเป็นค่าประมาณ ไม่ใช่ผลตรวจทางห้องปฏิบัติการ
- หาก Gemini ใช้งานไม่ได้ หน้าสแกนจะแจ้ง error และให้ผู้ใช้ค้นหาอาหารจากฐานข้อมูลแทน ไม่มีการแสดงค่าตัวอย่าง
- backend รับ JSON body สูงสุด 10 MB (รูปสแกนส่งเป็น base64 ใน JSON)

## License

ดูรายละเอียดใน [LICENSE](LICENSE)
