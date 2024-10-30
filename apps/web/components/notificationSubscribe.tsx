// app/components/NotificationSubscribe.tsx
'use client';

import { useState } from 'react';
import { registerServiceWorker, subscribeToPushNotifications } from '../lib/notificationHelper';

export default function NotificationSubscribe({userId}: {userId: string}) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Check if the backend is accessible
      const healthCheck = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/subscribe`, {
        method: 'OPTIONS',
      }).catch(() => null);

      if (!healthCheck) {
        throw new Error('Backend server is not accessible. Please make sure it\'s running on the correct port.');
      }

      const swRegistration = await registerServiceWorker();
      await subscribeToPushNotifications(swRegistration, userId);
      setIsSubscribed(true);
    } catch (err) {
      console.error('Subscription error:', err);
      setError(
        err instanceof Error 
          ? `Error: ${err.message}` 
          : 'Failed to subscribe to notifications'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="">
      <button
        onClick={handleSubscribe}
        disabled={isLoading || isSubscribed}
        className={`px-4 py-2 rounded ${
          isSubscribed
            ? 'bg-green-500 text-white'
            : 'bg-blue-500 hover:bg-blue-600 text-white'
        } disabled:opacity-50`}
      >
        {isLoading ? 'Subscribing...' : isSubscribed ? 'Subscribed!' : 'Enable Notifications'}
      </button>
      {error && (
        <div className="mt-2 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
    </div>
  );
}