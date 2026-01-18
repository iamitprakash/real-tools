import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  IconCopy,
  IconRefresh,
  IconCheck,
  IconX,
} from '@tabler/icons-react';
import { generatePassword, calculatePasswordStrength, type PasswordOptions } from '../../utils/passwordGenerator';

export const PasswordGenerator = () => {
  const [password, setPassword] = useState('');
  const [options, setOptions] = useState<PasswordOptions>({
    length: 16,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
    excludeSimilar: false,
    excludeAmbiguous: false,
  });
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = () => {
    try {
      setError('');
      const newPassword = generatePassword(options);
      setPassword(newPassword);
      setCopied(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate password');
    }
  };

  const handleCopy = () => {
    if (password) {
      navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const strength = password ? calculatePasswordStrength(password) : null;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Password Generator
          </h1>
          <p className="text-muted-foreground">
            Generate secure, random passwords. All processing happens locally in your browser.
          </p>
        </div>

        {/* Options */}
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Length: {options.length}
            </label>
            <input
              type="range"
              min="4"
              max="128"
              value={options.length}
              onChange={(e) => setOptions({ ...options, length: parseInt(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>4</span>
              <span>128</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={options.includeUppercase}
                onChange={(e) => setOptions({ ...options, includeUppercase: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm">Uppercase (A-Z)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={options.includeLowercase}
                onChange={(e) => setOptions({ ...options, includeLowercase: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm">Lowercase (a-z)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={options.includeNumbers}
                onChange={(e) => setOptions({ ...options, includeNumbers: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm">Numbers (0-9)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={options.includeSymbols}
                onChange={(e) => setOptions({ ...options, includeSymbols: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm">Symbols (!@#...)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={options.excludeSimilar}
                onChange={(e) => setOptions({ ...options, excludeSimilar: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm">Exclude Similar</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={options.excludeAmbiguous}
                onChange={(e) => setOptions({ ...options, excludeAmbiguous: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm">Exclude Ambiguous</span>
            </label>
          </div>
        </div>

        {/* Generate Button */}
        <div className="flex justify-center">
          <button
            onClick={handleGenerate}
            className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 transition-all flex items-center gap-2"
          >
            <IconRefresh className="w-5 h-5" />
            Generate Password
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/50 text-destructive rounded-xl p-4 text-sm">
            {error}
          </div>
        )}

        {/* Password Display */}
        {password && (
          <div className="space-y-4">
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={password}
                  readOnly
                  className="flex-1 bg-transparent border-none outline-none font-mono text-lg"
                />
                <button
                  onClick={handleCopy}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                  title="Copy"
                >
                  {copied ? (
                    <IconCheck className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <IconCopy className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Strength Indicator */}
            {strength && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Strength:</span>
                  <span className={`font-semibold ${
                    strength.label === 'Weak' ? 'text-destructive' :
                    strength.label === 'Fair' ? 'text-orange-500' :
                    strength.label === 'Good' ? 'text-yellow-500' :
                    'text-emerald-500'
                  }`}>
                    {strength.label}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      strength.score <= 2 ? 'bg-destructive' :
                      strength.score <= 4 ? 'bg-orange-500' :
                      strength.score <= 6 ? 'bg-yellow-500' :
                      'bg-emerald-500'
                    }`}
                    style={{ width: `${(strength.score / 8) * 100}%` }}
                  />
                </div>
                {strength.feedback.length > 0 && (
                  <div className="text-xs text-muted-foreground space-y-1">
                    {strength.feedback.map((msg, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <IconX className="w-3 h-3" />
                        {msg}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};
