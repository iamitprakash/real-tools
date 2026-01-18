import { useState, useRef, useEffect } from 'react';
import Draggable, { type DraggableData, type DraggableEvent } from 'react-draggable';
import { motion } from 'framer-motion';
import { Type, CheckSquare, Trash2, Download, Plus, AlignLeft, CircleDot, ChevronDown, PenTool, List, ListOrdered, Lock } from 'lucide-react';
import { generateFormPDF, makePDFReadonly, type FormField } from '../../utils/pdfFormGenerator';

const DraggableFieldItem = ({ 
  field, 
  onDragStop, 
  onUpdateLabel, 
  onRemove,
  onResize,
  onUpdateOptions
}: { 
  field: FormField, 
  onDragStop: (id: string, e: DraggableEvent, data: DraggableData) => void,
  onUpdateLabel: (id: string, label: string) => void,
  onRemove: (id: string) => void,
  onResize: (id: string, width: number, height: number) => void,
  onUpdateOptions: (id: string, options: string[]) => void
}) => {
  const nodeRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
        inputRef.current.focus();
    }
  }, [isEditing]);

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent drag start
    e.preventDefault();
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = field.width;
    const startHeight = field.height;

    const handleMouseMove = (moveEvent: MouseEvent) => {
        const deltaX = moveEvent.clientX - startX;
        const deltaY = moveEvent.clientY - startY;
        
        let newWidth = Math.max(20, startWidth + deltaX);
        let newHeight = Math.max(20, startHeight + deltaY);
        
        // Constrain checkbox/radio to keep aspect ratio or fixed size if preferred
        if (field.type === 'checkbox' || field.type === 'radio') {
             // Optional: keep square
             const maxDim = Math.max(newWidth, newHeight);
             newWidth = maxDim;
             newHeight = maxDim;
        }

        onResize(field.id, newWidth, newHeight);
    };

    const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <Draggable
      nodeRef={nodeRef}
      bounds="parent"
      defaultPosition={{ x: field.x, y: field.y }}
      onStop={(e, data) => onDragStop(field.id, e, data)}
      onStart={() => isEditing ? false : undefined} // Prevent dragging while editing text
      cancel=".no-drag"
    >
      <div 
        ref={nodeRef}
        className={`absolute group ${isEditing ? 'cursor-text' : 'cursor-move'}`}
        style={{ width: field.width, height: field.height }} // Use height here too for box container
        onDoubleClick={(e) => {
            e.preventDefault(); // Prevent text selection
            e.stopPropagation(); // Prevent bubbling issues
            setIsEditing(true);
        }}
      >
        {/* Field Label Input - Positioned above the box */}
        {/* We have removed dedicated labels for input fields per user request. 
            Only 'label' type fields have text now. */}

        {/* Field Visual Representation */}
        <div className={`
          w-full h-full border-2 
          ${(field.type === 'checkbox' || field.type === 'radio') ? 'rounded-full' : 'rounded-md'}
          ${field.type === 'signature' ? 'bg-zinc-100 border-dashed' : field.type === 'label' ? 'bg-transparent border-transparent hover:border-zinc-300' : 'bg-zinc-50'}
          ${field.type !== 'label' ? 'border-zinc-400 hover:border-black' : ''}
          flex items-center justify-center relative overflow-hidden
          ${field.type === 'textarea' ? 'items-start pt-2' : ''}
        `}>
          {field.type === 'text' && <span className="text-xs text-zinc-400 pointer-events-none">Text Input</span>}
          {field.type === 'textarea' && <span className="text-xs text-zinc-400 pointer-events-none px-2">Text Area</span>}
          {field.type === 'checkbox' && <CheckSquare className="w-4 h-4 text-zinc-400 pointer-events-none" />}
          {field.type === 'radio' && <CircleDot className="w-4 h-4 text-zinc-400 pointer-events-none" />}
          {field.type === 'dropdown' && (
            isEditing ? (
                <textarea
                    ref={inputRef as any}
                    defaultValue={field.options?.join('\n') || ''}
                    onBlur={(e) => {
                        const lines = e.target.value.split('\n').filter(line => line.trim() !== '');
                        onUpdateOptions(field.id, lines.length > 0 ? lines : ['Option 1', 'Option 2']);
                        setIsEditing(false);
                    }}
                    onKeyDown={(e) => {
                        e.stopPropagation();
                    }}
                    onDoubleClick={(e) => e.stopPropagation()}
                    placeholder="Enter options, one per line"
                    className="absolute inset-0 w-full h-full min-h-[60px] bg-white text-xs text-black p-1 resize-none z-50 border border-blue-500 rounded no-drag"
                    style={{ height: 'auto', minHeight: '100%' }}
                />
            ) : (
                <div className="flex items-center justify-between w-full px-2">
                    <span className="text-xs text-zinc-400 pointer-events-none truncate">
                        {field.options && field.options.length > 0 ? field.options[0] : 'Select'}
                        {field.options && field.options.length > 1 && <span className="text-[10px] ml-1 opacity-50">+{field.options.length - 1}</span>}
                    </span>
                    <ChevronDown className="w-3 h-3 text-zinc-400" />
                </div>
            )
          )}
          {/* Lists (Unordered & Ordered) - Reusing Textarea Editor Logic */}
          {(field.type === 'ul' || field.type === 'ol') && (
            isEditing ? (
                <textarea
                    ref={inputRef as any}
                    defaultValue={field.options?.join('\n') || ''}
                    onBlur={(e) => {
                        const lines = e.target.value.split('\n').filter(line => line.trim() !== '');
                        onUpdateOptions(field.id, lines.length > 0 ? lines : ['Item 1', 'Item 2']);
                        setIsEditing(false);
                    }}
                    onKeyDown={(e) => {
                        e.stopPropagation();
                    }}
                    onDoubleClick={(e) => e.stopPropagation()}
                    placeholder="Enter list items, one per line"
                    className="absolute inset-0 w-full h-full bg-white text-xs text-black p-1 resize-none z-50 border border-blue-500 rounded no-drag"
                    style={{ height: 'auto', minHeight: '100%' }}
                />
            ) : (
                <div className="w-full h-full p-2 overflow-hidden">
                    {field.type === 'ul' ? (
                        <ul className="list-disc list-inside text-xs text-black">
                            {field.options && field.options.map((opt, i) => (
                                <li key={i} className="truncate">{opt}</li>
                            ))}
                        </ul>
                    ) : (
                        <ol className="list-decimal list-inside text-xs text-black">
                            {field.options && field.options.map((opt, i) => (
                                <li key={i} className="truncate">{opt}</li>
                            ))}
                        </ol>
                    )}
                </div>
            )
          )}
          {field.type === 'signature' && (
             <div className="flex flex-col items-center justify-center opacity-50">
                 <PenTool className="w-6 h-6 text-zinc-400" />
                 <span className="text-[10px] text-zinc-400">Signature</span>
             </div>
          )}
          {field.type === 'label' && (
             <div className="w-full h-full flex items-center px-1">
                 {isEditing ? (
                    <input
                        ref={inputRef}
                        type="text"
                        value={field.label}
                        onChange={(e) => onUpdateLabel(field.id, e.target.value)}
                        onBlur={() => setIsEditing(false)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') setIsEditing(false);
                            e.stopPropagation();
                        }}
                        onDoubleClick={(e) => e.stopPropagation()}
                        className="w-full h-full bg-white text-base text-black border border-blue-500 rounded px-1 focus:ring-0 cursor-text no-drag"
                    />
                 ) : (
                    <span className="text-base font-medium text-black break-words leading-tight">{field.label}</span>
                 )}
             </div>
          )}
        
          {/* Remove Button */}
          <button
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onRemove(field.id);
            }}
            className="absolute -top-3 -right-3 p-1.5 bg-black text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:scale-110 no-drag z-20 cursor-pointer"
            title="Remove Field"
            onMouseDown={(e) => e.stopPropagation()} 
            onMouseUp={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
          >
            <Trash2 className="w-3 h-3" />
          </button>

          {/* Resize Handle */}
          <div 
             className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize no-drag z-30 flex items-end justify-end p-1 opacity-50 hover:opacity-100 transition-opacity"
             onMouseDown={handleResizeMouseDown}
          >
             {/* Standard Resize Grip Visual (Diagonal Lines) */}
             <svg width="6" height="6" viewBox="0 0 6 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 6L6 0L0 6H6Z" fill="currentColor" className="text-zinc-400"/>
             </svg>
          </div>
        </div>
      </div>
    </Draggable>
  );
};

export const FormBuilder = () => {
  const [fields, setFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(false);
  const [readonlyLoading, setReadonlyLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Ref to canvas to calculate bounds if needed, currently using fixed size 595x842 (A4 scale)
  const canvasRef = useRef<HTMLDivElement>(null);

  const addField = (type: FormField['type']) => {
    let width = 200;
    let height = 30;
    let label = 'New Field';

    if (type === 'checkbox' || type === 'radio') {
        width = 20;
        height = 20;
        label = type === 'checkbox' ? 'Checkbox' : 'Radio Button';
    } else if (type === 'textarea') {
        height = 80;
        label = 'Text Area';
    } else if (type === 'signature') {
        width = 150;
        height = 60;
        label = 'Signature';
    } else if (type === 'dropdown') {
        label = 'Dropdown';
    } else if (type === 'label') {
        width = 150;
        height = 30;
        label = 'Double click to edit text';
    } else if (type === 'ul' || type === 'ol') {
        width = 200;
        height = 100;
        label = type === 'ul' ? 'Bullet List' : 'Numbered List';
    }

    // Smart positioning: Find the best position that doesn't overlap
    const pageWidth = 595;
    const pageHeight = 842;
    const padding = 20;
    const spacing = 15; // Space between fields
    
    let newX = padding;
    let newY = padding;
    
    if (fields.length > 0) {
      // Find the bottom-most point of all existing fields
      let maxBottom = 0;
      let rightmostRight = 0;
      
      fields.forEach(field => {
        const bottom = field.y + field.height;
        const right = field.x + field.width;
        if (bottom > maxBottom) {
          maxBottom = bottom;
        }
        if (right > rightmostRight) {
          rightmostRight = right;
        }
      });
      
      // Try placing below the bottom-most field
      newY = maxBottom + spacing;
      
      // If it would go outside page bounds, try a new column
      if (newY + height > pageHeight - padding) {
        // Start a new column on the right
        newX = rightmostRight + spacing;
        newY = padding;
        
        // If new column would go outside, wrap to top and find empty space
        if (newX + width > pageWidth - padding) {
          newX = padding;
          newY = padding;
          
          // Find an empty spot by checking for overlaps
          let foundPosition = false;
          let attempts = 0;
          const maxAttempts = 50;
          
          while (!foundPosition && attempts < maxAttempts) {
            let hasOverlap = false;
            
            // Check if this position overlaps with any existing field
            for (const field of fields) {
              const overlapX = !(newX + width + spacing <= field.x || newX >= field.x + field.width + spacing);
              const overlapY = !(newY + height + spacing <= field.y || newY >= field.y + field.height + spacing);
              
              if (overlapX && overlapY) {
                hasOverlap = true;
                break;
              }
            }
            
            if (!hasOverlap && newX + width <= pageWidth - padding && newY + height <= pageHeight - padding) {
              foundPosition = true;
            } else {
              // Try next position: move right, then wrap to next row
              newX += width + spacing;
              if (newX + width > pageWidth - padding) {
                newX = padding;
                newY += height + spacing;
                if (newY + height > pageHeight - padding) {
                  newY = padding;
                }
              }
            }
            attempts++;
          }
        }
      }
    }

    const newField: FormField = {
      id: `field_${Date.now()}`,
      type,
      label,
      x: newX,
      y: newY,
      width,
      height,
      options: (type === 'dropdown' || type === 'ul' || type === 'ol') ? ['Option 1', 'Option 2', 'Option 3'] : undefined
    };
    setFields([...fields, newField]);
  };

  const updateFieldPosition = (id: string, x: number, y: number) => {
    setFields(fields.map(f => f.id === id ? { ...f, x, y } : f));
  };

  const updateFieldLabel = (id: string, label: string) => {
    setFields(fields.map(f => f.id === id ? { ...f, label } : f));
  };

  const updateFieldOptions = (id: string, options: string[]) => {
      setFields(fields.map(f => f.id === id ? { ...f, options } : f));
  };

  const removeField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
  };

  const handleDragStop = (id: string, _e: DraggableEvent, data: DraggableData) => {
    updateFieldPosition(id, data.x, data.y);
  };

  const handleExport = async () => {
    if (fields.length === 0) return;
    setLoading(true);
    try {
      const blob = await generateFormPDF(fields);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'form.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to generate PDF', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to generate PDF: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleMakeReadonly = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || file.type !== 'application/pdf') {
      alert('Please select a valid PDF file');
      return;
    }

    setReadonlyLoading(true);
    try {
      const readonlyBlob = await makePDFReadonly(file);
      const url = URL.createObjectURL(readonlyBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name.replace('.pdf', '_readonly.pdf');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to make PDF readonly', error);
      alert('Failed to make PDF readonly. Please ensure the PDF is valid.');
    } finally {
      setReadonlyLoading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="w-full max-w-6xl mx-auto flex flex-col md:flex-row gap-6 p-4"
    >
      {/* Sidebar / Toolbox */}
      <div className="md:w-64 flex flex-col gap-4">
        <div className="bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/50 rounded-2xl shadow-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">Form Builder Toolbox</h3>
          <p className="text-xs text-zinc-400 mb-4">Drag and drop fields to build your interactive PDF form. Click items below to add them to the canvas.</p>
          <div className="space-y-3">
             <button
              onClick={() => addField('label')}
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-700/30 transition-colors text-left group cursor-pointer"
            >
              <div className="p-2 bg-zinc-700/50 text-white rounded-md group-hover:scale-110 transition-transform">
                <Type className="w-5 h-5" />
              </div>
              <span className="text-white font-medium">Text Label</span>
              <Plus className="w-4 h-4 ml-auto text-zinc-400 group-hover:text-white transition-colors" />
            </button>

            <button
              onClick={() => addField('text')}
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-700/30 transition-colors text-left group cursor-pointer"
            >
              <div className="p-2 bg-zinc-700/50 text-white rounded-md group-hover:scale-110 transition-transform">
                <Type className="w-5 h-5" />
              </div>
              <span className="text-white font-medium">Text Input</span>
              <Plus className="w-4 h-4 ml-auto text-zinc-400 group-hover:text-white transition-colors" />
            </button>

            <button
              onClick={() => addField('textarea')}
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-700/30 transition-colors text-left group cursor-pointer"
            >
              <div className="p-2 bg-zinc-700/50 text-white rounded-md group-hover:scale-110 transition-transform">
                <AlignLeft className="w-5 h-5" />
              </div>
              <span className="text-white font-medium">Text Area</span>
              <Plus className="w-4 h-4 ml-auto text-zinc-400 group-hover:text-white transition-colors" />
            </button>

            <button
              onClick={() => addField('checkbox')}
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-700/30 transition-colors text-left group cursor-pointer"
            >
              <div className="p-2 bg-zinc-700/50 text-white rounded-md group-hover:scale-110 transition-transform">
                <CheckSquare className="w-5 h-5" />
              </div>
              <span className="text-white font-medium">Checkbox</span>
              <Plus className="w-4 h-4 ml-auto text-zinc-400 group-hover:text-white transition-colors" />
            </button>

            <button
              onClick={() => addField('radio')}
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-700/30 transition-colors text-left group cursor-pointer"
            >
              <div className="p-2 bg-zinc-700/50 text-white rounded-md group-hover:scale-110 transition-transform">
                <CircleDot className="w-5 h-5" />
              </div>
              <span className="text-white font-medium">Radio Button</span>
              <Plus className="w-4 h-4 ml-auto text-zinc-400 group-hover:text-white transition-colors" />
            </button>

            <button
              onClick={() => addField('dropdown')}
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-700/30 transition-colors text-left group cursor-pointer"
            >
              <div className="p-2 bg-zinc-700/50 text-white rounded-md group-hover:scale-110 transition-transform">
                <ChevronDown className="w-5 h-5" />
              </div>
              <span className="text-white font-medium">Dropdown</span>
              <Plus className="w-4 h-4 ml-auto text-zinc-400 group-hover:text-white transition-colors" />
            </button>

            <button
              onClick={() => addField('ul')}
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-700/30 transition-colors text-left group cursor-pointer"
            >
              <div className="p-2 bg-zinc-700/50 text-white rounded-md group-hover:scale-110 transition-transform">
                <List className="w-5 h-5" />
              </div>
              <span className="text-white font-medium">Bullet List</span>
              <Plus className="w-4 h-4 ml-auto text-zinc-400 group-hover:text-white transition-colors" />
            </button>

            <button
              onClick={() => addField('ol')}
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-700/30 transition-colors text-left group cursor-pointer"
            >
              <div className="p-2 bg-zinc-700/50 text-white rounded-md group-hover:scale-110 transition-transform">
                <ListOrdered className="w-5 h-5" />
              </div>
              <span className="text-white font-medium">Numbered List</span>
              <Plus className="w-4 h-4 ml-auto text-zinc-400 group-hover:text-white transition-colors" />
            </button>

            <button
              onClick={() => addField('signature')}
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-700/30 transition-colors text-left group cursor-pointer"
            >
              <div className="p-2 bg-zinc-700/50 text-white rounded-md group-hover:scale-110 transition-transform">
                <PenTool className="w-5 h-5" />
              </div>
              <span className="text-white font-medium">Signature Panel</span>
              <Plus className="w-4 h-4 ml-auto text-zinc-400 group-hover:text-white transition-colors" />
            </button>
          </div>
        </div>

        <div className="bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/50 rounded-2xl shadow-xl p-6 mt-auto space-y-3">
          <button
            onClick={handleExport}
            disabled={fields.length === 0 || loading}
            className="w-full py-4 bg-white text-black font-bold rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-white/10 cursor-pointer"
          >
             {loading ? 'Generating...' : (
               <>
                 <Download className="w-5 h-5" /> Export PDF
               </>
             )}
          </button>
          
          <div className="relative">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleMakeReadonly}
              className="hidden"
              id="pdf-readonly-input"
            />
            <label
              htmlFor="pdf-readonly-input"
              className={`w-full py-4 bg-zinc-800 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-zinc-700 transition-colors cursor-pointer shadow-lg ${
                readonlyLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {readonlyLoading ? (
                'Processing...'
              ) : (
                <>
                  <Lock className="w-5 h-5" /> Make PDF Readonly
                </>
              )}
            </label>
            <p className="text-xs text-zinc-400 mt-2 text-center">
              Upload a filled PDF to make it readonly
            </p>
          </div>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 flex justify-center bg-zinc-100 rounded-2xl border-2 border-dashed border-zinc-300 p-8 overflow-auto min-h-[600px] relative">
        <div 
          ref={canvasRef}
          className="bg-white shadow-2xl relative"
          style={{ width: '595px', height: '842px' }} // Logic pixel size of A4
        >
          {fields.map((field) => (
            <DraggableFieldItem
              key={field.id}
              field={field}
              onDragStop={handleDragStop}
              onUpdateLabel={updateFieldLabel}
              onRemove={removeField}
              onResize={(id, width, height) => {
                setFields(fields.map(f => f.id === id ? { ...f, width, height } : f));
              }}
              onUpdateOptions={updateFieldOptions}
            />
          ))}

          {fields.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center text-zinc-400">
                <p className="text-xl font-bold">A4 Page</p>
                <p className="text-sm">Click items in the toolbox to add them here.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
