import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useAppStore } from "@/store/main";

interface PropertyListingSummary {
  id: string;
  title: string;
  price: number;
  city: string;
  bedrooms: number;
  bathrooms: number;
  primary_image_url: string;
}

const UV_AdvancedSearch: React.FC = () => {
  // Zustand global store: update search_filter_state if needed.
  const { set_search_filter_state } = useAppStore();

  // Get search parameters from URL.
  const [searchParams, setSearchParams] = useSearchParams();

  // Local state initialization from URL parameters.
  const [searchQuery, setSearchQuery] = useState<string>(searchParams.get("keywords") || "");
  const [filterOptions, setFilterOptions] = useState<{
    price_min?: number;
    price_max?: number;
    bedrooms?: number;
    bathrooms?: number;
    property_type?: string;
    city?: string;
  }>(() => ({
    price_min: searchParams.get("price_min") ? Number(searchParams.get("price_min")) : undefined,
    price_max: searchParams.get("price_max") ? Number(searchParams.get("price_max")) : undefined,
    bedrooms: searchParams.get("bedrooms") ? Number(searchParams.get("bedrooms")) : undefined,
    bathrooms: searchParams.get("bathrooms") ? Number(searchParams.get("bathrooms")) : undefined,
    property_type: searchParams.get("property_type") || undefined,
    city: searchParams.get("city") || undefined,
  }));
  const [sortOption, setSortOption] = useState<string>(searchParams.get("sort") || "");
  const [pagination, setPagination] = useState<{ current_page: number; total_pages: number }>(() => ({
    current_page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
    total_pages: 1,
  }));

  // When URL search params change, update local state accordingly.
  useEffect(() => {
    setSearchQuery(searchParams.get("keywords") || "");
    setFilterOptions({
      price_min: searchParams.get("price_min") ? Number(searchParams.get("price_min")) : undefined,
      price_max: searchParams.get("price_max") ? Number(searchParams.get("price_max")) : undefined,
      bedrooms: searchParams.get("bedrooms") ? Number(searchParams.get("bedrooms")) : undefined,
      bathrooms: searchParams.get("bathrooms") ? Number(searchParams.get("bathrooms")) : undefined,
      property_type: searchParams.get("property_type") || undefined,
      city: searchParams.get("city") || undefined,
    });
    setSortOption(searchParams.get("sort") || "");
    setPagination((prev) => ({
      ...prev,
      current_page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
    }));
  }, [searchParams]);

  // Constant for number of listings per page.
  const LIMIT = 10;

  // Function to fetch properties based on the current filters.
  const fetchProperties = async (): Promise<PropertyListingSummary[]> => {
    const params: any = {
      keywords: searchQuery,
      page: pagination.current_page,
      limit: LIMIT,
      sort: sortOption,
    };
    if (filterOptions.price_min !== undefined) params.price_min = filterOptions.price_min;
    if (filterOptions.price_max !== undefined) params.price_max = filterOptions.price_max;
    if (filterOptions.bedrooms !== undefined) params.bedrooms = filterOptions.bedrooms;
    if (filterOptions.bathrooms !== undefined) params.bathrooms = filterOptions.bathrooms;
    if (filterOptions.property_type) params.property_type = filterOptions.property_type;
    if (filterOptions.city) params.city = filterOptions.city;

    const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
    const response = await axios.get(`${baseUrl}/api/properties`, { params });
    return response.data;
  };

  // Use React Query to fetch property listings with our current filters.
  const { data: properties, isLoading, isError, error, refetch } = useQuery<PropertyListingSummary[], Error>(
    ["properties", searchQuery, filterOptions, sortOption, pagination.current_page],
    fetchProperties,
    {
      keepPreviousData: true,
    }
  );

  // Handler to apply the current filters and update URL params and global state.
  const handleApplyFilters = useCallback(() => {
    const newParams: Record<string, string> = {};
    if (searchQuery) newParams.keywords = searchQuery;
    if (filterOptions.price_min !== undefined) newParams.price_min = String(filterOptions.price_min);
    if (filterOptions.price_max !== undefined) newParams.price_max = String(filterOptions.price_max);
    if (filterOptions.bedrooms !== undefined) newParams.bedrooms = String(filterOptions.bedrooms);
    if (filterOptions.bathrooms !== undefined) newParams.bathrooms = String(filterOptions.bathrooms);
    if (filterOptions.property_type) newParams.property_type = filterOptions.property_type;
    if (filterOptions.city) newParams.city = filterOptions.city;
    if (sortOption) newParams.sort = sortOption;
    newParams.page = String(pagination.current_page);
    setSearchParams(newParams);

    // Update global state for advanced search filters.
    set_search_filter_state({
      current_filters: { ...filterOptions, sort: sortOption, page: pagination.current_page },
    });
    refetch();
  }, [searchQuery, filterOptions, sortOption, pagination.current_page, refetch, setSearchParams, set_search_filter_state]);

  // Handlers for pagination controls.
  const handlePreviousPage = () => {
    if (pagination.current_page > 1) {
      setPagination((prev) => ({ ...prev, current_page: prev.current_page - 1 }));
    }
  };

  const handleNextPage = () => {
    if (properties && properties.length === LIMIT) {
      setPagination((prev) => ({ ...prev, current_page: prev.current_page + 1 }));
    }
  };

  // Re-apply filters when the pagination changes.
  useEffect(() => {
    handleApplyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.current_page]);

  return (
    <>
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-4">Advanced Search</h1>
        <div className="mb-4">
          <label htmlFor="search-keywords" className="block mb-1">Search</label>
          <input
            id="search-keywords"
            type="text"
            placeholder="Search by keywords, city, or zip code"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="border rounded p-2 w-full"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label htmlFor="min-price" className="block mb-1">Minimum Price</label>
            <input
              id="min-price"
              type="number"
              placeholder="Min Price"
              value={filterOptions.price_min !== undefined ? filterOptions.price_min : ''}
              onChange={e => setFilterOptions({
                ...filterOptions,
                price_min: e.target.value ? Number(e.target.value) : undefined
              })}
              className="border rounded p-2 w-full"
            />
          </div>
          <div>
            <label htmlFor="max-price" className="block mb-1">Maximum Price</label>
            <input
              id="max-price"
              type="number"
              placeholder="Max Price"
              value={filterOptions.price_max !== undefined ? filterOptions.price_max : ''}
              onChange={e => setFilterOptions({
                ...filterOptions,
                price_max: e.target.value ? Number(e.target.value) : undefined
              })}
              className="border rounded p-2 w-full"
            />
          </div>
          <div>
            <label htmlFor="bedrooms" className="block mb-1">Bedrooms</label>
            <input
              id="bedrooms"
              type="number"
              placeholder="Bedrooms"
              value={filterOptions.bedrooms !== undefined ? filterOptions.bedrooms : ''}
              onChange={e => setFilterOptions({
                ...filterOptions,
                bedrooms: e.target.value ? Number(e.target.value) : undefined
              })}
              className="border rounded p-2 w-full"
            />
          </div>
          <div>
            <label htmlFor="bathrooms" className="block mb-1">Bathrooms</label>
            <input
              id="bathrooms"
              type="number"
              placeholder="Bathrooms"
              value={filterOptions.bathrooms !== undefined ? filterOptions.bathrooms : ''}
              onChange={e => setFilterOptions({
                ...filterOptions,
                bathrooms: e.target.value ? Number(e.target.value) : undefined
              })}
              className="border rounded p-2 w-full"
            />
          </div>
          <div>
            <label htmlFor="property-type" className="block mb-1">Property Type</label>
            <input
              id="property-type"
              type="text"
              placeholder="e.g., house, apartment"
              value={filterOptions.property_type || ''}
              onChange={e => setFilterOptions({ ...filterOptions, property_type: e.target.value })}
              className="border rounded p-2 w-full"
            />
          </div>
          <div>
            <label htmlFor="city" className="block mb-1">City</label>
            <input
              id="city"
              type="text"
              placeholder="City"
              value={filterOptions.city || ''}
              onChange={e => setFilterOptions({ ...filterOptions, city: e.target.value })}
              className="border rounded p-2 w-full"
            />
          </div>
        </div>
        <div className="mb-4">
          <label htmlFor="sort-select" className="block mb-1">Sort By</label>
          <select
            id="sort-select"
            value={sortOption}
            onChange={e => setSortOption(e.target.value)}
            className="border rounded p-2 w-full"
          >
            <option value="">Select</option>
            <option value="price_asc">Price Low to High</option>
            <option value="price_desc">Price High to Low</option>
            <option value="newest">Newest</option>
          </select>
        </div>
        <button
          onClick={handleApplyFilters}
          className="bg-blue-500 text-white rounded p-2 mb-4"
        >
          Search
        </button>
        {isLoading && <div>Loading properties...</div>}
        {isError && <div>Error: {(error as Error).message}</div>}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {!isLoading && properties && properties.length > 0 ? (
            properties.map((property) => (
              <div key={property.id} className="border rounded p-4">
                <img
                  src={property.primary_image_url}
                  alt={property.title}
                  className="w-full h-48 object-cover mb-2"
                />
                <h2 className="text-xl font-semibold">{property.title}</h2>
                <p className="text-gray-600">${property.price}</p>
                <p className="text-gray-600">{property.city}</p>
                <p className="text-gray-600">
                  {property.bedrooms} bd | {property.bathrooms} ba
                </p>
                <Link to={`/properties/${property.id}`} className="text-blue-500 mt-2 inline-block">
                  View Details
                </Link>
              </div>
            ))
          ) : !isLoading ? (
            <div>No properties found.</div>
          ) : null}
        </div>
        <div className="flex justify-between items-center mt-4">
          <button
            onClick={handlePreviousPage}
            disabled={pagination.current_page === 1}
            className="bg-gray-300 text-gray-700 rounded p-2 disabled:opacity-50"
          >
            Previous
          </button>
          <span>Page {pagination.current_page}</span>
          <button
            onClick={handleNextPage}
            disabled={properties ? properties.length < LIMIT : true}
            className="bg-gray-300 text-gray-700 rounded p-2 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </>
  );
};

export default UV_AdvancedSearch;