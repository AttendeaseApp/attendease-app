import { Pressable, Text, View } from "react-native";
import React from "react";
import { router, Stack } from "expo-router";
import { useTheme } from "@/context/theme.context";
import { fontSizes } from "@/themes/app.constant";
import { AntDesign } from "@expo/vector-icons";
import { scale } from "react-native-size-matters";

export default function _layout() {
  const { theme } = useTheme();

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Course Access",
          headerTitleStyle: {
            color: theme.dark ? "#fff" : "#000",
            fontSize: fontSizes.FONT22,
          },
          headerTitleAlign:"center",
          headerStyle: { backgroundColor: theme.dark ? "#131313" : "#fff" },
          headerShadowVisible: true,
          headerBackVisible: false,
          headerLeft: () => (
            <Pressable
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: scale(5),
              }}
              onPress={() => router.back()}
            >
              <AntDesign
                name="left"
                size={scale(20)}
                color={theme.dark ? "#fff" : "#005DE0"}
              />
              <Text
                style={{
                  color: theme?.dark ? "#fff" : "#005DE0",
                  fontSize: fontSizes.FONT20,
                }}
              >
                Back
              </Text>
            </Pressable>
          ),
        }}
      />
    </Stack>
  );
}
