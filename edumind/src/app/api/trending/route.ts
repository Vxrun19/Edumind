import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";
import type { TrendingTopic } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

const CACHE_DURATION_HOURS = 6;
const REFRESH_COOLDOWN_MINS = 30;

// In-memory fallback cache
let memoryCache: { topics: TrendingTopic[]; expires_at: string } | null = null;

async function getCachedTopics(): Promise<{
  topics: TrendingTopic[];
  generated_at: string;
} | null> {
  try {
    const { data } = await supabase
      .from("trending_cache")
      .select("*")
      .order("generated_at", { ascending: false })
      .limit(1)
      .single();

    if (data && new Date(data.expires_at) > new Date()) {
      return { topics: data.topics, generated_at: data.generated_at };
    }
  } catch {
    // Fall through to memory cache
  }

  // Check in-memory fallback
  if (memoryCache && new Date(memoryCache.expires_at) > new Date()) {
    return { topics: memoryCache.topics, generated_at: new Date().toISOString() };
  }

  return null;
}

async function canRefresh(): Promise<boolean> {
  try {
    const { data } = await supabase
      .from("trending_cache")
      .select("generated_at")
      .order("generated_at", { ascending: false })
      .limit(1)
      .single();

    if (data) {
      const lastGen = new Date(data.generated_at);
      const cooldownEnd = new Date(
        lastGen.getTime() + REFRESH_COOLDOWN_MINS * 60 * 1000
      );
      return new Date() > cooldownEnd;
    }
  } catch {
    // No cache exists, allow refresh
  }
  return true;
}

async function generateTopics(): Promise<TrendingTopic[]> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `Generate a JSON array of 20 currently trending topics that students would want to learn about as of today. Include topics from: AI tools (like Claude Code, new AI releases), coding tools, science discoveries, business trends, useful life skills, and viral educational topics. For each topic return: title, category, description (one sentence), trend_status (hot/rising/new), why_relevant (one sentence explaining why this matters right now), and difficulty (beginner/intermediate/advanced). Return only valid JSON, no other text.`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  // Extract JSON from the response (handle potential markdown code blocks)
  let jsonStr = text.trim();
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
  }

  const topics: TrendingTopic[] = JSON.parse(jsonStr);
  return topics;
}

async function cacheTopics(topics: TrendingTopic[]): Promise<void> {
  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + CACHE_DURATION_HOURS * 60 * 60 * 1000
  );

  // Save to in-memory cache as fallback
  memoryCache = { topics, expires_at: expiresAt.toISOString() };

  try {
    await supabase.from("trending_cache").insert({
      topics,
      generated_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    });
  } catch {
    // Memory cache is still set, so we're fine
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get("refresh") === "true";

    // Check for cached topics
    if (!forceRefresh) {
      const cached = await getCachedTopics();
      if (cached) {
        return NextResponse.json({
          topics: cached.topics,
          generated_at: cached.generated_at,
          cached: true,
        });
      }
    }

    // If force refresh, check cooldown
    if (forceRefresh) {
      const allowed = await canRefresh();
      if (!allowed) {
        // Return cached data with cooldown notice
        const cached = await getCachedTopics();
        if (cached) {
          return NextResponse.json({
            topics: cached.topics,
            generated_at: cached.generated_at,
            cached: true,
            cooldown: true,
            message: `Please wait ${REFRESH_COOLDOWN_MINS} minutes between refreshes.`,
          });
        }
      }
    }

    // Generate fresh topics
    const topics = await generateTopics();
    await cacheTopics(topics);

    return NextResponse.json({
      topics,
      generated_at: new Date().toISOString(),
      cached: false,
    });
  } catch (error) {
    console.error("Trending API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch trending topics." },
      { status: 500 }
    );
  }
}
