(function () {
  const IS_BLOG_PAGE = window.location.pathname.includes('/blog/');
  const HOME_PAGE_URL = window.location.protocol === 'file:'
    ? (IS_BLOG_PAGE ? '../Him2.html' : 'Him2.html')
    : '/Him2.html';
  const SETTINGS_PAGE_URL = window.location.protocol === 'file:'
    ? (IS_BLOG_PAGE ? '../user-dashboard.html' : 'user-dashboard.html')
    : '/user-dashboard.html';
  const API_BASE = window.location.protocol === 'file:' ? 'http://localhost:5002' : '';
  const LOGOUT_ENDPOINT = `${API_BASE}/api/auth/logout`;

  function closeProfileMenus(exceptRoot) {
    document.querySelectorAll('[data-profile-root].open').forEach((root) => {
      if (root !== exceptRoot) {
        root.classList.remove('open');
        const toggle = root.querySelector('[data-profile-toggle]');
        if (toggle) toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    const profileRoots = document.querySelectorAll('[data-profile-root]');
    if (!profileRoots.length) return;

    profileRoots.forEach((root) => {
      const toggle = root.querySelector('[data-profile-toggle]');
      if (!toggle) return;

      toggle.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();

        const willOpen = !root.classList.contains('open');
        closeProfileMenus(root);
        root.classList.toggle('open', willOpen);
        toggle.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      });
    });

    document.addEventListener('click', (event) => {
      if (!event.target.closest('[data-profile-root]')) {
        closeProfileMenus();
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeProfileMenus();
    });

    document.querySelectorAll('[data-profile-settings]').forEach((settingsLink) => {
      settingsLink.addEventListener('click', (event) => {
        event.preventDefault();
        closeProfileMenus();
        window.location.href = SETTINGS_PAGE_URL;
      });
    });

    document.querySelectorAll('[data-profile-logout]').forEach((logoutButton) => {
      logoutButton.addEventListener('click', async (event) => {
        event.preventDefault();

        const originalLabel = logoutButton.textContent;
        logoutButton.disabled = true;
        logoutButton.textContent = 'Logging out...';

        try {
          const response = await fetch(LOGOUT_ENDPOINT, {
            method: 'POST',
            credentials: 'include'
          });

          if (!response.ok) {
            throw new Error(`Logout failed with status ${response.status}`);
          }

          profileRoots.forEach((root) => {
            root.classList.remove('open');
            root.style.display = 'none';
          });

          window.location.href = HOME_PAGE_URL;
        } catch (error) {
          console.error(error);
          alert('Logout failed. Please try again.');
          logoutButton.disabled = false;
          logoutButton.textContent = originalLabel;
        }
      });
    });
  });
})();
