# Wurizip project participation popup

This folder contains the second Wurizip assistant popup prototype. It is a single-page demo, not a collection of routed subpages.

## Files

- `index.html` contains the popup layout, conversation views, accessible launcher, responsive styles, and Alpine.js bindings.
- `popup.js` defines the `wurizipPopup` component, loads its copy, manages the conversation, and synchronizes the video animations.
- `dummy.json` supplies the project-participation messages, topic choices, labels, and accessibility text.
- `assets/` contains the assistant portrait and the waving and blinking video loops.

## Conversation flow

The popup starts with a project-participation introduction. **Yes** advances through the project information and participation-index explanation; **Next** advances through the configured stages. The topic choices open an explanatory result with a checklist. **Back** moves to the previous step. The decline path shows a short sign-off. Escape, the close control, and the launcher control close or reopen the popup.

The displayed project and participation-index copy is sample text in `dummy.json`; it is not fetched from a live project or calculated by the page.

## Data and state

When the Alpine component starts, `popup.js` fetches `./dummy.json` and assigns the parsed response to `content`. The page title and text are then populated from that data. `step`, `declined`, `interest`, and `isOpen` control the conversation, selected topic, and popup visibility. The option list is derived from `content.options`.

Keep the JSON valid and preserve the data properties used by the page. If the request fails, the component stores the error in `loadError` and reports the underlying error to the browser console.

## Animation and assets

The waving and blinking MP4 loops are muted and loop. `syncVideos()` plays the loop matching the active conversation view, pauses the other loop, and pauses both when the popup is closed. Reduced-motion preferences disable playback. The portrait and both video files are loaded from this folder's `assets/` directory.

## Preview and limits

Serve the folder over HTTP so `dummy.json` and its assets load correctly. Tailwind CSS and Alpine.js are loaded from jsDelivr; Manrope is loaded from Google Fonts. Conversation content is local sample data; there is no chat service, live project lookup, index calculation, or backend persistence.

## API integration points

No API routes are defined yet. The current integration hooks are:

| Feature | Current location | Integration point |
| --- | --- | --- |
| Load assistant copy and options | `popup.js` → `loadContent()` (`fetch('./dummy.json')`) | Replace the local JSON request with an assistant-configuration endpoint whose response matches `content`. |
| Load project details and participation index | `popup.js` → `loadContent()` and the project/index conversation steps | Replace the hard-coded Project “AAA” and index sample text with data returned for the current project ID. The page does not calculate the index. |
| Start or continue a conversation | `popup.js` → `advance()`, `choose(id)`, `decline()`, and `back()` | Send the project ID, selected option, action, and conversation/session ID to the conversation API, then render its reply. |

Decide where the current project ID comes from and define loading and error states before wiring live requests. Video playback in `syncVideos()` can remain local.
