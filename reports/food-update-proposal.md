# Food data update proposal (INMU)

Source: Institute of Nutrition, Mahidol University (INMU). Thai Food Composition Database, Online version 3, August 2025. https://inmu.mahidol.ac.th/thaifcd/home — fetched 2026-10-20, values per 100 g edible portion.
License: Free for non-commercial use with acknowledgement; commercial use requires permission from INMU.

Input `thaiFoods_clean.json` (1167 rows) → `thaiFoods_proposed.json` (1181 rows). **Nothing has been written to the database.** After review: `node seed-foods.js --file thaiFoods_proposed.json`.

| | before | after |
|---|---|---|
| rows | 1167 | 1181 |
| rows missing kcal/protein/fat/carbs | 31 | 29 |
| values changed in existing rows | — | 56 |

## New dishes (14)

| foodId | nameTh | INMU | kcal | P | F | C | why |
|---|---|---|---|---|---|---|---|
| INMU-T212 | ต้มยำ, กุ้ง | T212 ต้มยำ, กุ้ง | 44 | 4.67 | 1.43 | 2.86 | ต้มยำกุ้ง was missing (only noodle versions existed) |
| INMU-T213 | ต้มยำ, ไก่ | T213 ต้มยำ, ไก่ | 41 | 8.2 | 0.37 | 0.5 | ต้มยำไก่ was missing |
| INMU-T211 | ต้มข่าไก่ | T211 ต้มข่าไก่ | 92 | 7.8 | 5.89 | 1.42 | ต้มข่าไก่ was missing (only ต้มข่า ทูน่า existed) |
| INMU-T174 | ผัดกะเพราไก่ | T174 กระเพราไก่ | 155 | 21.94 | 6.72 | 1.06 | ผัดกะเพราไก่ without rice was missing. INMU names it "กระเพราไก่"; renamed to the usual dish name with the standard spelling so scans match |
| INMU-T184 | แกงเขียวหวาน, ไก่ | T184 แกงเขียวหวาน, ไก่ | 101 | 7.9 | 6.05 | 3.03 | แกงเขียวหวานไก่ on its own was missing (only with rice / ขนมจีน) |
| INMU-T51 | ข้าวต้มหมู | T51 ข้าวต้มหมู | 65 | 4.19 | 1.09 | 9.58 | ข้าวต้มหมู was missing |
| INMU-T68 | โจ๊ก, หมู | T68 โจ๊ก, หมู | 57 | 1.56 | 2.63 | 6.85 | โจ๊กหมู was missing |
| INMU-F111 | ไก่, ย่าง | F111 ไก่, ย่าง | 184 | 29.65 | 6.95 | 0.45 | ไก่ย่าง was missing |
| INMU-T231 | ส้มตำ, ไทย | T231 ส้มตำ, ไทย | 105 | 4.29 | 2.65 | 14.34 | ส้มตำไทย was missing (only ปู-กุ้ง / ปลาร้า / อีสาน) |
| INMU-T309 | หมูสะเต๊ะ | T309 หมูสะเต๊ะ | 272 | 20.07 | 14.57 | 15.03 | หมูสะเต๊ะ was missing (closest INMU record to grilled pork; หมูปิ้ง itself is not in INMU) |
| INMU-T176 | ก๋วยเตี๋ยวเส้นปลา | T176 ก๋วยเตี๋ยวเส้นปลา | 70 | 12.87 | 0.73 | 2.47 | ก๋วยเตี๋ยวเส้นปลา was missing |
| INMU-T59 | ข้าวมัน, ไก่ต้ม | T59 ข้าวมัน, ไก่ต้ม | 198 | 6.75 | 9.25 | 21.25 | ข้าวมันไก่ต้ม was missing (only generic ข้าวมันไก่) |
| INMU-T206 | ข้าวมัน, ไก่ทอด | T206 ข้าวมัน, ไก่ทอด | 235 | 8.6 | 7.2 | 32.9 | ข้าวมันไก่ทอด was missing |
| INMU-Q40 | ชานม | Q40 ชานม, ต่อ 100 มล. | 40 | 1.68 | 1.1 | 5.72 | No tea drink with complete values existed. INMU gives it per 100 mL; tea is ~1 g/mL, so it is used as per 100 g |

## Changes to existing rows (8)

| foodId | nameTh (after) | action | INMU | why |
|---|---|---|---|---|
| 5137 | ส้มเช้ง | replace | E117 | Row had no nutrient values at all; INMU E117 is the same food (ส้มเช้ง, Citrus sinensis) |
| 14023 | ลูกชิ้นหมู, ทอด | replace | F154 | Row lacked kcal and carbs. INMU F154 is a different sample (P 14.7 vs 16.9 g), so its full set is used instead of mixing samples |
| 4187 | มะรุม, ฝัก | set | D133 | Protein/fat/carbs equal INMU D133 exactly, but kcal was 11 instead of 35 |
| 6027 | เป็ด, เลือด, สุก | replace | F50 | Stated 16 kcal contradicts its own macros (≈50); INMU F50 gives a consistent set (24 kcal) |
| 7016 | ปลาเก๋า, สด | atwater | G37 | Stated 29 kcal contradicts its own macros. Recomputed from them (≈88); INMU G37 (another grouper species) is 82 kcal, which corroborates |
| 11139 | แกงหอยขม, ภาคกลาง | rename | T292 | Duplicate name. Its macros (P 5.5, F 10) match INMU T292 central style |
| 11191 | แกงหอยขม, ภาคอีสาน | rename | T293 | Duplicate name. Its macros (P 5.4, F 0.3) match INMU T293 northeastern style |
| 4025 | ขมิ้นมะม่วง (ขมิ้นขาว) | rename | — | Duplicate of 10004 ขมิ้นขาว. This row is mango ginger (Curcuma amada), which is also called ขมิ้นมะม่วง |

Every changed value, with before/after, is in `reports/food-update-proposal.csv`; changed rows keep old values in `originalValues` and cite INMU in `sourceRef`.

## What a scan would pick (top candidate)

| AI name | before | after |
|---|---|---|
| ต้มยำกุ้ง | ก๋วยเตี๋ยวเส้นหมี่, ต้มยำ (partial) | ต้มยำ, กุ้ง (exact, auto) |
| ต้มข่าไก่ | ต้มข่า, ทูน่า (partial) | ต้มข่าไก่ (exact, auto) |
| ผัดกะเพราไก่ | ข้าวราดผัดกะเพราไก่ (contains) | ผัดกะเพราไก่ (exact, auto) |
| โจ๊กหมู | — | โจ๊ก, หมู (exact, auto) |
| ส้มตำไทย | ส้มตำ, อีสาน (partial) | ส้มตำ, ไทย (exact, auto) |
| ไก่ย่าง | ไก่กอและ (partial) | ไก่, ย่าง (exact, auto) |
| แกงเขียวหวานไก่ | ขนมจีน, แกงเขียวหวานไก่ (contains) | แกงเขียวหวาน, ไก่ (exact, auto) |
| ข้าวมันไก่ทอด | ข้าวมันไก่ (partial) | ข้าวมัน, ไก่ทอด (exact, auto) |
| ชานม | — | ชานม (exact, auto) |

## Not changed — needs a person or another source

| item | why |
|---|---|
| 4208 ส้มป่อย | Our row lists Raphanus sativus (radish) as the species and its values differ from INMU D329 ผักส้มป่อย (Acacia concinna, 57 kcal). Which food the row means needs a person to decide. |
| 4181 มะเดื่อ, ผลอ่อน | INMU D345 is incomplete too (no kcal, fat or carbs). |
| 4183 มะยม, ยอดอ่อน | kcal contradicts its macros; INMU D251 has no kcal to compare. |
| 5048 เชอร์รี่นอก | Not in INMU (only wild cherry / cherry tomato). |
| 7058 ปลาส้ม, ตัวใหญ่, ปลาหมัก | INMU only has fried or small/ground variants, not this one. |
| 11 café drinks (14046–14058) | Coffee/tea café drinks are not in INMU. Values would need another source (e.g. the café or a recipe calculation). |
| Fried garnishes (14039–14045, 14014, 14016) | Fried garlic, shallot, lemongrass, basil, etc. are not in INMU (only raw versions). |
| Other incomplete rows (4049, 4077, 4078, 4126, 5047) | Not found in INMU. |
| Duplicate names: ลูกชิ้นปลา ทอด (7086 = 14022, identical values) | True duplicate. Removing one is safe for new logs, but not done automatically. |
| Duplicate names: ลูกชิ้นกุ้ง ทอด, สมันปลา, ขนมจีนน้ำพริก, ขนมจีนน้ำยาป่า | Different values from different sources; INMU has no matching variants to tell them apart. Keep, or rename after checking the original tables. |
| Dishes still missing: ข้าวสวย, ไก่ทอด, หมูปิ้ง, ลาบหมู, ชาไทย, ก๋วยเตี๋ยวเรือ | Not in INMU online v3, or INMU has no kcal/carbs (ข้าวเจ้า สุก A11). Existing rows cover some: ข้าวเจ้า, นึ่ง; ลาบคั่ว, หมู. |
| INMU dishes skipped as incomplete | แกงเขียวหวานหมู (T285), ผัดซีอิ๊ว (T11), ราดหน้า (T13), ผัดขี้เมา (T8): INMU has no kcal or carbs. |
| Already in our data | เย็นตาโฟ (11028) and ข้าวราดแกงเขียวหวานไก่ (11047) exist, so INMU T10/T46 were not added. |
