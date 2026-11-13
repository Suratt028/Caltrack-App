// Daily free-scan quota, reserved atomically before calling Gemini.
//
// The old check counted today's scan logs and then called Gemini, so N scans
// sent at once all saw the same count and all got through. Here each scan
// takes a slot with one conditional $inc on a per-user-per-day counter:
//   - the filter only matches while count < max, so concurrent scans can't
//     push it past the limit;
//   - when the counter is full the filter misses, the upsert tries to insert
//     a second doc with the same _id and Mongo rejects it (E11000) = no slot.
// A scan that fails gives its slot back (failed scans don't count).
const mongoose = require('mongoose');

const COUNTER_TTL_MS = 48 * 60 * 60 * 1000; // outlives the day it counts, then Mongo drops it

const scanQuotaSchema = new mongoose.Schema({
  _id: String, // `${userId}:${dateKey}`
  count: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true, expires: 0 },
});

function getScanQuotaModel() {
  return mongoose.models.ScanQuota || mongoose.model('ScanQuota', scanQuotaSchema, 'scanQuotas');
}

// Returns a release() function when a slot was taken, or null when today's quota is used up.
async function reserveScanSlot({ userId, dateKey, max }) {
  const ScanQuota = getScanQuotaModel();
  const _id = `${userId}:${dateKey}`;
  // Two tries: the first scans of the day can race to create the counter, and
  // the loser gets E11000 even though there is room. Its second try finds the
  // counter and takes a slot normally; E11000 again really means "full".
  for (let attempt = 1; ; attempt += 1) {
    try {
      await ScanQuota.updateOne(
        { _id, count: { $lt: max } },
        { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date(Date.now() + COUNTER_TTL_MS) } },
        { upsert: true }
      );
      break;
    } catch (error) {
      if (error?.code !== 11000) throw error;
      if (attempt >= 2) return null;
    }
  }

  let released = false;
  return async function release() {
    if (released) return;
    released = true;
    await ScanQuota.updateOne({ _id, count: { $gt: 0 } }, { $inc: { count: -1 } });
  };
}

module.exports = { reserveScanSlot, getScanQuotaModel };
