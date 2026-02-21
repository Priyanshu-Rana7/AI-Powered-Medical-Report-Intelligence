import React, { useState } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Activity, Shield, Brain } from 'lucide-react';
import FileUpload from './components/FileUpload';

const API_BASE_URL = 'http://localhost:8000';

function App() {
  const [analysis, setAnalysis] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileUpload = async (file) => {
    setIsUploading(true);
    setError(null);
    setAnalysis(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setAnalysis(response.data.analysis);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.detail || 'An error occurred during analysis. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const reset = () => {
    setAnalysis(null);
    setError(null);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background blobs */}
      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>

      <div className="container relative z-10 py-10">
        <header className="flex items-center justify-between mb-20">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500 p-2 rounded-xl">
              <Activity className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight">MedIntel AI</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-text-secondary">
            <a href="#" className="hover:text-white transition-colors">How it works</a>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Safety</a>
          </nav>
        </header>

        <main className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            {!analysis ? (
              <motion.div
                key="landing"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center"
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 text-blue-500 text-sm font-semibold mb-8 border border-blue-500/20">
                  <Brain className="w-4 h-4" />
                  <span>Powered by Gemini 1.5 Pro</span>
                </div>
                <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
                  Understand your <br />
                  <span className="gradient-text">Medical Reports</span> in Seconds
                </h1>
                <p className="text-xl text-text-secondary mb-12 max-w-2xl mx-auto">
                  Upload your complex medical results and get a personalized, empathetic, and simplified explanation tailored for you.
                </p>

                <FileUpload onUpload={handleFileUpload} isUploading={isUploading} />

                {error && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-6 text-red-400 font-medium"
                  >
                    {error}
                  </motion.p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24">
                  <div className="glass-card p-6 text-left">
                    <div className="p-3 bg-blue-500/10 rounded-xl w-fit mb-4">
                      <Heart className="text-blue-500 w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">Empathetic AI</h3>
                    <p className="text-text-secondary text-sm">We explain findings like a caring doctor would, with context and care.</p>
                  </div>
                  <div className="glass-card p-6 text-left">
                    <div className="p-3 bg-purple-500/10 rounded-xl w-fit mb-4">
                      <Shield className="text-purple-500 w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">Private & Secure</h3>
                    <p className="text-text-secondary text-sm">Your data is processed securely and never stored on our servers.</p>
                  </div>
                  <div className="glass-card p-6 text-left">
                    <div className="p-3 bg-indigo-500/10 rounded-xl w-fit mb-4">
                      <Activity className="text-indigo-500 w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">Smart Jargon Removal</h3>
                    <p className="text-text-secondary text-sm">Complex terms are automatically translated into everyday language.</p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card p-8 md:p-12 mb-20"
              >
                <div className="prose prose-invert max-w-none prose-headings:font-bold prose-h1:text-4xl prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-p:text-text-secondary prose-li:text-text-secondary">
                  <ReactMarkdown>{analysis}</ReactMarkdown>
                </div>

                <div className="mt-12 pt-8 border-t border-glass-border flex flex-col md:flex-row items-center justify-between gap-6">
                  <button className="btn-primary" onClick={() => window.print()}>
                    Download Analysis
                  </button>
                  <button
                    className="text-text-secondary hover:text-white transition-colors"
                    onClick={reset}
                  >
                    Analyze another report
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <footer className="mt-10 mb-20 text-center text-text-secondary text-sm">
          <p>© 2026 MedIntel AI. Built for clarity and care.</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
