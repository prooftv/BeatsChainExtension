// Chrome Built-in AI APIs Manager - All 5 APIs Integration
class ChromeAIManager {
    constructor() {
        this.isAvailable = false;
        this.apis = {
            prompt: null,
            writer: null,
            rewriter: null,
            summarizer: null,
            translator: null
        };
    }

    async initialize() {
        try {
            // Check AI availability
            if (!window.ai) {
                throw new Error('Chrome AI not available');
            }

            // Initialize Prompt API
            if (window.ai.languageModel) {
                this.apis.prompt = await window.ai.languageModel.create();
            }

            // Initialize Writer API
            if (window.ai.writer) {
                this.apis.writer = await window.ai.writer.create();
            }

            // Initialize Rewriter API
            if (window.ai.rewriter) {
                this.apis.rewriter = await window.ai.rewriter.create();
            }

            // Initialize Summarizer API
            if (window.ai.summarizer) {
                this.apis.summarizer = await window.ai.summarizer.create();
            }

            // Initialize Translator API
            if (window.ai.translator) {
                this.apis.translator = await window.ai.translator.create();
            }

            this.isAvailable = true;
            return true;
        } catch (error) {
            console.error('Chrome AI initialization failed:', error);
            return false;
        }
    }

    async generateLicense(beatMetadata) {
        try {
            const prompt = `Generate professional music licensing terms for:
Title: ${beatMetadata.title}
Genre: ${beatMetadata.genre || 'Electronic'}
Duration: ${beatMetadata.duration}
Artist: ${beatMetadata.artist}

Create clear, enforceable licensing terms including usage rights, attribution requirements, and commercial permissions.`;

            let licenseText = '';

            // Use Prompt API for initial generation
            if (this.apis.prompt) {
                licenseText = await this.apis.prompt.prompt(prompt);
            }

            // Enhance with Writer API for professional polish
            if (this.apis.writer && licenseText) {
                licenseText = await this.apis.writer.write(licenseText, {
                    tone: 'professional',
                    format: 'legal-document'
                });
            }

            return licenseText || this.getFallbackLicense(beatMetadata);
        } catch (error) {
            console.error('License generation failed:', error);
            return this.getFallbackLicense(beatMetadata);
        }
    }

    async optimizeLicense(licenseText) {
        try {
            if (!this.apis.rewriter) return licenseText;

            return await this.apis.rewriter.rewrite(licenseText, {
                tone: 'professional',
                length: 'shorter'
            });
        } catch (error) {
            console.error('License optimization failed:', error);
            return licenseText;
        }
    }

    async summarizeTerms(longText) {
        try {
            if (!this.apis.summarizer) return longText;

            return await this.apis.summarizer.summarize(longText, {
                type: 'key-points',
                length: 'short'
            });
        } catch (error) {
            console.error('Summarization failed:', error);
            return longText;
        }
    }

    async translateContent(text, targetLanguage = 'es') {
        try {
            if (!this.apis.translator) return text;

            return await this.apis.translator.translate(text, {
                sourceLanguage: 'en',
                targetLanguage: targetLanguage
            });
        } catch (error) {
            console.error('Translation failed:', error);
            return text;
        }
    }

    async generateNFTDescription(beatMetadata) {
        try {
            const prompt = `Create an engaging NFT marketplace description for:
Title: ${beatMetadata.title}
Genre: ${beatMetadata.genre}
Key features: AI-generated licensing, blockchain ownership
Make it compelling for collectors and music enthusiasts.`;

            if (this.apis.prompt) {
                return await this.apis.prompt.prompt(prompt);
            }

            return `${beatMetadata.title} - A unique music NFT with AI-generated licensing terms, ensuring clear ownership and usage rights on the blockchain.`;
        } catch (error) {
            console.error('NFT description generation failed:', error);
            return `${beatMetadata.title} - Music NFT with blockchain ownership`;
        }
    }

    getFallbackLicense(metadata) {
        return `MUSIC LICENSING AGREEMENT

Track: ${metadata.title}
Artist: ${metadata.artist}
Duration: ${metadata.duration}

USAGE RIGHTS:
- Non-exclusive license for personal and commercial use
- Attribution required: "${metadata.artist} - ${metadata.title}"
- No resale or redistribution of original audio file
- Derivative works permitted with attribution

TERMS:
- License valid indefinitely
- No warranty provided
- Governed by blockchain smart contract
- Generated by BeatsChain AI on ${new Date().toLocaleDateString()}`;
    }

    getAvailableAPIs() {
        return Object.entries(this.apis)
            .filter(([_, api]) => api !== null)
            .map(([name, _]) => name);
    }
}

export default ChromeAIManager;