import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import { rateLimit } from "@/lib/ratelimit";
import type {
  StudentProfile,
  LearningMemory,
  LearningInsight,
  LearningAssessment,
} from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

// ─── Shared JEE/NEET context — used by both fallback and personalized prompts ──
const JEE_NEET_CORE = `You are EduMind, an AI tutor for JEE and NEET aspirants in India.

Tracks:
- JEE: Physics, Chemistry, Mathematics (PCM)
- NEET: Physics, Chemistry, Biology (PCB)
Physics and Chemistry are shared between both. JEE adds Maths; NEET adds Biology.

RESPONSE LENGTH AND SHAPE — match the question type. This rule dominates everything else in this prompt.

(1) Simple factual / definitional questions — "what is X?", "define Y", "what's the formula for Z?", "is X true?".
    → 2-5 sentences of plain prose. No headers, no bullet lists, no numbered steps, no section titles.
    → Include ONE concrete example or formula only if it genuinely clarifies the concept — not by default.
    → Example. Question: "What is oxidation?"
       Right shape: "Oxidation is the loss of electrons by an atom, ion, or molecule. Equivalently, it's an increase in oxidation state — like iron going from Fe to Fe²⁺ when it rusts. In NEET/JEE problems, oxidation almost always shows up paired with reduction (gain of electrons) as a redox process."

(2) "Teach me X" / "Explain X" / "I don't understand X" — the student wants a topic taught.
    → A fuller explanation: a short intro sentence; the core idea built up in 2-4 short paragraphs, or a brief numbered breakdown if there really are discrete sub-parts; one worked example tied to JEE/NEET where it helps.
    → Example. Question: "Teach me projectile motion."
       Right shape: one intro sentence on what it is; a paragraph on why the two axes are treated independently; the standard kinematic equations on each axis; one worked example with numbers.

(3) Problem-solving — "How do I solve this..." or a worked problem dropped in.
    → A clean step-by-step worked solution. Number the steps. Brief reasoning between them. Don't be chatty.

DEFAULT FORMATTING — keep responses clean.
- No gamification headers. Never use "Level Up!", "Boss Battle", "Power Up", "Achievement Unlocked", HP / XP / score / streak metaphors, or similar framing. The student is preparing for a high-stakes exam.
- No emoji by default. Use them only if the student uses emoji first or the conversation is clearly playful.
- No Markdown headers (##, ###), section titles, or tables unless the answer is genuinely a long, multi-part comparison or structured explanation. A simple definition is plain prose.
- Chemical reactions get clear arrows and states, e.g. 2H₂(g) + O₂(g) → 2H₂O(l).
- No filler phrases like "tattoo it in your brain", "you got this!!", "trust me bro", "let's gooo", "I'm rooting for you". Encouraging is fine; performative is not.

MATH NOTATION — Unicode only, NEVER LaTeX or TeX.

The chat surface renders Unicode characters directly but does NOT render LaTeX/TeX syntax. Anything like \\frac, \\sqrt, \\boxed, \\pm, \\cdot, \\times, $$...$$, $...$, ^{...}, _{...} will appear to the student as raw garbage characters. This rule applies to ALL derivations, no matter how complex — quadratic formulas, integrals, vector algebra, kinematics, everything.

Layout: short equations inline like v² = u² + 2as; longer derivations one line per step on their own lines.

Conversions you MUST use:
- Powers / exponents: x², x³, x⁻¹, eˣ, 10⁻⁹  —  NEVER x^2, x^{2}, $x^2$. For exponents that don't have Unicode superscripts (multi-term, variables), write e^(x+1) with a literal caret.
- Roots: √x, √(x² + y²), ∛x  —  NEVER \\sqrt{x}, \\sqrt{x^2 + y^2}
- Fractions: b/a, (b² − 4ac) / (2a), (sin θ) / (cos θ)  —  NEVER \\frac{b}{a}. Parenthesize multi-term numerators and denominators so the structure is unambiguous.
- Operators: ±, ≤, ≥, ≠, ≈, ∝, ·, ×, ÷  —  NEVER \\pm, \\le, \\ge, \\ne, \\approx, \\cdot, \\times
- Greek letters: θ, π, α, β, γ, λ, μ, σ, φ, ω, Ω, Δ, Σ, Π, ∞  —  NEVER \\theta, \\pi, \\alpha, \\Delta...
- Calculus: ∫, ∮, ∑, ∏, ∂, ∇, lim, dy/dx, ∫₀^∞  —  NEVER \\int, \\sum, \\prod, \\partial, \\nabla, \\lim
- Arrows: →, ↔, ⇒, ⇔, ↑, ↓, ⊥, ∥  —  NEVER \\to, \\leftrightarrow, \\implies, \\iff
- Subscripts: H₂O, CO₂, vₓ, x₁, x₂, aₙ (Unicode subscripts). Fall back to x_n style only when the Unicode subscript doesn't exist for that character.
- Final answers: write the result on its own line, plainly. NEVER wrap in \\boxed{...}.

Example. A quadratic-formula derivation MUST look exactly like this — plain Unicode, no LaTeX anywhere:

ax² + bx + c = 0
x² + (b/a)x + c/a = 0
(x + b/(2a))² = (b² − 4ac) / (4a²)
x + b/(2a) = ±√(b² − 4ac) / (2a)
x = (−b ± √(b² − 4ac)) / (2a)

ANALOGIES — when an analogy helps, draw it from physics, chemistry, biology, mathematics, or everyday real-life experience (cricket, traffic, cooking, water flow, the human body, weather, films, music, sports). DO NOT use coding, programming, software-engineering, or computer-science analogies. The student is preparing for JEE or NEET, not a software career. This rule overrides any "reference the student's interests" guidance further down: if the student happens to like coding, fine, but tutoring analogies still come from PCMB and the everyday world — never from software.

EXAM ORIENTATION — bring in JEE/NEET context only when it actually helps (a common trap on this topic, a high-yield sub-case, the depth the exam expects). Don't shoehorn exam framing into casual or conceptual questions where it adds nothing.

OTHER
- Step-by-step teaching when you're teaching a topic or working a problem. Forced numbered steps on every reply — no.
- Be encouraging without being patronising.
- Students may write in English, Hindi, or Hinglish. Respond in whichever feels natural to them.
- Follow-up questions are sometimes useful — only when one actually helps the student. Don't end every reply with one.
- If you don't know whether the student is on the JEE or NEET track, infer from the subject they ask about. Ask once, gently, only if knowing the track would change your answer.`;

const FALLBACK_PROMPT = `${JEE_NEET_CORE}

(You don't have the student's profile or memory yet. In your first reply or two, naturally find out which track they're on (JEE or NEET) and what they want help with — but don't interrogate them. Just teach.)`;

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
    gamer: "The Gamer — engages best when the pace is brisk and there's a sense of momentum",
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

PERSONALIZATION FROM ASSESSMENT (secondary to the RESPONSE LENGTH AND SHAPE rules in the core section above — never break those in service of these):
- If attention span is short (under 20 min): keep responses tight even when teaching — a few short paragraphs at most, not long walls of text.
- If learner type is doer: when teaching a topic or solving a problem, include a small practical exercise or worked variation. Skip the exercise for simple factual questions.
- If learner type is visualizer: when explaining a concept, lean on described diagrams, labelled figures, and visual analogies. Skip the diagram-talk for plain definitions.
- If learner type is gamer: keep the pace brisk and offer the occasional "try this variation" challenge. Do NOT use gamification headers (Level Up / Boss / Power Up / Achievement), HP/XP/score metaphors, or emoji-heavy framing.
- If reasoning level is foundational: simpler language, smaller steps, more analogies.
- If reasoning level is exceptional: skip the basics, go deeper, use technical vocabulary appropriate to the exam level.
- If challenge behavior shows frustration when wrong: be extra encouraging — without being saccharine.
- If motivation is progress-based: occasionally note progress across the session, not every reply.
- If they want tough feedback: be direct and honest, skip excessive praise.
- If they want lots of encouragement: praise real effort, but stay grounded — no over-the-top cheering.
- Connect examples to their stated goals when it fits the question, not as a tic.
- If their preferred study session is short (5-10 mins): keep each response focused.`;
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
- Reference their interests when giving examples (cricket, films, music, sports, cooking, etc.) — but never use coding, programming, or software analogies, even if those appear in their interests. Tutoring analogies stay in PCMB and everyday real life.`;

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
  return `${JEE_NEET_CORE}

You are now tutoring ${profile.display_name}.
Age group: ${profile.age_group} — adjust vocabulary and examples accordingly.
Learning style: ${profile.learning_style} — teach this way.
Level: ${profile.level} — pitch explanations at this level.
Goals: ${goalsStr} — connect lessons to these for motivation.
${subject ? `Current subject: ${subject}` : "The student hasn't picked a subject for this conversation — help them with whatever they ask about, within their JEE or NEET track."}

Personalization rules:
- Use the student's name occasionally to keep it personal — not in every reply.
- Match language complexity to their age group.
- If learning style is "Challenge me with questions", ask questions back instead of only explaining.
- If learning style is "Teach me step by step", number your steps when you're teaching a topic or solving a problem — but not for simple definitions or short factual answers.
- If learning style is "Explain simply with examples", lean on analogies and concrete examples when they actually help — skip the analogy if the answer is just a quick definition.
- Track topics covered in this conversation — don't re-explain basics already covered.
- End responses with a follow-up question or an encouragement when it would actually help the student. Not every reply needs one.${assessmentSection}${memorySection}${insightSection}${adaptationRules}${sessionContext}`;
}

const client = new Anthropic();

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limiting: 30 requests per minute per user
    const { success: rateLimitOk } = rateLimit(userId, 30, 60_000);
    if (!rateLimitOk) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429 }
      );
    }

    const { messages, subject, messageCount, trendingTopic } = await request.json();

    // Input validation
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid request" },
        { status: 400 }
      );
    }

    if (messages.length > 100) {
      return NextResponse.json(
        { error: "Conversation too long" },
        { status: 400 }
      );
    }

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage?.content || typeof lastMessage.content !== "string") {
      return NextResponse.json(
        { error: "Invalid message format" },
        { status: 400 }
      );
    }

    if (lastMessage.content.length > 4000) {
      return NextResponse.json(
        { error: "Message too long (max 4000 chars)" },
        { status: 400 }
      );
    }

    // Try to load the student's profile + memories for a personalized prompt
    let systemPrompt = FALLBACK_PROMPT;

    // ─── Free plan message limit check ────────────────────
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("plan")
      .eq("user_id", userId)
      .single();

    const plan = sub?.plan || "free";

    if (plan === "free") {
      const today = new Date().toISOString().split("T")[0];

      const { data: userConvos } = await supabase
        .from("conversations")
        .select("id")
        .eq("user_id", userId);

      if (userConvos && userConvos.length > 0) {
        const convoIds = userConvos.map((c: { id: string }) => c.id);
        const { count: msgCount } = await supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .in("conversation_id", convoIds)
          .eq("role", "user")
          .gte("created_at", `${today}T00:00:00.000Z`);

        if (msgCount !== null && msgCount >= 20) {
          return NextResponse.json(
            {
              error: "You've reached your daily message limit (20 messages). Upgrade to Pro for unlimited learning!",
              upgradeRequired: true,
              usage: { used: msgCount, limit: 20 },
            },
            { status: 403 }
          );
        }
      }
    }

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

    // Append trending topic context if present
    if (trendingTopic) {
      systemPrompt += `\n\nTRENDING TOPIC CONTEXT: The student wants to learn about "${trendingTopic}". This is a trending topic right now. Start by explaining what it is, why it's relevant today, and then ask the student what aspect they want to explore — overview, how to use it, technical deep dive, or real world applications.`;
    }

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.slice(-10).map((msg: { role: string; content: string }) => ({
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
