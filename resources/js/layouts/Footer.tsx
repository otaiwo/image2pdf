import React from 'react';
import { Link } from 'react-router-dom';
import { FileCode2, Github, Twitter, Linkedin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <div className="bg-red-600 p-1 rounded">
                <FileCode2 className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900">PDFMaster AI</span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed">
              Professional-grade PDF tools powered by AI. Merge, split, compress, and analyze your documents with ease.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Tools</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-500 hover:text-red-600 text-sm transition-colors">Merge PDF</a></li>
              <li><a href="#" className="text-gray-500 hover:text-red-600 text-sm transition-colors">Split PDF</a></li>
              <li><a href="#" className="text-gray-500 hover:text-red-600 text-sm transition-colors">Compress PDF</a></li>
              <li><a href="#" className="text-gray-500 hover:text-red-600 text-sm transition-colors">AI Summarizer</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Company</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-500 hover:text-red-600 text-sm transition-colors">About Us</a></li>
              <li><Link to="/pricing" className="text-gray-500 hover:text-red-600 text-sm transition-colors">Pricing</Link></li>
              <li><a href="#" className="text-gray-500 hover:text-red-600 text-sm transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-gray-500 hover:text-red-600 text-sm transition-colors">Terms of Service</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Connect</h3>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-red-600 transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-red-600 transition-colors">
                <Github className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-red-600 transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} PDFMaster AI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
