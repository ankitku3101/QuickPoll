'use client'

import { setAuthHeaders, clearAuthHeaders } from '@/lib/api';
import { useUser } from '@clerk/nextjs';
import { useEffect } from 'react';


export default function AuthSync() {
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (isLoaded) {
      if (user) {
        const userName = user.username || user.firstName || user.fullName || `guest_${user.id.slice(-8)}`;
        const userEmail = user.primaryEmailAddress?.emailAddress;
        setAuthHeaders(user.id, userName, userEmail);
      } else {
        clearAuthHeaders();
      }
    }
  }, [user, isLoaded]);

  return null;
}