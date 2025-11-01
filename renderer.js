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
    toolbarSnapshot: [],
    workflowDraft: null,
    workflowHistory: []
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

const QuickActionDefaults = ['apps-library', 'files', 'commands', 'clipboard'];

const QuickActionLibrary = [
    {
        id: 'apps-library',
        icon: 'grid',
        accent: 'ocean',
        type: 'panel',
        payload: { panel: 'apps-library' },
        nameKey: 'quick_action_apps_library',
        descriptionKey: 'quick_action_apps_library_description',
        tags: ['core', 'navigation']
    },
    {
        id: 'files',
        icon: 'folder',
        accent: 'amber',
        type: 'panel',
        payload: { panel: 'files' },
        nameKey: 'quick_action_files',
        descriptionKey: 'quick_action_files_description',
        tags: ['core', 'files']
    },
    {
        id: 'commands',
        icon: 'command',
        accent: 'violet',
        type: 'panel',
        payload: { panel: 'commands' },
        nameKey: 'quick_action_commands',
        descriptionKey: 'quick_action_commands_description',
        tags: ['core', 'automation']
    },
    {
        id: 'clipboard',
        icon: 'copy',
        accent: 'teal',
        type: 'panel',
        payload: { panel: 'clipboard' },
        nameKey: 'quick_action_clipboard',
        descriptionKey: 'quick_action_clipboard_description',
        tags: ['core', 'productivity']
    },
    {
        id: 'workflow-gallery',
        icon: 'layers',
        accent: 'magenta',
        type: 'workflow',
        payload: { templateId: 'curated-gallery' },
        nameKey: 'quick_action_workflow_gallery',
        descriptionKey: 'quick_action_workflow_gallery_description',
        tags: ['premium', 'workflow']
    },
    {
        id: 'research-deck',
        icon: 'book-open',
        accent: 'indigo',
        type: 'workflow',
        payload: { templateId: 'research-brief' },
        nameKey: 'quick_action_research',
        descriptionKey: 'quick_action_research_description',
        tags: ['workflow', 'knowledge']
    },
    {
        id: 'standup-reporter',
        icon: 'mic',
        accent: 'sunset',
        type: 'workflow',
        payload: { templateId: 'daily-standup' },
        nameKey: 'quick_action_standup',
        descriptionKey: 'quick_action_standup_description',
        tags: ['team', 'communication']
    },
    {
        id: 'status-mailer',
        icon: 'mail',
        accent: 'crimson',
        type: 'workflow',
        payload: { templateId: 'status-email' },
        nameKey: 'quick_action_status_mailer',
        descriptionKey: 'quick_action_status_mailer_description',
        tags: ['communication', 'automation']
    },
    {
        id: 'ai-scout',
        icon: 'cpu',
        accent: 'mint',
        type: 'workflow',
        payload: { templateId: 'ai-scout' },
        nameKey: 'quick_action_ai_scout',
        descriptionKey: 'quick_action_ai_scout_description',
        tags: ['ai', 'premium']
    },
    {
        id: 'focus-playlist',
        icon: 'music',
        accent: 'blue',
        type: 'workflow',
        payload: { templateId: 'focus-playlist' },
        nameKey: 'quick_action_focus_playlist',
        descriptionKey: 'quick_action_focus_playlist_description',
        tags: ['music', 'personal']
    },
    {
        id: 'design-review',
        icon: 'pen-tool',
        accent: 'gold',
        type: 'workflow',
        payload: { templateId: 'design-review' },
        nameKey: 'quick_action_design_review',
        descriptionKey: 'quick_action_design_review_description',
        tags: ['team', 'design']
    },
    {
        id: 'metrics-dashboard',
        icon: 'trending-up',
        accent: 'emerald',
        type: 'workflow',
        payload: { templateId: 'metrics-dashboard' },
        nameKey: 'quick_action_metrics',
        descriptionKey: 'quick_action_metrics_description',
        tags: ['analytics', 'data']
    }
];

const WorkflowModuleCatalog = [
    {
        id: 'trigger-clipboard',
        category: 'trigger',
        icon: 'clipboard',
        nameKey: 'workflow_module_clipboard_trigger',
        descriptionKey: 'workflow_module_clipboard_trigger_description',
        inputs: [],
        outputs: ['text'],
        configSchema: [
            { field: 'keywords', type: 'multi-text', labelKey: 'workflow_module_clipboard_trigger_keywords', placeholderKey: 'workflow_module_clipboard_trigger_keywords_placeholder' },
            { field: 'maxItems', type: 'number', labelKey: 'workflow_module_clipboard_trigger_limit', default: 10 }
        ]
    },
    {
        id: 'trigger-schedule',
        category: 'trigger',
        icon: 'clock',
        nameKey: 'workflow_module_schedule_trigger',
        descriptionKey: 'workflow_module_schedule_trigger_description',
        inputs: [],
        outputs: ['tick'],
        configSchema: [
            { field: 'frequency', type: 'select', labelKey: 'workflow_module_schedule_trigger_frequency', options: ['daily', 'weekly', 'hourly'] },
            { field: 'time', type: 'time', labelKey: 'workflow_module_schedule_trigger_time', default: '09:00' }
        ]
    },
    {
        id: 'trigger-webhook',
        category: 'trigger',
        icon: 'cloud-lightning',
        nameKey: 'workflow_module_webhook_trigger',
        descriptionKey: 'workflow_module_webhook_trigger_description',
        inputs: [],
        outputs: ['payload'],
        configSchema: [
            { field: 'url', type: 'text', labelKey: 'workflow_module_webhook_trigger_url' },
            { field: 'method', type: 'select', labelKey: 'workflow_module_webhook_trigger_method', options: ['POST', 'GET'] }
        ]
    },
    {
        id: 'transform-markdown',
        category: 'processor',
        icon: 'file-text',
        nameKey: 'workflow_module_markdown_formatter',
        descriptionKey: 'workflow_module_markdown_formatter_description',
        inputs: ['text'],
        outputs: ['document'],
        configSchema: [
            { field: 'template', type: 'textarea', labelKey: 'workflow_module_markdown_formatter_template' },
            { field: 'variables', type: 'key-value', labelKey: 'workflow_module_markdown_formatter_variables' }
        ]
    },
    {
        id: 'transform-language',
        category: 'processor',
        icon: 'globe',
        nameKey: 'workflow_module_language_transform',
        descriptionKey: 'workflow_module_language_transform_description',
        inputs: ['text'],
        outputs: ['text'],
        configSchema: [
            { field: 'targetLanguage', type: 'select', labelKey: 'workflow_module_language_transform_target', options: ['en', 'ru', 'de', 'fr', 'zh'] },
            { field: 'formal', type: 'boolean', labelKey: 'workflow_module_language_transform_formal' }
        ]
    },
    {
        id: 'transform-summary',
        category: 'processor',
        icon: 'align-left',
        nameKey: 'workflow_module_summary',
        descriptionKey: 'workflow_module_summary_description',
        inputs: ['text'],
        outputs: ['summary'],
        configSchema: [
            { field: 'sentences', type: 'number', labelKey: 'workflow_module_summary_sentences', default: 3 }
        ]
    },
    {
        id: 'transform-ai-analysis',
        category: 'processor',
        icon: 'cpu',
        nameKey: 'workflow_module_ai_analysis',
        descriptionKey: 'workflow_module_ai_analysis_description',
        inputs: ['text'],
        outputs: ['insight'],
        configSchema: [
            { field: 'tone', type: 'select', labelKey: 'workflow_module_ai_analysis_tone', options: ['neutral', 'optimistic', 'critical'] },
            { field: 'bulletPoints', type: 'boolean', labelKey: 'workflow_module_ai_analysis_bullets' }
        ]
    },
    {
        id: 'action-open-panel',
        category: 'action',
        icon: 'sidebar',
        nameKey: 'workflow_module_open_panel',
        descriptionKey: 'workflow_module_open_panel_description',
        inputs: ['context'],
        outputs: [],
        configSchema: [
            { field: 'panel', type: 'select', labelKey: 'workflow_module_open_panel_target', options: ['apps-library', 'files', 'commands', 'clipboard'] }
        ]
    },
    {
        id: 'action-run-command',
        category: 'action',
        icon: 'terminal',
        nameKey: 'workflow_module_run_command',
        descriptionKey: 'workflow_module_run_command_description',
        inputs: ['context'],
        outputs: [],
        configSchema: [
            { field: 'command', type: 'text', labelKey: 'workflow_module_run_command_command' },
            { field: 'arguments', type: 'list', labelKey: 'workflow_module_run_command_arguments' }
        ]
    },
    {
        id: 'action-send-webhook',
        category: 'action',
        icon: 'send',
        nameKey: 'workflow_module_send_webhook',
        descriptionKey: 'workflow_module_send_webhook_description',
        inputs: ['payload'],
        outputs: [],
        configSchema: [
            { field: 'endpoint', type: 'text', labelKey: 'workflow_module_send_webhook_endpoint' },
            { field: 'method', type: 'select', labelKey: 'workflow_module_send_webhook_method', options: ['POST', 'PUT', 'PATCH'] }
        ]
    },
    {
        id: 'action-create-note',
        category: 'action',
        icon: 'file-plus',
        nameKey: 'workflow_module_create_note',
        descriptionKey: 'workflow_module_create_note_description',
        inputs: ['document'],
        outputs: [],
        configSchema: [
            { field: 'destination', type: 'text', labelKey: 'workflow_module_create_note_destination' },
            { field: 'pinToToolbar', type: 'boolean', labelKey: 'workflow_module_create_note_pin' }
        ]
    }
];

const WorkflowTemplates = [
    {
        id: 'curated-gallery',
        nameKey: 'workflow_template_curated_gallery',
        descriptionKey: 'workflow_template_curated_gallery_description',
        icon: 'layers',
        accent: 'magenta',
        nodes: [
            { id: 'trigger-clipboard', position: { x: 120, y: 80 } },
            { id: 'transform-summary', position: { x: 420, y: 70 } },
            { id: 'transform-ai-analysis', position: { x: 720, y: 160 } },
            { id: 'action-create-note', position: { x: 1040, y: 100 } }
        ],
        connections: [
            { from: { node: 0, port: 'text' }, to: { node: 1, port: 'text' } },
            { from: { node: 1, port: 'summary' }, to: { node: 2, port: 'text' } },
            { from: { node: 2, port: 'insight' }, to: { node: 3, port: 'document' } }
        ]
    },
    {
        id: 'research-brief',
        nameKey: 'workflow_template_research_brief',
        descriptionKey: 'workflow_template_research_brief_description',
        icon: 'book-open',
        accent: 'indigo',
        nodes: [
            { id: 'trigger-webhook', position: { x: 100, y: 180 } },
            { id: 'transform-summary', position: { x: 420, y: 120 } },
            { id: 'transform-language', position: { x: 720, y: 180 } },
            { id: 'action-open-panel', position: { x: 1020, y: 180 } }
        ],
        connections: [
            { from: { node: 0, port: 'payload' }, to: { node: 1, port: 'text' } },
            { from: { node: 1, port: 'summary' }, to: { node: 2, port: 'text' } },
            { from: { node: 2, port: 'text' }, to: { node: 3, port: 'context' } }
        ]
    },
    {
        id: 'daily-standup',
        nameKey: 'workflow_template_daily_standup',
        descriptionKey: 'workflow_template_daily_standup_description',
        icon: 'mic',
        accent: 'sunset',
        nodes: [
            { id: 'trigger-schedule', position: { x: 120, y: 120 } },
            { id: 'transform-markdown', position: { x: 420, y: 80 } },
            { id: 'action-send-webhook', position: { x: 740, y: 140 } }
        ],
        connections: [
            { from: { node: 0, port: 'tick' }, to: { node: 1, port: 'text' } },
            { from: { node: 1, port: 'document' }, to: { node: 2, port: 'payload' } }
        ]
    },
    {
        id: 'status-email',
        nameKey: 'workflow_template_status_email',
        descriptionKey: 'workflow_template_status_email_description',
        icon: 'mail',
        accent: 'crimson',
        nodes: [
            { id: 'trigger-schedule', position: { x: 120, y: 90 } },
            { id: 'transform-summary', position: { x: 400, y: 120 } },
            { id: 'transform-markdown', position: { x: 680, y: 160 } },
            { id: 'action-send-webhook', position: { x: 970, y: 200 } }
        ],
        connections: [
            { from: { node: 0, port: 'tick' }, to: { node: 1, port: 'text' } },
            { from: { node: 1, port: 'summary' }, to: { node: 2, port: 'text' } },
            { from: { node: 2, port: 'document' }, to: { node: 3, port: 'payload' } }
        ]
    },
    {
        id: 'ai-scout',
        nameKey: 'workflow_template_ai_scout',
        descriptionKey: 'workflow_template_ai_scout_description',
        icon: 'cpu',
        accent: 'mint',
        nodes: [
            { id: 'trigger-webhook', position: { x: 120, y: 140 } },
            { id: 'transform-ai-analysis', position: { x: 440, y: 160 } },
            { id: 'action-create-note', position: { x: 760, y: 110 } }
        ],
        connections: [
            { from: { node: 0, port: 'payload' }, to: { node: 1, port: 'text' } },
            { from: { node: 1, port: 'insight' }, to: { node: 2, port: 'document' } }
        ]
    },
    {
        id: 'focus-playlist',
        nameKey: 'workflow_template_focus_playlist',
        descriptionKey: 'workflow_template_focus_playlist_description',
        icon: 'music',
        accent: 'blue',
        nodes: [
            { id: 'trigger-schedule', position: { x: 120, y: 60 } },
            { id: 'transform-ai-analysis', position: { x: 420, y: 60 } },
            { id: 'action-open-panel', position: { x: 720, y: 120 } }
        ],
        connections: [
            { from: { node: 0, port: 'tick' }, to: { node: 1, port: 'text' } },
            { from: { node: 1, port: 'insight' }, to: { node: 2, port: 'context' } }
        ]
    },
    {
        id: 'design-review',
        nameKey: 'workflow_template_design_review',
        descriptionKey: 'workflow_template_design_review_description',
        icon: 'pen-tool',
        accent: 'gold',
        nodes: [
            { id: 'trigger-clipboard', position: { x: 120, y: 100 } },
            { id: 'transform-language', position: { x: 420, y: 160 } },
            { id: 'transform-markdown', position: { x: 720, y: 120 } },
            { id: 'action-create-note', position: { x: 1020, y: 160 } }
        ],
        connections: [
            { from: { node: 0, port: 'text' }, to: { node: 1, port: 'text' } },
            { from: { node: 1, port: 'text' }, to: { node: 2, port: 'text' } },
            { from: { node: 2, port: 'document' }, to: { node: 3, port: 'document' } }
        ]
    },
    {
        id: 'metrics-dashboard',
        nameKey: 'workflow_template_metrics_dashboard',
        descriptionKey: 'workflow_template_metrics_dashboard_description',
        icon: 'trending-up',
        accent: 'emerald',
        nodes: [
            { id: 'trigger-webhook', position: { x: 120, y: 200 } },
            { id: 'transform-summary', position: { x: 420, y: 120 } },
            { id: 'transform-ai-analysis', position: { x: 740, y: 140 } },
            { id: 'action-open-panel', position: { x: 1060, y: 180 } }
        ],
        connections: [
            { from: { node: 0, port: 'payload' }, to: { node: 1, port: 'text' } },
            { from: { node: 1, port: 'summary' }, to: { node: 2, port: 'text' } },
            { from: { node: 2, port: 'insight' }, to: { node: 3, port: 'context' } }
        ]
    }
];

const QuickActionManager = {
    library: QuickActionLibrary,
    templates: WorkflowTemplates,
    modules: WorkflowModuleCatalog,

    init() {
        this.ensureSettingsIntegrity();
    },

    ensureSettingsIntegrity() {
        if (!AppState.settings) return;
        if (!Array.isArray(AppState.settings.toolbarActions)) {
            if (Array.isArray(AppState.settings.activeAddons) && AppState.settings.activeAddons.length > 0) {
                AppState.settings.toolbarActions = [...new Set(AppState.settings.activeAddons)];
            } else {
                AppState.settings.toolbarActions = [...QuickActionDefaults];
            }
            ipcRenderer.send('update-setting', 'toolbarActions', AppState.settings.toolbarActions);
        }
        if (!Array.isArray(AppState.settings.customWorkflows)) {
            if (Array.isArray(AppState.settings.customAddons)) {
                AppState.settings.customWorkflows = AppState.settings.customAddons.map(addon => ({
                    id: addon.id,
                    name: addon.name,
                    icon: addon.icon || 'zap',
                    accent: addon.accent || 'violet',
                    description: addon.description || '',
                    nodes: addon.blocks?.map((block, index) => ({
                        id: block,
                        position: { x: 160 + index * 220, y: 120 + (index % 2) * 120 },
                        config: {}
                    })) || [],
                    connections: []
                }));
            } else {
                AppState.settings.customWorkflows = [];
            }
            ipcRenderer.send('update-setting', 'customWorkflows', AppState.settings.customWorkflows);
        }
    },

    getActiveActionIds() {
        const stored = Array.isArray(AppState.settings?.toolbarActions) ? [...AppState.settings.toolbarActions] : [];
        if (stored.length === 0) {
            stored.push(...QuickActionDefaults);
            this.setActiveActionIds(stored, { persist: true, silent: true });
        }
        return stored;
    },

    setActiveActionIds(ids, options = { persist: true, silent: false }) {
        const normalized = Array.from(new Set((ids || []).filter(Boolean)));
        AppState.settings.toolbarActions = normalized;
        if (options.persist) {
            ipcRenderer.send('update-setting', 'toolbarActions', normalized);
        }
        if (!options.silent) {
            ToolbarQuickActions.refresh();
        }
    },

    getActionDefinition(id) {
        if (!id) return null;
        const builtin = this.library.find(item => item.id === id);
        if (builtin) return { ...builtin, source: 'builtin' };
        const workflow = this.getWorkflowById(id);
        if (workflow) {
            return this.createActionFromWorkflow(workflow);
        }
        return null;
    },

    getWorkflowById(id) {
        if (!id) return null;
        return (AppState.settings.customWorkflows || []).find(workflow => workflow.id === id) || null;
    },

    createActionFromWorkflow(workflow) {
        if (!workflow) return null;
        return {
            id: workflow.id,
            icon: workflow.icon || 'zap',
            accent: workflow.accent || 'violet',
            type: 'workflow',
            payload: { workflowId: workflow.id },
            name: workflow.name,
            description: workflow.description || '',
            source: 'custom',
            tags: ['workflow', 'custom']
        };
    },

    getRenderableActions() {
        const activeIds = this.getActiveActionIds();
        return activeIds
            .map(id => this.getActionDefinition(id))
            .filter(Boolean);
    },

    listAvailableLibrary() {
        const activeIds = new Set(this.getActiveActionIds());
        const customActions = (AppState.settings.customWorkflows || []).map(workflow => this.createActionFromWorkflow(workflow));
        const merged = [...this.library.map(item => ({ ...item, source: 'builtin', isActive: activeIds.has(item.id) })),
            ...customActions.map(item => ({ ...item, isActive: activeIds.has(item.id) }))];
        return merged;
    },

    upsertWorkflow(workflow) {
        if (!workflow?.id) return;
        const workflows = Array.isArray(AppState.settings.customWorkflows) ? [...AppState.settings.customWorkflows] : [];
        const index = workflows.findIndex(item => item.id === workflow.id);
        if (index === -1) {
            workflows.push(workflow);
        } else {
            workflows[index] = workflow;
        }
        AppState.settings.customWorkflows = workflows;
        ipcRenderer.send('update-setting', 'customWorkflows', workflows);
        ToolbarQuickActions.refresh();
        SettingsModule.renderAddons();
    },

    removeWorkflow(id) {
        const workflows = Array.isArray(AppState.settings.customWorkflows) ? [...AppState.settings.customWorkflows] : [];
        const filtered = workflows.filter(workflow => workflow.id !== id);
        if (filtered.length === workflows.length) return;
        AppState.settings.customWorkflows = filtered;
        ipcRenderer.send('update-setting', 'customWorkflows', filtered);
        const active = this.getActiveActionIds().filter(actionId => actionId !== id);
        this.setActiveActionIds(active, { persist: true, silent: true });
        ToolbarQuickActions.refresh();
        SettingsModule.renderAddons();
    },

    getTemplateById(id) {
        return this.templates.find(template => template.id === id) || null;
    },

    getModuleById(id) {
        return this.modules.find(module => module.id === id) || null;
    },

    formatActionTitle(action) {
        if (!action) return LocalizationRenderer.t('quick_action_unknown');
        if (action.nameKey) return LocalizationRenderer.t(action.nameKey);
        if (action.name) return action.name;
        return LocalizationRenderer.t('quick_action_unknown');
    },

    formatActionDescription(action) {
        if (!action) return '';
        if (action.descriptionKey) return LocalizationRenderer.t(action.descriptionKey);
        return action.description || '';
    },

    resolveAccentColor(accent) {
        const palette = {
            ocean: '#5096ff',
            amber: '#ffc75f',
            violet: '#9a6bff',
            teal: '#2dd4bf',
            magenta: '#ff73b3',
            indigo: '#6c63ff',
            sunset: '#ff9472',
            crimson: '#ff6b6b',
            mint: '#36f0c0',
            blue: '#4c6fff',
            gold: '#facc15',
            emerald: '#34d399'
        };
        return palette[accent] || '#6c63ff';
    }
};

const ToolbarQuickActions = {
    container: null,

    init() {
        this.container = Utils.getElement('#quick-actions-track');
        if (!this.container) return;
        this.refresh();
        window.addEventListener('resize', Utils.debounce(() => this.updateOverflowState(), 200));
    },

    refresh() {
        if (!this.container) return;
        this.container.innerHTML = '';
        const actions = QuickActionManager.getRenderableActions();
        actions.forEach(action => {
            const button = this.createButton(action);
            this.container.appendChild(button);
        });
        if (window.feather) window.feather.replace();
        this.updateOverflowState();
    },

    updateOverflowState() {
        if (!this.container) return;
        const hasOverflow = this.container.scrollWidth > this.container.clientWidth + 16;
        this.container.classList.toggle('has-overflow', hasOverflow);
    },

    createButton(action) {
        const button = Utils.createElement('button', { className: 'action-button quick-action-button glass-element' });
        const label = QuickActionManager.formatActionTitle(action);
        button.setAttribute('data-label', label);
        button.setAttribute('data-action-id', action.id);

        if (action.accent) {
            const accent = QuickActionManager.resolveAccentColor(action.accent);
            button.style.setProperty('--action-accent', accent);
            button.style.boxShadow = `0 6px 18px ${Utils.hexToRgba(accent, 0.25)}`;
        }

        const icon = Utils.createElement('i', { className: 'icon' });
        icon.setAttribute('data-feather', action.icon || 'zap');
        button.appendChild(icon);

        button.addEventListener('click', () => this.handleAction(action));
        return button;
    },

    handleAction(action) {
        if (!action) return;
        if (action.type === 'panel' && action.payload?.panel) {
            AuxPanelManager.togglePanel(action.payload.panel);
        } else if (action.type === 'workflow') {
            WorkflowRuntime.launch(action);
        } else {
            console.warn('Unknown action type', action);
        }
    }
};

const WorkflowRuntime = {
    launch(action) {
        if (action.payload?.workflowId) {
            const workflow = QuickActionManager.getWorkflowById(action.payload.workflowId);
            if (!workflow) {
                this.showToast('runtime', LocalizationRenderer.t('workflow_runtime_missing'));
                return;
            }
            this.executeWorkflow(workflow);
        } else if (action.payload?.templateId) {
            const template = QuickActionManager.getTemplateById(action.payload.templateId);
            if (!template) {
                this.showToast('runtime', LocalizationRenderer.t('workflow_runtime_missing_template'));
                return;
            }
            const generated = this.instantiateTemplate(template);
            this.executeWorkflow(generated);
        } else {
            this.showToast('runtime', LocalizationRenderer.t('workflow_runtime_unknown_payload'));
        }
    },

    instantiateTemplate(template) {
        return {
            id: `temp-${Date.now()}`,
            name: LocalizationRenderer.t(template.nameKey),
            icon: template.icon,
            accent: template.accent,
            nodes: template.nodes.map(node => ({
                ...node,
                config: this.autofillConfig(node.id)
            })),
            connections: template.connections
        };
    },

    autofillConfig(moduleId) {
        const module = QuickActionManager.getModuleById(moduleId);
        if (!module) return {};
        const config = {};
        (module.configSchema || []).forEach(field => {
            if (Object.prototype.hasOwnProperty.call(field, 'default')) {
                config[field.field] = field.default;
            } else if (field.type === 'boolean') {
                config[field.field] = false;
            } else if (field.type === 'list' || field.type === 'multi-text') {
                config[field.field] = [];
            } else {
                config[field.field] = '';
            }
        });
        return config;
    },

    executeWorkflow(workflow) {
        this.showToast('runtime', LocalizationRenderer.t('workflow_runtime_start', workflow.name || 'workflow'));
        setTimeout(() => {
            this.showToast('runtime', LocalizationRenderer.t('workflow_runtime_finished', workflow.name || 'workflow'));
        }, 600);
    },

    showToast(channel, message) {
        const existing = document.querySelector(`.workflow-toast[data-channel="${channel}"]`);
        if (existing) existing.remove();
        const toast = Utils.createElement('div', { className: 'workflow-toast', text: message });
        toast.dataset.channel = channel;
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('visible'), 10);
        setTimeout(() => {
            toast.classList.remove('visible');
            setTimeout(() => toast.remove(), 300);
        }, 2800);
    }
};

const WorkflowBuilder = {
    overlay: null,
    moduleListEl: null,
    canvasEl: null,
    connectionSvg: null,
    inspectorEl: null,
    nameInput: null,
    iconSelect: null,
    deleteButton: null,
    saveButton: null,
    closeButton: null,
    historyContainer: null,
    searchInput: null,
    emptyStateButton: null,

    state: {
        isOpen: false,
        editingWorkflowId: null,
        nodes: [],
        connections: [],
        selectedNodeId: null,
        viewTransform: { x: 0, y: 0, scale: 1 }
    },

    init() {
        this.overlay = Utils.getElement('#workflow-builder-overlay');
        if (!this.overlay) return;
        this.moduleListEl = Utils.getElement('#workflow-module-list');
        this.canvasEl = Utils.getElement('#workflow-canvas');
        this.connectionSvg = Utils.getElement('#workflow-connections');
        this.inspectorEl = Utils.getElement('#workflow-inspector');
        this.nameInput = Utils.getElement('#workflow-name');
        this.iconSelect = Utils.getElement('#workflow-icon');
        this.deleteButton = Utils.getElement('#workflow-delete');
        this.saveButton = Utils.getElement('#workflow-save');
        this.closeButton = Utils.getElement('#workflow-builder-close');
        this.historyContainer = Utils.getElement('#workflow-studio-history');
        this.searchInput = Utils.getElement('#workflow-module-search');
        this.emptyStateButton = Utils.getElement('#workflow-empty-add-trigger');

        this.bindEvents();
        this.renderModuleLibrary();
        this.renderInspector();
    },

    bindEvents() {
        if (this.closeButton) this.closeButton.addEventListener('click', () => this.close());
        if (this.saveButton) this.saveButton.addEventListener('click', () => this.save());
        if (this.deleteButton) this.deleteButton.addEventListener('click', () => this.deleteWorkflow());
        if (this.overlay) this.overlay.addEventListener('click', (event) => {
            if (event.target === this.overlay) this.close();
        });
        if (this.canvasEl) {
            this.canvasEl.addEventListener('click', (event) => {
                if (event.target === this.canvasEl) {
                    this.state.selectedNodeId = null;
                    this.renderInspector();
                    this.renderCanvas();
                }
            });
        }
        if (this.searchInput) {
            this.searchInput.addEventListener('input', Utils.debounce(() => {
                this.renderModuleLibrary(this.searchInput.value.trim().toLowerCase());
            }, 120));
        }
        if (this.emptyStateButton) {
            this.emptyStateButton.addEventListener('click', () => {
                const firstTrigger = QuickActionManager.modules.find(module => module.category === 'trigger');
                if (firstTrigger) this.addModuleToCanvas(firstTrigger.id);
            });
        }
    },

    syncFromSettings() {
        this.renderHistory();
        if (this.state.isOpen && this.state.editingWorkflowId) {
            const workflow = QuickActionManager.getWorkflowById(this.state.editingWorkflowId);
            if (workflow) this.loadWorkflow(workflow);
        }
    },

    renderModuleLibrary(filter = '') {
        if (!this.moduleListEl) return;
        this.moduleListEl.innerHTML = '';
        const fragment = document.createDocumentFragment();
        QuickActionManager.modules
            .filter(module => {
                if (!filter) return true;
                const label = LocalizationRenderer.t(module.nameKey);
                const description = LocalizationRenderer.t(module.descriptionKey);
                return label.toLowerCase().includes(filter) || description.toLowerCase().includes(filter);
            })
            .forEach(module => {
                const card = Utils.createElement('div', { className: 'workflow-module-card' });
                const header = Utils.createElement('div', { className: 'workflow-module-title', text: LocalizationRenderer.t(module.nameKey) });
                const description = Utils.createElement('div', { className: 'workflow-module-description', text: LocalizationRenderer.t(module.descriptionKey) });
                const tags = Utils.createElement('div', { className: 'workflow-module-tags' });
                tags.appendChild(Utils.createElement('span', { className: 'workflow-tag', text: module.category }));
                card.appendChild(header);
                card.appendChild(description);
                card.appendChild(tags);
                card.addEventListener('click', () => this.addModuleToCanvas(module.id));
                fragment.appendChild(card);
            });
        this.moduleListEl.appendChild(fragment);
        if (window.feather) window.feather.replace();
    },

    renderHistory() {
        if (!this.historyContainer) return;
        this.historyContainer.innerHTML = '';
        const workflows = Array.isArray(AppState.settings.customWorkflows) ? [...AppState.settings.customWorkflows] : [];
        if (workflows.length === 0) {
            const placeholder = Utils.createElement('div', { className: 'workflow-studio-placeholder' });
            placeholder.innerHTML = `<i data-feather="aperture"></i><span>${LocalizationRenderer.t('workflow_history_empty')}</span>`;
            this.historyContainer.appendChild(placeholder);
            if (window.feather) window.feather.replace();
            return;
        }
        workflows.forEach(workflow => {
            const entry = Utils.createElement('div', { className: 'workflow-history-entry' });
            const meta = Utils.createElement('div');
            meta.innerHTML = `<h4>${Utils.escapeHtml(workflow.name || 'Workflow')}</h4><p>${Utils.escapeHtml(workflow.description || '')}</p>`;
            const actions = Utils.createElement('div', { className: 'workflow-history-actions' });
            const openButton = Utils.createElement('button', { text: LocalizationRenderer.t('workflow_history_edit') });
            openButton.addEventListener('click', () => this.open(workflow.id));
            const runButton = Utils.createElement('button', { text: LocalizationRenderer.t('workflow_history_run') });
            runButton.addEventListener('click', () => WorkflowRuntime.launch({ type: 'workflow', payload: { workflowId: workflow.id } }));
            actions.appendChild(openButton);
            actions.appendChild(runButton);
            entry.appendChild(meta);
            entry.appendChild(actions);
            this.historyContainer.appendChild(entry);
        });
    },

    open(workflowId = null) {
        this.overlay.classList.remove('hidden');
        this.overlay.setAttribute('aria-hidden', 'false');
        this.state.isOpen = true;
        this.state.editingWorkflowId = workflowId;
        const workflow = workflowId ? QuickActionManager.getWorkflowById(workflowId) : null;
        if (workflow) {
            this.loadWorkflow(workflow);
        } else {
            this.resetState();
        }
        if (window.feather) window.feather.replace();
    },

    openTemplate(templateId) {
        const template = QuickActionManager.getTemplateById(templateId);
        if (!template) return;
        this.open();
        this.state.nodes = template.nodes.map((node, index) => ({
            uid: `${node.id}-${Date.now()}-${index}`,
            moduleId: node.id,
            position: { ...node.position },
            config: WorkflowRuntime.autofillConfig(node.id)
        }));
        this.state.connections = template.connections.map(connection => ({ ...connection }));
        this.nameInput.value = LocalizationRenderer.t(template.nameKey);
        this.iconSelect.value = template.icon || 'zap';
        this.renderCanvas();
        this.renderInspector();
    },

    openForNew() {
        this.open();
        this.resetState();
    },

    close() {
        this.overlay.classList.add('hidden');
        this.overlay.setAttribute('aria-hidden', 'true');
        this.state.isOpen = false;
        this.state.editingWorkflowId = null;
        this.state.nodes = [];
        this.state.connections = [];
        this.state.selectedNodeId = null;
        this.renderCanvas();
        this.renderInspector();
    },

    resetState() {
        this.state.nodes = [];
        this.state.connections = [];
        this.state.selectedNodeId = null;
        this.nameInput.value = '';
        this.iconSelect.value = 'zap';
        this.renderCanvas();
        this.renderInspector();
    },

    loadWorkflow(workflow) {
        this.nameInput.value = workflow.name || '';
        this.iconSelect.value = workflow.icon || 'zap';
        this.state.nodes = (workflow.nodes || []).map((node, index) => ({
            uid: node.uid || `${node.id}-${Date.now()}-${index}`,
            moduleId: node.id,
            position: node.position || { x: 120 + index * 220, y: 120 },
            config: node.config || {}
        }));
        this.state.connections = (workflow.connections || []).map(connection => ({ ...connection }));
        this.renderCanvas();
        this.renderInspector();
    },

    addModuleToCanvas(moduleId) {
        const module = QuickActionManager.getModuleById(moduleId);
        if (!module) return;
        const uid = `${module.id}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        this.state.nodes.push({
            uid,
            moduleId: module.id,
            position: { x: 180 + this.state.nodes.length * 140, y: 160 },
            config: WorkflowRuntime.autofillConfig(module.id)
        });
        this.state.selectedNodeId = uid;
        this.renderCanvas();
        this.renderInspector();
    },

    renderCanvas() {
        if (!this.canvasEl) return;
        const existingNodes = Array.from(this.canvasEl.querySelectorAll('.workflow-node'));
        existingNodes.forEach(node => node.remove());
        (this.connectionSvg ? this.connectionSvg.innerHTML = '' : null);

        const fragment = document.createDocumentFragment();
        this.state.nodes.forEach(node => {
            const module = QuickActionManager.getModuleById(node.moduleId);
            const nodeEl = Utils.createElement('div', { className: 'workflow-node' });
            nodeEl.style.left = `${node.position.x}px`;
            nodeEl.style.top = `${node.position.y}px`;
            if (this.state.selectedNodeId === node.uid) nodeEl.classList.add('selected');

            const header = Utils.createElement('div', { className: 'workflow-node-header' });
            const title = Utils.createElement('div', { className: 'workflow-node-title' });
            const icon = Utils.createElement('i', { className: 'icon' });
            icon.setAttribute('data-feather', module?.icon || 'box');
            title.appendChild(icon);
            title.appendChild(document.createTextNode(LocalizationRenderer.t(module?.nameKey || 'workflow_unknown_module')));
            const type = Utils.createElement('span', { className: 'workflow-node-type', text: module?.category || '' });
            header.appendChild(title);
            header.appendChild(type);

            const body = Utils.createElement('div', { className: 'workflow-node-body' });
            const ports = Utils.createElement('div', { className: 'workflow-ports' });
            const inputs = Utils.createElement('div', { className: 'workflow-port-list' });
            const outputs = Utils.createElement('div', { className: 'workflow-port-list' });

            (module?.inputs || []).forEach(input => {
                const port = Utils.createElement('div', { className: 'workflow-port' });
                const marker = Utils.createElement('span', { className: 'workflow-port-point' });
                marker.dataset.port = input;
                port.appendChild(marker);
                port.appendChild(Utils.createElement('span', { text: input }));
                inputs.appendChild(port);
            });

            (module?.outputs || []).forEach(output => {
                const port = Utils.createElement('div', { className: 'workflow-port' });
                port.appendChild(Utils.createElement('span', { text: output }));
                const marker = Utils.createElement('span', { className: 'workflow-port-point' });
                marker.dataset.port = output;
                port.appendChild(marker);
                outputs.appendChild(port);
            });

            ports.appendChild(inputs);
            ports.appendChild(outputs);
            body.appendChild(ports);

            nodeEl.appendChild(header);
            nodeEl.appendChild(body);

            let isDragging = false;
            let dragOffset = { x: 0, y: 0 };

            nodeEl.addEventListener('mousedown', (event) => {
                if (event.button !== 0) return;
                isDragging = true;
                dragOffset = {
                    x: event.clientX - node.position.x,
                    y: event.clientY - node.position.y
                };
                this.state.selectedNodeId = node.uid;
                this.renderInspector();
                nodeEl.classList.add('dragging');
            });

            document.addEventListener('mousemove', (event) => {
                if (!isDragging) return;
                node.position.x = event.clientX - dragOffset.x;
                node.position.y = event.clientY - dragOffset.y;
                nodeEl.style.left = `${node.position.x}px`;
                nodeEl.style.top = `${node.position.y}px`;
                this.renderConnections();
            });

            document.addEventListener('mouseup', () => {
                if (!isDragging) return;
                isDragging = false;
                nodeEl.classList.remove('dragging');
                this.renderConnections();
            }, { once: true });

            nodeEl.addEventListener('click', (event) => {
                event.stopPropagation();
                this.state.selectedNodeId = node.uid;
                this.renderInspector();
                this.renderCanvas();
            });

            fragment.appendChild(nodeEl);
        });

        this.canvasEl.appendChild(fragment);
        if (window.feather) window.feather.replace();
        this.renderConnections();
        Utils.getElement('#workflow-empty-state')?.classList.toggle('hidden', this.state.nodes.length > 0);
    },

    renderConnections() {
        if (!this.connectionSvg) return;
        this.connectionSvg.innerHTML = '';
        this.state.connections.forEach(connection => {
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('class', 'workflow-connection-path');
            const fromNode = this.state.nodes[connection.from.node];
            const toNode = this.state.nodes[connection.to.node];
            if (!fromNode || !toNode) return;
            const startX = fromNode.position.x + 260;
            const startY = fromNode.position.y + 120;
            const endX = toNode.position.x;
            const endY = toNode.position.y + 120;
            const curve = 120;
            const d = `M ${startX} ${startY} C ${startX + curve} ${startY}, ${endX - curve} ${endY}, ${endX} ${endY}`;
            path.setAttribute('d', d);
            this.connectionSvg.appendChild(path);
        });
    },

    renderInspector() {
        if (!this.inspectorEl) return;
        this.inspectorEl.innerHTML = '';
        const selected = this.state.nodes.find(node => node.uid === this.state.selectedNodeId);
        if (!selected) {
            const empty = Utils.createElement('div', { className: 'inspector-empty', text: LocalizationRenderer.t('workflow_inspector_empty') });
            this.inspectorEl.appendChild(empty);
            return;
        }
        const module = QuickActionManager.getModuleById(selected.moduleId);
        const header = Utils.createElement('div', { className: 'inspector-section' });
        header.innerHTML = `<h4>${LocalizationRenderer.t('workflow_inspector_module')}</h4><p>${LocalizationRenderer.t(module?.nameKey || 'workflow_unknown_module')}</p>`;
        this.inspectorEl.appendChild(header);

        const configSection = Utils.createElement('div', { className: 'inspector-section' });
        configSection.appendChild(Utils.createElement('h4', { text: LocalizationRenderer.t('workflow_inspector_configuration') }));

        (module?.configSchema || []).forEach(field => {
            const fieldWrapper = Utils.createElement('div', { className: 'inspector-field' });
            fieldWrapper.appendChild(Utils.createElement('label', { text: LocalizationRenderer.t(field.labelKey || '') }));

            if (field.type === 'textarea') {
                const textarea = Utils.createElement('textarea');
                textarea.value = selected.config[field.field] || '';
                textarea.addEventListener('input', () => {
                    selected.config[field.field] = textarea.value;
                });
                fieldWrapper.appendChild(textarea);
            } else if (field.type === 'boolean') {
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.checked = !!selected.config[field.field];
                checkbox.addEventListener('change', () => {
                    selected.config[field.field] = checkbox.checked;
                });
                fieldWrapper.appendChild(checkbox);
            } else if (field.type === 'number') {
                const input = document.createElement('input');
                input.type = 'number';
                input.value = selected.config[field.field] ?? field.default ?? 0;
                input.addEventListener('input', () => {
                    selected.config[field.field] = parseFloat(input.value);
                });
                fieldWrapper.appendChild(input);
            } else if (field.type === 'select') {
                const select = document.createElement('select');
                (field.options || []).forEach(option => {
                    const optionEl = document.createElement('option');
                    optionEl.value = option;
                    optionEl.textContent = option;
                    select.appendChild(optionEl);
                });
                select.value = selected.config[field.field] || field.options?.[0] || '';
                select.addEventListener('change', () => {
                    selected.config[field.field] = select.value;
                });
                fieldWrapper.appendChild(select);
            } else if (field.type === 'multi-text' || field.type === 'list') {
                const input = document.createElement('textarea');
                const values = Array.isArray(selected.config[field.field]) ? selected.config[field.field] : [];
                input.value = values.join('\n');
                input.addEventListener('input', () => {
                    selected.config[field.field] = input.value.split('\n').map(line => line.trim()).filter(Boolean);
                });
                fieldWrapper.appendChild(input);
            } else {
                const input = document.createElement('input');
                input.type = 'text';
                input.value = selected.config[field.field] || '';
                input.placeholder = field.placeholderKey ? LocalizationRenderer.t(field.placeholderKey) : '';
                input.addEventListener('input', () => {
                    selected.config[field.field] = input.value;
                });
                fieldWrapper.appendChild(input);
            }

            configSection.appendChild(fieldWrapper);
        });

        const actions = Utils.createElement('div', { className: 'inspector-section' });
        actions.appendChild(Utils.createElement('h4', { text: LocalizationRenderer.t('workflow_inspector_actions') }));
        const deleteNodeButton = Utils.createElement('button', { className: 'toolbar-library-button danger', text: LocalizationRenderer.t('workflow_inspector_remove_node') });
        deleteNodeButton.addEventListener('click', () => this.removeNode(selected.uid));
        actions.appendChild(deleteNodeButton);

        this.inspectorEl.appendChild(configSection);
        this.inspectorEl.appendChild(actions);
    },

    removeNode(uid) {
        this.state.nodes = this.state.nodes.filter(node => node.uid !== uid);
        this.state.connections = this.state.connections.filter(connection => connection.from.node !== uid && connection.to.node !== uid);
        this.state.selectedNodeId = null;
        this.renderCanvas();
        this.renderInspector();
    },

    save() {
        const name = this.nameInput?.value.trim();
        if (!name) {
            alert(LocalizationRenderer.t('workflow_builder_error_name_required'));
            return;
        }
        const workflow = {
            id: this.state.editingWorkflowId || `workflow-${Date.now()}`,
            name,
            icon: this.iconSelect?.value || 'zap',
            accent: 'violet',
            description: '',
            nodes: this.state.nodes.map(node => ({
                id: node.moduleId,
                uid: node.uid,
                position: node.position,
                config: node.config
            })),
            connections: [...this.state.connections]
        };
        QuickActionManager.upsertWorkflow(workflow);
        QuickActionManager.setActiveActionIds([...new Set([...QuickActionManager.getActiveActionIds(), workflow.id])]);
        this.state.editingWorkflowId = workflow.id;
        this.renderHistory();
        this.close();
    },

    deleteWorkflow() {
        if (!this.state.editingWorkflowId) {
            this.close();
            return;
        }
        if (!window.confirm(LocalizationRenderer.t('workflow_builder_delete_confirm'))) return;
        QuickActionManager.removeWorkflow(this.state.editingWorkflowId);
        this.close();
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

        const resetDefaults = Utils.getElement('#addons-sync-defaults');
        if (resetDefaults) {
            resetDefaults.addEventListener('click', () => {
                QuickActionManager.setActiveActionIds([...QuickActionDefaults]);
                this.renderAddons();
            });
        }

        const toolbarList = Utils.getElement('#toolbar-active-list');
        if (toolbarList) {
            toolbarList.addEventListener('click', (event) => {
                const removeButton = event.target.closest('[data-action="remove"]');
                if (removeButton) {
                    const id = removeButton.getAttribute('data-action-id');
                    this.toggleToolbarAction(id, false);
                }
                const moveButton = event.target.closest('[data-action="move"]');
                if (moveButton) {
                    const id = moveButton.getAttribute('data-action-id');
                    const direction = moveButton.getAttribute('data-direction');
                    this.moveToolbarAction(id, direction === 'up' ? -1 : 1);
                }
            });
        }

        const libraryGrid = Utils.getElement('#toolbar-library-grid');
        if (libraryGrid) {
            libraryGrid.addEventListener('click', (event) => {
                const toggle = event.target.closest('[data-action="toggle-action"]');
                if (toggle) {
                    const id = toggle.getAttribute('data-action-id');
                    const active = toggle.getAttribute('data-active') === 'true';
                    this.toggleToolbarAction(id, !active);
                }
                const edit = event.target.closest('[data-action="edit-workflow"]');
                if (edit) {
                    const id = edit.getAttribute('data-action-id');
                    WorkflowBuilder.open(id);
                }
                const preview = event.target.closest('[data-action="preview-template"]');
                if (preview) {
                    const templateId = preview.getAttribute('data-template-id');
                    WorkflowBuilder.openTemplate(templateId);
                }
            });
        }

        const newWorkflowButton = Utils.getElement('#workflow-studio-new');
        if (newWorkflowButton) {
            newWorkflowButton.addEventListener('click', () => WorkflowBuilder.openForNew());
        }

        const openLibraryButton = Utils.getElement('#workflow-studio-open-library');
        if (openLibraryButton) {
            openLibraryButton.addEventListener('click', () => WorkflowBuilder.open());
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
        const shouldShow = this.hasActiveSubscription();
        const manager = Utils.getElement('#toolbar-actions-manager');
        if (manager) manager.classList.toggle('is-hidden', !shouldShow);
        if (!shouldShow) return;
        QuickActionManager.ensureSettingsIntegrity();
        this.renderToolbar();
    },

    renderToolbar: function() {
        const activeList = Utils.getElement('#toolbar-active-list');
        const libraryGrid = Utils.getElement('#toolbar-library-grid');
        if (!activeList || !libraryGrid) return;

        const activeIds = QuickActionManager.getActiveActionIds();
        activeList.innerHTML = '';
        if (activeIds.length === 0) {
            const empty = Utils.createElement('div', { className: 'toolbar-empty-state' });
            empty.innerHTML = `<i data-feather="inbox"></i><span>${LocalizationRenderer.t('addons_toolbar_empty')}</span>`;
            activeList.appendChild(empty);
        } else {
            activeIds.forEach((id, index) => {
                const action = QuickActionManager.getActionDefinition(id);
                if (!action) return;
                const item = Utils.createElement('li', { className: 'toolbar-action-card' });
                const handle = Utils.createElement('div', { className: 'toolbar-drag-handle', text: '⋮⋮' });
                handle.setAttribute('data-action-id', id);
                item.appendChild(handle);

                const icon = Utils.createElement('div', { className: 'toolbar-action-icon' });
                icon.innerHTML = `<i data-feather="${action.icon || 'zap'}"></i>`;
                item.appendChild(icon);

                const info = Utils.createElement('div', { className: 'toolbar-action-content' });
                info.appendChild(Utils.createElement('span', { className: 'toolbar-action-title', text: QuickActionManager.formatActionTitle(action) }));
                const description = QuickActionManager.formatActionDescription(action);
                if (description) info.appendChild(Utils.createElement('span', { className: 'toolbar-action-description', text: description }));
                item.appendChild(info);

                const controls = Utils.createElement('div', { className: 'toolbar-action-controls' });
                const up = Utils.createElement('button', { className: 'toolbar-library-button subtle', text: '↑' });
                up.setAttribute('data-action', 'move');
                up.setAttribute('data-direction', 'up');
                up.setAttribute('data-action-id', id);
                up.disabled = index === 0;
                const down = Utils.createElement('button', { className: 'toolbar-library-button subtle', text: '↓' });
                down.setAttribute('data-action', 'move');
                down.setAttribute('data-direction', 'down');
                down.setAttribute('data-action-id', id);
                down.disabled = index === activeIds.length - 1;
                const remove = Utils.createElement('button', { className: 'toolbar-library-button danger', text: LocalizationRenderer.t('addons_toolbar_remove') });
                remove.setAttribute('data-action', 'remove');
                remove.setAttribute('data-action-id', id);
                controls.appendChild(up);
                controls.appendChild(down);
                controls.appendChild(remove);
                item.appendChild(controls);
                activeList.appendChild(item);
            });
        }

        libraryGrid.innerHTML = '';
        QuickActionManager.listAvailableLibrary().forEach(action => {
            const card = Utils.createElement('div', { className: 'toolbar-library-card' });
            const icon = Utils.createElement('div', { className: 'toolbar-action-icon' });
            icon.innerHTML = `<i data-feather="${action.icon || 'zap'}"></i>`;
            card.appendChild(icon);

            const meta = Utils.createElement('div', { className: 'toolbar-library-meta' });
            meta.appendChild(Utils.createElement('div', { className: 'toolbar-action-title', text: QuickActionManager.formatActionTitle(action) }));
            meta.appendChild(Utils.createElement('div', { className: 'toolbar-action-description', text: QuickActionManager.formatActionDescription(action) }));
            if (Array.isArray(action.tags) && action.tags.length > 0) {
                meta.appendChild(Utils.createElement('span', { className: 'toolbar-library-tag', text: action.tags[0] }));
            }
            card.appendChild(meta);

            const controls = Utils.createElement('div', { className: 'toolbar-library-controls' });
            const toggle = Utils.createElement('button', { className: 'toolbar-library-button is-primary', text: action.isActive ? LocalizationRenderer.t('addons_toolbar_added') : LocalizationRenderer.t('addons_toolbar_add') });
            toggle.setAttribute('data-action', 'toggle-action');
            toggle.setAttribute('data-action-id', action.id);
            toggle.setAttribute('data-active', action.isActive ? 'true' : 'false');
            if (action.isActive) toggle.classList.add('is-disabled');
            controls.appendChild(toggle);

            if (action.source === 'custom') {
                const edit = Utils.createElement('button', { className: 'toolbar-library-button', text: LocalizationRenderer.t('workflow_history_edit') });
                edit.setAttribute('data-action', 'edit-workflow');
                edit.setAttribute('data-action-id', action.id);
                controls.appendChild(edit);
            } else if (action.type === 'workflow' && action.payload?.templateId) {
                const preview = Utils.createElement('button', { className: 'toolbar-library-button', text: LocalizationRenderer.t('workflow_template_preview') });
                preview.setAttribute('data-action', 'preview-template');
                preview.setAttribute('data-template-id', action.payload.templateId);
                controls.appendChild(preview);
            }

            card.appendChild(controls);
            libraryGrid.appendChild(card);
        });

        WorkflowBuilder.renderHistory();
        if (window.feather) window.feather.replace();
    },

    toggleToolbarAction: function(id, value) {
        const current = QuickActionManager.getActiveActionIds();
        if (value) {
            if (!current.includes(id)) {
                current.push(id);
                QuickActionManager.setActiveActionIds(current);
                this.renderToolbar();
            }
        } else {
            const filtered = current.filter(actionId => actionId !== id);
            QuickActionManager.setActiveActionIds(filtered);
            this.renderToolbar();
        }
    },

    moveToolbarAction: function(id, delta) {
        const current = QuickActionManager.getActiveActionIds();
        const index = current.indexOf(id);
        if (index === -1) return;
        const target = index + delta;
        if (target < 0 || target >= current.length) return;
        const reordered = [...current];
        const [item] = reordered.splice(index, 1);
        reordered.splice(target, 0, item);
        QuickActionManager.setActiveActionIds(reordered);
        this.renderToolbar();
    },

    renderAddonBuilder: function() {
        WorkflowBuilder.renderHistory();
    },
    renderAddonBuilder: function() {
        WorkflowBuilder.renderHistory();
    },
    renderAddonBuilder: function() {
        this.highlightBuilderBase();
        this.renderBuilderStack();
        this.refreshBuilderPlaceholders();
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
    ToolbarQuickActions.init();
    WorkflowBuilder.init();

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
        QuickActionManager.init();
        ToolbarQuickActions.refresh();
        WorkflowBuilder.syncFromSettings();
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
