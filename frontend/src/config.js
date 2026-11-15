const origin = 'https://personal-website-53mf.onrender.com';
export const konnectConfig = {
  endpoint: import.meta.env.VITE_KONNECT_ENDPOINT || `${origin}/clientportal/api/konnect/contact`,
  username: import.meta.env.VITE_KONNECT_USERNAME || 'sandgateseniors',
};
export const analyticsConfig = {
  endpoint: import.meta.env.VITE_VISITPULSE_ENDPOINT || `${origin}/clientportal/api/analytics/v1/events`,
  username: import.meta.env.VITE_VISITPULSE_USERNAME || 'sandgateseniors',
  enabled: import.meta.env.VITE_VISITPULSE_ENABLED !== 'false',
};
