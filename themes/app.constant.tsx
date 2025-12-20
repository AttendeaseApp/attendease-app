import { DimensionValue, Dimensions, PixelRatio, Platform } from "react-native";
import { getStatusBarHeight } from "react-native-status-bar-height";

export const SCREEN_HEIGHT = Dimensions.get("window").height;
export const SCREEN_WIDTH = Dimensions.get("window").width;

export const IsIOS = Platform.OS === "ios";
export const IsIPAD = IsIOS && SCREEN_HEIGHT / SCREEN_WIDTH < 1.6;
export const IsAndroid = Platform.OS === "android";

export const IsHaveNotch = IsIOS && SCREEN_HEIGHT > 750;
export const hasNotch = Platform.OS === "ios" && getStatusBarHeight() > 20;
export const Isiphone12promax = IsIOS && SCREEN_HEIGHT > 2778;

export const windowHeight = (height: DimensionValue): number => {
    if (!height) {
        return 0;
    }
    let tempHeight = SCREEN_HEIGHT * (parseFloat(height.toString()) / 667);
    return PixelRatio.roundToNearestPixel(tempHeight);
};

export const windowWidth = (width: DimensionValue): number => {
    if (!width) {
        return 0;
    }
    let tempWidth = SCREEN_WIDTH * (parseFloat(width.toString()) / 480);
    return PixelRatio.roundToNearestPixel(tempWidth);
};

export const fontSizes = {
    FONT6: Math.min(windowWidth(6), 20),
    FONT7: Math.min(windowWidth(7), 22),
    FONT8: Math.min(windowWidth(8), 24),
    FONT9: Math.min(windowWidth(9), 26),
    FONT10: Math.min(windowWidth(10), 28),
    FONT11: Math.min(windowWidth(11), 30),
    FONT12: Math.min(windowWidth(12), 32),
    FONT13: Math.min(windowWidth(13), 34),
    FONT14: Math.min(windowWidth(14), 36),
    FONT15: Math.min(windowWidth(15), 38),
    FONT16: Math.min(windowWidth(16), 40),
    FONT17: Math.min(windowWidth(17), 42),
    FONT18: Math.min(windowWidth(18), 44),
    FONT19: Math.min(windowWidth(19), 46),
    FONT20: Math.min(windowWidth(20), 48),
    FONT21: Math.min(windowWidth(21), 50),
    FONT22: Math.min(windowWidth(22), 52),
    FONT23: Math.min(windowWidth(23), 54),
    FONT24: Math.min(windowWidth(24), 56),
    FONT25: Math.min(windowWidth(25), 58),
    FONT26: Math.min(windowWidth(26), 60),
    FONT27: Math.min(windowWidth(27), 62),
    FONT28: Math.min(windowWidth(28), 64),
    FONT30: Math.min(windowWidth(30), 66),
    FONT32: Math.min(windowWidth(32), 70),
    FONT35: Math.min(windowWidth(35), 72),
} as const;

export type FontSizeKey = keyof typeof fontSizes;

export const getFontSize = (base: number): number => {
    const key = `FONT${base}` as FontSizeKey;
    return fontSizes[key] ?? Math.min(windowWidth(base), 22);
};
