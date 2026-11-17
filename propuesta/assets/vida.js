/* Vida: entradas al hacer scroll, contadores y manitas que señalan.
   Uso: Vida([{s:'.selector', t:'sube', base:0, paso:.1}, ...])
   t: sube | sello | gira | lado | lado-der | pinta
   base: retraso inicial (s); paso: retraso escalonado entre hermanos (s) */
(function () {
  const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let io, reglas = [];

  function marca() {
    const cuenta = new Map();
    reglas.forEach(({ s, t, base = 0, paso = 0 }) => {
      document.querySelectorAll(s).forEach(el => {
        if (el.dataset.v) return;
        const p = el.parentElement, i = cuenta.get(p) || 0; cuenta.set(p, i + 1);
        el.dataset.v = t;
        el.style.setProperty('--d', (base + Math.min(i, 8) * paso).toFixed(2) + 's');
        io.observe(el);
      });
    });
  }

  function cuentaHasta(el) {
    const txt = el.textContent, m = txt.match(/(\D*)(\d+)(\D*)/); if (!m) return;
    const fin = +m[2], ini = el.dataset.desde ? +el.dataset.desde : 0, dur = 1400, t0 = performance.now();
    const paso = now => {
      const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = m[1] + Math.round(ini + (fin - ini) * e) + m[3];
      if (k < 1) requestAnimationFrame(paso);
    };
    requestAnimationFrame(paso);
  }

  function Vida(lista) {
    // la manita ☛ de los botones señala
    document.querySelectorAll('.boton').forEach(b => {
      if (b.querySelector('.manita-anim') || !b.textContent.includes('☛')) return;
      b.innerHTML = b.innerHTML.replace('☛', '<span class="manita-anim" aria-hidden="true">☛</span>');
    });
    if (quieto || !('IntersectionObserver' in window)) return;
    document.documentElement.classList.add('vida');
    reglas = reglas.concat(lista || []);
    io = io || new IntersectionObserver(es => es.forEach(en => {
      if (!en.isIntersecting) return;
      const el = en.target; el.classList.add('visto'); io.unobserve(el);
      // al terminar el brochazo se quita la máscara para no recortar sombras ni acentos
      if (el.dataset.v === 'pinta') { const fin = e => { if (e.target !== el) return; el.style.webkitMask = 'none'; el.style.mask = 'none'; el.removeEventListener('animationend', fin); }; el.addEventListener('animationend', fin); }
      el.querySelectorAll('[data-cuenta]').forEach(c => setTimeout(() => cuentaHasta(c), 300));
      if (el.matches('[data-cuenta]')) cuentaHasta(el);
    }), { threshold: .12, rootMargin: '0px 0px -6% 0px' });
    marca();
  }
  // para contenido que se vuelve a pintar (filtros de fechas)
  Vida.refresca = () => { if (io) marca(); document.querySelectorAll('.boton').forEach(b => { if (!b.querySelector('.manita-anim') && b.textContent.includes('☛')) b.innerHTML = b.innerHTML.replace('☛', '<span class="manita-anim" aria-hidden="true">☛</span>'); }); };

  // cinta corrida: duplica el contenido para que el loop no tenga corte
  Vida.cinta = (el, html) => { el.innerHTML = `<div class="cinta-pista"><span>${html}</span><span aria-hidden="true">${html}</span></div>`; };

  window.Vida = Vida;
})();
