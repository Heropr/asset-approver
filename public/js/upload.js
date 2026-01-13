// DOM Elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const browseBtn = document.getElementById('browseBtn');
const previewArea = document.getElementById('previewArea');
const previewGrid = document.getElementById('previewGrid');
const uploadBtn = document.getElementById('uploadBtn');
const resultArea = document.getElementById('resultArea');
const shareUrl = document.getElementById('shareUrl');
const copyBtn = document.getElementById('copyBtn');

// State
let selectedFiles = [];

// Event Listeners
browseBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  fileInput.click();
});

uploadArea.addEventListener('click', () => {
  fileInput.click();
});

fileInput.addEventListener('change', handleFileSelect);

// Drag and drop
uploadArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
  uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadArea.classList.remove('dragover');
  const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
  addFiles(files);
});

uploadBtn.addEventListener('click', uploadImages);
copyBtn.addEventListener('click', copyShareUrl);

// Functions
function handleFileSelect(e) {
  const files = Array.from(e.target.files);
  addFiles(files);
}

function addFiles(files) {
  selectedFiles = [...selectedFiles, ...files];
  renderPreviews();
}

function removeFile(index) {
  selectedFiles.splice(index, 1);
  renderPreviews();
}

function renderPreviews() {
  if (selectedFiles.length === 0) {
    previewArea.classList.remove('active');
    uploadArea.style.display = 'block';
    return;
  }

  previewArea.classList.add('active');
  uploadArea.style.display = 'none';
  previewGrid.innerHTML = '';

  selectedFiles.forEach((file, index) => {
    const item = document.createElement('div');
    item.className = 'preview-item';

    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);

    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-btn';
    removeBtn.textContent = '×';
    removeBtn.onclick = () => removeFile(index);

    item.appendChild(img);
    item.appendChild(removeBtn);
    previewGrid.appendChild(item);
  });
}

async function uploadImages() {
  if (selectedFiles.length === 0) return;

  uploadBtn.disabled = true;
  uploadBtn.textContent = 'Uploading...';

  const formData = new FormData();
  selectedFiles.forEach(file => {
    formData.append('images', file);
  });

  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const data = await response.json();

    // Show result
    previewArea.classList.remove('active');
    resultArea.classList.add('active');

    const fullUrl = `${window.location.origin}${data.reviewUrl}`;
    shareUrl.value = fullUrl;

  } catch (error) {
    console.error('Upload error:', error);
    alert('Upload failed. Please try again.');
    uploadBtn.disabled = false;
    uploadBtn.textContent = 'Upload Images';
  }
}

function copyShareUrl() {
  shareUrl.select();
  document.execCommand('copy');

  const originalText = copyBtn.textContent;
  copyBtn.textContent = 'Copied!';
  setTimeout(() => {
    copyBtn.textContent = originalText;
  }, 2000);
}
