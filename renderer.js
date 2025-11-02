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

const AdditionalQuickActionModules = [];

const TriggerScenarios = [
    {
        id: 'keyboard-shortcut-trigger',
        name: 'Trigger: Keyboard shortcut',
        description: 'Simulate a workflow launched from a keyboard shortcut.',
        icon: 'type',
        accent: '#38bdf8',
        defaultConfig: { shortcut: 'Ctrl+Shift+K', note: '' },
        form: [
            { key: 'shortcut', label: 'Shortcut', type: 'text', placeholder: 'Ctrl+Shift+K' },
            { key: 'note', label: 'Notes', type: 'textarea', rows: 2, placeholder: 'Internal description' }
        ],
        tags: ['trigger', 'shortcut', 'hotkey'],
        onRun: (clone, config) => {
            const shortcut = ensureString(config?.shortcut || '').trim();
            if (shortcut) clone.vars.triggerShortcut = shortcut;
            if (config?.note) clone.vars.triggerNote = ensureString(config.note);
            clone.logs.push(`Trigger invoked via shortcut ${shortcut || 'custom shortcut'}.`);
        }
    },
    {
        id: 'schedule-trigger',
        name: 'Trigger: Schedule',
        description: 'Represent a cron or calendar-based automation entry point.',
        icon: 'clock',
        accent: '#facc15',
        defaultConfig: { cron: '0 9 * * 1', label: 'Weekly review' },
        form: [
            { key: 'cron', label: 'Cron expression', type: 'text', placeholder: '0 9 * * 1' },
            { key: 'label', label: 'Schedule label', type: 'text', placeholder: 'Weekly review' }
        ],
        tags: ['trigger', 'schedule'],
        onRun: (clone, config) => {
            clone.vars.triggerCron = ensureString(config?.cron || '');
            if (config?.label) clone.vars.triggerLabel = ensureString(config.label);
            clone.logs.push('Trigger executed according to configured schedule.');
        }
    },
    {
        id: 'clipboard-change-trigger',
        name: 'Trigger: Clipboard change',
        description: 'Start a workflow when clipboard content matches a rule.',
        icon: 'copy',
        accent: '#a855f7',
        defaultConfig: { keyword: '', sample: '' },
        form: [
            { key: 'keyword', label: 'Required keyword', type: 'text', placeholder: 'invoice' },
            { key: 'sample', label: 'Sample payload', type: 'textarea', rows: 3, placeholder: 'Paste example clipboard content' }
        ],
        tags: ['trigger', 'clipboard'],
        onRun: (clone, config) => {
            const sample = ensureString(config?.sample || '').trim();
            if (sample) clone.payload = sample;
            const keyword = ensureString(config?.keyword || '').trim();
            clone.logs.push(
                keyword ? `Clipboard trigger configured for keyword "${keyword}".` : 'Clipboard trigger executed without keyword filter.'
            );
        }
    },
    {
        id: 'incoming-webhook-trigger',
        name: 'Trigger: Incoming webhook',
        description: 'Use incoming webhook payloads as the initial context.',
        icon: 'activity',
        accent: '#34d399',
        defaultConfig: { url: '', secret: '' },
        form: [
            { key: 'url', label: 'Webhook endpoint', type: 'url', placeholder: 'https://example.com/hooks' },
            { key: 'secret', label: 'Shared secret', type: 'text', placeholder: 'Optional secret' }
        ],
        tags: ['trigger', 'webhook'],
        onRun: (clone, config) => {
            clone.vars.webhookUrl = ensureString(config?.url || '');
            clone.vars.webhookSecret = ensureString(config?.secret || '');
            clone.logs.push('Incoming webhook trigger initialized.');
        }
    },
    {
        id: 'ai-signal-trigger',
        name: 'Trigger: AI signal',
        description: 'Fetch a short AI insight to seed the workflow.',
        icon: 'radio',
        accent: '#38bdf8',
        defaultConfig: { endpoint: '', apiKey: '', prompt: 'Provide a quick insight.' },
        form: [
            { key: 'endpoint', label: 'AI endpoint', type: 'url', placeholder: 'https://api.example.ai/v1/completions' },
            { key: 'apiKey', label: 'API key', type: 'password', placeholder: 'sk-...' },
            { key: 'prompt', label: 'Prompt', type: 'textarea', rows: 3, placeholder: 'Describe what should be fetched' }
        ],
        tags: ['trigger', 'ai'],
        onRun: async (clone, config) => {
            const result = await performAiTextRequest(clone, config, {
                label: 'AI signal fetch',
                emptyPromptMessage: 'AI signal skipped: provide a prompt or payload.',
                missingEndpointMessage: 'AI signal skipped: endpoint missing.'
            });
            if (result) {
                clone.payload = result.text;
                clone.vars.lastAiResponse = result.raw;
                clone.logs.push('AI signal fetched successfully.');
            }
        }
    },
    {
        id: 'file-change-trigger',
        name: 'Trigger: File change',
        description: 'Document a workflow that should run when files change.',
        icon: 'file-text',
        accent: '#60a5fa',
        defaultConfig: { path: '~/Documents', event: 'modified' },
        form: [
            { key: 'path', label: 'Watched path', type: 'text', placeholder: '~/Documents' },
            { key: 'event', label: 'Event type', type: 'select', options: [
                { value: 'created', label: 'File created' },
                { value: 'modified', label: 'File modified' },
                { value: 'deleted', label: 'File deleted' }
            ] }
        ],
        tags: ['trigger', 'files'],
        onRun: (clone, config) => {
            clone.vars.fileWatchPath = ensureString(config?.path || '');
            clone.vars.fileWatchEvent = ensureString(config?.event || 'modified');
            clone.logs.push('File change trigger noted for documentation.');
        }
    },
    {
        id: 'timer-interval-trigger',
        name: 'Trigger: Interval timer',
        description: 'Run workflows at fixed intervals measured in minutes.',
        icon: 'refresh-cw',
        accent: '#4ade80',
        defaultConfig: { minutes: 15 },
        form: [{ key: 'minutes', label: 'Interval (minutes)', type: 'number', min: 1, placeholder: '15' }],
        tags: ['trigger', 'timer'],
        onRun: (clone, config) => {
            const minutes = Math.max(1, Number(config?.minutes || 0));
            clone.vars.intervalMinutes = minutes;
            clone.logs.push(`Interval trigger executed (every ${minutes} minute(s)).`);
        }
    },
    {
        id: 'form-response-trigger',
        name: 'Trigger: Form response',
        description: 'Load a sample submission from a form platform.',
        icon: 'file-plus',
        accent: '#f97316',
        defaultConfig: { formName: 'Contact form', sample: '' },
        form: [
            { key: 'formName', label: 'Form name', type: 'text', placeholder: 'Contact form' },
            { key: 'sample', label: 'Sample response', type: 'textarea', rows: 4, placeholder: '{"email":"user@example.com"}' }
        ],
        tags: ['trigger', 'forms'],
        onRun: (clone, config) => {
            const sample = ensureString(config?.sample || '');
            if (sample) clone.payload = sample;
            clone.vars.formName = ensureString(config?.formName || '');
            clone.logs.push('Form response trigger loaded.');
        }
    },
    {
        id: 'api-poll-trigger',
        name: 'Trigger: API poll',
        description: 'Poll an API endpoint for new data at the start of a workflow.',
        icon: 'cloud',
        accent: '#0ea5e9',
        defaultConfig: { url: '', path: '' },
        form: [
            { key: 'url', label: 'Endpoint URL', type: 'url', placeholder: 'https://api.example.com/status' },
            { key: 'path', label: 'Data path (optional)', type: 'text', placeholder: 'data.items[0]' }
        ],
        tags: ['trigger', 'api'],
        onRun: async (clone, config) => {
            const url = ensureString(config?.url || '').trim();
            if (!url) {
                clone.logs.push('API poll skipped: URL missing.');
                return;
            }
            try {
                const response = await fetch(url);
                const data = await response.json();
                clone.vars.apiPollRaw = data;
                if (config?.path) {
                    try {
                        const path = ensureString(config.path);
                        const value = path.split('.').reduce(
                            (acc, key) => (acc && acc[key] !== undefined ? acc[key] : null),
                            data
                        );
                        if (value !== null && value !== undefined) clone.payload = value;
                    } catch (error) {
                        clone.logs.push(`API poll path error: ${error.message}`);
                    }
                } else {
                    clone.payload = data;
                }
                clone.logs.push(`API poll succeeded for ${url}.`);
            } catch (error) {
                clone.logs.push(`API poll failed: ${error.message}`);
            }
        }
    },
    {
        id: 'calendar-start-trigger',
        name: 'Trigger: Calendar start',
        description: 'Kick off workflows aligned with calendar events.',
        icon: 'calendar',
        accent: '#fb7185',
        defaultConfig: { calendar: 'Primary', title: 'Team sync' },
        form: [
            { key: 'calendar', label: 'Calendar', type: 'text', placeholder: 'Primary' },
            { key: 'title', label: 'Event title', type: 'text', placeholder: 'Team sync' }
        ],
        tags: ['trigger', 'calendar'],
        onRun: (clone, config) => {
            clone.vars.calendarName = ensureString(config?.calendar || '');
            clone.vars.calendarEventTitle = ensureString(config?.title || '');
            clone.logs.push('Calendar-based trigger prepared.');
        }
    }
];

TriggerScenarios.forEach(scenario => {
    AdditionalQuickActionModules.push({
        id: scenario.id,
        category: 'trigger',
        name: scenario.name,
        description: scenario.description,
        icon: scenario.icon,
        accent: scenario.accent,
        inputs: [],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: scenario.defaultConfig,
        form: scenario.form,
        tags: scenario.tags,
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            await scenario.onRun(clone, config || {});
            return [clone];
        }
    });
});

const ActionScenarios = [
    {
        id: 'send-email',
        name: 'Send email draft',
        description: 'Open a prefilled email in the default mail client.',
        icon: 'mail',
        accent: '#f472b6',
        defaultConfig: { to: '', subject: 'Follow up', body: 'Hello from FlashSearch!', cc: '' },
        form: [
            { key: 'to', label: 'To', type: 'text', placeholder: 'team@example.com' },
            { key: 'cc', label: 'Cc', type: 'text', placeholder: 'Optional carbon copy' },
            { key: 'subject', label: 'Subject', type: 'text', placeholder: 'Follow up' },
            { key: 'body', label: 'Body', type: 'textarea', rows: 4, placeholder: 'Hello from FlashSearch!' }
        ],
        tags: ['email', 'communication'],
        onRun: async (clone, config) => {
            const to = encodeURIComponent(ensureString(config?.to || ''));
            const subject = encodeURIComponent(ensureString(config?.subject || ''));
            const cc = encodeURIComponent(ensureString(config?.cc || ''));
            const body = encodeURIComponent(ensureString(config?.body || clone.payload || ''));
            const params = new URLSearchParams();
            if (subject) params.set('subject', subject);
            if (cc) params.set('cc', cc);
            if (body) params.set('body', body);
            const mailto = `mailto:${to}?${params.toString()}`;
            try {
                await shell.openExternal(mailto);
                clone.logs.push('Email draft opened in default client.');
            } catch (error) {
                clone.logs.push(`Email launch failed: ${error.message}`);
            }
            clone.payload = ensureString(config?.body || clone.payload || '');
        }
    },
    {
        id: 'create-calendar-event',
        name: 'Create calendar event',
        description: 'Generate an ICS snippet representing a calendar event.',
        icon: 'calendar',
        accent: '#22d3ee',
        defaultConfig: {
            title: 'Strategy session',
            start: '2024-01-01T09:00:00Z',
            end: '2024-01-01T10:00:00Z',
            description: 'Discuss roadmap updates',
            location: 'Conference room'
        },
        form: [
            { key: 'title', label: 'Title', type: 'text', placeholder: 'Strategy session' },
            { key: 'start', label: 'Start (ISO)', type: 'text', placeholder: '2024-01-01T09:00:00Z' },
            { key: 'end', label: 'End (ISO)', type: 'text', placeholder: '2024-01-01T10:00:00Z' },
            { key: 'location', label: 'Location', type: 'text', placeholder: 'Conference room' },
            { key: 'description', label: 'Description', type: 'textarea', rows: 3, placeholder: 'Discuss roadmap updates' }
        ],
        tags: ['calendar', 'events'],
        onRun: (clone, config) => {
            const uid = `flashsearch-${Date.now()}@local`;
            const lines = [
                'BEGIN:VCALENDAR',
                'VERSION:2.0',
                'PRODID:-//FlashSearch//QuickActions//EN',
                'BEGIN:VEVENT',
                `UID:${uid}`,
                `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
                `DTSTART:${ensureString(config?.start || '').replace(/[-:]/g, '')}`,
                `DTEND:${ensureString(config?.end || '').replace(/[-:]/g, '')}`,
                `SUMMARY:${ensureString(config?.title || '')}`,
                `DESCRIPTION:${ensureString(config?.description || '')}`,
                `LOCATION:${ensureString(config?.location || '')}`,
                'END:VEVENT',
                'END:VCALENDAR'
            ];
            clone.payload = lines.join('\n');
            clone.logs.push('Calendar event generated as ICS payload.');
        }
    },
    {
        id: 'create-task-api',
        name: 'Create task via API',
        description: 'Send a JSON payload to a task management API.',
        icon: 'check-square',
        accent: '#a3e635',
        defaultConfig: { endpoint: '', apiKey: '', title: 'New task', notes: '' },
        form: [
            { key: 'endpoint', label: 'API endpoint', type: 'url', placeholder: 'https://api.example.com/tasks' },
            { key: 'apiKey', label: 'API key', type: 'password', placeholder: 'sk-...' },
            { key: 'title', label: 'Task title', type: 'text', placeholder: 'New task' },
            { key: 'notes', label: 'Task notes', type: 'textarea', rows: 3, placeholder: 'Details or instructions' }
        ],
        tags: ['api', 'tasks'],
        onRun: async (clone, config) => {
            const url = ensureString(config?.endpoint || '').trim();
            if (!url) {
                clone.logs.push('Task API skipped: endpoint missing.');
                return;
            }
            const body = {
                title: ensureString(config?.title || '') || ensureString(clone.payload || ''),
                notes: ensureString(config?.notes || '')
            };
            const headers = {
                'Content-Type': 'application/json',
                ...parseHeaderString(config?.headers || '')
            };
            const apiKey = ensureString(config?.apiKey || '').trim();
            if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(body)
                });
                clone.payload = await response.text();
                clone.logs.push(`Task API responded with status ${response.status}.`);
            } catch (error) {
                clone.logs.push(`Task API request failed: ${error.message}`);
            }
        }
    },
    {
        id: 'send-slack-message',
        name: 'Send Slack message',
        description: 'Publish a message to a Slack webhook URL.',
        icon: 'message-circle',
        accent: '#ec4899',
        defaultConfig: { url: '', text: 'Hello from FlashSearch!', username: 'Flash Bot' },
        form: [
            { key: 'url', label: 'Webhook URL', type: 'url', placeholder: 'https://hooks.slack.com/services/...'},
            { key: 'username', label: 'Display name', type: 'text', placeholder: 'Flash Bot' },
            { key: 'text', label: 'Message', type: 'textarea', rows: 3, placeholder: 'Hello from FlashSearch!' }
        ],
        tags: ['slack', 'chat'],
        onRun: async (clone, config) => {
            const url = ensureString(config?.url || '').trim();
            if (!url) {
                clone.logs.push('Slack webhook skipped: URL missing.');
                return;
            }
            const payload = {
                text: ensureString(config?.text || clone.payload || ''),
                username: ensureString(config?.username || 'Flash Bot')
            };
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                clone.payload = await response.text() || 'Message delivered.';
                clone.logs.push('Slack message sent.');
            } catch (error) {
                clone.logs.push(`Slack webhook failed: ${error.message}`);
            }
        }
    },
    {
        id: 'send-discord-webhook',
        name: 'Send Discord webhook',
        description: 'Push a payload to a Discord channel webhook.',
        icon: 'share-2',
        accent: '#6366f1',
        defaultConfig: { url: '', username: 'Flash Assistant', content: 'Notification from FlashSearch.' },
        form: [
            { key: 'url', label: 'Webhook URL', type: 'url', placeholder: 'https://discord.com/api/webhooks/...'},
            { key: 'username', label: 'Username', type: 'text', placeholder: 'Flash Assistant' },
            { key: 'content', label: 'Content', type: 'textarea', rows: 3, placeholder: 'Notification from FlashSearch.' }
        ],
        tags: ['discord', 'chat'],
        onRun: async (clone, config) => {
            const url = ensureString(config?.url || '').trim();
            if (!url) {
                clone.logs.push('Discord webhook skipped: URL missing.');
                return;
            }
            const payload = {
                username: ensureString(config?.username || 'Flash Assistant'),
                content: ensureString(config?.content || clone.payload || '')
            };
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                clone.payload = await response.text() || 'Message delivered.';
                clone.logs.push('Discord message sent.');
            } catch (error) {
                clone.logs.push(`Discord webhook failed: ${error.message}`);
            }
        }
    },
    {
        id: 'push-notification',
        name: 'Send push notification',
        description: 'Send a push notification via a generic push API.',
        icon: 'bell',
        accent: '#f97316',
        defaultConfig: { url: '', apiKey: '', title: 'FlashSearch', message: 'You have a new alert.' },
        form: [
            { key: 'url', label: 'Push API URL', type: 'url', placeholder: 'https://api.push.example.com/send' },
            { key: 'apiKey', label: 'API key', type: 'password', placeholder: 'sk-...' },
            { key: 'title', label: 'Title', type: 'text', placeholder: 'FlashSearch' },
            { key: 'message', label: 'Message', type: 'textarea', rows: 3, placeholder: 'You have a new alert.' }
        ],
        tags: ['notifications', 'api'],
        onRun: async (clone, config) => {
            const url = ensureString(config?.url || '').trim();
            if (!url) {
                clone.logs.push('Push notification skipped: URL missing.');
                return;
            }
            const headers = {
                'Content-Type': 'application/json',
                ...parseHeaderString(config?.headers || '')
            };
            const apiKey = ensureString(config?.apiKey || '').trim();
            if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
            const payload = {
                title: ensureString(config?.title || 'FlashSearch'),
                message: ensureString(config?.message || clone.payload || '')
            };
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(payload)
                });
                clone.payload = await response.text() || JSON.stringify({ delivered: true });
                clone.logs.push('Push notification dispatched.');
            } catch (error) {
                clone.logs.push(`Push notification failed: ${error.message}`);
            }
        }
    }
];

ActionScenarios.forEach(scenario => {
    AdditionalQuickActionModules.push({
        id: scenario.id,
        category: 'action',
        name: scenario.name,
        description: scenario.description,
        icon: scenario.icon,
        accent: scenario.accent,
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: scenario.defaultConfig,
        form: scenario.form,
        tags: scenario.tags,
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            await scenario.onRun(clone, config || {});
            return [clone];
        }
    });
});

const HttpModuleScenarios = [
    {
        id: 'post-webhook',
        method: 'POST',
        name: 'POST webhook',
        description: 'Send a POST request with configurable payload and headers.',
        icon: 'send',
        accent: '#fb923c',
        defaultConfig: { url: '', payload: '{"ok":true}', headers: '' },
        tags: ['webhook', 'http']
    },
    {
        id: 'put-webhook',
        method: 'PUT',
        name: 'PUT webhook',
        description: 'Send an HTTP PUT request to update remote resources.',
        icon: 'upload',
        accent: '#60a5fa',
        defaultConfig: { url: '', payload: '{"status":"updated"}', headers: '' },
        tags: ['webhook', 'http']
    },
    {
        id: 'delete-webhook',
        method: 'DELETE',
        name: 'DELETE webhook',
        description: 'Send an HTTP DELETE request to remove data remotely.',
        icon: 'trash-2',
        accent: '#f87171',
        defaultConfig: { url: '', headers: '' },
        tags: ['webhook', 'http']
    },
    {
        id: 'http-get',
        method: 'GET',
        name: 'HTTP GET request',
        description: 'Fetch data from any HTTP endpoint and store the response.',
        icon: 'download-cloud',
        accent: '#38bdf8',
        defaultConfig: { url: '', headers: '' },
        tags: ['http', 'fetch']
    },
    {
        id: 'http-head',
        method: 'HEAD',
        name: 'HTTP HEAD request',
        description: 'Retrieve only headers to check endpoint availability.',
        icon: 'info',
        accent: '#c084fc',
        defaultConfig: { url: '', headers: '' },
        tags: ['http', 'monitoring']
    },
    {
        id: 'http-download',
        method: 'GET',
        name: 'HTTP download text',
        description: 'Download textual content and attach it to the payload.',
        icon: 'file-down',
        accent: '#fbbf24',
        defaultConfig: { url: '', headers: '' },
        tags: ['http', 'download'],
        asTextOnly: true
    }
];

HttpModuleScenarios.forEach(scenario => {
    AdditionalQuickActionModules.push({
        id: scenario.id,
        category: 'action',
        name: scenario.name,
        description: scenario.description,
        icon: scenario.icon,
        accent: scenario.accent,
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: scenario.defaultConfig,
        form: [
            { key: 'url', label: 'URL', type: 'url', placeholder: 'https://example.com/api' },
            scenario.method !== 'GET' && scenario.method !== 'HEAD'
                ? { key: 'payload', label: 'Payload', type: 'textarea', rows: 4, placeholder: '{"ok":true}' }
                : null,
            { key: 'headers', label: 'Headers', type: 'textarea', rows: 3, placeholder: 'Authorization: Bearer token' }
        ].filter(Boolean),
        tags: scenario.tags,
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const url = ensureString(config?.url || '').trim();
            if (!url) {
                clone.logs.push(`${scenario.method} request skipped: URL missing.`);
                return [clone];
            }
            const headers = parseHeaderString(config?.headers || '');
            if (scenario.method !== 'GET' && scenario.method !== 'HEAD') {
                headers['Content-Type'] = headers['Content-Type'] || 'application/json';
            }
            try {
                const options = { method: scenario.method, headers };
                if (scenario.method !== 'GET' && scenario.method !== 'HEAD') {
                    options.body = ensureString(config?.payload || clone.payload || '{}');
                }
                const response = await fetch(url, options);
                if (scenario.method === 'HEAD') {
                    clone.payload = Array.from(response.headers.entries())
                        .map(([key, value]) => `${key}: ${value}`)
                        .join('\n');
                } else {
                    const text = await response.text();
                    clone.payload = scenario.asTextOnly ? text : text;
                }
                clone.logs.push(`${scenario.method} ${url} returned status ${response.status}.`);
            } catch (error) {
                clone.logs.push(`${scenario.method} request failed: ${error.message}`);
            }
            return [clone];
        }
    });
});

const TextUtilityScenarios = [
    {
        id: 'string-slugify',
        name: 'Text: Slugify',
        description: 'Turn text into a URL-friendly slug.',
        icon: 'link',
        accent: '#f97316',
        defaultConfig: { delimiter: '-' },
        form: [{ key: 'delimiter', label: 'Delimiter', type: 'text', placeholder: '-' }],
        tags: ['text', 'formatting'],
        transform: (value, config) => {
            const delimiter = ensureString(config?.delimiter || '-');
            return ensureString(value)
                .toLowerCase()
                .replace(/[^\p{L}\p{N}]+/gu, delimiter)
                .replace(new RegExp(`${delimiter}+`, 'g'), delimiter)
                .replace(new RegExp(`^${delimiter}|${delimiter}$`, 'g'), '');
        }
    },
    {
        id: 'string-replace',
        name: 'Text: Replace',
        description: 'Replace occurrences of text using simple find and replace.',
        icon: 'edit-2',
        accent: '#60a5fa',
        defaultConfig: { search: '', replace: '' },
        form: [
            { key: 'search', label: 'Find', type: 'text', placeholder: 'old value' },
            { key: 'replace', label: 'Replace with', type: 'text', placeholder: 'new value' }
        ],
        tags: ['text', 'replace'],
        transform: (value, config, clone) => {
            const search = ensureString(config?.search || '');
            if (!search) {
                clone.logs.push('Replace skipped: nothing to search for.');
                return value;
            }
            const replace = ensureString(config?.replace || '');
            return ensureString(value).split(search).join(replace);
        }
    },
    {
        id: 'string-regex-extract',
        name: 'Text: Regex extract',
        description: 'Extract the first regular-expression match from text.',
        icon: 'filter',
        accent: '#34d399',
        defaultConfig: { pattern: '(\\d+)', flags: '' },
        form: [
            { key: 'pattern', label: 'Pattern', type: 'text', placeholder: '(\\d+)' },
            { key: 'flags', label: 'Flags', type: 'text', placeholder: 'gim' }
        ],
        tags: ['text', 'regex'],
        transform: (value, config, clone) => {
            const pattern = ensureString(config?.pattern || '');
            if (!pattern) {
                clone.logs.push('Regex extract skipped: pattern missing.');
                return value;
            }
            try {
                const regex = new RegExp(pattern, ensureString(config?.flags || ''));
                const match = ensureString(value).match(regex);
                return match ? match[0] : '';
            } catch (error) {
                clone.logs.push(`Regex extract failed: ${error.message}`);
                return value;
            }
        }
    },
    {
        id: 'string-split',
        name: 'Text: Split',
        description: 'Split text into an array using a delimiter.',
        icon: 'scissors',
        accent: '#a855f7',
        defaultConfig: { delimiter: '\n' },
        form: [{ key: 'delimiter', label: 'Delimiter', type: 'text', placeholder: '\n' }],
        tags: ['text', 'split'],
        transform: (value, config) => ensureString(value).split(ensureString(config?.delimiter || '\n')).filter(Boolean)
    },
    {
        id: 'string-join',
        name: 'Text: Join list',
        description: 'Join a list or newline-separated payload into a single string.',
        icon: 'list',
        accent: '#38bdf8',
        defaultConfig: { delimiter: ', ' },
        form: [{ key: 'delimiter', label: 'Delimiter', type: 'text', placeholder: ', ' }],
        tags: ['text', 'join'],
        transform: (value, config) => {
            const delimiter = ensureString(config?.delimiter || ', ');
            const list = Array.isArray(value) ? value : ensureArray(value);
            return list.join(delimiter);
        }
    },
    {
        id: 'string-truncate',
        name: 'Text: Truncate',
        description: 'Limit text to a maximum length and append ellipsis.',
        icon: 'minus',
        accent: '#f59e0b',
        defaultConfig: { length: 140, suffix: '…' },
        form: [
            { key: 'length', label: 'Max length', type: 'number', placeholder: '140' },
            { key: 'suffix', label: 'Suffix', type: 'text', placeholder: '…' }
        ],
        tags: ['text', 'truncate'],
        transform: (value, config) => {
            const length = Math.max(1, Number(config?.length || 140));
            const suffix = ensureString(config?.suffix || '…');
            const text = ensureString(value || '');
            return text.length > length ? text.slice(0, length) + suffix : text;
        }
    },
    {
        id: 'string-remove-duplicates',
        name: 'Text: Remove duplicate lines',
        description: 'Remove duplicate lines from a multi-line string.',
        icon: 'align-left',
        accent: '#34d399',
        defaultConfig: {},
        tags: ['text', 'cleanup'],
        transform: (value) => Array.from(new Set(ensureString(value).split(/\r?\n/).filter(Boolean))).join('\n')
    }
];

TextUtilityScenarios.forEach(scenario => {
    AdditionalQuickActionModules.push({
        id: scenario.id,
        category: 'utility',
        name: scenario.name,
        description: scenario.description,
        icon: scenario.icon,
        accent: scenario.accent,
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: scenario.defaultConfig,
        form: scenario.form,
        tags: scenario.tags,
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            clone.payload = scenario.transform(clone.payload, config || {}, clone);
            clone.logs.push(`${scenario.name} applied.`);
            return [clone];
        }
    });
});

const ListUtilityScenarios = [
    {
        id: 'list-unique',
        name: 'List: Unique values',
        description: 'Remove duplicate entries from a list payload.',
        icon: 'shuffle',
        accent: '#14b8a6',
        transform: (value) => Array.from(new Set((Array.isArray(value) ? value : ensureArray(value)).map(item => ensureString(item)))),
        tags: ['list', 'cleanup']
    },
    {
        id: 'list-sort',
        name: 'List: Sort',
        description: 'Sort list items alphabetically or numerically.',
        icon: 'list',
        accent: '#0ea5e9',
        defaultConfig: { direction: 'asc', numeric: false },
        form: [
            { key: 'direction', label: 'Direction', type: 'select', options: [
                { value: 'asc', label: 'Ascending' },
                { value: 'desc', label: 'Descending' }
            ] },
            { key: 'numeric', label: 'Numeric sort', type: 'checkbox' }
        ],
        transform: (value, config) => {
            const list = Array.isArray(value) ? value.slice() : ensureArray(value);
            const numeric = Boolean(config?.numeric);
            list.sort((a, b) => {
                if (numeric) return Number(a) - Number(b);
                return ensureString(a).localeCompare(ensureString(b));
            });
            if (config?.direction === 'desc') list.reverse();
            return list;
        },
        tags: ['list', 'sort']
    },
    {
        id: 'list-shuffle',
        name: 'List: Shuffle',
        description: 'Randomly shuffle the items in a list payload.',
        icon: 'repeat',
        accent: '#f472b6',
        transform: (value) => {
            const list = Array.isArray(value) ? value.slice() : ensureArray(value);
            for (let i = list.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [list[i], list[j]] = [list[j], list[i]];
            }
            return list;
        },
        tags: ['list', 'random']
    },
    {
        id: 'list-limit',
        name: 'List: Limit items',
        description: 'Keep only the first N items of a list.',
        icon: 'filter',
        accent: '#c084fc',
        defaultConfig: { limit: 5 },
        form: [{ key: 'limit', label: 'Limit', type: 'number', placeholder: '5' }],
        transform: (value, config) => {
            const limit = Math.max(0, Number(config?.limit || 0));
            const list = Array.isArray(value) ? value : ensureArray(value);
            return list.slice(0, limit || list.length);
        },
        tags: ['list', 'limit']
    }
];

ListUtilityScenarios.forEach(scenario => {
    AdditionalQuickActionModules.push({
        id: scenario.id,
        category: 'utility',
        name: scenario.name,
        description: scenario.description,
        icon: scenario.icon,
        accent: scenario.accent,
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: scenario.defaultConfig || {},
        form: scenario.form,
        tags: scenario.tags,
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            clone.payload = scenario.transform(clone.payload, config || {}, clone);
            clone.logs.push(`${scenario.name} applied.`);
            return [clone];
        }
    });
});

const PayloadUtilityModules = [
    {
        id: 'payload-append',
        name: 'Payload: Append text',
        description: 'Append text to the existing payload string.',
        icon: 'plus',
        accent: '#fb7185',
        defaultConfig: { text: '' },
        form: [{ key: 'text', label: 'Append text', type: 'textarea', rows: 3, placeholder: 'Additional notes' }],
        tags: ['payload', 'text'],
        apply: (clone, config) => {
            const base = ensureString(clone.payload || '');
            const extra = ensureString(config?.text || '');
            clone.payload = base + extra;
            clone.logs.push('Text appended to payload.');
        }
    },
    {
        id: 'payload-prepend',
        name: 'Payload: Prepend text',
        description: 'Add text to the beginning of the payload.',
        icon: 'arrow-up',
        accent: '#22d3ee',
        defaultConfig: { text: '' },
        form: [{ key: 'text', label: 'Prepend text', type: 'textarea', rows: 3, placeholder: 'Prefix' }],
        tags: ['payload', 'text'],
        apply: (clone, config) => {
            const base = ensureString(clone.payload || '');
            const extra = ensureString(config?.text || '');
            clone.payload = extra + base;
            clone.logs.push('Text prepended to payload.');
        }
    },
    {
        id: 'payload-merge-vars',
        name: 'Payload: Merge variables',
        description: 'Merge the payload into workflow variables for later use.',
        icon: 'database',
        accent: '#f472b6',
        defaultConfig: { variable: 'payloadSnapshot' },
        form: [{ key: 'variable', label: 'Variable name', type: 'text', placeholder: 'payloadSnapshot' }],
        tags: ['payload', 'variables'],
        apply: (clone, config) => {
            const key = ensureString(config?.variable || 'payloadSnapshot');
            clone.vars[key] = clone.payload;
            clone.logs.push(`Stored payload in variable "${key}".`);
        }
    },
    {
        id: 'payload-set-default',
        name: 'Payload: Set default',
        description: 'Provide a default payload value when it is empty.',
        icon: 'edit',
        accent: '#f59e0b',
        defaultConfig: { value: 'Default value' },
        form: [{ key: 'value', label: 'Default value', type: 'textarea', rows: 3, placeholder: 'Default value' }],
        tags: ['payload'],
        apply: (clone, config) => {
            if (clone.payload === null || clone.payload === undefined || clone.payload === '') {
                clone.payload = config?.value ?? 'Default value';
                clone.logs.push('Default payload applied.');
            }
        }
    },
    {
        id: 'payload-to-json',
        name: 'Payload: Parse JSON',
        description: 'Parse the payload string as JSON and store the object.',
        icon: 'code',
        accent: '#38bdf8',
        defaultConfig: { variable: 'jsonPayload' },
        form: [{ key: 'variable', label: 'Variable name', type: 'text', placeholder: 'jsonPayload' }],
        tags: ['payload', 'json'],
        apply: (clone, config) => {
            try {
                const parsed = JSON.parse(ensureString(clone.payload || '{}'));
                clone.vars[ensureString(config?.variable || 'jsonPayload')] = parsed;
                clone.payload = parsed;
                clone.logs.push('Payload parsed as JSON.');
            } catch (error) {
                clone.logs.push(`JSON parse failed: ${error.message}`);
            }
        }
    },
    {
        id: 'payload-from-json',
        name: 'Payload: Stringify JSON',
        description: 'Stringify an object payload into formatted JSON.',
        icon: 'codesandbox',
        accent: '#818cf8',
        defaultConfig: { spacing: 2 },
        form: [{ key: 'spacing', label: 'Indentation', type: 'number', min: 0, max: 8, placeholder: '2' }],
        tags: ['payload', 'json'],
        apply: (clone, config) => {
            try {
                const spacing = Math.min(8, Math.max(0, Number(config?.spacing || 2)));
                clone.payload = JSON.stringify(clone.payload, null, spacing);
                clone.logs.push('Payload stringified to JSON.');
            } catch (error) {
                clone.logs.push(`JSON stringify failed: ${error.message}`);
            }
        }
    },
    {
        id: 'payload-to-base64',
        name: 'Payload: Encode Base64',
        description: 'Encode the payload string using Base64 encoding.',
        icon: 'lock',
        accent: '#f97316',
        defaultConfig: {},
        tags: ['payload', 'encoding'],
        apply: (clone) => {
            try {
                clone.payload = Buffer.from(ensureString(clone.payload || ''), 'utf8').toString('base64');
                clone.logs.push('Payload encoded as Base64.');
            } catch (error) {
                clone.logs.push(`Base64 encode failed: ${error.message}`);
            }
        }
    },
    {
        id: 'payload-from-base64',
        name: 'Payload: Decode Base64',
        description: 'Decode Base64 payload back to text.',
        icon: 'unlock',
        accent: '#34d399',
        defaultConfig: {},
        tags: ['payload', 'encoding'],
        apply: (clone) => {
            try {
                clone.payload = Buffer.from(ensureString(clone.payload || ''), 'base64').toString('utf8');
                clone.logs.push('Payload decoded from Base64.');
            } catch (error) {
                clone.logs.push(`Base64 decode failed: ${error.message}`);
            }
        }
    }
];

PayloadUtilityModules.forEach(module => {
    AdditionalQuickActionModules.push({
        id: module.id,
        category: 'utility',
        name: module.name,
        description: module.description,
        icon: module.icon,
        accent: module.accent,
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: module.defaultConfig,
        form: module.form,
        tags: module.tags,
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            module.apply(clone, config || {});
            return [clone];
        }
    });
});

const AiModuleScenarios = [
    {
        id: 'ai-generate-text',
        name: 'AI: Generate text',
        description: 'Send a creative writing prompt to an AI endpoint.',
        icon: 'pen-tool',
        accent: '#f472b6',
        defaultPrompt: 'Write a concise response based on the payload: {{payload}}',
        label: 'AI generation',
        tags: ['ai', 'text']
    },
    {
        id: 'ai-summarize-text',
        name: 'AI: Summarize',
        description: 'Ask the AI service to summarize the provided payload.',
        icon: 'book-open',
        accent: '#38bdf8',
        defaultPrompt: 'Summarize the following content in three bullet points: {{payload}}',
        label: 'AI summarization',
        tags: ['ai', 'summary']
    },
    {
        id: 'ai-translate-text',
        name: 'AI: Translate',
        description: 'Translate the payload into a chosen language using AI.',
        icon: 'globe',
        accent: '#22c55e',
        defaultPrompt: 'Translate the following text into the target language. Text: {{payload}}',
        label: 'AI translation',
        tags: ['ai', 'translation']
    },
    {
        id: 'ai-generate-image',
        name: 'AI: Generate image',
        description: 'Request an image generation endpoint and return the JSON response.',
        icon: 'image',
        accent: '#facc15',
        defaultPrompt: 'Create an illustration that represents the following idea: {{payload}}',
        label: 'AI image generation',
        overrides: { fallbackField: 'data', defaultModel: 'image-alpha' },
        tags: ['ai', 'image']
    },
    {
        id: 'ai-embed-text',
        name: 'AI: Generate embeddings',
        description: 'Produce vector embeddings for semantic search.',
        icon: 'layers',
        accent: '#8b5cf6',
        defaultPrompt: '{{payload}}',
        label: 'AI embeddings',
        overrides: { fallbackField: 'data', defaultModel: 'text-embedding-3-large' },
        tags: ['ai', 'embeddings']
    },
    {
        id: 'ai-chat-completion',
        name: 'AI: Chat completion',
        description: 'Send the payload to a chat completion endpoint using system instructions.',
        icon: 'message-square',
        accent: '#0ea5e9',
        defaultPrompt: '{{payload}}',
        label: 'AI chat',
        overrides: { useMessages: true, systemPrompt: 'You are a helpful assistant responding concisely.' },
        tags: ['ai', 'chat']
    },
    {
        id: 'ai-code-review',
        name: 'AI: Code review',
        description: 'Ask the AI to review code for potential improvements.',
        icon: 'code',
        accent: '#f97316',
        defaultPrompt: 'Review the following code snippet and list potential improvements: {{payload}}',
        label: 'AI code review',
        overrides: { useMessages: true, systemPrompt: 'You are a meticulous senior engineer providing actionable feedback.' },
        tags: ['ai', 'code']
    },
    {
        id: 'ai-generate-tasks',
        name: 'AI: Generate tasks',
        description: 'Convert payload text into actionable checklist items.',
        icon: 'check-square',
        accent: '#a3e635',
        defaultPrompt: 'Turn the following notes into a bullet list of tasks with verbs: {{payload}}',
        label: 'AI task planner',
        tags: ['ai', 'tasks']
    },
    {
        id: 'ai-content-policy',
        name: 'AI: Content policy check',
        description: 'Send payload to moderation endpoints to flag potential issues.',
        icon: 'shield',
        accent: '#f87171',
        defaultPrompt: '{{payload}}',
        label: 'AI moderation',
        overrides: { fallbackField: 'results' },
        tags: ['ai', 'moderation']
    },
    {
        id: 'ai-title-suggestion',
        name: 'AI: Generate title',
        description: 'Ask AI for a punchy title for the payload content.',
        icon: 'type',
        accent: '#fb7185',
        defaultPrompt: 'Write a short, catchy title for the following content: {{payload}}',
        label: 'AI title',
        tags: ['ai', 'copywriting']
    },
    {
        id: 'ai-tag-suggestion',
        name: 'AI: Suggest tags',
        description: 'Generate descriptive tags for the payload using AI.',
        icon: 'tag',
        accent: '#22d3ee',
        defaultPrompt: 'Suggest five comma-separated tags describing this content: {{payload}}',
        label: 'AI tagging',
        tags: ['ai', 'metadata']
    },
    {
        id: 'ai-tone-rewrite',
        name: 'AI: Rewrite tone',
        description: 'Rewrite the payload with the desired tone of voice.',
        icon: 'italic',
        accent: '#fbbf24',
        defaultPrompt: 'Rewrite the following text in a friendly and encouraging tone: {{payload}}',
        label: 'AI rewrite',
        tags: ['ai', 'editing']
    },
    {
        id: 'ai-extract-key-points',
        name: 'AI: Extract key points',
        description: 'Summarize payload into highlights and action items.',
        icon: 'list',
        accent: '#34d399',
        defaultPrompt: 'Extract the key points and action items from: {{payload}}',
        label: 'AI key points',
        tags: ['ai', 'analysis']
    },
    {
        id: 'ai-language-detect',
        name: 'AI: Detect language',
        description: 'Detect the language of the payload using AI.',
        icon: 'flag',
        accent: '#6366f1',
        defaultPrompt: 'Identify the language of this text and respond with the language name: {{payload}}',
        label: 'AI language detect',
        tags: ['ai', 'analysis']
    }
];

AiModuleScenarios.forEach(scenario => {
    AdditionalQuickActionModules.push({
        id: scenario.id,
        category: 'action',
        name: scenario.name,
        description: scenario.description,
        icon: scenario.icon,
        accent: scenario.accent,
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: { endpoint: '', apiKey: '', model: 'gpt-3.5-turbo', prompt: scenario.defaultPrompt, temperature: 0.7, maxTokens: 256 },
        form: [
            { key: 'endpoint', label: 'API endpoint', type: 'url', placeholder: 'https://api.openai.com/v1/chat/completions' },
            { key: 'apiKey', label: 'API key', type: 'password', placeholder: 'sk-...' },
            { key: 'model', label: 'Model', type: 'text', placeholder: 'gpt-3.5-turbo' },
            { key: 'prompt', label: 'Prompt template', type: 'textarea', rows: 4, placeholder: scenario.defaultPrompt },
            { key: 'temperature', label: 'Temperature', type: 'number', step: '0.1', placeholder: '0.7' },
            { key: 'maxTokens', label: 'Max tokens', type: 'number', placeholder: '256' }
        ],
        tags: scenario.tags,
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const result = await performAiTextRequest(clone, config, {
                label: scenario.label,
                defaultPrompt: scenario.defaultPrompt,
                ...scenario.overrides
            });
            if (result) {
                clone.payload = result.text;
                clone.vars.lastAiResponse = result.raw;
                clone.logs.push(`${scenario.label} completed.`);
            }
            return [clone];
        }
    });
});

const AiProviderScenarios = [
    {
        id: 'ai-openai-gpt4o',
        name: 'AI: OpenAI GPT-4o',
        description: 'Use the GPT-4o chat endpoint for creative, multi-step replies.',
        icon: 'cpu',
        accent: '#8b5cf6',
        defaultEndpoint: 'https://api.openai.com/v1/chat/completions',
        defaultModel: 'gpt-4o',
        defaultPrompt: 'Provide a structured answer to the following request: {{payload}}',
        defaultTemperature: 0.6,
        defaultMaxTokens: 800,
        label: 'OpenAI GPT-4o',
        tags: ['ai', 'openai', 'chat']
    },
    {
        id: 'ai-openai-o1',
        name: 'AI: OpenAI o1 reasoning',
        description: 'Send complex reasoning prompts to the OpenAI o1-mini endpoint.',
        icon: 'git-branch',
        accent: '#f97316',
        defaultEndpoint: 'https://api.openai.com/v1/chat/completions',
        defaultModel: 'o1-mini',
        defaultPrompt: 'Reason carefully through the following request and explain the result: {{payload}}',
        defaultTemperature: 0.2,
        defaultMaxTokens: 1024,
        label: 'OpenAI reasoning',
        overrides: { useMessages: true, systemPrompt: 'You are a thoughtful reasoning assistant.' },
        tags: ['ai', 'openai', 'reasoning']
    },
    {
        id: 'ai-anthropic-claude',
        name: 'AI: Anthropic Claude',
        description: 'Call the Claude 3 Messages API with system guidance.',
        icon: 'sun',
        accent: '#facc15',
        defaultEndpoint: 'https://api.anthropic.com/v1/messages',
        defaultModel: 'claude-3-opus-20240229',
        defaultPrompt: 'Respond as Claude to the user request: {{payload}}',
        defaultTemperature: 0.5,
        defaultMaxTokens: 900,
        label: 'Anthropic Claude',
        overrides: {
            useMessages: true,
            authHeader: 'x-api-key',
            authPrefix: '',
            headers: { 'anthropic-version': '2023-06-01' }
        },
        extraDefaults: { headers: 'anthropic-version: 2023-06-01' },
        includeHeadersField: true,
        tags: ['ai', 'anthropic', 'chat']
    },
    {
        id: 'ai-mistral-large',
        name: 'AI: Mistral Large',
        description: 'Query the Mistral chat API for succinct answers.',
        icon: 'feather',
        accent: '#22d3ee',
        defaultEndpoint: 'https://api.mistral.ai/v1/chat/completions',
        defaultModel: 'mistral-large-latest',
        defaultPrompt: 'Answer the following with helpful context: {{payload}}',
        defaultTemperature: 0.4,
        defaultMaxTokens: 700,
        label: 'Mistral Large',
        overrides: { useMessages: true },
        tags: ['ai', 'mistral', 'chat']
    },
    {
        id: 'ai-cohere-command',
        name: 'AI: Cohere Command R+',
        description: 'Send prompts to Cohere\'s Command R+ endpoint.',
        icon: 'command',
        accent: '#a855f7',
        defaultEndpoint: 'https://api.cohere.com/v1/chat',
        defaultModel: 'command-r-plus',
        defaultPrompt: 'Provide an insightful response for: {{payload}}',
        defaultTemperature: 0.6,
        defaultMaxTokens: 800,
        label: 'Cohere Command R+',
        overrides: { useMessages: true },
        tags: ['ai', 'cohere', 'chat']
    },
    {
        id: 'ai-groq-llama3',
        name: 'AI: Groq LLaMA 3',
        description: 'Use Groq\'s low-latency LLaMA 3 API for fast completions.',
        icon: 'zap',
        accent: '#34d399',
        defaultEndpoint: 'https://api.groq.com/openai/v1/chat/completions',
        defaultModel: 'llama3-70b-8192',
        defaultPrompt: 'Respond quickly and accurately to: {{payload}}',
        defaultTemperature: 0.3,
        defaultMaxTokens: 768,
        label: 'Groq LLaMA 3',
        overrides: { useMessages: true },
        tags: ['ai', 'groq', 'chat']
    },
    {
        id: 'ai-fireworks-mixtral',
        name: 'AI: Fireworks Mixtral',
        description: 'Route prompts to Fireworks AI\'s Mixtral hosted model.',
        icon: 'fire',
        accent: '#ef4444',
        defaultEndpoint: 'https://api.fireworks.ai/inference/v1/chat/completions',
        defaultModel: 'accounts/fireworks/models/mixtral-8x7b-instruct',
        defaultPrompt: 'Reply with an expert yet concise answer: {{payload}}',
        defaultTemperature: 0.5,
        defaultMaxTokens: 700,
        label: 'Fireworks Mixtral',
        overrides: { useMessages: true },
        tags: ['ai', 'fireworks', 'chat']
    },
    {
        id: 'ai-openrouter-mixtral',
        name: 'AI: OpenRouter Mixtral',
        description: 'Leverage the OpenRouter aggregation endpoint with Mixtral.',
        icon: 'share-2',
        accent: '#38bdf8',
        defaultEndpoint: 'https://openrouter.ai/api/v1/chat/completions',
        defaultModel: 'mistralai/mixtral-8x7b-instruct',
        defaultPrompt: 'Answer the user with references when relevant: {{payload}}',
        defaultTemperature: 0.6,
        defaultMaxTokens: 750,
        label: 'OpenRouter Mixtral',
        overrides: { useMessages: true },
        includeHeadersField: true,
        extraDefaults: { headers: 'HTTP-Referer: https://flashsearch.app' },
        tags: ['ai', 'openrouter', 'chat']
    },
    {
        id: 'ai-huggingface-inference',
        name: 'AI: Hugging Face Inference',
        description: 'Call a Hugging Face text-inference endpoint with custom headers.',
        icon: 'package',
        accent: '#f59e0b',
        defaultEndpoint: 'https://api-inference.huggingface.co/models/bigcode/starcoder',
        defaultModel: 'bigcode/starcoder',
        defaultPrompt: '{{payload}}',
        defaultTemperature: 0.2,
        defaultMaxTokens: 256,
        label: 'Hugging Face Inference',
        overrides: {
            omitModel: true,
            promptField: 'inputs',
            maxTokensField: 'max_new_tokens',
            temperatureField: 'temperature'
        },
        includeHeadersField: true,
        tags: ['ai', 'huggingface', 'code']
    },
    {
        id: 'ai-azure-openai',
        name: 'AI: Azure OpenAI',
        description: 'Send prompts to an Azure OpenAI deployment with API key header.',
        icon: 'cloud',
        accent: '#0ea5e9',
        defaultEndpoint: 'https://your-resource.openai.azure.com/openai/deployments/deployment-id/chat/completions?api-version=2024-02-15-preview',
        defaultModel: 'gpt-4o',
        defaultPrompt: 'Respond with Azure OpenAI using deployment defaults: {{payload}}',
        defaultTemperature: 0.6,
        defaultMaxTokens: 700,
        label: 'Azure OpenAI',
        overrides: { useMessages: true, authHeader: 'api-key', authPrefix: '' },
        includeHeadersField: true,
        tags: ['ai', 'azure', 'openai']
    },
    {
        id: 'ai-perplexity-answer',
        name: 'AI: Perplexity Answer',
        description: 'Use the Perplexity AI chat endpoint for cited answers.',
        icon: 'search',
        accent: '#6366f1',
        defaultEndpoint: 'https://api.perplexity.ai/chat/completions',
        defaultModel: 'sonar-small-online',
        defaultPrompt: 'Answer with sources and short bullet points: {{payload}}',
        defaultTemperature: 0.4,
        defaultMaxTokens: 900,
        label: 'Perplexity Answer',
        overrides: { useMessages: true },
        tags: ['ai', 'perplexity', 'search']
    },
    {
        id: 'ai-ollama-local',
        name: 'AI: Local Ollama',
        description: 'Call a locally hosted Ollama server using the OpenAI-compatible API.',
        icon: 'hard-drive',
        accent: '#64748b',
        defaultEndpoint: 'http://localhost:11434/v1/chat/completions',
        defaultModel: 'llama3',
        defaultPrompt: 'Answer using the local Ollama model: {{payload}}',
        defaultTemperature: 0.7,
        defaultMaxTokens: 512,
        label: 'Local Ollama',
        overrides: { useMessages: true, skipAuthorizationHeader: true },
        tags: ['ai', 'local', 'chat']
    }
];

AiProviderScenarios.forEach(scenario => {
    const form = [
        { key: 'endpoint', label: 'API endpoint', type: 'url', placeholder: scenario.defaultEndpoint },
        { key: 'apiKey', label: 'API key', type: 'password', placeholder: scenario.apiKeyPlaceholder || 'sk-...' },
        { key: 'model', label: 'Model', type: 'text', placeholder: scenario.defaultModel || 'model name' },
        { key: 'prompt', label: 'Prompt template', type: 'textarea', rows: 4, placeholder: scenario.defaultPrompt },
        { key: 'temperature', label: 'Temperature', type: 'number', step: '0.1', placeholder: String(scenario.defaultTemperature ?? 0.7) },
        { key: 'maxTokens', label: 'Max tokens', type: 'number', placeholder: String(scenario.defaultMaxTokens ?? 512) }
    ];
    if (scenario.includeHeadersField) {
        form.push({ key: 'headers', label: 'Extra headers', type: 'textarea', rows: 2, placeholder: 'Header: value' });
    }
    if (Array.isArray(scenario.formExtras)) {
        form.push(...scenario.formExtras);
    }

    AdditionalQuickActionModules.push({
        id: scenario.id,
        category: 'action',
        name: scenario.name,
        description: scenario.description,
        icon: scenario.icon,
        accent: scenario.accent,
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: {
            endpoint: scenario.defaultEndpoint,
            apiKey: '',
            model: scenario.defaultModel || 'gpt-3.5-turbo',
            prompt: scenario.defaultPrompt,
            temperature: scenario.defaultTemperature ?? 0.7,
            maxTokens: scenario.defaultMaxTokens ?? 512,
            headers: scenario.extraDefaults?.headers || ''
        },
        form,
        tags: scenario.tags,
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const result = await performAiTextRequest(clone, config, {
                label: scenario.label,
                defaultPrompt: scenario.defaultPrompt,
                defaultEndpoint: scenario.defaultEndpoint,
                defaultModel: scenario.defaultModel,
                defaultTemperature: scenario.defaultTemperature,
                defaultMaxTokens: scenario.defaultMaxTokens,
                ...(scenario.overrides || {})
            });
            if (result) {
                clone.payload = result.text;
                clone.vars.lastAiResponse = result.raw;
                clone.logs.push(`${scenario.label} completed.`);
            }
            return [clone];
        }
    });
});

const ApiIntegrationScenarios = [
    {
        id: 'integration-notion-create-page',
        name: 'Integration: Notion create page',
        description: 'Create a Notion database page with optional summary content.',
        icon: 'book',
        accent: '#6366f1',
        defaultEndpoint: 'https://api.notion.com/v1/pages',
        defaultConfig: {
            endpoint: 'https://api.notion.com/v1/pages',
            apiKey: '',
            databaseId: '',
            title: 'New page',
            summary: '',
            headers: 'Notion-Version: 2022-06-28'
        },
        form: [
            { key: 'endpoint', label: 'API endpoint', type: 'url', placeholder: 'https://api.notion.com/v1/pages' },
            { key: 'apiKey', label: 'API key', type: 'password', placeholder: 'secret_' },
            { key: 'databaseId', label: 'Database ID', type: 'text', placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxx' },
            { key: 'title', label: 'Page title', type: 'text', placeholder: 'New page' },
            { key: 'summary', label: 'Summary', type: 'textarea', rows: 4, placeholder: 'Optional summary or use payload' },
            { key: 'headers', label: 'Extra headers', type: 'textarea', rows: 2, placeholder: 'Notion-Version: 2022-06-28' }
        ],
        defaultHeaders: { 'Notion-Version': '2022-06-28' },
        authHeader: 'Authorization',
        authPrefix: 'Bearer ',
        buildBody: (config, clone) => {
            const title = ensureString(config.title || clone.payload || 'Untitled page');
            const summary = ensureString(config.summary || clone.payload || '');
            const databaseId = ensureString(config.databaseId || '');
            const body = {
                properties: {
                    Title: {
                        title: [
                            {
                                text: { content: title }
                            }
                        ]
                    }
                }
            };
            if (databaseId) {
                body.parent = { database_id: databaseId };
            }
            if (summary) {
                body.children = [
                    {
                        object: 'block',
                        type: 'paragraph',
                        paragraph: {
                            rich_text: [
                                {
                                    type: 'text',
                                    text: { content: summary.slice(0, 2000) }
                                }
                            ]
                        }
                    }
                ];
            }
            return body;
        },
        label: 'Notion page creator',
        successLog: 'Notion create page request prepared.',
        storeRawKey: 'notionLastResponse',
        tags: ['integration', 'notion', 'api']
    },
    {
        id: 'integration-airtable-create-record',
        name: 'Integration: Airtable create record',
        description: 'Insert a record into an Airtable base with optional JSON fields.',
        icon: 'database',
        accent: '#0ea5e9',
        defaultEndpoint: 'https://api.airtable.com/v0/appId/Table%201',
        defaultConfig: {
            endpoint: 'https://api.airtable.com/v0/appId/Table%201',
            apiKey: '',
            recordName: 'New record',
            notes: '',
            extraFields: ''
        },
        form: [
            { key: 'endpoint', label: 'API endpoint', type: 'url', placeholder: 'https://api.airtable.com/v0/appId/Table%201' },
            { key: 'apiKey', label: 'API key', type: 'password', placeholder: 'pat...' },
            { key: 'recordName', label: 'Record name', type: 'text', placeholder: 'New record' },
            { key: 'notes', label: 'Notes', type: 'textarea', rows: 3, placeholder: 'Optional notes or use payload' },
            { key: 'extraFields', label: 'Extra fields (JSON)', type: 'textarea', rows: 3, placeholder: '{"Status":"Backlog"}' }
        ],
        authHeader: 'Authorization',
        authPrefix: 'Bearer ',
        buildBody: (config, clone) => {
            const fields = {
                Name: ensureString(config.recordName || clone.payload || 'New record')
            };
            const notes = ensureString(config.notes || '') || ensureString(clone.payload || '');
            if (notes) {
                fields.Notes = notes;
            }
            if (config.extraFields) {
                try {
                    Object.assign(fields, JSON.parse(config.extraFields));
                } catch (error) {
                    clone.logs.push(`Airtable extra fields parse failed: ${error.message}`);
                }
            }
            return { records: [{ fields }] };
        },
        label: 'Airtable record creator',
        successLog: 'Airtable record payload created.',
        storeRawKey: 'airtableLastResponse',
        tags: ['integration', 'airtable', 'api']
    },
    {
        id: 'integration-clickup-create-task',
        name: 'Integration: ClickUp create task',
        description: 'Create a ClickUp task for a chosen list.',
        icon: 'check-circle',
        accent: '#a3e635',
        defaultEndpoint: 'https://api.clickup.com/api/v2/list/123/task',
        defaultConfig: {
            endpoint: 'https://api.clickup.com/api/v2/list/123/task',
            apiKey: '',
            listId: '',
            title: 'Follow up',
            description: '',
            status: 'to do',
            dueDate: ''
        },
        form: [
            { key: 'endpoint', label: 'API endpoint', type: 'url', placeholder: 'https://api.clickup.com/api/v2/list/123/task' },
            { key: 'apiKey', label: 'API key', type: 'password', placeholder: 'pk_' },
            { key: 'listId', label: 'List ID override', type: 'text', placeholder: '123' },
            { key: 'title', label: 'Task title', type: 'text', placeholder: 'Follow up' },
            { key: 'description', label: 'Description', type: 'textarea', rows: 3, placeholder: 'Optional description' },
            { key: 'status', label: 'Status', type: 'text', placeholder: 'to do' },
            { key: 'dueDate', label: 'Due date (ISO)', type: 'text', placeholder: '2024-12-31T17:00:00Z' }
        ],
        authHeader: 'Authorization',
        authPrefix: 'Bearer ',
        buildEndpoint: (config) => {
            const base = ensureString(config.endpoint || '').trim();
            const listId = ensureString(config.listId || '').trim();
            if (listId && base.includes('/list/')) {
                return base.replace(/\/list\/[\w-]+/, `/list/${listId}`);
            }
            return base;
        },
        buildBody: (config, clone) => {
            const body = {
                name: ensureString(config.title || clone.payload || 'New task'),
                description: ensureString(config.description || clone.payload || ''),
                status: ensureString(config.status || '')
            };
            const dueDate = ensureString(config.dueDate || '');
            if (dueDate) {
                const timestamp = Date.parse(dueDate);
                if (!Number.isNaN(timestamp)) {
                    body.due_date = timestamp;
                }
            }
            return body;
        },
        label: 'ClickUp task creator',
        successLog: 'ClickUp task request assembled.',
        storeRawKey: 'clickupLastResponse',
        tags: ['integration', 'clickup', 'tasks']
    },
    {
        id: 'integration-asana-create-task',
        name: 'Integration: Asana create task',
        description: 'Add a task to an Asana project with optional due date.',
        icon: 'clipboard',
        accent: '#f59e0b',
        defaultEndpoint: 'https://app.asana.com/api/1.0/tasks',
        defaultConfig: {
            endpoint: 'https://app.asana.com/api/1.0/tasks',
            apiKey: '',
            projectId: '',
            name: 'New task',
            notes: '',
            dueOn: ''
        },
        form: [
            { key: 'endpoint', label: 'API endpoint', type: 'url', placeholder: 'https://app.asana.com/api/1.0/tasks' },
            { key: 'apiKey', label: 'Personal access token', type: 'password', placeholder: '1/123456' },
            { key: 'projectId', label: 'Project ID', type: 'text', placeholder: '1201234567890' },
            { key: 'name', label: 'Task name', type: 'text', placeholder: 'New task' },
            { key: 'notes', label: 'Notes', type: 'textarea', rows: 3, placeholder: 'Optional notes or use payload' },
            { key: 'dueOn', label: 'Due on (YYYY-MM-DD)', type: 'text', placeholder: '2024-12-31' }
        ],
        authHeader: 'Authorization',
        authPrefix: 'Bearer ',
        buildBody: (config, clone) => {
            const data = {
                name: ensureString(config.name || clone.payload || 'New task'),
                notes: ensureString(config.notes || clone.payload || '')
            };
            const projectId = ensureString(config.projectId || '');
            if (projectId) {
                data.projects = [projectId];
            }
            const dueOn = ensureString(config.dueOn || '');
            if (dueOn) {
                data.due_on = dueOn;
            }
            return { data };
        },
        label: 'Asana task creator',
        successLog: 'Asana task payload prepared.',
        storeRawKey: 'asanaLastResponse',
        tags: ['integration', 'asana', 'tasks']
    },
    {
        id: 'integration-trello-create-card',
        name: 'Integration: Trello create card',
        description: 'Create a Trello card using key and token query parameters.',
        icon: 'columns',
        accent: '#0ea5e9',
        defaultEndpoint: 'https://api.trello.com/1/cards',
        defaultConfig: {
            endpoint: 'https://api.trello.com/1/cards',
            apiKey: '',
            token: '',
            listId: '',
            name: 'New card',
            description: '',
            due: ''
        },
        form: [
            { key: 'endpoint', label: 'API endpoint', type: 'url', placeholder: 'https://api.trello.com/1/cards' },
            { key: 'apiKey', label: 'API key', type: 'text', placeholder: 'yourKey' },
            { key: 'token', label: 'API token', type: 'password', placeholder: 'yourToken' },
            { key: 'listId', label: 'List ID', type: 'text', placeholder: 'abcdef1234567890' },
            { key: 'name', label: 'Card title', type: 'text', placeholder: 'New card' },
            { key: 'description', label: 'Card description', type: 'textarea', rows: 3, placeholder: 'Optional description' },
            { key: 'due', label: 'Due date', type: 'text', placeholder: '2024-12-31T10:00:00Z' }
        ],
        queryAuthParam: 'key',
        skipAuthHeader: true,
        queryParamsBuilder: (config) => ({ token: ensureString(config.token || '') }),
        buildBody: (config, clone) => {
            return {
                name: ensureString(config.name || clone.payload || 'New card'),
                desc: ensureString(config.description || clone.payload || ''),
                idList: ensureString(config.listId || ''),
                due: ensureString(config.due || '') || undefined
            };
        },
        label: 'Trello card creator',
        successLog: 'Trello card request prepared.',
        storeRawKey: 'trelloLastResponse',
        tags: ['integration', 'trello', 'boards']
    },
    {
        id: 'integration-github-create-issue',
        name: 'Integration: GitHub create issue',
        description: 'Open a GitHub issue with optional labels.',
        icon: 'github',
        accent: '#111827',
        defaultEndpoint: 'https://api.github.com/repos/owner/repo/issues',
        defaultConfig: {
            endpoint: 'https://api.github.com/repos/owner/repo/issues',
            apiKey: '',
            title: 'Bug report',
            body: '',
            labels: 'bug'
        },
        form: [
            { key: 'endpoint', label: 'API endpoint', type: 'url', placeholder: 'https://api.github.com/repos/owner/repo/issues' },
            { key: 'apiKey', label: 'Personal access token', type: 'password', placeholder: 'ghp_' },
            { key: 'title', label: 'Issue title', type: 'text', placeholder: 'Bug report' },
            { key: 'body', label: 'Issue body', type: 'textarea', rows: 4, placeholder: 'Optional body or use payload' },
            { key: 'labels', label: 'Labels (comma separated)', type: 'text', placeholder: 'bug, needs-triage' }
        ],
        defaultHeaders: { Accept: 'application/vnd.github+json' },
        authHeader: 'Authorization',
        authPrefix: 'Bearer ',
        buildBody: (config, clone) => {
            const labels = ensureString(config.labels || '')
                .split(',')
                .map(label => label.trim())
                .filter(Boolean);
            return {
                title: ensureString(config.title || clone.payload || 'New issue'),
                body: ensureString(config.body || clone.payload || ''),
                labels
            };
        },
        label: 'GitHub issue creator',
        successLog: 'GitHub issue payload sent.',
        storeRawKey: 'githubLastResponse',
        tags: ['integration', 'github', 'issues']
    },
    {
        id: 'integration-gitlab-create-issue',
        name: 'Integration: GitLab create issue',
        description: 'Open an issue in a GitLab project with labels.',
        icon: 'gitlab',
        accent: '#f97316',
        defaultEndpoint: 'https://gitlab.com/api/v4/projects/123/issues',
        defaultConfig: {
            endpoint: 'https://gitlab.com/api/v4/projects/123/issues',
            apiKey: '',
            title: 'Bug report',
            description: '',
            labels: 'bug'
        },
        form: [
            { key: 'endpoint', label: 'API endpoint', type: 'url', placeholder: 'https://gitlab.com/api/v4/projects/123/issues' },
            { key: 'apiKey', label: 'Personal access token', type: 'password', placeholder: 'glpat-' },
            { key: 'title', label: 'Issue title', type: 'text', placeholder: 'Bug report' },
            { key: 'description', label: 'Issue description', type: 'textarea', rows: 4, placeholder: 'Optional description or use payload' },
            { key: 'labels', label: 'Labels (comma separated)', type: 'text', placeholder: 'bug, triage' }
        ],
        authHeader: 'PRIVATE-TOKEN',
        authPrefix: '',
        buildBody: (config, clone) => ({
            title: ensureString(config.title || clone.payload || 'New issue'),
            description: ensureString(config.description || clone.payload || ''),
            labels: ensureString(config.labels || '')
        }),
        label: 'GitLab issue creator',
        successLog: 'GitLab issue payload sent.',
        storeRawKey: 'gitlabLastResponse',
        tags: ['integration', 'gitlab', 'issues']
    },
    {
        id: 'integration-hubspot-create-contact',
        name: 'Integration: HubSpot create contact',
        description: 'Add or update a HubSpot contact record.',
        icon: 'user-plus',
        accent: '#f97316',
        defaultEndpoint: 'https://api.hubspot.com/crm/v3/objects/contacts',
        defaultConfig: {
            endpoint: 'https://api.hubspot.com/crm/v3/objects/contacts',
            apiKey: '',
            email: '',
            firstName: '',
            lastName: '',
            notes: ''
        },
        form: [
            { key: 'endpoint', label: 'API endpoint', type: 'url', placeholder: 'https://api.hubspot.com/crm/v3/objects/contacts' },
            { key: 'apiKey', label: 'Private app token', type: 'password', placeholder: 'pat-' },
            { key: 'email', label: 'Email', type: 'email', placeholder: 'user@example.com' },
            { key: 'firstName', label: 'First name', type: 'text', placeholder: 'Ada' },
            { key: 'lastName', label: 'Last name', type: 'text', placeholder: 'Lovelace' },
            { key: 'notes', label: 'Notes', type: 'textarea', rows: 3, placeholder: 'Optional notes or use payload' }
        ],
        authHeader: 'Authorization',
        authPrefix: 'Bearer ',
        buildBody: (config, clone) => ({
            properties: {
                email: ensureString(config.email || ''),
                firstname: ensureString(config.firstName || ''),
                lastname: ensureString(config.lastName || ''),
                notes: ensureString(config.notes || clone.payload || '')
            }
        }),
        label: 'HubSpot contact sync',
        successLog: 'HubSpot contact payload sent.',
        storeRawKey: 'hubspotLastResponse',
        tags: ['integration', 'hubspot', 'crm']
    },
    {
        id: 'integration-intercom-send-message',
        name: 'Integration: Intercom send message',
        description: 'Send an in-app Intercom message to a specific user.',
        icon: 'message-circle',
        accent: '#38bdf8',
        defaultEndpoint: 'https://api.intercom.io/messages',
        defaultConfig: {
            endpoint: 'https://api.intercom.io/messages',
            apiKey: '',
            userId: '',
            subject: 'Automated message',
            body: ''
        },
        form: [
            { key: 'endpoint', label: 'API endpoint', type: 'url', placeholder: 'https://api.intercom.io/messages' },
            { key: 'apiKey', label: 'Access token', type: 'password', placeholder: 'icpat_' },
            { key: 'userId', label: 'User ID', type: 'text', placeholder: '64f1d2...' },
            { key: 'subject', label: 'Subject', type: 'text', placeholder: 'Automated message' },
            { key: 'body', label: 'Message body', type: 'textarea', rows: 4, placeholder: 'Optional body or use payload' }
        ],
        defaultHeaders: { Accept: 'application/json' },
        authHeader: 'Authorization',
        authPrefix: 'Bearer ',
        buildBody: (config, clone) => ({
            message_type: 'inapp',
            subject: ensureString(config.subject || ''),
            body: ensureString(config.body || clone.payload || ''),
            from: {
                type: 'user',
                id: ensureString(config.userId || '')
            }
        }),
        label: 'Intercom messenger',
        successLog: 'Intercom message payload sent.',
        storeRawKey: 'intercomLastResponse',
        tags: ['integration', 'intercom', 'messaging']
    },
    {
        id: 'integration-telegram-send-message',
        name: 'Integration: Telegram send message',
        description: 'Send a Telegram bot message using the Bot API.',
        icon: 'send',
        accent: '#3b82f6',
        defaultEndpoint: 'https://api.telegram.org',
        defaultConfig: {
            endpoint: 'https://api.telegram.org',
            apiKey: '',
            chatId: '',
            text: '',
            parseMode: 'Markdown'
        },
        form: [
            { key: 'endpoint', label: 'Base endpoint', type: 'url', placeholder: 'https://api.telegram.org' },
            { key: 'apiKey', label: 'Bot token', type: 'password', placeholder: '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11' },
            { key: 'chatId', label: 'Chat ID', type: 'text', placeholder: '@channel_or_id' },
            { key: 'text', label: 'Message text', type: 'textarea', rows: 3, placeholder: 'Optional text or use payload' },
            { key: 'parseMode', label: 'Parse mode', type: 'text', placeholder: 'Markdown' }
        ],
        skipAuthHeader: true,
        buildEndpoint: (config) => {
            const base = ensureString(config.endpoint || 'https://api.telegram.org').replace(/\/$/, '');
            const token = ensureString(config.apiKey || '');
            if (!token) return `${base}/bot/sendMessage`;
            return `${base}/bot${token}/sendMessage`;
        },
        buildBody: (config, clone) => ({
            chat_id: ensureString(config.chatId || ''),
            text: ensureString(config.text || clone.payload || ''),
            parse_mode: ensureString(config.parseMode || '') || undefined
        }),
        label: 'Telegram bot sender',
        successLog: 'Telegram bot message sent.',
        storeRawKey: 'telegramLastResponse',
        tags: ['integration', 'telegram', 'messaging']
    },
    {
        id: 'integration-supabase-insert-row',
        name: 'Integration: Supabase insert row',
        description: 'Insert a row into a Supabase table using the REST interface.',
        icon: 'table',
        accent: '#10b981',
        defaultEndpoint: 'https://project.supabase.co/rest/v1/table_name',
        defaultConfig: {
            endpoint: 'https://project.supabase.co/rest/v1/table_name',
            apiKey: '',
            schema: '',
            payloadJson: ''
        },
        form: [
            { key: 'endpoint', label: 'API endpoint', type: 'url', placeholder: 'https://project.supabase.co/rest/v1/table_name' },
            { key: 'apiKey', label: 'Service role key', type: 'password', placeholder: 'supabase-service-role-key' },
            { key: 'schema', label: 'Schema', type: 'text', placeholder: 'public' },
            { key: 'payloadJson', label: 'Payload (JSON)', type: 'textarea', rows: 4, placeholder: '{"title":"Example"}' }
        ],
        authHeader: 'apikey',
        authPrefix: '',
        defaultHeaders: { Prefer: 'return=representation' },
        buildBody: (config, clone) => {
            const text = ensureString(config.payloadJson || '') || ensureString(clone.payload || '');
            if (text) {
                try {
                    return JSON.parse(text);
                } catch (error) {
                    clone.logs.push(`Supabase payload parse failed: ${error.message}`);
                }
            }
            return { payload: ensureString(clone.payload || '') };
        },
        successLog: 'Supabase row insertion attempted.',
        label: 'Supabase row insert',
        storeRawKey: 'supabaseLastResponse',
        tags: ['integration', 'supabase', 'database']
    },
    {
        id: 'integration-n8n-start-workflow',
        name: 'Integration: n8n start workflow',
        description: 'Trigger an n8n webhook with optional JSON payload.',
        icon: 'activity',
        accent: '#f87171',
        defaultEndpoint: 'https://n8n.example.com/webhook/trigger-id',
        defaultConfig: {
            endpoint: 'https://n8n.example.com/webhook/trigger-id',
            apiKey: '',
            method: 'POST',
            payloadJson: ''
        },
        form: [
            { key: 'endpoint', label: 'Webhook URL', type: 'url', placeholder: 'https://n8n.example.com/webhook/trigger-id' },
            { key: 'method', label: 'HTTP method', type: 'text', placeholder: 'POST' },
            { key: 'payloadJson', label: 'Payload (JSON)', type: 'textarea', rows: 4, placeholder: '{"event":"start"}' },
            { key: 'apiKey', label: 'Auth token (optional)', type: 'password', placeholder: 'Optional bearer token' }
        ],
        authHeader: 'Authorization',
        authPrefix: 'Bearer ',
        buildBody: (config, clone) => {
            const text = ensureString(config.payloadJson || '') || ensureString(clone.payload || '');
            if (text) {
                try {
                    return JSON.parse(text);
                } catch (error) {
                    clone.logs.push(`n8n payload parse failed: ${error.message}`);
                }
            }
            return { payload: ensureString(clone.payload || '') };
        },
        label: 'n8n workflow trigger',
        successLog: 'n8n webhook triggered.',
        storeRawKey: 'n8nLastResponse',
        tags: ['integration', 'n8n', 'automation']
    },
    {
        id: 'integration-monday-create-item',
        name: 'Integration: monday.com create item',
        description: 'Run a GraphQL mutation to create an item in monday.com.',
        icon: 'grid',
        accent: '#ec4899',
        defaultEndpoint: 'https://api.monday.com/v2',
        defaultConfig: {
            endpoint: 'https://api.monday.com/v2',
            apiKey: '',
            boardId: '',
            groupId: '',
            itemName: 'New item',
            columnValues: '{"status":{"label":"Working on it"}}'
        },
        form: [
            { key: 'endpoint', label: 'API endpoint', type: 'url', placeholder: 'https://api.monday.com/v2' },
            { key: 'apiKey', label: 'API token', type: 'password', placeholder: 'your-token' },
            { key: 'boardId', label: 'Board ID', type: 'text', placeholder: '123456789' },
            { key: 'groupId', label: 'Group ID', type: 'text', placeholder: 'topics' },
            { key: 'itemName', label: 'Item name', type: 'text', placeholder: 'New item' },
            { key: 'columnValues', label: 'Column values (JSON)', type: 'textarea', rows: 3, placeholder: '{"status":{"label":"Done"}}' }
        ],
        authHeader: 'Authorization',
        authPrefix: 'Bearer ',
        buildBody: (config, clone) => {
            let columnValues = {};
            if (config.columnValues) {
                try {
                    columnValues = JSON.parse(config.columnValues);
                } catch (error) {
                    clone.logs.push(`monday.com column values parse failed: ${error.message}`);
                }
            }
            const query = `mutation ($board: ID!, $group: String, $item: String!, $columns: JSON!) {\n  create_item (board_id: $board, group_id: $group, item_name: $item, column_values: $columns) { id }\n}`;
            return {
                query,
                variables: {
                    board: ensureString(config.boardId || ''),
                    group: ensureString(config.groupId || '') || null,
                    item: ensureString(config.itemName || clone.payload || 'New item'),
                    columns: columnValues
                }
            };
        },
        label: 'monday.com item creator',
        successLog: 'monday.com GraphQL mutation sent.',
        storeRawKey: 'mondayLastResponse',
        tags: ['integration', 'monday', 'graphql']
    },
    {
        id: 'integration-linear-create-issue',
        name: 'Integration: Linear create issue',
        description: 'Create an issue in Linear using the GraphQL API.',
        icon: 'layers',
        accent: '#8b5cf6',
        defaultEndpoint: 'https://api.linear.app/graphql',
        defaultConfig: {
            endpoint: 'https://api.linear.app/graphql',
            apiKey: '',
            teamId: '',
            title: 'New issue',
            description: '',
            priority: 0
        },
        form: [
            { key: 'endpoint', label: 'API endpoint', type: 'url', placeholder: 'https://api.linear.app/graphql' },
            { key: 'apiKey', label: 'API key', type: 'password', placeholder: 'lin_' },
            { key: 'teamId', label: 'Team ID', type: 'text', placeholder: 'team_123' },
            { key: 'title', label: 'Issue title', type: 'text', placeholder: 'New issue' },
            { key: 'description', label: 'Issue description', type: 'textarea', rows: 4, placeholder: 'Optional description or use payload' },
            { key: 'priority', label: 'Priority (0-3)', type: 'number', placeholder: '1' }
        ],
        authHeader: 'Authorization',
        authPrefix: 'Bearer ',
        buildBody: (config, clone) => {
            const query = `mutation ($input: IssueCreateInput!) {\n  issueCreate(input: $input) {\n    success\n    issue { id identifier url }\n  }\n}`;
            return {
                query,
                variables: {
                    input: {
                        teamId: ensureString(config.teamId || ''),
                        title: ensureString(config.title || clone.payload || 'New issue'),
                        description: ensureString(config.description || clone.payload || ''),
                        priority: Number(config.priority ?? 0)
                    }
                }
            };
        },
        label: 'Linear issue creator',
        successLog: 'Linear issue mutation submitted.',
        storeRawKey: 'linearLastResponse',
        tags: ['integration', 'linear', 'graphql']
    }
];

ApiIntegrationScenarios.forEach(scenario => {
    AdditionalQuickActionModules.push({
        id: scenario.id,
        category: 'action',
        name: scenario.name,
        description: scenario.description,
        icon: scenario.icon,
        accent: scenario.accent,
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: {
            ...(scenario.defaultConfig || {}),
            endpoint: scenario.defaultConfig?.endpoint || scenario.defaultEndpoint || '',
            apiKey: '',
            headers: scenario.defaultConfig?.headers || ''
        },
        form: scenario.form,
        tags: scenario.tags,
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const result = await performHttpAction(clone, config, scenario);
            if (result) {
                const payloadValue = result.payload ?? result.data;
                if (payloadValue !== undefined) {
                    clone.payload = typeof payloadValue === 'string'
                        ? payloadValue
                        : JSON.stringify(payloadValue, null, 2);
                }
                clone.vars.lastApiResponse = result.data;
            }
            return [clone];
        }
    });
});

const PayloadAugmentationScenarios = [
    {
        id: 'payload-trim-whitespace',
        name: 'Payload: Trim whitespace',
        description: 'Remove leading and trailing whitespace characters from the payload.',
        icon: 'crop',
        accent: '#f59e0b',
        tags: ['payload', 'cleanup'],
        transform: (value) => ensureString(value).trim()
    },
    {
        id: 'payload-normalize-whitespace',
        name: 'Payload: Normalize whitespace',
        description: 'Collapse repeated whitespace into single spaces and trim the result.',
        icon: 'align-justify',
        accent: '#6366f1',
        tags: ['payload', 'cleanup'],
        transform: (value) => ensureString(value).replace(/\s+/g, ' ').trim()
    },
    {
        id: 'payload-extract-numbers',
        name: 'Payload: Extract numbers',
        description: 'Extract all numeric sequences from the payload and join them with commas.',
        icon: 'hash',
        accent: '#22d3ee',
        tags: ['payload', 'analysis'],
        transform: (value) => ensureString(value).match(/[-+]?\d+(?:\.\d+)?/g)?.join(', ') || ''
    },
    {
        id: 'payload-extract-emails',
        name: 'Payload: Extract emails',
        description: 'Find email addresses in the payload and output one per line.',
        icon: 'at-sign',
        accent: '#f97316',
        tags: ['payload', 'analysis'],
        transform: (value) => (ensureString(value).match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi) || []).join('\n')
    },
    {
        id: 'payload-extract-urls',
        name: 'Payload: Extract URLs',
        description: 'Collect URLs found in the payload using a permissive pattern.',
        icon: 'link',
        accent: '#10b981',
        tags: ['payload', 'analysis'],
        transform: (value) => {
            const matches = ensureString(value).match(/https?:\/\/[^\s)]+/gi) || [];
            return matches.join('\n');
        }
    },
    {
        id: 'payload-extract-hashtags',
        name: 'Payload: Extract hashtags',
        description: 'List all hashtags contained in the payload.',
        icon: 'tag',
        accent: '#a855f7',
        tags: ['payload', 'social'],
        transform: (value) => (ensureString(value).match(/#[\p{L}\p{N}_-]+/gu) || []).join(' ')
    },
    {
        id: 'payload-to-yaml',
        name: 'Payload: To YAML',
        description: 'Convert JSON content to a basic YAML representation.',
        icon: 'file-text',
        accent: '#facc15',
        tags: ['payload', 'formatting'],
        transform: (value, config, clone) => {
            const text = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
            try {
                const data = typeof value === 'object' && value !== null ? value : JSON.parse(text);
                const lines = [];
                const indent = (level) => '  '.repeat(level);
                const dump = (node, level = 0, parentKey = null) => {
                    if (Array.isArray(node)) {
                        if (node.length === 0) {
                            lines.push(`${indent(level)}${parentKey ?? '-'}: []`);
                            return;
                        }
                        node.forEach(item => {
                            if (typeof item === 'object' && item !== null) {
                                lines.push(`${indent(level)}-`);
                                dump(item, level + 1);
                            } else {
                                lines.push(`${indent(level)}- ${item}`);
                            }
                        });
                    } else if (node && typeof node === 'object') {
                        Object.entries(node).forEach(([key, val]) => {
                            if (typeof val === 'object' && val !== null) {
                                lines.push(`${indent(level)}${key}:`);
                                dump(val, level + 1);
                            } else {
                                lines.push(`${indent(level)}${key}: ${val}`);
                            }
                        });
                    } else if (parentKey) {
                        lines.push(`${indent(level)}${parentKey}: ${node}`);
                    }
                };
                dump(data, 0);
                return lines.join('\n');
            } catch (error) {
                clone.logs.push(`YAML conversion fallback used: ${error.message}`);
                return text;
            }
        }
    },
    {
        id: 'payload-to-csv',
        name: 'Payload: To CSV',
        description: 'Convert a JSON array or newline list into CSV output.',
        icon: 'file',
        accent: '#60a5fa',
        tags: ['payload', 'formatting'],
        transform: (value, config, clone) => {
            let rows = [];
            if (Array.isArray(value)) {
                rows = value;
            } else {
                const text = ensureString(value || '');
                if (!text) return '';
                try {
                    const parsed = JSON.parse(text);
                    if (Array.isArray(parsed)) rows = parsed;
                } catch (error) {
                    rows = text.split(/\r?\n/).map(line => ({ value: line.trim() })).filter(item => item.value);
                }
            }
            if (!Array.isArray(rows) || rows.length === 0) return '';
            if (typeof rows[0] !== 'object') {
                return rows.map(item => `"${ensureString(item).replace(/"/g, '""')}"`).join('\n');
            }
            const headers = Array.from(new Set(rows.flatMap(row => Object.keys(row))));
            const csvRows = [headers.join(',')];
            rows.forEach(row => {
                const line = headers.map(key => {
                    const cell = row[key];
                    if (cell === null || cell === undefined) return '';
                    const cellText = ensureString(cell).replace(/"/g, '""');
                    return cellText.includes(',') || /\s/.test(cellText) ? `"${cellText}"` : cellText;
                }).join(',');
                csvRows.push(line);
            });
            return csvRows.join('\n');
        }
    },
    {
        id: 'payload-to-markdown-list',
        name: 'Payload: To markdown list',
        description: 'Render array or newline-separated text as a markdown bullet list.',
        icon: 'list',
        accent: '#34d399',
        tags: ['payload', 'formatting'],
        transform: (value) => {
            const items = Array.isArray(value)
                ? value.map(item => ensureString(item))
                : ensureString(value || '').split(/\r?\n/).map(line => line.trim()).filter(Boolean);
            return items.map(item => `- ${item}`).join('\n');
        }
    },
    {
        id: 'payload-to-table',
        name: 'Payload: To markdown table',
        description: 'Convert an array of objects into a markdown table for quick reviews.',
        icon: 'grid',
        accent: '#a855f7',
        tags: ['payload', 'formatting'],
        transform: (value, config, clone) => {
            let rows = [];
            if (Array.isArray(value)) {
                rows = value;
            } else {
                try {
                    rows = JSON.parse(ensureString(value || ''));
                } catch (error) {
                    clone.logs.push(`Table conversion skipped: ${error.message}`);
                    return ensureString(value || '');
                }
            }
            if (!Array.isArray(rows) || rows.length === 0 || typeof rows[0] !== 'object') {
                return Array.isArray(rows) ? rows.join('\n') : ensureString(value || '');
            }
            const headers = Array.from(new Set(rows.flatMap(row => Object.keys(row))));
            const headerLine = `| ${headers.join(' | ')} |`;
            const separator = `| ${headers.map(() => '---').join(' | ')} |`;
            const body = rows.map(row => `| ${headers.map(key => ensureString(row[key] ?? '')).join(' | ')} |`).join('\n');
            return [headerLine, separator, body].join('\n');
        }
    },
    {
        id: 'payload-add-timestamp',
        name: 'Payload: Add timestamp',
        description: 'Append or prepend an ISO timestamp to the payload.',
        icon: 'clock',
        accent: '#fb7185',
        defaultConfig: { position: 'prefix', label: 'Timestamp' },
        form: [
            { key: 'position', label: 'Position', type: 'select', options: [
                { value: 'prefix', label: 'Prefix' },
                { value: 'suffix', label: 'Suffix' }
            ] },
            { key: 'label', label: 'Label', type: 'text', placeholder: 'Timestamp' }
        ],
        tags: ['payload', 'metadata'],
        transform: (value, config) => {
            const stamp = `${ensureString(config.label || 'Timestamp')}: ${new Date().toISOString()}`;
            const text = ensureString(value || '');
            return config.position === 'suffix'
                ? `${text}${text ? '\n' : ''}${stamp}`
                : `${stamp}${text ? '\n' : ''}${text}`;
        }
    },
    {
        id: 'payload-ensure-prefix',
        name: 'Payload: Ensure prefix',
        description: 'Guarantee the payload begins with the specified prefix.',
        icon: 'corner-left-up',
        accent: '#22c55e',
        defaultConfig: { prefix: 'https://' },
        form: [{ key: 'prefix', label: 'Prefix', type: 'text', placeholder: 'https://' }],
        tags: ['payload', 'formatting'],
        transform: (value, config) => {
            const prefix = ensureString(config.prefix || '');
            const text = ensureString(value || '');
            if (!prefix) return text;
            return text.startsWith(prefix) ? text : prefix + text;
        }
    },
    {
        id: 'payload-ensure-suffix',
        name: 'Payload: Ensure suffix',
        description: 'Ensure the payload ends with a configured suffix.',
        icon: 'corner-right-down',
        accent: '#818cf8',
        defaultConfig: { suffix: '/' },
        form: [{ key: 'suffix', label: 'Suffix', type: 'text', placeholder: '/' }],
        tags: ['payload', 'formatting'],
        transform: (value, config) => {
            const suffix = ensureString(config.suffix || '');
            const text = ensureString(value || '');
            if (!suffix) return text;
            return text.endsWith(suffix) ? text : `${text}${suffix}`;
        }
    },
    {
        id: 'payload-random-sample',
        name: 'Payload: Random sample',
        description: 'Return a random subset of lines from the payload.',
        icon: 'shuffle',
        accent: '#f472b6',
        defaultConfig: { size: 3 },
        form: [{ key: 'size', label: 'Sample size', type: 'number', placeholder: '3' }],
        tags: ['payload', 'random'],
        transform: (value, config) => {
            const lines = ensureString(value || '').split(/\r?\n/).map(line => line.trim()).filter(Boolean);
            const count = Math.max(1, Number(config.size || 1));
            const sample = [];
            const copy = [...lines];
            while (copy.length && sample.length < count) {
                const index = Math.floor(Math.random() * copy.length);
                sample.push(copy.splice(index, 1)[0]);
            }
            return sample.join('\n');
        }
    },
    {
        id: 'payload-first-line',
        name: 'Payload: First line',
        description: 'Extract only the first line from the payload.',
        icon: 'arrow-up',
        accent: '#22d3ee',
        tags: ['payload', 'filter'],
        transform: (value) => ensureString(value || '').split(/\r?\n/)[0] || ''
    },
    {
        id: 'payload-last-line',
        name: 'Payload: Last line',
        description: 'Extract only the last non-empty line from the payload.',
        icon: 'arrow-down',
        accent: '#0ea5e9',
        tags: ['payload', 'filter'],
        transform: (value) => {
            const lines = ensureString(value || '').split(/\r?\n/).map(line => line.trim()).filter(Boolean);
            return lines.length ? lines[lines.length - 1] : '';
        }
    },
    {
        id: 'payload-filter-lines',
        name: 'Payload: Filter lines',
        description: 'Keep only lines that contain a chosen keyword.',
        icon: 'filter',
        accent: '#ec4899',
        defaultConfig: { keyword: '' },
        form: [{ key: 'keyword', label: 'Keyword', type: 'text', placeholder: 'error' }],
        tags: ['payload', 'filter'],
        transform: (value, config) => {
            const keyword = ensureString(config.keyword || '').toLowerCase();
            if (!keyword) return ensureString(value || '');
            return ensureString(value || '')
                .split(/\r?\n/)
                .filter(line => line.toLowerCase().includes(keyword))
                .join('\n');
        }
    },
    {
        id: 'payload-remove-empty-lines',
        name: 'Payload: Remove empty lines',
        description: 'Strip blank lines and collapse multiple blank lines into one.',
        icon: 'minus',
        accent: '#fbbf24',
        tags: ['payload', 'cleanup'],
        transform: (value) => ensureString(value || '')
            .split(/\r?\n/)
            .map(line => line.trim())
            .filter(Boolean)
            .join('\n')
    },
    {
        id: 'payload-truncate-words',
        name: 'Payload: Truncate words',
        description: 'Keep only the first N words of the payload.',
        icon: 'type',
        accent: '#2dd4bf',
        defaultConfig: { words: 50, suffix: '…' },
        form: [
            { key: 'words', label: 'Max words', type: 'number', placeholder: '50' },
            { key: 'suffix', label: 'Suffix', type: 'text', placeholder: '…' }
        ],
        tags: ['payload', 'truncate'],
        transform: (value, config) => {
            const words = ensureString(value || '').split(/\s+/).filter(Boolean);
            const limit = Math.max(1, Number(config.words || 1));
            const suffix = ensureString(config.suffix || '…');
            return words.length > limit
                ? `${words.slice(0, limit).join(' ')}${suffix}`
                : words.join(' ');
        }
    },
    {
        id: 'payload-to-object-field',
        name: 'Payload: Wrap in JSON field',
        description: 'Wrap the payload inside a JSON object under a named field.',
        icon: 'code',
        accent: '#ef4444',
        defaultConfig: { field: 'value' },
        form: [{ key: 'field', label: 'Field name', type: 'text', placeholder: 'value' }],
        tags: ['payload', 'formatting'],
        transform: (value, config) => {
            const field = ensureString(config.field || 'value');
            return JSON.stringify({ [field]: value }, null, 2);
        }
    }
];

PayloadAugmentationScenarios.forEach(scenario => {
    AdditionalQuickActionModules.push({
        id: scenario.id,
        category: 'utility',
        name: scenario.name,
        description: scenario.description,
        icon: scenario.icon,
        accent: scenario.accent,
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: scenario.defaultConfig || {},
        form: scenario.form,
        tags: scenario.tags,
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            clone.payload = scenario.transform(clone.payload, config || {}, clone);
            clone.logs.push(`${scenario.name} applied.`);
            return [clone];
        }
    });
});

const ContextUtilityModules = [
    {
        id: 'context-store-payload',
        name: 'Context: Store payload',
        description: 'Save the current payload into a named workflow variable.',
        icon: 'save',
        accent: '#38bdf8',
        defaultConfig: { variable: 'result' },
        form: [{ key: 'variable', label: 'Variable name', type: 'text', placeholder: 'result' }],
        tags: ['context', 'state'],
        apply: (clone, config) => {
            const variable = ensureString(config.variable || '');
            if (!variable) {
                clone.logs.push('Store payload skipped: variable missing.');
                return;
            }
            clone.vars[variable] = clone.payload;
            clone.logs.push(`Stored payload in ${variable}.`);
        }
    },
    {
        id: 'context-load-variable',
        name: 'Context: Load variable',
        description: 'Load a stored variable back into the payload with optional fallback.',
        icon: 'upload',
        accent: '#a855f7',
        defaultConfig: { variable: 'result', fallback: '' },
        form: [
            { key: 'variable', label: 'Variable name', type: 'text', placeholder: 'result' },
            { key: 'fallback', label: 'Fallback value', type: 'text', placeholder: 'No data' }
        ],
        tags: ['context', 'state'],
        apply: (clone, config) => {
            const variable = ensureString(config.variable || '');
            if (!variable) {
                clone.logs.push('Load variable skipped: name missing.');
                return;
            }
            if (Object.prototype.hasOwnProperty.call(clone.vars, variable)) {
                clone.payload = clone.vars[variable];
            } else {
                clone.payload = config.fallback ?? clone.payload;
            }
            clone.logs.push(`Loaded variable ${variable}.`);
        }
    },
    {
        id: 'context-append-variable',
        name: 'Context: Append to variable',
        description: 'Append the payload to a stored string variable with a delimiter.',
        icon: 'plus-square',
        accent: '#f97316',
        defaultConfig: { variable: 'log', delimiter: '\n' },
        form: [
            { key: 'variable', label: 'Variable name', type: 'text', placeholder: 'log' },
            { key: 'delimiter', label: 'Delimiter', type: 'text', placeholder: '\n' }
        ],
        tags: ['context', 'state'],
        apply: (clone, config) => {
            const variable = ensureString(config.variable || '');
            if (!variable) {
                clone.logs.push('Append variable skipped: name missing.');
                return;
            }
            const delimiter = ensureString(config.delimiter || '\n');
            const current = ensureString(clone.vars[variable] || '');
            const payloadText = ensureString(clone.payload || '');
            clone.vars[variable] = current ? `${current}${delimiter}${payloadText}` : payloadText;
            clone.logs.push(`Appended payload to ${variable}.`);
        }
    },
    {
        id: 'context-increment-counter',
        name: 'Context: Increment counter',
        description: 'Increase a numeric context variable by a configurable step.',
        icon: 'plus',
        accent: '#22d3ee',
        defaultConfig: { variable: 'count', step: 1 },
        form: [
            { key: 'variable', label: 'Variable name', type: 'text', placeholder: 'count' },
            { key: 'step', label: 'Step', type: 'number', placeholder: '1' }
        ],
        tags: ['context', 'state'],
        apply: (clone, config) => {
            const variable = ensureString(config.variable || '');
            if (!variable) {
                clone.logs.push('Increment counter skipped: name missing.');
                return;
            }
            const step = Number(config.step || 1);
            const current = Number(clone.vars[variable] || 0);
            clone.vars[variable] = current + step;
            clone.logs.push(`Counter ${variable} incremented to ${clone.vars[variable]}.`);
        }
    },
    {
        id: 'context-push-log',
        name: 'Context: Push log entry',
        description: 'Add a custom log entry that can reference the payload.',
        icon: 'clipboard',
        accent: '#fbbf24',
        defaultConfig: { message: 'Processed payload at {{timestamp}}' },
        form: [{ key: 'message', label: 'Message template', type: 'textarea', rows: 3, placeholder: 'Message with {{payload}}' }],
        tags: ['context', 'logging'],
        apply: (clone, config) => {
            const template = ensureString(config.message || '');
            const timestamp = new Date().toISOString();
            const payloadText = ensureString(clone.payload || '');
            const entry = template
                .replace(/\{\{payload\}\}/g, payloadText)
                .replace(/\{\{timestamp\}\}/g, timestamp);
            clone.logs.push(entry);
        }
    },
    {
        id: 'context-push-to-collection',
        name: 'Context: Push to collection',
        description: 'Push the payload into an array variable while limiting its size.',
        icon: 'package',
        accent: '#14b8a6',
        defaultConfig: { variable: 'items', maxItems: 10 },
        form: [
            { key: 'variable', label: 'Variable name', type: 'text', placeholder: 'items' },
            { key: 'maxItems', label: 'Max items', type: 'number', placeholder: '10' }
        ],
        tags: ['context', 'state'],
        apply: (clone, config) => {
            const variable = ensureString(config.variable || '');
            if (!variable) {
                clone.logs.push('Collection push skipped: name missing.');
                return;
            }
            const limit = Math.max(1, Number(config.maxItems || 10));
            const list = Array.isArray(clone.vars[variable]) ? clone.vars[variable] : [];
            list.push(clone.payload);
            while (list.length > limit) {
                list.shift();
            }
            clone.vars[variable] = list;
            clone.logs.push(`Pushed payload into ${variable} (${list.length}/${limit}).`);
        }
    },
    {
        id: 'context-clear-variable',
        name: 'Context: Clear variable',
        description: 'Remove a variable from the workflow context.',
        icon: 'trash-2',
        accent: '#ef4444',
        defaultConfig: { variable: 'result' },
        form: [{ key: 'variable', label: 'Variable name', type: 'text', placeholder: 'result' }],
        tags: ['context', 'state'],
        apply: (clone, config) => {
            const variable = ensureString(config.variable || '');
            if (!variable) {
                clone.logs.push('Clear variable skipped: name missing.');
                return;
            }
            delete clone.vars[variable];
            clone.logs.push(`Cleared variable ${variable}.`);
        }
    },
    {
        id: 'context-store-timestamp',
        name: 'Context: Store timestamp',
        description: 'Store the current timestamp in a variable for later reference.',
        icon: 'calendar',
        accent: '#4ade80',
        defaultConfig: { variable: 'lastRun' },
        form: [{ key: 'variable', label: 'Variable name', type: 'text', placeholder: 'lastRun' }],
        tags: ['context', 'state'],
        apply: (clone, config) => {
            const variable = ensureString(config.variable || '');
            if (!variable) {
                clone.logs.push('Store timestamp skipped: name missing.');
                return;
            }
            clone.vars[variable] = new Date().toISOString();
            clone.logs.push(`Stored timestamp in ${variable}.`);
        }
    },
    {
        id: 'context-tag-payload',
        name: 'Context: Tag payload',
        description: 'Add a tag to the shared context to mark the payload status.',
        icon: 'bookmark',
        accent: '#fbbf24',
        defaultConfig: { tag: 'processed' },
        form: [{ key: 'tag', label: 'Tag', type: 'text', placeholder: 'processed' }],
        tags: ['context', 'metadata'],
        apply: (clone, config) => {
            const tag = ensureString(config.tag || '');
            if (!tag) {
                clone.logs.push('Tag payload skipped: tag missing.');
                return;
            }
            if (!Array.isArray(clone.vars.tags)) {
                clone.vars.tags = [];
            }
            if (!clone.vars.tags.includes(tag)) {
                clone.vars.tags.push(tag);
            }
            clone.logs.push(`Tag "${tag}" added to payload context.`);
        }
    },
    {
        id: 'context-merge-json',
        name: 'Context: Merge JSON payload',
        description: 'Merge JSON payload fields into a named context object.',
        icon: 'code',
        accent: '#6366f1',
        defaultConfig: { variable: 'data', prefix: '' },
        form: [
            { key: 'variable', label: 'Variable name', type: 'text', placeholder: 'data' },
            { key: 'prefix', label: 'Key prefix', type: 'text', placeholder: '' }
        ],
        tags: ['context', 'state'],
        apply: (clone, config) => {
            const variable = ensureString(config.variable || '');
            if (!variable) {
                clone.logs.push('Merge JSON skipped: variable missing.');
                return;
            }
            const text = typeof clone.payload === 'string' ? clone.payload : JSON.stringify(clone.payload);
            try {
                const parsed = JSON.parse(text || '{}');
                if (!clone.vars[variable] || typeof clone.vars[variable] !== 'object') {
                    clone.vars[variable] = {};
                }
                const target = clone.vars[variable];
                const prefix = ensureString(config.prefix || '');
                Object.entries(parsed).forEach(([key, val]) => {
                    const finalKey = prefix ? `${prefix}${key}` : key;
                    target[finalKey] = val;
                });
                clone.logs.push(`Merged JSON payload into ${variable}.`);
            } catch (error) {
                clone.logs.push(`Merge JSON failed: ${error.message}`);
            }
        }
    }
];

ContextUtilityModules.forEach(module => {
    AdditionalQuickActionModules.push({
        id: module.id,
        category: 'utility',
        name: module.name,
        description: module.description,
        icon: module.icon,
        accent: module.accent,
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: module.defaultConfig || {},
        form: module.form,
        tags: module.tags,
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            module.apply(clone, config || {});
            return [clone];
        }
    });
});

const AdvancedAiWorkflowScenarios = [
    {
        id: 'ai-brief-to-email',
        name: 'AI: Draft customer email',
        description: 'Turn meeting notes into a polished follow-up email.',
        icon: 'mail',
        accent: '#6366f1',
        defaultPrompt: 'Using the notes below, craft a polite follow-up email with clear next steps: {{payload}}',
        label: 'AI customer email',
        tags: ['ai', 'communication', 'email'],
        temperature: 0.6,
        maxTokens: 400,
        overrides: {
            useMessages: true,
            systemPrompt: 'You are a friendly customer success specialist providing concise, actionable communication.'
        },
        successLog: 'Drafted customer email via AI.'
    },
    {
        id: 'ai-brief-to-agenda',
        name: 'AI: Build meeting agenda',
        description: 'Convert raw notes into a structured meeting agenda with timings.',
        icon: 'calendar',
        accent: '#22d3ee',
        defaultPrompt: 'Turn the following talking points into a time-boxed meeting agenda: {{payload}}',
        label: 'AI meeting agenda',
        tags: ['ai', 'operations', 'meetings'],
        temperature: 0.5,
        maxTokens: 380,
        successLog: 'Prepared agenda outline via AI.'
    },
    {
        id: 'ai-strategy-outline',
        name: 'AI: Strategy outline',
        description: 'Ask AI to produce a strategic outline from brainstorming notes.',
        icon: 'target',
        accent: '#f97316',
        defaultPrompt: 'Summarize the following notes into a strategic outline with objectives, tactics, and KPIs: {{payload}}',
        label: 'AI strategy outline',
        tags: ['ai', 'planning', 'strategy'],
        temperature: 0.55,
        maxTokens: 420,
        successLog: 'Generated strategy outline.'
    },
    {
        id: 'ai-product-requirements',
        name: 'AI: Product requirements draft',
        description: 'Convert feature ideas into a structured PRD summary.',
        icon: 'file-text',
        accent: '#34d399',
        defaultPrompt: 'Transform the following product notes into a structured PRD with problem, solution, user stories, and acceptance criteria: {{payload}}',
        label: 'AI product requirements',
        tags: ['ai', 'product', 'documentation'],
        temperature: 0.45,
        maxTokens: 500,
        successLog: 'Created product requirements summary.'
    },
    {
        id: 'ai-release-notes-writer',
        name: 'AI: Release notes',
        description: 'Produce release notes from change logs or commits.',
        icon: 'clipboard',
        accent: '#facc15',
        defaultPrompt: 'Draft release notes for end users based on the following updates. Highlight improvements and fixes: {{payload}}',
        label: 'AI release notes',
        tags: ['ai', 'product', 'documentation'],
        temperature: 0.4,
        maxTokens: 360,
        successLog: 'Drafted release notes.'
    },
    {
        id: 'ai-support-reply',
        name: 'AI: Support reply',
        description: 'Transform troubleshooting notes into a friendly support response.',
        icon: 'message-circle',
        accent: '#ef4444',
        defaultPrompt: 'Write a friendly support reply that acknowledges the issue, explains the solution, and offers next steps: {{payload}}',
        label: 'AI support reply',
        tags: ['ai', 'support', 'communication'],
        temperature: 0.5,
        maxTokens: 320,
        overrides: {
            useMessages: true,
            systemPrompt: 'You are a thoughtful technical support engineer with an empathetic tone.'
        },
        successLog: 'Generated support response.'
    },
    {
        id: 'ai-social-campaign-plan',
        name: 'AI: Social campaign plan',
        description: 'Generate multi-platform social campaign ideas with hooks and CTAs.',
        icon: 'share-2',
        accent: '#ec4899',
        defaultPrompt: 'Create a social media campaign plan with platform-specific hooks, copy, and CTAs based on: {{payload}}',
        label: 'AI social campaign',
        tags: ['ai', 'marketing', 'social'],
        temperature: 0.7,
        maxTokens: 460,
        successLog: 'Produced social campaign plan.'
    },
    {
        id: 'ai-keyword-research',
        name: 'AI: Keyword research',
        description: 'Ask AI to suggest SEO keywords grouped by intent.',
        icon: 'search',
        accent: '#f59e0b',
        defaultPrompt: 'Suggest SEO keyword clusters with intent and difficulty scores using these seed terms: {{payload}}',
        label: 'AI keyword research',
        tags: ['ai', 'marketing', 'seo'],
        temperature: 0.5,
        maxTokens: 380,
        successLog: 'Generated keyword research clusters.'
    },
    {
        id: 'ai-sql-query-builder',
        name: 'AI: SQL query builder',
        description: 'Convert analytics questions into sample SQL queries.',
        icon: 'database',
        accent: '#8b5cf6',
        defaultPrompt: 'Write a SQL query that satisfies the following analytics request. Include comments explaining each clause: {{payload}}',
        label: 'AI SQL builder',
        tags: ['ai', 'data', 'sql'],
        temperature: 0.35,
        maxTokens: 320,
        overrides: {
            useMessages: true,
            systemPrompt: 'You are a senior analytics engineer writing safe, well-commented SQL.'
        },
        successLog: 'Generated SQL query example.'
    },
    {
        id: 'ai-json-schema-designer',
        name: 'AI: JSON schema designer',
        description: 'Produce a JSON schema from sample payload descriptions.',
        icon: 'layers',
        accent: '#0ea5e9',
        defaultPrompt: 'Design a JSON schema draft describing the structure of this payload. Include field types and descriptions: {{payload}}',
        label: 'AI schema designer',
        tags: ['ai', 'data', 'json'],
        temperature: 0.4,
        maxTokens: 420,
        successLog: 'Drafted JSON schema definition.'
    },
    {
        id: 'ai-api-contract',
        name: 'AI: API contract draft',
        description: 'Turn request details into an API contract outline.',
        icon: 'code',
        accent: '#22c55e',
        defaultPrompt: 'Prepare an API contract summary with endpoints, methods, request/response fields, and error handling using: {{payload}}',
        label: 'AI API contract',
        tags: ['ai', 'api', 'documentation'],
        temperature: 0.45,
        maxTokens: 480,
        successLog: 'Prepared API contract outline.'
    },
    {
        id: 'ai-test-plan-drafter',
        name: 'AI: Test plan drafter',
        description: 'Generate manual and automated test ideas from requirements.',
        icon: 'check-circle',
        accent: '#14b8a6',
        defaultPrompt: 'Generate a concise QA plan listing manual checks and automation candidates based on: {{payload}}',
        label: 'AI test plan',
        tags: ['ai', 'quality', 'testing'],
        temperature: 0.45,
        maxTokens: 360,
        successLog: 'Produced QA test plan.'
    },
    {
        id: 'ai-meeting-recap',
        name: 'AI: Meeting recap',
        description: 'Summarize transcripts into recap emails with owners and deadlines.',
        icon: 'book-open',
        accent: '#fb7185',
        defaultPrompt: 'Summarize the meeting transcript into key decisions, action items with owners, and next steps: {{payload}}',
        label: 'AI meeting recap',
        tags: ['ai', 'meetings', 'summary'],
        temperature: 0.4,
        maxTokens: 380,
        successLog: 'Prepared meeting recap.'
    },
    {
        id: 'ai-competitive-insights',
        name: 'AI: Competitive insights',
        description: 'Compare competitor notes and highlight differentiators.',
        icon: 'activity',
        accent: '#f87171',
        defaultPrompt: 'Analyze the competitive research below and highlight differentiators, risks, and opportunities: {{payload}}',
        label: 'AI competitive analysis',
        tags: ['ai', 'analysis', 'strategy'],
        temperature: 0.5,
        maxTokens: 420,
        successLog: 'Generated competitive insights.'
    },
    {
        id: 'ai-bug-triage-brief',
        name: 'AI: Bug triage brief',
        description: 'Summarize bug reports with severity and suggested owners.',
        icon: 'alert-circle',
        accent: '#facc15',
        defaultPrompt: 'Summarize these bug reports into a triage brief listing severity, impact, and suggested owners: {{payload}}',
        label: 'AI bug triage',
        tags: ['ai', 'engineering', 'support'],
        temperature: 0.4,
        maxTokens: 360,
        successLog: 'Prepared bug triage summary.'
    },
    {
        id: 'ai-roadmap-outline',
        name: 'AI: Roadmap outline',
        description: 'Arrange initiatives into phased roadmap themes.',
        icon: 'map',
        accent: '#38bdf8',
        defaultPrompt: 'Organize these initiatives into a quarterly roadmap with themes, goals, and dependencies: {{payload}}',
        label: 'AI roadmap outline',
        tags: ['ai', 'product', 'planning'],
        temperature: 0.45,
        maxTokens: 420,
        successLog: 'Outlined roadmap themes.'
    },
    {
        id: 'ai-ux-copy-review',
        name: 'AI: UX copy review',
        description: 'Review UI strings and suggest UX copy improvements.',
        icon: 'type',
        accent: '#a855f7',
        defaultPrompt: 'Review the following UI copy, suggest clearer alternatives, and note tone or accessibility issues: {{payload}}',
        label: 'AI UX copy review',
        tags: ['ai', 'ux', 'copywriting'],
        temperature: 0.35,
        maxTokens: 320,
        successLog: 'Evaluated UX copy.'
    },
    {
        id: 'ai-video-script-writer',
        name: 'AI: Video script writer',
        description: 'Generate a short-form video script with scenes and narration.',
        icon: 'video',
        accent: '#f472b6',
        defaultPrompt: 'Create a short-form video script with scene breakdowns and narration based on: {{payload}}',
        label: 'AI video script',
        tags: ['ai', 'marketing', 'content'],
        temperature: 0.75,
        maxTokens: 460,
        successLog: 'Created video script outline.'
    },
    {
        id: 'ai-learning-plan',
        name: 'AI: Learning plan',
        description: 'Build a personalized learning roadmap from goals and skills.',
        icon: 'book',
        accent: '#22d3ee',
        defaultPrompt: 'Create a phased learning plan with milestones and resources using these goals: {{payload}}',
        label: 'AI learning plan',
        tags: ['ai', 'education', 'planning'],
        temperature: 0.55,
        maxTokens: 420,
        successLog: 'Generated learning plan.'
    },
    {
        id: 'ai-job-description-writer',
        name: 'AI: Job description writer',
        description: 'Turn role requirements into a compelling job description.',
        icon: 'user',
        accent: '#0ea5e9',
        defaultPrompt: 'Draft a job description with responsibilities, requirements, and benefits for this role: {{payload}}',
        label: 'AI job description',
        tags: ['ai', 'hr', 'recruiting'],
        temperature: 0.5,
        maxTokens: 420,
        successLog: 'Drafted job description.'
    },
    {
        id: 'ai-onboarding-checklist',
        name: 'AI: Onboarding checklist',
        description: 'Create onboarding steps for new hires from internal notes.',
        icon: 'check-square',
        accent: '#10b981',
        defaultPrompt: 'Create a week-by-week onboarding checklist with owners and goals based on: {{payload}}',
        label: 'AI onboarding checklist',
        tags: ['ai', 'hr', 'operations'],
        temperature: 0.45,
        maxTokens: 380,
        successLog: 'Produced onboarding checklist.'
    },
    {
        id: 'ai-customer-journey-map',
        name: 'AI: Customer journey map',
        description: 'Generate journey stages, emotions, and opportunities.',
        icon: 'compass',
        accent: '#f97316',
        defaultPrompt: 'Map the customer journey stages, emotions, and opportunities using this research: {{payload}}',
        label: 'AI journey map',
        tags: ['ai', 'customer', 'strategy'],
        temperature: 0.55,
        maxTokens: 420,
        successLog: 'Outlined customer journey map.'
    },
    {
        id: 'ai-risk-register',
        name: 'AI: Risk register',
        description: 'Summarize project risks with probability and mitigation.',
        icon: 'shield',
        accent: '#f87171',
        defaultPrompt: 'Create a risk register with probability, impact, and mitigation actions based on: {{payload}}',
        label: 'AI risk register',
        tags: ['ai', 'project', 'risk'],
        temperature: 0.4,
        maxTokens: 360,
        successLog: 'Generated risk register.'
    },
    {
        id: 'ai-sprint-goal-setter',
        name: 'AI: Sprint goal setter',
        description: 'Summarize backlog highlights into focused sprint goals.',
        icon: 'flag',
        accent: '#38bdf8',
        defaultPrompt: 'Summarize these backlog items into 2-3 sprint goals with metrics for success: {{payload}}',
        label: 'AI sprint goals',
        tags: ['ai', 'agile', 'planning'],
        temperature: 0.4,
        maxTokens: 320,
        successLog: 'Outlined sprint goals.'
    },
    {
        id: 'ai-vision-statement',
        name: 'AI: Vision statement',
        description: 'Condense company direction into an inspiring vision statement.',
        icon: 'star',
        accent: '#fbbf24',
        defaultPrompt: 'Write an inspiring vision statement capturing the essence of these notes: {{payload}}',
        label: 'AI vision statement',
        tags: ['ai', 'leadership', 'branding'],
        temperature: 0.6,
        maxTokens: 260,
        successLog: 'Created vision statement.'
    }
];

AdvancedAiWorkflowScenarios.forEach(scenario => {
    const defaultModel = scenario.defaultModel || 'gpt-4o-mini';
    const defaultTemperature = scenario.temperature ?? 0.7;
    const defaultMaxTokens = scenario.maxTokens ?? 512;
    const baseForm = [
        { key: 'endpoint', label: 'AI endpoint', type: 'url', placeholder: 'https://api.openai.com/v1/chat/completions' },
        { key: 'apiKey', label: 'API key', type: 'password', placeholder: 'sk-...' },
        { key: 'model', label: 'Model', type: 'text', placeholder: defaultModel },
        { key: 'prompt', label: 'Prompt template', type: 'textarea', rows: 4, placeholder: scenario.defaultPrompt },
        { key: 'temperature', label: 'Temperature', type: 'number', step: '0.1', placeholder: String(defaultTemperature) },
        { key: 'maxTokens', label: 'Max tokens', type: 'number', placeholder: String(defaultMaxTokens) }
    ];

    AdditionalQuickActionModules.push({
        id: scenario.id,
        category: 'action',
        name: scenario.name,
        description: scenario.description,
        icon: scenario.icon,
        accent: scenario.accent,
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: {
            endpoint: '',
            apiKey: '',
            model: defaultModel,
            prompt: scenario.defaultPrompt,
            temperature: defaultTemperature,
            maxTokens: defaultMaxTokens
        },
        form: scenario.extraForm ? baseForm.concat(scenario.extraForm) : baseForm,
        tags: scenario.tags,
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const result = await performAiTextRequest(clone, config, {
                label: scenario.label,
                defaultPrompt: scenario.defaultPrompt,
                ...scenario.overrides
            });
            if (result) {
                clone.payload = result.text;
                clone.vars.lastAiResponse = result.raw;
                clone.logs.push(scenario.successLog || `${scenario.name} completed.`);
            }
            return [clone];
        }
    });
});

const NotificationIntegrationScenarios = [
    {
        id: 'notify-slack-channel',
        name: 'Notification: Slack channel message',
        description: 'Post a message to a Slack channel using chat.postMessage.',
        icon: 'message-square',
        accent: '#36c5f0',
        defaultEndpoint: 'https://slack.com/api/chat.postMessage',
        defaultConfig: {
            endpoint: 'https://slack.com/api/chat.postMessage',
            apiKey: '',
            channel: '#general',
            text: '',
            threadTs: ''
        },
        form: [
            { key: 'endpoint', label: 'API endpoint', type: 'url', placeholder: 'https://slack.com/api/chat.postMessage' },
            { key: 'apiKey', label: 'Bot token', type: 'password', placeholder: 'xoxb-...' },
            { key: 'channel', label: 'Channel or user', type: 'text', placeholder: '#general' },
            { key: 'text', label: 'Message text', type: 'textarea', rows: 3, placeholder: 'Optional text or use payload' },
            { key: 'threadTs', label: 'Thread timestamp', type: 'text', placeholder: 'Optional thread_ts' }
        ],
        authHeader: 'Authorization',
        authPrefix: 'Bearer ',
        buildBody: (config, clone) => ({
            channel: ensureString(config.channel || ''),
            text: ensureString(config.text || clone.payload || ''),
            thread_ts: ensureString(config.threadTs || '') || undefined
        }),
        label: 'Slack notification',
        successLog: 'Slack message request sent.',
        storeRawKey: 'slackNotificationResponse',
        tags: ['integration', 'notification', 'slack']
    },
    {
        id: 'notify-slack-workflow',
        name: 'Notification: Slack workflow trigger',
        description: 'Invoke a Slack workflow trigger with structured inputs.',
        icon: 'zap',
        accent: '#4ade80',
        defaultEndpoint: 'https://slack.com/api/workflows.triggers.invoke',
        defaultConfig: {
            endpoint: 'https://slack.com/api/workflows.triggers.invoke',
            apiKey: '',
            triggerId: '',
            inputsJson: ''
        },
        form: [
            { key: 'endpoint', label: 'API endpoint', type: 'url', placeholder: 'https://slack.com/api/workflows.triggers.invoke' },
            { key: 'apiKey', label: 'Bot token', type: 'password', placeholder: 'xoxb-...' },
            { key: 'triggerId', label: 'Trigger ID', type: 'text', placeholder: 'T123.ABCD' },
            { key: 'inputsJson', label: 'Inputs (JSON)', type: 'textarea', rows: 4, placeholder: '{"input_1":{"value":"..."}}' }
        ],
        authHeader: 'Authorization',
        authPrefix: 'Bearer ',
        buildBody: (config, clone) => {
            const triggerId = ensureString(config.triggerId || '');
            const raw = ensureString(config.inputsJson || clone.payload || '');
            let inputs = {};
            if (raw) {
                try {
                    inputs = JSON.parse(raw);
                } catch (error) {
                    clone.logs.push(`Slack workflow inputs parse failed: ${error.message}`);
                }
            }
            return {
                trigger_id: triggerId,
                inputs
            };
        },
        label: 'Slack workflow invoke',
        successLog: 'Slack workflow trigger invoked.',
        storeRawKey: 'slackWorkflowResponse',
        tags: ['integration', 'notification', 'slack']
    },
    {
        id: 'notify-discord-webhook',
        name: 'Notification: Discord webhook',
        description: 'Send a message to a Discord channel via webhook.',
        icon: 'send',
        accent: '#5865f2',
        defaultEndpoint: '',
        defaultConfig: {
            endpoint: 'https://discord.com/api/webhooks/...',
            username: '',
            avatarUrl: '',
            content: '',
            embedsJson: ''
        },
        form: [
            { key: 'endpoint', label: 'Webhook URL', type: 'url', placeholder: 'https://discord.com/api/webhooks/...' },
            { key: 'username', label: 'Username', type: 'text', placeholder: 'Optional username override' },
            { key: 'avatarUrl', label: 'Avatar URL', type: 'url', placeholder: 'Optional avatar URL' },
            { key: 'content', label: 'Content', type: 'textarea', rows: 3, placeholder: 'Optional content or use payload' },
            { key: 'embedsJson', label: 'Embeds (JSON)', type: 'textarea', rows: 4, placeholder: '[{"title":"Update"}]' }
        ],
        skipAuthHeader: true,
        buildBody: (config, clone) => {
            const text = ensureString(config.content || clone.payload || '');
            const embedsRaw = ensureString(config.embedsJson || '');
            let embeds;
            if (embedsRaw) {
                try {
                    const parsed = JSON.parse(embedsRaw);
                    if (Array.isArray(parsed)) embeds = parsed;
                } catch (error) {
                    clone.logs.push(`Discord embeds parse failed: ${error.message}`);
                }
            }
            return {
                username: ensureString(config.username || '') || undefined,
                avatar_url: ensureString(config.avatarUrl || '') || undefined,
                content: text || undefined,
                embeds
            };
        },
        label: 'Discord webhook',
        successLog: 'Discord webhook delivered.',
        storeRawKey: 'discordWebhookResponse',
        tags: ['integration', 'notification', 'discord']
    },
    {
        id: 'notify-teams-webhook',
        name: 'Notification: Microsoft Teams',
        description: 'Send an adaptive card message to a Teams incoming webhook.',
        icon: 'layout',
        accent: '#2563eb',
        defaultEndpoint: '',
        defaultConfig: {
            endpoint: 'https://outlook.office.com/webhook/...',
            summary: '',
            title: '',
            text: '',
            potentialActionsJson: ''
        },
        form: [
            { key: 'endpoint', label: 'Webhook URL', type: 'url', placeholder: 'https://outlook.office.com/webhook/...' },
            { key: 'summary', label: 'Summary', type: 'text', placeholder: 'Card summary' },
            { key: 'title', label: 'Title', type: 'text', placeholder: 'Card title' },
            { key: 'text', label: 'Message text', type: 'textarea', rows: 4, placeholder: 'Optional text or use payload' },
            { key: 'potentialActionsJson', label: 'Actions (JSON)', type: 'textarea', rows: 4, placeholder: '[{"@type":"OpenUri"}]' }
        ],
        skipAuthHeader: true,
        buildBody: (config, clone) => {
            const rawActions = ensureString(config.potentialActionsJson || '');
            let actions;
            if (rawActions) {
                try {
                    const parsed = JSON.parse(rawActions);
                    if (Array.isArray(parsed)) actions = parsed;
                } catch (error) {
                    clone.logs.push(`Teams actions parse failed: ${error.message}`);
                }
            }
            return {
                '@type': 'MessageCard',
                '@context': 'http://schema.org/extensions',
                summary: ensureString(config.summary || ''),
                title: ensureString(config.title || ''),
                text: ensureString(config.text || clone.payload || ''),
                potentialAction: actions
            };
        },
        label: 'Teams webhook',
        successLog: 'Teams webhook delivered.',
        storeRawKey: 'teamsWebhookResponse',
        tags: ['integration', 'notification', 'teams']
    },
    {
        id: 'notify-mattermost-webhook',
        name: 'Notification: Mattermost webhook',
        description: 'Send a formatted message to a Mattermost incoming webhook.',
        icon: 'message-circle',
        accent: '#dc2626',
        defaultEndpoint: '',
        defaultConfig: {
            endpoint: 'https://mattermost.example.com/hooks/...',
            username: '',
            channel: '',
            iconUrl: '',
            text: ''
        },
        form: [
            { key: 'endpoint', label: 'Webhook URL', type: 'url', placeholder: 'https://mattermost.example.com/hooks/...' },
            { key: 'username', label: 'Username', type: 'text', placeholder: 'Optional username' },
            { key: 'channel', label: 'Channel', type: 'text', placeholder: 'Optional channel override' },
            { key: 'iconUrl', label: 'Icon URL', type: 'url', placeholder: 'Optional icon URL' },
            { key: 'text', label: 'Message text', type: 'textarea', rows: 3, placeholder: 'Optional text or use payload' }
        ],
        skipAuthHeader: true,
        buildBody: (config, clone) => ({
            username: ensureString(config.username || '') || undefined,
            channel: ensureString(config.channel || '') || undefined,
            icon_url: ensureString(config.iconUrl || '') || undefined,
            text: ensureString(config.text || clone.payload || '')
        }),
        label: 'Mattermost webhook',
        successLog: 'Mattermost webhook sent.',
        storeRawKey: 'mattermostWebhookResponse',
        tags: ['integration', 'notification', 'mattermost']
    },
    {
        id: 'notify-rocketchat-webhook',
        name: 'Notification: Rocket.Chat webhook',
        description: 'Send messages to Rocket.Chat via incoming webhook.',
        icon: 'send',
        accent: '#fb7185',
        defaultEndpoint: '',
        defaultConfig: {
            endpoint: 'https://chat.example.com/hooks/...',
            username: '',
            channel: '',
            emoji: '',
            text: ''
        },
        form: [
            { key: 'endpoint', label: 'Webhook URL', type: 'url', placeholder: 'https://chat.example.com/hooks/...' },
            { key: 'username', label: 'Username', type: 'text', placeholder: 'Optional username' },
            { key: 'channel', label: 'Channel', type: 'text', placeholder: '#general' },
            { key: 'emoji', label: 'Avatar emoji', type: 'text', placeholder: ':rocket:' },
            { key: 'text', label: 'Message text', type: 'textarea', rows: 3, placeholder: 'Optional text or use payload' }
        ],
        skipAuthHeader: true,
        buildBody: (config, clone) => ({
            username: ensureString(config.username || '') || undefined,
            channel: ensureString(config.channel || '') || undefined,
            emoji: ensureString(config.emoji || '') || undefined,
            text: ensureString(config.text || clone.payload || '')
        }),
        label: 'Rocket.Chat webhook',
        successLog: 'Rocket.Chat webhook sent.',
        storeRawKey: 'rocketWebhookResponse',
        tags: ['integration', 'notification', 'rocket-chat']
    },
    {
        id: 'notify-google-chat',
        name: 'Notification: Google Chat',
        description: 'Send a message card to Google Chat via webhook.',
        icon: 'message-square',
        accent: '#34a853',
        defaultEndpoint: '',
        defaultConfig: {
            endpoint: 'https://chat.googleapis.com/v1/spaces/.../messages',
            text: '',
            cardsJson: ''
        },
        form: [
            { key: 'endpoint', label: 'Webhook URL', type: 'url', placeholder: 'https://chat.googleapis.com/v1/spaces/.../messages' },
            { key: 'text', label: 'Message text', type: 'textarea', rows: 3, placeholder: 'Optional text or use payload' },
            { key: 'cardsJson', label: 'Cards (JSON)', type: 'textarea', rows: 4, placeholder: '[{"header":{"title":"Update"}}]' }
        ],
        skipAuthHeader: true,
        buildBody: (config, clone) => {
            const cardsRaw = ensureString(config.cardsJson || '');
            let cards;
            if (cardsRaw) {
                try {
                    const parsed = JSON.parse(cardsRaw);
                    if (Array.isArray(parsed)) cards = parsed;
                } catch (error) {
                    clone.logs.push(`Google Chat cards parse failed: ${error.message}`);
                }
            }
            return {
                text: ensureString(config.text || clone.payload || ''),
                cards
            };
        },
        label: 'Google Chat webhook',
        successLog: 'Google Chat webhook sent.',
        storeRawKey: 'googleChatWebhookResponse',
        tags: ['integration', 'notification', 'google-chat']
    },
    {
        id: 'notify-sendgrid-email',
        name: 'Notification: SendGrid email',
        description: 'Send transactional email using the SendGrid API.',
        icon: 'mail',
        accent: '#2563eb',
        defaultEndpoint: 'https://api.sendgrid.com/v3/mail/send',
        defaultConfig: {
            endpoint: 'https://api.sendgrid.com/v3/mail/send',
            apiKey: '',
            to: '',
            fromEmail: '',
            fromName: '',
            subject: '',
            text: '',
            html: ''
        },
        form: [
            { key: 'endpoint', label: 'API endpoint', type: 'url', placeholder: 'https://api.sendgrid.com/v3/mail/send' },
            { key: 'apiKey', label: 'API key', type: 'password', placeholder: 'SG.xxxxx' },
            { key: 'to', label: 'Recipient', type: 'text', placeholder: 'user@example.com' },
            { key: 'fromEmail', label: 'From email', type: 'text', placeholder: 'noreply@example.com' },
            { key: 'fromName', label: 'From name', type: 'text', placeholder: 'Automation Bot' },
            { key: 'subject', label: 'Subject', type: 'text', placeholder: 'Status update' },
            { key: 'text', label: 'Plain text', type: 'textarea', rows: 3, placeholder: 'Optional or use payload' },
            { key: 'html', label: 'HTML content', type: 'textarea', rows: 4, placeholder: '<p>Hello</p>' }
        ],
        authHeader: 'Authorization',
        authPrefix: 'Bearer ',
        buildBody: (config, clone) => {
            const text = ensureString(config.text || clone.payload || '');
            const html = ensureString(config.html || '');
            return {
                personalizations: [
                    {
                        to: [{ email: ensureString(config.to || '') }]
                    }
                ],
                from: {
                    email: ensureString(config.fromEmail || ''),
                    name: ensureString(config.fromName || '') || undefined
                },
                subject: ensureString(config.subject || ''),
                content: [
                    { type: 'text/plain', value: text },
                    ...(html ? [{ type: 'text/html', value: html }] : [])
                ]
            };
        },
        label: 'SendGrid email',
        successLog: 'SendGrid email API invoked.',
        storeRawKey: 'sendgridLastResponse',
        tags: ['integration', 'notification', 'email']
    },
    {
        id: 'notify-resend-email',
        name: 'Notification: Resend email',
        description: 'Deliver transactional email via Resend.',
        icon: 'mail',
        accent: '#ef4444',
        defaultEndpoint: 'https://api.resend.com/emails',
        defaultConfig: {
            endpoint: 'https://api.resend.com/emails',
            apiKey: '',
            from: '',
            to: '',
            subject: '',
            html: '',
            text: ''
        },
        form: [
            { key: 'endpoint', label: 'API endpoint', type: 'url', placeholder: 'https://api.resend.com/emails' },
            { key: 'apiKey', label: 'API key', type: 'password', placeholder: 're_xxxxxxxxx' },
            { key: 'from', label: 'From', type: 'text', placeholder: 'Automation <bot@example.com>' },
            { key: 'to', label: 'To', type: 'text', placeholder: 'user@example.com' },
            { key: 'subject', label: 'Subject', type: 'text', placeholder: 'Status update' },
            { key: 'html', label: 'HTML content', type: 'textarea', rows: 4, placeholder: '<p>Hello</p>' },
            { key: 'text', label: 'Plain text', type: 'textarea', rows: 3, placeholder: 'Optional or use payload' }
        ],
        authHeader: 'Authorization',
        authPrefix: 'Bearer ',
        buildBody: (config, clone) => ({
            from: ensureString(config.from || ''),
            to: ensureString(config.to || ''),
            subject: ensureString(config.subject || ''),
            html: ensureString(config.html || '') || undefined,
            text: ensureString(config.text || clone.payload || '') || undefined
        }),
        label: 'Resend email',
        successLog: 'Resend email API invoked.',
        storeRawKey: 'resendLastResponse',
        tags: ['integration', 'notification', 'email']
    },
    {
        id: 'notify-postmark-email',
        name: 'Notification: Postmark email',
        description: 'Send email using the Postmark API.',
        icon: 'mail',
        accent: '#f97316',
        defaultEndpoint: 'https://api.postmarkapp.com/email',
        defaultConfig: {
            endpoint: 'https://api.postmarkapp.com/email',
            apiKey: '',
            from: '',
            to: '',
            subject: '',
            text: '',
            html: ''
        },
        form: [
            { key: 'endpoint', label: 'API endpoint', type: 'url', placeholder: 'https://api.postmarkapp.com/email' },
            { key: 'apiKey', label: 'Server token', type: 'password', placeholder: 'POSTMARK_API_TEST' },
            { key: 'from', label: 'From', type: 'text', placeholder: 'bot@example.com' },
            { key: 'to', label: 'To', type: 'text', placeholder: 'user@example.com' },
            { key: 'subject', label: 'Subject', type: 'text', placeholder: 'Status update' },
            { key: 'text', label: 'Plain text', type: 'textarea', rows: 3, placeholder: 'Optional or use payload' },
            { key: 'html', label: 'HTML content', type: 'textarea', rows: 4, placeholder: '<p>Hello</p>' }
        ],
        authHeader: 'X-Postmark-Server-Token',
        buildBody: (config, clone) => ({
            From: ensureString(config.from || ''),
            To: ensureString(config.to || ''),
            Subject: ensureString(config.subject || ''),
            TextBody: ensureString(config.text || clone.payload || '') || undefined,
            HtmlBody: ensureString(config.html || '') || undefined
        }),
        label: 'Postmark email',
        successLog: 'Postmark email API invoked.',
        storeRawKey: 'postmarkLastResponse',
        tags: ['integration', 'notification', 'email']
    },
    {
        id: 'notify-pagerduty-event',
        name: 'Notification: PagerDuty incident',
        description: 'Trigger a PagerDuty incident using the Events API v2.',
        icon: 'alert-triangle',
        accent: '#f97316',
        defaultEndpoint: 'https://events.pagerduty.com/v2/enqueue',
        defaultConfig: {
            endpoint: 'https://events.pagerduty.com/v2/enqueue',
            routingKey: '',
            summary: '',
            source: 'automation-runner',
            severity: 'info',
            component: '',
            group: '',
            customDetailsJson: ''
        },
        form: [
            { key: 'endpoint', label: 'Events endpoint', type: 'url', placeholder: 'https://events.pagerduty.com/v2/enqueue' },
            { key: 'routingKey', label: 'Routing key', type: 'password', placeholder: 'integration key' },
            { key: 'summary', label: 'Incident summary', type: 'text', placeholder: 'API outage detected' },
            { key: 'source', label: 'Source', type: 'text', placeholder: 'automation-runner' },
            { key: 'severity', label: 'Severity', type: 'text', placeholder: 'info' },
            { key: 'component', label: 'Component', type: 'text', placeholder: 'web' },
            { key: 'group', label: 'Group', type: 'text', placeholder: 'sre' },
            { key: 'customDetailsJson', label: 'Custom details (JSON)', type: 'textarea', rows: 4, placeholder: '{"status":"degraded"}' }
        ],
        skipAuthHeader: true,
        buildBody: (config, clone) => {
            const detailsRaw = ensureString(config.customDetailsJson || clone.payload || '');
            let customDetails;
            if (detailsRaw) {
                try {
                    customDetails = JSON.parse(detailsRaw);
                } catch (error) {
                    clone.logs.push(`PagerDuty custom details parse failed: ${error.message}`);
                }
            }
            return {
                routing_key: ensureString(config.routingKey || ''),
                event_action: 'trigger',
                payload: {
                    summary: ensureString(config.summary || ''),
                    source: ensureString(config.source || 'automation-runner'),
                    severity: ensureString(config.severity || 'info'),
                    component: ensureString(config.component || '') || undefined,
                    group: ensureString(config.group || '') || undefined,
                    custom_details: customDetails
                }
            };
        },
        label: 'PagerDuty event',
        successLog: 'PagerDuty incident triggered.',
        storeRawKey: 'pagerdutyEventResponse',
        tags: ['integration', 'notification', 'pagerduty']
    },
    {
        id: 'notify-opsgenie-alert',
        name: 'Notification: Opsgenie alert',
        description: 'Create an Opsgenie alert with optional responders.',
        icon: 'bell',
        accent: '#f97316',
        defaultEndpoint: 'https://api.opsgenie.com/v2/alerts',
        defaultConfig: {
            endpoint: 'https://api.opsgenie.com/v2/alerts',
            apiKey: '',
            message: '',
            alias: '',
            description: '',
            priority: 'P3',
            respondersJson: ''
        },
        form: [
            { key: 'endpoint', label: 'API endpoint', type: 'url', placeholder: 'https://api.opsgenie.com/v2/alerts' },
            { key: 'apiKey', label: 'Genie key', type: 'password', placeholder: 'Opsgenie GenieKey' },
            { key: 'message', label: 'Message', type: 'text', placeholder: 'Service offline' },
            { key: 'alias', label: 'Alias', type: 'text', placeholder: 'incident-123' },
            { key: 'description', label: 'Description', type: 'textarea', rows: 3, placeholder: 'Optional description or use payload' },
            { key: 'priority', label: 'Priority', type: 'text', placeholder: 'P3' },
            { key: 'respondersJson', label: 'Responders (JSON)', type: 'textarea', rows: 4, placeholder: '[{"type":"team","id":"..."}]' }
        ],
        authHeader: 'Authorization',
        authPrefix: 'GenieKey ',
        buildBody: (config, clone) => {
            const respondersRaw = ensureString(config.respondersJson || '');
            let responders;
            if (respondersRaw) {
                try {
                    const parsed = JSON.parse(respondersRaw);
                    if (Array.isArray(parsed)) responders = parsed;
                } catch (error) {
                    clone.logs.push(`Opsgenie responders parse failed: ${error.message}`);
                }
            }
            return {
                message: ensureString(config.message || ''),
                alias: ensureString(config.alias || '') || undefined,
                description: ensureString(config.description || clone.payload || ''),
                priority: ensureString(config.priority || 'P3'),
                responders
            };
        },
        label: 'Opsgenie alert',
        successLog: 'Opsgenie alert created.',
        storeRawKey: 'opsgenieAlertResponse',
        tags: ['integration', 'notification', 'opsgenie']
    },
    {
        id: 'notify-onesignal-push',
        name: 'Notification: OneSignal push',
        description: 'Send a push notification via OneSignal.',
        icon: 'smartphone',
        accent: '#ef4444',
        defaultEndpoint: 'https://onesignal.com/api/v1/notifications',
        defaultConfig: {
            endpoint: 'https://onesignal.com/api/v1/notifications',
            apiKey: '',
            appId: '',
            headings: '',
            contents: '',
            playerIdsCsv: '',
            url: ''
        },
        form: [
            { key: 'endpoint', label: 'API endpoint', type: 'url', placeholder: 'https://onesignal.com/api/v1/notifications' },
            { key: 'apiKey', label: 'REST API key', type: 'password', placeholder: 'onesignal-rest-key' },
            { key: 'appId', label: 'App ID', type: 'text', placeholder: 'OneSignal app ID' },
            { key: 'headings', label: 'Title', type: 'text', placeholder: 'Notification title' },
            { key: 'contents', label: 'Body', type: 'textarea', rows: 3, placeholder: 'Optional body or use payload' },
            { key: 'playerIdsCsv', label: 'Player IDs', type: 'text', placeholder: 'id1,id2' },
            { key: 'url', label: 'URL', type: 'url', placeholder: 'https://example.com' }
        ],
        authHeader: 'Authorization',
        authPrefix: 'Basic ',
        buildBody: (config, clone) => {
            const playerIds = ensureString(config.playerIdsCsv || '')
                .split(',')
                .map(id => id.trim())
                .filter(Boolean);
            return {
                app_id: ensureString(config.appId || ''),
                headings: { en: ensureString(config.headings || '') },
                contents: { en: ensureString(config.contents || clone.payload || '') },
                include_player_ids: playerIds.length > 0 ? playerIds : undefined,
                url: ensureString(config.url || '') || undefined
            };
        },
        label: 'OneSignal push',
        successLog: 'OneSignal notification created.',
        storeRawKey: 'oneSignalResponse',
        tags: ['integration', 'notification', 'push']
    },
    {
        id: 'notify-expo-push',
        name: 'Notification: Expo push',
        description: 'Send push notifications to Expo tokens.',
        icon: 'bell',
        accent: '#38bdf8',
        defaultEndpoint: 'https://exp.host/--/api/v2/push/send',
        defaultConfig: {
            endpoint: 'https://exp.host/--/api/v2/push/send',
            apiKey: '',
            to: '',
            title: '',
            body: '',
            dataJson: ''
        },
        form: [
            { key: 'endpoint', label: 'API endpoint', type: 'url', placeholder: 'https://exp.host/--/api/v2/push/send' },
            { key: 'apiKey', label: 'Access token', type: 'password', placeholder: 'Expo access token (optional)' },
            { key: 'to', label: 'To', type: 'text', placeholder: 'ExponentPushToken[xxxx]' },
            { key: 'title', label: 'Title', type: 'text', placeholder: 'Notification title' },
            { key: 'body', label: 'Body', type: 'textarea', rows: 3, placeholder: 'Optional body or use payload' },
            { key: 'dataJson', label: 'Data (JSON)', type: 'textarea', rows: 4, placeholder: '{"screen":"Home"}' }
        ],
        authHeader: 'Authorization',
        authPrefix: 'Bearer ',
        buildBody: (config, clone) => {
            const dataRaw = ensureString(config.dataJson || '');
            let data;
            if (dataRaw) {
                try {
                    data = JSON.parse(dataRaw);
                } catch (error) {
                    clone.logs.push(`Expo push data parse failed: ${error.message}`);
                }
            }
            return {
                to: ensureString(config.to || ''),
                title: ensureString(config.title || ''),
                body: ensureString(config.body || clone.payload || ''),
                data
            };
        },
        label: 'Expo push',
        successLog: 'Expo push notification sent.',
        storeRawKey: 'expoPushResponse',
        tags: ['integration', 'notification', 'push']
    },
    {
        id: 'notify-fcm-message',
        name: 'Notification: Firebase Cloud Messaging',
        description: 'Send a message using the FCM legacy HTTP API.',
        icon: 'send',
        accent: '#0ea5e9',
        defaultEndpoint: 'https://fcm.googleapis.com/fcm/send',
        defaultConfig: {
            endpoint: 'https://fcm.googleapis.com/fcm/send',
            apiKey: '',
            to: '',
            title: '',
            body: '',
            dataJson: ''
        },
        form: [
            { key: 'endpoint', label: 'API endpoint', type: 'url', placeholder: 'https://fcm.googleapis.com/fcm/send' },
            { key: 'apiKey', label: 'Server key', type: 'password', placeholder: 'AAAA...' },
            { key: 'to', label: 'Device token/topic', type: 'text', placeholder: '/topics/all' },
            { key: 'title', label: 'Title', type: 'text', placeholder: 'Notification title' },
            { key: 'body', label: 'Body', type: 'textarea', rows: 3, placeholder: 'Optional body or use payload' },
            { key: 'dataJson', label: 'Data (JSON)', type: 'textarea', rows: 4, placeholder: '{"key":"value"}' }
        ],
        authHeader: 'Authorization',
        authPrefix: 'key=',
        buildBody: (config, clone) => {
            const dataRaw = ensureString(config.dataJson || '');
            let data;
            if (dataRaw) {
                try {
                    data = JSON.parse(dataRaw);
                } catch (error) {
                    clone.logs.push(`FCM data parse failed: ${error.message}`);
                }
            }
            return {
                to: ensureString(config.to || ''),
                notification: {
                    title: ensureString(config.title || ''),
                    body: ensureString(config.body || clone.payload || '')
                },
                data
            };
        },
        label: 'FCM message',
        successLog: 'FCM message dispatched.',
        storeRawKey: 'fcmMessageResponse',
        tags: ['integration', 'notification', 'push']
    },
    {
        id: 'notify-webex-message',
        name: 'Notification: Webex room message',
        description: 'Post a markdown message to a Webex room.',
        icon: 'message-circle',
        accent: '#1f9fff',
        defaultEndpoint: 'https://webexapis.com/v1/messages',
        defaultConfig: {
            endpoint: 'https://webexapis.com/v1/messages',
            apiKey: '',
            roomId: '',
            markdown: '',
            fileUrl: ''
        },
        form: [
            { key: 'endpoint', label: 'API endpoint', type: 'url', placeholder: 'https://webexapis.com/v1/messages' },
            { key: 'apiKey', label: 'Access token', type: 'password', placeholder: 'Bearer token' },
            { key: 'roomId', label: 'Room ID', type: 'text', placeholder: 'Y2lzY29zcGFyazovL3VzL1JPT00v...' },
            { key: 'markdown', label: 'Markdown', type: 'textarea', rows: 3, placeholder: 'Optional markdown or use payload' },
            { key: 'fileUrl', label: 'File URL', type: 'url', placeholder: 'Optional attachment URL' }
        ],
        authHeader: 'Authorization',
        authPrefix: 'Bearer ',
        buildBody: (config, clone) => ({
            roomId: ensureString(config.roomId || ''),
            markdown: ensureString(config.markdown || clone.payload || ''),
            files: ensureString(config.fileUrl || '') ? [ensureString(config.fileUrl)] : undefined
        }),
        label: 'Webex message',
        successLog: 'Webex message sent.',
        storeRawKey: 'webexMessageResponse',
        tags: ['integration', 'notification', 'webex']
    }
];

NotificationIntegrationScenarios.forEach(scenario => {
    AdditionalQuickActionModules.push({
        id: scenario.id,
        category: 'action',
        name: scenario.name,
        description: scenario.description,
        icon: scenario.icon,
        accent: scenario.accent,
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: scenario.defaultConfig,
        form: scenario.form,
        tags: scenario.tags,
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            const result = await performHttpAction(clone, config || {}, scenario);
            if (result) {
                if (typeof scenario.afterSuccess === 'function') {
                    try {
                        scenario.afterSuccess(clone, result, config || {});
                    } catch (error) {
                        clone.logs.push(`Post-success handler failed: ${error.message}`);
                    }
                } else if (scenario.updatePayloadWithResponse) {
                    const payload = result.payload !== undefined ? result.payload : result.data;
                    if (payload !== undefined) {
                        clone.payload = typeof payload === 'string'
                            ? payload
                            : JSON.stringify(payload, null, 2);
                    }
                }
            }
            return [clone];
        }
    });
});

const DataTransformationScenarios = [
    {
        id: 'payload-sort-lines',
        name: 'Payload: Sort lines',
        description: 'Sort newline-separated lines alphabetically.',
        icon: 'list',
        accent: '#38bdf8',
        tags: ['payload', 'sorting'],
        transform: (value) => {
            return ensureString(value || '')
                .split(/?
/)
                .map(line => line.trim())
                .filter(Boolean)
                .sort((a, b) => a.localeCompare(b))
                .join('
');
        }
    },
    {
        id: 'payload-unique-lines',
        name: 'Payload: Unique lines',
        description: 'Remove duplicate lines while preserving original order.',
        icon: 'divide-square',
        accent: '#0ea5e9',
        tags: ['payload', 'dedupe'],
        transform: (value) => {
            const seen = new Set();
            return ensureString(value || '')
                .split(/?
/)
                .map(line => line.trim())
                .filter(line => {
                    if (!line) return false;
                    if (seen.has(line)) return false;
                    seen.add(line);
                    return true;
                })
                .join('
');
        }
    },
    {
        id: 'payload-shuffle-lines',
        name: 'Payload: Shuffle lines',
        description: 'Randomize the order of newline-separated lines.',
        icon: 'shuffle',
        accent: '#f97316',
        tags: ['payload', 'randomize'],
        transform: (value) => {
            const lines = ensureString(value || '')
                .split(/?
/)
                .map(line => line.trim())
                .filter(Boolean);
            for (let i = lines.length - 1; i > 0; i -= 1) {
                const j = Math.floor(Math.random() * (i + 1));
                [lines[i], lines[j]] = [lines[j], lines[i]];
            }
            return lines.join('
');
        }
    },
    {
        id: 'payload-number-lines',
        name: 'Payload: Number lines',
        description: 'Add incremental numbers to each non-empty line.',
        icon: 'hash',
        accent: '#a855f7',
        tags: ['payload', 'formatting'],
        defaultConfig: { start: 1, pad: 2, separator: '. ' },
        form: [
            { key: 'start', label: 'Starting number', type: 'number', placeholder: '1' },
            { key: 'pad', label: 'Zero padding', type: 'number', placeholder: '2' },
            { key: 'separator', label: 'Separator', type: 'text', placeholder: '. ' }
        ],
        transform: (value, config) => {
            const start = Number.isFinite(Number(config?.start)) ? Number(config.start) : 1;
            const pad = Number.isFinite(Number(config?.pad)) ? Number(config.pad) : 2;
            const separator = ensureString(config?.separator || '. ');
            return ensureString(value || '')
                .split(/?
/)
                .map(line => line.trim())
                .filter(Boolean)
                .map((line, index) => `${String(start + index).padStart(pad, '0')}${separator}${line}`)
                .join('
');
        }
    },
    {
        id: 'payload-trim-line-whitespace',
        name: 'Payload: Trim line whitespace',
        description: 'Trim leading and trailing whitespace for every line.',
        icon: 'scissors',
        accent: '#10b981',
        tags: ['payload', 'cleanup'],
        transform: (value) => ensureString(value || '')
            .split(/?
/)
            .map(line => line.trim())
            .join('
')
    },
    {
        id: 'payload-line-prefix',
        name: 'Payload: Add line prefix',
        description: 'Prefix each non-empty line with custom text.',
        icon: 'corner-down-right',
        accent: '#f59e0b',
        tags: ['payload', 'formatting'],
        defaultConfig: { prefix: '- ' },
        form: [
            { key: 'prefix', label: 'Prefix', type: 'text', placeholder: '- ' }
        ],
        transform: (value, config) => {
            const prefix = ensureString(config?.prefix || '- ');
            return ensureString(value || '')
                .split(/?
/)
                .map(line => line.trim())
                .filter(Boolean)
                .map(line => `${prefix}${line}`)
                .join('
');
        }
    },
    {
        id: 'payload-line-suffix',
        name: 'Payload: Add line suffix',
        description: 'Append a suffix to each non-empty line.',
        icon: 'corner-down-left',
        accent: '#ef4444',
        tags: ['payload', 'formatting'],
        defaultConfig: { suffix: ';' },
        form: [
            { key: 'suffix', label: 'Suffix', type: 'text', placeholder: ';' }
        ],
        transform: (value, config) => {
            const suffix = ensureString(config?.suffix || ';');
            return ensureString(value || '')
                .split(/?
/)
                .map(line => line.trim())
                .filter(Boolean)
                .map(line => `${line}${suffix}`)
                .join('
');
        }
    },
    {
        id: 'payload-wrap-columns',
        name: 'Payload: Wrap columns',
        description: 'Wrap text to a fixed column width for readability.',
        icon: 'align-left',
        accent: '#6366f1',
        tags: ['payload', 'formatting'],
        defaultConfig: { width: 80 },
        form: [
            { key: 'width', label: 'Column width', type: 'number', placeholder: '80' }
        ],
        transform: (value, config) => {
            const width = Math.max(10, Number(config?.width) || 80);
            const wrapLine = (line) => {
                const words = line.split(/\s+/).filter(Boolean);
                if (words.length === 0) return [''];
                const rows = [];
                let current = words.shift();
                words.forEach(word => {
                    if ((current + ' ' + word).length <= width) {
                        current = `${current} ${word}`;
                    } else {
                        rows.push(current);
                        current = word;
                    }
                });
                rows.push(current);
                return rows;
            };
            return ensureString(value || '')
                .split(/?
/)
                .flatMap(wrapLine)
                .join('
');
        }
    },
    {
        id: 'payload-to-checklist',
        name: 'Payload: To checklist',
        description: 'Convert lines into a markdown checklist.',
        icon: 'check-square',
        accent: '#34d399',
        tags: ['payload', 'formatting'],
        transform: (value) => ensureString(value || '')
            .split(/?
/)
            .map(line => line.trim())
            .filter(Boolean)
            .map(line => `- [ ] ${line}`)
            .join('
')
    },
    {
        id: 'payload-lines-to-json-array',
        name: 'Payload: Lines to JSON array',
        description: 'Represent each non-empty line as a JSON array element.',
        icon: 'code',
        accent: '#f97316',
        tags: ['payload', 'formatting'],
        transform: (value) => {
            const items = ensureString(value || '')
                .split(/?
/)
                .map(line => line.trim())
                .filter(Boolean);
            return JSON.stringify(items, null, 2);
        }
    },
    {
        id: 'payload-lines-to-jsonl',
        name: 'Payload: Lines to JSONL',
        description: 'Convert lines into JSONL with a configurable field name.',
        icon: 'file-text',
        accent: '#facc15',
        tags: ['payload', 'formatting'],
        defaultConfig: { field: 'value' },
        form: [
            { key: 'field', label: 'Field name', type: 'text', placeholder: 'value' }
        ],
        transform: (value, config) => {
            const field = ensureString(config?.field || 'value');
            return ensureString(value || '')
                .split(/?
/)
                .map(line => line.trim())
                .filter(Boolean)
                .map(line => JSON.stringify({ [field]: line }))
                .join('
');
        }
    },
    {
        id: 'payload-extract-markdown-headings',
        name: 'Payload: Extract markdown headings',
        description: 'List markdown headings with their levels.',
        icon: 'type',
        accent: '#22d3ee',
        tags: ['payload', 'analysis'],
        transform: (value) => {
            const text = ensureString(value || '');
            const headings = [];
            const regex = /^(#{1,6})\s+(.*)$/gm;
            let match;
            while ((match = regex.exec(text)) !== null) {
                const level = match[1].length;
                const title = match[2].trim();
                headings.push(`${'#'.repeat(level)} ${title}`);
            }
            return headings.join('
');
        }
    },
    {
        id: 'payload-extract-markdown-links',
        name: 'Payload: Extract markdown links',
        description: 'Extract link text and URLs from markdown content.',
        icon: 'link',
        accent: '#0ea5e9',
        tags: ['payload', 'analysis'],
        transform: (value) => {
            const text = ensureString(value || '');
            const matches = [];
            const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
            let match;
            while ((match = regex.exec(text)) !== null) {
                matches.push(`${match[1]} -> ${match[2]}`);
            }
            return matches.join('
');
        }
    },
    {
        id: 'payload-extract-code-blocks',
        name: 'Payload: Extract code blocks',
        description: 'Return code fences detected in markdown text.',
        icon: 'code',
        accent: '#8b5cf6',
        tags: ['payload', 'analysis'],
        transform: (value) => {
            const text = ensureString(value || '');
            const blocks = [];
            const regex = /```(\w+)?
([\s\S]*?)```/g;
            let match;
            while ((match = regex.exec(text)) !== null) {
                const language = match[1] ? match[1].trim() : '';
                const body = match[2].replace(/
$/, '');
                blocks.push(language ? `\`\`\`${language}
${body}
\`\`\`` : `\`\`\`
${body}
\`\`\``);
            }
            return blocks.join('

');
        }
    },
    {
        id: 'payload-summary-stats',
        name: 'Payload: Summary stats',
        description: 'Calculate counts for lines, words, and characters.',
        icon: 'bar-chart-2',
        accent: '#fb7185',
        tags: ['payload', 'analysis'],
        transform: (value) => {
            const text = ensureString(value || '');
            const lines = text ? text.split(/?
/).filter(Boolean).length : 0;
            const words = text.trim() ? text.trim().split(/\s+/).length : 0;
            const characters = text.length;
            return `Lines: ${lines}
Words: ${words}
Characters: ${characters}`;
        }
    },
    {
        id: 'payload-detect-duplicate-lines',
        name: 'Payload: Detect duplicate lines',
        description: 'Identify duplicate lines and show their counts.',
        icon: 'alert-circle',
        accent: '#f87171',
        tags: ['payload', 'analysis'],
        transform: (value) => {
            const counts = new Map();
            ensureString(value || '')
                .split(/?
/)
                .map(line => line.trim())
                .filter(Boolean)
                .forEach(line => counts.set(line, (counts.get(line) || 0) + 1));
            const duplicates = Array.from(counts.entries())
                .filter(([, count]) => count > 1)
                .map(([line, count]) => `${line} ×${count}`);
            return duplicates.length > 0 ? duplicates.join('
') : 'No duplicates detected.';
        }
    },
    {
        id: 'payload-split-into-chunks',
        name: 'Payload: Split into chunks',
        description: 'Split the payload into fixed-size chunks joined by a delimiter.',
        icon: 'columns',
        accent: '#34d399',
        tags: ['payload', 'formatting'],
        defaultConfig: { chunkSize: 280, delimiter: '
---
' },
        form: [
            { key: 'chunkSize', label: 'Chunk size', type: 'number', placeholder: '280' },
            { key: 'delimiter', label: 'Delimiter', type: 'text', placeholder: '\n---\n' }
        ],
        transform: (value, config) => {
            const text = ensureString(value || '');
            const chunkSize = Math.max(1, Number(config?.chunkSize) || 280);
            const delimiter = ensureString(config?.delimiter || '
---
');
            const chunks = [];
            for (let i = 0; i < text.length; i += chunkSize) {
                chunks.push(text.slice(i, i + chunkSize));
            }
            return chunks.join(delimiter);
        }
    },
    {
        id: 'payload-wrap-in-quotes',
        name: 'Payload: Wrap lines in quotes',
        description: 'Wrap each line in double quotes escaping existing quotes.',
        icon: 'quote',
        accent: '#facc15',
        tags: ['payload', 'formatting'],
        transform: (value) => ensureString(value || '')
            .split(/?
/)
            .map(line => line.trim())
            .filter(Boolean)
            .map(line => `"${line.replace(/"/g, '\"')}"`)
            .join('
')
    },
    {
        id: 'payload-keep-first-lines',
        name: 'Payload: Keep first lines',
        description: 'Keep only the first N non-empty lines.',
        icon: 'filter',
        accent: '#22c55e',
        tags: ['payload', 'filter'],
        defaultConfig: { count: 5 },
        form: [
            { key: 'count', label: 'Number of lines', type: 'number', placeholder: '5' }
        ],
        transform: (value, config) => {
            const count = Math.max(1, Number(config?.count) || 5);
            return ensureString(value || '')
                .split(/?
/)
                .map(line => line.trim())
                .filter(Boolean)
                .slice(0, count)
                .join('
');
        }
    },
    {
        id: 'payload-keep-last-lines',
        name: 'Payload: Keep last lines',
        description: 'Keep only the last N non-empty lines.',
        icon: 'filter',
        accent: '#3b82f6',
        tags: ['payload', 'filter'],
        defaultConfig: { count: 5 },
        form: [
            { key: 'count', label: 'Number of lines', type: 'number', placeholder: '5' }
        ],
        transform: (value, config) => {
            const count = Math.max(1, Number(config?.count) || 5);
            const lines = ensureString(value || '')
                .split(/?
/)
                .map(line => line.trim())
                .filter(Boolean);
            return lines.slice(-count).join('
');
        }
    }
];

DataTransformationScenarios.forEach(scenario => {
    AdditionalQuickActionModules.push({
        id: scenario.id,
        category: 'utility',
        name: scenario.name,
        description: scenario.description,
        icon: scenario.icon,
        accent: scenario.accent,
        inputs: [{ id: 'input', label: 'Input' }],
        outputs: [{ id: 'next', label: 'Next' }],
        defaultConfig: scenario.defaultConfig || {},
        form: scenario.form,
        tags: scenario.tags,
        run: async (context, config) => {
            const clone = QuickActionContext.clone(context);
            clone.payload = scenario.transform(clone.payload, config || {}, clone);
            clone.logs.push(scenario.successLog || `${scenario.name} applied.`);
            return [clone];
        }
    });
});

const QuickActionDefaultOrder = ['apps-library', 'files', 'commands', 'clipboard', 'settings'];

function ensureString(value) {
    if (typeof value === 'string') return value;
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') {
        try {
            return JSON.stringify(value);
        } catch (error) {
            return String(value);
        }
    }
    return String(value);
}

function ensureArray(value) {
    if (Array.isArray(value)) return value.slice();
    if (value === null || value === undefined) return [];
    if (typeof value === 'string') {
        return value
            .split(/\r?\n/)
            .map(entry => entry.trim())
            .filter(entry => entry.length > 0);
    }
    return [value];
}

function parseHeaderString(input = '') {
    const headers = {};
    ensureString(input)
        .split(/\r?\n/)
        .forEach(line => {
            const trimmed = line.trim();
            if (!trimmed) return;
            const [key, ...rest] = trimmed.split(':');
            if (!key) return;
            headers[key.trim()] = rest.join(':').trim();
        });
    return headers;
}

async function performAiTextRequest(clone, config = {}, overrides = {}) {
    const endpoint = ensureString(config.endpoint || overrides.defaultEndpoint || '').trim();
    if (!endpoint) {
        clone.logs.push(overrides.missingEndpointMessage || 'AI request skipped: endpoint is not configured.');
        return null;
    }

    const apiKey = ensureString(config.apiKey || '').trim();
    const payloadText = ensureString(clone.payload ?? '');
    const templatePrompt = ensureString(config.prompt || overrides.defaultPrompt || '');
    const finalPrompt = templatePrompt
        ? templatePrompt.replace(/\{\{payload\}\}/g, payloadText)
        : payloadText;

    if (!finalPrompt) {
        clone.logs.push(overrides.emptyPromptMessage || 'AI request skipped: no prompt or payload available.');
        return null;
    }

    const headers = {
        'Content-Type': 'application/json',
        ...parseHeaderString(config.headers || ''),
        ...(overrides.headers || {})
    };

    if (apiKey) {
        if (overrides.authHeader) {
            headers[overrides.authHeader] = overrides.authPrefix
                ? `${overrides.authPrefix}${apiKey}`
                : apiKey;
        } else if (!overrides.skipAuthorizationHeader) {
            headers.Authorization = `Bearer ${apiKey}`;
        }
    }

    const body = {
        model: ensureString(config.model || overrides.defaultModel || 'gpt-3.5-turbo'),
        max_tokens: Number(config.maxTokens || overrides.defaultMaxTokens || 256) || 256,
        temperature: Number(config.temperature ?? overrides.defaultTemperature ?? 0.7)
    };

    if (overrides.useMessages) {
        body.messages = [
            { role: 'system', content: overrides.systemPrompt || 'You are a helpful assistant.' },
            { role: 'user', content: finalPrompt }
        ];
    } else {
        body.prompt = finalPrompt;
    }

    if (overrides.promptField && body.prompt !== undefined) {
        body[overrides.promptField] = body.prompt;
        if (overrides.promptField !== 'prompt') {
            delete body.prompt;
        }
    }

    if (overrides.maxTokensField && body.max_tokens !== undefined) {
        body[overrides.maxTokensField] = body.max_tokens;
        if (overrides.maxTokensField !== 'max_tokens') {
            delete body.max_tokens;
        }
    }

    if (overrides.temperatureField && body.temperature !== undefined) {
        body[overrides.temperatureField] = body.temperature;
        if (overrides.temperatureField !== 'temperature') {
            delete body.temperature;
        }
    }

    if (overrides.omitModel) {
        delete body.model;
    }

    if (overrides.bodyExtras && typeof overrides.bodyExtras === 'object') {
        Object.assign(body, overrides.bodyExtras);
    }

    try {
        const response = await fetch(endpoint, {
            method: overrides.method || 'POST',
            headers,
            body: JSON.stringify(body)
        });

        const contentType = response.headers.get('content-type') || '';
        let data;
        if (contentType.includes('application/json')) {
            data = await response.json();
        } else {
            data = await response.text();
        }

        if (!response.ok) {
            const message = typeof data === 'string' ? data : JSON.stringify(data);
            throw new Error(message || `Request failed with status ${response.status}`);
        }

        let textOutput = '';
        if (typeof data === 'string') {
            textOutput = data;
        } else if (Array.isArray(data?.choices)) {
            const choice = data.choices[0];
            textOutput = ensureString(choice?.message?.content ?? choice?.text ?? '');
        } else if (overrides.fallbackField && data && typeof data === 'object') {
            textOutput = ensureString(data[overrides.fallbackField]);
        }

        if (!textOutput) {
            textOutput = ensureString(data);
        }

        return { text: textOutput, raw: data };
    } catch (error) {
        clone.logs.push(`${overrides.label || 'AI request'} failed: ${error.message}`);
        return null;
    }
}

async function performHttpAction(clone, config = {}, scenario = {}) {
    const endpoint = scenario.buildEndpoint
        ? ensureString(scenario.buildEndpoint(config, clone) || '').trim()
        : ensureString(config.endpoint || scenario.defaultEndpoint || '').trim();

    if (!endpoint) {
        clone.logs.push(scenario.missingEndpointMessage || 'API request skipped: endpoint missing.');
        return null;
    }

    const method = ensureString(config.method || scenario.defaultMethod || 'POST').toUpperCase();
    const headers = {
        ...(scenario.expectJson === false ? {} : { 'Content-Type': 'application/json' }),
        ...(scenario.defaultHeaders || {}),
        ...parseHeaderString(config.headers || '')
    };

    const apiKey = ensureString(config.apiKey || '').trim();
    if (apiKey) {
        if (scenario.skipAuthHeader) {
            // handled elsewhere
        } else if (scenario.queryAuthParam) {
            // handled later when constructing the URL
        } else if (scenario.authHeader) {
            headers[scenario.authHeader] = scenario.authPrefix
                ? `${scenario.authPrefix}${apiKey}`
                : apiKey;
        } else {
            headers.Authorization = scenario.authPrefix ? `${scenario.authPrefix}${apiKey}` : `Bearer ${apiKey}`;
        }
    }

    let bodyPayload = null;
    if (typeof scenario.buildBody === 'function') {
        bodyPayload = scenario.buildBody(config, clone);
    } else if (config.payload !== undefined) {
        bodyPayload = config.payload;
    } else if (clone.payload !== undefined) {
        bodyPayload = clone.payload;
    }

    const requestInit = { method, headers };
    let finalEndpoint = endpoint;
    const endpointIsAbsolute = /^https?:\/\//i.test(finalEndpoint);

    if (scenario.queryParamsBuilder) {
        const params = scenario.queryParamsBuilder(config, clone);
        if (params && typeof params === 'object') {
            const url = endpointIsAbsolute
                ? new URL(finalEndpoint)
                : new URL(finalEndpoint, 'https://placeholder.local');
            const search = new URLSearchParams(url.search);
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    search.set(key, String(value));
                }
            });
            url.search = search.toString();
            finalEndpoint = endpointIsAbsolute
                ? url.toString()
                : url.pathname + (url.search || '');
        }
    }

    if (apiKey && scenario.queryAuthParam) {
        const url = endpointIsAbsolute
            ? new URL(finalEndpoint)
            : new URL(finalEndpoint, 'https://placeholder.local');
        const search = new URLSearchParams(url.search);
        search.set(scenario.queryAuthParam, apiKey);
        url.search = search.toString();
        finalEndpoint = endpointIsAbsolute
            ? url.toString()
            : url.pathname + (url.search || '');
    }

    if (method !== 'GET') {
        if (scenario.expectJson === false) {
            requestInit.body = typeof bodyPayload === 'string'
                ? bodyPayload
                : JSON.stringify(bodyPayload ?? {});
        } else {
            let payloadData = bodyPayload;
            if (payloadData === undefined || payloadData === null) {
                payloadData = {};
            }
            if (typeof payloadData === 'string') {
                try {
                    JSON.parse(payloadData);
                    requestInit.body = payloadData;
                } catch (error) {
                    payloadData = { payload: payloadData };
                    requestInit.body = JSON.stringify(payloadData);
                }
            } else {
                requestInit.body = JSON.stringify(payloadData);
            }
        }
    } else if (bodyPayload && typeof bodyPayload === 'object') {
        const url = endpointIsAbsolute
            ? new URL(finalEndpoint)
            : new URL(finalEndpoint, 'https://placeholder.local');
        const search = new URLSearchParams(url.search);
        Object.entries(bodyPayload).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                search.set(key, String(value));
            }
        });
        url.search = search.toString();
        finalEndpoint = endpointIsAbsolute
            ? url.toString()
            : url.pathname + (url.search || '');
    }

    try {
        const response = await fetch(finalEndpoint, requestInit);
        const contentType = response.headers.get('content-type') || '';
        let data;
        if (scenario.responseType === 'text') {
            data = await response.text();
        } else if (scenario.responseType === 'json' || contentType.includes('application/json')) {
            data = await response.json();
        } else {
            data = await response.text();
        }

        if (!response.ok) {
            const message = typeof data === 'string' ? data : JSON.stringify(data);
            throw new Error(message || `Request failed with status ${response.status}`);
        }

        let payload = data;
        if (scenario.responsePath && data && typeof data === 'object') {
            payload = scenario.responsePath.split('.').reduce((acc, key) => {
                if (acc && typeof acc === 'object' && key in acc) {
                    return acc[key];
                }
                return null;
            }, data);
        }

        if (typeof scenario.transformResponse === 'function') {
            payload = scenario.transformResponse(payload, data);
        }

        if (scenario.storeRawKey) {
            clone.vars[scenario.storeRawKey] = data;
        }

        clone.logs.push(scenario.successLog || `${scenario.label || 'API action'} completed.`);
        return { data, payload };
    } catch (error) {
        clone.logs.push(`${scenario.label || 'API action'} failed: ${error.message}`);
        return null;
    }
}

const BaseQuickActionModuleDefinitions = [
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

const QuickActionModuleDefinitions = [
    ...BaseQuickActionModuleDefinitions,
    ...AdditionalQuickActionModules
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
    moduleSearchTermRaw: '',
    moduleSearchTerm: '',
    catalogSearchTermRaw: '',
    catalogSearchTerm: '',
    activeExplorerModule: null,
    boundExplorerKeyDown: null,

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
        this.moduleSearchTermRaw = '';
        this.moduleSearchTerm = '';
        this.catalogSearchTermRaw = '';
        this.catalogSearchTerm = '';
        this.activeExplorerModule = null;
        this.elements = {
            activeList: Utils.getElement('#quick-action-active-list'),
            catalog: Utils.getElement('#quick-action-catalog'),
            catalogSearch: Utils.getElement('#quick-action-catalog-search'),
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
            openBlockExplorer: Utils.getElement('#open-block-explorer'),
            blockExplorerModal: Utils.getElement('#block-explorer-modal'),
            blockExplorerList: Utils.getElement('#block-explorer-items'),
            blockExplorerPreview: Utils.getElement('#block-explorer-preview'),
            blockExplorerSearch: Utils.getElement('#block-explorer-search'),
            blockExplorerClose: Utils.getElement('#close-block-explorer'),
            blockExplorerBackdrop: Utils.getElement('#block-explorer-modal .block-explorer-backdrop')
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
        this.setModuleSearchTerm('', null);
        this.setCatalogSearchTerm('', null);
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

        this.elements.catalogSearch?.addEventListener('input', Utils.debounce((event) => {
            this.setCatalogSearchTerm(event.target.value, 'input');
        }, 120));

        this.elements.catalogSearch?.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                this.setCatalogSearchTerm('', 'input');
                event.target.blur();
            }
        });

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

        this.elements.moduleSearchInput?.addEventListener('input', (event) => {
            this.setModuleSearchTerm(event.target.value, 'builder');
        });

        this.elements.openBlockExplorer?.addEventListener('click', () => this.openBlockExplorer());
        this.elements.blockExplorerClose?.addEventListener('click', () => this.closeBlockExplorer());
        this.elements.blockExplorerBackdrop?.addEventListener('click', () => this.closeBlockExplorer());
        this.elements.blockExplorerSearch?.addEventListener('input', (event) => this.setModuleSearchTerm(event.target.value, 'explorer'));

        if (!this.boundExplorerKeyDown) {
            this.boundExplorerKeyDown = (event) => {
                if (event.key === 'Escape') {
                    this.closeBlockExplorer();
                }
            };
            document.addEventListener('keydown', this.boundExplorerKeyDown);
        }

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
        this.renderBlockExplorer();
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

        const items = QuickActionCatalog.filter(item => this.actionMatchesCatalogSearch(item, this.catalogSearchTerm));

        if (!items.length) {
            const empty = Utils.createElement('div', {
                className: 'quick-action-catalog-empty',
                text: this.catalogSearchTerm
                    ? 'No quick actions match this search yet.'
                    : 'No quick actions available at the moment.'
            });
            container.appendChild(empty);
            return;
        }

        items.forEach(item => {
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
            const query = this.moduleSearchTerm;
            let matchCount = 0;
            items.forEach(module => {
                if (query && !this.moduleMatchesSearch(module, query)) return;
                matchCount += 1;
                const item = Utils.createElement('li', { className: 'builder-module-item' });
                item.setAttribute('data-module-id', module.id);
                const title = Utils.createElement('strong', { text: this.getModuleName(module) });
                const description = Utils.createElement('span', { text: this.getModuleDescription(module) });
                item.appendChild(title);
                item.appendChild(description);
                item.addEventListener('click', () => this.addNode(module.id));
                container.appendChild(item);
            });
            if (matchCount === 0) {
                const empty = Utils.createElement('li', { className: 'builder-module-item empty' });
                empty.textContent = this.moduleSearchTerm
                    ? 'No blocks match your search yet.'
                    : 'No blocks available.';
                container.appendChild(empty);
            }
        });
    },

    setModuleSearchTerm(value = '', source = null) {
        const raw = ensureString(value);
        this.moduleSearchTermRaw = raw;
        this.moduleSearchTerm = raw.trim().toLowerCase();
        if (source !== 'builder' && this.elements.moduleSearchInput) {
            this.elements.moduleSearchInput.value = raw;
        }
        if (source !== 'explorer' && this.elements.blockExplorerSearch) {
            this.elements.blockExplorerSearch.value = raw;
        }
        this.renderModuleList();
        this.renderBlockExplorer();
    },

    setCatalogSearchTerm(value = '', source = null) {
        const raw = ensureString(value);
        this.catalogSearchTermRaw = raw;
        this.catalogSearchTerm = raw.trim().toLowerCase();
        if (source !== 'input' && this.elements.catalogSearch) {
            this.elements.catalogSearch.value = raw;
        }
        this.renderCatalog();
    },

    moduleMatchesSearch(module, query = '') {
        if (!query) return true;
        const lower = query.toLowerCase();
        const name = this.getModuleName(module).toLowerCase();
        const description = this.getModuleDescription(module).toLowerCase();
        const id = ensureString(module?.id || '').toLowerCase();
        const tags = (module?.tags || []).join(' ').toLowerCase();
        const category = ensureString(module?.category || '').toLowerCase();
        const keywords = this.getModuleKeywords(module).toLowerCase();
        return [name, description, id, tags, category, keywords].some(text => text.includes(lower));
    },

    actionMatchesCatalogSearch(item, query = '') {
        if (!query) return true;
        const lower = query.toLowerCase();
        const parts = [
            this.getActionTitle(item).toLowerCase(),
            this.getActionDescription(item).toLowerCase(),
            ensureString(item?.id || '').toLowerCase(),
            (item?.tags || []).join(' ').toLowerCase()
        ];
        return parts.some(text => text.includes(lower));
    },

    getModuleKeywords(module) {
        const parts = [];
        if (Array.isArray(module?.tags)) parts.push(...module.tags.map(tag => ensureString(tag)));
        if (module?.icon) parts.push(ensureString(module.icon));
        if (module?.defaultConfig && typeof module.defaultConfig === 'object') {
            parts.push(...Object.keys(module.defaultConfig).map(key => ensureString(key)));
        }
        return parts.join(' ');
    },

    openBlockExplorer() {
        if (!this.elements.blockExplorerModal) return;
        this.elements.blockExplorerModal.classList.add('active');
        this.elements.blockExplorerModal.setAttribute('aria-hidden', 'false');
        this.selectExplorerModule(this.activeExplorerModule || QuickActionModuleDefinitions[0]?.id || null);
        this.renderBlockExplorer();
        if (this.elements.blockExplorerSearch) {
            this.elements.blockExplorerSearch.focus();
        }
    },

    closeBlockExplorer() {
        if (!this.elements.blockExplorerModal) return;
        this.elements.blockExplorerModal.classList.remove('active');
        this.elements.blockExplorerModal.setAttribute('aria-hidden', 'true');
    },

    selectExplorerModule(moduleId) {
        if (moduleId) {
            this.activeExplorerModule = moduleId;
        }
        this.renderBlockExplorer();
    },

    renderBlockExplorer() {
        const listEl = this.elements.blockExplorerList;
        const previewEl = this.elements.blockExplorerPreview;
        if (!listEl || !previewEl) return;

        const query = this.moduleSearchTerm;
        listEl.innerHTML = '';

        const modules = QuickActionModuleDefinitions.filter(module => this.moduleMatchesSearch(module, query));

        if (!modules.length) {
            const empty = Utils.createElement('li', { className: 'block-explorer-item empty' });
            empty.textContent = this.moduleSearchTerm
                ? 'No blocks found for this search.'
                : 'Block explorer is loading new modules.';
            listEl.appendChild(empty);
        } else {
            modules.forEach(module => {
                const li = Utils.createElement('li', { className: 'block-explorer-item' });
                const button = document.createElement('button');
                button.setAttribute('type', 'button');
                button.setAttribute('data-module-id', module.id);
                if (module.id === this.activeExplorerModule) {
                    button.setAttribute('aria-current', 'true');
                }
                button.appendChild(Utils.createElement('strong', { text: this.getModuleName(module) }));
                button.appendChild(Utils.createElement('span', { text: this.getModuleDescription(module) }));
                button.addEventListener('click', () => this.selectExplorerModule(module.id));
                li.appendChild(button);
                listEl.appendChild(li);
            });
        }

        if (!this.activeExplorerModule || !modules.some(module => module.id === this.activeExplorerModule)) {
            this.activeExplorerModule = modules[0]?.id || null;
        }

        previewEl.innerHTML = '';

        if (!this.activeExplorerModule) {
            previewEl.appendChild(Utils.createElement('p', { text: 'Select a block to see its details.' }));
            return;
        }

        const module = QuickActionModuleMap.get(this.activeExplorerModule) || QuickActionModuleDefinitions.find(item => item.id === this.activeExplorerModule);
        if (!module) {
            previewEl.appendChild(Utils.createElement('p', { text: 'Block definition missing or unavailable.' }));
            return;
        }

        const title = Utils.createElement('h3', { text: this.getModuleName(module) });
        previewEl.appendChild(title);
        previewEl.appendChild(Utils.createElement('p', { text: this.getModuleDescription(module) }));

        const meta = Utils.createElement('div', { className: 'block-explorer-meta' });
        if (module.category) meta.appendChild(Utils.createElement('span', { text: `Category: ${module.category}` }));
        if (module.icon) meta.appendChild(Utils.createElement('span', { text: `Icon: ${module.icon}` }));
        meta.appendChild(Utils.createElement('span', { text: `Inputs: ${(module.inputs || []).length}` }));
        meta.appendChild(Utils.createElement('span', { text: `Outputs: ${(module.outputs || []).length}` }));
        previewEl.appendChild(meta);

        if (Array.isArray(module.tags) && module.tags.length) {
            const tagWrap = Utils.createElement('div', { className: 'block-explorer-tags' });
            module.tags.forEach(tag => tagWrap.appendChild(Utils.createElement('span', { text: tag })));
            previewEl.appendChild(tagWrap);
        }

        if (module.defaultConfig && typeof module.defaultConfig === 'object') {
            const table = document.createElement('table');
            const tbody = document.createElement('tbody');
            Object.entries(module.defaultConfig).forEach(([key, value]) => {
                const row = document.createElement('tr');
                const keyCell = document.createElement('th');
                keyCell.textContent = key;
                const valueCell = document.createElement('td');
                valueCell.textContent = typeof value === 'object' ? JSON.stringify(value) : String(value);
                row.appendChild(keyCell);
                row.appendChild(valueCell);
                tbody.appendChild(row);
            });
            table.appendChild(tbody);
            previewEl.appendChild(table);
        }

        const actions = Utils.createElement('div', { className: 'block-explorer-preview-actions' });
        const addButton = Utils.createElement('button', { text: 'Add block to canvas' });
        addButton.addEventListener('click', () => {
            this.addNode(module.id);
            this.closeBlockExplorer();
        });
        const selectButton = Utils.createElement('button', { text: 'Focus in library' });
        selectButton.addEventListener('click', () => {
            const item = this.elements.moduleSearchInput;
            if (item) item.focus();
            this.closeBlockExplorer();
        });
        actions.appendChild(addButton);
        actions.appendChild(selectButton);
        previewEl.appendChild(actions);
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
