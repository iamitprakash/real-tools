import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { DraggableData, DraggableEvent } from 'react-draggable';
import {
  IconTypography as Type,
  IconCheck as CheckSquare,
  IconTrash as Trash2,
  IconDownload as Download,
  IconPlus as Plus,
  IconAlignLeft as AlignLeft,
  IconCircleDot as CircleDot,
  IconChevronDown as ChevronDown,
  IconEdit as PenTool,
  IconList as List,
  IconListNumbers as ListOrdered,
  IconLock as Lock,
  IconRefresh,
  IconFileText
} from '@tabler/icons-react';
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
  const [DraggableComponent, setDraggableComponent] = useState<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Dynamically import react-draggable only on client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('react-draggable').then((module) => {
        setDraggableComponent(() => module.default);
      }).catch((error) => {
        console.error('Failed to load react-draggable:', error);
      });
    }
  }, []);

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

  // Fallback if Draggable hasn't loaded yet
  if (!DraggableComponent) {
    return (
      <div
        ref={nodeRef}
        className="absolute group"
        style={{ width: field.width, height: field.height, left: field.x, top: field.y }}
      >
        <div className="w-full h-full border-2 rounded-md bg-zinc-50 border-zinc-400 flex items-center justify-center">
          <span className="text-xs text-zinc-400">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <DraggableComponent
      nodeRef={nodeRef}
      bounds="parent"
      defaultPosition={{ x: field.x, y: field.y }}
      onStop={(e: DraggableEvent, data: DraggableData) => onDragStop(field.id, e, data)}
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
              <path d="M6 6L6 0L0 6H6Z" fill="currentColor" className="text-zinc-400" />
            </svg>
          </div>
        </div>
      </div>
    </DraggableComponent>
  );
};

export const FormBuilder = () => {
  const [fields, setFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(false);
  const [readonlyLoading, setReadonlyLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canvasRef = useRef<HTMLDivElement>(null);

  const addField = (type: FormField['type']) => {
    let width = 200;
    let height = 30;
    let label = 'New Field';

    if (type === 'checkbox' || type === 'radio') {
      width = 24;
      height = 24;
      label = type === 'checkbox' ? 'Checkbox' : 'Radio Button';
    } else if (type === 'textarea') {
      height = 80;
      label = 'Text Area';
    } else if (type === 'signature') {
      width = 160;
      height = 64;
      label = 'Signature';
    } else if (type === 'dropdown') {
      label = 'Dropdown';
    } else if (type === 'label') {
      width = 150;
      height = 32;
      label = 'Double click to edit text';
    } else if (type === 'ul' || type === 'ol') {
      width = 200;
      height = 100;
      label = type === 'ul' ? 'Bullet List' : 'Numbered List';
    }

    const pageWidth = 595;
    const pageHeight = 842;
    const padding = 40;
    const spacing = 16;

    let newX = padding;
    let newY = padding;

    if (fields.length > 0) {
      let maxBottom = 0;
      let rightmostRight = 0;

      fields.forEach(field => {
        const bottom = field.y + field.height;
        const right = field.x + field.width;
        if (bottom > maxBottom) maxBottom = bottom;
        if (right > rightmostRight) rightmostRight = right;
      });

      newY = maxBottom + spacing;

      if (newY + height > pageHeight - padding) {
        newX = rightmostRight + spacing;
        newY = padding;

        if (newX + width > pageWidth - padding) {
          newX = padding;
          newY = padding;

          let foundPosition = false;
          let attempts = 0;
          const maxAttempts = 50;

          while (!foundPosition && attempts < maxAttempts) {
            let hasOverlap = false;
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
              newX += width + spacing;
              if (newX + width > pageWidth - padding) {
                newX = padding;
                newY += height + spacing;
                if (newY + height > pageHeight - padding) newY = padding;
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
      if (!blob || blob.size === 0) {
        throw new Error('Failed to generate PDF: empty blob');
      }
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
      alert('Failed to generate PDF. Please try again. Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
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
      if (!readonlyBlob || readonlyBlob.size === 0) {
        throw new Error('Failed to process PDF: empty blob');
      }
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
      alert('Failed to process PDF. Please try again. Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setReadonlyLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="w-full flex flex-col lg:flex-row gap-8 min-h-[calc(100vh-140px)]"
    >
      {/* Toolbox Section */}
      <div className="lg:w-80 flex flex-col gap-6 shrink-0">
        <div className="apple-card p-6 flex flex-col h-full bg-secondary/20 border-border/40">
          <div className="mb-6">
            <h3 className="text-[20px] font-bold tracking-tight text-foreground mb-2">Form Toolbox</h3>
            <p className="text-[13px] text-foreground/50 font-medium leading-relaxed">
              Drag elements onto the canvas to construct professional interactive forms.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2 space-y-2">
            {[
              { type: 'label', label: 'Text Label', icon: Type },
              { type: 'text', label: 'Field Input', icon: Type },
              { type: 'textarea', label: 'Text Area', icon: AlignLeft },
              { type: 'checkbox', label: 'Checkbox', icon: CheckSquare },
              { type: 'radio', label: 'Radio', icon: CircleDot },
              { type: 'dropdown', label: 'Dropdown', icon: ChevronDown },
              { type: 'ul', label: 'Bullet List', icon: List },
              { type: 'ol', label: 'Ordered List', icon: ListOrdered },
              { type: 'signature', label: 'Signature', icon: PenTool },
            ].map((item) => (
              <button
                key={item.type}
                onClick={() => addField(item.type as any)}
                className="w-full group flex items-center justify-between p-3 rounded-xl bg-secondary/40 hover:bg-secondary/60 border border-transparent hover:border-border/30 transition-all active:scale-[0.98] cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-foreground/5 group-hover:bg-foreground group-hover:text-background transition-colors">
                    <item.icon size={18} />
                  </div>
                  <span className="text-[14px] font-bold group-hover:text-foreground/90 transition-colors">
                    {item.label}
                  </span>
                </div>
                <Plus size={16} className="opacity-20 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-border/40 space-y-3">
            <button
              onClick={handleExport}
              disabled={fields.length === 0 || loading}
              className="w-full h-11 bg-foreground text-background font-black rounded-xl text-[14px] flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm cursor-pointer"
            >
              {loading ? <IconRefresh className="animate-spin" size={18} /> : (
                <>
                  <Download size={18} />
                  Export PDF Form
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
                className={`w-full h-11 bg-secondary/40 text-foreground font-bold rounded-xl text-[14px] flex items-center justify-center gap-2 hover:bg-secondary/60 transition-colors cursor-pointer border border-border/30 ${readonlyLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
              >
                {readonlyLoading ? <IconRefresh className="animate-spin" size={16} /> : (
                  <>
                    <Lock size={16} />
                    Flatten to Readonly
                  </>
                )}
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Canvas Section */}
      <div className="flex-1 apple-card bg-secondary/5 border-border/20 p-8 flex justify-center overflow-auto custom-scrollbar relative min-h-[800px]">
        <div
          ref={canvasRef}
          className="bg-white shadow-2xl relative shrink-0 overflow-hidden ring-1 ring-black/5"
          style={{ width: '595px', height: '842px', minHeight: '842px' }}
        >
          {/* Subtle Grid Pattern */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(#000 0.5px, transparent 0.5px)', backgroundSize: '20px 20px' }} />

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
              <div className="text-center opacity-20">
                <IconFileText size={64} className="mx-auto mb-4" strokeWidth={1} />
                <p className="text-[17px] font-black tracking-tight mb-1">A4 Working Surface</p>
                <p className="text-[13px] font-medium">Select elements to begin composing</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
