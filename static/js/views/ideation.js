/**
 * Ideation View
 * Dual-entry interface: Freestyle Prompt vs. Guided Dropdowns.
 */

import { API } from '../api.js';
import app from '../app.js';

export default {
    async mount(container, params) {
        const projectId = params.id;

        // Fetch project to see if it has data
        let project = null;
        try {
            project = await API.getProject(projectId);
        } catch (err) {
            app.toast('Error loading project', 'error');
            return;
        }

        container.innerHTML = `
            <div class="max-w-5xl mx-auto px-4 py-8">
                <!-- Navigation -->
                <nav class="mb-12 flex items-center text-sm font-mono text-gray-500">
                    <a href="#/dashboard" class="hover:text-cyan-400 transition-colors flex items-center gap-1 group">
                        <i class="ri-arrow-left-line group-hover:-translate-x-1 transition-transform"></i>
                        BACK_TO_VAULT
                    </a>
                    <span class="mx-3 text-gray-700">/</span>
                    <span class="text-gray-300 truncate max-w-xs">${project.title}</span>
                </nav>

                <!-- Header -->
                <div class="text-center mb-16 relative">
                    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-flux-500/10 rounded-full blur-3xl -z-10"></div>
                    <h1 class="text-5xl md:text-6xl font-black text-white mb-6 tracking-tight">
                        <span class="bg-clip-text text-transparent bg-gradient-to-r from-white via-cyan-200 to-flux-400">
                            Manifest Your Vision
                        </span>
                    </h1>
                    <p class="text-xl text-gray-400 max-w-2xl mx-auto font-light">
                        Architect the future. Describe your objective or allow the system to guide your parameters.
                    </p>
                </div>

                <!-- Tabs -->
                <div class="flex justify-center mb-10">
                    <div class="glass-panel p-1.5 rounded-2xl flex relative z-10 w-full max-w-md bg-black/40 border-white/5">
                        <button class="tab-btn w-1/2 py-3 rounded-xl text-sm font-bold transition-all duration-300 bg-white/10 text-white shadow-lg shadow-white/5" data-tab="freestyle">
                            <i class="ri-edit-line mr-2"></i>FREESTYLE
                        </button>
                        <button class="tab-btn w-1/2 py-3 rounded-xl text-sm font-bold transition-all duration-300 text-gray-500 hover:text-white" data-tab="guided">
                            <i class="ri-list-check-2 mr-2"></i>GUIDED
                        </button>
                    </div>
                </div>

                <!-- Form Container -->
                <div class="relative">
                    <div class="absolute -inset-1 bg-gradient-to-r from-violet-600/20 to-cyan-500/20 rounded-3xl blur opacity-50"></div>
                    <div class="glass-panel p-8 md:p-12 rounded-3xl relative overflow-hidden bg-slate-950/80">
                        
                        <form id="ideation-form" class="relative z-10 max-w-3xl mx-auto">
                            <!-- Freestyle View -->
                            <div id="tab-freestyle" class="tab-content transition-all duration-500">
                                <label class="block text-xs font-mono text-cyan-400 mb-3 uppercase tracking-widest">
                                    // Project_Directive
                                </label>
                                <div class="relative group">
                                    <div class="absolute -inset-0.5 bg-gradient-to-r from-flux-500 to-cyan-500 rounded-2xl opacity-0 group-focus-within:opacity-50 transition duration-500 blur"></div>
                                    <textarea 
                                        name="prompt" 
                                        class="relative w-full h-64 p-6 rounded-2xl bg-slate-900 border border-white/10 text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-0 resize-none font-mono text-sm leading-relaxed transition-all shadow-inner"
                                        placeholder="> Initiate system prompt...&#10;> Describe the application architecture, target user base, and core functionality..."
                                    >${project.original_prompt || ''}</textarea>
                                </div>
                                <div class="mt-3 flex justify-between items-center text-xs font-mono text-gray-600">
                                    <span>MD_SUPPORTED</span>
                                    <span><span id="char-count" class="text-cyan-500">0</span> CHARS</span>
                                </div>
                            </div>

                            <!-- Guided View -->
                            <div id="tab-guided" class="tab-content hidden transition-all duration-500 space-y-8">
                                <div>
                                    <label class="block text-xs font-mono text-cyan-400 mb-4 uppercase tracking-widest">
                                        // Domain_Selector
                                    </label>
                                    <input type="hidden" name="category" id="category-input">
                                    <div class="grid grid-cols-2 md:grid-cols-3 gap-3" id="category-pills">
                                        <!-- Pills generated here -->
                                        ${['SWE Tools', 'FinTech', 'HealthTech', 'EdTech', 'CyberSec', 'Social', 'Marketplace', 'IoT', 'AI/ML'].map(cat => `
                                            <button type="button" class="category-pill py-3 px-4 rounded-xl border border-white/10 bg-white/5 text-gray-400 hover:bg-white/10 hover:border-white/20 hover:text-white transition-all text-sm font-medium text-left flex items-center justify-between group" data-value="${cat}">
                                                <span>${cat}</span>
                                                <div class="w-2 h-2 rounded-full bg-transparent border border-gray-600 group-hover:border-cyan-400 pill-indicator"></div>
                                            </button>
                                        `).join('')}
                                    </div>
                                </div>
                                
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <label class="block text-xs font-mono text-gray-500 mb-3 uppercase">Subdomain Context</label>
                                        <div class="relative group">
                                            <div class="absolute -inset-0.5 bg-flux-500 rounded-xl opacity-0 group-focus-within:opacity-30 transition blur"></div>
                                            <input type="text" name="subdomain" class="relative w-full p-4 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-flux-500 transition-colors" placeholder="e.g., Predictive Maintenance">
                                        </div>
                                    </div>
                                    <div>
                                        <label class="block text-xs font-mono text-gray-500 mb-3 uppercase">Target Audience</label>
                                        <div class="relative group">
                                            <div class="absolute -inset-0.5 bg-flux-500 rounded-xl opacity-0 group-focus-within:opacity-30 transition blur"></div>
                                            <input type="text" name="audience" class="relative w-full p-4 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-flux-500 transition-colors" placeholder="e.g., Enterprise Admins">
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label class="block text-xs font-mono text-gray-500 mb-3 uppercase">Specific Constraints</label>
                                    <textarea name="extra_context" class="w-full h-32 p-4 rounded-xl bg-slate-900 border border-white/10 text-gray-300 focus:border-flux-500 focus:outline-none resize-none text-sm placeholder-gray-700"></textarea>
                                </div>
                            </div>

                            <!-- Action Bar -->
                            <div class="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
                                <div class="flex items-center gap-2 text-xs text-gray-500 font-mono">
                                    <i class="ri-cpu-line text-flux-500 animate-pulse"></i>
                                    <span>SYSTEM_READY :: WAITING_FOR_INPUT</span>
                                </div>
                                <button type="submit" class="w-full md:w-auto group relative px-8 py-4 bg-white text-black font-bold rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(139,92,246,0.3)] hover:scale-105 transition-all duration-300 overflow-hidden">
                                    <div class="absolute inset-0 bg-gradient-to-r from-violet-200 to-cyan-200 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    <span class="relative z-10 flex items-center justify-center gap-3">
                                        INITIALIZE_RESEARCH
                                        <i class="ri-arrow-right-line group-hover:translate-x-1 transition-transform"></i>
                                    </span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        // Tab Logic
        const tabs = container.querySelectorAll('.tab-btn');
        const contents = container.querySelectorAll('.tab-content');
        let currentMode = 'freestyle';

        tabs.forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.dataset.tab;
                currentMode = mode;

                // Update UI visually
                tabs.forEach(t => {
                    t.classList.remove('bg-white/10', 'text-white', 'shadow-lg');
                    t.classList.add('text-gray-500', 'hover:text-white');
                });
                btn.classList.add('bg-white/10', 'text-white', 'shadow-lg');
                btn.classList.remove('text-gray-500', 'hover:text-white');

                // Toggle content
                contents.forEach(c => {
                    c.classList.add('hidden', 'opacity-0', 'translate-y-4');
                    c.classList.remove('opacity-100', 'translate-y-0');
                });

                const activeContent = container.querySelector(`#tab-${mode}`);
                activeContent.classList.remove('hidden');
                // Small timeout to allow display:block to apply before transition
                setTimeout(() => {
                    activeContent.classList.remove('opacity-0', 'translate-y-4');
                    activeContent.classList.add('opacity-100', 'translate-y-0');
                }, 10);
            });
        });

        // Pill Selection Logic
        const pills = container.querySelectorAll('.category-pill');
        const categoryInput = container.querySelector('#category-input');

        pills.forEach(pill => {
            pill.addEventListener('click', () => {
                // Deselect all
                pills.forEach(p => {
                    p.classList.remove('border-flux-500', 'bg-flux-500/10', 'text-white');
                    p.classList.add('border-white/10', 'bg-white/5', 'text-gray-400');
                    p.querySelector('.pill-indicator').classList.remove('bg-cyan-400', 'border-transparent');
                    p.querySelector('.pill-indicator').classList.add('bg-transparent');
                });

                // Select clicked
                pill.classList.remove('border-white/10', 'bg-white/5', 'text-gray-400');
                pill.classList.add('border-flux-500', 'bg-flux-500/10', 'text-white');
                pill.querySelector('.pill-indicator').classList.remove('bg-transparent');
                pill.querySelector('.pill-indicator').classList.add('bg-cyan-400', 'border-transparent');

                // Update input
                categoryInput.value = pill.dataset.value;
            });
        });

        // Form Submit
        const form = container.querySelector('#ideation-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);

            let payload = {
                category: formData.get('category'),
                subdomain: formData.get('subdomain'),
                original_prompt: formData.get('prompt'),
                entry_mode: currentMode
            };

            if (currentMode === 'guided') {
                const parts = [];
                if (formData.get('audience')) parts.push(`Target Audience: ${formData.get('audience')}`);
                if (formData.get('extra_context')) parts.push(`Context: ${formData.get('extra_context')}`);
                payload.original_prompt = parts.join('\n') || 'Guided Mode Project';
            }

            // Basic validation
            if (currentMode === 'freestyle' && (!payload.original_prompt || payload.original_prompt.length < 5)) {
                app.toast("Please describe your vision.", "error");
                return;
            }
            if (currentMode === 'guided' && !payload.category) {
                app.toast("Please select a category.", "error");
                return;
            }

            const btn = form.querySelector('button[type="submit"]');
            const originalBtnContent = btn.innerHTML;
            btn.innerHTML = `<i class="ri-loader-4-line animate-spin text-xl"></i> INITIALIZING...`;
            btn.disabled = true;

            try {
                // Create new project for this idea
                const newProj = await API.createProject(payload);

                // If existing project was empty/stub, delete it
                // Logic: logic inside dashboard handles creation of stubs if we used that flow. 
                // Here we just make sure we clean up if we can, or just redirect.
                // Since strict constraint says we can only MODIFY specific files, 
                // we assume backend handles cleanup or we leave it. 
                // The previous code had a cleanup block, I'll preserve it.
                if (project && (project.title === 'New Project' && !project.original_prompt)) {
                    await API.deleteProject(projectId);
                }

                window.location.hash = `/project/${newProj.id}/research`;

            } catch (err) {
                console.error(err);
                app.toast("Failed to initialize: " + err.message, "error");
                btn.innerHTML = originalBtnContent;
                btn.disabled = false;
            }
        });
    }
};
