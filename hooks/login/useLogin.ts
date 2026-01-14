import { useState } from "react"
import { useRouter } from "expo-router"
import { LoginRequest } from "@/domain/interface/login/login.request"
import { loginService } from "@/server/service/api/login/login-service"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { LoginResult } from "@/domain/interface/login/login.result"
import { DecodedToken } from "@/domain/interface/token/token"
import { jwtDecode } from "jwt-decode"

export const useLogin = () => {
     const [studentNumber, setStudentNumber] = useState("")
     const [password, setPassword] = useState("")
     const [loading, setLoading] = useState(false)
     const [alertOpen, setAlertOpen] = useState(false)
     const [alertTitle, setAlertTitle] = useState("")
     const [alertMessage, setAlertMessage] = useState("")
     const router = useRouter()

     const showAlert = (title: string, message: string) => {
          setAlertTitle(title)
          setAlertMessage(message)
          setAlertOpen(true)
     }

     const handleLogin = async () => {
          if (!studentNumber || !password) {
               showAlert("Missing Credentials", "Please enter your complete credentials.")
               return
          }

          setLoading(true)
          try {
               const request: LoginRequest = { studentNumber, password }
               const result: LoginResult = await loginService(request)

               if (result.success) {
                    const token = await AsyncStorage.getItem("authToken")

                    if (!token) {
                         showAlert(
                              "Login Error",
                              "Authentication token not found. Please try again."
                         )
                         setLoading(false)
                         return
                    }

                    const decoded: DecodedToken = jwtDecode(token)
                    const currentTime = Date.now() / 1000

                    if (decoded.exp < currentTime) {
                         showAlert("Login Expired", "Session expired. Please log in again.")
                         await AsyncStorage.removeItem("authToken")
                         setLoading(false)
                         return
                    }

                    const { studentNumber: tokenStudentNumber, requiresFacialRegistration } =
                         decoded
                    await AsyncStorage.setItem("studentNumber", tokenStudentNumber)
                    console.log("Student number stored:", tokenStudentNumber)

                    if (requiresFacialRegistration) {
                         console.log("Facial registration required, navigating to onboarding...")
                         router.replace({
                              pathname: "/(routes)/(biometrics)/onboarding",
                              params: { studentNumber: tokenStudentNumber },
                         })
                    } else {
                         console.log("Login complete, navigating to tabs...")
                         await AsyncStorage.setItem("facialRegistrationComplete", "true")
                         router.replace("/(tabs)")
                    }
               } else {
                    showAlert("Login Failed", result.message)
               }
          } catch (error: any) {
               showAlert(
                    "Error",
                    "Something went wrong. Please try again.\n" + (error?.message ?? "")
               )
               console.error("Login Error:", error)
          } finally {
               setLoading(false)
          }
     }

     return {
          studentNumber,
          setStudentNumber,
          password,
          setPassword,
          loading,
          handleLogin,
          alertOpen,
          setAlertOpen,
          alertTitle,
          alertMessage,
     }
}
