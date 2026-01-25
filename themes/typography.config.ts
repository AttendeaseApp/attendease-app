import { getFontSize, getLineHeight } from "./font-sizes"
import { TextStyle } from "react-native"

export type TextType =
     | "default"
     | "defaultSemiBold"
     | "title"
     | "titleSecondary"
     | "subTitleSecondary"
     | "subtitle"
     | "loginTitle"
     | "link"
     | "caption"
     | "overline"
     | "h1"
     | "h2"
     | "h3"
     | "h4"
     | "body1"
     | "body2"

type TypographyStyle = {
     fontSize: number
     lineHeight: number
     fontWeight: NonNullable<TextStyle["fontWeight"]>
     letterSpacing?: number
}

/**
 * Comprehensive typography system
 * All values are responsive and scale across devices
 */
export const typography: Record<TextType, TypographyStyle> = {
     // Original text types (preserved for backward compatibility)
     default: {
          fontSize: getFontSize(16),
          lineHeight: getLineHeight(getFontSize(16)),
          fontWeight: "400",
     },
     defaultSemiBold: {
          fontSize: getFontSize(16),
          lineHeight: getLineHeight(getFontSize(16)),
          fontWeight: "600",
     },
     title: {
          fontSize: getFontSize(24),
          lineHeight: getLineHeight(getFontSize(24)),
          fontWeight: "500",
     },
     titleSecondary: {
          fontSize: getFontSize(22),
          lineHeight: getLineHeight(getFontSize(22)),
          fontWeight: "400",
     },
     subTitleSecondary: {
          fontSize: getFontSize(20),
          lineHeight: getLineHeight(getFontSize(20)),
          fontWeight: "400",
     },
     subtitle: {
          fontSize: getFontSize(18),
          lineHeight: getLineHeight(getFontSize(18)),
          fontWeight: "500",
     },
     loginTitle: {
          fontSize: getFontSize(28),
          lineHeight: getLineHeight(getFontSize(28)),
          fontWeight: "400",
     },
     link: {
          fontSize: getFontSize(14),
          lineHeight: getLineHeight(getFontSize(14)),
          fontWeight: "500",
     },

     // New Material Design-inspired text types
     h1: {
          fontSize: getFontSize(32),
          lineHeight: getLineHeight(getFontSize(32)),
          fontWeight: "600",
          letterSpacing: -0.5,
     },
     h2: {
          fontSize: getFontSize(28),
          lineHeight: getLineHeight(getFontSize(28)),
          fontWeight: "600",
          letterSpacing: -0.25,
     },
     h3: {
          fontSize: getFontSize(24),
          lineHeight: getLineHeight(getFontSize(24)),
          fontWeight: "500",
     },
     h4: {
          fontSize: getFontSize(20),
          lineHeight: getLineHeight(getFontSize(20)),
          fontWeight: "500",
     },
     body1: {
          fontSize: getFontSize(16),
          lineHeight: getLineHeight(getFontSize(16)),
          fontWeight: "400",
     },
     body2: {
          fontSize: getFontSize(14),
          lineHeight: getLineHeight(getFontSize(14)),
          fontWeight: "400",
     },
     caption: {
          fontSize: getFontSize(12),
          lineHeight: getLineHeight(getFontSize(12)),
          fontWeight: "400",
          letterSpacing: 0.4,
     },
     overline: {
          fontSize: getFontSize(10),
          lineHeight: getLineHeight(getFontSize(10)),
          fontWeight: "500",
          letterSpacing: 1.5,
     },
}

/**
 * Get typography style by type
 */
export const getTypography = (type: TextType): TypographyStyle => {
     return typography[type]
}

/**
 * Create custom typography style
 */
export const createTypographyStyle = (
     fontSize: number,
     fontWeight: TextStyle["fontWeight"] = "400",
     letterSpacing?: number
): TypographyStyle => {
     return {
          fontSize: getFontSize(fontSize),
          lineHeight: getLineHeight(getFontSize(fontSize)),
          fontWeight,
          ...(letterSpacing !== undefined && { letterSpacing }),
     }
}
