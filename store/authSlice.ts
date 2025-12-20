import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface AuthState {
    isLoggedIn: boolean;
    studentNumber: string | null;
    token: string | null;
    requiresFacialRegistration: boolean;
    faceRegistered: boolean;
}

const initialState: AuthState = {
    isLoggedIn: false,
    studentNumber: null,
    token: null,
    requiresFacialRegistration: false,
    faceRegistered: false,
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setLoginState: (state, action: PayloadAction<Omit<AuthState, "faceRegistered">>) => {
            state.isLoggedIn = action.payload.isLoggedIn;
            state.studentNumber = action.payload.studentNumber;
            state.token = action.payload.token;
            state.requiresFacialRegistration = action.payload.requiresFacialRegistration;
        },
        setFaceRegistered: (state, action: PayloadAction<boolean>) => {
            state.faceRegistered = action.payload;
        },
        logout: (state) => {
            state.isLoggedIn = false;
            state.studentNumber = null;
            state.token = null;
            state.requiresFacialRegistration = false;
            state.faceRegistered = false;
            AsyncStorage.removeItem("authToken");
            AsyncStorage.removeItem("faceRegistered");
        },
    },
});

export const { setLoginState, setFaceRegistered, logout } = authSlice.actions;

export default authSlice.reducer;
