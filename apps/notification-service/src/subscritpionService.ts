import Subscription from "./subscription.model";
import webPush from "web-push";

const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY || "",
  privateKey: process.env.VAPID_PRIVATE_KEY || "",
};

// Using Map to store subscriptions
const subscriptions = new Map<string, Subscription>();

webPush.setVapidDetails(
  `mailto:${process.env.VAPID_EMAIL}`,
  vapidKeys.publicKey,
  vapidKeys.privateKey,
);

export const saveSubscription = async (
  subscription: Partial<Subscription>,
): Promise<Subscription> => {
  const id = subscription.id || crypto.randomUUID();
  const newSubscription: Subscription = {
    id,
    endpoint: subscription.endpoint!,
    p256dh: subscription.p256dh!,
    auth: subscription.auth!,
    userId: subscription.userId,
    deviceName: subscription.deviceName,
    createdAt: new Date(),
  };

  subscriptions.set(id, newSubscription);
  return newSubscription;
};

export const getSubscription = (id: string): Subscription | undefined => {
  return subscriptions.get(id);
};

export const getSubscriptionsByUserId = (userId: string): Subscription[] => {
  return Array.from(subscriptions.values()).filter(
    (sub) => sub.userId === userId,
  );
};

export const deleteSubscription = (id: string): boolean => {
  return subscriptions.delete(id);
};

export const sendNotificationToSubscription = async (
  subscription: Subscription,
  title: string,
  body: string,
  image?: string,
  data?: any,
): Promise<void> => {
  const pushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh,
      auth: subscription.auth,
    },
  };

  const payload = JSON.stringify({
    notification: {
      title,
      body,
      image,
      badge: "/badge.png",
      icon: "/icon.png",
      vibrate: [100, 50, 100],
      data: {
        ...data,
        dateOfArrival: Date.now(),
      },
    },
  });

  try {
    await webPush.sendNotification(pushSubscription, payload);
  } catch (error) {
    console.error(
      `Error sending notification to subscription ${subscription.id}:`,
      error,
    );
    // If subscription is invalid, remove it
    if ((error as any)?.statusCode === 410) {
      deleteSubscription(subscription.id);
    }
    throw error;
  }
};

export const sendNotificationToUser = async (
  userId: string,
  title: string,
  body: string,
  image?: string,
  data?: any,
): Promise<void> => {
  const userSubscriptions = getSubscriptionsByUserId(userId);

  const results = await Promise.allSettled(
    userSubscriptions.map((subscription) =>
      sendNotificationToSubscription(subscription, title, body, image, data),
    ),
  );

  const failures = results.filter((result) => result.status === "rejected");
  if (failures.length > 0) {
    console.error(`Failed to send notifications to ${failures.length} devices`);
  }
};
