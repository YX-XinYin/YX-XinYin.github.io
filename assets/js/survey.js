(function () {
  var DOMAIN_ORDER = ["数据中心网络", "卫星网络", "无线网络", "边缘网络", "广域与互联网"];
  var SUB_ORDER = [
    "流量工程与控制",
    "故障定位与运维",
    "配置与策略",
    "数据面智能",
    "无线与 RAN",
    "无线计算",
    "传输与体验",
    "可解释、适应与复现",
    "训练互连与拓扑",
    "集合通信",
    "推理与 KV",
    "在网聚合与专家并行",
    "拥塞、调度与多租户",
    "云网络与 DPU",
    "光互连",
    "边缘推理"
  ];

  function esc(value) {
    return String(value).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  function ordered(values, preferred) {
    var present = {};
    values.forEach(function (value) { present[value] = true; });
    var list = preferred.filter(function (value) { return present[value]; });
    values.forEach(function (value) {
      if (list.indexOf(value) === -1) list.push(value);
    });
    return list;
  }

  function fillSelect(select, options, allLabel) {
    select.innerHTML = "";
    var all = document.createElement("option");
    all.value = "all";
    all.textContent = allLabel;
    select.appendChild(all);
    options.forEach(function (option) {
      var node = document.createElement("option");
      node.value = option.value;
      node.textContent = option.label;
      select.appendChild(node);
    });
  }

  function boot(root, papers) {
    var mode = root.getAttribute("data-mode");
    var stats = root.querySelector("[data-stats]");
    var filters = root.querySelector("[data-filters]");
    var count = root.querySelector("[data-count]");
    var list = root.querySelector("[data-list]");
    var nAi = papers.filter(function (paper) { return paper.track === "AI for Network"; }).length;

    stats.innerHTML =
      '<div class="survey-stat"><strong>' + papers.length + '</strong><span>入选</span></div>' +
      '<div class="survey-stat"><strong>' + nAi + '</strong><span>AI for Network</span></div>' +
      '<div class="survey-stat"><strong>' + (papers.length - nAi) + '</strong><span>Network for AI</span></div>';

    var track = document.createElement("select");
    var slice = document.createElement("select");
    var domain = document.createElement("select");
    var sub = document.createElement("select");
    var query = document.createElement("input");
    query.type = "search";
    query.placeholder = "搜索论文、背景或技术";
    query.setAttribute("aria-label", "搜索");

    fillSelect(track, [
      { value: "AI for Network", label: "AI for Network" },
      { value: "Network for AI", label: "Network for AI" }
    ], "两条线");

    if (mode === "season") {
      fillSelect(slice, [
        { value: "NSDI 2026春", label: "春季" },
        { value: "NSDI 2026秋", label: "秋季" }
      ], "春秋");
      slice.setAttribute("aria-label", "截稿季");
    } else {
      var years = ordered(papers.map(function (paper) { return String(paper.year); }), ["2025", "2026"]);
      fillSelect(slice, years.map(function (year) { return { value: year, label: year }; }), "全部年份");
      slice.setAttribute("aria-label", "年份");
    }

    fillSelect(domain, ordered(papers.map(function (paper) { return paper.domain; }), DOMAIN_ORDER).map(function (value) {
      return { value: value, label: value };
    }), "全部网络域");
    fillSelect(sub, ordered(papers.map(function (paper) { return paper.sub; }), SUB_ORDER).map(function (value) {
      return { value: value, label: value };
    }), "全部子类");

    [track, slice, domain, sub, query].forEach(function (node) { filters.appendChild(node); });

    function render() {
      var q = query.value.trim().toLowerCase();
      var shown = papers.filter(function (paper) {
        if (track.value !== "all" && paper.track !== track.value) return false;
        if (mode === "season") {
          if (slice.value !== "all" && paper.meet !== slice.value) return false;
        } else if (slice.value !== "all" && String(paper.year) !== slice.value) {
          return false;
        }
        if (domain.value !== "all" && paper.domain !== domain.value) return false;
        if (sub.value !== "all" && paper.sub !== sub.value) return false;
        if (!q) return true;
        return (paper.name + " " + paper.domain + " " + paper.sub + " " + paper.bg + " " + paper.idea)
          .toLowerCase()
          .indexOf(q) !== -1;
      });

      count.textContent = "当前 " + shown.length + " 篇";
      if (!shown.length) {
        list.innerHTML = '<p class="survey-empty">没有符合筛选条件的论文。</p>';
        return;
      }

      list.innerHTML = shown.map(function (paper) {
        var when = mode === "season" ? (paper.meet.indexOf("春") !== -1 ? "春" : "秋") : paper.year;
        return (
          '<article class="paper-card survey-card">' +
            '<div class="paper-meta">' +
              '<span class="badge-pill venue">' + esc(when) + '</span>' +
              '<span class="badge-pill kind">' + esc(paper.track) + '</span>' +
              '<span class="badge-pill">' + esc(paper.domain) + '</span>' +
              '<span class="badge-pill">' + esc(paper.sub) + '</span>' +
            '</div>' +
            '<h3>' + esc(paper.name) + '</h3>' +
            '<p>' + esc(paper.bg) + '</p>' +
            '<p class="survey-idea">' + esc(paper.idea) + '</p>' +
            '<p class="survey-links"><a href="' + esc(paper.page) + '">页面</a><a href="' + esc(paper.pdf) + '">PDF</a></p>' +
          '</article>'
        );
      }).join("");
    }

    [track, slice, domain, sub].forEach(function (node) { node.addEventListener("change", render); });
    query.addEventListener("input", render);
    render();
  }

  document.querySelectorAll(".survey").forEach(function (root) {
    fetch(root.getAttribute("data-survey"))
      .then(function (response) { return response.json(); })
      .then(function (papers) { boot(root, papers); });
  });
})();
