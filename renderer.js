// renderer.js
const { ipcRenderer, shell, clipboard } = require('electron');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const ModuleUtils = {
    ensureText(value) {
        if (typeof value === 'string') return value;
        if (value === null || value === undefined) return '';
        if (typeof value === 'object') {
            try {
                return JSON.stringify(value, null, 2);
            } catch (error) {
                return String(value);
            }
        }
        return String(value);
    },
    toLines(value) {
        const text = ModuleUtils.ensureText(value);
        return text.split(/\r?\n/);
    },
    fromLines(lines, delimiter = '\n') {
        if (!Array.isArray(lines)) return '';
        return lines.join(delimiter);
    },
    safeJsonParse(value) {
        if (typeof value === 'object') return value;
        const text = ModuleUtils.ensureText(value).trim();
        if (!text) return null;
        try {
            return JSON.parse(text);
        } catch (error) {
            return null;
        }
    },
    formatJson(value, pretty = true) {
        try {
            if (typeof value === 'string') {
                const parsed = JSON.parse(value);
                return pretty ? JSON.stringify(parsed, null, 2) : JSON.stringify(parsed);
            }
            return pretty ? JSON.stringify(value, null, 2) : JSON.stringify(value);
        } catch (error) {
            return ModuleUtils.ensureText(value);
        }
    },
    slugify(value) {
        return ModuleUtils.ensureText(value)
            .trim()
            .toLowerCase()
            .replace(/[^\p{L}\p{N}\s-]/gu, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    },
    hash(value, algorithm = 'sha256') {
        try {
            return crypto.createHash(algorithm).update(ModuleUtils.ensureText(value)).digest('hex');
        } catch (error) {
            return '';
        }
    },

    renderTemplate(template, context = {}) {
        const base = ModuleUtils.ensureText(template);
        if (!base) return '';
        const payload = context.payload !== undefined ? context.payload : '';
        const vars = context.vars && typeof context.vars === 'object' ? context.vars : {};
        const extra = context.extra && typeof context.extra === 'object' ? context.extra : {};
        return base.replace(/\{\{\s*([^}\s]+)\s*\}\}/g, (match, token) => {
            if (!token) return match;
            if (token === 'payload') {
                return ModuleUtils.ensureText(payload);
            }
            if (token.startsWith('var.')) {
                const key = token.slice(4);
                if (key && Object.prototype.hasOwnProperty.call(vars, key)) {
                    return ModuleUtils.ensureText(vars[key]);
                }
                return '';
            }
            if (Object.prototype.hasOwnProperty.call(extra, token)) {
                return ModuleUtils.ensureText(extra[token]);
            }
            return match;
        });
    }
};

async function performHttpRequest(url, options = {}) {
    const response = await fetch(url, options);
    const contentType = response.headers?.get?.('content-type') || '';
    const text = await response.text();
    let json = null;
    if (contentType.includes('application/json')) {
        json = ModuleUtils.safeJsonParse(text);
    }
    return { response, text, json, contentType };
}

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

const fsPromises = fs.promises;

function parseHeaders(headersText = '') {
    if (!headersText) return {};
    const direct = ModuleUtils.safeJsonParse(headersText);
    if (direct && typeof direct === 'object' && !Array.isArray(direct)) {
        return Object.keys(direct).reduce((acc, key) => {
            acc[key] = String(direct[key]);
            return acc;
        }, {});
    }
    const result = {};
    ModuleUtils.ensureText(headersText)
        .split(/
?
/)
        .map(line => line.trim())
        .filter(Boolean)
        .forEach(line => {
            const separatorIndex = line.indexOf(':');
            if (separatorIndex === -1) return;
            const key = line.slice(0, separatorIndex).trim();
            const value = line.slice(separatorIndex + 1).trim();
            if (key) result[key] = value;
        });
    return result;
}

function registerTriggerModules(descriptors = []) {
    descriptors.forEach(descriptor => {
        QuickActionModuleDefinitions.push({
            id: descriptor.id,
            category: 'trigger',
            name: descriptor.name,
            description: descriptor.description,
            icon: descriptor.icon || 'zap',
            accent: descriptor.accent || '#38bdf8',
            inputs: [],
            outputs: [{ id: 'next', label: 'Next' }],
            defaultConfig: descriptor.defaultConfig || {},
            form: descriptor.form || [],
            run: async (context, config) => {
                const clone = QuickActionContext.clone(context);
                await descriptor.handler(clone, config || {});
                return [clone];
            }
        });
    });
}

function registerActionModules(descriptors = []) {
    descriptors.forEach(descriptor => {
        QuickActionModuleDefinitions.push({
            id: descriptor.id,
            category: 'action',
            name: descriptor.name,
            description: descriptor.description,
            icon: descriptor.icon || 'zap',
            accent: descriptor.accent || '#38bdf8',
            inputs: [{ id: 'input', label: 'Input' }],
            outputs: [{ id: 'next', label: 'Next' }],
            defaultConfig: descriptor.defaultConfig || {},
            form: descriptor.form || [],
            run: async (context, config) => {
                const clone = QuickActionContext.clone(context);
                await descriptor.handler(clone, config || {});
                return [clone];
            }
        });
    });
}

function registerUtilityModules(descriptors = [], options = {}) {
    descriptors.forEach(descriptor => {
        QuickActionModuleDefinitions.push({
            id: descriptor.id,
            category: 'utility',
            name: descriptor.name,
            description: descriptor.description,
            icon: descriptor.icon || options.icon || 'type',
            accent: descriptor.accent || options.accent || '#6366f1',
            inputs: [{ id: 'input', label: 'Input' }],
            outputs: [{ id: 'next', label: 'Next' }],
            defaultConfig: descriptor.defaultConfig || {},
            form: descriptor.form || [],
            run: async (context, config) => {
                const clone = QuickActionContext.clone(context);
                await descriptor.handler(clone, config || {});
                return [clone];
            }
        });
    });
}



function flattenObject(input, prefix = '', result = {}) {
    if (Array.isArray(input)) {
        input.forEach((value, index) => {
            flattenObject(value, prefix ? `${prefix}[${index}]` : `[${index}]`, result);
        });
        return result;
    }
    if (input && typeof input === 'object') {
        Object.keys(input).forEach((key) => {
            const value = input[key];
            const nextPrefix = prefix ? `${prefix}.${key}` : key;
            flattenObject(value, nextPrefix, result);
        });
        return result;
    }
    result[prefix] = input;
    return result;
}

function toTitleCase(value = '') {
    return ModuleUtils.ensureText(value).toLowerCase().replace(/\b\w+/g, (word) => word.charAt(0).toUpperCase() + word.slice(1));
}

function toSentenceCase(value = '') {
    const text = ModuleUtils.ensureText(value).toLowerCase();
    return text.replace(/(^|[.!?]\s+)([a-zа-яё])/giu, (match, boundary, char) => boundary + char.toUpperCase());
}

function shuffleArray(array = []) {
    const clone = Array.from(array);
    for (let i = clone.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [clone[i], clone[j]] = [clone[j], clone[i]];
    }
    return clone;
}

function wrapTextToWidth(text = '', width = 80) {
    const sanitizedWidth = Math.max(10, Math.floor(width));
    const words = ModuleUtils.ensureText(text).split(/\s+/).filter(Boolean);
    const lines = [];
    let current = '';
    words.forEach(word => {
        if (!current) {
            current = word;
            return;
        }
        if ((current + ' ' + word).length <= sanitizedWidth) {
            current += ' ' + word;
        } else {
            lines.push(current);
            current = word;
        }
    });
    if (current) {
        lines.push(current);
    }
    return lines.join('\\n');
}

function stripHtmlTags(text = '') {
    return ModuleUtils.ensureText(text).replace(/<[^>]*>/g, '');
}

function parseCsv(text = '') {
    const lines = ModuleUtils.toLines(text).filter(line => line.trim() !== '');
    if (!lines.length) return { headers: [], rows: [] };
    const headers = parseCsvLine(lines[0]);
    const rows = lines.slice(1).map(parseCsvLine);
    return { headers, rows };
}

function parseCsvLine(line = '') {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i += 1) {
        const char = line[i];
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i += 1;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);
    return result.map(value => value.trim());
}

function csvStringify(headers = [], rows = []) {
    const escape = (value) => {
        const text = ModuleUtils.ensureText(value);
        if (text.includes('"') || text.includes(',') || /\s/.test(text)) {
            return '"' + text.replace(/"/g, '""') + '"';
        }
        return text;
    };
    const lines = [headers.map(escape).join(',')];
    rows.forEach(row => {
        const values = headers.map((header, index) => escape(row[index] !== undefined ? row[index] : ''));
        lines.push(values.join(','));
    });
    return lines.join('\\n');
}



const TriggerModuleDescriptors = [
    {
        id: 'prompt-trigger',
        name: 'Ask for input',
        description: 'Prompt the user for a value before the workflow starts.',
        icon: 'help-circle',
        accent: '#f97316',
        defaultConfig: { message: 'Provide a value for the workflow' },
        form: [
            { key: 'message', label: 'Prompt message', type: 'text', placeholder: 'What should we do?' }
        ],
        handler: async (clone, config) => {
            const question = config?.message || 'Provide a value for the workflow';
            const response = window.prompt(question, ModuleUtils.ensureText(clone.payload));
            clone.payload = response ?? '';
            clone.logs.push('Collected input from prompt.');
        }
    },
    {
        id: 'clipboard-trigger',
        name: 'Use clipboard content',
        description: 'Start the workflow with the current clipboard text.',
        icon: 'clipboard',
        accent: '#22c55e',
        defaultConfig: {},
        form: [],
        handler: async (clone) => {
            clone.payload = clipboard.readText();
            clone.logs.push('Loaded payload from clipboard.');
        }
    },
    {
        id: 'static-payload-trigger',
        name: 'Static payload',
        description: 'Begin the workflow with a predefined payload value.',
        icon: 'file-text',
        accent: '#a855f7',
        defaultConfig: { text: 'Sample payload', format: 'text' },
        form: [
            { key: 'text', label: 'Payload value', type: 'textarea', rows: 4, placeholder: 'Initial payload' },
            { key: 'format', label: 'Format', type: 'select', options: [
                { value: 'text', label: 'Plain text' },
                { value: 'json', label: 'JSON' }
            ] }
        ],
        handler: async (clone, config) => {
            if (config?.format === 'json') {
                const parsed = ModuleUtils.safeJsonParse(config?.text);
                clone.payload = parsed !== null ? parsed : config?.text;
            } else {
                clone.payload = config?.text ?? '';
            }
            clone.logs.push('Loaded static payload.');
        }
    },
    {
        id: 'url-fetch-trigger',
        name: 'Fetch URL (trigger)',
        description: 'Fetch data from a URL before running the workflow.',
        icon: 'download',
        accent: '#38bdf8',
        defaultConfig: { url: 'https://api.example.com/data', format: 'text' },
        form: [
            { key: 'url', label: 'Request URL', type: 'text', placeholder: 'https://api.example.com/data' },
            { key: 'format', label: 'Store as', type: 'select', options: [
                { value: 'text', label: 'Text' },
                { value: 'json', label: 'Pretty JSON' }
            ] }
        ],
        handler: async (clone, config) => {
            const url = String(config?.url || '').trim();
            if (!url) {
                clone.logs.push('URL trigger skipped: missing URL.');
                return;
            }
            try {
                const result = await performHttpRequest(url, { method: 'GET' });
                clone.logs.push(`Fetched trigger data from ${url} → ${result.response.status}`);
                if (config?.format === 'json' && result.json !== null) {
                    clone.payload = ModuleUtils.formatJson(result.json);
                    clone.vars.lastResponse = result.json;
                } else {
                    clone.payload = result.text;
                }
            } catch (error) {
                clone.logs.push(`URL trigger failed: ${error.message}`);
            }
        }
    },
    {
        id: 'file-read-trigger',
        name: 'Read file (trigger)',
        description: 'Load a file from disk and use its contents as the payload.',
        icon: 'file',
        accent: '#f97316',
        defaultConfig: { filePath: path.join(os.homedir(), 'Documents', 'note.txt'), encoding: 'utf8' },
        form: [
            { key: 'filePath', label: 'File path', type: 'text', placeholder: 'C:/Documents/note.txt' },
            { key: 'encoding', label: 'Encoding', type: 'text', placeholder: 'utf8' }
        ],
        handler: async (clone, config) => {
            const filePath = String(config?.filePath || '').trim();
            if (!filePath) {
                clone.logs.push('File trigger skipped: missing path.');
                return;
            }
            try {
                const encoding = config?.encoding || 'utf8';
                const data = await fsPromises.readFile(filePath, encoding);
                clone.payload = data;
                clone.logs.push(`Loaded payload from ${filePath}.`);
            } catch (error) {
                clone.logs.push(`File trigger failed: ${error.message}`);
            }
        }
    },
    {
        id: 'random-string-trigger',
        name: 'Random string',
        description: 'Generate a random string before running the workflow.',
        icon: 'shuffle',
        accent: '#ec4899',
        defaultConfig: { length: 16 },
        form: [
            { key: 'length', label: 'Length', type: 'number', min: 4 }
        ],
        handler: async (clone, config) => {
            const length = Math.max(4, parseInt(config?.length, 10) || 16);
            const bytes = crypto.randomBytes(Math.ceil(length / 2));
            clone.payload = bytes.toString('hex').slice(0, length);
            clone.logs.push('Generated random string payload.');
        }
    },
    {
        id: 'ai-chat-trigger',
        name: 'AI chat (trigger)',
        description: 'Ask an AI model for text before the workflow starts.',
        icon: 'message-circle',
        accent: '#6366f1',
        defaultConfig: {
            apiKey: '',
            model: 'gpt-3.5-turbo',
            systemPrompt: 'You are a helpful assistant.',
            userPrompt: 'Summarise: {{payload}}'
        },
        form: [
            { key: 'apiKey', label: 'OpenAI API key', type: 'text', placeholder: 'sk-...' },
            { key: 'model', label: 'Model', type: 'text', placeholder: 'gpt-3.5-turbo' },
            { key: 'systemPrompt', label: 'System prompt', type: 'textarea', rows: 2, placeholder: 'You are a helpful assistant.' },
            { key: 'userPrompt', label: 'User prompt', type: 'textarea', rows: 3, placeholder: 'Summarise: {{payload}}' }
        ],
        handler: async (clone, config) => {
            const apiKey = String(config?.apiKey || '').trim();
            if (!apiKey) {
                clone.logs.push('AI trigger skipped: missing API key.');
                return;
            }
            const userPrompt = ModuleUtils.ensureText(config?.userPrompt || 'Respond to the payload').replace('{{payload}}', ModuleUtils.ensureText(clone.payload));
            try {
                const body = {
                    model: config?.model || 'gpt-3.5-turbo',
                    messages: [
                        { role: 'system', content: config?.systemPrompt || 'You are a helpful assistant.' },
                        { role: 'user', content: userPrompt }
                    ]
                };
                const result = await performHttpRequest('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify(body)
                });
                const reply = result.json?.choices?.[0]?.message?.content || result.text;
                clone.payload = reply || '';
                clone.vars.lastAiResponse = result.json || result.text;
                clone.logs.push('Fetched AI response for trigger payload.');
            } catch (error) {
                clone.logs.push(`AI trigger failed: ${error.message}`);
            }
        }
    }
];

registerTriggerModules(TriggerModuleDescriptors);


const ActionModuleDescriptors = [
    {
        id: 'open-external-application',
        name: 'Open external application',
        description: 'Launch any application or script with optional arguments.',
        icon: 'play',
        accent: '#f97316',
        defaultConfig: { command: 'notepad.exe', arguments: '' },
        form: [
            { key: 'command', label: 'Executable path', type: 'text', placeholder: 'C:/Windows/System32/notepad.exe' },
            { key: 'arguments', label: 'Arguments', type: 'text', placeholder: '"C:/Documents/note.txt"' }
        ],
        handler: async (clone, config) => {
            const command = String(config?.command || '').trim();
            if (!command) {
                clone.logs.push('Open application skipped: missing command.');
                return;
            }
            const args = String(config?.arguments || '').trim();
            const fullCommand = args ? `${command} ${args}` : command;
            ipcRenderer.invoke('quick-action-run-command', fullCommand).catch(() => {});
            clone.logs.push(`Launched command: ${fullCommand}`);
        }
    },
    {
        id: 'open-folder-path',
        name: 'Open folder',
        description: 'Reveal a folder in your file manager.',
        icon: 'folder',
        accent: '#22c55e',
        defaultConfig: { folderPath: os.homedir() },
        form: [
            { key: 'folderPath', label: 'Folder path', type: 'text', placeholder: 'C:/Users/me/Documents' }
        ],
        handler: async (clone, config) => {
            const folder = String(config?.folderPath || '').trim();
            if (!folder) {
                clone.logs.push('Open folder skipped: missing path.');
                return;
            }
            shell.openPath(folder);
            clone.logs.push(`Opened folder: ${folder}`);
        }
    },
    {
        id: 'open-web-search',
        name: 'Search the web',
        description: 'Open a web search using the current payload as the query.',
        icon: 'search',
        accent: '#0ea5e9',
        defaultConfig: { template: 'https://www.google.com/search?q={{payload}}' },
        form: [
            { key: 'template', label: 'Search URL', type: 'text', placeholder: 'https://www.google.com/search?q={{payload}}' }
        ],
        handler: async (clone, config) => {
            const template = config?.template || 'https://www.google.com/search?q={{payload}}';
            const query = encodeURIComponent(ModuleUtils.ensureText(clone.payload));
            const url = template.replace('{{payload}}', query);
            shell.openExternal(url);
            clone.logs.push(`Opened search URL: ${url}`);
        }
    },
    {
        id: 'show-alert-message',
        name: 'Show alert',
        description: 'Display an alert dialog with custom text.',
        icon: 'alert-circle',
        accent: '#facc15',
        defaultConfig: { message: 'Workflow reached this step.' },
        form: [
            { key: 'message', label: 'Message', type: 'textarea', rows: 3, placeholder: 'Workflow reached this step.' }
        ],
        handler: async (clone, config) => {
            window.alert(config?.message || 'Workflow reached this step.');
            clone.logs.push('Displayed alert to user.');
        }
    },
    {
        id: 'confirm-before-continue',
        name: 'Confirm before continuing',
        description: 'Ask the user for confirmation and record the answer.',
        icon: 'check-square',
        accent: '#14b8a6',
        defaultConfig: { question: 'Continue with the workflow?' },
        form: [
            { key: 'question', label: 'Confirmation question', type: 'text', placeholder: 'Continue with the workflow?' }
        ],
        handler: async (clone, config) => {
            const confirmed = window.confirm(config?.question || 'Continue with the workflow?');
            clone.logs.push(confirmed ? 'User confirmed to continue.' : 'User cancelled but workflow continues.');
            clone.vars.lastConfirmation = confirmed;
        }
    },
    {
        id: 'prompt-for-value',
        name: 'Prompt for value',
        description: 'Ask the user for text mid-workflow and store it as the payload.',
        icon: 'edit-3',
        accent: '#8b5cf6',
        defaultConfig: { message: 'Enter a value:' },
        form: [
            { key: 'message', label: 'Prompt message', type: 'text', placeholder: 'Enter a value:' }
        ],
        handler: async (clone, config) => {
            const response = window.prompt(config?.message || 'Enter a value:', ModuleUtils.ensureText(clone.payload));
            if (response !== null) {
                clone.payload = response;
            }
            clone.logs.push('Prompted for value during workflow.');
        }
    },
    {
        id: 'copy-payload-as-json',
        name: 'Copy as JSON',
        description: 'Copy the payload to the clipboard as JSON text.',
        icon: 'copy',
        accent: '#22c55e',
        defaultConfig: {},
        form: [],
        handler: async (clone) => {
            ipcRenderer.send('copy-to-clipboard', ModuleUtils.formatJson(clone.payload));
            clone.logs.push('Copied payload as JSON.');
        }
    },
    {
        id: 'append-payload-to-file',
        name: 'Append to file',
        description: 'Append the payload text to a file, creating it if necessary.',
        icon: 'file-plus',
        accent: '#f97316',
        defaultConfig: { filePath: path.join(os.homedir(), 'Documents', 'flashsearch-log.txt') },
        form: [
            { key: 'filePath', label: 'File path', type: 'text', placeholder: 'C:/Documents/notes.txt' }
        ],
        handler: async (clone, config) => {
            const filePath = String(config?.filePath || '').trim();
            if (!filePath) {
                clone.logs.push('Append to file skipped: missing path.');
                return;
            }
            try {
                await fsPromises.mkdir(path.dirname(filePath), { recursive: true });
                await fsPromises.appendFile(filePath, ModuleUtils.ensureText(clone.payload) + os.EOL, 'utf8');
                clone.logs.push(`Appended payload to ${filePath}.`);
            } catch (error) {
                clone.logs.push(`Append to file failed: ${error.message}`);
            }
        }
    },
    {
        id: 'write-payload-to-file',
        name: 'Write file',
        description: 'Overwrite a file with the current payload value.',
        icon: 'save',
        accent: '#38bdf8',
        defaultConfig: { filePath: path.join(os.homedir(), 'Documents', 'flashsearch-output.txt') },
        form: [
            { key: 'filePath', label: 'File path', type: 'text', placeholder: 'C:/Documents/output.txt' }
        ],
        handler: async (clone, config) => {
            const filePath = String(config?.filePath || '').trim();
            if (!filePath) {
                clone.logs.push('Write file skipped: missing path.');
                return;
            }
            try {
                await fsPromises.mkdir(path.dirname(filePath), { recursive: true });
                await fsPromises.writeFile(filePath, ModuleUtils.ensureText(clone.payload), 'utf8');
                clone.logs.push(`Wrote payload to ${filePath}.`);
            } catch (error) {
                clone.logs.push(`Write file failed: ${error.message}`);
            }
        }
    },
    {
        id: 'list-directory-contents',
        name: 'List directory',
        description: 'List files in a directory and store them as the payload.',
        icon: 'list',
        accent: '#14b8a6',
        defaultConfig: { directoryPath: os.homedir() },
        form: [
            { key: 'directoryPath', label: 'Directory path', type: 'text', placeholder: 'C:/Users/me/Documents' }
        ],
        handler: async (clone, config) => {
            const dir = String(config?.directoryPath || '').trim();
            if (!dir) {
                clone.logs.push('List directory skipped: missing path.');
                return;
            }
            try {
                const items = await fsPromises.readdir(dir);
                clone.payload = items.join('\n');
                clone.logs.push(`Listed ${items.length} items from ${dir}.`);
            } catch (error) {
                clone.logs.push(`List directory failed: ${error.message}`);
            }
        }
    },
    {
        id: 'create-folder',
        name: 'Create folder',
        description: 'Create a folder if it does not exist.',
        icon: 'folder-plus',
        accent: '#facc15',
        defaultConfig: { directoryPath: path.join(os.homedir(), 'Documents', 'New Folder') },
        form: [
            { key: 'directoryPath', label: 'Folder path', type: 'text', placeholder: 'C:/Projects/New Folder' }
        ],
        handler: async (clone, config) => {
            const dir = String(config?.directoryPath || '').trim();
            if (!dir) {
                clone.logs.push('Create folder skipped: missing path.');
                return;
            }
            try {
                await fsPromises.mkdir(dir, { recursive: true });
                clone.logs.push(`Ensured folder exists: ${dir}`);
            } catch (error) {
                clone.logs.push(`Create folder failed: ${error.message}`);
            }
        }
    },
    {
        id: 'send-email-mailto',
        name: 'Compose email',
        description: 'Open the default mail client with a pre-filled message.',
        icon: 'send',
        accent: '#ef4444',
        defaultConfig: { to: '', subject: 'FlashSearch quick action', bodyTemplate: '{{payload}}' },
        form: [
            { key: 'to', label: 'Recipient', type: 'text', placeholder: 'team@example.com' },
            { key: 'subject', label: 'Subject', type: 'text', placeholder: 'FlashSearch quick action' },
            { key: 'bodyTemplate', label: 'Body template', type: 'textarea', rows: 3, placeholder: 'Message: {{payload}}' }
        ],
        handler: async (clone, config) => {
            const to = encodeURIComponent(config?.to || '');
            const subject = encodeURIComponent(config?.subject || 'FlashSearch quick action');
            const body = encodeURIComponent((config?.bodyTemplate || '{{payload}}').replace('{{payload}}', ModuleUtils.ensureText(clone.payload)));
            const url = `mailto:${to}?subject=${subject}&body=${body}`;
            shell.openExternal(url);
            clone.logs.push('Opened email client via mailto link.');
        }
    },
    {
        id: 'copy-payload-as-text',
        name: 'Copy as text',
        description: 'Copy the payload as plain text to the clipboard.',
        icon: 'clipboard',
        accent: '#4ade80',
        defaultConfig: {},
        form: [],
        handler: async (clone) => {
            ipcRenderer.send('copy-to-clipboard', ModuleUtils.ensureText(clone.payload));
            clone.logs.push('Copied payload as plain text.');
        }
    },
    {
        id: 'copy-payload-as-html',
        name: 'Copy as HTML',
        description: 'Wrap the payload in basic HTML and copy it to the clipboard.',
        icon: 'code',
        accent: '#3b82f6',
        defaultConfig: { tag: 'p' },
        form: [
            { key: 'tag', label: 'HTML tag', type: 'text', placeholder: 'p' }
        ],
        handler: async (clone, config) => {
            const tag = (config?.tag || 'p').replace(/[^a-z0-9-]/gi, '') || 'p';
            const html = `<${tag}>${ModuleUtils.ensureText(clone.payload)}</${tag}>`;
            ipcRenderer.send('copy-to-clipboard', html);
            clone.logs.push(`Copied payload as HTML <${tag}>.`);
        }
    },
    {
        id: 'copy-payload-as-markdown',
        name: 'Copy as Markdown',
        description: 'Copy the payload wrapped in a Markdown code block.',
        icon: 'clipboard',
        accent: '#6366f1',
        defaultConfig: { language: 'text' },
        form: [
            { key: 'language', label: 'Code language', type: 'text', placeholder: 'text' }
        ],
        handler: async (clone, config) => {
            const lang = (config?.language || 'text').trim();
            const markdown = `\`\`\`${lang}
${ModuleUtils.ensureText(clone.payload)}
\`\`\``;
            ipcRenderer.send('copy-to-clipboard', markdown);
            clone.logs.push('Copied payload as Markdown.');
        }
    }
];

registerActionModules(ActionModuleDescriptors);


const RawHttpModuleDescriptors = [
    { id: 'http-get', name: 'HTTP GET request', description: 'Send a GET request and store the response.', method: 'GET', allowBody: false, allowCustomMethod: false },
    { id: 'http-post', name: 'HTTP POST request', description: 'Send a POST request with an optional body.', method: 'POST', allowBody: true, allowCustomMethod: false },
    { id: 'http-put', name: 'HTTP PUT request', description: 'Send a PUT request with an optional body.', method: 'PUT', allowBody: true, allowCustomMethod: false },
    { id: 'http-delete', name: 'HTTP DELETE request', description: 'Send a DELETE request.', method: 'DELETE', allowBody: false, allowCustomMethod: false },
    { id: 'http-custom-request', name: 'HTTP custom request', description: 'Send a custom HTTP request with configurable method.', method: 'POST', allowBody: true, allowCustomMethod: true }
];

const HttpModuleDescriptors = RawHttpModuleDescriptors.map(definition => ({
    id: definition.id,
    name: definition.name,
    description: definition.description,
    icon: 'cloud',
    accent: '#0ea5e9',
    defaultConfig: {
        url: 'https://example.com',
        headers: '',
        body: '',
        method: definition.method
    },
    form: [
        { key: 'url', label: 'Request URL', type: 'text', placeholder: 'https://example.com' },
        ...(definition.allowCustomMethod ? [{ key: 'method', label: 'HTTP method', type: 'text', placeholder: definition.method || 'GET' }] : []),
        { key: 'headers', label: 'Headers (JSON or key:value per line)', type: 'textarea', rows: 3, placeholder: '{"Authorization":"Bearer token"}' },
        ...(definition.allowBody ? [
            { key: 'body', label: 'Request body', type: 'textarea', rows: 4, placeholder: '{"message":"Hello"}' },
            { key: 'sendPayloadWhenEmpty', label: 'Use payload if body empty (true/false)', type: 'text', placeholder: 'true' }
        ] : [])
    ],
    handler: async (clone, config) => {
        const url = String(config?.url || '').trim();
        if (!url) {
            clone.logs.push(`${definition.name}: missing URL.`);
            return;
        }
        const selectedMethod = definition.allowCustomMethod ? (config?.method || definition.method || 'GET') : definition.method;
        const headers = parseHeaders(config?.headers);
        const fetchOptions = {
            method: (selectedMethod || 'GET').toUpperCase(),
            headers: { ...headers }
        };
        if (definition.allowBody) {
            let body = config?.body;
            const wantsPayload = String(config?.sendPayloadWhenEmpty || '').toLowerCase() === 'true';
            if ((!body || body.trim() === '') && wantsPayload) {
                body = ModuleUtils.ensureText(clone.payload);
            }
            if (body !== undefined && body !== null && fetchOptions.method !== 'GET' && fetchOptions.method !== 'HEAD') {
                fetchOptions.body = ModuleUtils.ensureText(body);
                if (!fetchOptions.headers['Content-Type'] && !fetchOptions.headers['content-type']) {
                    fetchOptions.headers['Content-Type'] = 'application/json';
                }
            }
        }
        try {
            const result = await performHttpRequest(url, fetchOptions);
            clone.logs.push(`${fetchOptions.method} ${url} → ${result.response.status}`);
            if (result.json !== null) {
                clone.payload = ModuleUtils.formatJson(result.json);
                clone.vars.lastResponse = result.json;
            } else {
                clone.payload = result.text;
            }
        } catch (error) {
            clone.logs.push(`${definition.name} failed: ${error.message}`);
        }
    }
}));

registerActionModules(HttpModuleDescriptors);


const AdditionalHttpModuleDescriptors = [
    {
        id: 'http-get-json-pretty',
        name: 'HTTP: GET JSON (pretty)',
        description: 'Fetch JSON from a URL and format it with indentation.',
        icon: 'download',
        accent: '#38bdf8',
        defaultConfig: { url: 'https://api.example.com/data', headers: '' },
        form: [
            { key: 'url', label: 'Request URL', type: 'text', placeholder: 'https://api.example.com/data' },
            { key: 'headers', label: 'Headers (JSON or key:value per line)', type: 'textarea', rows: 3, placeholder: '{"Authorization":"Bearer"}' }
        ],
        handler: async (clone, config) => {
            const url = String(config?.url || '').trim();
            if (!url) {
                clone.logs.push('GET JSON skipped: missing URL.');
                return;
            }
            try {
                const result = await performHttpRequest(url, { method: 'GET', headers: parseHeaders(config?.headers) });
                if (result.json !== null) {
                    clone.payload = ModuleUtils.formatJson(result.json);
                    clone.vars.lastResponse = result.json;
                } else {
                    clone.payload = result.text;
                }
                clone.logs.push(`GET ${url} → ${result.response.status}`);
            } catch (error) {
                clone.logs.push(`GET JSON failed: ${error.message}`);
            }
        }
    },
    {
        id: 'http-get-text',
        name: 'HTTP: GET text',
        description: 'Download plain text content from the specified URL.',
        icon: 'file-text',
        accent: '#14b8a6',
        defaultConfig: { url: 'https://example.com/readme.txt' },
        form: [
            { key: 'url', label: 'Request URL', type: 'text', placeholder: 'https://example.com/readme.txt' }
        ],
        handler: async (clone, config) => {
            const url = String(config?.url || '').trim();
            if (!url) {
                clone.logs.push('GET text skipped: missing URL.');
                return;
            }
            try {
                const result = await performHttpRequest(url, { method: 'GET' });
                clone.payload = result.text;
                clone.logs.push(`Fetched text from ${url}.`);
            } catch (error) {
                clone.logs.push(`GET text failed: ${error.message}`);
            }
        }
    },
    {
        id: 'http-post-json-body',
        name: 'HTTP: POST JSON body',
        description: 'Send a JSON payload compiled from the workflow payload.',
        icon: 'send',
        accent: '#f97316',
        defaultConfig: { url: 'https://api.example.com/items', bodyTemplate: '{"data":"{{payload}}"}', headers: '{"Content-Type":"application/json"}' },
        form: [
            { key: 'url', label: 'Endpoint URL', type: 'text', placeholder: 'https://api.example.com/items' },
            { key: 'bodyTemplate', label: 'Body template', type: 'textarea', rows: 3, placeholder: '{"data":"{{payload}}"}' },
            { key: 'headers', label: 'Headers (JSON)', type: 'textarea', rows: 3, placeholder: '{"Content-Type":"application/json"}' }
        ],
        handler: async (clone, config) => {
            const url = String(config?.url || '').trim();
            if (!url) {
                clone.logs.push('POST JSON skipped: missing URL.');
                return;
            }
            const headers = parseHeaders(config?.headers || '{"Content-Type":"application/json"}');
            const bodyTemplate = ModuleUtils.renderTemplate(config?.bodyTemplate || '{}', { payload: clone.payload, vars: clone.vars });
            try {
                const { json, text, response } = await performHttpRequest(url, {
                    method: 'POST',
                    headers,
                    body: bodyTemplate
                });
                clone.payload = json !== null ? ModuleUtils.formatJson(json) : text;
                clone.logs.push(`POST ${url} → ${response.status}`);
            } catch (error) {
                clone.logs.push(`POST JSON failed: ${error.message}`);
            }
        }
    },
    {
        id: 'http-post-form-encoded',
        name: 'HTTP: POST form encoded',
        description: 'Submit application/x-www-form-urlencoded data built from key/value pairs.',
        icon: 'clipboard',
        accent: '#eab308',
        defaultConfig: { url: 'https://api.example.com/submit', fields: 'title={{payload}}&status=draft' },
        form: [
            { key: 'url', label: 'Endpoint URL', type: 'text', placeholder: 'https://api.example.com/submit' },
            { key: 'fields', label: 'Form fields', type: 'textarea', rows: 3, placeholder: 'title={{payload}}&status=draft' }
        ],
        handler: async (clone, config) => {
            const url = String(config?.url || '').trim();
            if (!url) {
                clone.logs.push('POST form skipped: missing URL.');
                return;
            }
            const fields = ModuleUtils.renderTemplate(config?.fields || '', { payload: clone.payload, vars: clone.vars });
            try {
                const result = await performHttpRequest(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: fields
                });
                clone.payload = result.text;
                clone.logs.push(`POST form to ${url} → ${result.response.status}`);
            } catch (error) {
                clone.logs.push(`POST form failed: ${error.message}`);
            }
        }
    },
    {
        id: 'http-put-json-body',
        name: 'HTTP: PUT JSON body',
        description: 'Send an idempotent JSON request with the payload merged into a template.',
        icon: 'upload-cloud',
        accent: '#0ea5e9',
        defaultConfig: { url: 'https://api.example.com/items/1', bodyTemplate: '{"payload":{{payload}}}', headers: '{"Content-Type":"application/json"}' },
        form: [
            { key: 'url', label: 'Endpoint URL', type: 'text', placeholder: 'https://api.example.com/items/1' },
            { key: 'bodyTemplate', label: 'Body template', type: 'textarea', rows: 3, placeholder: '{"payload":{{payload}}}' },
            { key: 'headers', label: 'Headers (JSON)', type: 'textarea', rows: 3, placeholder: '{"Content-Type":"application/json"}' }
        ],
        handler: async (clone, config) => {
            const url = String(config?.url || '').trim();
            if (!url) {
                clone.logs.push('PUT JSON skipped: missing URL.');
                return;
            }
            const headers = parseHeaders(config?.headers || '{"Content-Type":"application/json"}');
            const body = ModuleUtils.renderTemplate(config?.bodyTemplate || '{}', { payload: clone.payload, vars: clone.vars });
            try {
                const { json, text, response } = await performHttpRequest(url, {
                    method: 'PUT',
                    headers,
                    body
                });
                clone.payload = json !== null ? ModuleUtils.formatJson(json) : text;
                clone.logs.push(`PUT ${url} → ${response.status}`);
            } catch (error) {
                clone.logs.push(`PUT JSON failed: ${error.message}`);
            }
        }
    },
    {
        id: 'http-delete-extended',
        name: 'HTTP: DELETE resource',
        description: 'Send a DELETE request and capture the response text.',
        icon: 'trash-2',
        accent: '#ef4444',
        defaultConfig: { url: 'https://api.example.com/items/1', headers: '' },
        form: [
            { key: 'url', label: 'Request URL', type: 'text', placeholder: 'https://api.example.com/items/1' },
            { key: 'headers', label: 'Headers (JSON or key:value per line)', type: 'textarea', rows: 3, placeholder: '{"Authorization":"Bearer"}' }
        ],
        handler: async (clone, config) => {
            const url = String(config?.url || '').trim();
            if (!url) {
                clone.logs.push('DELETE skipped: missing URL.');
                return;
            }
            try {
                const result = await performHttpRequest(url, { method: 'DELETE', headers: parseHeaders(config?.headers) });
                clone.payload = result.text;
                clone.logs.push(`DELETE ${url} → ${result.response.status}`);
            } catch (error) {
                clone.logs.push(`DELETE request failed: ${error.message}`);
            }
        }
    },
    {
        id: 'http-head-check',
        name: 'HTTP: HEAD check',
        description: 'Perform a HEAD request and store headers as JSON.',
        icon: 'info',
        accent: '#6366f1',
        defaultConfig: { url: 'https://example.com', headers: '' },
        form: [
            { key: 'url', label: 'Request URL', type: 'text', placeholder: 'https://example.com' },
            { key: 'headers', label: 'Headers (JSON or key:value per line)', type: 'textarea', rows: 3, placeholder: '{"User-Agent":"FlashSearch"}' }
        ],
        handler: async (clone, config) => {
            const url = String(config?.url || '').trim();
            if (!url) {
                clone.logs.push('HEAD skipped: missing URL.');
                return;
            }
            try {
                const { response } = await performHttpRequest(url, { method: 'HEAD', headers: parseHeaders(config?.headers) });
                const headersObj = {};
                response.headers?.forEach?.((value, key) => {
                    headersObj[key] = value;
                });
                clone.payload = ModuleUtils.formatJson(headersObj);
                clone.logs.push(`HEAD ${url} → ${response.status}`);
            } catch (error) {
                clone.logs.push(`HEAD request failed: ${error.message}`);
            }
        }
    },
    {
        id: 'http-graphql-query',
        name: 'HTTP: GraphQL query',
        description: 'Send a GraphQL query with variables and format the result.',
        icon: 'hexagon',
        accent: '#ec4899',
        defaultConfig: {
            url: 'https://api.spacex.land/graphql/',
            query: 'query Launches { launchesPast(limit: 1) { mission_name } }',
            variables: '{}'
        },
        form: [
            { key: 'url', label: 'GraphQL endpoint', type: 'text', placeholder: 'https://api.spacex.land/graphql/' },
            { key: 'query', label: 'Query', type: 'textarea', rows: 5, placeholder: 'query Example { field }' },
            { key: 'variables', label: 'Variables JSON', type: 'textarea', rows: 3, placeholder: '{"key":"value"}' }
        ],
        handler: async (clone, config) => {
            const url = String(config?.url || '').trim();
            if (!url) {
                clone.logs.push('GraphQL skipped: missing endpoint.');
                return;
            }
            const variables = ModuleUtils.safeJsonParse(config?.variables) || {};
            try {
                const { json, text, response } = await performHttpRequest(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: config?.query || '', variables })
                });
                clone.payload = json !== null ? ModuleUtils.formatJson(json) : text;
                clone.logs.push(`GraphQL ${url} → ${response.status}`);
            } catch (error) {
                clone.logs.push(`GraphQL request failed: ${error.message}`);
            }
        }
    },
    {
        id: 'http-download-base64',
        name: 'HTTP: Download as base64',
        description: 'Download binary data and convert it into a base64 data URL.',
        icon: 'archive',
        accent: '#8b5cf6',
        defaultConfig: { url: 'https://example.com/image.png', mimeType: 'image/png' },
        form: [
            { key: 'url', label: 'File URL', type: 'text', placeholder: 'https://example.com/image.png' },
            { key: 'mimeType', label: 'MIME type', type: 'text', placeholder: 'image/png' }
        ],
        handler: async (clone, config) => {
            const url = String(config?.url || '').trim();
            if (!url) {
                clone.logs.push('Download skipped: missing URL.');
                return;
            }
            try {
                const response = await fetch(url);
                if (!response.ok) {
                    const text = await response.text();
                    throw new Error(`${response.status} ${text}`);
                }
                const buffer = Buffer.from(await response.arrayBuffer());
                const mime = config?.mimeType || response.headers.get('content-type') || 'application/octet-stream';
                clone.payload = `data:${mime};base64,${buffer.toString('base64')}`;
                clone.logs.push(`Downloaded ${buffer.length} bytes from ${url}.`);
            } catch (error) {
                clone.logs.push(`Download failed: ${error.message}`);
            }
        }
    },
    {
        id: 'http-upload-payload',
        name: 'HTTP: Upload payload',
        description: 'Send the current payload as-is to an endpoint with a configurable method.',
        icon: 'corner-up-right',
        accent: '#22d3ee',
        defaultConfig: { url: 'https://api.example.com/ingest', method: 'POST', headers: '{"Content-Type":"text/plain"}' },
        form: [
            { key: 'url', label: 'Endpoint URL', type: 'text', placeholder: 'https://api.example.com/ingest' },
            { key: 'method', label: 'HTTP method', type: 'text', placeholder: 'POST' },
            { key: 'headers', label: 'Headers (JSON)', type: 'textarea', rows: 3, placeholder: '{"Content-Type":"text/plain"}' }
        ],
        handler: async (clone, config) => {
            const url = String(config?.url || '').trim();
            const method = (config?.method || 'POST').toUpperCase();
            if (!url) {
                clone.logs.push('Upload skipped: missing URL.');
                return;
            }
            try {
                const { json, text, response } = await performHttpRequest(url, {
                    method,
                    headers: parseHeaders(config?.headers),
                    body: ModuleUtils.ensureText(clone.payload)
                });
                clone.payload = json !== null ? ModuleUtils.formatJson(json) : text;
                clone.logs.push(`${method} ${url} → ${response.status}`);
            } catch (error) {
                clone.logs.push(`Upload failed: ${error.message}`);
            }
        }
    }
];

registerActionModules(AdditionalHttpModuleDescriptors);


const AiModuleDescriptors = [
    {
        id: 'ai-openai-chat',
        name: 'AI: OpenAI chat',
        description: 'Call the OpenAI Chat Completions API with the current payload.',
        icon: 'message-circle',
        accent: '#6366f1',
        defaultConfig: {
            apiKey: '',
            model: 'gpt-3.5-turbo',
            systemPrompt: 'You are a helpful assistant.',
            userPrompt: 'Respond to this: {{payload}}'
        },
        form: [
            { key: 'apiKey', label: 'OpenAI API key', type: 'text', placeholder: 'sk-...' },
            { key: 'model', label: 'Model', type: 'text', placeholder: 'gpt-3.5-turbo' },
            { key: 'systemPrompt', label: 'System prompt', type: 'textarea', rows: 2, placeholder: 'You are a helpful assistant.' },
            { key: 'userPrompt', label: 'User prompt', type: 'textarea', rows: 3, placeholder: 'Respond to this: {{payload}}' }
        ],
        handler: async (clone, config) => {
            const apiKey = String(config?.apiKey || '').trim();
            if (!apiKey) {
                clone.logs.push('OpenAI chat skipped: missing API key.');
                return;
            }
            const userPrompt = ModuleUtils.ensureText(config?.userPrompt || 'Respond to this: {{payload}}').replace('{{payload}}', ModuleUtils.ensureText(clone.payload));
            const body = {
                model: config?.model || 'gpt-3.5-turbo',
                messages: [
                    { role: 'system', content: config?.systemPrompt || 'You are a helpful assistant.' },
                    { role: 'user', content: userPrompt }
                ]
            };
            const result = await performHttpRequest('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify(body)
            });
            const reply = result.json?.choices?.[0]?.message?.content || result.text;
            clone.payload = reply || '';
            clone.vars.lastAiResponse = result.json || result.text;
            clone.logs.push(`OpenAI chat response (${(reply || '').length} chars).`);
        }
    },
    {
        id: 'ai-openai-completion',
        name: 'AI: OpenAI completion',
        description: 'Call the legacy OpenAI text completion endpoint.',
        icon: 'type',
        accent: '#a855f7',
        defaultConfig: {
            apiKey: '',
            model: 'text-davinci-003',
            prompt: 'Rewrite this: {{payload}}'
        },
        form: [
            { key: 'apiKey', label: 'OpenAI API key', type: 'text', placeholder: 'sk-...' },
            { key: 'model', label: 'Model', type: 'text', placeholder: 'text-davinci-003' },
            { key: 'prompt', label: 'Prompt', type: 'textarea', rows: 3, placeholder: 'Rewrite this: {{payload}}' }
        ],
        handler: async (clone, config) => {
            const apiKey = String(config?.apiKey || '').trim();
            if (!apiKey) {
                clone.logs.push('OpenAI completion skipped: missing API key.');
                return;
            }
            const prompt = ModuleUtils.ensureText(config?.prompt || 'Rewrite this: {{payload}}').replace('{{payload}}', ModuleUtils.ensureText(clone.payload));
            const body = {
                model: config?.model || 'text-davinci-003',
                prompt,
                max_tokens: 256,
                temperature: 0.2
            };
            const result = await performHttpRequest('https://api.openai.com/v1/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify(body)
            });
            const reply = result.json?.choices?.[0]?.text || result.text;
            clone.payload = reply || '';
            clone.vars.lastAiResponse = result.json || result.text;
            clone.logs.push('OpenAI completion executed.');
        }
    },
    {
        id: 'ai-openai-embedding',
        name: 'AI: OpenAI embedding',
        description: 'Create embeddings for the payload using the OpenAI API.',
        icon: 'grid',
        accent: '#0ea5e9',
        defaultConfig: { apiKey: '', model: 'text-embedding-3-small' },
        form: [
            { key: 'apiKey', label: 'OpenAI API key', type: 'text', placeholder: 'sk-...' },
            { key: 'model', label: 'Model', type: 'text', placeholder: 'text-embedding-3-small' }
        ],
        handler: async (clone, config) => {
            const apiKey = String(config?.apiKey || '').trim();
            if (!apiKey) {
                clone.logs.push('OpenAI embedding skipped: missing API key.');
                return;
            }
            const body = {
                model: config?.model || 'text-embedding-3-small',
                input: ModuleUtils.ensureText(clone.payload)
            };
            const result = await performHttpRequest('https://api.openai.com/v1/embeddings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify(body)
            });
            const vector = result.json?.data?.[0]?.embedding || [];
            clone.payload = Array.isArray(vector) ? vector.join(', ') : result.text;
            clone.vars.lastAiResponse = result.json || result.text;
            clone.logs.push('OpenAI embedding generated.');
        }
    },
    {
        id: 'ai-huggingface-text',
        name: 'AI: Hugging Face text',
        description: 'Query a Hugging Face text generation model.',
        icon: 'feather',
        accent: '#f97316',
        defaultConfig: { apiKey: '', model: 'gpt2', prompt: 'Complete this: {{payload}}' },
        form: [
            { key: 'apiKey', label: 'Hugging Face token', type: 'text', placeholder: 'hf_...' },
            { key: 'model', label: 'Model', type: 'text', placeholder: 'gpt2' },
            { key: 'prompt', label: 'Prompt', type: 'textarea', rows: 3, placeholder: 'Complete this: {{payload}}' }
        ],
        handler: async (clone, config) => {
            const model = String(config?.model || 'gpt2').trim();
            const apiKey = String(config?.apiKey || '').trim();
            const prompt = ModuleUtils.ensureText(config?.prompt || 'Complete this: {{payload}}').replace('{{payload}}', ModuleUtils.ensureText(clone.payload));
            const headers = {
                'Content-Type': 'application/json'
            };
            if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
            const url = `https://api-inference.huggingface.co/models/${model}`;
            const result = await performHttpRequest(url, {
                method: 'POST',
                headers,
                body: JSON.stringify({ inputs: prompt })
            });
            let reply = result.text;
            if (Array.isArray(result.json) && result.json[0]?.generated_text) {
                reply = result.json[0].generated_text;
            }
            clone.payload = reply || '';
            clone.vars.lastAiResponse = result.json || result.text;
            clone.logs.push('Hugging Face text generation completed.');
        }
    },
    {
        id: 'ai-huggingface-image',
        name: 'AI: Hugging Face image',
        description: 'Generate an image and store it as a data URL.',
        icon: 'image',
        accent: '#22c55e',
        defaultConfig: { apiKey: '', model: 'stabilityai/stable-diffusion-2-1', prompt: 'A futuristic city skyline' },
        form: [
            { key: 'apiKey', label: 'Hugging Face token', type: 'text', placeholder: 'hf_...' },
            { key: 'model', label: 'Model', type: 'text', placeholder: 'stabilityai/stable-diffusion-2-1' },
            { key: 'prompt', label: 'Prompt', type: 'textarea', rows: 3, placeholder: 'A futuristic city skyline' }
        ],
        handler: async (clone, config) => {
            const model = String(config?.model || 'stabilityai/stable-diffusion-2-1').trim();
            const apiKey = String(config?.apiKey || '').trim();
            const prompt = ModuleUtils.ensureText(config?.prompt || ModuleUtils.ensureText(clone.payload));
            const headers = {
                'Content-Type': 'application/json'
            };
            if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
            const url = `https://api-inference.huggingface.co/models/${model}`;
            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify({ inputs: prompt })
            });
            if (!response.ok) {
                const text = await response.text();
                throw new Error(`Hugging Face error ${response.status}: ${text}`);
            }
            const buffer = Buffer.from(await response.arrayBuffer());
            const mime = response.headers.get('content-type') || 'image/png';
            clone.payload = `data:${mime};base64,${buffer.toString('base64')}`;
            clone.logs.push('Generated Hugging Face image.');
        }
    },
    {
        id: 'ai-generic-endpoint',
        name: 'AI: Generic endpoint',
        description: 'Call any AI-style HTTP endpoint with custom headers and body.',
        icon: 'cpu',
        accent: '#8b5cf6',
        defaultConfig: {
            url: 'https://example.com/api',
            method: 'POST',
            headers: '{"Content-Type":"application/json"}',
            body: '{"prompt":"{{payload}}"}',
            usePayloadWhenEmpty: 'false'
        },
        form: [
            { key: 'url', label: 'Endpoint URL', type: 'text', placeholder: 'https://example.com/api' },
            { key: 'method', label: 'HTTP method', type: 'text', placeholder: 'POST' },
            { key: 'headers', label: 'Headers (JSON)', type: 'textarea', rows: 3, placeholder: '{"Authorization":"Bearer"}' },
            { key: 'body', label: 'Request body', type: 'textarea', rows: 4, placeholder: '{"prompt":"{{payload}}"}' },
            { key: 'usePayloadWhenEmpty', label: 'Use payload if body empty (true/false)', type: 'text', placeholder: 'false' }
        ],
        handler: async (clone, config) => {
            const url = String(config?.url || '').trim();
            if (!url) {
                clone.logs.push('Generic AI call skipped: missing URL.');
                return;
            }
            const headers = parseHeaders(config?.headers);
            const method = (config?.method || 'POST').toUpperCase();
            let body = config?.body;
            if ((!body || body.trim() === '') && String(config?.usePayloadWhenEmpty || '').toLowerCase() === 'true') {
                body = ModuleUtils.ensureText(clone.payload);
            }
            const preparedBody = body ? body.replace('{{payload}}', ModuleUtils.ensureText(clone.payload)) : null;
            const result = await performHttpRequest(url, {
                method,
                headers,
                body: preparedBody ? ModuleUtils.ensureText(preparedBody) : undefined
            });
            if (result.json !== null) {
                clone.payload = ModuleUtils.formatJson(result.json);
                clone.vars.lastResponse = result.json;
            } else {
                clone.payload = result.text;
            }
            clone.logs.push(`Generic AI endpoint responded with ${result.response.status}.`);
        }
    }
];

registerActionModules(AiModuleDescriptors);


const AdditionalAiModuleDescriptors = [
    {
        id: 'ai-openai-chat-plus',
        name: 'AI: OpenAI chat (advanced)',
        description: 'Call the OpenAI Chat Completions API with custom prompts and store the reply.',
        icon: 'message-circle',
        accent: '#818cf8',
        defaultConfig: {
            endpoint: 'https://api.openai.com/v1/chat/completions',
            apiKey: '',
            model: 'gpt-4o-mini',
            systemPrompt: 'You are a helpful assistant that answers succinctly.',
            userPrompt: 'Please help with: {{payload}}'
        },
        form: [
            { key: 'endpoint', label: 'Endpoint URL', type: 'text', placeholder: 'https://api.openai.com/v1/chat/completions' },
            { key: 'apiKey', label: 'API key', type: 'text', placeholder: 'sk-...' },
            { key: 'model', label: 'Model', type: 'text', placeholder: 'gpt-4o-mini' },
            { key: 'systemPrompt', label: 'System prompt', type: 'textarea', rows: 2, placeholder: 'You are a helpful assistant.' },
            { key: 'userPrompt', label: 'User prompt', type: 'textarea', rows: 3, placeholder: 'Please help with: {{payload}}' }
        ],
        handler: async (clone, config) => {
            const apiKey = String(config?.apiKey || '').trim();
            if (!apiKey) {
                clone.logs.push('OpenAI chat skipped: missing API key.');
                return;
            }
            const endpoint = String(config?.endpoint || 'https://api.openai.com/v1/chat/completions');
            const systemPrompt = ModuleUtils.renderTemplate(config?.systemPrompt || '', { payload: clone.payload, vars: clone.vars });
            const userPrompt = ModuleUtils.renderTemplate(config?.userPrompt || ModuleUtils.ensureText(clone.payload), { payload: clone.payload, vars: clone.vars });
            const body = {
                model: config?.model || 'gpt-4o-mini',
                messages: []
            };
            if (systemPrompt) {
                body.messages.push({ role: 'system', content: systemPrompt });
            }
            body.messages.push({ role: 'user', content: userPrompt || ModuleUtils.ensureText(clone.payload) });
            try {
                const { json, text } = await performHttpRequest(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify(body)
                });
                const content = json?.choices?.[0]?.message?.content || text || '';
                clone.payload = content;
                clone.vars.lastAiResponse = json || text;
                clone.logs.push('OpenAI chat response received.');
            } catch (error) {
                clone.logs.push(`OpenAI chat failed: ${error.message}`);
            }
        }
    },
    {
        id: 'ai-openai-completion',
        name: 'AI: OpenAI text completion',
        description: 'Send a prompt to the legacy completions endpoint and store the text output.',
        icon: 'type',
        accent: '#38bdf8',
        defaultConfig: {
            endpoint: 'https://api.openai.com/v1/completions',
            apiKey: '',
            model: 'gpt-3.5-turbo-instruct',
            prompt: 'Rewrite in simpler words: {{payload}}',
            maxTokens: 256
        },
        form: [
            { key: 'endpoint', label: 'Endpoint URL', type: 'text', placeholder: 'https://api.openai.com/v1/completions' },
            { key: 'apiKey', label: 'API key', type: 'text', placeholder: 'sk-...' },
            { key: 'model', label: 'Model', type: 'text', placeholder: 'gpt-3.5-turbo-instruct' },
            { key: 'prompt', label: 'Prompt', type: 'textarea', rows: 3, placeholder: 'Rewrite in simpler words: {{payload}}' },
            { key: 'maxTokens', label: 'Max tokens', type: 'number' }
        ],
        handler: async (clone, config) => {
            const apiKey = String(config?.apiKey || '').trim();
            if (!apiKey) {
                clone.logs.push('OpenAI completion skipped: missing API key.');
                return;
            }
            const prompt = ModuleUtils.renderTemplate(config?.prompt || ModuleUtils.ensureText(clone.payload), { payload: clone.payload, vars: clone.vars });
            try {
                const { json, text } = await performHttpRequest(config?.endpoint || 'https://api.openai.com/v1/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model: config?.model || 'gpt-3.5-turbo-instruct',
                        prompt,
                        max_tokens: Number(config?.maxTokens ?? 256)
                    })
                });
                const content = json?.choices?.[0]?.text || text || '';
                clone.payload = content.trim();
                clone.vars.lastAiResponse = json || text;
                clone.logs.push('OpenAI completion returned text.');
            } catch (error) {
                clone.logs.push(`OpenAI completion failed: ${error.message}`);
            }
        }
    },
    {
        id: 'ai-openai-embeddings',
        name: 'AI: OpenAI embeddings',
        description: 'Generate an embedding vector and store it as JSON.',
        icon: 'grid',
        accent: '#facc15',
        defaultConfig: {
            endpoint: 'https://api.openai.com/v1/embeddings',
            apiKey: '',
            model: 'text-embedding-3-small',
            input: '{{payload}}'
        },
        form: [
            { key: 'endpoint', label: 'Endpoint URL', type: 'text', placeholder: 'https://api.openai.com/v1/embeddings' },
            { key: 'apiKey', label: 'API key', type: 'text', placeholder: 'sk-...' },
            { key: 'model', label: 'Model', type: 'text', placeholder: 'text-embedding-3-small' },
            { key: 'input', label: 'Input text', type: 'textarea', rows: 3, placeholder: '{{payload}}' }
        ],
        handler: async (clone, config) => {
            const apiKey = String(config?.apiKey || '').trim();
            if (!apiKey) {
                clone.logs.push('OpenAI embeddings skipped: missing API key.');
                return;
            }
            const input = ModuleUtils.renderTemplate(config?.input || ModuleUtils.ensureText(clone.payload), { payload: clone.payload, vars: clone.vars });
            try {
                const { json, text } = await performHttpRequest(config?.endpoint || 'https://api.openai.com/v1/embeddings', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model: config?.model || 'text-embedding-3-small',
                        input
                    })
                });
                if (json?.data?.[0]?.embedding) {
                    clone.payload = ModuleUtils.formatJson(json.data[0].embedding);
                    clone.vars.lastEmbedding = json.data[0].embedding;
                    clone.logs.push('OpenAI embedding generated.');
                } else {
                    clone.payload = text || '';
                    clone.logs.push('OpenAI embedding response stored as text.');
                }
            } catch (error) {
                clone.logs.push(`OpenAI embeddings failed: ${error.message}`);
            }
        }
    },
    {
        id: 'ai-openai-moderation',
        name: 'AI: OpenAI moderation',
        description: 'Send payload to the moderation endpoint and store the result.',
        icon: 'shield',
        accent: '#f87171',
        defaultConfig: {
            endpoint: 'https://api.openai.com/v1/moderations',
            apiKey: '',
            model: 'omni-moderation-latest',
            input: '{{payload}}'
        },
        form: [
            { key: 'endpoint', label: 'Endpoint URL', type: 'text', placeholder: 'https://api.openai.com/v1/moderations' },
            { key: 'apiKey', label: 'API key', type: 'text', placeholder: 'sk-...' },
            { key: 'model', label: 'Model', type: 'text', placeholder: 'omni-moderation-latest' },
            { key: 'input', label: 'Input text', type: 'textarea', rows: 3, placeholder: '{{payload}}' }
        ],
        handler: async (clone, config) => {
            const apiKey = String(config?.apiKey || '').trim();
            if (!apiKey) {
                clone.logs.push('OpenAI moderation skipped: missing API key.');
                return;
            }
            const input = ModuleUtils.renderTemplate(config?.input || ModuleUtils.ensureText(clone.payload), { payload: clone.payload, vars: clone.vars });
            try {
                const { json, text } = await performHttpRequest(config?.endpoint || 'https://api.openai.com/v1/moderations', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model: config?.model || 'omni-moderation-latest',
                        input
                    })
                });
                clone.payload = ModuleUtils.formatJson(json ?? text ?? '');
                clone.vars.lastModeration = json ?? text ?? '';
                clone.logs.push('OpenAI moderation response stored.');
            } catch (error) {
                clone.logs.push(`OpenAI moderation failed: ${error.message}`);
            }
        }
    },
    {
        id: 'ai-anthropic-messages',
        name: 'AI: Anthropic Claude',
        description: 'Call the Anthropic Messages API and store the assistant reply.',
        icon: 'sun',
        accent: '#fbbf24',
        defaultConfig: {
            endpoint: 'https://api.anthropic.com/v1/messages',
            apiKey: '',
            model: 'claude-3-haiku-20240307',
            systemPrompt: 'You are a concise assistant.',
            userPrompt: 'Analyse: {{payload}}'
        },
        form: [
            { key: 'endpoint', label: 'Endpoint URL', type: 'text', placeholder: 'https://api.anthropic.com/v1/messages' },
            { key: 'apiKey', label: 'API key', type: 'text', placeholder: 'sk-ant-...' },
            { key: 'model', label: 'Model', type: 'text', placeholder: 'claude-3-haiku-20240307' },
            { key: 'systemPrompt', label: 'System prompt', type: 'textarea', rows: 2, placeholder: 'You are a concise assistant.' },
            { key: 'userPrompt', label: 'User prompt', type: 'textarea', rows: 3, placeholder: 'Analyse: {{payload}}' }
        ],
        handler: async (clone, config) => {
            const apiKey = String(config?.apiKey || '').trim();
            if (!apiKey) {
                clone.logs.push('Anthropic request skipped: missing API key.');
                return;
            }
            const userPrompt = ModuleUtils.renderTemplate(config?.userPrompt || ModuleUtils.ensureText(clone.payload), { payload: clone.payload, vars: clone.vars });
            try {
                const { json, text } = await performHttpRequest(config?.endpoint || 'https://api.anthropic.com/v1/messages', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': apiKey,
                        'anthropic-version': '2023-06-01'
                    },
                    body: JSON.stringify({
                        model: config?.model || 'claude-3-haiku-20240307',
                        system: ModuleUtils.renderTemplate(config?.systemPrompt || '', { payload: clone.payload, vars: clone.vars }),
                        messages: [{ role: 'user', content: userPrompt }]
                    })
                });
                const reply = json?.content?.[0]?.text || text || '';
                clone.payload = reply;
                clone.vars.lastAiResponse = json || text;
                clone.logs.push('Anthropic reply received.');
            } catch (error) {
                clone.logs.push(`Anthropic call failed: ${error.message}`);
            }
        }
    },
    {
        id: 'ai-azure-openai-chat',
        name: 'AI: Azure OpenAI chat',
        description: 'Call an Azure OpenAI deployment with a chat prompt.',
        icon: 'cloud',
        accent: '#38bdf8',
        defaultConfig: {
            endpoint: 'https://example-resource.openai.azure.com/openai/deployments/my-deployment/chat/completions?api-version=2024-02-01',
            apiKey: '',
            userPrompt: 'Summarise: {{payload}}'
        },
        form: [
            { key: 'endpoint', label: 'Deployment URL', type: 'text', placeholder: 'https://resource.openai.azure.com/openai/.../chat/completions?api-version=...' },
            { key: 'apiKey', label: 'API key', type: 'text', placeholder: 'Azure key' },
            { key: 'userPrompt', label: 'User prompt', type: 'textarea', rows: 3, placeholder: 'Summarise: {{payload}}' }
        ],
        handler: async (clone, config) => {
            const apiKey = String(config?.apiKey || '').trim();
            if (!apiKey) {
                clone.logs.push('Azure OpenAI skipped: missing API key.');
                return;
            }
            const endpoint = String(config?.endpoint || '').trim();
            if (!endpoint) {
                clone.logs.push('Azure OpenAI skipped: missing endpoint.');
                return;
            }
            const prompt = ModuleUtils.renderTemplate(config?.userPrompt || ModuleUtils.ensureText(clone.payload), { payload: clone.payload, vars: clone.vars });
            try {
                const { json, text } = await performHttpRequest(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'api-key': apiKey
                    },
                    body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] })
                });
                const reply = json?.choices?.[0]?.message?.content || text || '';
                clone.payload = reply;
                clone.logs.push('Azure OpenAI responded.');
            } catch (error) {
                clone.logs.push(`Azure OpenAI failed: ${error.message}`);
            }
        }
    },
    {
        id: 'ai-cohere-generate',
        name: 'AI: Cohere generate',
        description: 'Send a prompt to Cohere generate endpoint and capture the text.',
        icon: 'feather',
        accent: '#f472b6',
        defaultConfig: {
            endpoint: 'https://api.cohere.ai/v1/generate',
            apiKey: '',
            model: 'command',
            prompt: 'Improve this text: {{payload}}'
        },
        form: [
            { key: 'endpoint', label: 'Endpoint URL', type: 'text', placeholder: 'https://api.cohere.ai/v1/generate' },
            { key: 'apiKey', label: 'API key', type: 'text', placeholder: 'cohere key' },
            { key: 'model', label: 'Model', type: 'text', placeholder: 'command' },
            { key: 'prompt', label: 'Prompt', type: 'textarea', rows: 3, placeholder: 'Improve this text: {{payload}}' }
        ],
        handler: async (clone, config) => {
            const apiKey = String(config?.apiKey || '').trim();
            if (!apiKey) {
                clone.logs.push('Cohere request skipped: missing API key.');
                return;
            }
            const prompt = ModuleUtils.renderTemplate(config?.prompt || ModuleUtils.ensureText(clone.payload), { payload: clone.payload, vars: clone.vars });
            try {
                const { json, text } = await performHttpRequest(config?.endpoint || 'https://api.cohere.ai/v1/generate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model: config?.model || 'command',
                        prompt
                    })
                });
                const reply = json?.generations?.[0]?.text || text || '';
                clone.payload = reply.trim();
                clone.logs.push('Cohere generation completed.');
            } catch (error) {
                clone.logs.push(`Cohere request failed: ${error.message}`);
            }
        }
    },
    {
        id: 'ai-replicate-prediction',
        name: 'AI: Replicate prediction',
        description: 'Trigger a Replicate model prediction and store the response payload.',
        icon: 'refresh-cw',
        accent: '#34d399',
        defaultConfig: {
            endpoint: 'https://api.replicate.com/v1/predictions',
            apiKey: '',
            version: '',
            inputJson: '{"prompt":"{{payload}}"}'
        },
        form: [
            { key: 'endpoint', label: 'Endpoint URL', type: 'text', placeholder: 'https://api.replicate.com/v1/predictions' },
            { key: 'apiKey', label: 'API token', type: 'text', placeholder: 'r8_' },
            { key: 'version', label: 'Model version', type: 'text', placeholder: 'replicate model version ID' },
            { key: 'inputJson', label: 'Input JSON', type: 'textarea', rows: 3, placeholder: '{"prompt":"{{payload}}"}' }
        ],
        handler: async (clone, config) => {
            const apiKey = String(config?.apiKey || '').trim();
            const version = String(config?.version || '').trim();
            if (!apiKey || !version) {
                clone.logs.push('Replicate skipped: missing API key or version.');
                return;
            }
            const inputJson = ModuleUtils.renderTemplate(config?.inputJson || '{}', { payload: clone.payload, vars: clone.vars });
            let parsedInput = ModuleUtils.safeJsonParse(inputJson);
            if (!parsedInput) {
                parsedInput = { prompt: ModuleUtils.ensureText(clone.payload) };
            }
            try {
                const { json, text } = await performHttpRequest(config?.endpoint || 'https://api.replicate.com/v1/predictions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({ version, input: parsedInput })
                });
                clone.payload = ModuleUtils.formatJson(json ?? text ?? '');
                clone.vars.lastAiResponse = json ?? text ?? '';
                clone.logs.push('Replicate prediction created.');
            } catch (error) {
                clone.logs.push(`Replicate request failed: ${error.message}`);
            }
        }
    },
    {
        id: 'ai-stability-text-image-lite',
        name: 'AI: Stability image (lite)',
        description: 'Send a prompt to Stability AI image API and store the image as base64.',
        icon: 'image',
        accent: '#f472b6',
        defaultConfig: {
            endpoint: 'https://api.stability.ai/v1/images/generations',
            apiKey: '',
            prompt: 'A concept illustration of {{payload}}'
        },
        form: [
            { key: 'endpoint', label: 'Endpoint URL', type: 'text', placeholder: 'https://api.stability.ai/v1/images/generations' },
            { key: 'apiKey', label: 'API key', type: 'text', placeholder: 'sk-stable...' },
            { key: 'prompt', label: 'Prompt', type: 'textarea', rows: 3, placeholder: 'A concept illustration of {{payload}}' }
        ],
        handler: async (clone, config) => {
            const apiKey = String(config?.apiKey || '').trim();
            if (!apiKey) {
                clone.logs.push('Stability request skipped: missing API key.');
                return;
            }
            const prompt = ModuleUtils.renderTemplate(config?.prompt || ModuleUtils.ensureText(clone.payload), { payload: clone.payload, vars: clone.vars });
            try {
                const response = await fetch(config?.endpoint || 'https://api.stability.ai/v1/images/generations', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({ text_prompts: [{ text: prompt }] })
                });
                if (!response.ok) {
                    const errText = await response.text();
                    throw new Error(`Stability error ${response.status}: ${errText}`);
                }
                const result = await response.json();
                const imageBase64 = result?.artifacts?.[0]?.base64;
                if (imageBase64) {
                    clone.payload = `data:image/png;base64,${imageBase64}`;
                    clone.logs.push('Stability image generated.');
                } else {
                    clone.payload = ModuleUtils.formatJson(result);
                    clone.logs.push('Stability responded without image, stored JSON.');
                }
            } catch (error) {
                clone.logs.push(`Stability request failed: ${error.message}`);
            }
        }
    },
    {
        id: 'ai-ollama-local',
        name: 'AI: Ollama local model',
        description: 'Send a prompt to a locally hosted Ollama model.',
        icon: 'cpu',
        accent: '#0ea5e9',
        defaultConfig: {
            endpoint: 'http://localhost:11434/api/generate',
            model: 'llama3',
            prompt: 'Summarise: {{payload}}'
        },
        form: [
            { key: 'endpoint', label: 'Endpoint URL', type: 'text', placeholder: 'http://localhost:11434/api/generate' },
            { key: 'model', label: 'Model', type: 'text', placeholder: 'llama3' },
            { key: 'prompt', label: 'Prompt', type: 'textarea', rows: 3, placeholder: 'Summarise: {{payload}}' }
        ],
        handler: async (clone, config) => {
            const endpoint = String(config?.endpoint || '').trim();
            if (!endpoint) {
                clone.logs.push('Ollama request skipped: missing endpoint.');
                return;
            }
            const prompt = ModuleUtils.renderTemplate(config?.prompt || ModuleUtils.ensureText(clone.payload), { payload: clone.payload, vars: clone.vars });
            try {
                const { json, text } = await performHttpRequest(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ model: config?.model || 'llama3', prompt })
                });
                if (json?.response) {
                    clone.payload = json.response;
                } else {
                    clone.payload = text || '';
                }
                clone.logs.push('Ollama response captured.');
            } catch (error) {
                clone.logs.push(`Ollama request failed: ${error.message}`);
            }
        }
    },
    {
        id: 'ai-custom-chain',
        name: 'AI: Custom pipeline',
        description: 'Call a sequence of two HTTP AI endpoints and merge their responses.',
        icon: 'git-merge',
        accent: '#f59e0b',
        defaultConfig: {
            firstUrl: 'https://example.com/step1',
            firstBody: '{"prompt":"{{payload}}"}',
            secondUrl: 'https://example.com/step2',
            secondBody: '{"data":{{step1}}}'
        },
        form: [
            { key: 'firstUrl', label: 'First endpoint', type: 'text', placeholder: 'https://example.com/step1' },
            { key: 'firstBody', label: 'First request body', type: 'textarea', rows: 3, placeholder: '{"prompt":"{{payload}}"}' },
            { key: 'secondUrl', label: 'Second endpoint', type: 'text', placeholder: 'https://example.com/step2' },
            { key: 'secondBody', label: 'Second request body', type: 'textarea', rows: 3, placeholder: '{"data":{{step1}}}' }
        ],
        handler: async (clone, config) => {
            const firstUrl = String(config?.firstUrl || '').trim();
            const secondUrl = String(config?.secondUrl || '').trim();
            if (!firstUrl || !secondUrl) {
                clone.logs.push('Custom pipeline skipped: missing endpoints.');
                return;
            }
            try {
                const firstBodyTemplate = ModuleUtils.renderTemplate(config?.firstBody || '{}', { payload: clone.payload, vars: clone.vars });
                const firstResult = await performHttpRequest(firstUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: firstBodyTemplate
                });
                const firstPayload = firstResult.json ?? ModuleUtils.safeJsonParse(firstResult.text) ?? firstResult.text;
                const secondBody = ModuleUtils.renderTemplate(config?.secondBody || '{}', {
                    payload: clone.payload,
                    vars: clone.vars,
                    extra: { step1: ModuleUtils.ensureText(typeof firstPayload === 'string' ? firstPayload : JSON.stringify(firstPayload)) }
                });
                const secondResult = await performHttpRequest(secondUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: secondBody
                });
                const combined = {
                    step1: firstResult.json ?? firstResult.text,
                    step2: secondResult.json ?? secondResult.text
                };
                clone.payload = ModuleUtils.formatJson(combined);
                clone.logs.push('Custom AI pipeline executed.');
            } catch (error) {
                clone.logs.push(`Custom pipeline failed: ${error.message}`);
            }
        }
    }
];

registerActionModules(AdditionalAiModuleDescriptors);

const UtilityModuleDescriptors = [
    {
        id: 'json-parse',
        name: 'Parse JSON',
        description: 'Parse the payload as JSON and store the object for later nodes.',
        icon: 'braces',
        accent: '#22c55e',
        defaultConfig: {},
        form: [],
        handler: async (clone) => {
            const parsed = ModuleUtils.safeJsonParse(clone.payload);
            if (parsed === null) {
                clone.logs.push('JSON parse failed. Payload left unchanged.');
                return;
            }
            clone.payload = parsed;
            clone.vars.lastJson = parsed;
            clone.logs.push('Parsed payload as JSON.');
        }
    },
    {
        id: 'json-stringify',
        name: 'Stringify JSON',
        description: 'Convert the payload to formatted JSON text.',
        icon: 'code',
        accent: '#0ea5e9',
        defaultConfig: {},
        form: [],
        handler: async (clone) => {
            clone.payload = ModuleUtils.formatJson(clone.payload);
            clone.logs.push('Converted payload to JSON string.');
        }
    },
    {
        id: 'json-get-path',
        name: 'Get JSON path',
        description: 'Extract a property from the payload using a dotted path.',
        icon: 'crosshair',
        accent: '#f97316',
        defaultConfig: { path: 'data.value' },
        form: [
            { key: 'path', label: 'Path (dot notation)', type: 'text', placeholder: 'data.value' }
        ],
        handler: async (clone, config) => {
            const pathKey = String(config?.path || '').trim();
            if (!pathKey) {
                clone.logs.push('JSON path skipped: missing path.');
                return;
            }
            const segments = pathKey.split('.');
            let target = typeof clone.payload === 'object' && clone.payload !== null ? clone.payload : ModuleUtils.safeJsonParse(clone.payload);
            for (const segment of segments) {
                if (target && typeof target === 'object' && segment in target) {
                    target = target[segment];
                } else {
                    target = undefined;
                    break;
                }
            }
            if (target === undefined) {
                clone.logs.push(`JSON path not found: ${pathKey}`);
                clone.payload = '';
            } else {
                clone.payload = target;
                clone.logs.push(`Extracted JSON path ${pathKey}.`);
            }
        }
    },
    {
        id: 'json-merge',
        name: 'Merge JSON',
        description: 'Merge JSON from the configuration into the payload object.',
        icon: 'layers',
        accent: '#facc15',
        defaultConfig: { json: '{"status":"processed"}' },
        form: [
            { key: 'json', label: 'JSON to merge', type: 'textarea', rows: 3, placeholder: '{"status":"processed"}' }
        ],
        handler: async (clone, config) => {
            const base = typeof clone.payload === 'object' && clone.payload !== null ? { ...clone.payload } : ModuleUtils.safeJsonParse(clone.payload) || {};
            const addition = ModuleUtils.safeJsonParse(config?.json);
            if (!addition || typeof addition !== 'object') {
                clone.logs.push('Merge skipped: invalid JSON input.');
                return;
            }
            clone.payload = { ...base, ...addition };
            clone.logs.push('Merged JSON into payload.');
        }
    },
    {
        id: 'payload-clear',
        name: 'Clear payload',
        description: 'Reset the payload to an empty string.',
        icon: 'eraser',
        accent: '#ef4444',
        defaultConfig: {},
        form: [],
        handler: async (clone) => {
            clone.payload = '';
            clone.logs.push('Cleared payload value.');
        }
    },
    {
        id: 'payload-ensure-array',
        name: 'Ensure array payload',
        description: 'Convert the payload into an array by splitting lines when needed.',
        icon: 'list',
        accent: '#3b82f6',
        defaultConfig: {},
        form: [],
        handler: async (clone) => {
            if (Array.isArray(clone.payload)) {
                clone.logs.push('Payload already an array.');
                return;
            }
            const lines = ModuleUtils.toLines(clone.payload);
            clone.payload = lines;
            clone.logs.push(`Converted payload to array with ${lines.length} items.`);
        }
    },
    {
        id: 'array-unique',
        name: 'Unique array items',
        description: 'Remove duplicate entries from an array or newline list.',
        icon: 'zap',
        accent: '#6366f1',
        defaultConfig: {},
        form: [],
        handler: async (clone) => {
            const values = Array.isArray(clone.payload) ? clone.payload : ModuleUtils.toLines(clone.payload);
            const unique = Array.from(new Set(values.filter(item => ModuleUtils.ensureText(item).trim() !== '')));
            clone.payload = Array.isArray(clone.payload) ? unique : unique.join('\\n');
            clone.logs.push(`Reduced to ${unique.length} unique entries.`);
        }
    },
    {
        id: 'math-evaluate',
        name: 'Evaluate expression',
        description: 'Evaluate a JavaScript expression using payload and workflow variables.',
        icon: 'percent',
        accent: '#22c55e',
        defaultConfig: { expression: 'payload.length' },
        form: [
            { key: 'expression', label: 'Expression', type: 'text', placeholder: 'payload.length' }
        ],
        handler: async (clone, config) => {
            const expression = String(config?.expression || '').trim();
            if (!expression) {
                clone.logs.push('Math evaluation skipped: missing expression.');
                return;
            }
            try {
                const fn = new Function('payload', 'vars', `return (${expression});`);
                const result = fn(clone.payload, clone.vars);
                clone.payload = result;
                clone.logs.push('Evaluated expression successfully.');
            } catch (error) {
                clone.logs.push(`Expression failed: ${error.message}`);
            }
        }
    },
    {
        id: 'random-number',
        name: 'Random number',
        description: 'Generate a random number between the configured bounds.',
        icon: 'dice',
        accent: '#f97316',
        defaultConfig: { min: 0, max: 100 },
        form: [
            { key: 'min', label: 'Minimum', type: 'number' },
            { key: 'max', label: 'Maximum', type: 'number' }
        ],
        handler: async (clone, config) => {
            const min = Number(config?.min ?? 0);
            const max = Number(config?.max ?? 100);
            const value = Math.random() * (max - min) + min;
            clone.payload = value;
            clone.logs.push(`Generated random number ${value.toFixed(2)}.`);
        }
    },
    {
        id: 'log-payload',
        name: 'Log payload',
        description: 'Append the current payload to the workflow log without changing it.',
        icon: 'align-left',
        accent: '#64748b',
        defaultConfig: {},
        form: [],
        handler: async (clone) => {
            clone.logs.push(`Payload snapshot: ${ModuleUtils.ensureText(clone.payload).slice(0, 80)}`);
        }
    },
    {
        id: 'get-variable',
        name: 'Get workflow variable',
        description: 'Load a saved workflow variable into the payload.',
        icon: 'database',
        accent: '#a855f7',
        defaultConfig: { key: 'name' },
        form: [
            { key: 'key', label: 'Variable name', type: 'text', placeholder: 'name' }
        ],
        handler: async (clone, config) => {
            const key = String(config?.key || '').trim();
            if (!key) {
                clone.logs.push('Get variable skipped: missing key.');
                return;
            }
            clone.payload = clone.vars[key] ?? '';
            clone.logs.push(`Loaded workflow variable ${key}.`);
        }
    }
];

registerUtilityModules(UtilityModuleDescriptors);


const AdvancedDataUtilityDescriptors = [
    {
        id: 'text-to-upper',
        name: 'Text: Uppercase',
        description: 'Convert the payload to uppercase characters.',
        icon: 'type',
        accent: '#2563eb',
        defaultConfig: {},
        form: [],
        handler: async (clone) => {
            const text = ModuleUtils.ensureText(clone.payload).toUpperCase();
            clone.payload = text;
            clone.logs.push('Converted payload to uppercase.');
        }
    },
    {
        id: 'text-to-lower',
        name: 'Text: Lowercase',
        description: 'Convert the payload to lowercase characters.',
        icon: 'type',
        accent: '#0ea5e9',
        defaultConfig: {},
        form: [],
        handler: async (clone) => {
            const text = ModuleUtils.ensureText(clone.payload).toLowerCase();
            clone.payload = text;
            clone.logs.push('Converted payload to lowercase.');
        }
    },
    {
        id: 'text-to-title',
        name: 'Text: Title case',
        description: 'Apply title casing to the payload.',
        icon: 'italic',
        accent: '#22d3ee',
        defaultConfig: {},
        form: [],
        handler: async (clone) => {
            clone.payload = toTitleCase(clone.payload);
            clone.logs.push('Applied title case to payload.');
        }
    },
    {
        id: 'text-to-sentence',
        name: 'Text: Sentence case',
        description: 'Convert the payload so sentences begin with uppercase letters.',
        icon: 'align-left',
        accent: '#14b8a6',
        defaultConfig: {},
        form: [],
        handler: async (clone) => {
            clone.payload = toSentenceCase(clone.payload);
            clone.logs.push('Applied sentence case to payload.');
        }
    },
    {
        id: 'text-reverse-characters',
        name: 'Text: Reverse characters',
        description: 'Reverse the characters inside the payload.',
        icon: 'refresh-ccw',
        accent: '#f97316',
        defaultConfig: {},
        form: [],
        handler: async (clone) => {
            const text = ModuleUtils.ensureText(clone.payload);
            clone.payload = text.split('').reverse().join('');
            clone.logs.push('Reversed payload characters.');
        }
    },
    {
        id: 'text-trim-whitespace',
        name: 'Text: Trim whitespace',
        description: 'Trim leading and trailing whitespace from the payload.',
        icon: 'scissors',
        accent: '#f59e0b',
        defaultConfig: {},
        form: [],
        handler: async (clone) => {
            clone.payload = ModuleUtils.ensureText(clone.payload).trim();
            clone.logs.push('Trimmed whitespace from payload.');
        }
    },
    {
        id: 'text-collapse-spaces',
        name: 'Text: Collapse spaces',
        description: 'Replace repeated whitespace with single spaces.',
        icon: 'minus',
        accent: '#6366f1',
        defaultConfig: {},
        form: [],
        handler: async (clone) => {
            clone.payload = ModuleUtils.ensureText(clone.payload).replace(/\s+/g, ' ').trim();
            clone.logs.push('Collapsed whitespace inside payload.');
        }
    },
    {
        id: 'text-remove-blank-lines',
        name: 'Text: Remove blank lines',
        description: 'Remove empty lines from the payload.',
        icon: 'trash',
        accent: '#ef4444',
        defaultConfig: {},
        form: [],
        handler: async (clone) => {
            const lines = ModuleUtils.toLines(clone.payload).filter(line => line.trim() !== '');
            clone.payload = lines.join('\\n');
            clone.logs.push(`Removed blank lines, ${lines.length} remain.`);
        }
    },
    {
        id: 'text-sort-lines-alpha',
        name: 'Text: Sort lines',
        description: 'Sort lines alphabetically, case insensitive.',
        icon: 'list',
        accent: '#4ade80',
        defaultConfig: {},
        form: [],
        handler: async (clone) => {
            const lines = ModuleUtils.toLines(clone.payload);
            const sorted = lines.slice().sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
            clone.payload = sorted.join('\\n');
            clone.logs.push('Sorted payload lines alphabetically.');
        }
    },
    {
        id: 'text-shuffle-lines',
        name: 'Text: Shuffle lines',
        description: 'Shuffle the order of lines randomly.',
        icon: 'shuffle',
        accent: '#f472b6',
        defaultConfig: {},
        form: [],
        handler: async (clone) => {
            const lines = ModuleUtils.toLines(clone.payload);
            clone.payload = shuffleArray(lines).join('\\n');
            clone.logs.push('Shuffled payload lines.');
        }
    },
    {
        id: 'text-dedent-lines',
        name: 'Text: Dedent lines',
        description: 'Remove shared indentation from all lines.',
        icon: 'corner-down-left',
        accent: '#8b5cf6',
        defaultConfig: {},
        form: [],
        handler: async (clone) => {
            const lines = ModuleUtils.toLines(clone.payload);
            const indents = lines
                .filter(line => line.trim() !== '')
                .map(line => line.match(/^\s*/)[0].length);
            const minIndent = indents.length ? Math.min(...indents) : 0;
            const trimmed = minIndent > 0 ? lines.map(line => line.slice(minIndent)) : lines;
            clone.payload = trimmed.join('\\n');
            clone.logs.push(`Removed ${minIndent} leading spaces from each line.`);
        }
    },
    {
        id: 'text-wrap-width',
        name: 'Text: Wrap width',
        description: 'Wrap the payload to a maximum line width.',
        icon: 'align-justify',
        accent: '#22c55e',
        defaultConfig: { width: 80 },
        form: [
            { key: 'width', label: 'Line width', type: 'number', min: 10 }
        ],
        handler: async (clone, config) => {
            const width = Number(config?.width ?? 80) || 80;
            clone.payload = wrapTextToWidth(clone.payload, width);
            clone.logs.push(`Wrapped payload to ${Math.max(10, Math.floor(width))} columns.`);
        }
    },
    {
        id: 'text-pad-lines',
        name: 'Text: Pad lines',
        description: 'Add a prefix and suffix to every line.',
        icon: 'code',
        accent: '#facc15',
        defaultConfig: { prefix: '', suffix: '' },
        form: [
            { key: 'prefix', label: 'Prefix', type: 'text', placeholder: '> ' },
            { key: 'suffix', label: 'Suffix', type: 'text', placeholder: '' }
        ],
        handler: async (clone, config) => {
            const prefix = ModuleUtils.ensureText(config?.prefix || '');
            const suffix = ModuleUtils.ensureText(config?.suffix || '');
            const lines = ModuleUtils.toLines(clone.payload).map(line => `${prefix}${line}${suffix}`);
            clone.payload = lines.join('\\n');
            clone.logs.push('Padded each line with prefix and suffix.');
        }
    },
    {
        id: 'text-split-chunks',
        name: 'Text: Split into chunks',
        description: 'Split the payload into fixed-length chunks separated by newlines.',
        icon: 'grid',
        accent: '#0ea5e9',
        defaultConfig: { chunkSize: 120 },
        form: [
            { key: 'chunkSize', label: 'Chunk size', type: 'number', min: 10 }
        ],
        handler: async (clone, config) => {
            const size = Math.max(10, parseInt(config?.chunkSize, 10) || 120);
            const text = ModuleUtils.ensureText(clone.payload);
            const chunks = [];
            for (let i = 0; i < text.length; i += size) {
                chunks.push(text.slice(i, i + size));
            }
            clone.payload = chunks.join('\\n');
            clone.logs.push(`Split payload into ${chunks.length} chunks of ${size} characters.`);
        }
    },
    {
        id: 'json-flatten-object',
        name: 'JSON: Flatten object',
        description: 'Flatten nested JSON objects into dot notation keys.',
        icon: 'layers',
        accent: '#10b981',
        defaultConfig: {},
        form: [],
        handler: async (clone) => {
            const source = typeof clone.payload === 'object' && clone.payload !== null
                ? clone.payload
                : ModuleUtils.safeJsonParse(clone.payload);
            if (!source || typeof source !== 'object') {
                clone.logs.push('Flatten skipped: payload is not JSON.');
                return;
            }
            const flattened = flattenObject(source);
            clone.payload = ModuleUtils.formatJson(flattened);
            clone.logs.push(`Flattened JSON into ${Object.keys(flattened).length} keys.`);
        }
    },
    {
        id: 'json-to-csv-table',
        name: 'JSON: Convert to CSV',
        description: 'Convert an array of JSON objects into CSV text.',
        icon: 'table',
        accent: '#6366f1',
        defaultConfig: {},
        form: [],
        handler: async (clone) => {
            const parsed = Array.isArray(clone.payload)
                ? clone.payload
                : ModuleUtils.safeJsonParse(clone.payload);
            const rows = Array.isArray(parsed) ? parsed : (parsed && typeof parsed === 'object' ? [parsed] : null);
            if (!rows || !rows.length) {
                clone.logs.push('CSV conversion skipped: payload is not an array.');
                return;
            }
            const headers = Array.from(new Set(rows.flatMap(item => Object.keys(item || {}))));
            const values = rows.map(item => headers.map(header => (item && item[header] !== undefined ? item[header] : '')));
            clone.payload = csvStringify(headers, values);
            clone.logs.push(`Converted JSON to CSV with ${rows.length} rows.`);
        }
    },
    {
        id: 'csv-to-json-array',
        name: 'CSV: Convert to JSON',
        description: 'Parse CSV text into an array of JSON objects.',
        icon: 'file',
        accent: '#f472b6',
        defaultConfig: {},
        form: [],
        handler: async (clone) => {
            const { headers, rows } = parseCsv(clone.payload);
            if (!headers.length) {
                clone.logs.push('CSV parse skipped: missing header row.');
                return;
            }
            const objects = rows.map(row => {
                const obj = {};
                headers.forEach((header, index) => {
                    obj[header] = row[index] ?? '';
                });
                return obj;
            });
            clone.payload = ModuleUtils.formatJson(objects);
            clone.logs.push(`Parsed CSV into ${objects.length} objects.`);
        }
    },
    {
        id: 'html-strip-tags',
        name: 'HTML: Strip tags',
        description: 'Remove HTML tags and return plain text.',
        icon: 'file-text',
        accent: '#fb7185',
        defaultConfig: {},
        form: [],
        handler: async (clone) => {
            clone.payload = stripHtmlTags(clone.payload);
            clone.logs.push('Stripped HTML tags from payload.');
        }
    },
    {
        id: 'markdown-table-to-json',
        name: 'Markdown: Table to JSON',
        description: 'Convert a Markdown table into an array of JSON objects.',
        icon: 'grid',
        accent: '#06b6d4',
        defaultConfig: {},
        form: [],
        handler: async (clone) => {
            const lines = ModuleUtils.toLines(clone.payload).filter(line => line.trim().startsWith('|'));
            if (lines.length < 2) {
                clone.logs.push('Markdown parse skipped: table not detected.');
                return;
            }
            const headerCells = lines[0].split('|').map(cell => cell.trim()).filter(Boolean);
            const dataLines = lines.slice(2);
            const objects = dataLines.map(line => {
                const cells = line.split('|').map(cell => cell.trim()).filter(Boolean);
                const record = {};
                headerCells.forEach((header, index) => {
                    record[header] = cells[index] ?? '';
                });
                return record;
            });
            clone.payload = ModuleUtils.formatJson(objects);
            clone.logs.push(`Converted Markdown table with ${objects.length} rows.`);
        }
    }
];

registerUtilityModules(AdvancedDataUtilityDescriptors, { accent: '#2563eb', icon: 'sliders' });


const WorkflowAutomationUtilityDescriptors = [
    {
        id: 'automation-delay',
        name: 'Automation: Delay',
        description: 'Pause the workflow for the specified number of milliseconds.',
        icon: 'clock',
        accent: '#f97316',
        defaultConfig: { milliseconds: 500 },
        form: [
            { key: 'milliseconds', label: 'Delay (ms)', type: 'number', min: 0 }
        ],
        handler: async (clone, config) => {
            const ms = Math.max(0, parseInt(config?.milliseconds, 10) || 0);
            if (ms > 0) {
                await new Promise(resolve => setTimeout(resolve, ms));
            }
            clone.logs.push(`Delayed workflow for ${ms} ms.`);
        }
    },
    {
        id: 'automation-repeat',
        name: 'Automation: Repeat text',
        description: 'Repeat the payload text a number of times with an optional separator.',
        icon: 'repeat',
        accent: '#22c55e',
        defaultConfig: { times: 2, separator: '\n' },
        form: [
            { key: 'times', label: 'Times', type: 'number', min: 1 },
            { key: 'separator', label: 'Separator', type: 'text', placeholder: '\n' }
        ],
        handler: async (clone, config) => {
            const times = Math.max(1, parseInt(config?.times, 10) || 1);
            const separator = config?.separator !== undefined ? ModuleUtils.ensureText(config.separator) : '
';
            const payload = ModuleUtils.ensureText(clone.payload);
            clone.payload = Array(times).fill(payload).join(separator);
            clone.logs.push(`Repeated payload ${times} times.`);
        }
    },
    {
        id: 'automation-default-variable',
        name: 'Automation: Default variable',
        description: 'Ensure a workflow variable has a default value if not set.',
        icon: 'settings',
        accent: '#0ea5e9',
        defaultConfig: { key: 'status', value: 'ready' },
        form: [
            { key: 'key', label: 'Variable name', type: 'text', placeholder: 'status' },
            { key: 'value', label: 'Default value', type: 'text', placeholder: 'ready' }
        ],
        handler: async (clone, config) => {
            const key = String(config?.key || '').trim();
            if (!key) {
                clone.logs.push('Default variable skipped: missing key.');
                return;
            }
            if (clone.vars[key] === undefined) {
                clone.vars[key] = config?.value ?? '';
                clone.logs.push(`Initialized variable ${key}.`);
            } else {
                clone.logs.push(`Variable ${key} already set.`);
            }
        }
    },
    {
        id: 'automation-append-variable',
        name: 'Automation: Append to variable',
        description: 'Append the payload to a workflow variable separated by a delimiter.',
        icon: 'plus',
        accent: '#f59e0b',
        defaultConfig: { key: 'log', separator: '\n' },
        form: [
            { key: 'key', label: 'Variable name', type: 'text', placeholder: 'log' },
            { key: 'separator', label: 'Separator', type: 'text', placeholder: '\n' }
        ],
        handler: async (clone, config) => {
            const key = String(config?.key || '').trim();
            if (!key) {
                clone.logs.push('Append variable skipped: missing key.');
                return;
            }
            const separator = config?.separator !== undefined ? ModuleUtils.ensureText(config.separator) : '
';
            const existing = ModuleUtils.ensureText(clone.vars[key] ?? '');
            const addition = ModuleUtils.ensureText(clone.payload);
            clone.vars[key] = existing ? `${existing}${separator}${addition}` : addition;
            clone.logs.push(`Appended payload to variable ${key}.`);
        }
    },
    {
        id: 'automation-increment-variable',
        name: 'Automation: Increment counter',
        description: 'Increment a numeric workflow variable by a given step.',
        icon: 'trending-up',
        accent: '#a855f7',
        defaultConfig: { key: 'counter', step: 1 },
        form: [
            { key: 'key', label: 'Variable name', type: 'text', placeholder: 'counter' },
            { key: 'step', label: 'Step', type: 'number' }
        ],
        handler: async (clone, config) => {
            const key = String(config?.key || '').trim();
            if (!key) {
                clone.logs.push('Increment skipped: missing key.');
                return;
            }
            const step = Number(config?.step ?? 1) || 1;
            const current = Number(clone.vars[key] ?? 0) || 0;
            const next = current + step;
            clone.vars[key] = next;
            clone.payload = next;
            clone.logs.push(`Incremented ${key} to ${next}.`);
        }
    },
    {
        id: 'automation-record-timestamp',
        name: 'Automation: Record timestamp',
        description: 'Store the current timestamp in ISO or locale format.',
        icon: 'calendar',
        accent: '#22c55e',
        defaultConfig: { key: 'timestamp', format: 'iso' },
        form: [
            { key: 'key', label: 'Variable name', type: 'text', placeholder: 'timestamp' },
            { key: 'format', label: 'Format (iso/locale)', type: 'text', placeholder: 'iso' }
        ],
        handler: async (clone, config) => {
            const key = String(config?.key || '').trim();
            if (!key) {
                clone.logs.push('Timestamp skipped: missing key.');
                return;
            }
            const now = new Date();
            const format = String(config?.format || 'iso').toLowerCase();
            const value = format === 'locale' ? now.toLocaleString() : now.toISOString();
            clone.vars[key] = value;
            clone.logs.push(`Stored timestamp ${value} in ${key}.`);
        }
    },
    {
        id: 'automation-assert-not-empty',
        name: 'Automation: Assert not empty',
        description: 'Ensure the payload contains text and log a warning if it does not.',
        icon: 'alert-triangle',
        accent: '#ef4444',
        defaultConfig: {},
        form: [],
        handler: async (clone) => {
            if (ModuleUtils.ensureText(clone.payload).trim() === '') {
                clone.logs.push('Assertion failed: payload is empty.');
            } else {
                clone.logs.push('Assertion passed: payload is not empty.');
            }
        }
    },
    {
        id: 'automation-assert-contains',
        name: 'Automation: Assert contains text',
        description: 'Check whether the payload contains a specific substring.',
        icon: 'search',
        accent: '#38bdf8',
        defaultConfig: { phrase: '' },
        form: [
            { key: 'phrase', label: 'Phrase', type: 'text', placeholder: 'keyword' }
        ],
        handler: async (clone, config) => {
            const phrase = ModuleUtils.ensureText(config?.phrase || '');
            if (!phrase) {
                clone.logs.push('Contains check skipped: missing phrase.');
                return;
            }
            const text = ModuleUtils.ensureText(clone.payload);
            const includes = text.includes(phrase);
            clone.logs.push(includes ? `Payload contains "${phrase}".` : `Payload missing "${phrase}".`);
        }
    },
    {
        id: 'automation-count-lines',
        name: 'Automation: Count lines',
        description: 'Count the number of lines in the payload and store it as the payload.',
        icon: 'hash',
        accent: '#0ea5e9',
        defaultConfig: {},
        form: [],
        handler: async (clone) => {
            const lines = ModuleUtils.toLines(clone.payload);
            clone.payload = lines.length;
            clone.logs.push(`Counted ${lines.length} lines.`);
        }
    },
    {
        id: 'automation-payload-length',
        name: 'Automation: Payload length',
        description: 'Measure the payload length in characters and expose it.',
        icon: 'bar-chart-2',
        accent: '#6366f1',
        defaultConfig: {},
        form: [],
        handler: async (clone) => {
            const length = ModuleUtils.ensureText(clone.payload).length;
            clone.payload = length;
            clone.logs.push(`Payload length is ${length} characters.`);
        }
    },
    {
        id: 'automation-toggle-flag',
        name: 'Automation: Toggle flag',
        description: 'Toggle a boolean workflow flag and expose the current value.',
        icon: 'toggle-right',
        accent: '#f59e0b',
        defaultConfig: { key: 'flag' },
        form: [
            { key: 'key', label: 'Variable name', type: 'text', placeholder: 'flag' }
        ],
        handler: async (clone, config) => {
            const key = String(config?.key || '').trim();
            if (!key) {
                clone.logs.push('Toggle flag skipped: missing key.');
                return;
            }
            const current = Boolean(clone.vars[key]);
            const next = !current;
            clone.vars[key] = next;
            clone.payload = next;
            clone.logs.push(`Toggled ${key} to ${next}.`);
        }
    },
    {
        id: 'automation-remember-history',
        name: 'Automation: Remember history',
        description: 'Store the payload in an array variable keeping the latest entries.',
        icon: 'archive',
        accent: '#fb7185',
        defaultConfig: { key: 'history', limit: 20 },
        form: [
            { key: 'key', label: 'Variable name', type: 'text', placeholder: 'history' },
            { key: 'limit', label: 'Max items', type: 'number', min: 1 }
        ],
        handler: async (clone, config) => {
            const key = String(config?.key || '').trim();
            if (!key) {
                clone.logs.push('History skipped: missing key.');
                return;
            }
            const limit = Math.max(1, parseInt(config?.limit, 10) || 20);
            const list = Array.isArray(clone.vars[key]) ? clone.vars[key] : [];
            list.push(clone.payload);
            while (list.length > limit) {
                list.shift();
            }
            clone.vars[key] = list;
            clone.logs.push(`Stored payload in ${key}. Items: ${list.length}/${limit}.`);
        }
    }
];

registerUtilityModules(WorkflowAutomationUtilityDescriptors, { accent: '#f97316', icon: 'settings' });


const TextTransformDescriptorsPart1 = [
    {
        id: 'text-trim-lines',
        name: 'Trim blank lines',
        description: 'Remove empty lines at the start and end of the payload.',
        icon: 'chevron-up',
        accent: '#38bdf8',
        defaultConfig: {},
        form: [],
        handler: async (clone) => {
            const lines = ModuleUtils.toLines(clone.payload);
            while (lines.length && !ModuleUtils.ensureText(lines[0]).trim()) lines.shift();
            while (lines.length && !ModuleUtils.ensureText(lines[lines.length - 1]).trim()) lines.pop();
            clone.payload = lines.join('\\n');
            clone.logs.push('Trimmed blank lines.');
        }
    },
    {
        id: 'text-remove-empty-lines',
        name: 'Remove empty lines',
        description: 'Strip all empty lines from the payload.',
        icon: 'minus',
        accent: '#22c55e',
        defaultConfig: {},
        form: [],
        handler: async (clone) => {
            const lines = ModuleUtils.toLines(clone.payload).filter(line => ModuleUtils.ensureText(line).trim() !== '');
            clone.payload = lines.join('\\n');
            clone.logs.push('Removed empty lines.');
        }
    },
    {
        id: 'text-deduplicate-lines',
        name: 'Deduplicate lines',
        description: 'Keep only the first occurrence of each line.',
        icon: 'filter',
        accent: '#f97316',
        defaultConfig: {},
        form: [],
        handler: async (clone) => {
            const lines = ModuleUtils.toLines(clone.payload);
            const unique = Array.from(new Set(lines));
            clone.payload = unique.join('\\n');
            clone.logs.push(`Reduced to ${unique.length} unique lines.`);
        }
    },
    {
        id: 'text-sort-lines',
        name: 'Sort lines',
        description: 'Sort lines alphabetically.',
        icon: 'arrow-down',
        accent: '#a855f7',
        defaultConfig: {},
        form: [],
        handler: async (clone) => {
            const lines = ModuleUtils.toLines(clone.payload).sort((a, b) => a.localeCompare(b));
            clone.payload = lines.join('\\n');
            clone.logs.push('Sorted lines alphabetically.');
        }
    },
    {
        id: 'text-reverse-lines',
        name: 'Reverse lines',
        description: 'Reverse the order of lines.',
        icon: 'repeat',
        accent: '#14b8a6',
        defaultConfig: {},
        form: [],
        handler: async (clone) => {
            const lines = ModuleUtils.toLines(clone.payload).reverse();
            clone.payload = lines.join('\\n');
            clone.logs.push('Reversed line order.');
        }
    },
    {
        id: 'text-limit-lines',
        name: 'Limit lines',
        description: 'Keep only the first N lines of the payload.',
        icon: 'corner-down-right',
        accent: '#ef4444',
        defaultConfig: { count: 5 },
        form: [
            { key: 'count', label: 'Number of lines', type: 'number', min: 1 }
        ],
        handler: async (clone, config) => {
            const count = Math.max(1, parseInt(config?.count, 10) || 5);
            const lines = ModuleUtils.toLines(clone.payload).slice(0, count);
            clone.payload = lines.join('\\n');
            clone.logs.push(`Limited to ${lines.length} lines.`);
        }
    },
    {
        id: 'text-keep-last-lines',
        name: 'Keep last lines',
        description: 'Retain only the last N lines of the payload.',
        icon: 'corner-up-left',
        accent: '#0ea5e9',
        defaultConfig: { count: 5 },
        form: [
            { key: 'count', label: 'Number of lines', type: 'number', min: 1 }
        ],
        handler: async (clone, config) => {
            const count = Math.max(1, parseInt(config?.count, 10) || 5);
            const lines = ModuleUtils.toLines(clone.payload);
            clone.payload = lines.slice(-count).join('\\n');
            clone.logs.push(`Kept last ${Math.min(lines.length, count)} lines.`);
        }
    },
    {
        id: 'text-add-prefix',
        name: 'Add prefix',
        description: 'Add a prefix to every line of the payload.',
        icon: 'corner-right-down',
        accent: '#6366f1',
        defaultConfig: { prefix: '> ' },
        form: [
            { key: 'prefix', label: 'Prefix', type: 'text', placeholder: '> ' }
        ],
        handler: async (clone, config) => {
            const prefix = config?.prefix ?? '> ';
            const lines = ModuleUtils.toLines(clone.payload).map(line => `${prefix}${line}`);
            clone.payload = lines.join('\\n');
            clone.logs.push('Added prefix to lines.');
        }
    },
    {
        id: 'text-add-suffix',
        name: 'Add suffix',
        description: 'Add a suffix to every line of the payload.',
        icon: 'corner-left-up',
        accent: '#facc15',
        defaultConfig: { suffix: ' ✔' },
        form: [
            { key: 'suffix', label: 'Suffix', type: 'text', placeholder: ' ✔' }
        ],
        handler: async (clone, config) => {
            const suffix = config?.suffix ?? ' ✔';
            const lines = ModuleUtils.toLines(clone.payload).map(line => `${line}${suffix}`);
            clone.payload = lines.join('\\n');
            clone.logs.push('Added suffix to lines.');
        }
    },
    {
        id: 'text-wrap-text',
        name: 'Wrap text',
        description: 'Wrap the payload with a prefix and suffix.',
        icon: 'square',
        accent: '#22c55e',
        defaultConfig: { prefix: '"', suffix: '"' },
        form: [
            { key: 'prefix', label: 'Prefix', type: 'text', placeholder: '"' },
            { key: 'suffix', label: 'Suffix', type: 'text', placeholder: '"' }
        ],
        handler: async (clone, config) => {
            const prefix = config?.prefix ?? '"';
            const suffix = config?.suffix ?? '"';
            clone.payload = `${prefix}${ModuleUtils.ensureText(clone.payload)}${suffix}`;
            clone.logs.push('Wrapped payload with prefix and suffix.');
        }
    },
    {
        id: 'text-replace-text',
        name: 'Replace text',
        description: 'Replace exact text matches within the payload.',
        icon: 'replace',
        accent: '#f97316',
        defaultConfig: { search: 'foo', replace: 'bar' },
        form: [
            { key: 'search', label: 'Search for', type: 'text', placeholder: 'foo' },
            { key: 'replace', label: 'Replace with', type: 'text', placeholder: 'bar' }
        ],
        handler: async (clone, config) => {
            const search = config?.search ?? '';
            const replace = config?.replace ?? '';
            clone.payload = ModuleUtils.ensureText(clone.payload).split(search).join(replace);
            clone.logs.push('Replaced occurrences of text.');
        }
    },
    {
        id: 'text-regex-replace',
        name: 'Regex replace',
        description: 'Replace text using a regular expression.',
        icon: 'hash',
        accent: '#8b5cf6',
        defaultConfig: { pattern: '(\d+)', replace: '#$1' },
        form: [
            { key: 'pattern', label: 'Pattern', type: 'text', placeholder: '(\d+)' },
            { key: 'replace', label: 'Replace with', type: 'text', placeholder: '#$1' }
        ],
        handler: async (clone, config) => {
            try {
                const regex = new RegExp(config?.pattern || '', 'g');
                clone.payload = ModuleUtils.ensureText(clone.payload).replace(regex, config?.replace ?? '');
                clone.logs.push('Applied regex replacement.');
            } catch (error) {
                clone.logs.push(`Regex replace failed: ${error.message}`);
            }
        }
    }
];

registerUtilityModules(TextTransformDescriptorsPart1, { accent: '#0ea5e9', icon: 'type' });


const TextTransformDescriptorsPart2 = [
    {
        id: 'text-regex-extract',
        name: 'Regex extract',
        description: 'Extract matches from the payload using a regular expression.',
        icon: 'target',
        accent: '#22c55e',
        defaultConfig: { pattern: '(https?:\/\/\S+)', mode: 'all' },
        form: [
            { key: 'pattern', label: 'Pattern', type: 'text', placeholder: '(https?:\/\/\S+)' },
            { key: 'mode', label: 'Mode (first/all)', type: 'text', placeholder: 'all' }
        ],
        handler: async (clone, config) => {
            try {
                const regex = new RegExp(config?.pattern || '', 'g');
                const matches = ModuleUtils.ensureText(clone.payload).match(regex) || [];
                clone.payload = (config?.mode || 'all') === 'first' ? (matches[0] || '') : matches.join('\n');
                clone.logs.push(`Extracted ${matches.length} matches.`);
            } catch (error) {
                clone.logs.push(`Regex extract failed: ${error.message}`);
            }
        }
    },
    {
        id: 'text-extract-urls',
        name: 'Extract URLs',
        description: 'Find all URLs in the payload.',
        icon: 'link',
        accent: '#0ea5e9',
        defaultConfig: {},
        form: [],
        handler: async (clone) => {
            const matches = ModuleUtils.ensureText(clone.payload).match(/https?:\/\/[^\s]+/g) || [];
            clone.payload = matches.join('\n');
            clone.logs.push(`Found ${matches.length} URLs.`);
        }
    },
    {
        id: 'text-extract-emails',
        name: 'Extract emails',
        description: 'Find all email addresses in the payload.',
        icon: 'mail',
        accent: '#f97316',
        defaultConfig: {},
        form: [],
        handler: async (clone) => {
            const matches = ModuleUtils.ensureText(clone.payload).match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) || [];
            clone.payload = matches.join('\n');
            clone.logs.push(`Found ${matches.length} email addresses.`);
        }
    },
    {
        id: 'text-count-words',
        name: 'Count words',
        description: 'Count the number of words in the payload.',
        icon: 'type',
        accent: '#6366f1',
        defaultConfig: {},
        form: [],
        handler: async (clone) => {
            const words = ModuleUtils.ensureText(clone.payload).trim().split(/\s+/).filter(Boolean);
            clone.payload = String(words.length);
            clone.logs.push(`Counted ${words.length} words.`);
        }
    },
    {
        id: 'text-count-characters',
        name: 'Count characters',
        description: 'Count the number of characters in the payload.',
        icon: 'hash',
        accent: '#a855f7',
        defaultConfig: {},
        form: [],
        handler: async (clone) => {
            const length = ModuleUtils.ensureText(clone.payload).length;
            clone.payload = String(length);
            clone.logs.push(`Counted ${length} characters.`);
        }
    },
    {
        id: 'text-slugify',
        name: 'Slugify text',
        description: 'Convert the payload into a URL-friendly slug.',
        icon: 'minus',
        accent: '#22c55e',
        defaultConfig: {},
        form: [],
        handler: async (clone) => {
            clone.payload = ModuleUtils.slugify(clone.payload);
            clone.logs.push('Converted text to slug.');
        }
    },
    {
        id: 'text-base64-encode',
        name: 'Base64 encode',
        description: 'Encode the payload as base64 text.',
        icon: 'shield',
        accent: '#38bdf8',
        defaultConfig: {},
        form: [],
        handler: async (clone) => {
            clone.payload = Buffer.from(ModuleUtils.ensureText(clone.payload), 'utf8').toString('base64');
            clone.logs.push('Encoded payload to base64.');
        }
    },
    {
        id: 'text-base64-decode',
        name: 'Base64 decode',
        description: 'Decode base64 text into UTF-8.',
        icon: 'unlock',
        accent: '#f97316',
        defaultConfig: {},
        form: [],
        handler: async (clone) => {
            try {
                clone.payload = Buffer.from(ModuleUtils.ensureText(clone.payload).trim(), 'base64').toString('utf8');
                clone.logs.push('Decoded base64 payload.');
            } catch (error) {
                clone.logs.push('Base64 decode failed.');
                clone.payload = '';
            }
        }
    },
    {
        id: 'text-hash-sha256',
        name: 'SHA-256 hash',
        description: 'Generate a SHA-256 hash of the payload.',
        icon: 'shield-off',
        accent: '#facc15',
        defaultConfig: {},
        form: [],
        handler: async (clone) => {
            clone.payload = ModuleUtils.hash(clone.payload, 'sha256');
            clone.logs.push('Generated SHA-256 hash.');
        }
    },
    {
        id: 'text-generate-uuid',
        name: 'Generate UUID',
        description: 'Generate a random UUID and store it as the payload.',
        icon: 'aperture',
        accent: '#ef4444',
        defaultConfig: {},
        form: [],
        handler: async (clone) => {
            const uuid = crypto.randomUUID ? crypto.randomUUID() : ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c => (c ^ crypto.randomBytes(1)[0] & 15 >> c / 4).toString(16));
            clone.payload = uuid;
            clone.logs.push('Generated UUID.');
        }
    },
    {
        id: 'text-truncate',
        name: 'Truncate text',
        description: 'Limit the payload to a maximum number of characters.',
        icon: 'crop',
        accent: '#14b8a6',
        defaultConfig: { maxLength: 120 },
        form: [
            { key: 'maxLength', label: 'Max length', type: 'number', min: 1 }
        ],
        handler: async (clone, config) => {
            const maxLength = Math.max(1, parseInt(config?.maxLength, 10) || 120);
            const text = ModuleUtils.ensureText(clone.payload);
            clone.payload = text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
            clone.logs.push(`Truncated payload to ${maxLength} characters.`);
        }
    },
    {
        id: 'text-extract-domain',
        name: 'Extract domain',
        description: 'Extract the first domain name from the payload.',
        icon: 'globe',
        accent: '#6366f1',
        defaultConfig: {},
        form: [],
        handler: async (clone) => {
            const match = ModuleUtils.ensureText(clone.payload).match(/https?:\/\/([^\s\/]+)/i);
            clone.payload = match ? match[1] : '';
            clone.logs.push('Extracted domain from payload.');
        }
    }
];

registerUtilityModules(TextTransformDescriptorsPart2, { accent: '#38bdf8', icon: 'type' });

    }
];

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
            button.title = description ? `${title}\n${description}` : title;

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
    moduleSearchQuery: '',
    blockExplorerWindow: null,
    blockExplorerSelectedId: null,

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
            moduleSearchInput: Utils.getElement('#builder-module-search'),
            globalSearchInput: Utils.getElement('#builder-global-search'),
            openBlockExplorer: Utils.getElement('#builder-open-block-explorer')
        };

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

    setModuleSearchQuery(value = '', { skipExplorerSync = false } = {}) {
        const normalized = value || '';
        if (this.moduleSearchQuery === normalized) {
            this.syncSearchInputs(normalized);
            return;
        }
        this.moduleSearchQuery = normalized;
        this.syncSearchInputs(normalized);
        this.renderModuleList();
        if (!skipExplorerSync && this.blockExplorerWindow && !this.blockExplorerWindow.closed) {
            try {
                this.blockExplorerWindow.postMessage({ type: 'builder-search', query: normalized }, '*');
            } catch (error) {
                console.warn('Failed to sync block explorer search', error);
            }
        }
    },

    syncSearchInputs(value = this.moduleSearchQuery) {
        if (this.elements.moduleSearchInput && this.elements.moduleSearchInput.value !== value) {
            this.elements.moduleSearchInput.value = value;
        }
        if (this.elements.globalSearchInput && this.elements.globalSearchInput.value !== value) {
            this.elements.globalSearchInput.value = value;
        }
    },

    updateModuleSearchFromExplorer(value = '') {
        this.setModuleSearchQuery(value, { skipExplorerSync: true });
    },

    setBlockExplorerSelection(id = null) {
        this.blockExplorerSelectedId = id || null;
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

        if (this.elements.moduleSearchInput) {
            const onSearchInput = Utils.debounce((event) => {
                this.setModuleSearchQuery(event.target.value || '');
            }, 120);
            this.elements.moduleSearchInput.addEventListener('input', onSearchInput);
        }

        if (this.elements.globalSearchInput) {
            const onGlobalSearch = Utils.debounce((event) => {
                this.setModuleSearchQuery(event.target.value || '');
            }, 120);
            this.elements.globalSearchInput.addEventListener('input', onGlobalSearch);
        }

        this.elements.openBlockExplorer?.addEventListener('click', () => this.openBlockExplorer());

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
        this.renderModuleList();
        if (this.blockExplorerWindow && !this.blockExplorerWindow.closed) {
            this.renderBlockExplorerWindow();
        }
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

            if (action.type === 'workflow' || action.id?.startsWith('quick-')) {
                const editBtn = Utils.createElement('button', { className: 'settings-button secondary', text: LocalizationRenderer.t('quick_actions_edit') || 'Edit' });
                editBtn.addEventListener('click', () => this.openBuilder(action.id));
                controls.appendChild(editBtn);

                const deleteBtn = Utils.createElement('button', { className: 'settings-button secondary', text: LocalizationRenderer.t('quick_actions_delete') || 'Delete' });
                deleteBtn.addEventListener('click', () => {
                    if (window.confirm(LocalizationRenderer.t('quick_actions_delete_confirm') || 'Delete this quick action?')) {
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

    openBuilder(actionId = null, options = {}) {
        if (!this.hasBuilderAccess()) {
            SettingsModule?.openSubscriptionTab?.();
            alert(LocalizationRenderer.t('subscription_builder_requires_upgrade'));
            return;
        }
        QuickActionStore.ensureStructure();
        this.windowExpanded = false;
        this.builderState = this.createDefaultBuilderState();
        this.builderState.isOpen = true;
        this.setModuleSearchQuery('', { skipExplorerSync: true });

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
        this.updateIconPreview();
        this.renderModuleList();
        this.renderCanvas();
        this.renderInspector();
        this.updateZoomIndicator();
    },

    renderModuleList() {
        this.syncSearchInputs();
        const lists = [
            { container: this.elements.triggerList, items: QuickActionModulesByCategory.triggers },
            { container: this.elements.actionList, items: QuickActionModulesByCategory.actions },
            { container: this.elements.utilityList, items: QuickActionModulesByCategory.utilities }
        ];

        lists.forEach(({ container, items }) => {
            if (!container) return;
            container.innerHTML = '';
            const filtered = this.filterModules(items);
            if (!filtered.length) {
                const empty = Utils.createElement('li', {
                    className: 'builder-module-empty',
                    text: this.moduleSearchQuery ? 'No blocks match your search.' : 'No blocks available.'
                });
                container.appendChild(empty);
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
    },

    filterModules(modules = []) {
        if (!this.moduleSearchQuery) return modules;
        const query = this.moduleSearchQuery.toLowerCase();
        return modules.filter(module => {
            const text = [
                this.getModuleName(module),
                this.getModuleDescription(module),
                module.category || '',
                Array.isArray(module.tags) ? module.tags.join('') : ''
            ].join('').toLowerCase();
            return text.includes(query);
        });
    },

    openBlockExplorer() {
        try {
            if (this.blockExplorerWindow && !this.blockExplorerWindow.closed) {
                this.blockExplorerWindow.focus();
                this.renderBlockExplorerWindow();
                return;
            }
            this.blockExplorerWindow = window.open('', 'quickActionBlockExplorer', 'width=760,height=820');
        } catch (error) {
            console.warn('Failed to open block explorer window', error);
            this.blockExplorerWindow = null;
            return;
        }

        if (!this.blockExplorerWindow) {
            alert('Unable to open block explorer window.');
            return;
        }

        this.blockExplorerWindow.addEventListener('beforeunload', () => {
            this.blockExplorerWindow = null;
        });

        this.renderBlockExplorerWindow();
    },

    getBlockExplorerData() {
        return QuickActionModuleDefinitions.map(module => ({
            id: module.id,
            name: this.getModuleName(module),
            description: this.getModuleDescription(module),
            category: module.category || 'action',
            icon: module.icon || 'zap',
            accent: module.accent || '#5865f2',
            tags: module.tags || [],
            form: Array.isArray(module.form) ? module.form : [],
            defaultConfig: module.defaultConfig || {},
            inputs: Array.isArray(module.inputs) ? module.inputs : [],
            outputs: Array.isArray(module.outputs) ? module.outputs : []
        })).sort((a, b) => a.name.localeCompare(b.name));
    },

    renderBlockExplorerWindow() {
        if (!this.blockExplorerWindow) return;
        const data = this.getBlockExplorerData();
        const serialized = JSON.stringify(data).replace(/</g, '\\u003c');
        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Block explorer</title>
    <style>
        :root {
            color-scheme: dark light;
        }
        body {
            margin: 0;
            font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
            background: #0f172a;
            color: rgba(226, 232, 240, 0.92);
            height: 100vh;
            display: grid;
            grid-template-rows: auto 1fr;
        }
        header {
            padding: 18px clamp(16px, 4vw, 32px);
            background: rgba(15, 23, 42, 0.92);
            border-bottom: 1px solid rgba(94, 114, 228, 0.25);
            display: grid;
            gap: 12px;
        }
        header h1 {
            margin: 0;
            font-size: 18px;
            font-weight: 600;
        }
        header p {
            margin: 0;
            font-size: 13px;
            color: rgba(148, 163, 184, 0.9);
        }
        .explorer-controls {
            display: flex;
            align-items: center;
            gap: 12px;
            flex-wrap: wrap;
        }
        #explorer-search {
            flex: 1;
            min-width: 220px;
            padding: 10px 14px;
            border-radius: 12px;
            border: 1px solid rgba(94, 114, 228, 0.35);
            background: rgba(15, 23, 42, 0.65);
            color: inherit;
        }
        #explorer-search:focus {
            outline: none;
            border-color: rgba(59, 130, 246, 0.6);
            box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.18);
        }
        #explorer-count {
            font-size: 12px;
            color: rgba(148, 163, 184, 0.8);
        }
        main {
            display: grid;
            grid-template-columns: minmax(260px, 1fr) minmax(360px, 2fr);
            gap: 0;
            height: 100%;
        }
        #explorer-sidebar {
            border-right: 1px solid rgba(94, 114, 228, 0.2);
            background: linear-gradient(180deg, rgba(30, 41, 59, 0.75), rgba(15, 23, 42, 0.9));
            overflow-y: auto;
            padding: 24px clamp(16px, 4vw, 28px);
        }
        #explorer-list {
            display: grid;
            gap: 10px;
        }
        .block-card {
            border: 1px solid rgba(94, 114, 228, 0.25);
            border-radius: 14px;
            background: rgba(15, 23, 42, 0.72);
            color: inherit;
            padding: 14px;
            text-align: left;
            display: grid;
            gap: 6px;
            cursor: pointer;
            transition: border-color 0.2s ease, transform 0.15s ease;
        }
        .block-card:hover {
            border-color: rgba(59, 130, 246, 0.55);
            transform: translateX(4px);
        }
        .block-card.selected {
            border-color: rgba(94, 234, 212, 0.7);
            box-shadow: 0 6px 18px rgba(8, 47, 73, 0.45);
        }
        .block-card small {
            font-size: 11px;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: rgba(148, 163, 184, 0.75);
        }
        .block-card strong {
            font-size: 15px;
        }
        .block-card span {
            font-size: 13px;
            color: rgba(226, 232, 240, 0.75);
        }
        #explorer-detail {
            padding: 28px clamp(20px, 5vw, 48px);
            display: grid;
            gap: 18px;
            background: radial-gradient(circle at top right, rgba(59, 130, 246, 0.15), transparent 55%);
        }
        .detail-placeholder {
            margin: auto;
            text-align: center;
            color: rgba(148, 163, 184, 0.8);
        }
        .detail-header {
            display: flex;
            gap: 16px;
            align-items: center;
        }
        .detail-icon {
            width: 48px;
            height: 48px;
            display: grid;
            place-items: center;
            border-radius: 12px;
            background: rgba(59, 130, 246, 0.15);
            font-size: 24px;
        }
        .detail-meta {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            font-size: 12px;
            color: rgba(148, 163, 184, 0.9);
        }
        .detail-section {
            background: rgba(15, 23, 42, 0.72);
            border: 1px solid rgba(94, 114, 228, 0.2);
            border-radius: 16px;
            padding: 16px 18px;
            display: grid;
            gap: 8px;
        }
        .detail-section h3 {
            margin: 0;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: rgba(148, 163, 184, 0.85);
        }
        .detail-section dl {
            margin: 0;
            display: grid;
            gap: 6px;
        }
        .detail-section dt {
            font-weight: 600;
            font-size: 13px;
        }
        .detail-section dd {
            margin: 0;
            font-size: 13px;
            color: rgba(226, 232, 240, 0.85);
        }
        .detail-actions {
            display: flex;
            gap: 12px;
        }
        .detail-actions button {
            padding: 10px 16px;
            border-radius: 12px;
            border: 1px solid rgba(94, 234, 212, 0.4);
            background: rgba(45, 212, 191, 0.18);
            color: rgba(226, 232, 240, 0.92);
            cursor: pointer;
            font-size: 14px;
            transition: transform 0.15s ease, border-color 0.2s ease;
        }
        .detail-actions button:hover {
            transform: translateY(-1px);
            border-color: rgba(94, 234, 212, 0.7);
        }
        .empty-state {
            font-size: 13px;
            color: rgba(148, 163, 184, 0.8);
        }
        .detail-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
        }
        .detail-tags span {
            font-size: 11px;
            padding: 4px 8px;
            border-radius: 999px;
            background: rgba(59, 130, 246, 0.15);
            border: 1px solid rgba(59, 130, 246, 0.3);
        }
    </style>
</head>
<body>
    <header>
        <div>
            <h1>Block explorer</h1>
            <p>Browse every available block and inspect its configuration before adding.</p>
        </div>
        <div class="explorer-controls">
            <input type="search" id="explorer-search" placeholder="Search blocks…" aria-label="Search blocks">
            <span id="explorer-count">${data.length} blocks</span>
        </div>
    </header>
    <main>
        <aside id="explorer-sidebar">
            <div id="explorer-list"></div>
        </aside>
        <section id="explorer-detail">
            <div class="detail-placeholder">Select a block to see its description and inputs.</div>
        </section>
    </main>
    <script>
        const modules = ${serialized};
        const list = document.getElementById('explorer-list');
        const search = document.getElementById('explorer-search');
        const count = document.getElementById('explorer-count');
        const detail = document.getElementById('explorer-detail');
        const initialQueryValue = ${JSON.stringify(this.moduleSearchQuery || '')};
        let selectedId = ${JSON.stringify(this.blockExplorerSelectedId || '')};

        function getFiltered(query = '') {
            const normalized = query.trim().toLowerCase();
            if (!normalized) return modules;
            return modules.filter(module => {
                const haystack = [module.name, module.description, module.category, (module.tags || []).join('')].join('').toLowerCase();
                return haystack.includes(normalized);
            });
        }

        function renderList(query = '', preserveSelection = false) {
            const items = getFiltered(query);
            count.textContent = `${items.length} block${items.length === 1 ? '' : 's'}`;
            list.innerHTML = '';
            if (!items.length) {
                const empty = document.createElement('div');
                empty.className = 'empty-state';
                empty.textContent = 'No blocks found for this search.';
                list.appendChild(empty);
                detail.innerHTML = '<div class="detail-placeholder">Nothing matches the current search.</div>';
                return;
            }
            if (!preserveSelection || !items.some(item => item.id === selectedId)) {
                selectedId = items[0].id;
            }
            items.forEach(module => {
                const card = document.createElement('button');
                card.type = 'button';
                card.className = 'block-card' + (module.id === selectedId ? ' selected' : '');
                card.dataset.id = module.id;
                card.innerHTML = `<small>${module.category}</small><strong>${module.name}</strong><span>${module.description}</span>`;
                list.appendChild(card);
            });
            renderDetail(items.find(item => item.id === selectedId) || items[0]);
        }

        function renderDetail(module) {
            if (!module) {
                detail.innerHTML = '<div class="detail-placeholder">Select a block to see its description and inputs.</div>';
                return;
            }
            const tagMarkup = (module.tags || []).map(tag => `<span>${tag}</span>`).join('');
            const formMarkup = module.form.length
                ? `<div class="detail-section"><h3>Configuration fields</h3><dl>${module.form.map(field => `<dt>${field.label || field.key}</dt><dd>${field.type || 'text'}${field.placeholder ? ` · placeholder: ${field.placeholder}` : ''}</dd>`).join('')}</dl></div>`
                : '';
            const ioMarkup = `<div class="detail-section"><h3>Connections</h3><dl><dt>Inputs</dt><dd>${module.inputs.length ? module.inputs.map(input => input.label || input.id).join(', ') : 'None'}</dd><dt>Outputs</dt><dd>${module.outputs.length ? module.outputs.map(output => output.label || output.id).join(', ') : 'Next'}</dd></dl></div>`;
            const configPreview = module.defaultConfig && Object.keys(module.defaultConfig).length
                ? (() => {
                    const json = JSON.stringify(module.defaultConfig, null, 2);
                    const escaped = json.replace(/[&<>]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[char] || char));
                    return `<div class="detail-section"><h3>Default config</h3><pre style="margin:0;font-size:12px;white-space:pre-wrap;">${escaped}</pre></div>`;
                })()
                : '';
            detail.innerHTML = `
                <div class="detail-header">
                    <div class="detail-icon" style="color:${module.accent}">⚡</div>
                    <div>
                        <h2 style="margin:0 0 4px 0;font-size:20px;">${module.name}</h2>
                        <p style="margin:0;font-size:14px;color:rgba(226,232,240,0.75);">${module.description}</p>
                    </div>
                </div>
                <div class="detail-meta">
                    <span>${module.category}</span>
                    ${tagMarkup ? `<div class="detail-tags">${tagMarkup}</div>` : ''}
                </div>
                ${formMarkup}
                ${ioMarkup}
                ${configPreview}
                <div class="detail-actions">
                    <button type="button" id="detail-add-button">Add to workflow</button>
                </div>
            `;
            const addButton = document.getElementById('detail-add-button');
            if (addButton) {
                addButton.addEventListener('click', () => addBlock(module.id));
            }
        }

        function addBlock(id) {
            if (!id) return;
            if (window.opener && !window.opener.closed && window.opener.QuickActionLab) {
                const lab = window.opener.QuickActionLab;
                if (!lab.builderState?.isOpen) {
                    lab.openBuilder();
                }
                lab.setBlockExplorerSelection(id);
                lab.addNode(id);
            }
        }

        list.addEventListener('click', (event) => {
            const card = event.target.closest('.block-card');
            if (!card) return;
            const { id } = card.dataset;
            if (!id) return;
            selectedId = id;
            if (window.opener && !window.opener.closed && window.opener.QuickActionLab) {
                try {
                    window.opener.QuickActionLab.setBlockExplorerSelection(id);
                } catch (error) {
                    console.warn('Failed to sync selection', error);
                }
            }
            renderList(search.value, true);
        });

        list.addEventListener('dblclick', (event) => {
            const card = event.target.closest('.block-card');
            if (!card) return;
            addBlock(card.dataset.id);
        });

        search.addEventListener('input', () => {
            renderList(search.value);
            if (window.opener && !window.opener.closed && window.opener.QuickActionLab) {
                try {
                    window.opener.QuickActionLab.updateModuleSearchFromExplorer(search.value);
                } catch (error) {
                    console.warn('Failed to push search update', error);
                }
            }
        });

        window.addEventListener('message', (event) => {
            if (!event?.data) return;
            if (event.data.type === 'builder-search') {
                const query = event.data.query || '';
                if (search.value !== query) {
                    search.value = query;
                    renderList(query);
                }
            }
        });

        window.addEventListener('beforeunload', () => {
            try {
                if (window.opener && !window.opener.closed && window.opener.QuickActionLab) {
                    window.opener.QuickActionLab.blockExplorerWindow = null;
                }
            } catch (error) {
                console.warn('Failed to notify parent about explorer close', error);
            }
        });

        search.value = initialQueryValue;
        renderList(initialQueryValue, true);
        if (selectedId) {
            try {
                if (window.opener && !window.opener.closed && window.opener.QuickActionLab) {
                    window.opener.QuickActionLab.setBlockExplorerSelection(selectedId);
                }
            } catch (error) {
                console.warn('Failed to sync initial selection', error);
            }
        }
        setTimeout(() => search.focus(), 120);
    </script>
</body>
</html>
`.replace(/<\\/script>/g, '<\\\\/script>');

        this.blockExplorerWindow.document.open();
        this.blockExplorerWindow.document.write(html);
        this.blockExplorerWindow.document.close();
    },

    renderCanvas() {
        if (!this.builderState) return;
        const nodeLayer = this.elements.nodeLayer;
        const connectionLayer = this.elements.connectionLayer;
        if (!nodeLayer || !connectionLayer) return;

        nodeLayer.innerHTML = '';
        connectionLayer.innerHTML = '';

        nodeLayer.style.transform = `scale(${this.builderState.zoom})`;
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
                portEl.addEventListener('click', (event) => this.handlePortClick(node.id, port.id, 'input', event));
                footer.appendChild(portEl);
            });

            (moduleDef.outputs || []).forEach((port) => {
                const portEl = Utils.createElement('div', { className: 'builder-port builder-port-output' });
                portEl.setAttribute('data-node-id', node.id);
                portEl.setAttribute('data-port-id', port.id);
                portEl.setAttribute('data-role', 'output');
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
        this.renderBuilder();
    },

    clearWorkspace() {
        if (!this.builderState) return;
        if (!window.confirm(LocalizationRenderer.t('quick_actions_clear_confirm') || 'Clear the workspace?')) return;
        const manual = this.builderState.nodes.find(node => node.moduleId === 'manual-trigger');
        this.builderState.nodes = manual ? [manual] : [this.createNodeDefinition('manual-trigger', { x: 120, y: 200 })];
        this.builderState.connections = [];
        this.builderState.selectedNodeId = this.builderState.nodes[0].id;
        this.renderBuilder();
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

    saveAction() {
        if (!this.builderState) return;
        if (!this.builderState.metadata.label || !this.builderState.metadata.label.trim()) {
            alert(LocalizationRenderer.t('quick_actions_error_name') || 'Please enter a name for your quick action.');
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
            alert(LocalizationRenderer.t('quick_actions_error_empty') || 'Add at least one block to the workflow.');
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

    exportCurrentAction() {
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
        alert(LocalizationRenderer.t('quick_actions_exported') || 'Configuration copied to clipboard.');
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

    handleImport() {
        const text = this.elements.importText?.value?.trim();
        if (!text) return;
        try {
            const parsed = JSON.parse(text);
            if (!parsed || typeof parsed !== 'object' || !parsed.workflow) {
                alert(LocalizationRenderer.t('quick_actions_import_invalid') || 'Invalid configuration file.');
                return;
            }
            parsed.id = parsed.id || `quick-${Date.now()}`;
            parsed.type = parsed.type || 'workflow';
            QuickActionStore.saveCustomAction(parsed);
            QuickActionManager.refresh();
            this.renderAll();
            this.toggleImportArea(false);
        } catch (error) {
            alert(LocalizationRenderer.t('quick_actions_import_invalid') || 'Invalid configuration file.');
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
        if (module.nameKey) return LocalizationRenderer.t(module.nameKey);
        return module.name || '';
    },

    getModuleDescription(module) {
        if (!module) return '';
        if (module.descriptionKey) return LocalizationRenderer.t(module.descriptionKey);
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

if (typeof window !== 'undefined') {
    window.QuickActionLab = QuickActionLab;
}

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

    addAutomation: function() {
        const name = Utils.getElement('#new-auto-name').value.trim();
        const keyword = Utils.getElement('#new-auto-keyword').value.trim().toLowerCase();
        const command = Utils.getElement('#new-auto-command').value.trim();
        if (name && keyword && command) {
            const automations = [...(AppState.settings.customAutomations || [])];
            if (automations.some(a => a.keyword === keyword)) {
                alert("Error: Keyword already exists.");
                return;
            }
            const limit = this.getAutomationLimit();
            if (Number.isFinite(limit) && automations.length >= limit) {
                alert(LocalizationRenderer.t('subscription_automation_limit_reached', limit));
                return;
            }
            automations.push({ id: `custom-${Date.now()}`, name, keyword, command });
            ipcRenderer.send('update-setting', 'customAutomations', automations);
            Utils.getElement('#new-auto-name').value = '';
            Utils.getElement('#new-auto-keyword').value = '';
            Utils.getElement('#new-auto-command').value = '';
        } else {
            alert("Error: All fields are required.");
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
                    ipcRenderer.send('show-app-context-menu', result);
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
            if (commit && newName) {
                ipcRenderer.send('create-folder-with-name', newName);
            }
            tempItem.remove();
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
                        ipcRenderer.send('show-app-context-menu', { ...app, sourceFolderId: 'pinned' });
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
                    ipcRenderer.send('show-app-context-menu', { ...app, sourceFolderId: this.currentFolderId });
                });
                fragment.appendChild(appEl);
            });
        }
        
        container.appendChild(fragment);
        SearchModule.loadIconsForResults();
        ViewManager.resizeWindow(); // Recalculate window size after render
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

const ViewManager = {
    init: function() { this.setupEventListeners(); },
    setupEventListeners: function() {
        if (Utils.getElement('#settings-button')) Utils.getElement('#settings-button').addEventListener('click', () => this.switchView('settings'));
        if (Utils.getElement('#settings-back-button')) Utils.getElement('#settings-back-button').addEventListener('click', () => this.switchView('search'));
        window.addEventListener('contextmenu', (e) => { e.preventDefault(); ipcRenderer.send('show-context-menu'); }, false);
    },
    switchView: function(viewName) {
        if (AppState.currentView === viewName) return;
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
        ViewManager.resizeWindow(); // Always resize after settings update
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
