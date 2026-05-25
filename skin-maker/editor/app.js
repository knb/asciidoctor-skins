const LABELS = {
  colors: {
    main: '背景',
    primary: 'プライマリ',
    secondary: 'セカンダリ',
    tertiary: '第三色',
    sidebar: 'サイドバー / フッター',
    link: 'リンク',
    link_alt: 'リンク（代替）',
    link_hover: 'リンク（ホバー）',
    text: '本文テキスト',
    border: 'ボーダー',
    code_bg: 'コード背景',
    table_stripe: '表ストライプ',
    footer_text: 'フッター文字',
    white: '白',
    black: '黒'
  },
  fonts: {
    google: 'Google Fonts（+区切り）',
    body: '本文フォント',
    heading: '見出しフォント',
    mono: '等幅フォント'
  },
  spacing: {
    header_padding: 'ヘッダー余白',
    heading_padding: '見出し余白',
    sect_border_radius: 'セクション角丸',
    toc_title_size: 'TOC タイトルサイズ',
    body_margin_x: '左右マージン',
    body_font_size: '本文フォントサイズ',
    line_height: '行間',
    content_max_width: '最大コンテンツ幅'
  }
};

const state = {
  manifest: null,
  layoutId: 'material',
  theme: null
};

const layoutSelect = document.getElementById('layout-select');
const layoutDescription = document.getElementById('layout-description');
const skinNameInput = document.getElementById('skin-name');
const colorFields = document.getElementById('color-fields');
const fontFields = document.getElementById('font-fields');
const spacingFields = document.getElementById('spacing-fields');
const previewFrame = document.getElementById('preview-frame');
const buildInstructions = document.getElementById('build-instructions');
const previewPath = document.getElementById('preview-path');
const openPreview = document.getElementById('open-preview');

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

function updateBuildInstructions() {
  const name = skinNameInput.value.trim() || 'my-skin';
  buildInstructions.textContent = [
    `# themes/${name}.yml を保存後:`,
    `bundle exec ruby skin-maker/bin/skin-maker generate themes/${name}.yml`,
    `bundle exec rake skins:build[${name}]`,
    '',
    '# AsciiDoc で利用:',
    `:stylesheet: ${name}.css`
  ].join('\n');
}

function applyPreviewStylesheet() {
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
  link.href = new URL(layout.previewCss, window.location.href).pathname;
}

function applyTokenOverrides() {
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

function renderFields() {
  const layout = currentLayout();
  state.theme = deepClone(layout.defaults);

  colorFields.innerHTML = '';
  fontFields.innerHTML = '';
  spacingFields.innerHTML = '';

  Object.entries(state.theme.colors || {}).forEach(([key, value]) => {
    if (!state.manifest.tokenMap.colors[key]) return;

    const wrapper = document.createElement('label');
    wrapper.className = 'color-field';
    wrapper.innerHTML = `
      <span>${LABELS.colors[key] || key}</span>
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

    colorFields.appendChild(wrapper);
  });

  Object.entries(state.theme.fonts || {}).forEach(([key, value]) => {
    if (!state.manifest.tokenMap.fonts[key] && key !== 'google') return;

    const wrapper = document.createElement('label');
    wrapper.innerHTML = `
      <span>${LABELS.fonts[key] || key}</span>
      <input type="text" data-group="fonts" data-key="${key}" value="${value || ''}">
    `;
    fontFields.appendChild(wrapper);
  });

  Object.entries(state.theme.spacing || {}).forEach(([key, value]) => {
    if (!state.manifest.tokenMap.spacing[key]) return;

    const wrapper = document.createElement('label');
    wrapper.innerHTML = `
      <span>${LABELS.spacing[key] || key}</span>
      <input type="text" data-group="spacing" data-key="${key}" value="${value || ''}">
    `;
    spacingFields.appendChild(wrapper);
  });

  layoutDescription.textContent = layout.description;
  updateBuildInstructions();
  refreshPreview();
}

function handleColorPicker(event) {
  const { key } = event.target.dataset;
  const textInput = colorFields.querySelector(`input[type="text"][data-key="${key}"]`);
  if (textInput) textInput.value = event.target.value;
  handleFieldInput({ target: textInput });
}

function handleFieldInput(event) {
  const { group, key } = event.target.dataset;
  if (!group || !key) return;

  state.theme[group][key] = event.target.value;

  const picker = colorFields.querySelector(`input[type="color"][data-key="${key}"]`);
  if (picker && isHexColor(event.target.value)) {
    picker.value = normalizeHex(event.target.value);
  }

  applyTokenOverrides();
  updateBuildInstructions();
}

function refreshPreview() {
  applyPreviewStylesheet();
  applyTokenOverrides();
}

function exportYaml() {
  const name = skinNameInput.value.trim() || 'my-skin';
  const payload = {
    name,
    layout: state.layoutId,
    fonts: state.theme.fonts,
    colors: state.theme.colors,
    spacing: state.theme.spacing
  };

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

  const blob = new Blob([`${yaml}\n`], { type: 'text/yaml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${name}.yml`;
  anchor.click();
  URL.revokeObjectURL(url);
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
  alert('CSS 変数ブロックをクリップボードにコピーしました。');
}

function resetTheme() {
  renderFields();
}

async function init() {
  const response = await fetch('manifest.json');
  state.manifest = await response.json();

  Object.values(state.manifest.layouts).forEach((layout) => {
    const option = document.createElement('option');
    option.value = layout.id;
    option.textContent = layout.label;
    layoutSelect.appendChild(option);
  });

  previewPath.textContent = state.manifest.previewPage.replace('../', '');
  openPreview.href = new URL(state.manifest.previewPage, window.location.href).pathname;

  layoutSelect.addEventListener('change', () => {
    state.layoutId = layoutSelect.value;
    renderFields();
  });

  skinNameInput.addEventListener('input', updateBuildInstructions);
  document.body.addEventListener('input', handleFieldInput);
  document.getElementById('btn-reset').addEventListener('click', resetTheme);
  document.getElementById('btn-export-yaml').addEventListener('click', exportYaml);
  document.getElementById('btn-export-css').addEventListener('click', exportCssVars);

  previewFrame.addEventListener('load', refreshPreview);

  state.layoutId = Object.keys(state.manifest.layouts)[0];
  layoutSelect.value = state.layoutId;
  renderFields();
}

init().catch((error) => {
  console.error(error);
  document.body.innerHTML = `<pre>Skin Maker の初期化に失敗しました。\n\nbundle exec rake editor:build\nbundle exec rake preview:index2\n\n${error}</pre>`;
});
