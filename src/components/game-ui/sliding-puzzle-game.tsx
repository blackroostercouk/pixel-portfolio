"use client";

import { useEffect, useRef, useCallback } from "react";

type Props = {
  onWin: () => void;
};

type DragTile = HTMLButtonElement & {
  _spDrag?: EventListener;
  _spEnd?: EventListener;
  _spCancel?: EventListener;
};

const SIZE = 4;
const EMPTY = null;
const SOLVED: (string | null)[] = [
  "a1", "a2", "a3", "a4",
  "b1", "b2", "b3", "b4",
  "c1", "c2", "c3", "c4",
  "d1", "d2", "d3", EMPTY,
];
const TILE_IDS = SOLVED.filter(Boolean) as string[];
const BASE = "/assets/games/sliding-puzzle";

function indexToPoint(index: number) {
  return { row: Math.floor(index / SIZE), col: index % SIZE };
}

function areNeighbors(a: number, b: number) {
  const pa = indexToPoint(a);
  const pb = indexToPoint(b);
  return Math.abs(pa.row - pb.row) + Math.abs(pa.col - pb.col) === 1;
}

function shuffledStateAtExactDistance(distance: number): (string | null)[] {
  const encode = (items: (string | null)[]) => items.map((i) => i ?? "_").join(",");
  const visited = new Set([encode(SOLVED)]);
  let layer: (string | null)[][] = [SOLVED.slice()];

  for (let depth = 0; depth < distance; depth++) {
    const nextLayer: (string | null)[][] = [];
    for (const candidate of layer) {
      const emptyIndex = candidate.indexOf(EMPTY);
      for (let index = 0; index < candidate.length; index++) {
        if (!areNeighbors(index, emptyIndex)) continue;
        const next = candidate.slice();
        [next[index], next[emptyIndex]] = [next[emptyIndex], next[index]];
        const key = encode(next);
        if (visited.has(key)) continue;
        visited.add(key);
        nextLayer.push(next);
      }
    }
    layer = nextLayer;
  }

  return layer[Math.floor(Math.random() * layer.length)].slice();
}

export function SlidingPuzzleGame({ onWin }: Props) {
  const stateRef = useRef<(string | null)[]>(SOLVED.slice());
  const initialStateRef = useRef<(string | null)[]>(SOLVED.slice());
  const movesRef = useRef(0);
  const lockedRef = useRef(false);
  const boardRef = useRef<HTMLDivElement>(null);
  const movesLabelRef = useRef<HTMLSpanElement>(null);
  const winOverlayRef = useRef<HTMLDivElement>(null);
  const winMessageRef = useRef<HTMLParagraphElement>(null);
  const activeDragRef = useRef<{
    tile: HTMLButtonElement;
    pointerId: number;
    startX: number;
    startY: number;
    dx: number;
    dy: number;
    progress: number;
    distance: number;
  } | null>(null);
  const onWinRef = useRef(onWin);
  onWinRef.current = onWin;

  const movableIndices = useCallback(() => {
    const emptyIndex = stateRef.current.indexOf(EMPTY);
    return stateRef.current.map((_, i) => i).filter((i) => areNeighbors(i, emptyIndex));
  }, []);

  const render = useCallback(() => {
    const board = boardRef.current;
    if (!board) return;
    const movable = new Set(movableIndices());
    board.querySelectorAll<HTMLButtonElement>(".sp-tile").forEach((tile) => {
      const index = stateRef.current.indexOf(tile.dataset.id!);
      const { row, col } = indexToPoint(index);
      tile.style.setProperty("--row", String(row));
      tile.style.setProperty("--col", String(col));
      tile.classList.toggle("sp-movable", movable.has(index));
    });
    if (movesLabelRef.current) {
      const m = movesRef.current;
      movesLabelRef.current.textContent = `${m} ${m === 1 ? "move" : "moves"}`;
    }
  }, [movableIndices]);

  const isSolved = useCallback(() => {
    return stateRef.current.every((v, i) => v === SOLVED[i]);
  }, []);

  const finish = useCallback(() => {
    lockedRef.current = true;
    setTimeout(() => {
      if (winMessageRef.current) {
        const m = movesRef.current;
      winMessageRef.current.textContent = `You solved the puzzle in ${m} ${m === 1 ? "move" : "moves"}!`;
      }
      if (winOverlayRef.current) winOverlayRef.current.hidden = false;
      onWinRef.current();
    }, 240);
  }, []);

  const moveTile = useCallback(
    (id: string, countMove = true) => {
      if (lockedRef.current) return false;
      const tileIndex = stateRef.current.indexOf(id);
      const emptyIndex = stateRef.current.indexOf(EMPTY);
      if (!areNeighbors(tileIndex, emptyIndex)) return false;
      [stateRef.current[tileIndex], stateRef.current[emptyIndex]] = [
        stateRef.current[emptyIndex],
        stateRef.current[tileIndex],
      ];
      if (countMove) movesRef.current += 1;
      render();
      if (countMove && isSolved()) finish();
      return true;
    },
    [render, isSolved, finish],
  );

  const cleanDrag = useCallback(() => {
    const d = activeDragRef.current;
    if (!d) return;
    const dt = d.tile as DragTile;
    dt.classList.remove("sp-dragging");
    if (dt._spDrag) dt.removeEventListener("pointermove", dt._spDrag);
    if (dt._spEnd) dt.removeEventListener("pointerup", dt._spEnd);
    if (dt._spCancel) dt.removeEventListener("pointercancel", dt._spCancel);
    dt.style.removeProperty("transform");
    activeDragRef.current = null;
  }, []);

  const startDrag = useCallback(
    (event: PointerEvent) => {
      if (lockedRef.current || event.button > 0) return;
      const tile = event.currentTarget as HTMLButtonElement;
      const tileIndex = stateRef.current.indexOf(tile.dataset.id!);
      const emptyIndex = stateRef.current.indexOf(EMPTY);
      if (!areNeighbors(tileIndex, emptyIndex)) return;

      event.preventDefault();
      tile.setPointerCapture(event.pointerId);
      const from = indexToPoint(tileIndex);
      const to = indexToPoint(emptyIndex);
      activeDragRef.current = {
        tile,
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        dx: to.col - from.col,
        dy: to.row - from.row,
        progress: 0,
        distance: 0,
      };
      tile.classList.add("sp-dragging");

      const drag = (e: PointerEvent) => {
        const d = activeDragRef.current;
        if (!d || e.pointerId !== d.pointerId) return;
        e.preventDefault();
        const cell = boardRef.current!.clientWidth / SIZE;
        const raw = d.dx
          ? ((e.clientX - d.startX) * d.dx) / cell
          : ((e.clientY - d.startY) * d.dy) / cell;
        d.distance = Math.hypot(e.clientX - d.startX, e.clientY - d.startY);
        d.progress = Math.max(0, Math.min(1, raw));
        const id = d.tile.dataset.id!;
        const point = indexToPoint(stateRef.current.indexOf(id));
        d.tile.style.transform = `translate(${(point.col + d.dx * d.progress) * 100}%, ${(point.row + d.dy * d.progress) * 100}%)`;
      };

      const endDrag = (e: PointerEvent) => {
        const d = activeDragRef.current;
        if (!d || e.pointerId !== d.pointerId) return;
        const id = d.tile.dataset.id!;
        const shouldMove = d.progress > 0.22 || d.distance < 8;
        cleanDrag();
        if (shouldMove) moveTile(id);
        else render();
      };

      const cancelDrag = () => {
        cleanDrag();
        render();
      };

      // Store refs so cleanDrag can remove them
      const dt = tile as DragTile;
      dt._spDrag = drag as EventListener;
      dt._spEnd = endDrag as EventListener;
      dt._spCancel = cancelDrag as EventListener;

      tile.addEventListener("pointermove", drag as EventListener, { passive: false });
      tile.addEventListener("pointerup", endDrag as EventListener);
      tile.addEventListener("pointercancel", cancelDrag);
    },
    [cleanDrag, moveTile, render],
  );

  const startNewGame = useCallback(() => {
    lockedRef.current = true;
    if (winOverlayRef.current) winOverlayRef.current.hidden = true;
    movesRef.current = 0;
    initialStateRef.current = shuffledStateAtExactDistance(8);
    stateRef.current = initialStateRef.current.slice();
    lockedRef.current = false;
    render();
  }, [render]);

  const resetGame = useCallback(() => {
    cleanDrag();
    lockedRef.current = false;
    if (winOverlayRef.current) winOverlayRef.current.hidden = true;
    movesRef.current = 0;
    stateRef.current = initialStateRef.current.slice();
    render();
  }, [cleanDrag, render]);

  // Build tiles once on mount
  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    board.innerHTML = "";
    TILE_IDS.forEach((id) => {
      const tile = document.createElement("button") as DragTile;
      tile.type = "button";
      tile.className = "sp-tile";
      tile.dataset.id = id;
      tile.innerHTML = `<img src="${BASE}/${id}.png" alt="" draggable="false" />`;
      tile.addEventListener("pointerdown", startDrag as EventListener);
      tile.addEventListener("keydown", (e: KeyboardEvent) => {
        if ((e.key === "Enter" || e.key === " ") && moveTile(id)) e.preventDefault();
      });
      board.append(tile);
    });
    startNewGame();
    return () => { board.innerHTML = ""; };
  }, [startDrag, moveTile, startNewGame]);

  return (
    <div className="sp-shell font-pixel">
      <style>{`
        .sp-shell {
          width: min(92vw, 560px);
          text-align: center;
          padding: 8px 0 12px;
        }
        .sp-scene {
          position: relative;
          width: 100%;
          aspect-ratio: 1;
          filter: drop-shadow(0 20px 28px rgba(0,0,0,.72));
        }
        .sp-frame {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: contain;
          pointer-events: none;
          user-select: none;
        }
        .sp-board {
          position: absolute;
          left: 15.23%;
          top: 16.35%;
          width: 67.3%;
          aspect-ratio: 1;
          overflow: hidden;
          touch-action: none;
          border-radius: 1.3%;
        }
        .sp-tile {
          position: absolute;
          left: 0; top: 0;
          width: 25%; height: 25%;
          padding: 0; border: 0;
          background: transparent;
          transform: translate(calc(var(--col) * 100%), calc(var(--row) * 100%));
          transition: transform 190ms cubic-bezier(.22,.76,.28,1), filter 140ms ease;
          cursor: grab;
          touch-action: none;
          user-select: none;
          -webkit-user-drag: none;
          will-change: transform;
        }
        .sp-tile img {
          display: block;
          width: 100%; height: 100%;
          filter: drop-shadow(0 1px 1.5px rgba(0,0,0,.48));
          pointer-events: none;
          user-select: none;
          -webkit-user-drag: none;
        }
        .sp-tile:not(.sp-movable) { cursor: default; }
        .sp-tile.sp-dragging { z-index: 2; cursor: grabbing; transition: filter 140ms ease; }
        .sp-hud {
          position: absolute;
          left: 21%; right: 19%; bottom: 5.8%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          font: 600 clamp(10px,1.9vw,14px)/1 inherit;
          color: #d5ae75;
        }
        .sp-hud button {
          font: inherit;
          border: 1px solid #a8793f;
          border-radius: 999px;
          padding: .55em 1em;
          color: #f1c27b;
          background: linear-gradient(#302a20,#17140f);
          box-shadow: inset 0 0 0 1px #0b0907, 0 3px 8px #0008;
          cursor: pointer;
          font-size: 11px;
        }
        .sp-hud button:hover { filter: brightness(1.18); }
        .sp-win {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          padding: 16%;
          background: rgba(3,8,4,.78);
          backdrop-filter: blur(5px);
          z-index: 5;
        }
        .sp-win[hidden] { display: none; }
        .sp-win-card {
          width: min(100%,320px);
          padding: clamp(16px,5vw,32px);
          border: 2px solid #926638;
          border-radius: 12px;
          background: linear-gradient(145deg,#25251d,#0e120e);
          box-shadow: 0 18px 45px #000, inset 0 0 28px #0008;
        }
        .sp-win-card h2 { margin: .15em 0; font-size: clamp(20px,5vw,36px); color: #e9c181; }
        .sp-win-card p { margin: .7em 0 1.2em; color: #d5ae75; font-size: 12px; }
        .sp-eyebrow { color: #b88749; font-size: 10px; letter-spacing: .18em; text-transform: uppercase; }
        .sp-win-actions { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }
        .sp-win-actions button {
          font: inherit;
          border: 1px solid #a8793f;
          border-radius: 999px;
          padding: .6em 1.2em;
          color: #f1c27b;
          background: linear-gradient(#302a20,#17140f);
          box-shadow: inset 0 0 0 1px #0b0907, 0 3px 8px #0008;
          cursor: pointer;
          font-size: 12px;
        }
        .sp-win-btn-claim {
          background: linear-gradient(#4a7a3a,#2a4a20) !important;
          border-color: #5a9a4a !important;
          color: #c8f0a8 !important;
        }
        .sp-win-actions button:hover { filter: brightness(1.18); }
        .sp-hint { margin: 4px 0 0; color: #b89c71; font-size: 12px; opacity: .9; }
      `}</style>

      <div className="sp-scene">
        <img className="sp-frame" src={`${BASE}/background_base.png`} alt="" />
        <div ref={boardRef} className="sp-board" />
        <div className="sp-hud">
          <span ref={movesLabelRef}>0 moves</span>
          <button type="button" onClick={resetGame}>Reset</button>
        </div>
        <div ref={winOverlayRef} className="sp-win" hidden>
          <div className="sp-win-card">
            <p className="sp-eyebrow">ROUTE COMPLETE</p>
            <h2>Great job!</h2>
            <p ref={winMessageRef}>You solved the puzzle.</p>
            <div className="sp-win-actions">
              <button type="button" onClick={startNewGame}>Play Again</button>
            </div>
          </div>
        </div>
      </div>
      <p className="sp-hint">Drag or tap a tile next to the empty space.</p>
    </div>
  );
}
