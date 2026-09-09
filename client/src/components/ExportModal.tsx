import React, { useState } from 'react';
import { jsPDF } from 'jspdf';

interface ExportModalProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  onClose: () => void;
  isDark?: boolean;
}

export const ExportModal: React.FC<ExportModalProps> = ({ canvasRef, onClose, isDark = true }) => {
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
      <div className={`w-full max-w-md border rounded-2xl shadow-2xl overflow-hidden animate-slide-up transition-colors duration-300 ${
        isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-gray-200 text-gray-900'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? 'border-zinc-800 bg-zinc-800/50' : 'border-gray-200 bg-gray-50/80'}`}>
          <div className="flex items-center gap-2">
            <span className="text-xl">💾</span>
            <h2 className="text-lg font-bold">Export Whiteboard</h2>
          </div>
          <button
            onClick={onClose}
            className={`transition-colors p-1.5 rounded-lg ${isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-gray-400 hover:text-black hover:bg-gray-100'}`}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
              File Name
            </label>
            <input
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="whiteboard-drawing"
              className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 ${
                isDark
                  ? 'bg-zinc-800 border-zinc-700 text-white focus:ring-zinc-600'
                  : 'bg-gray-50 border-gray-200 text-gray-900 focus:ring-gray-300'
              }`}
            />
          </div>

          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
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
                      ? isDark
                        ? 'bg-zinc-100/10 border-zinc-400 text-zinc-100 font-semibold'
                        : 'bg-zinc-900/5 border-zinc-900 text-zinc-900 font-semibold'
                      : isDark
                      ? 'bg-zinc-800/50 border-zinc-700/60 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
                      : 'bg-gray-50/50 border-gray-200/60 text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <div className="text-sm font-bold">{fmt.id.toUpperCase()}</div>
                  <div className={`text-[10px] mt-0.5 ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>{fmt.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`p-4 border-t flex items-center justify-end gap-3 ${isDark ? 'border-zinc-800 bg-zinc-800/50' : 'border-gray-200 bg-gray-50/80'}`}>
          <button
            onClick={onClose}
            className={`px-4 py-2 text-sm font-medium transition-colors ${isDark ? 'text-zinc-400 hover:text-white' : 'text-gray-500 hover:text-black'}`}
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            className={`px-6 py-2.5 font-semibold text-sm rounded-xl transition-all shadow-sm ${
              isDark ? 'bg-zinc-100 text-zinc-950 hover:bg-white' : 'bg-zinc-900 text-white hover:bg-black'
            }`}
          >
            Download {format.toUpperCase()}
          </button>
        </div>
      </div>
    </div>
  );
};
