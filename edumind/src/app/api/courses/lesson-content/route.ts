import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";
import type { StudentProfile, LearningAssessment } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { lessonTitle, courseName, courseSubject, lessonNumber, totalLessons } = await request.json();

    if (!lessonTitle || !courseName) {
      return NextResponse.json({ error: "lessonTitle and courseName required" }, { status: 400 });
    }

    // Load student profile + assessment for personalization
    let studentContext = "";
    const [profileRes, assessmentRes] = await Promise.all([
      supabase.from("student_profiles").select("*").eq("user_id", userId).single(),
      supabase.from("assessments").select("*").eq("user_id", userId).single(),
    ]);

    const profile = profileRes.data as StudentProfile | null;
    const assessment = assessmentRes.data as LearningAssessment | null;

    if (profile) {
      studentContext += `\nStudent profile: ${profile.display_name}, age group ${profile.age_group}, learning style "${profile.learning_style}", level: ${profile.level}.`;
    }
    if (assessment) {
      studentContext += `\nLearner type: ${assessment.learner_type}. Attention span: ${assessment.cognitive_style?.attention_span || "medium"}. Personality: ${assessment.personality_words?.join(", ") || "unknown"}.`;
      if (assessment.learning_persona) {
        studentContext += ` Learning persona: ${assessment.learning_persona}.`;
      }
    }

    const systemPrompt = `You are EduMind, a world-class AI tutor creating structured lesson content. Generate clear, engaging, educational lessons that feel like they were written by the best teacher in the world. Always be encouraging and make learning feel achievable.${studentContext}`;

    const userPrompt = `Generate a structured lesson for: "${lessonTitle}" in the course "${courseName}" (Subject: ${courseSubject}). This is lesson ${lessonNumber} of ${totalLessons}.

Include ALL of the following sections, formatted with markdown headers:

## Introduction
A warm, engaging introduction (2-3 paragraphs) that explains the topic clearly. Use simple language, real-world connections, and analogies where helpful.

## Core Concepts
The main content of the lesson (3-4 paragraphs). Break down the key ideas with clear explanations. Use bullet points and numbered lists where appropriate.

## Practical Examples
2-3 concrete, practical examples that demonstrate the concepts. Use code blocks for programming topics, or step-by-step walkthroughs for other subjects.

## Key Takeaways
A summary box with 3-5 key points the student should remember from this lesson.

## Practice Exercises
2 practice exercises for the student to try:
1. A simpler exercise to check basic understanding
2. A slightly more challenging exercise to deepen understanding

Include hints for each exercise.

Make the content feel conversational and encouraging. Use emojis sparingly for visual breaks. Adapt the complexity based on the course difficulty level.`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";

    return NextResponse.json({ content: text });
  } catch (error) {
    console.error("Lesson content generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate lesson content. Please try again." },
      { status: 500 }
    );
  }
}
