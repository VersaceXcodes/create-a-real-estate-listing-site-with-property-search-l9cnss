import React from 'react';
import { useHistory } from 'react-router-dom';

const UV_Homepage: React.FC = () => {
  const history = useHistory();

  const navigateToRegistration = () => {
    history.push('/register');
  };

  const navigateToLogin = () => {
    history.push('/login');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Welcome to Project Nimbus</h1>
        <p className="text-lg text-gray-700">
          Seamlessly manage your tasks and access real-time analytics at your fingertips.
        </p>
        <p className="text-lg text-gray-700">
          Join us and explore the features that make task management efficient and enjoyable.
        </p>
      </div>
      <div className="flex space-x-4">
        <button onClick={navigateToRegistration} className="px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600">
          Sign Up
        </button>
        <button onClick={navigateToLogin} className="px-6 py-3 bg-gray-500 text-white rounded-md hover:bg-gray-600">
          Login
        </button>
      </div>
    </div>
  );
};

export default UV_Homepage;