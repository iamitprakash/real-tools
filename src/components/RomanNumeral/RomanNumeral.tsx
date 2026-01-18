import { useState } from 'react';
import { motion } from 'framer-motion';
import { IconHash, IconCopy } from '@tabler/icons-react';
import { useToast } from '../ui/toast';

const romanValues: [number, string][] = [
  [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
  [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
  [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
];

export const RomanNumeral = () => {
  const [mode, setMode] = useState<'toRoman' | 'fromRoman'>('toRoman');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const { showToast } = useToast();

  const toRoman = (num: number): string => {
    if (num <= 0 || num > 3999) throw new Error('Number must be between 1 and 3999');
    let result = '';
    for (const [value, symbol] of romanValues) {
      while (num >= value) {
        result += symbol;
        num -= value;
      }
    }
    return result;
  };

  const fromRoman = (roman: string): number => {
    const upper = roman.toUpperCase();
    let result = 0;
    let i = 0;

    while (i < upper.length) {
      const twoChar = upper.substr(i, 2);
      const found = romanValues.find(([_, sym]) => sym === twoChar);
      if (found) {
        result += found[0];
        i += 2;
      } else {
        const oneChar = upper[i];
        const found = romanValues.find(([_, sym]) => sym === oneChar);
        if (found) {
          result += found[0];
          i += 1;
        } else {
          throw new Error('Invalid Roman numeral');
        }
      }
    }
    return result;
  };

  const handleConvert = () => {
    if (!input.trim()) {
      showToast('Please enter a value', 'error');
      return;
    }

    try {
      if (mode === 'toRoman') {
        const num = parseInt(input);
        if (isNaN(num)) throw new Error('Invalid number');
        setOutput(toRoman(num));
      } else {
        setOutput(fromRoman(input).toString());
      }
      showToast('Converted successfully');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Conversion failed', 'error');
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      showToast('Copied to clipboard');
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-2">
            <IconHash className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Roman Numeral Converter
          </h1>
          <p className="text-muted-foreground">Convert between Roman and Arabic numerals</p>
        </div>

        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 space-y-6">
          <div className="flex gap-4">
            <button
              onClick={() => {
                setMode('toRoman');
                setOutput('');
              }}
              className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all cursor-pointer ${
                mode === 'toRoman'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-background text-muted-foreground hover:border-primary/50'
              }`}
            >
              To Roman
            </button>
            <button
              onClick={() => {
                setMode('fromRoman');
                setOutput('');
              }}
              className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all cursor-pointer ${
                mode === 'fromRoman'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-background text-muted-foreground hover:border-primary/50'
              }`}
            >
              From Roman
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {mode === 'toRoman' ? 'Arabic Number (1-3999)' : 'Roman Numeral'}
            </label>
            <input
              type="text"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setOutput('');
              }}
              placeholder={mode === 'toRoman' ? '1234' : 'MCCXXXIV'}
              className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
            />
          </div>

          <button
            onClick={handleConvert}
            disabled={!input.trim()}
            className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Convert
          </button>

          {output && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Result</label>
                <button
                  onClick={() => handleCopy(output)}
                  className="p-1.5 hover:bg-muted rounded-lg transition-colors cursor-pointer"
                  title="Copy"
                >
                  <IconCopy className="w-4 h-4" />
                </button>
              </div>
              <div className="px-4 py-3 bg-muted/30 border border-border rounded-lg font-mono text-lg text-center">
                {output}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
