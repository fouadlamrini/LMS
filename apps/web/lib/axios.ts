// lib/axios.ts
import axios from "axios";

// Get API URL at runtime instead of build time
function getApiUrl() {
  if (typeof window !== "undefined") {
    // Client-side: check if there's a runtime config
    return (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001");
  }
  // Server-side fallback
  return (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001");
}

const api = axios.create({
  baseURL: getApiUrl() + "/api",
  headers: {
    "Content-Type": "application/json"
  },
});

// Request interceptor: token + FormData (no Content-Type so browser sets multipart)
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    // FormData: ne pas forcer application/json, bach l’navigateur ydir multipart
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);



export default api;

/** Base URL dyal l’API (sans /api) — bach n’affichew les fichiers /uploads/... */
export const apiOrigin = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export function getContentUrl(url: string): string {
  return url.startsWith("http") ? url : `${apiOrigin}${url}`;
}