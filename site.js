/* site.js — cabeçalho, menu e rodapé únicos do Painel Biomedicina UFMT Araguaia.
   Para mudar o menu ou a data de atualização, edite APENAS este arquivo.

   Modo incorporado: acrescente ?embed=1 ao endereço (ex.: professores-biomedicina-ufmt.html?embed=1)
   para usar a página dentro de um iframe no site oficial do curso. Nesse modo o cabeçalho e o
   rodapé do painel são ocultados e aparece um link "Abrir em tela cheia". */
(function () {
  var ATUALIZADO_EM = "novembro de 2026";
  var SITE_OFICIAL = "https://www.ufmt.br/curso/biomedicinacua";

  /* Áreas do menu principal e suas páginas (a primeira página é o destino da área) */
  var AREAS = [
    { nome: "Início", paginas: [["index.html", "Início"]] },
    { nome: "Pessoas", paginas: [
        ["professores-biomedicina-ufmt.html", "Professores"],
        ["egressos-por-turma.html", "Egressos"],
        ["coautores-biomedicina.html", "Coautores"] ] },
    { nome: "Produção", paginas: [
        ["producoes-biomedicina-ufmt.html", "Produções"],
        ["premios-titulos-biomedicina.html", "Prêmios e títulos"] ] },
    { nome: "Formação", paginas: [
        ["orientacoes-biomedicina.html", "Orientações"] ] },
    { nome: "Indicadores", paginas: [
        ["indicadores-biomedicina.html", "Indicadores"],
        ["graficos-biomedicina.html", "Redes de colaboração"] ] },
    { nome: "Sobre", paginas: [
        ["midias-sociais-biomedicina.html", "Laboratórios e grupos"],
        ["metodologia-biomedicina.html", "Metodologia"] ] }
  ];

  var params = new URLSearchParams(location.search);
  var embed = params.get("embed") === "1" || window.self !== window.top;
  var atual = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  var atualMenu = /^perfil-/.test(atual) ? "professores-biomedicina-ufmt.html" : atual;

  var areaAtual = null;
  AREAS.forEach(function (a) {
    a.paginas.forEach(function (p) { if (p[0] === atualMenu) areaAtual = a; });
  });

  /* Em modo incorporado, links internos mantêm ?embed=1 para continuar dentro do iframe */
  function href(arquivo) { return embed ? arquivo + "?embed=1" : arquivo; }

  function montarSubnav() {
    if (!areaAtual || areaAtual.paginas.length < 2) return null;
    var nav = document.createElement("nav");
    nav.className = "subnav";
    nav.setAttribute("aria-label", "Páginas de " + areaAtual.nome);
    nav.innerHTML = '<div class="subnav__inner"><div class="segmented" role="list">' +
      areaAtual.paginas.map(function (p) {
        var ativo = p[0] === atualMenu;
        return '<a role="listitem" href="' + href(p[0]) + '"' + (ativo ? ' aria-current="page"' : "") + ">" + p[1] + "</a>";
      }).join("") + "</div></div>";
    return nav;
  }

  document.documentElement.classList.toggle("is-embed", embed);

  if (!embed) {
    var links = AREAS.map(function (a) {
      var ativo = a === areaAtual ? ' aria-current="page"' : "";
      return '<li><a href="' + a.paginas[0][0] + '"' + ativo + ">" + a.nome + "</a></li>";
    }).join("");

    var header = document.createElement("header");
    header.className = "site-header";
    header.innerHTML =
      '<div class="site-header__inner">' +
        '<a class="site-brand" href="index.html">Biomedicina <span>· UFMT Araguaia</span></a>' +
        '<nav class="site-nav" aria-label="Áreas do painel"><ul>' + links + "</ul></nav>" +
      "</div>";
    document.body.insertBefore(header, document.body.firstChild);

    var ul = header.querySelector(".site-nav ul");
    var ativoEl = header.querySelector('[aria-current="page"]');
    if (ativoEl && ul.scrollWidth > ul.clientWidth) ul.scrollLeft = ativoEl.parentNode.offsetLeft - 16;

    var sub = montarSubnav();
    if (sub) header.parentNode.insertBefore(sub, header.nextSibling);

    var footer = document.createElement("footer");
    footer.className = "site-footer";
    footer.innerHTML =
      '<div class="site-footer__inner">' +
        '<span>Curso de Biomedicina · Campus Universitário do Araguaia · <a href="' + SITE_OFICIAL + '">Site oficial do curso</a></span>' +
        "<span>Dados: Currículos Lattes (CNPq) · Atualizado em " + ATUALIZADO_EM +
        ' · <a href="metodologia-biomedicina.html">Metodologia</a></span>' +
      "</div>";
    document.body.appendChild(footer);
  } else {
    /* Modo incorporado: barra mínima com subnavegação e link para tela cheia */
    var bar = document.createElement("div");
    bar.className = "embed-bar";
    var semEmbed = location.pathname.split("/").pop() || "index.html";
    bar.innerHTML = '<a class="chevron-link" href="' + semEmbed + '" target="_blank" rel="noopener">Abrir em tela cheia</a>';
    document.body.insertBefore(bar, document.body.firstChild);
    var sub2 = montarSubnav();
    if (sub2) bar.parentNode.insertBefore(sub2, bar.nextSibling);
    /* Links internos continuam no modo incorporado */
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest("a[href]");
      if (!a || a.target === "_blank") return;
      var h = a.getAttribute("href");
      if (/^[a-z0-9-]+\.html(#.*)?$/i.test(h)) { e.preventDefault(); location.href = h.replace(/(\.html)/i, "$1?embed=1"); }
    });
  }

  /* Divulga a altura ao site anfitrião (útil se um dia o CMS aceitar script de ajuste) */
  if (window.parent !== window && window.ResizeObserver) {
    new ResizeObserver(function () {
      window.parent.postMessage({ painelBiomedicina: true, altura: document.documentElement.scrollHeight }, "*");
    }).observe(document.body);
  }
})();
