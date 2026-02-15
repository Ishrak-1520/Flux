/**
 * Flux – Main Application
 * Handles routing, global state, and view mounting.
 */

import { API } from './api.js';

// Import Views
import AuthView from './views/auth.js';
import DashboardView from './views/dashboard.js';
import IdeationView from './views/ideation.js';
import ResearchView from './views/research.js';
import PlanningView from './views/planning.js';
import ExportView from './views/export.js';
import ForgeView from './views/forge.js';
import SetupView from './views/setup.js';

// Import Components
import Header from './components/header.js';
import HUD from './components/hud.js';

const app = {
    // Application State
    state: {
        user: null,
        currentProject: null,
        theme: localStorage.getItem('theme') || 'dark',
        zenMode: false
    },

    // Routes Definition
    routes: {
        '/login': AuthView,
        '/register': AuthView,
        '/dashboard': DashboardView,
        '/project/:id/setup': SetupView,
        '/project/:id/ideation': IdeationView,
        '/project/:id/research': ResearchView,
        '/project/:id/planning': PlanningView,
        '/project/:id/forge': ForgeView,
        '/project/:id/export': ExportView,
    },

    /**
     * Initialize Application
     */
    async init() {
        this.applyTheme();

        // check auth
        const token = API.getToken();
        if (token) {
            try {
                this.state.user = await API.getMe();
                // Mount HUD if logged in
                this.mountHUD();
            } catch (e) {
                console.log("Auth check failed", e);
            }
        }

        // Handle routing
        window.addEventListener('hashchange', () => this.handleRoute());

        // Global Keyboard Shortcuts
        window.addEventListener('keydown', (e) => {
            // Alt + Z = Zen Mode
            if (e.altKey && e.code === 'KeyZ') {
                e.preventDefault();
                this.toggleZenMode();
            }
        });

        // Listen for HUD toggle event
        window.addEventListener('flux-toggle-zen', () => {
            this.toggleZenMode();
        });

        this.handleRoute(); // Initial load
    },

    /**
     * Zen Mode Handler
     */
    toggleZenMode() {
        this.state.zenMode = !this.state.zenMode;
        this.applyZenMode();

        // Notify HUD/Components
        window.dispatchEvent(new CustomEvent('flux-zen-changed', {
            detail: { active: this.state.zenMode }
        }));

        this.toast(this.state.zenMode ? 'Zen Mode: Focus ON' : 'Zen Mode: Focus OFF', 'info');
    },

    applyZenMode() {
        const body = document.body;
        if (this.state.zenMode) {
            body.classList.add('zen-mode');
        } else {
            body.classList.remove('zen-mode');
        }
    },

    /**
     * Mount HUD
     */
    mountHUD() {
        const container = document.getElementById('hud-container');
        if (container) {
            HUD.mount(container);
        }
    },

    /**
     * Router Logic
     */
    async handleRoute() {
        let hash = window.location.hash.slice(1) || '/dashboard';

        // Private route guard
        if (!this.state.user && hash !== '/login' && hash !== '/register') {
            window.location.hash = '/login';
            return;
        }

        // Public route guard (don't show login if logged in)
        if (this.state.user && (hash === '/login' || hash === '/register')) {
            window.location.hash = '/dashboard';
            return;
        }

        // Parse params (e.g., /project/:id)
        const [viewName, params] = this.matchRoute(hash);

        // Render Layout
        const appDiv = document.getElementById('app');
        appDiv.innerHTML = ''; // Clear current view

        // Render Header (if logged in)
        if (this.state.user) {
            appDiv.appendChild(Header.render(this.state.user));
        }

        // Render View
        const viewContainer = document.createElement('main');
        viewContainer.className = "flex-grow container mx-auto px-4 py-8";

        if (viewName) {
            try {
                const view = viewName; // Helper naming
                await view.mount(viewContainer, params);
            } catch (err) {
                console.error("View Render Error:", err);
                viewContainer.innerHTML = `<div class="text-red-500">Error loading view: ${err.message}</div>`;
            }
        } else {
            viewContainer.innerHTML = `<div class="text-center mt-20 text-gray-500">404 - Page Not Found</div>`;
        }

        appDiv.appendChild(viewContainer);
    },

    matchRoute(hash) {
        // Simple regex matcher
        for (const [path, view] of Object.entries(this.routes)) {
            const regexPath = path.replace(/:[^\s/]+/g, '([^/]+)');
            const regex = new RegExp(`^${regexPath}$`);
            const match = hash.match(regex);

            if (match) {
                const params = {};
                // Extract param keys
                const keys = path.match(/:([^\s/]+)/g);
                if (keys) {
                    keys.forEach((key, index) => {
                        params[key.substring(1)] = match[index + 1];
                    });
                }
                return [view, params]; // Return view module and params
            }
        }
        return [null, null];
    },

    /**
     * Theme Handler
     */
    toggleTheme() {
        this.state.theme = this.state.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('theme', this.state.theme);
        this.applyTheme();
    },

    applyTheme() {
        const html = document.documentElement;
        if (this.state.theme === 'dark') {
            html.classList.add('dark');
        } else {
            html.classList.remove('dark');
        }
    },

    /**
     * Toast Notification
     */
    toast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const el = document.createElement('div');
        const colors = {
            success: 'bg-emerald-500',
            error: 'bg-error',
            info: 'bg-accent'
        };

        el.className = `${colors[type]} text-white px-6 py-4 rounded-xl shadow-2xl transform transition-all duration-300 translate-y-10 opacity-0 font-bold uppercase tracking-widest text-[10px] z-[100]`;
        el.innerText = message;

        container.appendChild(el);

        // Animate in
        requestAnimationFrame(() => {
            el.classList.remove('translate-y-10', 'opacity-0');
        });

        // Remove after 3s
        setTimeout(() => {
            el.classList.add('opacity-0', 'translate-y-10');
            setTimeout(() => el.remove(), 300);
        }, 3000);
    },

    /**
     * Global Logout
     */
    logout() {
        API.setToken(null);
        this.state.user = null;
        window.location.hash = '/login';
    },

    /**
     * Reset Project State
     */
    async startNewProject() {
        const confirmed = await window.fluxModal.confirm(
            "Start New Project?",
            "This will clear your current progress and research for the active session. Are you sure you want to proceed?",
            "Start New",
            false
        );

        if (confirmed) {
            // Clear Flux specific keys
            localStorage.removeItem('flux_research_data');
            localStorage.removeItem('flux_planning_docs');
            localStorage.removeItem('flux_scaffold_status');
            localStorage.removeItem('forge_blueprint');

            // Redirect to dashboard
            window.location.hash = '/dashboard';
            window.location.reload();
        }
    }
};

// Expose app globally for simple interaction
window.FluxApp = app;

export default app;

// Start init on load
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
