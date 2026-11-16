/* viz.js — gráficos leves (SVG) do Painel Biomedicina, sem bibliotecas externas.
   Barras empilhadas verticais (por ano) e horizontais (por docente), com tooltip,
   legenda, foco por teclado e tabela de dados para acessibilidade.
   Cores: variáveis --c1..--c5 de estilo.css (ordem fixa, validada para daltonismo). */
(function () {
  var NS = "http://www.w3.org/2000/svg";
  var fmt = function (n) { return Number(n).toLocaleString("pt-BR"); };
  function el(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function niceMax(v) {
    if (v <= 5) return 5;
    var p = Math.pow(10, Math.floor(Math.log10(v))), m = v / p;
    var n = m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10;
    return n * p;
  }
  /* Caminho de retângulo com cantos arredondados só no topo (ou à direita) */
  function roundedTop(x, y, w, h, r) {
    r = Math.min(r, w / 2, h);
    return "M" + x + "," + (y + h) + "V" + (y + r) + "Q" + x + "," + y + " " + (x + r) + "," + y +
      "H" + (x + w - r) + "Q" + (x + w) + "," + y + " " + (x + w) + "," + (y + r) + "V" + (y + h) + "Z";
  }
  function roundedRight(x, y, w, h, r) {
    r = Math.min(r, h / 2, w);
    return "M" + x + "," + y + "H" + (x + w - r) + "Q" + (x + w) + "," + y + " " + (x + w) + "," + (y + r) +
      "V" + (y + h - r) + "Q" + (x + w) + "," + (y + h) + " " + (x + w - r) + "," + (y + h) + "H" + x + "Z";
  }

  function legend(container, series) {
    if (series.length < 2) return;
    var lg = document.createElement("div");
    lg.className = "viz-legend";
    series.forEach(function (s) {
      var sp = document.createElement("span"), i = document.createElement("i");
      i.style.background = "var(" + s.cor + ")";
      sp.appendChild(i); sp.appendChild(document.createTextNode(s.nome));
      lg.appendChild(sp);
    });
    container.appendChild(lg);
  }

  function tooltip(container) {
    var t = document.createElement("div");
    t.className = "viz-tip"; t.setAttribute("role", "status");
    container.appendChild(t);
    return {
      show: function (titulo, linhas, total, x, y) {
        t.textContent = "";
        var h = document.createElement("div"); h.className = "t"; h.textContent = titulo; t.appendChild(h);
        linhas.forEach(function (l) {
          if (!l.v) return;
          var r = document.createElement("div"); r.className = "r";
          var k = document.createElement("span"); k.className = "k"; k.style.setProperty("--kc", "var(" + l.cor + ")"); k.textContent = l.nome;
          var b = document.createElement("b"); b.textContent = fmt(l.v);
          r.appendChild(k); r.appendChild(b); t.appendChild(r);
        });
        if (linhas.length > 1) {
          var r2 = document.createElement("div"); r2.className = "r"; r2.style.marginTop = "4px";
          var k2 = document.createElement("span"); k2.textContent = "Total";
          var b2 = document.createElement("b"); b2.textContent = fmt(total);
          r2.appendChild(k2); r2.appendChild(b2); t.appendChild(r2);
        }
        var cw = container.clientWidth, tw = t.offsetWidth;
        t.style.left = Math.max(0, Math.min(cw - tw, x - tw / 2)) + "px";
        t.style.top = Math.max(0, y - t.offsetHeight - 10) + "px";
        t.classList.add("on");
      },
      hide: function () { t.classList.remove("on"); }
    };
  }

  function tabela(container, cabecalho, linhas, rotulo) {
    var d = document.createElement("details");
    d.className = "disclosure viz-table";
    var s = document.createElement("summary"); s.textContent = rotulo || "Ver dados em tabela"; d.appendChild(s);
    var w = document.createElement("div"); w.className = "wrap";
    var tb = document.createElement("table"), thead = document.createElement("thead"), tr = document.createElement("tr");
    cabecalho.forEach(function (c) { var th = document.createElement("th"); th.textContent = c; tr.appendChild(th); });
    thead.appendChild(tr); tb.appendChild(thead);
    var tbody = document.createElement("tbody");
    linhas.forEach(function (l) {
      var r = document.createElement("tr");
      l.forEach(function (v, i) { var td = document.createElement("td"); td.textContent = i === 0 ? v : fmt(v); r.appendChild(td); });
      tbody.appendChild(r);
    });
    tb.appendChild(tbody); w.appendChild(tb); d.appendChild(w); container.appendChild(d);
  }

  /* Barras empilhadas verticais.
     opts: { categorias: ["2009",...], series: [{nome, cor:"--c1", valores:[...]}], altura } */
  function barrasEmpilhadas(container, opts) {
    container.textContent = "";
    container.classList.add("viz");
    legend(container, opts.series);
    var W = container.clientWidth || 640, H = opts.altura || 260;
    var m = { t: 8, r: 4, b: 26, l: 36 };
    var iw = W - m.l - m.r, ih = H - m.t - m.b, n = opts.categorias.length;
    var tot = opts.categorias.map(function (_, i) { return opts.series.reduce(function (a, s) { return a + (s.valores[i] || 0); }, 0); });
    var max = niceMax(Math.max.apply(null, tot.concat([1])));
    var svg = el("svg", { width: W, height: H, viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": opts.descricao || "" }, container);
    var g = el("g", { transform: "translate(" + m.l + "," + m.t + ")" }, svg);
    var ax = el("g", { class: "axis" }, g);
    var div = (max / 4) % 1 === 0 ? 4 : 5;
    for (var k = 0; k <= div; k++) {
      var v = max * k / div, y = ih - ih * k / div;
      if (k > 0) el("line", { class: "gridline", x1: 0, x2: iw, y1: y, y2: y }, ax);
      var tx = el("text", { x: -8, y: y + 4, "text-anchor": "end" }, ax); tx.textContent = fmt(v);
    }
    var step = iw / n, bw = Math.max(3, Math.min(28, step * 0.62));
    var every = Math.ceil(n / Math.max(1, Math.floor(iw / 44)));
    var tip = tooltip(container);
    opts.categorias.forEach(function (cat, i) {
      var cx = step * i + step / 2, x = cx - bw / 2, y0 = ih;
      var col = el("g", { class: "col", tabindex: 0, role: "img",
        "aria-label": cat + ": " + opts.series.map(function (s) { return s.nome + " " + (s.valores[i] || 0); }).join(", ") }, g);
      var visiveis = opts.series.filter(function (s) { return s.valores[i] > 0; });
      visiveis.forEach(function (s, j) {
        var h = ih * s.valores[i] / max, gap = j > 0 ? 2 : 0;
        var hh = Math.max(0, h - gap);
        var isTop = j === visiveis.length - 1;
        if (isTop) el("path", { class: "seg", d: roundedTop(x, y0 - h, bw, hh, 4), fill: "var(" + s.cor + ")" }, col);
        else el("rect", { class: "seg", x: x, y: y0 - h, width: bw, height: hh, fill: "var(" + s.cor + ")" }, col);
        y0 -= h;
      });
      var hit = el("rect", { class: "hit", x: step * i, y: 0, width: step, height: ih }, col);
      function on() {
        var r = container.getBoundingClientRect(), s = svg.getBoundingClientRect();
        tip.show(cat, opts.series.map(function (s) { return { nome: s.nome, cor: s.cor, v: s.valores[i] }; }), tot[i],
          s.left - r.left + m.l + cx, s.top - r.top + m.t + (ih - ih * tot[i] / max));
      }
      col.addEventListener("pointerenter", on); col.addEventListener("focus", on);
      col.addEventListener("pointerleave", tip.hide); col.addEventListener("blur", tip.hide);
      var ultimoRotulado = Math.floor((n - 1) / every) * every;
      if (i % every === 0 || (i === n - 1 && (n - 1 - ultimoRotulado) >= every * 0.7)) {
        var xl = el("text", { class: "xlab", x: cx, y: ih + 18, "text-anchor": "middle" }, g); xl.textContent = cat;
      }
    });
    el("line", { class: "baseline", x1: 0, x2: iw, y1: ih, y2: ih }, g);
    tabela(container, [opts.rotuloCategoria || "Ano"].concat(opts.series.map(function (s) { return s.nome; })).concat(opts.series.length > 1 ? ["Total"] : []),
      opts.categorias.map(function (c, i) {
        return [c].concat(opts.series.map(function (s) { return s.valores[i] || 0; })).concat(opts.series.length > 1 ? [tot[i]] : []);
      }));
  }

  /* Barras horizontais empilhadas, ordenadas pelo total.
     opts: { linhas: [{rotulo, valores:{chave:n}, href?}], series:[{chave, nome, cor}] } */
  function barrasHorizontais(container, opts) {
    container.textContent = "";
    container.classList.add("viz");
    legend(container, opts.series);
    var linhas = opts.linhas.map(function (l) {
      var t = opts.series.reduce(function (a, s) { return a + (l.valores[s.chave] || 0); }, 0);
      return { rotulo: l.rotulo, valores: l.valores, total: t, href: l.href };
    }).sort(function (a, b) { return b.total - a.total; });
    var W = container.clientWidth || 640, rowH = 26, labW = Math.min(220, W * 0.38), valW = 44;
    var H = linhas.length * rowH + 4, iw = W - labW - valW;
    var max = Math.max.apply(null, linhas.map(function (l) { return l.total; }).concat([1]));
    var svg = el("svg", { width: W, height: H, viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": opts.descricao || "" }, container);
    var tip = tooltip(container);
    linhas.forEach(function (l, i) {
      var y = i * rowH, bh = 16, by = y + (rowH - bh) / 2;
      var row = el("g", { class: "row", tabindex: 0, role: "img",
        "aria-label": l.rotulo + ": " + l.total }, svg);
      var lab = el("text", { class: "rowlab", x: labW - 10, y: by + 12, "text-anchor": "end" }, row);
      lab.textContent = l.rotulo.length > 30 ? l.rotulo.slice(0, 29) + "…" : l.rotulo;
      var x0 = labW, vis = opts.series.filter(function (s) { return l.valores[s.chave] > 0; });
      vis.forEach(function (s, j) {
        var w = iw * l.valores[s.chave] / max, gap = j > 0 ? 2 : 0, ww = Math.max(0, w - gap);
        if (j === vis.length - 1) el("path", { class: "seg", d: roundedRight(x0 + gap, by, ww, bh, 4), fill: "var(" + s.cor + ")" }, row);
        else el("rect", { class: "seg", x: x0 + gap, y: by, width: ww, height: bh, fill: "var(" + s.cor + ")" }, row);
        x0 += w;
      });
      var val = el("text", { class: "rowval", x: x0 + 6, y: by + 12 }, row); val.textContent = fmt(l.total);
      el("rect", { class: "hit", x: 0, y: y, width: W, height: rowH }, row);
      function on() {
        tip.show(l.rotulo, opts.series.map(function (s) { return { nome: s.nome, cor: s.cor, v: l.valores[s.chave] }; }), l.total,
          labW + iw * l.total / max / 2, y + 4);
      }
      row.addEventListener("pointerenter", on); row.addEventListener("focus", on);
      row.addEventListener("pointerleave", tip.hide); row.addEventListener("blur", tip.hide);
      if (l.href) { row.style.cursor = "pointer"; row.addEventListener("click", function () { location.href = l.href; });
        row.addEventListener("keydown", function (e) { if (e.key === "Enter") location.href = l.href; }); }
    });
    tabela(container, [opts.rotuloLinha || "Docente"].concat(opts.series.map(function (s) { return s.nome; })).concat(opts.series.length > 1 ? ["Total"] : []),
      linhas.map(function (l) {
        return [l.rotulo].concat(opts.series.map(function (s) { return l.valores[s.chave] || 0; })).concat(opts.series.length > 1 ? [l.total] : []);
      }));
  }

  /* Redesenha ao mudar a largura (celular girando, janela redimensionada) */
  function responsivo(container, desenhar) {
    desenhar();
    var w = container.clientWidth;
    if (window.ResizeObserver) new ResizeObserver(function () {
      if (Math.abs(container.clientWidth - w) > 8) { w = container.clientWidth; desenhar(); }
    }).observe(container);
  }

  window.Viz = { barrasEmpilhadas: barrasEmpilhadas, barrasHorizontais: barrasHorizontais, responsivo: responsivo, fmt: fmt };
})();
