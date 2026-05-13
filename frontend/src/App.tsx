import { useState, useEffect } from "react";
import { ChatWindow } from "./pages/child/ChatWindow";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/ChildSignup";
import { ParentSignupPage } from "./pages/ParentSignup";
import LandingPage from "./pages/LandingPage";
// @ts-ignore
import Dashboard from "./pages/parent/Dashboard";

type Page = "landing" | "login" | "child-signup" | "parent-signup" | "chat" | "parent-dashboard";

export default function App() {
  const [page, setPage] = useState<Page>("landing");
  const [_role, setRole] = useState<"child" | "parent" | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("cura_token");
    const savedRole = localStorage.getItem("cura_role") as "child" | "parent" | null;
    if (token && savedRole) {
      setRole(savedRole);
      setPage(savedRole === "parent" ? "parent-dashboard" : "chat");
    }
  }, []);

  const handleLogin = () => {
    const savedRole = localStorage.getItem("cura_role") as "child" | "parent";
    setRole(savedRole);
    setPage(savedRole === "parent" ? "parent-dashboard" : "chat");
  };

  const handleLogout = () => {
    localStorage.clear();
    setRole(null);
    setPage("landing");
  };

  if (page === "landing")          return <LandingPage onChildSignup={() => setPage("child-signup")} onParentSignup={() => setPage("parent-signup")} onLogin={() => setPage("login")} />;
  if (page === "login")            return <LoginPage onLogin={handleLogin} onGoSignup={() => setPage("landing")} />;
  if (page === "child-signup")     return <SignupPage onSignup={handleLogin} onGoLogin={() => setPage("login")} />;
  if (page === "parent-signup")    return <ParentSignupPage onSignup={handleLogin} onGoLogin={() => setPage("login")} />;
  if (page === "parent-dashboard") return <Dashboard onLogout={handleLogout} />;
  return <ChatWindow onLogout={handleLogout} />;
}