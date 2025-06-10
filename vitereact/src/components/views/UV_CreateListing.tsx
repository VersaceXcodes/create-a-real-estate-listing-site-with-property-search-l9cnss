import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { useAppStore } from "@/store/main";

// Define interfaces for form data, image uploads, and publish state
interface ListingForm {
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

interface ImageUpload {
  image_url: string;
  alt_text: string;
  display_order: number;
}

interface PublishState {
  isPublished: boolean;
}

const UV_CreateListing: React.FC = () => {
  // Access global auth state and notification actions from Zustand store
  const { auth_state, add_notification } = useAppStore((state) => ({
    auth_state: state.auth_state,
    add_notification: state.add_notification,
  }));
  const navigate = useNavigate();

  // Ensure only agents can access this view
  if (auth_state.role !== "agent") {
    return (
      <>
        <div className="container mx-auto p-4">
          <p>
            You need to be an agent to create a listing. Please{" "}
            <Link to="/login" className="text-blue-500 underline">
              login
            </Link>{" "}
            as an agent.
          </p>
        </div>
      </>
    );
  }

  // Initial states following the provided datamap
  const defaultListingForm: ListingForm = {
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

  const [listingForm, setListingForm] = useState<ListingForm>(defaultListingForm);
  const [imageUploads, setImageUploads] = useState<ImageUpload[]>([]);
  const [publishState, setPublishState] = useState<PublishState>({ isPublished: false });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validate the form and update errors state
  const validateForm = (): boolean => {
    let newErrors: Record<string, string> = {};
    if (!listingForm.title.trim()) newErrors.title = "Title is required";
    if (!listingForm.description.trim()) newErrors.description = "Description is required";
    if (!listingForm.property_type.trim()) newErrors.property_type = "Property type is required";
    if (listingForm.price <= 0) newErrors.price = "Price must be greater than 0";
    if (!listingForm.address.trim()) newErrors.address = "Address is required";
    if (!listingForm.city.trim()) newErrors.city = "City is required";
    if (!listingForm.zip_code.trim()) newErrors.zip_code = "Zip code is required";
    if (listingForm.bedrooms < 0) newErrors.bedrooms = "Bedrooms cannot be negative";
    if (listingForm.bathrooms < 0) newErrors.bathrooms = "Bathrooms cannot be negative";
    if (listingForm.area <= 0) newErrors.area = "Area must be greater than 0";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle changes for text, textarea, select, and number inputs
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    let newValue: string | number | string[];
    if (["price", "bedrooms", "bathrooms", "area", "latitude", "longitude"].includes(name)) {
      newValue = Number(value);
    } else if (name === "amenities") {
      newValue = value.split(",").map((item) => item.trim()).filter((item) => item !== "");
    } else {
      newValue = value;
    }
    setListingForm((prev) => ({ ...prev, [name]: newValue }));
  };

  // Process image files selected via the file input
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      files.forEach((file) => {
        if (!file.type.startsWith("image/")) {
          add_notification({ type: "error", message: "Only image files are allowed" });
          return;
        }
        if (file.size > 5 * 1024 * 1024) {
          add_notification({ type: "error", message: "Image file size must be less than 5MB" });
          return;
        }
        const imageUrl = URL.createObjectURL(file);
        const newImage: ImageUpload = {
          image_url: imageUrl,
          alt_text: "",
          display_order: imageUploads.length + 1,
        };
        setImageUploads((prev) => [...prev, newImage]);
      });
    }
  };

  // Drag-and-drop handlers for images
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    files.forEach((file) => {
      if (!file.type.startsWith("image/")) {
        add_notification({ type: "error", message: "Only image files are allowed" });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        add_notification({ type: "error", message: "Image file size must be less than 5MB" });
        return;
      }
      const imageUrl = URL.createObjectURL(file);
      const newImage: ImageUpload = {
        image_url: imageUrl,
        alt_text: "",
        display_order: imageUploads.length + 1,
      };
      setImageUploads((prev) => [...prev, newImage]);
    });
  };

  // Update image metadata (alt text or display order)
  const handleImageMetaChange = (
    index: number,
    field: "alt_text" | "display_order",
    value: string
  ) => {
    setImageUploads((prevImages) =>
      prevImages.map((img, i) => {
        if (i === index) {
          if (field === "display_order") {
            return { ...img, display_order: Number(value) };
          } else {
            return { ...img, alt_text: value };
          }
        }
        return img;
      })
    );
  };

  // Mutation to submit the listing using @tanstack/react-query and axios
  const createListingMutation = useMutation(
    (payload: any) => {
      const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
      return axios.post(`${baseURL}/api/properties`, payload, {
        headers: { Authorization: `Bearer ${auth_state.token}` },
      });
    },
    {
      onSuccess: () => {
        add_notification({ type: "success", message: "Listing created successfully" });
        navigate("/dashboard/agent");
      },
      onError: () => {
        add_notification({ type: "error", message: "Failed to create listing" });
      },
    }
  );

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      add_notification({ type: "error", message: "Please fix the errors in the form" });
      return;
    }
    const payload = {
      ...listingForm,
      images: imageUploads,
      status: publishState.isPublished ? "published" : "draft",
    };
    createListingMutation.mutate(payload);
  };

  // Handle publish state change from radio options
  const handlePublishChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPublishState({ isPublished: value === "publish" });
  };

  // Simulate auto-detecting coordinates (dummy values for demo)
  const handleAutoDetectCoordinates = () => {
    setListingForm((prev) => ({ ...prev, latitude: 40.7128, longitude: -74.0060 }));
    add_notification({
      type: "info",
      message: "Coordinates auto-detected: 40.7128, -74.0060",
    });
  };

  return (
    <>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Create New Listing</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-medium">Property Title</label>
            <input
              type="text"
              name="title"
              value={listingForm.title}
              onChange={handleInputChange}
              className="w-full border border-gray-300 p-2 rounded"
            />
            {errors.title && <p className="text-red-500 text-sm">{errors.title}</p>}
          </div>
          <div>
            <label className="block font-medium">Description</label>
            <textarea
              name="description"
              value={listingForm.description}
              onChange={handleInputChange}
              className="w-full border border-gray-300 p-2 rounded"
              rows={4}
            />
            {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
          </div>
          <div>
            <label className="block font-medium">Property Type</label>
            <input
              type="text"
              name="property_type"
              value={listingForm.property_type}
              onChange={handleInputChange}
              placeholder="e.g., Apartment, House, Condo"
              className="w-full border border-gray-300 p-2 rounded"
            />
            {errors.property_type && (
              <p className="text-red-500 text-sm">{errors.property_type}</p>
            )}
          </div>
          <div>
            <label className="block font-medium">Price ($)</label>
            <input
              type="number"
              name="price"
              value={listingForm.price}
              onChange={handleInputChange}
              className="w-full border border-gray-300 p-2 rounded"
            />
            {errors.price && <p className="text-red-500 text-sm">{errors.price}</p>}
          </div>
          <div>
            <label className="block font-medium">Address</label>
            <input
              type="text"
              name="address"
              value={listingForm.address}
              onChange={handleInputChange}
              placeholder="Enter address"
              className="w-full border border-gray-300 p-2 rounded"
            />
            {errors.address && <p className="text-red-500 text-sm">{errors.address}</p>}
          </div>
          <div>
            <label className="block font-medium">City</label>
            <input
              type="text"
              name="city"
              value={listingForm.city}
              onChange={handleInputChange}
              placeholder="Enter city"
              className="w-full border border-gray-300 p-2 rounded"
            />
            {errors.city && <p className="text-red-500 text-sm">{errors.city}</p>}
          </div>
          <div>
            <label className="block font-medium">Zip Code</label>
            <input
              type="text"
              name="zip_code"
              value={listingForm.zip_code}
              onChange={handleInputChange}
              placeholder="Enter zip code"
              className="w-full border border-gray-300 p-2 rounded"
            />
            {errors.zip_code && <p className="text-red-500 text-sm">{errors.zip_code}</p>}
          </div>
          <div>
            <label className="block font-medium">Amenities (comma separated)</label>
            <input
              type="text"
              name="amenities"
              value={listingForm.amenities.join(", ")}
              onChange={handleInputChange}
              placeholder="e.g., Pool, Gym, Garden"
              className="w-full border border-gray-300 p-2 rounded"
            />
          </div>
          <div>
            <label className="block font-medium">Bedrooms</label>
            <input
              type="number"
              name="bedrooms"
              value={listingForm.bedrooms}
              onChange={handleInputChange}
              className="w-full border border-gray-300 p-2 rounded"
            />
            {errors.bedrooms && <p className="text-red-500 text-sm">{errors.bedrooms}</p>}
          </div>
          <div>
            <label className="block font-medium">Bathrooms</label>
            <input
              type="number"
              name="bathrooms"
              value={listingForm.bathrooms}
              onChange={handleInputChange}
              className="w-full border border-gray-300 p-2 rounded"
            />
            {errors.bathrooms && <p className="text-red-500 text-sm">{errors.bathrooms}</p>}
          </div>
          <div>
            <label className="block font-medium">Area (sq ft)</label>
            <input
              type="number"
              name="area"
              value={listingForm.area}
              onChange={handleInputChange}
              className="w-full border border-gray-300 p-2 rounded"
            />
            {errors.area && <p className="text-red-500 text-sm">{errors.area}</p>}
          </div>
          <div className="flex space-x-4">
            <div className="w-1/2">
              <label className="block font-medium">Latitude</label>
              <input
                type="number"
                name="latitude"
                value={listingForm.latitude}
                onChange={handleInputChange}
                className="w-full border border-gray-300 p-2 rounded"
              />
            </div>
            <div className="w-1/2">
              <label className="block font-medium">Longitude</label>
              <input
                type="number"
                name="longitude"
                value={listingForm.longitude}
                onChange={handleInputChange}
                className="w-full border border-gray-300 p-2 rounded"
              />
            </div>
          </div>
          <div>
            <button
              type="button"
              onClick={handleAutoDetectCoordinates}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Auto-Detect Coordinates
            </button>
          </div>
          <div>
            <label className="block font-medium">Images</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageFileChange}
              className="w-full"
            />
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="border border-dashed border-gray-400 p-4 mt-2"
            >
              <p className="text-center text-gray-500">Drag and drop images here</p>
            </div>
            {imageUploads.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-4">
                {imageUploads.map((img, index) => (
                  <div key={index} className="border p-2">
                    <img
                      src={img.image_url}
                      alt={img.alt_text || "Uploaded Image"}
                      className="w-full h-32 object-cover mb-2"
                    />
                    <div>
                      <label className="text-sm">Alt Text:</label>
                      <input
                        type="text"
                        value={img.alt_text}
                        onChange={(e) => handleImageMetaChange(index, "alt_text", e.target.value)}
                        className="w-full border border-gray-300 p-1 rounded"
                      />
                    </div>
                    <div>
                      <label className="text-sm">Display Order:</label>
                      <input
                        type="number"
                        value={img.display_order}
                        onChange={(e) => handleImageMetaChange(index, "display_order", e.target.value)}
                        className="w-full border border-gray-300 p-1 rounded"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="block font-medium">Listing Status</label>
            <div className="flex items-center space-x-4">
              <label>
                <input
                  type="radio"
                  name="publish"
                  value="publish"
                  checked={publishState.isPublished}
                  onChange={handlePublishChange}
                />
                <span className="ml-1">Publish</span>
              </label>
              <label>
                <input
                  type="radio"
                  name="publish"
                  value="draft"
                  checked={!publishState.isPublished}
                  onChange={handlePublishChange}
                />
                <span className="ml-1">Save as Draft</span>
              </label>
            </div>
          </div>
          <div>
            <button
              type="submit"
              className="bg-green-500 text-white px-4 py-2 rounded"
            >
              Submit Listing
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default UV_CreateListing;