import { useEffect, useRef, useState } from 'react';
import { request } from './api.js';
import { refreshCsrf } from './senior-api.js';
import { defaultTimetable } from '../../shared/timetable.js';

export default function useDashboard() {
  const [notices, setNotices] = useState(null);
  const [entries, setEntries] = useState([]);
  const [editId, setEditId] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState('');
  const [statuses, setStatuses] = useState({});
  const noticeForm = useRef(null);
  const status = (area, type, message) => setStatuses(current => ({ ...current, [area]: { type, message } }));
  async function failure(area, error) {
    if (error.status === 401) { window.location.replace('/admin/login'); return; }
    if (error.status === 403) {
      try { await refreshCsrf(); status(area, 'danger', 'Security token refreshed. Please retry your action.'); }
      catch { status(area, 'danger', 'Unable to refresh security token. Please sign in again.'); }
      return;
    }
    status(area, 'danger', error.message || 'Request failed. Please try again.');
  }
  const dismiss = area => setStatuses(current => ({ ...current, [area]: null }));
  const refreshNotices = async () => setNotices(await request('/notices'));

  useEffect(() => {
    let active = true;
    request('/notices').then(data => { if (active) setNotices(data); })
      .catch(() => { if (active) status('notice', 'danger', 'Notices could not be loaded right now.'); });
    request('/timetable').then(data => { if (active) setEntries(data.length ? data : defaultTimetable); }).catch(error => { if (active) failure('timetable', error); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!image) { setPreview(''); return; }
    const url = URL.createObjectURL(image);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  function resetNotice() {
    setEditId(null);
    setTitle('');
    setContent('');
    setImage(null);
    noticeForm.current?.reset();
  }

  function editNotice(notice) {
    resetNotice();
    setEditId(notice._id);
    setTitle(notice.title);
    setContent(notice.content);
    document.getElementById('post-notice-tab')?.click();
    noticeForm.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  async function saveNotice(event) {
    event.preventDefault();
    if (image && (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(image.type) || image.size > 5 * 1024 * 1024)) {
      status('notice', 'danger', 'Choose a JPEG, PNG, GIF or WebP image up to 5 MiB.'); return;
    }
    const body = new FormData();
    body.append('title', title);
    body.append('content', content);
    if (image) body.append('image', image);
    try {
      await request(editId ? `/admin/notice/${editId}` : '/admin/notice', { method: editId ? 'PUT' : 'POST', body });
      status('notice', 'success', editId ? 'Notice updated.' : 'Notice posted.');
      resetNotice();
      await refreshNotices();
    } catch (error) {
      await failure('notice', error);
    }
  }

  async function deleteNotice(id) {
    if (!window.confirm('Delete this notice?')) return;
    try {
      await request(`/admin/notice/${id}`, { method: 'DELETE' });
      status('notice', 'success', 'Notice deleted.');
      if (editId === id) resetNotice();
      await refreshNotices();
    } catch (error) {
      await failure('notice', error);
    }
  }

  async function saveTimetable(event) {
    event.preventDefault();
    try {
      await request('/admin/timetable', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entries })
      });
      status('timetable', 'success', 'Timetable updated.');
    } catch (error) {
      await failure('timetable', error);
    }
  }

  async function registerAdmin(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    if (new TextEncoder().encode(fields.get('password')).length > 72) { status('register', 'danger', 'Password must be at most 72 UTF-8 bytes.'); return; }
    try {
      await request('/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: fields.get('username'), password: fields.get('password') })
      });
      status('register', 'success', 'Admin registered.');
      form.reset();
    } catch (error) {
      await failure('register', error);
    }
  }

  return { notices, entries, setEntries, editId, title, setTitle, content, setContent, setImage, preview,
    statuses, dismiss, noticeForm, resetNotice, editNotice, saveNotice, deleteNotice, saveTimetable, registerAdmin };
}
