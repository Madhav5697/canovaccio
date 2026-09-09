import React, { useState } from 'react';
import { Tooltip } from './Tooltip';

interface ColorPickerBarProps {
  color: string;
  onChange: (color: string) => void;
}

const PRESET_PALETTE = [
  '#000000', '#FFFFFF', '#EF4444', '#F97316',
  '#F59E0B', '#10B981', '#06B6D4', '#3B82F6',
  '#6366F1', '#8B5CF6', '#EC4899', '#64748B',
];

export const ColorPickerBar: React.FC<ColorPickerBarProps> = ({ color, onChange }) => {
  const [recentColors, setRecentColors] = useState<string[]>([
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'
  ]);
  const [hexInput, setHexInput] = useState(color);

  const handleSelectColor = (newColor: string) => {
    onChange(newColor);
    setHexInput(newColor);
    setRecentColors((prev) => {
      const filtered = prev.filter((c) => c.toLowerCase() !== newColor.toLowerCase());
      return [newColor, ...filtered].slice(0, 5);
    });
  };

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (!val.startsWith('#')) val = '#' + val;
    setHexInput(val);
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      handleSelectColor(val);
    }
  };

  const handleEyeDropper = async () => {
    // Check for native EyeDropper API support in Chromium browsers
    if (typeof window !== 'undefined' && 'EyeDropper' in window) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const eyeDropper = new (window as any).EyeDropper();
        const result = await eyeDropper.open();
        if (result?.sRGBHex) {
          handleSelectColor(result.sRGBHex);
        }
      } catch (err) {
        console.log('EyeDropper canceled or error:', err);
      }
    } else {
      alert('Eyedropper is supported on Chrome, Edge, and Chromium-based browsers.');
    }
  };

  return (
    <div className="flex items-center gap-2 p-1.5 bg-gray-900/90 border border-gray-700/60 rounded-2xl shadow-xl backdrop-blur-md">
      {/* Current Color Indicator & Native Picker */}
      <Tooltip content="Custom color picker">
        <label className="relative flex items-center justify-center cursor-pointer p-0.5">
          <div
            className="w-7 h-7 rounded-xl border-2 border-gray-600 shadow-inner transition-transform hover:scale-110"
            style={{ backgroundColor: color }}
          />
          <input
            type="color"
            value={color.startsWith('#') ? color : '#3B82F6'}
            onChange={(e) => handleSelectColor(e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            aria-label="Color input"
          />
        </label>
      </Tooltip>

      {/* Eyedropper button */}
      <Tooltip content="Eyedropper (Pick color from screen)">
        <button
          type="button"
          onClick={handleEyeDropper}
          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          aria-label="Eyedropper"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <path d="m2 22 1-1h3l9-9"/><path d="M3 21v-3l9-9"/><path d="m15 6 3.4-3.4a2.1 2.1 0 1 1 3 3L18 9l-3-3Z"/>
          </svg>
        </button>
      </Tooltip>

      {/* Hex input */}
      <div className="flex items-center bg-gray-800 border border-gray-700 rounded-lg px-2 py-0.5 text-xs font-mono">
        <input
          type="text"
          value={hexInput}
          onChange={handleHexChange}
          maxLength={7}
          className="w-16 bg-transparent text-white focus:outline-none uppercase"
          placeholder="#3B82F6"
        />
      </div>

      <div className="w-px h-5 bg-gray-700/60" />

      {/* Preset palette */}
      <div className="flex items-center gap-1">
        {PRESET_PALETTE.map((c) => (
          <Tooltip key={c} content={c}>
            <button
              type="button"
              onClick={() => handleSelectColor(c)}
              className={`w-5 h-5 rounded-md transition-all hover:scale-115 ${
                color.toLowerCase() === c.toLowerCase()
                  ? 'ring-2 ring-blue-400 ring-offset-1 ring-offset-gray-900 scale-110'
                  : 'hover:opacity-90'
              }`}
              style={{ backgroundColor: c }}
              aria-label={`Color ${c}`}
            />
          </Tooltip>
        ))}
      </div>

      <div className="w-px h-5 bg-gray-700/60" />

      {/* Recent colors */}
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-gray-400 uppercase font-semibold mr-1">Recent</span>
        {recentColors.map((c, i) => (
          <Tooltip key={`${c}-${i}`} content={c}>
            <button
              type="button"
              onClick={() => handleSelectColor(c)}
              className="w-4 h-4 rounded-full border border-gray-700 transition-transform hover:scale-120"
              style={{ backgroundColor: c }}
              aria-label={`Recent color ${c}`}
            />
          </Tooltip>
        ))}
      </div>
    </div>
  );
};
