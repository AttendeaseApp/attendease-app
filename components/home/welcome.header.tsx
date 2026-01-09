import { retrieveUserInfoForHomepage } from "@/server/service/api/homepage/user-info-service";
import { IsHaveNotch, IsIPAD } from "@/themes/app.constant";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import { StatusBar, View, ActivityIndicator } from "react-native";
import { verticalScale } from "react-native-size-matters";
import { ThemedText } from "../ui/text/themed.text";

export default function WelcomeHeader() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{
    firstName: string;
    lastName: string;
  } | null>(null);

  useFocusEffect(
    useCallback(() => {
      retrieveUserInfoForHomepage(setUser, setLoading);
    }, []),
  );
    
  if (loading) {
    return (
      <View>
        <ActivityIndicator size="large" color="#27548A" />
        <ThemedText type="default" style={{ marginTop: 12, opacity: 0.6 }}>
          Loading
        </ThemedText>
      </View>
    );
  }

  return (
    <View
      style={{
        padding: 16,
        borderEndEndRadius: 12,
        borderEndStartRadius: 12,
      }}
    >
      <StatusBar barStyle={"dark-content"} />
      <View
        style={{
          flexDirection: "row",
          paddingTop: IsHaveNotch
            ? IsIPAD
              ? verticalScale(30)
              : verticalScale(40)
            : verticalScale(30),
          justifyContent: "space-between",
        }}
      >
        <View>
          <ThemedText type="title">RCIANS ATTENDEASE</ThemedText>
          {user ? (
            <ThemedText type="subTitleSecondary">
              Welcome {user.firstName}!
            </ThemedText>
          ) : (
            <ThemedText type="subTitleSecondary">Welcome!</ThemedText>
          )}
        </View>
      </View>
    </View>
  );
}
