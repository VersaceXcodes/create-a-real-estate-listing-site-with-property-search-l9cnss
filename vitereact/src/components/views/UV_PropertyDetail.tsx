import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "@/store/main";

// Define TypeScript interfaces for the property detail and inquiry form

interface IPropertyImage {
  image_url: string;
  alt_text: string;
}

interface IPropertyAgent {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
}

interface IPropertyListingDetail {
  id: string;
  title: string;
  description: string;
  price: number;
  city: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  amenities: string[];
  images: IPropertyImage[];
  agent: IPropertyAgent;
  latitude: number;
  longitude: number;
}

interface IInquiryForm {
  sender_name: string;
  sender_email: string;
  sender_phone: string;
  message: string;
  form_errors?: {
    sender_name?: string;
    sender_email?: string;
    message?: string;
  };
}

const UV_PropertyDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  // Global store access: auth_state and notification_state actions
  const auth_state = useAppStore((state) => state.auth_state);
  const add_notification = useAppStore((state) => state.add_notification);

  // Local state for the inquiry form
  const [inquiryForm, setInquiryForm] = useState<IInquiryForm>({
    sender_name: "",
    sender_email: "",
    sender_phone: "",
    message: "",
    form_errors: {},
  });

  // Optionally pre-fill inquiry form fields if user is authenticated (if more user info were available)
  useEffect(() => {
    // Here, if additional fields (like name or email) become available from auth_state, prefill them.
    // For now, as auth_state only has user_id, token, and role, we leave the fields empty.
  }, [auth_state]);

  // Query to fetch property listing details using the listing ID from the URL
  const {
    data: listingDetails,
    isLoading,
    isError,
    error,
  } = useQuery<IPropertyListingDetail, Error>(
    ["propertyDetail", id],
    async () => {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
      const response = await axios.get(`${baseUrl}/api/properties/${id}`);
      return response.data;
    },
    {
      enabled: !!id,
    }
  );

  // Mutation for submitting an inquiry for the property
  const inquiryMutation = useMutation(
    async (inquiry: IInquiryForm) => {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
      const payload = {
        property_listing_id: listingDetails?.id,
        sender_name: inquiry.sender_name,
        sender_email: inquiry.sender_email,
        sender_phone: inquiry.sender_phone,
        message: inquiry.message,
      };
      const response = await axios.post(`${baseUrl}/api/inquiries`, payload);
      return response.data;
    },
    {
      onSuccess: () => {
        add_notification({ type: "success", message: "Inquiry submitted successfully!" });
        // Clear the inquiry form after successful submission
        setInquiryForm({
          sender_name: "",
          sender_email: "",
          sender_phone: "",
          message: "",
          form_errors: {},
        });
      },
      onError: (err: any) => {
        add_notification({ type: "error", message: err.message || "Failed to submit inquiry" });
      },
    }
  );

  // Handler for input changes in the inquiry form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setInquiryForm((prev) => ({
      ...prev,
      [name]: value,
      form_errors: { ...prev.form_errors, [name]: "" },
    }));
  };

  // Handler for inquiry form submission with inline validations
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    let errors: { sender_name?: string; sender_email?: string; message?: string } = {};

    if (!inquiryForm.sender_name) {
      errors.sender_name = "Name is required";
    }
    if (!inquiryForm.sender_email) {
      errors.sender_email = "Email is required";
    }
    if (!inquiryForm.message) {
      errors.message = "Message is required";
    }
    if (Object.keys(errors).length > 0) {
      setInquiryForm((prev) => ({ ...prev, form_errors: errors }));
      return;
    }
    inquiryMutation.mutate(inquiryForm);
  };

  return (
    <>
      {isLoading ? (
        <div className="text-center mt-10">Loading property details...</div>
      ) : isError ? (
        <div className="text-center mt-10 text-red-500">
          Error loading property details: {error?.message}
        </div>
      ) : listingDetails ? (
        <div className="max-w-4xl mx-auto p-4">
          <h1 className="text-3xl font-bold mb-4">{listingDetails.title}</h1>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Image Gallery */}
            <div className="md:w-1/2">
              {listingDetails.images && listingDetails.images.length > 0 ? (
                <div className="flex space-x-2 overflow-x-scroll">
                  {listingDetails.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img.image_url}
                      alt={img.alt_text}
                      className="w-48 h-32 object-cover rounded"
                    />
                  ))}
                </div>
              ) : (
                <div>No images available</div>
              )}
            </div>
            {/* Property Specifications */}
            <div className="md:w-1/2">
              <p className="mb-2">
                <span className="font-semibold">Price:</span> ${listingDetails.price}
              </p>
              <p className="mb-2">
                <span className="font-semibold">City:</span> {listingDetails.city}
              </p>
              <p className="mb-2">
                <span className="font-semibold">Bedrooms:</span> {listingDetails.bedrooms}
              </p>
              <p className="mb-2">
                <span className="font-semibold">Bathrooms:</span> {listingDetails.bathrooms}
              </p>
              <p className="mb-2">
                <span className="font-semibold">Area:</span> {listingDetails.area} sq ft
              </p>
              <p className="mb-2">
                <span className="font-semibold">Amenities:</span>{" "}
                {listingDetails.amenities.join(", ")}
              </p>
            </div>
          </div>
          {/* Property Description */}
          <div className="mt-4">
            <h2 className="text-2xl font-semibold mb-2">Description</h2>
            <p>{listingDetails.description}</p>
          </div>
          {/* Embedded Map */}
          <div className="mt-4">
            <h2 className="text-2xl font-semibold mb-2">Location</h2>
            {(listingDetails.latitude != null && listingDetails.longitude != null) ? (
              <iframe
                width="100%"
                height="300"
                frameBorder="0"
                style={{ border: 0 }}
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://maps.google.com/maps?q=${listingDetails.latitude},${listingDetails.longitude}&z=15&output=embed`}
                allowFullScreen
              ></iframe>
            ) : (
              <p>Map not available</p>
            )}
          </div>
          {/* Agent Contact Information */}
          <div className="mt-4">
            <h2 className="text-2xl font-semibold mb-2">Agent Contact</h2>
            <p>
              <span className="font-semibold">Name:</span> {listingDetails.agent.first_name}{" "}
              {listingDetails.agent.last_name}
            </p>
            <p>
              <span className="font-semibold">Phone:</span> {listingDetails.agent.phone}
            </p>
            {/* Link for users who are not logged in */}
            {(!auth_state || !auth_state.token) && (
              <Link to="/login" className="text-blue-500 hover:underline">
                Login to contact agent directly
              </Link>
            )}
          </div>
          {/* Inquiry Form */}
          <div className="mt-4">
            <h2 className="text-2xl font-semibold mb-2">Send Inquiry</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block mb-1 font-semibold" htmlFor="sender_name">
                  Name
                </label>
                <input
                  type="text"
                  name="sender_name"
                  id="sender_name"
                  value={inquiryForm.sender_name}
                  onChange={handleInputChange}
                  className="w-full border p-2 rounded"
                />
                {inquiryForm.form_errors?.sender_name && (
                  <p className="text-red-500 text-sm">{inquiryForm.form_errors.sender_name}</p>
                )}
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-semibold" htmlFor="sender_email">
                  Email
                </label>
                <input
                  type="email"
                  name="sender_email"
                  id="sender_email"
                  value={inquiryForm.sender_email}
                  onChange={handleInputChange}
                  className="w-full border p-2 rounded"
                />
                {inquiryForm.form_errors?.sender_email && (
                  <p className="text-red-500 text-sm">{inquiryForm.form_errors.sender_email}</p>
                )}
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-semibold" htmlFor="sender_phone">
                  Phone
                </label>
                <input
                  type="text"
                  name="sender_phone"
                  id="sender_phone"
                  value={inquiryForm.sender_phone}
                  onChange={handleInputChange}
                  className="w-full border p-2 rounded"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-semibold" htmlFor="message">
                  Message
                </label>
                <textarea
                  name="message"
                  id="message"
                  rows={4}
                  value={inquiryForm.message}
                  onChange={handleInputChange}
                  className="w-full border p-2 rounded"
                ></textarea>
                {inquiryForm.form_errors?.message && (
                  <p className="text-red-500 text-sm">{inquiryForm.form_errors.message}</p>
                )}
              </div>
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                {inquiryMutation.isLoading ? "Submitting..." : "Submit Inquiry"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default UV_PropertyDetail;