import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppStore } from "@/store/main";

const GV_TopNav: React.FC = () => {
  // Get global state from Zustand store:
  const auth_state = useAppStore((state) => state.auth_state);
  const global_layout_state = useAppStore((state) => state.global_layout_state);
  const clear_auth_state = useAppStore((state) => state.clear_auth_state);

  // Local state for search input and hamburger menu expansion:
  const [searchInput, setSearchInput] = useState<string>("");
  const [menuExpanded, setMenuExpanded] = useState<boolean>(false);

  // Hook to perform route changes:
  const navigate = useNavigate();

  // Action: handleSearchSubmit - triggered when quick search is submitted
  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    navigate(`/properties?keywords=${encodeURIComponent(searchInput)}`);
  };

  // Action: toggleHamburgerMenu - toggles the mobile hamburger menu state
  const toggleHamburgerMenu = () => {
    setMenuExpanded((prev) => !prev);
  };

  // Action: logout - clears auth state and redirects to home
  const handleLogout = () => {
    clear_auth_state();
    navigate("/");
  };

  // Determine account actions based on authentication state:
  let accountButtons = null;
  if (!auth_state.token) {
    // User is not authenticated: show Login and Register buttons
    accountButtons = (
      <div className="flex space-x-2">
        <Link to="/login" className="px-3 py-1 border rounded hover:bg-gray-200">
          Login
        </Link>
        <Link to="/register/seeker" className="px-3 py-1 border rounded hover:bg-gray-200">
          Register
        </Link>
      </div>
    );
  } else {
    // User is authenticated: determine dashboard path based on user role
    let dashboardPath = "/dashboard/seeker";
    if (auth_state.role === "agent") {
      dashboardPath = "/dashboard/agent";
    } else if (auth_state.role === "admin") {
      dashboardPath = "/dashboard/admin";
    }
    accountButtons = (
      <div className="flex space-x-2">
        <Link
          to={dashboardPath}
          className="px-3 py-1 border rounded hover:bg-gray-200"
        >
          Dashboard
        </Link>
        <button
          onClick={handleLogout}
          className="px-3 py-1 border rounded hover:bg-gray-200"
        >
          Logout
        </button>
      </div>
    );
  }

  // Decide layout based on device type from global layout state:
  const isMobile = global_layout_state.device_type === "mobile";

  // Primary navigation links:
  const navLinks = (
    <div className="flex space-x-4">
      <Link to="/" className="hover:text-blue-500">
        Home
      </Link>
      <Link to="/advanced-search" className="hover:text-blue-500">
        Advanced Search
      </Link>
      <Link to="/about" className="hover:text-blue-500">
        About
      </Link>
      <Link to="/contact" className="hover:text-blue-500">
        Contact
      </Link>
    </div>
  );

  return (
    <>
      <nav className="fixed w-full bg-white shadow z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            {/* Left Section: EstateFinder Logo */}
            <div className="flex-shrink-0">
              <Link to="/" className="text-xl font-bold text-blue-600">
                EstateFinder
              </Link>
            </div>
            {/* Middle Section: Desktop quick search or mobile hamburger */}
            {isMobile ? (
              <div className="flex items-center">
                <button
                  onClick={toggleHamburgerMenu}
                  className="text-gray-600 focus:outline-none"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <form onSubmit={handleSearchSubmit} className="w-full max-w-md">
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search properties..."
                    className="w-full px-3 py-2 border rounded-md focus:outline-none"
                  />
                </form>
              </div>
            )}
            {/* Right Section: Navigation links (desktop) and account actions */}
            <div className="flex items-center space-x-4">
              {!isMobile && navLinks}
              {accountButtons}
            </div>
          </div>
        </div>
        {/* Mobile: Expanded hamburger menu */}
        {isMobile && menuExpanded && (
          <div className="bg-white shadow-md">
            <div className="px-4 py-2">
              <div className="flex flex-col space-y-2">
                {navLinks}
                {accountButtons}
              </div>
            </div>
          </div>
        )}
      </nav>
      {/* Spacer to ensure content is not hidden under fixed navbar */}
      <div className="h-16"></div>
    </>
  );
};

export default GV_TopNav;