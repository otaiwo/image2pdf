import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileCode2, Menu, X, User, LogOut, Sun, Moon,
  Search, GitMerge, Scissors, Shield, Unlock,
  Image, File, Brain, Lock,
  FileDown, FileText, MessageSquare,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const Navbar = () => {
  const [isDark, setIsDark]       = useState(false);
  const [isOpen, setIsOpen]       = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  // Sync dark mode on mount
  useEffect(() => {
    const prefersDark =
      localStorage.theme === 'dark' ||
      (!('theme' in localStorage) &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);
    setIsDark(prefersDark);
    document.documentElement.classList.toggle('dark', prefersDark);
  }, []);

  const toggleDark = useCallback(() => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.theme = next ? 'dark' : 'light';
  }, [isDark]);

  const handleLogout = useCallback(() => {
    logout();
    navigate('/');
  }, [logout, navigate]);

  // Use navigate with replace to avoid polluting history on every keystroke
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setGlobalSearch(value);
      navigate(value ? `/tools?search=${encodeURIComponent(value)}` : '/tools', {
        replace: true,
      });
    },
    [navigate]
  );

  const closeMobile = useCallback(() => setIsOpen(false), []);

  const navLinks = [
    { to: '/merge-pdf',     label: 'Merge' },
    { to: '/ai-summarizer', label: 'AI Summarize' },
    { to: '/dashboard',     label: 'Dashboard' },
  ] as const;

  const pdfTools = [
    { to: '/merge-pdf',     label: 'Merge PDF',      Icon: GitMerge  },
    { to: '/split-pdf',     label: 'Split PDF',      Icon: Scissors  },
    { to: '/watermark-pdf', label: 'Watermark PDF',  Icon: Shield    },
    { to: '/protect-pdf',   label: 'Protect PDF',    Icon: Lock      },
    { to: '/unlock-pdf',    label: 'Unlock PDF',     Icon: Unlock    },
  ] as const;

  const conversionTools = [
    { to: '/image-to-pdf',    label: 'Image to PDF',  Icon: Image },
    { to: '/file-converter',  label: 'File Converter', Icon: FileDown },
    { to: '/file-to-pdf',     label: 'File to PDF',   Icon: File },
    { to: '/pdf-to-txt',      label: 'PDF to Text',   Icon: FileText },
    { to: '/pdf-to-docx',     label: 'PDF to DOCX',   Icon: FileDown },
  ] as const;

  const aiTools = [
    { to: '/ai-summarizer',   label: 'AI Summarize',  Icon: Brain },
    { to: '/ai-chat',         label: 'AI Chat',       Icon: MessageSquare },
  ] as const;

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">

          {/* Left — logo + nav links + search */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2 shrink-0">
              <div className="bg-red-600 p-1.5 rounded-lg">
                <FileCode2 className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
                PDFMaster AI
              </span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex md:items-center md:ml-10 md:space-x-1">
              {/* Mega-menu trigger */}
              <div
                className="relative"
                onMouseEnter={() => setIsToolsOpen(true)}
                onMouseLeave={() => setIsToolsOpen(false)}
              >
                <Link
                  to="/tools"
                  aria-haspopup="true"
                  aria-expanded={isToolsOpen}
                  className="text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 px-3 py-2 text-sm font-medium transition-colors inline-block"
                >
                  All Tools
                </Link>

                {/* Mega dropdown */}
                <div
                  role="menu"
                  className={`absolute left-0 top-full mt-2 w-screen max-w-lg bg-white dark:bg-gray-900 shadow-xl border border-gray-100 dark:border-gray-800 rounded-xl transition-all duration-200 z-20 ${
                    isToolsOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-1'
                  }`}
                >
                  <div className="p-5 grid grid-cols-3 gap-6">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
                        PDF Manipulation
                      </h4>
                      <ul className="space-y-1">
                        {pdfTools.map(({ to, label, Icon }) => (
                          <li key={to}>
                            <Link
                              to={to}
                              role="menuitem"
                              className="flex items-center space-x-2 px-2 py-1.5 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            >
                              <Icon className="h-4 w-4 shrink-0" />
                              <span>{label}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      {/* Conversion tools */}
                      <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
                        Conversion
                      </h4>
                      <ul className="space-y-1">
                        {conversionTools.map(({ to, label, Icon }) => (
                          <li key={to}>
                            <Link
                              to={to}
                              role="menuitem"
                              className="flex items-center space-x-2 px-2 py-1.5 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            >
                              <Icon className="h-4 w-4 shrink-0" />
                              <span>{label}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      {/* AI tools */}
                      <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
                        AI
                      </h4>
                      <ul className="space-y-1">
                        {aiTools.map(({ to, label, Icon }) => (
                          <li key={to}>
                            <Link
                              to={to}
                              role="menuitem"
                              className="flex items-center space-x-2 px-2 py-1.5 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            >
                              <Icon className="h-4 w-4 shrink-0" />
                              <span>{label}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Regular nav links */}
              {navLinks.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className="text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 px-3 py-2 text-sm font-medium transition-colors"
                >
                  {label}
                </Link>
              ))}

              {isAuthenticated && (
                <Link
                  to="/organizations"
                  className="text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 px-3 py-2 text-sm font-medium transition-colors"
                >
                  Teams
                </Link>
              )}
            </div>

            {/* Search bar */}
            <div className="hidden md:block ml-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="search"
                  placeholder="Search tools..."
                  value={globalSearch}
                  onChange={handleSearchChange}
                  className="pl-9 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none text-sm w-56 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Right — auth + dark mode toggle */}
          <div className="hidden md:flex items-center space-x-2">
            {/* Dark mode toggle always visible on desktop */}
            <button
              onClick={toggleDark}
              aria-label="Toggle dark mode"
              className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {isAuthenticated ? (
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                  <div className="w-7 h-7 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
                    <User className="w-4 h-4 text-red-600 dark:text-red-400" />
                  </div>
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
                    {user?.name}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  aria-label="Logout"
                  className="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 text-sm font-medium transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="md:hidden flex items-center space-x-2">
            <button
              onClick={toggleDark}
              aria-label="Toggle dark mode"
              className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <button
              onClick={() => setIsOpen(prev => !prev)}
              aria-label={isOpen ? 'Close menu' : 'Open menu'}
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white p-2 rounded-xl transition-colors"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 transition-colors">
          {/* Mobile search */}
          <div className="px-4 pt-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="search"
                placeholder="Search tools..."
                value={globalSearch}
                onChange={handleSearchChange}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none text-sm transition-colors"
              />
            </div>
          </div>

          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {[
              { to: '/tools',        label: 'All Tools'    },
              { to: '/merge-pdf',    label: 'Merge PDF'    },
              { to: '/ai-summarizer',label: 'AI Summarizer'},
              { to: '/dashboard',    label: 'Dashboard'    },
            ].map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                onClick={closeMobile}
                className="block px-3 py-2 text-base font-medium text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                {label}
              </Link>
            ))}
            {isAuthenticated && (
              <Link
                to="/organizations"
                onClick={closeMobile}
                className="block px-3 py-2 text-base font-medium text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                Teams
              </Link>
            )}
          </div>

          <div className="pt-3 pb-4 border-t border-gray-200 dark:border-gray-800 px-4">
            {isAuthenticated ? (
              <div className="space-y-2">
                <p className="text-sm font-bold text-gray-900 dark:text-white">{user?.name}</p>
                <button
                  onClick={() => { handleLogout(); closeMobile(); }}
                  className="text-red-600 dark:text-red-400 text-sm font-medium"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex flex-col space-y-2">
                <Link
                  to="/login"
                  onClick={closeMobile}
                  className="px-3 py-2 text-base font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={closeMobile}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-base font-medium text-center transition-colors"
                >
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