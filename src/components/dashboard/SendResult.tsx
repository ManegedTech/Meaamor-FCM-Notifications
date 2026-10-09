import { STALE_DEVICE_DAYS, timeAgo, type DeviceFreshness, type RecipientOutcome } from './types';

export interface SendSummary {
  ok: boolean;
  message: string;
  recipients?: RecipientOutcome[];
  successCount?: number;
  failureCount?: number;
  deadTokenCount?: number;
  deviceFreshness?: Record<DeviceFreshness, number>;
}

type Tone = 'ok' | 'warn' | 'error';

function describe(r: RecipientOutcome): { tone: Tone; text: string } {
  switch (r.outcome) {
    case 'not-found':
      return { tone: 'error', text: 'User not found.' };
    case 'no-device':
      return { tone: 'error', text: 'No registered device — they need to open the app with notifications allowed.' };
    case 'dead-token':
      return { tone: 'error', text: 'Their device is no longer registered (token removed). They need to open the app again.' };
    case 'failed':
      return { tone: 'error', text: `Firebase rejected it (${r.error || 'unknown error'}).` };
    default:
      if (!r.deviceUpdatedAt) {
        return { tone: 'warn', text: 'Sent, but their device was registered by an older app version, so it may be an old phone.' };
      }
      if (r.freshness === 'stale') {
        return { tone: 'warn', text: `Sent, but their device last registered ${timeAgo(r.deviceUpdatedAt)} — it may be an old phone.` };
      }
      return { tone: 'ok', text: `Sent to the device registered ${timeAgo(r.deviceUpdatedAt)}.` };
  }
}

// Explains what happened to a send. "Sent" only means Firebase accepted it, so
// we lean on how recently each device registered to flag likely misses.
export function SendResult({ summary }: { summary: SendSummary }) {
  if (summary.recipients) {
    const lines = summary.recipients.map((r) => ({ r, ...describe(r) }));
    const tone: Tone = lines.some((l) => l.tone === 'ok')
      ? (lines.every((l) => l.tone === 'ok') ? 'ok' : 'warn')
      : lines.some((l) => l.tone === 'warn') ? 'warn' : 'error';
    const headline = tone === 'ok' ? 'Sent' : tone === 'warn' ? 'Sent — check the device' : 'Not delivered';

    return (
      <div className={`dash-result is-${tone}`} role="status">
        <div className="dash-result-title">{headline}</div>
        <ul className="dash-outcomes">
          {lines.map(({ r, tone: lineTone, text }) => (
            <li key={r.id}>
              <span className={`dash-dot is-${lineTone}`} aria-hidden="true" />
              <span>
                <strong>{r.name || r.id}</strong> {text}
              </span>
            </li>
          ))}
        </ul>
        <p className="dash-result-note">“Sent” means Firebase accepted it; phones don’t report back whether it was shown.</p>
      </div>
    );
  }

  if (!summary.ok || summary.successCount === undefined) {
    return (
      <div className={`dash-result is-${summary.ok ? 'ok' : 'error'}`} role="status">
        {summary.message}
      </div>
    );
  }

  const fresh = summary.deviceFreshness;
  const failed = summary.failureCount ?? 0;
  const dead = summary.deadTokenCount ?? 0;
  const tone: Tone = summary.successCount === 0 ? 'error' : failed > 0 || (fresh && fresh.stale + fresh.unknown > 0) ? 'warn' : 'ok';

  return (
    <div className={`dash-result is-${tone}`} role="status">
      <div className="dash-result-title">Sent to {summary.successCount.toLocaleString('en-US')}</div>
      <ul className="dash-outcomes">
        {fresh && fresh.recent > 0 && (
          <li><span className="dash-dot is-ok" aria-hidden="true" /><span>{fresh.recent.toLocaleString('en-US')} to devices registered in the last {STALE_DEVICE_DAYS} days</span></li>
        )}
        {fresh && fresh.stale > 0 && (
          <li><span className="dash-dot is-warn" aria-hidden="true" /><span>{fresh.stale.toLocaleString('en-US')} to devices older than {STALE_DEVICE_DAYS} days — may be old phones</span></li>
        )}
        {fresh && fresh.unknown > 0 && (
          <li><span className="dash-dot is-warn" aria-hidden="true" /><span>{fresh.unknown.toLocaleString('en-US')} registered by an older app version (age unknown)</span></li>
        )}
        {dead > 0 && (
          <li><span className="dash-dot is-error" aria-hidden="true" /><span>{dead.toLocaleString('en-US')} devices no longer registered — removed</span></li>
        )}
        {failed - dead > 0 && (
          <li><span className="dash-dot is-error" aria-hidden="true" /><span>{(failed - dead).toLocaleString('en-US')} rejected by Firebase</span></li>
        )}
      </ul>
      <p className="dash-result-note">“Sent” means Firebase accepted it; phones don’t report back whether it was shown.</p>
    </div>
  );
}
