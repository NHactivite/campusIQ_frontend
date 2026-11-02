"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const FLIP_MS = 1200;
const PAUSE_MIN = 10; // ms between one flip finishing and the next starting
const PAUSE_MAX = 20;
const rand = (min: number, max: number) => min + Math.random() * (max - min);

// 3 columns x 8 rows, staggered like the Parul design
const TILES = [
  "col-start-1 row-start-1 row-span-5",
  "col-start-2 row-start-1 row-span-3",
  "col-start-3 row-start-1 row-span-5",
  "col-start-1 row-start-6 row-span-3",
  "col-start-2 row-start-4 row-span-5",
  "col-start-3 row-start-6 row-span-3",
];

type Face = string | null;

interface TileState {
  faces: [Face, Face]; // [front, back]
  showing: 0 | 1;      // which face is visible
  angle: number;       // total rotation so far (multiples of 180)
}

// Deterministic start (no Math.random) so server and client markup match
const initTiles = (images: string[]): TileState[] =>
  TILES.map((_, i) => ({
    faces: [images[i] ?? null, images[i + TILES.length] ?? null],
    showing: 0,
    angle: 0,
  }));

const faceClass =
  "absolute inset-0 overflow-hidden rounded-3xl bg-gradient-to-br from-[#0d2b40] to-[#1d6387] shadow-md";
const hide = { backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" } as const;

function FaceImage({ src, priority }: { src: Face; priority?: boolean }) {
  if (!src) return null; // gradient background shows through
  return (
    <Image
      src={src}
      alt=""
      fill
      priority={priority}
      sizes="(min-width: 1024px) 220px, 34vw"
      className="object-cover"
    />
  );
}

function FlipTile({ faces, angle, className, priority }: {
  faces: [Face, Face]; angle: number; className: string; priority?: boolean;
}) {
  return (
    <div className={cn("relative", className)} style={{ perspective: 1000 }}>
      <div
        className="absolute inset-0"
        style={{
          transformStyle: "preserve-3d",
          transform: `rotateY(${angle}deg)`,
          transition: `transform ${FLIP_MS}ms cubic-bezier(0.65, 0, 0.35, 1)`,
          willChange: "transform",
        }}
      >
        <div className={faceClass} style={hide}>
          <FaceImage src={faces[0]} priority={priority} />
        </div>
        <div className={faceClass} style={{ ...hide, transform: "rotateY(180deg)" }}>
          <FaceImage src={faces[1]} />
        </div>
      </div>
    </div>
  );
}

export default function HeroMosaic({ images }: { images: string[] }) {
  const [tiles, setTiles] = useState<TileState[]>(() => initTiles(images));
  const tilesRef = useRef(tiles); // the controller's source of truth
  const lastTile = useRef(-1);

  // needs at least one spare photo, otherwise the boxes would repeat
  const canFlip = images.length > TILES.length;

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!canFlip || reduce) return;

    let stop = false;
    let timer: ReturnType<typeof setTimeout>;
    const wait = (ms: number) => new Promise<void>((r) => { timer = setTimeout(r, ms); });

    (async () => {
      await wait(rand(1500, 3000));
      while (!stop) {
        if (!document.hidden) {
          const cur = tilesRef.current;

          // photos visible right now are never picked
          const taken = new Set(cur.map((t) => t.faces[t.showing]));
          const free = images.filter((u) => !taken.has(u));

          if (free.length > 0) {
            // random tile, never the same one twice in a row
            let t = 0;
            do { t = Math.floor(Math.random() * cur.length); }
            while (t === lastTile.current && cur.length > 1);
            lastTile.current = t;

            const img = free[Math.floor(Math.random() * free.length)];
            const tile = cur[t];
            const hidden = (1 - tile.showing) as 0 | 1;

            // 1) put the new photo on the hidden face and let it load
            const faces: [Face, Face] = [tile.faces[0], tile.faces[1]];
            faces[hidden] = img;
            tilesRef.current = cur.map((x, i) => (i === t ? { ...x, faces } : x));
            setTiles(tilesRef.current);
            await wait(500);
            if (stop) return;

            // 2) flip left or right at random
            const dir = Math.random() < 0.5 ? -1 : 1;
            tilesRef.current = tilesRef.current.map((x, i) =>
              i === t ? { ...x, showing: hidden, angle: x.angle + dir * 180 } : x
            );
            setTiles(tilesRef.current);
            await wait(FLIP_MS + 100); // finish before anything else moves
          }
        }
        await wait(rand(PAUSE_MIN, PAUSE_MAX));
      }
    })();

    return () => { stop = true; clearTimeout(timer); };
  }, [canFlip, images]);

  return (
    <div
      role="group"
      aria-label="Photos from our events"
      className="grid h-110 grid-cols-3 grid-rows-8 gap-3 sm:h-130 lg:h-150"
    >
      {TILES.map((cls, i) => (
        <FlipTile key={cls} className={cls} faces={tiles[i].faces} angle={tiles[i].angle} priority={i < 3} />
      ))}
    </div>
  );
}