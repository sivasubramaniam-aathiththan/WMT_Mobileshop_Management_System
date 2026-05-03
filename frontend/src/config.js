import { API_BASE_URL as ENV_API_BASE_URL, BASE_URL as ENV_BASE_URL } from "@env";

// API Configuration
// When running on a real device, use the local network IP in .env.
const API_BASE_URL = ENV_API_BASE_URL || 'http://localhost:3000/api';
const BASE_URL = ENV_BASE_URL || 'http://localhost:3000';

export { API_BASE_URL, BASE_URL };

// Fallback for development (only used if @env doesn't provide values)
export const CONFIG = {
  API_BASE_URL,
  BASE_URL,
};
