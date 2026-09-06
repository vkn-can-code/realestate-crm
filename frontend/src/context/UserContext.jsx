import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api/client.js";

const UserContext = createContext(null);

export const DEFAULT_ADMIN = {
  id: "TEAM-1",
  name: "Admin (Sales Manager)",
  role: "admin",
  email: "admin@realtycrm.com",
  username: "admin",
  title: "Sales Manager",
};

export function UserProvider({ children }) {
  const [teamMembers, setTeamMembers] = useState([]);
  const [activeUser, setActiveUser] = useState(() => {
    const saved = localStorage.getItem("crm_logged_user");
    return saved ? JSON.parse(saved) : DEFAULT_ADMIN;
  });

  const refreshTeam = () => {
    api.get("/team").then((data) => {
      setTeamMembers(data);
      if (activeUser) {
        const current = data.find((t) => t.id === activeUser.id);
        if (current) {
          const updated = {
            id: current.id,
            name: current.name,
            email: current.email,
            username: current.username,
            role: current.role,
            title: current.title || "Property Advisor",
          };
          setActiveUser(updated);
          localStorage.setItem("crm_logged_user", JSON.stringify(updated));
        }
      }
    }).catch(() => {});
  };

  useEffect(() => {
    refreshTeam();
  }, []);

  const login = async (usernameOrEmail, password) => {
    const res = await api.post("/team/login", { usernameOrEmail, password });
    if (res.ok && res.user) {
      setActiveUser(res.user);
      localStorage.setItem("crm_logged_user", JSON.stringify(res.user));
      return res.user;
    }
    throw new Error(res.error || "Login failed");
  };

  const logout = () => {
    setActiveUser(null);
    localStorage.removeItem("crm_logged_user");
  };

  return (
    <UserContext.Provider
      value={{
        activeUser,
        login,
        logout,
        teamMembers,
        refreshTeam,
        isAdmin: activeUser?.role === "admin",
        isLoggedIn: Boolean(activeUser),
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
