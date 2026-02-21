import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─── Types ───────────────────────────────────────────────
export interface Conversation {
  id: string;
  user_id: string;
  subject: string | null;
  title: string;
  next_topics: string[];
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface UserProgress {
  id: string;
  user_id: string;
  subject: string;
  messages_sent: number;
  sessions_count: number;
  last_active: string;
  created_at: string;
}

export interface UserStreak {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_study_date: string | null;
  total_days_studied: number;
}

export interface StudentProfile {
  id: string;
  user_id: string;
  display_name: string;
  age_group: string;
  goals: string[];
  learning_style: string;
  level: string;
  created_at: string;
  updated_at: string;
}

export interface LearningMemory {
  id: string;
  user_id: string;
  subject: string;
  memory_type:
    | "topic_mastered"
    | "topic_struggling"
    | "interest"
    | "behavior"
    | "correction"
    | "preference";
  content: string;
  confidence_score: number;
  created_at: string;
  updated_at: string;
}

export interface LearningInsight {
  id: string;
  user_id: string;
  avg_session_length: number;
  preferred_time_of_day: string;
  most_active_subject: string;
  response_style_feedback: string;
  attention_span: string;
  last_analyzed: string;
}

export interface Quiz {
  id: string;
  user_id: string;
  conversation_id: string | null;
  subject: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  total_questions: number;
  created_at: string;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question_number: number;
  question_type: "multiple_choice" | "open_ended";
  question_text: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  created_at: string;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  user_id: string;
  score: number;
  total: number;
  percentage: number;
  answers: Array<{
    question_id: string;
    user_answer: string;
    is_correct: boolean;
  }>;
  completed_at: string;
}

export interface QuizWithAttempt extends Quiz {
  best_score?: number;
  attempts_count?: number;
}

export interface TrendingTopic {
  title: string;
  category: string;
  description: string;
  trend_status: "hot" | "rising" | "new";
  why_relevant: string;
  difficulty: "beginner" | "intermediate" | "advanced";
}

export interface TrendingCache {
  id: string;
  topics: TrendingTopic[];
  generated_at: string;
  expires_at: string;
}

export interface QuizResult {
  id: string;
  user_id: string;
  subject: string;
  difficulty: string;
  score: number;
  total_questions: number;
  percentage: number;
  weak_topics: string[];
  answers: Array<{
    question: string;
    type: string;
    user_answer: string;
    correct_answer: string;
    is_correct: boolean;
    explanation: string;
    timed_out?: boolean;
  }>;
  time_taken: number;
  created_at: string;
}

// ─── Course Types ─────────────────────────────────────────
export interface Course {
  id: string;
  title: string;
  description: string;
  subject: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  emoji: string;
  is_free: boolean;
  total_lessons: number;
  estimated_hours: number;
  created_at: string;
}

export interface Lesson {
  id: string;
  course_id: string;
  lesson_number: number;
  title: string;
  description: string;
  estimated_minutes: number;
  created_at: string;
}

export interface CourseProgress {
  id: string;
  user_id: string;
  course_id: string;
  completed_lessons: string[];
  started_at: string;
  last_accessed: string;
  completed_at: string | null;
  percentage: number;
  certificate_name: string | null;
}

export interface LearningAssessment {
  id: string;
  user_id: string;
  grade_level: string;
  learner_type: string;
  cognitive_style: {
    reading_approach: string;
    problem_solving: string;
    attention_span: string;
    confusion_strategies: string[];
  };
  reasoning_score: number;
  reasoning_speed: { question: number; time_seconds: number }[];
  subject_levels: Record<string, number>;
  subject_most_improve: string;
  subject_hardest: string;
  subject_most_enjoyed: string;
  goals: {
    reasons: string[];
    main_goal: string;
    daily_time: string;
  };
  challenge_behavior: {
    wrong_answer_reaction: string;
    too_easy_reaction: string;
    too_hard_reaction: string;
    feedback_preference: string;
  };
  study_habits: {
    study_times: string[];
    study_locations: string[];
    session_length: string;
    quiz_feeling: string;
  };
  personality_words: string[];
  motivation_type: string;
  personal_note: string;
  learning_persona: string;
  completed_at: string;
}
