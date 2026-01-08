import React, { createContext, useState, useContext, useEffect } from "react";
import { Platform } from "react-native";
import * as Font from "expo-font";

const LightTheme = {
  dark: false,
  colors: {
    background: "#ffffff",
    text: "#000000",
    destructive: "#EF4444",
  },
};

const customFonts = {
  "AfacadFlux-Light": require("@/assets/fonts/AfacadFlux-VariableFont.ttf"),
  "Fraunces-Variable": require("@/assets/fonts/Fraunces-VariableFont.ttf"),
};

interface ThemeContextType {
  theme: typeof LightTheme;
  fontsLoaded: boolean;
  defaultFontFamily: string;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: LightTheme,
  fontsLoaded: false,
  defaultFontFamily: "AfacadFlux-Light",
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme] = useState<ThemeContextType["theme"]>(LightTheme);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      try {
        await Font.loadAsync(customFonts);
        console.log("Fonts loaded successfully: AfacadFlux-Light");
      } catch (error) {
        console.warn("Font loading failed:", error);
      } finally {
        setFontsLoaded(true);
      }
    };
    initialize();
  }, []);

  const value: ThemeContextType = {
    theme,
    fontsLoaded,
    defaultFontFamily: fontsLoaded
      ? "AfacadFlux-Light"
      : Platform.OS === "ios"
        ? "System"
        : "Roboto",
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};
