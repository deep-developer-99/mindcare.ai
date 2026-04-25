---
name: Localhost hardcoded references blocking production deployment
description: 12 frontend files have hardcoded localhost:5002 API calls that will fail in production
type: project
---

**Issue**: Hardcoded `localhost:5002` references in:
- Him2.html (lines 1113, 1223)
- jarvis-mate.html (line 351)
- nutrimate-ai.html (line 15)
- user-dashboard.html (lines 10, 526)
- yoga.html (line 11)
- auth/script.js (line 6)
- auth/login-page/script.js (line 30)
- blog/Blog2.html (line 538)
- assets/js/shared-profile.js (line 9)
- assets/js/shared-ai-launcher.js (line 3)
- assets/js/shared-footer.js (line 78)

**Why**: Production deployment expects API at different domain. Current code uses empty string `''` for prod which breaks API calls.

**Impact**: Newsletter subscription, auth verification, and all API calls fail on Netlify.

**Solution**: Create config file with environment-based API endpoints and update all 12 files to use it.
