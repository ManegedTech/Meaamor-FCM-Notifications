import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { account } from '../lib/appwrite';
import { callNotificationFunction, errorMessage } from './dashboard/api';
import { ConfirmDialog } from './dashboard/ConfirmDialog';
import { PhonePreview } from './dashboard/PhonePreview';
import { RecipientPicker } from './dashboard/RecipientPicker';
import { SegmentedControl } from './dashboard/SegmentedControl';
import {
  BODY_LIMIT,
  SCREENS,
  TITLE_LIMIT,
  type AccountStatus,
  type Audience,
  type UserSearchResult,
} from './dashboard/types';
import './dashboard/dashboard.css';

const AUDIENCES: Audience[] = ['Everyone', 'Person', 'Couple'];
const STATUSES: AccountStatus[] = ['All', 'Single', 'Linked'];
const MIN_AGE = 18;
const MAX_AGE = 100;

type SendKind = 'audience' | 'test';
type Result = { type: 'success' | 'error'; message: string };

const numberFormat = new Intl.NumberFormat('en-US');

function parseAge(value: string): number | null {
  if (value.trim() === '') return null;
  const age = Number(value);
  return Number.isFinite(age) ? Math.round(age) : null;
}

function peopleCount(count: number) {
  return `${numberFormat.format(count)} ${count === 1 ? 'person' : 'people'}`;
}

export function AdminDashboard() {
  const navigate = useNavigate();

  const [adminEmail, setAdminEmail] = useState('');

  // Message
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const titleRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const lastFocused = useRef<'title' | 'body'>('body');
  const pendingCaret = useRef<{ el: HTMLInputElement | HTMLTextAreaElement; pos: number } | null>(null);

  // Audience
  const [audience, setAudience] = useState<Audience>('Everyone');
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState<AccountStatus>('All');
  const [minAge, setMinAge] = useState('');
  const [maxAge, setMaxAge] = useState('');

  // On tap
  const [screen, setScreen] = useState('home');

  // Reach (Everyone only)
  const [reach, setReach] = useState<number | null>(null);
  const [reachLoading, setReachLoading] = useState(false);
  const [reachError, setReachError] = useState(false);

  // Sending
  const [sending, setSending] = useState<SendKind | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Restore the caret after a placeholder insert re-renders the field
  useLayoutEffect(() => {
    if (!pendingCaret.current) return;
    const { el, pos } = pendingCaret.current;
    pendingCaret.current = null;
    el.setSelectionRange(pos, pos);
  });

  useEffect(() => {
    account.get().then((user) => setAdminEmail(user.email)).catch(() => {});
  }, []);

  const isTargeted = audience !== 'Everyone';
  const isCouple = audience === 'Couple';

  const minAgeNum = parseAge(minAge);
  const maxAgeNum = parseAge(maxAge);
  const ageError =
    (minAgeNum !== null && (minAgeNum < MIN_AGE || minAgeNum > MAX_AGE)) ||
    (maxAgeNum !== null && (maxAgeNum < MIN_AGE || maxAgeNum > MAX_AGE))
      ? `Ages must be between ${MIN_AGE} and ${MAX_AGE}.`
      : minAgeNum !== null && maxAgeNum !== null && minAgeNum > maxAgeNum
        ? 'Min age can’t be above max age.'
        : '';

  const filters = useMemo(() => ({
    ...(location.trim() && { location: location.trim() }),
    ...(status !== 'All' && { status: status.toLowerCase() }),
    ...(minAgeNum !== null && { minAge: minAgeNum }),
    ...(maxAgeNum !== null && { maxAge: maxAgeNum }),
  }), [location, status, minAgeNum, maxAgeNum]);
  const filtersKey = JSON.stringify(filters);
  const hasFilters = filtersKey !== '{}';

  // Live count of users a broadcast would reach
  useEffect(() => {
    if (isTargeted || ageError) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      setReachLoading(true);
      setReachError(false);
      try {
        const response = await callNotificationFunction<{ count: number }>({
          action: 'count',
          filters: JSON.parse(filtersKey),
        });
        if (cancelled) return;
        if (response.success && typeof response.count === 'number') {
          setReach(response.count);
        } else {
          setReach(null);
          setReachError(true);
        }
      } catch {
        if (!cancelled) {
          setReach(null);
          setReachError(true);
        }
      } finally {
        if (!cancelled) setReachLoading(false);
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [filtersKey, isTargeted, ageError]);

  const handleLogout = async () => {
    try {
      await account.deleteSession('current');
    } catch {
      // Already signed out
    }
    navigate('/');
  };

  const changeAudience = (next: Audience) => {
    setAudience(next);
    setSelectedUser(null);
    setResult(null);
  };

  const resetFilters = () => {
    setLocation('');
    setStatus('All');
    setMinAge('');
    setMaxAge('');
  };

  // Insert a placeholder at the cursor of whichever field was focused last
  const insertVariable = (token: string) => {
    const isTitle = lastFocused.current === 'title';
    const el = isTitle ? titleRef.current : bodyRef.current;
    const value = isTitle ? title : body;
    const limit = isTitle ? TITLE_LIMIT : BODY_LIMIT;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    const next = (value.slice(0, start) + token + value.slice(end)).slice(0, limit);

    if (el) {
      el.focus();
      pendingCaret.current = { el, pos: Math.min(start + token.length, next.length) };
    }
    if (isTitle) setTitle(next);
    else setBody(next);
  };

  // Keep focus (and the selection) in the field when a placeholder chip is pressed
  const keepFieldFocus = (e: React.MouseEvent) => e.preventDefault();

  const selectedScreen = SCREENS.find((s) => s.id === screen) ?? SCREENS[0];
  const previewName = selectedUser?.name || 'Asha';
  const previewPartner = selectedUser?.partnerName || 'Ravi';
  const personalize = (text: string) =>
    text.replace(/\$name/g, previewName).replace(/\$partner/g, previewPartner);

  const recipientIds = (): string[] => {
    if (!selectedUser) return [];
    if (isCouple && selectedUser.partnerId) return [selectedUser.id, selectedUser.partnerId];
    return [selectedUser.id];
  };

  const audienceLabel = (() => {
    if (audience === 'Person') return selectedUser ? selectedUser.name || 'Unnamed' : 'No one selected';
    if (audience === 'Couple') {
      return selectedUser ? `${selectedUser.name || 'Unnamed'} & ${selectedUser.partnerName || 'Partner'}` : 'No couple selected';
    }
    const parts = [
      status !== 'All' ? status : null,
      location.trim() || null,
      minAgeNum !== null || maxAgeNum !== null ? `Age ${minAgeNum ?? MIN_AGE}–${maxAgeNum ?? MAX_AGE}` : null,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(' · ') : 'All users';
  })();

  const reachLabel = (() => {
    if (isTargeted) {
      if (!selectedUser) return '—';
      return isCouple ? '2 people' : '1 person';
    }
    if (ageError) return '—';
    if (reachLoading && reach === null) return 'Counting…';
    if (reachError) return 'Unavailable';
    if (reach === null) return '—';
    return peopleCount(reach);
  })();

  const hasMessage = title.trim() !== '' && body.trim() !== '';
  const audienceReady = isTargeted ? Boolean(selectedUser) : !ageError && reach !== 0;
  const canSend = hasMessage && audienceReady && sending === null;

  const sendLabel = (() => {
    if (sending === 'audience') return 'Sending…';
    if (audience === 'Person') return selectedUser ? `Send to ${selectedUser.name || 'person'}` : 'Send';
    if (audience === 'Couple') return selectedUser ? 'Send to couple' : 'Send';
    if (reach === 0) return 'No one matches';
    return reach !== null ? `Send to ${peopleCount(reach)}` : 'Send to everyone';
  })();

  const send = async (kind: SendKind) => {
    setConfirmOpen(false);
    setSending(kind);
    setResult(null);

    const payload: Record<string, unknown> = {
      messageTitle: title,
      messageBody: body,
      screen,
    };
    if (kind === 'test') payload.targets = { self: true };
    else if (isTargeted) payload.targets = { userIds: recipientIds() };
    else payload.filters = filters;

    try {
      const response = await callNotificationFunction(payload);
      setResult({
        type: response.success ? 'success' : 'error',
        message: response.message || (response.success ? 'Sent.' : 'Sending failed.'),
      });
    } catch (err) {
      setResult({ type: 'error', message: errorMessage(err) });
    } finally {
      setSending(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSend) return;
    // Broadcasts are wide and can't be recalled — always confirm
    if (isTargeted) send('audience');
    else setConfirmOpen(true);
  };

  return (
    <div className="dash">
      <header className="dash-header">
        <div className="dash-brand">
          <span className="dash-brand-mark" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </span>
          <div>
            <h1>Push notifications</h1>
            <p>Meaamor admin</p>
          </div>
        </div>
        <div className="dash-header-actions">
          {adminEmail && <span className="dash-admin">{adminEmail}</span>}
          <button type="button" className="dash-btn dash-btn-ghost dash-btn-sm" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </header>

      <form className="dash-layout" onSubmit={handleSubmit}>
        <div className="dash-main">
          {/* 1. Message */}
          <section className="dash-card">
            <div className="dash-card-head">
              <span className="dash-step">1</span>
              <h2>Message</h2>
              {(title || body) && (
                <button
                  type="button"
                  className="dash-link"
                  onClick={() => { setTitle(''); setBody(''); setResult(null); }}
                >
                  Clear
                </button>
              )}
            </div>

            <div className="dash-field">
              <div className="dash-label-row">
                <label htmlFor="push-title">Title</label>
                <span className="dash-counter">{title.length}/{TITLE_LIMIT}</span>
              </div>
              <input
                id="push-title"
                ref={titleRef}
                type="text"
                className="dash-input"
                value={title}
                maxLength={TITLE_LIMIT}
                onFocus={() => { lastFocused.current = 'title'; }}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Your daily quiz is ready"
              />
            </div>

            <div className="dash-field">
              <div className="dash-label-row">
                <label htmlFor="push-body">Message</label>
                <span className={`dash-counter ${body.length >= BODY_LIMIT * 0.95 ? 'is-error' : body.length >= BODY_LIMIT * 0.8 ? 'is-warn' : ''}`}>
                  {body.length}/{BODY_LIMIT}
                </span>
              </div>
              <textarea
                id="push-body"
                ref={bodyRef}
                className="dash-input dash-textarea"
                value={body}
                maxLength={BODY_LIMIT}
                rows={4}
                onFocus={() => { lastFocused.current = 'body'; }}
                onChange={(e) => setBody(e.target.value)}
                placeholder="e.g. Hey $name, see how well you know $partner today."
              />
              <div className="dash-variables">
                <span>Insert</span>
                <button type="button" className="dash-chip" onMouseDown={keepFieldFocus} onClick={() => insertVariable('$name')}>
                  $name
                </button>
                <button type="button" className="dash-chip" onMouseDown={keepFieldFocus} onClick={() => insertVariable('$partner')}>
                  $partner
                </button>
              </div>
            </div>
          </section>

          {/* 2. Audience */}
          <section className="dash-card">
            <div className="dash-card-head">
              <span className="dash-step">2</span>
              <h2>Audience</h2>
              {!isTargeted && hasFilters && (
                <button type="button" className="dash-link" onClick={resetFilters}>
                  Reset filters
                </button>
              )}
            </div>

            <SegmentedControl label="Audience" options={AUDIENCES} value={audience} onChange={changeAudience} />

            <div className="dash-audience-body" key={audience}>
              {isTargeted ? (
                <RecipientPicker
                  mode={audience as 'Person' | 'Couple'}
                  selected={selectedUser}
                  onSelect={(user) => { setSelectedUser(user); setResult(null); }}
                />
              ) : (
                <div className="dash-filters">
                  <div className="dash-field">
                    <label htmlFor="filter-location">Location</label>
                    <input
                      id="filter-location"
                      type="text"
                      className="dash-input"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Any — or a country or city, e.g. India"
                    />
                  </div>

                  <div className="dash-field">
                    <label>Account status</label>
                    <SegmentedControl label="Account status" options={STATUSES} value={status} onChange={setStatus} />
                  </div>

                  <div className="dash-field">
                    <label htmlFor="filter-min-age">Age range</label>
                    <div className="dash-age-row">
                      <input
                        id="filter-min-age"
                        type="number"
                        inputMode="numeric"
                        className={`dash-input ${ageError ? 'is-invalid' : ''}`}
                        min={MIN_AGE}
                        max={MAX_AGE}
                        value={minAge}
                        onChange={(e) => setMinAge(e.target.value)}
                        placeholder="Min (any)"
                        aria-label="Minimum age"
                      />
                      <span className="dash-age-sep">to</span>
                      <input
                        type="number"
                        inputMode="numeric"
                        className={`dash-input ${ageError ? 'is-invalid' : ''}`}
                        min={MIN_AGE}
                        max={MAX_AGE}
                        value={maxAge}
                        onChange={(e) => setMaxAge(e.target.value)}
                        placeholder="Max (any)"
                        aria-label="Maximum age"
                      />
                    </div>
                    {ageError && <p className="dash-hint is-error">{ageError}</p>}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* 3. On tap */}
          <section className="dash-card">
            <div className="dash-card-head">
              <span className="dash-step">3</span>
              <h2>When tapped, open</h2>
            </div>
            <div className="dash-screens" role="radiogroup" aria-label="Screen to open">
              {SCREENS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  role="radio"
                  aria-checked={screen === s.id}
                  className={`dash-screen ${screen === s.id ? 'is-active' : ''}`}
                  onClick={() => setScreen(s.id)}
                >
                  {s.label}
                  {s.couplesOnly && <span className="dash-screen-tag">Couples</span>}
                </button>
              ))}
            </div>
            {selectedScreen.couplesOnly && (
              <p className="dash-hint">
                {selectedScreen.label} is only on linked users’ home tabs. Single users will land on a different tab.
              </p>
            )}
          </section>
        </div>

        <aside className="dash-side">
          <PhonePreview title={personalize(title)} body={personalize(body)} />

          <section className="dash-card dash-summary">
            <dl>
              <div>
                <dt>Audience</dt>
                <dd>{audienceLabel}</dd>
              </div>
              <div>
                <dt>Reach</dt>
                <dd className={reachLoading ? 'is-loading' : ''}>{reachLabel}</dd>
              </div>
              <div>
                <dt>Opens</dt>
                <dd>{selectedScreen.label}</dd>
              </div>
            </dl>

            <button type="submit" className="dash-btn dash-btn-primary dash-btn-block" disabled={!canSend}>
              {sendLabel}
            </button>
            <button
              type="button"
              className="dash-btn dash-btn-ghost dash-btn-block"
              disabled={!hasMessage || sending !== null}
              onClick={() => send('test')}
            >
              {sending === 'test' ? 'Sending test…' : 'Send a test to me'}
            </button>
            {!hasMessage && <p className="dash-hint dash-center">Add a title and message to send.</p>}

            {result && (
              <div className={`dash-result is-${result.type}`} role="status">
                {result.message}
              </div>
            )}
          </section>
        </aside>
      </form>

      {confirmOpen && (
        <ConfirmDialog
          heading={reach !== null ? `Send to ${peopleCount(reach)}?` : 'Send to everyone?'}
          confirmLabel="Send now"
          onConfirm={() => send('audience')}
          onCancel={() => setConfirmOpen(false)}
        >
          <div className="dash-dialog-preview">
            <strong>{personalize(title)}</strong>
            <span>{personalize(body)}</span>
          </div>
          <p className="dash-hint">
            Audience: {audienceLabel}. Sent notifications can’t be recalled — consider sending a test to yourself first.
          </p>
        </ConfirmDialog>
      )}
    </div>
  );
}
