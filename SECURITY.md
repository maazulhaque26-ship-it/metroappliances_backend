# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.0.x   | ✅ Yes    |
| < 1.0   | ❌ No     |

Only the latest `1.0.x` release line receives security updates.

## Reporting a Vulnerability

If you discover a security vulnerability in the Metro Appliances ERP backend,
please report it responsibly:

1. **Do not** open a public GitHub issue for security vulnerabilities.
2. Email the security team at **security@metroappliances.example** with:
   - A description of the vulnerability
   - Steps to reproduce
   - The potential impact
   - Any suggested remediation
3. You will receive an acknowledgement within **3 business days**.
4. We aim to provide a remediation timeline within **10 business days** of triage.

Please allow us reasonable time to investigate and patch before any public
disclosure.

## Security Measures in This Release

The backend API implements the following controls:

| Control | Implementation |
|---------|----------------|
| HTTP security headers | `helmet` (CSP, HSTS, X-Frame-Options, X-Content-Type-Options) |
| CORS | Origin whitelist (`localhost`, `*.vercel.app`, `CLIENT_URL`) |
| Authentication | JWT with 9 isolated portal stacks (`type` claim enforced per middleware) |
| Password storage | `bcrypt` (rounds 10–12) on all account models |
| Rate limiting | 10 req / 15 min on auth endpoints; 200 req / min general |
| NoSQL injection | `express-mongo-sanitize` (`replaceWith: '_'`) |
| ReDoS protection | User-supplied search input escaped before `$regex` use |
| Request body limit | 2 MB |
| Error handling | Generic 500 messages in production (no stack-trace leakage) |
| Audit logging | Sensitive admin actions recorded in `AuditLog` (TTL 2 years) |
| Secrets | Provided via environment variables only — never committed |

## Known Issues

| Issue | Severity | Status |
|-------|----------|--------|
| `cloudinary` v1.41.3 (GHSA-g4mf-96x5-5m2c) | Medium | Cannot upgrade without replacing `multer-storage-cloudinary` (no v2-compatible release). User input is never passed as Cloudinary transform params — low exploitability. Scheduled for v1.1. |
| `js-yaml` via Jest (dev dependency) | Low | Dev-only; not shipped to production. Zero runtime exposure. |

See [CHANGELOG.md](CHANGELOG.md) for version history.
