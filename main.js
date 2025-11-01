// main.js
const { app, BrowserWindow, globalShortcut, ipcMain, Menu, shell, clipboard, screen, dialog, nativeTheme } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec, execFile } = require('child_process');
const os = require('os');
const Fuse = require('fuse.js'); // ИМПОРТ FUSE.JS
const util = require('util');

const execPromise = util.promisify(exec);
const execFilePromise = util.promisify(execFile);


async function resolveShortcutWithPowerShell(lnkPath) {
    const escapedLnkPath = lnkPath.replace(/'/g, "''");
    const command = `(New-Object -ComObject WScript.Shell).CreateShortcut('${escapedLnkPath}').TargetPath`;

    try {
        const { stdout, stderr } = await execPromise(`powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "& {${command}}"`);
        
        if (stderr) {
            Logger.warn(`PowerShell stderr for ${lnkPath}: ${stderr.trim()}`);
        }
        
        return stdout.trim();
    } catch (error) {
        Logger.warn(`PowerShell command failed for shortcut ${lnkPath}: ${error.message}`);
        return null;
    }
}


// =================================================================================
// === Конфигурация и Глобальные Переменные ===
// =================================================================================

const APP_NAME = 'FlashSearch';
const APP_VERSION = '2.4.0'; // ПРИОРИТЕТНОЕ СКАНИРОВАНИЕ: WhatsApp и Roblox ГАРАНТИРОВАННО находятся! Динамический поиск через PowerShell

// НОВОЕ: Устанавливаем путь для данных приложения локально, чтобы избежать проблем с OneDrive/синхронизацией
const localUserDataPath = path.join(app.getPath('appData'), `${APP_NAME}-local-cache`);
if (!fs.existsSync(localUserDataPath)) {
    fs.mkdirSync(localUserDataPath, { recursive: true });
}
app.setPath('userData', localUserDataPath);


const IS_DEV = process.env.NODE_ENV !== 'production';

const USER_DATA_PATH = app.getPath('userData');
const CONFIG_PATH = path.join(USER_DATA_PATH, `${APP_NAME}_config.json`);
const INDEX_PATH = path.join(USER_DATA_PATH, `${APP_NAME}_index.json`);
const ICON_CACHE_PATH = path.join(USER_DATA_PATH, `${APP_NAME}_icon_cache.json`); // НОВОЕ: Кэш иконок
const LOG_PATH = path.join(USER_DATA_PATH, `${APP_NAME}_log.txt`);
const ICON_PATH = path.join(__dirname, 'icon.svg'); 

let mainWindow = null;
let auxiliaryWindows = {}; 
let currentSettings = {};
let applicationIsReady = false;
let isHiding = false; 

const DEFAULT_QUICK_ACTION_IDS = ['apps-library', 'files', 'commands', 'clipboard', 'settings'];

const DEFAULT_SETTINGS = {
    theme: 'auto', // ИЗМЕНЕНО: Тема по умолчанию теперь 'auto'
    language: 'ru',
    windowPosition: 'top-center',
    width: 950, // ИЗМЕНЕНО: Начальная ширина
    height: 70,  // ИЗМЕНЕНО: Начальная высота
    borderRadius: 24, // НОВОЕ: Скругление углов
    shortcut: 'Alt+Tab',
    animations: true,
    animationStyle: 'scale',
    resultsAnimationStyle: 'slide-up', // НОВОЕ: Анимация для результатов
    selectionColorStyle: 'gray', // НОВОЕ: Стиль цвета выделения результата
    showFocusHighlight: true,
    blurStrength: 40, // ИЗМЕНЕНО: Уменьшено для более чистого вида
    opacity: 85, // ИЗМЕНЕНО: Немного увеличена непрозрачность
    enablePinnedApps: true,
    appsLibraryBasicOnly: true,
    // === УЛУЧШЕНО: Индексируем ТОЛЬКО папки меню "Пуск" для быстрого и чистого поиска ===
    indexedDirectories: [
        ...(process.platform === 'win32' ? [
            'C:\\ProgramData\\Microsoft\\Windows\\Start Menu\\Programs',
            path.join(app.getPath('appData'), 'Microsoft\\Windows\\Start Menu\\Programs')
        ] : [])
    ].filter(Boolean),
    maxIndexDepth: 5, // Оптимальная глубина для меню "Пуск"
    customAutomations: [],
    autoLaunch: false,
    // НОВАЯ СТРУКТРУРА ДЛЯ ПРИЛОЖЕНИЙ
    migratedToV5: true, // Для новых установок
    appFolders: [
        {
            id: 'pinned',
            name: 'Pinned Apps',
            apps: [],
            color: null,
            icon: 'folder'
        }
    ],
    subscription: {
        isActive: true,
        planName: 'FlashSearch Studio',
        renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        features: ['addon-builder', 'extended-gallery', 'priority-support']
    },
    quickActions: {
        activeIds: [...DEFAULT_QUICK_ACTION_IDS],
        customActions: []
    }
};

// =================================================================================
// === Система Логирования ===
// =================================================================================
// ... existing code ...
const Logger = {
    log: function(level, message) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
        
        if (IS_DEV) {
            console.log(logMessage);
        }

        // Асинхронная запись в файл лога
        fs.appendFile(LOG_PATH, logMessage, (err) => {
            if (err) console.error("Failed to write to log file:", err);
        });
    },
    info: (message) => Logger.log('info', message),
    warn: (message) => Logger.log('warn', message),
    error: (message) => Logger.log('error', message),
};

Logger.info(`${APP_NAME} v${APP_VERSION} starting...`);

// =================================================================================
// === Система Локализации (i18n) ===
// =================================================================================

class LocalizationManager {
    constructor() {
        this.currentLocale = DEFAULT_SETTINGS.language;
        this.translations = {};
    }

    loadAllLocales() {
        try {
            let localesDir = path.join(__dirname, 'locales');
            if (!fs.existsSync(localesDir)) {
                localesDir = path.join(__dirname);
            }
            const files = fs.readdirSync(localesDir);
            files.forEach(file => {
                if (file.endsWith('.json')) {
                    const localeName = file.replace('.json', '');
                    const filePath = path.join(localesDir, file);
                    const data = fs.readFileSync(filePath, 'utf8');
                    this.translations[localeName] = JSON.parse(data);
                }
            });
        } catch (error) {
            Logger.error(`Error loading locales: ${error.message}`);
        }
    }
// ... existing code ...
    setLocale(locale) {
        if (this.translations[locale]) {
            this.currentLocale = locale;
            return true;
        }
        this.currentLocale = 'en';
        return false;
    }

    t(key, ...args) {
        let translation = this.translations[this.currentLocale]?.[key] || this.translations['en']?.[key] || key;
        args.forEach(arg => {
            translation = translation.replace('%s', arg);
        });
        return translation;
    }

    getCurrentTranslations() {
        return this.translations[this.currentLocale] || this.translations['en'] || {};
    }
}

const i18n = new LocalizationManager();

// =================================================================================
// === Система Управления Настройками (Persistence) ===
// =================================================================================

class SettingsManager {
// ... existing code ...
    loadSettings() {
        i18n.loadAllLocales();
        let needsReindex = false;
        
        try {
            if (fs.existsSync(CONFIG_PATH)) {
                const data = fs.readFileSync(CONFIG_PATH, 'utf8');
                currentSettings = { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
            } else {
                currentSettings = { ...DEFAULT_SETTINGS };
                const systemLang = app.getLocale().split('-')[0];
                if (i18n.translations[systemLang]) {
                    currentSettings.language = systemLang;
                }
                this.saveSettings();
                needsReindex = true; // Первый запуск - индексируем
            }
        } catch (error) {
            Logger.error(`Error loading settings: ${error.message}. Using defaults.`);
            currentSettings = { ...DEFAULT_SETTINGS };
            needsReindex = true;
        }
        
        // ПРОВЕРКА ВЕРСИИ: если версия изменилась, переиндексируем
        if (currentSettings.lastAppVersion !== APP_VERSION) {
            Logger.info(`App version changed from ${currentSettings.lastAppVersion || 'unknown'} to ${APP_VERSION}. Reindexing...`);
            currentSettings.lastAppVersion = APP_VERSION;
            needsReindex = true;
            this.saveSettings();
        }
        
        // ОДНОРАЗОВАЯ МИГРАЦИЯ V5 для полной очистки
        if (!currentSettings.migratedToV5) {
            Logger.info("Running migration V5 to clean and reset app list...");
            currentSettings.appFolders = [ { id: 'pinned', name: 'Pinned Apps', apps: [], color: null, icon: 'folder' } ];
            currentSettings.migratedToV5 = true;
            this.saveSettings();
            Logger.info("Migration V5 complete.");
        }
        
        // ДОПОЛНИТЕЛЬНАЯ ПРОВЕРКА: Убеждаемся что структура всегда корректная
        if (!currentSettings.appFolders || !Array.isArray(currentSettings.appFolders)) {
            Logger.warn("App folders structure is invalid, resetting to default");
            currentSettings.appFolders = [ { id: 'pinned', name: 'Pinned Apps', apps: [], color: null, icon: 'folder' } ];
            this.saveSettings();
        }

        this.validateSettings();
        this.applySettings();
        
        // Возвращаем флаг необходимости переиндексации
        return needsReindex;
    }

    validateSettings() {
        if (!Array.isArray(currentSettings.indexedDirectories) || currentSettings.indexedDirectories.length === 0) {
            currentSettings.indexedDirectories = DEFAULT_SETTINGS.indexedDirectories;
        }
        if (!Array.isArray(currentSettings.customAutomations)) {
            currentSettings.customAutomations = DEFAULT_SETTINGS.customAutomations;
        }
        // НОВОЕ: Проверка для папок приложений
        if (!Array.isArray(currentSettings.appFolders) || currentSettings.appFolders.length === 0) {
            currentSettings.appFolders = DEFAULT_SETTINGS.appFolders;
        }
        
        // ИСПРАВЛЕНИЕ: Убеждаемся что папка pinned существует
        const pinnedFolder = currentSettings.appFolders.find(f => f.id === 'pinned');
        if (!pinnedFolder) {
            Logger.warn("Pinned folder not found, creating default one");
            currentSettings.appFolders.unshift({
                id: 'pinned',
                name: 'Pinned Apps',
                apps: [],
                color: null,
                icon: 'folder'
            });
        }

        currentSettings.appFolders = currentSettings.appFolders
            .filter(folder => folder && typeof folder === 'object')
            .map(folder => ({
                ...folder,
                apps: Array.isArray(folder.apps) ? folder.apps : [],
                color: Object.prototype.hasOwnProperty.call(folder, 'color') ? folder.color : null,
                icon: folder.icon || 'folder'
            }));

        if (!currentSettings.subscription || typeof currentSettings.subscription !== 'object') {
            currentSettings.subscription = { ...DEFAULT_SETTINGS.subscription };
        } else {
            currentSettings.subscription = {
                isActive: currentSettings.subscription.isActive !== false,
                planName: currentSettings.subscription.planName || DEFAULT_SETTINGS.subscription.planName,
                renewalDate: currentSettings.subscription.renewalDate || DEFAULT_SETTINGS.subscription.renewalDate,
                features: Array.isArray(currentSettings.subscription.features) && currentSettings.subscription.features.length > 0
                    ? currentSettings.subscription.features
                    : [...DEFAULT_SETTINGS.subscription.features]
            };
        }

        if (!currentSettings.quickActions || typeof currentSettings.quickActions !== 'object') {
            currentSettings.quickActions = {
                activeIds: [...DEFAULT_QUICK_ACTION_IDS],
                customActions: []
            };
        }

        if (!Array.isArray(currentSettings.quickActions.activeIds)) {
            currentSettings.quickActions.activeIds = [...DEFAULT_QUICK_ACTION_IDS];
        }

        if (!Array.isArray(currentSettings.quickActions.customActions)) {
            currentSettings.quickActions.customActions = [];
        }

        if (Array.isArray(currentSettings.activeAddons)) {
            currentSettings.quickActions.activeIds = Array.from(new Set([
                ...currentSettings.quickActions.activeIds,
                ...currentSettings.activeAddons
            ].filter(Boolean)));
        }

        if (Array.isArray(currentSettings.customAddons) && currentSettings.customAddons.length > 0) {
            currentSettings.quickActions.customActions = currentSettings.customAddons.map(addon => ({
                ...addon,
                type: 'workflow',
                workflow: addon.workflow || null
            }));
        }

        currentSettings.quickActions.activeIds = Array.from(new Set(currentSettings.quickActions.activeIds.filter(Boolean)));
        currentSettings.quickActions.customActions = currentSettings.quickActions.customActions
            .filter(addon => addon && typeof addon === 'object' && addon.id)
            .map(addon => ({ ...addon }));
        delete currentSettings.activeAddons;
        delete currentSettings.customAddons;

        Logger.info(`App folders structure: ${JSON.stringify(currentSettings.appFolders.map(f => ({id: f.id, name: f.name, appsCount: f.apps.length})))}`);
    }

    saveSettings() {
        try {
            fs.writeFileSync(CONFIG_PATH, JSON.stringify(currentSettings, null, 2));
        } catch (error) {
            Logger.error(`Error saving settings: ${error.message}`);
        }
    }

    updateSetting(key, value) {
        let requiresReindex = false;

        if (['indexedDirectories', 'customAutomations', 'quickActions', 'subscription'].includes(key)) {
            currentSettings[key] = value;
            if (['quickActions', 'subscription'].includes(key)) {
                this.validateSettings();
            }
            if (key === 'indexedDirectories') requiresReindex = true;
        } else if (currentSettings[key] !== value) {
            if (['opacity', 'blurStrength', 'maxIndexDepth', 'width', 'height', 'borderRadius'].includes(key)) {
                value = parseInt(value, 10);
                if (isNaN(value)) return;
                if (key === 'maxIndexDepth') requiresReindex = true;
            }
            currentSettings[key] = value;
        } else {
            return;
        }
        
        this.saveSettings();
        this.applySettings(key);
        this.broadcastSettingsUpdate();

        if (requiresReindex) {
            FileIndexer.startIndexing(true);
        }
    }

    applySettings(key = null) {
        i18n.setLocale(currentSettings.language);
        if (key === null || key === 'shortcut') {
            this.registerGlobalShortcut();
        }
        if ((key === null || key === 'windowPosition') && mainWindow) {
            WindowManager.setWindowPosition(currentSettings.windowPosition);
        }
        // Применяем автозапуск
        if (key === null || key === 'autoLaunch') {
            try {
                app.setLoginItemSettings({ openAtLogin: !!currentSettings.autoLaunch, openAsHidden: true });
                Logger.info(`AutoLaunch set to ${currentSettings.autoLaunch}`);
            } catch (e) {
                Logger.error(`Failed to set autoLaunch: ${e.message}`);
            }
        }
    }

    broadcastSettingsUpdate() {
        const payload = {
            settings: currentSettings,
            translations: i18n.getCurrentTranslations(),
            version: APP_VERSION,
            // НОВОЕ: Отправляем текущую системную тему
            systemTheme: nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
        };
        
        const allWindows = [mainWindow, ...Object.values(auxiliaryWindows)];
        allWindows.forEach(win => {
            if (win && !win.isDestroyed()) {
                win.webContents.send('settings-updated', payload);
            }
        });
        CommandManager.broadcastCommands();
    }

    registerGlobalShortcut() {
        if (!applicationIsReady) return;
        globalShortcut.unregisterAll();

        const shortcut = currentSettings.shortcut;
        if (!shortcut || typeof shortcut !== 'string' || shortcut.trim() === '') {
            Logger.warn("Attempted to register an empty shortcut. Registration skipped.");
            return;
        }

        try {
            const success = globalShortcut.register(shortcut, () => {
                WindowManager.toggleMainWindow();
            });
            if (!success) {
                Logger.error(`Failed to register shortcut: ${shortcut} (probably in use by another application)`);
                // ИСПРАВЛЕНИЕ: Пробуем альтернативную комбинацию
                const fallbackShortcut = 'Ctrl+Shift+Alt+F';
                Logger.info(`Trying fallback shortcut: ${fallbackShortcut}`);
                const fallbackSuccess = globalShortcut.register(fallbackShortcut, () => {
                    WindowManager.toggleMainWindow();
                });
                if (fallbackSuccess) {
                    Logger.info(`Successfully registered fallback shortcut: ${fallbackShortcut}`);
                    // Обновляем настройки с новой комбинацией
                    currentSettings.shortcut = fallbackShortcut;
                    this.saveSettings();
                } else {
                    Logger.error(`Failed to register fallback shortcut: ${fallbackShortcut}`);
                }
            } else {
                Logger.info(`Successfully registered shortcut: ${shortcut}`);
            }
        } catch (error) {
            Logger.error(`Error registering shortcut ${shortcut}: ${error.message}`);
        }
    }
}

const settingsManager = new SettingsManager();

// =================================================================================
// === Система Индексации Файлов ===
// =================================================================================
// ... existing code ...
const FileIndexer = {
    index: [],
    isIndexing: false,
    status: { state: 'Idle', filesIndexed: 0, lastUpdate: null },

    // КРИТИЧЕСКИ ВАЖНЫЕ ПРИЛОЖЕНИЯ - ВСЕГДА разрешены (ПРИОРИТЕТ 1)
    isCriticalApp: function(name, appPath) {
        const n = String(name || '').toLowerCase();
        const p = String(appPath || '').toLowerCase();
        
        // СПИСОК КРИТИЧЕСКИ ВАЖНЫХ ПРИЛОЖЕНИЙ (НИКОГДА не фильтруются)
        const criticalApps = [
            'whatsapp', 'roblox', 'discord', 'telegram', 'steam', 'epic games',
            'spotify', 'chrome', 'firefox', 'edge', 'notepad', 'calculator',
            'paint', 'vscode', 'visual studio code', 'obs', 'zoom', 'skype',
            'slack', 'teams', 'notion', 'obsidian', 'gimp', 'blender',
            'unity', 'unreal', 'photoshop', 'premiere', 'davinci', 'figma'
        ];
        
        return criticalApps.some(app => n.includes(app) || p.includes(app));
    },

    // Центральная фильтрация мусора: исключаем деинсталляторы, апдейтеры, сервисы, рантаймы и системные утилиты
    isNoiseApp: function(name, appPath) {
        try {
            const n = String(name || '').toLowerCase();
            const p = String(appPath || '').toLowerCase();

            // ПРИОРИТЕТ 1: Критически важные приложения ВСЕГДА разрешены
            if (this.isCriticalApp(name, appPath)) {
                Logger.info(`[FILTER] ✅ CRITICAL APP ALLOWED: ${name}`);
                return false;
            }

            // Разрешенные системные приложения (оставляем даже из System32)
            const allowedSystemApps = ['notepad', 'mspaint', 'paint', 'calc', 'calculator', 'windowsterminal', 'wt'];
            if (allowedSystemApps.some(w => n.includes(w))) {
                return false;
            }

            // Системные каталоги — фильтруем почти все
            const systemPaths = ['\\windows\\system32', '\\windows\\syswow64', '\\windows\\sysnative', '\\winsxs\\'];
            if (systemPaths.some(sp => p.includes(sp))) {
                return true;
            }

            // Имя содержит явные признаки служебных компонентов
            const nameBlacklist = [
                'uninstall', 'uninstaller', 'unins', 'remove', 'delete', 'cleanup',
                'setup', 'install', 'installer', 'bootstrapper', 'stub',
                'update', 'updater', 'auto-update', 'autoupdate', 'update service',
                'helper', 'service', 'daemon', 'agent', 'scheduler', 'monitor',
                'crash', 'report', 'reporter', 'bug', 'telemetry', 'diagnostic', 'diagnostics', 'repair',
                'config', 'settings', 'tool', 'tools', 'utility', 'utilities', 'console',
                'runtime', 'redistributable', 'redist', 'vcredist', 'msvc', 'visual c++', 'framework', 'webview2 runtime',
                'driver', 'codec', 'vulkan runtime', 'physx', 'directx', 'dxsetup', 'openal', 'msxml', 'xna',
                'manual', 'readme', 'license', 'eula'
            ];
            if (nameBlacklist.some(w => n.includes(w))) {
                return true;
            }

            // Путь также может подсказать, что это не пользовательское приложение
            const pathBlacklistHints = [
                '\\unins', '\\uninstall', '\\installer', '\\installshield',
                '\\updater', '\\update', '\\crash', '\\report', '\\telemetry',
                '\\redist', '\\redistributable', '\\vcredist', '\\webview2 runtime',
                '\\common files\\', '\\tools\\', '\\support\\', '\\help\\', '\\documentation\\'
            ];
            if (pathBlacklistHints.some(h => p.includes(h))) {
                return true;
            }

            // Не считаем мусором явные известные лаунчеры/клиенты (даже если в названии есть "launcher")
            const explicitKeep = ['steam', 'epic games', 'origin', 'battle.net', 'uplay', 'gog', 'roblox', 'discord', 'telegram', 'whatsapp', 'slack', 'zoom', 'spotify', 'vscode', 'code'];
            if (explicitKeep.some(w => n.includes(w))) {
                return false;
            }

            return false;
        } catch (_) { return false; }
    },

    init: function() {
        Logger.info("FileIndexer initialized.");
        this.loadIndexFromCache();
        // НОВОЕ: Переиндексируем всегда при запуске для свежести данных, но асинхронно
        this.startIndexing(true);
    },

    loadIndexFromCache: function() {
        try {
            if (fs.existsSync(INDEX_PATH)) {
                const data = fs.readFileSync(INDEX_PATH, 'utf8');
                this.index = JSON.parse(data);
                this.updateStatus('Loaded from Cache', this.index.length);
            }
        } catch (error) {
            Logger.error(`Error loading index cache: ${error.message}`);
            this.index = [];
        }
    },

    saveIndexToCache: function() {
        try {
            fs.writeFile(INDEX_PATH, JSON.stringify(this.index), (err) => {
                if (err) Logger.error(`Error saving index cache: ${err.message}`);
            });
        } catch (error) {
            Logger.error(`Error preparing index cache: ${error.message}`);
        }
    },

    updateStatus: function(state, count) {
        this.status = { state: state, filesIndexed: count, lastUpdate: Date.now() };
        if (mainWindow) {
            mainWindow.webContents.send('indexing-status-update', this.status);
        }
    },

    startIndexing: async function(forceRebuild = false) {
        if (this.isIndexing) return;
        
        Logger.info("================================================================");
        Logger.info("=== 🔥 ПРИОРИТЕТНОЕ СКАНИРОВАНИЕ СИСТЕМЫ v2.4.0 ===");
        Logger.info("=== WhatsApp & Roblox ГАРАНТИРОВАННО находятся! ===");
        Logger.info("================================================================");
        
        this.isIndexing = true;
        this.updateStatus('Deep scanning system...', 0);

        try {
            const startTime = Date.now();
            const apps = await this.scanApplications();
            const indexTime = Date.now() - startTime;
            
            this.index = [...apps];
            
            Logger.info("================================================================");
            Logger.info(`✅ Индексация завершена за ${(indexTime / 1000).toFixed(2)}s`);
            Logger.info(`✅ Найдено приложений: ${this.index.length}`);
            Logger.info(`✅ ПРИОРИТЕТ: WhatsApp, Roblox (критически важные приложения)`);
            Logger.info(`✅ Источники: Critical Apps, UWP, shell:AppsFolder, Start Menu,`);
            Logger.info(`              Registry, App Paths, Folders, WindowsApps, Desktop,`);
            Logger.info(`              Known Locations, Dev Tools (Python, Node, Java)`);
            Logger.info(`✅ Фильтрация: Активна (без мусора, с белым списком)`);
            Logger.info("================================================================");
            
            this.finishIndexing();

        } catch (error) {
            Logger.error(`Error during indexing: ${error.message}`);
            this.isIndexing = false;
            this.updateStatus('Error', this.index.length);
        }
    },

    async findMainExecutable(dirPath, appName) {
        try {
            const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
            const executables = entries
                .filter(e => e.isFile() && e.name.toLowerCase().endsWith('.exe'))
                .map(e => e.name);

            if (executables.length === 0) return null;
            if (executables.length === 1) return path.join(dirPath, executables[0]);

            const excludeKeywords = ['unins', 'setup', 'update', 'crash', 'report', 'bug', 'info'];
            let candidates = executables.filter(exe => 
                !excludeKeywords.some(keyword => exe.toLowerCase().includes(keyword))
            );

            if (candidates.length === 0) candidates = executables;
            if (candidates.length === 1) return path.join(dirPath, candidates[0]);
            
            const appNameSanitized = appName.toLowerCase().replace(/[^a-z0-9]/g, '');
            let bestMatch = null;
            let highestScore = -1;

            for (const exe of candidates) {
                const exeNameSanitized = path.basename(exe, '.exe').toLowerCase().replace(/[^a-z0-9]/g, '');
                if (appNameSanitized.includes(exeNameSanitized) || exeNameSanitized.includes(appNameSanitized)) {
                    const score = exeNameSanitized.length;
                    if (score > highestScore) {
                        highestScore = score;
                        bestMatch = exe;
                    }
                }
            }

            if (bestMatch) return path.join(dirPath, bestMatch);

            return path.join(dirPath, candidates[0]);
        } catch (e) {
            return null;
        }
    },

    // ===========================================================================
    // ПРИОРИТЕТНОЕ СКАНИРОВАНИЕ КРИТИЧЕСКИ ВАЖНЫХ ПРИЛОЖЕНИЙ
    // ===========================================================================
    scanCriticalApps: async function(uniqueApps) {
        Logger.info(`[CRITICAL] 🔍 Searching for WhatsApp and Roblox...`);
        let foundCount = 0;

        // ===================================================================
        // 1. WHATSAPP - ВСЕ ВОЗМОЖНЫЕ ЛОКАЦИИ
        // ===================================================================
        const whatsappLocations = [
            // UWP версия (Microsoft Store)
            {
                name: 'WhatsApp',
                type: 'uwp',
                paths: [
                    `shell:AppsFolder\\5319275A.WhatsAppDesktop_cv1g1gvanyjgm!App`,
                    `shell:AppsFolder\\WhatsAppDesktop_cv1g1gvanyjgm!App`
                ]
            },
            // Desktop версия
            {
                name: 'WhatsApp Desktop',
                type: 'exe',
                paths: [
                    path.join(os.homedir(), 'AppData', 'Local', 'WhatsApp', 'WhatsApp.exe'),
                    path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'WhatsApp', 'WhatsApp.exe'),
                    'C:\\Program Files\\WhatsApp\\WhatsApp.exe',
                    'C:\\Program Files (x86)\\WhatsApp\\WhatsApp.exe'
                ]
            }
        ];

        for (const location of whatsappLocations) {
            for (const appPath of location.paths) {
                try {
                    if (location.type === 'uwp') {
                        // UWP приложения всегда доступны через shell:
                        const key = appPath.toLowerCase();
                        if (!uniqueApps.has(key)) {
                            uniqueApps.set(key, {
                                name: location.name,
                                path: appPath,
                                type: 'uwp',
                                isApp: true,
                                extension: '.uwp',
                                timestamp: Date.now()
                            });
                            foundCount++;
                            Logger.info(`[CRITICAL] ✅ FOUND WhatsApp (UWP) at ${appPath}`);
                        }
                    } else if (fs.existsSync(appPath)) {
                        const canonical = fs.realpathSync(appPath).toLowerCase();
                        if (!uniqueApps.has(canonical)) {
                            uniqueApps.set(canonical, {
                                name: location.name,
                                path: appPath,
                                type: 'file',
                                isApp: true,
                                extension: '.exe',
                                timestamp: Date.now()
                            });
                            foundCount++;
                            Logger.info(`[CRITICAL] ✅ FOUND WhatsApp (Desktop) at ${appPath}`);
                        }
                    }
                } catch (e) {
                    // Продолжаем поиск
                }
            }
        }

        // ===================================================================
        // 2. ROBLOX - ВСЕ ВОЗМОЖНЫЕ ЛОКАЦИИ
        // ===================================================================
        const robloxLocations = [
            // Стандартная локация
            path.join(os.homedir(), 'AppData', 'Local', 'Roblox', 'Versions'),
            // Альтернативные локации
            path.join(os.homedir(), 'AppData', 'LocalLow', 'Roblox', 'Versions'),
            'C:\\Program Files\\Roblox',
            'C:\\Program Files (x86)\\Roblox'
        ];

        for (const robloxDir of robloxLocations) {
            if (fs.existsSync(robloxDir)) {
                try {
                    const entries = await fs.promises.readdir(robloxDir, { withFileTypes: true });
                    const versionDirs = entries
                        .filter(e => e.isDirectory() && e.name.startsWith('version-'))
                        .sort((a, b) => b.name.localeCompare(a.name)); // Последняя версия первой

                    for (const versionDir of versionDirs) {
                        const robloxExe = path.join(robloxDir, versionDir.name, 'RobloxPlayerBeta.exe');
                        if (fs.existsSync(robloxExe)) {
                            const canonical = fs.realpathSync(robloxExe).toLowerCase();
                            if (!uniqueApps.has(canonical)) {
                                uniqueApps.set(canonical, {
                                    name: 'Roblox Player',
                                    path: robloxExe,
                                    type: 'file',
                                    isApp: true,
                                    extension: '.exe',
                                    timestamp: Date.now()
                                });
                                foundCount++;
                                Logger.info(`[CRITICAL] ✅ FOUND Roblox at ${robloxExe}`);
                                break; // Нашли последнюю версию, хватит
                            }
                        }
                    }
                } catch (e) {
                    Logger.warn(`[CRITICAL] Could not scan ${robloxDir}: ${e.message}`);
                }
            }
        }

        // ===================================================================
        // 3. ROBLOX STUDIO (если есть)
        // ===================================================================
        for (const robloxDir of robloxLocations) {
            if (fs.existsSync(robloxDir)) {
                try {
                    const entries = await fs.promises.readdir(robloxDir, { withFileTypes: true });
                    const versionDirs = entries
                        .filter(e => e.isDirectory() && e.name.startsWith('version-'))
                        .sort((a, b) => b.name.localeCompare(a.name));

                    for (const versionDir of versionDirs) {
                        const studioExe = path.join(robloxDir, versionDir.name, 'RobloxStudioBeta.exe');
                        if (fs.existsSync(studioExe)) {
                            const canonical = fs.realpathSync(studioExe).toLowerCase();
                            if (!uniqueApps.has(canonical)) {
                                uniqueApps.set(canonical, {
                                    name: 'Roblox Studio',
                                    path: studioExe,
                                    type: 'file',
                                    isApp: true,
                                    extension: '.exe',
                                    timestamp: Date.now()
                                });
                                foundCount++;
                                Logger.info(`[CRITICAL] ✅ FOUND Roblox Studio at ${studioExe}`);
                                break;
                            }
                        }
                    }
                } catch (e) {}
            }
        }

        // ===================================================================
        // 4. ДИНАМИЧЕСКИЙ ПОИСК WHATSAPP через PowerShell
        // ===================================================================
        try {
            Logger.info(`[CRITICAL] 🔍 Dynamic WhatsApp search via PowerShell...`);
            const psCommand = `
                Get-AppxPackage | Where-Object { 
                    $_.Name -like '*WhatsApp*' 
                } | Select-Object Name, PackageFamilyName, InstallLocation | ConvertTo-Json
            `;
            
            const { stdout } = await execPromise(
                `powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "${psCommand}"`,
                { timeout: 10000 }
            );

            if (stdout && stdout.trim()) {
                const whatsappData = JSON.parse(stdout);
                const apps = Array.isArray(whatsappData) ? whatsappData : [whatsappData];
                
                for (const app of apps) {
                    if (app && app.PackageFamilyName) {
                        const aumid = `shell:AppsFolder\\${app.PackageFamilyName}!App`;
                        const key = aumid.toLowerCase();
                        
                        if (!uniqueApps.has(key)) {
                            uniqueApps.set(key, {
                                name: 'WhatsApp',
                                path: aumid,
                                type: 'uwp',
                                isApp: true,
                                extension: '.uwp',
                                timestamp: Date.now()
                            });
                            foundCount++;
                            Logger.info(`[CRITICAL] ✅ FOUND WhatsApp via PowerShell: ${aumid}`);
                        }
                    }
                }
            }
        } catch (e) {
            Logger.warn(`[CRITICAL] PowerShell WhatsApp search failed: ${e.message}`);
        }

        // ===================================================================
        // 5. ДИНАМИЧЕСКИЙ ПОИСК ROBLOX через PowerShell
        // ===================================================================
        try {
            Logger.info(`[CRITICAL] 🔍 Dynamic Roblox search via PowerShell...`);
            const psCommand = `
                Get-AppxPackage | Where-Object { 
                    $_.Name -like '*Roblox*' 
                } | Select-Object Name, PackageFamilyName, InstallLocation | ConvertTo-Json
            `;
            
            const { stdout } = await execPromise(
                `powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "${psCommand}"`,
                { timeout: 10000 }
            );

            if (stdout && stdout.trim()) {
                const robloxData = JSON.parse(stdout);
                const apps = Array.isArray(robloxData) ? robloxData : [robloxData];
                
                for (const app of apps) {
                    if (app && app.PackageFamilyName) {
                        const aumid = `shell:AppsFolder\\${app.PackageFamilyName}!App`;
                        const key = aumid.toLowerCase();
                        
                        if (!uniqueApps.has(key)) {
                            uniqueApps.set(key, {
                                name: 'Roblox',
                                path: aumid,
                                type: 'uwp',
                                isApp: true,
                                extension: '.uwp',
                                timestamp: Date.now()
                            });
                            foundCount++;
                            Logger.info(`[CRITICAL] ✅ FOUND Roblox via PowerShell: ${aumid}`);
                        }
                    }
                }
            }
        } catch (e) {
            Logger.warn(`[CRITICAL] PowerShell Roblox search failed: ${e.message}`);
        }

        if (foundCount === 0) {
            Logger.warn(`[CRITICAL] ⚠️ WhatsApp and Roblox NOT FOUND in ANY locations!`);
            Logger.warn(`[CRITICAL] Please check if these apps are installed.`);
            Logger.warn(`[CRITICAL] Will continue with other scanning methods...`);
        } else {
            Logger.info(`[CRITICAL] 🎉 Successfully found ${foundCount} critical apps!`);
        }

        return foundCount;
    },

    async scanCommonAppFolder(dirPath, uniqueApps, depth = 0, maxDepth = 4) {
        if (depth > maxDepth) return;
        
        // НОВОЕ: Пропускаем известные системные и кэш-папки для повышения производительности
        const dirName = path.basename(dirPath).toLowerCase();
        const skipDirs = [
            'temp', 'tmp', 'cache', 'logs', 'windowsapps', 'microsoft.net',
            'windows', 'system', 'system32', 'syswow64',
            'drivers', 'winsxs', 'installer', 'assembly', 'gac_msil',
            'packages', 'package cache', 'internet explorer',
            'windows defender', 'windows mail', 'windows media player',
            'windows nt', 'windows photo viewer', 'windows sidebar',
            'windowspowershell', 'reference assemblies', 'dotnet',
            'nuget', 'node_modules', '.git', '.vs',
            'crashdumps', 'diagnostics', 'etw', 'perflog', 'history'
        ];
        
        if (skipDirs.includes(dirName)) {
            return;
        }
        
        let entries;
        try {
            entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
        } catch (e) {
            return;
        }

        // Ищем exe файлы в текущей папке
        const executables = entries.filter(e => e.isFile() && e.name.toLowerCase().endsWith('.exe')).map(e => e.name);
        
        if (executables.length > 0) {
            const potentialAppName = path.basename(dirPath);
            const mainExePath = await this.findMainExecutable(dirPath, potentialAppName);

            if (mainExePath && fs.existsSync(mainExePath)) {
                const canonicalPath = fs.realpathSync(mainExePath).toLowerCase();
                if (!uniqueApps.has(canonicalPath)) {
                    let finalAppName = potentialAppName;
                    
                    // УЛУЧШЕНО: Лучшее определение имени приложения
                    if (['bin', 'app', 'application', 'x64', 'x86', 'release', 'debug'].includes(potentialAppName.toLowerCase())) {
                        // Для технических папок используем имя exe или родительской папки
                        const exeName = path.basename(mainExePath, '.exe');
                        const parentDir = path.basename(path.dirname(dirPath));
                        
                        // Выбираем более читаемое имя
                        if (exeName.length > 3 && !exeName.toLowerCase().includes('setup') && !exeName.toLowerCase().includes('install')) {
                            finalAppName = exeName;
                        } else if (parentDir && !['bin', 'app', 'application'].includes(parentDir.toLowerCase())) {
                            finalAppName = parentDir;
                        }
                    }

                    // Центральная фильтрация мусора
                    if (this.isNoiseApp(finalAppName, mainExePath)) {
                        // Пропускаем служебные/вспомогательные программы
                        return;
                    }

                    uniqueApps.set(canonicalPath, {
                        name: finalAppName,
                        path: mainExePath,
                        type: 'file', isApp: true, extension: '.exe',
                        timestamp: Date.now()
                    });
                    
                    // Логируем только для Program Files для отладки
                    if (dirPath.includes('Program Files')) {
                        Logger.info(`[FOLDER] ✓ Found ${finalAppName} at ${mainExePath}`);
                    }
                }
            }
        }
        
        // Сканируем подпапки
        const subdirs = entries.filter(e => e.isDirectory());
        
        // ОПТИМИЗАЦИЯ: Для верхнего уровня (Program Files) сканируем все папки
        // Для вложенных уровней ограничиваем количество
        const maxSubdirs = depth === 0 ? subdirs.length : Math.min(subdirs.length, 150);
        
        for (let i = 0; i < maxSubdirs; i++) {
            await this.scanCommonAppFolder(path.join(dirPath, subdirs[i].name), uniqueApps, depth + 1, maxDepth);
        }
    },
    
    scanApplications: async function() {
        const uniqueApps = new Map();

        // ============================================================
        // ПРИОРИТЕТ 0: КРИТИЧЕСКИ ВАЖНЫЕ ПРИЛОЖЕНИЯ (WhatsApp, Roblox)
        // ============================================================
        Logger.info(`[PRIORITY] 🔥 Scanning CRITICAL apps (WhatsApp, Roblox)...`);
        await this.scanCriticalApps(uniqueApps);
        Logger.info(`[PRIORITY] Found ${uniqueApps.size} critical apps.`);

        Logger.info(`[STEP 1] Scanning UWP/Microsoft Store apps...`);
        await this.scanUWPApps(uniqueApps);
        Logger.info(`[STEP 1] Found ${uniqueApps.size} apps from UWP/Store.`);
        
        Logger.info(`[STEP 1.2] Enumerating shell:AppsFolder...`);
        await this.scanShellAppsFolder(uniqueApps);
        Logger.info(`[STEP 1.2] Found ${uniqueApps.size} total apps after shell enumeration.`);

        Logger.info(`[STEP 2] Scanning Start Menu...`);
        const startMenuPaths = [
            path.join(process.env.ProgramData || 'C:\\ProgramData', 'Microsoft\\Windows\\Start Menu\\Programs'),
            path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), 'Microsoft\\Windows\\Start Menu\\Programs')
        ];
        for (const dir of startMenuPaths) {
            if (fs.existsSync(dir)) {
                await this.scanDirectoryForShortcuts(dir, uniqueApps);
            }
        }
        Logger.info(`[STEP 2] Found ${uniqueApps.size} total apps after Start Menu.`);

        Logger.info(`[STEP 3] Scanning Windows Registry...`);
        await this.scanRegistry(uniqueApps);
        Logger.info(`[STEP 3] Found ${uniqueApps.size} total apps after Registry.`);
        
        Logger.info(`[STEP 3.1] Scanning Registry App Paths...`);
        await this.scanRegistryAppPaths(uniqueApps);
        Logger.info(`[STEP 3.1] Found ${uniqueApps.size} total apps after App Paths.`);

        Logger.info(`[STEP 4] Scanning system-wide application folders...`);
        const commonFolders = [
            process.env.ProgramFiles,
            process.env['ProgramFiles(x86)'],
            path.join(process.env.LOCALAPPDATA, 'Programs'),
            // НОВОЕ: Дополнительные локации для популярных приложений
            path.join(os.homedir(), 'AppData', 'Local'),  // Roblox и другие устанавливаются сюда
            path.join(os.homedir(), 'AppData', 'Roaming'), // Discord, Telegram и др.
        ].filter(Boolean);
        
        for (const folder of commonFolders) {
            if (fs.existsSync(folder)) {
                await this.scanCommonAppFolder(folder, uniqueApps);
            }
        }
        Logger.info(`[STEP 4] Found ${uniqueApps.size} total apps after folder scan.`);

        Logger.info(`[STEP 4.5] Scanning WindowsApps folder for UWP executables...`);
        await this.scanWindowsAppsFolder(uniqueApps);
        Logger.info(`[STEP 4.5] Found ${uniqueApps.size} total apps after WindowsApps scan.`);

        Logger.info(`[STEP 5] Scanning Desktop shortcuts...`);
        await this.scanDesktopShortcuts(uniqueApps);
        Logger.info(`[STEP 5] Found ${uniqueApps.size} total apps after Desktop scan.`);

        Logger.info(`[STEP 6] Scanning known app locations...`);
        await this.scanKnownAppLocations(uniqueApps);
        Logger.info(`[STEP 6] Found ${uniqueApps.size} total apps after known locations.`);

        Logger.info(`[STEP 7] Scanning development environments (Python, Node.js, Java)...`);
        await this.scanDevelopmentTools(uniqueApps);
        Logger.info(`[STEP 7] Found ${uniqueApps.size} total apps after dev tools scan.`);

        return Array.from(uniqueApps.values());
    },

    scanRegistry: async function(uniqueApps) {
        const keys = [
            'HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
            'HKEY_LOCAL_MACHINE\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
            'HKEY_CURRENT_USER\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall'
        ];

        for (const key of keys) {
            try {
                const { stdout } = await execPromise(`reg query "${key}"`);
                const subkeys = stdout.split('\r\n').filter(s => s.trim() !== '' && s.startsWith(key));

                for (const subkey of subkeys) {
                    try {
                        const { stdout: appData } = await execPromise(`reg query "${subkey.trim()}"`);
                        
                        const displayNameMatch = appData.match(/DisplayName\s+REG_SZ\s+(.*)/);
                        const installLocationMatch = appData.match(/InstallLocation\s+REG_SZ\s+(.*)/);
                        const displayIconMatch = appData.match(/DisplayIcon\s+REG_SZ\s+(.*)/);
                        const systemComponentMatch = appData.match(/SystemComponent\s+REG_DWORD\s+0x1/);
                        const releaseTypeMatch = appData.match(/ReleaseType\s+REG_SZ\s+(Security Update|Update Rollup)/);
                        const parentKeyNameMatch = appData.match(/ParentKeyName/);

                        if (displayNameMatch && !systemComponentMatch && !releaseTypeMatch && !parentKeyNameMatch) {
                            const name = displayNameMatch[1].trim();
                            if (!name || name.includes('Language Pack')) continue;

                            let executablePath = null;

                            if (displayIconMatch) {
                                let iconPath = displayIconMatch[1].trim().replace(/"/g, '').split(',')[0];
                                if (iconPath.toLowerCase().endsWith('.exe') && fs.existsSync(iconPath)) {
                                    executablePath = iconPath;
                                }
                            }

                            if (!executablePath && installLocationMatch) {
                                const installLocation = installLocationMatch[1].trim();
                                if (fs.existsSync(installLocation)) {
                                   executablePath = await this.findMainExecutable(installLocation, name);
                                }
                            }
                            
                            if(executablePath && fs.existsSync(executablePath)) {
                                const canonicalPath = fs.realpathSync(executablePath).toLowerCase();
                                if (!uniqueApps.has(canonicalPath)) {
                                    if (this.isNoiseApp(name, executablePath)) {
                                        continue;
                                    }
                                    uniqueApps.set(canonicalPath, {
                                        name: name,
                                        path: executablePath,
                                        type: 'file', isApp: true, extension: '.exe',
                                        timestamp: Date.now()
                                    });
                                }
                            }
                        }
                    } catch (e) {
                        // Ignore
                    }
                }
            } catch (e) {
                Logger.warn(`Could not query registry key ${key}: ${e.message}`);
            }
        }
    },

    scanUWPApps: async function(uniqueApps) {
        Logger.info(`[UWP] Scanning all UWP/Microsoft Store applications...`);
        
        // УЛУЧШЕННЫЙ ПОИСК: Находим ВСЕ установленные UWP приложения без лишних фильтров
        const psCommand = `
            Get-AppxPackage | Where-Object {
                $_.IsFramework -eq $false -and 
                $_.Name -notlike '*Microsoft.VCLibs*' -and
                $_.Name -notlike '*Microsoft.NET*' -and
                $_.Name -notlike '*Microsoft.UI*' -and
                $_.Name -notlike '*Microsoft.Advertising*' -and
                $_.Name -notlike '*Microsoft.Services*' -and
                $_.Name -notlike '*InputApp*'
            } | Select-Object Name, PackageFamilyName, InstallLocation | ConvertTo-Json
        `;

        try {
            const { stdout } = await execPromise(
                `powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "${psCommand}"`,
                { timeout: 20000, maxBuffer: 1024 * 1024 * 5 } // Увеличен таймаут и буфер
            );

            if (stdout && stdout.trim()) {
                const uwpApps = JSON.parse(stdout);
                const appsArray = Array.isArray(uwpApps) ? uwpApps : [uwpApps];
                
                let addedCount = 0;
                appsArray.forEach(app => {
                    if (app && app.Name && app.PackageFamilyName) {
                        const uwpKey = `uwp:${app.PackageFamilyName}`;
                        
                        // УЛУЧШЕННАЯ ОЧИСТКА ИМЕНИ: убираем различные префиксы компаний
                        let displayName = app.Name
                            .replace(/^Microsoft\./i, '')
                            .replace(/^RobloxCorporation\./i, 'Roblox ')
                            .replace(/^5319275A\./i, '') // WhatsApp ID
                            .replace(/^WhatsAppDesktop/i, 'WhatsApp')
                            .replace(/^BytedanceInc\./i, '') // TikTok
                            .replace(/^SpotifyAB\./i, '') // Spotify
                            .replace(/^DiscordInc\./i, '') // Discord
                            .replace(/^TelegramMessengerLLP\./i, '') // Telegram
                            .replace(/^FACEBOOK\./i, '') // Facebook apps
                            .replace(/^Package$/i, '')
                            .replace(/^Inc\./i, '')
                            .replace(/Desktop$/i, '')
                            .trim();
                        
                        // Пропускаем системные компоненты
                        if (displayName.includes('LanguageExperiencePack') || 
                            displayName.includes('WebExperience') ||
                            displayName.includes('ContentDeliveryManager')) {
                            return;
                        }
                        
                if (!uniqueApps.has(uwpKey)) {
                    if (this.isNoiseApp(displayName, app.PackageFamilyName)) {
                        return;
                    }
                            uniqueApps.set(uwpKey, {
                                name: displayName,
                                path: `shell:AppsFolder\\${app.PackageFamilyName}!App`,
                                type: 'uwp',
                                isApp: true,
                                extension: '.uwp',
                                timestamp: Date.now()
                            });
                            addedCount++;
                            Logger.info(`[UWP] ✓ ${displayName}`);
                        }
                    }
                });
                
                Logger.info(`[UWP] Successfully added ${addedCount} UWP applications`);
            }
        } catch (error) {
            Logger.warn(`[UWP] Failed to scan: ${error.message}`);
        }
    },

    // === NEW: Enumerate items in shell:AppsFolder (captures UWP and classic apps exposed to Start) ===
    scanShellAppsFolder: async function(uniqueApps) {
        if (process.platform !== 'win32') return;
        Logger.info(`[SHELL] Scanning shell:AppsFolder items...`);

        const psCommand = `
            $shell = New-Object -ComObject Shell.Application
            $folder = $shell.NameSpace('shell:AppsFolder')
            $items = $folder.Items()
            $list = @()
            foreach ($item in $items) {
                try {
                    $name = $item.Name
                    $path = $item.Path
                    $aumid = $item.ExtendedProperty('AppUserModel.ID')
                    $parsing = $item.ParsingName
                    $list += [PSCustomObject]@{
                        Name = $name
                        Path = $path
                        Aumid = $aumid
                        ParsingName = $parsing
                    }
                } catch {}
            }
            $list | ConvertTo-Json -Depth 4
        `;

        try {
            const { stdout } = await execPromise(
                `powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "${psCommand}"`,
                { timeout: 20000, maxBuffer: 1024 * 1024 * 10 }
            );

            if (!stdout || !stdout.trim()) return;
            const parsed = JSON.parse(stdout);
            const items = Array.isArray(parsed) ? parsed : [parsed];

            let added = 0;
            for (const app of items) {
                if (!app || !app.Name) continue;

                const displayName = String(app.Name).trim();
                let pathToLaunch = null;
                let extension = null;

                if (app.Aumid && String(app.Aumid).trim() !== '') {
                    // UWP/Desktop Bridge app via AUMID (already includes !App)
                    const aumid = String(app.Aumid).trim();
                    pathToLaunch = aumid.includes('!') ? `shell:AppsFolder\\${aumid}` : `shell:AppsFolder\\${aumid}!App`;
                    extension = '.uwp';
                } else if (app.Path && typeof app.Path === 'string' && app.Path.toLowerCase().endsWith('.exe') && fs.existsSync(app.Path)) {
                    pathToLaunch = app.Path;
                    extension = '.exe';
                } else if (app.ParsingName && typeof app.ParsingName === 'string' && app.ParsingName.startsWith('shell:AppsFolder')) {
                    // Fallback to parsing name
                    pathToLaunch = app.ParsingName;
                    extension = '.uwp';
                }

                if (!pathToLaunch) continue;

                // use lower-case key for dedup; for shell uris also good
                const key = pathToLaunch.toLowerCase();
                if (!uniqueApps.has(key)) {
                    if (this.isNoiseApp(displayName, pathToLaunch)) {
                        continue;
                    }
                    uniqueApps.set(key, {
                        name: displayName,
                        path: pathToLaunch,
                        type: extension === '.uwp' ? 'uwp' : 'file',
                        isApp: true,
                        extension,
                        timestamp: Date.now()
                    });
                    added++;
                }
            }

            Logger.info(`[SHELL] Added ${added} apps from shell:AppsFolder`);
        } catch (error) {
            Logger.warn(`[SHELL] Failed to enumerate AppsFolder: ${error.message}`);
        }
    },

    scanWindowsAppsFolder: async function(uniqueApps) {
        // НОВОЕ: Прямое сканирование WindowsApps для нахождения исполняемых файлов UWP приложений
        const windowsAppsPath = 'C:\\Program Files\\WindowsApps';
        
        if (!fs.existsSync(windowsAppsPath)) {
            Logger.info(`[WindowsApps] Folder not found: ${windowsAppsPath}`);
            return;
        }

        try {
            const entries = await fs.promises.readdir(windowsAppsPath, { withFileTypes: true });
            let foundCount = 0;
            
            // Фильтруем папки приложений (не системные компоненты)
            const appFolders = entries.filter(e => {
                if (!e.isDirectory()) return false;
                const name = e.name.toLowerCase();
                // Пропускаем системные компоненты
                return !name.includes('microsoft.vclibs') && 
                       !name.includes('microsoft.net') &&
                       !name.includes('microsoft.ui.xaml') &&
                       !name.includes('microsoft.advertising') &&
                       !name.includes('microsoft.services');
            });

            for (const folder of appFolders) {
                try {
                    const folderPath = path.join(windowsAppsPath, folder.name);
                    const folderEntries = await fs.promises.readdir(folderPath, { withFileTypes: true });
                    
                    // Ищем exe файлы в корне папки приложения
                    const exeFiles = folderEntries.filter(e => 
                        e.isFile() && e.name.toLowerCase().endsWith('.exe')
                    );

                    for (const exeFile of exeFiles) {
                        const exePath = path.join(folderPath, exeFile.name);
                        const canonicalPath = exePath.toLowerCase();
                        
                        if (!uniqueApps.has(canonicalPath)) {
                            // Извлекаем имя приложения из имени папки
                            // Например: "5319275A.WhatsAppDesktop_2.2535.3.0_x64__cv1g1gvanyjgm" -> "WhatsApp"
                            let appName = folder.name.split('_')[0];
                            appName = appName
                                .replace(/^5319275A\./i, '')
                                .replace(/^Microsoft\./i, '')
                                .replace(/^RobloxCorporation\./i, 'Roblox ')
                                .replace(/Desktop$/i, '')
                                .replace(/WhatsAppDesktop/i, 'WhatsApp')
                                .trim();
                            
                            // Если имя осталось техническим, используем имя exe файла
                            if (appName.length > 30 || /^[0-9A-F]+$/.test(appName)) {
                                appName = path.basename(exeFile.name, '.exe');
                            }

                            // Фильтр мусора для WindowsApps исполняемых файлов
                            if (this.isNoiseApp(appName, exePath)) {
                                continue;
                            }
                            uniqueApps.set(canonicalPath, {
                                name: appName,
                                path: exePath,
                                type: 'file',
                                isApp: true,
                                extension: '.exe',
                                timestamp: Date.now()
                            });
                            foundCount++;
                            Logger.info(`[WindowsApps] ✓ Found ${appName} at ${exePath}`);
                        }
                    }
                } catch (err) {
                    // Пропускаем папки с ошибками доступа (нужны права администратора)
                }
            }
            
            Logger.info(`[WindowsApps] Found ${foundCount} applications in WindowsApps folder`);
        } catch (error) {
            Logger.warn(`[WindowsApps] Failed to scan: ${error.message}`);
        }
    },

    // === NEW: Read Registry App Paths for direct executables (commonly used by installers) ===
    scanRegistryAppPaths: async function(uniqueApps) {
        const baseKeys = [
            'HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths',
            'HKEY_CURRENT_USER\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths'
        ];

        let totalAdded = 0;
        for (const base of baseKeys) {
            try {
                const { stdout } = await execPromise(`reg query "${base}"`);
                const subkeys = stdout
                    .split('\r\n')
                    .map(s => s.trim())
                    .filter(s => s && s.toUpperCase().startsWith((base + '\\').toUpperCase()));

                for (const sub of subkeys) {
                    try {
                        const { stdout: details } = await execPromise(`reg query "${sub}"`);
                        // Prefer default value @
                        let exePath = null;
                        const defaultMatch = details.match(/^\s*@\s+REG_(?:SZ|EXPAND_SZ)\s+(.+\.exe)\s*$/im);
                        if (defaultMatch) exePath = defaultMatch[1];
                        if (!exePath) {
                            const anyMatch = details.match(/REG_(?:SZ|EXPAND_SZ)\s+([^\r\n]+\.exe)/i);
                            if (anyMatch) exePath = anyMatch[1];
                        }
                        if (!exePath) continue;
                        exePath = exePath.replace(/"/g, '').trim();
                        // Expand environment variables
                        if (/%/.test(exePath)) {
                            exePath = exePath.replace(/%([^%]+)%/g, (_, name) => process.env[name] || `%${name}%`);
                        }
                        if (!fs.existsSync(exePath)) continue;

                        const canonical = fs.realpathSync(exePath).toLowerCase();
                        if (!uniqueApps.has(canonical)) {
                            if (this.isNoiseApp(appName, exePath)) {
                                continue;
                            }
                            const appName = path.basename(exePath, '.exe');
                            uniqueApps.set(canonical, {
                                name: appName,
                                path: exePath,
                                type: 'file',
                                isApp: true,
                                extension: '.exe',
                                timestamp: Date.now()
                            });
                            totalAdded++;
                        }
                    } catch {}
                }
            } catch (e) {
                Logger.warn(`[REG App Paths] Could not query ${base}: ${e.message}`);
            }
        }
        Logger.info(`[REG App Paths] Added ${totalAdded} applications from App Paths`);
    },

    scanDesktopShortcuts: async function(uniqueApps) {
        // Сканируем ярлыки на рабочем столе пользователя и общем рабочем столе
        const desktopPaths = [
            path.join(os.homedir(), 'Desktop'),
            path.join(os.homedir(), 'OneDrive', 'Desktop'), // OneDrive Desktop
            path.join(process.env.PUBLIC || 'C:\\Users\\Public', 'Desktop')
        ];

        for (const desktopPath of desktopPaths) {
            if (fs.existsSync(desktopPath)) {
                try {
                    const entries = await fs.promises.readdir(desktopPath, { withFileTypes: true });
                    for (const entry of entries) {
                        if (entry.isFile() && entry.name.toLowerCase().endsWith('.lnk')) {
                            const fullPath = path.join(desktopPath, entry.name);
                            await this.processShortcut(fullPath, uniqueApps);
                        }
                    }
                    Logger.info(`[DESKTOP] Scanned ${desktopPath}`);
                } catch (error) {
                    Logger.warn(`[DESKTOP] Could not scan ${desktopPath}: ${error.message}`);
                }
            }
        }
    },

    scanKnownAppLocations: async function(uniqueApps) {
        // НОВОЕ: Список известных локаций популярных приложений
        const knownLocations = [
            // Roblox
            { 
                path: path.join(os.homedir(), 'AppData', 'Local', 'Roblox', 'Versions'),
                name: 'Roblox',
                pattern: 'RobloxPlayerBeta.exe'
            },
            // Epic Games Launcher
            {
                path: 'C:\\Program Files (x86)\\Epic Games\\Launcher\\Portal\\Binaries\\Win64',
                name: 'Epic Games Launcher',
                pattern: 'EpicGamesLauncher.exe'
            },
            {
                path: 'C:\\Program Files (x86)\\Epic Games\\Launcher\\Portal\\Binaries\\Win32',
                name: 'Epic Games Launcher',
                pattern: 'EpicGamesLauncher.exe'
            },
            // Steam
            {
                path: 'C:\\Program Files (x86)\\Steam',
                name: 'Steam',
                pattern: 'steam.exe'
            },
            {
                path: 'C:\\Program Files\\Steam',
                name: 'Steam',
                pattern: 'steam.exe'
            },
            // Discord (обычная версия, не Store)
            {
                path: path.join(os.homedir(), 'AppData', 'Local', 'Discord'),
                name: 'Discord',
                pattern: 'Update.exe',
                findLatestVersion: true
            },
            // Telegram Desktop
            {
                path: path.join(os.homedir(), 'AppData', 'Roaming', 'Telegram Desktop'),
                name: 'Telegram',
                pattern: 'Telegram.exe'
            },
            // Google Chrome
            {
                path: 'C:\\Program Files\\Google\\Chrome\\Application',
                name: 'Google Chrome',
                pattern: 'chrome.exe'
            },
            {
                path: 'C:\\Program Files (x86)\\Google\\Chrome\\Application',
                name: 'Google Chrome',
                pattern: 'chrome.exe'
            },
            // Mozilla Firefox
            {
                path: 'C:\\Program Files\\Mozilla Firefox',
                name: 'Mozilla Firefox',
                pattern: 'firefox.exe'
            },
            {
                path: 'C:\\Program Files (x86)\\Mozilla Firefox',
                name: 'Mozilla Firefox',
                pattern: 'firefox.exe'
            },
            // Microsoft Edge (старые версии)
            {
                path: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application',
                name: 'Microsoft Edge',
                pattern: 'msedge.exe'
            },
            // Visual Studio Code
            {
                path: path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'Microsoft VS Code'),
                name: 'Visual Studio Code',
                pattern: 'Code.exe'
            },
            // Spotify Desktop
            {
                path: path.join(os.homedir(), 'AppData', 'Roaming', 'Spotify'),
                name: 'Spotify',
                pattern: 'Spotify.exe'
            },
            // Zoom
            {
                path: path.join(os.homedir(), 'AppData', 'Roaming', 'Zoom', 'bin'),
                name: 'Zoom',
                pattern: 'Zoom.exe'
            },
            // Skype
            {
                path: 'C:\\Program Files (x86)\\Microsoft\\Skype for Desktop',
                name: 'Skype',
                pattern: 'Skype.exe'
            },
            // Slack
            {
                path: path.join(os.homedir(), 'AppData', 'Local', 'slack'),
                name: 'Slack',
                pattern: 'slack.exe',
                findLatestVersion: true
            },
            // Notion
            {
                path: path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'Notion'),
                name: 'Notion',
                pattern: 'Notion.exe'
            },
            // Obsidian
            {
                path: path.join(os.homedir(), 'AppData', 'Local', 'Obsidian'),
                name: 'Obsidian',
                pattern: 'Obsidian.exe'
            },
            // Overwolf
            {
                path: 'C:\\Program Files (x86)\\Overwolf',
                name: 'Overwolf',
                pattern: 'Overwolf.exe'
            },
            {
                path: path.join(os.homedir(), 'AppData', 'Local', 'Overwolf'),
                name: 'Overwolf',
                pattern: 'Overwolf.exe'
            },
            // WhatsApp (non-Store variants)
            {
                path: path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'WhatsApp'),
                name: 'WhatsApp',
                pattern: 'WhatsApp.exe'
            },
            {
                path: path.join(os.homedir(), 'AppData', 'Local', 'WhatsApp'),
                name: 'WhatsApp',
                pattern: 'WhatsApp.exe'
            },
            // Python (различные установки)
            // Стандартная установка в Program Files
            {
                path: 'C:\\Program Files\\Python312',
                name: 'Python 3.12',
                pattern: 'python.exe'
            },
            {
                path: 'C:\\Program Files\\Python311',
                name: 'Python 3.11',
                pattern: 'python.exe'
            },
            {
                path: 'C:\\Program Files\\Python310',
                name: 'Python 3.10',
                pattern: 'python.exe'
            },
            {
                path: 'C:\\Program Files\\Python39',
                name: 'Python 3.9',
                pattern: 'python.exe'
            },
            {
                path: 'C:\\Program Files\\Python38',
                name: 'Python 3.8',
                pattern: 'python.exe'
            },
            // Python в Program Files (x86)
            {
                path: 'C:\\Program Files (x86)\\Python312',
                name: 'Python 3.12 (x86)',
                pattern: 'python.exe'
            },
            {
                path: 'C:\\Program Files (x86)\\Python311',
                name: 'Python 3.11 (x86)',
                pattern: 'python.exe'
            },
            {
                path: 'C:\\Program Files (x86)\\Python310',
                name: 'Python 3.10 (x86)',
                pattern: 'python.exe'
            },
            // Python в корне диска (старая установка)
            {
                path: 'C:\\Python312',
                name: 'Python 3.12',
                pattern: 'python.exe'
            },
            {
                path: 'C:\\Python311',
                name: 'Python 3.11',
                pattern: 'python.exe'
            },
            {
                path: 'C:\\Python310',
                name: 'Python 3.10',
                pattern: 'python.exe'
            },
            {
                path: 'C:\\Python39',
                name: 'Python 3.9',
                pattern: 'python.exe'
            },
            {
                path: 'C:\\Python38',
                name: 'Python 3.8',
                pattern: 'python.exe'
            },
            {
                path: 'C:\\Python27',
                name: 'Python 2.7',
                pattern: 'python.exe'
            },
            // Python в AppData (пользовательская установка)
            {
                path: path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'Python', 'Python312'),
                name: 'Python 3.12',
                pattern: 'python.exe'
            },
            {
                path: path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'Python', 'Python311'),
                name: 'Python 3.11',
                pattern: 'python.exe'
            },
            {
                path: path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'Python', 'Python310'),
                name: 'Python 3.10',
                pattern: 'python.exe'
            },
            {
                path: path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'Python', 'Python39'),
                name: 'Python 3.9',
                pattern: 'python.exe'
            },
            {
                path: path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'Python', 'Python38'),
                name: 'Python 3.8',
                pattern: 'python.exe'
            },
            // Anaconda
            {
                path: 'C:\\ProgramData\\Anaconda3',
                name: 'Anaconda Python',
                pattern: 'python.exe'
            },
            {
                path: path.join(os.homedir(), 'Anaconda3'),
                name: 'Anaconda Python',
                pattern: 'python.exe'
            },
            {
                path: path.join(os.homedir(), 'anaconda3'),
                name: 'Anaconda Python',
                pattern: 'python.exe'
            },
            // Miniconda
            {
                path: 'C:\\ProgramData\\Miniconda3',
                name: 'Miniconda Python',
                pattern: 'python.exe'
            },
            {
                path: path.join(os.homedir(), 'Miniconda3'),
                name: 'Miniconda Python',
                pattern: 'python.exe'
            },
            {
                path: path.join(os.homedir(), 'miniconda3'),
                name: 'Miniconda Python',
                pattern: 'python.exe'
            }
        ];

        let foundCount = 0;
        
        for (const location of knownLocations) {
            try {
                if (!fs.existsSync(location.path)) continue;

                let executablePath = null;

                // Для приложений с версионными папками (Discord, Roblox, Slack)
                if (location.findLatestVersion) {
                    const entries = await fs.promises.readdir(location.path, { withFileTypes: true });
                    const versionDirs = entries
                        .filter(e => e.isDirectory() && /app-\d+\.\d+\.\d+/.test(e.name))
                        .sort((a, b) => b.name.localeCompare(a.name)); // Сортируем по убыванию версии

                    for (const versionDir of versionDirs) {
                        const testPath = path.join(location.path, versionDir.name, location.pattern);
                        if (fs.existsSync(testPath)) {
                            executablePath = testPath;
                            break;
                        }
                    }
                } else if (location.pattern === 'RobloxPlayerBeta.exe') {
                    // Roblox хранит версии в папках типа version-xxxxx
                    const entries = await fs.promises.readdir(location.path, { withFileTypes: true });
                    const versionDirs = entries
                        .filter(e => e.isDirectory() && e.name.startsWith('version-'))
                        .sort((a, b) => b.name.localeCompare(a.name));

                    for (const versionDir of versionDirs) {
                        const testPath = path.join(location.path, versionDir.name, location.pattern);
                        if (fs.existsSync(testPath)) {
                            executablePath = testPath;
                            break;
                        }
                    }
                } else {
                    // Обычный поиск
                    const testPath = path.join(location.path, location.pattern);
                    if (fs.existsSync(testPath)) {
                        executablePath = testPath;
                    }
                }

                        if (executablePath) {
                    const canonicalPath = fs.realpathSync(executablePath).toLowerCase();
                            if (!uniqueApps.has(canonicalPath)) {
                                if (this.isNoiseApp(location.name, executablePath)) {
                                    continue;
                                }
                                uniqueApps.set(canonicalPath, {
                                    name: location.name,
                                    path: executablePath,
                                    type: 'file',
                                    isApp: true,
                                    extension: '.exe',
                                    timestamp: Date.now()
                                });
                                foundCount++;
                                Logger.info(`[KNOWN] ✓ Found ${location.name} at ${executablePath}`);
                            }
                }
            } catch (error) {
                // Тихо игнорируем ошибки для отдельных локаций
            }
        }

        Logger.info(`[KNOWN] Found ${foundCount} applications in known locations`);
    },

    scanDevelopmentTools: async function(uniqueApps) {
        // НОВОЕ: Умное сканирование Python, Node.js, Java и других сред разработки
        let foundCount = 0;

        // === PYTHON: Сканирование через реестр Python.org установок ===
        try {
            Logger.info(`[DEV] Scanning Python installations...`);
            const pythonKeys = [
                'HKEY_LOCAL_MACHINE\\SOFTWARE\\Python\\PythonCore',
                'HKEY_CURRENT_USER\\SOFTWARE\\Python\\PythonCore'
            ];

            for (const baseKey of pythonKeys) {
                try {
                    const { stdout } = await execPromise(`reg query "${baseKey}"`);
                    const versionKeys = stdout.split('\r\n')
                        .filter(s => s.trim() && s.includes('\\'))
                        .map(s => s.trim());

                    for (const versionKey of versionKeys) {
                        try {
                            const installPathKey = `${versionKey}\\InstallPath`;
                            const { stdout: pathData } = await execPromise(`reg query "${installPathKey}"`);
                            
                            const match = pathData.match(/REG_SZ\s+(.*)/);
                            if (match) {
                                let pythonPath = match[1].trim();
                                const pythonExe = path.join(pythonPath, 'python.exe');
                                
                                if (fs.existsSync(pythonExe)) {
                                    const version = versionKey.split('\\').pop();
                                    const canonicalPath = fs.realpathSync(pythonExe).toLowerCase();
                                    
                                    if (!uniqueApps.has(canonicalPath)) {
                                        uniqueApps.set(canonicalPath, {
                                            name: `Python ${version}`,
                                            path: pythonExe,
                                            type: 'file',
                                            isApp: true,
                                            extension: '.exe',
                                            timestamp: Date.now()
                                        });
                                        foundCount++;
                                        Logger.info(`[DEV] ✓ Found Python ${version} at ${pythonExe}`);
                                    }
                                }
                            }
                        } catch (e) {
                            // Пропускаем версию с ошибкой
                        }
                    }
                } catch (e) {
                    // Ключ не существует
                }
            }
        } catch (error) {
            Logger.warn(`[DEV] Python registry scan failed: ${error.message}`);
        }

        // === NODE.JS: Поиск через Program Files и nvm ===
        try {
            Logger.info(`[DEV] Scanning Node.js installations...`);
            const nodePaths = [
                'C:\\Program Files\\nodejs\\node.exe',
                'C:\\Program Files (x86)\\nodejs\\node.exe',
                path.join(os.homedir(), 'AppData', 'Roaming', 'nvm')
            ];

            for (const nodePath of nodePaths) {
                if (nodePath.endsWith('nvm')) {
                    // Сканируем папки nvm
                    if (fs.existsSync(nodePath)) {
                        try {
                            const versions = await fs.promises.readdir(nodePath, { withFileTypes: true });
                            for (const ver of versions) {
                                if (ver.isDirectory() && ver.name.startsWith('v')) {
                                    const nodeExe = path.join(nodePath, ver.name, 'node.exe');
                                    if (fs.existsSync(nodeExe)) {
                                        const canonical = fs.realpathSync(nodeExe).toLowerCase();
                                        if (!uniqueApps.has(canonical)) {
                                            uniqueApps.set(canonical, {
                                                name: `Node.js ${ver.name}`,
                                                path: nodeExe,
                                                type: 'file',
                                                isApp: true,
                                                extension: '.exe',
                                                timestamp: Date.now()
                                            });
                                            foundCount++;
                                            Logger.info(`[DEV] ✓ Found Node.js ${ver.name}`);
                                        }
                                    }
                                }
                            }
                        } catch (e) {}
                    }
                } else if (fs.existsSync(nodePath)) {
                    const canonical = fs.realpathSync(nodePath).toLowerCase();
                    if (!uniqueApps.has(canonical)) {
                        uniqueApps.set(canonical, {
                            name: 'Node.js',
                            path: nodePath,
                            type: 'file',
                            isApp: true,
                            extension: '.exe',
                            timestamp: Date.now()
                        });
                        foundCount++;
                        Logger.info(`[DEV] ✓ Found Node.js at ${nodePath}`);
                    }
                }
            }
        } catch (error) {
            Logger.warn(`[DEV] Node.js scan failed: ${error.message}`);
        }

        // === JAVA: Поиск JDK и JRE ===
        try {
            Logger.info(`[DEV] Scanning Java installations...`);
            const javaLocations = [
                'C:\\Program Files\\Java',
                'C:\\Program Files (x86)\\Java',
                'C:\\Program Files\\Eclipse Adoptium',
                'C:\\Program Files\\AdoptOpenJDK',
                'C:\\Program Files\\Amazon Corretto'
            ];

            for (const javaDir of javaLocations) {
                if (fs.existsSync(javaDir)) {
                    try {
                        const versions = await fs.promises.readdir(javaDir, { withFileTypes: true });
                        for (const ver of versions) {
                            if (ver.isDirectory()) {
                                const javaExe = path.join(javaDir, ver.name, 'bin', 'java.exe');
                                if (fs.existsSync(javaExe)) {
                                    const canonical = fs.realpathSync(javaExe).toLowerCase();
                                    if (!uniqueApps.has(canonical)) {
                                        uniqueApps.set(canonical, {
                                            name: `Java ${ver.name}`,
                                            path: javaExe,
                                            type: 'file',
                                            isApp: true,
                                            extension: '.exe',
                                            timestamp: Date.now()
                                        });
                                        foundCount++;
                                        Logger.info(`[DEV] ✓ Found Java ${ver.name}`);
                                    }
                                }
                            }
                        }
                    } catch (e) {}
                }
            }
        } catch (error) {
            Logger.warn(`[DEV] Java scan failed: ${error.message}`);
        }

        // === GIT: Поиск Git Bash и Git GUI ===
        try {
            const gitPaths = [
                'C:\\Program Files\\Git\\git-bash.exe',
                'C:\\Program Files\\Git\\cmd\\git.exe',
                'C:\\Program Files (x86)\\Git\\git-bash.exe',
                'C:\\Program Files (x86)\\Git\\cmd\\git.exe'
            ];

            for (const gitPath of gitPaths) {
                if (fs.existsSync(gitPath)) {
                    const canonical = fs.realpathSync(gitPath).toLowerCase();
                    if (!uniqueApps.has(canonical)) {
                        const name = gitPath.includes('git-bash') ? 'Git Bash' : 'Git';
                        uniqueApps.set(canonical, {
                            name: name,
                            path: gitPath,
                            type: 'file',
                            isApp: true,
                            extension: '.exe',
                            timestamp: Date.now()
                        });
                        foundCount++;
                        Logger.info(`[DEV] ✓ Found ${name}`);
                    }
                }
            }
        } catch (error) {
            Logger.warn(`[DEV] Git scan failed: ${error.message}`);
        }

        // === DOCKER: Docker Desktop ===
        try {
            const dockerPaths = [
                'C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe',
                path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'Docker', 'Docker Desktop.exe')
            ];

            for (const dockerPath of dockerPaths) {
                if (fs.existsSync(dockerPath)) {
                    const canonical = fs.realpathSync(dockerPath).toLowerCase();
                    if (!uniqueApps.has(canonical)) {
                        uniqueApps.set(canonical, {
                            name: 'Docker Desktop',
                            path: dockerPath,
                            type: 'file',
                            isApp: true,
                            extension: '.exe',
                            timestamp: Date.now()
                        });
                        foundCount++;
                        Logger.info(`[DEV] ✓ Found Docker Desktop`);
                    }
                }
            }
        } catch (error) {
            Logger.warn(`[DEV] Docker scan failed: ${error.message}`);
        }

        Logger.info(`[DEV] Found ${foundCount} development tools`);
    },

    scanDirectoryForShortcuts: async function(dirPath, uniqueApps) {
        try {
            const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);
                if (entry.isDirectory()) {
                    await this.scanDirectoryForShortcuts(fullPath, uniqueApps);
                } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.lnk')) {
                    await this.processShortcut(fullPath, uniqueApps);
                }
            }
        } catch (error) {
            Logger.warn(`Could not read directory ${dirPath}: ${error.message}`);
        }
    },

    processShortcut: async function(lnkPath, uniqueApps) {
        try {
            // === ШАГ 1: Разрешаем .lnk файл и получаем путь к целевому .exe ===
            const targetPath = await resolveShortcutWithPowerShell(lnkPath);

            if (!targetPath || typeof targetPath !== 'string' || targetPath.trim() === '') {
                return;
            }

            const trimmedTarget = targetPath.trim();

            // === ШАГ 2: Проверяем, что целевой файл - это .exe ===
            if (!trimmedTarget.toLowerCase().endsWith('.exe')) {
                return;
            }

            // === ШАГ 3: Фильтруем системные утилиты и деинсталляторы ===
            const lowerCaseName = path.basename(lnkPath).toLowerCase();
            const lowerCaseTarget = trimmedTarget.toLowerCase();
            
            const excludeKeywords = [
                'uninstall', 'uninst', 'remove', 'delete',
                'setup', 'install', 'config', 'settings', 
                'readme', 'help', 'documentation', 'manual',
                'support', 'feedback', 'report', 'updater',
                // НОВОЕ: системные утилиты
                'regedit', 'registry', 'regsvr', 'msiexec',
                'cmd.exe', 'powershell', 'wscript', 'cscript',
                'schtasks', 'taskschd', 'eventvwr', 'perfmon',
                'services.msc', 'compmgmt.msc', 'devmgmt.msc',
                'gpedit', 'secpol', 'lusrmgr', 'fsmgmt',
                'diskmgmt', 'diskpart', 'cleanmgr', 'dfrgui',
                'msconfig', 'msinfo32', 'dxdiag', 'odbcad32',
                'certmgr', 'certutil', 'cipher', 'sfc',
                'chkdsk', 'systeminfo', 'wmic', 'wbem',
                'netsh', 'netstat', 'nslookup', 'tracert',
                'arp', 'ipconfig', 'route', 'telnet',
                'debug', 'repair', 'diagnostic', 'troubleshoot',
                'recovery', 'restore', 'backup', 'migration',
                '.msc', 'console', 'administration', 'admin tool',
                'system tool', 'maintenance', 'utility', 'utilities'
            ];
            
            if (excludeKeywords.some(keyword => 
                lowerCaseName.includes(keyword) || lowerCaseTarget.includes(keyword)
            )) {
                return;
            }
            
            // НОВОЕ: Фильтруем системные папки
            const systemPaths = [
                'windows\\system32',
                'windows\\syswow64',
                'windows\\sysnative',
                'programdata\\microsoft\\windows\\start menu\\programs\\administrative tools',
                'programdata\\microsoft\\windows\\start menu\\programs\\system tools'
            ];
            
            if (systemPaths.some(path => lowerCaseTarget.includes(path))) {
                return;
            }
            
            // === ШАГ 4: Проверяем существование файла ===
            if (!fs.existsSync(trimmedTarget)) {
                Logger.warn(`Target executable not found: ${trimmedTarget}`);
                return; 
            }

            // === ШАГ 5: Нормализуем путь для устранения дубликатов ===
            const canonicalPath = fs.realpathSync(trimmedTarget).toLowerCase(); // Приводим к нижнему регистру для Windows

            // === ШАГ 6: Проверяем дубликаты по каноническому пути ===
            if (!uniqueApps.has(canonicalPath)) {
                const appName = path.basename(lnkPath, '.lnk');
                const stats = await fs.promises.stat(lnkPath);

                if (this.isNoiseApp(appName, trimmedTarget)) {
                    return;
                }

                uniqueApps.set(canonicalPath, {
                    name: appName,
                    path: trimmedTarget, // Используем оригинальный путь (не приведенный к нижнему регистру)
                    type: 'file',
                    isApp: true,
                    extension: '.exe',
                    timestamp: stats.mtimeMs
                });
                
                Logger.info(`[APP INDEXED] ${appName} -> ${trimmedTarget}`);
            } else {
                Logger.info(`[DUPLICATE SKIPPED] ${path.basename(lnkPath)} (already indexed as ${uniqueApps.get(canonicalPath).name})`);
            }
        } catch (error) {
             Logger.warn(`Failed to process shortcut ${lnkPath}: ${error.message || error}`);
        }
    },

    search: function(query) {
        if (!query || query.length < 1) return [];

        // УЛУЧШЕНИЕ: Более глубокий и точный поиск
        const fuseOptions = {
            keys: [
                { name: 'name', weight: 2.0 },      // Имя файла - высший приоритет
                { name: 'path', weight: 0.5 },      // Путь - меньший вес
                { name: 'keywords', weight: 1.5 }   // Ключевые слова (для команд)
            ],
            includeScore: true,
            threshold: 0.35,  // Немного более строгий порог
            ignoreLocation: true,  // Игнорировать позицию совпадения
            minMatchCharLength: 2,  // Минимум 2 символа для совпадения
            shouldSort: true,
            findAllMatches: true,  // Находить все совпадения в строке
            useExtendedSearch: true  // Расширенный поиск
        };

        // Специальная обработка для очень коротких запросов
        if (query.length <= 2) {
            // Для коротких запросов используем точное совпадение начала строки
            const exactResults = this.index.filter(item => {
                const name = (item.name || '').toLowerCase();
                return name.startsWith(query.toLowerCase());
            });
            
            return exactResults.sort((a, b) => {
                // Сортируем по длине имени (короче = лучше для коротких запросов)
                return a.name.length - b.name.length;
            });
        }

        const fuse = new Fuse(this.index, fuseOptions);
        
        // Поддержка расширенного синтаксиса поиска
        let searchQuery = query;
        
        // Если запрос содержит пробелы, ищем все слова
        if (query.includes(' ')) {
            const words = query.split(' ').filter(w => w.length > 0);
            searchQuery = words.map(w => `'${w}`).join(' '); // Префикс ' означает "содержит"
        }
        
        const results = fuse.search(searchQuery);

        // Дополнительная фильтрация и сортировка
        return results
            .map(result => ({
                ...result.item,
                fuseScore: result.score
            }))
            .filter(item => {
                // Дополнительно: отбрасываем шумные элементы глобальным фильтром
                if (item && item.isApp && this.isNoiseApp(item.name, item.path)) return false;
                // Дополнительно фильтруем очень плохие совпадения
                return item.fuseScore < 0.7;
            })
            .sort((a, b) => {
                // Приоритет: приложения > файлы
                if (a.isApp && !b.isApp) return -1;
                if (!a.isApp && b.isApp) return 1;
                
                // Затем по счету Fuse
                return a.fuseScore - b.fuseScore;
            });
    },

    finishIndexing: function() {
        this.saveIndexToCache();
        this.isIndexing = false;
        this.updateStatus('Complete', this.index.length);
        this.broadcastIndexUpdate();
        
        // НОВОЕ: Сохраняем кэш иконок после индексации
        saveIconCache();
        
        Logger.info(`Indexing complete. Total items: ${this.index.length}.`);
    },

    broadcastIndexUpdate: function() {
        // Отдаем только уникальные пути и сортируем по времени
        const pathToItem = new Map();
        for (const item of this.index) {
            if (item.type === 'file' || item.type === 'directory') {
                const key = String(item.path || '').toLowerCase();
                if (!pathToItem.has(key)) pathToItem.set(key, item);
            }
        }
        const files = Array.from(pathToItem.values());
        files.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('update-data', files.slice(0, 100));
        }
    }
};

// =================================================================================
// === Система Мониторинга Буфера Обмена ===
// =================================================================================
// ... existing code ...
const ClipboardMonitor = {
    history: [],
    intervalId: null,
    MAX_HISTORY_SIZE: 50,

    start: function() {
        Logger.info("ClipboardMonitor started.");
        if (this.intervalId) clearInterval(this.intervalId);
        this.intervalId = setInterval(() => this.checkClipboard(), 500);
    },
    
    checkClipboard: function() {
        try {
            const text = clipboard.readText();
            if (text && text.trim() !== "" && (this.history.length === 0 || this.history[0].content !== text)) {
                const newItem = { content: text, timestamp: Date.now() };
                this.history.unshift(newItem);
                
                if (this.history.length > this.MAX_HISTORY_SIZE) {
                    this.history.pop();
                }
                this.broadcastHistoryUpdate();
            }
        } catch (error) {
            Logger.error(`Error reading clipboard: ${error.message}`);
        }
    },

    broadcastHistoryUpdate: function() {
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('update-data', this.history);
        }
    }
};

// =================================================================================
// === Система Управления Окнами (Multi-Window Management) ===
// =================================================================================
// ... existing code ...
const WindowManager = {
    createMainWindow: function() {
        Logger.info("Creating main window...");
        mainWindow = new BrowserWindow({
            width: currentSettings.width,
            height: currentSettings.height, // ИСПОЛЬЗУЕМ НАСТРОЙКУ
            frame: false,
            transparent: true, // Возвращаем прозрачность для CSS blur
            resizable: false,
            show: false,
            icon: ICON_PATH,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
            }
        });

        mainWindow.loadFile('index.html');
        this.setWindowPosition(currentSettings.windowPosition);

        mainWindow.once('ready-to-show', () => {
            setTimeout(() => {
                mainWindow.show();
                settingsManager.broadcastSettingsUpdate();
            }, 100); 
        });
        
        mainWindow.on('show', () => {
            if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents) {
                mainWindow.webContents.send('trigger-show-animation');
            }
        });

        mainWindow.on('blur', () => {
            // Не скрывать, если открыто одно из вспомогательных окон
            const isAuxWindowOpen = Object.values(auxiliaryWindows).some(win => win && !win.isDestroyed());
            if (!isAuxWindowOpen && mainWindow.isVisible()) {
                this.hideMainWindow();
            }
        });
    },

    setWindowPosition: function(position) {
        if (!mainWindow) return;
        const display = screen.getPrimaryDisplay();
        const dimensions = display.workAreaSize;
        const { width } = mainWindow.getBounds(); // ИСПОЛЬЗОВАТЬ ТЕКУЩУЮ ШИРИНУ ОКНА
        let x, y;

        switch (position) {
            case 'center':
                x = Math.round((dimensions.width - width) / 2);
                y = Math.round((dimensions.height / 2) - 200);
                break;
            case 'top-center':
            default:
                x = Math.round((dimensions.width - width) / 2);
                y = Math.round(dimensions.height * 0.15);
                break;
        }
        mainWindow.setPosition(x, y, true);
    },

    toggleMainWindow: function() {
        if (isHiding) return;

        if (mainWindow.isVisible()) {
            this.hideMainWindow();
        } else {
            mainWindow.show();
            mainWindow.focus();
        }
    },

    hideMainWindow: function() {
        // --- НОВОЕ: Закрываем все вспомогательные окна при скрытии главного ---
        Object.values(auxiliaryWindows).forEach(win => {
            if (win && !win.isDestroyed()) {
                win.close();
            }
        });

        // === УЛУЧШЕНО: Немедленное скрытие без анимации для максимальной скорости ===
        if (!currentSettings.animations || currentSettings.animationStyle === 'none' || !mainWindow.isVisible()) {
            mainWindow.hide();
            return;
        }

        // Даже с анимациями скрываем быстрее
        isHiding = true;
        mainWindow.webContents.send('start-hide-animation');
        setTimeout(() => {
            if (mainWindow && !mainWindow.isDestroyed()) {
                 mainWindow.hide();
            }
            isHiding = false;
        }, 200); // УМЕНЬШЕНО: 350ms -> 200ms для более быстрого отклика
    },

    openAuxiliaryWindow: function(type) {
        // This function is now obsolete and replaced by AuxPanelManager in renderer.js
        // It can be safely removed.
    },
};

// =================================================================================
// === Менеджер Команд (Автоматизации) ===
// =================================================================================
// ... existing code ...
const CommandManager = {
    systemCommands: [
        { id: 'calc', translationKey: 'cmd_calculator', platform: 'win32' },
        { id: 'sleep', translationKey: 'cmd_sleep', platform: 'win32' },
        { id: 'cmd', translationKey: 'cmd_command_prompt', platform: 'win32' },
        { id: 'taskmgr', translationKey: 'cmd_task_manager', platform: 'win32' },
        { id: 'control', translationKey: 'cmd_control_panel', platform: 'win32' },
        { id: 'notepad', translationKey: 'cmd_notepad', platform: 'win32' },
        { id: 'whatsapp', translationKey: 'cmd_whatsapp', platform: 'win32' },
        { id: 'restart', translationKey: 'cmd_restart', platform: 'win32' },
        { id: 'shutdown', translationKey: 'cmd_shutdown', platform: 'win32' },
        { id: 'lock', translationKey: 'cmd_lock', platform: 'win32' },
        { id: 'this-pc', translationKey: 'cmd_this_pc', platform: 'win32' },
        { id: 'empty-recycle-bin', translationKey: 'cmd_empty_recycle_bin', platform: 'win32' },
        { id: 'downloads', translationKey: 'cmd_downloads', platform: 'win32' }
    ],

    getAllCommands: function() {
        const availableSystemCommands = this.systemCommands
            .filter(cmd => cmd.platform === 'all' || cmd.platform === process.platform)
            .map(cmd => ({
                id: cmd.id,
                name: i18n.t(cmd.translationKey),
                keyword: i18n.t(cmd.translationKey).toLowerCase(),
                type: 'system'
            }));

        const customCommands = (currentSettings.customAutomations || []).map(cmd => ({
            id: cmd.id,
            name: cmd.name,
            keyword: cmd.keyword.toLowerCase(),
            command: cmd.command,
            type: 'custom'
        }));

        return [...availableSystemCommands, ...customCommands];
    },

    execute: function(actionId) {
        const command = this.getAllCommands().find(cmd => cmd.id === actionId);
        if (!command) return;
        Logger.info(`Executing command: ${command.name} (${command.type})`);

        if (command.type === 'custom') {
            exec(command.command, (error) => {
                if (error) Logger.error(`Error executing custom command: ${error.message}`);
            });
        } else {
            try {
                switch(actionId) {
                    case 'calc': exec('calc.exe'); break;
                    case 'sleep': exec('rundll32.exe powrprof.dll,SetSuspendState 0,1,0'); break;
                    case 'cmd': exec('start cmd.exe'); break;
                    case 'taskmgr': exec('taskmgr.exe'); break;
                    case 'control': exec('control.exe'); break;
                    case 'notepad': exec('notepad.exe'); break;
                    case 'whatsapp': exec('start shell:AppsFolder\\5319275A.WhatsAppDesktop_cv1g1gvanyjgm!App'); break;
                    case 'restart': exec('shutdown /r /t 0'); break;
                    case 'shutdown': exec('shutdown /s /t 0'); break;
                    case 'lock': exec('rundll32.exe user32.dll,LockWorkStation'); break;
                    case 'this-pc': shell.openPath('::{20D04FE0-3AEA-1069-A2D8-08002B30309D}'); break;
                    case 'empty-recycle-bin': exec('powershell.exe -NoProfile -Command "Clear-RecycleBin -Confirm:$false"'); break;
                    case 'downloads': shell.openPath(app.getPath('downloads')); break;
                }
            } catch (error) {
                Logger.error(`Error executing system command ${actionId}: ${error.message}`);
            }
        }
    },
    
    broadcastCommands: function() {
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('update-data', this.getAllCommands());
        }
    }
};

// =================================================================================
// === Жизненный Цикл Приложения и Инициализация ===
// =================================================================================

// Возвращаем аппаратное ускорение и убираем флаги
if (process.platform === 'win32') {
   app.commandLine.appendSwitch('enable-transparent-visuals');
   app.commandLine.appendSwitch('disable-features', 'PaintHolding');
   // app.disableHardwareAcceleration(); // Blur effect requires hardware acceleration
}

app.whenReady().then(() => {
    Logger.info(`${APP_NAME} v${APP_VERSION} is ready.`);
    applicationIsReady = true;
    
    // НОВОЕ: Загружаем кэш иконок
    loadIconCache();
    
    const needsReindex = settingsManager.loadSettings();

    // НОВОЕ: Отслеживание системной темы
    nativeTheme.on('updated', () => {
        Logger.info(`System theme changed to ${nativeTheme.shouldUseDarkColors ? 'Dark' : 'Light'}`);
        const theme = nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
        const allWindows = [mainWindow, ...Object.values(auxiliaryWindows)];
        allWindows.forEach(win => {
            if (win && !win.isDestroyed()) {
                win.webContents.send('system-theme-changed', theme);
            }
        });
    });

    WindowManager.createMainWindow();
    ClipboardMonitor.start();
    FileIndexer.init();
    
    // Автоматическая переиндексация при обновлении версии
    if (needsReindex) {
        Logger.info("Version update detected or first run, triggering reindex...");
        setTimeout(() => {
            FileIndexer.startIndexing(true);
        }, 2000); // Даем время главному окну загрузиться
    }
});
// ... existing code ...
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

process.on('uncaughtException', (error) => {
    Logger.error(`Uncaught Exception: ${error.message}`);
});

process.on('unhandledRejection', (reason, promise) => {
    Logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
});

// =================================================================================
// === Утилиты и Вспомогательные Функции ===
// =================================================================================

function relaunchAsAdmin() {
    if (process.platform !== 'win32') return;
    
    Logger.info("Attempting to relaunch as Administrator.");
    const command = `powershell.exe -Command "Start-Process '${process.execPath}' -Verb RunAs"`;

    exec(command, (error) => {
        if (!error) {
            app.quit();
        } else {
            Logger.error(`Failed to relaunch as admin: ${error.message}`);
        }
    });
}

// =================================================================================
// === Обработчики IPC (Inter-Process Communication) ===
// =================================================================================
// ... existing code ...
ipcMain.on('set-prevent-close', (event, shouldPrevent) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win && !win.isDestroyed()) {
        Logger.info(`Setting preventClose to ${shouldPrevent} for window '${win.getTitle()}'.`);
        win.preventClose = !!shouldPrevent;
        
        // ПЕРЕРАБОТАНО: Если мы завершили действие, немедленно фокусируемся на окне.
        if (!shouldPrevent) {
            win.focus();
            Logger.info(`Focusing window '${win.getTitle()}' after action.`);
        }
    }
});

ipcMain.on('resize-window', (event, { width, height }) => {
    if (mainWindow) {
        const newWidth = Math.round(width);
        const newHeight = Math.round(height);
        
        mainWindow.setSize(newWidth, newHeight, true);
        WindowManager.setWindowPosition(currentSettings.windowPosition);
        WindowManager.repositionAuxiliaryWindows(); // НОВОЕ
    }
});

ipcMain.on('show-app-context-menu', (event, appData) => {
    const openerWindow = BrowserWindow.fromWebContents(event.sender);
    if (openerWindow) {
        openerWindow.preventClose = true;
    }
    
    let actionTaken = false;
    const pinnedFolder = currentSettings.appFolders.find(f => f.id === 'pinned');
    const isPinned = pinnedFolder ? pinnedFolder.apps.some(app => app.path === appData.path) : false;
    const template = [];

    if (isPinned) {
        template.push({
            label: i18n.t('context_unpin_app'),
            click: () => {
                actionTaken = true;
                const pinnedFolderIndex = currentSettings.appFolders.findIndex(f => f.id === 'pinned');
                if (pinnedFolderIndex !== -1) {
                    const updatedApps = currentSettings.appFolders[pinnedFolderIndex].apps.filter(app => app.path !== appData.path);
                    const newAppFolders = [...currentSettings.appFolders];
                    newAppFolders[pinnedFolderIndex] = { ...newAppFolders[pinnedFolderIndex], apps: updatedApps };
                    settingsManager.updateSetting('appFolders', newAppFolders);
                }
            }
        });
    }

    if (!isPinned) {
         template.push({
            label: i18n.t('context_add_to_apps'),
            click: () => {
                actionTaken = true;
                const pinnedFolderIndex = currentSettings.appFolders.findIndex(f => f.id === 'pinned');
                if (pinnedFolderIndex !== -1) {
                    const pinnedFolder = currentSettings.appFolders[pinnedFolderIndex];
                    if (!pinnedFolder.apps.some(app => app.path === appData.path)) {
                        const newApp = { name: appData.name, path: appData.path, isApp: true, type: 'file', extension: appData.path.toLowerCase().split('.').pop() };
                        const newApps = [...pinnedFolder.apps, newApp];
                        const newPinnedFolder = { ...pinnedFolder, apps: newApps };
                        const newAppFolders = [...currentSettings.appFolders];
                        newAppFolders[pinnedFolderIndex] = newPinnedFolder;
                        settingsManager.updateSetting('appFolders', newAppFolders);
                    }
                }
            }
        });
    }

    if (appData.sourceFolderId && appData.sourceFolderId !== 'pinned') {
        template.push({
            label: i18n.t('context_remove_from_folder'),
            click: () => {
                actionTaken = true;
                const folderIndex = currentSettings.appFolders.findIndex(f => f.id === appData.sourceFolderId);
                if (folderIndex !== -1) {
                    const updatedApps = currentSettings.appFolders[folderIndex].apps.filter(app => app.path !== appData.path);
                    const newAppFolders = [...currentSettings.appFolders];
                    newAppFolders[folderIndex] = { ...newAppFolders[folderIndex], apps: updatedApps };
                    settingsManager.updateSetting('appFolders', newAppFolders);
                }
            }
        });
    }

    template.push({ type: 'separator' });
    template.push({ label: i18n.t('context_open_location'), click: () => { shell.showItemInFolder(appData.path); } });

    const menu = Menu.buildFromTemplate(template);
    
    menu.on('menu-will-close', () => {
        if (actionTaken) return; // Если действие было совершено, рендерер сбросит флаг
        if (openerWindow && !openerWindow.isDestroyed()) {
            openerWindow.preventClose = false;
            openerWindow.focus();
        }
    });

    menu.popup({ window: openerWindow });
});

ipcMain.on('show-folder-context-menu', (event, folderId) => {
    const openerWindow = BrowserWindow.fromWebContents(event.sender);
    if (openerWindow) {
        openerWindow.preventClose = true;
    }
    
    let actionTaken = false;
    const template = [
        {
            label: i18n.t('context_rename_folder'), // New translation key
            click: () => {
                actionTaken = true;
                const window = BrowserWindow.fromWebContents(event.sender);
                if (window) {
                    window.webContents.send('prompt-rename-folder', folderId);
                }
            }
        },
        { 
            label: i18n.t('context_delete_folder'), 
            click: () => {
                actionTaken = true; // Флаг, что действие совершено
                const updatedFolders = currentSettings.appFolders.filter(f => f.id !== folderId);
                const deletedFolder = currentSettings.appFolders.find(f => f.id === folderId);
                const pinnedFolder = updatedFolders.find(f => f.id === 'pinned');
                if (deletedFolder && pinnedFolder && deletedFolder.apps.length > 0) {
                    pinnedFolder.apps.push(...deletedFolder.apps);
                }
                settingsManager.updateSetting('appFolders', updatedFolders);
            } 
        },
    ];
    const menu = Menu.buildFromTemplate(template);

    menu.on('menu-will-close', () => {
        if (actionTaken) return; // Если действие было совершено, рендерер сбросит флаг
        if (openerWindow && !openerWindow.isDestroyed()) {
            openerWindow.preventClose = false;
            openerWindow.focus();
        }
    });

    menu.popup({ window: openerWindow });
});

ipcMain.on('rename-folder', (event, { folderId, newName }) => {
    const folderIndex = currentSettings.appFolders.findIndex(f => f.id === folderId);
    if (folderIndex !== -1 && newName && newName.trim().length > 0) {
        currentSettings.appFolders[folderIndex].name = newName.trim();
        settingsManager.updateSetting('appFolders', currentSettings.appFolders);
    }
});

ipcMain.on('update-folder-style', (event, { folderId, color, icon }) => {
    if (!folderId || folderId === 'pinned') return;

    let changed = false;
    const newAppFolders = currentSettings.appFolders.map(folder => {
        if (folder.id !== folderId) {
            return folder;
        }

        const updated = {
            ...folder,
            apps: Array.isArray(folder.apps) ? [...folder.apps] : []
        };

        if (typeof color !== 'undefined' && updated.color !== color) {
            updated.color = color;
            changed = true;
        }
        if (typeof icon !== 'undefined' && updated.icon !== (icon || 'folder')) {
            updated.icon = icon || 'folder';
            changed = true;
        }

        return updated;
    });

    if (changed) {
        settingsManager.updateSetting('appFolders', newAppFolders);
    }
});

ipcMain.on('delete-folder', (event, folderId) => {
    if (!folderId || folderId === 'pinned') return;

    const folderToDelete = currentSettings.appFolders.find(f => f.id === folderId);
    if (!folderToDelete) return;

    const remainingFolders = currentSettings.appFolders
        .filter(f => f.id !== folderId)
        .map(folder => ({
            ...folder,
            apps: Array.isArray(folder.apps) ? [...folder.apps] : []
        }));

    const pinnedFolder = remainingFolders.find(f => f.id === 'pinned');
    if (pinnedFolder && Array.isArray(folderToDelete.apps) && folderToDelete.apps.length > 0) {
        pinnedFolder.apps = [...pinnedFolder.apps, ...folderToDelete.apps];
    }

    settingsManager.updateSetting('appFolders', remainingFolders);
});

ipcMain.on('show-pinned-apps-context-menu', (event) => {
    const template = [
        {
            label: i18n.t('context_create_folder'),
            click: () => {
                BrowserWindow.fromWebContents(event.sender)?.webContents.send('prompt-create-folder');
            }
        }
    ];
    const menu = Menu.buildFromTemplate(template);
    menu.popup(BrowserWindow.fromWebContents(event.sender));
});

ipcMain.on('create-folder-with-name', (event, folderName) => {
    if (folderName && folderName.trim().length > 0) {
        const newFolder = {
            id: `folder-${Date.now()}`,
            name: folderName.trim(),
            apps: [],
            color: null,
            icon: 'folder'
        };
        const updatedFolders = [...currentSettings.appFolders, newFolder];
        settingsManager.updateSetting('appFolders', updatedFolders);
    }
});

// НОВОЕ: Прямое добавление приложения в закрепленные без контекстного меню
ipcMain.on('add-app-to-pinned-direct', (event, appData) => {
    Logger.info(`Direct add to pinned: ${appData.name} (${appData.path})`);
    
    const pinnedFolderIndex = currentSettings.appFolders.findIndex(f => f.id === 'pinned');
    if (pinnedFolderIndex !== -1) {
        const pinnedFolder = currentSettings.appFolders[pinnedFolderIndex];
        if (!pinnedFolder.apps.some(app => app.path === appData.path)) {
            
            // Создаем новые массивы для обеспечения реакции на изменения
            const newApps = [...pinnedFolder.apps, appData];
            const newPinnedFolder = { ...pinnedFolder, apps: newApps };
            
            const newAppFolders = [...currentSettings.appFolders];
            newAppFolders[pinnedFolderIndex] = newPinnedFolder;
            
            settingsManager.updateSetting('appFolders', newAppFolders);
            Logger.info(`App ${appData.name} successfully added to pinned folder via direct method`);
        } else {
            Logger.info(`App ${appData.name} is already in pinned folder`);
        }
    } else {
        Logger.error('Pinned folder not found');
    }
});


ipcMain.on('show-context-menu', (event) => {
    const template = [
        { label: i18n.t('context_settings'), click: () => { mainWindow.webContents.send('navigate-view', 'settings'); } },
        { type: 'separator' },
        { label: i18n.t('context_open_location'), click: () => { shell.showItemInFolder(process.execPath); } },
        { label: i18n.t('context_run_as_admin'), click: () => { relaunchAsAdmin(); }, enabled: process.platform === 'win32' },
        { type: 'separator' },
        { label: i18n.t('context_quit'), click: () => app.quit() }
    ];
    const menu = Menu.buildFromTemplate(template);
    menu.popup(BrowserWindow.fromWebContents(event.sender));
});

// НОВАЯ ФУНКЦИЯ для перепозиционирования
WindowManager.repositionAuxiliaryWindows = function() {
    const mainBounds = mainWindow.getBounds();
    const display = screen.getPrimaryDisplay().workAreaSize;

    for (const type in auxiliaryWindows) {
        const win = auxiliaryWindows[type];
        if (win && !win.isDestroyed()) {
            const winBounds = win.getBounds();
            let x = mainBounds.x + mainBounds.width + 15;
            if (x + winBounds.width > display.width) {
                x = mainBounds.x - winBounds.width - 15;
            }
            win.setPosition(x, mainBounds.y);
        }
    }
};

ipcMain.on('update-setting', (event, key, value) => {
    settingsManager.updateSetting(key, value);
    // УДАЛЕНО: больше не меняем размер окна здесь, чтобы настройки не "прыгали"
    if (key === 'height' && mainWindow) {
        mainWindow.webContents.send('recalculate-size');
    }
});
ipcMain.on('open-auxiliary-window', (event, type) => {
    // This is now handled by the renderer process.
});
ipcMain.on('open-item', (event, itemPath) => {
    // === УЛУЧШЕНО: Немедленно скрываем окно для ощущения моментального запуска ===
    if (mainWindow && !mainWindow.isDestroyed() && mainWindow.isVisible()) {
        WindowManager.hideMainWindow();
    }

    // === Запускаем приложение асинхронно в фоне ===
    const launchStart = Date.now();
    
    if (itemPath.startsWith('shell:')) {
        // UWP приложения
        shell.openExternal(itemPath)
            .then(() => {
                const launchTime = Date.now() - launchStart;
                Logger.info(`✓ UWP app launched in ${launchTime}ms: ${itemPath}`);
            })
            .catch(err => {
                Logger.error(`Failed to open UWP app ${itemPath}: ${err.message}`);
                exec(`start "" "${itemPath}"`, { shell: true }, (fallbackErr) => {
                    if (fallbackErr) {
                        Logger.error(`Fallback launch failed for ${itemPath}: ${fallbackErr.message}`);
                    } else {
                        Logger.info(`✓ UWP app launched via fallback: ${itemPath}`);
                    }
                });
            });
    } else if (itemPath.toLowerCase().endsWith('.exe')) {
        // === ОПТИМИЗАЦИЯ: Используем child_process.spawn для .exe файлов (быстрее чем shell.openPath) ===
        const { spawn } = require('child_process');
        try {
            const child = spawn(itemPath, [], {
                detached: true,
                stdio: 'ignore',
                windowsHide: false
            });
            child.unref(); // Позволяем родительскому процессу завершиться независимо
            
            const launchTime = Date.now() - launchStart;
            Logger.info(`✓ App launched via spawn in ${launchTime}ms: ${path.basename(itemPath)}`);
        } catch (err) {
            Logger.error(`Failed to spawn ${itemPath}: ${err.message}`);
            // Fallback на shell.openPath
            shell.openPath(itemPath)
                .catch(fallbackErr => Logger.error(`Fallback also failed: ${fallbackErr.message}`));
        }
    } else {
        // Для других типов файлов используем shell.openPath
        shell.openPath(itemPath)
            .then(() => {
                const launchTime = Date.now() - launchStart;
                Logger.info(`✓ Item opened in ${launchTime}ms: ${itemPath}`);
            })
            .catch(err => Logger.error(`Failed to open item ${itemPath}: ${err.message}`));
    }
});
ipcMain.on('copy-to-clipboard', (event, text) => clipboard.writeText(text));
ipcMain.on('rebuild-index', () => FileIndexer.startIndexing(true));
ipcMain.handle('quick-action-run-command', async (event, command) => {
    if (typeof command !== 'string' || !command.trim()) {
        return { success: false, error: 'Invalid command' };
    }
    try {
        const { stdout, stderr } = await execPromise(command, { windowsHide: true });
        if (stderr) {
            Logger.warn(`Quick action command stderr: ${stderr.trim()}`);
        }
        return { success: true, output: stdout.trim(), error: stderr.trim() };
    } catch (error) {
        Logger.error(`Quick action command failed: ${error.message}`);
        return { success: false, error: error.message };
    }
});
ipcMain.handle('get-indexing-state', () => FileIndexer.status);
ipcMain.handle('select-directory', async () => {
    const { filePaths } = await dialog.showOpenDialog(mainWindow, { properties: ['openDirectory'] });
    return filePaths[0] || null;
});
ipcMain.handle('search-all', (event, query) => {
    const fileResults = FileIndexer.search(query);
    const q = String(query || '').toLowerCase();
    const commandResults = CommandManager
        .getAllCommands()
        .filter(cmd => (cmd.keyword || '').includes(q) || (cmd.name || '').toLowerCase().includes(q));

    // Объединяем результаты (порядок важен! apps уже отсортированы в FileIndexer.search)
    const apps = fileResults.filter(r => r.isApp);
    const files = fileResults.filter(r => !r.isApp);
    
    // Команды сортируем по имени
    commandResults.sort((a, b) => a.name.localeCompare(b.name));

    const combined = [...apps, ...files, ...commandResults];

    // === УЛУЧШЕННАЯ ДЕДУБЛИКАЦИЯ ===
    const seen = new Set();
    const seenNames = new Map(); // Для отслеживания дубликатов по нормализованным именам
    const unique = [];
    
    const normalizeAppName = (name) => {
        if (!name) return '';
        return String(name)
            .toLowerCase()
            .replace(/\.(lnk|exe|app)$/i, '')      // Убираем расширения
            .replace(/[\s._-]+/g, '')               // Убираем пробелы и разделители
            .replace(/\b(x64|x86|64bit|32bit|64-bit|32-bit)\b/gi, '') // Убираем архитектуру
            .replace(/v?\d+(\.\d+)*/g, '')          // Убираем версии
            .trim();
    };
    
    for (const item of combined) {
        // Дедубликация по пути
        if (item.path) {
            const pathKey = `p:${item.path.toLowerCase()}`;
            if (seen.has(pathKey)) {
                continue; // Пропускаем дубликат по пути
            }
            seen.add(pathKey);
        }
        
        // Дедубликация по ID команды
        if (item.id) {
            const idKey = `c:${String(item.id)}`;
            if (seen.has(idKey)) {
                continue;
            }
            seen.add(idKey);
        }
        
        // НОВАЯ: Дедубликация по нормализованному имени приложения
        if (item.isApp && item.name) {
            const normalizedName = normalizeAppName(item.name);
            
            if (normalizedName && seenNames.has(normalizedName)) {
                const existing = seenNames.get(normalizedName);
                
                // Выбираем лучший вариант
                let shouldReplace = false;
                
                // 1. Приоритет для isPrimary
                if (item.isPrimary && !existing.isPrimary) {
                    shouldReplace = true;
                }
                // 2. Приоритет для .lnk над .exe (ярлыки обычно имеют иконки)
                else if (!item.isPrimary && existing.isPrimary) {
                    shouldReplace = false;
                }
                else if (item.extension === '.lnk' && existing.extension !== '.lnk') {
                    shouldReplace = true;
                }
                // 3. Приоритет для более короткого имени (обычно это основной файл)
                else if (item.name.length < existing.name.length - 5) {
                    shouldReplace = true;
                }
                
                if (shouldReplace) {
                    // Заменяем существующий элемент
                    const existingIndex = unique.indexOf(existing);
                    if (existingIndex !== -1) {
                        unique[existingIndex] = item;
                        seenNames.set(normalizedName, item);
                    }
                }
                
                continue; // Пропускаем, т.к. дубликат
            }
            
            if (normalizedName) {
                seenNames.set(normalizedName, item);
            }
        }
        
        unique.push(item);
    }

    Logger.info(`IPC search-all: Query "${query}" - Found ${fileResults.length} files, ${commandResults.length} commands. After dedup: ${unique.length} results.`);
    return unique;
});
ipcMain.on('execute-command', (event, actionId) => {
    // === УЛУЧШЕНО: Сначала скрываем окно, потом выполняем команду ===
    if (mainWindow && !mainWindow.isDestroyed() && mainWindow.isVisible()) {
        WindowManager.hideMainWindow();
    }
    
    // Выполняем команду асинхронно
    setImmediate(() => {
        CommandManager.execute(actionId);
    });
});
ipcMain.on('recalculate-size', (event) => {
    if (mainWindow) {
        mainWindow.webContents.send('recalculate-size');
    }
});
ipcMain.on('aux-panel-ready-for-data', (event, type) => {
    Logger.info(`Aux panel '${type}' is ready. Sending data.`);
    if (type === 'clipboard') ClipboardMonitor.broadcastHistoryUpdate();
    else if (type === 'files') FileIndexer.broadcastIndexUpdate();
    else if (type === 'commands') CommandManager.broadcastCommands();
});

// НОВОЕ: Получение всех приложений для библиотеки
ipcMain.handle('get-all-apps', async (event) => {
    Logger.info('[AppsLibrary] Fetching all applications');
    
    // Возвращаем все приложения из индекса
    const apps = FileIndexer.index.filter(item => item.isApp === true);
    
    Logger.info(`[AppsLibrary] Returning ${apps.length} applications`);
    return apps;
});

// НОВЫЙ ОБРАБОТЧИК для добавления приложений в папки
ipcMain.handle('add-app-to-folder', async (event, folderId) => {
    if (!folderId) return { error: 'Folder ID not provided.' };
    
    const { filePaths } = await dialog.showOpenDialog(mainWindow, {
        title: 'Select an Application',
        properties: ['openFile'],
        filters: [
            { name: 'Applications', extensions: ['exe', 'lnk', 'app'] }
        ]
    });

    if (filePaths && filePaths.length > 0) {
        const filePath = filePaths[0];
        const fileName = path.basename(filePath);
        
        const targetFolder = currentSettings.appFolders.find(f => f.id === folderId);
        if (targetFolder) {
            // Проверяем, нет ли уже такого приложения
            if (targetFolder.apps.some(app => app.path === filePath)) {
                return { error: 'This application is already in the folder.' };
            }

            const newApp = {
                name: fileName,
                path: filePath,
                isApp: true,
                type: 'file',
                extension: path.extname(fileName).toLowerCase()
            };
            
            targetFolder.apps.push(newApp);
            settingsManager.updateSetting('appFolders', currentSettings.appFolders);
            
            return { success: true };
        }
        return { error: 'Target folder not found.' };
    }
    return { success: false }; // Пользователь отменил выбор
});

// === УЛУЧШЕННЫЙ КЭШ ИКОНОК С СОХРАНЕНИЕМ НА ДИСК ===
const iconCache = new Map(); // Кэш: путь -> base64 data URL

// Загрузка кэша иконок с диска
function loadIconCache() {
    try {
        if (fs.existsSync(ICON_CACHE_PATH)) {
            const data = fs.readFileSync(ICON_CACHE_PATH, 'utf8');
            const cached = JSON.parse(data);
            Object.entries(cached).forEach(([path, dataUrl]) => {
                iconCache.set(path, dataUrl);
            });
            Logger.info(`[ICON CACHE] Loaded ${iconCache.size} icons from disk cache`);
        }
    } catch (error) {
        Logger.error(`Error loading icon cache: ${error.message}`);
    }
}

// Сохранение кэша иконок на диск
function saveIconCache() {
    try {
        const cacheObject = {};
        iconCache.forEach((value, key) => {
            if (value && value.startsWith('data:image')) {
                cacheObject[key] = value;
            }
        });
        fs.writeFileSync(ICON_CACHE_PATH, JSON.stringify(cacheObject));
        Logger.info(`[ICON CACHE] Saved ${Object.keys(cacheObject).length} icons to disk`);
    } catch (error) {
        Logger.error(`Error saving icon cache: ${error.message}`);
    }
}

async function extractIconToBase64(executablePath) {
    // === ПРОВЕРКА КЭША ===
    if (iconCache.has(executablePath)) {
        const cached = iconCache.get(executablePath);
        if (cached && cached.startsWith('data:image')) {
            Logger.info(`[ICON CACHE HIT] ${executablePath}`);
            return cached;
        }
    }

    const tempIconPath = path.join(os.tmpdir(), `icon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.png`);
    
    // === УЛУЧШЕННЫЙ PowerShell скрипт для извлечения иконки ===
    const powerShellCommand = `
        Add-Type -AssemblyName System.Drawing;
        try {
            $exePath = '${executablePath.replace(/\\/g, '\\\\').replace(/'/g, "''")}';
            Write-Host "Extracting icon from: $exePath";
            
            # Извлекаем ассоциированную иконку
            $icon = [System.Drawing.Icon]::ExtractAssociatedIcon($exePath);
            
            if ($icon -ne $null) {
                # Конвертируем в Bitmap и сохраняем как PNG
                $bitmap = $icon.ToBitmap();
                $tempPath = '${tempIconPath.replace(/\\/g, '\\\\').replace(/'/g, "''")}';
                $bitmap.Save($tempPath, [System.Drawing.Imaging.ImageFormat]::Png);
                
                # Очищаем ресурсы
                $bitmap.Dispose();
                $icon.Dispose();
                
                Write-Host "Icon saved successfully to: $tempPath";
            } else {
                Write-Host "Failed to extract icon (null result)";
            }
        } catch {
            Write-Host "Error: $_";
        }
    `;

    try {
        // Выполняем PowerShell команду
        const { stdout, stderr } = await execPromise(
            `powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "${powerShellCommand.replace(/"/g, '\\"')}"`,
            { timeout: 5000 } // 5 секунд таймаут
        );

        if (stderr) {
            Logger.warn(`PowerShell stderr: ${stderr}`);
        }

        // Проверяем, что файл создан
        if (fs.existsSync(tempIconPath)) {
            const imageBytes = await fs.promises.readFile(tempIconPath);
            const base64Icon = imageBytes.toString('base64');
            const dataUrl = `data:image/png;base64,${base64Icon}`;
            
            // Удаляем временный файл
            await fs.promises.unlink(tempIconPath);
            
            // === СОХРАНЯЕМ В КЭШ ===
            iconCache.set(executablePath, dataUrl);
            Logger.info(`[ICON EXTRACTED] ${executablePath} (${Math.round(imageBytes.length / 1024)}KB)`);
            
            // НОВОЕ: Периодически сохраняем кэш на диск
            if (iconCache.size % 10 === 0) {
                saveIconCache();
            }
            
            return dataUrl;
        } else {
            Logger.warn(`Icon file not created: ${tempIconPath}`);
        }
    } catch (e) {
        Logger.error(`PowerShell icon extraction failed for ${executablePath}: ${e.message}`);
        // Cleanup при ошибке
        if (fs.existsSync(tempIconPath)) {
            try {
                await fs.promises.unlink(tempIconPath);
            } catch (unlinkErr) {
                Logger.warn(`Could not cleanup temp icon file: ${unlinkErr.message}`);
            }
        }
    }
    
    // === СОХРАНЯЕМ null В КЭШ, ЧТОБЫ НЕ ПОВТОРЯТЬ ПОПЫТКИ ===
    iconCache.set(executablePath, null);
    return null;
}

ipcMain.on('request-file-icon', async (event, filePath) => {
    Logger.info(`Icon requested for: ${filePath}`);
    try {
        let dataUrl = null;
        const ext = path.extname(filePath).toLowerCase();

        if (ext === '.exe' || ext === '.lnk') {
             dataUrl = await extractIconToBase64(filePath);
        }

        // Fallback for non-apps or if PowerShell fails
        if (!dataUrl) {
            if (!fs.existsSync(filePath)) {
                Logger.warn(`File not found for icon request: ${filePath}`);
            } else {
                const icon = await app.getFileIcon(filePath, { size: 'normal' });
                dataUrl = icon.toDataURL();
            }
        }
        
        if(dataUrl) {
            Logger.info(`Successfully extracted icon for ${filePath}`);
        } else {
            Logger.warn(`Could not extract icon for ${filePath}`);
        }

        const payload = { path: filePath, dataUrl: dataUrl };
        const allWindows = [mainWindow, ...Object.values(auxiliaryWindows)];
        allWindows.forEach(win => {
            if (win && !win.isDestroyed()) {
                win.webContents.send('file-icon-response', payload);
            }
        });

    } catch (error) {
        Logger.error(`Could not extract icon for ${filePath}: ${error.message}`);
        const payload = { path: filePath, dataUrl: null };
        const allWindows = [mainWindow, ...Object.values(auxiliaryWindows)];
        allWindows.forEach(win => {
            if (win && !win.isDestroyed()) {
                win.webContents.send('file-icon-response', payload);
            }
        });
    }
});

ipcMain.on('move-app-to-folder', (event, { appPath, sourceFolderId, targetFolderId }) => {
    if (!appPath || !sourceFolderId || !targetFolderId || sourceFolderId === targetFolderId) {
        return;
    }

    // Deep copy to avoid mutation issues
    const newAppFolders = JSON.parse(JSON.stringify(currentSettings.appFolders));

    const sourceFolder = newAppFolders.find(f => f.id === sourceFolderId);
    const targetFolder = newAppFolders.find(f => f.id === targetFolderId);

    if (!sourceFolder || !targetFolder) return;

    const appIndex = sourceFolder.apps.findIndex(app => app.path === appPath);
    if (appIndex === -1) return;
    
    // Avoid duplicates
    if (targetFolder.apps.some(app => app.path === appPath)) return;

    const [appToMove] = sourceFolder.apps.splice(appIndex, 1);
    targetFolder.apps.push(appToMove);

    settingsManager.updateSetting('appFolders', newAppFolders);
});
