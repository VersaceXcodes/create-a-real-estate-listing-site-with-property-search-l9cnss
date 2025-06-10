import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { useAppStore } from "@/store/main";

interface IPasswordResetRequest {
  email: string;
}

interface IPasswordResetResponse {
  message: string;
}

const UV_PasswordRecovery: React.FC = () => {
  const { add_notification } = useAppStore((state) => ({
    add_notification: state.add_notification,
  }));

  const [formData, setFormData] = useState<{ email: string }>({ email: "" });
  const [formErrors, setFormErrors] = useState<{ email: string }>({ email: "" });
  const [submissionResult, setSubmissionResult] = useState<{ message: string; success: boolean }>({
    message: "",
    success: false,
  });

  const passwordResetMutation = useMutation<IPasswordResetResponse, AxiosError, IPasswordResetRequest>({
    mutationFn: async (payload: IPasswordResetRequest) => {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
      const response = await axios.post(`${baseUrl}/api/auth/password_resets`, payload);
      return response.data;
    },
    onSuccess: (data) => {
      setSubmissionResult({ message: data.message, success: true });
      add_notification({ type: "success", message: data.message });
    },
    onError: (error: AxiosError) => {
      const errMsg = error.response?.data?.error || "An error occurred during password recovery.";
      setSubmissionResult({ message: errMsg, success: false });
      add_notification({ type: "error", message: errMsg });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionResult({ message: "", success: false });

    // Basic email validation
    let valid = true;
    const errors = { email: "" };
    if (!formData.email) {
      errors.email = "Email is required.";
      valid = false;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        errors.email = "Please enter a valid email address.";
        valid = false;
      }
    }
    setFormErrors(errors);
    if (!valid) return;

    passwordResetMutation.mutate({ email: formData.email });
  };

  return (
    <>
      <div className="max-w-md mx-auto p-6">
        <h2 className="text-2xl font-semibold mb-4">Password Recovery</h2>
        <p className="mb-6 text-gray-600">
          Please enter your registered email address to receive password reset instructions.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ email: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
              placeholder="you@example.com"
            />
            {formErrors.email && <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>}
          </div>
          <button
            type="submit"
            disabled={passwordResetMutation.isLoading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded disabled:opacity-50"
          >
            {passwordResetMutation.isLoading ? "Submitting..." : "Submit"}
          </button>
        </form>
        {submissionResult.message && (
          <div
            className={`mt-4 p-3 rounded ${
              submissionResult.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
            }`}
          >
            {submissionResult.message}
          </div>
        )}
        <div className="mt-6 text-center">
          <Link to="/login" className="text-blue-500 hover:underline">
            Back to Login
          </Link>
        </div>
      </div>
    </>
  );
};

export default UV_PasswordRecovery;