# Portfolio reports — implementation and evidence

## Scope and current status

The active request is to separate the personal profile, skills and projects; retain the CV projects as the main collection; add YouTube Video Downloader and LearnXcompile; move the remaining projects into an Other projects collection; remove ParcVision Mobile; provide detailed animated project pages.

Implemented:

- Profile has personal introduction, interests and navigation, without embedded project cards.
- Skills are a separate section with CV-backed technology groups and languages.
- Main collection: ParcVision, PFE-ESTO, Gestion des stagiaires, YouTube Video Downloader, LearnXcompile.
- Other collection: MiniChat, Exercise Tracker, URL Shortener.
- Seven sourced reports each contain context/solution, an interactive three-step tour, architecture, design decisions, outcome and source links.
- Each project has a dedicated illustration. Tours support manual stepping, opt-in playback, pause, replay, and stop when the page is hidden. Motion reduction is respected in CSS and the playback controls.
- Report chapter navigation, keyboard focus, scroll entrance effects and narrow-window layouts are implemented.
- Project search ignores accents; collection/search/category state survives returning from a report.
- The terminal project command uses the same collections and handles projects without repositories.
- Generated project README files contain the reports. Exact older generated documents are migrated; visitor copies and changed documents are preserved.
- ParcVision Mobile is absent from the catalog, terminal output and fresh/updated project folders. Its known generated README and empty folder are removed without deleting visitor content.

**Content limitation: LearnXcompile.** The current brief explicitly permits a “Documentation en cours” page. No functionality, technology or result is inferred from its name; a source is still needed to write a detailed report.

## Sources

- Supplied CV: `C:/Users/ibrahim/Documents/cv_pro.pdf`; portfolio copy `public/cv.pdf`.
- ParcVision: https://github.com/ibrahim11-dv/ParcVision-StageTech/blob/main/README.md
- PFE-ESTO: https://github.com/Movved/PFE-ESTO/blob/main/pfe-app/routes/web.php and README. The CV links this collaborative repository.
- Gestion des stagiaires: CV only; no public repository was supplied.
- YouTube downloader: https://github.com/ibrahim11-dv/YoutubeVideosDownloader/blob/master/server.js and `public/index.html`.
- MiniChat: https://github.com/ibrahim11-dv/MiniChatApp-using-socket.io/blob/master/server/index.js and `client/src/App.jsx`.
- Exercise Tracker: https://github.com/ibrahim11-dv/exerciceTracker-freeCodeCamp_/blob/main/index.js
- URL Shortener: https://github.com/ibrahim11-dv/url-shortening/blob/main/index.js

Interactive diagrams are explanatory, not live connections to these services. The separate screenshot galleries contain original images supplied by Ibrahim. No usage or performance metrics have been invented. The YouTube report distinguishes audio streaming from MP3 transcoding and notes the absence of audio/video merging in the inspected server.

## Screenshot integration, 8 October 2026

- `projectMedia.js` maps five supplied ParcVision screenshots and four PFE-ESTO screenshots to factual captions.
- Preview cards and report headers use the real cover image. Screenshots retain their original colors; the surrounding interface and diagrams use the restrained monochrome/teal palette.
- `ProjectGallery.jsx` provides thumbnails, a native modal dialog, original-size viewing, previous/next controls, arrow/Home/End navigation, Escape dismissal and focus restoration. There is no automatic slideshow.
- Reports have a direct Captures chapter shortcut and clearly distinguish original captures from illustrative tours.
- Returning from a report restores the project list position, selected card focus and existing search/filter state.
- Removed negative report margins that caused internal horizontal scrolling on narrow screens; simplified the profile layout below 480px.
- No filesystem, window manager, terminal, editor or viewer implementation was changed in this integration.

Verification for this integration:

- Lint and production build pass; all 65 existing tests pass (filesystem protection, transfers, terminal, editor, catalog migration, metadata, completion and battery).
- Browser: opened all eight reports; five ParcVision and four PFE screenshots loaded with nonzero natural dimensions.
- Checked the gallery at 1280px, 390px and 319px. At 319px the report content and scroll widths both measure 307px; at 390px the modal has no horizontal overflow.
- Checked thumbnail selection, previous/next, original-size mode, keyboard arrows, Escape and focus return. Search for PFE survives report/back and restores focus to its card. Category filtering and accent-insensitive search (`réact`) work.
- Inspected CV/GitHub/email destinations and ran `projects` in the visible terminal. Maximizing the portfolio works. Browser console has no errors.
- Reduced-motion behavior audited in the CSS media queries and the tour's media-query subscription: transitions and entrance animations are disabled; playback is disabled. No new automatic motion was added to the gallery.
- Final screenshot: `.artifacts/ibrahimos-project-gallery.png`. Temporary viewport override was reset.

## Verification, 6 October 2026

- `npm run lint`: passed.
- `npm run build`: passed, 1955 transformed modules.
- `node --test src/desktop/portfolioCatalogMigration.test.js src/desktop/virtualFs.test.js src/desktop/terminalShell.test.js`: 26 passed.
- Migration tests cover exact legacy replacement, retired empty folders, visitor children/copies, modified text, persisted old protection, idempotence, and later generated-report editions.
- Browser inspection at 319px and 1280px widths: no report/content horizontal overflow. The chapter navigation itself intentionally scrolls on narrow screens.
- All eight project pages were opened. Seven had five chapters and a functioning second tour step; LearnXcompile correctly displayed the pending page.
- Main/Other membership inspected. Searching Other projects for `réact` returned MiniChat; returning from its report retained both the query and collection.
- YouTube guided playback reached step 3, stopped, and replay returned to step 1.
- Skills and general profile were inspected as distinct views.
- Fichiers showed eight project folders, including all new main projects and no ParcVision Mobile folder.
- The terminal's `projects` output was inspected for grouping, links, and absence of Mobile/undefined values.
- Temporary viewport override reset after responsive checks.

Preview recovery: the browser reported a Vite websocket failure and a later asset request returned `ERR_CONNECTION_REFUSED`. A listener check confirmed port 5173 was no longer listening. The dev server was then relaunched (exec session 14807), and the page reloaded. The portfolio icon loaded at its expected natural width of 96px, and the updated report's scroll observer was present.

Screenshot: `.artifacts/portfolio-project-report.png`.
