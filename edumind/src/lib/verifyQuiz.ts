import Anthropic from "@anthropic-ai/sdk";

// Independent verification pass for generated quiz questions. The
// generator (Haiku) occasionally produces structurally-flawed questions
// that no prompt rule fully prevents: answer disagreeing with the worked
// solution, two multiple-choice options that are the same value, or an
// impossible/ambiguous premise. This is the last line of defense before
// a question reaches a student.
//
// We use Sonnet here (not Haiku) — the checker benefits from stronger
// reasoning even though the generator stays on Haiku. One batched call
// verifies the whole quiz at once.

const client = new Anthropic();

const VERIFY_TIMEOUT_MS = 25_000;

// Normalized shape both quiz routes map into before verifying. (The two
// routes use different field names — question vs question_text etc. —
// so each normalizes to this before calling.)
export interface VerifiableQuestion {
  question: string;
  type: string; // multiple_choice | true_false | fill_blank | open_ended
  options: string[];
  correct_answer: string;
  explanation: string;
}

export interface Verdict {
  index: number;
  valid: boolean;
  reason?: string;
}

const VERIFIER_SYSTEM = `You are a meticulous quiz checker for Indian JEE and NEET exam preparation. You receive generated quiz questions and rigorously verify each one is correct and well-formed. You are the last line of defense before a question reaches a student — be strict, and when in doubt, mark a question invalid. Respond with ONLY a raw JSON array. No markdown, no backticks, no prose.`;

function buildVerifierPrompt(questions: VerifiableQuestion[]): string {
  return `Verify each of these ${questions.length} quiz questions. Work independently on EACH question and apply ALL of these checks:

1. SOLVE FROM SCRATCH. Solve the question yourself, ignoring the provided correct_answer. Then confirm the provided "correct_answer" matches your own independent solution. If they disagree, the question is INVALID.

2. MULTIPLE-CHOICE INTEGRITY (apply only to multiple_choice questions). Confirm EXACTLY ONE option is correct. Confirm NO TWO options are algebraically or semantically equivalent — for example "d(√2−1)" and "d/(1+√2)" are the SAME value, so a question offering both is INVALID (two correct options). Confirm the correct_answer unambiguously identifies exactly one option. Note: correct_answer may be the full option text OR a letter label like "A"/"B"/"C"/"D" — both forms are acceptable as long as they point to exactly one option.

3. PREMISE VALIDITY. Confirm the question is solvable, internally consistent, and unambiguous. It is INVALID if the premise is impossible, self-contradictory, missing required information, or only answerable by reinterpreting what was asked.

Return ONLY a JSON array with one object per question, in the same order, 0-indexed:
[{"index": 0, "valid": true}, {"index": 1, "valid": false, "reason": "two options equal the same value"}]

Set "valid": false if ANY check fails. Include a short "reason" only when invalid.

Questions to verify:
${JSON.stringify(questions, null, 2)}`;
}

/**
 * Verify a batch of quiz questions. Returns one Verdict per question
 * (by index). Throws on hard failure (timeout / parse error / API error)
 * — callers MUST catch and fall back to the unverified set so a checker
 * outage never crashes quiz generation.
 */
export async function verifyQuizQuestions(
  questions: VerifiableQuestion[]
): Promise<Verdict[]> {
  if (questions.length === 0) return [];

  const apiCall = client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    system: VERIFIER_SYSTEM,
    messages: [{ role: "user", content: buildVerifierPrompt(questions) }],
  });

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("VERIFY_TIMEOUT")), VERIFY_TIMEOUT_MS)
  );

  const response = await Promise.race([apiCall, timeoutPromise]);

  const text =
    response.content[0].type === "text" ? response.content[0].text : "[]";
  const cleaned = text
    .replace(/```json\s*/g, "")
    .replace(/```\s*/g, "")
    .trim();

  const verdicts = JSON.parse(cleaned);
  if (!Array.isArray(verdicts)) {
    throw new Error("Verifier returned a non-array response");
  }
  return verdicts as Verdict[];
}
