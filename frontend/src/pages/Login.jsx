import { useRef, useState } from 'react';
import { login } from '../senior-api.js';

export default function Login() {
  const [flash, setFlash] = useState('');
  const [pending, setPending] = useState(false);
  const busy = useRef(false);
  async function submit(event) {
    event.preventDefault();
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    setFlash('');
    const fields = new FormData(event.currentTarget);
    try {
      await login(fields.get('username'), fields.get('password'));
      window.location.assign('/admin/dashboard');
    } catch (error) { setFlash(error.message || 'Unable to sign in. Please try again.'); }
    finally { busy.current = false; setPending(false); }
  }
  return (<>
<nav className="navbar navbar-expand-lg login-nav">
    <div className="container">
      <a className="navbar-brand fw-bold" href="/">Sandgate Seniors</a>
      <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#loginNavbar" aria-controls="loginNavbar" aria-expanded="false" aria-label="Toggle navigation">
        <span className="navbar-toggler-icon"></span>
      </button>
      <div className="collapse navbar-collapse" id="loginNavbar">
        <div className="login-nav-actions ms-auto">
          <a className="nav-link" href="/">View Site</a>
          <a className="powered-by-logo powered-by-mobile" href="https://nielseninnovations.com" target="_blank" rel="noopener noreferrer" aria-label="Powered by Nielsen Innovations">
            <span className="powered-by-text">Powered by</span>
            <span className="powered-by-name">Nielsen Innovations</span>
          </a>
        </div>
      </div>
    </div>
    <a className="powered-by-logo powered-by-desktop" href="https://nielseninnovations.com" target="_blank" rel="noopener noreferrer" aria-label="Powered by Nielsen Innovations">
      <span className="powered-by-text">Powered by</span>
      <span className="powered-by-name">Nielsen Innovations</span>
    </a>
  </nav>

  <main className="login-shell">
    <section className="login-panel">
      <div className="login-card">
        <p className="login-kicker">Admin access</p>
        <h1>Welcome back</h1>
        <p className="login-copy">Sign in to update notices and the weekly timetable.</p>
        <div id="flash-message" role="alert">{flash && <div className="alert alert-info">{flash}</div>}</div>

        <form onSubmit={submit}>
          <div className="mb-3">
            <label htmlFor="username" className="form-label">Username</label>
            <input type="text" name="username" id="username" className="form-control" required autoFocus />
          </div>
          <div className="mb-4">
            <label htmlFor="password" className="form-label">Password</label>
            <input type="password" name="password" id="password" className="form-control" required />
          </div>
          <button type="submit" className="btn btn-primary w-100" disabled={pending}>{pending ? 'Signing in?' : 'Login'}</button>
        </form>
      </div>
    </section>
  </main>
  </>);
}
