import React, { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileImage, ShieldCheck } from 'lucide-react';

interface ImageUploaderProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onFileSelect, isProcessing }) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/') || file.type === 'application/pdf') {
        onFileSelect(file);
      } else {
        alert('Please upload an image or PDF file.');
      }
    }
  }, [onFileSelect]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  }, [onFileSelect]);

  return (
    <div className="w-full max-w-xl mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <label
          className={`
            relative group cursor-pointer
            flex flex-col items-center justify-center
            p-12 border-2 border-dashed rounded-3xl
            transition-all duration-300 ease-out
            glass-panel
            ${isDragOver 
              ? 'border-white bg-white/10 scale-[1.02]' 
              : 'border-zinc-700 hover:border-zinc-500 hover:bg-white/5'
            }
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            className="hidden"
            accept="image/*,application/pdf"
            onChange={handleChange}
            disabled={isProcessing}
          />

          <AnimatePresence mode="wait">
            {isProcessing ? (
              <motion.div
                key="processing"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex flex-col items-center"
              >
                <div className="w-16 h-16 mb-4 relative">
                  <motion.div
                    className="absolute inset-0 border-4 border-white/30 rounded-full"
                  />
                  <motion.div
                    className="absolute inset-0 border-4 border-white border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                </div>
                <p className="text-lg font-medium text-white">Scrubbing Metadata...</p>
              </motion.div>
            ) : (
              <motion.div
                key="upload"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex flex-col items-center text-center"
              >
                <div className={`
                  w-20 h-20 mb-6 rounded-2xl flex items-center justify-center
                  w-20 h-20 mb-6 rounded-2xl flex items-center justify-center
                  bg-white/10 group-hover:bg-white/20
                  transition-all duration-300
                `}>
                  <Upload className="w-10 h-10 text-white group-hover:scale-110 transition-transform duration-300" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Drop your image or PDF here
                </h3>
                <p className="text-white mb-6">
                  or <span className="text-white underline decoration-white/30 underline-offset-4 group-hover:text-white">browse files</span>
                </p>
                <div className="flex items-center gap-4 text-xs text-white uppercase tracking-wider font-medium">
                  <span className="flex items-center gap-1.5 bg-zinc-800/50 px-3 py-1.5 rounded-full border border-zinc-700/50">
                    <FileImage className="w-3.5 h-3.5" /> JPEG, PNG, PDF
                  </span>
                  <span className="flex items-center gap-1.5 bg-zinc-800/50 px-3 py-1.5 rounded-full border border-zinc-700/50">
                    <ShieldCheck className="w-3.5 h-3.5" /> We don't store your files
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </label>
      </motion.div>
    </div>
  );
};
