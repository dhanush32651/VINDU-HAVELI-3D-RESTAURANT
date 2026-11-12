import { Phone, MapPin, Clock, Mail } from 'lucide-react';
export default function Contact() {
  const rows: [React.ElementType, string, string?][] = [[Phone, '+91 80195 85772', 'tel:+918019585772'], [Mail, 'reserve@vinduhaveli.example'], [MapPin, 'Vindu Haveli, [Your street, city, PIN]'], [Clock, 'Daily 11:00 AM – 11:30 PM']];
  return (
    <main className="section pt-28">
      <h1 className="font-serif text-4xl md:text-6xl gold-text">Contact & Location</h1>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <ul className="panel space-y-5 p-8">{rows.map(([I, t, h]) => <li key={t} className="flex items-center gap-3"><I size={18} className="text-gold" />{h ? <a href={h} className="hover:text-champagne">{t}</a> : t}</li>)}
          <li><a href="tel:+918019585772" className="btn-gold">Call to Reserve</a></li></ul>
        {/* Replace the q= value with your exact address */}
        <iframe title="Map" className="h-80 w-full rounded-2xl border border-gold/20" loading="lazy" src="https://www.google.com/maps?q=Markapur,Andhra+Pradesh&output=embed" />
      </div>
    </main>
  );
}
