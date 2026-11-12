// Usage:  npm run images -- YOUR_PEXELS_API_KEY     (free key: https://www.pexels.com/api/)
// With a key it searches Pexels for each dish name and saves the top result (best match).
// Without a key it falls back to random keyword photos (often wrong - for testing only).
import fs from 'node:fs';
const menu = JSON.parse(fs.readFileSync('data/menu.json', 'utf8'));
const key = process.argv[2] || process.env.PEXELS_API_KEY;
fs.mkdirSync('public/images', { recursive: true });
console.log(key ? 'Using Pexels API (best matches)' : 'No key given: using random keyword photos (may not match dishes)');
for (const d of menu) {
  const file = `public/images/${d.id}.jpg`;
  if (fs.existsSync(file) && fs.statSync(file).size > 5000) { console.log('skip', d.id); continue; }
  try {
    const q = d.query || d.name; let url;
    if (key) {
      const r = await fetch(`https://api.pexels.com/v1/search?per_page=1&orientation=landscape&query=${encodeURIComponent(q)}`, { headers: { Authorization: key } });
      if (!r.ok) throw new Error('API ' + r.status);
      url = (await r.json()).photos?.[0]?.src?.large; if (!url) throw new Error('no result');
    } else url = `https://loremflickr.com/800/600/${encodeURIComponent(q.split(' ').slice(-2).join(','))}`;
    const img = await fetch(url, { redirect: 'follow' }); if (!img.ok) throw new Error('download ' + img.status);
    fs.writeFileSync(file, Buffer.from(await img.arrayBuffer())); console.log('ok  ', d.id);
  } catch (e) { console.log('FAIL', d.id, e.message); }
  await new Promise((r) => setTimeout(r, 300));
}
console.log('Done. Delete any wrong image and re-run to fetch it again, or replace it with your own photo.');
