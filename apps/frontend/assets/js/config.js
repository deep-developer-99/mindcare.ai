/**
 * MindCare AI - Environment Configuration
 *
 * Handles 3 microservices:
 * 1. BACKEND - Authentication, Newsletter, User Management
 * 2. JARVIS_MATE - AI Chat Assistant (/api/chat)
 * 3. NUTRIMATE - Nutrition AI (/api/diet)
 *
 * Development: All services run locally on different ports
 * Production: Each service has its own domain/URL
 */

const CONFIG = {
  // ===== DEVELOPMENT (Local Ports) =====
  DEVELOPMENT: {
    BACKEND: 'http://localhost:5002',        // Auth, Newsletter endpoints
    JARVIS_MATE: 'http://localhost:5003',    // Chat AI service
    NUTRIMATE: 'http://localhost:5004'       // Nutrition AI service
  },

  // ===== PRODUCTION (Update with your deployment URLs) =====
  PRODUCTION: {
    BACKEND: 'https://mindcare-backend-gvhh.onrender.com',      // ← Update this
    JARVIS_MATE: 'https://mindcare-mate-ai.onrender.com',   // ← Update this
    NUTRIMATE: 'https://mindcare-nutrimate-ai.onrender.com'   // ← Update this
  },

  // Detect environment and return appropriate config
  getEnvironment: function() {
    const host = window.location.hostname;
    // Development: localhost, 127.0.0.1, or ::1 (IPv6 loopback)
    const isDev = host === 'localhost' || host === '127.0.0.1' || host === '::1';
    return isDev ? 'DEVELOPMENT' : 'PRODUCTION';
  },

  // Get appropriate base URL for a service
  getApiBase: function(service = 'BACKEND') {
    const env = this.getEnvironment();
    const serviceConfig = this[env][service];

    if (!serviceConfig) {
      console.warn(`Service '${service}' not found in config. Using BACKEND fallback.`);
      return this[env].BACKEND;
    }

    return serviceConfig;
  },

  // Helper methods for each service
  getBackendUrl: function() {
    return this.getApiBase('BACKEND');
  },

  getJarvisUrl: function() {
    return this.getApiBase('JARVIS_MATE');
  },

  getNutrimateUrl: function() {
    return this.getApiBase('NUTRIMATE');
  }
};

// Make CONFIG globally accessible
window.CONFIG = CONFIG;
