/* Barda: genera en canvas una pared pintada (ladrillo o block) que se repite sin costuras
   y arma los rótulos por capas (sombra, borde, filo, línea, relleno degradado).
   - color:   la pintura del muro (tono por pieza, manchas, despostilladas)
   - relieve: mapa gris que se multiplica encima de TODO (muro + letras), así la pintura
              de los rótulos también "cae" en las juntas, como en una barda real. */
(function () {
  const rng = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

  // contorno de pieza: esquinas gastadas y orillas que no son perfectamente rectas
  function pieza(c, x, y, w, h, r, R) {
    const j = () => (R() - .5) * 1.8;
    const pts = [[x + j(), y + j()], [x + w * .5 + j(), y + j() * .6], [x + w + j(), y + j()],
                 [x + w + j() * .6, y + h * .5 + j()], [x + w + j(), y + h + j()], [x + w * .5 + j(), y + h + j() * .6],
                 [x + j(), y + h + j()], [x + j() * .6, y + h * .5 + j()]];
    const n = pts.length, m = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    c.beginPath();
    let s = m(pts[n - 1], pts[0]); c.moveTo(s[0], s[1]);
    for (let i = 0; i < n; i++) {
      const a = pts[i], b = m(pts[i], pts[(i + 1) % n]);
      const esq = i % 2 === 0;
      c.arcTo(a[0], a[1], b[0], b[1], esq ? r * (.5 + R() * .9) : 40);
    }
    c.closePath();
  }

  function Barda(o) {
    const S = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
    const { cols = 10, rows = 20, bw = 114, bh = 34, j = 6, seed = 7, radio = 3,
      pintura = [244, 242, 236], varia = 7, manchas = 1, tinteMancha = [120, 108, 88],
      junta = .8, sombra = .38, bisel = .08, ruido = 16, grano = .3, poros = 0,
      chips = .06, chipColor = [176, 96, 74], aparejo = .5 } = o || {};
    const BW = bw;
    const W = cols * (bw + j), H = rows * (bh + j);
    const mk = () => { const c = document.createElement('canvas'); c.width = W * S; c.height = H * S; const x = c.getContext('2d'); x.scale(S, S); return [c, x]; };
    const R = rng(seed);
    const [cc, cx] = mk(), [sc, sx] = mk();

    cx.fillStyle = `rgb(${pintura})`; cx.fillRect(0, 0, W, H);
    const g = Math.round(255 * junta); sx.fillStyle = `rgb(${g},${g},${g})`; sx.fillRect(0, 0, W, H);

    // atributos fijos por pieza (para que las copias del borde coincidan y no haya costura)
    const attr = [];
    for (let r = 0; r < rows; r++) { attr[r] = []; for (let k = 0; k < cols; k++) { const q = rng(seed * 977 + r * 131 + k * 17); attr[r][k] = { dx: (q() - .5) * 3, dw: (q() - .5) * 5, dy: (q() - .5) * 1.4, tono: (q() - .5) * varia, luz: 255 - q() * 9, s: Math.floor(q() * 1e9), chip: q() } } }

    for (let r = 0; r < rows; r++) {
      const off = (r % 2) * (bw + j) * aparejo;
      for (let k = -1; k <= cols; k++) {
        const a = attr[r][((k % cols) + cols) % cols];
        const x = k * (BW + j) + off + j / 2 + a.dx, y = r * (bh + j) + j / 2 + a.dy, bw = BW + a.dw;
        // relieve: la pieza sobresale, la junta queda hundida y recibe sombra
        let P = rng(a.s);
        sx.save(); sx.shadowColor = `rgba(0,0,0,${sombra})`; sx.shadowBlur = 3.2 * S; sx.shadowOffsetY = 1.8 * S; sx.shadowOffsetX = .5 * S;
        sx.fillStyle = `rgb(${a.luz},${a.luz},${a.luz})`; pieza(sx, x, y, bw, bh, radio, P); sx.fill(); sx.restore();
        P = rng(a.s); sx.save(); pieza(sx, x, y, bw, bh, radio, P); sx.clip();
        sx.lineWidth = 5; sx.strokeStyle = `rgba(0,0,0,${bisel})`; sx.stroke();
        const gr = sx.createLinearGradient(0, y, 0, y + bh); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.75, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.06)');
        sx.fillStyle = gr; sx.fillRect(x - 3, y - 3, bw + 6, bh + 6); sx.restore();
        // color: cada pieza agarra la pintura un poquito distinto
        P = rng(a.s); const t = a.tono;
        cx.fillStyle = `rgb(${pintura[0] + t},${pintura[1] + t},${pintura[2] + t * 1.2})`; pieza(cx, x, y, bw, bh, radio, P); cx.fill();
        // despostilladas: se cae la pintura en una orilla y asoma lo de abajo
        if (a.chip < chips) {
          const C = rng(a.s + 3), lado = C() < .5, cxp = x + (lado ? C() * bw : (C() < .5 ? 2 : bw - 2)), cyp = y + (lado ? (C() < .5 ? 1 : bh - 1) : C() * bh);
          const rr = 2 + C() * 5;
          for (const [ctx, col, al] of [[cx, chipColor, .85], [sx, [150, 150, 150], .5]]) {
            ctx.beginPath(); for (let i = 0; i < 9; i++) { const an = i / 9 * Math.PI * 2, rad = rr * (.5 + C() * .7); ctx.lineTo(cxp + Math.cos(an) * rad * 1.5, cyp + Math.sin(an) * rad); }
            ctx.closePath(); ctx.fillStyle = `rgba(${col},${al})`; ctx.fill();
          }
        }
      }
    }

    // manchas suaves de tierra y lluvia (se dibujan envueltas para no dejar costura)
    const env = (fn) => { for (const dx of [-W, 0, W]) for (const dy of [-H, 0, H]) fn(dx, dy); };
    const n = Math.round(W * H / 5000 * manchas);
    for (let i = 0; i < n; i++) {
      const x = R() * W, y = R() * H, rad = 12 + R() * R() * 170, al = .015 + R() * .045, osc = R() < .5;
      env((dx, dy) => {
        const gx = cx.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, rad);
        const c = osc ? tinteMancha : [255, 255, 255];
        gx.addColorStop(0, `rgba(${c},${al})`); gx.addColorStop(1, `rgba(${c},0)`);
        cx.fillStyle = gx; cx.fillRect(x + dx - rad, y + dy - rad, rad * 2, rad * 2);
      });
    }

    // poros del block / picaduras
    for (let i = 0; i < poros * W * H / 400; i++) {
      const x = R() * W, y = R() * H, rad = .4 + R() * R() * 1.8;
      sx.beginPath(); sx.ellipse(x, y, rad, rad * (.6 + R() * .6), R() * 3, 0, 7); sx.fillStyle = `rgba(0,0,0,${.18 + R() * .35})`; sx.fill();
      sx.beginPath(); sx.ellipse(x + .5, y + rad * .9, rad * .8, rad * .4, 0, 0, 7); sx.fillStyle = 'rgba(255,255,255,.25)'; sx.fill();
    }

    // grano mediano (textura de aplanado/pintura) + grano fino por pixel
    const pw = Math.ceil(W / 5), ph = Math.ceil(H / 5), pc = document.createElement('canvas'); pc.width = pw; pc.height = ph;
    const px = pc.getContext('2d'), pd = px.createImageData(pw, ph);
    for (let i = 0; i < pd.data.length; i += 4) { const v = 255 - Math.random() * 60; pd.data[i] = pd.data[i + 1] = pd.data[i + 2] = v; pd.data[i + 3] = 255; }
    px.putImageData(pd, 0, 0);
    sx.save(); sx.globalCompositeOperation = 'multiply'; sx.globalAlpha = grano; sx.imageSmoothingEnabled = true; sx.drawImage(pc, 0, 0, W, H); sx.restore();
    const id = sx.getImageData(0, 0, W * S, H * S), d = id.data;
    for (let i = 0; i < d.length; i += 4) { const v = (Math.random() - .5) * ruido; d[i] += v; d[i + 1] += v; d[i + 2] += v; }
    sx.putImageData(id, 0, 0);

    const blob = c => new Promise(res => c.toBlob(b => res(URL.createObjectURL(b)), 'image/jpeg', .9));
    return Promise.all([blob(cc), blob(sc)]).then(([color, relieve]) => ({ color, relieve, W, H }));
  }

  Barda.aplica = function (o, escalaMovil = .78) {
    return Barda(o).then(m => {
      const s = document.documentElement.style;
      s.setProperty('--muro', `url(${m.color})`); s.setProperty('--relieve', `url(${m.relieve})`);
      const k = matchMedia('(max-width:700px)').matches ? escalaMovil : 1;
      s.setProperty('--tw', m.W * k + 'px'); s.setProperty('--th', m.H * k + 'px');
      document.documentElement.classList.add('muro-listo');
    });
  };

  // Rótulo por capas. El texto real queda en .r-relleno; las demás capas son decorativas.
  Barda.rotulos = function () {
    document.querySelectorAll('.rotulo:not(.hecho)').forEach(el => {
      const h = el.innerHTML;
      el.innerHTML = ['sombra', 'borde', 'filo', 'linea'].map(c => `<span class="r-${c}" aria-hidden="true">${h}</span>`).join('') + `<span class="r-relleno">${h}</span>`;
      el.classList.add('hecho');
    });
  };

  window.Barda = Barda;
})();
