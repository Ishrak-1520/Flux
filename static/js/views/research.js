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
                             <h1 class="text-3xl font-bold text-white tracking-tight">Market Research</h1>
                        </div>
                        <p class="text-gray-400 font-mono text-sm">
                            Target: <span class="text-cyan-400">${project.category || 'Uncategorized'}</span> // <span class="text-flux-400">${project.title}</span>
                        </p>
                    </div>
                    
                    <div id="status-badge" class="px-4 py-2 rounded-lg bg-yellow-500/5 text-yellow-500 border border-yellow-500/20 flex items-center gap-3 font-mono text-xs">
                        <span class="relative flex h-2 w-2">
                          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                          <span class="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                        </span>
                        <span>INITIALIZING_AGENT_SWARM...</span>
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
                                    <span class="font-mono text-xs text-flux-400 uppercase">/// Analysis_Output_Stream</span>
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
                                Architectural Schematics
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
        `;

        // UI Elements
        const thinkingLog = container.querySelector('#thinking-log');
        const thinkingContainer = container.querySelector('#thinking-container');
        const thinkingToggle = container.querySelector('#toggle-thinking');
        const thinkingArrow = container.querySelector('#thinking-arrow');
        const reportContent = container.querySelector('#report-content');
        const blueprintsContainer = container.querySelector('#blueprints-container');
        const statusBadge = container.querySelector('#status-badge');

        // Toggle Thinking
        thinkingToggle.addEventListener('click', () => {
            thinkingContainer.classList.toggle('hidden');
            thinkingArrow.classList.toggle('-rotate-180');
        });

        // Initialize State
        let fullMarkdown = '';
        let thinkingText = '';
        let isDone = false;

        // Start Streaming
        API.streamResearch(
            projectId,
            (data) => {
                // Handle AI "thinking" tokens separately
                if (data.type === 'thinking') {
                    thinkingText += data.content;
                    thinkingLog.textContent = thinkingText;
                    thinkingContainer.scrollTop = thinkingContainer.scrollHeight;

                    // Update status badge with thinking visual
                    if (statusBadge) {
                        const thought = data.content.trim();
                        if (thought) {
                            statusBadge.innerHTML = `
                                <span class="relative flex h-2 w-2">
                                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                                  <span class="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                                </span>
                                <span class="truncate max-w-[200px]">PROCESSING_NODE: ${thought.substring(0, 20).replace(/\n/g, '')}...</span>
                             `;
                        }
                    }
                    return;
                }

                if (data.type === 'content') {
                    fullMarkdown += data.content;

                    // Render Markdown
                    reportContent.innerHTML = marked.parse(fullMarkdown);
                }
                else if (data.type === 'phase') {
                    if (data.content === 'analysis') {
                        statusBadge.className = "px-4 py-2 rounded-lg bg-blue-500/5 text-blue-400 border border-blue-500/20 flex items-center gap-3 font-mono text-xs";
                        statusBadge.innerHTML = `<i class="ri-file-text-line"></i><span>GENERATING_REPORT_MATRIX...</span>`;
                    } else if (data.content === 'architecting') {
                        statusBadge.className = "px-4 py-2 rounded-lg bg-purple-500/5 text-purple-400 border border-purple-500/20 flex items-center gap-3 font-mono text-xs";
                        statusBadge.innerHTML = `<i class="ri-layout-masonry-line"></i><span>CONSTRUCTING_SCHEMATICS (JSON)...</span>`;
                    }
                }
                else if (data.type === 'blueprints_data') {
                    // Render Blueprints from JSON
                    try {
                        console.log("🔹 Raw Blueprint Data String:", data.data);
                        let parsed = data.data;
                        if (typeof parsed === 'string') {
                            parsed = JSON.parse(parsed);
                        }

                        // Handle nested "blueprints" key if the AI wrapped it
                        const list = Array.isArray(parsed) ? parsed : (parsed.blueprints || []);

                        console.log("🔹 Parsed Blueprints List:", list);
                        renderBlueprintsJSON(list);
                    } catch (e) {
                        console.error("Blueprint Parse Error", e);
                        blueprintsContainer.innerHTML = `<div class="text-red-500 text-xs p-4">JSON Parse Error: ${e.message}</div>`;
                    }
                }
            },
            (data) => {
                isDone = true;
                statusBadge.className = "px-4 py-2 rounded-lg bg-emerald-500/5 text-emerald-400 border border-emerald-500/20 flex items-center gap-3 font-mono text-xs";
                statusBadge.innerHTML = `<i class="ri-check-double-line"></i><span>ANALYSIS_COMPLETE</span>`;
            },
            (err) => {
                console.error(err);
                if (!isDone) {
                    statusBadge.className = "px-4 py-2 rounded-lg bg-red-500/5 text-red-400 border border-red-500/20 flex items-center gap-3 font-mono text-xs";
                    statusBadge.innerHTML = `<i class="ri-alarm-warning-line"></i><span>CONNECTION_LOST</span>`;
                    app.toast('Stream interrupted', 'error');
                }
            }
        );

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
        }
    }
};
