import { useEffect, useRef, useState, type CSSProperties } from "react";

import ashenPressSource from "./sources/ashen-press.html?raw";

const ashenPressBaseDocument = ashenPressSource.replace(
  "__ASHEN_DEV__",
  import.meta.env.DEV ? "true" : "false",
);
const middlemanBackUrl = new URL('../../../books/the middle man(back).png', import.meta.url).href;
const middlemanFrontUrl = new URL('../../../books/the middle man(front).png', import.meta.url).href;
const dreamersBackUrl = new URL('../../../books/dreamers(back).png', import.meta.url).href;
const dreamersFrontUrl = new URL('../../../books/dreamers(front).png', import.meta.url).href;
const forFriendsFrontUrl = new URL('../../../books/FOUR FRIENDS(FRONT).jpg', import.meta.url).href;
const robinChekaFrontUrl = new URL('../../../books/ROBIN CHECKER(FRONT).jpg', import.meta.url).href;
const stalkWithMenFrontUrl = new URL('../../../books/STUCK WITH MEN(FRONT).jpg', import.meta.url).href;
const blackMaxFrontUrl = new URL('../../../books/BLACK MASK(FRONT).jpg', import.meta.url).href;
const theMonthJuneFrontUrl = new URL('../../../books/THE MONTH JUNE(FRONT).jpg', import.meta.url).href;
const aJourneyToDimworldFrontUrl = new URL('../../../books/a journey to dimworld(front).jpg', import.meta.url).href;
const ashenPressDocument = ashenPressBaseDocument
  .replace('__MIDDLEMAN_FRONT__', middlemanFrontUrl)
  .replace('__MIDDLEMAN_BACK__', middlemanBackUrl)
  .replace('__DREAMERS_FRONT__', dreamersFrontUrl)
  .replace('__DREAMERS_BACK__', dreamersBackUrl)
  .replace('__FOR_FRIENDS_FRONT__', forFriendsFrontUrl)
  .replace('__ROBIN_CHEKA_FRONT__', robinChekaFrontUrl)
  .replace('__STALK_WITH_MEN_FRONT__', stalkWithMenFrontUrl)
  .replace('__BLACK_MAX_FRONT__', blackMaxFrontUrl)
  .replace('__THE_MONTH_JUNE_FRONT__', theMonthJuneFrontUrl)
  .replace('__A_JOURNEY_TO_DIMWORLD_FRONT__', aJourneyToDimworldFrontUrl);

export type AshenPressProps = {
  active?: boolean;
  className?: string;
  style?: CSSProperties;
};

export function AshenPress({ active = true, className = "", style }: AshenPressProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [documentVisible, setDocumentVisible] = useState(() => (
    typeof document === "undefined" || !document.hidden
  ));
  const [hostVisible, setHostVisible] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || typeof IntersectionObserver === "undefined") return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      setHostVisible(entry?.isIntersecting ?? true);
    }, { rootMargin: "80px" });
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    const update = () => setDocumentVisible(!document.hidden);
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  const mounted = hostVisible && documentVisible;

  useEffect(() => {
    setReady(false);
  }, [mounted]);

  useEffect(() => {
    if (!mounted || !ready) return;
    frameRef.current?.contentWindow?.postMessage(
      { type: "ashen-press:set-active", active },
      "*",
    );
  }, [active, mounted, ready]);

  useEffect(() => {
    const handleAssetRequest = async (event: MessageEvent) => {
      if (event.source !== frameRef.current?.contentWindow) return;
      const data = event.data as { type?: string; id?: string; path?: string } | null;
      const libraryAssets = new Set([
        "/library-optimized-60fps.glb",
        "/library-optimized.glb",
        "/library-performance-50.glb",
        "/library-performance-35.glb",
      ]);
      if (data?.type !== "ashen-press:asset-request" || !data.id || !data.path || !libraryAssets.has(data.path)) return;
      try {
        const response = await fetch(data.path);
        if (!response.ok) throw new Error(`Asset request failed with ${response.status}`);
        const total = Number(response.headers.get("content-length")) || 0;
        let buffer: ArrayBuffer;
        if (response.body && total > 0) {
          const reader = response.body.getReader();
          const chunks: Uint8Array[] = [];
          let loaded = 0;
          let lastReported = 0;
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (!value) continue;
            chunks.push(value);
            loaded += value.byteLength;
            const progress = Math.min(1, loaded / total);
            if (progress - lastReported >= 0.01 || progress === 1) {
              lastReported = progress;
              frameRef.current?.contentWindow?.postMessage(
                { type: "ashen-press:asset-progress", id: data.id, loaded, total },
                "*",
              );
            }
          }
          const merged = new Uint8Array(loaded);
          let offset = 0;
          for (const chunk of chunks) {
            merged.set(chunk, offset);
            offset += chunk.byteLength;
          }
          buffer = merged.buffer;
        } else {
          buffer = await response.arrayBuffer();
        }
        frameRef.current?.contentWindow?.postMessage(
          { type: "ashen-press:asset-response", id: data.id, ok: true, buffer },
          "*",
          [buffer],
        );
      } catch (error) {
        frameRef.current?.contentWindow?.postMessage(
          { type: "ashen-press:asset-response", id: data.id, ok: false, error: String(error) },
          "*",
        );
      }
    };
    window.addEventListener("message", handleAssetRequest);
    return () => window.removeEventListener("message", handleAssetRequest);
  }, []);

  return (
    <div
      ref={hostRef}
      className={`threeui-background ashen-press${className ? ` ${className}` : ""}`}
      role="group"
      aria-label="Interactive Ashen Press art book shelf"
      data-state={!mounted ? "paused" : ready ? "ready" : "loading"}
      style={{
        position: "relative",
        overflow: "hidden",
        background: "#dff1d8",
        pointerEvents: "auto",
        ...style,
      }}
    >
      {mounted ? (
        <iframe
          ref={frameRef}
          title="Ashen Press â€” The Art Book Shelf"
          srcDoc={ashenPressDocument}
          sandbox="allow-scripts allow-same-origin"
          loading="eager"
          onLoad={(event) => {
            event.currentTarget.contentWindow?.postMessage(
              { type: "ashen-press:set-active", active },
              "*",
            );
            setReady(true);
          }}
          style={{
            position: "absolute",
            inset: 0,
            display: "block",
            width: "100%",
            height: "100%",
            border: 0,
            background: "#dff1d8",
            opacity: ready ? 1 : 0,
            pointerEvents: ready ? "auto" : "none",
            transition: "opacity 240ms ease-out",
          }}
        />
      ) : null}
    </div>
  );
}
