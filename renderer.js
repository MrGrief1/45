// renderer.js
const { ipcRenderer, shell } = require('electron');
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

const QuickActionBuiltins = [
    { id: 'apps-library', icon: 'grid', labelKey: 'title_apps_library', descriptionKey: 'quick_actions_builtin_apps', type: 'panel', payload: 'apps-library', category: 'system', default: true },
    { id: 'files', icon: 'folder', labelKey: 'title_files', descriptionKey: 'quick_actions_builtin_files', type: 'panel', payload: 'files', category: 'system', default: true },
    { id: 'commands', icon: 'command', labelKey: 'title_commands', descriptionKey: 'quick_actions_builtin_commands', type: 'panel', payload: 'commands', category: 'system', default: true },
    { id: 'clipboard', icon: 'copy', labelKey: 'title_clipboard', descriptionKey: 'quick_actions_builtin_clipboard', type: 'panel', payload: 'clipboard', category: 'system', default: true },
    { id: 'settings', icon: 'settings', labelKey: 'context_settings', descriptionKey: 'quick_actions_builtin_settings', type: 'view', payload: 'settings', category: 'system', default: true },
    { id: 'web-search', icon: 'globe', labelKey: 'quick_actions_builtin_web', descriptionKey: 'quick_actions_builtin_web_desc', type: 'custom', payload: 'web-search', category: 'intelligence', default: false },
    { id: 'calculator', icon: 'cpu', labelKey: 'quick_actions_builtin_calculator', descriptionKey: 'quick_actions_builtin_calculator_desc', type: 'custom', payload: 'calculator', category: 'intelligence', default: false }
];

const QuickActionLibrary = [
    {
        id: 'clipboard-buffer',
        icon: 'clipboard',
        nameKey: 'addon_library_clipboard_name',
        descriptionKey: 'addon_library_clipboard_description',
        workflow: {
            nodes: [
                { id: 'node-trigger', moduleId: 'trigger-clipboard', position: { x: 40, y: 180 }, settings: { mode: 'any' } },
                { id: 'node-filter', moduleId: 'action-filter-text', position: { x: 320, y: 160 }, settings: { pattern: '' } },
                { id: 'node-pin', moduleId: 'output-pin-board', position: { x: 600, y: 190 }, settings: { folder: 'inbox' } }
            ],
            connections: [
                { from: 'node-trigger', to: 'node-filter' },
                { from: 'node-filter', to: 'node-pin' }
            ]
        }
    },
    {
        id: 'note-canvas',
        icon: 'edit-3',
        nameKey: 'addon_library_note_name',
        descriptionKey: 'addon_library_note_description',
        workflow: {
            nodes: [
                { id: 'node-trigger', moduleId: 'trigger-shortcut', position: { x: 60, y: 160 }, settings: { shortcut: 'Alt+N' } },
                { id: 'node-template', moduleId: 'action-template', position: { x: 340, y: 160 }, settings: { template: 'New note at {{time}}' } },
                { id: 'node-output', moduleId: 'output-open-note', position: { x: 620, y: 160 }, settings: { workspace: 'personal' } }
            ],
            connections: [
                { from: 'node-trigger', to: 'node-template' },
                { from: 'node-template', to: 'node-output' }
            ]
        }
    },
    {
        id: 'workflow-launcher',
        icon: 'zap',
        nameKey: 'addon_library_command_name',
        descriptionKey: 'addon_library_command_description',
        workflow: {
            nodes: [
                { id: 'node-trigger', moduleId: 'trigger-command', position: { x: 60, y: 120 }, settings: { command: 'deploy' } },
                { id: 'node-confirm', moduleId: 'utility-approval', position: { x: 360, y: 120 }, settings: { question: 'Deploy production?' } },
                { id: 'node-run', moduleId: 'action-run-script', position: { x: 640, y: 120 }, settings: { script: 'deploy.ps1' } },
                { id: 'node-notify', moduleId: 'output-notify', position: { x: 920, y: 120 }, settings: { channel: 'teams', level: 'info' } }
            ],
            connections: [
                { from: 'node-trigger', to: 'node-confirm' },
                { from: 'node-confirm', to: 'node-run' },
                { from: 'node-run', to: 'node-notify' }
            ]
        }
    }
];

const WorkbenchCategories = [
    { id: 'triggers', nameKey: 'workbench_category_triggers' },
    { id: 'actions', nameKey: 'workbench_category_actions' },
    { id: 'outputs', nameKey: 'workbench_category_outputs' },
    { id: 'utilities', nameKey: 'workbench_category_utilities' }
];

const WorkbenchModules = [
    {
        id: 'trigger-search',
        category: 'triggers',
        icon: 'search',
        nameKey: 'workbench_module_trigger_search',
        descriptionKey: 'workbench_module_trigger_search_desc',
        defaultTitleKey: 'workbench_module_trigger_search_title',
        fields: [
            { id: 'pattern', type: 'text', labelKey: 'workbench_field_pattern', placeholderKey: 'workbench_field_pattern_placeholder', defaultValue: '' },
            { id: 'caseSensitive', type: 'toggle', labelKey: 'workbench_field_case_sensitive', defaultValue: false }
        ]
    },
    {
        id: 'trigger-clipboard',
        category: 'triggers',
        icon: 'clipboard',
        nameKey: 'workbench_module_trigger_clipboard',
        descriptionKey: 'workbench_module_trigger_clipboard_desc',
        defaultTitleKey: 'workbench_module_trigger_clipboard_title',
        fields: [
            { id: 'mode', type: 'select', labelKey: 'workbench_field_clipboard_mode', options: ['any', 'text', 'images'], defaultValue: 'text' }
        ]
    },
    {
        id: 'trigger-shortcut',
        category: 'triggers',
        icon: 'key',
        nameKey: 'workbench_module_trigger_shortcut',
        descriptionKey: 'workbench_module_trigger_shortcut_desc',
        defaultTitleKey: 'workbench_module_trigger_shortcut_title',
        fields: [
            { id: 'shortcut', type: 'text', labelKey: 'workbench_field_shortcut', placeholderKey: 'workbench_field_shortcut_placeholder', defaultValue: 'Alt+Space' }
        ]
    },
    {
        id: 'trigger-command',
        category: 'triggers',
        icon: 'terminal',
        nameKey: 'workbench_module_trigger_command',
        descriptionKey: 'workbench_module_trigger_command_desc',
        defaultTitleKey: 'workbench_module_trigger_command_title',
        fields: [
            { id: 'command', type: 'text', labelKey: 'workbench_field_command', placeholderKey: 'workbench_field_command_placeholder', defaultValue: 'deploy' }
        ]
    },
    {
        id: 'action-filter-text',
        category: 'actions',
        icon: 'filter',
        nameKey: 'workbench_module_action_filter',
        descriptionKey: 'workbench_module_action_filter_desc',
        defaultTitleKey: 'workbench_module_action_filter_title',
        fields: [
            { id: 'pattern', type: 'text', labelKey: 'workbench_field_pattern', placeholderKey: 'workbench_field_pattern_placeholder', defaultValue: '' },
            { id: 'keepMatches', type: 'toggle', labelKey: 'workbench_field_keep_matches', defaultValue: true }
        ]
    },
    {
        id: 'action-template',
        category: 'actions',
        icon: 'edit-2',
        nameKey: 'workbench_module_action_template',
        descriptionKey: 'workbench_module_action_template_desc',
        defaultTitleKey: 'workbench_module_action_template_title',
        fields: [
            { id: 'template', type: 'textarea', labelKey: 'workbench_field_template', placeholderKey: 'workbench_field_template_placeholder', defaultValue: 'Hello {{name}}' }
        ]
    },
    {
        id: 'action-run-script',
        category: 'actions',
        icon: 'cpu',
        nameKey: 'workbench_module_action_run_script',
        descriptionKey: 'workbench_module_action_run_script_desc',
        defaultTitleKey: 'workbench_module_action_run_script_title',
        fields: [
            { id: 'script', type: 'text', labelKey: 'workbench_field_script', placeholderKey: 'workbench_field_script_placeholder', defaultValue: 'script.ps1' },
            { id: 'arguments', type: 'text', labelKey: 'workbench_field_arguments', placeholderKey: 'workbench_field_arguments_placeholder', defaultValue: '' }
        ]
    },
    {
        id: 'action-format-text',
        category: 'actions',
        icon: 'type',
        nameKey: 'workbench_module_action_format_text',
        descriptionKey: 'workbench_module_action_format_text_desc',
        defaultTitleKey: 'workbench_module_action_format_text_title',
        fields: [
            { id: 'transform', type: 'select', labelKey: 'workbench_field_transform', options: ['upper', 'lower', 'title', 'slug'], defaultValue: 'title' }
        ]
    },
    {
        id: 'output-pin-board',
        category: 'outputs',
        icon: 'bookmark',
        nameKey: 'workbench_module_output_pin',
        descriptionKey: 'workbench_module_output_pin_desc',
        defaultTitleKey: 'workbench_module_output_pin_title',
        fields: [
            { id: 'folder', type: 'text', labelKey: 'workbench_field_folder', placeholderKey: 'workbench_field_folder_placeholder', defaultValue: 'workspace' }
        ]
    },
    {
        id: 'output-open-note',
        category: 'outputs',
        icon: 'book-open',
        nameKey: 'workbench_module_output_note',
        descriptionKey: 'workbench_module_output_note_desc',
        defaultTitleKey: 'workbench_module_output_note_title',
        fields: [
            { id: 'workspace', type: 'select', labelKey: 'workbench_field_workspace', options: ['personal', 'team'], defaultValue: 'personal' }
        ]
    },
    {
        id: 'output-notify',
        category: 'outputs',
        icon: 'bell',
        nameKey: 'workbench_module_output_notify',
        descriptionKey: 'workbench_module_output_notify_desc',
        defaultTitleKey: 'workbench_module_output_notify_title',
        fields: [
            { id: 'channel', type: 'select', labelKey: 'workbench_field_channel', options: ['toast', 'teams', 'slack'], defaultValue: 'toast' },
            { id: 'level', type: 'select', labelKey: 'workbench_field_level', options: ['info', 'success', 'warning', 'error'], defaultValue: 'info' }
        ]
    },
    {
        id: 'output-copy',
        category: 'outputs',
        icon: 'copy',
        nameKey: 'workbench_module_output_copy',
        descriptionKey: 'workbench_module_output_copy_desc',
        defaultTitleKey: 'workbench_module_output_copy_title',
        fields: []
    },
    {
        id: 'utility-delay',
        category: 'utilities',
        icon: 'clock',
        nameKey: 'workbench_module_utility_delay',
        descriptionKey: 'workbench_module_utility_delay_desc',
        defaultTitleKey: 'workbench_module_utility_delay_title',
        fields: [
            { id: 'duration', type: 'number', labelKey: 'workbench_field_duration', placeholderKey: 'workbench_field_duration_placeholder', defaultValue: 2 }
        ]
    },
    {
        id: 'utility-approval',
        category: 'utilities',
        icon: 'help-circle',
        nameKey: 'workbench_module_utility_approval',
        descriptionKey: 'workbench_module_utility_approval_desc',
        defaultTitleKey: 'workbench_module_utility_approval_title',
        fields: [
            { id: 'question', type: 'text', labelKey: 'workbench_field_question', placeholderKey: 'workbench_field_question_placeholder', defaultValue: 'Continue?' }
        ]
    }
];

const LegacyBlockMappings = {
    'clipboard-filter': 'action-filter-text',
    'text-replace': 'action-format-text',
    'pin-items': 'output-pin-board',
    'sync': 'output-notify'
};

const QuickActionModule = {
    toolbarElement: null,
    manageButton: null,

    init() {
        this.toolbarElement = Utils.getElement('#quick-actions-scroll');
        this.manageButton = Utils.getElement('#quick-actions-manage');
        if (this.manageButton) {
            this.manageButton.addEventListener('click', () => this.openManager());
        }
        this.refreshAll();
    },

    refreshAll() {
        this.ensureDefaultSelection();
        this.renderToolbar();
        this.renderSettingsPanels();
    },

    ensureDefaultSelection() {
        const stored = Array.isArray(AppState.settings.activeAddons) ? [...AppState.settings.activeAddons] : [];
        if (stored.length === 0) {
            const defaults = QuickActionBuiltins.filter(item => item.default).map(item => item.id);
            AppState.settings.activeAddons = defaults;
            ipcRenderer.send('update-setting', 'activeAddons', defaults);
        }
        if (!Array.isArray(AppState.settings.customAddons)) {
            AppState.settings.customAddons = [];
            ipcRenderer.send('update-setting', 'customAddons', []);
        }
    },

    getActiveActionIds() {
        return Array.isArray(AppState.settings.activeAddons) ? [...new Set(AppState.settings.activeAddons)] : [];
    },

    setActiveActions(ids) {
        const sanitized = Array.isArray(ids) ? ids.filter(Boolean) : [];
        AppState.settings.activeAddons = sanitized;
        ipcRenderer.send('update-setting', 'activeAddons', sanitized);
        this.renderToolbar();
        this.renderSettingsPanels();
    },

    getDefinitionById(id) {
        if (!id) return null;
        const builtin = QuickActionBuiltins.find(item => item.id === id);
        if (builtin) return { ...builtin, source: 'builtin' };
        const library = QuickActionLibrary.find(item => item.id === id);
        if (library) return { ...library, source: 'library', type: 'workflow' };
        const custom = this.getCustomDefinitions().find(item => item.id === id);
        if (custom) return { ...custom, source: 'custom', type: 'workflow' };
        return null;
    },

    getCustomDefinitions() {
        const list = Array.isArray(AppState.settings.customAddons) ? AppState.settings.customAddons : [];
        return list.map(item => this.normalizeCustomAddon(item));
    },

    normalizeCustomAddon(addon) {
        if (!addon) return null;
        if (addon.workflow && Array.isArray(addon.workflow.nodes)) {
            return { ...addon, type: 'workflow', icon: addon.icon || 'layers' };
        }

        const baseId = addon.base || 'clipboard';
        const baseModule = {
            clipboard: 'trigger-clipboard',
            note: 'trigger-shortcut',
            command: 'trigger-command'
        }[baseId] || 'trigger-search';

        const nodes = [];
        const connections = [];

        const baseNodeId = `node-base-${Date.now()}`;
        nodes.push({ id: baseNodeId, moduleId: baseModule, position: { x: 40, y: 180 }, settings: {} });

        let previousId = baseNodeId;
        const blocks = Array.isArray(addon.blocks) ? addon.blocks : [];
        blocks.forEach((block, index) => {
            const blockId = typeof block === 'string' ? block : block?.id;
            const moduleId = LegacyBlockMappings[blockId] || 'action-format-text';
            const nodeId = `node-${index}-${Date.now()}`;
            nodes.push({
                id: nodeId,
                moduleId,
                position: { x: 260 + index * 240, y: 180 },
                settings: {}
            });
            connections.push({ from: previousId, to: nodeId });
            previousId = nodeId;
        });

        if (!blocks.length) {
            const nodeId = `node-output-${Date.now()}`;
            nodes.push({ id: nodeId, moduleId: 'output-copy', position: { x: 320, y: 180 }, settings: {} });
            connections.push({ from: previousId, to: nodeId });
        }

        return {
            id: addon.id || `legacy-${Date.now()}`,
            name: addon.name || 'Legacy quick action',
            description: addon.description || '',
            icon: addon.icon || 'layers',
            type: 'workflow',
            workflow: { nodes, connections }
        };
    },

    renderToolbar() {
        if (!this.toolbarElement) return;
        this.toolbarElement.innerHTML = '';

        const activeDefinitions = this.getActiveActionIds()
            .map(id => this.getDefinitionById(id))
            .filter(Boolean);

        activeDefinitions.forEach(def => {
            const button = Utils.createElement('button', { className: 'quick-action-button' });
            button.setAttribute('data-action-id', def.id);
            if (def.source === 'custom') button.classList.add('is-custom');
            const icon = def.icon || 'zap';
            button.innerHTML = window.feather?.icons[icon]
                ? window.feather.icons[icon].toSvg()
                : `<i data-feather="${icon}" class="icon"></i>`;
            button.title = this.getActionLabel(def);
            button.addEventListener('click', () => this.executeActionById(def.id));
            this.toolbarElement.appendChild(button);
        });

        if (window.feather) window.feather.replace();
    },

    refreshToolbarTitles() {
        if (!this.toolbarElement) return;
        this.toolbarElement.querySelectorAll('[data-action-id]').forEach(button => {
            const id = button.getAttribute('data-action-id');
            const def = this.getDefinitionById(id);
            if (def) button.title = this.getActionLabel(def);
        });
    },

    getActionLabel(definition) {
        if (!definition) return '';
        if (definition.labelKey) return LocalizationRenderer.t(definition.labelKey);
        if (definition.nameKey) return LocalizationRenderer.t(definition.nameKey);
        return definition.name || definition.id;
    },

    getActionDescription(definition) {
        if (!definition) return '';
        if (definition.descriptionKey) return LocalizationRenderer.t(definition.descriptionKey);
        return definition.description || '';
    },

    executeActionById(id) {
        const definition = this.getDefinitionById(id);
        if (!definition) return;
        this.executeAction(definition);
    },

    executeAction(definition) {
        if (!definition) return;
        if (definition.type === 'panel') {
            AuxPanelManager.togglePanel(definition.payload);
        } else if (definition.type === 'view') {
            ViewManager.switchView(definition.payload);
            if (definition.payload === 'settings') {
                SettingsModule.openTab('addons');
            }
        } else if (definition.type === 'workflow' || definition.source === 'custom' || definition.source === 'library') {
            WorkflowRunner.open(definition);
        } else if (definition.type === 'custom') {
            this.executeBuiltinCustom(definition);
        }
    },

    executeBuiltinCustom(definition) {
        if (!definition) return;
        switch (definition.payload) {
            case 'web-search':
                shell.openExternal('https://www.google.com/search?q=' + encodeURIComponent(Utils.getElement('#search-input')?.value || ''));
                break;
            case 'calculator':
                AuxPanelManager.showCalculator();
                break;
            default:
                console.warn('Unknown builtin quick action', definition);
        }
    },

    openManager() {
        ViewManager.switchView('settings');
        SettingsModule.openTab('addons');
    },

    renderSettingsPanels() {
        const activeContainer = Utils.getElement('#active-quick-actions');
        const galleryContainer = Utils.getElement('#quick-action-library');
        if (activeContainer) {
            activeContainer.innerHTML = '';
            const ids = this.getActiveActionIds();
            if (!ids.length) {
                activeContainer.appendChild(Utils.createElement('div', { className: 'addons-empty', text: LocalizationRenderer.t('quick_actions_active_empty') }));
            } else {
                ids.map(id => this.getDefinitionById(id)).filter(Boolean).forEach(def => {
                    activeContainer.appendChild(this.createActiveCard(def));
                });
            }
        }

        if (galleryContainer) {
            galleryContainer.innerHTML = '';
            const activeSet = new Set(this.getActiveActionIds());
            const allDefinitions = [
                ...QuickActionBuiltins,
                ...QuickActionLibrary,
                ...this.getCustomDefinitions()
            ];

            allDefinitions.forEach(def => {
                galleryContainer.appendChild(this.createGalleryCard(def, activeSet));
            });
        }

        if (window.feather) window.feather.replace();
    },

    createActiveCard(definition) {
        const card = Utils.createElement('div', { className: 'quick-action-card' });
        card.setAttribute('data-quick-action', definition.id);

        const iconWrap = Utils.createElement('div', { className: 'quick-action-card-icon' });
        const iconName = definition.icon || 'zap';
        iconWrap.innerHTML = window.feather?.icons[iconName]
            ? window.feather.icons[iconName].toSvg()
            : `<i data-feather="${iconName}"></i>`;
        card.appendChild(iconWrap);

        const info = Utils.createElement('div', { className: 'quick-action-card-info' });
        info.appendChild(Utils.createElement('h4', { text: this.getActionLabel(definition) }));
        info.appendChild(Utils.createElement('p', { text: this.getActionDescription(definition) }));

        const tagRow = Utils.createElement('div', { className: 'quick-action-card-tags' });
        const typeTag = Utils.createElement('span', { className: 'quick-action-tag', text: definition.source === 'custom' ? LocalizationRenderer.t('addon_tag_custom') : LocalizationRenderer.t('addon_tag_library') });
        tagRow.appendChild(typeTag);
        info.appendChild(tagRow);
        card.appendChild(info);

        const controls = Utils.createElement('div', { className: 'quick-action-card-controls' });
        const up = Utils.createElement('button', { className: 'quick-action-control', text: LocalizationRenderer.t('quick_actions_move_up') });
        up.setAttribute('data-action', 'move-up');
        up.setAttribute('data-quick-action', definition.id);
        const down = Utils.createElement('button', { className: 'quick-action-control', text: LocalizationRenderer.t('quick_actions_move_down') });
        down.setAttribute('data-action', 'move-down');
        down.setAttribute('data-quick-action', definition.id);
        const remove = Utils.createElement('button', { className: 'quick-action-control danger', text: LocalizationRenderer.t('quick_actions_remove') });
        remove.setAttribute('data-action', 'remove');
        remove.setAttribute('data-quick-action', definition.id);
        controls.appendChild(up);
        controls.appendChild(down);
        controls.appendChild(remove);
        card.appendChild(controls);
        return card;
    },

    createGalleryCard(definition, activeSet) {
        const card = Utils.createElement('div', { className: 'quick-action-card' });
        card.setAttribute('data-quick-action', definition.id);
        const iconWrap = Utils.createElement('div', { className: 'quick-action-card-icon' });
        const iconName = definition.icon || 'zap';
        iconWrap.innerHTML = window.feather?.icons[iconName]
            ? window.feather.icons[iconName].toSvg()
            : `<i data-feather="${iconName}"></i>`;
        card.appendChild(iconWrap);

        const info = Utils.createElement('div', { className: 'quick-action-card-info' });
        info.appendChild(Utils.createElement('h4', { text: this.getActionLabel(definition) }));
        info.appendChild(Utils.createElement('p', { text: this.getActionDescription(definition) }));
        card.appendChild(info);

        const controls = Utils.createElement('div', { className: 'quick-action-card-controls' });
        const isActive = activeSet.has(definition.id);
        const addButton = Utils.createElement('button', { className: 'quick-action-control', text: LocalizationRenderer.t(isActive ? 'quick_actions_gallery_added' : 'quick_actions_gallery_add') });
        addButton.setAttribute('data-action', 'add');
        addButton.setAttribute('data-quick-action', definition.id);
        if (isActive) {
            addButton.classList.add('disabled');
            addButton.disabled = true;
        }
        controls.appendChild(addButton);

        if (definition.source === 'custom') {
            const deleteButton = Utils.createElement('button', { className: 'quick-action-control danger', text: LocalizationRenderer.t('addon_delete_custom') });
            deleteButton.setAttribute('data-action', 'delete');
            deleteButton.setAttribute('data-quick-action', definition.id);
            controls.appendChild(deleteButton);
        }

        card.appendChild(controls);
        return card;
    },

    addActionToActive(id) {
        const current = this.getActiveActionIds();
        if (current.includes(id)) return;
        current.push(id);
        this.setActiveActions(current);
    },

    removeActiveAction(id) {
        const current = this.getActiveActionIds();
        this.setActiveActions(current.filter(item => item !== id));
    },

    moveActiveAction(id, direction) {
        const current = this.getActiveActionIds();
        const index = current.indexOf(id);
        if (index === -1) return;
        const swapWith = direction === 'up' ? index - 1 : index + 1;
        if (swapWith < 0 || swapWith >= current.length) return;
        const temp = current[swapWith];
        current[swapWith] = current[index];
        current[index] = temp;
        this.setActiveActions(current);
    },

    saveCustomAction(action) {
        const custom = this.getCustomDefinitions().filter(Boolean);
        custom.push(action);
        AppState.settings.customAddons = custom.map(item => ({ ...item }));
        ipcRenderer.send('update-setting', 'customAddons', AppState.settings.customAddons);
        this.addActionToActive(action.id);
    },

    deleteCustomAction(id) {
        let custom = this.getCustomDefinitions();
        custom = custom.filter(item => item.id !== id);
        AppState.settings.customAddons = custom.map(item => ({ ...item }));
        ipcRenderer.send('update-setting', 'customAddons', AppState.settings.customAddons);
        this.removeActiveAction(id);
        this.renderSettingsPanels();
    }
};

const WorkflowEngine = {
    async execute(definition) {
        const workflow = definition?.workflow || {};
        const nodes = Array.isArray(workflow.nodes) ? workflow.nodes : [];
        const connections = Array.isArray(workflow.connections) ? workflow.connections : [];
        const context = await this.buildContext();

        const nodeMap = new Map();
        const incomingCounts = new Map();
        const outgoingMap = new Map();

        nodes.forEach(node => {
            nodeMap.set(node.id, node);
            incomingCounts.set(node.id, 0);
            outgoingMap.set(node.id, []);
        });

        connections.forEach(connection => {
            if (!nodeMap.has(connection.from) || !nodeMap.has(connection.to)) return;
            incomingCounts.set(connection.to, (incomingCounts.get(connection.to) || 0) + 1);
            outgoingMap.get(connection.from).push(connection.to);
        });

        const queue = [];
        incomingCounts.forEach((count, nodeId) => {
            if (count === 0) queue.push(nodeId);
        });

        const processed = new Set();
        const results = new Map();
        const logs = [];

        while (queue.length) {
            const nodeId = queue.shift();
            if (processed.has(nodeId)) continue;
            const node = nodeMap.get(nodeId);
            if (!node) continue;

            const module = WorkbenchModules.find(item => item.id === node.moduleId);
            const inboundValues = connections
                .filter(conn => conn.to === nodeId)
                .map(conn => results.get(conn.from))
                .filter(value => value !== undefined);
            const input = inboundValues.length > 1 ? inboundValues : (inboundValues[0] ?? null);

            const execution = this.executeModule(module, node, input, context);
            logs.push({
                nodeId,
                status: execution.status,
                details: execution.details,
                output: execution.output,
                moduleId: node.moduleId
            });

            results.set(nodeId, execution.output);
            processed.add(nodeId);

            (outgoingMap.get(nodeId) || []).forEach(targetId => {
                const remaining = (incomingCounts.get(targetId) || 0) - 1;
                incomingCounts.set(targetId, remaining);
                if (remaining <= 0 && !processed.has(targetId)) {
                    queue.push(targetId);
                }
            });
        }

        return { logs, results };
    },

    async buildContext() {
        const query = Utils.getElement('#search-input')?.value?.trim() || '';
        const clipboardHistory = await AuxPanelManager.getCachedData('clipboard');
        const clipboardText = Array.isArray(clipboardHistory)
            ? clipboardHistory
                .map(item => {
                    if (typeof item === 'string') return item;
                    if (item && typeof item.content === 'string') return item.content;
                    if (item && typeof item.primary === 'string') return item.primary;
                    return '';
                })
                .filter(Boolean)
            : [];

        return {
            query,
            clipboardHistory: Array.isArray(clipboardHistory) ? clipboardHistory : [],
            clipboardText,
            clipboardFirst: clipboardText[0] || '',
            now: new Date()
        };
    },

    executeModule(module, node, input, context) {
        const details = [];
        let status = 'info';
        let output = input ?? '';

        if (!module) {
            details.push(LocalizationRenderer.t('workflow_log_unknown_module', node.moduleId || 'unknown'));
            return { status: 'warning', details, output };
        }

        try {
            const settings = node?.settings || {};
            const baseText = this.toText(input);
            const trimmedBase = baseText.trim();

            switch (module.id) {
                case 'trigger-search': {
                    const query = context.query;
                    const pattern = (settings.pattern || '').trim();
                    const caseSensitive = Boolean(settings.caseSensitive);
                    output = query;
                    if (!query) {
                        details.push(LocalizationRenderer.t('workflow_log_no_input'));
                    }
                    if (pattern) {
                        const normalizedQuery = caseSensitive ? query : query.toLowerCase();
                        const normalizedPattern = caseSensitive ? pattern : pattern.toLowerCase();
                        if (query && normalizedQuery.includes(normalizedPattern)) {
                            status = 'success';
                            details.push(LocalizationRenderer.t('workflow_log_query_match', pattern));
                        } else {
                            status = 'warning';
                            details.push(LocalizationRenderer.t('workflow_log_query_no_match', query || '∅', pattern));
                            output = '';
                        }
                    } else if (query) {
                        status = 'success';
                        details.push(LocalizationRenderer.t('workflow_log_passthrough'));
                    }
                    this.appendPreview(details, output);
                    break;
                }
                case 'trigger-clipboard': {
                    const clipboardValue = context.clipboardFirst;
                    if (clipboardValue) {
                        status = 'success';
                        output = clipboardValue;
                        details.push(LocalizationRenderer.t('workflow_log_clipboard_used', clipboardValue.length));
                        this.appendPreview(details, output);
                    } else {
                        status = 'warning';
                        output = '';
                        details.push(LocalizationRenderer.t('workflow_log_clipboard_missing'));
                    }
                    break;
                }
                case 'trigger-shortcut': {
                    const shortcut = settings.shortcut || 'Alt+Space';
                    status = 'info';
                    output = shortcut;
                    details.push(LocalizationRenderer.t('workflow_log_shortcut_ready', shortcut));
                    break;
                }
                case 'trigger-command': {
                    const command = settings.command || '';
                    status = 'info';
                    output = command;
                    if (command) {
                        details.push(LocalizationRenderer.t('workflow_log_command_ready', command));
                    } else {
                        details.push(LocalizationRenderer.t('workflow_log_no_input'));
                    }
                    break;
                }
                case 'action-filter-text': {
                    if (!trimmedBase) {
                        status = 'warning';
                        details.push(LocalizationRenderer.t('workflow_log_no_input'));
                        output = '';
                        break;
                    }
                    const pattern = (settings.pattern || '').trim();
                    if (!pattern) {
                        status = 'info';
                        output = baseText;
                        details.push(LocalizationRenderer.t('workflow_log_passthrough'));
                        this.appendPreview(details, output);
                        break;
                    }
                    const keepMatches = settings.keepMatches !== false;
                    const lines = baseText.split(/\r?\n/);
                    const normalizedPattern = pattern.toLowerCase();
                    const filtered = lines.filter(line => {
                        const matches = line.toLowerCase().includes(normalizedPattern);
                        return keepMatches ? matches : !matches;
                    });
                    output = filtered.join('\n');
                    const key = keepMatches ? 'workflow_log_filter_kept' : 'workflow_log_filter_removed';
                    details.push(LocalizationRenderer.t(key, lines.length, filtered.length));
                    status = filtered.length ? 'success' : 'warning';
                    if (filtered.length) {
                        this.appendPreview(details, output);
                    }
                    break;
                }
                case 'action-template': {
                    const template = settings.template || '';
                    if (!template) {
                        output = baseText;
                        details.push(LocalizationRenderer.t('workflow_log_passthrough'));
                        if (trimmedBase) this.appendPreview(details, output);
                        break;
                    }
                    output = this.renderTemplate(template, context, baseText);
                    status = 'success';
                    details.push(LocalizationRenderer.t('workflow_log_template_applied'));
                    this.appendPreview(details, output);
                    break;
                }
                case 'action-run-script': {
                    const scriptParts = [settings.script, settings.arguments]
                        .map(part => (part || '').trim())
                        .filter(Boolean);
                    const commandLabel = scriptParts.join(' ');
                    details.push(LocalizationRenderer.t('workflow_log_run_script', commandLabel || 'script')); 
                    output = baseText;
                    if (trimmedBase) {
                        this.appendPreview(details, output);
                    }
                    break;
                }
                case 'action-format-text': {
                    if (!trimmedBase) {
                        status = 'warning';
                        details.push(LocalizationRenderer.t('workflow_log_no_input'));
                        output = '';
                        break;
                    }
                    const transform = settings.transform || 'title';
                    output = this.applyTransform(baseText, transform);
                    status = 'success';
                    details.push(LocalizationRenderer.t('workflow_log_format_text', LocalizationRenderer.t(`workbench_option_${transform}`)));
                    this.appendPreview(details, output);
                    break;
                }
                case 'output-pin-board': {
                    const folder = (settings.folder || '').trim() || 'default';
                    details.push(LocalizationRenderer.t('workflow_log_pin', folder));
                    output = baseText;
                    if (trimmedBase) this.appendPreview(details, output);
                    status = 'success';
                    break;
                }
                case 'output-open-note': {
                    const workspace = (settings.workspace || 'personal').toLowerCase();
                    const workspaceLabel = LocalizationRenderer.t(`workbench_option_${workspace}`);
                    details.push(LocalizationRenderer.t('workflow_log_note', workspaceLabel));
                    output = baseText;
                    if (trimmedBase) this.appendPreview(details, output);
                    status = 'info';
                    break;
                }
                case 'output-notify': {
                    const channel = (settings.channel || 'toast').toLowerCase();
                    const level = (settings.level || 'info').toLowerCase();
                    const channelLabel = LocalizationRenderer.t(`workbench_option_${channel}`);
                    const levelLabel = LocalizationRenderer.t(`workbench_option_${level}`);
                    details.push(LocalizationRenderer.t('workflow_log_notify', levelLabel, channelLabel));
                    output = baseText;
                    if (trimmedBase) this.appendPreview(details, output);
                    status = 'info';
                    break;
                }
                case 'output-copy': {
                    details.push(LocalizationRenderer.t('workflow_log_copy'));
                    output = baseText;
                    if (trimmedBase) this.appendPreview(details, output);
                    status = 'success';
                    break;
                }
                case 'utility-delay': {
                    const duration = Number(settings.duration) || 0;
                    details.push(LocalizationRenderer.t('workflow_log_delay', duration));
                    output = baseText;
                    if (trimmedBase) this.appendPreview(details, output);
                    status = 'info';
                    break;
                }
                case 'utility-approval': {
                    const question = settings.question || '';
                    details.push(LocalizationRenderer.t('workflow_log_approval', question));
                    output = baseText;
                    if (trimmedBase) this.appendPreview(details, output);
                    status = 'info';
                    break;
                }
                default: {
                    details.push(LocalizationRenderer.t('workflow_log_unknown_module', module.id));
                    output = baseText;
                    if (trimmedBase) this.appendPreview(details, output);
                    status = 'warning';
                }
            }
        } catch (error) {
            status = 'error';
            details.push(LocalizationRenderer.t('workflow_log_error', error?.message || String(error)));
        }

        return { status, details, output };
    },

    toText(value) {
        if (value === null || value === undefined) return '';
        if (Array.isArray(value)) {
            return value.map(item => this.toText(item)).filter(Boolean).join('\n');
        }
        if (typeof value === 'object') {
            if (typeof value.value === 'string') return value.value;
            if (typeof value.text === 'string') return value.text;
            if (typeof value.result === 'string') return value.result;
            try {
                return JSON.stringify(value);
            } catch (error) {
                return '';
            }
        }
        return String(value);
    },

    renderTemplate(template, context, baseText) {
        const now = context.now instanceof Date ? context.now : new Date();
        const replacements = {
            query: context.query || '',
            input: baseText || '',
            clipboard: context.clipboardFirst || '',
            date: now.toLocaleDateString(),
            time: now.toLocaleTimeString()
        };
        return template.replace(/{{\s*(\w+)\s*}}/g, (match, key) => {
            return Object.prototype.hasOwnProperty.call(replacements, key) ? replacements[key] : match;
        });
    },

    applyTransform(value, transform) {
        switch (transform) {
            case 'upper':
                return value.toUpperCase();
            case 'lower':
                return value.toLowerCase();
            case 'slug': {
                return value
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-+|-+$/g, '');
            }
            case 'title':
            default:
                return value.replace(/\w[^\s-]*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
        }
    },

    appendPreview(details, value) {
        const preview = this.previewValue(value);
        if (preview) {
            details.push(LocalizationRenderer.t('workflow_log_result_preview', preview));
        }
    },

    previewValue(value) {
        const text = this.toText(value).replace(/\s+/g, ' ').trim();
        if (!text) return '';
        if (text.length > 120) {
            return `${text.slice(0, 117)}…`;
        }
        return text;
    }
};

const WorkflowRunner = {
    overlay: null,
    stepsContainer: null,
    titleElement: null,
    descriptionElement: null,

    init() {
        this.overlay = Utils.getElement('#workflow-runner-overlay');
        this.stepsContainer = Utils.getElement('#workflow-runner-steps');
        this.titleElement = Utils.getElement('#workflow-runner-name');
        this.descriptionElement = Utils.getElement('#workflow-runner-description');
        const close = Utils.getElement('#workflow-runner-close');
        if (close) close.addEventListener('click', () => this.close());
        if (this.overlay) this.overlay.addEventListener('click', (event) => {
            if (event.target === this.overlay) this.close();
        });
    },

    async open(definition) {
        if (!definition) return;
        if (!this.overlay) this.init();
        this.titleElement.textContent = QuickActionModule.getActionLabel(definition);
        this.descriptionElement.textContent = QuickActionModule.getActionDescription(definition);
        const execution = await WorkflowEngine.execute(definition);
        this.renderSteps(definition, execution.logs);
        this.overlay.classList.remove('hidden');
    },

    close() {
        if (this.overlay) this.overlay.classList.add('hidden');
    },

    renderSteps(definition, logs = []) {
        if (!this.stepsContainer) return;
        this.stepsContainer.innerHTML = '';
        const workflow = definition.workflow;
        if (!workflow || !Array.isArray(workflow.nodes)) return;
        workflow.nodes.forEach((node, index) => {
            const module = WorkbenchModules.find(item => item.id === node.moduleId);
            const step = Utils.createElement('div', { className: 'workflow-step' });
            const indexBadge = Utils.createElement('div', { className: 'workflow-step-index', text: String(index + 1) });
            const content = Utils.createElement('div', { className: 'workflow-step-content' });
            content.appendChild(Utils.createElement('h4', { text: module ? LocalizationRenderer.t(module.nameKey) : node.moduleId }));
            if (module) {
                content.appendChild(Utils.createElement('p', { text: LocalizationRenderer.t(module.descriptionKey) }));
            }
            const logEntry = logs.find(item => item.nodeId === node.id) || { status: 'info', details: [] };
            const statusKey = `workflow_status_${logEntry.status || 'info'}`;
            const statusBadge = Utils.createElement('span', { className: `workflow-step-status status-${logEntry.status || 'info'}`, text: LocalizationRenderer.t(statusKey) });
            content.appendChild(statusBadge);
            if (Array.isArray(logEntry.details) && logEntry.details.length) {
                const detailsList = Utils.createElement('ul', { className: 'workflow-step-details' });
                logEntry.details.forEach(detail => {
                    const item = Utils.createElement('li');
                    item.textContent = detail;
                    detailsList.appendChild(item);
                });
                content.appendChild(detailsList);
            }
            step.classList.add(`status-${logEntry.status || 'info'}`);
            step.appendChild(indexBadge);
            step.appendChild(content);
            this.stepsContainer.appendChild(step);
        });
    }
};

const ActionWorkbench = {
    overlay: null,
    canvas: null,
    connectionsSvg: null,
    nameInput: null,
    iconInput: null,
    searchInput: null,
    inspector: null,
    removeButton: null,
    clearButton: null,
    saveButton: null,
    state: {
        nodes: [],
        connections: [],
        selectedNodeId: null,
        description: ''
    },

    init() {
        this.overlay = Utils.getElement('#workbench-overlay');
        this.canvas = Utils.getElement('#workbench-canvas');
        this.connectionsSvg = Utils.getElement('#workbench-connections');
        this.nameInput = Utils.getElement('#workbench-name');
        this.iconInput = Utils.getElement('#workbench-icon');
        this.searchInput = Utils.getElement('#workbench-library-search');
        this.inspector = Utils.getElement('#workbench-inspector-content');
        this.removeButton = Utils.getElement('#workbench-remove-node');
        this.clearButton = Utils.getElement('#workbench-clear');
        this.saveButton = Utils.getElement('#workbench-save');

        const closeButton = Utils.getElement('#workbench-close');
        if (closeButton) closeButton.addEventListener('click', () => this.close());
        if (this.overlay) this.overlay.addEventListener('click', (event) => {
            if (event.target === this.overlay) this.close();
        });
        if (this.clearButton) this.clearButton.addEventListener('click', () => this.reset());
        if (this.saveButton) this.saveButton.addEventListener('click', () => this.save());
        if (this.removeButton) this.removeButton.addEventListener('click', () => this.removeSelectedNode());
        if (this.searchInput) this.searchInput.addEventListener('input', () => this.renderLibrary());

        const libraryList = Utils.getElement('#workbench-library-list');
        if (libraryList) {
            libraryList.addEventListener('click', (event) => {
                const chip = event.target.closest('[data-module-id]');
                if (!chip) return;
                const moduleId = chip.getAttribute('data-module-id');
                this.addModule(moduleId);
            });
        }

        if (this.canvas) {
            this.canvas.addEventListener('pointerdown', (event) => this.beginDrag(event));
            this.canvas.addEventListener('pointermove', (event) => this.onDrag(event));
            this.canvas.addEventListener('pointerup', () => this.endDrag());
            this.canvas.addEventListener('click', (event) => this.onCanvasClick(event));
        }

        this.renderLibrary();
    },

    open(preset = null) {
        if (!this.overlay) this.init();
        if (preset && preset.workflow) {
            this.state.nodes = preset.workflow.nodes.map(node => ({ ...node, position: { ...node.position } }));
            this.state.connections = preset.workflow.connections.map(conn => ({ ...conn }));
            this.nameInput.value = preset.name || '';
            this.iconInput.value = preset.icon || '';
            this.state.description = preset.description || '';
        } else {
            this.reset();
        }
        this.overlay.classList.remove('hidden');
        this.renderCanvas();
        this.renderInspector();
    },

    close() {
        if (this.overlay) this.overlay.classList.add('hidden');
        this.endDrag();
    },

    reset() {
        this.state = { nodes: [], connections: [], selectedNodeId: null, description: '' };
        if (this.nameInput) this.nameInput.value = '';
        if (this.iconInput) this.iconInput.value = '';
        this.renderCanvas();
        this.renderInspector();
    },

    addModule(moduleId) {
        const module = WorkbenchModules.find(item => item.id === moduleId);
        if (!module) return;
        const position = { x: 80 + this.state.nodes.length * 240, y: 160 };
        const nodeId = `node-${moduleId}-${Date.now()}`;
        const node = {
            id: nodeId,
            moduleId: module.id,
            title: LocalizationRenderer.t(module.defaultTitleKey || module.nameKey),
            position,
            settings: this.createDefaultSettings(module)
        };
        if (this.state.nodes.length > 0) {
            const previous = this.state.nodes[this.state.nodes.length - 1];
            this.state.connections.push({ from: previous.id, to: nodeId });
        }
        this.state.nodes.push(node);
        this.state.selectedNodeId = nodeId;
        this.renderCanvas();
        this.renderInspector();
    },

    createDefaultSettings(module) {
        if (!module?.fields) return {};
        return module.fields.reduce((acc, field) => {
            acc[field.id] = field.defaultValue ?? '';
            return acc;
        }, {});
    },

    renderLibrary() {
        const list = Utils.getElement('#workbench-library-list');
        if (!list) return;
        list.innerHTML = '';
        const query = (this.searchInput?.value || '').toLowerCase();
        WorkbenchCategories.forEach(category => {
            const modules = WorkbenchModules.filter(module => module.category === category.id && (module.nameKey ? LocalizationRenderer.t(module.nameKey).toLowerCase().includes(query) : true));
            if (!modules.length) return;
            const group = Utils.createElement('div', { className: 'workbench-library-group' });
            group.appendChild(Utils.createElement('div', { className: 'workbench-library-group-title', text: LocalizationRenderer.t(category.nameKey) }));
            modules.forEach(module => {
                const chip = Utils.createElement('div', { className: 'workbench-module-chip' });
                chip.setAttribute('data-module-id', module.id);
                const icon = window.feather?.icons[module.icon]
                    ? window.feather.icons[module.icon].toSvg()
                    : `<i data-feather="${module.icon}"></i>`;
                chip.innerHTML = icon + `<div class="workbench-module-chip-content"><div class="workbench-module-chip-title">${LocalizationRenderer.t(module.nameKey)}</div><div class="workbench-module-chip-description">${LocalizationRenderer.t(module.descriptionKey)}</div></div>`;
                group.appendChild(chip);
            });
            list.appendChild(group);
        });
        if (window.feather) window.feather.replace();
    },

    renderCanvas() {
        if (!this.canvas) return;
        this.canvas.querySelectorAll('.workbench-node').forEach(node => node.remove());
        this.state.nodes.forEach(node => {
            const module = WorkbenchModules.find(item => item.id === node.moduleId);
            const element = Utils.createElement('div', { className: 'workbench-node' });
            element.style.transform = `translate(${node.position.x}px, ${node.position.y}px)`;
            element.setAttribute('data-node-id', node.id);
            if (this.state.selectedNodeId === node.id) element.classList.add('selected');

            const header = Utils.createElement('div', { className: 'workbench-node-header' });
            const iconName = module?.icon || 'zap';
            header.innerHTML = window.feather?.icons[iconName]
                ? window.feather.icons[iconName].toSvg() + `<div><div class="workbench-node-title">${node.title || LocalizationRenderer.t(module?.nameKey)}</div><div class="workbench-node-category">${LocalizationRenderer.t(`workbench_category_${module?.category || 'actions'}`)}</div></div>`
                : `<i data-feather="${iconName}"></i>`;
            element.appendChild(header);

            if (module) {
                element.appendChild(Utils.createElement('div', { className: 'workbench-node-description', text: LocalizationRenderer.t(module.descriptionKey) }));
            }

            const footer = Utils.createElement('div', { className: 'workbench-node-footer', text: LocalizationRenderer.t('workbench_node_footer_steps', this.getOutgoingConnections(node.id).length) });
            element.appendChild(footer);

            const inputHandle = Utils.createElement('div', { className: 'workbench-handle input' });
            const outputHandle = Utils.createElement('div', { className: 'workbench-handle output' });
            element.appendChild(inputHandle);
            element.appendChild(outputHandle);

            element.addEventListener('pointerdown', (event) => this.selectNode(event, node.id));
            this.canvas.appendChild(element);
        });
        this.drawConnections();
        if (window.feather) window.feather.replace();
    },

    selectNode(event, nodeId) {
        event.stopPropagation();
        this.state.selectedNodeId = nodeId;
        this.renderCanvas();
        this.renderInspector();
    },

    getOutgoingConnections(nodeId) {
        return this.state.connections.filter(conn => conn.from === nodeId);
    },

    drawConnections() {
        if (!this.connectionsSvg) return;
        const svg = this.connectionsSvg;
        svg.innerHTML = '';
        const rect = this.canvas.getBoundingClientRect();
        this.state.connections.forEach(connection => {
            const fromNode = this.canvas.querySelector(`.workbench-node[data-node-id="${connection.from}"]`);
            const toNode = this.canvas.querySelector(`.workbench-node[data-node-id="${connection.to}"]`);
            if (!fromNode || !toNode) return;
            const fromRect = fromNode.getBoundingClientRect();
            const toRect = toNode.getBoundingClientRect();
            const startX = fromRect.right - rect.left;
            const startY = fromRect.top + fromRect.height / 2 - rect.top;
            const endX = toRect.left - rect.left;
            const endY = toRect.top + toRect.height / 2 - rect.top;
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const controlOffset = Math.max(120, (endX - startX) / 2);
            const d = `M ${startX} ${startY} C ${startX + controlOffset} ${startY}, ${endX - controlOffset} ${endY}, ${endX} ${endY}`;
            path.setAttribute('d', d);
            path.setAttribute('fill', 'none');
            path.setAttribute('stroke', 'rgba(0, 122, 255, 0.6)');
            path.setAttribute('stroke-width', '2.5');
            svg.appendChild(path);
        });
    },

    renderInspector() {
        if (!this.inspector) return;
        this.inspector.innerHTML = '';
        const node = this.state.nodes.find(item => item.id === this.state.selectedNodeId);
        if (!node) {
            const descriptionField = Utils.createElement('div', { className: 'inspector-field' });
            descriptionField.appendChild(Utils.createElement('label', { text: LocalizationRenderer.t('workbench_field_description') }));
            const textarea = Utils.createElement('textarea');
            textarea.value = this.state.description || '';
            textarea.placeholder = LocalizationRenderer.t('workbench_field_description_placeholder');
            textarea.addEventListener('input', () => {
                this.state.description = textarea.value;
            });
            descriptionField.appendChild(textarea);
            this.inspector.appendChild(Utils.createElement('p', { text: LocalizationRenderer.t('workbench_inspector_empty') }));
            this.inspector.appendChild(descriptionField);
            if (this.removeButton) this.removeButton.disabled = true;
            return;
        }
        const module = WorkbenchModules.find(item => item.id === node.moduleId);
        this.inspector.appendChild(Utils.createElement('h4', { text: LocalizationRenderer.t('workbench_node_settings') }));
        const titleField = Utils.createElement('div', { className: 'inspector-field' });
        titleField.appendChild(Utils.createElement('label', { text: LocalizationRenderer.t('workbench_node_name_label') }));
        const titleInput = Utils.createElement('input');
        titleInput.value = node.title || LocalizationRenderer.t(module?.nameKey);
        titleInput.addEventListener('input', () => {
            node.title = titleInput.value;
            this.renderCanvas();
        });
        titleField.appendChild(titleInput);
        this.inspector.appendChild(titleField);

        if (module?.fields) {
            module.fields.forEach(field => {
                const wrapper = Utils.createElement('div', { className: 'inspector-field' });
                wrapper.appendChild(Utils.createElement('label', { text: LocalizationRenderer.t(field.labelKey) }));
                let control;
                if (field.type === 'textarea') {
                    control = Utils.createElement('textarea');
                    control.value = node.settings[field.id] ?? '';
                    control.placeholder = field.placeholderKey ? LocalizationRenderer.t(field.placeholderKey) : '';
                    control.addEventListener('input', () => {
                        node.settings[field.id] = control.value;
                    });
                } else if (field.type === 'select') {
                    control = Utils.createElement('select');
                    (field.options || []).forEach(option => {
                        const optionElement = Utils.createElement('option', { text: LocalizationRenderer.t(`workbench_option_${option}`) });
                        optionElement.value = option;
                        if (node.settings[field.id] === option) optionElement.selected = true;
                        control.appendChild(optionElement);
                    });
                    control.addEventListener('change', () => {
                        node.settings[field.id] = control.value;
                    });
                } else if (field.type === 'toggle') {
                    control = Utils.createElement('input');
                    control.type = 'checkbox';
                    control.checked = Boolean(node.settings[field.id]);
                    control.addEventListener('change', () => {
                        node.settings[field.id] = control.checked;
                    });
                } else if (field.type === 'number') {
                    control = Utils.createElement('input');
                    control.type = 'number';
                    control.value = node.settings[field.id] ?? field.defaultValue ?? 0;
                    control.placeholder = field.placeholderKey ? LocalizationRenderer.t(field.placeholderKey) : '';
                    control.addEventListener('input', () => {
                        node.settings[field.id] = Number(control.value);
                    });
                } else {
                    control = Utils.createElement('input');
                    control.value = node.settings[field.id] ?? '';
                    control.placeholder = field.placeholderKey ? LocalizationRenderer.t(field.placeholderKey) : '';
                    control.addEventListener('input', () => {
                        node.settings[field.id] = control.value;
                    });
                }
                wrapper.appendChild(control);
                this.inspector.appendChild(wrapper);
            });
        }

        if (this.removeButton) this.removeButton.disabled = false;
    },

    beginDrag(event) {
        const nodeElement = event.target.closest('.workbench-node');
        if (!nodeElement) return;
        const nodeId = nodeElement.getAttribute('data-node-id');
        this.dragState = {
            nodeId,
            offsetX: event.clientX - nodeElement.getBoundingClientRect().left,
            offsetY: event.clientY - nodeElement.getBoundingClientRect().top
        };
        this.state.selectedNodeId = nodeId;
        this.renderInspector();
        this.canvas.setPointerCapture(event.pointerId);
    },

    onDrag(event) {
        if (!this.dragState) return;
        const node = this.state.nodes.find(item => item.id === this.dragState.nodeId);
        if (!node) return;
        const rect = this.canvas.getBoundingClientRect();
        node.position.x = event.clientX - rect.left - this.dragState.offsetX;
        node.position.y = event.clientY - rect.top - this.dragState.offsetY;
        this.renderCanvas();
    },

    endDrag() {
        this.dragState = null;
    },

    onCanvasClick(event) {
        if (event.target.closest('.workbench-node')) return;
        this.state.selectedNodeId = null;
        this.renderCanvas();
        this.renderInspector();
    },

    removeSelectedNode() {
        if (!this.state.selectedNodeId) return;
        this.state.nodes = this.state.nodes.filter(node => node.id !== this.state.selectedNodeId);
        this.state.connections = this.state.connections.filter(conn => conn.from !== this.state.selectedNodeId && conn.to !== this.state.selectedNodeId);
        this.state.selectedNodeId = null;
        this.renderCanvas();
        this.renderInspector();
    },

    save() {
        const name = (this.nameInput?.value || '').trim();
        if (!name) {
            alert(LocalizationRenderer.t('workbench_error_no_name'));
            return;
        }
        if (!this.state.nodes.length) {
            alert(LocalizationRenderer.t('workbench_error_no_nodes'));
            return;
        }
        const icon = (this.iconInput?.value || 'zap').trim();
        const action = {
            id: `custom-${Date.now()}`,
            name,
            description: this.state.description,
            icon,
            type: 'workflow',
            workflow: {
                nodes: this.state.nodes.map(node => ({
                    id: node.id,
                    moduleId: node.moduleId,
                    position: { ...node.position },
                    settings: { ...node.settings },
                    title: node.title
                })),
                connections: this.state.connections.map(conn => ({ ...conn }))
            }
        };
        QuickActionModule.saveCustomAction(action);
        this.close();
        this.showToast(LocalizationRenderer.t('workbench_saved_toast'));
    },

    showToast(message) {
        if (!this.overlay) return;
        const toast = Utils.createElement('div', { className: 'workbench-toast', text: message });
        this.overlay.appendChild(toast);
        setTimeout(() => toast.classList.add('visible'), 30);
        setTimeout(() => {
            toast.classList.remove('visible');
            setTimeout(() => toast.remove(), 300);
        }, 2200);
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
        }
        QuickActionModule.refreshToolbarTitles();
        ActionWorkbench.renderLibrary();
        ActionWorkbench.renderCanvas();
        ActionWorkbench.renderInspector();
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

        const activeQuickActions = Utils.getElement('#active-quick-actions');
        if (activeQuickActions) {
            activeQuickActions.addEventListener('click', (event) => {
                const button = event.target.closest('[data-action]');
                if (!button) return;
                const action = button.getAttribute('data-action');
                const id = button.getAttribute('data-quick-action');
                if (!id) return;
                if (action === 'remove') QuickActionModule.removeActiveAction(id);
                else if (action === 'move-up') QuickActionModule.moveActiveAction(id, 'up');
                else if (action === 'move-down') QuickActionModule.moveActiveAction(id, 'down');
            });
        }

        const quickActionGallery = Utils.getElement('#quick-action-library');
        if (quickActionGallery) {
            quickActionGallery.addEventListener('click', (event) => {
                const button = event.target.closest('[data-action]');
                if (!button) return;
                const action = button.getAttribute('data-action');
                const id = button.getAttribute('data-quick-action');
                if (!id) return;
                if (action === 'add') QuickActionModule.addActionToActive(id);
                else if (action === 'delete') QuickActionModule.deleteCustomAction(id);
            });
        }

        const workbenchButton = Utils.getElement('#open-workbench');
        if (workbenchButton) {
            workbenchButton.addEventListener('click', () => ActionWorkbench.open());
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

    openTab: function(tabId) {
        const button = Utils.getElement(`.settings-sidebar li[data-tab="${tabId}"]`);
        const targetTab = Utils.getElement(`#tab-${tabId}`);
        if (!button || !targetTab) return;
        document.querySelector('.settings-sidebar li.active')?.classList.remove('active');
        document.querySelector('.tab-content.active')?.classList.remove('active');
        button.classList.add('active');
        targetTab.classList.add('active');
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
        QuickActionModule.refreshAll();
        this.ensureSubscriptionVisibility();
        this.renderSubscription();
        this.renderAddons();
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
        if (!this.hasActiveSubscription()) {
            const activeContainer = Utils.getElement('#active-quick-actions');
            const galleryContainer = Utils.getElement('#quick-action-library');
            if (activeContainer) activeContainer.innerHTML = '';
            if (galleryContainer) galleryContainer.innerHTML = '';
            return;
        }
        QuickActionModule.renderSettingsPanels();
    },

    renderAddons: function() {
        if (!this.hasActiveSubscription()) {
            const activeContainer = Utils.getElement('#active-quick-actions');
            const galleryContainer = Utils.getElement('#quick-action-library');
            if (activeContainer) activeContainer.innerHTML = '';
            if (galleryContainer) galleryContainer.innerHTML = '';
            return;
        }
        QuickActionModule.renderSettingsPanels();
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
    cachedData: {},

    init: function() {
        this.panelContainer = Utils.getElement('#aux-panel');
        ipcRenderer.on('update-data', this.updateDataListener);
        ipcRenderer.on('clipboard-history', (_, history) => {
            this.cachedData.clipboard = Array.isArray(history) ? history : [];
        });
        this.primeCachedData();
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

    primeCachedData: async function() {
        try {
            const history = await ipcRenderer.invoke('get-clipboard-history');
            this.cachedData.clipboard = Array.isArray(history) ? history : [];
        } catch (error) {
            console.error('[AuxPanelManager] Failed to prime clipboard cache:', error);
            this.cachedData.clipboard = Array.isArray(this.cachedData.clipboard) ? this.cachedData.clipboard : [];
        }
    },

    getCachedData: async function(type) {
        if (type === 'clipboard' && !Array.isArray(this.cachedData.clipboard)) {
            await this.primeCachedData();
        }
        const data = this.cachedData[type];
        return Array.isArray(data) ? data : [];
    },

    showCalculator: function() {
        if (!this.panelContainer) this.panelContainer = Utils.getElement('#aux-panel');
        this.currentPanel = 'calculator';
        const wrapper = Utils.createElement('div', { className: 'calculator-panel glass-element' });
        wrapper.innerHTML = `
            <header class="calculator-header">
                <div>
                    <h3>${LocalizationRenderer.t('quick_actions_calculator_title')}</h3>
                    <p>${LocalizationRenderer.t('quick_actions_calculator_subtitle')}</p>
                </div>
                <button class="calculator-close">${LocalizationRenderer.t('workflow_runner_close')}</button>
            </header>
            <div class="calculator-body">
                <input type="text" class="calculator-input" placeholder="${LocalizationRenderer.t('quick_actions_calculator_placeholder')}">
                <div class="calculator-result" data-result="0">0</div>
                <div class="calculator-buttons">
                    <button data-value="7">7</button>
                    <button data-value="8">8</button>
                    <button data-value="9">9</button>
                    <button data-value="/">÷</button>
                    <button data-value="4">4</button>
                    <button data-value="5">5</button>
                    <button data-value="6">6</button>
                    <button data-value="*">×</button>
                    <button data-value="1">1</button>
                    <button data-value="2">2</button>
                    <button data-value="3">3</button>
                    <button data-value="-">−</button>
                    <button data-value="0">0</button>
                    <button data-value=".">.</button>
                    <button data-action="clear">${LocalizationRenderer.t('quick_actions_calculator_clear')}</button>
                    <button data-value="+">+</button>
                    <button data-action="evaluate" class="calculator-evaluate">${LocalizationRenderer.t('quick_actions_calculator_eval')}</button>
                </div>
            </div>
        `;
        this.panelContainer.innerHTML = '';
        this.panelContainer.appendChild(wrapper);
        this.panelContainer.classList.add('visible');
        ViewManager.prepareForShow(wrapper);
        ViewManager.resizeWindow();

        const input = wrapper.querySelector('.calculator-input');
        const result = wrapper.querySelector('.calculator-result');
        const closeButton = wrapper.querySelector('.calculator-close');
        if (input) input.focus();

        const evaluate = () => {
            if (!input || !result) return;
            try {
                const value = input.value.trim();
                if (!value) {
                    result.textContent = '0';
                    return;
                }
                const output = math.evaluate(value);
                result.textContent = String(output);
            } catch (error) {
                result.textContent = LocalizationRenderer.t('quick_actions_calculator_error');
            }
        };

        wrapper.addEventListener('click', (event) => {
            const button = event.target.closest('button');
            if (!button) return;
            if (button.dataset.value) {
                input.value += button.dataset.value;
                evaluate();
            } else if (button.dataset.action === 'clear') {
                input.value = '';
                evaluate();
            } else if (button.dataset.action === 'evaluate') {
                evaluate();
            }
        });

        if (input) input.addEventListener('input', evaluate);
        if (closeButton) closeButton.addEventListener('click', () => this.closePanel());
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

        if (type) {
            self.cachedData[type] = Array.isArray(data) ? data : [];
        }

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
    QuickActionModule.init();
    WorkflowRunner.init();
    ActionWorkbench.init();

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
