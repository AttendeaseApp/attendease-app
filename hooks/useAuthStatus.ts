import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

export const useAuthStatus = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      const storedToken = await AsyncStorage.getItem("authToken");
      setIsLoggedIn(!!storedToken);
    })();
  }, []);

  return { isLoggedIn };
};
