import { useState, useRef, useEffect, useCallback } from "react";
import { AshenPress } from "./shaders/ashen-press/AshenPress";
import { LandingPageFrame } from "./shaders/landing-pages/LandingPageFrame";
import { getBookSpreads, getReaderSectionCopy, type BookInfo } from "./readerSpreads";
import "./shaders/threeui.css";
import backgroundMusicUrl from "../music.bg.mp3?url";
import clickSoundUrl from "../click.mp3?url";

type MobileReaderPage = ReturnType<typeof getReaderSectionCopy>;

function MobileReaderPaper({
  page,
  pageIndex,
  storyTitle,
  position,
  focused = false,
  className = "",
  onClick,
}: {
  page: MobileReaderPage;
  pageIndex: number;
  storyTitle: string;
  position: "upper" | "lower" | "focused";
  focused?: boolean;
  className?: string;
  onClick?: () => void;
}) {
  const content = (
    <>
      <img className="mobile-paper-texture" src="/paper.png" alt="" aria-hidden="true" />
      <span className="mobile-paper-copy">
        {focused ? <strong className="mobile-paper-story-title">{storyTitle}</strong> : null}
        <span className="mobile-paper-section">{page.heading}</span>
        <span className="mobile-paper-body">{page.summary}</span>
        <span className="mobile-paper-number">{pageIndex + 1}</span>
      </span>
    </>
  );

  if (onClick) {
    return (
      <button
        className={`mobile-paper-card ${position} ${className}`.trim()}
        type="button"
        onClick={onClick}
        aria-label={`Open ${page.heading}`}
      >
        {content}
      </button>
    );
  }

  return <div className={`mobile-paper-card ${position} ${className}`.trim()}>{content}</div>;
}

export function Scene() {
  const [view, setView] = useState<"library" | "reader">("library");
  const [activeBook, setActiveBook] = useState<BookInfo | null>(null);
  const [readerPrepared, setReaderPrepared] = useState(false);
  const [readerShown, setReaderShown] = useState(false);
  const [readerLoading, setReaderLoading] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPageTurning, setIsPageTurning] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [currentSpreadIndex, setCurrentSpreadIndex] = useState(0);
  const [totalSpreads, setTotalSpreads] = useState(6);
  const [mobilePairStart, setMobilePairStart] = useState(0);
  const [mobileOutgoingPairStart, setMobileOutgoingPairStart] = useState<number | null>(null);
  const [mobileFocusedPage, setMobileFocusedPage] = useState<number | null>(null);
  const [mobileOutgoingFocusedPage, setMobileOutgoingFocusedPage] = useState<number | null>(null);
  const [mobileTransitionDirection, setMobileTransitionDirection] = useState<"next" | "prev" | null>(null);

  const activeBookRef = useRef<BookInfo | null>(null);
  activeBookRef.current = activeBook;

  const frameWinRef = useRef<any>(null);
  const transitionLockedRef = useRef(false);
  const readerReadyRef = useRef(false);
  const readerOpenRequestedRef = useRef(false);
  const transitionTimerRef = useRef<number | null>(null);
  const spreadRequestIdRef = useRef(0);
  const readerSpreadsRef = useRef<Array<{ url: string }>>([]);
  const backgroundMusicRef = useRef<HTMLAudioElement | null>(null);
  const clickSoundRef = useRef<HTMLAudioElement | null>(null);
  const musicStartedRef = useRef(false);
  const musicNeedsInteractionRef = useRef(false);
  const mobileReaderTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const backgroundMusic = new Audio(backgroundMusicUrl);
    const clickSound = new Audio(clickSoundUrl);
    backgroundMusic.loop = true;
    backgroundMusic.preload = "auto";
    clickSound.preload = "auto";
    clickSound.load();
    backgroundMusicRef.current = backgroundMusic;
    clickSoundRef.current = clickSound;

    const playBackgroundMusic = () => {
      if (document.hidden) {
        musicNeedsInteractionRef.current = true;
        return;
      }
      musicNeedsInteractionRef.current = false;
      void backgroundMusic.play().catch(() => {
        musicNeedsInteractionRef.current = true;
      });
    };

    const playClickSound = () => {
      clickSound.pause();
      clickSound.currentTime = 0;
      void clickSound.play().catch(() => {});
    };

    const handleValidInteraction = (kind: string) => {
      playClickSound();
      if (kind === "unlock" && !musicStartedRef.current) {
        musicStartedRef.current = true;
        playBackgroundMusic();
      } else if (musicStartedRef.current && musicNeedsInteractionRef.current) {
        playBackgroundMusic();
      }
    };

    const handleDocumentPointerDown = (event: PointerEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      const control = target?.closest<HTMLElement>(
        "button, a[href], [role='button'], input, select, textarea, [data-audio-interactive]",
      );
      if (!control || control.matches(":disabled, [aria-disabled='true']")) return;
      handleValidInteraction("control");
    };

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type !== "ashen-press:audio-interaction") return;
      handleValidInteraction(event.data.kind === "unlock" ? "unlock" : "control");
    };

    const pauseForInactivity = () => {
      if (!musicStartedRef.current || backgroundMusic.paused) return;
      backgroundMusic.pause();
      musicNeedsInteractionRef.current = true;
    };

    const handleVisibility = () => {
      if (document.hidden) pauseForInactivity();
    };

    document.addEventListener("pointerdown", handleDocumentPointerDown, true);
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", pauseForInactivity);
    window.addEventListener("message", handleMessage);

    return () => {
      document.removeEventListener("pointerdown", handleDocumentPointerDown, true);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", pauseForInactivity);
      window.removeEventListener("message", handleMessage);
      backgroundMusic.pause();
      clickSound.pause();
      backgroundMusicRef.current = null;
      clickSoundRef.current = null;
    };
  }, []);

  const clearTransitionTimer = () => {
    if (transitionTimerRef.current !== null) {
      window.clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }
  };

  const revokeReaderSpreads = () => {
    for (const spread of readerSpreadsRef.current) {
      if (spread.url.startsWith("blob:")) URL.revokeObjectURL(spread.url);
    }
    readerSpreadsRef.current = [];
  };

  const finishTransition = () => {
    clearTransitionTimer();
    transitionLockedRef.current = false;
    setIsTransitioning(false);
  };

  const revealReader = () => {
    if (!transitionLockedRef.current || !readerReadyRef.current) return;
    readerOpenRequestedRef.current = false;
    setView("reader");
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        setReaderShown(true);
        setReaderLoading(false);
        clearTransitionTimer();
        transitionTimerRef.current = window.setTimeout(finishTransition, 200);
      });
    });
  };

  const triggerOpenTransition = () => {
    if (transitionLockedRef.current) return;
    transitionLockedRef.current = true;
    readerOpenRequestedRef.current = true;
    setIsTransitioning(true);
    setReaderLoading(true);
    clearTransitionTimer();
    if (readerReadyRef.current) revealReader();
  };

  const handleReturnToLibrary = () => {
    if (transitionLockedRef.current) return;
    transitionLockedRef.current = true;
    readerOpenRequestedRef.current = false;
    setReaderLoading(false);
    setIsTransitioning(true);
    setView("library");
    setReaderShown(false);
    setIsPageTurning(false);
    setMobileFocusedPage(null);
    setMobileOutgoingFocusedPage(null);
    setMobileOutgoingPairStart(null);
    setMobileTransitionDirection(null);
    if (mobileReaderTimerRef.current !== null) {
      window.clearTimeout(mobileReaderTimerRef.current);
      mobileReaderTimerRef.current = null;
    }
    clearTransitionTimer();
    transitionTimerRef.current = window.setTimeout(() => {
      setReaderPrepared(false);
      frameWinRef.current = null;
      readerReadyRef.current = false;
      spreadRequestIdRef.current += 1;
      revokeReaderSpreads();
      finishTransition();
    }, 200);
  };

  // Catch messages from both the 3D library and the reader sketchbook.
  useEffect(() => {
    const prepareBook = (book: BookInfo) => {
      if (activeBookRef.current?.id !== book.id) {
        spreadRequestIdRef.current += 1;
        readerReadyRef.current = false;
        setCurrentSpreadIndex(0);
        setZoomLevel(1);
        setMobilePairStart(0);
        setMobileFocusedPage(null);
        setMobileOutgoingFocusedPage(null);
        setMobileOutgoingPairStart(null);
      }
      activeBookRef.current = book;
      setActiveBook(book);
      setReaderPrepared(true);
    };

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "ashen-press:prepare-reader" && event.data.book) {
        prepareBook(event.data.book as BookInfo);
      } else if (event.data?.type === "ashen-press:open-reader" && event.data.book) {
        prepareBook(event.data.book as BookInfo);
        triggerOpenTransition();
      } else if (event.data?.type === "ashen-press:reader-page") {
        setCurrentSpreadIndex(typeof event.data.pageIndex === "number" ? event.data.pageIndex : 0);
      } else if (event.data?.type === "ashen-press:reader-turn") {
        setIsPageTurning(event.data.active === true);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  useEffect(() => () => {
    clearTransitionTimer();
    if (mobileReaderTimerRef.current !== null) window.clearTimeout(mobileReaderTimerRef.current);
    spreadRequestIdRef.current += 1;
    revokeReaderSpreads();
  }, []);
  // Zoom control handlers
  const handleZoomIn = () => {
    setZoomLevel((prev) => {
      const next = Math.min(1.35, +(prev + 0.15).toFixed(2));
      frameWinRef.current?.__setZoom?.(next);
      return next;
    });
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => {
      const next = Math.max(0.75, +(prev - 0.15).toFixed(2));
      frameWinRef.current?.__setZoom?.(next);
      return next;
    });
  };

  // Inject the chosen book's dual-page spreads into the existing flip engine.
  const applyBookToSketchbook = useCallback((frame: HTMLIFrameElement) => {
    const updateContent = async () => {
      try {
        const win = frame.contentWindow as any;
        const doc = frame.contentDocument;
        if (!win || !doc) return;
        if (!doc.getElementById("sbBook")) return;
        frameWinRef.current = win;

        const markReaderReady = () => {
          win.requestAnimationFrame(() => {
            readerReadyRef.current = true;
            if (readerOpenRequestedRef.current) revealReader();
          });
        };

        const currentBook = activeBookRef.current || {
          id: "the-great-climber",
          title: "The Great Climber",
          sub: "PIXIDIMWORLD STORIES",
          year: "2025",
          vol: "I",
          blurb: "A higher world, a safer tomorrow.",
        };

        const readerKey = currentBook.id;
        if (win.__pixidimReaderKey === readerKey) {
          markReaderReady();
          return;
        }
        if (win.__pixidimReaderLoadingKey === readerKey) return;
        win.__pixidimReaderLoadingKey = readerKey;
        const requestId = ++spreadRequestIdRef.current;

        // Inject transparent theme style into the iframe so page 2 background dots show through
        let themeStyle = doc.getElementById("white-reader-theme");
        if (!themeStyle) {
          themeStyle = doc.createElement("style");
          themeStyle.id = "white-reader-theme";
          themeStyle.textContent = `
            :root {
              --paper: transparent !important;
            }
            html, body, .page.home {
              background: transparent !important;
              overflow: hidden !important;
              width: 100vw !important;
              height: 100vh !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            .wash, .botany, .hero-down, .about, .bloom, #contact, .rule, .plates, .top {
              display: none !important;
            }
            .hero {
              min-height: 100vh !important;
              height: 100vh !important;
              padding: 0 !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              overflow: hidden !important;
            }
            .hero-kicker {
              display: none !important;
            }
            .sb-wrap {
              margin: 0 !important;
              margin-top: 36px !important;
              position: relative !important;
              width: 100% !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
            }
            .sb-stage {
              width: 100% !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
            }
            .sb-captions, .sb-tools, .sb-hint, .sb-arrow {
              display: none !important;
            }
            .sb-3d {
              margin: 0 auto !important;
              max-width: min(88vw, 1080px) !important;
              width: 100% !important;
            }
            .sb-book {
              position: relative !important;
              width: 100% !important;
              aspect-ratio: 1760/1240 !important;
            }
            @media (min-width: 761px) {
              .sb-3d {
                max-width: min(88vw, 1080px, calc(151vh - 124px)) !important;
                transform: translateX(11px) scale(1.047, 0.94) !important;
                transform-origin: 50% 0 !important;
              }
            }
            @media (max-width: 760px) {
              .sb-wrap { margin-top: 0 !important; }
              .sb-3d { max-width: min(91vw, 560px) !important; }
            }
          `;
          doc.head.appendChild(themeStyle);
        }

        const spreads = await getBookSpreads(currentBook);
        if (requestId !== spreadRequestIdRef.current || !frame.isConnected) {
          for (const spread of spreads) {
            if (spread.url.startsWith("blob:")) URL.revokeObjectURL(spread.url);
          }
          return;
        }
        setTotalSpreads(spreads.length);

        // Use win.eval to define __setSpreads with direct lexical access to PAGES, paint, setView, etc.
        win.eval(`
          window.__setSpreads = function(newSpreads) {
            if (typeof endIntro === 'function') {
              endIntro();
            }
            introOn = false;
            if (typeof riffle !== 'undefined') riffle = null;
            if (typeof spring !== 'undefined') spring = null;
            if (typeof wrap !== 'undefined' && wrap) {
              wrap.classList.remove('intro', 'b2');
            }
            PAGES.length = 0;
            for (var i = 0; i < newSpreads.length; i++) {
              PAGES.push(newSpreads[i]);
            }
            idx = 0;
            turn = null;
            drag = null;
            dragT = null;

            if (typeof setView === 'function') {
              setView(0, 0, 1);
            }
            if (typeof layout === 'function') {
              layout();
            }
            if (typeof paint === 'function') {
              paint();
            }
            if (typeof restLoupe === 'function') {
              restLoupe();
            }
            window.dispatchEvent(new Event('resize'));
          };

          window.__setZoom = function(z) {
            if (typeof setView === 'function') {
              setView(view.rx, view.ry, z);
            }
          };

          window.__readerStep = function(direction) {
            if (turn || spring || drag || introOn) return false;
            step(direction === 'prev' ? 'prev' : 'next');
            return true;
          };
        `);

        if (typeof win.__setSpreads === "function") {
          const previousSpreads = readerSpreadsRef.current;
          win.__setSpreads(spreads);
          readerSpreadsRef.current = spreads;
          for (const spread of previousSpreads) {
            if (spread.url.startsWith("blob:")) URL.revokeObjectURL(spread.url);
          }
          win.__pixidimReaderKey = readerKey;
          win.__pixidimReaderLoadingKey = null;
          markReaderReady();
        }
      } catch (err) {
        console.warn("Could not inject custom spreads into sketchbook frame:", err);
        readerOpenRequestedRef.current = false;
        setReaderLoading(false);
        finishTransition();
      }
    };

    let readerDocumentReady = false;
    try {
      readerDocumentReady = !!frame.contentDocument?.getElementById("sbBook");
    } catch {}

    if (readerDocumentReady) {
      updateContent();
    } else {
      frame.addEventListener("load", updateContent, { once: true });
    }
  }, [activeBook?.id]);

  const handlePageStep = (direction: "prev" | "next") => {
    if (isPageTurning) return;
    const started = frameWinRef.current?.__readerStep?.(direction) === true;
    if (started) setIsPageTurning(true);
  };

  const readerCopy = getReaderSectionCopy(activeBook, currentSpreadIndex);
  const mobilePageCount = Math.max(1, Math.min(totalSpreads, 6));
  const mobilePages = Array.from({ length: mobilePageCount }, (_, index) => getReaderSectionCopy(activeBook, index));
  const mobileStoryTitle = activeBook?.title || "The Great Climber";

  const finishMobileReaderTransition = () => {
    if (mobileReaderTimerRef.current !== null) window.clearTimeout(mobileReaderTimerRef.current);
    mobileReaderTimerRef.current = window.setTimeout(() => {
      setMobileOutgoingPairStart(null);
      setMobileOutgoingFocusedPage(null);
      setMobileTransitionDirection(null);
      mobileReaderTimerRef.current = null;
    }, 380);
  };

  const handleMobilePairStep = (direction: "prev" | "next") => {
    if (mobileTransitionDirection) return;
    const nextPairStart = mobilePairStart + (direction === "next" ? 2 : -2);
    if (nextPairStart < 0 || nextPairStart >= mobilePageCount) return;
    setMobileOutgoingPairStart(mobilePairStart);
    setMobileTransitionDirection(direction);
    setMobilePairStart(nextPairStart);
    finishMobileReaderTransition();
  };

  const handleMobileFocusStep = (direction: "prev" | "next") => {
    if (mobileFocusedPage === null || mobileTransitionDirection) return;
    const nextPage = mobileFocusedPage + (direction === "next" ? 1 : -1);
    if (nextPage < 0 || nextPage >= mobilePageCount) return;
    setMobileOutgoingFocusedPage(mobileFocusedPage);
    setMobileTransitionDirection(direction);
    setMobileFocusedPage(nextPage);
    finishMobileReaderTransition();
  };

  return (
    <div className="app-container">
      {/* 3D Library Scene - kept mounted so camera framing and book positions persist */}
      <div
        className="view-layer shader-frame"
        style={{
          visibility: view === "library" || isTransitioning ? "visible" : "hidden",
          pointerEvents: view === "library" && !isTransitioning ? "auto" : "none",
        }}
      >
        <AshenPress active={view === "library"} />
      </div>

      {readerLoading ? (
        <div className="read-loading-screen" role="status" aria-live="polite" aria-label="Loading reading page">
          <p>
            <span>Loading</span>
            <span className="read-loading-dots" aria-hidden="true">
              <i>.</i><i>.</i><i>.</i>
            </span>
          </p>
        </div>
      ) : null}

      {/* Reading Page Layer. The existing flip engine remains inside its single iframe. */}
      {view === "reader" || readerPrepared ? (
        <div
          className={`reading-page-container${readerShown ? " is-visible" : ""}`}
          aria-hidden={!readerShown}
        >
          {/* Background dots asset with 85% opacity */}
          <div className="reading-page-bg" />

          <div className="reading-layout">
            <section className="reading-book-stage" aria-label="Open story book">
              <header className="reading-page-header">
                <button
                  className="reading-return-btn"
                  onClick={handleReturnToLibrary}
                  aria-label="Return Back"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="19" y1="12" x2="5" y2="12" />
                    <polyline points="12 19 5 12 12 5" />
                  </svg>
                  <span>Return Back</span>
                </button>
                <h1 className="reading-title">{activeBook?.title || "The Great Climber"}</h1>
              </header>

              <div className="reading-iframe-layer">
                <LandingPageFrame
                  applyScene={applyBookToSketchbook}
                  sourceUrl="/landing-pages/meng-to-sketchbook.html?nointro=1&reader=1&v=3"
                  title="PIXIDIMWORLD story reader"
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", background: "transparent" }}
                />
              </div>

              <button
                className="reading-page-nav previous"
                type="button"
                onClick={() => handlePageStep("prev")}
                disabled={isPageTurning}
                aria-label="Previous spread"
              >
                PREVIOUS
              </button>
              <button
                className="reading-page-nav next"
                type="button"
                onClick={() => handlePageStep("next")}
                disabled={isPageTurning}
                aria-label="Next spread"
              >
                NEXT
              </button>
            </section>

            <aside className="reading-content-panel" aria-label="Current story section">
              <section className="reading-summary-block" aria-live="polite">
                <p className="reading-section-label">{readerCopy.heading}</p>
                <h2>Story Summary</h2>
                <span className="reading-summary-rule" aria-hidden="true" />
                <p key={`${activeBook?.id || "book"}-${currentSpreadIndex}`} className="reading-summary-copy">
                  {readerCopy.summary}
                </p>
              </section>

              <section className="reading-book-information">
                <span className="reading-book-rule" aria-hidden="true" />
                <h2>{activeBook?.title || "The Great Climber"}</h2>
                <p>{activeBook?.blurb || "Every page opens another horizon."}</p>
              </section>
            </aside>
          </div>

          <section className={`mobile-reader${mobileFocusedPage !== null ? " is-focused" : ""}`} aria-label="Mobile story reader">
            <button
              className="mobile-reader-return"
              type="button"
              onClick={handleReturnToLibrary}
              aria-label="Return to selected book"
            >
              <svg viewBox="0 0 64 44" aria-hidden="true">
                <path d="M59 26H13m0 0 15-15M13 26l15 15M13 26c13-17 28-20 44-11" />
              </svg>
              <span>Return</span>
            </button>

            <div className="mobile-reader-overview" aria-hidden={mobileFocusedPage !== null}>
              <img className="mobile-reader-flower flower-top" src="/flower.png" alt="" aria-hidden="true" />
              <img className="mobile-reader-flower flower-bottom" src="/flower.png" alt="" aria-hidden="true" />

              {mobileOutgoingPairStart !== null ? (
                <div className={`mobile-paper-pair is-outgoing ${mobileTransitionDirection}`} aria-hidden="true">
                  {mobilePages[mobileOutgoingPairStart] ? (
                    <MobileReaderPaper
                      page={mobilePages[mobileOutgoingPairStart]}
                      pageIndex={mobileOutgoingPairStart}
                      storyTitle={mobileStoryTitle}
                      position="upper"
                      className="overview-paper"
                    />
                  ) : null}
                  {mobilePages[mobileOutgoingPairStart + 1] ? (
                    <MobileReaderPaper
                      page={mobilePages[mobileOutgoingPairStart + 1]}
                      pageIndex={mobileOutgoingPairStart + 1}
                      storyTitle={mobileStoryTitle}
                      position="lower"
                      className="overview-paper"
                    />
                  ) : null}
                </div>
              ) : null}

              <div className={`mobile-paper-pair${mobileOutgoingPairStart !== null ? ` is-incoming ${mobileTransitionDirection}` : ""}`}>
                {mobilePages[mobilePairStart] ? (
                  <MobileReaderPaper
                    page={mobilePages[mobilePairStart]}
                    pageIndex={mobilePairStart}
                    storyTitle={mobileStoryTitle}
                    position="upper"
                    className="overview-paper"
                    onClick={() => setMobileFocusedPage(mobilePairStart)}
                  />
                ) : null}
                {mobilePages[mobilePairStart + 1] ? (
                  <MobileReaderPaper
                    page={mobilePages[mobilePairStart + 1]}
                    pageIndex={mobilePairStart + 1}
                    storyTitle={mobileStoryTitle}
                    position="lower"
                    className="overview-paper"
                    onClick={() => setMobileFocusedPage(mobilePairStart + 1)}
                  />
                ) : null}
              </div>

              <nav className="mobile-overview-nav" aria-label="Story page pair navigation">
                <button
                  className="mobile-overview-control previous"
                  type="button"
                  onClick={() => handleMobilePairStep("prev")}
                  disabled={mobilePairStart === 0 || mobileTransitionDirection !== null}
                  aria-label="Show previous two story pages"
                >
                  <span aria-hidden="true">←</span>
                  <small>PREVIOUS</small>
                </button>
                <button
                  className="mobile-overview-control next"
                  type="button"
                  onClick={() => handleMobilePairStep("next")}
                  disabled={mobilePairStart + 2 >= mobilePageCount || mobileTransitionDirection !== null}
                  aria-label="Show next two story pages"
                >
                  <span aria-hidden="true">→</span>
                  <small>NEXT</small>
                </button>
              </nav>

              <h1 className="mobile-reader-title">{mobileStoryTitle}</h1>
            </div>

            {mobileFocusedPage !== null && mobilePages[mobileFocusedPage] ? (
              <div className="mobile-reader-focus" onClick={() => setMobileFocusedPage(null)}>
                <div
                  className="mobile-focus-paper-stage"
                  onClick={(event) => {
                    if (event.target instanceof Element && event.target.closest(".mobile-paper-card")) {
                      event.stopPropagation();
                    }
                  }}
                >
                  {mobileOutgoingFocusedPage !== null && mobilePages[mobileOutgoingFocusedPage] ? (
                    <MobileReaderPaper
                      page={mobilePages[mobileOutgoingFocusedPage]}
                      pageIndex={mobileOutgoingFocusedPage}
                      storyTitle={mobileStoryTitle}
                      position="focused"
                      focused
                      className={`focus-out-${mobileTransitionDirection}`}
                    />
                  ) : null}
                  <MobileReaderPaper
                    key={`${mobileStoryTitle}-${mobileFocusedPage}`}
                    page={mobilePages[mobileFocusedPage]}
                    pageIndex={mobileFocusedPage}
                    storyTitle={mobileStoryTitle}
                    position="focused"
                    focused
                    className={mobileOutgoingFocusedPage !== null ? `focus-in-${mobileTransitionDirection}` : ""}
                  />
                </div>
                <nav className="mobile-focus-nav" aria-label="Focused page navigation" onClick={(event) => event.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => handleMobileFocusStep("prev")}
                    disabled={mobileFocusedPage === 0 || mobileTransitionDirection !== null}
                    aria-label="Previous story page"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMobileFocusStep("next")}
                    disabled={mobileFocusedPage === mobilePageCount - 1 || mobileTransitionDirection !== null}
                    aria-label="Next story page"
                  >
                    →
                  </button>
                </nav>
              </div>
            ) : null}
          </section>

          {/* Existing zoom controls remain wired to the original reader engine. */}
          <div className="reading-controls-pill">
            <button
              className="pill-btn minus"
              onClick={handleZoomOut}
              aria-label="Zoom Out"
            >
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>

            <span className="pill-divider" aria-hidden="true" />

            <span className="pill-counter">
              Page {Math.min(totalSpreads * 2, currentSpreadIndex * 2 + 1)} of {totalSpreads * 2}
            </span>

            <span className="pill-divider" aria-hidden="true" />

            <button
              className="pill-btn plus"
              onClick={handleZoomIn}
              aria-label="Zoom In"
            >
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      ) : null}

    </div>
  );
}
