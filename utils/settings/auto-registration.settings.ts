import AsyncStorage from "@react-native-async-storage/async-storage";

const AUTO_REGISTER_KEY = "@auto_register_enabled";

export const saveAutoRegisterSetting = async (
  enabled: boolean,
): Promise<void> => {
  try {
    await AsyncStorage.setItem(AUTO_REGISTER_KEY, JSON.stringify(enabled));
  } catch (error) {
    console.error("Failed to save auto-register setting:", error);
  }
};

export const getAutoRegisterSetting = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(AUTO_REGISTER_KEY);
    return value ? JSON.parse(value) : false;
  } catch (error) {
    console.error("Failed to get auto-register setting:", error);
    return false;
  }
};
