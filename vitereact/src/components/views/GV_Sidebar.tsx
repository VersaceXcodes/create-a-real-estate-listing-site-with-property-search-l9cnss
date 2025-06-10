import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAppStore } from '@/store/main';

const GV_Sidebar: React.FC = () => {
  const { auth_user, set_sidebar_collapsed, sidebar_collapsed } = useAppStore();
  const params = useParams();
  const navigate = useNavigate();
  const [activeLink, setActiveLink] = useState<string>(params.activeSection || 'dashboard');

  useEffect(() => {
    if (params.activeSection) {
      setActiveLink(params.activeSection);
    }
  }, [params.activeSection]);

  const toggleSidebar = () => {
    set_sidebar_collapsed(!sidebar_collapsed);
  };

  const navigateToSection = (section: string) => {
    setActiveLink(section);
    switch (section) {
      case "dashboard":
        navigate("/dashboard");
        break;
      case "profile":
        navigate("/profile");
        break;
      case "tasks":
        navigate("/tasks");
        break;
      case "logout":
        navigate("/logout");
        break;
      default:
        break;
    }
  };

  return (
    <>
      <div className={`bg-gray-800 text-white ${sidebar_collapsed ? "w-16" : "w-64"} transition-width duration-300 ease-in-out h-screen flex flex-col`}>
        <button onClick={toggleSidebar} className="p-4">
          {sidebar_collapsed ? ">" : "<"}
        </button>
        <div className="flex-grow">
          {sidebar_collapsed ? (
            <div className="flex flex-col items-center">
              <button onClick={() => navigateToSection('dashboard')} className={`p-2 ${activeLink === 'dashboard' && 'bg-gray-700'}`}>D</button>
              <button onClick={() => navigateToSection('profile')} className={`p-2 ${activeLink === 'profile' && 'bg-gray-700'}`}>P</button>
              <button onClick={() => navigateToSection('tasks')} className={`p-2 ${activeLink === 'tasks' && 'bg-gray-700'}`}>T</button>
              <button onClick={() => navigateToSection('logout')} className={`p-2 ${activeLink === 'logout' && 'bg-gray-700'}`}>L</button>
            </div>
          ) : (
            <div className="flex flex-col">
              <div className="flex justify-center p-4">
                Welcome, {auth_user.email}
              </div>
              <button onClick={() => navigateToSection('dashboard')} className={`p-4 ${activeLink === 'dashboard' && 'bg-gray-700'}`}>
                Dashboard
              </button>
              <button onClick={() => navigateToSection('profile')} className={`p-4 ${activeLink === 'profile' && 'bg-gray-700'}`}>
                Profile
              </button>
              <button onClick={() => navigateToSection('tasks')} className={`p-4 ${activeLink === 'tasks' && 'bg-gray-700'}`}>
                Tasks
              </button>
              <button onClick={() => navigateToSection('logout')} className={`p-4 ${activeLink === 'logout' && 'bg-gray-700'}`}>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default GV_Sidebar;