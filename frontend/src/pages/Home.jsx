import { useEffect, useState } from 'react';
import { fetchTimetable, formatPostDate, request } from '../api.js';
import Contact from '../components/Contact.jsx';

export default function Home() {
  const [entries, setEntries] = useState([]);
  const [notices, setNotices] = useState(null);
  const [noticeError, setNoticeError] = useState(false);
  useEffect(() => {
    let active = true;
    fetchTimetable().then(data => { if (active) setEntries(data); });
    request('/notices').then(data => { if (active) setNotices(data); })
      .catch(() => { if (active) setNoticeError(true); });
    return () => { active = false; };
  }, []);
  return (<>
<nav className="navbar navbar-expand-lg fixed-top site-nav">
    <div className="container">
      <a className="navbar-brand fw-bold" href="/">Sandgate Seniors</a>
      <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNavbar" aria-controls="mainNavbar" aria-expanded="false" aria-label="Toggle navigation">
        <span className="navbar-toggler-icon"></span>
      </button>
      <div className="collapse navbar-collapse" id="mainNavbar">
        <ul className="navbar-nav ms-auto">
          <li className="nav-item"><a className="nav-link" href="#about">About</a></li>
          <li className="nav-item"><a className="nav-link" href="#schedule">Timetable</a></li>
          <li className="nav-item"><a className="nav-link" href="#noticeboard">Notices</a></li>
          <li className="nav-item"><a className="nav-link" href="/admin/login">Admin</a></li>
        </ul>
        <a className="powered-by-logo powered-by-mobile" href="https://nielseninnovations.com" target="_blank" rel="noopener noreferrer" aria-label="Powered by Nielsen Innovations">
          <span className="powered-by-text">Powered by</span>
          <span className="powered-by-name">Nielsen Innovations</span>
        </a>
      </div>
    </div>
    <a className="powered-by-logo powered-by-desktop" href="https://nielseninnovations.com" target="_blank" rel="noopener noreferrer" aria-label="Powered by Nielsen Innovations">
      <span className="powered-by-text">Powered by</span>
      <span className="powered-by-name">Nielsen Innovations</span>
    </a>
  </nav>

  <header className="hero">
    <div className="container hero-layout">
      <div className="hero-photo-frame">
        <img src="/static/mainphoto.png" className="hero-photo" alt="Sandgate Senior Citizens Centre" />
      </div>
      <div className="hero-content">
        <p className="hero-kicker">Serving Sandgate since 1952</p>
        <h1>Sandgate & District Senior Citizens Centre</h1>
        <p className="hero-copy">A welcoming place for friendship, activities, meals, music, and community connection.</p>
        <div className="hero-actions">
          <a className="btn btn-primary btn-lg" href="#schedule">View Timetable</a>
          <a className="btn btn-light btn-lg" href="#contact">Contact Us</a>
        </div>
      </div>
    </div>
  </header>

  <main>
    <section className="section about-section" id="about">
      <div className="container">
        <div className="row align-items-center g-5">
          <div className="col-lg-6">
            <img src="/static/oldies.png" className="feature-img" alt="Sandgate seniors enjoying time together" />
          </div>
          <div className="col-lg-6">
            <p className="section-kicker">About us</p>
            <h2>Good company, regular activities, and a familiar local welcome.</h2>
            <p className="lead">Established in the heart of Sandgate, our Senior Citizens Centre has been a place of friendship, fun, and community since 1952. We provide a supportive and inclusive space where older adults can stay active, social, and engaged through a variety of programs and services.</p>
            <div className="contact-strip">
              <div>
                <span>Visit</span>
                <strong>20 Seymour St, Sandgate QLD</strong>
              </div>
              <div>
                <span>Call</span>
                <strong>(07) 3269 4454</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section className="section timetable-section" id="schedule">
      <div className="container">
        <div className="section-title">
          <p className="section-kicker">Weekly timetable</p>
          <h2>What is on this week</h2>
        </div>
        <div id="schedule-list" className="schedule-grid" aria-live="polite">
          {entries.map((entry, index) => (
            <article key={index} className={`schedule-card ${entry.hours.toLowerCase().includes('closed') || entry.activities.toLowerCase().includes('closed') ? 'closed' : ''}`}>
              <span>{entry.hours}</span>
              <h3>{entry.day}</h3>
              <p>{entry.activities}</p>
            </article>
          ))}
        </div>
      </div>
    </section>

    <section className="section notice-section" id="noticeboard">
      <div className="container">
        <div className="section-title">
          <p className="section-kicker">Noticeboard</p>
          <h2>Latest centre updates</h2>
        </div>
        <div id="noticeboard-posts" className="notice-grid" aria-live="polite">
          {noticeError ? <div className="empty-state">Notices could not be loaded right now.</div>
            : notices?.length === 0 ? <div className="empty-state">No notices have been posted yet.</div>
            : notices?.map(notice => (
              <article className="notice-card" key={notice._id}>
                {notice.imageUrl && <img src={notice.imageUrl} alt="Notice image" />}
                <div className="notice-body">
                  <span className="notice-date">{`Posted ${formatPostDate(notice.postedAt)}`}</span>
                  <h3>{notice.title}</h3>
                  <p>{notice.content}</p>
                </div>
              </article>
            ))}
        </div>
      </div>
    </section>
    <Contact />
  </main>

  <footer className="footer">
    <div className="container footer-content">
      <p>&copy; 2026 Sandgate & District Senior Citizens Centre</p>
      <a className="powered-by-logo footer-powered" href="https://nielseninnovations.com" target="_blank" rel="noopener noreferrer" aria-label="Powered by Nielsen Innovations">
        <span className="powered-by-text">Powered by</span>
        <span className="powered-by-name">Nielsen Innovations</span>
      </a>
    </div>
  </footer>
  </>);
}
