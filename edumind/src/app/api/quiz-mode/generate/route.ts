import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import { NextRequest, NextResponse } from "next/server";

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
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4096,
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
      ? "Mix questions from various subjects: math, science, english, history, coding, languages, life skills, finance, health & fitness, art & music."
      : `All questions should be about ${subjectName}.`;

  const systemPrompt = `Respond with ONLY a raw JSON array. No markdown, no backticks, no explanation. Start directly with [ and end with ]. You are a quiz generator for an educational platform.`;

  const userPrompt = `Generate ${count} quiz questions about ${subjectName} at ${effectiveDifficulty} level for a student with this profile: ${assessmentSummary || "No profile available — use general difficulty level."}
${ageContext}

${subjectInstruction}
${typeInstruction}

Return ONLY a valid JSON array. Each question object must have: question (string), type (multiple_choice/true_false/fill_blank), options (array of 4 strings, only for multiple_choice), correct_answer (string), explanation (string, 1-2 sentences explaining the answer). Make questions engaging and practical, not just theoretical. Vary the question styles.`;

  try {
    const questions = await generateWithRetry(systemPrompt, userPrompt);

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
