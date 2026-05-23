import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileStack,
  Scissors,
  FileDown,
  RefreshCw,
  Image as ImageIcon,
  Zap,
  ShieldCheck,
  Cpu,
  ArrowRight
} from 'lucide-react';

const tools = [
  {
    name: 'Merge PDF',
    description: 'Combine multiple PDF files into one document in any order you want.',
    icon: FileStack,
    color: 'bg-blue-500',
    link: '/merge-pdf'
  },
  {
    name: 'Split PDF',
    description: 'Separate one page or a whole set for easy conversion into independent PDF files.',
    icon: Scissors,
    color: 'bg-red-500',
    link: '#'
  },
  {
    name: 'Compress PDF',
    description: 'Reduce the file size of your PDF while maintaining the best possible quality.',
    icon: FileDown,
    color: 'bg-green-500',
    link: '#'
  },
  {
    name: 'Image to PDF',
    description: 'Convert JPG, PNG, BMP, GIF and WebP images to PDF in seconds.',
    icon: ImageIcon,
    color: 'bg-yellow-500',
    link: '/image-to-pdf'
  },
  {
    name: 'AI Summarizer',
    description: 'Get key insights and summaries from your long PDF documents instantly.',
    icon: Cpu,
    color: 'bg-purple-500',
    link: '/ai-summarizer'
  },
  {
    name: 'PDF Converter',
    description: 'Convert Word, Excel, PowerPoint and more to and from PDF.',
    icon: RefreshCw,
    color: 'bg-indigo-500',
    link: '#'
  }
];

const LandingPage: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white pt-16 pb-20 lg:pt-24 lg:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
              <span className="block">Manage your PDFs</span>
              <span className="block text-red-600">Smarter with AI</span>
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-500">
              The ultimate PDF productivity platform. Merge, split, compress, and analyze your documents with the power of artificial intelligence.
            </p>
            <div className="mt-10 flex justify-center gap-4">
              <Link
                to="/merge-pdf"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-red-600 hover:bg-red-700 shadow-sm transition-all transform hover:scale-105"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <button className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-all">
                View All Tools
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Tools Grid */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Popular PDF Tools</h2>
            <p className="mt-4 text-gray-600">Everything you need to master your PDF documents.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tools.map((tool, index) => (
              <motion.div
                key={tool.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all border border-gray-100"
              >
                <Link to={tool.link} className="block">
                  <div className={`${tool.color} w-12 h-12 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <tool.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{tool.name}</h3>
                  <p className="text-gray-500 leading-relaxed mb-6">{tool.description}</p>
                  <div className="flex items-center text-red-600 font-medium group-hover:translate-x-1 transition-transform">
                    Try now <ArrowRight className="ml-2 h-4 w-4" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="flex flex-col items-center text-center">
              <div className="bg-red-100 p-4 rounded-full mb-6">
                <Zap className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold mb-4">Blazing Fast</h3>
              <p className="text-gray-600">High-performance servers process your files in seconds, not minutes.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="bg-blue-100 p-4 rounded-full mb-6">
                <ShieldCheck className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-4">Secure & Private</h3>
              <p className="text-gray-600">Files are encrypted and automatically deleted after processing. Your privacy is our priority.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="bg-purple-100 p-4 rounded-full mb-6">
                <Cpu className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold mb-4">AI Powered</h3>
              <p className="text-gray-600">Advanced AI capabilities to summarize, translate, and analyze your PDFs like never before.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gray-900 rounded-3xl overflow-hidden shadow-2xl relative">
            <div className="px-8 py-16 sm:px-16 sm:py-24 lg:flex lg:items-center lg:justify-between">
              <div>
                <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                  <span className="block">Ready to simplify your PDF tasks?</span>
                  <span className="block text-red-500">Start for free today.</span>
                </h2>
                <p className="mt-4 text-lg text-gray-300 max-w-xl">
                  Join thousands of users who save time and effort with our professional PDF tools.
                </p>
              </div>
              <div className="mt-10 lg:mt-0 lg:ml-8">
                <Link
                  to="/merge-pdf"
                  className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-xl text-gray-900 bg-white hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl"
                >
                  Get Started Free
                </Link>
              </div>
            </div>
            {/* Background pattern */}
            <div className="absolute top-0 right-0 -mt-20 -mr-20 opacity-10">
              <div className="h-64 w-64 rounded-full bg-white filter blur-3xl"></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
