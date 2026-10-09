export type Audience = 'Everyone' | 'Person' | 'Couple';
export type AccountStatus = 'All' | 'Single' | 'Linked';

// Which kind of users a send reaches: decides which screens can be opened
export type RecipientKind = 'single' | 'linked' | 'mixed';

export interface UserSearchResult {
  id: string;
  name: string;
  email: string;
  hasDevice: boolean;
  // When the app last registered this user's push token (null: unknown/older app)
  deviceUpdatedAt: string | null;
  partnerId: string | null;
  partnerName: string | null;
}

export interface Screen {
  id: string;
  label: string;
  // Who has this screen in the app; 'all' screens work for everyone
  for: 'all' | 'single' | 'linked';
}

// Must match SCREENS in the Meaamor-FCM function and the app's notification tap handler
export const SCREENS: Screen[] = [
  { id: 'home', label: 'Home', for: 'all' },
  { id: 'calendar', label: 'Calendar', for: 'all' },
  { id: 'notifications', label: 'Notifications', for: 'all' },
  { id: 'feedback', label: 'Feedback', for: 'all' },
  { id: 'chat', label: 'Chat', for: 'linked' },
  { id: 'quiz', label: 'Couple quiz', for: 'linked' },
  { id: 'photobooth', label: 'Photobooth', for: 'linked' },
  { id: 'find_partner', label: 'Explore', for: 'single' },
  { id: 'requests', label: 'Requests', for: 'single' },
];

export function screensFor(kind: RecipientKind): Screen[] {
  return SCREENS.filter((s) => s.for === 'all' || s.for === kind);
}

export function isLinked(user: UserSearchResult): boolean {
  return Boolean(user.partnerId);
}

// What the function reports per recipient of a person/couple send
export interface RecipientOutcome {
  id: string;
  name: string | null;
  outcome: 'sent' | 'failed' | 'dead-token' | 'no-device' | 'not-found';
  deviceUpdatedAt?: string | null;
  freshness?: DeviceFreshness | null;
  error?: string;
}

export type DeviceFreshness = 'recent' | 'stale' | 'unknown';

// Matches STALE_DEVICE_DAYS in the Meaamor-FCM function
export const STALE_DEVICE_DAYS = 30;

export function deviceFreshness(deviceUpdatedAt: string | null): DeviceFreshness {
  if (!deviceUpdatedAt) return 'unknown';
  const ageMs = Date.now() - new Date(deviceUpdatedAt).getTime();
  return ageMs > STALE_DEVICE_DAYS * 24 * 60 * 60 * 1000 ? 'stale' : 'recent';
}

export function timeAgo(iso: string): string {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 60) return minutes <= 1 ? 'just now' : `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours} h ago`;
  return `${Math.round(hours / 24)} days ago`;
}

export const TITLE_LIMIT = 50;
export const BODY_LIMIT = 1000;
