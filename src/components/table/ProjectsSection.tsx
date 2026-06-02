import ClimbTable from './ClimbTable';
import type { Climb } from './types';

interface Props {
  initialProjects: Climb[];
  isAdmin: boolean;
}

export default function ProjectsSection({ initialProjects, isAdmin }: Props) {
  const sendToBouldering = async (climb: Climb) => {
    const today = new Date().toISOString().slice(0, 10);
    if (!confirm(`Move "${climb.name}" to the bouldering log?\n\nDate will be set to today (${today}).`)) throw new Error('cancelled');

    const res = await fetch('/api/bouldering');
    if (!res.ok) throw new Error('Failed to fetch bouldering log');
    const current: Climb[] = await res.json();

    const tags = climb.tags.includes('project') ? climb.tags : [...climb.tags, 'project'];
    const sent = { ...climb, date: today, tags };
    const postRes = await fetch('/api/bouldering', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([...current, sent]),
    });
    if (!postRes.ok) throw new Error(await postRes.text());
  };

  return (
    <ClimbTable
      initialClimbs={initialProjects}
      isAdmin={isAdmin}
      dataKey="projects"
      onSendClimb={sendToBouldering}
    />
  );
}
