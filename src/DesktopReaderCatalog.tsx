import { useEffect, useMemo, useRef, useState } from "react";
import { getReaderSectionCopy, type BookInfo } from "./readerSpreads";
import DesktopReaderLoupe from "./DesktopReaderLoupe";
import "./desktop-reader-catalog.css";
import "./desktop-reader-cover.css";

type CatalogBook = BookInfo & {
  cover: string;
  creator: string;
  brand: string;
};

type DesktopReaderCatalogProps = {
  initialBook: BookInfo | null;
  onReturn: () => void;
  onSelectBook?: (book: BookInfo) => void;
};

const cover = (path: string) => new URL(path, import.meta.url).href;

const CATALOG_BOOKS: CatalogBook[] = [
  {
    id: "the-great-climber",
    title: "The Great Climber",
    sub: "PIXIDIMWORLD STORIES",
    year: "2025",
    vol: "I",
    blurb:
      "A higher world, a safer tomorrow. Soldiers ascend the colossal spire above the shattered ruins of Earth, facing the sky leviathans.",
    cover: cover("../the-great-climber-front.webp"),
    creator: "Donald",
    brand: "PIXIDIMWORLD",
  },
  {
    id: "erdtree",
    title: "Four Friends",
    sub: "3D ANIMATED ADVENTURE",
    year: "2025",
    vol: "II",
    blurb:
      "A story about friendship, discovery, and the courage it takes to keep moving when every path seems uncertain.",
    cover: "/mobile-covers/four%20friends2.png",
    creator: "Donald",
    brand: "PIXIDIMWORLD",
  },
  {
    id: "ac6",
    title: "Robin Checker",
    sub: "ACTION / CRIME / THRILLER",
    year: "2025",
    vol: "III",
    blurb:
      "A wealthy entrepreneur returns from the dead to reclaim an empire stolen by his own brother.",
    cover: cover("../books/ROBIN CHECKER(FRONT).jpg"),
    creator: "Donald",
    brand: "PIXIDIMWORLD",
  },
  {
    id: "elden-ring",
    title: "The Middleman",
    sub: "STYLIZED CINEMATIC 3D ANIMATION",
    year: "2025",
    vol: "IV",
    blurb:
      "A struggling screenwriter searches for the perfect villain, only to discover that betrayal has already written him into the role.",
    cover: cover("../books/the middle man(front).webp"),
    creator: "Donald",
    brand: "PIXIDIMWORLD",
  },
  {
    id: "sekiro",
    title: "Stuck With Men",
    sub: "ACTION / TRAGEDY / THRILLER",
    year: "2025",
    vol: "V",
    blurb:
      "A devoted family man escapes a horrifying military facility, only to discover that his greatest nightmare awaits him at home.",
    cover: cover("../books/STUCK WITH MEN(FRONT).jpg"),
    creator: "Donald",
    brand: "PIXIDIMWORLD",
  },
  {
    id: "ds3",
    title: "Black Mask",
    sub: "ACTION / SCI-FI / CRIME / THRILLER",
    year: "2025",
    vol: "VI",
    blurb:
      "A young hero with a mysterious ability fights crime while searching for the truth behind his father's murder.",
    cover: cover("../books/BLACK MASK(FRONT).jpg"),
    creator: "Donald",
    brand: "PIXIDIMWORLD",
  },
  {
    id: "bloodborne",
    title: "The Month June",
    sub: "ACTION / CRIME / THRILLER / REVENGE",
    year: "2025",
    vol: "VII",
    blurb:
      "After losing everything to a dangerous criminal organization, a desperate man becomes a ruthless assassin seeking vengeance.",
    cover: "/mobile-covers/the%20month%20june.png",
    creator: "Donald",
    brand: "PIXIDIMWORLD",
  },
  {
    id: "ds2",
    title: "Dreamers",
    sub: "STYLIZED CINEMATIC 3D ANIMATION",
    year: "2025",
    vol: "VIII",
    blurb:
      "Kai wakes inside Reverie, a drowned future shaped by Elias Vale and the mysterious Echo, where every dream carries a price.",
    cover: cover("../books/dreamers(front).webp"),
    creator: "Donald",
    brand: "PIXIDIMWORLD",
  },
  {
    id: "dark-souls",
    title: "A Journey to Dimworld",
    sub: "ADVENTURE / FANTASY",
    year: "2011",
    vol: "IX",
    blurb:
      "A journey through unknown worlds becomes a search for discovery, belonging, and the courage to cross the boundary into Dimworld.",
    cover: cover("../books/a journey to dimworld(front).jpg"),
    creator: "Donald",
    brand: "PIXIDIMWORLD",
  },
];

function buildSummary(book: CatalogBook) {
  const candidates = [
    book.blurb,
    getReaderSectionCopy(book, 0).summary,
    getReaderSectionCopy(book, 1).summary,
  ];

  return candidates
    .filter((text): text is string => Boolean(text))
    .filter((text) => !text.toLowerCase().includes("reserved for the approved continuation"))
    .filter((text, index, values) => values.indexOf(text) === index)
    .slice(0, 3);
}

export default function DesktopReaderCatalog({
  initialBook,
  onReturn,
  onSelectBook,
}: DesktopReaderCatalogProps) {
  const initialId = CATALOG_BOOKS.some((book) => book.id === initialBook?.id)
    ? initialBook!.id
    : CATALOG_BOOKS[0].id;
  const [selectedId, setSelectedId] = useState(initialId);
  const [isSwapping, setIsSwapping] = useState(false);
  const swapTimer = useRef<number | null>(null);
  const settleTimer = useRef<number | null>(null);
  const readerGridRef = useRef<HTMLDivElement>(null);
  const storyCopyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialBook && CATALOG_BOOKS.some((book) => book.id === initialBook.id)) {
      setSelectedId(initialBook.id);
    }
  }, [initialBook]);

  useEffect(
    () => () => {
      if (swapTimer.current !== null) window.clearTimeout(swapTimer.current);
      if (settleTimer.current !== null) window.clearTimeout(settleTimer.current);
    },
    [],
  );

  const selectedBook =
    CATALOG_BOOKS.find((book) => book.id === selectedId) ?? CATALOG_BOOKS[0];
  const railBooks = CATALOG_BOOKS.filter((book) => book.id !== selectedBook.id);
  const summary = useMemo(() => buildSummary(selectedBook), [selectedBook]);

  const selectBook = (bookId: string) => {
    if (isSwapping || bookId === selectedId) return;
    const nextBook = CATALOG_BOOKS.find((book) => book.id === bookId);
    if (!nextBook) return;

    setIsSwapping(true);
    swapTimer.current = window.setTimeout(() => {
      setSelectedId(bookId);
      onSelectBook?.(nextBook);
    }, 230);
    settleTimer.current = window.setTimeout(() => setIsSwapping(false), 610);
  };

  return (
    <main
      className={`desktop-reader-catalog${isSwapping ? " is-swapping" : ""}`}
      aria-label="Book detail"
    >
      <article className="desktop-reader-shell">
        <header className="desktop-reader-nav">
          <button className="desktop-reader-return" type="button" onClick={onReturn}>
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="M12.7 4.5 7.2 10l5.5 5.5M7.6 10h8" />
            </svg>
            Return
          </button>
          <div className="desktop-reader-brand">PIXIDIMWORLD</div>
          <span aria-hidden="true" />
        </header>

        <div ref={readerGridRef} className="desktop-reader-grid">
          <section className="desktop-featured-book" aria-label="Featured book cover">
            <img
              className="desktop-featured-cover"
              src={selectedBook.cover}
              alt={`${selectedBook.title} cover`}
            />
          </section>

          <section className="desktop-story-information" aria-live="polite">
            <div ref={storyCopyRef} className="desktop-story-copy">
              <h1>{selectedBook.title}</h1>
              <p className="desktop-story-byline">A STORY BY {selectedBook.creator}</p>

              <div className="desktop-story-summary">
                {summary.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>

              <div className="desktop-story-divider" aria-hidden="true" />
              <div className="desktop-story-credits">
                <h2>Credits</h2>
                <dl>
                  <div>
                    <dt>Creator</dt>
                    <dd>{selectedBook.creator}</dd>
                  </div>
                  <div>
                    <dt>Brand</dt>
                    <dd>{selectedBook.brand}</dd>
                  </div>
                  <div>
                    <dt>Edition</dt>
                    <dd>{selectedBook.year ?? "2025"}</dd>
                  </div>
                  <div>
                    <dt>Volume</dt>
                    <dd>{selectedBook.vol ?? "—"}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </section>

          <aside className="desktop-book-rail" aria-label="Choose another book">
            <h2 className="desktop-book-rail-title">Other Books</h2>
            <div className="desktop-book-rail-scroll">
              {railBooks.map((book) => (
                <button
                  className="desktop-book-rail-item"
                  type="button"
                  key={book.id}
                  onClick={() => selectBook(book.id)}
                  disabled={isSwapping}
                >
                  <img src={book.cover} alt="" />
                  <span>{book.title}</span>
                </button>
              ))}
            </div>
          </aside>

          <DesktopReaderLoupe
            containerRef={readerGridRef}
            sourceRef={storyCopyRef}
            refreshKey={selectedBook.id}
          />
        </div>
      </article>
    </main>
  );
}
