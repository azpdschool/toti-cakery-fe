import React, { useState, useRef, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, Check } from 'lucide-react';

interface ImageCropperProps {
  imageSrc: string;
  onCrop: (croppedFile: File) => void;
  onCancel: () => void;
}

export default function ImageCropper({ imageSrc, onCrop, onCancel }: ImageCropperProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    setDragStart({ x: clientX - position.x, y: clientY - position.y });
  };

  const handleMouseMove = (e: MouseEvent | TouchEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
    setPosition({ x: clientX - dragStart.x, y: clientY - dragStart.y });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleMouseMove, { passive: false });
      window.addEventListener('touchend', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, dragStart]);

  const handleConfirm = () => {
    if (!imgRef.current || !containerRef.current) return;
    const canvas = document.createElement('canvas');
    const size = 400; // output size
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imgRef.current;
    
    // The container is 256x256 visually. The image is scaled and translated.
    // We need to map the visible area in the container to the original image dimensions, 
    // and draw that onto the 400x400 canvas.
    const containerSize = containerRef.current.offsetWidth;
    const scaleFactor = canvas.width / containerSize;
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // The center of the container is (containerSize/2, containerSize/2)
    // We want to translate the canvas so the center of the image is at the center of the canvas
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(scale * scaleFactor, scale * scaleFactor);
    ctx.translate(-canvas.width / 2 / scaleFactor, -canvas.height / 2 / scaleFactor);
    
    // Draw the image with the position offset
    ctx.drawImage(
      img,
      (containerSize - img.width) / 2 + position.x / scale,
      (containerSize - img.height) / 2 + position.y / scale,
      img.width,
      img.height
    );

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'cropped_image.jpg', { type: 'image/jpeg' });
        onCrop(file);
      }
    }, 'image/jpeg', 0.9);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Crop Image</h3>
          <button onClick={onCancel} className="rounded-full p-2 hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        
        <div 
          ref={containerRef}
          className="relative mx-auto h-64 w-64 overflow-hidden rounded-xl bg-gray-100 cursor-move"
          onMouseDown={handleMouseDown}
          onTouchStart={handleMouseDown}
        >
          <img
            ref={imgRef}
            src={imageSrc}
            alt="Crop preview"
            draggable={false}
            className="absolute left-1/2 top-1/2 max-w-none origin-center"
            style={{
              transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px)) scale(${scale})`,
            }}
          />
        </div>

        <div className="mt-6 flex items-center justify-between gap-4">
          <button 
            onClick={() => setScale(s => Math.max(0.5, s - 0.1))}
            className="rounded-full p-2 text-gray-600 hover:bg-gray-100"
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            <ZoomOut className="h-5 w-5" />
          </button>
          
          <input 
            type="range" 
            min="0.5" 
            max="3" 
            step="0.1" 
            value={scale} 
            onChange={(e) => setScale(Number(e.target.value))}
            className="flex-1"
          />
          
          <button 
            onClick={() => setScale(s => Math.min(3, s + 0.1))}
            className="rounded-full p-2 text-gray-600 hover:bg-gray-100"
            title="Zoom In"
            aria-label="Zoom In"
          >
            <ZoomIn className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex items-center gap-2 rounded-xl bg-[#d85b30] px-4 py-2 text-sm font-semibold text-white hover:bg-[#c04e28]"
          >
            <Check className="h-4 w-4" />
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
