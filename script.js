/* MONO · Record collection
   Reimplementation from the explicit geometry / motion specification.
   The ten local photographs are the only artwork inputs. */
(() => {
  'use strict';

  /* ---------------------------------------------------------------- datos */
  const DISCOS = [
    { id: 'jesse',    img: IMAGENES.jesse,    archivo: 'imagenes/jesse.jpg', cover: true },
    { id: 'edwar',    img: IMAGENES.edwar,    archivo: 'imagenes/edwar.jpg' },
    { id: 'jimypam',  img: IMAGENES.jimypam,  archivo: 'imagenes/jimypam.jpg' },
    { id: 'eldiario', img: IMAGENES.eldiario, archivo: 'imagenes/eldiario.jpg', cover: true },
    { id: 'sunshine', img: IMAGENES.sunshine, archivo: 'imagenes/sunshine.jpg', cover: true },
    { id: 'jyk',      img: IMAGENES.jyk,      archivo: 'imagenes/jyk.jpg' },
    { id: 'before',   img: IMAGENES.before,   archivo: 'imagenes/before.jpg', cover: true },
    { id: 'her',      img: IMAGENES.her,      archivo: 'imagenes/her.jpg', cover: true },
    { id: 'you',      img: IMAGENES.you,      archivo: 'imagenes/you.jpg', cover: true },
    { id: '10cosas',  img: IMAGENES['10cosas'], archivo: 'imagenes/10cosas.jpg', cover: true }
  ];
  const N = DISCOS.length;

  // Cada dorso usa la misma foto del disco, pero con un duotono y un encuadre
  // propio según la canción: azul luna, ámbar, violeta, verde, magenta, etc.
  const DORSO = [
    { base: '#0a1f44', acento: '#8fb0e6' }, // Moonlight on the River
    { base: '#2c140f', acento: '#d9a06f' }, // Come Back
    { base: '#241238', acento: '#b997dd' }, // Mrs Magic
    { base: '#0c2a22', acento: '#79b69a' }, // No One Noticed
    { base: '#2b0f26', acento: '#d08ab2' }, // Loving Machine
    { base: '#122338', acento: '#93b4d6' }, // Let You Break My Heart Again
    { base: '#241a12', acento: '#c8a97f' }, // Nobody New
    { base: '#161b24', acento: '#9aa8bd' }, // Cigarettes After Sex
    { base: '#0b1a3a', acento: '#7ea6e6' }, // Blue Hair
    { base: '#2b1116', acento: '#d39393' }  // I Like Her
  ];

  /* ------------------------------------------------------------ utilidades */
  const $ = (id) => document.getElementById(id);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const damp = (rate, dt) => 1 - Math.exp(-rate * dt);
  const PI = Math.PI;

  function bezier(x1, y1, x2, y2) {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const X = (t) => ((ax * t + bx) * t + cx) * t;
    const Y = (t) => ((ay * t + by) * t + cy) * t;
    const dX = (t) => (3 * ax * t + 2 * bx) * t + cx;
    return (x) => {
      let t = x;
      for (let i = 0; i < 8; i++) {
        const e = X(t) - x;
        if (Math.abs(e) < 1e-5) break;
        const d = dX(t);
        if (Math.abs(d) < 1e-6) break;
        t -= e / d;
      }
      return Y(clamp(t, 0, 1));
    };
  }
  const easeSel = bezier(0.32, 0.72, 0, 1);

  function rng(seed) {
    let s = seed >>> 0;
    return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  }

  /* --------------------------------------------------------------- arte */
  function loadImage(src) {
    return new Promise((res, rej) => {
      const im = new Image();
      im.onload = () => res(im);
      im.onerror = () => rej(new Error(src));
      im.src = src;
    });
  }

  // Las verticales marcadas con cover se recortan al centro para llenar la
  // etiqueta; el resto se muestra completa sobre fondo blanco. Sin nombres.
  function drawFoto(ctx, img, S, cover) {
    const w = img.naturalWidth, h = img.naturalHeight;
    const k = cover ? Math.max(S / w, S / h) : Math.min(S / w, S / h);
    const dw = w * k, dh = h * k;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, S, S);
    const dx = (S - dw) / 2, dy = (S - dh) / 2;
    ctx.drawImage(img, dx, dy, dw, dh);
    // 30% menos de luz solo sobre la foto; el fondo blanco queda intacto.
    ctx.save();
    ctx.beginPath();
    ctx.rect(dx, dy, dw, dh);
    ctx.clip();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(dx, dy, dw, dh);
    ctx.restore();
  }

  // Surcos concéntricos y micro-rayas casi invisibles. El material con
  // metalness/clearcoat los refleja como un vinilo sin tapar la fotografía.
  function texturaVinilo(ctx, S) {
    const c = S / 2;
    ctx.save();
    ctx.lineWidth = 1;
    for (let r = S * 0.245, k = 0; r < S * 0.49; r += 3, k++) {
      ctx.strokeStyle = k % 3 === 0 ? 'rgba(255,255,255,.022)' : 'rgba(0,0,0,.026)';
      ctx.beginPath();
      ctx.arc(c, c, r, 0, PI * 2);
      ctx.stroke();
    }
    const azar = rng(41);
    ctx.lineWidth = 0.7;
    ctx.strokeStyle = 'rgba(255,255,255,.018)';
    for (let i = 0; i < 24; i++) {
      const a = azar() * PI * 2;
      const r0 = S * (0.26 + azar() * 0.16);
      const len = S * (0.02 + azar() * 0.06);
      ctx.beginPath();
      ctx.moveTo(c + Math.cos(a) * r0, c + Math.sin(a) * r0);
      ctx.lineTo(c + Math.cos(a) * (r0 + len), c + Math.sin(a) * (r0 + len));
      ctx.stroke();
    }
    ctx.restore();
  }

  function textoDorso(ctx, texto, x, y, maxW, lineH, maxLineas) {
    const palabras = String(texto || '').trim().split(/\s+/);
    const lineas = [];
    let actual = '';
    for (const palabra of palabras) {
      const prueba = actual ? actual + ' ' + palabra : palabra;
      if (actual && ctx.measureText(prueba).width > maxW) {
        lineas.push(actual);
        actual = palabra;
      } else actual = prueba;
    }
    if (actual) lineas.push(actual);
    lineas.slice(0, maxLineas).forEach((l, k) => ctx.fillText(l, x, y + k * lineH));
  }

  // Dorso distinto por disco: duplica la foto y la tiñe según la canción.
  function prepararDorso(disco, img, i) {
    const S = 512;
    const c = document.createElement('canvas');
    c.width = c.height = S;
    const ctx = c.getContext('2d');
    const pal = DORSO[i % DORSO.length];
    const giro = ((i % 5) - 2) * 0.026;
    const espejo = i % 2 === 1;
    const zoom = 1.06 + (i % 3) * 0.07;
    const angulo = (i * 47 + 20) * PI / 180;

    ctx.fillStyle = pal.base;
    ctx.fillRect(0, 0, S, S);

    if (img) {
      const iw = img.naturalWidth, ih = img.naturalHeight;
      const k = Math.max(S / iw, S / ih) * zoom;
      const dw = iw * k, dh = ih * k;
      ctx.save();
      ctx.translate(S / 2, S / 2);
      ctx.rotate(giro);
      if (espejo) ctx.scale(-1, 1);
      ctx.filter = 'grayscale(1) contrast(1.18) brightness(.66)';
      ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
      ctx.restore();

      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = pal.acento;
      ctx.fillRect(0, 0, S, S);
      ctx.restore();

      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 0.16;
      ctx.fillStyle = pal.base;
      ctx.fillRect(0, 0, S, S);
      ctx.restore();
    }

    const dx = Math.cos(angulo) * S * 0.5, dy = Math.sin(angulo) * S * 0.5;
    const g = ctx.createLinearGradient(S / 2 - dx, S / 2 - dy, S / 2 + dx, S / 2 + dy);
    g.addColorStop(0, 'rgba(0,0,0,.5)');
    g.addColorStop(0.5, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,.3)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, S, S);

    ctx.strokeStyle = 'rgba(255,255,255,.035)';
    ctx.lineWidth = 1;
    for (let r = 132; r < 250; r += 8) {
      ctx.beginPath(); ctx.arc(S / 2, S / 2, r, 0, PI * 2); ctx.stroke();
    }
    const azar = rng(1000 + i * 97);
    ctx.fillStyle = 'rgba(255,255,255,.055)';
    for (let n = 0; n < 400; n++) ctx.fillRect(azar() * S, azar() * S, 1, 1);

    const cancion = CANCIONES[i] || {};
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,.82)';
    ctx.font = '700 12px Manrope, sans-serif';
    ctx.fillText('M O N O', S / 2, S * 0.30);

    ctx.fillStyle = 'rgba(255,255,255,.95)';
    ctx.font = '800 24px Manrope, sans-serif';
    textoDorso(ctx, cancion.titulo, S / 2, S * 0.655, 320, 28, 2);

    ctx.fillStyle = pal.acento;
    ctx.font = '600 13px Manrope, sans-serif';
    textoDorso(ctx, cancion.artista, S / 2, S * 0.735, 300, 17, 1);

    ctx.strokeStyle = 'rgba(255,255,255,.22)';
    ctx.beginPath();
    ctx.moveTo(S * 0.40, S * 0.775);
    ctx.lineTo(S * 0.60, S * 0.775);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,.7)';
    ctx.font = '700 12px Manrope, sans-serif';
    ctx.fillText(String(i + 1).padStart(2, '0') + ' / ' + String(N).padStart(2, '0'),
                 S / 2, S * 0.83);
    return c;
  }

  async function prepararArte(disco, i) {
    const S = 512;
    const c = document.createElement('canvas');
    c.width = c.height = S;
    const ctx = c.getContext('2d');
    let img = null;
    try {
      img = await loadImage(disco.img);
      drawFoto(ctx, img, S, disco.cover);
      texturaVinilo(ctx, S);
    } catch (err) {
      // Nunca sustituir el arte: informar el archivo exacto que falló.
      console.error('No se pudo cargar el arte: ' + disco.archivo, err);
    }
    disco.canvas = c;
    disco.canvasBack = prepararDorso(disco, img, i);
    disco.url = disco.archivo;
  }

  /* ----------------------------------------------------------- referencias */
  const root = $('mono');
  const stage = $('escenario');
  const river = $('river');
  const letraPanel = $('letra');
  const glHost = $('gl');
  const scrib = $('trazo');
  const sctx = scrib.getContext('2d');
  const elCont = $('contador'), elDet = $('detalle');
  const btnPrev = $('prev'), btnNext = $('next');
  const btnFlip = $('btn-flip'), btnPausa = $('btn-pausa'), btnReplay = $('btn-replay');
  const respaldo = $('respaldo'), respaldoImg = $('respaldo-img');

  const parteCanvas = $('particulas'), pctx = parteCanvas.getContext('2d');
  const elLetraHint = $('letra-hint'), elLetraCab = $('letra-cabecera');
  const elLetraTit = $('letra-titulo'), elLetraArt = $('letra-artista');
  const elProgreso = $('letra-progreso');
  const elLetraLin = $('letra-lineas'), elLetraErr = $('letra-error');
  const btnMusica = $('btn-musica'), btnVolumen = $('btn-volumen'), sliderVol = $('volumen');
  const icoPausaMus = btnMusica.querySelector('.ico-pausa');
  const icoPlayMus = btnMusica.querySelector('.ico-play');
  const icoOndas = btnVolumen.querySelector('.ico-ondas');
  const icoMudo = btnVolumen.querySelector('.ico-mudo');

  const CANCIONES = window.CANCIONES || [];

  const mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reduced = mqReduce.matches;
  const mobile = () => window.innerWidth <= 991;

  /* ------------------------------------------------------------------ estado */
  const state = {
    sel: 0, target: 0, vel: 0, prevSel: 0,
    anim: null, time: 0, paused: false,
    hover: false, focus: false, dragging: null,
    detalle: false
  };

  /* Cualquier cosa de three queda acá para poder liberarla */
  let T = null; // contexto 3D (null hasta montar)
  let arteListo = null;

  /* ------------------------------------------------ música / letra / partículas */
  const musica = {
    audio: $('audio'),
    actual: null, lineas: [], idx: -1,
    caracteres: [], caracterCantado: -1,
    reproduciendo: false, pausada: false, terminada: false,
    volumen: Number(sliderVol.value) / 100,
    ultimoVolumen: Number(sliderVol.value) / 100 || 0.65,
    raf: 0, ultimo: 0, fadeRaf: 0,
    nivel: 0, picoAnterior: 0, estallido: 0
  };
  const particulas = [];
  let reintentarAudio = false;

  /* ------------------------------------------------------- letra sincronizada */
  function parsearLRC(texto) {
    const lineas = [];
    const re = /\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]/g;
    String(texto || '').split(/\r?\n/).forEach((cruda) => {
      const tiempos = [];
      let m;
      re.lastIndex = 0;
      while ((m = re.exec(cruda))) {
        const frac = m[3] ? Number(m[3].padEnd(3, '0')) / 1000 : 0;
        tiempos.push(Number(m[1]) * 60 + Number(m[2]) + frac);
      }
      if (!tiempos.length) return;                 // [ti:], [ar:], etc.
      const txt = cruda.replace(re, '').trim();
      tiempos.forEach((t) => lineas.push({ t, texto: txt }));
    });
    lineas.sort((a, b) => a.t - b.t);
    return lineas;
  }

  function pintarLineas(idx) {
    elLetraLin.textContent = '';
    elLetraLin.style.setProperty('--progreso', '0%');
    musica.caracteres = [];
    musica.caracterCantado = -1;
    if (idx < 0 || !musica.lineas.length) return;
    // Solo la línea que suena ahora. La anterior desaparece.
    // Un span por carácter permite pintar letra a letra, no la línea entera.
    const p = document.createElement('p');
    const txt = musica.lineas[idx].texto;
    p.className = 'activa' + (txt ? '' : ' vacia');
    const frag = document.createDocumentFragment();
    for (const ch of Array.from(txt || '·')) {
      const s = document.createElement('span');
      s.className = 'ch';
      s.textContent = ch;
      frag.appendChild(s);
      musica.caracteres.push(s);
    }
    p.appendChild(frag);
    elLetraLin.appendChild(p);
  }

  function esLineaRiver(texto) {
    const n = String(texto || '').toLowerCase()
      .replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
    return n.indexOf('home') !== -1 && n.indexOf('moonlight on the river') !== -1;
  }

  function activarRiver() {
    if (!river) return;
    river.classList.remove('activo');
    void river.offsetWidth;               // reinicia la animación
    river.classList.add('activo');
    if (letraPanel) letraPanel.classList.add('letra--river');
  }

  function actualizarLetra() {
    if (elLetraCab.hidden || !musica.lineas.length) return;
    const t = musica.audio.currentTime || 0;
    const dur = musica.audio.duration;
    if (elProgreso && isFinite(dur) && dur > 0) {
      elProgreso.style.width = (clamp(t / dur, 0, 1) * 100).toFixed(2) + '%';
    }
    let idx = -1;
    for (let i = 0; i < musica.lineas.length; i++) {
      if (musica.lineas[i].t <= t + 0.12) idx = i; else break;
    }
    if (idx !== musica.idx) {
      musica.idx = idx;
      pintarLineas(idx);
      if (idx >= 0 && esLineaRiver(musica.lineas[idx].texto)) activarRiver();
    }
    if (idx >= 0) {
      const ini = musica.lineas[idx].t;
      const fin = idx + 1 < musica.lineas.length
        ? musica.lineas[idx + 1].t
        : (isFinite(dur) && dur > ini ? dur : ini + 4);
      const avance = clamp((t - ini) / Math.max(0.2, fin - ini), 0, 1);
      elLetraLin.style.setProperty('--progreso', (avance * 100).toFixed(1) + '%');
      const n = musica.caracteres.length;
      if (n) {
        const cantados = clamp(Math.round(avance * n), 0, n);
        if (cantados !== musica.caracterCantado) {
          const desde = musica.caracterCantado < 0 ? 0
            : Math.min(musica.caracterCantado, cantados);
          const hasta = musica.caracterCantado < 0 ? n
            : Math.max(musica.caracterCantado, cantados);
          for (let k = desde; k < hasta; k++) {
            musica.caracteres[k].classList.toggle('cantada', k < cantados);
          }
          musica.caracterCantado = cantados;
        }
      }
    }
  }

  /* ------------------------------------------------------ audio local MP3 */
  function pintarBotonMusica() {
    const pausada = musica.pausada;
    icoPausaMus.hidden = pausada;
    icoPlayMus.hidden = !pausada;
    btnMusica.classList.toggle('is-playing', musica.reproduciendo && !pausada);
    btnMusica.setAttribute('aria-pressed', String(pausada));
    const label = pausada ? 'Reproducir música' : 'Pausar música';
    btnMusica.setAttribute('aria-label', label);
    btnMusica.title = label;
  }

  function pintarBotonVolumen() {
    const mudo = musica.volumen <= 0;
    icoOndas.hidden = mudo;
    icoMudo.hidden = !mudo;
    btnVolumen.classList.toggle('is-muted', mudo);
    btnVolumen.setAttribute('aria-pressed', String(mudo));
    const label = mudo ? 'Activar sonido' : 'Silenciar';
    btnVolumen.setAttribute('aria-label', label);
    btnVolumen.title = label;
  }

  function mostrarErrorAudio(msg) {
    elLetraErr.textContent = msg;
    elLetraErr.hidden = false;
    musica.reproduciendo = false;
    musica.pausada = true;
    pintarBotonMusica();
  }

  function detenerFade() {
    if (musica.fadeRaf) cancelAnimationFrame(musica.fadeRaf);
    musica.fadeRaf = 0;
  }

  function aplicarCancion(c) {
    musica.actual = c;
    if (!c.lineas) c.lineas = parsearLRC(c.lrc);
    musica.lineas = c.lineas;
    musica.idx = -1;
    musica.nivel = 0; musica.picoAnterior = 0; musica.estallido = 0;
    musica.pausada = false;
    musica.terminada = false;
    pintarLineas(-1);
    pintarBotonMusica();
    if (letraPanel) letraPanel.classList.remove('letra--cambiando');

    const a = musica.audio;
    a.src = c.mp3;
    const p = a.play();
    if (p && typeof p.catch === 'function') {
      p.catch(() => {
        if (musica.actual !== c) return;
        musica.reproduciendo = false;
        musica.pausada = true;
        reintentarAudio = true;
        pintarBotonMusica();
        mostrarErrorAudio('Tocá en cualquier lugar para activar el sonido.');
      });
    }
  }

  // Cambio progresivo: baja el tema anterior, entra el nuevo y sube suave.
  // Un solo <audio> (sin Web Audio): funciona igual con file:// y por servidor.
  function reproducirCancion(c) {
    if (!c) return;
    detenerFade();
    elLetraHint.hidden = true;
    elLetraCab.hidden = false;
    elLetraErr.hidden = true;
    elLetraTit.textContent = c.titulo;
    elLetraArt.textContent = c.artista;
    if (elProgreso) elProgreso.style.width = '0%';
    if (letraPanel) letraPanel.classList.remove('letra--river');
    if (river) river.classList.remove('activo');
    const a = musica.audio;
    const cambia = musica.actual && musica.actual !== c && !a.paused;
    if (!cambia || reduced) {
      a.volume = musica.volumen;
      aplicarCancion(c);
      return;
    }
    if (letraPanel) letraPanel.classList.add('letra--cambiando');
    const v0 = a.volume;
    const t0 = performance.now();
    const salida = 340, entrada = 620;
    let puesto = false;
    const paso = (now) => {
      const el = now - t0;
      if (!puesto) {
        const k = clamp(el / salida, 0, 1);
        a.volume = v0 * (1 - k);
        if (k >= 1) { aplicarCancion(c); puesto = true; }
      } else {
        const k = clamp((el - salida) / entrada, 0, 1);
        a.volume = musica.volumen * k;
        if (k >= 1) { a.volume = musica.volumen; musica.fadeRaf = 0; return; }
      }
      musica.fadeRaf = requestAnimationFrame(paso);
    };
    musica.fadeRaf = requestAnimationFrame(paso);
  }

  // Cada disco tiene un tema asignado: el mismo índice de CANCIONES.
  function reproducirDelDisco(i) {
    if (!CANCIONES.length) return;
    reproducirCancion(CANCIONES[clamp(i, 0, CANCIONES.length - 1)]);
  }

  function alternarMusica() {
    if (!musica.actual) { reproducirDelDisco(state.target); return; }
    if (musica.terminada) { reproducirCancion(musica.actual); return; }
    const a = musica.audio;
    if (a.paused) {
      const p = a.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    } else a.pause();
  }

  function intentarDesbloquearAudio() {
    if (!reintentarAudio) return;
    reintentarAudio = false;
    elLetraErr.hidden = true;
    musica.pausada = false;
    pintarBotonMusica();
    const p = musica.audio.play();
    if (p && typeof p.catch === 'function') {
      p.catch(() => { reintentarAudio = true; });
    }
  }

  function cambiarVolumen() {
    musica.volumen = Number(sliderVol.value) / 100;
    if (musica.volumen > 0) musica.ultimoVolumen = musica.volumen;
    // Durante un fade, el volumen lo controla el propio fade.
    if (!musica.fadeRaf) musica.audio.volume = musica.volumen;
    pintarBotonVolumen();
  }

  function alternarSilencio() {
    if (musica.volumen > 0) {
      musica.ultimoVolumen = musica.volumen;
      musica.volumen = 0;
    } else {
      musica.volumen = musica.ultimoVolumen || 0.65;
    }
    sliderVol.value = String(Math.round(musica.volumen * 100));
    cambiarVolumen();
  }

  /* ----------------------------------------------------------- partículas */
  function initParticulas() {
    // Polvillo: muchos puntos mínimos, sueltos y apenas visibles.
    const cantidad = mobile() ? 150 : 260;
    const azar = rng(7);
    for (let i = 0; i < cantidad; i++) {
      particulas.push({
        x: azar(), y: azar(),
        z: 0.15 + azar() * 0.85,             // profundidad: paralaje y brillo
        r: 0.18 + azar() * 0.5,              // motas diminutas
        vx: (azar() - 0.5) * 0.009,
        vy: -0.002 - azar() * 0.007,         // deriva lenta hacia arriba
        a: 0.05 + azar() * 0.12,             // muy tenues: no tapan el fondo
        f: azar() * PI * 2
      });
    }
    parteCanvas.dataset.count = String(particulas.length);
  }

  function resizeParticulas() {
    const w = Math.max(1, stage.clientWidth), h = Math.max(1, stage.clientHeight);
    const dpr = Math.min(window.devicePixelRatio || 1, mobile() ? 1.25 : 1.5);
    parteCanvas.width = Math.round(w * dpr);
    parteCanvas.height = Math.round(h * dpr);
    pctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    dibujarParticulas(0, 0, 0);
  }

  function dibujarParticulas(dt, nivel, estallido) {
    const w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    pctx.clearRect(0, 0, w, h);
    pctx.globalCompositeOperation = 'lighter';
    const empuje = 1 + nivel * 0.7 + estallido * 1.2;

    for (const p of particulas) {
      if (dt) {
        const par = 0.5 + p.z * 0.8;          // cerca se mueve más, lejos menos
        p.x += p.vx * dt * empuje * par;
        p.y += p.vy * dt * empuje * par;
        p.f += dt * (0.5 + nivel * 1.5);
        if (p.x < -0.02) p.x = 1.02; else if (p.x > 1.02) p.x = -0.02;
        if (p.y < -0.02) p.y = 1.02; else if (p.y > 1.02) p.y = -0.02;
      }
      const brillo = 0.7 + 0.3 * Math.sin(p.f);   // leve centelleo de mota
      const alpha = clamp(p.a * brillo * (0.55 + p.z * 0.5) *
                          (1 + nivel * 0.4 + estallido * 0.6), 0, 0.22);
      const R = Math.max(0.5, p.r * (0.7 + p.z * 0.6));
      const azul = Math.round(210 + p.z * 40);
      pctx.fillStyle = 'rgba(198,' + azul + ',255,' + alpha.toFixed(3) + ')';
      pctx.beginPath();
      pctx.arc(p.x * w, p.y * h, R, 0, PI * 2);
      pctx.fill();
    }

    // Un único destello muy tenue en los picos, sin hilos ni mallas.
    if (estallido > 0.02) {
      const a = estallido * 0.06;
      pctx.strokeStyle = 'rgba(205,222,255,' + a.toFixed(3) + ')';
      pctx.lineWidth = 1;
      pctx.beginPath();
      pctx.arc(w / 2, h / 2, (1 - estallido) * Math.min(w, h) * 0.55, 0, PI * 2);
      pctx.stroke();
    }
    pctx.globalCompositeOperation = 'source-over';
  }

  // Envolvente real de cada MP3 (calculada de antemano). Así funciona también
  // con file://, donde Web Audio silenciaría el audio por CORS.
  function leerNivelAudio(dt) {
    const c = musica.actual;
    if (!c || !c.env || !c.env.length || !musica.reproduciendo || musica.audio.paused) return 0;
    const t = musica.audio.currentTime || 0;
    const pos = t / 0.5;
    const i = Math.floor(pos);
    const a = (c.env[clamp(i, 0, c.env.length - 1)] || 0) / 255;
    const b = (c.env[clamp(i + 1, 0, c.env.length - 1)] || 0) / 255;
    const nivel = lerp(a, b, clamp(pos - i, 0, 1));
    const pico = Math.max(a, b);
    const paso = dt || 0.016;
    if (pico > 0.78 && pico - musica.picoAnterior > 0.16) musica.estallido = 1;
    musica.picoAnterior = lerp(musica.picoAnterior, pico, damp(9, paso));
    musica.nivel = lerp(musica.nivel, nivel, damp(7, paso));
    musica.estallido = Math.max(0, musica.estallido - paso * 0.85);
    return musica.nivel;
  }

  /* ------------------------------------------- fondo WebGL: agua con luna */
  /* Traducción del waterPlane de ShaderGradient a WebGL1 puro: sin React,
     sin fetch y sin archivos externos, funciona también con file://. */
  const fondoCanvas = $('fondo');
  let GL = null;

  const VERT_FONDO = [
    'attribute vec2 aPos;',
    'varying vec2 vUv;',
    'void main(){ vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }'
  ].join('\n');

  const FRAG_FONDO = [
    'precision mediump float;',
    'varying vec2 vUv;',
    'uniform vec2 uRes;',
    'uniform float uTime;',
    'uniform float uNivel;',
    'uniform vec2 uMoon;',
    'float hash(vec2 p){',
    '  p = fract(p * vec2(123.34, 456.21));',
    '  p += dot(p, p + 45.32);',
    '  return fract(p.x * p.y);',
    '}',
    'float noise(vec2 p){',
    '  vec2 i = floor(p), f = fract(p);',
    '  f = f * f * (3.0 - 2.0 * f);',
    '  float a = hash(i);',
    '  float b = hash(i + vec2(1.0, 0.0));',
    '  float c = hash(i + vec2(0.0, 1.0));',
    '  float d = hash(i + vec2(1.0, 1.0));',
    '  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);',
    '}',
    'float fbm(vec2 p){',
    '  float v = 0.0, a = 0.5;',
    '  mat2 r = mat2(0.8, 0.6, -0.6, 0.8);',
    '  for (int i = 0; i < 4; i++) {',
    '    v += a * noise(p);',
    '    p = r * p * 2.02;',
    '    a *= 0.5;',
    '  }',
    '  return v;',
    '}',
    'void main(){',
    '  vec2 uv = vUv;',
    '  float aspect = uRes.x / max(1.0, uRes.y);',
    '  vec2 p = vec2((uv.x - 0.5) * aspect, uv.y - 0.5);',
    '  // cPolarAngle 80 + rotationX 50: plano casi de perfil',
    '  vec2 q = vec2(p.x * 1.15, p.y * 4.2);',
    '  // rotationZ -60: el flujo cruza en diagonal',
    '  float ca = cos(-1.0472), sa = sin(-1.0472);',
    '  q = mat2(ca, sa, -sa, ca) * q;',
    '  float t = uTime * 0.3;',
    '  vec2 w = vec2(fbm(q * 1.5 + vec2(0.0, t * 0.25)),',
    '                fbm(q * 1.5 + vec2(5.2, -t * 0.2)));',
    '  float f = fbm(q * 1.5 + w * 1.5 + vec2(t * 0.12, 0.0));',
    '  vec3 negro    = vec3(0.027, 0.043, 0.086);',
    '  vec3 pizarra  = vec3(0.086, 0.157, 0.290);',
    '  vec3 lunaAzul = vec3(0.300, 0.450, 0.700);',
    '  vec3 col = mix(negro, pizarra, smoothstep(0.22, 0.72, f));',
    '  col = mix(col, lunaAzul, smoothstep(0.60, 0.94, f) * (0.26 + uNivel * 0.14));',
    '  vec2 moonPos = uMoon;',
    '  float d = length(p - moonPos);',
    '  float disco = 1.0 - smoothstep(0.052, 0.072, d);',
    '  float halo = exp(-d * 4.0) * 0.30;',
    '  col += vec3(0.78, 0.87, 1.0) * (disco * 0.55 + halo);',
    '  float columna = exp(-abs(p.x - moonPos.x) * 6.0) * (1.0 - smoothstep(-0.55, 0.25, p.y));',
    '  float brillo = fbm(vec2(p.x * 11.0, p.y * 3.0 - t * 0.8));',
    '  col += vec3(0.42, 0.60, 0.95) * columna * brillo * 0.30;',
    '  col += (hash(uv * uRes + fract(t * 7.0)) - 0.5) * 0.022;',
    '  col *= 1.0 - 0.5 * smoothstep(0.35, 0.95, length(p));',
    '  col *= 0.86;',
    '  gl_FragColor = vec4(col, 1.0);',
    '}'
  ].join('\n');

  function compilarFondo(gl, tipo, fuente) {
    const sh = gl.createShader(tipo);
    gl.shaderSource(sh, fuente);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.warn('Fondo shader:', gl.getShaderInfoLog(sh));
      gl.deleteShader(sh);
      return null;
    }
    return sh;
  }

  function initFondo() {
    if (!fondoCanvas) return;
    let gl = null;
    try {
      const op = { alpha: true, antialias: false, depth: false, stencil: false,
                   powerPreference: 'low-power' };
      gl = fondoCanvas.getContext('webgl', op) || fondoCanvas.getContext('experimental-webgl', op);
    } catch (e) { gl = null; }
    if (!gl) return;

    const vs = compilarFondo(gl, gl.VERTEX_SHADER, VERT_FONDO);
    const fs = compilarFondo(gl, gl.FRAGMENT_SHADER, FRAG_FONDO);
    if (!vs || !fs) return;
    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.warn('Fondo link:', gl.getProgramInfoLog(prog));
      return;
    }

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    gl.clearColor(0, 0, 0, 0);

    GL = {
      gl, prog, buf,
      uRes: gl.getUniformLocation(prog, 'uRes'),
      uTime: gl.getUniformLocation(prog, 'uTime'),
      uNivel: gl.getUniformLocation(prog, 'uNivel'),
      uMoon: gl.getUniformLocation(prog, 'uMoon'),
      t0: performance.now(), ultimo: 0
    };
    fondoCanvas.dataset.gl = 'ok';
    resizeFondo();
  }

  function resizeFondo() {
    if (!GL) return;
    const w = Math.max(1, stage.clientWidth), h = Math.max(1, stage.clientHeight);
    // El agua es suave: se dibuja a menos resolución y el CSS la estira.
    const factor = Math.min(mobile() ? 0.5 : 0.62, 1280 / w, 900 / h);
    fondoCanvas.width = Math.max(1, Math.round(w * factor));
    fondoCanvas.height = Math.max(1, Math.round(h * factor));
    GL.gl.viewport(0, 0, fondoCanvas.width, fondoCanvas.height);
  }

  function dibujarFondo(now) {
    if (!GL || now - GL.ultimo < (mobile() ? 40 : 30)) return;  // 25 / 30 fps
    GL.ultimo = now;
    const g = GL.gl;
    g.useProgram(GL.prog);
    g.uniform2f(GL.uRes, fondoCanvas.width, fondoCanvas.height);
    // En escritorio la luna va más arriba para que no la tapen los discos.
    const aspect = fondoCanvas.width / Math.max(1, fondoCanvas.height);
    g.uniform2f(GL.uMoon, (mobile() ? 0.28 : 0.18) * aspect, mobile() ? 0.30 : 0.40);
    g.uniform1f(GL.uTime, reduced ? 8 : 8 + (now - GL.t0) / 1000);
    g.uniform1f(GL.uNivel, musica.nivel || 0);
    g.drawArrays(g.TRIANGLES, 0, 3);
  }

  function iniciarAudioFrame() {
    if (musica.raf || document.hidden) return;
    musica.ultimo = 0;
    musica.raf = requestAnimationFrame(frameAudio);
  }

  function frameAudio(now) {
    musica.raf = 0;
    if (document.hidden) return;
    const dt = musica.ultimo ? clamp((now - musica.ultimo) / 1000, 0, 0.05) : 0;
    musica.ultimo = now;
    dibujarFondo(now);
    leerNivelAudio(dt);
    dibujarParticulas(dt, musica.nivel, musica.estallido);
    actualizarLetra();
    musica.raf = requestAnimationFrame(frameAudio);
  }

  /* ------------------------------------------------------- metadatos + UI */
  function actualizarMeta() {
    const d = DISCOS[state.target];
    elCont.textContent = String(state.target + 1).padStart(2, '0') + ' / ' + String(N).padStart(2, '0');
    elDet.textContent = 'Disco ' + (state.target + 1) + ' de ' + N +
      '. Arrastrá el disco para girarlo; Espacio muestra su reverso metálico.';
    btnPrev.disabled = state.target <= 0;
    btnNext.disabled = state.target >= N - 1;
    if (!respaldo.hidden) {
      respaldoImg.src = d.archivo;
      respaldoImg.alt = 'Disco ' + (state.target + 1) + ' de ' + N;
      respaldo.href = d.archivo;
    }
  }

  function toggleDetalle(v) {
    state.detalle = typeof v === 'boolean' ? v : !state.detalle;
    elDet.hidden = !state.detalle;
  }

  /* --------------------------------------------------------- navegación */
  function goTo(i, immediate) {
    if (state.paused) return;
    i = clamp(Math.round(i), 0, N - 1);
    const changed = i !== state.target;
    state.target = i;
    if (immediate || reduced) {
      state.anim = null;
      state.sel = i;
      state.prevSel = i;
      state.vel = 0;
    } else {
      state.anim = { from: state.sel, to: i, t0: state.time, dur: 0.46 };
    }
    if (changed) {
      resetFlips(i);
      actualizarMeta();
      if (!immediate) reproducirDelDisco(i);
      // Giro completo y más lento del disco recién seleccionado
      if (!immediate && !reduced && T) {
        const d = T.discos[i];
        d.turno = 0;
        d.turnoAnim = { t: 0, dur: 3.4 };
      }
    }
    wake();
  }
  const step = (d) => goTo(state.target + d);

  function resetFlips(keep) {
    if (!T) return;
    T.discos.forEach((d, i) => { if (i !== keep) d.flipTarget = 0; });
  }

  function flipSelected() {
    if (state.paused || !T) return;
    const d = T.discos[state.target];
    d.flipTarget = d.flipTarget > 0.5 ? 0 : PI;
    if (reduced) d.flip = d.flipTarget;
    wake();
  }

  function replay() {
    if (!T) return;
    state.paused = false;
    btnPausa.setAttribute('aria-pressed', 'false');
    btnPausa.textContent = 'Pause';
    toggleDetalle(false);
    T.discos.forEach((d) => {
      d.flip = 0; d.flipTarget = 0; d.idle = 0; d.turno = 0; d.turnoAnim = null;
      d.spin.angle = 0; d.spin.vel = 0; d.spin.sv = 0;
      d.spin.dragging = false; d.spin.soltando = false;
    });
    const ruedaReset = rueda;
    ruedaReset.acc = 0; ruedaReset.dir = 0; ruedaReset.exigirSubida = false;
    goTo(0, true);
    actualizarMeta();
    wake();
  }

  /* =========================================================== 3D (three) */
  function crearGeometrias(THREE) {
    const g = {};
    const ring = () => {
      const r = new THREE.RingGeometry(0.24, 0.974, 220, 1);
      const p = r.attributes.position, uv = r.attributes.uv;
      for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) * 0.5 + 0.5, p.getY(i) * 0.5 + 0.5);
      return r;
    };
    g.front = ring();
    g.back = ring();

    // Canto oscuro: torno de 256 segmentos con bisel fino (no un cilindro)
    const perfil = [
      [0.974, 0.005], [0.993, 0.005], [1, 0.002], [1, -0.002], [0.993, -0.005], [0.974, -0.005]
    ].map(([r, y]) => new THREE.Vector2(r, y));
    g.edge = new THREE.LatheGeometry(perfil, 256);
    g.edge.rotateX(PI / 2);

    // Bandas del centro con superficies corrugadas y abertura real
    const banda = (r0, r1, espesor, rc, seg) => {
      const h = espesor / 2, up = [], lo = [];
      for (let k = 0; k <= 6; k++) {
        const t = k / 6, r = r0 + (r1 - r0) * t;
        const alto = h * (1 - rc) + h * rc * (0.6 + 0.4 * Math.cos(3 * PI * t));
        up.push(new THREE.Vector2(r, alto));
        lo.push(new THREE.Vector2(r, -alto));
      }
      const pts = up.concat(lo.reverse());
      pts.push(pts[0].clone());
      const geo = new THREE.LatheGeometry(pts, seg);
      geo.rotateX(PI / 2);
      return geo;
    };
    const E = 0.0102;
    g.frost = banda(0.14, 0.174, E * 0.96, 0.4, 128);
    g.matrix = banda(0.174, 0.214, E * 0.88, 0.12, 128);
    g.clear = banda(0.214, 0.24, E, 0.22, 160);
    return g;
  }

  function texNormal(THREE, tipo, renderer) {
    const S = mobile() ? 256 : 512;
    const c = document.createElement('canvas');
    c.width = c.height = S;
    const x = c.getContext('2d');
    x.fillStyle = '#808080'; x.fillRect(0, 0, S, S);
    const r = rng(tipo === 'front' ? 3 : 11);
    if (tipo === 'front') {
      for (let i = 0; i < 5000; i++) {
        const v = 128 + (r() - 0.5) * 60;
        x.fillStyle = `rgb(${v},${v},${v})`;
        x.fillRect(r() * S, r() * S, 1 + r() * 1.5, 1 + r() * 1.5);
      }
      for (let i = 0; i < 70; i++) {
        const b = r() > .5 ? 255 : 0;
        x.strokeStyle = `rgba(${b},${b},${b},.12)`;
        x.lineWidth = 0.6;
        x.beginPath();
        const a = r() * S, bb = r() * S, l = 20 + r() * 120, an = r() * PI * 2;
        x.moveTo(a, bb); x.lineTo(a + Math.cos(an) * l, bb + Math.sin(an) * l);
        x.stroke();
      }
    }
    const src = x.getImageData(0, 0, S, S).data;
    const h = new Float32Array(S * S);
    for (let y = 0; y < S; y++) {
      for (let xx = 0; xx < S; xx++) {
        let v = src[(y * S + xx) * 4] / 255;
        if (tipo === 'back') {
          const dx = xx / S - 0.5, dy = y / S - 0.5;
          const rad = Math.sqrt(dx * dx + dy * dy) * 2;
          v = 0.5 + 0.5 * Math.sin(rad * 3.2) * 0.5 + (r() - 0.5) * 0.04;
        } else {
          // Surcos en el relieve, solo en el anillo visible del disco.
          const dx = xx / S - 0.5, dy = y / S - 0.5;
          const rad = Math.sqrt(dx * dx + dy * dy);
          const dentro = clamp((rad - 0.22) / 0.04, 0, 1) *
                         clamp((0.5 - rad) / 0.04, 0, 1);
          v = clamp(v + Math.sin(rad * 620) * 0.03 * dentro, 0, 1);
        }
        h[y * S + xx] = v;
      }
    }
    const out = x.createImageData(S, S);
    const k = 3.0;
    for (let y = 0; y < S; y++) {
      for (let xx = 0; xx < S; xx++) {
        const l = h[y * S + ((xx - 1 + S) % S)], rr = h[y * S + ((xx + 1) % S)];
        const u = h[((y - 1 + S) % S) * S + xx], d = h[((y + 1) % S) * S + xx];
        let nx = (l - rr) * k, ny = (u - d) * k, nz = 1;
        const len = Math.hypot(nx, ny, nz);
        nx /= len; ny /= len; nz /= len;
        const i = (y * S + xx) * 4;
        out.data[i] = (nx * 0.5 + 0.5) * 255;
        out.data[i + 1] = (ny * 0.5 + 0.5) * 255;
        out.data[i + 2] = (nz * 0.5 + 0.5) * 255;
        out.data[i + 3] = 255;
      }
    }
    x.putImageData(out, 0, 0);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = Math.min(mobile() ? 4 : 8, renderer.capabilities.getMaxAnisotropy());
    return t;
  }

  function texHub(THREE) {
    const c = document.createElement('canvas');
    c.width = 8; c.height = 256;
    const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, '#d9dde4'); g.addColorStop(0.42, '#f0f2f5');
    g.addColorStop(0.72, '#cfd4dc'); g.addColorStop(1, '#b8bec8');
    x.fillStyle = g; x.fillRect(0, 0, 8, 256);
    x.fillStyle = 'rgba(255,255,255,.45)';
    for (let y = 6; y < 256; y += 9) x.fillRect(0, y, 8, 1);
    const t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    return t;
  }

  function entornoPMREM(THREE, renderer) {
    const s = new THREE.Scene();
    const geos = [], mats = [];
    const sala = new THREE.BoxGeometry(24, 24, 24);
    const mSala = new THREE.MeshBasicMaterial({ color: 0x70737a, side: THREE.BackSide });
    s.add(new THREE.Mesh(sala, mSala));
    geos.push(sala); mats.push(mSala);
    const mLuz = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
    mLuz.color.setRGB(7, 7, 7);
    mats.push(mLuz);
    const franja = new THREE.PlaneGeometry(1.3, 16);
    geos.push(franja);
    for (let i = 0; i < 10; i += 2) {
      const a = (i / 10) * PI * 2;
      const m = new THREE.Mesh(franja, mLuz);
      m.position.set(Math.cos(a) * 11.5, 0, Math.sin(a) * 11.5);
      m.lookAt(0, 0, 0);
      s.add(m);
    }
    const techo = new THREE.PlaneGeometry(14, 2.4);
    geos.push(techo);
    const t = new THREE.Mesh(techo, mLuz);
    t.position.set(0, 11.5, 0); t.rotation.x = PI / 2;
    s.add(t);
    const pm = new THREE.PMREMGenerator(renderer);
    const rt = pm.fromScene(s, 0.04);
    pm.dispose();
    geos.forEach((g) => g.dispose());
    mats.forEach((m) => m.dispose());
    return rt;
  }

  function crearDisco(THREE, geo, mats, disco, normalFront, renderer) {
    const rootObj = new THREE.Object3D();
    const flipPivot = new THREE.Object3D();
    const spinPivot = new THREE.Object3D();
    rootObj.add(flipPivot); flipPivot.add(spinPivot);

    const aniso = Math.min(mobile() ? 4 : 8, renderer.capabilities.getMaxAnisotropy());
    const tex = new THREE.CanvasTexture(disco.canvas);
    tex.encoding = THREE.sRGBEncoding;
    tex.anisotropy = aniso;
    const front = new THREE.MeshPhysicalMaterial({
      map: tex, roughness: 0.42, metalness: 0.48, clearcoat: 0.8,
      normalMap: normalFront, normalScale: new THREE.Vector2(0.38, 0.38)
    });

    const texBack = new THREE.CanvasTexture(disco.canvasBack);
    texBack.encoding = THREE.sRGBEncoding;
    texBack.anisotropy = aniso;
    const back = mats.back.clone();
    back.color.setHex(0xffffff);
    back.map = texBack;
    back.roughness = 0.34;
    back.metalness = 0.55;
    back.needsUpdate = true;

    const mf = new THREE.Mesh(geo.front, front);
    mf.position.z = 0.005;
    const mb = new THREE.Mesh(geo.back, back);
    mb.position.z = -0.005; mb.rotation.y = PI;   // winding invertida
    const me = new THREE.Mesh(geo.edge, mats.edge);
    const m1 = new THREE.Mesh(geo.frost, mats.frost);
    const m2 = new THREE.Mesh(geo.matrix, mats.matrix);
    const m3 = new THREE.Mesh(geo.clear, mats.clear);
    spinPivot.add(mf, mb, me, m1, m2, m3);

    return {
      root: rootObj, flipPivot, spinPivot, front, tex, back, texBack,
      cur: null, flip: 0, flipTarget: 0, idle: 0, turno: 0, turnoAnim: null,
      spin: { angle: 0, vel: 0, dragging: false, soltando: false, sv: 0, t: 0 }
    };
  }

  async function montar3D() {
    if (T || !window.THREE) return;
    if (!arteListo) arteListo = Promise.all(DISCOS.map(prepararArte));
    await arteListo;
    if (T || !window.THREE) return;
    const THREE = window.THREE;
    let renderer;
    try {
      // Fondo transparente para que se vea el agua/luna dibujada en #fondo.
      renderer = new THREE.WebGLRenderer({
        antialias: !mobile(), alpha: true,
        powerPreference: mobile() ? 'low-power' : 'high-performance'
      });
    } catch (e) { return activarRespaldo(); }
    if (!renderer.getContext()) return activarRespaldo();

    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.86;
    renderer.setClearColor(0x000000, 0);
    glHost.appendChild(renderer.domElement);
    renderer.domElement.setAttribute('aria-hidden', 'true');

    const scene = new THREE.Scene();
    const envRT = entornoPMREM(THREE, renderer);
    scene.environment = envRT.texture;
    scene.environmentIntensity = 1;

    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 50);
    camera.position.set(0, 0, 4.4);

    const key = new THREE.DirectionalLight(0xffe2c2, 0.75); key.position.set(3.5, -8, 4);
    const fill = new THREE.AmbientLight(0xffffff, 0.3);
    const rim = new THREE.DirectionalLight(0x499ff5, 0.75); rim.position.set(-4, 3, -5);
    const top = new THREE.DirectionalLight(0xffffff, 1.9); top.position.set(0, 9, 2);
    scene.add(key, fill, rim, top);

    const world = new THREE.Object3D();
    world.rotation.x = world.rotation.y = -30 * PI / 180;
    world.scale.setScalar(1.08);
    scene.add(world);

    const geo = crearGeometrias(THREE);
    const matHub = texHub(THREE);
    const normalFront = texNormal(THREE, 'front', renderer);
    const normalBack = texNormal(THREE, 'back', renderer);
    const mats = {
      back: new THREE.MeshPhysicalMaterial({
        color: 0x1a1e2a, roughness: 0.23, metalness: 1, clearcoat: 0.34,
        iridescence: 0.38, ior: 1.86, iridescenceIOR: 1.86,
        iridescenceThicknessRange: [900, 900], // 900 nm
        normalMap: normalBack, normalScale: new THREE.Vector2(0.5, 0.5)
      }),
      edge: new THREE.MeshStandardMaterial({ color: 0x16161c, roughness: 0.22, metalness: 0.65, side: THREE.DoubleSide }),
      clear: new THREE.MeshPhysicalMaterial({
        color: 0x1d1d24, roughness: 0.38, transmission: 0.28, thickness: 0.35, ior: 2,
        transparent: true, side: THREE.DoubleSide
      }),
      matrix: new THREE.MeshPhysicalMaterial({
        color: 0xffffff, map: matHub, roughness: 0.28, metalness: 0.82, side: THREE.DoubleSide
      }),
      frost: new THREE.MeshPhysicalMaterial({
        color: 0x22222a, roughness: 0.547, transmission: 0.1, ior: 1.5, thickness: 0.2,
        transparent: true, side: THREE.DoubleSide
      })
    };

    const discos = DISCOS.map((d) => {
      const obj = crearDisco(THREE, geo, mats, d, normalFront, renderer);
      world.add(obj.root);
      return obj;
    });

    T = {
      THREE, renderer, scene, camera, world, discos, geo, mats, envRT,
      texturas: [matHub, normalFront, normalBack],
      lights: [key, fill, rim, top],
      w: 1, h: 1, dpr: 1,
      scr: { t: 0, j: [[], []], jt: 0, on: false, cx: 0, cy: 0 }
    };

    renderer.domElement.addEventListener('webglcontextlost', onContextLost, false);

    resize();
    layoutInmediato();
    actualizarMeta();
    wake();
  }

  /* --------------------------------------------------------- layout 3D */
  function objetivo(m) {
    const am = Math.abs(m);
    if (mobile()) {
      const k = Math.min(am, 2.5);
      const sel = 1 - Math.min(1, am);
      return { x: 2.2 * m, y: -k, z: -0.5 * k, s: lerp(0.6, 1.5, sel), yaw: 0, lift: 0 };
    }
    const th = 0.35 * m;
    const sel = 1 - Math.min(1, am);
    return {
      x: Math.sin(th) * 2.3 * 2.4, y: 0.06 * sel, z: (1 - Math.cos(th)) * 2.4,
      s: lerp(0.8, 1, sel), yaw: -th
    };
  }

  function layoutInmediato() {
    T.discos.forEach((d, i) => { d.cur = objetivo(i - state.sel); aplicarDisco(d, 0, 0); });
    ajustar();
  }

  function aplicarDisco(d, lean, dip) {
    const c = d.cur;
    d.root.position.set(c.x, c.y - dip, c.z);
    d.root.scale.setScalar(c.s);
    d.root.rotation.set(0, c.yaw + lean, lean * 0.32);  // bank = .32 * lean
    d.flipPivot.rotation.y = d.flip;
    d.spinPivot.rotation.z = d.spin.angle + d.idle + d.turno;
  }

  // Búsqueda binaria (24 pasos) de una escala uniforme del padre
  function ajustar() {
    if (!T) return;
    const { THREE, world, camera } = T;
    camera.updateMatrixWorld();   // projector necesita matrixWorldInverse vigente
    const m = mobile();
    const mx = m ? 0.1 : 0.16, my = m ? 0.3 : 0.34;
    const s = m ? 1.5 : 1, lift = m ? 0 : 0.06;
    const v = new THREE.Vector3();
    const cabe = (esc) => {
      world.scale.setScalar(esc);
      world.updateMatrixWorld(true);
      for (let k = 0; k < 32; k++) {
        const a = (k / 32) * PI * 2;
        v.set(Math.cos(a) * s, Math.sin(a) * s + lift, 0);
        world.localToWorld(v);
        v.project(camera);
        if (Math.abs(v.x) > 1 - mx || Math.abs(v.y) > 1 - my) return false;
      }
      return true;
    };
    let lo = 0.1, hi = 2.6;
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      if (cabe(mid)) lo = mid; else hi = mid;
    }
    world.scale.setScalar(lo);
    world.updateMatrixWorld(true);
  }

  let timerResize = 0;
  function programarResize() {
    clearTimeout(timerResize);
    timerResize = setTimeout(resize, 120);
  }

  function resize() {
    resizeParticulas();
    resizeFondo();
    if (!T) return;
    const w = Math.max(1, stage.clientWidth), h = Math.max(1, stage.clientHeight);
    const dpr = Math.min(window.devicePixelRatio || 1, mobile() ? 1.25 : 1.5);
    T.w = w; T.h = h; T.dpr = dpr;
    T.renderer.setPixelRatio(dpr);
    T.renderer.setSize(w, h, false);
    T.camera.aspect = w / h;
    T.camera.updateProjectionMatrix();
    scrib.width = Math.round(w * dpr); scrib.height = Math.round(h * dpr);
    sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ajustar();
    T.discos.forEach((d, i) => { d.cur = objetivo(i - state.sel); aplicarDisco(d, 0, 0); });
    wake();
  }

  /* ------------------------------------------------------- actualización */
  function actualizar(dt) {
    let activo = false;

    if (state.anim) {
      const k = (state.time - state.anim.t0) / state.anim.dur;
      if (k >= 1) { state.sel = state.anim.to; state.anim = null; }
      else state.sel = lerp(state.anim.from, state.anim.to, easeSel(k));
      activo = true;
    }
    const crudo = dt > 0 ? (state.sel - state.prevSel) / dt : 0;
    state.vel = lerp(state.vel, crudo, damp(20, dt));
    state.prevSel = state.sel;
    if (Math.abs(state.vel) < 0.002) state.vel = 0;
    const v = state.vel;
    if (v !== 0) activo = true;

    const lean = clamp(0.055 * v, -0.3, 0.3);
    const dip = Math.min(0.09, 0.014 * Math.abs(v));

    T.discos.forEach((d, i) => {
      const m = i - state.sel;
      const o = objetivo(m);
      const rate = Math.abs(v) > 0.01 ? Math.max(6.5, 15 - 1.15 * Math.abs(m)) : 11;
      const k = reduced ? 1 : damp(rate, dt);
      let err = 0;
      for (const key of ['x', 'y', 'z', 's', 'yaw']) {
        const nuevo = lerp(d.cur[key], o[key], k);
        err = Math.max(err, Math.abs(nuevo - o[key]));
        d.cur[key] = nuevo;
      }
      if (err > 0.0005) activo = true;
      else for (const key of ['x', 'y', 'z', 's', 'yaw']) d.cur[key] = o[key];

      if (Math.abs(d.flip - d.flipTarget) > 0.001) {
        d.flip = reduced ? d.flipTarget : lerp(d.flip, d.flipTarget, damp(7, dt));
        activo = true;
      } else d.flip = d.flipTarget;

      const sp = d.spin;
      if (!sp.dragging && (sp.angle !== 0 || sp.vel !== 0)) {
        if (!sp.soltando) {
          sp.vel *= Math.pow(0.89, dt * 60);
          sp.angle += sp.vel * dt * 60;
          if (Math.abs(sp.vel) < 0.004) {
            sp.soltando = true; sp.t = 0;
            sp.angle = ((sp.angle + PI) % (PI * 2) + PI * 2) % (PI * 2) - PI;
            sp.sv = 0;
          }
        } else {
          const w = 9.5, c = 12;                 // resorte amortiguado
          sp.sv += (-w * w * sp.angle - c * sp.sv) * dt;
          sp.angle += sp.sv * dt;
          sp.t += dt;
          if ((Math.abs(sp.angle) < 0.0008 && Math.abs(sp.sv) < 0.001) || sp.t >= 1.2) {
            sp.angle = 0; sp.sv = 0; sp.vel = 0; sp.soltando = false;
          }
        }
        if (reduced) { sp.angle = 0; sp.vel = 0; sp.sv = 0; sp.soltando = false; }
        activo = true;
      }

      // Giro de selección: una vuelta completa al entrar
      if (d.turnoAnim) {
        const a = d.turnoAnim;
        a.t += dt;
        const k = clamp(a.t / a.dur, 0, 1);
        d.turno = (1 - Math.pow(1 - k, 3)) * PI * 2;
        if (k >= 1) { d.turno = 0; d.turnoAnim = null; }
        activo = true;
      }

      // Giro lento tipo vinilo mientras suena la música (muy por debajo de 33 rpm).
      const gira = !(state.dragging && state.dragging.modo === 'giro');
      const seleccionado = i === state.target;
      const vel = musica.reproduciendo
        ? (seleccionado ? 1.0 : 0.12)
        : (seleccionado ? 0.12 : 0);
      if (gira && vel > 0) {
        d.idle += dt * vel;
        activo = true;
      } else if (d.idle !== 0) {
        d.idle = lerp(d.idle, 0, damp(6, dt));
        if (Math.abs(d.idle) < 0.001) d.idle = 0;
        activo = true;
      }

      aplicarDisco(d, i === state.target || Math.abs(m) < 1.5 ? lean : lean * 0.6, dip);
    });

    if (state.dragging) activo = true;
    if (envRueda() > 0.01) activo = true;
    if (!reduced && (state.hover || state.focus || T.scr.t > 0)) activo = true;

    T.world.updateMatrixWorld(true);
    return activo;
  }

  /* ------------------------------------------------------- trazo (hover) */
  function proyectarDisco() {
    const { THREE, camera, discos } = T;
    camera.updateMatrixWorld();
    const d = discos[state.target];
    const v = new THREE.Vector3();
    const N24 = 24;
    const pts = [];
    d.root.updateMatrixWorld(true);
    v.set(0, 0, 0); d.root.localToWorld(v); v.project(camera);
    const cx = (v.x * 0.5 + 0.5) * T.w, cy = (-v.y * 0.5 + 0.5) * T.h;
    let R = 0;
    for (let k = 0; k < N24; k++) {
      const a = (k / N24) * PI * 2;
      v.set(Math.cos(a), Math.sin(a), 0); d.root.localToWorld(v); v.project(camera);
      const x = (v.x * 0.5 + 0.5) * T.w, y = (-v.y * 0.5 + 0.5) * T.h;
      pts.push([x, y]);
      R += Math.hypot(x - cx, y - cy);
    }
    return { cx, cy, R: R / N24, pts };
  }

  function dibujarTrazo(dt) {
    const S = T.scr;
    sctx.clearRect(0, 0, T.w, T.h);
    const visible = !reduced && (state.hover || state.focus) && !state.dragging;
    if (!visible) {
      if (S.t > 0 || S.pts) { S.t = 0; S.pts = null; }
      return;
    }
    const P = proyectarDisco();
    const NP = P.pts.length;
    if (!S.pts) { S.pts = P.pts.map((p) => p.slice()); S.t = 0; }
    const kk = damp(15, dt);
    for (let i = 0; i < NP; i++) {
      S.pts[i][0] = lerp(S.pts[i][0], P.pts[i][0], kk);
      S.pts[i][1] = lerp(S.pts[i][1], P.pts[i][1], kk);
    }
    S.cx = lerp(S.cx || P.cx, P.cx, kk); S.cy = lerp(S.cy || P.cy, P.cy, kk);
    S.t += dt;
    S.jt += dt;
    if (S.jt >= 0.1 || !S.j[0].length) {            // jitter nuevo a 10 Hz
      S.jt = 0;
      for (let L = 0; L < 2; L++) S.j[L] = Array.from({ length: NP }, () => (Math.random() * 2 - 1) * 0.028);
    }
    const draw = 0.68, sweep = 0.4, pad = 0.06, gap = 0.045;
    sctx.lineCap = 'round'; sctx.lineJoin = 'round';
    sctx.strokeStyle = 'rgba(226,230,242,0.55)';
    sctx.lineWidth = Math.max(1.2, 0.012 * P.R);
    for (let L = 0; L < 2; L++) {
      const p = clamp((S.t - L * draw * sweep) / draw, 0, 1);
      if (p <= 0) continue;
      const e = 1 - Math.pow(1 - p, 3);
      const total = NP + 2;
      const n = Math.max(2, Math.floor(e * total));
      const esc = 1 + pad + L * gap;
      const q = [];
      for (let k = 0; k <= n; k++) {
        const i = (k + L * 5) % NP;
        const f = esc + S.j[L][i];
        q.push([S.cx + (S.pts[i][0] - S.cx) * f, S.cy + (S.pts[i][1] - S.cy) * f]);
      }
      sctx.beginPath();
      sctx.moveTo(q[0][0], q[0][1]);
      for (let k = 1; k < q.length - 1; k++) {
        const mx = (q[k][0] + q[k + 1][0]) / 2, my = (q[k][1] + q[k + 1][1]) / 2;
        sctx.quadraticCurveTo(q[k][0], q[k][1], mx, my);
      }
      sctx.lineTo(q[q.length - 1][0], q[q.length - 1][1]);
      if (e >= 1) sctx.closePath();                 // lazos cerrados
      sctx.stroke();
    }
  }

  /* --------------------------------------------------------- bucle de render */
  let raf = 0, last = 0, visibleEnPantalla = true, montado = false;

  function puedeCorrer() {
    return T && !state.paused && visibleEnPantalla && !document.hidden && !contextoPerdido;
  }

  function wake() {
    if (raf || !puedeCorrer()) return;
    last = performance.now();           // sin salto de tiempo al reanudar
    raf = requestAnimationFrame(frame);
  }

  function frame(now) {
    raf = 0;
    if (!puedeCorrer()) return;
    const dt = clamp((now - last) / 1000, 0, 0.05);
    last = now;
    state.time += dt;
    const activo = actualizar(dt);
    T.renderer.render(T.scene, T.camera);
    dibujarTrazo(dt);
    if (activo) raf = requestAnimationFrame(frame);
  }

  /* ------------------------------------------------------------ rueda (wheel) */
  const rueda = { acc: 0, dir: 0, lastEvt: 0, lastStep: 0, prevAbs: 0, exigirSubida: false };
  function envRueda() {
    if (!rueda.acc) return 0;
    const dt = performance.now() - rueda.lastEvt;
    return Math.abs(rueda.acc) * Math.exp(-dt / 550);
  }

  function onWheel(e) {
    e.preventDefault();
    if (state.paused) return;
    const raw = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    const ab = Math.abs(raw);
    if (ab < 0.3) return;
    const now = performance.now();
    const d = clamp(raw, -24, 24);
    const dir = Math.sign(d);
    const gap = now - rueda.lastEvt;

    if (gap > 150) { rueda.acc = 0; rueda.prevAbs = 0; rueda.dir = 0; }
    if (gap > 130) rueda.exigirSubida = true;
    rueda.acc *= Math.exp(-Math.min(gap, 1000) / 550);
    if (dir !== rueda.dir) { rueda.acc = 0; rueda.dir = dir; rueda.exigirSubida = true; }
    rueda.acc += d;
    const mag = Math.abs(d);
    if (rueda.exigirSubida) {
      if (mag > rueda.prevAbs) rueda.exigirSubida = false;
    }
    rueda.prevAbs = mag;
    rueda.lastEvt = now;

    if (!rueda.exigirSubida && Math.abs(rueda.acc) >= 6) {
      const flick = mag >= 12;
      const limite = flick ? 190 : 90;
      if (now - rueda.lastStep >= limite) {
        rueda.lastStep = now;
        rueda.acc = 0;
        step(dir);
      }
    }
  }

  /* ------------------------------------------------------------ puntero */
  function onPointerDown(e) {
    if (state.paused || !T || (e.pointerType === 'mouse' && e.button !== 0)) return;
    stage.focus({ preventScroll: true });
    const r = stage.getBoundingClientRect();
    const px = e.clientX - r.left, py = e.clientY - r.top;
    const P = proyectarDisco();
    const enDisco = P ? Math.hypot(px - P.cx, py - P.cy) < P.R * 1.02 : false;
    state.dragging = {
      id: e.pointerId, x0: e.clientX, y0: e.clientY, px, py, modo: null,
      sel0: state.sel, enDisco, cx: P ? P.cx : 0, cy: P ? P.cy : 0, R: P ? P.R : 0,
      a0: P ? Math.atan2(py - P.cy, px - P.cx) : 0
    };
    state.anim = null;
    try { stage.setPointerCapture(e.pointerId); } catch (err) { /* ok */ }
    wake();
  }

  function onPointerMove(e) {
    const r = stage.getBoundingClientRect();
    const px = e.clientX - r.left, py = e.clientY - r.top;
    const dr = state.dragging;
    if (!dr) {
      if (T && !state.paused) {
        const P = proyectarDisco();
        const dentro = P ? Math.hypot(px - P.cx, py - P.cy) < P.R * 1.05 : false;
        if (dentro !== state.hover) {
          state.hover = dentro;
          if (!dentro && T) T.scr.pts = null;
          wake();
        }
      }
      return;
    }
    if (e.pointerId !== dr.id) return;
    const dx = e.clientX - dr.x0, dy = e.clientY - dr.y0;
    if (!dr.modo) {
      if (Math.hypot(dx, dy) < 5) return;
      if (Math.abs(dx) >= Math.abs(dy)) dr.modo = 'sel';
      else if (dr.enDisco) dr.modo = 'giro';
      else dr.modo = 'ignorar';
      if (dr.modo === 'giro') {
        const sp = T.discos[state.target].spin;
        sp.dragging = true; sp.soltando = false; sp.vel = 0; sp.sv = 0;
        dr.a0 = Math.atan2(py - dr.cy, px - dr.cx);
      }
    }
    if (dr.modo === 'sel') {
      const px1 = Math.max(140, T.w * 0.22);
      state.sel = clamp(dr.sel0 - dx / px1, 0, N - 1);
      wake();
    } else if (dr.modo === 'giro') {
      const a = Math.atan2(py - dr.cy, px - dr.cx);
      let da = a - dr.a0;
      if (da > PI) da -= PI * 2; if (da < -PI) da += PI * 2;
      dr.a0 = a;
      const sp = T.discos[state.target].spin;
      const delta = -da * 0.95;                      // sensibilidad .95
      sp.angle += delta;
      sp.vel = clamp(lerp(sp.vel, delta, 0.32), -0.5, 0.5);
      wake();
    }
  }

  function onPointerUp(e) {
    const dr = state.dragging;
    if (!dr || e.pointerId !== dr.id) return;
    state.dragging = null;
    try { stage.releasePointerCapture(e.pointerId); } catch (err) { /* ok */ }
    if (dr.modo === 'sel') {
      const destino = clamp(Math.round(state.sel + state.vel * 0.1), 0, N - 1);
      goTo(destino);
    } else if (dr.modo === 'giro') {
      const sp = T.discos[state.target].spin;
      sp.dragging = false;
      sp.vel = clamp(sp.vel, -0.5, 0.5);
      if (Math.abs(sp.vel) < 0.004) {
        sp.soltando = true; sp.t = 0;
        sp.angle = ((sp.angle + PI) % (PI * 2) + PI * 2) % (PI * 2) - PI;
      }
    } else if (!dr.modo) {
      const fuera = dr.px - dr.cx;
      if (Math.abs(fuera) > dr.R * 1.1) step(fuera > 0 ? 1 : -1);
    }
    wake();
  }

  function onPointerLeave() {
    if (state.dragging) return;
    state.hover = false;
    if (T) T.scr.pts = null;
    wake();
  }

  /* ------------------------------------------------------------ teclado */
  function onKey(e) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const k = e.key;
    let ok = true;
    if (k === 'ArrowLeft') step(-1);
    else if (k === 'ArrowRight') step(1);
    else if (k === 'Home') goTo(0);
    else if (k === 'End') goTo(N - 1);
    else if (k === ' ' || k === 'Spacebar') flipSelected();
    else if (k === 'Enter') toggleDetalle();
    else ok = false;
    if (ok) e.preventDefault();
  }

  /* ---------------------------------------------------- respaldo / contexto */
  let contextoPerdido = false;
  function activarRespaldo() {
    respaldo.hidden = false;
    glHost.hidden = true; scrib.hidden = true;
    actualizarMeta();
  }
  function onContextLost(e) {
    e.preventDefault();
    contextoPerdido = true;
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    activarRespaldo();
  }

  /* ------------------------------------------------------------ desmontar */
  const limpiezas = [];
  function destruir() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    clearTimeout(timerResize);
    timerResize = 0;
    detenerFade();
    if (musica.raf) cancelAnimationFrame(musica.raf);
    musica.raf = 0;
    try {
      musica.audio.pause();
      musica.audio.removeAttribute('src');
      musica.audio.load();
    } catch (e) { /* ok */ }
    musica.reproduciendo = false;
    limpiezas.forEach((f) => { try { f(); } catch (e) { /* ok */ } });
    limpiezas.length = 0;
    if (T) {
      T.discos.forEach((d) => {
        d.front.normalMap = null;
        d.front.dispose(); d.tex.dispose();
        if (d.back) { d.back.normalMap = null; d.back.dispose(); }
        if (d.texBack) d.texBack.dispose();
      });
      Object.values(T.geo).forEach((g) => g.dispose());
      Object.values(T.mats).forEach((m) => m.dispose());
      T.texturas.forEach((t) => t.dispose());
      T.envRT.dispose();
      T.renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      T.renderer.dispose();
      if (T.renderer.domElement.parentNode) T.renderer.domElement.parentNode.removeChild(T.renderer.domElement);
      T = null;
    }
  }

  /* ------------------------------------------------------------- arranque */
  function escuchar(el, ev, fn, opts) {
    el.addEventListener(ev, fn, opts);
    limpiezas.push(() => el.removeEventListener(ev, fn, opts));
  }

  async function init() {
    // El arte se decodifica recién cuando se monta el 3D: la página arranca ya.
    actualizarMeta();
    respaldoImg.src = DISCOS[0].archivo;

    initFondo();
    initParticulas();
    resizeParticulas();
    pintarBotonMusica();
    pintarBotonVolumen();
    musica.audio.volume = musica.volumen;
    iniciarAudioFrame();

    escuchar(musica.audio, 'play', () => {
      musica.reproduciendo = true;
      musica.pausada = false;
      musica.terminada = false;
      pintarBotonMusica();
      wake();
    });
    escuchar(musica.audio, 'pause', () => {
      musica.reproduciendo = false;
      musica.pausada = true;
      pintarBotonMusica();
    });
    escuchar(musica.audio, 'ended', () => {
      musica.reproduciendo = false;
      musica.pausada = true;
      musica.terminada = true;
      pintarBotonMusica();
    });
    escuchar(musica.audio, 'error', () => {
      mostrarErrorAudio('No se pudo cargar el MP3: ' + (musica.actual ? musica.actual.mp3 : 'audio'));
    });
    escuchar(river, 'animationend', (e) => {
      if (e.animationName !== 'riverImagen') return;
      river.classList.remove('activo');
      if (letraPanel) letraPanel.classList.remove('letra--river');
    });

    escuchar(stage, 'wheel', onWheel, { passive: false });
    escuchar(stage, 'pointerdown', onPointerDown);
    escuchar(stage, 'pointermove', onPointerMove);
    escuchar(stage, 'pointerup', onPointerUp);
    escuchar(stage, 'pointercancel', onPointerUp);
    escuchar(stage, 'pointerleave', onPointerLeave);
    escuchar(stage, 'keydown', onKey);
    escuchar(document, 'keydown', (e) => {
      if (e.target === document.body) onKey(e);
    });
    escuchar(stage, 'focus', () => { if (stage.matches(':focus-visible')) { state.focus = true; wake(); } });
    escuchar(stage, 'blur', () => { state.focus = false; if (T) T.scr.pts = null; wake(); });

    escuchar(btnPrev, 'click', () => step(-1));
    escuchar(btnNext, 'click', () => step(1));
    escuchar(btnFlip, 'click', flipSelected);
    escuchar(btnReplay, 'click', replay);
    escuchar(btnMusica, 'click', alternarMusica);
    escuchar(btnVolumen, 'click', alternarSilencio);
    escuchar(sliderVol, 'input', cambiarVolumen);
    escuchar(document, 'pointerdown', intentarDesbloquearAudio);
    escuchar(document, 'keydown', intentarDesbloquearAudio);
    escuchar(btnPausa, 'click', () => {
      state.paused = !state.paused;
      btnPausa.setAttribute('aria-pressed', String(state.paused));
      btnPausa.textContent = state.paused ? 'Resume' : 'Pause';
      if (state.paused) { if (raf) { cancelAnimationFrame(raf); raf = 0; } }
      else wake();
    });

    const onMq = () => {
      reduced = mqReduce.matches;
      if (reduced && T) {
        T.scr.pts = null; sctx.clearRect(0, 0, T.w, T.h);
        T.discos.forEach((d) => { d.turno = 0; d.turnoAnim = null; });
        goTo(state.target, true);
      }
      wake();
    };
    mqReduce.addEventListener ? escuchar(mqReduce, 'change', onMq) : mqReduce.addListener(onMq);

    escuchar(window, 'resize', programarResize);
    escuchar(window, 'pagehide', destruir);
    escuchar(document, 'visibilitychange', () => {
      if (!document.hidden) { wake(); iniciarAudioFrame(); }
    });

    // El primer disco arranca solo al abrir la página.
    reproducirDelDisco(0);

    if (!window.THREE) { activarRespaldo(); return; }

    // montaje perezoso: cerca del viewport
    const ioMontar = new IntersectionObserver((es) => {
      if (es.some((x) => x.isIntersecting) && !montado) { montado = true; montar3D().catch(activarRespaldo); ioMontar.disconnect(); }
    }, { rootMargin: '300px' });
    ioMontar.observe(root);
    limpiezas.push(() => ioMontar.disconnect());

    // pausa fuera de pantalla
    const ioVisible = new IntersectionObserver((es) => {
      visibleEnPantalla = es.some((x) => x.isIntersecting);
      if (visibleEnPantalla) wake();
    }, { threshold: 0 });
    ioVisible.observe(root);
    limpiezas.push(() => ioVisible.disconnect());

    if (window.ResizeObserver) {
      const ro = new ResizeObserver(programarResize);
      ro.observe(stage);
      limpiezas.push(() => ro.disconnect());
    }
  }

  init();
})();
