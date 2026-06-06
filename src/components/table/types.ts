export interface Climb {
  id: string;
  name: string;
  grade: string;
  tags: string[];
  mediaUrl: string;
  notes: string;
  date: string;
}

export const GRADES = [
  'VB', 'V0', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8',
  'V9', 'V10', 'V11', 'V12', 'V13', 'V14', 'V15', 'V16', 'V17',
];

export const PRESET_TAGS = [
  'crimp', 'sloper', 'pinch', 'pocket', 'undercling', // hold types
  'dyno', 'static', // movement
  'heel hook', 'toe hook', 'deadpoint', // techniques
  'endurance', 'power', 'routing', 'technique', 'footwork', // requirements
  'dihedral', 'arete', 'overhang', 'slab', // terrain types
  'flash', 'project', // personal status on boulders
];

export function emptyClimb(): Climb {
  return {
    id: crypto.randomUUID(),
    name: '',
    grade: 'V0',
    tags: [],
    mediaUrl: '',
    notes: '',
    date: new Date().toISOString().slice(0, 10),
  };
}
