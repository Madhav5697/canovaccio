import React, { useEffect, useRef, useCallback, useState } from 'react';
import { DrawTool, DrawEvent, UserInfo, CursorPosition, ObjectUpdatePayload, ObjectDeletePayload } from '../types';
import { useCanvas } from '../hooks/useCanvas';
import { Toolbar } from './Toolbar';
import { ColorPickerBar } from './ColorPickerBar';
import { LiveCursors } from './LiveCursors';
import { getToolCursor } from '../utils/helpers';

interface DrawingCanvasProps {
  roomId: string;
  userId: string;
  userColor: string;
  users: UserInfo[];
  tool: DrawTool;
  color: string;
  brushSize: number;
  fontSize: number;
  fontFamily: string;
  isBold: boolean;
  isItalic: boolean;
  stickyColor: string;
  drawingHistory: DrawEvent[];
  remoteCursors: Map<string, CursorPosition>;
  onToolChange: (tool: DrawTool) => void;
  onColorChange: (color: string) => void;
  onBrushSizeChange: (size: number) => void;
  onFontSizeChange: (size: number) => void;
  onFontFamilyChange: (family: string) => void;
  onBoldToggle: () => void;
  onItalicToggle: () => void;
  onStickyColorChange: (color: string) => void;
  onExport: () => void;
  onHelp: () => void;
  onRemoteDrawEvent: (handler: (event: DrawEvent) => void) => void;
  onRemoteObjectUpdate: (handler: (payload: ObjectUpdatePayload) => void) => void;
  onRemoteObjectDelete: (handler: (payload: ObjectDeletePayload) => void) => void;
  onRemoteClear: (handler: () => void) => void;
  onRemoteUndo: (handler: (strokeId: string) => void) => void;
  onRemoteRedo: (handler: (strokeId: string) => void) => void;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
}

const STICKY_PALETTE = [
  { label: 'Yellow', color: '#FEF08A' },
  { label: 'Green', color: '#BBF7D0' },
  { label: 'Blue', color: '#BFDBFE' },
  { label: 'Pink', color: '#FBCFE8' },
  { label: 'Purple', color: '#DDD6FE' },
];

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  roomId,
  userId,
  userColor,
  users,
  tool,
  color,
  brushSize,
  fontSize,
  fontFamily,
  isBold,
  isItalic,
  stickyColor,
  drawingHistory,
  remoteCursors,
  onToolChange,
  onColorChange,
  onBrushSizeChange,
  onFontSizeChange,
  onFontFamilyChange,
  onBoldToggle,
  onItalicToggle,
  onStickyColorChange,
  onExport,
  onHelp,
  onRemoteDrawEvent,
  onRemoteObjectUpdate,
  onRemoteObjectDelete,
  onRemoteClear,
  onRemoteUndo,
  onRemoteRedo,
  onCanvasReady,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [inlineText, setInlineText] = useState('');

  const {
    canvasRef,
    previewCanvasRef,
    zoom,
    pan,
    setZoom,
    resetZoom,
    initCanvas,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleRemoteDrawEvent,
    handleRemoteObjectUpdate,
    handleRemoteObjectDelete,
    handleRemoteClear,
    handleRemoteUndo,
    handleRemoteRedo,
    clearCanvas,
    undo,
    redo,
    canUndo,
    canRedo,
    textInputState,
    setTextInputState,
    submitText,
    handleImageUpload,
    selectedObjectId,
    deleteSelectedObject,
  } = useCanvas({
    roomId,
    userId,
    userColor,
    tool,
    color,
    brushSize,
    fontSize,
    fontFamily,
    isBold,
    isItalic,
    stickyColor,
    drawingHistory,
  });

  // Register remote event handlers
  useEffect(() => {
    onRemoteDrawEvent(handleRemoteDrawEvent);
    onRemoteObjectUpdate(handleRemoteObjectUpdate);
    onRemoteObjectDelete(handleRemoteObjectDelete);
    onRemoteClear(handleRemoteClear);
    onRemoteUndo(handleRemoteUndo);
    onRemoteRedo(handleRemoteRedo);
  }, [
    onRemoteDrawEvent,
    onRemoteObjectUpdate,
    onRemoteObjectDelete,
    onRemoteClear,
    onRemoteUndo,
    onRemoteRedo,
    handleRemoteDrawEvent,
    handleRemoteObjectUpdate,
    handleRemoteObjectDelete,
    handleRemoteClear,
    handleRemoteUndo,
    handleRemoteRedo,
  ]);

  useEffect(() => {
    initCanvas();
    if (canvasRef.current && onCanvasReady) {
      onCanvasReady(canvasRef.current);
    }
  }, [initCanvas, onCanvasReady, canvasRef]);

  // Attach mouse/touch events to canvas
  const attachEvents = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('mousedown', handlePointerDown);
    canvas.addEventListener('mousemove', handlePointerMove);
    canvas.addEventListener('mouseup', handlePointerUp);
    canvas.addEventListener('mouseleave', handlePointerUp);

    canvas.addEventListener('touchstart', handlePointerDown, { passive: false });
    canvas.addEventListener('touchmove', handlePointerMove, { passive: false });
    canvas.addEventListener('touchend', handlePointerUp, { passive: false });

    return () => {
      canvas.removeEventListener('mousedown', handlePointerDown);
      canvas.removeEventListener('mousemove', handlePointerMove);
      canvas.removeEventListener('mouseup', handlePointerUp);
      canvas.removeEventListener('mouseleave', handlePointerUp);
      canvas.removeEventListener('touchstart', handlePointerDown);
      canvas.removeEventListener('touchmove', handlePointerMove);
      canvas.removeEventListener('touchend', handlePointerUp);
    };
  }, [canvasRef, handlePointerDown, handlePointerMove, handlePointerUp]);

  useEffect(() => {
    return attachEvents();
  }, [attachEvents]);

  // Keyboard shortcuts listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcut keys when typing inside an input or textarea
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }

      if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z')
      ) {
        e.preventDefault();
        redo();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        onExport();
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        deleteSelectedObject();
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'v':
          onToolChange('select');
          break;
        case 'p':
          onToolChange('pencil');
          break;
        case 'b':
          onToolChange('brush');
          break;
        case 'e':
          onToolChange('eraser');
          break;
        case 'f':
          onToolChange('fill');
          break;
        case 't':
          onToolChange('text');
          break;
        case 'r':
          onToolChange('rectangle');
          break;
        case 'c':
          onToolChange('circle');
          break;
        case 'l':
          onToolChange('line');
          break;
        case '?':
          onHelp();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, deleteSelectedObject, onToolChange, onExport, onHelp]);

  // Submit inline text on Enter
  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitText(inlineText);
    setInlineText('');
  };

  const cursorStyle: React.CSSProperties = {
    cursor: getToolCursor(tool, color),
  };

  return (
    <div className="flex h-full gap-3 relative overflow-hidden select-none">
      {/* Sidebar Toolbar */}
      <Toolbar
        tool={tool}
        color={color}
        brushSize={brushSize}
        canUndo={canUndo}
        canRedo={canRedo}
        onToolChange={onToolChange}
        onBrushSizeChange={onBrushSizeChange}
        onImageUpload={handleImageUpload}
        onClear={clearCanvas}
        onUndo={undo}
        onRedo={redo}
        onExport={onExport}
        onHelp={onHelp}
      />

      {/* Main Canvas Container */}
      <div
        ref={containerRef}
        className="relative flex-1 rounded-2xl overflow-hidden border border-gray-700/60 bg-white shadow-2xl flex flex-col"
        style={{ touchAction: 'none' }}
      >
        {/* Top Floating Color & Tool Options Bar */}
        <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between pointer-events-none flex-wrap gap-2">
          {/* Color Picker Bar */}
          <div className="pointer-events-auto">
            <ColorPickerBar color={color} onChange={onColorChange} />
          </div>

          {/* Text Tool Options Bar (visible when tool is 'text') */}
          {tool === 'text' && (
            <div className="pointer-events-auto flex items-center gap-2 p-1.5 bg-gray-900/90 border border-gray-700/60 rounded-2xl shadow-xl backdrop-blur-md text-white text-xs">
              <select
                value={fontSize}
                onChange={(e) => onFontSizeChange(Number(e.target.value))}
                className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-white focus:outline-none"
              >
                {[14, 18, 24, 32, 48, 64].map((s) => (
                  <option key={s} value={s}>
                    {s}px
                  </option>
                ))}
              </select>

              <select
                value={fontFamily}
                onChange={(e) => onFontFamilyChange(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-white focus:outline-none"
              >
                <option value="Inter, sans-serif">Sans-Serif</option>
                <option value="Georgia, serif">Serif</option>
                <option value="Courier New, monospace">Monospace</option>
                <option value="Impact, sans-serif">Impact</option>
              </select>

              <button
                type="button"
                onClick={onBoldToggle}
                className={`px-2 py-1 rounded-lg font-bold border transition-colors ${
                  isBold
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'
                }`}
              >
                B
              </button>

              <button
                type="button"
                onClick={onItalicToggle}
                className={`px-2 py-1 rounded-lg italic font-serif border transition-colors ${
                  isItalic
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'
                }`}
              >
                I
              </button>
            </div>
          )}

          {/* Sticky Note Palette (visible when tool is 'sticky') */}
          {tool === 'sticky' && (
            <div className="pointer-events-auto flex items-center gap-1.5 p-1.5 bg-gray-900/90 border border-gray-700/60 rounded-2xl shadow-xl backdrop-blur-md">
              <span className="text-[10px] uppercase font-bold text-gray-400 px-1">Note Color:</span>
              {STICKY_PALETTE.map((p) => (
                <button
                  key={p.color}
                  type="button"
                  onClick={() => onStickyColorChange(p.color)}
                  className={`w-5 h-5 rounded-md border border-gray-700 transition-transform ${
                    stickyColor === p.color ? 'ring-2 ring-blue-400 scale-110' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: p.color }}
                  title={p.label}
                />
              ))}
            </div>
          )}

          {/* Selected Object Banner (when object is selected) */}
          {selectedObjectId && (
            <div className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 bg-gray-900/90 border border-blue-500/50 rounded-2xl shadow-xl backdrop-blur-md text-white text-xs">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span>Object Selected</span>
              <button
                type="button"
                onClick={deleteSelectedObject}
                className="ml-2 px-2 py-0.5 bg-red-600/80 hover:bg-red-600 rounded-md font-semibold text-white transition-colors"
              >
                Delete
              </button>
            </div>
          )}
        </div>

        {/* Main drawing canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={cursorStyle}
          aria-label="Drawing canvas"
          role="img"
        />

        {/* Preview canvas for ghost shapes */}
        <canvas
          ref={previewCanvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          aria-hidden="true"
        />

        {/* Live Multiplayer Cursors */}
        <LiveCursors
          cursors={remoteCursors}
          users={users}
          currentUserId={userId}
          zoom={zoom}
          pan={pan}
        />

        {/* Text Tool Floating Input Modal */}
        {textInputState && (
          <div
            className="absolute z-40 p-2 bg-gray-900/95 border border-blue-500 rounded-xl shadow-2xl backdrop-blur-md animate-scale-up"
            style={{
              left: Math.max(10, textInputState.x - (containerRef.current?.getBoundingClientRect().left ?? 0)),
              top: Math.max(10, textInputState.y - (containerRef.current?.getBoundingClientRect().top ?? 0)),
            }}
          >
            <form onSubmit={handleTextSubmit} className="flex flex-col gap-2">
              <textarea
                autoFocus
                value={inlineText}
                onChange={(e) => setInlineText(e.target.value)}
                placeholder="Type your text here…"
                rows={2}
                className="w-56 p-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTextInputState(null)}
                  className="px-2 py-1 text-xs text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-xs font-semibold"
                >
                  Place Text
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Empty state hint */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
          <p className="text-gray-300/25 text-2xl font-light tracking-wide">
            Start sketching, collaborating, or creating notes…
          </p>
        </div>

        {/* Bottom Right Floating Zoom & Pan Navigation Controls */}
        <div className="absolute bottom-4 right-4 z-30 flex items-center gap-1.5 p-1.5 bg-gray-900/90 border border-gray-700/60 rounded-2xl shadow-xl backdrop-blur-md text-white text-xs">
          <button
            type="button"
            onClick={() => setZoom(zoom - 0.25)}
            disabled={zoom <= 0.25}
            className="w-7 h-7 flex items-center justify-center bg-gray-800 hover:bg-gray-700 disabled:opacity-30 rounded-xl transition-colors font-bold text-sm"
            aria-label="Zoom out"
          >
            −
          </button>

          <span className="w-12 text-center font-mono font-bold text-blue-400">
            {Math.round(zoom * 100)}%
          </span>

          <button
            type="button"
            onClick={() => setZoom(zoom + 0.25)}
            disabled={zoom >= 2.0}
            className="w-7 h-7 flex items-center justify-center bg-gray-800 hover:bg-gray-700 disabled:opacity-30 rounded-xl transition-colors font-bold text-sm"
            aria-label="Zoom in"
          >
            +
          </button>

          <div className="w-px h-4 bg-gray-700/60 mx-0.5" />

          <button
            type="button"
            onClick={resetZoom}
            className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 rounded-xl font-medium text-[11px] text-gray-300 hover:text-white transition-colors"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};
