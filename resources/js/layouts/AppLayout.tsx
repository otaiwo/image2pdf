import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { useLocation } from 'react-router-dom';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const location = useLocation();
  // Hide the global Navbar on all dedicated tool pages. These pages use the
  // ToolLayout component, which already renders its own NavBar.
  const toolPaths = [
    '/image-to-pdf',
    '/merge-pdf',
    '/split-pdf',
    '/watermark-pdf',
    '/protect-pdf',
    '/organize-pdf',
    '/ai-summarizer',
    '/ai-keywords',
    '/ai-translate',
    '/edit-metadata',
    '/ai-chat',
    '/unlock-pdf',
    '/file-to-pdf',
    '/pdf-to-txt',
    '/pdf-to-docx',
    '/rotate-pdf',
    '/url-to-pdf',
    '/html-to-pdf',
    '/markdown-to-pdf',
    '/pdf-to-image',
    '/compress-pdf',
    '/extract-pages',
    '/add-page-numbers',
    '/sign-pdf',
    '/pdf-to-excel',
    '/pdf-to-pptx',
  ];
  // Hide both the global Navbar and Footer on tool pages; they have their own layout.
  const hideNavbar = toolPaths.includes(location.pathname);
  const hideFooter = hideNavbar;
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Render the global Navbar only on non‑tool pages */}
      {!hideNavbar && <Navbar />}
      <main className="flex-grow">
        {children}
      </main>
      {/* Render Footer only when not on a tool page */}
      {!hideFooter && <Footer />}
    </div>
  );
};

export default AppLayout;
