// renderer.js
const { ipcRenderer, shell } = require('electron');
const { randomUUID, randomBytes } = require('crypto');
const math = require('mathjs');

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

const BuilderRuntimeUtils = {
    toText(value) {
        if (value === null || value === undefined) return '';
        if (typeof value === 'string') return value;
        if (typeof value === 'number' || typeof value === 'boolean') return String(value);
        try {
            return JSON.stringify(value, null, 2);
        } catch (error) {
            return String(value);
        }
    },

    parseJson(value) {
        if (value === null || value === undefined) return null;
        if (typeof value === 'object') return value;
        try {
            return JSON.parse(value);
        } catch (error) {
            return null;
        }
    },

    splitToList(value, delimiter = '\n', { trim = true } = {}) {
        const text = BuilderRuntimeUtils.toText(value);
        if (!text) return [];
        const raw = text.split(delimiter);
        if (!trim) return raw;
        return raw.map(item => item.trim()).filter(Boolean);
    },

    slugify(value) {
        const text = BuilderRuntimeUtils.toText(value).toLowerCase();
        return text.replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '').slice(0, 120);
    },

    randomString(length = 12, alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789') {
        if (length <= 0 || !alphabet) return '';
        const buffer = randomBytes(length);
        const chars = [];
        for (let i = 0; i < length; i += 1) {
            chars.push(alphabet[buffer[i] % alphabet.length]);
        }
        return chars.join('');
    },

    toNumber(value) {
        const num = Number(value);
        return Number.isFinite(num) ? num : null;
    },

    toBoolean(value) {
        if (typeof value === 'boolean') return value;
        if (typeof value === 'number') return value !== 0;
        const text = BuilderRuntimeUtils.toText(value).toLowerCase();
        return ['true', '1', 'yes', 'on'].includes(text);
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

function createModuleDefinition(definition) {
    const {
        runner,
        inputs,
        outputs,
        defaultConfig,
        form,
        tags,
        ...rest
    } = definition;
    const moduleDefinition = {
        inputs: inputs || [{ id: 'input', label: 'Input' }],
        outputs: outputs || [{ id: 'next', label: 'Next' }],
        defaultConfig: defaultConfig || {},
        form: form || [],
        tags: tags || [],
        ...rest
    };
    moduleDefinition.run = async (context, config, node) => {
        const clone = QuickActionContext.clone(context);
        if (typeof runner === 'function') {
            const result = await runner(clone, config || {}, node || {});
            if (Array.isArray(result)) {
                if (result.length === 0) {
                    return [clone];
                }
                return result.map(item => QuickActionContext.clone(item));
            }
            if (result && typeof result === 'object' && result.__passThrough) {
                return [];
            }
        }
        return [clone];
    };
    return moduleDefinition;
}

const LegacyModuleBlueprints = [
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
        runner: async () => {}
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
        runner: async (context, config) => {
            if (config?.panel) {
                AuxPanelManager.openPanel(config.panel);
                context.logs.push(`Opened panel ${config.panel}.`);
            }
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
        runner: async (context, config) => {
            const targetUrl = String(config?.url || '').trim();
            if (!targetUrl) {
                context.logs.push('Open URL skipped: missing address.');
                return;
            }
            try {
                await shell.openExternal(targetUrl);
                context.logs.push(`Opened URL ${targetUrl}.`);
            } catch (error) {
                console.warn('Failed to open URL', error);
                context.logs.push(`Open URL failed: ${error.message}`);
            }
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
        runner: async (context, config) => {
            if (config?.text) {
                ipcRenderer.send('copy-to-clipboard', config.text);
                context.payload = config.text;
                context.logs.push('Copied configured text to clipboard.');
            } else {
                context.logs.push('Copy text skipped: nothing to copy.');
            }
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
        runner: async (context, config) => {
            const command = String(config?.command || '').trim();
            if (!command) {
                context.logs.push('Run command skipped: command is empty.');
                return;
            }
            ipcRenderer.invoke('quick-action-run-command', command).catch(error => {
                console.error('Command execution failed', error);
                context.logs.push(`Command execution failed: ${error.message}`);
            });
            context.logs.push(`Command "${command}" sent to executor.`);
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
        runner: async (context, config) => {
            if (Notification.permission === 'default') {
                Notification.requestPermission().catch(() => {});
            }
            if (Notification.permission === 'granted') {
                new Notification(config?.title || 'FlashSearch', { body: config?.body || '' });
                context.logs.push('Desktop notification displayed.');
            }
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
        runner: async (context, config) => {
            const timeout = Math.max(0, parseInt(config?.milliseconds, 10) || 0);
            if (timeout > 0) {
                await new Promise(resolve => setTimeout(resolve, timeout));
                context.logs.push(`Paused for ${timeout}ms.`);
            }
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
        runner: async (context, config) => {
            if (config?.payload !== undefined) {
                context.payload = config.payload;
                context.logs.push('Payload replaced with configured value.');
            }
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
        runner: async (context) => {
            if (context?.payload) {
                ipcRenderer.send('copy-to-clipboard', context.payload);
                context.logs.push('Payload copied to clipboard.');
            } else {
                context.logs.push('Payload copy skipped: payload is empty.');
            }
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
        runner: async (context, config) => {
            const url = String(config?.url || '').trim();
            if (!url) {
                context.logs.push('Fetch JSON skipped: URL is empty.');
                return;
            }
            try {
                const response = await fetch(url);
                const data = await response.json();
                const formatted = config?.format === 'raw'
                    ? JSON.stringify(data)
                    : JSON.stringify(data, null, 2);
                context.payload = formatted;
                context.vars.lastResponse = data;
                context.logs.push(`Fetched data from ${url}`);
            } catch (error) {
                context.logs.push(`Fetch JSON failed: ${error.message}`);
            }
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
        runner: async (context, config) => {
            const mode = config?.mode || 'uppercase';
            const source = typeof context.payload === 'string'
                ? context.payload
                : String(context.payload ?? '');
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
            context.payload = result;
            context.logs.push(`Transformed payload using ${mode}`);
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
        runner: async (context, config) => {
            const key = String(config?.key || '').trim();
            if (!key) {
                context.logs.push('Store variable skipped: missing name.');
                return;
            }
            context.vars[key] = config?.value ?? '';
            if (!context.payload) {
                context.payload = config?.value ?? '';
            }
            context.logs.push(`Stored variable "${key}"`);
        }
    }
];

const LegacyModuleDefinitions = LegacyModuleBlueprints.map(createModuleDefinition);

const TriggerBlueprints = [
    {
        id: 'schedule-trigger',
        category: 'trigger',
        name: 'Scheduled trigger',
        description: 'Start a workflow according to a natural language schedule.',
        icon: 'calendar',
        accent: '#f97316',
        tags: ['automation', 'time', 'trigger'],
        inputs: [],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { schedule: 'Every weekday at 09:00', timezone: 'Europe/Moscow' },
        form: [
            { key: 'schedule', label: 'Schedule', type: 'text', placeholder: 'Every weekday at 09:00' },
            { key: 'timezone', label: 'Time zone', type: 'text', placeholder: 'Europe/Moscow' }
        ],
        runner: async (context, config) => {
            const schedule = config.schedule || 'unspecified schedule';
            context.logs.push(`Scheduled trigger executed for ${schedule}.`);
        }
    },
    {
        id: 'clipboard-change-trigger',
        category: 'trigger',
        name: 'Clipboard change',
        description: 'Begin when clipboard content matches given filters.',
        icon: 'clipboard',
        accent: '#fb7185',
        tags: ['clipboard', 'automation'],
        inputs: [],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { keywords: 'password,token', sampleText: '' },
        form: [
            { key: 'keywords', label: 'Match keywords', type: 'text', placeholder: 'password, token' },
            { key: 'sampleText', label: 'Sample payload', type: 'textarea', rows: 3, placeholder: 'Paste example text' }
        ],
        runner: async (context, config) => {
            const keywords = (config.keywords || '').split(',').map(item => item.trim()).filter(Boolean);
            context.logs.push(keywords.length ? `Clipboard trigger matched keywords: ${keywords.join(', ')}` : 'Clipboard trigger fired with no keyword filters.');
            if (config.sampleText) {
                context.payload = config.sampleText;
            }
        }
    },
    {
        id: 'file-created-trigger',
        category: 'trigger',
        name: 'File created',
        description: 'Start when a file is created inside a directory.',
        icon: 'file-plus',
        accent: '#38bdf8',
        tags: ['files', 'watcher'],
        inputs: [],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { directory: 'C:/Downloads', pattern: '*.pdf' },
        form: [
            { key: 'directory', label: 'Directory', type: 'text', placeholder: 'C:/Downloads' },
            { key: 'pattern', label: 'Pattern', type: 'text', placeholder: '*.pdf' }
        ],
        runner: async (context, config) => {
            context.logs.push(`Watching ${config.directory || 'directory'} for new files matching ${config.pattern || '*.*'}.`);
        }
    },
    {
        id: 'http-webhook-trigger',
        category: 'trigger',
        name: 'Incoming webhook',
        description: 'Receive JSON payloads from external services to start workflows.',
        icon: 'wifi',
        accent: '#4ade80',
        tags: ['api', 'webhook'],
        inputs: [],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { secret: 'change-me', sample: '{"event":"ping"}' },
        form: [
            { key: 'secret', label: 'Shared secret', type: 'text', placeholder: 'secret token' },
            { key: 'sample', label: 'Sample payload', type: 'textarea', rows: 3, placeholder: '{"event":"ping"}' }
        ],
        runner: async (context, config) => {
            context.logs.push('Webhook trigger executed. Validate signature before processing.');
            if (config.sample) {
                context.payload = config.sample;
            }
        }
    },
    {
        id: 'timer-interval-trigger',
        category: 'trigger',
        name: 'Interval timer',
        description: 'Loop workflow execution on a repeating interval.',
        icon: 'repeat',
        accent: '#facc15',
        tags: ['automation', 'interval'],
        inputs: [],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { minutes: 15 },
        form: [
            { key: 'minutes', label: 'Interval (minutes)', type: 'number', min: 1, placeholder: '15' }
        ],
        runner: async (context, config) => {
            const minutes = Number(config.minutes) || 15;
            context.logs.push(`Interval trigger executed after ${minutes} minutes.`);
        }
    },
    {
        id: 'system-start-trigger',
        category: 'trigger',
        name: 'System start',
        description: 'Run once when the computer or FlashSearch launches.',
        icon: 'power',
        accent: '#64748b',
        tags: ['system', 'automation'],
        inputs: [],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { delaySeconds: 5 },
        form: [
            { key: 'delaySeconds', label: 'Delay after launch (s)', type: 'number', min: 0, placeholder: '5' }
        ],
        runner: async (context, config) => {
            const delaySeconds = Math.max(0, Number(config.delaySeconds) || 0);
            if (delaySeconds > 0) {
                await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
            }
            context.logs.push('System start trigger finished delay and executed.');
        }
    },
    {
        id: 'keyword-detected-trigger',
        category: 'trigger',
        name: 'Search keyword detected',
        description: 'Start when a search query contains chosen keywords.',
        icon: 'search',
        accent: '#a855f7',
        tags: ['search', 'automation'],
        inputs: [],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { keywords: 'report,status' },
        form: [
            { key: 'keywords', label: 'Keywords', type: 'text', placeholder: 'report, status' }
        ],
        runner: async (context, config) => {
            context.logs.push(`Keyword trigger fired for search including: ${config.keywords || 'any term'}.`);
        }
    },
    {
        id: 'calendar-reminder-trigger',
        category: 'trigger',
        name: 'Calendar reminder',
        description: 'Kick off a workflow around upcoming calendar events.',
        icon: 'clock',
        accent: '#60a5fa',
        tags: ['calendar', 'automation'],
        inputs: [],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { lookAheadMinutes: 30, calendar: 'Primary' },
        form: [
            { key: 'calendar', label: 'Calendar name', type: 'text', placeholder: 'Primary' },
            { key: 'lookAheadMinutes', label: 'Notify before (minutes)', type: 'number', min: 5, placeholder: '30' }
        ],
        runner: async (context, config) => {
            context.logs.push(`Calendar trigger executed for ${config.calendar || 'calendar'} with ${config.lookAheadMinutes || 30} minute notice.`);
        }
    },
    {
        id: 'slack-mention-trigger',
        category: 'trigger',
        name: 'Slack mention',
        description: 'Trigger when your bot user is mentioned in Slack.',
        icon: 'at-sign',
        accent: '#9333ea',
        tags: ['slack', 'communication'],
        inputs: [],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { channel: '#flashsearch', sample: 'User mentioned FlashSearch bot.' },
        form: [
            { key: 'channel', label: 'Channel', type: 'text', placeholder: '#flashsearch' },
            { key: 'sample', label: 'Sample payload', type: 'textarea', rows: 3, placeholder: 'User mentioned FlashSearch bot.' }
        ],
        runner: async (context, config) => {
            context.logs.push(`Slack mention trigger executed for ${config.channel || 'channel'}.`);
            if (config.sample) context.payload = config.sample;
        }
    },
    {
        id: 'email-received-trigger',
        category: 'trigger',
        name: 'Email received',
        description: 'Start when an email arrives matching filters.',
        icon: 'mail',
        accent: '#ef4444',
        tags: ['email', 'automation'],
        inputs: [],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { from: 'vip@flashsearch.app', subjectContains: 'Report' },
        form: [
            { key: 'from', label: 'Sender contains', type: 'text', placeholder: 'vip@flashsearch.app' },
            { key: 'subjectContains', label: 'Subject contains', type: 'text', placeholder: 'Report' }
        ],
        runner: async (context, config) => {
            context.logs.push(`Email trigger matched from ${config.from || 'any sender'} containing ${config.subjectContains || 'any subject'}.`);
        }
    },
    {
        id: 'rss-update-trigger',
        category: 'trigger',
        name: 'RSS feed update',
        description: 'React when a monitored RSS feed publishes new content.',
        icon: 'rss',
        accent: '#f97316',
        tags: ['rss', 'news'],
        inputs: [],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { feedUrl: 'https://flashsearch.app/blog/rss.xml' },
        form: [
            { key: 'feedUrl', label: 'Feed URL', type: 'text', placeholder: 'https://...' }
        ],
        runner: async (context, config) => {
            context.logs.push(`RSS trigger executed for ${config.feedUrl || 'feed URL'}.`);
        }
    },
    {
        id: 'service-health-trigger',
        category: 'trigger',
        name: 'Service health change',
        description: 'Execute when a monitored service reports downtime.',
        icon: 'activity',
        accent: '#f87171',
        tags: ['status', 'monitoring'],
        inputs: [],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { service: 'api.flashsearch.app', status: 'down' },
        form: [
            { key: 'service', label: 'Service name', type: 'text', placeholder: 'api.flashsearch.app' },
            { key: 'status', label: 'Trigger status', type: 'text', placeholder: 'down' }
        ],
        runner: async (context, config) => {
            context.logs.push(`Service health trigger fired for ${config.service || 'service'} status ${config.status || 'down'}.`);
        }
    },
    {
        id: 'database-row-trigger',
        category: 'trigger',
        name: 'Database row added',
        description: 'Start when a new database row matches filters.',
        icon: 'table',
        accent: '#0ea5e9',
        tags: ['database', 'data'],
        inputs: [],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { table: 'leads', filter: 'status = "new"' },
        form: [
            { key: 'table', label: 'Table', type: 'text', placeholder: 'leads' },
            { key: 'filter', label: 'Filter expression', type: 'text', placeholder: 'status = "new"' }
        ],
        runner: async (context, config) => {
            context.logs.push(`Database trigger queued for ${config.table || 'table'} (${config.filter || 'no filter'}).`);
        }
    }
];

function createLogRunner(messageBuilder) {
    return async (context, config) => {
        const message = typeof messageBuilder === 'function' ? messageBuilder(context, config) : messageBuilder;
        if (message) {
            context.logs.push(message);
        }
    };
}

function createAiRunner({ requiredFields = [], buildBody, handleResponse, missingFieldMessage, successMessage, failureMessage }) {
    return async (context, config) => {
        const endpoint = String(config.endpoint || '').trim();
        const missing = requiredFields.filter(field => !config[field] && config[field] !== 0);
        if (!endpoint || missing.length > 0) {
            context.logs.push(missingFieldMessage || `AI request skipped: missing ${endpoint ? missing.join(', ') : 'endpoint'}.`);
            return;
        }
        try {
            const body = buildBody ? buildBody(context, config) : {};
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {})
                },
                body: JSON.stringify(body)
            });
            const data = await response.json();
            if (typeof handleResponse === 'function') {
                handleResponse(context, data, config);
            }
            if (successMessage) {
                context.logs.push(successMessage);
            }
        } catch (error) {
            context.logs.push((failureMessage || 'AI request failed') + `: ${error.message}`);
        }
    };
}

function createHttpRunner({ method = 'POST', requireEndpoint = true, successMessage, failureMessage, buildRequest, handleResponse }) {
    return async (context, config) => {
        const endpoint = String(config.endpoint || '').trim();
        if (requireEndpoint && !endpoint) {
            context.logs.push('HTTP request skipped: missing endpoint.');
            return;
        }
        try {
            const request = buildRequest ? buildRequest(context, config) : {};
            const response = await fetch(endpoint || config.url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    ...(config.headers || {})
                },
                body: method === 'GET' ? undefined : JSON.stringify(request.body || {})
            });
            const data = await response.json().catch(() => null);
            if (typeof handleResponse === 'function') {
                handleResponse(context, data, response, config);
            }
            if (successMessage) {
                context.logs.push(successMessage);
            }
        } catch (error) {
            context.logs.push((failureMessage || 'HTTP request failed') + `: ${error.message}`);
        }
    };
}

const AiActionSpecs = [
    {
        id: 'ai-generate-text',
        category: 'action',
        name: 'AI: Generate text',
        description: 'Send a prompt to an AI text generation API and store the reply.',
        icon: 'type',
        accent: '#8b5cf6',
        tags: ['ai', 'text', 'api'],
        defaultConfig: { endpoint: 'https://api.example.com/v1/text', apiKey: '', prompt: 'Summarise this payload' },
        form: [
            { key: 'endpoint', label: 'API endpoint', type: 'text', placeholder: 'https://...' },
            { key: 'apiKey', label: 'API key', type: 'text', placeholder: 'sk-...' },
            { key: 'prompt', label: 'Prompt', type: 'textarea', rows: 3, placeholder: 'Summarise the payload' }
        ],
        requiredFields: ['prompt'],
        buildBody: (context, config) => ({ prompt: config.prompt, payload: context.payload }),
        responseHandler: (context, data) => { context.payload = data.result || data.choices?.[0]?.text || JSON.stringify(data); },
        missingFieldMessage: 'AI text generation skipped: missing endpoint or prompt.',
        successMessage: 'AI text generated successfully.',
        failureMessage: 'AI text generation failed'
    },
    {
        id: 'ai-generate-image',
        category: 'action',
        name: 'AI: Generate image',
        description: 'Create an image via an AI image generation API and return the URL.',
        icon: 'image',
        accent: '#f97316',
        tags: ['ai', 'image', 'api'],
        defaultConfig: { endpoint: 'https://api.example.com/v1/image', apiKey: '', prompt: 'Draw a futuristic workspace' },
        form: [
            { key: 'endpoint', label: 'API endpoint', type: 'text', placeholder: 'https://...' },
            { key: 'apiKey', label: 'API key', type: 'text', placeholder: 'sk-...' },
            { key: 'prompt', label: 'Prompt', type: 'textarea', rows: 3, placeholder: 'Describe the image you need' }
        ],
        requiredFields: ['prompt'],
        buildBody: (context, config) => ({ prompt: config.prompt }),
        responseHandler: (context, data) => { const url = data.url || data.data?.[0]?.url || null; if (url) context.payload = url; },
        missingFieldMessage: 'AI image generation skipped: missing endpoint or prompt.',
        successMessage: 'AI image request sent.',
        failureMessage: 'AI image generation failed'
    },
    {
        id: 'ai-summarize-text',
        category: 'action',
        name: 'AI: Summarise text',
        description: 'Send payload text to an AI summarisation endpoint.',
        icon: 'book-open',
        accent: '#0ea5e9',
        tags: ['ai', 'summary', 'api'],
        defaultConfig: { endpoint: 'https://api.example.com/v1/summarise', apiKey: '', maxWords: 120 },
        form: [
            { key: 'endpoint', label: 'API endpoint', type: 'text', placeholder: 'https://...' },
            { key: 'apiKey', label: 'API key', type: 'text', placeholder: 'sk-...' },
            { key: 'maxWords', label: 'Maximum words', type: 'number', min: 10, placeholder: '120' }
        ],
        requiredFields: [],
        buildBody: (context, config) => ({ text: context.payload, max_words: Number(config.maxWords) || 120 }),
        responseHandler: (context, data) => { context.payload = data.summary || data.result || JSON.stringify(data); },
        missingFieldMessage: 'AI summarisation skipped: missing endpoint.',
        successMessage: 'AI summarisation completed.',
        failureMessage: 'AI summarisation failed'
    },
    {
        id: 'ai-translate-text',
        category: 'action',
        name: 'AI: Translate text',
        description: 'Translate text into a target language using an AI service.',
        icon: 'globe',
        accent: '#34d399',
        tags: ['ai', 'translate', 'api'],
        defaultConfig: { endpoint: 'https://api.example.com/v1/translate', apiKey: '', target: 'en' },
        form: [
            { key: 'endpoint', label: 'API endpoint', type: 'text', placeholder: 'https://...' },
            { key: 'apiKey', label: 'API key', type: 'text', placeholder: 'sk-...' },
            { key: 'target', label: 'Target language', type: 'text', placeholder: 'en' }
        ],
        requiredFields: ['target'],
        buildBody: (context, config) => ({ text: context.payload, target: config.target }),
        responseHandler: (context, data) => { context.payload = data.translation || data.result || JSON.stringify(data); },
        missingFieldMessage: 'AI translation skipped: missing endpoint or target.',
        successMessage: 'AI translation completed.',
        failureMessage: 'AI translation failed'
    },
    {
        id: 'ai-classify-intent',
        category: 'action',
        name: 'AI: Classify intent',
        description: 'Classify incoming text into categories using AI.',
        icon: 'tag',
        accent: '#f59e0b',
        tags: ['ai', 'classification', 'api'],
        defaultConfig: { endpoint: 'https://api.example.com/v1/classify', apiKey: '', labels: 'support,sales,spam' },
        form: [
            { key: 'endpoint', label: 'API endpoint', type: 'text', placeholder: 'https://...' },
            { key: 'apiKey', label: 'API key', type: 'text', placeholder: 'sk-...' },
            { key: 'labels', label: 'Possible labels', type: 'text', placeholder: 'support, sales, spam' }
        ],
        requiredFields: [],
        buildBody: (context, config) => ({ text: context.payload, labels: (config.labels || '').split(',').map(label => label.trim()).filter(Boolean) }),
        responseHandler: (context, data) => { context.vars.lastClassification = data.label || data.result || null; },
        missingFieldMessage: 'AI classification skipped: missing endpoint.',
        successMessage: 'AI classification completed.',
        failureMessage: 'AI classification failed'
    },
    {
        id: 'ai-extract-entities',
        category: 'action',
        name: 'AI: Extract entities',
        description: 'Use AI to extract structured entities from text.',
        icon: 'list',
        accent: '#0ea5e9',
        tags: ['ai', 'nlp', 'api'],
        defaultConfig: { endpoint: 'https://api.example.com/v1/entities', apiKey: '', schema: 'name,company,email' },
        form: [
            { key: 'endpoint', label: 'API endpoint', type: 'text', placeholder: 'https://...' },
            { key: 'apiKey', label: 'API key', type: 'text', placeholder: 'sk-...' },
            { key: 'schema', label: 'Expected fields', type: 'text', placeholder: 'name, company, email' }
        ],
        requiredFields: [],
        buildBody: (context, config) => ({ text: context.payload, schema: config.schema }),
        responseHandler: (context, data) => { context.payload = JSON.stringify(data.entities || data, null, 2); },
        missingFieldMessage: 'AI entity extraction skipped: missing endpoint.',
        successMessage: 'AI entity extraction completed.',
        failureMessage: 'AI entity extraction failed'
    },
    {
        id: 'ai-chat-complete',
        category: 'action',
        name: 'AI: Chat completion',
        description: 'Send conversation history to an AI chat completion endpoint.',
        icon: 'message-circle',
        accent: '#38bdf8',
        tags: ['ai', 'chat', 'api'],
        defaultConfig: { endpoint: 'https://api.example.com/v1/chat', apiKey: '', systemPrompt: 'You are FlashSearch assistant.' },
        form: [
            { key: 'endpoint', label: 'API endpoint', type: 'text', placeholder: 'https://...' },
            { key: 'apiKey', label: 'API key', type: 'text', placeholder: 'sk-...' },
            { key: 'systemPrompt', label: 'System prompt', type: 'textarea', rows: 2, placeholder: 'You are FlashSearch assistant.' }
        ],
        requiredFields: [],
        buildBody: (context, config) => {
            const messages = Array.isArray(context.vars.chatHistory) ? [...context.vars.chatHistory] : [];
            if (config.systemPrompt) messages.unshift({ role: 'system', content: config.systemPrompt });
            messages.push({ role: 'user', content: String(context.payload ?? '') });
            context.vars.chatHistory = messages;
            return { messages };
        },
        responseHandler: (context, data) => { context.payload = data.reply || data.choices?.[0]?.message?.content || JSON.stringify(data); },
        missingFieldMessage: 'AI chat skipped: missing endpoint.',
        successMessage: 'AI chat reply stored in payload.',
        failureMessage: 'AI chat failed'
    }
];

const AiActionBlueprints = AiActionSpecs.map(spec => {
    const { requiredFields, buildBody, responseHandler, missingFieldMessage, successMessage, failureMessage, ...rest } = spec;
    return {
        ...rest,
        runner: createAiRunner({
            requiredFields,
            buildBody,
            handleResponse: responseHandler,
            missingFieldMessage,
            successMessage,
            failureMessage
        })
    };
});

const LogActionSpecs = [
    {
        id: 'send-email',
        category: 'action',
        name: 'Send email',
        description: 'Send an email via SMTP or a transactional API.',
        icon: 'mail',
        accent: '#ef4444',
        tags: ['email', 'communication'],
        defaultConfig: { to: 'user@example.com', subject: 'FlashSearch update', provider: 'smtp' },
        form: [
            { key: 'provider', label: 'Provider', type: 'select', options: [
                { value: 'smtp', label: 'SMTP server' },
                { value: 'sendgrid', label: 'SendGrid API' },
                { value: 'mailgun', label: 'Mailgun API' }
            ] },
            { key: 'to', label: 'Recipient', type: 'text', placeholder: 'user@example.com' },
            { key: 'subject', label: 'Subject', type: 'text', placeholder: 'FlashSearch update' },
            { key: 'body', label: 'Body', type: 'textarea', rows: 4, placeholder: 'Email body. Payload will be appended.' }
        ],
        messageBuilder: (context, config) => 'Email prepared to ' + (config.to || 'recipient') + ' via ' + (config.provider || 'smtp') + '.'
    },
    {
        id: 'send-sms',
        category: 'action',
        name: 'Send SMS',
        description: 'Send an SMS using providers like Twilio.',
        icon: 'smartphone',
        accent: '#22d3ee',
        tags: ['sms', 'communication'],
        defaultConfig: { to: '+1234567890', provider: 'twilio', message: 'FlashSearch notification' },
        form: [
            { key: 'provider', label: 'Provider', type: 'select', options: [
                { value: 'twilio', label: 'Twilio' },
                { value: 'infobip', label: 'Infobip' },
                { value: 'other', label: 'Other API' }
            ] },
            { key: 'to', label: 'Phone number', type: 'text', placeholder: '+1234567890' },
            { key: 'message', label: 'Message', type: 'textarea', rows: 3, placeholder: 'FlashSearch notification' }
        ],
        messageBuilder: (context, config) => 'SMS prepared for ' + (config.to || 'recipient') + ' using ' + (config.provider || 'provider') + '.'
    },
    {
        id: 'post-to-slack',
        category: 'action',
        name: 'Post to Slack',
        description: 'Send a message to a Slack channel or user.',
        icon: 'hash',
        accent: '#9333ea',
        tags: ['slack', 'communication'],
        defaultConfig: { channel: '#flashsearch', message: 'Workflow finished!' },
        form: [
            { key: 'channel', label: 'Channel or user', type: 'text', placeholder: '#general' },
            { key: 'message', label: 'Message', type: 'textarea', rows: 3, placeholder: 'Workflow finished!' }
        ],
        messageBuilder: (context, config) => 'Slack message queued for ' + (config.channel || '#general') + '.'
    },
    {
        id: 'post-to-teams',
        category: 'action',
        name: 'Post to Microsoft Teams',
        description: 'Send a message card to a Teams channel webhook.',
        icon: 'users',
        accent: '#2563eb',
        tags: ['teams', 'communication'],
        defaultConfig: { webhook: 'https://example.com/webhook', title: 'FlashSearch update', message: 'Automation completed.' },
        form: [
            { key: 'webhook', label: 'Webhook URL', type: 'text', placeholder: 'https://...' },
            { key: 'title', label: 'Card title', type: 'text', placeholder: 'FlashSearch update' },
            { key: 'message', label: 'Message', type: 'textarea', rows: 3, placeholder: 'Automation completed.' }
        ],
        messageBuilder: (context, config) => 'Teams card prepared for webhook ' + (config.webhook || 'not set') + '.'
    },
    {
        id: 'send-discord-message',
        category: 'action',
        name: 'Send Discord message',
        description: 'Send a message to a Discord channel webhook.',
        icon: 'message-square',
        accent: '#6366f1',
        tags: ['discord', 'communication'],
        defaultConfig: { webhook: 'https://discord.com/api/webhooks/...', message: 'FlashSearch automation finished.' },
        form: [
            { key: 'webhook', label: 'Webhook URL', type: 'text', placeholder: 'https://...' },
            { key: 'message', label: 'Message', type: 'textarea', rows: 3, placeholder: 'Automation finished.' }
        ],
        messageBuilder: (context, config) => 'Discord message prepared for webhook ' + (config.webhook || 'not set') + '.'
    },
    {
        id: 'send-whatsapp-message',
        category: 'action',
        name: 'Send WhatsApp message',
        description: 'Prepare a WhatsApp message for the business API.',
        icon: 'smartphone',
        accent: '#22c55e',
        tags: ['whatsapp', 'communication'],
        defaultConfig: { to: '+441234567890', template: 'flashsearch_update', language: 'en' },
        form: [
            { key: 'to', label: 'Recipient number', type: 'text', placeholder: '+441234567890' },
            { key: 'template', label: 'Template name', type: 'text', placeholder: 'flashsearch_update' },
            { key: 'language', label: 'Language', type: 'text', placeholder: 'en' }
        ],
        messageBuilder: (context, config) => 'WhatsApp template ' + (config.template || 'template') + ' prepared for ' + (config.to || 'recipient') + '.'
    },
    {
        id: 'send-telegram-message',
        category: 'action',
        name: 'Send Telegram message',
        description: 'Send a message via a Telegram bot token.',
        icon: 'send',
        accent: '#38bdf8',
        tags: ['telegram', 'communication'],
        defaultConfig: { chatId: '@flashsearch', message: 'Automation complete.' },
        form: [
            { key: 'chatId', label: 'Chat ID or username', type: 'text', placeholder: '@channel' },
            { key: 'message', label: 'Message', type: 'textarea', rows: 3, placeholder: 'Automation complete.' }
        ],
        messageBuilder: (context, config) => 'Telegram message queued for ' + (config.chatId || 'chat') + '.'
    },
    {
        id: 'post-twitter-update',
        category: 'action',
        name: 'Post Twitter update',
        description: 'Draft a tweet with the latest payload content.',
        icon: 'twitter',
        accent: '#0ea5e9',
        tags: ['twitter', 'social'],
        defaultConfig: { message: 'FlashSearch automation finished.' },
        form: [
            { key: 'message', label: 'Tweet text', type: 'textarea', rows: 3, placeholder: 'FlashSearch automation finished.' }
        ],
        messageBuilder: (context, config) => 'Twitter update drafted: ' + (config.message || context.payload || 'No message').slice(0, 100) + '...'
    },
    {
        id: 'create-github-issue',
        category: 'action',
        name: 'Create GitHub issue',
        description: 'Prepare a GitHub issue payload for repository automation.',
        icon: 'github',
        accent: '#111827',
        tags: ['github', 'developer'],
        defaultConfig: { repository: 'flashsearch/app', title: 'New automation idea', body: 'Describe the workflow here.' },
        form: [
            { key: 'repository', label: 'Repository', type: 'text', placeholder: 'owner/repo' },
            { key: 'title', label: 'Issue title', type: 'text', placeholder: 'Bug report' },
            { key: 'body', label: 'Issue body', type: 'textarea', rows: 4, placeholder: 'Describe the issue...' }
        ],
        messageBuilder: (context, config) => 'GitHub issue prepared for ' + (config.repository || 'repository') + '.'
    },
    {
        id: 'update-github-issue',
        category: 'action',
        name: 'Update GitHub issue',
        description: 'Append a comment or status to an existing GitHub issue.',
        icon: 'git-commit',
        accent: '#6366f1',
        tags: ['github', 'developer'],
        defaultConfig: { repository: 'flashsearch/app', issue: 42, comment: 'Automation completed successfully.' },
        form: [
            { key: 'repository', label: 'Repository', type: 'text', placeholder: 'owner/repo' },
            { key: 'issue', label: 'Issue number', type: 'number', placeholder: '42' },
            { key: 'comment', label: 'Comment', type: 'textarea', rows: 3, placeholder: 'Automation completed successfully.' }
        ],
        messageBuilder: (context, config) => 'GitHub issue #' + (config.issue || 'N/A') + ' update prepared for ' + (config.repository || 'repository') + '.'
    },
    {
        id: 'create-calendar-event',
        category: 'action',
        name: 'Create calendar event',
        description: 'Prepare a calendar event payload ready to send to an API.',
        icon: 'calendar',
        accent: '#f97316',
        tags: ['calendar', 'productivity'],
        defaultConfig: { title: 'FlashSearch standup', location: 'Online', start: '2024-06-01T09:00:00', durationMinutes: 30 },
        form: [
            { key: 'title', label: 'Event title', type: 'text', placeholder: 'Meeting name' },
            { key: 'location', label: 'Location', type: 'text', placeholder: 'Conference room' },
            { key: 'start', label: 'Start time', type: 'datetime-local' },
            { key: 'durationMinutes', label: 'Duration (minutes)', type: 'number', min: 5, placeholder: '30' }
        ],
        messageBuilder: (context, config) => 'Calendar event "' + (config.title || 'Untitled event') + '" prepared for ' + (config.start || 'unscheduled time') + '.'
    },
    {
        id: 'update-calendar-event',
        category: 'action',
        name: 'Update calendar event',
        description: 'Update metadata for an existing calendar event.',
        icon: 'calendar',
        accent: '#10b981',
        tags: ['calendar', 'productivity'],
        defaultConfig: { eventId: 'evt_123', title: 'Updated agenda', addGuests: 'team@flashsearch.app' },
        form: [
            { key: 'eventId', label: 'Event identifier', type: 'text', placeholder: 'evt_123' },
            { key: 'title', label: 'New title', type: 'text', placeholder: 'Updated agenda' },
            { key: 'addGuests', label: 'Guests to add', type: 'text', placeholder: 'person@example.com' }
        ],
        messageBuilder: (context, config) => 'Calendar event ' + (config.eventId || 'unknown') + ' queued for update.'
    },
    {
        id: 'append-google-sheet',
        category: 'action',
        name: 'Append Google Sheet row',
        description: 'Prepare data to append to a Google Sheet.',
        icon: 'grid',
        accent: '#22c55e',
        tags: ['sheets', 'data'],
        defaultConfig: { spreadsheetId: 'sheet123', range: 'Leads!A:C', values: 'Name,Email,Note' },
        form: [
            { key: 'spreadsheetId', label: 'Spreadsheet ID', type: 'text', placeholder: 'sheet123' },
            { key: 'range', label: 'Target range', type: 'text', placeholder: 'Sheet1!A:C' },
            { key: 'values', label: 'Values (CSV)', type: 'text', placeholder: 'Name,Email,Note' }
        ],
        messageBuilder: (context, config) => 'Prepared row for spreadsheet ' + (config.spreadsheetId || 'sheet') + ' at ' + (config.range || 'range') + '.'
    },
    {
        id: 'create-notion-page',
        category: 'action',
        name: 'Create Notion page',
        description: 'Prepare a Notion page payload with title and content.',
        icon: 'file-text',
        accent: '#111827',
        tags: ['notion', 'notes'],
        defaultConfig: { databaseId: 'db123', title: 'Automation summary', body: 'Summary of the latest run.' },
        form: [
            { key: 'databaseId', label: 'Database ID', type: 'text', placeholder: 'db123' },
            { key: 'title', label: 'Page title', type: 'text', placeholder: 'Automation summary' },
            { key: 'body', label: 'Content', type: 'textarea', rows: 4, placeholder: 'Summary...' }
        ],
        messageBuilder: (context, config) => 'Notion page ready for database ' + (config.databaseId || 'database') + '.'
    },
    {
        id: 'append-notes',
        category: 'action',
        name: 'Append to notes app',
        description: 'Append text to a note-taking application via its API.',
        icon: 'edit-3',
        accent: '#fbbf24',
        tags: ['notes', 'productivity'],
        defaultConfig: { notebook: 'Automation log', note: 'Daily summary', text: 'Automation completed.' },
        form: [
            { key: 'notebook', label: 'Notebook', type: 'text', placeholder: 'Automation log' },
            { key: 'note', label: 'Note title', type: 'text', placeholder: 'Daily summary' },
            { key: 'text', label: 'Text to append', type: 'textarea', rows: 3, placeholder: 'Automation completed.' }
        ],
        messageBuilder: (context, config) => 'Prepared note append for ' + (config.notebook || 'notebook') + ' / ' + (config.note || 'note') + '.'
    },
    {
        id: 'create-todo-item',
        category: 'action',
        name: 'Create to-do item',
        description: 'Create a task in your favourite to-do manager.',
        icon: 'check-square',
        accent: '#ec4899',
        tags: ['tasks', 'productivity'],
        defaultConfig: { list: 'Inbox', title: 'Follow up with customer', dueDate: '2024-06-01' },
        form: [
            { key: 'list', label: 'List', type: 'text', placeholder: 'Inbox' },
            { key: 'title', label: 'Task title', type: 'text', placeholder: 'Follow up with customer' },
            { key: 'dueDate', label: 'Due date', type: 'date' }
        ],
        messageBuilder: (context, config) => 'Task "' + (config.title || 'Untitled task') + '" added to ' + (config.list || 'list') + '.'
    },
    {
        id: 'update-todo-status',
        category: 'action',
        name: 'Update to-do status',
        description: 'Update a task status in your to-do manager.',
        icon: 'check',
        accent: '#0ea5e9',
        tags: ['tasks', 'productivity'],
        defaultConfig: { taskId: 'task_123', status: 'completed' },
        form: [
            { key: 'taskId', label: 'Task identifier', type: 'text', placeholder: 'task_123' },
            { key: 'status', label: 'Status', type: 'text', placeholder: 'completed' }
        ],
        messageBuilder: (context, config) => 'Task ' + (config.taskId || 'task') + ' marked as ' + (config.status || 'updated') + '.'
    },
    {
        id: 'log-to-database',
        category: 'action',
        name: 'Log to database',
        description: 'Log structured data to an analytics database.',
        icon: 'database',
        accent: '#6366f1',
        tags: ['database', 'analytics'],
        defaultConfig: { table: 'automation_log', level: 'info', message: 'Workflow completed' },
        form: [
            { key: 'table', label: 'Table name', type: 'text', placeholder: 'automation_log' },
            { key: 'level', label: 'Severity', type: 'text', placeholder: 'info' },
            { key: 'message', label: 'Log message', type: 'textarea', rows: 3, placeholder: 'Workflow completed' }
        ],
        messageBuilder: (context, config) => 'Database log queued for table ' + (config.table || 'table') + ' with level ' + (config.level || 'info') + '.'
    },
    {
        id: 'push-notification',
        category: 'action',
        name: 'Send push notification',
        description: 'Prepare a push notification for desktop or mobile.',
        icon: 'bell',
        accent: '#facc15',
        tags: ['notification', 'communication'],
        defaultConfig: { title: 'FlashSearch', body: 'Workflow finished!', target: 'desktop' },
        form: [
            { key: 'title', label: 'Title', type: 'text', placeholder: 'FlashSearch' },
            { key: 'body', label: 'Message', type: 'textarea', rows: 3, placeholder: 'Workflow finished!' },
            { key: 'target', label: 'Target platform', type: 'text', placeholder: 'desktop' }
        ],
        messageBuilder: (context, config) => 'Push notification prepared for ' + (config.target || 'desktop') + '.'
    },
    {
        id: 'start-obs-recording',
        category: 'action',
        name: 'Start OBS recording',
        description: 'Trigger OBS Studio to start recording via its WebSocket API.',
        icon: 'video',
        accent: '#ef4444',
        tags: ['obs', 'video'],
        defaultConfig: { profile: 'FlashSearch', scene: 'Desktop' },
        form: [
            { key: 'profile', label: 'OBS profile', type: 'text', placeholder: 'FlashSearch' },
            { key: 'scene', label: 'Scene name', type: 'text', placeholder: 'Desktop' }
        ],
        messageBuilder: (context, config) => 'OBS recording start command prepared for scene ' + (config.scene || 'scene') + '.'
    },
    {
        id: 'stop-obs-recording',
        category: 'action',
        name: 'Stop OBS recording',
        description: 'Trigger OBS Studio to stop recording.',
        icon: 'stop-circle',
        accent: '#f87171',
        tags: ['obs', 'video'],
        defaultConfig: { saveHighlight: true },
        form: [
            { key: 'saveHighlight', label: 'Save highlight clip', type: 'checkbox' }
        ],
        messageBuilder: (context, config) => 'OBS recording stop command queued' + (config.saveHighlight ? ' with highlight.' : '.');
    },
    {
        id: 'control-zoom-meeting',
        category: 'action',
        name: 'Control Zoom meeting',
        description: 'Send a command to control Zoom meetings via REST API.',
        icon: 'video-off',
        accent: '#2563eb',
        tags: ['zoom', 'video'],
        defaultConfig: { action: 'muteAll', meetingId: '123-456-789' },
        form: [
            { key: 'meetingId', label: 'Meeting ID', type: 'text', placeholder: '123-456-789' },
            { key: 'action', label: 'Action', type: 'text', placeholder: 'muteAll' }
        ],
        messageBuilder: (context, config) => 'Zoom action ' + (config.action || 'action') + ' prepared for meeting ' + (config.meetingId || 'meeting') + '.'
    },
    {
        id: 'toggle-smart-light',
        category: 'action',
        name: 'Toggle smart light',
        description: 'Toggle a smart light or set brightness via a hub API.',
        icon: 'sun',
        accent: '#fbbf24',
        tags: ['iot', 'home'],
        defaultConfig: { device: 'office-lamp', brightness: 80 },
        form: [
            { key: 'device', label: 'Device ID', type: 'text', placeholder: 'office-lamp' },
            { key: 'brightness', label: 'Brightness %', type: 'number', min: 0, max: 100, placeholder: '80' }
        ],
        messageBuilder: (context, config) => 'Smart light ' + (config.device || 'device') + ' set to ' + (config.brightness ?? 'auto') + '%.'
    },
    {
        id: 'set-smart-thermostat',
        category: 'action',
        name: 'Set smart thermostat',
        description: 'Adjust thermostat temperature via smart home API.',
        icon: 'thermometer',
        accent: '#fb7185',
        tags: ['iot', 'home'],
        defaultConfig: { device: 'office-thermostat', temperature: 22 },
        form: [
            { key: 'device', label: 'Device ID', type: 'text', placeholder: 'office-thermostat' },
            { key: 'temperature', label: 'Temperature °C', type: 'number', placeholder: '22' }
        ],
        messageBuilder: (context, config) => 'Thermostat ' + (config.device || 'device') + ' set to ' + (config.temperature ?? 'auto') + '°C.'
    },
    {
        id: 'play-spotify-track',
        category: 'action',
        name: 'Play Spotify track',
        description: 'Start playback of a Spotify track or playlist.',
        icon: 'music',
        accent: '#22c55e',
        tags: ['spotify', 'media'],
        defaultConfig: { uri: 'spotify:playlist:flashsearch', device: 'Office speaker' },
        form: [
            { key: 'uri', label: 'Track or playlist URI', type: 'text', placeholder: 'spotify:track:...' },
            { key: 'device', label: 'Target device', type: 'text', placeholder: 'Office speaker' }
        ],
        messageBuilder: (context, config) => 'Spotify playback prepared for ' + (config.device || 'device') + '.'
    },
    {
        id: 'launch-virtual-machine',
        category: 'action',
        name: 'Launch virtual machine',
        description: 'Queue a cloud VM start operation for development or testing.',
        icon: 'server',
        accent: '#6366f1',
        tags: ['cloud', 'infrastructure'],
        defaultConfig: { provider: 'aws', instance: 'i-123456', region: 'eu-central-1' },
        form: [
            { key: 'provider', label: 'Provider', type: 'text', placeholder: 'aws' },
            { key: 'instance', label: 'Instance ID', type: 'text', placeholder: 'i-123456' },
            { key: 'region', label: 'Region', type: 'text', placeholder: 'eu-central-1' }
        ],
        messageBuilder: (context, config) => 'VM launch prepared for ' + (config.provider || 'cloud') + ' instance ' + (config.instance || 'instance') + '.'
    },
    {
        id: 'open-figma-file',
        category: 'action',
        name: 'Open Figma file',
        description: 'Open a Figma design link in the browser or desktop app.',
        icon: 'figma',
        accent: '#ef4444',
        tags: ['design', 'collaboration'],
        defaultConfig: { url: 'https://www.figma.com/file/...', mode: 'browser' },
        form: [
            { key: 'url', label: 'Figma URL', type: 'text', placeholder: 'https://...' },
            { key: 'mode', label: 'Open mode', type: 'select', options: [
                { value: 'browser', label: 'Browser' },
                { value: 'desktop', label: 'Desktop app' }
            ] }
        ],
        messageBuilder: (context, config) => 'Figma file queued to open in ' + (config.mode || 'browser') + '.'
    },
    {
        id: 'upload-ftp',
        category: 'action',
        name: 'Upload via FTP',
        description: 'Prepare a file upload payload for an FTP server.',
        icon: 'upload',
        accent: '#f97316',
        tags: ['ftp', 'files'],
        defaultConfig: { host: 'ftp.example.com', path: '/reports/', filename: 'report.txt' },
        form: [
            { key: 'host', label: 'Host', type: 'text', placeholder: 'ftp.example.com' },
            { key: 'path', label: 'Remote path', type: 'text', placeholder: '/reports/' },
            { key: 'filename', label: 'Filename', type: 'text', placeholder: 'report.txt' }
        ],
        messageBuilder: (context, config) => 'FTP upload prepared for ' + (config.host || 'host') + config.path + (config.filename || 'file') + '.'
    },
    {
        id: 'upload-s3',
        category: 'action',
        name: 'Upload to S3',
        description: 'Prepare an object upload to Amazon S3.',
        icon: 'cloud',
        accent: '#0ea5e9',
        tags: ['aws', 'files'],
        defaultConfig: { bucket: 'flashsearch-backups', key: 'reports/report.json' },
        form: [
            { key: 'bucket', label: 'Bucket name', type: 'text', placeholder: 'flashsearch-backups' },
            { key: 'key', label: 'Object key', type: 'text', placeholder: 'path/to/file' }
        ],
        messageBuilder: (context, config) => 'S3 upload prepared for ' + (config.bucket || 'bucket') + '/' + (config.key || 'object') + '.'
    },
    {
        id: 'update-crm-contact',
        category: 'action',
        name: 'Update CRM contact',
        description: 'Prepare a CRM contact update payload.',
        icon: 'user-check',
        accent: '#10b981',
        tags: ['crm', 'sales'],
        defaultConfig: { contactId: 'contact_001', stage: 'Qualified', note: 'Spoke during automation review.' },
        form: [
            { key: 'contactId', label: 'Contact ID', type: 'text', placeholder: 'contact_001' },
            { key: 'stage', label: 'Stage', type: 'text', placeholder: 'Qualified' },
            { key: 'note', label: 'Internal note', type: 'textarea', rows: 3, placeholder: 'Discussion summary' }
        ],
        messageBuilder: (context, config) => 'CRM contact ' + (config.contactId || 'contact') + ' update prepared.'
    },
    {
        id: 'generate-report-pdf',
        category: 'action',
        name: 'Generate PDF report',
        description: 'Queue a PDF generation request for reporting tools.',
        icon: 'file',
        accent: '#facc15',
        tags: ['reports', 'documents'],
        defaultConfig: { template: 'automation-summary', filename: 'flashsearch-report.pdf' },
        form: [
            { key: 'template', label: 'Template ID', type: 'text', placeholder: 'automation-summary' },
            { key: 'filename', label: 'Output filename', type: 'text', placeholder: 'flashsearch-report.pdf' }
        ],
        messageBuilder: (context, config) => 'PDF report generation queued for template ' + (config.template || 'template') + '.'
    },
    {
        id: 'archive-to-notebook',
        category: 'action',
        name: 'Archive to notebook',
        description: 'Archive payload text into a digital notebook.',
        icon: 'archive',
        accent: '#4b5563',
        tags: ['notes', 'archive'],
        defaultConfig: { notebook: 'Archive', tag: 'automation' },
        form: [
            { key: 'notebook', label: 'Notebook', type: 'text', placeholder: 'Archive' },
            { key: 'tag', label: 'Tag', type: 'text', placeholder: 'automation' }
        ],
        messageBuilder: (context, config) => 'Notebook archive entry prepared in ' + (config.notebook || 'notebook') + '.'
    },
    {
        id: 'share-dashboard-link',
        category: 'action',
        name: 'Share dashboard link',
        description: 'Share an analytics dashboard link with your team.',
        icon: 'share-2',
        accent: '#0ea5e9',
        tags: ['analytics', 'communication'],
        defaultConfig: { url: 'https://analytics.flashsearch.app/dashboard', recipients: 'team@flashsearch.app' },
        form: [
            { key: 'url', label: 'Dashboard URL', type: 'text', placeholder: 'https://...' },
            { key: 'recipients', label: 'Recipients', type: 'text', placeholder: 'team@flashsearch.app' }
        ],
        messageBuilder: (context, config) => 'Dashboard link ready to share with ' + (config.recipients || 'team') + '.'
    },
    {
        id: 'notify-linear-issue',
        category: 'action',
        name: 'Notify Linear issue',
        description: 'Notify a Linear issue channel about workflow results.',
        icon: 'alert-triangle',
        accent: '#f97316',
        tags: ['linear', 'developer'],
        defaultConfig: { issueId: 'LIN-24', note: 'Automation run completed.' },
        form: [
            { key: 'issueId', label: 'Issue ID', type: 'text', placeholder: 'LIN-24' },
            { key: 'note', label: 'Note', type: 'textarea', rows: 3, placeholder: 'Automation run completed.' }
        ],
        messageBuilder: (context, config) => 'Linear issue ' + (config.issueId || 'issue') + ' notified with note.'
    },
    {
        id: 'call-phone-bridge',
        category: 'action',
        name: 'Call phone bridge',
        description: 'Initiate a phone bridge call to a list of participants.',
        icon: 'phone-call',
        accent: '#10b981',
        tags: ['telephony', 'communication'],
        defaultConfig: { bridge: 'flashsearch-bridge', participants: '+1234567890,+441234567890' },
        form: [
            { key: 'bridge', label: 'Bridge ID', type: 'text', placeholder: 'flashsearch-bridge' },
            { key: 'participants', label: 'Participants', type: 'text', placeholder: '+1234567890,+441234567890' }
        ],
        messageBuilder: (context, config) => 'Phone bridge ' + (config.bridge || 'bridge') + ' dial-out prepared.'
    }
];

const LogActionBlueprints = LogActionSpecs.map(spec => {
    const { messageBuilder, customRunner, ...rest } = spec;
    if (typeof customRunner === 'function') {
        return { ...rest, runner: customRunner };
    }
    return { ...rest, runner: createLogRunner(messageBuilder) };
});

const HttpActionSpecs = [
    {
        id: 'send-http-request',
        category: 'action',
        name: 'Send HTTP request',
        description: 'Make a configurable HTTP request and log the status.',
        icon: 'share',
        accent: '#fbbf24',
        tags: ['http', 'api'],
        defaultConfig: { endpoint: 'https://api.example.com/trigger', method: 'POST', body: '{"hello":"world"}' },
        form: [
            { key: 'endpoint', label: 'Endpoint URL', type: 'text', placeholder: 'https://...' },
            { key: 'method', label: 'Method', type: 'text', placeholder: 'POST' },
            { key: 'body', label: 'JSON body', type: 'textarea', rows: 3, placeholder: '{"hello":"world"}' }
        ],
        customRunner: async (context, config) => {
            const endpoint = String(config.endpoint || '').trim();
            if (!endpoint) {
                context.logs.push('HTTP request skipped: missing endpoint.');
                return;
            }
            const method = String(config.method || 'POST').toUpperCase();
            try {
                const response = await fetch(endpoint, {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body: method === 'GET' ? undefined : config.body || '{}'
                });
                context.logs.push('HTTP request responded with status ' + response.status + '.');
                const text = await response.text();
                if (text) {
                    context.payload = text.slice(0, 2000);
                }
            } catch (error) {
                context.logs.push('HTTP request failed: ' + error.message);
            }
        }
    },
    {
        id: 'deploy-via-webhook',
        category: 'action',
        name: 'Deploy via webhook',
        description: 'Trigger a deployment service using a webhook.',
        icon: 'cloud-lightning',
        accent: '#f97316',
        tags: ['deployment', 'api'],
        defaultConfig: { endpoint: 'https://deploy.flashsearch.app/hooks/build', token: 'secret-token', payload: '{"env":"prod"}' },
        form: [
            { key: 'endpoint', label: 'Webhook URL', type: 'text', placeholder: 'https://...' },
            { key: 'token', label: 'Auth token', type: 'text', placeholder: 'secret-token' },
            { key: 'payload', label: 'JSON payload', type: 'textarea', rows: 3, placeholder: '{"env":"prod"}' }
        ],
        runner: createHttpRunner({
            method: 'POST',
            successMessage: 'Deployment webhook invoked.',
            failureMessage: 'Deployment webhook failed',
            buildRequest: (context, config) => ({
                body: JSON.parse(config.payload || '{}'),
                headers: config.token ? { Authorization: 'Bearer ' + config.token } : {}
            }),
            handleResponse: (context, data, response) => {
                context.vars.lastDeploymentStatus = response.status;
                if (data) context.payload = JSON.stringify(data, null, 2);
            }
        })
    },
    {
        id: 'download-file',
        category: 'action',
        name: 'Download file',
        description: 'Download a file from a URL and store its preview in the payload.',
        icon: 'download-cloud',
        accent: '#22d3ee',
        tags: ['files', 'http'],
        defaultConfig: { endpoint: 'https://api.example.com/report.txt' },
        form: [
            { key: 'endpoint', label: 'File URL', type: 'text', placeholder: 'https://...' }
        ],
        runner: createHttpRunner({
            method: 'GET',
            successMessage: 'File downloaded preview stored.',
            failureMessage: 'File download failed',
            buildRequest: () => ({}),
            handleResponse: async (context, data, response) => {
                const text = await response.text();
                context.payload = text.slice(0, 4000);
            }
        })
    },
    {
        id: 'update-rest-resource',
        category: 'action',
        name: 'Update REST resource',
        description: 'Send a PATCH request to update a REST resource.',
        icon: 'tool',
        accent: '#f97316',
        tags: ['api', 'http'],
        defaultConfig: { endpoint: 'https://api.example.com/resource/1', body: '{"status":"processed"}' },
        form: [
            { key: 'endpoint', label: 'Resource URL', type: 'text', placeholder: 'https://...' },
            { key: 'body', label: 'JSON body', type: 'textarea', rows: 3, placeholder: '{"status":"processed"}' }
        ],
        runner: createHttpRunner({
            method: 'PATCH',
            successMessage: 'REST resource update sent.',
            failureMessage: 'REST resource update failed',
            buildRequest: (context, config) => ({ body: JSON.parse(config.body || '{}') }),
            handleResponse: (context, data) => { if (data) context.payload = JSON.stringify(data, null, 2); }
        })
    }
];

const HttpActionBlueprints = HttpActionSpecs.map(spec => {
    const { method, requireEndpoint, successMessage, failureMessage, buildRequest, handleResponse, customRunner, ...rest } = spec;
    if (typeof customRunner === 'function') {
        return { ...rest, runner: customRunner };
    }
    return {
        ...rest,
        runner: createHttpRunner({ method, requireEndpoint, successMessage, failureMessage, buildRequest, handleResponse })
    };
});

const ActionBlueprints = [
    ...AiActionBlueprints,
    ...LogActionBlueprints,
    ...HttpActionBlueprints
];


const UtilitySpecs = [
    {
        id: 'payload-append-text',
        category: 'utility',
        name: 'Append text to payload',
        description: 'Append configured text to the payload with an optional separator.',
        icon: 'plus-circle',
        accent: '#0ea5e9',
        tags: ['text', 'payload'],
        defaultConfig: { text: 'New line', separator: '\n' },
        form: [
            { key: 'text', label: 'Text to append', type: 'textarea', rows: 3, placeholder: 'New line' },
            { key: 'separator', label: 'Separator', type: 'text', placeholder: '\n' }
        ],
        runner: async (context, config) => {
            const base = BuilderRuntimeUtils.toText(context.payload);
            const separator = config.separator ?? '';
            const addition = config.text ?? '';
            context.payload = base ? base + separator + addition : addition;
            context.logs.push('Text appended to payload.');
        }
    },
    {
        id: 'payload-prepend-text',
        category: 'utility',
        name: 'Prepend text to payload',
        description: 'Prepend configured text to the payload.',
        icon: 'corner-up-left',
        accent: '#38bdf8',
        tags: ['text', 'payload'],
        defaultConfig: { text: 'Prefix: ', separator: '' },
        form: [
            { key: 'text', label: 'Text to prepend', type: 'textarea', rows: 2, placeholder: 'Prefix: ' },
            { key: 'separator', label: 'Separator', type: 'text', placeholder: ' ' }
        ],
        runner: async (context, config) => {
            const separator = config.separator ?? '';
            const addition = config.text ?? '';
            const base = BuilderRuntimeUtils.toText(context.payload);
            context.payload = addition + separator + base;
            context.logs.push('Text prepended to payload.');
        }
    },
    {
        id: 'payload-clear',
        category: 'utility',
        name: 'Clear payload',
        description: 'Remove payload contents and reset to empty.',
        icon: 'eraser',
        accent: '#f87171',
        tags: ['payload'],
        defaultConfig: {},
        form: [],
        runner: async (context) => {
            context.payload = '';
            context.logs.push('Payload cleared.');
        }
    },
    {
        id: 'payload-template',
        category: 'utility',
        name: 'Fill template',
        description: 'Render a simple template using payload and variables.',
        icon: 'file-text',
        accent: '#fbbf24',
        tags: ['template', 'text'],
        defaultConfig: { template: 'Hello {{name}}, payload: {{payload}}' },
        form: [
            { key: 'template', label: 'Template', type: 'textarea', rows: 4, placeholder: 'Hello {{name}}' }
        ],
        runner: async (context, config) => {
            const template = String(config.template || '');
            const replacements = { ...context.vars, payload: BuilderRuntimeUtils.toText(context.payload) };
            const result = template.replace(/{{\s*([^}]+)\s*}}/g, (match, key) => {
                const normalized = String(key || '').trim();
                return replacements[normalized] !== undefined ? replacements[normalized] : '';
            });
            context.payload = result;
            context.logs.push('Template rendered into payload.');
        }
    },
    {
        id: 'payload-ensure-json',
        category: 'utility',
        name: 'Ensure JSON payload',
        description: 'Validate payload as JSON and store a pretty formatted version.',
        icon: 'code',
        accent: '#10b981',
        tags: ['json', 'payload'],
        defaultConfig: { fallback: '{}' },
        form: [
            { key: 'fallback', label: 'Fallback JSON', type: 'textarea', rows: 3, placeholder: '{}' }
        ],
        runner: async (context, config) => {
            const parsed = BuilderRuntimeUtils.parseJson(context.payload);
            if (parsed) {
                context.payload = JSON.stringify(parsed, null, 2);
                context.logs.push('Payload validated as JSON.');
            } else {
                const fallback = BuilderRuntimeUtils.parseJson(config.fallback) || {};
                context.payload = JSON.stringify(fallback, null, 2);
                context.logs.push('Payload was invalid JSON. Applied fallback.');
            }
        }
    },
    {
        id: 'payload-to-variable',
        category: 'utility',
        name: 'Payload to variable',
        description: 'Store the current payload into a named variable.',
        icon: 'save',
        accent: '#6366f1',
        tags: ['payload', 'variables'],
        defaultConfig: { key: 'payloadCopy' },
        form: [
            { key: 'key', label: 'Variable name', type: 'text', placeholder: 'payloadCopy' }
        ],
        runner: async (context, config) => {
            const key = String(config.key || '').trim();
            if (!key) {
                context.logs.push('Payload not stored: missing variable name.');
                return;
            }
            context.vars[key] = context.payload;
            context.logs.push(`Payload stored in variable ${key}.`);
        }
    },
    {
        id: 'variable-to-payload',
        category: 'utility',
        name: 'Variable to payload',
        description: 'Load a variable value into the payload.',
        icon: 'upload-cloud',
        accent: '#34d399',
        tags: ['payload', 'variables'],
        defaultConfig: { key: 'payloadCopy', fallback: '' },
        form: [
            { key: 'key', label: 'Variable name', type: 'text', placeholder: 'payloadCopy' },
            { key: 'fallback', label: 'Fallback value', type: 'textarea', rows: 2, placeholder: '' }
        ],
        runner: async (context, config) => {
            const key = String(config.key || '').trim();
            context.payload = key ? (context.vars[key] ?? config.fallback ?? '') : (config.fallback ?? '');
            context.logs.push(`Payload loaded from variable ${key || 'fallback'}.`);
        }
    },
    {
        id: 'json-select-path',
        category: 'utility',
        name: 'Select JSON path',
        description: 'Extract a value from JSON payload using dotted path.',
        icon: 'target',
        accent: '#f472b6',
        tags: ['json'],
        defaultConfig: { path: 'data.items[0].name' },
        form: [
            { key: 'path', label: 'JSON path', type: 'text', placeholder: 'data.items[0].name' }
        ],
        runner: async (context, config) => {
            const parsed = BuilderRuntimeUtils.parseJson(context.payload);
            if (!parsed) {
                context.logs.push('JSON path selection skipped: payload not JSON.');
                return;
            }
            const segments = String(config.path || '').split('.').map(part => part.trim()).filter(Boolean);
            let current = parsed;
            for (const segment of segments) {
                const arrayMatch = segment.match(/([^\[]+)(\[(\d+)\])?/);
                if (!arrayMatch) {
                    current = current?.[segment];
                } else {
                    const [, key, , index] = arrayMatch;
                    current = current?.[key];
                    if (index !== undefined) {
                        const idx = Number(index);
                        current = Array.isArray(current) ? current[idx] : undefined;
                    }
                }
            }
            context.payload = current !== undefined ? BuilderRuntimeUtils.toText(current) : '';
            context.logs.push('JSON path extracted into payload.');
        }
    },
    {
        id: 'json-merge-object',
        category: 'utility',
        name: 'Merge JSON object',
        description: 'Merge configured JSON into payload JSON object.',
        icon: 'layers',
        accent: '#1d4ed8',
        tags: ['json'],
        defaultConfig: { json: '{"status":"processed"}' },
        form: [
            { key: 'json', label: 'JSON to merge', type: 'textarea', rows: 4, placeholder: '{"status":"processed"}' }
        ],
        runner: async (context, config) => {
            const base = BuilderRuntimeUtils.parseJson(context.payload) || {};
            const patch = BuilderRuntimeUtils.parseJson(config.json) || {};
            const merged = { ...base, ...patch };
            context.payload = JSON.stringify(merged, null, 2);
            context.logs.push('JSON payload merged with configured object.');
        }
    },
    {
        id: 'json-pretty-print',
        category: 'utility',
        name: 'Pretty print JSON',
        description: 'Format JSON payload for readability.',
        icon: 'align-left',
        accent: '#0f172a',
        tags: ['json'],
        defaultConfig: {},
        form: [],
        runner: async (context) => {
            const parsed = BuilderRuntimeUtils.parseJson(context.payload);
            if (!parsed) {
                context.logs.push('Pretty print skipped: payload not JSON.');
                return;
            }
            context.payload = JSON.stringify(parsed, null, 2);
            context.logs.push('Payload pretty-printed as JSON.');
        }
    },
    {
        id: 'json-array-length',
        category: 'utility',
        name: 'JSON array length',
        description: 'Store the length of a JSON array payload.',
        icon: 'list-ordered',
        accent: '#64748b',
        tags: ['json', 'metrics'],
        defaultConfig: { variable: 'arrayLength' },
        form: [
            { key: 'variable', label: 'Variable to store length', type: 'text', placeholder: 'arrayLength' }
        ],
        runner: async (context, config) => {
            const parsed = BuilderRuntimeUtils.parseJson(context.payload);
            const length = Array.isArray(parsed) ? parsed.length : 0;
            context.payload = String(length);
            const key = String(config.variable || '').trim();
            if (key) context.vars[key] = length;
            context.logs.push(`Array length calculated: ${length}.`);
        }
    },
    {
        id: 'list-split-lines',
        category: 'utility',
        name: 'Split lines',
        description: 'Split payload text into a list of lines.',
        icon: 'divide-square',
        accent: '#db2777',
        tags: ['text', 'list'],
        defaultConfig: { delimiter: '\n', storeVariable: 'lines' },
        form: [
            { key: 'delimiter', label: 'Delimiter', type: 'text', placeholder: '\n' },
            { key: 'storeVariable', label: 'Variable name', type: 'text', placeholder: 'lines' }
        ],
        runner: async (context, config) => {
            const delimiter = config.delimiter ?? '\n';
            const list = BuilderRuntimeUtils.splitToList(context.payload, delimiter, { trim: true });
            context.payload = JSON.stringify(list, null, 2);
            if (config.storeVariable) context.vars[config.storeVariable] = list;
            context.logs.push(`Payload split into ${list.length} items.`);
        }
    },
    {
        id: 'list-join-lines',
        category: 'utility',
        name: 'Join list',
        description: 'Join an array or newline-separated payload into single text.',
        icon: 'link-2',
        accent: '#f97316',
        tags: ['text', 'list'],
        defaultConfig: { separator: '\n', fromVariable: '' },
        form: [
            { key: 'separator', label: 'Separator', type: 'text', placeholder: '\n' },
            { key: 'fromVariable', label: 'Source variable (optional)', type: 'text', placeholder: 'lines' }
        ],
        runner: async (context, config) => {
            let source = context.payload;
            if (config.fromVariable) {
                source = context.vars[config.fromVariable];
            }
            const array = Array.isArray(source)
                ? source
                : BuilderRuntimeUtils.splitToList(source, '\n', { trim: false });
            context.payload = array.join(config.separator ?? '\n');
            context.logs.push('List joined into payload text.');
        }
    },
    {
        id: 'list-sort-values',
        category: 'utility',
        name: 'Sort list values',
        description: 'Sort newline separated payload or stored list.',
        icon: 'arrow-up-down',
        accent: '#22c55e',
        tags: ['list'],
        defaultConfig: { order: 'asc', fromVariable: '' },
        form: [
            { key: 'order', label: 'Order', type: 'select', options: [
                { value: 'asc', label: 'Ascending' },
                { value: 'desc', label: 'Descending' }
            ] },
            { key: 'fromVariable', label: 'Source variable (optional)', type: 'text', placeholder: 'lines' }
        ],
        runner: async (context, config) => {
            let list = config.fromVariable ? context.vars[config.fromVariable] : null;
            if (!Array.isArray(list)) {
                list = BuilderRuntimeUtils.splitToList(context.payload, '\n', { trim: true });
            }
            list.sort((a, b) => config.order === 'desc' ? b.localeCompare(a) : a.localeCompare(b));
            context.payload = list.join('\n');
            if (config.fromVariable) context.vars[config.fromVariable] = list;
            context.logs.push('List sorted.');
        }
    },
    {
        id: 'list-unique-values',
        category: 'utility',
        name: 'Unique list values',
        description: 'Remove duplicate entries from a list.',
        icon: 'filter',
        accent: '#a855f7',
        tags: ['list'],
        defaultConfig: { fromVariable: '' },
        form: [
            { key: 'fromVariable', label: 'Source variable (optional)', type: 'text', placeholder: 'lines' }
        ],
        runner: async (context, config) => {
            let list = config.fromVariable ? context.vars[config.fromVariable] : null;
            if (!Array.isArray(list)) {
                list = BuilderRuntimeUtils.splitToList(context.payload, '\n', { trim: true });
            }
            const unique = Array.from(new Set(list));
            context.payload = unique.join('\n');
            if (config.fromVariable) context.vars[config.fromVariable] = unique;
            context.logs.push('Duplicates removed from list.');
        }
    },
    {
        id: 'list-filter-contains',
        category: 'utility',
        name: 'Filter list',
        description: 'Filter list entries that contain a keyword.',
        icon: 'search',
        accent: '#2563eb',
        tags: ['list'],
        defaultConfig: { keyword: 'FlashSearch', fromVariable: '' },
        form: [
            { key: 'keyword', label: 'Keyword', type: 'text', placeholder: 'FlashSearch' },
            { key: 'fromVariable', label: 'Source variable (optional)', type: 'text', placeholder: 'lines' }
        ],
        runner: async (context, config) => {
            const keyword = String(config.keyword || '').toLowerCase();
            let list = config.fromVariable ? context.vars[config.fromVariable] : null;
            if (!Array.isArray(list)) {
                list = BuilderRuntimeUtils.splitToList(context.payload, '\n', { trim: true });
            }
            const filtered = keyword
                ? list.filter(item => item.toLowerCase().includes(keyword))
                : list;
            context.payload = filtered.join('\n');
            if (config.fromVariable) context.vars[config.fromVariable] = filtered;
            context.logs.push(`List filtered to ${filtered.length} entries.`);
        }
    },
    {
        id: 'list-chunk',
        category: 'utility',
        name: 'Chunk list',
        description: 'Split a list into equally sized chunks.',
        icon: 'grid',
        accent: '#14b8a6',
        tags: ['list'],
        defaultConfig: { size: 5, fromVariable: '', storeVariable: 'chunks' },
        form: [
            { key: 'size', label: 'Chunk size', type: 'number', min: 1, placeholder: '5' },
            { key: 'fromVariable', label: 'Source variable (optional)', type: 'text', placeholder: 'lines' },
            { key: 'storeVariable', label: 'Target variable', type: 'text', placeholder: 'chunks' }
        ],
        runner: async (context, config) => {
            let list = config.fromVariable ? context.vars[config.fromVariable] : null;
            if (!Array.isArray(list)) {
                list = BuilderRuntimeUtils.splitToList(context.payload, '\n', { trim: true });
            }
            const size = Math.max(1, Number(config.size) || 1);
            const chunks = [];
            for (let i = 0; i < list.length; i += size) {
                chunks.push(list.slice(i, i + size));
            }
            context.payload = JSON.stringify(chunks, null, 2);
            if (config.storeVariable) context.vars[config.storeVariable] = chunks;
            context.logs.push(`List chunked into ${chunks.length} groups.`);
        }
    },
    {
        id: 'string-length',
        category: 'utility',
        name: 'Measure length',
        description: 'Measure payload text length and store it.',
        icon: 'ruler',
        accent: '#ef4444',
        tags: ['text'],
        defaultConfig: { variable: 'payloadLength' },
        form: [
            { key: 'variable', label: 'Variable to store length', type: 'text', placeholder: 'payloadLength' }
        ],
        runner: async (context, config) => {
            const length = BuilderRuntimeUtils.toText(context.payload).length;
            context.payload = String(length);
            const key = String(config.variable || '').trim();
            if (key) context.vars[key] = length;
            context.logs.push(`Payload length measured: ${length}.`);
        }
    },
    {
        id: 'string-regex-extract',
        category: 'utility',
        name: 'Extract with regex',
        description: 'Extract first match of a regular expression.',
        icon: 'regex',
        accent: '#8b5cf6',
        tags: ['text', 'regex'],
        defaultConfig: { pattern: '(\\d+)', flags: 'g' },
        form: [
            { key: 'pattern', label: 'Regex pattern', type: 'text', placeholder: '(\\d+)' },
            { key: 'flags', label: 'Flags', type: 'text', placeholder: 'g' }
        ],
        runner: async (context, config) => {
            try {
                const regex = new RegExp(config.pattern || '', config.flags || '');
                const text = BuilderRuntimeUtils.toText(context.payload);
                const match = text.match(regex);
                context.payload = match ? match[0] : '';
                context.logs.push('Regex extraction completed.');
            } catch (error) {
                context.logs.push(`Regex extraction failed: ${error.message}`);
            }
        }
    },
    {
        id: 'string-regex-match-all',
        category: 'utility',
        name: 'Match all regex',
        description: 'Capture all regex matches as JSON array.',
        icon: 'braces',
        accent: '#f59e0b',
        tags: ['text', 'regex'],
        defaultConfig: { pattern: '(\\w+)', flags: 'g', storeVariable: 'matches' },
        form: [
            { key: 'pattern', label: 'Regex pattern', type: 'text', placeholder: '(\\w+)' },
            { key: 'flags', label: 'Flags', type: 'text', placeholder: 'g' },
            { key: 'storeVariable', label: 'Variable name', type: 'text', placeholder: 'matches' }
        ],
        runner: async (context, config) => {
            try {
                const regex = new RegExp(config.pattern || '', config.flags || 'g');
                const text = BuilderRuntimeUtils.toText(context.payload);
                const matches = Array.from(text.matchAll(regex)).map(m => m[0]);
                context.payload = JSON.stringify(matches, null, 2);
                if (config.storeVariable) context.vars[config.storeVariable] = matches;
                context.logs.push(`Collected ${matches.length} regex matches.`);
            } catch (error) {
                context.logs.push(`Regex match failed: ${error.message}`);
            }
        }
    },
    {
        id: 'string-replace',
        category: 'utility',
        name: 'Replace text',
        description: 'Replace all occurrences of a phrase in the payload.',
        icon: 'repeat-2',
        accent: '#4ade80',
        tags: ['text'],
        defaultConfig: { search: 'old', replace: 'new' },
        form: [
            { key: 'search', label: 'Search for', type: 'text', placeholder: 'old' },
            { key: 'replace', label: 'Replace with', type: 'text', placeholder: 'new' }
        ],
        runner: async (context, config) => {
            const source = BuilderRuntimeUtils.toText(context.payload);
            const search = String(config.search || '');
            const replace = config.replace ?? '';
            context.payload = search ? source.split(search).join(replace) : source;
            context.logs.push('Text replacement applied.');
        }
    },
    {
        id: 'string-base64-encode',
        category: 'utility',
        name: 'Base64 encode',
        description: 'Encode payload text as Base64.',
        icon: 'lock',
        accent: '#0891b2',
        tags: ['encoding'],
        defaultConfig: {},
        form: [],
        runner: async (context) => {
            const text = BuilderRuntimeUtils.toText(context.payload);
            context.payload = Buffer.from(text, 'utf8').toString('base64');
            context.logs.push('Payload encoded as Base64.');
        }
    },
    {
        id: 'string-base64-decode',
        category: 'utility',
        name: 'Base64 decode',
        description: 'Decode Base64 payload into UTF-8 text.',
        icon: 'unlock',
        accent: '#6366f1',
        tags: ['encoding'],
        defaultConfig: {},
        form: [],
        runner: async (context) => {
            try {
                const decoded = Buffer.from(BuilderRuntimeUtils.toText(context.payload), 'base64').toString('utf8');
                context.payload = decoded;
                context.logs.push('Payload decoded from Base64.');
            } catch (error) {
                context.logs.push('Base64 decode failed: invalid input.');
            }
        }
    },
    {
        id: 'string-slugify',
        category: 'utility',
        name: 'Slugify text',
        description: 'Convert payload text to a URL-friendly slug.',
        icon: 'link',
        accent: '#f472b6',
        tags: ['text'],
        defaultConfig: {},
        form: [],
        runner: async (context) => {
            context.payload = BuilderRuntimeUtils.slugify(context.payload);
            context.logs.push('Payload slug generated.');
        }
    },
    {
        id: 'string-truncate',
        category: 'utility',
        name: 'Truncate text',
        description: 'Limit payload text to a maximum length.',
        icon: 'scissors',
        accent: '#d946ef',
        tags: ['text'],
        defaultConfig: { length: 200, suffix: '…' },
        form: [
            { key: 'length', label: 'Max length', type: 'number', min: 1, placeholder: '200' },
            { key: 'suffix', label: 'Suffix', type: 'text', placeholder: '…' }
        ],
        runner: async (context, config) => {
            const text = BuilderRuntimeUtils.toText(context.payload);
            const length = Math.max(1, Number(config.length) || 1);
            const suffix = config.suffix ?? '';
            context.payload = text.length > length ? text.slice(0, length) + suffix : text;
            context.logs.push('Payload truncated if necessary.');
        }
    },
    {
        id: 'math-calculate-expression',
        category: 'utility',
        name: 'Calculate expression',
        description: 'Evaluate a math expression with optional payload variable.',
        icon: 'calculator',
        accent: '#22c55e',
        tags: ['math'],
        defaultConfig: { expression: '2 + 2', variableName: 'x' },
        form: [
            { key: 'expression', label: 'Expression', type: 'text', placeholder: '2 + 2' },
            { key: 'variableName', label: 'Payload variable name', type: 'text', placeholder: 'x' }
        ],
        runner: async (context, config) => {
            const scope = { ...context.vars };
            const variableName = String(config.variableName || '').trim();
            if (variableName) {
                scope[variableName] = Number(context.payload) || BuilderRuntimeUtils.toNumber(context.payload);
            }
            try {
                const result = math.evaluate(config.expression || '0', scope);
                context.payload = String(result);
                context.logs.push('Math expression evaluated.');
            } catch (error) {
                context.payload = '';
                context.logs.push(`Math evaluation failed: ${error.message}`);
            }
        }
    },
    {
        id: 'math-random-number',
        category: 'utility',
        name: 'Random number',
        description: 'Generate a random number within a range.',
        icon: 'dice-3',
        accent: '#0ea5e9',
        tags: ['math'],
        defaultConfig: { min: 0, max: 100, variable: 'randomNumber' },
        form: [
            { key: 'min', label: 'Minimum', type: 'number', placeholder: '0' },
            { key: 'max', label: 'Maximum', type: 'number', placeholder: '100' },
            { key: 'variable', label: 'Variable name', type: 'text', placeholder: 'randomNumber' }
        ],
        runner: async (context, config) => {
            const min = Number(config.min) || 0;
            const max = Number(config.max) || 100;
            const value = Math.random() * (max - min) + min;
            context.payload = String(value);
            if (config.variable) context.vars[config.variable] = value;
            context.logs.push('Random number generated.');
        }
    },
    {
        id: 'math-round-number',
        category: 'utility',
        name: 'Round number',
        description: 'Round payload number to chosen precision.',
        icon: 'circle-dot',
        accent: '#facc15',
        tags: ['math'],
        defaultConfig: { precision: 2 },
        form: [
            { key: 'precision', label: 'Decimal places', type: 'number', min: 0, placeholder: '2' }
        ],
        runner: async (context, config) => {
            const value = Number(context.payload);
            const precision = Math.max(0, Number(config.precision) || 0);
            if (Number.isFinite(value)) {
                context.payload = value.toFixed(precision);
                context.logs.push('Payload rounded to precision.');
            } else {
                context.logs.push('Round skipped: payload is not a number.');
            }
        }
    },
    {
        id: 'math-percentage-of',
        category: 'utility',
        name: 'Calculate percentage',
        description: 'Calculate a percentage of a number.',
        icon: 'percent',
        accent: '#f97316',
        tags: ['math'],
        defaultConfig: { value: '100', percent: 20 },
        form: [
            { key: 'value', label: 'Value', type: 'text', placeholder: '100' },
            { key: 'percent', label: 'Percent', type: 'number', placeholder: '20' }
        ],
        runner: async (context, config) => {
            const base = Number(config.value ?? context.payload);
            const percent = Number(config.percent) || 0;
            if (Number.isFinite(base)) {
                const result = (base * percent) / 100;
                context.payload = String(result);
                context.logs.push('Percentage calculated.');
            } else {
                context.logs.push('Percentage calculation skipped: invalid value.');
            }
        }
    },
    {
        id: 'math-sum-list',
        category: 'utility',
        name: 'Sum list values',
        description: 'Sum numeric values from a list or payload.',
        icon: 'sum',
        accent: '#22d3ee',
        tags: ['math', 'list'],
        defaultConfig: { delimiter: '\n' },
        form: [
            { key: 'delimiter', label: 'Delimiter', type: 'text', placeholder: '\n' }
        ],
        runner: async (context, config) => {
            const items = BuilderRuntimeUtils.splitToList(context.payload, config.delimiter || '\n', { trim: true });
            const sum = items.reduce((total, item) => {
                const value = Number(item);
                return Number.isFinite(value) ? total + value : total;
            }, 0);
            context.payload = String(sum);
            context.logs.push('List values summed.');
        }
    },
    {
        id: 'date-format',
        category: 'utility',
        name: 'Format date',
        description: 'Format payload or current date using locale options.',
        icon: 'calendar',
        accent: '#4c1d95',
        tags: ['date'],
        defaultConfig: { locale: 'en-US', dateStyle: 'medium', timeStyle: 'short' },
        form: [
            { key: 'locale', label: 'Locale', type: 'text', placeholder: 'en-US' },
            { key: 'dateStyle', label: 'Date style', type: 'select', options: [
                { value: 'full', label: 'Full' },
                { value: 'long', label: 'Long' },
                { value: 'medium', label: 'Medium' },
                { value: 'short', label: 'Short' },
                { value: 'none', label: 'None' }
            ] },
            { key: 'timeStyle', label: 'Time style', type: 'select', options: [
                { value: 'full', label: 'Full' },
                { value: 'long', label: 'Long' },
                { value: 'medium', label: 'Medium' },
                { value: 'short', label: 'Short' },
                { value: 'none', label: 'None' }
            ] }
        ],
        runner: async (context, config) => {
            const sourceDate = context.payload ? new Date(context.payload) : new Date();
            if (Number.isNaN(sourceDate.getTime())) {
                context.logs.push('Date formatting skipped: invalid date.');
                return;
            }
            const options = {};
            if (config.dateStyle && config.dateStyle !== 'none') options.dateStyle = config.dateStyle;
            if (config.timeStyle && config.timeStyle !== 'none') options.timeStyle = config.timeStyle;
            context.payload = sourceDate.toLocaleString(config.locale || undefined, options);
            context.logs.push('Date formatted.');
        }
    },
    {
        id: 'date-add-duration',
        category: 'utility',
        name: 'Add duration',
        description: 'Add duration to the payload date.',
        icon: 'clock',
        accent: '#fb7185',
        tags: ['date'],
        defaultConfig: { unit: 'minutes', amount: 15 },
        form: [
            { key: 'unit', label: 'Unit', type: 'select', options: [
                { value: 'minutes', label: 'Minutes' },
                { value: 'hours', label: 'Hours' },
                { value: 'days', label: 'Days' },
                { value: 'weeks', label: 'Weeks' }
            ] },
            { key: 'amount', label: 'Amount', type: 'number', placeholder: '15' }
        ],
        runner: async (context, config) => {
            const base = context.payload ? new Date(context.payload) : new Date();
            if (Number.isNaN(base.getTime())) {
                context.logs.push('Add duration skipped: invalid date.');
                return;
            }
            const amount = Number(config.amount) || 0;
            const updated = new Date(base.getTime());
            switch (config.unit) {
                case 'weeks':
                    updated.setDate(updated.getDate() + amount * 7);
                    break;
                case 'days':
                    updated.setDate(updated.getDate() + amount);
                    break;
                case 'hours':
                    updated.setHours(updated.getHours() + amount);
                    break;
                case 'minutes':
                default:
                    updated.setMinutes(updated.getMinutes() + amount);
                    break;
            }
            context.payload = updated.toISOString();
            context.logs.push('Duration added to date.');
        }
    },
    {
        id: 'date-difference',
        category: 'utility',
        name: 'Date difference',
        description: 'Calculate difference between payload date and another date.',
        icon: 'timer',
        accent: '#10b981',
        tags: ['date'],
        defaultConfig: { compareTo: '', unit: 'minutes' },
        form: [
            { key: 'compareTo', label: 'Compare to (ISO date)', type: 'text', placeholder: '2024-01-01T00:00:00Z' },
            { key: 'unit', label: 'Unit', type: 'select', options: [
                { value: 'minutes', label: 'Minutes' },
                { value: 'hours', label: 'Hours' },
                { value: 'days', label: 'Days' }
            ] }
        ],
        runner: async (context, config) => {
            const first = context.payload ? new Date(context.payload) : new Date();
            const second = config.compareTo ? new Date(config.compareTo) : new Date();
            if (Number.isNaN(first.getTime()) || Number.isNaN(second.getTime())) {
                context.logs.push('Date difference skipped: invalid date.');
                return;
            }
            const diffMs = first.getTime() - second.getTime();
            let value = diffMs / 60000;
            if (config.unit === 'hours') value = diffMs / 3600000;
            else if (config.unit === 'days') value = diffMs / 86400000;
            context.payload = String(value);
            context.logs.push('Date difference calculated.');
        }
    },
    {
        id: 'generate-uuid',
        category: 'utility',
        name: 'Generate UUID',
        description: 'Generate a new UUID and store it in the payload.',
        icon: 'fingerprint',
        accent: '#6366f1',
        tags: ['id'],
        defaultConfig: { variable: 'uuid' },
        form: [
            { key: 'variable', label: 'Variable name', type: 'text', placeholder: 'uuid' }
        ],
        runner: async (context, config) => {
            const id = randomUUID();
            context.payload = id;
            if (config.variable) context.vars[config.variable] = id;
            context.logs.push('UUID generated.');
        }
    },
    {
        id: 'generate-password',
        category: 'utility',
        name: 'Generate password',
        description: 'Generate a secure random password.',
        icon: 'shield',
        accent: '#f87171',
        tags: ['security'],
        defaultConfig: { length: 16, includeSymbols: true },
        form: [
            { key: 'length', label: 'Length', type: 'number', min: 4, placeholder: '16' },
            { key: 'includeSymbols', label: 'Include symbols', type: 'checkbox' }
        ],
        runner: async (context, config) => {
            const length = Math.max(4, Number(config.length) || 16);
            const alphabet = config.includeSymbols
                ? 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=' :
                'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            context.payload = BuilderRuntimeUtils.randomString(length, alphabet);
            context.logs.push('Password generated.');
        }
    },
    {
        id: 'validate-email',
        category: 'utility',
        name: 'Validate email',
        description: 'Validate payload text as an email address.',
        icon: 'mail-check',
        accent: '#2563eb',
        tags: ['validation'],
        defaultConfig: { variable: 'isEmailValid' },
        form: [
            { key: 'variable', label: 'Variable name', type: 'text', placeholder: 'isEmailValid' }
        ],
        runner: async (context, config) => {
            const email = BuilderRuntimeUtils.toText(context.payload).trim();
            const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
            context.payload = String(isValid);
            if (config.variable) context.vars[config.variable] = isValid;
            context.logs.push(`Email validation result: ${isValid}.`);
        }
    },
    {
        id: 'validate-url',
        category: 'utility',
        name: 'Validate URL',
        description: 'Validate payload text as an absolute URL.',
        icon: 'globe',
        accent: '#0ea5e9',
        tags: ['validation'],
        defaultConfig: { variable: 'isUrlValid' },
        form: [
            { key: 'variable', label: 'Variable name', type: 'text', placeholder: 'isUrlValid' }
        ],
        runner: async (context, config) => {
            let isValid = false;
            try {
                const value = BuilderRuntimeUtils.toText(context.payload).trim();
                const url = new URL(value);
                isValid = Boolean(url.protocol && url.host);
            } catch (error) {
                isValid = false;
            }
            context.payload = String(isValid);
            if (config.variable) context.vars[config.variable] = isValid;
            context.logs.push(`URL validation result: ${isValid}.`);
        }
    },
    {
        id: 'http-build-query',
        category: 'utility',
        name: 'Build query string',
        description: 'Convert JSON payload into a URL query string.',
        icon: 'list',
        accent: '#facc15',
        tags: ['http'],
        defaultConfig: { prefix: '?', storeVariable: 'queryString' },
        form: [
            { key: 'prefix', label: 'Prefix', type: 'text', placeholder: '?' },
            { key: 'storeVariable', label: 'Variable name', type: 'text', placeholder: 'queryString' }
        ],
        runner: async (context, config) => {
            const payload = BuilderRuntimeUtils.parseJson(context.payload) || {};
            const query = new URLSearchParams(payload).toString();
            const value = (config.prefix ?? '') + query;
            context.payload = value;
            if (config.storeVariable) context.vars[config.storeVariable] = value;
            context.logs.push('Query string built from payload.');
        }
    },
    {
        id: 'context-reset',
        category: 'utility',
        name: 'Reset context',
        description: 'Clear payload, variables, or logs selectively.',
        icon: 'refresh-ccw',
        accent: '#111827',
        tags: ['context'],
        defaultConfig: { clearPayload: true, clearVariables: false, clearLogs: false },
        form: [
            { key: 'clearPayload', label: 'Clear payload', type: 'checkbox' },
            { key: 'clearVariables', label: 'Clear variables', type: 'checkbox' },
            { key: 'clearLogs', label: 'Clear logs', type: 'checkbox' }
        ],
        runner: async (context, config) => {
            if (BuilderRuntimeUtils.toBoolean(config.clearPayload)) context.payload = '';
            if (BuilderRuntimeUtils.toBoolean(config.clearVariables)) context.vars = {};
            if (BuilderRuntimeUtils.toBoolean(config.clearLogs)) context.logs.length = 0;
            context.logs.push('Context reset executed.');
        }
    }
];

const UtilityBlueprints = UtilitySpecs.map(spec => ({ ...spec }));

const AdditionalModuleBlueprints = [
    ...TriggerBlueprints,
    ...ActionBlueprints,
    ...UtilityBlueprints
];

const QuickActionModuleDefinitions = [
    ...LegacyModuleDefinitions,
    ...AdditionalModuleBlueprints.map(createModuleDefinition)
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
    modulePreviewModuleId: null,
    libraryWindow: null,
    libraryWindowMonitor: null,
    boundLibraryMessageHandler: null,

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
        this.moduleSearchQuery = '';
        this.modulePreviewModuleId = null;
        if (this.libraryWindow && !this.libraryWindow.closed) {
            this.libraryWindow.close();
        }
        this.libraryWindow = null;
        if (this.libraryWindowMonitor) {
            clearInterval(this.libraryWindowMonitor);
        }
        this.libraryWindowMonitor = null;
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
            moduleSearchInput: Utils.getElement('#builder-module-search'),
            moduleSearchClear: Utils.getElement('#builder-module-search-clear'),
            openLibraryWindow: Utils.getElement('#builder-open-library-window'),
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
            modulePreview: Utils.getElement('#builder-module-preview'),
            modulePreviewName: Utils.getElement('#builder-module-preview-name'),
            modulePreviewDescription: Utils.getElement('#builder-module-preview-description'),
            modulePreviewDetails: Utils.getElement('#builder-module-preview-details'),
            modulePreviewForm: Utils.getElement('#builder-module-preview-form'),
            modulePreviewAdd: Utils.getElement('#builder-module-preview-add'),
            modulePreviewOpenWindow: Utils.getElement('#builder-module-preview-open-window'),
            modulePreviewClose: Utils.getElement('#builder-module-preview-close')
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

        if (!this.boundLibraryMessageHandler) {
            this.boundLibraryMessageHandler = (event) => this.handleLibraryWindowMessage(event);
        }
        window.addEventListener('message', this.boundLibraryMessageHandler);

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

        this.elements.moduleSearchInput?.addEventListener('input', (event) => {
            this.setModuleSearchQuery(event.target.value || '');
        });

        this.elements.moduleSearchClear?.addEventListener('click', () => {
            if (this.elements.moduleSearchInput) {
                this.elements.moduleSearchInput.value = '';
            }
            this.setModuleSearchQuery('');
            this.elements.moduleSearchInput?.focus();
        });

        this.elements.openLibraryWindow?.addEventListener('click', () => this.openModuleLibraryWindow());

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
        this.elements.modulePreviewClose?.addEventListener('click', () => this.closeModulePreview());
        this.elements.modulePreviewAdd?.addEventListener('click', () => {
            if (this.modulePreviewModuleId) {
                this.addNode(this.modulePreviewModuleId);
                this.closeModulePreview();
            }
        });
        this.elements.modulePreviewOpenWindow?.addEventListener('click', () => this.openModulePreviewWindow());
        this.elements.modulePreview?.addEventListener('click', (event) => {
            if (event.target === this.elements.modulePreview) {
                this.closeModulePreview();
            }
        });

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
        this.closeModulePreview();
        this.closeLibraryWindow();
        this.moduleSearchQuery = '';
        if (this.elements.moduleSearchInput) {
            this.elements.moduleSearchInput.value = '';
        }
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
        const lists = [
            { container: this.elements.triggerList, items: QuickActionModulesByCategory.triggers },
            { container: this.elements.actionList, items: QuickActionModulesByCategory.actions },
            { container: this.elements.utilityList, items: QuickActionModulesByCategory.utilities }
        ];

        lists.forEach(({ container, items }) => {
            if (!container) return;
            container.innerHTML = '';
            const filtered = this.filterModules(items);
            if (filtered.length === 0) {
                const empty = Utils.createElement('li', {
                    className: 'builder-module-empty',
                    text: this.moduleSearchQuery
                        ? (LocalizationRenderer.t('quick_actions_builder_no_results') || 'No blocks match your search.')
                        : (LocalizationRenderer.t('quick_actions_builder_no_blocks') || 'No blocks available in this category yet.')
                });
                container.appendChild(empty);
                return;
            }

            filtered.forEach(({ module, highlight }) => {
                const item = Utils.createElement('li', { className: 'builder-module-item' });
                item.setAttribute('data-module-id', module.id);
                if (highlight) {
                    item.setAttribute('data-highlight', 'true');
                } else {
                    item.removeAttribute('data-highlight');
                }

                const header = Utils.createElement('div', { className: 'builder-module-item-header' });
                const title = Utils.createElement('strong', { text: this.getModuleName(module) });
                header.appendChild(title);
                item.appendChild(header);

                if (module.description || module.descriptionKey) {
                    item.appendChild(Utils.createElement('span', { text: this.getModuleDescription(module) }));
                }

                if (Array.isArray(module.tags) && module.tags.length > 0) {
                    const tags = Utils.createElement('div', { className: 'builder-module-item-tags' });
                    module.tags.slice(0, 6).forEach(tag => {
                        tags.appendChild(Utils.createElement('span', { text: tag }));
                    });
                    item.appendChild(tags);
                }

                const actions = Utils.createElement('div', { className: 'builder-module-item-actions' });
                const addButton = Utils.createElement('button', { text: LocalizationRenderer.t('quick_actions_builder_add') || 'Add' });
                addButton.type = 'button';
                addButton.addEventListener('click', (event) => {
                    event.stopPropagation();
                    this.addNode(module.id);
                });
                const previewButton = Utils.createElement('button', { text: LocalizationRenderer.t('quick_actions_builder_preview') || 'Preview' });
                previewButton.type = 'button';
                previewButton.addEventListener('click', (event) => {
                    event.stopPropagation();
                    this.openModulePreview(module.id);
                });
                actions.appendChild(addButton);
                actions.appendChild(previewButton);
                item.appendChild(actions);

                item.addEventListener('click', () => this.addNode(module.id));
                container.appendChild(item);
            });
        });
        this.renderModulePreview();
    },

    filterModules(items = []) {
        return items
            .map(module => ({ module, info: this.getModuleSearchInfo(module) }))
            .filter(({ info }) => info.matches)
            .map(({ module, info }) => ({ module, highlight: info.highlight }));
    },

    getModuleSearchInfo(module) {
        if (!module) return { matches: false, highlight: false };
        if (!this.moduleSearchQuery) {
            return { matches: true, highlight: false };
        }
        const query = this.moduleSearchQuery.split(/\s+/).filter(Boolean);
        if (query.length === 0) {
            return { matches: true, highlight: false };
        }
        const name = (this.getModuleName(module) || '').toLowerCase();
        const description = (this.getModuleDescription(module) || '').toLowerCase();
        const tags = Array.isArray(module.tags) ? module.tags.join(' ') : '';
        const keywords = Array.isArray(module.keywords) ? module.keywords.join(' ') : '';
        const haystack = [
            module.id || '',
            module.category || '',
            module.icon || '',
            name,
            description,
            tags,
            keywords
        ].join(' ').toLowerCase();
        const matches = query.every(token => haystack.includes(token));
        return { matches, highlight: matches };
    },

    setModuleSearchQuery(query) {
        const normalized = String(query || '').trim().toLowerCase();
        if (normalized === this.moduleSearchQuery) return;
        this.moduleSearchQuery = normalized;
        this.renderModuleList();
    },

    openModulePreview(moduleId) {
        if (!moduleId) return;
        const module = QuickActionModuleMap.get(moduleId);
        if (!module) return;
        this.modulePreviewModuleId = moduleId;
        this.renderModulePreview();
    },

    closeModulePreview() {
        if (this.elements.modulePreview) {
            this.elements.modulePreview.setAttribute('aria-hidden', 'true');
        }
        this.modulePreviewModuleId = null;
    },

    renderModulePreview() {
        const container = this.elements.modulePreview;
        if (!container) return;
        const moduleId = this.modulePreviewModuleId;
        if (!moduleId) {
            container.setAttribute('aria-hidden', 'true');
            return;
        }
        const module = QuickActionModuleMap.get(moduleId);
        const searchInfo = this.getModuleSearchInfo(module);
        if (!module || (this.moduleSearchQuery && !searchInfo.matches)) {
            this.closeModulePreview();
            return;
        }

        container.setAttribute('aria-hidden', 'false');
        if (this.elements.modulePreviewName) {
            this.elements.modulePreviewName.textContent = this.getModuleName(module);
        }
        if (this.elements.modulePreviewDescription) {
            this.elements.modulePreviewDescription.textContent = this.getModuleDescription(module);
        }

        if (this.elements.modulePreviewDetails) {
            const list = this.elements.modulePreviewDetails;
            list.innerHTML = '';
            const addDetail = (label, value) => {
                if (!value) return;
                list.appendChild(Utils.createElement('dt', { text: label }));
                list.appendChild(Utils.createElement('dd', { text: value }));
            };
            addDetail('Identifier', module.id);
            addDetail('Category', module.category ? module.category.charAt(0).toUpperCase() + module.category.slice(1) : '');
            addDetail('Icon', module.icon);
            addDetail('Accent', module.accent);
            if (Array.isArray(module.inputs) && module.inputs.length > 0) {
                addDetail('Inputs', module.inputs.map(input => input.label || input.id).join(', '));
            }
            if (Array.isArray(module.outputs) && module.outputs.length > 0) {
                addDetail('Outputs', module.outputs.map(output => output.label || output.id).join(', '));
            }
            if (Array.isArray(module.tags) && module.tags.length > 0) {
                addDetail('Tags', module.tags.join(', '));
            }
        }

        if (this.elements.modulePreviewForm) {
            const formContainer = this.elements.modulePreviewForm;
            formContainer.innerHTML = '';
            if (Array.isArray(module.form) && module.form.length > 0) {
                module.form.forEach(field => {
                    const fieldWrapper = Utils.createElement('div', { className: 'preview-field' });
                    fieldWrapper.appendChild(Utils.createElement('label', { text: field.label || field.key || 'Field' }));
                    const details = [];
                    if (field.type) details.push(`Type: ${field.type}`);
                    if (field.placeholder) details.push(`Placeholder: ${field.placeholder}`);
                    if (typeof field.rows === 'number') details.push(`Rows: ${field.rows}`);
                    if (typeof field.min === 'number') details.push(`Min: ${field.min}`);
                    if (typeof field.max === 'number') details.push(`Max: ${field.max}`);
                    if (typeof field.step === 'number') details.push(`Step: ${field.step}`);
                    if (field.description) details.push(field.description);
                    if (Array.isArray(field.options) && field.options.length > 0) {
                        details.push(`Options: ${field.options.map(opt => opt.label || opt.value).join(', ')}`);
                    }
                    fieldWrapper.appendChild(Utils.createElement('span', { text: details.join(' • ') || 'No additional configuration.' }));
                    formContainer.appendChild(fieldWrapper);
                });
            } else {
                formContainer.appendChild(Utils.createElement('p', {
                    text: LocalizationRenderer.t('quick_actions_no_settings') || 'This block has no configurable options.'
                }));
            }
        }
    },

    openModulePreviewWindow(moduleId = this.modulePreviewModuleId) {
        const module = moduleId ? QuickActionModuleMap.get(moduleId) : null;
        if (!module) {
            if (!moduleId) {
                alert(LocalizationRenderer.t('quick_actions_builder_select_module') || 'Select a block to preview it.');
            }
            return;
        }
        const previewWindow = window.open('', '', 'width=520,height=640');
        if (!previewWindow) {
            alert(LocalizationRenderer.t('quick_actions_builder_popup_blocked') || 'Unable to open preview window.');
            return;
        }
        const moduleData = {
            id: module.id,
            name: this.getModuleName(module),
            description: this.getModuleDescription(module),
            category: module.category,
            icon: module.icon,
            accent: module.accent,
            tags: module.tags || [],
            inputs: module.inputs || [],
            outputs: module.outputs || [],
            form: module.form || [],
            defaultConfig: module.defaultConfig || {}
        };
        const serialized = JSON.stringify(moduleData).replace(/</g, '\\u003c');
        const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${moduleData.name}</title>
<style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 24px; background: #0f172a; color: #f8fafc; }
    h1 { margin-top: 0; font-size: 22px; }
    .category { text-transform: uppercase; letter-spacing: 0.18em; font-size: 12px; opacity: 0.7; margin-bottom: 8px; }
    .section { margin-top: 24px; padding: 16px; border-radius: 12px; background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(148, 163, 184, 0.2); }
    .tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
    .tag { padding: 4px 10px; border-radius: 999px; background: rgba(59, 130, 246, 0.15); border: 1px solid rgba(96, 165, 250, 0.4); font-size: 12px; }
    button { background: #38bdf8; color: #0f172a; border: none; border-radius: 999px; padding: 10px 20px; font-weight: 600; cursor: pointer; margin-right: 12px; }
    button.secondary { background: transparent; color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.6); }
    dl { margin: 0; }
    dt { font-size: 12px; opacity: 0.7; margin-top: 12px; text-transform: uppercase; }
    dd { margin: 4px 0 0 0; font-size: 14px; }
    ul { margin: 0; padding-left: 18px; }
    li { margin-bottom: 6px; }
</style>
</head>
<body>
    <div class="category">${moduleData.category || ''}</div>
    <h1>${moduleData.name}</h1>
    <p>${moduleData.description}</p>
    <div class="section">
        <button id="preview-add">Add to builder</button>
        <button id="preview-preview" class="secondary">Highlight in builder</button>
    </div>
    <div class="section">
        <dl id="module-details"></dl>
    </div>
    <div class="section">
        <h2 style="margin-top:0;font-size:16px;">Fields</h2>
        <div id="module-fields"></div>
    </div>
    <script>
        const moduleData = ${serialized};
        const details = document.getElementById('module-details');
        const addDetail = (label, value) => {
            if (!value) return;
            const dt = document.createElement('dt');
            dt.textContent = label;
            const dd = document.createElement('dd');
            dd.textContent = value;
            details.appendChild(dt);
            details.appendChild(dd);
        };
        addDetail('Identifier', moduleData.id);
        addDetail('Icon', moduleData.icon);
        addDetail('Accent', moduleData.accent);
        if (moduleData.inputs.length) addDetail('Inputs', moduleData.inputs.map(i => i.label || i.id).join(', '));
        if (moduleData.outputs.length) addDetail('Outputs', moduleData.outputs.map(o => o.label || o.id).join(', '));
        if (moduleData.tags.length) {
            const tagWrapper = document.createElement('div');
            tagWrapper.className = 'tags';
            moduleData.tags.forEach(tag => {
                const span = document.createElement('span');
                span.className = 'tag';
                span.textContent = tag;
                tagWrapper.appendChild(span);
            });
            details.appendChild(tagWrapper);
        }
        const fieldContainer = document.getElementById('module-fields');
        if (moduleData.form.length === 0) {
            const empty = document.createElement('p');
            empty.textContent = 'This block has no configurable options.';
            fieldContainer.appendChild(empty);
        } else {
            const list = document.createElement('ul');
            moduleData.form.forEach(field => {
                const item = document.createElement('li');
                const parts = [field.label || field.key];
                if (field.type) parts.push('type: ' + field.type);
                if (field.placeholder) parts.push('placeholder: ' + field.placeholder);
                if (field.options && field.options.length) parts.push('options: ' + field.options.map(opt => opt.label || opt.value).join(', '));
                if (field.description) parts.push(field.description);
                item.textContent = parts.filter(Boolean).join(' • ');
                list.appendChild(item);
            });
            fieldContainer.appendChild(list);
        }
        document.getElementById('preview-add').addEventListener('click', () => {
            window.opener?.postMessage({ type: 'builder-add-module', moduleId: moduleData.id }, '*');
        });
        document.getElementById('preview-preview').addEventListener('click', () => {
            window.opener?.postMessage({ type: 'builder-preview-module', moduleId: moduleData.id }, '*');
            window.focus();
        });
    </script>
</body>
</html>`;
        previewWindow.document.open();
        previewWindow.document.write(html);
        previewWindow.document.close();
    },

    openModuleLibraryWindow() {
        if (this.libraryWindow && !this.libraryWindow.closed) {
            this.libraryWindow.focus();
            return;
        }
        const modules = QuickActionModuleDefinitions.map(def => ({
            id: def.id,
            name: this.getModuleName(def),
            description: this.getModuleDescription(def),
            category: def.category,
            icon: def.icon,
            accent: def.accent,
            tags: def.tags || [],
            searchable: [
                def.id,
                def.category,
                def.icon,
                this.getModuleName(def),
                this.getModuleDescription(def),
                Array.isArray(def.tags) ? def.tags.join(' ') : '',
                Array.isArray(def.keywords) ? def.keywords.join(' ') : ''
            ].join(' ').toLowerCase()
        }));
        const serialized = JSON.stringify(modules).replace(/</g, '\\u003c');
        const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Block library</title>
<style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; background: #020617; color: #e2e8f0; display: flex; flex-direction: column; min-height: 100vh; }
    header { padding: 24px; border-bottom: 1px solid rgba(148, 163, 184, 0.2); background: rgba(15, 23, 42, 0.8); position: sticky; top: 0; backdrop-filter: blur(12px); z-index: 10; }
    h1 { margin: 0 0 12px 0; font-size: 22px; }
    input { width: 100%; padding: 12px 16px; border-radius: 12px; border: 1px solid rgba(148, 163, 184, 0.35); background: rgba(15, 23, 42, 0.8); color: inherit; }
    main { flex: 1; overflow-y: auto; padding: 24px; display: grid; gap: 16px; }
    .card { border-radius: 16px; padding: 20px; background: rgba(15, 23, 42, 0.72); border: 1px solid rgba(148, 163, 184, 0.25); display: grid; gap: 10px; }
    .card h2 { margin: 0; font-size: 18px; }
    .category { font-size: 12px; text-transform: uppercase; letter-spacing: 0.12em; opacity: 0.6; }
    .actions { display: flex; gap: 10px; }
    button { flex: 1; border-radius: 999px; padding: 10px 16px; border: none; cursor: pointer; font-weight: 600; background: #38bdf8; color: #0f172a; }
    button.secondary { background: transparent; color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.5); }
    .tags { display: flex; gap: 6px; flex-wrap: wrap; }
    .tag { padding: 4px 10px; border-radius: 999px; background: rgba(59, 130, 246, 0.2); font-size: 12px; }
    .empty { text-align: center; opacity: 0.7; padding: 40px 0; }
</style>
</head>
<body>
    <header>
        <h1>Block library</h1>
        <input id="library-search" type="search" placeholder="Search blocks" autofocus>
    </header>
    <main id="library-list"></main>
    <script>
        const modules = ${serialized};
        const list = document.getElementById('library-list');
        const search = document.getElementById('library-search');
        const render = (query = '') => {
            const tokens = query.toLowerCase().trim().split(/\\s+/).filter(Boolean);
            list.innerHTML = '';
            const filtered = modules.filter(module => tokens.length === 0 || tokens.every(token => module.searchable.includes(token)));
            if (filtered.length === 0) {
                const empty = document.createElement('div');
                empty.className = 'empty';
                empty.textContent = 'No blocks match your search.';
                list.appendChild(empty);
                return;
            }
            filtered.forEach(module => {
                const card = document.createElement('div');
                card.className = 'card';
                const category = document.createElement('div');
                category.className = 'category';
                category.textContent = module.category || '';
                card.appendChild(category);
                const title = document.createElement('h2');
                title.textContent = module.name;
                card.appendChild(title);
                const desc = document.createElement('p');
                desc.textContent = module.description;
                card.appendChild(desc);
                if (module.tags.length) {
                    const tags = document.createElement('div');
                    tags.className = 'tags';
                    module.tags.slice(0, 8).forEach(tag => {
                        const span = document.createElement('span');
                        span.className = 'tag';
                        span.textContent = tag;
                        tags.appendChild(span);
                    });
                    card.appendChild(tags);
                }
                const actions = document.createElement('div');
                actions.className = 'actions';
                const add = document.createElement('button');
                add.textContent = 'Add to builder';
                add.addEventListener('click', () => {
                    window.opener?.postMessage({ type: 'builder-add-module', moduleId: module.id }, '*');
                });
                const preview = document.createElement('button');
                preview.className = 'secondary';
                preview.textContent = 'Preview';
                preview.addEventListener('click', () => {
                    window.opener?.postMessage({ type: 'builder-preview-module', moduleId: module.id }, '*');
                });
                actions.appendChild(add);
                actions.appendChild(preview);
                card.appendChild(actions);
                list.appendChild(card);
            });
        };
        search.addEventListener('input', (event) => render(event.target.value));
        render('');
        window.addEventListener('beforeunload', () => {
            window.opener?.postMessage({ type: 'builder-library-closed' }, '*');
        });
    </script>
</body>
</html>`;
        this.libraryWindow = window.open('', '', 'width=760,height=840');
        if (!this.libraryWindow) {
            alert(LocalizationRenderer.t('quick_actions_builder_popup_blocked') || 'Unable to open the block library window.');
            return;
        }
        this.libraryWindow.document.open();
        this.libraryWindow.document.write(html);
        this.libraryWindow.document.close();
        if (this.libraryWindowMonitor) {
            clearInterval(this.libraryWindowMonitor);
        }
        this.libraryWindowMonitor = setInterval(() => {
            if (!this.libraryWindow || this.libraryWindow.closed) {
                clearInterval(this.libraryWindowMonitor);
                this.libraryWindowMonitor = null;
                this.libraryWindow = null;
            }
        }, 1000);
    },

    closeLibraryWindow() {
        if (this.libraryWindowMonitor) {
            clearInterval(this.libraryWindowMonitor);
            this.libraryWindowMonitor = null;
        }
        if (this.libraryWindow && !this.libraryWindow.closed) {
            this.libraryWindow.close();
        }
        this.libraryWindow = null;
    },

    handleLibraryWindowMessage(event) {
        if (!event || !event.data) return;
        const { type, moduleId } = event.data;
        if (type === 'builder-library-closed') {
            this.closeLibraryWindow();
            return;
        }
        if (!moduleId) return;
        if (type === 'builder-add-module') {
            this.addNode(moduleId);
        }
        if (type === 'builder-preview-module') {
            this.openModulePreview(moduleId);
        }
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
