import React, { useState, useEffect } from 'react';
import { functions, account } from '../lib/appwrite';
import { useNavigate } from 'react-router-dom';
import notificationLogo from '../assets/Notification-light.png';

export function AdminDashboard() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState('All'); // 'All' | 'Single' | 'Linked'
  const [minAge, setMinAge] = useState<number | ''>('');
  const [maxAge, setMaxAge] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const [currentDate, setCurrentDate] = useState('Sunday, October 1');
  const [currentTime, setCurrentTime] = useState('9:41');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentDate(now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }));
      const hours = now.getHours() % 12 || 12;
      const minutes = now.getMinutes().toString().padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

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
          ...(status !== 'All' && { status: status.toLowerCase() }),
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
        <h1 className="dashboard-title">Create push message</h1>
        <button onClick={handleLogout} className="btn-secondary" title="Sign Out" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px', padding: '0.5rem 1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}>
          Sign out
        </button>
      </div>

      <div className="">
        <form onSubmit={handleSend} className="grid-layout">
          
          {/* Column 1: Message Content & Targets */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Message Group */}
            <div className="form-section">
              <h3 className="section-title">Message</h3>
              
              <div className="input-group">
                <label>Title</label>
                <input 
                  type="text" 
                  className="custom-input"
                  value={title} 
                  onChange={(e) => setTitle(e.target.value.substring(0, 50))} 
                  placeholder="Enter title" 
                  required 
                />
              </div>
              
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label>Message</label>
                <textarea 
                  className="custom-textarea"
                  value={body} 
                  onChange={(e) => setBody(e.target.value.substring(0, 1000))} 
                  placeholder="e.g. Hello $name, check out our new update." 
                  required 
                  rows={4}
                  style={{ minHeight: '120px' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '0.5rem', gap: '1rem' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    Use <strong>$name</strong> to insert the user's name dynamically.
                  </div>
                  <div className={`char-counter ${body.length >= 950 ? 'error' : body.length >= 800 ? 'warning' : ''}`} style={{ marginTop: 0, whiteSpace: 'nowrap' }}>
                    {body.length}/1000
                  </div>
                </div>
              </div>
            </div>

            {/* Target Filters Group */}
            <div className="form-section">
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
                <div className="sliding-toggle-track" onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  if (x < rect.width / 3) setStatus('All');
                  else if (x < (rect.width / 3) * 2) setStatus('Single');
                  else setStatus('Linked');
                }}>
                  <div 
                    className="sliding-toggle-indicator"
                    style={{
                      width: 'calc(33.33% - 8px)',
                      transform: `translateX(${status === 'All' ? '0' : status === 'Single' ? '100%' : '200%'})`
                    }}
                  />
                  <div className={`sliding-toggle-option ${status === 'All' ? 'active' : 'inactive'}`}>All</div>
                  <div className={`sliding-toggle-option ${status === 'Single' ? 'active' : 'inactive'}`}>Single</div>
                  <div className={`sliding-toggle-option ${status === 'Linked' ? 'active' : 'inactive'}`}>Linked</div>
                </div>
              </div>

              <div className="grid-row-2">
                <div className="input-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label>Min Age</label>
                    <span style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 600 }}>{minAge || 18}</span>
                  </div>
                  <input 
                    type="range"
                    min="18" max="100"
                    className="custom-range-slider"
                    value={minAge || 18} 
                    onChange={(e) => setMinAge(parseInt(e.target.value))} 
                  />
                </div>
                <div className="input-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label>Max Age</label>
                    <span style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 600 }}>{maxAge || 65}</span>
                  </div>
                  <input 
                    type="range"
                    min="18" max="100"
                    className="custom-range-slider"
                    value={maxAge || 65} 
                    onChange={(e) => setMaxAge(parseInt(e.target.value))} 
                  />
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="bottom-actions" style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '0.6rem', marginTop: '0', paddingBottom: '2rem' }}>
              <button type="button" onClick={() => {setTitle(''); setBody(''); setResult(null);}} className="btn-secondary" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '0.8rem', borderRadius: '8px', fontWeight: 500, fontSize: '1.05rem' }}>
                Clear
              </button>
              <button type="submit" className="btn-primary" style={{ background: 'var(--primary-purple)', color: '#fff', padding: '0.8rem', borderRadius: '8px', fontWeight: 600, fontSize: '1.1rem' }} disabled={loading}>
                {loading ? 'Sending...' : 'Send Push Notification'}
              </button>
            </div>
            
            {result && (
              <div style={{ marginTop: '0' }}>
                <div className={`alert ${result.type === 'success' ? 'alert-success' : 'alert-error'}`}>
                  {result.message}
                </div>
              </div>
            )}
          </div>

          {/* Column 2: Live Device Preview */}
          <aside className="preview-container">
            <div className="mobile-mockup">
              <div className="mobile-mockup-bg"></div>
              
              <div className="mobile-header">
                <span className="mobile-time" style={{ fontSize: '0.9rem', fontWeight: 600 }}>{currentTime}</span>
                <div className="mobile-dynamic-island"></div>
                <div className="mobile-signals" style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                  {/* Cellular */}
                  <svg width="17" height="11" viewBox="0 0 17 11" fill="none">
                    <rect x="0" y="7" width="2.5" height="4" rx="0.5" fill="#fff"/>
                    <rect x="4.5" y="5" width="2.5" height="6" rx="0.5" fill="#fff"/>
                    <rect x="9" y="3" width="2.5" height="8" rx="0.5" fill="#fff"/>
                    <rect x="13.5" y="0" width="2.5" height="11" rx="0.5" fill="#fff"/>
                  </svg>
                  {/* WiFi */}
                  <svg width="15" height="11" viewBox="0 0 15 11" fill="none">
                    <path d="M7.5 11C8.32843 11 9 10.3284 9 9.5C9 8.67157 8.32843 8 7.5 8C6.67157 8 6 8.67157 6 9.5C6 10.3284 6.67157 11 7.5 11Z" fill="#fff"/>
                    <path d="M4.67157 6.67157C6.2337 5.10945 8.7663 5.10945 10.3284 6.67157" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/>
                    <path d="M2.55025 4.55025C5.284 1.8165 9.716 1.8165 12.4497 4.55025" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                  {/* Battery */}
                  <svg width="24" height="11" viewBox="0 0 24 11" fill="none">
                    <rect x="0.5" y="0.5" width="20" height="10" rx="3.5" stroke="#fff" strokeWidth="1"/>
                    <rect x="2" y="2" width="13" height="7" rx="2" fill="#fff"/>
                    <path d="M22 3.5V7.5" stroke="#fff" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>

              <div className="mobile-lock-time">
                <div className="date">{currentDate}</div>
                <div className="time">{currentTime}</div>
              </div>
              
              <div className="ios-notification">
                <div className="ios-notification-header">
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <div className="ios-notification-app-icon" style={{ background: '#2E332E', borderRadius: '4px', overflow: 'hidden' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                      </svg>
                    </div>
                    <span style={{ fontWeight: 600, letterSpacing: '0.2px', fontSize: '0.85rem' }}>Meaamor</span>
                  </div>
                  <span style={{ marginLeft: 'auto', fontWeight: 400, opacity: 0.7 }}>now</span>
                </div>
                <div className="ios-notification-title">
                  {title || 'Message Title'}
                </div>
                <div className="ios-notification-body">
                  {body ? body.replace('$name', 'User') : 'Enter your message in the input field on the left to see it here'}
                </div>
              </div>
            </div>
          </aside>
        </form>
      </div>
    </div>
  );
}
