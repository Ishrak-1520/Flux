/**
 * Setup Wizard View
 * Multi-step wizard for project setup: Vision → Tech Stack → Constraints
 */

import { API } from '../api.js';
import app from '../app.js';

export default {
    async mount(container, params) {
        const projectId = params.id;

        // Wizard State
        let currentMode = 'freestyle'; // 'freestyle' or 'guided'
        let currentStep = 1;
        const wizardData = {
            mode: 'freestyle',
            vision: '',
            category: '',
            subdomain: '',
            audience: '',
            techStack: [],
            constraints: ''
        };

        // Tech Stack Options with Icons and Reasons
        const techOptions = [
            {
                category: 'Frontend',
                items: [
                    { name: 'React', icon: 'ri-reactjs-line', reason: 'Most popular, huge community, easy to learn with tons of tutorials' },
                    { name: 'Vue', icon: 'ri-vuejs-line', reason: 'Beginner-friendly, simple syntax, great documentation' },
                    { name: 'HTML/CSS/JS', icon: 'ri-code-line', reason: 'Pure basics, no framework needed, works everywhere' },
                    { name: 'Svelte', icon: 'ri-file-code-line', reason: 'Modern, fast, less code to write than React' }
                ]
            },
            {
                category: 'Backend',
                items: [
                    { name: 'FastAPI', icon: 'ri-flashlight-line', reason: 'Python-based, super fast, automatic API docs included' },
                    { name: 'Flask', icon: 'ri-flask-line', reason: 'Python-based, simple and flexible, perfect for beginners' },
                    { name: 'Express.js', icon: 'ri-nodejs-line', reason: 'JavaScript-based, minimal setup, huge ecosystem' },
                    { name: 'Django', icon: 'ri-database-2-line', reason: 'Python-based, batteries included, great for data-heavy apps' }
                ]
            },
            {
                category: 'Database',
                items: [
                    { name: 'PostgreSQL', icon: 'ri-database-line', reason: 'Free, powerful, handles complex data relationships well' },
                    { name: 'MongoDB', icon: 'ri-file-list-3-line', reason: 'NoSQL, flexible structure, perfect for JSON-like data' },
                    { name: 'SQLite', icon: 'ri-hard-drive-3-line', reason: 'No setup needed, perfect for small projects and learning' },
                    { name: 'Firebase', icon: 'ri-fire-line', reason: 'Hosted by Google, real-time sync, no server management' }
                ]
            }
        ];

        // Render Wizard
        container.innerHTML = `
            <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4">
                <div class="w-full max-w-4xl">
                    <!-- Wizard Header -->
                    <div class="text-center mb-12">
                        <div class="flex items-center justify-center gap-4 mb-6">
                            <div class="step-indicator ${currentStep >= 1 ? 'active' : ''}" data-step="1">
                                <div class="step-circle">1</div>
                                <span class="step-label">Vision</span>
                            </div>
                            <div class="step-line ${currentStep >= 2 ? 'active' : ''}"></div>
                            <div class="step-indicator ${currentStep >= 2 ? 'active' : ''}" data-step="2">
                                <div class="step-circle">2</div>
                                <span class="step-label">Tech Stack</span>
                            </div>
                            <div class="step-line ${currentStep >= 3 ? 'active' : ''}"></div>
                            <div class="step-indicator ${currentStep >= 3 ? 'active' : ''}" data-step="3">
                                <div class="step-circle">3</div>
                                <span class="step-label">Constraints</span>
                            </div>
                        </div>
                        <h1 class="text-4xl font-bold text-white mb-2">Project Setup Wizard</h1>
                        <p class="text-gray-400">Let's build something amazing together</p>
                        
                        <!-- Mode Toggle -->
                        <div class="flex justify-center mt-6">
                            <div class="glass-panel p-1.5 rounded-2xl flex relative z-10 w-full max-w-md bg-black/40 border-white/5">
                                <button class="mode-btn w-1/2 py-3 rounded-xl text-sm font-bold transition-all duration-300 bg-white/10 text-white shadow-lg shadow-white/5" data-mode="freestyle">
                                    <i class="ri-edit-line mr-2"></i>FREESTYLE
                                </button>
                                <button class="mode-btn w-1/2 py-3 rounded-xl text-sm font-bold transition-all duration-300 text-gray-500 hover:text-white" data-mode="guided">
                                    <i class="ri-list-check-2 mr-2"></i>GUIDED
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Wizard Content Container -->
                    <div class="relative">
                        <div class="absolute -inset-1 bg-gradient-to-r from-violet-600/20 to-cyan-500/20 rounded-3xl blur opacity-50"></div>
                        <div class="glass-panel relative bg-slate-950/80 p-8 md:p-12 rounded-3xl border border-white/10 min-h-[500px]">
                            
                            <!-- Step 1: Vision (Freestyle Mode) -->
                            <div id="step-1-freestyle" class="wizard-step">
                                <div class="mb-6">
                                    <h2 class="text-2xl font-bold text-white mb-2">What's your vision?</h2>
                                    <p class="text-gray-400 text-sm">Describe your project idea in your own words. What problem does it solve?</p>
                                </div>
                                
                                <div class="relative group">
                                    <div class="absolute -inset-0.5 bg-gradient-to-r from-flux-500 to-cyan-500 rounded-2xl opacity-0 group-focus-within:opacity-50 transition duration-500 blur"></div>
                                    <textarea 
                                        id="vision-input" 
                                        class="relative w-full h-64 p-6 rounded-2xl bg-slate-900 border border-white/10 text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-0 resize-none font-mono text-sm leading-relaxed transition-all shadow-inner"
                                        placeholder="> Describe your idea...\n> What problem does it solve?\n> Who will use it?\n> What makes it unique?"
                                    ></textarea>
                                </div>
                                
                                <div class="mt-3 flex justify-between items-center text-xs font-mono text-gray-600">
                                    <span>Be specific and detailed</span>
                                    <span><span id="char-count" class="text-cyan-500">0</span> characters</span>
                                </div>
                            </div>

                            <!-- Step 1: Vision (Guided Mode) -->
                            <div id="step-1-guided" class="wizard-step hidden">
                                <div class="mb-6">
                                    <h2 class="text-2xl font-bold text-white mb-2">Let's get started</h2>
                                    <p class="text-gray-400 text-sm">Answer a few questions to help shape your project idea.</p>
                                </div>

                                <div class="space-y-8">
                                    <!-- Category Selection -->
                                    <div>
                                        <label class="block text-xs font-mono text-cyan-400 mb-4 uppercase tracking-widest">What type of project?</label>
                                        <input type="hidden" id="category-input">
                                        <div class="grid grid-cols-2 md:grid-cols-3 gap-3" id="category-pills">
                                            ${['SWE Tools', 'FinTech', 'HealthTech', 'EdTech', 'CyberSec', 'Social', 'Marketplace', 'IoT', 'AI/ML'].map(cat => `
                                                <button type="button" class="category-pill py-3 px-4 rounded-xl border border-white/10 bg-white/5 text-gray-400 hover:bg-white/10 hover:border-white/20 hover:text-white transition-all text-sm font-medium text-left flex items-center justify-between group" data-value="${cat}">
                                                    <span>${cat}</span>
                                                    <div class="w-2 h-2 rounded-full bg-transparent border border-gray-600 group-hover:border-cyan-400 pill-indicator"></div>
                                                </button>
                                            `).join('')}
                                        </div>
                                    </div>

                                    <!-- Subdomain -->
                                    <div>
                                        <label class="block text-xs font-mono text-gray-500 mb-3 uppercase">What specifically? (Optional)</label>
                                        <div class="relative group">
                                            <div class="absolute -inset-0.5 bg-flux-500 rounded-xl opacity-0 group-focus-within:opacity-30 transition blur"></div>
                                            <input type="text" id="subdomain-input" class="relative w-full p-4 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-flux-500 transition-colors" placeholder="e.g., Predictive Maintenance, NFT Marketplace, Video Streaming...">
                                        </div>
                                    </div>

                                    <!-- Target Audience -->
                                    <div>
                                        <label class="block text-xs font-mono text-gray-500 mb-3 uppercase">Who will use it?</label>
                                        <div class="relative group">
                                            <div class="absolute -inset-0.5 bg-flux-500 rounded-xl opacity-0 group-focus-within:opacity-30 transition blur"></div>
                                            <input type="text" id="audience-input" class="relative w-full p-4 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-flux-500 transition-colors" placeholder="e.g., Small business owners, Students, Developers...">
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Step 2: Tech Stack -->
                            <div id="step-2" class="wizard-step hidden">
                                <div class="mb-6">
                                    <div class="flex items-start justify-between mb-3">
                                        <div>
                                            <h2 class="text-2xl font-bold text-white mb-2">Choose your tools</h2>
                                            <p class="text-gray-400 text-sm">Select the technologies you want to use. Don't worry, we'll help you learn them!</p>
                                        </div>
                                        <button id="ai-suggest-btn" class="px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600/20 to-cyan-600/20 border border-violet-500/30 text-violet-300 hover:border-violet-500 transition-all flex items-center gap-2 text-sm font-medium whitespace-nowrap">
                                            <i class="ri-sparkling-line"></i>
                                            <span>Help Me Choose</span>
                                        </button>
                                    </div>
                                    <div id="ai-suggestion-status" class="hidden mb-4 p-3 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs flex items-center gap-2">
                                        <i class="ri-loader-4-line animate-spin"></i>
                                        <span>AI is analyzing your project idea...</span>
                                    </div>
                                </div>

                                <div id="tech-stack-container" class="space-y-8">
                                    ${techOptions.map(section => `
                                        <div>
                                            <h3 class="text-xs font-mono text-cyan-400 uppercase mb-4 tracking-widest">${section.category}</h3>
                                            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                ${section.items.map(tech => `
                                                    <div class="tech-card group cursor-pointer relative p-[1px] rounded-xl bg-gradient-to-br from-white/10 to-transparent hover:from-cyan-500/50 transition-all duration-300" 
                                                         data-category="${section.category}" 
                                                         data-tech="${tech.name}">
                                                        <div class="bg-slate-900/90 rounded-xl p-4 hover:bg-slate-900/80 transition-colors">
                                                            <div class="flex items-start gap-4">
                                                                <div class="p-3 rounded-lg bg-flux-500/10 border border-flux-500/20 text-flux-400 flex-shrink-0">
                                                                    <i class="${tech.icon} text-2xl"></i>
                                                                </div>
                                                                <div class="flex-1 min-w-0">
                                                                    <div class="flex items-center justify-between mb-2">
                                                                        <h4 class="font-bold text-white group-hover:text-cyan-400 transition-colors">${tech.name}</h4>
                                                                        <div class="tech-checkbox w-5 h-5 rounded border-2 border-gray-600 flex items-center justify-center transition-colors">
                                                                            <i class="ri-check-line text-white text-sm opacity-0"></i>
                                                                        </div>
                                                                    </div>
                                                                    <p class="text-xs text-gray-400 leading-relaxed">${tech.reason}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                `).join('')}
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>

                                <!-- Custom Tech Input -->
                                <div class="mt-8 pt-6 border-t border-white/10">
                                    <label class="block text-xs font-mono text-gray-500 mb-2">Want to use something else?</label>
                                    <input 
                                        type="text" 
                                        id="custom-tech-input" 
                                        class="w-full p-3 rounded-lg bg-slate-900 border border-white/10 text-white text-sm focus:outline-none focus:border-flux-500 transition-colors"
                                        placeholder="e.g., Ruby on Rails, Rust, Angular..."
                                    >
                                </div>

                                <div id="selected-tech-summary" class="mt-6 p-4 rounded-lg bg-white/5 border border-white/5 hidden">
                                    <div class="text-xs font-mono text-gray-500 mb-2">Selected Technologies:</div>
                                    <div id="selected-tech-list" class="flex flex-wrap gap-2"></div>
                                </div>
                            </div>

                            <!-- Step 3: Constraints -->
                            <div id="step-3" class="wizard-step hidden">
                                <div class="mb-6">
                                    <h2 class="text-2xl font-bold text-white mb-2">Any specific requirements?</h2>
                                    <p class="text-gray-400 text-sm">Optional: Add any constraints, preferences, or special features you need.</p>
                                </div>

                                <div class="space-y-6">
                                    <div>
                                        <label class="block text-xs font-mono text-gray-500 mb-3 uppercase">Constraints & Requirements</label>
                                        <textarea 
                                            id="constraints-input"
                                            class="w-full h-48 p-4 rounded-xl bg-slate-900 border border-white/10 text-gray-300 focus:border-flux-500 focus:outline-none resize-none text-sm leading-relaxed"
                                            placeholder="Examples:\n- Must support mobile devices\n- Need user authentication\n- Real-time updates required\n- Budget constraints\n- Specific integrations needed"
                                        ></textarea>
                                    </div>

                                    <!-- Summary Preview -->
                                    <div class="p-6 rounded-xl bg-gradient-to-br from-flux-500/5 to-cyan-500/5 border border-flux-500/20">
                                        <div class="flex items-start gap-3 mb-4">
                                            <i class="ri-lightbulb-flash-line text-flux-400 text-xl"></i>
                                            <div>
                                                <h3 class="text-sm font-bold text-white mb-2">Project Summary</h3>
                                                <div id="summary-vision" class="text-xs text-gray-400 mb-3"></div>
                                                <div id="summary-tech" class="text-xs text-gray-400"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Navigation Buttons -->
                            <div class="mt-12 flex justify-between items-center">
                                <button id="btn-back" class="px-6 py-3 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 flex items-center gap-2 transition-colors hidden">
                                    <i class="ri-arrow-left-line"></i>
                                    <span>Back</span>
                                </button>
                                <div id="back-spacer"></div>
                                
                                <button id="btn-next" class="px-8 py-3 bg-gradient-to-r from-flux-600 to-cyan-600 hover:from-flux-500 hover:to-cyan-500 text-white font-bold rounded-lg shadow-lg shadow-flux-500/20 transition-all hover:scale-105 flex items-center gap-2">
                                    <span id="btn-next-text">Continue</span>
                                    <i class="ri-arrow-right-line"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Elements
        const step1Freestyle = container.querySelector('#step-1-freestyle');
        const step1Guided = container.querySelector('#step-1-guided');
        const step2 = container.querySelector('#step-2');
        const step3 = container.querySelector('#step-3');
        const btnBack = container.querySelector('#btn-back');
        const btnNext = container.querySelector('#btn-next');
        const btnNextText = container.querySelector('#btn-next-text');
        const visionInput = container.querySelector('#vision-input');
        const charCount = container.querySelector('#char-count');
        const categoryInput = container.querySelector('#category-input');
        const subdomainInput = container.querySelector('#subdomain-input');
        const audienceInput = container.querySelector('#audience-input');
        const constraintsInput = container.querySelector('#constraints-input');
        const customTechInput = container.querySelector('#custom-tech-input');
        const selectedTechSummary = container.querySelector('#selected-tech-summary');
        const selectedTechList = container.querySelector('#selected-tech-list');
        const summaryVision = container.querySelector('#summary-vision');
        const summaryTech = container.querySelector('#summary-tech');

        // Mode Toggle
        container.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.dataset.mode;
                currentMode = mode;
                wizardData.mode = mode;

                // Update button styles
                container.querySelectorAll('.mode-btn').forEach(b => {
                    if (b.dataset.mode === mode) {
                        b.classList.add('bg-white/10', 'text-white', 'shadow-lg', 'shadow-white/5');
                        b.classList.remove('text-gray-500');
                    } else {
                        b.classList.remove('bg-white/10', 'text-white', 'shadow-lg', 'shadow-white/5');
                        b.classList.add('text-gray-500');
                    }
                });

                // Update Step 1 view
                if (mode === 'freestyle') {
                    step1Freestyle.classList.remove('hidden');
                    step1Guided.classList.add('hidden');
                } else {
                    step1Freestyle.classList.add('hidden');
                    step1Guided.classList.remove('hidden');
                }
            });
        });

        // Category Pill Selection (Guided Mode)
        container.querySelectorAll('.category-pill').forEach(pill => {
            pill.addEventListener('click', () => {
                const value = pill.dataset.value;

                // Deselect all
                container.querySelectorAll('.category-pill').forEach(p => {
                    p.classList.remove('bg-flux-500/20', 'border-flux-500', 'text-white');
                    p.classList.add('bg-white/5', 'border-white/10', 'text-gray-400');
                    const indicator = p.querySelector('.pill-indicator');
                    indicator.classList.remove('bg-cyan-400');
                    indicator.classList.add('bg-transparent');
                });

                // Select this one
                pill.classList.add('bg-flux-500/20', 'border-flux-500', 'text-white');
                pill.classList.remove('bg-white/5', 'border-white/10', 'text-gray-400');
                const indicator = pill.querySelector('.pill-indicator');
                indicator.classList.add('bg-cyan-400');
                indicator.classList.remove('bg-transparent');

                wizardData.category = value;
                categoryInput.value = value;
            });
        });

        // AI Tech Stack Suggestion Button
        const aiSuggestBtn = container.querySelector('#ai-suggest-btn');
        const aiSuggestionStatus = container.querySelector('#ai-suggestion-status');

        aiSuggestBtn.addEventListener('click', async () => {
            try {
                // Show loading status
                aiSuggestionStatus.classList.remove('hidden');
                aiSuggestBtn.disabled = true;
                aiSuggestBtn.classList.add('opacity-50', 'cursor-not-allowed');

                // Get vision from either mode
                const currentVision = currentMode === 'freestyle'
                    ? visionInput.value.trim()
                    : `I want to build a ${wizardData.category}${wizardData.subdomain ? ' focused on ' + wizardData.subdomain : ''} for ${wizardData.audience || 'users'}.`;

                if (!currentVision || currentVision.length < 10) {
                    app.toast('Please complete Step 1 first before getting AI suggestions', 'error');
                    aiSuggestionStatus.classList.add('hidden');
                    return;
                }

                // Call API
                const suggestions = await API.suggestTechStack(currentVision);

                // Auto-select suggested technologies
                let selectedCount = 0;

                ['frontend', 'backend', 'database'].forEach(category => {
                    if (suggestions[category] && Array.isArray(suggestions[category])) {
                        suggestions[category].forEach(item => {
                            // Find matching card
                            const matchingCard = Array.from(container.querySelectorAll('.tech-card'))
                                .find(card => card.dataset.tech === item.name);

                            if (matchingCard && !matchingCard.classList.contains('selected')) {
                                // Simulate click to select
                                matchingCard.click();
                                selectedCount++;
                            }
                        });
                    }
                });

                // Success message
                aiSuggestionStatus.innerHTML = `
                    <i class="ri-checkbox-circle-line"></i>
                    <span>AI selected ${selectedCount} technologies based on your project idea!</span>
                `;
                aiSuggestionStatus.classList.remove('bg-violet-500/10', 'border-violet-500/20', 'text-violet-300');
                aiSuggestionStatus.classList.add('bg-green-500/10', 'border-green-500/20', 'text-green-300');

                setTimeout(() => {
                    aiSuggestionStatus.classList.add('hidden');
                    aiSuggestionStatus.classList.remove('bg-green-500/10', 'border-green-500/20', 'text-green-300');
                    aiSuggestionStatus.classList.add('bg-violet-500/10', 'border-violet-500/20', 'text-violet-300');
                }, 5000);

            } catch (err) {
                console.error('AI Suggestion Error:', err);
                app.toast('Failed to get AI suggestions: ' + err.message, 'error');
                aiSuggestionStatus.classList.add('hidden');
            } finally {
                aiSuggestBtn.disabled = false;
                aiSuggestBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            }
        });

        // Character counter
        visionInput.addEventListener('input', () => {
            charCount.textContent = visionInput.value.length;
        });

        // Tech card selection
        container.querySelectorAll('.tech-card').forEach(card => {
            card.addEventListener('click', () => {
                const tech = card.dataset.tech;
                const category = card.dataset.category;
                const checkbox = card.querySelector('.tech-checkbox');
                const checkIcon = checkbox.querySelector('i');

                // Toggle selection
                if (card.classList.contains('selected')) {
                    card.classList.remove('selected');
                    checkbox.classList.remove('bg-flux-500', 'border-flux-500');
                    checkbox.classList.add('border-gray-600');
                    checkIcon.classList.add('opacity-0');

                    // Remove from wizardData
                    wizardData.techStack = wizardData.techStack.filter(t => t.technology !== tech);
                } else {
                    card.classList.add('selected');
                    checkbox.classList.add('bg-flux-500', 'border-flux-500');
                    checkbox.classList.remove('border-gray-600');
                    checkIcon.classList.remove('opacity-0');

                    // Find the reason from techOptions
                    const techItem = techOptions
                        .find(opt => opt.category === category)
                        ?.items.find(item => item.name === tech);

                    // Add to wizardData
                    wizardData.techStack.push({
                        category: category,
                        technology: tech,
                        reason: techItem?.reason || 'Selected by user'
                    });
                }

                updateTechSummary();
            });
        });

        // Custom tech input
        customTechInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && customTechInput.value.trim()) {
                const customTech = customTechInput.value.trim();
                wizardData.techStack.push({
                    category: 'Custom',
                    technology: customTech,
                    reason: 'User-specified technology'
                });
                customTechInput.value = '';
                updateTechSummary();
            }
        });

        function updateTechSummary() {
            if (wizardData.techStack.length > 0) {
                selectedTechSummary.classList.remove('hidden');
                selectedTechList.innerHTML = wizardData.techStack
                    .map(t => `
                        <span class="px-3 py-1 rounded-full bg-flux-500/20 text-flux-300 text-xs font-medium border border-flux-500/30">
                            ${t.technology}
                        </span>
                    `).join('');
            } else {
                selectedTechSummary.classList.add('hidden');
            }
        }

        // Navigation Logic
        function updateStepIndicators() {
            container.querySelectorAll('.step-indicator').forEach((indicator, index) => {
                if (index + 1 <= currentStep) {
                    indicator.classList.add('active');
                } else {
                    indicator.classList.remove('active');
                }
            });

            container.querySelectorAll('.step-line').forEach((line, index) => {
                if (index + 1 < currentStep) {
                    line.classList.add('active');
                } else {
                    line.classList.remove('active');
                }
            });
        }

        function showStep(step) {
            // Hide all steps
            step1Freestyle.classList.add('hidden');
            step1Guided.classList.add('hidden');
            step2.classList.add('hidden');
            step3.classList.add('hidden');

            // Show current step
            if (step === 1) {
                if (currentMode === 'freestyle') {
                    step1Freestyle.classList.remove('hidden');
                } else {
                    step1Guided.classList.remove('hidden');
                }
                btnBack.classList.add('hidden');
                btnNextText.textContent = 'Continue';
            } else if (step === 2) {
                step2.classList.remove('hidden');
                btnBack.classList.remove('hidden');
                btnNextText.textContent = 'Continue';
            } else if (step === 3) {
                step3.classList.remove('hidden');
                btnBack.classList.remove('hidden');
                btnNextText.textContent = 'Start Research';

                // Update summary
                if (currentMode === 'freestyle') {
                    summaryVision.textContent = wizardData.vision.substring(0, 200) + (wizardData.vision.length > 200 ? '...' : '');
                } else {
                    const guidedVision = `Building a ${wizardData.category}${wizardData.subdomain ? ' focused on ' + wizardData.subdomain : ''} for ${wizardData.audience || 'users'}`;
                    summaryVision.textContent = guidedVision;
                }
                summaryTech.textContent = `Technologies: ${wizardData.techStack.map(t => t.technology).join(', ') || 'None selected'}`;
            }

            updateStepIndicators();
        }

        function validateStep(step) {
            if (step === 1) {
                if (currentMode === 'freestyle') {
                    if (!visionInput.value.trim() || visionInput.value.length < 10) {
                        app.toast('Please describe your vision (at least 10 characters)', 'error');
                        return false;
                    }
                    wizardData.vision = visionInput.value.trim();
                } else {
                    // Guided mode validation
                    if (!wizardData.category) {
                        app.toast('Please select a project category', 'error');
                        return false;
                    }

                    wizardData.subdomain = subdomainInput.value.trim();
                    wizardData.audience = audienceInput.value.trim();

                    if (!wizardData.audience) {
                        app.toast('Please specify who will use your project', 'error');
                        return false;
                    }

                    // Generate vision from guided inputs
                    wizardData.vision = `I want to build a ${wizardData.category}${wizardData.subdomain ? ' focused on ' + wizardData.subdomain : ''} for ${wizardData.audience}.`;
                }
                return true;
            } else if (step === 2) {
                if (wizardData.techStack.length === 0) {
                    app.toast('Please select at least one technology', 'error');
                    return false;
                }
                return true;
            }
            return true;
        }

        // Button Handlers
        btnNext.addEventListener('click', async () => {
            if (!validateStep(currentStep)) return;

            if (currentStep < 3) {
                currentStep++;
                showStep(currentStep);
            } else {
                // Final submission
                wizardData.constraints = constraintsInput.value.trim();

                btnNext.disabled = true;
                btnNext.innerHTML = '<i class="ri-loader-4-line animate-spin"></i> <span>Setting up...</span>';

                try {
                    // Update project with wizard data
                    const payload = {
                        original_prompt: wizardData.vision,
                        wizard_data: {
                            tech_stack: wizardData.techStack,
                            constraints: wizardData.constraints
                        }
                    };

                    // Store in app state for research agent
                    if (window.FluxApp) {
                        window.FluxApp.state.wizardData = wizardData;
                    }

                    // Redirect to research
                    window.location.hash = `/project/${projectId}/research`;
                } catch (err) {
                    console.error(err);
                    app.toast('Setup failed: ' + err.message, 'error');
                    btnNext.disabled = false;
                    btnNext.innerHTML = '<span>Start Research</span> <i class="ri-arrow-right-line"></i>';
                }
            }
        });

        btnBack.addEventListener('click', () => {
            if (currentStep > 1) {
                currentStep--;
                showStep(currentStep);
            }
        });

        // Initialize
        showStep(currentStep);
    }
};
