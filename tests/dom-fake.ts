// Minimal DOM boundary fake: no browser layout or PiP visibility is implied.
export class ElementFake extends EventTarget {
  children: ElementFake[] = [];
  private ownText = '';
  get textContent(): string { return this.ownText + this.children.map(child => child.textContent).join(''); }
  set textContent(value: string) { this.ownText = value; this.children = []; }
  hidden = false;
  disabled = false;
  title = '';
  id = '';
  className = '';
  type = '';
  value = '';
  isConnected = false;
  style = { cssText: '' };
  attributes = new Map<string, string>();
  shadow?: ElementFake;
  append(...nodes: ElementFake[]) { this.children.push(...nodes); nodes.forEach(node => { node.isConnected = true; }); }
  replaceChildren(...nodes: ElementFake[]) { this.children = []; this.append(...nodes); }
  remove() { this.isConnected = false; }
  attachShadow() { this.shadow = new ElementFake(); return this.shadow; }
  setAttribute(name: string, value: string) { this.attributes.set(name, value); }
  removeAttribute(name: string) { this.attributes.delete(name); }
}
export class DocumentFake extends EventTarget {
  title = '';
  documentElement = { lang: '' };
  body = new ElementFake();
  head = new ElementFake();
  elements: ElementFake[] = [];
  createElement() { const element = new ElementFake(); this.elements.push(element); return element; }
}
