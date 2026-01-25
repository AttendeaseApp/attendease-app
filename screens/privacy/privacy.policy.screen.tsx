import React from "react"
import { ScrollView, StyleSheet, View, TouchableOpacity } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { ThemedText } from "@/components/ui/text/themed.text"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { moderateScale, normalize } from "@/themes/responsive"

export default function PrivacyPolicyScreen() {
     const router = useRouter()

     return (
          <SafeAreaView style={styles.container}>
               <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                         <Ionicons name="arrow-back" size={24} color="#111827" />
                    </TouchableOpacity>
                    <ThemedText type="subtitle">PRIVACY POLICY</ThemedText>
               </View>

               <ScrollView contentContainerStyle={styles.scrollContent}>
                    <ThemedText style={styles.lastUpdated}>Last Updated: January 2026</ThemedText>

                    <Section title="1. Introduction">
                         <ThemedText style={styles.text}>
                              RCIANS ATTENDEASE (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;)
                              is committed to protecting your privacy. This Privacy Policy explains
                              how we collect, use, and safeguard your biometric data in accordance
                              with the Philippine Data Privacy Act of 2012 (RA 10173).
                         </ThemedText>
                    </Section>

                    <Section title="2. Biometric Data Collection">
                         <ThemedText style={styles.text}>
                              To facilitate fair event registration, we collect facial biometric
                              data. Specifically:
                         </ThemedText>
                         <BulletPoint text="We capture temporary facial images to generate a unique facial encoding (mathematical representation)." />
                         <BulletPoint text="Original facial images are processed locally or in secure transit and are immediately discarded after the encoding is generated." />
                         <BulletPoint text="Only the encrypted facial encoding is stored on our secured servers." />
                    </Section>

                    <Section title="3. Purpose of Processing">
                         <ThemedText style={styles.text}>
                              Your biometric data is used exclusively for:
                         </ThemedText>
                         <BulletPoint text="Verifying your identity during event check-ins." />
                         <BulletPoint text="Preventing unauthorized attendance or proxy registration." />
                         <BulletPoint text="Ensuring the integrity of institutional event records." />
                    </Section>

                    <Section title="4. Data Retention & Deletion">
                         <ThemedText style={styles.text}>
                              We retain your facial encoding only for as long as you are an active
                              user of the system. You have the right to:
                         </ThemedText>
                         <BulletPoint text="Immediate and permanently delete your biometric data from our servers/ databases." />
                    </Section>
               </ScrollView>
          </SafeAreaView>
     )
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
     <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
          {children}
     </View>
)

const BulletPoint = ({ text }: { text: string }) => (
     <View style={styles.bulletRow}>
          <View style={styles.bullet} />
          <ThemedText style={styles.bulletText}>{text}</ThemedText>
     </View>
)

const styles = StyleSheet.create({
     container: { flex: 1, backgroundColor: "#ffffff" },
     header: {
          flexDirection: "row",
          alignItems: "center",
          padding: moderateScale(20),
          borderBottomWidth: 1,
          borderBottomColor: "#F3F4F6",
     },
     backButton: { marginRight: moderateScale(16) },
     scrollContent: { padding: moderateScale(20) },
     lastUpdated: { fontSize: normalize(12), color: "#6B7280", marginBottom: moderateScale(20) },
     section: { marginBottom: moderateScale(24) },
     sectionTitle: {
          fontSize: normalize(16),
          fontWeight: "700",
          marginBottom: moderateScale(8),
          color: "#111827",
     },
     text: { fontSize: normalize(14), lineHeight: normalize(20), color: "#374151" },
     bulletRow: {
          flexDirection: "row",
          marginTop: moderateScale(8),
          paddingLeft: moderateScale(8),
     },
     bullet: {
          width: 4,
          height: 4,
          borderRadius: 2,
          backgroundColor: "#374151",
          marginTop: 8,
          marginRight: 10,
     },
     bulletText: { flex: 1, fontSize: normalize(14), lineHeight: normalize(20), color: "#374151" },
})
