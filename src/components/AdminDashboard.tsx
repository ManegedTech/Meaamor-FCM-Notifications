import React, { useState } from 'react';
import { functions, account } from '../lib/appwrite';
import { useNavigate } from 'react-router-dom';

export function AdminDashboard() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState('');
  const [minAge, setMinAge] = useState<number | ''>('');
  const [maxAge, setMaxAge] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const navigate = useNavigate();

  const FUNCTION_ID = import.meta.env.VITE_APPWRITE_FUNCTION_ID || 'YOUR_FUNCTION_ID';

  const handleLogout = async () => {
    try {
      await account.deleteSession('current');
    } catch(e) {}
    navigate('/');
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const payload = {
        messageTitle: title,
        messageBody: body,
        filters: {
          ...(location && { location }),
          ...(status && { status }),
          ...(minAge !== '' && { minAge: Number(minAge) }),
          ...(maxAge !== '' && { maxAge: Number(maxAge) }),
        }
      };

      const response = await functions.createExecution(
        FUNCTION_ID,
        JSON.stringify(payload)
      );

      const parsedResponse = JSON.parse(response.responseBody);
      if (response.status === 'completed' && parsedResponse.success) {
        setResult({ type: 'success', message: `Success: ${parsedResponse.message}` });
        // Optional: clear form
        setTitle('');
        setBody('');
      } else {
        setResult({ type: 'error', message: `Error: ${parsedResponse.message || 'Function execution failed'}` });
      }
    } catch (err: any) {
      setResult({ type: 'error', message: `Execution Error: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container fade-in">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Push Notifications</h1>
          <p>Target and broadcast messages to users</p>
        </div>
        <button onClick={handleLogout} className="btn-secondary">
          Sign Out
        </button>
      </div>

      <div className="glass-card">
        <form onSubmit={handleSend} className="grid-layout">
          
          {/* Column 1: Message Content */}
          <div>
            <h3 className="section-title">Message Content</h3>
            
            <div className="input-group">
              <label>Notification Title</label>
              <input 
                type="text" 
                className="custom-input"
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="e.g. Special Offer!" 
                required 
              />
            </div>
            
            <div className="input-group">
              <label>Notification Body</label>
              <textarea 
                className="custom-textarea"
                value={body} 
                onChange={(e) => setBody(e.target.value)} 
                placeholder="e.g. Hello $name, check out our new update." 
                required 
                rows={5}
              />
              <small style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', display: 'block', fontSize: '0.85rem' }}>
                Use <strong>$name</strong> to insert the user's name dynamically.
              </small>
            </div>
          </div>

          {/* Column 2: Target Filters & Submit */}
          <div>
            <h3 className="section-title">Target Filters</h3>

            <div className="input-group">
              <label>Location (Country, City)</label>
              <input 
                type="text" 
                className="custom-input"
                value={location} 
                onChange={(e) => setLocation(e.target.value)} 
                placeholder="e.g. India" 
              />
            </div>

            <div className="input-group">
              <label>Account Status</label>
              <select 
                className="custom-select"
                value={status} 
                onChange={(e) => setStatus(e.target.value)} 
              >
                <option value="">Any</option>
                <option value="single">Single</option>
                <option value="linked">Linked</option>
              </select>
            </div>

            <div className="grid-row-2">
              <div className="input-group">
                <label>Min Age</label>
                <input 
                  type="number" 
                  className="custom-input"
                  value={minAge} 
                  onChange={(e) => setMinAge(e.target.value === '' ? '' : parseInt(e.target.value))} 
                  placeholder="e.g. 18" 
                />
              </div>
              <div className="input-group">
                <label>Max Age</label>
                <input 
                  type="number" 
                  className="custom-input"
                  value={maxAge} 
                  onChange={(e) => setMaxAge(e.target.value === '' ? '' : parseInt(e.target.value))} 
                  placeholder="e.g. 35" 
                />
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1.5rem' }} disabled={loading}>
              {loading ? (
                <>
                  <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div>
                  Broadcasting...
                </>
              ) : 'Send Push Notification'}
            </button>

            {result && (
              <div style={{ marginTop: '1.5rem' }}>
                <div className={`alert ${result.type === 'success' ? 'alert-success' : 'alert-error'}`}>
                  {result.message}
                </div>
              </div>
            )}

          </div>
        </form>
      </div>
    </div>
  );
}
