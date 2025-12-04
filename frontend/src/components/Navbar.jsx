import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import routelyLogo from "../assets/routelylogo.jpg";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    checkAuth();
  }, [location]);

  const checkAuth = () => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    setIsAuthenticated(!!token);
    setUser(userData ? JSON.parse(userData) : null);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
    navigate('/');
  };

  const publicNavItems = [
    { path: "/", label: "Home" },
  ];

  const authenticatedNavItems = [
    { path: "/", label: "Home" },
    { path: "/route-planner", label: "Route Planner" },
    { path: "/air-sos", label: "AirSOS" },
    { path: "/ai-advice", label: "AI Advice" },
    { path: "/leaderboard", label: "Leaderboard" },
    { path: "/dashboard", label: "Dashboard" },
    { path: "/achievements", label: "Achievements" },
  ];

  const navItems = isAuthenticated ? authenticatedNavItems : publicNavItems;

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileMenuOpen]);

  return (
    <>
      <nav className="backdrop-blur-md bg-white/80 shadow-sm sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex-shrink-0 z-50">
              <Link
                to="/"
                className="flex items-center"
              >
                <img
                  src={routelyLogo}
                  alt="Routely Logo"
                  className="h-10 w-auto rounded-full"
                />
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden relative z-50 w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 active:scale-95 transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              <div className="w-5 h-5 relative">
                <span
                  className={`absolute top-0 left-0 w-full h-0.5 bg-gray-700 rounded-full transition-all duration-300 ${
                    mobileMenuOpen
                      ? "rotate-45 top-2"
                      : "translate-y-0"
                  }`}
                />
                <span
                  className={`absolute top-2 left-0 w-full h-0.5 bg-gray-700 rounded-full transition-all duration-300 ${
                    mobileMenuOpen ? "opacity-0" : "opacity-100"
                  }`}
                />
                <span
                  className={`absolute top-4 left-0 w-full h-0.5 bg-gray-700 rounded-full transition-all duration-300 ${
                    mobileMenuOpen
                      ? "-rotate-45 top-2"
                      : "translate-y-0"
                  }`}
                />
              </div>
            </button>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const active = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`nav-link px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-gray-900 ${
                      active ? "active" : ""
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
              {isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  className="ml-4 px-4 py-2 rounded-lg text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
                >
                  Logout
                </button>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="ml-4 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 rounded-lg text-sm font-medium border border-blue-600 text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile menu backdrop */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile menu */}
      <div
        className={`md:hidden fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out ${
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Mobile menu header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center space-x-3">
              <img
                src={routelyLogo}
                alt="Routely Logo"
                className="h-8 w-auto rounded-full"
              />
              <span className="text-lg font-semibold text-gray-900">Menu</span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 active:scale-95 transition-all duration-200"
              aria-label="Close menu"
            >
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Mobile menu items */}
          <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
            {navItems.map((item, index) => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`group relative block px-4 py-3.5 rounded-xl text-base font-medium transition-all duration-200 ${
                    active
                      ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                  style={{
                    animationDelay: `${index * 50}ms`,
                  }}
                >
                  <span className="relative z-10 flex items-center">
                    {item.label}
                    {active && (
                      <span className="ml-auto w-2 h-2 rounded-full bg-blue-600"></span>
                    )}
                  </span>
                  {active && (
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-100/50 to-indigo-100/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                  )}
                </Link>
              );
            })}
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-3.5 rounded-xl text-base font-medium bg-red-500 text-white hover:bg-red-600 transition-colors mt-4"
              >
                Logout
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-left px-4 py-3.5 rounded-xl text-base font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-left px-4 py-3.5 rounded-xl text-base font-medium border border-blue-600 text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </nav>

          {/* Mobile menu footer */}
          <div className="px-4 py-4 border-t border-gray-100 bg-gray-50/50">
            <p className="text-xs text-gray-500 text-center">
              © 2024 Routelyy
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;
