// static/js/utils/storage.js

const FluxStorage = {
    /**
     * Extracts the Project ID from the current URL path.
     * Supports formats like /project/123/research or /project/123
     */
    getProjectId: () => {
        const path = window.location.hash || window.location.pathname;
        // Support hash-based routing: #/project/123/research
        const hashMatch = path.match(/#\/project\/(\d+)/);
        if (hashMatch) return hashMatch[1];

        // Support path-based routing: /project/123/research
        const pathMatch = path.match(/\/project\/(\d+)/);
        return pathMatch ? pathMatch[1] : null;
    },

    /**
     * Generates a unique key for the current project.
     * Example: 'planning_docs' -> 'flux_project_123_planning_docs'
     */
    getKey: (keyName) => {
        const projectId = FluxStorage.getProjectId();
        if (!projectId) {
            console.warn("FluxStorage: No Project ID found in URL. Using temp storage.");
            return `flux_temp_${keyName}`;
        }
        return `flux_project_${projectId}_${keyName}`;
    },

    /**
     * Save data to project-scoped storage.
     */
    save: (keyName, data) => {
        const uniqueKey = FluxStorage.getKey(keyName);
        localStorage.setItem(uniqueKey, JSON.stringify(data));
        console.log(`💾 Saved to ${uniqueKey}`);
    },

    /**
     * Load data from project-scoped storage.
     */
    load: (keyName) => {
        const uniqueKey = FluxStorage.getKey(keyName);
        const data = localStorage.getItem(uniqueKey);
        if (data) {
            console.log(`📂 Loaded from ${uniqueKey}`);
        }
        return data ? JSON.parse(data) : null;
    },

    /**
     * Clear data from project-scoped storage.
     */
    clear: (keyName) => {
        const uniqueKey = FluxStorage.getKey(keyName);
        localStorage.removeItem(uniqueKey);
        console.log(`🗑️ Cleared ${uniqueKey}`);
    },

    /**
     * Clear all data for the current project.
     */
    clearProject: () => {
        const projectId = FluxStorage.getProjectId();
        if (!projectId) return;

        const prefix = `flux_project_${projectId}_`;
        const keysToRemove = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(prefix)) {
                keysToRemove.push(key);
            }
        }

        keysToRemove.forEach(key => localStorage.removeItem(key));
        console.log(`🗑️ Cleared ${keysToRemove.length} keys for project ${projectId}`);
    }
};

// Expose to window for easy access
window.FluxStorage = FluxStorage;
