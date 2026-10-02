import assert from 'node:assert/strict';
import * as presets from '../presets.mjs';
assert.equal(presets.OCTAVE_AUDIO_PRESET,undefined);
assert.equal(presets.reduceOctaves,undefined);
console.log('PASS: unwanted octave adaptation removed');
