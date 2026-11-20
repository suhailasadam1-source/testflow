import { createContext, useContext, useState } from "react";
import api from "../services/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  const saveSession = (data) => {
    const userInfo = { _id: data._id, name: data.name, email: data.email };
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(userInfo));
    setUser(userInfo);
  };

  const register = async (name, email, password, confirmPassword) => {
    const { data } = await api.post("/auth/register/send-otp", {
      name,
      email,
      password,
      confirmPassword,
    });
    return data;
  };

  const verifyRegistration = async (email, otp) => {
    const { data } = await api.post("/auth/register/verify-otp", { email, otp });
    return data;
  };

  const resendRegistrationOtp = async (email) => {
    const { data } = await api.post("/auth/register/resend-otp", { email });
    return data;
  };

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    saveSession(data);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, register, verifyRegistration, resendRegistrationOtp, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);