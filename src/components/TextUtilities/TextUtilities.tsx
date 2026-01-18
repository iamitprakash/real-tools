import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  IconCopy,
} from '@tabler/icons-react';
import { getTextStats, convertCase, removeDuplicates, reverseText, sortLines } from '../../utils/textUtilities';

export const TextUtilities = () => {
  const [text, setText] = useState('');
  const [output, setOutput] = useState('');
  const [stats, setStats] = useState<any>(null);

  const handleStats = () => {
    const result = getTextStats(text);
    setStats(result);
  };

  const handleCaseConvert = (caseType: 'upper' | 'lower' | 'title' | 'sentence' | 'camel' | 'pascal' | 'kebab' | 'snake') => {
    const result = convertCase(text, caseType);
    setOutput(result);
  };

  const handleRemoveDuplicates = (byLine: boolean) => {
    const result = removeDuplicates(text, byLine);
    setOutput(result);
  };

  const handleReverse = (byLine: boolean) => {
    const result = reverseText(text, byLine);
    setOutput(result);
  };

  const handleSort = (ascending: boolean) => {
    const result = sortLines(text, ascending);
    setOutput(result);
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
            Text Utilities
          </h1>
          <p className="text-muted-foreground">
            Various text manipulation tools. All processing happens locally in your browser.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Input</h2>
            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setOutput('');
                setStats(null);
              }}
              placeholder="Enter text..."
              className="w-full h-64 px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
            <button
              onClick={handleStats}
              className="w-full px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors"
            >
              Get Statistics
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
              className="w-full h-64 px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6">
            <h3 className="text-lg font-bold mb-4">Text Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Characters</p>
                <p className="text-lg font-semibold">{stats.characters}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Characters (no spaces)</p>
                <p className="text-lg font-semibold">{stats.charactersNoSpaces}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Words</p>
                <p className="text-lg font-semibold">{stats.words}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sentences</p>
                <p className="text-lg font-semibold">{stats.sentences}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Paragraphs</p>
                <p className="text-lg font-semibold">{stats.paragraphs}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lines</p>
                <p className="text-lg font-semibold">{stats.lines}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tools */}
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-bold">Text Tools</h3>
          
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium mb-2">Case Converter</p>
              <div className="flex flex-wrap gap-2">
                {(['upper', 'lower', 'title', 'sentence', 'camel', 'pascal', 'kebab', 'snake'] as const).map((caseType) => (
                  <button
                    key={caseType}
                    onClick={() => handleCaseConvert(caseType)}
                    className="px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-lg transition-colors text-sm capitalize"
                  >
                    {caseType}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Remove Duplicates</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleRemoveDuplicates(false)}
                  className="px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-lg transition-colors text-sm"
                >
                  Remove Duplicate Words
                </button>
                <button
                  onClick={() => handleRemoveDuplicates(true)}
                  className="px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-lg transition-colors text-sm"
                >
                  Remove Duplicate Lines
                </button>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Reverse</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleReverse(false)}
                  className="px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-lg transition-colors text-sm"
                >
                  Reverse Text
                </button>
                <button
                  onClick={() => handleReverse(true)}
                  className="px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-lg transition-colors text-sm"
                >
                  Reverse Lines
                </button>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Sort</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleSort(true)}
                  className="px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-lg transition-colors text-sm"
                >
                  Sort Lines (A-Z)
                </button>
                <button
                  onClick={() => handleSort(false)}
                  className="px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-lg transition-colors text-sm"
                >
                  Sort Lines (Z-A)
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
