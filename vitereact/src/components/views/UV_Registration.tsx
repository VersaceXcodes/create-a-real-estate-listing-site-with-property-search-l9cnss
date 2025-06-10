import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useAppStore } from "@/store/main";
import { Link } from "react-router-dom";

// Interfaces
interface FormInputs {
  email: string;
  password: string;
  confirmPassword: string;
  profilePicture: string;
  firstName?: string;
  lastName?: string;
}

interface UserRegistrationRequest {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

interface UserRegistrationResponse {
  user_id: string;
  message: string;
}

// Component
const UV_Registration: React.FC = () => {
  const [formInputs, setFormInputs] = useState<FormInputs>({
    email: "",
    password: "",
    confirmPassword: "",
    profilePicture: "",
  });

  const setNotification = useAppStore((state) => state.set_notification);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setFormInputs({ ...formInputs, [e.target.name]: e.target.value });
  };

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = () => {
        setFormInputs({ ...formInputs, profilePicture: reader.result as string });
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  // Mutation for user registration
  const mutation = useMutation<UserRegistrationResponse, Error, UserRegistrationRequest>({
    mutationFn: (newUser) =>
      axios.post<{ user_id: string; message: string }>(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/users/register`, newUser)
        .then((response) => response.data),
    onSuccess: (data) => {
      setNotification({ type: "success", message: data.message });
      // For email verification, assume backend initiated
    },
    onError: (error) => {
      setNotification({ type: "error", message: error.message });
    },
  });

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formInputs.password !== formInputs.confirmPassword) {
      setNotification({ type: "error", message: "Passwords do not match" });
      return;
    }
    mutation.mutate({ email: formInputs.email, password: formInputs.password, first_name: formInputs.firstName || "", last_name: formInputs.lastName || "" });
  };

  return (
    <>
      <div className="flex justify-center mt-10">
        <form className="w-full max-w-md p-8 space-y-6 bg-white shadow-md rounded" onSubmit={handleFormSubmit}>
          <h2 className="text-2xl font-bold text-center">Register</h2>
          <input 
            type="email"
            name="email"
            placeholder="Email"
            value={formInputs.email}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded"
            required
          />
          <input 
            type="password"
            name="password"
            placeholder="Password"
            value={formInputs.password}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded"
            required
          />
          <input 
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formInputs.confirmPassword}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded"
            required
          />
          <input 
            type="file"
            name="profilePicture"
            onChange={handleProfilePictureChange}
            className="w-full p-2"
          />
          <button 
            type="submit"
            className="w-full p-2 mt-4 font-bold text-white bg-blue-500 rounded hover:bg-blue-600"
          >
            Sign Up
          </button>
          <p className="mt-4 text-center">
            Already have an account? <Link to="/login" className="text-blue-500 hover:underline">Login here</Link>
          </p>
        </form>
      </div>
    </>
  );
};

export default UV_Registration;