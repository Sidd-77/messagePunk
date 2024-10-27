import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

import axios from 'axios';

export const syncUserWithBackend = async (userData: {
  clerkUserId: string;
  email: string;
  firstName?: string;
  lastName?: string;
}) => {
  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users`,
      userData,
      {
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_KEY}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error syncing user:', error);
    throw error;
  }
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
