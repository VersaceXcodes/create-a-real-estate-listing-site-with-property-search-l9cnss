import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useMutation } from "@tanstack/react-query";
import { useAppStore } from "@/store/main";

interface IFormData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone: string;
  company_name: string;
}

interface IFormErrors {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone: string;
  company_name: string;
}

interface RegisterResponse {
  token: string;
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    phone: string;
    role: string;
    company_name?: string;
  };
}

const UV_Registration_Agent: React.FC = () => {
  const navigate = useNavigate();
  const setAuthState = useAppStore((state) => state.set_auth_state);
  const addNotification = useAppStore((state) => state.add_notification);

  const [formData, setFormData] = useState<IFormData>({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    phone: "",
    company_name: "",
  });

  const [formErrors, setFormErrors] = useState<IFormErrors>({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    phone: "",
    company_name: "",
  });

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Mutation for agent registration
  const registerMutation = useMutation({
    mutationFn: async (data: IFormData & { role: string }): Promise<RegisterResponse> => {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
      const response = await axios.post(`${baseUrl}/api/auth/register`, data);
      return response.data;
    },
    onSuccess: (data: RegisterResponse) => {
      // On successful registration, update the global auth_state and redirect to agent dashboard.
      setAuthState({
        user_id: data.user.id,
        token: data.token,
        role: data.user.role,
      });
      addNotification({ type: "success", message: "Registration successful!" });
      navigate("/dashboard/agent");
    },
    onError: (error: any) => {
      // Update global notification state with the error message.
      if (error.response?.data?.errors) {
        setFormErrors(error.response.data.errors);
      } else {
        addNotification({
          type: "error",
          message: error.response?.data?.error || "Registration failed. Please try again.",
        });
      }
      setIsSubmitting(false);
    },
  });

  // Handle input changes and clear respective error message.
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setFormErrors({ ...formErrors, [e.target.name]: "" });
  };

  // Client-side validation and form submission handler.
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: IFormErrors = {
      first_name: "",
      last_name: "",
      email: "",
      password: "",
      phone: "",
      company_name: "",
    };

    if (!formData.first_name.trim()) {
      errors.first_name = "First name is required";
    }
    if (!formData.last_name.trim()) {
      errors.last_name = "Last name is required";
    }
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    }
    if (!formData.password.trim()) {
      errors.password = "Password is required";
    }
    if (!formData.phone.trim()) {
      errors.phone = "Phone number is required";
    }
    if (!formData.company_name.trim()) {
      errors.company_name = "Company name is required";
    }

    setFormErrors(errors);
    if (Object.values(errors).some((msg) => msg !== "")) {
      return;
    }
    setIsSubmitting(true);
    // Submit the registration with role "agent"
    registerMutation.mutate({ ...formData, role: "agent" });
  };

  return (
    <>
      <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow-md rounded">
        <h1 className="text-2xl font-bold mb-6 text-center">Agent Registration</h1>
        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-4">
            <label htmlFor="first_name" className="block text-gray-700">First Name</label>
            <input
              id="first_name"
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded"
            />
            {formErrors.first_name && (
              <p className="text-red-500 text-sm">{formErrors.first_name}</p>
            )}
          </div>
          <div className="mb-4">
            <label htmlFor="last_name" className="block text-gray-700">Last Name</label>
            <input
              id="last_name"
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded"
            />
            {formErrors.last_name && (
              <p className="text-red-500 text-sm">{formErrors.last_name}</p>
            )}
          </div>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700">Email</label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded"
            />
            {formErrors.email && (
              <p className="text-red-500 text-sm">{formErrors.email}</p>
            )}
          </div>
          <div className="mb-4">
            <label htmlFor="password" className="block text-gray-700">Password</label>
            <input
              id="password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded"
            />
            {formErrors.password && (
              <p className="text-red-500 text-sm">{formErrors.password}</p>
            )}
          </div>
          <div className="mb-4">
            <label htmlFor="phone" className="block text-gray-700">Phone</label>
            <input
              id="phone"
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded"
            />
            {formErrors.phone && (
              <p className="text-red-500 text-sm">{formErrors.phone}</p>
            )}
          </div>
          <div className="mb-4">
            <label htmlFor="company_name" className="block text-gray-700">Company Name</label>
            <input
              id="company_name"
              type="text"
              name="company_name"
              value={formData.company_name}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded"
            />
            {formErrors.company_name && (
              <p className="text-red-500 text-sm">{formErrors.company_name}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
          >
            {isSubmitting ? "Registering..." : "Register"}
          </button>
        </form>
        <p className="mt-4 text-center">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-500 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </>
  );
};

export default UV_Registration_Agent;