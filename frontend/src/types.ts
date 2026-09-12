export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
}

export interface Topic {
  id: string;
  name: string;
}

export interface Module {
  id: string;
  name: string;
  description: string;
  topics: Topic[];
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatMessageOut extends ChatMessage {
  created_at: string;
}

export interface Exercise {
  title: string;
  statement: string;
  starter_code: string;
  difficulty: string;
  hints: string[];
}

export interface SubmitResult {
  correct: boolean;
  score: number;
  feedback: string;
}

export interface ModuleProgress {
  module_id: string;
  exercises_attempted: number;
  exercises_correct: number;
  average_score: number;
  last_activity: string | null;
}

export interface ProgressResponse {
  modules: ModuleProgress[];
}