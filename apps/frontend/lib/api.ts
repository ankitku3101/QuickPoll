import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const api = axios.create({
  baseURL: API_URL,
});

// Add auth headers from Clerk
export const setAuthHeaders = (userId: string, userName: string, userEmail?: string) => {
  api.defaults.headers.common['x-user-id'] = userId;
  api.defaults.headers.common['x-user-name'] = userName;
  if (userEmail) {
    api.defaults.headers.common['x-user-email'] = userEmail;
  }
};

export const clearAuthHeaders = () => {
  delete api.defaults.headers.common['x-user-id'];
  delete api.defaults.headers.common['x-user-name'];
  delete api.defaults.headers.common['x-user-email'];
};
