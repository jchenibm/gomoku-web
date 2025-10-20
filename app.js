(function() {
  const N = 15; // 15x15 grid

  class GomokuBoard {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.container = canvas.parentElement;

      this.board = Array.from({ length: N }, () => Array(N).fill(null));
      this.current = 'black'; // alternate between 'black' and 'white'
      this.hover = null; // {row, col} or null

      this.geometry = {
        dpr: window.devicePixelRatio || 1,
        cssSize: 0,
        origin: 0, // left/top origin in CSS pixels
        cell: 0,   // cell size in CSS px
        gridSize: 0,
      };

      this._bindEvents();
      this._observeResize();
      this._resizeAndRender();
    }

    _observeResize() {
      this.ro = new ResizeObserver(() => {
        this._resizeAndRender();
      });
      this.ro.observe(this.container);
    }

    destroy() {
      if (this.ro) this.ro.disconnect();
      this.canvas.onpointerdown = null;
      this.canvas.onpointermove = null;
      this.canvas.onpointerleave = null;
    }

    _bindEvents() {
      // Pointer events unify mouse/touch/pen
      this.canvas.onpointerdown = (e) => {
        this.canvas.setPointerCapture(e.pointerId);
        const pos = this._eventToBoardCoord(e);
        if (!pos) return;
        const { row, col } = pos;
        if (this.board[row][col]) return; // prevent duplicate move
        this.board[row][col] = this.current;
        this.current = this.current === 'black' ? 'white' : 'black';
        this._updateTurnLabel();
        this.render();
      };

      this.canvas.onpointermove = (e) => {
        if (e.pointerType !== 'mouse') {
          // For touch/pen, avoid hover preview to reduce flicker
          return;
        }
        const pos = this._eventToBoardCoord(e);
        if (!pos) {
          if (this.hover) {
            this.hover = null;
            this.render();
          }
          return;
        }
        if (!this.hover || this.hover.row !== pos.row || this.hover.col !== pos.col) {
          this.hover = pos;
          this.render();
        }
      };

      this.canvas.onpointerleave = () => {
        if (this.hover) {
          this.hover = null;
          this.render();
        }
      };

      const resetBtn = document.getElementById('resetBtn');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          this.reset();
        });
      }
    }

    reset() {
      this.board = Array.from({ length: N }, () => Array(N).fill(null));
      this.current = 'black';
      this.hover = null;
      this._updateTurnLabel();
      this.render();
    }

    _updateTurnLabel() {
      const el = document.getElementById('turnLabel');
      if (!el) return;
      el.textContent = `当前：${this.current === 'black' ? '黑棋' : '白棋'}`;
    }

    _resizeAndRender() {
      const dpr = window.devicePixelRatio || 1;
      const cssSize = Math.max(200, Math.floor(this.container.clientWidth));
      // Keep square: set canvas style size in CSS px and backing store in device px
      this.canvas.style.width = cssSize + 'px';
      this.canvas.style.height = cssSize + 'px';
      this.canvas.width = Math.round(cssSize * dpr);
      this.canvas.height = Math.round(cssSize * dpr);

      const ctx = this.ctx;
      ctx.setTransform(1, 0, 0, 1, 0, 0); // reset
      ctx.scale(dpr, dpr); // scale drawing to CSS pixels

      // Compute geometry in CSS pixels
      // Choose a margin, then fit integer cell size for consistent grid alignment
      const marginMin = 14; // CSS px
      const marginMax = 28; // CSS px
      const marginTarget = Math.round(cssSize * 0.06);
      const margin = Math.max(marginMin, Math.min(marginMax, marginTarget));
      const cell = Math.max(8, Math.floor((cssSize - 2 * margin) / (N - 1)));
      const gridSize = cell * (N - 1);
      const origin = Math.round((cssSize - gridSize) / 2);

      this.geometry = { dpr, cssSize, origin, cell, gridSize };
      this.render();
    }

    _eventToBoardCoord(e) {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left; // CSS px
      const y = e.clientY - rect.top;
      const { origin, cell } = this.geometry;

      const colF = (x - origin) / cell;
      const rowF = (y - origin) / cell;

      // Accept taps only if inside a half-cell margin around the grid
      if (colF < -0.5 || colF > (N - 1) + 0.5 || rowF < -0.5 || rowF > (N - 1) + 0.5) {
        return null;
      }

      let col = Math.round(colF);
      let row = Math.round(rowF);
      col = Math.max(0, Math.min(N - 1, col));
      row = Math.max(0, Math.min(N - 1, row));

      return { row, col };
    }

    render() {
      const { cssSize } = this.geometry;
      const ctx = this.ctx;
      ctx.clearRect(0, 0, cssSize, cssSize);

      this._drawBoardBackground();
      this._drawGrid();
      this._drawStars();
      this._drawBorder();
      this._drawStones();
      this._drawHover();
    }

    _drawBoardBackground() {
      const { cssSize } = this.geometry;
      const ctx = this.ctx;
      // subtle radial vignette over the wood background
      const g = ctx.createRadialGradient(cssSize * 0.5, cssSize * 0.4, cssSize * 0.1, cssSize * 0.5, cssSize * 0.5, cssSize * 0.7);
      g.addColorStop(0, '#f6e3b4');
      g.addColorStop(1, '#efd7a1');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, cssSize, cssSize);
    }

    _lineColor() {
      return '#6b4f2a';
    }

    _drawGrid() {
      const ctx = this.ctx;
      const { origin, cell, gridSize } = this.geometry;

      ctx.save();
      ctx.strokeStyle = this._lineColor();
      ctx.lineWidth = 1; // 1 CSS px -> scaled to DPR for crispness

      // Draw grid lines aligned to half-pixel for crisp strokes
      for (let i = 0; i < N; i++) {
        const x = origin + i * cell + 0.5; // crisp alignment
        const y = origin + i * cell + 0.5;
        // vertical
        ctx.beginPath();
        ctx.moveTo(x, origin + 0.5);
        ctx.lineTo(x, origin + gridSize + 0.5);
        ctx.stroke();
        // horizontal
        ctx.beginPath();
        ctx.moveTo(origin + 0.5, y);
        ctx.lineTo(origin + gridSize + 0.5, y);
        ctx.stroke();
      }
      ctx.restore();
    }

    _drawBorder() {
      const ctx = this.ctx;
      const { origin, gridSize } = this.geometry;
      ctx.save();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#4a3317';
      // align outer border on half-pixel as well
      ctx.strokeRect(origin + 0.5, origin + 0.5, gridSize, gridSize);
      ctx.restore();
    }

    _drawStars() {
      const ctx = this.ctx;
      const { origin, cell } = this.geometry;
      const starIdx = [3, 7, 11]; // 0-based positions for 15x15 => 4th, 8th, 12th lines
      const points = [
        [starIdx[0], starIdx[0]],
        [starIdx[0], starIdx[2]],
        [starIdx[1], starIdx[1]], // center
        [starIdx[2], starIdx[0]],
        [starIdx[2], starIdx[2]],
      ];

      ctx.save();
      ctx.fillStyle = '#333';
      const r = Math.max(2, Math.min(4, Math.round(cell * 0.12)));
      for (const [ci, ri] of points) {
        const cx = origin + ci * cell + 0.5; // align like grid
        const cy = origin + ri * cell + 0.5;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    _drawStones() {
      for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
          const color = this.board[r][c];
          if (color) this.drawStone(r, c, color);
        }
      }
    }

    _drawHover() {
      if (!this.hover) return;
      const { row, col } = this.hover;
      if (this.board[row][col]) return; // don't preview on occupied
      // Desktop hover shows a translucent preview of current color
      this.drawStone(row, col, this.current, { alpha: 0.5, outlineOnly: false });
    }

    coordToCenter(row, col) {
      const { origin, cell } = this.geometry;
      const cx = origin + col * cell + 0.5;
      const cy = origin + row * cell + 0.5;
      return { cx, cy };
    }

    drawStone(row, col, color, opts = {}) {
      const { cx, cy } = this.coordToCenter(row, col);
      const { cell } = this.geometry;
      const ctx = this.ctx;

      const alpha = opts.alpha != null ? opts.alpha : 1.0;
      const r = Math.max(6, Math.floor(cell * 0.45));

      ctx.save();
      ctx.globalAlpha = alpha;

      // soft shadow
      ctx.shadowColor = 'rgba(0,0,0,0.25)';
      ctx.shadowBlur = Math.max(2, Math.floor(r * 0.25));
      ctx.shadowOffsetY = Math.max(1, Math.round(r * 0.15));

      // stone base with radial shading
      const gradient = ctx.createRadialGradient(
        cx - r * 0.35, cy - r * 0.35, r * 0.1,
        cx, cy, r
      );
      if (color === 'black') {
        gradient.addColorStop(0, '#555');
        gradient.addColorStop(0.6, '#111');
        gradient.addColorStop(1, '#000');
      } else {
        gradient.addColorStop(0, '#fff');
        gradient.addColorStop(0.6, '#ddd');
        gradient.addColorStop(1, '#cfcfcf');
      }

      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // subtle outline for crispness
      ctx.lineWidth = 1;
      ctx.strokeStyle = color === 'black' ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.35)';
      ctx.stroke();

      ctx.restore();
    }
  }

  // Initialize when DOM ready
  window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('board');
    const board = new GomokuBoard(canvas);

    // Expose an API for manual stone drawing if needed by tests/automation
    // Usage: window.drawStone(row, col, color)
    window.drawStone = (row, col, color) => {
      if (row < 0 || row >= N || col < 0 || col >= N) return;
      if (color !== 'black' && color !== 'white') return;
      if (board.board[row][col]) return; // occupied
      board.board[row][col] = color;
      board.render();
    };

    // Also expose clear/reset
    window.resetBoard = () => board.reset();
  });
})();
