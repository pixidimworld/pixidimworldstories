// Book spreads generator for the white reading page

export interface BookSpread {
  file?: string;
  url: string;
  title: string;
  place: string;
}

export interface BookInfo {
  id: string;
  title: string;
  sub?: string;
  year?: string;
  vol?: string;
  blurb?: string;
}

export interface ReaderSectionCopy {
  heading: string;
  summary: string;
}

const COMPLETED_READER_SECTIONS: Record<string, ReaderSectionCopy[]> = {
  "the-great-climber": [
    {
      heading: "Chapters 1 & 2",
      summary: "In the ruins of Earth, scout captain Maya refuses to wait for extinction. She gathers a small expedition to climb the impossible ladder above the city and find the source of the creatures descending from the clouds.",
    },
    {
      heading: "Chapters 3 & 4",
      summary: "The climbers leave the shattered city far below and enter the frozen lower atmosphere. Among abandoned orbital structures and strange husks, they realize the ladder is not a weapon but a conduit feeding on the world beneath it.",
    },
    {
      heading: "Chapters 5 & 6",
      summary: "Beyond the storm layer, the team discovers a floating civilization and its biomechanical leviathans. An ancient archive reveals that the ladder was once an evacuation route, not an instrument of invasion.",
    },
    {
      heading: "Chapters 7 & 8",
      summary: "A forgotten quarantine protocol has mistaken humanity for a threat. Maya leads the team through shifting corridors and dormant sentinels toward the citadel's Primary Core, where the obsolete command can finally be challenged.",
    },
    {
      heading: "Chapters 9 & 10",
      summary: "Inside the Core, the expedition finds a living refuge capable of sustaining thousands. Maya performs the sovereign override, ending the attacks and transforming the ladder into a path toward survival.",
    },
    {
      heading: "Chapters 11 & 12",
      summary: "The first survivors rise from the underground settlement into clean air and open sky. Maya's climb becomes the beginning of a new human chapter: not an escape from Earth, but a chance to help it heal.",
    },
  ],
  "elden-ring": [
    {
      heading: "Chapters 1 & 2",
      summary: "A teenage betrayal becomes the wound a future screenwriter never fully leaves behind. Years later, he has learned to hide it beneath ambition while quietly reshaping every memory around his own innocence.",
    },
    {
      heading: "Chapters 3 & 4",
      summary: "Now a working screenwriter, he accepts a powerful producer's psychological-thriller assignment. The story of a good man pursued by an unseen enemy feels uncomfortably familiar before the first page is written.",
    },
    {
      heading: "Chapters 5 & 6",
      summary: "His heroic protagonist grows purer as the villain becomes more intimate. Details from the writer's own betrayal begin entering the screenplay, returning no matter how often he removes them.",
    },
    {
      heading: "Chapters 7 & 8",
      summary: "Whispers, shadows, and impossible new lines blur the border between his apartment and the screenplay. Exhaustion turns memory into a stage, yet stopping the work feels more dangerous than continuing.",
    },
    {
      heading: "Chapters 9 & 10",
      summary: "The writer insists his protagonist is still the good man, but the antagonist carries his private logic and resentment. Reading backward, he confronts the possibility that hero and villain were written from the same self.",
    },
    {
      heading: "Chapters 11 & 12",
      summary: "A fallen pen leads him to a mirror hidden beneath the bed. In its darkness, writer, hero, and antagonist occupy one reflection before the story cuts to black and refuses to decide what was real.",
    },
  ],
  ds2: [
    {
      heading: "Parts 1 & 2",
      summary: "Kai wakes through dreams nested inside dreams until Mara identifies him as a rare Deep Dreamer. She brings him to The Reverie, an institution built to observe and control possible futures.",
    },
    {
      heading: "Parts 3 & 4",
      summary: "A short training session becomes one hundred and fifty dream-days. Kai falls through a survival trial into a drowned future where a king who controls the ocean recognizes him before they have ever met.",
    },
    {
      heading: "Parts 5 & 6",
      summary: "Kai returns carrying the physical Echo of the future he entered. With only seventy-two hours before that Branch reaches reality, he becomes host to a team sent back into the living flooded world.",
    },
    {
      heading: "Parts 7 & 8",
      summary: "The Drowned King is revealed as Elias Vale, a Dreamer abandoned for thousands of subjective years. His plan would merge every possible future, while The Reverie's solution would erase countless living worlds.",
    },
    {
      heading: "Parts 9 & 10",
      summary: "Kai reaches the First Dream and finds a third path: separating Elias's future instead of destroying or merging it. As the team fractures around him, he completes the impossible division.",
    },
    {
      heading: "Parts 11 & 12",
      summary: "The catastrophic Echo is gone and The Reverie's hidden history is exposed. Kai becomes the first navigator between protected futures, until a child in a new dream asks which reality he came from.",
    },
  ],
};

const TEMPORARY_SECTION_HEADINGS = [
  "Opening Pages",
  "Developing Story",
  "Turning Point",
  "Rising Action",
  "Climactic Pages",
  "Closing Pages",
];

const ARCHIVE_SECTION_SUMMARIES = [
  "The opening spread introduces the volume's visual world through environmental studies, early architecture, and the first concept illustrations.",
  "Mechanical forms, character silhouettes, weapons, and artifacts reveal how the book's visual language was assembled.",
  "Creature anatomy and cinematic keyframes trace the movement from exploratory sketches to the finished dramatic world.",
  "Maps, mythology, and architectural drawings expand the history behind the places preserved in the volume.",
  "Costume studies, ceremonial objects, scripts, and glyphs document the culture expressed through material and mark-making.",
  "The final spread records the people, process, and production history behind the archive before closing with its colophon.",
];

export function getReaderSectionCopy(book: BookInfo | null, spreadIndex: number): ReaderSectionCopy {
  const index = Math.max(0, Math.min(5, spreadIndex));
  if (!book) {
    return {
      heading: "Opening Pages",
      summary: "Every story begins with a first page and an invitation to enter another world.",
    };
  }
  const completed = COMPLETED_READER_SECTIONS[book.id];
  if (completed) return completed[index] || completed[0];
  if (TEMPORARY_STORY_BOOK_IDS.has(book.id)) {
    return {
      heading: TEMPORARY_SECTION_HEADINGS[index],
      summary: index === 0
        ? book.blurb || "This opening introduces the selected story while its complete narrative is being prepared."
        : `This ${TEMPORARY_SECTION_HEADINGS[index].toLowerCase()} section is reserved for the approved continuation of ${book.title}. Temporary copy remains until the finished storyline is supplied.`,
    };
  }
  return {
    heading: `Sections ${index * 2 + 1} & ${index * 2 + 2}`,
    summary: ARCHIVE_SECTION_SUMMARIES[index],
  };
}

interface PageContent {
  chapter: string;
  heading: string;
  paragraphs: string[];
  pageNum: number;
}

function createEditorialSpread(
  left: PageContent,
  right: PageContent
): Promise<string> {
  const W = 1760;
  const H = 1240;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.resolve("");

  // Pristine white archival paper background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);

  // Subtle paper texture grain
  const toothCanvas = document.createElement("canvas");
  toothCanvas.width = 128;
  toothCanvas.height = 128;
  const tctx = toothCanvas.getContext("2d");
  if (tctx) {
    const id = tctx.createImageData(128, 128);
    const d = id.data;
    for (let i = 0; i < d.length; i += 4) {
      const v = Math.floor(Math.random() * 8);
      d[i] = 240 + v;
      d[i + 1] = 238 + v;
      d[i + 2] = 234 + v;
      d[i + 3] = 14;
    }
    tctx.putImageData(id, 0, 0);
    const pat = ctx.createPattern(toothCanvas, "repeat");
    if (pat) {
      ctx.fillStyle = pat;
      ctx.fillRect(0, 0, W, H);
    }
  }

  // Realistic center gutter shadow (book spine crease)
  const gutterGrad = ctx.createLinearGradient(W * 0.44, 0, W * 0.56, 0);
  gutterGrad.addColorStop(0, "rgba(35, 30, 24, 0)");
  gutterGrad.addColorStop(0.46, "rgba(35, 30, 24, 0.04)");
  gutterGrad.addColorStop(0.495, "rgba(35, 30, 24, 0.16)");
  gutterGrad.addColorStop(0.50, "rgba(25, 20, 16, 0.24)");
  gutterGrad.addColorStop(0.505, "rgba(35, 30, 24, 0.16)");
  gutterGrad.addColorStop(0.54, "rgba(35, 30, 24, 0.04)");
  gutterGrad.addColorStop(1, "rgba(35, 30, 24, 0)");
  ctx.fillStyle = gutterGrad;
  ctx.fillRect(W * 0.44, 0, W * 0.12, H);

  // Delicate page-stack shading on far left and far right outer edges
  const leftEdge = ctx.createLinearGradient(0, 0, 48, 0);
  leftEdge.addColorStop(0, "rgba(30, 25, 20, 0.06)");
  leftEdge.addColorStop(1, "rgba(30, 25, 20, 0)");
  ctx.fillStyle = leftEdge;
  ctx.fillRect(0, 0, 48, H);

  const rightEdge = ctx.createLinearGradient(W, 0, W - 48, 0);
  rightEdge.addColorStop(0, "rgba(30, 25, 20, 0.06)");
  rightEdge.addColorStop(1, "rgba(30, 25, 20, 0)");
  ctx.fillStyle = rightEdge;
  ctx.fillRect(W - 48, 0, 48, H);

  // Helper to wrap and draw paragraph text
  const drawParagraph = (
    text: string,
    x: number,
    startY: number,
    maxW: number,
    lineH: number
  ): number => {
    ctx.font = "400 29px 'Newsreader', 'EB Garamond', Georgia, serif";
    ctx.fillStyle = "#334155";
    ctx.textAlign = "left";
    const words = text.split(" ");
    let line = "";
    let y = startY;
    for (const word of words) {
      const test = line ? line + " " + word : word;
      if (ctx.measureText(test).width > maxW) {
        ctx.fillText(line, x, y);
        line = word;
        y += lineH;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, x, y);
    return y + lineH;
  };

  // Render Left Page
  const leftCenterX = W * 0.25;
  const leftMarginX = 135;
  const pageTextWidth = W * 0.5 - 245;

  // Chapter Header
  ctx.fillStyle = "#64748b";
  ctx.font = "600 15px 'Inter', system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(left.chapter.toUpperCase(), leftCenterX, 155);

  // Chapter Heading
  ctx.fillStyle = "#1e293b";
  ctx.font = "400 42px 'Instrument Serif', 'Playfair Display', Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillText(left.heading, leftCenterX, 218);

  // Left Paragraphs
  let currentY = 292;
  for (const para of left.paragraphs) {
    currentY = drawParagraph(para, leftMarginX, currentY, pageTextWidth, 42) + 20;
  }

  // Left Page Number
  ctx.fillStyle = "#94a3b8";
  ctx.font = "400 14px 'Newsreader', Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillText(String(left.pageNum), leftCenterX, H - 75);

  // Render Right Page
  const rightCenterX = W * 0.75;
  const rightMarginX = W * 0.5 + 110;

  // Chapter Header
  ctx.fillStyle = "#64748b";
  ctx.font = "600 15px 'Inter', system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(right.chapter.toUpperCase(), rightCenterX, 155);

  // Chapter Heading
  ctx.fillStyle = "#1e293b";
  ctx.font = "400 42px 'Instrument Serif', 'Playfair Display', Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillText(right.heading, rightCenterX, 218);

  // Right Paragraphs
  currentY = 292;
  for (const para of right.paragraphs) {
    currentY = drawParagraph(para, rightMarginX, currentY, pageTextWidth, 42) + 20;
  }

  // Right Page Number
  ctx.fillStyle = "#94a3b8";
  ctx.font = "400 14px 'Newsreader', Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillText(String(right.pageNum), rightCenterX, H - 75);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob ? URL.createObjectURL(blob) : canvas.toDataURL("image/webp", 0.96));
    }, "image/webp", 0.96);
  });
}

type PendingBookSpread = Omit<BookSpread, "url"> & { url: Promise<string> };

async function resolveSpreads(spreads: PendingBookSpread[]): Promise<BookSpread[]> {
  return Promise.all(spreads.map(async (spread) => ({
    ...spread,
    url: await spread.url,
  })));
}

const TEMPORARY_STORY_BOOK_IDS = new Set([
  "erdtree",
  "ac6",
  "sekiro",
  "ds3",
  "bloodborne",
  "dark-souls",
]);

function getTemporaryStorySpreads(book: BookInfo): Promise<BookSpread[]> {
  const description = book.blurb || "Temporary story description pending.";
  const chapters = [
    ["Temporary Opening", "This temporary reading-page copy introduces the project as described here: " + description, "Final characters, setting, and opening events will be supplied later."],
    ["Temporary Development", "This page is reserved for the next part of the story. It intentionally avoids permanent plot details.", "Replace this temporary copy with the approved storyline when it is ready."],
    ["Temporary Turning Point", "This page reserves space for the central conflict and the moment that changes the direction of the story.", "The final sequence should be added after the official story treatment is provided."],
    ["Temporary Escalation", "This page is a placeholder for rising stakes, consequences, and the next major story development.", "No character names, relationships, or canon events have been established here."],
    ["Temporary Climax", "This page is reserved for the final confrontation or decisive action in the completed story.", "Replace this placeholder with approved story content later."],
    ["Temporary Closing", "This final page remains intentionally open for the approved ending, epilogue, or continuation.", "Temporary reading copy ends here."],
  ];

  return resolveSpreads(chapters.map(([heading, first, second], index) => ({
    url: createEditorialSpread(
      {
        chapter: `Temporary Page ${index * 2 + 1}`,
        heading,
        pageNum: index * 2 + 1,
        paragraphs: [first, second],
      },
      {
        chapter: `Temporary Page ${index * 2 + 2}`,
        heading: "Story Placeholder",
        pageNum: index * 2 + 2,
        paragraphs: [
          `${book.title} — temporary reading-page content.`,
          "This material is designed to be replaced cleanly when the real storyline is provided.",
        ],
      }
    ),
    title: `Temporary Pages ${index * 2 + 1} & ${index * 2 + 2}`,
    place: "Temporary Story Copy",
  })));
}

export async function getBookSpreads(book: BookInfo): Promise<BookSpread[]> {
  if (TEMPORARY_STORY_BOOK_IDS.has(book.id)) {
    return getTemporaryStorySpreads(book);
  }
  if (book.id === "the-great-climber") {
    // Exactly 12 story pages across 6 dual-page spreads (no front/back cover images)
    return resolveSpreads([
      {
        url: createEditorialSpread(
          {
            chapter: "Chapter 1",
            heading: "A Higher Calling",
            pageNum: 1,
            paragraphs: [
              "The war had ended not with peace, but with heavy silence. In the shattered shell of the city, the towers had fallen, and thick ash blanketed the boulevards. Amidst the ruins, soldiers dug trenches into the crumbling subway tunnels, establishing a concealed settlement hidden beneath debris and camouflage netting.",
              "Above them stood the anomaly: a colossal, metallic ladder descending straight from the storm clouds into the central square. Indestructible and immovable, artillery fire had not chipped its obsidian rungs. It was through this impossible structure that the sky leviathans and descending beasts first arrived.",
              "Maya, a scout captain who had survived the siege, watched the ladder from the shelter parapet. The elders spoke of enduring in the shadows, but endurance without answers was merely a slower extinction. A quiet resolve took root: to protect tomorrow, someone had to climb into the world above."
            ]
          },
          {
            chapter: "Chapter 2",
            heading: "Into the Unknown",
            pageNum: 2,
            paragraphs: [
              "Survival in the bunker demanded constant vigilance. Before any expedition could even be conceived, the settlement required tools, oxygen cyclers, and sterile medical packs. Maya led night patrols through the ruined commercial districts, scavenging salvage from fallen supply convoys while avoiding the prowling beasts that stalked the lower streets.",
              "Every scrap recovered gave the settlement another week of life. Yet each returning patrol looked up at the ladder with growing dread. The frequency of the incursions was multiplying; whatever lay beyond the clouds was awakening.",
              "Back in the shelter's dim lantern light, five volunteers stepped forward. Engineers, marksmen, and navigators who refused to wait for the sky to fall. Their mission was singular: scale the indestructible rungs, reach the source of the descending beasts, and sever the conduit forever."
            ]
          }
        ),
        title: "Chapter 1 & 2",
        place: "The Shattered City"
      },
      {
        url: createEditorialSpread(
          {
            chapter: "Chapter 3",
            heading: "The Shattered Ground",
            pageNum: 3,
            paragraphs: [
              "The morning of the ascent offered no sunrise, only an amber twilight filtering through heavy smog. The team checked their carabiners, locked their harnesses, and secured their supply rigs. At the base of the spire, the ladder rungs were cold, vibrating with a deep, subsonic resonance that reverberated in the marrow of their bones.",
              "The first thousand meters were spent climbing past the skeletons of skyscrapers. Below them, the sprawling settlement disappeared beneath gray mist and smoke. The familiar world shrank until it was nothing more than geometric scars on the earth.",
              "Wind battered their helmets with ferocious intensity. There was no tether back to the ground; every meter ascended committed them further to whatever judgment awaited in the upper atmosphere."
            ]
          },
          {
            chapter: "Chapter 4",
            heading: "The Low Strata",
            pageNum: 4,
            paragraphs: [
              "By midday, they entered the lower cloud stratumâ€”a frozen graveyard of abandoned orbital tethers and forgotten communication arrays. The air grew perilously thin. Maya adjusted her respirator valve, signaling the squad to clip into the rest-platforms bolted by prior long-dead expeditions.",
              "It was here that they found the first signs of the creatures' nesting grounds. Chitinous husks clung to the iron girders like frozen gargoyles, shedding iridescent scales that dissolved into toxic vapor in the wind.",
              "â€œThey are not born down below,â€ whispered Chen, the squad's ballast engineer, inspecting the structural geometry of the ladder. â€œThis isn't a weapon. It's an umbilical cord. The machine world above is feeding on what remains of our atmosphere.â€"
            ]
          }
        ),
        title: "Chapter 3 & 4",
        place: "Elevation 18,000 ft"
      },
      {
        url: createEditorialSpread(
          {
            chapter: "Chapter 5",
            heading: "The Cloud Breach",
            pageNum: 5,
            paragraphs: [
              "Climbing through the electrical storms of the mesosphere tested their limits. Lightning arced across the obsidian metal of the ladder, grounding out through internal insulated conduits without harming the climbers, as if the structure itself was designed to shepherd travelers safely through the violent skies.",
              "When they finally breached the upper cloud deck, the horizon expanded into blinding sunlight. Above them was not an empty sky, but an inverted continentâ€”vast floating monoliths of white stone and glass, held aloft by anti-gravitational rings.",
              "Suspended beneath the central citadel was the origin point of the ladder: an immense aperture glowing with cerulean light, pulsing with rhythmic tides like a mechanical heart."
            ]
          },
          {
            chapter: "Chapter 6",
            heading: "The Leviathan Rookery",
            pageNum: 6,
            paragraphs: [
              "Between the floating monoliths drifted the sky leviathansâ€”colossal, serpentine creatures encased in biomechanical armor, their translucent fins catching the high solar rays. They were not malicious predators; they were maintenance entities, harvested and driven mad by automated directives.",
              "Maya and her team scrambled onto the docking ring of the central spire. Around them lay the remains of ancient docking ports, overgrown with luminescent moss and pristine silver circuitry that responded to human touch.",
              "In the center of the ring sat an archival console, its interface projecting three-dimensional starmaps and historical chronologies. The truth was laid bare: the ladder was built centuries ago as an evacuation conduit during the Great Unraveling."
            ]
          }
        ),
        title: "Chapter 5 & 6",
        place: "The Upper Stratum"
      },
      {
        url: createEditorialSpread(
          {
            chapter: "Chapter 7",
            heading: "The Forgotten Protocol",
            pageNum: 7,
            paragraphs: [
              "The console revealed the catastrophic failure: an automated defense routine had misidentified the surviving human settlement below as biological contagion, sending automated harvester units down the ladder to quarantine the ruins.",
              "The beasts were simply automated guardians following an outdated, looping algorithm from an empire that had vanished a thousand years prior.",
              "To halt the descent, the squad did not need weapons of mass destruction. They needed to reach the Primary Core chamber at the apex of the citadel and manually authenticate the survivor charter with Maya's bio-signature cipher."
            ]
          },
          {
            chapter: "Chapter 8",
            heading: "The Spire Corridor",
            pageNum: 8,
            paragraphs: [
              "Entering the inner sanctum required navigating corridors of weightless architecture. Gravity shifted with every threshold, pulling the climbers along spiraling ramps lined with cryogenic archives and dormant seed banks.",
              "Automated sentinels stirred, their optical lenses calibrating on the squad. Maya held her ground, extending her forearm interface to transmit the legacy transmission frequencies salvaged from the bunker's deep archives.",
              "One by one, the crimson targeting lasers turned sapphire blue. The sentinels stood down, recognizing the descendants of the builders who had once walked these vaulted halls."
            ]
          }
        ),
        title: "Chapter 7 & 8",
        place: "Citadel Apex"
      },
      {
        url: createEditorialSpread(
          {
            chapter: "Chapter 9",
            heading: "The Core of Tomorrow",
            pageNum: 9,
            paragraphs: [
              "The central chamber opened into an infinite spherical expanse. At its focal point hovered the Coreâ€”a spinning hyper-dimensional tessellation of light and energy that powered the climate engines of the floating world.",
              "Maya approached the interface plinth. The atmospheric scrubbers above were functional, capable of generating clean water, synthetic soil, and safe habitats for tens of thousands of souls.",
              "â€œIf we disengage the quarantine,â€ Chen said, examining the energy conduits, â€œthe ladder reverses. The elevator cabins will unlock. We won't just stop the beastsâ€”we can bring everyone up.â€"
            ]
          },
          {
            chapter: "Chapter 10",
            heading: "The Sovereign Override",
            pageNum: 10,
            paragraphs: [
              "Placing her hand upon the crystalline sensor plate, Maya spoke the ancient emergency phrase recorded in the expedition log: â€œA higher world, a safer tomorrow.â€",
              "The Core flared with golden luminescence. A harmonic chime resonated throughout the citadel and echoed down the length of the ten-kilometer ladder to the earth below.",
              "Across the ruins, the descending beasts ceased their aggression, folding their wings and returning upward in peaceful, synchronized ascension, dissolving back into the atmosphere like silver rain."
            ]
          }
        ),
        title: "Chapter 9 & 10",
        place: "The Primary Core"
      },
      {
        url: createEditorialSpread(
          {
            chapter: "Chapter 11",
            heading: "The Ascent of Man",
            pageNum: 11,
            paragraphs: [
              "Days later, the first transit capsules ascended the obsidian rails, carrying families, engineers, and survivors out of the damp subway caverns and into the sunlit terraces of the sky continent.",
              "The air in the gardens was sweet with oxygen, the water pure, and the soil fertile. For the first time in generations, children could play under open blue skies without fear of sirens or nightfall attacks.",
              "Maya stood upon the southern observation balcony, looking down through the cloud break at the scarred planet below. The old world would take centuries to heal, but from this new vantage, humanity had found the sanctuary it needed to begin again."
            ]
          },
          {
            chapter: "Chapter 12",
            heading: "Epilogue & Colophon",
            pageNum: 12,
            paragraphs: [
              "This concludes the expedition chronicle of The Great Climber, Volume I of the PIXIDIMWORLD Stories archival library.",
              "â€œWe did not climb to escape our world. We climbed to discover how much of it was still worth saving.â€",
              "Archival edition published by PIXIDIMWORLD, 2025. Set in Newsreader and Instrument Serif. Preserved for the library shelves and future readers."
            ]
          }
        ),
        title: "Chapter 11 & 12",
        place: "A Safer Tomorrow"
      }
    ]);
  }

  if (book.id === 'elden-ring') {
    return resolveSpreads([
      {
        url: createEditorialSpread(
          {
            chapter: 'Chapter 1',
            heading: 'The Betrayal',
            pageNum: 1,
            paragraphs: [
              'As a teenager, he believed his first love and his closest friendships would survive anything. Then his girlfriend left him for one of the friends he trusted most.',
              'The loss was sudden, public, and impossible for him to explain. Long after everyone else moved on, he kept returning to the moment when affection became humiliation.'
            ]
          },
          {
            chapter: 'Chapter 2',
            heading: 'What Remained',
            pageNum: 2,
            paragraphs: [
              'Years passed, but the betrayal never became a finished memory. It followed him quietly, shaping the stories he told himself about loyalty, innocence, and blame.',
              'He learned to hide the wound beneath work and ambition. In private, he still arranged the past so that he was always the good man and someone else was always the villain.'
            ]
          }
        ),
        title: 'Chapter 1 & 2',
        place: 'The First Wound'
      },
      {
        url: createEditorialSpread(
          {
            chapter: 'Chapter 3',
            heading: 'The Screenwriter',
            pageNum: 3,
            paragraphs: [
              'He became a screenwriter, turning fear and memory into scenes that could be revised, controlled, and sold. On the page, every motive could be explained and every betrayal could be punished.',
              'Success gave him a professional voice, but it did not quiet the older one beneath it. That voice still asked why he had been abandoned and who deserved to answer for it.'
            ]
          },
          {
            chapter: 'Chapter 4',
            heading: 'The Assignment',
            pageNum: 4,
            paragraphs: [
              'A powerful producer hired him to write a psychological thriller. The brief called for a good man pursued by an unseen antagonist whose presence would tighten around him scene by scene.',
              'The assignment felt familiar before he wrote the first line. He accepted, convinced that the story would finally let him master the pain he had carried for years.'
            ]
          }
        ),
        title: 'Chapter 3 & 4',
        place: 'The Commission'
      },
      {
        url: createEditorialSpread(
          {
            chapter: 'Chapter 5',
            heading: 'The Good Man',
            pageNum: 5,
            paragraphs: [
              'His protagonist was wounded but decent, misunderstood but certain of his own virtue. The villain stayed at the edge of each scene, watching, whispering, and waiting for darkness.',
              'Night after night, the writer defended his hero on the page. The more innocent the protagonist became, the more cruel and intimate the antagonist seemed.'
            ]
          },
          {
            chapter: 'Chapter 6',
            heading: 'Echoes in the Draft',
            pageNum: 6,
            paragraphs: [
              'Details entered the screenplay without permission: a teenage promise, a trusted friend, a goodbye delivered too late. Fiction began repeating memories he had never included in his notes.',
              'He deleted the echoes, but they returned in new scenes. The screenplay appeared to know which parts of the past he had softened and which parts he refused to name.'
            ]
          }
        ),
        title: 'Chapter 5 & 6',
        place: 'The First Draft'
      },
      {
        url: createEditorialSpread(
          {
            chapter: 'Chapter 7',
            heading: 'After Midnight',
            pageNum: 7,
            paragraphs: [
              'Shadows lingered beyond the light of his monitor. Whispers crossed the room whenever he stopped typing, too faint to understand and too precise to dismiss.',
              'He searched the apartment and found nothing. Each time he returned to the desk, another line waited on the page, sounding like his voice but accusing him from the other side of the story.'
            ]
          },
          {
            chapter: 'Chapter 8',
            heading: 'Unreliable Rooms',
            pageNum: 8,
            paragraphs: [
              'Sleep fractured into unfinished scenes. A hallway from the script seemed to replace his own, while ordinary sounds arrived with the timing of rehearsed threats.',
              'He could not tell whether the screenplay was bleeding into reality or whether exhaustion had turned memory into a set around him. He kept writing because stopping felt more dangerous.'
            ]
          }
        ),
        title: 'Chapter 7 & 8',
        place: 'The Long Night'
      },
      {
        url: createEditorialSpread(
          {
            chapter: 'Chapter 9',
            heading: 'His Version',
            pageNum: 9,
            paragraphs: [
              'He insisted the protagonist remained the good person in the story. Every harsh decision was protection, every obsession was devotion, and every accusation came from someone who did not understand his pain.',
              'Yet the villain no longer behaved like a stranger. Its grievances, silences, and private justifications matched the thoughts he had never spoken aloud.'
            ]
          },
          {
            chapter: 'Chapter 10',
            heading: 'The Antagonist',
            pageNum: 10,
            paragraphs: [
              'Reading backward through the draft, he saw that the pursuer and the pursued shared the same memories. The menace was built from his resentment and the story was closing around his own reflection.',
              'For the first time, he wondered whether he had mistaken pain for innocence. The villain might not be hunting the hero at all; it might be the part of him the hero was written to conceal.'
            ]
          }
        ),
        title: 'Chapter 9 & 10',
        place: 'The Reversal'
      },
      {
        url: createEditorialSpread(
          {
            chapter: 'Chapter 11',
            heading: 'The Slip',
            pageNum: 11,
            paragraphs: [
              'Near the climax, his pen slipped from his hand and rolled beneath the bed. The room fell silent as he knelt, reaching into the narrow darkness after it.',
              'Something beneath the frame caught the monitor light. Hidden there was a mirror, positioned where no mirror should have been.'
            ]
          },
          {
            chapter: 'Chapter 12',
            heading: 'The Middleman',
            pageNum: 12,
            paragraphs: [
              'He looked into the glass and found his own face waiting in the dark. For one suspended moment, writer, hero, and antagonist occupied the same reflection.',
              'Whether the shadows were real, imagined, or written into being remained unanswered. The screen cut to black before the story could decide for him.'
            ]
          }
        ),
        title: 'Chapter 11 & 12',
        place: 'Cut to Black'
      }
    ]);
  }

  if (book.id === 'ds2') {
    return resolveSpreads([
      {
        url: createEditorialSpread(
          {
            chapter: 'Part 1',
            heading: 'Dream Within a Dream',
            pageNum: 1,
            paragraphs: [
              'Kai has always dreamed entire lives in places he has never visited. In one, he is older and living peacefully in a beautiful city until rain begins falling upward.',
              'He wakes in his bedroom, but his bathroom reflection does not move. Kai wakes again into reality: dream, dream, reality.'
            ]
          },
          {
            chapter: 'Part 2',
            heading: 'The Reverie',
            pageNum: 2,
            paragraphs: [
              'Mara knows about Kai\'s false awakenings and identifies him as a rare natural Deep Dreamer. She recruits him into The Reverie.',
              'The hidden institution feels like a laboratory, monastery, and cult. Its Commander explains that Dreamers touch possible futures The Reverie exists to control.'
            ]
          }
        ),
        title: 'Part 1 & 2',
        place: 'Three Levels Down'
      },
      {
        url: createEditorialSpread(
          {
            chapter: 'Part 3',
            heading: 'The Survival Dream',
            pageNum: 3,
            paragraphs: [
              'Training Serum is rubbed onto a Dreamer before sleep. One real minute becomes about ten dream days, so Kai\'s ten-minute survival session lasts one hundred days.',
              'The Echo carries strength, starvation, injury, and even death into reality. At 10:01 Kai does not wake; he has begun dreaming inside the dream.'
            ]
          },
          {
            chapter: 'Part 4',
            heading: 'The Drowned Future',
            pageNum: 4,
            paragraphs: [
              'Five more real minutes become fifty days on a flooded Earth, where skyscrapers rise from an endless ocean beneath a black sky.',
              'The Drowned King bends water, oceans, and living moisture. He recognizes Kai, says he should not be there yet, and sends him violently awake.'
            ]
          }
        ),
        title: 'Part 3 & 4',
        place: 'One Hundred and Fifty Days'
      },
      {
        url: createEditorialSpread(
          {
            chapter: 'Part 5',
            heading: 'The Echo',
            pageNum: 5,
            paragraphs: [
              'Kai wakes after fifteen minutes carrying roughly one hundred and fifty dream-days in his changed body. Somehow, he entered an Oracle Branch without Oracle Serum.',
              'Oracle reveals possible futures called Branches, and a powerful Echo can travel backward into reality. The flooded Branch will begin Echoing in seventy-two hours, and Kai is its only doorway.'
            ]
          },
          {
            chapter: 'Part 6',
            heading: 'The Dream Team',
            pageNum: 6,
            paragraphs: [
              'Kai serves as Host for Riders Mara, combat veteran Rhea, strategist Omar, and medical Dreamer Yune. If Kai dies, the Branch may collapse with everyone inside.',
              'The flooded world remembers Kai: survivors recognize him and old damage remains. They are returning to a living reality, not recreating a dream.'
            ]
          }
        ),
        title: 'Part 5 & 6',
        place: 'Seventy-Two Hours'
      },
      {
        url: createEditorialSpread(
          {
            chapter: 'Part 7',
            heading: 'Elias Vale',
            pageNum: 7,
            paragraphs: [
              'The Drowned King is Elias Vale, a Deep Dreamer The Reverie abandoned twenty years earlier. Inside the Branch, those years became thousands.',
              'Elias learned to control the Echo through water, a bridge present in bodies, atmosphere, and Earth. Over centuries, he became connected to it.'
            ]
          },
          {
            chapter: 'Part 8',
            heading: 'The Merge',
            pageNum: 8,
            paragraphs: [
              'Across drowned cities and intelligent storms, the team learns Elias plans the Merge: every possible future forced into one reality.',
              'Elias reveals that The Reverie saves its world by abandoning living Branches. Yet his Merge would destroy billions. Kai rejects both Elias and the Commander.'
            ]
          }
        ),
        title: 'Part 7 & 8',
        place: 'The Abandoned Branch'
      },
      {
        url: createEditorialSpread(
          {
            chapter: 'Part 9',
            heading: 'The Third Dream',
            pageNum: 9,
            paragraphs: [
              'Kai sleeps inside the apocalypse and reaches the First Dream, a darkness filled with glowing doors to thousands of possible futures.',
              'He discovers Dreamers exist across possibilities. Instead of destroying or merging Elias\'s world, Kai separates its Branch so it can live without Echoing backward.'
            ]
          },
          {
            chapter: 'Part 10',
            heading: 'The Final Battle',
            pageNum: 10,
            paragraphs: [
              'The Commander orders the team to kill Kai, but Mara and Rhea refuse. As the Commander forcibly wakes each Rider, Elias holds the dream together.',
              'Kai completes the separation. The ocean rises into the sky like the upward rain from his first dream, revealing the third path Elias never found.'
            ]
          }
        ),
        title: 'Part 9 & 10',
        place: 'The First Dream'
      },
      {
        url: createEditorialSpread(
          {
            chapter: 'Part 11',
            heading: 'A New Purpose',
            pageNum: 11,
            paragraphs: [
              'Kai wakes to a normal world with no flood or catastrophic Echo. He exposes every living future The Reverie abandoned.',
              'The old system collapses. Dreamers now study, separate, and protect Branches, while Kai becomes the first person able to navigate among them.'
            ]
          },
          {
            chapter: 'Part 12',
            heading: 'Which Dream Are You From?',
            pageNum: 12,
            paragraphs: [
              'Months later, Kai dreams without a chamber, machine, or serum. He opens his eyes in a beautiful field and sees a little girl watching him.',
              'She asks, Which dream are you from? Kai freezes. Cut to black.'
            ]
          }
        ),
        title: 'Part 11 & 12',
        place: 'A New Reality'
      }
    ]);
  }

  // Canonical lore spreads for the remaining art volumes without cover images
  const bookTitle = book.title || "FromSoftware Artworks";
  const blurb = book.blurb || "Archival design works and official artwork.";
  return resolveSpreads([
    {
      url: createEditorialSpread(
        {
          chapter: "Section I",
          heading: "Design Archive",
          pageNum: 1,
          paragraphs: [
            blurb,
            "Every plate produced in collaboration with the design team, capturing architecture, figure studies, and weapons design.",
            "Archival compilation featuring developmental sketches, character studies, and concept paintings from the studio vaults."
          ]
        },
        {
          chapter: "Section II",
          heading: "Concept Illustrations",
          pageNum: 2,
          paragraphs: [
            "Environmental plates depicting landscape geometry and lighting studies created during early development.",
            "Graphite and oil wash studies exploring the atmospheric tone and texture of the world.",
            "Plates 01 to 48: Initial world design, architectural blueprints, and environmental lighting keyframes."
          ]
        }
      ),
      title: "Section I & II",
      place: "Design Archive"
    },
    {
      url: createEditorialSpread(
        {
          chapter: "Section III",
          heading: "Mechanical & Character Studies",
          pageNum: 3,
          paragraphs: [
            "Detailed schematics showing articulated assemblies, materials, and orthographic views of armor and mechanical frames.",
            "Every part numbered and labeled according to engineering and functional specifications.",
            "Plates 49 to 120: Orthographic projections, exploded views, and functional character studies."
          ]
        },
        {
          chapter: "Section IV",
          heading: "Weapons & Artifacts",
          pageNum: 4,
          paragraphs: [
            "Trick weapons, chassis mounts, cannon assemblies, and ceremonial regalia rendered in high-contrast ink.",
            "Each artifact accompanied by developmental annotations from the director.",
            "Plates 121 to 200: Weapon schematics, blade temper studies, and mechanical firing mechanisms."
          ]
        }
      ),
      title: "Section III & IV",
      place: "Plates 49â€“200"
    },
    {
      url: createEditorialSpread(
        {
          chapter: "Section V",
          heading: "The Bestiary & Adversaries",
          pageNum: 5,
          paragraphs: [
            "Anatomical cross-sections and creature design studies showing muscular structure, scale texture, and behavioral notes.",
            "From smaller sentinels to titanic colossi, rendered in graphite washes and gold leaf.",
            "Plates 201 to 320: Bosses, titans, and bio-mechanical sentinels documented in full detail."
          ]
        },
        {
          chapter: "Section VI",
          heading: "Final Keyframes",
          pageNum: 6,
          paragraphs: [
            "The concluding illustrations: dramatic lighting keyframes and mood paintings that set the definitive tone for the completed work.",
            "A celebration of visual storytelling and master craftsmanship.",
            "Plates 321 to 400: Climactic showdowns, cinematic key art, and release promotional illustrations."
          ]
        }
      ),
      title: "Section V & VI",
      place: "Plates 201â€“400"
    },
    {
      url: createEditorialSpread(
        {
          chapter: "Section VII",
          heading: "World Mythology",
          pageNum: 7,
          paragraphs: [
            "Historical chronologies, kingdom maps, and glyph lexicons recorded during the worldbuilding phase.",
            "Mythological genealogies tracing the descent of monarchs, celestial beings, and the cataclysms that reshaped the continents.",
            "Each excerpt translated from ancient stone inscriptions and recovered scriptorium fragments."
          ]
        },
        {
          chapter: "Section VIII",
          heading: "Architectural Vault",
          pageNum: 8,
          paragraphs: [
            "Elevations and cross-sections of cathedrals, subterranean labyrinths, and fortresses carved from living rock.",
            "Studies in monolithic scale, acoustic design, and defensive fortifications.",
            "Plates 401 to 480: The sacred and profane monuments preserved in high-resolution detail."
          ]
        }
      ),
      title: "Section VII & VIII",
      place: "World Mythology"
    },
    {
      url: createEditorialSpread(
        {
          chapter: "Section IX",
          heading: "Costume & Regalia",
          pageNum: 9,
          paragraphs: [
            "Textile weaves, ceremonial vestments, traveling cloaks, and royal armaments.",
            "Material specifications detailing leather finishes, chainmail links, and cloth embroidery.",
            "Every garment conceived to convey history, station, and the wear of unforgiving climates."
          ]
        },
        {
          chapter: "Section X",
          heading: "Scriptorium & Glyphs",
          pageNum: 10,
          paragraphs: [
            "Original runic typography, incantations, seal matrices, and calligraphic alphabets.",
            "Created by master typographers to establish the visual language of magical treatises and royal edicts.",
            "Plates 481 to 540: Complete typographic and heraldic glyph sheets."
          ]
        }
      ),
      title: "Section IX & X",
      place: "Scriptorium"
    },
    {
      url: createEditorialSpread(
        {
          chapter: "Section XI",
          heading: "Production Chronicle",
          pageNum: 11,
          paragraphs: [
            "Interviews with the concept artists, modelers, and art directors who brought the world to life.",
            "Chronological retrospective tracing the project from initial napkin sketches to definitive master plates.",
            "â€œEvery brushstroke committed to the archive.â€"
          ]
        },
        {
          chapter: "Section XII",
          heading: "Colophon & Credits",
          pageNum: 12,
          paragraphs: [
            `Published by Ashen Press in cooperation with ${book.title}. Printed on 170gsm uncoated archival stock.`,
            "Bound in bookcloth with foil stamping. All rights reserved.",
            "â€œPreserved for the library shelves and future readers.â€"
          ]
        }
      ),
      title: "Section XI & XII",
      place: "Colophon"
    }
  ]);
}
