import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { Link, useNavigate } from "react-router-dom";
import { useAppStore } from "@/store/main";

// Define interface for login request payload
interface ILoginRequest {
  email: string;
  password: string;
}

// Define interface for login response payload
interface IUser {
  id: string;
  role: string;
  // Additional user fields can be included if needed
}

interface ILoginResponse {
  token: string;
  user: IUser;
}

const UV_Login: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [form_errors, setFormErrors] = useState<{ email?: string; password?: string }>({});
  const [loading_state, setLoadingState] = useState<boolean>(false);

  const navigate = useNavigate();
  const set_auth_state = useAppStore(state => state.set_auth_state);
  const add_notification = useAppStore(state => state.add_notification);

  const loginMutation = useMutation<ILoginResponse, unknown, ILoginRequest>(
    async (loginData: ILoginRequest) => {
      const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
      const response = await axios.post(`${baseURL}/api/auth/login`, loginData);
      return response.data;
    },
    {
      onSuccess: (data: ILoginResponse) => {
        // Update global auth_state upon successful login
        set_auth_state({
          user_id: data.user.id,
          token: data.token,
          role: data.user.role
        });
        // Redirect user based on role
        if (data.user.role === "seeker") {
          navigate("/dashboard/seeker");
        } else if (data.user.role === "agent") {
          navigate("/dashboard/agent");
        } else if (data.user.role === "admin") {
          navigate("/dashboard/admin");
        } else {
          navigate("/");
        }
      },
      onError: (error: unknown) => {
        if (axios.isAxiosError(error) && error.response && error.response.data && (error.response.data as any).error) {
          add_notification({ type: 'error', message: (error.response.data as any).error });
        } else {
          add_notification({ type: 'error', message: 'Login failed. Please check your credentials.' });
        }
      },
      onSettled: () => {
        setLoadingState(false);
      }
    }
  );

  const submitLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormErrors({});
    let errors: { email?: string; password?: string } = {};

    if (!email) {
      errors.email = "Email is required.";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = "Invalid email address.";
    }
    if (!password) {
      errors.password = "Password is required.";
    }
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setLoadingState(true);
    loginMutation.mutate({ email, password });
  };

  return (
    <>
      <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow-md rounded-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>
        <form onSubmit={submitLogin} noValidate>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:border-blue-300"
              aria-invalid={!!form_errors.email}
            />
            {form_errors.email && <p className="text-red-500 text-sm mt-1">{form_errors.email}</p>}
          </div>
          <div className="mb-4">
            <label htmlFor="password" className="block text-gray-700">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:border-blue-300"
              aria-invalid={!!form_errors.password}
            />
            {form_errors.password && <p className="text-red-500 text-sm mt-1">{form_errors.password}</p>}
          </div>
          <button
            type="submit"
            disabled={loading_state}
            className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {loading_state ? "Logging in..." : "Login"}
          </button>
        </form>
        <div className="mt-4 flex justify-between">
          <Link to="/password-recovery" className="text-blue-500 hover:underline text-sm">
            Forgot Password?
          </Link>
        </div>
        <div className="mt-6 flex justify-center space-x-4">
          <Link to="/register/seeker" className="text-blue-500 hover:underline text-sm">
            Register as Seeker
          </Link>
          <Link to="/register/agent" className="text-blue-500 hover:underline text-sm">
            Register as Agent
          </Link>
        </div>
      </div>
    </>
  );
};

export default UV_Login;