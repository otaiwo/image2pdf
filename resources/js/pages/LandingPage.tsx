import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileStack,
  Scissors,
  RefreshCw,
  Image as ImageIcon,
  Zap,
  ShieldCheck,
  Cpu,
  ArrowRight,
  Stamp,
  MessageSquare,
  CheckCircle2,
  Star,
  Plus,
  Minus
} from 'lucide-react';
import Button from '../components/ui/Button';

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
    link: '/split-pdf'
  },
  {
    name: 'Add Watermark',
    description: 'Stamp your PDF with custom text. Choose your text and we\'ll apply it to every page.',
    icon: Stamp,
    color: 'bg-blue-600',
    link: '/watermark-pdf'
  },
  {
    name: 'Image to PDF',
    description: 'Convert JPG, PNG, BMP, GIF and WebP images to PDF in seconds.',
    icon: ImageIcon,
    color: 'bg-yellow-500',
    link: '/image-to-pdf'
  },
  {
    name: 'AI Chat',
    description: 'Ask anything about your document and get instant answers powered by AI.',
    icon: MessageSquare,
    color: 'bg-indigo-600',
    link: '/ai-chat'
  },
  {
    name: 'PDF Converter',
    description: 'Convert Word, Excel, PowerPoint and more to and from PDF.',
    icon: RefreshCw,
    color: 'bg-indigo-500',
    link: '/tools'
  }
];

const testimonials = [
  {
    name: 'Sarah Jenkins',
    role: 'Legal Assistant',
    content: 'PDFMaster AI has transformed how we handle contracts. The AI summarizer is a lifesaver for quick reviews.',
    avatar: 'SJ'
  },
  {
    name: 'Michael Chen',
    role: 'Freelance Designer',
    content: 'The fastest PDF merger I\'ve ever used. The UI is clean and it just works every time.',
    avatar: 'MC'
  },
  {
    name: 'Elena Rodriguez',
    role: 'Student',
    content: 'The guest access is great for quick tasks, but I upgraded to Pro for the unlimited AI chat. Totally worth it!',
    avatar: 'ER'
  }
];

const faqs = [
  {
    question: 'Is my data secure?',
    answer: 'Absolutely. We use 256-bit SSL encryption for all file transfers. Files are automatically deleted from our servers after processing.'
  },
  {
    question: 'How does the AI Summarizer work?',
    answer: 'Our AI analyzes the text content of your PDF to identify key points and generate a concise summary, saving you hours of reading.'
  },
  {
    question: 'What are the guest limitations?',
    answer: 'Guest users can perform up to 5 operations per day with a 20MB file limit. Some exports may include a watermark.'
  }
];

const LandingPage: React.FC = () => {
  const [openFaq, setOpenFaq] = React.useState<number | null>(null);

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-950 transition-colors">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
              <span className="block">Manage your PDFs</span>
              <span className="block text-red-600">Smarter with AI</span>
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-500 dark:text-gray-400">
              The ultimate PDF productivity platform. Merge, split, compress, and analyze your documents with the power of artificial intelligence.
            </p>
            <div className="mt-10 flex justify-center gap-4">
              <Link to="/merge-pdf">
                <Button size="lg" className="px-8">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/tools">
                <Button variant="outline" size="lg">
                  View All Tools
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Tools Grid */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Popular PDF Tools</h2>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Everything you need to master your PDF documents.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tools.map((tool, index) => (
              <motion.div
                key={tool.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all border border-gray-100 dark:border-gray-800"
              >
                <Link to={tool.link} className="block">
                  <div className={`${tool.color} w-12 h-12 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <tool.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">{tool.name}</h3>
                  <p className="text-gray-500 dark:text-gray-400 leading-relaxed mb-6">{tool.description}</p>
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
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 text-center">
            {[
              { icon: Zap, title: 'Blazing Fast', desc: 'High-performance servers process your files in seconds.', color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/20' },
              { icon: ShieldCheck, title: 'Secure & Private', desc: 'Files are encrypted and automatically deleted after processing.', color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/20' },
              { icon: Cpu, title: 'AI Powered', desc: 'Advanced AI capabilities to summarize and analyze your PDFs.', color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/20' },
            ].map((f, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className={`${f.bg} p-4 rounded-full mb-6`}>
                  <f.icon className={`h-8 w-8 ${f.color}`} />
                </div>
                <h3 className="text-xl font-bold dark:text-white mb-4">{f.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">What Our Users Say</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-white dark:bg-gray-900 p-8 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                <div className="flex text-yellow-400 mb-4">
                  {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
                </div>
                <p className="text-gray-600 dark:text-gray-400 italic mb-6">"{t.content}"</p>
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 font-bold mr-3">
                    {t.avatar}
                  </div>
                  <div>
                    <h4 className="font-bold dark:text-white">{t.name}</h4>
                    <p className="text-xs text-gray-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-16 dark:text-white">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-6 text-left font-bold dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                >
                  {faq.question}
                  {openFaq === i ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                </button>
                {openFaq === i && (
                  <div className="p-6 pt-0 text-gray-600 dark:text-gray-400 leading-relaxed">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gray-900 dark:bg-red-600 rounded-3xl overflow-hidden shadow-2xl relative">
            <div className="px-8 py-16 sm:px-16 sm:py-24 lg:flex lg:items-center lg:justify-between">
              <div>
                <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                  <span className="block">Ready to simplify your PDF tasks?</span>
                  <span className="block opacity-90">Start for free today.</span>
                </h2>
                <p className="mt-4 text-lg text-gray-100 max-w-xl">
                  Join thousands of users who save time and effort with our professional PDF tools.
                </p>
              </div>
              <div className="mt-10 lg:mt-0 lg:ml-8">
                <Link to="/register">
                  <Button size="lg" variant="secondary" className="px-10 py-5 text-lg">
                    Get Started Now
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
