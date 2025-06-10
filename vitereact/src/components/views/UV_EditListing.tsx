import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useAppStore } from "@/store/main";

interface IListingForm {
  title: string;
  description: string;
  property_type: string;
  price: number;
  address: string;
  city: string;
  zip_code: string;
  amenities: string[];
  bedrooms: number;
  bathrooms: number;
  area: number;
  latitude: number;
  longitude: number;
}

interface IImageUpload {
  image_url: string;
  alt_text: string;
  display_order: number;
}

interface IPublishState {
  isPublished: boolean;
}

const defaultListingForm: IListingForm = {
  title: "",
  description: "",
  property_type: "",
  price: 0,
  address: "",
  city: "",
  zip_code: "",
  amenities: [],
  bedrooms: 0,
  bathrooms: 0,
  area: 0,
  latitude: 0,
  longitude: 0,
};

const defaultPublishState: IPublishState = {
  isPublished: false,
};

const UV_EditListing: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const auth_state = useAppStore((state) => state.auth_state);
  const add_notification = useAppStore((state) => state.add_notification);

  const [listingForm, setListingForm] = useState<IListingForm>(defaultListingForm);
  const [imageUploads, setImageUploads] = useState<IImageUpload[]>([]);
  const [publishState, setPublishState] = useState<IPublishState>(defaultPublishState);
  const [formErrors, setFormErrors] = useState<string>("");

  const base_url = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

  // Fetch the listing details using the listing id
  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery(["listing", id], async () => {
    const response = await axios.get(`${base_url}/api/properties/${id}`);
    return response.data;
  });

  // On data load, pre-populate form states and verify ownership
  useEffect(() => {
    if (data) {
      // Check if the current authenticated agent owns this listing
      if (data.agent && data.agent.id && data.agent.id !== auth_state.user_id) {
        add_notification({ type: "error", message: "You are not authorized to edit this listing." });
      } else {
        setListingForm({
          title: data.title || "",
          description: data.description || "",
          property_type: data.property_type || "",
          price: data.price || 0,
          address: data.address || "",
          city: data.city || "",
          zip_code: data.zip_code || "",
          amenities: data.amenities || [],
          bedrooms: data.bedrooms || 0,
          bathrooms: data.bathrooms || 0,
          area: data.area || 0,
          latitude: data.latitude || 0,
          longitude: data.longitude || 0,
        });
        setImageUploads(data.images || []);
        setPublishState({ isPublished: !!data.published_at });
      }
    }
  }, [data, auth_state.user_id, add_notification]);

  // Form validation function
  const validateForm = () => {
    if (!listingForm.title.trim()) return "Title is required";
    if (!listingForm.description.trim()) return "Description is required";
    if (!listingForm.property_type.trim()) return "Property type is required";
    if (listingForm.price <= 0) return "Price must be greater than zero";
    if (!listingForm.address.trim()) return "Address is required";
    if (!listingForm.city.trim()) return "City is required";
    if (!listingForm.zip_code.trim()) return "Zip code is required";
    return "";
  };

  // Mutation for updating the listing
  const updateListingMutation = useMutation(
    async () => {
      const payload = {
        ...listingForm,
        images: imageUploads,
        published_at: publishState.isPublished ? new Date().toISOString() : null
      };
      const response = await axios.put(`${base_url}/api/properties/${id}`, payload, {
        headers: { Authorization: `Bearer ${auth_state.token}` },
      });
      return response.data;
    },
    {
      onSuccess: () => {
        add_notification({ type: "success", message: "Listing updated successfully." });
        queryClient.invalidateQueries(["listing", id]);
      },
      onError: (err: any) => {
        add_notification({
          type: "error",
          message: err.response?.data?.error || "Failed to update listing.",
        });
      },
    }
  );

  // Mutation for deleting the listing
  const deleteListingMutation = useMutation(
    async () => {
      const response = await axios.delete(`${base_url}/api/properties/${id}`, {
        headers: { Authorization: `Bearer ${auth_state.token}` },
      });
      return response.data;
    },
    {
      onSuccess: () => {
        add_notification({ type: "success", message: "Listing deleted successfully." });
        navigate("/dashboard/agent");
      },
      onError: (err: any) => {
        add_notification({
          type: "error",
          message: err.response?.data?.error || "Failed to delete listing.",
        });
      },
    }
  );

  // Handle form submission for update
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errorText = validateForm();
    if (errorText) {
      setFormErrors(errorText);
      add_notification({ type: "error", message: errorText });
      return;
    }
    updateListingMutation.mutate();
  };

  // Handle deletion click with confirmation
  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this listing?")) {
      deleteListingMutation.mutate();
    }
  };

  // Handle input changes for text and number fields in listingForm
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setListingForm((prev) => ({
      ...prev,
      [name]:
        typeof prev[name as keyof IListingForm] === "number" ? Number(value) : value,
    }));
  };

  // Handle checkbox changes for publish state
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    if (name === "isPublished") {
      setPublishState({ isPublished: checked });
    }
  };

  // Handle change for the amenities field (comma separated)
  const handleAmenitiesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const amenitiesArray = value.split(",").map((amenity) => amenity.trim()).filter(Boolean);
    setListingForm((prev) => ({ ...prev, amenities: amenitiesArray }));
  };

  // Handle changes for image uploads
  const handleImageChange = (
    index: number,
    field: keyof IImageUpload,
    value: string | number
  ) => {
    setImageUploads((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Add a new empty image entry
  const handleAddImage = () => {
    setImageUploads((prev) => [
      ...prev,
      { image_url: "", alt_text: "", display_order: prev.length + 1 },
    ]);
  };

  // Remove an image entry at the specified index
  const handleRemoveImage = (index: number) => {
    setImageUploads((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <>
      {isLoading ? (
        <div className="p-4">Loading listing details...</div>
      ) : isError ? (
        <div className="p-4 text-red-500">Error loading listing details.</div>
      ) : (
        <>
          {data && data.agent && data.agent.id !== auth_state.user_id ? (
            <div className="p-4 text-red-500">
              You are not authorized to edit this listing.
            </div>
          ) : (
            <div className="max-w-4xl mx-auto p-4">
              <h1 className="text-2xl font-bold mb-4">Edit Listing</h1>
              {formErrors && (
                <div className="mb-4 text-red-500">{formErrors}</div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex flex-col">
                  <label className="font-semibold" htmlFor="title">
                    Title
                  </label>
                  <input
                    id="title"
                    name="title"
                    type="text"
                    value={listingForm.title}
                    onChange={handleInputChange}
                    className="border p-2"
                    required
                  />
                </div>
                <div className="flex flex-col">
                  <label className="font-semibold" htmlFor="description">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={listingForm.description}
                    onChange={handleInputChange}
                    className="border p-2"
                    required
                  />
                </div>
                <div className="flex flex-col">
                  <label className="font-semibold" htmlFor="property_type">
                    Property Type
                  </label>
                  <input
                    id="property_type"
                    name="property_type"
                    type="text"
                    value={listingForm.property_type}
                    onChange={handleInputChange}
                    className="border p-2"
                    required
                  />
                </div>
                <div className="flex flex-col">
                  <label className="font-semibold" htmlFor="price">
                    Price
                  </label>
                  <input
                    id="price"
                    name="price"
                    type="number"
                    value={listingForm.price}
                    onChange={handleInputChange}
                    className="border p-2"
                    required
                  />
                </div>
                <div className="flex flex-col">
                  <label className="font-semibold" htmlFor="address">
                    Address
                  </label>
                  <input
                    id="address"
                    name="address"
                    type="text"
                    value={listingForm.address}
                    onChange={handleInputChange}
                    className="border p-2"
                    required
                  />
                </div>
                <div className="flex flex-col">
                  <label className="font-semibold" htmlFor="city">
                    City
                  </label>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    value={listingForm.city}
                    onChange={handleInputChange}
                    className="border p-2"
                    required
                  />
                </div>
                <div className="flex flex-col">
                  <label className="font-semibold" htmlFor="zip_code">
                    Zip Code
                  </label>
                  <input
                    id="zip_code"
                    name="zip_code"
                    type="text"
                    value={listingForm.zip_code}
                    onChange={handleInputChange}
                    className="border p-2"
                    required
                  />
                </div>
                <div className="flex flex-col">
                  <label className="font-semibold" htmlFor="amenities">
                    Amenities (comma separated)
                  </label>
                  <input
                    id="amenities"
                    name="amenities"
                    type="text"
                    value={listingForm.amenities.join(", ")}
                    onChange={handleAmenitiesChange}
                    className="border p-2"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="font-semibold" htmlFor="bedrooms">
                    Bedrooms
                  </label>
                  <input
                    id="bedrooms"
                    name="bedrooms"
                    type="number"
                    value={listingForm.bedrooms}
                    onChange={handleInputChange}
                    className="border p-2"
                    required
                  />
                </div>
                <div className="flex flex-col">
                  <label className="font-semibold" htmlFor="bathrooms">
                    Bathrooms
                  </label>
                  <input
                    id="bathrooms"
                    name="bathrooms"
                    type="number"
                    value={listingForm.bathrooms}
                    onChange={handleInputChange}
                    className="border p-2"
                    required
                  />
                </div>
                <div className="flex flex-col">
                  <label className="font-semibold" htmlFor="area">
                    Area (sq ft)
                  </label>
                  <input
                    id="area"
                    name="area"
                    type="number"
                    value={listingForm.area}
                    onChange={handleInputChange}
                    className="border p-2"
                    required
                  />
                </div>
                <div className="flex flex-col">
                  <label className="font-semibold" htmlFor="latitude">
                    Latitude
                  </label>
                  <input
                    id="latitude"
                    name="latitude"
                    type="number"
                    value={listingForm.latitude}
                    onChange={handleInputChange}
                    className="border p-2"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="font-semibold" htmlFor="longitude">
                    Longitude
                  </label>
                  <input
                    id="longitude"
                    name="longitude"
                    type="number"
                    value={listingForm.longitude}
                    onChange={handleInputChange}
                    className="border p-2"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="font-semibold" htmlFor="isPublished">
                    Publish Listing
                  </label>
                  <input
                    id="isPublished"
                    name="isPublished"
                    type="checkbox"
                    checked={publishState.isPublished}
                    onChange={handleCheckboxChange}
                    className="border p-2"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="font-semibold">Images</label>
                  {imageUploads.map((img, index) => (
                    <div key={index} className="border p-2 mb-2">
                      <div className="flex flex-col">
                        <label className="font-semibold" htmlFor={`image_url_${index}`}>
                          Image URL
                        </label>
                        <input
                          id={`image_url_${index}`}
                          name="image_url"
                          type="text"
                          value={img.image_url}
                          onChange={(e) =>
                            handleImageChange(index, "image_url", e.target.value)
                          }
                          className="border p-2"
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="font-semibold" htmlFor={`alt_text_${index}`}>
                          Alt Text
                        </label>
                        <input
                          id={`alt_text_${index}`}
                          name="alt_text"
                          type="text"
                          value={img.alt_text}
                          onChange={(e) =>
                            handleImageChange(index, "alt_text", e.target.value)
                          }
                          className="border p-2"
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="font-semibold" htmlFor={`display_order_${index}`}>
                          Display Order
                        </label>
                        <input
                          id={`display_order_${index}`}
                          name="display_order"
                          type="number"
                          value={img.display_order}
                          onChange={(e) =>
                            handleImageChange(index, "display_order", Number(e.target.value))
                          }
                          className="border p-2"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="text-red-500 mt-2"
                      >
                        Remove Image
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddImage}
                    className="text-blue-500"
                  >
                    Add Image
                  </button>
                </div>
                <div className="flex space-x-4">
                  <button type="submit" className="bg-blue-500 text-white px-4 py-2">
                    Update Listing
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="bg-red-500 text-white px-4 py-2"
                  >
                    Delete Listing
                  </button>
                </div>
              </form>
            </div>
          )}
        </>
      )}
    </>
  );
};

export default UV_EditListing;