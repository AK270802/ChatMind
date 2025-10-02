// frontend/src/api.ts
const API_BASE = "https://chatmind-m2rf.onrender.com";

export const api = {
  login,
  getUser,
};

export async function login(email: string, password: string) {
  const res = await fetch(`${API_BASE}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include", // important to send session cookie
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

export async function getUser() {
  const res = await fetch(`${API_BASE}/api/user`, {
    method: "GET",
    credentials: "include", // important!
  });
  return res.json();
}
