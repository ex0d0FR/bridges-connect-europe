import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { useSecurityHeaders } from './hooks/useSecurityHeaders.ts'

// Security wrapper component to apply security headers
const SecurityWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useSecurityHeaders();
  return <>{children}</>;
};

createRoot(document.getElementById("root")!).render(
  <SecurityWrapper>
    <App />
  </SecurityWrapper>
);
