import { useEffect, useState } from 'react';

interface PhonePreviewProps {
  title: string;
  body: string;
}

function formatNow() {
  const now = new Date();
  return {
    date: now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
    time: `${now.getHours() % 12 || 12}:${now.getMinutes().toString().padStart(2, '0')}`,
  };
}

// Lock-screen mockup showing how the notification will look
export function PhonePreview({ title, body }: PhonePreviewProps) {
  const [now, setNow] = useState(formatNow);

  useEffect(() => {
    const interval = setInterval(() => setNow(formatNow()), 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="dash-phone" aria-label="Notification preview">
      <div className="dash-phone-status">
        <span>{now.time}</span>
        <span className="dash-phone-island" />
        <span className="dash-phone-icons" aria-hidden="true">
          <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor">
            <rect x="0" y="7" width="2.5" height="4" rx="0.5" />
            <rect x="4.5" y="5" width="2.5" height="6" rx="0.5" />
            <rect x="9" y="3" width="2.5" height="8" rx="0.5" />
            <rect x="13.5" y="0" width="2.5" height="11" rx="0.5" />
          </svg>
          <svg width="24" height="11" viewBox="0 0 24 11" fill="none" stroke="currentColor">
            <rect x="0.5" y="0.5" width="20" height="10" rx="3.5" />
            <rect x="2" y="2" width="13" height="7" rx="2" fill="currentColor" stroke="none" />
          </svg>
        </span>
      </div>

      <div className="dash-phone-clock">
        <div className="dash-phone-date">{now.date}</div>
        <div className="dash-phone-time">{now.time}</div>
      </div>

      <div className="dash-notification" key={title || body ? 'filled' : 'empty'}>
        <div className="dash-notification-head">
          <span className="dash-notification-icon" aria-hidden="true">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </span>
          <span className="dash-notification-app">Meaamor</span>
          <span className="dash-notification-when">now</span>
        </div>
        <div className="dash-notification-title">{title || 'Notification title'}</div>
        <div className="dash-notification-body">{body || 'Your message will appear here as you type.'}</div>
      </div>
    </div>
  );
}
