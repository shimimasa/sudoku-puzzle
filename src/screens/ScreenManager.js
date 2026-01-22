export class ScreenManager {
    constructor(root, gameState) {
      this.root = root;
      this.gameState = gameState;
      this.registry = new Map();
      this.current = null;
      this.history = []; // 戻り用（最小）
    }
  
    register(name, ScreenClass) {
      this.registry.set(name, ScreenClass);
    }
  
    start(name, params = {}) {
      this.changeScreen(name, params, { replace: true });
    }
  
    changeScreen(name, params = {}, options = {}) {
      const ScreenClass = this.registry.get(name);
      if (!ScreenClass) throw new Error(`Screen "${name}" is not registered`);
  
      const prev = this.current;
      const next = new ScreenClass(this, this.gameState, params);
  
      if (prev) {
        prev.unmount?.();
        if (!options.replace) {
          this.history.push({ name: prev.name, params: prev.params });
        }
      }
  
      this.current = next;
      this.current.mount?.(this.root);
    }
  
    back(fallbackName = "title") {
      const last = this.history.pop();
      if (!last) {
        this.changeScreen(fallbackName, {}, { replace: true });
        return;
      }
      this.changeScreen(last.name, last.params, { replace: true });
    }
  }
  