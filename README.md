# PCW Freight website

Static site for PCW Freight (PT Prabaswara Catur Widantara), English at `/` and Bahasa Indonesia at `/id/`.

- `src/` source: `build.py` builds all pages into `dist/` (`python3 src/build.py <path-to-terms-md>`), `src/assets/` CSS and JS.
- `dist/` built site, deployed by cPanel (`.cpanel.yml`) to the web root.
- `apps_script/Code.gs` back end (Google Apps Script web app bound to the operations Sheet): published-rate quotes, booking requests, tracking.

Published rates only. No costs, vendor names or customer data are stored in this repository.

## Apps Script source of truth
- `apps_script/*.gs` mirrors the live Apps Script project. clasp is not usable from the build environment (Google API hosts blocked), so changes are pasted into the editor and then committed here.
- Drift check: run `python3 tools/fnhash.py` and compare with the per-function hashes computed in the editor (same normalisation: strip full-line `//` comments, collapse whitespace). Function names/hashes of the last function in each file can differ only because of file-boundary text.
