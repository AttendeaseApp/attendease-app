import { fontSizes } from "@/themes/app.constant";
import { TextStyle } from "react-native";

export type TextType =
  | "default"
  | "defaultSemiBold"
  | "title"
  | "titleSecondary"
  | "subTitleSecondary"
  | "subtitle"
  | "loginTitle"
  | "link";

type FontWeight = NonNullable<TextStyle["fontWeight"]>;

type TypographyStyle = {
  fontSize: number;
  lineHeight?: number;
  fontWeight: FontWeight;
  fontVariationSettings?: string;
  maxFontSize?: number;
};

export const typography: Record<TextType, TypographyStyle> = {
  default: {
    fontSize: fontSizes.FONT19,
    lineHeight: Math.round(fontSizes.FONT19 * (28 / 19)),
    fontWeight: "400",
    fontVariationSettings: "'opsz' 19",
    maxFontSize: fontSizes.FONT10,
  },

  defaultSemiBold: {
    fontSize: fontSizes.FONT17,
    lineHeight: Math.round(fontSizes.FONT17 * (24 / 17)),
    fontWeight: "600",
    fontVariationSettings: "'opsz' 17",
    maxFontSize: fontSizes.FONT10,
  },

  title: {
    fontSize: fontSizes.FONT25,
    lineHeight: Math.round(fontSizes.FONT25 * (32 / 25)),
    fontWeight: "500",
    fontVariationSettings: "'opsz' 25",
    maxFontSize: fontSizes.FONT10,
  },

  titleSecondary: {
    fontSize: fontSizes.FONT28,
    lineHeight: Math.round(fontSizes.FONT28 * (30 / 28)),
    fontWeight: "400",
    fontVariationSettings: "'opsz' 28",
    maxFontSize: fontSizes.FONT10,
  },

  subTitleSecondary: {
    fontSize: fontSizes.FONT22,
    lineHeight: Math.round(fontSizes.FONT22 * (30 / 22)),
    fontWeight: "400",
    fontVariationSettings: "'opsz' 22",
    maxFontSize: fontSizes.FONT10,
  },

  subtitle: {
    fontSize: fontSizes.FONT20,
    fontWeight: "500",
    fontVariationSettings: "'opsz' 20",
    maxFontSize: fontSizes.FONT10,
  },

  loginTitle: {
    fontSize: fontSizes.FONT35,
    fontWeight: "400",
    fontVariationSettings: "'opsz' 35",
    maxFontSize: fontSizes.FONT10,
  },

  link: {
    fontSize: fontSizes.FONT16,
    lineHeight: Math.round(fontSizes.FONT16 * (30 / 16)),
    fontWeight: "500",
    maxFontSize: fontSizes.FONT10,
  },
};
