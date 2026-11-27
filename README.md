# Wurizip project popup

Serve this folder with `python3 -m http.server 8000` and open the [local preview](http://localhost:8000). The popup appears once per project in the current tab session. To preview a fresh visit, use a different `?projectId=` value.

## Conversation

1. On the welcome screen, **Yes** opens the index picker and **No** closes the popup.
2. The picker shows C-Index, F-Index, P-Index, V-Index and A-Index together.
3. An index value of 1 or less displays the withheld evaluation. A higher value displays the tier and Captain advice.
4. On either result, **Yes** returns to the picker and **No** opens Step 5.
5. Select a topic to read its answer. **Continue exploring** returns to the topics. **Back** retraces the selection. The close control dismisses the popup, as does Escape when focus is inside it.

## Files

- `index.html` defines the five screens and styles them with Tailwind utility classes. It loads Tailwind CSS and Alpine.js from jsDelivr.
- `popup.js` loads the demo data, handles navigation, and fits the speech bubble to its content. The Step 2 question and choices are centered together within the full outline.
- `dummy.json` contains the example indices, topic answers, and editable `creator` fields used for the Captain biography.
- `assets/` contains Wurizip’s waving and blinking GIFs, reduced-motion stills, and original artwork.
