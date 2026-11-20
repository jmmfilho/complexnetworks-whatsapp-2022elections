// Rede radial de colaboração (inspirada em rpmenezes.github.io/research.html#network).
// Centro = o autor · anel = fase da 1ª colaboração · tamanho = publicações em comum ·
// cor = quão recente foi a última colaboração. Hover mostra as ligações; clique lista as publicações.
window.redeRadial = function (raiz, D) {
  const RAMPA = ["#1e2a4a", "#2b3d6e", "#3b5597", "#4f6fc0", "#6f8fe0", "#a3b8f5", "#dbe4ff"];
  raiz.innerHTML = `
  <div class="rr-ctrl">
    <button class="botao rr-play">▶ Animar 2000 → 2026</button>
    <label>Até <b class="rr-anoTxt"></b> <input class="rr-ano" type="range"></label>
    <label>Mostrar <select class="rr-top"><option value="30">top 30</option><option value="50">top 50</option>
      <option value="100">top 100</option><option value="9999" selected>todos</option></select></label>
    <label><input class="rr-todas" type="checkbox"> todas as ligações</label>
    <span class="rr-cont contador"></span>
  </div>
  <div class="legenda"><span>última colaboração: antiga</span><span class="rr-grad" style="width:120px;height:10px;border-radius:5px;display:inline-block;background:linear-gradient(90deg,${RAMPA.join(",")})"></span><span>recente</span></div>
  <div class="rr-wrap"><svg class="rr-svg" viewBox="-130 0 1360 1100" role="img" aria-label="Rede radial de coautoria"></svg><div class="rr-painel"></div></div>`;
  const st = document.createElement("style");
  st.textContent = `
  .rr-ctrl{display:flex;gap:1.2rem;align-items:center;flex-wrap:wrap;font-size:.88rem;color:var(--tinta-2)}
  .rr-ctrl .botao{padding:.5rem 1rem;font-size:.85rem}
  .rr-ctrl select{font:inherit;border:1px solid var(--linha);border-radius:6px;padding:.3rem .4rem}
  .rr-ctrl input[type=range]{width:240px;accent-color:var(--acento);vertical-align:middle}
  .rr-wrap{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:1.5rem}
  @media(max-width:900px){.rr-wrap{grid-template-columns:1fr}}
  .rr-painel{border-left:1px solid var(--linha);padding-left:1.2rem;font-size:.85rem;max-height:720px;overflow:auto}
  .rr-painel h4{font-weight:600;font-size:1rem;margin-bottom:.2rem}.rr-painel .meta{color:var(--tinta-2);margin-bottom:.8rem}
  .rr-painel ul{padding-left:1rem}.rr-painel li{margin-bottom:.55rem;line-height:1.4}.rr-painel .a{color:var(--tinta-3)}
  .rr-no{cursor:pointer;transition:opacity .25s}
  .rr-rot,.rr-anel{pointer-events:none;paint-order:stroke;stroke:#08090d;stroke-width:5px;stroke-linejoin:round}
  .rr-rot{font-size:19px;fill:#e6e8ef;font-family:var(--fonte)}.rr-anel{font-size:18px;fill:#6b7080}
  .rr-anoG{font-size:56px;font-weight:600;fill:rgba(255,255,255,.08);font-family:var(--fonte)}`;
  document.head.appendChild(st);

  const NS = "http://www.w3.org/2000/svg", C = 550, R = [170, 320, 465];
  const q = (s) => raiz.querySelector(s), svg = q(".rr-svg"), painel = q(".rr-painel"), tip = tooltip(raiz);
  raiz.style.position = "relative";
  const el = (t, a, p) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); (p || svg).appendChild(e); return e; };
  D.nos.forEach((n) => { n.x = C + R[n.anel] * Math.cos(n.ang); n.y = C + R[n.anel] * Math.sin(n.ang); });
  const gA = el("g", {}), gE = el("g", {}), gN = el("g", {}), gR = el("g", {});
  const anoG = el("text", { x: 20, y: 70, class: "rr-anoG" }, gA);
  R.forEach((r, i) => {
    el("circle", { cx: C, cy: C, r, fill: "none", stroke: "rgba(255,255,255,.09)" }, gA);
    el("text", { x: C - r * 0.72, y: C - r * 0.72, "text-anchor": "middle", class: "rr-anel" }, gR).textContent = D.fases[i];
  });
  el("circle", { cx: C, cy: C, r: 30, fill: "#f2f3f7" }, gA);
  el("text", { x: C, y: C + 52, "text-anchor": "middle", "font-size": 21, "font-weight": 600, fill: "#f2f3f7", class: "rr-rot" }, gR).textContent = D.central;

  let ano = D.ano_max, fixo = -1, est = [];
  const circ = D.nos.map((n, i) => {
    const c = el("circle", { cx: n.x, cy: n.y, r: 0, class: "rr-no", stroke: "#08090d", "stroke-width": 2 }, gN);
    c.addEventListener("mouseenter", (e) => foco(i, e)); c.addEventListener("mousemove", (e) => tip.move(e));
    c.addEventListener("mouseleave", () => { tip.hide(); if (fixo < 0) arestas(-1); });
    c.addEventListener("click", () => { fixo = fixo === i ? -1 : i; arestas(fixo); listar(fixo); });
    return c;
  });
  const rot = D.nos.map((n) => { const t = el("text", { class: "rr-rot", "text-anchor": Math.cos(n.ang) >= 0 ? "start" : "end" }, gR); return t; });
  const sl = q(".rr-ano"); sl.min = D.ano_min; sl.max = D.ano_max; sl.value = ano;
  const cor = (u) => RAMPA[Math.min(6, Math.max(1, Math.round(1 + ((u - D.ano_min) / (D.ano_max - D.ano_min)) * 5)))];

  function calcular() {
    tip.hide();
    est = D.nos.map((n) => { let tot = 0, ult = null, pri = null; for (const a in n.anos) if (+a <= ano) { tot += n.anos[a]; ult = +a; if (pri === null) pri = +a; } return { tot, ult, pri }; });
    const top = +q(".rr-top").value, ordem = est.map((s, i) => i).filter((i) => est[i].tot > 0).sort((a, b) => est[b].tot - est[a].tot);
    const vis = new Set(ordem.slice(0, top)), rotular = new Set(ordem.slice(0, 12));
    est.forEach((s, i) => (s.vis = vis.has(i)));
    D.nos.forEach((n, i) => {
      const s = est[i], r = s.vis ? 5 + 3.1 * Math.sqrt(s.tot) : 0;
      circ[i].setAttribute("r", r); circ[i].setAttribute("fill", s.vis ? cor(s.ult) : "none");
      const rr = R[n.anel] + r + 7;
      rot[i].setAttribute("x", C + rr * Math.cos(n.ang)); rot[i].setAttribute("y", C + rr * Math.sin(n.ang) + 6);
      rot[i].textContent = s.vis && rotular.has(i) ? n.nome : "";
    });
    q(".rr-anoTxt").textContent = ano; anoG.textContent = ano;
    q(".rr-cont").textContent = `${vis.size} coautores · ${D.pubs.filter((p) => p.ano <= ano).length} publicações`;
    arestas(fixo); listar(fixo);
  }
  function arco(a, b, w, c, op) {
    const n1 = D.nos[a], n2 = D.nos[b], k = 0.35, cx = C + ((n1.x + n2.x) / 2 - C) * k, cy = C + ((n1.y + n2.y) / 2 - C) * k;
    el("path", { d: `M${n1.x},${n1.y} Q${cx},${cy} ${n2.x},${n2.y}`, fill: "none", stroke: c, "stroke-width": w, "stroke-opacity": op, "stroke-linecap": "round" }, gE);
  }
  function arestas(f) {
    gE.innerHTML = ""; const pesos = new Map(), viz = new Set();
    D.pubs.forEach((p) => { if (p.ano > ano) return; const a = p.autores.filter((i) => est[i].vis);
      for (let x = 0; x < a.length; x++) for (let y = x + 1; y < a.length; y++) { const k = Math.min(a[x], a[y]) + "-" + Math.max(a[x], a[y]); pesos.set(k, (pesos.get(k) || 0) + 1); } });
    if (f >= 0) el("line", { x1: C, y1: C, x2: D.nos[f].x, y2: D.nos[f].y, stroke: "#a78bfa", "stroke-width": 1 + Math.sqrt(est[f].tot), "stroke-opacity": 0.35 }, gE);
    pesos.forEach((w, k) => { const [a, b] = k.split("-").map(Number);
      if (f >= 0) { if (a !== f && b !== f) return; viz.add(a === f ? b : a); arco(a, b, 0.8 + 1.2 * w, "#a78bfa", 0.85); }
      else if (q(".rr-todas").checked) arco(a, b, 0.4 + 0.6 * w, "#ffffff", 0.12); });
    circ.forEach((c, i) => (c.style.opacity = f < 0 || i === f || viz.has(i) ? 1 : 0.18));
    rot.forEach((t, i) => (t.style.opacity = f < 0 || i === f || viz.has(i) ? 1 : 0.18));
  }
  function foco(i, e) {
    const s = est[i]; if (!s.vis) return;
    tip.show(`<b>${esc(D.nos[i].nome)}</b><br>${s.tot} publicação(ões) em comum<br>de ${s.pri} a ${s.ult}`, e);
    if (fixo < 0) arestas(i);
  }
  function listar(i) {
    if (i < 0) {
      const top = D.nos.map((n, j) => [j, est[j]]).filter((x) => x[1].vis).sort((a, b) => b[1].tot - a[1].tot).slice(0, 15);
      painel.innerHTML = `<h4>Principais coautores</h4><div class="meta">Clique em um círculo para ver as publicações em comum.</div><ul>${top.map(([j, s]) => `<li>${esc(D.nos[j].nome)} <span class="a">· ${s.tot}</span></li>`).join("")}</ul>`;
      return;
    }
    const ps = D.pubs.filter((p) => p.ano <= ano && p.autores.includes(i)).reverse();
    painel.innerHTML = `<h4>${esc(D.nos[i].nome)}</h4><div class="meta">${ps.length} publicação(ões) em comum · <a href="#" class="rr-limpa">limpar</a></div>
      <ul>${ps.map((p) => `<li><span class="a">${p.ano}</span> ${esc(p.titulo)} <span class="a">— ${esc(p.veiculo)}${p.qualis !== "—" ? " (" + esc(p.qualis) + ")" : ""}</span></li>`).join("")}</ul>`;
    painel.querySelector(".rr-limpa").onclick = (ev) => { ev.preventDefault(); fixo = -1; arestas(-1); listar(-1); };
  }
  sl.oninput = () => { ano = +sl.value; calcular(); };
  q(".rr-top").onchange = calcular; q(".rr-todas").onchange = () => arestas(fixo);
  let timer = null; const play = q(".rr-play");
  play.onclick = () => {
    if (timer) { clearInterval(timer); timer = null; play.textContent = "▶ Animar 2000 → 2026"; return; }
    if (ano >= D.ano_max) ano = D.ano_min - 1;
    play.textContent = "❚❚ Pausar";
    timer = setInterval(() => { ano++; sl.value = ano; calcular(); if (ano >= D.ano_max) { clearInterval(timer); timer = null; play.textContent = "▶ Animar 2000 → 2026"; } }, 700);
  };
  calcular();
};
