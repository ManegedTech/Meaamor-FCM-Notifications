import { useEffect, useState } from 'react';
import { callNotificationFunction, errorMessage } from './api';
import { STALE_DEVICE_DAYS, deviceFreshness, isLinked, timeAgo, type UserSearchResult } from './types';

interface RecipientPickerProps {
  mode: 'Person' | 'Couple';
  selected: UserSearchResult | null;
  onSelect: (user: UserSearchResult | null) => void;
}

function TypePill({ user }: { user: UserSearchResult }) {
  return isLinked(user)
    ? <span className="dash-pill is-linked">In a couple</span>
    : <span className="dash-pill is-single">Single</span>;
}

// How recently this person's phone registered for pushes — a stale one may be an old phone
function DevicePill({ user }: { user: UserSearchResult }) {
  if (!user.hasDevice) return <span className="dash-pill is-warn">No device</span>;
  const freshness = deviceFreshness(user.deviceUpdatedAt);
  if (freshness === 'unknown') {
    return (
      <span className="dash-pill is-muted" title="Registered by an older app version, so we don't know when">
        Device · age unknown
      </span>
    );
  }
  return (
    <span
      className={`dash-pill ${freshness === 'stale' ? 'is-warn' : 'is-ok'}`}
      title={freshness === 'stale' ? `Not registered in ${STALE_DEVICE_DAYS}+ days — may be an old phone` : 'Registered recently'}
    >
      Device · {timeAgo(user.deviceUpdatedAt!)}
    </span>
  );
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}

export function RecipientPicker({ mode, selected, onSelect }: RecipientPickerProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  const trimmed = query.trim();
  const showResults = !selected && trimmed.length >= 2;

  // Debounced search; stale results are hidden via showResults rather than cleared here
  useEffect(() => {
    if (selected || trimmed.length < 2) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      setSearching(true);
      setSearchError('');
      try {
        const response = await callNotificationFunction<{ results: UserSearchResult[] }>({
          action: 'search',
          query: trimmed,
        });
        if (cancelled) return;
        if (response.success) {
          setResults(response.results ?? []);
        } else {
          setResults([]);
          setSearchError(response.message || 'Search failed');
        }
      } catch (err) {
        if (!cancelled) setSearchError(errorMessage(err));
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [trimmed, selected]);

  if (selected) {
    const couple = mode === 'Couple';
    return (
      <div className="dash-recipient is-selected">
        <div className="dash-avatar-stack">
          <span className="dash-avatar">{initials(selected.name || '?')}</span>
          {couple && <span className="dash-avatar">{initials(selected.partnerName || '?')}</span>}
        </div>
        <div className="dash-recipient-text">
          <div className="dash-recipient-name">
            {couple
              ? `${selected.name || 'Unnamed'} & ${selected.partnerName || 'Partner'}`
              : selected.name || 'Unnamed'}
          </div>
          <div className="dash-recipient-meta">{selected.email || selected.id}</div>
        </div>
        <span className="dash-pills">
          {!couple && <TypePill user={selected} />}
          <DevicePill user={selected} />
        </span>
        <button
          type="button"
          className="dash-btn dash-btn-ghost dash-btn-sm"
          onClick={() => { onSelect(null); setQuery(''); }}
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <div className="dash-picker">
      <div className="dash-search">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          type="text"
          className="dash-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={mode === 'Couple' ? 'Search either partner by name, email or ID' : 'Search by name, email or user ID'}
          aria-label={mode === 'Couple' ? 'Find either partner' : 'Find a person'}
          autoFocus
        />
        {showResults && searching && <span className="dash-spinner" aria-label="Searching" />}
      </div>

      {showResults && searchError && <p className="dash-hint is-error">{searchError}</p>}
      {showResults && !searching && !searchError && results.length === 0 && (
        <p className="dash-hint">No users match “{trimmed}”.</p>
      )}
      {!showResults && (
        <p className="dash-hint">
          {mode === 'Couple'
            ? 'Type at least 2 characters. Both partners will receive the notification.'
            : 'Type at least 2 characters.'}
        </p>
      )}

      {showResults && results.length > 0 && (
        <ul className="dash-results">
          {results.map((user) => {
            const notLinked = mode === 'Couple' && !isLinked(user);
            return (
              <li key={user.id}>
                <button
                  type="button"
                  className="dash-recipient"
                  disabled={notLinked}
                  onClick={() => onSelect(user)}
                >
                  <span className="dash-avatar">{initials(user.name || '?')}</span>
                  <span className="dash-recipient-text">
                    <span className="dash-recipient-name">
                      {user.name || 'Unnamed'}
                      {user.partnerName && <span className="dash-partner"> & {user.partnerName}</span>}
                    </span>
                    <span className="dash-recipient-meta">{user.email || user.id}</span>
                  </span>
                  <span className="dash-pills">
                    <TypePill user={user} />
                    {!notLinked && <DevicePill user={user} />}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
