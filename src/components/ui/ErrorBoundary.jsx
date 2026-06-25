import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Replace with Sentry.captureException(error, { extra: info }) when Sentry is configured
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleReset() {
    this.setState({ hasError: false });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg)',
            padding: '24px',
          }}
        >
          <div style={{ textAlign: 'center', maxWidth: '400px' }}>
            <p
              style={{
                fontSize: '10px',
                fontWeight: 800,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'var(--accent)',
                marginBottom: '16px',
              }}
            >
              Metro Appliances
            </p>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(56px, 10vw, 88px)',
                fontWeight: 900,
                color: 'var(--text)',
                letterSpacing: '-0.04em',
                lineHeight: 1,
                marginBottom: '16px',
              }}
            >
              500
            </h1>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '18px',
                fontWeight: 700,
                color: 'var(--text)',
                marginBottom: '10px',
              }}
            >
              Something went wrong
            </h2>
            <p style={{ color: 'var(--text-4)', fontSize: '14px', lineHeight: 1.6, marginBottom: '32px' }}>
              We hit an unexpected error. Your data is safe — please refresh the page to continue.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  background: 'var(--text)',
                  color: '#fff',
                  border: 'none',
                  padding: '13px 28px',
                  fontWeight: 700,
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  cursor: 'pointer',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                Refresh Page
              </button>
              <button
                onClick={() => { this.handleReset(); window.location.href = '/'; }}
                style={{
                  background: 'transparent',
                  color: 'var(--text-3)',
                  border: '1px solid var(--border)',
                  padding: '13px 28px',
                  fontWeight: 700,
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  cursor: 'pointer',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
