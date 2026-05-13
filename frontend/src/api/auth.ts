const BASE_URL = "http://localhost:8000";


export interface SignupData {
  name: string;
  dob: string;
  username: string;
  password: string;
  parentEmail: string;
}

export interface LoginData {
  username: string;
  password: string;
}

export interface ParentSignupData {
  name: string;
  email: string;
  password: string;
  phone: string;
}

export const signup = async (data: SignupData): Promise<{ token: string; userId: string }> => {
  const res = await fetch(`${BASE_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error("Signup failed");
  const result = await res.json();
  // save user info locally
  localStorage.setItem("cura_user", JSON.stringify({
    name: data.name,
    username: data.username,
    parentEmail: data.parentEmail
  }));
  localStorage.setItem("cura_token", result.token);
  localStorage.setItem("cura_role", "child");
  return result;
};

export const login = async (data: LoginData): Promise<{ token: string; userId: string }> => {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error("Invalid username or password");
  const result = await res.json();
  // save username locally after successful login
  localStorage.setItem("cura_user", JSON.stringify({
    username: data.username
  }));
  localStorage.setItem("cura_token", result.token);
  localStorage.setItem("cura_role", "child");
  return result;
};

export const parentSignup = async (data: ParentSignupData): Promise<{ token: string; userId: string }> => {
  const res = await fetch(`${BASE_URL}/auth/parent/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error("Signup failed");
  const result = await res.json();
  localStorage.setItem("cura_user", JSON.stringify({
    name: data.name,
    email: data.email,
    role: "parent"
  }));
  localStorage.setItem("cura_token", result.token);
  localStorage.setItem("cura_role", "parent");
  return result;
};

export const sendFlagAlert = async (flagType: string, message: string) => {
  const token = localStorage.getItem("cura_token");
  const user = JSON.parse(localStorage.getItem("cura_user") || "{}");
  await fetch(`${BASE_URL}/alert/flag`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ flagType, message, parentEmail: user.parentEmail }),
  });
};