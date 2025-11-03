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

QuickActionModuleDefinitions.push(...QuickActionAdditionalModules);

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
            if (window.feather?.icons?.[iconName]) {
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
            const toggleLabel = Utils.createElement('label', { className: 'toggle-switch-ios' });
            const toggleInput = document.createElement('input');
            toggleInput.type = 'checkbox';
            toggleInput.checked = isActive;
            toggleInput.addEventListener('change', () => this.toggleAction(action.id, toggleInput.checked));
            const slider = Utils.createElement('span', { className: 'slider' });
            toggleLabel.appendChild(toggleInput);
            toggleLabel.appendChild(slider);
            controls.appendChild(toggleLabel);

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
            const label = Utils.createElement('label', { text: field.label || field.key });
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
        labelSpan.textContent = matchingOption
            ? (matchingOption.label || matchingOption.value)
            : (currentValue || field.placeholder || '');
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
                optionSpan.textContent = option.label || option.value;
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
        if (window.feather?.icons?.[iconName]) {
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
        this.cachedIconList = names.sort((a, b) => a.localeCompare(b));
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
            button.setAttribute('title', name);
            if (window.feather?.icons?.[name]) {
                button.innerHTML = window.feather.icons[name].toSvg();
            } else {
                const fallback = document.createElement('span');
                fallback.textContent = name.slice(0, 2).toUpperCase();
                button.appendChild(fallback);
            }
            const srOnly = document.createElement('span');
            srOnly.className = 'sr-only';
            srOnly.textContent = name;
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
            if (iconContainer && !iconContainer.querySelector('img')) {
                if (window.feather?.icons[iconName]) {
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
            icon.src = src;
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
            if (iconContainer && window.feather?.icons[iconName]) {
                iconContainer.innerHTML = window.feather.icons[iconName].toSvg();
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
