import React from 'react';
import { Link } from 'react-router-dom';
import { FileCode2, Menu, X } from 'lucide-react';

const Navbar = () => {
  const [isOpen, setIsOpen] = React.useState(false);

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
              <Link to="/" className="text-gray-600 hover:text-red-600 px-3 py-2 text-sm font-medium transition-colors">
                All Tools
              </Link>
              <Link to="/merge-pdf" className="text-gray-600 hover:text-red-600 px-3 py-2 text-sm font-medium transition-colors">
                Merge
              </Link>
              <Link to="/ai-summarizer" className="text-gray-600 hover:text-red-600 px-3 py-2 text-sm font-medium transition-colors">
                AI Summarize
              </Link>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <button className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">
              Login
            </button>
            <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
              Sign Up
            </button>
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
              to="/"
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
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="px-5 space-y-2">
              <button className="block w-full text-left px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900">
                Login
              </button>
              <button className="block w-full bg-red-600 text-white px-3 py-2 rounded-lg text-base font-medium text-center">
                Sign Up
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
