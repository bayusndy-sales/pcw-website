# PCW Freight website

Static site for PCW Freight (PT Prabaswara Catur Widantara), English at `/` and Bahasa Indonesia at `/id/`.

- `src/` source: `build.py` builds all pages into `dist/` (`python3 src/build.py <path-to-terms-md>`), `src/assets/` CSS and JS.
- `dist/` built site, deployed by cPanel (`.cpanel.yml`) to the web root.
- `apps_script/Code.gs` back end (Google Apps Script web app bound to the operations Sheet): published-rate quotes, booking requests, tracking.

Published rates only. No costs, vendor names or customer data are stored in this repository.
