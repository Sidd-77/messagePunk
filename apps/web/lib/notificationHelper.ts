// app/utils/config.ts
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:6000";

export async function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      console.log("Service Worker registered successfully:", registration);
      return registration;
    } catch (error) {
      console.error("Service Worker registration failed:", error);
      throw error;
    }
  }
  throw new Error("Service Worker not supported");
}

// app/utils/notificationHelper.ts
export async function subscribeToPushNotifications(
  swRegistration: ServiceWorkerRegistration,
  userId?: string,
  deviceName?: string,
) {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      throw new Error("Notification permission denied");
    }

    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      throw new Error("VAPID public key not found");
    }

    const subscription = await swRegistration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    // Send subscription to backend with additional info
    const response = await fetch(`${API_BASE_URL}/api/subscribe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        endpoint: subscription.endpoint,
        p256dh: arrayBufferToBase64(subscription.getKey("p256dh")),
        auth: arrayBufferToBase64(subscription.getKey("auth")),
        userId,
        deviceName,
      }),
    });

    const data = await response.json();

    // Store the subscription ID locally
    localStorage.setItem("pushSubscriptionId", data.subscriptionId);

    return {
      subscription,
      subscriptionId: data.subscriptionId,
    };
  } catch (error) {
    console.error("Subscription error:", error);
    throw error;
  }
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Helper function to convert ArrayBuffer to base64
function arrayBufferToBase64(buffer: ArrayBuffer | null): string {
  if (!buffer) {
    throw new Error("Buffer is null");
  }

  const bytes = new Uint8Array(buffer);
  const binary = bytes.reduce(
    (acc, byte) => acc + String.fromCharCode(byte),
    "",
  );
  return window.btoa(binary);
}
