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

async function loadTimetable() {
  const schedule = document.getElementById('schedule-list');
  try {
    const res = await fetch('/timetable');
    const data = res.ok ? await res.json() : defaultTimetable;
    renderTimetable(data.length ? data : defaultTimetable);
  } catch (_error) {
    renderTimetable(defaultTimetable);
  }

  function renderTimetable(entries) {
    schedule.innerHTML = entries.map(entry => {
      const isClosed = entry.hours.toLowerCase().includes('closed') || entry.activities.toLowerCase().includes('closed');
      return `
        <article class="schedule-card ${isClosed ? 'closed' : ''}">
          <span>${escapeHtml(entry.hours)}</span>
          <h3>${escapeHtml(entry.day)}</h3>
          <p>${escapeHtml(entry.activities)}</p>
        </article>
      `;
    }).join('');
  }
}

async function loadNotices() {
  const board = document.getElementById('noticeboard-posts');

  try {
    const res = await fetch('/notices');
    const data = await res.json();
    board.innerHTML = '';

    if (!data.length) {
      board.innerHTML = '<div class="empty-state">No notices have been posted yet.</div>';
      return;
    }

    data.forEach(notice => {
      const card = document.createElement('article');
      card.className = 'notice-card';
      card.innerHTML = `
        ${notice.imageUrl ? `<img src="${notice.imageUrl}" alt="Notice image">` : ''}
        <div class="notice-body">
          <span class="notice-date">Posted ${formatPostDate(notice.postedAt)}</span>
          <h3>${escapeHtml(notice.title)}</h3>
          <p>${escapeHtml(notice.content)}</p>
        </div>
      `;
      board.appendChild(card);
    });
  } catch (_error) {
    board.innerHTML = '<div class="empty-state">Notices could not be loaded right now.</div>';
  }
}

loadTimetable();
loadNotices();
