import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";
import type { StudentProfile } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { messages, lessonTitle, courseName, lessonContent } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "messages array required" }, { status: 400 });
    }

    // Load student profile
    let studentContext = "";
    const { data: profile } = await supabase
      .from("student_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (profile) {
      const p = profile as StudentProfile;
      studentContext = ` The student's name is ${p.display_name}, age group ${p.age_group}, learning style "${p.learning_style}", level: ${p.level}.`;
    }

    const systemPrompt = `You are EduMind, an encouraging AI tutor helping a student with questions about a specific lesson.${studentContext}

LESSON CONTEXT:
- Course: ${courseName}
- Lesson: ${lessonTitle}
${lessonContent ? `\nLESSON CONTENT SUMMARY (use this to answer questions accurately):\n${lessonContent.substring(0, 2000)}` : ""}

Rules:
- Answer questions specifically about this lesson's topic
- Be encouraging and patient
- Use examples and analogies
- If the question is unrelated to the lesson, gently redirect
- Keep responses concise (2-4 paragraphs max)
- Always end with an encouraging note or follow-up question`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map((msg: { role: string; content: string }) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    return NextResponse.json({ response: text });
  } catch (error) {
    console.error("Course chat error:", error);
    return NextResponse.json(
      { error: "Failed to get a response. Please try again." },
      { status: 500 }
    );
  }
}
