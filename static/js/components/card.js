/**
 * Project Card Component
 * Renders a single project card for the dashboard.
 */

export default {
    render(project) {
        const div = document.createElement('div');
        div.className = "glass-panel p-6 rounded-xl hover:shadow-lg hover:shadow-flux-500/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer group relative overflow-hidden";

        const statusColors = {
            'ideation': 'bg-gray-500',
            'research': 'bg-blue-500',
            'planning': 'bg-purple-500',
            'complete': 'bg-green-500'
        };

        const statusLabel = {
            'ideation': 'Ideation',
            'research': 'Researching',
            'planning': 'Planning',
            'complete': 'Completed'
        };

        div.innerHTML = `
            <div class="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button class="delete-btn p-1.5 rounded-full hover:bg-red-500/10 text-red-500 transition-colors" title="Delete Project">
                    <i class="ri-delete-bin-line"></i>
                </button>
            </div>

            <div class="flex items-start justify-between mb-4">
                <div class="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 p-3 rounded-lg shadow-inner">
                    <i class="ri-lightbulb-flash-line text-xl text-flux-500"></i>
                </div>
                <span class="px-2 py-1 rounded-full text-xs font-medium ${statusColors[project.status]} text-white shadow-sm">
                    ${statusLabel[project.status]}
                </span>
            </div>
            
            <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-1 group-hover:text-flux-500 transition-colors">
                ${project.title}
            </h3>
            
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">
                ${project.original_prompt || 'No description provided.'}
            </p>
            
            <div class="flex items-center text-xs text-gray-400 mt-auto">
                <i class="ri-time-line mr-1"></i>
                <span>${new Date(project.updated_at).toLocaleDateString()}</span>
                ${project.category ? `<span class="mx-2">•</span><span>${project.category}</span>` : ''}
            </div>
        `;

        // Click handler (navigate to latest state)
        div.addEventListener('click', (e) => {
            if (e.target.closest('.delete-btn')) return;

            // Determine where to go based on status
            let route = `/project/${project.id}/ideation`; // default
            if (project.status === 'research') route = `/project/${project.id}/research`;
            if (project.status === 'planning' || project.status === 'complete') route = `/project/${project.id}/planning`;

            window.location.hash = route;
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
                div.style.opacity = '0';
                div.style.transform = 'scale(0.9)';
                setTimeout(() => {
                    div.dispatchEvent(new CustomEvent('delete-project', { detail: project.id, bubbles: true }));
                }, 200);
            }
        });

        return div;
    }
};
