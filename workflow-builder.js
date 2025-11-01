'use strict';

(function() {
    const UID_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789';

    function generateId(prefix = 'node') {
        const random = Array.from({ length: 8 }, () => UID_CHARS[Math.floor(Math.random() * UID_CHARS.length)]).join('');
        return `${prefix}-${random}`;
    }

    function deepClone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

    class TinyEmitter {
        constructor() {
            this.listeners = new Map();
        }

        on(event, handler) {
            if (!this.listeners.has(event)) {
                this.listeners.set(event, new Set());
            }
            this.listeners.get(event).add(handler);
            return () => this.off(event, handler);
        }

        off(event, handler) {
            const set = this.listeners.get(event);
            if (!set) return;
            set.delete(handler);
            if (set.size === 0) {
                this.listeners.delete(event);
            }
        }

        emit(event, payload) {
            const set = this.listeners.get(event);
            if (!set) return;
            set.forEach(handler => {
                try {
                    handler(payload);
                } catch (error) {
                    console.error('[WorkflowBuilder] Listener error', error);
                }
            });
        }
    }

    class ModuleRegistry {
        constructor() {
            this.modules = new Map();
            this.categories = new Map();
        }

        register(moduleDef) {
            const normalized = ModuleRegistry.normalize(moduleDef);
            this.modules.set(normalized.id, normalized);
            if (!this.categories.has(normalized.category)) {
                this.categories.set(normalized.category, []);
            }
            this.categories.get(normalized.category).push(normalized);
            this.categories.get(normalized.category).sort((a, b) => a.name.localeCompare(b.name));
            return normalized;
        }

        bulkRegister(list) {
            list.forEach(item => this.register(item));
        }

        get(id) {
            return this.modules.get(id) || null;
        }

        getAllCategories() {
            const entries = Array.from(this.categories.entries());
            entries.sort((a, b) => a[0].localeCompare(b[0]));
            return entries;
        }

        static normalize(def) {
            if (!def || typeof def !== 'object') throw new Error('Invalid module definition');
            if (!def.id) throw new Error('Module id is required');
            return {
                id: def.id,
                name: def.name || def.id,
                description: def.description || '',
                category: def.category || 'General',
                color: def.color || '#6366f1',
                icon: def.icon || 'box',
                inputs: Array.isArray(def.inputs) ? def.inputs : [],
                outputs: Array.isArray(def.outputs) ? def.outputs : [],
                defaults: ModuleRegistry.normalizeDefaults(def.defaults || {}),
                schema: def.schema || {},
                simulate: typeof def.simulate === 'function' ? def.simulate : null
            };
        }

        static normalizeDefaults(defaults) {
            const clone = { ...defaults };
            Object.keys(clone).forEach(key => {
                if (clone[key] && typeof clone[key] === 'object' && !Array.isArray(clone[key])) {
                    clone[key] = { ...clone[key] };
                }
            });
            return clone;
        }
    }

    class WorkflowNode {
        constructor(moduleDef, position = { x: 0, y: 0 }) {
            this.id = generateId('node');
            this.module = moduleDef;
            this.position = { x: position.x || 0, y: position.y || 0 };
            this.data = deepClone(moduleDef.defaults);
            this.label = moduleDef.name;
        }

        serialize() {
            return {
                id: this.id,
                moduleId: this.module.id,
                position: { ...this.position },
                data: deepClone(this.data),
                label: this.label
            };
        }
    }

    class WorkflowConnection {
        constructor(source, sourcePort, target, targetPort) {
            this.id = generateId('link');
            this.source = source;
            this.sourcePort = sourcePort;
            this.target = target;
            this.targetPort = targetPort;
        }

        serialize() {
            return {
                id: this.id,
                source: this.source.id,
                sourcePort: this.sourcePort,
                target: this.target.id,
                targetPort: this.targetPort
            };
        }
    }

    class CanvasInteractionManager {
        constructor(builder) {
            this.builder = builder;
            this.canvas = builder.canvasElement;
            this.connectionLayer = builder.connectionLayer;
            this.transform = { x: 0, y: 0, scale: 1 };
            this.dragState = null;
            this.pendingConnection = null;
            this.selection = new Set();
            this.hoverHandle = null;
            this.initEvents();
        }

        initEvents() {
            this.canvas.addEventListener('pointerdown', this.onPointerDown.bind(this));
            this.canvas.addEventListener('pointermove', this.onPointerMove.bind(this));
            window.addEventListener('pointerup', this.onPointerUp.bind(this));
            this.canvas.addEventListener('wheel', this.onWheel.bind(this), { passive: false });
        }

        setTransform({ x, y, scale }) {
            this.transform.x = x;
            this.transform.y = y;
            this.transform.scale = scale;
            this.builder.canvasContent.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
            this.builder.emit('transform:change', { ...this.transform });
        }

        onPointerDown(event) {
            const targetNode = event.target.closest('.workshop-node');
            const handle = event.target.closest('.workshop-port-handle');

            if (handle) {
                this.startConnection(event, handle);
                return;
            }

            if (targetNode) {
                this.startDragNode(event, targetNode);
                return;
            }

            this.startPan(event);
        }

        onPointerMove(event) {
            if (!this.dragState) {
                this.updatePendingConnection(event);
                return;
            }

            if (this.dragState.type === 'pan') {
                this.handlePan(event);
            } else if (this.dragState.type === 'node-drag') {
                this.handleNodeDrag(event);
            }
        }

        onPointerUp(event) {
            if (this.dragState) {
                if (this.dragState.type === 'node-drag') {
                    this.builder.emit('node:moved', { node: this.dragState.node });
                }
                this.dragState = null;
            }
            if (this.pendingConnection) {
                this.finishConnection(event);
            }
        }

        onWheel(event) {
            if (!event.ctrlKey) return;
            event.preventDefault();
            const delta = -event.deltaY * 0.0015;
            const nextScale = clamp(this.transform.scale + delta, 0.35, 1.85);
            const rect = this.canvas.getBoundingClientRect();
            const offsetX = event.clientX - rect.left;
            const offsetY = event.clientY - rect.top;
            const scaleDelta = nextScale / this.transform.scale;
            const newX = offsetX - (offsetX - this.transform.x) * scaleDelta;
            const newY = offsetY - (offsetY - this.transform.y) * scaleDelta;
            this.setTransform({ x: newX, y: newY, scale: nextScale });
        }

        startPan(event) {
            this.dragState = {
                type: 'pan',
                startX: event.clientX,
                startY: event.clientY,
                originX: this.transform.x,
                originY: this.transform.y
            };
        }

        handlePan(event) {
            const dx = event.clientX - this.dragState.startX;
            const dy = event.clientY - this.dragState.startY;
            this.setTransform({
                x: this.dragState.originX + dx,
                y: this.dragState.originY + dy,
                scale: this.transform.scale
            });
        }

        startDragNode(event, nodeElement) {
            const nodeId = nodeElement.getAttribute('data-node-id');
            const node = this.builder.nodes.get(nodeId);
            if (!node) return;
            const rect = this.canvas.getBoundingClientRect();
            const offsetX = (event.clientX - rect.left - this.transform.x) / this.transform.scale - node.position.x;
            const offsetY = (event.clientY - rect.top - this.transform.y) / this.transform.scale - node.position.y;
            this.dragState = {
                type: 'node-drag',
                node,
                offsetX,
                offsetY
            };
            this.selectNode(nodeId, event.shiftKey);
        }

        handleNodeDrag(event) {
            const rect = this.canvas.getBoundingClientRect();
            const rawX = (event.clientX - rect.left - this.transform.x) / this.transform.scale;
            const rawY = (event.clientY - rect.top - this.transform.y) / this.transform.scale;
            const newX = rawX - this.dragState.offsetX;
            const newY = rawY - this.dragState.offsetY;
            this.dragState.node.position.x = newX;
            this.dragState.node.position.y = newY;
            const domNode = this.builder.canvasContent.querySelector(`.workshop-node[data-node-id="${this.dragState.node.id}"]`);
            if (domNode) {
                domNode.style.transform = `translate(${newX}px, ${newY}px)`;
            }
            this.builder.requestConnectionRender();
        }

        startConnection(event, handle) {
            const nodeElement = handle.closest('.workshop-node');
            if (!nodeElement) return;
            const nodeId = nodeElement.getAttribute('data-node-id');
            const portName = handle.getAttribute('data-port-name');
            const portType = handle.getAttribute('data-port-type');
            const node = this.builder.nodes.get(nodeId);
            if (!node) return;
            this.pendingConnection = {
                node,
                portName,
                portType,
                path: this.createTempPath()
            };
            this.connectionLayer.appendChild(this.pendingConnection.path);
            this.updatePendingConnection(event);
        }

        createTempPath() {
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('class', 'workshop-connection');
            path.setAttribute('stroke-dasharray', '4 4');
            path.setAttribute('opacity', '0.6');
            return path;
        }

        updatePendingConnection(event) {
            if (!this.pendingConnection) return;
            const { node, portName } = this.pendingConnection;
            const portElement = this.builder.canvasContent.querySelector(`.workshop-port-handle[data-node-id="${node.id}"][data-port-name="${portName}"]`);
            if (!portElement) return;
            const rect = this.canvas.getBoundingClientRect();
            const startRect = portElement.getBoundingClientRect();
            const startX = (startRect.left + startRect.width / 2) - rect.left;
            const startY = (startRect.top + startRect.height / 2) - rect.top;
            const endX = event.clientX - rect.left;
            const endY = event.clientY - rect.top;
            this.pendingConnection.path.setAttribute('d', CanvasInteractionManager.computePath(startX, startY, endX, endY));
        }

        finishConnection(event) {
            const { node, portName, portType, path } = this.pendingConnection;
            this.pendingConnection = null;
            path.remove();
            const targetHandle = event.target.closest('.workshop-port-handle');
            if (!targetHandle) return;
            const targetNodeId = targetHandle.getAttribute('data-node-id');
            const targetPort = targetHandle.getAttribute('data-port-name');
            const targetType = targetHandle.getAttribute('data-port-type');
            if (!targetNodeId || !targetPort || !targetType) return;
            if (targetNodeId === node.id) return;
            if (portType === targetType) return;
            const source = portType === 'output' ? node : this.builder.nodes.get(targetNodeId);
            const sourcePort = portType === 'output' ? portName : targetPort;
            const target = portType === 'output' ? this.builder.nodes.get(targetNodeId) : node;
            const targetPortName = portType === 'output' ? targetPort : portName;
            if (!source || !target) return;
            this.builder.connectNodes(source.id, sourcePort, target.id, targetPortName);
        }

        selectNode(nodeId, additive = false) {
            if (!additive) {
                this.selection.forEach(id => this.updateNodeSelection(id, false));
                this.selection.clear();
            }
            if (this.selection.has(nodeId)) {
                this.updateNodeSelection(nodeId, false);
                this.selection.delete(nodeId);
            } else {
                this.selection.add(nodeId);
                this.updateNodeSelection(nodeId, true);
            }
            this.builder.emit('selection:change', { selection: Array.from(this.selection) });
        }

        updateNodeSelection(nodeId, selected) {
            const nodeEl = this.builder.canvasContent.querySelector(`.workshop-node[data-node-id="${nodeId}"]`);
            if (!nodeEl) return;
            nodeEl.classList.toggle('is-selected', selected);
        }

        clearSelection() {
            this.selection.forEach(id => this.updateNodeSelection(id, false));
            this.selection.clear();
            this.builder.emit('selection:change', { selection: [] });
        }

        static computePath(x1, y1, x2, y2) {
            const dx = Math.abs(x2 - x1) * 0.5;
            const control1 = x1 + (x2 > x1 ? dx : -dx);
            const control2 = x2 - (x2 > x1 ? dx : -dx);
            return `M ${x1} ${y1} C ${control1} ${y1}, ${control2} ${y2}, ${x2} ${y2}`;
        }
    }

    class PaletteController {
        constructor(builder, element) {
            this.builder = builder;
            this.element = element;
            this.searchElement = builder.root.querySelector('#workshop-module-search');
            this.attachEvents();
        }

        attachEvents() {
            if (this.searchElement) {
                this.searchElement.addEventListener('input', () => this.render());
            }
        }

        render() {
            const query = (this.searchElement?.value || '').toLowerCase();
            this.element.innerHTML = '';
            const categories = this.builder.modules.getAllCategories();
            categories.forEach(([category, modules]) => {
                const filtered = query
                    ? modules.filter(mod => mod.name.toLowerCase().includes(query) || mod.description.toLowerCase().includes(query))
                    : modules;
                if (filtered.length === 0) return;
                const group = document.createElement('div');
                group.className = 'workshop-palette-group';
                const heading = document.createElement('h4');
                heading.textContent = category;
                group.appendChild(heading);
                const list = document.createElement('div');
                list.className = 'workshop-module-list';
                filtered.forEach(module => {
                    const tile = document.createElement('button');
                    tile.type = 'button';
                    tile.className = 'workshop-module-tile';
                    tile.setAttribute('data-module-id', module.id);
                    tile.innerHTML = `
                        <strong>${module.name}</strong>
                        <span>${module.description}</span>
                    `;
                    tile.addEventListener('click', () => {
                        this.builder.addNode(module.id, { x: 80, y: 80 });
                    });
                    list.appendChild(tile);
                });
                group.appendChild(list);
                this.element.appendChild(group);
            });
        }
    }

    class InspectorController {
        constructor(builder, element) {
            this.builder = builder;
            this.element = element;
            this.currentNode = null;
        }

        render(node) {
            this.currentNode = node;
            this.element.innerHTML = '';
            if (!node) {
                const placeholder = document.createElement('div');
                placeholder.className = 'inspector-section';
                placeholder.innerHTML = '<p style="margin:0;color:var(--icon-color);">Select a node to configure its behavior.</p>';
                this.element.appendChild(placeholder);
                return;
            }

            const infoSection = document.createElement('div');
            infoSection.className = 'inspector-section';
            const title = document.createElement('h4');
            title.textContent = 'Summary';
            infoSection.appendChild(title);
            infoSection.appendChild(this.createTextField('Label', node.label, value => {
                node.label = value;
                this.builder.updateNodeHeader(node.id);
            }));
            infoSection.appendChild(this.createTextArea('Notes', node.data.__notes || '', value => {
                node.data.__notes = value;
            }));
            this.element.appendChild(infoSection);

            const fieldsSection = document.createElement('div');
            fieldsSection.className = 'inspector-section';
            const fieldsTitle = document.createElement('h4');
            fieldsTitle.textContent = 'Parameters';
            fieldsSection.appendChild(fieldsTitle);

            const schema = node.module.schema || {};
            const keys = Object.keys(schema);
            if (keys.length === 0) {
                const empty = document.createElement('p');
                empty.textContent = 'This module has no configurable parameters.';
                empty.style.color = 'var(--icon-color)';
                fieldsSection.appendChild(empty);
            } else {
                keys.forEach(key => {
                    const field = schema[key];
                    const value = node.data[key] !== undefined ? node.data[key] : field.default;
                    let control = null;
                    switch (field.type) {
                        case 'text':
                            control = this.createTextField(field.label || key, value, val => {
                                node.data[key] = val;
                                this.builder.emit('node:change', { node });
                            });
                            break;
                        case 'textarea':
                            control = this.createTextArea(field.label || key, value, val => {
                                node.data[key] = val;
                                this.builder.emit('node:change', { node });
                            });
                            break;
                        case 'number':
                            control = this.createNumberField(field.label || key, value, val => {
                                node.data[key] = val;
                                this.builder.emit('node:change', { node });
                            }, field);
                            break;
                        case 'select':
                            control = this.createSelectField(field.label || key, value, field.options || [], val => {
                                node.data[key] = val;
                                this.builder.emit('node:change', { node });
                            });
                            break;
                        case 'boolean':
                            control = this.createBooleanField(field.label || key, !!value, val => {
                                node.data[key] = val;
                                this.builder.emit('node:change', { node });
                            });
                            break;
                        default:
                            return;
                    }
                    fieldsSection.appendChild(control);
                });
            }

            this.element.appendChild(fieldsSection);
        }

        createTextField(label, value, onChange) {
            const wrapper = document.createElement('div');
            wrapper.className = 'inspector-field';
            const labelEl = document.createElement('label');
            labelEl.textContent = label;
            const input = document.createElement('input');
            input.type = 'text';
            input.value = value || '';
            input.addEventListener('input', () => onChange(input.value));
            wrapper.appendChild(labelEl);
            wrapper.appendChild(input);
            return wrapper;
        }

        createNumberField(label, value, onChange, schema) {
            const wrapper = document.createElement('div');
            wrapper.className = 'inspector-field';
            const labelEl = document.createElement('label');
            labelEl.textContent = label;
            const input = document.createElement('input');
            input.type = 'number';
            if (schema.min !== undefined) input.min = schema.min;
            if (schema.max !== undefined) input.max = schema.max;
            if (schema.step !== undefined) input.step = schema.step;
            input.value = value || 0;
            input.addEventListener('input', () => onChange(Number(input.value)));
            wrapper.appendChild(labelEl);
            wrapper.appendChild(input);
            return wrapper;
        }

        createSelectField(label, value, options, onChange) {
            const wrapper = document.createElement('div');
            wrapper.className = 'inspector-field';
            const labelEl = document.createElement('label');
            labelEl.textContent = label;
            const select = document.createElement('select');
            options.forEach(option => {
                const opt = document.createElement('option');
                if (typeof option === 'string') {
                    opt.value = option;
                    opt.textContent = option;
                } else {
                    opt.value = option.value;
                    opt.textContent = option.label;
                }
                select.appendChild(opt);
            });
            select.value = value;
            select.addEventListener('change', () => onChange(select.value));
            wrapper.appendChild(labelEl);
            wrapper.appendChild(select);
            return wrapper;
        }

        createBooleanField(label, value, onChange) {
            const wrapper = document.createElement('div');
            wrapper.className = 'inspector-field';
            const labelEl = document.createElement('label');
            labelEl.textContent = label;
            const select = document.createElement('select');
            const options = [
                { value: 'true', label: 'Enabled' },
                { value: 'false', label: 'Disabled' }
            ];
            options.forEach(option => {
                const opt = document.createElement('option');
                opt.value = option.value;
                opt.textContent = option.label;
                select.appendChild(opt);
            });
            select.value = value ? 'true' : 'false';
            select.addEventListener('change', () => onChange(select.value === 'true'));
            wrapper.appendChild(labelEl);
            wrapper.appendChild(select);
            return wrapper;
        }

        createTextArea(label, value, onChange) {
            const wrapper = document.createElement('div');
            wrapper.className = 'inspector-field';
            const labelEl = document.createElement('label');
            labelEl.textContent = label;
            const textarea = document.createElement('textarea');
            textarea.value = value || '';
            textarea.addEventListener('input', () => onChange(textarea.value));
            wrapper.appendChild(labelEl);
            wrapper.appendChild(textarea);
            return wrapper;
        }
    }

    class SimulationEngine {
        constructor(builder) {
            this.builder = builder;
            this.isRunning = false;
            this.logElement = null;
            this.panelElement = null;
            this.statusElement = null;
            this.emptyStateElement = null;
            this.statusTimer = null;
        }

        attach(panelElement) {
            this.panelElement = panelElement;
            if (!panelElement) return;
            panelElement.classList.remove('visible');
            panelElement.innerHTML = `
                <div class="workshop-simulation-header">
                    <div class="workshop-simulation-header-text">
                        <h4>${this.builder.translate('workshop_simulation_title', 'Simulation')}</h4>
                        <span class="workshop-simulation-status" data-status="idle" id="workshop-simulation-status">${this.builder.translate('workshop_simulation_status_idle', 'Idle')}</span>
                    </div>
                    <div class="workshop-simulation-controls">
                        <button type="button" class="workshop-simulation-btn" data-action="clear">${this.builder.translate('workshop_simulation_clear', 'Clear')}</button>
                        <button type="button" class="workshop-simulation-btn" data-action="close">${this.builder.translate('workshop_simulation_close', 'Hide')}</button>
                    </div>
                </div>
                <div class="workshop-simulation-logs" id="workshop-simulation-logs"></div>
                <div class="workshop-simulation-empty" id="workshop-simulation-empty">${this.builder.translate('workshop_simulation_empty', 'Run a workflow to see logs here.')}</div>
                <div class="workshop-simulation-footer">
                    <button type="button" class="workshop-tool" data-action="stop">${this.builder.translate('workshop_simulation_stop', 'Stop')}</button>
                </div>
            `;
            this.logElement = panelElement.querySelector('#workshop-simulation-logs');
            this.statusElement = panelElement.querySelector('#workshop-simulation-status');
            this.emptyStateElement = panelElement.querySelector('#workshop-simulation-empty');
            panelElement.querySelector('button[data-action="stop"]').addEventListener('click', () => this.stop());
            panelElement.querySelector('button[data-action="clear"]').addEventListener('click', () => this.clearLogs());
            panelElement.querySelector('button[data-action="close"]').addEventListener('click', () => this.closePanel());
            this.updateEmptyState();
        }

        log(message) {
            if (!this.logElement) return;
            const entry = document.createElement('div');
            entry.className = 'workshop-simulation-log';
            entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
            this.logElement.appendChild(entry);
            this.logElement.scrollTop = this.logElement.scrollHeight;
            this.updateEmptyState();
        }

        async simulate() {
            if (this.isRunning) return;
            this.isRunning = true;
            this.openPanel();
            this.clearLogs();
            this.setStatus('running');
            this.log(this.builder.translate('workshop_simulation_log_start', 'Simulation started'));
            const nodes = Array.from(this.builder.nodes.values());
            if (nodes.length === 0) {
                this.log(this.builder.translate('workshop_simulation_log_empty', 'No nodes in workflow.'));
                this.finish('idle');
                return;
            }
            for (const node of nodes) {
                this.log(`Executing node: ${node.label}`);
                if (typeof node.module.simulate === 'function') {
                    try {
                        const result = await node.module.simulate(node.data, this.builder.createExecutionContext());
                        this.log(`Result: ${JSON.stringify(result)}`);
                    } catch (error) {
                        this.log(`Error: ${error.message}`);
                        this.finish('error');
                        return;
                    }
                } else {
                    await new Promise(resolve => setTimeout(resolve, 150));
                }
            }
            this.log(this.builder.translate('workshop_simulation_log_done', 'Simulation completed'));
            this.finish('success');
        }

        stop() {
            if (!this.isRunning) return;
            this.finish('idle');
            this.log(this.builder.translate('workshop_simulation_log_stop', 'Simulation stopped'));
        }

        clearLogs() {
            if (!this.logElement) return;
            this.logElement.innerHTML = '';
            this.updateEmptyState();
        }

        updateEmptyState() {
            if (!this.emptyStateElement) return;
            const hasEntries = this.logElement && this.logElement.children.length > 0;
            this.emptyStateElement.style.display = hasEntries ? 'none' : 'block';
        }

        openPanel() {
            if (!this.panelElement) return;
            this.panelElement.classList.add('visible');
        }

        closePanel() {
            if (!this.panelElement || this.isRunning) return;
            this.panelElement.classList.remove('visible');
        }

        setStatus(state) {
            if (!this.statusElement) return;
            const labels = {
                idle: this.builder.translate('workshop_simulation_status_idle', 'Idle'),
                running: this.builder.translate('workshop_simulation_status_running', 'Running'),
                success: this.builder.translate('workshop_simulation_status_success', 'Completed'),
                error: this.builder.translate('workshop_simulation_status_error', 'Error')
            };
            this.statusElement.textContent = labels[state] || state;
            this.statusElement.setAttribute('data-status', state);
        }

        finish(state) {
            this.isRunning = false;
            if (this.statusTimer) clearTimeout(this.statusTimer);
            this.setStatus(state);
            if (state !== 'idle') {
                this.statusTimer = setTimeout(() => this.setStatus('idle'), 2400);
            }
        }
    }

    class DockWorkflowBuilder extends TinyEmitter {
        constructor(config) {
            super();
            this.root = config.root;
            this.canvasElement = config.canvas;
            this.connectionLayer = config.connectionLayer;
            this.canvasContent = config.canvasContent;
            this.paletteElement = config.palette;
            this.inspectorElement = config.inspector;
            this.minimapElement = config.minimap;
            this.toolbarElement = config.toolbar;
            this.iconPickerElement = config.iconPicker;
            this.meta = {
                nameInput: config.nameInput,
                descriptionInput: config.descriptionInput,
                colorInput: config.colorInput
            };
            this.simulationPanel = config.simulationPanel;
            this.translate = typeof config.translate === 'function'
                ? (key, fallback) => {
                    try {
                        const value = config.translate(key, fallback);
                        return value || fallback || key;
                    } catch (error) {
                        return fallback || key;
                    }
                }
                : (key, fallback) => fallback || key;

            this.nodes = new Map();
            this.connections = new Map();
            this.modules = new ModuleRegistry();
            this.interaction = new CanvasInteractionManager(this);
            this.palette = new PaletteController(this, this.paletteElement);
            this.inspector = new InspectorController(this, this.inspectorElement);
            this.simulator = new SimulationEngine(this);
            this.iconOptions = [];
            this.pendingRender = false;
            this.loadDefaultModules();
            this.setupToolbar();
            this.setupIconPicker();
            this.simulator.attach(this.simulationPanel);
        }

        loadDefaultModules() {
            this.modules.bulkRegister([
                {
                    id: 'trigger.app-launch',
                    name: 'Application Launch',
                    category: 'Triggers',
                    description: 'Fires when a specific application is launched on the system.',
                    icon: 'monitor',
                    color: '#f97316',
                    outputs: ['next'],
                    schema: {
                        application: { type: 'text', label: 'Process name', default: 'notepad.exe' },
                        debounce: { type: 'number', label: 'Debounce (ms)', default: 5000, min: 0, step: 100 }
                    }
                },
                {
                    id: 'trigger.schedule',
                    name: 'Scheduled Time',
                    category: 'Triggers',
                    description: 'Execute the workflow on a repeating schedule.',
                    icon: 'clock',
                    color: '#0ea5e9',
                    outputs: ['next'],
                    schema: {
                        cron: { type: 'text', label: 'Cron expression', default: '0 * * * *' },
                        timezone: { type: 'text', label: 'Timezone', default: 'local' }
                    }
                },
                {
                    id: 'action.open-app',
                    name: 'Open Application',
                    category: 'Actions',
                    description: 'Launch an application or open a file path.',
                    icon: 'box',
                    color: '#22c55e',
                    inputs: ['input'],
                    outputs: ['next'],
                    schema: {
                        path: { type: 'text', label: 'Path or command', default: 'calc.exe' },
                        arguments: { type: 'text', label: 'Arguments', default: '' }
                    },
                    simulate: async (data, ctx) => {
                        ctx.log(`Would launch: ${data.path}`);
                        return { status: 'ok' };
                    }
                },
                {
                    id: 'action.clipboard-set',
                    name: 'Set Clipboard',
                    category: 'Actions',
                    description: 'Write a value to the system clipboard.',
                    icon: 'clipboard',
                    color: '#10b981',
                    inputs: ['input'],
                    outputs: ['next'],
                    schema: {
                        content: { type: 'textarea', label: 'Content', default: 'Hello world' }
                    }
                },
                {
                    id: 'logic.branch',
                    name: 'Conditional Branch',
                    category: 'Logic',
                    description: 'Route the flow based on a condition.',
                    icon: 'git-branch',
                    color: '#8b5cf6',
                    inputs: ['input'],
                    outputs: ['true', 'false'],
                    schema: {
                        expression: { type: 'text', label: 'Expression', default: 'context.value > 0' }
                    }
                },
                {
                    id: 'logic.delay',
                    name: 'Delay',
                    category: 'Logic',
                    description: 'Pause the execution for a specific amount of time.',
                    icon: 'pause-circle',
                    color: '#fbbf24',
                    inputs: ['input'],
                    outputs: ['next'],
                    schema: {
                        duration: { type: 'number', label: 'Duration (ms)', default: 1000, min: 0, step: 100 }
                    }
                },
                {
                    id: 'core.workflow-end',
                    name: 'End',
                    category: 'Core',
                    description: 'Terminate the workflow explicitly.',
                    icon: 'stop-circle',
                    color: '#ef4444',
                    inputs: ['input'],
                    outputs: []
                }
            ]);
            this.palette.render();
        }

        setupToolbar() {
            if (!this.toolbarElement) return;
            this.toolbarElement.querySelectorAll('.workshop-tool').forEach(button => {
                button.addEventListener('click', () => {
                    const action = button.getAttribute('data-action');
                    switch (action) {
                        case 'zoom-in':
                            this.zoom(0.1);
                            break;
                        case 'zoom-out':
                            this.zoom(-0.1);
                            break;
                        case 'fit':
                            this.fitToScreen();
                            break;
                        case 'snap-grid':
                            this.toggleGrid();
                            break;
                        case 'simulate':
                            this.simulator.simulate();
                            break;
                    }
                });
            });
        }

        setupIconPicker() {
            if (!this.iconPickerElement) return;
            const iconNames = ['grid', 'folder', 'clipboard', 'command', 'zap', 'play', 'sliders', 'aperture', 'triangle', 'user', 'feather', 'layers', 'filter'];
            this.iconPickerElement.innerHTML = '';
            iconNames.forEach(name => {
                const option = document.createElement('button');
                option.type = 'button';
                option.className = 'workshop-icon-option';
                option.setAttribute('data-icon', name);
                option.innerHTML = window.feather?.icons?.[name]?.toSvg() || `<span>${name}</span>`;
                option.addEventListener('click', () => {
                    this.selectIcon(name);
                });
                this.iconPickerElement.appendChild(option);
                this.iconOptions.push(option);
            });
            if (this.iconOptions[0]) {
                this.iconOptions[0].classList.add('active');
            }
        }

        selectIcon(name) {
            this.iconOptions.forEach(option => {
                option.classList.toggle('active', option.getAttribute('data-icon') === name);
            });
            this.emit('meta:change', this.getMetadata());
        }

        zoom(delta) {
            const current = { ...this.interaction.transform };
            const nextScale = clamp(current.scale + delta, 0.35, 1.85);
            this.interaction.setTransform({ ...current, scale: nextScale });
        }

        fitToScreen() {
            if (this.nodes.size === 0) {
                this.interaction.setTransform({ x: 0, y: 0, scale: 1 });
                return;
            }
            const bounds = this.computeBounds();
            const canvasRect = this.canvasElement.getBoundingClientRect();
            const padding = 80;
            const scaleX = (canvasRect.width - padding) / bounds.width;
            const scaleY = (canvasRect.height - padding) / bounds.height;
            const nextScale = clamp(Math.min(scaleX, scaleY), 0.3, 1.6);
            const centerX = bounds.x + bounds.width / 2;
            const centerY = bounds.y + bounds.height / 2;
            const offsetX = canvasRect.width / 2 - centerX * nextScale;
            const offsetY = canvasRect.height / 2 - centerY * nextScale;
            this.interaction.setTransform({ x: offsetX, y: offsetY, scale: nextScale });
        }

        toggleGrid() {
            const grid = this.canvasElement.querySelector('.workshop-grid');
            if (!grid) return;
            grid.classList.toggle('is-hidden');
        }

        addNode(moduleId, position) {
            const module = this.modules.get(moduleId);
            if (!module) throw new Error(`Module ${moduleId} not registered`);
            const node = new WorkflowNode(module, position);
            this.nodes.set(node.id, node);
            this.renderNode(node);
            this.inspector.render(node);
            this.emit('node:add', { node });
            this.requestConnectionRender();
            return node;
        }

        connectNodes(sourceId, sourcePort, targetId, targetPort) {
            const source = this.nodes.get(sourceId);
            const target = this.nodes.get(targetId);
            if (!source || !target) return;
            const connection = new WorkflowConnection(source, sourcePort, target, targetPort);
            this.connections.set(connection.id, connection);
            this.requestConnectionRender();
            this.emit('connection:add', { connection });
            return connection;
        }

        removeNode(nodeId) {
            const node = this.nodes.get(nodeId);
            if (!node) return;
            this.nodes.delete(nodeId);
            this.canvasContent.querySelector(`.workshop-node[data-node-id="${nodeId}"]`)?.remove();
            Array.from(this.connections.values()).forEach(connection => {
                if (connection.source.id === nodeId || connection.target.id === nodeId) {
                    this.connections.delete(connection.id);
                }
            });
            this.requestConnectionRender();
            this.inspector.render(null);
            this.emit('node:remove', { node });
        }

        renderNode(node) {
            const element = document.createElement('div');
            element.className = 'workshop-node';
            element.setAttribute('data-node-id', node.id);
            element.style.transform = `translate(${node.position.x}px, ${node.position.y}px)`;
            element.innerHTML = `
                <div class="workshop-node-header">
                    <strong>${node.label}</strong>
                    <span class="workshop-node-type">${node.module.category}</span>
                </div>
                <div class="workshop-node-body">
                    <div class="workshop-port-list workshop-port-list--inputs">
                        ${node.module.inputs.map(input => `<div class="workshop-port">
                            <span class="workshop-port-label">${input}</span>
                            <span class="workshop-port-handle" data-port-type="input" data-port-name="${input}" data-node-id="${node.id}"></span>
                        </div>`).join('')}
                    </div>
                    <div class="workshop-port-list workshop-port-list--outputs">
                        ${node.module.outputs.map(output => `<div class="workshop-port">
                            <span class="workshop-port-label">${output}</span>
                            <span class="workshop-port-handle" data-port-type="output" data-port-name="${output}" data-node-id="${node.id}"></span>
                        </div>`).join('')}
                    </div>
                </div>
                <div class="workshop-node-footer">
                    <button type="button" data-action="duplicate">Duplicate</button>
                    <button type="button" data-action="delete">Delete</button>
                </div>
            `;
            element.querySelector('button[data-action="delete"]').addEventListener('click', () => this.removeNode(node.id));
            element.querySelector('button[data-action="duplicate"]').addEventListener('click', () => this.duplicateNode(node.id));
            element.addEventListener('pointerdown', () => {
                this.inspector.render(node);
                this.interaction.selectNode(node.id);
            });
            this.canvasContent.appendChild(element);
        }

        updateNodeHeader(nodeId) {
            const node = this.nodes.get(nodeId);
            if (!node) return;
            const element = this.canvasContent.querySelector(`.workshop-node[data-node-id="${nodeId}"] .workshop-node-header strong`);
            if (element) {
                element.textContent = node.label;
            }
        }

        duplicateNode(nodeId) {
            const original = this.nodes.get(nodeId);
            if (!original) return;
            const copy = new WorkflowNode(original.module, {
                x: original.position.x + 40,
                y: original.position.y + 40
            });
            copy.data = deepClone(original.data);
            copy.label = `${original.label} copy`;
            this.nodes.set(copy.id, copy);
            this.renderNode(copy);
            this.emit('node:add', { node: copy });
            this.requestConnectionRender();
        }

        requestConnectionRender() {
            if (this.pendingRender) return;
            this.pendingRender = true;
            requestAnimationFrame(() => {
                this.pendingRender = false;
                this.renderConnections();
            });
        }

        renderConnections() {
            this.connectionLayer.innerHTML = '';
            this.connections.forEach(connection => {
                const sourceHandle = this.canvasContent.querySelector(`.workshop-port-handle[data-node-id="${connection.source.id}"][data-port-name="${connection.sourcePort}"]`);
                const targetHandle = this.canvasContent.querySelector(`.workshop-port-handle[data-node-id="${connection.target.id}"][data-port-name="${connection.targetPort}"]`);
                if (!sourceHandle || !targetHandle) return;
                const rect = this.canvasElement.getBoundingClientRect();
                const sourceRect = sourceHandle.getBoundingClientRect();
                const targetRect = targetHandle.getBoundingClientRect();
                const startX = (sourceRect.left + sourceRect.width / 2) - rect.left;
                const startY = (sourceRect.top + sourceRect.height / 2) - rect.top;
                const endX = (targetRect.left + targetRect.width / 2) - rect.left;
                const endY = (targetRect.top + targetRect.height / 2) - rect.top;
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.setAttribute('class', 'workshop-connection');
                path.setAttribute('data-connection-id', connection.id);
                path.setAttribute('d', CanvasInteractionManager.computePath(startX, startY, endX, endY));
                this.connectionLayer.appendChild(path);
            });
        }

        computeBounds() {
            const positions = Array.from(this.nodes.values()).map(node => ({
                x1: node.position.x,
                y1: node.position.y,
                x2: node.position.x + 240,
                y2: node.position.y + 140
            }));
            const minX = Math.min(...positions.map(p => p.x1));
            const minY = Math.min(...positions.map(p => p.y1));
            const maxX = Math.max(...positions.map(p => p.x2));
            const maxY = Math.max(...positions.map(p => p.y2));
            return {
                x: minX,
                y: minY,
                width: maxX - minX,
                height: maxY - minY
            };
        }

        clear() {
            this.nodes.clear();
            this.connections.clear();
            this.canvasContent.innerHTML = '';
            this.connectionLayer.innerHTML = '';
            this.inspector.render(null);
        }

        serialize() {
            return {
                meta: this.getMetadata(),
                nodes: Array.from(this.nodes.values()).map(node => node.serialize()),
                connections: Array.from(this.connections.values()).map(connection => connection.serialize())
            };
        }

        load(workflow) {
            this.clear();
            if (!workflow) {
                this.inspector.render(null);
                return;
            }
            (workflow.nodes || []).forEach(nodeData => {
                const module = this.modules.get(nodeData.moduleId);
                if (!module) return;
                const node = new WorkflowNode(module, nodeData.position);
                node.id = nodeData.id;
                node.label = nodeData.label || module.name;
                node.data = { ...module.defaults, ...nodeData.data };
                this.nodes.set(node.id, node);
                this.renderNode(node);
            });
            (workflow.connections || []).forEach(conn => {
                const source = this.nodes.get(conn.source);
                const target = this.nodes.get(conn.target);
                if (!source || !target) return;
                const connection = new WorkflowConnection(source, conn.sourcePort, target, conn.targetPort);
                connection.id = conn.id;
                this.connections.set(connection.id, connection);
            });
            this.meta.nameInput.value = workflow.meta?.name || '';
            this.meta.descriptionInput.value = workflow.meta?.description || '';
            if (workflow.meta?.color) {
                this.meta.colorInput.value = workflow.meta.color;
            }
            if (workflow.meta?.icon) {
                this.selectIcon(workflow.meta.icon);
            }
            this.inspector.render(null);
            this.requestConnectionRender();
        }

        getMetadata() {
            const activeIcon = this.iconOptions.find(option => option.classList.contains('active'));
            return {
                name: this.meta.nameInput.value.trim() || 'Untitled workflow',
                description: this.meta.descriptionInput.value.trim(),
                color: this.meta.colorInput.value || '#6366f1',
                icon: activeIcon?.getAttribute('data-icon') || 'grid'
            };
        }

        createExecutionContext() {
            return {
                log: message => {
                    this.simulator.log(message);
                }
            };
        }
    }

    window.WorkflowBuilder = {
        create(config) {
            return new DockWorkflowBuilder(config);
        }
    };
})();
