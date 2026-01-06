import { IsHaveNotch, IsIPAD } from "@/themes/app.constant";
import React, { useState, useRef, useEffect } from "react";
import { StyleSheet, StatusBar, View, TouchableOpacity, Modal, Animated } from "react-native";
import { verticalScale, moderateScale } from "react-native-size-matters";
import { ThemedText } from "@/components/ui/text/themed.text";
import { getUserProfileDataService } from "@/server/service/api/profile/profile-service";
import { UserStudentResponse } from "@/domain/interface/user/student/user-student.response";
import { ActivityIndicator } from "react-native";
import { logoutService } from "@/server/service/api/profile/logout-service";
import { AlertDialog, AlertDialogBody, AlertDialogContent, AlertDialogFooter, AlertDialogHeader } from "@/components/ui/alert-dialog";
import { Button, ButtonText, ButtonSpinner } from "@/components/ui/button";
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
    const slideAnim = useRef(new Animated.Value(300)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const screenFadeAnim = useRef(new Animated.Value(0)).current;
    const screenSlideAnim = useRef(new Animated.Value(20)).current;
    const moreInfoSlideAnim = useRef(new Animated.Value(300)).current;
    const moreInfoFadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        getUserProfileDataService(setProfile, setLoading);
    }, []);

    useEffect(() => {
        if (isSettingsMenuOpen) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 250,
                    useNativeDriver: true,
                }),
                Animated.spring(slideAnim, {
                    toValue: 0,
                    tension: 65,
                    friction: 9,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            // Animate out
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 300,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [isSettingsMenuOpen]);

    useEffect(() => {
        if (isMoreInfoOpen) {
            Animated.parallel([
                Animated.timing(moreInfoFadeAnim, {
                    toValue: 1,
                    duration: 250,
                    useNativeDriver: true,
                }),
                Animated.spring(moreInfoSlideAnim, {
                    toValue: 0,
                    tension: 65,
                    friction: 9,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            // Animate out
            Animated.parallel([
                Animated.timing(moreInfoFadeAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(moreInfoSlideAnim, {
                    toValue: 300,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [isMoreInfoOpen]);

    const handleLogout = () => {
        setIsSettingsMenuOpen(false);
        setIsLogoutDialogOpen(true);
    };

    const handleAccountSettings = () => {
        setIsSettingsMenuOpen(false);
        setTimeout(() => {
            router.push("/(routes)/(account)/settings");
        }, 150);
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
            alert("Logout Issue");
        } finally {
            setIsLoggingOut(false);
        }
    };

    const cancelLogout = () => {
        setIsLogoutDialogOpen(false);
    };

    const handleSuccessOK = () => {
        setIsSuccessDialogOpen(false);
        Animated.parallel([
            Animated.timing(screenFadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(screenSlideAnim, {
                toValue: -20,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start(() => {
            router.replace("/(routes)/login");
        });
    };

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
        <Animated.View
            style={{
                flex: 1,
                opacity: screenFadeAnim,
                transform: [{ translateY: screenSlideAnim }],
            }}
        >
            <View style={styles.headerContainer}>
                <StatusBar barStyle="light-content" />
                <View style={styles.contentWrapper}>
                    <View style={styles.profileSection}>
                        <View style={styles.profileInfo}>
                            <ThemedText type="title">
                                {firstName} {lastName}
                            </ThemedText>
                            <View>
                                <View style={styles.infoRow}>
                                    <View>
                                        <ThemedText type="default" style={styles.infoText} numberOfLines={1}>
                                            {userType}
                                        </ThemedText>
                                    </View>
                                </View>
                                <View style={styles.infoRow}>
                                    <View>
                                        <ThemedText type="default" style={styles.infoText} numberOfLines={1}>
                                            {studentNumber || "Student Number Unavailable"}
                                        </ThemedText>
                                    </View>
                                </View>
                                <View style={styles.infoRow}>
                                    <View>
                                        <ThemedText type="default" style={styles.infoText} numberOfLines={1}>
                                            {course || "Course Unavailable"} | {section || "Section Unavailable"} | {cluster || "Cluster Unavailable"}
                                        </ThemedText>
                                    </View>
                                </View>
                                <View style={styles.infoRow}>
                                    <View>
                                        <ThemedText type="default" style={styles.infoText} numberOfLines={1}>
                                            Biometrics: {biometricStatus || "Unavailable"}
                                        </ThemedText>
                                    </View>
                                </View>
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

                {/* More Info Modal */}
                <Modal visible={isMoreInfoOpen} transparent={true} animationType="none" onRequestClose={() => setIsMoreInfoOpen(false)}>
                    <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setIsMoreInfoOpen(false)}>
                        <Animated.View
                            style={[
                                styles.modalOverlayBackground,
                                {
                                    opacity: moreInfoFadeAnim,
                                },
                            ]}
                        />
                    </TouchableOpacity>
                    <Animated.View
                        style={[
                            styles.moreInfoMenu,
                            {
                                transform: [{ translateY: moreInfoSlideAnim }],
                            },
                        ]}
                    >
                        <View style={styles.menuHeader}>
                            <ThemedText type="subtitle" style={styles.menuTitle}>
                                ACCOUNT INFO
                            </ThemedText>
                            <TouchableOpacity onPress={() => setIsMoreInfoOpen(false)}>
                                <Ionicons name="close" size={24} color="#111827" />
                            </TouchableOpacity>
                        </View>
                        <View>
                            <View>
                                <ThemedText type="default" style={styles.infoLabel}>
                                    Account Created:
                                </ThemedText>
                                <ThemedText type="default" style={styles.infoValue}>
                                    {createdAt}
                                </ThemedText>
                            </View>

                            <View>
                                <ThemedText type="default" style={styles.infoLabel}>
                                    Account Last Updated:
                                </ThemedText>
                                <ThemedText type="default" style={styles.infoValue}>
                                    {updatedAt}
                                </ThemedText>
                            </View>

                            <View>
                                <ThemedText type="default" style={styles.infoLabel}>
                                    Biometrics Added:
                                </ThemedText>
                                <ThemedText type="default" style={styles.infoValue}>
                                    {biometricCreatedAt || "Unavailable"}
                                </ThemedText>
                            </View>

                            <View>
                                <ThemedText type="default" style={styles.infoLabel}>
                                    Biometrics Last Updated:
                                </ThemedText>
                                <ThemedText type="default" style={styles.infoValue}>
                                    {biometricLastUpdated || "Unavailable"}
                                </ThemedText>
                            </View>
                        </View>
                    </Animated.View>
                </Modal>

                {/*menu*/}
                <Modal visible={isSettingsMenuOpen} transparent={true} animationType="none" onRequestClose={() => setIsSettingsMenuOpen(false)}>
                    <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setIsSettingsMenuOpen(false)}>
                        <Animated.View
                            style={[
                                styles.modalOverlayBackground,
                                {
                                    opacity: fadeAnim,
                                },
                            ]}
                        />
                    </TouchableOpacity>
                    <Animated.View
                        style={[
                            styles.settingsMenu,
                            {
                                transform: [{ translateY: slideAnim }],
                            },
                        ]}
                    >
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
                    </Animated.View>
                </Modal>
                {/*logout confirmation*/}
                <AlertDialog isOpen={isLogoutDialogOpen} onClose={() => setIsLogoutDialogOpen(false)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <ThemedText type="title">Confirm Logout</ThemedText>
                        </AlertDialogHeader>
                        <AlertDialogBody>
                            <ThemedText type="default">Are you sure you want to log out? You'll need to log in again to access your account.</ThemedText>
                        </AlertDialogBody>
                        <AlertDialogFooter>
                            <Button action="primary" variant="solid" size="sm" onPress={cancelLogout}>
                                <ButtonText>Cancel</ButtonText>
                            </Button>
                            <Button action="secondary" size="sm" onPress={confirmLogout} disabled={isLoggingOut}>
                                {isLoggingOut ? <ButtonSpinner /> : <ButtonText>Confirm</ButtonText>}
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                {/*logout success dialog*/}
                <AlertDialog isOpen={isSuccessDialogOpen} onClose={() => setIsSuccessDialogOpen(false)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <ThemedText type="title">Logged Out!</ThemedText>
                        </AlertDialogHeader>
                        <AlertDialogBody>
                            <ThemedText type="default">See you soon!</ThemedText>
                        </AlertDialogBody>
                        <AlertDialogFooter>
                            <Button variant="solid" action="primary" size="md" onPress={handleSuccessOK}>
                                <ButtonText>Bye!</ButtonText>
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </View>
            <AttendanceHistories />
        </Animated.View>
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
        marginTop: verticalScale(IsHaveNotch ? (IsIPAD ? 30 : 40) : 30),
    },
    profileInfo: {
        flex: 1,
        gap: 8,
    },
    infoRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    infoText: {
        color: "#6B7280",
        flex: 1,
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
        justifyContent: "flex-end",
    },
    modalOverlayBackground: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    moreInfoMenu: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "#FFFFFF",
        borderTopLeftRadius: moderateScale(16),
        borderTopRightRadius: moderateScale(16),
        paddingHorizontal: moderateScale(20),
        paddingVertical: moderateScale(20),
        paddingBottom: moderateScale(40),
        maxHeight: "60%",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: -4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 30,
        elevation: 20,
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
        paddingBottom: 40,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: -4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 30,
        elevation: 20,
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
    infoLabel: {
        flex: 1,
        color: "#6B7280",
    },
    infoValue: {
        fontSize: 14,
        color: "#111827",
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
