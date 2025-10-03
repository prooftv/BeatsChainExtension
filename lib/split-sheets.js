// Split Sheets Manager - South African Music Context
class SplitSheetsManager {
    constructor() {
        this.contributors = [];
    }
    
    addContributor(name, role, percentage, samroNumber = '') {
        this.contributors.push({
            name: name.trim(),
            role,
            percentage: parseFloat(percentage) || 0,
            samroNumber: samroNumber.trim()
        });
    }
    
    removeContributor(index) {
        this.contributors.splice(index, 1);
    }
    
    getTotalPercentage() {
        return this.contributors.reduce((sum, c) => sum + c.percentage, 0);
    }
    
    isValid() {
        const total = this.getTotalPercentage();
        return total === 100 && this.contributors.length > 0;
    }
    
    generateSplitSheet(trackData) {
        return {
            trackInfo: {
                title: trackData.title,
                artist: trackData.artist,
                stageName: trackData.stageName,
                duration: trackData.duration,
                genre: trackData.genre,
                isrc: trackData.isrc || 'TBD',
                createdDate: new Date().toISOString()
            },
            contributors: this.contributors.map(c => ({
                name: c.name,
                role: c.role,
                percentage: c.percentage,
                samroNumber: c.samroNumber || 'Not provided',
                royaltyShare: (c.percentage / 100).toFixed(4)
            })),
            validation: {
                totalPercentage: this.getTotalPercentage(),
                isValid: this.isValid(),
                samroCompliant: this.isSamroCompliant()
            },
            metadata: {
                generatedBy: 'BeatsChain Extension',
                generatedDate: new Date().toISOString(),
                version: '1.0'
            }
        };
    }
    
    isSamroCompliant() {
        // Basic SAMRO compliance checks
        const hasArtist = this.contributors.some(c => c.role === 'artist');
        const totalIs100 = this.getTotalPercentage() === 100;
        const allNamesProvided = this.contributors.every(c => c.name.length > 0);
        
        return hasArtist && totalIs100 && allNamesProvided;
    }
    
    generateSamroReport() {
        const splitSheet = this.generateSplitSheet();
        
        return `SAMRO SPLIT SHEET REPORT
========================

TRACK INFORMATION:
- Title: ${splitSheet.trackInfo.title}
- Artist: ${splitSheet.trackInfo.artist}
- Stage Name: ${splitSheet.trackInfo.stageName || 'N/A'}
- Genre: ${splitSheet.trackInfo.genre}
- Duration: ${splitSheet.trackInfo.duration}
- ISRC: ${splitSheet.trackInfo.isrc}

CONTRIBUTORS & ROYALTY SPLITS:
${splitSheet.contributors.map(c => 
    `- ${c.name} (${c.role}): ${c.percentage}% | SAMRO: ${c.samroNumber}`
).join('\n')}

VALIDATION:
- Total Percentage: ${splitSheet.validation.totalPercentage}%
- Valid Split: ${splitSheet.validation.isValid ? 'YES' : 'NO'}
- SAMRO Compliant: ${splitSheet.validation.samroCompliant ? 'YES' : 'NO'}

Generated: ${new Date().toLocaleString()}
Platform: BeatsChain Extension`;
    }
    
    clear() {
        this.contributors = [];
    }
}

window.SplitSheetsManager = SplitSheetsManager;