// "use client";

// import {
//   useCallback,
//   useEffect,
//   useLayoutEffect,
//   useRef,
//   useState,
//   type ReactNode,
// } from "react";
// import { ArrowRight } from "lucide-react";
// import { Fraunces } from "next/font/google";
// import { cn } from "@/lib/utils";

// /* -------------------------------------------------------------------------- */
// /*  Stage-curtain intro                                                       */
// /*                                                                            */
// /*  1. Red stage curtains fill the screen. A title and an "Enter" button      */
// /*     fade in on the fabric.                                                 */
// /*  2. Click: the text lifts away, the curtains part (the supplied green-     */
// /*     screen video is chroma-keyed live in WebGL, so the real home page is   */
// /*     visible through the gap), a warm light blooms from the opening and the */
// /*     "house lights" come up: the page eases from dark + blurred to sharp.   */
// /*  3. The curtains leave the frame and the overlay is removed. Nothing to    */
// /*     hand over: your home page was underneath the whole time.               */
// /*                                                                            */
// /*  Setup: copy curtains.mp4 to  public/curtains.mp4  (or pass videoSrc).     */
// /*                                                                            */
// /*  Hooks for your home page: <html data-intro="waiting | playing"> is set    */
// /*  while the intro is up (removed when it ends), and onOpen() fires the      */
// /*  moment the curtains start to part. Example in globals.css:                */
// /*    html[data-intro="waiting"] .hero { opacity: 0; transform: translateY(24px) } */
// /*    .hero { transition: opacity 1.2s ease 0.6s, transform 1.4s ease 0.6s }  */
// /* -------------------------------------------------------------------------- */

// const display = Fraunces({ subsets: ["latin"], weight: ["400", "700"], display: "swap" });

// const STORAGE_KEY = "rdc-intro-seen";

// // ---- video + keying -------------------------------------------------------
// const VIDEO_SRC = "/curtains.mp4";
// const VIDEO_AR = 16 / 9;
// const RATE = 1.1; // playback speed of the opening (1 = as filmed)
// const ZOOM = 0.965; // crop in a touch so the ragged hem never shows at the bottom
// const KEY_RGB: [number, number, number] = [121 / 255, 178 / 255, 47 / 255]; // the green screen
// const KEY_LO = 0.07; // chroma distance below this is fully transparent
// const KEY_HI = 0.19; // ...and above this fully opaque (soft edge in between)

// // ---- timings (ms) ---------------------------------------------------------
// const LIGHTS_DELAY = 450; // house lights start rising shortly after the curtains move
// const LIGHTS_MS = 3400; // dark + blurred page eases to normal
// const SPOT_MS = 3800; // warm light bloom through the opening
// const PUSH_MS = 5200; // slow camera push-in on the curtains while they part
// const LEAVE_MS = 450; // overlay fade at the very end (or on skip)
// const LOAD_TIMEOUT = 6000; // video never loaded: just show the site

// const EASE = "cubic-bezier(.7,0,.2,1)";
// const EASE_OUT = "cubic-bezier(.16,1,.3,1)";
// const EASE_SOFT = "cubic-bezier(.4,0,.2,1)";

// type Phase = "loading" | "ready" | "opening" | "leaving";

// type IntroProps = {
//   /** URL of the green-screen curtain video (served from /public). */
//   videoSrc?: string;
//   eyebrow?: string;
//   title?: string;
//   tagline?: string;
//   buttonLabel?: string;
//   /** Called the moment the curtains start to open (start your hero animations here). */
//   onOpen?: () => void;
//   /** Show the intro only once per browser session. */
//   once?: boolean;
// };

// /* -------------------------------------------------------------------------- */
// /*  Gate: wraps the page, shows the intro on top                              */
// /* -------------------------------------------------------------------------- */

// // useLayoutEffect on the client (runs before paint), useEffect on the server (no warning)
// const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

// export default function IntroGate({
//   children,
//   once = true,
//   ...props
// }: IntroProps & { children: ReactNode }) {
//   const [active, setActive] = useState(true);

//   // Runs before the browser paints, so people who already saw the intro (or who
//   // prefer reduced motion) never get a one-frame flash of the curtains.
//   useIsoLayoutEffect(() => {
//     const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
//     let seen = false;
//     try {
//       seen = once && sessionStorage.getItem(STORAGE_KEY) === "1";
//     } catch {}
//     if (reduce || seen) setActive(false);
//   }, [once]);

//   const finish = useCallback(() => {
//     try {
//       sessionStorage.setItem(STORAGE_KEY, "1");
//     } catch {}
//     setActive(false);
//   }, []);

//   return (
//     <>
//       {children}
//       {active && <Intro {...props} onDone={finish} />}
//     </>
//   );
// }

// /* -------------------------------------------------------------------------- */
// /*  WebGL chroma key                                                          */
// /* -------------------------------------------------------------------------- */

// const VERT = `
// attribute vec2 aPos;
// uniform vec4 uRect;            // visible part of the video: u0, v0, u1, v1
// varying vec2 vUv;
// void main() {
//   vec2 p = aPos * 0.5 + 0.5;   // 0..1, y up
//   vUv = vec2(mix(uRect.x, uRect.z, p.x), mix(uRect.w, uRect.y, p.y));
//   gl_Position = vec4(aPos, 0.0, 1.0);
// }`;

// const FRAG = `
// precision mediump float;
// uniform sampler2D uTex;
// uniform vec3 uKey;
// uniform vec2 uTh;
// varying vec2 vUv;
// vec2 chroma(vec3 c) {
//   float y = dot(c, vec3(0.299, 0.587, 0.114));
//   return vec2((c.b - y) * 0.565, (c.r - y) * 0.713);
// }
// void main() {
//   vec3 c = texture2D(uTex, vUv).rgb;
//   float a = smoothstep(uTh.x, uTh.y, distance(chroma(c), chroma(uKey)));
//   c.g = min(c.g, max(c.r, c.b));          // remove green spill on the fabric edge
//   gl_FragColor = vec4(c * a, a);          // premultiplied alpha
// }`;

// function compile(gl: WebGLRenderingContext, type: number, src: string) {
//   const sh = gl.createShader(type);
//   if (!sh) return null;
//   gl.shaderSource(sh, src);
//   gl.compileShader(sh);
//   if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
//     console.warn("[IntroGate] shader error:", gl.getShaderInfoLog(sh));
//     return null;
//   }
//   return sh;
// }

// /* -------------------------------------------------------------------------- */
// /*  Intro overlay                                                             */
// /* -------------------------------------------------------------------------- */

// function Intro({
//   videoSrc = VIDEO_SRC,
//   eyebrow = "Welcome to",
//   title = "RDC & IIC Portal",
//   tagline = "Research · Innovation · Discovery",
//   buttonLabel = "Raise the Curtain",
//   onOpen,
//   onDone,
// }: IntroProps & { onDone: () => void }) {
//   const [phase, setPhase] = useState<Phase>("loading");

//   const videoRef = useRef<HTMLVideoElement>(null);
//   const canvasRef = useRef<HTMLCanvasElement>(null);
//   const spotRef = useRef<HTMLDivElement>(null);
//   const loadRef = useRef<HTMLDivElement>(null);
//   const openRef = useRef(onOpen);
//   openRef.current = onOpen;
//   const timers = useRef<number[]>([]);
//   const doneRef = useRef(onDone);
//   doneRef.current = onDone;

//   const schedule = (ms: number, fn: () => void) => {
//     timers.current.push(window.setTimeout(fn, ms));
//   };
//   useEffect(
//     () => () => {
//       timers.current.forEach(clearTimeout);
//       timers.current = [];
//     },
//     [],
//   );

//   // let the home page know the intro is up, so it can hold its own entrance animation
//   useEffect(() => {
//     const html = document.documentElement;
//     html.dataset.intro = "waiting";
//     return () => {
//       delete html.dataset.intro;
//     };
//   }, []);

//   // thin gold line that breathes while the video loads, so a slow connection never looks broken
//   useEffect(() => {
//     if (phase !== "loading") return;
//     const a = loadRef.current?.animate(
//       [
//         { opacity: 0, transform: "scaleX(0.4)" },
//         { opacity: 0.9, transform: "scaleX(1)", offset: 0.5 },
//         { opacity: 0, transform: "scaleX(0.4)" },
//       ],
//       { duration: 1600, delay: 400, iterations: Infinity, easing: "ease-in-out" },
//     );
//     return () => a?.cancel();
//   }, [phase]);

//   // lock page scroll while the intro is on screen
//   useEffect(() => {
//     const html = document.documentElement;
//     const prev = html.style.overflow;
//     html.style.overflow = "hidden";
//     return () => {
//       html.style.overflow = prev;
//     };
//   }, []);

//   // ---- WebGL: draw the video, keying the green out -------------------------
//   useEffect(() => {
//     const video = videoRef.current;
//     const canvas = canvasRef.current;
//     if (!video || !canvas) return;

//     const gl = canvas.getContext("webgl", {
//       alpha: true,
//       premultipliedAlpha: true,
//       antialias: false,
//       depth: false,
//       stencil: false,
//     });
//     const vs = gl && compile(gl, gl.VERTEX_SHADER, VERT);
//     const fs = gl && compile(gl, gl.FRAGMENT_SHADER, FRAG);
//     const prog = gl?.createProgram();
//     if (!gl || !vs || !fs || !prog) {
//       console.warn("[IntroGate] WebGL unavailable, skipping intro");
//       doneRef.current();
//       return;
//     }
//     gl.attachShader(prog, vs);
//     gl.attachShader(prog, fs);
//     gl.linkProgram(prog);
//     gl.useProgram(prog);

//     const buf = gl.createBuffer();
//     gl.bindBuffer(gl.ARRAY_BUFFER, buf);
//     gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
//     const aPos = gl.getAttribLocation(prog, "aPos");
//     gl.enableVertexAttribArray(aPos);
//     gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

//     const tex = gl.createTexture();
//     gl.bindTexture(gl.TEXTURE_2D, tex);
//     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
//     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
//     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
//     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

//     gl.uniform1i(gl.getUniformLocation(prog, "uTex"), 0);
//     gl.uniform3f(gl.getUniformLocation(prog, "uKey"), KEY_RGB[0], KEY_RGB[1], KEY_RGB[2]);
//     gl.uniform2f(gl.getUniformLocation(prog, "uTh"), KEY_LO, KEY_HI);
//     const uRect = gl.getUniformLocation(prog, "uRect");
//     gl.clearColor(0, 0, 0, 0);

//     let alive = true;
//     let raf = 0;
//     let lastT = -1;
//     let hasFrame = false;

//     // "cover" the screen with the video, anchored at the top, slightly zoomed in
//     const resize = () => {
//       const dpr = Math.min(window.devicePixelRatio || 1, 1.5); // the video is only 720p
//       const cw = canvas.clientWidth;
//       const ch = canvas.clientHeight;
//       canvas.width = Math.max(2, Math.round(cw * dpr));
//       canvas.height = Math.max(2, Math.round(ch * dpr));
//       gl.viewport(0, 0, canvas.width, canvas.height);
//       const A = cw / ch;
//       let wu = 1;
//       let wv = 1;
//       if (A >= VIDEO_AR) wv = VIDEO_AR / A;
//       else wu = A / VIDEO_AR;
//       wu *= ZOOM;
//       wv *= ZOOM;
//       const u0 = (1 - wu) / 2;
//       gl.uniform4f(uRect, u0, 0, u0 + wu, wv);
//       lastT = -1; // force a redraw
//     };

//     const draw = () => {
//       if (video.readyState >= 2) {
//         gl.bindTexture(gl.TEXTURE_2D, tex);
//         gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
//         hasFrame = true;
//       }
//       gl.clear(gl.COLOR_BUFFER_BIT);
//       if (hasFrame) gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
//     };

//     const loop = () => {
//       if (!alive) return;
//       if (video.currentTime !== lastT) {
//         lastT = video.currentTime;
//         draw();
//       }
//       raf = requestAnimationFrame(loop);
//     };

//     const onReady = () => {
//       resize();
//       draw();
//       if (hasFrame) setPhase((p) => (p === "loading" ? "ready" : p));
//     };
//     const onError = () => {
//       console.warn(
//         `[IntroGate] could not load video "${videoSrc}". Put the file in your Next.js public folder (public${videoSrc}) and check that ${videoSrc} opens in the browser.`,
//       );
//       doneRef.current();
//     };

//     resize();
//     const ro = new ResizeObserver(resize);
//     ro.observe(canvas);
//     video.addEventListener("loadeddata", onReady);
//     video.addEventListener("error", onError);
//     if (video.readyState >= 2) onReady();
//     // the browser may have started loading (and failed, e.g. a 404) before React hydrated,
//     // in which case the "error" event already fired and our listener missed it
//     else if (video.error || video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) onError();
//     raf = requestAnimationFrame(loop);

//     // never leave a visitor stuck on a blank screen
//     const t = window.setTimeout(() => {
//       if (!hasFrame) {
//         console.warn(`[IntroGate] video "${videoSrc}" did not load in time, skipping intro`);
//         doneRef.current();
//       }
//     }, LOAD_TIMEOUT);

//     return () => {
//       alive = false;
//       cancelAnimationFrame(raf);
//       clearTimeout(t);
//       ro.disconnect();
//       video.removeEventListener("loadeddata", onReady);
//       video.removeEventListener("error", onError);
//       gl.deleteTexture(tex);
//       gl.deleteBuffer(buf);
//       gl.deleteProgram(prog);
//     };
//   }, [videoSrc]);

//   // warm light blooming through the opening while the curtains part
//   useEffect(() => {
//     if (phase !== "opening") return;
//     spotRef.current?.animate(
//       [
//         { opacity: 0, transform: "scale(0.55)" },
//         { opacity: 0.85, transform: "scale(1)", offset: 0.32 },
//         { opacity: 0, transform: "scale(1.4)" },
//       ],
//       { duration: SPOT_MS, delay: 250, easing: "ease-in-out", fill: "both" },
//     );
//   }, [phase]);

//   const leave = useCallback(() => {
//     setPhase("leaving");
//     schedule(LEAVE_MS + 40, () => doneRef.current());
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   const start = () => {
//     const v = videoRef.current;
//     if (phase !== "ready" || !v) return;
//     v.playbackRate = RATE;
//     v.play().catch(() => doneRef.current()); // blocked playback: just show the site
//     setPhase("opening");
//     document.documentElement.dataset.intro = "playing";
//     openRef.current?.();
//     // safety net in case "ended" never fires
//     schedule(((v.duration || 5.5) / RATE) * 1000 + 2000, leave);
//   };

//   const skip = () => {
//     videoRef.current?.pause();
//     leave();
//   };

//   // Escape skips the intro
//   useEffect(() => {
//     const onKey = (e: KeyboardEvent) => {
//       if (e.key === "Escape" && phase !== "leaving") skip();
//     };
//     window.addEventListener("keydown", onKey);
//     return () => window.removeEventListener("keydown", onKey);
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [phase]);

//   const ready = phase === "ready";
//   const opening = phase === "opening" || phase === "leaving";

//   // text on the curtain: rises in when ready, lifts away when the curtains open
//   const item = (delay: number, exit = 0) => ({
//     opacity: ready ? 1 : 0,
//     transform: ready ? "translateY(0)" : opening ? "translateY(-16px)" : "translateY(20px)",
//     filter: ready ? "blur(0px)" : "blur(10px)",
//     transition: ready
//       ? `opacity 1000ms ease ${delay}ms, transform 1300ms ${EASE_OUT} ${delay}ms, filter 1000ms ease ${delay}ms`
//       : `opacity 450ms ease ${exit}ms, transform 700ms ${EASE} ${exit}ms, filter 450ms ease ${exit}ms`,
//   });

//   return (
//     <div
//       role="dialog"
//       aria-label="Welcome"
//       className={cn("fixed inset-0 z-[100] overflow-hidden", display.className)}
//       style={{
//         opacity: phase === "leaving" ? 0 : 1,
//         transition: `opacity ${LEAVE_MS}ms ease`,
//         pointerEvents: phase === "leaving" ? "none" : "auto", // page stays unclickable until the curtains have cleared
//       }}
//     >
//       {/* the video element only feeds WebGL; keep it in the page (not display:none) so every browser decodes it */}
//       <video
//         ref={videoRef}
//         src={videoSrc}
//         muted
//         playsInline
//         preload="auto"
//         crossOrigin="anonymous"
//         onEnded={leave}
//         aria-hidden
//         tabIndex={-1}
//         className="pointer-events-none absolute h-px w-px opacity-0"
//       />

//       {/* 0. dark stage behind the curtains (the "house lights" start off) */}
//       <div
//         aria-hidden
//         className="absolute inset-0"
//         style={{
//           background: "radial-gradient(ellipse at 50% 40%, #1c0508 0%, #070103 100%)",
//           opacity: opening ? 0 : 1,
//           transition: opening ? `opacity ${LIGHTS_MS}ms ${EASE_SOFT} ${LIGHTS_DELAY}ms` : "none",
//         }}
//       />

//       {/* 0b. page starts out of focus and sharpens as the lights come up */}
//       <div
//         aria-hidden
//         className="absolute inset-0"
//         style={{
//           backdropFilter: opening ? "blur(0px)" : "blur(22px)",
//           WebkitBackdropFilter: opening ? "blur(0px)" : "blur(22px)",
//           transition: opening
//             ? `backdrop-filter ${LIGHTS_MS + 500}ms ${EASE_SOFT} ${LIGHTS_DELAY}ms, -webkit-backdrop-filter ${LIGHTS_MS + 500}ms ${EASE_SOFT} ${LIGHTS_DELAY}ms`
//             : "none",
//         }}
//       />

//       {/* 1. warm light spilling out of the opening (behind the curtains) */}
//       <div
//         ref={spotRef}
//         aria-hidden
//         className="pointer-events-none absolute inset-0"
//         style={{
//           opacity: 0,
//           background:
//             "radial-gradient(ellipse 55% 75% at 50% 34%, rgba(255,226,170,0.65) 0%, rgba(255,200,130,0.22) 40%, transparent 72%)",
//         }}
//       />

//       {/* 2. the curtains: video, green keyed out */}
//       <canvas
//         ref={canvasRef}
//         aria-hidden
//         className="absolute inset-0 h-full w-full"
//         style={{
//           transform: opening ? "scale(1.05)" : "scale(1)",
//           transformOrigin: "50% 0%",
//           transition: `transform ${PUSH_MS}ms ${EASE_SOFT}`,
//         }}
//       />

//       {/* 3. stage lighting on the closed curtains: soft pool of light + vignette */}
//       <div
//         aria-hidden
//         className="pointer-events-none absolute inset-0"
//         style={{
//           background:
//             "radial-gradient(ellipse 60% 55% at 50% 40%, rgba(255,214,150,0.16), transparent 60%), radial-gradient(ellipse at 50% 50%, transparent 38%, rgba(0,0,0,0.6) 100%)",
//           opacity: opening ? 0 : 1,
//           transition: `opacity ${opening ? 1800 : 600}ms ease`,
//         }}
//       />

//       {/* loading indicator (only visible while the video loads) */}
//       <div
//         ref={loadRef}
//         aria-hidden
//         className="pointer-events-none absolute top-1/2 h-px w-24"
//         style={{
//           left: "calc(50% - 3rem)",
//           opacity: 0,
//           background: "linear-gradient(90deg, transparent, #e2bd6b, transparent)",
//         }}
//       />

//       {/* 4. title + button on the fabric */}
//       <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
//         <p
//           className="text-[0.7rem] font-semibold uppercase text-[#e2bd6b] sm:text-xs"
//           style={{ letterSpacing: "0.42em", textShadow: "0 1px 12px rgba(0,0,0,0.6)", ...item(150, 240) }}
//         >
//           {eyebrow}
//         </p>

//         <h1
//           className="mt-4 font-bold text-[#f8ebc8]"
//           style={{
//             fontSize: "clamp(2.2rem, 6.4vw, 5rem)",
//             lineHeight: 1.05,
//             letterSpacing: "-0.01em",
//             textShadow: "0 2px 34px rgba(0,0,0,0.6), 0 0 2px rgba(0,0,0,0.4)",
//             ...item(300, 180),
//           }}
//         >
//           {title}
//         </h1>

//         <div
//           aria-hidden
//           className="mt-6 h-px w-40"
//           style={{
//             background: "linear-gradient(90deg, transparent, #e2bd6b, transparent)",
//             ...item(450, 120),
//           }}
//         />

//         <p
//           className="mt-5 text-sm text-[#f3dfb2]/85 sm:text-base"
//           style={{ letterSpacing: "0.12em", textShadow: "0 1px 14px rgba(0,0,0,0.6)", ...item(550, 60) }}
//         >
//           {tagline}
//         </p>

//         <div className="mt-10" style={item(750, 0)}>
//           <button
//             type="button"
//             onClick={start}
//             disabled={!ready}
//             autoFocus
//             className="group inline-flex h-14 items-center gap-3 rounded-full px-10 text-base font-semibold text-[#2a0a0a] shadow-[0_18px_40px_-14px_rgba(0,0,0,0.75)] transition-all duration-300 hover:-translate-y-0.5 active:scale-95 hover:shadow-[0_22px_46px_-14px_rgba(226,189,107,0.55)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f8ebc8]"
//             style={{ background: "linear-gradient(180deg, #f6dd9b 0%, #d9b45f 100%)", letterSpacing: "0.04em" }}
//           >
//             {buttonLabel}
//             <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
//           </button>
//         </div>
//       </div>

//       {/* skip */}
//       {phase !== "leaving" && (
//         <button
//           type="button"
//           onClick={skip}
//           className="absolute top-5 right-5 z-10 rounded-full px-4 py-2 text-xs font-semibold text-[#f3dfb2]/80 transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f8ebc8]"
//         >
//           Skip intro
//         </button>
//       )}
//     </div>
//   );
// }