export default {
    async mount(container, params) {
        const projectId = params.id;
        console.log("Mounting Forge for Project:", projectId);

        // 1. Inject JSZip
        if (!window.JSZip && !document.getElementById('jszip-script')) {
            const script = document.createElement('script');
            script.id = 'jszip-script';
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
            document.head.appendChild(script);
        }

        // 2. Define Global Handlers (The Fix)
        let currentScaffold = null;
        let activeContext = "Full Stack App"; // Default

        // Check for Blueprint Bridge
        const pendingBlueprint = localStorage.getItem('forge_blueprint');
        if (pendingBlueprint) {
            try {
                const blueprint = JSON.parse(pendingBlueprint);
                activeContext = blueprint;

                // We'll update the UI in renderHTML or here if possible, 
                // but since container.innerHTML is set later, we wait or set a flag.
                // Actually, we can just inject it into the initial HTML state or update after render.
            } catch (e) {
                console.error("Blueprint parse error", e);
            }
            localStorage.removeItem('forge_blueprint');
        }

        // Check for Existing Scaffold
        const savedScaffold = localStorage.getItem('flux_scaffold_status');
        if (savedScaffold) {
            try {
                // Determine if we should show it (maybe just the download button?)
                // For now, let's restore the full tree if we saved the data object
                const data = JSON.parse(savedScaffold);
                currentScaffold = data;

                // Defer render until HTML is injected
                setTimeout(() => {
                    const btn = document.getElementById('btn-generate');
                    if (btn) btn.classList.add('hidden');
                    document.getElementById('btn-download').classList.remove('hidden');
                    window.renderForgeTree(data);
                }, 100);
            } catch (e) {
                console.error("Scaffold restore error", e);
            }
        }
        window.triggerScaffold = async function () {
            console.log("⚡ Triggering Scaffold Sequence...");
            const btn = document.getElementById('btn-generate');
            const loader = document.getElementById('loader');

            if (btn) btn.classList.add('opacity-50', 'cursor-not-allowed');
            if (loader) loader.classList.remove('hidden');

            try {
                // Tries to find the token under standardized name 'flux_token'
                const token = localStorage.getItem('flux_token');

                console.log("🔑 DEBUG: Token found:", token ? "YES (Hidden)" : "NO - NULL!");

                // Direct Fetch
                const response = await fetch('/api/project/' + projectId + '/scaffold', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        // If token exists, send it. If not, don't send header (since we disabled auth on backend)
                        ...(token ? { 'Authorization': 'Bearer ' + token } : {})
                    },
                    body: JSON.stringify({ context: activeContext })
                });

                if (!response.ok) {
                    const txt = await response.text();
                    throw new Error(`Server Error: ${txt}`);
                }

                const data = await response.json();
                console.log("✅ Scaffold Data:", data);

                currentScaffold = data;

                // Save Status
                localStorage.setItem('flux_scaffold_status', JSON.stringify(data));

                window.renderForgeTree(data); // Call helper

                // Swap Buttons
                if (btn) btn.classList.add('hidden');
                document.getElementById('btn-download').classList.remove('hidden');

            } catch (e) {
                console.error("Scaffold Error:", e);
                await window.fluxModal.alert("Scaffold Error", "Failed to generate project scaffold: " + e.message);
            } finally {
                if (loader) loader.classList.add('hidden');
                if (btn) btn.classList.remove('opacity-50', 'cursor-not-allowed');
            }
        };

        window.downloadZip = async function () {
            if (!currentScaffold || !window.JSZip) {
                await window.fluxModal.alert("Download Not Ready", "The project scaffold is not ready for download. Please wait for generation to complete.");
                return;
            }
            const zip = new JSZip();
            const root = currentScaffold.root_directory || "flux_project";
            const folder = zip.folder(root);

            if (currentScaffold.files) {
                currentScaffold.files.forEach(f => folder.file(f.path, f.content));
            }

            const blob = await zip.generateAsync({ type: "blob" });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `${root}.zip`;
            link.click();
        };

        window.renderForgeTree = function (data) {
            const list = document.getElementById('file-list');
            if (!list) return;
            list.innerHTML = '';

            if (!data.files || data.files.length === 0) {
                list.innerHTML = '<div class="text-error p-4 text-xs font-mono uppercase tracking-widest opacity-50 text-center">No_Files_Generated</div>';
                return;
            }

            data.files.forEach(file => {
                const el = document.createElement('div');
                el.className = "flex items-center gap-3 px-4 py-2 text-text-muted hover:text-text-primary hover:bg-bg-card border border-transparent hover:border-border-light rounded-xl cursor-pointer transition-all truncate text-xs font-bold uppercase tracking-wider";
                el.innerHTML = `<i class="ri-file-code-line text-accent"></i> <span class="truncate">${file.path}</span>`;
                el.onclick = () => {
                    // Reset all
                    list.querySelectorAll('div').forEach(d => d.classList.remove('bg-bg-card', 'text-text-primary', 'border-border-light'));
                    el.classList.add('bg-bg-card', 'text-text-primary', 'border-border-light');

                    document.getElementById('current-file').innerHTML = `<i class="ri-file-code-line text-accent mr-2"></i> ${file.path}`;
                    document.getElementById('code-content').textContent = file.content;
                };
                list.appendChild(el);
            });
            if (list.firstChild) list.firstChild.click();
        };

        // 3. Render HTML
        container.innerHTML = `
            <div class="h-[calc(100vh-80px)] max-w-7xl mx-auto p-10 flex flex-col animate-fade-in">
                <div class="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
                    <div>
                        <div class="flex items-center gap-4 mb-3">
                             <div class="p-3 rounded-xl bg-accent text-white shadow-lg shadow-accent/20">
                                <i class="ri-magic-line text-2xl"></i>
                             </div>
                             <h1 class="text-4xl font-serif font-bold text-text-primary tracking-tight">Code Forge</h1>
                        </div>
                        <p class="text-text-secondary text-base leading-relaxed">Synthesis unit: generating architectural foundations and localized logic protocols.</p>
                    </div>
                    <div class="flex gap-4">
                        <button id="btn-generate" onclick="window.triggerScaffold()" class="btn-primary flex items-center gap-3 px-8 py-4 uppercase tracking-widest text-xs">
                            <i class="ri-magic-line"></i> Initialize_Sequence
                        </button>
                         <button id="btn-download" onclick="window.downloadZip()" class="hidden btn-secondary flex items-center gap-3 px-8 py-4 uppercase tracking-widest text-xs">
                            <i class="ri-download-cloud-line text-accent"></i> Export_Package
                        </button>
                    </div>
                </div>

                <div id="workspace" class="flex-1 bg-bg-card border border-border-light rounded-3xl overflow-hidden flex relative shadow-3xl">
                    <div id="loader" class="absolute inset-0 z-20 bg-bg-main/90 backdrop-blur flex flex-col items-center justify-center hidden">
                        <div class="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin mb-6"></div>
                        <div class="font-mono text-accent text-xs uppercase tracking-widest font-bold animate-pulse">Running_DevOps_Protocols...</div>
                    </div>

                    <div class="w-72 bg-bg-sidebar border-r border-border-light flex flex-col">
                        <div class="p-4 text-[10px] font-bold text-text-muted uppercase tracking-widest border-b border-border-light flex items-center justify-between">
                            <span>Project_Explorer</span>
                            <i class="ri-folders-line"></i>
                        </div>
                        <div id="file-list" class="flex-1 overflow-y-auto p-3 space-y-2">
                            <div class="text-text-muted text-[10px] font-mono uppercase tracking-widest p-6 text-center opacity-50">Null_Sequence_Detected</div>
                        </div>
                    </div>

                    <div class="flex-1 flex flex-col bg-bg-main relative">
                        <div class="h-12 bg-bg-sidebar border-b border-border-light flex items-center px-6 justify-between editor-header">
                            <span id="current-file" class="text-text-primary text-[10px] uppercase tracking-widest font-bold font-mono truncate flex items-center gap-2">Ready</span>
                        </div>
                        <pre class="flex-1 overflow-auto p-8 text-sm font-mono text-text-primary leading-relaxed custom-scrollbar bg-bg-main"><code id="code-content" class="block"></code></pre>
                    </div>
                </div>
            </div>
        `;

        // Update UI if bridge active
        if (typeof activeContext === 'object') {
            const statusEl = document.getElementById('current-file');
            if (statusEl) {
                statusEl.innerHTML = `<span class="text-emerald-500 flex items-center gap-2"><i class="ri-link"></i> Linked_to_Plan: ${activeContext.project_name || 'Custom_Architecture'}</span>`;
            }
        }
    }
};
