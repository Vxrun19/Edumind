import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import { rateLimit } from "@/lib/ratelimit";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

const QUIZ_TIMEOUT_MS = 30_000;
const RETRY_DELAY_MS = 2_000;

interface QuizData {
  title: string;
  questions: Array<{
    question_number: number;
    question_type: string;
    question_text: string;
    options: string[];
    correct_answer: string;
    explanation: string;
  }>;
}

function parseQuizJSON(text: string): QuizData {
  const cleaned = text
    .replace(/```json\s*/g, "")
    .replace(/```\s*/g, "")
    .trim();
  const parsed = JSON.parse(cleaned);
  if (!parsed.title || !parsed.questions || parsed.questions.length === 0) {
    throw new Error("Invalid quiz structure");
  }
  return parsed;
}

async function callQuizAPI(
  systemPrompt: string,
  userPrompt: string
): Promise<QuizData> {
  const apiCall = client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("QUIZ_TIMEOUT")), QUIZ_TIMEOUT_MS)
  );

  const response = await Promise.race([apiCall, timeoutPromise]);

  const responseText =
    response.content[0].type === "text" ? response.content[0].text : "{}";

  return parseQuizJSON(responseText);
}

async function generateQuizWithRetry(
  systemPrompt: string,
  userPrompt: string
): Promise<QuizData> {
  try {
    return await callQuizAPI(systemPrompt, userPrompt);
  } catch (firstError) {
    console.warn("Quiz generation first attempt failed, retrying in 2s:", firstError);
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    return await callQuizAPI(systemPrompt, userPrompt);
  }
}

// POST /api/quiz/generate — generate a quiz from a conversation
// body: { conversationId?: string, subject?: string, messages?: ChatMessage[], difficulty?: string }
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limiting: 10 requests per minute per user
  const { success: rateLimitOk } = rateLimit(userId, 10, 60_000);
  if (!rateLimitOk) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429 }
    );
  }

  const { conversationId, subject, messages, difficulty } =
    await request.json();

  // ─── Free plan quiz limit check ─────────────────────
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("user_id", userId)
    .single();

  const userPlan = sub?.plan || "free";

  if (userPlan === "free") {
    const today = new Date().toISOString().split("T")[0];
    const { count: quizCount } = await supabase
      .from("quizzes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", `${today}T00:00:00.000Z`);

    if (quizCount !== null && quizCount >= 3) {
      return NextResponse.json(
        {
          error: "You've reached your daily quiz limit (3 quizzes). Upgrade to Pro for unlimited quizzes!",
          upgradeRequired: true,
          usage: { used: quizCount, limit: 3 },
        },
        { status: 403 }
      );
    }
  }

  const subjectName = subject || "General";
  const quizDifficulty = difficulty || "medium";

  // If conversationId provided, load messages from DB
  let conversationMessages = messages || [];
  if (conversationId && conversationMessages.length === 0) {
    const { data: convo } = await supabase
      .from("conversations")
      .select("user_id, subject, title")
      .eq("id", conversationId)
      .single();

    if (!convo || convo.user_id !== userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { data: msgs } = await supabase
      .from("messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(30);

    conversationMessages = msgs ?? [];
  }

  // Build conversation context for quiz generation
  const conversationText = conversationMessages
    .map(
      (m: { role: string; content: string }) =>
        `${m.role.toUpperCase()}: ${m.content.slice(0, 300)}`
    )
    .join("\n\n");

  // Load student profile for age-appropriate questions
  const { data: profile } = await supabase
    .from("student_profiles")
    .select("age_group, level")
    .eq("user_id", userId)
    .single();

  const ageContext = profile
    ? `The student is in the "${profile.age_group}" age group at "${profile.level}" level. Make questions age-appropriate.`
    : "";

  const difficultyMap: Record<string, string> = {
    easy: "Make questions straightforward with clear answers. Use simple language. All multiple choice should have one obviously correct answer.",
    medium:
      "Mix of straightforward and moderately challenging questions. Some should require thinking. Include some tricky distractors in multiple choice.",
    hard: "Make questions challenging and thought-provoking. Multiple choice should have plausible distractors. Open-ended questions should require deeper analysis.",
  };
  const difficultyInstructions = difficultyMap[quizDifficulty] || "";

  const systemPrompt = `Respond with ONLY a raw JSON object. No markdown, no backticks, no explanation. Start directly with { and end with }. You are a quiz generator for EduMind, an AI tutor for Indian JEE and NEET aspirants. Create engaging, accurate quizzes grounded in the tutoring conversation provided.

MATH NOTATION: Write all mathematics in plain Unicode characters only. NEVER use LaTeX or TeX syntax — no \\frac, \\sqrt, \\boxed, \\pm, \\le, \\ge, \\theta, \\pi, \\int, \\sum, \\cdot, \\times, $$...$$, $...$, ^{...}, _{...}. Use Unicode: x², √x, b/a, (b² - 4ac) / (2a), ±, ≤, ≥, ≠, ≈, θ, π, α, β, Δ, ∞, ∫, ∑, →, ·, ×, H₂O, CO₂. This applies to question text, options, AND correct answers — LaTeX appears as raw garbage characters in the quiz UI.

QUESTION STYLE — authentic JEE/NEET exam framing.

Questions must read like they could appear in an actual JEE Main, JEE Advanced, or NEET UG paper. Use the kinds of scenarios that show up in real exams and standard preparation textbooks (NCERT, HC Verma, DC Pandey, Irodov, Resnick-Halliday, Morrison & Boyd, Trueman's Biology):

- Physics: projectiles, inclined planes, pulleys and strings, springs and oscillations, pendulums, electric circuits (resistors, capacitors, inductors, EMF sources), magnetic fields on current-carrying wires, lenses and mirrors, calorimetry, gas laws and thermodynamics, named physical objects (a block, particle, car, train, satellite, planet).
- Chemistry: titrations, named reaction mechanisms (SN1, SN2, E1, E2, addition, elimination), equilibrium and stoichiometry with real substances, periodic-trend comparisons, electrochemical and galvanic cells, buffer solutions, IUPAC nomenclature, organic synthesis.
- Mathematics: clean abstract problems — functions, limits, derivatives, integrals, vectors, 3D geometry, matrices and determinants, conics, probability and combinatorics, complex numbers, trigonometric identities. Textbook-style real-world wrappers (ladder against a wall, tower-and-shadow trig, max-min word problems) are fine.
- Biology: cellular processes, anatomy and physiology of specific organ systems, Mendelian and molecular genetics, ecology and population dynamics, plant physiology, named organisms, real biological structures and pathways.

DO NOT frame questions around:
- Video games, gamers, game characters, NPCs, game maps, levels, XP, scoreboards, "the player runs at…", any gaming scenario
- Pop culture: movies, TV shows, songs, celebrities, social-media scenarios
- Casual everyday trivia ("Sarah goes shopping", "Tom texts his friend…")
- Memes, internet culture, AI chatbots, apps or websites
- Generic "fun" or gamified wrappers designed to feel relatable

The voice should be calm, technical, and exam-appropriate — the kind of question a JEE/NEET aspirant has seen many times in their practice papers. Use concrete numbers and specific physical, chemical, or biological setups, not casual storytelling.`;

  const userPrompt = `Generate a quiz based on this tutoring conversation.

Subject: ${subjectName}
Difficulty: ${quizDifficulty}
${ageContext}
${difficultyInstructions}

Conversation:
${conversationText || "No conversation context — generate a general knowledge quiz for the subject: " + subjectName}

Create exactly 5 questions:
- 3 multiple choice (with 4 options each, labeled A/B/C/D)
- 2 open-ended (short answer)

Return a JSON object with this exact structure:
{
  "title": "Quiz title based on topics covered",
  "questions": [
    {
      "question_number": 1,
      "question_type": "multiple_choice",
      "question_text": "The question text",
      "options": ["A) Option one", "B) Option two", "C) Option three", "D) Option four"],
      "correct_answer": "A",
      "explanation": "Brief explanation of why this is correct"
    },
    {
      "question_number": 4,
      "question_type": "open_ended",
      "question_text": "The open-ended question",
      "options": [],
      "correct_answer": "Expected answer or key points",
      "explanation": "What a good answer should include"
    }
  ]
}`;

  try {
    const quizData = await generateQuizWithRetry(systemPrompt, userPrompt);

    // Save quiz to DB
    const { data: quiz, error: quizError } = await supabase
      .from("quizzes")
      .insert({
        user_id: userId,
        conversation_id: conversationId || null,
        subject: subjectName,
        title: quizData.title,
        difficulty: quizDifficulty,
        total_questions: quizData.questions.length,
      })
      .select()
      .single();

    if (quizError || !quiz) {
      return NextResponse.json(
        { error: quizError?.message || "Failed to save quiz" },
        { status: 500 }
      );
    }

    // Save questions
    const questionsToInsert = quizData.questions.map((q) => ({
      quiz_id: quiz.id,
      question_number: q.question_number,
      question_type: q.question_type,
      question_text: q.question_text,
      options: q.options || [],
      correct_answer: q.correct_answer,
      explanation: q.explanation || "",
    }));

    const { error: questionsError } = await supabase
      .from("quiz_questions")
      .insert(questionsToInsert);

    if (questionsError) {
      // Clean up the quiz if questions failed
      await supabase.from("quizzes").delete().eq("id", quiz.id);
      return NextResponse.json(
        { error: "Failed to save quiz questions" },
        { status: 500 }
      );
    }

    return NextResponse.json({ quiz });
  } catch (error) {
    console.error("Quiz generation error (after retry):", error);
    const message =
      error instanceof Error && error.message === "QUIZ_TIMEOUT"
        ? "Quiz generation timed out. Please try again."
        : "Something went wrong generating your quiz. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
