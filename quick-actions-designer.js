/* eslint-disable no-undef */
(function(global) {
    'use strict';

    const QUICK_ACTIONS_VERSION = 1;
    const MAX_HISTORY = 200;

    const translate = (key, fallback) => {
        const translator = global.LocalizationRenderer?.t;
        if (typeof translator === 'function') {
            const value = translator.call(global.LocalizationRenderer, key);
            if (value && !String(value).startsWith('Missing')) {
                return value;
            }
        }
        return fallback !== undefined ? fallback : key;
    };

    const PaletteGroups = {
        triggers: [
            {
                id: 'manual-trigger',
                type: 'trigger',
                labelKey: 'quick_actions_module_manual_trigger_name',
                labelFallback: 'Manual trigger',
                descriptionKey: 'quick_actions_module_manual_trigger_description',
                descriptionFallback: 'Start the flow when the button is pressed.',
                icon: 'play',
                defaultConfig: () => ({})
            },
            {
                id: 'clipboard-trigger',
                type: 'trigger',
                labelKey: 'quick_actions_module_clipboard_trigger_name',
                labelFallback: 'Clipboard capture',
                descriptionKey: 'quick_actions_module_clipboard_trigger_description',
                descriptionFallback: 'Injects the latest clipboard text.',
                icon: 'clipboard',
                defaultConfig: () => ({ mode: 'text' })
            },
            {
                id: 'selection-trigger',
                type: 'trigger',
                labelKey: 'quick_actions_module_selection_trigger_name',
                labelFallback: 'Selected text',
                descriptionKey: 'quick_actions_module_selection_trigger_description',
                descriptionFallback: 'Uses currently highlighted text in the OS (if available).',
                icon: 'type',
                defaultConfig: () => ({ fallback: '' })
            },
            {
                id: 'timer-trigger',
                type: 'trigger',
                labelKey: 'quick_actions_module_timer_trigger_name',
                labelFallback: 'Countdown timer',
                descriptionKey: 'quick_actions_module_timer_trigger_description',
                descriptionFallback: 'Delays execution for a configurable number of seconds.',
                icon: 'clock',
                defaultConfig: () => ({ seconds: 2 })
            }
        ],
        processors: [
            {
                id: 'format-markdown',
                type: 'processor',
                labelKey: 'quick_actions_module_format_markdown_name',
                labelFallback: 'Format as markdown list',
                descriptionKey: 'quick_actions_module_format_markdown_description',
                descriptionFallback: 'Turns newline-separated text into a bullet list.',
                icon: 'list',
                defaultConfig: () => ({ bullet: '-' })
            },
            {
                id: 'replace-text',
                type: 'processor',
                labelKey: 'quick_actions_module_replace_text_name',
                labelFallback: 'Replace text',
                descriptionKey: 'quick_actions_module_replace_text_description',
                descriptionFallback: 'Performs search & replace on string payloads.',
                icon: 'repeat',
                defaultConfig: () => ({ pattern: '', replace: '' })
            },
            {
                id: 'http-get',
                type: 'processor',
                labelKey: 'quick_actions_module_http_get_name',
                labelFallback: 'HTTP GET',
                descriptionKey: 'quick_actions_module_http_get_description',
                descriptionFallback: 'Requests data from a URL and passes the response body.',
                icon: 'cloud',
                defaultConfig: () => ({ url: 'https://api.github.com' })
            },
            {
                id: 'append-text',
                type: 'processor',
                labelKey: 'quick_actions_module_append_text_name',
                labelFallback: 'Append text',
                descriptionKey: 'quick_actions_module_append_text_description',
                descriptionFallback: 'Adds extra text to the payload.',
                icon: 'plus-square',
                defaultConfig: () => ({ value: '' })
            },
            {
                id: 'json-path',
                type: 'processor',
                labelKey: 'quick_actions_module_json_path_name',
                labelFallback: 'JSON path picker',
                descriptionKey: 'quick_actions_module_json_path_description',
                descriptionFallback: 'Extracts a property from JSON using a dot-path.',
                icon: 'database',
                defaultConfig: () => ({ path: '' })
            },
            {
                id: 'run-command',
                type: 'processor',
                labelKey: 'quick_actions_module_run_command_name',
                labelFallback: 'Run local command',
                descriptionKey: 'quick_actions_module_run_command_description',
                descriptionFallback: 'Executes a command via the backend process.',
                icon: 'terminal',
                defaultConfig: () => ({ command: '', args: '' })
            }
        ],
        outputs: [
            {
                id: 'show-toast',
                type: 'output',
                labelKey: 'quick_actions_module_show_toast_name',
                labelFallback: 'Show toast',
                descriptionKey: 'quick_actions_module_show_toast_description',
                descriptionFallback: 'Displays a transient notification inside FlashSearch.',
                icon: 'bell',
                defaultConfig: () => ({
                    title: translate('quick_actions_module_show_toast_title_default', 'Automation finished'),
                    body: ''
                })
            },
            {
                id: 'copy-result',
                type: 'output',
                labelKey: 'quick_actions_module_copy_result_name',
                labelFallback: 'Copy to clipboard',
                descriptionKey: 'quick_actions_module_copy_result_description',
                descriptionFallback: 'Writes the payload to the user clipboard.',
                icon: 'clipboard',
                defaultConfig: () => ({ format: 'text' })
            },
            {
                id: 'open-url',
                type: 'output',
                labelKey: 'quick_actions_module_open_url_name',
                labelFallback: 'Open URL',
                descriptionKey: 'quick_actions_module_open_url_description',
                descriptionFallback: 'Launches a web URL with the payload appended.',
                icon: 'external-link',
                defaultConfig: () => ({ baseUrl: 'https://google.com/search?q=' })
            },
            {
                id: 'emit-panel',
                type: 'output',
                labelKey: 'quick_actions_module_emit_panel_name',
                labelFallback: 'Render panel',
                descriptionKey: 'quick_actions_module_emit_panel_description',
                descriptionFallback: 'Displays results inside the auxiliary panel.',
                icon: 'layout',
                defaultConfig: () => ({
                    title: translate('quick_actions_module_emit_panel_title_default', 'Automation result'),
                    mode: 'list'
                })
            }
        ],
        utilities: [
            {
                id: 'branch-condition',
                type: 'utility',
                labelKey: 'quick_actions_module_branch_condition_name',
                labelFallback: 'Condition split',
                descriptionKey: 'quick_actions_module_branch_condition_description',
                descriptionFallback: 'Routes payloads based on a simple expression.',
                icon: 'git-branch',
                defaultConfig: () => ({ expression: 'payload.length > 0' })
            },
            {
                id: 'merge-streams',
                type: 'utility',
                labelKey: 'quick_actions_module_merge_streams_name',
                labelFallback: 'Merge streams',
                descriptionKey: 'quick_actions_module_merge_streams_description',
                descriptionFallback: 'Collects payloads from two inputs into an array.',
                icon: 'git-merge',
                defaultConfig: () => ({})
            },
            {
                id: 'delay-node',
                type: 'utility',
                labelKey: 'quick_actions_module_delay_name',
                labelFallback: 'Delay',
                descriptionKey: 'quick_actions_module_delay_description',
                descriptionFallback: 'Waits for N milliseconds before continuing.',
                icon: 'pause',
                defaultConfig: () => ({ ms: 300 })
            }
        ]
    };

    const BuiltInQuickActions = [
        {
            id: 'apps-library',
            nameKey: 'quick_actions_builtin_apps_library_name',
            nameFallback: 'Apps library',
            descriptionKey: 'quick_actions_builtin_apps_library_description',
            descriptionFallback: 'Open the curated FlashSearch application library.',
            icon: 'grid',
            color: '#6366F1',
            windowType: 'apps-library',
            locked: true
        },
        {
            id: 'files',
            nameKey: 'quick_actions_builtin_files_name',
            nameFallback: 'Files',
            descriptionKey: 'quick_actions_builtin_files_description',
            descriptionFallback: 'Browse indexed documents and files.',
            icon: 'folder',
            color: '#F97316',
            windowType: 'files',
            locked: false
        },
        {
            id: 'commands',
            nameKey: 'quick_actions_builtin_commands_name',
            nameFallback: 'Commands',
            descriptionKey: 'quick_actions_builtin_commands_description',
            descriptionFallback: 'Trigger quick commands and automations.',
            icon: 'command',
            color: '#0EA5E9',
            windowType: 'commands',
            locked: false
        },
        {
            id: 'clipboard',
            nameKey: 'quick_actions_builtin_clipboard_name',
            nameFallback: 'Clipboard',
            descriptionKey: 'quick_actions_builtin_clipboard_description',
            descriptionFallback: 'View the clipboard buffer with history and filters.',
            icon: 'copy',
            color: '#10B981',
            windowType: 'clipboard',
            locked: false
        }
    ];

const Utils = {
    createElement(tag, className, text) {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (typeof text === 'string') element.textContent = text;
        return element;
    },
        qs(selector, scope = document) {
            return scope.querySelector(selector);
        },
        qsa(selector, scope = document) {
            return Array.from(scope.querySelectorAll(selector));
        },
        clamp(value, min, max) {
            return Math.min(max, Math.max(min, value));
        },
        uid(prefix = 'qa') {
            return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
        },
        deepClone(value) {
            return JSON.parse(JSON.stringify(value));
        },
        formatDate(date = new Date()) {
            return date.toISOString();
        },
        parseJSON(value, fallback = null) {
            try {
                return JSON.parse(value);
            } catch (error) {
                return fallback;
            }
        },
        debounce(fn, wait = 150) {
            let timeout;
            return function debounced(...args) {
                clearTimeout(timeout);
                timeout = setTimeout(() => fn.apply(this, args), wait);
            };
        },
        throttle(fn, wait = 120) {
            let pending = false;
            let lastArgs;
            return function throttled(...args) {
                lastArgs = args;
                if (pending) return;
                pending = true;
                requestAnimationFrame(() => {
                    pending = false;
                    fn.apply(this, lastArgs);
                });
            };
        }
    };

    const NODE_TYPE_LABELS = {
        trigger: 'Trigger',
        processor: 'Processor',
        output: 'Output',
        utility: 'Utility'
    };

    const resolvePaletteItem = (item) => {
        if (!item) return null;
        return {
            ...item,
            label: translate(item.labelKey, item.labelFallback || item.label || item.id),
            description: translate(item.descriptionKey, item.descriptionFallback || item.description || '')
        };
    };

    const buildPaletteDefaultConfig = (item) => {
        if (!item) return {};
        const config = typeof item.defaultConfig === 'function'
            ? item.defaultConfig()
            : item.defaultConfig;
        if (config === undefined || config === null) return {};
        return Utils.deepClone(config);
    };

    const resolveBuiltInAction = (action) => {
        if (!action) return null;
        return {
            ...action,
            name: translate(action.nameKey, action.nameFallback || action.name || action.id),
            description: translate(action.descriptionKey, action.descriptionFallback || action.description || '')
        };
    };

    const getNodeTypeLabel = (type) => {
        const fallback = NODE_TYPE_LABELS[type] || type;
        const keyMap = {
            trigger: 'quick_actions_node_badge_trigger',
            processor: 'quick_actions_node_badge_processor',
            output: 'quick_actions_node_badge_output',
            utility: 'quick_actions_node_badge_utility'
        };
        const key = keyMap[type];
        return key ? translate(key, fallback) : fallback;
    };

    class EventEmitter {
        constructor() {
            this.listeners = new Map();
        }

        on(event, callback) {
            if (!this.listeners.has(event)) {
                this.listeners.set(event, new Set());
            }
            this.listeners.get(event).add(callback);
            return () => this.off(event, callback);
        }

        once(event, callback) {
            const off = this.on(event, (...args) => {
                off();
                callback(...args);
            });
            return off;
        }

        off(event, callback) {
            const listeners = this.listeners.get(event);
            if (!listeners) return;
            listeners.delete(callback);
            if (listeners.size === 0) {
                this.listeners.delete(event);
            }
        }

        emit(event, ...args) {
            const listeners = this.listeners.get(event);
            if (!listeners || listeners.size === 0) return;
            listeners.forEach(callback => callback(...args));
        }
    }

    class HistoryStack {
        constructor(limit = MAX_HISTORY) {
            this.limit = limit;
            this.reset();
        }

        reset(initialState = null) {
            this.stack = initialState ? [Utils.deepClone(initialState)] : [];
            this.index = this.stack.length ? 0 : -1;
        }

        push(state) {
            if (this.index < this.stack.length - 1) {
                this.stack = this.stack.slice(0, this.index + 1);
            }
            this.stack.push(Utils.deepClone(state));
            if (this.stack.length > this.limit) {
                this.stack.shift();
            }
            this.index = this.stack.length - 1;
        }

        undo() {
            if (this.index <= 0) return null;
            this.index -= 1;
            return Utils.deepClone(this.stack[this.index]);
        }

        redo() {
            if (this.index >= this.stack.length - 1) return null;
            this.index += 1;
            return Utils.deepClone(this.stack[this.index]);
        }

        current() {
            if (this.index === -1) return null;
            return Utils.deepClone(this.stack[this.index]);
        }
    }

    class Vector2 {
        constructor(x = 0, y = 0) {
            this.x = x;
            this.y = y;
        }

        clone() {
            return new Vector2(this.x, this.y);
        }

        add(vector) {
            this.x += vector.x;
            this.y += vector.y;
            return this;
        }

        subtract(vector) {
            this.x -= vector.x;
            this.y -= vector.y;
            return this;
        }

        scale(value) {
            this.x *= value;
            this.y *= value;
            return this;
        }

        length() {
            return Math.sqrt(this.x * this.x + this.y * this.y);
        }

        normalize() {
            const len = this.length() || 1;
            this.x /= len;
            this.y /= len;
            return this;
        }

        static fromEvent(event) {
            return new Vector2(event.clientX, event.clientY);
        }
    }

    class QuickActionStore extends EventEmitter {
        constructor() {
            super();
            this.builtIns = BuiltInQuickActions.map(item => ({ ...item }));
            this.quickActions = [];
            this.customActions = [];
            this.version = QUICK_ACTIONS_VERSION;
        }

        hydrate(settings = {}) {
            const { quickActions, customQuickActions, activeAddons, customAddons } = settings;

            if (Array.isArray(quickActions)) {
                this.quickActions = quickActions.map(item => ({ ...item }));
            } else if (Array.isArray(activeAddons)) {
                this.quickActions = activeAddons.map(id => ({ id, enabled: true, source: 'legacy' }));
            } else {
                this.quickActions = this.builtIns.map(action => ({ id: action.id, enabled: true, source: 'builtin' }));
            }

            if (Array.isArray(customQuickActions)) {
                this.customActions = customQuickActions.map(item => ({ ...item }));
            } else if (Array.isArray(customAddons)) {
                this.customActions = customAddons.map(addon => ({
                    id: addon.id || Utils.uid('legacy'),
                    name: addon.name || addon.id,
                    icon: addon.icon || 'zap',
                    color: '#6366F1',
                    description: addon.description || '',
                    nodes: [],
                    edges: [],
                    metadata: { migrated: true }
                }));
            } else {
                this.customActions = [];
            }

            const knownIds = new Set(this.builtIns.map(item => item.id));
            this.quickActions = this.quickActions.filter(item => {
                if (item.source === 'custom') return true;
                return knownIds.has(item.id);
            });

            this.emit('change');
        }

        serialize() {
            return {
                quickActions: this.quickActions.map(item => ({ ...item })),
                customQuickActions: this.customActions.map(item => ({ ...item })),
                version: this.version
            };
        }

        getBuiltInDefinition(id) {
            const definition = this.builtIns.find(action => action.id === id);
            return resolveBuiltInAction(definition);
        }

        getCustomDefinition(id) {
            return this.customActions.find(action => action.id === id);
        }

        getAllDefinitions() {
            const builtIn = this.quickActions
                .map(entry => ({
                    ...entry,
                    definition: this.getBuiltInDefinition(entry.id)
                }))
                .filter(item => Boolean(item.definition));

            const customs = this.quickActions
                .filter(entry => entry.source === 'custom')
                .map(entry => ({
                    ...entry,
                    definition: this.getCustomDefinition(entry.id)
                }))
                .filter(item => Boolean(item.definition));

            return [...builtIn, ...customs];
        }

        getActiveDefinitions() {
            return this.getAllDefinitions().filter(item => item.enabled);
        }

        ensureBuiltInDefaults() {
            const knownIds = new Set(this.quickActions.map(action => action.id));
            this.builtIns.forEach(action => {
                if (!knownIds.has(action.id)) {
                    this.quickActions.push({ id: action.id, enabled: true, source: 'builtin' });
                }
            });
        }

        setEnabled(id, enabled) {
            const entry = this.quickActions.find(item => item.id === id);
            if (!entry) return;
            const definition = this.getBuiltInDefinition(id);
            if (definition?.locked) return;
            entry.enabled = Boolean(enabled);
            this.emit('change');
        }

        reorder(ids) {
            const idSet = new Set(ids);
            const remaining = this.quickActions.filter(item => !idSet.has(item.id));
            this.quickActions = ids
                .map(id => this.quickActions.find(item => item.id === id))
                .filter(Boolean);
            this.quickActions.push(...remaining);
            this.emit('change');
        }

        addCustom(action) {
            const existing = this.customActions.find(item => item.id === action.id);
            if (existing) {
                Object.assign(existing, Utils.deepClone(action));
            } else {
                this.customActions.push(Utils.deepClone(action));
            }
            const listEntry = this.quickActions.find(item => item.id === action.id);
            if (!listEntry) {
                this.quickActions.push({ id: action.id, enabled: true, source: 'custom' });
            }
            this.emit('change');
        }

        deleteCustom(id) {
            this.customActions = this.customActions.filter(item => item.id !== id);
            this.quickActions = this.quickActions.filter(item => item.id !== id || item.source !== 'custom');
            this.emit('change');
        }

        resetOrder() {
            this.quickActions = this.builtIns.map(action => ({ id: action.id, enabled: true, source: 'builtin' }));
            this.emit('change');
        }
    }

    class QuickActionBarRenderer {
        constructor(store, options = {}) {
            this.store = store;
            this.options = options;
            this.container = null;
            this.boundClick = this.handleClick.bind(this);
            this.store.on('change', () => this.render());
        }

        mount(selector) {
            this.container = typeof selector === 'string' ? Utils.qs(selector) : selector;
            if (!this.container) return;
            this.container.addEventListener('click', this.boundClick);
            this.render();
        }

        handleClick(event) {
            const button = event.target.closest('[data-quick-action-id]');
            if (!button) return;
            const actionId = button.getAttribute('data-quick-action-id');
            const entry = this.store.getAllDefinitions().find(item => item.id === actionId);
            if (!entry) return;
            if (!entry.enabled) return;
            if (entry.source === 'builtin') {
                const definition = this.store.getBuiltInDefinition(actionId);
                if (definition?.windowType && global.AuxPanelManager) {
                    global.AuxPanelManager.togglePanel(definition.windowType);
                }
            } else {
                global.QuickActions?.runCustomAction(actionId);
            }
        }

        render() {
            if (!this.container) return;
            const definitions = this.store.getActiveDefinitions();
            this.container.innerHTML = '';
            if (definitions.length === 0) {
                this.container.setAttribute('data-empty-message', translate('quick_actions_bar_empty', 'Add quick actions in settings'));
                return;
            }
            this.container.removeAttribute('data-empty-message');

            definitions.forEach(entry => {
                const definition = entry.definition;
                const button = Utils.createElement('button', 'action-button glass-element quick-action-button');
                button.setAttribute('data-quick-action-id', entry.id);
                button.setAttribute('title', definition.description || definition.name);
                button.setAttribute('aria-label', definition.name);
                button.dataset.actionType = entry.source;
                button.innerHTML = window.feather?.icons?.[definition.icon]?.toSvg?.() || `<span>${definition.icon}</span>`;
                if (definition.color) {
                    button.style.setProperty('--quick-action-accent', definition.color);
                }
                this.container.appendChild(button);
            });
            if (window.feather) {
                window.feather.replace();
            }
        }
    }

    class DraggableList {
        constructor(element, options = {}) {
            this.element = element;
            this.options = options;
            this.dragging = null;
            this.placeholder = null;
            this.boundStart = this.handleDragStart.bind(this);
            this.boundMove = this.handleDragMove.bind(this);
            this.boundEnd = this.handleDragEnd.bind(this);
            this.element.addEventListener('pointerdown', this.boundStart);
        }

        destroy() {
            this.element.removeEventListener('pointerdown', this.boundStart);
            document.removeEventListener('pointermove', this.boundMove);
            document.removeEventListener('pointerup', this.boundEnd);
        }

        handleDragStart(event) {
            const handle = event.target.closest('[data-drag-handle]');
            if (!handle) return;
            const item = handle.closest('[data-drag-item]');
            if (!item) return;
            if (item.dataset.locked === 'true') return;
            event.preventDefault();
            this.dragging = {
                item,
                startY: event.clientY,
                startIndex: Array.from(this.element.children).indexOf(item)
            };
            this.placeholder = item.cloneNode(true);
            this.placeholder.classList.add('is-placeholder');
            this.placeholder.style.visibility = 'hidden';
            this.placeholder.style.height = `${item.offsetHeight}px`;
            item.classList.add('is-dragging');
            item.style.width = `${item.offsetWidth}px`;
            item.style.position = 'absolute';
            item.style.zIndex = '10';
            item.style.pointerEvents = 'none';
            item.style.transform = `translateY(0px)`;
            this.element.insertBefore(this.placeholder, item.nextSibling);
            this.element.classList.add('dragging');
            document.addEventListener('pointermove', this.boundMove);
            document.addEventListener('pointerup', this.boundEnd);
        }

        handleDragMove(event) {
            if (!this.dragging) return;
            event.preventDefault();
            const deltaY = event.clientY - this.dragging.startY;
            this.dragging.item.style.transform = `translateY(${deltaY}px)`;
            const rect = this.placeholder.getBoundingClientRect();
            const before = event.clientY < rect.top;
            const after = event.clientY > rect.bottom;
            const siblings = Array.from(this.element.children).filter(child => child !== this.dragging.item && child !== this.placeholder);
            for (const sibling of siblings) {
                const siblingRect = sibling.getBoundingClientRect();
                if (event.clientY < siblingRect.top + siblingRect.height / 2) {
                    this.element.insertBefore(this.placeholder, sibling);
                    break;
                }
                if (event.clientY > siblingRect.bottom - siblingRect.height / 2) {
                    this.element.insertBefore(this.placeholder, sibling.nextSibling);
                }
            }
        }

        handleDragEnd() {
            if (!this.dragging) return;
            this.dragging.item.classList.remove('is-dragging');
            this.dragging.item.style.transform = '';
            this.dragging.item.style.position = '';
            this.dragging.item.style.width = '';
            this.dragging.item.style.pointerEvents = '';
            this.element.insertBefore(this.dragging.item, this.placeholder);
            const newIndex = Array.from(this.element.children).indexOf(this.dragging.item);
            this.placeholder.remove();
            this.placeholder = null;
            this.element.classList.remove('dragging');
            document.removeEventListener('pointermove', this.boundMove);
            document.removeEventListener('pointerup', this.boundEnd);
            const from = this.dragging.startIndex;
            const to = newIndex;
            const id = this.dragging.item.getAttribute('data-id');
            this.dragging = null;
            if (typeof this.options.onDrop === 'function' && from !== to && id) {
                this.options.onDrop({ from, to, id });
            }
        }
    }
    class QuickActionSettingsView {
        constructor(store, options = {}) {
            this.store = store;
            this.options = options;
            this.activeList = null;
            this.libraryContainer = null;
            this.flowPreview = null;
            this.dragController = null;
            this.store.on('change', () => this.render());
        }

        mount({ activeList, library, preview }) {
            this.activeList = typeof activeList === 'string' ? Utils.qs(activeList) : activeList;
            this.libraryContainer = typeof library === 'string' ? Utils.qs(library) : library;
            this.flowPreview = preview;
            this.render();
            this.setupListeners();
        }

        setupListeners() {
            if (!this.activeList) return;
            this.activeList.addEventListener('change', (event) => {
                const checkbox = event.target.closest('input[type="checkbox"][data-id]');
                if (!checkbox) return;
                this.store.setEnabled(checkbox.dataset.id, checkbox.checked);
                this.persist();
            });

            this.activeList.addEventListener('click', (event) => {
                const deleteButton = event.target.closest('[data-action="delete-custom"]');
                if (!deleteButton) return;
                const id = deleteButton.getAttribute('data-id');
                if (!id) return;
                if (confirm(translate('quick_actions_confirm_delete', 'Delete this quick action?'))) {
                    this.store.deleteCustom(id);
                    this.persist();
                }
            });

            if (!this.dragController && this.activeList) {
                this.dragController = new DraggableList(this.activeList, {
                    onDrop: ({ id }) => {
                        const ids = Array.from(this.activeList.querySelectorAll('[data-drag-item]')).map(item => item.getAttribute('data-id'));
                        this.store.reorder(ids);
                        this.persist();
                    }
                });
            }
        }

        render() {
            this.renderActiveList();
            this.renderLibrary();
            this.renderPreview();
        }

        renderActiveList() {
            if (!this.activeList) return;
            const active = this.store.getAllDefinitions();
            this.activeList.innerHTML = '';
            if (active.length === 0) {
                this.activeList.classList.add('empty');
                this.activeList.setAttribute('data-empty-message', translate('quick_actions_active_empty', 'No quick actions enabled yet.'));
                return;
            }
            this.activeList.classList.remove('empty');
            this.activeList.removeAttribute('data-empty-message');

            active.forEach(entry => {
                const definition = entry.definition;
                const item = Utils.createElement('div', 'quick-actions-item');
                item.setAttribute('data-drag-item', '');
                item.setAttribute('data-id', entry.id);
                if (definition.locked) item.classList.add('locked');
                item.dataset.locked = definition.locked ? 'true' : 'false';

                const handle = Utils.createElement('button', 'quick-actions-handle');
                handle.setAttribute('data-drag-handle', '');
                handle.setAttribute('type', 'button');
                handle.innerHTML = window.feather?.icons?.['menu']?.toSvg?.() || '⋮⋮';
                item.appendChild(handle);

                const meta = Utils.createElement('div', 'quick-actions-metadata');
                const title = Utils.createElement('strong', '', definition.name || translate('quick_actions_custom_card_title_fallback', 'Custom action'));
                const desc = Utils.createElement('span', '', definition.description || translate('quick_actions_custom_card_description_fallback', 'Flow designed in the visual builder.'));
                meta.appendChild(title);
                meta.appendChild(desc);
                if (entry.source === 'custom') {
                    const badge = Utils.createElement('span', 'action-pill', translate('quick_actions_badge_custom', 'Custom flow'));
                    meta.appendChild(badge);
                }
                item.appendChild(meta);

                const controls = Utils.createElement('div', 'quick-actions-controls');
                const toggleWrapper = Utils.createElement('label', 'quick-actions-toggle');
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.checked = Boolean(entry.enabled);
                checkbox.dataset.id = entry.id;
                checkbox.disabled = Boolean(definition.locked);
                const slider = document.createElement('span');
                toggleWrapper.appendChild(checkbox);
                toggleWrapper.appendChild(slider);
                controls.appendChild(toggleWrapper);

                if (entry.source === 'custom') {
                    const deleteButton = Utils.createElement('button', 'quick-actions-delete', translate('addon_delete_custom', 'Delete'));
                    deleteButton.setAttribute('data-action', 'delete-custom');
                    deleteButton.setAttribute('data-id', entry.id);
                    controls.appendChild(deleteButton);
                }

                item.appendChild(controls);
                this.activeList.appendChild(item);
            });
            if (window.feather) window.feather.replace();
        }

        renderLibrary() {
            if (!this.libraryContainer) return;
            const activeIds = new Set(this.store.getAllDefinitions().map(item => item.id));
            this.libraryContainer.innerHTML = '';

            const cards = this.store.builtIns.map(definition => {
                const localized = resolveBuiltInAction(definition);
                const card = Utils.createElement('article', 'quick-actions-library-card');
                const title = Utils.createElement('h4', '', localized.name);
                const desc = Utils.createElement('p', '', localized.description || '');
                card.appendChild(title);
                card.appendChild(desc);
                const actions = Utils.createElement('div', 'card-actions');
                const buttonLabel = activeIds.has(definition.id)
                    ? translate('quick_actions_button_added', 'Added')
                    : translate('quick_actions_button_add', 'Add');
                const button = Utils.createElement('button', 'settings-button', buttonLabel);
                button.disabled = definition.locked || activeIds.has(definition.id);
                button.setAttribute('data-id', definition.id);
                button.addEventListener('click', () => {
                    if (activeIds.has(definition.id)) return;
                    this.store.quickActions.push({ id: definition.id, enabled: true, source: 'builtin' });
                    this.persist();
                    this.render();
                });
                actions.appendChild(button);
                card.appendChild(actions);
                const tags = Utils.createElement('div', 'card-tags');
                const builtInTag = Utils.createElement('span', 'card-tag', definition.locked
                    ? translate('quick_actions_tag_pinned', 'Pinned')
                    : translate('quick_actions_tag_builtin', 'Built-in'));
                tags.appendChild(builtInTag);
                card.appendChild(tags);
                return card;
            });

            this.store.customActions.forEach(action => {
                const card = Utils.createElement('article', 'quick-actions-library-card');
                const title = Utils.createElement('h4', '', action.name || translate('quick_actions_custom_card_title_fallback', 'Custom action'));
                const desc = Utils.createElement('p', '', action.description || translate('quick_actions_custom_card_description_fallback', 'Flow designed in the visual builder.'));
                card.appendChild(title);
                card.appendChild(desc);
                const actions = Utils.createElement('div', 'card-actions');
                const openButton = Utils.createElement('button', 'settings-button secondary', translate('quick_actions_button_edit', 'Edit'));
                openButton.addEventListener('click', () => {
                    global.QuickActions?.openDesigner(action.id);
                });
                const enableLabel = activeIds.has(action.id)
                    ? translate('quick_actions_button_added', 'Added')
                    : translate('quick_actions_button_enable', 'Enable');
                const addButton = Utils.createElement('button', 'settings-button', enableLabel);
                addButton.disabled = activeIds.has(action.id);
                addButton.addEventListener('click', () => {
                    if (!activeIds.has(action.id)) {
                        this.store.quickActions.push({ id: action.id, enabled: true, source: 'custom' });
                        this.persist();
                        this.render();
                    }
                });
                actions.appendChild(openButton);
                actions.appendChild(addButton);
                card.appendChild(actions);
                const tags = Utils.createElement('div', 'card-tags');
                tags.appendChild(Utils.createElement('span', 'card-tag', translate('quick_actions_tag_custom', 'Custom')));
                card.appendChild(tags);
                this.libraryContainer.appendChild(card);
            });

            cards.forEach(card => this.libraryContainer.appendChild(card));
        }

        renderPreview() {
            if (!this.flowPreview || !this.flowPreview.canvas) return;
            this.flowPreview.render(this.store.customActions);
        }

        persist() {
            if (typeof this.options.onChange === 'function') {
                this.options.onChange(this.store.serialize());
            }
        }
    }

    class QuickActionFlowPreview {
        constructor(container) {
            this.container = typeof container === 'string' ? Utils.qs(container) : container;
            if (this.container) {
                this.canvas = this.container.querySelector('#quick-actions-flow-preview');
                this.empty = this.container.querySelector('.flow-preview-empty');
            }
        }

        render(actions = []) {
            if (!this.canvas) return;
            this.canvas.innerHTML = '';
            if (!actions.length) {
                if (this.empty) this.empty.style.display = 'block';
                return;
            }
            if (this.empty) this.empty.style.display = 'none';
            const gridSize = Math.min(actions.length, 4);
            actions.slice(0, 4).forEach((action, index) => {
                const chip = Utils.createElement('div', 'flow-preview-chip');
                chip.setAttribute('data-role', 'custom');
                chip.style.top = `${20 + index * 40}px`;
                chip.style.left = `${30 + index * 80}px`;
                const iconName = action.icon || 'zap';
                const label = action.name || translate('quick_actions_preview_custom_label', 'Custom');
                chip.innerHTML = `${window.feather?.icons?.[iconName]?.toSvg?.() || ''}<span>${label}</span>`;
                this.canvas.appendChild(chip);
            });
        }
    }
    class DesignerNode {
        constructor({ id, type, paletteId, position, config }) {
            this.id = id || Utils.uid('node');
            this.type = type;
            this.paletteId = paletteId;
            this.position = position || { x: 120, y: 120 };
            this.config = config || {};
            this.dom = null;
        }

        serialize() {
            return {
                id: this.id,
                type: this.type,
                paletteId: this.paletteId,
                position: { ...this.position },
                config: { ...this.config }
            };
        }
    }

    class DesignerConnection {
        constructor({ id, from, to }) {
            this.id = id || Utils.uid('edge');
            this.from = from;
            this.to = to;
        }

        serialize() {
            return { id: this.id, from: this.from, to: this.to };
        }
    }

    class DesignerCanvas extends EventEmitter {
        constructor(container, options = {}) {
            super();
            this.container = container;
            this.options = options;
            this.nodes = [];
            this.connections = [];
            this.zoom = 1;
            this.pan = new Vector2(0, 0);
            this.selectedNode = null;
            this.dragging = null;
            this.connecting = null;
            this.svg = container.querySelector('.canvas-connections');
            this.nodeLayer = container.querySelector('.canvas-nodes');
            this.emptyState = container.querySelector('.canvas-empty');
            this.history = new HistoryStack();
            this.setupHandlers();
        }

        setupHandlers() {
            this.nodeLayer.addEventListener('pointerdown', (event) => {
                if (event.target === this.nodeLayer) {
                    this.emit('canvasPointerDown', event);
                    this.startPan(event);
                }
            });
        }

        startPan(event) {
            const start = Vector2.fromEvent(event);
            const initial = this.pan.clone ? this.pan.clone() : new Vector2(this.pan.x, this.pan.y);
            const handleMove = (moveEvent) => {
                const current = Vector2.fromEvent(moveEvent);
                const diff = current.clone().subtract(start);
                this.pan = new Vector2(initial.x + diff.x, initial.y + diff.y);
                this.updateTransform();
            };
            const handleUp = () => {
                document.removeEventListener('pointermove', handleMove);
                document.removeEventListener('pointerup', handleUp);
                this.nodeLayer.dataset.panning = 'false';
            };
            document.addEventListener('pointermove', handleMove);
            document.addEventListener('pointerup', handleUp);
            this.nodeLayer.dataset.panning = 'true';
        }

        updateTransform() {
            const transform = `translate(${this.pan.x}px, ${this.pan.y}px) scale(${this.zoom})`;
            this.nodeLayer.style.transform = transform;
            this.svg.style.transform = transform;
        }

        setZoom(delta) {
            this.zoom = Utils.clamp(this.zoom + delta, 0.4, 1.8);
            this.updateTransform();
        }

        addNode(node) {
            this.nodes.push(node);
            this.render();
            this.snapshot();
        }

        removeNode(nodeId) {
            this.nodes = this.nodes.filter(node => node.id !== nodeId);
            this.connections = this.connections.filter(connection => connection.from !== nodeId && connection.to !== nodeId);
            if (this.selectedNode && this.selectedNode.id === nodeId) {
                this.selectedNode = null;
            }
            this.render();
            this.snapshot();
        }

        connect(from, to) {
            if (!from || !to) return;
            if (from === to) return;
            const exists = this.connections.some(connection => connection.from === from && connection.to === to);
            if (exists) return;
            this.connections.push(new DesignerConnection({ from, to }));
            this.renderConnections();
            this.snapshot();
        }

        disconnect(connectionId) {
            this.connections = this.connections.filter(connection => connection.id !== connectionId);
            this.renderConnections();
            this.snapshot();
        }

        select(nodeId) {
            const node = this.nodes.find(item => item.id === nodeId) || null;
            this.selectedNode = node;
            this.renderSelection();
            this.emit('selectionChanged', node);
        }

        render() {
            if (!this.nodeLayer) return;
            this.nodeLayer.innerHTML = '';
            this.nodes.forEach(node => {
                const definition = this.findPaletteDefinition(node.paletteId);
                const element = Utils.createElement('article', 'designer-node');
                element.dataset.id = node.id;
                element.dataset.type = node.type;
                element.style.left = `${node.position.x}px`;
                element.style.top = `${node.position.y}px`;
                const heading = Utils.createElement('h4', '', definition?.label || translate('quick_actions_inspector_node_fallback', 'Module'));
                element.appendChild(heading);
                if (definition?.description) {
                    element.appendChild(Utils.createElement('small', '', definition.description));
                }
                const badges = Utils.createElement('div', 'node-badges');
                badges.appendChild(Utils.createElement('span', 'node-badge', getNodeTypeLabel(node.type)));
                element.appendChild(badges);
                const ports = Utils.createElement('div', 'node-ports');
                ports.innerHTML = `
                    <div class="port" data-port="input" data-node="${node.id}"></div>
                    <div class="port" data-port="output" data-node="${node.id}"></div>
                `;
                element.appendChild(ports);
                const footer = Utils.createElement('footer', 'node-footer');
                footer.innerHTML = `
                    <span class="badge">${definition?.icon || ''}</span>
                    <button type="button" data-action="remove">${window.feather?.icons?.x?.toSvg?.() || '×'}</button>
                `;
                element.appendChild(footer);
                node.dom = element;
                this.nodeLayer.appendChild(element);
                this.setupNodeEvents(node);
            });
            this.renderConnections();
            this.renderSelection();
            this.updateEmptyState();
        }

        setupNodeEvents(node) {
            const element = node.dom;
            if (!element) return;
            element.addEventListener('pointerdown', (event) => {
                if (event.target.closest('.port')) return;
                if (event.target.closest('[data-action="remove"]')) return;
                this.select(node.id);
                this.startNodeDrag(node, event);
            });
            element.querySelector('[data-action="remove"]').addEventListener('click', () => this.removeNode(node.id));
            element.querySelectorAll('.port').forEach(port => {
                port.addEventListener('pointerdown', (event) => {
                    event.stopPropagation();
                    this.startConnection(node, port.dataset.port);
                });
            });
        }

        startNodeDrag(node, event) {
            event.preventDefault();
            const start = Vector2.fromEvent(event);
            const initial = new Vector2(node.position.x, node.position.y);
            const handleMove = (moveEvent) => {
                const current = Vector2.fromEvent(moveEvent);
                const diff = current.clone().subtract(start);
                node.position.x = initial.x + diff.x;
                node.position.y = initial.y + diff.y;
                node.dom.style.left = `${node.position.x}px`;
                node.dom.style.top = `${node.position.y}px`;
                this.renderConnections();
            };
            const handleUp = () => {
                document.removeEventListener('pointermove', handleMove);
                document.removeEventListener('pointerup', handleUp);
                this.snapshot();
            };
            document.addEventListener('pointermove', handleMove);
            document.addEventListener('pointerup', handleUp);
        }

        startConnection(node, portType) {
            const origin = { nodeId: node.id, type: portType };
            this.connecting = origin;
            const preview = Utils.createElement('div', 'connection-preview');
            this.container.querySelector('.canvas-stage').appendChild(preview);

            const handleMove = (event) => {
                const rect = this.container.getBoundingClientRect();
                const targetX = event.clientX - rect.left;
                const targetY = event.clientY - rect.top;
                preview.style.left = `${Math.min(targetX, 9999)}px`;
                preview.style.top = `${Math.min(targetY, 9999)}px`;
            };

            const handleUp = (event) => {
                document.removeEventListener('pointermove', handleMove);
                document.removeEventListener('pointerup', handleUp);
                preview.remove();
                const targetPort = event.target.closest('.port');
                if (!targetPort) {
                    this.connecting = null;
                    return;
                }
                const targetNode = targetPort.dataset.node;
                const targetType = targetPort.dataset.port;
                if (origin.type === 'output' && targetType === 'input') {
                    this.connect(origin.nodeId, targetNode);
                }
                if (origin.type === 'input' && targetType === 'output') {
                    this.connect(targetNode, origin.nodeId);
                }
                this.connecting = null;
            };

            document.addEventListener('pointermove', handleMove);
            document.addEventListener('pointerup', handleUp);
        }

        renderConnections() {
            if (!this.svg) return;
            const ns = 'http://www.w3.org/2000/svg';
            this.svg.innerHTML = '';

            const gradient = document.createElementNS(ns, 'linearGradient');
            gradient.id = 'designer-connection-gradient';
            gradient.setAttribute('x1', '0%');
            gradient.setAttribute('x2', '100%');
            gradient.setAttribute('y1', '0%');
            gradient.setAttribute('y2', '0%');
            const stop1 = document.createElementNS(ns, 'stop');
            stop1.setAttribute('offset', '0%');
            const stop2 = document.createElementNS(ns, 'stop');
            stop2.setAttribute('offset', '100%');
            gradient.appendChild(stop1);
            gradient.appendChild(stop2);
            const defs = document.createElementNS(ns, 'defs');
            defs.appendChild(gradient);
            this.svg.appendChild(defs);

            this.connections.forEach(connection => {
                const source = this.nodes.find(node => node.id === connection.from);
                const target = this.nodes.find(node => node.id === connection.to);
                if (!source || !target) return;
                const sourcePort = source.dom.querySelector('[data-port="output"]');
                const targetPort = target.dom.querySelector('[data-port="input"]');
                const sourceRect = sourcePort.getBoundingClientRect();
                const targetRect = targetPort.getBoundingClientRect();
                const canvasRect = this.nodeLayer.getBoundingClientRect();
                const startX = sourceRect.left - canvasRect.left + sourceRect.width / 2;
                const startY = sourceRect.top - canvasRect.top + sourceRect.height / 2;
                const endX = targetRect.left - canvasRect.left + targetRect.width / 2;
                const endY = targetRect.top - canvasRect.top + targetRect.height / 2;
                const path = document.createElementNS(ns, 'path');
                const shadow = document.createElementNS(ns, 'path');
                const curve = `M ${startX} ${startY} C ${startX + 160} ${startY}, ${endX - 160} ${endY}, ${endX} ${endY}`;
                path.setAttribute('d', curve);
                shadow.setAttribute('d', curve);
                path.classList.add('designer-connection');
                shadow.classList.add('designer-connection-shadow');
                this.svg.appendChild(shadow);
                this.svg.appendChild(path);
            });
        }

        renderSelection() {
            this.nodes.forEach(node => {
                if (!node.dom) return;
                node.dom.classList.toggle('selected', this.selectedNode?.id === node.id);
            });
        }

        updateEmptyState() {
            if (!this.emptyState) return;
            this.emptyState.style.display = this.nodes.length === 0 ? 'block' : 'none';
        }

        findPaletteDefinition(paletteId) {
            const groups = Object.values(PaletteGroups);
            for (const group of groups) {
                const definition = group.find(item => item.id === paletteId);
                if (definition) return resolvePaletteItem(definition);
            }
            return null;
        }

        snapshot() {
            this.history.push(this.serialize());
        }

        serialize() {
            return {
                nodes: this.nodes.map(node => node.serialize()),
                edges: this.connections.map(connection => connection.serialize()),
                zoom: this.zoom,
                pan: { x: this.pan.x, y: this.pan.y }
            };
        }

        hydrate(state) {
            this.nodes = Array.isArray(state.nodes) ? state.nodes.map(node => new DesignerNode(node)) : [];
            this.connections = Array.isArray(state.edges) ? state.edges.map(edge => new DesignerConnection(edge)) : [];
            this.zoom = typeof state.zoom === 'number' ? state.zoom : 1;
            this.pan = new Vector2(state.pan?.x || 0, state.pan?.y || 0);
            this.updateTransform();
            this.render();
            this.snapshot();
        }

        undo() {
            const state = this.history.undo();
            if (!state) return;
            this.hydrate(state);
        }

        redo() {
            const state = this.history.redo();
            if (!state) return;
            this.hydrate(state);
        }
    }

    class QuickActionDesigner extends EventEmitter {
        constructor(store, options = {}) {
            super();
            this.store = store;
            this.options = options;
            this.overlay = null;
            this.canvas = null;
            this.nameInput = null;
            this.iconInput = null;
            this.colorInput = null;
            this.statusElement = null;
            this.historyList = null;
            this.paletteElement = null;
            this.currentActionId = null;
            this.autosave = Utils.debounce(() => this.saveDraft(), 600);
        }

        mount(selector) {
            this.overlay = typeof selector === 'string' ? Utils.qs(selector) : selector;
            if (!this.overlay) return;
            this.statusElement = this.overlay.querySelector('.designer-status');
            this.historyList = this.overlay.querySelector('#designer-history');
            this.nameInput = this.overlay.querySelector('#designer-action-name');
            this.iconInput = this.overlay.querySelector('#designer-action-icon');
            this.colorInput = this.overlay.querySelector('#designer-action-color');
            const canvasElement = this.overlay.querySelector('.canvas-stage');
            this.canvas = new DesignerCanvas(canvasElement, {});
            this.canvas.on('selectionChanged', (node) => this.populateInspector(node));
            this.overlay.querySelector('[data-action="close"]').addEventListener('click', () => this.close());
            this.overlay.querySelector('[data-action="save"]').addEventListener('click', () => this.save());
            this.overlay.querySelector('[data-action="preview"]').addEventListener('click', () => this.emit('preview', this.buildAction()));
            this.overlay.querySelector('[data-action="undo"]').addEventListener('click', () => this.canvas.undo());
            this.overlay.querySelector('[data-action="redo"]').addEventListener('click', () => this.canvas.redo());
            this.overlay.querySelector('[data-action="zoom-in"]').addEventListener('click', () => this.canvas.setZoom(0.1));
            this.overlay.querySelector('[data-action="zoom-out"]').addEventListener('click', () => this.canvas.setZoom(-0.1));
            this.overlay.querySelector('[data-action="fit"]').addEventListener('click', () => this.resetView());
            this.overlay.querySelector('[data-action="grid"]').addEventListener('click', () => this.toggleGrid());
            this.nameInput.addEventListener('input', () => this.autosave());
            this.iconInput.addEventListener('input', () => this.autosave());
            this.colorInput.addEventListener('input', () => this.autosave());
            this.populatePalette();
        }

        populatePalette() {
            if (!this.overlay) return;
            Object.entries(PaletteGroups).forEach(([groupName, items]) => {
                const list = this.overlay.querySelector(`.palette-list[data-palette="${groupName}"]`);
                if (!list) return;
                list.innerHTML = '';
                items.forEach(item => {
                    const definition = resolvePaletteItem(item);
                    const element = Utils.createElement('li', 'palette-item');
                    element.setAttribute('data-palette-id', item.id);
                    element.innerHTML = `
                        <strong>${definition.label}</strong>
                        <span>${definition.description}</span>
                    `;
                    element.addEventListener('pointerdown', (event) => {
                        event.preventDefault();
                        this.addNodeFromPalette(item);
                    });
                    list.appendChild(element);
                });
            });
        }

        addNodeFromPalette(item) {
            const node = new DesignerNode({
                type: item.type,
                paletteId: item.id,
                config: buildPaletteDefaultConfig(item),
                position: { x: 140 + Math.random() * 260, y: 160 + Math.random() * 120 }
            });
            this.canvas.addNode(node);
            this.canvas.select(node.id);
            this.autosave();
            const label = translate(item.labelKey, item.labelFallback || item.label || item.id);
            this.pushHistory(translate('quick_actions_history_add', 'Add %s').replace('%s', label));
        }

        populateInspector(node) {
            const container = this.overlay.querySelector('#designer-module-settings');
            if (!container) return;
            container.innerHTML = '';
            if (!node) {
                container.classList.add('module-settings-empty');
                container.textContent = translate('quick_actions_inspector_select', 'Select a node to edit its configuration.');
                return;
            }
            container.classList.remove('module-settings-empty');
            const definition = this.canvas.findPaletteDefinition(node.paletteId);
            const form = Utils.createElement('div', 'inspector-form');
            Object.entries(node.config || {}).forEach(([key, value]) => {
                const label = Utils.createElement('label', '', key);
                const input = document.createElement('input');
                input.value = value;
                input.addEventListener('input', () => {
                    node.config[key] = input.value;
                    this.autosave();
                });
                form.appendChild(label);
                form.appendChild(input);
            });
            container.appendChild(form);
            const footer = Utils.createElement('div', 'inspector-buttons');
            const duplicate = Utils.createElement('button', 'designer-button secondary', translate('quick_actions_button_duplicate', 'Duplicate'));
            duplicate.addEventListener('click', () => this.duplicateNode(node));
            const remove = Utils.createElement('button', 'designer-button ghost', translate('quick_actions_button_remove', 'Remove'));
            remove.addEventListener('click', () => this.canvas.removeNode(node.id));
            footer.appendChild(duplicate);
            footer.appendChild(remove);
            container.appendChild(footer);
        }

        duplicateNode(node) {
            const duplicate = new DesignerNode({
                type: node.type,
                paletteId: node.paletteId,
                config: Utils.deepClone(node.config),
                position: { x: node.position.x + 40, y: node.position.y + 40 }
            });
            this.canvas.addNode(duplicate);
            this.canvas.select(duplicate.id);
            this.pushHistory(translate('quick_actions_history_duplicate', 'Duplicate node'));
        }

        saveDraft() {
            if (!this.currentActionId) return;
            const draft = this.buildAction();
            draft.id = this.currentActionId;
            this.store.addCustom(draft);
            if (typeof this.options.onChange === 'function') {
                this.options.onChange(this.store.serialize());
            }
            this.updateStatus(translate('quick_actions_status_draft', 'Draft saved automatically'));
        }

        buildAction() {
            return {
                id: this.currentActionId || Utils.uid('quick'),
                name: this.nameInput?.value?.trim() || translate('addon_unknown_name', 'Untitled action'),
                icon: this.iconInput?.value?.trim() || 'zap',
                color: this.colorInput?.value || '#6366F1',
                description: translate('quick_actions_designer_subtitle', 'Custom automation'),
                nodes: this.canvas.nodes.map(node => node.serialize()),
                edges: this.canvas.connections.map(connection => connection.serialize()),
                metadata: {
                    updatedAt: Utils.formatDate(),
                    version: QUICK_ACTIONS_VERSION
                }
            };
        }

        load(action) {
            this.currentActionId = action?.id || Utils.uid('quick');
            this.nameInput.value = action?.name || '';
            this.iconInput.value = action?.icon || 'zap';
            this.colorInput.value = action?.color || '#6366F1';
            this.canvas.hydrate({
                nodes: action?.nodes || [],
                edges: action?.edges || [],
                zoom: 1,
                pan: { x: 0, y: 0 }
            });
            this.historyList.innerHTML = '';
            this.pushHistory(translate('quick_actions_history_load', 'Load action'));
        }

        pushHistory(text) {
            if (!this.historyList) return;
            const item = Utils.createElement('li', 'history-item', `${Utils.formatDate().slice(11, 19)} — ${text}`);
            this.historyList.prepend(item);
            while (this.historyList.children.length > 50) {
                this.historyList.removeChild(this.historyList.lastChild);
            }
        }

        open(actionId = null) {
            const action = actionId ? this.store.getCustomDefinition(actionId) : null;
            this.overlay.classList.add('active');
            this.overlay.setAttribute('aria-hidden', 'false');
            this.load(action);
            this.updateStatus(translate('quick_actions_status_ready', 'Designer ready'));
        }

        close() {
            this.overlay.classList.remove('active');
            this.overlay.setAttribute('aria-hidden', 'true');
            this.currentActionId = null;
        }

        save() {
            const action = this.buildAction();
            this.store.addCustom(action);
            this.pushHistory(translate('quick_actions_history_save', 'Save action'));
            if (typeof this.options.onChange === 'function') {
                this.options.onChange(this.store.serialize());
            }
            this.updateStatus(translate('quick_actions_status_saved', 'Action saved'));
            this.emit('save', action);
        }

        resetView() {
            this.canvas.zoom = 1;
            this.canvas.pan = new Vector2(0, 0);
            this.canvas.updateTransform();
        }

        toggleGrid() {
            const flag = this.overlay.getAttribute('data-grid') === 'true';
            this.overlay.setAttribute('data-grid', flag ? 'false' : 'true');
        }

        updateStatus(message) {
            if (!this.statusElement) return;
            this.statusElement.textContent = message;
        }
    }

    class QuickActionRuntime {
        constructor(store, options = {}) {
            this.store = store;
            this.options = options;
            this.emitter = new EventEmitter();
        }

        on(event, handler) {
            return this.emitter.on(event, handler);
        }

        async execute(actionId) {
            const action = this.store.getCustomDefinition(actionId);
            if (!action) return;
            const context = {
                clipboard: '',
                selection: '',
                results: []
            };
            const graph = this.buildGraph(action);
            const startNodes = graph.nodes.filter(node => node.type === 'trigger');
            for (const trigger of startNodes) {
                const payload = await this.runNode(trigger, undefined, context);
                await this.propagate(graph, trigger.id, payload, context);
            }
            this.emitter.emit('completed', { action, context });
            return context;
        }

        buildGraph(action) {
            const nodes = (action.nodes || []).map(node => ({ ...node }));
            const edges = (action.edges || []).map(edge => ({ ...edge }));
            const adjacency = new Map();
            edges.forEach(edge => {
                if (!adjacency.has(edge.from)) adjacency.set(edge.from, []);
                adjacency.get(edge.from).push(edge.to);
            });
            return { nodes, edges, adjacency };
        }

        async propagate(graph, nodeId, payload, context, visited = new Set()) {
            if (visited.has(nodeId)) return;
            visited.add(nodeId);
            const nextIds = graph.adjacency.get(nodeId) || [];
            for (const nextId of nextIds) {
                const node = graph.nodes.find(item => item.id === nextId);
                if (!node) continue;
                const result = await this.runNode(node, payload, context);
                await this.propagate(graph, nextId, result, context, visited);
            }
        }

        async runNode(node, payload, context) {
            const definition = this.findDefinition(node.paletteId);
            if (!definition) return payload;
            switch (definition.id) {
                case 'manual-trigger':
                    return payload;
                case 'clipboard-trigger':
                    context.clipboard = await navigator.clipboard?.readText?.().catch(() => '') || '';
                    return context.clipboard;
                case 'selection-trigger':
                    return payload || '';
                case 'timer-trigger':
                    await new Promise(resolve => setTimeout(resolve, (Number(node.config.seconds) || 1) * 1000));
                    return payload;
                case 'format-markdown':
                    if (typeof payload !== 'string') return payload;
                    return payload
                        .split(/\r?\n/)
                        .map(line => `${node.config.bullet || '-'} ${line}`)
                        .join('\n');
                case 'replace-text':
                    if (typeof payload !== 'string') return payload;
                    if (!node.config.pattern) return payload;
                    return payload.replace(new RegExp(node.config.pattern, 'g'), node.config.replace || '');
                case 'http-get':
                    try {
                        const response = await fetch(node.config.url || '');
                        return await response.text();
                    } catch (error) {
                        return payload;
                    }
                case 'append-text':
                    return `${payload || ''}${node.config.value || ''}`;
                case 'json-path':
                    try {
                        const data = typeof payload === 'string' ? JSON.parse(payload) : payload;
                        return node.config.path.split('.').reduce((acc, key) => acc?.[key], data);
                    } catch (error) {
                        return payload;
                    }
                case 'run-command':
                    if (this.options.ipcRenderer) {
                        const args = (node.config.args || '').split(' ').filter(Boolean);
                        try {
                            const result = await this.options.ipcRenderer.invoke('run-custom-command', {
                                command: node.config.command,
                                args
                            });
                            return result?.stdout || payload;
                        } catch (error) {
                            return payload;
                        }
                    }
                    return payload;
                case 'show-toast':
                    global.QuickActions?.showToast(
                        node.config.title || translate('quick_actions_runtime_default_toast_title', 'Quick action'),
                        node.config.body || String(payload ?? '')
                    );
                    return payload;
                case 'copy-result':
                    if (navigator.clipboard?.writeText) {
                        await navigator.clipboard.writeText(String(payload ?? ''));
                    }
                    return payload;
                case 'open-url':
                    if (this.options.shell?.openExternal) {
                        const url = (node.config.baseUrl || '') + encodeURIComponent(String(payload ?? ''));
                        this.options.shell.openExternal(url);
                    }
                    return payload;
                case 'emit-panel':
                    this.emitter.emit('panel', {
                        title: node.config.title || translate('quick_actions_module_emit_panel_title_default', 'Automation result'),
                        mode: node.config.mode || 'list',
                        payload
                    });
                    return payload;
                case 'branch-condition':
                    try {
                        const fn = new Function('payload', `return ${node.config.expression || 'true'};`);
                        const outcome = Boolean(fn(payload));
                        context.lastCondition = outcome;
                        return payload;
                    } catch (error) {
                        return payload;
                    }
                case 'merge-streams':
                    context.results = context.results || [];
                    context.results.push(payload);
                    return context.results;
                case 'delay-node':
                    await new Promise(resolve => setTimeout(resolve, Number(node.config.ms) || 0));
                    return payload;
                default:
                    return payload;
            }
        }

        findDefinition(paletteId) {
            const groups = Object.values(PaletteGroups);
            for (const group of groups) {
                const definition = group.find(item => item.id === paletteId);
                if (definition) return resolvePaletteItem(definition);
            }
            return null;
        }
    }

    class QuickActionController {
        constructor() {
            this.store = new QuickActionStore();
            this.bar = new QuickActionBarRenderer(this.store);
            this.settingsView = new QuickActionSettingsView(this.store, {
                onChange: (data) => this.persist(data)
            });
            this.preview = new QuickActionFlowPreview(Utils.qs('.quick-actions-flow-preview'));
            this.designer = new QuickActionDesigner(this.store, {
                onChange: (data) => this.persist(data)
            });
            this.runtime = new QuickActionRuntime(this.store, { ipcRenderer: global.ipcRenderer, shell: global.shell });
            this.runtime.on('panel', (payload) => this.renderPanel(payload));
            this.runtime.on('completed', (payload) => this.handleCompleted(payload));
            this.toast = null;
        }

        init(options = {}) {
            this.options = options;
            this.bar.mount('#quick-actions-bar');
            this.designer.mount('#quick-action-designer');
            this.settingsView.mount({
                activeList: '#quick-actions-active-list',
                library: '#quick-actions-library',
                preview: this.preview
            });
            this.attachUiEvents();
        }

        attachUiEvents() {
            const createButton = Utils.qs('#quick-actions-create');
            if (createButton) {
                createButton.addEventListener('click', () => this.openDesigner());
            }
            const openDesigner = Utils.qs('#quick-actions-open-designer');
            if (openDesigner) {
                openDesigner.addEventListener('click', () => this.openDesigner());
            }
            const resetButton = Utils.qs('#quick-actions-reset');
            if (resetButton) {
                resetButton.addEventListener('click', () => {
                    this.store.resetOrder();
                    this.persist();
                });
            }
        }

        hydrate(settings) {
            this.store.hydrate(settings);
            this.bar.render();
            this.settingsView.render();
            this.preview.render(this.store.customActions);
        }

        persist(data = this.store.serialize()) {
            if (!this.options.ipcRenderer) return;
            this.options.ipcRenderer.send('update-setting', 'quickActions', data.quickActions);
            this.options.ipcRenderer.send('update-setting', 'customQuickActions', data.customQuickActions);
        }

        openDesigner(actionId = null) {
            this.designer.open(actionId);
        }

        runCustomAction(actionId) {
            this.runtime.execute(actionId);
        }

        renderPanel({ title, mode, payload }) {
            const container = Utils.qs('#aux-panel');
            if (!container) return;
            container.innerHTML = '';
            const header = Utils.createElement('header', 'quick-action-panel-header');
            header.innerHTML = `<h3>${title}</h3>`;
            container.appendChild(header);
            const body = Utils.createElement('div', 'quick-action-panel-body');
            if (Array.isArray(payload)) {
                const list = document.createElement('ul');
                payload.forEach(item => {
                    const li = document.createElement('li');
                    li.textContent = typeof item === 'object' ? JSON.stringify(item, null, 2) : String(item);
                    list.appendChild(li);
                });
                body.appendChild(list);
            } else {
                const pre = document.createElement('pre');
                pre.textContent = typeof payload === 'object' ? JSON.stringify(payload, null, 2) : String(payload ?? '');
                body.appendChild(pre);
            }
            container.appendChild(body);
            container.classList.add('visible');
            if (global.AuxPanelManager) {
                global.AuxPanelManager.currentPanel = 'custom-action';
            }
        }

        handleCompleted({ action }) {
            const name = action?.name || translate('quick_actions_custom_card_title_fallback', 'Custom action');
            const message = translate('quick_actions_toast_completed', 'Action "%s" completed.').replace('%s', name);
            this.showToast(message);
        }

        showToast(message, timeout = 2400) {
            if (!this.toast) {
                this.toast = Utils.createElement('div', 'designer-toast');
                document.body.appendChild(this.toast);
            }
            this.toast.textContent = message;
            this.toast.classList.add('visible');
            setTimeout(() => this.toast.classList.remove('visible'), timeout);
        }
    }

    const controller = new QuickActionController();

    global.QuickActions = {
        init(options = {}) {
            controller.init({
                ipcRenderer: global.ipcRenderer,
                shell: global.shell,
                ...options
            });
        },
        hydrate(settings) {
            controller.hydrate(settings);
        },
        openDesigner(actionId) {
            controller.openDesigner(actionId);
        },
        runCustomAction(actionId) {
            controller.runCustomAction(actionId);
        },
        showToast(message, timeout) {
            controller.showToast(message, timeout);
        }
    };
})(window);
