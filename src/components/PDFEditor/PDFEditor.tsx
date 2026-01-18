import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  IconUpload,
  IconDownload,
  IconTrash,
  IconFileText,
  IconPlus,
  IconX,
  IconCheck,
  IconRefresh,
  IconEye
} from '@tabler/icons-react';
import { combinePDFs, removePagesFromPDF, extractPagesFromPDF, getPDFPageCount, addTextToPDF, type TextAnnotation } from '../../utils/pdfEditor';
import { Button } from '../ui/stateful-button';
import { PDFPreview } from './PDFPreview';

interface PDFFile {
  file: File;
  id: string;
  pageCount: number;
  selectedPages: number[];
  textAnnotations?: TextAnnotation[];
}

export const PDFEditor = () => {
  const [pdfFiles, setPdfFiles] = useState<PDFFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'combine' | 'remove' | 'extract' | 'edit'>('combine');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingAnnotation, setEditingAnnotation] = useState<{
    fileId: string;
    annotation: Partial<TextAnnotation>;
  } | null>(null);
  const [previewFile, setPreviewFile] = useState<PDFFile | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles: PDFFile[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type === 'application/pdf') {
        try {
          const pageCount = await getPDFPageCount(file);
          newFiles.push({
            file,
            id: `pdf_${Date.now()}_${i}`,
            pageCount,
            selectedPages: [],
            textAnnotations: []
          });
        } catch (error) {
          console.error(`Failed to load PDF ${file.name}:`, error);
          alert(`Failed to load PDF: ${file.name}`);
        }
      }
    }

    setPdfFiles([...pdfFiles, ...newFiles]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (id: string) => {
    setPdfFiles(pdfFiles.filter(f => f.id !== id));
  };

  const togglePageSelection = (fileId: string, pageNum: number) => {
    setPdfFiles(pdfFiles.map(f => {
      if (f.id === fileId) {
        const selected = f.selectedPages.includes(pageNum);
        return {
          ...f,
          selectedPages: selected
            ? f.selectedPages.filter(p => p !== pageNum)
            : [...f.selectedPages, pageNum].sort((a, b) => a - b)
        };
      }
      return f;
    }));
  };

  const selectAllPages = (fileId: string) => {
    setPdfFiles(pdfFiles.map(f => {
      if (f.id === fileId) {
        return {
          ...f,
          selectedPages: Array.from({ length: f.pageCount }, (_, i) => i + 1)
        };
      }
      return f;
    }));
  };

  const clearSelection = (fileId: string) => {
    setPdfFiles(pdfFiles.map(f => {
      if (f.id === fileId) {
        return { ...f, selectedPages: [] };
      }
      return f;
    }));
  };

  const handleCombine = async () => {
    if (pdfFiles.length < 2) {
      alert('Please upload at least 2 PDF files to combine');
      return;
    }

    setLoading(true);
    try {
      const files = pdfFiles.map(f => f.file);
      const combinedBlob = await combinePDFs(files);
      const url = URL.createObjectURL(combinedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'combined.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to combine PDFs', error);
      alert('Failed to combine PDFs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePages = async () => {
    if (pdfFiles.length === 0) {
      alert('Please upload a PDF file');
      return;
    }

    const fileToProcess = pdfFiles[0];
    if (fileToProcess.selectedPages.length === 0) {
      alert('Please select pages to remove');
      return;
    }

    setLoading(true);
    try {
      const resultBlob = await removePagesFromPDF(fileToProcess.file, fileToProcess.selectedPages);
      const url = URL.createObjectURL(resultBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileToProcess.file.name.replace('.pdf', '_edited.pdf');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to remove pages', error);
      alert('Failed to remove pages. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExtractPages = async () => {
    if (pdfFiles.length === 0) {
      alert('Please upload a PDF file');
      return;
    }

    const fileToProcess = pdfFiles[0];
    if (fileToProcess.selectedPages.length === 0) {
      alert('Please select pages to extract');
      return;
    }

    setLoading(true);
    try {
      const resultBlob = await extractPagesFromPDF(fileToProcess.file, fileToProcess.selectedPages);
      const url = URL.createObjectURL(resultBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileToProcess.file.name.replace('.pdf', '_extracted.pdf');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to extract pages', error);
      alert('Failed to extract pages. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditText = async () => {
    if (pdfFiles.length === 0) {
      alert('Please upload a PDF file');
      return;
    }

    const fileToProcess = pdfFiles[0];
    if (!fileToProcess.textAnnotations || fileToProcess.textAnnotations.length === 0) {
      alert('Please add at least one text annotation');
      return;
    }

    setLoading(true);
    try {
      const resultBlob = await addTextToPDF(fileToProcess.file, fileToProcess.textAnnotations);
      const url = URL.createObjectURL(resultBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileToProcess.file.name.replace('.pdf', '_edited.pdf');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to edit PDF', error);
      alert('Failed to edit PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const addTextAnnotation = (fileId: string) => {
    const pdfFile = pdfFiles.find(f => f.id === fileId);
    if (!pdfFile) return;

    setEditingAnnotation({
      fileId,
      annotation: {
        page: 1,
        text: '',
        x: 50,
        y: 50,
        fontSize: 12,
        color: { r: 0, g: 0, b: 0 }
      }
    });
  };

  const saveTextAnnotation = () => {
    if (!editingAnnotation || !editingAnnotation.annotation.text || !editingAnnotation.annotation.page) {
      alert('Please fill in all required fields');
      return;
    }

    setPdfFiles(pdfFiles.map(f => {
      if (f.id === editingAnnotation.fileId) {
        const annotations = f.textAnnotations || [];
        return {
          ...f,
          textAnnotations: [...annotations, editingAnnotation.annotation as TextAnnotation]
        };
      }
      return f;
    }));

    setEditingAnnotation(null);
  };

  const removeTextAnnotation = (fileId: string, index: number) => {
    setPdfFiles(pdfFiles.map(f => {
      if (f.id === fileId) {
        const annotations = f.textAnnotations || [];
        return {
          ...f,
          textAnnotations: annotations.filter((_, i) => i !== index)
        };
      }
      return f;
    }));
  };

  const reset = () => {
    setPdfFiles([]);
    setMode('combine');
    setEditingAnnotation(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="w-full max-w-6xl mx-auto"
    >
      <div className="glass-panel p-8">
        {/* Mode Selection */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-foreground mb-4">PDF Editor</h3>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => setMode('combine')}
              className={`px-4 py-2 rounded-xl font-semibold transition-all cursor-pointer ${
                mode === 'combine'
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                  : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
              }`}
            >
              Combine PDFs
            </button>
            <button
              onClick={() => setMode('remove')}
              className={`px-4 py-2 rounded-xl font-semibold transition-all cursor-pointer ${
                mode === 'remove'
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                  : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
              }`}
            >
              Remove Pages
            </button>
            <button
              onClick={() => setMode('extract')}
              className={`px-4 py-2 rounded-xl font-semibold transition-all cursor-pointer ${
                mode === 'extract'
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                  : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
              }`}
            >
              Extract Pages
            </button>
            <button
              onClick={() => setMode('edit')}
              className={`px-4 py-2 rounded-xl font-semibold transition-all cursor-pointer ${
                mode === 'edit'
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                  : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
              }`}
            >
              Edit Text
            </button>
          </div>
        </div>

        {/* File Upload */}
        <div className="mb-6">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            multiple={mode === 'combine'}
            onChange={handleFileSelect}
            className="hidden"
            id="pdf-upload-input"
          />
          <label
            htmlFor="pdf-upload-input"
            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border/50 rounded-2xl cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
          >
            <IconUpload className="w-8 h-8 text-muted-foreground mb-2" />
            <span className="text-sm font-semibold text-foreground">
              {mode === 'combine' ? 'Upload PDFs to Combine' : 'Upload PDF to Edit'}
            </span>
            <span className="text-xs text-muted-foreground mt-1">
              {mode === 'combine' ? 'Select multiple PDF files' : 'Select a PDF file'}
            </span>
          </label>
        </div>

        {/* File List */}
        {pdfFiles.length > 0 && (
          <div className="space-y-4 mb-6">
            {pdfFiles.map((pdfFile) => (
              <div
                key={pdfFile.id}
                className="p-4 rounded-xl bg-secondary/30 border border-border/50"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3 flex-1">
                    <IconFileText className="w-5 h-5 text-primary mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">{pdfFile.file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {pdfFile.pageCount} {pdfFile.pageCount === 1 ? 'page' : 'pages'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {(mode === 'remove' || mode === 'extract' || mode === 'edit') && (
                      <button
                        onClick={() => setPreviewFile(pdfFile)}
                        className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all cursor-pointer"
                        title="Preview PDF"
                      >
                        <IconEye size={18} />
                      </button>
                    )}
                    <button
                      onClick={() => removeFile(pdfFile.id)}
                      className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer"
                    >
                      <IconTrash size={18} />
                    </button>
                  </div>
                </div>

                {/* Page Selection (for remove/extract modes) */}
                {(mode === 'remove' || mode === 'extract') && pdfFiles[0].id === pdfFile.id && (
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-foreground">
                        {mode === 'remove' ? 'Select pages to remove:' : 'Select pages to extract:'}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => selectAllPages(pdfFile.id)}
                          className="text-xs px-2 py-1 bg-secondary hover:bg-secondary/80 rounded text-foreground cursor-pointer"
                        >
                          Select All
                        </button>
                        <button
                          onClick={() => clearSelection(pdfFile.id)}
                          className="text-xs px-2 py-1 bg-secondary hover:bg-secondary/80 rounded text-foreground cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto custom-scrollbar">
                      {Array.from({ length: pdfFile.pageCount }, (_, i) => i + 1).map((pageNum) => {
                        const isSelected = pdfFile.selectedPages.includes(pageNum);
                        return (
                          <button
                            key={pageNum}
                            onClick={() => togglePageSelection(pdfFile.id, pageNum)}
                            className={`w-10 h-10 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-primary text-primary-foreground shadow-md'
                                : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    {pdfFile.selectedPages.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {pdfFile.selectedPages.length} {pdfFile.selectedPages.length === 1 ? 'page' : 'pages'} selected
                      </p>
                    )}
                  </div>
                )}

                {/* Text Editing (for edit mode) */}
                {mode === 'edit' && pdfFiles[0].id === pdfFile.id && (
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-foreground">Text Annotations:</span>
                      <button
                        onClick={() => addTextAnnotation(pdfFile.id)}
                        className="text-xs px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <IconPlus size={14} /> Add Text
                      </button>
                    </div>

                    {/* Text Annotation Form */}
                    {editingAnnotation && editingAnnotation.fileId === pdfFile.id && (
                      <div className="mb-4 p-4 bg-secondary/50 rounded-xl border border-border/50">
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="text-xs font-semibold text-foreground mb-1 block">Page Number</label>
                            <input
                              type="number"
                              min="1"
                              max={pdfFile.pageCount}
                              value={editingAnnotation.annotation.page || 1}
                              onChange={(e) => setEditingAnnotation({
                                ...editingAnnotation,
                                annotation: { ...editingAnnotation.annotation, page: parseInt(e.target.value) || 1 }
                              })}
                              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-foreground mb-1 block">Font Size</label>
                            <input
                              type="number"
                              min="8"
                              max="72"
                              value={editingAnnotation.annotation.fontSize || 12}
                              onChange={(e) => setEditingAnnotation({
                                ...editingAnnotation,
                                annotation: { ...editingAnnotation.annotation, fontSize: parseInt(e.target.value) || 12 }
                              })}
                              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-foreground mb-1 block">X Position</label>
                            <input
                              type="number"
                              min="0"
                              value={editingAnnotation.annotation.x || 50}
                              onChange={(e) => setEditingAnnotation({
                                ...editingAnnotation,
                                annotation: { ...editingAnnotation.annotation, x: parseInt(e.target.value) || 50 }
                              })}
                              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-foreground mb-1 block">Y Position</label>
                            <input
                              type="number"
                              min="0"
                              value={editingAnnotation.annotation.y || 50}
                              onChange={(e) => setEditingAnnotation({
                                ...editingAnnotation,
                                annotation: { ...editingAnnotation.annotation, y: parseInt(e.target.value) || 50 }
                              })}
                              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm"
                            />
                          </div>
                        </div>
                        <div className="mb-3">
                          <label className="text-xs font-semibold text-foreground mb-1 block">Text Content</label>
                          <textarea
                            value={editingAnnotation.annotation.text || ''}
                            onChange={(e) => setEditingAnnotation({
                              ...editingAnnotation,
                              annotation: { ...editingAnnotation.annotation, text: e.target.value }
                            })}
                            placeholder="Enter text to add to PDF"
                            className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm min-h-[80px]"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={saveTextAnnotation}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <IconCheck size={16} /> Save
                          </button>
                          <button
                            onClick={() => setEditingAnnotation(null)}
                            className="px-4 py-2 bg-secondary text-foreground rounded-lg text-sm font-semibold hover:bg-secondary/80 transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <IconX size={16} /> Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* List of Text Annotations */}
                    {pdfFile.textAnnotations && pdfFile.textAnnotations.length > 0 && (
                      <div className="space-y-2">
                        {pdfFile.textAnnotations.map((annotation, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-foreground">{annotation.text}</p>
                              <p className="text-xs text-muted-foreground">
                                Page {annotation.page} • Position: ({annotation.x}, {annotation.y}) • Size: {annotation.fontSize}pt
                              </p>
                            </div>
                            <button
                              onClick={() => removeTextAnnotation(pdfFile.id, index)}
                              className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer"
                            >
                              <IconTrash size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        {pdfFiles.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3">
            {mode === 'combine' && (
              <Button
                onClick={handleCombine}
                disabled={loading || pdfFiles.length < 2}
                className="flex-1 py-4"
              >
                {loading ? (
                  <>
                    <IconRefresh className="mr-2 w-5 h-5 animate-spin" /> Combining...
                  </>
                ) : (
                  <>
                    <IconDownload className="mr-2 w-5 h-5" /> Combine & Download
                  </>
                )}
              </Button>
            )}
            {mode === 'remove' && (
              <Button
                onClick={handleRemovePages}
                disabled={loading || pdfFiles[0]?.selectedPages.length === 0}
                className="flex-1 py-4"
              >
                {loading ? (
                  <>
                    <IconRefresh className="mr-2 w-5 h-5 animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    <IconDownload className="mr-2 w-5 h-5" /> Remove Pages & Download
                  </>
                )}
              </Button>
            )}
            {mode === 'extract' && (
              <Button
                onClick={handleExtractPages}
                disabled={loading || pdfFiles[0]?.selectedPages.length === 0}
                className="flex-1 py-4"
              >
                {loading ? (
                  <>
                    <IconRefresh className="mr-2 w-5 h-5 animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    <IconDownload className="mr-2 w-5 h-5" /> Extract Pages & Download
                  </>
                )}
              </Button>
            )}
            {mode === 'edit' && (
              <Button
                onClick={handleEditText}
                disabled={loading || !pdfFiles[0]?.textAnnotations || pdfFiles[0].textAnnotations.length === 0}
                className="flex-1 py-4"
              >
                {loading ? (
                  <>
                    <IconRefresh className="mr-2 w-5 h-5 animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    <IconDownload className="mr-2 w-5 h-5" /> Save & Download Edited PDF
                  </>
                )}
              </Button>
            )}
            <button
              onClick={reset}
              className="px-6 py-4 bg-muted/50 text-foreground font-semibold rounded-xl hover:bg-muted/80 transition-all border border-transparent hover:border-border"
            >
              <IconRefresh size={18} className="inline mr-2" /> Reset
            </button>
          </div>
        )}

        {/* Instructions */}
        {pdfFiles.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">
              {mode === 'combine' && 'Upload multiple PDF files to combine them into one'}
              {mode === 'remove' && 'Upload a PDF file and select pages to remove'}
              {mode === 'extract' && 'Upload a PDF file and select pages to extract into a new PDF'}
              {mode === 'edit' && 'Upload a PDF file and add text annotations to edit it'}
            </p>
          </div>
        )}
      </div>

      {/* PDF Preview Modal */}
      {previewFile && (
        <PDFPreview
          file={previewFile.file}
          mode={mode}
          selectedPages={previewFile.selectedPages}
          textAnnotations={previewFile.textAnnotations || []}
          onPageSelect={(pageNum) => {
            togglePageSelection(previewFile.id, pageNum);
            setPreviewFile({
              ...previewFile,
              selectedPages: previewFile.selectedPages.includes(pageNum)
                ? previewFile.selectedPages.filter(p => p !== pageNum)
                : [...previewFile.selectedPages, pageNum].sort((a, b) => a - b)
            });
          }}
          onTextEdit={(page, x, y, text) => {
            if (text) {
              const newAnnotation: TextAnnotation = {
                page,
                text,
                x,
                y,
                fontSize: 12
              };
              setPdfFiles(pdfFiles.map(f => {
                if (f.id === previewFile.id) {
                  return {
                    ...f,
                    textAnnotations: [...(f.textAnnotations || []), newAnnotation]
                  };
                }
                return f;
              }));
              setPreviewFile({
                ...previewFile,
                textAnnotations: [...(previewFile.textAnnotations || []), newAnnotation]
              });
            }
          }}
          onTextDelete={(index) => {
            removeTextAnnotation(previewFile.id, index);
            setPreviewFile({
              ...previewFile,
              textAnnotations: (previewFile.textAnnotations || []).filter((_, i) => i !== index)
            });
          }}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </motion.div>
  );
};
