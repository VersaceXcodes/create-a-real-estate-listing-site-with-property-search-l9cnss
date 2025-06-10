import React, { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useAppStore } from "@/store/main";

interface IPropertyListingSummary {
  id: string;
  title: string;
  price: number;
  city: string;
  bedrooms: number;
  bathrooms: number;
  thumbnail: string;
}

const fetchPropertyList = async (params: Record<string, any>): Promise<IPropertyListingSummary[]> => {
  const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
  const response = await axios.get(`${baseURL}/api/properties`, { params });
  // Transform API response to map 'primary_image_url' to 'thumbnail'
  return response.data.map((property: any) => ({
    ...property,
    thumbnail: property.primary_image_url,
  }));
};

const UV_PropertyList: React.FC = () => {
  const location = useLocation();
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);

  // Extract URL parameters
  const urlParams: Record<string, any> = {};
  if (searchParams.get("keywords")) {
    urlParams.keywords = searchParams.get("keywords");
  }
  if (searchParams.get("price_min")) {
    urlParams.price_min = Number(searchParams.get("price_min"));
  }
  if (searchParams.get("price_max")) {
    urlParams.price_max = Number(searchParams.get("price_max"));
  }
  if (searchParams.get("bedrooms")) {
    urlParams.bedrooms = Number(searchParams.get("bedrooms"));
  }
  if (searchParams.get("page")) {
    urlParams.page = Number(searchParams.get("page"));
  }

  // Access global search filter state for consistency with UV_AdvancedSearch
  const search_filter_state = useAppStore((state) => state.search_filter_state);

  // Merge URL params with global search filters; URL params take precedence
  const combinedParams = useMemo(() => {
    return { ...search_filter_state.current_filters, ...urlParams };
  }, [search_filter_state.current_filters, urlParams]);

  // Use react-query to fetch the property listings data
  const { data, isLoading, error } = useQuery<IPropertyListingSummary[], Error>(
    ["properties", combinedParams],
    () => fetchPropertyList(combinedParams),
    { keepPreviousData: true }
  );

  const property_list = data || [];
  const loading_state = isLoading;
  const error_message = error ? error.message : "";

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Property Listings</h1>
      {loading_state && (
        <div className="text-center text-gray-600">Loading properties...</div>
      )}
      {error_message && (
        <div className="text-center text-red-500 mb-4">{error_message}</div>
      )}
      {!loading_state && property_list.length === 0 && (
        <div className="text-center text-gray-600">
          No properties found matching your criteria.
        </div>
      )}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {property_list.map((property) => (
          <Link
            key={property.id}
            to={`/properties/${property.id}`}
            className="block border rounded-lg overflow-hidden shadow hover:shadow-lg transition-shadow duration-200"
          >
            <img
              src={property.thumbnail}
              alt={property.title}
              className="w-full h-40 object-cover"
            />
            <div className="p-4">
              <h2 className="text-lg font-semibold mb-2">{property.title}</h2>
              <p className="text-indigo-600 font-bold mb-1">
                ${property.price.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">{property.city}</p>
              <div className="mt-2 text-sm text-gray-500">
                <span>{property.bedrooms} bd</span>
                {" | "}
                <span>{property.bathrooms} ba</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default UV_PropertyList;