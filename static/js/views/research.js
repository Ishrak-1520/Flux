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
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <!-- Header -->
                <div class="mb-8 flex items-center justify-between border-b border-white/10 pb-6">
                    <div>
                        <div class="flex items-center gap-3 mb-2">
                             <div class="p-2 rounded-lg bg-flux-500/10 border border-flux-500/20 text-flux-400">
                                <i class="ri-search-eye-line text-xl"></i>
                             </div>
                             <h1 class="text-3xl font-bold text-white tracking-tight">Idea Explorer</h1>
                        </div>
                        <p class="text-gray-400 font-mono text-sm">
                            Target: <span class="text-cyan-400">${project.category || 'Uncategorized'}</span> // <span class="text-flux-400">${project.title}</span>
                        </p>
                    </div>
                    
                    <div class="flex gap-4">
                        <button id="btn-regenerate" class="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 flex items-center gap-2 font-mono text-xs transition-colors">
                            <i class="ri-refresh-line"></i>
                            <span>REGENERATE_IDEAS</span>
                        </button>
                        
                        <div id="status-badge" class="px-4 py-2 rounded-lg bg-yellow-500/5 text-yellow-500 border border-yellow-500/20 flex items-center gap-3 font-mono text-xs">
                            <span class="relative flex h-2 w-2">
                              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                              <span class="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                            </span>
                            <span>Getting things ready...</span>
                        </div>
                    </div>
                </div>

                <!-- Thinking Trace (Collapsible) -->
                <div class="mb-8">
                    <button id="toggle-thinking" class="group flex items-center text-xs font-mono text-gray-500 hover:text-cyan-400 transition-colors mb-2 uppercase tracking-widest">
                        <i class="ri-brain-line mr-2"></i>
                        <span>Neural Processing Log</span>
                        <div class="h-px bg-gray-800 flex-grow mx-4 group-hover:bg-cyan-900 transition-colors"></div>
                        <i class="ri-arrow-down-s-line ml-1 transform transition-transform" id="thinking-arrow"></i>
                    </button>
                    <div id="thinking-container" class="hidden bg-black/60 backdrop-blur border border-white/10 p-4 rounded-lg font-mono text-[10px] text-green-400/80 overflow-x-auto max-h-48 shadow-inner shadow-black/50">
                        <pre id="thinking-log" class="whitespace-pre-wrap font-mono"></pre>
                    </div>
                </div>

                <!-- Main Content (Streamed) -->
                <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <!-- Gap Report Column -->
                    <div class="lg:col-span-8 space-y-6">
                        <div class="relative group">
                            <!-- Decorators -->
                            <div class="absolute -top-1 -left-1 w-2 h-2 border-t border-l border-flux-500/50"></div>
                            <div class="absolute -top-1 -right-1 w-2 h-2 border-t border-r border-flux-500/50"></div>
                            <div class="absolute -bottom-1 -left-1 w-2 h-2 border-b border-l border-flux-500/50"></div>
                            <div class="absolute -bottom-1 -right-1 w-2 h-2 border-b border-r border-flux-500/50"></div>
                            
                            <div class="glass-panel p-8 rounded-none border border-white/10 min-h-[500px] bg-slate-950/50">
                                <div class="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                                    <span class="font-mono text-xs text-flux-400 uppercase">/// Researching the Web...</span>
                                    <div class="flex gap-2">
                                        <div class="w-2 h-2 bg-red-500/20 rounded-full"></div>
                                        <div class="w-2 h-2 bg-yellow-500/20 rounded-full"></div>
                                        <div class="w-2 h-2 bg-green-500/20 rounded-full"></div>
                                    </div>
                                </div>
                                <div id="report-content" class="prose prose-invert prose-sm max-w-none prose-headings:font-sans prose-headings:tracking-tight prose-p:text-gray-300 prose-a:text-flux-400">
                                    <!-- Streamed Markdown will appear here -->
                                    <div class="flex flex-col items-center justify-center h-64 text-gray-600 animate-pulse font-mono text-xs">
                                        <i class="ri-terminal-box-line text-4xl mb-4 opacity-50"></i>
                                        <span>ESTABLISHING_UPLINK...</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Blueprints Column -->
                    <div class="lg:col-span-4">
                        <div class="sticky top-8">
                            <h3 class="flex items-center gap-2 text-sm font-bold text-white uppercase tracking-widest mb-6">
                                <i class="ri-blueprint-line text-flux-500"></i>
                                Starter Ideas (Blueprints)
                            </h3>
                            <div id="blueprints-container" class="space-y-4">
                                <!-- Blueprints will be injected here -->
                                <div class="p-6 rounded border border-dashed border-white/10 text-center text-gray-600 text-xs font-mono">
                                    <div class="w-8 h-8 border-2 border-t-flux-500 border-white/10 rounded-full animate-spin mx-auto mb-3"></div>
                                    Awaiting_Analysis_Completion...
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                </div>

                <!-- Custom Blueprint Modal -->
                <div id="blueprint-modal" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm hidden flex items-center justify-center">
                    <div class="bg-gray-900 border border-white/10 rounded-xl w-full max-w-2xl p-6 shadow-2xl relative">
                        <button id="close-modal" class="absolute top-4 right-4 text-gray-500 hover:text-white">
                            <i class="ri-close-line text-xl"></i>
                        </button>
                        
                        <div class="flex items-center gap-3 mb-6">
                            <div class="p-2 rounded bg-flux-500/20 text-flux-400">
                                <i class="ri-edit-circle-line"></i>
                            </div>
                            <h2 class="text-xl font-bold text-white">Blueprint Studio</h2>
                        </div>

                        <div class="space-y-4">
                            <div>
                                <label class="block text-xs font-mono text-gray-500 mb-1">PROJECT NAME</label>
                                <input type="text" id="custom-title" class="w-full bg-black/50 border border-white/10 rounded p-2 text-white text-sm focus:border-flux-500 focus:outline-none" placeholder="e.g. CatSpace">
                            </div>
                            
                            <div>
                                <label class="block text-xs font-mono text-gray-500 mb-1">ONE-LINER TAGLINE</label>
                                <input type="text" id="custom-tagline" class="w-full bg-black/50 border border-white/10 rounded p-2 text-white text-sm focus:border-flux-500 focus:outline-none" placeholder="e.g. The Facebook for Felines">
                            </div>

                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-xs font-mono text-gray-500 mb-1">DESCRIPTION (Required for AI)</label>
                                    <textarea id="custom-desc" rows="4" class="w-full bg-black/50 border border-white/10 rounded p-2 text-white text-sm focus:border-flux-500 focus:outline-none" placeholder="Describe your idea briefly..."></textarea>
                                </div>
                                <div class="space-y-4">
                                     <div>
                                        <label class="block text-xs font-mono text-gray-500 mb-1">KEY FEATURES</label>
                                        <textarea id="custom-features" rows="4" class="w-full bg-black/50 border border-white/10 rounded p-2 text-white text-sm focus:border-flux-500 focus:outline-none" placeholder="- Login&#10;- Feed&#10;- Likes"></textarea>
                                     </div>
                                </div>
                            </div>
                            
                            <div>
                                <label class="block text-xs font-mono text-gray-500 mb-1">TECH STACK (JSON or Comma Sep)</label>
                                <input type="text" id="custom-stack" class="w-full bg-black/50 border border-white/10 rounded p-2 text-white text-sm focus:border-flux-500 focus:outline-none" placeholder='[{"category": "Frontend", "technology": "React", "reason": "..."}]'>
                            </div>

                            <div class="flex justify-between items-center pt-4 border-t border-white/10 font-mono">
                                <button id="btn-ai-assist" class="text-flux-400 hover:text-flux-300 text-xs flex items-center gap-2">
                                    <i class="ri-magic-line"></i>
                                    <span>AI_SUGGEST_DETAILS</span>
                                </button>
                                
                                <button id="btn-save-custom" class="bg-flux-600 hover:bg-flux-500 text-white px-6 py-2 rounded text-xs font-bold transition-colors">
                                    PROCEED_TO_PLANNING >
                                </button>
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
                <div class="flex flex-col items-center justify-center h-64 text-gray-600 animate-pulse font-mono text-xs">
                    <i class="ri-terminal-box-line text-4xl mb-4 opacity-50"></i>
                    <span>ESTABLISHING_UPLINK...</span>
                </div>
            `;
            thinkingLog.textContent = '';
            blueprintsContainer.innerHTML = `
                <div class="p-6 rounded border border-dashed border-white/10 text-center text-gray-600 text-xs font-mono">
                    <div class="w-8 h-8 border-2 border-t-flux-500 border-white/10 rounded-full animate-spin mx-auto mb-3"></div>
                    Awaiting_Analysis_Completion...
                </div>
            `;
            statusBadge.className = "px-4 py-2 rounded-lg bg-yellow-500/5 text-yellow-500 border border-yellow-500/20 flex items-center gap-3 font-mono text-xs";
            statusBadge.innerHTML = `<span class="relative flex h-2 w-2"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span><span class="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span></span><span>Analyzying Request...</span>`;

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
                                statusBadge.innerHTML = `<span class="relative flex h-2 w-2"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span><span class="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span></span><span class="truncate max-w-[200px]">PROCESSING: ${thought.substring(0, 20).replace(/\n/g, '')}...</span>`;
                            }
                        }
                    } else if (data.type === 'content') {
                        fullMarkdown += data.content;
                        reportContent.innerHTML = marked.parse(fullMarkdown);
                    } else if (data.type === 'phase') {
                        if (data.content === 'analysis') {
                            statusBadge.className = "px-4 py-2 rounded-lg bg-blue-500/5 text-blue-400 border border-blue-500/20 flex items-center gap-3 font-mono text-xs";
                            statusBadge.innerHTML = `<i class="ri-file-text-line"></i><span>GENERATING_REPORT...</span>`;
                        } else if (data.content === 'architecting') {
                            statusBadge.className = "px-4 py-2 rounded-lg bg-purple-500/5 text-purple-400 border border-purple-500/20 flex items-center gap-3 font-mono text-xs";
                            statusBadge.innerHTML = `<i class="ri-layout-masonry-line"></i><span>ARCHITECTING_BLUEPRINTS...</span>`;
                        }
                    } else if (data.type === 'blueprints_data') {
                        try {
                            let parsed = data.data;
                            if (typeof parsed === 'string') parsed = JSON.parse(parsed);
                            const list = Array.isArray(parsed) ? parsed : (parsed.blueprints || []);

                            // Save to LocalStorage
                            localStorage.setItem('flux_research_data', JSON.stringify(list));

                            currentBlueprints = list; // Store for later
                            renderBlueprintsJSON(list);
                        } catch (e) {
                            console.error("Blueprint Parse Error", e);
                        }
                    }
                },
                (data) => {
                    isDone = true;
                    btnRegenerate.disabled = false;
                    btnRegenerate.classList.remove('opacity-50', 'cursor-not-allowed');
                    statusBadge.className = "px-4 py-2 rounded-lg bg-emerald-500/5 text-emerald-400 border border-emerald-500/20 flex items-center gap-3 font-mono text-xs";
                    statusBadge.innerHTML = `<i class="ri-check-double-line"></i><span>ANALYSIS_COMPLETE</span>`;
                },
                (err) => {
                    console.error(err);
                    btnRegenerate.disabled = false;
                    btnRegenerate.classList.remove('opacity-50', 'cursor-not-allowed');
                    app.toast('Stream interrupted', 'error');
                }
            );
        };

        // Initial Start
        const savedBlueprints = localStorage.getItem('flux_research_data');
        if (savedBlueprints) {
            try {
                const results = JSON.parse(savedBlueprints);
                currentBlueprints = results;
                renderBlueprintsJSON(results);

                // Update UI to show completion state
                statusBadge.className = "px-4 py-2 rounded-lg bg-emerald-500/5 text-emerald-400 border border-emerald-500/20 flex items-center gap-3 font-mono text-xs";
                statusBadge.innerHTML = `<i class="ri-check-double-line"></i><span>RESTORED_FROM_CACHE</span>`;

                // Hide empty state loader if it exists
                blueprintsContainer.innerHTML = '';
                renderBlueprintsJSON(results);

            } catch (e) {
                console.error("Failed to parse saved blueprints", e);
                localStorage.removeItem('flux_research_data');
                startAnalysis();
            }
        } else {
            startAnalysis();
        }

        // Event Listeners
        btnRegenerate.addEventListener('click', () => {
            if (confirm("Regenerate ideas? This will clear current blueprints.")) {
                localStorage.removeItem('flux_research_data');
                startAnalysis();
            }
        });

        // Modal Logic
        btnCloseModal.addEventListener('click', () => modal.classList.add('hidden'));

        btnAiAssist.addEventListener('click', async () => {
            const desc = inpDesc.value.trim();
            if (!desc) return app.toast('Please enter a description first', 'error');

            btnAiAssist.innerHTML = `<i class="ri-loader-4-line animate-spin"></i> THINKING...`;

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

                app.toast('AI Suggestions Applied!', 'success');
            } catch (err) {
                console.error(err);
                app.toast('AI Assist Failed', 'error');
            } finally {
                btnAiAssist.innerHTML = `<i class="ri-magic-line"></i> AI_SUGGEST_DETAILS`;
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

            if (confirm(`Initialize custom project "${title}"?`)) {
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
                // Fallback Mapping: Try standard keys, then common variations
                const title = bp.title || bp.name || bp.project_name || "Untitled Project";
                const tagline = bp.tagline || bp.description || "No tagline available";
                const problem = bp.problem || bp.gap || "Problem definition missing";
                const complexity = bp.complexity || bp.difficulty || "Medium";

                const card = document.createElement('div');
                card.className = "group relative p-[1px] rounded-xl bg-gradient-to-br from-white/10 to-transparent hover:from-cyan-500/50 transition-all duration-300 cursor-pointer mb-4";
                card.innerHTML = `
                    <div class="bg-gray-900/90 backdrop-blur rounded-xl p-5 relative overflow-hidden group-hover:bg-gray-900/80 transition-colors">
                        <div class="flex justify-between items-start mb-3 relative z-10">
                             <h4 class="font-bold text-white group-hover:text-cyan-400 transition-colors tracking-tight text-lg">${title}</h4>
                             <span class="font-mono text-[10px] text-gray-500 border border-white/10 px-1.5 py-0.5 rounded bg-black/40">BP_0${index + 1}</span>
                        </div>
                        <p class="text-xs text-cyan-400 font-mono mb-2">${tagline}</p>
                        <p class="text-xs text-gray-400 line-clamp-3 mb-4 leading-relaxed relative z-10">${problem}</p>
                        
                        <!-- Tech Stack with Reasons -->
                        <div class="mb-4 space-y-2 relative z-10">
                            <div class="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Recommended Tools:</div>
                            ${(bp.tech_stack || []).map(t => `
                                <div class="bg-white/5 rounded p-2 border border-white/5">
                                    <div class="flex justify-between items-center mb-1">
                                        <span class="text-[10px] font-bold text-gray-300">${t.category}</span>
                                        <span class="text-[10px] text-flux-400 font-mono">${t.technology}</span>
                                    </div>
                                    <div class="text-[10px] text-green-300 italic leading-tight">"${t.reason || 'Easy to learn and very popular.'}"</div>
                                </div>
                            `).join('')}
                        </div>

                        <div class="flex items-center justify-between mt-auto pt-3 border-t border-white/5 relative z-10">
                            <span class="text-[10px] text-gray-400 font-mono flex items-center gap-1">
                                <div class="w-1.5 h-1.5 rounded-full ${['High', 'Hard'].includes(complexity) ? 'bg-red-500' : ['Low', 'Easy'].includes(complexity) ? 'bg-green-500' : 'bg-yellow-500'}"></div>
                                ${complexity}
                            </span>
                            <span class="text-xs text-cyan-300 font-bold group-hover:translate-x-1 transition-transform">SELECT ></span>
                        </div>
                    </div>
                `;

                card.addEventListener('click', async () => {
                    if (confirm(`Initialize implementation sequence for "${title}"?`)) {
                        try {
                            await API.selectBlueprint(projectId, index);
                            window.location.hash = `/project/${projectId}/planning`;
                        } catch (err) {
                            console.error(err);
                            alert("Failed to select blueprint. Check console.");
                        }
                    }
                });
                container.appendChild(card);
            });

            // Append "Custom Blueprint" Card (Static)
            const customCard = document.createElement('div');
            customCard.className = "group relative p-[1px] rounded-xl bg-gradient-to-br from-white/10 to-transparent hover:from-flux-500/50 transition-all duration-300 cursor-pointer border-dashed border border-white/20 hover:border-flux-500/50";
            customCard.innerHTML = `
                <div class="bg-transparent rounded-xl p-5 relative overflow-hidden flex flex-col items-center justify-center min-h-[250px] text-center">
                    <div class="w-12 h-12 rounded-full bg-flux-500/10 flex items-center justify-center mb-4 group-hover:bg-flux-500/20 transition-colors">
                        <i class="ri-pencil-ruler-2-line text-2xl text-flux-400"></i>
                    </div>
                    <h4 class="font-bold text-white mb-2">Build Custom Architecture</h4>
                    <p class="text-xs text-gray-500 mb-4">Have your own idea? Define it manually and get AI assistance to fill in the technical details.</p>
                    <span class="text-xs text-flux-300 font-bold border border-flux-500/30 px-3 py-1 rounded bg-flux-500/10 group-hover:bg-flux-500/20 transition-colors">OPEN STUDIO</span>
                </div>
            `;
            customCard.addEventListener('click', () => {
                document.getElementById('blueprint-modal').classList.remove('hidden');
            });
            container.appendChild(customCard);
        }
    }
};
