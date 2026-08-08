// Set VITE_API_URL in a .env file at the frontend root when deploying
// (e.g. VITE_API_URL=https://your-backend.onrender.com/api)
// Defaults to localhost for local development.
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export const api = {
  sendOtp: (phone) => request("/auth/send-otp", { method: "POST", body: JSON.stringify({ phone }) }),
  verifyOtp: (payload) => request("/auth/verify-otp", { method: "POST", body: JSON.stringify(payload) }),

  getCategories: () => request("/categories"),

  getProviderByUser: (userId) => request(`/providers/by-user/${userId}`),
  registerProvider: (payload) => request("/providers/register", { method: "POST", body: JSON.stringify(payload) }),
  setDuty: (providerId, payload) => request(`/providers/${providerId}/duty`, { method: "POST", body: JSON.stringify(payload) }),
  getEarnings: (providerId) => request(`/providers/${providerId}/earnings`),
  getIncoming: (providerId) => request(`/requests/provider/${providerId}/incoming`),

  createRequest: (payload) => request("/requests", { method: "POST", body: JSON.stringify(payload) }),
  getRequest: (id) => request(`/requests/${id}`),
  respond: (id, payload) => request(`/requests/${id}/respond`, { method: "POST", body: JSON.stringify(payload) }),
  completeRequest: (id, payload) => request(`/requests/${id}/complete`, { method: "POST", body: JSON.stringify(payload) }),
};
