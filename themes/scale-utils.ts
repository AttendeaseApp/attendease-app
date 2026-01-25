import { Dimensions, PixelRatio } from "react-native"

const { width, height } = Dimensions.get("window")

const guidelineBaseWidth = 375
const guidelineBaseHeight = 667

export const scale = (size: number) => (width / guidelineBaseWidth) * size

export const verticalScale = (size: number) => (height / guidelineBaseHeight) * size

export const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor

export const clamp = (value: number, min: number, max: number) =>
     Math.max(min, Math.min(value, max))

export const normalize = (size: number) => {
     const newSize = moderateScale(size)
     return Math.round(PixelRatio.roundToNearestPixel(newSize))
}
