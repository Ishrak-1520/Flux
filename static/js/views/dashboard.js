/**
 * Dashboard View ("The Vault")
 * Displays a grid of user projects.
 */

import { API } from '../api.js';
import app from '../app.js';

// Internal helper for rendering cards with "Flux" styling
const renderCard = (project) => {
    const div = document.createElement('div');
    div.className = "group relative p-[1px] rounded-2xl bg-border-light hover:border-accent transition-all duration-500 cursor-pointer overflow-hidden";

    const statusColors = {
        'ideation': 'text-text-muted border-border-light bg-bg-sidebar',
        'research': 'text-accent border-accent/30 bg-accent/10',
        'planning': 'text-accent border-accent/30 bg-accent/10',
        'complete': 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10'
    };

    const statusLabel = {
        'ideation': 'Ideation',
        'research': 'Researching',
        'planning': 'Planning',
        'complete': 'Completed'
    };

    div.innerHTML = `
        <div class="relative h-full bg-bg-card rounded-2xl p-6 transition-all duration-300 group-hover:bg-bg-main">
            <!-- Header -->
            <div class="flex items-start justify-between mb-6 relative z-10">
                <div class="w-10 h-10 rounded-lg bg-bg-sidebar border border-border-light flex items-center justify-center group-hover:border-accent group-hover:text-accent transition-colors">
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
                    <h3 class="text-xl font-bold text-text-primary transition-all truncate pr-2 project-title">
                        ${project.title}
                    </h3>
                     <button class="edit-btn opacity-0 group-hover/title:opacity-100 text-gray-500 hover:text-white transition-opacity p-1" title="Rename">
                        <i class="ri-edit-2-line"></i>
                    </button>
                </div>
                
                <p class="text-sm text-text-secondary line-clamp-2 h-10 group-hover:text-text-primary">
                    ${project.original_prompt || 'No description provided.'}
                </p>
            </div>
            
            <!-- Footer -->
            <div class="flex items-center justify-between text-xs text-text-muted font-mono relative z-10 pt-4 border-t border-border-light group-hover:border-accent/20">
                <div class="flex items-center gap-2">
                    <i class="ri-time-line"></i>
                    <span>${new Date(project.updated_at).toLocaleDateString()}</span>
                </div>
                ${project.category ? `<span class="px-2 py-0.5 rounded bg-bg-sidebar text-text-muted border border-border-light">${project.category}</span>` : ''}
            </div>

            <!-- Hover Overlay Actions -->
            <div class="absolute inset-0 bg-bg-main/80 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-3 z-20 translate-y-4 group-hover:translate-y-0 action-overlay">
                <button class="open-btn px-6 py-2 bg-accent text-white rounded-full text-sm font-bold hover:scale-105 transition-transform shadow-lg shadow-accent/20">
                    Open Project
                </button>
                <button class="delete-btn text-red-500 text-xs hover:text-red-400 font-medium flex items-center gap-1 mt-2">
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
        input.className = "w-full bg-bg-main text-text-primary border border-accent rounded px-2 py-1 text-sm focus:outline-none z-30 relative";

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
        const confirmed = await window.fluxModal.confirm(
            "Delete Project?",
            "Are you sure you want to remove this project from your Vault? This action cannot be undone.",
            "Delete",
            true // Danger mode
        );

        if (confirmed) {
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
                <div id="empty-state" class="hidden empty-state flex-col items-center justify-center py-32 text-center rounded-3xl border border-dashed border-border-light bg-bg-sidebar">
                    <div class="relative w-32 h-32 mb-8">
                        <div class="absolute inset-0 bg-accent/20 rounded-full blur-2xl animate-pulse"></div>
                        <i class="ri-rocket-2-line text-8xl text-accent relative z-10 opacity-40"></i>
                    </div>
                    <h3 class="text-2xl font-serif font-bold text-text-primary mb-3">Launch Your First Project</h3>
                    <p class="text-text-secondary mb-8 max-w-md mx-auto leading-relaxed">Transform your vision into reality. Start by creating a new project and let Flux guide you through the entire development journey.</p>
                    
                    <button id="empty-new-btn" class="btn-primary">
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
