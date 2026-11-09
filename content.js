
class FBMediaMagnifierPro {
    constructor() {
        this.enabled = true;
        this.hoverDelay = 200;
        this.hoverTimer = null;
        this.activeTarget = null;
        this.currentMediaData = null;
        this.lastMouseEvent = null;

        this.syncStorageState();
        this.initDOM();
        this.bindEvents();
    }

    syncStorageState() {
        if (typeof chrome !== "undefined" && chrome.storage?.local) {
            chrome.storage.local.get(
                { fbUnlockerEnabled: true },
                (data) => {
                    this.enabled = data.fbUnlockerEnabled;
                }
            );

            chrome.storage.onChanged.addListener((changes) => {
                if (changes.fbUnlockerEnabled) {
                    this.enabled = changes.fbUnlockerEnabled.newValue;

                    if (!this.enabled) {
                        this.hidePreview();
                    }
                }
            });
        }
    }

    initDOM() {
        this.container = document.createElement("div");
        this.container.id = "fb-pro-magnifier-overlay";

        this.img = document.createElement("img");
        this.img.id = "fb-pro-magnifier-img";

        this.badge = document.createElement("div");
        this.badge.id = "fb-pro-magnifier-badge";

        this.container.appendChild(this.img);
        this.container.appendChild(this.badge);

        document.body.appendChild(this.container);
    }

    bindEvents() {
        document.addEventListener(
            "mouseover",
            (e) => this.handleMouseOver(e),
            { passive: true }
        );

        document.addEventListener(
            "mousemove",
            (e) => this.handleMouseMove(e),
            { passive: true }
        );

        document.addEventListener(
            "mouseout",
            (e) => this.handleMouseOut(e),
            { passive: true }
        );

        document.addEventListener(
            "keydown",
            (e) => this.handleKeyDown(e)
        );

        window.addEventListener(
            "scroll",
            () => this.hidePreview(),
            { passive: true }
        );
    }

    getHighestResUrl(imgElement) {
        if (imgElement.srcset) {
            const candidates = imgElement.srcset
                .split(",")
                .map((entry) => {
                    const [url, widthStr] = entry.trim().split(/\s+/);

                    const width = widthStr
                        ? parseInt(widthStr.replace("w", ""), 10)
                        : 0;

                    return { url, width };
                });

            candidates.sort((a, b) => b.width - a.width);

            if (candidates.length && candidates[0].url) {
                return candidates[0].url;
            }
        }

        return imgElement.currentSrc || imgElement.src;
    }

    getSvgImageUrl(svgImg) {
        return (
            svgImg.getAttribute("xlink:href") ||
            svgImg.getAttribute("href") ||
            svgImg.href?.baseVal ||
            null
        );
    }

    getProfileSlug() {
        try {
            const url = new URL(window.location.href);

            if (url.pathname === "/profile.php") {
                return url.searchParams.get("id") || "user";
            }

            const cleanPath = url.pathname
                .replace(/^\/|\/$/g, "")
                .split("/");

            return cleanPath[0] || "user";
        } catch {
            return "user";
        }
    }

    findBackgroundAvatar(el) {
        let current = el;
        let depth = 0;

        while (current && depth < 4) {
            const style = window.getComputedStyle(current);
            const bg = style.backgroundImage;

            if (bg && bg !== "none") {
                const match = bg.match(/url\(["']?(.*?)["']?\)/);

                if (
                    match &&
                    match[1] &&
                    match[1].includes("scontent")
                ) {
                    const rect = current.getBoundingClientRect();

                    if (
                        rect.width >= 32 &&
                        rect.width <= 300 &&
                        rect.height >= 32
                    ) {
                        return {
                            src: match[1],
                            status: "Profile Picture",
                            type: "avatar"
                        };
                    }
                }
            }

            current = current.parentElement;
            depth++;
        }

        return null;
    }

    findNearbyAvatar(element) {
        let current = element;
        let depth = 0;

        while (current && depth < 5) {
            if (current.querySelectorAll) {
                const imgs = current.querySelectorAll("svg image");

                for (const svgImg of imgs) {
                    const r = svgImg.getBoundingClientRect();
                    const svgSrc = this.getSvgImageUrl(svgImg);

                    if (
                        r.width >= 32 &&
                        r.width <= 260 &&
                        svgSrc?.includes("scontent")
                    ) {
                        return {
                            src: svgSrc,
                            status: "Profile Picture",
                            type: "avatar"
                        };
                    }
                }
            }

            const bg = this.findBackgroundAvatar(current);

            if (bg) return bg;

            current = current.parentElement;
            depth++;
        }

        return null;
    }

    extractMediaData(element) {
        if (!element || !(element instanceof Element)) {
            return null;
        }

        // 1. Unlocked Cover
        const directCover = element.closest(
            'img[data-imgperflogname="profileCoverPhoto"]'
        );

        if (directCover && directCover.src) {
            return {
                src: this.getHighestResUrl(directCover),
                status: "Unlocked Cover",
                type: "cover"
            };
        }

        // 2. Unlocked SVG Avatar
        const svgContainer = element.closest("svg");

        if (svgContainer) {
            const rect = svgContainer.getBoundingClientRect();

            if (rect.width >= 60 && rect.width <= 260) {
                const svgImg = svgContainer.querySelector("image");

                const svgSrc = svgImg
                    ? this.getSvgImageUrl(svgImg)
                    : null;

                if (svgSrc && svgSrc.includes("scontent")) {
                    return {
                        src: svgSrc,
                        status: "Profile Picture",
                        type: "avatar"
                    };
                }
            }
        }

        // 3. Unlocked Background Avatar
        const bgDirect = this.findBackgroundAvatar(element);

        if (bgDirect) return bgDirect;

        // 4. Locked Profile Handling
        const lockOverlay = element.closest(
            'div[aria-label="Learn more"][role="button"], ' +
            'div[role="button"][aria-label*="profile picture" i], ' +
            'div[role="button"][aria-label*="Locked" i], ' +
            'a[aria-label*="Learn more" i]'
        );

        if (lockOverlay) {
            const overlayRect = lockOverlay.getBoundingClientRect();

            const aspectRatio =
                overlayRect.height > 0
                    ? overlayRect.width / overlayRect.height
                    : 0;

            // PRIORITY: Wide overlay means Cover search only.
            if (aspectRatio > 2.0) {
                let parent = lockOverlay.parentElement;

                for (let i = 0; i < 6 && parent; i++) {
                    const img =
                        parent.querySelector(
                            'img[data-imgperflogname="profileCoverPhoto"]'
                        ) ||
                        parent.querySelector('img[src*="scontent"]');

                    if (img && img.src) {
                        const rect = img.getBoundingClientRect();

                        if (rect.width > 300 && rect.height > 100) {
                            return {
                                src: this.getHighestResUrl(img),
                                status: "Locked Cover",
                                type: "cover"
                            };
                        }
                    }

                    parent = parent.parentElement;
                }

                // Do not fall back to Avatar for wide overlays.
                return null;
            }

            // Square-ish overlay: Avatar or square Cover.
            let parent = lockOverlay.parentElement;

            for (let depth = 0; depth < 8 && parent; depth++) {

                // Look for Avatar (SVG).
                const candidateSvgs =
                    parent.querySelectorAll("svg image");

                for (const svgImg of candidateSvgs) {
                    const r = svgImg.getBoundingClientRect();
                    const svgSrc = this.getSvgImageUrl(svgImg);

                    if (
                        r.width >= 60 &&
                        r.width <= 260 &&
                        svgSrc?.includes("scontent")
                    ) {
                        return {
                            src: svgSrc,
                            status: "Locked Profile Pic",
                            type: "avatar"
                        };
                    }
                }

                // Look for Avatar (Background).
                const bgAvatar = this.findBackgroundAvatar(parent);

                if (bgAvatar) return bgAvatar;

                // Fallback: Look for Cover.
                const taggedCover = parent.querySelector(
                    'img[data-imgperflogname="profileCoverPhoto"]'
                );

                if (taggedCover && taggedCover.src) {
                    return {
                        src: this.getHighestResUrl(taggedCover),
                        status: "Locked Cover",
                        type: "cover"
                    };
                }

                parent = parent.parentElement;
            }
        }

        // 5. Last Resort Search (Avatar Only).
        return this.findNearbyAvatar(element);
    }

    handleMouseOver(e) {
        if (!this.enabled) return;

        const mediaData = this.extractMediaData(e.target);

        if (!mediaData) return;

        this.activeTarget = e.target;
        this.lastMouseEvent = e;

        clearTimeout(this.hoverTimer);

        this.hoverTimer = setTimeout(() => {
            if (this.enabled) {
                this.showPreview(mediaData);
            }
        }, this.hoverDelay);
    }

    handleMouseMove(e) {
        this.lastMouseEvent = e;

        if (this.container.classList.contains("is-visible")) {
            this.updatePosition(e.clientX, e.clientY);
        }
    }

    handleMouseOut(e) {
        if (!this.activeTarget) return;

        const stillInside = this.extractMediaData(e.relatedTarget);

        if (!stillInside) {
            this.hidePreview();
        }
    }

    handleKeyDown(e) {
        if (
            !this.enabled ||
            !this.container.classList.contains("is-visible") ||
            !this.currentMediaData
        ) {
            return;
        }

        const tag = document.activeElement?.tagName;

        if (
            tag === "INPUT" ||
            tag === "TEXTAREA" ||
            document.activeElement?.isContentEditable
        ) {
            return;
        }

        if (e.key === "Escape") {
            this.hidePreview();
            return;
        }

        if (
            (e.key.toLowerCase() === "d" && !e.ctrlKey && !e.metaKey) ||
            ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s")
        ) {
            e.preventDefault();
            this.triggerDownload();
        }
    }

    triggerDownload() {
        if (!this.currentMediaData?.src) return;

        if (typeof chrome === "undefined" || !chrome.runtime?.sendMessage) {
            this.badge.textContent = "Download unavailable";
            return;
        }

        const originalBadgeHTML = this.badge.innerHTML;

        this.badge.innerHTML =
            '<span class="fb-pro-status-saved">⬇ Downloading...</span>';

        chrome.runtime.sendMessage(
            {
                action: "DOWNLOAD_MEDIA",
                url: this.currentMediaData.src,
                mediaType: this.currentMediaData.type,
                profileName: this.getProfileSlug()
            },
            (response) => {
                if (chrome.runtime.lastError) {
                    this.badge.innerHTML =
                        '<span style="color:#f3425f;">✖ Failed</span>';
                    return;
                }

                if (response && response.success) {
                    this.badge.innerHTML =
                        '<span class="fb-pro-status-saved">✔ Saved!</span>';
                } else {
                    this.badge.innerHTML =
                        '<span style="color:#f3425f;">✖ Failed</span>';
                }

                setTimeout(() => {
                    if (
                        this.container.classList.contains("is-visible")
                    ) {
                        this.badge.innerHTML = originalBadgeHTML;
                    }
                }, 1500);
            }
        );
    }

	  showPreview(mediaData) {
		this.currentMediaData = mediaData;
		this.img.onload = () => {
		  const w = this.img.naturalWidth;
		  const h = this.img.naturalHeight;
		  this.img.classList.toggle('is-low-res', w <= 200 && h <= 200);

		  const dims = `${w} × ${h}px`;
		  this.badge.innerHTML = `<span>${mediaData.status} • ${dims}</span><span class="fb-pro-hotkey-pill">Press [D] to Save</span>`;
		  this.container.classList.add('is-visible');
		  if (this.lastMouseEvent) this.updatePosition(this.lastMouseEvent.clientX, this.lastMouseEvent.clientY);
		};
		this.img.src = mediaData.src;
	  }

    updatePosition(mouseX, mouseY) {
        const offset = 20;
        const rect = this.container.getBoundingClientRect();

        const vw = window.innerWidth;
        const vh = window.innerHeight;

        let left = mouseX + offset;
        let top = mouseY + offset;

        // Flip horizontally if off-screen.
        if (left + rect.width > vw - 16) {
            left = Math.max(
                16,
                mouseX - rect.width - offset
            );
        }

        // Flip vertically if off-screen.
        if (top + rect.height > vh - 16) {
            top = Math.max(
                16,
                vh - rect.height - 16
            );
        }

        this.container.style.left = `${left}px`;
        this.container.style.top = `${top}px`;
    }

    hidePreview() {
        clearTimeout(this.hoverTimer);

        this.activeTarget = null;
        this.currentMediaData = null;

        this.container.classList.remove("is-visible");
    }
}

new FBMediaMagnifierPro();
