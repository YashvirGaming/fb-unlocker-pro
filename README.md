# FB Unlocker Pro (v2.2.0)

A lightweight, **Manifest V3 Chrome Extension** that provides instant, uncropped hover previews and one-key full-resolution downloads for Facebook cover photos and profile pictures—including media behind locked-profile overlays.


<img width="1536" height="2752" alt="Gemini_Generated_Image_6podqu6podqu6pod" src="https://github.com/user-attachments/assets/3a1239ad-85cd-46bb-ae28-d0e5748a4d76" />

![Manifest V3](https://shields.io)
![Version](https://shields.io)
![JavaScript](https://shields.io)

---

## Features

* **Instant Hover Preview.** Hover over any Facebook cover photo or profile picture for `200ms` to view an uncropped floating preview card.
* **Locked Profile DOM Support.** Detects underlying cover `<img>` and avatar `<svg><image>` assets rendered beneath Facebook's interaction overlays.
* **Smart Resolution Extraction.** Evaluates `srcset` attributes automatically to pull the highest available CDN resolution.
* **One-Key Full-Res Save.** Press **`D`** or **`Ctrl + S`** (`Cmd + S` on Mac) while hovering to download the image directly with the user's profile slug and timestamp.
* **Sapphire & Obsidian Glass UI.** Features viewport-aware cursor tracking, a live resolution badge, an on/off toolbar toggle, and a dedicated About & Credits page.
* **100% Local & Private.** Runs entirely in your browser with zero external servers, analytics, or automated API scraping.

---

## Keyboard Shortcuts

| Action | Shortcut |
| :--- | :--- |
| **Trigger Preview** | Hover over Cover or Avatar (`0.2s`) |
| **Save Full-Resolution Image** | `D` or `Ctrl + S` (`Cmd + S`) |
| **Dismiss Preview** | `Esc` or move cursor away |

---

## Installation (Load Unpacked in Chrome)

1. **Download or Clone** this repository to your computer:
   ```bash
   git clone https://github.com/YashvirGaming/fb-unlocker-pro
   ```
2. Open Chrome and navigate to **`chrome://extensions/`**.
3. Enable **Developer mode** using the toggle in the top-right corner.
4. Click **Load unpacked** and select the project folder containing `manifest.json`.
5. Pin **FB Unlocker Pro** to your Chrome toolbar and refresh any open Facebook tabs.

---

## Project Structure

```text
├── manifest.json     # Manifest V3 configuration, permissions, and host patterns
├── content.js        # DOM detection engine, hover timer, and viewport clamping
├── background.js     # Service worker handling cross-origin chrome.downloads
├── styles.css        # Sapphire & Obsidian glassmorphism preview styling
├── popup.html        # Toolbar control center UI
├── popup.js          # Persistent on/off toggle state via chrome.storage
├── credits.html      # About, technical overview, and privacy details
└── icon128.png       # Extension toolbar icon
```

---

## Permissions Explained

* **`downloads`** — Used exclusively when you press `D` or `Ctrl + S` to save the active preview image to your Downloads folder.
* **`storage`** — Saves your enabled/paused toggle preference locally across browser sessions.
* **`host_permissions` (`*.facebook.com`, `*.fbcdn.net`)** — Allows the content script to run on Facebook and enables the background service worker to fetch CDN media cleanly.

---

## Disclaimer

This tool is built for personal productivity and UI enhancement. It only previews and downloads media assets already loaded into your local browser DOM and does not bypass server-side authentication or private account permissions.


