function shuffle(arr) {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }
    
    function range1(n) {
      return Array.from({ length: n }, (_, i) => i + 1);
    }
    
    function isPerfectSquare(n) {
      const r = Math.sqrt(n);
      return Number.isInteger(r);
    }

    function validatePuzzleShape(puzzle) {
      if (!puzzle || typeof puzzle !== "object") return false;
      const { size, numbers, grid } = puzzle;
      if (typeof size !== "number" || size < 3 || size > 9) return false;
      if (!Array.isArray(numbers) || numbers.length !== size) return false;
      for (let i = 0; i < size; i++) if (numbers[i] !== i + 1) return false;
      if (!Array.isArray(grid) || grid.length !== size) return false;
      for (let r = 0; r < size; r++) {
        if (!Array.isArray(grid[r]) || grid[r].length !== size) return false;
        for (let c = 0; c < size; c++) {
          const v = grid[r][c];
          if (typeof v !== "number") return false;
          if (v !== 0 && (v < 1 || v > size)) return false;
        }
      }
      return true;
    }

    function validateSolution(solution, size) {
      if (!Array.isArray(solution) || solution.length !== size) return false;
      const want = new Set(range1(size));

      // row/col
      for (let r = 0; r < size; r++) {
        const row = solution[r];
        if (!Array.isArray(row) || row.length !== size) return false;
        const rs = new Set(row);
        if (rs.size !== size) return false;
        for (const v of rs) if (!want.has(v)) return false;
      }
      for (let c = 0; c < size; c++) {
        const cs = new Set();
        for (let r = 0; r < size; r++) cs.add(solution[r][c]);
        if (cs.size !== size) return false;
        for (const v of cs) if (!want.has(v)) return false;
      }

      // block（平方数サイズのみ）
      const base = Math.sqrt(size);
      if (Number.isInteger(base)) {
        for (let br = 0; br < base; br++) {
          for (let bc = 0; bc < base; bc++) {
            const bs = new Set();
            for (let r = br * base; r < br * base + base; r++) {
              for (let c = bc * base; c < bc * base + base; c++) {
                bs.add(solution[r][c]);
              }
            }
            if (bs.size !== size) return false;
            for (const v of bs) if (!want.has(v)) return false;
          }
        }
      }

      return true;
    }

    // 完成盤面を作る：
    // - size が平方数（4/9）ならブロック制約も満たす“数独”の解盤面
    // - それ以外（3/5/6/7/8）は行・列の重複なし（現状エンジン仕様に合わせる）
    export function generateSolution(size) {
      const nums = range1(size);

      if (isPerfectSquare(size)) {
        const base = Math.sqrt(size); // 4->2, 9->3
        const pattern = (r, c) =>
          (base * (r % base) + Math.floor(r / base) + c) % size;

        const rBase = [...Array(base).keys()];
        const rows = shuffle(rBase)
          .flatMap((g) => shuffle(rBase).map((r) => g * base + r));
        const cols = shuffle(rBase)
          .flatMap((g) => shuffle(rBase).map((c) => g * base + c));
        const nMap = shuffle(nums);

        const grid = rows.map((r) =>
          cols.map((c) => nMap[pattern(r, c)])
        );
        if (!validateSolution(grid, size)) throw new Error("invalid solution");
        return grid;
      }

      // Latin square（行・列に重複なし）の完成盤面（高速）
      const firstRow = shuffle(nums);
      let grid = Array.from({ length: size }, (_, r) =>
        Array.from({ length: size }, (_, c) => firstRow[(c + r) % size])
      );

      // 行/列をシャッフルして見た目をランダム化
      const rowOrder = shuffle([...Array(size).keys()]);
      const colOrder = shuffle([...Array(size).keys()]);
      grid = rowOrder.map((r) => colOrder.map((c) => grid[r][c]));
      if (!validateSolution(grid, size)) throw new Error("invalid solution");
      return grid;
    }
    
    // 完成盤面から穴あき問題を作る（必ず解は存在）
    export function makePuzzleFromSolution(solution, givenRatio = 0.45) {
      const size = solution.length;
      const total = size * size;
      const givens = Math.max(1, Math.floor(total * givenRatio));
    
      const indices = shuffle([...Array(total).keys()]);
      const keep = new Set(indices.slice(0, givens));
    
      const grid = Array.from({ length: size }, (_, r) =>
        Array.from({ length: size }, (_, c) => {
          const idx = r * size + c;
          return keep.has(idx) ? solution[r][c] : 0;
        })
      );
    
      return {
        size,
        numbers: range1(size),
        grid
      };
    }

    // 解盤面 → 穴あけ、という安全フローを1関数に（失敗時はリトライ）
    export function generatePuzzleWithRetry(
      size,
      { givenRatio = 0.45, maxRetries = 5 } = {}
    ) {
      let lastErr = null;
      for (let i = 0; i <= maxRetries; i++) {
        try {
          const sol = generateSolution(size);
          const puzzle = makePuzzleFromSolution(sol, givenRatio);
          if (!validatePuzzleShape(puzzle)) throw new Error("invalid puzzle shape");
          return puzzle;
        } catch (e) {
          lastErr = e;
        }
      }
      throw new Error(
        `puzzle generation failed (size=${size}, retries=${maxRetries}): ${
          lastErr?.message || "unknown"
        }`
      );
    }