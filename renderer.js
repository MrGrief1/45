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

const AddonLibrary = [
    {
        id: 'clipboard-buffer',
        type: 'library',
        icon: 'clipboard',
        base: 'clipboard',
        nameKey: 'addon_library_clipboard_name',
        descriptionKey: 'addon_library_clipboard_description',
        blocks: ['clipboard-filter', 'pin-items']
    },
    {
        id: 'note-canvas',
        type: 'library',
        icon: 'edit-3',
        base: 'note',
        nameKey: 'addon_library_note_name',
        descriptionKey: 'addon_library_note_description',
        blocks: ['text-replace']
    },
    {
        id: 'workflow-launcher',
        type: 'library',
        icon: 'zap',
        base: 'command',
        nameKey: 'addon_library_command_name',
        descriptionKey: 'addon_library_command_description',
        blocks: ['pin-items', 'sync']
    }
];

const AddonBuilderBases = [
    { id: 'clipboard', icon: 'clipboard', nameKey: 'addon_base_clipboard', descriptionKey: 'addon_base_clipboard_desc' },
    { id: 'note', icon: 'edit-3', nameKey: 'addon_base_note', descriptionKey: 'addon_base_note_desc' },
    { id: 'command', icon: 'zap', nameKey: 'addon_base_command', descriptionKey: 'addon_base_command_desc' }
];

const AddonBuilderBlocks = [
    { id: 'clipboard-filter', icon: 'filter', nameKey: 'addon_builder_blocks_clipboard_filter', descriptionKey: 'addon_builder_blocks_clipboard_filter_desc' },
    { id: 'text-replace', icon: 'repeat', nameKey: 'addon_builder_blocks_text_replace', descriptionKey: 'addon_builder_blocks_text_replace_desc' },
    { id: 'pin-items', icon: 'bookmark', nameKey: 'addon_builder_blocks_pin_items', descriptionKey: 'addon_builder_blocks_pin_items_desc' },
    { id: 'sync', icon: 'cloud', nameKey: 'addon_builder_blocks_sync', descriptionKey: 'addon_builder_blocks_sync_desc' }
];

const BuiltinQuickActions = [
    {
        id: 'apps-library',
        icon: 'grid',
        labelKey: 'title_apps_library',
        descriptionKey: 'quick_action_apps_description',
        actionType: 'panel',
        target: 'apps-library',
        defaultEnabled: true,
        displayMode: 'icon'
    },
    {
        id: 'files',
        icon: 'folder',
        labelKey: 'title_files',
        descriptionKey: 'quick_action_files_description',
        actionType: 'panel',
        target: 'files',
        defaultEnabled: true,
        displayMode: 'icon'
    },
    {
        id: 'commands',
        icon: 'command',
        labelKey: 'title_commands',
        descriptionKey: 'quick_action_commands_description',
        actionType: 'panel',
        target: 'commands',
        defaultEnabled: true,
        displayMode: 'icon'
    },
    {
        id: 'clipboard',
        icon: 'copy',
        labelKey: 'title_clipboard',
        descriptionKey: 'quick_action_clipboard_description',
        actionType: 'panel',
        target: 'clipboard',
        defaultEnabled: true,
        displayMode: 'icon'
    }
];

const QuickActionIconChoices = ['aperture', 'activity', 'zap', 'send', 'layout', 'terminal', 'cloud', 'database', 'cpu', 'sliders', 'message-square', 'bookmark', 'repeat', 'compass'];

const WorkflowModules = [
    {
        id: 'trigger-search',
        category: 'Triggers',
        icon: 'target',
        name: 'Search keyword',
        description: 'Starts when the search query matches your keyword.',
        defaultConfig: { keyword: '', matchMode: 'contains' },
        fields: [
            { id: 'keyword', label: 'Keyword', type: 'text', placeholder: 'meeting notes' },
            { id: 'matchMode', label: 'Match mode', type: 'select', options: [
                { value: 'contains', label: 'Contains' },
                { value: 'startsWith', label: 'Starts with' },
                { value: 'exact', label: 'Exact phrase' }
            ] }
        ]
    },
    {
        id: 'trigger-schedule',
        category: 'Triggers',
        icon: 'clock',
        name: 'Scheduled',
        description: 'Runs the workflow at a scheduled interval.',
        defaultConfig: { interval: 30, unit: 'minutes' },
        fields: [
            { id: 'interval', label: 'Interval', type: 'number', min: 1, max: 1440, step: 1, placeholder: '30' },
            { id: 'unit', label: 'Unit', type: 'select', options: [
                { value: 'minutes', label: 'Minutes' },
                { value: 'hours', label: 'Hours' },
                { value: 'days', label: 'Days' }
            ] }
        ]
    },
    {
        id: 'trigger-clipboard',
        category: 'Triggers',
        icon: 'clipboard',
        name: 'Clipboard capture',
        description: 'Launches when new text is copied to the clipboard.',
        defaultConfig: { filter: '' },
        fields: [
            { id: 'filter', label: 'Filter keyword', type: 'text', placeholder: 'invoice #' }
        ]
    },
    {
        id: 'transform-format',
        category: 'Transformations',
        icon: 'sliders',
        name: 'Format text',
        description: 'Clean, reformat or template text before sending it forward.',
        defaultConfig: { template: 'Processed: {{input}}' },
        fields: [
            { id: 'template', label: 'Template', type: 'textarea', placeholder: 'Processed: {{input}}' }
        ]
    },
    {
        id: 'transform-ai',
        category: 'Transformations',
        icon: 'cpu',
        name: 'AI summarize',
        description: 'Summarise content into a short brief.',
        defaultConfig: { style: 'summary' },
        fields: [
            { id: 'style', label: 'Style', type: 'select', options: [
                { value: 'summary', label: 'Summary' },
                { value: 'actionItems', label: 'Action items' },
                { value: 'bulletList', label: 'Bullet list' }
            ] }
        ]
    },
    {
        id: 'transform-delay',
        category: 'Transformations',
        icon: 'pause',
        name: 'Delay',
        description: 'Pause the workflow for a period of time.',
        defaultConfig: { duration: 3, unit: 'seconds' },
        fields: [
            { id: 'duration', label: 'Duration', type: 'number', min: 1, max: 3600, step: 1, placeholder: '3' },
            { id: 'unit', label: 'Unit', type: 'select', options: [
                { value: 'seconds', label: 'Seconds' },
                { value: 'minutes', label: 'Minutes' },
                { value: 'hours', label: 'Hours' }
            ] }
        ]
    },
    {
        id: 'action-open-app',
        category: 'Actions',
        icon: 'monitor',
        name: 'Open application',
        description: 'Launch a desktop application or file.',
        defaultConfig: { target: '', arguments: '' },
        fields: [
            { id: 'target', label: 'Application path or alias', type: 'text', placeholder: 'notepad.exe' },
            { id: 'arguments', label: 'Arguments', type: 'text', placeholder: '--new --focus' }
        ]
    },
    {
        id: 'action-send-http',
        category: 'Actions',
        icon: 'send',
        name: 'Webhook request',
        description: 'Send data to an external service.',
        defaultConfig: { method: 'POST', url: '', body: '' },
        fields: [
            { id: 'method', label: 'Method', type: 'select', options: [
                { value: 'POST', label: 'POST' },
                { value: 'GET', label: 'GET' },
                { value: 'PUT', label: 'PUT' }
            ] },
            { id: 'url', label: 'URL', type: 'text', placeholder: 'https://hooks.example/api' },
            { id: 'body', label: 'Payload', type: 'textarea', placeholder: '{ "text": "Hello" }' }
        ]
    },
    {
        id: 'action-notify',
        category: 'Actions',
        icon: 'bell',
        name: 'Desktop notification',
        description: 'Show a rich desktop notification with the result.',
        defaultConfig: { title: 'Workflow complete', body: 'All steps finished successfully.' },
        fields: [
            { id: 'title', label: 'Title', type: 'text', placeholder: 'Workflow complete' },
            { id: 'body', label: 'Body', type: 'textarea', placeholder: 'All steps finished successfully.' }
        ]
    }
];

const WorkflowTemplates = [
    {
        id: 'template-meeting-brief',
        name: 'Meeting brief to Slack',
        description: 'Capture clipboard notes, summarise and send to Slack webhook.',
        icon: 'slack',
        quickAction: {
            icon: 'sliders',
            name: 'Meeting brief',
            description: 'Summarise copied notes and send them to Slack.'
        },
        nodes: [
            { moduleId: 'trigger-clipboard', config: { filter: 'Meeting' } },
            { moduleId: 'transform-ai', config: { style: 'summary' } },
            { moduleId: 'action-send-http', config: { method: 'POST', url: 'https://hooks.slack.com/services/...', body: '{"text":"{{input}}"}' } }
        ]
    },
    {
        id: 'template-daily-review',
        name: 'Daily review dashboard',
        description: 'At the end of the day compile notes and open your dashboard.',
        icon: 'sunrise',
        quickAction: {
            icon: 'sunrise',
            name: 'Daily review',
            description: 'Collect tasks and open your planning dashboard.'
        },
        nodes: [
            { moduleId: 'trigger-schedule', config: { interval: 1, unit: 'days' } },
            { moduleId: 'transform-format', config: { template: 'Daily focus summary:\n{{input}}' } },
            { moduleId: 'action-open-app', config: { target: 'notion', arguments: 'daily-dashboard' } }
        ]
    },
    {
        id: 'template-quick-command',
        name: 'Quick terminal command',
        description: 'Run a predefined terminal command from the search bar.',
        icon: 'terminal',
        quickAction: {
            icon: 'terminal',
            name: 'Run script',
            description: 'Execute a saved terminal script with one click.'
        },
        nodes: [
            { moduleId: 'trigger-search', config: { keyword: 'deploy', matchMode: 'exact' } },
            { moduleId: 'action-open-app', config: { target: 'powershell.exe', arguments: '-File C:/Scripts/deploy.ps1' } },
            { moduleId: 'action-notify', config: { title: 'Deployment started', body: 'Your deployment script is running.' } }
        ]
    }
];

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
            SettingsModule.renderAddonBuilder();
        }
    }
};

const QuickActionManager = {
    container: null,
    activeIdsCache: [],

    init() {
        this.container = Utils.getElement('#quick-action-strip');
        if (this.container) {
            this.container.addEventListener('click', (event) => {
                const button = event.target.closest('[data-action-id]');
                if (!button) return;
                const actionId = button.getAttribute('data-action-id');
                if (!actionId) return;
                this.executeAction(actionId);
            });
        }
        this.render();
    },

    getActiveIds() {
        let ids = Array.isArray(AppState.settings.quickActions) ? [...AppState.settings.quickActions] : null;
        if (!ids) {
            const defaults = BuiltinQuickActions.filter(item => item.defaultEnabled !== false).map(item => item.id);
            const legacy = Array.isArray(AppState.settings.activeAddons) ? [...AppState.settings.activeAddons] : [];
            ids = Array.from(new Set([...defaults, ...legacy]));
            AppState.settings.quickActions = ids;
            ipcRenderer.send('update-setting', 'quickActions', ids);
        }
        return ids;
    },

    getDefinitionMap() {
        const map = new Map();
        BuiltinQuickActions.forEach(item => {
            map.set(item.id, {
                id: item.id,
                icon: item.icon,
                labelKey: item.labelKey,
                descriptionKey: item.descriptionKey,
                name: LocalizationRenderer.t(item.labelKey),
                description: LocalizationRenderer.t(item.descriptionKey),
                actionType: item.actionType,
                target: item.target,
                displayMode: item.displayMode,
                source: 'builtin'
            });
        });

        AddonLibrary.forEach(item => {
            map.set(item.id, {
                ...item,
                name: LocalizationRenderer.t(item.nameKey || item.id),
                description: LocalizationRenderer.t(item.descriptionKey || item.id),
                actionType: 'addon',
                displayMode: 'icon-label',
                source: 'library'
            });
        });

        (AppState.settings.customAddons || []).forEach(addon => {
            map.set(addon.id, {
                ...addon,
                name: addon.name || addon.id,
                description: addon.description || '',
                icon: addon.icon || 'layers',
                actionType: addon.workflow ? 'workflow' : 'addon',
                displayMode: 'icon-label',
                source: 'custom'
            });
        });

        return map;
    },

    getActiveDefinitions() {
        const ids = this.getActiveIds();
        const definitions = [];
        const map = this.getDefinitionMap();
        ids.forEach(id => {
            if (map.has(id)) definitions.push(map.get(id));
        });
        return definitions;
    },

    resolveDefinition(id) {
        return this.getDefinitionMap().get(id) || null;
    },

    isBuiltin(id) {
        return BuiltinQuickActions.some(item => item.id === id);
    },

    render() {
        if (!this.container) {
            this.container = Utils.getElement('#quick-action-strip');
            if (!this.container) return;
        }
        const activeDefs = this.getActiveDefinitions();
        this.container.innerHTML = '';

        activeDefs.forEach(def => {
            const button = this.createButton(def);
            this.container.appendChild(button);
        });

        const manageButton = this.createManageButton();
        this.container.appendChild(manageButton);

        if (window.feather) window.feather.replace(this.container);
    },

    createButton(definition) {
        const button = document.createElement('button');
        button.className = 'quick-action-button glass-element';
        button.setAttribute('data-action-id', definition.id);
        button.setAttribute('title', definition.description || definition.name);

        const iconSpan = document.createElement('span');
        iconSpan.className = 'quick-action-icon';
        iconSpan.innerHTML = window.feather?.icons[definition.icon || 'zap']?.toSvg() || '';
        button.appendChild(iconSpan);

        if (definition.displayMode !== 'icon') {
            const label = document.createElement('span');
            label.className = 'quick-action-label';
            label.textContent = definition.name;
            button.appendChild(label);
        }

        return button;
    },

    createManageButton() {
        const button = document.createElement('button');
        button.className = 'quick-action-button glass-element settings-gear';
        button.setAttribute('data-action-id', '__manage');
        button.setAttribute('title', LocalizationRenderer.t('context_settings'));
        const iconSpan = document.createElement('span');
        iconSpan.className = 'quick-action-icon';
        iconSpan.innerHTML = window.feather?.icons['settings']?.toSvg() || '';
        button.appendChild(iconSpan);
        return button;
    },

    executeAction(actionId) {
        if (actionId === '__manage') {
            ViewManager.switchView('settings');
            SettingsModule.focusTab('addons');
            return;
        }

        const definition = this.resolveDefinition(actionId);
        if (!definition) return;

        if (definition.actionType === 'panel' && definition.target) {
            AuxPanelManager.togglePanel(definition.target);
        } else {
            WorkflowRuntime.open(definition);
        }
    },

    setQuickActions(newList) {
        const unique = Array.from(new Set(newList.filter(Boolean)));
        AppState.settings.quickActions = unique;
        const legacy = unique.filter(id => !this.isBuiltin(id));
        AppState.settings.activeAddons = legacy;
        ipcRenderer.send('update-setting', 'quickActions', unique);
        ipcRenderer.send('update-setting', 'activeAddons', legacy);
        this.render();
    },

    addQuickAction(id) {
        const ids = this.getActiveIds();
        if (ids.includes(id)) return;
        ids.push(id);
        this.setQuickActions(ids);
    },

    removeQuickAction(id) {
        const ids = this.getActiveIds().filter(item => item !== id);
        this.setQuickActions(ids);
    },

    ensureQuickActionActive(id) {
        const ids = this.getActiveIds();
        if (!ids.includes(id)) {
            ids.push(id);
            this.setQuickActions(ids);
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
                const removeButton = event.target.closest('[data-action="remove-addon"]');
                if (removeButton) {
                    const addonId = removeButton.getAttribute('data-addon-id');
                    this.removeActiveAddon(addonId);
                    return;
                }
                const editButton = event.target.closest('[data-action="edit-addon"]');
                if (editButton) {
                    const addonId = editButton.getAttribute('data-addon-id');
                    WorkflowBuilder.open(addonId);
                }
            });
        }

        const addonGallery = Utils.getElement('#addon-gallery');
        if (addonGallery) {
            addonGallery.addEventListener('click', (event) => {
                const deleteButton = event.target.closest('[data-action="delete-custom-addon"]');
                if (deleteButton) {
                    const addonId = deleteButton.getAttribute('data-addon-id');
                    this.deleteCustomAddon(addonId);
                    return;
                }
                const addButton = event.target.closest('[data-action="add-addon"]');
                if (addButton) {
                    const addonId = addButton.getAttribute('data-addon-id');
                    this.addAddonFromGallery(addonId);
                }
            });
        }

        const openBuilderButton = Utils.getElement('#open-workflow-builder');
        if (openBuilderButton) {
            openBuilderButton.addEventListener('click', () => WorkflowBuilder.open());
        }

        const showLibraryButton = Utils.getElement('#builder-show-library');
        if (showLibraryButton) {
            showLibraryButton.addEventListener('click', () => WorkflowBuilder.openTemplateDrawer());
        }

        const customList = Utils.getElement('#custom-quick-actions-list');
        if (customList) {
            customList.addEventListener('click', (event) => {
                const button = event.target.closest('[data-action]');
                if (!button) return;
                const action = button.getAttribute('data-action');
                const addonId = button.getAttribute('data-addon-id');
                if (!addonId) return;
                if (action === 'edit-addon') {
                    WorkflowBuilder.open(addonId);
                } else if (action === 'delete-custom-addon') {
                    this.deleteCustomAddon(addonId);
                } else if (action === 'add-addon') {
                    this.addAddonFromGallery(addonId);
                } else if (action === 'remove-addon') {
                    this.removeActiveAddon(addonId);
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
                this.focusTab(tabId);
            });
        });
    },

    focusTab: function(tabId) {
        if (!tabId) return;
        const button = document.querySelector(`.settings-sidebar li[data-tab="${tabId}"]`);
        if (!button) return;
        document.querySelector('.settings-sidebar li.active')?.classList.remove('active');
        document.querySelector('.tab-content.active')?.classList.remove('active');
        button.classList.add('active');
        const newTab = Utils.getElement(`#tab-${tabId}`);
        if (newTab) newTab.classList.add('active');
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
        const isActive = this.hasActiveSubscription();
        const activeContainer = Utils.getElement('#active-addons-list');
        const galleryContainer = Utils.getElement('#addon-gallery');

        if (!isActive) {
            if (activeContainer) activeContainer.innerHTML = '';
            if (galleryContainer) galleryContainer.innerHTML = '';
            return;
        }

        const activeDefs = QuickActionManager.getActiveDefinitions();
        const activeIds = QuickActionManager.getActiveIds();
        const definitionMap = QuickActionManager.getDefinitionMap();
        const activeSet = new Set(activeIds);

        if (activeContainer) {
            activeContainer.innerHTML = '';
            if (activeDefs.length === 0) {
                const empty = Utils.createElement('div', { className: 'addons-empty', text: LocalizationRenderer.t('addons_empty_state') });
                activeContainer.appendChild(empty);
            } else {
                activeDefs.forEach(def => {
                    const card = this.buildActiveQuickActionCard(def);
                    activeContainer.appendChild(card);
                });
            }
        }

        if (galleryContainer) {
            galleryContainer.innerHTML = '';
            const galleryDefs = [];
            definitionMap.forEach((def, id) => {
                if (activeSet.has(id)) return;
                galleryDefs.push(def);
            });

            if (galleryDefs.length === 0) {
                const empty = Utils.createElement('div', { className: 'addons-empty', text: LocalizationRenderer.t('addons_gallery_empty') });
                galleryContainer.appendChild(empty);
            } else {
                galleryDefs.forEach(def => {
                    const card = this.buildGalleryQuickActionCard(def);
                    galleryContainer.appendChild(card);
                });
            }
        }

        if (window.feather) window.feather.replace();
    },

    buildActiveQuickActionCard: function(def) {
        const card = Utils.createElement('div', { className: 'quick-action-card' });
        card.setAttribute('data-addon-id', def.id);

        const header = Utils.createElement('div', { className: 'quick-action-card-header' });
        const iconWrap = Utils.createElement('div', { className: 'quick-action-card-icon' });
        iconWrap.innerHTML = window.feather?.icons[def.icon || 'zap']?.toSvg() || '';
        header.appendChild(iconWrap);

        const headerText = Utils.createElement('div', { className: 'quick-action-card-text' });
        headerText.appendChild(Utils.createElement('h4', { className: 'quick-action-card-title', text: def.name }));
        const tags = Utils.createElement('div', { className: 'quick-action-card-tags' });
        tags.appendChild(Utils.createElement('span', { className: 'quick-action-card-tag', text: this.getQuickActionSourceLabel(def) }));
        headerText.appendChild(tags);
        header.appendChild(headerText);
        card.appendChild(header);

        if (def.description) {
            card.appendChild(Utils.createElement('p', { className: 'quick-action-card-description', text: def.description }));
        }

        const summary = this.buildQuickActionSummary(def);
        if (summary.length) {
            const pillRow = Utils.createElement('div', { className: 'quick-action-card-tags' });
            summary.forEach(text => pillRow.appendChild(Utils.createElement('span', { className: 'quick-action-card-tag', text })));
            card.appendChild(pillRow);
        }

        const footer = Utils.createElement('div', { className: 'quick-action-card-footer' });
        const actions = Utils.createElement('div', { className: 'quick-action-card-actions' });

        if (def.source === 'custom') {
            const editButton = Utils.createElement('button', { className: 'secondary', text: LocalizationRenderer.t('workflow_button_edit') });
            editButton.setAttribute('data-action', 'edit-addon');
            editButton.setAttribute('data-addon-id', def.id);
            actions.appendChild(editButton);
        }

        const removeButton = Utils.createElement('button', { className: 'danger', text: LocalizationRenderer.t('addons_remove_button') });
        removeButton.setAttribute('data-action', 'remove-addon');
        removeButton.setAttribute('data-addon-id', def.id);
        actions.appendChild(removeButton);

        footer.appendChild(actions);
        card.appendChild(footer);
        return card;
    },

    buildGalleryQuickActionCard: function(def) {
        const card = Utils.createElement('div', { className: 'quick-action-card gallery-card' });
        card.setAttribute('data-addon-id', def.id);

        const header = Utils.createElement('div', { className: 'quick-action-card-header' });
        const iconWrap = Utils.createElement('div', { className: 'quick-action-card-icon' });
        iconWrap.innerHTML = window.feather?.icons[def.icon || 'zap']?.toSvg() || '';
        header.appendChild(iconWrap);

        const headerText = Utils.createElement('div', { className: 'quick-action-card-text' });
        headerText.appendChild(Utils.createElement('h4', { className: 'quick-action-card-title', text: def.name }));
        const tags = Utils.createElement('div', { className: 'quick-action-card-tags' });
        tags.appendChild(Utils.createElement('span', { className: 'quick-action-card-tag', text: this.getQuickActionSourceLabel(def) }));
        headerText.appendChild(tags);
        header.appendChild(headerText);
        card.appendChild(header);

        if (def.description) {
            card.appendChild(Utils.createElement('p', { className: 'quick-action-card-description', text: def.description }));
        }

        const summary = this.buildQuickActionSummary(def);
        if (summary.length) {
            const pillRow = Utils.createElement('div', { className: 'quick-action-card-tags' });
            summary.forEach(text => pillRow.appendChild(Utils.createElement('span', { className: 'quick-action-card-tag', text })));
            card.appendChild(pillRow);
        }

        const footer = Utils.createElement('div', { className: 'quick-action-card-footer' });
        const actions = Utils.createElement('div', { className: 'quick-action-card-actions' });

        const addButton = Utils.createElement('button', { text: LocalizationRenderer.t('addons_gallery_add') });
        addButton.setAttribute('data-action', 'add-addon');
        addButton.setAttribute('data-addon-id', def.id);
        actions.appendChild(addButton);

        if (def.source === 'custom') {
            const editButton = Utils.createElement('button', { className: 'secondary', text: LocalizationRenderer.t('workflow_button_edit') });
            editButton.setAttribute('data-action', 'edit-addon');
            editButton.setAttribute('data-addon-id', def.id);
            actions.appendChild(editButton);

            const deleteButton = Utils.createElement('button', { className: 'danger', text: LocalizationRenderer.t('addon_delete_custom') });
            deleteButton.setAttribute('data-action', 'delete-custom-addon');
            deleteButton.setAttribute('data-addon-id', def.id);
            actions.appendChild(deleteButton);
        }

        footer.appendChild(actions);
        card.appendChild(footer);
        return card;
    },

    getQuickActionSourceLabel: function(def) {
        if (def.source === 'builtin') return LocalizationRenderer.t('quick_action_badge_builtin');
        if (def.source === 'custom') return LocalizationRenderer.t('quick_action_badge_custom');
        if (def.source === 'library') return LocalizationRenderer.t('quick_action_badge_library');
        return LocalizationRenderer.t('quick_action_badge_unknown');
    },

    buildQuickActionSummary: function(def) {
        const summary = [];
        if (def.workflow && Array.isArray(def.workflow.nodes)) {
            def.workflow.nodes.forEach(node => {
                const module = WorkflowModules.find(item => item.id === node.moduleId);
                if (module) summary.push(module.name);
            });
        } else if (Array.isArray(def.blocks) && def.blocks.length) {
            def.blocks.forEach(block => {
                const blockId = typeof block === 'string' ? block : block.id;
                const blockDef = AddonBuilderBlocks.find(item => item.id === blockId);
                if (blockDef) summary.push(LocalizationRenderer.t(blockDef.nameKey));
                else summary.push(blockId);
            });
        }
        return summary;
    },

    renderAddonBuilder: function() {
        this.renderBuilderPreview();
        this.renderCustomQuickActions();
    },

    renderBuilderPreview: function() {
        const preview = Utils.getElement('#builder-preview-grid');
        if (!preview) return;
        preview.innerHTML = '';
        const activeDefs = QuickActionManager.getActiveDefinitions().slice(0, 4);
        if (!activeDefs.length) {
            const empty = Utils.createElement('div', { className: 'builder-preview-card' });
            empty.appendChild(Utils.createElement('strong', { text: LocalizationRenderer.t('workflow_preview_empty_title') }));
            const pills = Utils.createElement('div', { className: 'builder-preview-pills' });
            pills.appendChild(Utils.createElement('span', { className: 'builder-preview-pill', text: LocalizationRenderer.t('workflow_preview_empty_hint') }));
            empty.appendChild(pills);
            preview.appendChild(empty);
        } else {
            activeDefs.forEach(def => {
                const card = Utils.createElement('div', { className: 'builder-preview-card' });
                card.appendChild(Utils.createElement('strong', { text: def.name }));
                if (def.description) {
                    card.appendChild(Utils.createElement('div', { className: 'builder-subtitle', text: def.description }));
                }
                const pills = Utils.createElement('div', { className: 'builder-preview-pills' });
                this.buildQuickActionSummary(def).slice(0, 3).forEach(text => pills.appendChild(Utils.createElement('span', { className: 'builder-preview-pill', text })));
                card.appendChild(pills);
                preview.appendChild(card);
            });
        }
        if (window.feather) window.feather.replace(preview);
    },

    renderCustomQuickActions: function() {
        const container = Utils.getElement('#custom-quick-actions-list');
        if (!container) return;
        container.innerHTML = '';
        const customAddons = Array.isArray(AppState.settings.customAddons) ? [...AppState.settings.customAddons] : [];
        if (!customAddons.length) {
            const empty = Utils.createElement('div', { className: 'addons-empty', text: LocalizationRenderer.t('workflow_custom_empty') });
            container.appendChild(empty);
            return;
        }
        const activeIds = new Set(QuickActionManager.getActiveIds());
        customAddons.forEach(addon => {
            const card = this.buildCustomQuickActionCard(addon, activeIds.has(addon.id));
            container.appendChild(card);
        });
        if (window.feather) window.feather.replace(container);
    },

    buildCustomQuickActionCard: function(addon, isActive) {
        const def = QuickActionManager.resolveDefinition(addon.id) || { ...addon, name: addon.name, description: addon.description, icon: addon.icon };
        const card = Utils.createElement('div', { className: 'quick-action-card' });
        card.setAttribute('data-addon-id', addon.id);

        const header = Utils.createElement('div', { className: 'quick-action-card-header' });
        const iconWrap = Utils.createElement('div', { className: 'quick-action-card-icon' });
        iconWrap.innerHTML = window.feather?.icons[def.icon || 'layers']?.toSvg() || '';
        header.appendChild(iconWrap);

        const headerText = Utils.createElement('div', { className: 'quick-action-card-text' });
        headerText.appendChild(Utils.createElement('h4', { className: 'quick-action-card-title', text: def.name || addon.name }));
        const tags = Utils.createElement('div', { className: 'quick-action-card-tags' });
        tags.appendChild(Utils.createElement('span', { className: 'quick-action-card-tag', text: LocalizationRenderer.t('quick_action_badge_custom') }));
        headerText.appendChild(tags);
        header.appendChild(headerText);
        card.appendChild(header);

        if (def.description) {
            card.appendChild(Utils.createElement('p', { className: 'quick-action-card-description', text: def.description }));
        }

        const summary = this.buildQuickActionSummary(def);
        if (summary.length) {
            const pillRow = Utils.createElement('div', { className: 'quick-action-card-tags' });
            summary.slice(0, 4).forEach(text => pillRow.appendChild(Utils.createElement('span', { className: 'quick-action-card-tag', text })));
            card.appendChild(pillRow);
        }

        const footer = Utils.createElement('div', { className: 'quick-action-card-footer' });
        const actions = Utils.createElement('div', { className: 'quick-action-card-actions' });

        const toggleButton = Utils.createElement('button', { text: LocalizationRenderer.t(isActive ? 'workflow_button_remove_pin' : 'workflow_button_add_pin') });
        toggleButton.setAttribute('data-action', isActive ? 'remove-addon' : 'add-addon');
        toggleButton.setAttribute('data-addon-id', addon.id);
        actions.appendChild(toggleButton);

        const editButton = Utils.createElement('button', { className: 'secondary', text: LocalizationRenderer.t('workflow_button_edit') });
        editButton.setAttribute('data-action', 'edit-addon');
        editButton.setAttribute('data-addon-id', addon.id);
        actions.appendChild(editButton);

        const deleteButton = Utils.createElement('button', { className: 'danger', text: LocalizationRenderer.t('addon_delete_custom') });
        deleteButton.setAttribute('data-action', 'delete-custom-addon');
        deleteButton.setAttribute('data-addon-id', addon.id);
        actions.appendChild(deleteButton);

        footer.appendChild(actions);
        card.appendChild(footer);
        return card;
    },

    addAddonFromGallery: function(id) {
        if (!id) return;
        QuickActionManager.addQuickAction(id);
        this.renderAddons();
    },

    removeActiveAddon: function(id) {
        if (!id) return;
        QuickActionManager.removeQuickAction(id);
        this.renderAddons();
    },

    deleteCustomAddon: function(id) {
        if (!id) return;
        const customAddons = Array.isArray(AppState.settings.customAddons) ? [...AppState.settings.customAddons] : [];
        if (!customAddons.some(addon => addon.id === id)) return;
        if (!window.confirm(LocalizationRenderer.t('addon_delete_custom_confirm'))) return;
        const updatedCustom = customAddons.filter(addon => addon.id !== id);
        AppState.settings.customAddons = updatedCustom;
        ipcRenderer.send('update-setting', 'customAddons', updatedCustom);
        QuickActionManager.removeQuickAction(id);
        this.renderAddons();
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

const WorkflowBuilder = {
    overlay: null,
    paletteContainer: null,
    moduleSearch: null,
    canvas: null,
    emptyState: null,
    inspectorForm: null,
    inspectorEmpty: null,
    nameInput: null,
    iconSelect: null,
    descriptionInput: null,
    templateDrawer: null,
    templateContent: null,
    currentState: null,
    currentTemplateFilter: '',

    init() {
        this.overlay = Utils.getElement('#workflow-builder-overlay');
        this.paletteContainer = Utils.getElement('#workflow-palette-groups');
        this.moduleSearch = Utils.getElement('#workflow-module-search');
        this.canvas = Utils.getElement('#workflow-canvas');
        this.emptyState = Utils.getElement('#workflow-empty-state');
        this.inspectorForm = Utils.getElement('#workflow-inspector-form');
        this.inspectorEmpty = Utils.getElement('#workflow-inspector-empty');
        this.nameInput = Utils.getElement('#workflow-name-input');
        this.iconSelect = Utils.getElement('#workflow-icon-input');
        this.descriptionInput = Utils.getElement('#workflow-description-input');
        this.templateDrawer = Utils.getElement('#addon-template-drawer');
        this.templateContent = Utils.getElement('#template-drawer-content');

        this.renderPalette();
        this.populateIconSelect();
        this.renderTemplates();

        Utils.getAllElements('[data-overlay-close="workflow-builder"]').forEach(el => el.addEventListener('click', () => this.close()));
        Utils.getAllElements('[data-overlay-close="template-drawer"]').forEach(el => el.addEventListener('click', () => this.closeTemplateDrawer()));

        Utils.getElement('#workflow-builder-save')?.addEventListener('click', () => this.save());
        Utils.getElement('#workflow-builder-cancel')?.addEventListener('click', () => this.close());

        if (this.moduleSearch) {
            this.moduleSearch.addEventListener('input', Utils.debounce((event) => {
                this.currentTemplateFilter = event.target.value.trim().toLowerCase();
                this.renderPalette();
            }, 120));
        }

        if (this.canvas) {
            this.canvas.addEventListener('click', (event) => {
                const nodeEl = event.target.closest('.workflow-node');
                if (nodeEl) {
                    const nodeId = nodeEl.getAttribute('data-node-id');
                    this.selectNode(nodeId);
                }
                const control = event.target.closest('[data-node-action]');
                if (control) {
                    const nodeId = control.getAttribute('data-node-id');
                    const action = control.getAttribute('data-node-action');
                    if (action === 'remove') this.removeNode(nodeId);
                    else if (action === 'move-left') this.moveNode(nodeId, -1);
                    else if (action === 'move-right') this.moveNode(nodeId, 1);
                }
            });
        }

        if (this.inspectorForm) {
            this.inspectorForm.addEventListener('input', (event) => {
                const target = event.target;
                const nodeId = target.getAttribute('data-node-id');
                const fieldId = target.getAttribute('data-field-id');
                if (!nodeId || !fieldId) return;
                let value = target.value;
                if (target.type === 'number') {
                    const parsed = parseFloat(value);
                    value = Number.isFinite(parsed) ? parsed : 0;
                }
                this.updateNodeField(nodeId, fieldId, value);
            });
        }

        this.nameInput?.addEventListener('input', () => {
            if (!this.currentState) return;
            this.currentState.name = this.nameInput.value.trim();
        });
        this.iconSelect?.addEventListener('change', () => {
            if (!this.currentState) return;
            this.currentState.icon = this.iconSelect.value;
        });
        this.descriptionInput?.addEventListener('input', () => {
            if (!this.currentState) return;
            this.currentState.description = this.descriptionInput.value.trim();
        });
    },

    renderPalette() {
        if (!this.paletteContainer) return;
        this.paletteContainer.innerHTML = '';
        const grouped = WorkflowModules.reduce((acc, module) => {
            if (this.currentTemplateFilter) {
                const haystack = `${module.name} ${module.description}`.toLowerCase();
                if (!haystack.includes(this.currentTemplateFilter)) return acc;
            }
            if (!acc[module.category]) acc[module.category] = [];
            acc[module.category].push(module);
            return acc;
        }, {});

        Object.entries(grouped).forEach(([category, modules]) => {
            const group = Utils.createElement('div', { className: 'palette-group' });
            group.appendChild(Utils.createElement('h5', { text: category }));
            const items = Utils.createElement('div', { className: 'palette-items' });
            modules.forEach(module => {
                const item = Utils.createElement('div', { className: 'palette-item' });
                item.setAttribute('data-module-id', module.id);
                const icon = Utils.createElement('div', { className: 'palette-item-icon' });
                icon.innerHTML = window.feather?.icons[module.icon || 'box']?.toSvg() || '';
                const body = Utils.createElement('div', { className: 'palette-item-body' });
                body.appendChild(Utils.createElement('div', { className: 'palette-item-title', text: module.name }));
                body.appendChild(Utils.createElement('div', { className: 'palette-item-description', text: module.description }));
                item.appendChild(icon);
                item.appendChild(body);
                item.addEventListener('click', () => this.addModule(module.id));
                items.appendChild(item);
            });
            group.appendChild(items);
            this.paletteContainer.appendChild(group);
        });

        if (window.feather) window.feather.replace(this.paletteContainer);
    },

    populateIconSelect() {
        if (!this.iconSelect || this.iconSelect.childElementCount) return;
        QuickActionIconChoices.forEach(iconName => {
            const option = document.createElement('option');
            option.value = iconName;
            option.textContent = iconName;
            this.iconSelect.appendChild(option);
        });
    },

    renderTemplates() {
        if (!this.templateContent) return;
        this.templateContent.innerHTML = '';
        WorkflowTemplates.forEach(template => {
            const card = Utils.createElement('div', { className: 'template-card' });
            card.appendChild(Utils.createElement('h4', { text: template.name }));
            card.appendChild(Utils.createElement('p', { text: template.description }));
            const button = Utils.createElement('button', { text: LocalizationRenderer.t('workflow_template_use') });
            button.addEventListener('click', () => {
                this.closeTemplateDrawer();
                this.open(null, template);
            });
            card.appendChild(button);
            this.templateContent.appendChild(card);
        });
    },

    open(existingId = null, template = null) {
        let preset = null;
        if (existingId) {
            const existing = (AppState.settings.customAddons || []).find(addon => addon.id === existingId);
            if (!existing) return;
            preset = {
                id: existing.id,
                name: existing.name,
                description: existing.description,
                icon: existing.icon || 'layers',
                workflow: existing.workflow || { nodes: [] }
            };
        } else if (template) {
            preset = {
                id: null,
                name: template.quickAction?.name || template.name,
                description: template.quickAction?.description || template.description,
                icon: template.quickAction?.icon || 'layers',
                workflow: { nodes: template.nodes.map(node => ({ moduleId: node.moduleId, config: { ...node.config } })) }
            };
        }

        this.currentState = {
            id: preset?.id || null,
            name: preset?.name || '',
            description: preset?.description || '',
            icon: preset?.icon || QuickActionIconChoices[0],
            nodes: (preset?.workflow?.nodes || []).map(node => ({
                id: `node-${crypto.randomUUID?.() || Date.now() + Math.random()}`,
                moduleId: node.moduleId,
                config: { ...WorkflowBuilder.getDefaultConfig(node.moduleId), ...(node.config || {}) }
            })),
            selectedNodeId: null
        };

        if (this.nameInput) this.nameInput.value = this.currentState.name;
        if (this.iconSelect) this.iconSelect.value = this.currentState.icon;
        if (this.descriptionInput) this.descriptionInput.value = this.currentState.description;

        this.renderCanvas();
        this.renderInspector();
        this.showOverlay();
    },

    close() {
        if (!this.overlay) return;
        this.overlay.classList.remove('visible');
        this.overlay.classList.add('hidden');
        document.body.classList.remove('modal-open');
        this.currentState = null;
        this.clearCanvas();
        this.renderInspector();
    },

    showOverlay() {
        if (!this.overlay) return;
        this.overlay.classList.remove('hidden');
        this.overlay.classList.add('visible');
        document.body.classList.add('modal-open');
        if (window.feather) window.feather.replace(this.overlay);
    },

    clearCanvas() {
        if (this.canvas) this.canvas.innerHTML = '';
        if (this.emptyState) this.emptyState.classList.remove('hidden');
    },

    addModule(moduleId) {
        if (!this.currentState) return;
        const module = WorkflowModules.find(item => item.id === moduleId);
        if (!module) return;
        const node = {
            id: `node-${crypto.randomUUID?.() || Date.now() + Math.random()}`,
            moduleId,
            config: { ...module.defaultConfig }
        };
        this.currentState.nodes.push(node);
        this.currentState.selectedNodeId = node.id;
        this.renderCanvas();
        this.renderInspector();
    },

    selectNode(nodeId) {
        if (!this.currentState) return;
        this.currentState.selectedNodeId = nodeId;
        this.renderCanvas();
        this.renderInspector();
    },

    removeNode(nodeId) {
        if (!this.currentState) return;
        this.currentState.nodes = this.currentState.nodes.filter(node => node.id !== nodeId);
        if (this.currentState.selectedNodeId === nodeId) {
            this.currentState.selectedNodeId = this.currentState.nodes[0]?.id || null;
        }
        this.renderCanvas();
        this.renderInspector();
    },

    moveNode(nodeId, direction) {
        if (!this.currentState) return;
        const index = this.currentState.nodes.findIndex(node => node.id === nodeId);
        if (index === -1) return;
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= this.currentState.nodes.length) return;
        const [node] = this.currentState.nodes.splice(index, 1);
        this.currentState.nodes.splice(newIndex, 0, node);
        this.renderCanvas();
    },

    updateNodeField(nodeId, fieldId, value) {
        if (!this.currentState) return;
        const node = this.currentState.nodes.find(item => item.id === nodeId);
        if (!node) return;
        node.config = { ...node.config, [fieldId]: value };
    },

    renderCanvas() {
        if (!this.canvas) return;
        this.canvas.innerHTML = '';
        if (!this.currentState || this.currentState.nodes.length === 0) {
            if (this.emptyState) this.emptyState.classList.remove('hidden');
            return;
        }
        if (this.emptyState) this.emptyState.classList.add('hidden');
        this.currentState.nodes.forEach(node => this.canvas.appendChild(this.createNodeElement(node)));
        if (window.feather) window.feather.replace(this.canvas);
    },

    createNodeElement(node) {
        const module = WorkflowModules.find(item => item.id === node.moduleId);
        const el = Utils.createElement('div', { className: 'workflow-node' });
        el.setAttribute('data-node-id', node.id);
        if (this.currentState.selectedNodeId === node.id) el.classList.add('active');

        const header = Utils.createElement('div', { className: 'workflow-node-header' });
        const icon = Utils.createElement('div', { className: 'workflow-node-icon' });
        icon.innerHTML = window.feather?.icons[module?.icon || 'box']?.toSvg() || '';
        header.appendChild(icon);
        const title = Utils.createElement('div', { className: 'workflow-node-title' });
        title.appendChild(Utils.createElement('strong', { text: module?.name || node.moduleId }));
        title.appendChild(Utils.createElement('span', { text: module?.category || '' }));
        header.appendChild(title);
        el.appendChild(header);

        const body = Utils.createElement('div', { className: 'workflow-node-body' });
        Object.entries(node.config || {}).slice(0, 3).forEach(([key, val]) => {
            body.appendChild(Utils.createElement('div', { text: `${key}: ${val}` }));
        });
        el.appendChild(body);

        const footer = Utils.createElement('div', { className: 'workflow-node-footer' });
        const controls = Utils.createElement('div', { className: 'workflow-node-controls' });
        [['move-left', 'arrow-left'], ['move-right', 'arrow-right'], ['remove', 'trash-2']].forEach(([action, iconName]) => {
            const button = Utils.createElement('button', {});
            button.setAttribute('data-node-action', action);
            button.setAttribute('data-node-id', node.id);
            button.innerHTML = window.feather?.icons[iconName]?.toSvg() || iconName;
            controls.appendChild(button);
        });
        footer.appendChild(controls);
        el.appendChild(footer);
        return el;
    },

    renderInspector() {
        if (!this.inspectorForm || !this.inspectorEmpty) return;
        this.inspectorForm.innerHTML = '';
        if (!this.currentState || !this.currentState.selectedNodeId) {
            this.inspectorForm.classList.add('hidden');
            this.inspectorEmpty.classList.remove('hidden');
            return;
        }
        const node = this.currentState.nodes.find(item => item.id === this.currentState.selectedNodeId);
        const module = WorkflowModules.find(item => item.id === node?.moduleId);
        if (!node || !module) {
            this.inspectorForm.classList.add('hidden');
            this.inspectorEmpty.classList.remove('hidden');
            return;
        }
        this.inspectorForm.classList.remove('hidden');
        this.inspectorEmpty.classList.add('hidden');
        module.fields.forEach(field => {
            const wrapper = Utils.createElement('div', { className: 'inspector-field' });
            wrapper.appendChild(Utils.createElement('label', { text: field.label }));
            let input;
            if (field.type === 'textarea') input = document.createElement('textarea');
            else if (field.type === 'select') {
                input = document.createElement('select');
                (field.options || []).forEach(option => {
                    const opt = document.createElement('option');
                    opt.value = option.value;
                    opt.textContent = option.label;
                    input.appendChild(opt);
                });
            } else {
                input = document.createElement('input');
                input.type = field.type === 'number' ? 'number' : 'text';
                if (field.min !== undefined) input.min = field.min;
                if (field.max !== undefined) input.max = field.max;
                if (field.step !== undefined) input.step = field.step;
            }
            input.value = node.config?.[field.id] ?? field.defaultValue ?? '';
            if (field.placeholder) input.placeholder = field.placeholder;
            input.setAttribute('data-node-id', node.id);
            input.setAttribute('data-field-id', field.id);
            wrapper.appendChild(input);
            this.inspectorForm.appendChild(wrapper);
        });
    },

    save() {
        if (!this.currentState) return;
        const name = (this.currentState.name || '').trim();
        if (!name) {
            alert(LocalizationRenderer.t('workflow_builder_error_name_required'));
            return;
        }
        if (this.currentState.nodes.length === 0) {
            alert(LocalizationRenderer.t('workflow_builder_error_nodes_required'));
            return;
        }

        const quickAction = {
            id: this.currentState.id || `workflow-${Date.now()}`,
            name,
            description: this.currentState.description,
            icon: this.currentState.icon,
            type: 'workflow',
            workflow: {
                nodes: this.currentState.nodes.map(node => ({
                    id: node.id,
                    moduleId: node.moduleId,
                    config: node.config
                }))
            }
        };

        const customAddons = Array.isArray(AppState.settings.customAddons) ? [...AppState.settings.customAddons] : [];
        const existingIndex = customAddons.findIndex(addon => addon.id === quickAction.id);
        if (existingIndex >= 0) customAddons.splice(existingIndex, 1, quickAction);
        else customAddons.push(quickAction);
        AppState.settings.customAddons = customAddons;
        ipcRenderer.send('update-setting', 'customAddons', customAddons);
        QuickActionManager.ensureQuickActionActive(quickAction.id);
        SettingsModule.renderAddons();
        SettingsModule.renderAddonBuilder();
        this.close();
    },

    openTemplateDrawer() {
        if (!this.templateDrawer) return;
        this.templateDrawer.classList.add('visible');
        document.body.classList.add('modal-open');
    },

    closeTemplateDrawer() {
        if (!this.templateDrawer) return;
        this.templateDrawer.classList.remove('visible');
        document.body.classList.remove('modal-open');
    }
};

WorkflowBuilder.getDefaultConfig = function(moduleId) {
    const module = WorkflowModules.find(item => item.id === moduleId);
    return module ? { ...module.defaultConfig } : {};
};

const WorkflowRuntime = {
    overlay: null,
    stepsContainer: null,
    logContainer: null,
    descriptionField: null,
    titleField: null,
    timers: [],

    init() {
        this.overlay = Utils.getElement('#workflow-runner-overlay');
        this.stepsContainer = Utils.getElement('#workflow-runner-steps');
        this.logContainer = Utils.getElement('#workflow-runner-log');
        this.descriptionField = Utils.getElement('#workflow-runner-description');
        this.titleField = Utils.getElement('#workflow-runner-title');
        Utils.getAllElements('[data-overlay-close="workflow-runner"], #workflow-runner-close').forEach(el => el?.addEventListener('click', () => this.close()));
    },

    open(definition) {
        if (!this.overlay) return;
        this.clear();
        if (this.titleField) this.titleField.textContent = definition.name || LocalizationRenderer.t('workflow_runner_title');
        if (this.descriptionField) this.descriptionField.textContent = definition.description || '';
        this.buildSteps(definition).forEach(step => this.stepsContainer.appendChild(step));
        this.overlay.classList.remove('hidden');
        this.overlay.classList.add('visible');
        document.body.classList.add('modal-open');
        this.simulate(definition);
        if (window.feather) window.feather.replace(this.overlay);
    },

    close() {
        if (!this.overlay) return;
        this.overlay.classList.remove('visible');
        this.overlay.classList.add('hidden');
        document.body.classList.remove('modal-open');
        this.clear();
    },

    clear() {
        this.stepsContainer?.replaceChildren();
        this.logContainer?.replaceChildren();
        this.timers.forEach(timer => clearTimeout(timer));
        this.timers = [];
    },

    buildSteps(definition) {
        const steps = [];
        const nodes = definition.workflow?.nodes;
        if (Array.isArray(nodes) && nodes.length) {
            nodes.forEach((node, index) => {
                const module = WorkflowModules.find(item => item.id === node.moduleId);
                const step = Utils.createElement('div', { className: 'workflow-runner-step' });
                const icon = Utils.createElement('div', { className: 'workflow-runner-step-icon' });
                icon.innerHTML = window.feather?.icons[module?.icon || 'box']?.toSvg() || '';
                const body = Utils.createElement('div', { className: 'workflow-runner-step-details' });
                body.appendChild(Utils.createElement('strong', { text: module?.name || node.moduleId }));
                body.appendChild(Utils.createElement('span', { text: `${LocalizationRenderer.t('workflow_runner_step')} ${index + 1}` }));
                step.appendChild(icon);
                step.appendChild(body);
                steps.push(step);
            });
        } else if (Array.isArray(definition.blocks)) {
            definition.blocks.forEach((block, index) => {
                const blockId = typeof block === 'string' ? block : block.id;
                const step = Utils.createElement('div', { className: 'workflow-runner-step' });
                const icon = Utils.createElement('div', { className: 'workflow-runner-step-icon' });
                icon.innerHTML = window.feather?.icons['layers']?.toSvg() || '';
                const body = Utils.createElement('div', { className: 'workflow-runner-step-details' });
                body.appendChild(Utils.createElement('strong', { text: blockId }));
                body.appendChild(Utils.createElement('span', { text: `${LocalizationRenderer.t('workflow_runner_step')} ${index + 1}` }));
                step.appendChild(icon);
                step.appendChild(body);
                steps.push(step);
            });
        }
        return steps;
    },

    simulate(definition) {
        const nodes = definition.workflow?.nodes || [];
        if (!nodes.length) {
            this.log(LocalizationRenderer.t('workflow_runner_no_steps'));
            return;
        }
        nodes.forEach((node, index) => {
            const module = WorkflowModules.find(item => item.id === node.moduleId);
            const delay = index * 650;
            this.timers.push(setTimeout(() => {
                this.log(`${LocalizationRenderer.t('workflow_runner_running')} ${module?.name || node.moduleId}`);
                if (index === nodes.length - 1) {
                    this.timers.push(setTimeout(() => this.log(LocalizationRenderer.t('workflow_runner_complete')), 600));
                }
            }, delay));
        });
    },

    log(message) {
        if (!this.logContainer) return;
        const entry = Utils.createElement('div', { className: 'workflow-runner-log-entry' });
        entry.textContent = message;
        this.logContainer.appendChild(entry);
        this.logContainer.scrollTop = this.logContainer.scrollHeight;
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
    QuickActionManager.init();
    WorkflowBuilder.init();
    WorkflowRuntime.init();

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
        ViewManager.applyAppearanceSettings();
        LocalizationRenderer.applyTranslations();
        SettingsModule.populateSettingsUI();
        QuickActionManager.render();
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
