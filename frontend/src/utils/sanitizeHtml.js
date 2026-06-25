// DOM-based XSS sanitizer — no third-party dependency.
// Uses DOMParser to build a real DOM tree from untrusted HTML, then walks it
// and keeps only a strict allowlist of tags and attributes.

const ALLOWED_TAGS = new Set([
  'p', 'br', 'b', 'strong', 'i', 'em', 'u', 's', 'strike',
  'h1', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'blockquote',
  'a', 'span', 'div',
]);

const ALLOWED_ATTRS = {
  a:    ['href', 'title', 'rel', 'target'],
  span: ['style'],
  div:  [],
};

const SAFE_STYLE_PROPS = new Set(['color', 'background-color', 'font-weight', 'font-style', 'text-decoration']);

function sanitizeStyle(raw) {
  if (!raw) return '';
  return raw
    .split(';')
    .map(s => s.trim())
    .filter(s => {
      const [prop] = s.split(':').map(p => p.trim().toLowerCase());
      return SAFE_STYLE_PROPS.has(prop);
    })
    .join('; ');
}

function cleanNode(node, doc) {
  if (node.nodeType === Node.TEXT_NODE) return node.cloneNode(false);

  if (node.nodeType !== Node.ELEMENT_NODE) return null;

  const tag = node.tagName.toLowerCase();
  if (!ALLOWED_TAGS.has(tag)) {
    const frag = doc.createDocumentFragment();
    node.childNodes.forEach(child => {
      const cleaned = cleanNode(child, doc);
      if (cleaned) frag.appendChild(cleaned);
    });
    return frag;
  }

  const el = doc.createElement(tag);

  const allowedAttrs = ALLOWED_ATTRS[tag] || [];
  allowedAttrs.forEach(attr => {
    const val = node.getAttribute(attr);
    if (val == null) return;
    if (attr === 'href') {
      // Only allow http/https/mailto — block javascript: and data:
      if (/^(https?:|mailto:)/i.test(val.trim())) {
        el.setAttribute('href', val);
        el.setAttribute('rel', 'noopener noreferrer');
        if (!node.getAttribute('target')) el.setAttribute('target', '_blank');
      }
    } else if (attr === 'style') {
      const safe = sanitizeStyle(val);
      if (safe) el.setAttribute('style', safe);
    } else {
      el.setAttribute(attr, val);
    }
  });

  node.childNodes.forEach(child => {
    const cleaned = cleanNode(child, doc);
    if (cleaned) el.appendChild(cleaned);
  });

  return el;
}

export function sanitizeHtml(html) {
  if (!html || typeof html !== 'string') return '';
  const parser = new DOMParser();
  const doc    = parser.parseFromString(html, 'text/html');
  const out    = document.createDocumentFragment();
  doc.body.childNodes.forEach(child => {
    const cleaned = cleanNode(child, document);
    if (cleaned) out.appendChild(cleaned);
  });
  const wrapper = document.createElement('div');
  wrapper.appendChild(out);
  return wrapper.innerHTML;
}
