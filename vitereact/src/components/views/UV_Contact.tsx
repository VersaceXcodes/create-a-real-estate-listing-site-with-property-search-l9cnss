import React, { useState, ChangeEvent, FormEvent } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useAppStore } from "@/store/main";

interface IContactForm {
  name: string;
  email: string;
  phone: string;
  message: string;
}

interface IFormErrors {
  name: string;
  email: string;
  phone: string;
  message: string;
}

interface IContactResponse {
  message: string;
}

const UV_Contact: React.FC = () => {
  const add_notification = useAppStore((state) => state.add_notification);

  const initialForm: IContactForm = {
    name: "",
    email: "",
    phone: "",
    message: "",
  };

  const initialErrors: IFormErrors = {
    name: "",
    email: "",
    phone: "",
    message: "",
  };

  const [contact_form, setContactForm] = useState<IContactForm>(initialForm);
  const [form_errors, setFormErrors] = useState<IFormErrors>(initialErrors);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validateContactForm = () => {
    let errors: IFormErrors = { ...initialErrors };
    let isValid = true;
    if (!contact_form.name.trim()) {
      errors.name = "Name is required.";
      isValid = false;
    }
    if (!contact_form.email.trim()) {
      errors.email = "Email is required.";
      isValid = false;
    } else if (!emailRegex.test(contact_form.email)) {
      errors.email = "Invalid email format.";
      isValid = false;
    }
    if (!contact_form.phone.trim()) {
      errors.phone = "Phone number is required.";
      isValid = false;
    }
    if (!contact_form.message.trim()) {
      errors.message = "Message is required.";
      isValid = false;
    }
    setFormErrors(errors);
    return isValid;
  };

  const mutation = useMutation<IContactResponse, any, IContactForm>(
    (data: IContactForm) => {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
      return axios.post(`${baseUrl}/api/contact`, data).then((res) => res.data);
    },
    {
      onSuccess: (data) => {
        add_notification({
          type: "success",
          message: data.message || "Your message has been sent. We will get back to you soon.",
        });
        setContactForm(initialForm);
        setFormErrors(initialErrors);
      },
      onError: (error: any) => {
        const message =
          error?.response?.data?.error || "Failed to send your message. Please try again later.";
        add_notification({ type: "error", message });
      },
    }
  );

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setContactForm((prev) => ({ ...prev, [name]: value }));
    if (value.trim()) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (validateContactForm()) {
      mutation.mutate(contact_form);
    }
  };

  return (
    <>
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-4">Contact Us</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Contact Details Section */}
          <div className="space-y-4">
            <p>
              If you have any questions or need more information about EstateFinder, please feel free
              to contact us using the details below or by filling out the contact form.
            </p>
            <div>
              <h2 className="text-xl font-semibold">Direct Contact Details</h2>
              <ul className="mt-2 space-y-2">
                <li>
                  <span className="font-medium">Email:</span>{" "}
                  <a
                    href="mailto:support@estatefinder.com"
                    className="text-blue-600 hover:underline"
                  >
                    support@estatefinder.com
                  </a>
                </li>
                <li>
                  <span className="font-medium">Phone:</span>{" "}
                  <a href="tel:+11234567890" className="text-blue-600 hover:underline">
                    +1 (123) 456-7890
                  </a>
                </li>
                <li>
                  <span className="font-medium">Address:</span> 123 Main Street, City, Country
                </li>
              </ul>
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">Our Office Location</h2>
              <div className="w-full h-64">
                <iframe
                  title="Office Location"
                  className="w-full h-full border-0"
                  src="https://maps.google.com/maps?q=123+Main+Street,+City,+Country&output=embed"
                ></iframe>
              </div>
            </div>
          </div>
          {/* Contact Form Section */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Send Us a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={contact_form.name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {form_errors.name && (
                  <p className="text-red-500 text-sm mt-1">{form_errors.name}</p>
                )}
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={contact_form.email}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {form_errors.email && (
                  <p className="text-red-500 text-sm mt-1">{form_errors.email}</p>
                )}
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium">
                  Phone
                </label>
                <input
                  type="text"
                  id="phone"
                  name="phone"
                  value={contact_form.phone}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {form_errors.phone && (
                  <p className="text-red-500 text-sm mt-1">{form_errors.phone}</p>
                )}
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={contact_form.message}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={5}
                ></textarea>
                {form_errors.message && (
                  <p className="text-red-500 text-sm mt-1">{form_errors.message}</p>
                )}
              </div>
              <div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white font-medium py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                  disabled={mutation.isLoading}
                >
                  {mutation.isLoading ? "Sending..." : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
        <div className="mt-8">
          <p className="text-sm text-gray-600">
            Return to{" "}
            <Link to="/" className="text-blue-600 hover:underline">
              Home
            </Link>
            .
          </p>
        </div>
      </div>
    </>
  );
};

export default UV_Contact;