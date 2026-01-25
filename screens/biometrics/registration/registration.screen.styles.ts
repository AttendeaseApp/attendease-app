import { StyleSheet } from "react-native"

const registrationScreenStyles = StyleSheet.create({
     container: {
          flex: 1,
          backgroundColor: "#000",
     },
     camera: {
          flex: 1,
     },
     overlay: {
          flex: 1,
          backgroundColor: "transparent",
          justifyContent: "space-between",
          padding: 20,
          paddingTop: 60,
          paddingBottom: 40,
     },
     instructionBox: {
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          padding: 16,
          borderRadius: 12,
     },
     faceFrameContainer: {
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
     },
     faceFrame: {
          width: 300,
          height: 300,
          borderWidth: 3,
          borderColor: "#d97757",
          borderRadius: 150,
          backgroundColor: "transparent",
          shadowColor: "#d97757",
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.9,
          shadowRadius: 15,
          elevation: 10,
     },
     progressIndicators: {
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          gap: 8,
          paddingVertical: 12,
     },
     progressDot: {
          height: 12,
          borderRadius: 6,
          justifyContent: "center",
          alignItems: "center",
     },
     progressDotActive: {
          backgroundColor: "#336dd7",
          shadowColor: "#d97757",
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.6,
          shadowRadius: 8,
          elevation: 5,
     },
     controls: {
          backgroundColor: "#fff",
          padding: 20,
          paddingBottom: 50,
          elevation: 10,
     },
     buttonGroup: {
          flexDirection: "row",
          gap: 12,
     },
     helpText: {
          textAlign: "left",
          opacity: 0.7,
     },
     progressCounter: {
          marginTop: 8,
          fontSize: 12,
          opacity: 0.8,
     },
     center: {
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
          backgroundColor: "#fff",
     },
     permissionText: {
          textAlign: "center",
          maxWidth: 300,
     },
})

export default registrationScreenStyles
