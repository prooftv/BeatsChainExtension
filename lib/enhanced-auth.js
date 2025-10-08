// Enhanced Authentication Manager - Multi-Factor, Role-Based, Security Levels
class EnhancedAuthenticationManager {
    constructor() {
        this.basicAuth = null;
        this.isEnhanced = false;
        this.userRole = 'user'; // Default role
        this.securityLevel = 'basic'; // basic, enhanced, premium
        this.mfaEnabled = false;
        this.sessionManager = null;
    }

    async initialize() {
        try {
            // Initialize basic authentication first
            if (window.AuthenticationManager) {
                this.basicAuth = new AuthenticationManager();
                const isAuthenticated = await this.basicAuth.initialize();
                
                if (isAuthenticated) {
                    // Enhance with additional security features
                    await this.enhanceAuthentication();
                    return true;
                }
            }
            return false;
        } catch (error) {
            console.error('Enhanced authentication initialization failed:', error);
            return false;
        }
    }

    async enhanceAuthentication() {
        try {
            const userProfile = this.basicAuth.getUserProfile();
            if (!userProfile) return false;

            // Determine user role based on email or manual assignment
            this.userRole = this.determineUserRole(userProfile.email);
            
            // Set security level based on role and verification status
            this.securityLevel = this.determineSecurityLevel(userProfile);
            
            // Enable MFA for admin users and premium accounts
            this.mfaEnabled = this.shouldEnableMFA();
            
            // Initialize session management
            if (window.SessionManager) {
                this.sessionManager = new SessionManager();
                await this.sessionManager.initialize(userProfile, this.userRole);
            }
            
            // Generate enhanced wallet with role-based security
            await this.generateEnhancedWallet();
            
            this.isEnhanced = true;
            console.log('✅ Enhanced authentication active:', {
                role: this.userRole,
                securityLevel: this.securityLevel,
                mfaEnabled: this.mfaEnabled
            });
            
            return true;
        } catch (error) {
            console.error('Authentication enhancement failed:', error);
            return false;
        }
    }

    determineUserRole(email) {
        // Admin users - Add your email here
        const adminEmails = [
            'admin@beatschain.com',
            'developer@beatschain.com',
            'info@unamifoundation.org' // Primary admin
        ];
        
        if (adminEmails.includes(email)) {
            return 'admin';
        }
        
        return 'user'; // All other users are general users
    }

    determineSecurityLevel(userProfile) {
        if (this.userRole === 'admin') {
            return 'premium';
        }
        
        if (userProfile.verified_email) {
            return 'enhanced';
        }
        
        return 'basic';
    }

    shouldEnableMFA() {
        return this.userRole === 'admin' || this.securityLevel === 'premium';
    }

    async generateEnhancedWallet() {
        try {
            const userProfile = this.basicAuth.getUserProfile();
            if (!userProfile) throw new Error('No user profile available');

            // Enhanced security iterations based on role
            const iterations = {
                'basic': 100000,
                'enhanced': 200000,
                'premium': 500000
            };

            const iterationCount = iterations[this.securityLevel];
            
            // Generate enhanced entropy
            const entropy = new Uint8Array(32);
            crypto.getRandomValues(entropy);
            
            // Add session ID for additional security
            const sessionId = this.sessionManager ? this.sessionManager.getSessionId() : Date.now().toString();
            const userSeed = userProfile.id + sessionId + Array.from(entropy).join('');
            
            const encoder = new TextEncoder();
            const data = encoder.encode(userSeed);
            
            // Enhanced key derivation with role-based iterations
            const keyMaterial = await crypto.subtle.importKey(
                'raw',
                data,
                { name: 'PBKDF2' },
                false,
                ['deriveBits']
            );
            
            // Enhanced salt generation
            const saltData = `BeatsChain-Enhanced-${this.userRole}-${this.securityLevel}-2024`;
            const salt = encoder.encode(saltData);
            
            const derivedBits = await crypto.subtle.deriveBits(
                {
                    name: 'PBKDF2',
                    salt: salt,
                    iterations: iterationCount,
                    hash: 'SHA-256'
                },
                keyMaterial,
                256
            );
            
            const privateKeyArray = new Uint8Array(derivedBits);
            const privateKey = '0x' + Array.from(privateKeyArray, byte => 
                byte.toString(16).padStart(2, '0')
            ).join('');
            
            // Generate enhanced public address
            const addressBytes = new Uint8Array(20);
            crypto.getRandomValues(addressBytes);
            const walletAddress = '0x' + Array.from(addressBytes, byte => 
                byte.toString(16).padStart(2, '0')
            ).join('');
            
            // Store enhanced wallet data with security metadata
            const enhancedWalletData = {
                address: walletAddress,
                privateKey: privateKey, // In production, encrypt this
                created: Date.now(),
                userId: userProfile.id,
                role: this.userRole,
                securityLevel: this.securityLevel,
                iterations: iterationCount,
                enhanced: true
            };
            
            await chrome.storage.local.set({
                'enhanced_wallet_address': walletAddress,
                'enhanced_wallet_private_key': privateKey, // Encrypt in production
                'enhanced_wallet_metadata': enhancedWalletData,
                'wallet_security_level': this.securityLevel
            });
            
            console.log('🛡️ Enhanced wallet generated:', {
                address: walletAddress.substring(0, 6) + '...' + walletAddress.substring(-4),
                securityLevel: this.securityLevel,
                iterations: iterationCount
            });
            
            return enhancedWalletData;
            
        } catch (error) {
            console.error('Enhanced wallet generation failed:', error);
            throw error;
        }
    }

    // Permission system
    hasPermission(action) {
        const permissions = {
            'user': ['mint_nft', 'upload_audio', 'radio_submit', 'view_profile', 'collaborate', 'manage_splits'],
            'admin': ['*'] // All permissions
        };

        const userPermissions = permissions[this.userRole] || permissions['user'];
        return userPermissions.includes('*') || userPermissions.includes(action);
    }

    // Admin invitation system
    async inviteAdmin(email) {
        if (!this.hasPermission('admin_invite')) {
            throw new Error('Permission denied: Only admins can invite other admins');
        }

        if (!email || !this.isValidEmail(email)) {
            throw new Error('Valid email address required');
        }

        try {
            // Get existing admin invitations
            const stored = await chrome.storage.local.get(['admin_invitations']);
            const invitations = stored.admin_invitations || [];

            // Check if already invited or already admin
            const existingInvite = invitations.find(inv => inv.email === email);
            if (existingInvite && existingInvite.status === 'pending') {
                throw new Error('Admin invitation already sent to this email');
            }

            // Create invitation
            const invitation = {
                id: Date.now().toString(),
                email: email,
                invitedBy: this.getUserProfile()?.email,
                invitedAt: Date.now(),
                status: 'pending',
                expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
            };

            invitations.push(invitation);
            await chrome.storage.local.set({ 'admin_invitations': invitations });

            // Log security event
            await this.logSecurityEvent('admin_invitation_sent', {
                invitedEmail: email,
                invitationId: invitation.id
            });

            return {
                success: true,
                invitationId: invitation.id,
                message: `Admin invitation sent to ${email}`
            };

        } catch (error) {
            console.error('Admin invitation failed:', error);
            throw error;
        }
    }

    async getPendingInvitations() {
        if (!this.hasPermission('admin_invite')) {
            return [];
        }

        try {
            const stored = await chrome.storage.local.get(['admin_invitations']);
            const invitations = stored.admin_invitations || [];
            
            // Filter pending and non-expired invitations
            const now = Date.now();
            return invitations.filter(inv => 
                inv.status === 'pending' && inv.expiresAt > now
            );
        } catch (error) {
            console.error('Failed to get pending invitations:', error);
            return [];
        }
    }

    async revokeInvitation(invitationId) {
        if (!this.hasPermission('admin_invite')) {
            throw new Error('Permission denied: Only admins can revoke invitations');
        }

        try {
            const stored = await chrome.storage.local.get(['admin_invitations']);
            const invitations = stored.admin_invitations || [];
            
            const invitation = invitations.find(inv => inv.id === invitationId);
            if (!invitation) {
                throw new Error('Invitation not found');
            }

            invitation.status = 'revoked';
            invitation.revokedAt = Date.now();
            invitation.revokedBy = this.getUserProfile()?.email;

            await chrome.storage.local.set({ 'admin_invitations': invitations });

            await this.logSecurityEvent('admin_invitation_revoked', {
                invitationId: invitationId,
                invitedEmail: invitation.email
            });

            return { success: true, message: 'Invitation revoked' };

        } catch (error) {
            console.error('Failed to revoke invitation:', error);
            throw error;
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    requirePermission(action) {
        if (!this.hasPermission(action)) {
            throw new Error(`Permission denied: ${action} requires ${this.getRequiredRole(action)} role`);
        }
    }

    getRequiredRole(action) {
        const roleRequirements = {
            'admin_panel': 'admin',
            'user_management': 'admin',
            'admin_invite': 'admin'
        };
        
        return roleRequirements[action] || 'user';
    }

    // Enhanced security methods
    async validateSecurityLevel(requiredLevel) {
        const levels = { 'basic': 1, 'enhanced': 2, 'premium': 3 };
        const currentLevel = levels[this.securityLevel] || 1;
        const required = levels[requiredLevel] || 1;
        
        return currentLevel >= required;
    }

    async enableMFA() {
        if (this.userRole !== 'admin' && this.securityLevel !== 'premium') {
            throw new Error('MFA requires admin role or premium security level');
        }
        
        // In production, implement actual MFA (TOTP, SMS, etc.)
        this.mfaEnabled = true;
        
        await chrome.storage.local.set({
            'mfa_enabled': true,
            'mfa_setup_date': Date.now()
        });
        
        console.log('🔐 MFA enabled for user');
        return true;
    }

    // Security event logging
    async logSecurityEvent(event, details = {}) {
        const securityEvent = {
            timestamp: Date.now(),
            event: event,
            userId: this.basicAuth?.getUserProfile()?.id,
            role: this.userRole,
            securityLevel: this.securityLevel,
            details: details,
            sessionId: this.sessionManager?.getSessionId()
        };
        
        try {
            // Get existing events
            const stored = await chrome.storage.local.get(['security_events']);
            const events = stored.security_events || [];
            
            // Add new event
            events.push(securityEvent);
            
            // Keep only last 100 events
            if (events.length > 100) {
                events.splice(0, events.length - 100);
            }
            
            await chrome.storage.local.set({ 'security_events': events });
            
        } catch (error) {
            console.error('Failed to log security event:', error);
        }
    }

    // Delegate basic auth methods
    async signInWithGoogle() {
        if (!this.basicAuth) {
            this.basicAuth = new AuthenticationManager();
        }
        
        const result = await this.basicAuth.signInWithGoogle();
        
        if (result.success) {
            await this.enhanceAuthentication();
            await this.logSecurityEvent('login', { method: 'google_oauth' });
            
            // Add enhanced security info to result
            result.role = this.userRole;
            result.securityLevel = this.securityLevel;
            result.mfaRequired = this.mfaEnabled;
            result.enhanced = this.isEnhanced;
        }
        
        return result;
    }

    async signOut() {
        await this.logSecurityEvent('logout');
        
        if (this.sessionManager) {
            await this.sessionManager.endSession();
        }
        
        // Clear enhanced data
        await chrome.storage.local.remove([
            'enhanced_wallet_address',
            'enhanced_wallet_private_key',
            'enhanced_wallet_metadata',
            'wallet_security_level',
            'mfa_enabled'
        ]);
        
        if (this.basicAuth) {
            return await this.basicAuth.signOut();
        }
        
        return { success: true };
    }

    async getWalletAddress() {
        if (this.isEnhanced) {
            const result = await chrome.storage.local.get(['enhanced_wallet_address']);
            return result.enhanced_wallet_address;
        }
        
        if (this.basicAuth) {
            return await this.basicAuth.getWalletAddress();
        }
        
        return null;
    }

    async getWalletBalance() {
        if (this.basicAuth) {
            return await this.basicAuth.getWalletBalance();
        }
        return '0.0000';
    }

    getUserProfile() {
        if (this.basicAuth) {
            const profile = this.basicAuth.getUserProfile();
            if (profile && this.isEnhanced) {
                return {
                    ...profile,
                    role: this.userRole,
                    securityLevel: this.securityLevel,
                    mfaEnabled: this.mfaEnabled,
                    enhanced: true
                };
            }
            return profile;
        }
        return null;
    }

    getAccessToken() {
        if (this.basicAuth) {
            return this.basicAuth.getAccessToken();
        }
        return null;
    }

    // Security score calculation
    calculateSecurityScore() {
        let score = 0;
        
        // Base authentication
        if (this.basicAuth && this.basicAuth.isAuthenticated) score += 20;
        
        // Email verification
        const profile = this.getUserProfile();
        if (profile && profile.verified_email) score += 15;
        
        // Role-based scoring
        const roleScores = { 'artist': 10, 'producer': 15, 'admin': 20 };
        score += roleScores[this.userRole] || 0;
        
        // Security level
        const levelScores = { 'basic': 10, 'enhanced': 20, 'premium': 30 };
        score += levelScores[this.securityLevel] || 0;
        
        // MFA enabled
        if (this.mfaEnabled) score += 25;
        
        return Math.min(score, 100);
    }

    // Security recommendations
    getSecurityRecommendations() {
        const recommendations = [];
        
        if (!this.mfaEnabled && this.userRole === 'admin') {
            recommendations.push('Enable multi-factor authentication for admin account');
        }
        
        if (this.securityLevel === 'basic') {
            recommendations.push('Verify your email to upgrade to enhanced security');
        }
        
        const profile = this.getUserProfile();
        if (profile && !profile.verified_email) {
            recommendations.push('Verify your email address for better security');
        }
        
        return recommendations;
    }
}

// Export for Chrome extension compatibility
window.EnhancedAuthenticationManager = EnhancedAuthenticationManager;