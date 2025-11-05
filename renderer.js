// renderer.js
const { ipcRenderer, shell } = require('electron');

// =================================================================================
// === Глобальное Состояние и Утилиты ===
// =================================================================================

const AppState = {
    currentView: 'search',
    settings: {},
    translations: {},
    appVersion: 'N/A',
    systemTheme: 'light', // НОВОЕ: Хранение системной темы
    searchResults: [],
    selectedIndex: -1,
    isInitialized: false,
    iconCache: new Map(), 
    hintShown: false, // НОВОЕ: Флаг показа подсказки
};

const Utils = {
    getElement: (selector) => document.querySelector(selector),
    getAllElements: (selector) => document.querySelectorAll(selector),
    
    formatString: (str, ...args) => {
        let formatted = str;
        args.forEach(arg => {
            formatted = formatted.replace('%s', arg);
        });
        return formatted;
    },
    
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    createElement: (tag, options = {}) => {
        const element = document.createElement(tag);
        if (options.className) element.className = options.className;
        if (options.text) element.textContent = options.text;
        return element;
    },

    escapeHtml: (unsafe) => {
        if (typeof unsafe !== 'string') return '';
        return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    },

    hexToRgba: (hex, alpha = 1) => {
        if (!hex) return null;
        let clean = hex.replace('#', '');
        if (clean.length === 3) {
            clean = clean.split('').map(char => char + char).join('');
        }
        if (clean.length !== 6) return null;
        const r = parseInt(clean.slice(0, 2), 16);
        const g = parseInt(clean.slice(2, 4), 16);
        const b = parseInt(clean.slice(4, 6), 16);
        if ([r, g, b].some(Number.isNaN)) return null;
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
};

const AppIconFallbacks = {
    cache: {
        whatsapp: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHZpZXdCb3g9JzAgMCA2NCA2NCc+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSdnJyB4MT0nMCUnIHkxPScwJScgeDI9JzEwMCUnIHkyPScxMDAlJz48c3RvcCBvZmZzZXQ9JzAlJyBzdG9wLWNvbG9yPScjMjVEMzY2Jy8+PHN0b3Agb2Zmc2V0PScxMDAlJyBzdG9wLWNvbG9yPScjMTI4QzdFJy8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHBhdGggZmlsbD0ndXJsKCNnKScgZD0nTTMyIDRjMTUuNDY0IDAgMjggMTIuNTM2IDI4IDI4IDAgMTUuNDYzLTEyLjUzNiAyOC0yOCAyOC00Ljc0IDAtOS4yMDYtMS4xNy0xMy4xMy0zLjIzNEw0IDYwbDMuNTAyLTE0LjU5NEM1LjM0NiA0MS41MiA0IDM2LjkwMiA0IDMyIDQgMTYuNTM2IDE2LjUzNiA0IDMyIDR6Jy8+PHBhdGggZmlsbD0nI0Y1RkRGOScgZD0nTTI0LjI1OCAxOC41Yy0uNTYyLTEuMjE2LTEuMTYtMS4yNC0xLjY5NC0xLjI2LS40MzgtLjAxOC0uOTQtLjAxNy0xLjQ0Mi0uMDE3LS41MDQgMC0xLjMyLjE5LTIuMDEuOTUtLjY5Ljc2LTIuNjM1IDIuNTc0LTIuNjM1IDYuMjggMCAzLjcwNiAyLjY5NiA3LjI5IDMuMDc0IDcuNzk1LjM3OC41MDYgNS4yMDQgOC4zMzkgMTIuODIzIDExLjM1IDYuMzQzIDIuNTA0IDcuNjIgMi4wMDYgOS4wMDUgMS44ODEgMS4zODYtLjEyNiA0LjQzMi0xLjgwOCA1LjA2LTMuNTU3LjYzLTEuNzUuNjMtMy4yNDguNDQtMy41NTctLjE5LS4zMS0uNjktLjUtMS40NC0uODc2LS43NS0uMzc3LTQuNDMtMi4xODYtNS4xMTgtMi40MzctLjY5LS4yNTItMS4xOTItLjM3OC0xLjY5NC4zOC0uNTA0Ljc1Ni0xLjk0NCAyLjQzNy0yLjM4MyAyLjkzNS0uNDQuNS0uODc3LjU2Ni0xLjYzLjE5LS43NTMtLjM3Ny0zLjE4LTEuMTc2LTYuMDUtMy43NDYtMi4yMzctMS45OTYtMy43NDQtNC40Ni00LjE4Mi01LjIxNi0uNDM4LS43NTYtLjA0Ny0xLjE2NS4zMy0xLjU0LjMzOC0uMzM1Ljc1My0uODc2IDEuMTMtMS4zMTQuMzgtLjQzOC41MDQtLjc1Ljc1Ni0xLjI1Mi4yNTItLjUuMTI2LS45NC0uMDYzLTEuMzE3LS4xOS0uMzc3LTEuNjczLTQuMTUtMi4yOC01LjY2NnonLz48L3N2Zz4=',
        roblox: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHZpZXdCb3g9JzAgMCA2NCA2NCc+PHJlY3Qgd2lkdGg9JzQwJyBoZWlnaHQ9JzQwJyB4PScxMicgeT0nMTInIHJ4PSc4JyByeT0nOCcgZmlsbD0nIzIwMjAyMCcgdHJhbnNmb3JtPSdyb3RhdGUoMTUgMzIgMzIpJy8+PHJlY3Qgd2lkdGg9JzEwJyBoZWlnaHQ9JzEwJyB4PScyNycgeT0nMjcnIGZpbGw9JyNmZmZmZmYnIHRyYW5zZm9ybT0ncm90YXRlKDE1IDMyIDMyKScvPjwvc3ZnPg=='
    },

    forcePatterns: ['whatsapp'],

    get(name = '', path = '') {
        const normalizedName = String(name).toLowerCase();
        const normalizedPath = String(path).toLowerCase();

        if (normalizedName.includes('whatsapp') || normalizedPath.includes('whatsapp')) {
            return this.cache.whatsapp;
        }

        if (normalizedName.includes('roblox') || normalizedPath.includes('roblox')) {
            return this.cache.roblox;
        }

        return null;
    },

    shouldForceFallback(name = '', path = '') {
        const normalizedName = String(name).toLowerCase();
        const normalizedPath = String(path).toLowerCase();
        return this.forcePatterns.some(pattern =>
            normalizedName.includes(pattern) || normalizedPath.includes(pattern)
        );
    }
};

const SubscriptionFeatureLabels = {
    'addon-builder': 'subscription_feature_master_addons',
    'unlimited-automations': 'subscription_feature_unlimited_automations',
    'priority-support': 'subscription_feature_priority_support',
    'full-clipboard-history': 'subscription_feature_full_clipboard',
    'extended-gallery': 'subscription_feature_gallery',
    'automations-limited': 'subscription_feature_automations_limit',
    'clipboard-limited': 'subscription_feature_clipboard_limit',
    'no-addon-builder': 'subscription_feature_no_addon_builder',
    default: 'subscription_feature_default'
};

const SubscriptionPlanDefinitions = {
    free: {
        id: 'free',
        nameKey: 'subscription_free_plan_name',
        descriptionKey: 'subscription_free_plan_description',
        automationLimit: 3,
        clipboardLimit: 10,
        hasAddonBuilder: false,
        features: [
            { storageKey: 'automations-limited', labelKey: 'subscription_feature_automations_limit', args: (plan) => [plan.automationLimit] },
            { storageKey: 'clipboard-limited', labelKey: 'subscription_feature_clipboard_limit', args: (plan) => [plan.clipboardLimit] },
            { storageKey: 'no-addon-builder', labelKey: 'subscription_feature_no_addon_builder' }
        ]
    },
    pro: {
        id: 'pro',
        nameKey: 'subscription_premium_plan_name',
        descriptionKey: 'subscription_premium_plan_description',
        automationLimit: null,
        clipboardLimit: null,
        hasAddonBuilder: true,
        features: [
            { storageKey: 'addon-builder', labelKey: 'subscription_feature_master_addons' },
            { storageKey: 'unlimited-automations', labelKey: 'subscription_feature_unlimited_automations' },
            { storageKey: 'priority-support', labelKey: 'subscription_feature_priority_support' },
            { storageKey: 'full-clipboard-history', labelKey: 'subscription_feature_full_clipboard' }
        ]
    }
};

const QuickActionCatalog = [
    {
        id: 'apps-library',
        icon: 'grid',
        nameKey: 'title_apps_library',
        description: 'Open the application library panel.',
        descriptionKey: 'quick_action_desc_apps_library',
        type: 'panel',
        payload: { panel: 'apps-library' },
        accent: '#38bdf8',
        tags: ['panel', 'default']
    },
    {
        id: 'files',
        icon: 'folder',
        nameKey: 'title_files',
        description: 'Browse indexed files and folders.',
        descriptionKey: 'quick_action_desc_files',
        type: 'panel',
        payload: { panel: 'files' },
        accent: '#22d3ee',
        tags: ['panel', 'default']
    },
    {
        id: 'commands',
        icon: 'command',
        nameKey: 'title_commands',
        description: 'Trigger saved commands and automations.',
        descriptionKey: 'quick_action_desc_commands',
        type: 'panel',
        payload: { panel: 'commands' },
        accent: '#f97316',
        tags: ['panel', 'default']
    },
    {
        id: 'clipboard',
        icon: 'copy',
        nameKey: 'title_clipboard',
        description: 'Review your clipboard buffer.',
        descriptionKey: 'quick_action_desc_clipboard',
        type: 'panel',
        payload: { panel: 'clipboard' },
        accent: '#a855f7',
        tags: ['panel', 'default']
    },
    {
        id: 'settings',
        icon: 'settings',
        nameKey: 'context_settings',
        description: 'Jump straight to FlashSearch settings.',
        descriptionKey: 'quick_action_desc_settings',
        type: 'view',
        payload: { view: 'settings' },
        accent: '#facc15',
        tags: ['system', 'default']
    },
    {
        id: 'pinned-apps',
        icon: 'bookmark',
        name: 'Pinned applications',
        nameKey: 'quick_action_name_pinned_apps',
        description: 'Open the pinned applications panel instantly.',
        descriptionKey: 'quick_action_desc_pinned_apps',
        type: 'panel',
        payload: { panel: 'apps-library', anchor: 'pinned' },
        accent: '#34d399',
        tags: ['panel']
    }
];

const QuickActionDefaultOrder = ['apps-library', 'files', 'commands', 'clipboard', 'settings'];

const QuickActionTools = {
    toText(value) {
        if (value === null || value === undefined) return '';
        if (typeof value === 'string') return value;
        if (typeof value === 'object') {
            try {
                return JSON.stringify(value, null, 2);
            } catch (error) {
                console.warn('Failed to stringify object', error);
                return String(value);
            }
        }
        return String(value);
    },

    toLines(value) {
        return this.toText(value).split(/\r?\n/);
    },

    fromLines(lines) {
        return Array.isArray(lines) ? lines.join('\n') : '';
    },

    parseJson(value) {
        if (value === null || value === undefined || value === '') {
            return { data: null, error: null };
        }
        if (typeof value === 'object') {
            try {
                return { data: JSON.parse(JSON.stringify(value)), error: null };
            } catch (error) {
                return { data: null, error: error.message };
            }
        }
        const text = String(value).trim();
        if (!text) {
            return { data: null, error: null };
        }
        try {
            return { data: JSON.parse(text), error: null };
        } catch (error) {
            return { data: null, error: error.message };
        }
    },

    ensureObject(value) {
        const parsed = this.parseJson(value);
        if (!parsed || parsed.error || typeof parsed.data !== 'object' || parsed.data === null) {
            return {};
        }
        return parsed.data;
    },

    splitPath(path) {
        if (typeof path !== 'string') return [];
        return path
            .replace(/\[(\d+)\]/g, '.$1')
            .split('.')
            .map(segment => segment.trim())
            .filter(Boolean);
    },

    getPath(source, path) {
        if (!source) return undefined;
        const segments = this.splitPath(path);
        let current = source;
        for (const segment of segments) {
            if (current === undefined || current === null) return undefined;
            const key = /^\d+$/.test(segment) ? Number(segment) : segment;
            current = current[key];
        }
        return current;
    },

    setPath(source, path, value) {
        if (typeof source !== 'object' || source === null) return source;
        const segments = this.splitPath(path);
        if (segments.length === 0) return source;
        let current = source;
        segments.forEach((segment, index) => {
            const key = /^\d+$/.test(segment) ? Number(segment) : segment;
            const isLast = index === segments.length - 1;
            if (isLast) {
                current[key] = value;
            } else {
                const nextSegment = segments[index + 1];
                const shouldBeArray = /^\d+$/.test(nextSegment);
                if (typeof current[key] !== 'object' || current[key] === null) {
                    current[key] = shouldBeArray ? [] : {};
                }
                current = current[key];
            }
        });
        return source;
    },

    deepMerge(target, source) {
        const base = (typeof target === 'object' && target !== null) ? (Array.isArray(target) ? [...target] : { ...target }) : {};
        if (typeof source !== 'object' || source === null) return base;
        Object.keys(source).forEach(key => {
            const value = source[key];
            if (Array.isArray(value)) {
                base[key] = value.slice();
            } else if (typeof value === 'object' && value !== null) {
                base[key] = this.deepMerge(base[key], value);
            } else {
                base[key] = value;
            }
        });
        return base;
    },

    clone(value) {
        if (typeof structuredClone === 'function') {
            try {
                return structuredClone(value);
            } catch (error) {
                console.warn('structuredClone failed, fallback to JSON clone', error);
            }
        }
        try {
            return JSON.parse(JSON.stringify(value));
        } catch (error) {
            return value;
        }
    },

    randomString(length = 12) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        if (window.crypto?.getRandomValues) {
            const array = new Uint32Array(length);
            window.crypto.getRandomValues(array);
            return Array.from(array, value => chars[value % chars.length]).join('');
        }
        let output = '';
        for (let i = 0; i < length; i += 1) {
            output += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return output;
    },

    randomNumber(min = 0, max = 1) {
        const safeMin = Number(min);
        const safeMax = Number(max);
        if (!Number.isFinite(safeMin) || !Number.isFinite(safeMax)) return Math.random();
        return safeMin + Math.random() * (safeMax - safeMin);
    },

    uuid() {
        if (window.crypto?.randomUUID) {
            return window.crypto.randomUUID();
        }
        return `${Date.now().toString(16)}-${this.randomString(12)}`;
    },

    unique(values) {
        return Array.from(new Set(Array.isArray(values) ? values : []));
    },

    shuffle(values) {
        const array = Array.isArray(values) ? values.slice() : [];
        for (let i = array.length - 1; i > 0; i -= 1) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    },

    escapeRegExp(value) {
        return this.toText(value).replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    },

    formatNumber(value, locales = 'en-US', options = {}) {
        const number = Number(value);
        if (!Number.isFinite(number)) return String(value ?? '');
        try {
            return new Intl.NumberFormat(locales || undefined, options || undefined).format(number);
        } catch (error) {
            console.warn('Number formatting failed', error);
            return String(number);
        }
    },

    formatDate(value, locales = 'en-US', options = {}) {
        const date = value instanceof Date ? value : new Date(value);
        if (Number.isNaN(date.getTime())) return String(value ?? '');
        try {
            return new Intl.DateTimeFormat(locales || undefined, options || undefined).format(date);
        } catch (error) {
            console.warn('Date formatting failed', error);
            return date.toISOString();
        }
    },

    dateDiff(start, end, unit = 'seconds') {
        const startDate = start instanceof Date ? start : new Date(start);
        const endDate = end instanceof Date ? end : new Date(end);
        if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
            return NaN;
        }
        const diffMs = endDate.getTime() - startDate.getTime();
        switch (unit) {
            case 'minutes':
                return diffMs / 60000;
            case 'hours':
                return diffMs / 3600000;
            case 'days':
                return diffMs / 86400000;
            case 'milliseconds':
                return diffMs;
            case 'seconds':
            default:
                return diffMs / 1000;
        }
    },

    base64Encode(value) {
        try {
            return btoa(unescape(encodeURIComponent(this.toText(value))));
        } catch (error) {
            console.warn('Base64 encode failed', error);
            return this.toText(value);
        }
    },

    base64Decode(value) {
        try {
            return decodeURIComponent(escape(atob(this.toText(value))));
        } catch (error) {
            console.warn('Base64 decode failed', error);
            return this.toText(value);
        }
    },

    urlEncode(value) {
        try {
            return encodeURIComponent(this.toText(value));
        } catch (error) {
            return this.toText(value);
        }
    },

    urlDecode(value) {
        try {
            return decodeURIComponent(this.toText(value));
        } catch (error) {
            return this.toText(value);
        }
    },

    applyTemplate(template, context = {}, config = {}) {
        if (typeof template !== 'string') return template;
        const payloadText = this.toText(context.payload);
        let result = template.replace(/\{\{\s*payload\s*\}\}/gi, payloadText);
        result = result.replace(/\{\{\s*var\.([a-z0-9_-]+)\s*\}\}/gi, (_, key) => {
            const value = context.vars?.[key];
            return value === undefined ? '' : this.toText(value);
        });
        result = result.replace(/\{\{\s*config\.([a-z0-9_-]+)\s*\}\}/gi, (_, key) => {
            const value = config?.[key];
            return value === undefined ? '' : this.toText(value);
        });
        return result;
    }
};

const QuickActionApi = {
    async request(endpoint, options = {}) {
        const url = String(endpoint || '').trim();
        if (!url) {
            return { error: 'Endpoint is empty.' };
        }
        try {
            const response = await fetch(url, {
                method: options.method || 'GET',
                headers: options.headers,
                body: options.body
            });
            let text = '';
            if (options.readBody !== false) {
                text = await response.text();
            }
            return { response, text, status: response.status, ok: response.ok };
        } catch (error) {
            return { error: error.message };
        }
    },

    async requestJson(endpoint, options = {}) {
        const result = await this.request(endpoint, options);
        if (result.error) return result;
        if (options.readBody === false) {
            return { ...result, data: null };
        }
        if (!result.text) {
            return { ...result, data: null };
        }
        try {
            const data = JSON.parse(result.text);
            return { ...result, data };
        } catch (error) {
            return { ...result, data: null, parseError: error.message };
        }
    }
};

function createAiChatModule({
    id,
    name,
    nameKey,
    description,
    descriptionKey,
    icon,
    accent,
    tags = [],
    systemPrompt,
    userPrompt,
    extraConfig = []
}) {
    const extraDefaults = {};
    const extraFormFields = extraConfig.map(field => {
        if (field?.key) {
            extraDefaults[field.key] = field.defaultValue ?? '';
        }
        return {
            key: field.key,
            label: field.label,
            type: field.type || 'text',
            placeholder: field.placeholder || '',
            rows: field.rows,
            options: field.options,
            min: field.min,
            max: field.max,
            step: field.step
        };
    });

    return {
        id,
        category: 'action',
        name,
        nameKey,
        description,
        descriptionKey,
        icon,
        accent,
        tags,
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: {
            endpoint: 'https://api.openai.com/v1/chat/completions',
            apiKey: '',
            model: 'gpt-3.5-turbo',
            temperature: 0.7,
            systemPrompt,
            userPrompt,
            ...extraDefaults
        },
        form: [
            { key: 'endpoint', label: 'API endpoint', type: 'text', placeholder: 'https://api.openai.com/v1/chat/completions' },
            { key: 'apiKey', label: 'API key (optional)', type: 'text', placeholder: 'sk-…' },
            { key: 'model', label: 'Model', type: 'text', placeholder: 'gpt-3.5-turbo' },
            { key: 'temperature', label: 'Temperature', type: 'number', min: 0, max: 2, step: 0.1 },
            { key: 'systemPrompt', label: 'System prompt', type: 'textarea', rows: 2, placeholder: systemPrompt },
            { key: 'userPrompt', label: 'User prompt', type: 'textarea', rows: 3, placeholder: userPrompt },
            ...extraFormFields
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const endpoint = String(config?.endpoint || '').trim();
            if (!endpoint) {
                clone.logs.push(`${name} skipped: endpoint is missing.`);
                return [clone];
            }

            const headers = { 'Content-Type': 'application/json' };
            if (config?.apiKey) {
                headers.Authorization = `Bearer ${config.apiKey}`;
            }

            const temperature = Number(config?.temperature);
            const safeTemperature = Number.isFinite(temperature) ? Math.min(Math.max(temperature, 0), 2) : 0.7;
            const system = QuickActionTools.applyTemplate(config?.systemPrompt ?? systemPrompt, clone, config);
            const user = QuickActionTools.applyTemplate(config?.userPrompt ?? userPrompt, clone, config);

            const body = JSON.stringify({
                model: config?.model || 'gpt-3.5-turbo',
                temperature: safeTemperature,
                messages: [
                    { role: 'system', content: system || 'You are a helpful assistant.' },
                    { role: 'user', content: user || QuickActionTools.toText(clone.payload) }
                ]
            });

            const result = await QuickActionApi.requestJson(endpoint, { method: 'POST', headers, body });
            if (result.error) {
                clone.logs.push(`${name} failed: ${result.error}`);
                return [clone];
            }

            let output = '';
            if (Array.isArray(result.data?.choices) && result.data.choices.length > 0) {
                output = result.data.choices[0]?.message?.content || '';
            }
            if (!output) {
                output = typeof result.data === 'string' ? result.data : (result.text || '');
            }

            clone.payload = output;
            if (result.data !== undefined) {
                clone.vars.lastAiResponse = result.data;
            }
            clone.vars.lastStatus = result.status ?? clone.vars.lastStatus;
            clone.logs.push(`${name} completed with status ${result.status ?? 'n/a'}.`);
            return [clone];
        }
    };
}

function createHttpModule({
    id,
    name,
    nameKey,
    description,
    descriptionKey,
    method,
    icon,
    accent,
    tags = [],
    includeBody = false,
    bodyPlaceholder = '{"key":"value"}'
}) {
    return {
        id,
        category: 'action',
        name,
        nameKey,
        description,
        descriptionKey,
        icon,
        accent,
        tags,
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: {
            url: 'https://api.example.com/resource',
            headers: '',
            body: includeBody ? bodyPlaceholder : '',
            bodyMode: includeBody ? 'custom' : 'payload'
        },
        form: [
            { key: 'url', label: 'Request URL', type: 'text', placeholder: 'https://api.example.com/resource' },
            { key: 'headers', label: 'Headers (JSON)', type: 'textarea', rows: 3, placeholder: '{ "Authorization": "Bearer token" }' },
            ...(includeBody ? [
                {
                    key: 'bodyMode',
                    label: 'Body source',
                    type: 'select',
                    options: [
                        { value: 'payload', label: 'Use current payload' },
                        { value: 'custom', label: 'Custom JSON body' }
                    ]
                },
                { key: 'body', label: 'Body (JSON)', type: 'textarea', rows: 4, placeholder: bodyPlaceholder }
            ] : [])
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const url = String(config?.url || '').trim();
            if (!url) {
                clone.logs.push(`${name} skipped: URL is missing.`);
                return [clone];
            }

            let headers = {};
            if (config?.headers) {
                const parsedHeaders = QuickActionTools.parseJson(config.headers);
                if (parsedHeaders.error) {
                    clone.logs.push(`${name} headers error: ${parsedHeaders.error}`);
                } else if (parsedHeaders.data) {
                    headers = parsedHeaders.data;
                }
            }

            let body;
            if (includeBody) {
                const mode = config?.bodyMode || 'custom';
                if (mode === 'payload') {
                    body = QuickActionTools.toText(clone.payload);
                } else if (config?.body) {
                    body = config.body;
                }
                if (body && typeof body === 'object') {
                    body = JSON.stringify(body);
                }
                if (body && !headers['Content-Type']) {
                    headers['Content-Type'] = 'application/json';
                }
            }

            const options = { method, headers, body };
            if (method === 'HEAD') {
                options.readBody = false;
            }

            const result = await QuickActionApi.requestJson(url, options);
            if (result.error) {
                clone.logs.push(`${name} failed: ${result.error}`);
                return [clone];
            }

            const status = result.status ?? result.response?.status ?? 'n/a';
            clone.vars.lastStatus = status;
            if (result.response?.headers) {
                const headerStore = {};
                try {
                    result.response.headers.forEach((value, key) => {
                        headerStore[key] = value;
                    });
                    clone.vars.lastResponseHeaders = headerStore;
                } catch (error) {
                    console.warn('Failed to serialise headers', error);
                }
            }

            if (method === 'HEAD') {
                clone.payload = `HEAD ${status}`;
                clone.logs.push(`${name} completed with status ${status}.`);
                return [clone];
            }

            if (result.data !== null && result.data !== undefined) {
                clone.vars.lastResponse = result.data;
                clone.payload = typeof result.data === 'string' ? result.data : JSON.stringify(result.data, null, 2);
            } else {
                clone.vars.lastResponse = result.text;
                clone.payload = result.text || '';
                if (result.parseError) {
                    clone.logs.push(`${name} parse warning: ${result.parseError}`);
                }
            }

            clone.logs.push(`${name} completed with status ${status}.`);
            return [clone];
        }
    };
}

const QuickActionModuleDefinitions = [
    {
        id: 'manual-trigger',
        category: 'trigger',
        name: 'Manual trigger',
        nameKey: 'qa_module_manual_trigger_name',
        description: 'Starts when you press the quick action button.',
        descriptionKey: 'qa_module_manual_trigger_description',
        icon: 'play-circle',
        accent: '#38bdf8',
        inputs: [],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: {},
        run: async (context) => {
            return [QuickActionContext.clone(context)];
        }
    },
    {
        id: 'open-panel',
        category: 'action',
        name: 'Open panel',
        nameKey: 'qa_module_open_panel_name',
        description: 'Show one of the auxiliary panels such as clipboard or files.',
        descriptionKey: 'qa_module_open_panel_description',
        icon: 'layout',
        accent: '#38bdf8',
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { panel: 'clipboard' },
        form: [
            {
                key: 'panel',
                label: 'Panel',
                type: 'select',
                options: [
                    { value: 'clipboard', label: 'Clipboard buffer' },
                    { value: 'files', label: 'Files' },
                    { value: 'commands', label: 'Commands' },
                    { value: 'apps-library', label: 'Apps library' }
                ]
            }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            if (config?.panel) {
                AuxPanelManager.openPanel(config.panel);
            }
            return [clone];
        }
    },
    {
        id: 'open-url',
        category: 'action',
        name: 'Open website',
        nameKey: 'qa_module_open_url_name',
        description: 'Launch a URL in your default browser.',
        descriptionKey: 'qa_module_open_url_description',
        icon: 'globe',
        accent: '#22d3ee',
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { url: 'https://flashsearch.app' },
        form: [
            { key: 'url', label: 'Website URL', type: 'text', placeholder: 'https://example.com' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            if (config?.url) {
                try {
                    await shell.openExternal(config.url);
                } catch (error) {
                    console.warn('Failed to open URL', error);
                }
            }
            return [clone];
        }
    },
    {
        id: 'copy-text',
        category: 'action',
        name: 'Copy text',
        nameKey: 'qa_module_copy_text_name',
        description: 'Copy prepared text into the clipboard.',
        descriptionKey: 'qa_module_copy_text_description',
        icon: 'clipboard',
        accent: '#a855f7',
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { text: 'Hello from FlashSearch!' },
        form: [
            { key: 'text', label: 'Text', type: 'textarea', rows: 4, placeholder: 'Enter text to copy' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            if (config?.text) {
                ipcRenderer.send('copy-to-clipboard', config.text);
                clone.payload = config.text;
            }
            return [clone];
        }
    },
    {
        id: 'run-command',
        category: 'action',
        name: 'Run shell command',
        nameKey: 'qa_module_run_command_name',
        description: 'Execute a terminal command on your system.',
        descriptionKey: 'qa_module_run_command_description',
        icon: 'terminal',
        accent: '#f97316',
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { command: 'echo FlashSearch quick action' },
        form: [
            { key: 'command', label: 'Command', type: 'textarea', rows: 3, placeholder: 'echo FlashSearch quick action' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            if (config?.command) {
                ipcRenderer.invoke('quick-action-run-command', config.command).catch(error => {
                    console.error('Command execution failed', error);
                });
            }
            return [clone];
        }
    },
    {
        id: 'show-notification',
        category: 'action',
        name: 'Show notification',
        nameKey: 'qa_module_show_notification_name',
        description: 'Display a desktop notification with custom text.',
        descriptionKey: 'qa_module_show_notification_description',
        icon: 'bell',
        accent: '#facc15',
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { title: 'FlashSearch', body: 'Workflow finished!' },
        form: [
            { key: 'title', label: 'Title', type: 'text', placeholder: 'FlashSearch' },
            { key: 'body', label: 'Message', type: 'textarea', rows: 3, placeholder: 'Workflow finished!' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            if (Notification.permission === 'default') {
                Notification.requestPermission().catch(() => {});
            }
            if (Notification.permission === 'granted') {
                new Notification(config?.title || 'FlashSearch', { body: config?.body || '' });
            }
            return [clone];
        }
    },
    {
        id: 'delay',
        category: 'utility',
        name: 'Delay',
        nameKey: 'qa_module_delay_name',
        description: 'Pause the workflow for a specified time.',
        descriptionKey: 'qa_module_delay_description',
        icon: 'clock',
        accent: '#fbbf24',
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { milliseconds: 1000 },
        form: [
            { key: 'milliseconds', label: 'Delay (ms)', type: 'number', min: 0 }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const timeout = Math.max(0, parseInt(config?.milliseconds, 10) || 0);
            if (timeout > 0) {
                await new Promise(resolve => setTimeout(resolve, timeout));
            }
            return [clone];
        }
    },
    {
        id: 'set-payload',
        category: 'utility',
        name: 'Set payload',
        nameKey: 'qa_module_set_payload_name',
        description: 'Store a value that can be reused by next blocks.',
        descriptionKey: 'qa_module_set_payload_description',
        icon: 'edit-3',
        accent: '#60a5fa',
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { payload: 'Sample text' },
        form: [
            { key: 'payload', label: 'Payload value', type: 'textarea', rows: 3, placeholder: 'Value to store for later blocks' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            clone.payload = config?.payload ?? clone.payload;
            return [clone];
        }
    },
    {
        id: 'use-payload-as-text',
        category: 'action',
        name: 'Use payload as text',
        nameKey: 'qa_module_use_payload_as_text_name',
        description: 'Copy the current payload value to the clipboard.',
        descriptionKey: 'qa_module_use_payload_as_text_description',
        icon: 'clipboard',
        accent: '#22c55e',
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: {},
        run: async (context) => {
            const clone = QuickActionContext.clone(context);
            if (clone?.payload) {
                ipcRenderer.send('copy-to-clipboard', clone.payload);
            }
            return [clone];
        }
    },
    {
        id: 'fetch-json',
        category: 'utility',
        name: 'Fetch JSON',
        nameKey: 'qa_module_fetch_json_name',
        description: 'Request JSON data and store it as the workflow payload.',
        descriptionKey: 'qa_module_fetch_json_description',
        icon: 'download-cloud',
        accent: '#38bdf8',
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { url: 'https://api.example.com/data', format: 'pretty' },
        form: [
            { key: 'url', label: 'Request URL', type: 'text', placeholder: 'https://api.example.com/data' },
            {
                key: 'format',
                label: 'Format',
                type: 'select',
                options: [
                    { value: 'pretty', label: 'Pretty JSON' },
                    { value: 'raw', label: 'Compact JSON' }
                ]
            }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const url = String(config?.url || '').trim();
            if (!url) {
                clone.logs.push('Fetch JSON skipped: URL is empty.');
                return [clone];
            }
            try {
                const response = await fetch(url);
                const data = await response.json();
                const formatted = config?.format === 'raw'
                    ? JSON.stringify(data)
                    : JSON.stringify(data, null, 2);
                clone.payload = formatted;
                clone.vars.lastResponse = data;
                clone.logs.push(`Fetched data from ${url}`);
            } catch (error) {
                clone.logs.push(`Fetch JSON failed: ${error.message}`);
            }
            return [clone];
        }
    },
    {
        id: 'transform-payload',
        category: 'utility',
        name: 'Transform text',
        nameKey: 'qa_module_transform_text_name',
        description: 'Apply quick text transformations to the payload.',
        descriptionKey: 'qa_module_transform_text_description',
        icon: 'type',
        accent: '#34d399',
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { mode: 'uppercase' },
        form: [
            {
                key: 'mode',
                label: 'Transformation',
                type: 'select',
                options: [
                    { value: 'uppercase', label: 'Uppercase' },
                    { value: 'lowercase', label: 'Lowercase' },
                    { value: 'titlecase', label: 'Title case' },
                    { value: 'trim', label: 'Trim whitespace' }
                ]
            }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const mode = config?.mode || 'uppercase';
            const source = typeof clone.payload === 'string'
                ? clone.payload
                : String(clone.payload ?? '');
            let result = source;
            switch (mode) {
                case 'lowercase':
                    result = source.toLowerCase();
                    break;
                case 'titlecase':
                    result = source
                        .toLowerCase()
                        .replace(/(^|\s|[-_/])([\p{L}\p{N}])/gu, (match, prefix, char) => prefix + char.toUpperCase());
                    break;
                case 'trim':
                    result = source.trim();
                    break;
                case 'uppercase':
                default:
                    result = source.toUpperCase();
                    break;
            }
            clone.payload = result;
            clone.logs.push(`Transformed payload using ${mode}`);
            return [clone];
        }
    },
    {
        id: 'store-variable',
        category: 'utility',
        name: 'Store variable',
        nameKey: 'qa_module_store_variable_name',
        description: 'Save a named value in the workflow context.',
        descriptionKey: 'qa_module_store_variable_description',
        icon: 'database',
        accent: '#f472b6',
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { key: 'name', value: 'FlashSearch' },
        form: [
            { key: 'key', label: 'Variable name', type: 'text', placeholder: 'project' },
            { key: 'value', label: 'Value', type: 'textarea', rows: 2, placeholder: 'Value to store' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const key = String(config?.key || '').trim();
            if (!key) {
                clone.logs.push('Store variable skipped: missing name.');
                return [clone];
            }
            clone.vars[key] = config?.value ?? '';
            if (!clone.payload) {
                clone.payload = config?.value ?? '';
            }
            clone.logs.push(`Stored variable "${key}"`);
            return [clone];
        }
    }
];

const QuickActionAdditionalModules = [
    createAiChatModule({
        id: 'ai-chat-assistant',
        name: 'AI chat assistant',
        nameKey: 'qa_module_ai_chat_assistant_name',
        description: 'Send a conversation prompt to your AI endpoint.',
        descriptionKey: 'qa_module_ai_chat_assistant_description',
        icon: 'message-circle',
        accent: '#8b5cf6',
        tags: ['ai', 'chat', 'assistant'],
        systemPrompt: 'You are a helpful assistant who writes concise, actionable answers.',
        userPrompt: '{{payload}}'
    }),
    createAiChatModule({
        id: 'ai-summary',
        name: 'AI summariser',
        nameKey: 'qa_module_ai_summary_name',
        description: 'Generate a compact summary of the current payload.',
        descriptionKey: 'qa_module_ai_summary_description',
        icon: 'file-text',
        accent: '#f97316',
        tags: ['ai', 'summary', 'writing'],
        systemPrompt: 'You specialise in concise executive summaries.',
        userPrompt: 'Summarise the following content in three bullet points and a one-line takeaway.\n\n{{payload}}'
    }),
    createAiChatModule({
        id: 'ai-translation',
        name: 'AI translation',
        nameKey: 'qa_module_ai_translation_name',
        description: 'Translate text into another language using your AI provider.',
        descriptionKey: 'qa_module_ai_translation_description',
        icon: 'globe',
        accent: '#22c55e',
        tags: ['ai', 'translation'],
        systemPrompt: 'You translate text accurately while preserving tone and intent.',
        userPrompt: 'Translate the following text to {{config.targetLanguage}}. Keep formatting when possible.\n\n{{payload}}',
        extraConfig: [
            { key: 'targetLanguage', label: 'Target language', type: 'text', placeholder: 'English', defaultValue: 'English' }
        ]
    }),
    createAiChatModule({
        id: 'ai-keywords',
        name: 'AI keywords extractor',
        nameKey: 'qa_module_ai_keywords_name',
        description: 'Ask the model to return the most relevant keywords.',
        descriptionKey: 'qa_module_ai_keywords_description',
        icon: 'tag',
        accent: '#ec4899',
        tags: ['ai', 'keywords', 'seo'],
        systemPrompt: 'You extract keyword lists for search and tagging.',
        userPrompt: 'Extract the 8 most important keywords from the following text. Return them as a comma-separated list with no numbering.\n\n{{payload}}'
    }),
    createAiChatModule({
        id: 'ai-tone-review',
        name: 'AI tone review',
        nameKey: 'qa_module_ai_tone_review_name',
        description: 'Analyse the tone and risks of the current message.',
        descriptionKey: 'qa_module_ai_tone_review_description',
        icon: 'activity',
        accent: '#14b8a6',
        tags: ['ai', 'analysis'],
        systemPrompt: 'You are a communication analyst who highlights tone, sentiment, and potential risks.',
        userPrompt: 'Analyse the tone, sentiment, and potential risks of this message. Provide bullet points with actionable advice.\n\n{{payload}}'
    }),
    createAiChatModule({
        id: 'ai-email-drafter',
        name: 'AI email drafter',
        nameKey: 'qa_module_ai_email_drafter_name',
        description: 'Turn notes into a polished email with greeting and signature.',
        descriptionKey: 'qa_module_ai_email_drafter_description',
        icon: 'mail',
        accent: '#facc15',
        tags: ['ai', 'email', 'writing'],
        systemPrompt: 'You craft professional, empathetic emails with clear next steps.',
        userPrompt: 'Write a polished email to {{config.audience}} using the context below. Include a subject line and closing signature.\n\n{{payload}}',
        extraConfig: [
            { key: 'audience', label: 'Audience', type: 'text', placeholder: 'our customer', defaultValue: 'our customer' }
        ]
    }),
    createAiChatModule({
        id: 'ai-title-generator',
        name: 'AI title generator',
        nameKey: 'qa_module_ai_title_generator_name',
        description: 'Produce multiple headline ideas for the payload.',
        descriptionKey: 'qa_module_ai_title_generator_description',
        icon: 'type',
        accent: '#38bdf8',
        tags: ['ai', 'title', 'content'],
        systemPrompt: 'You create catchy yet descriptive titles.',
        userPrompt: 'Suggest five compelling titles in a {{config.style}} tone for the following content:\n\n{{payload}}',
        extraConfig: [
            { key: 'style', label: 'Tone or style', type: 'text', placeholder: 'concise and professional', defaultValue: 'concise and professional' }
        ]
    }),
    createAiChatModule({
        id: 'ai-tagline-generator',
        name: 'AI tagline generator',
        nameKey: 'qa_module_ai_tagline_generator_name',
        description: 'Brainstorm marketing taglines for a product or idea.',
        descriptionKey: 'qa_module_ai_tagline_generator_description',
        icon: 'zap',
        accent: '#fb7185',
        tags: ['ai', 'marketing'],
        systemPrompt: 'You craft short, memorable marketing taglines and slogans.',
        userPrompt: 'Generate five short taglines in a {{config.tone}} tone for this product or idea:\n\n{{payload}}',
        extraConfig: [
            { key: 'tone', label: 'Tone', type: 'text', placeholder: 'friendly', defaultValue: 'friendly' }
        ]
    }),
    createAiChatModule({
        id: 'ai-code-review',
        name: 'AI code review',
        nameKey: 'qa_module_ai_code_review_name',
        description: 'Let the AI inspect code and highlight improvements.',
        descriptionKey: 'qa_module_ai_code_review_description',
        icon: 'code',
        accent: '#6366f1',
        tags: ['ai', 'code', 'review'],
        systemPrompt: 'You review code for correctness, readability, and best practices.',
        userPrompt: 'Review the following code with focus on {{config.focusArea}}. List issues and suggested improvements:\n\n{{payload}}',
        extraConfig: [
            { key: 'focusArea', label: 'Focus area', type: 'text', placeholder: 'bugs and readability', defaultValue: 'bugs and readability' }
        ]
    }),
    createAiChatModule({
        id: 'ai-bug-explainer',
        name: 'AI bug explainer',
        nameKey: 'qa_module_ai_bug_explainer_name',
        description: 'Explain a technical issue in plain language and outline next steps.',
        descriptionKey: 'qa_module_ai_bug_explainer_description',
        icon: 'help-circle',
        accent: '#f472b6',
        tags: ['ai', 'debug'],
        systemPrompt: 'You explain technical issues clearly and propose next steps.',
        userPrompt: 'Explain the root cause of this bug to a teammate and propose the next debugging steps:\n\n{{payload}}'
    }),
    createAiChatModule({
        id: 'ai-sql-builder',
        name: 'AI SQL builder',
        nameKey: 'qa_module_ai_sql_builder_name',
        description: 'Convert natural language requests into SQL queries.',
        descriptionKey: 'qa_module_ai_sql_builder_description',
        icon: 'database',
        accent: '#0ea5e9',
        tags: ['ai', 'sql'],
        systemPrompt: 'You convert requirements into efficient SQL queries using best practices.',
        userPrompt: 'Produce a SQL query for {{config.dialect}} that satisfies this request. Include a short explanation afterwards:\n\n{{payload}}',
        extraConfig: [
            { key: 'dialect', label: 'SQL dialect', type: 'text', placeholder: 'PostgreSQL', defaultValue: 'PostgreSQL' }
        ]
    }),
    createAiChatModule({
        id: 'ai-release-notes',
        name: 'AI release notes',
        nameKey: 'qa_module_ai_release_notes_name',
        description: 'Transform raw changelog entries into friendly release notes.',
        descriptionKey: 'qa_module_ai_release_notes_description',
        icon: 'clipboard',
        accent: '#34d399',
        tags: ['ai', 'product'],
        systemPrompt: 'You write friendly product release notes emphasising user benefits.',
        userPrompt: 'Write concise release notes for {{config.productName}} based on the following raw changelog. Highlight the benefits for users:\n\n{{payload}}',
        extraConfig: [
            { key: 'productName', label: 'Product name', type: 'text', placeholder: 'FlashSearch', defaultValue: 'FlashSearch' }
        ]
    }),
    createAiChatModule({
        id: 'ai-brainstorm',
        name: 'AI brainstorm',
        nameKey: 'qa_module_ai_brainstorm_name',
        description: 'Generate creative ideas or next steps from the payload.',
        descriptionKey: 'qa_module_ai_brainstorm_description',
        icon: 'feather',
        accent: '#a855f7',
        tags: ['ai', 'ideas'],
        systemPrompt: 'You are a creative strategist who proposes practical and original ideas.',
        userPrompt: 'Brainstorm five creative ideas or next steps for the following brief. Include one bold or unusual suggestion:\n\n{{payload}}'
    }),
    {
        id: 'ai-embedding',
        category: 'action',
        name: 'Generate embeddings',
        nameKey: 'qa_module_ai_embedding_name',
        description: 'Create vector embeddings from text and store them for later blocks.',
        descriptionKey: 'qa_module_ai_embedding_description',
        icon: 'layers',
        accent: '#10b981',
        tags: ['ai', 'embedding'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: {
            endpoint: 'https://api.openai.com/v1/embeddings',
            apiKey: '',
            model: 'text-embedding-3-small',
            inputMode: 'payload',
            inputText: ''
        },
        form: [
            { key: 'endpoint', label: 'API endpoint', type: 'text', placeholder: 'https://api.openai.com/v1/embeddings' },
            { key: 'apiKey', label: 'API key (optional)', type: 'text', placeholder: 'sk-…' },
            { key: 'model', label: 'Model', type: 'text', placeholder: 'text-embedding-3-small' },
            {
                key: 'inputMode',
                label: 'Input source',
                type: 'select',
                options: [
                    { value: 'payload', label: 'Use current payload' },
                    { value: 'custom', label: 'Custom text' }
                ]
            },
            { key: 'inputText', label: 'Custom text', type: 'textarea', rows: 3, placeholder: 'Text to embed' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const endpoint = String(config?.endpoint || '').trim();
            if (!endpoint) {
                clone.logs.push('Generate embeddings skipped: endpoint is missing.');
                return [clone];
            }

            const headers = { 'Content-Type': 'application/json' };
            if (config?.apiKey) {
                headers.Authorization = `Bearer ${config.apiKey}`;
            }

            const inputSource = config?.inputMode === 'custom'
                ? config?.inputText
                : QuickActionTools.toText(clone.payload);
            const input = (inputSource || '').trim();
            if (!input) {
                clone.logs.push('Generate embeddings skipped: input text is empty.');
                return [clone];
            }

            const body = JSON.stringify({
                model: config?.model || 'text-embedding-3-small',
                input
            });

            const result = await QuickActionApi.requestJson(endpoint, { method: 'POST', headers, body });
            if (result.error) {
                clone.logs.push(`Generate embeddings failed: ${result.error}`);
                return [clone];
            }

            const vector = result.data?.data?.[0]?.embedding;
            if (Array.isArray(vector)) {
                clone.vars.lastEmbedding = vector;
                clone.payload = JSON.stringify(vector);
            } else {
                clone.payload = typeof result.data === 'string'
                    ? result.data
                    : JSON.stringify(result.data, null, 2);
            }
            clone.vars.lastResponse = result.data ?? clone.vars.lastResponse;
            clone.vars.lastStatus = result.status ?? clone.vars.lastStatus;
            clone.logs.push(`Generate embeddings completed with status ${result.status ?? 'n/a'}.`);
            return [clone];
        }
    },
    {
        id: 'ai-moderation',
        category: 'action',
        name: 'AI moderation check',
        description: 'Send text to an AI moderation endpoint and record the result.',
        icon: 'shield',
        accent: '#ef4444',
        tags: ['ai', 'moderation'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: {
            endpoint: 'https://api.openai.com/v1/moderations',
            apiKey: '',
            model: 'omni-moderation-latest',
            inputMode: 'payload',
            inputText: ''
        },
        form: [
            { key: 'endpoint', label: 'API endpoint', type: 'text', placeholder: 'https://api.openai.com/v1/moderations' },
            { key: 'apiKey', label: 'API key (optional)', type: 'text', placeholder: 'sk-…' },
            { key: 'model', label: 'Model', type: 'text', placeholder: 'omni-moderation-latest' },
            {
                key: 'inputMode',
                label: 'Input source',
                type: 'select',
                options: [
                    { value: 'payload', label: 'Use current payload' },
                    { value: 'custom', label: 'Custom text' }
                ]
            },
            { key: 'inputText', label: 'Custom text', type: 'textarea', rows: 3, placeholder: 'Text to moderate' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const endpoint = String(config?.endpoint || '').trim();
            if (!endpoint) {
                clone.logs.push('AI moderation skipped: endpoint is missing.');
                return [clone];
            }

            const headers = { 'Content-Type': 'application/json' };
            if (config?.apiKey) {
                headers.Authorization = `Bearer ${config.apiKey}`;
            }

            const inputSource = config?.inputMode === 'custom'
                ? config?.inputText
                : QuickActionTools.toText(clone.payload);
            const input = (inputSource || '').trim();
            if (!input) {
                clone.logs.push('AI moderation skipped: input text is empty.');
                return [clone];
            }

            const body = JSON.stringify({
                model: config?.model || 'omni-moderation-latest',
                input
            });

            const result = await QuickActionApi.requestJson(endpoint, { method: 'POST', headers, body });
            if (result.error) {
                clone.logs.push(`AI moderation failed: ${result.error}`);
                return [clone];
            }

            clone.vars.lastModeration = result.data;
            clone.vars.lastStatus = result.status ?? clone.vars.lastStatus;
            clone.payload = JSON.stringify(result.data, null, 2);
            clone.logs.push(`AI moderation completed with status ${result.status ?? 'n/a'}.`);
            return [clone];
        }
    },
    createHttpModule({
        id: 'http-get',
        name: 'HTTP GET request',
        description: 'Perform a GET request and store the response.',
        method: 'GET',
        icon: 'download',
        accent: '#38bdf8',
        tags: ['http', 'api', 'get']
    }),
    createHttpModule({
        id: 'http-post',
        name: 'HTTP POST request',
        description: 'Send JSON data to an API endpoint and capture the reply.',
        method: 'POST',
        icon: 'upload',
        accent: '#f97316',
        tags: ['http', 'api', 'post'],
        includeBody: true,
        bodyPlaceholder: '{"name":"FlashSearch"}'
    }),
    createHttpModule({
        id: 'http-put',
        name: 'HTTP PUT request',
        description: 'Replace a resource with a JSON payload.',
        method: 'PUT',
        icon: 'refresh-cw',
        accent: '#6366f1',
        tags: ['http', 'api', 'put'],
        includeBody: true,
        bodyPlaceholder: '{"enabled":true}'
    }),
    createHttpModule({
        id: 'http-patch',
        name: 'HTTP PATCH request',
        description: 'Partially update a resource with JSON data.',
        method: 'PATCH',
        icon: 'tool',
        accent: '#f59e0b',
        tags: ['http', 'api', 'patch'],
        includeBody: true,
        bodyPlaceholder: '{"status":"done"}'
    }),
    createHttpModule({
        id: 'http-delete',
        name: 'HTTP DELETE request',
        description: 'Send a DELETE request to remove a resource.',
        method: 'DELETE',
        icon: 'trash-2',
        accent: '#ef4444',
        tags: ['http', 'api', 'delete'],
        includeBody: true,
        bodyPlaceholder: '{"reason":"cleanup"}'
    }),
    createHttpModule({
        id: 'http-head',
        name: 'HTTP HEAD request',
        description: 'Inspect response headers without downloading the body.',
        method: 'HEAD',
        icon: 'info',
        accent: '#0f172a',
        tags: ['http', 'api', 'head']
    }),
    {
        id: 'payload-append',
        category: 'utility',
        name: 'Append text',
        description: 'Append custom text after the current payload.',
        icon: 'plus-square',
        accent: '#f59e0b',
        tags: ['text', 'payload', 'edit'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { text: '\n-- Sent from FlashSearch' },
        form: [
            { key: 'text', label: 'Text to append', type: 'textarea', rows: 2, placeholder: 'Signature or closing text' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const base = QuickActionTools.toText(clone.payload);
            clone.payload = base + (config?.text ?? '');
            clone.logs.push('Appended text to payload.');
            return [clone];
        }
    },
    {
        id: 'payload-prepend',
        category: 'utility',
        name: 'Prepend text',
        description: 'Add custom text before the current payload.',
        icon: 'corner-left-up',
        accent: '#f97316',
        tags: ['text', 'payload', 'edit'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { text: 'FlashSearch — ' },
        form: [
            { key: 'text', label: 'Text to prepend', type: 'textarea', rows: 2, placeholder: 'Prefix text' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const base = QuickActionTools.toText(clone.payload);
            clone.payload = (config?.text ?? '') + base;
            clone.logs.push('Prepended text to payload.');
            return [clone];
        }
    },
    {
        id: 'payload-clear',
        category: 'utility',
        name: 'Clear payload',
        description: 'Remove any existing payload content.',
        icon: 'slash',
        accent: '#94a3b8',
        tags: ['text', 'payload', 'cleanup'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: {},
        form: [],
        run: async (context) => {
            const clone = QuickActionContext.clone(context);
            clone.payload = '';
            clone.logs.push('Cleared payload.');
            return [clone];
        }
    },
    {
        id: 'payload-trim',
        category: 'utility',
        name: 'Trim whitespace',
        description: 'Remove leading and trailing whitespace from the payload.',
        icon: 'scissors',
        accent: '#22d3ee',
        tags: ['text', 'cleanup'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: {},
        form: [],
        run: async (context) => {
            const clone = QuickActionContext.clone(context);
            clone.payload = QuickActionTools.toText(clone.payload).trim();
            clone.logs.push('Trimmed payload.');
            return [clone];
        }
    },
    {
        id: 'payload-truncate',
        category: 'utility',
        name: 'Truncate text',
        description: 'Limit the payload to a specific number of characters.',
        icon: 'crop',
        accent: '#fbbf24',
        tags: ['text', 'limit'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { limit: 160, suffix: '…' },
        form: [
            { key: 'limit', label: 'Character limit', type: 'number', placeholder: '160' },
            { key: 'suffix', label: 'Suffix', type: 'text', placeholder: '…' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const source = QuickActionTools.toText(clone.payload);
            const limit = Math.max(0, parseInt(config?.limit, 10) || 0);
            if (limit <= 0 || source.length <= limit) {
                clone.payload = source;
            } else {
                clone.payload = source.slice(0, limit) + (config?.suffix ?? '');
            }
            clone.logs.push(`Truncated payload to ${limit || source.length} characters.`);
            return [clone];
        }
    },
    {
        id: 'payload-slice',
        category: 'utility',
        name: 'Slice text',
        description: 'Extract a specific substring from the payload.',
        icon: 'columns',
        accent: '#4ade80',
        tags: ['text', 'slice'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { start: 0, end: 100 },
        form: [
            { key: 'start', label: 'Start index', type: 'number', placeholder: '0' },
            { key: 'end', label: 'End index', type: 'number', placeholder: '100' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const source = QuickActionTools.toText(clone.payload);
            const start = parseInt(config?.start, 10);
            const end = parseInt(config?.end, 10);
            const safeStart = Number.isNaN(start) ? 0 : start;
            const safeEnd = Number.isNaN(end) ? source.length : end;
            clone.payload = source.slice(safeStart, safeEnd);
            clone.logs.push(`Sliced payload from ${safeStart} to ${safeEnd}.`);
            return [clone];
        }
    },
    {
        id: 'payload-count-words',
        category: 'utility',
        name: 'Count words',
        description: 'Count how many words the payload contains.',
        icon: 'hash',
        accent: '#0ea5e9',
        tags: ['text', 'analysis'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: {},
        form: [],
        run: async (context) => {
            const clone = QuickActionContext.clone(context);
            const words = QuickActionTools.toText(clone.payload)
                .trim()
                .split(/\s+/)
                .filter(Boolean);
            const count = words.length;
            clone.vars.wordCount = count;
            clone.payload = String(count);
            clone.logs.push(`Counted ${count} words.`);
            return [clone];
        }
    },
    {
        id: 'payload-count-lines',
        category: 'utility',
        name: 'Count lines',
        description: 'Count how many lines exist in the payload.',
        icon: 'align-left',
        accent: '#f87171',
        tags: ['text', 'analysis'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: {},
        form: [],
        run: async (context) => {
            const clone = QuickActionContext.clone(context);
            const lines = QuickActionTools.toLines(clone.payload);
            const count = lines.filter(line => line.length > 0).length;
            clone.vars.lineCount = count;
            clone.payload = String(count);
            clone.logs.push(`Counted ${count} lines.`);
            return [clone];
        }
    },
    {
        id: 'payload-split-lines',
        category: 'utility',
        name: 'Split into lines',
        description: 'Break the payload into an array of lines.',
        icon: 'list',
        accent: '#60a5fa',
        tags: ['text', 'list'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: {},
        form: [],
        run: async (context) => {
            const clone = QuickActionContext.clone(context);
            const lines = QuickActionTools.toLines(clone.payload);
            clone.vars.lastList = lines;
            clone.payload = JSON.stringify(lines, null, 2);
            clone.logs.push('Split payload into lines.');
            return [clone];
        }
    },
    {
        id: 'payload-join-lines',
        category: 'utility',
        name: 'Join lines',
        description: 'Join an array of lines into a single string.',
        icon: 'link',
        accent: '#f472b6',
        tags: ['text', 'list'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { source: 'lastList', separator: '\n' },
        form: [
            {
                key: 'source',
                label: 'Source list',
                type: 'select',
                options: [
                    { value: 'lastList', label: 'Use last list from context' },
                    { value: 'payload', label: 'Split current payload first' }
                ]
            },
            { key: 'separator', label: 'Separator', type: 'text', placeholder: '\n' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            let list = [];
            if (config?.source === 'payload') {
                list = QuickActionTools.toLines(clone.payload);
            } else if (Array.isArray(clone.vars.lastList)) {
                list = clone.vars.lastList;
            }
            const separator = config?.separator ?? '\n';
            clone.payload = list.join(separator);
            clone.logs.push('Joined lines into payload.');
            return [clone];
        }
    },
    {
        id: 'payload-unique-lines',
        category: 'utility',
        name: 'Unique lines',
        description: 'Remove duplicate lines from the payload.',
        icon: 'filter',
        accent: '#14b8a6',
        tags: ['text', 'dedupe'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: {},
        form: [],
        run: async (context) => {
            const clone = QuickActionContext.clone(context);
            const lines = QuickActionTools.unique(QuickActionTools.toLines(clone.payload));
            clone.vars.lastList = lines;
            clone.payload = lines.join('\n');
            clone.logs.push('Removed duplicate lines.');
            return [clone];
        }
    },
    {
        id: 'payload-sort-lines',
        category: 'utility',
        name: 'Sort lines',
        description: 'Sort lines alphabetically.',
        icon: 'arrow-up',
        accent: '#94a3b8',
        tags: ['text', 'sort'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { direction: 'asc' },
        form: [
            {
                key: 'direction',
                label: 'Direction',
                type: 'select',
                options: [
                    { value: 'asc', label: 'Ascending' },
                    { value: 'desc', label: 'Descending' }
                ]
            }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const lines = QuickActionTools.toLines(clone.payload).sort((a, b) => a.localeCompare(b));
            if (config?.direction === 'desc') {
                lines.reverse();
            }
            clone.vars.lastList = lines;
            clone.payload = lines.join('\n');
            clone.logs.push('Sorted lines.');
            return [clone];
        }
    },
    {
        id: 'payload-shuffle-lines',
        category: 'utility',
        name: 'Shuffle lines',
        description: 'Shuffle the order of lines randomly.',
        icon: 'shuffle',
        accent: '#a78bfa',
        tags: ['text', 'random'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: {},
        form: [],
        run: async (context) => {
            const clone = QuickActionContext.clone(context);
            const lines = QuickActionTools.shuffle(QuickActionTools.toLines(clone.payload));
            clone.vars.lastList = lines;
            clone.payload = lines.join('\n');
            clone.logs.push('Shuffled lines.');
            return [clone];
        }
    },
    {
        id: 'payload-filter-lines',
        category: 'utility',
        name: 'Filter lines',
        description: 'Keep or remove lines matching a keyword.',
        icon: 'search',
        accent: '#f87171',
        tags: ['text', 'filter'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { keyword: '', mode: 'includes', caseSensitive: 'no' },
        form: [
            { key: 'keyword', label: 'Keyword', type: 'text', placeholder: 'error' },
            {
                key: 'mode',
                label: 'Mode',
                type: 'select',
                options: [
                    { value: 'includes', label: 'Keep lines that include the keyword' },
                    { value: 'excludes', label: 'Remove lines that include the keyword' }
                ]
            },
            {
                key: 'caseSensitive',
                label: 'Case sensitive',
                type: 'select',
                options: [
                    { value: 'no', label: 'No' },
                    { value: 'yes', label: 'Yes' }
                ]
            }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const keyword = String(config?.keyword || '');
            if (!keyword) {
                clone.logs.push('Filter lines skipped: keyword is empty.');
                return [clone];
            }
            const caseSensitive = config?.caseSensitive === 'yes';
            const comparator = caseSensitive ? keyword : keyword.toLowerCase();
            const lines = QuickActionTools.toLines(clone.payload).filter(line => {
                const haystack = caseSensitive ? line : line.toLowerCase();
                const contains = haystack.includes(comparator);
                return config?.mode === 'excludes' ? !contains : contains;
            });
            clone.vars.lastList = lines;
            clone.payload = lines.join('\n');
            clone.logs.push(`Filtered lines using keyword "${keyword}".`);
            return [clone];
        }
    },
    {
        id: 'payload-regex-replace',
        category: 'utility',
        name: 'Regex replace',
        description: 'Replace text using a regular expression.',
        icon: 'edit',
        accent: '#22c55e',
        tags: ['text', 'regex'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { pattern: '(?i)flashsearch', replacement: 'FlashSearch', flags: 'g' },
        form: [
            { key: 'pattern', label: 'Pattern', type: 'text', placeholder: '(?i)flashsearch' },
            { key: 'replacement', label: 'Replacement', type: 'text', placeholder: 'FlashSearch' },
            { key: 'flags', label: 'Flags', type: 'text', placeholder: 'g' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            try {
                const regex = new RegExp(config?.pattern || '', config?.flags || '');
                clone.payload = QuickActionTools.toText(clone.payload).replace(regex, config?.replacement ?? '');
                clone.logs.push('Applied regex replacement.');
            } catch (error) {
                clone.logs.push(`Regex replace failed: ${error.message}`);
            }
            return [clone];
        }
    },
    {
        id: 'payload-regex-extract',
        category: 'utility',
        name: 'Regex extract',
        description: 'Capture regex matches and store them as JSON.',
        icon: 'target',
        accent: '#fb7185',
        tags: ['text', 'regex'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { pattern: '(\\d+)', flags: 'g' },
        form: [
            { key: 'pattern', label: 'Pattern', type: 'text', placeholder: '(\\d+)' },
            { key: 'flags', label: 'Flags', type: 'text', placeholder: 'g' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            try {
                const regex = new RegExp(config?.pattern || '', config?.flags || '');
                const matches = QuickActionTools.toText(clone.payload).match(regex) || [];
                clone.vars.lastMatches = matches;
                clone.payload = JSON.stringify(matches, null, 2);
                clone.logs.push('Extracted regex matches.');
            } catch (error) {
                clone.logs.push(`Regex extract failed: ${error.message}`);
            }
            return [clone];
        }
    },
    {
        id: 'payload-number-format',
        category: 'utility',
        name: 'Format number',
        description: 'Format a number using locale-aware settings.',
        icon: 'dollar-sign',
        accent: '#0ea5e9',
        tags: ['number', 'format'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { locale: 'en-US', style: 'decimal', currency: 'USD' },
        form: [
            { key: 'locale', label: 'Locale', type: 'text', placeholder: 'en-US' },
            {
                key: 'style',
                label: 'Style',
                type: 'select',
                options: [
                    { value: 'decimal', label: 'Decimal' },
                    { value: 'currency', label: 'Currency' },
                    { value: 'percent', label: 'Percent' }
                ]
            },
            { key: 'currency', label: 'Currency code', type: 'text', placeholder: 'USD' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const style = config?.style || 'decimal';
            const options = { style };
            if (style === 'currency') {
                options.currency = (config?.currency || 'USD').toUpperCase();
            }
            const formatted = QuickActionTools.formatNumber(clone.payload, config?.locale || 'en-US', options);
            clone.payload = formatted;
            clone.logs.push('Formatted number.');
            return [clone];
        }
    },
    {
        id: 'payload-date-format',
        category: 'utility',
        name: 'Format date',
        description: 'Format a date using locale-aware presets.',
        icon: 'calendar',
        accent: '#f59e0b',
        tags: ['date', 'format'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { locale: 'en-US', style: 'datetime' },
        form: [
            { key: 'locale', label: 'Locale', type: 'text', placeholder: 'en-US' },
            {
                key: 'style',
                label: 'Style',
                type: 'select',
                options: [
                    { value: 'datetime', label: 'Date and time' },
                    { value: 'date', label: 'Date only' },
                    { value: 'time', label: 'Time only' }
                ]
            }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const value = clone.payload ?? new Date();
            const style = config?.style || 'datetime';
            const options = {
                datetime: { dateStyle: 'medium', timeStyle: 'short' },
                date: { dateStyle: 'long' },
                time: { timeStyle: 'medium' }
            }[style] || { dateStyle: 'medium', timeStyle: 'short' };
            clone.payload = QuickActionTools.formatDate(value, config?.locale || 'en-US', options);
            clone.logs.push('Formatted date.');
            return [clone];
        }
    },
    {
        id: 'payload-date-diff',
        category: 'utility',
        name: 'Date difference',
        description: 'Compute the difference between two dates.',
        icon: 'clock',
        accent: '#22c55e',
        tags: ['date', 'analysis'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { startSource: 'payload', endSource: 'now', startDate: '', endDate: '', unit: 'hours' },
        form: [
            {
                key: 'startSource',
                label: 'Start date',
                type: 'select',
                options: [
                    { value: 'payload', label: 'Use payload' },
                    { value: 'custom', label: 'Custom date' }
                ]
            },
            { key: 'startDate', label: 'Custom start date', type: 'text', placeholder: '2024-01-01T00:00:00Z' },
            {
                key: 'endSource',
                label: 'End date',
                type: 'select',
                options: [
                    { value: 'now', label: 'Current time' },
                    { value: 'custom', label: 'Custom date' }
                ]
            },
            { key: 'endDate', label: 'Custom end date', type: 'text', placeholder: '2024-01-02T00:00:00Z' },
            {
                key: 'unit',
                label: 'Unit',
                type: 'select',
                options: [
                    { value: 'seconds', label: 'Seconds' },
                    { value: 'minutes', label: 'Minutes' },
                    { value: 'hours', label: 'Hours' },
                    { value: 'days', label: 'Days' }
                ]
            }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const start = config?.startSource === 'custom'
                ? config?.startDate
                : QuickActionTools.toText(clone.payload);
            const end = config?.endSource === 'custom'
                ? config?.endDate
                : new Date();
            const diff = QuickActionTools.dateDiff(start, end, config?.unit || 'hours');
            if (Number.isNaN(diff)) {
                clone.logs.push('Date difference failed: invalid date.');
                return [clone];
            }
            clone.payload = String(diff);
            clone.logs.push(`Calculated date difference: ${diff} ${config?.unit || 'hours'}.`);
            return [clone];
        }
    },
    {
        id: 'payload-markdown-to-html',
        category: 'utility',
        name: 'Markdown to HTML',
        description: 'Convert simple Markdown into HTML.',
        icon: 'book-open',
        accent: '#6366f1',
        tags: ['markdown', 'html'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: {},
        form: [],
        run: async (context) => {
            const clone = QuickActionContext.clone(context);
            const source = QuickActionTools.toText(clone.payload);
            let html = source
                .replace(/^### (.*)$/gm, '<h3>$1</h3>')
                .replace(/^## (.*)$/gm, '<h2>$1</h2>')
                .replace(/^# (.*)$/gm, '<h1>$1</h1>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/`([^`]+)`/g, '<code>$1</code>')
                .replace(/\n\n/g, '</p><p>');
            html = `<p>${html}</p>`;
            clone.payload = html;
            clone.logs.push('Converted Markdown to HTML.');
            return [clone];
        }
    },
    {
        id: 'payload-html-to-text',
        category: 'utility',
        name: 'HTML to text',
        description: 'Strip HTML tags and keep the plain text.',
        icon: 'file-text',
        accent: '#f97316',
        tags: ['html', 'text'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: {},
        form: [],
        run: async (context) => {
            const clone = QuickActionContext.clone(context);
            const parser = new DOMParser();
            const doc = parser.parseFromString(QuickActionTools.toText(clone.payload), 'text/html');
            clone.payload = doc.body?.textContent?.trim() || '';
            clone.logs.push('Converted HTML to text.');
            return [clone];
        }
    },
    {
        id: 'payload-base64-encode',
        category: 'utility',
        name: 'Base64 encode',
        description: 'Encode the payload using Base64.',
        icon: 'lock',
        accent: '#22c55e',
        tags: ['encoding', 'base64'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: {},
        form: [],
        run: async (context) => {
            const clone = QuickActionContext.clone(context);
            clone.payload = QuickActionTools.base64Encode(clone.payload);
            clone.logs.push('Encoded payload to Base64.');
            return [clone];
        }
    },
    {
        id: 'payload-base64-decode',
        category: 'utility',
        name: 'Base64 decode',
        description: 'Decode the payload from Base64.',
        icon: 'unlock',
        accent: '#f87171',
        tags: ['encoding', 'base64'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: {},
        form: [],
        run: async (context) => {
            const clone = QuickActionContext.clone(context);
            clone.payload = QuickActionTools.base64Decode(clone.payload);
            clone.logs.push('Decoded Base64 payload.');
            return [clone];
        }
    },
    {
        id: 'payload-url-encode',
        category: 'utility',
        name: 'URL encode',
        description: 'Escape the payload for use in URLs.',
        icon: 'external-link',
        accent: '#60a5fa',
        tags: ['encoding', 'url'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: {},
        form: [],
        run: async (context) => {
            const clone = QuickActionContext.clone(context);
            clone.payload = QuickActionTools.urlEncode(clone.payload);
            clone.logs.push('URL-encoded payload.');
            return [clone];
        }
    },
    {
        id: 'payload-url-decode',
        category: 'utility',
        name: 'URL decode',
        description: 'Decode URL-encoded payload back to text.',
        icon: 'corner-right-down',
        accent: '#34d399',
        tags: ['encoding', 'url'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: {},
        form: [],
        run: async (context) => {
            const clone = QuickActionContext.clone(context);
            clone.payload = QuickActionTools.urlDecode(clone.payload);
            clone.logs.push('URL-decoded payload.');
            return [clone];
        }
    },
    {
        id: 'payload-random-number',
        category: 'utility',
        name: 'Random number',
        description: 'Generate a random number and store it as the payload.',
        icon: 'dice',
        accent: '#facc15',
        tags: ['random', 'number'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { min: 0, max: 1, decimals: 2 },
        form: [
            { key: 'min', label: 'Minimum', type: 'number', placeholder: '0' },
            { key: 'max', label: 'Maximum', type: 'number', placeholder: '1' },
            { key: 'decimals', label: 'Decimals', type: 'number', placeholder: '2' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const min = Number(config?.min ?? 0);
            const max = Number(config?.max ?? 1);
            const decimals = Math.max(0, parseInt(config?.decimals, 10) || 0);
            const value = QuickActionTools.randomNumber(min, max);
            clone.payload = decimals > 0 ? value.toFixed(decimals) : String(Math.round(value));
            clone.logs.push('Generated random number.');
            return [clone];
        }
    },
    {
        id: 'payload-random-string',
        category: 'utility',
        name: 'Random string',
        description: 'Create a random alphanumeric string.',
        icon: 'italic',
        accent: '#c084fc',
        tags: ['random', 'text'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { length: 12 },
        form: [
            { key: 'length', label: 'Length', type: 'number', placeholder: '12' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const length = Math.max(1, parseInt(config?.length, 10) || 12);
            clone.payload = QuickActionTools.randomString(length);
            clone.logs.push('Generated random string.');
            return [clone];
        }
    },
    {
        id: 'payload-generate-uuid',
        category: 'utility',
        name: 'Generate UUID',
        description: 'Generate a unique identifier as the payload.',
        icon: 'key',
        accent: '#f472b6',
        tags: ['random', 'uuid'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: {},
        form: [],
        run: async (context) => {
            const clone = QuickActionContext.clone(context);
            clone.payload = QuickActionTools.uuid();
            clone.logs.push('Generated UUID.');
            return [clone];
        }
    },
    {
        id: 'payload-template',
        category: 'utility',
        name: 'Apply template',
        description: 'Build text from a template referencing payload, variables, or config.',
        icon: 'file-plus',
        accent: '#38bdf8',
        tags: ['template', 'text'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { template: 'Hello {{payload}}' },
        form: [
            { key: 'template', label: 'Template', type: 'textarea', rows: 3, placeholder: 'Hello {{payload}}' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            clone.payload = QuickActionTools.applyTemplate(config?.template ?? '', clone, config);
            clone.logs.push('Applied template to payload.');
            return [clone];
        }
    },
    {
        id: 'payload-json-parse',
        category: 'utility',
        name: 'Parse JSON',
        description: 'Parse the payload as JSON and store the object in context.',
        icon: 'code',
        accent: '#10b981',
        tags: ['json', 'parse'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: {},
        form: [],
        run: async (context) => {
            const clone = QuickActionContext.clone(context);
            const parsed = QuickActionTools.parseJson(clone.payload);
            if (parsed.error) {
                clone.logs.push(`JSON parse failed: ${parsed.error}`);
                return [clone];
            }
            clone.vars.lastJson = parsed.data;
            clone.payload = parsed.data ? JSON.stringify(parsed.data, null, 2) : '';
            clone.logs.push('Parsed JSON payload.');
            return [clone];
        }
    },
    {
        id: 'payload-json-stringify',
        category: 'utility',
        name: 'Stringify JSON',
        description: 'Convert stored JSON back into a string.',
        icon: 'file-text',
        accent: '#6366f1',
        tags: ['json', 'stringify'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { source: 'lastJson', variable: 'data', customJson: '{"example":true}' },
        form: [
            {
                key: 'source',
                label: 'Source',
                type: 'select',
                options: [
                    { value: 'lastJson', label: 'Last parsed JSON' },
                    { value: 'payload', label: 'Parse payload first' },
                    { value: 'variable', label: 'Variable value' },
                    { value: 'custom', label: 'Custom JSON' }
                ]
            },
            { key: 'variable', label: 'Variable name', type: 'text', placeholder: 'data' },
            { key: 'customJson', label: 'Custom JSON', type: 'textarea', rows: 3, placeholder: '{ "example": true }' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            let value;
            switch (config?.source) {
                case 'payload': {
                    const parsed = QuickActionTools.parseJson(clone.payload);
                    if (parsed.error) {
                        clone.logs.push(`JSON stringify failed: ${parsed.error}`);
                        return [clone];
                    }
                    value = parsed.data;
                    break;
                }
                case 'variable':
                    value = clone.vars?.[config?.variable];
                    break;
                case 'custom': {
                    const parsedCustom = QuickActionTools.parseJson(config?.customJson);
                    if (parsedCustom.error) {
                        clone.logs.push(`Custom JSON invalid: ${parsedCustom.error}`);
                        return [clone];
                    }
                    value = parsedCustom.data;
                    break;
                }
                case 'lastJson':
                default:
                    value = clone.vars.lastJson;
                    break;
            }
            clone.payload = value !== undefined ? JSON.stringify(value, null, 2) : '';
            clone.logs.push('Stringified JSON data.');
            return [clone];
        }
    },
    {
        id: 'payload-json-merge',
        category: 'utility',
        name: 'Merge JSON',
        description: 'Merge additional JSON into the existing object.',
        icon: 'git-merge',
        accent: '#f97316',
        tags: ['json', 'merge'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { baseSource: 'lastJson', patchJson: '{"ready":true}' },
        form: [
            {
                key: 'baseSource',
                label: 'Base object',
                type: 'select',
                options: [
                    { value: 'lastJson', label: 'Last parsed JSON' },
                    { value: 'payload', label: 'Parse payload first' }
                ]
            },
            { key: 'patchJson', label: 'JSON to merge', type: 'textarea', rows: 3, placeholder: '{ "ready": true }' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const base = config?.baseSource === 'payload'
                ? QuickActionTools.ensureObject(clone.payload)
                : QuickActionTools.clone(clone.vars.lastJson || {});
            const patch = QuickActionTools.ensureObject(config?.patchJson);
            const merged = QuickActionTools.deepMerge(base, patch);
            clone.vars.lastJson = merged;
            clone.payload = JSON.stringify(merged, null, 2);
            clone.logs.push('Merged JSON objects.');
            return [clone];
        }
    },
    {
        id: 'payload-json-get-path',
        category: 'utility',
        name: 'Get JSON path',
        description: 'Read a value from JSON using dot notation.',
        icon: 'corner-right-up',
        accent: '#34d399',
        tags: ['json', 'path'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { path: 'user.name', source: 'lastJson' },
        form: [
            { key: 'path', label: 'Path (dot notation)', type: 'text', placeholder: 'user.name' },
            {
                key: 'source',
                label: 'Source object',
                type: 'select',
                options: [
                    { value: 'lastJson', label: 'Last parsed JSON' },
                    { value: 'payload', label: 'Parse payload first' }
                ]
            }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const base = config?.source === 'payload'
                ? QuickActionTools.ensureObject(clone.payload)
                : clone.vars.lastJson;
            const value = QuickActionTools.getPath(base, config?.path || '');
            clone.payload = value !== undefined ? QuickActionTools.toText(value) : '';
            clone.logs.push(`Read JSON path ${config?.path || ''}.`);
            return [clone];
        }
    },
    {
        id: 'payload-json-set-path',
        category: 'utility',
        name: 'Set JSON path',
        description: 'Update a value in JSON using dot notation.',
        icon: 'corner-left-down',
        accent: '#f59e0b',
        tags: ['json', 'path'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { path: 'user.name', value: 'FlashSearch', baseSource: 'lastJson' },
        form: [
            { key: 'path', label: 'Path', type: 'text', placeholder: 'user.name' },
            { key: 'value', label: 'Value', type: 'text', placeholder: 'FlashSearch' },
            {
                key: 'baseSource',
                label: 'Base object',
                type: 'select',
                options: [
                    { value: 'lastJson', label: 'Last parsed JSON' },
                    { value: 'payload', label: 'Parse payload first' }
                ]
            }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const base = config?.baseSource === 'payload'
                ? QuickActionTools.ensureObject(clone.payload)
                : QuickActionTools.clone(clone.vars.lastJson || {});
            QuickActionTools.setPath(base, config?.path || '', config?.value ?? null);
            clone.vars.lastJson = base;
            clone.payload = JSON.stringify(base, null, 2);
            clone.logs.push(`Updated JSON path ${config?.path || ''}.`);
            return [clone];
        }
    },
    {
        id: 'payload-condition-flag',
        category: 'utility',
        name: 'Payload condition flag',
        description: 'Check if the payload contains a keyword and store the result as a variable.',
        icon: 'help-circle',
        accent: '#fb7185',
        tags: ['logic', 'condition'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { keyword: '', flagName: 'payloadContains', caseSensitive: 'no' },
        form: [
            { key: 'keyword', label: 'Keyword', type: 'text', placeholder: 'success' },
            { key: 'flagName', label: 'Variable name', type: 'text', placeholder: 'payloadContains' },
            {
                key: 'caseSensitive',
                label: 'Case sensitive',
                type: 'select',
                options: [
                    { value: 'no', label: 'No' },
                    { value: 'yes', label: 'Yes' }
                ]
            }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const keyword = String(config?.keyword || '');
            const flagName = String(config?.flagName || 'payloadContains');
            if (!keyword) {
                clone.logs.push('Condition flag skipped: keyword is empty.');
                return [clone];
            }
            const haystack = QuickActionTools.toText(clone.payload);
            const match = config?.caseSensitive === 'yes'
                ? haystack.includes(keyword)
                : haystack.toLowerCase().includes(keyword.toLowerCase());
            clone.vars[flagName] = match;
            clone.logs.push(`Stored condition flag ${flagName}=${match}.`);
            return [clone];
        }
    },
    {
        id: 'workflow-delay-random',
        category: 'utility',
        name: 'Random delay',
        description: 'Wait for a random duration between two values.',
        icon: 'timer',
        accent: '#94a3b8',
        tags: ['delay', 'random'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { minMs: 500, maxMs: 1500 },
        form: [
            { key: 'minMs', label: 'Minimum delay (ms)', type: 'number', placeholder: '500' },
            { key: 'maxMs', label: 'Maximum delay (ms)', type: 'number', placeholder: '1500' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const min = Math.max(0, parseInt(config?.minMs, 10) || 0);
            const max = Math.max(min, parseInt(config?.maxMs, 10) || min);
            const delay = Math.round(QuickActionTools.randomNumber(min, max));
            await new Promise(resolve => setTimeout(resolve, delay));
            clone.logs.push(`Delayed workflow by ${delay} ms.`);
            return [clone];
        }
    },
    {
        id: 'log-message',
        category: 'utility',
        name: 'Log message',
        description: 'Add a custom entry to the workflow logs.',
        icon: 'message-square',
        accent: '#38bdf8',
        tags: ['log', 'debug'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { message: 'Workflow checkpoint', includePayload: 'no' },
        form: [
            { key: 'message', label: 'Message', type: 'textarea', rows: 2, placeholder: 'Workflow checkpoint' },
            {
                key: 'includePayload',
                label: 'Include payload',
                type: 'select',
                options: [
                    { value: 'no', label: 'No' },
                    { value: 'yes', label: 'Yes' }
                ]
            }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            let message = config?.message || '';
            if (config?.includePayload === 'yes') {
                message += `\nPayload: ${QuickActionTools.toText(clone.payload)}`;
            }
            clone.logs.push(message || 'Log entry');
            return [clone];
        }
    },
    {
        id: 'log-payload',
        category: 'utility',
        name: 'Log payload',
        description: 'Store the current payload value in the logs.',
        icon: 'clipboard',
        accent: '#64748b',
        tags: ['log', 'debug'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: {},
        form: [],
        run: async (context) => {
            const clone = QuickActionContext.clone(context);
            clone.logs.push(`Payload snapshot: ${QuickActionTools.toText(clone.payload)}`);
            return [clone];
        }
    },
    {
        id: 'prompt-input',
        category: 'utility',
        name: 'Prompt for input',
        description: 'Display a prompt dialog and store the user response.',
        icon: 'edit-3',
        accent: '#f59e0b',
        tags: ['prompt', 'interaction'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { title: 'Enter value', defaultValue: '' },
        form: [
            { key: 'title', label: 'Prompt title', type: 'text', placeholder: 'Enter value' },
            { key: 'defaultValue', label: 'Default value', type: 'text', placeholder: '' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const response = window.prompt(config?.title || 'Enter value', config?.defaultValue || '');
            if (response !== null) {
                clone.payload = response;
                clone.logs.push('User provided input via prompt.');
            } else {
                clone.logs.push('Prompt cancelled by user.');
            }
            return [clone];
        }
    },
    {
        id: 'prompt-confirm',
        category: 'utility',
        name: 'Prompt confirm',
        description: 'Ask the user for confirmation and store the boolean result.',
        icon: 'help-circle',
        accent: '#f97316',
        tags: ['prompt', 'interaction'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { message: 'Do you want to continue?' },
        form: [
            { key: 'message', label: 'Message', type: 'text', placeholder: 'Do you want to continue?' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const answer = window.confirm(config?.message || 'Do you want to continue?');
            clone.vars.lastConfirmation = answer;
            clone.logs.push(`Confirmation result: ${answer}`);
            return [clone];
        }
    },
    {
        id: 'notify-from-payload',
        category: 'action',
        name: 'Notify from payload',
        description: 'Show a desktop notification using the payload value.',
        icon: 'bell',
        accent: '#facc15',
        tags: ['notification'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { title: 'FlashSearch' },
        form: [
            { key: 'title', label: 'Notification title', type: 'text', placeholder: 'FlashSearch' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            if (Notification.permission === 'default') {
                Notification.requestPermission().catch(() => {});
            }
            if (Notification.permission === 'granted') {
                new Notification(config?.title || 'FlashSearch', { body: QuickActionTools.toText(clone.payload) });
            }
            clone.logs.push('Notification requested.');
            return [clone];
        }
    },
    {
        id: 'open-payload-url',
        category: 'action',
        name: 'Open payload URL',
        description: 'Open the payload value as a URL in the browser.',
        icon: 'external-link',
        accent: '#38bdf8',
        tags: ['url', 'open'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: {},
        form: [],
        run: async (context) => {
            const clone = QuickActionContext.clone(context);
            const url = QuickActionTools.toText(clone.payload).trim();
            if (url) {
                try {
                    await shell.openExternal(url);
                    clone.logs.push(`Opened URL ${url}.`);
                } catch (error) {
                    clone.logs.push(`Failed to open URL: ${error.message}`);
                }
            }
            return [clone];
        }
    },
    {
        id: 'search-web',
        category: 'action',
        name: 'Search the web',
        description: 'Open a search query in your preferred engine.',
        icon: 'search',
        accent: '#4ade80',
        tags: ['search', 'web'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { engine: 'google' },
        form: [
            {
                key: 'engine',
                label: 'Search engine',
                type: 'select',
                options: [
                    { value: 'google', label: 'Google' },
                    { value: 'duckduckgo', label: 'DuckDuckGo' },
                    { value: 'bing', label: 'Bing' }
                ]
            }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const query = encodeURIComponent(QuickActionTools.toText(clone.payload));
            const engine = config?.engine || 'google';
            const urls = {
                google: `https://www.google.com/search?q=${query}`,
                duckduckgo: `https://duckduckgo.com/?q=${query}`,
                bing: `https://www.bing.com/search?q=${query}`
            };
            const target = urls[engine] || urls.google;
            try {
                await shell.openExternal(target);
                clone.logs.push(`Opened search ${engine}.`);
            } catch (error) {
                clone.logs.push(`Search failed: ${error.message}`);
            }
            return [clone];
        }
    },
    {
        id: 'vars-set-from-payload',
        category: 'utility',
        name: 'Set variable from payload',
        description: 'Store the current payload value in a named variable.',
        icon: 'save',
        accent: '#22c55e',
        tags: ['variables'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { key: 'result' },
        form: [
            { key: 'key', label: 'Variable name', type: 'text', placeholder: 'result' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const key = String(config?.key || '').trim();
            if (!key) {
                clone.logs.push('Set variable skipped: name is empty.');
                return [clone];
            }
            clone.vars[key] = QuickActionTools.toText(clone.payload);
            clone.logs.push(`Stored payload in variable ${key}.`);
            return [clone];
        }
    },
    {
        id: 'vars-copy-to-payload',
        category: 'utility',
        name: 'Load variable into payload',
        description: 'Replace the payload with a stored variable value.',
        icon: 'download',
        accent: '#60a5fa',
        tags: ['variables'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { key: 'result' },
        form: [
            { key: 'key', label: 'Variable name', type: 'text', placeholder: 'result' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const key = String(config?.key || '').trim();
            clone.payload = key ? QuickActionTools.toText(clone.vars?.[key]) : '';
            clone.logs.push(`Loaded variable ${key || ''} into payload.`);
            return [clone];
        }
    },
    {
        id: 'vars-delete',
        category: 'utility',
        name: 'Delete variable',
        description: 'Remove a variable from the workflow context.',
        icon: 'trash',
        accent: '#ef4444',
        tags: ['variables'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { key: 'result' },
        form: [
            { key: 'key', label: 'Variable name', type: 'text', placeholder: 'result' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const key = String(config?.key || '').trim();
            if (key) {
                delete clone.vars[key];
                clone.logs.push(`Deleted variable ${key}.`);
            }
            return [clone];
        }
    },
    {
        id: 'vars-increment',
        category: 'utility',
        name: 'Increment variable',
        description: 'Increment a numeric variable by a given step.',
        icon: 'plus',
        accent: '#4ade80',
        tags: ['variables'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { key: 'counter', step: 1 },
        form: [
            { key: 'key', label: 'Variable name', type: 'text', placeholder: 'counter' },
            { key: 'step', label: 'Step', type: 'number', placeholder: '1' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const key = String(config?.key || '').trim();
            if (!key) return [clone];
            const step = Number(config?.step ?? 1);
            const current = Number(clone.vars?.[key] ?? 0);
            const result = current + step;
            clone.vars[key] = result;
            clone.logs.push(`Variable ${key} incremented to ${result}.`);
            return [clone];
        }
    },
    {
        id: 'vars-toggle',
        category: 'utility',
        name: 'Toggle boolean',
        description: 'Toggle a boolean variable between true and false.',
        icon: 'toggle-right',
        accent: '#f59e0b',
        tags: ['variables'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { key: 'enabled' },
        form: [
            { key: 'key', label: 'Variable name', type: 'text', placeholder: 'enabled' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const key = String(config?.key || '').trim();
            if (!key) return [clone];
            clone.vars[key] = !clone.vars[key];
            clone.logs.push(`Variable ${key} toggled to ${clone.vars[key]}.`);
            return [clone];
        }
    },
    {
        id: 'vars-store-timestamp',
        category: 'utility',
        name: 'Store timestamp',
        description: 'Save the current ISO timestamp into a variable.',
        icon: 'clock',
        accent: '#38bdf8',
        tags: ['variables', 'time'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { key: 'timestamp' },
        form: [
            { key: 'key', label: 'Variable name', type: 'text', placeholder: 'timestamp' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const key = String(config?.key || '').trim();
            if (!key) return [clone];
            clone.vars[key] = new Date().toISOString();
            clone.logs.push(`Stored timestamp in variable ${key}.`);
            return [clone];
        }
    },
    {
        id: 'vars-generate-uuid',
        category: 'utility',
        name: 'Variable UUID',
        description: 'Generate a UUID and store it in a variable.',
        icon: 'aperture',
        accent: '#a855f7',
        tags: ['variables', 'uuid'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { key: 'uuid' },
        form: [
            { key: 'key', label: 'Variable name', type: 'text', placeholder: 'uuid' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const key = String(config?.key || '').trim();
            if (!key) return [clone];
            clone.vars[key] = QuickActionTools.uuid();
            clone.logs.push(`Stored UUID in variable ${key}.`);
            return [clone];
        }
    },
    {
        id: 'vars-clear-all',
        category: 'utility',
        name: 'Clear variables',
        description: 'Remove all stored workflow variables.',
        icon: 'refresh-ccw',
        accent: '#ef4444',
        tags: ['variables', 'cleanup'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: {},
        form: [],
        run: async (context) => {
            const clone = QuickActionContext.clone(context);
            clone.vars = {};
            clone.logs.push('Cleared all workflow variables.');
            return [clone];
        }
    },
    {
        id: 'vars-merge-json',
        category: 'utility',
        name: 'Merge into variables',
        description: 'Merge JSON data into the variables object.',
        icon: 'database',
        accent: '#0ea5e9',
        tags: ['variables', 'json'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { json: '{"feature":"automation"}' },
        form: [
            { key: 'json', label: 'JSON to merge', type: 'textarea', rows: 3, placeholder: '{ "feature": "automation" }' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const patch = QuickActionTools.ensureObject(config?.json);
            clone.vars = QuickActionTools.deepMerge(clone.vars || {}, patch);
            clone.logs.push('Merged JSON into variables.');
            return [clone];
        }
    },
    createAiChatModule({
        id: 'ai-meeting-agenda',
        name: 'AI meeting agenda',
        nameKey: 'qa_module_ai_meeting_agenda_name',
        description: 'Turn talking points into a time-boxed meeting agenda.',
        descriptionKey: 'qa_module_ai_meeting_agenda_description',
        icon: 'calendar',
        accent: '#0ea5e9',
        tags: ['ai', 'meeting', 'planning'],
        systemPrompt: 'You design efficient, collaborative meetings with clear timings and owners.',
        userPrompt: 'Create a detailed agenda for a {{config.meetingType}} meeting lasting {{config.duration}} minutes. Include sections, objectives and recommended time allocations.\n\n{{payload}}',
        extraConfig: [
            { key: 'meetingType', label: 'Meeting type', type: 'text', placeholder: 'product sync', defaultValue: 'product sync' },
            { key: 'duration', label: 'Duration (minutes)', type: 'number', placeholder: '30', defaultValue: 30 }
        ]
    }),
    createAiChatModule({
        id: 'ai-meeting-recap',
        name: 'AI meeting recap',
        nameKey: 'qa_module_ai_meeting_recap_name',
        description: 'Summarise meeting notes with decisions and owners.',
        descriptionKey: 'qa_module_ai_meeting_recap_description',
        icon: 'check-circle',
        accent: '#10b981',
        tags: ['ai', 'meeting', 'summary'],
        systemPrompt: 'You write crisp meeting summaries that highlight decisions, action items, and owners.',
        userPrompt: 'Summarise the following meeting transcript. Include key decisions, action items with owners, deadlines, and open questions.\n\n{{payload}}'
    }),
    createAiChatModule({
        id: 'ai-support-reply',
        name: 'AI support reply',
        nameKey: 'qa_module_ai_support_reply_name',
        description: 'Draft a helpful customer support response.',
        descriptionKey: 'qa_module_ai_support_reply_description',
        icon: 'life-buoy',
        accent: '#f97316',
        tags: ['ai', 'support', 'email'],
        systemPrompt: 'You are a compassionate product support specialist focused on resolving customer issues.',
        userPrompt: 'Write a {{config.tone}} reply to the following support ticket about {{config.product}}. Include empathy, a concise diagnosis, and next steps.\n\n{{payload}}',
        extraConfig: [
            { key: 'tone', label: 'Tone', type: 'text', placeholder: 'friendly and reassuring', defaultValue: 'friendly and reassuring' },
            { key: 'product', label: 'Product', type: 'text', placeholder: 'FlashSearch', defaultValue: 'FlashSearch' }
        ]
    }),
    createAiChatModule({
        id: 'ai-social-caption',
        name: 'AI social caption',
        nameKey: 'qa_module_ai_social_caption_name',
        description: 'Generate engaging captions for social media posts.',
        descriptionKey: 'qa_module_ai_social_caption_description',
        icon: 'share-2',
        accent: '#ec4899',
        tags: ['ai', 'marketing', 'social'],
        systemPrompt: 'You craft concise and catchy social media copy that drives engagement.',
        userPrompt: 'Write three caption options for {{config.platform}} including a suggested call to action and relevant hashtags.\n\n{{payload}}',
        extraConfig: [
            { key: 'platform', label: 'Platform', type: 'text', placeholder: 'Instagram', defaultValue: 'Instagram' }
        ]
    }),
    createAiChatModule({
        id: 'ai-product-brief',
        name: 'AI product brief',
        nameKey: 'qa_module_ai_product_brief_name',
        description: 'Turn loose notes into a structured product brief.',
        descriptionKey: 'qa_module_ai_product_brief_description',
        icon: 'file',
        accent: '#6366f1',
        tags: ['ai', 'product', 'planning'],
        systemPrompt: 'You translate raw ideas into actionable product briefs with goals, scope, and metrics.',
        userPrompt: 'Create a structured product brief including problem statement, goals, success metrics, risks, and rollout plan.\n\n{{payload}}'
    }),
    createAiChatModule({
        id: 'ai-test-plan',
        name: 'AI test plan',
        nameKey: 'qa_module_ai_test_plan_name',
        description: 'Outline manual and automated tests for a feature.',
        descriptionKey: 'qa_module_ai_test_plan_description',
        icon: 'check-square',
        accent: '#14b8a6',
        tags: ['ai', 'qa', 'testing'],
        systemPrompt: 'You design comprehensive yet pragmatic software test plans.',
        userPrompt: 'Develop a test plan covering manual scenarios, automation candidates, edge cases, and success criteria for this feature:\n\n{{payload}}'
    }),
    createAiChatModule({
        id: 'ai-job-description',
        name: 'AI job description',
        nameKey: 'qa_module_ai_job_description_name',
        description: 'Draft a compelling job description with requirements.',
        descriptionKey: 'qa_module_ai_job_description_description',
        icon: 'briefcase',
        accent: '#facc15',
        tags: ['ai', 'hiring'],
        systemPrompt: 'You create inclusive, exciting job descriptions tailored to the right candidates.',
        userPrompt: 'Write a job description for a {{config.seniority}} {{config.role}}. Include responsibilities, qualifications, and a short pitch.\n\n{{payload}}',
        extraConfig: [
            { key: 'role', label: 'Role', type: 'text', placeholder: 'Product Manager', defaultValue: 'Product Manager' },
            { key: 'seniority', label: 'Seniority', type: 'text', placeholder: 'Senior', defaultValue: 'Senior' }
        ]
    }),
    createAiChatModule({
        id: 'ai-brainstorm-ideas',
        name: 'AI idea brainstorm',
        nameKey: 'qa_module_ai_brainstorm_ideas_name',
        description: 'Produce a list of creative ideas or concepts.',
        descriptionKey: 'qa_module_ai_brainstorm_ideas_description',
        icon: 'sunrise',
        accent: '#a855f7',
        tags: ['ai', 'brainstorm'],
        systemPrompt: 'You brainstorm diverse, creative ideas grounded in the provided context.',
        userPrompt: 'Generate {{config.count}} creative ideas related to the following request. Provide a short description and potential impact for each.\n\n{{payload}}',
        extraConfig: [
            { key: 'count', label: 'Number of ideas', type: 'number', placeholder: '5', defaultValue: 5 }
        ]
    }),
    createAiChatModule({
        id: 'ai-content-calendar',
        name: 'AI content calendar',
        nameKey: 'qa_module_ai_content_calendar_name',
        description: 'Plan a multi-week content calendar.',
        descriptionKey: 'qa_module_ai_content_calendar_description',
        icon: 'layout',
        accent: '#fb7185',
        tags: ['ai', 'marketing', 'planning'],
        systemPrompt: 'You design pragmatic editorial calendars aligned with strategic goals.',
        userPrompt: 'Create a {{config.duration}} week content calendar for {{config.channel}} focusing on {{config.theme}}. Include publish dates, topics, and formats.\n\n{{payload}}',
        extraConfig: [
            { key: 'duration', label: 'Duration (weeks)', type: 'number', placeholder: '4', defaultValue: 4 },
            { key: 'channel', label: 'Primary channel', type: 'text', placeholder: 'blog', defaultValue: 'blog' },
            { key: 'theme', label: 'Theme', type: 'text', placeholder: 'product announcements', defaultValue: 'product announcements' }
        ]
    }),
    createHttpModule({
        id: 'http-graphql',
        name: 'GraphQL query',
        description: 'Execute a GraphQL query with variables.',
        method: 'POST',
        icon: 'grid',
        accent: '#6366f1',
        tags: ['http', 'graphql', 'api'],
        includeBody: true,
        bodyPlaceholder: '{\n  "query": "query Example { viewer { login } }",\n  "variables": {}\n}'
    }),
    {
        id: 'http-form-post',
        category: 'action',
        name: 'HTTP form POST',
        description: 'Send form-encoded data to an endpoint.',
        icon: 'send',
        accent: '#f59e0b',
        tags: ['http', 'form', 'api'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: {
            url: 'https://example.com/webhook',
            formData: 'name=FlashSearch',
            payloadField: ''
        },
        form: [
            { key: 'url', label: 'Request URL', type: 'text', placeholder: 'https://example.com/webhook' },
            { key: 'formData', label: 'Form data (key=value per line)', type: 'textarea', rows: 4, placeholder: 'name=FlashSearch' },
            { key: 'payloadField', label: 'Attach payload under field', type: 'text', placeholder: 'message' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const url = String(config?.url || '').trim();
            if (!url) {
                clone.logs.push('HTTP form POST skipped: URL is missing.');
                return [clone];
            }

            const params = new URLSearchParams();
            const lines = String(config?.formData || '')
                .split(/\r?\n/)
                .map(line => line.trim())
                .filter(Boolean);
            lines.forEach(line => {
                const [key, ...rest] = line.split('=');
                if (!key) return;
                params.append(key.trim(), rest.join('=') || '');
            });
            const payloadField = String(config?.payloadField || '').trim();
            if (payloadField) {
                params.append(payloadField, QuickActionTools.toText(clone.payload));
            }

            const result = await QuickActionApi.request(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
                body: params.toString()
            });

            if (result.error) {
                clone.logs.push(`HTTP form POST failed: ${result.error}`);
                return [clone];
            }

            clone.vars.lastStatus = result.status ?? clone.vars.lastStatus;
            clone.payload = result.text || QuickActionTools.toText(clone.payload);
            clone.logs.push(`HTTP form POST completed with status ${result.status ?? 'n/a'}.`);
            return [clone];
        }
    },
    {
        id: 'notify-slack-webhook',
        category: 'action',
        name: 'Slack webhook notify',
        description: 'Send a message to a Slack incoming webhook.',
        icon: 'slack',
        accent: '#c084fc',
        tags: ['notification', 'slack'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: {
            webhookUrl: '',
            message: '{{payload}}',
            username: 'FlashSearch Bot',
            channel: '',
            iconEmoji: ''
        },
        form: [
            { key: 'webhookUrl', label: 'Webhook URL', type: 'text', placeholder: 'https://hooks.slack.com/services/…' },
            { key: 'message', label: 'Message template', type: 'textarea', rows: 3, placeholder: '{{payload}}' },
            { key: 'username', label: 'Username', type: 'text', placeholder: 'FlashSearch Bot' },
            { key: 'channel', label: 'Channel (optional)', type: 'text', placeholder: '#alerts' },
            { key: 'iconEmoji', label: 'Icon emoji (optional)', type: 'text', placeholder: ':rocket:' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const url = String(config?.webhookUrl || '').trim();
            if (!url) {
                clone.logs.push('Slack webhook notify skipped: webhook URL is missing.');
                return [clone];
            }

            const message = QuickActionTools.applyTemplate(config?.message ?? '{{payload}}', clone, config).trim();
            if (!message) {
                clone.logs.push('Slack webhook notify skipped: message is empty.');
                return [clone];
            }

            const payload = { text: message };
            if (config?.username) payload.username = config.username;
            if (config?.channel) payload.channel = config.channel;
            if (config?.iconEmoji) payload.icon_emoji = config.iconEmoji;

            const result = await QuickActionApi.request(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (result.error) {
                clone.logs.push(`Slack webhook notify failed: ${result.error}`);
                return [clone];
            }

            clone.vars.lastStatus = result.status ?? clone.vars.lastStatus;
            clone.payload = message;
            clone.logs.push(`Slack webhook notify completed with status ${result.status ?? 'n/a'}.`);
            return [clone];
        }
    },
    {
        id: 'notify-discord-webhook',
        category: 'action',
        name: 'Discord webhook notify',
        description: 'Post a message to a Discord webhook endpoint.',
        icon: 'message-circle',
        accent: '#60a5fa',
        tags: ['notification', 'discord'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: {
            webhookUrl: '',
            message: '{{payload}}',
            username: 'FlashSearch Bot'
        },
        form: [
            { key: 'webhookUrl', label: 'Webhook URL', type: 'text', placeholder: 'https://discord.com/api/webhooks/…' },
            { key: 'message', label: 'Message template', type: 'textarea', rows: 3, placeholder: '{{payload}}' },
            { key: 'username', label: 'Username', type: 'text', placeholder: 'FlashSearch Bot' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const url = String(config?.webhookUrl || '').trim();
            if (!url) {
                clone.logs.push('Discord webhook notify skipped: webhook URL is missing.');
                return [clone];
            }

            const message = QuickActionTools.applyTemplate(config?.message ?? '{{payload}}', clone, config).trim();
            if (!message) {
                clone.logs.push('Discord webhook notify skipped: message is empty.');
                return [clone];
            }

            const payload = { content: message };
            if (config?.username) payload.username = config.username;

            const result = await QuickActionApi.request(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (result.error) {
                clone.logs.push(`Discord webhook notify failed: ${result.error}`);
                return [clone];
            }

            clone.vars.lastStatus = result.status ?? clone.vars.lastStatus;
            clone.payload = message;
            clone.logs.push(`Discord webhook notify completed with status ${result.status ?? 'n/a'}.`);
            return [clone];
        }
    },
    {
        id: 'payload-sort-lines',
        category: 'utility',
        name: 'Sort lines',
        description: 'Sort the payload lines alphabetically.',
        icon: 'filter',
        accent: '#34d399',
        tags: ['text', 'sort'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { order: 'asc', caseSensitive: false },
        form: [
            {
                key: 'order',
                label: 'Order',
                type: 'select',
                options: [
                    { value: 'asc', label: 'Ascending' },
                    { value: 'desc', label: 'Descending' }
                ]
            },
            { key: 'caseSensitive', label: 'Case sensitive', type: 'checkbox' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const lines = QuickActionTools.toLines(clone.payload);
            const caseSensitive = Boolean(config?.caseSensitive);
            const sorted = lines.slice().sort((a, b) => {
                const left = caseSensitive ? a : a.toLowerCase();
                const right = caseSensitive ? b : b.toLowerCase();
                if (left < right) return -1;
                if (left > right) return 1;
                return 0;
            });
            if ((config?.order || 'asc') === 'desc') {
                sorted.reverse();
            }
            clone.payload = sorted.join('\n');
            clone.logs.push('Sorted payload lines.');
            return [clone];
        }
    },
    {
        id: 'payload-unique-lines',
        category: 'utility',
        name: 'Unique lines',
        description: 'Remove duplicate lines from the payload.',
        icon: 'layers',
        accent: '#38bdf8',
        tags: ['text', 'dedupe'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { caseSensitive: false },
        form: [
            { key: 'caseSensitive', label: 'Case sensitive', type: 'checkbox' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const lines = QuickActionTools.toLines(clone.payload);
            const seen = new Map();
            const caseSensitive = Boolean(config?.caseSensitive);
            lines.forEach(line => {
                const key = caseSensitive ? line : line.toLowerCase();
                if (!seen.has(key)) {
                    seen.set(key, line);
                }
            });
            clone.payload = Array.from(seen.values()).join('\n');
            clone.logs.push('Removed duplicate lines.');
            return [clone];
        }
    },
    {
        id: 'payload-find-replace',
        category: 'utility',
        name: 'Find & replace',
        description: 'Replace matching text inside the payload.',
        icon: 'edit-3',
        accent: '#f97316',
        tags: ['text', 'replace'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { search: '', replace: '', caseSensitive: false },
        form: [
            { key: 'search', label: 'Find', type: 'text', placeholder: 'Search text' },
            { key: 'replace', label: 'Replace with', type: 'text', placeholder: 'Replacement text' },
            { key: 'caseSensitive', label: 'Case sensitive', type: 'checkbox' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const search = String(config?.search || '');
            if (!search) {
                clone.logs.push('Find & replace skipped: search text is empty.');
                return [clone];
            }
            const source = QuickActionTools.toText(clone.payload);
            const replaceText = String(config?.replace ?? '');
            const caseSensitive = Boolean(config?.caseSensitive);
            const pattern = caseSensitive
                ? new RegExp(QuickActionTools.escapeRegExp(search), 'g')
                : new RegExp(QuickActionTools.escapeRegExp(search), 'gi');
            clone.payload = source.replace(pattern, replaceText);
            clone.logs.push('Performed find & replace on payload.');
            return [clone];
        }
    },
    {
        id: 'payload-join-lines',
        category: 'utility',
        name: 'Join lines',
        description: 'Join an array or multi-line text into a single string.',
        icon: 'link',
        accent: '#f472b6',
        tags: ['text', 'format'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { separator: '\n' },
        form: [
            { key: 'separator', label: 'Separator', type: 'text', placeholder: '\\n' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const separator = config?.separator ?? '\n';
            let source = clone.payload;
            if (Array.isArray(source)) {
                source = source.map(item => QuickActionTools.toText(item));
            } else {
                source = QuickActionTools.toLines(source);
            }
            clone.payload = source.join(separator);
            clone.logs.push('Joined lines into single payload.');
            return [clone];
        }
    }
];

const QuickActionFantasyModules = [
    {
        id: 'fantasy-trigger-aurora-pulse',
        category: 'trigger',
        name: 'Aurora pulse trigger',
        description: 'Wake flows whenever shimmering auroras pulse across your workspace.',
        icon: 'sunrise',
        accent: '#a78bfa',
        tags: ['trigger', 'aurora', 'pulse', 'fantasy'],
        inputs: [],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { intensity: 'medium', loops: 1, tempo: 2, includeBase: true, label: 'Aurora memory band' },
        form: [
            {
                key: 'intensity',
                label: 'Intensity',
                type: 'select',
                options: [
                    { value: 'calm', label: 'Calm' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'bold', label: 'Bold' }
                ]
            },
            { key: 'loops', label: 'Loops', type: 'number', min: 1, max: 9 },
            { key: 'tempo', label: 'Tempo', type: 'number', min: 1, max: 12 },
            { key: 'includeBase', label: 'Include base payload', type: 'checkbox' },
            { key: 'label', label: 'Label', type: 'text', placeholder: 'Aurora memory band' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const basePayload = QuickActionTools.toText(clone.payload ?? '');
            const intensity = String(config?.intensity || 'medium').toLowerCase();
            const loops = Math.max(1, parseInt(config?.loops, 10) || 1);
            const tempo = Math.max(1, parseInt(config?.tempo, 10) || 1);
            const includeBase = config?.includeBase !== false;
            const label = (config?.label || 'Aurora memory band').trim() || 'Aurora memory band';
            const fragments = [
                'Aurora pulse trigger fragment glittering aurora sequence 1',
                'Aurora pulse trigger fragment flowing celestial sequence 2',
                'Aurora pulse trigger fragment spinning curtain sequence 3',
                'Aurora pulse trigger fragment looping polar sequence 4',
                'Aurora pulse trigger fragment vibrant glow sequence 5',
                'Aurora pulse trigger fragment wandering whisper sequence 6',
                'Aurora pulse trigger fragment braided starlit sequence 7',
                'Aurora pulse trigger fragment singing veil sequence 8',
                'Aurora pulse trigger fragment humming aurora sequence 9',
                'Aurora pulse trigger fragment simmering celestial sequence 10',
                'Aurora pulse trigger fragment glittering curtain sequence 11',
                'Aurora pulse trigger fragment flowing polar sequence 12',
                'Aurora pulse trigger fragment spinning glow sequence 13',
                'Aurora pulse trigger fragment looping whisper sequence 14',
                'Aurora pulse trigger fragment vibrant starlit sequence 15',
                'Aurora pulse trigger fragment wandering veil sequence 16',
                'Aurora pulse trigger fragment braided aurora sequence 17',
                'Aurora pulse trigger fragment singing celestial sequence 18',
                'Aurora pulse trigger fragment humming curtain sequence 19',
                'Aurora pulse trigger fragment simmering polar sequence 20',
                'Aurora pulse trigger fragment glittering glow sequence 21',
                'Aurora pulse trigger fragment flowing whisper sequence 22',
                'Aurora pulse trigger fragment spinning starlit sequence 23',
                'Aurora pulse trigger fragment looping veil sequence 24',
                'Aurora pulse trigger fragment vibrant aurora sequence 25',
            ];
            const moods = [
                'Aurora pulse trigger mood dawn aurora sequence 1',
                'Aurora pulse trigger mood twilight celestial sequence 2',
                'Aurora pulse trigger mood echo curtain sequence 3',
                'Aurora pulse trigger mood glow polar sequence 4',
                'Aurora pulse trigger mood spark glow sequence 5',
                'Aurora pulse trigger mood tide whisper sequence 6',
                'Aurora pulse trigger mood whisper starlit sequence 7',
                'Aurora pulse trigger mood hum veil sequence 8',
                'Aurora pulse trigger mood pulse aurora sequence 9',
                'Aurora pulse trigger mood chorus celestial sequence 10',
                'Aurora pulse trigger mood dawn curtain sequence 11',
                'Aurora pulse trigger mood twilight polar sequence 12',
                'Aurora pulse trigger mood echo glow sequence 13',
                'Aurora pulse trigger mood glow whisper sequence 14',
                'Aurora pulse trigger mood spark starlit sequence 15',
                'Aurora pulse trigger mood tide veil sequence 16',
                'Aurora pulse trigger mood whisper aurora sequence 17',
                'Aurora pulse trigger mood hum celestial sequence 18',
                'Aurora pulse trigger mood pulse curtain sequence 19',
                'Aurora pulse trigger mood chorus polar sequence 20',
                'Aurora pulse trigger mood dawn glow sequence 21',
                'Aurora pulse trigger mood twilight whisper sequence 22',
                'Aurora pulse trigger mood echo starlit sequence 23',
                'Aurora pulse trigger mood glow veil sequence 24',
                'Aurora pulse trigger mood spark aurora sequence 25',
            ];
            const connectors = [
                'Aurora pulse trigger connector weaving aurora sequence 1',
                'Aurora pulse trigger connector braiding celestial sequence 2',
                'Aurora pulse trigger connector linking curtain sequence 3',
                'Aurora pulse trigger connector stitching polar sequence 4',
                'Aurora pulse trigger connector guiding glow sequence 5',
                'Aurora pulse trigger connector threading whisper sequence 6',
                'Aurora pulse trigger connector folding starlit sequence 7',
                'Aurora pulse trigger connector mapping veil sequence 8',
                'Aurora pulse trigger connector casting aurora sequence 9',
                'Aurora pulse trigger connector painting celestial sequence 10',
                'Aurora pulse trigger connector weaving curtain sequence 11',
                'Aurora pulse trigger connector braiding polar sequence 12',
                'Aurora pulse trigger connector linking glow sequence 13',
                'Aurora pulse trigger connector stitching whisper sequence 14',
                'Aurora pulse trigger connector guiding starlit sequence 15',
                'Aurora pulse trigger connector threading veil sequence 16',
                'Aurora pulse trigger connector folding aurora sequence 17',
                'Aurora pulse trigger connector mapping celestial sequence 18',
                'Aurora pulse trigger connector casting curtain sequence 19',
                'Aurora pulse trigger connector painting polar sequence 20',
                'Aurora pulse trigger connector weaving glow sequence 21',
                'Aurora pulse trigger connector braiding whisper sequence 22',
                'Aurora pulse trigger connector linking starlit sequence 23',
                'Aurora pulse trigger connector stitching veil sequence 24',
                'Aurora pulse trigger connector guiding aurora sequence 25',
            ];
            const details = [
                'Aurora pulse trigger detail over valleys aurora sequence 1',
                'Aurora pulse trigger detail within galleries celestial sequence 2',
                'Aurora pulse trigger detail across skylines curtain sequence 3',
                'Aurora pulse trigger detail through spirals polar sequence 4',
                'Aurora pulse trigger detail inside lanterns glow sequence 5',
                'Aurora pulse trigger detail beyond harbors whisper sequence 6',
                'Aurora pulse trigger detail beneath constellations starlit sequence 7',
                'Aurora pulse trigger detail among terraces veil sequence 8',
                'Aurora pulse trigger detail into archives aurora sequence 9',
                'Aurora pulse trigger detail around rivers celestial sequence 10',
                'Aurora pulse trigger detail over valleys curtain sequence 11',
                'Aurora pulse trigger detail within galleries polar sequence 12',
                'Aurora pulse trigger detail across skylines glow sequence 13',
                'Aurora pulse trigger detail through spirals whisper sequence 14',
                'Aurora pulse trigger detail inside lanterns starlit sequence 15',
                'Aurora pulse trigger detail beyond harbors veil sequence 16',
                'Aurora pulse trigger detail beneath constellations aurora sequence 17',
                'Aurora pulse trigger detail among terraces celestial sequence 18',
                'Aurora pulse trigger detail into archives curtain sequence 19',
                'Aurora pulse trigger detail around rivers polar sequence 20',
                'Aurora pulse trigger detail over valleys glow sequence 21',
                'Aurora pulse trigger detail within galleries whisper sequence 22',
                'Aurora pulse trigger detail across skylines starlit sequence 23',
                'Aurora pulse trigger detail through spirals veil sequence 24',
                'Aurora pulse trigger detail inside lanterns aurora sequence 25',
            ];
            const compositions = [];
            for (let cycle = 0; cycle < loops; cycle++) {
                for (let index = 0; index < fragments.length; index++) {
                    const fragment = fragments[index];
                    const mood = moods[(index + cycle) % moods.length];
                    const connector = connectors[(index + tempo + cycle) % connectors.length];
                    const detail = details[(index + loops + cycle) % details.length];
                    const amplitude = ((index + 1) % (tempo + 1)) + cycle;
                    compositions.push({
                        fragment,
                        mood,
                        connector,
                        detail,
                        cycle: cycle + 1,
                        beat: index + 1,
                        amplitude,
                        intensity
                    });
                }
            }
            const curatedLines = [];
            compositions.forEach((item, index) => {
                const emphasiser = index % 2 === 0 ? '>' : '~';
                const descriptor = `${label} | cycle ${item.cycle} | beat ${item.beat} | ${item.fragment} | ${item.mood} | ${item.connector} | ${item.detail} | amplitude ${item.amplitude} | intensity ${item.intensity}`;
                curatedLines.push(`${emphasiser} ${descriptor}`);
                if ((index + 1) % tempo === 0) {
                    curatedLines.push(`tempo-marker ${tempo} :: segment ${index + 1}`);
                }
                if (index % 3 === 0) {
                    curatedLines.push(`echo ${index + 1} :: ${label} weaving ${item.connector}`);
                }
            });
            const layered = [];
            for (let index = 0; index < curatedLines.length; index++) {
                const focus = curatedLines[index];
                layered.push(`${label} swirl ${index + 1} => ${focus}`);
                if (index % 4 === 0) {
                    layered.push(`${label} harmonic ${index + 1} tempo ${tempo}`);
                }
            }
            const ensemble = layered.concat(curatedLines);
            const deduplicated = [];
            const seen = new Set();
            ensemble.forEach((item) => {
                if (!seen.has(item)) {
                    deduplicated.push(item);
                    seen.add(item);
                }
            });
            const trimmedBase = basePayload.trim();
            if (includeBase && trimmedBase) {
                deduplicated.unshift(`base-payload :: ${trimmedBase}`);
            }
            const numbered = deduplicated.map((line, index) => `${index + 1}. ${line}`);
            const newlineChar = String.fromCharCode(10);
            const safeKey = 'fantasy_trigger_aurora_pulse';
            clone.vars[`${safeKey}_intensity`] = intensity;
            clone.vars[`${safeKey}_compositions`] = compositions.length;
            clone.vars[`${safeKey}_label`] = label;
            clone.vars[`${safeKey}_entries`] = numbered.length;
            clone.payload = numbered.join(newlineChar);
            clone.logs.push('Aurora pulse trigger emitted aurora memory band sequences.');
            return [clone];
        }
    },
    {
        id: 'fantasy-trigger-echo-harvest',
        category: 'trigger',
        name: 'Echo harvest trigger',
        description: 'Start sequences when echoing ideas gather into shimmering clusters.',
        icon: 'radio',
        accent: '#f472b6',
        tags: ['trigger', 'echo', 'harvest', 'fantasy'],
        inputs: [],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { intensity: 'medium', loops: 1, tempo: 2, includeBase: true, label: 'Echo harvest chart' },
        form: [
            {
                key: 'intensity',
                label: 'Intensity',
                type: 'select',
                options: [
                    { value: 'calm', label: 'Calm' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'bold', label: 'Bold' }
                ]
            },
            { key: 'loops', label: 'Loops', type: 'number', min: 1, max: 9 },
            { key: 'tempo', label: 'Tempo', type: 'number', min: 1, max: 12 },
            { key: 'includeBase', label: 'Include base payload', type: 'checkbox' },
            { key: 'label', label: 'Label', type: 'text', placeholder: 'Echo harvest chart' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const basePayload = QuickActionTools.toText(clone.payload ?? '');
            const intensity = String(config?.intensity || 'medium').toLowerCase();
            const loops = Math.max(1, parseInt(config?.loops, 10) || 1);
            const tempo = Math.max(1, parseInt(config?.tempo, 10) || 1);
            const includeBase = config?.includeBase !== false;
            const label = (config?.label || 'Echo harvest chart').trim() || 'Echo harvest chart';
            const fragments = [
                'Echo harvest trigger fragment glittering echo sequence 1',
                'Echo harvest trigger fragment flowing harvest sequence 2',
                'Echo harvest trigger fragment spinning resonance sequence 3',
                'Echo harvest trigger fragment looping gather sequence 4',
                'Echo harvest trigger fragment vibrant cluster sequence 5',
                'Echo harvest trigger fragment wandering gleam sequence 6',
                'Echo harvest trigger fragment braided cycle sequence 7',
                'Echo harvest trigger fragment singing orchard sequence 8',
                'Echo harvest trigger fragment humming echo sequence 9',
                'Echo harvest trigger fragment simmering harvest sequence 10',
                'Echo harvest trigger fragment glittering resonance sequence 11',
                'Echo harvest trigger fragment flowing gather sequence 12',
                'Echo harvest trigger fragment spinning cluster sequence 13',
                'Echo harvest trigger fragment looping gleam sequence 14',
                'Echo harvest trigger fragment vibrant cycle sequence 15',
                'Echo harvest trigger fragment wandering orchard sequence 16',
                'Echo harvest trigger fragment braided echo sequence 17',
                'Echo harvest trigger fragment singing harvest sequence 18',
                'Echo harvest trigger fragment humming resonance sequence 19',
                'Echo harvest trigger fragment simmering gather sequence 20',
                'Echo harvest trigger fragment glittering cluster sequence 21',
                'Echo harvest trigger fragment flowing gleam sequence 22',
                'Echo harvest trigger fragment spinning cycle sequence 23',
                'Echo harvest trigger fragment looping orchard sequence 24',
                'Echo harvest trigger fragment vibrant echo sequence 25',
            ];
            const moods = [
                'Echo harvest trigger mood dawn echo sequence 1',
                'Echo harvest trigger mood twilight harvest sequence 2',
                'Echo harvest trigger mood echo resonance sequence 3',
                'Echo harvest trigger mood glow gather sequence 4',
                'Echo harvest trigger mood spark cluster sequence 5',
                'Echo harvest trigger mood tide gleam sequence 6',
                'Echo harvest trigger mood whisper cycle sequence 7',
                'Echo harvest trigger mood hum orchard sequence 8',
                'Echo harvest trigger mood pulse echo sequence 9',
                'Echo harvest trigger mood chorus harvest sequence 10',
                'Echo harvest trigger mood dawn resonance sequence 11',
                'Echo harvest trigger mood twilight gather sequence 12',
                'Echo harvest trigger mood echo cluster sequence 13',
                'Echo harvest trigger mood glow gleam sequence 14',
                'Echo harvest trigger mood spark cycle sequence 15',
                'Echo harvest trigger mood tide orchard sequence 16',
                'Echo harvest trigger mood whisper echo sequence 17',
                'Echo harvest trigger mood hum harvest sequence 18',
                'Echo harvest trigger mood pulse resonance sequence 19',
                'Echo harvest trigger mood chorus gather sequence 20',
                'Echo harvest trigger mood dawn cluster sequence 21',
                'Echo harvest trigger mood twilight gleam sequence 22',
                'Echo harvest trigger mood echo cycle sequence 23',
                'Echo harvest trigger mood glow orchard sequence 24',
                'Echo harvest trigger mood spark echo sequence 25',
            ];
            const connectors = [
                'Echo harvest trigger connector weaving echo sequence 1',
                'Echo harvest trigger connector braiding harvest sequence 2',
                'Echo harvest trigger connector linking resonance sequence 3',
                'Echo harvest trigger connector stitching gather sequence 4',
                'Echo harvest trigger connector guiding cluster sequence 5',
                'Echo harvest trigger connector threading gleam sequence 6',
                'Echo harvest trigger connector folding cycle sequence 7',
                'Echo harvest trigger connector mapping orchard sequence 8',
                'Echo harvest trigger connector casting echo sequence 9',
                'Echo harvest trigger connector painting harvest sequence 10',
                'Echo harvest trigger connector weaving resonance sequence 11',
                'Echo harvest trigger connector braiding gather sequence 12',
                'Echo harvest trigger connector linking cluster sequence 13',
                'Echo harvest trigger connector stitching gleam sequence 14',
                'Echo harvest trigger connector guiding cycle sequence 15',
                'Echo harvest trigger connector threading orchard sequence 16',
                'Echo harvest trigger connector folding echo sequence 17',
                'Echo harvest trigger connector mapping harvest sequence 18',
                'Echo harvest trigger connector casting resonance sequence 19',
                'Echo harvest trigger connector painting gather sequence 20',
                'Echo harvest trigger connector weaving cluster sequence 21',
                'Echo harvest trigger connector braiding gleam sequence 22',
                'Echo harvest trigger connector linking cycle sequence 23',
                'Echo harvest trigger connector stitching orchard sequence 24',
                'Echo harvest trigger connector guiding echo sequence 25',
            ];
            const details = [
                'Echo harvest trigger detail over valleys echo sequence 1',
                'Echo harvest trigger detail within galleries harvest sequence 2',
                'Echo harvest trigger detail across skylines resonance sequence 3',
                'Echo harvest trigger detail through spirals gather sequence 4',
                'Echo harvest trigger detail inside lanterns cluster sequence 5',
                'Echo harvest trigger detail beyond harbors gleam sequence 6',
                'Echo harvest trigger detail beneath constellations cycle sequence 7',
                'Echo harvest trigger detail among terraces orchard sequence 8',
                'Echo harvest trigger detail into archives echo sequence 9',
                'Echo harvest trigger detail around rivers harvest sequence 10',
                'Echo harvest trigger detail over valleys resonance sequence 11',
                'Echo harvest trigger detail within galleries gather sequence 12',
                'Echo harvest trigger detail across skylines cluster sequence 13',
                'Echo harvest trigger detail through spirals gleam sequence 14',
                'Echo harvest trigger detail inside lanterns cycle sequence 15',
                'Echo harvest trigger detail beyond harbors orchard sequence 16',
                'Echo harvest trigger detail beneath constellations echo sequence 17',
                'Echo harvest trigger detail among terraces harvest sequence 18',
                'Echo harvest trigger detail into archives resonance sequence 19',
                'Echo harvest trigger detail around rivers gather sequence 20',
                'Echo harvest trigger detail over valleys cluster sequence 21',
                'Echo harvest trigger detail within galleries gleam sequence 22',
                'Echo harvest trigger detail across skylines cycle sequence 23',
                'Echo harvest trigger detail through spirals orchard sequence 24',
                'Echo harvest trigger detail inside lanterns echo sequence 25',
            ];
            const compositions = [];
            for (let cycle = 0; cycle < loops; cycle++) {
                for (let index = 0; index < fragments.length; index++) {
                    const fragment = fragments[index];
                    const mood = moods[(index + cycle) % moods.length];
                    const connector = connectors[(index + tempo + cycle) % connectors.length];
                    const detail = details[(index + loops + cycle) % details.length];
                    const amplitude = ((index + 1) % (tempo + 1)) + cycle;
                    compositions.push({
                        fragment,
                        mood,
                        connector,
                        detail,
                        cycle: cycle + 1,
                        beat: index + 1,
                        amplitude,
                        intensity
                    });
                }
            }
            const curatedLines = [];
            compositions.forEach((item, index) => {
                const emphasiser = index % 2 === 0 ? '>' : '~';
                const descriptor = `${label} | cycle ${item.cycle} | beat ${item.beat} | ${item.fragment} | ${item.mood} | ${item.connector} | ${item.detail} | amplitude ${item.amplitude} | intensity ${item.intensity}`;
                curatedLines.push(`${emphasiser} ${descriptor}`);
                if ((index + 1) % tempo === 0) {
                    curatedLines.push(`tempo-marker ${tempo} :: segment ${index + 1}`);
                }
                if (index % 3 === 0) {
                    curatedLines.push(`echo ${index + 1} :: ${label} weaving ${item.connector}`);
                }
            });
            const layered = [];
            for (let index = 0; index < curatedLines.length; index++) {
                const focus = curatedLines[index];
                layered.push(`${label} swirl ${index + 1} => ${focus}`);
                if (index % 4 === 0) {
                    layered.push(`${label} harmonic ${index + 1} tempo ${tempo}`);
                }
            }
            const ensemble = layered.concat(curatedLines);
            const deduplicated = [];
            const seen = new Set();
            ensemble.forEach((item) => {
                if (!seen.has(item)) {
                    deduplicated.push(item);
                    seen.add(item);
                }
            });
            const trimmedBase = basePayload.trim();
            if (includeBase && trimmedBase) {
                deduplicated.unshift(`base-payload :: ${trimmedBase}`);
            }
            const numbered = deduplicated.map((line, index) => `${index + 1}. ${line}`);
            const newlineChar = String.fromCharCode(10);
            const safeKey = 'fantasy_trigger_echo_harvest';
            clone.vars[`${safeKey}_intensity`] = intensity;
            clone.vars[`${safeKey}_compositions`] = compositions.length;
            clone.vars[`${safeKey}_label`] = label;
            clone.vars[`${safeKey}_entries`] = numbered.length;
            clone.payload = numbered.join(newlineChar);
            clone.logs.push('Echo harvest trigger emitted echo harvest chart sequences.');
            return [clone];
        }
    },
    {
        id: 'fantasy-trigger-mist-signal',
        category: 'trigger',
        name: 'Mist signal trigger',
        description: 'Emit new flows when morning mist sketches novel silhouettes.',
        icon: 'cloud',
        accent: '#60a5fa',
        tags: ['trigger', 'mist', 'signal', 'fantasy'],
        inputs: [],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { intensity: 'medium', loops: 1, tempo: 2, includeBase: true, label: 'Mist signal atlas' },
        form: [
            {
                key: 'intensity',
                label: 'Intensity',
                type: 'select',
                options: [
                    { value: 'calm', label: 'Calm' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'bold', label: 'Bold' }
                ]
            },
            { key: 'loops', label: 'Loops', type: 'number', min: 1, max: 9 },
            { key: 'tempo', label: 'Tempo', type: 'number', min: 1, max: 12 },
            { key: 'includeBase', label: 'Include base payload', type: 'checkbox' },
            { key: 'label', label: 'Label', type: 'text', placeholder: 'Mist signal atlas' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const basePayload = QuickActionTools.toText(clone.payload ?? '');
            const intensity = String(config?.intensity || 'medium').toLowerCase();
            const loops = Math.max(1, parseInt(config?.loops, 10) || 1);
            const tempo = Math.max(1, parseInt(config?.tempo, 10) || 1);
            const includeBase = config?.includeBase !== false;
            const label = (config?.label || 'Mist signal atlas').trim() || 'Mist signal atlas';
            const fragments = [
                'Mist signal trigger fragment glittering mist sequence 1',
                'Mist signal trigger fragment flowing signal sequence 2',
                'Mist signal trigger fragment spinning haze sequence 3',
                'Mist signal trigger fragment looping silhouette sequence 4',
                'Mist signal trigger fragment vibrant dew sequence 5',
                'Mist signal trigger fragment wandering drift sequence 6',
                'Mist signal trigger fragment braided lantern sequence 7',
                'Mist signal trigger fragment singing mellow sequence 8',
                'Mist signal trigger fragment humming mist sequence 9',
                'Mist signal trigger fragment simmering signal sequence 10',
                'Mist signal trigger fragment glittering haze sequence 11',
                'Mist signal trigger fragment flowing silhouette sequence 12',
                'Mist signal trigger fragment spinning dew sequence 13',
                'Mist signal trigger fragment looping drift sequence 14',
                'Mist signal trigger fragment vibrant lantern sequence 15',
                'Mist signal trigger fragment wandering mellow sequence 16',
                'Mist signal trigger fragment braided mist sequence 17',
                'Mist signal trigger fragment singing signal sequence 18',
                'Mist signal trigger fragment humming haze sequence 19',
                'Mist signal trigger fragment simmering silhouette sequence 20',
                'Mist signal trigger fragment glittering dew sequence 21',
                'Mist signal trigger fragment flowing drift sequence 22',
                'Mist signal trigger fragment spinning lantern sequence 23',
                'Mist signal trigger fragment looping mellow sequence 24',
                'Mist signal trigger fragment vibrant mist sequence 25',
            ];
            const moods = [
                'Mist signal trigger mood dawn mist sequence 1',
                'Mist signal trigger mood twilight signal sequence 2',
                'Mist signal trigger mood echo haze sequence 3',
                'Mist signal trigger mood glow silhouette sequence 4',
                'Mist signal trigger mood spark dew sequence 5',
                'Mist signal trigger mood tide drift sequence 6',
                'Mist signal trigger mood whisper lantern sequence 7',
                'Mist signal trigger mood hum mellow sequence 8',
                'Mist signal trigger mood pulse mist sequence 9',
                'Mist signal trigger mood chorus signal sequence 10',
                'Mist signal trigger mood dawn haze sequence 11',
                'Mist signal trigger mood twilight silhouette sequence 12',
                'Mist signal trigger mood echo dew sequence 13',
                'Mist signal trigger mood glow drift sequence 14',
                'Mist signal trigger mood spark lantern sequence 15',
                'Mist signal trigger mood tide mellow sequence 16',
                'Mist signal trigger mood whisper mist sequence 17',
                'Mist signal trigger mood hum signal sequence 18',
                'Mist signal trigger mood pulse haze sequence 19',
                'Mist signal trigger mood chorus silhouette sequence 20',
                'Mist signal trigger mood dawn dew sequence 21',
                'Mist signal trigger mood twilight drift sequence 22',
                'Mist signal trigger mood echo lantern sequence 23',
                'Mist signal trigger mood glow mellow sequence 24',
                'Mist signal trigger mood spark mist sequence 25',
            ];
            const connectors = [
                'Mist signal trigger connector weaving mist sequence 1',
                'Mist signal trigger connector braiding signal sequence 2',
                'Mist signal trigger connector linking haze sequence 3',
                'Mist signal trigger connector stitching silhouette sequence 4',
                'Mist signal trigger connector guiding dew sequence 5',
                'Mist signal trigger connector threading drift sequence 6',
                'Mist signal trigger connector folding lantern sequence 7',
                'Mist signal trigger connector mapping mellow sequence 8',
                'Mist signal trigger connector casting mist sequence 9',
                'Mist signal trigger connector painting signal sequence 10',
                'Mist signal trigger connector weaving haze sequence 11',
                'Mist signal trigger connector braiding silhouette sequence 12',
                'Mist signal trigger connector linking dew sequence 13',
                'Mist signal trigger connector stitching drift sequence 14',
                'Mist signal trigger connector guiding lantern sequence 15',
                'Mist signal trigger connector threading mellow sequence 16',
                'Mist signal trigger connector folding mist sequence 17',
                'Mist signal trigger connector mapping signal sequence 18',
                'Mist signal trigger connector casting haze sequence 19',
                'Mist signal trigger connector painting silhouette sequence 20',
                'Mist signal trigger connector weaving dew sequence 21',
                'Mist signal trigger connector braiding drift sequence 22',
                'Mist signal trigger connector linking lantern sequence 23',
                'Mist signal trigger connector stitching mellow sequence 24',
                'Mist signal trigger connector guiding mist sequence 25',
            ];
            const details = [
                'Mist signal trigger detail over valleys mist sequence 1',
                'Mist signal trigger detail within galleries signal sequence 2',
                'Mist signal trigger detail across skylines haze sequence 3',
                'Mist signal trigger detail through spirals silhouette sequence 4',
                'Mist signal trigger detail inside lanterns dew sequence 5',
                'Mist signal trigger detail beyond harbors drift sequence 6',
                'Mist signal trigger detail beneath constellations lantern sequence 7',
                'Mist signal trigger detail among terraces mellow sequence 8',
                'Mist signal trigger detail into archives mist sequence 9',
                'Mist signal trigger detail around rivers signal sequence 10',
                'Mist signal trigger detail over valleys haze sequence 11',
                'Mist signal trigger detail within galleries silhouette sequence 12',
                'Mist signal trigger detail across skylines dew sequence 13',
                'Mist signal trigger detail through spirals drift sequence 14',
                'Mist signal trigger detail inside lanterns lantern sequence 15',
                'Mist signal trigger detail beyond harbors mellow sequence 16',
                'Mist signal trigger detail beneath constellations mist sequence 17',
                'Mist signal trigger detail among terraces signal sequence 18',
                'Mist signal trigger detail into archives haze sequence 19',
                'Mist signal trigger detail around rivers silhouette sequence 20',
                'Mist signal trigger detail over valleys dew sequence 21',
                'Mist signal trigger detail within galleries drift sequence 22',
                'Mist signal trigger detail across skylines lantern sequence 23',
                'Mist signal trigger detail through spirals mellow sequence 24',
                'Mist signal trigger detail inside lanterns mist sequence 25',
            ];
            const compositions = [];
            for (let cycle = 0; cycle < loops; cycle++) {
                for (let index = 0; index < fragments.length; index++) {
                    const fragment = fragments[index];
                    const mood = moods[(index + cycle) % moods.length];
                    const connector = connectors[(index + tempo + cycle) % connectors.length];
                    const detail = details[(index + loops + cycle) % details.length];
                    const amplitude = ((index + 1) % (tempo + 1)) + cycle;
                    compositions.push({
                        fragment,
                        mood,
                        connector,
                        detail,
                        cycle: cycle + 1,
                        beat: index + 1,
                        amplitude,
                        intensity
                    });
                }
            }
            const curatedLines = [];
            compositions.forEach((item, index) => {
                const emphasiser = index % 2 === 0 ? '>' : '~';
                const descriptor = `${label} | cycle ${item.cycle} | beat ${item.beat} | ${item.fragment} | ${item.mood} | ${item.connector} | ${item.detail} | amplitude ${item.amplitude} | intensity ${item.intensity}`;
                curatedLines.push(`${emphasiser} ${descriptor}`);
                if ((index + 1) % tempo === 0) {
                    curatedLines.push(`tempo-marker ${tempo} :: segment ${index + 1}`);
                }
                if (index % 3 === 0) {
                    curatedLines.push(`echo ${index + 1} :: ${label} weaving ${item.connector}`);
                }
            });
            const layered = [];
            for (let index = 0; index < curatedLines.length; index++) {
                const focus = curatedLines[index];
                layered.push(`${label} swirl ${index + 1} => ${focus}`);
                if (index % 4 === 0) {
                    layered.push(`${label} harmonic ${index + 1} tempo ${tempo}`);
                }
            }
            const ensemble = layered.concat(curatedLines);
            const deduplicated = [];
            const seen = new Set();
            ensemble.forEach((item) => {
                if (!seen.has(item)) {
                    deduplicated.push(item);
                    seen.add(item);
                }
            });
            const trimmedBase = basePayload.trim();
            if (includeBase && trimmedBase) {
                deduplicated.unshift(`base-payload :: ${trimmedBase}`);
            }
            const numbered = deduplicated.map((line, index) => `${index + 1}. ${line}`);
            const newlineChar = String.fromCharCode(10);
            const safeKey = 'fantasy_trigger_mist_signal';
            clone.vars[`${safeKey}_intensity`] = intensity;
            clone.vars[`${safeKey}_compositions`] = compositions.length;
            clone.vars[`${safeKey}_label`] = label;
            clone.vars[`${safeKey}_entries`] = numbered.length;
            clone.payload = numbered.join(newlineChar);
            clone.logs.push('Mist signal trigger emitted mist signal atlas sequences.');
            return [clone];
        }
    },
    {
        id: 'fantasy-trigger-thunder-braid',
        category: 'trigger',
        name: 'Thunder braid trigger',
        description: 'Kick off bursts when rolling thunder braids with bright ideas.',
        icon: 'zap',
        accent: '#f97316',
        tags: ['trigger', 'thunder', 'braid', 'fantasy'],
        inputs: [],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { intensity: 'medium', loops: 1, tempo: 2, includeBase: true, label: 'Thunder braid ledger' },
        form: [
            {
                key: 'intensity',
                label: 'Intensity',
                type: 'select',
                options: [
                    { value: 'calm', label: 'Calm' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'bold', label: 'Bold' }
                ]
            },
            { key: 'loops', label: 'Loops', type: 'number', min: 1, max: 9 },
            { key: 'tempo', label: 'Tempo', type: 'number', min: 1, max: 12 },
            { key: 'includeBase', label: 'Include base payload', type: 'checkbox' },
            { key: 'label', label: 'Label', type: 'text', placeholder: 'Thunder braid ledger' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const basePayload = QuickActionTools.toText(clone.payload ?? '');
            const intensity = String(config?.intensity || 'medium').toLowerCase();
            const loops = Math.max(1, parseInt(config?.loops, 10) || 1);
            const tempo = Math.max(1, parseInt(config?.tempo, 10) || 1);
            const includeBase = config?.includeBase !== false;
            const label = (config?.label || 'Thunder braid ledger').trim() || 'Thunder braid ledger';
            const fragments = [
                'Thunder braid trigger fragment glittering thunder sequence 1',
                'Thunder braid trigger fragment flowing braid sequence 2',
                'Thunder braid trigger fragment spinning rumble sequence 3',
                'Thunder braid trigger fragment looping spark sequence 4',
                'Thunder braid trigger fragment vibrant storm sequence 5',
                'Thunder braid trigger fragment wandering arc sequence 6',
                'Thunder braid trigger fragment braided plait sequence 7',
                'Thunder braid trigger fragment singing charge sequence 8',
                'Thunder braid trigger fragment humming thunder sequence 9',
                'Thunder braid trigger fragment simmering braid sequence 10',
                'Thunder braid trigger fragment glittering rumble sequence 11',
                'Thunder braid trigger fragment flowing spark sequence 12',
                'Thunder braid trigger fragment spinning storm sequence 13',
                'Thunder braid trigger fragment looping arc sequence 14',
                'Thunder braid trigger fragment vibrant plait sequence 15',
                'Thunder braid trigger fragment wandering charge sequence 16',
                'Thunder braid trigger fragment braided thunder sequence 17',
                'Thunder braid trigger fragment singing braid sequence 18',
                'Thunder braid trigger fragment humming rumble sequence 19',
                'Thunder braid trigger fragment simmering spark sequence 20',
                'Thunder braid trigger fragment glittering storm sequence 21',
                'Thunder braid trigger fragment flowing arc sequence 22',
                'Thunder braid trigger fragment spinning plait sequence 23',
                'Thunder braid trigger fragment looping charge sequence 24',
                'Thunder braid trigger fragment vibrant thunder sequence 25',
            ];
            const moods = [
                'Thunder braid trigger mood dawn thunder sequence 1',
                'Thunder braid trigger mood twilight braid sequence 2',
                'Thunder braid trigger mood echo rumble sequence 3',
                'Thunder braid trigger mood glow spark sequence 4',
                'Thunder braid trigger mood spark storm sequence 5',
                'Thunder braid trigger mood tide arc sequence 6',
                'Thunder braid trigger mood whisper plait sequence 7',
                'Thunder braid trigger mood hum charge sequence 8',
                'Thunder braid trigger mood pulse thunder sequence 9',
                'Thunder braid trigger mood chorus braid sequence 10',
                'Thunder braid trigger mood dawn rumble sequence 11',
                'Thunder braid trigger mood twilight spark sequence 12',
                'Thunder braid trigger mood echo storm sequence 13',
                'Thunder braid trigger mood glow arc sequence 14',
                'Thunder braid trigger mood spark plait sequence 15',
                'Thunder braid trigger mood tide charge sequence 16',
                'Thunder braid trigger mood whisper thunder sequence 17',
                'Thunder braid trigger mood hum braid sequence 18',
                'Thunder braid trigger mood pulse rumble sequence 19',
                'Thunder braid trigger mood chorus spark sequence 20',
                'Thunder braid trigger mood dawn storm sequence 21',
                'Thunder braid trigger mood twilight arc sequence 22',
                'Thunder braid trigger mood echo plait sequence 23',
                'Thunder braid trigger mood glow charge sequence 24',
                'Thunder braid trigger mood spark thunder sequence 25',
            ];
            const connectors = [
                'Thunder braid trigger connector weaving thunder sequence 1',
                'Thunder braid trigger connector braiding braid sequence 2',
                'Thunder braid trigger connector linking rumble sequence 3',
                'Thunder braid trigger connector stitching spark sequence 4',
                'Thunder braid trigger connector guiding storm sequence 5',
                'Thunder braid trigger connector threading arc sequence 6',
                'Thunder braid trigger connector folding plait sequence 7',
                'Thunder braid trigger connector mapping charge sequence 8',
                'Thunder braid trigger connector casting thunder sequence 9',
                'Thunder braid trigger connector painting braid sequence 10',
                'Thunder braid trigger connector weaving rumble sequence 11',
                'Thunder braid trigger connector braiding spark sequence 12',
                'Thunder braid trigger connector linking storm sequence 13',
                'Thunder braid trigger connector stitching arc sequence 14',
                'Thunder braid trigger connector guiding plait sequence 15',
                'Thunder braid trigger connector threading charge sequence 16',
                'Thunder braid trigger connector folding thunder sequence 17',
                'Thunder braid trigger connector mapping braid sequence 18',
                'Thunder braid trigger connector casting rumble sequence 19',
                'Thunder braid trigger connector painting spark sequence 20',
                'Thunder braid trigger connector weaving storm sequence 21',
                'Thunder braid trigger connector braiding arc sequence 22',
                'Thunder braid trigger connector linking plait sequence 23',
                'Thunder braid trigger connector stitching charge sequence 24',
                'Thunder braid trigger connector guiding thunder sequence 25',
            ];
            const details = [
                'Thunder braid trigger detail over valleys thunder sequence 1',
                'Thunder braid trigger detail within galleries braid sequence 2',
                'Thunder braid trigger detail across skylines rumble sequence 3',
                'Thunder braid trigger detail through spirals spark sequence 4',
                'Thunder braid trigger detail inside lanterns storm sequence 5',
                'Thunder braid trigger detail beyond harbors arc sequence 6',
                'Thunder braid trigger detail beneath constellations plait sequence 7',
                'Thunder braid trigger detail among terraces charge sequence 8',
                'Thunder braid trigger detail into archives thunder sequence 9',
                'Thunder braid trigger detail around rivers braid sequence 10',
                'Thunder braid trigger detail over valleys rumble sequence 11',
                'Thunder braid trigger detail within galleries spark sequence 12',
                'Thunder braid trigger detail across skylines storm sequence 13',
                'Thunder braid trigger detail through spirals arc sequence 14',
                'Thunder braid trigger detail inside lanterns plait sequence 15',
                'Thunder braid trigger detail beyond harbors charge sequence 16',
                'Thunder braid trigger detail beneath constellations thunder sequence 17',
                'Thunder braid trigger detail among terraces braid sequence 18',
                'Thunder braid trigger detail into archives rumble sequence 19',
                'Thunder braid trigger detail around rivers spark sequence 20',
                'Thunder braid trigger detail over valleys storm sequence 21',
                'Thunder braid trigger detail within galleries arc sequence 22',
                'Thunder braid trigger detail across skylines plait sequence 23',
                'Thunder braid trigger detail through spirals charge sequence 24',
                'Thunder braid trigger detail inside lanterns thunder sequence 25',
            ];
            const compositions = [];
            for (let cycle = 0; cycle < loops; cycle++) {
                for (let index = 0; index < fragments.length; index++) {
                    const fragment = fragments[index];
                    const mood = moods[(index + cycle) % moods.length];
                    const connector = connectors[(index + tempo + cycle) % connectors.length];
                    const detail = details[(index + loops + cycle) % details.length];
                    const amplitude = ((index + 1) % (tempo + 1)) + cycle;
                    compositions.push({
                        fragment,
                        mood,
                        connector,
                        detail,
                        cycle: cycle + 1,
                        beat: index + 1,
                        amplitude,
                        intensity
                    });
                }
            }
            const curatedLines = [];
            compositions.forEach((item, index) => {
                const emphasiser = index % 2 === 0 ? '>' : '~';
                const descriptor = `${label} | cycle ${item.cycle} | beat ${item.beat} | ${item.fragment} | ${item.mood} | ${item.connector} | ${item.detail} | amplitude ${item.amplitude} | intensity ${item.intensity}`;
                curatedLines.push(`${emphasiser} ${descriptor}`);
                if ((index + 1) % tempo === 0) {
                    curatedLines.push(`tempo-marker ${tempo} :: segment ${index + 1}`);
                }
                if (index % 3 === 0) {
                    curatedLines.push(`echo ${index + 1} :: ${label} weaving ${item.connector}`);
                }
            });
            const layered = [];
            for (let index = 0; index < curatedLines.length; index++) {
                const focus = curatedLines[index];
                layered.push(`${label} swirl ${index + 1} => ${focus}`);
                if (index % 4 === 0) {
                    layered.push(`${label} harmonic ${index + 1} tempo ${tempo}`);
                }
            }
            const ensemble = layered.concat(curatedLines);
            const deduplicated = [];
            const seen = new Set();
            ensemble.forEach((item) => {
                if (!seen.has(item)) {
                    deduplicated.push(item);
                    seen.add(item);
                }
            });
            const trimmedBase = basePayload.trim();
            if (includeBase && trimmedBase) {
                deduplicated.unshift(`base-payload :: ${trimmedBase}`);
            }
            const numbered = deduplicated.map((line, index) => `${index + 1}. ${line}`);
            const newlineChar = String.fromCharCode(10);
            const safeKey = 'fantasy_trigger_thunder_braid';
            clone.vars[`${safeKey}_intensity`] = intensity;
            clone.vars[`${safeKey}_compositions`] = compositions.length;
            clone.vars[`${safeKey}_label`] = label;
            clone.vars[`${safeKey}_entries`] = numbered.length;
            clone.payload = numbered.join(newlineChar);
            clone.logs.push('Thunder braid trigger emitted thunder braid ledger sequences.');
            return [clone];
        }
    },
    {
        id: 'fantasy-trigger-river-rhythm',
        category: 'trigger',
        name: 'River rhythm trigger',
        description: 'Launch waves when river rhythms line up with curious notes.',
        icon: 'activity',
        accent: '#34d399',
        tags: ['trigger', 'river', 'rhythm', 'fantasy'],
        inputs: [],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { intensity: 'medium', loops: 1, tempo: 2, includeBase: true, label: 'River rhythm script' },
        form: [
            {
                key: 'intensity',
                label: 'Intensity',
                type: 'select',
                options: [
                    { value: 'calm', label: 'Calm' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'bold', label: 'Bold' }
                ]
            },
            { key: 'loops', label: 'Loops', type: 'number', min: 1, max: 9 },
            { key: 'tempo', label: 'Tempo', type: 'number', min: 1, max: 12 },
            { key: 'includeBase', label: 'Include base payload', type: 'checkbox' },
            { key: 'label', label: 'Label', type: 'text', placeholder: 'River rhythm script' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const basePayload = QuickActionTools.toText(clone.payload ?? '');
            const intensity = String(config?.intensity || 'medium').toLowerCase();
            const loops = Math.max(1, parseInt(config?.loops, 10) || 1);
            const tempo = Math.max(1, parseInt(config?.tempo, 10) || 1);
            const includeBase = config?.includeBase !== false;
            const label = (config?.label || 'River rhythm script').trim() || 'River rhythm script';
            const fragments = [
                'River rhythm trigger fragment glittering river sequence 1',
                'River rhythm trigger fragment flowing rhythm sequence 2',
                'River rhythm trigger fragment spinning current sequence 3',
                'River rhythm trigger fragment looping stone sequence 4',
                'River rhythm trigger fragment vibrant eddy sequence 5',
                'River rhythm trigger fragment wandering cascade sequence 6',
                'River rhythm trigger fragment braided tide sequence 7',
                'River rhythm trigger fragment singing song sequence 8',
                'River rhythm trigger fragment humming river sequence 9',
                'River rhythm trigger fragment simmering rhythm sequence 10',
                'River rhythm trigger fragment glittering current sequence 11',
                'River rhythm trigger fragment flowing stone sequence 12',
                'River rhythm trigger fragment spinning eddy sequence 13',
                'River rhythm trigger fragment looping cascade sequence 14',
                'River rhythm trigger fragment vibrant tide sequence 15',
                'River rhythm trigger fragment wandering song sequence 16',
                'River rhythm trigger fragment braided river sequence 17',
                'River rhythm trigger fragment singing rhythm sequence 18',
                'River rhythm trigger fragment humming current sequence 19',
                'River rhythm trigger fragment simmering stone sequence 20',
                'River rhythm trigger fragment glittering eddy sequence 21',
                'River rhythm trigger fragment flowing cascade sequence 22',
                'River rhythm trigger fragment spinning tide sequence 23',
                'River rhythm trigger fragment looping song sequence 24',
                'River rhythm trigger fragment vibrant river sequence 25',
            ];
            const moods = [
                'River rhythm trigger mood dawn river sequence 1',
                'River rhythm trigger mood twilight rhythm sequence 2',
                'River rhythm trigger mood echo current sequence 3',
                'River rhythm trigger mood glow stone sequence 4',
                'River rhythm trigger mood spark eddy sequence 5',
                'River rhythm trigger mood tide cascade sequence 6',
                'River rhythm trigger mood whisper tide sequence 7',
                'River rhythm trigger mood hum song sequence 8',
                'River rhythm trigger mood pulse river sequence 9',
                'River rhythm trigger mood chorus rhythm sequence 10',
                'River rhythm trigger mood dawn current sequence 11',
                'River rhythm trigger mood twilight stone sequence 12',
                'River rhythm trigger mood echo eddy sequence 13',
                'River rhythm trigger mood glow cascade sequence 14',
                'River rhythm trigger mood spark tide sequence 15',
                'River rhythm trigger mood tide song sequence 16',
                'River rhythm trigger mood whisper river sequence 17',
                'River rhythm trigger mood hum rhythm sequence 18',
                'River rhythm trigger mood pulse current sequence 19',
                'River rhythm trigger mood chorus stone sequence 20',
                'River rhythm trigger mood dawn eddy sequence 21',
                'River rhythm trigger mood twilight cascade sequence 22',
                'River rhythm trigger mood echo tide sequence 23',
                'River rhythm trigger mood glow song sequence 24',
                'River rhythm trigger mood spark river sequence 25',
            ];
            const connectors = [
                'River rhythm trigger connector weaving river sequence 1',
                'River rhythm trigger connector braiding rhythm sequence 2',
                'River rhythm trigger connector linking current sequence 3',
                'River rhythm trigger connector stitching stone sequence 4',
                'River rhythm trigger connector guiding eddy sequence 5',
                'River rhythm trigger connector threading cascade sequence 6',
                'River rhythm trigger connector folding tide sequence 7',
                'River rhythm trigger connector mapping song sequence 8',
                'River rhythm trigger connector casting river sequence 9',
                'River rhythm trigger connector painting rhythm sequence 10',
                'River rhythm trigger connector weaving current sequence 11',
                'River rhythm trigger connector braiding stone sequence 12',
                'River rhythm trigger connector linking eddy sequence 13',
                'River rhythm trigger connector stitching cascade sequence 14',
                'River rhythm trigger connector guiding tide sequence 15',
                'River rhythm trigger connector threading song sequence 16',
                'River rhythm trigger connector folding river sequence 17',
                'River rhythm trigger connector mapping rhythm sequence 18',
                'River rhythm trigger connector casting current sequence 19',
                'River rhythm trigger connector painting stone sequence 20',
                'River rhythm trigger connector weaving eddy sequence 21',
                'River rhythm trigger connector braiding cascade sequence 22',
                'River rhythm trigger connector linking tide sequence 23',
                'River rhythm trigger connector stitching song sequence 24',
                'River rhythm trigger connector guiding river sequence 25',
            ];
            const details = [
                'River rhythm trigger detail over valleys river sequence 1',
                'River rhythm trigger detail within galleries rhythm sequence 2',
                'River rhythm trigger detail across skylines current sequence 3',
                'River rhythm trigger detail through spirals stone sequence 4',
                'River rhythm trigger detail inside lanterns eddy sequence 5',
                'River rhythm trigger detail beyond harbors cascade sequence 6',
                'River rhythm trigger detail beneath constellations tide sequence 7',
                'River rhythm trigger detail among terraces song sequence 8',
                'River rhythm trigger detail into archives river sequence 9',
                'River rhythm trigger detail around rivers rhythm sequence 10',
                'River rhythm trigger detail over valleys current sequence 11',
                'River rhythm trigger detail within galleries stone sequence 12',
                'River rhythm trigger detail across skylines eddy sequence 13',
                'River rhythm trigger detail through spirals cascade sequence 14',
                'River rhythm trigger detail inside lanterns tide sequence 15',
                'River rhythm trigger detail beyond harbors song sequence 16',
                'River rhythm trigger detail beneath constellations river sequence 17',
                'River rhythm trigger detail among terraces rhythm sequence 18',
                'River rhythm trigger detail into archives current sequence 19',
                'River rhythm trigger detail around rivers stone sequence 20',
                'River rhythm trigger detail over valleys eddy sequence 21',
                'River rhythm trigger detail within galleries cascade sequence 22',
                'River rhythm trigger detail across skylines tide sequence 23',
                'River rhythm trigger detail through spirals song sequence 24',
                'River rhythm trigger detail inside lanterns river sequence 25',
            ];
            const compositions = [];
            for (let cycle = 0; cycle < loops; cycle++) {
                for (let index = 0; index < fragments.length; index++) {
                    const fragment = fragments[index];
                    const mood = moods[(index + cycle) % moods.length];
                    const connector = connectors[(index + tempo + cycle) % connectors.length];
                    const detail = details[(index + loops + cycle) % details.length];
                    const amplitude = ((index + 1) % (tempo + 1)) + cycle;
                    compositions.push({
                        fragment,
                        mood,
                        connector,
                        detail,
                        cycle: cycle + 1,
                        beat: index + 1,
                        amplitude,
                        intensity
                    });
                }
            }
            const curatedLines = [];
            compositions.forEach((item, index) => {
                const emphasiser = index % 2 === 0 ? '>' : '~';
                const descriptor = `${label} | cycle ${item.cycle} | beat ${item.beat} | ${item.fragment} | ${item.mood} | ${item.connector} | ${item.detail} | amplitude ${item.amplitude} | intensity ${item.intensity}`;
                curatedLines.push(`${emphasiser} ${descriptor}`);
                if ((index + 1) % tempo === 0) {
                    curatedLines.push(`tempo-marker ${tempo} :: segment ${index + 1}`);
                }
                if (index % 3 === 0) {
                    curatedLines.push(`echo ${index + 1} :: ${label} weaving ${item.connector}`);
                }
            });
            const layered = [];
            for (let index = 0; index < curatedLines.length; index++) {
                const focus = curatedLines[index];
                layered.push(`${label} swirl ${index + 1} => ${focus}`);
                if (index % 4 === 0) {
                    layered.push(`${label} harmonic ${index + 1} tempo ${tempo}`);
                }
            }
            const ensemble = layered.concat(curatedLines);
            const deduplicated = [];
            const seen = new Set();
            ensemble.forEach((item) => {
                if (!seen.has(item)) {
                    deduplicated.push(item);
                    seen.add(item);
                }
            });
            const trimmedBase = basePayload.trim();
            if (includeBase && trimmedBase) {
                deduplicated.unshift(`base-payload :: ${trimmedBase}`);
            }
            const numbered = deduplicated.map((line, index) => `${index + 1}. ${line}`);
            const newlineChar = String.fromCharCode(10);
            const safeKey = 'fantasy_trigger_river_rhythm';
            clone.vars[`${safeKey}_intensity`] = intensity;
            clone.vars[`${safeKey}_compositions`] = compositions.length;
            clone.vars[`${safeKey}_label`] = label;
            clone.vars[`${safeKey}_entries`] = numbered.length;
            clone.payload = numbered.join(newlineChar);
            clone.logs.push('River rhythm trigger emitted river rhythm script sequences.');
            return [clone];
        }
    },
    {
        id: 'fantasy-trigger-nebula-spark',
        category: 'trigger',
        name: 'Nebula spark trigger',
        description: 'Ignite flows when nebula sparks scatter across imagination.',
        icon: 'star',
        accent: '#facc15',
        tags: ['trigger', 'nebula', 'spark', 'fantasy'],
        inputs: [],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { intensity: 'medium', loops: 1, tempo: 2, includeBase: true, label: 'Nebula spark ledger' },
        form: [
            {
                key: 'intensity',
                label: 'Intensity',
                type: 'select',
                options: [
                    { value: 'calm', label: 'Calm' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'bold', label: 'Bold' }
                ]
            },
            { key: 'loops', label: 'Loops', type: 'number', min: 1, max: 9 },
            { key: 'tempo', label: 'Tempo', type: 'number', min: 1, max: 12 },
            { key: 'includeBase', label: 'Include base payload', type: 'checkbox' },
            { key: 'label', label: 'Label', type: 'text', placeholder: 'Nebula spark ledger' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const basePayload = QuickActionTools.toText(clone.payload ?? '');
            const intensity = String(config?.intensity || 'medium').toLowerCase();
            const loops = Math.max(1, parseInt(config?.loops, 10) || 1);
            const tempo = Math.max(1, parseInt(config?.tempo, 10) || 1);
            const includeBase = config?.includeBase !== false;
            const label = (config?.label || 'Nebula spark ledger').trim() || 'Nebula spark ledger';
            const fragments = [
                'Nebula spark trigger fragment glittering nebula sequence 1',
                'Nebula spark trigger fragment flowing spark sequence 2',
                'Nebula spark trigger fragment spinning plasma sequence 3',
                'Nebula spark trigger fragment looping nova sequence 4',
                'Nebula spark trigger fragment vibrant spiral sequence 5',
                'Nebula spark trigger fragment wandering cosmic sequence 6',
                'Nebula spark trigger fragment braided glimmer sequence 7',
                'Nebula spark trigger fragment singing swirl sequence 8',
                'Nebula spark trigger fragment humming nebula sequence 9',
                'Nebula spark trigger fragment simmering spark sequence 10',
                'Nebula spark trigger fragment glittering plasma sequence 11',
                'Nebula spark trigger fragment flowing nova sequence 12',
                'Nebula spark trigger fragment spinning spiral sequence 13',
                'Nebula spark trigger fragment looping cosmic sequence 14',
                'Nebula spark trigger fragment vibrant glimmer sequence 15',
                'Nebula spark trigger fragment wandering swirl sequence 16',
                'Nebula spark trigger fragment braided nebula sequence 17',
                'Nebula spark trigger fragment singing spark sequence 18',
                'Nebula spark trigger fragment humming plasma sequence 19',
                'Nebula spark trigger fragment simmering nova sequence 20',
                'Nebula spark trigger fragment glittering spiral sequence 21',
                'Nebula spark trigger fragment flowing cosmic sequence 22',
                'Nebula spark trigger fragment spinning glimmer sequence 23',
                'Nebula spark trigger fragment looping swirl sequence 24',
                'Nebula spark trigger fragment vibrant nebula sequence 25',
            ];
            const moods = [
                'Nebula spark trigger mood dawn nebula sequence 1',
                'Nebula spark trigger mood twilight spark sequence 2',
                'Nebula spark trigger mood echo plasma sequence 3',
                'Nebula spark trigger mood glow nova sequence 4',
                'Nebula spark trigger mood spark spiral sequence 5',
                'Nebula spark trigger mood tide cosmic sequence 6',
                'Nebula spark trigger mood whisper glimmer sequence 7',
                'Nebula spark trigger mood hum swirl sequence 8',
                'Nebula spark trigger mood pulse nebula sequence 9',
                'Nebula spark trigger mood chorus spark sequence 10',
                'Nebula spark trigger mood dawn plasma sequence 11',
                'Nebula spark trigger mood twilight nova sequence 12',
                'Nebula spark trigger mood echo spiral sequence 13',
                'Nebula spark trigger mood glow cosmic sequence 14',
                'Nebula spark trigger mood spark glimmer sequence 15',
                'Nebula spark trigger mood tide swirl sequence 16',
                'Nebula spark trigger mood whisper nebula sequence 17',
                'Nebula spark trigger mood hum spark sequence 18',
                'Nebula spark trigger mood pulse plasma sequence 19',
                'Nebula spark trigger mood chorus nova sequence 20',
                'Nebula spark trigger mood dawn spiral sequence 21',
                'Nebula spark trigger mood twilight cosmic sequence 22',
                'Nebula spark trigger mood echo glimmer sequence 23',
                'Nebula spark trigger mood glow swirl sequence 24',
                'Nebula spark trigger mood spark nebula sequence 25',
            ];
            const connectors = [
                'Nebula spark trigger connector weaving nebula sequence 1',
                'Nebula spark trigger connector braiding spark sequence 2',
                'Nebula spark trigger connector linking plasma sequence 3',
                'Nebula spark trigger connector stitching nova sequence 4',
                'Nebula spark trigger connector guiding spiral sequence 5',
                'Nebula spark trigger connector threading cosmic sequence 6',
                'Nebula spark trigger connector folding glimmer sequence 7',
                'Nebula spark trigger connector mapping swirl sequence 8',
                'Nebula spark trigger connector casting nebula sequence 9',
                'Nebula spark trigger connector painting spark sequence 10',
                'Nebula spark trigger connector weaving plasma sequence 11',
                'Nebula spark trigger connector braiding nova sequence 12',
                'Nebula spark trigger connector linking spiral sequence 13',
                'Nebula spark trigger connector stitching cosmic sequence 14',
                'Nebula spark trigger connector guiding glimmer sequence 15',
                'Nebula spark trigger connector threading swirl sequence 16',
                'Nebula spark trigger connector folding nebula sequence 17',
                'Nebula spark trigger connector mapping spark sequence 18',
                'Nebula spark trigger connector casting plasma sequence 19',
                'Nebula spark trigger connector painting nova sequence 20',
                'Nebula spark trigger connector weaving spiral sequence 21',
                'Nebula spark trigger connector braiding cosmic sequence 22',
                'Nebula spark trigger connector linking glimmer sequence 23',
                'Nebula spark trigger connector stitching swirl sequence 24',
                'Nebula spark trigger connector guiding nebula sequence 25',
            ];
            const details = [
                'Nebula spark trigger detail over valleys nebula sequence 1',
                'Nebula spark trigger detail within galleries spark sequence 2',
                'Nebula spark trigger detail across skylines plasma sequence 3',
                'Nebula spark trigger detail through spirals nova sequence 4',
                'Nebula spark trigger detail inside lanterns spiral sequence 5',
                'Nebula spark trigger detail beyond harbors cosmic sequence 6',
                'Nebula spark trigger detail beneath constellations glimmer sequence 7',
                'Nebula spark trigger detail among terraces swirl sequence 8',
                'Nebula spark trigger detail into archives nebula sequence 9',
                'Nebula spark trigger detail around rivers spark sequence 10',
                'Nebula spark trigger detail over valleys plasma sequence 11',
                'Nebula spark trigger detail within galleries nova sequence 12',
                'Nebula spark trigger detail across skylines spiral sequence 13',
                'Nebula spark trigger detail through spirals cosmic sequence 14',
                'Nebula spark trigger detail inside lanterns glimmer sequence 15',
                'Nebula spark trigger detail beyond harbors swirl sequence 16',
                'Nebula spark trigger detail beneath constellations nebula sequence 17',
                'Nebula spark trigger detail among terraces spark sequence 18',
                'Nebula spark trigger detail into archives plasma sequence 19',
                'Nebula spark trigger detail around rivers nova sequence 20',
                'Nebula spark trigger detail over valleys spiral sequence 21',
                'Nebula spark trigger detail within galleries cosmic sequence 22',
                'Nebula spark trigger detail across skylines glimmer sequence 23',
                'Nebula spark trigger detail through spirals swirl sequence 24',
                'Nebula spark trigger detail inside lanterns nebula sequence 25',
            ];
            const compositions = [];
            for (let cycle = 0; cycle < loops; cycle++) {
                for (let index = 0; index < fragments.length; index++) {
                    const fragment = fragments[index];
                    const mood = moods[(index + cycle) % moods.length];
                    const connector = connectors[(index + tempo + cycle) % connectors.length];
                    const detail = details[(index + loops + cycle) % details.length];
                    const amplitude = ((index + 1) % (tempo + 1)) + cycle;
                    compositions.push({
                        fragment,
                        mood,
                        connector,
                        detail,
                        cycle: cycle + 1,
                        beat: index + 1,
                        amplitude,
                        intensity
                    });
                }
            }
            const curatedLines = [];
            compositions.forEach((item, index) => {
                const emphasiser = index % 2 === 0 ? '>' : '~';
                const descriptor = `${label} | cycle ${item.cycle} | beat ${item.beat} | ${item.fragment} | ${item.mood} | ${item.connector} | ${item.detail} | amplitude ${item.amplitude} | intensity ${item.intensity}`;
                curatedLines.push(`${emphasiser} ${descriptor}`);
                if ((index + 1) % tempo === 0) {
                    curatedLines.push(`tempo-marker ${tempo} :: segment ${index + 1}`);
                }
                if (index % 3 === 0) {
                    curatedLines.push(`echo ${index + 1} :: ${label} weaving ${item.connector}`);
                }
            });
            const layered = [];
            for (let index = 0; index < curatedLines.length; index++) {
                const focus = curatedLines[index];
                layered.push(`${label} swirl ${index + 1} => ${focus}`);
                if (index % 4 === 0) {
                    layered.push(`${label} harmonic ${index + 1} tempo ${tempo}`);
                }
            }
            const ensemble = layered.concat(curatedLines);
            const deduplicated = [];
            const seen = new Set();
            ensemble.forEach((item) => {
                if (!seen.has(item)) {
                    deduplicated.push(item);
                    seen.add(item);
                }
            });
            const trimmedBase = basePayload.trim();
            if (includeBase && trimmedBase) {
                deduplicated.unshift(`base-payload :: ${trimmedBase}`);
            }
            const numbered = deduplicated.map((line, index) => `${index + 1}. ${line}`);
            const newlineChar = String.fromCharCode(10);
            const safeKey = 'fantasy_trigger_nebula_spark';
            clone.vars[`${safeKey}_intensity`] = intensity;
            clone.vars[`${safeKey}_compositions`] = compositions.length;
            clone.vars[`${safeKey}_label`] = label;
            clone.vars[`${safeKey}_entries`] = numbered.length;
            clone.payload = numbered.join(newlineChar);
            clone.logs.push('Nebula spark trigger emitted nebula spark ledger sequences.');
            return [clone];
        }
    },
    {
        id: 'fantasy-trigger-ember-scout',
        category: 'trigger',
        name: 'Ember scout trigger',
        description: 'Rally routines when wandering embers scout new directions.',
        icon: 'compass',
        accent: '#fb7185',
        tags: ['trigger', 'ember', 'scout', 'fantasy'],
        inputs: [],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { intensity: 'medium', loops: 1, tempo: 2, includeBase: true, label: 'Ember scout ledger' },
        form: [
            {
                key: 'intensity',
                label: 'Intensity',
                type: 'select',
                options: [
                    { value: 'calm', label: 'Calm' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'bold', label: 'Bold' }
                ]
            },
            { key: 'loops', label: 'Loops', type: 'number', min: 1, max: 9 },
            { key: 'tempo', label: 'Tempo', type: 'number', min: 1, max: 12 },
            { key: 'includeBase', label: 'Include base payload', type: 'checkbox' },
            { key: 'label', label: 'Label', type: 'text', placeholder: 'Ember scout ledger' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const basePayload = QuickActionTools.toText(clone.payload ?? '');
            const intensity = String(config?.intensity || 'medium').toLowerCase();
            const loops = Math.max(1, parseInt(config?.loops, 10) || 1);
            const tempo = Math.max(1, parseInt(config?.tempo, 10) || 1);
            const includeBase = config?.includeBase !== false;
            const label = (config?.label || 'Ember scout ledger').trim() || 'Ember scout ledger';
            const fragments = [
                'Ember scout trigger fragment glittering ember sequence 1',
                'Ember scout trigger fragment flowing scout sequence 2',
                'Ember scout trigger fragment spinning trail sequence 3',
                'Ember scout trigger fragment looping emberlight sequence 4',
                'Ember scout trigger fragment vibrant glow sequence 5',
                'Ember scout trigger fragment wandering path sequence 6',
                'Ember scout trigger fragment braided sparkle sequence 7',
                'Ember scout trigger fragment singing track sequence 8',
                'Ember scout trigger fragment humming ember sequence 9',
                'Ember scout trigger fragment simmering scout sequence 10',
                'Ember scout trigger fragment glittering trail sequence 11',
                'Ember scout trigger fragment flowing emberlight sequence 12',
                'Ember scout trigger fragment spinning glow sequence 13',
                'Ember scout trigger fragment looping path sequence 14',
                'Ember scout trigger fragment vibrant sparkle sequence 15',
                'Ember scout trigger fragment wandering track sequence 16',
                'Ember scout trigger fragment braided ember sequence 17',
                'Ember scout trigger fragment singing scout sequence 18',
                'Ember scout trigger fragment humming trail sequence 19',
                'Ember scout trigger fragment simmering emberlight sequence 20',
                'Ember scout trigger fragment glittering glow sequence 21',
                'Ember scout trigger fragment flowing path sequence 22',
                'Ember scout trigger fragment spinning sparkle sequence 23',
                'Ember scout trigger fragment looping track sequence 24',
                'Ember scout trigger fragment vibrant ember sequence 25',
            ];
            const moods = [
                'Ember scout trigger mood dawn ember sequence 1',
                'Ember scout trigger mood twilight scout sequence 2',
                'Ember scout trigger mood echo trail sequence 3',
                'Ember scout trigger mood glow emberlight sequence 4',
                'Ember scout trigger mood spark glow sequence 5',
                'Ember scout trigger mood tide path sequence 6',
                'Ember scout trigger mood whisper sparkle sequence 7',
                'Ember scout trigger mood hum track sequence 8',
                'Ember scout trigger mood pulse ember sequence 9',
                'Ember scout trigger mood chorus scout sequence 10',
                'Ember scout trigger mood dawn trail sequence 11',
                'Ember scout trigger mood twilight emberlight sequence 12',
                'Ember scout trigger mood echo glow sequence 13',
                'Ember scout trigger mood glow path sequence 14',
                'Ember scout trigger mood spark sparkle sequence 15',
                'Ember scout trigger mood tide track sequence 16',
                'Ember scout trigger mood whisper ember sequence 17',
                'Ember scout trigger mood hum scout sequence 18',
                'Ember scout trigger mood pulse trail sequence 19',
                'Ember scout trigger mood chorus emberlight sequence 20',
                'Ember scout trigger mood dawn glow sequence 21',
                'Ember scout trigger mood twilight path sequence 22',
                'Ember scout trigger mood echo sparkle sequence 23',
                'Ember scout trigger mood glow track sequence 24',
                'Ember scout trigger mood spark ember sequence 25',
            ];
            const connectors = [
                'Ember scout trigger connector weaving ember sequence 1',
                'Ember scout trigger connector braiding scout sequence 2',
                'Ember scout trigger connector linking trail sequence 3',
                'Ember scout trigger connector stitching emberlight sequence 4',
                'Ember scout trigger connector guiding glow sequence 5',
                'Ember scout trigger connector threading path sequence 6',
                'Ember scout trigger connector folding sparkle sequence 7',
                'Ember scout trigger connector mapping track sequence 8',
                'Ember scout trigger connector casting ember sequence 9',
                'Ember scout trigger connector painting scout sequence 10',
                'Ember scout trigger connector weaving trail sequence 11',
                'Ember scout trigger connector braiding emberlight sequence 12',
                'Ember scout trigger connector linking glow sequence 13',
                'Ember scout trigger connector stitching path sequence 14',
                'Ember scout trigger connector guiding sparkle sequence 15',
                'Ember scout trigger connector threading track sequence 16',
                'Ember scout trigger connector folding ember sequence 17',
                'Ember scout trigger connector mapping scout sequence 18',
                'Ember scout trigger connector casting trail sequence 19',
                'Ember scout trigger connector painting emberlight sequence 20',
                'Ember scout trigger connector weaving glow sequence 21',
                'Ember scout trigger connector braiding path sequence 22',
                'Ember scout trigger connector linking sparkle sequence 23',
                'Ember scout trigger connector stitching track sequence 24',
                'Ember scout trigger connector guiding ember sequence 25',
            ];
            const details = [
                'Ember scout trigger detail over valleys ember sequence 1',
                'Ember scout trigger detail within galleries scout sequence 2',
                'Ember scout trigger detail across skylines trail sequence 3',
                'Ember scout trigger detail through spirals emberlight sequence 4',
                'Ember scout trigger detail inside lanterns glow sequence 5',
                'Ember scout trigger detail beyond harbors path sequence 6',
                'Ember scout trigger detail beneath constellations sparkle sequence 7',
                'Ember scout trigger detail among terraces track sequence 8',
                'Ember scout trigger detail into archives ember sequence 9',
                'Ember scout trigger detail around rivers scout sequence 10',
                'Ember scout trigger detail over valleys trail sequence 11',
                'Ember scout trigger detail within galleries emberlight sequence 12',
                'Ember scout trigger detail across skylines glow sequence 13',
                'Ember scout trigger detail through spirals path sequence 14',
                'Ember scout trigger detail inside lanterns sparkle sequence 15',
                'Ember scout trigger detail beyond harbors track sequence 16',
                'Ember scout trigger detail beneath constellations ember sequence 17',
                'Ember scout trigger detail among terraces scout sequence 18',
                'Ember scout trigger detail into archives trail sequence 19',
                'Ember scout trigger detail around rivers emberlight sequence 20',
                'Ember scout trigger detail over valleys glow sequence 21',
                'Ember scout trigger detail within galleries path sequence 22',
                'Ember scout trigger detail across skylines sparkle sequence 23',
                'Ember scout trigger detail through spirals track sequence 24',
                'Ember scout trigger detail inside lanterns ember sequence 25',
            ];
            const compositions = [];
            for (let cycle = 0; cycle < loops; cycle++) {
                for (let index = 0; index < fragments.length; index++) {
                    const fragment = fragments[index];
                    const mood = moods[(index + cycle) % moods.length];
                    const connector = connectors[(index + tempo + cycle) % connectors.length];
                    const detail = details[(index + loops + cycle) % details.length];
                    const amplitude = ((index + 1) % (tempo + 1)) + cycle;
                    compositions.push({
                        fragment,
                        mood,
                        connector,
                        detail,
                        cycle: cycle + 1,
                        beat: index + 1,
                        amplitude,
                        intensity
                    });
                }
            }
            const curatedLines = [];
            compositions.forEach((item, index) => {
                const emphasiser = index % 2 === 0 ? '>' : '~';
                const descriptor = `${label} | cycle ${item.cycle} | beat ${item.beat} | ${item.fragment} | ${item.mood} | ${item.connector} | ${item.detail} | amplitude ${item.amplitude} | intensity ${item.intensity}`;
                curatedLines.push(`${emphasiser} ${descriptor}`);
                if ((index + 1) % tempo === 0) {
                    curatedLines.push(`tempo-marker ${tempo} :: segment ${index + 1}`);
                }
                if (index % 3 === 0) {
                    curatedLines.push(`echo ${index + 1} :: ${label} weaving ${item.connector}`);
                }
            });
            const layered = [];
            for (let index = 0; index < curatedLines.length; index++) {
                const focus = curatedLines[index];
                layered.push(`${label} swirl ${index + 1} => ${focus}`);
                if (index % 4 === 0) {
                    layered.push(`${label} harmonic ${index + 1} tempo ${tempo}`);
                }
            }
            const ensemble = layered.concat(curatedLines);
            const deduplicated = [];
            const seen = new Set();
            ensemble.forEach((item) => {
                if (!seen.has(item)) {
                    deduplicated.push(item);
                    seen.add(item);
                }
            });
            const trimmedBase = basePayload.trim();
            if (includeBase && trimmedBase) {
                deduplicated.unshift(`base-payload :: ${trimmedBase}`);
            }
            const numbered = deduplicated.map((line, index) => `${index + 1}. ${line}`);
            const newlineChar = String.fromCharCode(10);
            const safeKey = 'fantasy_trigger_ember_scout';
            clone.vars[`${safeKey}_intensity`] = intensity;
            clone.vars[`${safeKey}_compositions`] = compositions.length;
            clone.vars[`${safeKey}_label`] = label;
            clone.vars[`${safeKey}_entries`] = numbered.length;
            clone.payload = numbered.join(newlineChar);
            clone.logs.push('Ember scout trigger emitted ember scout ledger sequences.');
            return [clone];
        }
    },
    {
        id: 'fantasy-trigger-petal-chime',
        category: 'trigger',
        name: 'Petal chime trigger',
        description: 'Ring sequences when petals chime against the afternoon breeze.',
        icon: 'feather',
        accent: '#fb923c',
        tags: ['trigger', 'petal', 'chime', 'fantasy'],
        inputs: [],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { intensity: 'medium', loops: 1, tempo: 2, includeBase: true, label: 'Petal chime calendar' },
        form: [
            {
                key: 'intensity',
                label: 'Intensity',
                type: 'select',
                options: [
                    { value: 'calm', label: 'Calm' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'bold', label: 'Bold' }
                ]
            },
            { key: 'loops', label: 'Loops', type: 'number', min: 1, max: 9 },
            { key: 'tempo', label: 'Tempo', type: 'number', min: 1, max: 12 },
            { key: 'includeBase', label: 'Include base payload', type: 'checkbox' },
            { key: 'label', label: 'Label', type: 'text', placeholder: 'Petal chime calendar' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const basePayload = QuickActionTools.toText(clone.payload ?? '');
            const intensity = String(config?.intensity || 'medium').toLowerCase();
            const loops = Math.max(1, parseInt(config?.loops, 10) || 1);
            const tempo = Math.max(1, parseInt(config?.tempo, 10) || 1);
            const includeBase = config?.includeBase !== false;
            const label = (config?.label || 'Petal chime calendar').trim() || 'Petal chime calendar';
            const fragments = [
                'Petal chime trigger fragment glittering petal sequence 1',
                'Petal chime trigger fragment flowing chime sequence 2',
                'Petal chime trigger fragment spinning bloom sequence 3',
                'Petal chime trigger fragment looping breeze sequence 4',
                'Petal chime trigger fragment vibrant garden sequence 5',
                'Petal chime trigger fragment wandering perfume sequence 6',
                'Petal chime trigger fragment braided petric sequence 7',
                'Petal chime trigger fragment singing tangle sequence 8',
                'Petal chime trigger fragment humming petal sequence 9',
                'Petal chime trigger fragment simmering chime sequence 10',
                'Petal chime trigger fragment glittering bloom sequence 11',
                'Petal chime trigger fragment flowing breeze sequence 12',
                'Petal chime trigger fragment spinning garden sequence 13',
                'Petal chime trigger fragment looping perfume sequence 14',
                'Petal chime trigger fragment vibrant petric sequence 15',
                'Petal chime trigger fragment wandering tangle sequence 16',
                'Petal chime trigger fragment braided petal sequence 17',
                'Petal chime trigger fragment singing chime sequence 18',
                'Petal chime trigger fragment humming bloom sequence 19',
                'Petal chime trigger fragment simmering breeze sequence 20',
                'Petal chime trigger fragment glittering garden sequence 21',
                'Petal chime trigger fragment flowing perfume sequence 22',
                'Petal chime trigger fragment spinning petric sequence 23',
                'Petal chime trigger fragment looping tangle sequence 24',
                'Petal chime trigger fragment vibrant petal sequence 25',
            ];
            const moods = [
                'Petal chime trigger mood dawn petal sequence 1',
                'Petal chime trigger mood twilight chime sequence 2',
                'Petal chime trigger mood echo bloom sequence 3',
                'Petal chime trigger mood glow breeze sequence 4',
                'Petal chime trigger mood spark garden sequence 5',
                'Petal chime trigger mood tide perfume sequence 6',
                'Petal chime trigger mood whisper petric sequence 7',
                'Petal chime trigger mood hum tangle sequence 8',
                'Petal chime trigger mood pulse petal sequence 9',
                'Petal chime trigger mood chorus chime sequence 10',
                'Petal chime trigger mood dawn bloom sequence 11',
                'Petal chime trigger mood twilight breeze sequence 12',
                'Petal chime trigger mood echo garden sequence 13',
                'Petal chime trigger mood glow perfume sequence 14',
                'Petal chime trigger mood spark petric sequence 15',
                'Petal chime trigger mood tide tangle sequence 16',
                'Petal chime trigger mood whisper petal sequence 17',
                'Petal chime trigger mood hum chime sequence 18',
                'Petal chime trigger mood pulse bloom sequence 19',
                'Petal chime trigger mood chorus breeze sequence 20',
                'Petal chime trigger mood dawn garden sequence 21',
                'Petal chime trigger mood twilight perfume sequence 22',
                'Petal chime trigger mood echo petric sequence 23',
                'Petal chime trigger mood glow tangle sequence 24',
                'Petal chime trigger mood spark petal sequence 25',
            ];
            const connectors = [
                'Petal chime trigger connector weaving petal sequence 1',
                'Petal chime trigger connector braiding chime sequence 2',
                'Petal chime trigger connector linking bloom sequence 3',
                'Petal chime trigger connector stitching breeze sequence 4',
                'Petal chime trigger connector guiding garden sequence 5',
                'Petal chime trigger connector threading perfume sequence 6',
                'Petal chime trigger connector folding petric sequence 7',
                'Petal chime trigger connector mapping tangle sequence 8',
                'Petal chime trigger connector casting petal sequence 9',
                'Petal chime trigger connector painting chime sequence 10',
                'Petal chime trigger connector weaving bloom sequence 11',
                'Petal chime trigger connector braiding breeze sequence 12',
                'Petal chime trigger connector linking garden sequence 13',
                'Petal chime trigger connector stitching perfume sequence 14',
                'Petal chime trigger connector guiding petric sequence 15',
                'Petal chime trigger connector threading tangle sequence 16',
                'Petal chime trigger connector folding petal sequence 17',
                'Petal chime trigger connector mapping chime sequence 18',
                'Petal chime trigger connector casting bloom sequence 19',
                'Petal chime trigger connector painting breeze sequence 20',
                'Petal chime trigger connector weaving garden sequence 21',
                'Petal chime trigger connector braiding perfume sequence 22',
                'Petal chime trigger connector linking petric sequence 23',
                'Petal chime trigger connector stitching tangle sequence 24',
                'Petal chime trigger connector guiding petal sequence 25',
            ];
            const details = [
                'Petal chime trigger detail over valleys petal sequence 1',
                'Petal chime trigger detail within galleries chime sequence 2',
                'Petal chime trigger detail across skylines bloom sequence 3',
                'Petal chime trigger detail through spirals breeze sequence 4',
                'Petal chime trigger detail inside lanterns garden sequence 5',
                'Petal chime trigger detail beyond harbors perfume sequence 6',
                'Petal chime trigger detail beneath constellations petric sequence 7',
                'Petal chime trigger detail among terraces tangle sequence 8',
                'Petal chime trigger detail into archives petal sequence 9',
                'Petal chime trigger detail around rivers chime sequence 10',
                'Petal chime trigger detail over valleys bloom sequence 11',
                'Petal chime trigger detail within galleries breeze sequence 12',
                'Petal chime trigger detail across skylines garden sequence 13',
                'Petal chime trigger detail through spirals perfume sequence 14',
                'Petal chime trigger detail inside lanterns petric sequence 15',
                'Petal chime trigger detail beyond harbors tangle sequence 16',
                'Petal chime trigger detail beneath constellations petal sequence 17',
                'Petal chime trigger detail among terraces chime sequence 18',
                'Petal chime trigger detail into archives bloom sequence 19',
                'Petal chime trigger detail around rivers breeze sequence 20',
                'Petal chime trigger detail over valleys garden sequence 21',
                'Petal chime trigger detail within galleries perfume sequence 22',
                'Petal chime trigger detail across skylines petric sequence 23',
                'Petal chime trigger detail through spirals tangle sequence 24',
                'Petal chime trigger detail inside lanterns petal sequence 25',
            ];
            const compositions = [];
            for (let cycle = 0; cycle < loops; cycle++) {
                for (let index = 0; index < fragments.length; index++) {
                    const fragment = fragments[index];
                    const mood = moods[(index + cycle) % moods.length];
                    const connector = connectors[(index + tempo + cycle) % connectors.length];
                    const detail = details[(index + loops + cycle) % details.length];
                    const amplitude = ((index + 1) % (tempo + 1)) + cycle;
                    compositions.push({
                        fragment,
                        mood,
                        connector,
                        detail,
                        cycle: cycle + 1,
                        beat: index + 1,
                        amplitude,
                        intensity
                    });
                }
            }
            const curatedLines = [];
            compositions.forEach((item, index) => {
                const emphasiser = index % 2 === 0 ? '>' : '~';
                const descriptor = `${label} | cycle ${item.cycle} | beat ${item.beat} | ${item.fragment} | ${item.mood} | ${item.connector} | ${item.detail} | amplitude ${item.amplitude} | intensity ${item.intensity}`;
                curatedLines.push(`${emphasiser} ${descriptor}`);
                if ((index + 1) % tempo === 0) {
                    curatedLines.push(`tempo-marker ${tempo} :: segment ${index + 1}`);
                }
                if (index % 3 === 0) {
                    curatedLines.push(`echo ${index + 1} :: ${label} weaving ${item.connector}`);
                }
            });
            const layered = [];
            for (let index = 0; index < curatedLines.length; index++) {
                const focus = curatedLines[index];
                layered.push(`${label} swirl ${index + 1} => ${focus}`);
                if (index % 4 === 0) {
                    layered.push(`${label} harmonic ${index + 1} tempo ${tempo}`);
                }
            }
            const ensemble = layered.concat(curatedLines);
            const deduplicated = [];
            const seen = new Set();
            ensemble.forEach((item) => {
                if (!seen.has(item)) {
                    deduplicated.push(item);
                    seen.add(item);
                }
            });
            const trimmedBase = basePayload.trim();
            if (includeBase && trimmedBase) {
                deduplicated.unshift(`base-payload :: ${trimmedBase}`);
            }
            const numbered = deduplicated.map((line, index) => `${index + 1}. ${line}`);
            const newlineChar = String.fromCharCode(10);
            const safeKey = 'fantasy_trigger_petal_chime';
            clone.vars[`${safeKey}_intensity`] = intensity;
            clone.vars[`${safeKey}_compositions`] = compositions.length;
            clone.vars[`${safeKey}_label`] = label;
            clone.vars[`${safeKey}_entries`] = numbered.length;
            clone.payload = numbered.join(newlineChar);
            clone.logs.push('Petal chime trigger emitted petal chime calendar sequences.');
            return [clone];
        }
    },
    {
        id: 'fantasy-trigger-horizon-beat',
        category: 'trigger',
        name: 'Horizon beat trigger',
        description: 'Introduce loops when horizon beats align with quiet sparks.',
        icon: 'sliders',
        accent: '#38bdf8',
        tags: ['trigger', 'horizon', 'beat', 'fantasy'],
        inputs: [],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { intensity: 'medium', loops: 1, tempo: 2, includeBase: true, label: 'Horizon beat journal' },
        form: [
            {
                key: 'intensity',
                label: 'Intensity',
                type: 'select',
                options: [
                    { value: 'calm', label: 'Calm' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'bold', label: 'Bold' }
                ]
            },
            { key: 'loops', label: 'Loops', type: 'number', min: 1, max: 9 },
            { key: 'tempo', label: 'Tempo', type: 'number', min: 1, max: 12 },
            { key: 'includeBase', label: 'Include base payload', type: 'checkbox' },
            { key: 'label', label: 'Label', type: 'text', placeholder: 'Horizon beat journal' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const basePayload = QuickActionTools.toText(clone.payload ?? '');
            const intensity = String(config?.intensity || 'medium').toLowerCase();
            const loops = Math.max(1, parseInt(config?.loops, 10) || 1);
            const tempo = Math.max(1, parseInt(config?.tempo, 10) || 1);
            const includeBase = config?.includeBase !== false;
            const label = (config?.label || 'Horizon beat journal').trim() || 'Horizon beat journal';
            const fragments = [
                'Horizon beat trigger fragment glittering horizon sequence 1',
                'Horizon beat trigger fragment flowing beat sequence 2',
                'Horizon beat trigger fragment spinning sunset sequence 3',
                'Horizon beat trigger fragment looping glimmer sequence 4',
                'Horizon beat trigger fragment vibrant glow sequence 5',
                'Horizon beat trigger fragment wandering line sequence 6',
                'Horizon beat trigger fragment braided pulse sequence 7',
                'Horizon beat trigger fragment singing crest sequence 8',
                'Horizon beat trigger fragment humming horizon sequence 9',
                'Horizon beat trigger fragment simmering beat sequence 10',
                'Horizon beat trigger fragment glittering sunset sequence 11',
                'Horizon beat trigger fragment flowing glimmer sequence 12',
                'Horizon beat trigger fragment spinning glow sequence 13',
                'Horizon beat trigger fragment looping line sequence 14',
                'Horizon beat trigger fragment vibrant pulse sequence 15',
                'Horizon beat trigger fragment wandering crest sequence 16',
                'Horizon beat trigger fragment braided horizon sequence 17',
                'Horizon beat trigger fragment singing beat sequence 18',
                'Horizon beat trigger fragment humming sunset sequence 19',
                'Horizon beat trigger fragment simmering glimmer sequence 20',
                'Horizon beat trigger fragment glittering glow sequence 21',
                'Horizon beat trigger fragment flowing line sequence 22',
                'Horizon beat trigger fragment spinning pulse sequence 23',
                'Horizon beat trigger fragment looping crest sequence 24',
                'Horizon beat trigger fragment vibrant horizon sequence 25',
            ];
            const moods = [
                'Horizon beat trigger mood dawn horizon sequence 1',
                'Horizon beat trigger mood twilight beat sequence 2',
                'Horizon beat trigger mood echo sunset sequence 3',
                'Horizon beat trigger mood glow glimmer sequence 4',
                'Horizon beat trigger mood spark glow sequence 5',
                'Horizon beat trigger mood tide line sequence 6',
                'Horizon beat trigger mood whisper pulse sequence 7',
                'Horizon beat trigger mood hum crest sequence 8',
                'Horizon beat trigger mood pulse horizon sequence 9',
                'Horizon beat trigger mood chorus beat sequence 10',
                'Horizon beat trigger mood dawn sunset sequence 11',
                'Horizon beat trigger mood twilight glimmer sequence 12',
                'Horizon beat trigger mood echo glow sequence 13',
                'Horizon beat trigger mood glow line sequence 14',
                'Horizon beat trigger mood spark pulse sequence 15',
                'Horizon beat trigger mood tide crest sequence 16',
                'Horizon beat trigger mood whisper horizon sequence 17',
                'Horizon beat trigger mood hum beat sequence 18',
                'Horizon beat trigger mood pulse sunset sequence 19',
                'Horizon beat trigger mood chorus glimmer sequence 20',
                'Horizon beat trigger mood dawn glow sequence 21',
                'Horizon beat trigger mood twilight line sequence 22',
                'Horizon beat trigger mood echo pulse sequence 23',
                'Horizon beat trigger mood glow crest sequence 24',
                'Horizon beat trigger mood spark horizon sequence 25',
            ];
            const connectors = [
                'Horizon beat trigger connector weaving horizon sequence 1',
                'Horizon beat trigger connector braiding beat sequence 2',
                'Horizon beat trigger connector linking sunset sequence 3',
                'Horizon beat trigger connector stitching glimmer sequence 4',
                'Horizon beat trigger connector guiding glow sequence 5',
                'Horizon beat trigger connector threading line sequence 6',
                'Horizon beat trigger connector folding pulse sequence 7',
                'Horizon beat trigger connector mapping crest sequence 8',
                'Horizon beat trigger connector casting horizon sequence 9',
                'Horizon beat trigger connector painting beat sequence 10',
                'Horizon beat trigger connector weaving sunset sequence 11',
                'Horizon beat trigger connector braiding glimmer sequence 12',
                'Horizon beat trigger connector linking glow sequence 13',
                'Horizon beat trigger connector stitching line sequence 14',
                'Horizon beat trigger connector guiding pulse sequence 15',
                'Horizon beat trigger connector threading crest sequence 16',
                'Horizon beat trigger connector folding horizon sequence 17',
                'Horizon beat trigger connector mapping beat sequence 18',
                'Horizon beat trigger connector casting sunset sequence 19',
                'Horizon beat trigger connector painting glimmer sequence 20',
                'Horizon beat trigger connector weaving glow sequence 21',
                'Horizon beat trigger connector braiding line sequence 22',
                'Horizon beat trigger connector linking pulse sequence 23',
                'Horizon beat trigger connector stitching crest sequence 24',
                'Horizon beat trigger connector guiding horizon sequence 25',
            ];
            const details = [
                'Horizon beat trigger detail over valleys horizon sequence 1',
                'Horizon beat trigger detail within galleries beat sequence 2',
                'Horizon beat trigger detail across skylines sunset sequence 3',
                'Horizon beat trigger detail through spirals glimmer sequence 4',
                'Horizon beat trigger detail inside lanterns glow sequence 5',
                'Horizon beat trigger detail beyond harbors line sequence 6',
                'Horizon beat trigger detail beneath constellations pulse sequence 7',
                'Horizon beat trigger detail among terraces crest sequence 8',
                'Horizon beat trigger detail into archives horizon sequence 9',
                'Horizon beat trigger detail around rivers beat sequence 10',
                'Horizon beat trigger detail over valleys sunset sequence 11',
                'Horizon beat trigger detail within galleries glimmer sequence 12',
                'Horizon beat trigger detail across skylines glow sequence 13',
                'Horizon beat trigger detail through spirals line sequence 14',
                'Horizon beat trigger detail inside lanterns pulse sequence 15',
                'Horizon beat trigger detail beyond harbors crest sequence 16',
                'Horizon beat trigger detail beneath constellations horizon sequence 17',
                'Horizon beat trigger detail among terraces beat sequence 18',
                'Horizon beat trigger detail into archives sunset sequence 19',
                'Horizon beat trigger detail around rivers glimmer sequence 20',
                'Horizon beat trigger detail over valleys glow sequence 21',
                'Horizon beat trigger detail within galleries line sequence 22',
                'Horizon beat trigger detail across skylines pulse sequence 23',
                'Horizon beat trigger detail through spirals crest sequence 24',
                'Horizon beat trigger detail inside lanterns horizon sequence 25',
            ];
            const compositions = [];
            for (let cycle = 0; cycle < loops; cycle++) {
                for (let index = 0; index < fragments.length; index++) {
                    const fragment = fragments[index];
                    const mood = moods[(index + cycle) % moods.length];
                    const connector = connectors[(index + tempo + cycle) % connectors.length];
                    const detail = details[(index + loops + cycle) % details.length];
                    const amplitude = ((index + 1) % (tempo + 1)) + cycle;
                    compositions.push({
                        fragment,
                        mood,
                        connector,
                        detail,
                        cycle: cycle + 1,
                        beat: index + 1,
                        amplitude,
                        intensity
                    });
                }
            }
            const curatedLines = [];
            compositions.forEach((item, index) => {
                const emphasiser = index % 2 === 0 ? '>' : '~';
                const descriptor = `${label} | cycle ${item.cycle} | beat ${item.beat} | ${item.fragment} | ${item.mood} | ${item.connector} | ${item.detail} | amplitude ${item.amplitude} | intensity ${item.intensity}`;
                curatedLines.push(`${emphasiser} ${descriptor}`);
                if ((index + 1) % tempo === 0) {
                    curatedLines.push(`tempo-marker ${tempo} :: segment ${index + 1}`);
                }
                if (index % 3 === 0) {
                    curatedLines.push(`echo ${index + 1} :: ${label} weaving ${item.connector}`);
                }
            });
            const layered = [];
            for (let index = 0; index < curatedLines.length; index++) {
                const focus = curatedLines[index];
                layered.push(`${label} swirl ${index + 1} => ${focus}`);
                if (index % 4 === 0) {
                    layered.push(`${label} harmonic ${index + 1} tempo ${tempo}`);
                }
            }
            const ensemble = layered.concat(curatedLines);
            const deduplicated = [];
            const seen = new Set();
            ensemble.forEach((item) => {
                if (!seen.has(item)) {
                    deduplicated.push(item);
                    seen.add(item);
                }
            });
            const trimmedBase = basePayload.trim();
            if (includeBase && trimmedBase) {
                deduplicated.unshift(`base-payload :: ${trimmedBase}`);
            }
            const numbered = deduplicated.map((line, index) => `${index + 1}. ${line}`);
            const newlineChar = String.fromCharCode(10);
            const safeKey = 'fantasy_trigger_horizon_beat';
            clone.vars[`${safeKey}_intensity`] = intensity;
            clone.vars[`${safeKey}_compositions`] = compositions.length;
            clone.vars[`${safeKey}_label`] = label;
            clone.vars[`${safeKey}_entries`] = numbered.length;
            clone.payload = numbered.join(newlineChar);
            clone.logs.push('Horizon beat trigger emitted horizon beat journal sequences.');
            return [clone];
        }
    },
    {
        id: 'fantasy-trigger-cinder-skip',
        category: 'trigger',
        name: 'Cinder skip trigger',
        description: 'Leap ahead when playful cinders skip across the canvas.',
        icon: 'skip-forward',
        accent: '#14b8a6',
        tags: ['trigger', 'cinder', 'skip', 'fantasy'],
        inputs: [],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { intensity: 'medium', loops: 1, tempo: 2, includeBase: true, label: 'Cinder skip log' },
        form: [
            {
                key: 'intensity',
                label: 'Intensity',
                type: 'select',
                options: [
                    { value: 'calm', label: 'Calm' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'bold', label: 'Bold' }
                ]
            },
            { key: 'loops', label: 'Loops', type: 'number', min: 1, max: 9 },
            { key: 'tempo', label: 'Tempo', type: 'number', min: 1, max: 12 },
            { key: 'includeBase', label: 'Include base payload', type: 'checkbox' },
            { key: 'label', label: 'Label', type: 'text', placeholder: 'Cinder skip log' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const basePayload = QuickActionTools.toText(clone.payload ?? '');
            const intensity = String(config?.intensity || 'medium').toLowerCase();
            const loops = Math.max(1, parseInt(config?.loops, 10) || 1);
            const tempo = Math.max(1, parseInt(config?.tempo, 10) || 1);
            const includeBase = config?.includeBase !== false;
            const label = (config?.label || 'Cinder skip log').trim() || 'Cinder skip log';
            const fragments = [
                'Cinder skip trigger fragment glittering cinder sequence 1',
                'Cinder skip trigger fragment flowing skip sequence 2',
                'Cinder skip trigger fragment spinning spark sequence 3',
                'Cinder skip trigger fragment looping ash sequence 4',
                'Cinder skip trigger fragment vibrant ember sequence 5',
                'Cinder skip trigger fragment wandering loop sequence 6',
                'Cinder skip trigger fragment braided twirl sequence 7',
                'Cinder skip trigger fragment singing flare sequence 8',
                'Cinder skip trigger fragment humming cinder sequence 9',
                'Cinder skip trigger fragment simmering skip sequence 10',
                'Cinder skip trigger fragment glittering spark sequence 11',
                'Cinder skip trigger fragment flowing ash sequence 12',
                'Cinder skip trigger fragment spinning ember sequence 13',
                'Cinder skip trigger fragment looping loop sequence 14',
                'Cinder skip trigger fragment vibrant twirl sequence 15',
                'Cinder skip trigger fragment wandering flare sequence 16',
                'Cinder skip trigger fragment braided cinder sequence 17',
                'Cinder skip trigger fragment singing skip sequence 18',
                'Cinder skip trigger fragment humming spark sequence 19',
                'Cinder skip trigger fragment simmering ash sequence 20',
                'Cinder skip trigger fragment glittering ember sequence 21',
                'Cinder skip trigger fragment flowing loop sequence 22',
                'Cinder skip trigger fragment spinning twirl sequence 23',
                'Cinder skip trigger fragment looping flare sequence 24',
                'Cinder skip trigger fragment vibrant cinder sequence 25',
            ];
            const moods = [
                'Cinder skip trigger mood dawn cinder sequence 1',
                'Cinder skip trigger mood twilight skip sequence 2',
                'Cinder skip trigger mood echo spark sequence 3',
                'Cinder skip trigger mood glow ash sequence 4',
                'Cinder skip trigger mood spark ember sequence 5',
                'Cinder skip trigger mood tide loop sequence 6',
                'Cinder skip trigger mood whisper twirl sequence 7',
                'Cinder skip trigger mood hum flare sequence 8',
                'Cinder skip trigger mood pulse cinder sequence 9',
                'Cinder skip trigger mood chorus skip sequence 10',
                'Cinder skip trigger mood dawn spark sequence 11',
                'Cinder skip trigger mood twilight ash sequence 12',
                'Cinder skip trigger mood echo ember sequence 13',
                'Cinder skip trigger mood glow loop sequence 14',
                'Cinder skip trigger mood spark twirl sequence 15',
                'Cinder skip trigger mood tide flare sequence 16',
                'Cinder skip trigger mood whisper cinder sequence 17',
                'Cinder skip trigger mood hum skip sequence 18',
                'Cinder skip trigger mood pulse spark sequence 19',
                'Cinder skip trigger mood chorus ash sequence 20',
                'Cinder skip trigger mood dawn ember sequence 21',
                'Cinder skip trigger mood twilight loop sequence 22',
                'Cinder skip trigger mood echo twirl sequence 23',
                'Cinder skip trigger mood glow flare sequence 24',
                'Cinder skip trigger mood spark cinder sequence 25',
            ];
            const connectors = [
                'Cinder skip trigger connector weaving cinder sequence 1',
                'Cinder skip trigger connector braiding skip sequence 2',
                'Cinder skip trigger connector linking spark sequence 3',
                'Cinder skip trigger connector stitching ash sequence 4',
                'Cinder skip trigger connector guiding ember sequence 5',
                'Cinder skip trigger connector threading loop sequence 6',
                'Cinder skip trigger connector folding twirl sequence 7',
                'Cinder skip trigger connector mapping flare sequence 8',
                'Cinder skip trigger connector casting cinder sequence 9',
                'Cinder skip trigger connector painting skip sequence 10',
                'Cinder skip trigger connector weaving spark sequence 11',
                'Cinder skip trigger connector braiding ash sequence 12',
                'Cinder skip trigger connector linking ember sequence 13',
                'Cinder skip trigger connector stitching loop sequence 14',
                'Cinder skip trigger connector guiding twirl sequence 15',
                'Cinder skip trigger connector threading flare sequence 16',
                'Cinder skip trigger connector folding cinder sequence 17',
                'Cinder skip trigger connector mapping skip sequence 18',
                'Cinder skip trigger connector casting spark sequence 19',
                'Cinder skip trigger connector painting ash sequence 20',
                'Cinder skip trigger connector weaving ember sequence 21',
                'Cinder skip trigger connector braiding loop sequence 22',
                'Cinder skip trigger connector linking twirl sequence 23',
                'Cinder skip trigger connector stitching flare sequence 24',
                'Cinder skip trigger connector guiding cinder sequence 25',
            ];
            const details = [
                'Cinder skip trigger detail over valleys cinder sequence 1',
                'Cinder skip trigger detail within galleries skip sequence 2',
                'Cinder skip trigger detail across skylines spark sequence 3',
                'Cinder skip trigger detail through spirals ash sequence 4',
                'Cinder skip trigger detail inside lanterns ember sequence 5',
                'Cinder skip trigger detail beyond harbors loop sequence 6',
                'Cinder skip trigger detail beneath constellations twirl sequence 7',
                'Cinder skip trigger detail among terraces flare sequence 8',
                'Cinder skip trigger detail into archives cinder sequence 9',
                'Cinder skip trigger detail around rivers skip sequence 10',
                'Cinder skip trigger detail over valleys spark sequence 11',
                'Cinder skip trigger detail within galleries ash sequence 12',
                'Cinder skip trigger detail across skylines ember sequence 13',
                'Cinder skip trigger detail through spirals loop sequence 14',
                'Cinder skip trigger detail inside lanterns twirl sequence 15',
                'Cinder skip trigger detail beyond harbors flare sequence 16',
                'Cinder skip trigger detail beneath constellations cinder sequence 17',
                'Cinder skip trigger detail among terraces skip sequence 18',
                'Cinder skip trigger detail into archives spark sequence 19',
                'Cinder skip trigger detail around rivers ash sequence 20',
                'Cinder skip trigger detail over valleys ember sequence 21',
                'Cinder skip trigger detail within galleries loop sequence 22',
                'Cinder skip trigger detail across skylines twirl sequence 23',
                'Cinder skip trigger detail through spirals flare sequence 24',
                'Cinder skip trigger detail inside lanterns cinder sequence 25',
            ];
            const compositions = [];
            for (let cycle = 0; cycle < loops; cycle++) {
                for (let index = 0; index < fragments.length; index++) {
                    const fragment = fragments[index];
                    const mood = moods[(index + cycle) % moods.length];
                    const connector = connectors[(index + tempo + cycle) % connectors.length];
                    const detail = details[(index + loops + cycle) % details.length];
                    const amplitude = ((index + 1) % (tempo + 1)) + cycle;
                    compositions.push({
                        fragment,
                        mood,
                        connector,
                        detail,
                        cycle: cycle + 1,
                        beat: index + 1,
                        amplitude,
                        intensity
                    });
                }
            }
            const curatedLines = [];
            compositions.forEach((item, index) => {
                const emphasiser = index % 2 === 0 ? '>' : '~';
                const descriptor = `${label} | cycle ${item.cycle} | beat ${item.beat} | ${item.fragment} | ${item.mood} | ${item.connector} | ${item.detail} | amplitude ${item.amplitude} | intensity ${item.intensity}`;
                curatedLines.push(`${emphasiser} ${descriptor}`);
                if ((index + 1) % tempo === 0) {
                    curatedLines.push(`tempo-marker ${tempo} :: segment ${index + 1}`);
                }
                if (index % 3 === 0) {
                    curatedLines.push(`echo ${index + 1} :: ${label} weaving ${item.connector}`);
                }
            });
            const layered = [];
            for (let index = 0; index < curatedLines.length; index++) {
                const focus = curatedLines[index];
                layered.push(`${label} swirl ${index + 1} => ${focus}`);
                if (index % 4 === 0) {
                    layered.push(`${label} harmonic ${index + 1} tempo ${tempo}`);
                }
            }
            const ensemble = layered.concat(curatedLines);
            const deduplicated = [];
            const seen = new Set();
            ensemble.forEach((item) => {
                if (!seen.has(item)) {
                    deduplicated.push(item);
                    seen.add(item);
                }
            });
            const trimmedBase = basePayload.trim();
            if (includeBase && trimmedBase) {
                deduplicated.unshift(`base-payload :: ${trimmedBase}`);
            }
            const numbered = deduplicated.map((line, index) => `${index + 1}. ${line}`);
            const newlineChar = String.fromCharCode(10);
            const safeKey = 'fantasy_trigger_cinder_skip';
            clone.vars[`${safeKey}_intensity`] = intensity;
            clone.vars[`${safeKey}_compositions`] = compositions.length;
            clone.vars[`${safeKey}_label`] = label;
            clone.vars[`${safeKey}_entries`] = numbered.length;
            clone.payload = numbered.join(newlineChar);
            clone.logs.push('Cinder skip trigger emitted cinder skip log sequences.');
            return [clone];
        }
    },
    {
        id: 'fantasy-trigger-quartz-hum',
        category: 'trigger',
        name: 'Quartz hum trigger',
        description: 'Breathe life when quartz harmonies hum beneath the desk.',
        icon: 'music',
        accent: '#a3e635',
        tags: ['trigger', 'quartz', 'hum', 'fantasy'],
        inputs: [],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { intensity: 'medium', loops: 1, tempo: 2, includeBase: true, label: 'Quartz hum notebook' },
        form: [
            {
                key: 'intensity',
                label: 'Intensity',
                type: 'select',
                options: [
                    { value: 'calm', label: 'Calm' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'bold', label: 'Bold' }
                ]
            },
            { key: 'loops', label: 'Loops', type: 'number', min: 1, max: 9 },
            { key: 'tempo', label: 'Tempo', type: 'number', min: 1, max: 12 },
            { key: 'includeBase', label: 'Include base payload', type: 'checkbox' },
            { key: 'label', label: 'Label', type: 'text', placeholder: 'Quartz hum notebook' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const basePayload = QuickActionTools.toText(clone.payload ?? '');
            const intensity = String(config?.intensity || 'medium').toLowerCase();
            const loops = Math.max(1, parseInt(config?.loops, 10) || 1);
            const tempo = Math.max(1, parseInt(config?.tempo, 10) || 1);
            const includeBase = config?.includeBase !== false;
            const label = (config?.label || 'Quartz hum notebook').trim() || 'Quartz hum notebook';
            const fragments = [
                'Quartz hum trigger fragment glittering quartz sequence 1',
                'Quartz hum trigger fragment flowing hum sequence 2',
                'Quartz hum trigger fragment spinning crystal sequence 3',
                'Quartz hum trigger fragment looping shine sequence 4',
                'Quartz hum trigger fragment vibrant humble sequence 5',
                'Quartz hum trigger fragment wandering tone sequence 6',
                'Quartz hum trigger fragment braided ring sequence 7',
                'Quartz hum trigger fragment singing spark sequence 8',
                'Quartz hum trigger fragment humming quartz sequence 9',
                'Quartz hum trigger fragment simmering hum sequence 10',
                'Quartz hum trigger fragment glittering crystal sequence 11',
                'Quartz hum trigger fragment flowing shine sequence 12',
                'Quartz hum trigger fragment spinning humble sequence 13',
                'Quartz hum trigger fragment looping tone sequence 14',
                'Quartz hum trigger fragment vibrant ring sequence 15',
                'Quartz hum trigger fragment wandering spark sequence 16',
                'Quartz hum trigger fragment braided quartz sequence 17',
                'Quartz hum trigger fragment singing hum sequence 18',
                'Quartz hum trigger fragment humming crystal sequence 19',
                'Quartz hum trigger fragment simmering shine sequence 20',
                'Quartz hum trigger fragment glittering humble sequence 21',
                'Quartz hum trigger fragment flowing tone sequence 22',
                'Quartz hum trigger fragment spinning ring sequence 23',
                'Quartz hum trigger fragment looping spark sequence 24',
                'Quartz hum trigger fragment vibrant quartz sequence 25',
            ];
            const moods = [
                'Quartz hum trigger mood dawn quartz sequence 1',
                'Quartz hum trigger mood twilight hum sequence 2',
                'Quartz hum trigger mood echo crystal sequence 3',
                'Quartz hum trigger mood glow shine sequence 4',
                'Quartz hum trigger mood spark humble sequence 5',
                'Quartz hum trigger mood tide tone sequence 6',
                'Quartz hum trigger mood whisper ring sequence 7',
                'Quartz hum trigger mood hum spark sequence 8',
                'Quartz hum trigger mood pulse quartz sequence 9',
                'Quartz hum trigger mood chorus hum sequence 10',
                'Quartz hum trigger mood dawn crystal sequence 11',
                'Quartz hum trigger mood twilight shine sequence 12',
                'Quartz hum trigger mood echo humble sequence 13',
                'Quartz hum trigger mood glow tone sequence 14',
                'Quartz hum trigger mood spark ring sequence 15',
                'Quartz hum trigger mood tide spark sequence 16',
                'Quartz hum trigger mood whisper quartz sequence 17',
                'Quartz hum trigger mood hum hum sequence 18',
                'Quartz hum trigger mood pulse crystal sequence 19',
                'Quartz hum trigger mood chorus shine sequence 20',
                'Quartz hum trigger mood dawn humble sequence 21',
                'Quartz hum trigger mood twilight tone sequence 22',
                'Quartz hum trigger mood echo ring sequence 23',
                'Quartz hum trigger mood glow spark sequence 24',
                'Quartz hum trigger mood spark quartz sequence 25',
            ];
            const connectors = [
                'Quartz hum trigger connector weaving quartz sequence 1',
                'Quartz hum trigger connector braiding hum sequence 2',
                'Quartz hum trigger connector linking crystal sequence 3',
                'Quartz hum trigger connector stitching shine sequence 4',
                'Quartz hum trigger connector guiding humble sequence 5',
                'Quartz hum trigger connector threading tone sequence 6',
                'Quartz hum trigger connector folding ring sequence 7',
                'Quartz hum trigger connector mapping spark sequence 8',
                'Quartz hum trigger connector casting quartz sequence 9',
                'Quartz hum trigger connector painting hum sequence 10',
                'Quartz hum trigger connector weaving crystal sequence 11',
                'Quartz hum trigger connector braiding shine sequence 12',
                'Quartz hum trigger connector linking humble sequence 13',
                'Quartz hum trigger connector stitching tone sequence 14',
                'Quartz hum trigger connector guiding ring sequence 15',
                'Quartz hum trigger connector threading spark sequence 16',
                'Quartz hum trigger connector folding quartz sequence 17',
                'Quartz hum trigger connector mapping hum sequence 18',
                'Quartz hum trigger connector casting crystal sequence 19',
                'Quartz hum trigger connector painting shine sequence 20',
                'Quartz hum trigger connector weaving humble sequence 21',
                'Quartz hum trigger connector braiding tone sequence 22',
                'Quartz hum trigger connector linking ring sequence 23',
                'Quartz hum trigger connector stitching spark sequence 24',
                'Quartz hum trigger connector guiding quartz sequence 25',
            ];
            const details = [
                'Quartz hum trigger detail over valleys quartz sequence 1',
                'Quartz hum trigger detail within galleries hum sequence 2',
                'Quartz hum trigger detail across skylines crystal sequence 3',
                'Quartz hum trigger detail through spirals shine sequence 4',
                'Quartz hum trigger detail inside lanterns humble sequence 5',
                'Quartz hum trigger detail beyond harbors tone sequence 6',
                'Quartz hum trigger detail beneath constellations ring sequence 7',
                'Quartz hum trigger detail among terraces spark sequence 8',
                'Quartz hum trigger detail into archives quartz sequence 9',
                'Quartz hum trigger detail around rivers hum sequence 10',
                'Quartz hum trigger detail over valleys crystal sequence 11',
                'Quartz hum trigger detail within galleries shine sequence 12',
                'Quartz hum trigger detail across skylines humble sequence 13',
                'Quartz hum trigger detail through spirals tone sequence 14',
                'Quartz hum trigger detail inside lanterns ring sequence 15',
                'Quartz hum trigger detail beyond harbors spark sequence 16',
                'Quartz hum trigger detail beneath constellations quartz sequence 17',
                'Quartz hum trigger detail among terraces hum sequence 18',
                'Quartz hum trigger detail into archives crystal sequence 19',
                'Quartz hum trigger detail around rivers shine sequence 20',
                'Quartz hum trigger detail over valleys humble sequence 21',
                'Quartz hum trigger detail within galleries tone sequence 22',
                'Quartz hum trigger detail across skylines ring sequence 23',
                'Quartz hum trigger detail through spirals spark sequence 24',
                'Quartz hum trigger detail inside lanterns quartz sequence 25',
            ];
            const compositions = [];
            for (let cycle = 0; cycle < loops; cycle++) {
                for (let index = 0; index < fragments.length; index++) {
                    const fragment = fragments[index];
                    const mood = moods[(index + cycle) % moods.length];
                    const connector = connectors[(index + tempo + cycle) % connectors.length];
                    const detail = details[(index + loops + cycle) % details.length];
                    const amplitude = ((index + 1) % (tempo + 1)) + cycle;
                    compositions.push({
                        fragment,
                        mood,
                        connector,
                        detail,
                        cycle: cycle + 1,
                        beat: index + 1,
                        amplitude,
                        intensity
                    });
                }
            }
            const curatedLines = [];
            compositions.forEach((item, index) => {
                const emphasiser = index % 2 === 0 ? '>' : '~';
                const descriptor = `${label} | cycle ${item.cycle} | beat ${item.beat} | ${item.fragment} | ${item.mood} | ${item.connector} | ${item.detail} | amplitude ${item.amplitude} | intensity ${item.intensity}`;
                curatedLines.push(`${emphasiser} ${descriptor}`);
                if ((index + 1) % tempo === 0) {
                    curatedLines.push(`tempo-marker ${tempo} :: segment ${index + 1}`);
                }
                if (index % 3 === 0) {
                    curatedLines.push(`echo ${index + 1} :: ${label} weaving ${item.connector}`);
                }
            });
            const layered = [];
            for (let index = 0; index < curatedLines.length; index++) {
                const focus = curatedLines[index];
                layered.push(`${label} swirl ${index + 1} => ${focus}`);
                if (index % 4 === 0) {
                    layered.push(`${label} harmonic ${index + 1} tempo ${tempo}`);
                }
            }
            const ensemble = layered.concat(curatedLines);
            const deduplicated = [];
            const seen = new Set();
            ensemble.forEach((item) => {
                if (!seen.has(item)) {
                    deduplicated.push(item);
                    seen.add(item);
                }
            });
            const trimmedBase = basePayload.trim();
            if (includeBase && trimmedBase) {
                deduplicated.unshift(`base-payload :: ${trimmedBase}`);
            }
            const numbered = deduplicated.map((line, index) => `${index + 1}. ${line}`);
            const newlineChar = String.fromCharCode(10);
            const safeKey = 'fantasy_trigger_quartz_hum';
            clone.vars[`${safeKey}_intensity`] = intensity;
            clone.vars[`${safeKey}_compositions`] = compositions.length;
            clone.vars[`${safeKey}_label`] = label;
            clone.vars[`${safeKey}_entries`] = numbered.length;
            clone.payload = numbered.join(newlineChar);
            clone.logs.push('Quartz hum trigger emitted quartz hum notebook sequences.');
            return [clone];
        }
    },
    {
        id: 'fantasy-trigger-lantern-signal',
        category: 'trigger',
        name: 'Lantern signal trigger',
        description: 'Illuminates flows when distant lanterns signal in chorus.',
        icon: 'alert-circle',
        accent: '#fbbf24',
        tags: ['trigger', 'lantern', 'signal', 'fantasy'],
        inputs: [],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { intensity: 'medium', loops: 1, tempo: 2, includeBase: true, label: 'Lantern signal board' },
        form: [
            {
                key: 'intensity',
                label: 'Intensity',
                type: 'select',
                options: [
                    { value: 'calm', label: 'Calm' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'bold', label: 'Bold' }
                ]
            },
            { key: 'loops', label: 'Loops', type: 'number', min: 1, max: 9 },
            { key: 'tempo', label: 'Tempo', type: 'number', min: 1, max: 12 },
            { key: 'includeBase', label: 'Include base payload', type: 'checkbox' },
            { key: 'label', label: 'Label', type: 'text', placeholder: 'Lantern signal board' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const basePayload = QuickActionTools.toText(clone.payload ?? '');
            const intensity = String(config?.intensity || 'medium').toLowerCase();
            const loops = Math.max(1, parseInt(config?.loops, 10) || 1);
            const tempo = Math.max(1, parseInt(config?.tempo, 10) || 1);
            const includeBase = config?.includeBase !== false;
            const label = (config?.label || 'Lantern signal board').trim() || 'Lantern signal board';
            const fragments = [
                'Lantern signal trigger fragment glittering lantern sequence 1',
                'Lantern signal trigger fragment flowing signal sequence 2',
                'Lantern signal trigger fragment spinning glow sequence 3',
                'Lantern signal trigger fragment looping path sequence 4',
                'Lantern signal trigger fragment vibrant guiding sequence 5',
                'Lantern signal trigger fragment wandering twinkle sequence 6',
                'Lantern signal trigger fragment braided evening sequence 7',
                'Lantern signal trigger fragment singing trail sequence 8',
                'Lantern signal trigger fragment humming lantern sequence 9',
                'Lantern signal trigger fragment simmering signal sequence 10',
                'Lantern signal trigger fragment glittering glow sequence 11',
                'Lantern signal trigger fragment flowing path sequence 12',
                'Lantern signal trigger fragment spinning guiding sequence 13',
                'Lantern signal trigger fragment looping twinkle sequence 14',
                'Lantern signal trigger fragment vibrant evening sequence 15',
                'Lantern signal trigger fragment wandering trail sequence 16',
                'Lantern signal trigger fragment braided lantern sequence 17',
                'Lantern signal trigger fragment singing signal sequence 18',
                'Lantern signal trigger fragment humming glow sequence 19',
                'Lantern signal trigger fragment simmering path sequence 20',
                'Lantern signal trigger fragment glittering guiding sequence 21',
                'Lantern signal trigger fragment flowing twinkle sequence 22',
                'Lantern signal trigger fragment spinning evening sequence 23',
                'Lantern signal trigger fragment looping trail sequence 24',
                'Lantern signal trigger fragment vibrant lantern sequence 25',
            ];
            const moods = [
                'Lantern signal trigger mood dawn lantern sequence 1',
                'Lantern signal trigger mood twilight signal sequence 2',
                'Lantern signal trigger mood echo glow sequence 3',
                'Lantern signal trigger mood glow path sequence 4',
                'Lantern signal trigger mood spark guiding sequence 5',
                'Lantern signal trigger mood tide twinkle sequence 6',
                'Lantern signal trigger mood whisper evening sequence 7',
                'Lantern signal trigger mood hum trail sequence 8',
                'Lantern signal trigger mood pulse lantern sequence 9',
                'Lantern signal trigger mood chorus signal sequence 10',
                'Lantern signal trigger mood dawn glow sequence 11',
                'Lantern signal trigger mood twilight path sequence 12',
                'Lantern signal trigger mood echo guiding sequence 13',
                'Lantern signal trigger mood glow twinkle sequence 14',
                'Lantern signal trigger mood spark evening sequence 15',
                'Lantern signal trigger mood tide trail sequence 16',
                'Lantern signal trigger mood whisper lantern sequence 17',
                'Lantern signal trigger mood hum signal sequence 18',
                'Lantern signal trigger mood pulse glow sequence 19',
                'Lantern signal trigger mood chorus path sequence 20',
                'Lantern signal trigger mood dawn guiding sequence 21',
                'Lantern signal trigger mood twilight twinkle sequence 22',
                'Lantern signal trigger mood echo evening sequence 23',
                'Lantern signal trigger mood glow trail sequence 24',
                'Lantern signal trigger mood spark lantern sequence 25',
            ];
            const connectors = [
                'Lantern signal trigger connector weaving lantern sequence 1',
                'Lantern signal trigger connector braiding signal sequence 2',
                'Lantern signal trigger connector linking glow sequence 3',
                'Lantern signal trigger connector stitching path sequence 4',
                'Lantern signal trigger connector guiding guiding sequence 5',
                'Lantern signal trigger connector threading twinkle sequence 6',
                'Lantern signal trigger connector folding evening sequence 7',
                'Lantern signal trigger connector mapping trail sequence 8',
                'Lantern signal trigger connector casting lantern sequence 9',
                'Lantern signal trigger connector painting signal sequence 10',
                'Lantern signal trigger connector weaving glow sequence 11',
                'Lantern signal trigger connector braiding path sequence 12',
                'Lantern signal trigger connector linking guiding sequence 13',
                'Lantern signal trigger connector stitching twinkle sequence 14',
                'Lantern signal trigger connector guiding evening sequence 15',
                'Lantern signal trigger connector threading trail sequence 16',
                'Lantern signal trigger connector folding lantern sequence 17',
                'Lantern signal trigger connector mapping signal sequence 18',
                'Lantern signal trigger connector casting glow sequence 19',
                'Lantern signal trigger connector painting path sequence 20',
                'Lantern signal trigger connector weaving guiding sequence 21',
                'Lantern signal trigger connector braiding twinkle sequence 22',
                'Lantern signal trigger connector linking evening sequence 23',
                'Lantern signal trigger connector stitching trail sequence 24',
                'Lantern signal trigger connector guiding lantern sequence 25',
            ];
            const details = [
                'Lantern signal trigger detail over valleys lantern sequence 1',
                'Lantern signal trigger detail within galleries signal sequence 2',
                'Lantern signal trigger detail across skylines glow sequence 3',
                'Lantern signal trigger detail through spirals path sequence 4',
                'Lantern signal trigger detail inside lanterns guiding sequence 5',
                'Lantern signal trigger detail beyond harbors twinkle sequence 6',
                'Lantern signal trigger detail beneath constellations evening sequence 7',
                'Lantern signal trigger detail among terraces trail sequence 8',
                'Lantern signal trigger detail into archives lantern sequence 9',
                'Lantern signal trigger detail around rivers signal sequence 10',
                'Lantern signal trigger detail over valleys glow sequence 11',
                'Lantern signal trigger detail within galleries path sequence 12',
                'Lantern signal trigger detail across skylines guiding sequence 13',
                'Lantern signal trigger detail through spirals twinkle sequence 14',
                'Lantern signal trigger detail inside lanterns evening sequence 15',
                'Lantern signal trigger detail beyond harbors trail sequence 16',
                'Lantern signal trigger detail beneath constellations lantern sequence 17',
                'Lantern signal trigger detail among terraces signal sequence 18',
                'Lantern signal trigger detail into archives glow sequence 19',
                'Lantern signal trigger detail around rivers path sequence 20',
                'Lantern signal trigger detail over valleys guiding sequence 21',
                'Lantern signal trigger detail within galleries twinkle sequence 22',
                'Lantern signal trigger detail across skylines evening sequence 23',
                'Lantern signal trigger detail through spirals trail sequence 24',
                'Lantern signal trigger detail inside lanterns lantern sequence 25',
            ];
            const compositions = [];
            for (let cycle = 0; cycle < loops; cycle++) {
                for (let index = 0; index < fragments.length; index++) {
                    const fragment = fragments[index];
                    const mood = moods[(index + cycle) % moods.length];
                    const connector = connectors[(index + tempo + cycle) % connectors.length];
                    const detail = details[(index + loops + cycle) % details.length];
                    const amplitude = ((index + 1) % (tempo + 1)) + cycle;
                    compositions.push({
                        fragment,
                        mood,
                        connector,
                        detail,
                        cycle: cycle + 1,
                        beat: index + 1,
                        amplitude,
                        intensity
                    });
                }
            }
            const curatedLines = [];
            compositions.forEach((item, index) => {
                const emphasiser = index % 2 === 0 ? '>' : '~';
                const descriptor = `${label} | cycle ${item.cycle} | beat ${item.beat} | ${item.fragment} | ${item.mood} | ${item.connector} | ${item.detail} | amplitude ${item.amplitude} | intensity ${item.intensity}`;
                curatedLines.push(`${emphasiser} ${descriptor}`);
                if ((index + 1) % tempo === 0) {
                    curatedLines.push(`tempo-marker ${tempo} :: segment ${index + 1}`);
                }
                if (index % 3 === 0) {
                    curatedLines.push(`echo ${index + 1} :: ${label} weaving ${item.connector}`);
                }
            });
            const layered = [];
            for (let index = 0; index < curatedLines.length; index++) {
                const focus = curatedLines[index];
                layered.push(`${label} swirl ${index + 1} => ${focus}`);
                if (index % 4 === 0) {
                    layered.push(`${label} harmonic ${index + 1} tempo ${tempo}`);
                }
            }
            const ensemble = layered.concat(curatedLines);
            const deduplicated = [];
            const seen = new Set();
            ensemble.forEach((item) => {
                if (!seen.has(item)) {
                    deduplicated.push(item);
                    seen.add(item);
                }
            });
            const trimmedBase = basePayload.trim();
            if (includeBase && trimmedBase) {
                deduplicated.unshift(`base-payload :: ${trimmedBase}`);
            }
            const numbered = deduplicated.map((line, index) => `${index + 1}. ${line}`);
            const newlineChar = String.fromCharCode(10);
            const safeKey = 'fantasy_trigger_lantern_signal';
            clone.vars[`${safeKey}_intensity`] = intensity;
            clone.vars[`${safeKey}_compositions`] = compositions.length;
            clone.vars[`${safeKey}_label`] = label;
            clone.vars[`${safeKey}_entries`] = numbered.length;
            clone.payload = numbered.join(newlineChar);
            clone.logs.push('Lantern signal trigger emitted lantern signal board sequences.');
            return [clone];
        }
    },
    {
        id: 'fantasy-trigger-rain-kaleidoscope',
        category: 'trigger',
        name: 'Rain kaleidoscope trigger',
        description: 'Spin flows when raindrops kaleidoscope upon every window.',
        icon: 'droplet',
        accent: '#0ea5e9',
        tags: ['trigger', 'rain', 'kaleidoscope', 'fantasy'],
        inputs: [],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { intensity: 'medium', loops: 1, tempo: 2, includeBase: true, label: 'Rain kaleidoscope register' },
        form: [
            {
                key: 'intensity',
                label: 'Intensity',
                type: 'select',
                options: [
                    { value: 'calm', label: 'Calm' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'bold', label: 'Bold' }
                ]
            },
            { key: 'loops', label: 'Loops', type: 'number', min: 1, max: 9 },
            { key: 'tempo', label: 'Tempo', type: 'number', min: 1, max: 12 },
            { key: 'includeBase', label: 'Include base payload', type: 'checkbox' },
            { key: 'label', label: 'Label', type: 'text', placeholder: 'Rain kaleidoscope register' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const basePayload = QuickActionTools.toText(clone.payload ?? '');
            const intensity = String(config?.intensity || 'medium').toLowerCase();
            const loops = Math.max(1, parseInt(config?.loops, 10) || 1);
            const tempo = Math.max(1, parseInt(config?.tempo, 10) || 1);
            const includeBase = config?.includeBase !== false;
            const label = (config?.label || 'Rain kaleidoscope register').trim() || 'Rain kaleidoscope register';
            const fragments = [
                'Rain kaleidoscope trigger fragment glittering rain sequence 1',
                'Rain kaleidoscope trigger fragment flowing kaleidoscope sequence 2',
                'Rain kaleidoscope trigger fragment spinning drop sequence 3',
                'Rain kaleidoscope trigger fragment looping splash sequence 4',
                'Rain kaleidoscope trigger fragment vibrant ripple sequence 5',
                'Rain kaleidoscope trigger fragment wandering mirror sequence 6',
                'Rain kaleidoscope trigger fragment braided glisten sequence 7',
                'Rain kaleidoscope trigger fragment singing pattern sequence 8',
                'Rain kaleidoscope trigger fragment humming rain sequence 9',
                'Rain kaleidoscope trigger fragment simmering kaleidoscope sequence 10',
                'Rain kaleidoscope trigger fragment glittering drop sequence 11',
                'Rain kaleidoscope trigger fragment flowing splash sequence 12',
                'Rain kaleidoscope trigger fragment spinning ripple sequence 13',
                'Rain kaleidoscope trigger fragment looping mirror sequence 14',
                'Rain kaleidoscope trigger fragment vibrant glisten sequence 15',
                'Rain kaleidoscope trigger fragment wandering pattern sequence 16',
                'Rain kaleidoscope trigger fragment braided rain sequence 17',
                'Rain kaleidoscope trigger fragment singing kaleidoscope sequence 18',
                'Rain kaleidoscope trigger fragment humming drop sequence 19',
                'Rain kaleidoscope trigger fragment simmering splash sequence 20',
                'Rain kaleidoscope trigger fragment glittering ripple sequence 21',
                'Rain kaleidoscope trigger fragment flowing mirror sequence 22',
                'Rain kaleidoscope trigger fragment spinning glisten sequence 23',
                'Rain kaleidoscope trigger fragment looping pattern sequence 24',
                'Rain kaleidoscope trigger fragment vibrant rain sequence 25',
            ];
            const moods = [
                'Rain kaleidoscope trigger mood dawn rain sequence 1',
                'Rain kaleidoscope trigger mood twilight kaleidoscope sequence 2',
                'Rain kaleidoscope trigger mood echo drop sequence 3',
                'Rain kaleidoscope trigger mood glow splash sequence 4',
                'Rain kaleidoscope trigger mood spark ripple sequence 5',
                'Rain kaleidoscope trigger mood tide mirror sequence 6',
                'Rain kaleidoscope trigger mood whisper glisten sequence 7',
                'Rain kaleidoscope trigger mood hum pattern sequence 8',
                'Rain kaleidoscope trigger mood pulse rain sequence 9',
                'Rain kaleidoscope trigger mood chorus kaleidoscope sequence 10',
                'Rain kaleidoscope trigger mood dawn drop sequence 11',
                'Rain kaleidoscope trigger mood twilight splash sequence 12',
                'Rain kaleidoscope trigger mood echo ripple sequence 13',
                'Rain kaleidoscope trigger mood glow mirror sequence 14',
                'Rain kaleidoscope trigger mood spark glisten sequence 15',
                'Rain kaleidoscope trigger mood tide pattern sequence 16',
                'Rain kaleidoscope trigger mood whisper rain sequence 17',
                'Rain kaleidoscope trigger mood hum kaleidoscope sequence 18',
                'Rain kaleidoscope trigger mood pulse drop sequence 19',
                'Rain kaleidoscope trigger mood chorus splash sequence 20',
                'Rain kaleidoscope trigger mood dawn ripple sequence 21',
                'Rain kaleidoscope trigger mood twilight mirror sequence 22',
                'Rain kaleidoscope trigger mood echo glisten sequence 23',
                'Rain kaleidoscope trigger mood glow pattern sequence 24',
                'Rain kaleidoscope trigger mood spark rain sequence 25',
            ];
            const connectors = [
                'Rain kaleidoscope trigger connector weaving rain sequence 1',
                'Rain kaleidoscope trigger connector braiding kaleidoscope sequence 2',
                'Rain kaleidoscope trigger connector linking drop sequence 3',
                'Rain kaleidoscope trigger connector stitching splash sequence 4',
                'Rain kaleidoscope trigger connector guiding ripple sequence 5',
                'Rain kaleidoscope trigger connector threading mirror sequence 6',
                'Rain kaleidoscope trigger connector folding glisten sequence 7',
                'Rain kaleidoscope trigger connector mapping pattern sequence 8',
                'Rain kaleidoscope trigger connector casting rain sequence 9',
                'Rain kaleidoscope trigger connector painting kaleidoscope sequence 10',
                'Rain kaleidoscope trigger connector weaving drop sequence 11',
                'Rain kaleidoscope trigger connector braiding splash sequence 12',
                'Rain kaleidoscope trigger connector linking ripple sequence 13',
                'Rain kaleidoscope trigger connector stitching mirror sequence 14',
                'Rain kaleidoscope trigger connector guiding glisten sequence 15',
                'Rain kaleidoscope trigger connector threading pattern sequence 16',
                'Rain kaleidoscope trigger connector folding rain sequence 17',
                'Rain kaleidoscope trigger connector mapping kaleidoscope sequence 18',
                'Rain kaleidoscope trigger connector casting drop sequence 19',
                'Rain kaleidoscope trigger connector painting splash sequence 20',
                'Rain kaleidoscope trigger connector weaving ripple sequence 21',
                'Rain kaleidoscope trigger connector braiding mirror sequence 22',
                'Rain kaleidoscope trigger connector linking glisten sequence 23',
                'Rain kaleidoscope trigger connector stitching pattern sequence 24',
                'Rain kaleidoscope trigger connector guiding rain sequence 25',
            ];
            const details = [
                'Rain kaleidoscope trigger detail over valleys rain sequence 1',
                'Rain kaleidoscope trigger detail within galleries kaleidoscope sequence 2',
                'Rain kaleidoscope trigger detail across skylines drop sequence 3',
                'Rain kaleidoscope trigger detail through spirals splash sequence 4',
                'Rain kaleidoscope trigger detail inside lanterns ripple sequence 5',
                'Rain kaleidoscope trigger detail beyond harbors mirror sequence 6',
                'Rain kaleidoscope trigger detail beneath constellations glisten sequence 7',
                'Rain kaleidoscope trigger detail among terraces pattern sequence 8',
                'Rain kaleidoscope trigger detail into archives rain sequence 9',
                'Rain kaleidoscope trigger detail around rivers kaleidoscope sequence 10',
                'Rain kaleidoscope trigger detail over valleys drop sequence 11',
                'Rain kaleidoscope trigger detail within galleries splash sequence 12',
                'Rain kaleidoscope trigger detail across skylines ripple sequence 13',
                'Rain kaleidoscope trigger detail through spirals mirror sequence 14',
                'Rain kaleidoscope trigger detail inside lanterns glisten sequence 15',
                'Rain kaleidoscope trigger detail beyond harbors pattern sequence 16',
                'Rain kaleidoscope trigger detail beneath constellations rain sequence 17',
                'Rain kaleidoscope trigger detail among terraces kaleidoscope sequence 18',
                'Rain kaleidoscope trigger detail into archives drop sequence 19',
                'Rain kaleidoscope trigger detail around rivers splash sequence 20',
                'Rain kaleidoscope trigger detail over valleys ripple sequence 21',
                'Rain kaleidoscope trigger detail within galleries mirror sequence 22',
                'Rain kaleidoscope trigger detail across skylines glisten sequence 23',
                'Rain kaleidoscope trigger detail through spirals pattern sequence 24',
                'Rain kaleidoscope trigger detail inside lanterns rain sequence 25',
            ];
            const compositions = [];
            for (let cycle = 0; cycle < loops; cycle++) {
                for (let index = 0; index < fragments.length; index++) {
                    const fragment = fragments[index];
                    const mood = moods[(index + cycle) % moods.length];
                    const connector = connectors[(index + tempo + cycle) % connectors.length];
                    const detail = details[(index + loops + cycle) % details.length];
                    const amplitude = ((index + 1) % (tempo + 1)) + cycle;
                    compositions.push({
                        fragment,
                        mood,
                        connector,
                        detail,
                        cycle: cycle + 1,
                        beat: index + 1,
                        amplitude,
                        intensity
                    });
                }
            }
            const curatedLines = [];
            compositions.forEach((item, index) => {
                const emphasiser = index % 2 === 0 ? '>' : '~';
                const descriptor = `${label} | cycle ${item.cycle} | beat ${item.beat} | ${item.fragment} | ${item.mood} | ${item.connector} | ${item.detail} | amplitude ${item.amplitude} | intensity ${item.intensity}`;
                curatedLines.push(`${emphasiser} ${descriptor}`);
                if ((index + 1) % tempo === 0) {
                    curatedLines.push(`tempo-marker ${tempo} :: segment ${index + 1}`);
                }
                if (index % 3 === 0) {
                    curatedLines.push(`echo ${index + 1} :: ${label} weaving ${item.connector}`);
                }
            });
            const layered = [];
            for (let index = 0; index < curatedLines.length; index++) {
                const focus = curatedLines[index];
                layered.push(`${label} swirl ${index + 1} => ${focus}`);
                if (index % 4 === 0) {
                    layered.push(`${label} harmonic ${index + 1} tempo ${tempo}`);
                }
            }
            const ensemble = layered.concat(curatedLines);
            const deduplicated = [];
            const seen = new Set();
            ensemble.forEach((item) => {
                if (!seen.has(item)) {
                    deduplicated.push(item);
                    seen.add(item);
                }
            });
            const trimmedBase = basePayload.trim();
            if (includeBase && trimmedBase) {
                deduplicated.unshift(`base-payload :: ${trimmedBase}`);
            }
            const numbered = deduplicated.map((line, index) => `${index + 1}. ${line}`);
            const newlineChar = String.fromCharCode(10);
            const safeKey = 'fantasy_trigger_rain_kaleidoscope';
            clone.vars[`${safeKey}_intensity`] = intensity;
            clone.vars[`${safeKey}_compositions`] = compositions.length;
            clone.vars[`${safeKey}_label`] = label;
            clone.vars[`${safeKey}_entries`] = numbered.length;
            clone.payload = numbered.join(newlineChar);
            clone.logs.push('Rain kaleidoscope trigger emitted rain kaleidoscope register sequences.');
            return [clone];
        }
    },
    {
        id: 'fantasy-action-prismatic-quilt',
        category: 'action',
        name: 'Prismatic quilt action',
        description: 'Stitch payloads into layered prismatic quilts of text.',
        icon: 'grid',
        accent: '#8b5cf6',
        tags: ['action', 'prismatic', 'quilt', 'fantasy'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { style: 'Prismatic quilt', variations: 3, lighten: false, anchor: 'Central loom', includeTimestamp: false },
        form: [
            { key: 'style', label: 'Style', type: 'text', placeholder: 'Prismatic quilt' },
            { key: 'variations', label: 'Variations', type: 'number', min: 1, max: 12 },
            { key: 'lighten', label: 'Lighten palette', type: 'checkbox' },
            { key: 'anchor', label: 'Anchor', type: 'text', placeholder: 'Central loom' },
            { key: 'includeTimestamp', label: 'Include timestamp', type: 'checkbox' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const basePayload = QuickActionTools.toText(clone.payload ?? '');
            const style = (config?.style || 'Prismatic quilt').trim() || 'Prismatic quilt';
            const variations = Math.max(1, parseInt(config?.variations, 10) || 1);
            const lighten = Boolean(config?.lighten);
            const anchor = (config?.anchor || 'Central loom').trim() || 'Central loom';
            const includeTimestamp = Boolean(config?.includeTimestamp);
            const references = [
                'Prismatic quilt action reference shimmer quilt sequence 1',
                'Prismatic quilt action reference glyph prism sequence 2',
                'Prismatic quilt action reference ribbon patch sequence 3',
                'Prismatic quilt action reference arc loom sequence 4',
                'Prismatic quilt action reference petal thread sequence 5',
                'Prismatic quilt action reference beam stitch sequence 6',
                'Prismatic quilt action reference facet pattern sequence 7',
                'Prismatic quilt action reference chorus fabric sequence 8',
                'Prismatic quilt action reference lattice quilt sequence 9',
                'Prismatic quilt action reference lyric prism sequence 10',
                'Prismatic quilt action reference shimmer patch sequence 11',
                'Prismatic quilt action reference glyph loom sequence 12',
                'Prismatic quilt action reference ribbon thread sequence 13',
                'Prismatic quilt action reference arc stitch sequence 14',
                'Prismatic quilt action reference petal pattern sequence 15',
                'Prismatic quilt action reference beam fabric sequence 16',
                'Prismatic quilt action reference facet quilt sequence 17',
                'Prismatic quilt action reference chorus prism sequence 18',
                'Prismatic quilt action reference lattice patch sequence 19',
                'Prismatic quilt action reference lyric loom sequence 20',
                'Prismatic quilt action reference shimmer thread sequence 21',
                'Prismatic quilt action reference glyph stitch sequence 22',
                'Prismatic quilt action reference ribbon pattern sequence 23',
                'Prismatic quilt action reference arc fabric sequence 24',
                'Prismatic quilt action reference petal quilt sequence 25',
            ];
            const palettes = [
                'Prismatic quilt action palette amber quilt sequence 1',
                'Prismatic quilt action palette azure prism sequence 2',
                'Prismatic quilt action palette violet patch sequence 3',
                'Prismatic quilt action palette scarlet loom sequence 4',
                'Prismatic quilt action palette emerald thread sequence 5',
                'Prismatic quilt action palette indigo stitch sequence 6',
                'Prismatic quilt action palette cobalt pattern sequence 7',
                'Prismatic quilt action palette vermilion fabric sequence 8',
                'Prismatic quilt action palette sepia quilt sequence 9',
                'Prismatic quilt action palette silver prism sequence 10',
                'Prismatic quilt action palette amber patch sequence 11',
                'Prismatic quilt action palette azure loom sequence 12',
                'Prismatic quilt action palette violet thread sequence 13',
                'Prismatic quilt action palette scarlet stitch sequence 14',
                'Prismatic quilt action palette emerald pattern sequence 15',
                'Prismatic quilt action palette indigo fabric sequence 16',
                'Prismatic quilt action palette cobalt quilt sequence 17',
                'Prismatic quilt action palette vermilion prism sequence 18',
                'Prismatic quilt action palette sepia patch sequence 19',
                'Prismatic quilt action palette silver loom sequence 20',
                'Prismatic quilt action palette amber thread sequence 21',
                'Prismatic quilt action palette azure stitch sequence 22',
                'Prismatic quilt action palette violet pattern sequence 23',
                'Prismatic quilt action palette scarlet fabric sequence 24',
                'Prismatic quilt action palette emerald quilt sequence 25',
            ];
            const pathways = [
                'Prismatic quilt action pathway causeway quilt sequence 1',
                'Prismatic quilt action pathway stair prism sequence 2',
                'Prismatic quilt action pathway balcony patch sequence 3',
                'Prismatic quilt action pathway bridge loom sequence 4',
                'Prismatic quilt action pathway promenade thread sequence 5',
                'Prismatic quilt action pathway corridor stitch sequence 6',
                'Prismatic quilt action pathway gate pattern sequence 7',
                'Prismatic quilt action pathway atrium fabric sequence 8',
                'Prismatic quilt action pathway garden quilt sequence 9',
                'Prismatic quilt action pathway lantern prism sequence 10',
                'Prismatic quilt action pathway causeway patch sequence 11',
                'Prismatic quilt action pathway stair loom sequence 12',
                'Prismatic quilt action pathway balcony thread sequence 13',
                'Prismatic quilt action pathway bridge stitch sequence 14',
                'Prismatic quilt action pathway promenade pattern sequence 15',
                'Prismatic quilt action pathway corridor fabric sequence 16',
                'Prismatic quilt action pathway gate quilt sequence 17',
                'Prismatic quilt action pathway atrium prism sequence 18',
                'Prismatic quilt action pathway garden patch sequence 19',
                'Prismatic quilt action pathway lantern loom sequence 20',
                'Prismatic quilt action pathway causeway thread sequence 21',
                'Prismatic quilt action pathway stair stitch sequence 22',
                'Prismatic quilt action pathway balcony pattern sequence 23',
                'Prismatic quilt action pathway bridge fabric sequence 24',
                'Prismatic quilt action pathway promenade quilt sequence 25',
            ];
            const moments = [
                'Prismatic quilt action moment moment quilt sequence 1',
                'Prismatic quilt action moment glimmer prism sequence 2',
                'Prismatic quilt action moment spark patch sequence 3',
                'Prismatic quilt action moment pulse loom sequence 4',
                'Prismatic quilt action moment beat thread sequence 5',
                'Prismatic quilt action moment echo stitch sequence 6',
                'Prismatic quilt action moment note pattern sequence 7',
                'Prismatic quilt action moment breath fabric sequence 8',
                'Prismatic quilt action moment pause quilt sequence 9',
                'Prismatic quilt action moment crescendo prism sequence 10',
                'Prismatic quilt action moment moment patch sequence 11',
                'Prismatic quilt action moment glimmer loom sequence 12',
                'Prismatic quilt action moment spark thread sequence 13',
                'Prismatic quilt action moment pulse stitch sequence 14',
                'Prismatic quilt action moment beat pattern sequence 15',
                'Prismatic quilt action moment echo fabric sequence 16',
                'Prismatic quilt action moment note quilt sequence 17',
                'Prismatic quilt action moment breath prism sequence 18',
                'Prismatic quilt action moment pause patch sequence 19',
                'Prismatic quilt action moment crescendo loom sequence 20',
                'Prismatic quilt action moment moment thread sequence 21',
                'Prismatic quilt action moment glimmer stitch sequence 22',
                'Prismatic quilt action moment spark pattern sequence 23',
                'Prismatic quilt action moment pulse fabric sequence 24',
                'Prismatic quilt action moment beat quilt sequence 25',
            ];
            const renderings = [];
            for (let round = 0; round < variations; round++) {
                for (let index = 0; index < references.length; index++) {
                    const reference = references[index];
                    const palette = palettes[(index + round) % palettes.length];
                    const pathway = pathways[(index + round * 2) % pathways.length];
                    const moment = moments[(index + round * 3) % moments.length];
                    const timestamp = includeTimestamp ? ` @${new Date().toISOString()}` : '';
                    renderings.push(`${style} | ${anchor} | ${reference} | ${palette} | ${pathway} | ${moment}${timestamp}`);
                }
            }
            const luminous = [];
            renderings.forEach((entry, index) => {
                const accentuated = lighten ? entry.toUpperCase() : entry;
                luminous.push(`${index + 1} :: ${accentuated}`);
                if (index % 2 === 0) {
                    luminous.push(`bridge ${index + 1} :: ${anchor}`);
                }
                if (index % 5 === 0) {
                    luminous.push(`style ${style} ripple ${index + 1}`);
                }
            });
            const spool = [];
            const spoolSet = new Set();
            luminous.forEach((item) => {
                if (!spoolSet.has(item)) {
                    spool.push(item);
                    spoolSet.add(item);
                }
            });
            const base = basePayload.trim();
            if (base) {
                spool.unshift(`base::${base}`);
            }
            const newlineChar = String.fromCharCode(10);
            const safeKey = 'fantasy_action_prismatic_quilt';
            clone.vars[`${safeKey}_style`] = style;
            clone.vars[`${safeKey}_renderCount`] = renderings.length;
            clone.vars[`${safeKey}_anchor`] = anchor;
            clone.payload = spool.join(newlineChar);
            clone.logs.push('Prismatic quilt action arranged luminous passages.');
            return [clone];
        }
    },
    {
        id: 'fantasy-action-lantern-cascade',
        category: 'action',
        name: 'Lantern cascade action',
        description: 'Arrange new lines like lantern cascades over scenic bridges.',
        icon: 'layers',
        accent: '#f97316',
        tags: ['action', 'lantern', 'cascade', 'fantasy'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { style: 'Lantern cascade', variations: 3, lighten: false, anchor: 'Suspended lights', includeTimestamp: false },
        form: [
            { key: 'style', label: 'Style', type: 'text', placeholder: 'Lantern cascade' },
            { key: 'variations', label: 'Variations', type: 'number', min: 1, max: 12 },
            { key: 'lighten', label: 'Lighten palette', type: 'checkbox' },
            { key: 'anchor', label: 'Anchor', type: 'text', placeholder: 'Suspended lights' },
            { key: 'includeTimestamp', label: 'Include timestamp', type: 'checkbox' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const basePayload = QuickActionTools.toText(clone.payload ?? '');
            const style = (config?.style || 'Lantern cascade').trim() || 'Lantern cascade';
            const variations = Math.max(1, parseInt(config?.variations, 10) || 1);
            const lighten = Boolean(config?.lighten);
            const anchor = (config?.anchor || 'Suspended lights').trim() || 'Suspended lights';
            const includeTimestamp = Boolean(config?.includeTimestamp);
            const references = [
                'Lantern cascade action reference shimmer lantern sequence 1',
                'Lantern cascade action reference glyph cascade sequence 2',
                'Lantern cascade action reference ribbon bridge sequence 3',
                'Lantern cascade action reference arc string sequence 4',
                'Lantern cascade action reference petal spark sequence 5',
                'Lantern cascade action reference beam fall sequence 6',
                'Lantern cascade action reference facet golden sequence 7',
                'Lantern cascade action reference chorus gleam sequence 8',
                'Lantern cascade action reference lattice lantern sequence 9',
                'Lantern cascade action reference lyric cascade sequence 10',
                'Lantern cascade action reference shimmer bridge sequence 11',
                'Lantern cascade action reference glyph string sequence 12',
                'Lantern cascade action reference ribbon spark sequence 13',
                'Lantern cascade action reference arc fall sequence 14',
                'Lantern cascade action reference petal golden sequence 15',
                'Lantern cascade action reference beam gleam sequence 16',
                'Lantern cascade action reference facet lantern sequence 17',
                'Lantern cascade action reference chorus cascade sequence 18',
                'Lantern cascade action reference lattice bridge sequence 19',
                'Lantern cascade action reference lyric string sequence 20',
                'Lantern cascade action reference shimmer spark sequence 21',
                'Lantern cascade action reference glyph fall sequence 22',
                'Lantern cascade action reference ribbon golden sequence 23',
                'Lantern cascade action reference arc gleam sequence 24',
                'Lantern cascade action reference petal lantern sequence 25',
            ];
            const palettes = [
                'Lantern cascade action palette amber lantern sequence 1',
                'Lantern cascade action palette azure cascade sequence 2',
                'Lantern cascade action palette violet bridge sequence 3',
                'Lantern cascade action palette scarlet string sequence 4',
                'Lantern cascade action palette emerald spark sequence 5',
                'Lantern cascade action palette indigo fall sequence 6',
                'Lantern cascade action palette cobalt golden sequence 7',
                'Lantern cascade action palette vermilion gleam sequence 8',
                'Lantern cascade action palette sepia lantern sequence 9',
                'Lantern cascade action palette silver cascade sequence 10',
                'Lantern cascade action palette amber bridge sequence 11',
                'Lantern cascade action palette azure string sequence 12',
                'Lantern cascade action palette violet spark sequence 13',
                'Lantern cascade action palette scarlet fall sequence 14',
                'Lantern cascade action palette emerald golden sequence 15',
                'Lantern cascade action palette indigo gleam sequence 16',
                'Lantern cascade action palette cobalt lantern sequence 17',
                'Lantern cascade action palette vermilion cascade sequence 18',
                'Lantern cascade action palette sepia bridge sequence 19',
                'Lantern cascade action palette silver string sequence 20',
                'Lantern cascade action palette amber spark sequence 21',
                'Lantern cascade action palette azure fall sequence 22',
                'Lantern cascade action palette violet golden sequence 23',
                'Lantern cascade action palette scarlet gleam sequence 24',
                'Lantern cascade action palette emerald lantern sequence 25',
            ];
            const pathways = [
                'Lantern cascade action pathway causeway lantern sequence 1',
                'Lantern cascade action pathway stair cascade sequence 2',
                'Lantern cascade action pathway balcony bridge sequence 3',
                'Lantern cascade action pathway bridge string sequence 4',
                'Lantern cascade action pathway promenade spark sequence 5',
                'Lantern cascade action pathway corridor fall sequence 6',
                'Lantern cascade action pathway gate golden sequence 7',
                'Lantern cascade action pathway atrium gleam sequence 8',
                'Lantern cascade action pathway garden lantern sequence 9',
                'Lantern cascade action pathway lantern cascade sequence 10',
                'Lantern cascade action pathway causeway bridge sequence 11',
                'Lantern cascade action pathway stair string sequence 12',
                'Lantern cascade action pathway balcony spark sequence 13',
                'Lantern cascade action pathway bridge fall sequence 14',
                'Lantern cascade action pathway promenade golden sequence 15',
                'Lantern cascade action pathway corridor gleam sequence 16',
                'Lantern cascade action pathway gate lantern sequence 17',
                'Lantern cascade action pathway atrium cascade sequence 18',
                'Lantern cascade action pathway garden bridge sequence 19',
                'Lantern cascade action pathway lantern string sequence 20',
                'Lantern cascade action pathway causeway spark sequence 21',
                'Lantern cascade action pathway stair fall sequence 22',
                'Lantern cascade action pathway balcony golden sequence 23',
                'Lantern cascade action pathway bridge gleam sequence 24',
                'Lantern cascade action pathway promenade lantern sequence 25',
            ];
            const moments = [
                'Lantern cascade action moment moment lantern sequence 1',
                'Lantern cascade action moment glimmer cascade sequence 2',
                'Lantern cascade action moment spark bridge sequence 3',
                'Lantern cascade action moment pulse string sequence 4',
                'Lantern cascade action moment beat spark sequence 5',
                'Lantern cascade action moment echo fall sequence 6',
                'Lantern cascade action moment note golden sequence 7',
                'Lantern cascade action moment breath gleam sequence 8',
                'Lantern cascade action moment pause lantern sequence 9',
                'Lantern cascade action moment crescendo cascade sequence 10',
                'Lantern cascade action moment moment bridge sequence 11',
                'Lantern cascade action moment glimmer string sequence 12',
                'Lantern cascade action moment spark spark sequence 13',
                'Lantern cascade action moment pulse fall sequence 14',
                'Lantern cascade action moment beat golden sequence 15',
                'Lantern cascade action moment echo gleam sequence 16',
                'Lantern cascade action moment note lantern sequence 17',
                'Lantern cascade action moment breath cascade sequence 18',
                'Lantern cascade action moment pause bridge sequence 19',
                'Lantern cascade action moment crescendo string sequence 20',
                'Lantern cascade action moment moment spark sequence 21',
                'Lantern cascade action moment glimmer fall sequence 22',
                'Lantern cascade action moment spark golden sequence 23',
                'Lantern cascade action moment pulse gleam sequence 24',
                'Lantern cascade action moment beat lantern sequence 25',
            ];
            const renderings = [];
            for (let round = 0; round < variations; round++) {
                for (let index = 0; index < references.length; index++) {
                    const reference = references[index];
                    const palette = palettes[(index + round) % palettes.length];
                    const pathway = pathways[(index + round * 2) % pathways.length];
                    const moment = moments[(index + round * 3) % moments.length];
                    const timestamp = includeTimestamp ? ` @${new Date().toISOString()}` : '';
                    renderings.push(`${style} | ${anchor} | ${reference} | ${palette} | ${pathway} | ${moment}${timestamp}`);
                }
            }
            const luminous = [];
            renderings.forEach((entry, index) => {
                const accentuated = lighten ? entry.toUpperCase() : entry;
                luminous.push(`${index + 1} :: ${accentuated}`);
                if (index % 2 === 0) {
                    luminous.push(`bridge ${index + 1} :: ${anchor}`);
                }
                if (index % 5 === 0) {
                    luminous.push(`style ${style} ripple ${index + 1}`);
                }
            });
            const spool = [];
            const spoolSet = new Set();
            luminous.forEach((item) => {
                if (!spoolSet.has(item)) {
                    spool.push(item);
                    spoolSet.add(item);
                }
            });
            const base = basePayload.trim();
            if (base) {
                spool.unshift(`base::${base}`);
            }
            const newlineChar = String.fromCharCode(10);
            const safeKey = 'fantasy_action_lantern_cascade';
            clone.vars[`${safeKey}_style`] = style;
            clone.vars[`${safeKey}_renderCount`] = renderings.length;
            clone.vars[`${safeKey}_anchor`] = anchor;
            clone.payload = spool.join(newlineChar);
            clone.logs.push('Lantern cascade action arranged luminous passages.');
            return [clone];
        }
    },
    {
        id: 'fantasy-action-harmonic-mosaic',
        category: 'action',
        name: 'Harmonic mosaic action',
        description: 'Compose payload echoes into harmonic mosaic panels.',
        icon: 'slack',
        accent: '#22c55e',
        tags: ['action', 'harmonic', 'mosaic', 'fantasy'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { style: 'Harmonic mosaic', variations: 3, lighten: false, anchor: 'Atrium compass', includeTimestamp: false },
        form: [
            { key: 'style', label: 'Style', type: 'text', placeholder: 'Harmonic mosaic' },
            { key: 'variations', label: 'Variations', type: 'number', min: 1, max: 12 },
            { key: 'lighten', label: 'Lighten palette', type: 'checkbox' },
            { key: 'anchor', label: 'Anchor', type: 'text', placeholder: 'Atrium compass' },
            { key: 'includeTimestamp', label: 'Include timestamp', type: 'checkbox' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const basePayload = QuickActionTools.toText(clone.payload ?? '');
            const style = (config?.style || 'Harmonic mosaic').trim() || 'Harmonic mosaic';
            const variations = Math.max(1, parseInt(config?.variations, 10) || 1);
            const lighten = Boolean(config?.lighten);
            const anchor = (config?.anchor || 'Atrium compass').trim() || 'Atrium compass';
            const includeTimestamp = Boolean(config?.includeTimestamp);
            const references = [
                'Harmonic mosaic action reference shimmer harmonic sequence 1',
                'Harmonic mosaic action reference glyph mosaic sequence 2',
                'Harmonic mosaic action reference ribbon tile sequence 3',
                'Harmonic mosaic action reference arc tone sequence 4',
                'Harmonic mosaic action reference petal glass sequence 5',
                'Harmonic mosaic action reference beam color sequence 6',
                'Harmonic mosaic action reference facet shine sequence 7',
                'Harmonic mosaic action reference chorus form sequence 8',
                'Harmonic mosaic action reference lattice harmonic sequence 9',
                'Harmonic mosaic action reference lyric mosaic sequence 10',
                'Harmonic mosaic action reference shimmer tile sequence 11',
                'Harmonic mosaic action reference glyph tone sequence 12',
                'Harmonic mosaic action reference ribbon glass sequence 13',
                'Harmonic mosaic action reference arc color sequence 14',
                'Harmonic mosaic action reference petal shine sequence 15',
                'Harmonic mosaic action reference beam form sequence 16',
                'Harmonic mosaic action reference facet harmonic sequence 17',
                'Harmonic mosaic action reference chorus mosaic sequence 18',
                'Harmonic mosaic action reference lattice tile sequence 19',
                'Harmonic mosaic action reference lyric tone sequence 20',
                'Harmonic mosaic action reference shimmer glass sequence 21',
                'Harmonic mosaic action reference glyph color sequence 22',
                'Harmonic mosaic action reference ribbon shine sequence 23',
                'Harmonic mosaic action reference arc form sequence 24',
                'Harmonic mosaic action reference petal harmonic sequence 25',
            ];
            const palettes = [
                'Harmonic mosaic action palette amber harmonic sequence 1',
                'Harmonic mosaic action palette azure mosaic sequence 2',
                'Harmonic mosaic action palette violet tile sequence 3',
                'Harmonic mosaic action palette scarlet tone sequence 4',
                'Harmonic mosaic action palette emerald glass sequence 5',
                'Harmonic mosaic action palette indigo color sequence 6',
                'Harmonic mosaic action palette cobalt shine sequence 7',
                'Harmonic mosaic action palette vermilion form sequence 8',
                'Harmonic mosaic action palette sepia harmonic sequence 9',
                'Harmonic mosaic action palette silver mosaic sequence 10',
                'Harmonic mosaic action palette amber tile sequence 11',
                'Harmonic mosaic action palette azure tone sequence 12',
                'Harmonic mosaic action palette violet glass sequence 13',
                'Harmonic mosaic action palette scarlet color sequence 14',
                'Harmonic mosaic action palette emerald shine sequence 15',
                'Harmonic mosaic action palette indigo form sequence 16',
                'Harmonic mosaic action palette cobalt harmonic sequence 17',
                'Harmonic mosaic action palette vermilion mosaic sequence 18',
                'Harmonic mosaic action palette sepia tile sequence 19',
                'Harmonic mosaic action palette silver tone sequence 20',
                'Harmonic mosaic action palette amber glass sequence 21',
                'Harmonic mosaic action palette azure color sequence 22',
                'Harmonic mosaic action palette violet shine sequence 23',
                'Harmonic mosaic action palette scarlet form sequence 24',
                'Harmonic mosaic action palette emerald harmonic sequence 25',
            ];
            const pathways = [
                'Harmonic mosaic action pathway causeway harmonic sequence 1',
                'Harmonic mosaic action pathway stair mosaic sequence 2',
                'Harmonic mosaic action pathway balcony tile sequence 3',
                'Harmonic mosaic action pathway bridge tone sequence 4',
                'Harmonic mosaic action pathway promenade glass sequence 5',
                'Harmonic mosaic action pathway corridor color sequence 6',
                'Harmonic mosaic action pathway gate shine sequence 7',
                'Harmonic mosaic action pathway atrium form sequence 8',
                'Harmonic mosaic action pathway garden harmonic sequence 9',
                'Harmonic mosaic action pathway lantern mosaic sequence 10',
                'Harmonic mosaic action pathway causeway tile sequence 11',
                'Harmonic mosaic action pathway stair tone sequence 12',
                'Harmonic mosaic action pathway balcony glass sequence 13',
                'Harmonic mosaic action pathway bridge color sequence 14',
                'Harmonic mosaic action pathway promenade shine sequence 15',
                'Harmonic mosaic action pathway corridor form sequence 16',
                'Harmonic mosaic action pathway gate harmonic sequence 17',
                'Harmonic mosaic action pathway atrium mosaic sequence 18',
                'Harmonic mosaic action pathway garden tile sequence 19',
                'Harmonic mosaic action pathway lantern tone sequence 20',
                'Harmonic mosaic action pathway causeway glass sequence 21',
                'Harmonic mosaic action pathway stair color sequence 22',
                'Harmonic mosaic action pathway balcony shine sequence 23',
                'Harmonic mosaic action pathway bridge form sequence 24',
                'Harmonic mosaic action pathway promenade harmonic sequence 25',
            ];
            const moments = [
                'Harmonic mosaic action moment moment harmonic sequence 1',
                'Harmonic mosaic action moment glimmer mosaic sequence 2',
                'Harmonic mosaic action moment spark tile sequence 3',
                'Harmonic mosaic action moment pulse tone sequence 4',
                'Harmonic mosaic action moment beat glass sequence 5',
                'Harmonic mosaic action moment echo color sequence 6',
                'Harmonic mosaic action moment note shine sequence 7',
                'Harmonic mosaic action moment breath form sequence 8',
                'Harmonic mosaic action moment pause harmonic sequence 9',
                'Harmonic mosaic action moment crescendo mosaic sequence 10',
                'Harmonic mosaic action moment moment tile sequence 11',
                'Harmonic mosaic action moment glimmer tone sequence 12',
                'Harmonic mosaic action moment spark glass sequence 13',
                'Harmonic mosaic action moment pulse color sequence 14',
                'Harmonic mosaic action moment beat shine sequence 15',
                'Harmonic mosaic action moment echo form sequence 16',
                'Harmonic mosaic action moment note harmonic sequence 17',
                'Harmonic mosaic action moment breath mosaic sequence 18',
                'Harmonic mosaic action moment pause tile sequence 19',
                'Harmonic mosaic action moment crescendo tone sequence 20',
                'Harmonic mosaic action moment moment glass sequence 21',
                'Harmonic mosaic action moment glimmer color sequence 22',
                'Harmonic mosaic action moment spark shine sequence 23',
                'Harmonic mosaic action moment pulse form sequence 24',
                'Harmonic mosaic action moment beat harmonic sequence 25',
            ];
            const renderings = [];
            for (let round = 0; round < variations; round++) {
                for (let index = 0; index < references.length; index++) {
                    const reference = references[index];
                    const palette = palettes[(index + round) % palettes.length];
                    const pathway = pathways[(index + round * 2) % pathways.length];
                    const moment = moments[(index + round * 3) % moments.length];
                    const timestamp = includeTimestamp ? ` @${new Date().toISOString()}` : '';
                    renderings.push(`${style} | ${anchor} | ${reference} | ${palette} | ${pathway} | ${moment}${timestamp}`);
                }
            }
            const luminous = [];
            renderings.forEach((entry, index) => {
                const accentuated = lighten ? entry.toUpperCase() : entry;
                luminous.push(`${index + 1} :: ${accentuated}`);
                if (index % 2 === 0) {
                    luminous.push(`bridge ${index + 1} :: ${anchor}`);
                }
                if (index % 5 === 0) {
                    luminous.push(`style ${style} ripple ${index + 1}`);
                }
            });
            const spool = [];
            const spoolSet = new Set();
            luminous.forEach((item) => {
                if (!spoolSet.has(item)) {
                    spool.push(item);
                    spoolSet.add(item);
                }
            });
            const base = basePayload.trim();
            if (base) {
                spool.unshift(`base::${base}`);
            }
            const newlineChar = String.fromCharCode(10);
            const safeKey = 'fantasy_action_harmonic_mosaic';
            clone.vars[`${safeKey}_style`] = style;
            clone.vars[`${safeKey}_renderCount`] = renderings.length;
            clone.vars[`${safeKey}_anchor`] = anchor;
            clone.payload = spool.join(newlineChar);
            clone.logs.push('Harmonic mosaic action arranged luminous passages.');
            return [clone];
        }
    },
    {
        id: 'fantasy-action-ink-ribbon',
        category: 'action',
        name: 'Ink ribbon action',
        description: 'Spool storylines like endless ink ribbons of imagination.',
        icon: 'edit',
        accent: '#f472b6',
        tags: ['action', 'ink', 'ribbon', 'fantasy'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { style: 'Ink ribbon', variations: 3, lighten: false, anchor: 'Scriptorium', includeTimestamp: false },
        form: [
            { key: 'style', label: 'Style', type: 'text', placeholder: 'Ink ribbon' },
            { key: 'variations', label: 'Variations', type: 'number', min: 1, max: 12 },
            { key: 'lighten', label: 'Lighten palette', type: 'checkbox' },
            { key: 'anchor', label: 'Anchor', type: 'text', placeholder: 'Scriptorium' },
            { key: 'includeTimestamp', label: 'Include timestamp', type: 'checkbox' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const basePayload = QuickActionTools.toText(clone.payload ?? '');
            const style = (config?.style || 'Ink ribbon').trim() || 'Ink ribbon';
            const variations = Math.max(1, parseInt(config?.variations, 10) || 1);
            const lighten = Boolean(config?.lighten);
            const anchor = (config?.anchor || 'Scriptorium').trim() || 'Scriptorium';
            const includeTimestamp = Boolean(config?.includeTimestamp);
            const references = [
                'Ink ribbon action reference shimmer ink sequence 1',
                'Ink ribbon action reference glyph ribbon sequence 2',
                'Ink ribbon action reference ribbon script sequence 3',
                'Ink ribbon action reference arc glyph sequence 4',
                'Ink ribbon action reference petal story sequence 5',
                'Ink ribbon action reference beam tale sequence 6',
                'Ink ribbon action reference facet scroll sequence 7',
                'Ink ribbon action reference chorus trace sequence 8',
                'Ink ribbon action reference lattice ink sequence 9',
                'Ink ribbon action reference lyric ribbon sequence 10',
                'Ink ribbon action reference shimmer script sequence 11',
                'Ink ribbon action reference glyph glyph sequence 12',
                'Ink ribbon action reference ribbon story sequence 13',
                'Ink ribbon action reference arc tale sequence 14',
                'Ink ribbon action reference petal scroll sequence 15',
                'Ink ribbon action reference beam trace sequence 16',
                'Ink ribbon action reference facet ink sequence 17',
                'Ink ribbon action reference chorus ribbon sequence 18',
                'Ink ribbon action reference lattice script sequence 19',
                'Ink ribbon action reference lyric glyph sequence 20',
                'Ink ribbon action reference shimmer story sequence 21',
                'Ink ribbon action reference glyph tale sequence 22',
                'Ink ribbon action reference ribbon scroll sequence 23',
                'Ink ribbon action reference arc trace sequence 24',
                'Ink ribbon action reference petal ink sequence 25',
            ];
            const palettes = [
                'Ink ribbon action palette amber ink sequence 1',
                'Ink ribbon action palette azure ribbon sequence 2',
                'Ink ribbon action palette violet script sequence 3',
                'Ink ribbon action palette scarlet glyph sequence 4',
                'Ink ribbon action palette emerald story sequence 5',
                'Ink ribbon action palette indigo tale sequence 6',
                'Ink ribbon action palette cobalt scroll sequence 7',
                'Ink ribbon action palette vermilion trace sequence 8',
                'Ink ribbon action palette sepia ink sequence 9',
                'Ink ribbon action palette silver ribbon sequence 10',
                'Ink ribbon action palette amber script sequence 11',
                'Ink ribbon action palette azure glyph sequence 12',
                'Ink ribbon action palette violet story sequence 13',
                'Ink ribbon action palette scarlet tale sequence 14',
                'Ink ribbon action palette emerald scroll sequence 15',
                'Ink ribbon action palette indigo trace sequence 16',
                'Ink ribbon action palette cobalt ink sequence 17',
                'Ink ribbon action palette vermilion ribbon sequence 18',
                'Ink ribbon action palette sepia script sequence 19',
                'Ink ribbon action palette silver glyph sequence 20',
                'Ink ribbon action palette amber story sequence 21',
                'Ink ribbon action palette azure tale sequence 22',
                'Ink ribbon action palette violet scroll sequence 23',
                'Ink ribbon action palette scarlet trace sequence 24',
                'Ink ribbon action palette emerald ink sequence 25',
            ];
            const pathways = [
                'Ink ribbon action pathway causeway ink sequence 1',
                'Ink ribbon action pathway stair ribbon sequence 2',
                'Ink ribbon action pathway balcony script sequence 3',
                'Ink ribbon action pathway bridge glyph sequence 4',
                'Ink ribbon action pathway promenade story sequence 5',
                'Ink ribbon action pathway corridor tale sequence 6',
                'Ink ribbon action pathway gate scroll sequence 7',
                'Ink ribbon action pathway atrium trace sequence 8',
                'Ink ribbon action pathway garden ink sequence 9',
                'Ink ribbon action pathway lantern ribbon sequence 10',
                'Ink ribbon action pathway causeway script sequence 11',
                'Ink ribbon action pathway stair glyph sequence 12',
                'Ink ribbon action pathway balcony story sequence 13',
                'Ink ribbon action pathway bridge tale sequence 14',
                'Ink ribbon action pathway promenade scroll sequence 15',
                'Ink ribbon action pathway corridor trace sequence 16',
                'Ink ribbon action pathway gate ink sequence 17',
                'Ink ribbon action pathway atrium ribbon sequence 18',
                'Ink ribbon action pathway garden script sequence 19',
                'Ink ribbon action pathway lantern glyph sequence 20',
                'Ink ribbon action pathway causeway story sequence 21',
                'Ink ribbon action pathway stair tale sequence 22',
                'Ink ribbon action pathway balcony scroll sequence 23',
                'Ink ribbon action pathway bridge trace sequence 24',
                'Ink ribbon action pathway promenade ink sequence 25',
            ];
            const moments = [
                'Ink ribbon action moment moment ink sequence 1',
                'Ink ribbon action moment glimmer ribbon sequence 2',
                'Ink ribbon action moment spark script sequence 3',
                'Ink ribbon action moment pulse glyph sequence 4',
                'Ink ribbon action moment beat story sequence 5',
                'Ink ribbon action moment echo tale sequence 6',
                'Ink ribbon action moment note scroll sequence 7',
                'Ink ribbon action moment breath trace sequence 8',
                'Ink ribbon action moment pause ink sequence 9',
                'Ink ribbon action moment crescendo ribbon sequence 10',
                'Ink ribbon action moment moment script sequence 11',
                'Ink ribbon action moment glimmer glyph sequence 12',
                'Ink ribbon action moment spark story sequence 13',
                'Ink ribbon action moment pulse tale sequence 14',
                'Ink ribbon action moment beat scroll sequence 15',
                'Ink ribbon action moment echo trace sequence 16',
                'Ink ribbon action moment note ink sequence 17',
                'Ink ribbon action moment breath ribbon sequence 18',
                'Ink ribbon action moment pause script sequence 19',
                'Ink ribbon action moment crescendo glyph sequence 20',
                'Ink ribbon action moment moment story sequence 21',
                'Ink ribbon action moment glimmer tale sequence 22',
                'Ink ribbon action moment spark scroll sequence 23',
                'Ink ribbon action moment pulse trace sequence 24',
                'Ink ribbon action moment beat ink sequence 25',
            ];
            const renderings = [];
            for (let round = 0; round < variations; round++) {
                for (let index = 0; index < references.length; index++) {
                    const reference = references[index];
                    const palette = palettes[(index + round) % palettes.length];
                    const pathway = pathways[(index + round * 2) % pathways.length];
                    const moment = moments[(index + round * 3) % moments.length];
                    const timestamp = includeTimestamp ? ` @${new Date().toISOString()}` : '';
                    renderings.push(`${style} | ${anchor} | ${reference} | ${palette} | ${pathway} | ${moment}${timestamp}`);
                }
            }
            const luminous = [];
            renderings.forEach((entry, index) => {
                const accentuated = lighten ? entry.toUpperCase() : entry;
                luminous.push(`${index + 1} :: ${accentuated}`);
                if (index % 2 === 0) {
                    luminous.push(`bridge ${index + 1} :: ${anchor}`);
                }
                if (index % 5 === 0) {
                    luminous.push(`style ${style} ripple ${index + 1}`);
                }
            });
            const spool = [];
            const spoolSet = new Set();
            luminous.forEach((item) => {
                if (!spoolSet.has(item)) {
                    spool.push(item);
                    spoolSet.add(item);
                }
            });
            const base = basePayload.trim();
            if (base) {
                spool.unshift(`base::${base}`);
            }
            const newlineChar = String.fromCharCode(10);
            const safeKey = 'fantasy_action_ink_ribbon';
            clone.vars[`${safeKey}_style`] = style;
            clone.vars[`${safeKey}_renderCount`] = renderings.length;
            clone.vars[`${safeKey}_anchor`] = anchor;
            clone.payload = spool.join(newlineChar);
            clone.logs.push('Ink ribbon action arranged luminous passages.');
            return [clone];
        }
    },
    {
        id: 'fantasy-action-celestial-bloom',
        category: 'action',
        name: 'Celestial bloom action',
        description: 'Bloom payload whispers into celestial blossoms of detail.',
        icon: 'aperture',
        accent: '#ec4899',
        tags: ['action', 'celestial', 'bloom', 'fantasy'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { style: 'Celestial bloom', variations: 3, lighten: false, anchor: 'Orbit garden', includeTimestamp: false },
        form: [
            { key: 'style', label: 'Style', type: 'text', placeholder: 'Celestial bloom' },
            { key: 'variations', label: 'Variations', type: 'number', min: 1, max: 12 },
            { key: 'lighten', label: 'Lighten palette', type: 'checkbox' },
            { key: 'anchor', label: 'Anchor', type: 'text', placeholder: 'Orbit garden' },
            { key: 'includeTimestamp', label: 'Include timestamp', type: 'checkbox' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const basePayload = QuickActionTools.toText(clone.payload ?? '');
            const style = (config?.style || 'Celestial bloom').trim() || 'Celestial bloom';
            const variations = Math.max(1, parseInt(config?.variations, 10) || 1);
            const lighten = Boolean(config?.lighten);
            const anchor = (config?.anchor || 'Orbit garden').trim() || 'Orbit garden';
            const includeTimestamp = Boolean(config?.includeTimestamp);
            const references = [
                'Celestial bloom action reference shimmer celestial sequence 1',
                'Celestial bloom action reference glyph bloom sequence 2',
                'Celestial bloom action reference ribbon stellar sequence 3',
                'Celestial bloom action reference arc flower sequence 4',
                'Celestial bloom action reference petal petal sequence 5',
                'Celestial bloom action reference beam galaxy sequence 6',
                'Celestial bloom action reference facet beam sequence 7',
                'Celestial bloom action reference chorus halo sequence 8',
                'Celestial bloom action reference lattice celestial sequence 9',
                'Celestial bloom action reference lyric bloom sequence 10',
                'Celestial bloom action reference shimmer stellar sequence 11',
                'Celestial bloom action reference glyph flower sequence 12',
                'Celestial bloom action reference ribbon petal sequence 13',
                'Celestial bloom action reference arc galaxy sequence 14',
                'Celestial bloom action reference petal beam sequence 15',
                'Celestial bloom action reference beam halo sequence 16',
                'Celestial bloom action reference facet celestial sequence 17',
                'Celestial bloom action reference chorus bloom sequence 18',
                'Celestial bloom action reference lattice stellar sequence 19',
                'Celestial bloom action reference lyric flower sequence 20',
                'Celestial bloom action reference shimmer petal sequence 21',
                'Celestial bloom action reference glyph galaxy sequence 22',
                'Celestial bloom action reference ribbon beam sequence 23',
                'Celestial bloom action reference arc halo sequence 24',
                'Celestial bloom action reference petal celestial sequence 25',
            ];
            const palettes = [
                'Celestial bloom action palette amber celestial sequence 1',
                'Celestial bloom action palette azure bloom sequence 2',
                'Celestial bloom action palette violet stellar sequence 3',
                'Celestial bloom action palette scarlet flower sequence 4',
                'Celestial bloom action palette emerald petal sequence 5',
                'Celestial bloom action palette indigo galaxy sequence 6',
                'Celestial bloom action palette cobalt beam sequence 7',
                'Celestial bloom action palette vermilion halo sequence 8',
                'Celestial bloom action palette sepia celestial sequence 9',
                'Celestial bloom action palette silver bloom sequence 10',
                'Celestial bloom action palette amber stellar sequence 11',
                'Celestial bloom action palette azure flower sequence 12',
                'Celestial bloom action palette violet petal sequence 13',
                'Celestial bloom action palette scarlet galaxy sequence 14',
                'Celestial bloom action palette emerald beam sequence 15',
                'Celestial bloom action palette indigo halo sequence 16',
                'Celestial bloom action palette cobalt celestial sequence 17',
                'Celestial bloom action palette vermilion bloom sequence 18',
                'Celestial bloom action palette sepia stellar sequence 19',
                'Celestial bloom action palette silver flower sequence 20',
                'Celestial bloom action palette amber petal sequence 21',
                'Celestial bloom action palette azure galaxy sequence 22',
                'Celestial bloom action palette violet beam sequence 23',
                'Celestial bloom action palette scarlet halo sequence 24',
                'Celestial bloom action palette emerald celestial sequence 25',
            ];
            const pathways = [
                'Celestial bloom action pathway causeway celestial sequence 1',
                'Celestial bloom action pathway stair bloom sequence 2',
                'Celestial bloom action pathway balcony stellar sequence 3',
                'Celestial bloom action pathway bridge flower sequence 4',
                'Celestial bloom action pathway promenade petal sequence 5',
                'Celestial bloom action pathway corridor galaxy sequence 6',
                'Celestial bloom action pathway gate beam sequence 7',
                'Celestial bloom action pathway atrium halo sequence 8',
                'Celestial bloom action pathway garden celestial sequence 9',
                'Celestial bloom action pathway lantern bloom sequence 10',
                'Celestial bloom action pathway causeway stellar sequence 11',
                'Celestial bloom action pathway stair flower sequence 12',
                'Celestial bloom action pathway balcony petal sequence 13',
                'Celestial bloom action pathway bridge galaxy sequence 14',
                'Celestial bloom action pathway promenade beam sequence 15',
                'Celestial bloom action pathway corridor halo sequence 16',
                'Celestial bloom action pathway gate celestial sequence 17',
                'Celestial bloom action pathway atrium bloom sequence 18',
                'Celestial bloom action pathway garden stellar sequence 19',
                'Celestial bloom action pathway lantern flower sequence 20',
                'Celestial bloom action pathway causeway petal sequence 21',
                'Celestial bloom action pathway stair galaxy sequence 22',
                'Celestial bloom action pathway balcony beam sequence 23',
                'Celestial bloom action pathway bridge halo sequence 24',
                'Celestial bloom action pathway promenade celestial sequence 25',
            ];
            const moments = [
                'Celestial bloom action moment moment celestial sequence 1',
                'Celestial bloom action moment glimmer bloom sequence 2',
                'Celestial bloom action moment spark stellar sequence 3',
                'Celestial bloom action moment pulse flower sequence 4',
                'Celestial bloom action moment beat petal sequence 5',
                'Celestial bloom action moment echo galaxy sequence 6',
                'Celestial bloom action moment note beam sequence 7',
                'Celestial bloom action moment breath halo sequence 8',
                'Celestial bloom action moment pause celestial sequence 9',
                'Celestial bloom action moment crescendo bloom sequence 10',
                'Celestial bloom action moment moment stellar sequence 11',
                'Celestial bloom action moment glimmer flower sequence 12',
                'Celestial bloom action moment spark petal sequence 13',
                'Celestial bloom action moment pulse galaxy sequence 14',
                'Celestial bloom action moment beat beam sequence 15',
                'Celestial bloom action moment echo halo sequence 16',
                'Celestial bloom action moment note celestial sequence 17',
                'Celestial bloom action moment breath bloom sequence 18',
                'Celestial bloom action moment pause stellar sequence 19',
                'Celestial bloom action moment crescendo flower sequence 20',
                'Celestial bloom action moment moment petal sequence 21',
                'Celestial bloom action moment glimmer galaxy sequence 22',
                'Celestial bloom action moment spark beam sequence 23',
                'Celestial bloom action moment pulse halo sequence 24',
                'Celestial bloom action moment beat celestial sequence 25',
            ];
            const renderings = [];
            for (let round = 0; round < variations; round++) {
                for (let index = 0; index < references.length; index++) {
                    const reference = references[index];
                    const palette = palettes[(index + round) % palettes.length];
                    const pathway = pathways[(index + round * 2) % pathways.length];
                    const moment = moments[(index + round * 3) % moments.length];
                    const timestamp = includeTimestamp ? ` @${new Date().toISOString()}` : '';
                    renderings.push(`${style} | ${anchor} | ${reference} | ${palette} | ${pathway} | ${moment}${timestamp}`);
                }
            }
            const luminous = [];
            renderings.forEach((entry, index) => {
                const accentuated = lighten ? entry.toUpperCase() : entry;
                luminous.push(`${index + 1} :: ${accentuated}`);
                if (index % 2 === 0) {
                    luminous.push(`bridge ${index + 1} :: ${anchor}`);
                }
                if (index % 5 === 0) {
                    luminous.push(`style ${style} ripple ${index + 1}`);
                }
            });
            const spool = [];
            const spoolSet = new Set();
            luminous.forEach((item) => {
                if (!spoolSet.has(item)) {
                    spool.push(item);
                    spoolSet.add(item);
                }
            });
            const base = basePayload.trim();
            if (base) {
                spool.unshift(`base::${base}`);
            }
            const newlineChar = String.fromCharCode(10);
            const safeKey = 'fantasy_action_celestial_bloom';
            clone.vars[`${safeKey}_style`] = style;
            clone.vars[`${safeKey}_renderCount`] = renderings.length;
            clone.vars[`${safeKey}_anchor`] = anchor;
            clone.payload = spool.join(newlineChar);
            clone.logs.push('Celestial bloom action arranged luminous passages.');
            return [clone];
        }
    },
    {
        id: 'fantasy-action-sapphire-bridge',
        category: 'action',
        name: 'Sapphire bridge action',
        description: 'Bridge ideas in sapphire arcs over mirrored ponds.',
        icon: 'briefcase',
        accent: '#38bdf8',
        tags: ['action', 'sapphire', 'bridge', 'fantasy'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { style: 'Sapphire bridge', variations: 3, lighten: false, anchor: 'Reflection hall', includeTimestamp: false },
        form: [
            { key: 'style', label: 'Style', type: 'text', placeholder: 'Sapphire bridge' },
            { key: 'variations', label: 'Variations', type: 'number', min: 1, max: 12 },
            { key: 'lighten', label: 'Lighten palette', type: 'checkbox' },
            { key: 'anchor', label: 'Anchor', type: 'text', placeholder: 'Reflection hall' },
            { key: 'includeTimestamp', label: 'Include timestamp', type: 'checkbox' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const basePayload = QuickActionTools.toText(clone.payload ?? '');
            const style = (config?.style || 'Sapphire bridge').trim() || 'Sapphire bridge';
            const variations = Math.max(1, parseInt(config?.variations, 10) || 1);
            const lighten = Boolean(config?.lighten);
            const anchor = (config?.anchor || 'Reflection hall').trim() || 'Reflection hall';
            const includeTimestamp = Boolean(config?.includeTimestamp);
            const references = [
                'Sapphire bridge action reference shimmer sapphire sequence 1',
                'Sapphire bridge action reference glyph bridge sequence 2',
                'Sapphire bridge action reference ribbon arch sequence 3',
                'Sapphire bridge action reference arc reflection sequence 4',
                'Sapphire bridge action reference petal current sequence 5',
                'Sapphire bridge action reference beam span sequence 6',
                'Sapphire bridge action reference facet loop sequence 7',
                'Sapphire bridge action reference chorus gleam sequence 8',
                'Sapphire bridge action reference lattice sapphire sequence 9',
                'Sapphire bridge action reference lyric bridge sequence 10',
                'Sapphire bridge action reference shimmer arch sequence 11',
                'Sapphire bridge action reference glyph reflection sequence 12',
                'Sapphire bridge action reference ribbon current sequence 13',
                'Sapphire bridge action reference arc span sequence 14',
                'Sapphire bridge action reference petal loop sequence 15',
                'Sapphire bridge action reference beam gleam sequence 16',
                'Sapphire bridge action reference facet sapphire sequence 17',
                'Sapphire bridge action reference chorus bridge sequence 18',
                'Sapphire bridge action reference lattice arch sequence 19',
                'Sapphire bridge action reference lyric reflection sequence 20',
                'Sapphire bridge action reference shimmer current sequence 21',
                'Sapphire bridge action reference glyph span sequence 22',
                'Sapphire bridge action reference ribbon loop sequence 23',
                'Sapphire bridge action reference arc gleam sequence 24',
                'Sapphire bridge action reference petal sapphire sequence 25',
            ];
            const palettes = [
                'Sapphire bridge action palette amber sapphire sequence 1',
                'Sapphire bridge action palette azure bridge sequence 2',
                'Sapphire bridge action palette violet arch sequence 3',
                'Sapphire bridge action palette scarlet reflection sequence 4',
                'Sapphire bridge action palette emerald current sequence 5',
                'Sapphire bridge action palette indigo span sequence 6',
                'Sapphire bridge action palette cobalt loop sequence 7',
                'Sapphire bridge action palette vermilion gleam sequence 8',
                'Sapphire bridge action palette sepia sapphire sequence 9',
                'Sapphire bridge action palette silver bridge sequence 10',
                'Sapphire bridge action palette amber arch sequence 11',
                'Sapphire bridge action palette azure reflection sequence 12',
                'Sapphire bridge action palette violet current sequence 13',
                'Sapphire bridge action palette scarlet span sequence 14',
                'Sapphire bridge action palette emerald loop sequence 15',
                'Sapphire bridge action palette indigo gleam sequence 16',
                'Sapphire bridge action palette cobalt sapphire sequence 17',
                'Sapphire bridge action palette vermilion bridge sequence 18',
                'Sapphire bridge action palette sepia arch sequence 19',
                'Sapphire bridge action palette silver reflection sequence 20',
                'Sapphire bridge action palette amber current sequence 21',
                'Sapphire bridge action palette azure span sequence 22',
                'Sapphire bridge action palette violet loop sequence 23',
                'Sapphire bridge action palette scarlet gleam sequence 24',
                'Sapphire bridge action palette emerald sapphire sequence 25',
            ];
            const pathways = [
                'Sapphire bridge action pathway causeway sapphire sequence 1',
                'Sapphire bridge action pathway stair bridge sequence 2',
                'Sapphire bridge action pathway balcony arch sequence 3',
                'Sapphire bridge action pathway bridge reflection sequence 4',
                'Sapphire bridge action pathway promenade current sequence 5',
                'Sapphire bridge action pathway corridor span sequence 6',
                'Sapphire bridge action pathway gate loop sequence 7',
                'Sapphire bridge action pathway atrium gleam sequence 8',
                'Sapphire bridge action pathway garden sapphire sequence 9',
                'Sapphire bridge action pathway lantern bridge sequence 10',
                'Sapphire bridge action pathway causeway arch sequence 11',
                'Sapphire bridge action pathway stair reflection sequence 12',
                'Sapphire bridge action pathway balcony current sequence 13',
                'Sapphire bridge action pathway bridge span sequence 14',
                'Sapphire bridge action pathway promenade loop sequence 15',
                'Sapphire bridge action pathway corridor gleam sequence 16',
                'Sapphire bridge action pathway gate sapphire sequence 17',
                'Sapphire bridge action pathway atrium bridge sequence 18',
                'Sapphire bridge action pathway garden arch sequence 19',
                'Sapphire bridge action pathway lantern reflection sequence 20',
                'Sapphire bridge action pathway causeway current sequence 21',
                'Sapphire bridge action pathway stair span sequence 22',
                'Sapphire bridge action pathway balcony loop sequence 23',
                'Sapphire bridge action pathway bridge gleam sequence 24',
                'Sapphire bridge action pathway promenade sapphire sequence 25',
            ];
            const moments = [
                'Sapphire bridge action moment moment sapphire sequence 1',
                'Sapphire bridge action moment glimmer bridge sequence 2',
                'Sapphire bridge action moment spark arch sequence 3',
                'Sapphire bridge action moment pulse reflection sequence 4',
                'Sapphire bridge action moment beat current sequence 5',
                'Sapphire bridge action moment echo span sequence 6',
                'Sapphire bridge action moment note loop sequence 7',
                'Sapphire bridge action moment breath gleam sequence 8',
                'Sapphire bridge action moment pause sapphire sequence 9',
                'Sapphire bridge action moment crescendo bridge sequence 10',
                'Sapphire bridge action moment moment arch sequence 11',
                'Sapphire bridge action moment glimmer reflection sequence 12',
                'Sapphire bridge action moment spark current sequence 13',
                'Sapphire bridge action moment pulse span sequence 14',
                'Sapphire bridge action moment beat loop sequence 15',
                'Sapphire bridge action moment echo gleam sequence 16',
                'Sapphire bridge action moment note sapphire sequence 17',
                'Sapphire bridge action moment breath bridge sequence 18',
                'Sapphire bridge action moment pause arch sequence 19',
                'Sapphire bridge action moment crescendo reflection sequence 20',
                'Sapphire bridge action moment moment current sequence 21',
                'Sapphire bridge action moment glimmer span sequence 22',
                'Sapphire bridge action moment spark loop sequence 23',
                'Sapphire bridge action moment pulse gleam sequence 24',
                'Sapphire bridge action moment beat sapphire sequence 25',
            ];
            const renderings = [];
            for (let round = 0; round < variations; round++) {
                for (let index = 0; index < references.length; index++) {
                    const reference = references[index];
                    const palette = palettes[(index + round) % palettes.length];
                    const pathway = pathways[(index + round * 2) % pathways.length];
                    const moment = moments[(index + round * 3) % moments.length];
                    const timestamp = includeTimestamp ? ` @${new Date().toISOString()}` : '';
                    renderings.push(`${style} | ${anchor} | ${reference} | ${palette} | ${pathway} | ${moment}${timestamp}`);
                }
            }
            const luminous = [];
            renderings.forEach((entry, index) => {
                const accentuated = lighten ? entry.toUpperCase() : entry;
                luminous.push(`${index + 1} :: ${accentuated}`);
                if (index % 2 === 0) {
                    luminous.push(`bridge ${index + 1} :: ${anchor}`);
                }
                if (index % 5 === 0) {
                    luminous.push(`style ${style} ripple ${index + 1}`);
                }
            });
            const spool = [];
            const spoolSet = new Set();
            luminous.forEach((item) => {
                if (!spoolSet.has(item)) {
                    spool.push(item);
                    spoolSet.add(item);
                }
            });
            const base = basePayload.trim();
            if (base) {
                spool.unshift(`base::${base}`);
            }
            const newlineChar = String.fromCharCode(10);
            const safeKey = 'fantasy_action_sapphire_bridge';
            clone.vars[`${safeKey}_style`] = style;
            clone.vars[`${safeKey}_renderCount`] = renderings.length;
            clone.vars[`${safeKey}_anchor`] = anchor;
            clone.payload = spool.join(newlineChar);
            clone.logs.push('Sapphire bridge action arranged luminous passages.');
            return [clone];
        }
    },
    {
        id: 'fantasy-action-voyager-lattice',
        category: 'action',
        name: 'Voyager lattice action',
        description: 'Arrange data into voyager lattices with nested corridors.',
        icon: 'share-2',
        accent: '#0ea5e9',
        tags: ['action', 'voyager', 'lattice', 'fantasy'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { style: 'Voyager lattice', variations: 3, lighten: false, anchor: 'Navigator atrium', includeTimestamp: false },
        form: [
            { key: 'style', label: 'Style', type: 'text', placeholder: 'Voyager lattice' },
            { key: 'variations', label: 'Variations', type: 'number', min: 1, max: 12 },
            { key: 'lighten', label: 'Lighten palette', type: 'checkbox' },
            { key: 'anchor', label: 'Anchor', type: 'text', placeholder: 'Navigator atrium' },
            { key: 'includeTimestamp', label: 'Include timestamp', type: 'checkbox' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const basePayload = QuickActionTools.toText(clone.payload ?? '');
            const style = (config?.style || 'Voyager lattice').trim() || 'Voyager lattice';
            const variations = Math.max(1, parseInt(config?.variations, 10) || 1);
            const lighten = Boolean(config?.lighten);
            const anchor = (config?.anchor || 'Navigator atrium').trim() || 'Navigator atrium';
            const includeTimestamp = Boolean(config?.includeTimestamp);
            const references = [
                'Voyager lattice action reference shimmer voyager sequence 1',
                'Voyager lattice action reference glyph lattice sequence 2',
                'Voyager lattice action reference ribbon corridor sequence 3',
                'Voyager lattice action reference arc gate sequence 4',
                'Voyager lattice action reference petal trail sequence 5',
                'Voyager lattice action reference beam map sequence 6',
                'Voyager lattice action reference facet node sequence 7',
                'Voyager lattice action reference chorus thread sequence 8',
                'Voyager lattice action reference lattice voyager sequence 9',
                'Voyager lattice action reference lyric lattice sequence 10',
                'Voyager lattice action reference shimmer corridor sequence 11',
                'Voyager lattice action reference glyph gate sequence 12',
                'Voyager lattice action reference ribbon trail sequence 13',
                'Voyager lattice action reference arc map sequence 14',
                'Voyager lattice action reference petal node sequence 15',
                'Voyager lattice action reference beam thread sequence 16',
                'Voyager lattice action reference facet voyager sequence 17',
                'Voyager lattice action reference chorus lattice sequence 18',
                'Voyager lattice action reference lattice corridor sequence 19',
                'Voyager lattice action reference lyric gate sequence 20',
                'Voyager lattice action reference shimmer trail sequence 21',
                'Voyager lattice action reference glyph map sequence 22',
                'Voyager lattice action reference ribbon node sequence 23',
                'Voyager lattice action reference arc thread sequence 24',
                'Voyager lattice action reference petal voyager sequence 25',
            ];
            const palettes = [
                'Voyager lattice action palette amber voyager sequence 1',
                'Voyager lattice action palette azure lattice sequence 2',
                'Voyager lattice action palette violet corridor sequence 3',
                'Voyager lattice action palette scarlet gate sequence 4',
                'Voyager lattice action palette emerald trail sequence 5',
                'Voyager lattice action palette indigo map sequence 6',
                'Voyager lattice action palette cobalt node sequence 7',
                'Voyager lattice action palette vermilion thread sequence 8',
                'Voyager lattice action palette sepia voyager sequence 9',
                'Voyager lattice action palette silver lattice sequence 10',
                'Voyager lattice action palette amber corridor sequence 11',
                'Voyager lattice action palette azure gate sequence 12',
                'Voyager lattice action palette violet trail sequence 13',
                'Voyager lattice action palette scarlet map sequence 14',
                'Voyager lattice action palette emerald node sequence 15',
                'Voyager lattice action palette indigo thread sequence 16',
                'Voyager lattice action palette cobalt voyager sequence 17',
                'Voyager lattice action palette vermilion lattice sequence 18',
                'Voyager lattice action palette sepia corridor sequence 19',
                'Voyager lattice action palette silver gate sequence 20',
                'Voyager lattice action palette amber trail sequence 21',
                'Voyager lattice action palette azure map sequence 22',
                'Voyager lattice action palette violet node sequence 23',
                'Voyager lattice action palette scarlet thread sequence 24',
                'Voyager lattice action palette emerald voyager sequence 25',
            ];
            const pathways = [
                'Voyager lattice action pathway causeway voyager sequence 1',
                'Voyager lattice action pathway stair lattice sequence 2',
                'Voyager lattice action pathway balcony corridor sequence 3',
                'Voyager lattice action pathway bridge gate sequence 4',
                'Voyager lattice action pathway promenade trail sequence 5',
                'Voyager lattice action pathway corridor map sequence 6',
                'Voyager lattice action pathway gate node sequence 7',
                'Voyager lattice action pathway atrium thread sequence 8',
                'Voyager lattice action pathway garden voyager sequence 9',
                'Voyager lattice action pathway lantern lattice sequence 10',
                'Voyager lattice action pathway causeway corridor sequence 11',
                'Voyager lattice action pathway stair gate sequence 12',
                'Voyager lattice action pathway balcony trail sequence 13',
                'Voyager lattice action pathway bridge map sequence 14',
                'Voyager lattice action pathway promenade node sequence 15',
                'Voyager lattice action pathway corridor thread sequence 16',
                'Voyager lattice action pathway gate voyager sequence 17',
                'Voyager lattice action pathway atrium lattice sequence 18',
                'Voyager lattice action pathway garden corridor sequence 19',
                'Voyager lattice action pathway lantern gate sequence 20',
                'Voyager lattice action pathway causeway trail sequence 21',
                'Voyager lattice action pathway stair map sequence 22',
                'Voyager lattice action pathway balcony node sequence 23',
                'Voyager lattice action pathway bridge thread sequence 24',
                'Voyager lattice action pathway promenade voyager sequence 25',
            ];
            const moments = [
                'Voyager lattice action moment moment voyager sequence 1',
                'Voyager lattice action moment glimmer lattice sequence 2',
                'Voyager lattice action moment spark corridor sequence 3',
                'Voyager lattice action moment pulse gate sequence 4',
                'Voyager lattice action moment beat trail sequence 5',
                'Voyager lattice action moment echo map sequence 6',
                'Voyager lattice action moment note node sequence 7',
                'Voyager lattice action moment breath thread sequence 8',
                'Voyager lattice action moment pause voyager sequence 9',
                'Voyager lattice action moment crescendo lattice sequence 10',
                'Voyager lattice action moment moment corridor sequence 11',
                'Voyager lattice action moment glimmer gate sequence 12',
                'Voyager lattice action moment spark trail sequence 13',
                'Voyager lattice action moment pulse map sequence 14',
                'Voyager lattice action moment beat node sequence 15',
                'Voyager lattice action moment echo thread sequence 16',
                'Voyager lattice action moment note voyager sequence 17',
                'Voyager lattice action moment breath lattice sequence 18',
                'Voyager lattice action moment pause corridor sequence 19',
                'Voyager lattice action moment crescendo gate sequence 20',
                'Voyager lattice action moment moment trail sequence 21',
                'Voyager lattice action moment glimmer map sequence 22',
                'Voyager lattice action moment spark node sequence 23',
                'Voyager lattice action moment pulse thread sequence 24',
                'Voyager lattice action moment beat voyager sequence 25',
            ];
            const renderings = [];
            for (let round = 0; round < variations; round++) {
                for (let index = 0; index < references.length; index++) {
                    const reference = references[index];
                    const palette = palettes[(index + round) % palettes.length];
                    const pathway = pathways[(index + round * 2) % pathways.length];
                    const moment = moments[(index + round * 3) % moments.length];
                    const timestamp = includeTimestamp ? ` @${new Date().toISOString()}` : '';
                    renderings.push(`${style} | ${anchor} | ${reference} | ${palette} | ${pathway} | ${moment}${timestamp}`);
                }
            }
            const luminous = [];
            renderings.forEach((entry, index) => {
                const accentuated = lighten ? entry.toUpperCase() : entry;
                luminous.push(`${index + 1} :: ${accentuated}`);
                if (index % 2 === 0) {
                    luminous.push(`bridge ${index + 1} :: ${anchor}`);
                }
                if (index % 5 === 0) {
                    luminous.push(`style ${style} ripple ${index + 1}`);
                }
            });
            const spool = [];
            const spoolSet = new Set();
            luminous.forEach((item) => {
                if (!spoolSet.has(item)) {
                    spool.push(item);
                    spoolSet.add(item);
                }
            });
            const base = basePayload.trim();
            if (base) {
                spool.unshift(`base::${base}`);
            }
            const newlineChar = String.fromCharCode(10);
            const safeKey = 'fantasy_action_voyager_lattice';
            clone.vars[`${safeKey}_style`] = style;
            clone.vars[`${safeKey}_renderCount`] = renderings.length;
            clone.vars[`${safeKey}_anchor`] = anchor;
            clone.payload = spool.join(newlineChar);
            clone.logs.push('Voyager lattice action arranged luminous passages.');
            return [clone];
        }
    },
    {
        id: 'fantasy-action-meridian-scribe',
        category: 'action',
        name: 'Meridian scribe action',
        description: 'Script passages along meridian lines and luminous grids.',
        icon: 'pen-tool',
        accent: '#f59e0b',
        tags: ['action', 'meridian', 'scribe', 'fantasy'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { style: 'Meridian scribe', variations: 3, lighten: false, anchor: 'Longitude table', includeTimestamp: false },
        form: [
            { key: 'style', label: 'Style', type: 'text', placeholder: 'Meridian scribe' },
            { key: 'variations', label: 'Variations', type: 'number', min: 1, max: 12 },
            { key: 'lighten', label: 'Lighten palette', type: 'checkbox' },
            { key: 'anchor', label: 'Anchor', type: 'text', placeholder: 'Longitude table' },
            { key: 'includeTimestamp', label: 'Include timestamp', type: 'checkbox' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const basePayload = QuickActionTools.toText(clone.payload ?? '');
            const style = (config?.style || 'Meridian scribe').trim() || 'Meridian scribe';
            const variations = Math.max(1, parseInt(config?.variations, 10) || 1);
            const lighten = Boolean(config?.lighten);
            const anchor = (config?.anchor || 'Longitude table').trim() || 'Longitude table';
            const includeTimestamp = Boolean(config?.includeTimestamp);
            const references = [
                'Meridian scribe action reference shimmer meridian sequence 1',
                'Meridian scribe action reference glyph scribe sequence 2',
                'Meridian scribe action reference ribbon longitude sequence 3',
                'Meridian scribe action reference arc scribe sequence 4',
                'Meridian scribe action reference petal chart sequence 5',
                'Meridian scribe action reference beam ink sequence 6',
                'Meridian scribe action reference facet plot sequence 7',
                'Meridian scribe action reference chorus trace sequence 8',
                'Meridian scribe action reference lattice meridian sequence 9',
                'Meridian scribe action reference lyric scribe sequence 10',
                'Meridian scribe action reference shimmer longitude sequence 11',
                'Meridian scribe action reference glyph scribe sequence 12',
                'Meridian scribe action reference ribbon chart sequence 13',
                'Meridian scribe action reference arc ink sequence 14',
                'Meridian scribe action reference petal plot sequence 15',
                'Meridian scribe action reference beam trace sequence 16',
                'Meridian scribe action reference facet meridian sequence 17',
                'Meridian scribe action reference chorus scribe sequence 18',
                'Meridian scribe action reference lattice longitude sequence 19',
                'Meridian scribe action reference lyric scribe sequence 20',
                'Meridian scribe action reference shimmer chart sequence 21',
                'Meridian scribe action reference glyph ink sequence 22',
                'Meridian scribe action reference ribbon plot sequence 23',
                'Meridian scribe action reference arc trace sequence 24',
                'Meridian scribe action reference petal meridian sequence 25',
            ];
            const palettes = [
                'Meridian scribe action palette amber meridian sequence 1',
                'Meridian scribe action palette azure scribe sequence 2',
                'Meridian scribe action palette violet longitude sequence 3',
                'Meridian scribe action palette scarlet scribe sequence 4',
                'Meridian scribe action palette emerald chart sequence 5',
                'Meridian scribe action palette indigo ink sequence 6',
                'Meridian scribe action palette cobalt plot sequence 7',
                'Meridian scribe action palette vermilion trace sequence 8',
                'Meridian scribe action palette sepia meridian sequence 9',
                'Meridian scribe action palette silver scribe sequence 10',
                'Meridian scribe action palette amber longitude sequence 11',
                'Meridian scribe action palette azure scribe sequence 12',
                'Meridian scribe action palette violet chart sequence 13',
                'Meridian scribe action palette scarlet ink sequence 14',
                'Meridian scribe action palette emerald plot sequence 15',
                'Meridian scribe action palette indigo trace sequence 16',
                'Meridian scribe action palette cobalt meridian sequence 17',
                'Meridian scribe action palette vermilion scribe sequence 18',
                'Meridian scribe action palette sepia longitude sequence 19',
                'Meridian scribe action palette silver scribe sequence 20',
                'Meridian scribe action palette amber chart sequence 21',
                'Meridian scribe action palette azure ink sequence 22',
                'Meridian scribe action palette violet plot sequence 23',
                'Meridian scribe action palette scarlet trace sequence 24',
                'Meridian scribe action palette emerald meridian sequence 25',
            ];
            const pathways = [
                'Meridian scribe action pathway causeway meridian sequence 1',
                'Meridian scribe action pathway stair scribe sequence 2',
                'Meridian scribe action pathway balcony longitude sequence 3',
                'Meridian scribe action pathway bridge scribe sequence 4',
                'Meridian scribe action pathway promenade chart sequence 5',
                'Meridian scribe action pathway corridor ink sequence 6',
                'Meridian scribe action pathway gate plot sequence 7',
                'Meridian scribe action pathway atrium trace sequence 8',
                'Meridian scribe action pathway garden meridian sequence 9',
                'Meridian scribe action pathway lantern scribe sequence 10',
                'Meridian scribe action pathway causeway longitude sequence 11',
                'Meridian scribe action pathway stair scribe sequence 12',
                'Meridian scribe action pathway balcony chart sequence 13',
                'Meridian scribe action pathway bridge ink sequence 14',
                'Meridian scribe action pathway promenade plot sequence 15',
                'Meridian scribe action pathway corridor trace sequence 16',
                'Meridian scribe action pathway gate meridian sequence 17',
                'Meridian scribe action pathway atrium scribe sequence 18',
                'Meridian scribe action pathway garden longitude sequence 19',
                'Meridian scribe action pathway lantern scribe sequence 20',
                'Meridian scribe action pathway causeway chart sequence 21',
                'Meridian scribe action pathway stair ink sequence 22',
                'Meridian scribe action pathway balcony plot sequence 23',
                'Meridian scribe action pathway bridge trace sequence 24',
                'Meridian scribe action pathway promenade meridian sequence 25',
            ];
            const moments = [
                'Meridian scribe action moment moment meridian sequence 1',
                'Meridian scribe action moment glimmer scribe sequence 2',
                'Meridian scribe action moment spark longitude sequence 3',
                'Meridian scribe action moment pulse scribe sequence 4',
                'Meridian scribe action moment beat chart sequence 5',
                'Meridian scribe action moment echo ink sequence 6',
                'Meridian scribe action moment note plot sequence 7',
                'Meridian scribe action moment breath trace sequence 8',
                'Meridian scribe action moment pause meridian sequence 9',
                'Meridian scribe action moment crescendo scribe sequence 10',
                'Meridian scribe action moment moment longitude sequence 11',
                'Meridian scribe action moment glimmer scribe sequence 12',
                'Meridian scribe action moment spark chart sequence 13',
                'Meridian scribe action moment pulse ink sequence 14',
                'Meridian scribe action moment beat plot sequence 15',
                'Meridian scribe action moment echo trace sequence 16',
                'Meridian scribe action moment note meridian sequence 17',
                'Meridian scribe action moment breath scribe sequence 18',
                'Meridian scribe action moment pause longitude sequence 19',
                'Meridian scribe action moment crescendo scribe sequence 20',
                'Meridian scribe action moment moment chart sequence 21',
                'Meridian scribe action moment glimmer ink sequence 22',
                'Meridian scribe action moment spark plot sequence 23',
                'Meridian scribe action moment pulse trace sequence 24',
                'Meridian scribe action moment beat meridian sequence 25',
            ];
            const renderings = [];
            for (let round = 0; round < variations; round++) {
                for (let index = 0; index < references.length; index++) {
                    const reference = references[index];
                    const palette = palettes[(index + round) % palettes.length];
                    const pathway = pathways[(index + round * 2) % pathways.length];
                    const moment = moments[(index + round * 3) % moments.length];
                    const timestamp = includeTimestamp ? ` @${new Date().toISOString()}` : '';
                    renderings.push(`${style} | ${anchor} | ${reference} | ${palette} | ${pathway} | ${moment}${timestamp}`);
                }
            }
            const luminous = [];
            renderings.forEach((entry, index) => {
                const accentuated = lighten ? entry.toUpperCase() : entry;
                luminous.push(`${index + 1} :: ${accentuated}`);
                if (index % 2 === 0) {
                    luminous.push(`bridge ${index + 1} :: ${anchor}`);
                }
                if (index % 5 === 0) {
                    luminous.push(`style ${style} ripple ${index + 1}`);
                }
            });
            const spool = [];
            const spoolSet = new Set();
            luminous.forEach((item) => {
                if (!spoolSet.has(item)) {
                    spool.push(item);
                    spoolSet.add(item);
                }
            });
            const base = basePayload.trim();
            if (base) {
                spool.unshift(`base::${base}`);
            }
            const newlineChar = String.fromCharCode(10);
            const safeKey = 'fantasy_action_meridian_scribe';
            clone.vars[`${safeKey}_style`] = style;
            clone.vars[`${safeKey}_renderCount`] = renderings.length;
            clone.vars[`${safeKey}_anchor`] = anchor;
            clone.payload = spool.join(newlineChar);
            clone.logs.push('Meridian scribe action arranged luminous passages.');
            return [clone];
        }
    },
    {
        id: 'fantasy-action-orchid-weave',
        category: 'action',
        name: 'Orchid weave action',
        description: 'Weave payload into orchid tapestries of shimmering logic.',
        icon: 'wind',
        accent: '#10b981',
        tags: ['action', 'orchid', 'weave', 'fantasy'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { style: 'Orchid weave', variations: 3, lighten: false, anchor: 'Botanical loom', includeTimestamp: false },
        form: [
            { key: 'style', label: 'Style', type: 'text', placeholder: 'Orchid weave' },
            { key: 'variations', label: 'Variations', type: 'number', min: 1, max: 12 },
            { key: 'lighten', label: 'Lighten palette', type: 'checkbox' },
            { key: 'anchor', label: 'Anchor', type: 'text', placeholder: 'Botanical loom' },
            { key: 'includeTimestamp', label: 'Include timestamp', type: 'checkbox' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const basePayload = QuickActionTools.toText(clone.payload ?? '');
            const style = (config?.style || 'Orchid weave').trim() || 'Orchid weave';
            const variations = Math.max(1, parseInt(config?.variations, 10) || 1);
            const lighten = Boolean(config?.lighten);
            const anchor = (config?.anchor || 'Botanical loom').trim() || 'Botanical loom';
            const includeTimestamp = Boolean(config?.includeTimestamp);
            const references = [
                'Orchid weave action reference shimmer orchid sequence 1',
                'Orchid weave action reference glyph weave sequence 2',
                'Orchid weave action reference ribbon vine sequence 3',
                'Orchid weave action reference arc petal sequence 4',
                'Orchid weave action reference petal lace sequence 5',
                'Orchid weave action reference beam garden sequence 6',
                'Orchid weave action reference facet pattern sequence 7',
                'Orchid weave action reference chorus stem sequence 8',
                'Orchid weave action reference lattice orchid sequence 9',
                'Orchid weave action reference lyric weave sequence 10',
                'Orchid weave action reference shimmer vine sequence 11',
                'Orchid weave action reference glyph petal sequence 12',
                'Orchid weave action reference ribbon lace sequence 13',
                'Orchid weave action reference arc garden sequence 14',
                'Orchid weave action reference petal pattern sequence 15',
                'Orchid weave action reference beam stem sequence 16',
                'Orchid weave action reference facet orchid sequence 17',
                'Orchid weave action reference chorus weave sequence 18',
                'Orchid weave action reference lattice vine sequence 19',
                'Orchid weave action reference lyric petal sequence 20',
                'Orchid weave action reference shimmer lace sequence 21',
                'Orchid weave action reference glyph garden sequence 22',
                'Orchid weave action reference ribbon pattern sequence 23',
                'Orchid weave action reference arc stem sequence 24',
                'Orchid weave action reference petal orchid sequence 25',
            ];
            const palettes = [
                'Orchid weave action palette amber orchid sequence 1',
                'Orchid weave action palette azure weave sequence 2',
                'Orchid weave action palette violet vine sequence 3',
                'Orchid weave action palette scarlet petal sequence 4',
                'Orchid weave action palette emerald lace sequence 5',
                'Orchid weave action palette indigo garden sequence 6',
                'Orchid weave action palette cobalt pattern sequence 7',
                'Orchid weave action palette vermilion stem sequence 8',
                'Orchid weave action palette sepia orchid sequence 9',
                'Orchid weave action palette silver weave sequence 10',
                'Orchid weave action palette amber vine sequence 11',
                'Orchid weave action palette azure petal sequence 12',
                'Orchid weave action palette violet lace sequence 13',
                'Orchid weave action palette scarlet garden sequence 14',
                'Orchid weave action palette emerald pattern sequence 15',
                'Orchid weave action palette indigo stem sequence 16',
                'Orchid weave action palette cobalt orchid sequence 17',
                'Orchid weave action palette vermilion weave sequence 18',
                'Orchid weave action palette sepia vine sequence 19',
                'Orchid weave action palette silver petal sequence 20',
                'Orchid weave action palette amber lace sequence 21',
                'Orchid weave action palette azure garden sequence 22',
                'Orchid weave action palette violet pattern sequence 23',
                'Orchid weave action palette scarlet stem sequence 24',
                'Orchid weave action palette emerald orchid sequence 25',
            ];
            const pathways = [
                'Orchid weave action pathway causeway orchid sequence 1',
                'Orchid weave action pathway stair weave sequence 2',
                'Orchid weave action pathway balcony vine sequence 3',
                'Orchid weave action pathway bridge petal sequence 4',
                'Orchid weave action pathway promenade lace sequence 5',
                'Orchid weave action pathway corridor garden sequence 6',
                'Orchid weave action pathway gate pattern sequence 7',
                'Orchid weave action pathway atrium stem sequence 8',
                'Orchid weave action pathway garden orchid sequence 9',
                'Orchid weave action pathway lantern weave sequence 10',
                'Orchid weave action pathway causeway vine sequence 11',
                'Orchid weave action pathway stair petal sequence 12',
                'Orchid weave action pathway balcony lace sequence 13',
                'Orchid weave action pathway bridge garden sequence 14',
                'Orchid weave action pathway promenade pattern sequence 15',
                'Orchid weave action pathway corridor stem sequence 16',
                'Orchid weave action pathway gate orchid sequence 17',
                'Orchid weave action pathway atrium weave sequence 18',
                'Orchid weave action pathway garden vine sequence 19',
                'Orchid weave action pathway lantern petal sequence 20',
                'Orchid weave action pathway causeway lace sequence 21',
                'Orchid weave action pathway stair garden sequence 22',
                'Orchid weave action pathway balcony pattern sequence 23',
                'Orchid weave action pathway bridge stem sequence 24',
                'Orchid weave action pathway promenade orchid sequence 25',
            ];
            const moments = [
                'Orchid weave action moment moment orchid sequence 1',
                'Orchid weave action moment glimmer weave sequence 2',
                'Orchid weave action moment spark vine sequence 3',
                'Orchid weave action moment pulse petal sequence 4',
                'Orchid weave action moment beat lace sequence 5',
                'Orchid weave action moment echo garden sequence 6',
                'Orchid weave action moment note pattern sequence 7',
                'Orchid weave action moment breath stem sequence 8',
                'Orchid weave action moment pause orchid sequence 9',
                'Orchid weave action moment crescendo weave sequence 10',
                'Orchid weave action moment moment vine sequence 11',
                'Orchid weave action moment glimmer petal sequence 12',
                'Orchid weave action moment spark lace sequence 13',
                'Orchid weave action moment pulse garden sequence 14',
                'Orchid weave action moment beat pattern sequence 15',
                'Orchid weave action moment echo stem sequence 16',
                'Orchid weave action moment note orchid sequence 17',
                'Orchid weave action moment breath weave sequence 18',
                'Orchid weave action moment pause vine sequence 19',
                'Orchid weave action moment crescendo petal sequence 20',
                'Orchid weave action moment moment lace sequence 21',
                'Orchid weave action moment glimmer garden sequence 22',
                'Orchid weave action moment spark pattern sequence 23',
                'Orchid weave action moment pulse stem sequence 24',
                'Orchid weave action moment beat orchid sequence 25',
            ];
            const renderings = [];
            for (let round = 0; round < variations; round++) {
                for (let index = 0; index < references.length; index++) {
                    const reference = references[index];
                    const palette = palettes[(index + round) % palettes.length];
                    const pathway = pathways[(index + round * 2) % pathways.length];
                    const moment = moments[(index + round * 3) % moments.length];
                    const timestamp = includeTimestamp ? ` @${new Date().toISOString()}` : '';
                    renderings.push(`${style} | ${anchor} | ${reference} | ${palette} | ${pathway} | ${moment}${timestamp}`);
                }
            }
            const luminous = [];
            renderings.forEach((entry, index) => {
                const accentuated = lighten ? entry.toUpperCase() : entry;
                luminous.push(`${index + 1} :: ${accentuated}`);
                if (index % 2 === 0) {
                    luminous.push(`bridge ${index + 1} :: ${anchor}`);
                }
                if (index % 5 === 0) {
                    luminous.push(`style ${style} ripple ${index + 1}`);
                }
            });
            const spool = [];
            const spoolSet = new Set();
            luminous.forEach((item) => {
                if (!spoolSet.has(item)) {
                    spool.push(item);
                    spoolSet.add(item);
                }
            });
            const base = basePayload.trim();
            if (base) {
                spool.unshift(`base::${base}`);
            }
            const newlineChar = String.fromCharCode(10);
            const safeKey = 'fantasy_action_orchid_weave';
            clone.vars[`${safeKey}_style`] = style;
            clone.vars[`${safeKey}_renderCount`] = renderings.length;
            clone.vars[`${safeKey}_anchor`] = anchor;
            clone.payload = spool.join(newlineChar);
            clone.logs.push('Orchid weave action arranged luminous passages.');
            return [clone];
        }
    },
    {
        id: 'fantasy-action-cinder-parade',
        category: 'action',
        name: 'Cinder parade action',
        description: 'Parade vibrant cinders through structured story boulevards.',
        icon: 'sun',
        accent: '#fb7185',
        tags: ['action', 'cinder', 'parade', 'fantasy'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { style: 'Cinder parade', variations: 3, lighten: false, anchor: 'Festival lane', includeTimestamp: false },
        form: [
            { key: 'style', label: 'Style', type: 'text', placeholder: 'Cinder parade' },
            { key: 'variations', label: 'Variations', type: 'number', min: 1, max: 12 },
            { key: 'lighten', label: 'Lighten palette', type: 'checkbox' },
            { key: 'anchor', label: 'Anchor', type: 'text', placeholder: 'Festival lane' },
            { key: 'includeTimestamp', label: 'Include timestamp', type: 'checkbox' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const basePayload = QuickActionTools.toText(clone.payload ?? '');
            const style = (config?.style || 'Cinder parade').trim() || 'Cinder parade';
            const variations = Math.max(1, parseInt(config?.variations, 10) || 1);
            const lighten = Boolean(config?.lighten);
            const anchor = (config?.anchor || 'Festival lane').trim() || 'Festival lane';
            const includeTimestamp = Boolean(config?.includeTimestamp);
            const references = [
                'Cinder parade action reference shimmer cinder sequence 1',
                'Cinder parade action reference glyph parade sequence 2',
                'Cinder parade action reference ribbon boulevard sequence 3',
                'Cinder parade action reference arc march sequence 4',
                'Cinder parade action reference petal flare sequence 5',
                'Cinder parade action reference beam spark sequence 6',
                'Cinder parade action reference facet celebrate sequence 7',
                'Cinder parade action reference chorus banner sequence 8',
                'Cinder parade action reference lattice cinder sequence 9',
                'Cinder parade action reference lyric parade sequence 10',
                'Cinder parade action reference shimmer boulevard sequence 11',
                'Cinder parade action reference glyph march sequence 12',
                'Cinder parade action reference ribbon flare sequence 13',
                'Cinder parade action reference arc spark sequence 14',
                'Cinder parade action reference petal celebrate sequence 15',
                'Cinder parade action reference beam banner sequence 16',
                'Cinder parade action reference facet cinder sequence 17',
                'Cinder parade action reference chorus parade sequence 18',
                'Cinder parade action reference lattice boulevard sequence 19',
                'Cinder parade action reference lyric march sequence 20',
                'Cinder parade action reference shimmer flare sequence 21',
                'Cinder parade action reference glyph spark sequence 22',
                'Cinder parade action reference ribbon celebrate sequence 23',
                'Cinder parade action reference arc banner sequence 24',
                'Cinder parade action reference petal cinder sequence 25',
            ];
            const palettes = [
                'Cinder parade action palette amber cinder sequence 1',
                'Cinder parade action palette azure parade sequence 2',
                'Cinder parade action palette violet boulevard sequence 3',
                'Cinder parade action palette scarlet march sequence 4',
                'Cinder parade action palette emerald flare sequence 5',
                'Cinder parade action palette indigo spark sequence 6',
                'Cinder parade action palette cobalt celebrate sequence 7',
                'Cinder parade action palette vermilion banner sequence 8',
                'Cinder parade action palette sepia cinder sequence 9',
                'Cinder parade action palette silver parade sequence 10',
                'Cinder parade action palette amber boulevard sequence 11',
                'Cinder parade action palette azure march sequence 12',
                'Cinder parade action palette violet flare sequence 13',
                'Cinder parade action palette scarlet spark sequence 14',
                'Cinder parade action palette emerald celebrate sequence 15',
                'Cinder parade action palette indigo banner sequence 16',
                'Cinder parade action palette cobalt cinder sequence 17',
                'Cinder parade action palette vermilion parade sequence 18',
                'Cinder parade action palette sepia boulevard sequence 19',
                'Cinder parade action palette silver march sequence 20',
                'Cinder parade action palette amber flare sequence 21',
                'Cinder parade action palette azure spark sequence 22',
                'Cinder parade action palette violet celebrate sequence 23',
                'Cinder parade action palette scarlet banner sequence 24',
                'Cinder parade action palette emerald cinder sequence 25',
            ];
            const pathways = [
                'Cinder parade action pathway causeway cinder sequence 1',
                'Cinder parade action pathway stair parade sequence 2',
                'Cinder parade action pathway balcony boulevard sequence 3',
                'Cinder parade action pathway bridge march sequence 4',
                'Cinder parade action pathway promenade flare sequence 5',
                'Cinder parade action pathway corridor spark sequence 6',
                'Cinder parade action pathway gate celebrate sequence 7',
                'Cinder parade action pathway atrium banner sequence 8',
                'Cinder parade action pathway garden cinder sequence 9',
                'Cinder parade action pathway lantern parade sequence 10',
                'Cinder parade action pathway causeway boulevard sequence 11',
                'Cinder parade action pathway stair march sequence 12',
                'Cinder parade action pathway balcony flare sequence 13',
                'Cinder parade action pathway bridge spark sequence 14',
                'Cinder parade action pathway promenade celebrate sequence 15',
                'Cinder parade action pathway corridor banner sequence 16',
                'Cinder parade action pathway gate cinder sequence 17',
                'Cinder parade action pathway atrium parade sequence 18',
                'Cinder parade action pathway garden boulevard sequence 19',
                'Cinder parade action pathway lantern march sequence 20',
                'Cinder parade action pathway causeway flare sequence 21',
                'Cinder parade action pathway stair spark sequence 22',
                'Cinder parade action pathway balcony celebrate sequence 23',
                'Cinder parade action pathway bridge banner sequence 24',
                'Cinder parade action pathway promenade cinder sequence 25',
            ];
            const moments = [
                'Cinder parade action moment moment cinder sequence 1',
                'Cinder parade action moment glimmer parade sequence 2',
                'Cinder parade action moment spark boulevard sequence 3',
                'Cinder parade action moment pulse march sequence 4',
                'Cinder parade action moment beat flare sequence 5',
                'Cinder parade action moment echo spark sequence 6',
                'Cinder parade action moment note celebrate sequence 7',
                'Cinder parade action moment breath banner sequence 8',
                'Cinder parade action moment pause cinder sequence 9',
                'Cinder parade action moment crescendo parade sequence 10',
                'Cinder parade action moment moment boulevard sequence 11',
                'Cinder parade action moment glimmer march sequence 12',
                'Cinder parade action moment spark flare sequence 13',
                'Cinder parade action moment pulse spark sequence 14',
                'Cinder parade action moment beat celebrate sequence 15',
                'Cinder parade action moment echo banner sequence 16',
                'Cinder parade action moment note cinder sequence 17',
                'Cinder parade action moment breath parade sequence 18',
                'Cinder parade action moment pause boulevard sequence 19',
                'Cinder parade action moment crescendo march sequence 20',
                'Cinder parade action moment moment flare sequence 21',
                'Cinder parade action moment glimmer spark sequence 22',
                'Cinder parade action moment spark celebrate sequence 23',
                'Cinder parade action moment pulse banner sequence 24',
                'Cinder parade action moment beat cinder sequence 25',
            ];
            const renderings = [];
            for (let round = 0; round < variations; round++) {
                for (let index = 0; index < references.length; index++) {
                    const reference = references[index];
                    const palette = palettes[(index + round) % palettes.length];
                    const pathway = pathways[(index + round * 2) % pathways.length];
                    const moment = moments[(index + round * 3) % moments.length];
                    const timestamp = includeTimestamp ? ` @${new Date().toISOString()}` : '';
                    renderings.push(`${style} | ${anchor} | ${reference} | ${palette} | ${pathway} | ${moment}${timestamp}`);
                }
            }
            const luminous = [];
            renderings.forEach((entry, index) => {
                const accentuated = lighten ? entry.toUpperCase() : entry;
                luminous.push(`${index + 1} :: ${accentuated}`);
                if (index % 2 === 0) {
                    luminous.push(`bridge ${index + 1} :: ${anchor}`);
                }
                if (index % 5 === 0) {
                    luminous.push(`style ${style} ripple ${index + 1}`);
                }
            });
            const spool = [];
            const spoolSet = new Set();
            luminous.forEach((item) => {
                if (!spoolSet.has(item)) {
                    spool.push(item);
                    spoolSet.add(item);
                }
            });
            const base = basePayload.trim();
            if (base) {
                spool.unshift(`base::${base}`);
            }
            const newlineChar = String.fromCharCode(10);
            const safeKey = 'fantasy_action_cinder_parade';
            clone.vars[`${safeKey}_style`] = style;
            clone.vars[`${safeKey}_renderCount`] = renderings.length;
            clone.vars[`${safeKey}_anchor`] = anchor;
            clone.payload = spool.join(newlineChar);
            clone.logs.push('Cinder parade action arranged luminous passages.');
            return [clone];
        }
    },
    {
        id: 'fantasy-action-skyline-echo',
        category: 'action',
        name: 'Skyline echo action',
        description: 'Reshape payload to echo skylines and mirrored rooftops.',
        icon: 'sunrise',
        accent: '#3b82f6',
        tags: ['action', 'skyline', 'echo', 'fantasy'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { style: 'Skyline echo', variations: 3, lighten: false, anchor: 'City observatory', includeTimestamp: false },
        form: [
            { key: 'style', label: 'Style', type: 'text', placeholder: 'Skyline echo' },
            { key: 'variations', label: 'Variations', type: 'number', min: 1, max: 12 },
            { key: 'lighten', label: 'Lighten palette', type: 'checkbox' },
            { key: 'anchor', label: 'Anchor', type: 'text', placeholder: 'City observatory' },
            { key: 'includeTimestamp', label: 'Include timestamp', type: 'checkbox' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const basePayload = QuickActionTools.toText(clone.payload ?? '');
            const style = (config?.style || 'Skyline echo').trim() || 'Skyline echo';
            const variations = Math.max(1, parseInt(config?.variations, 10) || 1);
            const lighten = Boolean(config?.lighten);
            const anchor = (config?.anchor || 'City observatory').trim() || 'City observatory';
            const includeTimestamp = Boolean(config?.includeTimestamp);
            const references = [
                'Skyline echo action reference shimmer skyline sequence 1',
                'Skyline echo action reference glyph echo sequence 2',
                'Skyline echo action reference ribbon tower sequence 3',
                'Skyline echo action reference arc glass sequence 4',
                'Skyline echo action reference petal ridge sequence 5',
                'Skyline echo action reference beam cloud sequence 6',
                'Skyline echo action reference facet horizon sequence 7',
                'Skyline echo action reference chorus spire sequence 8',
                'Skyline echo action reference lattice skyline sequence 9',
                'Skyline echo action reference lyric echo sequence 10',
                'Skyline echo action reference shimmer tower sequence 11',
                'Skyline echo action reference glyph glass sequence 12',
                'Skyline echo action reference ribbon ridge sequence 13',
                'Skyline echo action reference arc cloud sequence 14',
                'Skyline echo action reference petal horizon sequence 15',
                'Skyline echo action reference beam spire sequence 16',
                'Skyline echo action reference facet skyline sequence 17',
                'Skyline echo action reference chorus echo sequence 18',
                'Skyline echo action reference lattice tower sequence 19',
                'Skyline echo action reference lyric glass sequence 20',
                'Skyline echo action reference shimmer ridge sequence 21',
                'Skyline echo action reference glyph cloud sequence 22',
                'Skyline echo action reference ribbon horizon sequence 23',
                'Skyline echo action reference arc spire sequence 24',
                'Skyline echo action reference petal skyline sequence 25',
            ];
            const palettes = [
                'Skyline echo action palette amber skyline sequence 1',
                'Skyline echo action palette azure echo sequence 2',
                'Skyline echo action palette violet tower sequence 3',
                'Skyline echo action palette scarlet glass sequence 4',
                'Skyline echo action palette emerald ridge sequence 5',
                'Skyline echo action palette indigo cloud sequence 6',
                'Skyline echo action palette cobalt horizon sequence 7',
                'Skyline echo action palette vermilion spire sequence 8',
                'Skyline echo action palette sepia skyline sequence 9',
                'Skyline echo action palette silver echo sequence 10',
                'Skyline echo action palette amber tower sequence 11',
                'Skyline echo action palette azure glass sequence 12',
                'Skyline echo action palette violet ridge sequence 13',
                'Skyline echo action palette scarlet cloud sequence 14',
                'Skyline echo action palette emerald horizon sequence 15',
                'Skyline echo action palette indigo spire sequence 16',
                'Skyline echo action palette cobalt skyline sequence 17',
                'Skyline echo action palette vermilion echo sequence 18',
                'Skyline echo action palette sepia tower sequence 19',
                'Skyline echo action palette silver glass sequence 20',
                'Skyline echo action palette amber ridge sequence 21',
                'Skyline echo action palette azure cloud sequence 22',
                'Skyline echo action palette violet horizon sequence 23',
                'Skyline echo action palette scarlet spire sequence 24',
                'Skyline echo action palette emerald skyline sequence 25',
            ];
            const pathways = [
                'Skyline echo action pathway causeway skyline sequence 1',
                'Skyline echo action pathway stair echo sequence 2',
                'Skyline echo action pathway balcony tower sequence 3',
                'Skyline echo action pathway bridge glass sequence 4',
                'Skyline echo action pathway promenade ridge sequence 5',
                'Skyline echo action pathway corridor cloud sequence 6',
                'Skyline echo action pathway gate horizon sequence 7',
                'Skyline echo action pathway atrium spire sequence 8',
                'Skyline echo action pathway garden skyline sequence 9',
                'Skyline echo action pathway lantern echo sequence 10',
                'Skyline echo action pathway causeway tower sequence 11',
                'Skyline echo action pathway stair glass sequence 12',
                'Skyline echo action pathway balcony ridge sequence 13',
                'Skyline echo action pathway bridge cloud sequence 14',
                'Skyline echo action pathway promenade horizon sequence 15',
                'Skyline echo action pathway corridor spire sequence 16',
                'Skyline echo action pathway gate skyline sequence 17',
                'Skyline echo action pathway atrium echo sequence 18',
                'Skyline echo action pathway garden tower sequence 19',
                'Skyline echo action pathway lantern glass sequence 20',
                'Skyline echo action pathway causeway ridge sequence 21',
                'Skyline echo action pathway stair cloud sequence 22',
                'Skyline echo action pathway balcony horizon sequence 23',
                'Skyline echo action pathway bridge spire sequence 24',
                'Skyline echo action pathway promenade skyline sequence 25',
            ];
            const moments = [
                'Skyline echo action moment moment skyline sequence 1',
                'Skyline echo action moment glimmer echo sequence 2',
                'Skyline echo action moment spark tower sequence 3',
                'Skyline echo action moment pulse glass sequence 4',
                'Skyline echo action moment beat ridge sequence 5',
                'Skyline echo action moment echo cloud sequence 6',
                'Skyline echo action moment note horizon sequence 7',
                'Skyline echo action moment breath spire sequence 8',
                'Skyline echo action moment pause skyline sequence 9',
                'Skyline echo action moment crescendo echo sequence 10',
                'Skyline echo action moment moment tower sequence 11',
                'Skyline echo action moment glimmer glass sequence 12',
                'Skyline echo action moment spark ridge sequence 13',
                'Skyline echo action moment pulse cloud sequence 14',
                'Skyline echo action moment beat horizon sequence 15',
                'Skyline echo action moment echo spire sequence 16',
                'Skyline echo action moment note skyline sequence 17',
                'Skyline echo action moment breath echo sequence 18',
                'Skyline echo action moment pause tower sequence 19',
                'Skyline echo action moment crescendo glass sequence 20',
                'Skyline echo action moment moment ridge sequence 21',
                'Skyline echo action moment glimmer cloud sequence 22',
                'Skyline echo action moment spark horizon sequence 23',
                'Skyline echo action moment pulse spire sequence 24',
                'Skyline echo action moment beat skyline sequence 25',
            ];
            const renderings = [];
            for (let round = 0; round < variations; round++) {
                for (let index = 0; index < references.length; index++) {
                    const reference = references[index];
                    const palette = palettes[(index + round) % palettes.length];
                    const pathway = pathways[(index + round * 2) % pathways.length];
                    const moment = moments[(index + round * 3) % moments.length];
                    const timestamp = includeTimestamp ? ` @${new Date().toISOString()}` : '';
                    renderings.push(`${style} | ${anchor} | ${reference} | ${palette} | ${pathway} | ${moment}${timestamp}`);
                }
            }
            const luminous = [];
            renderings.forEach((entry, index) => {
                const accentuated = lighten ? entry.toUpperCase() : entry;
                luminous.push(`${index + 1} :: ${accentuated}`);
                if (index % 2 === 0) {
                    luminous.push(`bridge ${index + 1} :: ${anchor}`);
                }
                if (index % 5 === 0) {
                    luminous.push(`style ${style} ripple ${index + 1}`);
                }
            });
            const spool = [];
            const spoolSet = new Set();
            luminous.forEach((item) => {
                if (!spoolSet.has(item)) {
                    spool.push(item);
                    spoolSet.add(item);
                }
            });
            const base = basePayload.trim();
            if (base) {
                spool.unshift(`base::${base}`);
            }
            const newlineChar = String.fromCharCode(10);
            const safeKey = 'fantasy_action_skyline_echo';
            clone.vars[`${safeKey}_style`] = style;
            clone.vars[`${safeKey}_renderCount`] = renderings.length;
            clone.vars[`${safeKey}_anchor`] = anchor;
            clone.payload = spool.join(newlineChar);
            clone.logs.push('Skyline echo action arranged luminous passages.');
            return [clone];
        }
    },
    {
        id: 'fantasy-action-ember-story',
        category: 'action',
        name: 'Ember story action',
        description: 'Grow ember stories into layered narrative lanterns.',
        icon: 'book-open',
        accent: '#f87171',
        tags: ['action', 'ember', 'story', 'fantasy'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { style: 'Ember story', variations: 3, lighten: false, anchor: 'Story hearth', includeTimestamp: false },
        form: [
            { key: 'style', label: 'Style', type: 'text', placeholder: 'Ember story' },
            { key: 'variations', label: 'Variations', type: 'number', min: 1, max: 12 },
            { key: 'lighten', label: 'Lighten palette', type: 'checkbox' },
            { key: 'anchor', label: 'Anchor', type: 'text', placeholder: 'Story hearth' },
            { key: 'includeTimestamp', label: 'Include timestamp', type: 'checkbox' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const basePayload = QuickActionTools.toText(clone.payload ?? '');
            const style = (config?.style || 'Ember story').trim() || 'Ember story';
            const variations = Math.max(1, parseInt(config?.variations, 10) || 1);
            const lighten = Boolean(config?.lighten);
            const anchor = (config?.anchor || 'Story hearth').trim() || 'Story hearth';
            const includeTimestamp = Boolean(config?.includeTimestamp);
            const references = [
                'Ember story action reference shimmer ember sequence 1',
                'Ember story action reference glyph story sequence 2',
                'Ember story action reference ribbon tale sequence 3',
                'Ember story action reference arc emberlight sequence 4',
                'Ember story action reference petal lore sequence 5',
                'Ember story action reference beam whisper sequence 6',
                'Ember story action reference facet emberline sequence 7',
                'Ember story action reference chorus glow sequence 8',
                'Ember story action reference lattice ember sequence 9',
                'Ember story action reference lyric story sequence 10',
                'Ember story action reference shimmer tale sequence 11',
                'Ember story action reference glyph emberlight sequence 12',
                'Ember story action reference ribbon lore sequence 13',
                'Ember story action reference arc whisper sequence 14',
                'Ember story action reference petal emberline sequence 15',
                'Ember story action reference beam glow sequence 16',
                'Ember story action reference facet ember sequence 17',
                'Ember story action reference chorus story sequence 18',
                'Ember story action reference lattice tale sequence 19',
                'Ember story action reference lyric emberlight sequence 20',
                'Ember story action reference shimmer lore sequence 21',
                'Ember story action reference glyph whisper sequence 22',
                'Ember story action reference ribbon emberline sequence 23',
                'Ember story action reference arc glow sequence 24',
                'Ember story action reference petal ember sequence 25',
            ];
            const palettes = [
                'Ember story action palette amber ember sequence 1',
                'Ember story action palette azure story sequence 2',
                'Ember story action palette violet tale sequence 3',
                'Ember story action palette scarlet emberlight sequence 4',
                'Ember story action palette emerald lore sequence 5',
                'Ember story action palette indigo whisper sequence 6',
                'Ember story action palette cobalt emberline sequence 7',
                'Ember story action palette vermilion glow sequence 8',
                'Ember story action palette sepia ember sequence 9',
                'Ember story action palette silver story sequence 10',
                'Ember story action palette amber tale sequence 11',
                'Ember story action palette azure emberlight sequence 12',
                'Ember story action palette violet lore sequence 13',
                'Ember story action palette scarlet whisper sequence 14',
                'Ember story action palette emerald emberline sequence 15',
                'Ember story action palette indigo glow sequence 16',
                'Ember story action palette cobalt ember sequence 17',
                'Ember story action palette vermilion story sequence 18',
                'Ember story action palette sepia tale sequence 19',
                'Ember story action palette silver emberlight sequence 20',
                'Ember story action palette amber lore sequence 21',
                'Ember story action palette azure whisper sequence 22',
                'Ember story action palette violet emberline sequence 23',
                'Ember story action palette scarlet glow sequence 24',
                'Ember story action palette emerald ember sequence 25',
            ];
            const pathways = [
                'Ember story action pathway causeway ember sequence 1',
                'Ember story action pathway stair story sequence 2',
                'Ember story action pathway balcony tale sequence 3',
                'Ember story action pathway bridge emberlight sequence 4',
                'Ember story action pathway promenade lore sequence 5',
                'Ember story action pathway corridor whisper sequence 6',
                'Ember story action pathway gate emberline sequence 7',
                'Ember story action pathway atrium glow sequence 8',
                'Ember story action pathway garden ember sequence 9',
                'Ember story action pathway lantern story sequence 10',
                'Ember story action pathway causeway tale sequence 11',
                'Ember story action pathway stair emberlight sequence 12',
                'Ember story action pathway balcony lore sequence 13',
                'Ember story action pathway bridge whisper sequence 14',
                'Ember story action pathway promenade emberline sequence 15',
                'Ember story action pathway corridor glow sequence 16',
                'Ember story action pathway gate ember sequence 17',
                'Ember story action pathway atrium story sequence 18',
                'Ember story action pathway garden tale sequence 19',
                'Ember story action pathway lantern emberlight sequence 20',
                'Ember story action pathway causeway lore sequence 21',
                'Ember story action pathway stair whisper sequence 22',
                'Ember story action pathway balcony emberline sequence 23',
                'Ember story action pathway bridge glow sequence 24',
                'Ember story action pathway promenade ember sequence 25',
            ];
            const moments = [
                'Ember story action moment moment ember sequence 1',
                'Ember story action moment glimmer story sequence 2',
                'Ember story action moment spark tale sequence 3',
                'Ember story action moment pulse emberlight sequence 4',
                'Ember story action moment beat lore sequence 5',
                'Ember story action moment echo whisper sequence 6',
                'Ember story action moment note emberline sequence 7',
                'Ember story action moment breath glow sequence 8',
                'Ember story action moment pause ember sequence 9',
                'Ember story action moment crescendo story sequence 10',
                'Ember story action moment moment tale sequence 11',
                'Ember story action moment glimmer emberlight sequence 12',
                'Ember story action moment spark lore sequence 13',
                'Ember story action moment pulse whisper sequence 14',
                'Ember story action moment beat emberline sequence 15',
                'Ember story action moment echo glow sequence 16',
                'Ember story action moment note ember sequence 17',
                'Ember story action moment breath story sequence 18',
                'Ember story action moment pause tale sequence 19',
                'Ember story action moment crescendo emberlight sequence 20',
                'Ember story action moment moment lore sequence 21',
                'Ember story action moment glimmer whisper sequence 22',
                'Ember story action moment spark emberline sequence 23',
                'Ember story action moment pulse glow sequence 24',
                'Ember story action moment beat ember sequence 25',
            ];
            const renderings = [];
            for (let round = 0; round < variations; round++) {
                for (let index = 0; index < references.length; index++) {
                    const reference = references[index];
                    const palette = palettes[(index + round) % palettes.length];
                    const pathway = pathways[(index + round * 2) % pathways.length];
                    const moment = moments[(index + round * 3) % moments.length];
                    const timestamp = includeTimestamp ? ` @${new Date().toISOString()}` : '';
                    renderings.push(`${style} | ${anchor} | ${reference} | ${palette} | ${pathway} | ${moment}${timestamp}`);
                }
            }
            const luminous = [];
            renderings.forEach((entry, index) => {
                const accentuated = lighten ? entry.toUpperCase() : entry;
                luminous.push(`${index + 1} :: ${accentuated}`);
                if (index % 2 === 0) {
                    luminous.push(`bridge ${index + 1} :: ${anchor}`);
                }
                if (index % 5 === 0) {
                    luminous.push(`style ${style} ripple ${index + 1}`);
                }
            });
            const spool = [];
            const spoolSet = new Set();
            luminous.forEach((item) => {
                if (!spoolSet.has(item)) {
                    spool.push(item);
                    spoolSet.add(item);
                }
            });
            const base = basePayload.trim();
            if (base) {
                spool.unshift(`base::${base}`);
            }
            const newlineChar = String.fromCharCode(10);
            const safeKey = 'fantasy_action_ember_story';
            clone.vars[`${safeKey}_style`] = style;
            clone.vars[`${safeKey}_renderCount`] = renderings.length;
            clone.vars[`${safeKey}_anchor`] = anchor;
            clone.payload = spool.join(newlineChar);
            clone.logs.push('Ember story action arranged luminous passages.');
            return [clone];
        }
    },
    {
        id: 'fantasy-action-crystal-chart',
        category: 'action',
        name: 'Crystal chart action',
        description: 'Facet payload shards into luminous crystal charts.',
        icon: 'pie-chart',
        accent: '#22d3ee',
        tags: ['action', 'crystal', 'chart', 'fantasy'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { style: 'Crystal chart', variations: 3, lighten: false, anchor: 'Facet atrium', includeTimestamp: false },
        form: [
            { key: 'style', label: 'Style', type: 'text', placeholder: 'Crystal chart' },
            { key: 'variations', label: 'Variations', type: 'number', min: 1, max: 12 },
            { key: 'lighten', label: 'Lighten palette', type: 'checkbox' },
            { key: 'anchor', label: 'Anchor', type: 'text', placeholder: 'Facet atrium' },
            { key: 'includeTimestamp', label: 'Include timestamp', type: 'checkbox' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const basePayload = QuickActionTools.toText(clone.payload ?? '');
            const style = (config?.style || 'Crystal chart').trim() || 'Crystal chart';
            const variations = Math.max(1, parseInt(config?.variations, 10) || 1);
            const lighten = Boolean(config?.lighten);
            const anchor = (config?.anchor || 'Facet atrium').trim() || 'Facet atrium';
            const includeTimestamp = Boolean(config?.includeTimestamp);
            const references = [
                'Crystal chart action reference shimmer crystal sequence 1',
                'Crystal chart action reference glyph chart sequence 2',
                'Crystal chart action reference ribbon facet sequence 3',
                'Crystal chart action reference arc beam sequence 4',
                'Crystal chart action reference petal spark sequence 5',
                'Crystal chart action reference beam geometry sequence 6',
                'Crystal chart action reference facet diagram sequence 7',
                'Crystal chart action reference chorus shine sequence 8',
                'Crystal chart action reference lattice crystal sequence 9',
                'Crystal chart action reference lyric chart sequence 10',
                'Crystal chart action reference shimmer facet sequence 11',
                'Crystal chart action reference glyph beam sequence 12',
                'Crystal chart action reference ribbon spark sequence 13',
                'Crystal chart action reference arc geometry sequence 14',
                'Crystal chart action reference petal diagram sequence 15',
                'Crystal chart action reference beam shine sequence 16',
                'Crystal chart action reference facet crystal sequence 17',
                'Crystal chart action reference chorus chart sequence 18',
                'Crystal chart action reference lattice facet sequence 19',
                'Crystal chart action reference lyric beam sequence 20',
                'Crystal chart action reference shimmer spark sequence 21',
                'Crystal chart action reference glyph geometry sequence 22',
                'Crystal chart action reference ribbon diagram sequence 23',
                'Crystal chart action reference arc shine sequence 24',
                'Crystal chart action reference petal crystal sequence 25',
            ];
            const palettes = [
                'Crystal chart action palette amber crystal sequence 1',
                'Crystal chart action palette azure chart sequence 2',
                'Crystal chart action palette violet facet sequence 3',
                'Crystal chart action palette scarlet beam sequence 4',
                'Crystal chart action palette emerald spark sequence 5',
                'Crystal chart action palette indigo geometry sequence 6',
                'Crystal chart action palette cobalt diagram sequence 7',
                'Crystal chart action palette vermilion shine sequence 8',
                'Crystal chart action palette sepia crystal sequence 9',
                'Crystal chart action palette silver chart sequence 10',
                'Crystal chart action palette amber facet sequence 11',
                'Crystal chart action palette azure beam sequence 12',
                'Crystal chart action palette violet spark sequence 13',
                'Crystal chart action palette scarlet geometry sequence 14',
                'Crystal chart action palette emerald diagram sequence 15',
                'Crystal chart action palette indigo shine sequence 16',
                'Crystal chart action palette cobalt crystal sequence 17',
                'Crystal chart action palette vermilion chart sequence 18',
                'Crystal chart action palette sepia facet sequence 19',
                'Crystal chart action palette silver beam sequence 20',
                'Crystal chart action palette amber spark sequence 21',
                'Crystal chart action palette azure geometry sequence 22',
                'Crystal chart action palette violet diagram sequence 23',
                'Crystal chart action palette scarlet shine sequence 24',
                'Crystal chart action palette emerald crystal sequence 25',
            ];
            const pathways = [
                'Crystal chart action pathway causeway crystal sequence 1',
                'Crystal chart action pathway stair chart sequence 2',
                'Crystal chart action pathway balcony facet sequence 3',
                'Crystal chart action pathway bridge beam sequence 4',
                'Crystal chart action pathway promenade spark sequence 5',
                'Crystal chart action pathway corridor geometry sequence 6',
                'Crystal chart action pathway gate diagram sequence 7',
                'Crystal chart action pathway atrium shine sequence 8',
                'Crystal chart action pathway garden crystal sequence 9',
                'Crystal chart action pathway lantern chart sequence 10',
                'Crystal chart action pathway causeway facet sequence 11',
                'Crystal chart action pathway stair beam sequence 12',
                'Crystal chart action pathway balcony spark sequence 13',
                'Crystal chart action pathway bridge geometry sequence 14',
                'Crystal chart action pathway promenade diagram sequence 15',
                'Crystal chart action pathway corridor shine sequence 16',
                'Crystal chart action pathway gate crystal sequence 17',
                'Crystal chart action pathway atrium chart sequence 18',
                'Crystal chart action pathway garden facet sequence 19',
                'Crystal chart action pathway lantern beam sequence 20',
                'Crystal chart action pathway causeway spark sequence 21',
                'Crystal chart action pathway stair geometry sequence 22',
                'Crystal chart action pathway balcony diagram sequence 23',
                'Crystal chart action pathway bridge shine sequence 24',
                'Crystal chart action pathway promenade crystal sequence 25',
            ];
            const moments = [
                'Crystal chart action moment moment crystal sequence 1',
                'Crystal chart action moment glimmer chart sequence 2',
                'Crystal chart action moment spark facet sequence 3',
                'Crystal chart action moment pulse beam sequence 4',
                'Crystal chart action moment beat spark sequence 5',
                'Crystal chart action moment echo geometry sequence 6',
                'Crystal chart action moment note diagram sequence 7',
                'Crystal chart action moment breath shine sequence 8',
                'Crystal chart action moment pause crystal sequence 9',
                'Crystal chart action moment crescendo chart sequence 10',
                'Crystal chart action moment moment facet sequence 11',
                'Crystal chart action moment glimmer beam sequence 12',
                'Crystal chart action moment spark spark sequence 13',
                'Crystal chart action moment pulse geometry sequence 14',
                'Crystal chart action moment beat diagram sequence 15',
                'Crystal chart action moment echo shine sequence 16',
                'Crystal chart action moment note crystal sequence 17',
                'Crystal chart action moment breath chart sequence 18',
                'Crystal chart action moment pause facet sequence 19',
                'Crystal chart action moment crescendo beam sequence 20',
                'Crystal chart action moment moment spark sequence 21',
                'Crystal chart action moment glimmer geometry sequence 22',
                'Crystal chart action moment spark diagram sequence 23',
                'Crystal chart action moment pulse shine sequence 24',
                'Crystal chart action moment beat crystal sequence 25',
            ];
            const renderings = [];
            for (let round = 0; round < variations; round++) {
                for (let index = 0; index < references.length; index++) {
                    const reference = references[index];
                    const palette = palettes[(index + round) % palettes.length];
                    const pathway = pathways[(index + round * 2) % pathways.length];
                    const moment = moments[(index + round * 3) % moments.length];
                    const timestamp = includeTimestamp ? ` @${new Date().toISOString()}` : '';
                    renderings.push(`${style} | ${anchor} | ${reference} | ${palette} | ${pathway} | ${moment}${timestamp}`);
                }
            }
            const luminous = [];
            renderings.forEach((entry, index) => {
                const accentuated = lighten ? entry.toUpperCase() : entry;
                luminous.push(`${index + 1} :: ${accentuated}`);
                if (index % 2 === 0) {
                    luminous.push(`bridge ${index + 1} :: ${anchor}`);
                }
                if (index % 5 === 0) {
                    luminous.push(`style ${style} ripple ${index + 1}`);
                }
            });
            const spool = [];
            const spoolSet = new Set();
            luminous.forEach((item) => {
                if (!spoolSet.has(item)) {
                    spool.push(item);
                    spoolSet.add(item);
                }
            });
            const base = basePayload.trim();
            if (base) {
                spool.unshift(`base::${base}`);
            }
            const newlineChar = String.fromCharCode(10);
            const safeKey = 'fantasy_action_crystal_chart';
            clone.vars[`${safeKey}_style`] = style;
            clone.vars[`${safeKey}_renderCount`] = renderings.length;
            clone.vars[`${safeKey}_anchor`] = anchor;
            clone.payload = spool.join(newlineChar);
            clone.logs.push('Crystal chart action arranged luminous passages.');
            return [clone];
        }
    },
    {
        id: 'fantasy-action-grove-cadence',
        category: 'action',
        name: 'Grove cadence action',
        description: 'Layer grove cadences through gentle narrative rings.',
        icon: 'disc',
        accent: '#4ade80',
        tags: ['action', 'grove', 'cadence', 'fantasy'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { style: 'Grove cadence', variations: 3, lighten: false, anchor: 'Verdant gallery', includeTimestamp: false },
        form: [
            { key: 'style', label: 'Style', type: 'text', placeholder: 'Grove cadence' },
            { key: 'variations', label: 'Variations', type: 'number', min: 1, max: 12 },
            { key: 'lighten', label: 'Lighten palette', type: 'checkbox' },
            { key: 'anchor', label: 'Anchor', type: 'text', placeholder: 'Verdant gallery' },
            { key: 'includeTimestamp', label: 'Include timestamp', type: 'checkbox' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const basePayload = QuickActionTools.toText(clone.payload ?? '');
            const style = (config?.style || 'Grove cadence').trim() || 'Grove cadence';
            const variations = Math.max(1, parseInt(config?.variations, 10) || 1);
            const lighten = Boolean(config?.lighten);
            const anchor = (config?.anchor || 'Verdant gallery').trim() || 'Verdant gallery';
            const includeTimestamp = Boolean(config?.includeTimestamp);
            const references = [
                'Grove cadence action reference shimmer grove sequence 1',
                'Grove cadence action reference glyph cadence sequence 2',
                'Grove cadence action reference ribbon ring sequence 3',
                'Grove cadence action reference arc leaf sequence 4',
                'Grove cadence action reference petal branch sequence 5',
                'Grove cadence action reference beam forest sequence 6',
                'Grove cadence action reference facet pulse sequence 7',
                'Grove cadence action reference chorus song sequence 8',
                'Grove cadence action reference lattice grove sequence 9',
                'Grove cadence action reference lyric cadence sequence 10',
                'Grove cadence action reference shimmer ring sequence 11',
                'Grove cadence action reference glyph leaf sequence 12',
                'Grove cadence action reference ribbon branch sequence 13',
                'Grove cadence action reference arc forest sequence 14',
                'Grove cadence action reference petal pulse sequence 15',
                'Grove cadence action reference beam song sequence 16',
                'Grove cadence action reference facet grove sequence 17',
                'Grove cadence action reference chorus cadence sequence 18',
                'Grove cadence action reference lattice ring sequence 19',
                'Grove cadence action reference lyric leaf sequence 20',
                'Grove cadence action reference shimmer branch sequence 21',
                'Grove cadence action reference glyph forest sequence 22',
                'Grove cadence action reference ribbon pulse sequence 23',
                'Grove cadence action reference arc song sequence 24',
                'Grove cadence action reference petal grove sequence 25',
            ];
            const palettes = [
                'Grove cadence action palette amber grove sequence 1',
                'Grove cadence action palette azure cadence sequence 2',
                'Grove cadence action palette violet ring sequence 3',
                'Grove cadence action palette scarlet leaf sequence 4',
                'Grove cadence action palette emerald branch sequence 5',
                'Grove cadence action palette indigo forest sequence 6',
                'Grove cadence action palette cobalt pulse sequence 7',
                'Grove cadence action palette vermilion song sequence 8',
                'Grove cadence action palette sepia grove sequence 9',
                'Grove cadence action palette silver cadence sequence 10',
                'Grove cadence action palette amber ring sequence 11',
                'Grove cadence action palette azure leaf sequence 12',
                'Grove cadence action palette violet branch sequence 13',
                'Grove cadence action palette scarlet forest sequence 14',
                'Grove cadence action palette emerald pulse sequence 15',
                'Grove cadence action palette indigo song sequence 16',
                'Grove cadence action palette cobalt grove sequence 17',
                'Grove cadence action palette vermilion cadence sequence 18',
                'Grove cadence action palette sepia ring sequence 19',
                'Grove cadence action palette silver leaf sequence 20',
                'Grove cadence action palette amber branch sequence 21',
                'Grove cadence action palette azure forest sequence 22',
                'Grove cadence action palette violet pulse sequence 23',
                'Grove cadence action palette scarlet song sequence 24',
                'Grove cadence action palette emerald grove sequence 25',
            ];
            const pathways = [
                'Grove cadence action pathway causeway grove sequence 1',
                'Grove cadence action pathway stair cadence sequence 2',
                'Grove cadence action pathway balcony ring sequence 3',
                'Grove cadence action pathway bridge leaf sequence 4',
                'Grove cadence action pathway promenade branch sequence 5',
                'Grove cadence action pathway corridor forest sequence 6',
                'Grove cadence action pathway gate pulse sequence 7',
                'Grove cadence action pathway atrium song sequence 8',
                'Grove cadence action pathway garden grove sequence 9',
                'Grove cadence action pathway lantern cadence sequence 10',
                'Grove cadence action pathway causeway ring sequence 11',
                'Grove cadence action pathway stair leaf sequence 12',
                'Grove cadence action pathway balcony branch sequence 13',
                'Grove cadence action pathway bridge forest sequence 14',
                'Grove cadence action pathway promenade pulse sequence 15',
                'Grove cadence action pathway corridor song sequence 16',
                'Grove cadence action pathway gate grove sequence 17',
                'Grove cadence action pathway atrium cadence sequence 18',
                'Grove cadence action pathway garden ring sequence 19',
                'Grove cadence action pathway lantern leaf sequence 20',
                'Grove cadence action pathway causeway branch sequence 21',
                'Grove cadence action pathway stair forest sequence 22',
                'Grove cadence action pathway balcony pulse sequence 23',
                'Grove cadence action pathway bridge song sequence 24',
                'Grove cadence action pathway promenade grove sequence 25',
            ];
            const moments = [
                'Grove cadence action moment moment grove sequence 1',
                'Grove cadence action moment glimmer cadence sequence 2',
                'Grove cadence action moment spark ring sequence 3',
                'Grove cadence action moment pulse leaf sequence 4',
                'Grove cadence action moment beat branch sequence 5',
                'Grove cadence action moment echo forest sequence 6',
                'Grove cadence action moment note pulse sequence 7',
                'Grove cadence action moment breath song sequence 8',
                'Grove cadence action moment pause grove sequence 9',
                'Grove cadence action moment crescendo cadence sequence 10',
                'Grove cadence action moment moment ring sequence 11',
                'Grove cadence action moment glimmer leaf sequence 12',
                'Grove cadence action moment spark branch sequence 13',
                'Grove cadence action moment pulse forest sequence 14',
                'Grove cadence action moment beat pulse sequence 15',
                'Grove cadence action moment echo song sequence 16',
                'Grove cadence action moment note grove sequence 17',
                'Grove cadence action moment breath cadence sequence 18',
                'Grove cadence action moment pause ring sequence 19',
                'Grove cadence action moment crescendo leaf sequence 20',
                'Grove cadence action moment moment branch sequence 21',
                'Grove cadence action moment glimmer forest sequence 22',
                'Grove cadence action moment spark pulse sequence 23',
                'Grove cadence action moment pulse song sequence 24',
                'Grove cadence action moment beat grove sequence 25',
            ];
            const renderings = [];
            for (let round = 0; round < variations; round++) {
                for (let index = 0; index < references.length; index++) {
                    const reference = references[index];
                    const palette = palettes[(index + round) % palettes.length];
                    const pathway = pathways[(index + round * 2) % pathways.length];
                    const moment = moments[(index + round * 3) % moments.length];
                    const timestamp = includeTimestamp ? ` @${new Date().toISOString()}` : '';
                    renderings.push(`${style} | ${anchor} | ${reference} | ${palette} | ${pathway} | ${moment}${timestamp}`);
                }
            }
            const luminous = [];
            renderings.forEach((entry, index) => {
                const accentuated = lighten ? entry.toUpperCase() : entry;
                luminous.push(`${index + 1} :: ${accentuated}`);
                if (index % 2 === 0) {
                    luminous.push(`bridge ${index + 1} :: ${anchor}`);
                }
                if (index % 5 === 0) {
                    luminous.push(`style ${style} ripple ${index + 1}`);
                }
            });
            const spool = [];
            const spoolSet = new Set();
            luminous.forEach((item) => {
                if (!spoolSet.has(item)) {
                    spool.push(item);
                    spoolSet.add(item);
                }
            });
            const base = basePayload.trim();
            if (base) {
                spool.unshift(`base::${base}`);
            }
            const newlineChar = String.fromCharCode(10);
            const safeKey = 'fantasy_action_grove_cadence';
            clone.vars[`${safeKey}_style`] = style;
            clone.vars[`${safeKey}_renderCount`] = renderings.length;
            clone.vars[`${safeKey}_anchor`] = anchor;
            clone.payload = spool.join(newlineChar);
            clone.logs.push('Grove cadence action arranged luminous passages.');
            return [clone];
        }
    },
    {
        id: 'fantasy-action-tide-scroll',
        category: 'action',
        name: 'Tide scroll action',
        description: 'Scroll payload currents like tidal illuminated manuscripts.',
        icon: 'align-left',
        accent: '#0ea5e9',
        tags: ['action', 'tide', 'scroll', 'fantasy'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { style: 'Tide scroll', variations: 3, lighten: false, anchor: 'Harbor scriptorium', includeTimestamp: false },
        form: [
            { key: 'style', label: 'Style', type: 'text', placeholder: 'Tide scroll' },
            { key: 'variations', label: 'Variations', type: 'number', min: 1, max: 12 },
            { key: 'lighten', label: 'Lighten palette', type: 'checkbox' },
            { key: 'anchor', label: 'Anchor', type: 'text', placeholder: 'Harbor scriptorium' },
            { key: 'includeTimestamp', label: 'Include timestamp', type: 'checkbox' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const basePayload = QuickActionTools.toText(clone.payload ?? '');
            const style = (config?.style || 'Tide scroll').trim() || 'Tide scroll';
            const variations = Math.max(1, parseInt(config?.variations, 10) || 1);
            const lighten = Boolean(config?.lighten);
            const anchor = (config?.anchor || 'Harbor scriptorium').trim() || 'Harbor scriptorium';
            const includeTimestamp = Boolean(config?.includeTimestamp);
            const references = [
                'Tide scroll action reference shimmer tide sequence 1',
                'Tide scroll action reference glyph scroll sequence 2',
                'Tide scroll action reference ribbon wave sequence 3',
                'Tide scroll action reference arc foam sequence 4',
                'Tide scroll action reference petal sand sequence 5',
                'Tide scroll action reference beam shell sequence 6',
                'Tide scroll action reference facet shore sequence 7',
                'Tide scroll action reference chorus song sequence 8',
                'Tide scroll action reference lattice tide sequence 9',
                'Tide scroll action reference lyric scroll sequence 10',
                'Tide scroll action reference shimmer wave sequence 11',
                'Tide scroll action reference glyph foam sequence 12',
                'Tide scroll action reference ribbon sand sequence 13',
                'Tide scroll action reference arc shell sequence 14',
                'Tide scroll action reference petal shore sequence 15',
                'Tide scroll action reference beam song sequence 16',
                'Tide scroll action reference facet tide sequence 17',
                'Tide scroll action reference chorus scroll sequence 18',
                'Tide scroll action reference lattice wave sequence 19',
                'Tide scroll action reference lyric foam sequence 20',
                'Tide scroll action reference shimmer sand sequence 21',
                'Tide scroll action reference glyph shell sequence 22',
                'Tide scroll action reference ribbon shore sequence 23',
                'Tide scroll action reference arc song sequence 24',
                'Tide scroll action reference petal tide sequence 25',
            ];
            const palettes = [
                'Tide scroll action palette amber tide sequence 1',
                'Tide scroll action palette azure scroll sequence 2',
                'Tide scroll action palette violet wave sequence 3',
                'Tide scroll action palette scarlet foam sequence 4',
                'Tide scroll action palette emerald sand sequence 5',
                'Tide scroll action palette indigo shell sequence 6',
                'Tide scroll action palette cobalt shore sequence 7',
                'Tide scroll action palette vermilion song sequence 8',
                'Tide scroll action palette sepia tide sequence 9',
                'Tide scroll action palette silver scroll sequence 10',
                'Tide scroll action palette amber wave sequence 11',
                'Tide scroll action palette azure foam sequence 12',
                'Tide scroll action palette violet sand sequence 13',
                'Tide scroll action palette scarlet shell sequence 14',
                'Tide scroll action palette emerald shore sequence 15',
                'Tide scroll action palette indigo song sequence 16',
                'Tide scroll action palette cobalt tide sequence 17',
                'Tide scroll action palette vermilion scroll sequence 18',
                'Tide scroll action palette sepia wave sequence 19',
                'Tide scroll action palette silver foam sequence 20',
                'Tide scroll action palette amber sand sequence 21',
                'Tide scroll action palette azure shell sequence 22',
                'Tide scroll action palette violet shore sequence 23',
                'Tide scroll action palette scarlet song sequence 24',
                'Tide scroll action palette emerald tide sequence 25',
            ];
            const pathways = [
                'Tide scroll action pathway causeway tide sequence 1',
                'Tide scroll action pathway stair scroll sequence 2',
                'Tide scroll action pathway balcony wave sequence 3',
                'Tide scroll action pathway bridge foam sequence 4',
                'Tide scroll action pathway promenade sand sequence 5',
                'Tide scroll action pathway corridor shell sequence 6',
                'Tide scroll action pathway gate shore sequence 7',
                'Tide scroll action pathway atrium song sequence 8',
                'Tide scroll action pathway garden tide sequence 9',
                'Tide scroll action pathway lantern scroll sequence 10',
                'Tide scroll action pathway causeway wave sequence 11',
                'Tide scroll action pathway stair foam sequence 12',
                'Tide scroll action pathway balcony sand sequence 13',
                'Tide scroll action pathway bridge shell sequence 14',
                'Tide scroll action pathway promenade shore sequence 15',
                'Tide scroll action pathway corridor song sequence 16',
                'Tide scroll action pathway gate tide sequence 17',
                'Tide scroll action pathway atrium scroll sequence 18',
                'Tide scroll action pathway garden wave sequence 19',
                'Tide scroll action pathway lantern foam sequence 20',
                'Tide scroll action pathway causeway sand sequence 21',
                'Tide scroll action pathway stair shell sequence 22',
                'Tide scroll action pathway balcony shore sequence 23',
                'Tide scroll action pathway bridge song sequence 24',
                'Tide scroll action pathway promenade tide sequence 25',
            ];
            const moments = [
                'Tide scroll action moment moment tide sequence 1',
                'Tide scroll action moment glimmer scroll sequence 2',
                'Tide scroll action moment spark wave sequence 3',
                'Tide scroll action moment pulse foam sequence 4',
                'Tide scroll action moment beat sand sequence 5',
                'Tide scroll action moment echo shell sequence 6',
                'Tide scroll action moment note shore sequence 7',
                'Tide scroll action moment breath song sequence 8',
                'Tide scroll action moment pause tide sequence 9',
                'Tide scroll action moment crescendo scroll sequence 10',
                'Tide scroll action moment moment wave sequence 11',
                'Tide scroll action moment glimmer foam sequence 12',
                'Tide scroll action moment spark sand sequence 13',
                'Tide scroll action moment pulse shell sequence 14',
                'Tide scroll action moment beat shore sequence 15',
                'Tide scroll action moment echo song sequence 16',
                'Tide scroll action moment note tide sequence 17',
                'Tide scroll action moment breath scroll sequence 18',
                'Tide scroll action moment pause wave sequence 19',
                'Tide scroll action moment crescendo foam sequence 20',
                'Tide scroll action moment moment sand sequence 21',
                'Tide scroll action moment glimmer shell sequence 22',
                'Tide scroll action moment spark shore sequence 23',
                'Tide scroll action moment pulse song sequence 24',
                'Tide scroll action moment beat tide sequence 25',
            ];
            const renderings = [];
            for (let round = 0; round < variations; round++) {
                for (let index = 0; index < references.length; index++) {
                    const reference = references[index];
                    const palette = palettes[(index + round) % palettes.length];
                    const pathway = pathways[(index + round * 2) % pathways.length];
                    const moment = moments[(index + round * 3) % moments.length];
                    const timestamp = includeTimestamp ? ` @${new Date().toISOString()}` : '';
                    renderings.push(`${style} | ${anchor} | ${reference} | ${palette} | ${pathway} | ${moment}${timestamp}`);
                }
            }
            const luminous = [];
            renderings.forEach((entry, index) => {
                const accentuated = lighten ? entry.toUpperCase() : entry;
                luminous.push(`${index + 1} :: ${accentuated}`);
                if (index % 2 === 0) {
                    luminous.push(`bridge ${index + 1} :: ${anchor}`);
                }
                if (index % 5 === 0) {
                    luminous.push(`style ${style} ripple ${index + 1}`);
                }
            });
            const spool = [];
            const spoolSet = new Set();
            luminous.forEach((item) => {
                if (!spoolSet.has(item)) {
                    spool.push(item);
                    spoolSet.add(item);
                }
            });
            const base = basePayload.trim();
            if (base) {
                spool.unshift(`base::${base}`);
            }
            const newlineChar = String.fromCharCode(10);
            const safeKey = 'fantasy_action_tide_scroll';
            clone.vars[`${safeKey}_style`] = style;
            clone.vars[`${safeKey}_renderCount`] = renderings.length;
            clone.vars[`${safeKey}_anchor`] = anchor;
            clone.payload = spool.join(newlineChar);
            clone.logs.push('Tide scroll action arranged luminous passages.');
            return [clone];
        }
    },
    {
        id: 'fantasy-action-ridge-signal',
        category: 'action',
        name: 'Ridge signal action',
        description: 'Signal payload peaks along ridgeway luminous beacons.',
        icon: 'triangle',
        accent: '#fbbf24',
        tags: ['action', 'ridge', 'signal', 'fantasy'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { style: 'Ridge signal', variations: 3, lighten: false, anchor: 'Summit observatory', includeTimestamp: false },
        form: [
            { key: 'style', label: 'Style', type: 'text', placeholder: 'Ridge signal' },
            { key: 'variations', label: 'Variations', type: 'number', min: 1, max: 12 },
            { key: 'lighten', label: 'Lighten palette', type: 'checkbox' },
            { key: 'anchor', label: 'Anchor', type: 'text', placeholder: 'Summit observatory' },
            { key: 'includeTimestamp', label: 'Include timestamp', type: 'checkbox' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const basePayload = QuickActionTools.toText(clone.payload ?? '');
            const style = (config?.style || 'Ridge signal').trim() || 'Ridge signal';
            const variations = Math.max(1, parseInt(config?.variations, 10) || 1);
            const lighten = Boolean(config?.lighten);
            const anchor = (config?.anchor || 'Summit observatory').trim() || 'Summit observatory';
            const includeTimestamp = Boolean(config?.includeTimestamp);
            const references = [
                'Ridge signal action reference shimmer ridge sequence 1',
                'Ridge signal action reference glyph signal sequence 2',
                'Ridge signal action reference ribbon summit sequence 3',
                'Ridge signal action reference arc peak sequence 4',
                'Ridge signal action reference petal banner sequence 5',
                'Ridge signal action reference beam ridgeway sequence 6',
                'Ridge signal action reference facet flash sequence 7',
                'Ridge signal action reference chorus spire sequence 8',
                'Ridge signal action reference lattice ridge sequence 9',
                'Ridge signal action reference lyric signal sequence 10',
                'Ridge signal action reference shimmer summit sequence 11',
                'Ridge signal action reference glyph peak sequence 12',
                'Ridge signal action reference ribbon banner sequence 13',
                'Ridge signal action reference arc ridgeway sequence 14',
                'Ridge signal action reference petal flash sequence 15',
                'Ridge signal action reference beam spire sequence 16',
                'Ridge signal action reference facet ridge sequence 17',
                'Ridge signal action reference chorus signal sequence 18',
                'Ridge signal action reference lattice summit sequence 19',
                'Ridge signal action reference lyric peak sequence 20',
                'Ridge signal action reference shimmer banner sequence 21',
                'Ridge signal action reference glyph ridgeway sequence 22',
                'Ridge signal action reference ribbon flash sequence 23',
                'Ridge signal action reference arc spire sequence 24',
                'Ridge signal action reference petal ridge sequence 25',
            ];
            const palettes = [
                'Ridge signal action palette amber ridge sequence 1',
                'Ridge signal action palette azure signal sequence 2',
                'Ridge signal action palette violet summit sequence 3',
                'Ridge signal action palette scarlet peak sequence 4',
                'Ridge signal action palette emerald banner sequence 5',
                'Ridge signal action palette indigo ridgeway sequence 6',
                'Ridge signal action palette cobalt flash sequence 7',
                'Ridge signal action palette vermilion spire sequence 8',
                'Ridge signal action palette sepia ridge sequence 9',
                'Ridge signal action palette silver signal sequence 10',
                'Ridge signal action palette amber summit sequence 11',
                'Ridge signal action palette azure peak sequence 12',
                'Ridge signal action palette violet banner sequence 13',
                'Ridge signal action palette scarlet ridgeway sequence 14',
                'Ridge signal action palette emerald flash sequence 15',
                'Ridge signal action palette indigo spire sequence 16',
                'Ridge signal action palette cobalt ridge sequence 17',
                'Ridge signal action palette vermilion signal sequence 18',
                'Ridge signal action palette sepia summit sequence 19',
                'Ridge signal action palette silver peak sequence 20',
                'Ridge signal action palette amber banner sequence 21',
                'Ridge signal action palette azure ridgeway sequence 22',
                'Ridge signal action palette violet flash sequence 23',
                'Ridge signal action palette scarlet spire sequence 24',
                'Ridge signal action palette emerald ridge sequence 25',
            ];
            const pathways = [
                'Ridge signal action pathway causeway ridge sequence 1',
                'Ridge signal action pathway stair signal sequence 2',
                'Ridge signal action pathway balcony summit sequence 3',
                'Ridge signal action pathway bridge peak sequence 4',
                'Ridge signal action pathway promenade banner sequence 5',
                'Ridge signal action pathway corridor ridgeway sequence 6',
                'Ridge signal action pathway gate flash sequence 7',
                'Ridge signal action pathway atrium spire sequence 8',
                'Ridge signal action pathway garden ridge sequence 9',
                'Ridge signal action pathway lantern signal sequence 10',
                'Ridge signal action pathway causeway summit sequence 11',
                'Ridge signal action pathway stair peak sequence 12',
                'Ridge signal action pathway balcony banner sequence 13',
                'Ridge signal action pathway bridge ridgeway sequence 14',
                'Ridge signal action pathway promenade flash sequence 15',
                'Ridge signal action pathway corridor spire sequence 16',
                'Ridge signal action pathway gate ridge sequence 17',
                'Ridge signal action pathway atrium signal sequence 18',
                'Ridge signal action pathway garden summit sequence 19',
                'Ridge signal action pathway lantern peak sequence 20',
                'Ridge signal action pathway causeway banner sequence 21',
                'Ridge signal action pathway stair ridgeway sequence 22',
                'Ridge signal action pathway balcony flash sequence 23',
                'Ridge signal action pathway bridge spire sequence 24',
                'Ridge signal action pathway promenade ridge sequence 25',
            ];
            const moments = [
                'Ridge signal action moment moment ridge sequence 1',
                'Ridge signal action moment glimmer signal sequence 2',
                'Ridge signal action moment spark summit sequence 3',
                'Ridge signal action moment pulse peak sequence 4',
                'Ridge signal action moment beat banner sequence 5',
                'Ridge signal action moment echo ridgeway sequence 6',
                'Ridge signal action moment note flash sequence 7',
                'Ridge signal action moment breath spire sequence 8',
                'Ridge signal action moment pause ridge sequence 9',
                'Ridge signal action moment crescendo signal sequence 10',
                'Ridge signal action moment moment summit sequence 11',
                'Ridge signal action moment glimmer peak sequence 12',
                'Ridge signal action moment spark banner sequence 13',
                'Ridge signal action moment pulse ridgeway sequence 14',
                'Ridge signal action moment beat flash sequence 15',
                'Ridge signal action moment echo spire sequence 16',
                'Ridge signal action moment note ridge sequence 17',
                'Ridge signal action moment breath signal sequence 18',
                'Ridge signal action moment pause summit sequence 19',
                'Ridge signal action moment crescendo peak sequence 20',
                'Ridge signal action moment moment banner sequence 21',
                'Ridge signal action moment glimmer ridgeway sequence 22',
                'Ridge signal action moment spark flash sequence 23',
                'Ridge signal action moment pulse spire sequence 24',
                'Ridge signal action moment beat ridge sequence 25',
            ];
            const renderings = [];
            for (let round = 0; round < variations; round++) {
                for (let index = 0; index < references.length; index++) {
                    const reference = references[index];
                    const palette = palettes[(index + round) % palettes.length];
                    const pathway = pathways[(index + round * 2) % pathways.length];
                    const moment = moments[(index + round * 3) % moments.length];
                    const timestamp = includeTimestamp ? ` @${new Date().toISOString()}` : '';
                    renderings.push(`${style} | ${anchor} | ${reference} | ${palette} | ${pathway} | ${moment}${timestamp}`);
                }
            }
            const luminous = [];
            renderings.forEach((entry, index) => {
                const accentuated = lighten ? entry.toUpperCase() : entry;
                luminous.push(`${index + 1} :: ${accentuated}`);
                if (index % 2 === 0) {
                    luminous.push(`bridge ${index + 1} :: ${anchor}`);
                }
                if (index % 5 === 0) {
                    luminous.push(`style ${style} ripple ${index + 1}`);
                }
            });
            const spool = [];
            const spoolSet = new Set();
            luminous.forEach((item) => {
                if (!spoolSet.has(item)) {
                    spool.push(item);
                    spoolSet.add(item);
                }
            });
            const base = basePayload.trim();
            if (base) {
                spool.unshift(`base::${base}`);
            }
            const newlineChar = String.fromCharCode(10);
            const safeKey = 'fantasy_action_ridge_signal';
            clone.vars[`${safeKey}_style`] = style;
            clone.vars[`${safeKey}_renderCount`] = renderings.length;
            clone.vars[`${safeKey}_anchor`] = anchor;
            clone.payload = spool.join(newlineChar);
            clone.logs.push('Ridge signal action arranged luminous passages.');
            return [clone];
        }
    },
    {
        id: 'fantasy-action-coral-drift',
        category: 'action',
        name: 'Coral drift action',
        description: 'Guide payload into coral drifts and shimmering reefs.',
        icon: 'anchor',
        accent: '#22c55e',
        tags: ['action', 'coral', 'drift', 'fantasy'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { style: 'Coral drift', variations: 3, lighten: false, anchor: 'Reef balcony', includeTimestamp: false },
        form: [
            { key: 'style', label: 'Style', type: 'text', placeholder: 'Coral drift' },
            { key: 'variations', label: 'Variations', type: 'number', min: 1, max: 12 },
            { key: 'lighten', label: 'Lighten palette', type: 'checkbox' },
            { key: 'anchor', label: 'Anchor', type: 'text', placeholder: 'Reef balcony' },
            { key: 'includeTimestamp', label: 'Include timestamp', type: 'checkbox' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const basePayload = QuickActionTools.toText(clone.payload ?? '');
            const style = (config?.style || 'Coral drift').trim() || 'Coral drift';
            const variations = Math.max(1, parseInt(config?.variations, 10) || 1);
            const lighten = Boolean(config?.lighten);
            const anchor = (config?.anchor || 'Reef balcony').trim() || 'Reef balcony';
            const includeTimestamp = Boolean(config?.includeTimestamp);
            const references = [
                'Coral drift action reference shimmer coral sequence 1',
                'Coral drift action reference glyph drift sequence 2',
                'Coral drift action reference ribbon reef sequence 3',
                'Coral drift action reference arc lagoon sequence 4',
                'Coral drift action reference petal tide sequence 5',
                'Coral drift action reference beam shell sequence 6',
                'Coral drift action reference facet glisten sequence 7',
                'Coral drift action reference chorus bubble sequence 8',
                'Coral drift action reference lattice coral sequence 9',
                'Coral drift action reference lyric drift sequence 10',
                'Coral drift action reference shimmer reef sequence 11',
                'Coral drift action reference glyph lagoon sequence 12',
                'Coral drift action reference ribbon tide sequence 13',
                'Coral drift action reference arc shell sequence 14',
                'Coral drift action reference petal glisten sequence 15',
                'Coral drift action reference beam bubble sequence 16',
                'Coral drift action reference facet coral sequence 17',
                'Coral drift action reference chorus drift sequence 18',
                'Coral drift action reference lattice reef sequence 19',
                'Coral drift action reference lyric lagoon sequence 20',
                'Coral drift action reference shimmer tide sequence 21',
                'Coral drift action reference glyph shell sequence 22',
                'Coral drift action reference ribbon glisten sequence 23',
                'Coral drift action reference arc bubble sequence 24',
                'Coral drift action reference petal coral sequence 25',
            ];
            const palettes = [
                'Coral drift action palette amber coral sequence 1',
                'Coral drift action palette azure drift sequence 2',
                'Coral drift action palette violet reef sequence 3',
                'Coral drift action palette scarlet lagoon sequence 4',
                'Coral drift action palette emerald tide sequence 5',
                'Coral drift action palette indigo shell sequence 6',
                'Coral drift action palette cobalt glisten sequence 7',
                'Coral drift action palette vermilion bubble sequence 8',
                'Coral drift action palette sepia coral sequence 9',
                'Coral drift action palette silver drift sequence 10',
                'Coral drift action palette amber reef sequence 11',
                'Coral drift action palette azure lagoon sequence 12',
                'Coral drift action palette violet tide sequence 13',
                'Coral drift action palette scarlet shell sequence 14',
                'Coral drift action palette emerald glisten sequence 15',
                'Coral drift action palette indigo bubble sequence 16',
                'Coral drift action palette cobalt coral sequence 17',
                'Coral drift action palette vermilion drift sequence 18',
                'Coral drift action palette sepia reef sequence 19',
                'Coral drift action palette silver lagoon sequence 20',
                'Coral drift action palette amber tide sequence 21',
                'Coral drift action palette azure shell sequence 22',
                'Coral drift action palette violet glisten sequence 23',
                'Coral drift action palette scarlet bubble sequence 24',
                'Coral drift action palette emerald coral sequence 25',
            ];
            const pathways = [
                'Coral drift action pathway causeway coral sequence 1',
                'Coral drift action pathway stair drift sequence 2',
                'Coral drift action pathway balcony reef sequence 3',
                'Coral drift action pathway bridge lagoon sequence 4',
                'Coral drift action pathway promenade tide sequence 5',
                'Coral drift action pathway corridor shell sequence 6',
                'Coral drift action pathway gate glisten sequence 7',
                'Coral drift action pathway atrium bubble sequence 8',
                'Coral drift action pathway garden coral sequence 9',
                'Coral drift action pathway lantern drift sequence 10',
                'Coral drift action pathway causeway reef sequence 11',
                'Coral drift action pathway stair lagoon sequence 12',
                'Coral drift action pathway balcony tide sequence 13',
                'Coral drift action pathway bridge shell sequence 14',
                'Coral drift action pathway promenade glisten sequence 15',
                'Coral drift action pathway corridor bubble sequence 16',
                'Coral drift action pathway gate coral sequence 17',
                'Coral drift action pathway atrium drift sequence 18',
                'Coral drift action pathway garden reef sequence 19',
                'Coral drift action pathway lantern lagoon sequence 20',
                'Coral drift action pathway causeway tide sequence 21',
                'Coral drift action pathway stair shell sequence 22',
                'Coral drift action pathway balcony glisten sequence 23',
                'Coral drift action pathway bridge bubble sequence 24',
                'Coral drift action pathway promenade coral sequence 25',
            ];
            const moments = [
                'Coral drift action moment moment coral sequence 1',
                'Coral drift action moment glimmer drift sequence 2',
                'Coral drift action moment spark reef sequence 3',
                'Coral drift action moment pulse lagoon sequence 4',
                'Coral drift action moment beat tide sequence 5',
                'Coral drift action moment echo shell sequence 6',
                'Coral drift action moment note glisten sequence 7',
                'Coral drift action moment breath bubble sequence 8',
                'Coral drift action moment pause coral sequence 9',
                'Coral drift action moment crescendo drift sequence 10',
                'Coral drift action moment moment reef sequence 11',
                'Coral drift action moment glimmer lagoon sequence 12',
                'Coral drift action moment spark tide sequence 13',
                'Coral drift action moment pulse shell sequence 14',
                'Coral drift action moment beat glisten sequence 15',
                'Coral drift action moment echo bubble sequence 16',
                'Coral drift action moment note coral sequence 17',
                'Coral drift action moment breath drift sequence 18',
                'Coral drift action moment pause reef sequence 19',
                'Coral drift action moment crescendo lagoon sequence 20',
                'Coral drift action moment moment tide sequence 21',
                'Coral drift action moment glimmer shell sequence 22',
                'Coral drift action moment spark glisten sequence 23',
                'Coral drift action moment pulse bubble sequence 24',
                'Coral drift action moment beat coral sequence 25',
            ];
            const renderings = [];
            for (let round = 0; round < variations; round++) {
                for (let index = 0; index < references.length; index++) {
                    const reference = references[index];
                    const palette = palettes[(index + round) % palettes.length];
                    const pathway = pathways[(index + round * 2) % pathways.length];
                    const moment = moments[(index + round * 3) % moments.length];
                    const timestamp = includeTimestamp ? ` @${new Date().toISOString()}` : '';
                    renderings.push(`${style} | ${anchor} | ${reference} | ${palette} | ${pathway} | ${moment}${timestamp}`);
                }
            }
            const luminous = [];
            renderings.forEach((entry, index) => {
                const accentuated = lighten ? entry.toUpperCase() : entry;
                luminous.push(`${index + 1} :: ${accentuated}`);
                if (index % 2 === 0) {
                    luminous.push(`bridge ${index + 1} :: ${anchor}`);
                }
                if (index % 5 === 0) {
                    luminous.push(`style ${style} ripple ${index + 1}`);
                }
            });
            const spool = [];
            const spoolSet = new Set();
            luminous.forEach((item) => {
                if (!spoolSet.has(item)) {
                    spool.push(item);
                    spoolSet.add(item);
                }
            });
            const base = basePayload.trim();
            if (base) {
                spool.unshift(`base::${base}`);
            }
            const newlineChar = String.fromCharCode(10);
            const safeKey = 'fantasy_action_coral_drift';
            clone.vars[`${safeKey}_style`] = style;
            clone.vars[`${safeKey}_renderCount`] = renderings.length;
            clone.vars[`${safeKey}_anchor`] = anchor;
            clone.payload = spool.join(newlineChar);
            clone.logs.push('Coral drift action arranged luminous passages.');
            return [clone];
        }
    },
    {
        id: 'fantasy-action-moonlit-paragraph',
        category: 'action',
        name: 'Moonlit paragraph action',
        description: 'Bathe paragraphs in moonlit gradients and silver rhythms.',
        icon: 'moon',
        accent: '#6366f1',
        tags: ['action', 'moonlit', 'paragraph', 'fantasy'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { style: 'Moonlit paragraph', variations: 3, lighten: false, anchor: 'Lunar balcony', includeTimestamp: false },
        form: [
            { key: 'style', label: 'Style', type: 'text', placeholder: 'Moonlit paragraph' },
            { key: 'variations', label: 'Variations', type: 'number', min: 1, max: 12 },
            { key: 'lighten', label: 'Lighten palette', type: 'checkbox' },
            { key: 'anchor', label: 'Anchor', type: 'text', placeholder: 'Lunar balcony' },
            { key: 'includeTimestamp', label: 'Include timestamp', type: 'checkbox' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const basePayload = QuickActionTools.toText(clone.payload ?? '');
            const style = (config?.style || 'Moonlit paragraph').trim() || 'Moonlit paragraph';
            const variations = Math.max(1, parseInt(config?.variations, 10) || 1);
            const lighten = Boolean(config?.lighten);
            const anchor = (config?.anchor || 'Lunar balcony').trim() || 'Lunar balcony';
            const includeTimestamp = Boolean(config?.includeTimestamp);
            const references = [
                'Moonlit paragraph action reference shimmer moon sequence 1',
                'Moonlit paragraph action reference glyph silver sequence 2',
                'Moonlit paragraph action reference ribbon night sequence 3',
                'Moonlit paragraph action reference arc lunar sequence 4',
                'Moonlit paragraph action reference petal glow sequence 5',
                'Moonlit paragraph action reference beam soft sequence 6',
                'Moonlit paragraph action reference facet beam sequence 7',
                'Moonlit paragraph action reference chorus mist sequence 8',
                'Moonlit paragraph action reference lattice moon sequence 9',
                'Moonlit paragraph action reference lyric silver sequence 10',
                'Moonlit paragraph action reference shimmer night sequence 11',
                'Moonlit paragraph action reference glyph lunar sequence 12',
                'Moonlit paragraph action reference ribbon glow sequence 13',
                'Moonlit paragraph action reference arc soft sequence 14',
                'Moonlit paragraph action reference petal beam sequence 15',
                'Moonlit paragraph action reference beam mist sequence 16',
                'Moonlit paragraph action reference facet moon sequence 17',
                'Moonlit paragraph action reference chorus silver sequence 18',
                'Moonlit paragraph action reference lattice night sequence 19',
                'Moonlit paragraph action reference lyric lunar sequence 20',
                'Moonlit paragraph action reference shimmer glow sequence 21',
                'Moonlit paragraph action reference glyph soft sequence 22',
                'Moonlit paragraph action reference ribbon beam sequence 23',
                'Moonlit paragraph action reference arc mist sequence 24',
                'Moonlit paragraph action reference petal moon sequence 25',
            ];
            const palettes = [
                'Moonlit paragraph action palette amber moon sequence 1',
                'Moonlit paragraph action palette azure silver sequence 2',
                'Moonlit paragraph action palette violet night sequence 3',
                'Moonlit paragraph action palette scarlet lunar sequence 4',
                'Moonlit paragraph action palette emerald glow sequence 5',
                'Moonlit paragraph action palette indigo soft sequence 6',
                'Moonlit paragraph action palette cobalt beam sequence 7',
                'Moonlit paragraph action palette vermilion mist sequence 8',
                'Moonlit paragraph action palette sepia moon sequence 9',
                'Moonlit paragraph action palette silver silver sequence 10',
                'Moonlit paragraph action palette amber night sequence 11',
                'Moonlit paragraph action palette azure lunar sequence 12',
                'Moonlit paragraph action palette violet glow sequence 13',
                'Moonlit paragraph action palette scarlet soft sequence 14',
                'Moonlit paragraph action palette emerald beam sequence 15',
                'Moonlit paragraph action palette indigo mist sequence 16',
                'Moonlit paragraph action palette cobalt moon sequence 17',
                'Moonlit paragraph action palette vermilion silver sequence 18',
                'Moonlit paragraph action palette sepia night sequence 19',
                'Moonlit paragraph action palette silver lunar sequence 20',
                'Moonlit paragraph action palette amber glow sequence 21',
                'Moonlit paragraph action palette azure soft sequence 22',
                'Moonlit paragraph action palette violet beam sequence 23',
                'Moonlit paragraph action palette scarlet mist sequence 24',
                'Moonlit paragraph action palette emerald moon sequence 25',
            ];
            const pathways = [
                'Moonlit paragraph action pathway causeway moon sequence 1',
                'Moonlit paragraph action pathway stair silver sequence 2',
                'Moonlit paragraph action pathway balcony night sequence 3',
                'Moonlit paragraph action pathway bridge lunar sequence 4',
                'Moonlit paragraph action pathway promenade glow sequence 5',
                'Moonlit paragraph action pathway corridor soft sequence 6',
                'Moonlit paragraph action pathway gate beam sequence 7',
                'Moonlit paragraph action pathway atrium mist sequence 8',
                'Moonlit paragraph action pathway garden moon sequence 9',
                'Moonlit paragraph action pathway lantern silver sequence 10',
                'Moonlit paragraph action pathway causeway night sequence 11',
                'Moonlit paragraph action pathway stair lunar sequence 12',
                'Moonlit paragraph action pathway balcony glow sequence 13',
                'Moonlit paragraph action pathway bridge soft sequence 14',
                'Moonlit paragraph action pathway promenade beam sequence 15',
                'Moonlit paragraph action pathway corridor mist sequence 16',
                'Moonlit paragraph action pathway gate moon sequence 17',
                'Moonlit paragraph action pathway atrium silver sequence 18',
                'Moonlit paragraph action pathway garden night sequence 19',
                'Moonlit paragraph action pathway lantern lunar sequence 20',
                'Moonlit paragraph action pathway causeway glow sequence 21',
                'Moonlit paragraph action pathway stair soft sequence 22',
                'Moonlit paragraph action pathway balcony beam sequence 23',
                'Moonlit paragraph action pathway bridge mist sequence 24',
                'Moonlit paragraph action pathway promenade moon sequence 25',
            ];
            const moments = [
                'Moonlit paragraph action moment moment moon sequence 1',
                'Moonlit paragraph action moment glimmer silver sequence 2',
                'Moonlit paragraph action moment spark night sequence 3',
                'Moonlit paragraph action moment pulse lunar sequence 4',
                'Moonlit paragraph action moment beat glow sequence 5',
                'Moonlit paragraph action moment echo soft sequence 6',
                'Moonlit paragraph action moment note beam sequence 7',
                'Moonlit paragraph action moment breath mist sequence 8',
                'Moonlit paragraph action moment pause moon sequence 9',
                'Moonlit paragraph action moment crescendo silver sequence 10',
                'Moonlit paragraph action moment moment night sequence 11',
                'Moonlit paragraph action moment glimmer lunar sequence 12',
                'Moonlit paragraph action moment spark glow sequence 13',
                'Moonlit paragraph action moment pulse soft sequence 14',
                'Moonlit paragraph action moment beat beam sequence 15',
                'Moonlit paragraph action moment echo mist sequence 16',
                'Moonlit paragraph action moment note moon sequence 17',
                'Moonlit paragraph action moment breath silver sequence 18',
                'Moonlit paragraph action moment pause night sequence 19',
                'Moonlit paragraph action moment crescendo lunar sequence 20',
                'Moonlit paragraph action moment moment glow sequence 21',
                'Moonlit paragraph action moment glimmer soft sequence 22',
                'Moonlit paragraph action moment spark beam sequence 23',
                'Moonlit paragraph action moment pulse mist sequence 24',
                'Moonlit paragraph action moment beat moon sequence 25',
            ];
            const renderings = [];
            for (let round = 0; round < variations; round++) {
                for (let index = 0; index < references.length; index++) {
                    const reference = references[index];
                    const palette = palettes[(index + round) % palettes.length];
                    const pathway = pathways[(index + round * 2) % pathways.length];
                    const moment = moments[(index + round * 3) % moments.length];
                    const timestamp = includeTimestamp ? ` @${new Date().toISOString()}` : '';
                    renderings.push(`${style} | ${anchor} | ${reference} | ${palette} | ${pathway} | ${moment}${timestamp}`);
                }
            }
            const luminous = [];
            renderings.forEach((entry, index) => {
                const accentuated = lighten ? entry.toUpperCase() : entry;
                luminous.push(`${index + 1} :: ${accentuated}`);
                if (index % 2 === 0) {
                    luminous.push(`bridge ${index + 1} :: ${anchor}`);
                }
                if (index % 5 === 0) {
                    luminous.push(`style ${style} ripple ${index + 1}`);
                }
            });
            const spool = [];
            const spoolSet = new Set();
            luminous.forEach((item) => {
                if (!spoolSet.has(item)) {
                    spool.push(item);
                    spoolSet.add(item);
                }
            });
            const base = basePayload.trim();
            if (base) {
                spool.unshift(`base::${base}`);
            }
            const newlineChar = String.fromCharCode(10);
            const safeKey = 'fantasy_action_moonlit_paragraph';
            clone.vars[`${safeKey}_style`] = style;
            clone.vars[`${safeKey}_renderCount`] = renderings.length;
            clone.vars[`${safeKey}_anchor`] = anchor;
            clone.payload = spool.join(newlineChar);
            clone.logs.push('Moonlit paragraph action arranged luminous passages.');
            return [clone];
        }
    },
    {
        id: 'fantasy-action-ember-grove',
        category: 'action',
        name: 'Ember grove action',
        description: 'Mix ember sparks with grove breezes and glowing branches.',
        icon: 'flame',
        accent: '#f97316',
        tags: ['action', 'ember', 'grove', 'fantasy'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { style: 'Ember grove', variations: 3, lighten: false, anchor: 'Ashen clearing', includeTimestamp: false },
        form: [
            { key: 'style', label: 'Style', type: 'text', placeholder: 'Ember grove' },
            { key: 'variations', label: 'Variations', type: 'number', min: 1, max: 12 },
            { key: 'lighten', label: 'Lighten palette', type: 'checkbox' },
            { key: 'anchor', label: 'Anchor', type: 'text', placeholder: 'Ashen clearing' },
            { key: 'includeTimestamp', label: 'Include timestamp', type: 'checkbox' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const basePayload = QuickActionTools.toText(clone.payload ?? '');
            const style = (config?.style || 'Ember grove').trim() || 'Ember grove';
            const variations = Math.max(1, parseInt(config?.variations, 10) || 1);
            const lighten = Boolean(config?.lighten);
            const anchor = (config?.anchor || 'Ashen clearing').trim() || 'Ashen clearing';
            const includeTimestamp = Boolean(config?.includeTimestamp);
            const references = [
                'Ember grove action reference shimmer ember sequence 1',
                'Ember grove action reference glyph grove sequence 2',
                'Ember grove action reference ribbon branch sequence 3',
                'Ember grove action reference arc spark sequence 4',
                'Ember grove action reference petal root sequence 5',
                'Ember grove action reference beam ash sequence 6',
                'Ember grove action reference facet emberline sequence 7',
                'Ember grove action reference chorus bloom sequence 8',
                'Ember grove action reference lattice ember sequence 9',
                'Ember grove action reference lyric grove sequence 10',
                'Ember grove action reference shimmer branch sequence 11',
                'Ember grove action reference glyph spark sequence 12',
                'Ember grove action reference ribbon root sequence 13',
                'Ember grove action reference arc ash sequence 14',
                'Ember grove action reference petal emberline sequence 15',
                'Ember grove action reference beam bloom sequence 16',
                'Ember grove action reference facet ember sequence 17',
                'Ember grove action reference chorus grove sequence 18',
                'Ember grove action reference lattice branch sequence 19',
                'Ember grove action reference lyric spark sequence 20',
                'Ember grove action reference shimmer root sequence 21',
                'Ember grove action reference glyph ash sequence 22',
                'Ember grove action reference ribbon emberline sequence 23',
                'Ember grove action reference arc bloom sequence 24',
                'Ember grove action reference petal ember sequence 25',
            ];
            const palettes = [
                'Ember grove action palette amber ember sequence 1',
                'Ember grove action palette azure grove sequence 2',
                'Ember grove action palette violet branch sequence 3',
                'Ember grove action palette scarlet spark sequence 4',
                'Ember grove action palette emerald root sequence 5',
                'Ember grove action palette indigo ash sequence 6',
                'Ember grove action palette cobalt emberline sequence 7',
                'Ember grove action palette vermilion bloom sequence 8',
                'Ember grove action palette sepia ember sequence 9',
                'Ember grove action palette silver grove sequence 10',
                'Ember grove action palette amber branch sequence 11',
                'Ember grove action palette azure spark sequence 12',
                'Ember grove action palette violet root sequence 13',
                'Ember grove action palette scarlet ash sequence 14',
                'Ember grove action palette emerald emberline sequence 15',
                'Ember grove action palette indigo bloom sequence 16',
                'Ember grove action palette cobalt ember sequence 17',
                'Ember grove action palette vermilion grove sequence 18',
                'Ember grove action palette sepia branch sequence 19',
                'Ember grove action palette silver spark sequence 20',
                'Ember grove action palette amber root sequence 21',
                'Ember grove action palette azure ash sequence 22',
                'Ember grove action palette violet emberline sequence 23',
                'Ember grove action palette scarlet bloom sequence 24',
                'Ember grove action palette emerald ember sequence 25',
            ];
            const pathways = [
                'Ember grove action pathway causeway ember sequence 1',
                'Ember grove action pathway stair grove sequence 2',
                'Ember grove action pathway balcony branch sequence 3',
                'Ember grove action pathway bridge spark sequence 4',
                'Ember grove action pathway promenade root sequence 5',
                'Ember grove action pathway corridor ash sequence 6',
                'Ember grove action pathway gate emberline sequence 7',
                'Ember grove action pathway atrium bloom sequence 8',
                'Ember grove action pathway garden ember sequence 9',
                'Ember grove action pathway lantern grove sequence 10',
                'Ember grove action pathway causeway branch sequence 11',
                'Ember grove action pathway stair spark sequence 12',
                'Ember grove action pathway balcony root sequence 13',
                'Ember grove action pathway bridge ash sequence 14',
                'Ember grove action pathway promenade emberline sequence 15',
                'Ember grove action pathway corridor bloom sequence 16',
                'Ember grove action pathway gate ember sequence 17',
                'Ember grove action pathway atrium grove sequence 18',
                'Ember grove action pathway garden branch sequence 19',
                'Ember grove action pathway lantern spark sequence 20',
                'Ember grove action pathway causeway root sequence 21',
                'Ember grove action pathway stair ash sequence 22',
                'Ember grove action pathway balcony emberline sequence 23',
                'Ember grove action pathway bridge bloom sequence 24',
                'Ember grove action pathway promenade ember sequence 25',
            ];
            const moments = [
                'Ember grove action moment moment ember sequence 1',
                'Ember grove action moment glimmer grove sequence 2',
                'Ember grove action moment spark branch sequence 3',
                'Ember grove action moment pulse spark sequence 4',
                'Ember grove action moment beat root sequence 5',
                'Ember grove action moment echo ash sequence 6',
                'Ember grove action moment note emberline sequence 7',
                'Ember grove action moment breath bloom sequence 8',
                'Ember grove action moment pause ember sequence 9',
                'Ember grove action moment crescendo grove sequence 10',
                'Ember grove action moment moment branch sequence 11',
                'Ember grove action moment glimmer spark sequence 12',
                'Ember grove action moment spark root sequence 13',
                'Ember grove action moment pulse ash sequence 14',
                'Ember grove action moment beat emberline sequence 15',
                'Ember grove action moment echo bloom sequence 16',
                'Ember grove action moment note ember sequence 17',
                'Ember grove action moment breath grove sequence 18',
                'Ember grove action moment pause branch sequence 19',
                'Ember grove action moment crescendo spark sequence 20',
                'Ember grove action moment moment root sequence 21',
                'Ember grove action moment glimmer ash sequence 22',
                'Ember grove action moment spark emberline sequence 23',
                'Ember grove action moment pulse bloom sequence 24',
                'Ember grove action moment beat ember sequence 25',
            ];
            const renderings = [];
            for (let round = 0; round < variations; round++) {
                for (let index = 0; index < references.length; index++) {
                    const reference = references[index];
                    const palette = palettes[(index + round) % palettes.length];
                    const pathway = pathways[(index + round * 2) % pathways.length];
                    const moment = moments[(index + round * 3) % moments.length];
                    const timestamp = includeTimestamp ? ` @${new Date().toISOString()}` : '';
                    renderings.push(`${style} | ${anchor} | ${reference} | ${palette} | ${pathway} | ${moment}${timestamp}`);
                }
            }
            const luminous = [];
            renderings.forEach((entry, index) => {
                const accentuated = lighten ? entry.toUpperCase() : entry;
                luminous.push(`${index + 1} :: ${accentuated}`);
                if (index % 2 === 0) {
                    luminous.push(`bridge ${index + 1} :: ${anchor}`);
                }
                if (index % 5 === 0) {
                    luminous.push(`style ${style} ripple ${index + 1}`);
                }
            });
            const spool = [];
            const spoolSet = new Set();
            luminous.forEach((item) => {
                if (!spoolSet.has(item)) {
                    spool.push(item);
                    spoolSet.add(item);
                }
            });
            const base = basePayload.trim();
            if (base) {
                spool.unshift(`base::${base}`);
            }
            const newlineChar = String.fromCharCode(10);
            const safeKey = 'fantasy_action_ember_grove';
            clone.vars[`${safeKey}_style`] = style;
            clone.vars[`${safeKey}_renderCount`] = renderings.length;
            clone.vars[`${safeKey}_anchor`] = anchor;
            clone.payload = spool.join(newlineChar);
            clone.logs.push('Ember grove action arranged luminous passages.');
            return [clone];
        }
    },
    {
        id: 'fantasy-action-orbit-script',
        category: 'action',
        name: 'Orbit script action',
        description: 'Orbital scripts spin payload fragments into constellations.',
        icon: 'rotate-cw',
        accent: '#2563eb',
        tags: ['action', 'orbit', 'script', 'fantasy'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { style: 'Orbit script', variations: 3, lighten: false, anchor: 'Celestial chamber', includeTimestamp: false },
        form: [
            { key: 'style', label: 'Style', type: 'text', placeholder: 'Orbit script' },
            { key: 'variations', label: 'Variations', type: 'number', min: 1, max: 12 },
            { key: 'lighten', label: 'Lighten palette', type: 'checkbox' },
            { key: 'anchor', label: 'Anchor', type: 'text', placeholder: 'Celestial chamber' },
            { key: 'includeTimestamp', label: 'Include timestamp', type: 'checkbox' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const basePayload = QuickActionTools.toText(clone.payload ?? '');
            const style = (config?.style || 'Orbit script').trim() || 'Orbit script';
            const variations = Math.max(1, parseInt(config?.variations, 10) || 1);
            const lighten = Boolean(config?.lighten);
            const anchor = (config?.anchor || 'Celestial chamber').trim() || 'Celestial chamber';
            const includeTimestamp = Boolean(config?.includeTimestamp);
            const references = [
                'Orbit script action reference shimmer orbit sequence 1',
                'Orbit script action reference glyph script sequence 2',
                'Orbit script action reference ribbon constellation sequence 3',
                'Orbit script action reference arc loop sequence 4',
                'Orbit script action reference petal planet sequence 5',
                'Orbit script action reference beam trajectory sequence 6',
                'Orbit script action reference facet halo sequence 7',
                'Orbit script action reference chorus ring sequence 8',
                'Orbit script action reference lattice orbit sequence 9',
                'Orbit script action reference lyric script sequence 10',
                'Orbit script action reference shimmer constellation sequence 11',
                'Orbit script action reference glyph loop sequence 12',
                'Orbit script action reference ribbon planet sequence 13',
                'Orbit script action reference arc trajectory sequence 14',
                'Orbit script action reference petal halo sequence 15',
                'Orbit script action reference beam ring sequence 16',
                'Orbit script action reference facet orbit sequence 17',
                'Orbit script action reference chorus script sequence 18',
                'Orbit script action reference lattice constellation sequence 19',
                'Orbit script action reference lyric loop sequence 20',
                'Orbit script action reference shimmer planet sequence 21',
                'Orbit script action reference glyph trajectory sequence 22',
                'Orbit script action reference ribbon halo sequence 23',
                'Orbit script action reference arc ring sequence 24',
                'Orbit script action reference petal orbit sequence 25',
            ];
            const palettes = [
                'Orbit script action palette amber orbit sequence 1',
                'Orbit script action palette azure script sequence 2',
                'Orbit script action palette violet constellation sequence 3',
                'Orbit script action palette scarlet loop sequence 4',
                'Orbit script action palette emerald planet sequence 5',
                'Orbit script action palette indigo trajectory sequence 6',
                'Orbit script action palette cobalt halo sequence 7',
                'Orbit script action palette vermilion ring sequence 8',
                'Orbit script action palette sepia orbit sequence 9',
                'Orbit script action palette silver script sequence 10',
                'Orbit script action palette amber constellation sequence 11',
                'Orbit script action palette azure loop sequence 12',
                'Orbit script action palette violet planet sequence 13',
                'Orbit script action palette scarlet trajectory sequence 14',
                'Orbit script action palette emerald halo sequence 15',
                'Orbit script action palette indigo ring sequence 16',
                'Orbit script action palette cobalt orbit sequence 17',
                'Orbit script action palette vermilion script sequence 18',
                'Orbit script action palette sepia constellation sequence 19',
                'Orbit script action palette silver loop sequence 20',
                'Orbit script action palette amber planet sequence 21',
                'Orbit script action palette azure trajectory sequence 22',
                'Orbit script action palette violet halo sequence 23',
                'Orbit script action palette scarlet ring sequence 24',
                'Orbit script action palette emerald orbit sequence 25',
            ];
            const pathways = [
                'Orbit script action pathway causeway orbit sequence 1',
                'Orbit script action pathway stair script sequence 2',
                'Orbit script action pathway balcony constellation sequence 3',
                'Orbit script action pathway bridge loop sequence 4',
                'Orbit script action pathway promenade planet sequence 5',
                'Orbit script action pathway corridor trajectory sequence 6',
                'Orbit script action pathway gate halo sequence 7',
                'Orbit script action pathway atrium ring sequence 8',
                'Orbit script action pathway garden orbit sequence 9',
                'Orbit script action pathway lantern script sequence 10',
                'Orbit script action pathway causeway constellation sequence 11',
                'Orbit script action pathway stair loop sequence 12',
                'Orbit script action pathway balcony planet sequence 13',
                'Orbit script action pathway bridge trajectory sequence 14',
                'Orbit script action pathway promenade halo sequence 15',
                'Orbit script action pathway corridor ring sequence 16',
                'Orbit script action pathway gate orbit sequence 17',
                'Orbit script action pathway atrium script sequence 18',
                'Orbit script action pathway garden constellation sequence 19',
                'Orbit script action pathway lantern loop sequence 20',
                'Orbit script action pathway causeway planet sequence 21',
                'Orbit script action pathway stair trajectory sequence 22',
                'Orbit script action pathway balcony halo sequence 23',
                'Orbit script action pathway bridge ring sequence 24',
                'Orbit script action pathway promenade orbit sequence 25',
            ];
            const moments = [
                'Orbit script action moment moment orbit sequence 1',
                'Orbit script action moment glimmer script sequence 2',
                'Orbit script action moment spark constellation sequence 3',
                'Orbit script action moment pulse loop sequence 4',
                'Orbit script action moment beat planet sequence 5',
                'Orbit script action moment echo trajectory sequence 6',
                'Orbit script action moment note halo sequence 7',
                'Orbit script action moment breath ring sequence 8',
                'Orbit script action moment pause orbit sequence 9',
                'Orbit script action moment crescendo script sequence 10',
                'Orbit script action moment moment constellation sequence 11',
                'Orbit script action moment glimmer loop sequence 12',
                'Orbit script action moment spark planet sequence 13',
                'Orbit script action moment pulse trajectory sequence 14',
                'Orbit script action moment beat halo sequence 15',
                'Orbit script action moment echo ring sequence 16',
                'Orbit script action moment note orbit sequence 17',
                'Orbit script action moment breath script sequence 18',
                'Orbit script action moment pause constellation sequence 19',
                'Orbit script action moment crescendo loop sequence 20',
                'Orbit script action moment moment planet sequence 21',
                'Orbit script action moment glimmer trajectory sequence 22',
                'Orbit script action moment spark halo sequence 23',
                'Orbit script action moment pulse ring sequence 24',
                'Orbit script action moment beat orbit sequence 25',
            ];
            const renderings = [];
            for (let round = 0; round < variations; round++) {
                for (let index = 0; index < references.length; index++) {
                    const reference = references[index];
                    const palette = palettes[(index + round) % palettes.length];
                    const pathway = pathways[(index + round * 2) % pathways.length];
                    const moment = moments[(index + round * 3) % moments.length];
                    const timestamp = includeTimestamp ? ` @${new Date().toISOString()}` : '';
                    renderings.push(`${style} | ${anchor} | ${reference} | ${palette} | ${pathway} | ${moment}${timestamp}`);
                }
            }
            const luminous = [];
            renderings.forEach((entry, index) => {
                const accentuated = lighten ? entry.toUpperCase() : entry;
                luminous.push(`${index + 1} :: ${accentuated}`);
                if (index % 2 === 0) {
                    luminous.push(`bridge ${index + 1} :: ${anchor}`);
                }
                if (index % 5 === 0) {
                    luminous.push(`style ${style} ripple ${index + 1}`);
                }
            });
            const spool = [];
            const spoolSet = new Set();
            luminous.forEach((item) => {
                if (!spoolSet.has(item)) {
                    spool.push(item);
                    spoolSet.add(item);
                }
            });
            const base = basePayload.trim();
            if (base) {
                spool.unshift(`base::${base}`);
            }
            const newlineChar = String.fromCharCode(10);
            const safeKey = 'fantasy_action_orbit_script';
            clone.vars[`${safeKey}_style`] = style;
            clone.vars[`${safeKey}_renderCount`] = renderings.length;
            clone.vars[`${safeKey}_anchor`] = anchor;
            clone.payload = spool.join(newlineChar);
            clone.logs.push('Orbit script action arranged luminous passages.');
            return [clone];
        }
    },
    {
        id: 'fantasy-action-velvet-path',
        category: 'action',
        name: 'Velvet path action',
        description: 'Lay payload along velvet paths illuminated by dew.',
        icon: 'toggle-right',
        accent: '#ec4899',
        tags: ['action', 'velvet', 'path', 'fantasy'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { style: 'Velvet path', variations: 3, lighten: false, anchor: 'Velvet promenade', includeTimestamp: false },
        form: [
            { key: 'style', label: 'Style', type: 'text', placeholder: 'Velvet path' },
            { key: 'variations', label: 'Variations', type: 'number', min: 1, max: 12 },
            { key: 'lighten', label: 'Lighten palette', type: 'checkbox' },
            { key: 'anchor', label: 'Anchor', type: 'text', placeholder: 'Velvet promenade' },
            { key: 'includeTimestamp', label: 'Include timestamp', type: 'checkbox' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const basePayload = QuickActionTools.toText(clone.payload ?? '');
            const style = (config?.style || 'Velvet path').trim() || 'Velvet path';
            const variations = Math.max(1, parseInt(config?.variations, 10) || 1);
            const lighten = Boolean(config?.lighten);
            const anchor = (config?.anchor || 'Velvet promenade').trim() || 'Velvet promenade';
            const includeTimestamp = Boolean(config?.includeTimestamp);
            const references = [
                'Velvet path action reference shimmer velvet sequence 1',
                'Velvet path action reference glyph path sequence 2',
                'Velvet path action reference ribbon trail sequence 3',
                'Velvet path action reference arc soft sequence 4',
                'Velvet path action reference petal glow sequence 5',
                'Velvet path action reference beam petal sequence 6',
                'Velvet path action reference facet twilight sequence 7',
                'Velvet path action reference chorus bloom sequence 8',
                'Velvet path action reference lattice velvet sequence 9',
                'Velvet path action reference lyric path sequence 10',
                'Velvet path action reference shimmer trail sequence 11',
                'Velvet path action reference glyph soft sequence 12',
                'Velvet path action reference ribbon glow sequence 13',
                'Velvet path action reference arc petal sequence 14',
                'Velvet path action reference petal twilight sequence 15',
                'Velvet path action reference beam bloom sequence 16',
                'Velvet path action reference facet velvet sequence 17',
                'Velvet path action reference chorus path sequence 18',
                'Velvet path action reference lattice trail sequence 19',
                'Velvet path action reference lyric soft sequence 20',
                'Velvet path action reference shimmer glow sequence 21',
                'Velvet path action reference glyph petal sequence 22',
                'Velvet path action reference ribbon twilight sequence 23',
                'Velvet path action reference arc bloom sequence 24',
                'Velvet path action reference petal velvet sequence 25',
            ];
            const palettes = [
                'Velvet path action palette amber velvet sequence 1',
                'Velvet path action palette azure path sequence 2',
                'Velvet path action palette violet trail sequence 3',
                'Velvet path action palette scarlet soft sequence 4',
                'Velvet path action palette emerald glow sequence 5',
                'Velvet path action palette indigo petal sequence 6',
                'Velvet path action palette cobalt twilight sequence 7',
                'Velvet path action palette vermilion bloom sequence 8',
                'Velvet path action palette sepia velvet sequence 9',
                'Velvet path action palette silver path sequence 10',
                'Velvet path action palette amber trail sequence 11',
                'Velvet path action palette azure soft sequence 12',
                'Velvet path action palette violet glow sequence 13',
                'Velvet path action palette scarlet petal sequence 14',
                'Velvet path action palette emerald twilight sequence 15',
                'Velvet path action palette indigo bloom sequence 16',
                'Velvet path action palette cobalt velvet sequence 17',
                'Velvet path action palette vermilion path sequence 18',
                'Velvet path action palette sepia trail sequence 19',
                'Velvet path action palette silver soft sequence 20',
                'Velvet path action palette amber glow sequence 21',
                'Velvet path action palette azure petal sequence 22',
                'Velvet path action palette violet twilight sequence 23',
                'Velvet path action palette scarlet bloom sequence 24',
                'Velvet path action palette emerald velvet sequence 25',
            ];
            const pathways = [
                'Velvet path action pathway causeway velvet sequence 1',
                'Velvet path action pathway stair path sequence 2',
                'Velvet path action pathway balcony trail sequence 3',
                'Velvet path action pathway bridge soft sequence 4',
                'Velvet path action pathway promenade glow sequence 5',
                'Velvet path action pathway corridor petal sequence 6',
                'Velvet path action pathway gate twilight sequence 7',
                'Velvet path action pathway atrium bloom sequence 8',
                'Velvet path action pathway garden velvet sequence 9',
                'Velvet path action pathway lantern path sequence 10',
                'Velvet path action pathway causeway trail sequence 11',
                'Velvet path action pathway stair soft sequence 12',
                'Velvet path action pathway balcony glow sequence 13',
                'Velvet path action pathway bridge petal sequence 14',
                'Velvet path action pathway promenade twilight sequence 15',
                'Velvet path action pathway corridor bloom sequence 16',
                'Velvet path action pathway gate velvet sequence 17',
                'Velvet path action pathway atrium path sequence 18',
                'Velvet path action pathway garden trail sequence 19',
                'Velvet path action pathway lantern soft sequence 20',
                'Velvet path action pathway causeway glow sequence 21',
                'Velvet path action pathway stair petal sequence 22',
                'Velvet path action pathway balcony twilight sequence 23',
                'Velvet path action pathway bridge bloom sequence 24',
                'Velvet path action pathway promenade velvet sequence 25',
            ];
            const moments = [
                'Velvet path action moment moment velvet sequence 1',
                'Velvet path action moment glimmer path sequence 2',
                'Velvet path action moment spark trail sequence 3',
                'Velvet path action moment pulse soft sequence 4',
                'Velvet path action moment beat glow sequence 5',
                'Velvet path action moment echo petal sequence 6',
                'Velvet path action moment note twilight sequence 7',
                'Velvet path action moment breath bloom sequence 8',
                'Velvet path action moment pause velvet sequence 9',
                'Velvet path action moment crescendo path sequence 10',
                'Velvet path action moment moment trail sequence 11',
                'Velvet path action moment glimmer soft sequence 12',
                'Velvet path action moment spark glow sequence 13',
                'Velvet path action moment pulse petal sequence 14',
                'Velvet path action moment beat twilight sequence 15',
                'Velvet path action moment echo bloom sequence 16',
                'Velvet path action moment note velvet sequence 17',
                'Velvet path action moment breath path sequence 18',
                'Velvet path action moment pause trail sequence 19',
                'Velvet path action moment crescendo soft sequence 20',
                'Velvet path action moment moment glow sequence 21',
                'Velvet path action moment glimmer petal sequence 22',
                'Velvet path action moment spark twilight sequence 23',
                'Velvet path action moment pulse bloom sequence 24',
                'Velvet path action moment beat velvet sequence 25',
            ];
            const renderings = [];
            for (let round = 0; round < variations; round++) {
                for (let index = 0; index < references.length; index++) {
                    const reference = references[index];
                    const palette = palettes[(index + round) % palettes.length];
                    const pathway = pathways[(index + round * 2) % pathways.length];
                    const moment = moments[(index + round * 3) % moments.length];
                    const timestamp = includeTimestamp ? ` @${new Date().toISOString()}` : '';
                    renderings.push(`${style} | ${anchor} | ${reference} | ${palette} | ${pathway} | ${moment}${timestamp}`);
                }
            }
            const luminous = [];
            renderings.forEach((entry, index) => {
                const accentuated = lighten ? entry.toUpperCase() : entry;
                luminous.push(`${index + 1} :: ${accentuated}`);
                if (index % 2 === 0) {
                    luminous.push(`bridge ${index + 1} :: ${anchor}`);
                }
                if (index % 5 === 0) {
                    luminous.push(`style ${style} ripple ${index + 1}`);
                }
            });
            const spool = [];
            const spoolSet = new Set();
            luminous.forEach((item) => {
                if (!spoolSet.has(item)) {
                    spool.push(item);
                    spoolSet.add(item);
                }
            });
            const base = basePayload.trim();
            if (base) {
                spool.unshift(`base::${base}`);
            }
            const newlineChar = String.fromCharCode(10);
            const safeKey = 'fantasy_action_velvet_path';
            clone.vars[`${safeKey}_style`] = style;
            clone.vars[`${safeKey}_renderCount`] = renderings.length;
            clone.vars[`${safeKey}_anchor`] = anchor;
            clone.payload = spool.join(newlineChar);
            clone.logs.push('Velvet path action arranged luminous passages.');
            return [clone];
        }
    },
    {
        id: 'fantasy-utility-archive-garden',
        category: 'utility',
        name: 'Archive garden utility',
        description: 'Organise payload into archive garden terraces and rows.',
        icon: 'archive',
        accent: '#22c55e',
        tags: ['utility', 'archive', 'garden', 'fantasy'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { mode: 'Archive gardening', sections: 4, emphasise: true, prefix: 'Archive garden', annotate: true },
        form: [
            { key: 'mode', label: 'Mode', type: 'text', placeholder: 'Archive gardening' },
            { key: 'sections', label: 'Sections', type: 'number', min: 1, max: 12 },
            { key: 'emphasise', label: 'Emphasise highlights', type: 'checkbox' },
            { key: 'prefix', label: 'Prefix', type: 'text', placeholder: 'Archive garden' },
            { key: 'annotate', label: 'Add annotations', type: 'checkbox' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const basePayload = QuickActionTools.toText(clone.payload ?? '');
            const mode = (config?.mode || 'Archive gardening').trim() || 'Archive gardening';
            const sections = Math.max(1, parseInt(config?.sections, 10) || 1);
            const emphasise = config?.emphasise !== false;
            const prefix = (config?.prefix || 'Archive garden').trim() || 'Archive garden';
            const annotate = config?.annotate !== false;
            const scaffolding = [
                'Archive garden utility scaffold terrace archive sequence 1',
                'Archive garden utility scaffold stack garden sequence 2',
                'Archive garden utility scaffold ledger terrace sequence 3',
                'Archive garden utility scaffold panel seed sequence 4',
                'Archive garden utility scaffold canvas path sequence 5',
                'Archive garden utility scaffold folio hedge sequence 6',
                'Archive garden utility scaffold compartment catalog sequence 7',
                'Archive garden utility scaffold parcel sprout sequence 8',
                'Archive garden utility scaffold balustrade archive sequence 9',
                'Archive garden utility scaffold grid garden sequence 10',
                'Archive garden utility scaffold terrace terrace sequence 11',
                'Archive garden utility scaffold stack seed sequence 12',
                'Archive garden utility scaffold ledger path sequence 13',
                'Archive garden utility scaffold panel hedge sequence 14',
                'Archive garden utility scaffold canvas catalog sequence 15',
                'Archive garden utility scaffold folio sprout sequence 16',
                'Archive garden utility scaffold compartment archive sequence 17',
                'Archive garden utility scaffold parcel garden sequence 18',
                'Archive garden utility scaffold balustrade terrace sequence 19',
                'Archive garden utility scaffold grid seed sequence 20',
                'Archive garden utility scaffold terrace path sequence 21',
                'Archive garden utility scaffold stack hedge sequence 22',
                'Archive garden utility scaffold ledger catalog sequence 23',
                'Archive garden utility scaffold panel sprout sequence 24',
                'Archive garden utility scaffold canvas archive sequence 25',
            ];
            const structures = [
                'Archive garden utility structure arch archive sequence 1',
                'Archive garden utility structure grove garden sequence 2',
                'Archive garden utility structure harbor terrace sequence 3',
                'Archive garden utility structure vault seed sequence 4',
                'Archive garden utility structure arcade path sequence 5',
                'Archive garden utility structure meadow hedge sequence 6',
                'Archive garden utility structure spire catalog sequence 7',
                'Archive garden utility structure tunnel sprout sequence 8',
                'Archive garden utility structure causeway archive sequence 9',
                'Archive garden utility structure hall garden sequence 10',
                'Archive garden utility structure arch terrace sequence 11',
                'Archive garden utility structure grove seed sequence 12',
                'Archive garden utility structure harbor path sequence 13',
                'Archive garden utility structure vault hedge sequence 14',
                'Archive garden utility structure arcade catalog sequence 15',
                'Archive garden utility structure meadow sprout sequence 16',
                'Archive garden utility structure spire archive sequence 17',
                'Archive garden utility structure tunnel garden sequence 18',
                'Archive garden utility structure causeway terrace sequence 19',
                'Archive garden utility structure hall seed sequence 20',
                'Archive garden utility structure arch path sequence 21',
                'Archive garden utility structure grove hedge sequence 22',
                'Archive garden utility structure harbor catalog sequence 23',
                'Archive garden utility structure vault sprout sequence 24',
                'Archive garden utility structure arcade archive sequence 25',
            ];
            const signals = [
                'Archive garden utility signal beacon archive sequence 1',
                'Archive garden utility signal spark garden sequence 2',
                'Archive garden utility signal signal terrace sequence 3',
                'Archive garden utility signal marker seed sequence 4',
                'Archive garden utility signal glyph path sequence 5',
                'Archive garden utility signal echo hedge sequence 6',
                'Archive garden utility signal whisper catalog sequence 7',
                'Archive garden utility signal song sprout sequence 8',
                'Archive garden utility signal trail archive sequence 9',
                'Archive garden utility signal gleam garden sequence 10',
                'Archive garden utility signal beacon terrace sequence 11',
                'Archive garden utility signal spark seed sequence 12',
                'Archive garden utility signal signal path sequence 13',
                'Archive garden utility signal marker hedge sequence 14',
                'Archive garden utility signal glyph catalog sequence 15',
                'Archive garden utility signal echo sprout sequence 16',
                'Archive garden utility signal whisper archive sequence 17',
                'Archive garden utility signal song garden sequence 18',
                'Archive garden utility signal trail terrace sequence 19',
                'Archive garden utility signal gleam seed sequence 20',
                'Archive garden utility signal beacon path sequence 21',
                'Archive garden utility signal spark hedge sequence 22',
                'Archive garden utility signal signal catalog sequence 23',
                'Archive garden utility signal marker sprout sequence 24',
                'Archive garden utility signal glyph archive sequence 25',
            ];
            const adornments = [
                'Archive garden utility adornment lantern archive sequence 1',
                'Archive garden utility adornment rune garden sequence 2',
                'Archive garden utility adornment ribbon terrace sequence 3',
                'Archive garden utility adornment petal seed sequence 4',
                'Archive garden utility adornment feather path sequence 5',
                'Archive garden utility adornment stone hedge sequence 6',
                'Archive garden utility adornment dew catalog sequence 7',
                'Archive garden utility adornment light sprout sequence 8',
                'Archive garden utility adornment mirror archive sequence 9',
                'Archive garden utility adornment glow garden sequence 10',
                'Archive garden utility adornment lantern terrace sequence 11',
                'Archive garden utility adornment rune seed sequence 12',
                'Archive garden utility adornment ribbon path sequence 13',
                'Archive garden utility adornment petal hedge sequence 14',
                'Archive garden utility adornment feather catalog sequence 15',
                'Archive garden utility adornment stone sprout sequence 16',
                'Archive garden utility adornment dew archive sequence 17',
                'Archive garden utility adornment light garden sequence 18',
                'Archive garden utility adornment mirror terrace sequence 19',
                'Archive garden utility adornment glow seed sequence 20',
                'Archive garden utility adornment lantern path sequence 21',
                'Archive garden utility adornment rune hedge sequence 22',
                'Archive garden utility adornment ribbon catalog sequence 23',
                'Archive garden utility adornment petal sprout sequence 24',
                'Archive garden utility adornment feather archive sequence 25',
            ];
            const organised = [];
            for (let segment = 0; segment < sections; segment++) {
                for (let index = 0; index < scaffolding.length; index++) {
                    const scaffold = scaffolding[index];
                    const structure = structures[(index + segment) % structures.length];
                    const signal = signals[(index + segment * 2) % signals.length];
                    const adornment = adornments[(index + segment * 3) % adornments.length];
                    const emphasis = emphasise && index % 2 === 0 ? 'highlight' : 'soft';
                    organised.push(`${prefix} | ${mode} | section ${segment + 1} | ${scaffold} | ${structure} | ${signal} | ${adornment} | emphasis ${emphasis}`);
                }
            }
            const annotations = [];
            organised.forEach((entry, index) => {
                annotations.push(`${index + 1} :: ${entry}`);
                if (annotate && index % 3 === 0) {
                    annotations.push(`note ${index + 1} :: ${prefix} anchors ${mode}`);
                }
                if (annotate && index % 5 === 0) {
                    annotations.push(`guide ${index + 1} :: signal ${signals[index % signals.length]}`);
                }
            });
            const cleaned = [];
            const seen = new Set();
            annotations.forEach((item) => {
                if (!seen.has(item)) {
                    cleaned.push(item);
                    seen.add(item);
                }
            });
            const base = basePayload.trim();
            if (base) {
                cleaned.unshift(`base::${base}`);
            }
            const newlineChar = String.fromCharCode(10);
            const safeKey = 'fantasy_utility_archive_garden';
            clone.vars[`${safeKey}_mode`] = mode;
            clone.vars[`${safeKey}_sections`] = sections;
            clone.vars[`${safeKey}_entries`] = cleaned.length;
            clone.payload = cleaned.join(newlineChar);
            clone.logs.push('Archive garden utility organised payload terraces.');
            return [clone];
        }
    },
    {
        id: 'fantasy-utility-constellation-ledger',
        category: 'utility',
        name: 'Constellation ledger utility',
        description: 'Ledger payload constellations across nightly registers.',
        icon: 'star',
        accent: '#38bdf8',
        tags: ['utility', 'constellation', 'ledger', 'fantasy'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { mode: 'Constellation ledgering', sections: 4, emphasise: true, prefix: 'Constellation ledger', annotate: true },
        form: [
            { key: 'mode', label: 'Mode', type: 'text', placeholder: 'Constellation ledgering' },
            { key: 'sections', label: 'Sections', type: 'number', min: 1, max: 12 },
            { key: 'emphasise', label: 'Emphasise highlights', type: 'checkbox' },
            { key: 'prefix', label: 'Prefix', type: 'text', placeholder: 'Constellation ledger' },
            { key: 'annotate', label: 'Add annotations', type: 'checkbox' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const basePayload = QuickActionTools.toText(clone.payload ?? '');
            const mode = (config?.mode || 'Constellation ledgering').trim() || 'Constellation ledgering';
            const sections = Math.max(1, parseInt(config?.sections, 10) || 1);
            const emphasise = config?.emphasise !== false;
            const prefix = (config?.prefix || 'Constellation ledger').trim() || 'Constellation ledger';
            const annotate = config?.annotate !== false;
            const scaffolding = [
                'Constellation ledger utility scaffold terrace constellation sequence 1',
                'Constellation ledger utility scaffold stack ledger sequence 2',
                'Constellation ledger utility scaffold ledger night sequence 3',
                'Constellation ledger utility scaffold panel chart sequence 4',
                'Constellation ledger utility scaffold canvas orbit sequence 5',
                'Constellation ledger utility scaffold folio spark sequence 6',
                'Constellation ledger utility scaffold compartment cluster sequence 7',
                'Constellation ledger utility scaffold parcel line sequence 8',
                'Constellation ledger utility scaffold balustrade constellation sequence 9',
                'Constellation ledger utility scaffold grid ledger sequence 10',
                'Constellation ledger utility scaffold terrace night sequence 11',
                'Constellation ledger utility scaffold stack chart sequence 12',
                'Constellation ledger utility scaffold ledger orbit sequence 13',
                'Constellation ledger utility scaffold panel spark sequence 14',
                'Constellation ledger utility scaffold canvas cluster sequence 15',
                'Constellation ledger utility scaffold folio line sequence 16',
                'Constellation ledger utility scaffold compartment constellation sequence 17',
                'Constellation ledger utility scaffold parcel ledger sequence 18',
                'Constellation ledger utility scaffold balustrade night sequence 19',
                'Constellation ledger utility scaffold grid chart sequence 20',
                'Constellation ledger utility scaffold terrace orbit sequence 21',
                'Constellation ledger utility scaffold stack spark sequence 22',
                'Constellation ledger utility scaffold ledger cluster sequence 23',
                'Constellation ledger utility scaffold panel line sequence 24',
                'Constellation ledger utility scaffold canvas constellation sequence 25',
            ];
            const structures = [
                'Constellation ledger utility structure arch constellation sequence 1',
                'Constellation ledger utility structure grove ledger sequence 2',
                'Constellation ledger utility structure harbor night sequence 3',
                'Constellation ledger utility structure vault chart sequence 4',
                'Constellation ledger utility structure arcade orbit sequence 5',
                'Constellation ledger utility structure meadow spark sequence 6',
                'Constellation ledger utility structure spire cluster sequence 7',
                'Constellation ledger utility structure tunnel line sequence 8',
                'Constellation ledger utility structure causeway constellation sequence 9',
                'Constellation ledger utility structure hall ledger sequence 10',
                'Constellation ledger utility structure arch night sequence 11',
                'Constellation ledger utility structure grove chart sequence 12',
                'Constellation ledger utility structure harbor orbit sequence 13',
                'Constellation ledger utility structure vault spark sequence 14',
                'Constellation ledger utility structure arcade cluster sequence 15',
                'Constellation ledger utility structure meadow line sequence 16',
                'Constellation ledger utility structure spire constellation sequence 17',
                'Constellation ledger utility structure tunnel ledger sequence 18',
                'Constellation ledger utility structure causeway night sequence 19',
                'Constellation ledger utility structure hall chart sequence 20',
                'Constellation ledger utility structure arch orbit sequence 21',
                'Constellation ledger utility structure grove spark sequence 22',
                'Constellation ledger utility structure harbor cluster sequence 23',
                'Constellation ledger utility structure vault line sequence 24',
                'Constellation ledger utility structure arcade constellation sequence 25',
            ];
            const signals = [
                'Constellation ledger utility signal beacon constellation sequence 1',
                'Constellation ledger utility signal spark ledger sequence 2',
                'Constellation ledger utility signal signal night sequence 3',
                'Constellation ledger utility signal marker chart sequence 4',
                'Constellation ledger utility signal glyph orbit sequence 5',
                'Constellation ledger utility signal echo spark sequence 6',
                'Constellation ledger utility signal whisper cluster sequence 7',
                'Constellation ledger utility signal song line sequence 8',
                'Constellation ledger utility signal trail constellation sequence 9',
                'Constellation ledger utility signal gleam ledger sequence 10',
                'Constellation ledger utility signal beacon night sequence 11',
                'Constellation ledger utility signal spark chart sequence 12',
                'Constellation ledger utility signal signal orbit sequence 13',
                'Constellation ledger utility signal marker spark sequence 14',
                'Constellation ledger utility signal glyph cluster sequence 15',
                'Constellation ledger utility signal echo line sequence 16',
                'Constellation ledger utility signal whisper constellation sequence 17',
                'Constellation ledger utility signal song ledger sequence 18',
                'Constellation ledger utility signal trail night sequence 19',
                'Constellation ledger utility signal gleam chart sequence 20',
                'Constellation ledger utility signal beacon orbit sequence 21',
                'Constellation ledger utility signal spark spark sequence 22',
                'Constellation ledger utility signal signal cluster sequence 23',
                'Constellation ledger utility signal marker line sequence 24',
                'Constellation ledger utility signal glyph constellation sequence 25',
            ];
            const adornments = [
                'Constellation ledger utility adornment lantern constellation sequence 1',
                'Constellation ledger utility adornment rune ledger sequence 2',
                'Constellation ledger utility adornment ribbon night sequence 3',
                'Constellation ledger utility adornment petal chart sequence 4',
                'Constellation ledger utility adornment feather orbit sequence 5',
                'Constellation ledger utility adornment stone spark sequence 6',
                'Constellation ledger utility adornment dew cluster sequence 7',
                'Constellation ledger utility adornment light line sequence 8',
                'Constellation ledger utility adornment mirror constellation sequence 9',
                'Constellation ledger utility adornment glow ledger sequence 10',
                'Constellation ledger utility adornment lantern night sequence 11',
                'Constellation ledger utility adornment rune chart sequence 12',
                'Constellation ledger utility adornment ribbon orbit sequence 13',
                'Constellation ledger utility adornment petal spark sequence 14',
                'Constellation ledger utility adornment feather cluster sequence 15',
                'Constellation ledger utility adornment stone line sequence 16',
                'Constellation ledger utility adornment dew constellation sequence 17',
                'Constellation ledger utility adornment light ledger sequence 18',
                'Constellation ledger utility adornment mirror night sequence 19',
                'Constellation ledger utility adornment glow chart sequence 20',
                'Constellation ledger utility adornment lantern orbit sequence 21',
                'Constellation ledger utility adornment rune spark sequence 22',
                'Constellation ledger utility adornment ribbon cluster sequence 23',
                'Constellation ledger utility adornment petal line sequence 24',
                'Constellation ledger utility adornment feather constellation sequence 25',
            ];
            const organised = [];
            for (let segment = 0; segment < sections; segment++) {
                for (let index = 0; index < scaffolding.length; index++) {
                    const scaffold = scaffolding[index];
                    const structure = structures[(index + segment) % structures.length];
                    const signal = signals[(index + segment * 2) % signals.length];
                    const adornment = adornments[(index + segment * 3) % adornments.length];
                    const emphasis = emphasise && index % 2 === 0 ? 'highlight' : 'soft';
                    organised.push(`${prefix} | ${mode} | section ${segment + 1} | ${scaffold} | ${structure} | ${signal} | ${adornment} | emphasis ${emphasis}`);
                }
            }
            const annotations = [];
            organised.forEach((entry, index) => {
                annotations.push(`${index + 1} :: ${entry}`);
                if (annotate && index % 3 === 0) {
                    annotations.push(`note ${index + 1} :: ${prefix} anchors ${mode}`);
                }
                if (annotate && index % 5 === 0) {
                    annotations.push(`guide ${index + 1} :: signal ${signals[index % signals.length]}`);
                }
            });
            const cleaned = [];
            const seen = new Set();
            annotations.forEach((item) => {
                if (!seen.has(item)) {
                    cleaned.push(item);
                    seen.add(item);
                }
            });
            const base = basePayload.trim();
            if (base) {
                cleaned.unshift(`base::${base}`);
            }
            const newlineChar = String.fromCharCode(10);
            const safeKey = 'fantasy_utility_constellation_ledger';
            clone.vars[`${safeKey}_mode`] = mode;
            clone.vars[`${safeKey}_sections`] = sections;
            clone.vars[`${safeKey}_entries`] = cleaned.length;
            clone.payload = cleaned.join(newlineChar);
            clone.logs.push('Constellation ledger utility organised payload terraces.');
            return [clone];
        }
    },
    {
        id: 'fantasy-utility-rhythm-index',
        category: 'utility',
        name: 'Rhythm index utility',
        description: 'Index payload beats into rhythm sections and stanzas.',
        icon: 'list',
        accent: '#f59e0b',
        tags: ['utility', 'rhythm', 'index', 'fantasy'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { mode: 'Rhythm indexing', sections: 4, emphasise: true, prefix: 'Rhythm index', annotate: true },
        form: [
            { key: 'mode', label: 'Mode', type: 'text', placeholder: 'Rhythm indexing' },
            { key: 'sections', label: 'Sections', type: 'number', min: 1, max: 12 },
            { key: 'emphasise', label: 'Emphasise highlights', type: 'checkbox' },
            { key: 'prefix', label: 'Prefix', type: 'text', placeholder: 'Rhythm index' },
            { key: 'annotate', label: 'Add annotations', type: 'checkbox' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const basePayload = QuickActionTools.toText(clone.payload ?? '');
            const mode = (config?.mode || 'Rhythm indexing').trim() || 'Rhythm indexing';
            const sections = Math.max(1, parseInt(config?.sections, 10) || 1);
            const emphasise = config?.emphasise !== false;
            const prefix = (config?.prefix || 'Rhythm index').trim() || 'Rhythm index';
            const annotate = config?.annotate !== false;
            const scaffolding = [
                'Rhythm index utility scaffold terrace rhythm sequence 1',
                'Rhythm index utility scaffold stack index sequence 2',
                'Rhythm index utility scaffold ledger beat sequence 3',
                'Rhythm index utility scaffold panel meter sequence 4',
                'Rhythm index utility scaffold canvas stanza sequence 5',
                'Rhythm index utility scaffold folio cadence sequence 6',
                'Rhythm index utility scaffold compartment tempo sequence 7',
                'Rhythm index utility scaffold parcel chart sequence 8',
                'Rhythm index utility scaffold balustrade rhythm sequence 9',
                'Rhythm index utility scaffold grid index sequence 10',
                'Rhythm index utility scaffold terrace beat sequence 11',
                'Rhythm index utility scaffold stack meter sequence 12',
                'Rhythm index utility scaffold ledger stanza sequence 13',
                'Rhythm index utility scaffold panel cadence sequence 14',
                'Rhythm index utility scaffold canvas tempo sequence 15',
                'Rhythm index utility scaffold folio chart sequence 16',
                'Rhythm index utility scaffold compartment rhythm sequence 17',
                'Rhythm index utility scaffold parcel index sequence 18',
                'Rhythm index utility scaffold balustrade beat sequence 19',
                'Rhythm index utility scaffold grid meter sequence 20',
                'Rhythm index utility scaffold terrace stanza sequence 21',
                'Rhythm index utility scaffold stack cadence sequence 22',
                'Rhythm index utility scaffold ledger tempo sequence 23',
                'Rhythm index utility scaffold panel chart sequence 24',
                'Rhythm index utility scaffold canvas rhythm sequence 25',
            ];
            const structures = [
                'Rhythm index utility structure arch rhythm sequence 1',
                'Rhythm index utility structure grove index sequence 2',
                'Rhythm index utility structure harbor beat sequence 3',
                'Rhythm index utility structure vault meter sequence 4',
                'Rhythm index utility structure arcade stanza sequence 5',
                'Rhythm index utility structure meadow cadence sequence 6',
                'Rhythm index utility structure spire tempo sequence 7',
                'Rhythm index utility structure tunnel chart sequence 8',
                'Rhythm index utility structure causeway rhythm sequence 9',
                'Rhythm index utility structure hall index sequence 10',
                'Rhythm index utility structure arch beat sequence 11',
                'Rhythm index utility structure grove meter sequence 12',
                'Rhythm index utility structure harbor stanza sequence 13',
                'Rhythm index utility structure vault cadence sequence 14',
                'Rhythm index utility structure arcade tempo sequence 15',
                'Rhythm index utility structure meadow chart sequence 16',
                'Rhythm index utility structure spire rhythm sequence 17',
                'Rhythm index utility structure tunnel index sequence 18',
                'Rhythm index utility structure causeway beat sequence 19',
                'Rhythm index utility structure hall meter sequence 20',
                'Rhythm index utility structure arch stanza sequence 21',
                'Rhythm index utility structure grove cadence sequence 22',
                'Rhythm index utility structure harbor tempo sequence 23',
                'Rhythm index utility structure vault chart sequence 24',
                'Rhythm index utility structure arcade rhythm sequence 25',
            ];
            const signals = [
                'Rhythm index utility signal beacon rhythm sequence 1',
                'Rhythm index utility signal spark index sequence 2',
                'Rhythm index utility signal signal beat sequence 3',
                'Rhythm index utility signal marker meter sequence 4',
                'Rhythm index utility signal glyph stanza sequence 5',
                'Rhythm index utility signal echo cadence sequence 6',
                'Rhythm index utility signal whisper tempo sequence 7',
                'Rhythm index utility signal song chart sequence 8',
                'Rhythm index utility signal trail rhythm sequence 9',
                'Rhythm index utility signal gleam index sequence 10',
                'Rhythm index utility signal beacon beat sequence 11',
                'Rhythm index utility signal spark meter sequence 12',
                'Rhythm index utility signal signal stanza sequence 13',
                'Rhythm index utility signal marker cadence sequence 14',
                'Rhythm index utility signal glyph tempo sequence 15',
                'Rhythm index utility signal echo chart sequence 16',
                'Rhythm index utility signal whisper rhythm sequence 17',
                'Rhythm index utility signal song index sequence 18',
                'Rhythm index utility signal trail beat sequence 19',
                'Rhythm index utility signal gleam meter sequence 20',
                'Rhythm index utility signal beacon stanza sequence 21',
                'Rhythm index utility signal spark cadence sequence 22',
                'Rhythm index utility signal signal tempo sequence 23',
                'Rhythm index utility signal marker chart sequence 24',
                'Rhythm index utility signal glyph rhythm sequence 25',
            ];
            const adornments = [
                'Rhythm index utility adornment lantern rhythm sequence 1',
                'Rhythm index utility adornment rune index sequence 2',
                'Rhythm index utility adornment ribbon beat sequence 3',
                'Rhythm index utility adornment petal meter sequence 4',
                'Rhythm index utility adornment feather stanza sequence 5',
                'Rhythm index utility adornment stone cadence sequence 6',
                'Rhythm index utility adornment dew tempo sequence 7',
                'Rhythm index utility adornment light chart sequence 8',
                'Rhythm index utility adornment mirror rhythm sequence 9',
                'Rhythm index utility adornment glow index sequence 10',
                'Rhythm index utility adornment lantern beat sequence 11',
                'Rhythm index utility adornment rune meter sequence 12',
                'Rhythm index utility adornment ribbon stanza sequence 13',
                'Rhythm index utility adornment petal cadence sequence 14',
                'Rhythm index utility adornment feather tempo sequence 15',
                'Rhythm index utility adornment stone chart sequence 16',
                'Rhythm index utility adornment dew rhythm sequence 17',
                'Rhythm index utility adornment light index sequence 18',
                'Rhythm index utility adornment mirror beat sequence 19',
                'Rhythm index utility adornment glow meter sequence 20',
                'Rhythm index utility adornment lantern stanza sequence 21',
                'Rhythm index utility adornment rune cadence sequence 22',
                'Rhythm index utility adornment ribbon tempo sequence 23',
                'Rhythm index utility adornment petal chart sequence 24',
                'Rhythm index utility adornment feather rhythm sequence 25',
            ];
            const organised = [];
            for (let segment = 0; segment < sections; segment++) {
                for (let index = 0; index < scaffolding.length; index++) {
                    const scaffold = scaffolding[index];
                    const structure = structures[(index + segment) % structures.length];
                    const signal = signals[(index + segment * 2) % signals.length];
                    const adornment = adornments[(index + segment * 3) % adornments.length];
                    const emphasis = emphasise && index % 2 === 0 ? 'highlight' : 'soft';
                    organised.push(`${prefix} | ${mode} | section ${segment + 1} | ${scaffold} | ${structure} | ${signal} | ${adornment} | emphasis ${emphasis}`);
                }
            }
            const annotations = [];
            organised.forEach((entry, index) => {
                annotations.push(`${index + 1} :: ${entry}`);
                if (annotate && index % 3 === 0) {
                    annotations.push(`note ${index + 1} :: ${prefix} anchors ${mode}`);
                }
                if (annotate && index % 5 === 0) {
                    annotations.push(`guide ${index + 1} :: signal ${signals[index % signals.length]}`);
                }
            });
            const cleaned = [];
            const seen = new Set();
            annotations.forEach((item) => {
                if (!seen.has(item)) {
                    cleaned.push(item);
                    seen.add(item);
                }
            });
            const base = basePayload.trim();
            if (base) {
                cleaned.unshift(`base::${base}`);
            }
            const newlineChar = String.fromCharCode(10);
            const safeKey = 'fantasy_utility_rhythm_index';
            clone.vars[`${safeKey}_mode`] = mode;
            clone.vars[`${safeKey}_sections`] = sections;
            clone.vars[`${safeKey}_entries`] = cleaned.length;
            clone.payload = cleaned.join(newlineChar);
            clone.logs.push('Rhythm index utility organised payload terraces.');
            return [clone];
        }
    },
    {
        id: 'fantasy-utility-harbor-folio',
        category: 'utility',
        name: 'Harbor folio utility',
        description: 'Arrange harbor folios with moored paragraphs and notes.',
        icon: 'folder',
        accent: '#3b82f6',
        tags: ['utility', 'harbor', 'folio', 'fantasy'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { mode: 'Harbor folio', sections: 4, emphasise: true, prefix: 'Harbor folio', annotate: true },
        form: [
            { key: 'mode', label: 'Mode', type: 'text', placeholder: 'Harbor folio' },
            { key: 'sections', label: 'Sections', type: 'number', min: 1, max: 12 },
            { key: 'emphasise', label: 'Emphasise highlights', type: 'checkbox' },
            { key: 'prefix', label: 'Prefix', type: 'text', placeholder: 'Harbor folio' },
            { key: 'annotate', label: 'Add annotations', type: 'checkbox' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const basePayload = QuickActionTools.toText(clone.payload ?? '');
            const mode = (config?.mode || 'Harbor folio').trim() || 'Harbor folio';
            const sections = Math.max(1, parseInt(config?.sections, 10) || 1);
            const emphasise = config?.emphasise !== false;
            const prefix = (config?.prefix || 'Harbor folio').trim() || 'Harbor folio';
            const annotate = config?.annotate !== false;
            const scaffolding = [
                'Harbor folio utility scaffold terrace harbor sequence 1',
                'Harbor folio utility scaffold stack folio sequence 2',
                'Harbor folio utility scaffold ledger dock sequence 3',
                'Harbor folio utility scaffold panel sail sequence 4',
                'Harbor folio utility scaffold canvas rope sequence 5',
                'Harbor folio utility scaffold folio ledger sequence 6',
                'Harbor folio utility scaffold compartment cargo sequence 7',
                'Harbor folio utility scaffold parcel lantern sequence 8',
                'Harbor folio utility scaffold balustrade harbor sequence 9',
                'Harbor folio utility scaffold grid folio sequence 10',
                'Harbor folio utility scaffold terrace dock sequence 11',
                'Harbor folio utility scaffold stack sail sequence 12',
                'Harbor folio utility scaffold ledger rope sequence 13',
                'Harbor folio utility scaffold panel ledger sequence 14',
                'Harbor folio utility scaffold canvas cargo sequence 15',
                'Harbor folio utility scaffold folio lantern sequence 16',
                'Harbor folio utility scaffold compartment harbor sequence 17',
                'Harbor folio utility scaffold parcel folio sequence 18',
                'Harbor folio utility scaffold balustrade dock sequence 19',
                'Harbor folio utility scaffold grid sail sequence 20',
                'Harbor folio utility scaffold terrace rope sequence 21',
                'Harbor folio utility scaffold stack ledger sequence 22',
                'Harbor folio utility scaffold ledger cargo sequence 23',
                'Harbor folio utility scaffold panel lantern sequence 24',
                'Harbor folio utility scaffold canvas harbor sequence 25',
            ];
            const structures = [
                'Harbor folio utility structure arch harbor sequence 1',
                'Harbor folio utility structure grove folio sequence 2',
                'Harbor folio utility structure harbor dock sequence 3',
                'Harbor folio utility structure vault sail sequence 4',
                'Harbor folio utility structure arcade rope sequence 5',
                'Harbor folio utility structure meadow ledger sequence 6',
                'Harbor folio utility structure spire cargo sequence 7',
                'Harbor folio utility structure tunnel lantern sequence 8',
                'Harbor folio utility structure causeway harbor sequence 9',
                'Harbor folio utility structure hall folio sequence 10',
                'Harbor folio utility structure arch dock sequence 11',
                'Harbor folio utility structure grove sail sequence 12',
                'Harbor folio utility structure harbor rope sequence 13',
                'Harbor folio utility structure vault ledger sequence 14',
                'Harbor folio utility structure arcade cargo sequence 15',
                'Harbor folio utility structure meadow lantern sequence 16',
                'Harbor folio utility structure spire harbor sequence 17',
                'Harbor folio utility structure tunnel folio sequence 18',
                'Harbor folio utility structure causeway dock sequence 19',
                'Harbor folio utility structure hall sail sequence 20',
                'Harbor folio utility structure arch rope sequence 21',
                'Harbor folio utility structure grove ledger sequence 22',
                'Harbor folio utility structure harbor cargo sequence 23',
                'Harbor folio utility structure vault lantern sequence 24',
                'Harbor folio utility structure arcade harbor sequence 25',
            ];
            const signals = [
                'Harbor folio utility signal beacon harbor sequence 1',
                'Harbor folio utility signal spark folio sequence 2',
                'Harbor folio utility signal signal dock sequence 3',
                'Harbor folio utility signal marker sail sequence 4',
                'Harbor folio utility signal glyph rope sequence 5',
                'Harbor folio utility signal echo ledger sequence 6',
                'Harbor folio utility signal whisper cargo sequence 7',
                'Harbor folio utility signal song lantern sequence 8',
                'Harbor folio utility signal trail harbor sequence 9',
                'Harbor folio utility signal gleam folio sequence 10',
                'Harbor folio utility signal beacon dock sequence 11',
                'Harbor folio utility signal spark sail sequence 12',
                'Harbor folio utility signal signal rope sequence 13',
                'Harbor folio utility signal marker ledger sequence 14',
                'Harbor folio utility signal glyph cargo sequence 15',
                'Harbor folio utility signal echo lantern sequence 16',
                'Harbor folio utility signal whisper harbor sequence 17',
                'Harbor folio utility signal song folio sequence 18',
                'Harbor folio utility signal trail dock sequence 19',
                'Harbor folio utility signal gleam sail sequence 20',
                'Harbor folio utility signal beacon rope sequence 21',
                'Harbor folio utility signal spark ledger sequence 22',
                'Harbor folio utility signal signal cargo sequence 23',
                'Harbor folio utility signal marker lantern sequence 24',
                'Harbor folio utility signal glyph harbor sequence 25',
            ];
            const adornments = [
                'Harbor folio utility adornment lantern harbor sequence 1',
                'Harbor folio utility adornment rune folio sequence 2',
                'Harbor folio utility adornment ribbon dock sequence 3',
                'Harbor folio utility adornment petal sail sequence 4',
                'Harbor folio utility adornment feather rope sequence 5',
                'Harbor folio utility adornment stone ledger sequence 6',
                'Harbor folio utility adornment dew cargo sequence 7',
                'Harbor folio utility adornment light lantern sequence 8',
                'Harbor folio utility adornment mirror harbor sequence 9',
                'Harbor folio utility adornment glow folio sequence 10',
                'Harbor folio utility adornment lantern dock sequence 11',
                'Harbor folio utility adornment rune sail sequence 12',
                'Harbor folio utility adornment ribbon rope sequence 13',
                'Harbor folio utility adornment petal ledger sequence 14',
                'Harbor folio utility adornment feather cargo sequence 15',
                'Harbor folio utility adornment stone lantern sequence 16',
                'Harbor folio utility adornment dew harbor sequence 17',
                'Harbor folio utility adornment light folio sequence 18',
                'Harbor folio utility adornment mirror dock sequence 19',
                'Harbor folio utility adornment glow sail sequence 20',
                'Harbor folio utility adornment lantern rope sequence 21',
                'Harbor folio utility adornment rune ledger sequence 22',
                'Harbor folio utility adornment ribbon cargo sequence 23',
                'Harbor folio utility adornment petal lantern sequence 24',
                'Harbor folio utility adornment feather harbor sequence 25',
            ];
            const organised = [];
            for (let segment = 0; segment < sections; segment++) {
                for (let index = 0; index < scaffolding.length; index++) {
                    const scaffold = scaffolding[index];
                    const structure = structures[(index + segment) % structures.length];
                    const signal = signals[(index + segment * 2) % signals.length];
                    const adornment = adornments[(index + segment * 3) % adornments.length];
                    const emphasis = emphasise && index % 2 === 0 ? 'highlight' : 'soft';
                    organised.push(`${prefix} | ${mode} | section ${segment + 1} | ${scaffold} | ${structure} | ${signal} | ${adornment} | emphasis ${emphasis}`);
                }
            }
            const annotations = [];
            organised.forEach((entry, index) => {
                annotations.push(`${index + 1} :: ${entry}`);
                if (annotate && index % 3 === 0) {
                    annotations.push(`note ${index + 1} :: ${prefix} anchors ${mode}`);
                }
                if (annotate && index % 5 === 0) {
                    annotations.push(`guide ${index + 1} :: signal ${signals[index % signals.length]}`);
                }
            });
            const cleaned = [];
            const seen = new Set();
            annotations.forEach((item) => {
                if (!seen.has(item)) {
                    cleaned.push(item);
                    seen.add(item);
                }
            });
            const base = basePayload.trim();
            if (base) {
                cleaned.unshift(`base::${base}`);
            }
            const newlineChar = String.fromCharCode(10);
            const safeKey = 'fantasy_utility_harbor_folio';
            clone.vars[`${safeKey}_mode`] = mode;
            clone.vars[`${safeKey}_sections`] = sections;
            clone.vars[`${safeKey}_entries`] = cleaned.length;
            clone.payload = cleaned.join(newlineChar);
            clone.logs.push('Harbor folio utility organised payload terraces.');
            return [clone];
        }
    },
    {
        id: 'fantasy-utility-meadow-sampler',
        category: 'utility',
        name: 'Meadow sampler utility',
        description: 'Sample payload meadows into curated botanical trays.',
        icon: 'layout',
        accent: '#86efac',
        tags: ['utility', 'meadow', 'sampler', 'fantasy'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { mode: 'Meadow sampling', sections: 4, emphasise: true, prefix: 'Meadow sampler', annotate: true },
        form: [
            { key: 'mode', label: 'Mode', type: 'text', placeholder: 'Meadow sampling' },
            { key: 'sections', label: 'Sections', type: 'number', min: 1, max: 12 },
            { key: 'emphasise', label: 'Emphasise highlights', type: 'checkbox' },
            { key: 'prefix', label: 'Prefix', type: 'text', placeholder: 'Meadow sampler' },
            { key: 'annotate', label: 'Add annotations', type: 'checkbox' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const basePayload = QuickActionTools.toText(clone.payload ?? '');
            const mode = (config?.mode || 'Meadow sampling').trim() || 'Meadow sampling';
            const sections = Math.max(1, parseInt(config?.sections, 10) || 1);
            const emphasise = config?.emphasise !== false;
            const prefix = (config?.prefix || 'Meadow sampler').trim() || 'Meadow sampler';
            const annotate = config?.annotate !== false;
            const scaffolding = [
                'Meadow sampler utility scaffold terrace meadow sequence 1',
                'Meadow sampler utility scaffold stack sampler sequence 2',
                'Meadow sampler utility scaffold ledger bloom sequence 3',
                'Meadow sampler utility scaffold panel trail sequence 4',
                'Meadow sampler utility scaffold canvas dew sequence 5',
                'Meadow sampler utility scaffold folio wind sequence 6',
                'Meadow sampler utility scaffold compartment petal sequence 7',
                'Meadow sampler utility scaffold parcel skylark sequence 8',
                'Meadow sampler utility scaffold balustrade meadow sequence 9',
                'Meadow sampler utility scaffold grid sampler sequence 10',
                'Meadow sampler utility scaffold terrace bloom sequence 11',
                'Meadow sampler utility scaffold stack trail sequence 12',
                'Meadow sampler utility scaffold ledger dew sequence 13',
                'Meadow sampler utility scaffold panel wind sequence 14',
                'Meadow sampler utility scaffold canvas petal sequence 15',
                'Meadow sampler utility scaffold folio skylark sequence 16',
                'Meadow sampler utility scaffold compartment meadow sequence 17',
                'Meadow sampler utility scaffold parcel sampler sequence 18',
                'Meadow sampler utility scaffold balustrade bloom sequence 19',
                'Meadow sampler utility scaffold grid trail sequence 20',
                'Meadow sampler utility scaffold terrace dew sequence 21',
                'Meadow sampler utility scaffold stack wind sequence 22',
                'Meadow sampler utility scaffold ledger petal sequence 23',
                'Meadow sampler utility scaffold panel skylark sequence 24',
                'Meadow sampler utility scaffold canvas meadow sequence 25',
            ];
            const structures = [
                'Meadow sampler utility structure arch meadow sequence 1',
                'Meadow sampler utility structure grove sampler sequence 2',
                'Meadow sampler utility structure harbor bloom sequence 3',
                'Meadow sampler utility structure vault trail sequence 4',
                'Meadow sampler utility structure arcade dew sequence 5',
                'Meadow sampler utility structure meadow wind sequence 6',
                'Meadow sampler utility structure spire petal sequence 7',
                'Meadow sampler utility structure tunnel skylark sequence 8',
                'Meadow sampler utility structure causeway meadow sequence 9',
                'Meadow sampler utility structure hall sampler sequence 10',
                'Meadow sampler utility structure arch bloom sequence 11',
                'Meadow sampler utility structure grove trail sequence 12',
                'Meadow sampler utility structure harbor dew sequence 13',
                'Meadow sampler utility structure vault wind sequence 14',
                'Meadow sampler utility structure arcade petal sequence 15',
                'Meadow sampler utility structure meadow skylark sequence 16',
                'Meadow sampler utility structure spire meadow sequence 17',
                'Meadow sampler utility structure tunnel sampler sequence 18',
                'Meadow sampler utility structure causeway bloom sequence 19',
                'Meadow sampler utility structure hall trail sequence 20',
                'Meadow sampler utility structure arch dew sequence 21',
                'Meadow sampler utility structure grove wind sequence 22',
                'Meadow sampler utility structure harbor petal sequence 23',
                'Meadow sampler utility structure vault skylark sequence 24',
                'Meadow sampler utility structure arcade meadow sequence 25',
            ];
            const signals = [
                'Meadow sampler utility signal beacon meadow sequence 1',
                'Meadow sampler utility signal spark sampler sequence 2',
                'Meadow sampler utility signal signal bloom sequence 3',
                'Meadow sampler utility signal marker trail sequence 4',
                'Meadow sampler utility signal glyph dew sequence 5',
                'Meadow sampler utility signal echo wind sequence 6',
                'Meadow sampler utility signal whisper petal sequence 7',
                'Meadow sampler utility signal song skylark sequence 8',
                'Meadow sampler utility signal trail meadow sequence 9',
                'Meadow sampler utility signal gleam sampler sequence 10',
                'Meadow sampler utility signal beacon bloom sequence 11',
                'Meadow sampler utility signal spark trail sequence 12',
                'Meadow sampler utility signal signal dew sequence 13',
                'Meadow sampler utility signal marker wind sequence 14',
                'Meadow sampler utility signal glyph petal sequence 15',
                'Meadow sampler utility signal echo skylark sequence 16',
                'Meadow sampler utility signal whisper meadow sequence 17',
                'Meadow sampler utility signal song sampler sequence 18',
                'Meadow sampler utility signal trail bloom sequence 19',
                'Meadow sampler utility signal gleam trail sequence 20',
                'Meadow sampler utility signal beacon dew sequence 21',
                'Meadow sampler utility signal spark wind sequence 22',
                'Meadow sampler utility signal signal petal sequence 23',
                'Meadow sampler utility signal marker skylark sequence 24',
                'Meadow sampler utility signal glyph meadow sequence 25',
            ];
            const adornments = [
                'Meadow sampler utility adornment lantern meadow sequence 1',
                'Meadow sampler utility adornment rune sampler sequence 2',
                'Meadow sampler utility adornment ribbon bloom sequence 3',
                'Meadow sampler utility adornment petal trail sequence 4',
                'Meadow sampler utility adornment feather dew sequence 5',
                'Meadow sampler utility adornment stone wind sequence 6',
                'Meadow sampler utility adornment dew petal sequence 7',
                'Meadow sampler utility adornment light skylark sequence 8',
                'Meadow sampler utility adornment mirror meadow sequence 9',
                'Meadow sampler utility adornment glow sampler sequence 10',
                'Meadow sampler utility adornment lantern bloom sequence 11',
                'Meadow sampler utility adornment rune trail sequence 12',
                'Meadow sampler utility adornment ribbon dew sequence 13',
                'Meadow sampler utility adornment petal wind sequence 14',
                'Meadow sampler utility adornment feather petal sequence 15',
                'Meadow sampler utility adornment stone skylark sequence 16',
                'Meadow sampler utility adornment dew meadow sequence 17',
                'Meadow sampler utility adornment light sampler sequence 18',
                'Meadow sampler utility adornment mirror bloom sequence 19',
                'Meadow sampler utility adornment glow trail sequence 20',
                'Meadow sampler utility adornment lantern dew sequence 21',
                'Meadow sampler utility adornment rune wind sequence 22',
                'Meadow sampler utility adornment ribbon petal sequence 23',
                'Meadow sampler utility adornment petal skylark sequence 24',
                'Meadow sampler utility adornment feather meadow sequence 25',
            ];
            const organised = [];
            for (let segment = 0; segment < sections; segment++) {
                for (let index = 0; index < scaffolding.length; index++) {
                    const scaffold = scaffolding[index];
                    const structure = structures[(index + segment) % structures.length];
                    const signal = signals[(index + segment * 2) % signals.length];
                    const adornment = adornments[(index + segment * 3) % adornments.length];
                    const emphasis = emphasise && index % 2 === 0 ? 'highlight' : 'soft';
                    organised.push(`${prefix} | ${mode} | section ${segment + 1} | ${scaffold} | ${structure} | ${signal} | ${adornment} | emphasis ${emphasis}`);
                }
            }
            const annotations = [];
            organised.forEach((entry, index) => {
                annotations.push(`${index + 1} :: ${entry}`);
                if (annotate && index % 3 === 0) {
                    annotations.push(`note ${index + 1} :: ${prefix} anchors ${mode}`);
                }
                if (annotate && index % 5 === 0) {
                    annotations.push(`guide ${index + 1} :: signal ${signals[index % signals.length]}`);
                }
            });
            const cleaned = [];
            const seen = new Set();
            annotations.forEach((item) => {
                if (!seen.has(item)) {
                    cleaned.push(item);
                    seen.add(item);
                }
            });
            const base = basePayload.trim();
            if (base) {
                cleaned.unshift(`base::${base}`);
            }
            const newlineChar = String.fromCharCode(10);
            const safeKey = 'fantasy_utility_meadow_sampler';
            clone.vars[`${safeKey}_mode`] = mode;
            clone.vars[`${safeKey}_sections`] = sections;
            clone.vars[`${safeKey}_entries`] = cleaned.length;
            clone.payload = cleaned.join(newlineChar);
            clone.logs.push('Meadow sampler utility organised payload terraces.');
            return [clone];
        }
    },
    {
        id: 'fantasy-utility-scriptorium-keeper',
        category: 'utility',
        name: 'Scriptorium keeper utility',
        description: 'Keep scriptoria tidy with vaulted annotations and cues.',
        icon: 'file-text',
        accent: '#f87171',
        tags: ['utility', 'scriptorium', 'keeper', 'fantasy'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { mode: 'Scriptorium keeping', sections: 4, emphasise: true, prefix: 'Scriptorium keeper', annotate: true },
        form: [
            { key: 'mode', label: 'Mode', type: 'text', placeholder: 'Scriptorium keeping' },
            { key: 'sections', label: 'Sections', type: 'number', min: 1, max: 12 },
            { key: 'emphasise', label: 'Emphasise highlights', type: 'checkbox' },
            { key: 'prefix', label: 'Prefix', type: 'text', placeholder: 'Scriptorium keeper' },
            { key: 'annotate', label: 'Add annotations', type: 'checkbox' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const basePayload = QuickActionTools.toText(clone.payload ?? '');
            const mode = (config?.mode || 'Scriptorium keeping').trim() || 'Scriptorium keeping';
            const sections = Math.max(1, parseInt(config?.sections, 10) || 1);
            const emphasise = config?.emphasise !== false;
            const prefix = (config?.prefix || 'Scriptorium keeper').trim() || 'Scriptorium keeper';
            const annotate = config?.annotate !== false;
            const scaffolding = [
                'Scriptorium keeper utility scaffold terrace scriptorium sequence 1',
                'Scriptorium keeper utility scaffold stack keeper sequence 2',
                'Scriptorium keeper utility scaffold ledger ink sequence 3',
                'Scriptorium keeper utility scaffold panel glyph sequence 4',
                'Scriptorium keeper utility scaffold canvas margins sequence 5',
                'Scriptorium keeper utility scaffold folio scroll sequence 6',
                'Scriptorium keeper utility scaffold compartment bookmark sequence 7',
                'Scriptorium keeper utility scaffold parcel folio sequence 8',
                'Scriptorium keeper utility scaffold balustrade scriptorium sequence 9',
                'Scriptorium keeper utility scaffold grid keeper sequence 10',
                'Scriptorium keeper utility scaffold terrace ink sequence 11',
                'Scriptorium keeper utility scaffold stack glyph sequence 12',
                'Scriptorium keeper utility scaffold ledger margins sequence 13',
                'Scriptorium keeper utility scaffold panel scroll sequence 14',
                'Scriptorium keeper utility scaffold canvas bookmark sequence 15',
                'Scriptorium keeper utility scaffold folio folio sequence 16',
                'Scriptorium keeper utility scaffold compartment scriptorium sequence 17',
                'Scriptorium keeper utility scaffold parcel keeper sequence 18',
                'Scriptorium keeper utility scaffold balustrade ink sequence 19',
                'Scriptorium keeper utility scaffold grid glyph sequence 20',
                'Scriptorium keeper utility scaffold terrace margins sequence 21',
                'Scriptorium keeper utility scaffold stack scroll sequence 22',
                'Scriptorium keeper utility scaffold ledger bookmark sequence 23',
                'Scriptorium keeper utility scaffold panel folio sequence 24',
                'Scriptorium keeper utility scaffold canvas scriptorium sequence 25',
            ];
            const structures = [
                'Scriptorium keeper utility structure arch scriptorium sequence 1',
                'Scriptorium keeper utility structure grove keeper sequence 2',
                'Scriptorium keeper utility structure harbor ink sequence 3',
                'Scriptorium keeper utility structure vault glyph sequence 4',
                'Scriptorium keeper utility structure arcade margins sequence 5',
                'Scriptorium keeper utility structure meadow scroll sequence 6',
                'Scriptorium keeper utility structure spire bookmark sequence 7',
                'Scriptorium keeper utility structure tunnel folio sequence 8',
                'Scriptorium keeper utility structure causeway scriptorium sequence 9',
                'Scriptorium keeper utility structure hall keeper sequence 10',
                'Scriptorium keeper utility structure arch ink sequence 11',
                'Scriptorium keeper utility structure grove glyph sequence 12',
                'Scriptorium keeper utility structure harbor margins sequence 13',
                'Scriptorium keeper utility structure vault scroll sequence 14',
                'Scriptorium keeper utility structure arcade bookmark sequence 15',
                'Scriptorium keeper utility structure meadow folio sequence 16',
                'Scriptorium keeper utility structure spire scriptorium sequence 17',
                'Scriptorium keeper utility structure tunnel keeper sequence 18',
                'Scriptorium keeper utility structure causeway ink sequence 19',
                'Scriptorium keeper utility structure hall glyph sequence 20',
                'Scriptorium keeper utility structure arch margins sequence 21',
                'Scriptorium keeper utility structure grove scroll sequence 22',
                'Scriptorium keeper utility structure harbor bookmark sequence 23',
                'Scriptorium keeper utility structure vault folio sequence 24',
                'Scriptorium keeper utility structure arcade scriptorium sequence 25',
            ];
            const signals = [
                'Scriptorium keeper utility signal beacon scriptorium sequence 1',
                'Scriptorium keeper utility signal spark keeper sequence 2',
                'Scriptorium keeper utility signal signal ink sequence 3',
                'Scriptorium keeper utility signal marker glyph sequence 4',
                'Scriptorium keeper utility signal glyph margins sequence 5',
                'Scriptorium keeper utility signal echo scroll sequence 6',
                'Scriptorium keeper utility signal whisper bookmark sequence 7',
                'Scriptorium keeper utility signal song folio sequence 8',
                'Scriptorium keeper utility signal trail scriptorium sequence 9',
                'Scriptorium keeper utility signal gleam keeper sequence 10',
                'Scriptorium keeper utility signal beacon ink sequence 11',
                'Scriptorium keeper utility signal spark glyph sequence 12',
                'Scriptorium keeper utility signal signal margins sequence 13',
                'Scriptorium keeper utility signal marker scroll sequence 14',
                'Scriptorium keeper utility signal glyph bookmark sequence 15',
                'Scriptorium keeper utility signal echo folio sequence 16',
                'Scriptorium keeper utility signal whisper scriptorium sequence 17',
                'Scriptorium keeper utility signal song keeper sequence 18',
                'Scriptorium keeper utility signal trail ink sequence 19',
                'Scriptorium keeper utility signal gleam glyph sequence 20',
                'Scriptorium keeper utility signal beacon margins sequence 21',
                'Scriptorium keeper utility signal spark scroll sequence 22',
                'Scriptorium keeper utility signal signal bookmark sequence 23',
                'Scriptorium keeper utility signal marker folio sequence 24',
                'Scriptorium keeper utility signal glyph scriptorium sequence 25',
            ];
            const adornments = [
                'Scriptorium keeper utility adornment lantern scriptorium sequence 1',
                'Scriptorium keeper utility adornment rune keeper sequence 2',
                'Scriptorium keeper utility adornment ribbon ink sequence 3',
                'Scriptorium keeper utility adornment petal glyph sequence 4',
                'Scriptorium keeper utility adornment feather margins sequence 5',
                'Scriptorium keeper utility adornment stone scroll sequence 6',
                'Scriptorium keeper utility adornment dew bookmark sequence 7',
                'Scriptorium keeper utility adornment light folio sequence 8',
                'Scriptorium keeper utility adornment mirror scriptorium sequence 9',
                'Scriptorium keeper utility adornment glow keeper sequence 10',
                'Scriptorium keeper utility adornment lantern ink sequence 11',
                'Scriptorium keeper utility adornment rune glyph sequence 12',
                'Scriptorium keeper utility adornment ribbon margins sequence 13',
                'Scriptorium keeper utility adornment petal scroll sequence 14',
                'Scriptorium keeper utility adornment feather bookmark sequence 15',
                'Scriptorium keeper utility adornment stone folio sequence 16',
                'Scriptorium keeper utility adornment dew scriptorium sequence 17',
                'Scriptorium keeper utility adornment light keeper sequence 18',
                'Scriptorium keeper utility adornment mirror ink sequence 19',
                'Scriptorium keeper utility adornment glow glyph sequence 20',
                'Scriptorium keeper utility adornment lantern margins sequence 21',
                'Scriptorium keeper utility adornment rune scroll sequence 22',
                'Scriptorium keeper utility adornment ribbon bookmark sequence 23',
                'Scriptorium keeper utility adornment petal folio sequence 24',
                'Scriptorium keeper utility adornment feather scriptorium sequence 25',
            ];
            const organised = [];
            for (let segment = 0; segment < sections; segment++) {
                for (let index = 0; index < scaffolding.length; index++) {
                    const scaffold = scaffolding[index];
                    const structure = structures[(index + segment) % structures.length];
                    const signal = signals[(index + segment * 2) % signals.length];
                    const adornment = adornments[(index + segment * 3) % adornments.length];
                    const emphasis = emphasise && index % 2 === 0 ? 'highlight' : 'soft';
                    organised.push(`${prefix} | ${mode} | section ${segment + 1} | ${scaffold} | ${structure} | ${signal} | ${adornment} | emphasis ${emphasis}`);
                }
            }
            const annotations = [];
            organised.forEach((entry, index) => {
                annotations.push(`${index + 1} :: ${entry}`);
                if (annotate && index % 3 === 0) {
                    annotations.push(`note ${index + 1} :: ${prefix} anchors ${mode}`);
                }
                if (annotate && index % 5 === 0) {
                    annotations.push(`guide ${index + 1} :: signal ${signals[index % signals.length]}`);
                }
            });
            const cleaned = [];
            const seen = new Set();
            annotations.forEach((item) => {
                if (!seen.has(item)) {
                    cleaned.push(item);
                    seen.add(item);
                }
            });
            const base = basePayload.trim();
            if (base) {
                cleaned.unshift(`base::${base}`);
            }
            const newlineChar = String.fromCharCode(10);
            const safeKey = 'fantasy_utility_scriptorium_keeper';
            clone.vars[`${safeKey}_mode`] = mode;
            clone.vars[`${safeKey}_sections`] = sections;
            clone.vars[`${safeKey}_entries`] = cleaned.length;
            clone.payload = cleaned.join(newlineChar);
            clone.logs.push('Scriptorium keeper utility organised payload terraces.');
            return [clone];
        }
    },
    {
        id: 'fantasy-utility-ember-ledger',
        category: 'utility',
        name: 'Ember ledger utility',
        description: 'Log ember sparks into ledger columns and warm stacks.',
        icon: 'bar-chart',
        accent: '#fb7185',
        tags: ['utility', 'ember', 'ledger', 'fantasy'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { mode: 'Ember ledgering', sections: 4, emphasise: true, prefix: 'Ember ledger', annotate: true },
        form: [
            { key: 'mode', label: 'Mode', type: 'text', placeholder: 'Ember ledgering' },
            { key: 'sections', label: 'Sections', type: 'number', min: 1, max: 12 },
            { key: 'emphasise', label: 'Emphasise highlights', type: 'checkbox' },
            { key: 'prefix', label: 'Prefix', type: 'text', placeholder: 'Ember ledger' },
            { key: 'annotate', label: 'Add annotations', type: 'checkbox' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const basePayload = QuickActionTools.toText(clone.payload ?? '');
            const mode = (config?.mode || 'Ember ledgering').trim() || 'Ember ledgering';
            const sections = Math.max(1, parseInt(config?.sections, 10) || 1);
            const emphasise = config?.emphasise !== false;
            const prefix = (config?.prefix || 'Ember ledger').trim() || 'Ember ledger';
            const annotate = config?.annotate !== false;
            const scaffolding = [
                'Ember ledger utility scaffold terrace ember sequence 1',
                'Ember ledger utility scaffold stack ledger sequence 2',
                'Ember ledger utility scaffold ledger spark sequence 3',
                'Ember ledger utility scaffold panel column sequence 4',
                'Ember ledger utility scaffold canvas cinder sequence 5',
                'Ember ledger utility scaffold folio record sequence 6',
                'Ember ledger utility scaffold compartment emberline sequence 7',
                'Ember ledger utility scaffold parcel glow sequence 8',
                'Ember ledger utility scaffold balustrade ember sequence 9',
                'Ember ledger utility scaffold grid ledger sequence 10',
                'Ember ledger utility scaffold terrace spark sequence 11',
                'Ember ledger utility scaffold stack column sequence 12',
                'Ember ledger utility scaffold ledger cinder sequence 13',
                'Ember ledger utility scaffold panel record sequence 14',
                'Ember ledger utility scaffold canvas emberline sequence 15',
                'Ember ledger utility scaffold folio glow sequence 16',
                'Ember ledger utility scaffold compartment ember sequence 17',
                'Ember ledger utility scaffold parcel ledger sequence 18',
                'Ember ledger utility scaffold balustrade spark sequence 19',
                'Ember ledger utility scaffold grid column sequence 20',
                'Ember ledger utility scaffold terrace cinder sequence 21',
                'Ember ledger utility scaffold stack record sequence 22',
                'Ember ledger utility scaffold ledger emberline sequence 23',
                'Ember ledger utility scaffold panel glow sequence 24',
                'Ember ledger utility scaffold canvas ember sequence 25',
            ];
            const structures = [
                'Ember ledger utility structure arch ember sequence 1',
                'Ember ledger utility structure grove ledger sequence 2',
                'Ember ledger utility structure harbor spark sequence 3',
                'Ember ledger utility structure vault column sequence 4',
                'Ember ledger utility structure arcade cinder sequence 5',
                'Ember ledger utility structure meadow record sequence 6',
                'Ember ledger utility structure spire emberline sequence 7',
                'Ember ledger utility structure tunnel glow sequence 8',
                'Ember ledger utility structure causeway ember sequence 9',
                'Ember ledger utility structure hall ledger sequence 10',
                'Ember ledger utility structure arch spark sequence 11',
                'Ember ledger utility structure grove column sequence 12',
                'Ember ledger utility structure harbor cinder sequence 13',
                'Ember ledger utility structure vault record sequence 14',
                'Ember ledger utility structure arcade emberline sequence 15',
                'Ember ledger utility structure meadow glow sequence 16',
                'Ember ledger utility structure spire ember sequence 17',
                'Ember ledger utility structure tunnel ledger sequence 18',
                'Ember ledger utility structure causeway spark sequence 19',
                'Ember ledger utility structure hall column sequence 20',
                'Ember ledger utility structure arch cinder sequence 21',
                'Ember ledger utility structure grove record sequence 22',
                'Ember ledger utility structure harbor emberline sequence 23',
                'Ember ledger utility structure vault glow sequence 24',
                'Ember ledger utility structure arcade ember sequence 25',
            ];
            const signals = [
                'Ember ledger utility signal beacon ember sequence 1',
                'Ember ledger utility signal spark ledger sequence 2',
                'Ember ledger utility signal signal spark sequence 3',
                'Ember ledger utility signal marker column sequence 4',
                'Ember ledger utility signal glyph cinder sequence 5',
                'Ember ledger utility signal echo record sequence 6',
                'Ember ledger utility signal whisper emberline sequence 7',
                'Ember ledger utility signal song glow sequence 8',
                'Ember ledger utility signal trail ember sequence 9',
                'Ember ledger utility signal gleam ledger sequence 10',
                'Ember ledger utility signal beacon spark sequence 11',
                'Ember ledger utility signal spark column sequence 12',
                'Ember ledger utility signal signal cinder sequence 13',
                'Ember ledger utility signal marker record sequence 14',
                'Ember ledger utility signal glyph emberline sequence 15',
                'Ember ledger utility signal echo glow sequence 16',
                'Ember ledger utility signal whisper ember sequence 17',
                'Ember ledger utility signal song ledger sequence 18',
                'Ember ledger utility signal trail spark sequence 19',
                'Ember ledger utility signal gleam column sequence 20',
                'Ember ledger utility signal beacon cinder sequence 21',
                'Ember ledger utility signal spark record sequence 22',
                'Ember ledger utility signal signal emberline sequence 23',
                'Ember ledger utility signal marker glow sequence 24',
                'Ember ledger utility signal glyph ember sequence 25',
            ];
            const adornments = [
                'Ember ledger utility adornment lantern ember sequence 1',
                'Ember ledger utility adornment rune ledger sequence 2',
                'Ember ledger utility adornment ribbon spark sequence 3',
                'Ember ledger utility adornment petal column sequence 4',
                'Ember ledger utility adornment feather cinder sequence 5',
                'Ember ledger utility adornment stone record sequence 6',
                'Ember ledger utility adornment dew emberline sequence 7',
                'Ember ledger utility adornment light glow sequence 8',
                'Ember ledger utility adornment mirror ember sequence 9',
                'Ember ledger utility adornment glow ledger sequence 10',
                'Ember ledger utility adornment lantern spark sequence 11',
                'Ember ledger utility adornment rune column sequence 12',
                'Ember ledger utility adornment ribbon cinder sequence 13',
                'Ember ledger utility adornment petal record sequence 14',
                'Ember ledger utility adornment feather emberline sequence 15',
                'Ember ledger utility adornment stone glow sequence 16',
                'Ember ledger utility adornment dew ember sequence 17',
                'Ember ledger utility adornment light ledger sequence 18',
                'Ember ledger utility adornment mirror spark sequence 19',
                'Ember ledger utility adornment glow column sequence 20',
                'Ember ledger utility adornment lantern cinder sequence 21',
                'Ember ledger utility adornment rune record sequence 22',
                'Ember ledger utility adornment ribbon emberline sequence 23',
                'Ember ledger utility adornment petal glow sequence 24',
                'Ember ledger utility adornment feather ember sequence 25',
            ];
            const organised = [];
            for (let segment = 0; segment < sections; segment++) {
                for (let index = 0; index < scaffolding.length; index++) {
                    const scaffold = scaffolding[index];
                    const structure = structures[(index + segment) % structures.length];
                    const signal = signals[(index + segment * 2) % signals.length];
                    const adornment = adornments[(index + segment * 3) % adornments.length];
                    const emphasis = emphasise && index % 2 === 0 ? 'highlight' : 'soft';
                    organised.push(`${prefix} | ${mode} | section ${segment + 1} | ${scaffold} | ${structure} | ${signal} | ${adornment} | emphasis ${emphasis}`);
                }
            }
            const annotations = [];
            organised.forEach((entry, index) => {
                annotations.push(`${index + 1} :: ${entry}`);
                if (annotate && index % 3 === 0) {
                    annotations.push(`note ${index + 1} :: ${prefix} anchors ${mode}`);
                }
                if (annotate && index % 5 === 0) {
                    annotations.push(`guide ${index + 1} :: signal ${signals[index % signals.length]}`);
                }
            });
            const cleaned = [];
            const seen = new Set();
            annotations.forEach((item) => {
                if (!seen.has(item)) {
                    cleaned.push(item);
                    seen.add(item);
                }
            });
            const base = basePayload.trim();
            if (base) {
                cleaned.unshift(`base::${base}`);
            }
            const newlineChar = String.fromCharCode(10);
            const safeKey = 'fantasy_utility_ember_ledger';
            clone.vars[`${safeKey}_mode`] = mode;
            clone.vars[`${safeKey}_sections`] = sections;
            clone.vars[`${safeKey}_entries`] = cleaned.length;
            clone.payload = cleaned.join(newlineChar);
            clone.logs.push('Ember ledger utility organised payload terraces.');
            return [clone];
        }
    },
    {
        id: 'fantasy-utility-voyage-scheduler',
        category: 'utility',
        name: 'Voyage scheduler utility',
        description: 'Schedule voyages through payload harbors and ports.',
        icon: 'calendar',
        accent: '#22d3ee',
        tags: ['utility', 'voyage', 'scheduler', 'fantasy'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { mode: 'Voyage scheduling', sections: 4, emphasise: true, prefix: 'Voyage scheduler', annotate: true },
        form: [
            { key: 'mode', label: 'Mode', type: 'text', placeholder: 'Voyage scheduling' },
            { key: 'sections', label: 'Sections', type: 'number', min: 1, max: 12 },
            { key: 'emphasise', label: 'Emphasise highlights', type: 'checkbox' },
            { key: 'prefix', label: 'Prefix', type: 'text', placeholder: 'Voyage scheduler' },
            { key: 'annotate', label: 'Add annotations', type: 'checkbox' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const basePayload = QuickActionTools.toText(clone.payload ?? '');
            const mode = (config?.mode || 'Voyage scheduling').trim() || 'Voyage scheduling';
            const sections = Math.max(1, parseInt(config?.sections, 10) || 1);
            const emphasise = config?.emphasise !== false;
            const prefix = (config?.prefix || 'Voyage scheduler').trim() || 'Voyage scheduler';
            const annotate = config?.annotate !== false;
            const scaffolding = [
                'Voyage scheduler utility scaffold terrace voyage sequence 1',
                'Voyage scheduler utility scaffold stack scheduler sequence 2',
                'Voyage scheduler utility scaffold ledger route sequence 3',
                'Voyage scheduler utility scaffold panel chart sequence 4',
                'Voyage scheduler utility scaffold canvas current sequence 5',
                'Voyage scheduler utility scaffold folio logbook sequence 6',
                'Voyage scheduler utility scaffold compartment star sequence 7',
                'Voyage scheduler utility scaffold parcel helm sequence 8',
                'Voyage scheduler utility scaffold balustrade voyage sequence 9',
                'Voyage scheduler utility scaffold grid scheduler sequence 10',
                'Voyage scheduler utility scaffold terrace route sequence 11',
                'Voyage scheduler utility scaffold stack chart sequence 12',
                'Voyage scheduler utility scaffold ledger current sequence 13',
                'Voyage scheduler utility scaffold panel logbook sequence 14',
                'Voyage scheduler utility scaffold canvas star sequence 15',
                'Voyage scheduler utility scaffold folio helm sequence 16',
                'Voyage scheduler utility scaffold compartment voyage sequence 17',
                'Voyage scheduler utility scaffold parcel scheduler sequence 18',
                'Voyage scheduler utility scaffold balustrade route sequence 19',
                'Voyage scheduler utility scaffold grid chart sequence 20',
                'Voyage scheduler utility scaffold terrace current sequence 21',
                'Voyage scheduler utility scaffold stack logbook sequence 22',
                'Voyage scheduler utility scaffold ledger star sequence 23',
                'Voyage scheduler utility scaffold panel helm sequence 24',
                'Voyage scheduler utility scaffold canvas voyage sequence 25',
            ];
            const structures = [
                'Voyage scheduler utility structure arch voyage sequence 1',
                'Voyage scheduler utility structure grove scheduler sequence 2',
                'Voyage scheduler utility structure harbor route sequence 3',
                'Voyage scheduler utility structure vault chart sequence 4',
                'Voyage scheduler utility structure arcade current sequence 5',
                'Voyage scheduler utility structure meadow logbook sequence 6',
                'Voyage scheduler utility structure spire star sequence 7',
                'Voyage scheduler utility structure tunnel helm sequence 8',
                'Voyage scheduler utility structure causeway voyage sequence 9',
                'Voyage scheduler utility structure hall scheduler sequence 10',
                'Voyage scheduler utility structure arch route sequence 11',
                'Voyage scheduler utility structure grove chart sequence 12',
                'Voyage scheduler utility structure harbor current sequence 13',
                'Voyage scheduler utility structure vault logbook sequence 14',
                'Voyage scheduler utility structure arcade star sequence 15',
                'Voyage scheduler utility structure meadow helm sequence 16',
                'Voyage scheduler utility structure spire voyage sequence 17',
                'Voyage scheduler utility structure tunnel scheduler sequence 18',
                'Voyage scheduler utility structure causeway route sequence 19',
                'Voyage scheduler utility structure hall chart sequence 20',
                'Voyage scheduler utility structure arch current sequence 21',
                'Voyage scheduler utility structure grove logbook sequence 22',
                'Voyage scheduler utility structure harbor star sequence 23',
                'Voyage scheduler utility structure vault helm sequence 24',
                'Voyage scheduler utility structure arcade voyage sequence 25',
            ];
            const signals = [
                'Voyage scheduler utility signal beacon voyage sequence 1',
                'Voyage scheduler utility signal spark scheduler sequence 2',
                'Voyage scheduler utility signal signal route sequence 3',
                'Voyage scheduler utility signal marker chart sequence 4',
                'Voyage scheduler utility signal glyph current sequence 5',
                'Voyage scheduler utility signal echo logbook sequence 6',
                'Voyage scheduler utility signal whisper star sequence 7',
                'Voyage scheduler utility signal song helm sequence 8',
                'Voyage scheduler utility signal trail voyage sequence 9',
                'Voyage scheduler utility signal gleam scheduler sequence 10',
                'Voyage scheduler utility signal beacon route sequence 11',
                'Voyage scheduler utility signal spark chart sequence 12',
                'Voyage scheduler utility signal signal current sequence 13',
                'Voyage scheduler utility signal marker logbook sequence 14',
                'Voyage scheduler utility signal glyph star sequence 15',
                'Voyage scheduler utility signal echo helm sequence 16',
                'Voyage scheduler utility signal whisper voyage sequence 17',
                'Voyage scheduler utility signal song scheduler sequence 18',
                'Voyage scheduler utility signal trail route sequence 19',
                'Voyage scheduler utility signal gleam chart sequence 20',
                'Voyage scheduler utility signal beacon current sequence 21',
                'Voyage scheduler utility signal spark logbook sequence 22',
                'Voyage scheduler utility signal signal star sequence 23',
                'Voyage scheduler utility signal marker helm sequence 24',
                'Voyage scheduler utility signal glyph voyage sequence 25',
            ];
            const adornments = [
                'Voyage scheduler utility adornment lantern voyage sequence 1',
                'Voyage scheduler utility adornment rune scheduler sequence 2',
                'Voyage scheduler utility adornment ribbon route sequence 3',
                'Voyage scheduler utility adornment petal chart sequence 4',
                'Voyage scheduler utility adornment feather current sequence 5',
                'Voyage scheduler utility adornment stone logbook sequence 6',
                'Voyage scheduler utility adornment dew star sequence 7',
                'Voyage scheduler utility adornment light helm sequence 8',
                'Voyage scheduler utility adornment mirror voyage sequence 9',
                'Voyage scheduler utility adornment glow scheduler sequence 10',
                'Voyage scheduler utility adornment lantern route sequence 11',
                'Voyage scheduler utility adornment rune chart sequence 12',
                'Voyage scheduler utility adornment ribbon current sequence 13',
                'Voyage scheduler utility adornment petal logbook sequence 14',
                'Voyage scheduler utility adornment feather star sequence 15',
                'Voyage scheduler utility adornment stone helm sequence 16',
                'Voyage scheduler utility adornment dew voyage sequence 17',
                'Voyage scheduler utility adornment light scheduler sequence 18',
                'Voyage scheduler utility adornment mirror route sequence 19',
                'Voyage scheduler utility adornment glow chart sequence 20',
                'Voyage scheduler utility adornment lantern current sequence 21',
                'Voyage scheduler utility adornment rune logbook sequence 22',
                'Voyage scheduler utility adornment ribbon star sequence 23',
                'Voyage scheduler utility adornment petal helm sequence 24',
                'Voyage scheduler utility adornment feather voyage sequence 25',
            ];
            const organised = [];
            for (let segment = 0; segment < sections; segment++) {
                for (let index = 0; index < scaffolding.length; index++) {
                    const scaffold = scaffolding[index];
                    const structure = structures[(index + segment) % structures.length];
                    const signal = signals[(index + segment * 2) % signals.length];
                    const adornment = adornments[(index + segment * 3) % adornments.length];
                    const emphasis = emphasise && index % 2 === 0 ? 'highlight' : 'soft';
                    organised.push(`${prefix} | ${mode} | section ${segment + 1} | ${scaffold} | ${structure} | ${signal} | ${adornment} | emphasis ${emphasis}`);
                }
            }
            const annotations = [];
            organised.forEach((entry, index) => {
                annotations.push(`${index + 1} :: ${entry}`);
                if (annotate && index % 3 === 0) {
                    annotations.push(`note ${index + 1} :: ${prefix} anchors ${mode}`);
                }
                if (annotate && index % 5 === 0) {
                    annotations.push(`guide ${index + 1} :: signal ${signals[index % signals.length]}`);
                }
            });
            const cleaned = [];
            const seen = new Set();
            annotations.forEach((item) => {
                if (!seen.has(item)) {
                    cleaned.push(item);
                    seen.add(item);
                }
            });
            const base = basePayload.trim();
            if (base) {
                cleaned.unshift(`base::${base}`);
            }
            const newlineChar = String.fromCharCode(10);
            const safeKey = 'fantasy_utility_voyage_scheduler';
            clone.vars[`${safeKey}_mode`] = mode;
            clone.vars[`${safeKey}_sections`] = sections;
            clone.vars[`${safeKey}_entries`] = cleaned.length;
            clone.payload = cleaned.join(newlineChar);
            clone.logs.push('Voyage scheduler utility organised payload terraces.');
            return [clone];
        }
    },
    {
        id: 'fantasy-utility-breeze-organiser',
        category: 'utility',
        name: 'Breeze organiser utility',
        description: 'Organise breezes of thought into airy reference stacks.',
        icon: 'airplay',
        accent: '#60a5fa',
        tags: ['utility', 'breeze', 'organiser', 'fantasy'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { mode: 'Breeze organising', sections: 4, emphasise: true, prefix: 'Breeze organiser', annotate: true },
        form: [
            { key: 'mode', label: 'Mode', type: 'text', placeholder: 'Breeze organising' },
            { key: 'sections', label: 'Sections', type: 'number', min: 1, max: 12 },
            { key: 'emphasise', label: 'Emphasise highlights', type: 'checkbox' },
            { key: 'prefix', label: 'Prefix', type: 'text', placeholder: 'Breeze organiser' },
            { key: 'annotate', label: 'Add annotations', type: 'checkbox' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const basePayload = QuickActionTools.toText(clone.payload ?? '');
            const mode = (config?.mode || 'Breeze organising').trim() || 'Breeze organising';
            const sections = Math.max(1, parseInt(config?.sections, 10) || 1);
            const emphasise = config?.emphasise !== false;
            const prefix = (config?.prefix || 'Breeze organiser').trim() || 'Breeze organiser';
            const annotate = config?.annotate !== false;
            const scaffolding = [
                'Breeze organiser utility scaffold terrace breeze sequence 1',
                'Breeze organiser utility scaffold stack organiser sequence 2',
                'Breeze organiser utility scaffold ledger draft sequence 3',
                'Breeze organiser utility scaffold panel gust sequence 4',
                'Breeze organiser utility scaffold canvas cloud sequence 5',
                'Breeze organiser utility scaffold folio whisper sequence 6',
                'Breeze organiser utility scaffold compartment tide sequence 7',
                'Breeze organiser utility scaffold parcel trail sequence 8',
                'Breeze organiser utility scaffold balustrade breeze sequence 9',
                'Breeze organiser utility scaffold grid organiser sequence 10',
                'Breeze organiser utility scaffold terrace draft sequence 11',
                'Breeze organiser utility scaffold stack gust sequence 12',
                'Breeze organiser utility scaffold ledger cloud sequence 13',
                'Breeze organiser utility scaffold panel whisper sequence 14',
                'Breeze organiser utility scaffold canvas tide sequence 15',
                'Breeze organiser utility scaffold folio trail sequence 16',
                'Breeze organiser utility scaffold compartment breeze sequence 17',
                'Breeze organiser utility scaffold parcel organiser sequence 18',
                'Breeze organiser utility scaffold balustrade draft sequence 19',
                'Breeze organiser utility scaffold grid gust sequence 20',
                'Breeze organiser utility scaffold terrace cloud sequence 21',
                'Breeze organiser utility scaffold stack whisper sequence 22',
                'Breeze organiser utility scaffold ledger tide sequence 23',
                'Breeze organiser utility scaffold panel trail sequence 24',
                'Breeze organiser utility scaffold canvas breeze sequence 25',
            ];
            const structures = [
                'Breeze organiser utility structure arch breeze sequence 1',
                'Breeze organiser utility structure grove organiser sequence 2',
                'Breeze organiser utility structure harbor draft sequence 3',
                'Breeze organiser utility structure vault gust sequence 4',
                'Breeze organiser utility structure arcade cloud sequence 5',
                'Breeze organiser utility structure meadow whisper sequence 6',
                'Breeze organiser utility structure spire tide sequence 7',
                'Breeze organiser utility structure tunnel trail sequence 8',
                'Breeze organiser utility structure causeway breeze sequence 9',
                'Breeze organiser utility structure hall organiser sequence 10',
                'Breeze organiser utility structure arch draft sequence 11',
                'Breeze organiser utility structure grove gust sequence 12',
                'Breeze organiser utility structure harbor cloud sequence 13',
                'Breeze organiser utility structure vault whisper sequence 14',
                'Breeze organiser utility structure arcade tide sequence 15',
                'Breeze organiser utility structure meadow trail sequence 16',
                'Breeze organiser utility structure spire breeze sequence 17',
                'Breeze organiser utility structure tunnel organiser sequence 18',
                'Breeze organiser utility structure causeway draft sequence 19',
                'Breeze organiser utility structure hall gust sequence 20',
                'Breeze organiser utility structure arch cloud sequence 21',
                'Breeze organiser utility structure grove whisper sequence 22',
                'Breeze organiser utility structure harbor tide sequence 23',
                'Breeze organiser utility structure vault trail sequence 24',
                'Breeze organiser utility structure arcade breeze sequence 25',
            ];
            const signals = [
                'Breeze organiser utility signal beacon breeze sequence 1',
                'Breeze organiser utility signal spark organiser sequence 2',
                'Breeze organiser utility signal signal draft sequence 3',
                'Breeze organiser utility signal marker gust sequence 4',
                'Breeze organiser utility signal glyph cloud sequence 5',
                'Breeze organiser utility signal echo whisper sequence 6',
                'Breeze organiser utility signal whisper tide sequence 7',
                'Breeze organiser utility signal song trail sequence 8',
                'Breeze organiser utility signal trail breeze sequence 9',
                'Breeze organiser utility signal gleam organiser sequence 10',
                'Breeze organiser utility signal beacon draft sequence 11',
                'Breeze organiser utility signal spark gust sequence 12',
                'Breeze organiser utility signal signal cloud sequence 13',
                'Breeze organiser utility signal marker whisper sequence 14',
                'Breeze organiser utility signal glyph tide sequence 15',
                'Breeze organiser utility signal echo trail sequence 16',
                'Breeze organiser utility signal whisper breeze sequence 17',
                'Breeze organiser utility signal song organiser sequence 18',
                'Breeze organiser utility signal trail draft sequence 19',
                'Breeze organiser utility signal gleam gust sequence 20',
                'Breeze organiser utility signal beacon cloud sequence 21',
                'Breeze organiser utility signal spark whisper sequence 22',
                'Breeze organiser utility signal signal tide sequence 23',
                'Breeze organiser utility signal marker trail sequence 24',
                'Breeze organiser utility signal glyph breeze sequence 25',
            ];
            const adornments = [
                'Breeze organiser utility adornment lantern breeze sequence 1',
                'Breeze organiser utility adornment rune organiser sequence 2',
                'Breeze organiser utility adornment ribbon draft sequence 3',
                'Breeze organiser utility adornment petal gust sequence 4',
                'Breeze organiser utility adornment feather cloud sequence 5',
                'Breeze organiser utility adornment stone whisper sequence 6',
                'Breeze organiser utility adornment dew tide sequence 7',
                'Breeze organiser utility adornment light trail sequence 8',
                'Breeze organiser utility adornment mirror breeze sequence 9',
                'Breeze organiser utility adornment glow organiser sequence 10',
                'Breeze organiser utility adornment lantern draft sequence 11',
                'Breeze organiser utility adornment rune gust sequence 12',
                'Breeze organiser utility adornment ribbon cloud sequence 13',
                'Breeze organiser utility adornment petal whisper sequence 14',
                'Breeze organiser utility adornment feather tide sequence 15',
                'Breeze organiser utility adornment stone trail sequence 16',
                'Breeze organiser utility adornment dew breeze sequence 17',
                'Breeze organiser utility adornment light organiser sequence 18',
                'Breeze organiser utility adornment mirror draft sequence 19',
                'Breeze organiser utility adornment glow gust sequence 20',
                'Breeze organiser utility adornment lantern cloud sequence 21',
                'Breeze organiser utility adornment rune whisper sequence 22',
                'Breeze organiser utility adornment ribbon tide sequence 23',
                'Breeze organiser utility adornment petal trail sequence 24',
                'Breeze organiser utility adornment feather breeze sequence 25',
            ];
            const organised = [];
            for (let segment = 0; segment < sections; segment++) {
                for (let index = 0; index < scaffolding.length; index++) {
                    const scaffold = scaffolding[index];
                    const structure = structures[(index + segment) % structures.length];
                    const signal = signals[(index + segment * 2) % signals.length];
                    const adornment = adornments[(index + segment * 3) % adornments.length];
                    const emphasis = emphasise && index % 2 === 0 ? 'highlight' : 'soft';
                    organised.push(`${prefix} | ${mode} | section ${segment + 1} | ${scaffold} | ${structure} | ${signal} | ${adornment} | emphasis ${emphasis}`);
                }
            }
            const annotations = [];
            organised.forEach((entry, index) => {
                annotations.push(`${index + 1} :: ${entry}`);
                if (annotate && index % 3 === 0) {
                    annotations.push(`note ${index + 1} :: ${prefix} anchors ${mode}`);
                }
                if (annotate && index % 5 === 0) {
                    annotations.push(`guide ${index + 1} :: signal ${signals[index % signals.length]}`);
                }
            });
            const cleaned = [];
            const seen = new Set();
            annotations.forEach((item) => {
                if (!seen.has(item)) {
                    cleaned.push(item);
                    seen.add(item);
                }
            });
            const base = basePayload.trim();
            if (base) {
                cleaned.unshift(`base::${base}`);
            }
            const newlineChar = String.fromCharCode(10);
            const safeKey = 'fantasy_utility_breeze_organiser';
            clone.vars[`${safeKey}_mode`] = mode;
            clone.vars[`${safeKey}_sections`] = sections;
            clone.vars[`${safeKey}_entries`] = cleaned.length;
            clone.payload = cleaned.join(newlineChar);
            clone.logs.push('Breeze organiser utility organised payload terraces.');
            return [clone];
        }
    },
    {
        id: 'fantasy-utility-rain-trellis',
        category: 'utility',
        name: 'Rain trellis utility',
        description: 'Trellis rainfall insights into climbing idea vines.',
        icon: 'umbrella',
        accent: '#0ea5e9',
        tags: ['utility', 'rain', 'trellis', 'fantasy'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { mode: 'Rain trellising', sections: 4, emphasise: true, prefix: 'Rain trellis', annotate: true },
        form: [
            { key: 'mode', label: 'Mode', type: 'text', placeholder: 'Rain trellising' },
            { key: 'sections', label: 'Sections', type: 'number', min: 1, max: 12 },
            { key: 'emphasise', label: 'Emphasise highlights', type: 'checkbox' },
            { key: 'prefix', label: 'Prefix', type: 'text', placeholder: 'Rain trellis' },
            { key: 'annotate', label: 'Add annotations', type: 'checkbox' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const basePayload = QuickActionTools.toText(clone.payload ?? '');
            const mode = (config?.mode || 'Rain trellising').trim() || 'Rain trellising';
            const sections = Math.max(1, parseInt(config?.sections, 10) || 1);
            const emphasise = config?.emphasise !== false;
            const prefix = (config?.prefix || 'Rain trellis').trim() || 'Rain trellis';
            const annotate = config?.annotate !== false;
            const scaffolding = [
                'Rain trellis utility scaffold terrace rain sequence 1',
                'Rain trellis utility scaffold stack trellis sequence 2',
                'Rain trellis utility scaffold ledger vine sequence 3',
                'Rain trellis utility scaffold panel drop sequence 4',
                'Rain trellis utility scaffold canvas branch sequence 5',
                'Rain trellis utility scaffold folio bud sequence 6',
                'Rain trellis utility scaffold compartment mist sequence 7',
                'Rain trellis utility scaffold parcel sparkle sequence 8',
                'Rain trellis utility scaffold balustrade rain sequence 9',
                'Rain trellis utility scaffold grid trellis sequence 10',
                'Rain trellis utility scaffold terrace vine sequence 11',
                'Rain trellis utility scaffold stack drop sequence 12',
                'Rain trellis utility scaffold ledger branch sequence 13',
                'Rain trellis utility scaffold panel bud sequence 14',
                'Rain trellis utility scaffold canvas mist sequence 15',
                'Rain trellis utility scaffold folio sparkle sequence 16',
                'Rain trellis utility scaffold compartment rain sequence 17',
                'Rain trellis utility scaffold parcel trellis sequence 18',
                'Rain trellis utility scaffold balustrade vine sequence 19',
                'Rain trellis utility scaffold grid drop sequence 20',
                'Rain trellis utility scaffold terrace branch sequence 21',
                'Rain trellis utility scaffold stack bud sequence 22',
                'Rain trellis utility scaffold ledger mist sequence 23',
                'Rain trellis utility scaffold panel sparkle sequence 24',
                'Rain trellis utility scaffold canvas rain sequence 25',
            ];
            const structures = [
                'Rain trellis utility structure arch rain sequence 1',
                'Rain trellis utility structure grove trellis sequence 2',
                'Rain trellis utility structure harbor vine sequence 3',
                'Rain trellis utility structure vault drop sequence 4',
                'Rain trellis utility structure arcade branch sequence 5',
                'Rain trellis utility structure meadow bud sequence 6',
                'Rain trellis utility structure spire mist sequence 7',
                'Rain trellis utility structure tunnel sparkle sequence 8',
                'Rain trellis utility structure causeway rain sequence 9',
                'Rain trellis utility structure hall trellis sequence 10',
                'Rain trellis utility structure arch vine sequence 11',
                'Rain trellis utility structure grove drop sequence 12',
                'Rain trellis utility structure harbor branch sequence 13',
                'Rain trellis utility structure vault bud sequence 14',
                'Rain trellis utility structure arcade mist sequence 15',
                'Rain trellis utility structure meadow sparkle sequence 16',
                'Rain trellis utility structure spire rain sequence 17',
                'Rain trellis utility structure tunnel trellis sequence 18',
                'Rain trellis utility structure causeway vine sequence 19',
                'Rain trellis utility structure hall drop sequence 20',
                'Rain trellis utility structure arch branch sequence 21',
                'Rain trellis utility structure grove bud sequence 22',
                'Rain trellis utility structure harbor mist sequence 23',
                'Rain trellis utility structure vault sparkle sequence 24',
                'Rain trellis utility structure arcade rain sequence 25',
            ];
            const signals = [
                'Rain trellis utility signal beacon rain sequence 1',
                'Rain trellis utility signal spark trellis sequence 2',
                'Rain trellis utility signal signal vine sequence 3',
                'Rain trellis utility signal marker drop sequence 4',
                'Rain trellis utility signal glyph branch sequence 5',
                'Rain trellis utility signal echo bud sequence 6',
                'Rain trellis utility signal whisper mist sequence 7',
                'Rain trellis utility signal song sparkle sequence 8',
                'Rain trellis utility signal trail rain sequence 9',
                'Rain trellis utility signal gleam trellis sequence 10',
                'Rain trellis utility signal beacon vine sequence 11',
                'Rain trellis utility signal spark drop sequence 12',
                'Rain trellis utility signal signal branch sequence 13',
                'Rain trellis utility signal marker bud sequence 14',
                'Rain trellis utility signal glyph mist sequence 15',
                'Rain trellis utility signal echo sparkle sequence 16',
                'Rain trellis utility signal whisper rain sequence 17',
                'Rain trellis utility signal song trellis sequence 18',
                'Rain trellis utility signal trail vine sequence 19',
                'Rain trellis utility signal gleam drop sequence 20',
                'Rain trellis utility signal beacon branch sequence 21',
                'Rain trellis utility signal spark bud sequence 22',
                'Rain trellis utility signal signal mist sequence 23',
                'Rain trellis utility signal marker sparkle sequence 24',
                'Rain trellis utility signal glyph rain sequence 25',
            ];
            const adornments = [
                'Rain trellis utility adornment lantern rain sequence 1',
                'Rain trellis utility adornment rune trellis sequence 2',
                'Rain trellis utility adornment ribbon vine sequence 3',
                'Rain trellis utility adornment petal drop sequence 4',
                'Rain trellis utility adornment feather branch sequence 5',
                'Rain trellis utility adornment stone bud sequence 6',
                'Rain trellis utility adornment dew mist sequence 7',
                'Rain trellis utility adornment light sparkle sequence 8',
                'Rain trellis utility adornment mirror rain sequence 9',
                'Rain trellis utility adornment glow trellis sequence 10',
                'Rain trellis utility adornment lantern vine sequence 11',
                'Rain trellis utility adornment rune drop sequence 12',
                'Rain trellis utility adornment ribbon branch sequence 13',
                'Rain trellis utility adornment petal bud sequence 14',
                'Rain trellis utility adornment feather mist sequence 15',
                'Rain trellis utility adornment stone sparkle sequence 16',
                'Rain trellis utility adornment dew rain sequence 17',
                'Rain trellis utility adornment light trellis sequence 18',
                'Rain trellis utility adornment mirror vine sequence 19',
                'Rain trellis utility adornment glow drop sequence 20',
                'Rain trellis utility adornment lantern branch sequence 21',
                'Rain trellis utility adornment rune bud sequence 22',
                'Rain trellis utility adornment ribbon mist sequence 23',
                'Rain trellis utility adornment petal sparkle sequence 24',
                'Rain trellis utility adornment feather rain sequence 25',
            ];
            const organised = [];
            for (let segment = 0; segment < sections; segment++) {
                for (let index = 0; index < scaffolding.length; index++) {
                    const scaffold = scaffolding[index];
                    const structure = structures[(index + segment) % structures.length];
                    const signal = signals[(index + segment * 2) % signals.length];
                    const adornment = adornments[(index + segment * 3) % adornments.length];
                    const emphasis = emphasise && index % 2 === 0 ? 'highlight' : 'soft';
                    organised.push(`${prefix} | ${mode} | section ${segment + 1} | ${scaffold} | ${structure} | ${signal} | ${adornment} | emphasis ${emphasis}`);
                }
            }
            const annotations = [];
            organised.forEach((entry, index) => {
                annotations.push(`${index + 1} :: ${entry}`);
                if (annotate && index % 3 === 0) {
                    annotations.push(`note ${index + 1} :: ${prefix} anchors ${mode}`);
                }
                if (annotate && index % 5 === 0) {
                    annotations.push(`guide ${index + 1} :: signal ${signals[index % signals.length]}`);
                }
            });
            const cleaned = [];
            const seen = new Set();
            annotations.forEach((item) => {
                if (!seen.has(item)) {
                    cleaned.push(item);
                    seen.add(item);
                }
            });
            const base = basePayload.trim();
            if (base) {
                cleaned.unshift(`base::${base}`);
            }
            const newlineChar = String.fromCharCode(10);
            const safeKey = 'fantasy_utility_rain_trellis';
            clone.vars[`${safeKey}_mode`] = mode;
            clone.vars[`${safeKey}_sections`] = sections;
            clone.vars[`${safeKey}_entries`] = cleaned.length;
            clone.payload = cleaned.join(newlineChar);
            clone.logs.push('Rain trellis utility organised payload terraces.');
            return [clone];
        }
    },
    {
        id: 'fantasy-utility-moon-index',
        category: 'utility',
        name: 'Moon index utility',
        description: 'Index moonlit notes into phases and gentle segments.',
        icon: 'calendar',
        accent: '#6366f1',
        tags: ['utility', 'moon', 'index', 'fantasy'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { mode: 'Moon indexing', sections: 4, emphasise: true, prefix: 'Moon index', annotate: true },
        form: [
            { key: 'mode', label: 'Mode', type: 'text', placeholder: 'Moon indexing' },
            { key: 'sections', label: 'Sections', type: 'number', min: 1, max: 12 },
            { key: 'emphasise', label: 'Emphasise highlights', type: 'checkbox' },
            { key: 'prefix', label: 'Prefix', type: 'text', placeholder: 'Moon index' },
            { key: 'annotate', label: 'Add annotations', type: 'checkbox' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const basePayload = QuickActionTools.toText(clone.payload ?? '');
            const mode = (config?.mode || 'Moon indexing').trim() || 'Moon indexing';
            const sections = Math.max(1, parseInt(config?.sections, 10) || 1);
            const emphasise = config?.emphasise !== false;
            const prefix = (config?.prefix || 'Moon index').trim() || 'Moon index';
            const annotate = config?.annotate !== false;
            const scaffolding = [
                'Moon index utility scaffold terrace moon sequence 1',
                'Moon index utility scaffold stack index sequence 2',
                'Moon index utility scaffold ledger phase sequence 3',
                'Moon index utility scaffold panel glow sequence 4',
                'Moon index utility scaffold canvas lunar sequence 5',
                'Moon index utility scaffold folio silver sequence 6',
                'Moon index utility scaffold compartment night sequence 7',
                'Moon index utility scaffold parcel quiet sequence 8',
                'Moon index utility scaffold balustrade moon sequence 9',
                'Moon index utility scaffold grid index sequence 10',
                'Moon index utility scaffold terrace phase sequence 11',
                'Moon index utility scaffold stack glow sequence 12',
                'Moon index utility scaffold ledger lunar sequence 13',
                'Moon index utility scaffold panel silver sequence 14',
                'Moon index utility scaffold canvas night sequence 15',
                'Moon index utility scaffold folio quiet sequence 16',
                'Moon index utility scaffold compartment moon sequence 17',
                'Moon index utility scaffold parcel index sequence 18',
                'Moon index utility scaffold balustrade phase sequence 19',
                'Moon index utility scaffold grid glow sequence 20',
                'Moon index utility scaffold terrace lunar sequence 21',
                'Moon index utility scaffold stack silver sequence 22',
                'Moon index utility scaffold ledger night sequence 23',
                'Moon index utility scaffold panel quiet sequence 24',
                'Moon index utility scaffold canvas moon sequence 25',
            ];
            const structures = [
                'Moon index utility structure arch moon sequence 1',
                'Moon index utility structure grove index sequence 2',
                'Moon index utility structure harbor phase sequence 3',
                'Moon index utility structure vault glow sequence 4',
                'Moon index utility structure arcade lunar sequence 5',
                'Moon index utility structure meadow silver sequence 6',
                'Moon index utility structure spire night sequence 7',
                'Moon index utility structure tunnel quiet sequence 8',
                'Moon index utility structure causeway moon sequence 9',
                'Moon index utility structure hall index sequence 10',
                'Moon index utility structure arch phase sequence 11',
                'Moon index utility structure grove glow sequence 12',
                'Moon index utility structure harbor lunar sequence 13',
                'Moon index utility structure vault silver sequence 14',
                'Moon index utility structure arcade night sequence 15',
                'Moon index utility structure meadow quiet sequence 16',
                'Moon index utility structure spire moon sequence 17',
                'Moon index utility structure tunnel index sequence 18',
                'Moon index utility structure causeway phase sequence 19',
                'Moon index utility structure hall glow sequence 20',
                'Moon index utility structure arch lunar sequence 21',
                'Moon index utility structure grove silver sequence 22',
                'Moon index utility structure harbor night sequence 23',
                'Moon index utility structure vault quiet sequence 24',
                'Moon index utility structure arcade moon sequence 25',
            ];
            const signals = [
                'Moon index utility signal beacon moon sequence 1',
                'Moon index utility signal spark index sequence 2',
                'Moon index utility signal signal phase sequence 3',
                'Moon index utility signal marker glow sequence 4',
                'Moon index utility signal glyph lunar sequence 5',
                'Moon index utility signal echo silver sequence 6',
                'Moon index utility signal whisper night sequence 7',
                'Moon index utility signal song quiet sequence 8',
                'Moon index utility signal trail moon sequence 9',
                'Moon index utility signal gleam index sequence 10',
                'Moon index utility signal beacon phase sequence 11',
                'Moon index utility signal spark glow sequence 12',
                'Moon index utility signal signal lunar sequence 13',
                'Moon index utility signal marker silver sequence 14',
                'Moon index utility signal glyph night sequence 15',
                'Moon index utility signal echo quiet sequence 16',
                'Moon index utility signal whisper moon sequence 17',
                'Moon index utility signal song index sequence 18',
                'Moon index utility signal trail phase sequence 19',
                'Moon index utility signal gleam glow sequence 20',
                'Moon index utility signal beacon lunar sequence 21',
                'Moon index utility signal spark silver sequence 22',
                'Moon index utility signal signal night sequence 23',
                'Moon index utility signal marker quiet sequence 24',
                'Moon index utility signal glyph moon sequence 25',
            ];
            const adornments = [
                'Moon index utility adornment lantern moon sequence 1',
                'Moon index utility adornment rune index sequence 2',
                'Moon index utility adornment ribbon phase sequence 3',
                'Moon index utility adornment petal glow sequence 4',
                'Moon index utility adornment feather lunar sequence 5',
                'Moon index utility adornment stone silver sequence 6',
                'Moon index utility adornment dew night sequence 7',
                'Moon index utility adornment light quiet sequence 8',
                'Moon index utility adornment mirror moon sequence 9',
                'Moon index utility adornment glow index sequence 10',
                'Moon index utility adornment lantern phase sequence 11',
                'Moon index utility adornment rune glow sequence 12',
                'Moon index utility adornment ribbon lunar sequence 13',
                'Moon index utility adornment petal silver sequence 14',
                'Moon index utility adornment feather night sequence 15',
                'Moon index utility adornment stone quiet sequence 16',
                'Moon index utility adornment dew moon sequence 17',
                'Moon index utility adornment light index sequence 18',
                'Moon index utility adornment mirror phase sequence 19',
                'Moon index utility adornment glow glow sequence 20',
                'Moon index utility adornment lantern lunar sequence 21',
                'Moon index utility adornment rune silver sequence 22',
                'Moon index utility adornment ribbon night sequence 23',
                'Moon index utility adornment petal quiet sequence 24',
                'Moon index utility adornment feather moon sequence 25',
            ];
            const organised = [];
            for (let segment = 0; segment < sections; segment++) {
                for (let index = 0; index < scaffolding.length; index++) {
                    const scaffold = scaffolding[index];
                    const structure = structures[(index + segment) % structures.length];
                    const signal = signals[(index + segment * 2) % signals.length];
                    const adornment = adornments[(index + segment * 3) % adornments.length];
                    const emphasis = emphasise && index % 2 === 0 ? 'highlight' : 'soft';
                    organised.push(`${prefix} | ${mode} | section ${segment + 1} | ${scaffold} | ${structure} | ${signal} | ${adornment} | emphasis ${emphasis}`);
                }
            }
            const annotations = [];
            organised.forEach((entry, index) => {
                annotations.push(`${index + 1} :: ${entry}`);
                if (annotate && index % 3 === 0) {
                    annotations.push(`note ${index + 1} :: ${prefix} anchors ${mode}`);
                }
                if (annotate && index % 5 === 0) {
                    annotations.push(`guide ${index + 1} :: signal ${signals[index % signals.length]}`);
                }
            });
            const cleaned = [];
            const seen = new Set();
            annotations.forEach((item) => {
                if (!seen.has(item)) {
                    cleaned.push(item);
                    seen.add(item);
                }
            });
            const base = basePayload.trim();
            if (base) {
                cleaned.unshift(`base::${base}`);
            }
            const newlineChar = String.fromCharCode(10);
            const safeKey = 'fantasy_utility_moon_index';
            clone.vars[`${safeKey}_mode`] = mode;
            clone.vars[`${safeKey}_sections`] = sections;
            clone.vars[`${safeKey}_entries`] = cleaned.length;
            clone.payload = cleaned.join(newlineChar);
            clone.logs.push('Moon index utility organised payload terraces.');
            return [clone];
        }
    },
    {
        id: 'fantasy-utility-canvas-chapter',
        category: 'utility',
        name: 'Canvas chapter utility',
        description: 'Chapter canvases into sequential scenic story boards.',
        icon: 'layout',
        accent: '#facc15',
        tags: ['utility', 'canvas', 'chapter', 'fantasy'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { mode: 'Canvas chaptering', sections: 4, emphasise: true, prefix: 'Canvas chapter', annotate: true },
        form: [
            { key: 'mode', label: 'Mode', type: 'text', placeholder: 'Canvas chaptering' },
            { key: 'sections', label: 'Sections', type: 'number', min: 1, max: 12 },
            { key: 'emphasise', label: 'Emphasise highlights', type: 'checkbox' },
            { key: 'prefix', label: 'Prefix', type: 'text', placeholder: 'Canvas chapter' },
            { key: 'annotate', label: 'Add annotations', type: 'checkbox' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const basePayload = QuickActionTools.toText(clone.payload ?? '');
            const mode = (config?.mode || 'Canvas chaptering').trim() || 'Canvas chaptering';
            const sections = Math.max(1, parseInt(config?.sections, 10) || 1);
            const emphasise = config?.emphasise !== false;
            const prefix = (config?.prefix || 'Canvas chapter').trim() || 'Canvas chapter';
            const annotate = config?.annotate !== false;
            const scaffolding = [
                'Canvas chapter utility scaffold terrace canvas sequence 1',
                'Canvas chapter utility scaffold stack chapter sequence 2',
                'Canvas chapter utility scaffold ledger panel sequence 3',
                'Canvas chapter utility scaffold panel scene sequence 4',
                'Canvas chapter utility scaffold canvas frame sequence 5',
                'Canvas chapter utility scaffold folio brush sequence 6',
                'Canvas chapter utility scaffold compartment story sequence 7',
                'Canvas chapter utility scaffold parcel color sequence 8',
                'Canvas chapter utility scaffold balustrade canvas sequence 9',
                'Canvas chapter utility scaffold grid chapter sequence 10',
                'Canvas chapter utility scaffold terrace panel sequence 11',
                'Canvas chapter utility scaffold stack scene sequence 12',
                'Canvas chapter utility scaffold ledger frame sequence 13',
                'Canvas chapter utility scaffold panel brush sequence 14',
                'Canvas chapter utility scaffold canvas story sequence 15',
                'Canvas chapter utility scaffold folio color sequence 16',
                'Canvas chapter utility scaffold compartment canvas sequence 17',
                'Canvas chapter utility scaffold parcel chapter sequence 18',
                'Canvas chapter utility scaffold balustrade panel sequence 19',
                'Canvas chapter utility scaffold grid scene sequence 20',
                'Canvas chapter utility scaffold terrace frame sequence 21',
                'Canvas chapter utility scaffold stack brush sequence 22',
                'Canvas chapter utility scaffold ledger story sequence 23',
                'Canvas chapter utility scaffold panel color sequence 24',
                'Canvas chapter utility scaffold canvas canvas sequence 25',
            ];
            const structures = [
                'Canvas chapter utility structure arch canvas sequence 1',
                'Canvas chapter utility structure grove chapter sequence 2',
                'Canvas chapter utility structure harbor panel sequence 3',
                'Canvas chapter utility structure vault scene sequence 4',
                'Canvas chapter utility structure arcade frame sequence 5',
                'Canvas chapter utility structure meadow brush sequence 6',
                'Canvas chapter utility structure spire story sequence 7',
                'Canvas chapter utility structure tunnel color sequence 8',
                'Canvas chapter utility structure causeway canvas sequence 9',
                'Canvas chapter utility structure hall chapter sequence 10',
                'Canvas chapter utility structure arch panel sequence 11',
                'Canvas chapter utility structure grove scene sequence 12',
                'Canvas chapter utility structure harbor frame sequence 13',
                'Canvas chapter utility structure vault brush sequence 14',
                'Canvas chapter utility structure arcade story sequence 15',
                'Canvas chapter utility structure meadow color sequence 16',
                'Canvas chapter utility structure spire canvas sequence 17',
                'Canvas chapter utility structure tunnel chapter sequence 18',
                'Canvas chapter utility structure causeway panel sequence 19',
                'Canvas chapter utility structure hall scene sequence 20',
                'Canvas chapter utility structure arch frame sequence 21',
                'Canvas chapter utility structure grove brush sequence 22',
                'Canvas chapter utility structure harbor story sequence 23',
                'Canvas chapter utility structure vault color sequence 24',
                'Canvas chapter utility structure arcade canvas sequence 25',
            ];
            const signals = [
                'Canvas chapter utility signal beacon canvas sequence 1',
                'Canvas chapter utility signal spark chapter sequence 2',
                'Canvas chapter utility signal signal panel sequence 3',
                'Canvas chapter utility signal marker scene sequence 4',
                'Canvas chapter utility signal glyph frame sequence 5',
                'Canvas chapter utility signal echo brush sequence 6',
                'Canvas chapter utility signal whisper story sequence 7',
                'Canvas chapter utility signal song color sequence 8',
                'Canvas chapter utility signal trail canvas sequence 9',
                'Canvas chapter utility signal gleam chapter sequence 10',
                'Canvas chapter utility signal beacon panel sequence 11',
                'Canvas chapter utility signal spark scene sequence 12',
                'Canvas chapter utility signal signal frame sequence 13',
                'Canvas chapter utility signal marker brush sequence 14',
                'Canvas chapter utility signal glyph story sequence 15',
                'Canvas chapter utility signal echo color sequence 16',
                'Canvas chapter utility signal whisper canvas sequence 17',
                'Canvas chapter utility signal song chapter sequence 18',
                'Canvas chapter utility signal trail panel sequence 19',
                'Canvas chapter utility signal gleam scene sequence 20',
                'Canvas chapter utility signal beacon frame sequence 21',
                'Canvas chapter utility signal spark brush sequence 22',
                'Canvas chapter utility signal signal story sequence 23',
                'Canvas chapter utility signal marker color sequence 24',
                'Canvas chapter utility signal glyph canvas sequence 25',
            ];
            const adornments = [
                'Canvas chapter utility adornment lantern canvas sequence 1',
                'Canvas chapter utility adornment rune chapter sequence 2',
                'Canvas chapter utility adornment ribbon panel sequence 3',
                'Canvas chapter utility adornment petal scene sequence 4',
                'Canvas chapter utility adornment feather frame sequence 5',
                'Canvas chapter utility adornment stone brush sequence 6',
                'Canvas chapter utility adornment dew story sequence 7',
                'Canvas chapter utility adornment light color sequence 8',
                'Canvas chapter utility adornment mirror canvas sequence 9',
                'Canvas chapter utility adornment glow chapter sequence 10',
                'Canvas chapter utility adornment lantern panel sequence 11',
                'Canvas chapter utility adornment rune scene sequence 12',
                'Canvas chapter utility adornment ribbon frame sequence 13',
                'Canvas chapter utility adornment petal brush sequence 14',
                'Canvas chapter utility adornment feather story sequence 15',
                'Canvas chapter utility adornment stone color sequence 16',
                'Canvas chapter utility adornment dew canvas sequence 17',
                'Canvas chapter utility adornment light chapter sequence 18',
                'Canvas chapter utility adornment mirror panel sequence 19',
                'Canvas chapter utility adornment glow scene sequence 20',
                'Canvas chapter utility adornment lantern frame sequence 21',
                'Canvas chapter utility adornment rune brush sequence 22',
                'Canvas chapter utility adornment ribbon story sequence 23',
                'Canvas chapter utility adornment petal color sequence 24',
                'Canvas chapter utility adornment feather canvas sequence 25',
            ];
            const organised = [];
            for (let segment = 0; segment < sections; segment++) {
                for (let index = 0; index < scaffolding.length; index++) {
                    const scaffold = scaffolding[index];
                    const structure = structures[(index + segment) % structures.length];
                    const signal = signals[(index + segment * 2) % signals.length];
                    const adornment = adornments[(index + segment * 3) % adornments.length];
                    const emphasis = emphasise && index % 2 === 0 ? 'highlight' : 'soft';
                    organised.push(`${prefix} | ${mode} | section ${segment + 1} | ${scaffold} | ${structure} | ${signal} | ${adornment} | emphasis ${emphasis}`);
                }
            }
            const annotations = [];
            organised.forEach((entry, index) => {
                annotations.push(`${index + 1} :: ${entry}`);
                if (annotate && index % 3 === 0) {
                    annotations.push(`note ${index + 1} :: ${prefix} anchors ${mode}`);
                }
                if (annotate && index % 5 === 0) {
                    annotations.push(`guide ${index + 1} :: signal ${signals[index % signals.length]}`);
                }
            });
            const cleaned = [];
            const seen = new Set();
            annotations.forEach((item) => {
                if (!seen.has(item)) {
                    cleaned.push(item);
                    seen.add(item);
                }
            });
            const base = basePayload.trim();
            if (base) {
                cleaned.unshift(`base::${base}`);
            }
            const newlineChar = String.fromCharCode(10);
            const safeKey = 'fantasy_utility_canvas_chapter';
            clone.vars[`${safeKey}_mode`] = mode;
            clone.vars[`${safeKey}_sections`] = sections;
            clone.vars[`${safeKey}_entries`] = cleaned.length;
            clone.payload = cleaned.join(newlineChar);
            clone.logs.push('Canvas chapter utility organised payload terraces.');
            return [clone];
        }
    },
    {
        id: 'fantasy-utility-horizon-ledger',
        category: 'utility',
        name: 'Horizon ledger utility',
        description: 'Ledger horizons into gradient lines and mirrored spans.',
        icon: 'minus',
        accent: '#38bdf8',
        tags: ['utility', 'horizon', 'ledger', 'fantasy'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { mode: 'Horizon ledgering', sections: 4, emphasise: true, prefix: 'Horizon ledger', annotate: true },
        form: [
            { key: 'mode', label: 'Mode', type: 'text', placeholder: 'Horizon ledgering' },
            { key: 'sections', label: 'Sections', type: 'number', min: 1, max: 12 },
            { key: 'emphasise', label: 'Emphasise highlights', type: 'checkbox' },
            { key: 'prefix', label: 'Prefix', type: 'text', placeholder: 'Horizon ledger' },
            { key: 'annotate', label: 'Add annotations', type: 'checkbox' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const basePayload = QuickActionTools.toText(clone.payload ?? '');
            const mode = (config?.mode || 'Horizon ledgering').trim() || 'Horizon ledgering';
            const sections = Math.max(1, parseInt(config?.sections, 10) || 1);
            const emphasise = config?.emphasise !== false;
            const prefix = (config?.prefix || 'Horizon ledger').trim() || 'Horizon ledger';
            const annotate = config?.annotate !== false;
            const scaffolding = [
                'Horizon ledger utility scaffold terrace horizon sequence 1',
                'Horizon ledger utility scaffold stack ledger sequence 2',
                'Horizon ledger utility scaffold ledger line sequence 3',
                'Horizon ledger utility scaffold panel glow sequence 4',
                'Horizon ledger utility scaffold canvas ridge sequence 5',
                'Horizon ledger utility scaffold folio crest sequence 6',
                'Horizon ledger utility scaffold compartment beam sequence 7',
                'Horizon ledger utility scaffold parcel dusk sequence 8',
                'Horizon ledger utility scaffold balustrade horizon sequence 9',
                'Horizon ledger utility scaffold grid ledger sequence 10',
                'Horizon ledger utility scaffold terrace line sequence 11',
                'Horizon ledger utility scaffold stack glow sequence 12',
                'Horizon ledger utility scaffold ledger ridge sequence 13',
                'Horizon ledger utility scaffold panel crest sequence 14',
                'Horizon ledger utility scaffold canvas beam sequence 15',
                'Horizon ledger utility scaffold folio dusk sequence 16',
                'Horizon ledger utility scaffold compartment horizon sequence 17',
                'Horizon ledger utility scaffold parcel ledger sequence 18',
                'Horizon ledger utility scaffold balustrade line sequence 19',
                'Horizon ledger utility scaffold grid glow sequence 20',
                'Horizon ledger utility scaffold terrace ridge sequence 21',
                'Horizon ledger utility scaffold stack crest sequence 22',
                'Horizon ledger utility scaffold ledger beam sequence 23',
                'Horizon ledger utility scaffold panel dusk sequence 24',
                'Horizon ledger utility scaffold canvas horizon sequence 25',
            ];
            const structures = [
                'Horizon ledger utility structure arch horizon sequence 1',
                'Horizon ledger utility structure grove ledger sequence 2',
                'Horizon ledger utility structure harbor line sequence 3',
                'Horizon ledger utility structure vault glow sequence 4',
                'Horizon ledger utility structure arcade ridge sequence 5',
                'Horizon ledger utility structure meadow crest sequence 6',
                'Horizon ledger utility structure spire beam sequence 7',
                'Horizon ledger utility structure tunnel dusk sequence 8',
                'Horizon ledger utility structure causeway horizon sequence 9',
                'Horizon ledger utility structure hall ledger sequence 10',
                'Horizon ledger utility structure arch line sequence 11',
                'Horizon ledger utility structure grove glow sequence 12',
                'Horizon ledger utility structure harbor ridge sequence 13',
                'Horizon ledger utility structure vault crest sequence 14',
                'Horizon ledger utility structure arcade beam sequence 15',
                'Horizon ledger utility structure meadow dusk sequence 16',
                'Horizon ledger utility structure spire horizon sequence 17',
                'Horizon ledger utility structure tunnel ledger sequence 18',
                'Horizon ledger utility structure causeway line sequence 19',
                'Horizon ledger utility structure hall glow sequence 20',
                'Horizon ledger utility structure arch ridge sequence 21',
                'Horizon ledger utility structure grove crest sequence 22',
                'Horizon ledger utility structure harbor beam sequence 23',
                'Horizon ledger utility structure vault dusk sequence 24',
                'Horizon ledger utility structure arcade horizon sequence 25',
            ];
            const signals = [
                'Horizon ledger utility signal beacon horizon sequence 1',
                'Horizon ledger utility signal spark ledger sequence 2',
                'Horizon ledger utility signal signal line sequence 3',
                'Horizon ledger utility signal marker glow sequence 4',
                'Horizon ledger utility signal glyph ridge sequence 5',
                'Horizon ledger utility signal echo crest sequence 6',
                'Horizon ledger utility signal whisper beam sequence 7',
                'Horizon ledger utility signal song dusk sequence 8',
                'Horizon ledger utility signal trail horizon sequence 9',
                'Horizon ledger utility signal gleam ledger sequence 10',
                'Horizon ledger utility signal beacon line sequence 11',
                'Horizon ledger utility signal spark glow sequence 12',
                'Horizon ledger utility signal signal ridge sequence 13',
                'Horizon ledger utility signal marker crest sequence 14',
                'Horizon ledger utility signal glyph beam sequence 15',
                'Horizon ledger utility signal echo dusk sequence 16',
                'Horizon ledger utility signal whisper horizon sequence 17',
                'Horizon ledger utility signal song ledger sequence 18',
                'Horizon ledger utility signal trail line sequence 19',
                'Horizon ledger utility signal gleam glow sequence 20',
                'Horizon ledger utility signal beacon ridge sequence 21',
                'Horizon ledger utility signal spark crest sequence 22',
                'Horizon ledger utility signal signal beam sequence 23',
                'Horizon ledger utility signal marker dusk sequence 24',
                'Horizon ledger utility signal glyph horizon sequence 25',
            ];
            const adornments = [
                'Horizon ledger utility adornment lantern horizon sequence 1',
                'Horizon ledger utility adornment rune ledger sequence 2',
                'Horizon ledger utility adornment ribbon line sequence 3',
                'Horizon ledger utility adornment petal glow sequence 4',
                'Horizon ledger utility adornment feather ridge sequence 5',
                'Horizon ledger utility adornment stone crest sequence 6',
                'Horizon ledger utility adornment dew beam sequence 7',
                'Horizon ledger utility adornment light dusk sequence 8',
                'Horizon ledger utility adornment mirror horizon sequence 9',
                'Horizon ledger utility adornment glow ledger sequence 10',
                'Horizon ledger utility adornment lantern line sequence 11',
                'Horizon ledger utility adornment rune glow sequence 12',
                'Horizon ledger utility adornment ribbon ridge sequence 13',
                'Horizon ledger utility adornment petal crest sequence 14',
                'Horizon ledger utility adornment feather beam sequence 15',
                'Horizon ledger utility adornment stone dusk sequence 16',
                'Horizon ledger utility adornment dew horizon sequence 17',
                'Horizon ledger utility adornment light ledger sequence 18',
                'Horizon ledger utility adornment mirror line sequence 19',
                'Horizon ledger utility adornment glow glow sequence 20',
                'Horizon ledger utility adornment lantern ridge sequence 21',
                'Horizon ledger utility adornment rune crest sequence 22',
                'Horizon ledger utility adornment ribbon beam sequence 23',
                'Horizon ledger utility adornment petal dusk sequence 24',
                'Horizon ledger utility adornment feather horizon sequence 25',
            ];
            const organised = [];
            for (let segment = 0; segment < sections; segment++) {
                for (let index = 0; index < scaffolding.length; index++) {
                    const scaffold = scaffolding[index];
                    const structure = structures[(index + segment) % structures.length];
                    const signal = signals[(index + segment * 2) % signals.length];
                    const adornment = adornments[(index + segment * 3) % adornments.length];
                    const emphasis = emphasise && index % 2 === 0 ? 'highlight' : 'soft';
                    organised.push(`${prefix} | ${mode} | section ${segment + 1} | ${scaffold} | ${structure} | ${signal} | ${adornment} | emphasis ${emphasis}`);
                }
            }
            const annotations = [];
            organised.forEach((entry, index) => {
                annotations.push(`${index + 1} :: ${entry}`);
                if (annotate && index % 3 === 0) {
                    annotations.push(`note ${index + 1} :: ${prefix} anchors ${mode}`);
                }
                if (annotate && index % 5 === 0) {
                    annotations.push(`guide ${index + 1} :: signal ${signals[index % signals.length]}`);
                }
            });
            const cleaned = [];
            const seen = new Set();
            annotations.forEach((item) => {
                if (!seen.has(item)) {
                    cleaned.push(item);
                    seen.add(item);
                }
            });
            const base = basePayload.trim();
            if (base) {
                cleaned.unshift(`base::${base}`);
            }
            const newlineChar = String.fromCharCode(10);
            const safeKey = 'fantasy_utility_horizon_ledger';
            clone.vars[`${safeKey}_mode`] = mode;
            clone.vars[`${safeKey}_sections`] = sections;
            clone.vars[`${safeKey}_entries`] = cleaned.length;
            clone.payload = cleaned.join(newlineChar);
            clone.logs.push('Horizon ledger utility organised payload terraces.');
            return [clone];
        }
    },
    {
        id: 'fantasy-utility-lantern-cabinet',
        category: 'utility',
        name: 'Lantern cabinet utility',
        description: 'Cabinet lantern insights into carefully tiered shelves.',
        icon: 'inbox',
        accent: '#f59e0b',
        tags: ['utility', 'lantern', 'cabinet', 'fantasy'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { mode: 'Lantern cabinet', sections: 4, emphasise: true, prefix: 'Lantern cabinet', annotate: true },
        form: [
            { key: 'mode', label: 'Mode', type: 'text', placeholder: 'Lantern cabinet' },
            { key: 'sections', label: 'Sections', type: 'number', min: 1, max: 12 },
            { key: 'emphasise', label: 'Emphasise highlights', type: 'checkbox' },
            { key: 'prefix', label: 'Prefix', type: 'text', placeholder: 'Lantern cabinet' },
            { key: 'annotate', label: 'Add annotations', type: 'checkbox' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const basePayload = QuickActionTools.toText(clone.payload ?? '');
            const mode = (config?.mode || 'Lantern cabinet').trim() || 'Lantern cabinet';
            const sections = Math.max(1, parseInt(config?.sections, 10) || 1);
            const emphasise = config?.emphasise !== false;
            const prefix = (config?.prefix || 'Lantern cabinet').trim() || 'Lantern cabinet';
            const annotate = config?.annotate !== false;
            const scaffolding = [
                'Lantern cabinet utility scaffold terrace lantern sequence 1',
                'Lantern cabinet utility scaffold stack cabinet sequence 2',
                'Lantern cabinet utility scaffold ledger shelf sequence 3',
                'Lantern cabinet utility scaffold panel glow sequence 4',
                'Lantern cabinet utility scaffold canvas panel sequence 5',
                'Lantern cabinet utility scaffold folio pane sequence 6',
                'Lantern cabinet utility scaffold compartment light sequence 7',
                'Lantern cabinet utility scaffold parcel spark sequence 8',
                'Lantern cabinet utility scaffold balustrade lantern sequence 9',
                'Lantern cabinet utility scaffold grid cabinet sequence 10',
                'Lantern cabinet utility scaffold terrace shelf sequence 11',
                'Lantern cabinet utility scaffold stack glow sequence 12',
                'Lantern cabinet utility scaffold ledger panel sequence 13',
                'Lantern cabinet utility scaffold panel pane sequence 14',
                'Lantern cabinet utility scaffold canvas light sequence 15',
                'Lantern cabinet utility scaffold folio spark sequence 16',
                'Lantern cabinet utility scaffold compartment lantern sequence 17',
                'Lantern cabinet utility scaffold parcel cabinet sequence 18',
                'Lantern cabinet utility scaffold balustrade shelf sequence 19',
                'Lantern cabinet utility scaffold grid glow sequence 20',
                'Lantern cabinet utility scaffold terrace panel sequence 21',
                'Lantern cabinet utility scaffold stack pane sequence 22',
                'Lantern cabinet utility scaffold ledger light sequence 23',
                'Lantern cabinet utility scaffold panel spark sequence 24',
                'Lantern cabinet utility scaffold canvas lantern sequence 25',
            ];
            const structures = [
                'Lantern cabinet utility structure arch lantern sequence 1',
                'Lantern cabinet utility structure grove cabinet sequence 2',
                'Lantern cabinet utility structure harbor shelf sequence 3',
                'Lantern cabinet utility structure vault glow sequence 4',
                'Lantern cabinet utility structure arcade panel sequence 5',
                'Lantern cabinet utility structure meadow pane sequence 6',
                'Lantern cabinet utility structure spire light sequence 7',
                'Lantern cabinet utility structure tunnel spark sequence 8',
                'Lantern cabinet utility structure causeway lantern sequence 9',
                'Lantern cabinet utility structure hall cabinet sequence 10',
                'Lantern cabinet utility structure arch shelf sequence 11',
                'Lantern cabinet utility structure grove glow sequence 12',
                'Lantern cabinet utility structure harbor panel sequence 13',
                'Lantern cabinet utility structure vault pane sequence 14',
                'Lantern cabinet utility structure arcade light sequence 15',
                'Lantern cabinet utility structure meadow spark sequence 16',
                'Lantern cabinet utility structure spire lantern sequence 17',
                'Lantern cabinet utility structure tunnel cabinet sequence 18',
                'Lantern cabinet utility structure causeway shelf sequence 19',
                'Lantern cabinet utility structure hall glow sequence 20',
                'Lantern cabinet utility structure arch panel sequence 21',
                'Lantern cabinet utility structure grove pane sequence 22',
                'Lantern cabinet utility structure harbor light sequence 23',
                'Lantern cabinet utility structure vault spark sequence 24',
                'Lantern cabinet utility structure arcade lantern sequence 25',
            ];
            const signals = [
                'Lantern cabinet utility signal beacon lantern sequence 1',
                'Lantern cabinet utility signal spark cabinet sequence 2',
                'Lantern cabinet utility signal signal shelf sequence 3',
                'Lantern cabinet utility signal marker glow sequence 4',
                'Lantern cabinet utility signal glyph panel sequence 5',
                'Lantern cabinet utility signal echo pane sequence 6',
                'Lantern cabinet utility signal whisper light sequence 7',
                'Lantern cabinet utility signal song spark sequence 8',
                'Lantern cabinet utility signal trail lantern sequence 9',
                'Lantern cabinet utility signal gleam cabinet sequence 10',
                'Lantern cabinet utility signal beacon shelf sequence 11',
                'Lantern cabinet utility signal spark glow sequence 12',
                'Lantern cabinet utility signal signal panel sequence 13',
                'Lantern cabinet utility signal marker pane sequence 14',
                'Lantern cabinet utility signal glyph light sequence 15',
                'Lantern cabinet utility signal echo spark sequence 16',
                'Lantern cabinet utility signal whisper lantern sequence 17',
                'Lantern cabinet utility signal song cabinet sequence 18',
                'Lantern cabinet utility signal trail shelf sequence 19',
                'Lantern cabinet utility signal gleam glow sequence 20',
                'Lantern cabinet utility signal beacon panel sequence 21',
                'Lantern cabinet utility signal spark pane sequence 22',
                'Lantern cabinet utility signal signal light sequence 23',
                'Lantern cabinet utility signal marker spark sequence 24',
                'Lantern cabinet utility signal glyph lantern sequence 25',
            ];
            const adornments = [
                'Lantern cabinet utility adornment lantern lantern sequence 1',
                'Lantern cabinet utility adornment rune cabinet sequence 2',
                'Lantern cabinet utility adornment ribbon shelf sequence 3',
                'Lantern cabinet utility adornment petal glow sequence 4',
                'Lantern cabinet utility adornment feather panel sequence 5',
                'Lantern cabinet utility adornment stone pane sequence 6',
                'Lantern cabinet utility adornment dew light sequence 7',
                'Lantern cabinet utility adornment light spark sequence 8',
                'Lantern cabinet utility adornment mirror lantern sequence 9',
                'Lantern cabinet utility adornment glow cabinet sequence 10',
                'Lantern cabinet utility adornment lantern shelf sequence 11',
                'Lantern cabinet utility adornment rune glow sequence 12',
                'Lantern cabinet utility adornment ribbon panel sequence 13',
                'Lantern cabinet utility adornment petal pane sequence 14',
                'Lantern cabinet utility adornment feather light sequence 15',
                'Lantern cabinet utility adornment stone spark sequence 16',
                'Lantern cabinet utility adornment dew lantern sequence 17',
                'Lantern cabinet utility adornment light cabinet sequence 18',
                'Lantern cabinet utility adornment mirror shelf sequence 19',
                'Lantern cabinet utility adornment glow glow sequence 20',
                'Lantern cabinet utility adornment lantern panel sequence 21',
                'Lantern cabinet utility adornment rune pane sequence 22',
                'Lantern cabinet utility adornment ribbon light sequence 23',
                'Lantern cabinet utility adornment petal spark sequence 24',
                'Lantern cabinet utility adornment feather lantern sequence 25',
            ];
            const organised = [];
            for (let segment = 0; segment < sections; segment++) {
                for (let index = 0; index < scaffolding.length; index++) {
                    const scaffold = scaffolding[index];
                    const structure = structures[(index + segment) % structures.length];
                    const signal = signals[(index + segment * 2) % signals.length];
                    const adornment = adornments[(index + segment * 3) % adornments.length];
                    const emphasis = emphasise && index % 2 === 0 ? 'highlight' : 'soft';
                    organised.push(`${prefix} | ${mode} | section ${segment + 1} | ${scaffold} | ${structure} | ${signal} | ${adornment} | emphasis ${emphasis}`);
                }
            }
            const annotations = [];
            organised.forEach((entry, index) => {
                annotations.push(`${index + 1} :: ${entry}`);
                if (annotate && index % 3 === 0) {
                    annotations.push(`note ${index + 1} :: ${prefix} anchors ${mode}`);
                }
                if (annotate && index % 5 === 0) {
                    annotations.push(`guide ${index + 1} :: signal ${signals[index % signals.length]}`);
                }
            });
            const cleaned = [];
            const seen = new Set();
            annotations.forEach((item) => {
                if (!seen.has(item)) {
                    cleaned.push(item);
                    seen.add(item);
                }
            });
            const base = basePayload.trim();
            if (base) {
                cleaned.unshift(`base::${base}`);
            }
            const newlineChar = String.fromCharCode(10);
            const safeKey = 'fantasy_utility_lantern_cabinet';
            clone.vars[`${safeKey}_mode`] = mode;
            clone.vars[`${safeKey}_sections`] = sections;
            clone.vars[`${safeKey}_entries`] = cleaned.length;
            clone.payload = cleaned.join(newlineChar);
            clone.logs.push('Lantern cabinet utility organised payload terraces.');
            return [clone];
        }
    },
    {
        id: 'fantasy-utility-orbit-index',
        category: 'utility',
        name: 'Orbit index utility',
        description: 'Index orbits into nested tracks and swirling labels.',
        icon: 'refresh-cw',
        accent: '#22d3ee',
        tags: ['utility', 'orbit', 'index', 'fantasy'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { mode: 'Orbit indexing', sections: 4, emphasise: true, prefix: 'Orbit index', annotate: true },
        form: [
            { key: 'mode', label: 'Mode', type: 'text', placeholder: 'Orbit indexing' },
            { key: 'sections', label: 'Sections', type: 'number', min: 1, max: 12 },
            { key: 'emphasise', label: 'Emphasise highlights', type: 'checkbox' },
            { key: 'prefix', label: 'Prefix', type: 'text', placeholder: 'Orbit index' },
            { key: 'annotate', label: 'Add annotations', type: 'checkbox' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const basePayload = QuickActionTools.toText(clone.payload ?? '');
            const mode = (config?.mode || 'Orbit indexing').trim() || 'Orbit indexing';
            const sections = Math.max(1, parseInt(config?.sections, 10) || 1);
            const emphasise = config?.emphasise !== false;
            const prefix = (config?.prefix || 'Orbit index').trim() || 'Orbit index';
            const annotate = config?.annotate !== false;
            const scaffolding = [
                'Orbit index utility scaffold terrace orbit sequence 1',
                'Orbit index utility scaffold stack index sequence 2',
                'Orbit index utility scaffold ledger track sequence 3',
                'Orbit index utility scaffold panel loop sequence 4',
                'Orbit index utility scaffold canvas planet sequence 5',
                'Orbit index utility scaffold folio ring sequence 6',
                'Orbit index utility scaffold compartment axis sequence 7',
                'Orbit index utility scaffold parcel signal sequence 8',
                'Orbit index utility scaffold balustrade orbit sequence 9',
                'Orbit index utility scaffold grid index sequence 10',
                'Orbit index utility scaffold terrace track sequence 11',
                'Orbit index utility scaffold stack loop sequence 12',
                'Orbit index utility scaffold ledger planet sequence 13',
                'Orbit index utility scaffold panel ring sequence 14',
                'Orbit index utility scaffold canvas axis sequence 15',
                'Orbit index utility scaffold folio signal sequence 16',
                'Orbit index utility scaffold compartment orbit sequence 17',
                'Orbit index utility scaffold parcel index sequence 18',
                'Orbit index utility scaffold balustrade track sequence 19',
                'Orbit index utility scaffold grid loop sequence 20',
                'Orbit index utility scaffold terrace planet sequence 21',
                'Orbit index utility scaffold stack ring sequence 22',
                'Orbit index utility scaffold ledger axis sequence 23',
                'Orbit index utility scaffold panel signal sequence 24',
                'Orbit index utility scaffold canvas orbit sequence 25',
            ];
            const structures = [
                'Orbit index utility structure arch orbit sequence 1',
                'Orbit index utility structure grove index sequence 2',
                'Orbit index utility structure harbor track sequence 3',
                'Orbit index utility structure vault loop sequence 4',
                'Orbit index utility structure arcade planet sequence 5',
                'Orbit index utility structure meadow ring sequence 6',
                'Orbit index utility structure spire axis sequence 7',
                'Orbit index utility structure tunnel signal sequence 8',
                'Orbit index utility structure causeway orbit sequence 9',
                'Orbit index utility structure hall index sequence 10',
                'Orbit index utility structure arch track sequence 11',
                'Orbit index utility structure grove loop sequence 12',
                'Orbit index utility structure harbor planet sequence 13',
                'Orbit index utility structure vault ring sequence 14',
                'Orbit index utility structure arcade axis sequence 15',
                'Orbit index utility structure meadow signal sequence 16',
                'Orbit index utility structure spire orbit sequence 17',
                'Orbit index utility structure tunnel index sequence 18',
                'Orbit index utility structure causeway track sequence 19',
                'Orbit index utility structure hall loop sequence 20',
                'Orbit index utility structure arch planet sequence 21',
                'Orbit index utility structure grove ring sequence 22',
                'Orbit index utility structure harbor axis sequence 23',
                'Orbit index utility structure vault signal sequence 24',
                'Orbit index utility structure arcade orbit sequence 25',
            ];
            const signals = [
                'Orbit index utility signal beacon orbit sequence 1',
                'Orbit index utility signal spark index sequence 2',
                'Orbit index utility signal signal track sequence 3',
                'Orbit index utility signal marker loop sequence 4',
                'Orbit index utility signal glyph planet sequence 5',
                'Orbit index utility signal echo ring sequence 6',
                'Orbit index utility signal whisper axis sequence 7',
                'Orbit index utility signal song signal sequence 8',
                'Orbit index utility signal trail orbit sequence 9',
                'Orbit index utility signal gleam index sequence 10',
                'Orbit index utility signal beacon track sequence 11',
                'Orbit index utility signal spark loop sequence 12',
                'Orbit index utility signal signal planet sequence 13',
                'Orbit index utility signal marker ring sequence 14',
                'Orbit index utility signal glyph axis sequence 15',
                'Orbit index utility signal echo signal sequence 16',
                'Orbit index utility signal whisper orbit sequence 17',
                'Orbit index utility signal song index sequence 18',
                'Orbit index utility signal trail track sequence 19',
                'Orbit index utility signal gleam loop sequence 20',
                'Orbit index utility signal beacon planet sequence 21',
                'Orbit index utility signal spark ring sequence 22',
                'Orbit index utility signal signal axis sequence 23',
                'Orbit index utility signal marker signal sequence 24',
                'Orbit index utility signal glyph orbit sequence 25',
            ];
            const adornments = [
                'Orbit index utility adornment lantern orbit sequence 1',
                'Orbit index utility adornment rune index sequence 2',
                'Orbit index utility adornment ribbon track sequence 3',
                'Orbit index utility adornment petal loop sequence 4',
                'Orbit index utility adornment feather planet sequence 5',
                'Orbit index utility adornment stone ring sequence 6',
                'Orbit index utility adornment dew axis sequence 7',
                'Orbit index utility adornment light signal sequence 8',
                'Orbit index utility adornment mirror orbit sequence 9',
                'Orbit index utility adornment glow index sequence 10',
                'Orbit index utility adornment lantern track sequence 11',
                'Orbit index utility adornment rune loop sequence 12',
                'Orbit index utility adornment ribbon planet sequence 13',
                'Orbit index utility adornment petal ring sequence 14',
                'Orbit index utility adornment feather axis sequence 15',
                'Orbit index utility adornment stone signal sequence 16',
                'Orbit index utility adornment dew orbit sequence 17',
                'Orbit index utility adornment light index sequence 18',
                'Orbit index utility adornment mirror track sequence 19',
                'Orbit index utility adornment glow loop sequence 20',
                'Orbit index utility adornment lantern planet sequence 21',
                'Orbit index utility adornment rune ring sequence 22',
                'Orbit index utility adornment ribbon axis sequence 23',
                'Orbit index utility adornment petal signal sequence 24',
                'Orbit index utility adornment feather orbit sequence 25',
            ];
            const organised = [];
            for (let segment = 0; segment < sections; segment++) {
                for (let index = 0; index < scaffolding.length; index++) {
                    const scaffold = scaffolding[index];
                    const structure = structures[(index + segment) % structures.length];
                    const signal = signals[(index + segment * 2) % signals.length];
                    const adornment = adornments[(index + segment * 3) % adornments.length];
                    const emphasis = emphasise && index % 2 === 0 ? 'highlight' : 'soft';
                    organised.push(`${prefix} | ${mode} | section ${segment + 1} | ${scaffold} | ${structure} | ${signal} | ${adornment} | emphasis ${emphasis}`);
                }
            }
            const annotations = [];
            organised.forEach((entry, index) => {
                annotations.push(`${index + 1} :: ${entry}`);
                if (annotate && index % 3 === 0) {
                    annotations.push(`note ${index + 1} :: ${prefix} anchors ${mode}`);
                }
                if (annotate && index % 5 === 0) {
                    annotations.push(`guide ${index + 1} :: signal ${signals[index % signals.length]}`);
                }
            });
            const cleaned = [];
            const seen = new Set();
            annotations.forEach((item) => {
                if (!seen.has(item)) {
                    cleaned.push(item);
                    seen.add(item);
                }
            });
            const base = basePayload.trim();
            if (base) {
                cleaned.unshift(`base::${base}`);
            }
            const newlineChar = String.fromCharCode(10);
            const safeKey = 'fantasy_utility_orbit_index';
            clone.vars[`${safeKey}_mode`] = mode;
            clone.vars[`${safeKey}_sections`] = sections;
            clone.vars[`${safeKey}_entries`] = cleaned.length;
            clone.payload = cleaned.join(newlineChar);
            clone.logs.push('Orbit index utility organised payload terraces.');
            return [clone];
        }
    },
    {
        id: 'fantasy-utility-ember-codex',
        category: 'utility',
        name: 'Ember codex utility',
        description: 'Codify embers into glowing indexes and warm folios.',
        icon: 'book',
        accent: '#fb7185',
        tags: ['utility', 'ember', 'codex', 'fantasy'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { mode: 'Ember codex', sections: 4, emphasise: true, prefix: 'Ember codex', annotate: true },
        form: [
            { key: 'mode', label: 'Mode', type: 'text', placeholder: 'Ember codex' },
            { key: 'sections', label: 'Sections', type: 'number', min: 1, max: 12 },
            { key: 'emphasise', label: 'Emphasise highlights', type: 'checkbox' },
            { key: 'prefix', label: 'Prefix', type: 'text', placeholder: 'Ember codex' },
            { key: 'annotate', label: 'Add annotations', type: 'checkbox' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const basePayload = QuickActionTools.toText(clone.payload ?? '');
            const mode = (config?.mode || 'Ember codex').trim() || 'Ember codex';
            const sections = Math.max(1, parseInt(config?.sections, 10) || 1);
            const emphasise = config?.emphasise !== false;
            const prefix = (config?.prefix || 'Ember codex').trim() || 'Ember codex';
            const annotate = config?.annotate !== false;
            const scaffolding = [
                'Ember codex utility scaffold terrace ember sequence 1',
                'Ember codex utility scaffold stack codex sequence 2',
                'Ember codex utility scaffold ledger page sequence 3',
                'Ember codex utility scaffold panel glow sequence 4',
                'Ember codex utility scaffold canvas script sequence 5',
                'Ember codex utility scaffold folio ash sequence 6',
                'Ember codex utility scaffold compartment emberline sequence 7',
                'Ember codex utility scaffold parcel glyph sequence 8',
                'Ember codex utility scaffold balustrade ember sequence 9',
                'Ember codex utility scaffold grid codex sequence 10',
                'Ember codex utility scaffold terrace page sequence 11',
                'Ember codex utility scaffold stack glow sequence 12',
                'Ember codex utility scaffold ledger script sequence 13',
                'Ember codex utility scaffold panel ash sequence 14',
                'Ember codex utility scaffold canvas emberline sequence 15',
                'Ember codex utility scaffold folio glyph sequence 16',
                'Ember codex utility scaffold compartment ember sequence 17',
                'Ember codex utility scaffold parcel codex sequence 18',
                'Ember codex utility scaffold balustrade page sequence 19',
                'Ember codex utility scaffold grid glow sequence 20',
                'Ember codex utility scaffold terrace script sequence 21',
                'Ember codex utility scaffold stack ash sequence 22',
                'Ember codex utility scaffold ledger emberline sequence 23',
                'Ember codex utility scaffold panel glyph sequence 24',
                'Ember codex utility scaffold canvas ember sequence 25',
            ];
            const structures = [
                'Ember codex utility structure arch ember sequence 1',
                'Ember codex utility structure grove codex sequence 2',
                'Ember codex utility structure harbor page sequence 3',
                'Ember codex utility structure vault glow sequence 4',
                'Ember codex utility structure arcade script sequence 5',
                'Ember codex utility structure meadow ash sequence 6',
                'Ember codex utility structure spire emberline sequence 7',
                'Ember codex utility structure tunnel glyph sequence 8',
                'Ember codex utility structure causeway ember sequence 9',
                'Ember codex utility structure hall codex sequence 10',
                'Ember codex utility structure arch page sequence 11',
                'Ember codex utility structure grove glow sequence 12',
                'Ember codex utility structure harbor script sequence 13',
                'Ember codex utility structure vault ash sequence 14',
                'Ember codex utility structure arcade emberline sequence 15',
                'Ember codex utility structure meadow glyph sequence 16',
                'Ember codex utility structure spire ember sequence 17',
                'Ember codex utility structure tunnel codex sequence 18',
                'Ember codex utility structure causeway page sequence 19',
                'Ember codex utility structure hall glow sequence 20',
                'Ember codex utility structure arch script sequence 21',
                'Ember codex utility structure grove ash sequence 22',
                'Ember codex utility structure harbor emberline sequence 23',
                'Ember codex utility structure vault glyph sequence 24',
                'Ember codex utility structure arcade ember sequence 25',
            ];
            const signals = [
                'Ember codex utility signal beacon ember sequence 1',
                'Ember codex utility signal spark codex sequence 2',
                'Ember codex utility signal signal page sequence 3',
                'Ember codex utility signal marker glow sequence 4',
                'Ember codex utility signal glyph script sequence 5',
                'Ember codex utility signal echo ash sequence 6',
                'Ember codex utility signal whisper emberline sequence 7',
                'Ember codex utility signal song glyph sequence 8',
                'Ember codex utility signal trail ember sequence 9',
                'Ember codex utility signal gleam codex sequence 10',
                'Ember codex utility signal beacon page sequence 11',
                'Ember codex utility signal spark glow sequence 12',
                'Ember codex utility signal signal script sequence 13',
                'Ember codex utility signal marker ash sequence 14',
                'Ember codex utility signal glyph emberline sequence 15',
                'Ember codex utility signal echo glyph sequence 16',
                'Ember codex utility signal whisper ember sequence 17',
                'Ember codex utility signal song codex sequence 18',
                'Ember codex utility signal trail page sequence 19',
                'Ember codex utility signal gleam glow sequence 20',
                'Ember codex utility signal beacon script sequence 21',
                'Ember codex utility signal spark ash sequence 22',
                'Ember codex utility signal signal emberline sequence 23',
                'Ember codex utility signal marker glyph sequence 24',
                'Ember codex utility signal glyph ember sequence 25',
            ];
            const adornments = [
                'Ember codex utility adornment lantern ember sequence 1',
                'Ember codex utility adornment rune codex sequence 2',
                'Ember codex utility adornment ribbon page sequence 3',
                'Ember codex utility adornment petal glow sequence 4',
                'Ember codex utility adornment feather script sequence 5',
                'Ember codex utility adornment stone ash sequence 6',
                'Ember codex utility adornment dew emberline sequence 7',
                'Ember codex utility adornment light glyph sequence 8',
                'Ember codex utility adornment mirror ember sequence 9',
                'Ember codex utility adornment glow codex sequence 10',
                'Ember codex utility adornment lantern page sequence 11',
                'Ember codex utility adornment rune glow sequence 12',
                'Ember codex utility adornment ribbon script sequence 13',
                'Ember codex utility adornment petal ash sequence 14',
                'Ember codex utility adornment feather emberline sequence 15',
                'Ember codex utility adornment stone glyph sequence 16',
                'Ember codex utility adornment dew ember sequence 17',
                'Ember codex utility adornment light codex sequence 18',
                'Ember codex utility adornment mirror page sequence 19',
                'Ember codex utility adornment glow glow sequence 20',
                'Ember codex utility adornment lantern script sequence 21',
                'Ember codex utility adornment rune ash sequence 22',
                'Ember codex utility adornment ribbon emberline sequence 23',
                'Ember codex utility adornment petal glyph sequence 24',
                'Ember codex utility adornment feather ember sequence 25',
            ];
            const organised = [];
            for (let segment = 0; segment < sections; segment++) {
                for (let index = 0; index < scaffolding.length; index++) {
                    const scaffold = scaffolding[index];
                    const structure = structures[(index + segment) % structures.length];
                    const signal = signals[(index + segment * 2) % signals.length];
                    const adornment = adornments[(index + segment * 3) % adornments.length];
                    const emphasis = emphasise && index % 2 === 0 ? 'highlight' : 'soft';
                    organised.push(`${prefix} | ${mode} | section ${segment + 1} | ${scaffold} | ${structure} | ${signal} | ${adornment} | emphasis ${emphasis}`);
                }
            }
            const annotations = [];
            organised.forEach((entry, index) => {
                annotations.push(`${index + 1} :: ${entry}`);
                if (annotate && index % 3 === 0) {
                    annotations.push(`note ${index + 1} :: ${prefix} anchors ${mode}`);
                }
                if (annotate && index % 5 === 0) {
                    annotations.push(`guide ${index + 1} :: signal ${signals[index % signals.length]}`);
                }
            });
            const cleaned = [];
            const seen = new Set();
            annotations.forEach((item) => {
                if (!seen.has(item)) {
                    cleaned.push(item);
                    seen.add(item);
                }
            });
            const base = basePayload.trim();
            if (base) {
                cleaned.unshift(`base::${base}`);
            }
            const newlineChar = String.fromCharCode(10);
            const safeKey = 'fantasy_utility_ember_codex';
            clone.vars[`${safeKey}_mode`] = mode;
            clone.vars[`${safeKey}_sections`] = sections;
            clone.vars[`${safeKey}_entries`] = cleaned.length;
            clone.payload = cleaned.join(newlineChar);
            clone.logs.push('Ember codex utility organised payload terraces.');
            return [clone];
        }
    },
    {
        id: 'fantasy-utility-mariner-catalog',
        category: 'utility',
        name: 'Mariner catalog utility',
        description: 'Catalog payload harbors for mariner charts and keys.',
        icon: 'compass',
        accent: '#0ea5e9',
        tags: ['utility', 'mariner', 'catalog', 'fantasy'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { mode: 'Mariner catalog', sections: 4, emphasise: true, prefix: 'Mariner catalog', annotate: true },
        form: [
            { key: 'mode', label: 'Mode', type: 'text', placeholder: 'Mariner catalog' },
            { key: 'sections', label: 'Sections', type: 'number', min: 1, max: 12 },
            { key: 'emphasise', label: 'Emphasise highlights', type: 'checkbox' },
            { key: 'prefix', label: 'Prefix', type: 'text', placeholder: 'Mariner catalog' },
            { key: 'annotate', label: 'Add annotations', type: 'checkbox' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const basePayload = QuickActionTools.toText(clone.payload ?? '');
            const mode = (config?.mode || 'Mariner catalog').trim() || 'Mariner catalog';
            const sections = Math.max(1, parseInt(config?.sections, 10) || 1);
            const emphasise = config?.emphasise !== false;
            const prefix = (config?.prefix || 'Mariner catalog').trim() || 'Mariner catalog';
            const annotate = config?.annotate !== false;
            const scaffolding = [
                'Mariner catalog utility scaffold terrace mariner sequence 1',
                'Mariner catalog utility scaffold stack catalog sequence 2',
                'Mariner catalog utility scaffold ledger helm sequence 3',
                'Mariner catalog utility scaffold panel chart sequence 4',
                'Mariner catalog utility scaffold canvas tide sequence 5',
                'Mariner catalog utility scaffold folio isle sequence 6',
                'Mariner catalog utility scaffold compartment star sequence 7',
                'Mariner catalog utility scaffold parcel wake sequence 8',
                'Mariner catalog utility scaffold balustrade mariner sequence 9',
                'Mariner catalog utility scaffold grid catalog sequence 10',
                'Mariner catalog utility scaffold terrace helm sequence 11',
                'Mariner catalog utility scaffold stack chart sequence 12',
                'Mariner catalog utility scaffold ledger tide sequence 13',
                'Mariner catalog utility scaffold panel isle sequence 14',
                'Mariner catalog utility scaffold canvas star sequence 15',
                'Mariner catalog utility scaffold folio wake sequence 16',
                'Mariner catalog utility scaffold compartment mariner sequence 17',
                'Mariner catalog utility scaffold parcel catalog sequence 18',
                'Mariner catalog utility scaffold balustrade helm sequence 19',
                'Mariner catalog utility scaffold grid chart sequence 20',
                'Mariner catalog utility scaffold terrace tide sequence 21',
                'Mariner catalog utility scaffold stack isle sequence 22',
                'Mariner catalog utility scaffold ledger star sequence 23',
                'Mariner catalog utility scaffold panel wake sequence 24',
                'Mariner catalog utility scaffold canvas mariner sequence 25',
            ];
            const structures = [
                'Mariner catalog utility structure arch mariner sequence 1',
                'Mariner catalog utility structure grove catalog sequence 2',
                'Mariner catalog utility structure harbor helm sequence 3',
                'Mariner catalog utility structure vault chart sequence 4',
                'Mariner catalog utility structure arcade tide sequence 5',
                'Mariner catalog utility structure meadow isle sequence 6',
                'Mariner catalog utility structure spire star sequence 7',
                'Mariner catalog utility structure tunnel wake sequence 8',
                'Mariner catalog utility structure causeway mariner sequence 9',
                'Mariner catalog utility structure hall catalog sequence 10',
                'Mariner catalog utility structure arch helm sequence 11',
                'Mariner catalog utility structure grove chart sequence 12',
                'Mariner catalog utility structure harbor tide sequence 13',
                'Mariner catalog utility structure vault isle sequence 14',
                'Mariner catalog utility structure arcade star sequence 15',
                'Mariner catalog utility structure meadow wake sequence 16',
                'Mariner catalog utility structure spire mariner sequence 17',
                'Mariner catalog utility structure tunnel catalog sequence 18',
                'Mariner catalog utility structure causeway helm sequence 19',
                'Mariner catalog utility structure hall chart sequence 20',
                'Mariner catalog utility structure arch tide sequence 21',
                'Mariner catalog utility structure grove isle sequence 22',
                'Mariner catalog utility structure harbor star sequence 23',
                'Mariner catalog utility structure vault wake sequence 24',
                'Mariner catalog utility structure arcade mariner sequence 25',
            ];
            const signals = [
                'Mariner catalog utility signal beacon mariner sequence 1',
                'Mariner catalog utility signal spark catalog sequence 2',
                'Mariner catalog utility signal signal helm sequence 3',
                'Mariner catalog utility signal marker chart sequence 4',
                'Mariner catalog utility signal glyph tide sequence 5',
                'Mariner catalog utility signal echo isle sequence 6',
                'Mariner catalog utility signal whisper star sequence 7',
                'Mariner catalog utility signal song wake sequence 8',
                'Mariner catalog utility signal trail mariner sequence 9',
                'Mariner catalog utility signal gleam catalog sequence 10',
                'Mariner catalog utility signal beacon helm sequence 11',
                'Mariner catalog utility signal spark chart sequence 12',
                'Mariner catalog utility signal signal tide sequence 13',
                'Mariner catalog utility signal marker isle sequence 14',
                'Mariner catalog utility signal glyph star sequence 15',
                'Mariner catalog utility signal echo wake sequence 16',
                'Mariner catalog utility signal whisper mariner sequence 17',
                'Mariner catalog utility signal song catalog sequence 18',
                'Mariner catalog utility signal trail helm sequence 19',
                'Mariner catalog utility signal gleam chart sequence 20',
                'Mariner catalog utility signal beacon tide sequence 21',
                'Mariner catalog utility signal spark isle sequence 22',
                'Mariner catalog utility signal signal star sequence 23',
                'Mariner catalog utility signal marker wake sequence 24',
                'Mariner catalog utility signal glyph mariner sequence 25',
            ];
            const adornments = [
                'Mariner catalog utility adornment lantern mariner sequence 1',
                'Mariner catalog utility adornment rune catalog sequence 2',
                'Mariner catalog utility adornment ribbon helm sequence 3',
                'Mariner catalog utility adornment petal chart sequence 4',
                'Mariner catalog utility adornment feather tide sequence 5',
                'Mariner catalog utility adornment stone isle sequence 6',
                'Mariner catalog utility adornment dew star sequence 7',
                'Mariner catalog utility adornment light wake sequence 8',
                'Mariner catalog utility adornment mirror mariner sequence 9',
                'Mariner catalog utility adornment glow catalog sequence 10',
                'Mariner catalog utility adornment lantern helm sequence 11',
                'Mariner catalog utility adornment rune chart sequence 12',
                'Mariner catalog utility adornment ribbon tide sequence 13',
                'Mariner catalog utility adornment petal isle sequence 14',
                'Mariner catalog utility adornment feather star sequence 15',
                'Mariner catalog utility adornment stone wake sequence 16',
                'Mariner catalog utility adornment dew mariner sequence 17',
                'Mariner catalog utility adornment light catalog sequence 18',
                'Mariner catalog utility adornment mirror helm sequence 19',
                'Mariner catalog utility adornment glow chart sequence 20',
                'Mariner catalog utility adornment lantern tide sequence 21',
                'Mariner catalog utility adornment rune isle sequence 22',
                'Mariner catalog utility adornment ribbon star sequence 23',
                'Mariner catalog utility adornment petal wake sequence 24',
                'Mariner catalog utility adornment feather mariner sequence 25',
            ];
            const organised = [];
            for (let segment = 0; segment < sections; segment++) {
                for (let index = 0; index < scaffolding.length; index++) {
                    const scaffold = scaffolding[index];
                    const structure = structures[(index + segment) % structures.length];
                    const signal = signals[(index + segment * 2) % signals.length];
                    const adornment = adornments[(index + segment * 3) % adornments.length];
                    const emphasis = emphasise && index % 2 === 0 ? 'highlight' : 'soft';
                    organised.push(`${prefix} | ${mode} | section ${segment + 1} | ${scaffold} | ${structure} | ${signal} | ${adornment} | emphasis ${emphasis}`);
                }
            }
            const annotations = [];
            organised.forEach((entry, index) => {
                annotations.push(`${index + 1} :: ${entry}`);
                if (annotate && index % 3 === 0) {
                    annotations.push(`note ${index + 1} :: ${prefix} anchors ${mode}`);
                }
                if (annotate && index % 5 === 0) {
                    annotations.push(`guide ${index + 1} :: signal ${signals[index % signals.length]}`);
                }
            });
            const cleaned = [];
            const seen = new Set();
            annotations.forEach((item) => {
                if (!seen.has(item)) {
                    cleaned.push(item);
                    seen.add(item);
                }
            });
            const base = basePayload.trim();
            if (base) {
                cleaned.unshift(`base::${base}`);
            }
            const newlineChar = String.fromCharCode(10);
            const safeKey = 'fantasy_utility_mariner_catalog';
            clone.vars[`${safeKey}_mode`] = mode;
            clone.vars[`${safeKey}_sections`] = sections;
            clone.vars[`${safeKey}_entries`] = cleaned.length;
            clone.payload = cleaned.join(newlineChar);
            clone.logs.push('Mariner catalog utility organised payload terraces.');
            return [clone];
        }
    },
    {
        id: 'fantasy-utility-summit-almanac',
        category: 'utility',
        name: 'Summit almanac utility',
        description: 'Almanac payload peaks into summit-ready annotations.',
        icon: 'bar-chart-2',
        accent: '#f97316',
        tags: ['utility', 'summit', 'almanac', 'fantasy'],
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { mode: 'Summit almanac', sections: 4, emphasise: true, prefix: 'Summit almanac', annotate: true },
        form: [
            { key: 'mode', label: 'Mode', type: 'text', placeholder: 'Summit almanac' },
            { key: 'sections', label: 'Sections', type: 'number', min: 1, max: 12 },
            { key: 'emphasise', label: 'Emphasise highlights', type: 'checkbox' },
            { key: 'prefix', label: 'Prefix', type: 'text', placeholder: 'Summit almanac' },
            { key: 'annotate', label: 'Add annotations', type: 'checkbox' }
        ],
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const basePayload = QuickActionTools.toText(clone.payload ?? '');
            const mode = (config?.mode || 'Summit almanac').trim() || 'Summit almanac';
            const sections = Math.max(1, parseInt(config?.sections, 10) || 1);
            const emphasise = config?.emphasise !== false;
            const prefix = (config?.prefix || 'Summit almanac').trim() || 'Summit almanac';
            const annotate = config?.annotate !== false;
            const scaffolding = [
                'Summit almanac utility scaffold terrace summit sequence 1',
                'Summit almanac utility scaffold stack almanac sequence 2',
                'Summit almanac utility scaffold ledger peak sequence 3',
                'Summit almanac utility scaffold panel ridge sequence 4',
                'Summit almanac utility scaffold canvas climb sequence 5',
                'Summit almanac utility scaffold folio log sequence 6',
                'Summit almanac utility scaffold compartment crest sequence 7',
                'Summit almanac utility scaffold parcel snow sequence 8',
                'Summit almanac utility scaffold balustrade summit sequence 9',
                'Summit almanac utility scaffold grid almanac sequence 10',
                'Summit almanac utility scaffold terrace peak sequence 11',
                'Summit almanac utility scaffold stack ridge sequence 12',
                'Summit almanac utility scaffold ledger climb sequence 13',
                'Summit almanac utility scaffold panel log sequence 14',
                'Summit almanac utility scaffold canvas crest sequence 15',
                'Summit almanac utility scaffold folio snow sequence 16',
                'Summit almanac utility scaffold compartment summit sequence 17',
                'Summit almanac utility scaffold parcel almanac sequence 18',
                'Summit almanac utility scaffold balustrade peak sequence 19',
                'Summit almanac utility scaffold grid ridge sequence 20',
                'Summit almanac utility scaffold terrace climb sequence 21',
                'Summit almanac utility scaffold stack log sequence 22',
                'Summit almanac utility scaffold ledger crest sequence 23',
                'Summit almanac utility scaffold panel snow sequence 24',
                'Summit almanac utility scaffold canvas summit sequence 25',
            ];
            const structures = [
                'Summit almanac utility structure arch summit sequence 1',
                'Summit almanac utility structure grove almanac sequence 2',
                'Summit almanac utility structure harbor peak sequence 3',
                'Summit almanac utility structure vault ridge sequence 4',
                'Summit almanac utility structure arcade climb sequence 5',
                'Summit almanac utility structure meadow log sequence 6',
                'Summit almanac utility structure spire crest sequence 7',
                'Summit almanac utility structure tunnel snow sequence 8',
                'Summit almanac utility structure causeway summit sequence 9',
                'Summit almanac utility structure hall almanac sequence 10',
                'Summit almanac utility structure arch peak sequence 11',
                'Summit almanac utility structure grove ridge sequence 12',
                'Summit almanac utility structure harbor climb sequence 13',
                'Summit almanac utility structure vault log sequence 14',
                'Summit almanac utility structure arcade crest sequence 15',
                'Summit almanac utility structure meadow snow sequence 16',
                'Summit almanac utility structure spire summit sequence 17',
                'Summit almanac utility structure tunnel almanac sequence 18',
                'Summit almanac utility structure causeway peak sequence 19',
                'Summit almanac utility structure hall ridge sequence 20',
                'Summit almanac utility structure arch climb sequence 21',
                'Summit almanac utility structure grove log sequence 22',
                'Summit almanac utility structure harbor crest sequence 23',
                'Summit almanac utility structure vault snow sequence 24',
                'Summit almanac utility structure arcade summit sequence 25',
            ];
            const signals = [
                'Summit almanac utility signal beacon summit sequence 1',
                'Summit almanac utility signal spark almanac sequence 2',
                'Summit almanac utility signal signal peak sequence 3',
                'Summit almanac utility signal marker ridge sequence 4',
                'Summit almanac utility signal glyph climb sequence 5',
                'Summit almanac utility signal echo log sequence 6',
                'Summit almanac utility signal whisper crest sequence 7',
                'Summit almanac utility signal song snow sequence 8',
                'Summit almanac utility signal trail summit sequence 9',
                'Summit almanac utility signal gleam almanac sequence 10',
                'Summit almanac utility signal beacon peak sequence 11',
                'Summit almanac utility signal spark ridge sequence 12',
                'Summit almanac utility signal signal climb sequence 13',
                'Summit almanac utility signal marker log sequence 14',
                'Summit almanac utility signal glyph crest sequence 15',
                'Summit almanac utility signal echo snow sequence 16',
                'Summit almanac utility signal whisper summit sequence 17',
                'Summit almanac utility signal song almanac sequence 18',
                'Summit almanac utility signal trail peak sequence 19',
                'Summit almanac utility signal gleam ridge sequence 20',
                'Summit almanac utility signal beacon climb sequence 21',
                'Summit almanac utility signal spark log sequence 22',
                'Summit almanac utility signal signal crest sequence 23',
                'Summit almanac utility signal marker snow sequence 24',
                'Summit almanac utility signal glyph summit sequence 25',
            ];
            const adornments = [
                'Summit almanac utility adornment lantern summit sequence 1',
                'Summit almanac utility adornment rune almanac sequence 2',
                'Summit almanac utility adornment ribbon peak sequence 3',
                'Summit almanac utility adornment petal ridge sequence 4',
                'Summit almanac utility adornment feather climb sequence 5',
                'Summit almanac utility adornment stone log sequence 6',
                'Summit almanac utility adornment dew crest sequence 7',
                'Summit almanac utility adornment light snow sequence 8',
                'Summit almanac utility adornment mirror summit sequence 9',
                'Summit almanac utility adornment glow almanac sequence 10',
                'Summit almanac utility adornment lantern peak sequence 11',
                'Summit almanac utility adornment rune ridge sequence 12',
                'Summit almanac utility adornment ribbon climb sequence 13',
                'Summit almanac utility adornment petal log sequence 14',
                'Summit almanac utility adornment feather crest sequence 15',
                'Summit almanac utility adornment stone snow sequence 16',
                'Summit almanac utility adornment dew summit sequence 17',
                'Summit almanac utility adornment light almanac sequence 18',
                'Summit almanac utility adornment mirror peak sequence 19',
                'Summit almanac utility adornment glow ridge sequence 20',
                'Summit almanac utility adornment lantern climb sequence 21',
                'Summit almanac utility adornment rune log sequence 22',
                'Summit almanac utility adornment ribbon crest sequence 23',
                'Summit almanac utility adornment petal snow sequence 24',
                'Summit almanac utility adornment feather summit sequence 25',
            ];
            const organised = [];
            for (let segment = 0; segment < sections; segment++) {
                for (let index = 0; index < scaffolding.length; index++) {
                    const scaffold = scaffolding[index];
                    const structure = structures[(index + segment) % structures.length];
                    const signal = signals[(index + segment * 2) % signals.length];
                    const adornment = adornments[(index + segment * 3) % adornments.length];
                    const emphasis = emphasise && index % 2 === 0 ? 'highlight' : 'soft';
                    organised.push(`${prefix} | ${mode} | section ${segment + 1} | ${scaffold} | ${structure} | ${signal} | ${adornment} | emphasis ${emphasis}`);
                }
            }
            const annotations = [];
            organised.forEach((entry, index) => {
                annotations.push(`${index + 1} :: ${entry}`);
                if (annotate && index % 3 === 0) {
                    annotations.push(`note ${index + 1} :: ${prefix} anchors ${mode}`);
                }
                if (annotate && index % 5 === 0) {
                    annotations.push(`guide ${index + 1} :: signal ${signals[index % signals.length]}`);
                }
            });
            const cleaned = [];
            const seen = new Set();
            annotations.forEach((item) => {
                if (!seen.has(item)) {
                    cleaned.push(item);
                    seen.add(item);
                }
            });
            const base = basePayload.trim();
            if (base) {
                cleaned.unshift(`base::${base}`);
            }
            const newlineChar = String.fromCharCode(10);
            const safeKey = 'fantasy_utility_summit_almanac';
            clone.vars[`${safeKey}_mode`] = mode;
            clone.vars[`${safeKey}_sections`] = sections;
            clone.vars[`${safeKey}_entries`] = cleaned.length;
            clone.payload = cleaned.join(newlineChar);
            clone.logs.push('Summit almanac utility organised payload terraces.');
            return [clone];
        }
    }
];
QuickActionModuleDefinitions.push(...QuickActionAdditionalModules);
QuickActionModuleDefinitions.push(...QuickActionFantasyModules);

const QuickActionModuleMap = new Map();
const QuickActionModulesByCategory = { triggers: [], actions: [], utilities: [] };

QuickActionModuleDefinitions.forEach(definition => {
    QuickActionModuleMap.set(definition.id, definition);
    if (definition.category === 'trigger') QuickActionModulesByCategory.triggers.push(definition);
    else if (definition.category === 'utility') QuickActionModulesByCategory.utilities.push(definition);
    else QuickActionModulesByCategory.actions.push(definition);
});

const QuickActionStore = {
    ensureStructure() {
        if (!AppState.settings) return;
        if (!AppState.settings.quickActions || typeof AppState.settings.quickActions !== 'object') {
            AppState.settings.quickActions = {
                activeIds: [...QuickActionDefaultOrder],
                customActions: [],
                preferences: {
                    builderSize: { width: 1280, height: 820 }
                }
            };
        }

        if (!Array.isArray(AppState.settings.quickActions.activeIds)) {
            AppState.settings.quickActions.activeIds = [...QuickActionDefaultOrder];
        }

        if (!Array.isArray(AppState.settings.quickActions.customActions)) {
            AppState.settings.quickActions.customActions = [];
        }

        if (!AppState.settings.quickActions.preferences || typeof AppState.settings.quickActions.preferences !== 'object') {
            AppState.settings.quickActions.preferences = {
                builderSize: { width: 1280, height: 820 }
            };
        }

        if (!AppState.settings.quickActions.preferences.builderSize) {
            AppState.settings.quickActions.preferences.builderSize = { width: 1280, height: 820 };
        }

        const normalized = Array.from(new Set(AppState.settings.quickActions.activeIds.filter(Boolean)));
        QuickActionDefaultOrder.forEach(defaultId => {
            if (!normalized.includes(defaultId)) normalized.push(defaultId);
        });
        AppState.settings.quickActions.activeIds = normalized;
    },

    getActiveIds() {
        this.ensureStructure();
        return AppState.settings?.quickActions?.activeIds ? [...AppState.settings.quickActions.activeIds] : [...QuickActionDefaultOrder];
    },

    setActiveIds(ids = []) {
        this.ensureStructure();
        const cleaned = Array.from(new Set((ids || []).filter(Boolean)));
        AppState.settings.quickActions.activeIds = cleaned;
        this.persist();
    },

    getCustomActions() {
        this.ensureStructure();
        return Array.isArray(AppState.settings?.quickActions?.customActions)
            ? AppState.settings.quickActions.customActions.map(action => ({ ...action }))
            : [];
    },

    saveCustomAction(action) {
        if (!action) return;
        this.ensureStructure();
        const custom = this.getCustomActions();
        const index = custom.findIndex(item => item.id === action.id);
        const payload = { ...action };
        if (index >= 0) custom[index] = payload;
        else custom.push(payload);
        AppState.settings.quickActions.customActions = custom;
        if (payload.autoActivate !== false) {
            const active = new Set(this.getActiveIds());
            active.add(payload.id);
            AppState.settings.quickActions.activeIds = Array.from(active);
        }
        this.persist();
    },

    deleteCustomAction(id) {
        if (!id) return;
        this.ensureStructure();
        const custom = this.getCustomActions().filter(item => item.id !== id);
        AppState.settings.quickActions.customActions = custom;
        AppState.settings.quickActions.activeIds = this.getActiveIds().filter(existing => existing !== id);
        this.persist();
    },

    reorderActiveIds(newOrder) {
        if (!Array.isArray(newOrder)) return;
        this.ensureStructure();
        const unique = Array.from(new Set(newOrder.filter(Boolean)));
        AppState.settings.quickActions.activeIds = unique;
        this.persist();
    },

    getDefinition(id) {
        if (!id) return null;
        this.ensureStructure();
        const custom = this.getCustomActions().find(action => action.id === id);
        if (custom) return { ...custom, type: custom.type || 'workflow' };
        const catalogItem = QuickActionCatalog.find(item => item.id === id);
        return catalogItem ? { ...catalogItem } : null;
    },

    getAllActions() {
        this.ensureStructure();
        const defaults = QuickActionCatalog.map(item => ({ ...item }));
        const custom = this.getCustomActions();
        return { defaults, custom };
    },

    getBuilderSize() {
        this.ensureStructure();
        const size = AppState.settings.quickActions.preferences?.builderSize || {};
        const width = Number(size.width) || 1280;
        const height = Number(size.height) || 820;
        return {
            width: Math.max(960, Math.min(Math.round(width), 1600)),
            height: Math.max(640, Math.min(Math.round(height), 1000))
        };
    },

    setBuilderSize(width, height) {
        this.ensureStructure();
        const safeWidth = Math.max(960, Math.min(Math.round(width), 1600));
        const safeHeight = Math.max(640, Math.min(Math.round(height), 1000));
        AppState.settings.quickActions.preferences.builderSize = { width: safeWidth, height: safeHeight };
        this.persist();
    },

    persist() {
        if (!AppState.settings?.quickActions) return;
        ipcRenderer.send('update-setting', 'quickActions', JSON.parse(JSON.stringify(AppState.settings.quickActions)));
    }
};

const QuickActionContext = {
    clone(base = {}) {
        return {
            payload: base.payload ?? null,
            vars: { ...(base.vars || {}) },
            logs: Array.isArray(base.logs) ? [...base.logs] : []
        };
    }
};

const QuickActionWorkflowEngine = {
    async run(actionDefinition = {}) {
        const workflow = actionDefinition.workflow || {};
        const nodes = Array.isArray(workflow.nodes) ? workflow.nodes : [];
        if (nodes.length === 0) {
            return;
        }

        const connections = Array.isArray(workflow.connections) ? workflow.connections : [];
        const nodeMap = new Map();
        nodes.forEach(node => {
            if (node?.id && node?.moduleId) {
                nodeMap.set(node.id, {
                    ...node,
                    config: { ...(node.config || {}) }
                });
            }
        });

        if (nodeMap.size === 0) return;

        const adjacency = new Map();
        connections.forEach(connection => {
            const fromId = connection?.from?.nodeId;
            const toId = connection?.to?.nodeId;
            if (!fromId || !toId || !nodeMap.has(fromId) || !nodeMap.has(toId)) return;
            if (!adjacency.has(fromId)) adjacency.set(fromId, []);
            adjacency.get(fromId).push({ ...connection });
        });

        const startNodes = nodes.filter(node => {
            const moduleDef = QuickActionModuleMap.get(node.moduleId);
            return moduleDef?.category === 'trigger';
        });

        const entryNodes = startNodes.length > 0 ? startNodes : [nodes[0]];
        const baseContext = QuickActionContext.clone({
            payload: workflow.initialPayload,
            vars: { ...(workflow.variables || {}) }
        });

        for (const node of entryNodes) {
            await this.executeNode(node.id, baseContext, nodeMap, adjacency, 0, new Set());
        }
    },

    async executeNode(nodeId, context, nodeMap, adjacency, depth, visited) {
        if (!nodeMap.has(nodeId) || depth > 40) return;
        const node = nodeMap.get(nodeId);
        const moduleDefinition = QuickActionModuleMap.get(node.moduleId);
        if (!moduleDefinition) return;

        const localContext = QuickActionContext.clone(context);
        let resultContexts = [];

        try {
            const executionResult = await moduleDefinition.run(localContext, node.config || {}, node);
            if (Array.isArray(executionResult) && executionResult.length > 0) {
                resultContexts = executionResult.map(item => QuickActionContext.clone(item));
            } else {
                resultContexts = [QuickActionContext.clone(localContext)];
            }
        } catch (error) {
            console.error('Quick action node execution failed:', error);
            return;
        }

        const outgoing = adjacency.get(nodeId) || [];
        if (outgoing.length === 0) return;

        for (const connection of outgoing) {
            const nextNodeId = connection?.to?.nodeId;
            if (!nextNodeId) continue;
            const visitKey = `${nodeId}->${nextNodeId}`;
            if (visited.has(visitKey)) continue;
            const nextVisited = new Set(visited).add(visitKey);
            for (const ctx of resultContexts) {
                await this.executeNode(nextNodeId, QuickActionContext.clone(ctx), nodeMap, adjacency, depth + 1, nextVisited);
            }
        }
    }
};

const QuickActionExecutor = {
    async run(actionId) {
        if (!actionId) return;
        const definition = QuickActionStore.getDefinition(actionId);
        if (!definition) return;
        await this.runDefinition(definition);
    },

    async runDefinition(definition) {
        if (!definition) return;
        const type = definition.type || 'workflow';
        if (type === 'panel') {
            const panel = definition.payload?.panel;
            if (panel) {
                AuxPanelManager.togglePanel(panel);
            }
        } else if (type === 'view') {
            const view = definition.payload?.view;
            if (view) ViewManager.switchView(view);
        } else if (type === 'workflow') {
            await QuickActionWorkflowEngine.run(definition);
        } else if (type === 'command' && definition.payload?.commandId) {
            ipcRenderer.send('execute-command', definition.payload.commandId);
        }
    }
};

const QuickActionManager = {
    container: null,

    init() {
        QuickActionStore.ensureStructure();
        this.container = Utils.getElement('#quick-action-bar');
        if (!this.container) return;
        this.container.addEventListener('click', (event) => this.handleClick(event));
        // Tooltip handlers for quick action buttons
        this.container.addEventListener('mouseenter', (e) => {
            const btn = e.target.closest('.quick-action-button');
            if (!btn) return;
            QuickTooltip.showFor(btn);
        }, true);
        this.container.addEventListener('mouseleave', (e) => {
            const btn = e.target.closest('.quick-action-button');
            if (!btn) return;
            QuickTooltip.hide();
        }, true);
        this.container.addEventListener('focusin', (e) => {
            const btn = e.target.closest('.quick-action-button');
            if (!btn) return;
            QuickTooltip.showFor(btn);
        });
        this.container.addEventListener('focusout', () => QuickTooltip.hide());
        this.render();
    },

    requestResize() {
        if (typeof ViewManager?.resizeWindow === 'function') {
            requestAnimationFrame(() => ViewManager.resizeWindow());
        }
    },

    render() {
        if (!this.container) return;
        QuickActionStore.ensureStructure();
        const activeIds = QuickActionStore.getActiveIds();
        this.container.innerHTML = '';

        if (!activeIds.length) {
            this.container.setAttribute('data-empty-label', LocalizationRenderer.t('quick_actions_empty_bar') || 'Add quick actions in Settings');
            this.requestResize();
            return;
        }

        this.container.removeAttribute('data-empty-label');

        activeIds.forEach(id => {
            const definition = QuickActionStore.getDefinition(id);
            if (!definition) return;
            const button = document.createElement('button');
            button.className = 'quick-action-button';
            button.setAttribute('data-action-id', id);

            const iconName = definition.icon || definition.payload?.icon || 'zap';
            if (String(iconName).startsWith('custom:')) {
                const id = String(iconName).slice(7);
                const found = (AppState.settings.customIcons || []).find(i => i.id === id);
                if (found) {
                    const img = document.createElement('img');
                    img.className = 'icon';
                    img.src = found.dataUrl;
                    button.appendChild(img);
                } else if (window.feather?.icons?.['zap']) {
                    button.innerHTML = window.feather.icons['zap'].toSvg({ class: 'icon' });
                }
            } else if (window.feather?.icons?.[iconName]) {
                button.innerHTML = window.feather.icons[iconName].toSvg({ class: 'icon' });
            } else {
                const iconFallback = Utils.createElement('span', { className: 'icon', text: '⚡' });
                button.appendChild(iconFallback);
            }

            const title = definition.nameKey
                ? LocalizationRenderer.t(definition.nameKey)
                : (definition.name || definition.label || 'Quick action');
            const description = definition.descriptionKey
                ? LocalizationRenderer.t(definition.descriptionKey)
                : (definition.description || '');
            // Store tooltip data for custom tooltip and avoid native browser tooltip
            button.setAttribute('data-tooltip-title', title);
            if (description) button.setAttribute('data-tooltip-desc', description);
            button.setAttribute('aria-label', title);

            this.container.appendChild(button);
        });

        this.requestResize();
    },

    refresh() {
        this.render();
    },

    handleClick(event) {
        const button = event.target.closest('.quick-action-button');
        if (!button) return;
        const actionId = button.getAttribute('data-action-id');
        QuickActionExecutor.run(actionId);
    }
};

// Lightweight glass tooltip for quick action buttons
const QuickTooltip = {
    el: null,
    showTimer: null,
    currentTarget: null,
    delayMs: 600,
    init() {
        if (this.el) return;
        this.el = document.getElementById('qa-tooltip');
        if (!this.el) {
            this.el = document.createElement('div');
            this.el.id = 'qa-tooltip';
            this.el.className = 'qa-tooltip';
            this.el.setAttribute('role', 'tooltip');
            this.el.setAttribute('aria-hidden', 'true');
            document.body.appendChild(this.el);
        }
    },
    showFor(button) {
        this.init();
        if (!button || !this.el) return;
        this.currentTarget = button;
        clearTimeout(this.showTimer);
        this.showTimer = setTimeout(() => {
            if (this.currentTarget !== button) return;
            this._showNow(button);
        }, this.delayMs);
    },
    _showNow(button) {
        const title = button.getAttribute('data-tooltip-title') || '';
        const desc = button.getAttribute('data-tooltip-desc') || '';
        const html = `<div class="tt-title">${Utils.escapeHtml(title)}</div>` + (desc ? `<div class="tt-desc">${Utils.escapeHtml(desc)}</div>` : '');
        this.el.innerHTML = html;
        this.el.removeAttribute('hidden');
        this.el.setAttribute('aria-hidden', 'false');
        this.el.classList.add('visible');

        // Position centered above the button with viewport clamping
        this.el.style.left = '-9999px';
        this.el.style.top = '-9999px';
        requestAnimationFrame(() => {
            const rect = button.getBoundingClientRect();
            const tipRect = this.el.getBoundingClientRect();
            const margin = 10;
            let left = rect.left + rect.width / 2 - tipRect.width / 2;
            let top = rect.top - tipRect.height - margin;
            if (left + tipRect.width > window.innerWidth - 8) left = window.innerWidth - tipRect.width - 8;
            if (left < 8) left = 8;
            if (top < 8) top = rect.bottom + margin; // flip below if not enough space
            this.el.style.left = `${Math.round(left)}px`;
            this.el.style.top = `${Math.round(top)}px`;
        });
    },
    hide() {
        if (!this.el) return;
        clearTimeout(this.showTimer);
        this.currentTarget = null;
        this.el.classList.remove('visible');
        this.el.setAttribute('aria-hidden', 'true');
        this.el.setAttribute('hidden', '');
    }
};

const QuickActionLab = {
    initialized: false,
    builderState: null,
    nodeIdCounter: 0,
    connectionIdCounter: 0,
    boundDragMove: null,
    boundDragEnd: null,
    boundResizeMove: null,
    boundResizeEnd: null,
    connectionRedrawScheduled: false,
    pendingBuilderSize: null,
    resizing: null,
    dragUpdateRaf: null,
    cachedIconList: null,
    iconPickerButtons: new Map(),
    iconPickerOpen: false,
    windowExpanded: false,
    boundOutsideClick: null,
    builderSelectWrappers: new Set(),
    boundSelectOutsideClick: null,
    blockExplorerFilters: [],

    init() {
        if (this.initialized) return;
        this.connectionRedrawScheduled = false;
        this.pendingBuilderSize = null;
        this.resizing = null;
        this.dragUpdateRaf = null;
        this.cachedIconList = null;
        this.iconPickerButtons = new Map();
        this.iconPickerOpen = false;
        this.windowExpanded = false;
        this.builderSelectWrappers = new Set();
        this.moduleSearchTerm = '';
        this.blockExplorerSearchTerm = '';
        this.blockExplorerCategory = 'all';
        this.elements = {
            activeList: Utils.getElement('#quick-action-active-list'),
            catalog: Utils.getElement('#quick-action-catalog'),
            openBuilder: Utils.getElement('#open-quick-action-builder'),
            importToggle: Utils.getElement('#import-quick-action'),
            importArea: Utils.getElement('#quick-action-import-area'),
            importText: Utils.getElement('#quick-action-import-text'),
            importConfirm: Utils.getElement('#confirm-quick-action-import'),
            importCancel: Utils.getElement('#cancel-quick-action-import'),
            modal: Utils.getElement('#quick-action-builder-modal'),
            closeModal: Utils.getElement('#close-quick-action-builder'),
            exportAction: Utils.getElement('#builder-export-action'),
            saveAction: Utils.getElement('#builder-save-action'),
            previewAction: Utils.getElement('#builder-preview-action'),
            zoomIn: Utils.getElement('#builder-zoom-in'),
            zoomOut: Utils.getElement('#builder-zoom-out'),
            resetView: Utils.getElement('#builder-reset-view'),
            clearWorkspace: Utils.getElement('#builder-clear-workspace'),
            moduleSearch: Utils.getElement('#builder-module-search'),
            openExplorer: Utils.getElement('#builder-open-explorer'),
            zoomIndicator: Utils.getElement('#builder-zoom-indicator'),
            triggerList: Utils.getElement('#builder-trigger-list'),
            actionList: Utils.getElement('#builder-action-list'),
            utilityList: Utils.getElement('#builder-utility-list'),
            canvas: Utils.getElement('#quick-action-canvas'),
            nodeLayer: Utils.getElement('#builder-node-layer'),
            connectionLayer: Utils.getElement('#builder-connection-layer'),
            emptyState: Utils.getElement('#builder-empty-state'),
            inspectorContent: Utils.getElement('#builder-inspector-content'),
            actionLabelInput: Utils.getElement('#builder-action-label'),
            actionIconInput: Utils.getElement('#builder-action-icon'),
            actionColorInput: Utils.getElement('#builder-action-color'),
            iconPreview: Utils.getElement('#builder-icon-preview'),
            iconPickerToggle: Utils.getElement('#builder-icon-picker-toggle'),
            iconPicker: Utils.getElement('#builder-icon-picker'),
            inspector: document.querySelector('.builder-inspector'),
            blockExplorer: Utils.getElement('#builder-block-explorer'),
            blockExplorerList: Utils.getElement('#block-explorer-list'),
            blockExplorerSearch: Utils.getElement('#block-explorer-search'),
            closeExplorer: Utils.getElement('#block-explorer-close'),
            confirmDialog: Utils.getElement('#builder-confirm-dialog'),
            confirmTitle: Utils.getElement('#builder-confirm-title'),
            confirmMessage: Utils.getElement('#builder-confirm-message'),
            confirmOk: Utils.getElement('#builder-confirm-ok'),
            confirmCancel: Utils.getElement('#builder-confirm-cancel')
        };
        this.blockExplorerFilters = Array.from(Utils.getAllElements('[data-block-category]'));

        this.elements.dialog = document.querySelector('#quick-action-builder-modal .builder-dialog');
        this.elements.resizeHandle = document.querySelector('#quick-action-builder-modal .builder-resize-handle');
        this.boundOutsideClick = (event) => {
            if (!this.iconPickerOpen) return;
            const target = event.target;
            if (this.elements.iconPicker?.contains(target)) return;
            if (this.elements.iconPickerToggle?.contains(target)) return;
            this.toggleIconPicker(false);
        };

        if (!this.boundSelectOutsideClick) {
            this.boundSelectOutsideClick = (event) => this.handleBuilderSelectOutsideClick(event);
            document.addEventListener('click', this.boundSelectOutsideClick);
        }

        if (!this.elements.activeList) {
            return;
        }

        QuickActionStore.ensureStructure();
        this.attachEvents();
        this.initialized = true;
        this.buildIconPicker();
        this.renderAll();
    },

    hasBuilderAccess() {
        return !!(AppState.settings?.subscription?.entitlements?.hasAddonBuilder);
    },

    attachEvents() {
        this.boundDragMove = (event) => this.handleNodeDrag(event);
        this.boundDragEnd = (event) => this.stopNodeDrag(event);
        this.boundResizeMove = (event) => this.handleResize(event);
        this.boundResizeEnd = (event) => this.stopResize(event);

        this.elements.openBuilder?.addEventListener('click', () => this.openBuilder());
        this.elements.importToggle?.addEventListener('click', () => this.toggleImportArea(true));
        this.elements.importCancel?.addEventListener('click', () => this.toggleImportArea(false));
        this.elements.importConfirm?.addEventListener('click', () => this.handleImport());

        this.elements.actionLabelInput?.addEventListener('input', (event) => {
            if (!this.builderState) return;
            this.builderState.metadata.label = event.target.value;
        });

        this.elements.resizeHandle?.addEventListener('pointerdown', (event) => this.startResize(event));

        this.elements.actionIconInput?.addEventListener('input', (event) => {
            if (!this.builderState) return;
            this.builderState.metadata.icon = event.target.value.trim() || 'zap';
            this.updateIconPreview();
        });

        this.elements.iconPickerToggle?.addEventListener('click', (event) => {
            event.preventDefault();
            this.toggleIconPicker(!this.iconPickerOpen);
        });

        this.elements.iconPicker?.addEventListener('click', (event) => {
            const button = event.target.closest('button[data-icon]');
            if (!button) return;
            const icon = button.getAttribute('data-icon');
            if (!icon) return;
            if (this.elements.actionIconInput) {
                this.elements.actionIconInput.value = icon;
            }
            if (this.builderState) {
                this.builderState.metadata.icon = icon;
            }
            this.updateIconPreview();
            this.toggleIconPicker(false);
        });

        this.elements.actionColorInput?.addEventListener('input', (event) => {
            if (!this.builderState) return;
            this.builderState.metadata.accent = event.target.value || '#5865f2';
        });

        this.elements.closeModal?.addEventListener('click', () => this.closeBuilder());
        this.elements.exportAction?.addEventListener('click', () => this.exportCurrentAction());
        this.elements.saveAction?.addEventListener('click', () => this.saveAction());
        this.elements.previewAction?.addEventListener('click', () => this.previewAction());

        this.elements.zoomIn?.addEventListener('click', () => this.adjustZoom(0.1));
        this.elements.zoomOut?.addEventListener('click', () => this.adjustZoom(-0.1));
        this.elements.resetView?.addEventListener('click', () => this.resetView());
        this.elements.clearWorkspace?.addEventListener('click', () => this.clearWorkspace());

        // Zoom with mouse wheel
        this.elements.canvas?.addEventListener('wheel', (event) => {
            event.preventDefault();
            const delta = event.deltaY > 0 ? -0.1 : 0.1;
            this.adjustZoom(delta);
        }, { passive: false });

        // Pan with right mouse button
        let isPanning = false;
        let panStartX = 0;
        let panStartY = 0;
        let panStartOffsetX = 0;
        let panStartOffsetY = 0;

        this.elements.canvas?.addEventListener('mousedown', (event) => {
            if (event.button === 2) { // Right mouse button
                event.preventDefault();
                isPanning = true;
                panStartX = event.clientX;
                panStartY = event.clientY;
                if (this.builderState) {
                    panStartOffsetX = this.builderState.panX || 0;
                    panStartOffsetY = this.builderState.panY || 0;
                }
                this.elements.canvas.style.cursor = 'grabbing';
            }
        });

        this.elements.canvas?.addEventListener('mousemove', (event) => {
            if (isPanning && this.builderState) {
                const deltaX = event.clientX - panStartX;
                const deltaY = event.clientY - panStartY;
                this.builderState.panX = panStartOffsetX + deltaX;
                this.builderState.panY = panStartOffsetY + deltaY;
                this.renderBuilder();
            }
        });

        const stopPanning = () => {
            if (isPanning) {
                isPanning = false;
                if (this.elements.canvas) {
                    this.elements.canvas.style.cursor = '';
                }
            }
        };

        this.elements.canvas?.addEventListener('mouseup', (event) => {
            if (event.button === 2) {
                stopPanning();
            }
        });

        this.elements.canvas?.addEventListener('mouseleave', stopPanning);

        // Prevent context menu on right click in builder
        this.elements.canvas?.addEventListener('contextmenu', (event) => {
            event.preventDefault();
        });

        this.elements.modal?.addEventListener('contextmenu', (event) => {
            event.preventDefault();
        });

        this.elements.moduleSearch?.addEventListener('input', Utils.debounce((event) => {
            this.moduleSearchTerm = String(event.target.value || '').trim().toLowerCase();
            this.renderModuleList();
        }, 120));

        this.elements.openExplorer?.addEventListener('click', () => this.openBlockExplorer());
        this.elements.closeExplorer?.addEventListener('click', () => this.closeBlockExplorer());
        this.elements.blockExplorer?.addEventListener('click', (event) => {
            if (event.target === this.elements.blockExplorer || event.target.classList.contains('block-explorer-backdrop')) {
                this.closeBlockExplorer();
            }
        });
        this.elements.blockExplorerSearch?.addEventListener('input', Utils.debounce((event) => {
            this.blockExplorerSearchTerm = String(event.target.value || '').trim().toLowerCase();
            this.renderBlockExplorer();
        }, 150));

        this.blockExplorerFilters.forEach(button => {
            button.addEventListener('click', () => {
                const category = button.getAttribute('data-block-category') || 'all';
                this.setBlockExplorerCategory(category);
            });
        });

        this.elements.modal?.addEventListener('keydown', (event) => {
            const target = event.target;
            const element = target instanceof HTMLElement ? target : null;
            const isEditableField = !!element && (
                element.tagName === 'INPUT' ||
                element.tagName === 'TEXTAREA' ||
                element.isContentEditable ||
                (typeof element.closest === 'function' && element.closest('[contenteditable="true"]'))
            );

            if (event.key === 'Escape') {
                if (this.isBlockExplorerOpen()) {
                    this.closeBlockExplorer();
                    event.preventDefault();
                    event.stopPropagation();
                    return;
                }
                if (isEditableField && typeof element?.blur === 'function') {
                    element.blur();
                }
                this.closeBuilder();
                return;
            }

            if ((event.key === 'Delete' || event.key === 'Backspace')) {
                if (isEditableField) {
                    return;
                }

                if (this.builderState?.selectedNodeId && !this.isManualNode(this.builderState.selectedNodeId)) {
                    this.removeNode(this.builderState.selectedNodeId);
                }
            }
        });

        this.elements.canvas?.addEventListener('click', (event) => {
            if (event.target === this.elements.canvas) {
                this.selectNode(null);
            }
        });
    },

    renderAll() {
        if (!this.initialized) return;
        this.updateBuilderAccessState();
        this.renderActiveList();
        this.renderCatalog();
    },

    updateBuilderAccessState() {
        const hasAccess = this.hasBuilderAccess();
        if (this.elements?.openBuilder) {
            this.elements.openBuilder.classList.toggle('is-locked', !hasAccess);
            if (!hasAccess) this.elements.openBuilder.setAttribute('aria-disabled', 'true');
            else this.elements.openBuilder.removeAttribute('aria-disabled');
            const labelKey = hasAccess ? 'quick_actions_builder_open' : 'quick_actions_builder_locked';
            this.elements.openBuilder.textContent = LocalizationRenderer.t(labelKey);
        }
        const callout = document.querySelector('.quick-action-builder-callout');
        if (callout) {
            callout.classList.toggle('is-locked', !hasAccess);
        }
    },

    refresh() {
        this.renderAll();
        if (this.builderState?.isOpen) {
            this.renderBuilder();
        }
    },

    renderActiveList() {
        const container = this.elements.activeList;
        if (!container) return;
        container.innerHTML = '';

        const { defaults, custom } = QuickActionStore.getAllActions();
        const activeIds = QuickActionStore.getActiveIds();
        const activeSet = new Set(activeIds);

        const ordered = [
            ...activeIds.map(id => QuickActionStore.getDefinition(id)).filter(Boolean),
            ...defaults.filter(item => !activeSet.has(item.id)),
            ...custom.filter(item => !activeSet.has(item.id))
        ];

        if (ordered.length === 0) {
            const empty = Utils.createElement('div', {
                className: 'addons-empty',
                text: LocalizationRenderer.t('quick_actions_empty_list') || 'No quick actions yet. Add one from the gallery.'
            });
            container.appendChild(empty);
            return;
        }

        ordered.forEach(action => {
            const isActive = activeSet.has(action.id);
            const card = Utils.createElement('div', { className: 'quick-action-card' + (isActive ? '' : ' is-disabled') });
            card.setAttribute('data-action-id', action.id);

            const info = Utils.createElement('div', { className: 'quick-action-card-info' });
            const iconWrap = Utils.createElement('div', { className: 'quick-action-card-icon' });
            const iconName = action.icon || 'zap';
            if (window.feather?.icons?.[iconName]) {
                iconWrap.innerHTML = window.feather.icons[iconName].toSvg();
            } else {
                iconWrap.textContent = '⚡';
            }
            if (action.accent) {
                iconWrap.style.setProperty('color', action.accent);
            }
            info.appendChild(iconWrap);

            const text = Utils.createElement('div', { className: 'quick-action-card-text' });
            const title = Utils.createElement('h4', { text: this.getActionTitle(action) });
            const description = Utils.createElement('p', { text: this.getActionDescription(action) });
            text.appendChild(title);
            text.appendChild(description);

            if (Array.isArray(action.tags) && action.tags.length > 0) {
                const tagWrap = Utils.createElement('div', { className: 'quick-action-card-tags' });
                action.tags.forEach(tag => {
                    tagWrap.appendChild(Utils.createElement('span', { className: 'quick-action-tag', text: tag }));
                });
                text.appendChild(tagWrap);
            }

            info.appendChild(text);
            card.appendChild(info);

            const controls = Utils.createElement('div', { className: 'quick-action-card-controls' });
            const tags = Array.isArray(action.tags) ? action.tags.map(t => String(t).toLowerCase()) : [];
            const isCore = tags.includes('default') || tags.includes('system');
            if (!isCore) {
                const toggleLabel = Utils.createElement('label', { className: 'toggle-switch-ios' });
                const toggleInput = document.createElement('input');
                toggleInput.type = 'checkbox';
                toggleInput.checked = isActive;
                toggleInput.addEventListener('change', () => this.toggleAction(action.id, toggleInput.checked));
                const slider = Utils.createElement('span', { className: 'slider' });
                toggleLabel.appendChild(toggleInput);
                toggleLabel.appendChild(slider);
                controls.appendChild(toggleLabel);
            }

            // Reorder controls for active actions
            const indexInActive = activeIds.indexOf(action.id);
            if (indexInActive !== -1) {
                const upBtn = Utils.createElement('button', { className: 'settings-button secondary qa-reorder' });
                upBtn.setAttribute('aria-label', 'Move up');
                upBtn.disabled = indexInActive === 0;
                if (window.feather?.icons?.['chevron-up']) {
                    upBtn.innerHTML = window.feather.icons['chevron-up'].toSvg();
                } else { upBtn.textContent = '↑'; }
                upBtn.addEventListener('click', () => {
                    const ids = QuickActionStore.getActiveIds();
                    const i = ids.indexOf(action.id);
                    if (i > 0) {
                        const tmp = ids[i - 1];
                        ids[i - 1] = ids[i];
                        ids[i] = tmp;
                        QuickActionStore.reorderActiveIds(ids);
                        QuickActionManager.refresh();
                        this.renderAll();
                    }
                });
                controls.appendChild(upBtn);

                const downBtn = Utils.createElement('button', { className: 'settings-button secondary qa-reorder' });
                downBtn.setAttribute('aria-label', 'Move down');
                downBtn.disabled = indexInActive === activeIds.length - 1;
                if (window.feather?.icons?.['chevron-down']) {
                    downBtn.innerHTML = window.feather.icons['chevron-down'].toSvg();
                } else { downBtn.textContent = '↓'; }
                downBtn.addEventListener('click', () => {
                    const ids = QuickActionStore.getActiveIds();
                    const i = ids.indexOf(action.id);
                    if (i !== -1 && i < ids.length - 1) {
                        const tmp = ids[i + 1];
                        ids[i + 1] = ids[i];
                        ids[i] = tmp;
                        QuickActionStore.reorderActiveIds(ids);
                        QuickActionManager.refresh();
                        this.renderAll();
                    }
                });
                controls.appendChild(downBtn);
            }

            if (action.type === 'workflow' || action.id?.startsWith('quick-')) {
                const editBtn = Utils.createElement('button', { className: 'settings-button secondary', text: LocalizationRenderer.t('quick_actions_edit') || 'Edit' });
                editBtn.addEventListener('click', () => this.openBuilder(action.id));
                controls.appendChild(editBtn);

                const deleteBtn = Utils.createElement('button', { className: 'settings-button secondary', text: LocalizationRenderer.t('quick_actions_delete') || 'Delete' });
                deleteBtn.addEventListener('click', async () => {
                    const confirmed = await this.showConfirm(
                        LocalizationRenderer.t('quick_actions_delete_confirm') || 'Delete this quick action?'
                    );
                    if (confirmed) {
                        QuickActionStore.deleteCustomAction(action.id);
                        QuickActionManager.refresh();
                        this.renderAll();
                    }
                });
                controls.appendChild(deleteBtn);
            }

            card.appendChild(controls);
            container.appendChild(card);
        });
    },

    renderCatalog() {
        const container = this.elements.catalog;
        if (!container) return;
        container.innerHTML = '';
        const activeSet = new Set(QuickActionStore.getActiveIds());

        QuickActionCatalog.forEach(item => {
            const card = Utils.createElement('div', { className: 'quick-action-template' });
            const iconWrap = Utils.createElement('div', { className: 'template-icon' });
            if (window.feather?.icons?.[item.icon || 'zap']) {
                iconWrap.innerHTML = window.feather.icons[item.icon || 'zap'].toSvg();
            } else {
                iconWrap.textContent = '⚡';
            }
            card.appendChild(iconWrap);

            const title = Utils.createElement('h4', { text: this.getActionTitle(item) });
            card.appendChild(title);
            card.appendChild(Utils.createElement('p', { text: this.getActionDescription(item) }));

            const footer = Utils.createElement('div', { className: 'template-footer' });
            const addBtn = Utils.createElement('button', { className: 'settings-button secondary', text: activeSet.has(item.id) ? (LocalizationRenderer.t('quick_actions_added') || 'Added') : (LocalizationRenderer.t('quick_actions_add_to_bar') || 'Add to bar') });
            if (!activeSet.has(item.id)) {
                addBtn.addEventListener('click', () => {
                    const ids = QuickActionStore.getActiveIds();
                    if (!ids.includes(item.id)) {
                        ids.push(item.id);
                        QuickActionStore.setActiveIds(ids);
                        QuickActionManager.refresh();
                        this.renderAll();
                    }
                });
            } else {
                addBtn.disabled = true;
            }
            footer.appendChild(addBtn);

            const customizeBtn = Utils.createElement('button', { className: 'settings-button secondary', text: LocalizationRenderer.t('quick_actions_customize') || 'Customize' });
            customizeBtn.addEventListener('click', () => this.openBuilder(null, { template: item }));
            footer.appendChild(customizeBtn);

            card.appendChild(footer);
            container.appendChild(card);
        });
    },

    toggleAction(actionId, shouldEnable) {
        const current = QuickActionStore.getActiveIds();
        let updated = current;
        if (shouldEnable) {
            if (!current.includes(actionId)) {
                updated = [...current, actionId];
            }
        } else {
            updated = current.filter(id => id !== actionId);
        }
        QuickActionStore.setActiveIds(updated);
        QuickActionManager.refresh();
        this.renderActiveList();
    },

    async openBuilder(actionId = null, options = {}) {
        if (!this.hasBuilderAccess()) {
            SettingsModule?.openSubscriptionTab?.();
            await customAlert(LocalizationRenderer.t('subscription_builder_requires_upgrade'));
            return;
        }
        QuickActionStore.ensureStructure();
        this.windowExpanded = false;
        this.builderState = this.createDefaultBuilderState();
        this.builderState.isOpen = true;
        this.moduleSearchTerm = '';
        if (this.elements.moduleSearch) {
            this.elements.moduleSearch.value = '';
        }
        this.blockExplorerSearchTerm = '';
        this.closeBlockExplorer();

        if (actionId) {
            const existing = QuickActionStore.getDefinition(actionId);
            if (existing && existing.workflow) {
                this.builderState.metadata.id = existing.id;
                this.builderState.metadata.label = this.getActionTitle(existing);
                this.builderState.metadata.icon = existing.icon || 'zap';
                this.builderState.metadata.accent = existing.accent || '#5865f2';
                this.builderState.metadata.description = existing.description || '';
                this.builderState.nodes = (existing.workflow.nodes || []).map(node => ({
                    ...node,
                    position: node.position ? { ...node.position } : { x: 120, y: 160 },
                    config: { ...(node.config || {}) }
                }));
                this.builderState.connections = (existing.workflow.connections || []).map(connection => ({ ...connection }));
                this.nodeIdCounter = this.builderState.nodes.length;
                this.connectionIdCounter = this.builderState.connections.length;
                if (existing.workflow.zoom) {
                    this.builderState.zoom = existing.workflow.zoom;
                }
                if (existing.workflow.panX !== undefined) {
                    this.builderState.panX = existing.workflow.panX;
                }
                if (existing.workflow.panY !== undefined) {
                    this.builderState.panY = existing.workflow.panY;
                }
                if (existing.workflow.initialPayload !== undefined) {
                    this.builderState.metadata.initialPayload = existing.workflow.initialPayload;
                }
            }
        } else if (options.template) {
            this.applyTemplate(options.template);
        }

        this.ensureManualNode();
        this.renderBuilder();
        this.updateIconPreview();
        this.toggleIconPicker(false);
        this.applyBuilderSize();
        this.elements.modal?.classList.add('active');
        this.elements.modal?.setAttribute('aria-hidden', 'false');
        this.elements.modal?.focus();
    },

    applyBuilderSize() {
        if (!this.elements.dialog) return;
        const size = QuickActionStore.getBuilderSize();
        this.elements.dialog.style.setProperty('--builder-dialog-width', `${size.width}px`);
        this.elements.dialog.style.setProperty('--builder-dialog-height', `${size.height}px`);
        this.ensureBuilderFitsWindow(size);
    },

    startResize(event) {
        if (!this.elements.dialog) return;
        event.preventDefault();
        event.stopPropagation();
        const rect = this.elements.dialog.getBoundingClientRect();
        this.resizing = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            startWidth: rect.width,
            startHeight: rect.height
        };
        try {
            this.elements.resizeHandle?.setPointerCapture(event.pointerId);
        } catch (error) {
            // Pointer capture might not be supported; ignore
        }
        window.addEventListener('pointermove', this.boundResizeMove);
        window.addEventListener('pointerup', this.boundResizeEnd);
    },

    handleResize(event) {
        if (!this.resizing || !this.elements.dialog) return;
        event.preventDefault();
        const deltaX = event.clientX - this.resizing.startX;
        const deltaY = event.clientY - this.resizing.startY;
        const minWidth = 960;
        const minHeight = 640;
        const maxWidth = 1600;
        const maxHeight = 1000;
        const width = Math.max(minWidth, Math.min(this.resizing.startWidth + deltaX, maxWidth));
        const height = Math.max(minHeight, Math.min(this.resizing.startHeight + deltaY, maxHeight));
        this.elements.dialog.style.setProperty('--builder-dialog-width', `${width}px`);
        this.elements.dialog.style.setProperty('--builder-dialog-height', `${height}px`);
        this.pendingBuilderSize = { width, height };
        this.ensureBuilderFitsWindow({ width, height });
    },

    stopResize(event) {
        if (!this.resizing) return;
        try {
            if (typeof this.resizing.pointerId === 'number') {
                this.elements.resizeHandle?.releasePointerCapture?.(this.resizing.pointerId);
            }
        } catch (error) {
            // Ignore pointer release errors
        }
        window.removeEventListener('pointermove', this.boundResizeMove);
        window.removeEventListener('pointerup', this.boundResizeEnd);
        if (this.pendingBuilderSize) {
            QuickActionStore.setBuilderSize(this.pendingBuilderSize.width, this.pendingBuilderSize.height);
        }
        this.pendingBuilderSize = null;
        this.resizing = null;
    },

    closeBuilder() {
        this.closeBlockExplorer();
        if (this.elements.modal) {
            this.elements.modal.classList.remove('active');
            this.elements.modal.setAttribute('aria-hidden', 'true');
        }
        this.toggleIconPicker(false);
        if (this.windowExpanded && typeof ViewManager?.resizeWindow === 'function') {
            this.windowExpanded = false;
            requestAnimationFrame(() => ViewManager.resizeWindow());
        } else {
            this.windowExpanded = false;
        }
        this.builderState = null;
        this.elements.actionLabelInput.value = '';
        this.elements.actionIconInput.value = '';
        this.elements.actionColorInput.value = '#5865f2';
    },

    createDefaultBuilderState() {
        const manualNode = this.createNodeDefinition('manual-trigger', { x: 120, y: 200 });
        return {
            nodes: [manualNode],
            connections: [],
            zoom: 1,
            panX: 0,
            panY: 0,
            selectedNodeId: manualNode.id,
            pendingConnection: null,
            isOpen: false,
            metadata: {
                id: null,
                label: LocalizationRenderer.t('quick_actions_new_label') || 'My quick action',
                icon: 'zap',
                accent: '#5865f2',
                description: '',
                initialPayload: null
            }
        };
    },

    ensureManualNode() {
        if (!this.builderState) return;
        const manualExists = this.builderState.nodes.some(node => node.moduleId === 'manual-trigger');
        if (!manualExists) {
            const manual = this.createNodeDefinition('manual-trigger', { x: 120, y: 200 });
            this.builderState.nodes.unshift(manual);
        }
    },

    createNodeDefinition(moduleId, position) {
        this.nodeIdCounter += 1;
        const moduleDef = QuickActionModuleMap.get(moduleId);
        return {
            id: `node-${Date.now()}-${this.nodeIdCounter}`,
            moduleId,
            position: position || { x: 200 + this.nodeIdCounter * 40, y: 220 },
            config: { ...(moduleDef?.defaultConfig || {}) }
        };
    },

    renderBuilder() {
        if (!this.builderState) return;
        this.elements.actionLabelInput.value = this.builderState.metadata.label;
        this.elements.actionIconInput.value = this.builderState.metadata.icon;
        this.elements.actionColorInput.value = this.builderState.metadata.accent;
        if (this.elements.moduleSearch) {
            this.elements.moduleSearch.value = this.moduleSearchTerm;
        }
        this.updateIconPreview();
        this.renderModuleList();
        this.renderCanvas();
        this.renderInspector();
        this.updateZoomIndicator();
    },

    renderModuleList() {
        const lists = [
            { container: this.elements.triggerList, items: QuickActionModulesByCategory.triggers },
            { container: this.elements.actionList, items: QuickActionModulesByCategory.actions },
            { container: this.elements.utilityList, items: QuickActionModulesByCategory.utilities }
        ];

        lists.forEach(({ container, items }) => {
            if (!container) return;
            container.innerHTML = '';
            const filtered = items.filter(module => this.moduleMatchesSearch(module, this.moduleSearchTerm));
            if (filtered.length === 0) {
                container.appendChild(Utils.createElement('li', {
                    className: 'builder-module-empty',
                    text: LocalizationRenderer.t('quick_actions_builder_no_results') || 'No blocks found.'
                }));
                return;
            }
            filtered.forEach(module => {
                const item = Utils.createElement('li', { className: 'builder-module-item' });
                item.setAttribute('data-module-id', module.id);
                const title = Utils.createElement('strong', { text: this.getModuleName(module) });
                const description = Utils.createElement('span', { text: this.getModuleDescription(module) });
                item.appendChild(title);
                item.appendChild(description);
                item.addEventListener('click', () => this.addNode(module.id));
                container.appendChild(item);
            });
        });
        if (this.isBlockExplorerOpen()) {
            this.renderBlockExplorer();
        }
    },

    moduleMatchesSearch(module, term = '') {
        if (!term) return true;
        const lower = term.toLowerCase();
        const fields = [
            module?.id,
            this.getModuleName(module),
            this.getModuleDescription(module),
            this.getCategoryLabel(module?.category),
            ...(Array.isArray(module?.tags) ? module.tags : [])
        ];
        return fields.some(field => typeof field === 'string' && field.toLowerCase().includes(lower));
    },

    normalizeCategory(category) {
        const value = String(category || '').toLowerCase();
        if (!value || value === 'all') return 'all';
        if (value.startsWith('trigger')) return 'trigger';
        if (value.startsWith('util')) return 'utility';
        return 'action';
    },

    setBlockExplorerCategory(category, options = {}) {
        const normalized = this.normalizeCategory(category);
        this.blockExplorerCategory = normalized;
        this.updateBlockExplorerFilters();
        if (options.render !== false) {
            this.renderBlockExplorer();
        }
    },

    updateBlockExplorerFilters() {
        if (!this.blockExplorerFilters?.length) return;
        const current = this.blockExplorerCategory || 'all';
        this.blockExplorerFilters.forEach(button => {
            const category = button.getAttribute('data-block-category') || 'all';
            const normalized = this.normalizeCategory(category);
            const isActive = current === normalized;
            button.classList.toggle('active', isActive);
            button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });
    },

    getCategoryLabel(category) {
        let normalized = this.normalizeCategory(category);
        if (!category && normalized === 'all') {
            normalized = 'action';
        }
        const keyMap = {
            trigger: 'quick_actions_builder_category_trigger',
            action: 'quick_actions_builder_category_action',
            utility: 'quick_actions_builder_category_utility'
        };
        const fallbackMap = {
            trigger: 'Trigger',
            action: 'Action',
            utility: 'Utility'
        };
        if (normalized === 'all') {
            const allTranslation = LocalizationRenderer.t('quick_actions_builder_block_explorer_filter_all');
            return allTranslation && !allTranslation.startsWith('Missing:') ? allTranslation : 'All blocks';
        }
        const key = keyMap[normalized];
        const fallback = fallbackMap[normalized] || 'Action';
        if (!key) return fallback;
        const translation = LocalizationRenderer.t(key);
        return translation && !translation.startsWith('Missing:') ? translation : fallback;
    },

    isBlockExplorerOpen() {
        return !!this.elements.blockExplorer && this.elements.blockExplorer.classList.contains('active');
    },

    openBlockExplorer() {
        if (!this.elements.blockExplorer) return;
        this.blockExplorerSearchTerm = '';
        this.setBlockExplorerCategory('all', { render: false });
        if (this.elements.blockExplorerSearch) {
            this.elements.blockExplorerSearch.value = '';
        }
        this.renderBlockExplorer();
        this.elements.blockExplorer.classList.add('active');
        this.elements.blockExplorer.setAttribute('aria-hidden', 'false');
        requestAnimationFrame(() => {
            this.elements.blockExplorerSearch?.focus({ preventScroll: true });
        });
    },

    closeBlockExplorer() {
        if (!this.elements.blockExplorer) return;
        this.elements.blockExplorer.classList.remove('active');
        this.elements.blockExplorer.setAttribute('aria-hidden', 'true');
    },

    renderBlockExplorer() {
        const container = this.elements.blockExplorerList;
        if (!container) return;
        container.innerHTML = '';
        const searchTerm = this.blockExplorerSearchTerm || '';
        const modules = QuickActionModuleDefinitions.slice().sort((a, b) =>
            this.getModuleName(a).localeCompare(this.getModuleName(b))
        );
        const filtered = modules.filter(module => {
            if (!this.moduleMatchesSearch(module, searchTerm)) return false;
            const category = this.normalizeCategory(module?.category || 'action');
            if (this.blockExplorerCategory && this.blockExplorerCategory !== 'all') {
                return category === this.blockExplorerCategory;
            }
            return true;
        });

        this.updateBlockExplorerFilters();

        if (filtered.length === 0) {
            container.appendChild(Utils.createElement('div', {
                className: 'block-explorer-empty',
                text: LocalizationRenderer.t('quick_actions_builder_no_results') || 'No blocks match your search.'
            }));
            return;
        }

        filtered.forEach(module => {
            const card = Utils.createElement('article', { className: 'block-explorer-card' });

            const header = Utils.createElement('div', { className: 'block-explorer-card-header' });
            const iconWrapper = Utils.createElement('div', { className: 'block-explorer-card-icon' });
            const iconName = module.icon || 'box';
            if (window.feather?.icons?.[iconName]) {
                iconWrapper.innerHTML = window.feather.icons[iconName].toSvg();
            } else {
                iconWrapper.textContent = '⚡';
            }
            header.appendChild(iconWrapper);

            const titleWrap = Utils.createElement('div');
            titleWrap.appendChild(Utils.createElement('h4', { text: this.getModuleName(module) }));
            titleWrap.appendChild(Utils.createElement('p', { text: this.getModuleDescription(module) }));
            header.appendChild(titleWrap);
            card.appendChild(header);

            const tags = Utils.createElement('div', { className: 'block-explorer-tags' });
            const categoryTag = Utils.createElement('span', { className: 'block-explorer-tag', text: this.getCategoryLabel(module.category) });
            tags.appendChild(categoryTag);
            (module.tags || []).slice(0, 4).forEach(tag => {
                tags.appendChild(Utils.createElement('span', { className: 'block-explorer-tag', text: tag }));
            });
            card.appendChild(tags);

            const footer = Utils.createElement('div', { className: 'block-explorer-footer' });
            const addButton = Utils.createElement('button', { className: 'block-explorer-add', text: LocalizationRenderer.t('addon_builder_add_block') || 'Add block' });
            addButton.addEventListener('click', () => {
                this.addNode(module.id);
                this.closeBlockExplorer();
            });
            footer.appendChild(addButton);
            card.appendChild(footer);

            container.appendChild(card);
        });
    },

    renderCanvas() {
        if (!this.builderState) return;
        const nodeLayer = this.elements.nodeLayer;
        const connectionLayer = this.elements.connectionLayer;
        if (!nodeLayer || !connectionLayer) return;

        nodeLayer.innerHTML = '';
        connectionLayer.innerHTML = '';

        const panX = this.builderState.panX || 0;
        const panY = this.builderState.panY || 0;
        nodeLayer.style.transform = `translate(${panX}px, ${panY}px) scale(${this.builderState.zoom})`;
        // Connection layer doesn't need translate because it uses getBoundingClientRect which already includes transforms
        connectionLayer.style.transform = `scale(${this.builderState.zoom})`;

        this.builderState.nodes.forEach(node => {
            const moduleDef = QuickActionModuleMap.get(node.moduleId);
            if (!moduleDef) return;
            const nodeEl = Utils.createElement('div', { className: 'builder-node' + (this.builderState.selectedNodeId === node.id ? ' selected' : '') });
            nodeEl.style.transform = `translate(${node.position.x}px, ${node.position.y}px)`;
            nodeEl.setAttribute('data-node-id', node.id);

            const header = Utils.createElement('div', { className: 'builder-node-header' });
            const title = Utils.createElement('h4', { text: this.getModuleName(moduleDef) });
            header.appendChild(title);
            header.addEventListener('pointerdown', (event) => this.startNodeDrag(node.id, event));
            nodeEl.appendChild(header);

            const body = Utils.createElement('div', { className: 'builder-node-body', text: this.getModuleDescription(moduleDef) });
            nodeEl.appendChild(body);

            const footer = Utils.createElement('div', { className: 'builder-node-footer' });
            (moduleDef.inputs || []).forEach((port) => {
                const portEl = Utils.createElement('div', { className: 'builder-port builder-port-input' });
                portEl.setAttribute('data-node-id', node.id);
                portEl.setAttribute('data-port-id', port.id);
                portEl.setAttribute('data-role', 'input');
                portEl.setAttribute('title', ''); // Remove default browser tooltip
                portEl.addEventListener('click', (event) => this.handlePortClick(node.id, port.id, 'input', event));
                footer.appendChild(portEl);
            });

            (moduleDef.outputs || []).forEach((port) => {
                const portEl = Utils.createElement('div', { className: 'builder-port builder-port-output' });
                portEl.setAttribute('data-node-id', node.id);
                portEl.setAttribute('data-port-id', port.id);
                portEl.setAttribute('data-role', 'output');
                portEl.setAttribute('title', ''); // Remove default browser tooltip
                portEl.addEventListener('click', (event) => this.handlePortClick(node.id, port.id, 'output', event));
                footer.appendChild(portEl);
            });

            nodeEl.appendChild(footer);
            nodeEl.addEventListener('click', (event) => {
                if (!event.target.classList.contains('builder-port')) {
                    this.selectNode(node.id);
                }
            });

            nodeLayer.appendChild(nodeEl);
        });

        this.elements.emptyState?.classList.toggle('hidden', this.builderState.nodes.length > 1);
        this.drawConnections();
    },

    scheduleConnectionRedraw() {
        if (this.connectionRedrawScheduled) return;
        this.connectionRedrawScheduled = true;
        requestAnimationFrame(() => {
            this.connectionRedrawScheduled = false;
            this.drawConnections();
        });
    },

    drawConnections() {
        if (!this.builderState) return;
        const connectionLayer = this.elements.connectionLayer;
        if (!connectionLayer) return;
        connectionLayer.innerHTML = '';

        const canvasRect = this.elements.canvas.getBoundingClientRect();
        const zoom = this.builderState.zoom || 1;
        const baseWidth = canvasRect.width / zoom;
        const baseHeight = canvasRect.height / zoom;
        connectionLayer.setAttribute('width', `${baseWidth}`);
        connectionLayer.setAttribute('height', `${baseHeight}`);
        connectionLayer.setAttribute('viewBox', `0 0 ${baseWidth} ${baseHeight}`);

        const canvasLeft = canvasRect.left;
        const canvasTop = canvasRect.top;

        this.builderState.connections.forEach(connection => {
            const fromPort = this.findPortElement(connection.from?.nodeId, connection.from?.portId, 'output');
            const toPort = this.findPortElement(connection.to?.nodeId, connection.to?.portId, 'input');
            if (!fromPort || !toPort) return;

            const fromRect = fromPort.getBoundingClientRect();
            const toRect = toPort.getBoundingClientRect();
            const startX = (fromRect.left + fromRect.width / 2 - canvasLeft) / zoom;
            const startY = (fromRect.top + fromRect.height / 2 - canvasTop) / zoom;
            const endX = (toRect.left + toRect.width / 2 - canvasLeft) / zoom;
            const endY = (toRect.top + toRect.height / 2 - canvasTop) / zoom;
            const delta = Math.max(60, Math.abs(endX - startX) * 0.5);
            const pathData = `M ${startX} ${startY} C ${startX + delta} ${startY}, ${endX - delta} ${endY}, ${endX} ${endY}`;

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', pathData);
            path.setAttribute('data-connection-id', connection.id);
            path.addEventListener('click', (event) => {
                if (event.altKey) {
                    this.removeConnection(connection.id);
                }
            });
            connectionLayer.appendChild(path);
        });
    },

    renderInspector() {
        const container = this.elements.inspectorContent;
        if (!container || !this.builderState) return;
        this.closeAllBuilderSelects();
        this.builderSelectWrappers = new Set();
        container.innerHTML = '';

        const selectedId = this.builderState.selectedNodeId;
        if (!selectedId) {
            container.appendChild(Utils.createElement('p', { text: LocalizationRenderer.t('quick_actions_select_node') || 'Select a node to configure it.' }));
            return;
        }

        const node = this.builderState.nodes.find(item => item.id === selectedId);
        if (!node) {
            container.appendChild(Utils.createElement('p', { text: LocalizationRenderer.t('quick_actions_select_node') || 'Select a node to configure it.' }));
            return;
        }

        const moduleDef = QuickActionModuleMap.get(node.moduleId);
        if (!moduleDef || !Array.isArray(moduleDef.form)) {
            container.appendChild(Utils.createElement('p', { text: LocalizationRenderer.t('quick_actions_no_settings') || 'This block has no configurable options.' }));
            return;
        }

        const description = (this.getModuleDescription(moduleDef) || '').trim();
        if (description) {
            const infoWrapper = document.createElement('div');
            infoWrapper.className = 'inspector-node-info';

            const toggle = document.createElement('button');
            toggle.type = 'button';
            toggle.className = 'inspector-node-info-toggle';
            toggle.setAttribute('aria-expanded', 'false');
            const descriptionId = `inspector-node-desc-${node.id}`;
            toggle.setAttribute('aria-controls', descriptionId);
            toggle.textContent = LocalizationRenderer.t('quick_actions_block_info_toggle') || 'About this block';

            const descriptionEl = document.createElement('p');
            descriptionEl.className = 'inspector-node-info-text';
            descriptionEl.id = descriptionId;
            descriptionEl.textContent = description;
            descriptionEl.hidden = true;

            toggle.addEventListener('click', () => {
                const expanded = toggle.getAttribute('aria-expanded') === 'true';
                toggle.setAttribute('aria-expanded', expanded ? 'false' : 'true');
                descriptionEl.hidden = expanded;
            });

            infoWrapper.appendChild(toggle);
            infoWrapper.appendChild(descriptionEl);
            container.appendChild(infoWrapper);
        }

        moduleDef.form.forEach(field => {
            // Try to translate field label
            const labelText = field.label || field.key;
            const translationKey = `form_field_${labelText.toLowerCase().replace(/\s+/g, '_')}`;
            const translatedLabel = LocalizationRenderer.t(translationKey);
            const finalLabel = (translatedLabel && !translatedLabel.startsWith('Missing:')) ? translatedLabel : labelText;
            const label = Utils.createElement('label', { text: finalLabel });
            container.appendChild(label);

            const currentValue = node.config?.[field.key] ?? moduleDef.defaultConfig?.[field.key] ?? '';

            if (field.type === 'select') {
                const selectWrapper = this.createBuilderSelect(field, currentValue, (value) => {
                    if (value !== node.config?.[field.key]) {
                        this.updateNodeConfig(node.id, field.key, value);
                    }
                });
                container.appendChild(selectWrapper);
                return;
            }

            // Handle checkbox with iOS-style toggle switch
            if (field.type === 'checkbox') {
                const toggleLabel = Utils.createElement('label', { className: 'toggle-switch-ios' });
                const toggleInput = document.createElement('input');
                toggleInput.type = 'checkbox';
                toggleInput.checked = currentValue === true || currentValue === 'true';
                toggleInput.addEventListener('change', () => {
                    this.updateNodeConfig(node.id, field.key, toggleInput.checked);
                });
                const slider = Utils.createElement('span', { className: 'slider' });
                toggleLabel.appendChild(toggleInput);
                toggleLabel.appendChild(slider);
                container.appendChild(toggleLabel);
                return;
            }

            let input;
            if (field.type === 'textarea') {
                input = document.createElement('textarea');
                if (field.rows) input.rows = field.rows;
            } else {
                input = document.createElement('input');
                input.type = field.type || 'text';
                if (field.min !== undefined) input.min = field.min;
            }

            input.value = currentValue;
            if (field.placeholder) input.placeholder = field.placeholder;
            input.addEventListener('input', () => this.updateNodeConfig(node.id, field.key, input.value));
            container.appendChild(input);
        });

        if (!this.isManualNode(node.id)) {
            const deleteBtn = Utils.createElement('button', { className: 'settings-button secondary', text: LocalizationRenderer.t('quick_actions_remove_node') || 'Remove node' });
            deleteBtn.addEventListener('click', () => this.removeNode(node.id));
            container.appendChild(deleteBtn);
        }
    },

    createBuilderSelect(field, currentValue, onChange) {
        const options = Array.isArray(field.options) ? field.options : [];
        const wrapper = document.createElement('div');
        wrapper.className = 'custom-select-wrapper builder-custom-select';

        const customSelect = document.createElement('div');
        customSelect.className = 'custom-select';

        const trigger = document.createElement('div');
        trigger.className = 'custom-select-trigger';
        trigger.setAttribute('role', 'button');
        trigger.setAttribute('tabindex', '0');

        const labelSpan = document.createElement('span');
        const matchingOption = options.find(option => option.value === currentValue);
        let optionLabelText = '';
        if (matchingOption) {
            const optLabel = matchingOption.label || matchingOption.value;
            const optTransKey = `form_field_${String(optLabel).toLowerCase().replace(/\s+/g, '_')}`;
            const optTranslated = LocalizationRenderer.t(optTransKey);
            optionLabelText = (optTranslated && !optTranslated.startsWith('Missing:')) ? optTranslated : optLabel;
        } else {
            optionLabelText = currentValue || field.placeholder || '';
        }
        labelSpan.textContent = optionLabelText;
        trigger.appendChild(labelSpan);

        const arrow = document.createElement('span');
        arrow.className = 'arrow';
        arrow.innerHTML = "<svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>";
        trigger.appendChild(arrow);

        customSelect.appendChild(trigger);

        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'custom-options';

        if (!options.length) {
            const emptyOption = document.createElement('div');
            emptyOption.className = 'custom-option disabled';
            const emptySpan = document.createElement('span');
            emptySpan.textContent = field.placeholder || LocalizationRenderer.t('quick_actions_no_settings') || 'No options available';
            emptyOption.appendChild(emptySpan);
            optionsContainer.appendChild(emptyOption);
            trigger.classList.add('disabled');
        } else {
            options.forEach(option => {
                const optionEl = document.createElement('div');
                optionEl.className = 'custom-option';
                optionEl.dataset.value = option.value;

                const optionSpan = document.createElement('span');
                const rawLabel = option.label || option.value;
                const transKey = `form_field_${String(rawLabel).toLowerCase().replace(/\s+/g, '_')}`;
                const translated = LocalizationRenderer.t(transKey);
                optionSpan.textContent = (translated && !translated.startsWith('Missing:')) ? translated : rawLabel;
                optionEl.appendChild(optionSpan);

                if (option.value === currentValue) {
                    optionEl.classList.add('selected');
                }

                optionEl.addEventListener('click', (event) => {
                    event.stopPropagation();
                    if (wrapper.dataset.selectedValue === option.value) {
                        wrapper.classList.remove('open');
                        return;
                    }

                    optionsContainer.querySelector('.custom-option.selected')?.classList.remove('selected');
                    optionEl.classList.add('selected');
                    wrapper.dataset.selectedValue = option.value;
                    labelSpan.textContent = optionSpan.textContent;
                    wrapper.classList.remove('open');
                    if (typeof onChange === 'function') onChange(option.value);
                });

                optionsContainer.appendChild(optionEl);
            });
        }

        customSelect.appendChild(optionsContainer);
        wrapper.appendChild(customSelect);

        trigger.addEventListener('click', (event) => {
            event.stopPropagation();
            if (trigger.classList.contains('disabled')) return;
            const isOpen = wrapper.classList.contains('open');
            this.closeAllBuilderSelects();
            if (!isOpen) {
                wrapper.classList.add('open');
            }
        });

        trigger.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                trigger.click();
            } else if (event.key === 'Escape') {
                wrapper.classList.remove('open');
            }
        });

        wrapper.dataset.selectedValue = matchingOption
            ? String(matchingOption.value)
            : (currentValue !== undefined && currentValue !== null ? String(currentValue) : '');
        this.builderSelectWrappers.add(wrapper);

        if (!matchingOption && options.length) {
            const firstOption = optionsContainer.querySelector('.custom-option');
            if (firstOption) {
                firstOption.classList.add('selected');
                wrapper.dataset.selectedValue = firstOption.dataset.value;
                const firstLabel = firstOption.querySelector('span');
                labelSpan.textContent = firstLabel ? firstLabel.textContent : firstOption.textContent;
                if (typeof onChange === 'function') {
                    onChange(firstOption.dataset.value);
                }
            }
        }

        return wrapper;
    },

    handleBuilderSelectOutsideClick(event) {
        if (!this.builderSelectWrappers || this.builderSelectWrappers.size === 0) return;
        this.builderSelectWrappers.forEach(wrapper => {
            if (!wrapper.contains(event.target)) {
                wrapper.classList.remove('open');
            }
        });
    },

    closeAllBuilderSelects() {
        if (!this.builderSelectWrappers) return;
        this.builderSelectWrappers.forEach(wrapper => wrapper.classList.remove('open'));
    },

    updateNodeConfig(nodeId, key, value) {
        if (!this.builderState) return;
        const node = this.builderState.nodes.find(item => item.id === nodeId);
        if (!node) return;
        const moduleDef = QuickActionModuleMap.get(node.moduleId);
        if (!moduleDef) return;

        if (moduleDef.form?.some(field => field.type === 'number' && field.key === key)) {
            const numeric = parseInt(value, 10);
            if (!Number.isNaN(numeric)) {
                node.config[key] = numeric;
            }
        } else {
            node.config[key] = value;
        }
    },

    selectNode(nodeId) {
        if (this.builderState) {
            this.builderState.selectedNodeId = nodeId;
            this.renderBuilder();
        }
    },

    startNodeDrag(nodeId, event) {
        if (!this.builderState) return;
        const node = this.builderState.nodes.find(item => item.id === nodeId);
        if (!node) return;
        event.preventDefault();
        event.stopPropagation();
        this.builderState.drag = {
            nodeId,
            startX: event.clientX,
            startY: event.clientY,
            originX: node.position.x,
            originY: node.position.y,
            pointerId: event.pointerId,
            pointerTarget: event.currentTarget || event.target,
            lastEvent: event
        };
        try {
            this.builderState.drag.pointerTarget?.setPointerCapture?.(event.pointerId);
        } catch (error) {
            // Ignore pointer capture failures
        }
        window.addEventListener('pointermove', this.boundDragMove);
        window.addEventListener('pointerup', this.boundDragEnd);
    },

    handleNodeDrag(event) {
        if (!this.builderState?.drag) return;
        event.preventDefault();
        this.builderState.drag.lastEvent = event;
        if (this.dragUpdateRaf) return;
        this.dragUpdateRaf = requestAnimationFrame(() => this.applyDragUpdate());
    },

    applyDragUpdate() {
        this.dragUpdateRaf = null;
        if (!this.builderState?.drag?.lastEvent) return;
        const drag = this.builderState.drag;
        const node = this.builderState.nodes.find(item => item.id === drag.nodeId);
        if (!node) return;
        const zoom = this.builderState.zoom || 1;
        node.position.x = drag.originX + (drag.lastEvent.clientX - drag.startX) / zoom;
        node.position.y = drag.originY + (drag.lastEvent.clientY - drag.startY) / zoom;
        const nodeEl = this.findNodeElement(node.id);
        if (nodeEl) {
            nodeEl.style.transform = `translate(${node.position.x}px, ${node.position.y}px)`;
        }
        this.scheduleConnectionRedraw();
    },

    stopNodeDrag() {
        if (!this.builderState) return;
        if (this.dragUpdateRaf) {
            cancelAnimationFrame(this.dragUpdateRaf);
            this.dragUpdateRaf = null;
            this.applyDragUpdate();
        } else {
            this.applyDragUpdate();
        }
        try {
            if (this.builderState.drag?.pointerTarget && typeof this.builderState.drag.pointerId === 'number') {
                this.builderState.drag.pointerTarget.releasePointerCapture?.(this.builderState.drag.pointerId);
            }
        } catch (error) {
            // Ignore pointer release errors
        }
        this.builderState.drag = null;
        window.removeEventListener('pointermove', this.boundDragMove);
        window.removeEventListener('pointerup', this.boundDragEnd);
    },

    handlePortClick(nodeId, portId, role, event) {
        event.stopPropagation();
        if (!this.builderState) return;
        const portEl = event.currentTarget;
        if (role === 'output') {
            if (this.builderState.pendingConnection?.from?.nodeId === nodeId && this.builderState.pendingConnection?.from?.portId === portId) {
                this.clearPendingConnection();
                return;
            }
            this.clearPendingConnection();
            this.builderState.pendingConnection = { from: { nodeId, portId } };
            portEl.classList.add('is-pending');
        } else if (role === 'input' && this.builderState.pendingConnection?.from) {
            this.createConnection(this.builderState.pendingConnection.from.nodeId, this.builderState.pendingConnection.from.portId, nodeId, portId);
            this.clearPendingConnection();
        }
    },

    clearPendingConnection() {
        if (!this.builderState?.pendingConnection) return;
        const pending = this.builderState.pendingConnection.from;
        const port = this.findPortElement(pending.nodeId, pending.portId, 'output');
        port?.classList.remove('is-pending');
        this.builderState.pendingConnection = null;
    },

    createConnection(fromNodeId, fromPortId, toNodeId, toPortId) {
        if (!this.builderState) return;
        if (fromNodeId === toNodeId) return;
        const exists = this.builderState.connections.some(connection => connection.from?.nodeId === fromNodeId && connection.to?.nodeId === toNodeId && connection.from?.portId === fromPortId && connection.to?.portId === toPortId);
        if (exists) return;
        this.connectionIdCounter += 1;
        this.builderState.connections.push({
            id: `conn-${Date.now()}-${this.connectionIdCounter}`,
            from: { nodeId: fromNodeId, portId: fromPortId },
            to: { nodeId: toNodeId, portId: toPortId }
        });
        this.drawConnections();
    },

    removeConnection(connectionId) {
        if (!this.builderState) return;
        this.builderState.connections = this.builderState.connections.filter(connection => connection.id !== connectionId);
        this.drawConnections();
    },

    removeNode(nodeId) {
        if (!this.builderState || this.isManualNode(nodeId)) return;
        this.builderState.nodes = this.builderState.nodes.filter(node => node.id !== nodeId);
        this.builderState.connections = this.builderState.connections.filter(connection => connection.from?.nodeId !== nodeId && connection.to?.nodeId !== nodeId);
        if (this.builderState.selectedNodeId === nodeId) {
            this.builderState.selectedNodeId = null;
        }
        this.renderBuilder();
    },

    addNode(moduleId) {
        if (!this.builderState) return;
        
        // If adding a trigger (except manual-trigger), remove ALL existing triggers including manual-trigger
        const moduleDef = QuickActionModuleMap.get(moduleId);
        if (moduleDef && moduleDef.category === 'trigger' && moduleId !== 'manual-trigger') {
            // Remove ALL existing trigger nodes (including manual-trigger)
            const triggersToRemove = this.builderState.nodes.filter(node => {
                const nodeMod = QuickActionModuleMap.get(node.moduleId);
                return nodeMod && nodeMod.category === 'trigger';
            });
            
            if (triggersToRemove.length > 0) {
                const triggerIds = new Set(triggersToRemove.map(n => n.id));
                
                // Find nodes that were connected to the old triggers (to reconnect them)
                const nextNodes = new Set();
                this.builderState.connections.forEach(conn => {
                    if (triggerIds.has(conn.from?.nodeId)) {
                        nextNodes.add(conn.to?.nodeId);
                    }
                });
                
                // Remove trigger nodes and their connections
                this.builderState.nodes = this.builderState.nodes.filter(node => !triggerIds.has(node.id));
                this.builderState.connections = this.builderState.connections.filter(conn => 
                    !triggerIds.has(conn.from?.nodeId) && !triggerIds.has(conn.to?.nodeId)
                );
                
                // Clear selection if removed node was selected
                if (triggerIds.has(this.builderState.selectedNodeId)) {
                    this.builderState.selectedNodeId = null;
                }
                
                // Add new trigger at the position of the first removed trigger
                const firstTrigger = triggersToRemove[0];
                const position = firstTrigger ? firstTrigger.position : { x: 120, y: 200 };
                const node = this.createNodeDefinition(moduleId, position);
                this.builderState.nodes.unshift(node);
                this.builderState.selectedNodeId = node.id;
                
                // Reconnect to next nodes
                nextNodes.forEach(nextNodeId => {
                    const nextNode = this.builderState.nodes.find(n => n.id === nextNodeId);
                    if (nextNode) {
                        this.createConnection(node.id, 'next', nextNodeId, 'input');
                    }
                });
                
                this.renderBuilder();
                return;
            }
        }
        
        const position = { x: 260 + this.builderState.nodes.length * 120, y: 220 + (this.builderState.nodes.length % 3) * 110 };
        const node = this.createNodeDefinition(moduleId, position);
        this.builderState.nodes.push(node);
        this.builderState.selectedNodeId = node.id;
        if (this.builderState.nodes.length === 2) {
            const manual = this.builderState.nodes.find(item => item.moduleId === 'manual-trigger');
            if (manual) {
                this.createConnection(manual.id, 'next', node.id, 'input');
            }
        }
        this.renderBuilder();
    },

    adjustZoom(delta) {
        if (!this.builderState) return;
        const next = Math.max(0.4, Math.min(1.8, (this.builderState.zoom || 1) + delta));
        this.builderState.zoom = parseFloat(next.toFixed(2));
        this.renderBuilder();
    },

    resetView() {
        if (!this.builderState) return;
        this.builderState.zoom = 1;
        this.builderState.panX = 0;
        this.builderState.panY = 0;
        this.renderBuilder();
    },

    async clearWorkspace() {
        if (!this.builderState) return;
        const confirmed = await this.showConfirm(
            LocalizationRenderer.t('quick_actions_clear_confirm') || 'Очистить рабочее поле?'
        );
        if (!confirmed) return;
        const manual = this.builderState.nodes.find(node => node.moduleId === 'manual-trigger');
        this.builderState.nodes = manual ? [manual] : [this.createNodeDefinition('manual-trigger', { x: 120, y: 200 })];
        this.builderState.connections = [];
        this.builderState.selectedNodeId = this.builderState.nodes[0].id;
        this.renderBuilder();
    },

    showConfirm(message, title = '') {
        return new Promise((resolve) => {
            if (!this.elements.confirmDialog) {
                resolve(false);
                return;
            }

            if (this.elements.confirmMessage) {
                this.elements.confirmMessage.textContent = message;
            }
            
            this.elements.confirmDialog.setAttribute('aria-hidden', 'false');
            
            // Refresh feather icons
            if (window.feather) {
                feather.replace();
            }

            const cleanup = () => {
                this.elements.confirmDialog?.setAttribute('aria-hidden', 'true');
                this.elements.confirmOk?.removeEventListener('click', handleOk);
                this.elements.confirmCancel?.removeEventListener('click', handleCancel);
                this.elements.confirmDialog?.removeEventListener('click', handleBackdrop);
                document.removeEventListener('keydown', handleEscape);
            };

            const handleOk = () => {
                cleanup();
                resolve(true);
            };

            const handleCancel = () => {
                cleanup();
                resolve(false);
            };

            const handleBackdrop = (event) => {
                if (event.target.classList.contains('builder-confirm-backdrop')) {
                    cleanup();
                    resolve(false);
                }
            };

            const handleEscape = (event) => {
                if (event.key === 'Escape') {
                    cleanup();
                    resolve(false);
                }
            };

            this.elements.confirmOk?.addEventListener('click', handleOk);
            this.elements.confirmCancel?.addEventListener('click', handleCancel);
            this.elements.confirmDialog?.addEventListener('click', handleBackdrop);
            document.addEventListener('keydown', handleEscape);
        });
    },

    updateZoomIndicator() {
        if (this.elements.zoomIndicator && this.builderState) {
            this.elements.zoomIndicator.textContent = `${Math.round((this.builderState.zoom || 1) * 100)}%`;
        }
    },

    findPortElement(nodeId, portId, role) {
        const selector = `.builder-port[data-node-id="${nodeId}"][data-port-id="${portId}"][data-role="${role}"]`;
        return this.elements.nodeLayer?.querySelector(selector) || null;
    },

    findNodeElement(nodeId) {
        return this.elements.nodeLayer?.querySelector(`.builder-node[data-node-id="${nodeId}"]`) || null;
    },

    isManualNode(nodeId) {
        const node = this.builderState?.nodes.find(item => item.id === nodeId);
        return node?.moduleId === 'manual-trigger';
    },

    updateIconPreview() {
        if (!this.elements.iconPreview || !this.builderState) return;
        const iconName = this.builderState.metadata.icon || 'zap';
        if (String(iconName).startsWith('custom:')) {
            const id = String(iconName).slice(7);
            const found = (AppState.settings.customIcons || []).find(i => i.id === id);
            if (found) this.elements.iconPreview.innerHTML = `<img src="${found.dataUrl}" alt="icon" />`;
            else this.elements.iconPreview.textContent = '';
        } else if (window.feather?.icons?.[iconName]) {
            this.elements.iconPreview.innerHTML = window.feather.icons[iconName].toSvg();
        } else {
            this.elements.iconPreview.textContent = '⚡';
        }
        this.refreshIconPickerSelection();
        if (this.iconPickerOpen) {
            this.scrollIconIntoView(iconName);
        }
    },

    getIconList() {
        if (Array.isArray(this.cachedIconList) && this.cachedIconList.length) {
            return this.cachedIconList;
        }
        let names = [];
        if (window.feather?.icons) {
            names = Object.keys(window.feather.icons);
        } else {
            names = ['zap', 'grid', 'folder', 'command', 'copy', 'settings', 'bookmark', 'globe', 'bell', 'clock', 'edit-3', 'type', 'database'];
        }
        const custom = Array.isArray(AppState.settings.customIcons) ? AppState.settings.customIcons.map(i => `custom:${i.id}`) : [];
        this.cachedIconList = [...custom, ...names.sort((a, b) => a.localeCompare(b))];
        return this.cachedIconList;
    },

    buildIconPicker() {
        const container = this.elements.iconPicker;
        if (!container) return;
        container.innerHTML = '';
        this.iconPickerButtons = new Map();
        const icons = this.getIconList();
        icons.forEach(name => {
            const button = document.createElement('button');
            button.type = 'button';
            button.setAttribute('data-icon', name);
            let title = name;
            if (String(name).startsWith('custom:')) {
                const id = String(name).slice(7);
                const found = (AppState.settings.customIcons || []).find(i => i.id === id);
                title = found?.name || 'custom';
                if (found) {
                    const img = new Image();
                    img.src = found.dataUrl;
                    button.appendChild(img);
                }
            } else if (window.feather?.icons?.[name]) {
                button.innerHTML = window.feather.icons[name].toSvg();
            } else {
                const fallback = document.createElement('span');
                fallback.textContent = name.slice(0, 2).toUpperCase();
                button.appendChild(fallback);
            }
            button.setAttribute('title', title);
            const srOnly = document.createElement('span');
            srOnly.className = 'sr-only';
            srOnly.textContent = title;
            button.appendChild(srOnly);
            this.iconPickerButtons.set(name, button);
            container.appendChild(button);
        });
        container.hidden = true;
        this.iconPickerOpen = false;
        this.elements.iconPickerToggle?.setAttribute('aria-expanded', 'false');
        this.refreshIconPickerSelection();
        if (!window.feather?.icons) {
            setTimeout(() => {
                if (window.feather?.icons) {
                    this.cachedIconList = null;
                    this.buildIconPicker();
                }
            }, 500);
        }
    },

    refreshIconPickerSelection() {
        if (!this.iconPickerButtons) return;
        const active = this.builderState?.metadata.icon || 'zap';
        this.iconPickerButtons.forEach((button, name) => {
            if (!button) return;
            if (name === active) button.classList.add('is-active');
            else button.classList.remove('is-active');
        });
    },

    scrollIconIntoView(iconName) {
        if (!iconName) return;
        const button = this.iconPickerButtons?.get(iconName);
        if (button && typeof button.scrollIntoView === 'function') {
            button.scrollIntoView({ block: 'nearest' });
        }
    },

    toggleIconPicker(shouldOpen) {
        const container = this.elements.iconPicker;
        const toggle = this.elements.iconPickerToggle;
        if (!container || !toggle) return;
        const nextState = typeof shouldOpen === 'boolean' ? shouldOpen : !this.iconPickerOpen;
        if (nextState === this.iconPickerOpen) return;
        this.iconPickerOpen = nextState;
        container.hidden = !nextState;
        toggle.setAttribute('aria-expanded', nextState ? 'true' : 'false');
        if (this.elements.inspector) {
            this.elements.inspector.classList.toggle('icon-picker-open', nextState);
        }
        if (nextState) {
            this.refreshIconPickerSelection();
            this.scrollIconIntoView(this.builderState?.metadata.icon || 'zap');
            document.addEventListener('pointerdown', this.boundOutsideClick, true);
        } else {
            document.removeEventListener('pointerdown', this.boundOutsideClick, true);
        }
    },

    ensureBuilderFitsWindow(size) {
        if (!size) {
            size = QuickActionStore.getBuilderSize();
        }
        const paddingX = 96; // modal horizontal padding
        const paddingY = 80; // modal vertical padding
        const requiredWidth = Math.min(1800, Math.round(size.width) + paddingX);
        const requiredHeight = Math.min(1200, Math.round(size.height) + paddingY);
        const needsWidth = requiredWidth > window.innerWidth;
        const needsHeight = requiredHeight > window.innerHeight;
        if (needsWidth || needsHeight) {
            const width = needsWidth ? requiredWidth : window.innerWidth;
            const height = needsHeight ? requiredHeight : window.innerHeight;
            this.windowExpanded = true;
            ipcRenderer.send('resize-window', { width, height });
        }
    },

    async saveAction() {
        if (!this.builderState) return;
        if (!this.builderState.metadata.label || !this.builderState.metadata.label.trim()) {
            await customAlert(LocalizationRenderer.t('quick_actions_error_name') || 'Please enter a name for your quick action.');
            this.elements.actionLabelInput?.focus();
            return;
        }

        const nodes = this.builderState.nodes.map(node => ({
            id: node.id,
            moduleId: node.moduleId,
            position: { ...node.position },
            config: { ...(node.config || {}) }
        }));

        const connections = this.builderState.connections.map(connection => ({
            id: connection.id,
            from: { ...connection.from },
            to: { ...connection.to }
        }));

        if (nodes.length === 0) {
            await customAlert(LocalizationRenderer.t('quick_actions_error_empty') || 'Add at least one block to the workflow.');
            return;
        }

        const actionId = this.builderState.metadata.id || `quick-${Date.now()}`;
        const actionDefinition = {
            id: actionId,
            type: 'workflow',
            name: this.builderState.metadata.label.trim(),
            icon: this.builderState.metadata.icon || 'zap',
            accent: this.builderState.metadata.accent || '#5865f2',
            description: this.builderState.metadata.description || 'Custom quick action',
            workflow: {
                nodes,
                connections,
                zoom: this.builderState.zoom,
                panX: this.builderState.panX || 0,
                panY: this.builderState.panY || 0,
                initialPayload: this.builderState.metadata.initialPayload ?? null
            }
        };

        QuickActionStore.saveCustomAction(actionDefinition);
        QuickActionManager.refresh();
        this.renderAll();
        this.closeBuilder();
    },

    previewAction() {
        if (!this.builderState) return;
        const preview = {
            type: 'workflow',
            icon: this.builderState.metadata.icon,
            accent: this.builderState.metadata.accent,
            workflow: {
                nodes: this.builderState.nodes.map(node => ({
                    id: node.id,
                    moduleId: node.moduleId,
                    position: { ...node.position },
                    config: { ...(node.config || {}) }
                })),
                connections: this.builderState.connections.map(connection => ({ ...connection }))
            }
        };
        QuickActionExecutor.runDefinition(preview);
    },

    async exportCurrentAction() {
        if (!this.builderState) return;
        const payload = {
            id: this.builderState.metadata.id || `quick-${Date.now()}`,
            name: this.builderState.metadata.label,
            icon: this.builderState.metadata.icon,
            accent: this.builderState.metadata.accent,
            type: 'workflow',
            workflow: {
                nodes: this.builderState.nodes.map(node => ({
                    id: node.id,
                    moduleId: node.moduleId,
                    position: { ...node.position },
                    config: { ...(node.config || {}) }
                })),
                connections: this.builderState.connections.map(connection => ({ ...connection }))
            }
        };
        ipcRenderer.send('copy-to-clipboard', JSON.stringify(payload, null, 2));
        await customAlert(LocalizationRenderer.t('quick_actions_exported') || 'Configuration copied to clipboard.');
    },

    toggleImportArea(show) {
        if (!this.elements.importArea) return;
        if (show) {
            this.elements.importArea.hidden = false;
            this.elements.importText?.focus();
        } else {
            this.elements.importArea.hidden = true;
            if (this.elements.importText) this.elements.importText.value = '';
        }
    },

    async handleImport() {
        const text = this.elements.importText?.value?.trim();
        if (!text) return;
        try {
            const parsed = JSON.parse(text);
            if (!parsed || typeof parsed !== 'object' || !parsed.workflow) {
                await customAlert(LocalizationRenderer.t('quick_actions_import_invalid') || 'Invalid configuration file.');
                return;
            }
            parsed.id = parsed.id || `quick-${Date.now()}`;
            parsed.type = parsed.type || 'workflow';
            QuickActionStore.saveCustomAction(parsed);
            QuickActionManager.refresh();
            this.renderAll();
            this.toggleImportArea(false);
        } catch (error) {
            await customAlert(LocalizationRenderer.t('quick_actions_import_invalid') || 'Invalid configuration file.');
        }
    },

    getActionTitle(action) {
        if (action.nameKey) return LocalizationRenderer.t(action.nameKey);
        if (action.name) return action.name;
        if (action.label) return action.label;
        return LocalizationRenderer.t('quick_actions_untitled') || 'Untitled action';
    },

    getActionDescription(action) {
        if (action.descriptionKey) return LocalizationRenderer.t(action.descriptionKey);
        if (action.description) return action.description;
        return LocalizationRenderer.t('quick_actions_default_description') || 'Available from the quick action bar.';
    },

    getModuleName(module) {
        if (!module) return '';
        const keys = [];
        if (module.nameKey) keys.push(module.nameKey);
        if (module.id) keys.push(`qa_module_${module.id.replace(/-/g, '_')}_name`);
        for (const key of keys) {
            const translation = LocalizationRenderer.t(key);
            if (translation && !translation.startsWith('Missing:')) {
                return translation;
            }
        }
        return module.name || '';
    },

    getModuleDescription(module) {
        if (!module) return '';
        const keys = [];
        if (module.descriptionKey) keys.push(module.descriptionKey);
        if (module.id) keys.push(`qa_module_${module.id.replace(/-/g, '_')}_description`);
        for (const key of keys) {
            const translation = LocalizationRenderer.t(key);
            if (translation && !translation.startsWith('Missing:')) {
                return translation;
            }
        }
        return module.description || '';
    },

    applyTemplate(template) {
        if (!this.builderState || !template) return;
        this.builderState.metadata.label = this.getActionTitle(template);
        this.builderState.metadata.icon = template.icon || 'zap';
        this.builderState.metadata.accent = template.accent || '#5865f2';

        if (template.type === 'panel') {
            const manual = this.builderState.nodes.find(node => node.moduleId === 'manual-trigger');
            if (!manual) return;
            const panelNode = this.createNodeDefinition('open-panel', { x: manual.position.x + 220, y: manual.position.y });
            panelNode.config.panel = template.payload?.panel || 'clipboard';
            this.builderState.nodes.push(panelNode);
            this.builderState.connections.push({
                id: `conn-${Date.now()}-${++this.connectionIdCounter}`,
                from: { nodeId: manual.id, portId: 'next' },
                to: { nodeId: panelNode.id, portId: 'input' }
            });
        }
    }
};

// =================================================================================
// === Система Локализации (Клиентская сторона) ===
// =================================================================================
// ... existing code ...
const LocalizationRenderer = {
    t: function(key, ...args) {
        const translation = AppState.translations[key] || `Missing: ${key}`;
        return Utils.formatString(translation, ...args);
    },

    applyTranslations: function() {
        Utils.getAllElements('[data-i18n]').forEach(element => {
            element.textContent = this.t(element.getAttribute('data-i18n'));
        });
        // НОВОЕ: Обработка HTML
        Utils.getAllElements('[data-i18n-html]').forEach(element => {
            element.innerHTML = this.t(element.getAttribute('data-i18n-html'));
        });
        const searchInput = Utils.getElement('#search-input');
        if (searchInput) {
            searchInput.placeholder = this.t('search_placeholder');
        }
        Utils.getAllElements('[data-i18n-placeholder]').forEach(element => {
            element.placeholder = this.t(element.getAttribute('data-i18n-placeholder'));
        });
        Utils.getAllElements('[data-i18n-title]').forEach(element => {
            element.title = this.t(element.getAttribute('data-i18n-title'));
        });
        Utils.getAllElements('[data-i18n-aria-label]').forEach(element => {
            element.setAttribute('aria-label', this.t(element.getAttribute('data-i18n-aria-label')));
        });
        this.refreshLanguageDependentUI();
        if (typeof CustomSelect?.refreshAll === 'function') {
            CustomSelect.refreshAll();
        }
        if (typeof QuickActionManager?.refresh === 'function') {
            QuickActionManager.refresh();
        }
        if (typeof QuickActionLab?.refresh === 'function') {
            QuickActionLab.refresh();
        }
    },

    refreshLanguageDependentUI: function() {
        if (AppState.currentView === 'search' && AppState.searchResults.length > 0) {
            SearchModule.performSearch(Utils.getElement('#search-input').value.trim());
        }
        if (AppState.currentView === 'settings') {
            SettingsModule.renderIndexedDirectories();
            SettingsModule.renderAutomations();
            SettingsModule.renderSubscription();
            SettingsModule.renderAddons();
            SettingsModule.renderAddonBuilder();
        }
    }
};

// =================================================================================
// === Модуль Управления Настройками (UI) ===
// =================================================================================
// ... existing code ...
const SettingsModule = {
    init: function() {
        this.setupEventListeners();
        this.setupTabs();
        QuickActionLab.init();
    },

    setupEventListeners: function() {
        this.bindCheckboxSetting('setting-animations', 'animations');
        this.bindCheckboxSetting('setting-pinned-apps', 'enablePinnedApps');
        this.bindCheckboxSetting('setting-apps-library-basic-only', 'appsLibraryBasicOnly');
        this.bindCheckboxSetting('setting-focus-highlight', 'showFocusHighlight');
        this.bindCheckboxSetting('setting-auto-launch', 'autoLaunch');
        this.bindRangeSetting('setting-opacity', 'opacity');
        this.bindRangeSetting('setting-blur', 'blurStrength');
        this.bindRangeSetting('setting-border-radius', 'borderRadius');
        this.bindRangeSetting('setting-width', 'width');
        this.bindRangeSetting('setting-height', 'height');
        
        this.setupShortcutRecorder();

        if (Utils.getElement('#rebuild-index-button')) {
            Utils.getElement('#rebuild-index-button').addEventListener('click', () => ipcRenderer.send('rebuild-index'));
        }
        if (Utils.getElement('#add-directory-button')) {
            Utils.getElement('#add-directory-button').addEventListener('click', this.addDirectory.bind(this));
        }
        if (Utils.getElement('#add-automation-button')) {
            Utils.getElement('#add-automation-button').addEventListener('click', this.addAutomation.bind(this));
        }
        Utils.getAllElements('.external-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const url = link.getAttribute('data-url');
                if (url) shell.openExternal(url);
            });
        });

        const manageButton = Utils.getElement('#subscription-manage-button');
        if (manageButton) {
            manageButton.addEventListener('click', (event) => {
                event.preventDefault();
                ipcRenderer.send('open-subscription-portal');
            });
        }

        const toggleButton = Utils.getElement('#subscription-toggle');
        if (toggleButton) {
            toggleButton.addEventListener('click', () => this.toggleSubscription());
        }

        // Custom SVG Icons uploads
        const uploadBtn = Utils.getElement('#custom-icon-upload');
        const fileInput = Utils.getElement('#custom-icon-file');
        const clearBtn = Utils.getElement('#custom-icon-clear');
        if (uploadBtn && fileInput) {
            uploadBtn.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', async (e) => {
                const files = Array.from(e.target.files || []);
                if (files.length) {
                    await SettingsModule.addCustomIconsFromFiles(files);
                    fileInput.value = '';
                }
            });
        }
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (Array.isArray(AppState.settings.customIcons) && AppState.settings.customIcons.length) {
                    AppState.settings.customIcons = [];
                    ipcRenderer.send('update-setting', 'customIcons', []);
                    SettingsModule.renderCustomIconLibrary();
                }
            });
        }

    },
    
    bindSetting: function(elementId, settingKey) {
        const element = Utils.getElement(`#${elementId}`);
        if (element) element.addEventListener('change', (e) => ipcRenderer.send('update-setting', settingKey, e.target.value));
    },

    bindCheckboxSetting: function(elementId, settingKey) {
        const element = Utils.getElement(`#${elementId}`);
        if (element) element.addEventListener('change', (e) => ipcRenderer.send('update-setting', settingKey, e.target.checked));
    },
    
    // НОВАЯ ФУНКЦИЯ: Сохранение при потере фокуса
    bindSettingOnBlur: function(elementId, settingKey) {
        const element = Utils.getElement(`#${elementId}`);
        if (element) {
            element.addEventListener('blur', (e) => {
                const value = e.target.value.trim();
                if (value && value !== AppState.settings[settingKey]) {
                    ipcRenderer.send('update-setting', settingKey, value);
                }
            });
        }
    },

    bindDebouncedSetting: function(elementId, settingKey, delay) {
        const element = Utils.getElement(`#${elementId}`);
        if (element) {
            const update = Utils.debounce((value) => {
                if (value) ipcRenderer.send('update-setting', settingKey, value);
            }, delay);
            element.addEventListener('input', (e) => update(e.target.value));
        }
    },

    bindRangeSetting: function(elementId, settingKey) {
        const element = Utils.getElement(`#${elementId}`);
        if (element) {
            element.addEventListener('input', (e) => {
                ViewManager.updateDynamicStyles(settingKey, e.target.value);
                if (settingKey === 'width' || settingKey === 'height') { // Живое обновление размера
                    ipcRenderer.send('live-resize', { key: settingKey, value: e.target.value });
                }
            });
            element.addEventListener('change', (e) => ipcRenderer.send('update-setting', settingKey, e.target.value));
        }
    },

    setupTabs: function() {
        Utils.getAllElements('.settings-sidebar li').forEach(tabButton => {
            tabButton.addEventListener('click', () => {
                const tabId = tabButton.getAttribute('data-tab');
                document.querySelector('.settings-sidebar li.active')?.classList.remove('active');
                document.querySelector('.tab-content.active')?.classList.remove('active');
                tabButton.classList.add('active');
                const newTab = Utils.getElement(`#tab-${tabId}`);
                if (newTab) newTab.classList.add('active');
            });
        });
    },

    populateSettingsUI: function() {
        CustomSelect.setValue('custom-select-language', AppState.settings.language);
        CustomSelect.setValue('custom-select-theme', AppState.settings.theme);
        this.setElementValue('setting-shortcut', AppState.settings.shortcut);
        CustomSelect.setValue('custom-select-position', AppState.settings.windowPosition);
        this.setElementValue('setting-animations', AppState.settings.animations, true);
        this.setElementValue('setting-pinned-apps', AppState.settings.enablePinnedApps, true);
        const basicOnly = AppState.settings.appsLibraryBasicOnly !== false;
        this.setElementValue('setting-apps-library-basic-only', basicOnly, true);
        this.setElementValue('setting-auto-launch', AppState.settings.autoLaunch, true);
        this.setElementValue('setting-opacity', AppState.settings.opacity);
        this.setElementValue('setting-blur', AppState.settings.blurStrength);
        this.setElementValue('setting-focus-highlight', AppState.settings.showFocusHighlight, true);
        this.setElementValue('setting-width', AppState.settings.width);
        this.setElementValue('setting-height', AppState.settings.height);
        
        // ИСПРАВЛЕНИЕ: Правильная инициализация ползунка скругления
        const borderRadiusValue = AppState.settings.borderRadius !== undefined ? AppState.settings.borderRadius : 24;
        this.setElementValue('setting-border-radius', borderRadiusValue);
        // Применяем значение сразу в CSS
        ViewManager.updateDynamicStyles('borderRadius', borderRadiusValue);
        
        this.setElementValue('setting-max-depth', AppState.settings.maxIndexDepth);
        CustomSelect.setValue('custom-select-animation-style', AppState.settings.animationStyle);
        CustomSelect.setValue('custom-select-results-animation-style', AppState.settings.resultsAnimationStyle);
        CustomSelect.setValue('custom-select-selection-color', AppState.settings.selectionColorStyle || 'gray'); // НОВОЕ
        if (Utils.getElement('#app-version')) {
            Utils.getElement('#app-version').textContent = AppState.appVersion;
        }
        this.ensureSubscriptionVisibility();
        this.renderSubscription();
        this.renderAddons();
        this.renderAddonBuilder();
        this.renderIndexedDirectories();
        this.renderAutomations();
        this.renderCustomIconLibrary();
    },
    
    setElementValue: function(elementId, value, isCheckbox = false) {
        const element = Utils.getElement(`#${elementId}`);
        if (element) {
            if (isCheckbox) element.checked = value !== false;
            else element.value = value;
        }
    },
    
    renderIndexedDirectories: function() {
        const list = Utils.getElement('#indexed-directories-list');
        if (!list) return;
        list.innerHTML = '';
        (AppState.settings.indexedDirectories || []).forEach((dir, index) => {
            const entry = Utils.createElement('div', { className: 'directory-entry' });
            entry.appendChild(Utils.createElement('span', { text: dir }));
            const removeButton = Utils.createElement('button', { className: 'remove-dir-button', text: LocalizationRenderer.t('settings_remove') });
            removeButton.addEventListener('click', () => this.removeDirectory(index));
            entry.appendChild(removeButton);
            list.appendChild(entry);
        });
    },

    addDirectory: async function() {
        const newPath = await ipcRenderer.invoke('select-directory');
        if (newPath) {
            const directories = [...(AppState.settings.indexedDirectories || [])];
            if (!directories.includes(newPath)) {
                directories.push(newPath);
                ipcRenderer.send('update-setting', 'indexedDirectories', directories);
            }
        }
    },

    removeDirectory: function(index) {
        const directories = [...(AppState.settings.indexedDirectories || [])];
        if (index >= 0 && index < directories.length) {
            directories.splice(index, 1);
            ipcRenderer.send('update-setting', 'indexedDirectories', directories);
        }
    },

    // ================= Custom Icons ==================
    sanitizeSvgText: function(text) {
        if (typeof text !== 'string') return null;
        const lower = text.toLowerCase();
        if (!lower.includes('<svg')) return null;
        if (lower.includes('<script')) return null;
        return text;
    },

    async addCustomIconsFromFiles(files) {
        const icons = Array.isArray(AppState.settings.customIcons) ? [...AppState.settings.customIcons] : [];
        for (const file of files) {
            try {
                const content = await file.text();
                const safe = this.sanitizeSvgText(content);
                if (!safe) continue;
                const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(safe)}`;
                icons.push({ id: `u${Date.now()}_${Math.random().toString(36).slice(2,8)}`, name: file.name.replace(/\.svg$/i,'') || 'icon', dataUrl });
            } catch {}
        }
        AppState.settings.customIcons = icons;
        ipcRenderer.send('update-setting', 'customIcons', icons);
        this.renderCustomIconLibrary();
    },

    renderCustomIconLibrary() {
        const wrap = Utils.getElement('#custom-icon-library');
        if (!wrap) return;
        wrap.innerHTML = '';
        const icons = Array.isArray(AppState.settings.customIcons) ? AppState.settings.customIcons : [];
        icons.forEach((icon) => {
            const item = Utils.createElement('div', { className: 'custom-icon-item' });
            const img = new Image();
            img.src = icon.dataUrl;
            item.appendChild(img);
            const remove = Utils.createElement('button', { className: 'remove', text: '×' });
            remove.addEventListener('click', () => {
                const next = icons.filter(i => i.id !== icon.id);
                AppState.settings.customIcons = next;
                ipcRenderer.send('update-setting', 'customIcons', next);
                this.renderCustomIconLibrary();
            });
            item.appendChild(remove);
            wrap.appendChild(item);
        });
    },

    updateIndexingStatus: function(state) {
        if (Utils.getElement('#index-status')) {
            Utils.getElement('#index-status').textContent = state.state;
            Utils.getElement('#index-count').textContent = state.filesIndexed.toLocaleString();
        }
    },

    renderAutomations: function() {
        const list = Utils.getElement('#automations-list');
        if (!list) return;
        list.innerHTML = '';
        const automations = AppState.settings.customAutomations || [];
        automations.forEach((auto, index) => {
            const entry = Utils.createElement('div', { className: 'automation-entry' });
            const infoDiv = Utils.createElement('div', { className: 'automation-info' });
            infoDiv.innerHTML = `<div class="automation-name">${Utils.escapeHtml(auto.name)} (Keyword: ${Utils.escapeHtml(auto.keyword)})</div><div class="automation-details">${auto.command}</div>`;
            entry.appendChild(infoDiv);
            const removeButton = Utils.createElement('button', { className: 'remove-dir-button', text: LocalizationRenderer.t('settings_remove') });
            removeButton.addEventListener('click', () => this.removeAutomation(index));
            entry.appendChild(removeButton);
            list.appendChild(entry);
        });

        const limit = this.getAutomationLimit();
        const addButton = Utils.getElement('#add-automation-button');
        const limitNote = Utils.getElement('#automation-limit-note');
        const count = automations.length;

        if (addButton) {
            const atLimit = Number.isFinite(limit) && count >= limit;
            addButton.disabled = atLimit;
            addButton.classList.toggle('is-disabled', atLimit);
        }

        if (limitNote) {
            if (Number.isFinite(limit)) {
                limitNote.textContent = LocalizationRenderer.t('subscription_automation_limit_note', count, limit);
                limitNote.classList.remove('is-hidden');
            } else {
                limitNote.textContent = '';
                limitNote.classList.add('is-hidden');
            }
        }
    },

    async addAutomation() {
        const name = Utils.getElement('#new-auto-name').value.trim();
        const keyword = Utils.getElement('#new-auto-keyword').value.trim().toLowerCase();
        const command = Utils.getElement('#new-auto-command').value.trim();
        if (name && keyword && command) {
            const automations = [...(AppState.settings.customAutomations || [])];
            if (automations.some(a => a.keyword === keyword)) {
                await customAlert("Ошибка: Ключевое слово уже используется.");
                return;
            }
            const limit = this.getAutomationLimit();
            if (Number.isFinite(limit) && automations.length >= limit) {
                await customAlert(LocalizationRenderer.t('subscription_automation_limit_reached', limit));
                return;
            }
            automations.push({ id: `custom-${Date.now()}`, name, keyword, command });
            ipcRenderer.send('update-setting', 'customAutomations', automations);
            Utils.getElement('#new-auto-name').value = '';
            Utils.getElement('#new-auto-keyword').value = '';
            Utils.getElement('#new-auto-command').value = '';
        } else {
            await customAlert("Ошибка: Все поля обязательны для заполнения.");
        }
    },

    removeAutomation: function(index) {
        const automations = [...(AppState.settings.customAutomations || [])];
        if (index >= 0 && index < automations.length) {
            automations.splice(index, 1);
            ipcRenderer.send('update-setting', 'customAutomations', automations);
        }
    },

    hasActiveSubscription: function() {
        return !!this.getSubscription().isActive;
    },

    getPlanDefinition: function(planId) {
        return SubscriptionPlanDefinitions[planId] || SubscriptionPlanDefinitions.pro;
    },

    getSubscription: function() {
        if (AppState.settings?.subscription) return AppState.settings.subscription;
        const freePlan = this.getPlanDefinition('free');
        return {
            isActive: false,
            planId: freePlan.id,
            planName: LocalizationRenderer.t(freePlan.nameKey),
            renewalDate: null,
            features: freePlan.features.map(feature => feature.storageKey),
            entitlements: {
                automations: freePlan.automationLimit,
                clipboard: freePlan.clipboardLimit,
                hasAddonBuilder: freePlan.hasAddonBuilder
            }
        };
    },

    hasAddonBuilderAccess: function() {
        return !!(this.getSubscription().entitlements?.hasAddonBuilder);
    },

    ensureSubscriptionVisibility: function() {
        const addonsTabButton = Utils.getElement('.settings-sidebar li[data-tab="addons"]');
        const addonsContent = Utils.getElement('#tab-addons');
        const hasBuilder = this.hasAddonBuilderAccess();

        if (addonsTabButton) {
            addonsTabButton.classList.toggle('is-hidden', !hasBuilder);
            if (!hasBuilder && addonsTabButton.classList.contains('active')) {
                Utils.getElement('.settings-sidebar li[data-tab="subscription"]')?.click()
                    || Utils.getElement('.settings-sidebar li[data-tab="general"]')?.click();
            }
        }

        if (addonsContent) {
            addonsContent.classList.toggle('is-hidden', !hasBuilder);
            if (!hasBuilder) addonsContent.classList.remove('active');
        }
    },

    renderSubscription: function() {
        const subscription = this.getSubscription();
        const isActive = this.hasActiveSubscription();
        const hasBuilder = this.hasAddonBuilderAccess();
        const statusKey = isActive && hasBuilder ? 'subscription_status_active' : 'subscription_status_inactive';

        const activePlanId = hasBuilder ? (subscription.planId || 'pro') : 'free';
        const activePlanDef = this.getPlanDefinition(activePlanId);
        const freePlan = this.enrichPlanWithEntitlements(this.getPlanDefinition('free'));
        const proPlan = this.enrichPlanWithEntitlements(this.getPlanDefinition('pro'), isActive ? subscription.entitlements : null);

        const statusBadge = Utils.getElement('#subscription-status-badge');
        if (statusBadge) {
            statusBadge.textContent = LocalizationRenderer.t(statusKey);
            statusBadge.classList.toggle('inactive', !(isActive && hasBuilder));
            statusBadge.classList.toggle('active', isActive && hasBuilder);
            statusBadge.setAttribute('data-plan', activePlanId);
        }

        const statusText = Utils.getElement('#subscription-status-text');
        if (statusText) {
            statusText.textContent = LocalizationRenderer.t(statusKey);
        }

        const planNameEl = Utils.getElement('#subscription-plan-name');
        if (planNameEl) {
            planNameEl.textContent = LocalizationRenderer.t(activePlanDef.nameKey);
        }

        const planDescriptionEl = Utils.getElement('#subscription-plan-description');
        if (planDescriptionEl) {
            planDescriptionEl.textContent = LocalizationRenderer.t(activePlanDef.descriptionKey);
        }

        const renewalEl = Utils.getElement('#subscription-renewal-date');
        if (renewalEl) {
            renewalEl.textContent = this.formatDateForUser(subscription.renewalDate);
        }

        const toggleButton = Utils.getElement('#subscription-toggle');
        if (toggleButton) {
            const toggleKey = hasBuilder ? 'subscription_toggle_deactivate' : 'subscription_toggle_activate';
            toggleButton.textContent = LocalizationRenderer.t(toggleKey);
            toggleButton.classList.toggle('is-active', hasBuilder);
            toggleButton.setAttribute('aria-pressed', String(hasBuilder));
            toggleButton.setAttribute('data-plan', activePlanId);
        }

        this.renderPlanFeatureList(Utils.getElement('#subscription-feature-list'), proPlan, { highlight: hasBuilder });
        this.renderPlanFeatureList(Utils.getElement('#subscription-free-feature-list'), freePlan, { highlight: !hasBuilder });
        this.renderPlanFeatureList(Utils.getElement('#subscription-pro-feature-list'), proPlan, { highlight: hasBuilder });
    },

    enrichPlanWithEntitlements: function(planDefinition, entitlements = null) {
        const automationLimit = entitlements && Object.prototype.hasOwnProperty.call(entitlements, 'automations')
            ? entitlements.automations
            : planDefinition.automationLimit;
        const clipboardLimit = entitlements && Object.prototype.hasOwnProperty.call(entitlements, 'clipboard')
            ? entitlements.clipboard
            : planDefinition.clipboardLimit;

        return {
            ...planDefinition,
            automationLimit,
            clipboardLimit
        };
    },

    renderPlanFeatureList: function(listElement, plan, options = {}) {
        if (!listElement || !plan) return;
        listElement.innerHTML = '';
        const highlight = options.highlight === true;

        const createListItem = (translationKey, ...args) => {
            const item = Utils.createElement('li');
            item.textContent = LocalizationRenderer.t(translationKey, ...args);
            if (highlight) item.classList.add('is-highlighted');
            listElement.appendChild(item);
        };

        const finiteAutomation = typeof plan.automationLimit === 'number' && Number.isFinite(plan.automationLimit);
        const finiteClipboard = typeof plan.clipboardLimit === 'number' && Number.isFinite(plan.clipboardLimit);

        plan.features.forEach(feature => {
            switch (feature.storageKey) {
                case 'automations-limited':
                    if (finiteAutomation) createListItem('subscription_feature_automations_limit', plan.automationLimit);
                    else createListItem('subscription_feature_unlimited_automations');
                    break;
                case 'unlimited-automations':
                    createListItem('subscription_feature_unlimited_automations');
                    break;
                case 'priority-support':
                    createListItem('subscription_feature_priority_support');
                    break;
                case 'addon-builder':
                    createListItem('subscription_feature_master_addons');
                    break;
                case 'no-addon-builder':
                    createListItem('subscription_feature_no_addon_builder');
                    break;
                case 'full-clipboard-history':
                    createListItem('subscription_feature_full_clipboard');
                    break;
                case 'clipboard-limited':
                    if (finiteClipboard) createListItem('subscription_feature_clipboard_limit', plan.clipboardLimit);
                    else createListItem('subscription_feature_full_clipboard');
                    break;
                default:
                    createListItem(SubscriptionFeatureLabels[feature.storageKey] || SubscriptionFeatureLabels.default);
            }
        });
    },

    getAutomationLimit: function() {
        const limit = this.getSubscription().entitlements?.automations;
        return typeof limit === 'number' ? limit : Infinity;
    },

    getClipboardLimit: function() {
        const limit = this.getSubscription().entitlements?.clipboard;
        return typeof limit === 'number' ? limit : Infinity;
    },

    toggleSubscription: function() {
        const hasBuilder = this.hasAddonBuilderAccess();
        const targetPlanId = hasBuilder ? 'free' : 'pro';
        const targetPlan = this.getPlanDefinition(targetPlanId);
        const entitlements = {
            automations: targetPlan.automationLimit,
            clipboard: targetPlan.clipboardLimit,
            hasAddonBuilder: targetPlan.hasAddonBuilder
        };
        const payload = {
            isActive: !hasBuilder,
            planId: targetPlan.id,
            planName: LocalizationRenderer.t(targetPlan.nameKey),
            renewalDate: !hasBuilder ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null,
            features: targetPlan.features.map(feature => feature.storageKey),
            entitlements
        };
        ipcRenderer.send('update-setting', 'subscription', payload);
    },

    openSubscriptionTab: function() {
        const tab = Utils.getElement('.settings-sidebar li[data-tab="subscription"]');
        if (tab) tab.click();
    },

    formatDateForUser: function(value) {
        if (!value) {
            return LocalizationRenderer.t('subscription_next_renewal_unknown');
        }
        try {
            const parsed = new Date(value);
            if (Number.isNaN(parsed.getTime())) {
                return LocalizationRenderer.t('subscription_next_renewal_unknown');
            }
            const locale = AppState.settings?.language || 'en';
            return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric' }).format(parsed);
        } catch (error) {
            return LocalizationRenderer.t('subscription_next_renewal_unknown');
        }
    },

    renderAddons: function() {
        QuickActionLab.renderAll();
        QuickActionManager.refresh();
    },

    renderAddonBuilder: function() {
        if (QuickActionLab.builderState?.isOpen) {
            QuickActionLab.renderBuilder();
        }
    },

    setupShortcutRecorder: function() {
        const shortcutInput = Utils.getElement('#setting-shortcut');
        if (!shortcutInput) return;

        shortcutInput.addEventListener('focus', () => {
            shortcutInput.value = LocalizationRenderer.t('shortcut_recorder_placeholder');
        });

        shortcutInput.addEventListener('blur', () => {
            shortcutInput.value = AppState.settings.shortcut; // Revert to saved setting
        });

        shortcutInput.addEventListener('keydown', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const modifiers = [];
            if (e.ctrlKey) modifiers.push('Ctrl');
            if (e.altKey) modifiers.push('Alt');
            if (e.shiftKey) modifiers.push('Shift');
            if (e.metaKey) modifiers.push('Super');

            const keyCode = e.code;

            if (keyCode === 'Escape') {
                shortcutInput.blur();
                return;
            }
            if (keyCode === 'Backspace') {
                shortcutInput.value = LocalizationRenderer.t('shortcut_recorder_placeholder');
                return;
            }

            const isModifierKey = ['Control', 'Alt', 'Shift', 'Meta'].some(mod => keyCode.includes(mod));

            if (isModifierKey) {
                shortcutInput.value = modifiers.join('+') + (modifiers.length > 0 ? '+' : '');
                return;
            }
            
            if (modifiers.length === 0) {
                shortcutInput.value = LocalizationRenderer.t('shortcut_recorder_error');
                return;
            }

            let finalKey = keyCode;
            if (finalKey.startsWith('Key')) finalKey = finalKey.substring(3);
            else if (finalKey.startsWith('Digit')) finalKey = finalKey.substring(5);
            else if (finalKey.startsWith('Numpad')) finalKey = "num" + finalKey.substring(6);
            
            const finalShortcut = [...modifiers, finalKey].join('+');
            shortcutInput.value = finalShortcut;
            
            if (finalShortcut !== AppState.settings.shortcut) {
               ipcRenderer.send('update-setting', 'shortcut', finalShortcut);
               AppState.settings.shortcut = finalShortcut; // Immediately update state
            }
            
            shortcutInput.blur();
        });
    }
};

// =================================================================================
// === Модуль Поиска и Результатов (Search Module) ===
// =================================================================================
// ... existing code ...
const SearchModule = {
    init: function() {
        const searchInput = Utils.getElement('#search-input');
        const debouncedSearch = Utils.debounce((query) => {
            if (query.length > 1) this.performSearch(query);
            else this.clearResults();
        }, 250);
        if (searchInput) {
            searchInput.removeAttribute('readonly');
            searchInput.disabled = false;
            searchInput.addEventListener('input', (e) => debouncedSearch(e.target.value.trim()));
        }
        const searchBox = Utils.getElement('#search-box');
        if (searchInput && searchBox) {
            searchBox.addEventListener('mousedown', (event) => {
                if (event.target !== searchInput) {
                    event.preventDefault();
                    searchInput.focus({ preventScroll: true });
                }
            });
        }
        this.setupKeyboardNavigation();
    },

    performSearch: async function(query) {
        try {
            console.log(`[Renderer] Sending search query to main: "${query}"`); // DEBUG
            const results = await ipcRenderer.invoke('search-all', query);
            console.log(`[Renderer] Received ${results.length} results from main.`); // DEBUG
            
            // ИЗМЕНЕНО: добавляем поиск в интернете В НАЧАЛО списка
            const webSearchItem = {
                title: LocalizationRenderer.t('result_web_search', query),
                type: 'web_search',
                query: query,
                icon: 'search'
            };

            const webPreviewItem = {
                title: LocalizationRenderer.t('result_wiki_preview', query),
                type: 'web_preview',
                query: query,
                icon: 'globe'
            };

            // Дедубликация уже выполнена в main.js, просто добавляем веб-поиск в начало
            AppState.searchResults = [webSearchItem, webPreviewItem, ...results];
        } catch (error) {
            console.error("[SearchModule] Search failed:", error);
            AppState.searchResults = [];
        }
        AppState.selectedIndex = 0;
        this.displayResults();
        this.loadIconsForResults();
    },

    displayResults: function() {
        const resultsList = Utils.getElement('#results-list');
        const resultsArea = Utils.getElement('#results-area');
        const pinnedAppsContainer = Utils.getElement('#pinned-apps-container');

        if (pinnedAppsContainer) ViewManager.animateHide(pinnedAppsContainer);

        if (AuxPanelManager.currentPanel) {
            AuxPanelManager.closePanel(false);
        }
        
        resultsList.innerHTML = '';
        Utils.getElement('#web-preview-container').style.display = 'none';
        Utils.getElement('#results-container').style.display = 'block';

        if (AppState.searchResults.length === 0) {
            this.clearResults();
            return;
        }

        const fragment = document.createDocumentFragment();
        AppState.searchResults.forEach((result, index) => {
            const li = document.createElement('li');
            li.className = 'result-item';
            
            let iconHtml = '';
            if (result.isApp) {
                const cachedSrc = AppState.iconCache.get(result.path);
                const fallbackIcon = AppIconFallbacks.get(result.name, result.path);
                const src = (cachedSrc && typeof cachedSrc === 'string' && cachedSrc.startsWith('data:image'))
                            ? cachedSrc
                            : (fallbackIcon || this.getFallbackIconDataUrl('cpu'));
                const safePath = Utils.escapeHtml(result.path);
                const safeName = Utils.escapeHtml(result.name || '');
                iconHtml = `<img class="result-icon app-icon" data-path="${safePath}" data-app-name="${safeName}" src="${src}" style="width: 24px; height: 24px; object-fit: contain;" />`;
                console.log(`[Renderer] App icon for ${result.name}: ${cachedSrc ? 'Cached' : 'Fallback'}`);
            } else {
                iconHtml = this.generateSvgIconHtml(result);
            }
            
            const textContent = result.name || result.title;
            li.innerHTML = `${iconHtml}<span class="result-text">${Utils.escapeHtml(textContent)}</span>`;

            if (index === AppState.selectedIndex) li.classList.add('selected');
            li.addEventListener('click', (e) => {
                // НОВОЕ: Ctrl+Click для быстрого добавления в закрепленные
                if (result.isApp && e.ctrlKey) {
                    e.preventDefault();
                    console.log('[Renderer] Ctrl+Click on app:', result.name, result.path);
                    ipcRenderer.send('add-app-to-pinned-direct', result);
                    // Показываем уведомление
                    this.showNotification(LocalizationRenderer.t('app_added_to_pinned'));
                    return;
                }
                this.handleResultClick(result, e); // Передаем event
            });
            // НОВОЕ: Контекстное меню для приложений
            if (result.isApp) {
                li.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    e.stopPropagation(); // ВАЖНО: Останавливаем дальнейшее всплытие
                    console.log('[Renderer] Right click on app:', result.name, result.path);
                    AppContextMenu.show({ name: result.name, path: result.path, sourceFolderId: null }, e.clientX, e.clientY);
                });
            }
            fragment.appendChild(li);
        });

        resultsList.appendChild(fragment);
        ViewManager.prepareForShow(resultsArea);
        resultsArea.classList.add('visible'); // Добавляем класс для анимации
        
        // УДАЛЕНО: Убираем назойливую подсказку
        // this.showAppHintIfNeeded();
        ViewManager.resizeWindow();
    },
    
    getFallbackIconDataUrl: (iconName) => (window.feather && window.feather.icons[iconName]) ? `data:image/svg+xml;base64,${btoa(window.feather.icons[iconName].toSvg())}` : '',

    generateSvgIconHtml: function(result) {
        if (!window.feather) return '';
        let iconName = 'file-text';
        if (result.type === 'directory') iconName = 'folder';
        else if (result.type === 'web_preview') iconName = 'globe';
        else if (result.type === 'web_search') iconName = 'search';
        else if (result.type === 'system' || result.type === 'custom') iconName = 'command';
        return window.feather.icons[iconName] ? window.feather.icons[iconName].toSvg({ class: 'result-icon' }) : '';
    },

    loadIconsForResults: function() {
        Utils.getAllElements('.app-icon').forEach(img => {
            const path = img.getAttribute('data-path');
            if (!path || path.startsWith('shell:')) {
                return;
            }

            const appName = img.getAttribute('data-app-name') || '';
            if (AppIconFallbacks.shouldForceFallback(appName, path)) {
                const fallback = AppIconFallbacks.get(appName, path);
                if (fallback) {
                    if (AppState.iconCache.get(path) !== fallback) {
                        AppState.iconCache.set(path, fallback);
                    }
                    if (img.src !== fallback) {
                        img.src = fallback;
                    }
                }
                return;
            }

            if (!AppState.iconCache.has(path)) {
                AppState.iconCache.set(path, 'fetching');
                ipcRenderer.send('request-file-icon', path);
            }
        });
    },

    clearResults: function() {
        const resultsList = Utils.getElement('#results-list');
        if (resultsList) resultsList.innerHTML = '';
        
        const resultsArea = Utils.getElement('#results-area');
        if (resultsArea) ViewManager.animateHide(resultsArea);

        // Close any open auxiliary panel to return to the default state.
        if (AuxPanelManager.currentPanel) {
            AuxPanelManager.closePanel(false); // `false` prevents it from re-showing pinned apps.
        }

        const pinnedAppsContainer = Utils.getElement('#pinned-apps-container');
        if (pinnedAppsContainer && AppState.settings.enablePinnedApps) {
            ViewManager.prepareForShow(pinnedAppsContainer);
            pinnedAppsContainer.classList.add('visible');
        }
        
        AppState.searchResults = [];
        AppState.selectedIndex = -1;
        ViewManager.resizeWindow();
    },

    handleResultClick: function(result, event) {
        // === УЛУЧШЕНО: Немедленная визуальная обратная связь ===
        if (event) {
            const clickedElement = event.target.closest('.result-item');
            if (clickedElement) {
                clickedElement.style.transform = 'scale(0.95)';
                clickedElement.style.opacity = '0.7';
                clickedElement.style.transition = 'all 0.1s ease';
            }
        }

        // Запускаем действие немедленно (окно скроется на стороне main.js)
        if (result.path) {
            ipcRenderer.send('open-item', result.path);
        } else if (result.id) {
            ipcRenderer.send('execute-command', result.id);
        } else if (result.type === 'web_search') {
            const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(result.query)}`;
            shell.openExternal(searchUrl);
        } else if (result.type === 'web_preview') {
            this.showInlinePreview(result.query);
        }
    },
    
    showInlinePreview: function(query) {
        const webPreviewContainer = Utils.getElement('#web-preview-container');
        const loader = Utils.getElement('#loader');
        if (!webPreviewContainer || !loader) return;

        webPreviewContainer.style.display = 'block';
        Utils.getElement('#results-container').style.display = 'none';
        loader.style.display = 'block';
        
        const existingContent = webPreviewContainer.querySelector('.wiki-content');
        if (existingContent) existingContent.remove();
        ViewManager.resizeWindow();

        const lang = AppState.settings.language || 'en';
        
        // ИСПРАВЛЕНИЕ: Убираем ограничение на короткие запросы - пробуем искать любые
        const searchApiUrl = `https://${lang}.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=1&format=json&origin=*`;

        fetch(searchApiUrl, { 
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(response.status === 404 ? LocalizationRenderer.t('error_wiki_not_found') : `Network error: ${response.statusText}`);
                }
                return response.json();
            })
            .then(searchData => {
                // Opensearch возвращает [query, [titles], [descriptions], [urls]]
                if (searchData && searchData.length >= 2 && searchData[1].length > 0) {
                    const foundTitle = searchData[1][0];
                    
                    // Теперь получаем содержимое статьи
                    const extractApiUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=true&explaintext=true&titles=${encodeURIComponent(foundTitle)}&format=json&origin=*`;
                    
                    return fetch(extractApiUrl)
                        .then(response => response.json())
                        .then(data => {
                            loader.style.display = 'none';
                            
                            if (data.query && data.query.pages) {
                                const pages = data.query.pages;
                                const pageId = Object.keys(pages)[0];
                                
                                if (pageId !== '-1') {
                                    this.renderWikipediaSummary(pages[pageId], query);
                                } else {
                                    throw new Error(LocalizationRenderer.t('error_wiki_not_found'));
                                }
                            } else {
                                throw new Error('Invalid API response');
                            }
                        });
                } else {
                    // Результаты не найдены, пробуем английскую Википедию если язык не английский
                    if (lang !== 'en') {
                        const enSearchUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=1&format=json&origin=*`;
                        return fetch(enSearchUrl)
                            .then(r => r.json())
                            .then(enSearchData => {
                                if (enSearchData && enSearchData.length >= 2 && enSearchData[1].length > 0) {
                                    const enTitle = enSearchData[1][0];
                                    const enExtractUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=true&explaintext=true&titles=${encodeURIComponent(enTitle)}&format=json&origin=*`;
                                    
                                    return fetch(enExtractUrl)
                                        .then(r => r.json())
                                        .then(enData => {
                                            loader.style.display = 'none';
                                            const enPages = enData.query.pages;
                                            const enPageId = Object.keys(enPages)[0];
                                            if (enPageId !== '-1') {
                                                this.renderWikipediaSummary(enPages[enPageId], query);
                                            } else {
                                                throw new Error(LocalizationRenderer.t('error_wiki_not_found'));
                                            }
                                        });
                                } else {
                                    throw new Error(LocalizationRenderer.t('error_wiki_not_found'));
                                }
                            });
                    } else {
                        throw new Error(LocalizationRenderer.t('error_wiki_not_found'));
                    }
                }
            })
            .catch(error => {
                console.error('[Wikipedia API Error]:', error);
                loader.style.display = 'none';
                // ИСПРАВЛЕНИЕ: Показываем более понятное сообщение об ошибке
                const errorMessage = error.message || LocalizationRenderer.t('error_wiki_not_found');
                this.renderPreviewError(errorMessage, query);
            });
    },

    renderWikipediaSummary: function(data, query) { // ПРИНИМАЕМ query
        const webPreviewContainer = Utils.getElement('#web-preview-container');
        const contentDiv = Utils.createElement('div', { className: 'wiki-content' });
        
        // ИСПРАВЛЕНО: Парсим новый формат данных
        const title = data.title || query;
        const extract = data.extract || '';
        
        let summaryText;
        if (extract.trim().length < 20) {
            summaryText = LocalizationRenderer.t('wiki_no_summary', query);
        } else {
            summaryText = extract;
        }
    
        contentDiv.appendChild(Utils.createElement('h2', { text: title }));
        contentDiv.appendChild(Utils.createElement('p', { className: 'wiki-summary', text: summaryText }));
        
        // Ссылка на полную статью
        const lang = AppState.settings.language || 'en';
        const wikiLink = Utils.createElement('a', { className: 'wiki-link', text: LocalizationRenderer.t('wiki_read_more') });
        wikiLink.href = `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`;
        wikiLink.addEventListener('click', (e) => { e.preventDefault(); shell.openExternal(wikiLink.href); });
        contentDiv.appendChild(wikiLink);

        // НОВАЯ КНОПКА ПОИСКА
        const searchLink = Utils.createElement('a', { className: 'wiki-link', text: LocalizationRenderer.t('web_search_button', query) });
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        searchLink.href = searchUrl;
        searchLink.addEventListener('click', (e) => { e.preventDefault(); shell.openExternal(searchUrl); });
        contentDiv.appendChild(searchLink);

        webPreviewContainer.appendChild(contentDiv);
        ViewManager.resizeWindow();
    },

    renderPreviewError: function(message, query) { // ПРИНИМАЕМ query
        const webPreviewContainer = Utils.getElement('#web-preview-container');
        const errorDiv = Utils.createElement('div', { className: 'wiki-content error'});
        errorDiv.textContent = LocalizationRenderer.t('error_quick_search') + message;
        
        // КНОПКА ПОИСКА ДЛЯ ОШИБКИ
        const searchLink = Utils.createElement('a', { className: 'wiki-link', text: LocalizationRenderer.t('web_search_button', query) });
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        searchLink.href = searchUrl;
        searchLink.addEventListener('click', (e) => { 
            e.preventDefault(); 
            shell.openExternal(searchUrl);
        });
        errorDiv.appendChild(searchLink);

        webPreviewContainer.appendChild(errorDiv);
        ViewManager.resizeWindow();
    },

    setupKeyboardNavigation: function() {
        document.addEventListener('keydown', (e) => {
            if (AppState.currentView !== 'search') {
                if (e.key === 'Escape') ViewManager.switchView('search');
                return;
            }
            const count = AppState.searchResults.length;
            if (count > 0) {
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    AppState.selectedIndex = (AppState.selectedIndex + 1) % count;
                    this.displayResults();
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    AppState.selectedIndex = (AppState.selectedIndex - 1 + count) % count;
                    this.displayResults();
                } else if (e.key === 'Enter' && AppState.selectedIndex >= 0) {
                    this.handleResultClick(AppState.searchResults[AppState.selectedIndex], null);
                }
            }
            if (e.key === 'Escape') {
                const searchInput = Utils.getElement('#search-input');
                if (searchInput && (searchInput.value.length > 0 || Utils.getElement('#results-area').classList.contains('visible'))) {
                    searchInput.value = '';
                    this.clearResults();
                }
            }
        });
    },

    // НОВОЕ: Показ уведомлений
    showNotification: function(message) {
        // Создаем элемент уведомления
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--highlight-color);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 14px;
            z-index: 10000;
            opacity: 0;
            transform: translateX(100px);
            transition: all 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Анимация появления
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        // Автоматическое скрытие через 3 секунды
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    },

    // НОВОЕ: Показ подсказки о работе с приложениями
    showAppHintIfNeeded: function() {
        const hasApps = AppState.searchResults.some(result => result.isApp);
        if (hasApps) {
            // Проверяем, показывали ли уже подсказку в этой сессии
            if (!AppState.hintShown) {
                setTimeout(() => {
                    this.showHint(LocalizationRenderer.t('hint_right_click'));
                    AppState.hintShown = true;
                }, 1000);
            }
        }
    },

    // НОВОЕ: Показ подсказки (отличается от уведомления)
    showHint: function(message) {
        // Удаляем предыдущую подсказку если есть
        const existingHint = document.querySelector('.search-hint');
        if (existingHint) existingHint.remove();

        const hint = document.createElement('div');
        hint.className = 'search-hint';
        hint.textContent = message;
        hint.style.cssText = `
            position: absolute;
            bottom: 10px;
            left: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 12px;
            text-align: center;
            opacity: 0;
            transform: translateY(10px);
            transition: all 0.3s ease;
            z-index: 1000;
        `;
        
        const resultsArea = Utils.getElement('#results-area');
        if (resultsArea) {
            resultsArea.style.position = 'relative';
            resultsArea.appendChild(hint);
            
            // Анимация появления
            setTimeout(() => {
                hint.style.opacity = '1';
                hint.style.transform = 'translateY(0)';
            }, 10);
            
            // Автоматическое скрытие через 5 секунд
            setTimeout(() => {
                if (hint.parentNode) {
                    hint.style.opacity = '0';
                    hint.style.transform = 'translateY(10px)';
                    setTimeout(() => {
                        if (hint.parentNode) hint.remove();
                    }, 300);
                }
            }, 5000);
        }
    }
};

const FolderContextMenu = {
    colors: [
        null,
        '#ff6b6b', '#ff8a65', '#ffb74d', '#ffe082',
        '#c5e1a5', '#81c784', '#4db6ac', '#4fc3f7',
        '#64b5f6', '#9575cd', '#ba68c8', '#f06292',
        '#a1887f', '#90a4ae'
    ],
    icons: [
        'folder', 'grid', 'inbox', 'briefcase', 'star', 'layers', 'code', 'command', 'music', 'film', 'book', 'coffee', 'cpu',
        'camera', 'heart', 'map', 'monitor', 'package', 'pie-chart', 'shopping-bag', 'sliders', 'sun', 'users', 'activity',
        'airplay', 'alert-circle', 'aperture', 'archive', 'bar-chart-2', 'battery-charging', 'bell', 'bluetooth', 'book-open',
        'box', 'calendar', 'cast', 'check-circle', 'cloud', 'cloud-drizzle', 'cloud-lightning', 'cloud-rain', 'cloud-snow',
        'database', 'disc', 'download', 'droplet', 'edit-3', 'external-link', 'feather', 'flag', 'gift', 'globe', 'headphones',
        'image', 'key', 'life-buoy', 'lock', 'mail', 'map-pin', 'message-circle', 'mic', 'moon', 'navigation', 'phone', 'play',
        'send', 'settings', 'shield', 'smartphone', 'tablet', 'target', 'terminal', 'thermometer', 'tool', 'trending-up', 'tv',
        'umbrella', 'video', 'watch', 'wifi', 'zap'
    ],
    currentFolderId: null,
    menuEl: null,
    colorsContainer: null,
    iconsContainer: null,

    init() {
        this.menuEl = Utils.getElement('#folder-context-menu');
        if (!this.menuEl) return;

        this.colorsContainer = this.menuEl.querySelector('.folder-menu-colors');
        this.iconsContainer = this.menuEl.querySelector('.folder-menu-icons');

        this.renderColorOptions();
        this.renderIconOptions();

        this.menuEl.querySelectorAll('.folder-menu-action').forEach(button => {
            button.addEventListener('click', (event) => {
                const action = button.getAttribute('data-action');
                event.stopPropagation();
                this.handleAction(action);
            });
        });

        this.menuEl.addEventListener('contextmenu', (e) => e.preventDefault());

        document.addEventListener('click', (event) => {
            if (!this.menuEl.contains(event.target)) {
                this.hide();
            }
        });

        window.addEventListener('resize', () => this.hide());
        window.addEventListener('blur', () => this.hide());
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') this.hide();
        });
    },

    renderColorOptions() {
        if (!this.colorsContainer) return;
        this.colorsContainer.innerHTML = '';

        this.colors.forEach(color => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'folder-color-option';
            const value = color || '';
            button.dataset.value = value;
            if (!color) {
                button.classList.add('neutral');
                button.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.25), rgba(255,255,255,0.05))';
                button.setAttribute('data-i18n-title', 'context_change_color_default');
                const defaultTitle = LocalizationRenderer.t('context_change_color_default');
                button.title = defaultTitle.startsWith('Missing') ? '' : defaultTitle;
            } else {
                button.style.background = color;
            }
            button.addEventListener('click', (event) => {
                event.stopPropagation();
                this.applyColor(color);
            });
            this.colorsContainer.appendChild(button);
        });
    },

    renderIconOptions() {
        if (!this.iconsContainer) return;
        this.iconsContainer.innerHTML = '';

        // 1) Custom icons first
        const customIcons = Array.isArray(AppState.settings.customIcons) ? AppState.settings.customIcons : [];
        customIcons.forEach(ci => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'folder-icon-option';
            btn.dataset.value = `custom:${ci.id}`;
            btn.title = ci.name || 'Custom';
            const img = new Image();
            img.src = ci.dataUrl;
            img.width = 20; img.height = 20;
            btn.appendChild(img);
            btn.addEventListener('click', (event) => {
                event.stopPropagation();
                this.applyIcon(`custom:${ci.id}`);
            });
            this.iconsContainer.appendChild(btn);
        });

        // 2) Feather icon set
        this.icons.forEach(iconName => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'folder-icon-option';
            button.dataset.value = iconName;
            const readableTitle = iconName.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
            button.title = readableTitle;
            button.setAttribute('aria-label', readableTitle);
            if (window.feather?.icons[iconName]) {
                button.innerHTML = window.feather.icons[iconName].toSvg({ width: 20, height: 20 });
            } else {
                button.textContent = iconName.substring(0, 2).toUpperCase();
            }
            button.addEventListener('click', (event) => {
                event.stopPropagation();
                this.applyIcon(iconName);
            });
            this.iconsContainer.appendChild(button);
        });
    },

    show(event, folder) {
        if (!this.menuEl || !folder || folder.id === 'pinned') return;

        const resolvedFolder = this.getFolderById(folder.id) || folder;

        this.currentFolderId = resolvedFolder.id;
        this.highlightSelection(resolvedFolder);

        this.menuEl.classList.add('visible');
        this.menuEl.style.left = '-9999px';
        this.menuEl.style.top = '-9999px';

        requestAnimationFrame(() => {
            const rect = this.menuEl.getBoundingClientRect();
            let posX = event.clientX;
            let posY = event.clientY;

            if (posX + rect.width > window.innerWidth) {
                posX = window.innerWidth - rect.width - 8;
            }
            if (posY + rect.height > window.innerHeight) {
                posY = window.innerHeight - rect.height - 8;
            }

            this.menuEl.style.left = `${Math.max(8, posX)}px`;
            this.menuEl.style.top = `${Math.max(8, posY)}px`;
        });
    },

    hide() {
        if (!this.menuEl) return;
        this.menuEl.classList.remove('visible');
        this.currentFolderId = null;
    },

    handleAction(action) {
        if (!this.currentFolderId) return;

        if (action === 'rename') {
            const folderId = this.currentFolderId;
            this.hide();
            startFolderRename(folderId);
        } else if (action === 'delete') {
            if (this.currentFolderId !== 'pinned') {
                ipcRenderer.send('delete-folder', this.currentFolderId);
            }
            this.hide();
        }
    },

    applyColor(color) {
        if (!this.currentFolderId) return;
        const folder = this.getFolderById(this.currentFolderId);
        if (!folder) return;

        const newColor = color || null;
        if (folder.color === newColor) return;

        folder.color = newColor;
        this.highlightSelection(folder);
        this.updateFolderPreview(folder);
        ipcRenderer.send('update-folder-style', { folderId: this.currentFolderId, color: newColor });
    },

    applyIcon(iconName) {
        if (!this.currentFolderId) return;
        const folder = this.getFolderById(this.currentFolderId);
        if (!folder) return;

        if (folder.icon === iconName) return;

        folder.icon = iconName;
        this.highlightSelection(folder);
        this.updateFolderPreview(folder);
        ipcRenderer.send('update-folder-style', { folderId: this.currentFolderId, icon: iconName });
    },

    highlightSelection(folder) {
        if (!this.menuEl) return;
        const resolvedFolder = folder || (this.currentFolderId ? this.getFolderById(this.currentFolderId) : null);
        const activeColor = resolvedFolder?.color || '';
        const activeIcon = resolvedFolder?.icon || 'folder';

        this.colorsContainer?.querySelectorAll('.folder-color-option').forEach(option => {
            const value = option.dataset.value || '';
            option.classList.toggle('selected', value === activeColor);
        });

        this.iconsContainer?.querySelectorAll('.folder-icon-option').forEach(option => {
            option.classList.toggle('selected', option.dataset.value === activeIcon);
        });
    },

    updateFolderPreview(folder) {
        const resolvedFolder = folder || (this.currentFolderId ? this.getFolderById(this.currentFolderId) : null);
        if (!resolvedFolder) return;
        const folderElement = document.querySelector(`.pinned-item[data-folder-id="${resolvedFolder.id}"]`);
        if (folderElement && typeof PinnedAppsModule?.applyFolderStyles === 'function') {
            PinnedAppsModule.applyFolderStyles(folderElement, resolvedFolder.color || null, resolvedFolder.icon || 'folder');
            const iconContainer = folderElement.querySelector('.pinned-item-icon');
            const iconName = resolvedFolder.icon || 'folder';
            if (iconContainer) {
                if (String(iconName).startsWith('custom:')) {
                    const id = String(iconName).slice(7);
                    const found = (AppState.settings.customIcons || []).find(i => i.id === id);
                    if (found) {
                        iconContainer.innerHTML = `<img src="${found.dataUrl}" alt="folder" />`;
                    }
                } else if (window.feather?.icons[iconName]) {
                    iconContainer.innerHTML = window.feather.icons[iconName].toSvg();
                }
            }
        }
    },

    getFolderById(folderId) {
        if (!folderId) return null;
        const folders = Array.isArray(AppState.settings.appFolders) ? AppState.settings.appFolders : [];
        return folders.find(f => f.id === folderId) || null;
    }
};

const PinnedContextMenu = {
    menuEl: null,

    init() {
        this.menuEl = Utils.getElement('#pinned-context-menu');
        if (!this.menuEl) return;

        const createButton = this.menuEl.querySelector('[data-action="create-folder"]');
        if (createButton) {
            createButton.addEventListener('click', (event) => {
                event.preventDefault();
                this.hide();
                PinnedAppsModule.promptCreateFolder();
            });
        }

        this.menuEl.addEventListener('contextmenu', (e) => e.preventDefault());

        document.addEventListener('click', (event) => {
            if (!this.menuEl.contains(event.target)) {
                this.hide();
            }
        });

        window.addEventListener('blur', () => this.hide());
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') this.hide();
        });
    },

    show(x, y) {
        if (!this.menuEl) return;
        this.menuEl.classList.add('visible');
        this.menuEl.style.left = '-9999px';
        this.menuEl.style.top = '-9999px';

        requestAnimationFrame(() => {
            const rect = this.menuEl.getBoundingClientRect();
            let posX = x;
            let posY = y;

            if (posX + rect.width > window.innerWidth) {
                posX = window.innerWidth - rect.width - 8;
            }
            if (posY + rect.height > window.innerHeight) {
                posY = window.innerHeight - rect.height - 8;
            }

            this.menuEl.style.left = `${Math.max(8, posX)}px`;
            this.menuEl.style.top = `${Math.max(8, posY)}px`;
        });
    },

    hide() {
        if (!this.menuEl) return;
        this.menuEl.classList.remove('visible');
    }
};

// =================================================================================
// === Модуль Закрепленных Приложений (Pinned Apps Module) ===
// =================================================================================

const PinnedAppsModule = {
    currentFolderId: 'pinned',
    init: function() {
        this.setupEventListeners();
    },

    setupEventListeners: function() {
        const container = Utils.getElement('#pinned-apps-container');
        if (container) {
            container.addEventListener('contextmenu', (e) => {
                // Only show the 'Create Folder' menu if the click is on the container background
                const targetIsItem = e.target.closest('.pinned-item');
                if (!targetIsItem) {
                    e.preventDefault();
                    e.stopPropagation(); // Stop the event from bubbling up to the window's context menu listener
                    PinnedContextMenu.show(e.clientX, e.clientY);
                }
            });
        }
    },

    promptCreateFolder: function() {
        const container = Utils.getElement('#pinned-apps-container');
        if (!container) return;

        const existingInput = container.querySelector('.pinned-item-name-input');
        if (existingInput) {
            existingInput.focus();
            existingInput.select?.();
            return;
        }

        const tempItem = Utils.createElement('div', { className: 'pinned-item' });
        const iconDiv = Utils.createElement('div', { className: 'pinned-item-icon' });
        if (window.feather?.icons?.folder) {
            iconDiv.innerHTML = window.feather.icons['folder'].toSvg();
        }

        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = LocalizationRenderer.t('new_folder_default_name');
        input.className = 'pinned-item-name-input';

        tempItem.appendChild(iconDiv);
        tempItem.appendChild(input);
        container.appendChild(tempItem);

        input.focus();

        const finishCreating = (commit = true) => {
            const newName = input.value.trim();
            tempItem.remove();
            if (commit && newName) {
                ipcRenderer.send('create-folder-with-name', newName);
            }
            // Force multiple resizes after removing temp item to ensure proper layout
            requestAnimationFrame(() => {
                ViewManager.resizeWindow();
                setTimeout(() => {
                    ViewManager.resizeWindow();
                    setTimeout(() => {
                        ViewManager.resizeWindow();
                    }, 100);
                }, 50);
            });
        };

        input.addEventListener('blur', () => finishCreating(true));
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                finishCreating(true);
            } else if (e.key === 'Escape') {
                finishCreating(false);
            }
        });
    },

    render: function() {
        const container = Utils.getElement('#pinned-apps-container');
        if (!container || !AppState.settings.appFolders) return;

        PinnedContextMenu.hide();
        container.innerHTML = '';
        const fragment = document.createDocumentFragment();
        const currentFolder = AppState.settings.appFolders.find(f => f.id === this.currentFolderId);

        if (this.currentFolderId !== 'pinned' && !currentFolder) {
            this.currentFolderId = 'pinned';
            this.render();
            return;
        }

        if (this.currentFolderId === 'pinned') {
            // Render folders
            AppState.settings.appFolders.forEach(folder => {
                if (folder.id === 'pinned') return;
                const folderEl = this.createPinnedItem(folder.name, folder.icon || 'folder', () => {
                    this.currentFolderId = folder.id;
                    this.render();
                }, null, { folderId: folder.id, color: folder.color || null, icon: folder.icon || 'folder' });

                // --- D&D Target ---
                folderEl.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    folderEl.classList.add('drag-over');
                });
                folderEl.addEventListener('dragleave', () => folderEl.classList.remove('drag-over'));
                folderEl.addEventListener('drop', (e) => {
                    e.preventDefault();
                    folderEl.classList.remove('drag-over');
                    try {
                        const appData = JSON.parse(e.dataTransfer.getData('text/plain'));
                        if (appData.type === 'app') {
                            ipcRenderer.send('move-app-to-folder', {
                                appPath: appData.path,
                                sourceFolderId: appData.source,
                                targetFolderId: folder.id
                            });
                        }
                    } catch (err) { console.error('Drop failed', err); }
                });
                // --- End D&D ---

                folderEl.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    FolderContextMenu.show(e, folder);
                });
                fragment.appendChild(folderEl);
            });

            // Render pinned apps
            const pinnedFolder = AppState.settings.appFolders.find(f => f.id === 'pinned');
            if (pinnedFolder) {
                pinnedFolder.apps.forEach(app => {
                    const appEl = this.createPinnedItem(app.name, 'cpu', () => ipcRenderer.send('open-item', app.path), app.path);
                    appEl.setAttribute('data-folder-id', 'pinned'); // Add data attribute for renaming
                    appEl.addEventListener('contextmenu', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        AppContextMenu.show({ ...app, sourceFolderId: 'pinned' }, e.clientX, e.clientY);
                    });
                    fragment.appendChild(appEl);
                });
            }
        } else if (currentFolder) {
            // Render "Back" button
            const backButton = this.createPinnedItem(LocalizationRenderer.t('folder_back'), 'arrow-left', () => {
                this.currentFolderId = 'pinned';
                this.render();
            });
            fragment.appendChild(backButton);

            // Render apps in folder
            currentFolder.apps.forEach(app => {
                const appEl = this.createPinnedItem(app.name, 'cpu', () => ipcRenderer.send('open-item', app.path), app.path);
                appEl.setAttribute('data-folder-id', this.currentFolderId); // Add data attribute for renaming
                appEl.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    AppContextMenu.show({ ...app, sourceFolderId: this.currentFolderId }, e.clientX, e.clientY);
                });
                fragment.appendChild(appEl);
            });
        }
        
        container.appendChild(fragment);
        // Force layout recalculation
        void container.offsetHeight;
        SearchModule.loadIconsForResults();
        // Recalculate window size after render with delays to ensure DOM updates
        requestAnimationFrame(() => {
            ViewManager.resizeWindow();
            setTimeout(() => {
                ViewManager.resizeWindow();
            }, 100);
        });
    },

    createPinnedItem: function(name, iconName, onClick, path = null, options = {}) {
        const item = Utils.createElement('div', { className: 'pinned-item' });

        if (options.folderId) {
            item.classList.add('pinned-item-folder');
            item.setAttribute('data-folder-id', options.folderId);
            this.applyFolderStyles(item, options.color || null, options.icon || iconName);
        }

        // === УЛУЧШЕНО: Визуальная обратная связь при клике ===
        item.addEventListener('click', (e) => {
            item.style.transform = 'scale(0.9)';
            item.style.opacity = '0.7';
            item.style.transition = 'all 0.1s ease';
            onClick(e);
            // Remove focus to prevent stuck state
            item.blur();
            // Reset styles after animation
            setTimeout(() => {
                item.style.transform = '';
                item.style.opacity = '';
                item.style.transition = '';
            }, 150);
        });

        // --- D&D Source ---
        if (path) {
            item.draggable = true;
            item.addEventListener('dragstart', (e) => {
                const appData = { name, path, type: 'app', source: this.currentFolderId };
                e.dataTransfer.setData('text/plain', JSON.stringify(appData));
                setTimeout(() => item.classList.add('dragging'), 0);
            });
            item.addEventListener('dragend', () => item.classList.remove('dragging'));
        }
        // --- End D&D ---

        const icon = document.createElement(path ? 'img' : 'div');
        icon.className = 'pinned-item-icon';
        if (path) {
            const cachedSrc = AppState.iconCache.get(path);
            const fallbackIcon = AppIconFallbacks.get(name, path);
            const src = (cachedSrc && typeof cachedSrc === 'string' && cachedSrc.startsWith('data:image'))
                        ? cachedSrc
                        : (fallbackIcon || SearchModule.getFallbackIconDataUrl('cpu'));
            // Apply custom override if present
            const overrideId = AppState.settings?.appIconOverrides?.[path];
            if (overrideId) {
                const found = (AppState.settings.customIcons || []).find(i => i.id === overrideId);
                if (found) {
                    icon.src = found.dataUrl;
                } else {
                    icon.src = src;
                }
            } else {
                icon.src = src;
            }
            icon.setAttribute('data-path', path);
            icon.setAttribute('data-app-name', name);
            icon.classList.add('app-icon');
            if (!cachedSrc && fallbackIcon && src === fallbackIcon) {
                AppState.iconCache.set(path, fallbackIcon);
            }
        } else {
            const folderIconName = options.icon || iconName;
            icon.innerHTML = window.feather.icons[folderIconName] ? window.feather.icons[folderIconName].toSvg() : (window.feather.icons[iconName]?.toSvg() || '');
        }

        const nameEl = Utils.createElement('div', { className: 'pinned-item-name' });
        nameEl.textContent = name.replace(/\.(lnk|exe)$/i, '');
        
        item.appendChild(icon);
        item.appendChild(nameEl);
        return item;
    },

    applyFolderStyles(item, color, iconName) {
        if (!item) return;
        if (color) {
            const bg = Utils.hexToRgba(color, 0.18);
            const border = Utils.hexToRgba(color, 0.45);
            item.style.setProperty('--folder-accent-bg', bg || '');
            item.style.setProperty('--folder-accent-border', border || '');
            item.style.setProperty('--folder-accent-color', color);
        } else {
            item.style.removeProperty('--folder-accent-bg');
            item.style.removeProperty('--folder-accent-border');
            item.style.removeProperty('--folder-accent-color');
        }
        if (iconName && !item.querySelector('.pinned-item-icon img')) {
            const iconContainer = item.querySelector('.pinned-item-icon');
            if (iconContainer) {
                if (String(iconName).startsWith('custom:')) {
                    const id = String(iconName).slice(7);
                    const found = (AppState.settings.customIcons || []).find(i => i.id === id);
                    if (found) {
                        iconContainer.innerHTML = `<img src="${found.dataUrl}" alt="folder" />`;
                    }
                } else if (window.feather?.icons[iconName]) {
                    iconContainer.innerHTML = window.feather.icons[iconName].toSvg();
                }
            }
        }
    }
};

// CSS for animations
const style = document.createElement('style');
style.textContent = `
@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
}
`;
document.head.appendChild(style);

// Hide second layer square
if (QuickActionLab?.elements?.nodeLayer) {
    QuickActionLab.elements.nodeLayer.style.display = 'none';
}

// =================================================================================
// === Менеджер Видов и Анимаций (View Manager) ===
// =================================================================================

const AuxPanelManager = {
    currentPanel: null,
    
    init: function() {
        this.panelContainer = Utils.getElement('#aux-panel');
        Utils.getAllElements('#action-buttons [data-window-type]').forEach(button => {
            button.addEventListener('click', () => {
                const type = button.getAttribute('data-window-type');
                this.togglePanel(type);
            });
        });
        ipcRenderer.on('update-data', this.updateDataListener);
    },

    togglePanel: function(type) {
        // ИСПРАВЛЕНИЕ БАГА: Всегда сбрасываем preventClose при переключении панелей
        ipcRenderer.send('set-prevent-close', false);
        
        if (this.currentPanel === type) {
            this.closePanel();
        } else {
            this.openPanel(type);
        }
    },

    openPanel: async function(type) {
        // ИСПРАВЛЕНИЕ БАГА: Всегда сбрасываем preventClose при переключении панелей
        ipcRenderer.send('set-prevent-close', false);
        
        // If search results are visible, hide them before opening a panel.
        const resultsArea = Utils.getElement('#results-area');
        if (resultsArea.classList.contains('visible')) {
            ViewManager.animateHide(resultsArea);
        }

        this.currentPanel = type;
        
        try {
            const response = await fetch(`${type}.html`);
            if (!response.ok) throw new Error(`Failed to load ${type}.html`);
            const html = await response.text();
            
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const content = doc.body.innerHTML;

            this.panelContainer.innerHTML = content;
            
            // НОВОЕ: Для библиотеки приложений используем apps-library-wrapper
            const auxContainer = this.panelContainer.querySelector('#aux-container');
            const appsLibraryWrapper = this.panelContainer.querySelector('#apps-library-wrapper');
            
            // Apply animation class based on settings
            if (AppState.settings.animations && AppState.settings.resultsAnimationStyle) {
                if (auxContainer) {
                    auxContainer.classList.add('results-anim-' + AppState.settings.resultsAnimationStyle);
                }
                if (appsLibraryWrapper) {
                    appsLibraryWrapper.classList.add('results-anim-' + AppState.settings.resultsAnimationStyle);
                }
            }

            if (auxContainer) {
                ViewManager.prepareForShow(auxContainer);
            }
            if (appsLibraryWrapper) {
                ViewManager.prepareForShow(appsLibraryWrapper);
            }
            
            this.panelContainer.classList.add('visible');

            if (type === 'apps-library') {
                if (appsLibraryWrapper) {
                    appsLibraryWrapper.classList.add('state-loading');
                    appsLibraryWrapper.classList.remove('state-empty');
                }
                ViewManager.resizeWindow();
            }
            
            // ОПТИМИЗАЦИЯ: Используем requestAnimationFrame для более плавной анимации
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    if (auxContainer) auxContainer.classList.add('visible');
                    if (appsLibraryWrapper) appsLibraryWrapper.classList.add('visible');
                });
            });
            
            ViewManager.animateHide(Utils.getElement('#pinned-apps-container'));
            
            this.executePanelLogic(type);
            
            setTimeout(() => {
                if (type !== 'apps-library') {
                    ViewManager.resizeWindow();
                }
            }, 50);
        } catch (error) {
            console.error(`[AuxPanelManager] Error opening panel:`, error);
            this.closePanel();
        }
    },

    closePanel: function(showPinnedApps = true) {
        // ИСПРАВЛЕНИЕ БАГА: Сбрасываем preventClose при закрытии панели
        ipcRenderer.send('set-prevent-close', false);

        this.currentPanel = null;

        const finalizeClose = () => {
            this.panelContainer.innerHTML = '';
            this.panelContainer.classList.remove('visible');

            const hasSearchQuery = Utils.getElement('#search-input').value.trim().length > 1;

            if (hasSearchQuery && AppState.searchResults.length > 0) {
                const resultsArea = Utils.getElement('#results-area');
                ViewManager.prepareForShow(resultsArea);
                resultsArea?.classList.add('visible');
            } else if (showPinnedApps && !hasSearchQuery && AppState.settings.enablePinnedApps) {
                const pinnedApps = Utils.getElement('#pinned-apps-container');
                ViewManager.prepareForShow(pinnedApps);
                pinnedApps?.classList.add('visible');
            }

            setTimeout(() => ViewManager.resizeWindow(), 50);
        };

        const animatedElements = Array.from(this.panelContainer.querySelectorAll('#aux-container, #apps-library-wrapper'));

        if (AppState.settings.animations && animatedElements.length > 0) {
            let completed = 0;
            let finished = false;
            const listeners = new Map();

            const safeFinalize = () => {
                if (finished) return;
                finished = true;
                listeners.forEach((listener, el) => el.removeEventListener('transitionend', listener));
                finalizeClose();
            };

            animatedElements.forEach((element) => {
                const handleTransitionEnd = (event) => {
                    if (event.target !== element) return;
                    element.removeEventListener('transitionend', handleTransitionEnd);
                    completed += 1;
                    if (completed === animatedElements.length) {
                        safeFinalize();
                    }
                };

                element.addEventListener('transitionend', handleTransitionEnd);
                listeners.set(element, handleTransitionEnd);

                requestAnimationFrame(() => {
                    element.classList.add('closing');
                    element.classList.remove('visible');
                });
            });

            // Страховка на случай отсутствия transitionend
            setTimeout(safeFinalize, 400);
        } else {
            finalizeClose();
        }
    },
    
    executePanelLogic: function(type) {
        const titleElement = this.panelContainer.querySelector('h2[data-i18n]');
        if (titleElement) {
            titleElement.textContent = LocalizationRenderer.t(titleElement.getAttribute('data-i18n'));
        }
        
        if (window.feather) {
            window.feather.replace();
        }
        
        // НОВОЕ: Специальная обработка для библиотеки приложений
        if (type === 'apps-library') {
            this.loadAppsLibrary();
        } else {
            ipcRenderer.send('aux-panel-ready-for-data', type);
        }
    },

    // НОВОЕ: Загрузка библиотеки приложений с категоризацией
    loadAppsLibrary: async function() {
        try {
            const wrapper = this.panelContainer.querySelector('#apps-library-wrapper');
            const content = this.panelContainer.querySelector('#apps-library-content');
            if (!content) return;

            if (wrapper) {
                wrapper.classList.remove('state-empty');
                wrapper.classList.add('state-loading');
            }

            content.innerHTML = '';

            const allApps = await ipcRenderer.invoke('get-all-apps');
            const categories = this.categorizeApps(allApps);
            const sortedCategories = Object.entries(categories).sort(([, a], [, b]) => b.length - a.length);
            let categoriesToLoad = sortedCategories.filter(([, apps]) => apps.length > 0).length;

            if (categoriesToLoad === 0) {
                if (wrapper) {
                    wrapper.classList.remove('state-loading');
                    wrapper.classList.add('state-empty');
                }
                ViewManager.resizeWindow();
                return;
            }

            const onCategoryLoaded = () => {
                categoriesToLoad--;
                if (categoriesToLoad === 0) {
                    if (wrapper) {
                        wrapper.classList.remove('state-loading');
                    }
                    requestAnimationFrame(() => {
                        ViewManager.resizeWindow();
                    });
                }
            };

            const fragment = document.createDocumentFragment();
            sortedCategories.forEach(([categoryName, apps]) => {
                if (apps.length > 0) {
                    const categoryEl = this.createCategoryElement(categoryName, apps, onCategoryLoaded);
                    fragment.appendChild(categoryEl);
                }
            });
            content.appendChild(fragment);

            requestAnimationFrame(() => ViewManager.resizeWindow());
            SearchModule.loadIconsForResults();
        } catch (error) {
            console.error('[AppsLibrary] Error loading apps:', error);
        }
    },
    
    // НОВОЕ: Оптимизированный дебаунсинг для resizeWindow при загрузке иконок
    debouncedResizeForAppsLibrary: function() {
        // Используем requestAnimationFrame для более плавных обновлений
        requestAnimationFrame(() => {
            ViewManager.resizeWindow();
            
            // Дополнительные пересчеты только если необходимо
            requestAnimationFrame(() => {
                ViewManager.resizeWindow();
            });
        });
    },

    // НОВОЕ: Категоризация приложений по ключевым словам
    categorizeApps: function(apps) {
        const categories = {
            'Productivity': [],
            'Development': [],
            'Creative': [],
            'Communication': [],
            'Media': [],
            'Utilities': [],
            'Games': [],
            'Other': []
        };

        // УЛУЧШЕНО: Расширенный черный список системных/служебных приложений
        const systemAppBlacklist = [
            'uninstall', 'unins', 'uninst', 'setup', 'installer', 'activator',
            'updater', 'update', 'register', 'readme', 'license', 'eula',
            'diagnostic', 'troubleshoot', 'repair', 'recover', 'fix',
            'registry', 'regedit', 'msconfig', 'dxdiag', 'diskpart',
            'component', 'service', 'helper', 'agent', 'daemon', 'background',
            'launcher', 'bootstrapper', 'crash', 'reporter', 'feedback',
            'telemetry', 'analytics', 'log', 'viewer', 'debugger', 'profiler',
            'packager', 'manifest', 'config', 'settings manager',
            'driver', 'codec', 'runtime', 'redistributable', 'framework',
            'migration', 'cleanup', 'maintenance', 'optimization',
            'iscsi', 'odbc', 'memory diagnostic', 'recoverydr', 'ahk2exe',
            'nsight', 'nvidia nsight', // NVIDIA инструменты разработчика
            'foxit pdf reader activator', 'автоматическое обновление',
            'удалить', 'деинсталл', 'сброс', 'восстановление'
        ];

        const categoryKeywords = {
            'Productivity': ['office', 'word', 'excel', 'powerpoint', 'onenote', 'outlook', 'notes', 'calendar', 'todo', 'task', 'project', 'planner', 'notion', 'evernote', 'trello', 'asana', 'monday', 'airtable'],
            'Development': ['visual studio', 'code', 'git', 'github', 'python', 'node', 'java', 'android studio', 'xcode', 'unity', 'unreal', 'terminal', 'cmd', 'powershell', 'docker', 'vmware', 'virtualbox', 'windowsterminal', 'postman', 'insomnia', 'mysql', 'mongodb', 'postgres', 'redis'],
            'Creative': ['photoshop', 'illustrator', 'premiere', 'after effects', 'lightroom', 'indesign', 'figma', 'sketch', 'canva', 'blender', 'cinema 4d', 'davinci', 'gimp', 'inkscape', 'paint.net', 'krita', 'affinity', 'clipchamp', 'audition'],
            'Communication': ['teams', 'zoom', 'skype', 'discord', 'slack', 'telegram', 'whatsapp', 'messenger', 'mail', 'outlook', 'thunderbird', 'whatsappdesktop', 'signal', 'viber', 'line'],
            'Media': ['spotify', 'itunes', 'vlc', 'media player', 'youtube', 'netflix', 'twitch', 'obs', 'audacity', 'music', 'video', 'photos', 'movies', 'groove', 'foobar', 'winamp', 'aimp', 'musicbee', 'plex', 'kodi'],
            'Utilities': ['winrar', '7-zip', 'notepad++', 'sublime', 'atom', 'calculator', 'cleaner', 'ccleaner', 'antivirus', 'kaspersky', 'avast', 'malwarebytes', 'backup', 'acronis', 'windowscalculator', 'snipping', 'camera', 'voicerecorder', 'sharex', 'greenshot', 'everything', 'listary'],
            'Games': ['steam', 'epic', 'origin', 'uplay', 'battle.net', 'gog', 'minecraft', 'roblox', 'league of legends', 'valorant', 'fortnite', 'dota', 'counter-strike', 'gta', 'xbox', 'solitaire', 'robloxplayer', 'gameloop']
        };

        // УЛУЧШЕНО: Фильтруем системные приложения
        let filteredApps = apps.filter(app => {
            const appName = app.name.toLowerCase();
            const appPath = (app.path || '').toLowerCase();

            // Исключаем приложения из черного списка
            if (systemAppBlacklist.some(keyword => appName.includes(keyword) || appPath.includes(keyword))) {
                return false;
            }
            
            // Исключаем приложения из системных папок Windows (кроме известных приложений)
            const isSystemPath = appPath.includes('\\windows\\') || 
                                 appPath.includes('\\system32\\') ||
                                 appPath.includes('\\syswow64\\');
            
            if (isSystemPath) {
                // Разрешаем только известные системные утилиты
                const allowedSystemApps = ['notepad', 'calculator', 'paint', 'cmd', 'powershell', 'windowsterminal'];
                return allowedSystemApps.some(allowed => appName.includes(allowed));
            }
            
            return true;
        });

        if (AppState.settings.appsLibraryBasicOnly !== false) {
            const advancedAppKeywords = [
                'furmark', 'gpu-z', 'gpuz', 'gpushark', 'cpuburner', 'occt', 'stress test', 'benchmark', 'profiler',
                'diagnostic', 'burner', 'shadercache', 'minidump', 'debug', 'telemetry', 'git', 'mingw', 'p11-kit', 'gnupg', 'awk',
                'bonjour', 'diskspd', 'prebuilt', 'mpiexec'
            ];
            const advancedPathPatterns = [
                '\\git\\usr\\', '\\git\\mingw64\\', '\\git\\bin\\', '\\program files\\git\\', '\\geeks3d\\', '\\furmark',
                '\\gpushark', '\\gpuz', '\\cpuburner', '\\nsight', '\\debug\\', '\\diagnostic', '\\p11-kit\\', '\\gnupg\\',
                '\\awk\\', '\\tar\\', '\\appdata\\local\\programs\\python\\', '\\appdata\\local\\temp\\',
                '\\appdata\\local\\roblox\\'
            ];

            filteredApps = filteredApps.filter(app => {
                const name = app.name.toLowerCase();
                const appPath = (app.path || '').toLowerCase();
                if (advancedAppKeywords.some(keyword => name.includes(keyword))) {
                    return false;
                }
                if (advancedPathPatterns.some(pattern => appPath.includes(pattern))) {
                    return false;
                }
                if (AuxPanelManager.shouldExcludeAppFromLibrary(app)) {
                    return false;
                }
                return true;
            });
        }

        filteredApps.forEach(app => {
            const appName = app.name.toLowerCase();
            let categorized = false;

            for (const [category, keywords] of Object.entries(categoryKeywords)) {
                if (keywords.some(keyword => appName.includes(keyword))) {
                    categories[category].push(app);
                    categorized = true;
                    break;
                }
            }

            if (!categorized) {
                categories['Other'].push(app);
            }
        });

        return categories;
    },

    shouldExcludeAppFromLibrary: function(app) {
        if (!app) return false;

        const rawName = String(app.name || '');
        const normalizedName = rawName.replace(/\.(lnk|exe)$/i, '').trim();
        if (!normalizedName) return true;

        const lowerName = normalizedName.toLowerCase();
        const compactName = lowerName.replace(/[\s._-]/g, '');
        const path = String(app.path || '').toLowerCase();

        if (/^[0-9]+(\.[0-9]+)*$/.test(compactName)) return true;
        if (/^v[0-9]+(\.[0-9]+)*$/.test(compactName)) return true;
        if (/^[0-9a-f]{6,}$/.test(compactName)) return true;

        if (/^[\[\]{}()!]+$/.test(compactName)) return true;

        const keepKeywords = ['roblox'];
        if (keepKeywords.some(keyword => lowerName.includes(keyword))) {
            return false;
        }

        const noiseKeywords = [
            'required', 'dynamic', 'module', 'resource', 'compatibility', 'legacy',
            'system tray', 'integration', 'mpiexec', 'prebuilt', 'bonjour', 'diskspd',
            'telemetry', 'diagnostic', 'benchmark', 'burner', 'helper', 'support',
            'documentation', 'license', 'readme', 'eula', 'sample', 'demo', 'test',
            'runtime', 'redistributable', 'vc runtime', 'vc_redist', 'client service'
        ];
        if (noiseKeywords.some(keyword => lowerName.includes(keyword))) {
            return true;
        }

        if (path.includes('\\roblox\\') && !lowerName.includes('roblox')) {
            return true;
        }

        if (path.includes('\\roblox\\') && lowerName === 'client') {
            return true;
        }

        const pathNoise = [
            '\\appdata\\local\\temp\\',
            '\\visual studio\\installer\\',
            '\\microsoft\\edgewebview\\'
        ];
        if (pathNoise.some(pattern => path.includes(pattern))) {
            return true;
        }

        return false;
    },

    // НОВОЕ: Создание элемента категории
    createCategoryElement: function(categoryName, apps, onLoadedCallback) {
        const categoryDiv = Utils.createElement('div', { className: 'app-category loading' });

        const header = Utils.createElement('div', { className: 'category-header' });
        const title = Utils.createElement('div', {
            className: 'category-title',
            text: LocalizationRenderer.t(`category_${categoryName.toLowerCase()}`) || categoryName
        });
        const count = Utils.createElement('div', {
            className: 'category-count',
            text: apps.length.toString()
        });
        header.appendChild(title);
        header.appendChild(count);
        
        const grid = Utils.createElement('div', { className: 'category-apps-grid' });
        
        let loadedIcons = 0;
        const totalApps = apps.length;
        
        const checkAllLoaded = () => {
            if (loadedIcons >= totalApps) {
                categoryDiv.classList.remove('loading');
                if (onLoadedCallback) {
                    onLoadedCallback();
                }
            }
        };

        if (totalApps === 0) {
            checkAllLoaded();
            return categoryDiv;
        }

        apps.forEach((app, index) => {
            const appItem = Utils.createElement('div', { className: 'category-app-item' });

            const icon = document.createElement('img');
            icon.className = 'category-app-icon app-icon';
            icon.setAttribute('data-path', app.path);
            icon.setAttribute('data-app-name', app.name);
            const cachedSrc = AppState.iconCache.get(app.path);
            const fallbackIcon = AppIconFallbacks.get(app.name, app.path);
            const forceFallback = AppIconFallbacks.shouldForceFallback(app.name, app.path);
            let initialSrc = (cachedSrc && typeof cachedSrc === 'string' && cachedSrc.startsWith('data:image'))
                        ? cachedSrc
                        : (fallbackIcon || SearchModule.getFallbackIconDataUrl('cpu'));

            if (forceFallback && fallbackIcon) {
                initialSrc = fallbackIcon;
                if (AppState.iconCache.get(app.path) !== fallbackIcon) {
                    AppState.iconCache.set(app.path, fallbackIcon);
                }
            }

            icon.src = initialSrc;
            
            const onIconLoad = () => {
                loadedIcons++;
                requestAnimationFrame(() => {
                    setTimeout(() => {
                        appItem.classList.add('loaded');
                    }, Math.min(index * 30, 600));
                });
                checkAllLoaded();
                icon.onload = null;
                icon.onerror = null;
            };
            
            icon.onload = onIconLoad;
            icon.onerror = onIconLoad;
            
            const name = Utils.createElement('div', { 
                className: 'category-app-name',
                text: app.name.replace(/\.(lnk|exe)$/i, '')
            });
            
            appItem.appendChild(icon);
            appItem.appendChild(name);
            
            appItem.addEventListener('click', () => {
                appItem.style.transform = 'scale(0.9)';
                appItem.style.opacity = '0.7';
                ipcRenderer.send('set-prevent-close', false);
                ipcRenderer.send('open-item', app.path);
            });
            
            grid.appendChild(appItem);
        });
        
        categoryDiv.appendChild(header);
        categoryDiv.appendChild(grid);
        
        return categoryDiv;
    },

    updateDataListener: (event, data) => {
        const self = AuxPanelManager;
        const type = self.currentPanel;
        if (!type) return;

        const listElement = self.panelContainer.querySelector('#data-list');
        if (!listElement) return;

        listElement.innerHTML = '';
        const fragment = document.createDocumentFragment();
        
        let items = [];
        if (type === 'clipboard') {
            const limit = SettingsModule.getClipboardLimit();
            let sourceItems = Array.isArray(data) ? data.slice() : [];
            if (Number.isFinite(limit) && sourceItems.length > limit) {
                sourceItems = sourceItems.slice(-limit);
            }
            items = sourceItems.map(item => ({
                primary: item.content.length > 100 ? item.content.substring(0, 100) + '...' : item.content,
                secondary: new Date(item.timestamp).toLocaleString(),
                icon: 'clipboard',
                action: () => ipcRenderer.send('copy-to-clipboard', item.content)
            }));
        } else if (type === 'files') {
            items = data.map(item => ({
                primary: item.name,
                secondary: item.path,
                icon: item.type === 'directory' ? 'folder' : 'file-text',
                action: () => ipcRenderer.send('open-item', item.path)
            }));
            // Сортируем файлы по имени (кроме случаев, когда уже переданы отсортированными)
            items.sort((a, b) => a.primary.localeCompare(b.primary));
        } else if (type === 'commands') {
            items = data.map(item => ({
                primary: item.name,
                secondary: item.type === 'system' ? 'System Command' : `Keyword: ${item.keyword}`,
                icon: 'command',
                action: () => ipcRenderer.send('execute-command', item.id)
            }));
            // Алфавитная сортировка команд
            items.sort((a, b) => a.primary.localeCompare(b.primary));
        }

        items.forEach(itemData => {
            const li = document.createElement('li');
            li.className = 'list-item';
            li.innerHTML = `
                <div class="item-icon">${window.feather.icons[itemData.icon].toSvg()}</div>
                <div class="item-content">
                    <div class="item-primary">${Utils.escapeHtml(itemData.primary)}</div>
                    <div class="item-secondary">${Utils.escapeHtml(itemData.secondary)}</div>
                </div>
            `;
            li.addEventListener('click', itemData.action);
            fragment.appendChild(li);
        });

        if (type === 'clipboard') {
            const limit = SettingsModule.getClipboardLimit();
            if (Number.isFinite(limit) && Array.isArray(data) && data.length > limit) {
                const note = document.createElement('li');
                note.className = 'list-item note';
                note.textContent = LocalizationRenderer.t('subscription_clipboard_limit_note', limit);
                fragment.appendChild(note);
            }
        }

        listElement.appendChild(fragment);

        // Staggered animation for list items
        Array.from(listElement.children).forEach((child, index) => {
            setTimeout(() => {
                child.classList.add('visible');
            }, index * 40);
        });
    },

    cleanup: function() {
        ipcRenderer.removeListener('update-data', this.updateDataListener);
    }
};

const CustomSelect = {
    init: function() {
        document.addEventListener('click', this.closeAllSelects);
        Utils.getAllElements('.custom-select-wrapper').forEach(wrapper => {
            this.setupSelect(wrapper);
        });
    },

    setupSelect: function(wrapper) {
        const trigger = wrapper.querySelector('.custom-select-trigger');
        const options = wrapper.querySelectorAll('.custom-option');
        const settingKey = wrapper.dataset.settingKey;

        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = wrapper.classList.contains('open');
            this.closeAllSelects();
            if (!isOpen) {
                wrapper.classList.add('open');
            }
        });

        options.forEach(option => {
            option.addEventListener('click', () => {
                const selectedValue = option.dataset.value;
                const selectedText = option.querySelector('span').textContent;

                trigger.querySelector('span').textContent = selectedText;
                wrapper.querySelector('.custom-option.selected')?.classList.remove('selected');
                option.classList.add('selected');

                if (settingKey && selectedValue !== AppState.settings[settingKey]) {
                    ipcRenderer.send('update-setting', settingKey, selectedValue);
                }
            });
        });
    },

    closeAllSelects: function(e) {
        Utils.getAllElements('.custom-select-wrapper.open').forEach(wrapper => {
            if (e && wrapper.contains(e.target)) {
                return;
            }
            wrapper.classList.remove('open');
        });
    },

    setValue: function(wrapperId, value) {
        const wrapper = Utils.getElement(`#${wrapperId}`);
        if (!wrapper) return;

        const trigger = wrapper.querySelector('.custom-select-trigger');
        const options = wrapper.querySelectorAll('.custom-option');
        
        wrapper.querySelector('.custom-option.selected')?.classList.remove('selected');

        let found = false;
        options.forEach(option => {
            if (option.dataset.value === value) {
                trigger.querySelector('span').textContent = option.querySelector('span').textContent;
                option.classList.add('selected');
                found = true;
            }
        });

        if (!found && options.length > 0) {
            trigger.querySelector('span').textContent = options[0].querySelector('span').textContent;
            options[0].classList.add('selected');
        }
    },

    refreshDisplay: function(wrapper) {
        if (!wrapper) return;
        const triggerSpan = wrapper.querySelector('.custom-select-trigger span');
        const selectedOption = wrapper.querySelector('.custom-option.selected span');
        if (triggerSpan && selectedOption) {
            triggerSpan.textContent = selectedOption.textContent;
        }
    },

    refreshAll: function() {
        Utils.getAllElements('.custom-select-wrapper').forEach(wrapper => this.refreshDisplay(wrapper));
    }
};

// Global custom alert function
const customAlert = (message) => {
    return new Promise((resolve) => {
        const dialog = document.getElementById('global-alert-dialog');
        const messageEl = document.getElementById('global-alert-message');
        const okBtn = document.getElementById('global-alert-ok');
        
        if (!dialog || !messageEl || !okBtn) {
            console.warn('Alert dialog elements not found, using fallback');
            alert(message);
            resolve();
            return;
        }

        messageEl.textContent = message;
        dialog.setAttribute('aria-hidden', 'false');
        
        // Refresh feather icons
        if (window.feather) {
            feather.replace();
        }

        const cleanup = () => {
            dialog.setAttribute('aria-hidden', 'true');
            okBtn.removeEventListener('click', handleOk);
            dialog.removeEventListener('click', handleBackdrop);
            document.removeEventListener('keydown', handleEscape);
        };

        const handleOk = () => {
            cleanup();
            resolve();
        };

        const handleBackdrop = (event) => {
            if (event.target.classList.contains('global-alert-backdrop')) {
                cleanup();
                resolve();
            }
        };

        const handleEscape = (event) => {
            if (event.key === 'Escape' || event.key === 'Enter') {
                cleanup();
                resolve();
            }
        };

        okBtn.addEventListener('click', handleOk);
        dialog.addEventListener('click', handleBackdrop);
        document.addEventListener('keydown', handleEscape);
    });
};

// Custom Context Menu Manager
const CustomContextMenu = {
    element: null,
    
    init() {
        this.element = document.getElementById('custom-context-menu');
        if (!this.element) return;
        
        // Hide "Run as admin" on non-Windows platforms
        const runAdminBtn = this.element.querySelector('[data-action="run-admin"]');
        if (runAdminBtn && process.platform !== 'win32') {
            runAdminBtn.style.display = 'none';
            // Also hide the divider before it if it's the only item in that section
            const prevDiv = runAdminBtn.previousElementSibling;
            if (prevDiv?.classList.contains('custom-context-divider')) {
                const prevItem = prevDiv.previousElementSibling;
                if (prevItem?.getAttribute('data-action') === 'open-location') {
                    prevDiv.style.display = 'none';
                }
            }
        }
        
        // Setup click handlers
        this.element.querySelectorAll('.custom-context-item').forEach(item => {
            item.addEventListener('click', () => {
                const action = item.getAttribute('data-action');
                this.handleAction(action);
                this.hide();
            });
        });
        
        // Hide on click outside
        document.addEventListener('click', (e) => {
            if (this.element && !this.element.contains(e.target)) {
                this.hide();
            }
        });
        
        // Hide on Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.element?.getAttribute('aria-hidden') === 'false') {
                this.hide();
            }
        });
    },
    
    show(event) {
        if (!this.element) return;
        
        const x = event.clientX;
        const y = event.clientY;
        
        this.element.style.left = `${x}px`;
        this.element.style.top = `${y}px`;
        this.element.setAttribute('aria-hidden', 'false');
        
        // Refresh feather icons
        if (window.feather) {
            feather.replace();
        }
        
        // Adjust position if menu goes off screen
        requestAnimationFrame(() => {
            const rect = this.element.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            
            if (rect.right > viewportWidth) {
                this.element.style.left = `${viewportWidth - rect.width - 10}px`;
            }
            if (rect.bottom > viewportHeight) {
                this.element.style.top = `${viewportHeight - rect.height - 10}px`;
            }
        });
    },
    
    hide() {
        if (this.element) {
            this.element.setAttribute('aria-hidden', 'true');
        }
    },
    
    handleAction(action) {
        switch (action) {
            case 'settings':
                ViewManager.switchView('settings');
                break;
            case 'open-location':
                ipcRenderer.send('open-app-location');
                break;
            case 'run-admin':
                ipcRenderer.send('relaunch-as-admin');
                break;
            case 'quit':
                ipcRenderer.send('quit-app');
                break;
        }
    }
};

// App-specific context menu (HTML, glass styled)
const AppContextMenu = {
    el: null,
    currentApp: null,
    init() {
        this.el = document.getElementById('app-context-menu');
        if (!this.el) return;
        document.addEventListener('click', (e) => {
            if (!this.el.contains(e.target)) this.hide();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.hide();
        });
        window.addEventListener('blur', () => this.hide());
        this.el.addEventListener('contextmenu', (e) => e.preventDefault());
    },
    isPinned(path) {
        try {
            const pinnedFolder = (AppState.settings?.appFolders || []).find(f => f.id === 'pinned');
            return !!pinnedFolder?.apps?.some(a => a.path === path);
        } catch { return false; }
    },
    renderItems() {
        if (!this.el || !this.currentApp) return;
        const t = (k) => LocalizationRenderer.t(k) || k;
        const items = [];
        const pinned = this.isPinned(this.currentApp.path);
        if (pinned) {
            items.push({ action: 'unpin', label: t('context_unpin_app'), danger: true });
        } else {
            items.push({ action: 'pin', label: t('context_add_to_apps') });
        }
        if (this.currentApp.sourceFolderId && this.currentApp.sourceFolderId !== 'pinned') {
            items.push({ action: 'remove-from-folder', label: t('context_remove_from_folder'), danger: true });
        }
        items.push({ divider: true });
        items.push({ action: 'open-location', label: t('context_open_location') });

        // Build DOM
        this.el.innerHTML = '';
        items.forEach(item => {
            if (item.divider) {
                const div = document.createElement('div');
                div.className = 'app-context-divider';
                this.el.appendChild(div);
                return;
            }
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'app-context-item' + (item.danger ? ' danger' : '');
            btn.textContent = item.label;
            btn.setAttribute('data-action', item.action);
            btn.addEventListener('click', () => {
                this.handleAction(item.action);
                this.hide();
            });
            this.el.appendChild(btn);
        });

        // Custom icons picker inline
        const customIcons = Array.isArray(AppState.settings.customIcons) ? AppState.settings.customIcons : [];
        if (customIcons.length && this.currentApp.path) {
            const div = document.createElement('div');
            div.className = 'app-context-custom-icons';
            customIcons.forEach(ci => {
                const b = document.createElement('button');
                b.type = 'button';
                b.className = 'app-context-icon-btn';
                const img = new Image(); img.src = ci.dataUrl; b.appendChild(img);
                b.addEventListener('click', () => {
                    const map = { ...(AppState.settings.appIconOverrides || {}) };
                    map[this.currentApp.path] = ci.id;
                    AppState.settings.appIconOverrides = map;
                    ipcRenderer.send('update-setting', 'appIconOverrides', map);
                    PinnedAppsModule.render?.();
                    this.hide();
                });
                div.appendChild(b);
            });
            this.el.appendChild(document.createElement('div')).className = 'app-context-divider';
            this.el.appendChild(div);
            const reset = document.createElement('button');
            reset.type = 'button';
            reset.className = 'app-context-item';
            reset.textContent = t('settings_remove') || 'Сбросить иконку';
            reset.addEventListener('click', () => {
                const map = { ...(AppState.settings.appIconOverrides || {}) };
                delete map[this.currentApp.path];
                AppState.settings.appIconOverrides = map;
                ipcRenderer.send('update-setting', 'appIconOverrides', map);
                PinnedAppsModule.render?.();
                this.hide();
            });
            this.el.appendChild(reset);
        }
    },
    show(appData, x, y) {
        if (!this.el) return;
        this.currentApp = appData;
        this.renderItems();
        this.el.setAttribute('aria-hidden', 'false');
        this.el.style.left = '-9999px';
        this.el.style.top = '-9999px';
        requestAnimationFrame(() => {
            const rect = this.el.getBoundingClientRect();
            let posX = x, posY = y;
            if (posX + rect.width > window.innerWidth) posX = window.innerWidth - rect.width - 8;
            if (posY + rect.height > window.innerHeight) posY = window.innerHeight - rect.height - 8;
            this.el.style.left = `${Math.max(8, posX)}px`;
            this.el.style.top = `${Math.max(8, posY)}px`;
        });
    },
    hide() {
        if (!this.el) return;
        this.el.setAttribute('aria-hidden', 'true');
    },
    handleAction(action) {
        if (!this.currentApp) return;
        const path = this.currentApp.path;
        if (!path) return;
        const folders = Array.isArray(AppState.settings?.appFolders) ? [...AppState.settings.appFolders] : [];
        const pinnedIndex = folders.findIndex(f => f.id === 'pinned');
        switch (action) {
            case 'pin': {
                if (pinnedIndex !== -1 && !folders[pinnedIndex].apps.some(a => a.path === path)) {
                    const newApp = { name: this.currentApp.name, path: path, isApp: true, type: 'file', extension: path.toLowerCase().split('.').pop() };
                    const updated = { ...folders[pinnedIndex], apps: [...folders[pinnedIndex].apps, newApp] };
                    folders[pinnedIndex] = updated;
                    AppState.settings.appFolders = folders;
                    ipcRenderer.send('update-setting', 'appFolders', folders);
                    PinnedAppsModule.render?.();
                }
                break;
            }
            case 'unpin': {
                if (pinnedIndex !== -1) {
                    const updated = { ...folders[pinnedIndex], apps: folders[pinnedIndex].apps.filter(a => a.path !== path) };
                    folders[pinnedIndex] = updated;
                    AppState.settings.appFolders = folders;
                    ipcRenderer.send('update-setting', 'appFolders', folders);
                    PinnedAppsModule.render?.();
                }
                break;
            }
            case 'remove-from-folder': {
                const srcId = this.currentApp.sourceFolderId;
                const idx = folders.findIndex(f => f.id === srcId);
                if (idx !== -1) {
                    folders[idx] = { ...folders[idx], apps: folders[idx].apps.filter(a => a.path !== path) };
                    AppState.settings.appFolders = folders;
                    ipcRenderer.send('update-setting', 'appFolders', folders);
                    PinnedAppsModule.render?.();
                }
                break;
            }
            case 'open-location':
                ipcRenderer.send('show-item-in-folder', path);
                break;
        }
    }
};

const ViewManager = {
    init: function() { this.setupEventListeners(); },
    setupEventListeners: function() {
        if (Utils.getElement('#settings-button')) Utils.getElement('#settings-button').addEventListener('click', () => this.switchView('settings'));
        if (Utils.getElement('#settings-back-button')) Utils.getElement('#settings-back-button').addEventListener('click', () => this.switchView('search'));
        window.addEventListener('contextmenu', (e) => { 
            e.preventDefault(); 
            // Don't show context menu if builder is open
            if (QuickActionBuilder.builderState?.isOpen || document.querySelector('#quick-action-builder-modal.active')) {
                return;
            }
            // Show custom context menu instead of system menu
            CustomContextMenu.show(e);
        }, false);
    },
    switchView: function(viewName) {
        if (AppState.currentView === viewName) return;
        CustomContextMenu?.hide?.();
        AppState.currentView = viewName;
        document.querySelector('.view.active')?.classList.remove('active');
        const newView = Utils.getElement(`#${viewName}-view`);
        if (newView) newView.classList.add('active');
        if (viewName === 'settings') {
            ipcRenderer.invoke('get-indexing-state').then(state => SettingsModule.updateIndexingStatus(state));
            SettingsModule.renderIndexedDirectories();
            SettingsModule.renderAutomations();
        } else {
            Utils.getElement('#search-input')?.focus();
            AuxPanelManager.closePanel();
        }
        // ОПТИМИЗАЦИЯ: Используем requestAnimationFrame для плавной анимации
        requestAnimationFrame(() => this.resizeWindow());
    },
    resizeWindow: function() {
        const appContainer = Utils.getElement('#app-container');
        if (!appContainer) return;

        const parseDimension = (value, fallback = 0) => {
            const numeric = parseInt(value, 10);
            return Number.isFinite(numeric) && numeric > 0 ? numeric : fallback;
        };

        const readCssVariable = (variableName, fallback = 0) => {
            const computed = getComputedStyle(document.documentElement).getPropertyValue(variableName);
            return parseDimension(computed, fallback);
        };

        let totalHeight = 0;
        let targetWidth = 0;

        if (AppState.currentView === 'search') {
            const mainLayout = Utils.getElement('#main-layout');
            const resultsArea = Utils.getElement('#results-area');
            const pinnedAppsContainer = Utils.getElement('#pinned-apps-container');
            const auxPanel = Utils.getElement('#aux-panel');

            if (mainLayout) {
                // Force layout recalculation for pinned apps
                if (pinnedAppsContainer && pinnedAppsContainer.classList.contains('visible')) {
                    void pinnedAppsContainer.offsetHeight;
                }
                
                const resultsHeight = (resultsArea && resultsArea.classList.contains('visible')) ? resultsArea.scrollHeight + 10 : 0;
                const pinnedAppsHeight = (pinnedAppsContainer && pinnedAppsContainer.classList.contains('visible')) ? pinnedAppsContainer.scrollHeight + 10 : 0;
                const auxPanelHeight = (auxPanel && auxPanel.classList.contains('visible')) ? auxPanel.offsetHeight + 10 : 0;

                totalHeight = mainLayout.offsetHeight + resultsHeight + pinnedAppsHeight + auxPanelHeight;
            }

            targetWidth = parseDimension(AppState?.settings?.width, 0);
        } else { // settings
            const settingsContainer = Utils.getElement('.settings-container');
            if (settingsContainer) {
                totalHeight = settingsContainer.offsetHeight + 20; // 10px margin top/bottom
            }
            targetWidth = 970; // Фиксированная ширина для окна настроек (950px + 20px margin)
        }

        const minHeight = Utils.getElement('#main-layout')?.offsetHeight || 70;
        if (totalHeight < minHeight) {
            totalHeight = minHeight;
        }

        if (!targetWidth || targetWidth <= 0) {
            const measuredWidth = Math.max(appContainer.offsetWidth, window.innerWidth);
            targetWidth = readCssVariable('--dynamic-width', parseDimension(measuredWidth, 950)) || parseDimension(measuredWidth, 950) || 950;
        }

        if (totalHeight > 0) {
            const safeHeight = Math.max(totalHeight, minHeight);
            appContainer.style.height = `${safeHeight}px`;

            if (targetWidth > 0) {
                ipcRenderer.send('resize-window', { width: targetWidth, height: safeHeight });
            }
        }
    },
    prepareForShow: function(element) {
        if (!element) return;
        element.classList.remove('closing');
        if (!AppState.settings || AppState.settings.animations === false) {
            return;
        }
        // Force reflow to restart transitions cleanly when becoming visible again.
        void element.offsetWidth;
    },
    animateHide: function(element) {
        if (!element) return;
        if (!element.classList.contains('visible')) {
            element.classList.remove('closing');
            return;
        }

        if (!AppState.settings || AppState.settings.animations === false) {
            element.classList.remove('visible');
            element.classList.remove('closing');
            return;
        }

        element.classList.add('closing');

        let finished = false;
        const finalize = () => {
            if (finished) return;
            finished = true;
            element.classList.remove('closing');
            element.classList.remove('visible');
            element.removeEventListener('transitionend', handleTransitionEnd);
        };

        const handleTransitionEnd = (event) => {
            if (event.target !== element) return;
            finalize();
        };

        element.addEventListener('transitionend', handleTransitionEnd);

        requestAnimationFrame(() => {
            element.classList.remove('visible');
        });

        setTimeout(finalize, 450);
    },
    applyAppearanceSettings: function() {
        document.body.className = '';

        // Логика для темы 'auto'
        if (AppState.settings.theme === 'auto') {
            document.body.classList.add(AppState.systemTheme + '-theme');
        } else if (AppState.settings.theme) {
            document.body.classList.add(AppState.settings.theme + '-theme');
        }

        if (AppState.settings.showFocusHighlight === false) {
            document.body.classList.add('no-focus-highlight');
        }

        if (AppState.settings.animations === false) document.body.classList.add('no-animations');
        else if (AppState.settings.animationStyle) document.body.classList.add('anim-' + AppState.settings.animationStyle);
        
        // НОВОЕ: Применяем класс анимации для результатов
        const resultsArea = Utils.getElement('#results-area');
        if(resultsArea) {
            resultsArea.className = 'glass-element'; // Сбрасываем классы, оставляя базовый
            if (AppState.settings.resultsAnimationStyle) {
                resultsArea.classList.add('results-anim-' + AppState.settings.resultsAnimationStyle);
            }
        }
        
        // Управляем видимостью панели закрепленных приложений
        const pinnedAppsContainer = Utils.getElement('#pinned-apps-container');
        if (pinnedAppsContainer) {
            if (AppState.settings.enablePinnedApps) {
                ViewManager.prepareForShow(pinnedAppsContainer);
                pinnedAppsContainer.classList.add('visible');
            } else {
                ViewManager.animateHide(pinnedAppsContainer);
            }
        }

        this.updateDynamicStyles('opacity', AppState.settings.opacity);
        this.updateDynamicStyles('blurStrength', AppState.settings.blurStrength);
        this.updateDynamicStyles('width', AppState.settings.width);
        this.updateDynamicStyles('height', AppState.settings.height);
        this.updateDynamicStyles('borderRadius', AppState.settings.borderRadius);
        this.updateDynamicStyles('selectionColorStyle', AppState.settings.selectionColorStyle || 'gray'); // НОВОЕ
        if (window.feather) window.feather.replace();
        this.handleStartupAnimation();
    },
    handleStartupAnimation: function() {
        if (!AppState.isInitialized) setTimeout(() => document.body.classList.add('visible'), 50);
        else if (!document.body.classList.contains('visible')) document.body.classList.add('visible');
    },
    updateDynamicStyles: function(settingKey, value) {
        if (settingKey === 'opacity') {
            const numeric = Math.max(0, Math.min(100, parseInt(value, 10) || 0));
            const base = numeric / 100; // now allows 0..1
            document.documentElement.style.setProperty('--dynamic-opacity', base);
            document.documentElement.style.setProperty('--dynamic-opacity-top', 0.6 * base + 0.4 * Math.pow(base, 2));
        }
        else if (settingKey === 'blurStrength') document.documentElement.style.setProperty('--dynamic-blur', `blur(${parseInt(value, 10) || 70}px)`);
        else if (settingKey === 'width') document.documentElement.style.setProperty('--dynamic-width', `${parseInt(value, 10) || 950}px`);
        else if (settingKey === 'height') document.documentElement.style.setProperty('--dynamic-height', `${parseInt(value, 10) || 70}px`);
        else if (settingKey === 'borderRadius') document.documentElement.style.setProperty('--dynamic-border-radius', `${parseInt(value, 10) || 24}px`);
        else if (settingKey === 'selectionColorStyle') {
            // НОВОЕ: Применяем цвет выделения
            const selectionColors = {
                'gray': 'rgba(0, 0, 0, 0.08)',
                'blue': 'rgba(0, 122, 255, 0.2)',
                'green': 'rgba(52, 199, 89, 0.2)',
                'purple': 'rgba(175, 82, 222, 0.2)',
                'red': 'rgba(255, 59, 48, 0.2)',
                'orange': 'rgba(255, 149, 0, 0.2)',
                'yellow': 'rgba(255, 204, 0, 0.2)',
                'accent': 'var(--highlight-color)' // Использует цвет темы
            };
            document.documentElement.style.setProperty('--selection-color', selectionColors[value] || selectionColors['gray']);
        }
    }
};

// =================================================================================
// === Инициализация Приложения (Application Initialization) ===
// =================================================================================

document.addEventListener('DOMContentLoaded', () => {
    ViewManager.init();
    SettingsModule.init();
    QuickActionManager.init();
    SearchModule.init();
    FolderContextMenu.init();
    PinnedContextMenu.init();
    CustomContextMenu.init();
    AppContextMenu.init();
    PinnedAppsModule.init();
    AuxPanelManager.init();
    CustomSelect.init();

    ipcRenderer.on('file-icon-response', (event, { path, dataUrl }) => {
        const relatedImages = [];
        Utils.getAllElements('.app-icon').forEach(imgElement => {
            if (imgElement.getAttribute('data-path') === path) {
                relatedImages.push(imgElement);
            }
        });

        const appName = relatedImages[0]?.getAttribute('data-app-name') || '';
        const fallbackIcon = AppIconFallbacks.get(appName, path);
        const forceFallback = AppIconFallbacks.shouldForceFallback(appName, path);

        let finalDataUrl = dataUrl;
        if ((forceFallback && fallbackIcon) || (!dataUrl && fallbackIcon)) {
            finalDataUrl = fallbackIcon;
        }

        AppState.iconCache.set(path, finalDataUrl || null);

        relatedImages.forEach(imgElement => {
            if (finalDataUrl) {
                imgElement.src = finalDataUrl;
            }
        });

        // ИСПРАВЛЕНИЕ: Убираем пересчет после каждой иконки - это вызывает дергание
        // Вместо этого полагаемся на debouncedResizeForAppsLibrary
    });

    ipcRenderer.on('settings-updated', (event, data) => {
        AppState.settings = data.settings;
        QuickActionStore.ensureStructure();
        QuickActionManager.refresh();
        QuickActionLab.refresh();
        AppState.translations = data.translations;
        AppState.appVersion = data.version;
        AppState.systemTheme = data.systemTheme; // Обновляем системную тему
        ViewManager.applyAppearanceSettings();
        LocalizationRenderer.applyTranslations();
        SettingsModule.populateSettingsUI();
        PinnedAppsModule.render();
        // Перестроить списки иконок (папки/билдер) при загрузке новых SVG
        if (typeof FolderContextMenu?.renderIconOptions === 'function') {
            FolderContextMenu.renderIconOptions();
        }
        if (QuickActionLab) {
            QuickActionLab.cachedIconList = null;
            QuickActionLab.buildIconPicker();
            QuickActionLab.updateIconPreview();
        }
        FolderContextMenu.highlightSelection();
        if (AuxPanelManager.currentPanel === 'apps-library') {
            AuxPanelManager.loadAppsLibrary();
        }
        // Triple resize with delays to ensure proper layout after all renders complete
        requestAnimationFrame(() => {
            ViewManager.resizeWindow();
            setTimeout(() => {
                ViewManager.resizeWindow();
                setTimeout(() => {
                    ViewManager.resizeWindow();
                }, 50);
            }, 50);
        });
    });

    // НОВОЕ: Слушатель смены системной темы
    ipcRenderer.on('system-theme-changed', (event, theme) => {
        AppState.systemTheme = theme;
        if (AppState.settings.theme === 'auto') {
            ViewManager.applyAppearanceSettings();
        }
    });

    ipcRenderer.on('navigate-view', (event, viewName) => ViewManager.switchView(viewName));
    ipcRenderer.on('indexing-status-update', (event, state) => SettingsModule.updateIndexingStatus(state));
    ipcRenderer.on('start-hide-animation', () => document.body.classList.remove('visible'));
    ipcRenderer.on('recalculate-size', () => ViewManager.resizeWindow());
    ipcRenderer.on('trigger-show-animation', () => {
        if (!document.body.classList.contains('visible')) document.body.classList.add('visible');
        Utils.getElement('#search-input')?.focus();
        // Reset all pinned items styles when window is shown
        document.querySelectorAll('.pinned-item').forEach(item => {
            item.style.transform = '';
            item.style.opacity = '';
            item.style.transition = '';
        });
    });

    ipcRenderer.on('prompt-rename-folder', (event, folderId) => {
        startFolderRename(folderId);
    });

    ipcRenderer.on('prompt-create-folder', () => {
        PinnedAppsModule.promptCreateFolder();
    });

    requestAnimationFrame(() => ViewManager.resizeWindow());
});

function startFolderRename(folderId) {
    if (!folderId) return;
    if (folderId === 'pinned') return;
    const folderEl = document.querySelector(`.pinned-item[data-folder-id="${folderId}"]`);
    const nameEl = folderEl?.querySelector('.pinned-item-name');

    if (!folderEl || !nameEl || folderEl.querySelector('.pinned-item-name-input')) return;

    const originalName = nameEl.textContent;
    const input = document.createElement('input');
    input.type = 'text';
    input.value = originalName;
    input.className = 'pinned-item-name-input';

    nameEl.style.display = 'none';
    folderEl.appendChild(input);
    input.focus();
    input.select();

    const finishEditing = () => {
        if (!input.parentNode) return;

        const newName = input.value.trim();

        nameEl.style.display = 'block';
        input.remove();

        if (newName && newName !== originalName) {
            nameEl.textContent = newName;
            ipcRenderer.send('rename-folder', { folderId, newName });
        } else {
            nameEl.textContent = originalName;
        }
    };

    input.addEventListener('blur', finishEditing);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            finishEditing();
        } else if (e.key === 'Escape') {
            input.value = originalName;
            finishEditing();
        }
    });
}
