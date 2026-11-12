import { Flame } from 'lucide-react';
export default function Spice({ level }: { level: number }) {
  return (<span className="inline-flex items-center gap-0.5 text-xs text-taupe" title={`Spice level ${level}/5`}>{[1, 2, 3, 4, 5].map((n) => <Flame key={n} size={13} className={n <= level ? 'text-gold' : 'text-taupe/30'} />)}</span>);
}
