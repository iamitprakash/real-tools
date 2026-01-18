import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  IconCopy,
  IconRefresh,
  IconCheck,
} from '@tabler/icons-react';
import { generateUUID, validateUUID, type UUIDVersion } from '../../utils/uuidGenerator';

export const UUIDGenerator = () => {
  const [version, setVersion] = useState<UUIDVersion>('v4');
  const [uuids, setUuids] = useState<string[]>([]);
  const [count, setCount] = useState(1);
  const [validationInput, setValidationInput] = useState('');
  const [isValid, setIsValid] = useState<boolean | null>(null);

  const handleGenerate = () => {
    const newUuids: string[] = [];
    for (let i = 0; i < count; i++) {
      newUuids.push(generateUUID(version));
    }
    setUuids(newUuids);
  };

  const handleValidate = () => {
    if (!validationInput.trim()) {
      setIsValid(null);
      return;
    }
    setIsValid(validateUUID(validationInput));
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleCopyAll = () => {
    navigator.clipboard.writeText(uuids.join('\n'));
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
            UUID Generator
          </h1>
          <p className="text-muted-foreground">
            Generate and validate UUIDs. All processing happens locally in your browser.
          </p>
        </div>

        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Version</label>
            <div className="flex gap-3">
              <button
                onClick={() => setVersion('v4')}
                className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                  version === 'v4'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                UUID v4 (Random)
              </button>
              <button
                onClick={() => setVersion('v1')}
                className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                  version === 'v1'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                UUID v1 (Time-based)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Count</label>
            <input
              type="number"
              min="1"
              max="100"
              value={count}
              onChange={(e) => setCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
              className="w-full px-4 py-2 bg-background border border-border rounded-xl"
            />
          </div>

          <button
            onClick={handleGenerate}
            className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2"
          >
            <IconRefresh className="w-5 h-5" />
            Generate UUID{count > 1 ? 's' : ''}
          </button>
        </div>

        {uuids.length > 0 && (
          <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Generated UUID{uuids.length > 1 ? 's' : ''}</h2>
              <button
                onClick={handleCopyAll}
                className="px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-lg transition-colors flex items-center gap-2 text-sm"
              >
                <IconCopy className="w-4 h-4" />
                Copy All
              </button>
            </div>
            <div className="space-y-2">
              {uuids.map((uuid, index) => (
                <div key={index} className="flex items-center gap-3 bg-background border border-border rounded-lg p-3">
                  <code className="flex-1 font-mono text-sm">{uuid}</code>
                  <button
                    onClick={() => handleCopy(uuid)}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                    title="Copy"
                  >
                    <IconCopy className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold">UUID Validator</h2>
          <div className="space-y-3">
            <input
              type="text"
              value={validationInput}
              onChange={(e) => {
                setValidationInput(e.target.value);
                setIsValid(null);
              }}
              onBlur={handleValidate}
              placeholder="Enter UUID to validate..."
              className="w-full px-4 py-3 bg-background border border-border rounded-xl font-mono text-sm"
            />
            <button
              onClick={handleValidate}
              className="w-full px-6 py-3 bg-muted hover:bg-muted/80 rounded-xl font-semibold transition-all"
            >
              Validate UUID
            </button>
            {isValid !== null && (
              <div className={`rounded-xl p-4 flex items-center gap-3 ${
                isValid
                  ? 'bg-emerald-500/10 border border-emerald-500/50 text-emerald-600'
                  : 'bg-destructive/10 border border-destructive/50 text-destructive'
              }`}>
                <IconCheck className="w-5 h-5" />
                <span className="font-semibold">
                  {isValid ? 'Valid UUID' : 'Invalid UUID'}
                </span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
