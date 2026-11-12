export default function VegMark({ veg }: { veg: boolean }) {
  const c = veg ? 'border-green-600' : 'border-red-600'; const d = veg ? 'bg-green-600' : 'bg-red-600';
  return (<span title={veg ? 'Vegetarian' : 'Non-vegetarian'} className={`grid h-4 w-4 place-items-center rounded-[3px] border-2 bg-white ${c}`}><span className={`h-2 w-2 rounded-full ${d}`} /></span>);
}
