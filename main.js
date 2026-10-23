/* global document, window */
(function () {
  "use strict";

  var WIN_TARGET = 5;

  /** @type {Array<Array<number>>} */
  var winCombos = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  function $(id) {
    var el = document.getElementById(id);
    if (!el) throw new Error("Missing element #" + id);
    return el;
  }

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  /** @param {Array<string|null>} board */
  function evaluate(board) {
    for (var i = 0; i < winCombos.length; i++) {
      var combo = winCombos[i];
      var a = combo[0],
        b = combo[1],
        c = combo[2];
      var v = board[a];
      if (v && v === board[b] && v === board[c]) return { winner: v, line: combo, isDraw: false };
    }
    var isDraw = true;
    for (var j = 0; j < board.length; j++) {
      if (board[j] === null) {
        isDraw = false;
        break;
      }
    }
    return { winner: null, line: null, isDraw: isDraw };
  }

  /** @param {"X"|"O"} p */
  function other(p) {
    return p === "X" ? "O" : "X";
  }

  function clearChildren(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
  }

  /** @param {"X"|"O"} player */
  function createPiece(player) {
    var d = document.createElement("div");
    d.className = player === "X" ? "piece piece--x" : "piece piece--o";
    d.textContent = player === "X" ? "X" : "O";
    d.setAttribute("aria-hidden", "true");
    return d;
  }

  function vibroToast(text) {
    var toast = $("toast");
    toast.textContent = text;
    toast.hidden = false;
    toast.classList.remove("is-on");
    // retrigger
    // eslint-disable-next-line no-unused-expressions
    toast.offsetWidth;
    toast.classList.add("is-on");
    window.setTimeout(function () {
      toast.classList.remove("is-on");
      window.setTimeout(function () {
        toast.hidden = true;
      }, 220);
    }, 1400);
  }

  function setHint(text) {
    $("hint").textContent = text;
  }

  function setTurnText(text) {
    $("turnText").textContent = text;
  }

  /** @param {"X"|"O"} player */
  function setActivePlayerUI(player) {
    $("playerX").classList.toggle("is-active", player === "X");
    $("playerO").classList.toggle("is-active", player === "O");
  }

  /** @param {"X"|"O"} player */
  function setWinnerUI(player) {
    $("playerX").classList.toggle("is-winner", player === "X");
    $("playerO").classList.toggle("is-winner", player === "O");
  }

  function clearWinnerUI() {
    $("playerX").classList.remove("is-winner");
    $("playerO").classList.remove("is-winner");
  }

  function setProgress(scoreX, scoreO) {
    var px = clamp((scoreX / WIN_TARGET) * 100, 0, 100);
    var po = clamp((scoreO / WIN_TARGET) * 100, 0, 100);
    $("barX").style.width = px + "%";
    $("barO").style.width = po + "%";
    $("scoreX").textContent = String(scoreX);
    $("scoreO").textContent = String(scoreO);
  }

  /**
   * Считает положение линии победы. Используем offsetLeft/offsetTop (они не зависят
   * от hover-сдвигов и анимаций клеток) — в той же системе координат, что и
   * absolute-позиционирование внутри .board.
   * @param {Array<number>} line
   */
  function positionWinLine(line) {
    var winLine = $("winLine");
    var cells = $("board").querySelectorAll(".cell");
    var aEl = cells[line[0]];
    var cEl = cells[line[2]];
    if (!aEl || !cEl) return false;

    var ax = aEl.offsetLeft + aEl.offsetWidth / 2;
    var ay = aEl.offsetTop + aEl.offsetHeight / 2;
    var cx = cEl.offsetLeft + cEl.offsetWidth / 2;
    var cy = cEl.offsetTop + cEl.offsetHeight / 2;

    var dx = cx - ax;
    var dy = cy - ay;
    var dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0) return false;
    var ux = dx / dist;
    var uy = dy / dist;
    var angle = (Math.atan2(dy, dx) * 180) / Math.PI;

    // линия выступает за центры крайних клеток, чтобы перечёркивать ряд целиком
    var ext = aEl.offsetWidth * 0.42;
    var len = dist + ext * 2;
    var sx = ax - ux * ext;
    var sy = ay - uy * ext;
    var thickness = winLine.offsetHeight || 6;

    winLine.style.left = sx + "px";
    winLine.style.top = sy - thickness / 2 + "px";
    winLine.style.transform = "rotate(" + angle + "deg)";
    winLine.style.width = len + "px";
    winLine.style.setProperty("--len", len + "px");
    return true;
  }

  /** @param {Array<number>|null} line */
  function renderWinLine(line) {
    var winLine = $("winLine");
    winLine.classList.remove("is-on");
    if (!line) {
      winLine.style.width = "0px";
      winLine.style.setProperty("--len", "0px");
      return;
    }
    if (!positionWinLine(line)) return;

    // retrigger
    // eslint-disable-next-line no-unused-expressions
    winLine.offsetWidth;
    winLine.classList.add("is-on");
  }

  /** подсветка клеток выигрышной линии */
  function markWinCells(line) {
    var cells = $("board").querySelectorAll(".cell");
    for (var i = 0; i < cells.length; i++) {
      var on = !!line && line.indexOf(i) !== -1;
      cells[i].classList.toggle("cell--win", on);
    }
  }

  function setBoardLocked(isLocked) {
    var board = $("board");
    board.classList.toggle("board--locked", !!isLocked);
    var cells = board.querySelectorAll(".cell");
    for (var i = 0; i < cells.length; i++) {
      cells[i].disabled = !!isLocked;
    }
  }

  function setBoardWon(isWon) {
    $("board").classList.toggle("board--won", !!isWon);
  }

  function shakeBoard() {
    var board = $("board");
    board.classList.remove("board--shake");
    // eslint-disable-next-line no-unused-expressions
    board.offsetWidth;
    board.classList.add("board--shake");
  }

  function emptyBoard() {
    var b = [];
    for (var i = 0; i < 9; i++) b.push(null);
    return b;
  }

  function normalizeName(s, fallback) {
    var v = String(s || "").replace(/\s+/g, " ").trim();
    return v.length ? v.slice(0, 16) : fallback;
  }

  function formatTurn(player, nameX, nameO) {
    var name = player === "X" ? nameX : nameO;
    return "Ход: " + player + " — " + name;
  }

  function formatWinner(player, nameX, nameO) {
    var name = player === "X" ? nameX : nameO;
    return "Раунд за " + player + " — " + name;
  }

  function formatChampion(player, nameX, nameO) {
    var name = player === "X" ? nameX : nameO;
    return "Чемпион: " + player + " — " + name;
  }

  function closestCell(node) {
    var el = node;
    while (el && el !== document.body) {
      if (el.classList && el.classList.contains("cell")) return el;
      el = el.parentNode;
    }
    return null;
  }

  function Game() {
    this.board = emptyBoard();
    this.turn = "X";
    this.winner = null;
    this.winLine = null;
    this.draw = false;
    this.roundNo = 1;
    this.scoreX = 0;
    this.scoreO = 0;
    this.nameX = "Игрок 1";
    this.nameO = "Игрок 2";
    this.history = [];
  }

  Game.prototype.isRoundOver = function () {
    return this.winner !== null || this.draw;
  };

  Game.prototype.start = function (args) {
    this.nameX = normalizeName(args.nameX, "Игрок 1");
    this.nameO = normalizeName(args.nameO, "Игрок 2");
    this.scoreX = 0;
    this.scoreO = 0;
    this.roundNo = 1;
    this.resetRound({ first: "X" });
    this.renderAll();
  };

  Game.prototype.resetRound = function (args) {
    this.board = emptyBoard();
    this.turn = args.first;
    this.winner = null;
    this.winLine = null;
    this.draw = false;
    this.history = [];
    clearWinnerUI();
    renderWinLine(null);
    markWinCells(null);
    setBoardWon(false);
    setBoardLocked(false);
    this.renderBoard();
    this.renderHUD();
    $("nextRoundBtn").disabled = true;
    $("undoBtn").disabled = true;
    setHint("Сделай 3 в ряд. Диагональ тоже считается.");
  };

  Game.prototype.restartAll = function () {
    this.scoreX = 0;
    this.scoreO = 0;
    this.roundNo = 1;
    $("roundNo").textContent = "1";
    setProgress(0, 0);
    setBoardWon(false);
    this.resetRound({ first: "X" });
    this.renderAll();
    vibroToast("Матч перезапущен");
  };

  Game.prototype.pushHistory = function () {
    this.history.push({ board: this.board.slice(), turn: this.turn });
    $("undoBtn").disabled = this.history.length === 0 || this.isRoundOver();
  };

  Game.prototype.popHistory = function () {
    if (this.history.length === 0) return;
    if (this.isRoundOver()) return;
    var prev = this.history.pop();
    if (!prev) return;
    this.board = prev.board;
    this.turn = prev.turn;
    this.renderBoard();
    this.renderHUD();
    vibroToast("Ход отменён");
    $("undoBtn").disabled = this.history.length === 0;
  };

  Game.prototype.addPoint = function (winner) {
    if (winner === "X") this.scoreX += 1;
    else this.scoreO += 1;
    setProgress(this.scoreX, this.scoreO);
  };

  Game.prototype.checkChampion = function () {
    var champ = this.scoreX >= WIN_TARGET ? "X" : this.scoreO >= WIN_TARGET ? "O" : null;
    if (!champ) return;
    vibroToast(formatChampion(champ, this.nameX, this.nameO));
    setHint("Матч завершён. Можно «Перезапуск» или сыграть ещё для удовольствия.");
  };

  Game.prototype.play = function (idx) {
    if (this.isRoundOver()) {
      vibroToast("Раунд завершён. Нажми «Новый раунд».");
      shakeBoard();
      return;
    }
    if (idx < 0 || idx > 8) return;
    if (this.board[idx] !== null) {
      vibroToast("Клетка занята");
      shakeBoard();
      return;
    }

    this.pushHistory();
    this.board[idx] = this.turn;

    var res = evaluate(this.board);
    this.winner = res.winner;
    this.winLine = res.line;
    this.draw = res.isDraw;

    this.renderMove(idx);

    if (this.winner) {
      setBoardLocked(true);
      setBoardWon(true);
      markWinCells(this.winLine);
      renderWinLine(this.winLine);
      setWinnerUI(this.winner);
      vibroToast(formatWinner(this.winner, this.nameX, this.nameO));
      setTurnText(formatWinner(this.winner, this.nameX, this.nameO));
      this.addPoint(this.winner);
      $("nextRoundBtn").disabled = false;
      $("undoBtn").disabled = true;
      this.checkChampion();
      return;
    }

    if (this.draw) {
      setBoardLocked(true);
      vibroToast("Ничья");
      setTurnText("Ничья — новый раунд?");
      $("nextRoundBtn").disabled = false;
      $("undoBtn").disabled = true;
      return;
    }

    this.turn = other(this.turn);
    this.renderHUD();
  };

  Game.prototype.nextRound = function () {
    this.roundNo += 1;
    $("roundNo").textContent = String(this.roundNo);
    var first = this.roundNo % 2 === 1 ? "X" : "O";
    this.resetRound({ first: first });
    vibroToast("Раунд " + this.roundNo);
  };

  Game.prototype.renderAll = function () {
    $("nameX").textContent = this.nameX;
    $("nameO").textContent = this.nameO;
    $("roundNo").textContent = String(this.roundNo);
    setProgress(this.scoreX, this.scoreO);
    this.renderBoard();
    this.renderHUD();
  };

  Game.prototype.renderHUD = function () {
    setActivePlayerUI(this.turn);
    if (!this.isRoundOver()) setTurnText(formatTurn(this.turn, this.nameX, this.nameO));
    $("undoBtn").disabled = this.history.length === 0 || this.isRoundOver();
  };

  Game.prototype.renderBoard = function () {
    var boardEl = $("board");
    var cells = boardEl.querySelectorAll(".cell");
    for (var i = 0; i < 9; i++) {
      var cell = cells[i];
      if (!cell) continue;
      clearChildren(cell);
      var v = this.board[i];
      if (v) cell.appendChild(createPiece(v));
      cell.classList.remove("cell--win");
    }
  };

  Game.prototype.renderMove = function (idx) {
    var cell = $("board").querySelector('.cell[data-i="' + idx + '"]');
    if (!cell) return;
    clearChildren(cell);
    cell.appendChild(createPiece(this.board[idx]));
  };

  /* ───────────── Бамбуковый фон ───────────── */

  /** детерминированный генератор: бамбуковая роща всегда выглядит одинаково */
  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function lerp(range, t) {
    return range[0] + (range[1] - range[0]) * t;
  }

  function f1(n) {
    return Math.round(n * 10) / 10;
  }

  function pick(arr, rand) {
    return arr[Math.floor(rand() * arr.length) % arr.length];
  }

  var LEAF_PATH = "M0 0C10 -7 38 -8 62 0C38 7 10 7 0 0Z";

  /** три слоя глубины: дальний (бледный, размытый), средний и ближний (по краям экрана) */
  var BAMBOO_LAYERS = [
    {
      cls: "far", count: 9, w: [9, 13], seg: [70, 110], leaf: [0.55, 0.8], leaves: 0.4,
      grad: "bbFar", branch: "#14392c", sway: [8, 12], amp: [0.5, 0.9], edge: false,
      colors: ["#1b4a39", "#235a45", "#1b4a39", "#2c6a50"],
    },
    {
      cls: "mid", count: 6, w: [16, 22], seg: [100, 150], leaf: [0.8, 1.1], leaves: 0.55,
      grad: "bbMid", branch: "#17432f", sway: [6.5, 9], amp: [0.7, 1.1], edge: false,
      colors: ["#2c7a55", "#3a8f63", "#256a4a", "#2c7a55", "#d4a33a"],
    },
    {
      cls: "near", count: 5, w: [28, 38], seg: [140, 200], leaf: [1.1, 1.5], leaves: 0.7,
      grad: "bbNear", branch: "#1a4d35", sway: [5, 7.5], amp: [0.5, 0.8], edge: true,
      colors: ["#3fa06c", "#52b57a", "#2f8458", "#7ac98f", "#3fa06c", "#e0b040"],
    },
  ];

  function buildStalk(rand, cfg, H, xPct) {
    var w = lerp(cfg.w, rand());
    var reach = 62 * cfg.leaf[1] + 70;
    var W = Math.ceil(w + reach * 2);
    var cx = W / 2;
    var x0 = cx - w / 2;
    var out = [];

    // ствол с цилиндрической светотенью и тонким бликом
    out.push('<rect x="' + f1(x0) + '" y="0" width="' + f1(w) + '" height="' + H + '" fill="url(#' + cfg.grad + ')"/>');
    out.push(
      '<rect x="' + f1(cx - w * 0.2) + '" y="0" width="' + f1(Math.max(1, w * 0.09)) +
        '" height="' + H + '" fill="#e6ffe0" fill-opacity=".1"/>'
    );

    var y = H - lerp(cfg.seg, rand()) * 0.6;
    while (y > -20) {
      // узел бамбука
      out.push(
        '<rect x="' + f1(x0 - 1.5) + '" y="' + f1(y - 3) + '" width="' + f1(w + 3) +
          '" height="6" rx="2.5" fill="#051a10" fill-opacity=".55"/>'
      );
      out.push(
        '<rect x="' + f1(x0 - 1.5) + '" y="' + f1(y - 3) + '" width="' + f1(w + 3) +
          '" height="1.6" rx=".8" fill="#d8ffd0" fill-opacity=".22"/>'
      );

      // ветка с пучком листьев
      if (y < H - 60 && rand() < cfg.leaves) {
        var side = rand() < 0.5 ? -1 : 1;
        var L = lerp([46, 100], rand()) * cfg.leaf[1];
        var rise = lerp([10, 40], rand()) * cfg.leaf[1];
        var bx = cx + side * (w / 2);
        var ex = bx + side * L;
        var ey = y - rise;
        var sw = Math.max(1.2, w * 0.1);

        out.push(
          '<path d="M' + f1(bx) + " " + f1(y) + " Q" + f1(bx + side * L * 0.55) + " " + f1(y - rise * 1.3) +
            " " + f1(ex) + " " + f1(ey) + '" fill="none" stroke="' + cfg.branch +
            '" stroke-width="' + f1(sw) + '" stroke-linecap="round"/>'
        );

        var n = 3 + Math.floor(rand() * 4);
        for (var k = 0; k < n; k++) {
          var t = 0.45 + (0.55 * k) / Math.max(1, n - 1);
          var px = bx + (ex - bx) * t;
          var py = y + (ey - y) * t;
          var droop = lerp([-55, 50], rand());
          var ang = side > 0 ? droop : 180 - droop;
          var s = lerp(cfg.leaf, rand());
          out.push(
            '<g transform="translate(' + f1(px) + " " + f1(py) + ") rotate(" + f1(ang) + ") scale(" + f1(s) +
              ')"><path d="' + LEAF_PATH + '" fill="' + pick(cfg.colors, rand) +
              '"/><path d="M3 0L54 0" stroke="#e8ffd8" stroke-opacity=".28" stroke-width="1" fill="none"/></g>'
          );
        }
      }

      y -= lerp(cfg.seg, rand());
    }

    var dur = lerp(cfg.sway, rand());
    var style =
      "left:calc(" + f1(xPct) + "% - " + f1(W / 2) + "px);" +
      "--dur:" + f1(dur) + "s;" +
      "--delay:" + f1(-rand() * dur) + "s;" +
      "--amp:" + f1(lerp(cfg.amp, rand())) + ";";

    return (
      '<svg class="stalk stalk--' + cfg.cls + '" aria-hidden="true" width="' + W + '" height="' + H +
      '" viewBox="0 0 ' + W + " " + H + '" style="' + style + '">' + out.join("") + "</svg>"
    );
  }

  function buildBamboo() {
    var root = document.getElementById("bamboo");
    if (!root) return;
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    var H = Math.round(Math.max(vh, 600) * 1.15);
    var small = vw < 700;

    for (var li = 0; li < BAMBOO_LAYERS.length; li++) {
      var cfg = BAMBOO_LAYERS[li];
      var layer = root.querySelector(".bamboo__layer--" + cfg.cls);
      if (!layer) continue;
      clearChildren(layer);

      var rand = mulberry32(1000 + li * 77);
      var count = small ? Math.max(3, Math.round(cfg.count * 0.6)) : cfg.count;
      var html = [];
      for (var i = 0; i < count; i++) {
        var xPct;
        if (cfg.edge) {
          xPct = i % 2 === 0 ? lerp([1, 10], rand()) : lerp([90, 99], rand());
        } else {
          xPct = ((i + 0.1 + rand() * 0.8) / count) * 100;
        }
        html.push(buildStalk(rand, cfg, H, xPct));
      }
      layer.insertAdjacentHTML("beforeend", html.join(""));
    }
  }

  /** падающие листья и золотые искры (создаются один раз) */
  function buildAmbient() {
    var fall = document.getElementById("fallLeaves");
    var sparks = document.getElementById("sparks");
    var rand = mulberry32(4242);
    var colors = ["#3fa06c", "#7ac98f", "#d4a33a", "#e0b040", "#2f8458"];
    var i;

    if (fall) {
      var leaves = [];
      for (i = 0; i < 10; i++) {
        var dur = 14 + rand() * 14;
        leaves.push(
          '<span class="fall" style="--x:' + f1(rand() * 100) + "%;--s:" + f1(18 + rand() * 20) +
            "px;--dur:" + f1(dur) + "s;--delay:" + f1(-rand() * dur) + "s;--drift:" + f1(-120 + rand() * 240) +
            "px;--flt:" + f1(2 + rand() * 2) + "s;--op:" + f1(0.45 + rand() * 0.4) + '">' +
            '<svg viewBox="0 0 64 20"><path d="M0 10C12 0 40 0 64 10C40 20 12 20 0 10Z" fill="' + pick(colors, rand) +
            '"/><path d="M4 10L58 10" stroke="#fff" stroke-opacity=".3" fill="none"/></svg></span>'
        );
      }
      fall.insertAdjacentHTML("beforeend", leaves.join(""));
    }

    if (sparks) {
      var dots = [];
      for (i = 0; i < 14; i++) {
        var d = 5 + rand() * 6;
        dots.push(
          '<span class="spark" style="--x:' + f1(4 + rand() * 92) + "%;--y:" + f1(15 + rand() * 80) +
            "%;--s:" + f1(3 + rand() * 3) + "px;--dur:" + f1(d) + "s;--delay:" + f1(-rand() * d) +
            "s;--dx:" + f1(-20 + rand() * 40) + "px;--dy:" + f1(-50 + rand() * 40) + 'px"></span>'
        );
      }
      sparks.insertAdjacentHTML("beforeend", dots.join(""));
    }
  }

  var game = new Game();

  function wireUI() {
    var setup = $("setup");
    var gameEl = $("game");

    var form = $("setupForm");
    $("demoBtn").addEventListener("click", function () {
      var p1 = form.elements.namedItem("p1");
      var p2 = form.elements.namedItem("p2");
      if (p1) p1.value = p1.value || "Ли";
      if (p2) p2.value = p2.value || "Мэй";
      vibroToast("Готово");
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var p1 = form.elements.namedItem("p1");
      var p2 = form.elements.namedItem("p2");
      var nameX = normalizeName(p1 && p1.value, "Игрок 1");
      var nameO = normalizeName(p2 && p2.value, "Игрок 2");

      setup.hidden = true;
      gameEl.hidden = false;

      game.start({ nameX: nameX, nameO: nameO });
      setHint("Сделай 3 в ряд. Удачи!");
      vibroToast("Игра началась");
    });

    $("board").addEventListener("click", function (e) {
      var cell = closestCell(e.target);
      if (!cell) return;
      var raw = cell.getAttribute("data-i");
      var i = raw ? parseInt(raw, 10) : NaN;
      if (isNaN(i)) return;
      game.play(i);
    });

    $("undoBtn").addEventListener("click", function () {
      game.popHistory();
    });
    $("nextRoundBtn").addEventListener("click", function () {
      game.nextRound();
    });
    $("restartBtn").addEventListener("click", function () {
      game.restartAll();
    });

    window.addEventListener("keydown", function (e) {
      if (gameEl.hidden) return;
      var key = e.key || "";
      if ((key === "z" || key === "Z") && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        game.popHistory();
      }
      if (key === "r" || key === "R") game.nextRound();
      if (key === "Escape") game.restartAll();
    });

    // при изменении размера окна линия победы пересчитывается, бамбук перестраивается
    var lastW = window.innerWidth;
    var lastH = window.innerHeight;
    var resizeTimer = null;
    window.addEventListener("resize", function () {
      if (game.winner && game.winLine) positionWinLine(game.winLine);
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(function () {
        if (Math.abs(window.innerWidth - lastW) > 40 || Math.abs(window.innerHeight - lastH) > 150) {
          lastW = window.innerWidth;
          lastH = window.innerHeight;
          buildBamboo();
        }
      }, 250);
    });

    setHint("Введи имена и начинай раунд.");
  }

  function init() {
    buildBamboo();
    buildAmbient();
    wireUI();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

