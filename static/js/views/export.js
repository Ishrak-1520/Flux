/**
 * Export View
 * Download generated assets.
 */

import { API } from '../api.js';
import app from '../app.js';

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

        // We assume docs are already generated. If not, we might need to fetch them.
        // The project object from API (enriched) contains `docs` array.
        const docs = project.docs || [];
        const getDocContent = (type) => docs.find(d => d.doc_type === type)?.content || '';

        container.innerHTML = `
            <div class="max-w-4xl mx-auto">
                <div class="mb-10 text-center">
                    <h1 class="text-3xl font-bold text-white mb-2">Project Assets</h1>
                    <p class="text-gray-400">Download your blueprint and get started.</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    ${renderAssetCard('Product Requirements (PRD)', 'prd', 'ri-file-list-3-line', 'markdown', getDocContent('prd'))}
                    ${renderAssetCard('Software Requirements (SRS)', 'srs', 'ri-file-code-line', 'markdown', getDocContent('srs'))}
                    ${renderAssetCard('Cursor Rules (.json)', 'cursorrules', 'ri-code-s-slash-line', 'json', getDocContent('cursorrules'))}
                    ${renderAssetCard('Implementation Roadmap', 'roadmap', 'ri-map-2-line', 'markdown', getDocContent('roadmap'))}
                </div>

                <div class="mt-12 text-center">
                    <a href="#/dashboard" class="text-flux-500 hover:text-white transition-colors">
                        &larr; Back to Dashboard
                    </a>
                </div>
            </div>
        `;

        function renderAssetCard(title, type, icon, format, content) {
            const isEmpty = !content;

            return `
                <div class="glass-panel p-6 rounded-xl border border-white/5 hover:border-flux-500/50 transition-colors flex items-center justify-between group">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 rounded-lg bg-gray-800 flex items-center justify-center text-flux-500">
                            <i class="${icon} text-xl"></i>
                        </div>
                        <div>
                            <h3 class="font-bold text-gray-200">${title}</h3>
                            <p class="text-xs text-gray-500 uppercase tracking-wider">${format}</p>
                        </div>
                    </div>
                    
                    <div>
                        <button 
                            class="download-btn w-10 h-10 rounded-full bg-white/5 hover:bg-flux-500 hover:text-white text-gray-400 flex items-center justify-center transition-all ${isEmpty ? 'opacity-50 cursor-not-allowed' : ''}"
                            data-type="${type}"
                            data-filename="flux_${type}.${format === 'json' ? 'json' : 'md'}"
                            ${isEmpty ? 'disabled' : ''}
                            title="${isEmpty ? 'Not generated' : 'Download'}"
                        >
                            <i class="ri-download-line"></i>
                        </button>
                    </div>
                </div>
            `;
        }

        // Download Handler
        container.querySelectorAll('.download-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.type;
                const filename = btn.dataset.filename;
                const content = getDocContent(type);

                if (content) {
                    downloadFile(filename, content);
                    app.toast(`Downloaded ${filename}`, 'success');
                }
            });
        });

        function downloadFile(filename, content) {
            const blob = new Blob([content], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        }
    }
};
