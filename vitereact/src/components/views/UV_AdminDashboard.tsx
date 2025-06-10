import React from "react";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useAppStore } from "@/store/main";

// Define interfaces for listings and users
interface AdminListing {
  id: string;
  title: string;
  status: string;
  agent: {
    id: string;
    email: string;
  };
}

interface AdminUser {
  id: string;
  email: string;
  role: string;
}

const UV_AdminDashboard: React.FC = () => {
  const auth_state = useAppStore((state) => state.auth_state);
  const add_notification = useAppStore((state) => state.add_notification);
  const queryClient = useQueryClient();
  const token = auth_state.token;
  const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

  // Only administrators should access this view
  if (auth_state.role !== "admin") {
    return (
      <>
        <div className="p-4 text-red-500">
          Access Denied. Only administrators can view this page.
        </div>
      </>
    );
  }

  // Fetch listings pending moderation
  const fetchAdminListings = async (): Promise<AdminListing[]> => {
    const { data } = await axios.get(`${baseUrl}/api/admin/listings`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  };

  // Fetch user accounts for admin review
  const fetchAdminUsers = async (): Promise<AdminUser[]> => {
    const { data } = await axios.get(`${baseUrl}/api/admin/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  };

  const {
    data: listings,
    isLoading: listingsLoading,
    isError: listingsError,
    error: listingsErrorObj,
  } = useQuery<AdminListing[]>({
    queryKey: ["admin_listings"],
    queryFn: fetchAdminListings,
    enabled: !!token,
  });

  const {
    data: users,
    isLoading: usersLoading,
    isError: usersError,
    error: usersErrorObj,
  } = useQuery<AdminUser[]>({
    queryKey: ["admin_users"],
    queryFn: fetchAdminUsers,
    enabled: !!token,
  });

  // Mutation to update listing status for Approve/Deactivate actions
  const mutationUpdate = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await axios.put(
        `${baseUrl}/api/properties/${id}`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    },
    onSuccess: () => {
      add_notification({ type: "success", message: "Listing updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["admin_listings"] });
    },
    onError: (error: any) => {
      add_notification({ type: "error", message: error.message || "Failed to update listing" });
    },
  });

  // Handlers for actions
  const handleApprove = (id: string) => {
    mutationUpdate.mutate({ id, status: "published" });
  };

  const handleDeactivate = (id: string) => {
    mutationUpdate.mutate({ id, status: "deactivated" });
  };

  const handleManageUser = (user: AdminUser) => {
    alert(`User management for ${user.email} is not implemented yet.`);
  };

  return (
    <>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Listings Pending Moderation</h2>
          {listingsLoading ? (
            <p>Loading listings...</p>
          ) : listingsError ? (
            <p className="text-red-500">
              Error loading listings: {String(listingsErrorObj)}
            </p>
          ) : listings && listings.length > 0 ? (
            <table className="min-w-full bg-white border">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-2 text-left">Title</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Agent Email</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {listings.map((listing) => (
                  <tr key={listing.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2">
                      <Link to={`/properties/${listing.id}`} className="text-blue-600 hover:underline">
                        {listing.title}
                      </Link>
                    </td>
                    <td className="px-4 py-2">{listing.status}</td>
                    <td className="px-4 py-2">{listing.agent.email}</td>
                    <td className="px-4 py-2 space-x-2">
                      <button
                        onClick={() => handleApprove(listing.id)}
                        className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleDeactivate(listing.id)}
                        className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                      >
                        Deactivate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No listings pending moderation.</p>
          )}
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">User Accounts</h2>
          {usersLoading ? (
            <p>Loading user accounts...</p>
          ) : usersError ? (
            <p className="text-red-500">
              Error loading users: {String(usersErrorObj)}
            </p>
          ) : users && users.length > 0 ? (
            <table className="min-w-full bg-white border">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-2 text-left">Email</th>
                  <th className="px-4 py-2">Role</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2">{user.email}</td>
                    <td className="px-4 py-2">{user.role}</td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => handleManageUser(user)}
                        className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No user accounts found.</p>
          )}
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">Audit Logs</h2>
          <p>No audit logs available.</p>
        </section>
      </div>
    </>
  );
};

export default UV_AdminDashboard;