// import { View, Text, Alert } from "react-native";
// import React, {
//   createContext,
//   ReactNode,
//   useContext,
//   useEffect,
//   useRef,
//   useState,
// } from "react";
// import * as Notifications from "expo-notifications";
// import useUser, { setAuthorizationHeader } from "@/hooks/fetch/useUser";
// import { registerForPushNotificationsAsync } from "@/utils/registerForPushNotificationsAsync";
// import axios from "axios";
// import { router } from "expo-router";

// interface NotificationContextType {
//   expoPushToken: string | null;
//   notification: Notifications.Notification | null;
//   error: Error | null;
// }

// const NotificationContext = createContext<NotificationContextType | undefined>(
//   undefined
// );

// export const useNotification = () => {
//   const context = useContext(NotificationContext);
//   if (context === undefined) {
//     Alert.alert("useNotification must be used within a notification provider");
//   }
//   return context;
// };

// interface NotificationProviderProps {
//   children: ReactNode;
// }

// export const NotificationProvider: React.FC<NotificationProviderProps> = ({
//   children,
// }) => {
//   const [expoPushToken, setExpoPushToken] = useState("");
//   const [notification, setNotification] =
//     useState<Notifications.Notification | null>(null);
//   const [error, setError] = useState(null);
//   const notificationListener = useRef<Notifications.Subscription>();
//   const responseListener = useRef<Notifications.Subscription>();
//   const { user, loader } = useUser();

//   useEffect(() => {
//     let isMounted = true;

//     if (isMounted) {
//       const registerPushNotification = async () => {
//         try {
//           const token = await registerForPushNotificationsAsync();
//           if (token) {
//             if (!loader && user && user.pushToken !== token) {
//               await setAuthorizationHeader();
//               await axios.put(
//                 `${process.env.EXPO_PUBLIC_SERVER_URI}/update-push-token`,
//                 { pushToken: token }
//               );
//               setExpoPushToken(token);
//             }
//           }
//         } catch (error: any) {
//           setError(error);
//         }
//       };
//       registerPushNotification();
//     }

//     notificationListener.current =
//       Notifications.addNotificationReceivedListener((notification) => {
//         setNotification(notification);
//       });

//     notificationListener.current =
//       Notifications.addNotificationResponseReceivedListener((response) => {
//         if (response.notification.request.content.data.courseData) {
//           router.push({
//             pathname: "/(routes)/course-access",
//             params: {
//               ...response.notification.request.content.data.courseData,
//               activeVideo:
//                 response.notification.request.content.data.activeVideo,
//             },
//           });
//         }
//         if (response.notification.request.content.data.link) {
//           router.push(response.notification.request.content.data.link);
//         }
//       });

//     Notifications.getLastNotificationResponseAsync().then((response) => {
//       if (!response?.notification) {
//         return;
//       }
//     });

//     return () => {
//       isMounted = false;
//       notificationListener.current &&
//         Notifications.removeNotificationSubscription(
//           notificationListener.current
//         );
//       responseListener.current &&
//         Notifications.removeNotificationSubscription(responseListener.current);
//     };
//   }, [loader]);

//   return (
//     <NotificationContext.Provider
//       value={{ expoPushToken, notification, error }}
//     >
//       {children}
//     </NotificationContext.Provider>
//   );
// };
