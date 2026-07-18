import { Subject, Topic, Session, ActiveRecallTechnique, StudyPlan, Flashcard } from './types';

// Active Recall Techniques metadata
export interface TechniqueDetails {
  name: ActiveRecallTechnique;
  shortDesc: string;
  steps: string[];
  durationMinutes: number;
  tips: string;
}

export const TECHNIQUES: Record<ActiveRecallTechnique, TechniqueDetails> = {
  Flashcards: {
    name: 'Flashcards',
    shortDesc: 'Create and test yourself with flashcards using active retrieval.',
    steps: [
      'Write a concise question on the front, and the specific answer on the back.',
      'Read the question and try to state the answer out loud or write it down BEFORE flipping.',
      'Rate your recall accuracy and prioritize harder cards for immediate re-review.'
    ],
    durationMinutes: 15,
    tips: 'Keep cards focused on single concepts. Use images or simple diagrams if possible.'
  },
  Blurting: {
    name: 'Blurting',
    shortDesc: 'Dump all knowledge on a topic under a timer, then fill in the gaps.',
    steps: [
      'Set a timer for 5 minutes.',
      'On a blank canvas, write down absolutely everything you can remember about the topic as fast as possible without looking at resources.',
      'Open your notes/textbook and use a red pen (or highlight) to add key concepts you missed or got wrong.'
    ],
    durationMinutes: 10,
    tips: 'Do not edit or organize as you write. Focus purely on speed and retrieval of information.'
  },
  Feynman: {
    name: 'Feynman',
    shortDesc: 'Explain the topic in simple terms as if teaching it to a child.',
    steps: [
      'Write down the topic name at the top of the workspace.',
      'Explain the concept in your own words using simple, plain English—avoid complex jargon.',
      'Identify terms or explanations that feel fuzzy, look back at source material, and simplify your explanation further.'
    ],
    durationMinutes: 15,
    tips: 'Use simple analogies (e.g., \"the heart is like a water pump\") to test if you truly understand the core concept.'
  },
  PracticeQuestions: {
    name: 'PracticeQuestions',
    shortDesc: 'Apply knowledge to solve application questions or generate mock tests.',
    steps: [
      'Select or formulate 3 challenging, open-ended or problem-solving questions about this topic.',
      'Draft your answers fully without checking reference material.',
      'Compare your answers with the ideal solution key or notes, marking where your logic faltered.'
    ],
    durationMinutes: 20,
    tips: 'Focus on application (\"Why does this happen?\") rather than just definitions (\"What is this?\").'
  }
};

// Colors for subjects
export const SUBJECT_COLORS = [
  { name: 'Indigo Blue', bgClass: 'bg-indigo-50 border-indigo-200 text-indigo-700', textClass: 'text-indigo-700', darkBgClass: 'bg-indigo-600', hoverBgClass: 'hover:bg-indigo-100', accentHex: '#4f46e5' },
  { name: 'Emerald Green', bgClass: 'bg-emerald-50 border-emerald-200 text-emerald-700', textClass: 'text-emerald-700', darkBgClass: 'bg-emerald-600', hoverBgClass: 'hover:bg-emerald-100', accentHex: '#059669' },
  { name: 'Amber Orange', bgClass: 'bg-amber-50 border-amber-200 text-amber-700', textClass: 'text-amber-700', darkBgClass: 'bg-amber-600', hoverBgClass: 'hover:bg-amber-100', accentHex: '#d97706' },
  { name: 'Purple Orchid', bgClass: 'bg-purple-50 border-purple-200 text-purple-700', textClass: 'text-purple-700', darkBgClass: 'bg-purple-600', hoverBgClass: 'hover:bg-purple-100', accentHex: '#9333ea' },
  { name: 'Rose Red', bgClass: 'bg-rose-50 border-rose-200 text-rose-700', textClass: 'text-rose-700', darkBgClass: 'bg-rose-600', hoverBgClass: 'hover:bg-rose-100', accentHex: '#e11d48' },
  { name: 'Sky Cyan', bgClass: 'bg-sky-50 border-sky-200 text-sky-700', textClass: 'text-sky-700', darkBgClass: 'bg-sky-600', hoverBgClass: 'hover:bg-sky-100', accentHex: '#0284c7' }
];

// Helper to generate unique IDs
export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

// Date helper: YYYY-MM-DD
export function getTodayDateStr(): string {
  const d = new Date();
  return formatDateToYYYYMMDD(d);
}

export function formatDateToYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr + 'T12:00:00'); // Use mid-day to avoid timezone shifting
  date.setDate(date.getDate() + days);
  return formatDateToYYYYMMDD(date);
}

export function daysBetween(dateStr1: string, dateStr2: string): number {
  const d1 = new Date(dateStr1 + 'T00:00:00');
  const d2 = new Date(dateStr2 + 'T00:00:00');
  const diffTime = d2.getTime() - d1.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

export function formatHumanDate(dateStr: string): string {
  const today = getTodayDateStr();
  const tomorrow = addDays(today, 1);
  const yesterday = addDays(today, -1);

  if (dateStr === today) return 'Today';
  if (dateStr === tomorrow) return 'Tomorrow';
  if (dateStr === yesterday) return 'Yesterday';

  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    weekday: 'short'
  });
}

// Map Spaced Repetition stages to days
const STAGE_INTERVALS = [1, 3, 7, 14, 30, 60];

// Spaced Repetition calculator based on logging confidence
export function calculateNextReview(
  currentConfidence: number, // 1 - 5 logged
  currentInterval: number, // current interval in days
  currentRepetition: number // number of previous reviews
): { nextInterval: number; easinessFactor: number } {
  // We can use a customized SuperMemo-2 style algorithm
  // If confidence is extremely low, reset or reduce interval significantly
  let nextInterval = 1;
  let easinessFactor = 2.5;

  if (currentConfidence < 3) {
    // Reset or drop significantly: Day 1 or Day 2
    nextInterval = currentConfidence === 1 ? 1 : 2;
    easinessFactor = Math.max(1.3, easinessFactor - 0.2);
  } else {
    // Progress interval
    if (currentRepetition === 0) {
      nextInterval = 1; // Day 1
    } else if (currentRepetition === 1) {
      nextInterval = 3; // Day 3
    } else if (currentRepetition === 2) {
      nextInterval = 7; // Day 7
    } else if (currentRepetition === 3) {
      nextInterval = 14; // Day 14
    } else {
      // Further steps or calculated by multiplier based on confidence
      const multiplier = currentConfidence === 3 ? 1.3 : currentConfidence === 4 ? 1.8 : 2.5;
      nextInterval = Math.max(currentInterval + 1, Math.round(currentInterval * multiplier));
      // Cap at 90 days for study planner contexts
      nextInterval = Math.min(nextInterval, 90);
    }
    // Update easiness factor
    easinessFactor = Math.max(1.3, easinessFactor + (0.1 - (5 - currentConfidence) * (0.08 + (5 - currentConfidence) * 0.02)));
  }

  return { nextInterval, easinessFactor };
}

// Initial session generator when creating a plan
export function generateInitialSessions(
  topics: Topic[],
  startDate: string,
  examDate: string
): Session[] {
  const sessions: Session[] = [];
  const totalDays = daysBetween(startDate, examDate);

  // We automatically assign spacing intervals (Day 1, Day 3, Day 7, Day 14) for each topic.
  // We will assign complementary active recall tasks.
  const techniquesSequence: ActiveRecallTechnique[] = ['Blurting', 'Flashcards', 'Feynman', 'PracticeQuestions'];

  topics.forEach((topic) => {
    // Day 1 review
    if (totalDays >= 1) {
      sessions.push({
        id: generateId(),
        topicId: topic.id,
        date: addDays(startDate, 1),
        technique: 'Blurting', // First review is often Blurting to write down lecture notes
        completed: false,
        loggedConfidence: null
      });
    }

    // Day 3 review
    if (totalDays >= 3) {
      sessions.push({
        id: generateId(),
        topicId: topic.id,
        date: addDays(startDate, 3),
        technique: 'Flashcards', // Second review: building and testing cards
        completed: false,
        loggedConfidence: null
      });
    }

    // Day 7 review
    if (totalDays >= 7) {
      sessions.push({
        id: generateId(),
        topicId: topic.id,
        date: addDays(startDate, 7),
        technique: 'Feynman', // Third review: teaching/explaining to check gaps
        completed: false,
        loggedConfidence: null
      });
    }

    // Day 14 review
    if (totalDays >= 14) {
      sessions.push({
        id: generateId(),
        topicId: topic.id,
        date: addDays(startDate, 14),
        technique: 'PracticeQuestions', // Fourth review: active application and problem solving
        completed: false,
        loggedConfidence: null
      });
    }
  });

  return sessions;
}

// Seed templates so the user can easily instantiate a plan
export interface TemplateSubject {
  name: string;
  colorIndex: number;
  topics: string[];
}

export const PRESET_TEMPLATES: Record<string, { title: string; subjects: TemplateSubject[] }> = {
  mcat: {
    title: 'Pre-Med / Biology & Chemistry',
    subjects: [
      {
        name: 'Cellular Biology',
        colorIndex: 1, // Green
        topics: ['Mitosis & Meiosis Phases', 'Cellular Respiration Pathways', 'DNA Replication & Repair']
      },
      {
        name: 'Organic Chemistry',
        colorIndex: 2, // Amber
        topics: ['Nucleophilic Substitution (Sn1/Sn2)', 'Spectroscopy (NMR, IR)', 'Amino Acid Characteristics']
      },
      {
        name: 'Physics',
        colorIndex: 0, // Indigo
        topics: ['Thermodynamics Laws', 'Fluid Dynamics & Bernoulli', 'Optics & Lenses']
      }
    ]
  },
  computerScience: {
    title: 'Computer Science (Algorithms & Systems)',
    subjects: [
      {
        name: 'Data Structures',
        colorIndex: 0, // Indigo
        topics: ['Binary Search Trees & AVL Trees', 'Hash Table Collision Resolution', 'Graph Traversals (BFS & DFS)']
      },
      {
        name: 'Systems & Networks',
        colorIndex: 3, // Purple
        topics: ['TCP/IP 3-Way Handshake', 'Virtual Memory & Page Replacement', 'REST vs GraphQL Architecture']
      },
      {
        name: 'Algorithms',
        colorIndex: 4, // Rose
        topics: ['Dijkstra\'s Shortest Path', 'Dynamic Programming (Knapsack)', 'Merge Sort & Quick Sort Complexity']
      }
    ]
  },
  barExam: {
    title: 'Legal Studies / Bar Exam',
    subjects: [
      {
        name: 'Constitutional Law',
        colorIndex: 3, // Purple
        topics: ['First Amendment Free Speech Standards', 'Equal Protection Clause Tiers', 'Commerce Clause Scope']
      },
      {
        name: 'Criminal Procedure',
        colorIndex: 5, // Sky
        topics: ['Fourth Amendment Search & Seizure', 'Miranda Rights & Waiver', 'Double Jeopardy Exceptions']
      },
      {
        name: 'Contracts & Sales',
        colorIndex: 2, // Amber
        topics: ['Offer & Acceptance (UCC vs Common Law)', 'Statute of Frauds Requirements', 'Breach & Damages Remedies']
      }
    ]
  }
};
