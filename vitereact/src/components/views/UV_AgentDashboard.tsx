import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useAppStore } from "@/store/main";

// Define interfaces based on the OpenAPI schemas
interface PropertyListingSummary {
  id: string;
  title: string;
  price: number;
  city: string;
  bedrooms: number;
  bathrooms: number;
  primary_image_url: string;
  status?: string;
}

interface InquiryResponse {
  id: string;
  property_listing_id: string;
  sender_name: string;
  sender_email: string;
  sender_phone?: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

const UV_AgentDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"listings" | "inquiries">("listings");

  // Get auth state and notification action from global store
  const { auth_state, add_notification } = useAppStore((state) => ({
    auth_state: state.auth_state,
    add_notification: state.add_notification,
  }));

  const queryClient = useQueryClient();
  const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

  // Fetch agent's property listings filtered by agent_id
  const fetchAgentListings = async (): Promise<PropertyListingSummary[]> => {
    const response = await axios.get(`${baseUrl}/api/properties?agent_id=${auth_state.user_id}`, {
      headers: { Authorization: `Bearer ${auth_state.token}` },
    });
    return response.data;
  };

  // Fetch agent's inquiries
  const fetchAgentInquiries = async (): Promise<InquiryResponse[]> => {
    const response = await axios.get(`${baseUrl}/api/agent/inquiries`, {
      headers: { Authorization: `Bearer ${auth_state.token}` },
    });
    return response.data;
  };

  // Use react-query to fetch listings with auth token as a dependency
  const {
    data: listings,
    isLoading: listingsLoading,
    isError: listingsIsError,
    error: listingsError,
  } = useQuery<PropertyListingSummary[], Error>(["agentListings", auth_state.token], fetchAgentListings);

  // Use react-query to fetch inquiries with auth token as a dependency
  const {
    data: inquiries,
    isLoading: inquiriesLoading,
    isError: inquiriesIsError,
    error: inquiriesError,
  } = useQuery<InquiryResponse[], Error>(["agentInquiries", auth_state.token], fetchAgentInquiries);

  // Define delete mutation for a listing (DELETE /api/properties/:id)
  const deleteListingApi = async (id: string): Promise<any> => {
    const response = await axios.delete(
      `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}/api/properties/${id}`,
      {
        headers: { Authorization: `Bearer ${auth_state.token}` },
      }
    );
    return response.data;
  };

  const deleteMutation = useMutation(deleteListingApi, {
    onSuccess: () => {
      add_notification({ type: "success", message: "Listing deleted successfully" });
      queryClient.invalidateQueries(["agentListings", auth_state.token]);
    },
    onError: () => {
      add_notification({ type: "error", message: "Failed to delete listing" });
    },
  });

  // Combined loading and error state
  const loadingState = listingsLoading || inquiriesLoading;
  const errorMessage = listingsIsError
    ? listingsError?.message
    : inquiriesIsError
    ? inquiriesError?.message
    : "";

  return (
    <>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Agent Dashboard</h1>
        <div className="mb-4 flex items-center space-x-4">
          <button
            type="button"
            onClick={() => setActiveTab("listings")}
            className={`px-4 py-2 rounded ${
              activeTab === "listings"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            Listings
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("inquiries")}
            className={`px-4 py-2 rounded ${
              activeTab === "inquiries"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            Inquiries
          </button>
          <div className="ml-auto">
            <Link
              to="/dashboard/agent/create"
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
            >
              Create New Listing
            </Link>
          </div>
        </div>

        {loadingState && (
          <div className="text-center py-4">Loading...</div>
        )}

        {!loadingState && errorMessage && (
          <div className="text-red-500 mb-4">Error: {errorMessage}</div>
        )}

        {!loadingState && !errorMessage && activeTab === "listings" && (
          <div>
            {listings && listings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {listings.map((listing) => (
                  <div key={listing.id} className="border p-4 rounded shadow">
                    <h2 className="text-xl font-semibold">{listing.title}</h2>
                    <p>Price: ${listing.price}</p>
                    <p>City: {listing.city}</p>
                    <p>
                      Bedrooms: {listing.bedrooms}, Bathrooms: {listing.bathrooms}
                    </p>
                    <p>Status: {listing.status || "Active"}</p>
                    <div className="mt-2 flex space-x-2">
                      <Link
                        to={`/dashboard/agent/edit/${listing.id}`}
                        className="text-blue-500"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => deleteMutation.mutate(listing.id)}
                        className="text-red-500"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div>No listings available.</div>
            )}
          </div>
        )}

        {!loadingState && !errorMessage && activeTab === "inquiries" && (
          <div>
            {inquiries && inquiries.length > 0 ? (
              <div className="space-y-4">
                {inquiries.map((inquiry) => (
                  <div key={inquiry.id} className="border p-4 rounded shadow">
                    <h3 className="text-lg font-semibold">
                      Inquiry from: {inquiry.sender_name}
                    </h3>
                    <p>Email: {inquiry.sender_email}</p>
                    {inquiry.sender_phone && <p>Phone: {inquiry.sender_phone}</p>}
                    <p>Message: {inquiry.message}</p>
                    <p className="text-sm text-gray-500">
                      Date: {new Date(inquiry.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div>No inquiries available.</div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default UV_AgentDashboard;