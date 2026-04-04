// Document Preview Functionality
class DocumentPreview {
    constructor() {
        this.modal = null;
        this.container = null;
        this.content = null;
        this.closeBtn = null;
        this.init();
    }

    init() {
        // Create modal HTML
        this.createModal();
        // Add event listeners
        this.addEventListeners();
    }

    createModal() {
        const modalHTML = `
            <div class="document-preview-modal" id="documentPreviewModal">
                <div class="document-preview-container">
                    <div class="document-preview-header">
                        <h3 class="document-preview-title">Document Preview</h3>
                        <button class="document-preview-close" id="previewCloseBtn">&times;</button>
                    </div>
                    <div class="document-preview-body" id="previewBody">
                        <div class="document-preview-loading">
                            <div style="display: flex; align-items: center; justify-content: center; gap: 12px;">
                                <div class="spinner" style="width: 24px; height: 24px; border: 3px solid #f3f3f3; border-top: 3px solid var(--primary-red); border-radius: 50%; animation: spin 1s linear infinite;"></div>
                                <span>Loading document...</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        this.modal = document.getElementById('documentPreviewModal');
        this.container = this.modal.querySelector('.document-preview-container');
        this.content = document.getElementById('previewBody');
        this.closeBtn = document.getElementById('previewCloseBtn');
    }

    addEventListeners() {
        // Close button
        this.closeBtn.addEventListener('click', () => this.close());
        
        // Close on background click
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.close();
            }
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('show')) {
                this.close();
            }
        });
    }

    show(documentUrl, filename = 'Document') {
        // Update title
        const title = this.modal.querySelector('.document-preview-title');
        title.textContent = `Preview: ${filename}`;
        
        // Show modal
        this.modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // Load document
        this.loadDocument(documentUrl);
    }

    loadDocument(url) {
        const fileExtension = this.getFileExtension(url);
        
        switch (fileExtension.toLowerCase()) {
            case 'pdf':
                this.loadPDF(url);
                break;
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'gif':
                this.loadImage(url);
                break;
            case 'doc':
            case 'docx':
                this.loadWordDocument(url);
                break;
            default:
                this.showError(`Unsupported file format: ${fileExtension.toUpperCase()}. Supported formats: PDF, JPG, PNG, GIF, DOC, DOCX`);
        }
    }

    getFileExtension(url) {
        return url.split('.').pop().split('?')[0];
    }

    loadPDF(url) {
        this.content.innerHTML = `
            <div class="document-preview-content">
                <iframe src="${url}" type="application/pdf" 
                        onload="this.parentElement.style.opacity='1'" 
                        onerror="this.parentElement.innerHTML='<div class=\\'document-preview-error\\'><h4>Failed to load PDF</h4><p>The PDF file could not be loaded. Please try downloading it instead.</p><button onclick=\\'window.open(\\'${url}\\', \\'_blank\\')\\' style=\\'margin-top: 16px; padding: 8px 16px; background: var(--primary-red); color: white; border: none; border-radius: 4px; cursor: pointer;\\'>Download PDF</button></div>'"></iframe>
            </div>
        `;
    }

    loadImage(url) {
        this.content.innerHTML = `
            <div class="document-preview-content">
                <img src="${url}" alt="Document preview" 
                     onload="this.style.opacity='1'" 
                     onerror="this.parentElement.innerHTML='<div class=\\'document-preview-error\\'><h4>Failed to load image</h4><p>The image file could not be loaded. Please try downloading it instead.</p><button onclick=\\'window.open(\\'${url}\\', \\'_blank\\')\\' style=\\'margin-top: 16px; padding: 8px 16px; background: var(--primary-red); color: white; border: none; border-radius: 4px; cursor: pointer;\\'>Download Image</button></div>'" 
                     style="opacity: 0; transition: opacity 0.3s ease;">
            </div>
        `;
    }

    loadWordDocument(url) {
        // For Word documents, we'll use Google Docs viewer as a fallback
        this.content.innerHTML = `
            <div class="document-preview-content">
                <iframe src="https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}" 
                        onload="this.parentElement.style.opacity='1'" 
                        onerror="this.parentElement.innerHTML='<div class=\\'document-preview-error\\'><h4>Failed to load document</h4><p>The Word document could not be loaded for preview. Please try downloading it instead.</p><button onclick=\\'window.open(\\'${url}\\', \\'_blank\\')\\' style=\\'margin-top: 16px; padding: 8px 16px; background: var(--primary-red); color: white; border: none; border-radius: 4px; cursor: pointer;\\'>Download Document</button></div>'"></iframe>
            </div>
        `;
    }

    showError(message) {
        this.content.innerHTML = `
            <div class="document-preview-error">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <h4>Preview Error</h4>
                <p>${message}</p>
                <button onclick="documentPreview.close()" style="margin-top: 16px; padding: 8px 16px; background: var(--primary-red); color: white; border: none; border-radius: 4px; cursor: pointer;">Close</button>
            </div>
        `;
    }

    close() {
        this.modal.classList.remove('show');
        document.body.style.overflow = '';
        
        // Clear content after closing animation
        setTimeout(() => {
            this.content.innerHTML = `
                <div class="document-preview-loading">
                    <div style="display: flex; align-items: center; justify-content: center; gap: 12px;">
                        <div class="spinner" style="width: 24px; height: 24px; border: 3px solid #f3f3f3; border-top: 3px solid var(--primary-red); border-radius: 50%; animation: spin 1s linear infinite;"></div>
                        <span>Loading document...</span>
                    </div>
                </div>
            `;
        }, 300);
    }
}

// Add spinner animation
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);

// Initialize global instance
let documentPreview;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    documentPreview = new DocumentPreview();
});

// Global function for easy access
window.showDocumentPreview = function(url, filename) {
    if (documentPreview) {
        documentPreview.show(url, filename);
    }
};
