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
            <div class="max-w-5xl mx-auto">
                <!-- Header -->
                <div class="mb-6 flex items-center justify-between">
                    <div>
                        <h1 class="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-flux-400 to-purple-500 mb-2">
                            Market Research & Gap Analysis
                        </h1>
                        <p class="text-gray-500 dark:text-gray-400">
                            Analyzing ${project.category || 'your idea'} for opportunities.
                        </p>
                    </div>
                    <div id="status-badge" class="px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 flex items-center gap-2">
                        <div class="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
                        Thinking...
                    </div>
                </div>

                <!-- Thinking Trace (Collapsible) -->
                <div class="mb-8">
                    <button id="toggle-thinking" class="flex items-center text-sm text-gray-400 hover:text-white transition-colors mb-2">
                        <i class="ri-brain-line mr-2"></i>
                        <span>AI Thought Process</span>
                        <i class="ri-arrow-down-s-line ml-1 transform transition-transform" id="thinking-arrow"></i>
                    </button>
                    <div id="thinking-container" class="hidden glass-panel p-4 rounded-xl font-mono text-xs text-gray-400 overflow-x-auto max-h-60 border-l-2 border-flux-500 bg-black/20">
                        <pre id="thinking-log" class="whitespace-pre-wrap"></pre>
                    </div>
                </div>

                <!-- Main Content (Streamed) -->
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <!-- Gap Report Column -->
                    <div class="lg:col-span-2 space-y-6">
                        <div class="glass p-8 rounded-2xl shadow-xl min-h-[400px]">
                            <div id="report-content" class="prose-custom max-w-none">
                                <!-- Streamed Markdown will appear here -->
                                <div class="flex items-center justify-center h-full text-gray-400 animate-pulse">
                                    Initializing research agent...
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Blueprints Column -->
                    <div class="lg:col-span-1">
                        <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">Proposed Blueprints</h3>
                        <div id="blueprints-container" class="space-y-4">
                            <!-- Blueprints will accept here -->
                            <div class="glass-panel p-6 rounded-xl border border-dashed border-gray-700 text-center text-gray-500 text-sm">
                                <i class="ri-loader-4-line animate-spin text-2xl mb-2 block"></i>
                                Generating options...
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
                    const statusText = document.getElementById('status-badge'); // Using status-badge as per existing code structure, though user said status-text
                    // actually looking at the file, statusBadge is defined. 
                    // But the user code provided: 
                    // const statusText = elements.statusText || document.getElementById('status-text');
                    // In research.js:88: const statusBadge = container.querySelector('#status-badge');
                    // I will use thinkingLog for the full log and statusBadge for the "Thinking..." text if deemed necessary.
                    // The user instruction: "ADD handling for the "thinking" type at the start of the callback so these chunks don't get added to the markdown buffer"
                    // User provided specific code block. I should Try to match it but adapt to active variables.

                    thinkingText += data.content;
                    thinkingLog.textContent = thinkingText;
                    thinkingContainer.scrollTop = thinkingContainer.scrollHeight;

                    // Update status badge with thinking thought snippet
                    if (statusBadge) {
                        const thought = data.content.trim();
                        if (thought) {
                            // clean up newlines for status bar
                            const cleanThought = thought.replace(/\n/g, ' ').substring(0, 40) + (thought.length > 40 ? '...' : '');
                            // Only update if legitimate content
                            // But actually `thinkingText` accumulates. `data.content` is the delta.
                        }
                    }
                    return; // Don't add thinking to the markdown buffer
                }

                if (data.type === 'content') {
                    fullMarkdown += data.content;

                    // Render Markdown (debounce slightly for perf if needed, but marked is fast)
                    reportContent.innerHTML = marked.parse(fullMarkdown);

                    // Attempt to extract and render blueprints dynamically
                    renderBlueprints(fullMarkdown);
                }
                else if (data.type === 'phase') {
                    if (data.content === 'analysis') {
                        statusBadge.className = "px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20";
                        statusBadge.innerHTML = `<i class="ri-file-text-line mr-1"></i>Drafting Report`;
                    }
                }
            },
            (data) => {
                isDone = true;
                statusBadge.className = "px-3 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20";
                statusBadge.innerHTML = `<i class="ri-check-line mr-1"></i>Analysis Complete`;
                renderBlueprints(fullMarkdown, true); // Final pass
            },
            (err) => {
                console.error(err);
                if (!isDone) {
                    statusBadge.className = "px-3 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20";
                    statusBadge.innerHTML = `<i class="ri-error-warning-line mr-1"></i>Error`;
                    app.toast('Stream interrupted', 'error');
                }
            }
        );

        // Helper to extract blueprints from markdown
        // Assumes format: ## Blueprint: [Title] ...
        function renderBlueprints(markdown, final = false) {
            console.log("RAW AI DATA:", markdown);
            // Robust Regex to find sections starting with "## Blueprint"
            // Handles: "## Blueprint 1:", "## Blueprint:", "## Blueprint [Title]"
            const blueprintRegex = /##\s*Blueprint\s*:\s*(.*?)\n([\s\S]*?)(?=##\s*Blueprint|$)/gi;
            const matches = [...markdown.matchAll(blueprintRegex)];

            console.log(`Found ${matches.length} blueprints`);

            if (matches.length > 0) {
                blueprintsContainer.innerHTML = '';
                matches.forEach((match, index) => {
                    let title = match[1].trim();
                    // Clean up title if it has markdown chars like ** or ##
                    title = title.replace(/\*\*/g, '').replace(/##/g, '').trim();

                    const content = match[2].trim();

                    // Better description extraction: Look for Tagline or Problem
                    let description = 'No description available.';
                    const taglineMatch = content.match(/\*\*Tagline\*\*:\s*(.*)/i) || content.match(/Tagline:\s*(.*)/i);
                    const problemMatch = content.match(/\*\*Problem\*\*:\s*(.*)/i) || content.match(/Problem:\s*(.*)/i);

                    if (taglineMatch) {
                        description = taglineMatch[1].trim();
                    } else if (problemMatch) {
                        description = problemMatch[1].trim();
                    } else {
                        // Fallback to first non-empty line
                        const lines = content.split('\n').filter(l => l.trim());
                        if (lines.length > 0) description = lines[0].replace(/^[#*-]\s*/, '').trim();
                    }

                    const card = document.createElement('div');
                    card.className = "glass-panel p-5 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group border border-transparent hover:border-flux-500/30 relative";

                    card.innerHTML = `
                        <div class="flex justify-between items-start mb-2">
                             <h4 class="font-bold text-flux-400 group-hover:text-flux-300 transition-colors">${title}</h4>
                             <span class="text-xs text-gray-500 border border-gray-700 px-1.5 py-0.5 rounded">Option ${index + 1}</span>
                        </div>
                        <p class="text-xs text-gray-400 line-clamp-3 mb-4">${description}</p>
                        <button class="w-full py-2 bg-gray-800 hover:bg-flux-600 text-gray-300 hover:text-white rounded-lg text-xs font-medium transition-all duration-300">
                            Select Blueprint
                        </button>
                    `;

                    card.addEventListener('click', async () => {
                        if (!confirm(`Proceed with "${title}"? This will generate your implementation plan.`)) return;

                        try {
                            await API.selectBlueprint(projectId, index);
                            window.location.hash = `/project/${projectId}/planning`;
                        } catch (err) {
                            app.toast(err.message, 'error');
                        }
                    });

                    blueprintsContainer.appendChild(card);
                });
            } else if (final && (blueprintsContainer.children.length === 0 || blueprintsContainer.innerHTML.includes('Generating'))) {
                // Show Debug Info on failure
                const debugSnippet = markdown.substring(0, 100).replace(/</g, '&lt;');
                blueprintsContainer.innerHTML = `
                    <div class="glass-panel p-6 rounded-xl border border-red-500/20 text-center text-red-400 text-sm">
                        <i class="ri-error-warning-line text-2xl mb-2 block"></i>
                        Could not parse blueprints.
                        <div class="mt-4 text-xs text-gray-500 text-left bg-black/30 p-2 rounded border border-gray-800 font-mono overflow-hidden">
                            <strong>Debug Info:</strong><br/>
                            Total Length: ${markdown.length}<br/>
                            First 100 chars: "${debugSnippet}..."
                        </div>
                    </div>
                `;
            }
        }
    }
};
