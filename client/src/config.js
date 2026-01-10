// Use Vite's import.meta.env for environment variables
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

export const SERVER_URL = BASE_URL.replace(/\/api\/v1\/?$/, ""); // Ensure we get the root URL even if /api/v1 is included
export const API_URL = `${SERVER_URL}/api/v1`;