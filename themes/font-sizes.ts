import { clamp, normalize } from "./scale-utils"

/**
 * Responsive font sizes with min/max constraints
 * These values scale based on device size but are clamped to prevent extreme sizes
 */
export const fontSizes = {
     FONT10: clamp(normalize(10), 10, 14),
     FONT12: clamp(normalize(12), 12, 16),
     FONT14: clamp(normalize(14), 12, 18),
     FONT16: clamp(normalize(16), 14, 20),
     FONT18: clamp(normalize(18), 16, 22),
     FONT20: clamp(normalize(20), 18, 24),
     FONT22: clamp(normalize(22), 20, 26),
     FONT24: clamp(normalize(24), 22, 28),
     FONT26: clamp(normalize(26), 22, 30),
     FONT28: clamp(normalize(28), 24, 32),
     FONT30: clamp(normalize(30), 26, 34),
     FONT32: clamp(normalize(32), 28, 36),
     FONT35: clamp(normalize(35), 30, 40),
     FONT40: clamp(normalize(40), 34, 44),
     FONT48: clamp(normalize(48), 40, 52),
} as const

export type FontSizeKey = keyof typeof fontSizes

/**
 * Get font size by base number
 * @param base - Base font size (e.g., 16 for FONT16)
 * @returns Responsive font size with constraints
 */
export const getFontSize = (base: number): number => {
     const key = `FONT${base}` as FontSizeKey
     return fontSizes[key] ?? clamp(normalize(base), 12, 24)
}

/**
 * Calculate line height based on font size
 * Uses 1.4 ratio for better readability
 */
export const getLineHeight = (fontSize: number): number => {
     return Math.round(fontSize * 1.4)
}

/**
 * Get responsive font size with custom constraints
 */
export const getCustomFontSize = (base: number, minSize: number, maxSize: number): number => {
     return clamp(normalize(base), minSize, maxSize)
}
