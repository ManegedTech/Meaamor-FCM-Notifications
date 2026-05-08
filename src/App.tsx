import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './components/Login';
import { AdminDashboard } from './components/AdminDashboard';
import { account } from './lib/appwrite';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    account.get()
      .then((user) => {
        if (user.labels && user.labels.includes('admin')) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          // Optional: logout if they are logged in but not admin
          account.deleteSession('current').catch(() => { });
        }
      })
      .catch(() => setIsAuthenticated(false))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="loader-container">
        <div className="spinner"></div>
        <p>Verifying access...</p>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/" />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <AdminDashboard />
            </RequireAuth>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;