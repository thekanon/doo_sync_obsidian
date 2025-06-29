import test from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Test path utils with custom root directory

test('path utilities handle custom root directory', async () => {
  process.env.OBSIDIAN_ROOT_DIR = 'Custom';
  const utils = await import('../dist/app/utils/pathUtils.js');
  const info = utils.getCurrentLocationInfo(null);
  assert.strictEqual(info.name, 'Custom');
});

