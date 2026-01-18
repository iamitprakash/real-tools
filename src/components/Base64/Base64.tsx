import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  IconCode,
  IconCopy,
  IconUpload,
} from '@tabler/icons-react';
import { encodeBase64, decodeBase64, encodeImageToBase64, validateBase64 } from '../../utils/base64';

export const Base64 = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [error, setError] = useState('');

  const handleEncode = () => {
    try {
      setError('');
      const encoded = encodeBase64(input);
      setOutput(encoded);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to encode');
    }
  };

  const handleDecode = () => {
    try {
      setError('');
      if (!validateBase64(input)) {
        setError('Invalid Base64 string');
        return;
      }
      const decoded = decodeBase64(input);
      setOutput(decoded);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to decode');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }
    
    try {
      setError('');
      const base64 = await encodeImageToBase64(file);
      setInput('');
      setOutput(base64);
      setMode('encode');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to encode image');
    }
    
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Base64 Encoder/Decoder
          </h1>
          <p className="text-muted-foreground">
            Encode and decode text or images to/from Base64. All processing happens locally in your browser.
          </p>
        </div>

        <div className="flex gap-4 justify-center">
          <button
            onClick={() => {
              setMode('encode');
              setInput('');
              setOutput('');
              setError('');
            }}
            className={`px-6 py-2 rounded-xl font-semibold transition-all ${
              mode === 'encode'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Encode
          </button>
          <button
            onClick={() => {
              setMode('decode');
              setInput('');
              setOutput('');
              setError('');
            }}
            className={`px-6 py-2 rounded-xl font-semibold transition-all ${
              mode === 'decode'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Decode
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Input</h2>
              {mode === 'encode' && (
                <label className="px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-lg transition-colors cursor-pointer text-sm flex items-center gap-2">
                  <IconUpload className="w-4 h-4" />
                  Upload Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={mode === 'encode' ? 'Enter text to encode...' : 'Enter Base64 string to decode...'}
              className="w-full h-64 px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm resize-none"
            />
            <button
              onClick={mode === 'encode' ? handleEncode : handleDecode}
              className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2"
            >
              <IconCode className="w-5 h-5" />
              {mode === 'encode' ? 'Encode' : 'Decode'}
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Output</h2>
              {output && (
                <button
                  onClick={() => handleCopy(output)}
                  className="px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-lg transition-colors flex items-center gap-2 text-sm"
                >
                  <IconCopy className="w-4 h-4" />
                  Copy
                </button>
              )}
            </div>
            <textarea
              value={output}
              readOnly
              placeholder="Output will appear here..."
              className="w-full h-64 px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm resize-none"
            />
            {output && output.startsWith('data:image/') && (
              <div className="mt-4">
                <img src={output} alt="Decoded" className="max-w-full h-auto rounded-lg border border-border" />
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/50 text-destructive rounded-xl p-4 text-sm">
            {error}
          </div>
        )}
      </motion.div>
    </div>
  );
};
