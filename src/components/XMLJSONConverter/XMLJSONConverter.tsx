import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  IconCode,
  IconCheck,
  IconX,
  IconCopy,
  IconDownload,
  IconRefresh,
  IconFileText,
  IconArrowsExchange,
} from '@tabler/icons-react';
import { convertXMLToJSON, convertJSONToXML, formatXML, validateXML } from '../../utils/xmlJsonConverter';
import { formatJSON, validateJSON } from '../../utils/jsonFormatter';
import { Button } from '../ui/stateful-button';
import { useToast } from '../ui/toast';

type ConversionType = 'xml-to-json' | 'json-to-xml';

export const XMLJSONConverter = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [conversionType, setConversionType] = useState<ConversionType>('xml-to-json');
  const [validation, setValidation] = useState<{ valid: boolean; error?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [xmlIndent, setXmlIndent] = useState(2);
  const [jsonIndent, setJsonIndent] = useState(2);
  const [rootElement, setRootElement] = useState('root');
  const inputTextareaRef = useRef<HTMLTextAreaElement>(null);
  const outputTextareaRef = useRef<HTMLTextAreaElement>(null);
  const { showToast } = useToast();

  const handleConvert = () => {
    setError(null);
    setValidation(null);
    
    if (!input.trim()) {
      setError('Please enter content to convert');
      return;
    }

    try {
      if (conversionType === 'xml-to-json') {
        // Validate XML first
        const xmlValidation = validateXML(input);
        if (!xmlValidation.valid) {
          setValidation(xmlValidation);
          setError(xmlValidation.error || 'Invalid XML');
          setOutput('');
          return;
        }
        
        // Convert XML to JSON
        const json = convertXMLToJSON(input);
        // Format the JSON
        const formatted = formatJSON(json, jsonIndent);
        setOutput(formatted);
        setValidation({ valid: true });
      } else {
        // Validate JSON first
        const jsonValidation = validateJSON(input);
        if (!jsonValidation.valid) {
          setValidation(jsonValidation);
          setError(jsonValidation.error || 'Invalid JSON');
          setOutput('');
          return;
        }
        
        // Convert JSON to XML
        const xml = convertJSONToXML(input, rootElement);
        // Format the XML
        const formatted = formatXML(xml, xmlIndent);
        setOutput(formatted);
        setValidation({ valid: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to convert');
      setOutput('');
      setValidation({ valid: false, error: err instanceof Error ? err.message : 'Unknown error' });
    }
  };

  const handleFormat = () => {
    setError(null);
    setValidation(null);
    
    if (!input.trim()) {
      setError('Please enter content to format');
      return;
    }

    try {
      if (conversionType === 'xml-to-json') {
        const validation = validateXML(input);
        if (!validation.valid) {
          setValidation(validation);
          setError(validation.error || 'Invalid XML');
          return;
        }
        const formatted = formatXML(input, xmlIndent);
        setInput(formatted);
        setValidation({ valid: true });
      } else {
        const validation = validateJSON(input);
        if (!validation.valid) {
          setValidation(validation);
          setError(validation.error || 'Invalid JSON');
          return;
        }
        const formatted = formatJSON(input, jsonIndent);
        setInput(formatted);
        setValidation({ valid: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to format');
      setValidation({ valid: false, error: err instanceof Error ? err.message : 'Unknown error' });
    }
  };

  const handleValidate = () => {
    setError(null);
    
    if (!input.trim()) {
      setError('Please enter content to validate');
      setValidation(null);
      return;
    }

    const result = conversionType === 'xml-to-json' 
      ? validateXML(input)
      : validateJSON(input);
    
    setValidation(result);
    
    if (!result.valid) {
      setError(result.error || 'Invalid content');
    } else {
      setError(null);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => showToast('Copied to clipboard'));
  };

  const handleDownload = (text: string, filename: string) => {
    const blob = new Blob([text], { 
      type: conversionType === 'xml-to-json' ? 'application/json' : 'application/xml' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setValidation(null);
    setError(null);
  };

  const handleConversionTypeChange = (type: ConversionType) => {
    setConversionType(type);
    setInput('');
    setOutput('');
    setValidation(null);
    setError(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setInput(content);
      setError(null);
      setValidation(null);
      setOutput('');
    };
    reader.onerror = () => {
      setError('Failed to read file');
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
            XML ↔ JSON Converter
          </h1>
          <p className="text-muted-foreground">
            Convert, format, and validate XML and JSON. All processing happens locally in your browser.
          </p>
        </div>

        {/* Conversion Type Selector */}
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <IconArrowsExchange className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold">Conversion Type</h2>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => handleConversionTypeChange('xml-to-json')}
              className={`flex-1 px-6 py-3 rounded-xl border-2 transition-all cursor-pointer ${
                conversionType === 'xml-to-json'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-background text-muted-foreground hover:border-primary/50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <IconCode className="w-5 h-5" />
                <span className="font-semibold">XML → JSON</span>
              </div>
            </button>
            <button
              onClick={() => handleConversionTypeChange('json-to-xml')}
              className={`flex-1 px-6 py-3 rounded-xl border-2 transition-all cursor-pointer ${
                conversionType === 'json-to-xml'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-background text-muted-foreground hover:border-primary/50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <IconCode className="w-5 h-5" />
                <span className="font-semibold">JSON → XML</span>
              </div>
            </button>
          </div>
        </div>

        {/* File Upload */}
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-4">
          <div className="flex items-center gap-4">
            <input
              type="file"
              accept={conversionType === 'xml-to-json' ? '.xml,application/xml,text/xml' : '.json,application/json'}
              onChange={handleFileUpload}
              className="hidden"
              id="xml-json-file-upload"
            />
            <label
              htmlFor="xml-json-file-upload"
              className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg cursor-pointer transition-colors text-sm font-medium"
            >
              <IconFileText className="w-4 h-4" />
              Upload {conversionType === 'xml-to-json' ? 'XML' : 'JSON'} File
            </label>
            {input && (
              <button
                onClick={handleClear}
                className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors text-sm font-medium flex items-center gap-2 cursor-pointer"
              >
                <IconRefresh className="w-4 h-4" />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Validation Status */}
        {validation && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-xl border-2 ${
              validation.valid
                ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500'
                : 'bg-destructive/10 border-destructive/50 text-destructive'
            }`}
          >
            <div className="flex items-center gap-2">
              {validation.valid ? (
                <>
                  <IconCheck className="w-5 h-5" />
                  <span className="font-semibold">Valid {conversionType === 'xml-to-json' ? 'XML' : 'JSON'}</span>
                </>
              ) : (
                <>
                  <IconX className="w-5 h-5" />
                  <div className="flex-1">
                    <span className="font-semibold">Invalid {conversionType === 'xml-to-json' ? 'XML' : 'JSON'}</span>
                    {validation.error && (
                      <p className="text-sm mt-1 opacity-90">{validation.error}</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}

        {/* Error Message */}
        {error && !validation && (
          <div className="bg-destructive/10 border border-destructive/50 text-destructive px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <IconCode className="w-5 h-5 text-primary" />
                {conversionType === 'xml-to-json' ? 'XML' : 'JSON'} Input
              </h2>
              {input && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(input)}
                    className="p-2 hover:bg-muted rounded-lg transition-colors cursor-pointer"
                    title="Copy input"
                  >
                    <IconCopy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDownload(input, `input.${conversionType === 'xml-to-json' ? 'xml' : 'json'}`)}
                    className="p-2 hover:bg-muted rounded-lg transition-colors cursor-pointer"
                    title="Download input"
                  >
                    <IconDownload className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            <textarea
              ref={inputTextareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setValidation(null);
                setError(null);
                setOutput('');
              }}
              placeholder={`Paste your ${conversionType === 'xml-to-json' ? 'XML' : 'JSON'} here or upload a file...`}
              className="w-full h-96 px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm resize-none"
              spellCheck={false}
            />
          </div>

          {/* Output Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <IconCode className="w-5 h-5 text-primary" />
                {conversionType === 'xml-to-json' ? 'JSON' : 'XML'} Output
              </h2>
              {output && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(output)}
                    className="p-2 hover:bg-muted rounded-lg transition-colors cursor-pointer"
                    title="Copy output"
                  >
                    <IconCopy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDownload(output, `output.${conversionType === 'xml-to-json' ? 'json' : 'xml'}`)}
                    className="p-2 hover:bg-muted rounded-lg transition-colors cursor-pointer"
                    title="Download output"
                  >
                    <IconDownload className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            <textarea
              ref={outputTextareaRef}
              value={output}
              readOnly
              placeholder={`Converted ${conversionType === 'xml-to-json' ? 'JSON' : 'XML'} will appear here...`}
              className="w-full h-96 px-4 py-3 bg-muted/30 border border-border rounded-xl font-mono text-sm resize-none"
              spellCheck={false}
            />
          </div>
        </div>

        {/* Settings & Actions */}
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              {conversionType === 'xml-to-json' ? (
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium">JSON Indent:</label>
                  <input
                    type="number"
                    min="0"
                    max="8"
                    value={jsonIndent}
                    onChange={(e) => setJsonIndent(Math.max(0, Math.min(8, Number(e.target.value))))}
                    className="w-20 px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <span className="text-xs text-muted-foreground">spaces</span>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium">XML Indent:</label>
                  <input
                    type="number"
                    min="0"
                    max="8"
                    value={xmlIndent}
                    onChange={(e) => setXmlIndent(Math.max(0, Math.min(8, Number(e.target.value))))}
                    className="w-20 px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <span className="text-xs text-muted-foreground">spaces</span>
                </div>
              )}
              
              {conversionType === 'json-to-xml' && (
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium">Root Element:</label>
                  <input
                    type="text"
                    value={rootElement}
                    onChange={(e) => setRootElement(e.target.value || 'root')}
                    placeholder="root"
                    className="w-32 px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  />
                </div>
              )}
            </div>
            
            <div className="flex gap-3 flex-wrap">
              <Button onClick={handleConvert} disabled={!input.trim()}>
                <IconArrowsExchange className="w-4 h-4 mr-2" />
                Convert
              </Button>
              <Button onClick={handleFormat} disabled={!input.trim()}>
                <IconCode className="w-4 h-4 mr-2" />
                Format
              </Button>
              <Button onClick={handleValidate} disabled={!input.trim()}>
                {validation?.valid ? (
                  <IconCheck className="w-4 h-4 mr-2" />
                ) : (
                  <IconX className="w-4 h-4 mr-2" />
                )}
                Validate
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
