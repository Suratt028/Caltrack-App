const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { transformFileSync } = require('@babel/core');

const filePath = path.resolve(__dirname, '..', 'src/utils/foodDisplayName.js');
const source = transformFileSync(filePath, {
  plugins: ['@babel/plugin-transform-modules-commonjs'],
}).code;
const utilityModule = { exports: {} };
new Function('module', 'exports', source)(utilityModule, utilityModule.exports);

test('displays the formal steamed-rice name as the everyday name', () => {
  assert.equal(utilityModule.exports.getFoodDisplayName('ข้าวเจ้า, นึ่ง'), 'ข้าวสวย');
  assert.equal(utilityModule.exports.getFoodDisplayName('ข้าวสวย'), 'ข้าวสวย');
  assert.equal(utilityModule.exports.getFoodDisplayName('ข้าวกล้อง'), 'ข้าวกล้อง');
});
