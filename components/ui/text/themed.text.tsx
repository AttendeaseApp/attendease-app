import { Text, TextProps, TextStyle } from "react-native";
import { useTheme } from "@/context/theme.context";
import { typography, TextType } from "@/themes/typography.config";

export type ThemedTextProps = TextProps & {
  type?: TextType;
  colorVariant?: "black" | "white" | "gray";
  fontFamilyOverride?: string;
  fontWeightOverride?: TextStyle["fontWeight"];
  sizeMultiplier?: number;
};

export function ThemedText({
  style,
  type = "default",
  colorVariant = "black",
  fontFamilyOverride,
  fontWeightOverride,
  sizeMultiplier = 1,
  ...rest
}: ThemedTextProps) {
  const { defaultFontFamily, theme } = useTheme();
  const t = typography[type];

  const color =
    colorVariant === "white"
      ? "#fff"
      : colorVariant === "gray"
        ? "#999"
        : theme.colors.text;

  return (
    <Text
      {...rest}
      style={[
        {
          color,
          fontFamily: fontFamilyOverride ?? defaultFontFamily,
          fontSize: t.fontSize * sizeMultiplier,
          lineHeight: t.lineHeight ? t.lineHeight * sizeMultiplier : undefined,
          fontWeight: fontWeightOverride ?? t.fontWeight,
        },
        style,
      ]}
    />
  );
}
