/**
 * Research View
 * Displays streaming Gap Analysis and Project Blueprints.
 */

import { API } from '../api.js';
import app from '../app.js';
import { marked } from '../vendor/marked.js';

export default {
    async mount(container, params) {
        const projectId = params.id;
        let project = null;

        try {
            project = await API.getProject(projectId);
        } catch (err) {
            app.toast('Error loading project', 'error');
            return;
        }

        container.innerHTML = `
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
                <!-- Header -->
                <div class="mb-10 flex flex-col md:flex-row md:items-center justify-between border-b border-border-light pb-8 gap-4">
                    <div>
                        <div class="flex items-center gap-4 mb-3">
                             <div class="p-3 rounded-xl bg-accent/10 border border-accent/20 text-accent">
                                <i class="ri-search-eye-line text-2xl"></i>
                             </div>
                             <h1 class="text-4xl font-serif font-bold text-text-primary tracking-tight">Idea Explorer</h1>
                        </div>
                        <p class="text-text-secondary text-base">
                            Analyzing potential for <span class="text-accent font-bold uppercase tracking-wider text-sm font-mono">${project.category || 'Uncategorized'}</span>: <span class="text-text-primary font-serif italic">${project.title}</span>
                        </p>
                    </div>
                    
                    <div class="flex gap-4">
                        <button id="btn-regenerate" class="btn-secondary flex items-center gap-2 text-xs font-mono uppercase tracking-widest px-6">
                            <i class="ri-refresh-line"></i>
                            <span>Regen_Ideas</span>
                        </button>
                        
                        <div id="status-badge" class="px-6 py-3 rounded-xl bg-bg-sidebar text-text-muted border border-border-light flex items-center gap-3 font-mono text-xs uppercase tracking-widest">
                            <span class="relative flex h-2 w-2">
                              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                              <span class="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
                            </span>
                            <span>System_Ready</span>
                        </div>
                    </div>
                </div>

                <!-- Thinking Trace (Collapsible) -->
                <div class="mb-10">
                    <button id="toggle-thinking" class="group flex items-center text-xs font-mono text-text-muted hover:text-accent transition-colors mb-3 uppercase tracking-widest font-bold">
                        <i class="ri-brain-line mr-2 text-sm"></i>
                        <span>Neural Processing Log</span>
                        <div class="h-px bg-border-light flex-grow mx-4 group-hover:bg-accent/20 transition-colors"></div>
                        <i class="ri-arrow-down-s-line ml-1 transform transition-transform" id="thinking-arrow"></i>
                    </button>
                    <div id="thinking-container" class="hidden bg-bg-sidebar border border-border-light p-6 rounded-2xl font-mono text-[11px] text-text-secondary overflow-x-auto max-h-64 shadow-inner">
                        <pre id="thinking-log" class="whitespace-pre-wrap font-mono"></pre>
                    </div>
                </div>

                <!-- Main Content (Streamed) -->
                <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <!-- Gap Report Column -->
                    <div class="lg:col-span-8 space-y-8">
                        <div class="relative group h-full">
                            <div class="bg-bg-card p-10 rounded-2xl border border-border-light min-h-[600px] shadow-xl">
                                <div class="flex items-center justify-between mb-8 border-b border-border-light pb-6">
                                    <span class="font-mono text-xs text-accent uppercase font-bold tracking-widest">/// Web_Analysis_Synthesis...</span>
                                    <div class="flex gap-2">
                                        <div class="w-2.5 h-2.5 bg-border-light rounded-full"></div>
                                        <div class="w-2.5 h-2.5 bg-border-light rounded-full"></div>
                                        <div class="w-2.5 h-2.5 bg-border-light rounded-full"></div>
                                    </div>
                                </div>
                                <div id="report-content" class="prose-custom max-w-none">
                                    <div class="flex flex-col items-center justify-center h-96 text-text-muted animate-pulse font-mono text-xs">
                                        <i class="ri-terminal-box-line text-5xl mb-6 opacity-30"></i>
                                        <span class="uppercase tracking-widest">Establishing_Uplink...</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Blueprints Column -->
                    <div class="lg:col-span-4">
                        <div class="sticky top-10">
                            <h3 class="flex items-center gap-3 text-sm font-bold text-text-primary uppercase tracking-widest mb-8">
                                <i class="ri-blueprint-line text-accent text-lg"></i>
                                Architect Blueprints
                            </h3>
                            <div id="blueprints-container" class="space-y-5">
                                <!-- Blueprints will be injected here -->
                                <div class="p-10 rounded-2xl border border-dashed border-border-light text-center text-text-muted text-xs font-mono bg-bg-sidebar/50">
                                    <div class="w-10 h-10 border-2 border-t-accent border-border-light rounded-full animate-spin mx-auto mb-4"></div>
                                    Synthesizing_Architectures...
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                </div>

                <!-- Custom Blueprint Modal -->
                <div id="blueprint-modal" class="fixed inset-0 z-50 bg-bg-main/90 backdrop-blur-sm hidden flex items-center justify-center p-4">
                    <div class="bg-bg-card border border-border-light rounded-3xl w-full max-w-2xl p-10 shadow-3xl relative animate-scale-up">
                        <button id="close-modal" class="absolute top-6 right-6 text-text-muted hover:text-text-primary transition-colors">
                            <i class="ri-close-line text-2xl"></i>
                        </button>
                        
                        <div class="flex items-center gap-4 mb-10">
                            <div class="p-3 rounded-xl bg-accent text-white shadow-lg shadow-accent/20">
                                <i class="ri-edit-circle-line text-xl"></i>
                            </div>
                            <h2 class="text-3xl font-serif font-bold text-text-primary">Blueprint Studio</h2>
                        </div>

                        <div class="space-y-6">
                            <div>
                                <label class="block text-[10px] font-mono text-text-muted mb-2 uppercase font-bold tracking-widest">Sequence Identity</label>
                                <input type="text" id="custom-title" class="w-full bg-bg-sidebar border border-border-light rounded-xl p-4 text-text-primary text-sm focus:border-accent focus:outline-none transition-colors" placeholder="e.g. CatSpace">
                            </div>
                            
                            <div>
                                <label class="block text-[10px] font-mono text-text-muted mb-2 uppercase font-bold tracking-widest">Core Tagline</label>
                                <input type="text" id="custom-tagline" class="w-full bg-bg-sidebar border border-border-light rounded-xl p-4 text-text-primary text-sm focus:border-accent focus:outline-none transition-colors" placeholder="e.g. The social architecture for felines">
                            </div>

                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label class="block text-[10px] font-mono text-text-muted mb-2 uppercase font-bold tracking-widest">Functional Scope</label>
                                    <textarea id="custom-desc" rows="5" class="w-full bg-bg-sidebar border border-border-light rounded-xl p-4 text-text-primary text-sm focus:border-accent focus:outline-none resize-none" placeholder="Describe your vision..."></textarea>
                                </div>
                                <div>
                                    <label class="block text-[10px] font-mono text-text-muted mb-2 uppercase font-bold tracking-widest">Capability Matrix</label>
                                    <textarea id="custom-features" rows="5" class="w-full bg-bg-sidebar border border-border-light rounded-xl p-4 text-text-primary text-sm focus:border-accent focus:outline-none resize-none" placeholder="- Core capability 1&#10;- Core capability 2"></textarea>
                                </div>
                            </div>
                            
                            <div>
                                <label class="block text-[10px] font-mono text-text-muted mb-2 uppercase font-bold tracking-widest text-center">Architectural Foundation (Tech Stack)</label>
                                <input type="text" id="custom-stack" class="w-full bg-bg-sidebar border border-border-light rounded-xl p-4 text-text-primary text-sm focus:border-accent focus:outline-none transition-colors font-mono" placeholder='[{"category": "Foundation", "technology": "Next.js", "reason": "..."}]'>
                            </div>

                            <div class="flex justify-between items-center pt-8 border-t border-border-light font-mono">
                                <button id="btn-ai-assist" class="text-accent hover:text-accent-hover text-[10px] uppercase tracking-widest font-bold flex items-center gap-2 transition-colors">
                                    <i class="ri-magic-line text-lg"></i>
                                    <span>AI_Optimization_Protocol</span>
                                </button>
                                
                                <div class="flex gap-4">
                                    <button id="cancel-modal" class="btn-secondary px-8">Discard</button>
                                    <button id="btn-save-custom" class="btn-primary px-8">
                                        Initialize_Build >
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // UI Elements
        const thinkingLog = container.querySelector('#thinking-log');
        const thinkingContainer = container.querySelector('#thinking-container');
        const thinkingToggle = container.querySelector('#toggle-thinking');
        const thinkingArrow = container.querySelector('#thinking-arrow');
        const reportContent = container.querySelector('#report-content');
        const blueprintsContainer = container.querySelector('#blueprints-container');
        const statusBadge = container.querySelector('#status-badge');
        const btnRegenerate = container.querySelector('#btn-regenerate');

        // Modal Elements
        const modal = container.querySelector('#blueprint-modal');
        const btnCloseModal = container.querySelector('#close-modal');
        const btnAiAssist = container.querySelector('#btn-ai-assist');
        const btnSaveCustom = container.querySelector('#btn-save-custom');

        const inpTitle = container.querySelector('#custom-title');
        const inpTagline = container.querySelector('#custom-tagline');
        const inpDesc = container.querySelector('#custom-desc');
        const inpFeatures = container.querySelector('#custom-features');
        const inpStack = container.querySelector('#custom-stack');

        // Toggle Thinking
        thinkingToggle.addEventListener('click', () => {
            thinkingContainer.classList.toggle('hidden');
            thinkingArrow.classList.toggle('-rotate-180');
        });

        // State
        let fullMarkdown = '';
        let thinkingText = '';
        let isDone = false;
        let currentBlueprints = [];

        // Start Streaming Function
        const startAnalysis = () => {
            // Reset UI
            fullMarkdown = '';
            thinkingText = '';
            isDone = false;
            reportContent.innerHTML = `
                <div class="flex flex-col items-center justify-center h-96 text-text-muted animate-pulse font-mono text-xs uppercase tracking-widest">
                    <i class="ri-terminal-box-line text-5xl mb-6 opacity-30"></i>
                    <span>Establishing_Uplink...</span>
                </div>
            `;
            thinkingLog.textContent = '';
            blueprintsContainer.innerHTML = `
                <div class="p-10 rounded-2xl border border-dashed border-border-light text-center text-text-muted text-xs font-mono bg-bg-sidebar/50">
                    <div class="w-10 h-10 border-2 border-t-accent border-border-light rounded-full animate-spin mx-auto mb-4"></div>
                    Synthesizing_Architectures...
                </div>
            `;
            statusBadge.className = "px-6 py-3 rounded-xl bg-bg-sidebar text-text-muted border border-border-light flex items-center gap-3 font-mono text-xs uppercase tracking-widest";
            statusBadge.innerHTML = `<span class="relative flex h-2 w-2"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span><span class="relative inline-flex rounded-full h-2 w-2 bg-accent"></span></span><span>Analyzing_Request...</span>`;

            btnRegenerate.disabled = true;
            btnRegenerate.classList.add('opacity-50', 'cursor-not-allowed');

            API.streamResearch(
                projectId,
                (data) => {
                    if (data.type === 'thinking') {
                        thinkingText += data.content;
                        thinkingLog.textContent = thinkingText;
                        thinkingContainer.scrollTop = thinkingContainer.scrollHeight;

                        if (statusBadge) {
                            const thought = data.content.trim();
                            if (thought) {
                                statusBadge.innerHTML = `<span class="relative flex h-2 w-2"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span><span class="relative inline-flex rounded-full h-2 w-2 bg-accent"></span></span><span class="truncate max-w-[200px]">PROCESSOR: ${thought.substring(0, 20).replace(/\n/g, '')}...</span>`;
                            }
                        }
                    } else if (data.type === 'content') {
                        fullMarkdown += data.content;
                        reportContent.innerHTML = marked.parse(fullMarkdown);
                    } else if (data.type === 'phase') {
                        if (data.content === 'analysis') {
                            statusBadge.className = "px-6 py-3 rounded-xl bg-bg-sidebar text-accent border border-accent/20 flex items-center gap-3 font-mono text-xs uppercase tracking-widest";
                            statusBadge.innerHTML = `<i class="ri-file-text-line"></i><span>Generating_Report...</span>`;
                        } else if (data.content === 'architecting') {
                            statusBadge.className = "px-6 py-3 rounded-xl bg-bg-sidebar text-text-primary border border-border-light flex items-center gap-3 font-mono text-xs uppercase tracking-widest";
                            statusBadge.innerHTML = `<i class="ri-layout-masonry-line text-accent"></i><span>Architecting_Blueprints...</span>`;
                        }
                    } else if (data.type === 'blueprints_data') {
                        try {
                            let parsed = data.data;
                            if (typeof parsed === 'string') parsed = JSON.parse(parsed);
                            const list = Array.isArray(parsed) ? parsed : (parsed.blueprints || []);

                            currentBlueprints = list;
                            renderBlueprintsJSON(list);

                            // Save complete state to LocalStorage (both analysis and blueprints)
                            const cacheData = {
                                query: project.title || 'Research',
                                analysis: fullMarkdown,
                                blueprints: list,
                                timestamp: Date.now()
                            };
                            localStorage.setItem('flux_research_cache', JSON.stringify(cacheData));
                            // Keep old key for backwards compatibility
                            localStorage.setItem('flux_research_data', JSON.stringify(list));
                        } catch (e) {
                            console.error("Blueprint Parse Error", e);
                        }
                    }
                },
                (data) => {
                    isDone = true;
                    btnRegenerate.disabled = false;
                    btnRegenerate.classList.remove('opacity-50', 'cursor-not-allowed');
                    statusBadge.className = "px-6 py-3 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-3 font-mono text-xs uppercase tracking-widest";
                    statusBadge.innerHTML = `<i class="ri-check-double-line"></i><span>Analysis_Complete</span>`;
                },
                (err) => {
                    console.error(err);
                    btnRegenerate.disabled = false;
                    btnRegenerate.classList.remove('opacity-50', 'cursor-not-allowed');
                    app.toast('Stream interrupted', 'error');
                }
            );
        };

        // Initial Start - Check for cached state
        const cachedState = localStorage.getItem('flux_research_cache');
        if (cachedState) {
            try {
                const cached = JSON.parse(cachedState);

                // Restore analysis content
                if (cached.analysis) {
                    fullMarkdown = cached.analysis;
                    reportContent.innerHTML = marked.parse(cached.analysis);
                }

                // Restore blueprints
                if (cached.blueprints && cached.blueprints.length > 0) {
                    currentBlueprints = cached.blueprints;
                    blueprintsContainer.innerHTML = '';
                    renderBlueprintsJSON(cached.blueprints);
                }

                // Update UI to show completion state
                statusBadge.className = "px-6 py-3 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-3 font-mono text-xs uppercase tracking-widest";
                statusBadge.innerHTML = `<i class="ri-check-double-line"></i><span>Analysis_Complete</span>`;

                app.toast('Restored previous research', 'success');

            } catch (e) {
                console.error("Failed to restore cached state", e);
                localStorage.removeItem('flux_research_cache');
                localStorage.removeItem('flux_research_data');
                startAnalysis();
            }
        } else {
            // Fallback to old cache format for backwards compatibility
            const savedBlueprints = localStorage.getItem('flux_research_data');
            if (savedBlueprints) {
                try {
                    const results = JSON.parse(savedBlueprints);
                    currentBlueprints = results;
                    blueprintsContainer.innerHTML = '';
                    renderBlueprintsJSON(results);

                    statusBadge.className = "px-6 py-3 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-3 font-mono text-xs uppercase tracking-widest";
                    statusBadge.innerHTML = `<i class="ri-check-double-line"></i><span>Restored_From_Cache</span>`;
                } catch (e) {
                    console.error("Failed to parse saved blueprints", e);
                    localStorage.removeItem('flux_research_data');
                    startAnalysis();
                }
            } else {
                startAnalysis();
            }
        }

        // Event Listeners
        btnRegenerate.addEventListener('click', async () => {
            const confirmed = await window.fluxModal.confirm(
                "Regenerate Ideas?",
                "Are you sure you want to regenerate project ideas? This will clear your current architectural blueprints.",
                "Regenerate"
            );

            if (confirmed) {
                // Clear both cache formats
                localStorage.removeItem('flux_research_cache');
                localStorage.removeItem('flux_research_data');
                fullMarkdown = '';
                currentBlueprints = [];
                startAnalysis();
            }
        });

        // Modal Logic
        btnCloseModal.addEventListener('click', () => modal.classList.add('hidden'));

        btnAiAssist.addEventListener('click', async () => {
            const desc = inpDesc.value.trim();
            if (!desc) return app.toast('Please enter a description first', 'error');

            btnAiAssist.innerHTML = `<i class="ri-loader-4-line animate-spin text-lg"></i> <span class="uppercase tracking-widest">Optimizing...</span>`;

            try {
                const res = await fetch('/api/research/assist', {
                    method: 'POST',
                    headers: API.headers,
                    body: JSON.stringify({ user_description: desc })
                });
                const data = await res.json();

                inpTitle.value = data.suggested_title || '';
                inpFeatures.value = (data.features || []).map(f => `- ${f}`).join('\n');

                // Format tech stack as JSON for input
                inpStack.value = JSON.stringify(data.tech_stack || [], null, 2);

                app.toast('AI Optimization Applied!', 'success');
            } catch (err) {
                console.error(err);
                app.toast('AI Optimization Failed', 'error');
            } finally {
                btnAiAssist.innerHTML = `<i class="ri-magic-line text-lg"></i> <span>AI_Optimization_Protocol</span>`;
            }
        });

        btnSaveCustom.addEventListener('click', async () => {
            const title = inpTitle.value || "Custom Project";
            const customBP = {
                title: title,
                tagline: inpTagline.value || "A custom defined project.",
                problem: inpDesc.value || "Custom problem statement.",
                solution: "Custom solution.",
                complexity: "Variable",
                tech_stack: []
            };

            // Try parse tech stack
            try {
                customBP.tech_stack = JSON.parse(inpStack.value || "[]");
            } catch (e) {
                // Fallback text parsing if they messed up JSON
                customBP.tech_stack = [{ category: "Custom", technology: inpStack.value, reason: "User defined" }];
            }

            // Append to blueprints list
            currentBlueprints.push(customBP);
            const newIndex = currentBlueprints.length - 1;

            localStorage.setItem(`project_${projectId}_custom_blueprint`, JSON.stringify(customBP));

            if (await window.fluxModal.confirm("Initialize Project?", `Initialize custom project "${title}" and proceed to planning?`)) {
                try {
                    await API.selectBlueprint(projectId, -1);
                    window.location.hash = `/project/${projectId}/planning`;
                } catch (err) {
                    console.error(err);
                    app.toast("Failed to save selection", 'error');
                }
            }
        });

        // Robust Blueprint Renderer
        function renderBlueprintsJSON(blueprints) {
            const container = document.getElementById('blueprints-container');
            container.innerHTML = '';

            // Safety check: sometimes the AI returns { "blueprints": [...] } and sometimes just [...]
            const list = Array.isArray(blueprints) ? blueprints : (blueprints.blueprints || []);

            if (list.length === 0) {
                container.innerHTML = '<div class="text-red-400 text-xs font-mono p-4 border border-red-500/20 rounded">Error: No valid blueprints found in JSON.</div>';
                console.error("Invalid Blueprint Data:", blueprints);
                return;
            }

            list.forEach((bp, index) => {
                // Fallback Mapping
                const title = bp.title || bp.name || bp.project_name || "Untitled Project";
                const tagline = bp.tagline || bp.description || "No tagline available";
                const problem = bp.problem || bp.gap || "Problem definition missing";
                const complexity = bp.complexity || bp.difficulty || "Medium";

                const card = document.createElement('div');
                card.className = "bg-bg-card border border-border-light rounded-2xl p-6 hover:border-accent hover:shadow-xl transition-all cursor-pointer mb-5 group animate-fade-in";
                card.innerHTML = `
                    <div class="flex justify-between items-start mb-4">
                         <h4 class="font-serif font-bold text-text-primary text-xl tracking-tight group-hover:text-accent transition-colors">${title}</h4>
                         <span class="font-mono text-[9px] text-text-muted border border-border-light px-2 py-0.5 rounded-full bg-bg-sidebar uppercase tracking-widest font-bold">BP_${String(index + 1).padStart(2, '0')}</span>
                    </div>
                    <p class="text-[11px] text-accent font-mono uppercase tracking-widest font-bold mb-3">${tagline}</p>
                    <p class="text-xs text-text-secondary line-clamp-3 mb-6 leading-relaxed">${problem}</p>
                    
                    <!-- Tech Stack -->
                    <div class="mb-6 space-y-3">
                        <div class="text-[9px] text-text-muted uppercase font-bold tracking-widest border-b border-border-light pb-1 mb-2">Architectural Foundation</div>
                        ${(bp.tech_stack || []).slice(0, 3).map(t => `
                            <div class="flex flex-col gap-1">
                                <div class="flex justify-between items-center">
                                    <span class="text-[10px] font-bold text-text-primary">${t.category}</span>
                                    <span class="text-[10px] text-accent font-mono font-bold">${t.technology}</span>
                                </div>
                                <div class="text-[10px] text-emerald-600 italic leading-snug line-clamp-2">"${t.reason || 'Optimal for this architecture.'}"</div>
                            </div>
                        `).join('')}
                    </div>

                    <div class="flex items-center justify-between mt-auto pt-4 border-t border-border-light">
                        <span class="text-[10px] text-text-muted font-mono flex items-center gap-2 uppercase font-bold tracking-widest">
                            <div class="w-2 h-2 rounded-full ${['High', 'Hard'].includes(complexity) ? 'bg-red-500' : ['Low', 'Easy'].includes(complexity) ? 'bg-emerald-500' : 'bg-amber-500'}"></div>
                            ${complexity}_Level
                        </span>
                        <span class="text-[10px] text-accent font-bold uppercase tracking-widest group-hover:translate-x-1 transition-transform flex items-center gap-1">
                            Initialize <i class="ri-arrow-right-line"></i>
                        </span>
                    </div>
                `;

                card.addEventListener('click', async () => {
                    const confirmed = await window.fluxModal.confirm(
                        "Select Blueprint",
                        `Initialize implementation sequence for "${title}" and proceed to project planning?`
                    );

                    if (confirmed) {
                        try {
                            await API.selectBlueprint(projectId, index);
                            window.location.hash = `/project/${projectId}/planning`;
                        } catch (err) {
                            console.error(err);
                            await window.fluxModal.alert("Error", "Failed to select blueprint. Please check the console for details.");
                        }
                    }
                });
                container.appendChild(card);
            });

            const customCard = document.createElement('div');
            customCard.className = "bg-bg-sidebar/30 border border-dashed border-border-light rounded-2xl p-8 hover:bg-bg-sidebar/50 hover:border-accent transition-all cursor-pointer text-center group animate-fade-in mb-10";
            customCard.innerHTML = `
                <div class="w-14 h-14 rounded-2xl bg-bg-card border border-border-light flex items-center justify-center mb-6 mx-auto group-hover:scale-110 group-hover:border-accent transition-all shadow-sm">
                    <i class="ri-pencil-ruler-2-line text-3xl text-text-muted group-hover:text-accent transition-colors"></i>
                </div>
                <h4 class="font-serif font-bold text-text-primary text-xl mb-3">Custom Architecture</h4>
                <p class="text-[11px] text-text-secondary mb-6 leading-relaxed px-4">Define a unique sequence manually and utilize AI protocols to optimize the technical foundation.</p>
                <span class="text-[10px] font-bold text-accent uppercase tracking-widest border border-accent/30 px-6 py-2 rounded-xl group-hover:bg-accent group-hover:text-white transition-all">Open Studio</span>
            `;
            customCard.addEventListener('click', () => {
                document.getElementById('blueprint-modal').classList.remove('hidden');
            });
            container.appendChild(customCard);
        }
    }
};
