import Workspace from "@/components/Workspace";
import { getUser } from "@/lib/auth";
import { getPublishedLessons, getUserProgress } from "@/lib/learning";

export const dynamic = "force-dynamic";
export default async function HomePage() {
  const user = await getUser();
  const [lessons, records] = await Promise.all([getPublishedLessons(), user ? getUserProgress(user.id) : Promise.resolve([])]);
  return <Workspace initialSection="dashboard" lessons={lessons} initialCompleted={records.filter(record => record.completed).map(record => record.lessonId)} user={user}/>;
}
