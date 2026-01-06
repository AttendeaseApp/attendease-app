import React, { useState, useEffect } from "react";
import { StyleSheet, StatusBar, View, TouchableOpacity, Modal, ActivityIndicator, Alert } from "react-native";
import { verticalScale, moderateScale } from "react-native-size-matters";
import { ThemedText } from "@/components/ui/text/themed.text";
import { getUserProfileDataService } from "@/server/service/api/profile/profile-service";
import { UserStudentResponse } from "@/domain/interface/user/student/user-student.response";
import { logoutService } from "@/server/service/api/profile/logout-service";
import { Button, ButtonText } from "@/components/ui/button";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AttendanceHistories from "@/components/profile/history/attendance.history.feed";

export default function ProfileScreen() {
    const [profile, setProfile] = useState<UserStudentResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
    const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
    const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
    const [isMoreInfoOpen, setIsMoreInfoOpen] = useState(false);

    const router = useRouter();

    useEffect(() => {
        getUserProfileDataService(setProfile, setLoading);
    }, []);

    const handleLogout = () => {
        setIsSettingsMenuOpen(false);
        setIsLogoutDialogOpen(true);
    };

    const handleAccountSettings = () => {
        setIsSettingsMenuOpen(false);
        router.push("/(routes)/(account)/settings");
    };

    const handleMoreInfo = () => {
        setIsMoreInfoOpen(true);
    };

    const confirmLogout = async () => {
        setIsLogoutDialogOpen(false);
        setIsLoggingOut(true);
        try {
            await logoutService();
            setIsSuccessDialogOpen(true);
        } catch (error) {
            console.error("Logout error:", error);
            Alert.alert("Error", "Logout Issue");
        } finally {
            setIsLoggingOut(false);
        }
    };

    const cancelLogout = () => {
        setIsLogoutDialogOpen(false);
    };

    const handleSuccessOK = () => {
        setIsSuccessDialogOpen(false);
        router.replace("/(routes)/login");
    };

    useEffect(() => {
        if (isLogoutDialogOpen) {
            Alert.alert(
                "Confirm Logout",
                "Are you sure you want to log out?",
                [
                    { text: "Cancel", onPress: cancelLogout, style: "cancel" },
                    { text: "Confirm", onPress: confirmLogout },
                ],
                { cancelable: true, onDismiss: cancelLogout },
            );
        }
    }, [isLogoutDialogOpen]);

    useEffect(() => {
        if (isSuccessDialogOpen) {
            Alert.alert("Logged Out!", "See you soon!", [{ text: "Bye!", onPress: handleSuccessOK }], { cancelable: false });
        }
    }, [isSuccessDialogOpen]);

    if (loading) {
        return (
            <View style={styles.centerWrapper}>
                <ActivityIndicator size="large" color="#27548A" />
            </View>
        );
    }

    if (!profile) {
        return (
            <View style={styles.centerWrapper}>
                <ThemedText type="title">Failed to load profile.</ThemedText>
                <Button action="primary" variant="solid" size="md" onPress={() => getUserProfileDataService(setProfile, setLoading)} style={{ marginTop: 20 }}>
                    <ButtonText>Retry</ButtonText>
                </Button>
            </View>
        );
    }

    const { firstName, lastName, userType, createdAt, updatedAt, studentNumber, course, section, cluster, biometricStatus, biometricCreatedAt, biometricLastUpdated } = profile;

    return (
        <View style={{ flex: 1 }}>
            <View style={styles.headerContainer}>
                <StatusBar barStyle="dark-content" />
                <View style={styles.contentWrapper}>
                    <View style={styles.profileSection}>
                        <View style={styles.profileInfo}>
                            <ThemedText type="title">
                                {firstName} {lastName}
                            </ThemedText>
                            <View>
                                <ThemedText type="default" style={styles.infoText}>
                                    User Type: {userType}
                                </ThemedText>
                                <ThemedText type="default" style={styles.infoText}>
                                    Student Number: {studentNumber || "Unavailable"}
                                </ThemedText>
                                <ThemedText type="default" style={styles.infoText}>
                                    {course || "Course Unavailable"} | {section || "Section Unavailable"} | {cluster || "Cluster Unavailable"}
                                </ThemedText>
                                <ThemedText type="default" style={styles.infoText}>
                                    Biometrics: {biometricStatus || "Unavailable"}
                                </ThemedText>
                            </View>
                        </View>
                        <View style={styles.actionButtons}>
                            <TouchableOpacity style={styles.actionButton} onPress={handleMoreInfo}>
                                <Ionicons name="information-circle-outline" size={moderateScale(24)} color="#6B7280" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.settingsButton} onPress={() => setIsSettingsMenuOpen(true)}>
                                <Ionicons name="options-outline" size={moderateScale(24)} color="#6B7280" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>

            {/* More Info Modal */}
            <Modal visible={isMoreInfoOpen} transparent onRequestClose={() => setIsMoreInfoOpen(false)}>
                <TouchableOpacity style={styles.modalOverlay} onPress={() => setIsMoreInfoOpen(false)} />
                <View style={styles.moreInfoMenu}>
                    <View style={styles.menuHeader}>
                        <ThemedText type="subtitle" style={styles.menuTitle}>
                            ACCOUNT INFO
                        </ThemedText>
                        <TouchableOpacity onPress={() => setIsMoreInfoOpen(false)}>
                            <Ionicons name="close" size={24} color="#111827" />
                        </TouchableOpacity>
                    </View>
                    <ThemedText type="default">Account Created: {createdAt}</ThemedText>
                    <ThemedText type="default">Account Last Updated: {updatedAt}</ThemedText>
                    <ThemedText type="default">Biometrics Added: {biometricCreatedAt || "Unavailable"}</ThemedText>
                    <ThemedText type="default">Biometrics Last Updated: {biometricLastUpdated || "Unavailable"}</ThemedText>
                </View>
            </Modal>

            {/* Settings Menu */}
            <Modal visible={isSettingsMenuOpen} transparent onRequestClose={() => setIsSettingsMenuOpen(false)}>
                <TouchableOpacity style={styles.modalOverlay} onPress={() => setIsSettingsMenuOpen(false)} />
                <View style={styles.settingsMenu}>
                    <View style={styles.menuHeader}>
                        <ThemedText type="subtitle" style={styles.menuTitle}>
                            OPTIONS
                        </ThemedText>
                        <TouchableOpacity onPress={() => setIsSettingsMenuOpen(false)}>
                            <Ionicons name="close" size={24} color="#111827" />
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity style={styles.menuItem} onPress={handleAccountSettings}>
                        <Ionicons name="cog-outline" size={24} color="#111827" />
                        <ThemedText type="default" style={styles.menuItemText}>
                            Settings
                        </ThemedText>
                        <Ionicons name="chevron-forward" size={20} color="#6B7280" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem} onPress={handleLogout} disabled={isLoggingOut}>
                        <Ionicons name="log-out-outline" size={24} color="#A31621" />
                        <ThemedText type="default" style={[styles.menuItemText, { color: "#A31621" }]}>
                            Logout
                        </ThemedText>
                        {isLoggingOut && <ActivityIndicator size="small" color="#A31621" />}
                    </TouchableOpacity>
                </View>
            </Modal>
            <AttendanceHistories />
        </View>
    );
}

const styles = StyleSheet.create({
    headerContainer: {
        padding: 16,
        paddingBottom: 24,
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
        zIndex: 13,
    },
    contentWrapper: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
    },
    centerWrapper: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    profileSection: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
        marginTop: verticalScale(40),
    },
    profileInfo: {
        flex: 1,
        gap: 8,
    },
    infoText: {
        color: "#6B7280",
    },
    actionButtons: {
        flexDirection: "row",
        gap: moderateScale(12),
    },
    actionButton: {
        justifyContent: "center",
        alignItems: "center",
        padding: moderateScale(8),
        borderRadius: moderateScale(8),
        backgroundColor: "rgba(107, 114, 128, 0.1)",
        minWidth: moderateScale(44),
        minHeight: moderateScale(44),
    },
    settingsButton: {
        justifyContent: "center",
        alignItems: "center",
        padding: moderateScale(8),
        borderRadius: moderateScale(8),
        backgroundColor: "rgba(107, 114, 128, 0.1)",
        minWidth: moderateScale(44),
        minHeight: moderateScale(44),
    },
    modalOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.3)",
    },
    moreInfoMenu: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "#FFFFFF",
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        padding: 20,
    },
    settingsMenu: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "#FFFFFF",
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        padding: 20,
    },
    menuHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },
    menuTitle: {
        fontSize: 20,
    },
    menuItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 16,
        gap: 12,
    },
    menuItemText: {
        flex: 1,
        fontSize: 16,
    },
});
