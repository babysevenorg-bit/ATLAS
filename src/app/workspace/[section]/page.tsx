import { notFound } from "next/navigation";
import Workspace from "@/components/Workspace";
import { getUser } from "@/lib/auth";
import { getPublishedLessons, getUserProgress } from "@/lib/learning";

export const dynamic = "force-dynamic";

const allowed = [
  "dashboard",
  "academy",
  "trading-lab",
  "risk-lab",
  "backtest",
  "monte-carlo",
  "skill-universe",
  "analytics",
  "onboarding",
  "binary-lab",
  "revision",
  "coach",
  "progress",
  "studio",
  "profile"
];

export default async function WorkspacePage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!allowed.includes(section)) notFound();

  const user = await getUser();
  const [lessons, records] = await Promise.all([
    getPublishedLessons(),
    user ? getUserProgress(user.id) : Promise.resolve([])
  ]);

  return (
    <Workspace
      initialSection={section}
      lessons={lessons}
      initialCompleted={records.filter(record => record.completed).map(record => record.lessonId)}
      user={user}
    />
  );
}
