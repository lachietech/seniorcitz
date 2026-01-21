async function fetchNotices() {
    const res = await fetch('/notices');
    const data = await res.json();
    const list = document.getElementById('notice-list');
    list.innerHTML = '';

    data.forEach(n => {
    const card = document.createElement('div');
    card.className = 'cardn my-4 shadow-sm rounded-3';
    card.innerHTML = `
        <div class="card-body p-4">
        <h4 class="fw-bold text-dark mb-2">${n.title}</h4>
        <div style="white-space: pre-wrap;" class="mb-3">${n.content}</div>
        ${n.imageUrl ? `
            <div class="text-center mb-3">
            <img src="${n.imageUrl}" class="img-fluid rounded shadow-sm" style="max-width: 100%; height: auto;" alt="Notice Image" />
            </div>` : ''}
        <div class="d-flex justify-content-between align-items-center mt-4">
            <small class="text-muted">Posted: ${new Date(n.postedAt).toLocaleString()}</small>
            <div>
            <button class="btn btn-warning btn-sm" onclick="editNotice('${n._id}', \`${n.title}\`, \`${n.content}\`)">✏️ Edit</button>
            <button class="btn btn-danger btn-sm" onclick="deleteNotice('${n._id}')">🗑️ Delete</button>
            </div>
        </div>
        </div>`;
    list.appendChild(card);
    });
}

function editNotice(id, title, content) {
    document.getElementById('title').value = title;
    document.getElementById('content').value = content;
    document.getElementById('notice-form').dataset.editId = id;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function deleteNotice(id) {
    if (!confirm('Are you sure you want to delete this notice?')) return;
    const res = await fetch(`/admin/notice/${id}`, { method: 'DELETE' });
    if (res.ok) fetchNotices();
}

document.getElementById('notice-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const form = e.target;
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
    const status = document.getElementById('status-message');

    if (res.ok) {
    form.reset();
    form.removeAttribute('data-edit-id');
    document.getElementById('image-preview').innerHTML = '';
    status.innerHTML = `
        <div class="alert alert-success alert-dismissible fade show" role="alert">
        ${editId ? 'Notice updated' : 'Notice posted'} successfully!
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>`;
    status.scrollIntoView({ behavior: 'smooth' });
    await fetchNotices();
    } else {
    status.innerHTML = `
        <div class="alert alert-danger alert-dismissible fade show" role="alert">
        Failed to ${editId ? 'update' : 'post'} notice.
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>`;
    }
});

document.getElementById('image').addEventListener('change', function () {
    const preview = document.getElementById('image-preview');
    preview.innerHTML = '';
    const file = this.files[0];
    if (file) {
    const img = document.createElement('img');
    img.className = 'img-fluid rounded mt-2';
    img.style.maxHeight = '300px';
    img.style.display = 'block';
    img.style.margin = '0 auto';
    img.src = URL.createObjectURL(file);
    preview.appendChild(img);
    }
});

document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('reg-username').value;
    const password = document.getElementById('reg-password').value;

    const res = await fetch('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    document.getElementById('register-status').innerHTML = res.ok
    ? '<div class="alert alert-success">Admin registered!</div>'
    : `<div class="alert alert-danger">${data.error}</div>`;

    if (res.ok) e.target.reset();
});

window.addEventListener('DOMContentLoaded', fetchNotices);