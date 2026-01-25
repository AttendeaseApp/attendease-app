// utils/responsive.ts
import { Dimensions, PixelRatio, Platform } from "react-native"
import { getStatusBarHeight } from "react-native-status-bar-height"

// Screen dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window")

// Design guidelines
const guidelineBaseWidth = 375
const guidelineBaseHeight = 667

// ==================== PLATFORM DETECTION ====================

export const IsIOS = Platform.OS === "ios"
export const IsAndroid = Platform.OS === "android"
export const IsIPAD = IsIOS && SCREEN_HEIGHT / SCREEN_WIDTH < 1.6
export const IsHaveNotch = IsIOS && SCREEN_HEIGHT > 750
export const hasNotch = IsIOS && getStatusBarHeight() > 20
export const Isiphone12promax = IsIOS && SCREEN_HEIGHT > 2778

// ==================== SCALING FUNCTIONS ====================

/**
 * Scale based on screen width
 */
export const scale = (size: number): number => {
     return (SCREEN_WIDTH / guidelineBaseWidth) * size
}

/**
 * Scale based on screen height
 */
export const verticalScale = (size: number): number => {
     return (SCREEN_HEIGHT / guidelineBaseHeight) * size
}

/**
 * Moderate scale - less aggressive scaling
 * @param size - The base size
 * @param factor - Scaling factor (0-1), default 0.5
 */
export const moderateScale = (size: number, factor: number = 0.5): number => {
     return size + (scale(size) - size) * factor
}

/**
 * Clamp value between min and max
 */
export const clamp = (value: number, min: number, max: number): number => {
     return Math.max(min, Math.min(value, max))
}

/**
 * Normalize size with moderate scaling and pixel rounding
 */
export const normalize = (size: number): number => {
     const newSize = moderateScale(size)
     return Math.round(PixelRatio.roundToNearestPixel(newSize))
}

// ==================== DIMENSION UTILITIES ====================

/**
 * Width percentage to independent pixels
 */
export const wp = (widthPercent: number): number => {
     const elemWidth = typeof widthPercent === "number" ? widthPercent : parseFloat(widthPercent)
     return PixelRatio.roundToNearestPixel((SCREEN_WIDTH * elemWidth) / 100)
}

/**
 * Height percentage to independent pixels
 */
export const hp = (heightPercent: number): number => {
     const elemHeight =
          typeof heightPercent === "number" ? heightPercent : parseFloat(heightPercent)
     return PixelRatio.roundToNearestPixel((SCREEN_HEIGHT * elemHeight) / 100)
}

/**
 * Calculate window height (legacy support)
 */
export const windowHeight = (height: number): number => {
     if (!height) return 0
     let tempHeight = SCREEN_HEIGHT * (parseFloat(height.toString()) / 667)
     return PixelRatio.roundToNearestPixel(tempHeight)
}

/**
 * Calculate window width (legacy support)
 */
export const windowWidth = (width: number): number => {
     if (!width) return 0
     let tempWidth = SCREEN_WIDTH * (parseFloat(width.toString()) / 480)
     return PixelRatio.roundToNearestPixel(tempWidth)
}

// ==================== DEVICE DETECTION ====================

/**
 * Check if device is a tablet
 */
export const isTablet = (): boolean => {
     const pixelDensity = PixelRatio.get()
     const adjustedWidth = SCREEN_WIDTH * pixelDensity
     const adjustedHeight = SCREEN_HEIGHT * pixelDensity

     if (pixelDensity < 2 && (adjustedWidth >= 1000 || adjustedHeight >= 1000)) {
          return true
     }

     return pixelDensity === 2 && (adjustedWidth >= 1920 || adjustedHeight >= 1920)
}

/**
 * Get comprehensive screen dimensions and device info
 */
export const getScreenDimensions = () => ({
     width: SCREEN_WIDTH,
     height: SCREEN_HEIGHT,
     isSmallDevice: SCREEN_WIDTH < 375,
     isMediumDevice: SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 414,
     isLargeDevice: SCREEN_WIDTH >= 414,
     isTablet: isTablet() || IsIPAD,
     hasNotch,
     isIOS: IsIOS,
     isAndroid: IsAndroid,
})

// ==================== RESPONSIVE VALUES ====================

/**
 * Get responsive value based on screen width
 */
export const getResponsiveValue = <T>(values: {
     small?: T
     medium?: T
     large?: T
     tablet?: T
     default: T
}): T => {
     const { isSmallDevice, isMediumDevice, isTablet: deviceIsTablet } = getScreenDimensions()

     if (deviceIsTablet && values.tablet) {
          return values.tablet
     }
     if (isSmallDevice && values.small) {
          return values.small
     }
     if (isMediumDevice && values.medium) {
          return values.medium
     }
     if (values.large) {
          return values.large
     }
     return values.default
}

// ==================== SPACING UTILITIES ====================

/**
 * Get adaptive spacing based on design system
 */
export const getSpacing = (base: number = 8) => ({
     xs: moderateScale(base * 0.5),
     sm: moderateScale(base),
     md: moderateScale(base * 2),
     lg: moderateScale(base * 3),
     xl: moderateScale(base * 4),
     xxl: moderateScale(base * 5),
})

/**
 * Predefined spacing values
 */
export const spacing = {
     xs: moderateScale(4),
     sm: moderateScale(8),
     md: moderateScale(16),
     lg: moderateScale(24),
     xl: moderateScale(32),
     xxl: moderateScale(40),
} as const

// ==================== TOUCH TARGET UTILITIES ====================

/**
 * Minimum recommended touch target sizes
 */
export const touchTarget = {
     ios: 44,
     android: 48,
     minimum: Platform.select({ ios: 44, android: 48, default: 44 }),
} as const

/**
 * Get minimum touch target size
 */
export const getMinTouchTarget = (): number => {
     return moderateScale(touchTarget.minimum)
}

// ==================== BORDER RADIUS UTILITIES ====================

/**
 * Responsive border radius
 */
export const borderRadius = {
     sm: moderateScale(4),
     md: moderateScale(8),
     lg: moderateScale(12),
     xl: moderateScale(16),
     xxl: moderateScale(24),
     full: 9999,
} as const

// ==================== EXPORT SCREEN CONSTANTS ====================

export const SCREEN = {
     width: SCREEN_WIDTH,
     height: SCREEN_HEIGHT,
     isIOS: IsIOS,
     isAndroid: IsAndroid,
     isIPad: IsIPAD,
     hasNotch,
     isTablet: isTablet() || IsIPAD,
} as const
