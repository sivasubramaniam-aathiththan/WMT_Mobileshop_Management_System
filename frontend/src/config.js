// Production backend URL
const PRODUCTION_BASE_URL = 'http://172.20.10.7:3000';
const PRODUCTION_API_BASE_URL = `${PRODUCTION_BASE_URL}/api`;

// Try to import from @env, but catch errors if it fails
let ENV_API_BASE_URL, ENV_BASE_URL;
try {
  const envVars = require('@env');
  ENV_API_BASE_URL = envVars.API_BASE_URL;
  ENV_BASE_URL = envVars.BASE_URL;
} catch (e) {
  // @env not available in web build
}

// Always use production URL for deployed builds
const API_BASE_URL = PRODUCTION_API_BASE_URL;
const BASE_URL = PRODUCTION_BASE_URL;

export { API_BASE_URL, BASE_URL };

export const CONFIG = {
  API_BASE_URL,
  BASE_URL,
};
