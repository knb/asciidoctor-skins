const SETTING_GROUPS = [
  {
    id: 'skin',
    open: true,
    type: 'skin'
  },
  {
    id: 'fonts',
    open: true,
    items: [{ group: 'fonts', keys: ['google', 'body', 'heading', 'mono'] }]
  },
  {
    id: 'body',
    open: true,
    items: [
      { group: 'colors', keys: ['main', 'text'] },
      { group: 'spacing', keys: ['body_font_size', 'line_height', 'body_margin_x', 'content_max_width'] }
    ]
  },
  {
    id: 'headings',
    open: false,
    items: [
      { group: 'colors', keys: ['primary', 'secondary', 'tertiary'] },
      { group: 'spacing', keys: ['heading_padding'] }
    ]
  },
  {
    id: 'sidebar',
    open: false,
    items: [
      { group: 'colors', keys: ['sidebar'] },
      { group: 'spacing', keys: ['toc_title_size'] }
    ]
  },
  {
    id: 'header-footer',
    open: false,
    items: [
      { group: 'colors', keys: ['footer_text'] },
      { group: 'spacing', keys: ['header_padding'] }
    ]
  },
  {
    id: 'links',
    open: false,
    items: [{ group: 'colors', keys: ['link', 'link_hover', 'link_alt'] }]
  },
  {
    id: 'tables-code',
    open: false,
    items: [
      { group: 'colors', keys: ['border', 'code_bg', 'table_stripe'] },
      { group: 'spacing', keys: ['sect_border_radius'] }
    ]
  },
  {
    id: 'misc',
    open: false,
    items: [{ group: 'colors', keys: ['white', 'black'] }]
  }
];

const COMPILE_API_PATH = '/skin-maker/api/compile';

const state = {
  manifest: null,
  layoutId: 'material',
  previewPageId: 'en',
  sourceMap: null,
  sourceInspect: false,
  selectedSourceId: null,
  compileApiAvailable: false,
  theme: null
};

const settingsContainer = document.getElementById('settings-container');
const previewFrame = document.getElementById('preview-frame');
const buildInstructions = document.getElementById('build-instructions');
const previewPath = document.getElementById('preview-path');
const previewDocSelect = document.getElementById('preview-doc-select');
const sourceInspectToggle = document.getElementById('source-inspect-toggle');
const previewBody = document.querySelector('.preview-body');
const previewSourcePanel = document.getElementById('preview-source-panel');
const sourceKind = document.getElementById('source-kind');
const sourceLocation = document.getElementById('source-location');
const sourceContent = document.getElementById('source-content');
const sourceOpenAdoc = document.getElementById('source-open-adoc');
const sourceCopyButton = document.getElementById('source-copy');
const openPreview = document.getElementById('open-preview');
const fileProtocolBanner = document.getElementById('file-protocol-banner');
const compileApiBanner = document.getElementById('compile-api-banner');
const exportCssFileButton = document.getElementById('btn-export-css-file');
const localeSelect = document.getElementById('locale-select');

const INSPECT_STYLE_ID = 'skin-maker-inspect-style';

let skinNameInput;
let layoutSelect;
let layoutDescription;
let skinSectionSummary;
let skinNameLabel;
let layoutLabel;

const EDITOR_PATH_MARKER = '/skin-maker/editor/';

function isFileProtocol() {
  return window.location.protocol === 'file:';
}

function siteBasePath() {
  const configured = state.manifest?.pagesBasePath;
  if (configured) {
    return configured;
  }

  const pathname = window.location.pathname;
  const markerIndex = pathname.indexOf(EDITOR_PATH_MARKER);
  if (markerIndex > 0) {
    return pathname.slice(0, markerIndex);
  }

  return '';
}

function resolveUrl(path) {
  if (!path) return '';
  if (/^https?:\/\//.test(path)) return path;
  if (path.startsWith('/')) {
    return `${window.location.origin}${siteBasePath()}${path}`;
  }
  return new URL(path, window.location.href).href;
}

async function loadManifest() {
  if (window.__SKIN_MAKER_MANIFEST__) {
    return window.__SKIN_MAKER_MANIFEST__;
  }

  const response = await fetch('manifest.json');
  if (!response.ok) throw new Error(`manifest.json: HTTP ${response.status}`);
  return response.json();
}

function cssFontStack(value) {
  const parts = value.split(',').map((part) => part.trim()).filter(Boolean);
  if (parts.length === 0) return 'sans-serif';
  const [first, ...rest] = parts;
  const quote = (name) => (/^(serif|sans-serif|monospace|cursive|fantasy)$/.test(name) ? name : `"${name}"`);
  return [quote(first.replace(/^"|"$/g, '')), ...rest.map((part) => quote(part.replace(/^"|"$/g, '')))].join(', ');
}

function isHexColor(value) {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value);
}

function normalizeHex(value) {
  if (!value) return '#000000';
  if (/^#[0-9a-f]{3}$/i.test(value)) {
    return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`;
  }
  return value;
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function currentLayout() {
  return state.manifest.layouts[state.layoutId];
}

function previewPages() {
  if (Array.isArray(state.manifest.previewPages) && state.manifest.previewPages.length) {
    return state.manifest.previewPages;
  }

  const fallbackPath = state.manifest.previewPage || '/index2.html';
  return [{ id: 'en', label: 'English (index2.html)', path: fallbackPath }];
}

function currentPreviewPage() {
  const pages = previewPages();
  return pages.find((page) => page.id === state.previewPageId) || pages[0];
}

function updatePreviewLinks() {
  const page = currentPreviewPage();
  const url = resolveUrl(page.path);
  previewPath.textContent = page.path.replace(/^\//, '');
  if (!isFileProtocol()) {
    openPreview.href = url;
  }
}

function loadPreviewDocument() {
  if (isFileProtocol()) return;

  const page = currentPreviewPage();
  previewFrame.src = resolveUrl(page.path);
  updatePreviewLinks();
  state.sourceMap = null;
  hideSourcePanel();
}

async function loadSourceMap() {
  const page = currentPreviewPage();
  if (!page.sourceMap) {
    state.sourceMap = null;
    return;
  }

  if (window.__SKIN_MAKER_SOURCE_MAPS__?.[page.id]) {
    state.sourceMap = window.__SKIN_MAKER_SOURCE_MAPS__[page.id];
    return;
  }

  const response = await fetch(resolveUrl(page.sourceMap));
  if (!response.ok) throw new Error(`${page.sourceMap}: HTTP ${response.status}`);
  state.sourceMap = await response.json();
}

function kindLabel(kind) {
  const label = t(`kinds.${kind}`);
  return label === `kinds.${kind}` ? kind : label;
}

function layoutDescriptionText(layoutId) {
  const localized = t(`layout.${layoutId}.description`);
  if (localized !== `layout.${layoutId}.description`) {
    return localized;
  }
  return state.manifest?.layouts?.[layoutId]?.description || '';
}

function previewDocLabel(page) {
  const localized = t(`previewDoc.${page.id}`);
  return localized !== `previewDoc.${page.id}` ? localized : page.label;
}

function renderBanners() {
  const serveUrl = resolveUrl('/skin-maker/editor/index.html');
  fileProtocolBanner.innerHTML = `<strong>${t('banner.fileProtocolTitle')}</strong> ${formatMessage(t('banner.fileProtocolHtml'), { serveUrl })}`;
  compileApiBanner.innerHTML = `<strong>${t('banner.compileApiTitle')}</strong> ${t('banner.compileApiHtml')}`;
}

function applyStaticUi() {
  document.title = t('app.title');
  document.getElementById('app-subtitle').textContent = t('header.subtitle');
  document.getElementById('locale-label').textContent = t('header.language');
  document.getElementById('btn-reset').textContent = t('header.reset');
  document.getElementById('btn-export-yaml').textContent = t('header.exportYaml');
  exportCssFileButton.textContent = t('header.exportCss');
  document.getElementById('btn-export-css').textContent = t('header.exportCssVars');
  document.getElementById('build-summary').textContent = t('build.summary');
  document.getElementById('preview-doc-label').textContent = t('preview.document');
  document.getElementById('source-inspect-label').textContent = t('preview.sourceInspect');
  document.getElementById('preview-file-label').textContent = t('preview.file');
  openPreview.textContent = t('preview.openTab');
  previewFrame.title = t('preview.frameTitle');
  sourceOpenAdoc.textContent = t('source.openAdoc');
  sourceCopyButton.textContent = t('source.copy');
  renderBanners();
  updateCompileApiUi();

  const previewUnavailable = document.getElementById('preview-unavailable');
  if (previewUnavailable) {
    previewUnavailable.innerHTML = t('preview.unavailable');
  }

  if (skinSectionSummary) {
    skinSectionSummary.textContent = t('groups.skin');
  }
  if (skinNameLabel) {
    skinNameLabel.textContent = t('skin.name');
  }
  if (layoutLabel) {
    layoutLabel.textContent = t('skin.layout');
  }
  if (layoutSelect) {
    updateSkinSection();
  }
  updatePreviewDocLabels();
  updateBuildInstructions();

  if (state.theme) {
    renderSettingGroups();
  }
}

function updatePreviewDocLabels() {
  if (!previewDocSelect) return;

  previewPages().forEach((page) => {
    const option = previewDocSelect.querySelector(`option[value="${page.id}"]`);
    if (option) {
      option.textContent = previewDocLabel(page);
    }
  });
}

function applyLocale(locale) {
  setLocale(locale);
  if (localeSelect) {
    localeSelect.value = getLocale();
  }
  applyStaticUi();

  if (state.selectedSourceId && state.sourceMap?.entryIndex?.[state.selectedSourceId]) {
    showSourceEntry(state.sourceMap.entryIndex[state.selectedSourceId]);
  }
}

function resolveSourceEntry(element) {
  if (!state.sourceMap || !element) return null;

  const { entryIndex, sectionIndex, domIdIndex } = state.sourceMap;
  const tagged = element.closest('[data-sm-id], [id^="sm-"]');
  if (tagged) {
    const entryId = tagged.dataset.smId || tagged.id;
    if (entryIndex[entryId]) return entryIndex[entryId];
  }

  const heading = element.closest('h1, h2, h3, h4, h5, h6');
  if (heading?.id) {
    if (sectionIndex?.[heading.id]) return sectionIndex[heading.id];
    if (domIdIndex?.[heading.id]) return entryIndex[domIdIndex[heading.id]];
  }

  if (element.closest('#header')) {
    return entryIndex['sm-0'] || state.sourceMap.entries.find((entry) => entry.kind === 'document-title');
  }

  const domNode = element.closest('[id]');
  if (domNode?.id && domIdIndex?.[domNode.id]) {
    return entryIndex[domIdIndex[domNode.id]];
  }

  return null;
}

function showSourceEntry(entry) {
  if (!entry) return;

  state.selectedSourceId = entry.id;
  sourceKind.textContent = kindLabel(entry.kind);
  const bits = [];
  if (entry.title) bits.push(entry.title);
  if (entry.sectionId && entry.sectionId !== '_preamble') bits.push(`#${entry.sectionId}`);
  if (entry.line) bits.push(t('source.line', { line: entry.line }));
  sourceLocation.textContent = bits.join(' · ');
  sourceContent.textContent = entry.source || t('source.noSource');

  const page = currentPreviewPage();
  if (page.sourceFile) {
    const url = new URL(resolveUrl(page.sourceFile));
    if (entry.line) url.hash = `L${entry.line}`;
    sourceOpenAdoc.href = url.href;
  }

  previewSourcePanel.classList.remove('hidden');
  previewBody.classList.add('source-open');
  highlightSelectedPreviewElement(entry.id);
}

function hideSourcePanel() {
  previewSourcePanel.classList.add('hidden');
  previewBody.classList.remove('source-open');
  state.selectedSourceId = null;
  highlightSelectedPreviewElement(null);
}

function highlightSelectedPreviewElement(entryId) {
  if (isFileProtocol()) return;

  const doc = previewFrame.contentDocument;
  if (!doc) return;

  doc.querySelectorAll('.sm-source-selected').forEach((node) => {
    node.classList.remove('sm-source-selected');
  });

  if (!entryId) return;

  const target = doc.querySelector(`[data-sm-id="${entryId}"], #${entryId}`);
  if (target) target.classList.add('sm-source-selected');
}

function ensureInspectStyles(doc) {
  if (!doc || doc.getElementById(INSPECT_STYLE_ID)) return;

  const style = doc.createElement('style');
  style.id = INSPECT_STYLE_ID;
  style.textContent = `
    body.skin-maker-inspect [data-sm-id],
    body.skin-maker-inspect [id^="sm-"],
    body.skin-maker-inspect h1,
    body.skin-maker-inspect h2,
    body.skin-maker-inspect h3,
    body.skin-maker-inspect h4,
    body.skin-maker-inspect h5,
    body.skin-maker-inspect h6 {
      cursor: crosshair;
    }

    body.skin-maker-inspect [data-sm-id]:hover,
    body.skin-maker-inspect [id^="sm-"]:hover,
    body.skin-maker-inspect h1:hover,
    body.skin-maker-inspect h2:hover,
    body.skin-maker-inspect h3:hover,
    body.skin-maker-inspect h4:hover,
    body.skin-maker-inspect h5:hover,
    body.skin-maker-inspect h6:hover,
    body.skin-maker-inspect #header:hover {
      outline: 2px solid #2563eb;
      outline-offset: 2px;
    }

    .sm-source-selected {
      outline: 2px solid #db2777 !important;
      outline-offset: 2px;
    }
  `;
  doc.head.appendChild(style);
}

function setSourceInspectEnabled(enabled) {
  state.sourceInspect = enabled;
  if (isFileProtocol()) return;

  const doc = previewFrame.contentDocument;
  if (!doc) return;

  doc.body?.classList.toggle('skin-maker-inspect', enabled);
  if (!enabled) hideSourcePanel();
}

function handlePreviewClick(event) {
  if (!state.sourceInspect || !state.sourceMap) return;

  const entry = resolveSourceEntry(event.target);
  if (!entry) return;

  event.preventDefault();
  event.stopPropagation();
  showSourceEntry(entry);
}

async function setupSourceInspector() {
  if (isFileProtocol()) {
    sourceInspectToggle.disabled = true;
    return;
  }

  sourceInspectToggle.addEventListener('change', () => {
    setSourceInspectEnabled(sourceInspectToggle.checked);
  });

  sourceCopyButton.addEventListener('click', async () => {
    if (!sourceContent.textContent) return;
    await navigator.clipboard.writeText(sourceContent.textContent);
    sourceCopyButton.textContent = t('source.copyDone');
    setTimeout(() => {
      sourceCopyButton.textContent = t('source.copy');
    }, 1200);
  });

  previewFrame.addEventListener('load', async () => {
    try {
      await loadSourceMap();
    } catch (error) {
      console.error(error);
      state.sourceMap = null;
    }

    const doc = previewFrame.contentDocument;
    if (!doc) return;

    ensureInspectStyles(doc);
    setSourceInspectEnabled(state.sourceInspect);
    doc.body?.removeEventListener('click', handlePreviewClick);
    doc.body?.addEventListener('click', handlePreviewClick);
    if (state.selectedSourceId && state.sourceMap?.entryIndex?.[state.selectedSourceId]) {
      showSourceEntry(state.sourceMap.entryIndex[state.selectedSourceId]);
    }
  });
}

function setupPreviewDocSelect() {
  previewDocSelect.innerHTML = '';
  previewPages().forEach((page) => {
    const option = document.createElement('option');
    option.value = page.id;
    option.textContent = previewDocLabel(page);
    previewDocSelect.appendChild(option);
  });

  const defaultId = state.manifest.defaultPreviewPage;
  if (defaultId && previewPages().some((page) => page.id === defaultId)) {
    state.previewPageId = defaultId;
  } else {
    state.previewPageId = previewPages()[0].id;
  }

  previewDocSelect.value = state.previewPageId;
  previewDocSelect.addEventListener('change', () => {
    state.previewPageId = previewDocSelect.value;
    loadPreviewDocument();
  });
}

function themePayload() {
  const name = skinNameInput.value.trim() || 'my-skin';
  return {
    name,
    layout: state.layoutId,
    fonts: state.theme.fonts,
    colors: state.theme.colors,
    spacing: state.theme.spacing
  };
}

function downloadTextFile(filename, text, mimeType) {
  const blob = new Blob([text], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

async function detectCompileApi() {
  if (isFileProtocol()) {
    state.compileApiAvailable = false;
    return;
  }

  try {
    const response = await fetch(resolveUrl(COMPILE_API_PATH));
    if (!response.ok) {
      state.compileApiAvailable = false;
      return;
    }
    const body = await response.json();
    state.compileApiAvailable = body.status === 'ok';
  } catch {
    state.compileApiAvailable = false;
  }
}

function updateCompileApiUi() {
  if (!exportCssFileButton || !compileApiBanner) return;

  exportCssFileButton.disabled = !state.compileApiAvailable;
  exportCssFileButton.title = state.compileApiAvailable
    ? t('compile.titleAvailable')
    : t('compile.titleUnavailable');

  if (!isFileProtocol() && !state.compileApiAvailable) {
    compileApiBanner.classList.remove('hidden');
  } else {
    compileApiBanner.classList.add('hidden');
  }
}

function updateBuildInstructions() {
  const name = skinNameInput.value.trim() || 'my-skin';
  buildInstructions.textContent = [
    t('build.afterSave', { name }),
    t('build.generate', { name }),
    t('build.build', { name }),
    '',
    state.compileApiAvailable ? t('build.orDownloadCss') : t('build.orDownloadCssHint'),
    '',
    t('build.asciidoc'),
    t('build.stylesheet', { name })
  ].join('\n');
}

function applyPreviewStylesheet() {
  if (isFileProtocol()) return;

  const doc = previewFrame.contentDocument;
  if (!doc) return;

  const layout = currentLayout();
  let link = doc.getElementById('skin-maker-stylesheet');
  if (!link) {
    link = doc.createElement('link');
    link.id = 'skin-maker-stylesheet';
    link.rel = 'stylesheet';
    doc.head.appendChild(link);
  }
  link.href = resolveUrl(layout.previewCss);
}

function applyTokenOverrides() {
  if (isFileProtocol()) return;

  const doc = previewFrame.contentDocument;
  if (!doc || !state.manifest) return;

  const root = doc.documentElement;
  const { tokenMap } = state.manifest;

  Object.entries(state.theme.colors || {}).forEach(([key, value]) => {
    const cssVar = tokenMap.colors[key];
    if (cssVar && value) root.style.setProperty(cssVar, value);
  });

  Object.entries(state.theme.fonts || {}).forEach(([key, value]) => {
    const cssVar = tokenMap.fonts[key];
    if (!cssVar || !value) return;
    if (key === 'google') return;
    root.style.setProperty(cssVar, cssFontStack(value));
  });

  Object.entries(state.theme.spacing || {}).forEach(([key, value]) => {
    const cssVar = tokenMap.spacing[key];
    if (cssVar && value) root.style.setProperty(cssVar, value);
  });
}

function fieldLabel(group, key) {
  const label = t(`fields.${group}.${key}`);
  return label === `fields.${group}.${key}` ? key : label;
}

function isFieldAvailable(group, key) {
  if (group === 'fonts' && key === 'google') return true;
  return Boolean(state.manifest.tokenMap[group]?.[key]);
}

function hasThemeValue(group, key) {
  const value = state.theme?.[group]?.[key];
  return value !== undefined && value !== null && String(value).trim() !== '';
}

function createTextField(group, key, value) {
  const wrapper = document.createElement('label');
  wrapper.innerHTML = `
    <span>${fieldLabel(group, key)}</span>
    <input type="text" data-group="${group}" data-key="${key}" value="${value ?? ''}">
  `;
  return wrapper;
}

function createColorField(key, value) {
  const wrapper = document.createElement('label');
  wrapper.className = 'color-field';
  wrapper.innerHTML = `
    <span>${fieldLabel('colors', key)}</span>
    <input type="text" data-group="colors" data-key="${key}" value="${value}">
  `;

  if (isHexColor(value)) {
    const picker = document.createElement('input');
    picker.type = 'color';
    picker.value = normalizeHex(value);
    picker.dataset.group = 'colors';
    picker.dataset.key = key;
    picker.addEventListener('input', handleColorPicker);
    wrapper.appendChild(picker);
  }

  return wrapper;
}

function renderSkinSection() {
  const details = document.createElement('details');
  details.className = 'settings-group';
  details.dataset.groupId = 'skin';
  details.open = true;

  const summary = document.createElement('summary');
  summary.textContent = t('groups.skin');
  skinSectionSummary = summary;
  details.appendChild(summary);

  const body = document.createElement('div');
  body.className = 'settings-body';
  body.innerHTML = `
    <div class="field-grid">
      <label>
        <span id="skin-name-label"></span>
        <input type="text" id="skin-name" value="my-skin" placeholder="my-skin">
      </label>
      <label>
        <span id="layout-label"></span>
        <select id="layout-select"></select>
      </label>
    </div>
    <p id="layout-description" class="hint"></p>
  `;
  details.appendChild(body);
  settingsContainer.appendChild(details);

  skinNameInput = body.querySelector('#skin-name');
  layoutSelect = body.querySelector('#layout-select');
  layoutDescription = body.querySelector('#layout-description');
  skinNameLabel = body.querySelector('#skin-name-label');
  layoutLabel = body.querySelector('#layout-label');
  skinNameLabel.textContent = t('skin.name');
  layoutLabel.textContent = t('skin.layout');

  Object.values(state.manifest.layouts).forEach((layout) => {
    const option = document.createElement('option');
    option.value = layout.id;
    option.textContent = layout.label;
    layoutSelect.appendChild(option);
  });

  skinNameInput.addEventListener('input', updateBuildInstructions);
}

function updateSkinSection() {
  if (!layoutSelect || !layoutDescription) return;
  layoutSelect.value = state.layoutId;
  layoutDescription.textContent = layoutDescriptionText(state.layoutId);
}

function renderFieldGroup(body, items) {
  const grid = document.createElement('div');
  grid.className = 'field-grid';

  items.forEach(({ group, keys }) => {
    keys.forEach((key) => {
      if (!isFieldAvailable(group, key) || !hasThemeValue(group, key)) return;

      const value = state.theme[group][key];
      const field = group === 'colors'
        ? createColorField(key, value)
        : createTextField(group, key, value);
      grid.appendChild(field);
    });
  });

  if (grid.children.length > 0) {
    body.appendChild(grid);
  }
}

function captureGroupOpenState() {
  const openState = {};
  settingsContainer.querySelectorAll('details.settings-group').forEach((details) => {
    openState[details.dataset.groupId] = details.open;
  });
  return openState;
}

function renderSettingGroups() {
  const openState = captureGroupOpenState();
  const preservedName = skinNameInput?.value;

  settingsContainer.querySelectorAll('details.settings-group:not([data-group-id="skin"])').forEach((node) => {
    node.remove();
  });

  SETTING_GROUPS.forEach((groupDef) => {
    if (groupDef.type === 'skin') return;

    const hasFields = groupDef.items.some(({ group, keys }) =>
      keys.some((key) => isFieldAvailable(group, key) && hasThemeValue(group, key))
    );
    if (!hasFields) return;

    const details = document.createElement('details');
    details.className = 'settings-group';
    details.dataset.groupId = groupDef.id;
    details.open = openState[groupDef.id] ?? groupDef.open;

    const summary = document.createElement('summary');
    summary.textContent = t(`groups.${groupDef.id}`);
    details.appendChild(summary);

    const body = document.createElement('div');
    body.className = 'settings-body';
    renderFieldGroup(body, groupDef.items);

    if (body.children.length > 0) {
      details.appendChild(body);
      settingsContainer.appendChild(details);
    }
  });

  if (preservedName && skinNameInput) {
    skinNameInput.value = preservedName;
  }

  updateSkinSection();
}

function renderFields() {
  state.theme = deepClone(currentLayout().defaults);
  renderSettingGroups();
  updateBuildInstructions();
  refreshPreview();
}

function refreshPreview() {
  applyPreviewStylesheet();
  applyTokenOverrides();
}

function handleColorPicker(event) {
  const { key } = event.target.dataset;
  const textInput = document.querySelector(`input[type="text"][data-group="colors"][data-key="${key}"]`);
  if (textInput) textInput.value = event.target.value;
  handleFieldInput({ target: textInput });
}

function handleFieldInput(event) {
  const { group, key } = event.target.dataset;
  if (!group || !key) return;

  state.theme[group][key] = event.target.value;

  const picker = document.querySelector(`input[type="color"][data-group="colors"][data-key="${key}"]`);
  if (picker && isHexColor(event.target.value)) {
    picker.value = normalizeHex(event.target.value);
  }

  applyTokenOverrides();
  updateBuildInstructions();
}

function setupPreviewSurface() {
  const previewPanel = previewFrame.parentElement;

  if (isFileProtocol()) {
    fileProtocolBanner.classList.remove('hidden');
    previewFrame.replaceWith(Object.assign(document.createElement('div'), {
      id: 'preview-unavailable',
      className: 'preview-unavailable',
      innerHTML: t('preview.unavailable')
    }));
    openPreview.href = '#';
    openPreview.onclick = (event) => {
      event.preventDefault();
      alert(t('preview.unavailableAlert'));
    };
    return;
  }

  fileProtocolBanner.classList.add('hidden');
  setupPreviewDocSelect();
  loadPreviewDocument();
}

function exportYaml() {
  const payload = themePayload();
  const yaml = [
    '---',
    `name: ${payload.name}`,
    `layout: ${payload.layout}`,
    'fonts:',
    ...Object.entries(payload.fonts).map(([key, value]) => `  ${key}: ${JSON.stringify(value)}`),
    'colors:',
    ...Object.entries(payload.colors).map(([key, value]) => `  ${key}: ${JSON.stringify(value)}`),
    'spacing:',
    ...Object.entries(payload.spacing).map(([key, value]) => `  ${key}: ${JSON.stringify(value)}`)
  ].join('\n');

  downloadTextFile(`${payload.name}.yml`, `${yaml}\n`, 'text/yaml;charset=utf-8');
}

async function exportCssFile() {
  if (!state.compileApiAvailable) {
    alert(t('compile.downloadAlert'));
    return;
  }

  const payload = themePayload();
  exportCssFileButton.disabled = true;

  try {
    const response = await fetch(resolveUrl(COMPILE_API_PATH), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const body = await response.json();
    if (!response.ok) {
      throw new Error(body.error || `HTTP ${response.status}`);
    }

    downloadTextFile(`${body.name || payload.name}.css`, body.css, 'text/css;charset=utf-8');
  } catch (error) {
    alert(t('compile.failed', { message: error.message }));
  } finally {
    updateCompileApiUi();
  }
}

async function exportCssVars() {
  const lines = [];
  Object.entries(state.manifest.tokenMap.colors).forEach(([key, cssVar]) => {
    const value = state.theme.colors[key];
    if (value) lines.push(`${cssVar}: ${value};`);
  });
  Object.entries(state.manifest.tokenMap.fonts).forEach(([key, cssVar]) => {
    const value = state.theme.fonts[key];
    if (value && key !== 'google') lines.push(`${cssVar}: ${cssFontStack(value)};`);
  });
  Object.entries(state.manifest.tokenMap.spacing).forEach(([key, cssVar]) => {
    const value = state.theme.spacing[key];
    if (value) lines.push(`${cssVar}: ${value};`);
  });

  const text = `:root {\n  ${lines.join('\n  ')}\n}`;
  await navigator.clipboard.writeText(text);
  alert(t('cssVars.copied'));
}

function resetTheme() {
  renderFields();
}

async function init() {
  document.documentElement.lang = getLocale();
  if (localeSelect) {
    localeSelect.value = getLocale();
    localeSelect.addEventListener('change', () => {
      applyLocale(localeSelect.value);
    });
  }

  state.manifest = await loadManifest();

  document.body.addEventListener('input', handleFieldInput);
  document.getElementById('btn-reset').addEventListener('click', resetTheme);
  document.getElementById('btn-export-yaml').addEventListener('click', exportYaml);
  document.getElementById('btn-export-css-file').addEventListener('click', exportCssFile);
  document.getElementById('btn-export-css').addEventListener('click', exportCssVars);

  state.layoutId = Object.keys(state.manifest.layouts)[0];

  await detectCompileApi();
  updateCompileApiUi();

  settingsContainer.addEventListener('change', (event) => {
    if (event.target.id === 'layout-select') {
      state.layoutId = event.target.value;
      renderFields();
    }
  });

  renderSkinSection();
  setupPreviewSurface();
  setupSourceInspector();

  if (!isFileProtocol()) {
    previewFrame.addEventListener('load', refreshPreview);
  }

  renderFields();
  applyStaticUi();
}

init().catch((error) => {
  console.error(error);
  document.body.innerHTML = `<pre>${formatMessage(t('init.failed'), { error })}</pre>`;
});
