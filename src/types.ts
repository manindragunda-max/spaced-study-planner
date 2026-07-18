export interface Subject {
  id: string;
  name: string;
  color: string; // Tailwind color class suffix, e.g., 'blue', 'emerald', 'amber', 'purple', 'rose', 'indigo'
}

export interface Topic {
  id: string;
  subjectId: string;
  name: string;
  confidence: number; // 1-5
  lastReviewed: string | null; // ISO Date String YYYY-MM-DD
  intervalDays: number; // Current interval in days (e.g., 1, 3, 7, 14...)
  repetitionCount: number; // Number of reviews completed
  nextReviewDate: string; // ISO Date String YYYY-MM-DD
  easinessFactor: number; // SM-2 style factor, defaults to 2.5
}

export interface Flashcard {
  id: string;
  topicId: string;
  front: string;
  back: string;
  confidence: number; // 1-5 optional rating for individual cards
}

export type ActiveRecallTechnique = 'Flashcards' | 'Blurting' | 'Feynman' | 'PracticeQuestions';

export interface Session {
  id: string;
  topicId: string;
  date: string; // YYYY-MM-DD
  technique: ActiveRecallTechnique;
  completed: boolean;
  loggedConfidence: number | null; // 1-5 logged during the session
  blurtDraft?: string;
  feynmanDraft?: string;
}

export interface StudyPlan {
  examDate: string; // YYYY-MM-DD
  startDate: string; // YYYY-MM-DD
  subjects: Subject[];
  topics: Topic[];
  sessions: Session[];
  flashcards: Flashcard[];
}
