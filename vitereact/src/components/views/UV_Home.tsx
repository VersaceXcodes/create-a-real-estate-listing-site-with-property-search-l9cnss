import React, { useEffect, useState, KeyboardEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useAppStore } from "@/store/main";

// Define the interface for a Featured Listing
interface FeaturedListing {
  id: string;
  title: string;
  price: number;
  city: string;
  thumbnail: string;
}

const UV_Home: React.FC = () => {
  // Local state for quick search input
  const [quickSearchInput, setQuickSearchInput] = useState<string>("");

  // Global store for layout state
  const set_global_layout_state = useAppStore((state) => state.set_global_layout_state);
  const globalLayout = useAppStore((state) => state.global_layout_state);

  // useNavigate hook from react-router-dom for redirection on quick search submission
  const navigate = useNavigate();

  // Function to load featured listings from the backend
  const loadFeaturedListings = async (): Promise<FeaturedListing[]> => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
      const response = await axios.get(`${apiBaseUrl}/api/properties`, {
        params: { limit: 5 } // optionally limit the featured listings to 5
      });
      // Map backend field "primary_image_url" to our "thumbnail" field
      const listings: FeaturedListing[] = response.data.map((item: any) => ({
        id: item.id,
        title: item.title,
        price: item.price,
        city: item.city,
        thumbnail: item.primary_image_url
      }));
      return listings;
    } catch (err: any) {
      throw new Error(err?.message || "Failed to load featured listings");
    }
  };

  // useQuery to fetch the featured listings on component mount
  const { data: featured_listings = [], isLoading, isError, error } = useQuery<FeaturedListing[], Error>(
    { queryKey: ["featured_listings"], queryFn: loadFeaturedListings }
  );

  // Update the global layout state to set current_view to "UV_Home"
  useEffect(() => {
    set_global_layout_state({ current_view: "UV_Home", device_type: globalLayout.device_type });
  }, [set_global_layout_state, globalLayout.device_type]);

  // Function to handle quick search submission
  const submitQuickSearch = () => {
    const trimmedInput = quickSearchInput.trim();
    // Redirect to /properties with query parameter "keywords"
    navigate(`/properties?keywords=${encodeURIComponent(trimmedInput)}`);
  };

  // Handler for key down event in quick search input
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      submitQuickSearch();
    }
  };

  return (
    <>
      {/* Hero Section */}
      <div className="bg-blue-500 text-white p-8 text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to EstateFinder</h1>
        <p className="mb-6">Find your perfect home with our advanced property search.</p>
        <div className="flex justify-center">
          <input
            type="text"
            aria-label="Quick Search"
            value={quickSearchInput}
            onChange={(e) => setQuickSearchInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter keywords (e.g., garden, pool, etc.)"
            className="p-2 rounded-l border-0 text-black w-64"
          />
          <button
            type="button"
            onClick={submitQuickSearch}
            className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-r"
          >
            Search
          </button>
        </div>
      </div>

      {/* Featured Listings Section */}
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-semibold mb-4">Featured Listings</h2>
        {isLoading ? (
          <p>Loading featured listings...</p>
        ) : isError ? (
          <p className="text-red-600">Error loading listings: {error?.message}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {featured_listings.map((listing) => (
              <Link
                key={listing.id}
                to={`/properties/${listing.id}`}
                className="border rounded shadow hover:shadow-lg transition p-4"
              >
                <img
                  src={listing.thumbnail}
                  alt={listing.title}
                  className="w-full h-48 object-cover mb-4 rounded"
                />
                <h3 className="font-bold text-lg">{listing.title}</h3>
                <p className="text-green-600 font-semibold">${listing.price.toLocaleString()}</p>
                <p className="text-gray-500">{listing.city}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default UV_Home;