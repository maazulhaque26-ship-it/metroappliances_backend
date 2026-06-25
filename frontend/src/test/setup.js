/**
 * Vitest / Testing-Library setup — Sprint 9F
 *
 * To activate:
 *   npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
 *
 * Then add to vite.config.js:
 *   test: { globals: true, environment: 'jsdom', setupFiles: ['./src/test/setup.js'] }
 */
import '@testing-library/jest-dom';
