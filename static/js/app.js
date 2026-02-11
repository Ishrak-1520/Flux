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

// Import Components
import Header from './components/header.js';

const app = {
    // Application State
    state: {
        user: null,
        currentProject: null,
        theme: localStorage.getItem('theme') || 'dark'
    },

    // Routes Definition
    routes: {
        '/login': AuthView,
        '/register': AuthView,
        '/dashboard': DashboardView,
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
            } catch (e) {
                console.log("Auth check failed", e);
            }
        }

        // Handle routing
        window.addEventListener('hashchange', () => this.handleRoute());
        this.handleRoute(); // Initial load
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
            success: 'bg-green-500',
            error: 'bg-red-500',
            info: 'bg-blue-500'
        };

        el.className = `${colors[type]} text-white px-4 py-2 rounded shadow-lg backdrop-filter backdrop-blur-sm bg-opacity-90 transform transition-all duration-300 translate-y-10 opacity-0`;
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
    }
};

// Expose app globally for simple interaction
window.FluxApp = app;

export default app;

// Start init on load
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
