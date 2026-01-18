import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  IconHash,
  IconCopy,
} from '@tabler/icons-react';
import { generateHash, type HashAlgorithm } from '../../utils/hashGenerator';

export const HashGenerator = () => {
  const [text, setText] = useState('');
  const [algorithm, setAlgorithm] = useState<HashAlgorithm>('sha256');
  const [hash, setHash] = useState('');
  const [error, setError] = useState('');

  const algorithms: { value: HashAlgorithm; label: string }[] = [
    { value: 'md5', label: 'MD5' },
    { value: 'sha1', label: 'SHA-1' },
    { value: 'sha256', label: 'SHA-256' },
    { value: 'sha512', label: 'SHA-512' },
  ];

  const handleGenerate = async () => {
    if (!text.trim()) {
      setError('Please enter text to hash');
      return;
    }
    try {
      setError('');
      const result = await generateHash(text, algorithm);
      setHash(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate hash');
    }
  };

  const handleCopy = () => {
    if (hash) {
      navigator.clipboard.writeText(hash);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Hash Generator
          </h1>
          <p className="text-muted-foreground">
            Generate cryptographic hashes from text. All processing happens locally in your browser.
          </p>
        </div>

        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Text to Hash</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter text to generate hash..."
              className="w-full h-32 px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Algorithm</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {algorithms.map((alg) => (
                <button
                  key={alg.value}
                  onClick={() => setAlgorithm(alg.value)}
                  className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                    algorithm === alg.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {alg.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2"
          >
            <IconHash className="w-5 h-5" />
            Generate Hash
          </button>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/50 text-destructive rounded-xl p-4 text-sm">
            {error}
          </div>
        )}

        {hash && (
          <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Hash Result</h2>
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-lg transition-colors flex items-center gap-2 text-sm"
              >
                <IconCopy className="w-4 h-4" />
                Copy
              </button>
            </div>
            <div className="bg-background border border-border rounded-xl p-4 font-mono text-sm break-all">
              {hash}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
