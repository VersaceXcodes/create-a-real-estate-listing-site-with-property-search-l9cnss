import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAppStore } from '@/store/main';

interface ProfileDetails {
  name: string;
  email: string;
  password: string;
  profilePicture: string;
}

const UV_ProfileManagement: React.FC = () => {
  const { auth_user, set_auth_user, set_notification } = useAppStore();
  const queryClient = useQueryClient();

  const [profileDetails, setProfileDetails] = useState<ProfileDetails>({
    name: '', // Assume fetching the real name separately
    email: auth_user.email,
    password: '',
    profilePicture: '', // Assume a way to retrieve image url if already uploaded
  });

  const updateProfile = async (updatedDetails: ProfileDetails) => {
    const response = await axios.put(
      `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/users/profile`,
      updatedDetails
    );
    return response.data;
  };

  const mutation = useMutation(updateProfile, {
    onSuccess: (data) => {
      set_auth_user({ ...auth_user, ...data });
      set_notification({ type: 'success', message: 'Profile updated successfully.' });
      queryClient.invalidateQueries('profile'); // Invalidate any queries related to profile for refetch
    },
    onError: (error: any) => {
      set_notification({ type: 'error', message: 'An error occurred while updating profile.' });
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileDetails({ ...profileDetails, [name]: value });
  };

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(profileDetails);
  };

  return (
    <>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Profile Management</h1>
        <form className="max-w-md mx-auto" onSubmit={handleProfileUpdate}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
              Name
            </label>
            <input
              type="text"
              name="name"
              id="name"
              value={profileDetails.name}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
              Email
            </label>
            <input
              type="email"
              name="email"
              id="email"
              value={profileDetails.email}
              readOnly
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              Password
            </label>
            <input
              type="password"
              name="password"
              id="password"
              value={profileDetails.password}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="profilePicture">
              Profile Picture URL
            </label>
            <input
              type="text"
              name="profilePicture"
              id="profilePicture"
              value={profileDetails.profilePicture}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default UV_ProfileManagement;