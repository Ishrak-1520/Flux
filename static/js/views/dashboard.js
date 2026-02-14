/**
 * Dashboard View ("The Vault")
 * Displays a grid of user projects.
 */

import { API } from '../api.js';
import app from '../app.js';

// Internal helper for rendering cards with "Flux" styling
const renderCard = (project) => {
    const div = document.createElement('div');
    div.className = "group relative p-[1px] rounded-2xl bg-gradient-to-b from-white/10 to-transparent hover:from-flux-500/50 hover:to-cyan-400/50 transition-all duration-500 cursor-pointer overflow-hidden";

    const statusColors = {
        'ideation': 'text-gray-400 border-gray-700 bg-gray-500/10',
        'research': 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
        'planning': 'text-violet-400 border-violet-500/30 bg-violet-500/10',
        'complete': 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
    };

    const statusLabel = {
        'ideation': 'Ideation',
        'research': 'Researching',
        'planning': 'Planning',
        'complete': 'Completed'
    };

    div.innerHTML = `
        <div class="relative h-full bg-slate-950/90 backdrop-blur-xl rounded-2xl p-6 transition-all duration-300 group-hover:bg-slate-900/90">
            <!-- Glow Effect -->
            <div class="absolute -top-20 -right-20 w-40 h-40 bg-flux-500/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            <!-- Header -->
            <div class="flex items-start justify-between mb-6 relative z-10">
                <div class="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-flux-500/30 group-hover:text-flux-400 transition-colors">
                    <i class="ri-code-s-slash-line text-xl opacity-70 group-hover:opacity-100"></i>
                </div>
                
                <span class="px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-mono border ${statusColors[project.status]}">
                    ${statusLabel[project.status]}
                </span>
            </div>
            
            <!-- Content -->
            <div class="relative z-10 mb-6">
                <!-- Title & Edit Container -->
                <div class="flex items-center justify-between mb-2 group/title">
                    <h3 class="text-xl font-bold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-300 transition-all truncate pr-2 project-title">
                        ${project.title}
                    </h3>
                     <button class="edit-btn opacity-0 group-hover/title:opacity-100 text-gray-500 hover:text-white transition-opacity p-1" title="Rename">
                        <i class="ri-edit-2-line"></i>
                    </button>
                </div>
                
                <p class="text-sm text-gray-500 line-clamp-2 h-10 group-hover:text-gray-400">
                    ${project.original_prompt || 'No description provided.'}
                </p>
            </div>
            
            <!-- Footer -->
            <div class="flex items-center justify-between text-xs text-gray-600 font-mono relative z-10 pt-4 border-t border-white/5 group-hover:border-white/10">
                <div class="flex items-center gap-2">
                    <i class="ri-time-line"></i>
                    <span>${new Date(project.updated_at).toLocaleDateString()}</span>
                </div>
                ${project.category ? `<span class="px-2 py-0.5 rounded bg-white/5 text-gray-400 border border-white/5">${project.category}</span>` : ''}
            </div>

            <!-- Hover Overlay Actions -->
            <div class="absolute inset-0 bg-black/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-3 z-20 translate-y-4 group-hover:translate-y-0 action-overlay">
                <button class="open-btn px-6 py-2 bg-white text-black rounded-full text-sm font-bold hover:scale-105 transition-transform">
                    Open Project
                </button>
                <button class="delete-btn text-red-400 text-xs hover:text-red-300 flex items-center gap-1 mt-2">
                    <i class="ri-delete-bin-line"></i> Delete
                </button>
            </div>
        </div>
    `;

    // Click handler (Main Card)
    const openAction = () => {
        let route = `/project/${project.id}/setup`; // New projects go to setup wizard
        if (project.status === 'research') route = `/project/${project.id}/research`;
        if (project.status === 'planning' || project.status === 'complete') route = `/project/${project.id}/planning`;
        window.location.hash = route;
    };

    div.querySelector('.open-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        openAction();
    });

    div.addEventListener('click', (e) => {
        // Ignore if clicking buttons or inputs
        if (!e.target.closest('button') && !e.target.closest('input')) {
            openAction();
        }
    });

    // Rename Logic
    const editBtn = div.querySelector('.edit-btn');
    const titleEl = div.querySelector('.project-title');
    const titleContainer = titleEl.parentElement;

    editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        // Swap to input
        const currentTitle = titleEl.textContent.trim();
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentTitle;
        input.className = "w-full bg-slate-900 text-white border border-flux-500 rounded px-2 py-1 text-sm focus:outline-none z-30 relative";

        // Hide title and button, show input
        titleEl.style.display = 'none';
        editBtn.style.display = 'none';
        titleContainer.insertBefore(input, titleEl);
        input.focus();

        // Save on blur or enter
        const save = async () => {
            const newTitle = input.value.trim();
            if (newTitle && newTitle !== currentTitle) {
                try {
                    await API.updateProjectTitle(project.id, newTitle);
                    titleEl.textContent = newTitle;
                    app.toast('Project renamed', 'success');
                } catch (err) {
                    app.toast(err.message, 'error');
                }
            }
            // Cleanup
            input.remove();
            titleEl.style.display = '';
            editBtn.style.display = '';
        };

        input.addEventListener('blur', save);
        input.addEventListener('click', (ev) => ev.stopPropagation()); // Prevent card click
        input.addEventListener('keydown', (ev) => {
            if (ev.key === 'Enter') {
                input.blur();
            }
        });
    });


    // Delete handler
    div.querySelector('.delete-btn').addEventListener('click', async (e) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this project?')) {
            // Visual exit
            div.style.opacity = '0';
            div.style.transform = 'scale(0.9)';
            setTimeout(() => {
                div.dispatchEvent(new CustomEvent('delete-project', { detail: project.id, bubbles: true }));
            }, 300);
        }
    });

    return div;
};

export default {
    async mount(container) {
        container.innerHTML = `
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div class="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 class="text-4xl font-bold text-white mb-2 tracking-tight">The Vault</h1>
                        <p class="text-gray-400 text-lg">Manage your active blueprints and archives.</p>
                    </div>
                    <button id="new-project-btn" class="group relative px-6 py-3 rounded-xl bg-white text-black font-semibold shadow-lg shadow-white/5 hover:shadow-white/20 hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
                        <div class="absolute inset-0 bg-gradient-to-r from-violet-200 to-cyan-200 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <span class="relative flex items-center gap-2">
                            <i class="ri-add-line text-lg"></i>
                            <span>New Project</span>
                        </span>
                    </button>
                </div>

                <!-- Project Grid -->
                <div id="project-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <!-- Loading State -->
                    <div class="col-span-full py-32 flex flex-col items-center justify-center text-gray-500 animate-pulse">
                        <i class="ri-loader-4-line text-4xl mb-4 spinning"></i>
                        <p class="font-mono text-sm uppercase tracking-widest">Initializing Vault...</p>
                    </div>
                </div>

                <!-- Empty State (hidden by default) -->
                <div id="empty-state" class="hidden empty-state flex-col items-center justify-center py-32 text-center rounded-3xl border border-dashed border-white/10 bg-white/5">
                    <div class="relative w-32 h-32 mb-8">
                        <div class="absolute inset-0 bg-violet-500/20 rounded-full blur-2xl animate-pulse"></div>
                        <i class="ri-rocket-2-line text-8xl text-violet-500/40 relative z-10"></i>
                    </div>
                    <h3 class="text-2xl font-bold text-white mb-3">Launch Your First Project</h3>
                    <p class="text-gray-400 mb-8 max-w-md mx-auto leading-relaxed">Transform your vision into reality. Start by creating a new project and let Flux guide you through the entire development journey.</p>
                    
                    <button id="empty-new-btn" class="px-8 py-3 rounded-lg bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white transition-all text-sm font-semibold shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40 hover:scale-105">
                        <i class="ri-add-line mr-2"></i>Create New Project
                    </button>
                </div>
            </div>
        `;

        const grid = container.querySelector('#project-grid');
        const emptyState = container.querySelector('#empty-state');

        // New Project Handler
        const goToSetup = async () => {
            try {
                const project = await API.createProject({ title: "New Project", original_prompt: "" });
                window.location.hash = `/project/${project.id}/setup`; // Redirect to setup wizard
            } catch (err) {
                app.toast(err.message, 'error');
            }
        };

        container.querySelector('#new-project-btn').addEventListener('click', goToSetup);
        container.querySelector('#empty-new-btn').addEventListener('click', goToSetup);

        // Load Projects
        try {
            const projects = await API.getProjects();
            grid.innerHTML = '';

            if (projects.length === 0) {
                emptyState.classList.remove('hidden');
                grid.classList.add('hidden');
            } else {
                emptyState.classList.add('hidden');
                grid.classList.remove('hidden');
                projects.forEach(project => {
                    const card = renderCard(project);
                    grid.appendChild(card);
                });
            }

            // Listen for delete events bubbling up
            grid.addEventListener('delete-project', async (e) => {
                const projectId = e.detail;
                try {
                    await API.deleteProject(projectId);
                    app.toast('Project deleted from vault', 'success');

                    // Reload
                    const remaining = await API.getProjects();
                    if (remaining.length === 0) {
                        grid.innerHTML = '';
                        emptyState.classList.remove('hidden');
                        grid.classList.add('hidden');
                    } else {
                        grid.innerHTML = '';
                        remaining.forEach(p => grid.appendChild(renderCard(p)));
                    }
                } catch (err) {
                    app.toast('Failed to delete project', 'error');
                }
            });

        } catch (err) {
            grid.innerHTML = `
                <div class="col-span-full p-8 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-center">
                    <i class="ri-error-warning-line text-3xl mb-2 block"></i>
                    <p>System Failure: ${err.message}</p>
                </div>`;
        }
    }
};
