/**
 * MindCare AI - Environment Configuration
 *
 * Update API_ENDPOINT based on your deployment environment:
 * - Local: http://localhost:5002
 * - Production: your-api-domain.com (e.g., https://api.mindcare.com)
 */

const CONFIG = {
  // Development
  DEVELOPMENT: {
    API_BASE: 'http://localhost:5002'
  },

  // Production (update with your actual API endpoint)
  PRODUCTION: {
    API_BASE: 'https://your-api-domain.com' // CHANGE THIS TO YOUR PRODUCTION API
  },

  // Get appropriate config based on environment
  getApiBase: function() {
    // If running locally (file:// protocol or localhost)
    if (window.location.protocol === 'file:' || window.location.hostname === 'localhost') {
      return this.DEVELOPMENT.API_BASE;
    }
    // Production environment
    return this.PRODUCTION.API_BASE;
  }
};

// Make CONFIG globally accessible
window.CONFIG = CONFIG;
