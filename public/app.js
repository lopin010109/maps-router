let addresses = [];
let sortable;

document.addEventListener('DOMContentLoaded', () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js');
  }
  updateDeleteBtns();
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

function buildMapsUrl(addrs) {
  const useFirst = document.getElementById('useFirstAsOrigin').checked;
  const parts = addrs.map(a => encodeURIComponent(a)).join('/');
  const origin = useFirst ? '' : 'My+Location';
  const path = origin ? `${origin}/${parts}` : parts;
  const webUrl = `https://maps.google.com/maps/dir/${path}/`;

  const ua = navigator.userAgent;
  const isAndroid = /Android/.test(ua);
  const isIOS = /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  if (isAndroid) {
    const intentUrl = `intent://maps.google.com/maps/dir/${path}/#Intent;scheme=https;package=com.google.android.apps.maps;S.browser_fallback_url=${encodeURIComponent(webUrl)};end`;
    window.location.href = intentUrl;
  } else if (isIOS) {
    window.location.href = webUrl;
  } else {
    window.open(webUrl, '_blank');
  }
}

function openMaps() {
  if (addresses.length < 1) {
    showToast('至少需要 1 個地址');
    return;
  }
  buildMapsUrl(addresses);
}

function addRow() {
  const container = document.getElementById('manualInputs');
  const row = document.createElement('div');
  row.className = 'manual-row';
  row.innerHTML = `
    <input type="text" class="manual-input" placeholder="輸入地址">
    <button class="row-del-btn" onclick="removeRow(this)">×</button>
    <button class="row-add-btn" onclick="addRow()">+</button>
  `;
  container.appendChild(row);
  row.querySelector('input').focus();
  updateDeleteBtns();
}

function removeRow(btn) {
  btn.closest('.manual-row').remove();
  updateDeleteBtns();
}

function updateDeleteBtns() {
  const rows = document.querySelectorAll('.manual-row');
  rows.forEach(row => {
    row.querySelector('.row-del-btn').style.visibility = rows.length === 1 ? 'hidden' : 'visible';
  });
}

function openMapsManual() {
  const inputs = document.querySelectorAll('.manual-input');
  const addrs = Array.from(inputs).map(i => i.value.trim()).filter(v => v);
  if (addrs.length < 1) {
    showToast('至少需要 1 個地址');
    return;
  }
  buildMapsUrl(addrs);
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
