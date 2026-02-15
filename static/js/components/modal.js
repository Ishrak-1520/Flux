class FluxModal {
    constructor() {
        this.overlay = null;
        this.confirmResolve = null;
        this._init();
    }

    _init() {
        // Create the DOM structure once
        const modalHtml = `
            <div id="flux-modal-overlay" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm hidden opacity-0 transition-opacity duration-200">
                <div id="flux-modal-card" class="bg-bg-card border border-border-light text-text-primary rounded-xl shadow-2xl w-full max-w-md p-6 transform scale-95 transition-transform duration-200">
                    <h3 id="flux-modal-title" class="text-lg font-serif font-bold mb-2"></h3>
                    <p id="flux-modal-message" class="text-text-secondary text-sm mb-6 leading-relaxed"></p>
                    
                    <div class="flex justify-end gap-3">
                        <button id="flux-modal-cancel" class="px-4 py-2 rounded-lg border border-border-light hover:bg-bg-sidebar text-text-muted text-sm font-medium transition-colors">
                            Cancel
                        </button>
                        <button id="flux-modal-confirm" class="px-4 py-2 rounded-lg bg-accent text-white hover:opacity-90 text-sm font-medium transition-all shadow-sm">
                            Confirm
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Cache elements
        this.overlay = document.getElementById('flux-modal-overlay');
        this.card = document.getElementById('flux-modal-card');
        this.titleEl = document.getElementById('flux-modal-title');
        this.messageEl = document.getElementById('flux-modal-message');
        this.confirmBtn = document.getElementById('flux-modal-confirm');
        this.cancelBtn = document.getElementById('flux-modal-cancel');

        // Bind events
        this.confirmBtn.addEventListener('click', () => this._close(true));
        this.cancelBtn.addEventListener('click', () => this._close(false));

        // Close on overlay click
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) this._close(false);
        });

        // ESC key to cancel
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.overlay.classList.contains('hidden')) {
                this._close(false);
            }
        });
    }

    /**
     * Shows a confirmation modal.
     * @param {string} title - The header text
     * @param {string} message - The body text
     * @param {string} confirmText - Button text (default: "Confirm")
     * @param {boolean} isDanger - If true, button becomes red
     * @returns {Promise<boolean>} - True if confirmed, False if cancelled
     */
    async confirm(title, message, confirmText = "Confirm", isDanger = false) {
        return new Promise((resolve) => {
            this.confirmResolve = resolve;

            // Update Content
            this.titleEl.textContent = title;
            this.messageEl.innerHTML = message; // Allow basic HTML
            this.confirmBtn.textContent = confirmText;

            // Toggle Danger Style
            if (isDanger) {
                this.confirmBtn.classList.remove('bg-accent');
                this.confirmBtn.classList.add('bg-red-500', 'hover:bg-red-600');
            } else {
                this.confirmBtn.classList.add('bg-accent');
                this.confirmBtn.classList.remove('bg-red-500', 'hover:bg-red-600');
            }

            // Show Cancel Button (needed for confirm)
            this.cancelBtn.classList.remove('hidden');

            // Animate In
            this.overlay.classList.remove('hidden');
            setTimeout(() => {
                this.overlay.classList.remove('opacity-0');
                this.card.classList.remove('scale-95');
                this.card.classList.add('scale-100');
            }, 10);
        });
    }

    /**
     * Shows a simple alert modal (no cancel button).
     */
    async alert(title, message) {
        return new Promise((resolve) => {
            this.confirmResolve = resolve;

            this.titleEl.textContent = title;
            this.messageEl.innerHTML = message;
            this.confirmBtn.textContent = "Okay";

            this.confirmBtn.classList.add('bg-accent');
            this.confirmBtn.classList.remove('bg-red-500', 'hover:bg-red-600');
            this.cancelBtn.classList.add('hidden'); // Hide cancel for alerts

            this.overlay.classList.remove('hidden');
            setTimeout(() => {
                this.overlay.classList.remove('opacity-0');
                this.card.classList.remove('scale-95');
                this.card.classList.add('scale-100');
            }, 10);
        });
    }

    _close(result) {
        // Animate Out
        this.overlay.classList.add('opacity-0');
        this.card.classList.add('scale-95');
        this.card.classList.remove('scale-100');

        setTimeout(() => {
            this.overlay.classList.add('hidden');
            if (this.confirmResolve) {
                this.confirmResolve(result);
                this.confirmResolve = null;
            }
        }, 200);
    }
}

// Export a singleton instance
window.fluxModal = new FluxModal();
