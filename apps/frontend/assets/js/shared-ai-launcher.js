(function () {
  const IS_BLOG_PAGE = window.location.pathname.includes('/blog/');
  const API_BASE = CONFIG ? CONFIG.getApiBase() : (window.location.protocol === 'file:' ? 'http://localhost:5002' : '');
  const OPEN_ASSISTANT_ENDPOINT = `${API_BASE}/api/assistant/open`;

  const ASSISTANT_LABEL = {
    jarvis: 'JARVIS(MATE)',
    nutrimate: 'NutriMate'
  };

  const ASSISTANT_PAGE = {
    jarvis: 'jarvis-mate.html',
    nutrimate: 'nutrimate-ai.html'
  };

  function getAssistantPageUrl(assistantKey) {
    const pageFile = ASSISTANT_PAGE[assistantKey];
    if (!pageFile) return null;

    if (window.location.protocol === 'file:') {
      return IS_BLOG_PAGE ? `../${pageFile}` : pageFile;
    }

    return `/${pageFile}`;
  }

  async function launchAssistant(assistantKey) {
    const response = await fetch(`${OPEN_ASSISTANT_ENDPOINT}/${encodeURIComponent(assistantKey)}`, {
      method: 'POST',
      credentials: 'include'
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.message || `Unable to launch ${ASSISTANT_LABEL[assistantKey] || 'assistant'}.`);
    }

    return payload;
  }

  window.launchDesktopAssistant = function launchDesktopAssistant(assistantKey) {
    const normalizedKey = String(assistantKey || '').trim().toLowerCase();
    if (!ASSISTANT_LABEL[normalizedKey]) {
      return Promise.reject(new Error('Selected assistant is not configured.'));
    }

    return launchAssistant(normalizedKey);
  }

  window.openAssistant = function openAssistant(event, assistantKey) {
    if (event) event.preventDefault();

    const normalizedKey = String(assistantKey || '').trim().toLowerCase();
    const pageUrl = getAssistantPageUrl(normalizedKey);

    if (!pageUrl) {
      console.error('Selected assistant is not configured.');
      return false;
    }

    window.location.href = `${pageUrl}?autostart=1`;
    return false;
  };
})();
