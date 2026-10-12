import { useEffect, useRef, useState, type PointerEvent, type RefObject } from "react";
import "./desktop-reader-loupe.css";

type Point = { x: number; y: number };

type DesktopReaderLoupeProps = {
  containerRef: RefObject<HTMLDivElement | null>;
  sourceRef: RefObject<HTMLDivElement | null>;
  refreshKey: string;
};

const LOUPE_SIZE = 124;
const MAGNIFICATION = 1.85;

export default function DesktopReaderLoupe({
  containerRef,
  sourceRef,
  refreshKey,
}: DesktopReaderLoupeProps) {
  const [position, setPosition] = useState<Point>({ x: 0, y: 0 });
  const copyRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ pointerId: number; offsetX: number; offsetY: number } | null>(null);

  useEffect(() => {
    const source = sourceRef.current;
    const copy = copyRef.current;
    if (!source || !copy) return;

    const clone = source.cloneNode(true) as HTMLDivElement;
    clone.removeAttribute("aria-live");
    copy.replaceChildren(clone);
  }, [refreshKey, sourceRef]);

  useEffect(() => {
    const parkLoupe = () => {
      const container = containerRef.current;
      const source = sourceRef.current;
      const storyPanel = source?.closest<HTMLElement>(".desktop-story-information");
      if (!container || !storyPanel) return;

      const containerRect = container.getBoundingClientRect();
      const storyRect = storyPanel.getBoundingClientRect();
      setPosition({
        x: storyRect.right - containerRect.left - 78,
        y: storyRect.bottom - containerRect.top - 74,
      });
    };

    parkLoupe();
    window.addEventListener("resize", parkLoupe);
    return () => window.removeEventListener("resize", parkLoupe);
  }, [containerRef, refreshKey, sourceRef]);

  useEffect(() => {
    const container = containerRef.current;
    const source = sourceRef.current;
    const copy = copyRef.current;
    if (!container || !source || !copy || position.x === 0) return;

    const containerRect = container.getBoundingClientRect();
    const sourceRect = source.getBoundingClientRect();
    const sourceX = sourceRect.left - containerRect.left;
    const sourceY = sourceRect.top - containerRect.top;
    const radius = LOUPE_SIZE / 2;

    copy.style.width = `${sourceRect.width}px`;
    copy.style.transform = `translate(${radius - (position.x - sourceX) * MAGNIFICATION}px, ${
      radius - (position.y - sourceY) * MAGNIFICATION
    }px) scale(${MAGNIFICATION})`;
  }, [containerRef, position, refreshKey, sourceRef]);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    const container = containerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    dragRef.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - containerRect.left - position.x,
      offsetY: event.clientY - containerRect.top - position.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.classList.add("is-held");
    event.preventDefault();
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const container = containerRef.current;
    const source = sourceRef.current;
    const storyPanel = source?.closest<HTMLElement>(".desktop-story-information");
    if (!drag || drag.pointerId !== event.pointerId || !container || !storyPanel) return;

    const containerRect = container.getBoundingClientRect();
    const storyRect = storyPanel.getBoundingClientRect();
    const radius = LOUPE_SIZE / 2;
    const nextX = event.clientX - containerRect.left - drag.offsetX;
    const nextY = event.clientY - containerRect.top - drag.offsetY;

    setPosition({
      x: Math.max(
        storyRect.left - containerRect.left - radius * 0.2,
        Math.min(storyRect.right - containerRect.left + radius * 0.2, nextX),
      ),
      y: Math.max(
        storyRect.top - containerRect.top + radius * 0.35,
        Math.min(storyRect.bottom - containerRect.top + radius * 0.15, nextY),
      ),
    });
  };

  const releaseLoupe = (event: PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    event.currentTarget.classList.remove("is-held");
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <div
      className="desktop-reading-loupe"
      style={{
        opacity: position.x === 0 ? 0 : 1,
        transform: `translate3d(${position.x - LOUPE_SIZE / 2}px, ${
          position.y - LOUPE_SIZE / 2
        }px, 0)`,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={releaseLoupe}
      onPointerCancel={releaseLoupe}
      aria-label="Movable reading magnifier"
    >
      <span className="desktop-loupe-grip" aria-hidden="true" />
      <span className="desktop-loupe-ring">
        <span className="desktop-loupe-glass">
          <span ref={copyRef} className="desktop-loupe-copy" aria-hidden="true" />
        </span>
      </span>
    </div>
  );
}
