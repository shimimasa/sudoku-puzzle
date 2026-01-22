export function el(tag, options = {}) {
    const node = document.createElement(tag);
  
    if (options.className) node.className = options.className;
    if (options.text != null) node.textContent = String(options.text);
    if (options.html != null) node.innerHTML = options.html;
  
    if (options.attrs) {
      for (const [k, v] of Object.entries(options.attrs)) {
        node.setAttribute(k, String(v));
      }
    }
  
    if (options.on) {
      for (const [event, handler] of Object.entries(options.on)) {
        node.addEventListener(event, handler);
      }
    }
  
    if (options.children) {
      for (const c of options.children) node.appendChild(c);
    }
  
    return node;
  }
  