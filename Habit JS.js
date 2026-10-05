const KEY = 'habithub.v1';
let habits = JSON.parse(localStorage.getItem(KEY) || '[]');

const $ = id => document.getElementById(id);
const fmt = d => d.toLocaleDateString('en-CA'); // YYYY-MM-DD
const esc = s => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const save = () => localStorage.setItem(KEY, JSON.stringify(habits));

const nocp = h => (h.checkpoints.length ? h.checkpoints : ['Done']);
const donecp = (h, date) => h.log[date] || [];
const complete = (h, date) => donecp(h, date).length === nocp(h).length;
const daysago = n => { const d = new Date(); d.setDate(d.getDate() - n); return d; };

function streak(h) {
  let n = complete(h, fmt(new Date())) ? 0 : 1;
  let count = 0;
  while (complete(h, fmt(daysago(n)))) { count++; n++; }
  return count;
}

function render() {
  const t = fmt(new Date());
  $('date').textContent = new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });

  let total = 0, done = 0;
  habits.forEach(h => { total += nocp(h).length; done += donecp(h, t).length; });
  const pct = total ? Math.round(done / total * 100) : 0;
  $('fill').style.width = pct + '%';
  $('pct').textContent = pct + '%';
  $('msg').textContent = !total ? "Add your first habit 👇" : pct === 100 ? "All done today! 🎉" : pct >= 50 ? "Over halfway, keep going 🔥" : "Let's get moving 💪";

  if (!habits.length) { $('list').innerHTML = '<p class="empty">No habits yet. Add one above!</p>'; return; }

  $('list').innerHTML = habits.map(h => {
    const s = nocp(h), d = donecp(h, t);
    const p = Math.round(d.length / s.length * 100);
    const st = streak(h);
    const week = [6,5,4,3,2,1,0].map(n => {
      const dt = daysago(n), key = fmt(dt);
      const cls = complete(h, key) ? 'ok' : donecp(h, key).length ? 'part' : '';
      return `<div class="day ${cls}">${dt.toLocaleDateString(undefined,{weekday:'narrow'})}<i></i></div>`;
    }).join('');

    return `<article class="card habit ${p === 100 ? 'done' : ''}" data-id="${h.id}">
      <div class="head">
        <div class="ring" style="--p:${p}"><span>${h.emoji}</span></div>
        <div class="info"><b>${esc(h.name)}</b><span class="streak">🔥 ${st} day streak · ${d.length}/${s.length} today</span></div>
        <button class="del" data-del title="Delete">✕</button>
      </div>
      <ul class="cps">${s.map((c, i) => `<li><label>
        <input type="checkbox" data-step="${i}" ${d.includes(i) ? 'checked' : ''}><span>${esc(c)}</span></label></li>`).join('')}</ul>
      <div class="week">${week}</div>
    </article>`;
  }).join('');
}

$('form').addEventListener('submit', e => {
  e.preventDefault();
  const name = $('name').value.trim();
  if (!name) return;
  const checkpoints = $('cps').value.split(',').map(x => x.trim()).filter(Boolean);
  habits.push({ id: Date.now(), name, emoji: $('emoji').value, checkpoints, log: {} });
  save(); e.target.reset(); render();
});

$('list').addEventListener('click', e => {
  const card = e.target.closest('.habit');
  if (!card) return;
  const h = habits.find(x => x.id == card.dataset.id);
  if (e.target.matches('[data-del]')) {
    if (confirm(`Delete "${h.name}"?`)) habits = habits.filter(x => x !== h);
  } else if (e.target.matches('[data-step]')) {
    const t = fmt(new Date()), i = +e.target.dataset.step;
    const d = new Set(donecp(h, t));
    e.target.checked ? d.add(i) : d.delete(i);
    h.log[t] = [...d];
  } else return;
  save(); render();
});

const applyTheme = th => { document.documentElement.dataset.theme = th; localStorage.setItem('habithub.theme', th); };
applyTheme(localStorage.getItem('habithub.theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
$('theme').onclick = () => applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');

render();
