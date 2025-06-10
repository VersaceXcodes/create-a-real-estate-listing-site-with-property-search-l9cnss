import React, { useState, useEffect } from "react";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useAppStore } from "@/store/main";

// Define interfaces for the user profile and saved listing
interface IUserProfile {
  user_id: string;
  name: string;
  email: string;
  favorites: string[]; // array of favorite property IDs
}

interface ISavedListing {
  id: string;
  user_id: string;
  property_listing_id: string;
  created_at: string;
}

interface UpdateUserProfilePayload {
  name: string;
  email: string;
}

const UV_SeekerDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  // Access global auth and notification states from Zustand store
  const auth_state = useAppStore((state) => state.auth_state);
  const add_notification = useAppStore((state) => state.add_notification);

  // Local state for profile update form
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");

  const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

  // Function to fetch user profile
  const fetchUserProfile = async (): Promise<IUserProfile> => {
    const response = await axios.get(`${baseUrl}/api/auth/profile`, {
      headers: { Authorization: `Bearer ${auth_state.token}` },
    });
    return response.data;
  };

  // Function to fetch saved listings (favorites)
  const fetchSavedListings = async (): Promise<ISavedListing[]> => {
    const response = await axios.get(`${baseUrl}/api/favorites`, {
      headers: { Authorization: `Bearer ${auth_state.token}` },
    });
    return response.data;
  };

  // Query to fetch the user profile data
  const {
    data: userProfile,
    isLoading: loadingProfile,
    error: profileError,
  } = useQuery<IUserProfile, Error>(["userProfile", auth_state.token], fetchUserProfile, { enabled: Boolean(auth_state.token) });

  // Query to fetch the saved listings
  const {
    data: savedListings,
    isLoading: loadingSavedListings,
    error: savedListingsError,
  } = useQuery<ISavedListing[], Error>(["savedListings", auth_state.token], fetchSavedListings, { enabled: Boolean(auth_state.token) });

  // Update local form state when userProfile is loaded
  useEffect(() => {
    if (userProfile) {
      setProfileName(userProfile.name);
      setProfileEmail(userProfile.email);
    }
  }, [userProfile]);

  // Function to update the user profile (PUT request)
  const updateUserProfile = async (payload: UpdateUserProfilePayload): Promise<IUserProfile> => {
    const response = await axios.put(`${baseUrl}/api/auth/profile`, payload, {
      headers: { Authorization: `Bearer ${auth_state.token}` },
    });
    return response.data;
  };

  // Mutation hook for updating the profile
  const updateProfileMutation = useMutation<IUserProfile, Error, UpdateUserProfilePayload>({
    mutationFn: updateUserProfile,
    onSuccess: (data) => {
      add_notification({ type: "success", message: "Profile updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["userProfile", auth_state.token] });
    },
    onError: (error) => {
      add_notification({ type: "error", message: error.message });
    },
  });

  // Combine loading and error states from both queries
  const loadingState = loadingProfile || loadingSavedListings;
  const errorMessage = profileError?.message || savedListingsError?.message || "";

  return (
    <>
      {loadingState ? (
        <div className="flex justify-center items-center h-full py-10">
          <p>Loading dashboard...</p>
        </div>
      ) : errorMessage ? (
        <div className="text-red-500 text-center py-10">
          <p>{errorMessage}</p>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto p-4">
          <h1 className="text-3xl font-bold mb-6">Welcome, {userProfile?.name}</h1>
          <div className="bg-white shadow rounded p-4 mb-6">
            <h2 className="text-xl font-semibold mb-4">Your Profile</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateProfileMutation.mutate({ name: profileName, email: profileEmail });
              }}
            >
              <div className="mb-4">
                <label className="block text-gray-700 mb-2" htmlFor="name">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
                Update Profile
              </button>
            </form>
          </div>
          <div className="bg-white shadow rounded p-4">
            <h2 className="text-xl font-semibold mb-4">Saved Listings</h2>
            {savedListings && savedListings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedListings.map((listing) => (
                  <div key={listing.id} className="border rounded p-4">
                    <p className="font-semibold">Property ID: {listing.property_listing_id}</p>
                    <Link
                      to={`/properties/${listing.property_listing_id}`}
                      className="text-blue-500 hover:underline"
                    >
                      View Details
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <p>No saved listings found.</p>
                <Link to="/advanced-search" className="text-blue-500 hover:underline">
                  Browse listings
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default UV_SeekerDashboard;