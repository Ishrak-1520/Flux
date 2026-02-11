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
                <div class="w-full md:w-64 bg-slate-950/50 border-r border-white/5 flex-shrink-0 flex flex-col">
                    <div class="p-6 border-b border-white/5">
                        <div class="text-xs font-mono text-gray-500 uppercase mb-2">Target</div>
                        <div class="flex items-center justify-between group cursor-pointer" id="project-title-header">
                            <h2 class="text-sm font-bold text-white truncate pr-2 hover:text-cyan-400 transition-colors" title="Click to rename">${project.title}</h2>
                            <i class="ri-edit-2-line text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"></i>
                        </div>
                    </div>
                    
                    <nav class="flex-1 p-4 space-y-1">
                        <button class="w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 text-sm font-medium transition-all doc-tab active" data-doc="roadmap">
                            <i class="ri-map-pin-2-line text-flux-500"></i>
                            <span class="text-gray-300">Roadmap</span>
                        </button>
                        <button class="w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 text-sm font-medium transition-all doc-tab" data-doc="prd">
                            <i class="ri-file-list-3-line text-gray-500"></i>
                            <span class="text-gray-400">PRD</span>
                        </button>
                        <button class="w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 text-sm font-medium transition-all doc-tab" data-doc="srs">
                            <i class="ri-book-2-line text-gray-500"></i>
                            <span class="text-gray-400">SRS</span>
                        </button>
                        <button class="w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 text-sm font-medium transition-all doc-tab" data-doc="cursorrules">
                            <i class="ri-code-s-slash-line text-gray-500"></i>
                            <span class="text-gray-400">.cursorrules</span>
                        </button>
                    </nav>



                    <div class="p-4 border-t border-white/5 space-y-2">
                        <button id="btn-build-arch" class="flex items-center justify-center gap-2 w-full py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-green-900/20">
                            <i class="ri-hammer-line"></i> Build This Architecture
                        </button>
                         <a href="#/project/${projectId}/export" class="flex items-center justify-center gap-2 w-full py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-xs font-medium transition-colors border border-white/5">
                            <i class="ri-download-cloud-line"></i> Export Assets
                        </a>
                    </div>
                </div>

                <!-- Main Content -->
                <div class="flex-1 flex flex-col min-w-0 bg-slate-900/30">
                    <div class="flex-1 overflow-y-auto p-8 relative">
                         <!-- Toolbar -->
                         <div class="absolute top-4 right-8 flex gap-2 z-10">
                            <button id="regen-btn" class="p-2 rounded-lg bg-white/5 border border-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors" title="Regenerate">
                                <i class="ri-refresh-line"></i>
                            </button>
                            <button id="copy-btn" class="p-2 rounded-lg bg-white/5 border border-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors" title="Copy to Clipboard">
                                <i class="ri-file-copy-line"></i>
                            </button>
                         </div>

                         <!-- Content Area -->
                         <div class="max-w-4xl mx-auto">
                             <div id="doc-header" class="mb-8 pb-4 border-b border-white/5">
                                <h1 class="text-3xl font-bold text-white mb-2" id="doc-title">Implementation Roadmap</h1>
                                <p class="text-sm text-gray-500 font-mono" id="doc-status">STATUS: SYNC_COMPLETE</p>
                             </div>
                             
                             <div id="doc-content" class="prose prose-invert prose-headings:font-sans prose-code:font-mono prose-pre:bg-black/30 max-w-none text-sm text-gray-300">
                                <div class="flex flex-col items-center justify-center py-20 text-gray-500 animate-pulse">
                                    <i class="ri-loader-4-line text-3xl mb-4 spinning"></i>
                                    <span class="font-mono text-xs uppercase tracking-widest">Constructing_Matrix...</span>
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
        const docTitles = {
            'roadmap': 'Implementation Roadmap',
            'prd': 'Product Requirements Docs',
            'srs': 'Software Requirements Spec',
            'cursorrules': 'Cursor Context Rules'
        };

        // --- Start of Task 3 Rename Logic ---
        titleHeader.addEventListener('click', () => {
            const h2 = titleHeader.querySelector('h2');
            const currentTitle = h2.textContent;

            // Swap to input
            titleHeader.innerHTML = `
                <input type="text" id="rename-input" class="w-full bg-slate-900 text-white border border-flux-500 rounded px-2 py-1 text-sm focus:outline-none" value="${currentTitle}">
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
                            <h2 class="text-sm font-bold text-white truncate pr-2 hover:text-cyan-400 transition-colors" title="Click to rename">${newTitle}</h2>
                            <i class="ri-edit-2-line text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"></i>
                        `;
                    } catch (err) {
                        app.toast(err.message, 'error');
                        // Revert
                        titleHeader.innerHTML = `
                            <h2 class="text-sm font-bold text-white truncate pr-2 hover:text-cyan-400 transition-colors" title="Click to rename">${currentTitle}</h2>
                            <i class="ri-edit-2-line text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"></i>
                        `;
                    }
                } else {
                    // Revert
                    titleHeader.innerHTML = `
                        <h2 class="text-sm font-bold text-white truncate pr-2 hover:text-cyan-400 transition-colors" title="Click to rename">${currentTitle}</h2>
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
                    window.location.hash = `#/project/${projectId}/forge`;
                    return;
                }

                console.log("🚀 Bridging to Forge...", window.currentBlueprints);
                localStorage.setItem('forge_blueprint', JSON.stringify(window.currentBlueprints));
                window.location.hash = `#/project/${projectId}/forge`;
            });
        }


        // Start Stream
        startStream('roadmap', docContent, true);

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

                // Load or Stream
                if (docCache[type]) {
                    renderContent(docCache[type], type);
                } else {
                    startStream(type, docContent, type !== 'cursorrules');
                }
            });
        });

        // Toolbar Actions
        container.querySelector('#regen-btn').addEventListener('click', () => {
            if (confirm("Regenerate this document?")) {
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
            } else {
                docContent.innerHTML = marked.parse(content);
                // Style tables and lists
                docContent.querySelectorAll('table').forEach(t => t.classList.add('w-full', 'border-collapse', 'my-4', 'text-sm'));
                docContent.querySelectorAll('th').forEach(t => t.classList.add('text-left', 'p-2', 'border-b', 'border-white/10', 'text-gray-400', 'font-mono', 'uppercase', 'text-xs'));
                docContent.querySelectorAll('td').forEach(t => t.classList.add('p-2', 'border-b', 'border-white/5', 'text-gray-300'));
                docContent.querySelectorAll('input[type="checkbox"]').forEach(c => c.classList.add('accent-flux-500', 'mr-2', 'h-4', 'w-4', 'bg-slate-800', 'border-gray-600', 'rounded'));

                // Visual Intelligence: Render Mermaid Diagrams with Entity Decoding
                setTimeout(async () => {
                    // Select all mermaid blocks (usually <code class="language-mermaid">)
                    const mermaidBlocks = docContent.querySelectorAll('pre code.language-mermaid');

                    for (const block of mermaidBlocks) {
                        try {
                            // 1. Get raw text
                            let graphDefinition = block.textContent;

                            // 2. CRITICAL: Decode HTML entities (e.g., converts 'A &gt; B' back to 'A > B')
                            const txt = document.createElement("textarea");
                            txt.innerHTML = graphDefinition;
                            graphDefinition = txt.value;

                            // 3. Create container
                            const newDiv = document.createElement('div');
                            newDiv.className = 'mermaid bg-black/20 rounded-lg p-4 my-6 overflow-x-auto text-center border border-white/5';
                            newDiv.textContent = graphDefinition;

                            // 4. Swap DOM elements
                            const preElement = block.parentElement; // The <pre> tag
                            if (preElement && preElement.tagName === 'PRE') {
                                preElement.replaceWith(newDiv);
                            } else {
                                block.replaceWith(newDiv);
                            }
                        } catch (err) {
                            console.warn("Mermaid Prep Error:", err);
                        }
                    }

                    // 5. Run Mermaid safely
                    if (window.mermaid) {
                        try {
                            await window.mermaid.run({
                                querySelector: '.mermaid'
                            });
                        } catch (err) {
                            console.error("Mermaid Render Failed:", err);
                            // Mark failed blocks visually so user knows
                            docContent.querySelectorAll('.mermaid[data-processed!="true"]').forEach(el => {
                                el.innerHTML = `<div class="text-red-500 text-xs font-mono p-2 border border-red-500/30 bg-red-500/10 rounded">Diagram Render Error (Syntax)</div>`;
                            });
                        }
                    }
                }, 100);
            }
        }

        function startStream(docType, targetEl, renderMarkdown) {
            let content = '';

            API.streamDoc(
                projectId,
                docType,
                (data) => {
                    if (data.type === 'content') {
                        content += data.content;
                        if (renderMarkdown) {
                            targetEl.innerHTML = marked.parse(content);
                        } else {
                            targetEl.textContent = content;
                        }
                    }
                },
                (data) => {
                    docCache[docType] = content;
                    renderContent(content, docType);
                },
                (err) => {
                    console.error(err);
                    targetEl.innerHTML = `<div class="p-4 rounded border border-red-500/20 bg-red-500/5 text-red-400 text-xs font-mono">Stream Error: ${err.message}</div>`;
                }
            );
        }

        // --- Refinement Toolbar Logic ---

        // 1. Inject Toolbar HTML (if not exists)
        if (!document.getElementById('refine-toolbar')) {
            const toolbarHTML = `
                <div id="refine-toolbar" class="hidden absolute z-50 bg-gray-900 border border-purple-500/30 shadow-2xl rounded-lg p-2 flex gap-2 items-center animate-fade-in transition-all">
                    <input type="text" id="refine-input" placeholder="How should I change this?" class="bg-black/50 text-white text-xs px-2 py-1 rounded border border-white/10 w-48 focus:outline-none focus:border-purple-500 transition-colors">
                    <button id="btn-refine-go" class="text-purple-400 hover:text-white p-1 hover:bg-purple-500/20 rounded cursor-pointer transition-colors">
                        <i class="ri-magic-line"></i>
                    </button>
                    <button id="btn-refine-close" class="text-gray-500 hover:text-white p-1 hover:bg-white/10 rounded cursor-pointer transition-colors ml-1">
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
