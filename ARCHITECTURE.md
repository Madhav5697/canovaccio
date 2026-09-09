# DrawSync — Architecture Document

## Overview

DrawSync is a **real-time collaborative whiteboard** built on a client-server architecture. This document explains how data flows through the system in beginner-friendly language.

---

## Big Picture

Think of it like a group chat, but for drawings:

```
User A (Browser)              Server              User B (Browser)
      │                          │                       │
      │  1. Draws on canvas      │                       │
      │  (mouse/touch events)    │                       │
      │                          │                       │
      │──── draw:event ─────────>│                       │
      │  (WebSocket message)     │                       │
      │                    2. Validate                   │
      │                    + Store event                 │
      │                    (if draw_end)                 │
      │                          │                       │
      │                          │──── draw:event ──────>│
      │                          │   (WebSocket message) │
      │                          │                       │  3. Receives event
      │                          │                       │  Renders stroke on canvas
```

---

## Detailed Data Flow

### Step 1: User draws on canvas

When User A moves their mouse on the canvas:

1. The browser fires `mousemove` (or `touchmove`) events
2. Our `useCanvas` hook captures the cursor position (x, y coordinates)
3. The hook immediately draws the stroke **locally** on their canvas (so there's no delay for the person drawing)
4. At the same time, it packages the drawing data into a message:

```json
{
  "type": "draw_move",
  "tool": "pencil",
  "color": "#3B82F6",
  "brushSize": 4,
  "points": [{ "x": 100, "y": 200 }, { "x": 102, "y": 203 }],
  "userId": "SwiftFox42",
  "strokeId": "abc-123",
  "timestamp": 1720000000000
}
```

### Step 2: Message goes to the server

The `socketService` sends this message via **WebSocket** to the Node.js server.

> **What's a WebSocket?** Unlike normal web requests (where you ask, the server answers, and the connection closes), a WebSocket is a **persistent, two-way connection**. Data can flow in both directions at any time without a new request. This is what makes real-time apps possible.

### Step 3: Server validates and routes

The server's `socketHandlers.ts` receives the event. It:

1. **Validates** the data (checks that color is a valid hex code, tool is a known type, coordinates are numbers, etc.) — this prevents invalid or malicious data
2. **Overwrites** the `userId` with the socket's authenticated userId (prevents one user from impersonating another)
3. **Stores** completed strokes (`draw_end`) in the room's history
4. **Broadcasts** the event to all **other** users in the same room using Socket.IO's room system

### Step 4: Other users receive and render

User B's `socketService` receives the `draw:event` message. It:
1. Forwards it to `useCanvas.handleRemoteDrawEvent()`
2. The canvas utility functions render the stroke on their canvas

---

## Room System

A **Room** is like a private channel:

```
Server Memory
├── Room "AB12CD"
│   ├── Users: [SwiftFox42 (socket-001), BoldBear17 (socket-002)]
│   ├── History: [stroke1, stroke2, stroke3, ...]
│   └── Created: 2024-07-12T10:00:00Z
│
└── Room "XY9876"
    ├── Users: [EpicLion55 (socket-003)]
    ├── History: []
    └── Created: 2024-07-12T10:05:00Z
```

- Each room has a **unique 6-character ID** (e.g., `AB12CD`)
- When you send a drawing event, it **only goes to people in your room**
- When a new user joins, they receive the room's **drawing history** so they see what was already drawn
- When everyone leaves, the room is deleted after 30 seconds

---

## Socket.IO Room Isolation

Socket.IO has a built-in concept of "rooms" (which happens to be exactly what we need). When User A calls `socket.join("AB12CD")`, they subscribe to that channel. When the server calls `socket.to("AB12CD").emit("draw:event", ...)`, **only people who joined "AB12CD"** receive the message.

This is what keeps Room AB12CD and Room XY9876 completely separate.

---

## Performance Strategy

Drawing generates a LOT of events (potentially hundreds per second). Here's how we keep it fast:

| Problem | Solution |
|---|---|
| Too many network messages | Throttle `draw_move` to max 60 per second |
| Sending redundant data | Only send the last 2-3 points per move event, not the whole stroke |
| Slow canvas rendering | Draw immediately in the event handler (not in React's render cycle) |
| Blurry on Retina screens | Scale canvas by `devicePixelRatio` |
| Unnecessary React re-renders | Canvas drawing uses native DOM events, not React state |

---

## File Responsibilities

| File | What it does |
|---|---|
| `server/src/server.ts` | Starts the server, sets up Express + Socket.IO |
| `server/src/rooms/roomManager.ts` | Creates rooms, manages users, stores drawing history |
| `server/src/sockets/socketHandlers.ts` | Handles all socket events (create, join, draw, clear) |
| `client/src/services/socketService.ts` | Manages the WebSocket connection from the browser |
| `client/src/hooks/useSocket.ts` | React hook that exposes room state and actions |
| `client/src/hooks/useCanvas.ts` | React hook that handles all canvas drawing logic |
| `client/src/utils/canvasUtils.ts` | Pure functions for drawing shapes on a canvas |
| `client/src/utils/helpers.ts` | Utility functions (ID generation, validation, throttle) |
| `client/src/pages/LandingPage.tsx` | The home page with Create/Join buttons |
| `client/src/pages/CanvasPage.tsx` | The drawing room page |
| `client/src/components/DrawingCanvas.tsx` | The canvas element + wires up all events |
| `client/src/components/Toolbar.tsx` | The sidebar with all drawing tools |
| `client/src/components/UserList.tsx` | Shows who's online in the room |
| `client/src/components/RoomDialog.tsx` | Modal for entering a room ID |

---

## Technology Choices Explained

| Technology | Why we chose it |
|---|---|
| **React** | Makes building interactive UIs much easier than vanilla JavaScript |
| **TypeScript** | Catches errors at compile time, not at runtime — saves debugging time |
| **Vite** | Extremely fast development server and build tool |
| **Tailwind CSS** | Write styles directly in the HTML without switching to CSS files |
| **Socket.IO** | Wraps WebSockets with automatic reconnection, fallbacks, and room support |
| **Express** | Simple, battle-tested Node.js web framework |
| **HTML5 Canvas** | The browser's built-in 2D drawing API — no external library needed |
