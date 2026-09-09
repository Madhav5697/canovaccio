import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { RoomDialog } from '../components/RoomDialog';
import { useSocket } from '../hooks/useSocket';
import { generateUserId } from '../utils/helpers';

/* ── Scroll-reveal hook ──────────────────────────────────────────────────── */
function useScrollReveal() {
  useEffect(() => {
    const elements = document.querySelectorAll('[data-animate]');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

/* ── Fiddle.digital Inspired Premium Custom Cursor ───────────────────────── */
interface TrailPoint {
  x: number;
  y: number;
  r: number;
}

/* ── Big Solid Black Fluid Metaball Cursor ─────────────────────────────── */
interface TrailPoint {
  x: number;
  y: number;
  r: number;
  life: number;
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
}

function useFiddleCursor() {
  useEffect(() => {
    // Hide default OS cursor across all elements while on homepage
    const styleEl = document.createElement('style');
    styleEl.innerHTML = `* { cursor: none !important; }`;
    document.head.appendChild(styleEl);

    // Canvas element using mixBlendMode: difference
    // Solid white fill over white page = solid black dot
    // Solid white fill over black text = crisp white text!
    const canvas = document.createElement('canvas');
    Object.assign(canvas.style, {
      position:      'fixed',
      top:           '0',
      left:          '0',
      width:         '100%',
      height:        '100%',
      pointerEvents: 'none',
      zIndex:        '9999',
      mixBlendMode:  'difference',
    });
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d')!;
    let W = window.innerWidth;
    let H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;

    let mouseX = -100;
    let mouseY = -100;
    let targetX = -100;
    let targetY = -100;
    let currentX = -100;
    let currentY = -100;

    let radius = 55;
    let targetRadius = 55;
    let clickPulse = 1.0;
    let time = 0;

    let lastScrollY = window.scrollY;
    let scrollVel = 0;

    let isHovered = false;
    let animId = 0;

    const trail: TrailPoint[] = [];
    const ripples: Ripple[] = [];

    const onScroll = () => {
      const currentScrollY = window.scrollY;
      scrollVel += (currentScrollY - lastScrollY) * 0.45;
      lastScrollY = currentScrollY;
    };

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      // Strong magnetic hover check on interactive elements and headings
      const buttonEl = (e.target as HTMLElement)?.closest('button, a, input, select, [role="button"]');
      const textEl = (e.target as HTMLElement)?.closest('h1, h2, h3, p, span, [data-text-hover]');

      if (buttonEl) {
        isHovered = true;
        const rect = buttonEl.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Strong 60% magnetic pull towards center of button
        targetX = mouseX + (centerX - mouseX) * 0.60;
        targetY = mouseY + (centerY - mouseY) * 0.60;
        targetRadius = 95; // Huge fluid dot on button hover
      } else if (textEl) {
        isHovered = false;
        targetX = mouseX;
        targetY = mouseY;
        targetRadius = 85; // Huge dot over text so inverted white text inside is crisp and fully readable
      } else {
        isHovered = false;
        targetX = mouseX;
        targetY = mouseY;
        targetRadius = 55; // Big solid black dot default (110px diameter)
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      clickPulse = 1.45; // Liquid pulse on click
      ripples.push({
        x: e.clientX,
        y: e.clientY,
        radius: targetRadius,
        maxRadius: targetRadius + 36,
        opacity: 0.9,
      });
    };

    const animate = () => {
      ctx.clearRect(0, 0, W, H);
      time += 0.05;

      // Smooth decay of scroll velocity impulse
      scrollVel *= 0.88;

      // Smooth LERP position
      const lerpFactor = isHovered ? 0.24 : 0.18;
      const prevX = currentX;
      const prevY = currentY;
      
      currentX += (targetX - currentX) * lerpFactor;
      currentY += (targetY - currentY) * lerpFactor;

      // Smooth radius LERP & click pulse decay
      radius += (targetRadius * clickPulse - radius) * 0.15;
      clickPulse += (1.0 - clickPulse) * 0.1;

      // Calculate velocity and angle for fluid stretch (combining mouse + scroll velocity)
      const vx = currentX - prevX;
      const vy = (currentY - prevY) + scrollVel;
      const speed = Math.sqrt(vx * vx + vy * vy);
      const angle = Math.atan2(vy, vx);

      // Spawn liquid trail droplets when moving or scrolling
      if (speed > 1.2) {
        trail.unshift({
          x: currentX,
          y: currentY,
          r: radius * 0.65,
          life: 1.0,
        });
      }

      // Render fluid trail droplets
      for (let i = trail.length - 1; i >= 0; i--) {
        const pt = trail[i];
        pt.life -= 0.08;
        pt.r = Math.max(0, pt.r - 0.7);

        if (pt.life <= 0 || pt.r <= 0) {
          trail.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
        // Solid white in difference mode = black droplet on white page
        ctx.fillStyle = `rgba(255, 255, 255, ${pt.life})`;
        ctx.fill();
      }

      // Render liquid ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rip = ripples[i];
        rip.radius += (rip.maxRadius - rip.radius) * 0.18 + 0.5;
        rip.opacity -= 0.04;

        if (rip.opacity <= 0 || rip.radius >= rip.maxRadius - 0.5) {
          ripples.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(rip.x, rip.y, rip.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${rip.opacity * 0.7})`;
        ctx.fill();
      }

      // Render main BIG organic jiggling liquid dot
      // (Solid white fill in mixBlendMode: difference renders as opaque black dot on white page
      // and inverts dark text underneath to crisp white!)
      if (currentX > -50 && currentY > -50) {
        ctx.save();
        ctx.translate(currentX, currentY);

        if (speed > 0.4) {
          ctx.rotate(angle);
          const stretch = Math.min(speed * 0.035, 0.5);
          ctx.scale(1 + stretch, 1 / (1 + stretch * 0.6));
        }

        // Draw organic fluid jiggling perimeter
        const numPoints = 14;
        ctx.beginPath();
        for (let i = 0; i < numPoints; i++) {
          const a = (i / numPoints) * (Math.PI * 2);
          const nextA = ((i + 1) / numPoints) * (Math.PI * 2);

          const wobble = Math.sin(time * 3.5 + i * 1.5) * (2.5 + Math.min(speed * 0.35, 6));
          const nextWobble = Math.sin(time * 3.5 + (i + 1) * 1.5) * (2.5 + Math.min(speed * 0.35, 6));

          const r1 = radius + wobble;
          const r2 = radius + nextWobble;

          const p1x = Math.cos(a) * r1;
          const p1y = Math.sin(a) * r1;
          const p2x = Math.cos(nextA) * r2;
          const p2y = Math.sin(nextA) * r2;

          const midX = (p1x + p2x) / 2;
          const midY = (p1y + p2y) / 2;

          if (i === 0) {
            ctx.moveTo(p1x, p1y);
          }
          ctx.quadraticCurveTo(p1x, p1y, midX, midY);
        }
        ctx.closePath();

        // Solid White in difference blend mode -> solid black dot, white text inside!
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();

        ctx.restore();
      }

      animId = requestAnimationFrame(animate);
    };

    const onResize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W;
      canvas.height = H;
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      if (styleEl.parentNode) styleEl.parentNode.removeChild(styleEl);
    };
  }, []);
}

/* ── Tiny helper: transition style for page-open entrance ────────────────── */
function entrance(
  mounted: boolean,
  delay: number,
  from: string = 'translateY(-18px)'
): React.CSSProperties {
  return {
    opacity: mounted ? 1 : 0,
    transform: mounted ? 'translateY(0)' : from,
    transition: `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms,
                 transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
  };
}

/* ── Component ───────────────────────────────────────────────────────────── */
export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [dialog, setDialog] = useState<'create' | 'join' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState<boolean>(() => localStorage.getItem('drawsync_theme') === 'dark');
  const heroRef = useRef<HTMLDivElement>(null);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      localStorage.setItem('drawsync_theme', next ? 'dark' : 'light');
      return next;
    });
  };

  const getUserId = () => {
    let id = sessionStorage.getItem('drawsync_user_id');
    if (!id) {
      id = generateUserId();
      sessionStorage.setItem('drawsync_user_id', id);
    }
    return id;
  };

  const { connectionStatus, roomState, createRoom, joinRoom, clearError } = useSocket();

  useScrollReveal();
  useFiddleCursor();

  // Trigger page-open animations one frame after mount
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleCreateRoom = async () => {
    setIsLoading(true);
    const userId = getUserId();
    const response = await createRoom(userId);
    setIsLoading(false);
    if (response.success && response.roomId) {
      navigate(`/room/${response.roomId}`, { state: { userId } });
    }
  };

  const handleJoinRoom = async (roomId: string) => {
    setIsLoading(true);
    const userId = getUserId();
    const response = await joinRoom(roomId, userId);
    setIsLoading(false);
    if (response.success && response.roomId) {
      navigate(`/room/${response.roomId}`, { state: { userId } });
    }
  };

  const handleCloseDialog = () => {
    setDialog(null);
    clearError();
  };

  const isConnected = connectionStatus === 'connected';
  const isOffline   = connectionStatus === 'error' || connectionStatus === 'disconnected';

  return (
    <div className={`min-h-screen font-sans antialiased selection:bg-blue-500/20 overflow-x-hidden transition-colors duration-500 ${
      isDark ? 'bg-[#09090b] text-white' : 'bg-white text-gray-900'
    }`}>

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? isDark
              ? 'bg-[#09090b]/90 backdrop-blur-lg border-b border-zinc-800'
              : 'bg-white/90 backdrop-blur-lg border-b border-gray-100'
            : 'bg-transparent'
        }`}
        style={entrance(mounted, 0)}
      >
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          {/* Logo — text only */}
          <a href="/" className="flex items-center">
            <span className={`font-playfair italic font-bold text-base tracking-tight transition-colors ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>Canovaccio</span>
          </a>

          {/* Right side */}
          <div className="flex items-center gap-4 sm:gap-5">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle Theme"
              className={`p-1.5 rounded-lg border transition-all hover:scale-105 active:scale-95 ${
                isDark
                  ? 'bg-zinc-900 border-zinc-800 text-amber-400 hover:bg-zinc-800'
                  : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
              }`}
            >
              {isDark ? (
                /* Sun Icon */
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <circle cx="12" cy="12" r="5" />
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>
              ) : (
                /* Moon Icon */
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                </svg>
              )}
            </button>

            <span
              className={`hidden sm:block w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                isConnected
                  ? 'bg-emerald-400'
                  : connectionStatus === 'connecting'
                  ? 'bg-amber-400 animate-pulse'
                  : isDark ? 'bg-zinc-700' : 'bg-gray-300'
              }`}
            />
            <button
              onClick={() => setDialog('join')}
              disabled={!isConnected}
              className={`hidden sm:block text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                isDark ? 'text-zinc-300 hover:text-white' : 'text-gray-800 hover:text-gray-950'
              }`}
            >
              Join Room
            </button>
            <button
              onClick={() => setDialog('create')}
              disabled={!isConnected}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
                isDark
                  ? 'bg-white text-zinc-900 hover:bg-zinc-200'
                  : 'bg-gray-900 text-white hover:bg-gray-700'
              }`}
            >
              Create Room
            </button>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════════════
          HERO — full screen, just "Canovaccio"
      ══════════════════════════════════════════════════════════════════════ */}
      <section
        ref={heroRef}
        className={`relative min-h-screen flex flex-col items-center justify-center px-6 transition-colors duration-500 ${
          isDark ? 'bg-[#09090b]' : 'bg-white'
        }`}
      >
        {/* The word */}
        <h1
          className={`font-playfair font-bold italic text-center leading-none select-none transition-colors duration-500 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}
          style={{
            fontSize: 'clamp(4.5rem, 15vw, 13rem)',
            letterSpacing: '-0.02em',
            ...entrance(mounted, 100, 'translateY(30px)'),
          }}
        >
          Canovaccio
        </h1>

        {/* Tiny descriptor */}
        <p
          className={`mt-6 text-xs tracking-[0.25em] uppercase font-medium select-none transition-colors ${
            isDark ? 'text-zinc-300' : 'text-gray-800'
          }`}
          style={{ fontFamily: 'inherit', ...entrance(mounted, 300, 'translateY(16px)') }}
        >
          Draw together · In real time
        </p>

        {/* Scroll cue */}
        <div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          style={entrance(mounted, 550, 'translateY(10px)')}
        >
          <span className={`text-[10px] tracking-[0.2em] uppercase font-medium select-none transition-colors ${
            isDark ? 'text-zinc-400' : 'text-gray-800'
          }`}>Scroll</span>
          <div className={`w-px h-10 bg-gradient-to-b ${
            isDark ? 'from-zinc-700 to-transparent' : 'from-gray-400 to-transparent'
          }`} />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 1 — Tagline + CTA
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="px-6 py-28 max-w-5xl mx-auto">
        <div data-animate className="max-w-2xl animate-float-slow">
          <h2 className={`text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight mb-6 transition-colors ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            A canvas for everyone<br />in the room.
          </h2>
          <p className={`text-base mb-10 leading-relaxed max-w-sm font-medium transition-colors ${
            isDark ? 'text-zinc-300' : 'text-gray-800'
          }`}>
            Spin up a shared whiteboard in one click. No accounts, no setup — just draw.
          </p>

          {/* Offline warning */}
          {isOffline && (
            <div className={`mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs ${
              isDark ? 'bg-red-950/40 border border-red-900/50 text-red-400' : 'bg-red-50 border border-red-100 text-red-500'
            }`}>
              <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 flex-shrink-0">
                <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 3.75a.75.75 0 011.5 0v3.5a.75.75 0 01-1.5 0v-3.5zm.75 7a.75.75 0 110-1.5.75.75 0 010 1.5z" />
              </svg>
              Server offline — run <code className="mx-1 font-mono">npm run dev</code>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-start gap-3">
            <button
              onClick={() => setDialog('create')}
              disabled={!isConnected}
              className={`flex items-center gap-2 px-6 py-2.5 text-sm font-medium rounded-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
                isDark ? 'bg-white text-zinc-900 hover:bg-zinc-200' : 'bg-gray-900 text-white hover:bg-gray-700'
              }`}
            >
              <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                <path d="M8 2a1 1 0 011 1v4h4a1 1 0 010 2H9v4a1 1 0 01-2 0V9H3a1 1 0 010-2h4V3a1 1 0 011-1z" />
              </svg>
              Create a Room
            </button>
            <button
              onClick={() => setDialog('join')}
              disabled={!isConnected}
              className={`flex items-center gap-1 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed py-2.5 ${
                isDark ? 'text-zinc-400 hover:text-white' : 'text-gray-700 hover:text-gray-950'
              }`}
            >
              Join with a code
              <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                <path fillRule="evenodd" d="M6.22 11.78a.75.75 0 010-1.06L9.44 7.5 6.22 4.28a.75.75 0 011.06-1.06l3.5 3.5a.75.75 0 010 1.06l-3.5 3.5a.75.75 0 01-1.06 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 2 — Product Visual
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="px-6 pb-28 max-w-5xl mx-auto">
        <div data-animate className="animate-float-delay">
          {/* Browser frame */}
          <div className={`rounded-2xl border overflow-hidden transition-colors duration-500 ${
            isDark
              ? 'border-zinc-800 bg-[#121215] shadow-2xl shadow-black/80'
              : 'border-gray-100 bg-white shadow-2xl shadow-gray-100'
          }`}>
            {/* Window chrome */}
            <div className={`h-10 border-b px-4 flex items-center justify-between transition-colors ${
              isDark ? 'bg-zinc-900/90 border-zinc-800' : 'bg-gray-50 border-gray-100'
            }`}>
              <div className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${isDark ? 'bg-zinc-700' : 'bg-gray-300'}`} />
                <span className={`w-2.5 h-2.5 rounded-full ${isDark ? 'bg-zinc-700' : 'bg-gray-300'}`} />
                <span className={`w-2.5 h-2.5 rounded-full ${isDark ? 'bg-zinc-700' : 'bg-gray-300'}`} />
              </div>
              <span className={`text-[11px] font-mono font-medium ${isDark ? 'text-zinc-400' : 'text-gray-800'}`}>drawsync.app/room/K8FXQP</span>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className={`text-[11px] font-medium ${isDark ? 'text-zinc-400' : 'text-gray-800'}`}>3 users</span>
              </div>
            </div>

            {/* Canvas workspace */}
            <div className={`relative h-[340px] sm:h-[440px] overflow-hidden flex transition-colors ${
              isDark ? 'bg-[#0d0d0f]' : 'bg-white'
            }`}>
              {/* Dot grid */}
              <div className="absolute inset-0 bg-dot-grid pointer-events-none" />

              {/* Left toolbar */}
              <div className={`relative z-10 w-11 border-r p-1.5 flex flex-col items-center gap-1 transition-colors ${
                isDark ? 'bg-[#0d0d0f] border-zinc-800' : 'bg-white border-gray-100'
              }`}>
                {/* Active tool */}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isDark ? 'bg-white' : 'bg-gray-900'
                }`}>
                  <svg viewBox="0 0 24 24" fill="none" stroke={isDark ? '#09090b' : 'white'} strokeWidth="2" className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </div>
                {/* Inactive tools */}
                {[
                  <rect key="rect" x="3" y="3" width="18" height="18" rx="2" />,
                  <circle key="circ" cx="12" cy="12" r="9" />,
                  <><line key="a1" x1="5" y1="12" x2="19" y2="12" /><polyline key="a2" points="12 5 19 12 12 19" /></>,
                  <><polyline key="t1" points="4 7 4 4 20 4 20 7" /><line key="t2" x1="12" y1="4" x2="12" y2="20" /></>,
                ].map((icon, i) => (
                  <div key={i} className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isDark ? 'text-zinc-500' : 'text-gray-700'
                  }`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
                      {icon}
                    </svg>
                  </div>
                ))}
                <div className="mt-auto mb-1.5 w-5 h-5 rounded-full bg-blue-500 ring-2 ring-blue-100" />
              </div>

              {/* Freehand canvas — sketch marks */}
              <div className="flex-1 relative">
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 680 440" preserveAspectRatio="xMidYMid meet">
                  {/* Loose organic rectangle — hand-drawn */}
                  <path
                    d="M 100 95 Q 101 92 185 90 Q 270 89 273 93 Q 276 130 273 168 Q 271 171 185 170 Q 100 170 98 166 Q 96 130 100 95"
                    fill="none" stroke={isDark ? '#4b5563' : '#9ca3af'} strokeWidth="2" strokeLinecap="round"
                  />
                  {/* Small oval */}
                  <ellipse cx="390" cy="130" rx="70" ry="45" fill="none" stroke={isDark ? '#c084fc' : '#a78bfa'} strokeWidth="2" opacity="0.9" />
                  {/* Another loose shape */}
                  <path
                    d="M 500 80 Q 502 78 570 79 Q 580 80 579 130 Q 578 155 568 157 Q 504 158 500 155 Q 496 130 500 80"
                    fill="none" stroke={isDark ? '#60a5fa' : '#60a5fa'} strokeWidth="2" strokeLinecap="round" opacity="0.9"
                  />
                  {/* Dashed connector */}
                  <path d="M 273 130 Q 320 130 318 130" fill="none" stroke={isDark ? '#4b5563' : '#9ca3af'} strokeWidth="1.5" strokeDasharray="4 3" />
                  <polygon points="318,127 325,130 318,133" fill={isDark ? '#4b5563' : '#9ca3af'} />
                  <path d="M 462 130 Q 490 130 498 130" fill="none" stroke={isDark ? '#4b5563' : '#9ca3af'} strokeWidth="1.5" strokeDasharray="4 3" />
                  <polygon points="498,127 505,130 498,133" fill={isDark ? '#4b5563' : '#9ca3af'} />

                  {/* Casual sketch labels */}
                  <text x="185" y="135" textAnchor="middle" fill={isDark ? '#e4e4e7' : '#111827'} fontSize="12" fontFamily="Georgia, serif" fontStyle="italic" fontWeight="600">idea</text>
                  <text x="390" y="136" textAnchor="middle" fill={isDark ? '#c084fc' : '#4c1d95'} fontSize="12" fontFamily="Georgia, serif" fontStyle="italic" fontWeight="600">notes</text>
                  <text x="535" y="125" textAnchor="middle" fill={isDark ? '#60a5fa' : '#1e3a8a'} fontSize="12" fontFamily="Georgia, serif" fontStyle="italic" fontWeight="600">flow</text>

                  {/* The animated live stroke */}
                  <path
                    className="animate-draw-stroke"
                    d="M 110 290 C 170 265, 235 315, 310 278 S 415 252, 490 288 S 565 312, 610 290"
                    fill="none" stroke={isDark ? '#3b82f6' : '#2563eb'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  />

                  {/* Soft underline marks */}
                  <path d="M 140 330 Q 200 326 260 330" fill="none" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
                  <path d="M 380 310 Q 430 305 480 312" fill="none" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
                </svg>

                {/* Collaborator cursor 1 */}
                <div className="absolute top-0 left-0 animate-cursor-1 pointer-events-none">
                  <div className="flex items-center gap-1">
                    <svg width="13" height="13" viewBox="0 0 24 24">
                      <path d="M5.5 3.5L19 12L12 14L9 21L5.5 3.5Z" fill="#3b82f6" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
                    </svg>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-medium text-white bg-blue-500 shadow-sm whitespace-nowrap">Alex</span>
                  </div>
                </div>

                {/* Collaborator cursor 2 */}
                <div className="absolute top-0 left-0 animate-cursor-2 pointer-events-none">
                  <div className="flex items-center gap-1">
                    <svg width="13" height="13" viewBox="0 0 24 24">
                      <path d="M5.5 3.5L19 12L12 14L9 21L5.5 3.5Z" fill="#7c3aed" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
                    </svg>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-medium text-white bg-violet-600 shadow-sm whitespace-nowrap">Sam</span>
                  </div>
                </div>

                {/* Zoom pill */}
                <div className={`absolute bottom-3 right-3 border rounded-lg px-2.5 py-1 text-[11px] font-mono font-medium shadow-sm transition-colors ${
                  isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-300' : 'bg-white border-gray-100 text-gray-800'
                }`}>
                  100%
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 3 — Three features
      ══════════════════════════════════════════════════════════════════════ */}
      <section className={`px-6 pb-28 max-w-5xl mx-auto border-t pt-16 transition-colors ${
        isDark ? 'border-zinc-800/80' : 'border-gray-100'
      }`}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
          {[
            {
              icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
              ),
              label: 'Real-time',
              desc: 'Every stroke appears instantly for everyone in the room.',
              delay: '0',
            },
            {
              icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                </svg>
              ),
              label: 'Just share a link',
              desc: 'No accounts, no install. Anyone with the code can join.',
              delay: '150',
            },
            {
              icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
                </svg>
              ),
              label: 'Full toolset',
              desc: 'Pencil, shapes, arrows, text, eraser — all the essentials.',
              delay: '300',
            },
          ].map(({ icon, label, desc, delay }) => (
            <div key={label} data-animate data-delay={delay} className="flex flex-col gap-3 group hover:-translate-y-1 transition-transform duration-300">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-300 ${
                isDark
                  ? 'bg-zinc-900 text-zinc-400 group-hover:bg-white group-hover:text-zinc-900'
                  : 'bg-gray-100 text-gray-500 group-hover:bg-gray-900 group-hover:text-white'
              }`}>
                {icon}
              </div>
              <div>
                <p className={`text-sm font-semibold mb-1 transition-colors ${
                  isDark ? 'text-white group-hover:text-blue-400' : 'text-gray-900 group-hover:text-gray-950'
                }`}>{label}</p>
                <p className={`text-sm leading-relaxed font-medium transition-colors ${
                  isDark ? 'text-zinc-400 group-hover:text-zinc-200' : 'text-gray-800'
                }`}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 4 — Final CTA
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="px-6 pb-28 max-w-5xl mx-auto">
        <div data-animate className={`rounded-2xl px-8 py-16 text-center relative overflow-hidden transition-colors ${
          isDark
            ? 'bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800/80 shadow-2xl'
            : 'bg-gray-950 text-white'
        }`}>
          <div
            className="absolute inset-0 pointer-events-none opacity-30"
            style={{ background: 'radial-gradient(ellipse at 50% 110%, #1d4ed8 0%, transparent 55%)' }}
          />
          <div className="relative z-10">
            <h2 className="font-playfair italic font-bold text-white text-4xl sm:text-5xl tracking-tight mb-3">
              Ready to draw?
            </h2>
            <p className="text-gray-400 text-sm mb-8">No sign-up. No friction. Open a room and start.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => setDialog('create')}
                disabled={!isConnected}
                className="w-full sm:w-auto px-7 py-2.5 bg-white hover:bg-gray-100 text-gray-900 font-semibold text-sm rounded-xl transition-all hover:scale-105 active:scale-95 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Create a Room
              </button>
              <button
                onClick={() => setDialog('join')}
                disabled={!isConnected}
                className="w-full sm:w-auto px-7 py-2.5 bg-transparent hover:bg-white/10 text-gray-300 hover:text-white text-sm font-medium rounded-xl border border-white/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Join a Room
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className={`border-t py-8 px-6 max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs transition-colors ${
        isDark ? 'border-zinc-800/80 text-zinc-400' : 'border-gray-100 text-gray-800'
      }`}>
        <div className="flex items-center gap-3">
          <span className={`font-playfair italic font-bold text-sm ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>Canovaccio</span>
          <span className={isDark ? 'text-zinc-700' : 'text-gray-300'}>|</span>
          <span className="font-medium">Crafted by <strong className={isDark ? 'text-white' : 'text-gray-900'}>Madhav</strong></span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 font-medium">
          <a
            href="mailto:amadhav1228@gmail.com"
            className={`transition-colors hover:underline ${
              isDark ? 'hover:text-white text-zinc-300' : 'hover:text-gray-950 text-gray-800'
            }`}
          >
            amadhav1228@gmail.com
          </a>
          <a
            href="tel:8885630422"
            className={`transition-colors hover:underline ${
              isDark ? 'hover:text-white text-zinc-300' : 'hover:text-gray-950 text-gray-800'
            }`}
          >
            8885630422
          </a>
          <span className={isDark ? 'text-zinc-500' : 'text-gray-400'}>© {new Date().getFullYear()}</span>
        </div>
      </footer>

      {/* ── Dialogs ────────────────────────────────────────────────────────── */}
      {dialog && (
        <RoomDialog
          mode={dialog}
          isLoading={isLoading}
          error={roomState.error}
          isDark={isDark}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          onClose={handleCloseDialog}
        />
      )}
    </div>
  );
};
