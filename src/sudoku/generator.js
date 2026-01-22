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
    
    // Latin square（行・列に重複なし）の完成盤面を作る（高速）
    export function generateSolution(size) {
      const base = range1(size);
    
      // 1行目をランダムに並べる
      const firstRow = shuffle(base);
    
      // 循環シフトで全行を作成（必ずLatinになる）
      let grid = Array.from({ length: size }, (_, r) =>
        Array.from({ length: size }, (_, c) => firstRow[(c + r) % size])
      );
    
      // 行/列をシャッフルして見た目をランダム化
      const rowOrder = shuffle([...Array(size).keys()]);
      const colOrder = shuffle([...Array(size).keys()]);
    
      grid = rowOrder.map((r) => colOrder.map((c) => grid[r][c]));
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