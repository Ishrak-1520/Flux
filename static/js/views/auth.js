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
            <div class="min-h-screen flex items-center justify-center relative overflow-hidden">
                <!-- Background Elements -->
                <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-flux-500/10 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
                <div class="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-[80px] -z-10 pointer-events-none"></div>
                <div class="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-[80px] -z-10 pointer-events-none"></div>

                <div class="w-full max-w-md p-6">
                    <!-- Auth Card -->
                    <div class="glass-panel backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-2xl relative">
                        <!-- Glow effect -->
                        <div class="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                        
                        <!-- Header -->
                        <div class="text-center mb-10">
                            <div class="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-flux-500 to-cyan-500 shadow-lg shadow-flux-500/20 mb-4">
                                <i class="ri-flow-chart text-2xl text-white"></i>
                            </div>
                            <h1 class="text-3xl font-bold text-white mb-2 tracking-tight">Flux</h1>
                            <p class="text-gray-400 text-sm font-medium">System Access Required</p>
                        </div>

                        <form id="auth-form" class="space-y-6">
                            ${isRegister ? `
                            <div class="space-y-2">
                                <label class="block text-xs font-mono text-cyan-400 uppercase tracking-wider ml-1">Identity</label>
                                <div class="relative group">
                                    <input type="text" name="display_name" required 
                                        class="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-flux-500 focus:bg-slate-900 transition-all shadow-inner"
                                        placeholder="Display Name">
                                </div>
                            </div>
                            ` : ''}
                            
                            <div class="space-y-2">
                                <label class="block text-xs font-mono text-cyan-400 uppercase tracking-wider ml-1">Credentials</label>
                                <div class="relative group">
                                    <input type="email" name="email" required 
                                        class="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-flux-500 focus:bg-slate-900 transition-all shadow-inner"
                                        placeholder="user@flux.system">
                                </div>
                            </div>
                            
                            <div class="space-y-2">
                                <label class="block text-xs font-mono text-cyan-400 uppercase tracking-wider ml-1">Security Key</label>
                                <div class="relative group">
                                    <input type="password" name="password" required 
                                        class="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-flux-500 focus:bg-slate-900 transition-all shadow-inner"
                                        placeholder="••••••••">
                                </div>
                            </div>

                            <button type="submit" class="w-full py-3.5 bg-gradient-to-r from-flux-600 to-purple-600 hover:from-flux-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-flux-500/20 active:scale-[0.98] transition-all duration-200 mt-2">
                                ${isRegister ? 'INITIALIZE_ACCOUNT' : 'AUTHENTICATE'}
                            </button>
                        </form>

                        <div class="mt-8 text-center">
                            <a href="#${isRegister ? '/login' : '/register'}" class="text-sm text-gray-400 hover:text-white transition-colors">
                                ${isRegister ? 'Already have access? ' : 'Need access? '}
                                <span class="text-cyan-400 hover:text-cyan-300 underline underline-offset-4 decoration-cyan-400/30">
                                    ${isRegister ? 'Sign in' : 'Register protocol'}
                                </span>
                            </a>
                        </div>
                    </div>
                    
                    <div class="text-center mt-6 text-[10px] text-gray-600 font-mono">
                        SECURE_CONNECTION :: ENCRYPTED
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
            const originalText = btn.innerHTML;

            try {
                btn.disabled = true;
                btn.innerHTML = '<div class="flex items-center justify-center gap-2"><i class="ri-loader-4-line animate-spin text-xl"></i> PROCESSING</div>';

                if (isRegister) {
                    await API.register(data.email, data.password, data.display_name);
                    app.toast('Identity initialized.', 'success');
                } else {
                    await API.login(data.email, data.password);
                    app.toast('Access granted.', 'success');
                }

                // Refresh app state and redirect
                app.state.user = await API.getMe();
                window.location.hash = '/dashboard';

            } catch (err) {
                app.toast(err.message, 'error');
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
        });
    }
};
