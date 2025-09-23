// BeatsChain Extension - Minimal Working Version
class BeatsChainApp {
    constructor() {
        this.beatFile = null;
        this.beatMetadata = {};
        this.licenseTerms = '';
    }

    init() {
        const uploadArea = document.getElementById('upload-area');
        const fileInput = document.getElementById('audio-file');
        
        if (uploadArea && fileInput) {
            uploadArea.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', (e) => {
                if (e.target.files[0]) this.processFile(e.target.files[0]);
            });
        }

        const generateBtn = document.getElementById('generate-license');
        if (generateBtn) generateBtn.addEventListener('click', () => this.generateLicense());

        const approveBtn = document.getElementById('approve-license');
        if (approveBtn) approveBtn.addEventListener('click', () => this.approveLicense());

        const mintBtn = document.getElementById('mint-nft');
        if (mintBtn) mintBtn.addEventListener('click', () => this.mintNFT());

        const anotherBtn = document.getElementById('mint-another');
        if (anotherBtn) anotherBtn.addEventListener('click', () => this.reset());
    }

    processFile(file) {
        this.beatFile = file;
        this.beatMetadata = {
            title: file.name.replace(/\.[^/.]+$/, ""),
            fileName: file.name,
            type: file.type,
            fileSize: Math.round(file.size / 1024) + ' KB',
            bpm: 128,
            key: 'C Major',
            genre: 'Electronic'
        };

        document.querySelector('.upload-content p').textContent = `✅ ${file.name}`;
        document.getElementById('image-upload-section').style.display = 'block';
        this.showSection('licensing-section');
    }

    generateLicense() {
        const textarea = document.getElementById('license-terms');
        this.licenseTerms = `MUSIC LICENSE\nTrack: ${this.beatMetadata.title}\nBPM: ${this.beatMetadata.bpm}\nKey: ${this.beatMetadata.key}\n\nCommercial use permitted with attribution.`;
        textarea.value = this.licenseTerms;
        document.getElementById('approve-license').disabled = false;
    }

    approveLicense() {
        document.getElementById('nft-title').textContent = this.beatMetadata.title;
        document.getElementById('mint-nft').disabled = false;
        this.showSection('minting-section');
    }

    async mintNFT() {
        const statusDiv = document.getElementById('mint-status');
        statusDiv.className = 'mint-status pending';
        statusDiv.textContent = 'Minting...';
        
        await new Promise(r => setTimeout(r, 2000));
        
        const hash = '0x' + Math.random().toString(16).substr(2, 64);
        document.getElementById('tx-hash').textContent = hash;
        this.showSection('success-section');
    }

    showSection(id) {
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        document.getElementById(id).classList.add('active');
    }

    reset() {
        this.showSection('upload-section');
        document.getElementById('image-upload-section').style.display = 'none';
        document.querySelector('.upload-content p').textContent = 'Drop your beat here or click to browse';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new BeatsChainApp();
    app.init();
    window.beatsChainApp = app;
});