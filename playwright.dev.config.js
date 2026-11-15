import config from './playwright.config.js';
export default { ...config, webServer: { ...config.webServer, command: 'node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5099 --strictPort' } };
