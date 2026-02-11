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
                console.log("✅ Blueprint Detected:", blueprint);
                activeContext = blueprint;

                // We'll update the UI in renderHTML or here if possible, 
                // but since container.innerHTML is set later, we wait or set a flag.
                // Actually, we can just inject it into the initial HTML state or update after render.
            } catch (e) {
                console.error("Blueprint parse error", e);
            }
            localStorage.removeItem('forge_blueprint');
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
                window.renderForgeTree(data); // Call helper

                // Swap Buttons
                if (btn) btn.classList.add('hidden');
                document.getElementById('btn-download').classList.remove('hidden');

            } catch (e) {
                console.error("Scaffold Error:", e);
                alert("Error: " + e.message);
            } finally {
                if (loader) loader.classList.add('hidden');
                if (btn) btn.classList.remove('opacity-50', 'cursor-not-allowed');
            }
        };

        window.downloadZip = async function () {
            if (!currentScaffold || !window.JSZip) {
                alert("Not ready. Please wait.");
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
                list.innerHTML = '<div class="text-red-400 p-2 text-xs">No files.</div>';
                return;
            }

            data.files.forEach(file => {
                const el = document.createElement('div');
                el.className = "flex items-center gap-2 px-2 py-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded cursor-pointer transition-colors truncate";
                el.innerHTML = `<i class="ri-file-code-line"></i> <span class="truncate text-xs">${file.path}</span>`;
                el.onclick = () => {
                    document.getElementById('current-file').textContent = file.path;
                    document.getElementById('code-content').textContent = file.content;
                };
                list.appendChild(el);
            });
            if (list.firstChild) list.firstChild.click();
        };

        // 3. Render HTML with INLINE HANDLERS
        container.innerHTML = `
            <div class="h-[calc(100vh-80px)] max-w-7xl mx-auto p-6 flex flex-col">
                <div class="flex justify-between items-center mb-6">
                    <div>
                        <h1 class="text-3xl font-bold text-white flex items-center gap-3">
                            <i class="ri-hammer-line text-purple-400"></i> The Forge
                        </h1>
                        <p class="text-gray-400 text-sm font-mono">Auto-Scaffolding Engine</p>
                    </div>
                    <div class="flex gap-3">
                        <button id="btn-generate" onclick="window.triggerScaffold()" class="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold shadow-lg shadow-purple-500/20 transition-all flex items-center gap-2 cursor-pointer">
                            <i class="ri-cpu-line"></i> Initialize Scaffold
                        </button>
                         <button id="btn-download" onclick="window.downloadZip()" class="hidden px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-bold shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2 cursor-pointer">
                            <i class="ri-download-cloud-line"></i> Download ZIP
                        </button>
                    </div>
                </div>

                <div id="workspace" class="flex-1 bg-gray-900/50 border border-white/10 rounded-xl overflow-hidden flex relative">
                    <div id="loader" class="absolute inset-0 z-20 bg-gray-900/90 backdrop-blur flex flex-col items-center justify-center hidden">
                        <div class="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-4"></div>
                        <div class="font-mono text-purple-300 animate-pulse">Running DevOps Protocols...</div>
                    </div>

                    <div class="w-64 bg-black/20 border-r border-white/5 flex flex-col">
                        <div class="p-3 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-white/5">Explorer</div>
                        <div id="file-list" class="flex-1 overflow-y-auto p-2 space-y-1 font-mono text-sm">
                            <div class="text-gray-600 text-xs italic p-2 text-center">No scaffold generated.</div>
                        </div>
                    </div>

                    <div class="flex-1 flex flex-col bg-[#1e1e1e]">
                        <div class="h-10 bg-[#252526] border-b border-white/5 flex items-center px-4 justify-between">
                            <span id="current-file" class="text-gray-300 text-sm font-mono"></span>
                        </div>
                        <pre class="flex-1 overflow-auto p-4 text-sm font-mono text-gray-300 leading-relaxed custom-scrollbar"><code id="code-content"></code></pre>
                    </div>
                </div>
            </div>
        `;

        // Update UI if bridge active
        if (typeof activeContext === 'object') {
            const statusEl = document.getElementById('current-file');
            if (statusEl) {
                statusEl.innerHTML = `< span class="text-green-400 flex items-center gap-2" > <i class="ri-link"></i> Linked to Plan: ${activeContext.project_name || 'Custom Architecture'}</span > `;
            }
        }
    }
};
