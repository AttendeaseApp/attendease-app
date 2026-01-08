import { ThemedText } from "@/components/ui/text/themed.text";
import { getAutoRegisterSetting, saveAutoRegisterSetting } from "@/utils/settings/auto-registration.settings";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ScrollView, StatusBar, StyleSheet, Switch, TouchableOpacity, View, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AccountSettingsScreen() {
    const router = useRouter();
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [autoRegisterEnabled, setAutoRegisterEnabled] = useState(false);

    useEffect(() => {
        const loadSettings = async () => {
            const enabled = await getAutoRegisterSetting();
            setAutoRegisterEnabled(enabled);
        };
        loadSettings();
    }, []);

    const handleAutoRegisterToggle = async (value: boolean) => {
        setAutoRegisterEnabled(value);
        await saveAutoRegisterSetting(value);
    };

    const confirmDeleteBiometrics = () => {
        Alert.alert(
            "Delete Biometrics?",
            "This action cannot be undone. Your facial data will be permanently deleted from our servers.",
            [
                {
                    text: "Cancel",
                    style: "cancel",
                },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => {
                        alert("Biometrics deletion functionality to be implemented");
                    },
                },
            ],
            { cancelable: true },
        );
    };

    const securitySettings = [
        {
            title: "Change Password",
            description: "Update your account password",
            onPress: () => router.push("/(routes)/(account)/password"),
            type: "navigation" as const,
        },
    ];

    const notificationSettings = [
        {
            title: "Push Notifications",
            description: "Receive notifications on this device",
            type: "toggle" as const,
            value: notificationsEnabled,
            onToggle: setNotificationsEnabled,
        },
    ];

    const registrationSettings = [
        {
            title: "Auto-Register for Events",
            description: "Automatically register when facial verification is not required",
            type: "toggle" as const,
            value: autoRegisterEnabled,
            onToggle: handleAutoRegisterToggle,
        },
    ];

    const renderSettingItem = (setting: any, index: number, array: any[]) => {
        const isLast = index === array.length - 1;

        const content = (
            <>
                <View style={styles.settingTextContainer}>
                    <ThemedText type="default" style={styles.settingTitle}>
                        {setting.title}
                    </ThemedText>
                    <ThemedText type="default" style={styles.settingDescription}>
                        {setting.description}
                    </ThemedText>
                </View>

                {setting.type === "toggle" ? (
                    <Switch value={setting.value} onValueChange={setting.onToggle} trackColor={{ false: "#D1D5DB", true: "#27548A40" }} thumbColor={setting.value ? "#27548A" : "#F3F4F6"} />
                ) : (
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                )}
            </>
        );

        if (setting.type === "navigation") {
            return (
                <TouchableOpacity key={index} onPress={setting.onPress} activeOpacity={0.7} style={[styles.settingItem, !isLast && styles.settingItemBorder]}>
                    {content}
                </TouchableOpacity>
            );
        }

        return (
            <View key={index} style={[styles.settingItem, !isLast && styles.settingItemBorder]}>
                {content}
            </View>
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
            <StatusBar barStyle={"dark-content"} />
            <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
                <View>
                    <View style={styles.header}>
                        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                            <Ionicons name="arrow-back" size={24} color="#111827" />
                        </TouchableOpacity>
                        <ThemedText type="title">SETTINGS</ThemedText>
                    </View>
                </View>

                <View style={styles.content}>
                    {/*security*/}
                    <View style={styles.section}>
                        <ThemedText type="subtitle" style={styles.sectionTitle}>
                            Security
                        </ThemedText>
                        <View style={styles.settingsGroup}>{securitySettings.map((setting, index) => renderSettingItem(setting, index, securitySettings))}</View>
                    </View>

                    {/*event registration*/}
                    <View style={styles.section}>
                        <ThemedText type="subtitle" style={styles.sectionTitle}>
                            Event Registration
                        </ThemedText>
                        <View style={styles.settingsGroup}>{registrationSettings.map((setting, index) => renderSettingItem(setting, index, registrationSettings))}</View>
                    </View>

                    {/*notifications*/}
                    <View style={styles.section}>
                        <ThemedText type="subtitle" style={styles.sectionTitle}>
                            Notifications
                        </ThemedText>
                        <View style={styles.settingsGroup}>{notificationSettings.map((setting, index) => renderSettingItem(setting, index, notificationSettings))}</View>
                    </View>

                    {/*data privacy*/}
                    <View style={styles.section}>
                        <ThemedText type="subtitle" style={styles.sectionTitle}>
                            Data & Privacy
                        </ThemedText>
                        <View style={styles.settingsGroup}>
                            <TouchableOpacity style={styles.settingItem} onPress={() => alert("Privacy policy coming soon")}>
                                <View style={styles.settingTextContainer}>
                                    <ThemedText type="default" style={styles.settingTitle}>
                                        Privacy Policy
                                    </ThemedText>
                                    <ThemedText type="default" style={styles.settingDescription}>
                                        Read our privacy policy
                                    </ThemedText>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                            </TouchableOpacity>
                            <View style={styles.settingItemBorder} />
                        </View>
                    </View>

                    {/*danger zone*/}
                    <View style={styles.section}>
                        <ThemedText type="subtitle" style={[styles.sectionTitle, { color: "#EF4444" }]}>
                            Danger Zone
                        </ThemedText>
                        <View style={styles.settingsGroup}>
                            <TouchableOpacity style={styles.settingItem} onPress={confirmDeleteBiometrics}>
                                <View style={styles.settingTextContainer}>
                                    <ThemedText type="default" style={[styles.settingTitle, { color: "#EF4444" }]}>
                                        Delete My Biometrics
                                    </ThemedText>
                                    <ThemedText type="default" style={styles.settingDescription}>
                                        Permanently delete your facial data
                                    </ThemedText>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#EF4444" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/*about*/}
                    <View style={styles.section}>
                        <ThemedText type="subtitle" style={styles.sectionTitle}>
                            About
                        </ThemedText>
                        <View style={styles.settingsGroup}>
                            <View style={styles.infoItem}>
                                <ThemedText type="default" style={styles.infoLabel}>
                                    App Version
                                </ThemedText>
                                <ThemedText type="default" style={styles.infoValue}>
                                    2.0.0-beta
                                </ThemedText>
                            </View>
                            <View style={styles.settingItemBorder} />
                            <View style={styles.infoItem}>
                                <ThemedText type="default" style={styles.infoLabel}>
                                    Build Number
                                </ThemedText>
                                <ThemedText type="default" style={styles.infoValue}>
                                    100
                                </ThemedText>
                            </View>
                            <View style={styles.settingItemBorder} />
                            <TouchableOpacity style={styles.infoItem} onPress={() => alert("Terms of Service coming soon")}>
                                <ThemedText type="default" style={styles.infoLabel}>
                                    Terms of Service
                                </ThemedText>
                                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
    },
    backButton: {
        justifyContent: "center",
        alignItems: "center",
        marginRight: 16,
    },
    content: {
        padding: 16,
        paddingBottom: 40,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 14,
        color: "#6B7280",
        textTransform: "uppercase",
        letterSpacing: 0.5,
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    settingsGroup: {
        backgroundColor: "#FFFFFF",
        borderRadius: 8,
        overflow: "hidden",
    },
    settingItem: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        gap: 12,
    },
    settingItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: "#F3F4F6",
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: "center",
        alignItems: "center",
    },
    settingTextContainer: {
        flex: 1,
        gap: 4,
    },
    settingTitle: {
        fontSize: 16,
        color: "#111827",
    },
    settingDescription: {
        fontSize: 14,
        color: "#6B7280",
    },
    infoItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
    },
    infoLabel: {
        fontSize: 15,
        color: "#6B7280",
    },
    infoValue: {
        fontSize: 15,
        color: "#111827",
    },
});
