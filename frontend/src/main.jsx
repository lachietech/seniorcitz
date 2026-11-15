import React from 'react';
import { createRoot } from 'react-dom/client';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import { createVisitPulse } from './visitpulse-tracker.js';
import { analyticsConfig } from './config.js';

createVisitPulse(analyticsConfig).start();

const pathname = window.location.pathname.replace(/\/$/, '');
const Page = ['/admin/login', '/admin-login.html'].includes(pathname)
  ? Login
  : ['/admin/dashboard', '/admin-dashboard.html'].includes(pathname) ? Dashboard : Home;

createRoot(document.getElementById('root')).render(<Page />);
