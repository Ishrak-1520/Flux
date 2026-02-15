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
            <div class="max-w-5xl mx-auto px-4 py-12 animate-fade-in">
                <!-- Navigation -->
                <nav class="mb-12 flex items-center text-xs font-mono text-text-muted uppercase tracking-widest font-bold">
                    <a href="#/dashboard" class="hover:text-accent transition-colors flex items-center gap-2 group">
                        <i class="ri-arrow-left-line group-hover:-translate-x-1 transition-transform"></i>
                        Vlt_Return
                    </a>
                    <span class="mx-4 opacity-30">//</span>
                    <span class="text-text-primary truncate max-w-xs font-serif italic normal-case tracking-normal text-base">${project.title}</span>
                </nav>

                <!-- Header -->
                <div class="text-center mb-16 relative">
                    <h1 class="text-5xl md:text-7xl font-serif font-black text-text-primary mb-6 tracking-tight">
                        Manifest Your Vision
                    </h1>
                    <p class="text-lg text-text-secondary max-w-2xl mx-auto font-light leading-relaxed">
                        Architect the future. Describe your objective or allow the system to guide your parameters.
                    </p>
                </div>

                <!-- Tabs -->
                <div class="flex justify-center mb-12">
                    <div class="p-1.5 rounded-2xl flex relative z-10 w-full max-w-md bg-bg-sidebar border border-border-light shadow-sm">
                        <button class="tab-btn w-1/2 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all duration-300 bg-bg-card text-text-primary border border-border-light shadow-sm" data-tab="freestyle">
                            <i class="ri-edit-line mr-2"></i>Freestyle
                        </button>
                        <button class="tab-btn w-1/2 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all duration-300 text-text-muted hover:text-text-primary" data-tab="guided">
                            <i class="ri-list-check-2 mr-2"></i>Guided
                        </button>
                    </div>
                </div>

                <!-- Form Container -->
                <div class="relative">
                    <div class="bg-bg-card p-10 md:p-14 rounded-3xl relative overflow-hidden border border-border-light shadow-2xl">
                        
                        <form id="ideation-form" class="relative z-10 max-w-3xl mx-auto">
                            <!-- Freestyle View -->
                            <div id="tab-freestyle" class="tab-content transition-all duration-500">
                                <label class="block text-[10px] font-mono text-accent mb-4 uppercase tracking-widest font-bold">
                                    // Project_Directive
                                </label>
                                <div class="relative group">
                                    <textarea 
                                        name="prompt" 
                                        class="relative w-full h-80 p-8 rounded-2xl bg-bg-sidebar border border-border-light text-text-primary placeholder-text-muted focus:outline-none focus:border-accent resize-none font-mono text-sm leading-relaxed transition-all shadow-inner"
                                        placeholder="> Initiate system prompt...&#10;> Describe the application architecture, target user base, and core functionality..."
                                    >${project.original_prompt || ''}</textarea>
                                </div>
                                <div class="mt-4 flex justify-between items-center text-[10px] font-mono text-text-muted uppercase tracking-widest font-bold">
                                    <span>MD_Syntax_Active</span>
                                    <span><span id="char-count" class="text-accent">0</span>_Characters</span>
                                </div>
                            </div>

                            <!-- Guided View -->
                            <div id="tab-guided" class="tab-content hidden transition-all duration-500 space-y-10">
                                <div>
                                    <label class="block text-[10px] font-mono text-accent mb-6 uppercase tracking-widest font-bold">
                                        // Domain_Selector
                                    </label>
                                    <input type="hidden" name="category" id="category-input">
                                    <div class="grid grid-cols-2 lg:grid-cols-3 gap-4" id="category-pills">
                                        <!-- Pills generated here -->
                                        ${['SWE Tools', 'FinTech', 'HealthTech', 'EdTech', 'CyberSec', 'Social', 'Marketplace', 'IoT', 'AI/ML'].map(cat => `
                                            <button type="button" class="category-pill py-4 px-5 rounded-xl border border-border-light bg-bg-sidebar text-text-muted hover:bg-bg-card hover:border-accent hover:text-text-primary transition-all text-xs font-bold uppercase tracking-widest text-left flex items-center justify-between group" data-value="${cat}">
                                                <span>${cat}</span>
                                                <div class="w-2.5 h-2.5 rounded-full border border-border-light group-hover:border-accent pill-indicator"></div>
                                            </button>
                                        `).join('')}
                                    </div>
                                </div>
                                
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <label class="block text-[10px] font-mono text-text-muted mb-3 uppercase font-bold tracking-widest">Subdomain Context</label>
                                        <input type="text" name="subdomain" class="w-full p-4 rounded-xl bg-bg-sidebar border border-border-light text-text-primary focus:outline-none focus:border-accent transition-colors" placeholder="e.g., Predictive Maintenance">
                                    </div>
                                    <div>
                                        <label class="block text-[10px] font-mono text-text-muted mb-3 uppercase font-bold tracking-widest">Target Audience</label>
                                        <input type="text" name="audience" class="w-full p-4 rounded-xl bg-bg-sidebar border border-border-light text-text-primary focus:outline-none focus:border-accent transition-colors" placeholder="e.g., Enterprise Admins">
                                    </div>
                                </div>

                                <div>
                                    <label class="block text-[10px] font-mono text-text-muted mb-3 uppercase font-bold tracking-widest">Specific Constraints</label>
                                    <textarea name="extra_context" class="w-full h-32 p-4 rounded-xl bg-bg-sidebar border border-border-light text-text-primary focus:border-accent focus:outline-none resize-none text-xs placeholder-text-muted"></textarea>
                                </div>
                            </div>

                            <!-- Action Bar -->
                            <div class="mt-14 pt-10 border-t border-border-light flex flex-col md:flex-row justify-between items-center gap-8">
                                <div class="flex items-center gap-3 text-[10px] text-text-muted font-mono uppercase tracking-widest font-bold">
                                    <i class="ri-cpu-line text-accent animate-pulse"></i>
                                    <span>System_Status :: Listening_for_Directives</span>
                                </div>
                                <button type="submit" class="btn-primary px-12 py-5 text-sm">
                                    Initialize_Analysis
                                    <i class="ri-arrow-right-line ml-2"></i>
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
                    t.classList.remove('bg-bg-card', 'text-text-primary', 'shadow-sm', 'border-border-light');
                    t.classList.add('text-text-muted');
                });
                btn.classList.add('bg-bg-card', 'text-text-primary', 'shadow-sm', 'border-border-light');
                btn.classList.remove('text-text-muted');

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
                    p.classList.remove('border-accent', 'bg-accent/10', 'text-text-primary');
                    p.classList.add('border-border-light', 'bg-bg-sidebar', 'text-text-muted');
                    p.querySelector('.pill-indicator').classList.remove('bg-accent', 'border-transparent');
                    p.querySelector('.pill-indicator').classList.add('bg-transparent', 'border-border-light');
                });

                // Select clicked
                pill.classList.remove('border-border-light', 'bg-bg-sidebar', 'text-text-muted');
                pill.classList.add('border-accent', 'bg-accent/10', 'text-text-primary');
                pill.querySelector('.pill-indicator').classList.remove('bg-transparent', 'border-border-light');
                pill.querySelector('.pill-indicator').classList.add('bg-accent', 'border-transparent');

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
            btn.innerHTML = `<i class="ri-loader-4-line animate-spin text-xl"></i> Initializing_Genesis...`;
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
