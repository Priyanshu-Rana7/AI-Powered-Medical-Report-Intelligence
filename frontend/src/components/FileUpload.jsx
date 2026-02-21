import React, { useState, useCallback } from 'react';
import { Upload, File, X, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FileUpload = ({ onUpload, isUploading }) => {
    const [file, setFile] = useState(null);
    const [dragActive, setDragActive] = useState(false);

    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
        }
    }, []);

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const removeFile = () => {
        setFile(null);
    };

    const handleUpload = () => {
        if (file) {
            onUpload(file);
        }
    };

    return (
        <div className="w-full max-w-xl mx-auto">
            <div
                className={`relative glass-card p-10 flex flex-col items-center justify-center transition-all duration-300 ${dragActive ? 'border-primary scale-[1.02] shadow-xl' : 'border-transparent'
                    }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <AnimatePresence mode="wait">
                    {!file ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex flex-col items-center text-center"
                        >
                            <div className="bg-blue-500/10 p-4 rounded-full mb-4">
                                <Upload className="text-blue-500 w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Upload Medical Report</h3>
                            <p className="text-text-secondary mb-6">Drag and drop your PDF or image here</p>
                            <label className="btn-primary cursor-pointer">
                                Browse Files
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="application/pdf,image/*"
                                    onChange={handleChange}
                                />
                            </label>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="file-selected"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="flex flex-col items-center w-full"
                        >
                            <div className="bg-blue-500/10 p-4 rounded-full mb-4">
                                <File className="text-blue-500 w-10 h-10" />
                            </div>
                            <p className="text-lg font-medium mb-1">{file.name}</p>
                            <p className="text-sm text-text-secondary mb-6">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>

                            <div className="flex gap-4">
                                <button
                                    className="btn-primary"
                                    onClick={handleUpload}
                                    disabled={isUploading}
                                >
                                    {isUploading ? 'Analyzing...' : 'Start Analysis'}
                                </button>
                                <button
                                    className="p-3 rounded-xl border border-glass-border hover:bg-white/5 transition-colors"
                                    onClick={removeFile}
                                    disabled={isUploading}
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-6 text-sm text-text-secondary">
                <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Secure Encryption</span>
                </div>
                <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>AI-Powered Clarity</span>
                </div>
                <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Privacy Focused</span>
                </div>
            </div>
        </div>
    );
};

export default FileUpload;
