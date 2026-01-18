import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  IconArrowsExchange,
  IconCopy,
  IconDownload,
} from '@tabler/icons-react';
import { convertCSVToJSON, convertJSONToCSV } from '../../utils/csvJsonConverter';

export const CSVJSONConverter = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'csv-to-json' | 'json-to-csv'>('csv-to-json');
  const [hasHeaders, setHasHeaders] = useState(true);
  const [error, setError] = useState('');

  const handleConvert = () => {
    if (!input.trim()) {
      setError('Please enter data to convert');
      return;
    }
    try {
      setError('');
      if (mode === 'csv-to-json') {
        const json = convertCSVToJSON(input, hasHeaders);
        setOutput(json);
      } else {
        const csv = convertJSONToCSV(input, hasHeaders);
        setOutput(csv);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to convert');
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleDownload = (text: string, filename: string) => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
            CSV ↔ JSON Converter
          </h1>
          <p className="text-muted-foreground">
            Convert between CSV and JSON formats. All processing happens locally in your browser.
          </p>
        </div>

        <div className="flex gap-4 justify-center">
          <button
            onClick={() => {
              setMode('csv-to-json');
              setInput('');
              setOutput('');
              setError('');
            }}
            className={`px-6 py-2 rounded-xl font-semibold transition-all ${
              mode === 'csv-to-json'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            CSV → JSON
          </button>
          <button
            onClick={() => {
              setMode('json-to-csv');
              setInput('');
              setOutput('');
              setError('');
            }}
            className={`px-6 py-2 rounded-xl font-semibold transition-all ${
              mode === 'json-to-csv'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            JSON → CSV
          </button>
        </div>

        <div className="flex items-center justify-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={hasHeaders}
              onChange={(e) => setHasHeaders(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm">Include Headers</span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Input ({mode === 'csv-to-json' ? 'CSV' : 'JSON'})</h2>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={mode === 'csv-to-json' ? 'Enter CSV data...' : 'Enter JSON data...'}
              className="w-full h-96 px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm resize-none"
            />
            <button
              onClick={handleConvert}
              className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2"
            >
              <IconArrowsExchange className="w-5 h-5" />
              Convert
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Output ({mode === 'csv-to-json' ? 'JSON' : 'CSV'})</h2>
              {output && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCopy(output)}
                    className="px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-lg transition-colors flex items-center gap-2 text-sm"
                  >
                    <IconCopy className="w-4 h-4" />
                    Copy
                  </button>
                  <button
                    onClick={() => handleDownload(output, mode === 'csv-to-json' ? 'output.json' : 'output.csv')}
                    className="px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-lg transition-colors flex items-center gap-2 text-sm"
                  >
                    <IconDownload className="w-4 h-4" />
                    Download
                  </button>
                </div>
              )}
            </div>
            <textarea
              value={output}
              readOnly
              placeholder="Output will appear here..."
              className="w-full h-96 px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm resize-none"
            />
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
