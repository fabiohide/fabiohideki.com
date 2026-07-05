import { getSasBadgeData } from '../src/utils/sas.js';
import { validateScore } from '../src/utils/validation.js';

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const tests = [];
function test(name, fn) {
  tests.push({ name, fn });
}

// --- SAS Tests ---
test('SAS calculations map correctly to badges and colors', () => {
  // SAS >= 82 (Green)
  const t86 = getSasBadgeData(86);
  assert(t86.diff === 0, 'SAS 86 should have diff 0');
  assert(t86.diffStr === '0', 'SAS 86 diff string should be "0"');
  assert(t86.colorClass === 'sas-green', 'SAS 86 should be green');

  const t82 = getSasBadgeData(82);
  assert(t82.diff === -4, 'SAS 82 should have diff -4');
  assert(t82.colorClass === 'sas-green', 'SAS 82 should be green');

  const t90 = getSasBadgeData(90);
  assert(t90.diff === 4, 'SAS 90 should have diff +4');
  assert(t90.colorClass === 'sas-green', 'SAS 90 should be green');

  // 77 <= SAS <= 81 (Yellow)
  const t81 = getSasBadgeData(81);
  assert(t81.diff === -5, 'SAS 81 should have diff -5');
  assert(t81.colorClass === 'sas-yellow', 'SAS 81 should be yellow');

  const t77 = getSasBadgeData(77);
  assert(t77.diff === -9, 'SAS 77 should have diff -9');
  assert(t77.colorClass === 'sas-yellow', 'SAS 77 should be yellow');

  // SAS <= 76 (Red)
  const t76 = getSasBadgeData(76);
  assert(t76.diff === -10, 'SAS 76 should have diff -10');
  assert(t76.colorClass === 'sas-red', 'SAS 76 should be red');

  const t60 = getSasBadgeData(60);
  assert(t60.diff === -26, 'SAS 60 should have diff -26');
  assert(t60.colorClass === 'sas-red', 'SAS 60 should be red');
});

// --- Score Validation Tests ---
test('Score validation enforces win conditions, limits, and no-ties', () => {
  // Valid scores (Winner has 3 keys, Loser has 0-2 keys)
  assert(validateScore(3, 0, false).valid === true, '3x0 should be valid');
  assert(validateScore(3, 1, false).valid === true, '3x1 should be valid');
  assert(validateScore(3, 2, false).valid === true, '3x2 should be valid');
  assert(validateScore(0, 3, false).valid === true, '0x3 should be valid');
  assert(validateScore(1, 3, false).valid === true, '1x3 should be valid');
  assert(validateScore(2, 3, false).valid === true, '2x3 should be valid');

  // Invalid scores (Ties)
  assert(validateScore(3, 3, false).valid === false, '3x3 tie should be invalid');
  assert(validateScore(2, 2, false).valid === false, '2x2 tie should be invalid');
  assert(validateScore(0, 0, false).valid === false, '0x0 tie should be invalid for players');

  // Invalid scores (No winner with 3 keys)
  assert(validateScore(2, 1, false).valid === false, '2x1 should be invalid (no winner at 3)');
  assert(validateScore(1, 0, false).valid === false, '1x0 should be invalid');

  // Invalid scores (Scores exceeding 3 or negative)
  assert(validateScore(4, 2, false).valid === false, 'Keys cannot exceed 3');
  assert(validateScore(3, -1, false).valid === false, 'Keys cannot be negative');

  // WO validations (0x0 is allowed only for administrators)
  assert(validateScore(0, 0, true).valid === true, '0x0 (WO) is valid for admins');
  assert(validateScore(0, 0, true).isWO === true, '0x0 is classified as WO');
  assert(validateScore(0, 0, false).valid === false, '0x0 (WO) is invalid for regular players');
});

// --- Runner execution ---
let passed = 0;
let failed = 0;
console.log('=== running unit tests ===');
for (const t of tests) {
  try {
    t.fn();
    console.log(`[PASS] ${t.name}`);
    passed++;
  } catch (err) {
    console.error(`[FAIL] ${t.name}:`, err.message);
    failed++;
  }
}
console.log(`\nResults: ${passed} passed, ${failed} failed.`);
process.exit(failed > 0 ? 1 : 0);
