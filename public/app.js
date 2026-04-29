let addresses = [];
let sortable;

document.addEventListener('DOMContentLoaded', () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js');
  }
});

async function parseAddresses() {
  const text = document.getElementById('textInput').value.trim();
  if (!text) return;

  const btn = document.getElementById('parseBtn');
  btn.disabled = true;
  btn.textContent = '解析中...';
  clearError();

  try {
    const res = await fetch('/api/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `錯誤 (${res.status})`);

    addresses = [...addresses, ...data.addresses];
    renderList();
    document.getElementById('textInput').value = '';
  } catch (e) {
    showError(e.message);
  } finally {
    btn.disabled = false;
    btn.textContent = '解析地址';
  }
}

function renderList() {
  const section = document.getElementById('listSection');
  const list = document.getElementById('addressList');

  if (addresses.length === 0) {
    section.style.display = 'none';
    return;
  }

  section.style.display = 'block';
  document.getElementById('listCount').textContent = `共 ${addresses.length} 個地址`;

  list.innerHTML = addresses.map((addr, i) => `
    <div class="address-item" data-index="${i}">
      <span class="drag-handle">⠿</span>
      <span class="addr-num">${i + 1}</span>
      <span class="addr-text">${escapeHtml(addr)}</span>
      <button class="delete-btn" onclick="removeAddress(${i})">×</button>
    </div>
  `).join('');

  if (sortable) sortable.destroy();
  sortable = Sortable.create(list, {
    animation: 150,
    handle: '.drag-handle',
    ghostClass: 'sortable-ghost',
    onEnd: (evt) => {
      const [moved] = addresses.splice(evt.oldIndex, 1);
      addresses.splice(evt.newIndex, 0, moved);
      renderList();
    }
  });
}

function removeAddress(index) {
  addresses.splice(index, 1);
  renderList();
}

function clearAll() {
  addresses = [];
  renderList();
}

function openMaps() {
  if (addresses.length < 2) {
    showToast('至少需要 2 個地址');
    return;
  }

  const parts = addresses.map(a => encodeURIComponent(a)).join('/');
  const webUrl = `https://maps.google.com/maps/dir/${parts}/`;
  const intentUrl = `intent://maps.google.com/maps/dir/${parts}/#Intent;scheme=https;package=com.google.android.apps.maps;S.browser_fallback_url=${encodeURIComponent(webUrl)};end`;

  window.location.href = intentUrl;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function showError(msg) {
  clearError();
  const div = document.createElement('div');
  div.className = 'error-msg';
  div.id = 'errorMsg';
  div.textContent = msg;
  const listSection = document.getElementById('listSection');
  listSection.parentNode.insertBefore(div, listSection);
}

function clearError() {
  document.getElementById('errorMsg')?.remove();
}

function showToast(msg) {
  document.querySelector('.toast')?.remove();
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2000);
}
