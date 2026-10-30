import { describe, it } from 'node:test';
import assert from 'node:assert';
import { getCameraFlashProps, getFlashModeInfo, FLASH_MODES } from '../utils/cameraFlashHelper.js';

describe('cameraFlashHelper - Unit Tests', () => {
  it('1. Mode OFF: flash="off" dan enableTorch=false', () => {
    const props = getCameraFlashProps(FLASH_MODES.OFF);
    assert.strictEqual(props.flash, 'off');
    assert.strictEqual(props.enableTorch, false);

    const info = getFlashModeInfo(FLASH_MODES.OFF);
    assert.strictEqual(info.label, 'OFF');
    assert.strictEqual(info.icon, 'flash-off');
  });

  it('2. Mode AUTO: flash="auto" dan enableTorch=false (tidak menyalakan senter terus-menerus)', () => {
    const props = getCameraFlashProps(FLASH_MODES.AUTO);
    assert.strictEqual(props.flash, 'auto');
    assert.strictEqual(props.enableTorch, false);

    const info = getFlashModeInfo(FLASH_MODES.AUTO);
    assert.strictEqual(info.label, 'AUTO');
    assert.strictEqual(info.icon, 'flash-outline');
  });

  it('3. Mode AUTO pada scanner: enableTorch tetap false agar tidak menyilaukan saat scan', () => {
    const props = getCameraFlashProps(FLASH_MODES.AUTO, true);
    assert.strictEqual(props.flash, 'auto');
    assert.strictEqual(props.enableTorch, false);
  });

  it('4. Mode ON: flash="on" dan enableTorch=true (senter LED menyala terus)', () => {
    const props = getCameraFlashProps(FLASH_MODES.ON);
    assert.strictEqual(props.flash, 'on');
    assert.strictEqual(props.enableTorch, true);

    const info = getFlashModeInfo(FLASH_MODES.ON);
    assert.strictEqual(info.label, 'ON');
    assert.strictEqual(info.icon, 'flash');
  });

  it('5. Fallback ke OFF jika mode tidak valid atau undefined', () => {
    const props = getCameraFlashProps('unknown_mode');
    assert.strictEqual(props.flash, 'off');
    assert.strictEqual(props.enableTorch, false);

    const info = getFlashModeInfo(undefined);
    assert.strictEqual(info.label, 'OFF');
    assert.strictEqual(info.icon, 'flash-off');
  });
});
