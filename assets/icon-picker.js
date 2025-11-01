(function () {
  'use strict';

  const globalObject = typeof window !== 'undefined' ? window : this;
  const FAVORITES_KEY = 'flashsearch.iconpicker.favorites.v1';
  const STORAGE_VERSION = 1;
  const MAX_SUGGESTIONS = 9;
  const GRID_BATCH_SIZE = 120;
  const VIRTUALIZATION_THRESHOLD = 320;

  const KEYWORD_SYNONYMS = {
    arrow: ['direction', 'navigate', 'point', 'chevron', 'triangle', 'move', 'control'],
    audio: ['music', 'sound', 'playlist', 'tone', 'waveform', 'equalizer', 'speaker'],
    alert: ['warning', 'danger', 'issue', 'problem', 'triangle', 'notification'],
    book: ['library', 'read', 'guide', 'manual', 'documentation', 'reference'],
    briefcase: ['work', 'portfolio', 'career', 'case', 'documents', 'professional'],
    calendar: ['date', 'schedule', 'planner', 'event', 'reminder', 'timeline'],
    call: ['phone', 'dial', 'ring', 'contact', 'communication'],
    camera: ['photo', 'picture', 'shot', 'media', 'video', 'lens'],
    chat: ['bubble', 'message', 'conversation', 'discussion', 'dialogue'],
    check: ['done', 'confirm', 'complete', 'success', 'ok'],
    clock: ['time', 'hour', 'minute', 'timer', 'alarm'],
    cloud: ['sync', 'weather', 'storage', 'upload', 'download'],
    code: ['development', 'programming', 'tag', 'terminal', 'script'],
    cpu: ['hardware', 'processor', 'chip', 'technology'],
    database: ['storage', 'server', 'table', 'records', 'stack'],
    edit: ['pencil', 'write', 'change', 'update', 'note'],
    eye: ['preview', 'view', 'watch', 'see', 'visibility'],
    file: ['document', 'paper', 'report', 'archive'],
    folder: ['directory', 'storage', 'project', 'collection'],
    gift: ['present', 'reward', 'bonus', 'celebration'],
    globe: ['world', 'internet', 'network', 'global', 'earth'],
    grid: ['layout', 'dashboard', 'matrix', 'tiles'],
    heart: ['favorite', 'like', 'love', 'support'],
    help: ['question', 'info', 'guide', 'support'],
    home: ['house', 'start', 'main', 'dashboard'],
    image: ['picture', 'media', 'gallery', 'visual'],
    key: ['unlock', 'security', 'password', 'credential'],
    layers: ['stack', 'design', 'levels', 'arrange'],
    link: ['chain', 'connect', 'url', 'hyperlink'],
    lock: ['secure', 'privacy', 'protected', 'security'],
    mail: ['email', 'message', 'contact', 'letter'],
    map: ['location', 'navigation', 'gps', 'direction'],
    microphone: ['record', 'voice', 'audio', 'podcast'],
    monitor: ['screen', 'desktop', 'display', 'visual'],
    moon: ['night', 'dark', 'theme', 'sleep'],
    more: ['menu', 'options', 'ellipsis', 'overflow'],
    music: ['note', 'sound', 'song', 'audio'],
    paperclip: ['attach', 'file', 'document', 'link'],
    pause: ['stop', 'hold', 'break', 'media'],
    play: ['start', 'media', 'video', 'audio'],
    plus: ['add', 'new', 'create', 'positive'],
    power: ['shutdown', 'switch', 'energy', 'button'],
    refresh: ['reload', 'sync', 'update', 'repeat'],
    search: ['find', 'magnifier', 'lookup', 'scan'],
    settings: ['gear', 'preferences', 'controls', 'options'],
    share: ['export', 'send', 'forward', 'distribute'],
    shield: ['security', 'safe', 'protection', 'privacy'],
    star: ['favourite', 'rate', 'achievement', 'bookmark'],
    target: ['goal', 'bullseye', 'objective', 'focus'],
    trash: ['delete', 'remove', 'bin', 'discard'],
    upload: ['cloud', 'send', 'push', 'share'],
    user: ['person', 'profile', 'account', 'member'],
    video: ['camera', 'movie', 'recording', 'clip'],
    wifi: ['network', 'signal', 'connection', 'wireless'],
    zap: ['flash', 'bolt', 'energy', 'spark'],
    zoom: ['magnify', 'scale', 'focus', 'detail']
  };

  const ICON_CATEGORY_BLUEPRINTS = [
    { id: 'action', label: 'Actions', keywords: ['plus', 'minus', 'x', 'check', 'close', 'refresh', 'repeat', 'power', 'command'], synonyms: ['apply', 'confirm', 'cancel', 'reload', 'start', 'stop'], weight: 8 },
    { id: 'arrows', label: 'Arrows & Navigation', keywords: ['arrow', 'chevron', 'corner', 'navigation', 'compass'], synonyms: ['direction', 'movement', 'travel', 'location'], weight: 10 },
    { id: 'communication', label: 'Communication', keywords: ['mail', 'phone', 'message', 'chat', 'comment', 'at-sign'], synonyms: ['talk', 'call', 'social', 'support'], weight: 7 },
    { id: 'content', label: 'Content & Media', keywords: ['image', 'music', 'video', 'film', 'mic', 'headphones', 'aperture'], synonyms: ['audio', 'photo', 'camera', 'record'], weight: 6 },
    { id: 'data', label: 'Data & Files', keywords: ['file', 'folder', 'database', 'hard-drive', 'save', 'archive'], synonyms: ['document', 'storage', 'records'], weight: 9 },
    { id: 'design', label: 'Design Tools', keywords: ['pen', 'edit', 'crop', 'scissors', 'color', 'droplet'], synonyms: ['draw', 'sketch', 'ui', 'ux'], weight: 5 },
    { id: 'devices', label: 'Devices & Hardware', keywords: ['monitor', 'tablet', 'smartphone', 'cpu', 'printer', 'tv'], synonyms: ['screen', 'display', 'hardware', 'technology'], weight: 6 },
    { id: 'files', label: 'Folders & Library', keywords: ['book', 'book-open', 'briefcase', 'folder', 'layers'], synonyms: ['library', 'portfolio', 'collection'], weight: 5 },
    { id: 'finance', label: 'Finance & Commerce', keywords: ['credit-card', 'shopping-bag', 'dollar-sign', 'pie-chart', 'trending-up'], synonyms: ['sales', 'purchase', 'billing', 'budget'], weight: 6 },
    { id: 'maps', label: 'Maps & Travel', keywords: ['map', 'map-pin', 'navigation-2', 'compass'], synonyms: ['travel', 'location', 'gps', 'route'], weight: 5 },
    { id: 'productivity', label: 'Productivity', keywords: ['calendar', 'clock', 'clipboard', 'check-square', 'target'], synonyms: ['plan', 'tasks', 'schedule', 'goal'], weight: 7 },
    { id: 'security', label: 'Security', keywords: ['lock', 'unlock', 'shield', 'key', 'eye-off'], synonyms: ['privacy', 'protect', 'secure', 'guard'], weight: 8 },
    { id: 'shapes', label: 'Shapes & Objects', keywords: ['circle', 'square', 'triangle', 'hexagon', 'octagon'], synonyms: ['geometry', 'outline', 'form'], weight: 4 },
    { id: 'status', label: 'Status & Feedback', keywords: ['alert', 'info', 'help-circle', 'activity', 'loader'], synonyms: ['progress', 'state', 'indicator'], weight: 7 },
    { id: 'system', label: 'System & Settings', keywords: ['settings', 'sliders', 'tool', 'toggle', 'filter'], synonyms: ['preferences', 'configuration', 'adjust'], weight: 9 },
    { id: 'text', label: 'Typography', keywords: ['type', 'bold', 'italic', 'underline', 'text'], synonyms: ['font', 'format', 'style'], weight: 4 },
    { id: 'users', label: 'Users & People', keywords: ['user', 'users', 'user-plus', 'user-minus'], synonyms: ['team', 'profile', 'member'], weight: 6 },
    { id: 'weather', label: 'Weather', keywords: ['cloud', 'sun', 'moon', 'umbrella', 'wind', 'thermometer'], synonyms: ['climate', 'forecast', 'season'], weight: 3 },
    { id: 'workflow', label: 'Workflow & Automation', keywords: ['git-branch', 'git-merge', 'zap', 'aperture', 'toggle'], synonyms: ['automation', 'flow', 'pipeline', 'integration'], weight: 5 },
    { id: 'development', label: 'Development', keywords: ['code', 'terminal', 'package', 'cpu', 'command'], synonyms: ['dev', 'script', 'builder', 'engineer'], weight: 7 },
    { id: 'analytics', label: 'Analytics', keywords: ['bar-chart', 'line-chart', 'pie-chart', 'trending-down', 'trending-up', 'activity'], synonyms: ['metrics', 'insights', 'report'], weight: 6 },
    { id: 'nature', label: 'Nature & Outdoors', keywords: ['feather', 'leaf', 'sunrise', 'sunset', 'cloud-drizzle'], synonyms: ['eco', 'environment', 'weather'], weight: 3 },
    { id: 'interface', label: 'Interface Controls', keywords: ['menu', 'list', 'grid', 'columns', 'layout', 'sidebar'], synonyms: ['ui', 'navigation', 'structure'], weight: 5 },
    { id: 'documents', label: 'Documents & Text', keywords: ['book-open', 'file-text', 'file-minus', 'file-plus'], synonyms: ['article', 'write', 'note'], weight: 6 },
    { id: 'media-playback', label: 'Media Playback', keywords: ['play', 'pause', 'stop-circle', 'rewind', 'fast-forward'], synonyms: ['player', 'control', 'timeline'], weight: 4 },
    { id: 'connectivity', label: 'Connectivity', keywords: ['wifi', 'bluetooth', 'radio', 'rss'], synonyms: ['signal', 'connection', 'broadcast'], weight: 4 },
    { id: 'transport', label: 'Transport', keywords: ['truck', 'navigation', 'map-pin', 'navigation-2'], synonyms: ['delivery', 'travel', 'route'], weight: 2 },
    { id: 'health', label: 'Health & Wellness', keywords: ['activity', 'heart', 'thermometer', 'droplet'], synonyms: ['fitness', 'medical', 'pulse'], weight: 3 }
  ];

  const PRESET_FAVORITES = new Set([
    'zap', 'settings', 'search', 'star', 'play', 'pause', 'grid', 'command', 'folder', 'file', 'link', 'share-2',
    'external-link', 'send', 'target', 'bell', 'shield', 'lock', 'unlock', 'map', 'map-pin', 'phone', 'mail',
    'wifi', 'bluetooth', 'calendar', 'clock', 'camera', 'sliders', 'filter', 'sun', 'moon', 'sunrise', 'database',
    'code', 'download', 'upload', 'save', 'refresh-ccw', 'repeat', 'book-open', 'user', 'users', 'user-check',
    'layers', 'activity', 'feather', 'bookmark', 'award', 'check-circle', 'info', 'help-circle', 'terminal',
    'cpu', 'layout', 'smartphone', 'monitor', 'tv', 'box', 'shopping-bag', 'gift', 'inbox', 'printer', 'cloud',
    'cloud-lightning', 'cloud-drizzle', 'umbrella', 'coffee', 'edit-3', 'edit', 'scissors', 'camera-off', 'music',
    'mic', 'mic-off', 'video', 'video-off', 'film', 'headphones', 'volume-2', 'volume-x', 'message-circle',
    'message-square', 'twitter', 'github', 'linkedin', 'figma', 'framer', 'slack', 'dribbble', 'chrome', 'cpu',
    'award', 'compass', 'navigation', 'navigation-2', 'anchor', 'aperture', 'box', 'briefcase', 'clipboard',
    'clipboard-check', 'clipboard-list', 'columns', 'layers', 'align-left', 'align-center', 'align-right',
    'align-justify', 'bold', 'italic', 'underline', 'type', 'command', 'settings', 'tool', 'package', 'life-buoy'
  ]);

  const DEFAULT_SUGGESTIONS = [
    { title: 'Popular', icons: ['zap', 'command', 'grid', 'sliders', 'settings', 'target', 'star', 'mail', 'calendar'] },
    { title: 'Navigation', icons: ['search', 'navigation', 'navigation-2', 'map', 'map-pin', 'compass', 'flag', 'crosshair', 'globe'] },
    { title: 'Productivity', icons: ['check-circle', 'clipboard', 'clipboard-check', 'clock', 'inbox', 'layers', 'briefcase', 'folder', 'file-text'] },
    { title: 'Media', icons: ['camera', 'film', 'music', 'headphones', 'mic', 'video', 'play', 'pause', 'fast-forward'] },
    { title: 'Communication', icons: ['phone', 'mail', 'message-circle', 'message-square', 'chat', 'users', 'user', 'share-2', 'share'] },
    { title: 'Status', icons: ['activity', 'alert-triangle', 'alert-circle', 'bell', 'info', 'help-circle', 'loader', 'shield', 'shield-off'] },
    { title: 'Security', icons: ['lock', 'unlock', 'key', 'shield', 'user-check', 'user-x', 'eye', 'eye-off', 'fingerprint'] },
    { title: 'Files', icons: ['folder', 'folder-plus', 'folder-minus', 'file', 'file-text', 'file-plus', 'file-minus', 'archive', 'save'] },
    { title: 'Commerce', icons: ['shopping-bag', 'shopping-cart', 'credit-card', 'dollar-sign', 'percent', 'tag', 'gift', 'package', 'truck'] }
  ];

  const NUMERIC_STRINGS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
  const STOP_WORDS = new Set(['the', 'a', 'an', 'and', 'or', 'of', 'for', 'with', 'without']);

  const Utility = {
    slugify(value) {
      return (value || '')
        .toString()
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-');
    },
    tokenize(value) {
      return (value || '')
        .toString()
        .toLowerCase()
        .split(/[^a-z0-9]+/g)
        .filter(Boolean)
        .filter((token) => !STOP_WORDS.has(token));
    },
    unique(values) {
      return Array.from(new Set(values));
    },
    toTitleCase(value) {
      return (value || '')
        .split(/\s+/)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
    },
    debounce(fn, delay) {
      let timer = null;
      return function debounced(...args) {
        const context = this;
        if (timer) {
          clearTimeout(timer);
        }
        timer = setTimeout(() => {
          timer = null;
          fn.apply(context, args);
        }, delay);
      };
    },
    throttle(fn, delay) {
      let lastCall = 0;
      let frame = null;
      const invoke = (context, args) => {
        lastCall = Date.now();
        fn.apply(context, args);
      };
      return function throttled(...args) {
        const now = Date.now();
        const remaining = delay - (now - lastCall);
        if (remaining <= 0) {
          if (frame) {
            cancelAnimationFrame(frame);
            frame = null;
          }
          invoke(this, args);
        } else if (!frame) {
          frame = requestAnimationFrame(() => invoke(this, args));
        }
      };
    },
    measureTextWidth(text, font = '14px Inter, sans-serif') {
      const canvas = Utility._canvas || (Utility._canvas = document.createElement('canvas'));
      const context = canvas.getContext('2d');
      context.font = font;
      return context.measureText(text).width;
    },
    clamp(value, min, max) {
      return Math.min(Math.max(value, min), max);
    }
  };

  class IconMetadataIndex {
    constructor() {
      this.registry = new Map();
      this.keywordIndex = new Map();
      this.categoryIndex = new Map();
      this.trigramIndex = new Map();
      this.aliasMap = new Map();
      this.synonymCache = new Map();
      this.datasetVersion = 0;
    }

    loadFromFeather(feather) {
      if (!feather || !feather.icons) {
        return;
      }
      const iconNames = Object.keys(feather.icons);
      this.datasetVersion = iconNames.length;
      iconNames.forEach((name) => {
        const meta = this.createMetadata(name);
        this.registry.set(name, meta);
        this.registerKeywords(name, meta);
        this.registerCategories(name, meta);
        this.registerTrigrams(name);
      });
    }

    createMetadata(name) {
      const tokens = Utility.tokenize(name);
      const readable = name.replace(/-/g, ' ');
      const label = Utility.toTitleCase(readable);
      const synonyms = this.expandSynonyms(tokens, name);
      const categories = this.resolveCategories(tokens, name, synonyms);
      const weight = this.computeWeight(categories, synonyms);
      return {
        name,
        label,
        tokens,
        synonyms,
        categories,
        weight,
        favorite: PRESET_FAVORITES.has(name)
      };
    }

    expandSynonyms(tokens, name) {
      const synonyms = new Set();
      tokens.forEach((token) => {
        synonyms.add(token);
        const alias = KEYWORD_SYNONYMS[token];
        if (Array.isArray(alias)) {
          alias.forEach((value) => synonyms.add(value));
        }
        if (token.endsWith('s')) {
          synonyms.add(token.slice(0, -1));
        }
        if (NUMERIC_STRINGS.includes(token)) {
          synonyms.add(String(NUMERIC_STRINGS.indexOf(token)));
        }
      });
      if (name.includes('-')) {
        synonyms.add(name.replace(/-/g, ' '));
      }
      synonyms.add(name);
      return Array.from(synonyms);
    }

    resolveCategories(tokens, name, synonyms) {
      const matched = new Set();
      const haystack = new Set([...tokens, ...synonyms]);
      ICON_CATEGORY_BLUEPRINTS.forEach((blueprint) => {
        const hits = blueprint.keywords.some((keyword) => haystack.has(keyword));
        const aliasHits = blueprint.synonyms.some((synonym) => haystack.has(synonym));
        if (hits || aliasHits) {
          matched.add(blueprint.id);
        }
      });
      if (matched.size === 0) {
        matched.add('misc');
      }
      return Array.from(matched);
    }

    computeWeight(categories, synonyms) {
      const base = categories.reduce((total, categoryId) => {
        const blueprint = ICON_CATEGORY_BLUEPRINTS.find((item) => item.id === categoryId);
        return total + (blueprint ? blueprint.weight : 1);
      }, 0);
      const richness = Utility.clamp(synonyms.length, 1, 20);
      return base + richness;
    }

    registerKeywords(name, meta) {
      const { tokens, synonyms } = meta;
      const keywords = Utility.unique([...tokens, ...synonyms]);
      keywords.forEach((keyword) => {
        const list = this.keywordIndex.get(keyword) || [];
        list.push(name);
        this.keywordIndex.set(keyword, list);
      });
      this.aliasMap.set(name, keywords);
    }

    registerCategories(name, meta) {
      meta.categories.forEach((categoryId) => {
        const list = this.categoryIndex.get(categoryId) || [];
        list.push(name);
        this.categoryIndex.set(categoryId, list);
      });
    }

    registerTrigrams(name) {
      const sequences = [];
      for (let i = 0; i < name.length - 2; i += 1) {
        sequences.push(name.slice(i, i + 3));
      }
      sequences.forEach((key) => {
        const bucket = this.trigramIndex.get(key) || [];
        bucket.push(name);
        this.trigramIndex.set(key, bucket);
      });
    }

    search(queryTokens, activeCategories = new Set()) {
      if (!queryTokens.length && activeCategories.size === 0) {
        return Array.from(this.registry.values());
      }
      const candidateScores = new Map();
      const candidateNames = new Set();

      const registerCandidate = (name, score) => {
        const current = candidateScores.get(name) || 0;
        candidateScores.set(name, current + score);
        candidateNames.add(name);
      };

      queryTokens.forEach((token) => {
        const direct = this.keywordIndex.get(token);
        if (Array.isArray(direct)) {
          direct.forEach((name) => registerCandidate(name, 6));
        }
        if (token.length >= 3) {
          const triMatches = this.trigramIndex.get(token.slice(0, 3));
          if (Array.isArray(triMatches)) {
            triMatches.forEach((name) => registerCandidate(name, 2));
          }
        }
      });

      if (candidateNames.size === 0) {
        this.registry.forEach((meta, name) => registerCandidate(name, 1));
      }

      const results = [];
      candidateNames.forEach((name) => {
        const meta = this.registry.get(name);
        if (!meta) return;
        if (activeCategories.size > 0) {
          const hasCategory = meta.categories.some((categoryId) => activeCategories.has(categoryId));
          if (!hasCategory) {
            return;
          }
        }
        const baseScore = candidateScores.get(name) || 0;
        const weightScore = baseScore + meta.weight;
        results.push({ ...meta, relevance: weightScore });
      });

      return results.sort((a, b) => b.relevance - a.relevance || a.name.localeCompare(b.name));
    }

    getCategoryMeta() {
      const payload = ICON_CATEGORY_BLUEPRINTS.map((blueprint) => {
        const total = (this.categoryIndex.get(blueprint.id) || []).length;
        return {
          id: blueprint.id,
          label: blueprint.label,
          total
        };
      });
      payload.sort((a, b) => b.total - a.total || a.label.localeCompare(b.label));
      return payload;
    }

    getSuggestions() {
      return DEFAULT_SUGGESTIONS.map((set) => {
        const icons = set.icons.filter((name) => this.registry.has(name));
        return { ...set, icons };
      }).filter((set) => set.icons.length > 0);
    }

    getMeta(name) {
      return this.registry.get(name);
    }
  }

  class IconFavoritesStore {
    constructor(storageKey = FAVORITES_KEY) {
      this.storageKey = storageKey;
      this.favorites = new Set();
      this.metadata = { version: STORAGE_VERSION, lastUpdated: Date.now() };
      this.load();
    }

    load() {
      try {
        const raw = localStorage.getItem(this.storageKey);
        if (!raw) {
          this.favorites = new Set(PRESET_FAVORITES);
          return;
        }
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.items)) {
          this.favorites = new Set(parsed.items);
          this.metadata = {
            version: parsed.version || STORAGE_VERSION,
            lastUpdated: parsed.lastUpdated || Date.now()
          };
        }
      } catch (error) {
        console.warn('[IconFavoritesStore] Failed to load favorites', error);
        this.favorites = new Set(PRESET_FAVORITES);
      }
    }

    save() {
      try {
        const payload = {
          version: STORAGE_VERSION,
          lastUpdated: Date.now(),
          items: Array.from(this.favorites)
        };
        localStorage.setItem(this.storageKey, JSON.stringify(payload));
      } catch (error) {
        console.warn('[IconFavoritesStore] Failed to save favorites', error);
      }
    }

    toggle(name) {
      if (this.favorites.has(name)) {
        this.favorites.delete(name);
      } else {
        this.favorites.add(name);
      }
      this.save();
    }

    has(name) {
      return this.favorites.has(name);
    }

    list() {
      return Array.from(this.favorites);
    }

    clear() {
      this.favorites.clear();
      this.save();
    }
  }

  class IconPickerController {
    constructor() {
      this.index = new IconMetadataIndex();
      this.favorites = new IconFavoritesStore();
      this.initialized = false;
      this.elements = {};
      this.active = false;
      this.queryTokens = [];
      this.activeCategories = new Set();
      this.filteredIcons = [];
      this.selectedIcon = null;
      this.currentBatch = 0;
      this.lastRenderFrame = null;
      this.isVirtualized = false;
      this.requestedHostCallback = null;
      this.listeners = new Map();
      this.metaCache = {};
      this.pendingSearch = null;
      this.boundHandleScroll = Utility.throttle(this.handleGridScroll.bind(this), 120);
      this.boundResize = Utility.debounce(this.handleResize.bind(this), 150);
    }

    mount() {
      if (this.initialized) {
        return;
      }
      this.collectElements();
      this.attachEvents();
      this.initialized = true;
      if (globalObject.feather && globalObject.feather.icons) {
        this.index.loadFromFeather(globalObject.feather);
        this.renderFilters();
        this.renderSuggestions();
        this.search('');
      } else {
        document.addEventListener('feather-icons-ready', () => {
          this.index.loadFromFeather(globalObject.feather);
          this.renderFilters();
          this.renderSuggestions();
          this.search('');
        }, { once: true });
      }
    }

    collectElements() {
      const root = document.getElementById('builder-icon-picker-layer');
      if (!root) {
        return;
      }
      this.elements.root = root;
      this.elements.backdrop = root.querySelector('.icon-picker-backdrop');
      this.elements.panel = root.querySelector('.icon-picker-panel');
      this.elements.close = root.querySelector('#builder-icon-picker-close');
      this.elements.search = root.querySelector('#builder-icon-search');
      this.elements.filterList = root.querySelector('#builder-icon-filter-list');
      this.elements.grid = root.querySelector('#builder-icon-grid');
      this.elements.empty = root.querySelector('#builder-icon-empty');
      this.elements.count = root.querySelector('#builder-icon-count');
      this.elements.reset = root.querySelector('#builder-icon-reset');
      this.elements.favoriteToggle = root.querySelector('#builder-icon-favorite-toggle');
      this.elements.copyName = root.querySelector('#builder-icon-copy-name');
      this.elements.apply = root.querySelector('#builder-icon-apply');
      this.elements.meta = root.querySelector('#builder-icon-meta');
      this.elements.sidebar = root.querySelector('.icon-picker-sidebar');
      this.elements.toolbar = root.querySelector('.icon-picker-toolbar');
      this.elements.results = root.querySelector('.icon-picker-results');
      this.elements.layerTrigger = document.getElementById('builder-open-icon-picker');
      this.elements.iconInput = document.getElementById('builder-action-icon');
      this.elements.iconPreview = document.getElementById('builder-icon-preview');
      this.elements.suggestions = document.getElementById('builder-icon-suggestions');
    }

    attachEvents() {
      if (!this.elements.root) return;
      this.on(this.elements.layerTrigger, 'click', () => this.open());
      this.on(this.elements.close, 'click', () => this.close());
      this.on(this.elements.backdrop, 'click', () => this.close());
      this.on(this.elements.search, 'input', Utility.debounce((event) => {
        this.search(event.target.value);
      }, 120));
      this.on(this.elements.reset, 'click', () => this.resetFilters());
      this.on(this.elements.favoriteToggle, 'click', () => this.toggleFavoriteView());
      this.on(this.elements.copyName, 'click', () => this.copySelectedName());
      this.on(this.elements.apply, 'click', () => this.applySelection());
      this.on(this.elements.grid, 'scroll', this.boundHandleScroll, { passive: true });
      window.addEventListener('resize', this.boundResize);
    }

    on(element, eventName, handler, options) {
      if (!element) return;
      element.addEventListener(eventName, handler, options || false);
      const key = `${eventName}:${handler.toString()}`;
      this.listeners.set(key, { element, eventName, handler, options });
    }

    detachListeners() {
      this.listeners.forEach(({ element, eventName, handler, options }) => {
        element.removeEventListener(eventName, handler, options || false);
      });
      window.removeEventListener('resize', this.boundResize);
      this.listeners.clear();
    }

    open() {
      if (!this.elements.root) return;
      this.active = true;
      this.elements.root.classList.add('active');
      this.elements.root.setAttribute('aria-hidden', 'false');
      this.elements.search?.focus({ preventScroll: false });
      this.syncFavoriteToggleState();
      this.ensureVirtualization();
      this.updateMeta();
      if (typeof this.requestedHostCallback === 'function') {
        this.requestedHostCallback(true);
      }
    }

    close() {
      if (!this.elements.root) return;
      this.active = false;
      this.elements.root.classList.remove('active');
      this.elements.root.setAttribute('aria-hidden', 'true');
      if (typeof this.requestedHostCallback === 'function') {
        this.requestedHostCallback(false);
      }
    }

    setHostCallback(callback) {
      this.requestedHostCallback = callback;
    }

    renderFilters() {
      if (!this.elements.filterList) {
        return;
      }
      const fragment = document.createDocumentFragment();
      this.index.getCategoryMeta().forEach((category) => {
        if (category.total === 0) {
          return;
        }
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'icon-picker-filter';
        button.dataset.category = category.id;
        button.innerHTML = `
          <span>${category.label}</span>
          <span class="count">${category.total}</span>
        `;
        button.addEventListener('click', () => this.toggleCategory(category.id, button));
        fragment.appendChild(button);
      });
      this.elements.filterList.innerHTML = '';
      this.elements.filterList.appendChild(fragment);
    }

    renderSuggestions() {
      if (!this.elements.suggestions) return;
      const sets = this.index.getSuggestions();
      const fragment = document.createDocumentFragment();
      sets.forEach((set) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'icon-suggestion-group';
        const title = document.createElement('strong');
        title.textContent = set.title;
        const list = document.createElement('div');
        list.className = 'icon-suggestion-list';
        set.icons.slice(0, MAX_SUGGESTIONS).forEach((iconName) => {
          const item = document.createElement('button');
          item.type = 'button';
          item.className = 'icon-suggestion-item';
          item.textContent = iconName;
          item.addEventListener('click', () => this.handleSuggestion(iconName));
          list.appendChild(item);
        });
        wrapper.appendChild(title);
        wrapper.appendChild(list);
        fragment.appendChild(wrapper);
      });
      this.elements.suggestions.innerHTML = '';
      this.elements.suggestions.appendChild(fragment);
    }

    handleSuggestion(iconName) {
      if (this.elements.iconInput) {
        this.elements.iconInput.value = iconName;
        this.updatePreview(iconName);
      }
      this.search(iconName);
      this.highlightSelection(iconName);
    }

    toggleCategory(categoryId, element) {
      if (this.activeCategories.has(categoryId)) {
        this.activeCategories.delete(categoryId);
        element.classList.remove('active');
      } else {
        this.activeCategories.add(categoryId);
        element.classList.add('active');
      }
      this.search(this.elements.search?.value || '');
    }

    resetFilters() {
      this.activeCategories.clear();
      this.queryTokens = [];
      this.elements.search.value = '';
      this.elements.filterList.querySelectorAll('.icon-picker-filter.active').forEach((element) => {
        element.classList.remove('active');
      });
      this.search('');
    }

    toggleFavoriteView() {
      if (!this.elements.favoriteToggle) return;
      const isActive = this.elements.favoriteToggle.classList.toggle('active');
      if (isActive) {
        this.filteredIcons = this.favorites.list()
          .map((name) => this.index.getMeta(name))
          .filter(Boolean);
        this.renderGrid(true);
      } else {
        this.search(this.elements.search?.value || '');
      }
    }

    syncFavoriteToggleState() {
      if (!this.elements.favoriteToggle) return;
      if (this.elements.favoriteToggle.classList.contains('active')) {
        this.filteredIcons = this.favorites.list()
          .map((name) => this.index.getMeta(name))
          .filter(Boolean);
        this.renderGrid(true);
      }
    }

    copySelectedName() {
      if (!this.selectedIcon || !this.elements.copyName) {
        return;
      }
      const button = this.elements.copyName;
      button.classList.remove('is-success', 'is-error');
      navigator.clipboard.writeText(this.selectedIcon.name)
        .then(() => {
          button.classList.add('is-success');
          setTimeout(() => button.classList.remove('is-success'), 1600);
        })
        .catch(() => {
          button.classList.add('is-error');
          setTimeout(() => button.classList.remove('is-error'), 1600);
        });
    }

    applySelection() {
      if (!this.selectedIcon || !this.elements.iconInput) {
        return;
      }
      this.elements.iconInput.value = this.selectedIcon.name;
      this.updatePreview(this.selectedIcon.name);
      this.close();
    }

    highlightSelection(name) {
      if (!this.elements.grid) return;
      this.elements.grid.querySelectorAll('.icon-picker-item').forEach((item) => {
        if (item.dataset.icon === name) {
          item.classList.add('active');
          item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        } else {
          item.classList.remove('active');
        }
      });
    }

    updatePreview(name) {
      if (!this.elements.iconPreview) return;
      if (globalObject.feather?.icons?.[name]) {
        this.elements.iconPreview.innerHTML = globalObject.feather.icons[name].toSvg();
      } else {
        this.elements.iconPreview.textContent = name.slice(0, 2).toUpperCase();
      }
      this.selectedIcon = this.index.getMeta(name) || { name, label: Utility.toTitleCase(name.replace(/-/g, ' ')) };
      this.updateMeta();
    }

    search(rawQuery) {
      const query = (rawQuery || '').trim();
      this.queryTokens = Utility.tokenize(query);
      this.filteredIcons = this.index.search(this.queryTokens, this.activeCategories);
      this.renderGrid();
      this.updateMeta();
    }

    renderGrid(forceImmediate = false) {
      if (!this.elements.grid) return;
      this.currentBatch = 0;
      this.elements.grid.innerHTML = '';
      if (!Array.isArray(this.filteredIcons) || this.filteredIcons.length === 0) {
        this.toggleEmptyState(true);
        this.updateCount();
        return;
      }
      this.toggleEmptyState(false);
      this.updateCount();
      this.ensureVirtualization();
      if (forceImmediate) {
        this.renderBatch();
        return;
      }
      cancelAnimationFrame(this.lastRenderFrame);
      this.lastRenderFrame = requestAnimationFrame(() => this.renderBatch());
    }

    renderBatch() {
      if (!this.elements.grid) return;
      const start = this.currentBatch * GRID_BATCH_SIZE;
      const end = start + GRID_BATCH_SIZE;
      const slice = this.filteredIcons.slice(start, end);
      if (slice.length === 0) {
        return;
      }
      const fragment = document.createDocumentFragment();
      slice.forEach((meta) => {
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'icon-picker-item';
        item.dataset.icon = meta.name;
        const preview = document.createElement('div');
        preview.className = 'icon-preview';
        if (globalObject.feather?.icons?.[meta.name]) {
          preview.innerHTML = globalObject.feather.icons[meta.name].toSvg();
        } else {
          preview.textContent = meta.name.slice(0, 2).toUpperCase();
        }
        const label = document.createElement('span');
        label.textContent = meta.label;
        item.appendChild(preview);
        item.appendChild(label);
        item.addEventListener('click', () => {
          this.selectedIcon = meta;
          this.highlightSelection(meta.name);
          this.updatePreview(meta.name);
        });
        item.addEventListener('contextmenu', (event) => {
          event.preventDefault();
          this.favorites.toggle(meta.name);
          item.classList.toggle('favorite', this.favorites.has(meta.name));
        });
        if (this.favorites.has(meta.name)) {
          item.classList.add('favorite');
        }
        if (this.elements.favoriteToggle?.classList.contains('active')) {
          item.classList.add('active');
        }
        fragment.appendChild(item);
      });
      this.elements.grid.appendChild(fragment);
      this.currentBatch += 1;
      if (this.filteredIcons.length > this.currentBatch * GRID_BATCH_SIZE) {
        this.lastRenderFrame = requestAnimationFrame(() => this.renderBatch());
      }
    }

    updateCount() {
      if (!this.elements.count) return;
      const total = Array.isArray(this.filteredIcons) ? this.filteredIcons.length : 0;
      this.elements.count.textContent = total.toString();
    }

    toggleEmptyState(isEmpty) {
      if (this.elements.empty) {
        this.elements.empty.hidden = !isEmpty;
      }
      if (this.elements.grid) {
        this.elements.grid.hidden = isEmpty;
      }
    }

    ensureVirtualization() {
      if (!this.elements.grid) return;
      const total = Array.isArray(this.filteredIcons) ? this.filteredIcons.length : 0;
      this.isVirtualized = total > VIRTUALIZATION_THRESHOLD;
      if (this.isVirtualized) {
        this.elements.grid.classList.add('virtualized');
      } else {
        this.elements.grid.classList.remove('virtualized');
      }
    }

    handleGridScroll() {
      if (!this.isVirtualized) {
        return;
      }
      const { scrollTop, scrollHeight, clientHeight } = this.elements.grid;
      if (scrollTop + clientHeight >= scrollHeight - 160) {
        this.renderBatch();
      }
    }

    handleResize() {
      this.ensureVirtualization();
    }

    updateMeta() {
      if (!this.elements.meta) return;
      const selected = this.selectedIcon;
      if (!selected) {
        this.elements.meta.innerHTML = '';
        return;
      }
      const metaInfo = [
        `<div><strong>Name:</strong> ${selected.name}</div>`,
        `<div><strong>Categories:</strong> ${selected.categories?.join(', ') || '—'}</div>`,
        `<div><strong>Synonyms:</strong> ${selected.synonyms?.slice(0, 12).join(', ') || '—'}</div>`
      ];
      this.elements.meta.innerHTML = metaInfo.join('');
    }
  }

  const controller = new IconPickerController();

  document.addEventListener('DOMContentLoaded', () => {
    controller.mount();
    if (globalObject.FlashSearchIconPicker) {
      return;
    }
    globalObject.FlashSearchIconPicker = controller;
    document.dispatchEvent(new CustomEvent('flashsearch-icon-picker-ready', { detail: controller }));
  });

  globalObject.addEventListener('beforeunload', () => {
    controller.detachListeners();
  });
})();
