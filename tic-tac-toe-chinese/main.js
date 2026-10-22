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

  /** @param {Array<number>|null} line */
  function renderWinLine(line) {
    var winLine = $("winLine");
    winLine.classList.remove("is-on");
    if (!line) return;

    var board = $("board");
    var cells = board.querySelectorAll(".cell");
    var aEl = cells[line[0]];
    var cEl = cells[line[2]];
    if (!aEl || !cEl) return;

    var a = aEl.getBoundingClientRect();
    var c = cEl.getBoundingClientRect();
    var b = board.getBoundingClientRect();

    var ax = a.left + a.width / 2 - b.left;
    var ay = a.top + a.height / 2 - b.top;
    var cx = c.left + c.width / 2 - b.left;
    var cy = c.top + c.height / 2 - b.top;

    var dx = cx - ax;
    var dy = cy - ay;
    var len = Math.sqrt(dx * dx + dy * dy);
    var angle = (Math.atan2(dy, dx) * 180) / Math.PI;

    winLine.style.left = ax + "px";
    winLine.style.top = ay - 3 + "px";
    winLine.style.transform = "rotate(" + angle + "deg)";
    winLine.style.width = len + "px";

    // retrigger
    // eslint-disable-next-line no-unused-expressions
    winLine.offsetWidth;
    winLine.classList.add("is-on");
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
    }
  };

  Game.prototype.renderMove = function (idx) {
    var cell = $("board").querySelector('.cell[data-i="' + idx + '"]');
    if (!cell) return;
    clearChildren(cell);
    cell.appendChild(createPiece(this.board[idx]));
  };

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

    setHint("Введи имена и начинай раунд.");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wireUI);
  } else {
    wireUI();
  }
})();

