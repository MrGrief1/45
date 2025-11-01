(function(global) {
    'use strict';

    const POINTER_BUTTON_PRIMARY = 0;
    const DEFAULT_NODE_WIDTH = 260;
    const DEFAULT_NODE_HEIGHT = 120;
    const MIN_ZOOM = 0.5;
    const MAX_ZOOM = 1.8;

    function deepClone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    class WorkflowDesigner {
        constructor(options = {}) {
            this.canvas = options.canvas || document.createElement('div');
            this.connectionLayer = options.connectionLayer || document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            this.nodesLayer = options.nodesLayer || document.createElement('div');
            this.moduleCatalog = options.moduleCatalog || { triggers: [], actions: [], logic: [], integrations: [] };
            this.moduleContainer = options.moduleContainer;
            this.blueprintContainer = options.blueprintContainer;
            this.inspectorContainer = options.inspectorContainer;
            this.onSelectionChange = typeof options.onSelectionChange === 'function' ? options.onSelectionChange : () => {};
            this.onStatusChange = typeof options.onStatusChange === 'function' ? options.onStatusChange : () => {};
            this.onZoomChange = typeof options.onZoomChange === 'function' ? options.onZoomChange : () => {};

            this.nodes = new Map();
            this.connections = [];
            this.selectedNodeId = null;
            this.draggingNodeId = null;
            this.draggingConnection = null;
            this.currentZoom = 1;
            this.canvasOrigin = { x: 0, y: 0 };
            this.pointerState = {
                isPanning: false,
                startX: 0,
                startY: 0,
                panX: 0,
                panY: 0
            };
            this.metadata = {
                name: '',
                description: '',
                icon: 'cpu',
                accentColor: '#6366f1'
            };
            this.trigger = {
                module: this.moduleCatalog.triggers?.[0]?.id || null,
                config: deepClone(this.moduleCatalog.triggers?.[0]?.defaultConfig || {})
            };

            this.ensureCanvas();
            this.buildModulePalette();
            this.buildBlueprintPalette();
            this.registerCanvasEvents();
            this.renderTrigger();
            this.refresh();
        }

        ensureCanvas() {
            this.canvas.classList.add('designer-canvas-inner');
            this.nodesLayer.classList.add('designer-nodes-layer');
            if (!this.connectionLayer.getAttribute('class')) {
                this.connectionLayer.setAttribute('class', 'designer-connection-layer');
            }
            if (this.canvas && !this.canvas.contains(this.connectionLayer)) {
                this.canvas.appendChild(this.connectionLayer);
            }
            if (this.canvas && !this.canvas.contains(this.nodesLayer)) {
                this.canvas.appendChild(this.nodesLayer);
            }
        }

        buildModulePalette() {
            if (!this.moduleContainer) return;
            this.moduleContainer.innerHTML = '';

            const groups = [
                { key: 'triggers', label: 'quick_app_modules_triggers' },
                { key: 'actions', label: 'quick_app_modules_actions' },
                { key: 'logic', label: 'quick_app_modules_logic' },
                { key: 'integrations', label: 'quick_app_modules_integrations' }
            ];

            groups.forEach(group => {
                const modules = this.moduleCatalog[group.key] || [];
                if (modules.length === 0) return;

                const groupEl = document.createElement('section');
                groupEl.className = 'module-group';

                const heading = document.createElement('h4');
                heading.textContent = this.translate(group.label);
                groupEl.appendChild(heading);

                modules.forEach(module => {
                    const item = document.createElement('button');
                    item.type = 'button';
                    item.className = 'module-item';
                    item.setAttribute('data-module-id', module.id);
                    item.innerHTML = `
                        <i data-feather="${module.icon || 'box'}"></i>
                        <div class="module-meta">
                            <span class="module-name">${this.translate(module.labelKey)}</span>
                            <span class="module-description">${this.translate(module.descriptionKey)}</span>
                        </div>
                    `;
                    item.addEventListener('click', () => {
                        this.addNodeFromModule(module);
                    });
                    item.addEventListener('dragstart', event => {
                        event.preventDefault();
                    });
                    groupEl.appendChild(item);
                });

                this.moduleContainer.appendChild(groupEl);
            });
        }

        buildBlueprintPalette() {
            if (!this.blueprintContainer) return;
            this.blueprintContainer.innerHTML = '';
            const blueprints = global.QuickActionBlueprints || [];
            blueprints.forEach(blueprint => {
                const card = document.createElement('button');
                card.type = 'button';
                card.className = 'blueprint-card';
                card.innerHTML = `
                    <div class="blueprint-icon">
                        <i data-feather="${blueprint.icon || 'layers'}"></i>
                    </div>
                    <div class="blueprint-body">
                        <h5>${this.translate(blueprint.nameKey)}</h5>
                        <p>${this.translate(blueprint.descriptionKey)}</p>
                        <div class="blueprint-meta">
                            <span>${blueprint.difficulty || 'standard'}</span>
                            <span>${this.translate('quick_action_blueprint_eta', blueprint.estimatedTime || 5)}</span>
                        </div>
                    </div>
                `;
                card.addEventListener('click', () => {
                    this.loadBlueprint(blueprint);
                    if (typeof this.onStatusChange === 'function') {
                        this.onStatusChange(this.translate('quick_app_builder_blueprint_applied'));
                    }
                });
                this.blueprintContainer.appendChild(card);
            });
            if (global.feather) global.feather.replace();
        }

        translate(key, value) {
            if (global.LocalizationRenderer && typeof global.LocalizationRenderer.t === 'function') {
                return global.LocalizationRenderer.t(key, value);
            }
            return typeof value !== 'undefined' ? value : key;
        }

        registerCanvasEvents() {
            if (!this.canvas) return;
            this.canvas.addEventListener('pointerdown', event => this.handleCanvasPointerDown(event));
            this.canvas.addEventListener('wheel', event => this.handleWheel(event), { passive: false });
            window.addEventListener('pointerup', event => this.handlePointerUp(event));
            window.addEventListener('pointermove', event => this.handlePointerMove(event));
        }

        handleCanvasPointerDown(event) {
            if (event.button !== POINTER_BUTTON_PRIMARY) return;
            if (event.target.closest('.builder-node')) return;
            this.pointerState.isPanning = true;
            this.pointerState.startX = event.clientX;
            this.pointerState.startY = event.clientY;
            this.canvas.setPointerCapture(event.pointerId);
        }

        handlePointerMove(event) {
            if (!this.pointerState.isPanning && !this.draggingNodeId && !this.draggingConnection) return;

            if (this.pointerState.isPanning) {
                const deltaX = event.clientX - this.pointerState.startX;
                const deltaY = event.clientY - this.pointerState.startY;
                this.pointerState.panX += deltaX;
                this.pointerState.panY += deltaY;
                this.canvasOrigin.x += deltaX;
                this.canvasOrigin.y += deltaY;
                this.applyCanvasTransform();
                this.pointerState.startX = event.clientX;
                this.pointerState.startY = event.clientY;
                return;
            }

            if (this.draggingNodeId) {
                const node = this.nodes.get(this.draggingNodeId);
                if (!node) return;
                const bounds = this.canvas.getBoundingClientRect();
                const newX = (event.clientX - bounds.left - this.canvasOrigin.x) / this.currentZoom - node.dragOffset.x;
                const newY = (event.clientY - bounds.top - this.canvasOrigin.y) / this.currentZoom - node.dragOffset.y;
                this.updateNodePosition(node.id, newX, newY);
                return;
            }

            if (this.draggingConnection) {
                this.updateGhostConnection(event);
            }
        }

        handlePointerUp(event) {
            if (this.pointerState.isPanning) {
                this.pointerState.isPanning = false;
                if (this.canvas.hasPointerCapture(event.pointerId)) {
                    this.canvas.releasePointerCapture(event.pointerId);
                }
            }

            if (this.draggingNodeId) {
                this.draggingNodeId = null;
            }

            if (this.draggingConnection) {
                this.removeGhostConnection();
                this.draggingConnection = null;
            }
        }

        handleWheel(event) {
            if (!event.ctrlKey) return;
            event.preventDefault();
            const delta = -event.deltaY;
            const zoomStep = delta > 0 ? 0.05 : -0.05;
            this.adjustZoom(zoomStep, { x: event.clientX, y: event.clientY });
        }

        adjustZoom(amount, focusPoint) {
            const oldZoom = this.currentZoom;
            const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, this.currentZoom + amount));
            if (Math.abs(newZoom - oldZoom) < 0.001) return;
            this.currentZoom = newZoom;

            if (focusPoint && this.canvas) {
                const rect = this.canvas.getBoundingClientRect();
                const focusX = focusPoint.x - rect.left;
                const focusY = focusPoint.y - rect.top;
                const scale = newZoom / oldZoom;
                this.canvasOrigin.x = focusX - scale * (focusX - this.canvasOrigin.x);
                this.canvasOrigin.y = focusY - scale * (focusY - this.canvasOrigin.y);
            }

            this.applyCanvasTransform();
            this.onZoomChange(this.currentZoom);
        }

        setZoom(value) {
            const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
            this.currentZoom = clamped;
            this.applyCanvasTransform();
            this.onZoomChange(this.currentZoom);
        }

        applyCanvasTransform() {
            if (!this.nodesLayer) return;
            const transform = `translate(${this.canvasOrigin.x}px, ${this.canvasOrigin.y}px) scale(${this.currentZoom})`;
            this.nodesLayer.style.transform = transform;
            if (this.connectionLayer) {
                this.connectionLayer.setAttribute('style', `transform: translate(${this.canvasOrigin.x}px, ${this.canvasOrigin.y}px) scale(${this.currentZoom});`);
            }
        }

        addNodeFromModule(module) {
            const position = {
                x: 120 + Math.random() * 280,
                y: 160 + Math.random() * 200
            };
            const nodeId = this.createNode(module, position);
            this.selectNode(nodeId);
            if (typeof this.onStatusChange === 'function') {
                this.onStatusChange(this.translate('quick_app_builder_node_added'));
            }
        }

        createNode(moduleDefinition, position = { x: 200, y: 200 }) {
            const nodeId = `node-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            const config = deepClone(moduleDefinition.defaultConfig || {});
            const node = {
                id: nodeId,
                moduleId: moduleDefinition.id,
                definition: moduleDefinition,
                position: { x: position.x, y: position.y },
                config,
                dragOffset: { x: 0, y: 0 }
            };
            this.nodes.set(nodeId, node);
            this.renderNode(node);
            this.renderConnections();
            return nodeId;
        }

        renderNode(node) {
            let element = this.nodesLayer.querySelector(`[data-node-id="${node.id}"]`);
            if (!element) {
                element = document.createElement('div');
                element.className = 'builder-node';
                element.setAttribute('data-node-id', node.id);
                element.innerHTML = `
                    <div class="builder-node-header">
                        <div class="builder-node-title">${this.translate(node.definition.labelKey)}</div>
                        <div class="builder-node-type">${node.definition.category || 'module'}</div>
                    </div>
                    <div class="builder-node-ports">
                        <div class="builder-node-port-list builder-node-inputs"></div>
                        <div class="builder-node-port-list builder-node-outputs"></div>
                    </div>
                    <div class="builder-node-footer">${this.translate(node.definition.descriptionKey)}</div>
                `;
                this.nodesLayer.appendChild(element);

                element.addEventListener('pointerdown', event => {
                    if (event.button !== POINTER_BUTTON_PRIMARY) return;
                    const bounds = element.getBoundingClientRect();
                    const containerBounds = this.nodesLayer.getBoundingClientRect();
                    node.dragOffset = {
                        x: (event.clientX - bounds.left) / this.currentZoom,
                        y: (event.clientY - bounds.top) / this.currentZoom
                    };
                    this.draggingNodeId = node.id;
                    this.selectNode(node.id);
                    event.stopPropagation();
                });

                element.addEventListener('dblclick', event => {
                    event.stopPropagation();
                    this.openInspector(node);
                });
            }

            const inputsContainer = element.querySelector('.builder-node-inputs');
            const outputsContainer = element.querySelector('.builder-node-outputs');
            if (inputsContainer) {
                inputsContainer.innerHTML = '';
                const inputs = node.definition.ports?.inputs || [];
                inputs.forEach(port => {
                    const portEl = this.createPortElement(node, port, 'input');
                    inputsContainer.appendChild(portEl);
                });
            }
            if (outputsContainer) {
                outputsContainer.innerHTML = '';
                const outputs = node.definition.ports?.outputs || [];
                outputs.forEach(port => {
                    const portEl = this.createPortElement(node, port, 'output');
                    outputsContainer.appendChild(portEl);
                });
            }

            element.style.setProperty('--node-accent', node.definition.accentColor || '#6366f1');
            this.updateNodePosition(node.id, node.position.x, node.position.y, false);
            if (global.feather) global.feather.replace();
        }

        createPortElement(node, portName, portType) {
            const port = document.createElement('button');
            port.type = 'button';
            port.className = `builder-port builder-port-${portType}`;
            port.innerHTML = `
                <span class="port-handle" data-node-id="${node.id}" data-port-name="${portName}" data-port-type="${portType}"></span>
                <span class="builder-port-label">${portName}</span>
            `;
            port.addEventListener('click', event => {
                event.stopPropagation();
                this.startConnectionDrag(node.id, portName, portType, event);
            });
            return port;
        }

        startConnectionDrag(nodeId, portName, portType, event) {
            if (this.draggingConnection) {
                if (portType === 'input' && this.draggingConnection.source) {
                    const target = { node: nodeId, port: portName };
                    this.finalizeConnection(this.draggingConnection.source, target);
                    this.removeGhostConnection();
                    this.draggingConnection = null;
                    return;
                }
                if (portType === 'output' && this.draggingConnection.target) {
                    const source = { node: nodeId, port: portName };
                    this.finalizeConnection(source, this.draggingConnection.target);
                    this.removeGhostConnection();
                    this.draggingConnection = null;
                    return;
                }
            }

            if (portType === 'input') {
                const existing = this.connections.find(connection => connection.target.node === nodeId && connection.target.port === portName);
                if (existing) {
                    this.connections = this.connections.filter(conn => conn !== existing);
                    this.renderConnections();
                }
            }

            this.draggingConnection = {
                source: portType === 'output' ? { node: nodeId, port: portName } : null,
                target: portType === 'input' ? { node: nodeId, port: portName } : null,
                previewPath: null
            };
            this.createGhostConnection(event);
        }

        createGhostConnection(event) {
            if (!this.connectionLayer) return;
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('class', 'builder-connection ghost');
            this.connectionLayer.appendChild(path);
            this.draggingConnection.previewPath = path;
            this.updateGhostConnection(event);
        }

        finalizeConnection(source, target) {
            if (!source || !target) return;
            if (source.node === target.node && source.port === target.port) return;
            const duplicate = this.connections.some(connection => connection.source.node === source.node && connection.source.port === source.port && connection.target.node === target.node && connection.target.port === target.port);
            if (duplicate) return;
            this.connections.push({ source: deepClone(source), target: deepClone(target) });
            this.renderConnections();
            if (typeof this.onStatusChange === 'function') {
                this.onStatusChange(this.translate('quick_app_builder_connection_added'));
            }
        }

        updateGhostConnection(event) {
            if (!this.draggingConnection || !this.draggingConnection.previewPath) return;
            const { source, target } = this.draggingConnection;
            const canvasBounds = this.canvas.getBoundingClientRect();
            const x = (event.clientX - canvasBounds.left - this.canvasOrigin.x) / this.currentZoom;
            const y = (event.clientY - canvasBounds.top - this.canvasOrigin.y) / this.currentZoom;

            let startPoint;
            let endPoint;
            if (source) {
                startPoint = this.getPortPosition(source.node, source.port, 'output');
                endPoint = { x, y };
            } else if (target) {
                startPoint = { x, y };
                endPoint = this.getPortPosition(target.node, target.port, 'input');
            } else {
                return;
            }

            const pathData = this.buildConnectionPath(startPoint, endPoint);
            this.draggingConnection.previewPath.setAttribute('d', pathData);
        }

        removeGhostConnection() {
            if (this.draggingConnection && this.draggingConnection.previewPath) {
                this.draggingConnection.previewPath.remove();
                this.draggingConnection.previewPath = null;
            }
        }

        getPortPosition(nodeId, portName, portType) {
            const element = this.nodesLayer.querySelector(`[data-node-id="${nodeId}"]`);
            if (!element) return { x: 0, y: 0 };
            const selector = `.builder-port-${portType} .port-handle[data-port-name="${CSS.escape(portName)}"]`;
            const portElement = element.querySelector(selector);
            if (!portElement) {
                const rect = element.getBoundingClientRect();
                return {
                    x: (rect.left + rect.right) / 2,
                    y: (rect.top + rect.bottom) / 2
                };
            }
            const rect = portElement.getBoundingClientRect();
            const canvasRect = this.canvas.getBoundingClientRect();
            return {
                x: (rect.left + rect.right) / 2 - canvasRect.left - this.canvasOrigin.x,
                y: (rect.top + rect.bottom) / 2 - canvasRect.top - this.canvasOrigin.y
            };
        }

        buildConnectionPath(start, end) {
            const offset = Math.max(Math.abs(end.x - start.x) * 0.4, 60);
            return `M ${start.x} ${start.y} C ${start.x + offset} ${start.y}, ${end.x - offset} ${end.y}, ${end.x} ${end.y}`;
        }

        renderConnections() {
            if (!this.connectionLayer) return;
            const existing = Array.from(this.connectionLayer.querySelectorAll('path:not(.ghost)'));
            existing.forEach(path => path.remove());

            this.connections.forEach(connection => {
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.setAttribute('class', 'builder-connection');
                const start = this.getPortPosition(connection.source.node, connection.source.port, 'output');
                const end = this.getPortPosition(connection.target.node, connection.target.port, 'input');
                path.setAttribute('d', this.buildConnectionPath(start, end));
                path.addEventListener('click', event => {
                    event.stopPropagation();
                    this.connections = this.connections.filter(conn => conn !== connection);
                    path.remove();
                });
                this.connectionLayer.appendChild(path);
            });
        }

        updateNodePosition(nodeId, x, y, refresh = true) {
            const node = this.nodes.get(nodeId);
            if (!node) return;
            node.position.x = x;
            node.position.y = y;
            const element = this.nodesLayer.querySelector(`[data-node-id="${nodeId}"]`);
            if (element) {
                element.style.transform = `translate(${x}px, ${y}px)`;
            }
            if (refresh) {
                this.renderConnections();
            }
        }

        selectNode(nodeId) {
            this.selectedNodeId = nodeId;
            Array.from(this.nodesLayer.querySelectorAll('.builder-node.selected')).forEach(el => el.classList.remove('selected'));
            if (nodeId) {
                const element = this.nodesLayer.querySelector(`[data-node-id="${nodeId}"]`);
                if (element) element.classList.add('selected');
            }
            const node = nodeId ? this.nodes.get(nodeId) : null;
            this.openInspector(node);
            this.onSelectionChange(node);
        }

        clearSelection() {
            this.selectNode(null);
        }

        duplicateSelection() {
            if (!this.selectedNodeId) return;
            const node = this.nodes.get(this.selectedNodeId);
            if (!node) return;
            const moduleDef = node.definition;
            const duplicate = this.createNode(moduleDef, { x: node.position.x + 40, y: node.position.y + 40 });
            const newNode = this.nodes.get(duplicate);
            newNode.config = deepClone(node.config);
            this.renderNode(newNode);
            this.renderConnections();
            this.selectNode(duplicate);
        }

        deleteSelection() {
            if (!this.selectedNodeId) return;
            const nodeId = this.selectedNodeId;
            this.nodes.delete(nodeId);
            const element = this.nodesLayer.querySelector(`[data-node-id="${nodeId}"]`);
            if (element) element.remove();
            this.connections = this.connections.filter(connection => connection.source.node !== nodeId && connection.target.node !== nodeId);
            this.renderConnections();
            this.selectNode(null);
        }

        openInspector(node) {
            if (!this.inspectorContainer) return;
            this.inspectorContainer.innerHTML = '';

            if (!node) {
                const emptyState = document.createElement('div');
                emptyState.className = 'inspector-empty';
                emptyState.innerHTML = `
                    <h4>${this.translate('quick_app_inspector_welcome')}</h4>
                    <p>${this.translate('quick_app_inspector_hint')}</p>
                    <div class="inspector-group">
                        <label>${this.translate('quick_app_metadata_name')}</label>
                        <input type="text" data-metadata="name" value="${this.metadata.name}">
                        <label>${this.translate('quick_app_metadata_description')}</label>
                        <textarea data-metadata="description">${this.metadata.description}</textarea>
                        <label>${this.translate('quick_app_metadata_icon')}</label>
                        <input type="text" data-metadata="icon" value="${this.metadata.icon}">
                        <label>${this.translate('quick_app_metadata_color')}</label>
                        <input type="color" data-metadata="accentColor" value="${this.metadata.accentColor}">
                    </div>
                `;
                this.inspectorContainer.appendChild(emptyState);
                this.bindMetadataInputs(emptyState);
                return;
            }

            const header = document.createElement('div');
            header.className = 'inspector-group';
            header.innerHTML = `
                <h4>${this.translate(node.definition.labelKey)}</h4>
                <p>${this.translate(node.definition.descriptionKey)}</p>
            `;
            this.inspectorContainer.appendChild(header);

            const configGroup = document.createElement('div');
            configGroup.className = 'inspector-group';
            const config = node.definition.defaultConfig || {};
            Object.keys(config).forEach(key => {
                const label = document.createElement('label');
                label.textContent = key;
                const input = document.createElement('input');
                input.type = 'text';
                input.value = node.config[key] ?? config[key] ?? '';
                input.addEventListener('input', () => {
                    node.config[key] = input.value;
                });
                configGroup.appendChild(label);
                configGroup.appendChild(input);
            });
            this.inspectorContainer.appendChild(configGroup);

            const portsGroup = document.createElement('div');
            portsGroup.className = 'inspector-group';
            portsGroup.innerHTML = `
                <h5>${this.translate('quick_app_inspector_ports')}</h5>
                <p>${this.translate('quick_app_inspector_ports_hint')}</p>
            `;
            this.inspectorContainer.appendChild(portsGroup);
        }

        bindMetadataInputs(container) {
            container.querySelectorAll('[data-metadata]').forEach(input => {
                const key = input.getAttribute('data-metadata');
                input.addEventListener('input', () => {
                    this.metadata[key] = input.value;
                });
            });
        }

        autoLayout() {
            const nodes = Array.from(this.nodes.values());
            nodes.sort((a, b) => a.position.y - b.position.y);
            let currentY = 120;
            nodes.forEach(node => {
                this.updateNodePosition(node.id, node.position.x, currentY, false);
                currentY += DEFAULT_NODE_HEIGHT + 60;
            });
            this.renderConnections();
        }

        renderTrigger() {
            if (!this.nodesLayer) return;
            let triggerEl = this.nodesLayer.querySelector('.builder-trigger');
            const triggerDef = this.moduleCatalog.triggers.find(trigger => trigger.id === this.trigger.module) || this.moduleCatalog.triggers[0];
            if (triggerDef && !this.trigger.module) {
                this.trigger.module = triggerDef.id;
                this.trigger.config = deepClone(triggerDef.defaultConfig || {});
            }
            if (!triggerEl) {
                triggerEl = document.createElement('div');
                triggerEl.className = 'builder-trigger';
                triggerEl.innerHTML = `
                    <div class="builder-trigger-header">
                        <div class="builder-trigger-title">${this.translate('quick_app_trigger_title')}</div>
                        <button type="button" class="builder-icon-button" data-trigger-action="cycle">${this.getFeatherIcon('shuffle')}</button>
                    </div>
                    <div class="builder-trigger-body"></div>
                `;
                this.nodesLayer.appendChild(triggerEl);
                triggerEl.querySelector('[data-trigger-action="cycle"]').addEventListener('click', () => this.cycleTriggerModule());
            }
            const body = triggerEl.querySelector('.builder-trigger-body');
            if (body) {
                const moduleDef = this.moduleCatalog.triggers.find(trigger => trigger.id === this.trigger.module);
                body.innerHTML = `
                    <strong>${moduleDef ? this.translate(moduleDef.labelKey) : 'Trigger'}</strong>
                    <p>${moduleDef ? this.translate(moduleDef.descriptionKey) : ''}</p>
                `;
            }
        }

        cycleTriggerModule() {
            const triggers = this.moduleCatalog.triggers || [];
            if (triggers.length === 0) return;
            const currentIndex = triggers.findIndex(trigger => trigger.id === this.trigger.module);
            const nextIndex = (currentIndex + 1) % triggers.length;
            this.trigger.module = triggers[nextIndex].id;
            this.trigger.config = deepClone(triggers[nextIndex].defaultConfig || {});
            this.renderTrigger();
            if (typeof this.onStatusChange === 'function') {
                this.onStatusChange(this.translate('quick_app_builder_trigger_swapped'));
            }
        }

        refresh() {
            this.nodes.forEach(node => this.renderNode(node));
            this.renderConnections();
            this.renderTrigger();
        }

        loadBlueprint(blueprint) {
            this.reset();
            if (!blueprint || !blueprint.workflow) return;
            const workflow = blueprint.workflow;
            if (workflow.trigger) {
                this.trigger = deepClone(workflow.trigger);
            }
            (workflow.nodes || []).forEach(node => {
                const moduleDef = this.findModuleDefinition(node.module);
                if (!moduleDef) return;
                const nodeId = this.createNode(moduleDef, node.position || { x: 200, y: 200 });
                const storedNode = this.nodes.get(nodeId);
                storedNode.config = deepClone(node.config || moduleDef.defaultConfig || {});
                this.updateNodePosition(nodeId, storedNode.position.x, storedNode.position.y, false);
                this.renderNode(storedNode);
            });
            this.connections = (workflow.connections || []).map(connection => ({
                source: deepClone(connection.source),
                target: deepClone(connection.target)
            }));
            this.renderConnections();
            this.renderTrigger();
            this.metadata.name = blueprint.name || this.translate(blueprint.nameKey);
            this.metadata.description = this.translate(blueprint.descriptionKey);
            this.metadata.icon = blueprint.icon || 'zap';
            this.metadata.accentColor = blueprint.accentColor || '#6366f1';
        }

        reset() {
            this.nodes.clear();
            this.connections = [];
            this.selectedNodeId = null;
            this.nodesLayer.querySelectorAll('.builder-node').forEach(node => node.remove());
            this.renderConnections();
            this.metadata = {
                name: '',
                description: '',
                icon: 'cpu',
                accentColor: '#6366f1'
            };
        }

        exportWorkflow() {
            const nodes = Array.from(this.nodes.values()).map(node => ({
                id: node.id,
                module: node.moduleId,
                position: deepClone(node.position),
                config: deepClone(node.config)
            }));
            return {
                workflow: {
                    trigger: deepClone(this.trigger),
                    nodes,
                    connections: this.connections.map(connection => ({
                        source: deepClone(connection.source),
                        target: deepClone(connection.target)
                    }))
                },
                metadata: deepClone(this.metadata)
            };
        }

        getMetadata() {
            return deepClone(this.metadata);
        }

        findModuleDefinition(moduleId) {
            const categories = ['triggers', 'actions', 'logic', 'integrations'];
            for (const category of categories) {
                const list = this.moduleCatalog[category] || [];
                const definition = list.find(item => item.id === moduleId);
                if (definition) return definition;
            }
            return null;
        }

        getFeatherIcon(name) {
            if (global.feather && global.feather.icons && global.feather.icons[name]) {
                return global.feather.icons[name].toSvg();
            }
            return '<svg width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" fill="none"><circle cx="12" cy="12" r="10" /></svg>';
        }

        updateStatus(message) {
            if (typeof this.onStatusChange === 'function') {
                this.onStatusChange(message);
            }
        }
    }

    global.WorkflowDesigner = WorkflowDesigner;
})(window);
