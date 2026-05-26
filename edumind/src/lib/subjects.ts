// Subjects shown in the in-app sidebar / dashboard subject grid.
// Scoped to the JEE and NEET syllabi.
//
//   JEE (PCM) = Physics + Chemistry + Mathematics
//   NEET (PCB) = Physics + Chemistry + Biology
//
// Physics and Chemistry are shared between both tracks.
// `track` is informational — consumers may use it to group/label by track,
// but existing consumers only read `name` and `emoji` and continue to work
// unchanged.
export const SUBJECTS = [
  { name: "Physics", emoji: "⚛️", track: "shared" },
  { name: "Chemistry", emoji: "🧪", track: "shared" },
  { name: "Mathematics", emoji: "🔢", track: "jee" },
  { name: "Biology", emoji: "🧬", track: "neet" },
] as const;

export type SubjectName = (typeof SUBJECTS)[number]["name"];
export type SubjectTrack = (typeof SUBJECTS)[number]["track"];
