'use strict';

const WorkflowBlocks = [
    {
        id: 'trigger-keyword',
        name: 'Keyword trigger',
        type: 'trigger',
        description: 'Start the workflow when a specific keyword is typed.',
        inputs: 0,
        outputs: 1,
        color: '#86b7ff'
    },
    {
        id: 'trigger-shortcut',
        name: 'Shortcut trigger',
        type: 'trigger',
        description: 'Use a keyboard shortcut to run the workflow instantly.',
        inputs: 0,
        outputs: 1,
        color: '#9c88ff'
    },
    {
        id: 'action-open-app',
        name: 'Open application',
        type: 'action',
        description: 'Launch an application or script.',
        inputs: 1,
        outputs: 1,
        color: '#ff9f43'
    },
    {
        id: 'action-open-url',
        name: 'Open URL',
        type: 'action',
        description: 'Navigate to a website in your default browser.',
        inputs: 1,
        outputs: 1,
        color: '#feca57'
    },
    {
        id: 'action-clipboard',
        name: 'Use clipboard',
        type: 'action',
        description: 'Read or update clipboard content.',
        inputs: 1,
        outputs: 1,
        color: '#54a0ff'
    },
    {
        id: 'transform-format-text',
        name: 'Format text',
        type: 'transform',
        description: 'Apply templates, casing or replacements to text.',
        inputs: 1,
        outputs: 1,
        color: '#10ac84'
    },
    {
        id: 'transform-ask-ai',
        name: 'Ask AI',
        type: 'transform',
        description: 'Send the query to an AI model and use the response.',
        inputs: 1,
        outputs: 1,
        color: '#2e86de'
    },
    {
        id: 'action-send-webhook',
        name: 'Send webhook',
        type: 'action',
        description: 'POST data to a webhook endpoint.',
        inputs: 1,
        outputs: 1,
        color: '#ff6b6b'
    },
    {
        id: 'transform-delay',
        name: 'Delay',
        type: 'transform',
        description: 'Pause the workflow for a specified time.',
        inputs: 1,
        outputs: 1,
        color: '#576574'
    },
    {
        id: 'output-notification',
        name: 'Show notification',
        type: 'output',
        description: 'Display a desktop notification with the result.',
        inputs: 1,
        outputs: 0,
        color: '#ff9f43'
    },
    {
        id: 'output-copy-result',
        name: 'Copy result',
        type: 'output',
        description: 'Copy the final value to clipboard automatically.',
        inputs: 1,
        outputs: 0,
        color: '#1dd1a1'
    },
    {
        id: 'output-open-panel',
        name: 'Open panel',
        type: 'output',
        description: 'Render the result inside the side panel.',
        inputs: 1,
        outputs: 0,
        color: '#48dbfb'
    }
];

function uid(prefix = 'node') {
    return `${prefix}-${Math.random().toString(16).slice(2)}-${Date.now().toString(16)}`;
}

class WorkflowStudio {
    constructor() {
        this.overlay = null;
        this.window = null;
        this.canvas = null;
        this.canvasConnections = null;
        this.paletteContainer = null;
        this.nameInput = null;
        this.iconInput = null;
        this.descriptionInput = null;
        this.searchInput = null;
        this.previewContainer = null;
        this.runStatus = null;
        this.saveButton = null;
        this.closeButton = null;
        this.previewButton = null;
        this.runButton = null;
        this.blockCountBadge = null;
        this.nodes = [];
        this.connections = [];
        this.activeModule = null;
        this.dragInfo = null;
        this.pendingConnection = null;
        this.onSave = null;
        this.blockFilter = '';
    }

    init(options = {}) {
        this.overlay = options.overlay;
        this.window = options.window;
        this.canvas = options.canvas;
        this.canvasConnections = options.canvasConnections;
        this.paletteContainer = options.paletteContainer;
        this.nameInput = options.nameInput;
        this.iconInput = options.iconInput;
        this.descriptionInput = options.descriptionInput;
        this.searchInput = options.searchInput;
        this.previewContainer = options.previewContainer;
        this.runStatus = options.runStatus;
        this.saveButton = options.saveButton;
        this.closeButton = options.closeButton;
        this.previewButton = options.previewButton;
        this.runButton = options.runButton;
        this.blockCountBadge = options.blockCountBadge || null;

        if (!this.overlay) {
            throw new Error('WorkflowStudio overlay is required');
        }

        this.bindEvents();
        this.renderPalette();
        this.updateCanvasState();
    }

    bindEvents() {
        if (this.closeButton) {
            this.closeButton.addEventListener('click', () => this.close());
        }

        if (this.overlay) {
            this.overlay.addEventListener('click', (event) => {
                if (event.target === this.overlay) {
                    this.close();
                }
            });
        }

        if (this.searchInput) {
            this.searchInput.addEventListener('input', () => {
                this.blockFilter = this.searchInput.value.trim().toLowerCase();
                this.renderPalette();
            });
        }

        if (this.saveButton) {
            this.saveButton.addEventListener('click', () => this.saveModule());
        }

        if (this.previewButton) {
            this.previewButton.addEventListener('click', () => this.renderPreview());
        }

        if (this.runButton) {
            this.runButton.addEventListener('click', () => this.simulateRun());
        }

        if (this.canvas) {
            this.canvas.addEventListener('dblclick', (event) => {
                const rect = this.canvas.getBoundingClientRect();
                const position = {
                    x: event.clientX - rect.left,
                    y: event.clientY - rect.top
                };
                const block = WorkflowBlocks.find(item => item.type === 'action');
                if (block) {
                    this.addNode(block, position);
                }
            });
        }
    }

    open(moduleData = null, onSave = null) {
        this.onSave = typeof onSave === 'function' ? onSave : null;
        this.activeModule = moduleData;
        this.nodes = Array.isArray(moduleData?.nodes) ? JSON.parse(JSON.stringify(moduleData.nodes)) : [];
        this.connections = Array.isArray(moduleData?.connections) ? JSON.parse(JSON.stringify(moduleData.connections)) : [];

        if (this.nameInput) {
            this.nameInput.value = moduleData?.name || '';
        }
        if (this.iconInput) {
            this.iconInput.value = moduleData?.icon || '';
        }
        if (this.descriptionInput) {
            this.descriptionInput.value = moduleData?.description || '';
        }

        this.updateCanvasState();
        this.renderNodes();
        this.renderConnections();
        this.renderPreview();

        if (this.overlay) {
            this.overlay.classList.add('visible');
        }
    }

    close() {
        if (this.overlay) {
            this.overlay.classList.remove('visible');
        }
        this.activeModule = null;
        this.onSave = null;
        this.pendingConnection = null;
    }

    renderPalette() {
        if (!this.paletteContainer) return;
        this.paletteContainer.innerHTML = '';

        const filteredBlocks = WorkflowBlocks.filter(block => {
            if (!this.blockFilter) return true;
            return block.name.toLowerCase().includes(this.blockFilter) ||
                block.description.toLowerCase().includes(this.blockFilter);
        });

        if (filteredBlocks.length === 0) {
            this.paletteContainer.classList.add('is-empty');
            return;
        }

        this.paletteContainer.classList.remove('is-empty');

        filteredBlocks.forEach(block => {
            const item = document.createElement('div');
            item.className = 'workflow-block';
            item.dataset.blockId = block.id;
            item.innerHTML = `
                <div class="workflow-block-title">${block.name}</div>
                <div class="workflow-block-description">${block.description}</div>
            `;
            item.addEventListener('click', () => {
                const position = this.canvas ? {
                    x: this.canvas.clientWidth / 2 + (Math.random() * 40 - 20),
                    y: this.canvas.clientHeight / 2 + (Math.random() * 40 - 20)
                } : { x: 200, y: 120 };
                this.addNode(block, position);
            });
            this.paletteContainer.appendChild(item);
        });
    }

    addNode(block, position = { x: 200, y: 140 }) {
        if (!block) return;
        const node = {
            id: uid('node'),
            blockId: block.id,
            type: block.type,
            name: block.name,
            description: block.description,
            x: position.x,
            y: position.y,
            meta: {
                color: block.color || '#4c6ef5'
            }
        };
        this.nodes.push(node);
        this.renderNodes();
        this.updateCanvasState();
    }

    removeNode(nodeId) {
        this.nodes = this.nodes.filter(node => node.id !== nodeId);
        this.connections = this.connections.filter(conn => conn.from !== nodeId && conn.to !== nodeId);
        this.renderNodes();
        this.renderConnections();
        this.updateCanvasState();
    }

    renderNodes() {
        if (!this.canvas) return;
        this.canvas.innerHTML = '';

        this.nodes.forEach(node => {
            const element = document.createElement('div');
            element.className = 'workflow-node';
            element.style.left = `${node.x}px`;
            element.style.top = `${node.y}px`;
            element.dataset.nodeId = node.id;
            element.innerHTML = `
                <div class="workflow-node-header">
                    <div class="workflow-node-title">${node.name}</div>
                    <div class="workflow-node-type">${node.type}</div>
                </div>
                <div class="workflow-node-body">${node.description}</div>
                <div class="workflow-node-ports">
                    <span class="workflow-node-port incoming" data-port="in"></span>
                    <span class="workflow-node-port outgoing" data-port="out"></span>
                </div>
                <button type="button" class="workflow-node-delete">Delete</button>
            `;

            const deleteButton = element.querySelector('.workflow-node-delete');
            deleteButton.addEventListener('click', (event) => {
                event.stopPropagation();
                this.removeNode(node.id);
            });

            element.addEventListener('pointerdown', (event) => this.startDrag(event, node));

            const incomingPort = element.querySelector('.workflow-node-port.incoming');
            const outgoingPort = element.querySelector('.workflow-node-port.outgoing');

            if (incomingPort) {
                incomingPort.addEventListener('click', (event) => {
                    event.stopPropagation();
                    this.handlePortClick(node.id, 'in');
                });
            }

            if (outgoingPort) {
                outgoingPort.addEventListener('click', (event) => {
                    event.stopPropagation();
                    this.handlePortClick(node.id, 'out');
                });
            }

            this.canvas.appendChild(element);
        });

        this.renderConnections();
    }

    startDrag(event, node) {
        event.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        this.dragInfo = {
            node,
            offsetX: event.clientX - rect.left - node.x,
            offsetY: event.clientY - rect.top - node.y
        };
        window.addEventListener('pointermove', this.handleDragMove);
        window.addEventListener('pointerup', this.handleDragEnd);
    }

    handleDragMove = (event) => {
        if (!this.dragInfo || !this.canvas) return;
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left - this.dragInfo.offsetX;
        const y = event.clientY - rect.top - this.dragInfo.offsetY;
        this.dragInfo.node.x = Math.max(20, Math.min(this.canvas.clientWidth - 120, x));
        this.dragInfo.node.y = Math.max(20, Math.min(this.canvas.clientHeight - 80, y));
        this.renderNodes();
    };

    handleDragEnd = () => {
        window.removeEventListener('pointermove', this.handleDragMove);
        window.removeEventListener('pointerup', this.handleDragEnd);
        this.dragInfo = null;
    };

    handlePortClick(nodeId, portType) {
        if (portType === 'out') {
            this.pendingConnection = { from: nodeId };
            return;
        }

        if (portType === 'in' && this.pendingConnection) {
            if (this.pendingConnection.from === nodeId) {
                this.pendingConnection = null;
                return;
            }
            const exists = this.connections.some(conn => conn.from === this.pendingConnection.from && conn.to === nodeId);
            if (!exists) {
                this.connections.push({ id: uid('edge'), from: this.pendingConnection.from, to: nodeId });
                this.renderConnections();
                this.pendingConnection = null;
            }
        }
    }

    renderConnections() {
        if (!this.canvasConnections) return;
        this.canvasConnections.innerHTML = '';
        const rect = this.canvas ? this.canvas.getBoundingClientRect() : { left: 0, top: 0 };

        this.connections.forEach(connection => {
            const fromNode = this.nodes.find(node => node.id === connection.from);
            const toNode = this.nodes.find(node => node.id === connection.to);
            if (!fromNode || !toNode) return;

            const startX = fromNode.x + 140;
            const startY = fromNode.y + 40;
            const endX = toNode.x;
            const endY = toNode.y + 40;

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const curveOffset = Math.max(60, Math.abs(endX - startX) / 2);
            const d = `M ${startX} ${startY} C ${startX + curveOffset} ${startY}, ${endX - curveOffset} ${endY}, ${endX} ${endY}`;
            path.setAttribute('d', d);
            path.classList.add('workflow-connection-path');
            this.canvasConnections.appendChild(path);
        });
    }

    renderPreview() {
        if (!this.previewContainer) return;
        this.previewContainer.innerHTML = '';
        if (this.nodes.length === 0) {
            this.previewContainer.dataset.i18nEmpty = 'workflow_studio_preview_empty';
            this.previewContainer.textContent = 'Drag blocks onto the canvas to see a preview here.';
            return;
        }

        const orderedNodes = [...this.nodes];
        const list = document.createElement('ol');
        list.className = 'workflow-preview-list';
        orderedNodes.forEach(node => {
            const item = document.createElement('li');
            item.innerHTML = `<strong>${node.name}</strong> <span>${node.description}</span>`;
            list.appendChild(item);
        });
        this.previewContainer.appendChild(list);
    }

    simulateRun() {
        if (!this.runStatus) return;
        const timestamp = new Date().toLocaleTimeString();
        if (this.nodes.length === 0) {
            this.runStatus.textContent = `Simulation failed (${timestamp}): no nodes connected.`;
            return;
        }
        this.runStatus.textContent = `Simulated ${this.nodes.length} block(s) at ${timestamp}.`;
    }

    updateCanvasState() {
        if (!this.canvas) return;
        if (this.nodes.length > 0) {
            this.canvas.classList.add('has-nodes');
        } else {
            this.canvas.classList.remove('has-nodes');
        }
    }

    collectModuleData() {
        return {
            id: this.activeModule?.id || uid('custom'),
            name: this.nameInput?.value.trim() || 'Custom module',
            icon: this.iconInput?.value.trim() || 'zap',
            description: this.descriptionInput?.value.trim() || '',
            nodes: this.nodes.map(node => ({
                id: node.id,
                blockId: node.blockId,
                type: node.type,
                name: node.name,
                description: node.description,
                x: node.x,
                y: node.y,
                meta: node.meta || {}
            })),
            connections: this.connections.map(connection => ({
                id: connection.id,
                from: connection.from,
                to: connection.to
            }))
        };
    }

    saveModule() {
        const name = this.nameInput?.value.trim();
        if (!name) {
            this.nameInput?.classList.add('error');
            setTimeout(() => this.nameInput?.classList.remove('error'), 600);
            return;
        }
        const moduleData = this.collectModuleData();
        if (typeof this.onSave === 'function') {
            this.onSave(moduleData);
        }
        this.close();
    }
}

module.exports = {
    WorkflowStudio,
    WorkflowBlocks
};
