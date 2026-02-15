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
            <div class="min-h-screen flex items-center justify-center bg-bg-main px-4">
                <div class="w-full max-w-4xl py-12 animate-fade-in">
                    <!-- Wizard Header -->
                    <div class="text-center mb-16">
                        <div class="flex items-center justify-center gap-4 mb-8">
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
                        <h1 class="text-5xl font-serif font-bold text-text-primary mb-3">Project Setup Wizard</h1>
                        <p class="text-text-secondary text-lg">Define the architectural blueprint for your next sequence.</p>
                        
                        <!-- Mode Toggle -->
                        <div class="flex justify-center mt-8">
                            <div class="bg-bg-sidebar border border-border-light p-1 rounded-2xl flex relative z-10 w-full max-w-md">
                                <button class="mode-btn w-1/2 py-3 rounded-xl text-sm font-bold transition-all duration-300 bg-bg-card text-text-primary shadow-sm border border-border-light" data-mode="freestyle">
                                    <i class="ri-edit-line mr-2"></i>FREESTYLE
                                </button>
                                <button class="mode-btn w-1/2 py-3 rounded-xl text-sm font-bold transition-all duration-300 text-text-muted hover:text-text-primary" data-mode="guided">
                                    <i class="ri-list-check-2 mr-2"></i>GUIDED
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Wizard Content Container -->
                    <div class="relative">
                        <div class="bg-bg-card relative p-8 md:p-12 rounded-3xl border border-border-light min-h-[500px] shadow-xl">
                            
                            <!-- Step 1: Vision (Freestyle Mode) -->
                            <div id="step-1-freestyle" class="wizard-step">
                                <div class="mb-8">
                                    <h2 class="text-2xl font-serif font-bold text-text-primary mb-2">What's your vision?</h2>
                                    <p class="text-text-secondary text-sm">Describe your project idea in your own words. What problem does it solve?</p>
                                </div>
                                
                                <div class="relative group">
                                    <textarea 
                                        id="vision-input" 
                                        class="relative w-full h-80 p-8 rounded-2xl bg-bg-main border border-border-light text-text-primary placeholder-text-muted focus:outline-none focus:border-accent resize-none font-mono text-sm leading-relaxed transition-all"
                                        placeholder="> Describe your idea...\n> What problem does it solve?\n> Who will use it?\n> What makes it unique?"
                                    ></textarea>
                                </div>
                                
                                <div class="mt-4 flex justify-between items-center text-xs font-mono text-text-muted">
                                    <span>Detailed descriptions yield better architectures</span>
                                    <span><span id="char-count" class="text-accent font-bold">0</span> characters</span>
                                </div>
                            </div>

                            <!-- Step 1: Vision (Guided Mode) -->
                            <div id="step-1-guided" class="wizard-step hidden">
                                <div class="mb-8">
                                    <h2 class="text-2xl font-serif font-bold text-text-primary mb-2">Guided Discovery</h2>
                                    <p class="text-text-secondary text-sm">Answer a few questions to help shape your project idea.</p>
                                </div>

                                <div class="space-y-8">
                                    <!-- Category Selection -->
                                    <div>
                                        <label class="block text-xs font-mono text-accent mb-4 uppercase tracking-widest font-bold">What type of project?</label>
                                        <input type="hidden" id="category-input">
                                        <div class="grid grid-cols-2 md:grid-cols-3 gap-3" id="category-pills">
                                            ${['SWE Tools', 'FinTech', 'HealthTech', 'EdTech', 'CyberSec', 'Social', 'Marketplace', 'IoT', 'AI/ML'].map(cat => `
                                                <button type="button" class="category-pill py-3 px-4 rounded-xl border border-border-light bg-bg-sidebar text-text-muted hover:border-accent hover:text-text-primary transition-all text-sm font-medium text-left flex items-center justify-between group" data-value="${cat}">
                                                    <span>${cat}</span>
                                                    <div class="w-2 h-2 rounded-full bg-transparent border border-border-light group-hover:border-accent pill-indicator"></div>
                                                </button>
                                            `).join('')}
                                        </div>
                                    </div>

                                    <!-- Subdomain -->
                                    <div>
                                        <label class="block text-xs font-mono text-text-muted mb-3 uppercase font-bold">What specifically? (Optional)</label>
                                        <div class="relative group">
                                            <input type="text" id="subdomain-input" class="relative w-full p-4 rounded-xl bg-bg-main border border-border-light text-text-primary focus:outline-none focus:border-accent transition-colors" placeholder="e.g., Predictive Maintenance, NFT Marketplace, Video Streaming...">
                                        </div>
                                    </div>

                                    <!-- Target Audience -->
                                    <div>
                                        <label class="block text-xs font-mono text-text-muted mb-3 uppercase font-bold">Who will use it?</label>
                                        <div class="relative group">
                                            <input type="text" id="audience-input" class="relative w-full p-4 rounded-xl bg-bg-main border border-border-light text-text-primary focus:outline-none focus:border-accent transition-colors" placeholder="e.g., Small business owners, Students, Developers...">
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Step 2: Tech Stack -->
                            <div id="step-2" class="wizard-step hidden">
                                <div class="mb-8">
                                    <div class="flex items-start justify-between mb-4">
                                        <div>
                                            <h2 class="text-2xl font-serif font-bold text-text-primary mb-2">Choose your stack</h2>
                                            <p class="text-text-secondary text-sm">Select the core technologies for your build.</p>
                                        </div>
                                        <button id="ai-suggest-btn" class="btn-secondary flex items-center gap-2 text-sm">
                                            <i class="ri-sparkling-line text-accent"></i>
                                            <span>Help Me Choose</span>
                                        </button>
                                    </div>
                                    <div id="ai-suggestion-status" class="hidden mb-4 p-4 rounded-xl bg-accent/5 border border-accent/20 text-accent text-xs flex items-center gap-2">
                                        <i class="ri-loader-4-line animate-spin text-lg"></i>
                                        <span class="font-mono uppercase tracking-widest">Architect_Analysis_InProgress...</span>
                                    </div>
                                </div>

                                <div id="tech-stack-container" class="space-y-8">
                                    ${techOptions.map(section => `
                                        <div>
                                            <h3 class="text-xs font-mono text-accent uppercase mb-4 tracking-widest font-bold">${section.category}</h3>
                                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                ${section.items.map(tech => `
                                                    <div class="tech-card group cursor-pointer relative rounded-xl border border-border-light bg-bg-sidebar hover:border-accent transition-all duration-300" 
                                                         data-category="${section.category}" 
                                                         data-tech="${tech.name}">
                                                        <div class="p-5">
                                                            <div class="flex items-start gap-4">
                                                                <div class="p-3 rounded-lg bg-bg-main border border-border-light text-accent flex-shrink-0 group-hover:border-accent transition-colors">
                                                                    <i class="${tech.icon} text-2xl"></i>
                                                                </div>
                                                                <div class="flex-1 min-w-0">
                                                                    <div class="flex items-center justify-between mb-2">
                                                                        <h4 class="font-bold text-text-primary group-hover:text-accent transition-colors">${tech.name}</h4>
                                                                        <div class="tech-checkbox w-5 h-5 rounded border-2 border-border-light flex items-center justify-center transition-colors group-hover:border-accent/40">
                                                                            <i class="ri-check-line text-accent text-sm opacity-0"></i>
                                                                        </div>
                                                                    </div>
                                                                    <p class="text-xs text-text-secondary leading-relaxed">${tech.reason}</p>
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
                                <div class="mt-8 pt-6 border-t border-border-light">
                                    <label class="block text-xs font-mono text-text-muted mb-2 uppercase font-bold tracking-wider">Manual Component Override</label>
                                    <input 
                                        type="text" 
                                        id="custom-tech-input" 
                                        class="w-full p-4 rounded-xl bg-bg-main border border-border-light text-text-primary text-sm focus:outline-none focus:border-accent transition-colors"
                                        placeholder="e.g., Ruby on Rails, Rust, Angular..."
                                    >
                                </div>

                                <div id="selected-tech-summary" class="mt-6 p-4 rounded-xl bg-bg-sidebar border border-border-light hidden">
                                    <div class="text-xs font-mono text-text-muted mb-3 uppercase font-bold">Assembled Stack:</div>
                                    <div id="selected-tech-list" class="flex flex-wrap gap-2"></div>
                                </div>
                            </div>

                            <!-- Step 3: Constraints -->
                            <div id="step-3" class="wizard-step hidden">
                                <div class="mb-8">
                                    <h2 class="text-2xl font-serif font-bold text-text-primary mb-2">Operational Constraints</h2>
                                    <p class="text-text-secondary text-sm">Define any specific technical or business requirements.</p>
                                </div>

                                <div class="space-y-6">
                                    <div>
                                        <label class="block text-xs font-mono text-text-muted mb-3 uppercase font-bold tracking-widest text-accent">Instruction Set</label>
                                        <textarea 
                                            id="constraints-input"
                                            class="w-full h-48 p-6 rounded-2xl bg-bg-main border border-border-light text-text-primary focus:border-accent focus:outline-none resize-none text-sm leading-relaxed"
                                            placeholder="Examples:\n- Must support mobile devices\n- Need user authentication\n- Real-time updates required\n- Budget constraints\n- Specific integrations needed"
                                        ></textarea>
                                    </div>

                                    <!-- Summary Preview -->
                                    <div class="p-6 rounded-2xl bg-bg-sidebar border border-border-light">
                                        <div class="flex items-start gap-4 mb-4">
                                            <div class="w-10 h-10 rounded-lg bg-bg-main border border-border-light flex items-center justify-center text-accent">
                                                <i class="ri-lightbulb-flash-line text-xl"></i>
                                            </div>
                                            <div class="flex-1">
                                                <h3 class="text-sm font-bold text-text-primary mb-2 uppercase tracking-wide">Sequence Snapshot</h3>
                                                <div id="summary-vision" class="text-xs text-text-secondary mb-3 leading-relaxed"></div>
                                                <div id="summary-tech" class="text-xs text-text-muted font-mono"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Navigation Buttons -->
                            <div class="mt-12 flex justify-between items-center">
                                <button id="btn-back" class="btn-secondary flex items-center gap-2 hidden">
                                    <i class="ri-arrow-left-line"></i>
                                    <span>Back</span>
                                </button>
                                <div id="back-spacer"></div>
                                
                                <button id="btn-next" class="btn-primary flex items-center gap-2">
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
                        b.classList.add('bg-bg-card', 'text-text-primary', 'shadow-sm', 'border-border-light');
                        b.classList.remove('text-text-muted');
                    } else {
                        b.classList.remove('bg-bg-card', 'text-text-primary', 'shadow-sm', 'border-border-light');
                        b.classList.add('text-text-muted');
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
                    p.classList.remove('bg-accent/10', 'border-accent', 'text-text-primary');
                    p.classList.add('bg-bg-sidebar', 'border-border-light', 'text-text-muted');
                    const indicator = p.querySelector('.pill-indicator');
                    indicator.classList.remove('border-accent', 'bg-accent');
                    indicator.classList.add('border-border-light', 'bg-transparent');
                });

                // Select this one
                pill.classList.add('bg-accent/10', 'border-accent', 'text-text-primary');
                pill.classList.remove('bg-bg-sidebar', 'border-border-light', 'text-text-muted');
                const indicator = pill.querySelector('.pill-indicator');
                indicator.classList.add('border-accent', 'bg-accent');
                indicator.classList.remove('border-border-light', 'bg-transparent');

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

                aiSuggestionStatus.innerHTML = `
                    <i class="ri-checkbox-circle-line"></i>
                    <span>Sequence optimized. AI selected ${selectedCount} technologies for your build.</span>
                `;
                aiSuggestionStatus.classList.remove('bg-accent/5', 'border-accent/20', 'text-accent');
                aiSuggestionStatus.classList.add('bg-emerald-500/10', 'border-emerald-500/20', 'text-emerald-500');

                setTimeout(() => {
                    aiSuggestionStatus.classList.add('hidden');
                    aiSuggestionStatus.classList.remove('bg-emerald-500/10', 'border-emerald-500/20', 'text-emerald-500');
                    aiSuggestionStatus.classList.add('bg-accent/5', 'border-accent/20', 'text-accent');
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
                    card.classList.remove('selected', 'border-accent');
                    card.classList.add('border-border-light');
                    checkbox.classList.remove('bg-accent', 'border-accent');
                    checkbox.classList.add('border-border-light');
                    checkIcon.classList.add('opacity-0');

                    // Remove from wizardData
                    wizardData.techStack = wizardData.techStack.filter(t => t.technology !== tech);
                } else {
                    card.classList.add('selected', 'border-accent');
                    card.classList.remove('border-border-light');
                    checkbox.classList.add('bg-accent', 'border-accent');
                    checkbox.classList.remove('border-border-light');
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
                        <span class="px-3 py-1 rounded-full bg-accent/10 text-accent text-[10px] font-bold uppercase tracking-wider border border-accent/20">
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
