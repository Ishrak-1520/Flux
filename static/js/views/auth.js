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
            <div class="min-h-screen flex items-center justify-center bg-bg-main relative overflow-hidden animate-fade-in">
                <div class="w-full max-w-md p-6 relative z-10">
                    <!-- Auth Card -->
                    <div class="bg-bg-card p-10 rounded-3xl border border-border-light shadow-3xl relative">
                        <!-- Header -->
                        <div class="text-center mb-12">
                            <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent text-white shadow-xl shadow-accent/20 mb-6">
                                <i class="ri-flow-chart text-3xl"></i>
                            </div>
                            <h1 class="text-4xl font-serif font-black text-text-primary mb-3 tracking-tight">Flux</h1>
                            <p class="text-text-muted text-[10px] font-mono uppercase tracking-[0.2em] font-bold">System_Access_Required</p>
                        </div>

                        <form id="auth-form" class="space-y-8">
                            ${isRegister ? `
                            <div class="space-y-3">
                                <label class="block text-[10px] font-mono text-text-muted uppercase tracking-widest font-bold ml-1">Identity_Signature</label>
                                <input type="text" name="display_name" required 
                                    class="w-full px-5 py-4 rounded-2xl bg-bg-sidebar border border-border-light text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition-all shadow-inner text-sm"
                                    placeholder="Display Name">
                            </div>
                            ` : ''}
                            
                            <div class="space-y-3">
                                <label class="block text-[10px] font-mono text-text-muted uppercase tracking-widest font-bold ml-1">Credential_Uplink</label>
                                <input type="email" name="email" required 
                                    class="w-full px-5 py-4 rounded-2xl bg-bg-sidebar border border-border-light text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition-all shadow-inner text-sm"
                                    placeholder="user@flux.system">
                            </div>
                            
                            <div class="space-y-3">
                                <label class="block text-[10px] font-mono text-text-muted uppercase tracking-widest font-bold ml-1">Security_Sequence</label>
                                <input type="password" name="password" required 
                                    class="w-full px-5 py-4 rounded-2xl bg-bg-sidebar border border-border-light text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition-all shadow-inner text-sm"
                                    placeholder="••••••••">
                            </div>

                            <button type="submit" class="btn-primary w-full py-4.5 text-xs uppercase tracking-widest font-bold mt-4">
                                ${isRegister ? 'Initialize_Account' : 'Authenticate_Access'}
                            </button>
                        </form>

                        <div class="mt-10 text-center">
                            <a href="#${isRegister ? '/login' : '/register'}" class="text-xs text-text-muted hover:text-text-primary transition-colors font-medium">
                                ${isRegister ? 'Already have access? ' : 'Need system access? '}
                                <span class="text-accent hover:underline underline-offset-8 decoration-accent/30 font-bold uppercase tracking-widest ml-1">
                                    ${isRegister ? 'Sign_In' : 'Register_Protocol'}
                                </span>
                            </a>
                        </div>
                    </div>
                    
                    <div class="text-center mt-8 text-[9px] text-text-muted font-mono uppercase tracking-[0.3em] opacity-50">
                        Secure_Connection :: 256-Bit_Encryption
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
                btn.innerHTML = '<div class="flex items-center justify-center gap-3"><i class="ri-loader-4-line animate-spin text-xl"></i> PROCESSING_UPLINK...</div>';

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
