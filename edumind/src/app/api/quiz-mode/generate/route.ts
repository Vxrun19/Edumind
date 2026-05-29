import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import { NextRequest, NextResponse } from "next/server";
import { verifyQuizQuestions, type VerifiableQuestion } from "@/lib/verifyQuiz";

const client = new Anthropic();

const QUIZ_TIMEOUT_MS = 30_000;
const RETRY_DELAY_MS = 2_000;

interface GeneratedQuestion {
  question: string;
  type: "multiple_choice" | "true_false" | "fill_blank";
  options?: string[];
  correct_answer: string;
  explanation: string;
}

function parseQuizArray(text: string): GeneratedQuestion[] {
  const cleaned = text
    .replace(/```json\s*/g, "")
    .replace(/```\s*/g, "")
    .trim();
  const parsed = JSON.parse(cleaned);
  const arr = Array.isArray(parsed) ? parsed : parsed.questions ?? parsed;
  if (!Array.isArray(arr) || arr.length === 0) {
    throw new Error("Invalid quiz array");
  }
  return arr;
}

async function callAPI(
  systemPrompt: string,
  userPrompt: string
): Promise<GeneratedQuestion[]> {
  const apiCall = client.messages.create({
    // Haiku is fine here. Answer-correctness is handled structurally by
    // the prompt — the JSON schema emits "explanation" before
    // "correct_answer", so the model works the full solution first and
    // then states the answer conditioned on it (reason-before-answer).
    // That fixes the mismatch class; a bigger model does not.
    model: "claude-haiku-4-5-20251001",
    // Bumped from 4096: explanations are now full worked solutions and we
    // over-generate a buffer of questions, so the output is larger.
    max_tokens: 8192,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("QUIZ_TIMEOUT")), QUIZ_TIMEOUT_MS)
  );

  const response = await Promise.race([apiCall, timeoutPromise]);
  const responseText =
    response.content[0].type === "text" ? response.content[0].text : "[]";
  return parseQuizArray(responseText);
}

async function generateWithRetry(
  systemPrompt: string,
  userPrompt: string
): Promise<GeneratedQuestion[]> {
  try {
    return await callAPI(systemPrompt, userPrompt);
  } catch (firstError) {
    console.warn("Quiz mode generation attempt 1 failed:", firstError);
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    return await callAPI(systemPrompt, userPrompt);
  }
}

// POST /api/quiz-mode/generate
// body: { subject, difficulty, quizType, numQuestions }
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { subject, difficulty, quizType, numQuestions } = await request.json();

  const subjectName = subject || "Mixed/Random";
  const diff = difficulty || "intermediate";
  const type = quizType || "mixed";
  const count = Math.min(numQuestions || 10, 20);
  // Over-generate a small buffer so the verification pass can drop flawed
  // questions and still leave enough to hit the requested count.
  const generateCount = Math.min(count + 2, 22);

  // Load assessment for "auto" difficulty and personalization
  let assessmentSummary = "";
  let effectiveDifficulty = diff;

  const { data: assessment } = await supabase
    .from("assessments")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (assessment) {
    const subjectLevel =
      assessment.subject_levels?.[subjectName] ??
      Object.values(assessment.subject_levels ?? {}).reduce(
        (a: number, b: unknown) => a + (b as number),
        0
      ) / Math.max(Object.keys(assessment.subject_levels ?? {}).length, 1);

    assessmentSummary = `Student profile: ${assessment.learner_type} learner, grade ${assessment.grade_level}, reasoning score ${assessment.reasoning_score}/5, subject confidence ~${Math.round(subjectLevel as number)}%. Motivation: ${assessment.motivation_type}. Personality: ${assessment.personality_words?.join(", ")}.`;

    if (diff === "auto") {
      if ((subjectLevel as number) >= 70) effectiveDifficulty = "advanced";
      else if ((subjectLevel as number) >= 40) effectiveDifficulty = "intermediate";
      else effectiveDifficulty = "beginner";
    }
  } else if (diff === "auto") {
    effectiveDifficulty = "intermediate";
  }

  // Load profile for age context
  const { data: profile } = await supabase
    .from("student_profiles")
    .select("age_group, level")
    .eq("user_id", userId)
    .single();

  const ageContext = profile
    ? `The student is in the "${profile.age_group}" age group at "${profile.level}" level. Make questions age-appropriate.`
    : "";

  // Build type instructions
  let typeInstruction = "";
  if (type === "multiple_choice") {
    typeInstruction = `ALL questions must be type "multiple_choice" with exactly 4 options.`;
  } else if (type === "true_false") {
    typeInstruction = `ALL questions must be type "true_false" with correct_answer being exactly "True" or "False". Do NOT include options.`;
  } else if (type === "fill_blank") {
    typeInstruction = `ALL questions must be type "fill_blank". The question should contain a blank indicated by "___". correct_answer should be the word/phrase that fills the blank. Do NOT include options.`;
  } else {
    typeInstruction = `Mix the question types. Use roughly equal amounts of "multiple_choice" (with 4 options), "true_false" (correct_answer is "True" or "False"), and "fill_blank" (question contains "___", correct_answer is the missing word/phrase). For multiple_choice include an "options" array of 4 strings. For true_false and fill_blank do NOT include options.`;
  }

  const subjectInstruction =
    subjectName === "Mixed/Random"
      ? "Mix questions across the four JEE/NEET subjects — Physics, Chemistry, Mathematics, and Biology — with a balanced spread."
      : `All questions should be about ${subjectName} at the JEE/NEET level.`;

  const systemPrompt = `Respond with ONLY a raw JSON array. No markdown, no backticks, no explanation. Start directly with [ and end with ]. You are a quiz generator for EduMind, an AI tutor for Indian JEE and NEET aspirants. Quizzes test understanding of the JEE (Physics, Chemistry, Mathematics) and NEET (Physics, Chemistry, Biology) syllabi.

ANSWER ACCURACY — the single most important rule. This is a study tool; a wrong answer key marks a correct student wrong and destroys trust.
- Solve each question completely BEFORE committing to it. The "correct_answer" field MUST equal exactly the value your "explanation" works through to — they must never disagree.
- Do every calculation carefully and re-check the arithmetic before finalizing. For multiple_choice, correct_answer must be the exact text of the matching option, and that option must appear in the options array.
- Present clean, correct working in the explanation. NEVER include "wait, recalculating", "actually", or any visible self-correction — if you catch a mistake, fix it silently and make sure correct_answer reflects the corrected final result.

MATH NOTATION: Write all mathematics in plain Unicode characters only. NEVER use LaTeX or TeX syntax — no \\frac, \\sqrt, \\boxed, \\pm, \\le, \\ge, \\theta, \\pi, \\int, \\sum, \\cdot, \\times, $$...$$, $...$, ^{...}, _{...}. Use Unicode: x², x³, √x, ∛x, b/a, (b² - 4ac) / (2a), ±, ≤, ≥, ≠, ≈, θ, π, α, β, λ, Δ, ∞, ∫, ∑, →, ·, ×, H₂O, CO₂. This applies to question text, options, AND correct answers — LaTeX appears as raw garbage characters in the quiz UI.

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

  const userPrompt = `Generate ${generateCount} quiz questions about ${subjectName} at ${effectiveDifficulty} level for a student with this profile: ${assessmentSummary || "No profile available — use general difficulty level."}
${ageContext}

${subjectInstruction}
${typeInstruction}

Return ONLY a valid JSON array. Each question object must have its keys in EXACTLY this order: question (string), type (multiple_choice/true_false/fill_blank), explanation (string showing the worked solution and reasoning), correct_answer (string), and — for multiple_choice ONLY — options (array of 4 strings) placed LAST, after correct_answer. true_false and fill_blank must NOT include an options key.

Work through the full solution in "explanation" FIRST, then set "correct_answer" to the exact final result of that worked solution — it must match the result reached in the explanation. For multiple_choice, AFTER computing correct_answer, generate exactly 4 options where ONE is identical to correct_answer and the other 3 are plausible distractors. Never produce options that don't include the computed correct answer. Make questions engaging and practical, not just theoretical. Vary the question styles.`;

  try {
    let questions = await generateWithRetry(systemPrompt, userPrompt);

    // ─── Verification pass (Sonnet) ─────────────────────────
    // Independently re-checks each question and drops any that fail
    // (answer disagreeing with the worked solution, duplicate/ambiguous
    // multiple-choice options, impossible or ambiguous premise). On any
    // checker error we log and ship the unverified set — never crash the
    // quiz (the generator output already carries the prompt improvements).
    try {
      const verifiable: VerifiableQuestion[] = questions.map((q) => ({
        question: q.question,
        type: q.type,
        options: q.options ?? [],
        correct_answer: q.correct_answer,
        explanation: q.explanation,
      }));
      const verdicts = await verifyQuizQuestions(verifiable);
      const validIdx = new Set(
        verdicts.filter((v) => v.valid).map((v) => v.index)
      );
      const verified = questions.filter((_, i) => validIdx.has(i));
      const dropped = verdicts.filter((v) => !v.valid);
      if (dropped.length > 0) {
        console.warn(
          `Quiz verification dropped ${dropped.length}/${questions.length} question(s):`,
          dropped.map((d) => `#${d.index}: ${d.reason ?? "flagged"}`)
        );
      }
      // Use the verified set only if it leaves a usable quiz; otherwise
      // fall back to the unverified set (guards a misfiring checker from
      // emptying the quiz).
      if (verified.length >= Math.min(3, count)) {
        questions = verified;
      } else {
        console.warn(
          `Quiz verification left only ${verified.length} valid question(s); using unverified set.`
        );
      }
    } catch (verifyErr) {
      console.error(
        "Quiz verification failed; shipping unverified questions:",
        verifyErr
      );
    }

    return NextResponse.json({
      questions: questions.slice(0, count),
      difficulty: effectiveDifficulty,
    });
  } catch (error) {
    console.error("Quiz mode generation error:", error);
    const message =
      error instanceof Error && error.message === "QUIZ_TIMEOUT"
        ? "Quiz generation timed out. Please try again."
        : "Something went wrong generating your quiz. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
