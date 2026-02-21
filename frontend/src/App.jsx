import React, { useState } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Activity, Shield, Brain, CheckCircle, AlertTriangle } from 'lucide-react';
import FileUpload from './components/FileUpload';

const API_BASE_URL = 'http://localhost:8000';

function App() {
  const { t, i18n } = useTranslation();
  const [analysis, setAnalysis] = useState(null);
  const [rawText, setRawText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [translationCache, setTranslationCache] = useState({});

  const languages = [
    'English', 'Hindi', 'Odia', 'Bengali', 'Tamil', 'Telugu',
    'Marathi', 'Gujarati', 'Kannada', 'Malayalam', 'Punjabi'
  ];

  const handleFileUpload = async (file) => {
    setIsUploading(true);
    setError(null);
    setAnalysis(null);
    setTranslationCache({}); // Clear cache on new upload

    const formData = new FormData();
    formData.append('file', file);
    formData.append('language', selectedLanguage);

    try {
      const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setAnalysis(response.data.analysis);
      setRawText(response.data.raw_text);

      // Cache the initial analysis
      setTranslationCache({ [selectedLanguage]: response.data.analysis });
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.detail || 'An error occurred during analysis. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleLanguageChange = async (newLang) => {
    setSelectedLanguage(newLang);
    i18n.changeLanguage(newLang); // Instant UI L10n

    if (!analysis) return;

    // Check Cache first
    if (translationCache[newLang]) {
      setAnalysis(translationCache[newLang]);
      return;
    }

    setIsTranslating(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/translate`, {
        text: analysis,
        raw_text: rawText,
        language: newLang
      });

      setAnalysis(response.data.analysis);
      // Update cache
      setTranslationCache(prev => ({ ...prev, [newLang]: response.data.analysis }));
    } catch (err) {
      console.error('Translation error:', err);
      setError('Could not translate the report. Please try again.');
    } finally {
      setIsTranslating(false);
    }
  };

  const reset = () => {
    setAnalysis(null);
    setRawText('');
    setTranslationCache({});
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
            <span className="text-2xl font-bold tracking-tight">{t('app_name')}</span>
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
                  <span>Powered by Gemini 2.0 Flash</span>
                </div>
                <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
                  {t('hero_title').split(' ').slice(0, -2).join(' ')} <br />
                  <span className="gradient-text">{t('hero_title').split(' ').slice(-2).join(' ')}</span>
                </h1>
                <p className="text-xl text-text-secondary mb-8 max-w-2xl mx-auto">
                  {t('hero_subtitle')}
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
                    <h3 className="text-lg font-bold mb-2">{t('features.empathetic')}</h3>
                    <p className="text-text-secondary text-sm">{t('features.empathetic_desc')}</p>
                  </div>
                  <div className="glass-card p-6 text-left">
                    <div className="p-3 bg-purple-500/10 rounded-xl w-fit mb-4">
                      <Shield className="text-purple-500 w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">{t('features.secure')}</h3>
                    <p className="text-text-secondary text-sm">{t('features.secure_desc')}</p>
                  </div>
                  <div className="glass-card p-6 text-left">
                    <div className="p-3 bg-indigo-500/10 rounded-xl w-fit mb-4">
                      <Activity className="text-indigo-500 w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">{t('features.jargon')}</h3>
                    <p className="text-text-secondary text-sm">{t('features.jargon_desc')}</p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card p-8 md:p-12 mb-20 relative"
              >
                <AnimatePresence>
                  {isTranslating && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-bg-color/50 backdrop-blur-sm z-50 flex items-center justify-center rounded-2xl"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <div className="relative">
                          <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                          <Brain className="absolute inset-0 m-auto w-5 h-5 text-blue-500" />
                        </div>
                        <p className="text-blue-500 font-medium text-sm">{t('translating')}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
                  <div className="verified-badge !mb-0">
                    <CheckCircle className="w-4 h-4" />
                    <span>{t('verified_badge')}</span>
                  </div>

                  <div className="flex items-center gap-3 glass-card px-4 py-2 border-glass-border">
                    <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">{t('language_label')}</span>
                    <select
                      value={selectedLanguage}
                      onChange={(e) => handleLanguageChange(e.target.value)}
                      className="bg-transparent text-white text-sm font-semibold focus:outline-none cursor-pointer"
                    >
                      {languages.map(lang => (
                        <option key={lang} value={lang} className="bg-[#05070a]">{lang}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="prose prose-invert max-w-none prose-headings:font-bold prose-h1:text-4xl prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-p:text-text-secondary prose-li:text-text-secondary">
                  <ReactMarkdown
                    components={{
                      text: ({ value }) => {
                        if (value.includes('!!!UNCLEAR:')) {
                          const parts = value.split(/(!!!UNCLEAR:.*?!!!)/g);
                          return parts.map((part, i) => {
                            if (part.startsWith('!!!UNCLEAR:')) {
                              const term = part.replace('!!!UNCLEAR:', '').replace('!!!', '');
                              return (
                                <span key={i} className="unclear-highlight" title="Our AI verifier flagged this as potentially unclear or missing in the report. Please ask your doctor specifically about this term.">
                                  <AlertTriangle className="inline w-3 h-3 mr-1" />
                                  {term} (Unclear)
                                </span>
                              );
                            }
                            return part;
                          });
                        }
                        return value;
                      }
                    }}
                  >
                    {analysis}
                  </ReactMarkdown>
                </div>

                <div className="mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
                  <button className="btn-primary" onClick={() => window.print()}>
                    {t('download_analysis')}
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={reset}
                  >
                    {t('analyze_another')}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <footer className="mt-10 mb-20 text-center text-text-secondary text-sm">
          <p>© 2026 MedClare. Built for clarity and care.</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
