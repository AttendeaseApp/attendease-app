import { getFontSize } from "./font-sizes"

export type TextType =
     | "default"
     | "defaultSemiBold"
     | "title"
     | "titleSecondary"
     | "subTitleSecondary"
     | "subtitle"
     | "loginTitle"
     | "link"

type TypographyStyle = {
     fontSize: number
     lineHeight?: number
     fontWeight: "400" | "500" | "600"
}

export const typography: Record<TextType, TypographyStyle> = {
     default: {
          fontSize: getFontSize(16),
          lineHeight: getFontSize(22),
          fontWeight: "400",
     },

     defaultSemiBold: {
          fontSize: getFontSize(16),
          lineHeight: getFontSize(22),
          fontWeight: "600",
     },

     title: {
          fontSize: getFontSize(24),
          lineHeight: getFontSize(32),
          fontWeight: "500",
     },

     titleSecondary: {
          fontSize: getFontSize(22),
          lineHeight: getFontSize(30),
          fontWeight: "400",
     },

     subTitleSecondary: {
          fontSize: getFontSize(20),
          lineHeight: getFontSize(28),
          fontWeight: "400",
     },

     subtitle: {
          fontSize: getFontSize(18),
          lineHeight: getFontSize(24),
          fontWeight: "500",
     },

     loginTitle: {
          fontSize: getFontSize(28),
          lineHeight: getFontSize(36),
          fontWeight: "400",
     },

     link: {
          fontSize: getFontSize(14),
          lineHeight: getFontSize(20),
          fontWeight: "500",
     },
}
