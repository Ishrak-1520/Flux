/**
 * Auth View
 * Handles Login and Registration screens.
 */

import { API } from '../api.js';
import app from '../app.js';

export default {
    async mount(container) {
        // Determine mode based on hash
        const isRegister = window.location.hash.includes('register');

        container.innerHTML = `
            <div class="min-h-[80vh] flex items-center justify-center">
                <div class="w-full max-w-md">
                    <!-- Brand -->
                    <div class="text-center mb-8 animate-float">
                        <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-flux-500 to-purple-600 shadow-lg shadow-flux-500/30 mb-4">
                            <i class="ri-flow-chart text-3xl text-white"></i>
                        </div>
                        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">Flux</h1>
                        <p class="text-gray-500 dark:text-gray-400">Idea to Implementation in a single flow.</p>
                    </div>

                    <!-- Auth Card -->
                    <div class="glass p-8 rounded-2xl shadow-xl border-t border-white/20">
                        <h2 class="text-xl font-bold mb-6 text-gray-900 dark:text-white">
                            ${isRegister ? 'Create Account' : 'Welcome Back'}
                        </h2>
                        
                        <form id="auth-form" class="space-y-4">
                            ${isRegister ? `
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Display Name</label>
                                <input type="text" name="display_name" required class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-flux-500 focus:border-transparent outline-none transition-all">
                            </div>
                            ` : ''}
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                                <input type="email" name="email" required class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-flux-500 focus:border-transparent outline-none transition-all">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                                <input type="password" name="password" required class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-flux-500 focus:border-transparent outline-none transition-all">
                            </div>

                            <button type="submit" class="w-full py-2.5 bg-gradient-to-r from-flux-500 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-flux-500/40 active:scale-95 transition-all duration-200">
                                ${isRegister ? 'Create Account' : 'Sign In'}
                            </button>
                        </form>

                        <div class="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                            ${isRegister ? 'Already have an account?' : 'Don\'t have an account?'}
                            <a href="#${isRegister ? '/login' : '/register'}" class="text-flux-600 dark:text-flux-400 font-medium hover:underline">
                                ${isRegister ? 'Sign in' : 'Register now'}
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Handle Form Submission
        const form = container.querySelector('#auth-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            const btn = form.querySelector('button[type="submit"]');

            try {
                btn.disabled = true;
                btn.innerHTML = '<div class="loader mx-auto h-5 w-5 border-white"></div>';

                if (isRegister) {
                    await API.register(data.email, data.password, data.display_name);
                    app.toast('Account created successfully!', 'success');
                } else {
                    await API.login(data.email, data.password);
                    app.toast('Welcome back!', 'success');
                }

                // Refresh app state and redirect
                app.state.user = await API.getMe();
                window.location.hash = '/dashboard';

            } catch (err) {
                app.toast(err.message, 'error');
                btn.disabled = false;
                btn.innerText = isRegister ? 'Create Account' : 'Sign In';
            }
        });
    }
};
