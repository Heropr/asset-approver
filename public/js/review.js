// DOM Elements
const loadingState = document.getElementById('loadingState');
const errorState = document.getElementById('errorState');
const content = document.getElementById('content');
const assetGrid = document.getElementById('assetGrid');
const totalCount = document.getElementById('totalCount');
const approvedCount = document.getElementById('approvedCount');
const pendingCount = document.getElementById('pendingCount');

// Modal elements
const modalOverlay = document.getElementById('modalOverlay');
const modalFilename = document.getElementById('modalFilename');
const modalImage = document.getElementById('modalImage');
const closeModal = document.getElementById('closeModal');
const approveBtn = document.getElementById('approveBtn');
const rejectBtn = document.getElementById('rejectBtn');
const commentsList = document.getElementById('commentsList');
const commentForm = document.getElementById('commentForm');
const commentAuthor = document.getElementById('commentAuthor');
const commentContent = document.getElementById('commentContent');

// State
let batchId = null;
let assets = [];
let currentAsset = null;

// Get batch ID from URL
const pathParts = window.location.pathname.split('/');
batchId = pathParts[pathParts.length - 1];

// Load batch data
loadBatch();

async function loadBatch() {
  try {
    const response = await fetch(`/api/batches/${batchId}`);

    if (!response.ok) {
      throw new Error('Batch not found');
    }

    const data = await response.json();
    assets = data.assets;

    renderAssets();
    updateStats();

    loadingState.style.display = 'none';
    content.style.display = 'block';

  } catch (error) {
    console.error('Load error:', error);
    loadingState.style.display = 'none';
    errorState.style.display = 'block';
  }
}

function renderAssets() {
  assetGrid.innerHTML = '';

  assets.forEach(asset => {
    const card = document.createElement('div');
    card.className = 'asset-card';
    card.onclick = () => openAssetModal(asset);

    card.innerHTML = `
      <div class="asset-image-container">
        <img src="/uploads/${asset.filepath}" alt="${asset.filename}">
        <span class="status-badge ${asset.status}">${capitalizeFirst(asset.status)}</span>
      </div>
      <div class="asset-info">
        <p class="asset-filename">${asset.filename}</p>
      </div>
    `;

    assetGrid.appendChild(card);
  });
}

function updateStats() {
  const approved = assets.filter(a => a.status === 'approved').length;
  const pending = assets.filter(a => a.status === 'pending').length;

  totalCount.textContent = assets.length;
  approvedCount.textContent = approved;
  pendingCount.textContent = pending;
}

async function openAssetModal(asset) {
  currentAsset = asset;

  modalFilename.textContent = asset.filename;
  modalImage.src = `/uploads/${asset.filepath}`;

  // Update button states
  updateActionButtons();

  // Load comments
  await loadComments();

  modalOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeAssetModal() {
  modalOverlay.classList.remove('active');
  document.body.style.overflow = '';
  currentAsset = null;
}

function updateActionButtons() {
  approveBtn.classList.toggle('active', currentAsset.status === 'approved');
  rejectBtn.classList.toggle('active', currentAsset.status === 'rejected');
}

async function loadComments() {
  try {
    const response = await fetch(`/api/assets/${currentAsset.id}`);
    const data = await response.json();

    renderComments(data.comments);
  } catch (error) {
    console.error('Load comments error:', error);
  }
}

function renderComments(comments) {
  if (comments.length === 0) {
    commentsList.innerHTML = '<p class="no-comments">No comments yet</p>';
    return;
  }

  commentsList.innerHTML = comments.map(comment => `
    <div class="comment">
      <div class="comment-author">${escapeHtml(comment.author)}</div>
      <div class="comment-content">${escapeHtml(comment.content)}</div>
      <div class="comment-time">${formatTime(comment.created_at)}</div>
    </div>
  `).join('');

  // Scroll to bottom
  commentsList.scrollTop = commentsList.scrollHeight;
}

async function updateStatus(status) {
  try {
    const response = await fetch(`/api/assets/${currentAsset.id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });

    if (!response.ok) throw new Error('Failed to update status');

    // Update local state
    currentAsset.status = status;
    const assetIndex = assets.findIndex(a => a.id === currentAsset.id);
    if (assetIndex !== -1) {
      assets[assetIndex].status = status;
    }

    updateActionButtons();
    renderAssets();
    updateStats();

  } catch (error) {
    console.error('Update status error:', error);
    alert('Failed to update status. Please try again.');
  }
}

async function addComment(e) {
  e.preventDefault();

  const author = commentAuthor.value.trim();
  const content = commentContent.value.trim();

  if (!author || !content) return;

  try {
    const response = await fetch(`/api/assets/${currentAsset.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author, content })
    });

    if (!response.ok) throw new Error('Failed to add comment');

    // Clear form and reload comments
    commentContent.value = '';
    await loadComments();

  } catch (error) {
    console.error('Add comment error:', error);
    alert('Failed to add comment. Please try again.');
  }
}

// Event listeners
closeModal.addEventListener('click', closeAssetModal);
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeAssetModal();
});

approveBtn.addEventListener('click', () => updateStatus('approved'));
rejectBtn.addEventListener('click', () => updateStatus('rejected'));
commentForm.addEventListener('submit', addComment);

// Escape key closes modal
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeAssetModal();
});

// Utility functions
function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;

  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;

  return date.toLocaleDateString();
}
