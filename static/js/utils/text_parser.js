// static/js/utils/text_parser.js

window.FluxParser = {
    parse: (rawText) => {
        if (!rawText) return { markdown: '', resources: [] };

        let markdown = rawText;
        let resources = [];

        // 1. Aggressive Regex to capture the JSON block (start to end)
        // Looks for ```json OR ``` followed by { "resources": ... }
        const jsonBlockRegex = /```(?:json)?\s*(\{[\s\S]*?"resources"[\s\S]*?\})\s*```/i;

        const match = markdown.match(jsonBlockRegex);

        if (match) {
            const jsonString = match[1]; // The content inside ``` ... ```

            // A. Try to parse the JSON
            try {
                const data = JSON.parse(jsonString);
                if (data.resources && Array.isArray(data.resources)) {
                    resources = data.resources;
                }
            } catch (e) {
                console.error("FluxParser: JSON Parse Failed", e);
                // Fallback: Try to clean common AI JSON errors (trailing commas, etc)
            }

            // B. STRIP the entire code block from the markdown
            // This hides it from the user's view
            markdown = markdown.replace(match[0], '').trim();
        }

        return { markdown, resources };
    }
};
