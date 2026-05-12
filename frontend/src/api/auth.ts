const BASE_URL = "http://localhost:3001";
const MOCK = true; // ← flip to false when backend is ready

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

export const signup = async (data: SignupData): Promise<{ token: string; userId: string }> => {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 800)); // simulate network
    localStorage.setItem("cura_user", JSON.stringify({ name: data.name, username: data.username, parentEmail: data.parentEmail }));
    return { token: "mock-token-123", userId: "mock-user-1" };
  }
  const res = await fetch(`${BASE_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Signup failed");
  return res.json();
};

export const login = async (data: LoginData): Promise<{ token: string; userId: string }> => {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 800));
    const stored = localStorage.getItem("cura_user");
    if (!stored) throw new Error("No account found. Please sign up first.");
    return { token: "mock-token-123", userId: "mock-user-1" };
  }
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Invalid username or password");
  return res.json();
};

export const sendFlagAlert = async (flagType: string, message: string) => {
  const token = localStorage.getItem("cura_token");
  const user = JSON.parse(localStorage.getItem("cura_user") || "{}");
  if (MOCK) {
    console.log(`[MOCK ALERT] Flag: ${flagType} | User: ${user.username} | Parent: ${user.parentEmail}`);
    return;
  }
  await fetch(`${BASE_URL}/alert/flag`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ flagType, message, parentEmail: user.parentEmail }),
  });
};