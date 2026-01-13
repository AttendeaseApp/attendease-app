import { StyleSheet } from "react-native"

const facialVerificationScreenStyles = StyleSheet.create({
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
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 5,
     },
     faceFrameContainer: {
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
     },
     faceFrame: {
          width: 250,
          height: 300,
          borderWidth: 3,
          borderColor: "#0D9488",
          borderRadius: 150,
          backgroundColor: "transparent",
          shadowColor: "#0D9488",
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.6,
          shadowRadius: 15,
          elevation: 10,
     },
     controls: {
          backgroundColor: "#fff",
          padding: 20,
          paddingBottom: 30,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 10,
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

export default facialVerificationScreenStyles
