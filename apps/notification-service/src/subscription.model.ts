export interface Subscription {
  id: string; // Changed from number to string for better uniqueness
  endpoint: string;
  p256dh: string;
  auth: string;
  userId?: string; // Optional user identifier
  deviceName?: string; // Optional device identifier
  createdAt: Date;
}

export default Subscription;
