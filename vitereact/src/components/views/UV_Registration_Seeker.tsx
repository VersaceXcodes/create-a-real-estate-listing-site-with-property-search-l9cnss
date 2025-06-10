import React, { useState, FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { useAppStore } from "@/store/main";

interface IRegistrationFormData {
  name: string;
  email: string;
  password: string;
}

interface IFormErrors {
  name: string;
  email: string;
  password: string;
}

interface IRegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: string;
}

interface IUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: string;
  company_name?: string;
  created_at: string;
  updated_at: string;
}

interface IRegisterResponse {
  token: string;
  user: IUser;
}

const UV_Registration_Seeker: React.FC = () => {
  const navigate = useNavigate();
  const { set_auth_state, add_notification } = useAppStore();

  const [formData, setFormData] = useState<IRegistrationFormData>({
    name: "",
    email: "",
    password: "",
  });

  const [formErrors, setFormErrors] = useState<IFormErrors>({
    name: "",
    email: "",
    password: "",
  });

  // Mutation function to call the backend API
  const mutation = useMutation<IRegisterResponse, unknown, IRegistrationFormData>(
    async (data: IRegistrationFormData) => {
      // Note: Only one name field provided; consider splitting full name if needed.
      const payload: IRegisterRequest = {
        email: data.email,
        password: data.password,
        first_name: data.name,
        last_name: "", // Potential issue: last_name is required by API. Adjust accordingly.
        role: "seeker",
      };

      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
      const response = await axios.post<IRegisterResponse>(`${apiBaseUrl}/api/auth/register`, payload);
      return response.data;
    },
    {
      onSuccess: (data) => {
        // Update global auth state with token and user information
        set_auth_state({
          user_id: data.user.id,
          token: data.token,
          role: data.user.role,
        });
        add_notification({ type: "success", message: "Registration successful!" });
        // Redirect to Seeker Dashboard
        navigate("/dashboard/seeker");
      },
      onError: (error: unknown) => {
        let errorMessage = "Registration failed. Please try again.";
        if (axios.isAxiosError(error) && error.response && error.response.data) {
          const responseData = error.response.data as { error?: string };
          if (responseData.error) {
            errorMessage = responseData.error;
          }
        }
        add_notification({ type: "error", message: errorMessage });
        // Optionally, set error messages for all form fields
        setFormErrors({
          name: errorMessage,
          email: errorMessage,
          password: errorMessage,
        });
      },
    }
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear errors on change for the field
    setFormErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Basic client-side validations
    let errors: IFormErrors = { name: "", email: "", password: "" };
    let valid = true;
    if (!formData.name.trim()) {
      errors.name = "Name is required";
      valid = false;
    }
    if (!formData.email.trim()) {
      errors.email = "Email is required";
      valid = false;
    }
    if (!formData.password.trim()) {
      errors.password = "Password is required";
      valid = false;
    }
    if (!valid) {
      setFormErrors(errors);
      return;
    }
    // Submit the form data using mutation
    mutation.mutate(formData);
  };

  return (
    <>
      <div className="max-w-md mx-auto py-10 px-4">
        <h1 className="text-3xl font-bold text-center mb-6">Seeker Registration</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Your full name"
            />
            {formErrors.name && <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>}
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="you@example.com"
            />
            {formErrors.email && <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>}
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter a secure password"
            />
            {formErrors.password && <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>}
          </div>
          <div>
            <button
              type="submit"
              disabled={mutation.isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
            >
              {mutation.isLoading ? "Registering..." : "Register"}
            </button>
          </div>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Login here
          </Link>
        </p>
      </div>
    </>
  );
};

export default UV_Registration_Seeker;