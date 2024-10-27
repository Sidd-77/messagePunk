"use client";

import React, { useEffect, useState } from 'react'
import { useUser } from "@clerk/nextjs";
import axios from 'axios';
import { UserType } from '@/types';
import { useRouter } from 'next/navigation';

const CreatingProfile = () => {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const sendUser = async (userData: UserType) => {
    try {
      const response = await axios.post(`http://localhost:5000/users/createUser`, userData);
      console.log("User stored in DB", response.data);
      router.push("/chat");
    } catch (err) {
      console.error("Error occurred while storing user in DB:", err);
      setError("Failed to create profile. Please try again.");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const createProfile = async () => {
      // Wait for Clerk to load user data
      if (!isLoaded) return;

      // Check if user is signed in
      if (!isSignedIn || !user) {
        router.push("/sign-in");
        return;
      }

      // Make sure required user data is available
      if (!user.id || !user.primaryEmailAddress?.emailAddress) {
        setError("Required user information is missing");
        return;
      }

      setIsLoading(true);

      const currentUser: UserType = {
        id: user.id,
        name: user.fullName || user.firstName || "Anonymous",
        avatar: user.imageUrl || "",
        email: user.primaryEmailAddress.emailAddress,
      };

      await sendUser(currentUser);
    };

    createProfile();
  }, [isLoaded, isSignedIn, user, router]);

  if (!isLoaded) {
    return <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-red-500 mb-4">{error}</div>
        <button 
          onClick={() => {
            setError("");
            setIsLoading(true);
            sendUser({
              id: user?.id || "",
              name: user?.fullName || user?.firstName || "Anonymous",
              avatar: user?.imageUrl || "",
              email: user?.primaryEmailAddress?.emailAddress || "",
            });
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
        <div>Creating your profile...</div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen">
      Creating Profile...
    </div>
  );
};

export default CreatingProfile;