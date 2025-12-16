import { Text, StyleProp, TextStyle } from "react-native";
import React from "react";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";

interface GradientTextProps {
    text: string;
    styles?: StyleProp<TextStyle>;
    colors?: [string, string];
}

export default function GradientText({ text, styles, colors = ["#6D55FE", "#8976FC"] }: GradientTextProps) {
    return (
        <MaskedView maskElement={<Text style={[styles, { backgroundColor: "transparent" }]}>{text}</Text>}>
            <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Text style={[styles, { opacity: 1 }]}>{text}</Text>
            </LinearGradient>
        </MaskedView>
    );
}
