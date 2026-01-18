import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { IconDownload, IconCrop } from '@tabler/icons-react';
import { FileUpload } from '../ui/file-upload';
import { useToast } from '../ui/toast';

export const ImageCropper = () => {
  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 100, height: 100 });
  const [croppedUrl, setCroppedUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { showToast } = useToast();

  const handleFileSelect = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setImageUrl(URL.createObjectURL(files[0]));
      setCroppedUrl(null);
    }
  };

  const handleCrop = () => {
    if (!imageUrl || !file) {
      showToast('Please select an image', 'error');
      return;
    }

    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const scaleX = img.width / (canvas.offsetWidth || 400);
      const scaleY = img.height / (canvas.offsetHeight || 300);

      canvas.width = cropArea.width * scaleX;
      canvas.height = cropArea.height * scaleY;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(
          img,
          cropArea.x * scaleX,
          cropArea.y * scaleY,
          cropArea.width * scaleX,
          cropArea.height * scaleY,
          0,
          0,
          cropArea.width * scaleX,
          cropArea.height * scaleY
        );

        canvas.toBlob((blob) => {
          if (blob) {
            setCroppedUrl(URL.createObjectURL(blob));
            showToast('Image cropped successfully');
          }
        }, file.type);
      }
    };
    img.src = imageUrl;
  };

  const handleDownload = () => {
    if (!croppedUrl) return;
    const a = document.createElement('a');
    a.href = croppedUrl;
    a.download = `cropped_${file?.name || 'image'}`;
    a.click();
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-2">
            <IconCrop className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Image Cropper
          </h1>
          <p className="text-muted-foreground">Crop images to specific dimensions</p>
        </div>

        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 space-y-6">
          {!file ? (
            <FileUpload onChange={handleFileSelect} isProcessing={false} />
          ) : (
            <>
              {imageUrl && (
                <div className="relative border border-border rounded-lg overflow-hidden" style={{ maxHeight: '400px' }}>
                  <img src={imageUrl} alt="Original" className="w-full h-auto" />
                  <div
                    className="absolute border-2 border-primary bg-primary/20 cursor-move"
                    style={{
                      left: `${cropArea.x}px`,
                      top: `${cropArea.y}px`,
                      width: `${cropArea.width}px`,
                      height: `${cropArea.height}px`,
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                    }}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">X Position</label>
                  <input
                    type="number"
                    value={cropArea.x}
                    onChange={(e) => setCropArea({ ...cropArea, x: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Y Position</label>
                  <input
                    type="number"
                    value={cropArea.y}
                    onChange={(e) => setCropArea({ ...cropArea, y: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Width</label>
                  <input
                    type="number"
                    value={cropArea.width}
                    onChange={(e) => setCropArea({ ...cropArea, width: parseInt(e.target.value) || 100 })}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Height</label>
                  <input
                    type="number"
                    value={cropArea.height}
                    onChange={(e) => setCropArea({ ...cropArea, height: parseInt(e.target.value) || 100 })}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <button
                onClick={handleCrop}
                className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 transition-all cursor-pointer"
              >
                Crop Image
              </button>

              {croppedUrl && (
                <div className="space-y-4">
                  <img src={croppedUrl} alt="Cropped" className="w-full rounded-lg border border-border" />
                  <button
                    onClick={handleDownload}
                    className="w-full px-6 py-3 bg-secondary text-foreground rounded-xl font-semibold hover:bg-secondary/80 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <IconDownload className="w-5 h-5" />
                    Download Cropped Image
                  </button>
                </div>
              )}

              <canvas ref={canvasRef} className="hidden" />
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};
