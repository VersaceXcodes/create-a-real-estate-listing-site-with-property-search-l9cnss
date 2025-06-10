import React from 'react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/main';

interface LogoutResponse {
  message: string;
}

const UV_Logout: React.FC = () => {
  const setAuthUser = useAppStore((state) => state.set_auth_user);
  const navigate = useNavigate();

  const logoutMutation = useMutation<LogoutResponse, Error>({
    mutationFn: async () => {
      const { data } = await axios.post<LogoutResponse>(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/users/logout`
      );
      return data;
    },
    onSuccess: () => {
      setAuthUser({ user_id: '', email: '', is_authenticated: false });
      navigate('/');
    },
    onError: (error) => {
      console.error('Error during logout:', error.message);
      alert('Failed to log out. Please try again.');
    }
  });

  React.useEffect(() => {
    logoutMutation.mutate();
  }, [logoutMutation]);

  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="bg-white shadow-md rounded px-8 py-4">
          <h1 className="text-2xl font-bold text-center mb-4">Logout Successful</h1>
          <p className="text-center text-gray-700 mb-6">You have been successfully logged out.</p>
          <div className="flex justify-center space-x-4">
            <Link to="/" className="text-blue-500 hover:text-blue-700">
              Go to Homepage
            </Link>
            <Link to="/login" className="text-blue-500 hover:text-blue-700">
              Login Again
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default UV_Logout;