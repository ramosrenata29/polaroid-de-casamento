/**
 * Polaroid de Casamento - Application Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide Icons
    if (window.lucide) {
        window.lucide.createIcons();
    }

    // DOM Elements
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');

    const webcamVideo = document.getElementById('webcam');
    const snapshotCanvas = document.getElementById('snapshot-canvas');
    const cameraPlaceholder = document.getElementById('camera-placeholder');
    const btnRetryCamera = document.getElementById('btn-retry-camera');
    const btnSwitchCamera = document.getElementById('btn-switch-camera');
    const btnCapture = document.getElementById('btn-capture');

    const polaroidFrame = document.getElementById('polaroid-frame');
    const captionPreviewText = document.getElementById('caption-preview-text');

    const inputCoupleName = document.getElementById('input-couple-name');
    const formatButtons = document.querySelectorAll('#format-options .segment-btn');
    const selectFont = document.getElementById('select-font');

    const pickerBorderColor = document.getElementById('picker-border-color');
    const borderColorHex = document.getElementById('border-color-hex');
    const borderPresets = document.querySelectorAll('#border-presets .preset-swatch');

    const pickerFontColor = document.getElementById('picker-font-color');
    const fontColorHex = document.getElementById('font-color-hex');
    const fontPresets = document.querySelectorAll('#font-presets .preset-swatch');

    const muralGrid = document.getElementById('mural-grid');
    const muralCount = document.getElementById('mural-count');

    const modalResult = document.getElementById('modal-result');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const btnRetake = document.getElementById('btn-retake');
    const btnDownload = document.getElementById('btn-download');
    const resultImage = document.getElementById('result-image');

    // State
    let currentStream = null;
    let currentFacingMode = 'user'; // 'user' (front) or 'environment' (back)
    let selectedFormat = 'vertical'; // 'vertical', 'square', 'horizontal'
    let muralPhotos = loadMuralPhotos();

    // Init Theme
    const savedTheme = localStorage.getItem('polaroid-theme') ||
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(savedTheme);

    themeToggleBtn.addEventListener('click', () => {
        const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    });

    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('polaroid-theme', theme);
        if (themeIcon) {
            themeIcon.setAttribute('data-lucide', theme === 'dark' ? 'sun' : 'moon');
            if (window.lucide) window.lucide.createIcons();
        }
    }

    // Camera Initialization
    async function startCamera() {
        if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop());
        }

        const constraints = {
            video: {
                facingMode: currentFacingMode,
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            },
            audio: false
        };

        try {
            currentStream = await navigator.mediaDevices.getUserMedia(constraints);
            webcamVideo.srcObject = currentStream;
            webcamVideo.style.display = 'block';
            cameraPlaceholder.style.display = 'none';
        } catch (err) {
            console.warn('Camera access error:', err);
            webcamVideo.style.display = 'none';
            cameraPlaceholder.style.display = 'flex';
        }
    }

    startCamera();

    if (btnRetryCamera) {
        btnRetryCamera.addEventListener('click', startCamera);
    }

    if (btnSwitchCamera) {
        btnSwitchCamera.addEventListener('click', () => {
            currentFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
            startCamera();
        });
    }

    // Real-time UI updates
    inputCoupleName.addEventListener('input', (e) => {
        const text = e.target.value.trim();
        captionPreviewText.textContent = text || 'Iuri e Renata - 10.10.26';
    });

    selectFont.addEventListener('change', (e) => {
        captionPreviewText.style.fontFamily = e.target.value;
    });

    // Format selection
    formatButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            formatButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedFormat = btn.dataset.format;

            polaroidFrame.classList.remove('format-vertical', 'format-square', 'format-horizontal');
            polaroidFrame.classList.add(`format-${selectedFormat}`);
        });
    });

    // Border color handlers
    pickerBorderColor.addEventListener('input', (e) => {
        updateBorderColor(e.target.value);
    });

    borderPresets.forEach(preset => {
        preset.addEventListener('click', () => {
            const color = preset.dataset.color;
            pickerBorderColor.value = color;
            updateBorderColor(color);
        });
    });

    function updateBorderColor(hex) {
        polaroidFrame.style.backgroundColor = hex;
        borderColorHex.textContent = hex.toUpperCase();
    }

    // Font color handlers
    pickerFontColor.addEventListener('input', (e) => {
        updateFontColor(e.target.value);
    });

    fontPresets.forEach(preset => {
        preset.addEventListener('click', () => {
            const color = preset.dataset.color;
            pickerFontColor.value = color;
            updateFontColor(color);
        });
    });

    function updateFontColor(hex) {
        captionPreviewText.style.color = hex;
        fontColorHex.textContent = hex.toUpperCase();
    }

    // Capture Photo Logic
    btnCapture.addEventListener('click', () => {
        generatePolaroidImage();
    });

    function createThumbnailDataUrl(canvas) {
        const thumbCanvas = document.createElement('canvas');
        const scale = 400 / canvas.width;
        thumbCanvas.width = 400;
        thumbCanvas.height = canvas.height * scale;
        const ctx = thumbCanvas.getContext('2d');
        ctx.drawImage(canvas, 0, 0, thumbCanvas.width, thumbCanvas.height);
        return thumbCanvas.toDataURL('image/jpeg', 0.8);
    }

    function generatePolaroidImage() {
        const canvas = snapshotCanvas;
        const ctx = canvas.getContext('2d');

        // Dimensions definition for high quality rendering
        let photoWidth = 1200;
        let photoHeight;

        if (selectedFormat === 'vertical') {
            photoHeight = 1500; // 4:5 ratio
        } else if (selectedFormat === 'square') {
            photoHeight = 1200; // 1:1 ratio
        } else {
            // horizontal
            photoHeight = 900;  // 4:3 ratio
        }

        const borderPaddingTop = 48;
        const borderPaddingSides = 48;
        const borderPaddingBottom = 160;

        const totalWidth = photoWidth + (borderPaddingSides * 2);
        const totalHeight = photoHeight + borderPaddingTop + borderPaddingBottom;

        canvas.width = totalWidth;
        canvas.height = totalHeight;

        // Fill Polaroid background border color
        ctx.fillStyle = pickerBorderColor.value;
        ctx.fillRect(0, 0, totalWidth, totalHeight);

        // Draw webcam frame or fallback placeholder
        if (webcamVideo.readyState === webcamVideo.HAVE_ENOUGH_DATA && webcamVideo.style.display !== 'none') {
            const videoWidth = webcamVideo.videoWidth;
            const videoHeight = webcamVideo.videoHeight;

            // Calculate object-fit: cover cropping for the canvas photo area
            const sourceRatio = videoWidth / videoHeight;
            const targetRatio = photoWidth / photoHeight;

            let sx, sy, sWidth, sHeight;

            if (sourceRatio > targetRatio) {
                sHeight = videoHeight;
                sWidth = videoHeight * targetRatio;
                sx = (videoWidth - sWidth) / 2;
                sy = 0;
            } else {
                sWidth = videoWidth;
                sHeight = videoWidth / targetRatio;
                sx = 0;
                sy = (videoHeight - sHeight) / 2;
            }

            // Save state for potential mirroring
            ctx.save();
            if (currentFacingMode === 'user') {
                // Mirror horizontally for front camera to match video feed
                ctx.translate(borderPaddingSides + photoWidth, borderPaddingTop);
                ctx.scale(-1, 1);
                ctx.drawImage(webcamVideo, sx, sy, sWidth, sHeight, 0, 0, photoWidth, photoHeight);
            } else {
                ctx.drawImage(webcamVideo, sx, sy, sWidth, sHeight, borderPaddingSides, borderPaddingTop, photoWidth, photoHeight);
            }
            ctx.restore();
        } else {
            // Draw dummy background if camera off
            ctx.fillStyle = '#2d3748';
            ctx.fillRect(borderPaddingSides, borderPaddingTop, photoWidth, photoHeight);
            ctx.fillStyle = '#a0aec0';
            ctx.font = '30px Montserrat, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Câmera Desativada', borderPaddingSides + photoWidth / 2, borderPaddingTop + photoHeight / 2);
        }

        // Draw Caption Text
        const captionText = inputCoupleName.value.trim() || 'Iuri e Renata - 10.10.26';
        const fontStyle = selectFont.value;

        ctx.fillStyle = pickerFontColor.value;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Calculate dynamic font size based on text length
        let fontSize = 64;
        if (captionText.length > 25) fontSize = 48;
        if (captionText.length > 35) fontSize = 38;

        // Clean font family string for canvas rendering
        ctx.font = `${fontSize}px ${fontStyle}`;

        const textX = totalWidth / 2;
        const textY = borderPaddingTop + photoHeight + (borderPaddingBottom / 2);

        ctx.fillText(captionText, textX, textY);

        // Export to result image and open modal
        const dataUrl = canvas.toDataURL('image/png');
        const thumbUrl = createThumbnailDataUrl(canvas);
        const filename = `polaroid-${captionText.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'casamento'}.png`;

        resultImage.src = dataUrl;
        btnDownload.href = dataUrl;
        btnDownload.download = filename;

        modalResult.style.display = 'flex';

        // Add to Mural Gallery
        addPhotoToMural({
            id: Date.now(),
            dataUrl: dataUrl,
            thumbUrl: thumbUrl,
            caption: captionText,
            filename: filename,
            date: new Date().toLocaleString('pt-BR')
        });
    }

    // Mural Storage & Management
    function loadMuralPhotos() {
        try {
            const data = localStorage.getItem('polaroid-mural-photos');
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.warn('Could not load mural photos:', e);
            return [];
        }
    }

    function saveMuralPhotos() {
        try {
            // Store optimized list with thumbnail URLs to fit localStorage limits safely
            const storablePhotos = muralPhotos.slice(0, 15).map(p => ({
                id: p.id,
                thumbUrl: p.thumbUrl || p.dataUrl,
                dataUrl: p.dataUrl,
                caption: p.caption,
                filename: p.filename,
                date: p.date
            }));
            localStorage.setItem('polaroid-mural-photos', JSON.stringify(storablePhotos));
        } catch (e) {
            console.warn('LocalStorage full, trimming oldest mural photos:', e);
            try {
                const compactPhotos = muralPhotos.slice(0, 5).map(p => ({
                    id: p.id,
                    thumbUrl: p.thumbUrl || p.dataUrl,
                    caption: p.caption,
                    filename: p.filename,
                    date: p.date
                }));
                localStorage.setItem('polaroid-mural-photos', JSON.stringify(compactPhotos));
            } catch (err) {
                console.error('Failed to store mural photos:', err);
            }
        }
    }

    function addPhotoToMural(photoObj) {
        muralPhotos.unshift(photoObj); // newest first
        saveMuralPhotos();
        renderMural();
    }

    function deletePhotoFromMural(id) {
        muralPhotos = muralPhotos.filter(p => p.id !== id);
        saveMuralPhotos();
        renderMural();
    }

    function renderMural() {
        muralCount.textContent = `${muralPhotos.length} ${muralPhotos.length === 1 ? 'foto' : 'fotos'}`;

        if (muralPhotos.length === 0) {
            muralGrid.innerHTML = `
                <div class="mural-empty-state">
                    <i data-lucide="image"></i>
                    <p>Nenhuma foto no mural ainda. Tire uma foto para começar o seu álbum!</p>
                </div>
            `;
            if (window.lucide) window.lucide.createIcons();
            return;
        }

        muralGrid.innerHTML = muralPhotos.map(photo => `
            <div class="mural-card" data-id="${photo.id}">
                <img src="${photo.thumbUrl || photo.dataUrl}" alt="${photo.caption}" class="mural-thumb">
                <div class="mural-card-actions">
                    <button type="button" class="btn-card-action btn-view" title="Visualizar" data-id="${photo.id}">
                        <i data-lucide="eye"></i>
                    </button>
                    <a href="${photo.dataUrl || photo.thumbUrl}" download="${photo.filename}" class="btn-card-action btn-download-card" title="Baixar">
                        <i data-lucide="download"></i>
                    </a>
                    <button type="button" class="btn-card-action btn-delete" title="Excluir" data-id="${photo.id}">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            </div>
        `).join('');

        if (window.lucide) window.lucide.createIcons();

        // Attach event listeners for card actions
        muralGrid.querySelectorAll('.btn-view, .mural-thumb').forEach(el => {
            el.addEventListener('click', (e) => {
                const card = e.target.closest('.mural-card');
                const photoId = parseInt(card.dataset.id, 10);
                const photo = muralPhotos.find(p => p.id === photoId);
                if (photo) {
                    const src = photo.dataUrl || photo.thumbUrl;
                    resultImage.src = src;
                    btnDownload.href = src;
                    btnDownload.download = photo.filename;
                    modalResult.style.display = 'flex';
                }
            });
        });

        muralGrid.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const card = e.target.closest('.mural-card');
                const photoId = parseInt(card.dataset.id, 10);
                deletePhotoFromMural(photoId);
            });
        });
    }

    // Initial render of mural
    renderMural();

    // Modal controls
    btnCloseModal.addEventListener('click', closeModal);
    btnRetake.addEventListener('click', closeModal);

    modalResult.addEventListener('click', (e) => {
        if (e.target === modalResult) {
            closeModal();
        }
    });

    function closeModal() {
        modalResult.style.display = 'none';
    }
});
