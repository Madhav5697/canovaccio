import React from 'react';

interface HelpPanelProps {
  onClose: () => void;
}

export const HelpPanel: React.FC<HelpPanelProps> = ({ onClose }) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg bg-gray-900 border border-gray-700/60 rounded-2xl shadow-2xl overflow-hidden animate-slide-up text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700/60 bg-gray-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-xs shadow-md">
              DS
            </div>
            <h2 className="text-lg font-bold">DrawSync Whiteboard Help</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-gray-700"
            aria-label="Close help"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[80vh] overflow-y-auto space-y-6 text-sm">
          {/* Section: Shortcuts */}
          <div>
            <h3 className="font-semibold text-blue-400 mb-3 uppercase tracking-wider text-xs">
              ⌨️ Keyboard Shortcuts
            </h3>
            <div className="grid grid-cols-2 gap-2 text-gray-300">
              {[
                { key: 'V', desc: 'Select Tool' },
                { key: 'P', desc: 'Pencil Tool' },
                { key: 'B', desc: 'Brush Tool' },
                { key: 'E', desc: 'Eraser Tool' },
                { key: 'F', desc: 'Fill / Bucket Tool' },
                { key: 'T', desc: 'Text Tool' },
                { key: 'L', desc: 'Line Tool' },
                { key: 'R', desc: 'Rectangle Tool' },
                { key: 'C', desc: 'Circle Tool' },
                { key: 'Delete', desc: 'Delete Selected Object' },
                { key: 'Ctrl + Z', desc: 'Undo' },
                { key: 'Ctrl + Shift + Z', desc: 'Redo' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-2 bg-gray-800/50 border border-gray-700/40 rounded-xl">
                  <span className="text-gray-400">{item.desc}</span>
                  <kbd className="px-2 py-0.5 bg-gray-900 border border-gray-600 rounded text-xs font-mono font-bold text-blue-300">
                    {item.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Features */}
          <div>
            <h3 className="font-semibold text-blue-400 mb-3 uppercase tracking-wider text-xs">
              💡 Main Features
            </h3>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">•</span>
                <span><strong>Multiplayer Cursors:</strong> See live cursors of collaborators in your room in real time.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">•</span>
                <span><strong>Sticky Notes:</strong> Click the canvas to place yellow, green, or blue notes.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">•</span>
                <span><strong>Image Upload:</strong> Upload PNG/JPG images and place them on the shared canvas.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">•</span>
                <span><strong>Zoom & Pan:</strong> Zoom from 25% to 200% using the bottom navigation controls.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">•</span>
                <span><strong>Export:</strong> Download your canvas drawing cleanly as PNG, JPG, or PDF.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700/60 bg-gray-800/50 text-center">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-colors shadow-lg shadow-blue-500/20"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};
