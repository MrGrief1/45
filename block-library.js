const { ipcRenderer } = require('electron');

const state = {
    modules: [],
    filtered: [],
    selectedId: null,
    searchTerm: '',
    category: 'all'
};

const elements = {
    search: document.getElementById('library-search'),
    categoryFilter: document.getElementById('library-category-filter'),
    moduleList: document.getElementById('library-module-list'),
    detailPlaceholder: document.getElementById('library-detail-placeholder'),
    detailContent: document.getElementById('library-detail-content'),
    detailTitle: document.getElementById('library-detail-title'),
    detailSubtitle: document.getElementById('library-detail-subtitle'),
    detailIcon: document.getElementById('library-detail-icon'),
    detailTags: document.getElementById('library-detail-tags'),
    detailFields: document.getElementById('library-detail-fields'),
    addButton: document.getElementById('library-add-block')
};

function normalizeText(value) {
    return String(value || '').toLowerCase();
}

function formatFieldType(field) {
    if (!field) return '';
    const type = field.type || 'text';
    switch (type) {
        case 'textarea':
            return 'Multiline text';
        case 'select':
            return 'Dropdown';
        case 'number':
            return 'Number';
        case 'checkbox':
            return 'Toggle';
        default:
            return type.charAt(0).toUpperCase() + type.slice(1);
    }
}

function applyFilters() {
    const term = normalizeText(state.searchTerm);
    const category = state.category;
    state.filtered = state.modules.filter(module => {
        const matchesCategory = category === 'all' || module.category === category;
        if (!matchesCategory) return false;
        if (!term) return true;
        const parts = [module.name, module.description, ...(module.tags || [])].map(normalizeText).join(' ');
        return parts.includes(term);
    });
    renderModuleList();
    if (state.filtered.length === 0) {
        renderDetail(null);
    } else if (!state.filtered.some(mod => mod.id === state.selectedId)) {
        renderDetail(null);
    }
}

function renderCategoryOptions() {
    if (!elements.categoryFilter) return;
    const existing = new Set(['all']);
    state.modules.forEach(module => existing.add(module.category));
    if (!existing.has(state.category)) {
        state.category = 'all';
    }
    const current = state.category;
    elements.categoryFilter.innerHTML = '';
    existing.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat === 'all'
            ? 'All categories'
            : cat.charAt(0).toUpperCase() + cat.slice(1);
        if (cat === current) option.selected = true;
        elements.categoryFilter.appendChild(option);
    });
}

function renderModuleList() {
    if (!elements.moduleList) return;
    elements.moduleList.innerHTML = '';
    if (state.filtered.length === 0) {
        const empty = document.createElement('li');
        empty.className = 'library-module-empty';
        empty.textContent = 'No blocks found. Adjust your filters.';
        elements.moduleList.appendChild(empty);
        return;
    }
    state.filtered.forEach(module => {
        const item = document.createElement('li');
        item.className = 'library-module-item';
        if (module.id === state.selectedId) {
            item.classList.add('active');
        }
        item.setAttribute('data-module-id', module.id);

        const title = document.createElement('strong');
        title.textContent = module.name;
        item.appendChild(title);

        const description = document.createElement('span');
        description.className = 'library-module-description';
        description.textContent = module.description || '';
        item.appendChild(description);

        const meta = document.createElement('span');
        meta.className = 'library-module-meta';
        const categoryLabel = module.category ? module.category.charAt(0).toUpperCase() + module.category.slice(1) : 'Block';
        meta.textContent = categoryLabel;
        item.appendChild(meta);

        item.addEventListener('click', () => {
            state.selectedId = module.id;
            renderModuleList();
            renderDetail(module);
        });

        item.addEventListener('dblclick', () => {
            handleAddBlock(module);
        });

        elements.moduleList.appendChild(item);
    });
}

function renderDetail(module) {
    if (!module) {
        state.selectedId = null;
        elements.detailContent.hidden = true;
        elements.detailPlaceholder.hidden = false;
        return;
    }
    elements.detailPlaceholder.hidden = true;
    elements.detailContent.hidden = false;

    elements.detailTitle.textContent = module.name;
    elements.detailSubtitle.textContent = module.description || '';

    const iconName = module.icon || 'zap';
    elements.detailIcon.textContent = iconName.slice(0, 2).toUpperCase();
    elements.detailIcon.style.background = module.accent ? module.accent + '22' : 'rgba(99,102,241,0.18)';
    elements.detailIcon.style.color = module.accent || '#6366f1';

    elements.detailTags.innerHTML = '';
    if (Array.isArray(module.tags) && module.tags.length) {
        module.tags.forEach(tag => {
            const span = document.createElement('span');
            span.textContent = tag;
            elements.detailTags.appendChild(span);
        });
    }

    elements.detailFields.innerHTML = '';
    if (!module.form || module.form.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'No configuration required.';
        elements.detailFields.appendChild(li);
    } else {
        module.form.forEach(field => {
            const li = document.createElement('li');
            const label = document.createElement('strong');
            label.textContent = field.label || field.key;
            const meta = document.createElement('div');
            meta.textContent = formatFieldType(field);
            if (field.placeholder) {
                const placeholder = document.createElement('div');
                placeholder.textContent = `Placeholder: ${field.placeholder}`;
                placeholder.style.opacity = '0.7';
                placeholder.style.marginTop = '4px';
                meta.appendChild(placeholder);
            }
            if (Array.isArray(field.options) && field.options.length) {
                const optionsLine = document.createElement('div');
                optionsLine.textContent = `Options: ${field.options.map(opt => opt.label || opt.value).join(', ')}`;
                optionsLine.style.opacity = '0.7';
                optionsLine.style.marginTop = '4px';
                meta.appendChild(optionsLine);
            }
            li.appendChild(label);
            li.appendChild(meta);
            elements.detailFields.appendChild(li);
        });
    }

    elements.addButton.disabled = false;
    elements.addButton.textContent = 'Add to builder';
    elements.addButton.onclick = () => handleAddBlock(module);
}

function handleAddBlock(module) {
    if (!module) return;
    elements.addButton.disabled = true;
    elements.addButton.textContent = 'Adding…';
    ipcRenderer.send('block-library-select', module.id);
}

function initializeEvents() {
    if (elements.search) {
        elements.search.addEventListener('input', event => {
            state.searchTerm = event.target.value || '';
            applyFilters();
        });
    }
    if (elements.categoryFilter) {
        elements.categoryFilter.addEventListener('change', event => {
            state.category = event.target.value || 'all';
            applyFilters();
        });
    }
}

ipcRenderer.on('block-library-data', (_event, modules) => {
    state.modules = Array.isArray(modules) ? modules : [];
    renderCategoryOptions();
    applyFilters();
});

initializeEvents();
