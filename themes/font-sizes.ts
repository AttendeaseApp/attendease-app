import { clamp, normalize } from "./scale-utils"

export const fontSizes = {
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
} as const

export type FontSizeKey = keyof typeof fontSizes

export const getFontSize = (base: number): number => {
     const key = `FONT${base}` as FontSizeKey
     return fontSizes[key] ?? clamp(normalize(base), 12, 24)
}
