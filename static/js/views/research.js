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
                        <p class="text-gray-400 font-mono text-sm flex items-center gap-2">
                            Target: <span class="text-cyan-400">${project.category || 'Uncategorized'}</span> 
                            <span class="text-gray-600">//</span> 
                            <span id="project-title" class="text-flux-400 hover:text-white cursor-pointer border-b border-dashed border-transparent hover:border-flux-400 transition-colors" title="Click to rename">${project.title}</span>
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
        const projectTitle = container.querySelector('#project-title');

        // Rename Logic
        projectTitle.addEventListener('click', () => {
            const currentTitle = projectTitle.textContent;
            const input = document.createElement('input');
            input.type = 'text';
            input.value = currentTitle;
            input.className = "bg-transparent border-b border-flux-400 text-white focus:outline-none font-mono text-sm w-48";

            projectTitle.replaceWith(input);
            input.focus();

            const save = async () => {
                const newTitle = input.value.trim();
                if (newTitle && newTitle !== currentTitle) {
                    try {
                        await API.updateProjectTitle(projectId, newTitle);
                        app.toast('Project renamed', 'success');
                        projectTitle.textContent = newTitle;
                    } catch (err) {
                        app.toast(err.message, 'error');
                        projectTitle.textContent = currentTitle;
                    }
                }
                input.replaceWith(projectTitle);
            };

            input.addEventListener('blur', save);
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    input.blur();
                }
            });
        });

        // Toggle Thinking
        thinkingToggle.addEventListener('click', () => {
            thinkingContainer.classList.toggle('hidden');
            thinkingArrow.classList.toggle('-rotate-180');
        });

        // Initialize State
        let fullMarkdown = '';
        let thinkingText = '';
        let isDone = false;

        // Check Cache
        const cached = API.cache.get(projectId, 'research');
        if (cached && cached.content) {
            fullMarkdown = cached.content;
            reportContent.innerHTML = marked.parse(fullMarkdown);
            renderBlueprints(fullMarkdown, cached.isComplete);

            if (cached.isComplete) {
                isDone = true;
                statusBadge.className = "px-4 py-2 rounded-lg bg-emerald-500/5 text-emerald-400 border border-emerald-500/20 flex items-center gap-3 font-mono text-xs";
                statusBadge.innerHTML = `<i class="ri-check-double-line"></i><span>ANALYSIS_RESTORED</span>`;
            } else {
                // Show Resume Button
                statusBadge.className = "px-4 py-2 rounded-lg bg-orange-500/5 text-orange-400 border border-orange-500/20 flex items-center gap-3 font-mono text-xs cursor-pointer hover:bg-orange-500/10 transition-colors";
                statusBadge.innerHTML = `<i class="ri-play-circle-line text-lg"></i><span>CONNECTION_INTERRUPTED_//_RESUME?</span>`;
                statusBadge.onclick = () => {
                    startStream(fullMarkdown);
                    statusBadge.onclick = null; // Prevent double click
                };
            }
        } else {
            // Start fresh
            startStream();
        }

        function startStream(existingText = '') {
            statusBadge.className = "px-4 py-2 rounded-lg bg-yellow-500/5 text-yellow-500 border border-yellow-500/20 flex items-center gap-3 font-mono text-xs";
            statusBadge.innerHTML = `
                <span class="relative flex h-2 w-2">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                </span>
                <span>${existingText ? 'RESUMING_LINK...' : 'INITIALIZING_AGENT_SWARM...'}</span>
            `;

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

                        // Attempt to extract and render blueprints
                        renderBlueprints(fullMarkdown);
                    }
                    else if (data.type === 'phase') {
                        if (data.content === 'analysis') {
                            statusBadge.className = "px-4 py-2 rounded-lg bg-blue-500/5 text-blue-400 border border-blue-500/20 flex items-center gap-3 font-mono text-xs";
                            statusBadge.innerHTML = `<i class="ri-file-text-line"></i><span>GENERATING_REPORT_MATRIX...</span>`;
                        }
                    }
                },
                (data) => {
                    isDone = true;
                    statusBadge.className = "px-4 py-2 rounded-lg bg-emerald-500/5 text-emerald-400 border border-emerald-500/20 flex items-center gap-3 font-mono text-xs";
                    statusBadge.innerHTML = `<i class="ri-check-double-line"></i><span>ANALYSIS_COMPLETE</span>`;
                    renderBlueprints(fullMarkdown, true); // Final pass
                },
                (err) => {
                    console.error(err);
                    if (!isDone) {
                        statusBadge.className = "px-4 py-2 rounded-lg bg-red-500/5 text-red-400 border border-red-500/20 flex items-center gap-3 font-mono text-xs cursor-pointer hover:bg-orange-500/10";
                        statusBadge.innerHTML = `<i class="ri-error-warning-line"></i><span>STREAM_LOST_//_RETRY?</span>`;
                        app.toast('Stream interrupted', 'error');
                        statusBadge.onclick = () => {
                            startStream(fullMarkdown);
                            statusBadge.onclick = null;
                        };
                    }
                },
                existingText
            );
        }

        // Helper to extract blueprints
        function renderBlueprints(markdown, final = false) {
            const blueprintRegex = /##\s*Blueprint\s*:\s*(.*?)\n([\s\S]*?)(?=##\s*Blueprint|$)/gi;
            const matches = [...markdown.matchAll(blueprintRegex)];

            if (matches.length > 0) {
                blueprintsContainer.innerHTML = '';
                matches.forEach((match, index) => {
                    let title = match[1].trim().replace(/\*\*/g, '').replace(/##/g, '').trim();
                    const content = match[2].trim();

                    let description = 'System Generated';
                    const taglineMatch = content.match(/\*\*Tagline\*\*:\s*(.*)/i) || content.match(/Tagline:\s*(.*)/i);
                    const problemMatch = content.match(/\*\*Problem\*\*:\s*(.*)/i) || content.match(/Problem:\s*(.*)/i);

                    if (taglineMatch) description = taglineMatch[1].trim();
                    else if (problemMatch) description = problemMatch[1].trim();

                    const card = document.createElement('div');
                    card.className = "group relative p-[1px] rounded-xl bg-gradient-to-br from-white/10 to-transparent hover:from-flux-500/50 hover:to-cyan-500/50 transition-all duration-300 cursor-pointer mb-4";

                    card.innerHTML = `
                        <div class="bg-gray-900/90 backdrop-blur rounded-xl p-5 relative overflow-hidden group-hover:bg-gray-900/80 transition-colors">
                            <!-- Technical Grid Background -->
                            <div class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-20"></div>
                            
                            <div class="flex justify-between items-start mb-3 relative z-10">
                                 <h4 class="font-bold text-white group-hover:text-cyan-400 transition-colors tracking-tight">${title}</h4>
                                 <span class="font-mono text-[10px] text-gray-500 border border-white/10 px-1.5 py-0.5 rounded bg-black/40">BP_0${index + 1}</span>
                            </div>
                            
                            <p class="text-xs text-gray-400 line-clamp-3 mb-4 leading-relaxed relative z-10">${description}</p>
                            
                            <div class="flex items-center justify-between mt-auto pt-3 border-t border-white/5 relative z-10">
                                <span class="text-[10px] text-gray-600 font-mono">CONFIDENCE: HIGH</span>
                                <button class="flex items-center gap-1 text-xs font-bold text-flux-400 group-hover:text-flux-300 transition-colors">
                                    SELECT <i class="ri-arrow-right-line"></i>
                                </button>
                            </div>
                        </div>
                    `;

                    card.addEventListener('click', async () => {
                        if (!confirm(`Initialize implementation sequence for "${title}"?`)) return;

                        try {
                            await API.selectBlueprint(projectId, index);
                            window.location.hash = `/project/${projectId}/planning`;
                        } catch (err) {
                            app.toast(err.message, 'error');
                        }
                    });

                    blueprintsContainer.appendChild(card);
                });
            } else if (final && (blueprintsContainer.children.length === 0 || blueprintsContainer.innerHTML.includes('Awaiting'))) {
                const debugSnippet = markdown.substring(0, 100).replace(/</g, '&lt;');
                blueprintsContainer.innerHTML = `
                    <div class="p-4 rounded border border-red-500/20 bg-red-500/5 text-center text-red-400 text-xs font-mono">
                        <i class="ri-error-warning-line text-xl mb-2 block"></i>
                        PARSING_ERROR: NO_BLUEPRINTS_DETECTED
                        <div class="mt-2 text-[10px] text-gray-500 text-left bg-black/30 p-2 rounded border border-red-900/30 overflow-hidden text-clip whitespace-nowrap">
                            ${debugSnippet}...
                        </div>
                    </div>
                `;
            }
        }
    }
};
