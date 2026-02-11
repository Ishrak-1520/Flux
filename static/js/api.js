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
                if (errorData.detail) {
                    if (Array.isArray(errorData.detail)) {
                        // Handle FastAPI validation errors (list of objects)
                        errorMessage = errorData.detail
                            .map(err => err.msg || JSON.stringify(err))
                            .join('\n');
                    } else if (typeof errorData.detail === 'object') {
                        errorMessage = JSON.stringify(errorData.detail);
                    } else {
                        errorMessage = errorData.detail;
                    }
                }
                throw new Error(errorMessage);
            }

            // Return JSON if content-type is json
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }

            return response;
        } catch (error) {
            console.error('API Request Failed:', error);
            throw error;
        }
    },

    /**
     * Auth Methods
     */
    async login(email, password) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        this.setToken(data.token);
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
     * Cache for Resumable Streaming
     */
    cache: {
        save(projectId, type, content, isComplete = false) {
            try {
                const key = `flux_stream_${projectId}_${type}`;
                const data = { content, isComplete, timestamp: Date.now() };
                localStorage.setItem(key, JSON.stringify(data));
            } catch (e) {
                console.warn('Cache save failed', e);
            }
        },
        get(projectId, type) {
            try {
                const key = `flux_stream_${projectId}_${type}`;
                const raw = localStorage.getItem(key);
                if (!raw) return null;
                return JSON.parse(raw);
            } catch (e) {
                return null;
            }
        },
        clear(projectId, type) {
            localStorage.removeItem(`flux_stream_${projectId}_${type}`);
        }
    },

    /**
     * SSE Streaming Helper
     */
    streamResearch(projectId, onChunk, onDone, onError, existingText = '') {
        const token = this.getToken();
        const url = `${API_BASE}/projects/${projectId}/research/stream`;

        this.streamWithFetch(url, token, onChunk, onDone, onError, {
            method: 'POST',
            body: JSON.stringify({ existing_text: existingText }),
            cacheKey: { projectId, type: 'research' }
        });
    },

    streamDoc(projectId, docType, onChunk, onDone, onError, existingText = '') {
        const token = this.getToken();
        const url = `${API_BASE}/projects/${projectId}/plan/stream/${docType}`;

        this.streamWithFetch(url, token, onChunk, onDone, onError, {
            method: 'POST',
            body: JSON.stringify({ existing_text: existingText }),
            cacheKey: { projectId, type: docType }
        });
    },

    async streamWithFetch(url, token, onChunk, onDone, onError, options = {}) {
        let fullContent = options.body ? JSON.parse(options.body).existing_text || '' : '';

        try {
            const fetchOptions = {
                method: options.method || 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            };

            if (options.body) {
                fetchOptions.body = options.body;
            }

            const response = await fetch(url, fetchOptions);

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
                                // Mark as complete
                                if (options.cacheKey) {
                                    this.cache.save(options.cacheKey.projectId, options.cacheKey.type, fullContent, true);
                                }
                                if (onDone) onDone(data);
                                return; // Stop processing
                            } else if (data.type === 'error') {
                                if (onError) onError(new Error(data.content));
                                return; // Stop processing
                            } else if (data.type === 'content') {
                                fullContent += data.content;
                                // Cache progress
                                if (options.cacheKey) {
                                    this.cache.save(options.cacheKey.projectId, options.cacheKey.type, fullContent, false);
                                }
                                if (onChunk) onChunk(data);
                            } else {
                                // Other types (like thinking), just pass through
                                if (onChunk) onChunk(data);
                            }
                        } catch (e) {
                            console.warn("Failed to parse JSON despite cleaning prefixes:", rawData);
                        }
                    }
                }
            }
            // Fallback done if stream ends without explicit done message
            if (options.cacheKey) {
                this.cache.save(options.cacheKey.projectId, options.cacheKey.type, fullContent, true);
            }
            if (onDone) onDone();

        } catch (err) {
            console.error("Stream Error:", err);
            if (onError) onError(err);
        }
    }
};
