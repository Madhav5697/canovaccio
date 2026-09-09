import React, { useState, useRef } from 'react';
import { Tooltip } from './Tooltip';
import { DrawTool } from '../types';

// ── Icons ─────────────────────────────────────────────────────────────────────

const PencilIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" />
  </svg>
);

const BrushIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="m9.06 11.9 8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08"/><path d="M7.07 14.94c-1.66 0-3 1.35-3 3 0 1.96-1.6 2.06-2.07 2.06 2.5 1 5.5.5 7.07-1.06 1.57-1.57 1.57-4 0-5.57z"/>
  </svg>
);

const EraserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="m7 21-4.3-4.3a1 1 0 0 1 0-1.4l12-12a1 1 0 0 1 1.4 0l4.3 4.3a1 1 0 0 1 0 1.4l-12 12a1 1 0 0 1-1.4 0Z"/><path d="m22 21-10 0"/>
  </svg>
);

const FillIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="m19 11-8-8-8.6 8.6a2 2 0 0 0 0 2.8l5.2 5.2c.8.8 2 .8 2.8 0L19 11Z"/><path d="m5 2 5 5"/><path d="M2 13h15"/><path d="M22 20a2 2 0 1 1-4 0c0-1.6 1.7-2.4 2-4 .3 1.6 2 2.4 2 4Z"/>
  </svg>
);

const LineIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
    <line x1="5" y1="19" x2="19" y2="5" />
  </svg>
);

const ArrowIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <line x1="5" y1="19" x2="19" y2="5" /><polyline points="12 5 19 5 19 12" />
  </svg>
);

const RectIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <rect x="3" y="3" width="18" height="18" rx="2" />
  </svg>
);

const TriangleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M12 3 L21 20 L3 20 Z" />
  </svg>
);

const CircleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
    <circle cx="12" cy="12" r="9" />
  </svg>
);

const SelectIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M3 3l7 18 3-7 7-3L3 3z" />
  </svg>
);

const TextIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <polyline points="4 7 4 4 20 4 20 7" /><line x1="12" y1="4" x2="12" y2="20" /><line x1="9" y1="20" x2="15" y2="20" />
  </svg>
);

const ImageIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
  </svg>
);

const PanIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/><path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>
  </svg>
);

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" />
  </svg>
);

const UndoIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M3 7v6h6" /><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
  </svg>
);

const RedoIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M21 7v6h-6" /><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" />
  </svg>
);

const ExportIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const HelpIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

// ── Toolbar Props ─────────────────────────────────────────────────────────────

interface ToolbarProps {
  tool: DrawTool;
  color: string;
  brushSize: number;
  canUndo: boolean;
  canRedo: boolean;
  onToolChange: (tool: DrawTool) => void;
  onBrushSizeChange: (size: number) => void;
  onImageUpload: (file: File) => void;
  onClear: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onExport: () => void;
  onHelp: () => void;
  isDark?: boolean;
}

interface ToolButtonProps {
  icon: React.ReactNode;
  tooltip: string;
  isActive?: boolean;
  disabled?: boolean;
  isDark?: boolean;
  onClick: () => void;
}

const ToolButton: React.FC<ToolButtonProps> = ({ icon, tooltip, isActive, disabled, isDark = true, onClick }) => (
  <Tooltip content={tooltip} position="right">
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        p-2 rounded-xl transition-all duration-150 flex items-center justify-center
        ${isActive
          ? isDark
            ? 'bg-zinc-100 text-zinc-950 shadow-md shadow-white/10'
            : 'bg-zinc-900 text-white shadow-md shadow-black/10'
          : isDark
          ? 'text-zinc-400 hover:text-white hover:bg-zinc-800'
          : 'text-gray-500 hover:text-black hover:bg-gray-100'
        }
        ${disabled ? 'opacity-30 cursor-not-allowed hover:bg-transparent' : 'cursor-pointer'}
      `}
      aria-label={tooltip}
      aria-pressed={isActive}
    >
      {icon}
    </button>
  </Tooltip>
);

const SectionDivider = ({ label, isDark = true }: { label?: string; isDark?: boolean }) => (
  <div className="w-full my-1">
    <div className={`w-full h-px ${isDark ? 'bg-zinc-800' : 'bg-gray-200'}`} />
    {label && (
      <div className={`text-[9px] font-bold uppercase tracking-wider text-center mt-1 ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>
        {label}
      </div>
    )}
  </div>
);

export const Toolbar: React.FC<ToolbarProps> = ({
  tool,
  color,
  brushSize,
  canUndo,
  canRedo,
  onToolChange,
  onBrushSizeChange,
  onImageUpload,
  onClear,
  onUndo,
  onRedo,
  onExport,
  onHelp,
  isDark = true,
}) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClearClick = () => {
    if (showClearConfirm) {
      onClear();
      setShowClearConfirm(false);
    } else {
      setShowClearConfirm(true);
      setTimeout(() => setShowClearConfirm(false), 2500);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageUpload(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <aside
      className={`flex flex-col items-center p-1.5 border rounded-2xl shadow-2xl w-13 backdrop-blur-md overflow-y-auto max-h-[calc(100vh-100px)] scrollbar-none transition-colors duration-300 ${
        isDark
          ? 'bg-zinc-900/90 border-zinc-800 text-zinc-100 shadow-2xl'
          : 'bg-white/90 border-gray-200/90 text-gray-900 shadow-xl'
      }`}
      role="toolbar"
      aria-label="Drawing tools"
    >
      {/* SECTION: DRAWING */}
      <div className={`text-[9px] font-bold uppercase tracking-wider text-center mb-1 ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>
        Draw
      </div>
      <div className="flex flex-col gap-1">
        <ToolButton icon={<PencilIcon />} tooltip="Pencil (P)" isActive={tool === 'pencil'} isDark={isDark} onClick={() => onToolChange('pencil')} />
        <ToolButton icon={<BrushIcon />} tooltip="Brush (B)" isActive={tool === 'brush'} isDark={isDark} onClick={() => onToolChange('brush')} />
        <ToolButton icon={<EraserIcon />} tooltip="Eraser (E)" isActive={tool === 'eraser'} isDark={isDark} onClick={() => onToolChange('eraser')} />
        <ToolButton icon={<FillIcon />} tooltip="Fill / Bucket (F)" isActive={tool === 'fill'} isDark={isDark} onClick={() => onToolChange('fill')} />
      </div>

      <SectionDivider label="Shapes" isDark={isDark} />

      {/* SECTION: SHAPES */}
      <div className="flex flex-col gap-1">
        <ToolButton icon={<LineIcon />} tooltip="Line (L)" isActive={tool === 'line'} isDark={isDark} onClick={() => onToolChange('line')} />
        <ToolButton icon={<ArrowIcon />} tooltip="Arrow" isActive={tool === 'arrow'} isDark={isDark} onClick={() => onToolChange('arrow')} />
        <ToolButton icon={<RectIcon />} tooltip="Rectangle (R)" isActive={tool === 'rectangle'} isDark={isDark} onClick={() => onToolChange('rectangle')} />
        <ToolButton icon={<TriangleIcon />} tooltip="Triangle" isActive={tool === 'triangle'} isDark={isDark} onClick={() => onToolChange('triangle')} />
        <ToolButton icon={<CircleIcon />} tooltip="Circle (C)" isActive={tool === 'circle'} isDark={isDark} onClick={() => onToolChange('circle')} />
      </div>

      <SectionDivider label="Objects" isDark={isDark} />

      {/* SECTION: OBJECTS */}
      <div className="flex flex-col gap-1">
        <ToolButton icon={<SelectIcon />} tooltip="Select / Move (V)" isActive={tool === 'select'} isDark={isDark} onClick={() => onToolChange('select')} />
        <ToolButton icon={<TextIcon />} tooltip="Text Tool (T)" isActive={tool === 'text'} isDark={isDark} onClick={() => onToolChange('text')} />
        <ToolButton
          icon={<ImageIcon />}
          tooltip="Upload Image"
          isDark={isDark}
          onClick={() => fileInputRef.current?.click()}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png, image/jpeg, image/gif, image/webp"
          onChange={handleFileChange}
          className="hidden"
          aria-label="Upload image file"
        />
      </div>

      <SectionDivider label="Canvas" isDark={isDark} />

      {/* SECTION: CANVAS */}
      <div className="flex flex-col gap-1">
        <ToolButton icon={<PanIcon />} tooltip="Pan Canvas (Hold Space)" isActive={tool === 'pan'} isDark={isDark} onClick={() => onToolChange('pan')} />
      </div>

      <SectionDivider label="Action" isDark={isDark} />

      {/* SECTION: ACTIONS */}
      <div className="flex flex-col gap-1">
        <ToolButton icon={<UndoIcon />} tooltip="Undo (Ctrl+Z)" disabled={!canUndo} isDark={isDark} onClick={onUndo} />
        <ToolButton icon={<RedoIcon />} tooltip="Redo (Ctrl+Shift+Z)" disabled={!canRedo} isDark={isDark} onClick={onRedo} />
        <Tooltip content={showClearConfirm ? 'Click to confirm' : 'Clear Canvas'} position="right">
          <button
            onClick={handleClearClick}
            className={`p-2 rounded-xl transition-all ${
              showClearConfirm
                ? 'bg-rose-600 text-white animate-pulse'
                : isDark
                ? 'text-zinc-400 hover:text-rose-400 hover:bg-zinc-800'
                : 'text-gray-500 hover:text-rose-600 hover:bg-gray-100'
            }`}
            aria-label="Clear canvas"
          >
            <TrashIcon />
          </button>
        </Tooltip>
        <ToolButton icon={<ExportIcon />} tooltip="Export Canvas (Ctrl+S)" isDark={isDark} onClick={onExport} />
        <ToolButton icon={<HelpIcon />} tooltip="Shortcuts & Help (?)" isDark={isDark} onClick={onHelp} />
      </div>

      <SectionDivider isDark={isDark} />

      {/* Brush size slider */}
      <Tooltip content={`Brush: ${brushSize}px`} position="right">
        <div className="w-full px-1 py-1 flex flex-col items-center">
          <input
            type="range"
            min={1}
            max={50}
            value={brushSize}
            onChange={(e) => onBrushSizeChange(Number(e.target.value))}
            className={`w-8 h-1 rounded-full appearance-none cursor-pointer ${
              isDark ? 'bg-zinc-700 accent-zinc-100' : 'bg-gray-300 accent-zinc-900'
            }`}
            aria-label="Brush size"
          />
          <div
            className="rounded-full mt-1.5 shadow-sm border border-black/10"
            style={{
              width: Math.min(Math.max(brushSize / 2, 4), 16),
              height: Math.min(Math.max(brushSize / 2, 4), 16),
              backgroundColor: color,
            }}
          />
        </div>
      </Tooltip>
    </aside>
  );
};
