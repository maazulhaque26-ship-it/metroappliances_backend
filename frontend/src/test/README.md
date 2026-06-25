# Metro Appliances — Frontend Testing Foundation

## Stack
- **Unit / Component**: Vitest + Testing Library React
- **E2E**: Playwright (future)
- **Accessibility**: axe-core via @axe-core/playwright (future)

## Install
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

## vite.config.js addition
```js
test: {
  globals: true,
  environment: 'jsdom',
  setupFiles: ['./src/test/setup.js'],
}
```

## Test structure
```
src/
  __tests__/
    components/
      shared/
        DataTable.test.jsx
        Pagination.test.jsx
        StatusBadge.test.jsx
    hooks/
      useDebounce.test.js
      usePagination.test.js
      usePermissions.test.js
    services/
      formatters.test.js
      exportService.test.js
    pages/
      admin/
        AdminAuditLog.test.jsx
```

## Run
```bash
npx vitest
npx vitest --coverage
```

## Naming conventions
- Component tests: `ComponentName.test.jsx`
- Hook tests: `useHookName.test.js`
- Service tests: `serviceName.test.js`
- Integration tests: `*.integration.test.js`
