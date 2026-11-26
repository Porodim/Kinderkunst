// Kurzer Hinweis am unteren Rand (wie say() in der alten App).
let zeitgeber = null;

export function zeigeHinweis(text, dauer = 2800) {
  let element = document.querySelector('.hinweis');
  if (!element) {
    element = document.createElement('div');
    element.className = 'hinweis';
    element.setAttribute('role', 'status');
    document.body.append(element);
  }
  element.textContent = text;
  clearTimeout(zeitgeber);
  zeitgeber = setTimeout(() => element.remove(), dauer);
}
