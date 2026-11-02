/* thinking capsules: shared renderer for every page.
   The .txt files and the entry lines inside <pre id="data"> keep their plain format;
   this script turns them into the page layout. */
(function () {
  const root = document.documentElement;
  const ROOT = (document.currentScript.getAttribute('src') || '').replace(/tc\.js.*$/, '');
  const Q = new URLSearchParams(location.search);

  // theme: remembered per browser, follows the system otherwise
  try { const t = localStorage.getItem('tc-theme'); if (t) root.setAttribute('data-theme', t); } catch (e) {}

  const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
  const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const MOTIF = { note: 'ripple', archive: 'path', page: 'window' };

  // ---------- small helpers ----------
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const banner = (label, type) => `<div class="banner p-${MOTIF[type]}"><span class="tag">${esc(label)}</span></div>`;
  const chip = (href, label, ghost) => `<a class="chip${ghost ? ' ghost' : ''}" href="${href}">${esc(label)}</a>`;
  const nav = items => `<nav class="nav">${items.join('')}</nav>`;
  const pad = n => String(n).padStart(2, '0');

  let markOpen = false;
  function inline(line) {
    let p = esc(line);
    const seg = p.split('!!'); p = seg[0];
    for (let i = 1; i < seg.length; i++) { p += (markOpen ? '</mark>' : '<mark>') + seg[i]; markOpen = !markOpen; }
    p = p.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, t, u) => `<a href="${/^https?:/.test(u) ? u : ROOT + u}" target="_blank" rel="noopener">${t}</a>`);
    // *title* → italics (book titles, quoted phrases)
    return p.replace(/(^|[\s("“'])\*([^*\s][^*]*?)\*(?=[\s.,;:!?)"”']|$)/g, '$1<em>$2</em>');
  }
  const closeMark = h => markOpen ? h + '</mark>' : h;

  // ---------- page finishing: theme toggle, footer ----------
  function finish(card, opts) {
    opts = opts || {};
    if (!opts.noFooter) card.insertAdjacentHTML('beforeend', `<div class="footer">thinking capsules · one short note a day</div>`);
    const tt = document.createElement('button');
    tt.className = 'theme-toggle'; tt.type = 'button'; tt.setAttribute('aria-label', 'theme');
    card.prepend(tt);
    const cur = () => root.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const paint = () => { tt.textContent = cur() === 'dark' ? '☀' : '☾'; };
    paint();
    tt.onclick = () => {
      const n = cur() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', n); paint();
      try { localStorage.setItem('tc-theme', n); } catch (e) {}
    };
  }

  // ---------- entry lines ----------
  // ↳ <a href="(../)post.html?p=2026/20261101.txt">2026-11-01</a> Title <span class="counter">[305/365]</span>
  const ROW = /↳ <a href="[^"]*?post\.html\?p=((\d{4})\/(\d{4})(\d\d)(\d\d)\.txt)">[^<]*<\/a>\s*(.*?)\s*(?:<span class="counter">\[(\d+)\/(\d+)\]<\/span>)?\s*$/;
  function parseRows(lines) {
    const rows = [];
    for (const l of lines) {
      const m = l.match(ROW);
      if (!m) continue;
      rows.push({ path: m[1], href: ROOT + 'post.html?p=' + m[1], y: m[3], m: m[4], d: m[5], date: `${m[3]}-${m[4]}-${m[5]}`, title: m[6].replace(/<[^>]+>/g, '').trim(), n: m[7] || '' });
    }
    return rows;
  }
  const dataLines = (doc) => { const d = (doc || document).getElementById('data'); return d ? d.innerHTML.split('\n') : []; };
  const rowHTML = (r, full) => `<div class="lrow"><a href="${r.href}"><span class="ldate">${full ? r.date : r.m + '-' + r.d}</span><span class="ltitle">${r.title}</span></a>${r.n ? `<span class="count">${r.n}/365</span>` : ''}</div>`;
  const byMonth = rows => { const g = {}; rows.forEach(r => (g[r.m] = g[r.m] || []).push(r)); return g; };

  // ---------- months: one year's list, every month folded, the current one open ----------
  function monthsBlock(host, rows, year, current) {
    const g = byMonth(rows);
    const order = Object.keys(g).sort().reverse();
    const chips = `<div class="months">${MONTHS.map((n, i) => {
      const mm = pad(i + 1), cls = 'm' + (g[mm] ? '' : ' off') + (mm === current ? ' cur' : '');
      return g[mm] ? `<a class="${cls}" href="#${mm}" data-m="${mm}">${n.slice(0, 3)}</a>` : `<span class="${cls}">${n.slice(0, 3)}</span>`;
    }).join('')}</div>`;
    function draw(open, scroll) {
      host.innerHTML = chips + order.map(mm => `<details class="mon" id="${mm}"${mm === open ? ' open' : ''}><summary>${MONTHS[+mm - 1]} <span class="count">${g[mm].length}</span>${chip(`${ROOT}archive.html#${year}-${mm}`, 'archive', true)}</summary><div class="inner">${g[mm].map(r => rowHTML(r)).join('')}</div></details>`).join('');
      const t = scroll && document.getElementById(open);
      if (t) t.scrollIntoView();
    }
    // old links: #MM opens that month
    function fromHash(scroll) {
      const h = decodeURIComponent(location.hash.slice(1));
      if (g[h]) draw(h, scroll); else draw(current, false);
    }
    host.addEventListener('click', e => {
      const a = e.target.closest('[data-m]');
      if (a) { e.preventDefault(); history.replaceState(null, '', '#' + a.dataset.m); draw(a.dataset.m, true); }
    });
    window.addEventListener('hashchange', () => fromHash(true));
    fromHash(true);
  }
  function currentMonth(lines, rows) {
    for (const l of lines) { const m = l.match(/<a href="#(\d\d)"><mark>/); if (m) return m[1]; }
    return rows.length ? rows[0].m : '01';
  }

  // ---------- post.html: one .txt file ----------
  function parseNote(text, path) {
    const L = text.replace(/\r/g, '').replace(/\n+$/, '').split('\n');
    const first = (L.shift() || '').replace(/!!/g, '');
    const fm = first.match(/^(\d{4})_(\d\d)_(\d\d)\s*\|\s*(.*)$/);
    const note = { path, title: first, chips: [], body: [], n: '', prev: null, next: null };
    if (fm) { note.y = fm[1]; note.m = fm[2]; note.d = fm[3]; note.title = fm[4]; }
    else note.title = first.replace(/^thinking capsules\s*[—-]\s*/, '');
    while (L.length && (!L[0].trim() || /^↳ \[[^\]]+\]\([^)]+\)\s*$/.test(L[0]) && /back to/.test(L[0]))) {
      const m = L.shift().match(/^↳ \[([^\]]+)\]\(([^)]+)\)/);
      if (!m) continue;
      const u = m[2], yr = u.match(/^(\d{4})\/\d{4}_full-archive\.html/);
      note.chips.push(yr ? chip(`${ROOT}archive.html#${yr[1]}`, yr[1]) : chip(ROOT + u, u === 'index.html' ? 'index' : m[1].replace(/^back to\s*/, '')));
    }
    for (const l of L) {
      const c = l.match(/^\[(\d+)\/(\d+)\]\s*$/);
      if (c) { note.n = c[1]; continue; }
      if (/^<\s.*\|.*>\s*$/.test(l)) {
        const pv = l.match(/\[prev\]\(([^)]+)\)/), nx = l.match(/\[next\]\(([^)]+)\)/);
        note.prev = pv ? pv[1] : null; note.next = nx ? nx[1] : null; continue;
      }
      note.body.push(l);
    }
    while (note.body.length && !note.body[note.body.length - 1].trim()) note.body.pop();
    return note;
  }

  function bodyHTML(lines) {
    markOpen = false;
    let out = '', q = null, buf = [];
    const flushQ = () => { if (q) { out += `<div class="quote">${closeMark(q.join('\n'))}</div>`; q = null; } };
    const flushB = () => { while (buf.length && !buf[buf.length - 1].trim()) buf.pop(); if (buf.length) out += `<div class="text">${closeMark(buf.join('\n'))}</div>`; buf = []; };
    for (const l of lines) {
      if (l.startsWith('\\ ') || l === '\\') { flushB(); if (!q) q = []; q.push(inline(l.slice(2)) || ' '); continue; }
      if (q && !l.trim()) continue;
      flushQ();
      if (!buf.length && !l.trim()) continue;
      buf.push(inline(l));
    }
    flushB(); flushQ();
    return out;
  }

  const fileOf = href => { const m = href && href.match(/p=([^&#]+)/); return m ? m[1] : null; };
  const titleOf = path => fetch(ROOT + path).then(r => r.ok ? r.text() : '').then(t => { const m = t.match(/^\d{4}_\d\d_\d\d\s*\|\s*(.+)/); return m ? m[1].trim() : ''; }).catch(() => '');

  function post() {
    const card = document.getElementById('card');
    const file = Q.get('p');
    if (!file) { card.innerHTML = `<div class="loading">missing file.</div>`; finish(card); return; }
    // the about page is gone: its text is the bio on the home page
    if (file === 'about.txt') { location.replace(ROOT + 'index.html'); return; }
    card.innerHTML = `<div class="loading">loading…</div>`;
    fetch(ROOT + file).then(r => { if (!r.ok) throw new Error(); return r.text(); }).then(text => {
      const n = parseNote(text, file);
      let html;
      if (n.y) {
        const dt = new Date(+n.y, +n.m - 1, +n.d);
        const monthChip = chip(`${ROOT}archive.html#${n.y}-${n.m}`, MONTHS[+n.m - 1]);
        const chips = n.chips.filter(c => />index</.test(c)).concat(n.chips.filter(c => !/>index</.test(c)), monthChip);
        html = banner(`capsule ${n.n || ''}`.trim(), 'note') + nav(chips) +
          `<div class="ref">${DAYS[dt.getDay()]} ${+n.d} ${MONTHS[+n.m - 1]} ${n.y}${n.n ? ` · ${n.n}/365` : ''}</div><h1 class="title">${esc(n.title)}</h1>` +
          bodyHTML(n.body) + `<div class="meta" id="topics" hidden></div><div class="pn" id="pn"></div>`;
        document.title = n.title + ' · thinking capsules';
      } else {
        html = banner(n.title, 'page') + nav(n.chips) + `<div class="ref">thinking capsules</div><h1 class="title">${esc(n.title)}</h1>` + bodyHTML(n.body);
        document.title = n.title + ' · thinking capsules';
      }
      card.innerHTML = html;
      finish(card);
      if (!n.y) return;
      // prev / next with the title of the neighbouring day
      const pn = document.getElementById('pn');
      const btn = (cls, lab, href) => {
        const p = fileOf(href);
        const dm = p && p.match(/(\d{4})(\d\d)(\d\d)\.txt$/);
        // the button shows the date; it is left out when the day's file is missing or empty
        return titleOf(p).then(t => t && dm ? `<a class="${cls}" href="${ROOT}post.html?p=${p}"><span class="lab">${lab} · </span>${+dm[3]} ${MONTHS[+dm[2] - 1]}</a>` : '');
      };
      Promise.all([n.prev ? btn('prev', 'prev', n.prev) : '', n.next ? btn('next', 'next', n.next) : '']).then(([a, b]) => { pn.innerHTML = a + b; });
      // topics this note belongs to (read from the topic pages)
      topicList().then(tops => {
        const found = tops.filter(t => t.paths.has(file));
        if (!found.length) return;
        const el = document.getElementById('topics');
        el.innerHTML = 'topics: ' + found.map(t => `<a href="${ROOT}archive.html#${t.slug}">${esc(t.name)}</a>`).join(' · ');
        el.hidden = false;
      }).catch(() => {});
    }).catch(() => { card.innerHTML = `<div class="loading">error loading file.</div>`; finish(card); });
  }

  // ---------- topics, read from topics.html and the topic pages ----------
  let topicPromise = null;
  function topicList() {
    if (topicPromise) return topicPromise;
    topicPromise = fetch(ROOT + 'topics.html').then(r => r.text()).then(h => {
      const tops = [...h.matchAll(/<a href="topics\/([^"]+)\.html">([^<]+)<\/a>/g)];
      return Promise.all(tops.map(t => fetch(`${ROOT}topics/${t[1]}.html`).then(r => r.text()).catch(() => '').then(x => ({
        slug: t[1], name: t[2].replace(/&amp;/g, '&').toLowerCase(), paths: new Set([...x.matchAll(/post\.html\?p=(\d{4}\/\d{8}\.txt)/g)].map(m => m[1]))
      }))));
    });
    return topicPromise;
  }
  const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };

  // ---------- archive.html: every note, filtered by year, month or topic ----------
  // hash: #2026 a year, #2026-10 a month, #attention a topic, #topics the topic list, nothing = everything
  function archive() {
    const card = document.getElementById('card');
    card.innerHTML = `<div class="loading">loading…</div>`;
    Promise.all([allRows(), topicList()]).then(([rows, topics]) => {
      const years = [...new Set(rows.map(r => r.y))].sort().reverse();
      const latest = rows.find(r => r.date <= todayStr()) || rows[0] || {};
      const nOf = f => rows.filter(f).length;
      card.innerHTML = banner('archive', 'archive') + nav([chip(ROOT + 'index.html', 'index')]) +
        `<div class="ref">every note · ${rows.length}</div><h1 class="title">archive</h1>` +
        `<div class="filters"><select id="fy" aria-label="year"><option value="">year…</option>${years.map(y => `<option value="${y}">${y} (${nOf(r => r.y === y)})</option>`).join('')}</select>` +
        `<select id="fm" aria-label="month"></select>` +
        `<select id="ft" aria-label="topic"><option value="">topic…</option>${topics.map(t => `<option value="${t.slug}">${esc(t.name)} (${t.paths.size})</option>`).join('')}</select>` +
        `<button class="toggle" id="fall" type="button">show everything</button></div><div id="abody"></div>`;
      finish(card);
      const fy = card.querySelector('#fy'), fm = card.querySelector('#fm'), ft = card.querySelector('#ft'), all = card.querySelector('#fall'), body = card.querySelector('#abody');
      const monthOpts = y => {
        const ms = y ? [...new Set(rows.filter(r => r.y === y).map(r => r.m))].sort().reverse() : [];
        fm.innerHTML = `<option value="">month…</option>` + ms.map(m => `<option value="${m}">${MONTHS[+m - 1]} (${nOf(r => r.y === y && r.m === m)})</option>`).join('');
        fm.disabled = !y;
      };
      const yearHTML = y => {
        const g = byMonth(rows.filter(r => r.y === y));
        return `<section class="sec"><h2>${y} <span class="count">${nOf(r => r.y === y)}</span></h2>` +
          Object.keys(g).sort().reverse().map(m => `<details class="mon"${y === latest.y && m === latest.m ? ' open' : ''}><summary>${MONTHS[+m - 1]} <span class="count">${g[m].length}</span></summary><div class="inner">${g[m].map(r => rowHTML(r)).join('')}</div></details>`).join('') + '</section>';
      };
      function show(st, fromHash) {
        fy.value = st.y || ''; monthOpts(st.y); fm.value = st.m || ''; ft.value = st.t || '';
        all.classList.toggle('on', !st.y && !st.t && !st.topics);
        let h, hash = '';
        if (st.topics) {
          hash = 'topics';
          h = `<section class="sec"><h2>topics <span class="count">${topics.length}</span></h2><div class="guides">${topics.map(t => `<a class="grow" href="#${t.slug}"><span class="gname">${esc(t.name)}</span><span class="count">${t.paths.size} notes</span></a>`).join('')}</div></section>`;
        } else if (st.t) {
          const t = topics.find(x => x.slug === st.t), list = rows.filter(r => t.paths.has(r.path));
          hash = t.slug;
          h = `<section class="sec"><h2>${esc(t.name)} <span class="count">${list.length}</span></h2>${list.map(r => rowHTML(r, true)).join('')}</section>`;
        } else if (st.y && st.m) {
          const list = rows.filter(r => r.y === st.y && r.m === st.m);
          hash = `${st.y}-${st.m}`;
          h = `<section class="sec"><h2>${MONTHS[+st.m - 1]} ${st.y} <span class="count">${list.length}</span></h2>${list.map(r => rowHTML(r)).join('')}</section>`;
        } else {
          hash = st.y || '';
          h = (st.y ? [st.y] : years).map(yearHTML).join('');
        }
        body.innerHTML = h || `<div class="empty">nothing here yet</div>`;
        if (!fromHash) history.replaceState(null, '', hash ? '#' + hash : location.pathname + location.search);
      }
      function fromHash() {
        const h = decodeURIComponent(location.hash.slice(1)); let m;
        if (/^\d{4}$/.test(h) && years.includes(h)) show({ y: h }, true);
        else if ((m = h.match(/^(\d{4})-(\d\d)$/)) && years.includes(m[1])) show({ y: m[1], m: m[2] }, true);
        else if (h === 'topics') show({ topics: true }, true);
        else if (topics.some(t => t.slug === h)) show({ t: h }, true);
        else show({}, true);
      }
      fy.onchange = () => show({ y: fy.value });
      fm.onchange = () => show({ y: fy.value, m: fm.value });
      ft.onchange = () => show({ t: ft.value });
      all.onclick = () => show({});
      window.addEventListener('hashchange', fromHash);
      fromHash();
    }).catch(() => { card.innerHTML = `<div class="loading">error loading the archive.</div>`; finish(card); });
  }

  // ---------- every note of every year (for the searches) ----------
  let allPromise = null;
  function allRows() {
    if (allPromise) return allPromise;
    allPromise = fetch(ROOT + 'yearly-archives.html').then(r => r.text()).then(h => {
      const years = [...new Set([...h.matchAll(/<a href="(\d{4})\/\1_full-archive\.html">/g)].map(m => m[1]))];
      return Promise.all(years.map(y => fetch(`${ROOT}${y}/${y}_full-archive.html`).then(r => r.text()).catch(() => '')));
    }).then(pages => {
      const seen = new Set(), rows = [];
      pages.forEach(p => parseRows(p.split('\n')).forEach(r => { if (!seen.has(r.path)) { seen.add(r.path); rows.push(r); } }));
      return rows.sort((a, b) => b.path.localeCompare(a.path));
    });
    return allPromise;
  }
  let textPromise = null;
  const allTexts = () => textPromise || (textPromise = allRows().then(rows => Promise.all(rows.map(r => fetch(ROOT + r.path).then(x => x.text()).then(text => Object.assign({ text }, r)).catch(() => null))).then(a => a.filter(Boolean))));
  const cleanText = raw => raw.split('\n').filter(l => !/^(\d{4}_\d\d_\d\d \||↳ |\[\d+\/\d+\]|< )/.test(l)).join(' ')
    .replace(/!!/g, '').replace(/\\\s?/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/\*/g, '').replace(/\s+/g, ' ').trim();
  const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  function snippet(text, query) {
    const t = cleanText(text), at = t.toLowerCase().indexOf(query.toLowerCase());
    if (at === -1) return '';
    const s = Math.max(0, at - 40), e = Math.min(t.length, at + query.length + 40);
    return (s > 0 ? '…' : '') + esc(t.slice(s, e)).replace(new RegExp(escRe(esc(query)), 'ig'), m => `<mark>${m}</mark>`) + (e < t.length ? '…' : '');
  }

  function searchUI(box) {
    const $ = id => box.querySelector('#' + id);
    const setRes = (k, status, list) => {
      $(k + '-status').textContent = status;
      $(k + '-clear').style.display = status ? '' : 'none';
      $(k + '-list').innerHTML = list || '';
    };
    // by date: one day, or from–to
    const from = $('d-from'), to = $('d-to');
    allRows().then(rows => { if (!rows.length) return; from.min = to.min = rows[rows.length - 1].date; from.max = to.max = rows[0].date; });
    const byDate = () => {
      const a = from.value, b = to.value || from.value;
      if (!a && !b) return setRes('d', '');
      allRows().then(rows => {
        const lo = a || b, hi = b < lo ? lo : b;
        const hit = rows.filter(r => r.date >= lo && r.date <= hi);
        setRes('d', hit.length ? `${hit.length} ${hit.length === 1 ? 'note' : 'notes'}` : 'no notes on these dates', hit.map(r => rowHTML(r, true)).join(''));
      });
    };
    from.onchange = byDate; to.onchange = byDate;
    $('d-clear').onclick = e => { e.preventDefault(); from.value = to.value = ''; setRes('d', ''); };

    // by word
    const kw = $('k-input'); let kt = null;
    kw.oninput = () => {
      clearTimeout(kt);
      const q = kw.value.trim();
      if (q.length < 2) return setRes('k', '');
      $('k-status').textContent = 'searching…';
      kt = setTimeout(() => allTexts().then(es => {
        const hit = es.filter(e => cleanText(e.text).toLowerCase().includes(q.toLowerCase()));
        setRes('k', hit.length ? `${hit.length} result${hit.length === 1 ? '' : 's'}` : 'no results', hit.map(e => rowHTML(e, true) + `<span class="snip">${snippet(e.text, q)}</span>`).join(''));
      }), 250);
    };
    $('k-clear').onclick = e => { e.preventDefault(); kw.value = ''; setRes('k', ''); kw.focus(); };

    // by meaning: same model and approach as soul, run in a worker
    const sm = $('s-input'); let st = null;
    sm.oninput = () => {
      clearTimeout(st);
      const q = sm.value.trim();
      if (q.length < 3) return setRes('s', '');
      $('s-status').textContent = '…'; $('s-clear').style.display = '';
      st = setTimeout(() => semantic(q, m => { $('s-status').textContent = m; })
        .then(hit => setRes('s', hit.length ? `${hit.length} result${hit.length === 1 ? '' : 's'}` : 'no results', hit.map(e => rowHTML(e, true) + `<span class="snip">${esc(cleanText(e.text).slice(0, 150))}…</span>`).join('')))
        .catch(() => setRes('s', 'search unavailable')), 600);
    };
    $('s-clear').onclick = e => { e.preventDefault(); sm.value = ''; setRes('s', ''); sm.focus(); };
  }

  const EMBED_MODEL = 'Xenova/all-MiniLM-L6-v2', EMBED_KEY = 'tc-semantic-v1';
  let worker = null, wid = 0; const pending = new Map();
  function embed(texts, onProgress, onStatus) {
    if (!worker) {
      const src = `import { pipeline } from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.0";
let ex = null;
self.onmessage = async (e) => {
  const { id, model, texts } = e.data;
  try {
    if (!ex) ex = pipeline("feature-extraction", model, { dtype: "q8", progress_callback: p => { if (p.status === "progress") self.postMessage({ id: "load", progress: p.progress || 0 }); } });
    const x = await ex, vecs = [];
    for (let i = 0; i < texts.length; i += 8) {
      const chunk = texts.slice(i, i + 8), out = await x(chunk, { pooling: "mean", normalize: true });
      const w = out.dims[out.dims.length - 1];
      for (let j = 0; j < chunk.length; j++) vecs.push(Array.from(out.data.slice(j * w, (j + 1) * w)));
      self.postMessage({ id, progress: Math.min(i + 8, texts.length), total: texts.length });
    }
    self.postMessage({ id, done: true, vecs });
  } catch (err) { self.postMessage({ id, error: String(err) }); }
};`;
      worker = new Worker(URL.createObjectURL(new Blob([src], { type: 'application/javascript' })), { type: 'module' });
      worker.onmessage = e => {
        const d = e.data;
        if (d.id === 'load') { pending.forEach(p => p.onStatus && p.onStatus(`downloading model… ${Math.round(d.progress)}%`)); return; }
        const p = pending.get(d.id); if (!p) return;
        if (d.error) { p.reject(new Error(d.error)); pending.delete(d.id); return; }
        if (d.done) { p.resolve(d.vecs); pending.delete(d.id); return; }
        if (p.onProgress) p.onProgress(d.progress, d.total);
      };
    }
    const id = ++wid;
    return new Promise((resolve, reject) => { pending.set(id, { resolve, reject, onProgress, onStatus }); worker.postMessage({ id, model: EMBED_MODEL, texts }); });
  }
  async function semantic(query, status) {
    const es = await allTexts();
    const fp = es.length + ':' + es.reduce((a, e) => a + e.text.length, 0);
    let map = null;
    try { const c = JSON.parse(localStorage.getItem(EMBED_KEY) || 'null'); if (c && c.fp === fp) map = new Map(c.vecs); } catch (e) {}
    if (!map) {
      status('loading model… (one time, ~23MB)');
      const vecs = await embed(es.map(e => cleanText(e.text).slice(0, 800)), (d, t) => status(`indexing… ${d}/${t}`), status);
      map = new Map(es.map((e, i) => [e.path, vecs[i]]));
      try { localStorage.setItem(EMBED_KEY, JSON.stringify({ fp, vecs: [...map] })); } catch (e) {}
    }
    status('searching…');
    const [qv] = await embed([query], null, status);
    return es.map(e => ({ e, s: (map.get(e.path) || []).reduce((a, v, i) => a + v * qv[i], 0) }))
      .filter(x => x.s > 0.3).sort((a, b) => b.s - a.s).slice(0, 6).map(x => x.e);
  }

  // ---------- index.html: home + the current year's list ----------
  function home() {
    const card = document.getElementById('card');
    const lines = dataLines();
    const rows = parseRows(lines);
    const yl = lines.join('\n').match(/<a href="(\d{4})\/\1_full-archive\.html">/);
    const year = yl ? yl[1] : (rows[0] ? rows[0].y : '');
    const cur = currentMonth(lines, rows);
    // the note of the day: the newest one dated today or earlier (a week can be published ahead)
    const today = todayStr();
    const last = rows.find(r => r.date <= today) || rows[rows.length - 1];
    const curCount = rows.filter(r => r.m === cur).length;
    const res = k => `<div class="results"><div class="status"><span id="${k}-status"></span><span id="${k}-clear" style="display:none"><a href="#">clear</a></span></div><div class="list" id="${k}-list"></div></div>`;
    const intro = `<div class="intro">
<img class="avatar" src="${ROOT}assets/avatar.png?v=2" alt="a capsule" width="88" height="88">
<h1 class="name">thinking capsules</h1>
<p class="bio">// one short note a day<br>// a thinking log: ideas met, worked through, sometimes resolved</p>
<div class="socials">${chip(ROOT + 'archive.html', 'archive')}<a class="chip ghost" href="https://t.me/ivana_tg" target="_blank" rel="noopener">telegram</a></div>
<div class="search" id="search">
<div class="slabel">by date</div>
<div class="dates"><label>from<input type="date" id="d-from"></label><label>to<input type="date" id="d-to"></label></div>${res('d')}
<div class="slabel">by word</div>
<input type="text" id="k-input" placeholder="search a word" autocomplete="off" spellcheck="false">${res('k')}
<div class="slabel">by meaning</div>
<input type="text" id="s-input" placeholder="an idea, a question" autocomplete="off" spellcheck="false">${res('s')}
</div>
<a class="tile tile-who p-moon" href="https://ivana-dicarlo.pages.dev/" target="_blank" rel="noopener"><span class="badge" aria-hidden="true">↗</span><span class="tag">who writes here: Ivana</span></a>
<div class="other">other projects: <a href="https://thesouldevotional.github.io/soul/" target="_blank" rel="noopener">soul</a></div>
</div>`;
    const tiles = `<div class="grid">` +
      (last ? `<a class="tile tile-hero p-ripple" href="${last.href}"><span class="badge" aria-hidden="true">↗</span><span class="sub">${last.date === today ? 'today' : 'latest'} · ${last.date} · ${last.n}/365</span><span class="tag">${last.title}</span></a>` : '') +
      `<a class="tile p-layers" href="${ROOT}archive.html#${year}-${cur}"><span class="badge" aria-hidden="true">↗</span><span class="tag">this month · ${MONTHS[+cur - 1]}<span class="count">${curCount} ${curCount === 1 ? 'note' : 'notes'}</span></span></a>` +
      `<a class="tile p-path" href="${ROOT}archive.html#${year}"><span class="badge" aria-hidden="true">↗</span><span class="tag">${year}<span class="count">${rows.length} notes</span></span></a>` +
      `<a class="tile p-orbit" href="${ROOT}archive.html#topics"><span class="badge" aria-hidden="true">↗</span><span class="tag">topics<span class="count" id="ntopics"></span></span></a>` +
      `<a class="tile p-window" href="${ROOT}archive.html"><span class="badge" aria-hidden="true">↗</span><span class="tag">archive</span></a></div>`;
    let main = `<div class="glabel">read</div>${tiles}`;
    main += `<div class="glabel">${year} · every note</div><div id="months"></div>`;
    card.innerHTML = intro + `<div class="main">${main}</div>`;
    finish(card);
    searchUI(document.getElementById('search'));
    const box = document.getElementById('search');
    const wide = () => card.classList.toggle('searching', !!box.querySelector('input:focus') || [...box.querySelectorAll('.status span:first-child')].some(x => x.textContent));
    box.addEventListener('focusin', wide); box.addEventListener('focusout', () => setTimeout(wide, 0)); new MutationObserver(wide).observe(box, { subtree: true, childList: true, characterData: true });
    monthsBlock(document.getElementById('months'), rows, year, cur);
    topicList().then(t => { document.getElementById('ntopics').textContent = t.length; }).catch(() => {});
  }
  window.TC = { post, home, archive };
})();
