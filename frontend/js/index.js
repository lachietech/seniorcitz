async function loadNotices() {
    const res = await fetch('/notices');
    const data = await res.json();
    const board = document.getElementById('noticeboard-posts');
    board.innerHTML = '';
    data.forEach(n => {
    const div = document.createElement('div');
    div.className = `card rounded-3 my-4 shadow-sm`;
    div.innerHTML = `
        <div class="card-body p-4">
        <h4 class="fw-bold text-dark mb-2">${n.title}</h4>
        <div style="white-space: pre-wrap;" class="mb-3">${n.content}</div>
        ${n.imageUrl ? `
            <div class="text-center mb-3">
            <img src="${n.imageUrl}" class="img-fluid rounded shadow-sm" style="max-width: 100%; height: auto;" alt="Notice Image" />
            </div>` : ''}
        <div class="text-end text-muted small">Posted: ${new Date(n.postedAt).toLocaleString()}</div>
        </div>
    `;
    board.appendChild(div);
    });
}
loadNotices();