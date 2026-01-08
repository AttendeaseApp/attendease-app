import { View, StyleSheet } from "react-native";
import React from "react";
import { useTheme } from "@/context/theme.context";
import { Tabs } from "expo-router";
import { Octicons } from "@expo/vector-icons";
import { moderateScale, scale, verticalScale } from "react-native-size-matters";
import { IsAndroid, IsIOS, IsIPAD } from "@/themes/app.constant";
import { BlurView } from "expo-blur";
import { ThemedText } from "@/components/ui/text/themed.text";

export default function Layout() {
  const { theme } = useTheme();
  return (
    <Tabs
      screenOptions={({ route }) => {
        return {
          tabBarIcon: ({ color }) => {
            let iconName;
            if (route.name === "index") {
              iconName = (
                <Octicons
                  name="home"
                  size={moderateScale(18)}
                  style={{ width: IsIPAD ? scale(20) : "auto" }}
                  color={color}
                />
              );
            } else if (route.name === "profile/index") {
              iconName = (
                <Octicons
                  name="person"
                  size={moderateScale(18)}
                  style={{ width: IsIPAD ? scale(20) : "auto" }}
                  color={color}
                />
              );
            }
            return iconName;
          },
          tabBarActiveTintColor: "#463F3A",
          tabBarInactiveTintColor: "#8e8e93",
          headerShown: false,
          tabBarShowLabel: true,
          tabBarStyle: {
            position: "absolute",
            borderTopWidth: 0,
            height: verticalScale(55),
            elevation: 0,
            shadowOpacity: 0,
          },
          tabBarBackground: () => {
            return (
              <>
                {IsIOS && !theme.dark ? (
                  <View
                    style={{
                      ...StyleSheet.absoluteFillObject,
                      backgroundColor: "#fff",
                      overflow: "hidden",
                      borderTopWidth: 1,
                      borderTopColor: "rgba(0,0,0,0.1)",
                    }}
                  />
                ) : (
                  <BlurView
                    intensity={theme.dark ? (IsAndroid ? 10 : 60) : 100}
                    style={{
                      ...StyleSheet.absoluteFillObject,
                      overflow: "hidden",
                      backgroundColor: IsAndroid ? "#fff" : "#fff",
                      borderTopWidth: 1,
                      borderTopColor: "rgba(0,0,0,0.1)",
                    }}
                  />
                )}
              </>
            );
          },
        };
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: ({ color }) => (
            <ThemedText
              style={{
                fontSize: 12,
                color,
              }}
            >
              HOME
            </ThemedText>
          ),
        }}
      />

      <Tabs.Screen
        name="profile/index"
        options={{
          tabBarLabel: ({ color }) => (
            <ThemedText
              style={{
                fontSize: 12,
                color,
              }}
            >
              PROFILE
            </ThemedText>
          ),
        }}
      />
    </Tabs>
  );
}
