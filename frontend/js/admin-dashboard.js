const defaultTimetable = [
  { day: 'Monday', hours: '8:30 am - 4:30 pm', activities: 'BINGO, Canteen, Bridge' },
  { day: 'Tuesday', hours: '8:30 am - 4:30 pm', activities: 'Mahjong, Exercise Class, Table Tennis' },
  { day: 'Wednesday', hours: '8:30 am - 4:30 pm', activities: 'Morning Tea, Concert, Raffle, Lunch' },
  { day: 'Thursday', hours: '8:30 am - 4:30 pm', activities: 'Exercise Class, Table Tennis' },
  { day: 'Friday', hours: '8:30 am - 4:30 pm', activities: 'Craft' },
  { day: 'Saturday', hours: '8:30 am - 4:30 pm', activities: 'BINGO, Canteen' },
  { day: 'Sunday', hours: 'Closed', activities: 'Closed' }
];

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatPostDate(value) {
  const date = new Date(value);
  return new Intl.DateTimeFormat('en-AU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date);
}

function showStatus(elementId, type, message) {
  document.getElementById(elementId).innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${escapeHtml(message)}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
  `;
}

async function fetchNotices() {
  const res = await fetch('/notices');
  const data = await res.json();
  const list = document.getElementById('notice-list');
  list.innerHTML = '';

  if (!data.length) {
    list.innerHTML = '<div class="empty-state">There are no notices yet.</div>';
    return;
  }

  data.forEach(notice => {
    const card = document.createElement('article');
    card.className = 'notice-card';
    card.innerHTML = `
      ${notice.imageUrl ? `<img src="${notice.imageUrl}" alt="Notice image">` : ''}
      <div class="notice-card-body">
        <h3>${escapeHtml(notice.title)}</h3>
        <p>${escapeHtml(notice.content)}</p>
        <div class="notice-actions">
          <small class="text-muted">Posted ${formatPostDate(notice.postedAt)}</small>
          <div class="d-flex gap-2">
            <button type="button" class="btn btn-outline-secondary btn-sm" data-action="edit">Edit</button>
            <button type="button" class="btn btn-outline-danger btn-sm" data-action="delete">Delete</button>
          </div>
        </div>
      </div>
    `;

    card.querySelector('[data-action="edit"]').addEventListener('click', () => editNotice(notice));
    card.querySelector('[data-action="delete"]').addEventListener('click', () => deleteNotice(notice._id));
    list.appendChild(card);
  });
}

function resetNoticeForm() {
  const form = document.getElementById('notice-form');
  form.reset();
  form.removeAttribute('data-edit-id');
  document.getElementById('notice-form-title').textContent = 'Post a notice';
  document.getElementById('cancel-edit').classList.add('d-none');
  document.getElementById('image-preview').innerHTML = '';
}

function editNotice(notice) {
  document.getElementById('post-notice-tab')?.click();
  document.getElementById('title').value = notice.title;
  document.getElementById('content').value = notice.content;
  document.getElementById('notice-form').dataset.editId = notice._id;
  document.getElementById('notice-form-title').textContent = 'Edit notice';
  document.getElementById('cancel-edit').classList.remove('d-none');
  document.getElementById('notice-form').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

async function deleteNotice(id) {
  if (!confirm('Delete this notice?')) return;
  const res = await fetch(`/admin/notice/${id}`, { method: 'DELETE' });
  if (res.ok) {
    showStatus('status-message', 'success', 'Notice deleted.');
    fetchNotices();
  } else {
    showStatus('status-message', 'danger', 'Failed to delete notice.');
  }
}

async function loadTimetableEditor() {
  const editor = document.getElementById('timetable-editor');
  let entries = defaultTimetable;

  try {
    const res = await fetch('/timetable');
    if (res.ok) {
      const data = await res.json();
      entries = data.length ? data : defaultTimetable;
    }
  } catch (_error) {
    entries = defaultTimetable;
  }

  editor.innerHTML = entries.map((entry, index) => `
    <div class="timetable-row" data-index="${index}">
      <div>
        <label class="form-label" for="day-${index}">Day</label>
        <input id="day-${index}" class="form-control timetable-day" value="${escapeHtml(entry.day)}" required>
      </div>
      <div>
        <label class="form-label" for="hours-${index}">Hours</label>
        <input id="hours-${index}" class="form-control timetable-hours" value="${escapeHtml(entry.hours)}" required>
      </div>
      <div>
        <label class="form-label" for="activities-${index}">Activities</label>
        <input id="activities-${index}" class="form-control timetable-activities" value="${escapeHtml(entry.activities)}" required>
      </div>
    </div>
  `).join('');
}

document.getElementById('notice-form').addEventListener('submit', async event => {
  event.preventDefault();

  const form = event.target;
  const editId = form.dataset.editId;
  const method = editId ? 'PUT' : 'POST';
  const url = editId ? `/admin/notice/${editId}` : '/admin/notice';

  const formData = new FormData();
  formData.append('title', document.getElementById('title').value);
  formData.append('content', document.getElementById('content').value);
  if (document.getElementById('image').files[0]) {
    formData.append('image', document.getElementById('image').files[0]);
  }

  const res = await fetch(url, { method, body: formData });

  if (res.ok) {
    resetNoticeForm();
    showStatus('status-message', 'success', editId ? 'Notice updated.' : 'Notice posted.');
    await fetchNotices();
  } else {
    showStatus('status-message', 'danger', editId ? 'Failed to update notice.' : 'Failed to post notice.');
  }
});

document.getElementById('cancel-edit').addEventListener('click', resetNoticeForm);

document.getElementById('image').addEventListener('change', function() {
  const preview = document.getElementById('image-preview');
  preview.innerHTML = '';
  const file = this.files[0];
  if (!file) return;

  const img = document.createElement('img');
  img.src = URL.createObjectURL(file);
  img.alt = 'Selected notice preview';
  preview.appendChild(img);
});

document.getElementById('timetable-form').addEventListener('submit', async event => {
  event.preventDefault();

  const entries = [...document.querySelectorAll('.timetable-row')].map(row => ({
    day: row.querySelector('.timetable-day').value,
    hours: row.querySelector('.timetable-hours').value,
    activities: row.querySelector('.timetable-activities').value
  }));

  const res = await fetch('/admin/timetable', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ entries })
  });

  if (res.ok) {
    showStatus('timetable-status', 'success', 'Timetable updated.');
  } else {
    const data = await res.json().catch(() => ({ error: 'Failed to update timetable.' }));
    showStatus('timetable-status', 'danger', data.error || 'Failed to update timetable.');
  }
});

document.getElementById('register-form').addEventListener('submit', async event => {
  event.preventDefault();
  const username = document.getElementById('reg-username').value;
  const password = document.getElementById('reg-password').value;

  const res = await fetch('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  const data = await res.json().catch(() => ({}));
  if (res.ok) {
    showStatus('register-status', 'success', 'Admin registered.');
    event.target.reset();
  } else {
    showStatus('register-status', 'danger', data.error || 'Failed to register admin.');
  }
});

window.addEventListener('DOMContentLoaded', () => {
  fetchNotices();
  loadTimetableEditor();
});
