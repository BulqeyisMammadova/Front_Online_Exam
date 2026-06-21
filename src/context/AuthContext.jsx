import { createContext, useContext, useState, useEffect } from "react";
import { authApi } from "../api/services";

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const s = localStorage.getItem("user");
    if (s) setUser(JSON.parse(s));
    setLoading(false);
  }, []);

  const login = async (email, password, groupCode = "") => {
    const res = await authApi.login({ email, password, groupCode });
    const d = res.data.data;
    const u = {
      role: d.role,
      fullName: d.fullName,
      groupCode: d.groupCode || null,
      teacherNames: d.teacherNames || null,
    };
    localStorage.setItem("token", d.token);
    localStorage.setItem("user", JSON.stringify(u));
    setUser(u);
    return u;
  };

  const register = (payload) => authApi.register(payload);

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  return (
    <Ctx.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
