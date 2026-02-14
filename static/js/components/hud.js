
export default {
    mount(container) {
        container.innerHTML = `
            <div id="flux-hud" class="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500">
                <div class="glass-panel bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl flex items-center gap-4 px-4 py-3 min-w-[300px] hover:border-violet-500/30 transition-all group">
                    
                    <!-- Logo / Expand Toggle -->
                    <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-violet-500/20 cursor-pointer hover:scale-105 transition-transform" id="hud-toggle">
                        <i class="ri-pulse-line text-lg"></i>
                    </div>

                    <!-- Status Text -->
                    <div class="flex-1">
                        <div class="flex items-center justify-between mb-1">
                            <span class="text-[10px] font-mono uppercase tracking-widest text-gray-500" id="hud-status-label">System_Idle</span>
                            <span class="text-[10px] font-mono text-violet-400" id="hud-status-percent"></span>
                        </div>
                        <div class="h-1 bg-white/5 rounded-full overflow-hidden">
                            <div id="hud-progress-bar" class="h-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all duration-300 w-0"></div>
                        </div>
                    </div>

                    <!-- Actions -->
                    <div class="flex items-center gap-1 border-l border-white/5 pl-4">
                        <button id="hud-focus-btn" class="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors" title="Zen Mode (Alt+Z)">
                            <i class="ri-focus-3-line"></i>
                        </button>
                        <button id="hud-expand-btn" class="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                            <i class="ri-arrow-up-s-line"></i>
                        </button>
                    </div>
                </div>

                <!-- Expanded Panel (Hidden by default) -->
                <div id="hud-expanded-content" class="hidden absolute bottom-full left-0 right-0 mb-4 glass-panel bg-slate-950/90 border border-white/10 p-4 rounded-2xl shadow-2xl animate-fade-in">
                    <div class="space-y-4">
                        <div class="flex items-center justify-between">
                            <h4 class="text-xs font-bold text-white uppercase tracking-wider">Active Blueprint</h4>
                            <span class="text-[10px] px-2 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30" id="hud-bp-type">Web App</span>
                        </div>
                        <div class="flex gap-2" id="hud-tech-stack">
                            <!-- Tech icons will be injected here -->
                        </div>
                    </div>
                </div>
            </div>
        `;

        const hudCollapse = container.querySelector('#flux-hud');
        const hudToggle = container.querySelector('#hud-toggle');
        const focusBtn = container.querySelector('#hud-focus-btn');
        const expandBtn = container.querySelector('#hud-expand-btn');
        const expandedContent = container.querySelector('#hud-expanded-content');
        const progressBar = container.querySelector('#hud-progress-bar');
        const statusLabel = container.querySelector('#hud-status-label');
        const statusPercent = container.querySelector('#hud-status-percent');

        // Toggle Expanded View
        const toggleExpand = () => {
            const isHidden = expandedContent.classList.contains('hidden');
            if (isHidden) {
                expandedContent.classList.remove('hidden');
                expandBtn.querySelector('i').className = 'ri-arrow-down-s-line';
                // Update dynamic data when expanding
                this.updateTechStack();
            } else {
                expandedContent.classList.add('hidden');
                expandBtn.querySelector('i').className = 'ri-arrow-up-s-line';
            }
        };

        hudToggle.addEventListener('click', toggleExpand);
        expandBtn.addEventListener('click', toggleExpand);

        // Zen Mode Toggle
        focusBtn.addEventListener('click', () => {
            window.dispatchEvent(new CustomEvent('flux-toggle-zen'));
        });

        // Listen for Stream Events
        window.addEventListener('flux-stream-start', (e) => {
            statusLabel.textContent = e.detail.label || 'Thinking...';
            progressBar.style.width = '0%';
            statusPercent.textContent = '0%';
            hudCollapse.classList.remove('translate-y-24'); // Ensure visible
        });

        window.addEventListener('flux-stream-progress', (e) => {
            const p = e.detail.progress || 0;
            progressBar.style.width = `${p}%`;
            statusPercent.textContent = `${Math.round(p)}%`;
            if (e.detail.label) statusLabel.textContent = e.detail.label;
        });

        window.addEventListener('flux-stream-end', () => {
            statusLabel.textContent = 'System_Idle';
            progressBar.style.width = '100%';
            statusPercent.textContent = '';
            setTimeout(() => {
                progressBar.style.width = '0%';
            }, 1000);
        });

        // Listen for Zen state changes to update button color
        window.addEventListener('flux-zen-changed', (e) => {
            if (e.detail.active) {
                focusBtn.classList.add('text-cyan-400');
            } else {
                focusBtn.classList.remove('text-cyan-400');
            }
        });

        this.updateTechStack();
    },

    updateTechStack() {
        const techContainer = document.getElementById('hud-tech-stack');
        if (!techContainer) return;

        const wizardData = window.FluxApp?.state?.wizardData || {};
        const techStack = wizardData.techStack || [];

        if (techStack.length === 0) {
            techContainer.innerHTML = '<span class="text-[10px] text-gray-600 italic">No tech stack selected</span>';
            return;
        }

        techContainer.innerHTML = techStack.map(item => `
            <div class="px-2 py-1 rounded bg-white/5 border border-white/5 text-[10px] text-gray-400" title="${item.category}">
                ${item.technology}
            </div>
        `).join('');
    }
};
