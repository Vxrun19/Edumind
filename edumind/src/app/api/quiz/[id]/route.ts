import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

// GET /api/quiz/[id] — fetch a quiz with its questions
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Fetch quiz
  const { data: quiz, error: quizError } = await supabase
    .from("quizzes")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (quizError || !quiz) {
    return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
  }

  // Fetch questions
  const { data: questions } = await supabase
    .from("quiz_questions")
    .select("*")
    .eq("quiz_id", id)
    .order("question_number", { ascending: true });

  // Fetch past attempts
  const { data: attempts } = await supabase
    .from("quiz_attempts")
    .select("*")
    .eq("quiz_id", id)
    .eq("user_id", userId)
    .order("completed_at", { ascending: false });

  return NextResponse.json({
    quiz,
    questions: questions ?? [],
    attempts: attempts ?? [],
  });
}

// POST /api/quiz/[id] — submit answers for grading
// body: { answers: Array<{ question_id: string, user_answer: string }> }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { answers } = await request.json();

  if (!answers || !Array.isArray(answers)) {
    return NextResponse.json(
      { error: "answers array is required" },
      { status: 400 }
    );
  }

  // Fetch quiz + questions
  const { data: quiz } = await supabase
    .from("quizzes")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (!quiz) {
    return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
  }

  const { data: questions } = await supabase
    .from("quiz_questions")
    .select("*")
    .eq("quiz_id", id)
    .order("question_number", { ascending: true });

  if (!questions || questions.length === 0) {
    return NextResponse.json(
      { error: "No questions found" },
      { status: 404 }
    );
  }

  // Grade each answer
  const gradedAnswers: Array<{
    question_id: string;
    user_answer: string;
    is_correct: boolean;
    correct_answer: string;
    explanation: string;
    ai_feedback?: string;
  }> = [];

  let score = 0;

  for (const question of questions) {
    const userAnswer = answers.find(
      (a: { question_id: string }) => a.question_id === question.id
    );
    const userAnswerText = userAnswer?.user_answer?.trim() || "";

    if (question.question_type === "multiple_choice") {
      // Simple exact match for MC (compare first letter)
      const userLetter = userAnswerText.charAt(0).toUpperCase();
      const correctLetter = question.correct_answer.charAt(0).toUpperCase();
      const isCorrect = userLetter === correctLetter;

      if (isCorrect) score++;

      gradedAnswers.push({
        question_id: question.id,
        user_answer: userAnswerText,
        is_correct: isCorrect,
        correct_answer: question.correct_answer,
        explanation: question.explanation,
      });
    } else {
      // Open-ended — use AI to grade
      let isCorrect = false;
      let aiFeedback = "";

      if (userAnswerText.length > 0) {
        try {
          const gradeResponse = await client.messages.create({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 256,
            system:
              "You are a fair but encouraging quiz grader. Grade the student's answer and give brief feedback. Return ONLY valid JSON with no markdown.",
            messages: [
              {
                role: "user",
                content: `Question: ${question.question_text}
Expected answer: ${question.correct_answer}
Student's answer: ${userAnswerText}

Grade this answer. Return JSON:
{"is_correct": true/false, "feedback": "Brief encouraging feedback explaining why it's right/wrong and what the correct answer includes"}`,
              },
            ],
          });

          const gradeText =
            gradeResponse.content[0].type === "text"
              ? gradeResponse.content[0].text
              : "{}";

          try {
            const cleaned = gradeText
              .replace(/```json\s*/g, "")
              .replace(/```\s*/g, "")
              .trim();
            const gradeData = JSON.parse(cleaned);
            isCorrect = gradeData.is_correct === true;
            aiFeedback = gradeData.feedback || "";
          } catch {
            // Fallback: simple keyword match
            const answerWords = question.correct_answer
              .toLowerCase()
              .split(" ");
            const matchCount = answerWords.filter((w: string) =>
              userAnswerText.toLowerCase().includes(w)
            ).length;
            isCorrect = matchCount / answerWords.length > 0.5;
            aiFeedback = "Could not grade automatically.";
          }
        } catch {
          aiFeedback = "Grading unavailable — check the explanation.";
        }
      }

      if (isCorrect) score++;

      gradedAnswers.push({
        question_id: question.id,
        user_answer: userAnswerText,
        is_correct: isCorrect,
        correct_answer: question.correct_answer,
        explanation: question.explanation,
        ai_feedback: aiFeedback,
      });
    }
  }

  const total = questions.length;
  const percentage = Math.round((score / total) * 100);

  // Save attempt
  const { data: attempt, error: attemptError } = await supabase
    .from("quiz_attempts")
    .insert({
      quiz_id: id,
      user_id: userId,
      score,
      total,
      percentage,
      answers: gradedAnswers,
    })
    .select()
    .single();

  if (attemptError) {
    return NextResponse.json(
      { error: attemptError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    attempt,
    gradedAnswers,
    score,
    total,
    percentage,
  });
}
