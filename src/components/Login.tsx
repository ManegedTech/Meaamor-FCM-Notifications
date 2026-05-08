import React, { useState, useEffect } from 'react';
import { account } from '../lib/appwrite';
import { useNavigate } from 'react-router-dom';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Redirect if already logged in as admin
  useEffect(() => {
    account.get().then((user) => {
      if (user.labels && user.labels.includes('admin')) {
        navigate('/dashboard');
      }
    }).catch(() => {});
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await account.createEmailPasswordSession(email, password);
      const user = await account.get();
      
      if (user.labels && user.labels.includes('admin')) {
        navigate('/dashboard');
      } else {
        await account.deleteSession('current');
        setError('Access Denied: Admin privileges required.');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container center-content fade-in">
      <div className="glass-card" style={{ width: '100%', maxWidth: '420px', margin: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '0.75rem', fontWeight: '600' }}>Admin Portal</h2>
          <p style={{ fontSize: '0.95rem' }}>Sign in to access the dashboard</p>
        </div>
        
        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}
        
        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <input 
              id="email"
              type="email" 
              className="custom-input"
              placeholder="admin@example.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>
          
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input 
              id="password"
              type="password" 
              className="custom-input"
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>
          
          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1.5rem' }} disabled={loading}>
            {loading ? (
              <>
                <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div>
                Signing In...
              </>
            ) : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
