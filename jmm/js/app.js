// Estrutura comum: navegação flutuante, rodapé, animações de entrada, contadores e utilidades.
// Edite CONFIG para trocar links e contatos em todas as páginas.
window.CONFIG = {
  nome: "José Maria Monteiro",
  nomeCompleto: "José Maria da Silva Monteiro Filho",
  email: "monteiro@dc.ufc.br",
  links: [
    { rotulo: "Lattes", url: "" },          // ex.: "http://lattes.cnpq.br/0000000000000000"
    { rotulo: "DBLP", url: "https://dblp.org/pers/hd/m/Monteiro:Jos=eacute=_Maria" },
    { rotulo: "Google Scholar", url: "" },
    { rotulo: "ORCID", url: "" },
    { rotulo: "LinkedIn", url: "" },
  ],
};
window.COR_FASE = ["#3987e5", "#d95926", "#199e70"];

(function () {
  const C = CONFIG, aqui = location.pathname.split("/").pop() || "index.html";
  const L = (h, t) => `<a class="l ${h === aqui ? "ativo" : ""}" href="${h}">${t}</a>`;
  const nav = document.createElement("nav");
  nav.className = "nav";
  nav.innerHTML = `<a class="logo" href="index.html">JM<span> Monteiro</span></a>${L("index.html", "Início")}${L("publicacoes.html", "Publicações")}${L("orientacoes.html", "Orientações")}<a class="cta" href="mailto:${C.email}">Contato</a>`;
  document.body.prepend(nav);

  document.addEventListener("DOMContentLoaded", () => {
    const f = document.createElement("footer");
    f.innerHTML = `<div class="wrap"><span>© ${new Date().getFullYear()} ${C.nomeCompleto} · Departamento de Computação · UFC</span>
      <span>${C.links.filter((l) => l.url).map((l) => `<a href="${l.url}" target="_blank" rel="noopener">${l.rotulo}</a>`).join(" · ")}${C.links.some((l) => l.url) ? " · " : ""}<a href="mailto:${C.email}">${C.email}</a></span></div>`;
    document.body.append(f);
    document.querySelectorAll("[data-links]").forEach((el) => {
      el.innerHTML = C.links.filter((l) => l.url).map((l) => `<a class="btn sec" href="${l.url}" target="_blank" rel="noopener">${l.rotulo} ↗</a>`).join("");
    });
    document.querySelectorAll("[data-email]").forEach((el) => (el.href = "mailto:" + C.email));

    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("visivel"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -6% 0px" });
    document.querySelectorAll(".surge").forEach((el) => io.observe(el));

    // contadores animados: <b data-contar="120" data-sufixo="%">
    const reduz = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ioN = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return; ioN.unobserve(e.target);
      const el = e.target, alvo = +el.dataset.contar, suf = el.dataset.sufixo || "", t0 = performance.now(), dur = 1400;
      if (reduz) { el.textContent = alvo + suf; return; }
      const passo = (t) => { const k = Math.min(1, (t - t0) / dur), v = Math.round(alvo * (1 - Math.pow(1 - k, 3))); el.textContent = v + suf; if (k < 1) requestAnimationFrame(passo); };
      requestAnimationFrame(passo);
    }), { threshold: 0.4 });
    document.querySelectorAll("[data-contar]").forEach((el) => { el.textContent = "0" + (el.dataset.sufixo || ""); ioN.observe(el); });
  });
})();

window.esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
window.tooltip = function (box) {
  const t = document.createElement("div"); t.className = "tip"; if (getComputedStyle(box).position === "static") box.style.position = "relative"; box.appendChild(t);
  return {
    show(h, e) { t.innerHTML = h; t.style.display = "block"; this.move(e); },
    move(e) { const b = box.getBoundingClientRect(); let x = e.clientX - b.left + 16, y = e.clientY - b.top + 16;
      if (x + t.offsetWidth > b.width) x = e.clientX - b.left - t.offsetWidth - 16; t.style.left = x + "px"; t.style.top = y + "px"; },
    hide() { t.style.display = "none"; },
  };
};
window.iniciais = (n) => n.replace(/[^A-Za-zÀ-ÿ ]/g, " ").split(/\s+/).filter((w) => w.length > 1 && !/^(de|da|do|dos|das)$/i.test(w)).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
