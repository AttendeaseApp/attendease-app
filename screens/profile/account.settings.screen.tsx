import { ThemedText } from "@/components/ui/text/themed.text"
import { BiometricsManagementService } from "@/server/service/api/biometrics/management/biometrics-management-service"
import {
     getAutoRegisterSetting,
     saveAutoRegisterSetting,
} from "@/utils/settings/auto-registration.settings"
import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import * as Application from "expo-application"
import { useRouter } from "expo-router"
import React, { useEffect, useState } from "react"
import {
     ActivityIndicator,
     Alert,
     ScrollView,
     StatusBar,
     StyleSheet,
     Switch,
     TouchableOpacity,
     View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

export default function AccountSettingsScreen() {
     const router = useRouter()
     const [autoRegisterEnabled, setAutoRegisterEnabled] = useState(false)
     const [isDeleting, setIsDeleting] = useState(false)
     const [hasBiometrics, setHasBiometrics] = useState(true)
     const [isLoadingBiometrics, setIsLoadingBiometrics] = useState(true)
     const appVersion = Application.nativeApplicationVersion
     const buildNumber = Application.nativeBuildVersion

     useEffect(() => {
          const loadSettings = async () => {
               const enabled = await getAutoRegisterSetting()
               setAutoRegisterEnabled(enabled)
               const registrationComplete = await AsyncStorage.getItem("facialRegistrationComplete")
               setHasBiometrics(registrationComplete === "true")
               setIsLoadingBiometrics(false)
          }
          loadSettings()
     }, [])

     const handleAutoRegisterToggle = async (value: boolean) => {
          setAutoRegisterEnabled(value)
          await saveAutoRegisterSetting(value)
     }

     const handleDeleteBiometrics = async () => {
          setIsDeleting(true)
          try {
               const message = await BiometricsManagementService.deleteFacialData()
               await AsyncStorage.removeItem("facialRegistrationComplete")
               setHasBiometrics(false)
               Alert.alert("Success", message, [{ text: "Ok" }])
          } catch (error: any) {
               Alert.alert(
                    "Error",
                    error.message || "Failed to delete biometric data. Please try again.",
                    [{ text: "Ok" }]
               )
          } finally {
               setIsDeleting(false)
          }
     }

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
                         onPress: handleDeleteBiometrics,
                    },
               ],
               { cancelable: true }
          )
     }

     const handleRegisterBiometrics = async () => {
          const studentNumber = await AsyncStorage.getItem("studentNumber")
          router.push({
               pathname: "/(routes)/(biometrics)/onboarding",
               params: { studentNumber: studentNumber || "" },
          })
     }

     const securitySettings = [
          {
               title: "Change Password",
               description: "Update your account password",
               onPress: () => router.push("/(routes)/(account)/password"),
               type: "navigation" as const,
          },
     ]

     const registrationSettings = [
          {
               title: "Auto-Register for Events",
               description: "Automatically register when facial verification is not required",
               type: "toggle" as const,
               value: autoRegisterEnabled,
               onToggle: handleAutoRegisterToggle,
          },
     ]

     const renderSettingItem = (setting: any, index: number, array: any[]) => {
          const isLast = index === array.length - 1

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
                         <Switch
                              value={setting.value}
                              onValueChange={setting.onToggle}
                              trackColor={{ false: "#D1D5DB", true: "#27548A40" }}
                              thumbColor={setting.value ? "#27548A" : "#F3F4F6"}
                         />
                    ) : (
                         <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                    )}
               </>
          )

          if (setting.type === "navigation") {
               return (
                    <TouchableOpacity
                         key={index}
                         onPress={setting.onPress}
                         activeOpacity={0.7}
                         style={[styles.settingItem, !isLast && styles.settingItemBorder]}
                    >
                         {content}
                    </TouchableOpacity>
               )
          }

          return (
               <View key={index} style={[styles.settingItem, !isLast && styles.settingItemBorder]}>
                    {content}
               </View>
          )
     }

     return (
          <SafeAreaView style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
               <StatusBar barStyle={"dark-content"} />
               <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
                    <View>
                         <View style={styles.header}>
                              <TouchableOpacity
                                   style={styles.backButton}
                                   onPress={() => router.back()}
                              >
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
                              <View style={styles.settingsGroup}>
                                   {securitySettings.map((setting, index) =>
                                        renderSettingItem(setting, index, securitySettings)
                                   )}
                              </View>
                         </View>

                         <View style={styles.section}>
                              <ThemedText type="subtitle" style={styles.sectionTitle}>
                                   Event Registration
                              </ThemedText>
                              <View style={styles.settingsGroup}>
                                   {registrationSettings.map((setting, index) =>
                                        renderSettingItem(setting, index, registrationSettings)
                                   )}
                              </View>
                         </View>

                         {/*biometrics registration - show only if not registered*/}
                         {!isLoadingBiometrics && !hasBiometrics && (
                              <View style={styles.section}>
                                   <ThemedText type="subtitle" style={styles.sectionTitle}>
                                        Biometric Authentication
                                   </ThemedText>
                                   <View style={styles.settingsGroup}>
                                        <TouchableOpacity
                                             style={styles.settingItem}
                                             onPress={handleRegisterBiometrics}
                                             activeOpacity={0.7}
                                        >
                                             <View style={styles.iconContainer}>
                                                  <Ionicons name="scan" size={24} color="#4F46E5" />
                                             </View>
                                             <View style={styles.settingTextContainer}>
                                                  <ThemedText
                                                       type="default"
                                                       style={styles.settingTitle}
                                                  >
                                                       Register Facial Biometrics
                                                  </ThemedText>
                                                  <ThemedText
                                                       type="default"
                                                       style={styles.settingDescription}
                                                  >
                                                       Set up facial recognition for faster event
                                                       check-ins
                                                  </ThemedText>
                                             </View>
                                             <Ionicons
                                                  name="chevron-forward"
                                                  size={20}
                                                  color="#9CA3AF"
                                             />
                                        </TouchableOpacity>
                                   </View>
                              </View>
                         )}

                         {/*data privacy*/}
                         <View style={styles.section}>
                              <ThemedText type="subtitle" style={styles.sectionTitle}>
                                   Data & Privacy
                              </ThemedText>
                              <View style={styles.settingsGroup}>
                                   <TouchableOpacity
                                        style={styles.settingItem}
                                        onPress={() => alert("Privacy policy coming soon")}
                                   >
                                        <View style={styles.settingTextContainer}>
                                             <ThemedText type="default" style={styles.settingTitle}>
                                                  Privacy Policy
                                             </ThemedText>
                                             <ThemedText
                                                  type="default"
                                                  style={styles.settingDescription}
                                             >
                                                  Read our privacy policy
                                             </ThemedText>
                                        </View>
                                        <Ionicons
                                             name="chevron-forward"
                                             size={20}
                                             color="#9CA3AF"
                                        />
                                   </TouchableOpacity>
                              </View>
                         </View>

                         {/*danger zone - show only if biometrics registered*/}
                         {!isLoadingBiometrics && hasBiometrics && (
                              <View style={styles.section}>
                                   <ThemedText
                                        type="subtitle"
                                        style={[styles.sectionTitle, { color: "#EF4444" }]}
                                   >
                                        Danger Zone
                                   </ThemedText>
                                   <View style={styles.settingsGroup}>
                                        <TouchableOpacity
                                             style={styles.settingItem}
                                             onPress={confirmDeleteBiometrics}
                                             disabled={isDeleting}
                                             activeOpacity={0.7}
                                        >
                                             <View style={styles.settingTextContainer}>
                                                  <ThemedText
                                                       type="default"
                                                       style={[
                                                            styles.settingTitle,
                                                            { color: "#EF4444" },
                                                       ]}
                                                  >
                                                       Delete My Biometrics
                                                  </ThemedText>
                                                  <ThemedText
                                                       type="default"
                                                       style={styles.settingDescription}
                                                  >
                                                       Permanently delete your facial data
                                                  </ThemedText>
                                             </View>
                                             {isDeleting ? (
                                                  <ActivityIndicator size="small" color="#EF4444" />
                                             ) : (
                                                  <Ionicons
                                                       name="chevron-forward"
                                                       size={20}
                                                       color="#EF4444"
                                                  />
                                             )}
                                        </TouchableOpacity>
                                   </View>
                              </View>
                         )}

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
                                             {appVersion ?? "—"}
                                        </ThemedText>
                                   </View>
                                   <View style={styles.settingItemBorder} />
                                   <View style={styles.infoItem}>
                                        <ThemedText type="default" style={styles.infoLabel}>
                                             Build Number
                                        </ThemedText>
                                        <ThemedText type="default" style={styles.infoValue}>
                                             {buildNumber ?? "—"}
                                        </ThemedText>
                                   </View>
                                   <View style={styles.settingItemBorder} />
                                   <TouchableOpacity
                                        style={styles.infoItem}
                                        onPress={() => alert("Terms of Service coming soon")}
                                   >
                                        <ThemedText type="default" style={styles.infoLabel}>
                                             Terms of Service
                                        </ThemedText>
                                        <Ionicons
                                             name="chevron-forward"
                                             size={20}
                                             color="#9CA3AF"
                                        />
                                   </TouchableOpacity>
                              </View>
                         </View>
                    </View>
               </ScrollView>
          </SafeAreaView>
     )
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
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: "#EEF2FF",
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
})
