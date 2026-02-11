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

        container.innerHTML = `
            <div class="max-w-6xl mx-auto h-[calc(100vh-140px)] flex flex-col">
                <!-- Header -->
                <div class="flex-none mb-6 flex items-center justify-between">
                    <div>
                        <h1 class="text-2xl font-bold text-white mb-1">
                            Implementation Plan
                        </h1>
                        <p class="text-sm text-gray-400">
                            ${project.title}
                        </p>
                    </div>
                    <div class="flex gap-3">
                        <a href="#/project/${projectId}/export" class="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm transition-colors">
                            <i class="ri-download-line mr-1"></i> Export Assets
                        </a>
                    </div>
                </div>

                <!-- Main Layout -->
                <div class="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                    
                    <!-- Left: Roadmap (Streamed) -->
                    <div class="flex flex-col glass rounded-2xl overflow-hidden shadow-xl">
                        <div class="p-4 border-b border-gray-700 bg-black/10 flex justify-between items-center">
                            <h3 class="font-bold text-gray-200">
                                <i class="ri-map-pin-line mr-2 text-flux-500"></i>Roadmap
                            </h3>
                            <button id="regen-roadmap" class="text-xs text-gray-400 hover:text-white">
                                <i class="ri-refresh-line"></i> Regenerate
                            </button>
                        </div>
                        <div id="roadmap-container" class="flex-grow overflow-y-auto p-6 prose-custom text-sm">
                            <div class="text-center text-gray-500 mt-20">
                                <div class="loader mx-auto mb-4 border-gray-600"></div>
                                Building your roadmap...
                            </div>
                        </div>
                    </div>

                    <!-- Right: Docs Visualization -->
                    <div class="flex flex-col glass rounded-2xl overflow-hidden shadow-xl">
                         <div class="border-b border-gray-700 bg-black/10 flex">
                            <button class="doc-tab active flex-1 py-3 text-sm font-medium text-flux-400 border-b-2 border-flux-500 bg-white/5" data-doc="prd">PRD</button>
                            <button class="doc-tab flex-1 py-3 text-sm font-medium text-gray-400 hover:text-gray-200" data-doc="srs">SRS</button>
                            <button class="doc-tab flex-1 py-3 text-sm font-medium text-gray-400 hover:text-gray-200" data-doc="cursorrules">.cursorrules</button>
                        </div>
                        <div id="doc-content" class="flex-grow overflow-y-auto p-6 font-mono text-xs bg-gray-900/50 text-gray-300 whitespace-pre-wrap">
                            <span class="text-gray-500">Select a document type to generate/view...</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const roadmapContainer = container.querySelector('#roadmap-container');
        const docContent = container.querySelector('#doc-content');
        const docTabs = container.querySelectorAll('.doc-tab');

        let activeDoc = 'prd';
        const docCache = {}; // Cache generated docs

        // Start Roadmap Stream
        startStream('roadmap', roadmapContainer, true);

        // Start PRD Stream (default)
        startStream('prd', docContent, false);

        // Tab Handler
        docTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const type = tab.dataset.doc;
                if (type === activeDoc) return;

                // Update UI
                docTabs.forEach(t => {
                    t.classList.remove('active', 'text-flux-400', 'border-b-2', 'border-flux-500', 'bg-white/5');
                    t.classList.add('text-gray-400');
                });
                tab.classList.add('active', 'text-flux-400', 'border-b-2', 'border-flux-500', 'bg-white/5');
                tab.classList.remove('text-gray-400');

                activeDoc = type;

                // Load or Stream
                if (docCache[type]) {
                    docContent.textContent = docCache[type]; // Raw text for docs (code view)
                } else {
                    docContent.innerHTML = '<div class="loader mx-auto mt-10 border-gray-600"></div>';
                    startStream(type, docContent, false);
                }
            });
        });

        container.querySelector('#regen-roadmap').addEventListener('click', () => {
            if (confirm("Regenerate roadmap?")) {
                roadmapContainer.innerHTML = '<div class="loader mx-auto mt-20 border-gray-600"></div>';
                startStream('roadmap', roadmapContainer, true);
            }
        });

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
                            targetEl.textContent = content; // Code view style
                        }
                    }
                },
                (data) => {
                    docCache[docType] = content;
                    // If renderMarkdown, maybe add checkboxes?
                    if (renderMarkdown) {
                        // Enhance checkboxes
                        targetEl.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                            cb.classList.add('accent-flux-500', 'mr-2');
                        });
                    }
                },
                (err) => {
                    console.error(err);
                    targetEl.innerHTML = `<div class="text-red-500 p-4">Generation failed.</div>`;
                }
            );
        }
    }
};
