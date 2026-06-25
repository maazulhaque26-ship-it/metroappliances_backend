import { useEffect } from 'react';

const BRAND = 'Metro Appliances';

/**
 * Sets document.title and meta[name="description"] for the current page.
 * Resets to brand default on unmount — safe to call in any page component.
 *
 * @param {string} title       Page-specific title (e.g. product name)
 * @param {string} description Page-specific meta description (max ~160 chars)
 */
export function usePageTitle(title, description) {
  useEffect(() => {
    document.title = title ? `${title} | ${BRAND}` : BRAND;

    if (description) {
      let meta = document.querySelector('meta[name="description"]');
      if (meta) {
        meta.setAttribute('content', description.slice(0, 160));
      }
    }

    return () => {
      document.title = BRAND;
    };
  }, [title, description]);
}

/**
 * Injects / updates a JSON-LD <script> tag in <head>.
 * Identified by data-schema attribute to allow safe updates on navigation.
 *
 * @param {object} schema  Valid Schema.org object (must include @type)
 * @param {string} schemaId Unique ID per schema type per page
 */
export function useJsonLd(schema, schemaId) {
  useEffect(() => {
    if (!schema || !schemaId) return;

    const id = `jsonld-${schemaId}`;
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement('script');
      el.type = 'application/ld+json';
      el.id = id;
      document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(schema);

    return () => {
      const existing = document.getElementById(id);
      if (existing) existing.remove();
    };
  }, [schema, schemaId]);
}
