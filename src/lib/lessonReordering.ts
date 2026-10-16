// Personalised lesson reordering based on the user's learning style.
// Used by the Academy dashboard to surface lessons in an order that
// matches the learner's preferred modality.

import type { Lesson } from "@/lib/curriculum";

// Priority order of lesson categories per learning style.
// Lower number = appears earlier in the recommended sequence.
const STYLE_PRIORITIES: Record<string, Record<string, number>> = {
  // Visual learners benefit from chart-heavy content first
  visual: {
    "Technical Analysis": 1,
    "Reading the market": 2,
    "Forex foundations": 3,
    "Forex Foundations": 3,
    "Risk management": 4,
    "Risk Management": 4,
    "Trading Psychology": 5,
    "Binary Options": 6,
  },
  // Hands-on learners jump to simulators and interactive exercises
  interactive: {
    "Risk management": 1,
    "Risk Management": 1,
    "Reading the market": 2,
    "Technical Analysis": 3,
    "Binary Options": 4,
    "Forex foundations": 5,
    "Forex Foundations": 5,
    "Trading Psychology": 6,
  },
  // Readers prefer theory-first, then application
  reading: {
    "Forex foundations": 1,
    "Forex Foundations": 1,
    "Risk management": 2,
    "Risk Management": 2,
    "Trading Psychology": 3,
    "Technical Analysis": 4,
    "Reading the market": 5,
    "Binary Options": 6,
  },
  // Mixed = default sort order (no reordering)
  mixed: {},
};

export function reorderLessonsByStyle(
  lessons: Lesson[],
  learningStyle: string
): Lesson[] {
  const priorities = STYLE_PRIORITIES[learningStyle] || {};
  if (Object.keys(priorities).length === 0) {
    // Default: keep original order
    return lessons;
  }
  return [...lessons].sort((a, b) => {
    const pa = priorities[a.category] ?? 99;
    const pb = priorities[b.category] ?? 99;
    if (pa !== pb) return pa - pb;
    // Within the same category, preserve original order
    return a.order - b.order;
  });
}

// Helper: describe the reordering logic to the learner (for the UI)
export function describeStyleReorder(learningStyle: string): string | null {
  switch (learningStyle) {
    case "visual":
      return "Visual learner — chart-heavy Technical Analysis lessons are surfaced first.";
    case "interactive":
      return "Hands-on learner — Risk Management labs and simulator exercises appear earlier.";
    case "reading":
      return "Reader & writer — Forex Foundations theory lessons prioritised first.";
    default:
      return null;
  }
}
