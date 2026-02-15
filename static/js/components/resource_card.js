/**
 * Resource Card Component
 * Renders learning resources as interactive cards with external links.
 */

/**
 * Renders a list of learning resources as themed cards.
 * @param {Array} resources - Array of resource objects with type, title, url, reason
 * @returns {string} HTML string for resource cards
 */
export function renderResourceList(resources) {
    if (!resources || resources.length === 0) return '';

    return `
        <div class="mt-10 p-8 bg-bg-card border border-border-light rounded-2xl shadow-lg">
            <h3 class="text-xl font-serif font-bold mb-6 flex items-center gap-3 text-text-primary">
                <svg class="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                </svg>
                Learning Resources & Citations
            </h3>
            <p class="text-text-secondary text-sm mb-6">
                Curated resources to help you learn the concepts and technologies discussed above.
            </p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                ${resources.map(res => renderResourceCard(res)).join('')}
            </div>
        </div>
    `;
}

/**
 * Renders a single resource card.
 * @param {Object} res - Resource object with type, title, url, reason
 * @returns {string} HTML string for a single card
 */
function renderResourceCard(res) {
    const typeColors = {
        'Article': 'text-green-500 bg-green-500/10 border-green-500/20',
        'Video': 'text-red-500 bg-red-500/10 border-red-500/20',
        'Documentation': 'text-blue-500 bg-blue-500/10 border-blue-500/20',
        'Tutorial': 'text-orange-500 bg-orange-500/10 border-orange-500/20',
        'Paper': 'text-purple-500 bg-purple-500/10 border-purple-500/20',
    };

    const typeClass = typeColors[res.type] || 'text-text-muted bg-bg-sidebar border-border-light';

    return `
        <a href="${res.url}" target="_blank" rel="noopener noreferrer" 
           class="block group p-5 rounded-xl border border-border-light hover:border-accent transition-all hover:shadow-md bg-bg-main">
            <div class="flex items-start justify-between mb-3">
                <span class="text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded-md ${typeClass} font-bold">
                    ${res.type}
                </span>
                <svg class="w-4 h-4 text-text-muted group-hover:text-accent transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                </svg>
            </div>
            <h4 class="font-semibold text-sm mb-2 text-text-primary group-hover:text-accent transition-colors leading-snug">
                ${res.title}
            </h4>
            <p class="text-xs text-text-secondary leading-relaxed line-clamp-3">
                ${res.reason}
            </p>
        </a>
    `;
}

/**
 * Parses AI response to extract JSON resources block.
 * @param {string} responseText - Full AI response with markdown and JSON
 * @returns {Object} Object with cleanText (markdown) and resources (array)
 */
export function parseResponseWithResources(responseText) {
    const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
    let resources = [];
    let cleanText = responseText;

    if (jsonMatch) {
        try {
            const data = JSON.parse(jsonMatch[1]);
            if (data.resources && Array.isArray(data.resources)) {
                resources = data.resources;
            }
            // Remove the JSON block from the display text
            cleanText = responseText.replace(jsonMatch[0], '').trim();
        } catch (e) {
            console.error("Failed to parse resource JSON:", e);
        }
    }

    // Accumulate in global store for PDF export
    if (!window.fluxResources) {
        window.fluxResources = [];
    }
    if (resources.length > 0) {
        window.fluxResources.push(...resources);
        console.log(`📚 Accumulated ${resources.length} resources. Total: ${window.fluxResources.length}`);
    }

    return { cleanText, resources };
}
