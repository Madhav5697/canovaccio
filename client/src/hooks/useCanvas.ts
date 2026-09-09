import { useRef, useCallback, useEffect, useState, useMemo } from 'react';
import { DrawEvent, DrawTool, Point, ObjectUpdatePayload, ObjectDeletePayload } from '../types';
import { socketService } from '../services/socketService';
import {
  setupCanvas,
  drawStroke,
  drawLine,
  drawArrow,
  drawRectangle,
  drawTriangle,
  drawCircle,
  floodFill,
  replayHistory,
} from '../utils/canvasUtils';
import { generateId, getCanvasPoint, throttle } from '../utils/helpers';

interface UseCanvasOptions {
  roomId: string | null;
  userId: string;
  userColor: string;
  tool: DrawTool;
  color: string;
  brushSize: number;
  fontSize: number;
  fontFamily: string;
  isBold: boolean;
  isItalic: boolean;
  drawingHistory: DrawEvent[];
}

export function useCanvas({
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
  drawingHistory,
}: UseCanvasOptions) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const isDrawingRef = useRef(false);
  const currentStrokeRef = useRef<Point[]>([]);
  const currentStrokeIdRef = useRef<string>('');

  // Zoom & Pan state — keep both React state (for renders) AND refs (for stable callbacks)
  const [zoom, setZoomState] = useState<number>(1.0);
  const [pan, setPanState] = useState<Point>({ x: 0, y: 0 });
  const isPanningRef = useRef(false);
  const lastPanPointRef = useRef<Point>({ x: 0, y: 0 });

  // Always-current refs — callbacks read from here to avoid stale closures
  const panRef = useRef<Point>({ x: 0, y: 0 });
  const zoomRef = useRef<number>(1.0);

  // Keep refs in sync with state
  useEffect(() => { panRef.current = pan; }, [pan]);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);

  // Tool / drawing settings refs — so pointer handlers don't need to be recreated on tool change
  const toolRef = useRef<DrawTool>(tool);
  const colorRef = useRef<string>(color);
  const brushSizeRef = useRef<number>(brushSize);
  const fontSizeRef = useRef<number>(fontSize);
  const fontFamilyRef = useRef<string>(fontFamily);
  const isBoldRef = useRef<boolean>(isBold);
  const isItalicRef = useRef<boolean>(isItalic);
  const roomIdRef = useRef<string | null>(roomId);
  const userIdRef = useRef<string>(userId);
  const userColorRef = useRef<string>(userColor);

  useEffect(() => { toolRef.current = tool; }, [tool]);
  useEffect(() => { colorRef.current = color; }, [color]);
  useEffect(() => { brushSizeRef.current = brushSize; }, [brushSize]);
  useEffect(() => { fontSizeRef.current = fontSize; }, [fontSize]);
  useEffect(() => { fontFamilyRef.current = fontFamily; }, [fontFamily]);
  useEffect(() => { isBoldRef.current = isBold; }, [isBold]);
  useEffect(() => { isItalicRef.current = isItalic; }, [isItalic]);
  useEffect(() => { roomIdRef.current = roomId; }, [roomId]);
  useEffect(() => { userIdRef.current = userId; }, [userId]);
  useEffect(() => { userColorRef.current = userColor; }, [userColor]);

  // Selection & Object Manipulation
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const selectedObjectIdRef = useRef<string | null>(null);
  const isDraggingObjectRef = useRef(false);
  const dragOffsetRef = useRef<Point>({ x: 0, y: 0 });

  useEffect(() => { selectedObjectIdRef.current = selectedObjectId; }, [selectedObjectId]);

  // Text tool active input trigger
  const [textInputState, setTextInputState] = useState<{
    x: number;
    y: number;
    canvasX: number;
    canvasY: number;
    text: string;
  } | null>(null);

  // Undo/Redo stacks
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const localHistoryRef = useRef<DrawEvent[]>([]);

  // Dual canvas for preview overlay
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewCtxRef = useRef<CanvasRenderingContext2D | null>(null);

  // Initialize canvas
  // Replay history — reads pan/zoom from refs, so it's stable
  const redrawAll = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;

    const pan = panRef.current;
    const zoom = zoomRef.current;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    replayHistory(
      ctx,
      canvas,
      localHistoryRef.current,
      () => {
        redrawAll();
      },
      zoom,
      pan
    );

    ctx.restore();
  }, []); // stable — no dependencies needed

  // Initialize canvas
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    ctxRef.current = setupCanvas(canvas);

    const preview = previewCanvasRef.current;
    if (preview) {
      previewCtxRef.current = setupCanvas(preview);
    }
    redrawAll();
  }, [redrawAll]);

  useEffect(() => {
    localHistoryRef.current = [...drawingHistory];
    redrawAll();
    const strokeIds = drawingHistory
      .filter((e) => e.type === 'draw_end' && !e.isDeleted)
      .map((e) => e.strokeId);
    setUndoStack(strokeIds);
  }, [drawingHistory, redrawAll]);

  // Redraw when pan or zoom changes (triggered by state changes)
  useEffect(() => {
    redrawAll();
  }, [pan, zoom, redrawAll]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current || !ctxRef.current) return;
      ctxRef.current = setupCanvas(canvasRef.current);
      if (previewCanvasRef.current) {
        previewCtxRef.current = setupCanvas(previewCanvasRef.current);
      }
      redrawAll();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [redrawAll]);

  // Zoom controls
  const setZoom = useCallback((newZoom: number) => {
    const clamped = Math.min(Math.max(newZoom, 0.25), 2.0);
    setZoomState(clamped);
  }, []);

  const resetZoom = useCallback(() => {
    setZoomState(1.0);
    setPanState({ x: 0, y: 0 });
  }, []);

  // Convert raw screen point to canvas logical coordinates (taking pan & zoom into account)
  // Reads from refs so it doesn't need to be in any dependency array
  const screenToCanvasPoint = useCallback((screenPoint: Point): Point => {
    const pan = panRef.current;
    const zoom = zoomRef.current;
    return {
      x: (screenPoint.x - pan.x) / zoom,
      y: (screenPoint.y - pan.y) / zoom,
    };
  }, []); // stable

  // Live cursor broadcasting (throttled) — stable, reads from refs
  const broadcastCursorMove = useMemo(
    () =>
      throttle((canvasPoint: Point) => {
        if (!roomIdRef.current) return;
        socketService.sendCursorMove({
          userId: userIdRef.current,
          color: userColorRef.current,
          x: canvasPoint.x,
          y: canvasPoint.y,
        });
      }, 30),
    [] // stable — reads from refs
  );

  // Shape ghost preview rendering — reads from refs
  const drawPreview = useCallback(
    (startPoint: Point, currentPoint: Point) => {
      const preview = previewCanvasRef.current;
      const ctx = previewCtxRef.current;
      if (!preview || !ctx) return;

      const pan = panRef.current;
      const zoom = zoomRef.current;
      const tool = toolRef.current;
      const color = colorRef.current;
      const brushSize = brushSizeRef.current;

      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, preview.width, preview.height);
      ctx.restore();

      ctx.save();
      ctx.translate(pan.x, pan.y);
      ctx.scale(zoom, zoom);

      if (tool === 'line') {
        drawLine(ctx, startPoint, currentPoint, color, brushSize);
      } else if (tool === 'arrow') {
        drawArrow(ctx, startPoint, currentPoint, color, brushSize);
      } else if (tool === 'rectangle') {
        drawRectangle(ctx, startPoint, currentPoint, color, brushSize);
      } else if (tool === 'triangle') {
        drawTriangle(ctx, startPoint, currentPoint, color, brushSize);
      } else if (tool === 'circle') {
        drawCircle(ctx, startPoint, currentPoint, color, brushSize);
      }

      ctx.restore();
    },
    [] // stable — reads from refs
  );

  const clearPreview = useCallback(() => {
    const preview = previewCanvasRef.current;
    const ctx = previewCtxRef.current;
    if (!preview || !ctx) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, preview.width, preview.height);
    ctx.restore();
  }, []);

  // ── Pointer down ─────────────────────────────────────────────────────────────
  const handlePointerDown = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!canvasRef.current || !roomIdRef.current) return;
      const screenPoint = getCanvasPoint(e, canvasRef.current);
      const canvasPoint = screenToCanvasPoint(screenPoint);
      const tool = toolRef.current;
      const color = colorRef.current;
      const brushSize = brushSizeRef.current;
      const userId = userIdRef.current;

      // Pan tool or Middle click drag
      const isMiddleClick = e instanceof MouseEvent && e.button === 1;
      if (tool === 'pan' || isMiddleClick) {
        isPanningRef.current = true;
        lastPanPointRef.current = { x: screenPoint.x, y: screenPoint.y };
        return;
      }

      // Text tool trigger
      if (tool === 'text') {
        const rect = canvasRef.current.getBoundingClientRect();
        const screenX = screenPoint.x + rect.left;
        const screenY = screenPoint.y + rect.top;

        setTextInputState({
          x: screenX,
          y: screenY,
          canvasX: canvasPoint.x,
          canvasY: canvasPoint.y,
          text: '',
        });
        return;
      }

      // Fill tool
      if (tool === 'fill') {
        const ctx = ctxRef.current;
        if (ctx && canvasRef.current) {
          const pan = panRef.current;
          const zoom = zoomRef.current;
          floodFill(ctx, canvasRef.current, canvasPoint.x, canvasPoint.y, color, zoom, pan);
          const fillEvent: DrawEvent = {
            type: 'draw_end',
            tool: 'fill',
            color,
            brushSize: 1,
            points: [canvasPoint],
            userId,
            timestamp: Date.now(),
            strokeId: generateId(),
          };
          socketService.sendDrawEvent(fillEvent);
          localHistoryRef.current.push(fillEvent);
          setUndoStack((prev) => [...prev, fillEvent.strokeId]);
        }
        return;
      }

      // Select tool
      if (tool === 'select') {
        const clickedObj = [...localHistoryRef.current]
          .reverse()
          .find((event) => {
            if (event.isDeleted || event.type !== 'draw_end') return false;
            const p = event.points[0];
            if (!p) return false;
            const w = event.width ?? 150;
            const h = event.height ?? 150;
            return (
              canvasPoint.x >= p.x &&
              canvasPoint.x <= p.x + w &&
              canvasPoint.y >= p.y &&
              canvasPoint.y <= p.y + h
            );
          });

        if (clickedObj) {
          setSelectedObjectId(clickedObj.strokeId);
          isDraggingObjectRef.current = true;
          const p = clickedObj.points[0];
          dragOffsetRef.current = {
            x: canvasPoint.x - p.x,
            y: canvasPoint.y - p.y,
          };
        } else {
          setSelectedObjectId(null);
        }
        return;
      }

      // Freehand drawing & shapes
      isDrawingRef.current = true;
      currentStrokeRef.current = [canvasPoint];
      currentStrokeIdRef.current = generateId();

      const startEvent: DrawEvent = {
        type: 'draw_start',
        tool,
        color,
        brushSize,
        points: [canvasPoint],
        userId,
        timestamp: Date.now(),
        strokeId: currentStrokeIdRef.current,
      };
      socketService.sendDrawEvent(startEvent);
    },
    [screenToCanvasPoint, redrawAll] // stable refs used inside; only these stable callbacks needed
  );

  // ── Pointer move ─────────────────────────────────────────────────────────────
  const handlePointerMoveCore = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!canvasRef.current || !roomIdRef.current) return;
      const screenPoint = getCanvasPoint(e, canvasRef.current);
      const canvasPoint = screenToCanvasPoint(screenPoint);

      // Broadcast live cursor
      broadcastCursorMove(canvasPoint);

      // Pan movement
      if (isPanningRef.current) {
        const dx = screenPoint.x - lastPanPointRef.current.x;
        const dy = screenPoint.y - lastPanPointRef.current.y;
        lastPanPointRef.current = { x: screenPoint.x, y: screenPoint.y };
        setPanState((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
        return;
      }

      // Dragging selected object
      const selId = selectedObjectIdRef.current;
      if (isDraggingObjectRef.current && selId) {
        const obj = localHistoryRef.current.find((e) => e.strokeId === selId);
        if (obj && obj.points[0]) {
          const newX = canvasPoint.x - dragOffsetRef.current.x;
          const newY = canvasPoint.y - dragOffsetRef.current.y;
          obj.points[0] = { x: newX, y: newY };

          socketService.sendObjectUpdate({
            userId: userIdRef.current,
            strokeId: selId,
            points: obj.points,
            timestamp: Date.now(),
          });
          redrawAll();
        }
        return;
      }

      // Drawing move
      if (!isDrawingRef.current) return;
      currentStrokeRef.current.push(canvasPoint);
      const points = currentStrokeRef.current;

      const tool = toolRef.current;
      const color = colorRef.current;
      const brushSize = brushSizeRef.current;
      const pan = panRef.current;
      const zoom = zoomRef.current;

      if (tool === 'pencil' || tool === 'eraser' || tool === 'brush') {
        const ctx = ctxRef.current;
        if (ctx && points.length >= 2) {
          ctx.save();
          ctx.translate(pan.x, pan.y);
          ctx.scale(zoom, zoom);
          drawStroke(ctx, points.slice(-2), color, brushSize, tool);
          ctx.restore();
        }

        const moveEvent: DrawEvent = {
          type: 'draw_move',
          tool,
          color,
          brushSize,
          points: points.slice(-3),
          userId: userIdRef.current,
          timestamp: Date.now(),
          strokeId: currentStrokeIdRef.current,
        };
        socketService.sendDrawEvent(moveEvent);
      } else if (
        tool === 'line' ||
        tool === 'arrow' ||
        tool === 'rectangle' ||
        tool === 'triangle' ||
        tool === 'circle'
      ) {
        drawPreview(points[0], canvasPoint);
      }
    },
    [screenToCanvasPoint, broadcastCursorMove, drawPreview, redrawAll] // all stable
  );

  const handlePointerMove = useMemo(
    () => throttle((e: MouseEvent | TouchEvent) => handlePointerMoveCore(e), 16),
    [handlePointerMoveCore]
  );

  // ── Pointer up ───────────────────────────────────────────────────────────────
  const handlePointerUp = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (isPanningRef.current) {
        isPanningRef.current = false;
        return;
      }

      if (isDraggingObjectRef.current) {
        isDraggingObjectRef.current = false;
        return;
      }

      if (!isDrawingRef.current || !canvasRef.current || !roomIdRef.current) return;
      isDrawingRef.current = false;

      const screenPoint = getCanvasPoint(e, canvasRef.current);
      const canvasPoint = screenToCanvasPoint(screenPoint);
      const points = currentStrokeRef.current;

      if (points.length === 0 || points[points.length - 1] !== canvasPoint) {
        points.push(canvasPoint);
      }

      clearPreview();

      const tool = toolRef.current;
      const color = colorRef.current;
      const brushSize = brushSizeRef.current;
      const userId = userIdRef.current;

      if (
        tool === 'line' ||
        tool === 'arrow' ||
        tool === 'rectangle' ||
        tool === 'triangle' ||
        tool === 'circle'
      ) {
        if (points.length >= 2) {
          const endEvent: DrawEvent = {
            type: 'draw_end',
            tool,
            color,
            brushSize,
            points: [points[0], points[points.length - 1]],
            userId,
            timestamp: Date.now(),
            strokeId: currentStrokeIdRef.current,
          };
          socketService.sendDrawEvent(endEvent);
          localHistoryRef.current.push(endEvent);
          setUndoStack((prev) => [...prev, currentStrokeIdRef.current]);
          setRedoStack([]);
          redrawAll();
        }
      } else if (tool === 'pencil' || tool === 'eraser' || tool === 'brush') {
        if (points.length > 0) {
          const endEvent: DrawEvent = {
            type: 'draw_end',
            tool,
            color,
            brushSize,
            points,
            userId,
            timestamp: Date.now(),
            strokeId: currentStrokeIdRef.current,
          };
          socketService.sendDrawEvent(endEvent);
          localHistoryRef.current.push(endEvent);
          setUndoStack((prev) => [...prev, currentStrokeIdRef.current]);
          setRedoStack([]);
          redrawAll();
        }
      }

      currentStrokeRef.current = [];
    },
    [screenToCanvasPoint, clearPreview, redrawAll] // all stable
  );

  // Submit Text entry
  const submitText = useCallback(
    (textValue: string) => {
      if (!textInputState || !textValue.trim()) {
        setTextInputState(null);
        return;
      }

      const strokeId = generateId();
      const textEvent: DrawEvent = {
        type: 'draw_end',
        tool: 'text',
        color: colorRef.current,
        brushSize: brushSizeRef.current,
        points: [{ x: textInputState.canvasX, y: textInputState.canvasY }],
        userId: userIdRef.current,
        timestamp: Date.now(),
        strokeId,
        text: textValue,
        fontSize: fontSizeRef.current,
        fontFamily: fontFamilyRef.current,
        isBold: isBoldRef.current,
        isItalic: isItalicRef.current,
      };

      socketService.sendDrawEvent(textEvent);
      localHistoryRef.current.push(textEvent);
      setUndoStack((prev) => [...prev, strokeId]);
      setTextInputState(null);
      redrawAll();
    },
    [textInputState, redrawAll]
  );

  // Upload Image handler
  const handleImageUpload = useCallback(
    (file: File) => {
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        const imageUrl = evt.target?.result as string;
        if (!imageUrl) return;

        const pan = panRef.current;
        const zoom = zoomRef.current;
        const strokeId = generateId();
        const imageEvent: DrawEvent = {
          type: 'draw_end',
          tool: 'image',
          color: '#000000',
          brushSize: 1,
          points: [{ x: 100 - pan.x / zoom, y: 100 - pan.y / zoom }],
          userId: userIdRef.current,
          timestamp: Date.now(),
          strokeId,
          imageUrl,
          width: 250,
          height: 250,
        };

        socketService.sendDrawEvent(imageEvent);
        localHistoryRef.current.push(imageEvent);
        setUndoStack((prev) => [...prev, strokeId]);
        redrawAll();
      };
      reader.readAsDataURL(file);
    },
    [redrawAll]
  );

  // Delete selected object
  const deleteSelectedObject = useCallback(() => {
    if (!selectedObjectIdRef.current) return;
    const strokeId = selectedObjectIdRef.current;
    setSelectedObjectId(null);

    localHistoryRef.current = localHistoryRef.current.filter((e) => e.strokeId !== strokeId);
    socketService.sendObjectDelete({ userId: userIdRef.current, strokeId, timestamp: Date.now() });
    redrawAll();
  }, [redrawAll]);

  // ── Remote event handlers (all stable — read from refs) ─────────────────────

  const handleRemoteDrawEvent = useCallback(
    (event: DrawEvent) => {
      const ctx = ctxRef.current;
      if (!ctx) return;

      if (
        (event.type === 'draw_start' || event.type === 'draw_move') &&
        (event.tool === 'pencil' || event.tool === 'eraser' || event.tool === 'brush')
      ) {
        // Draw the incoming stroke segment directly — read current pan/zoom from refs
        const pan = panRef.current;
        const zoom = zoomRef.current;
        ctx.save();
        ctx.translate(pan.x, pan.y);
        ctx.scale(zoom, zoom);
        drawStroke(ctx, event.points, event.color, event.brushSize, event.tool);
        ctx.restore();
      } else if (event.type === 'draw_end') {
        localHistoryRef.current.push(event);
        redrawAll();
      }
    },
    [redrawAll] // stable — redrawAll itself is stable
  );

  const handleRemoteObjectUpdate = useCallback(
    (payload: ObjectUpdatePayload) => {
      const obj = localHistoryRef.current.find((e) => e.strokeId === payload.strokeId);
      if (obj) {
        if (payload.points) obj.points = payload.points;
        if (payload.transform) obj.transform = payload.transform;
        if (payload.color) obj.color = payload.color;
        if (payload.text !== undefined) obj.text = payload.text;
        redrawAll();
      }
    },
    [redrawAll]
  );

  const handleRemoteObjectDelete = useCallback(
    (payload: ObjectDeletePayload) => {
      localHistoryRef.current = localHistoryRef.current.filter((e) => e.strokeId !== payload.strokeId);
      if (selectedObjectIdRef.current === payload.strokeId) {
        setSelectedObjectId(null);
      }
      redrawAll();
    },
    [redrawAll]
  );

  const handleRemoteClear = useCallback(() => {
    localHistoryRef.current = [];
    setSelectedObjectId(null);
    setUndoStack([]);
    setRedoStack([]);
    redrawAll();
  }, [redrawAll]);

  const clearCanvas = useCallback(() => {
    localHistoryRef.current = [];
    setSelectedObjectId(null);
    setUndoStack([]);
    setRedoStack([]);
    socketService.sendClear();
    redrawAll();
  }, [redrawAll]);

  const undo = useCallback(() => {
    if (undoStack.length === 0) return;
    const strokeId = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [...prev, strokeId]);

    localHistoryRef.current = localHistoryRef.current.filter((e) => e.strokeId !== strokeId);
    redrawAll();
    socketService.sendUndo(strokeId);
  }, [undoStack, redrawAll]);

  const redo = useCallback(() => {
    if (redoStack.length === 0) return;
    const strokeId = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));
    setUndoStack((prev) => [...prev, strokeId]);
    socketService.sendRedo(strokeId);
  }, [redoStack]);

  const handleRemoteUndo = useCallback(
    (strokeId: string) => {
      localHistoryRef.current = localHistoryRef.current.filter((e) => e.strokeId !== strokeId);
      redrawAll();
    },
    [redrawAll]
  );

  const handleRemoteRedo = useCallback((_strokeId: string) => {}, []);

  return {
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
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    textInputState,
    setTextInputState,
    submitText,
    handleImageUpload,
    selectedObjectId,
    deleteSelectedObject,
  };
}
