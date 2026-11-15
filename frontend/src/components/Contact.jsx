import { useRef, useState } from 'react';
import { createKonnectClient } from '../konnect-client.js';
import { konnectConfig } from '../config.js';

export default function Contact() {
  const busy = useRef(false);
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState(null);
  async function submit(event) {
    event.preventDefault();
    if (busy.current) return;
    const form = event.currentTarget;
    busy.current = true;
    setPending(true);
    setStatus(null);
    try {
      const result = await createKonnectClient(konnectConfig).submit(
        Object.fromEntries(new FormData(form)),
      );
      setStatus({ type: 'success', message: result.message });
      form.reset();
    } catch (error) {
      const message = error.deliveryUnknown
        ? 'Delivery could not be confirmed. Your message may have arrived. Please call us before sending it again.'
        : error.status === 429
          ? `Too many enquiries. Please wait ${error.retryAfter ? `${error.retryAfter} seconds` : 'a few minutes'} before trying again.`
          : error.message || 'Your enquiry could not be sent. Please try again later.';
      setStatus({ type: 'danger', message });
    } finally {
      busy.current = false;
      setPending(false);
    }
  }
  return (
    <section className="section contact-section" id="contact">
      <div className="container contact-layout">
        <div className="section-title contact-intro">
          <p className="section-kicker">Get in touch</p>
          <h2>Contact us</h2>
          <p>
            Ask about activities, membership or visiting the centre. We would be glad to hear from
            you.
          </p>
          <p className="contact-phone">
            Prefer to talk? <a href="tel:+61732694454">Call (07) 3269 4454</a>
          </p>
        </div>
        <form onSubmit={submit} className="contact-form" aria-busy={pending}>
          <div className="row g-3">
            {[
              ['name', 'Your name', 'text', 120],
              ['email', 'Email address', 'email', 254],
              ['subject', 'Subject', 'text', 160],
            ].map(([name, label, type, max]) => (
              <div className={name === 'subject' ? 'col-12' : 'col-md-6'} key={name}>
                <label className="form-label" htmlFor={`contact-${name}`}>
                  {label}
                </label>
                <input
                  className="form-control"
                  id={`contact-${name}`}
                  name={name}
                  type={type}
                  maxLength={max}
                  autoComplete={name === 'subject' ? 'off' : name}
                  required
                />
              </div>
            ))}
            <div className="col-12">
              <label className="form-label" htmlFor="contact-message">
                Message
              </label>
              <textarea
                className="form-control"
                id="contact-message"
                name="message"
                rows="5"
                maxLength={4000}
                required
              />
            </div>
          </div>
          <div hidden aria-hidden="true">
            <label htmlFor="contact-website">Website</label>
            <input id="contact-website" name="website" tabIndex={-1} autoComplete="off" />
          </div>
          <p className="mt-3">
            Your contact details and message will be shared with the centre to respond to your
            enquiry.
          </p>
          <button className="btn btn-primary" disabled={pending}>
            {pending ? 'Sending…' : 'Send enquiry'}
          </button>
          <div aria-live="polite" role="status">
            {status && <p className={`alert alert-${status.type} mt-3`}>{status.message}</p>}
          </div>
        </form>
      </div>
    </section>
  );
}
