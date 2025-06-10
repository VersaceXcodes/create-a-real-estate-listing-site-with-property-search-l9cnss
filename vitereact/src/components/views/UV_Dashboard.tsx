import React, { useEffect } from 'react';
import { useAppStore } from '@/store/main';
import { Link } from 'react-router-dom';

const UV_Dashboard: React.FC = () => {
  const { auth_user, set_realtime_data } = useAppStore();
  const { widgets } = useAppStore(state => state.realtime_data);

  useEffect(() => {
    const socket = io('http://localhost:3000');
    socket.on('connect', () => {
      console.log('WebSocket Connected');
    });
    socket.on('real-time-update', (data) => {
      set_realtime_data(data);
    });
    return () => {
      socket.disconnect();
    };
  }, [set_realtime_data]);

  const renderRealtimeMetrics = () => {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {widgets.map(widget => (
          <div key={widget.metric_type} className="bg-white rounded shadow p-4 flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold">{widget.metric_type.replace(/_/g, ' ')}</h3>
              <p className="text-3xl">{widget.value}</p>
              <span className="text-gray-500 text-sm">{new Date(widget.timestamp).toLocaleString()}</span>
            </div>
            <div>
              <span className="text-green-500">↑</span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <div className="p-6 bg-gray-100 min-h-screen">
        <header className="mb-6">
          <h1 className="text-3xl font-bold">Welcome, {auth_user.email}</h1>
          <p>Your personalized dashboard</p>
        </header>
        {renderRealtimeMetrics()}
        <div className="mt-6 flex gap-4">
          <Link to="/tasks" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Manage Tasks</Link>
          <Link to="/profile" className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">Edit Profile</Link>
        </div>
      </div>
    </>
  );
};

export default UV_Dashboard;