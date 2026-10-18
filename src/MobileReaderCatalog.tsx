import { useEffect, useMemo, useRef, useState } from "react";
import { getReaderSectionCopy, type BookInfo } from "./readerSpreads";

type MobileCatalogBook = BookInfo & {
  cover: string;
  creator: string;
  brand: string;
};

type MobileReaderCatalogProps = {
  initialBook: BookInfo | null;
  onReturn: () => void;
};

const MOBILE_BOOKS: MobileCatalogBook[] = [
  {
    id: "the-great-climber",
    title: "The Great Climber",
    sub: "PIXIDIMWORLD STORIES",
    year: "2025",
    vol: "I",
    blurb: "A higher world, a safer tomorrow. Soldiers ascend the colossal spire above the shattered ruins of Earth, facing the sky leviathans.",
    cover: "/mobile-covers/the-great-climber.webp",
    creator: "Donald",
    brand: "PIXIDIMWORLD",
  },
  {
    id: "erdtree",
    title: "Four Friends",
    sub: "3D ANIMATED ADVENTURE",
    year: "2025",
    vol: "II",
    blurb: "A story about friendship, discovery, and the courage it takes to keep moving when every path seems uncertain.",
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
    blurb: "A wealthy entrepreneur returns from the dead to reclaim an empire stolen by his own brother.",
    cover: "/mobile-covers/robin-checker.webp",
    creator: "Donald",
    brand: "PIXIDIMWORLD",
  },
  {
    id: "elden-ring",
    title: "The Middleman",
    sub: "STYLIZED CINEMATIC 3D ANIMATION",
    year: "2025",
    vol: "IV",
    blurb: "A struggling screenwriter searches for the perfect villain, only to discover that betrayal has already written him into the role.",
    cover: "/mobile-covers/the-middle-man.webp",
    creator: "Donald",
    brand: "PIXIDIMWORLD",
  },
  {
    id: "sekiro",
    title: "Stuck With Men",
    sub: "ACTION / TRAGEDY / THRILLER",
    year: "2025",
    vol: "V",
    blurb: "A devoted family man escapes a horrifying military facility, only to discover that his greatest nightmare awaits him at home.",
    cover: "/mobile-covers/stuck-with-men.webp",
    creator: "Donald",
    brand: "PIXIDIMWORLD",
  },
  {
    id: "ds3",
    title: "Black Mask",
    sub: "ACTION / SCI-FI / CRIME / THRILLER",
    year: "2025",
    vol: "VI",
    blurb: "A young hero with a mysterious ability fights crime while searching for the truth behind his father's murder.",
    cover: "/mobile-covers/black-mask.webp",
    creator: "Donald",
    brand: "PIXIDIMWORLD",
  },
  {
    id: "bloodborne",
    title: "The Month June",
    sub: "ACTION / CRIME / THRILLER / REVENGE",
    year: "2025",
    vol: "VII",
    blurb: "After losing everything to a dangerous criminal organization, a desperate man becomes a ruthless assassin seeking vengeance.",
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
    blurb: "Kai wakes inside Reverie, a drowned future shaped by Elias Vale and the mysterious Echo, where every dream carries a price.",
    cover: "/mobile-covers/dreamers.webp",
    creator: "Donald",
    brand: "PIXIDIMWORLD",
  },
  {
    id: "dark-souls",
    title: "A Journey to Dimworld",
    sub: "ADVENTURE / FANTASY",
    year: "2011",
    vol: "IX",
    blurb: "A journey through unknown worlds becomes a search for discovery, belonging, and the courage to cross the boundary into Dimworld.",
    cover: "/mobile-covers/a-journey-to-dimworld.webp",
    creator: "Donald",
    brand: "PIXIDIMWORLD",
  },
];

function buildSummary(book: MobileCatalogBook) {
  return [book.blurb, getReaderSectionCopy(book, 0).summary, getReaderSectionCopy(book, 1).summary]
    .filter((text): text is string => Boolean(text))
    .filter((text) => !text.toLowerCase().includes("reserved for the approved continuation"))
    .filter((text, index, values) => values.indexOf(text) === index)
    .slice(0, 3);
}

export default function MobileReaderCatalog({ initialBook, onReturn }: MobileReaderCatalogProps) {
  const initialId = MOBILE_BOOKS.some((book) => book.id === initialBook?.id)
    ? initialBook!.id
    : MOBILE_BOOKS[0].id;
  const [selectedId, setSelectedId] = useState(initialId);
  const scrollRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (initialBook && MOBILE_BOOKS.some((book) => book.id === initialBook.id)) {
      setSelectedId(initialBook.id);
    }
  }, [initialBook]);

  const selectedBook = MOBILE_BOOKS.find((book) => book.id === selectedId) ?? MOBILE_BOOKS[0];
  const otherBooks = MOBILE_BOOKS.filter((book) => book.id !== selectedBook.id);
  const summary = useMemo(() => buildSummary(selectedBook), [selectedBook]);

  const selectBook = (bookId: string) => {
    if (bookId === selectedId) return;
    setSelectedId(bookId);
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main ref={scrollRef} className="mobile-reader-catalog" aria-label="Book detail">
      <header className="mobile-catalog-header">
        <button type="button" className="mobile-catalog-return" onClick={onReturn} aria-label="Return to library">
          <span aria-hidden="true">←</span>
          Return
        </button>
        <span className="mobile-catalog-brand">PIXIDIMWORLD</span>
        <span aria-hidden="true" />
      </header>

      <article className="mobile-catalog-content">
        <figure className="mobile-catalog-featured">
          <img
            key={selectedBook.id}
            src={selectedBook.cover}
            alt={`${selectedBook.title} cover`}
            width="720"
            height="1080"
            decoding="async"
          />
        </figure>

        <section className="mobile-catalog-story" aria-live="polite">
          <h1>{selectedBook.title}</h1>
          <p className="mobile-catalog-byline">A STORY BY {selectedBook.creator}</p>
          <div className="mobile-catalog-summary">
            {summary.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </div>
        </section>

        <section className="mobile-catalog-credits" aria-label="Credits">
          <h2>Credits</h2>
          <dl>
            <div><dt>Creator</dt><dd>{selectedBook.creator}</dd></div>
            <div><dt>Brand</dt><dd>{selectedBook.brand}</dd></div>
            <div><dt>Edition</dt><dd>{selectedBook.year}</dd></div>
            <div><dt>Volume</dt><dd>{selectedBook.vol}</dd></div>
          </dl>
        </section>

        <section className="mobile-catalog-other" aria-label="Other stories">
          <div className="mobile-catalog-other-heading">
            <h2>Other Stories</h2>
            <span>See All →</span>
          </div>
          <div className="mobile-catalog-grid">
            {otherBooks.map((book) => (
              <button key={book.id} type="button" onClick={() => selectBook(book.id)} aria-label={`Read about ${book.title}`}>
                <img src={book.cover} alt="" width="240" height="360" loading="lazy" decoding="async" />
                <span>{book.title}</span>
              </button>
            ))}
          </div>
        </section>
      </article>
    </main>
  );
}
