/**
 * Helper modul untuk manajemen mode flash & senter kamera
 * DIGIHandover Mobile App
 */

export const FLASH_MODES = {
  OFF: 'off',
  AUTO: 'auto',
  ON: 'on',
};

/**
 * Menghitung props CameraView (flash dan enableTorch) berdasarkan mode yang dipilih
 *
 * @param {'off'|'auto'|'on'} mode
 * @param {boolean} isScanner
 * @returns {{ flash: 'off'|'auto'|'on', enableTorch: boolean }}
 */
export function getCameraFlashProps(mode, isScanner = false) {
  switch (mode) {
    case 'on':
      // Mode ON / NYALA: LED flash menyala terus (senter/torch)
      return { flash: 'on', enableTorch: true };
    case 'auto':
      // Mode AUTO: Flash hanya menyala saat ambil foto jika kondisi gelap
      // Pada mode scanner, jangan nyalakan senter terus menerus
      return { flash: 'auto', enableTorch: false };
    case 'off':
    default:
      // Mode OFF / MATI: Flash mati total
      return { flash: 'off', enableTorch: false };
  }
}

/**
 * Mendapatkan mode flash berikutnya saat tombol ditekan (cycle tanpa dropdown)
 * - Scanner: Hanya 2 mode (OFF <-> ON / MATI <-> NYALA)
 * - Kamera Foto: 3 mode (OFF -> AUTO -> ON -> OFF)
 *
 * @param {'off'|'auto'|'on'} currentMode
 * @param {boolean} isScanner
 * @returns {'off'|'auto'|'on'}
 */
export function getNextFlashMode(currentMode, isScanner = false) {
  if (isScanner) {
    return currentMode === FLASH_MODES.ON ? FLASH_MODES.OFF : FLASH_MODES.ON;
  }
  switch (currentMode) {
    case FLASH_MODES.OFF:
      return FLASH_MODES.AUTO;
    case FLASH_MODES.AUTO:
      return FLASH_MODES.ON;
    case FLASH_MODES.ON:
    default:
      return FLASH_MODES.OFF;
  }
}

/**
 * Metadata presentasi untuk tiap mode flash
 *
 * @param {'off'|'auto'|'on'} mode
 * @param {boolean} isScanner
 */
export function getFlashModeInfo(mode, isScanner = false) {
  switch (mode) {
    case 'on':
      return {
        mode: 'on',
        label: isScanner ? 'NYALA' : 'ON',
        title: 'Senter Nyala',
        desc: 'Lampu LED menyala terus',
        icon: 'flash',
        color: '#FACC15', // Kuning terang / amber
        bgColor: 'rgba(250, 204, 21, 0.25)',
        borderColor: '#FACC15',
      };
    case 'auto':
      return {
        mode: 'auto',
        label: 'AUTO',
        title: 'Otomatis',
        desc: 'Flash otomatis saat jepret foto',
        icon: 'flash-outline',
        color: '#38BDF8', // Sky blue
        bgColor: 'rgba(56, 189, 248, 0.2)',
        borderColor: '#38BDF8',
      };
    case 'off':
    default:
      return {
        mode: 'off',
        label: isScanner ? 'MATI' : 'OFF',
        title: 'Flash Mati',
        desc: 'Kamera normal tanpa lampu flash',
        icon: 'flash-off',
        color: '#D1D5DB', // Abu-abu terang
        bgColor: 'rgba(255, 255, 255, 0.1)',
        borderColor: 'rgba(255, 255, 255, 0.3)',
      };
  }
}
