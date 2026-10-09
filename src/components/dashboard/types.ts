export type Audience = 'Everyone' | 'Person' | 'Couple';
export type AccountStatus = 'All' | 'Single' | 'Linked';

export interface UserSearchResult {
  id: string;
  name: string;
  email: string;
  hasDevice: boolean;
  partnerId: string | null;
  partnerName: string | null;
}

export interface Screen {
  id: string;
  label: string;
  // Opens a main tab that only linked users have; single users land elsewhere
  couplesOnly?: boolean;
}

// Must match SCREENS in the Meaamor-FCM function and the app's notification tap handler
export const SCREENS: Screen[] = [
  { id: 'home', label: 'Home' },
  { id: 'chat', label: 'Chat' },
  { id: 'requests', label: 'Requests' },
  { id: 'find_partner', label: 'Find partner' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'feedback', label: 'Feedback' },
  { id: 'quiz', label: 'Couple quiz', couplesOnly: true },
  { id: 'photobooth', label: 'Photobooth', couplesOnly: true },
  { id: 'calendar', label: 'Calendar', couplesOnly: true },
];

export const TITLE_LIMIT = 50;
export const BODY_LIMIT = 1000;
