/**
 * API Wrapper
 * Handles fetch requests with auth headers and SSE streaming.
 */

const API_BASE = '/api';

export const API = {
    /**
     * Set the auth token in local storage
     */
    setToken(token) {
        if (token) {
            localStorage.setItem('flux_token', token);
        } else {
            localStorage.removeItem('flux_token');
        }
    },

    /**
     * Get the auth token
     */
    getToken() {
        return localStorage.getItem('flux_token');
    },

    /**
     * Generic fetch wrapper
     */
    async request(endpoint, options = {}) {
        const token = this.getToken();

        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            ...options,
            headers
        };

        try {
            const response = await fetch(`${API_BASE}${endpoint}`, config);

            // Handle 401 Unauthorized (auto-logout)
            if (response.status === 401 && !endpoint.includes('/auth/login')) {
                this.setToken(null);
                window.location.hash = '#/login';
                throw new Error('Session expired. Please login again.');
            }

            // Handle non-200 errors
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                let errorMessage = `Error ${response.status}: ${response.statusText}`;
                if (errorData.detail) errorMessage = errorData.detail;
                throw new Error(errorMessage);
            }

            return response.json();
        } catch (error) {
            console.error('API Request Failed:', error);
            throw error;
        }
    },

    /**
     * Helper for GET requests
     */
    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    },

    /**
     * Helper for POST requests
     */
    async post(endpoint, body) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(body)
        });
    },

    /**
     * Auth Methods
     */
    async login(email, password) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        // Handle both 'token' and 'access_token' (JWT standard)
        const token = data.token || data.access_token;
        this.setToken(token);
        return data.user;
    },

    async register(email, password, display_name) {
        const data = await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password, display_name })
        });
        this.setToken(data.token);
        return data.user;
    },

    async getMe() {
        return await this.request('/auth/me');
    },

    /**
     * Project Methods
     */
    async getProjects() {
        return await this.request('/projects');
    },

    async createProject(data) {
        return await this.request('/projects', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async getProject(id) {
        return await this.request(`/projects/${id}`);
    },

    async deleteProject(id) {
        return await this.request(`/projects/${id}`, {
            method: 'DELETE'
        });
    },


    async selectBlueprint(projectId, blueprintIndex) {
        return await this.request(`/projects/${projectId}/blueprint`, {
            method: 'PUT',
            body: JSON.stringify({ blueprint_index: blueprintIndex })
        });
    },

    async updateProjectTitle(projectId, title) {
        return await this.request(`/projects/${projectId}`, {
            method: 'PATCH',
            body: JSON.stringify({ title })
        });
    },


    /**
     * SSE Streaming Helper
     */
    streamResearch(projectId, onChunk, onDone, onError) {
        const token = this.getToken();
        const url = `${API_BASE}/projects/${projectId}/research/stream`;

        // Using EventSourcePolyfill if headers needed, but native EventSource doesn't support headers.
        // For simple token auth with EventSource, we can pass token in query param IF supported by backend,
        // OR use fetch for streaming. 
        // Since we controls backend, let's use the fetch-based stream reader for better auth control.
        this.streamWithFetch(url, token, onChunk, onDone, onError);
    },

    streamDoc(projectId, docType, onChunk, onDone, onError) {
        const token = this.getToken();
        const url = `${API_BASE}/projects/${projectId}/plan/stream/${docType}`;
        this.streamWithFetch(url, token, onChunk, onDone, onError);
    },

    async streamWithFetch(url, token, onChunk, onDone, onError) {
        try {
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error(response.statusText);

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');

                // Keep the last partial line in the buffer
                buffer = lines.pop();

                for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (!trimmedLine) continue;

                    let rawData = trimmedLine;
                    // Robustly strip one or more 'data: ' prefixes
                    while (rawData.startsWith('data: ')) {
                        rawData = rawData.slice(6).trim();
                    }

                    if (rawData.startsWith('{') || rawData.startsWith('[')) {
                        try {
                            const data = JSON.parse(rawData);
                            if (data.type === 'done') {
                                if (onDone) onDone(data);
                                return; // Stop processing
                            } else if (data.type === 'error') {
                                if (onError) onError(new Error(data.content));
                                return; // Stop processing
                            } else {
                                if (onChunk) onChunk(data);
                            }
                        } catch (e) {
                            console.warn("Failed to parse JSON despite cleaning prefixes:", rawData);
                        }
                    }
                }
            }
            // Fallback done if stream ends without explicit done message
            if (onDone) onDone();

        } catch (err) {
            console.error("Stream Error:", err);
            if (onError) onError(err);
        }
    }
};
