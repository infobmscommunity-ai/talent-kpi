import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Talents from './pages/Talents';
import Accounts from './pages/Accounts';
import Products from './pages/Products';
import Posts from './pages/Posts';
import Sales from './pages/Sales';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Protected Route Component
interface RequireAuthProps {
  children: React.ReactNode;
}

const RequireAuth: React.FC<RequireAuthProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });
    return () => unsubscribe();
  }, []);

  if (isAuthenticated === null) {
    return <div className="h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* Protected Routes */}
        <Route path="/" element={
          <RequireAuth>
            <Layout><Dashboard /></Layout>
          </RequireAuth>
        } />
        
        <Route path="/talents" element={
          <RequireAuth>
            <Layout><Talents /></Layout>
          </RequireAuth>
        } />

        <Route path="/accounts" element={
          <RequireAuth>
            <Layout><Accounts /></Layout>
          </RequireAuth>
        } />

        <Route path="/products" element={
          <RequireAuth>
            <Layout><Products /></Layout>
          </RequireAuth>
        } />

        <Route path="/posts" element={
          <RequireAuth>
            <Layout><Posts /></Layout>
          </RequireAuth>
        } />

        <Route path="/sales" element={
          <RequireAuth>
            <Layout><Sales /></Layout>
          </RequireAuth>
        } />
      </Routes>
    </HashRouter>
  );
};

export default App;