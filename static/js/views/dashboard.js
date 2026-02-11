/**
 * Dashboard View ("The Vault")
 * Displays a grid of user projects.
 */

import { API } from '../api.js';
import Card from '../components/card.js';
import app from '../app.js';

export default {
    async mount(container) {
        container.innerHTML = `
            <div class="mb-8 flex items-center justify-between">
                <div>
                    <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">The Vault</h1>
                    <p class="text-gray-500 dark:text-gray-400">Manage your projects and blueprints.</p>
                </div>
                <button id="new-project-btn" class="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-flux-500 to-purple-600 hover:from-flux-400 hover:to-purple-500 text-white rounded-xl shadow-lg shadow-flux-500/30 transform hover:-translate-y-0.5 transition-all duration-200 font-medium">
                    <i class="ri-add-line text-lg"></i>
                    <span>New Project</span>
                </button>
            </div>

            <!-- Project Grid -->
            <div id="project-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <!-- Loading State -->
                <div class="col-span-full py-20 flex flex-col items-center justify-center text-gray-400">
                    <div class="loader mb-4 border-gray-400"></div>
                    <p>Loading your projects...</p>
                </div>
            </div>

            <!-- Empty State (hidden by default) -->
            <div id="empty-state" class="hidden text-center py-20 bg-white/5 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4 text-gray-400">
                    <i class="ri-folder-open-line text-3xl"></i>
                </div>
                <h3 class="text-xl font-medium text-gray-900 dark:text-white mb-2">No projects yet</h3>
                <p class="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">Start by creating a new project to generate your first technical blueprint.</p>
                <button id="empty-new-btn" class="text-flux-500 hover:text-flux-400 font-medium">Create your first project &rarr;</button>
            </div>
        `;

        const grid = container.querySelector('#project-grid');
        const emptyState = container.querySelector('#empty-state');

        // New Project Handler
        const goToIdeation = async () => {
            // Create a temp project or just go to a "new" route?
            // Let's create a stub since we need an ID for the URL structure often
            // Or better, just go to a create route.
            // Simplified: We'll create the project explicitly on the Ideation page submit.
            // But the Ideation page needs to know if it's editing or creating.
            // The route `/project/:id/ideation` implies an existing ID.
            // Plan: Create a "new" project entry immediately? 
            // Better: Have a specific route `/ideation/new`? 
            // app.js routes: `/project/:id/ideation`.
            // Let's stick to the plan: Click "New" -> Creates project with default title -> Redirects to ideation

            try {
                const project = await API.createProject({ title: "New Project", original_prompt: "" });
                window.location.hash = `/project/${project.id}/ideation`;
            } catch (err) {
                app.toast(err.message, 'error');
            }
        };

        container.querySelector('#new-project-btn').addEventListener('click', goToIdeation);
        container.querySelector('#empty-new-btn').addEventListener('click', goToIdeation);

        // Load Projects
        try {
            const projects = await API.getProjects();
            grid.innerHTML = '';

            if (projects.length === 0) {
                emptyState.classList.remove('hidden');
            } else {
                emptyState.classList.add('hidden');
                projects.forEach(project => {
                    const card = Card.render(project);
                    grid.appendChild(card);
                });
            }

            // Listen for delete events bubbling up
            grid.addEventListener('delete-project', async (e) => {
                const projectId = e.detail;
                try {
                    await API.deleteProject(projectId);
                    app.toast('Project deleted', 'success');
                    // Reload
                    const remaining = await API.getProjects();
                    if (remaining.length === 0) {
                        grid.innerHTML = '';
                        emptyState.classList.remove('hidden');
                    } else {
                        // Optimistic removal already happened visually in card.js? 
                        // Actually card.js just hid it. Let's re-render to be safe and clean.
                        // Or just remove the element.
                        // Re-fetching is safer to ensure sync.
                        grid.innerHTML = '';
                        remaining.forEach(p => grid.appendChild(Card.render(p)));
                    }
                } catch (err) {
                    app.toast('Failed to delete project', 'error');
                }
            });

        } catch (err) {
            grid.innerHTML = `<div class="col-span-full text-red-500 text-center">Failed to load projects: ${err.message}</div>`;
        }
    }
};
