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
    'addon-builder': 'subscription_feature_addon_builder',
    'extended-gallery': 'subscription_feature_gallery',
    'priority-support': 'subscription_feature_support',
    default: 'subscription_feature_default'
};

const QuickActionLibrary = [
    {
        id: 'apps-library',
        kind: 'panel',
        icon: 'grid',
        accentColor: '#6c63ff',
        labelKey: 'quick_action_apps_title',
        descriptionKey: 'quick_action_apps_description',
        defaultEnabled: true,
        handler: { type: 'panel', target: 'apps-library' },
        tags: ['navigation', 'panel', 'system']
    },
    {
        id: 'files',
        kind: 'panel',
        icon: 'folder',
        accentColor: '#44b4ff',
        labelKey: 'quick_action_files_title',
        descriptionKey: 'quick_action_files_description',
        defaultEnabled: true,
        handler: { type: 'panel', target: 'files' },
        tags: ['productivity', 'panel', 'system']
    },
    {
        id: 'commands',
        kind: 'panel',
        icon: 'command',
        accentColor: '#ff8a65',
        labelKey: 'quick_action_commands_title',
        descriptionKey: 'quick_action_commands_description',
        defaultEnabled: true,
        handler: { type: 'panel', target: 'commands' },
        tags: ['automation', 'panel', 'system']
    },
    {
        id: 'clipboard',
        kind: 'panel',
        icon: 'copy',
        accentColor: '#61d6ad',
        labelKey: 'quick_action_clipboard_title',
        descriptionKey: 'quick_action_clipboard_description',
        defaultEnabled: true,
        handler: { type: 'panel', target: 'clipboard' },
        tags: ['writing', 'panel', 'system']
    },
    {
        id: 'focus-mode',
        kind: 'command',
        icon: 'moon',
        accentColor: '#8b5cf6',
        labelKey: 'quick_action_focus_title',
        descriptionKey: 'quick_action_focus_description',
        defaultEnabled: false,
        handler: { type: 'command', command: 'toggle-focus' },
        tags: ['automation', 'desktop']
    },
    {
        id: 'quick-notes',
        kind: 'panel',
        icon: 'file-text',
        accentColor: '#f6c344',
        labelKey: 'quick_action_notes_title',
        descriptionKey: 'quick_action_notes_description',
        defaultEnabled: false,
        handler: { type: 'panel', target: 'notes' },
        tags: ['writing', 'panel']
    },
    {
        id: 'quick-app-studio',
        kind: 'view',
        icon: 'cpu',
        accentColor: '#00d4ff',
        labelKey: 'quick_action_studio_title',
        descriptionKey: 'quick_action_studio_description',
        defaultEnabled: true,
        handler: { type: 'view', target: 'quick-app-builder' },
        badgeKey: 'quick_action_badge_new',
        tags: ['builder', 'automation']
    },
    {
        id: 'settings',
        kind: 'view',
        icon: 'settings',
        accentColor: '#f06292',
        labelKey: 'quick_action_settings_title',
        descriptionKey: 'quick_action_settings_description',
        defaultEnabled: true,
        handler: { type: 'view', target: 'settings' },
        tags: ['system']
    }
];

const QuickActionBlueprints = [
    {
        id: 'blueprint-lead-capture',
        icon: 'zap',
        accentColor: '#ff6584',
        nameKey: 'quick_blueprint_lead_name',
        descriptionKey: 'quick_blueprint_lead_description',
        difficulty: 'intermediate',
        estimatedTime: 6,
        workflow: {
            trigger: { module: 'trigger-google-sheets', config: { pollInterval: 900 } },
            nodes: [
                { id: 'format-message', module: 'action-format-text', position: { x: 340, y: 160 } },
                { id: 'route-priority', module: 'logic-branch', position: { x: 620, y: 160 }, config: { conditions: [{ field: 'budget', operator: '>=', value: 1500 }] } },
                { id: 'notify-slack', module: 'integration-slack', position: { x: 900, y: 60 }, config: { channel: '#sales' } },
                { id: 'notify-email', module: 'integration-email', position: { x: 900, y: 260 }, config: { template: 'lead-nurture' } }
            ],
            connections: [
                { source: { node: 'trigger', port: 'out' }, target: { node: 'format-message', port: 'in' } },
                { source: { node: 'format-message', port: 'success' }, target: { node: 'route-priority', port: 'in' } },
                { source: { node: 'route-priority', port: 'branch-0' }, target: { node: 'notify-slack', port: 'in' } },
                { source: { node: 'route-priority', port: 'fallback' }, target: { node: 'notify-email', port: 'in' } }
            ]
        }
    },
    {
        id: 'blueprint-daily-briefing',
        icon: 'sunrise',
        accentColor: '#ffcf70',
        nameKey: 'quick_blueprint_briefing_name',
        descriptionKey: 'quick_blueprint_briefing_description',
        difficulty: 'beginner',
        estimatedTime: 4,
        workflow: {
            trigger: { module: 'trigger-schedule', config: { cron: '0 8 * * *' } },
            nodes: [
                { id: 'fetch-weather', module: 'integration-weather', position: { x: 360, y: 120 } },
                { id: 'fetch-tasks', module: 'integration-task-manager', position: { x: 360, y: 260 } },
                { id: 'compose-brief', module: 'action-combine-text', position: { x: 640, y: 180 } },
                { id: 'send-brief', module: 'integration-email', position: { x: 920, y: 180 }, config: { subject: 'Daily briefing', recipients: ['me@company.com'] } }
            ],
            connections: [
                { source: { node: 'trigger', port: 'out' }, target: { node: 'fetch-weather', port: 'in' } },
                { source: { node: 'trigger', port: 'out' }, target: { node: 'fetch-tasks', port: 'in' } },
                { source: { node: 'fetch-weather', port: 'success' }, target: { node: 'compose-brief', port: 'slot-1' } },
                { source: { node: 'fetch-tasks', port: 'success' }, target: { node: 'compose-brief', port: 'slot-2' } },
                { source: { node: 'compose-brief', port: 'success' }, target: { node: 'send-brief', port: 'in' } }
            ]
        }
    },
    {
        id: 'blueprint-content-calendar',
        icon: 'calendar',
        accentColor: '#4fd1c5',
        nameKey: 'quick_blueprint_calendar_name',
        descriptionKey: 'quick_blueprint_calendar_description',
        difficulty: 'advanced',
        estimatedTime: 9,
        workflow: {
            trigger: { module: 'trigger-manual', config: {} },
            nodes: [
                { id: 'gather-ideas', module: 'integration-notion', position: { x: 360, y: 80 } },
                { id: 'score-ideas', module: 'logic-score', position: { x: 640, y: 80 } },
                { id: 'choose-format', module: 'logic-branch', position: { x: 920, y: 80 }, config: { conditions: [{ field: 'score', operator: '>=', value: 75 }] } },
                { id: 'schedule-post', module: 'integration-social', position: { x: 1200, y: 40 }, config: { platform: 'twitter' } },
                { id: 'queue-newsletter', module: 'integration-email', position: { x: 1200, y: 200 }, config: { list: 'newsletter' } }
            ],
            connections: [
                { source: { node: 'trigger', port: 'out' }, target: { node: 'gather-ideas', port: 'in' } },
                { source: { node: 'gather-ideas', port: 'success' }, target: { node: 'score-ideas', port: 'in' } },
                { source: { node: 'score-ideas', port: 'success' }, target: { node: 'choose-format', port: 'in' } },
                { source: { node: 'choose-format', port: 'branch-0' }, target: { node: 'schedule-post', port: 'in' } },
                { source: { node: 'choose-format', port: 'fallback' }, target: { node: 'queue-newsletter', port: 'in' } }
            ]
        }
    }
];

const QuickAppModuleCatalog = {
    triggers: [
        {
            id: 'trigger-manual',
            icon: 'play-circle',
            labelKey: 'quick_module_trigger_manual',
            descriptionKey: 'quick_module_trigger_manual_description',
            category: 'core',
            ports: { outputs: ['out'] },
            defaultConfig: {}
        },
        {
            id: 'trigger-schedule',
            icon: 'clock',
            labelKey: 'quick_module_trigger_schedule',
            descriptionKey: 'quick_module_trigger_schedule_description',
            category: 'time',
            ports: { outputs: ['out'] },
            defaultConfig: { cron: '0 9 * * 1-5' }
        },
        {
            id: 'trigger-google-sheets',
            icon: 'grid',
            labelKey: 'quick_module_trigger_sheets',
            descriptionKey: 'quick_module_trigger_sheets_description',
            category: 'data',
            ports: { outputs: ['out'] },
            defaultConfig: { pollInterval: 600 }
        },
        {
            id: 'trigger-webhook',
            icon: 'globe',
            labelKey: 'quick_module_trigger_webhook',
            descriptionKey: 'quick_module_trigger_webhook_description',
            category: 'integrations',
            ports: { outputs: ['out'] },
            defaultConfig: { method: 'POST', endpoint: '/flashsearch/hook' }
        }
    ],
    actions: [
        {
            id: 'action-format-text',
            icon: 'type',
            labelKey: 'quick_module_action_format',
            descriptionKey: 'quick_module_action_format_description',
            category: 'text',
            ports: { inputs: ['in'], outputs: ['success'] },
            defaultConfig: { template: 'Hello {{name}}' }
        },
        {
            id: 'action-combine-text',
            icon: 'layers',
            labelKey: 'quick_module_action_combine',
            descriptionKey: 'quick_module_action_combine_description',
            category: 'text',
            ports: { inputs: ['slot-1', 'slot-2', 'slot-3'], outputs: ['success'] },
            defaultConfig: { joiner: '\n\n' }
        },
        {
            id: 'action-extract-entities',
            icon: 'target',
            labelKey: 'quick_module_action_extract',
            descriptionKey: 'quick_module_action_extract_description',
            category: 'ai',
            ports: { inputs: ['in'], outputs: ['success', 'fallback'] },
            defaultConfig: { entities: ['company', 'budget'] }
        }
    ],
    logic: [
        {
            id: 'logic-branch',
            icon: 'git-branch',
            labelKey: 'quick_module_logic_branch',
            descriptionKey: 'quick_module_logic_branch_description',
            category: 'logic',
            ports: { inputs: ['in'], outputs: ['branch-0', 'branch-1', 'fallback'] },
            defaultConfig: { conditions: [] }
        },
        {
            id: 'logic-score',
            icon: 'activity',
            labelKey: 'quick_module_logic_score',
            descriptionKey: 'quick_module_logic_score_description',
            category: 'logic',
            ports: { inputs: ['in'], outputs: ['success'] },
            defaultConfig: { rules: [] }
        },
        {
            id: 'logic-delay',
            icon: 'clock',
            labelKey: 'quick_module_logic_delay',
            descriptionKey: 'quick_module_logic_delay_description',
            category: 'time',
            ports: { inputs: ['in'], outputs: ['success'] },
            defaultConfig: { duration: 5, unit: 'minutes' }
        }
    ],
    integrations: [
        {
            id: 'integration-slack',
            icon: 'slack',
            labelKey: 'quick_module_integration_slack',
            descriptionKey: 'quick_module_integration_slack_description',
            category: 'communication',
            ports: { inputs: ['in'], outputs: ['success', 'error'] },
            defaultConfig: { channel: '#general' }
        },
        {
            id: 'integration-email',
            icon: 'send',
            labelKey: 'quick_module_integration_email',
            descriptionKey: 'quick_module_integration_email_description',
            category: 'communication',
            ports: { inputs: ['in'], outputs: ['success', 'error'] },
            defaultConfig: { recipients: [], subject: '', template: '' }
        },
        {
            id: 'integration-task-manager',
            icon: 'check-square',
            labelKey: 'quick_module_integration_tasks',
            descriptionKey: 'quick_module_integration_tasks_description',
            category: 'productivity',
            ports: { inputs: ['in'], outputs: ['success'] },
            defaultConfig: { project: 'Inbox' }
        },
        {
            id: 'integration-weather',
            icon: 'cloud-rain',
            labelKey: 'quick_module_integration_weather',
            descriptionKey: 'quick_module_integration_weather_description',
            category: 'data',
            ports: { inputs: ['in'], outputs: ['success'] },
            defaultConfig: { city: 'San Francisco' }
        },
        {
            id: 'integration-social',
            icon: 'share-2',
            labelKey: 'quick_module_integration_social',
            descriptionKey: 'quick_module_integration_social_description',
            category: 'marketing',
            ports: { inputs: ['in'], outputs: ['success', 'error'] },
            defaultConfig: { platform: 'twitter', queue: 'default' }
        },
        {
            id: 'integration-notion',
            icon: 'book-open',
            labelKey: 'quick_module_integration_notion',
            descriptionKey: 'quick_module_integration_notion_description',
            category: 'knowledge',
            ports: { inputs: ['in'], outputs: ['success'] },
            defaultConfig: { database: 'Content ideas' }
        }
    ]
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
            SettingsModule.renderQuickActionBridge();
        }
    }
};

// =================================================================================
// === Quick Action State & Registry ===
// =================================================================================

const QuickActionState = {
    listeners: new Set(),

    ensureDefaults: function() {
        if (!Array.isArray(AppState.settings.activeAddons) || AppState.settings.activeAddons.length === 0) {
            const defaults = QuickActionLibrary.filter(action => action.defaultEnabled).map(action => action.id);
            this.setActiveList(defaults, { silent: false });
        }
        if (!Array.isArray(AppState.settings.customAddons)) {
            AppState.settings.customAddons = [];
            ipcRenderer.send('update-setting', 'customAddons', []);
        }
    },

    subscribe: function(callback) {
        if (typeof callback === 'function') {
            this.listeners.add(callback);
        }
        return () => this.listeners.delete(callback);
    },

    notify: function(reason = 'state') {
        this.listeners.forEach(listener => {
            try { listener(reason); } catch (error) { console.error('QuickActionState listener failed', error); }
        });
    },

    getActiveList: function() {
        const raw = Array.isArray(AppState.settings.activeAddons) ? [...AppState.settings.activeAddons] : [];
        return Array.from(new Set(raw.filter(Boolean)));
    },

    getDefaultActiveList: function() {
        return QuickActionLibrary.filter(action => action.defaultEnabled).map(action => action.id);
    },

    setActiveList: function(list, options = {}) {
        const normalized = Array.from(new Set((Array.isArray(list) ? list : []).filter(Boolean)));
        AppState.settings.activeAddons = normalized;
        if (!options.silent) {
            ipcRenderer.send('update-setting', 'activeAddons', normalized);
        }
        this.notify('active');
    },

    addToActive: function(actionId, options = {}) {
        const current = this.getActiveList();
        if (!current.includes(actionId)) {
            current.push(actionId);
            this.setActiveList(current, options);
        }
    },

    removeFromActive: function(actionId, options = {}) {
        const current = this.getActiveList().filter(id => id !== actionId);
        this.setActiveList(current, options);
    },

    moveActive: function(actionId, newIndex, options = {}) {
        const current = this.getActiveList();
        const oldIndex = current.indexOf(actionId);
        if (oldIndex === -1) return;
        current.splice(oldIndex, 1);
        current.splice(Math.max(0, Math.min(newIndex, current.length)), 0, actionId);
        this.setActiveList(current, options);
    },

    getCustomActions: function() {
        const custom = Array.isArray(AppState.settings.customAddons) ? AppState.settings.customAddons : [];
        return custom.map(action => ({ ...action }));
    },

    setCustomActions: function(list, options = {}) {
        const normalized = Array.isArray(list) ? list.map(item => ({ ...item })) : [];
        AppState.settings.customAddons = normalized;
        if (!options.silent) {
            ipcRenderer.send('update-setting', 'customAddons', normalized);
        }
        this.notify('custom');
    },

    addCustomAction: function(action, options = {}) {
        if (!action || typeof action !== 'object') return null;
        const custom = this.getCustomActions();
        const id = action.id || `quick-app-${Date.now()}`;
        const payload = {
            id,
            name: action.name || LocalizationRenderer.t('quick_app_default_name'),
            description: action.description || LocalizationRenderer.t('quick_app_default_description'),
            icon: action.icon || 'cpu',
            accentColor: action.accentColor || '#6366f1',
            workflow: action.workflow || null,
            handler: { type: 'workflow' }
        };
        custom.push(payload);
        this.setCustomActions(custom, options);
        this.addToActive(id, options);
        return id;
    },

    deleteCustomAction: function(actionId, options = {}) {
        const custom = this.getCustomActions().filter(action => action.id !== actionId);
        this.setCustomActions(custom, options);
        this.removeFromActive(actionId, options);
    },

    getAllDefinitions: function() {
        const library = QuickActionLibrary.map(action => ({ ...action, type: 'library' }));
        const custom = this.getCustomActions().map(action => ({ ...action, type: 'custom', handler: action.handler || { type: 'workflow' } }));
        return [...library, ...custom];
    },

    getDefinition: function(actionId) {
        if (!actionId) return null;
        const libraryMatch = QuickActionLibrary.find(action => action.id === actionId);
        if (libraryMatch) return { ...libraryMatch, type: 'library' };
        const customMatch = this.getCustomActions().find(action => action.id === actionId);
        if (customMatch) return { ...customMatch, type: 'custom', handler: customMatch.handler || { type: 'workflow' } };
        return null;
    },

    getBlueprint: function(blueprintId) {
        return QuickActionBlueprints.find(item => item.id === blueprintId) || null;
    }
};

const ToastManager = {
    element: null,
    hideTimeout: null,

    ensureElement: function() {
        if (!this.element) {
            this.element = document.createElement('div');
            this.element.className = 'builder-toast';
            document.body.appendChild(this.element);
        }
    },

    show: function(message, options = {}) {
        this.ensureElement();
        if (!this.element) return;
        this.element.textContent = message;
        this.element.classList.add('visible');
        clearTimeout(this.hideTimeout);
        const duration = options.duration || 3200;
        this.hideTimeout = setTimeout(() => this.hide(), duration);
    },

    hide: function() {
        if (!this.element) return;
        this.element.classList.remove('visible');
    }
};

const QuickActionRegistry = {
    execute: function(actionId, context = {}) {
        const action = QuickActionState.getDefinition(actionId);
        if (!action) {
            ToastManager.show(LocalizationRenderer.t('quick_action_missing'));
            return;
        }
        const handler = action.handler || { type: 'panel', target: actionId };
        const runtimeContext = {
            togglePanel: (panel) => AuxPanelManager.togglePanel(panel),
            switchView: (view) => ViewManager.switchView(view),
            showManager: () => QuickActionManagerUI.open(),
            showToast: (message, options) => ToastManager.show(message, options),
            runWorkflow: (definition, options) => WorkflowRuntime.execute(definition, options),
            sendCommand: (command) => ipcRenderer.send('execute-quick-action-command', { id: actionId, command })
        };
        Object.assign(runtimeContext, context || {});

        try {
            switch (handler.type) {
                case 'panel':
                    runtimeContext.togglePanel(handler.target || actionId);
                    break;
                case 'view':
                    runtimeContext.switchView(handler.target || 'search');
                    break;
                case 'command':
                    runtimeContext.sendCommand(handler.command || actionId);
                    runtimeContext.showToast(LocalizationRenderer.t('quick_action_command_sent', handler.command || actionId));
                    break;
                case 'workflow':
                    runtimeContext.runWorkflow(action, { source: 'quick-action', onComplete: () => runtimeContext.showToast(LocalizationRenderer.t('quick_action_workflow_done', action.name || LocalizationRenderer.t(action.labelKey))) });
                    break;
                case 'manager':
                    runtimeContext.showManager();
                    break;
                default:
                    runtimeContext.togglePanel(handler.target || actionId);
            }
        } catch (error) {
            console.error('Failed to execute quick action', actionId, error);
            runtimeContext.showToast(LocalizationRenderer.t('quick_action_execution_error'));
        }
    }
};

const QuickActionBar = {
    container: null,
    managerButton: null,
    unsubscribe: null,

    init: function() {
        this.container = Utils.getElement('#quick-action-buttons');
        if (!this.container) return;
        this.render();
        this.unsubscribe = QuickActionState.subscribe(() => this.render());
    },

    dispose: function() {
        if (typeof this.unsubscribe === 'function') this.unsubscribe();
    },

    render: function() {
        if (!this.container) return;
        this.container.innerHTML = '';
        const active = QuickActionState.getActiveList();
        if (active.length === 0) {
            const empty = Utils.createElement('button', { className: 'quick-action-manager-trigger' });
            empty.innerHTML = `<i data-feather="plus"></i>`;
            empty.addEventListener('click', () => QuickActionManagerUI.open());
            this.container.appendChild(empty);
            if (window.feather) feather.replace();
            return;
        }

        active.forEach(actionId => {
            const definition = QuickActionState.getDefinition(actionId);
            if (!definition) return;
            const button = this.createButton(definition);
            this.container.appendChild(button);
        });

        this.managerButton = Utils.createElement('button', { className: 'quick-action-manager-trigger', text: '' });
        this.managerButton.innerHTML = `<i data-feather="plus"></i>`;
        this.managerButton.title = LocalizationRenderer.t('quick_action_add_button');
        this.managerButton.addEventListener('click', () => QuickActionManagerUI.open());
        this.container.appendChild(this.managerButton);

        if (window.feather) feather.replace();
    },

    createButton: function(action) {
        const label = action.name ? action.name : LocalizationRenderer.t(action.labelKey);
        const button = Utils.createElement('button', { className: 'quick-action-button', text: '' });
        button.setAttribute('data-action-id', action.id);
        button.innerHTML = `
            <i data-feather="${action.icon || 'zap'}" class="icon"></i>
            <span class="quick-action-label">${label}</span>
        `;
        if (action.badgeKey) {
            const pill = Utils.createElement('span', { className: 'quick-action-pill', text: LocalizationRenderer.t(action.badgeKey) });
            button.appendChild(pill);
        }
        if (action.accentColor) {
            button.style.setProperty('--quick-action-accent', action.accentColor);
        }
        button.addEventListener('click', () => QuickActionRegistry.execute(action.id));
        return button;
    }
};

const QuickActionManagerUI = {
    dialog: null,
    overlay: null,
    activeListEl: null,
    availableListEl: null,
    detailEl: null,
    statusEl: null,
    applyButton: null,
    cancelButton: null,
    selectedId: null,
    draftActiveList: [],
    dragSource: null,

    init: function() {
        this.overlay = Utils.getElement('#quick-action-manager');
        if (!this.overlay) return;
        this.dialog = this.overlay.querySelector('.quick-action-manager-dialog');
        this.activeListEl = Utils.getElement('#quick-action-active-list');
        this.availableListEl = Utils.getElement('#quick-action-available-list');
        this.detailEl = Utils.getElement('#quick-action-detail');
        this.statusEl = Utils.getElement('#quick-action-manager-status');
        this.applyButton = Utils.getElement('#quick-action-manager-apply');
        this.cancelButton = Utils.getElement('#quick-action-manager-cancel');

        Utils.getElement('#quick-action-manager-close')?.addEventListener('click', () => this.close());
        this.overlay.addEventListener('click', (event) => {
            if (event.target === this.overlay) this.close();
        });
        this.cancelButton?.addEventListener('click', () => this.close());
        this.applyButton?.addEventListener('click', () => this.applyChanges());
        Utils.getElement('#quick-action-reset-defaults')?.addEventListener('click', () => this.resetToDefaults());
        Utils.getElement('#quick-action-import')?.addEventListener('click', () => this.showComingSoon());
        Utils.getElement('#quick-action-export')?.addEventListener('click', () => this.exportSelection());
        Utils.getElement('#quick-action-create')?.addEventListener('click', () => this.createNewQuickApp());

        const openButtons = [
            Utils.getElement('#open-quick-action-manager'),
            Utils.getElement('#quick-action-manager-button')
        ].filter(Boolean);
        openButtons.forEach(button => button.addEventListener('click', () => this.open()));

        QuickActionState.subscribe(() => {
            if (!this.isOpen()) return;
            this.render();
        });
    },

    isOpen: function() {
        return this.overlay && !this.overlay.classList.contains('hidden');
    },

    open: function() {
        if (!this.overlay) return;
        this.draftActiveList = QuickActionState.getActiveList();
        this.selectedId = this.draftActiveList[0] || QuickActionLibrary[0]?.id || null;
        this.overlay.classList.remove('hidden');
        this.render();
        if (window.feather) feather.replace();
    },

    close: function() {
        if (!this.overlay) return;
        this.overlay.classList.add('hidden');
        this.statusEl?.setAttribute('data-i18n', 'quick_action_manager_status_ready');
        if (this.statusEl) this.statusEl.textContent = LocalizationRenderer.t('quick_action_manager_status_ready');
    },

    render: function() {
        this.renderActiveList();
        this.renderAvailableList();
        this.renderDetail();
        if (window.feather) feather.replace();
    },

    renderActiveList: function() {
        if (!this.activeListEl) return;
        this.activeListEl.innerHTML = '';
        if (this.draftActiveList.length === 0) {
            const empty = Utils.createElement('li', { className: 'addons-empty', text: LocalizationRenderer.t('quick_action_manager_empty') });
            this.activeListEl.appendChild(empty);
            return;
        }

        this.draftActiveList.forEach(actionId => {
            const definition = QuickActionState.getDefinition(actionId);
            if (!definition) return;
            const item = Utils.createElement('li', { className: 'quick-action-list-item' });
            item.setAttribute('data-action-id', actionId);
            item.draggable = true;

            const meta = Utils.createElement('div', { className: 'item-meta' });
            meta.innerHTML = `<i data-feather="${definition.icon || 'zap'}" class="icon"></i>`;
            const text = Utils.createElement('div');
            const title = Utils.createElement('div', { className: 'item-title', text: definition.name || LocalizationRenderer.t(definition.labelKey) });
            const subtitle = Utils.createElement('div', { className: 'item-subtitle', text: LocalizationRenderer.t(definition.descriptionKey || 'quick_action_no_description') });
            text.appendChild(title);
            text.appendChild(subtitle);
            meta.appendChild(text);
            item.appendChild(meta);

            const remove = Utils.createElement('button', { className: 'quick-action-remove' });
            remove.innerHTML = '<i data-feather="minus"></i>';
            remove.addEventListener('click', () => {
                this.draftActiveList = this.draftActiveList.filter(id => id !== actionId);
                this.render();
            });
            item.appendChild(remove);

            item.addEventListener('click', () => {
                this.selectedId = actionId;
                this.renderDetail();
            });

            item.addEventListener('dragstart', (event) => {
                this.dragSource = actionId;
                event.dataTransfer.effectAllowed = 'move';
                event.dataTransfer.setData('text/plain', actionId);
            });
            item.addEventListener('dragover', (event) => {
                event.preventDefault();
                item.classList.add('drag-over');
            });
            item.addEventListener('dragleave', () => item.classList.remove('drag-over'));
            item.addEventListener('drop', (event) => {
                event.preventDefault();
                item.classList.remove('drag-over');
                const sourceId = this.dragSource || event.dataTransfer.getData('text/plain');
                const targetId = actionId;
                if (!sourceId || !targetId || sourceId === targetId) return;
                const sourceIndex = this.draftActiveList.indexOf(sourceId);
                const targetIndex = this.draftActiveList.indexOf(targetId);
                if (sourceIndex === -1 || targetIndex === -1) return;
                this.draftActiveList.splice(sourceIndex, 1);
                this.draftActiveList.splice(targetIndex, 0, sourceId);
                this.renderActiveList();
            });

            this.activeListEl.appendChild(item);
        });
    },

    renderAvailableList: function() {
        if (!this.availableListEl) return;
        this.availableListEl.innerHTML = '';
        const activeSet = new Set(this.draftActiveList);
        const definitions = QuickActionState.getAllDefinitions();

        definitions.forEach(definition => {
            const card = Utils.createElement('div', { className: 'available-card' });
            const header = Utils.createElement('div', { className: 'available-card-header' });
            header.innerHTML = `
                <div class="available-card-title">
                    <strong>${definition.name || LocalizationRenderer.t(definition.labelKey)}</strong>
                    <div class="available-card-tags">${(definition.tags || []).map(tag => `#${tag}`).join(' ')}</div>
                </div>
            `;
            const toggle = Utils.createElement('label', { className: 'toggle' });
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = activeSet.has(definition.id);
            checkbox.addEventListener('change', () => {
                if (checkbox.checked) {
                    this.draftActiveList.push(definition.id);
                } else {
                    this.draftActiveList = this.draftActiveList.filter(id => id !== definition.id);
                }
                this.render();
            });
            toggle.appendChild(checkbox);
            toggle.appendChild(Utils.createElement('span', { text: LocalizationRenderer.t('quick_action_toggle_label') }));
            header.appendChild(toggle);
            card.appendChild(header);

            const description = Utils.createElement('p', { text: LocalizationRenderer.t(definition.descriptionKey || 'quick_action_no_description') });
            card.appendChild(description);

            if (definition.type === 'custom') {
                const footer = Utils.createElement('div', { className: 'manager-column-footer' });
                const deleteBtn = Utils.createElement('button', { className: 'builder-pill-button danger', text: LocalizationRenderer.t('quick_action_delete_custom') });
                deleteBtn.addEventListener('click', () => {
                    if (window.confirm(LocalizationRenderer.t('quick_action_delete_confirm'))) {
                        QuickActionState.deleteCustomAction(definition.id);
                        this.draftActiveList = this.draftActiveList.filter(id => id !== definition.id);
                        this.render();
                    }
                });
                footer.appendChild(deleteBtn);
                card.appendChild(footer);
            }

            card.addEventListener('click', () => {
                this.selectedId = definition.id;
                this.renderDetail();
            });

            this.availableListEl.appendChild(card);
        });
    },

    renderDetail: function() {
        if (!this.detailEl) return;
        const definition = QuickActionState.getDefinition(this.selectedId) || QuickActionLibrary[0];
        if (!definition) {
            this.detailEl.innerHTML = `<p>${LocalizationRenderer.t('quick_action_no_selection')}</p>`;
            return;
        }

        const label = definition.name || LocalizationRenderer.t(definition.labelKey);
        const description = LocalizationRenderer.t(definition.descriptionKey || 'quick_action_no_description');
        const handlerType = definition.handler?.type || 'panel';
        const tags = (definition.tags || []).map(tag => `#${tag}`).join(' ');

        this.detailEl.innerHTML = `
            <div class="detail-heading">
                <h5>${label}</h5>
                <p>${description}</p>
            </div>
            <div class="detail-meta">
                <p><strong>${LocalizationRenderer.t('quick_action_detail_type')}:</strong> ${handlerType}</p>
                <p><strong>${LocalizationRenderer.t('quick_action_detail_tags')}:</strong> ${tags || '—'}</p>
            </div>
            <div class="detail-actions">
                <button class="builder-pill-button" data-role="preview-action">${LocalizationRenderer.t('quick_action_preview')}</button>
                <button class="builder-pill-button primary" data-role="launch-action">${LocalizationRenderer.t('quick_action_launch')}</button>
            </div>
        `;

        this.detailEl.querySelector('[data-role="preview-action"]').addEventListener('click', () => {
            if (definition.handler?.type === 'workflow') {
                WorkflowRuntime.execute(definition, { source: 'preview', dryRun: true, onLogEntry: (entry) => this.appendStatus(entry.message) });
            } else {
                QuickActionRegistry.execute(definition.id, { showToast: (message) => this.appendStatus(message) });
            }
        });

        this.detailEl.querySelector('[data-role="launch-action"]').addEventListener('click', () => QuickActionRegistry.execute(definition.id));
    },

    appendStatus: function(message) {
        if (!this.statusEl) return;
        this.statusEl.textContent = message;
    },

    applyChanges: function() {
        QuickActionState.setActiveList(this.draftActiveList);
        this.appendStatus(LocalizationRenderer.t('quick_action_manager_saved'));
        this.close();
    },

    resetToDefaults: function() {
        this.draftActiveList = QuickActionState.getDefaultActiveList();
        this.render();
        this.appendStatus(LocalizationRenderer.t('quick_action_manager_defaults'));
    },

    showComingSoon: function() {
        ToastManager.show(LocalizationRenderer.t('quick_action_coming_soon'));
    },

    exportSelection: function() {
        const payload = {
            active: this.draftActiveList,
            timestamp: Date.now()
        };
        ipcRenderer.send('export-quick-actions', payload);
        this.appendStatus(LocalizationRenderer.t('quick_action_manager_exported'));
    },

    createNewQuickApp: function() {
        this.close();
        ViewManager.switchView('quick-app-builder');
        QuickAppBuilderController.prepareNewBlueprint();
    }
};

const QuickActionsHelp = {
    overlay: null,

    init: function() {
        this.overlay = Utils.getElement('#quick-actions-help');
        if (!this.overlay) return;
        Utils.getElement('#open-quick-actions-help')?.addEventListener('click', () => this.open());
        Utils.getElement('#quick-actions-help-close')?.addEventListener('click', () => this.close());
        Utils.getElement('#quick-actions-help-open-studio')?.addEventListener('click', () => {
            this.close();
            ViewManager.switchView('quick-app-builder');
        });
        this.overlay.addEventListener('click', (event) => {
            if (event.target === this.overlay) this.close();
        });
    },

    open: function() {
        if (!this.overlay) return;
        this.overlay.classList.remove('hidden');
    },

    close: function() {
        if (!this.overlay) return;
        this.overlay.classList.add('hidden');
    }
};

// =================================================================================
// === Workflow Runtime ===
// =================================================================================

const WorkflowRuntime = {
    execute: function(definition, options = {}) {
        if (!definition || !definition.workflow) {
            ToastManager.show(LocalizationRenderer.t('quick_action_missing_workflow'));
            return;
        }
        const workflow = definition.workflow;
        const runId = `run-${Date.now()}`;
        const log = [];
        const notifyLog = (entry) => {
            log.push(entry);
            if (typeof options.onLogEntry === 'function') options.onLogEntry(entry);
            QuickAppBuilderController.appendLog(entry);
        };

        notifyLog({
            runId,
            level: 'info',
            message: LocalizationRenderer.t('workflow_log_trigger_fired'),
            timestamp: new Date().toISOString()
        });

        const adjacency = new Map();
        (workflow.connections || []).forEach(connection => {
            const sourceKey = `${connection.source.node}:${connection.source.port}`;
            if (!adjacency.has(sourceKey)) adjacency.set(sourceKey, []);
            adjacency.get(sourceKey).push(connection.target);
        });

        const queue = [{ node: 'trigger', port: 'out', payload: workflow.trigger?.config || {} }];
        const visited = new Set();

        while (queue.length > 0) {
            const current = queue.shift();
            const key = `${current.node}:${current.port}`;
            if (visited.has(key)) continue;
            visited.add(key);

            const nextTargets = adjacency.get(key) || [];
            nextTargets.forEach(target => {
                notifyLog({
                    runId,
                    level: 'info',
                    message: LocalizationRenderer.t('workflow_log_step', key, `${target.node}:${target.port}`),
                    timestamp: new Date().toISOString()
                });
                queue.push({ node: target.node, port: target.port, payload: {} });
            });
        }

        notifyLog({
            runId,
            level: 'success',
            message: LocalizationRenderer.t('workflow_log_complete', definition.name || LocalizationRenderer.t(definition.labelKey)),
            timestamp: new Date().toISOString()
        });

        if (typeof options.onComplete === 'function') options.onComplete(log);
    }
};

// =================================================================================
// === Quick App Builder Controller ===
// =================================================================================

const QuickAppBuilderController = {
    view: null,
    logContainer: null,
    zoomIndicator: null,
    statusIndicator: null,
    designer: null,
    currentBlueprint: null,

    init: function() {
        this.view = Utils.getElement('#quick-app-builder-view');
        if (!this.view) return;
        this.logContainer = Utils.getElement('#builder-log');
        this.zoomIndicator = Utils.getElement('#builder-zoom-indicator');
        this.statusIndicator = Utils.getElement('#builder-status-indicator');

        const options = {
            canvas: Utils.getElement('#builder-canvas'),
            connectionLayer: Utils.getElement('#builder-connection-layer'),
            nodesLayer: Utils.getElement('#builder-nodes-layer'),
            moduleCatalog: QuickAppModuleCatalog,
            moduleContainer: Utils.getElement('#builder-module-groups'),
            blueprintContainer: Utils.getElement('#builder-blueprints'),
            inspectorContainer: Utils.getElement('#builder-inspector-content'),
            onSelectionChange: (node) => this.handleSelectionChange(node),
            onStatusChange: (status) => this.updateStatus(status),
            onZoomChange: (value) => this.updateZoom(value)
        };

        if (window.WorkflowDesigner) {
            this.designer = new window.WorkflowDesigner(options);
        }

        Utils.getElement('#builder-back-button')?.addEventListener('click', () => ViewManager.switchView('search'));
        Utils.getElement('#builder-clear-log')?.addEventListener('click', () => this.clearLog());
        Utils.getElement('#builder-preview-action')?.addEventListener('click', () => this.previewWorkflow());
        Utils.getElement('#builder-save-action')?.addEventListener('click', () => this.saveWorkflow());
        Utils.getElement('#builder-run-test')?.addEventListener('click', () => this.previewWorkflow());
        Utils.getElement('#builder-zoom-in')?.addEventListener('click', () => this.designer?.adjustZoom(0.1));
        Utils.getElement('#builder-zoom-out')?.addEventListener('click', () => this.designer?.adjustZoom(-0.1));
        Utils.getElement('#builder-zoom-reset')?.addEventListener('click', () => this.designer?.setZoom(1));
        Utils.getElement('#builder-auto-layout')?.addEventListener('click', () => this.designer?.autoLayout());
        Utils.getElement('#builder-collapse-sidebar')?.addEventListener('click', () => this.toggleSidebar());
        Utils.getElement('#builder-close-inspector')?.addEventListener('click', () => this.designer?.clearSelection());
        Utils.getElement('#builder-duplicate-node')?.addEventListener('click', () => this.designer?.duplicateSelection());
        Utils.getElement('#builder-delete-node')?.addEventListener('click', () => this.designer?.deleteSelection());
        Utils.getElement('#builder-module-filter')?.addEventListener('input', (event) => this.designer?.filterModules(event.target.value));
    },

    onEnter: function() {
        this.updateStatus(LocalizationRenderer.t('quick_action_status_idle'));
        this.designer?.refresh();
        if (window.feather) feather.replace();
    },

    prepareNewBlueprint: function() {
        this.currentBlueprint = null;
        this.designer?.reset();
        this.clearLog();
        this.updateStatus(LocalizationRenderer.t('quick_app_builder_ready'));
    },

    loadBlueprint: function(blueprint) {
        if (!blueprint) return;
        this.currentBlueprint = blueprint;
        this.designer?.loadBlueprint(blueprint);
        this.clearLog();
        this.updateStatus(LocalizationRenderer.t('quick_app_builder_blueprint_loaded', blueprint.name || LocalizationRenderer.t(blueprint.nameKey)));
    },

    previewWorkflow: function() {
        const definition = this.designer?.exportWorkflow();
        if (!definition || !definition.workflow) {
            ToastManager.show(LocalizationRenderer.t('quick_app_builder_no_nodes'));
            return;
        }
        WorkflowRuntime.execute(definition, {
            source: 'builder-preview',
            onLogEntry: (entry) => this.appendLog(entry)
        });
    },

    saveWorkflow: function() {
        const definition = this.designer?.exportWorkflow();
        if (!definition || !definition.workflow) {
            ToastManager.show(LocalizationRenderer.t('quick_app_builder_no_nodes'));
            return;
        }
        const metadata = this.designer?.getMetadata();
        const id = QuickActionState.addCustomAction({
            name: metadata?.name,
            description: metadata?.description,
            icon: metadata?.icon,
            accentColor: metadata?.accentColor,
            workflow: definition.workflow
        });
        ToastManager.show(LocalizationRenderer.t('quick_app_builder_saved')); 
        ViewManager.switchView('search');
        QuickActionRegistry.execute(id);
    },

    handleSelectionChange: function(node) {
        if (!node) {
            Utils.getElement('#builder-inspector-content').innerHTML = `<p>${LocalizationRenderer.t('quick_app_inspector_empty')}</p>`;
            return;
        }
        if (window.feather) feather.replace();
    },

    toggleSidebar: function() {
        const sidebar = Utils.getElement('.builder-sidebar');
        if (!sidebar) return;
        sidebar.classList.toggle('collapsed');
    },

    updateStatus: function(status) {
        if (!this.statusIndicator) return;
        this.statusIndicator.textContent = status;
    },

    updateZoom: function(value) {
        if (!this.zoomIndicator) return;
        this.zoomIndicator.textContent = `${Math.round(value * 100)}%`;
    },

    appendLog: function(entry) {
        if (!this.logContainer || !entry) return;
        const row = Utils.createElement('div', { className: `builder-log-entry ${entry.level || 'info'}` });
        const time = Utils.createElement('div', { className: 'log-time', text: new Date(entry.timestamp || Date.now()).toLocaleTimeString() });
        const message = Utils.createElement('div', { className: 'log-status', text: entry.message });
        row.appendChild(time);
        row.appendChild(message);
        this.logContainer.appendChild(row);
        this.logContainer.scrollTop = this.logContainer.scrollHeight;
    },

    clearLog: function() {
        if (!this.logContainer) return;
        this.logContainer.innerHTML = '';
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

        const activeAddonsList = Utils.getElement('#active-addons-list');
        if (activeAddonsList) {
            activeAddonsList.addEventListener('click', (event) => {
                const removeButton = event.target.closest('[data-action="remove-quick-action"]');
                if (removeButton) {
                    const actionId = removeButton.getAttribute('data-action-id');
                    QuickActionState.removeFromActive(actionId);
                    this.renderAddons();
                }
            });
        }

        const addonGallery = Utils.getElement('#addon-gallery');
        if (addonGallery) {
            addonGallery.addEventListener('click', (event) => {
                const addButton = event.target.closest('[data-action="add-quick-action"]');
                if (addButton) {
                    const actionId = addButton.getAttribute('data-action-id');
                    QuickActionState.addToActive(actionId);
                    this.renderAddons();
                    return;
                }
                const deleteButton = event.target.closest('[data-action="delete-quick-action"]');
                if (deleteButton) {
                    const actionId = deleteButton.getAttribute('data-action-id');
                    if (window.confirm(LocalizationRenderer.t('quick_action_delete_confirm'))) {
                        QuickActionState.deleteCustomAction(actionId);
                        this.renderAddons();
                    }
                    return;
                }
                const blueprintButton = event.target.closest('[data-action="open-blueprint"]');
                if (blueprintButton) {
                    const blueprintId = blueprintButton.getAttribute('data-blueprint-id');
                    const blueprint = QuickActionState.getBlueprint(blueprintId);
                    if (blueprint) {
                        ViewManager.switchView('quick-app-builder');
                        QuickAppBuilderController.loadBlueprint(blueprint);
                    }
                }
            });
        }

        Utils.getElement('#open-quick-app-studio')?.addEventListener('click', () => {
            ViewManager.switchView('quick-app-builder');
            QuickAppBuilderController.prepareNewBlueprint();
        });
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
        this.renderQuickActionBridge();
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
        (AppState.settings.customAutomations || []).forEach((auto, index) => {
            const entry = Utils.createElement('div', { className: 'automation-entry' });
            const infoDiv = Utils.createElement('div', { className: 'automation-info' });
            infoDiv.innerHTML = `<div class="automation-name">${Utils.escapeHtml(auto.name)} (Keyword: ${Utils.escapeHtml(auto.keyword)})</div><div class="automation-details">${auto.command}</div>`;
            entry.appendChild(infoDiv);
            const removeButton = Utils.createElement('button', { className: 'remove-dir-button', text: LocalizationRenderer.t('settings_remove') });
            removeButton.addEventListener('click', () => this.removeAutomation(index));
            entry.appendChild(removeButton);
            list.appendChild(entry);
        });
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
        return !!(AppState.settings?.subscription?.isActive);
    },

    getSubscription: function() {
        return AppState.settings?.subscription || { isActive: false, planName: '', renewalDate: null, features: [] };
    },

    ensureSubscriptionVisibility: function() {
        const addonsTabButton = Utils.getElement('.settings-sidebar li[data-tab="addons"]');
        const addonsContent = Utils.getElement('#tab-addons');
        const isActive = this.hasActiveSubscription();

        if (addonsTabButton) {
            addonsTabButton.classList.toggle('is-hidden', !isActive);
            if (!isActive && addonsTabButton.classList.contains('active')) {
                Utils.getElement('.settings-sidebar li[data-tab="subscription"]')?.click()
                    || Utils.getElement('.settings-sidebar li[data-tab="general"]')?.click();
            }
        }

        if (addonsContent) {
            addonsContent.classList.toggle('is-hidden', !isActive);
            if (!isActive) addonsContent.classList.remove('active');
        }
    },

    renderSubscription: function() {
        const subscription = this.getSubscription();
        const isActive = this.hasActiveSubscription();
        const statusKey = isActive ? 'subscription_status_active' : 'subscription_status_inactive';

        const statusBadge = Utils.getElement('#subscription-status-badge');
        if (statusBadge) {
            statusBadge.textContent = LocalizationRenderer.t(statusKey);
            statusBadge.classList.toggle('inactive', !isActive);
            statusBadge.classList.toggle('active', isActive);
        }

        const statusText = Utils.getElement('#subscription-status-text');
        if (statusText) {
            statusText.textContent = LocalizationRenderer.t(statusKey);
        }

        const planNameEl = Utils.getElement('#subscription-plan-name');
        if (planNameEl) {
            planNameEl.textContent = subscription.planName || LocalizationRenderer.t('subscription_unknown_plan');
        }

        const renewalEl = Utils.getElement('#subscription-renewal-date');
        if (renewalEl) {
            renewalEl.textContent = this.formatDateForUser(subscription.renewalDate);
        }

        const featureList = Utils.getElement('#subscription-feature-list');
        if (featureList) {
            featureList.innerHTML = '';
            const features = Array.isArray(subscription.features) && subscription.features.length > 0
                ? subscription.features
                : ['addon-builder'];
            features.forEach(featureKey => {
                const item = Utils.createElement('li');
                const translationKey = SubscriptionFeatureLabels[featureKey] || SubscriptionFeatureLabels.default;
                item.textContent = LocalizationRenderer.t(translationKey);
                featureList.appendChild(item);
            });
        }
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
        const activeContainer = Utils.getElement('#active-addons-list');
        const galleryContainer = Utils.getElement('#addon-gallery');
        const activeList = QuickActionState.getActiveList();
        const activeSet = new Set(activeList);

        if (activeContainer) {
            activeContainer.innerHTML = '';
            if (activeList.length === 0) {
                const empty = Utils.createElement('div', { className: 'addons-empty', text: LocalizationRenderer.t('quick_action_manager_empty') });
                activeContainer.appendChild(empty);
            } else {
                activeList.forEach(actionId => {
                    const definition = QuickActionState.getDefinition(actionId);
                    if (!definition) return;
                    const card = Utils.createElement('div', { className: 'addon-card active-addon quick-action-card' });
                    const iconWrap = Utils.createElement('div', { className: 'addon-card-icon' });
                    iconWrap.innerHTML = `<i data-feather="${definition.icon || 'zap'}"></i>`;
                    card.appendChild(iconWrap);

                    const info = Utils.createElement('div', { className: 'addon-card-info' });
                    const titleRow = Utils.createElement('div', { className: 'addon-card-title-row' });
                    titleRow.appendChild(Utils.createElement('h4', { className: 'addon-card-title', text: this.getQuickActionName(definition) }));
                    const badge = Utils.createElement('span', { className: 'addon-badge', text: definition.type === 'custom' ? LocalizationRenderer.t('addon_tag_custom') : LocalizationRenderer.t('addon_tag_library') });
                    titleRow.appendChild(badge);
                    info.appendChild(titleRow);
                    info.appendChild(Utils.createElement('p', { className: 'addon-card-description', text: this.getQuickActionDescription(definition) }));

                    const meta = Utils.createElement('div', { className: 'addon-card-meta' });
                    const handlerType = definition.handler?.type || 'panel';
                    meta.appendChild(Utils.createElement('span', { className: 'addon-meta-pill', text: handlerType }));
                    meta.appendChild(Utils.createElement('span', { className: 'addon-meta-pill subtle', text: (definition.tags || []).join(' • ') }));
                    info.appendChild(meta);
                    card.appendChild(info);

                    const actions = Utils.createElement('div', { className: 'addon-card-actions' });
                    const removeBtn = Utils.createElement('button', { className: 'addon-pill-button danger', text: LocalizationRenderer.t('addons_remove_button') });
                    removeBtn.setAttribute('data-action', 'remove-quick-action');
                    removeBtn.setAttribute('data-action-id', definition.id);
                    actions.appendChild(removeBtn);
                    card.appendChild(actions);

                    activeContainer.appendChild(card);
                });
            }
        }

        if (galleryContainer) {
            galleryContainer.innerHTML = '';
            const definitions = QuickActionState.getAllDefinitions();
            const library = definitions.filter(def => def.type === 'library');
            const custom = definitions.filter(def => def.type === 'custom');

            const renderCard = (definition, isCustom) => {
                const card = Utils.createElement('div', { className: `addon-card gallery-addon ${isCustom ? 'is-custom' : ''}` });
                const iconWrap = Utils.createElement('div', { className: 'addon-card-icon' });
                iconWrap.innerHTML = `<i data-feather="${definition.icon || 'zap'}"></i>`;
                card.appendChild(iconWrap);

                const info = Utils.createElement('div', { className: 'addon-card-info' });
                const titleRow = Utils.createElement('div', { className: 'addon-card-title-row' });
                titleRow.appendChild(Utils.createElement('h4', { className: 'addon-card-title', text: this.getQuickActionName(definition) }));
                const badge = Utils.createElement('span', { className: 'addon-badge', text: isCustom ? LocalizationRenderer.t('addon_tag_custom') : LocalizationRenderer.t('addon_tag_library') });
                titleRow.appendChild(badge);
                info.appendChild(titleRow);
                info.appendChild(Utils.createElement('p', { className: 'addon-card-description', text: this.getQuickActionDescription(definition) }));
                card.appendChild(info);

                const actions = Utils.createElement('div', { className: 'addon-card-actions stacked' });
                const alreadyActive = activeSet.has(definition.id);
                const addButton = Utils.createElement('button', { className: 'addon-pill-button primary', text: LocalizationRenderer.t(alreadyActive ? 'addons_gallery_added' : 'addons_gallery_add') });
                addButton.setAttribute('data-action', 'add-quick-action');
                addButton.setAttribute('data-action-id', definition.id);
                if (alreadyActive) addButton.classList.add('disabled');
                actions.appendChild(addButton);
                if (isCustom) {
                    const deleteBtn = Utils.createElement('button', { className: 'addon-pill-button subtle-danger', text: LocalizationRenderer.t('addon_delete_custom') });
                    deleteBtn.setAttribute('data-action', 'delete-quick-action');
                    deleteBtn.setAttribute('data-action-id', definition.id);
                    actions.appendChild(deleteBtn);
                }
                card.appendChild(actions);
                return card;
            };

            library.forEach(def => galleryContainer.appendChild(renderCard(def, false)));
            custom.forEach(def => galleryContainer.appendChild(renderCard(def, true)));

            if (QuickActionBlueprints.length > 0) {
                const blueprintHeader = Utils.createElement('div', { className: 'addon-card-meta', text: LocalizationRenderer.t('quick_action_blueprints_header') });
                galleryContainer.appendChild(blueprintHeader);
                QuickActionBlueprints.forEach(blueprint => {
                    const card = Utils.createElement('div', { className: 'addon-card gallery-addon blueprint-card' });
                    const iconWrap = Utils.createElement('div', { className: 'addon-card-icon' });
                    iconWrap.innerHTML = `<i data-feather="${blueprint.icon || 'layers'}"></i>`;
                    card.appendChild(iconWrap);
                    const info = Utils.createElement('div', { className: 'addon-card-info' });
                    info.appendChild(Utils.createElement('h4', { className: 'addon-card-title', text: LocalizationRenderer.t(blueprint.nameKey) }));
                    info.appendChild(Utils.createElement('p', { className: 'addon-card-description', text: LocalizationRenderer.t(blueprint.descriptionKey) }));
                    const meta = Utils.createElement('div', { className: 'addon-card-meta' });
                    meta.appendChild(Utils.createElement('span', { className: 'addon-meta-pill', text: blueprint.difficulty }));
                    meta.appendChild(Utils.createElement('span', { className: 'addon-meta-pill subtle', text: LocalizationRenderer.t('quick_action_blueprint_eta', blueprint.estimatedTime) }));
                    info.appendChild(meta);
                    card.appendChild(info);
                    const actions = Utils.createElement('div', { className: 'addon-card-actions' });
                    const openBtn = Utils.createElement('button', { className: 'addon-pill-button primary', text: LocalizationRenderer.t('quick_action_blueprint_open') });
                    openBtn.setAttribute('data-action', 'open-blueprint');
                    openBtn.setAttribute('data-blueprint-id', blueprint.id);
                    actions.appendChild(openBtn);
                    card.appendChild(actions);
                    galleryContainer.appendChild(card);
                });
            }

            if (window.feather) feather.replace();
        }
    },

    getQuickActionName: function(definition) {
        if (!definition) return LocalizationRenderer.t('addon_unknown_name');
        if (definition.name) return definition.name;
        if (definition.nameKey) return LocalizationRenderer.t(definition.nameKey);
        return LocalizationRenderer.t('addon_unknown_name');
    },

    getQuickActionDescription: function(definition) {
        if (!definition) return LocalizationRenderer.t('addon_default_description');
        if (definition.description) return definition.description;
        if (definition.descriptionKey) return LocalizationRenderer.t(definition.descriptionKey);
        return LocalizationRenderer.t('addon_default_description');
    },

    renderQuickActionBridge: function() {
        const manageButton = Utils.getElement('#open-quick-action-manager');
        if (manageButton) {
            const count = QuickActionState.getActiveList().length;
            manageButton.title = LocalizationRenderer.t('quick_actions_bridge_manage_tooltip', count);
        }
        const launchButton = Utils.getElement('#open-quick-app-studio');
        if (launchButton) {
            launchButton.title = LocalizationRenderer.t('quick_actions_bridge_launch_tooltip');
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
        if (searchInput) searchInput.addEventListener('input', (e) => debouncedSearch(e.target.value.trim()));
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
            items = data.map(item => ({
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
        } else if (viewName === 'quick-app-builder') {
            QuickAppBuilderController.onEnter();
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
            targetWidth = AppState.settings.width;
        } else if (AppState.currentView === 'quick-app-builder') {
            const builderShell = Utils.getElement('.quick-app-builder-shell');
            if (builderShell) {
                totalHeight = builderShell.offsetHeight + 40;
                targetWidth = Math.max(1200, builderShell.offsetWidth + 40);
            } else {
                totalHeight = 900;
                targetWidth = 1280;
            }
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

        if (totalHeight > 0 && targetWidth > 0) {
            appContainer.style.height = `${totalHeight}px`;
            ipcRenderer.send('resize-window', { width: targetWidth, height: totalHeight });
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
        else if (settingKey === 'height') document.documentElement.style.setProperty('--dynamic-height', `${parseInt(value, 10) || 90}px`);
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
    SearchModule.init();
    FolderContextMenu.init();
    PinnedContextMenu.init();
    PinnedAppsModule.init();
    AuxPanelManager.init();
    CustomSelect.init();
    QuickActionManagerUI.init();
    QuickActionsHelp.init();
    QuickAppBuilderController.init();
    QuickActionBar.init();

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
        AppState.translations = data.translations;
        AppState.appVersion = data.version;
        AppState.systemTheme = data.systemTheme; // Обновляем системную тему
        QuickActionState.ensureDefaults();
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
