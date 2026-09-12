import test from 'node:test';
import assert from 'node:assert/strict';
import { objectId, reward } from '../validation.js';

test('objectId accepts MongoDB ObjectIds and rejects malformed input', () => {
  assert.equal(objectId.safeParse('507f1f77bcf86cd799439011').success, true);
  assert.equal(objectId.safeParse('not-an-id').success, false);
});

test('reward only accepts bounded, non-negative integers', () => {
  assert.equal(reward.safeParse(250).success, true);
  assert.equal(reward.safeParse(-1).success, false);
  assert.equal(reward.safeParse(2.5).success, false);
  assert.equal(reward.safeParse(10_001).success, false);
});
