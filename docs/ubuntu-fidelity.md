# Ubuntu desktop fidelity audit

## Goal and reference

Reproduce Ubuntu 26's design, animations and desktop interactions throughout the portfolio. This remains an ongoing goal; passing the checks below does not establish full Ubuntu parity.

The current wallpaper and desktop target Ubuntu 26.04 LTS. Canonical confirms GNOME 50 and the default Ptyxis terminal, Papers document viewer and Loupe image viewer in [its release article](https://ubuntu.com/blog/upgrade-your-desktop-ubuntu-26-04-lts). Window actions and animation references are the GNOME 50 [window manager](https://raw.githubusercontent.com/GNOME/gnome-shell/gnome-50/js/ui/windowManager.js), [window menu](https://raw.githubusercontent.com/GNOME/gnome-shell/gnome-50/js/ui/windowMenu.js), and [keyboard guide](https://help.gnome.org/gnome-help/keyboard-nav.html).

Preserve Ibrahim's portfolio, CV and GitHub content. Original files and their ancestor folders must resist editing, renaming, moving and deletion. Visitor copies and creations remain editable and recoverable through Trash. Wi-Fi, Bluetooth, settings and sound-test functionality were excluded by the user earlier.

## Evidence from 4 October 2026

### General interactions update — 5 October 2026

- Desktop and Files now share a name dialog with unique accessibility IDs, initial name selection, duplicate and invalid-name feedback, and a 255-byte name limit. Folder names containing a dot are selected in full; file extensions remain outside the initial selection.
- Files commits creation only after confirming the dialog. Cancel and Escape discard the proposed name. Renaming no longer commits on input blur. Successful operations keep the new item selected, expose dot files, and remain part of Files' existing undo history.
- Original item protection is checked again on submission, including on the Desktop. A removed or moved source/destination reports an error rather than writing to an invalid directory.
- Window control clicks retain the application's existing input focus. A cancelled pointer gesture restores the window's original placement.
- Production compilation succeeded. The creation dialog was displayed and captured in `.artifacts/ubuntu-creation-dialog.png`; no additional behavioral tests were run for this update. Exact native dialog parity remains unverified.

### Files reference alignment and verification — 5 October 2026

The official [Nautilus 50.3.1 release archive](https://download.gnome.org/sources/nautilus/50/nautilus-50.3.1.tar.xz) was inspected for the new-folder dialog, rename popover, properties widget and location entry. These source references replace assumptions about the native dialog layout. The archive was read without installing or running Nautilus.

- Files creation now uses the native 450 px toolbar dialog structure, an initially empty entry row and a centered pill-shaped Create button. Desktop creation retains its separate visitor workflow. Duplicate and invalid names disable confirmation; Escape leaves the directory unchanged.
- F2 opens a rename popover anchored to the selected item. It supports extension-aware selection, collision feedback, Enter, Escape and dismissal by clicking outside. Strict Mode exposed a cleanup focus event that prematurely dismissed the popover; the lifecycle guard was added and browser verification repeated successfully.
- Properties now uses a grouped, 480 px layout with a large item icon, selectable identity and size information, parent-folder navigation and a permissions page. Alt+Enter handles one or multiple selected items. Counts and sizes come from the actual virtual file contents, including UTF-8, supplied PDF bytes and inferred nested folders. POSIX ownership, filesystem timestamps and permission editing remain unimplemented; the permissions page describes the portfolio's actual protection policy.
- Location completion supports absolute, relative and home paths; directories receive a trailing slash. The popup lists case-sensitive matches and handles Up/Down, Tab and Enter. Browser verification covered ambiguous `~/Do`, Up selecting Downloads, and `~/Doc` → Tab → Enter opening Documents.
- Small-window navigation now uses an overlay sidebar, retains its toggle control and exposes the view switch in the main menu. Verified at 390×760: opening the sidebar, changing directory, automatic dismissal and immediate Ctrl+L all worked. The temporary viewport override was reset afterwards.
- Renaming, creation undo, deletion and navigation return keyboard focus to an appropriate item or the Files surface. Verified: rename undo reselected `Essai contrôle`; creation undo removed that empty verification folder and focused Files; deleting the separate empty `Essai GNOME 50` selected the adjacent item. That latter folder remains recoverable in Trash. Existing portfolio documents were not modified.
- Browser properties evidence: CV reports 243,850 bytes and read-only protection; F2 refuses its rename; CV plus Compétences reports two files and 244.3 kB; Permissions → Alt+Left returns to the main properties page. Screenshots: `.artifacts/ubuntu-files-properties.png`, `.artifacts/ubuntu-files-rename.png`, `.artifacts/ubuntu-files-compact.png`.
- Lint and production compilation succeed. Twenty-five tests pass across virtual filesystem protection/transfers, location completion and file metadata. These checks do not prove exact native visual parity or completion of the overall Ubuntu goal.

| Area | Observed current behavior | Evidence |
| --- | --- | --- |
| Window size | Maximize fills the work area; restore returns to the previous rectangle; mouse corner resize works | Browser: Files max rectangle `(82, 32, 1198, 688)` at 1280×720; Terminal resized from 900×570 to 770×450 |
| Window menu | Right-click on title area opens window actions; keyboard move supports arrows and Enter/Escape; always-above and workspace actions are connected | Browser: right-click menu, maximize, Alt+F7 and two right arrows moved Files by 20 px |
| Desktop | Left selection and right-click actions are distinct; native icon movement persists | Browser: visitor folder moved from first column to column 4 and retained placement on reload |
| File transfers | Folder drops move visitor files; originals copy; new transfer targets accept fast drag entry | Browser: Note Ubuntu.txt moved into Essai Ubuntu; Bienvenue.txt copied while its original remained |
| Trash | Created document can be deleted and restored to its origin; original deletion is disabled | Browser: Note Ubuntu.txt deleted and restored; original Bienvenue.txt has rename, cut and trash disabled |
| Apps | Drag from grid creates a working desktop shortcut; dock supports new windows | Browser: Aide shortcut created and opened; two Terminal windows have distinct instance IDs |
| Workspaces | Window drag moves to another workspace; app drop opens a new instance; moved window keeps keyboard focus | Browser: Files moved to workspace 2; Terminal launched on workspace 3; Super+Shift+PageUp followed by Alt+F10 kept Terminal active |
| Show desktop | Hidden windows are tracked separately for each workspace | Browser: workspace 2 hidden, editor hidden on workspace 1, workspace 2 restored its own windows only |
| Editor | Dirty close and new document ask save/discard/cancel; saved contents reopen and are shared with Terminal | Browser: save-on-close then reopen; creating the next document selected Sans titre 2.txt without overwriting Sans titre.txt; Terminal cat showed both saved texts |
| Empty Trash | Confirmation opens with Cancel focused; cancellation preserves recoverable data | Browser: opened and cancelled; Sans titre.txt remained in Trash, was restored, and Terminal cat showed its original contents |
| Automated checks | Transfer constraints and original protection | 16 Node tests pass; ESLint and production build pass |
| Files navigation | Ctrl+L accepts absolute and home-relative paths; invalid locations stay editable; rename returns keyboard focus | Browser: `~/Desktop`, rename followed immediately by Ctrl+L, `/chemin-absent` preserved the directory and reported an error |
| Hidden entries | Ctrl+H reveals dot files in Files; desktop hides them by default | Browser: created `.dossier-verification`, revealed it, renamed to Dossier clavier and moved the visitor folder to recoverable Trash |
| File details and sorting | PDF size reflects the supplied asset; Markdown and application shortcuts have their own types; size sort reverses | Browser: CV.pdf is Document PDF, 243.9 kB; ascending sizes 18, 474, 498, 1068, 243850 bytes, then descending; supplied PDF on disk is 243850 bytes |
| Workspace slide | Outgoing and incoming workspace visuals slide with fixed dock and panel; applications stay mounted | Browser: while switching back, two animated panes and one visual window clone were present, with one original application window; transition cleaned up and Files recovered keyboard focus. Console has no errors |
| Desktop shortcuts | Super+A toggles apps; Super+L locks; Ctrl+Alt+Delete opens cancellable power dialog; Ctrl+Alt+Tab focuses panel; Super+Tab switches applications | Browser: apps opened and closed; lock and unlock screens; power Cancel; Activities received keyboard focus; Terminal to Files switch preserved `pwd` input after the Tab-completion conflict was corrected |
| Minimize shortcut | F9 sidebar toggle does not intercept Alt+F9 | Browser: Alt+F9 minimized Files, focus returned to Terminal, dock restored Files with its sidebar visible |
| Terminal tabs | Ptyxis-style centered title, searchable thumbnail overview, rename, pin, tab movement, detach and reopen | Browser: two previews, Portfolio title filter, pin hides the close control; detach kept `cat Compétences.md`, `/home/ibrahim/Documents` and prior output; Ctrl+Alt+Shift+T restored a closed tab with `pwd` still entered and its output intact |
| Terminal find and fullscreen | Bottom find bar navigates matches; application fullscreen is connected | Browser: `récupérée` matched two output lines and Next changed 1/2 to 2/2; F11 displayed only the Terminal and its exit control. The browser automation subsequently exited fullscreen before clicking that control |
| Integrated PDF | Real canvas pages, selectable text, thumbnails, search highlights, link overlays, rotation and metadata | Browser: supplied one-page CV renders without page errors; Spring gives 5 results and 5 highlights; 5 PDF links; 90° rotation produces 662×468 px landscape page; properties report PDF 1.5 and 210×297 mm |

### Terminal and document reference details

Terminal chrome and actions were inspected in the original [Ptyxis 50.1 release source](https://download.gnome.org/sources/ptyxis/50/): `src/ptyxis-window.ui` and `src/org.gnome.Ptyxis.gschema.xml.in`. The reference uses a centered title/subtitle, split new-terminal button, tab overview, a hidden default tab bar and a bottom find bar. Implemented shortcuts follow the source schema, including Ctrl+Maj+O, Ctrl+PageUp/Down, Ctrl+Maj+PageUp/Down, Alt+1…0 and Ctrl+Alt+Maj+T. Search counts individual occurrences and highlights their text. The terminal is still a virtual command interpreter; this does not establish full VTE or shell parity.

The CV reader now uses PDF.js 6.4.299 and the Papers-style layout already in the worktree. Runtime inspection exposed a removed PDF.js rectangle conversion method; link geometry now transforms both corners with the supported point conversion. The repaired reader was closed and reopened, then rendered and searched successfully. Source updates also clear stale page errors after successful rendering.

### Virtual shell and shared-file workflow — 5 October 2026

The parser was refined against the GNU Bash manual's [quoting](https://www.gnu.org/software/bash/manual/html_node/Quoting.html), [redirection](https://www.gnu.org/s/bash/manual/html_node/Redirections.html) and pipeline rules. This remains an explicitly virtual interpreter, not Bash or a host process terminal.

- Quoted and escaped names, adjacent quoted segments, empty arguments, comments, home paths and multiline command lists are supported. Syntax errors are detected before executing a list. Command names now respect Linux casing.
- Text input/output redirections (`<`, `>`, `>>`), pipelines, `;`, `&&` and `||` use current file state and exit status. Pipelines isolate `cd` and `exit` from the parent session. `grep`, `head`, `tail` and `wc` operate on visitor text and pipeline input.
- Creation checks existing parents; `mkdir -p` creates explicit nested folders without replacing files. Original documents and ancestors remain protected. Copying originals creates visitor content. Existing copy/move destinations are deliberately not overwritten.
- Tab completion handles commands, relative/home paths and escaped spaces; ambiguous results use their common prefix and another Tab lists choices. History preserves an unfinished draft. Long prompts remain usable in narrow windows.
- Browser evidence: Terminal created `Desktop/Atelier Ubuntu/Notes/note.txt`; a three-command pipeline reported one matching line; protected redirection was refused; Up/Down restored `mon brouillon`; Tab completed the folder with an escaped space. Files displayed the shared note, Delete moved it to Trash, and Ctrl+Z restored it with focus. Maximize/restore changed the Terminal rectangle from `(0,42,319,536)` to `(0,32,319,556)` and back while keeping input focus.
- Forty automated checks pass across filesystem, transfers, metadata, completion and shell behavior; lint and production compilation succeed. Variables, glob expansion, job control, command substitution, descriptor redirection, real processes and a VTE grid remain unimplemented. Screenshot: `.artifacts/ubuntu-terminal-shell.png`.

### Editor reference alignment — 5 October 2026

The official [GNOME Text Editor 50.1 source](https://download.gnome.org/sources/gnome-text-editor/50/gnome-text-editor-50.1.tar.xz) informed the toolbar, tabs, properties sidebar, search and save dialogs. The [search guide](https://help.gnome.org/gnome-text-editor/edit-search-and-replace.html) informed live results and keyboard navigation. GTK's documented default reveal duration is [250 ms](https://docs.gtk.org/gtk4/property.Revealer.transition-duration.html).

- Documents keep separate text, selections, scroll positions and undo histories. Tabs support switching, reordering, detaching and reopening. Consecutive file launches share an editor window without losing pending documents.
- Search supports live highlights, next/previous results, case sensitivity, whole words, regular expressions and replacement. Original portfolio text remains read-only. Replacement is one undo action; regex support uses JavaScript with basic capture replacement, not full GLib/PCRE parity.
- Drafts save through a file dialog. Closing dirty tabs or windows offers Cancel, Discard and Save; grouped saves advance through each draft. External changes prompt before replacement, with expected-content checks against races. Save As preserves a separate copy.
- Browser evidence from the preceding editor refinement: live replacement and undo, external Terminal edits and Save As, dirty tab detachment, grouped save of three documents, reopen closed tabs, simultaneous open requests and protected replacement controls. Fifteen editor model checks passed alongside the existing forty checks during that refinement.
- Current browser evidence: fullscreen entry and the exit button both work, returning to the same normal window with document focus. Native syntax rendering, per-document search state, draft session persistence, full PCRE syntax, printing and complete native preferences remain incomplete.

### Desktop recovery and window focus — 5 October 2026

- Desktop deletion now keeps up to twenty recoverable actions. Its notification offers Undo; Ctrl+Z and the creation menu also restore the latest deletion. Restoration uses current Trash records and unique destinations, preserving unrelated changes and existing names. Missing or changed records reject a stale undo action.
- Created and renamed icons receive focus. Delete returns focus to the desktop; undo selects and focuses restored icons. Escape/Tab dismiss context menus, and window menus, maximize/restore and keyboard move/resize completion return focus to the application.
- Current browser evidence: left click opened creation actions; `Espace personnel` was created and focused, deleted, then restored and focused with Ctrl+Z and separately with the notification button. The original `Bienvenue.txt` exposed disabled rename, cut and Trash actions. The created empty folder remains on the desktop.
- Files changed from `(92,76,860,610)` to `(82,32,1198,688)` when maximized and returned to its original rectangle. Escape from the window menu returned focus to Files. Editor minimize transferred focus to Files. Lint and production compilation succeed after these changes. No additional automated tests were added or run in this recovery update.
- Window and Trash behavior follow the GNOME [window guide](https://help.gnome.org/gnome-help/shell-windows-states.html) and [deletion guide](https://help.gnome.org/gnome-help/files-delete.html). Native visual and animation parity remains unproven.
- Current screenshot: `.artifacts/ubuntu-desktop-experience.png`, showing the restored Files window, desktop creations and preserved portfolio content.

### Loupe image viewer — 5 October 2026

The official [Loupe 50.0 release source](https://download.gnome.org/sources/loupe/50/loupe-50.0.tar.xz) was inspected for `image_window.ui`, `image_view.ui`, `properties_view.ui`, `window.ui`, keyboard actions and styling. Native references include a 600×498 default window, 360×294 minimum, a 590 px properties breakpoint, 12 px overlay-control corners, 6 px control padding and 18 px margins. The upstream application icon and its license are retained; provenance is documented in `third-party-assets.md`.

- The image viewer is integrated with Files, the application grid, the running-app dock and window controls. The protected portrait is available in Pictures. Image files carry a validated local asset or data-image descriptor; thumbnails, image types and byte sizes use that descriptor. Copies and Trash retain the image contents. Image descriptors are excluded from the editor's document picker.
- Viewer actions include fit, actual size, 200/300 percent, custom zoom, zoom toggle, rotation, keyboard/pointer panning, previous/next/first/last navigation, properties, reload, opening local images and native image clipboard copying when supported. Rotation affects the displayed view and copied rendering, preserving the original file. External files and image drops from Files are accepted. Clipboard and drop behavior beyond the recorded browser checks remain unverified.
- The toolbar, bottom overlay controls, menus and right properties panel follow the inspected native structure. Below 590 px the properties move beneath the image and scroll within their area. The minimum-size limit is enforced during both pointer and keyboard resizing; unsupported half-width tiling is refused. During keyboard window move/resize, keys are captured before application shortcuts, preventing accidental image navigation or terminal/editor input.
- Browser evidence: Files opened `Portrait.jpg`; the viewer reported 477×538 pixels, JPEG and 36.1 kB, matching the 36,092-byte supplied asset. Ctrl+R applied 90° rotation; 200 percent produced a 1076×954 rotated display. Ctrl+Right moved the horizontal view by 80 pixels. Fit and F5 restored valid image dimensions and controls.
- Files copied the portrait to `Portrait 2.jpg`. Viewer navigation reached the original; reopening the same copy from Files correctly selected it again. Delete moved the copy into Trash and returned to the original. The original's Delete action was disabled. A separate browser file-chooser check opened the project's JPEG as `portrait.jpg`, reported its correct dimensions/size, and then moved this own verification import to recoverable Trash. Original assets were unchanged.
- Fullscreen entry, exit and opening/selecting another image within fullscreen were verified. Dialogs now use the fullscreen element as their portal destination when appropriate, preserving visibility. At 400 px width the properties moved below the image. Resizing reached 360×294 and then returned precisely to 600×498; keyboard focus returned to the viewer. At minimum size the properties occupied about 110 px, retaining image space.
- Lint and production compilation pass. No automated tests were added or run in this image-viewer update. Current screenshot: `.artifacts/ubuntu-loupe-viewer.png`.
- Remaining Loupe gaps include crop/flip editing with Save/Save As, printing, background changes, native file chooser parity, full EXIF metadata, color management, broader native formats, large-image persistence/decoding, native fullscreen auto-hiding and exact animation comparison. Browser JPEG checks do not establish complete Loupe parity.

## Remaining work and verification

### General desktop interactions refined

- An unmodified left click on empty desktop space opens creation actions. A selection drag and modifier clicks keep their selection behavior. This is the visitor interaction explicitly requested by the user.
- New desktop items use a free cell near the creation menu. Name validation and duplicate detection occur before writing the item; Cancel keeps the filesystem unchanged.
- Window opening now uses a bottom-center origin and the GNOME 50 normal-window scale of 0.01 × 0.05. Closing shrinks to 0.8; minimize/restore use the actual dock launcher's separate horizontal and vertical scale ratios. Durations follow the native source referenced above.
- Escape cancels an ongoing mouse move or resize and restores its starting geometry.
- Activities and workspace visuals retain canvas pixels, form values and scroll positions, including integrated document pages.
- Production build succeeds. The creation menu and cancellable name dialog were visibly present in the local browser preview. Exact native animation parity remains subject to comparison on Ubuntu.

- Compare the rendered shell and each app against native Ubuntu 26.04 references at matching sizes; exact visual parity is unproven.
- Compare workspace motion with native GNOME at matching dimensions, including rapid switches, moving windows, minimized windows, PDF content and reduced motion. The 250 ms slide and 100 px gap are implemented; full motion parity is still unproven.
- Continue Ptyxis/VTE parity: command parsing, shell pipelines, process behavior, exact terminal glyphs/cursor/selection, profiles, session persistence, drag reordering and native preview scaling. The implemented overview and tab actions now have browser evidence.
- Continue Papers parity: printing, arbitrary document opening, password entry, annotations/forms, signatures and multi-page navigation. CV uses the integrated reader; its supplied one-page PDF cannot prove multi-page behavior. Continue Loupe editing, printing, metadata, image formats, persistence and native motion as detailed above.
- Extend Files path completion, native dialogs and metadata/icons; audit keyboard interaction in every popover. Location entry, hidden files, name/type/size sorting and rename focus now have browser evidence.
- Verify multi-selection, rubberband, cross-window clipboard, undo conflicts, dock/app-grid reorder and app pinning in the browser, including reload.
- Continue editor syntax/rendering, draft persistence, per-document search, native preferences and full regex behavior. Dirty close/cancel, grouped save, detached dirty tabs and simultaneous file launches now have browser evidence; native visual parity remains unproven.
- Verify window-menu always-above, move-to-workspace and keyboard-resize cancellation; improve touch and smaller-screen interactions.
- Audit calendar, battery, notifications and remaining GNOME shortcuts on the integrated desktop. Super+V is wired to the calendar but is not browser-verified: the automation tool treats that combination as clipboard paste. Super+Tab grouping with multiple instances needs browser verification.
- Audit reduced-motion behavior and screenshots after the remaining motion changes.

The broad goal stays active until these areas and all further gaps found against the Ubuntu reference are implemented and verified.
