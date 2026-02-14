/**
 * Header Component
 * Renders the top navigation bar with user profile.
 */

import app from '../app.js';
import { API } from '../api.js';

export default {
    render(user) {
        const header = document.createElement('header');
        header.className = "sticky top-0 z-40 w-full glass border-b border-gray-200 dark:border-gray-800 transition-colors duration-500";

        header.innerHTML = `
            <div class="container mx-auto px-4 h-16 flex items-center justify-between">
                <!-- Logo -->
                <a href="#/dashboard" class="flex items-center gap-2 group">
                    <div class="bg-gradient-to-tr from-flux-500 to-purple-600 rounded-lg p-1.5 shadow-lg group-hover:shadow-flux-500/50 transition-all duration-300">
                        <i class="ri-flow-chart text-white text-xl"></i>
                    </div>
                    <span class="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">Flux</span>
                </a>

                <!-- Right Side Actions -->
                <div class="flex items-center gap-4">
                    <!-- New Project Button -->
                     <button onclick="window.FluxApp.startNewProject()" class="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-flux-500/10 hover:bg-flux-500/20 text-flux-500 hover:text-flux-400 border border-flux-500/20 transition-all text-xs font-bold uppercase tracking-wider">
                        <i class="ri-add-line"></i>
                        <span>New Project</span>
                    </button>

                    <!-- Theme Toggle -->
                    <button id="theme-toggle" class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <i class="ri-moon-line text-gray-600 dark:text-gray-300 dark:hidden"></i>
                        <i class="ri-sun-line text-yellow-500 hidden dark:inline-block"></i>
                    </button>

                    <!-- User Menu -->
                    <div class="relative group">
                        <button class="flex items-center gap-2 focus:outline-none">
                            <div class="w-8 h-8 rounded-full bg-gradient-to-br from-flux-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold shadow-md">
                                ${user.display_name.charAt(0).toUpperCase()}
                            </div>
                            <span class="hidden md:block text-sm font-medium text-gray-700 dark:text-gray-200">${user.display_name}</span>
                            <i class="ri-arrow-down-s-line text-gray-500 dark:text-gray-400"></i>
                        </button>
                        
                        <!-- Dropdown -->
                        <div class="absolute right-0 mt-2 w-48 py-2 bg-white dark:bg-dark-card rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right">
                            <div class="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                                <p class="text-xs text-gray-500 dark:text-gray-400">Signed in as</p>
                                <p class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">${user.email}</p>
                            </div>
                            <a href="#/dashboard" class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50">Dashboard</a>
                            <button id="logout-btn" class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10">Sign out</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Event Listeners
        header.querySelector('#theme-toggle').addEventListener('click', () => {
            app.toggleTheme();
        });

        header.querySelector('#logout-btn').addEventListener('click', () => {
            app.logout();
        });

        return header;
    }
};
