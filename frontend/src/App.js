import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Approvals from './pages/Approvals';
import Reports from './pages/Reports';
import authService from './services/auth';
import Insights from './pages/Insights';

// ScrollToTop component - added inside the same file for simplicity
function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
        // Scroll to top with smooth animation when route changes
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'smooth' // Optional: remove if you want instant scroll
        });
    }, [pathname]);

    return null;
}

function PrivateRoute({ children }) {
    return authService.isAuthenticated() ? children : <Navigate to="/" />;
}

function App() {
    return (
        <BrowserRouter>
            {/* ScrollToTop goes INSIDE BrowserRouter but OUTSIDE Routes */}
            <ScrollToTop />
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/dashboard" element={
                    <PrivateRoute>
                        <Dashboard />
                    </PrivateRoute>
                } />
                <Route path="/upload" element={
                    <PrivateRoute>
                        <Upload />
                    </PrivateRoute>
                } />
                <Route path="/approvals" element={
                    <PrivateRoute>
                        <Approvals />
                    </PrivateRoute>
                } />
                <Route path="/reports" element={
                    <PrivateRoute>
                        <Reports />
                    </PrivateRoute>
                } />
                <Route path="/insights" element={
                     <PrivateRoute>
                      <Insights />
                    </PrivateRoute>
                } />
            </Routes>
        </BrowserRouter>
    );
}

export default App;