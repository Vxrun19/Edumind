export const SUBJECTS = [
  { name: "Math", emoji: "🔢" },
  { name: "Science", emoji: "🔬" },
  { name: "English", emoji: "📝" },
  { name: "History", emoji: "🏛️" },
  { name: "Coding", emoji: "💻" },
  { name: "Languages", emoji: "🌍" },
  { name: "Life Skills", emoji: "🧭" },
  { name: "Finance", emoji: "💰" },
  { name: "Health & Fitness", emoji: "💪" },
  { name: "Art & Music", emoji: "🎨" },
] as const;

export type SubjectName = (typeof SUBJECTS)[number]["name"];
