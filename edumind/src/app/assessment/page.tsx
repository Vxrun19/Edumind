"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

// ─── Constants ──────────────────────────────────────────────────────────
const TOTAL_SECTIONS = 8;

const LEARNER_TYPES = [
  { id: "reader", emoji: "📚", label: "The Reader", desc: "I like reading and taking notes" },
  { id: "doer", emoji: "🎯", label: "The Doer", desc: "I learn by trying things myself" },
  { id: "visualizer", emoji: "👁️", label: "The Visualizer", desc: "I need diagrams and examples" },
  { id: "talker", emoji: "🗣️", label: "The Talker", desc: "I learn by discussing and asking questions" },
  { id: "gamer", emoji: "🎮", label: "The Gamer", desc: "I learn best when it's fun and gamified" },
  { id: "deep_diver", emoji: "🔍", label: "The Deep Diver", desc: "I want to understand everything deeply" },
];

const GRADE_LEVELS = [
  "Primary school",
  "Middle school",
  "High school",
  "College/University",
  "Working professional",
  "Self learner",
  "Other",
];

const READING_APPROACHES = [
  "Remember the big picture easily but forget details",
  "Remember specific details but struggle to see the big picture",
  "Both equally",
  "Neither — I need to re-read multiple times",
];

const PROBLEM_SOLVING = [
  "Jump in and figure it out as you go",
  "Plan everything before starting",
  "Look for a similar example first",
  "Ask someone for help immediately",
];

const ATTENTION_SPANS = [
  "Very short — under 10 minutes before I lose focus",
  "Short — about 15-20 minutes",
  "Medium — about 30-45 minutes",
  "Long — I can go for hours if interested",
];

const CONFUSION_STRATEGIES = [
  "Read it again slower",
  "Look for a video explanation",
  "Ask someone",
  "Try a different explanation/source",
  "Give up and move on",
  "Take a break and come back",
];

const REASONING_QUESTIONS = [
  {
    question: "What comes next: 2, 4, 8, 16, ___?",
    options: ["20", "24", "32", "64"],
    correct: "32",
  },
  {
    question: "If all Bloops are Razzies and all Razzies are Lazzies, are all Bloops definitely Lazzies?",
    options: ["Yes", "No", "Maybe", "Not enough info"],
    correct: "Yes",
  },
  {
    question: "A cube has 6 faces. If you unfold it flat, how many squares do you see?",
    options: ["4", "6", "8", "12"],
    correct: "6",
  },
  {
    question: "Book is to Reading as Fork is to ___?",
    options: ["Kitchen", "Eating", "Metal", "Spoon"],
    correct: "Eating",
  },
  {
    question: "You have a 3L jug and a 5L jug. How do you measure exactly 4L?",
    options: [
      "Fill 5L, pour into 3L, empty 3L, pour remaining 2L into 3L, fill 5L, pour into 3L until full",
      "Fill both jugs completely",
      "Fill 3L jug twice",
      "It's impossible",
    ],
    correct: "Fill 5L, pour into 3L, empty 3L, pour remaining 2L into 3L, fill 5L, pour into 3L until full",
  },
];

const ASSESSMENT_SUBJECTS = [
  "Math",
  "Science",
  "English/Writing",
  "History",
  "Coding/Tech",
  "Business/Finance",
  "Languages",
  "Creative Arts",
];

const GOAL_REASONS = [
  { id: "exams", emoji: "🎓", label: "Pass exams / improve grades" },
  { id: "career", emoji: "💼", label: "Get a better job or career" },
  { id: "curiosity", emoji: "💡", label: "Learn something new out of curiosity" },
  { id: "skill", emoji: "🛠️", label: "Build a specific skill (coding, writing, etc.)" },
  { id: "growth", emoji: "📈", label: "Personal growth and self improvement" },
  { id: "world", emoji: "🌍", label: "Understand the world better" },
  { id: "goal", emoji: "🎯", label: "Prepare for a specific goal (interview, project, etc.)" },
];

const DAILY_TIMES = [
  "10-15 minutes",
  "30 minutes",
  "1 hour",
  "2+ hours",
  "It varies",
];

const PERSONALITY_WORDS = [
  "Curious", "Lazy", "Hardworking", "Distracted", "Creative", "Logical",
  "Impatient", "Thorough", "Competitive", "Relaxed", "Ambitious", "Forgetful",
  "Focused", "Overwhelmed", "Enthusiastic", "Skeptical",
];

const MOTIVATION_TYPES = [
  "Seeing progress and improvement",
  "Getting praised or recognized",
  "Beating my own records",
  "Achieving a big goal",
  "Just enjoying the learning itself",
];

// ─── Persona generation ─────────────────────────────────────────────────
function generatePersona(answers: {
  learner_type: string;
  motivation_type: string;
  personality_words: string[];
  challenge_wrong: string;
  cognitive_attention: string;
  reasoning_score: number;
}): string {
  const { learner_type, motivation_type, personality_words, challenge_wrong, cognitive_attention, reasoning_score } = answers;

  const adjectives: string[] = [];
  if (personality_words.includes("Curious")) adjectives.push("Curious");
  if (personality_words.includes("Ambitious")) adjectives.push("Ambitious");
  if (personality_words.includes("Creative")) adjectives.push("Creative");
  if (personality_words.includes("Focused")) adjectives.push("Focused");
  if (personality_words.includes("Hardworking")) adjectives.push("Dedicated");
  if (personality_words.includes("Competitive")) adjectives.push("Driven");
  if (personality_words.includes("Enthusiastic")) adjectives.push("Enthusiastic");
  if (personality_words.includes("Logical")) adjectives.push("Analytical");
  if (personality_words.includes("Thorough")) adjectives.push("Thorough");

  const adj = adjectives.length > 0 ? adjectives[0] : "Eager";

  const typeMap: Record<string, string> = {
    reader: "Scholar",
    doer: "Builder",
    visualizer: "Visualizer",
    talker: "Communicator",
    gamer: "Challenger",
    deep_diver: "Deep Diver",
  };
  const typeName = typeMap[learner_type] || "Learner";

  let suffix = "";
  if (motivation_type.includes("progress")) suffix = " 📈";
  else if (motivation_type.includes("praised")) suffix = " ⭐";
  else if (motivation_type.includes("records")) suffix = " 🏆";
  else if (motivation_type.includes("big goal")) suffix = " 🎯";
  else if (motivation_type.includes("enjoying")) suffix = " 💡";

  if (reasoning_score >= 4 && cognitive_attention.includes("Long")) suffix = " 🧠";
  if (challenge_wrong.includes("Motivated")) suffix = " 🔥";

  return `The ${adj} ${typeName}${suffix}`;
}

function generateInsights(answers: {
  learner_type: string;
  cognitive_attention: string;
  reasoning_score: number;
  challenge_wrong: string;
  challenge_hard: string;
  personality_words: string[];
  motivation_type: string;
}): string[] {
  const insights: string[] = [];

  // Learning style insight
  const styleInsights: Record<string, string> = {
    reader: "You absorb information best through text — structured reading with personal notes is your power move.",
    doer: "You're a hands-on learner — you understand best when you can practice and experiment right away.",
    visualizer: "Your brain thinks in pictures — diagrams, flowcharts, and visual examples make concepts click for you.",
    talker: "Discussion fuels your learning — explaining concepts to others actually deepens your own understanding.",
    gamer: "Gamification lights up your brain — challenges, streaks, and rewards keep you motivated and engaged.",
    deep_diver: "You crave depth — you're not satisfied until you truly understand the why behind everything.",
  };
  if (styleInsights[answers.learner_type]) insights.push(styleInsights[answers.learner_type]);

  // Cognitive insight
  if (answers.cognitive_attention.includes("Long")) {
    insights.push("You have excellent focus endurance — perfect for deep study sessions on complex topics.");
  } else if (answers.cognitive_attention.includes("Very short")) {
    insights.push("Short focused bursts are your strength — micro-learning and spaced repetition will work great for you.");
  } else if (answers.cognitive_attention.includes("Short")) {
    insights.push("Quick study sessions suit you best — 15-20 minute focused blocks with breaks in between.");
  }

  // Resilience insight
  if (answers.challenge_wrong.includes("Motivated")) {
    insights.push("Mistakes fuel your fire — you have a growth mindset that turns every error into fuel for improvement.");
  } else if (answers.challenge_wrong.includes("Fine")) {
    insights.push("You handle mistakes well — a balanced attitude toward errors that helps you learn steadily.");
  } else if (answers.challenge_wrong.includes("Frustrated")) {
    insights.push("Challenges can feel frustrating — but with the right support and pacing, you'll build resilience over time.");
  }

  // Reasoning insight
  if (answers.reasoning_score >= 4) {
    insights.push("Your reasoning skills are strong — you can handle abstract thinking and complex problem-solving.");
  } else if (answers.reasoning_score >= 2) {
    insights.push("Your reasoning is solid — with practice, pattern recognition and logic puzzles will become second nature.");
  }

  return insights.slice(0, 4);
}

// ─── Component ──────────────────────────────────────────────────────────
export default function AssessmentPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [direction, setDirection] = useState<"forward" | "back">("forward");

  // Section 1
  const [gradeLevel, setGradeLevel] = useState("");
  const [learnerType, setLearnerType] = useState("");

  // Section 2
  const [readingApproach, setReadingApproach] = useState("");
  const [problemSolving, setProblemSolving] = useState("");
  const [attentionSpan, setAttentionSpan] = useState("");
  const [confusionStrategies, setConfusionStrategies] = useState<string[]>([]);

  // Section 3
  const [reasoningAnswers, setReasoningAnswers] = useState<string[]>(Array(5).fill(""));
  const [reasoningTimes, setReasoningTimes] = useState<number[]>(Array(5).fill(0));
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const questionStartRef = useRef<number>(Date.now());

  // Section 4
  const [subjectLevels, setSubjectLevels] = useState<Record<string, number>>(
    Object.fromEntries(ASSESSMENT_SUBJECTS.map((s) => [s, 50]))
  );
  const [subjectMostImprove, setSubjectMostImprove] = useState("");
  const [subjectHardest, setSubjectHardest] = useState("");
  const [subjectMostEnjoyed, setSubjectMostEnjoyed] = useState("");

  // Section 5
  const [goalReasons, setGoalReasons] = useState<string[]>([]);
  const [mainGoal, setMainGoal] = useState("");
  const [dailyTime, setDailyTime] = useState("");

  // Section 6
  const [challengeWrong, setChallengeWrong] = useState("");
  const [challengeEasy, setChallengeEasy] = useState("");
  const [challengeHard, setChallengeHard] = useState("");
  const [feedbackPref, setFeedbackPref] = useState("");

  // Section 7
  const [studyTimes, setStudyTimes] = useState<string[]>([]);
  const [studyLocations, setStudyLocations] = useState<string[]>([]);
  const [sessionLength, setSessionLength] = useState("");
  const [quizFeeling, setQuizFeeling] = useState("");

  // Section 8
  const [personalityWords, setPersonalityWords] = useState<string[]>([]);
  const [motivationType, setMotivationType] = useState("");
  const [personalNote, setPersonalNote] = useState("");

  // Results
  const [persona, setPersona] = useState("");
  const [insights, setInsights] = useState<string[]>([]);

  // Reset question timer when entering reasoning section or changing question
  useEffect(() => {
    if (step === 2) {
      questionStartRef.current = Date.now();
    }
  }, [step, currentQuestion]);

  const progressPercent = Math.round(((step + 1) / TOTAL_SECTIONS) * 100);

  const sectionTitles = [
    "About You",
    "How Your Brain Works",
    "Quick Brain Warm-Up 🧠",
    "What Do You Know?",
    "Your Goals",
    "How You React to Challenges",
    "Learning Environment & Habits",
    "Final Spark ✨",
  ];

  const sectionSubtitles = [
    "Let's get to know you a little better",
    "Everyone thinks differently — let's understand your style",
    "5 quick puzzles — no pressure, just have fun!",
    "Rate your confidence across different subjects",
    "What drives you? Let's find out",
    "How do you handle the ups and downs of learning?",
    "Your ideal study setup",
    "Almost done — let's add the finishing touches!",
  ];

  const canProceed = useCallback((): boolean => {
    switch (step) {
      case 0:
        return gradeLevel !== "" && learnerType !== "";
      case 1:
        return readingApproach !== "" && problemSolving !== "" && attentionSpan !== "" && confusionStrategies.length > 0;
      case 2:
        return reasoningAnswers.every((a) => a !== "");
      case 3:
        return subjectMostImprove !== "" && subjectHardest !== "" && subjectMostEnjoyed !== "";
      case 4:
        return goalReasons.length > 0 && mainGoal.trim() !== "" && dailyTime !== "";
      case 5:
        return challengeWrong !== "" && challengeEasy !== "" && challengeHard !== "" && feedbackPref !== "";
      case 6:
        return studyTimes.length > 0 && studyLocations.length > 0 && sessionLength !== "" && quizFeeling !== "";
      case 7:
        return personalityWords.length === 3 && motivationType !== "";
      default:
        return false;
    }
  }, [step, gradeLevel, learnerType, readingApproach, problemSolving, attentionSpan, confusionStrategies, reasoningAnswers, subjectMostImprove, subjectHardest, subjectMostEnjoyed, goalReasons, mainGoal, dailyTime, challengeWrong, challengeEasy, challengeHard, feedbackPref, studyTimes, studyLocations, sessionLength, quizFeeling, personalityWords, motivationType]);

  function handleNext() {
    if (!canProceed()) return;
    setDirection("forward");
    if (step < TOTAL_SECTIONS - 1) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      handleSubmit();
    }
  }

  function handleBack() {
    if (step > 0) {
      setDirection("back");
      setStep(step - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function handleReasoningAnswer(answer: string) {
    const elapsed = Math.round((Date.now() - questionStartRef.current) / 1000);
    const newAnswers = [...reasoningAnswers];
    newAnswers[currentQuestion] = answer;
    setReasoningAnswers(newAnswers);

    const newTimes = [...reasoningTimes];
    newTimes[currentQuestion] = elapsed;
    setReasoningTimes(newTimes);

    if (currentQuestion < 4) {
      setTimeout(() => {
        setCurrentQuestion(currentQuestion + 1);
        questionStartRef.current = Date.now();
      }, 300);
    }
  }

  async function handleSubmit() {
    setIsSubmitting(true);

    // Calculate reasoning score
    let score = 0;
    REASONING_QUESTIONS.forEach((q, i) => {
      if (reasoningAnswers[i] === q.correct) score++;
    });

    // Generate persona and insights
    const generatedPersona = generatePersona({
      learner_type: learnerType,
      motivation_type: motivationType,
      personality_words: personalityWords,
      challenge_wrong: challengeWrong,
      cognitive_attention: attentionSpan,
      reasoning_score: score,
    });

    const generatedInsights = generateInsights({
      learner_type: learnerType,
      cognitive_attention: attentionSpan,
      reasoning_score: score,
      challenge_wrong: challengeWrong,
      challenge_hard: challengeHard,
      personality_words: personalityWords,
      motivation_type: motivationType,
    });

    setPersona(generatedPersona);
    setInsights(generatedInsights);

    const payload = {
      grade_level: gradeLevel,
      learner_type: learnerType,
      cognitive_style: {
        reading_approach: readingApproach,
        problem_solving: problemSolving,
        attention_span: attentionSpan,
        confusion_strategies: confusionStrategies,
      },
      reasoning_score: score,
      reasoning_speed: reasoningTimes.map((t, i) => ({ question: i + 1, time_seconds: t })),
      subject_levels: subjectLevels,
      subject_most_improve: subjectMostImprove,
      subject_hardest: subjectHardest,
      subject_most_enjoyed: subjectMostEnjoyed,
      goals: {
        reasons: goalReasons,
        main_goal: mainGoal,
        daily_time: dailyTime,
      },
      challenge_behavior: {
        wrong_answer_reaction: challengeWrong,
        too_easy_reaction: challengeEasy,
        too_hard_reaction: challengeHard,
        feedback_preference: feedbackPref,
      },
      study_habits: {
        study_times: studyTimes,
        study_locations: studyLocations,
        session_length: sessionLength,
        quiz_feeling: quizFeeling,
      },
      personality_words: personalityWords,
      motivation_type: motivationType,
      personal_note: personalNote,
      learning_persona: generatedPersona,
    };

    try {
      await fetch("/api/assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {
      // silent
    }

    setIsSubmitting(false);
    setShowResults(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ─── Single-select helper ──────────────────────────────────────────
  function SingleSelect({ options, value, onChange, columns = 1 }: {
    options: string[];
    value: string;
    onChange: (v: string) => void;
    columns?: number;
  }) {
    return (
      <div className={`grid gap-2 ${columns === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`text-left px-4 py-3 rounded-xl border transition-all text-sm font-medium ${
              value === opt
                ? "border-[var(--accent)] bg-[var(--accent-light)] text-[var(--accent)] shadow-[var(--shadow-sm)]"
                : "border-[var(--border)] bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-surface)]"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    );
  }

  // ─── Multi-select helper ───────────────────────────────────────────
  function MultiSelect({ options, values, onChange, max }: {
    options: string[];
    values: string[];
    onChange: (v: string[]) => void;
    max?: number;
  }) {
    return (
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const isSelected = values.includes(opt);
          const isDisabled = !isSelected && max !== undefined && values.length >= max;
          return (
            <button
              key={opt}
              onClick={() => {
                if (isSelected) {
                  onChange(values.filter((v) => v !== opt));
                } else if (!isDisabled) {
                  onChange([...values, opt]);
                }
              }}
              disabled={isDisabled}
              className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                isSelected
                  ? "border-[var(--accent)] bg-[var(--accent-light)] text-[var(--accent)]"
                  : isDisabled
                    ? "border-[var(--border)] bg-[var(--bg-muted)] text-[var(--text-tertiary)] opacity-40 cursor-not-allowed"
                    : "border-[var(--border)] bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    );
  }

  // ─── Results screen ────────────────────────────────────────────────
  if (showResults) {
    // Determine strong and weak subjects
    const sortedSubjects = Object.entries(subjectLevels).sort(([, a], [, b]) => b - a);
    const strong = sortedSubjects.filter(([, v]) => v >= 60).slice(0, 3);
    const toImprove = sortedSubjects.filter(([, v]) => v < 60).slice(-3).reverse();

    return (
      <main className="min-h-[calc(100vh-57px)] bg-[var(--bg-base)] px-4 py-10">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8 animate-fade-in">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Your Learning Profile</h1>
            <p className="text-[var(--text-tertiary)]">Here&apos;s what we learned about you</p>
          </div>

          {/* Persona Card */}
          <div className="bg-[var(--accent)] rounded-2xl p-8 text-center mb-6 shadow-[var(--shadow-sm)]">
            <p className="text-white/60 text-sm font-medium uppercase tracking-wider mb-2">You are</p>
            <h2 className="text-3xl font-bold text-white mb-3">{persona}</h2>
            <p className="text-white/70 text-sm">
              {LEARNER_TYPES.find((t) => t.id === learnerType)?.desc}
            </p>
          </div>

          {/* Insights */}
          {insights.length > 0 && (
            <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">💡 Personalized Insights</h3>
              <div className="space-y-3">
                {insights.map((insight, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[var(--accent-light)] text-[var(--accent)] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <p className="text-sm text-[var(--text-secondary)]">{insight}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Subjects */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {strong.length > 0 && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-emerald-600 mb-3">💪 Your Strengths</h3>
                <div className="space-y-2">
                  {strong.map(([subj, val]) => (
                    <div key={subj} className="flex items-center justify-between">
                      <span className="text-sm text-emerald-700">{subj}</span>
                      <span className="text-xs font-bold text-emerald-600">{val}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {toImprove.length > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-amber-600 mb-3">🌱 Room to Grow</h3>
                <div className="space-y-2">
                  {toImprove.map(([subj, val]) => (
                    <div key={subj} className="flex items-center justify-between">
                      <span className="text-sm text-amber-700">{subj}</span>
                      <span className="text-xs font-bold text-amber-600">{val}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Personalized message */}
          <div className="bg-[var(--accent-light)] border border-[var(--accent)]/20 rounded-2xl p-6 text-center mb-8">
            <div className="text-3xl mb-3">✨</div>
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">
              Your EduMind is now personalized for you!
            </h3>
            <p className="text-sm text-[var(--text-tertiary)]">
              Every lesson, every explanation, and every challenge will be tailored to how you learn best.
            </p>
          </div>

          <button
            onClick={() => router.push("/dashboard")}
            className="w-full font-semibold py-4 rounded-xl transition-all text-lg bg-[var(--accent)] text-[var(--bg-base)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-sm)]"
          >
            Start Learning →
          </button>
        </div>
      </main>
    );
  }

  // ─── Main questionnaire ────────────────────────────────────────────
  return (
    <main className="min-h-[calc(100vh-57px)] bg-[var(--bg-base)] px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-2">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Learning Assessment</h1>
          <p className="text-[var(--text-tertiary)] text-sm mt-1">~7 min · Helps EduMind teach you better</p>
        </div>

        {/* Progress bar */}
        <div className="mb-8 mt-4">
          <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)] mb-2">
            <span>Section {step + 1} of {TOTAL_SECTIONS}</span>
            <span>{progressPercent}% complete</span>
          </div>
          <div className="w-full bg-[var(--bg-surface)] rounded-full h-2.5 overflow-hidden">
            <div
              className="h-full bg-[var(--accent)] rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Section header */}
        <div className={`mb-6 transition-all duration-300 ${direction === "forward" ? "animate-slide-in-right" : "animate-slide-in-left"}`} key={`header-${step}`}>
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">{sectionTitles[step]}</h2>
          <p className="text-[var(--text-tertiary)] text-sm">{sectionSubtitles[step]}</p>
        </div>

        {/* Section content */}
        <div className={`transition-all duration-300 ${direction === "forward" ? "animate-slide-in-right" : "animate-slide-in-left"}`} key={`content-${step}`}>

          {/* ─── SECTION 1: About You ──────────────────────── */}
          {step === 0 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-3">
                  What grade/level are you in?
                </label>
                <SingleSelect options={GRADE_LEVELS} value={gradeLevel} onChange={setGradeLevel} columns={2} />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-3">
                  How would you describe yourself as a learner?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {LEARNER_TYPES.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setLearnerType(type.id)}
                      className={`text-left p-4 rounded-xl border transition-all ${
                        learnerType === type.id
                          ? "border-[var(--accent)] bg-[var(--accent-light)] shadow-[var(--shadow-sm)]"
                          : "border-[var(--border)] bg-[var(--bg-muted)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-surface)]"
                      }`}
                    >
                      <div className="text-2xl mb-2">{type.emoji}</div>
                      <h3 className={`font-semibold text-sm ${learnerType === type.id ? "text-[var(--accent)]" : "text-[var(--text-primary)]"}`}>
                        {type.label}
                      </h3>
                      <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{type.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ─── SECTION 2: Cognitive Style ────────────────── */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-3">
                  When you read something new, you usually:
                </label>
                <SingleSelect options={READING_APPROACHES} value={readingApproach} onChange={setReadingApproach} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-3">
                  When solving a problem you:
                </label>
                <SingleSelect options={PROBLEM_SOLVING} value={problemSolving} onChange={setProblemSolving} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-3">
                  Your attention span for studying is usually:
                </label>
                <SingleSelect options={ATTENTION_SPANS} value={attentionSpan} onChange={setAttentionSpan} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-3">
                  When you don&apos;t understand something you: <span className="text-[var(--text-tertiary)] font-normal">(select all that apply)</span>
                </label>
                <MultiSelect options={CONFUSION_STRATEGIES} values={confusionStrategies} onChange={setConfusionStrategies} />
              </div>
            </div>
          )}

          {/* ─── SECTION 3: Reasoning ─────────────────────── */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[var(--text-tertiary)]">Question {currentQuestion + 1} of 5</span>
                <div className="flex gap-1.5">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        reasoningAnswers[i] !== ""
                          ? "bg-[var(--accent)]"
                          : i === currentQuestion
                            ? "bg-[var(--accent)]/50"
                            : "bg-[var(--bg-surface)]"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-6">
                <p className="text-base font-semibold text-[var(--text-primary)] mb-5">
                  {REASONING_QUESTIONS[currentQuestion].question}
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {REASONING_QUESTIONS[currentQuestion].options.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => handleReasoningAnswer(opt)}
                      className={`text-left px-4 py-3 rounded-xl border transition-all text-sm font-medium ${
                        reasoningAnswers[currentQuestion] === opt
                          ? "border-[var(--accent)] bg-[var(--accent-light)] text-[var(--accent)]"
                          : "border-[var(--border)] bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Navigate between questions */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => { if (currentQuestion > 0) setCurrentQuestion(currentQuestion - 1); }}
                  disabled={currentQuestion === 0}
                  className="text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] disabled:invisible"
                >
                  ← Previous
                </button>
                <button
                  onClick={() => { if (currentQuestion < 4 && reasoningAnswers[currentQuestion]) setCurrentQuestion(currentQuestion + 1); }}
                  disabled={currentQuestion === 4 || !reasoningAnswers[currentQuestion]}
                  className="text-sm text-[var(--accent)] hover:text-[var(--text-primary)] disabled:invisible"
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          {/* ─── SECTION 4: Subject Knowledge ─────────────── */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-4">
                  Rate your confidence in each subject:
                </label>
                <div className="space-y-4">
                  {ASSESSMENT_SUBJECTS.map((subj) => (
                    <div key={subj} className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-[var(--text-primary)]">{subj}</span>
                        <span className="text-xs font-bold text-[var(--accent)]">{subjectLevels[subj]}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={subjectLevels[subj]}
                        onChange={(e) => setSubjectLevels({ ...subjectLevels, [subj]: Number(e.target.value) })}
                        className="w-full accent-[var(--accent)] h-2"
                      />
                      <div className="flex justify-between text-[10px] text-[var(--text-tertiary)] mt-1">
                        <span>Beginner</span>
                        <span>Expert</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-3">
                  Which subject do you want to improve the MOST?
                </label>
                <SingleSelect options={ASSESSMENT_SUBJECTS} value={subjectMostImprove} onChange={setSubjectMostImprove} columns={2} />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-3">
                  Which subject do you find the hardest?
                </label>
                <SingleSelect options={ASSESSMENT_SUBJECTS} value={subjectHardest} onChange={setSubjectHardest} columns={2} />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-3">
                  Which subject do you enjoy the most (even if you&apos;re not great at it)?
                </label>
                <SingleSelect options={ASSESSMENT_SUBJECTS} value={subjectMostEnjoyed} onChange={setSubjectMostEnjoyed} columns={2} />
              </div>
            </div>
          )}

          {/* ─── SECTION 5: Goals ─────────────────────────── */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-3">
                  Why are you using EduMind? <span className="text-[var(--text-tertiary)] font-normal">(select all that apply)</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {GOAL_REASONS.map((reason) => {
                    const isSelected = goalReasons.includes(reason.id);
                    return (
                      <button
                        key={reason.id}
                        onClick={() => {
                          if (isSelected) {
                            setGoalReasons(goalReasons.filter((r) => r !== reason.id));
                          } else {
                            setGoalReasons([...goalReasons, reason.id]);
                          }
                        }}
                        className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
                          isSelected
                            ? "border-[var(--accent)] bg-[var(--accent-light)] shadow-[var(--shadow-sm)]"
                            : "border-[var(--border)] bg-[var(--bg-muted)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-surface)]"
                        }`}
                      >
                        <span className="text-xl">{reason.emoji}</span>
                        <span className={`text-sm font-medium ${isSelected ? "text-[var(--accent)]" : "text-[var(--text-secondary)]"}`}>
                          {reason.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                  What is your biggest learning goal right now?
                </label>
                <textarea
                  value={mainGoal}
                  onChange={(e) => setMainGoal(e.target.value)}
                  placeholder="e.g., Pass my math exam next month, Learn Python for data science..."
                  className="w-full bg-[var(--bg-muted)] border border-[var(--border)] rounded-xl p-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] outline-none resize-none h-24"
                  maxLength={200}
                />
                <p className="text-xs text-[var(--text-tertiary)] text-right mt-1">{mainGoal.length}/200</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-3">
                  How much time can you dedicate to learning daily?
                </label>
                <SingleSelect options={DAILY_TIMES} value={dailyTime} onChange={setDailyTime} />
              </div>
            </div>
          )}

          {/* ─── SECTION 6: Challenge Behavior ────────────── */}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-3">
                  When you get something wrong you feel:
                </label>
                <SingleSelect
                  options={[
                    "Frustrated and want to stop",
                    "A little annoyed but keep going",
                    "Fine — mistakes help me learn",
                    "Motivated to figure out why I was wrong",
                  ]}
                  value={challengeWrong}
                  onChange={setChallengeWrong}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-3">
                  When something is too easy you:
                </label>
                <SingleSelect
                  options={[
                    "Get bored quickly",
                    "Enjoy the confidence boost",
                    "Ask for harder challenges",
                    "Help others with it",
                  ]}
                  value={challengeEasy}
                  onChange={setChallengeEasy}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-3">
                  When something is too hard you:
                </label>
                <SingleSelect
                  options={[
                    "Avoid it",
                    "Push through even if it takes long",
                    "Break it into smaller parts",
                    "Look for easier resources first",
                  ]}
                  value={challengeHard}
                  onChange={setChallengeHard}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-3">
                  Do you prefer:
                </label>
                <SingleSelect
                  options={[
                    "Lots of encouragement and positive reinforcement",
                    "Honest feedback even if it's tough",
                    "Neutral — just give me the facts",
                    "Mix of both",
                  ]}
                  value={feedbackPref}
                  onChange={setFeedbackPref}
                />
              </div>
            </div>
          )}

          {/* ─── SECTION 7: Study Habits ──────────────────── */}
          {step === 6 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-3">
                  When do you usually study? <span className="text-[var(--text-tertiary)] font-normal">(select all that apply)</span>
                </label>
                <MultiSelect
                  options={["Morning", "Afternoon", "Evening", "Late night"]}
                  values={studyTimes}
                  onChange={setStudyTimes}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-3">
                  Where do you usually learn? <span className="text-[var(--text-tertiary)] font-normal">(select all that apply)</span>
                </label>
                <MultiSelect
                  options={["At home", "School/College", "Commuting", "Cafe", "Everywhere"]}
                  values={studyLocations}
                  onChange={setStudyLocations}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-3">
                  Do you prefer:
                </label>
                <SingleSelect
                  options={[
                    "Short sharp lessons (5-10 mins)",
                    "Medium sessions (20-30 mins)",
                    "Long deep dives (1hr+)",
                    "Depends on the topic",
                  ]}
                  value={sessionLength}
                  onChange={setSessionLength}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-3">
                  How do you feel about quizzes and tests?
                </label>
                <SingleSelect
                  options={[
                    "Love them — they help me know where I stand",
                    "They stress me out but I know they help",
                    "I avoid them",
                    "Indifferent",
                  ]}
                  value={quizFeeling}
                  onChange={setQuizFeeling}
                />
              </div>
            </div>
          )}

          {/* ─── SECTION 8: Final Spark ───────────────────── */}
          {step === 7 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                  Pick 3 words that describe you as a student:
                  <span className={`ml-2 text-xs font-normal ${personalityWords.length === 3 ? "text-emerald-600" : "text-[var(--text-tertiary)]"}`}>
                    {personalityWords.length}/3 selected
                  </span>
                </label>
                <MultiSelect
                  options={PERSONALITY_WORDS}
                  values={personalityWords}
                  onChange={setPersonalityWords}
                  max={3}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-3">
                  What motivates you most?
                </label>
                <SingleSelect options={MOTIVATION_TYPES} value={motivationType} onChange={setMotivationType} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                  One thing you wish teachers/tutors knew about you: <span className="text-[var(--text-tertiary)] font-normal">(optional)</span>
                </label>
                <textarea
                  value={personalNote}
                  onChange={(e) => setPersonalNote(e.target.value)}
                  placeholder="e.g., I need extra patience with math, I love when learning feels like a game..."
                  className="w-full bg-[var(--bg-muted)] border border-[var(--border)] rounded-xl p-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] outline-none resize-none h-24"
                  maxLength={300}
                />
              </div>
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-8 pb-8">
          <button
            onClick={handleBack}
            disabled={step === 0}
            className="text-sm font-medium text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] disabled:invisible px-4 py-2 transition-colors"
          >
            ← Back
          </button>

          <button
            onClick={handleNext}
            disabled={!canProceed() || isSubmitting}
            className={`px-8 py-3 rounded-xl font-semibold text-sm transition-all ${
              canProceed() && !isSubmitting
                ? "bg-[var(--accent)] text-[var(--bg-base)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-sm)]"
                : "bg-[var(--bg-surface)] text-[var(--text-tertiary)] cursor-not-allowed"
            }`}
          >
            {isSubmitting
              ? "Analyzing..."
              : step === TOTAL_SECTIONS - 1
                ? "See My Results ✨"
                : "Continue →"}
          </button>
        </div>
      </div>

      {/* Inline keyframe styles for animations */}
      <style jsx>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        :global(.animate-slide-in-right) {
          animation: slideInRight 0.3s ease-out;
        }
        :global(.animate-slide-in-left) {
          animation: slideInLeft 0.3s ease-out;
        }
        :global(.animate-fade-in) {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </main>
  );
}
