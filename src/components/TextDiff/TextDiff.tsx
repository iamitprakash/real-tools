import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  IconCopy,
  IconDownload,
  IconRefresh,
  IconFileText,
  IconGitCompare,
} from '@tabler/icons-react';
import { computeDiff, computeInlineDiff, getDiffStats, type DiffSegment } from '../../utils/textDiff';
import { formatBytes } from '../../utils/imageProcessor';

type DiffMode = 'line' | 'inline';

export const TextDiff = () => {
  const [text1, setText1] = useState('');
  const [text2, setText2] = useState('');
  const [diffSegments, setDiffSegments] = useState<DiffSegment[]>([]);
  const [stats, setStats] = useState<{
    linesAdded: number;
    linesRemoved: number;
    linesUnchanged: number;
    charactersAdded: number;
    charactersRemoved: number;
    similarity: number;
  } | null>(null);
  const [diffMode, setDiffMode] = useState<DiffMode>('line');
  const textarea1Ref = useRef<HTMLTextAreaElement>(null);
  const textarea2Ref = useRef<HTMLTextAreaElement>(null);

  const handleCompare = () => {
    if (!text1.trim() && !text2.trim()) {
      return;
    }

    const segments = diffMode === 'line' 
      ? computeDiff(text1, text2)
      : computeInlineDiff(text1, text2);
    
    setDiffSegments(segments);
    
    const diffStats = getDiffStats(text1, text2);
    setStats(diffStats);
  };

  const handleClear = () => {
    setText1('');
    setText2('');
    setDiffSegments([]);
    setStats(null);
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, textArea: 1 | 2) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (textArea === 1) {
        setText1(content);
      } else {
        setText2(content);
      }
      setDiffSegments([]);
      setStats(null);
    };
    reader.onerror = () => {
      console.error('Failed to read file');
    };
    reader.readAsText(file);
    
    if (e.target) {
      e.target.value = '';
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Text Diff
          </h1>
          <p className="text-muted-foreground">
            Compare two texts and find differences. All processing happens locally in your browser.
          </p>
        </div>

        {/* Diff Mode Selector */}
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Diff Mode:</label>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setDiffMode('line');
                  setDiffSegments([]);
                  setStats(null);
                }}
                className={`px-4 py-2 rounded-lg border-2 transition-all ${
                  diffMode === 'line'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-background text-muted-foreground hover:border-primary/50'
                }`}
              >
                Line-based
              </button>
              <button
                onClick={() => {
                  setDiffMode('inline');
                  setDiffSegments([]);
                  setStats(null);
                }}
                className={`px-4 py-2 rounded-lg border-2 transition-all ${
                  diffMode === 'inline'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-background text-muted-foreground hover:border-primary/50'
                }`}
              >
                Character-based
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Similarity</p>
              <p className="text-sm font-semibold">{(stats.similarity * 100).toFixed(1)}%</p>
            </div>
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Lines Added</p>
              <p className="text-sm font-semibold text-emerald-500">{stats.linesAdded}</p>
            </div>
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Lines Removed</p>
              <p className="text-sm font-semibold text-destructive">{stats.linesRemoved}</p>
            </div>
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Unchanged</p>
              <p className="text-sm font-semibold">{stats.linesUnchanged}</p>
            </div>
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Chars Added</p>
              <p className="text-sm font-semibold text-emerald-500">{stats.charactersAdded}</p>
            </div>
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Chars Removed</p>
              <p className="text-sm font-semibold text-destructive">{stats.charactersRemoved}</p>
            </div>
          </div>
        )}

        {/* Input Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Text 1 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <IconFileText className="w-5 h-5 text-primary" />
                Text 1 (Original)
              </h2>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept=".txt,text/plain"
                  onChange={(e) => handleFileUpload(e, 1)}
                  className="hidden"
                  id="text1-file-upload"
                />
                <label
                  htmlFor="text1-file-upload"
                  className="p-2 hover:bg-muted rounded-lg transition-colors cursor-pointer"
                  title="Upload file"
                >
                  <IconFileText className="w-4 h-4" />
                </label>
                {text1 && (
                  <>
                    <button
                      onClick={() => handleCopy(text1)}
                      className="p-2 hover:bg-muted rounded-lg transition-colors"
                      title="Copy"
                    >
                      <IconCopy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDownload(text1, 'text1.txt')}
                      className="p-2 hover:bg-muted rounded-lg transition-colors"
                      title="Download"
                    >
                      <IconDownload className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
            <textarea
              ref={textarea1Ref}
              value={text1}
              onChange={(e) => {
                setText1(e.target.value);
                setDiffSegments([]);
                setStats(null);
              }}
              placeholder="Enter or paste the first text here..."
              className="w-full h-96 px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm resize-none"
              spellCheck={false}
            />
            {text1 && (
              <p className="text-xs text-muted-foreground">
                {text1.split('\n').length} lines, {formatBytes(new Blob([text1]).size)}
              </p>
            )}
          </div>

          {/* Text 2 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <IconFileText className="w-5 h-5 text-primary" />
                Text 2 (Modified)
              </h2>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept=".txt,text/plain"
                  onChange={(e) => handleFileUpload(e, 2)}
                  className="hidden"
                  id="text2-file-upload"
                />
                <label
                  htmlFor="text2-file-upload"
                  className="p-2 hover:bg-muted rounded-lg transition-colors cursor-pointer"
                  title="Upload file"
                >
                  <IconFileText className="w-4 h-4" />
                </label>
                {text2 && (
                  <>
                    <button
                      onClick={() => handleCopy(text2)}
                      className="p-2 hover:bg-muted rounded-lg transition-colors"
                      title="Copy"
                    >
                      <IconCopy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDownload(text2, 'text2.txt')}
                      className="p-2 hover:bg-muted rounded-lg transition-colors"
                      title="Download"
                    >
                      <IconDownload className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
            <textarea
              ref={textarea2Ref}
              value={text2}
              onChange={(e) => {
                setText2(e.target.value);
                setDiffSegments([]);
                setStats(null);
              }}
              placeholder="Enter or paste the second text here..."
              className="w-full h-96 px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm resize-none"
              spellCheck={false}
            />
            {text2 && (
              <p className="text-xs text-muted-foreground">
                {text2.split('\n').length} lines, {formatBytes(new Blob([text2]).size)}
              </p>
            )}
          </div>
        </div>

        {/* Compare Button */}
        <div className="flex justify-center">
          <button
            onClick={handleCompare}
            disabled={!text1.trim() && !text2.trim()}
            className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <IconGitCompare className="w-5 h-5" />
            Compare Texts
          </button>
        </div>

        {/* Diff Output */}
        {diffSegments.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <IconGitCompare className="w-5 h-5 text-primary" />
                Differences
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleClear}
                  className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
                >
                  <IconRefresh className="w-4 h-4" />
                  Clear
                </button>
              </div>
            </div>
            
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-4 overflow-auto max-h-[600px]">
              <div className="font-mono text-sm whitespace-pre-wrap">
                {diffSegments.map((segment, index) => {
                  if (segment.type === 'unchanged') {
                    return (
                      <span key={index} className="text-foreground">
                        {segment.text}
                        {diffMode === 'line' && '\n'}
                      </span>
                    );
                  } else if (segment.type === 'removed') {
                    return (
                      <span
                        key={index}
                        className="bg-destructive/20 text-destructive line-through"
                      >
                        {segment.text}
                        {diffMode === 'line' && '\n'}
                      </span>
                    );
                  } else {
                    return (
                      <span
                        key={index}
                        className="bg-emerald-500/20 text-emerald-600 font-semibold"
                      >
                        {segment.text}
                        {diffMode === 'line' && '\n'}
                      </span>
                    );
                  }
                })}
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-destructive/20 border border-destructive/50"></div>
                <span className="text-muted-foreground">Removed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-emerald-500/20 border border-emerald-500/50"></div>
                <span className="text-muted-foreground">Added</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-background border border-border"></div>
                <span className="text-muted-foreground">Unchanged</span>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
