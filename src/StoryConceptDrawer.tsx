import { useState } from "react";

type StoryConceptDrawerProps = {
  active: boolean;
};

const DRAWER_SEEN_KEY = "pixidimworld-story-drawer-seen";

const SECTIONS = [
  {
    heading: "THE IDEA",
    body: "I write stories and I have a long-term vision of building my own animation studio. Instead of presenting those ideas as ordinary text documents or static book covers, I wanted to create a space where people could explore them visually.",
  },
  {
    heading: "NOT FULL BOOKS",
    body: "These are not complete 300- or 400-page novels. Each book represents a story concept: the premise, the world, the main conflict, and the core direction of the story.",
  },
  {
    heading: "WHY 3D?",
    body: "A normal digital bookshelf felt too static. I wanted the stories to feel discoverable. The books sit physically on shelves, react when you hover, and can be summoned from the shelf when selected.",
  },
  {
    heading: "THE EXPERIENCE",
    body: "You can explore the shelves, choose a story, bring its book forward, read its concept, and move between different ideas through an interactive 3D environment.",
  },
  {
    heading: "THE PURPOSE",
    body: "The project combines storytelling, interactive web design, motion, and 3D development. It is both a creative archive of my story ideas and a demonstration of how narrative can be presented differently on the web.",
  },
];

export default function StoryConceptDrawer({ active }: StoryConceptDrawerProps) {
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(() => {
    try {
      return window.sessionStorage.getItem(DRAWER_SEEN_KEY) === "1";
    } catch {
      return false;
    }
  });

  const toggleDrawer = () => {
    setOpen((current) => !current);
    if (!seen) {
      setSeen(true);
      try {
        window.sessionStorage.setItem(DRAWER_SEEN_KEY, "1");
      } catch {
        // Storage may be unavailable in private browsing; local state still stops the pulse.
      }
    }
  };

  return (
    <div className={`story-drawer-system${open ? " is-open" : ""}${active ? " is-active" : ""}`}>
      <aside className="story-concept-drawer" aria-hidden={!open} aria-label="About PIXIDIMWORLD STORIES">
        <div className="story-drawer-scroll">
          <p className="story-drawer-kicker">THE STORY BEHIND THE SHELVES</p>
          <h2>Why I Built PIXIDIMWORLD STORIES</h2>
          <p className="story-drawer-intro">
            PIXIDIMWORLD STORIES is a 3D interactive story-concept experience built to present my original story ideas in a more immersive way than a traditional static portfolio.
          </p>

          <div className="story-drawer-sections">
            {SECTIONS.map((section) => (
              <section key={section.heading}>
                <h3>{section.heading}</h3>
                <p>{section.body}</p>
              </section>
            ))}
            <section className="story-drawer-how-to">
              <h3>HOW TO USE</h3>
              <p>
                Need a quick guide to the experience? Click the question-mark icon in the top-right corner of the library to see the controls and learn how to navigate the site.
              </p>
            </section>
          </div>
        </div>
      </aside>

      <button
        type="button"
        className={`story-drawer-handle${!seen && !open ? " should-pulse" : ""}`}
        onClick={toggleDrawer}
        aria-expanded={open}
        aria-label={open ? "Close project story panel" : "Open project story panel"}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d={open ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} />
        </svg>
      </button>
    </div>
  );
}
