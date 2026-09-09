import React from 'react';

interface HelpPanelProps {
  onClose: () => void;
  isDark?: boolean;
}

export const HelpPanel: React.FC<HelpPanelProps> = ({ onClose, isDark = true }) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={`w-full max-w-lg border rounded-2xl shadow-2xl overflow-hidden animate-slide-up transition-colors duration-300 ${
        isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-gray-200 text-gray-900'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? 'border-zinc-800 bg-zinc-800/50' : 'border-gray-200 bg-gray-50/80'}`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shadow-sm ${
              isDark ? 'bg-zinc-100 text-zinc-900' : 'bg-zinc-900 text-white'
            }`}>
              DS
            </div>
            <h2 className="text-lg font-bold">DrawSync Whiteboard Help</h2>
          </div>
          <button
            onClick={onClose}
            className={`transition-colors p-1.5 rounded-lg ${isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-gray-400 hover:text-black hover:bg-gray-100'}`}
            aria-label="Close help"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[80vh] overflow-y-auto space-y-6 text-sm">
          {/* Section: Shortcuts */}
          <div>
            <h3 className={`font-semibold mb-3 uppercase tracking-wider text-xs ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
              ⌨️ Keyboard Shortcuts
            </h3>
            <div className={`grid grid-cols-2 gap-2 ${isDark ? 'text-zinc-300' : 'text-gray-700'}`}>
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
                <div key={item.key} className={`flex items-center justify-between p-2 border rounded-xl ${
                  isDark ? 'bg-zinc-800/50 border-zinc-700/40' : 'bg-gray-50 border-gray-200/60'
                }`}>
                  <span className={isDark ? 'text-zinc-400' : 'text-gray-500'}>{item.desc}</span>
                  <kbd className={`px-2 py-0.5 border rounded text-xs font-mono font-bold ${
                    isDark ? 'bg-zinc-900 border-zinc-600 text-zinc-300' : 'bg-white border-gray-300 text-gray-700'
                  }`}>
                    {item.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Features */}
          <div>
            <h3 className={`font-semibold mb-3 uppercase tracking-wider text-xs ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
              💡 Main Features
            </h3>
            <ul className={`space-y-2 ${isDark ? 'text-zinc-300' : 'text-gray-700'}`}>
              <li className="flex items-start gap-2">
                <span className={`font-bold ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>•</span>
                <span><strong>Multiplayer Cursors:</strong> See live cursors of collaborators in your room in real time.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className={`font-bold ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>•</span>
                <span><strong>Image Upload:</strong> Upload PNG/JPG images and place them on the shared canvas.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className={`font-bold ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>•</span>
                <span><strong>Zoom & Pan:</strong> Zoom from 25% to 200% using the bottom navigation controls.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className={`font-bold ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>•</span>
                <span><strong>Export:</strong> Download your canvas drawing cleanly as PNG, JPG, or PDF.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className={`p-4 border-t text-center ${isDark ? 'border-zinc-800 bg-zinc-800/50' : 'border-gray-200 bg-gray-50/80'}`}>
          <button
            onClick={onClose}
            className={`px-6 py-2 font-medium rounded-xl transition-colors ${
              isDark ? 'bg-zinc-100 text-zinc-950 hover:bg-white' : 'bg-zinc-900 text-white hover:bg-black'
            }`}
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};
