import { useEffect, useRef, useState } from 'react';
import { request, logout, refreshCsrf } from '../senior-api.js';
import useDashboard from '../useDashboard.js';
import { formatPostDate } from '../api.js';
import Status from '../components/Status.jsx';

export default function Dashboard() {
  const [state, setState] = useState('loading');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setState('loading');
    request('/auth/session')
      .then(() => {
        if (active) setState('ready');
      })
      .catch((error) => {
        if (!active) return;
        if (error.status === 401) window.location.replace('/admin/login');
        else setState('error');
      });
    return () => {
      active = false;
    };
  }, [attempt]);
  if (state !== 'ready')
    return (
      <main className="container py-5" role="status">
        {state === 'loading' ? (
          'Checking your session?'
        ) : (
          <>
            <p>Unable to check your session. Please try again.</p>
            <button className="btn btn-primary" onClick={() => setAttempt((value) => value + 1)}>
              Retry
            </button>
          </>
        )}
      </main>
    );
  return <DashboardContent />;
}

function DashboardContent() {
  const busy = useRef(false);
  const [logoutError, setLogoutError] = useState('');
  const [pending, setPending] = useState(false);
  async function signOut(event) {
    event.preventDefault();
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    setLogoutError('');
    try {
      await logout();
      window.location.assign('/admin/login');
    } catch (error) {
      if (error.status === 401) window.location.replace('/admin/login');
      else if (error.status === 403) {
        await refreshCsrf().catch(() => {});
        setLogoutError('Security token refreshed. Please try logging out again.');
      } else setLogoutError('Logout could not be confirmed. Please try again.');
    } finally {
      busy.current = false;
      setPending(false);
    }
  }
  const dashboard = useDashboard();
  return (
    <>
      <nav className="navbar navbar-expand-lg admin-nav">
        <div className="container">
          <a className="navbar-brand fw-bold" href="/">
            Sandgate Seniors
          </a>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#mainNavbar"
            aria-controls="mainNavbar"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="mainNavbar">
            <ul className="navbar-nav ms-auto align-items-lg-center">
              <li className="nav-item">
                <a className="nav-link" href="/">
                  View Site
                </a>
              </li>
              <li className="nav-item">
                <form onSubmit={signOut}>
                  <button type="submit" className="btn btn-outline-light btn-sm" disabled={pending}>
                    Logout
                  </button>
                </form>
              </li>
            </ul>
            <a
              className="powered-by-logo powered-by-mobile"
              href="https://nielseninnovations.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Powered by Nielsen Innovations"
            >
              <span className="powered-by-text">Powered by</span>
              <span className="powered-by-name">Nielsen Innovations</span>
            </a>
          </div>
        </div>
        <a
          className="powered-by-logo powered-by-desktop"
          href="https://nielseninnovations.com"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Powered by Nielsen Innovations"
        >
          <span className="powered-by-text">Powered by</span>
          <span className="powered-by-name">Nielsen Innovations</span>
        </a>
      </nav>

      <header className="admin-hero">
        <div className="container">
          <p className="admin-kicker">Admin board</p>
          <h1>Keep the centre page current</h1>
          <p>
            Post notices, update the weekly timetable, and manage access from one clean workspace.
          </p>
        </div>
      </header>

      <main className="container admin-layout">
        {logoutError && (
          <p role="alert" className="alert alert-danger">
            {logoutError}
          </p>
        )}
        <div className="admin-tabs">
          <ul className="nav nav-tabs" id="adminTabs" role="tablist">
            <li className="nav-item" role="presentation">
              <button
                className="nav-link active"
                id="post-notice-tab"
                data-bs-toggle="tab"
                data-bs-target="#post-notice-pane"
                type="button"
                role="tab"
                aria-controls="post-notice-pane"
                aria-selected="true"
              >
                Post Notice
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className="nav-link"
                id="timetable-tab"
                data-bs-toggle="tab"
                data-bs-target="#timetable-pane"
                type="button"
                role="tab"
                aria-controls="timetable-pane"
                aria-selected="false"
              >
                Timetable
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className="nav-link"
                id="notices-tab"
                data-bs-toggle="tab"
                data-bs-target="#notices-pane"
                type="button"
                role="tab"
                aria-controls="notices-pane"
                aria-selected="false"
              >
                Current Notices
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className="nav-link"
                id="access-tab"
                data-bs-toggle="tab"
                data-bs-target="#access-pane"
                type="button"
                role="tab"
                aria-controls="access-pane"
                aria-selected="false"
              >
                Access
              </button>
            </li>
          </ul>

          <div className="tab-content">
            <section
              className="tab-pane fade show active admin-panel"
              id="post-notice-pane"
              role="tabpanel"
              aria-labelledby="post-notice-tab"
              tabIndex="0"
            >
              <div className="panel-heading">
                <div>
                  <p className="admin-kicker">Noticeboard</p>
                  <h2 id="notice-form-title">
                    {dashboard.editId ? 'Edit notice' : 'Post a notice'}
                  </h2>
                </div>
                <button
                  id="cancel-edit"
                  type="button"
                  className={`btn btn-outline-secondary btn-sm${dashboard.editId ? '' : ' d-none'}`}
                  onClick={dashboard.resetNotice}
                >
                  Cancel Edit
                </button>
              </div>

              <form
                id="notice-form"
                encType="multipart/form-data"
                ref={dashboard.noticeForm}
                onSubmit={dashboard.saveNotice}
              >
                <div className="mb-3">
                  <label htmlFor="title" className="form-label">
                    Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    maxLength={200}
                    className="form-control"
                    required
                    value={dashboard.title}
                    onChange={(event) => dashboard.setTitle(event.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="content" className="form-label">
                    Content
                  </label>
                  <textarea
                    id="content"
                    maxLength={20000}
                    className="form-control"
                    rows="5"
                    required
                    value={dashboard.content}
                    onChange={(event) => dashboard.setContent(event.target.value)}
                  ></textarea>
                </div>
                <div className="mb-3">
                  <label htmlFor="image" className="form-label">
                    Image (optional)
                  </label>
                  <input
                    type="file"
                    id="image"
                    className="form-control"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={(event) => dashboard.setImage(event.target.files[0] || null)}
                  />
                  <div id="image-preview" className="image-preview">
                    {dashboard.preview && (
                      <img src={dashboard.preview} alt="Selected notice preview" />
                    )}
                  </div>
                </div>
                <button type="submit" className="btn btn-primary">
                  Save Notice
                </button>
              </form>

              <div id="status-message" className="status-area">
                <Status
                  status={dashboard.statuses.notice}
                  onDismiss={() => dashboard.dismiss('notice')}
                />
              </div>
            </section>

            <section
              className="tab-pane fade admin-panel"
              id="timetable-pane"
              role="tabpanel"
              aria-labelledby="timetable-tab"
              tabIndex="0"
            >
              <div className="panel-heading">
                <div>
                  <p className="admin-kicker">Weekly timetable</p>
                  <h2>Edit public timetable</h2>
                </div>
              </div>

              <form id="timetable-form" onSubmit={dashboard.saveTimetable}>
                <div id="timetable-editor" className="timetable-editor">
                  {dashboard.entries.map((entry, index) => (
                    <div className="timetable-row" data-index={index} key={index}>
                      {['day', 'hours', 'activities'].map((field) => (
                        <div key={field}>
                          <label className="form-label" htmlFor={`${field}-${index}`}>
                            {field[0].toUpperCase() + field.slice(1)}
                          </label>
                          <input
                            id={`${field}-${index}`}
                            className={`form-control timetable-${field}`}
                            value={entry[field]}
                            required
                            onChange={(event) =>
                              dashboard.setEntries((current) =>
                                current.map((row, rowIndex) =>
                                  rowIndex === index
                                    ? { ...row, [field]: event.target.value }
                                    : row,
                                ),
                              )
                            }
                          />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                <button type="submit" className="btn btn-primary mt-3">
                  Save Timetable
                </button>
              </form>
              <div id="timetable-status" className="status-area">
                <Status
                  status={dashboard.statuses.timetable}
                  onDismiss={() => dashboard.dismiss('timetable')}
                />
              </div>
            </section>

            <section
              className="tab-pane fade admin-panel"
              id="notices-pane"
              role="tabpanel"
              aria-labelledby="notices-tab"
              tabIndex="0"
            >
              <div className="panel-heading">
                <div>
                  <p className="admin-kicker">Current notices</p>
                  <h2>Manage noticeboard posts</h2>
                </div>
              </div>
              <div id="notice-list" className="notice-list">
                {dashboard.notices?.length === 0 ? (
                  <div className="empty-state">There are no notices yet.</div>
                ) : (
                  dashboard.notices?.map((notice) => (
                    <article className="notice-card" key={notice._id}>
                      {notice.imageUrl && <img src={notice.imageUrl} alt="Notice image" />}
                      <div className="notice-card-body">
                        <h3>{notice.title}</h3>
                        <p>{notice.content}</p>
                        <div className="notice-actions">
                          <small className="text-muted">{`Posted ${formatPostDate(notice.postedAt)}`}</small>
                          <div className="d-flex gap-2">
                            <button
                              type="button"
                              className="btn btn-outline-secondary btn-sm"
                              data-action="edit"
                              onClick={() => dashboard.editNotice(notice)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-danger btn-sm"
                              data-action="delete"
                              onClick={() => dashboard.deleteNotice(notice._id)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>

            <section
              className="tab-pane fade admin-panel"
              id="access-pane"
              role="tabpanel"
              aria-labelledby="access-tab"
              tabIndex="0"
            >
              <div className="panel-heading">
                <div>
                  <p className="admin-kicker">Access</p>
                  <h2>Register new admin</h2>
                </div>
              </div>

              <form id="register-form" onSubmit={dashboard.registerAdmin}>
                <div className="mb-3">
                  <label htmlFor="reg-username" className="form-label">
                    Username
                  </label>
                  <input
                    type="text"
                    id="reg-username"
                    maxLength={100}
                    name="username"
                    className="form-control"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="reg-password" className="form-label">
                    Password
                  </label>
                  <input
                    type="password"
                    id="reg-password"
                    minLength={12}
                    aria-describedby="password-guidance"
                    name="password"
                    className="form-control"
                    required
                  />
                </div>
                <p id="password-guidance">Use at least 12 characters, up to 72 UTF-8 bytes.</p>
                <button type="submit" className="btn btn-secondary">
                  Register Admin
                </button>
              </form>
              <div id="register-status" className="status-area">
                <Status
                  status={dashboard.statuses.register}
                  onDismiss={() => dashboard.dismiss('register')}
                />
              </div>
            </section>
          </div>
        </div>
      </main>

      <footer className="footer">
        <div className="container footer-content">
          <p>&copy; 2026 Sandgate & District Senior Citizens Centre</p>
          <a
            className="powered-by-logo footer-powered"
            href="https://nielseninnovations.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Powered by Nielsen Innovations"
          >
            <span className="powered-by-text">Powered by</span>
            <span className="powered-by-name">Nielsen Innovations</span>
          </a>
        </div>
      </footer>
    </>
  );
}
