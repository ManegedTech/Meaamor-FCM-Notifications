import { functions } from '../../lib/appwrite';

const FUNCTION_ID = import.meta.env.VITE_APPWRITE_FUNCTION_ID || 'YOUR_FUNCTION_ID';

export interface FunctionResult {
  success: boolean;
  message?: string;
}

// Runs the Meaamor-FCM function and returns its parsed JSON response
export async function callNotificationFunction<T extends object = object>(
  payload: Record<string, unknown>
): Promise<FunctionResult & Partial<T>> {
  const execution = await functions.createExecution(FUNCTION_ID, JSON.stringify(payload));
  try {
    return JSON.parse(execution.responseBody);
  } catch {
    throw new Error(
      execution.status === 'failed'
        ? 'The notification function failed to run.'
        : 'Unexpected response from the notification function.'
    );
  }
}

export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
