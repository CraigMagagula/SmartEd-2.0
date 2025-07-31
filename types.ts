
export interface Message {
  id: number;
  text: string;
  sender: 'user' | 'ai';
}

export interface Flashcard {
    term: string;
    definition: string;
}

export interface QuizResult {
    date: string; // YYYY-MM-DD
    subject: string | null;
    score: number;
    total: number;
}

export interface StudySession {
    date: string; // YYYY-MM-DD
    minutes: number;
    rating: 'deep' | 'distracted';
}
