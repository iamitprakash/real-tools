import { useState, useEffect, useRef } from 'react';
import { IconChevronLeft, IconChevronRight, IconX, IconTrash } from '@tabler/icons-react';
import * as pdfjsLib from 'pdfjs-dist';

// Set up pdf.js worker - initialize on component mount to ensure window is available
let workerInitialized = false;

const initializeWorker = () => {
  if (typeof window !== 'undefined' && !workerInitialized) {
    // Try local worker first (from public folder)
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
    workerInitialized = true;
  }
};

interface PDFPreviewProps {
  file: File;
  mode: 'combine' | 'remove' | 'extract' | 'edit';
  selectedPages?: number[];
  textAnnotations?: any[];
  onPageSelect?: (pageNum: number) => void;
  onTextEdit?: (pageNum: number, x: number, y: number, text?: string) => void;
  onTextDelete?: (index: number) => void;
  onClose?: () => void;
}

export const PDFPreview = ({
  file,
  mode,
  selectedPages = [],
  textAnnotations = [],
  onPageSelect,
  onTextEdit,
  onTextDelete,
  onClose
}: PDFPreviewProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [editingText, setEditingText] = useState<{ page: number; x: number; y: number; text: string; index?: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pdfDocRef = useRef<any>(null);

  useEffect(() => {
    initializeWorker();
    loadPDF();
  }, [file]);

  useEffect(() => {
    // Only render if PDF is loaded, we have pages, canvas is mounted, and current page is valid
    if (totalPages > 0 && currentPage >= 1 && currentPage <= totalPages && pdfDocRef.current && canvasRef.current) {
      // Small delay to ensure canvas is fully mounted
      const timer = setTimeout(() => {
        if (canvasRef.current) {
          renderPage();
        }
      }, 50);
      
      return () => clearTimeout(timer);
    }
  }, [currentPage, totalPages, file]);

  const loadPDF = async () => {
    setLoading(true);
    try {
      // Ensure worker is set up
      if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
      }
      
      const arrayBuffer = await file.arrayBuffer();
      
      const loadingTask = pdfjsLib.getDocument({ 
        data: arrayBuffer,
        verbosity: 0,
        useSystemFonts: true,
        isEvalSupported: false // Disable eval for security
      });
      const pdf = await loadingTask.promise;
      pdfDocRef.current = pdf; // Cache the PDF document
      setTotalPages(pdf.numPages);
      setCurrentPage(1); // Reset to first page
    } catch (error) {
      console.error('Failed to load PDF:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Full error details:', error);
      
      // Try alternative worker source if worker error
      if (errorMessage.includes('worker') || errorMessage.includes('Failed to fetch')) {
        // Try CDN as fallback
        const version = pdfjsLib.version || '5.4.530';
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
        
        // Retry once with CDN worker
        try {
          const arrayBuffer = await file.arrayBuffer();
          const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer, verbosity: 0 });
          const pdf = await loadingTask.promise;
          pdfDocRef.current = pdf;
          setTotalPages(pdf.numPages);
          setCurrentPage(1);
          return;
        } catch (retryError) {
          console.error('Retry with CDN also failed:', retryError);
          alert('PDF.js worker failed to load from both local and CDN sources. Please refresh the page or check your internet connection.');
        }
      } else {
        alert(`Failed to load PDF: ${errorMessage}\n\nPlease ensure the file is a valid PDF.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const renderPage = async () => {
    // Check canvas exists
    const canvas = canvasRef.current;
    if (!canvas) {
      console.warn('Canvas ref is not available yet');
      return;
    }
    
    if (!file || totalPages === 0) {
      return;
    }
    
    // Validate page number
    if (currentPage < 1 || currentPage > totalPages) {
      console.warn(`Invalid page number: ${currentPage}, total pages: ${totalPages}`);
      return;
    }
    
    setLoading(true);
    try {
      // Use cached PDF document if available, otherwise load it
      let pdf = pdfDocRef.current;
      if (!pdf) {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ 
          data: arrayBuffer,
          verbosity: 0
        });
        pdf = await loadingTask.promise;
        pdfDocRef.current = pdf;
      }
      
      // Validate PDF is loaded
      if (!pdf || pdf.numPages === 0) {
        console.error('PDF document is not loaded or has no pages');
        setLoading(false);
        return;
      }
      
      // pdf.js uses 0-indexed pages, so subtract 1
      const pageIndex = currentPage - 1;
      
      // Double-check page index is valid
      if (pageIndex < 0 || pageIndex >= pdf.numPages) {
        console.error(`Invalid page index: ${pageIndex}, total pages: ${pdf.numPages}, currentPage: ${currentPage}`);
        setLoading(false);
        return;
      }
      
      const page = await pdf.getPage(pageIndex);
      
      // Re-check canvas (might have been unmounted)
      if (!canvasRef.current) {
        console.warn('Canvas was unmounted during render');
        setLoading(false);
        return;
      }
      
      // Calculate scale to fit container (max width 595px for A4)
      const containerWidth = 595;
      const viewport = page.getViewport({ scale: 1.0 });
      const scale = Math.min(containerWidth / viewport.width, 2.0); // Max 2x scale
      const scaledViewport = page.getViewport({ scale });
      
      const context = canvasRef.current.getContext('2d');
      
      if (!context) {
        console.error('Failed to get canvas context');
        setLoading(false);
        return;
      }
      
      // Set canvas size (use the current canvas reference)
      const currentCanvas = canvasRef.current;
      if (!currentCanvas) {
        console.warn('Canvas disappeared during render');
        setLoading(false);
        return;
      }
      
      currentCanvas.height = scaledViewport.height;
      currentCanvas.width = scaledViewport.width;
      
      // Clear canvas
      context.clearRect(0, 0, currentCanvas.width, currentCanvas.height);
      
      // Fill white background
      context.fillStyle = 'white';
      context.fillRect(0, 0, currentCanvas.width, currentCanvas.height);
      
      const renderContext = {
        canvasContext: context,
        viewport: scaledViewport,
      };
      
      await page.render(renderContext).promise;
    } catch (error) {
      console.error('Failed to render PDF page:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (!errorMessage.includes('Invalid page')) {
        alert(`Failed to render PDF page: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (mode !== 'edit' || !onTextEdit) return;
    
    // Get coordinates relative to canvas
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    // Check if clicking on existing annotation (use screen coordinates for hit test)
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    
    const clickedAnnotation = textAnnotations.find((ann) => {
      if (ann.page === currentPage) {
        // Convert annotation coordinates to screen coordinates
        const annScreenX = (ann.x / canvas.width) * rect.width;
        const annScreenY = (ann.y / canvas.height) * rect.height;
        // Simple hit test
        const distance = Math.sqrt(
          Math.pow(annScreenX - screenX, 2) + Math.pow(annScreenY - screenY, 2)
        );
        return distance < 50; // 50px threshold
      }
      return false;
    });
    
    if (clickedAnnotation) {
      const index = textAnnotations.findIndex(ann => ann === clickedAnnotation);
      setEditingText({
        page: currentPage,
        x: clickedAnnotation.x,
        y: clickedAnnotation.y,
        text: clickedAnnotation.text,
        index
      });
    } else {
      // Add new text - use PDF coordinates
      setEditingText({
        page: currentPage,
        x,
        y,
        text: ''
      });
    }
  };

  const saveTextEdit = () => {
    if (!editingText || !onTextEdit) return;
    
    if (editingText.index !== undefined && onTextDelete) {
      // Editing existing - delete old, add new
      onTextDelete(editingText.index);
    }
    
    onTextEdit(
      editingText.page,
      editingText.x,
      editingText.y,
      editingText.text
    );
    
    setEditingText(null);
  };


  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-bold text-foreground">{file.name}</h3>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-secondary rounded-lg transition-colors cursor-pointer"
            >
              <IconX size={20} />
            </button>
          )}
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 overflow-auto p-4 bg-zinc-100">
          <div
            ref={containerRef}
            className="relative mx-auto bg-white shadow-lg inline-block"
            onClick={handleCanvasClick}
          >
            <div className="relative">
              {/* Canvas for PDF rendering - always render it */}
              <canvas
                ref={canvasRef}
                className="block"
                style={{ maxWidth: '100%', height: 'auto', display: loading ? 'none' : 'block' }}
              />
              
              {/* Loading overlay */}
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white" style={{ minHeight: '842px' }}>
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading PDF...</p>
                  </div>
                </div>
              )}
              
              {!loading && (
                <>
                
                {/* Text annotations overlay */}
                {mode === 'edit' && textAnnotations
                  .filter(ann => ann.page === currentPage)
                  .map((annotation, idx) => {
                    const globalIdx = textAnnotations.findIndex(a => a === annotation);
                    return (
                      <div
                        key={idx}
                        className="absolute bg-yellow-200/50 border-2 border-yellow-400 rounded px-2 py-1 cursor-pointer hover:bg-yellow-300/50 z-10"
                        style={{
                          left: `${annotation.x}px`,
                          top: `${annotation.y}px`,
                          fontSize: `${annotation.fontSize || 12}pt`
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingText({
                            page: annotation.page,
                            x: annotation.x,
                            y: annotation.y,
                            text: annotation.text,
                            index: globalIdx
                          });
                        }}
                      >
                        {annotation.text}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onTextDelete) onTextDelete(globalIdx);
                      }}
                      className="ml-2 text-red-600 hover:text-red-800 cursor-pointer"
                    >
                      <IconTrash size={14} />
                    </button>
                      </div>
                    );
                  })}
                
                {/* Page selection overlay for remove/extract modes */}
                {(mode === 'remove' || mode === 'extract') && (
                  <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg z-10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPageSelect?.(currentPage);
                      }}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all cursor-pointer ${
                        selectedPages.includes(currentPage)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-foreground hover:bg-secondary/80'
                      }`}
                    >
                      {selectedPages.includes(currentPage) ? 'Selected' : 'Select Page'}
                    </button>
                  </div>
                )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between p-4 border-t border-border bg-white">
          <button
            onClick={prevPage}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-secondary text-foreground rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary/80 transition-all flex items-center gap-2 cursor-pointer"
          >
            <IconChevronLeft size={20} /> Previous
          </button>
          
          <div className="flex gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`w-10 h-10 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                  currentPage === pageNum
                    ? 'bg-primary text-primary-foreground'
                    : selectedPages.includes(pageNum)
                    ? 'bg-primary/30 text-primary'
                    : 'bg-secondary text-foreground hover:bg-secondary/80'
                }`}
              >
                {pageNum}
              </button>
            ))}
          </div>
          
          <button
            onClick={nextPage}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-secondary text-foreground rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary/80 transition-all flex items-center gap-2 cursor-pointer"
          >
            Next <IconChevronRight size={20} />
          </button>
        </div>

        {/* Text Edit Modal */}
        {editingText && mode === 'edit' && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <h4 className="text-lg font-bold mb-4">Edit Text</h4>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-foreground mb-1 block">Text Content</label>
                  <textarea
                    value={editingText.text}
                    onChange={(e) => setEditingText({ ...editingText, text: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border"
                    rows={3}
                    autoFocus
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-1 block">X: {editingText.x}</label>
                    <input
                      type="number"
                      value={editingText.x}
                      onChange={(e) => setEditingText({ ...editingText, x: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-1 block">Y: {editingText.y}</label>
                    <input
                      type="number"
                      value={editingText.y}
                      onChange={(e) => setEditingText({ ...editingText, y: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={saveTextEdit}
                    className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 cursor-pointer"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      if (editingText.index !== undefined && onTextDelete) {
                        onTextDelete(editingText.index);
                      }
                      setEditingText(null);
                    }}
                    className="px-4 py-2 bg-secondary text-foreground rounded-lg font-semibold hover:bg-secondary/80 cursor-pointer"
                  >
                    {editingText.index !== undefined ? 'Delete' : 'Cancel'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
