import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  IconQrcode,
  IconCopy,
  IconDownload,
} from '@tabler/icons-react';
import { generateQRCode } from '../../utils/qrCode';

export const QRCode = () => {
  const [text, setText] = useState('');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [size, setSize] = useState(200);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!text.trim()) {
      setError('Please enter text to generate QR code');
      return;
    }
    try {
      setError('');
      const code = await generateQRCode(text, size);
      setQrCode(code);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate QR code');
    }
  };

  const handleDownload = () => {
    if (!qrCode) return;
    const link = document.createElement('a');
    link.href = qrCode;
    link.download = 'qrcode.png';
    link.click();
  };

  const handleCopy = () => {
    if (!qrCode) return;
    // Copy image to clipboard
    fetch(qrCode)
      .then(res => res.blob())
      .then(blob => navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]))
      .catch(() => {
        // Fallback: copy text
        navigator.clipboard.writeText(text);
      });
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
            QR Code Generator
          </h1>
          <p className="text-muted-foreground">
            Generate QR codes from text or URLs. All processing happens locally in your browser.
          </p>
        </div>

        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Text or URL</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter text or URL to generate QR code..."
              className="w-full h-32 px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Size: {size}px
            </label>
            <input
              type="range"
              min="100"
              max="500"
              value={size}
              onChange={(e) => setSize(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          <button
            onClick={handleGenerate}
            className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2"
          >
            <IconQrcode className="w-5 h-5" />
            Generate QR Code
          </button>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/50 text-destructive rounded-xl p-4 text-sm">
            {error}
          </div>
        )}

        {qrCode && (
          <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 space-y-4">
            <div className="flex justify-center">
              <img src={qrCode} alt="QR Code" className="border border-border rounded-lg" />
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleCopy}
                className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors flex items-center gap-2"
              >
                <IconCopy className="w-4 h-4" />
                Copy
              </button>
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors flex items-center gap-2"
              >
                <IconDownload className="w-4 h-4" />
                Download
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
