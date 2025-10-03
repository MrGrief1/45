// aux-window-logic.js
const { ipcRenderer } = require('electron');

// === Глобальное Состояние ===
let AppState = {
    translations: {},
    windowType: '',
    isInitialized: false,
    iconCache: new Map(),
    systemTheme: 'light',
    appFolders: [],
    currentFolderId: 'pinned',
};

// === Инициализация и IPC обработчики ===
ipcRenderer.on('settings-updated', (event, data) => {
    const settings = data.settings;
    AppState.translations = data.translations;
    AppState.systemTheme = data.systemTheme;
    
    console.log('[Apps] Settings updated received, re-rendering grid...');
    
    if (AppState.windowType === 'apps') {
        AppState.appFolders = settings.appFolders || [];
        renderAppGrid();
        
        // ФИНАЛЬНОЕ ИСПРАВЛЕНИЕ: Устанавливаем флаг с надежной задержкой ПОСЛЕ перерисовки,
        // чтобы дать интерфейсу и фокусу время на полную стабилизацию.
        console.log('[Apps] Re-render complete. Starting timer to release close prevention.');
        setTimeout(() => {
            ipcRenderer.send('set-prevent-close', false);
        }, 500); 
    }

    applyAppearanceSettings(settings);
    updateTitle();
    if (!AppState.isInitialized) {
        setTimeout(() => {
            const container = document.getElementById('aux-container');
            if (container) {
                container.classList.add('visible');
            }
        }, 50);
        AppState.isInitialized = true;
    }
});

ipcRenderer.on('update-data', (event, data) => {
    if (AppState.windowType === 'apps') {
        AppState.appFolders = data;
        renderAppGrid();
    } else {
    renderList(data);
    }
});

ipcRenderer.on('file-icon-response', (event, { path, dataUrl }) => {
    AppState.iconCache.set(path, dataUrl || null);
    console.log(`[Apps] Received icon for ${path}:`, dataUrl ? 'Success' : 'Failed');
    
    // Обновляем все изображения с данным путем
    document.querySelectorAll(`img[data-path="${path}"]`).forEach(imgElement => {
        if (dataUrl && dataUrl.startsWith('data:image')) {
            imgElement.src = dataUrl;
            console.log(`[Apps] Updated icon for ${path}`);
        } else {
            // Если иконка не получена, оставляем fallback
            console.log(`[Apps] No valid icon received for ${path}, keeping fallback`);
        }
    });
});


function initialize(type) {
    AppState.windowType = type;
    if (type === 'apps') {
        setupAppsEventListeners();
        setupGlobalDropZone(); // НОВОЕ: Глобальная поддержка drag & drop
    }
}
module.exports = { initialize };

// === Логика для Окна "Приложения" ===
function setupAppsEventListeners() {
    document.getElementById('show-add-folder-button')?.addEventListener('click', () => toggleFolderView(true));
    document.getElementById('cancel-add-folder-button')?.addEventListener('click', () => toggleFolderView(false));
    document.getElementById('confirm-add-folder-button')?.addEventListener('click', createNewFolder);
    
    // ПЕРЕРАБОТАНО: Централизованная обработка Drag and Drop
    setupDragAndDrop(); 
}

function toggleFolderView(showInput) {
    document.getElementById('add-folder-view').classList.toggle('hidden', showInput);
    document.getElementById('create-folder-view').classList.toggle('hidden', !showInput);
    if (showInput) {
        document.getElementById('new-folder-name').focus();
    }
}

function createNewFolder() {
    // Шаг 1: Устанавливаем флаг
    ipcRenderer.send('set-prevent-close', true);
    const input = document.getElementById('new-folder-name');
    const folderName = input.value.trim();
    if (folderName) {
        const newFolder = {
            id: `folder-${Date.now()}`,
            name: folderName,
            apps: []
        };
        const updatedFolders = [...AppState.appFolders, newFolder];
        // Шаг 2: Отправляем обновление. Остальное сделает обработчик 'settings-updated'.
        ipcRenderer.send('update-setting', 'appFolders', updatedFolders);
        input.value = '';
        toggleFolderView(false);
    } else {
        // Если ничего не произошло, сразу снимаем флаг
        ipcRenderer.send('set-prevent-close', false);
    }
}

function renderAppGrid() {
    const container = document.getElementById('apps-grid-container');
    if (!container) return;
    container.innerHTML = '';

    const currentFolder = AppState.appFolders.find(f => f.id === AppState.currentFolderId);
    updateTitle();

    if (AppState.currentFolderId === 'pinned') {
        // КОРНЕВОЙ ВИД: Показываем закрепленные приложения и папки
        const pinnedFolder = AppState.appFolders.find(f => f.id === 'pinned');
        
        // Сначала папки
        AppState.appFolders.forEach(folder => {
            if (folder.id === 'pinned') return;
            const item = createGridItem(folder.name, 'folder', () => {
                AppState.currentFolderId = folder.id;
                renderAppGrid();
            });
            // НОВОЕ: Добавляем ID папки для drag & drop
            item.setAttribute('data-folder-id', folder.id);
            // НОВОЕ: Контекстное меню для папок
            item.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                e.stopPropagation();
                ipcRenderer.send('show-folder-context-menu', folder.id);
            });
            container.appendChild(item);
        });

        // Затем закрепленные приложения
        pinnedFolder?.apps.forEach(app => {
            const itemName = app.name.replace(/\.(lnk|exe)$/i, '');
            const item = createGridItem(itemName, 'cpu', () => ipcRenderer.send('open-item', app.path), app.path);
            // НОВОЕ: Контекстное меню для приложений
            item.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                e.stopPropagation();
                ipcRenderer.send('show-app-context-menu', { ...app, sourceFolderId: 'pinned' });
            });
            container.appendChild(item);
            console.log(`[Apps] Added pinned app: ${itemName} (${app.path})`);
        });

    } else if (currentFolder) {
        // ВИД ВНУТРИ ПАПКИ: Показываем приложения и кнопку "Назад"
        currentFolder.apps.forEach(app => {
            const itemName = app.name.replace(/\.(lnk|exe)$/i, '');
            const item = createGridItem(itemName, 'cpu', () => ipcRenderer.send('open-item', app.path), app.path);
            // НОВОЕ: Контекстное меню для приложений в папках
            item.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                e.stopPropagation();
                ipcRenderer.send('show-app-context-menu', { ...app, sourceFolderId: AppState.currentFolderId });
            });
            container.appendChild(item);
        });
        
        const backButton = createGridItem(t('folder_back'), 'arrow-left', () => {
            AppState.currentFolderId = 'pinned';
            renderAppGrid();
        });
        container.prepend(backButton);
    }
    
    loadRealIcons();
}

function createGridItem(name, iconName, onClick, path = null) {
    const item = document.createElement('div');
    item.className = 'grid-item';
    item.addEventListener('click', onClick);

    // Упрощаем: только dragstart для приложений
    if (path) {
        item.draggable = true;
        item.setAttribute('data-app-path', path);
        item.setAttribute('data-app-name', name);
        
        item.addEventListener('dragstart', (e) => {
            ipcRenderer.send('set-prevent-close', true); // << НОВОЕ
            // Устанавливаем данные для перетаскивания
            e.dataTransfer.setData('text/plain', JSON.stringify({
                name: name,
                path: path,
                type: 'app',
                source: AppState.currentFolderId 
            }));
            // Добавляем класс для стилизации перетаскиваемого элемента
            setTimeout(() => item.classList.add('dragging'), 0);
        });
        
        item.addEventListener('dragend', () => {
            item.classList.remove('dragging');
            ipcRenderer.send('set-prevent-close', false); // << НОВОЕ
        });
    }

    // Добавляем ID папки для идентификации
    if (iconName === 'folder') {
        // ID папки берется из AppState при рендеринге, здесь нужен атрибут для DOM
        // Этот атрибут будет установлен в renderAppGrid
    }

    const icon = document.createElement(path ? 'img' : 'div');
    icon.className = 'grid-item-icon';
    if (path) {
        const cachedIcon = AppState.iconCache.get(path);
        if (cachedIcon && cachedIcon !== 'fetching' && cachedIcon.startsWith('data:image')) {
            icon.src = cachedIcon;
        } else {
            icon.src = getFallbackIconDataUrl('cpu', 48);
            if (!AppState.iconCache.has(path)) {
                AppState.iconCache.set(path, 'fetching');
                ipcRenderer.send('request-file-icon', path);
            }
        }
        icon.setAttribute('data-path', path);
        icon.onerror = () => { icon.src = getFallbackIconDataUrl('cpu', 48); };
    } else {
        icon.innerHTML = feather.icons[iconName] ? feather.icons[iconName].toSvg() : '';
    }
    
    const nameEl = document.createElement('div');
    nameEl.className = 'grid-item-name';
    nameEl.textContent = name;
    
    item.appendChild(icon);
    item.appendChild(nameEl);
    return item;
}

// === ВОССТАНОВЛЕННАЯ ЛОГИКА ДЛЯ ДРУГИХ ОКОН ===
function renderList(data) {
    const list = document.getElementById('data-list');
    if (!list) return;
    list.innerHTML = '';

    if (!data || data.length === 0) {
        const li = document.createElement('li');
        li.textContent = t('list_empty');
        list.appendChild(li);
        return;
    }

    const fragment = document.createDocumentFragment();
    data.forEach(item => {
        const li = document.createElement('li');
        const params = determineItemParams(item);
        
        const iconElement = generateListIconElement(params, item.path);
        if (iconElement) li.appendChild(iconElement);
        
        const textSpan = document.createElement('span');
        textSpan.className = 'list-text';
        textSpan.textContent = params.displayText;
        li.appendChild(textSpan);

        li.addEventListener('click', () => params.onClickAction());
        fragment.appendChild(li);
    });
    list.appendChild(fragment);
    loadRealIcons();
}

function determineItemParams(item) {
    let params = { displayText: '', iconName: '', needsRealIcon: false, onClickAction: () => {} };
    switch(AppState.windowType) {
        case 'clipboard':
            params.displayText = item.content;
            params.iconName = 'copy';
            params.onClickAction = () => ipcRenderer.send('copy-to-clipboard', item.content);
            break;
        case 'files':
            params.displayText = item.name;
            params.iconName = item.isApp ? 'cpu' : (item.type === 'directory' ? 'folder' : 'file-text');
            params.needsRealIcon = item.isApp === true;
            params.onClickAction = () => ipcRenderer.send('open-item', item.path);
            break;
        case 'commands':
             params.displayText = item.name;
             params.iconName = 'command';
             params.onClickAction = () => ipcRenderer.send('execute-command', item.id);
            break;
    }
    return params;
}

function generateListIconElement(params, path) {
    if (!window.feather) return null;
    if (params.needsRealIcon && path) {
        const img = document.createElement('img');
        img.className = 'list-icon';
        img.setAttribute('data-path', path);
        img.src = getIconSrc(path, params.iconName);
        return img;
    } else if (params.iconName && window.feather.icons[params.iconName]) {
        const svgString = window.feather.icons[params.iconName].toSvg({ class: 'list-icon' });
        const parser = new DOMParser();
        return parser.parseFromString(svgString, "image/svg+xml").documentElement;
    }
    return null;
}

// === Утилиты ===
function t(key) {
    return AppState.translations[key] || key;
}

function updateTitle() {
    const titleElement = document.getElementById('window-title');
    if (!titleElement) return;

    if (AppState.windowType === 'apps') {
        if (AppState.currentFolderId === 'pinned') {
            titleElement.textContent = t('title_apps');
        } else {
            const currentFolder = AppState.appFolders.find(f => f.id === AppState.currentFolderId);
            titleElement.textContent = currentFolder ? currentFolder.name : t('title_apps');
        }
    } else {
        titleElement.textContent = t(`title_${AppState.windowType}`);
    }
}

function getIconSrc(path, fallbackIcon) {
    const cached = AppState.iconCache.get(path);
    return (cached && cached.startsWith('data:image')) ? cached : getFallbackIconDataUrl(fallbackIcon, AppState.windowType === 'apps' ? 48 : 24);
}

function getFallbackIconDataUrl(iconName, size = 24) {
    return (window.feather && feather.icons[iconName]) ? `data:image/svg+xml;base64,${btoa(feather.icons[iconName].toSvg({width: size, height: size}))}` : '';
}

function loadRealIcons() {
    console.log('[Apps] Loading real icons for apps...');
    document.querySelectorAll('img[data-path]').forEach(img => {
        const path = img.getAttribute('data-path');
        if (path) {
            console.log(`[Apps] Processing icon for: ${path}`);
            if (!AppState.iconCache.has(path) || AppState.iconCache.get(path) === 'fetching') {
                AppState.iconCache.set(path, 'fetching');
                console.log(`[Apps] Requesting icon for: ${path}`);
                ipcRenderer.send('request-file-icon', path);
            } else {
                const cachedIcon = AppState.iconCache.get(path);
                if (cachedIcon && cachedIcon.startsWith('data:image')) {
                    img.src = cachedIcon;
                    console.log(`[Apps] Using cached icon for: ${path}`);
                }
            }
        }
    });
}

function applyAppearanceSettings(settings) {
    const bodyClasses = [];

    if (settings.theme === 'auto') {
        bodyClasses.push(AppState.systemTheme + '-theme');
    } else if (settings.theme) {
        bodyClasses.push(settings.theme + '-theme');
    }

    if (settings.animations) {
        bodyClasses.push(`anim-${settings.animationStyle || 'fade'}`);
    } else {
        bodyClasses.push('no-animations');
    }
    
    document.body.className = bodyClasses.join(' ');

    const blurStrength = settings.blurStrength || 40;
    const opacity = (settings.opacity || 85) / 100;
    document.documentElement.style.setProperty('--dynamic-blur', `blur(${blurStrength}px)`);
    document.documentElement.style.setProperty('--dynamic-opacity', opacity);
}

// ИСПРАВЛЕНИЕ: Обработка перетаскивания приложений в папки
function handleAppDropOnFolder(appData, targetFolderId) {
    console.log('[Apps] handleAppDropOnFolder called:', appData, targetFolderId);
    
    if (!targetFolderId || !appData.path) {
        console.error('[Apps] Invalid data for drop:', { targetFolderId, appData });
        return;
    }
    
    const targetFolder = AppState.appFolders.find(f => f.id === targetFolderId);
    if (!targetFolder) {
        console.error('[Apps] Target folder not found:', targetFolderId);
        return;
    }
    
    // Проверяем, нет ли уже такого приложения в папке
    if (targetFolder.apps.some(app => app.path === appData.path)) {
        console.log('[Apps] App is already in this folder');
        return;
    }
    
    // Создаем объект приложения - копируем все нужные поля
    const newApp = {
        name: appData.name,
        path: appData.path,
        isApp: true,
        type: 'file',
        extension: appData.path.toLowerCase().split('.').pop()
    };
    
    console.log('[Apps] Created new app object:', newApp);
    
    // Добавляем приложение в целевую папку
    const updatedFolders = [...AppState.appFolders];
    const folderIndex = updatedFolders.findIndex(f => f.id === targetFolderId);
    
    if (folderIndex !== -1) {
        updatedFolders[folderIndex] = {
            ...updatedFolders[folderIndex],
            apps: [...updatedFolders[folderIndex].apps, newApp]
        };
        
        console.log('[Apps] Updated folder structure:', updatedFolders[folderIndex]);
        
        // ИСПРАВЛЕНИЕ: Удаляем приложение из исходной папки, только если это перетаскивание внутри окна
        if (appData.source && appData.source !== 'search') {
            const sourceFolderIndex = updatedFolders.findIndex(f => f.id === appData.source);
            if (sourceFolderIndex !== -1) {
                updatedFolders[sourceFolderIndex] = {
                    ...updatedFolders[sourceFolderIndex],
                    apps: updatedFolders[sourceFolderIndex].apps.filter(app => app.path !== appData.path)
                };
                 console.log(`[Apps] Removed app from source folder: ${appData.source}`);
            }
        }
        
        // Отправляем обновление в main process
        AppState.appFolders = updatedFolders;
        ipcRenderer.send('update-setting', 'appFolders', updatedFolders);
        
        console.log('[Apps] Successfully added app to folder, refreshing view');
        
        // Обновляем отображение
        setTimeout(() => {
            renderAppGrid();
        }, 100);
    }
}

// ИСПРАВЛЕНИЕ: Полностью переработанная логика глобального drop-зоны для ясности
function setupGlobalDropZone() {
    const container = document.getElementById('apps-grid-container');
    if (!container) return;

    console.log('[Apps] Setting up corrected global drop zone');

    container.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        // Показываем глобальную подсветку, только если мы не над папкой
        if (!e.target.closest('.grid-item[data-folder-id]')) {
            container.classList.add('global-drag-over');
        } else {
            container.classList.remove('global-drag-over');
        }
    });

    container.addEventListener('dragleave', (e) => {
        // Убираем подсветку, только если курсор покинул сам контейнер
        if (!container.contains(e.relatedTarget)) {
            container.classList.remove('global-drag-over');
        }
    });

    container.addEventListener('drop', (e) => {
        e.preventDefault();
        container.classList.remove('global-drag-over');

        // Этот обработчик срабатывает, только если drop был НЕ на папке.
        // У папок есть свой обработчик с `e.stopPropagation()`.
        const dropTargetIsFolder = e.target.closest('.grid-item[data-folder-id]');
        if (dropTargetIsFolder) {
            console.log('[Apps] Global drop handler ignored drop on folder.');
            return;
        }

        try {
            const dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
            console.log('[Apps] Global drop received on container background:', dragData);
            
            if (dragData.type === 'app') {
                // Если drop произошел на фоне контейнера, всегда добавляем в "Закрепленные"
                handleAppDropOnFolder(dragData, 'pinned');
            }
        } catch (error) {
            console.error('Error handling global drop:', error);
        }
    });
}

// ПОЛНОСТЬЮ НОВАЯ ЛОГИКА DRAG & DROP
function setupDragAndDrop() {
    const container = document.getElementById('apps-grid-container');
    if (!container) return;

    let currentDragOverFolder = null;

    // 1. Событие DRAGOVER на всем контейнере
    container.addEventListener('dragover', (e) => {
        e.preventDefault(); // Обязательно для разрешения drop
        e.dataTransfer.dropEffect = 'move';

        const targetFolder = e.target.closest('.grid-item[data-folder-id]');

        // Если мы над новой папкой
        if (targetFolder && targetFolder !== currentDragOverFolder) {
            // Убираем подсветку со старой папки
            if (currentDragOverFolder) {
                currentDragOverFolder.classList.remove('drag-over');
            }
            // Подсвечиваем новую
            currentDragOverFolder = targetFolder;
            currentDragOverFolder.classList.add('drag-over');
            container.classList.remove('global-drag-over'); // Убираем глобальную подсветку
        }
        // Если мы покинули папку и находимся над фоном
        else if (!targetFolder && currentDragOverFolder) {
            currentDragOverFolder.classList.remove('drag-over');
            currentDragOverFolder = null;
            container.classList.add('global-drag-over'); // Включаем глобальную
        }
        // Если мы просто над фоном
        else if (!targetFolder && !currentDragOverFolder) {
             container.classList.add('global-drag-over');
        }
    });

    // 2. Событие DRAGLEAVE на всем контейнере
    container.addEventListener('dragleave', (e) => {
        // Убираем всю подсветку, если курсор покинул контейнер
        if (!container.contains(e.relatedTarget)) {
            if (currentDragOverFolder) {
                currentDragOverFolder.classList.remove('drag-over');
                currentDragOverFolder = null;
            }
            container.classList.remove('global-drag-over');
        }
    });

    // 3. Событие DROP на всем контейнере
    container.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();

        // Определяем цель падения
        const targetFolderElement = e.target.closest('.grid-item[data-folder-id]');
        let targetFolderId = 'pinned'; // По умолчанию - в закрепленные

        if (targetFolderElement) {
            targetFolderId = targetFolderElement.getAttribute('data-folder-id');
            console.log(`[DND] Dropped on folder: ${targetFolderId}`);
        } else {
            console.log('[DND] Dropped on background (pinned).');
        }

        // Убираем всю подсветку
        if (currentDragOverFolder) {
            currentDragOverFolder.classList.remove('drag-over');
            currentDragOverFolder = null;
        }
        container.classList.remove('global-drag-over');

        try {
            const dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
            if (dragData.type === 'app') {
                handleAppDropOnFolder(dragData, targetFolderId);
            }
        } catch (error) {
            console.error('Error handling drop:', error);
        }
    });
}
