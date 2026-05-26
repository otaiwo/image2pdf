import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileCode2, Menu, X, User, LogOut, Sun, Moon, Search } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const Navbar = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        setIsDark(true);
        document.documentElement.classList.add('dark');
    } else {
        setIsDark(false);
        document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDark = () => {
    if (isDark) {
        document.documentElement.classList.remove('dark');
        localStorage.theme = 'light';
        setIsDark(false);
    } else {
        document.documentElement.classList.add('dark');
        localStorage.theme = 'dark';
        setIsDark(true);
    }
  };

  const [isOpen, setIsOpen] = React.useState(false);
  const [globalSearch, setGlobalSearch] = React.useState('');
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setGlobalSearch(value);
    // Navigate to tools page with query param
    navigate(`/tools${value ? `?search=${encodeURIComponent(value)}` : ''}`);
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="bg-red-600 p-1.5 rounded-lg">
                <FileCode2 className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                PDFMaster AI
              </span>
            </Link>
            <div className="hidden md:ml-10 md:flex md:space-x-8">
              <Link to="/tools" className="text-gray-600 hover:text-red-600 px-3 py-2 text-sm font-medium transition-colors">
                All Tools
              </Link>
              <Link to="/merge-pdf" className="text-gray-600 hover:text-red-600 px-3 py-2 text-sm font-medium transition-colors">
                Merge
              </Link>
              <Link to="/ai-summarizer" className="text-gray-600 hover:text-red-600 px-3 py-2 text-sm font-medium transition-colors">
                AI Summarize
              </Link>
              <Link to="/dashboard" className="text-gray-600 hover:text-red-600 px-3 py-2 text-sm font-medium transition-colors">
                Dashboard
              </Link>
              <Link to="/organizations" className="text-gray-600 hover:text-red-600 px-3 py-2 text-sm font-medium transition-colors">
                Teams
              </Link>
            </div>
            {/* Global Search (visible on md+ screens) */}
            <div className="hidden md:block ml-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tools..."
                  value={globalSearch}
                  onChange={handleSearchChange}
                  className="pl-10 pr-4 py-2 rounded-xl border border-gray-100 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none shadow-sm w-64"
                />
              </div>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                        <User className="w-4 h-4 text-red-600" />
                    </div>
                    <span className="text-sm font-bold text-gray-700">{user?.name}</span>
                </div>
                <button
                    onClick={toggleDark}
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
                >
                    {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </button>
                <button
                    onClick={handleLogout}
                    className="text-gray-500 hover:text-red-600 p-2 transition-colors"
                    title="Logout"
                >
                    <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <>
                <Link to="/login" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                  Login
                </Link>
                <Link to="/register" className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
                  Sign Up
                </Link>
              </>
            )}
          </div>

          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-600 hover:text-gray-900 p-2"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-b border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              to="/tools"
              className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-red-600 hover:bg-gray-50 rounded-md"
              onClick={() => setIsOpen(false)}
            >
              All Tools
            </Link>
            <Link
              to="/merge-pdf"
              className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-red-600 hover:bg-gray-50 rounded-md"
              onClick={() => setIsOpen(false)}
            >
              Merge PDF
            </Link>
            <Link
              to="/ai-summarizer"
              className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-red-600 hover:bg-gray-50 rounded-md"
              onClick={() => setIsOpen(false)}
            >
              AI Summarizer
            </Link>
            <Link
              to="/dashboard"
              className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-red-600 hover:bg-gray-50 rounded-md"
              onClick={() => setIsOpen(false)}
            >
              Dashboard
            </Link>
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200">
            {isAuthenticated ? (
                <div className="px-5 space-y-2">
                    <p className="text-sm font-bold text-gray-900">{user?.name}</p>
                    <button
                        onClick={handleLogout}
                        className="block w-full text-left py-2 text-base font-medium text-red-600"
                    >
                        Sign Out
                    </button>
                </div>
            ) : (
                <div className="px-5 space-y-2">
                    <Link to="/login" className="block w-full text-left px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900">
                        Login
                    </Link>
                    <Link to="/register" className="block w-full bg-red-600 text-white px-3 py-2 rounded-lg text-base font-medium text-center">
                        Sign Up
                    </Link>
                </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
