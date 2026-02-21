import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";
import type {
  StudentProfile,
  LearningMemory,
  LearningInsight,
  LearningAssessment,
} from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

const FALLBACK_PROMPT = `You are EduMind, a friendly and encouraging personal AI tutor. You can teach any subject - school topics, coding, real life skills, languages, anything. Adapt your explanation style to the student's level. If they seem to be a beginner, use simple language and analogies. Always encourage them and make learning feel fun and achievable. Ask follow-up questions to check understanding.`;

// ─── Build assessment section for system prompt ──────────
function buildAssessmentSection(assessment: LearningAssessment): string {
  const cogStyle = assessment.cognitive_style;
  const goals = assessment.goals;
  const challenge = assessment.challenge_behavior;
  const habits = assessment.study_habits;

  // Derive reasoning level label
  let reasoningLevel = "foundational";
  if (assessment.reasoning_score >= 4) reasoningLevel = "exceptional";
  else if (assessment.reasoning_score >= 3) reasoningLevel = "strong";
  else if (assessment.reasoning_score >= 2) reasoningLevel = "solid";

  // Build subject confidence lines
  const subjectLines = Object.entries(assessment.subject_levels)
    .map(([subj, level]) => `  ${subj}: ${level}%`)
    .join("\n");

  const learnerTypeLabels: Record<string, string> = {
    reader: "The Reader — learns through reading and notes",
    doer: "The Doer — learns by trying things hands-on",
    visualizer: "The Visualizer — needs diagrams and visual examples",
    talker: "The Talker — learns through discussion and questions",
    gamer: "The Gamer — learns best when it's fun and gamified",
    deep_diver: "The Deep Diver — wants to understand everything deeply",
  };

  return `

DEEP STUDENT ASSESSMENT RESULTS:
- Learner type: ${learnerTypeLabels[assessment.learner_type] || assessment.learner_type} — teach accordingly
- Cognitive style: Reading approach is "${cogStyle.reading_approach}", problem solving is "${cogStyle.problem_solving}", when confused they ${(cogStyle.confusion_strategies || []).join(", ")}
- Reasoning level: ${reasoningLevel} — adjust complexity accordingly
- Attention span: ${cogStyle.attention_span} — keep responses matching this length
- Subject confidence levels:
${subjectLines}
- Wants to improve most: ${assessment.subject_most_improve}
- Finds hardest: ${assessment.subject_hardest}
- Enjoys most: ${assessment.subject_most_enjoyed}
- Main goal: ${goals.main_goal} — always connect lessons to this
- Why they use EduMind: ${(goals.reasons || []).join(", ")}
- Daily study time: ${goals.daily_time}
- Challenge behavior: When wrong: "${challenge.wrong_answer_reaction}", when too easy: "${challenge.too_easy_reaction}", when too hard: "${challenge.too_hard_reaction}"
- Feedback preference: ${challenge.feedback_preference}
- Motivation type: ${assessment.motivation_type} — use this to encourage them
- Personality: ${assessment.personality_words.join(", ")} — match your tone to this
- Preferred study session: ${habits.session_length}
- Study times: ${(habits.study_times || []).join(", ")}
- Quiz attitude: ${habits.quiz_feeling}
${assessment.personal_note ? `- Personal note to tutor: ${assessment.personal_note}` : ""}

CRITICAL TEACHING RULES FROM ASSESSMENT:
- If attention span is short (under 20 min): never write more than 4-5 lines per response, use bullet points, ask questions frequently
- If learner type is doer: always include a practical exercise or challenge
- If learner type is visualizer: always use diagrams described in text, analogies, and visual examples
- If learner type is gamer: add challenges, points metaphors, and make it feel like a game
- If reasoning level is foundational: use very simple language, more analogies, smaller steps
- If reasoning level is exceptional: skip basics, go deeper, use technical terms
- If challenge behavior shows frustration when wrong: be extra encouraging, celebrate small wins
- If motivation is progress-based: frequently show them how far they've come
- If they want tough feedback: be direct and honest, skip excessive praise
- If they want lots of encouragement: praise effort, celebrate wins, stay positive
- Always connect examples to their stated goals and interests
- If their preferred session is short (5-10 mins): keep each response focused and concise`;
}

// ─── Build the full memory-enhanced system prompt ────────
function buildSystemPrompt(
  profile: StudentProfile,
  memories: LearningMemory[],
  insight: LearningInsight | null,
  assessment: LearningAssessment | null,
  subject: string | null,
  messageCount: number,
  daysSinceLastVisit: number | null
): string {
  const goalsStr =
    profile.goals.length > 0 ? profile.goals.join(", ") : "general learning";

  // ─── Categorize memories ───────────────────────────────
  const mastered = memories
    .filter((m) => m.memory_type === "topic_mastered")
    .map((m) => m.content);
  const struggling = memories
    .filter((m) => m.memory_type === "topic_struggling")
    .map((m) => m.content);
  const interests = memories
    .filter((m) => m.memory_type === "interest")
    .map((m) => m.content);
  const behaviors = memories
    .filter((m) => m.memory_type === "behavior")
    .map((m) => m.content);
  const corrections = memories
    .filter((m) => m.memory_type === "correction")
    .map((m) => m.content);
  const preferences = memories
    .filter((m) => m.memory_type === "preference")
    .map((m) => m.content);

  // ─── Build memory section ──────────────────────────────
  let memorySection = "";
  if (memories.length > 0) {
    memorySection = `

STUDENT MEMORY LOG (use this to personalize every response):
- Topics mastered: ${mastered.length > 0 ? mastered.join("; ") : "None recorded yet"}
- Topics they struggle with: ${struggling.length > 0 ? struggling.join("; ") : "None recorded yet"}
- Their interests: ${interests.length > 0 ? interests.join("; ") : "None recorded yet"}
- Behavior notes: ${behaviors.length > 0 ? behaviors.join("; ") : "None recorded yet"}
- Corrections they've made: ${corrections.length > 0 ? corrections.join("; ") : "None"}
- Preferences: ${preferences.length > 0 ? preferences.join("; ") : "None recorded yet"}`;
  }

  // ─── Build insights section ────────────────────────────
  let insightSection = "";
  if (insight) {
    insightSection = `
- Their attention span is ${insight.attention_span} — adjust response length accordingly
- They typically study in the ${insight.preferred_time_of_day}
- Their most active subject is ${insight.most_active_subject}
- Average session length: ${insight.avg_session_length} messages`;

    if (insight.response_style_feedback) {
      insightSection += `
- Response style note: ${insight.response_style_feedback}`;
    }
  }

  // ─── Behavior adaptation rules ─────────────────────────
  let adaptationRules = `

RULES BASED ON MEMORY:
- Never re-explain topics they've already mastered unless asked
- Be extra patient and use more examples for topics they struggle with
- Reference their interests when giving examples (e.g. if they love football, use football analogies)`;

  if (insight) {
    if (insight.attention_span === "short") {
      adaptationRules += `
- IMPORTANT: Student has short attention span — keep responses concise and punchy, use bullet points, max 3-4 short paragraphs`;
    } else if (insight.attention_span === "long") {
      adaptationRules += `
- Student handles depth well — go deeper with thorough explanations when appropriate`;
    }
  }

  // Check behavioral patterns from memories
  const asksForSimpler = preferences.some(
    (p) =>
      p.toLowerCase().includes("simpler") ||
      p.toLowerCase().includes("simple") ||
      p.toLowerCase().includes("easier")
  );
  const sendsShortReplies = behaviors.some(
    (b) =>
      b.toLowerCase().includes("short") ||
      b.toLowerCase().includes("brief") ||
      b.toLowerCase().includes("concise")
  );
  const sendsLongReplies = behaviors.some(
    (b) =>
      b.toLowerCase().includes("detailed") ||
      b.toLowerCase().includes("long") ||
      b.toLowerCase().includes("thorough")
  );
  const asksFollowUps = behaviors.some(
    (b) =>
      b.toLowerCase().includes("follow-up") ||
      b.toLowerCase().includes("curious") ||
      b.toLowerCase().includes("asks many")
  );

  if (asksForSimpler) {
    adaptationRules += `
- ADAPTATION: Student frequently asks for simpler explanations — permanently use simpler language, shorter sentences, more analogies`;
  }
  if (sendsShortReplies) {
    adaptationRules += `
- ADAPTATION: Student sends short replies — use shorter responses, ask more engaging questions to draw them out`;
  }
  if (sendsLongReplies) {
    adaptationRules += `
- ADAPTATION: Student sends detailed replies — they can handle depth, go deeper and more technical`;
  }
  if (asksFollowUps) {
    adaptationRules += `
- ADAPTATION: Student is naturally curious and asks follow-up questions — proactively offer interesting rabbit holes and "did you know" facts`;
  }

  adaptationRules += `
- If the student has been studying for 30+ messages in one session, gently suggest a break
- If the student seems confused about something you already covered, try a completely different approach (analogy, visual description, step-by-step)`;

  // ─── Session context rules ─────────────────────────────
  let sessionContext = "";
  if (messageCount >= 30) {
    sessionContext = `
SESSION NOTE: This conversation has ${messageCount} messages. The student has been studying for a while — consider gently suggesting a break soon.`;
  }

  if (daysSinceLastVisit !== null && daysSinceLastVisit >= 3) {
    sessionContext += `
RETURN VISIT: The student hasn't studied in ${daysSinceLastVisit} days. In your first response, briefly welcome them back and recap what they last learned (check the memory log above for context).`;
  }

  // ─── Assessment section ───────────────────────────────
  let assessmentSection = "";
  if (assessment) {
    assessmentSection = buildAssessmentSection(assessment);
  }

  // ─── Assemble the full prompt ──────────────────────────
  return `You are EduMind, a personal AI tutor for ${profile.display_name}.
Age group: ${profile.age_group} — adjust vocabulary and examples accordingly.
Learning style: ${profile.learning_style} — always teach this way.
Level: ${profile.level} — pitch explanations at this level.
Goals: ${goalsStr} — keep these in mind for motivation and context.
${subject ? `Current subject: ${subject}` : "Free chat — the student can ask about anything."}

Core rules:
- Always use the student's name occasionally to keep it personal
- Match your language complexity to their age group strictly
- If age is under 13, keep everything simple, fun, and encouraging — no complex jargon
- If learning style is "Challenge me with questions", ask questions back instead of just explaining
- If learning style is "Teach me step by step", always number your steps
- If learning style is "Explain simply with examples", always include a real-life analogy
- Always end responses with either a follow-up question OR an encouragement
- Track what topics have been covered in this conversation and don't repeat basics already explained
- You can teach any subject: school topics, coding, real life skills, languages, anything
- Make learning feel fun and achievable
- You are always up to date on trending topics in tech, AI, science, and culture. When teaching trending topics like new AI tools, coding frameworks, or current events, always include: what it is, why it matters right now, how to get started, and real examples of people using it.${assessmentSection}${memorySection}${insightSection}${adaptationRules}${sessionContext}`;
}

const client = new Anthropic();

export async function POST(request: NextRequest) {
  try {
    const { messages, subject, messageCount, trendingTopic } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "messages array is required" },
        { status: 400 }
      );
    }

    // Try to load the student's profile + memories for a personalized prompt
    let systemPrompt = FALLBACK_PROMPT;
    const { userId } = await auth();

    if (userId) {
      const [profileRes, memoriesRes, insightRes, streakRes, assessmentRes] =
        await Promise.all([
          supabase
            .from("student_profiles")
            .select("*")
            .eq("user_id", userId)
            .single(),
          supabase
            .from("learning_memory")
            .select("*")
            .eq("user_id", userId)
            .order("confidence_score", { ascending: false })
            .order("updated_at", { ascending: false })
            .limit(20),
          supabase
            .from("learning_insights")
            .select("*")
            .eq("user_id", userId)
            .single(),
          supabase
            .from("user_streaks")
            .select("last_study_date")
            .eq("user_id", userId)
            .single(),
          supabase
            .from("assessments")
            .select("*")
            .eq("user_id", userId)
            .single(),
        ]);

      if (profileRes.data) {
        // Calculate days since last visit
        let daysSinceLastVisit: number | null = null;
        if (streakRes.data?.last_study_date) {
          const lastDate = new Date(streakRes.data.last_study_date);
          const today = new Date();
          const diffMs = today.getTime() - lastDate.getTime();
          daysSinceLastVisit = Math.floor(diffMs / 86400000);
        }

        systemPrompt = buildSystemPrompt(
          profileRes.data as StudentProfile,
          (memoriesRes.data as LearningMemory[]) ?? [],
          (insightRes.data as LearningInsight) ?? null,
          (assessmentRes.data as LearningAssessment) ?? null,
          subject ?? null,
          messageCount ?? messages.length,
          daysSinceLastVisit
        );
      }
    }

    // Append trending topic context if present
    if (trendingTopic) {
      systemPrompt += `\n\nTRENDING TOPIC CONTEXT: The student wants to learn about "${trendingTopic}". This is a trending topic right now. Start by explaining what it is, why it's relevant today, and then ask the student what aspect they want to explore — overview, how to use it, technical deep dive, or real world applications.`;
    }

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map((msg: { role: string; content: string }) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    return NextResponse.json({ response: text });
  } catch (error) {
    console.error("Anthropic API error:", error);
    return NextResponse.json(
      { error: "Failed to get a response from the tutor. Please try again." },
      { status: 500 }
    );
  }
}
