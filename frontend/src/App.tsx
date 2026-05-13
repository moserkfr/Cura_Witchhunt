import { useState, useEffect } from "react";
import { ChatWindow } from "./pages/child/ChatWindow";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/ChildSignup";

type Page = "login" | "signup" | "chat";

export default function App() {
  const [page, setPage] = useState<Page>("login");

  // If already logged in, go straight to chat
  useEffect(() => {
    const token = localStorage.getItem("cura_token");
    if (token) setPage("chat");
  }, []);

  if (page === "login")  return <LoginPage  onLogin={() => setPage("chat")} onGoSignup={() => setPage("signup")} />;
  if (page === "signup") return <SignupPage onSignup={() => setPage("chat")} onGoLogin={() => setPage("login")} />;
  return <ChatWindow />;
}