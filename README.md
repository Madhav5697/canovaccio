# DrawSync — Real-Time Collaborative Drawing Canvas

> Draw together, anywhere, in real time. Multiple users can join the same room and see each other's strokes appear instantly.

![DrawSync Screenshot](docs/screenshot-placeholder.png)

---

## ✨ Features

- 🎨 **Full Drawing Toolkit** — Pencil, Eraser, Line, Rectangle, Circle
- 🌈 **Color Picker** — 12 preset colors + custom color wheel
- 📏 **Adjustable Brush Size** — 1–50px with visual preview
- ↩️ **Undo / Redo** — Per-user with keyboard shortcuts (Ctrl+Z / Ctrl+Y)
- 🗑️ **Clear Canvas** — With confirmation to prevent accidents
- ⚡ **Real-Time Sync** — Sub-50ms drawing propagation via WebSockets
- 🏠 **Room System** — Create or join isolated rooms with a 6-character code
- 👥 **Live User List** — See who's drawing with you, with individual colors
- 📱 **Touch Support** — Works on mobile and tablet
- 🔄 **Reconnection** — Automatically reconnects after network blips
- 🔒 **Room Isolation** — Rooms are completely isolated from each other
- 📖 **Drawing History** — Late joiners see all existing strokes

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS |
| Drawing | HTML5 Canvas API |
| Real-Time | Socket.IO (WebSockets) |
| Backend | Node.js + Express |
| Testing | Vitest (client) + Jest (server) |

---

## 🏗 Architecture

```
multi-canvas/
├── client/                    # React Frontend
│   └── src/
│       ├── components/        # UI components
│       │   ├── DrawingCanvas  # Main canvas + dual-canvas setup
│       │   ├── Toolbar        # Tools, colors, brush, undo/redo
│       │   ├── UserList       # Online users display
│       │   ├── RoomDialog     # Create/Join modals
│       │   └── Tooltip        # Reusable tooltip
│       ├── pages/
│       │   ├── LandingPage    # Hero page, create/join
│       │   └── CanvasPage     # Drawing room UI
│       ├── hooks/
│       │   ├── useSocket      # Socket connection + room state
│       │   └── useCanvas      # Canvas drawing logic
│       ├── services/
│       │   └── socketService  # Socket.IO client singleton
│       ├── utils/
│       │   ├── helpers.ts     # ID generation, throttle, validation
│       │   └── canvasUtils.ts # Drawing functions, shape rendering
│       └── types/             # TypeScript type definitions
│
└── server/                    # Node.js Backend
    └── src/
        ├── server.ts          # Express + Socket.IO entry point
        ├── rooms/
        │   └── roomManager.ts # Room CRUD + drawing history
        ├── sockets/
        │   └── socketHandlers # Socket event handlers + validation
        └── types/             # Shared TypeScript types
```

---

## 🔄 How Real-Time Synchronization Works

```
User draws on canvas
        ↓
useCanvas hook captures pointer events
        ↓
Drawing data is created (tool, color, brush size, points)
        ↓
socketService.sendDrawEvent() sends it via WebSocket
        ↓
Socket.IO Server receives the event
        ↓
Server validates the data (tool, color format, point coordinates)
        ↓
Server stamps the event and broadcasts to all OTHER users in the room
        ↓
Other users' socketService receives 'draw:event'
        ↓
Event is forwarded to useCanvas.handleRemoteDrawEvent()
        ↓
Remote stroke is rendered on their canvas
```

**Key optimization:** During a stroke, only the last 2–3 points are sent in `draw_move` events (not the full stroke), keeping network traffic minimal. The complete stroke is only sent once on `draw_end`.

---

## 🏠 How Rooms Work

- **Room ID**: A 6-character uppercase alphanumeric code (e.g., `AB12CD`), generated randomly on the server
- **Creation**: User clicks "Create Room" → server creates the room → user is redirected to `/room/AB12CD`
- **Joining**: Another user enters the room ID → server validates it exists → they join the same Socket.IO room
- **Isolation**: Socket.IO's built-in room system ensures events only go to members of the same room
- **History**: The server stores the last 200 completed strokes. Late joiners receive this history and replay it on their canvas
- **Cleanup**: Empty rooms are deleted after 30 seconds; rooms older than 24 hours are cleaned up hourly

---

## 🎨 How Canvas Drawing Works

1. **Dual Canvas Setup**: There are two stacked canvases. The main canvas holds the permanent drawing. The preview canvas (transparent, pointer-events: none) shows shape ghosts while dragging.

2. **HiDPI Support**: The canvas is scaled by `window.devicePixelRatio` so drawings are crisp on Retina/4K screens.

3. **Smooth Lines**: Pencil strokes use quadratic Bézier curves through midpoints of consecutive points, avoiding jagged lines.

4. **Shape Preview**: For Line/Rectangle/Circle, the preview canvas is cleared and redrawn on every mouse move, showing where the shape will land.

---

## ⚡ Performance Optimizations

| Optimization | Description |
|---|---|
| Event throttling | `draw:move` events are throttled to 60fps (16ms) |
| Incremental rendering | Only the latest 2 points are drawn per move event, not the full stroke |
| requestAnimationFrame | Canvas rendering is deferred to the next animation frame |
| Minimal payloads | `draw_move` only sends the last 3 points; `draw_end` sends the full stroke |
| No React re-renders | Canvas drawing bypasses React's virtual DOM (native event listeners) |
| Singleton socket | One persistent WebSocket connection per tab |
| Server payload limit | Socket.IO max payload set to 100KB to prevent abuse |

---

## 📦 Installation

### Prerequisites
- Node.js 18+
- npm 9+

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/collaborative-canvas.git
cd collaborative-canvas

# 2. Install all dependencies
npm run install:all

# 3. Set up environment variables
cp server/.env.example server/.env
cp client/.env.example client/.env
```

---

## 🚀 Running Locally

```bash
# Run both client and server together (recommended)
npm run dev

# Or run separately:
npm run dev:server   # Server at http://localhost:3001
npm run dev:client   # Client at http://localhost:5173
```

Open `http://localhost:5173` in two browser tabs or windows to test multi-user drawing.

---

## 🏗 Building for Production

```bash
# Build everything
npm run build

# The built files will be at:
# server/dist/  — compiled Node.js server
# client/dist/  — static frontend files
```

To start the production server:
```bash
cd server
node dist/server.js
```

The client's `dist/` folder can be served by any static host (Vercel, Netlify, GitHub Pages, etc.).

---

## 🌐 Deployment

### Option 1: Separate Deployment (Recommended)

**Backend (Railway / Render / Fly.io):**
1. Deploy the `server/` folder
2. Set environment variables: `PORT`, `CLIENT_URL` (your frontend URL), `NODE_ENV=production`

**Frontend (Vercel / Netlify):**
1. Deploy the `client/` folder
2. Set `VITE_SERVER_URL` to your backend URL (e.g., `https://your-server.railway.app`)
3. Build command: `npm run build`
4. Output directory: `dist`

### Option 2: Single Server
Serve the built client files from Express:
```js
app.use(express.static(path.join(__dirname, '../../client/dist')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../../client/dist/index.html')));
```

---

## 🔐 Environment Variables

### Server (`server/.env`)
| Variable | Default | Description |
|---|---|---|
| `PORT` | `3001` | Port the server listens on |
| `CLIENT_URL` | `http://localhost:5173` | Frontend URL (for CORS) |
| `NODE_ENV` | `development` | Environment |

### Client (`client/.env`)
| Variable | Default | Description |
|---|---|---|
| `VITE_SERVER_URL` | *(empty)* | Backend URL. Empty = use Vite dev proxy |

---

## 🧪 Running Tests

```bash
# Run all tests
npm test

# Server tests only
npm run test:server

# Client tests only
npm run test:client
```

---

## 🔮 Future Improvements

- [ ] User authentication & persistent rooms
- [ ] Canvas layers
- [ ] Text tool
- [ ] Image upload & paste
- [ ] Export canvas as PNG/SVG
- [ ] Room password protection
- [ ] Cursor position broadcasting (see others' cursors)
- [ ] Collaborative undo (undo your own strokes without affecting others)
- [ ] Whiteboard templates
- [ ] Mobile-optimized touch gestures (pinch to zoom, two-finger pan)

---

## 📸 Screenshots

*Add screenshots here after deployment.*

---

## 📄 License

MIT
