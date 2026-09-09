import React, { useState } from 'react';
import { jsPDF } from 'jspdf';

interface ExportModalProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ canvasRef, onClose }) => {
  const [format, setFormat] = useState<'png' | 'jpeg' | 'pdf'>('png');
  const [filename, setFilename] = useState('drawsync-whiteboard');

  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const safeName = (filename.trim() || 'whiteboard').replace(/[^a-zA-Z0-9-_]/g, '_');

    if (format === 'png') {
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${safeName}.png`;
      a.click();
    } else if (format === 'jpeg') {
      // Create a white-background canvas for JPEG so transparency doesn't turn black
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tCtx = tempCanvas.getContext('2d');
      if (tCtx) {
        tCtx.fillStyle = '#FFFFFF';
        tCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        tCtx.drawImage(canvas, 0, 0);
        const dataUrl = tempCanvas.toDataURL('image/jpeg', 0.95);
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `${safeName}.jpg`;
        a.click();
      }
    } else if (format === 'pdf') {
      const isLandscape = canvas.width > canvas.height;
      const pdf = new jsPDF({
        orientation: isLandscape ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height],
      });
      const dataUrl = canvas.toDataURL('image/png');
      pdf.addImage(dataUrl, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`${safeName}.pdf`);
    }

    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md bg-gray-900 border border-gray-700/60 rounded-2xl shadow-2xl overflow-hidden animate-slide-up text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700/60 bg-gray-800/50">
          <div className="flex items-center gap-2">
            <span className="text-xl">💾</span>
            <h2 className="text-lg font-bold">Export Whiteboard</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-gray-700"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              File Name
            </label>
            <input
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="whiteboard-drawing"
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Export Format
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'png', label: 'PNG Image', desc: 'Lossless & transparent' },
                { id: 'jpeg', label: 'JPG Image', desc: 'White background' },
                { id: 'pdf', label: 'PDF Document', desc: 'Vector friendly print' },
              ].map((fmt) => (
                <button
                  key={fmt.id}
                  type="button"
                  onClick={() => setFormat(fmt.id as 'png' | 'jpeg' | 'pdf')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    format === fmt.id
                      ? 'bg-blue-600/20 border-blue-500 text-blue-400 font-semibold'
                      : 'bg-gray-800/50 border-gray-700/60 text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <div className="text-sm font-bold">{fmt.id.toUpperCase()}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">{fmt.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700/60 bg-gray-800/50 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-xl transition-all shadow-lg shadow-blue-500/25"
          >
            Download {format.toUpperCase()}
          </button>
        </div>
      </div>
    </div>
  );
};
