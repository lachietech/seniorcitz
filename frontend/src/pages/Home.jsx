import { useEffect, useState } from 'react';
import { fetchTimetable, formatPostDate, request } from '../api.js';
import Contact from '../components/Contact.jsx';

const aboutSlides = [
  {
    image: '/static/oldies.png',
    alt: 'Sandgate seniors enjoying time together',
    subtitle: 'Friendship and good company',
    description:
      'Since 1952, the centre has been a welcoming place for older adults to make friends, stay active, and enjoy time together.',
  },
  {
    image: '/static/canteen.jpg',
    alt: 'The canteen and seating area inside Sandgate Senior Citizens Centre',
    subtitle: 'A place to pause and catch up',
    description:
      'Our canteen and shared spaces make it easy to enjoy a conversation, a cup of tea, or a break between activities.',
  },
  {
    image: '/static/mural.jpg',
    alt: 'Sandgate Senior Citizens Centre mural on the outside wall',
    subtitle: 'Proudly part of Sandgate',
    description:
      'The centre mural celebrates the local community and the connections that have grown here over many years.',
  },
];

export default function Home() {
  const [entries, setEntries] = useState([]);
  const [notices, setNotices] = useState(null);
  const [noticeError, setNoticeError] = useState(false);
  const [activeAboutSlide, setActiveAboutSlide] = useState(0);
  const [aboutPaused, setAboutPaused] = useState(false);
  const aboutSlide = aboutSlides[activeAboutSlide];
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (
        !aboutPaused &&
        document.visibilityState === 'visible' &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ) {
        setActiveAboutSlide((current) => (current + 1) % aboutSlides.length);
      }
    }, 5000);
    return () => window.clearInterval(timer);
  }, [aboutPaused]);
  useEffect(() => {
    let active = true;
    fetchTimetable().then((data) => {
      if (active) setEntries(data);
    });
    request('/notices')
      .then((data) => {
        if (active) setNotices(data);
      })
      .catch(() => {
        if (active) setNoticeError(true);
      });
    return () => {
      active = false;
    };
  }, []);
  return (
    <>
      <nav className="navbar navbar-expand-lg fixed-top site-nav">
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
            <ul className="navbar-nav ms-auto">
              <li className="nav-item">
                <a className="nav-link" href="#about">
                  About
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#schedule">
                  Timetable
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#noticeboard">
                  Notices
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="/admin/login">
                  Admin
                </a>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <header className="hero">
        <div className="container hero-layout">
          <div className="hero-photo-frame">
            <img
              src="/static/mainphoto.png"
              className="hero-photo"
              alt="Entrance to Sandgate and District Senior Citizens Centre"
              width="676"
              height="453"
              fetchPriority="high"
            />
          </div>
          <div className="hero-content">
            <p className="hero-kicker">Serving Sandgate since 1952</p>
            <h1>Sandgate & District Senior Citizens Centre</h1>
            <p className="hero-slogan">Live It Up!</p>
            <p className="hero-copy">
              A welcoming place for friendship, activities, meals, music, and community connection.
            </p>
            <div className="hero-actions">
              <a className="btn btn-primary btn-lg hero-btn-primary" href="#schedule">
                View Timetable
              </a>
              <a className="btn btn-primary btn-lg hero-btn-secondary" href="#contact">
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="home-main">
        <section className="section about-section" id="about">
          <div className="container">
            <div className="section-title about-title">
              <p className="section-kicker">About us</p>
              <h2>A familiar local welcome</h2>
            </div>
            <div
              className="about-carousel"
              role="region"
              aria-roledescription="carousel"
              aria-label="About Sandgate Seniors"
              onMouseEnter={() => setAboutPaused(true)}
              onMouseLeave={() => setAboutPaused(false)}
              onFocusCapture={() => setAboutPaused(true)}
              onBlurCapture={() => setAboutPaused(false)}
            >
              <div className="about-carousel-media">
                <img src={aboutSlide.image} className="about-carousel-image" alt={aboutSlide.alt} />
              </div>
              <div className="about-carousel-copy">
                <div aria-live="off">
                  <p className="carousel-count">
                    {activeAboutSlide + 1} of {aboutSlides.length}
                  </p>
                  <h3>{aboutSlide.subtitle}</h3>
                  <p>{aboutSlide.description}</p>
                </div>
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
            <div className="about-static-slides">
              {aboutSlides.map((slide) => (
                <article className="about-static-card" key={slide.image}>
                  <img src={slide.image} alt={slide.alt} loading="lazy" />
                  <div>
                    <h3>{slide.subtitle}</h3>
                    <p>{slide.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
        <Contact />

        <section className="section timetable-section" id="schedule">
          <div className="container">
            <div className="section-title">
              <p className="section-kicker">Weekly timetable</p>
              <h2>What is on this week</h2>
            </div>
            <div id="schedule-list" className="schedule-grid" aria-live="polite">
              {entries.map((entry, index) => (
                <article
                  key={index}
                  className={`schedule-card ${entry.hours.toLowerCase().includes('closed') || entry.activities.toLowerCase().includes('closed') ? 'closed' : ''}`}
                >
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
              {noticeError ? (
                <div className="empty-state">Notices could not be loaded right now.</div>
              ) : notices?.length === 0 ? (
                <div className="empty-state">No notices have been posted yet.</div>
              ) : (
                notices?.map((notice) => (
                  <article className="notice-card" key={notice._id}>
                    {notice.imageUrl && <img src={notice.imageUrl} alt="Notice image" />}
                    <div className="notice-body">
                      <span className="notice-date">{`Posted ${formatPostDate(notice.postedAt)}`}</span>
                      <h3>{notice.title}</h3>
                      <p>{notice.content}</p>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        </section>
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
