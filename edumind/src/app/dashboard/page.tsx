import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import type {
  Conversation,
  UserStreak,
  StudentProfile,
  Quiz,
  TrendingTopic,
} from "@/lib/supabase";
import {
  DashboardContent,
  DashboardRightPanelWrapper,
} from "@/components/dashboard/DashboardContent";
import AcademicLayout from "@/components/AcademicLayout";

interface Suggestion {
  topic: string;
  fromSubject: string | null;
  fromConversation: string;
}

export default async function DashboardPage() {
  const { userId } = await auth();

  let recentConversations: Conversation[] = [];
  let streakData: UserStreak | null = null;
  let profile: StudentProfile | null = null;
  let suggestions: Suggestion[] = [];
  let recentQuizzes: (Quiz & { best_score?: number })[] = [];
  let trendingTopics: TrendingTopic[] = [];

  if (userId) {
    // Single Promise.all for the dashboard's data dependencies. Dropped:
    // - assessment fetch (was passed through to DashboardContent but
    //   never rendered there)
    // - course_progress fetch (was driving the CircularProgress widget
    //   that referenced now-hidden courses — both the data flow and
    //   the widget have been removed)
    const [
      convosRes,
      streakRes,
      profileRes,
      quizzesRes,
      trendingRes,
    ] = await Promise.all([
      supabase
        .from("conversations")
        .select("*")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(5),
      supabase
        .from("user_streaks")
        .select("*")
        .eq("user_id", userId)
        .single(),
      supabase
        .from("student_profiles")
        .select("*")
        .eq("user_id", userId)
        .single(),
      supabase
        .from("quizzes")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(3),
      supabase
        .from("trending_cache")
        .select("topics")
        .order("generated_at", { ascending: false })
        .limit(1)
        .single(),
    ]);

    recentConversations = (convosRes.data as Conversation[]) ?? [];
    streakData = (streakRes.data as UserStreak) ?? null;
    profile = (profileRes.data as StudentProfile) ?? null;
    if (trendingRes.data?.topics) {
      trendingTopics = (trendingRes.data.topics as TrendingTopic[]).slice(0, 4);
    }

    // Best scores for the 3 most recent quizzes — feeds the "Recommended
    // Next" weak-quiz fallback in DashboardContent.
    const quizList = (quizzesRes.data as Quiz[]) ?? [];
    if (quizList.length > 0) {
      const { data: attempts } = await supabase
        .from("quiz_attempts")
        .select("quiz_id, percentage")
        .in("quiz_id", quizList.map((q) => q.id));

      recentQuizzes = quizList.map((q) => {
        const qAttempts = (attempts ?? []).filter((a) => a.quiz_id === q.id);
        return {
          ...q,
          best_score:
            qAttempts.length > 0
              ? Math.max(...qAttempts.map((a) => a.percentage))
              : undefined,
        };
      });
    }

    // Next-topic suggestions from recent conversations with stored
    // next_topics — drives the right panel "Suggested next" list.
    const { data: suggestConvos } = await supabase
      .from("conversations")
      .select("subject, title, next_topics")
      .eq("user_id", userId)
      .not("next_topics", "eq", "{}")
      .order("updated_at", { ascending: false })
      .limit(3);

    if (suggestConvos) {
      for (const convo of suggestConvos) {
        if (convo.next_topics && convo.next_topics.length > 0) {
          for (const topic of convo.next_topics) {
            if (suggestions.length < 3) {
              suggestions.push({
                topic,
                fromSubject: convo.subject,
                fromConversation: convo.title,
              });
            }
          }
        }
      }
    }
  }

  // Redirect new users to onboarding before showing the dashboard.
  if (!profile) {
    redirect("/onboarding");
  }

  const currentStreak = streakData?.current_streak ?? 0;
  const displayName = profile.display_name || "learner";

  const hour = new Date().getHours();
  const timeGreeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <AcademicLayout
      rightPanel={
        <DashboardRightPanelWrapper
          currentStreak={currentStreak}
          suggestions={suggestions}
        />
      }
    >
      <DashboardContent
        timeGreeting={timeGreeting}
        displayName={displayName}
        currentStreak={currentStreak}
        recentConversations={recentConversations}
        recentQuizzes={recentQuizzes}
        trendingTopics={trendingTopics}
      />
    </AcademicLayout>
  );
}
