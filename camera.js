export function qs(selector, root = document) {
  return root.querySelector(selector);
}

export function qsa(selector, root = document) {
  return [...root.querySelectorAll(selector)];
}

export function setText(selector, value) {
  const element = qs(selector);
  if (element) element.textContent = value;
}
