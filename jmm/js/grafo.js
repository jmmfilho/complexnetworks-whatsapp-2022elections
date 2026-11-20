// Abertura: a rede real de coautoria (157 coautores) desenhada em canvas.
// Os nós se espalham a partir do centro, flutuam devagar e reagem ao mouse.
window.grafoHero = function (canvas, G, tipEl) {
  const ctx = canvas.getContext("2d"), reduz = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const N = G.nodes, viz = N.map(() => []);
  G.edges.forEach(([a, b, w]) => { viz[a].push([b, w]); viz[b].push([a, w]); });
  N.forEach((n, i) => { n.fase = Math.random() * 6.28; n.vel = 0.35 + Math.random() * 0.5; n.r = 1.6 + Math.sqrt(n.t) * 1.15; });
  let W, H, cx, cy, R, dpr, foco = -1, mx = -1e4, my = -1e4, t0 = performance.now();
  function tam() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = canvas.clientWidth; H = canvas.clientHeight; canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const largo = W > 900;
    cx = largo ? W * 0.7 : W * 0.5; cy = largo ? H * 0.5 : H * 0.42; R = largo ? Math.min(W * 0.3, H * 0.44) : Math.min(W * 0.62, H * 0.34);
  }
  tam(); addEventListener("resize", tam);
  const pos = (n, t, k) => {
    const d = reduz ? 0 : Math.sin(t * 0.0006 * n.vel + n.fase) * 4;
    const px = (mx - cx) * 0.015, py = (my - cy) * 0.015;
    return [cx + n.x * R * k + d + (mx > -1e3 ? px : 0), cy + n.y * R * k + Math.cos(t * 0.0005 * n.vel + n.fase) * 4 * !reduz + (mx > -1e3 ? py : 0)];
  };
  function frame(t) {
    const k = reduz ? 1 : Math.min(1, (t - t0) / 1800), e = 1 - Math.pow(1 - k, 3);
    ctx.clearRect(0, 0, W, H);
    const P = N.map((n) => pos(n, t, e));
    const alfaBase = W > 900 ? 1 : 0.32;
    // arestas
    ctx.lineWidth = 0.6;
    G.edges.forEach(([a, b, w]) => {
      const ativa = foco >= 0 && (a === foco || b === foco);
      ctx.strokeStyle = ativa ? `rgba(167,139,250,${0.85 * alfaBase})` : `rgba(255,255,255,${(foco >= 0 ? 0.025 : 0.055 + 0.02 * Math.min(w, 4)) * alfaBase})`;
      ctx.lineWidth = ativa ? 1 + Math.min(w, 5) * 0.4 : 0.6;
      ctx.beginPath(); ctx.moveTo(P[a][0], P[a][1]); ctx.lineTo(P[b][0], P[b][1]); ctx.stroke();
    });
    // centro
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 60 * e);
    g.addColorStop(0, `rgba(167,139,250,${0.35 * alfaBase})`); g.addColorStop(1, "rgba(167,139,250,0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, 60, 0, 7); ctx.fill();
    ctx.fillStyle = `rgba(255,255,255,${alfaBase})`; ctx.beginPath(); ctx.arc(cx, cy, 6 * e, 0, 7); ctx.fill();
    // nós
    const vz = new Set(foco >= 0 ? viz[foco].map((v) => v[0]) : []);
    N.forEach((n, i) => {
      const apagado = foco >= 0 && i !== foco && !vz.has(i);
      ctx.globalAlpha = (apagado ? 0.18 : 1) * alfaBase;
      ctx.fillStyle = COR_FASE[n.f];
      ctx.beginPath(); ctx.arc(P[i][0], P[i][1], n.r * (i === foco ? 1.6 : 1), 0, 7); ctx.fill();
    });
    ctx.globalAlpha = 1;
    if (foco >= 0) {
      ctx.font = "500 13px Geist, Inter, sans-serif"; ctx.fillStyle = "#f2f3f7";
      ctx.fillText(N[foco].n, P[foco][0] + 10, P[foco][1] - 8);
    }
    canvas._P = P;
    if (!reduz || k < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  canvas.parentElement.addEventListener("mousemove", (ev) => {
    const b = canvas.getBoundingClientRect(); mx = ev.clientX - b.left; my = ev.clientY - b.top;
    const P = canvas._P || []; let best = -1, bd = 22 * 22;
    P.forEach(([x, y], i) => { const d = (x - mx) ** 2 + (y - my) ** 2; if (d < bd) { bd = d; best = i; } });
    foco = best;
    if (tipEl) {
      if (best >= 0) { const n = N[best];
        tipEl.innerHTML = `<b>${esc(n.n)}</b><br><span style="color:#a3a8b8">${n.t} publicação(ões) em comum · ${viz[best].length} parceiros na rede</span>`;
        tipEl.style.display = "block"; tipEl.style.left = mx + 16 + "px"; tipEl.style.top = my + 16 + "px"; }
      else tipEl.style.display = "none";
    }
    if (reduz) requestAnimationFrame(frame);
  });
  canvas.parentElement.addEventListener("mouseleave", () => { foco = -1; mx = my = -1e4; if (tipEl) tipEl.style.display = "none"; });
};
