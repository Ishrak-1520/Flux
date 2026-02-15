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
            <div class="max-w-4xl mx-auto py-12 animate-fade-in">
                <div class="mb-12 text-center">
                    <h1 class="text-5xl font-serif font-bold text-text-primary mb-4 tracking-tight">Project Assets</h1>
                    <p class="text-text-secondary text-lg leading-relaxed">Synthesis complete. Export architectural specifications and protocols.</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    ${renderAssetCard('Product Requirements (PRD)', 'prd', 'ri-file-list-3-line', 'markdown', getDocContent('prd'))}
                    ${renderAssetCard('Software Requirements (SRS)', 'srs', 'ri-file-code-line', 'markdown', getDocContent('srs'))}
                    ${renderAssetCard('Cursor Rules (.json)', 'cursorrules', 'ri-code-s-slash-line', 'json', getDocContent('cursorrules'))}
                    ${renderAssetCard('Implementation Roadmap', 'roadmap', 'ri-map-2-line', 'markdown', getDocContent('roadmap'))}
                </div>

                <div class="mt-16 text-center">
                    <a href="#/dashboard" class="text-accent hover:text-text-primary transition-colors font-mono text-[10px] uppercase tracking-widest font-bold flex items-center justify-center gap-2 group">
                        <i class="ri-arrow-left-line group-hover:-translate-x-1 transition-transform"></i>
                        Return_to_Dashboard
                    </a>
                </div>
            </div>
        `;

        function renderAssetCard(title, type, icon, format, content) {
            const isEmpty = !content;

            return `
                <div class="bg-bg-card p-6 rounded-2xl border border-border-light hover:border-accent transition-all flex items-center justify-between group shadow-sm hover:shadow-xl">
                    <div class="flex items-center gap-5">
                        <div class="w-14 h-14 rounded-xl bg-bg-sidebar border border-border-light flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                            <i class="${icon} text-2xl"></i>
                        </div>
                        <div>
                            <h3 class="font-bold text-text-primary tracking-tight">${title}</h3>
                            <p class="text-[9px] text-text-muted uppercase tracking-[0.2em] font-bold font-mono mt-1">${format}_Specification</p>
                        </div>
                    </div>
                    
                    <div>
                        <button 
                            class="download-btn w-12 h-12 rounded-full bg-bg-sidebar border border-border-light hover:bg-accent hover:border-accent hover:text-white text-text-muted flex items-center justify-center transition-all ${isEmpty ? 'opacity-30 cursor-not-allowed' : 'shadow-sm active:scale-95'}"
                            data-type="${type}"
                            data-filename="flux_${type}.${format === 'json' ? 'json' : 'md'}"
                            ${isEmpty ? 'disabled' : ''}
                            title="${isEmpty ? 'Not generated' : 'Download Package'}"
                        >
                            <i class="ri-download-line text-xl"></i>
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
