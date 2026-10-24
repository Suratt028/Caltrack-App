// Everyday Thai food names and spellings → the names used in the food tables.
// Data only: server/foodMatching.js applies it to search queries and AI scan
// names. To extend it, add a line below; keep each target a real nameTh (or
// part of one) from the database, and run `npm test`.

// Spelling variants. The left-hand spelling is rewritten to the right-hand
// one in BOTH the query and the database names before comparing, so either
// spelling finds rows stored under the other (INMU itself stores "กระเพราไก่").
// Applied anywhere inside a name.
const SPELLING_VARIANTS = [
  ['กระเพรา', 'กะเพรา'], // common misspelling of holy basil
  ['กะเพา', 'กะเพรา'],
  ['ก๊วยเตี๋ยว', 'ก๋วยเตี๋ยว'],
  ['กวยเตี๋ยว', 'ก๋วยเตี๋ยว'],
  ['ก๋วยเตี๊ยว', 'ก๋วยเตี๋ยว'],
  ['ผัดไท', 'ผัดไทย'],
  ['ซีอิ้ว', 'ซีอิ๊ว'],
  ['ซีอิว', 'ซีอิ๊ว'],
  ['กระทิ', 'กะทิ'],
  ['กวยจั๊บ', 'ก๋วยจั๊บ'],
  ['ก๊วยจั๊บ', 'ก๋วยจั๊บ'],
  ['แซนวิช', 'แซนด์วิช'],
  ['แซนวิส', 'แซนด์วิช'],
];

// Everyday names → database names. Each left-hand phrase found in a query
// adds the query with that phrase replaced by each right-hand name; the
// original query is still tried too. Only the query side is rewritten.
const DISH_ALIASES = [
  ['ข้าวสวย', ['ข้าวเจ้า, นึ่ง']],
  ['ข้าวเปล่า', ['ข้าวเจ้า, นึ่ง']],
  ['ข้าวหุง', ['ข้าวเจ้า, นึ่ง']],
  ['ข้าวขาว', ['ข้าวเจ้า, นึ่ง']],
  ['ข้าวกะเพรา', ['ข้าวราดผัดกะเพรา']],
  ['ข้าวผัดกะเพรา', ['ข้าวราดผัดกะเพรา']],
  ['กะเพรา', ['ผัดกะเพรา']], // "กะเพราไก่" → "ผัดกะเพราไก่", inside "ข้าวราดผัดกะเพราไก่"
  ['ข้าวไข่เจียว', ['ข้าวราดไข่เจียว']],
  ['ผัดไทย', ['ก๋วยเตี๋ยวผัดไทย']],
  ['ชาไทย', ['ชาเย็น']],
  ['ชานมเย็น', ['ชาเย็นนมสด', 'ชาเย็น']],
  ['ชานมไทย', ['ชาเย็นนมสด', 'ชาเย็น']],
  ['มาม่า', ['บะหมี่กึ่งสำเร็จรูป']],
  ['ไวไว', ['บะหมี่กึ่งสำเร็จรูป']],
  ['ยำยำ', ['บะหมี่กึ่งสำเร็จรูป']],
  ['ไข่ต้ม', ['ไข่ไก่, ทั้งฟอง']],
  ['ไข่ไก่ต้ม', ['ไข่ไก่, ทั้งฟอง']],
  ['ตำไทย', ['ส้มตำ, ไทย']],
  ['ตำปู', ['ส้มตำ, ปู - กุ้ง']],
  ['ตำลาว', ['ส้มตำ, ปลาร้า']],
  ['ตำปลาร้า', ['ส้มตำ, ปลาร้า']],
  ['ส้มตำปลาร้า', ['ส้มตำ, ปลาร้า']],
  ['ส้มตำปู', ['ส้มตำ, ปู - กุ้ง']],
  ['ส้มตำไทย', ['ส้มตำ, ไทย']],
  ['โจ๊กหมู', ['โจ๊ก, หมู']],
  ['ราดหน้า', ['ก๋วยเตี๋ยวเส้นใหญ่, ราดหน้า']],
  ['เส้นใหญ่ราดหน้า', ['ก๋วยเตี๋ยวเส้นใหญ่, ราดหน้า']],
  ['ผัดคะน้าหมูกรอบ', ['ข้าวราดผัดคะน้าหมูกรอบ']],
  ['คะน้าหมูกรอบ', ['ข้าวราดผัดคะน้าหมูกรอบ']],
  ['ต้มยำกุ้ง', ['ต้มยำ, กุ้ง']],
  ['ต้มยำไก่', ['ต้มยำ, ไก่']],
  ['สุกี้น้ำ', ['สุกี้, รวมมิตร, น้ำ']],
  ['สุกี้แห้ง', ['สุกี้, รวมมิตร, แห้ง']],
  ['ข้าวเหนียวนึ่ง', ['ข้าวเหนียว, นึ่ง']],
];

module.exports = { SPELLING_VARIANTS, DISH_ALIASES };
