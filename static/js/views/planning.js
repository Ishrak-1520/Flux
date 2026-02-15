/**
 * Planning View
 * Displays implementation roadmap and generates docs.
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

        // --- Data Prep for Bridge ---
        try {
            if (project.research && project.research.blueprints) {
                const parsed = JSON.parse(project.research.blueprints);

                // Handle both {blueprints: [...]} and [...] formats
                const blueprintsList = Array.isArray(parsed) ? parsed : (parsed.blueprints || []);

                const selectedIdx = project.selected_blueprint || 0;
                window.currentBlueprints = blueprintsList[selectedIdx] || blueprintsList[0];

                // Augment with project title context
                if (window.currentBlueprints) {
                    window.currentBlueprints.project_name = project.title;
                }

            }
        } catch (e) {
            console.error("Failed to parse blueprints for bridge", e);
        }

        container.innerHTML = `
            <div class="h-[calc(100vh-80px)] flex flex-col md:flex-row max-w-[1920px] mx-auto">
            <!-- Sidebar -->
            <div class="w-full md:w-64 bg-bg-sidebar border-r border-border-light flex-shrink-0 flex flex-col">
                <div class="p-6 border-b border-border-light">
                    <div class="text-xs font-mono text-text-muted uppercase mb-2">Target</div>
                    <div class="flex items-center justify-between group cursor-pointer" id="project-title-header">
                        <h2 class="text-sm font-bold text-text-primary truncate pr-2 hover:text-accent transition-colors" title="Click to rename">${project.title}</h2>
                        <i class="ri-edit-2-line text-text-muted opacity-0 group-hover:opacity-100 transition-opacity"></i>
                    </div>
                </div>

                <nav class="flex-1 p-4 space-y-1">
                    <button class="w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 text-sm font-medium transition-all doc-tab active" data-doc="roadmap">
                        <i class="ri-map-pin-2-line text-accent"></i>
                        <span class="text-text-primary">Roadmap</span>
                    </button>
                    <button class="w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 text-sm font-medium transition-all doc-tab" data-doc="prd">
                        <i class="ri-file-list-3-line text-text-muted"></i>
                        <span class="text-text-secondary">PRD</span>
                    </button>
                    <button class="w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 text-sm font-medium transition-all doc-tab" data-doc="srs">
                        <i class="ri-book-2-line text-text-muted"></i>
                        <span class="text-text-secondary">SRS</span>
                    </button>
                    <button class="w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 text-sm font-medium transition-all doc-tab" data-doc="cursorrules">
                        <i class="ri-robot-line text-text-muted"></i>
                        <span class="text-text-secondary">AI Instructions</span>
                    </button>
                </nav>

                <div class="p-4 border-t border-border-light space-y-2">
                    <button id="btn-build-arch" class="btn-primary w-full flex items-center justify-center gap-2 text-xs">
                        <i class="ri-magic-line"></i> Send to Code Generator
                    </button>
                    <a href="#/project/${projectId}/export" class="btn-secondary w-full flex items-center justify-center gap-2 text-xs">
                        <i class="ri-download-cloud-line"></i> Export Assets
                    </a>
                </div>
            </div>

            <!-- Main Content -->
            <div class="flex-1 flex flex-col min-w-0 bg-bg-main">
                <div class="flex-1 overflow-y-auto p-8 relative">
                    <!-- Toolbar -->
                    <div class="absolute top-4 right-8 flex gap-2 z-10">
                        <button id="view-toggle-btn" class="p-2 rounded-lg bg-bg-card border border-border-light text-text-muted hover:text-text-primary hover:bg-bg-sidebar transition-colors" title="Toggle View">
                            <i class="ri-layout-grid-line" id="icon-kanban"></i>
                            <i class="ri-list-check-2 hidden" id="icon-list"></i>
                        </button>
                        <button id="regen-btn" class="p-2 rounded-lg bg-bg-card border border-border-light text-text-muted hover:text-text-primary hover:bg-bg-sidebar transition-colors" title="Regenerate">
                            <i class="ri-refresh-line"></i>
                        </button>
                        <button id="copy-btn" class="p-2 rounded-lg bg-bg-card border border-border-light text-text-muted hover:text-text-primary hover:bg-bg-sidebar transition-colors" title="Copy to Clipboard">
                            <i class="ri-file-copy-line"></i>
                        </button>
                    </div>

                    <!-- Content Area -->
                    <div class="max-w-4xl mx-auto">
                        <div id="doc-header" class="mb-8 pb-4 border-b border-border-light">
                            <h1 class="text-3xl font-serif font-bold text-text-primary mb-2" id="doc-title">Improvement Ideas</h1>
                            <p class="text-sm text-text-muted font-mono" id="doc-status">STATUS: SYNC_COMPLETE</p>
                        </div>

                        <div id="doc-content" class="prose-custom max-w-none text-text-secondary">
                            <div class="flex flex-col items-center justify-center py-20 text-text-muted animate-pulse">
                                <i class="ri-loader-4-line text-3xl mb-4 spinning"></i>
                                <span class="font-mono text-xs uppercase tracking-widest text-accent">Constructing_Matrix...</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;

        const docTitle = container.querySelector('#doc-title');
        const docContent = container.querySelector('#doc-content');
        const docTabs = container.querySelectorAll('.doc-tab');
        const titleHeader = container.querySelector('#project-title-header');

        let activeDoc = 'roadmap';
        const docCache = {};
        let viewMode = 'list'; // 'list' or 'kanban' (Moved up to fix initialization error)

        const docTitles = {
            'roadmap': 'Improvement Ideas',
            'prd': 'Product Plan (PRD)',
            'srs': 'Step-by-Step Logic (SRS)',
            'cursorrules': 'AI Instructions (.cursorrules)'
        };

        // Initialize State with LocalStorage
        let localDocCache = {};

        // Initialize Mermaid
        if (window.mermaid) {
            window.mermaid.initialize({
                startOnLoad: false,
                theme: 'base',
                securityLevel: 'loose',
                themeVariables: {
                    primaryColor: '#D97757',
                    edgeLabelBackground: '#131316',
                    tertiaryColor: '#1C1C21',
                    mainBkg: '#1C1C21',
                    nodeBkg: '#1C1C21',
                    nodeBorder: '#2E2E33',
                    labelBoxBkg: '#0f0f12',
                    labelBoxBorder: '#2E2E33',
                    lineColor: '#4B5563',
                    textColor: '#EDEDED'
                }
            });
        }

        const renderer = new marked.Renderer();
        const originalCodeRenderer = renderer.code.bind(renderer);

        renderer.code = function (code, language) {
            if (language && language.trim().toLowerCase() === 'mermaid') {
                const id = 'mermaid-' + Math.random().toString(36).substr(2, 9);
                return `<div class="mermaid" id="${id}">${code}</div>`;
            }
            return originalCodeRenderer(code, language);
        };

        marked.use({ renderer: renderer });

        /**
         * Post-processes the DOM to convert code blocks into Mermaid diagrams.
         * Handles both explicitly tagged blocks and implicit detection.
         * Theme-aware: adapts colors based on light/dark mode.
         */
        async function processMermaidDiagrams() {
            // 1. Detect current theme
            const isDark = document.documentElement.classList.contains('dark');

            if (!window.mermaid) {
                console.warn("Mermaid.js not loaded");
                return;
            }

            // 2. Define theme-specific color palettes
            const themeConfig = {
                startOnLoad: false,
                theme: 'base',
                securityLevel: 'loose',
                themeVariables: isDark ? {
                    // DARK MODE (Claude Code Style)
                    darkMode: true,
                    background: '#1C1C21',
                    primaryColor: '#D97757',        // Terracotta accent
                    primaryTextColor: '#EDEDED',    // White text
                    primaryBorderColor: '#D97757',
                    lineColor: '#9CA3AF',           // Light gray lines
                    secondaryColor: '#252525',
                    tertiaryColor: '#1a1a1a',
                    mainBkg: '#1C1C21',
                    nodeBkg: '#1C1C21',
                    nodeBorder: '#2E2E33',
                    edgeLabelBackground: '#131316',
                    labelBoxBkg: '#0f0f12',
                    labelBoxBorder: '#2E2E33',
                    textColor: '#EDEDED'
                } : {
                    // LIGHT MODE (Perplexity Comet Style)
                    darkMode: false,
                    background: '#ffffff',
                    primaryColor: '#20808D',        // Teal accent
                    primaryTextColor: '#171717',    // Black text
                    primaryBorderColor: '#20808D',
                    lineColor: '#525252',           // Dark gray lines
                    secondaryColor: '#f3f3f3',
                    tertiaryColor: '#ffffff',
                    mainBkg: '#f9f9f9',
                    nodeBkg: '#f9f9f9',
                    nodeBorder: '#e0e0e0',
                    edgeLabelBackground: '#ffffff',
                    labelBoxBkg: '#f3f3f3',
                    labelBoxBorder: '#e0e0e0',
                    textColor: '#191919'
                }
            };

            // 3. Re-initialize Mermaid with theme-aware config
            window.mermaid.initialize(themeConfig);

            // 4. Find all code blocks that might be diagrams
            const codeBlocks = document.querySelectorAll('pre code');

            codeBlocks.forEach((codeBlock) => {
                const text = codeBlock.textContent.trim();
                const parentPre = codeBlock.parentElement;

                // Check if it's explicitly marked as mermaid OR looks like mermaid syntax
                const isMermaid = codeBlock.classList.contains('language-mermaid') ||
                    text.startsWith('graph ') ||
                    text.startsWith('sequenceDiagram') ||
                    text.startsWith('gantt') ||
                    text.startsWith('classDiagram') ||
                    text.startsWith('stateDiagram') ||
                    text.startsWith('erDiagram') ||
                    text.startsWith('journey') ||
                    text.startsWith('pie') ||
                    text.startsWith('flowchart');

                if (isMermaid && parentPre) {
                    // Create the replacement div
                    const mermaidDiv = document.createElement('div');
                    mermaidDiv.classList.add('mermaid');
                    mermaidDiv.textContent = text;
                    // Store original code for re-rendering
                    mermaidDiv.setAttribute('data-original-code', text);

                    // Replace the <pre> block entirely
                    parentPre.replaceWith(mermaidDiv);
                }
            });

            // 5. Handle existing .mermaid divs (for re-rendering on theme change)
            const existingDiagrams = document.querySelectorAll('.mermaid');
            existingDiagrams.forEach(el => {
                // If already rendered (has SVG), reset for re-render
                if (el.querySelector('svg')) {
                    const originalCode = el.getAttribute('data-original-code') || el.textContent;
                    el.innerHTML = originalCode;
                    el.removeAttribute('data-processed');
                } else if (!el.hasAttribute('data-original-code')) {
                    // Save code for future re-renders
                    el.setAttribute('data-original-code', el.textContent);
                }
            });

            // 6. Trigger the render
            try {
                const diagrams = document.querySelectorAll('.mermaid');
                if (diagrams.length > 0) {
                    await window.mermaid.run({
                        querySelector: '.mermaid'
                    });
                }
            } catch (err) {
                console.error("Mermaid Render Error:", err);
                // Show error for broken diagrams
                document.querySelectorAll('.mermaid').forEach(el => {
                    if (!el.querySelector('svg')) {
                        el.innerHTML = `<div class="p-4 bg-error/10 border border-error/20 text-error rounded-xl">
                            <p class="font-bold text-xs mb-2">⚠️ Diagram Syntax Error</p>
                            <pre class="text-xs overflow-auto bg-bg-main p-2 rounded mt-2">${el.textContent}</pre>
                        </div>`;
                    }
                });
            }
        }

        // Expose function globally for theme toggle re-rendering
        window.processMermaidDiagrams = processMermaidDiagrams;

        try {
            const savedDocs = localStorage.getItem('flux_planning_docs');
            if (savedDocs) {
                localDocCache = JSON.parse(savedDocs);
                // Merge with default cache if needed, though simple assignment works here
                app.toast('Restored previous plan', 'success');
            }
        } catch (e) {
            console.error("Failed to restore docs", e);
        }

        // Initialize docCache with restored values or empty strings
        Object.keys(docTitles).forEach(key => {
            docCache[key] = localDocCache[key] || '';
        });

        // View Toggle Logic
        const viewToggleBtn = container.querySelector('#view-toggle-btn');
        const iconKanban = container.querySelector('#icon-kanban');
        const iconList = container.querySelector('#icon-list');

        if (viewToggleBtn) {
            viewToggleBtn.addEventListener('click', () => {
                viewMode = viewMode === 'list' ? 'kanban' : 'list';

                // Toggle icons
                if (viewMode === 'kanban') {
                    iconKanban.classList.add('hidden');
                    iconList.classList.remove('hidden');
                    viewToggleBtn.title = "Switch to List View";
                } else {
                    iconKanban.classList.remove('hidden');
                    iconList.classList.add('hidden');
                    viewToggleBtn.title = "Switch to Board View";
                }

                // Re-render
                if (docCache['roadmap']) {
                    renderContent(docCache['roadmap'], 'roadmap');
                }
            });
        }


        // --- Start of Task 3 Rename Logic ---
        titleHeader.addEventListener('click', () => {
            const h2 = titleHeader.querySelector('h2');
            const currentTitle = h2.textContent;

            // Swap to input
            titleHeader.innerHTML = `
            < input type = "text" id = "rename-input" class="w-full bg-slate-900 text-white border border-flux-500 rounded px-2 py-1 text-sm focus:outline-none" value = "${currentTitle}" >
                `;
            const input = titleHeader.querySelector('input');
            input.focus();

            const saveTitle = async () => {
                const newTitle = input.value.trim();
                if (newTitle && newTitle !== currentTitle) {
                    try {
                        await API.updateProjectTitle(projectId, newTitle);
                        app.toast('Project renamed', 'success');
                        // Restore UI with new title
                        titleHeader.innerHTML = `
                < h2 class="text-sm font-bold text-white truncate pr-2 hover:text-cyan-400 transition-colors" title = "Click to rename" > ${newTitle}</h2 >
                    <i class="ri-edit-2-line text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"></i>
        `;
                    } catch (err) {
                        app.toast(err.message, 'error');
                        // Revert
                        titleHeader.innerHTML = `
            < h2 class="text-sm font-bold text-white truncate pr-2 hover:text-cyan-400 transition-colors" title = "Click to rename" > ${currentTitle}</h2 >
                <i class="ri-edit-2-line text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"></i>
        `;
                    }
                } else {
                    // Revert
                    titleHeader.innerHTML = `
            < h2 class="text-sm font-bold text-white truncate pr-2 hover:text-cyan-400 transition-colors" title = "Click to rename" > ${currentTitle}</h2 >
                <i class="ri-edit-2-line text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"></i>
        `;
                }
                // re-attach listener (since we replaced innerHTML)
                // Actually this pattern of replacing innerHTML disconnects the listener on `titleHeader` if we aren't careful.
                // titleHeader is the container. Listeners are valid? No, `innerHTML` wipes children but not the container itself.
                // So the container listener might fire again? 
                // Wait, clicking input triggers container click? Yes.
                // We need to stop propagation on the input click.
                const newInput = titleHeader.querySelector('input');
                if (newInput) {
                    // Prevent click on input from triggering the "switch to edit" again
                    newInput.addEventListener('click', (e) => e.stopPropagation());
                    newInput.addEventListener('blur', saveTitle);
                    newInput.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter') {
                            newInput.blur();
                        }
                    });
                }
            };

            input.addEventListener('click', (e) => e.stopPropagation());
            input.addEventListener('blur', saveTitle);
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    input.blur();
                }
            });
        });
        // --- End of Task 3 Rename Logic ---


        // --- Build Architecture Bridge ---
        const btnBuild = container.querySelector('#btn-build-arch');
        if (btnBuild) {
            btnBuild.addEventListener('click', () => {
                if (!window.currentBlueprints) {
                    app.toast("No blueprint data available. Please regenerate research.", "warning");
                    // Fallback redirect
                    window.location.hash = `# / project / ${projectId}/forge`;
                    return;
                }

                console.log("🚀 Bridging to Forge...", window.currentBlueprints);
                localStorage.setItem('forge_blueprint', JSON.stringify(window.currentBlueprints));
                window.location.hash = `#/project/${projectId}/forge`;
            });
        }


        // Start Stream
        // Start Stream or Render Cache
        if (docCache[activeDoc]) {
            renderContent(docCache[activeDoc], activeDoc);
            // Manually activate first tab style if needed (it is by default in HTML usually)
        } else {
            startStream('roadmap', docContent, true);
        }

        // Tab Handler
        docTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const type = tab.dataset.doc;
                if (type === activeDoc) return;

                // Update UI
                docTabs.forEach(t => {
                    t.classList.remove('active', 'bg-slate-800', 'text-white', 'shadow-sm');
                    t.classList.add('text-gray-400', 'hover:text-gray-200');
                    // Remove icons color
                    const icon = t.querySelector('i');
                    if (icon) icon.className = icon.className.replace('text-flux-500', 'text-gray-500');
                });

                // Active Styles
                tab.classList.add('active', 'bg-slate-800', 'text-white', 'shadow-sm');
                tab.classList.remove('text-gray-400', 'hover:text-gray-200');

                const icon = tab.querySelector('i');
                if (icon) icon.className = icon.className.replace('text-gray-500', 'text-flux-500');

                activeDoc = type;
                docTitle.textContent = docTitles[type];
                docContent.innerHTML = `<div class="flex flex-col items-center justify-center py-20 text-gray-500 animate-pulse">
                                            <i class="ri-loader-4-line text-3xl mb-4 spinning"></i>
                                            <span class="font-mono text-xs uppercase tracking-widest">Retrieving_Data...</span>
                                        </div>`;

                // Check Cache
                if (docCache[type]) {
                    renderContent(docCache[type], type);
                } else {
                    // Start Stream
                    startStream(type, docContent, true);
                }
            });
        });

        // ─── Kanban Board Functions ──────────────────────────────────

        /**
         * Parse markdown roadmap into structured Kanban data
         */
        function parseRoadmapToKanban(markdownText) {
            const lines = markdownText.split('\n');
            const phases = [];
            let currentPhase = null;
            let currentTask = null;

            for (const line of lines) {
                // Match phase headers: ## Phase Name
                const phaseMatch = line.match(/^##\s+(.+)/);
                if (phaseMatch) {
                    const phaseName = phaseMatch[1].trim();
                    currentPhase = {
                        name: phaseName,
                        tasks: []
                    };
                    phases.push(currentPhase);
                    currentTask = null;
                    continue;
                }

                // Match main tasks: - [ ] Task or - [x] Task
                const taskMatch = line.match(/^[-*]\s+\[([ x])\]\s+(.+)/);
                if (taskMatch && currentPhase) {
                    currentTask = {
                        done: taskMatch[1] === 'x',
                        text: taskMatch[2].trim(),
                        subtasks: []
                    };
                    currentPhase.tasks.push(currentTask);
                    continue;
                }

                // Match subtasks: spaces/tabs then - [ ] or - [x]
                const subtaskMatch = line.match(/^\s+[-*]\s+\[([ x])\]\s+(.+)/);
                if (subtaskMatch && currentTask) {
                    currentTask.subtasks.push({
                        done: subtaskMatch[1] === 'x',
                        text: subtaskMatch[2].trim()
                    });
                }
            }

            return phases;
        }

        /**
         * Render a single task card
         */
        function renderTaskCard(task) {
            const statusConfig = task.done
                ? { color: 'emerald-500', bg: 'bg-emerald-500/10', text: 'emerald-500', label: 'Done' }
                : { color: 'var(--accent-main)', bg: 'bg-accent/10', text: 'text-accent', label: 'To Do' };

            const completedSubtasks = task.subtasks.filter(st => st.done).length;
            const totalSubtasks = task.subtasks.length;

            return `
                <div class="task-card bg-bg-card p-4 rounded-xl border border-border-light hover:border-accent/40 transition-all group">
                    <!-- Status and Drag Handle -->
                    <div class="flex items-center justify-between mb-3">
                        <span class="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusConfig.bg} ${statusConfig.text} border border-current opacity-80">
                            ${statusConfig.label}
                        </span>
                        <i class="ri-drag-move-line text-text-muted opacity-0 group-hover:opacity-100 transition-opacity"></i>
                    </div>
                    
                    <!-- Task Text -->
                    <div class="text-sm text-text-primary leading-relaxed font-medium">
                        ${task.text}
                    </div>
                    
                    <!-- Subtasks Progress -->
                    ${totalSubtasks > 0 ? `
                        <div class="mt-3 pt-3 border-t border-border-light flex items-center justify-between text-xs">
                            <span class="text-text-muted font-mono">${completedSubtasks}/${totalSubtasks}</span>
                            <div class="flex-1 mx-3 h-1 bg-bg-sidebar rounded-full overflow-hidden">
                                <div class="h-full bg-accent transition-all" style="width: ${(completedSubtasks / totalSubtasks) * 100}%"></div>
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;
        }

        /**
         * Render complete Kanban board
         */
        function renderKanbanBoard(phases) {
            if (!phases || phases.length === 0) {
                return `
                    <div class="flex items-center justify-center py-20 text-text-muted">
                        <div class="text-center">
                            <i class="ri-layout-grid-line text-4xl mb-3 opacity-30"></i>
                            <p class="text-sm font-serif">No phases found in roadmap</p>
                        </div>
                    </div>
                `;
            }

            return `
                <div class="kanban-container overflow-x-auto pb-6 -mx-4">
                    <div class="flex gap-6 min-w-max px-4">
                        ${phases.map(phase => {
                const completedTasks = phase.tasks.filter(t => t.done).length;
                const totalTasks = phase.tasks.length;
                const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

                return `
                                <div class="phase-column w-80 flex-shrink-0">
                                    <!-- Phase Header -->
                                    <div class="bg-bg-sidebar p-4 rounded-t-2xl border-x border-t border-border-light sticky top-0 z-10">
                                        <h3 class="text-sm font-bold text-text-primary mb-2 font-serif uppercase tracking-wider">${phase.name}</h3>
                                        <div class="flex items-center gap-2">
                                            <div class="flex-1 h-1.5 bg-bg-card rounded-full overflow-hidden border border-border-light">
                                                <div class="h-full bg-accent transition-all" style="width: ${progress}%"></div>
                                            </div>
                                            <span class="text-[10px] text-text-muted font-mono font-bold">${completedTasks}/${totalTasks}</span>
                                        </div>
                                    </div>
                                    
                                    <!--Task Cards-- >
                    <div class="task-list space-y-3 p-4 bg-bg-main border border-border-light border-t-0 rounded-b-2xl min-h-[400px]">
                        ${phase.tasks.map(task => renderTaskCard(task)).join('')}
                        ${totalTasks === 0 ? `
                                            <div class="empty-state text-center py-12">
                                                <i class="ri-rocket-2-line text-6xl text-accent/20 mb-4 block"></i>
                                                <p class="text-text-muted text-xs font-medium">No tasks in this phase</p>
                                            </div>
                                        ` : ''}
                    </div>
                                </div >
                    `;
            }).join('')}
                    </div>
                </div>
            `;
        }

        // ─── Toolbar Actions ─────────────────────────────────────────

        // Toolbar Actions
        container.querySelector('#regen-btn').addEventListener('click', async () => {
            const confirmed = await window.fluxModal.confirm(
                "Regenerate Document?",
                "Are you sure you want to regenerate this part of the plan? This will overwrite existing content.",
                "Regenerate"
            );

            if (confirmed) {
                docContent.innerHTML = '<div class="loader mx-auto mt-20 border-white/20"></div>';
                startStream(activeDoc, docContent, activeDoc !== 'cursorrules');
            }
        });

        container.querySelector('#copy-btn').addEventListener('click', () => {
            if (docCache[activeDoc]) {
                navigator.clipboard.writeText(docCache[activeDoc]);
                app.toast('Copied to clipboard', 'success');
            }
        });

        function renderContent(content, type) {
            if (type === 'cursorrules') {
                docContent.innerHTML = `<pre class="font-mono text-xs text-green-400 bg-black/40 p-4 rounded-lg border border-white/5 overflow-x-auto">${content}</pre>`;
            } else if (type === 'roadmap' && viewMode === 'kanban') {
                // Kanban view for roadmap
                const phases = parseRoadmapToKanban(content);
                docContent.innerHTML = renderKanbanBoard(phases);
            } else {
                docContent.innerHTML = marked.parse(content);

                // Style tables and lists
                docContent.querySelectorAll('table').forEach(t => t.classList.add('w-full', 'border-collapse', 'my-4', 'text-sm'));
                docContent.querySelectorAll('th').forEach(t => t.classList.add('text-left', 'p-2', 'border-b', 'border-white/10', 'text-gray-400', 'font-mono', 'uppercase', 'text-xs'));
                docContent.querySelectorAll('td').forEach(t => t.classList.add('p-2', 'border-b', 'border-white/5', 'text-gray-300'));
                docContent.querySelectorAll('input[type="checkbox"]').forEach(c => c.classList.add('accent-flux-500', 'mr-2', 'h-4', 'w-4', 'bg-slate-800', 'border-gray-600', 'rounded'));

                // Process Mermaid Diagrams (with delay to ensure DOM is ready)
                setTimeout(() => {
                    processMermaidDiagrams();
                }, 100);
            }
        }
        function startStream(docType, targetEl, renderMarkdown) {
            let content = '';

            // Get Context (The Fix)
            const contextData = window.currentBlueprints || {};

            API.streamDoc(
                projectId,
                docType,
                contextData,
                (data) => {
                    if (data.type === 'content') {
                        content += data.content;
                        if (renderMarkdown) {
                            // Re-parse with the new renderer
                            targetEl.innerHTML = marked.parse(content);
                        } else {
                            targetEl.textContent = content;
                        }
                    }
                },
                (data) => {
                    docCache[docType] = content;

                    // Save to LocalStorage
                    localStorage.setItem('flux_planning_docs', JSON.stringify(docCache));

                    renderContent(content, docType);

                    // Trigger Diagram rendering on final content
                    setTimeout(() => {
                        if (window.processMermaidDiagrams) {
                            window.processMermaidDiagrams();
                        }
                    }, 100);
                },
                (err) => {
                    console.error(err);
                    targetEl.innerHTML = `<div class="p-4 rounded border border-accent/20 bg-bg-card text-text-muted text-xs font-mono">Stream Error: ${err.message}</div>`;
                }
            );
        }

        // --- Refinement Toolbar Logic ---

        // 1. Inject Toolbar HTML (if not exists)
        if (!document.getElementById('refine-toolbar')) {
            const toolbarHTML = `
                <div id="refine-toolbar" class="hidden absolute z-50 bg-bg-card border border-accent/30 shadow-2xl rounded-lg p-2 flex gap-2 items-center animate-fade-in transition-all">
                    <input type="text" id="refine-input" placeholder="Refine architecture..." class="bg-bg-sidebar text-text-primary text-xs px-2 py-1 rounded border border-border-light w-48 focus:outline-none focus:border-accent transition-colors">
                    <button id="btn-refine-go" class="text-accent hover:bg-accent/10 p-1 rounded cursor-pointer transition-colors">
                        <i class="ri-magic-line"></i>
                    </button>
                    <button id="btn-refine-close" class="text-text-muted hover:text-text-primary p-1 hover:bg-bg-sidebar rounded cursor-pointer transition-colors ml-1">
                        <i class="ri-close-line"></i>
                    </button>
                </div>
            `;
            // Append to body to ensure it floats above everything
            document.body.insertAdjacentHTML('beforeend', toolbarHTML);
        }

        const toolbar = document.getElementById('refine-toolbar');
        const refineInput = document.getElementById('refine-input');
        const refineBtn = document.getElementById('btn-refine-go');
        const closeBtn = document.getElementById('btn-refine-close');
        let currentRange = null;

        // Hide toolbar
        const hideToolbar = () => {
            toolbar.classList.add('hidden');
            refineInput.value = '';
        };

        closeBtn.onclick = hideToolbar;

        // selection change handler
        document.addEventListener('mouseup', (e) => {
            // If clicking inside toolbar, ignore
            if (toolbar.contains(e.target)) return;

            const selection = window.getSelection();
            const text = selection.toString().trim();

            // Check if selection is inside doc-content
            if (!text || !docContent.contains(selection.anchorNode)) {
                hideToolbar();
                return;
            }

            // Save range
            currentRange = selection.getRangeAt(0);
            const rect = currentRange.getBoundingClientRect();

            // Position toolbar
            toolbar.style.top = `${rect.top + window.scrollY - 50}px`;
            toolbar.style.left = `${rect.left + window.scrollX}px`;
            toolbar.classList.remove('hidden');
            refineInput.focus();
        });

        // Refine Action
        refineBtn.onclick = async () => {
            const instruction = refineInput.value.trim();
            if (!instruction || !currentRange) return;

            const selectedText = currentRange.toString();

            // Visual Feedback
            hideToolbar();

            // Create a wrapper for visual feedback
            const span = document.createElement('span');
            span.className = "bg-purple-900/40 animate-pulse text-gray-200 px-1 rounded";
            span.textContent = "✨ Refining: " + selectedText;

            currentRange.deleteContents();
            currentRange.insertNode(span);

            try {
                // Determine context (simplified: just grab whole doc text or surrounding)
                const fullContext = docContent.innerText;

                const res = await fetch('/api/refine', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(localStorage.getItem('flux_token') ? { 'Authorization': 'Bearer ' + localStorage.getItem('flux_token') } : {})
                    },
                    body: JSON.stringify({
                        selection: selectedText,
                        instruction: instruction,
                        context: fullContext
                    })
                });

                if (!res.ok) throw new Error("Refine failed");

                const data = await res.json();

                // Replace with new text (parsed as markdown/html)
                // We use a temporary container to parse the markdown string into nodes
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = marked.parseInline(data.refined_text); // use parseInline for standard text

                // Replace the loader span with new nodes
                span.replaceWith(...tempDiv.childNodes);

                app.toast('Text refined successfully', 'success');

            } catch (err) {
                console.error(err);
                // Revert
                span.replaceWith(document.createTextNode(selectedText));
                app.toast('Refinement failed', 'error');
            }
        };

        // Allow Enter key to submit
        refineInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') refineBtn.click();
        });

    }
};
