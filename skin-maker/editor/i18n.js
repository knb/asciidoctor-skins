const LOCALE_STORAGE_KEY = 'skin-maker-locale';
const SUPPORTED_LOCALES = ['en', 'ja'];

const MESSAGES = {
  en: {
    app: {
      title: 'Asciidoctor Skin Maker'
    },
    header: {
      subtitle: 'Pick a layout, tune colors and fonts, and export your theme.',
      language: 'Language',
      reset: 'Reset',
      exportYaml: 'Download YAML',
      exportCss: 'Download CSS',
      exportCssVars: 'Copy CSS variables'
    },
    banner: {
      fileProtocolTitle: 'Live preview is unavailable on file://.',
      fileProtocolHtml: 'Run <code>bundle exec rake editor:open</code> in a terminal, or open <a href="{serveUrl}">{serveUrl}</a> after <code>bundle exec rake editor:serve</code>. Color editing and YAML export still work.',
      compileApiTitle: 'CSS download is only available on the local server.',
      compileApiHtml: 'On GitHub Pages you can download YAML and copy CSS variables. For full CSS run <code>bundle exec rake editor:open</code>.'
    },
    groups: {
      skin: 'Skin',
      fonts: 'Fonts',
      body: 'Body',
      headings: 'Headings',
      sidebar: 'Sidebar / TOC',
      'header-footer': 'Header / Footer',
      links: 'Links',
      'tables-code': 'Tables / Code',
      misc: 'Misc'
    },
    skin: {
      name: 'Skin name',
      layout: 'Layout'
    },
    build: {
      summary: 'Build steps',
      afterSave: '# After saving themes/{name}.yml:',
      generate: 'bundle exec ruby skin-maker/bin/skin-maker generate themes/{name}.yml',
      build: 'bundle exec rake skins:build[{name}]',
      orDownloadCss: '# Or use “Download CSS” in the editor',
      orDownloadCssHint: '# “Download CSS” is available when the local server is running',
      asciidoc: '# In AsciiDoc:',
      stylesheet: ':stylesheet: {name}.css'
    },
    preview: {
      document: 'Preview document',
      sourceInspect: 'Source inspect',
      file: 'File:',
      openTab: 'Open in new tab',
      frameTitle: 'Skin preview',
      unavailable: 'Live preview requires an HTTP server.<br><code>bundle exec rake editor:open</code>',
      unavailableAlert: 'Run bundle exec rake editor:open before opening the preview.'
    },
    previewDoc: {
      en: 'English (index2.html)',
      ja: 'Japanese (index2-ja.html)'
    },
    source: {
      element: 'Element',
      openAdoc: 'Open .adoc',
      copy: 'Copy',
      copyDone: 'Copied',
      noSource: '(no source)',
      line: 'Line {line}'
    },
    layout: {
      material: {
        description: 'Filled heading bands and sidebar table of contents.'
      },
      plain: {
        description: 'Minimal typography-focused layout.'
      },
      bootswatch: {
        description: 'Horizontal navbar TOC with document margins.'
      },
      tufte: {
        description: 'Serif typography with generous side margins.'
      }
    },
    fields: {
      colors: {
        main: 'Background',
        primary: 'Primary',
        secondary: 'Secondary',
        tertiary: 'Tertiary',
        sidebar: 'Sidebar background',
        link: 'Link',
        link_alt: 'Link (alt)',
        link_hover: 'Link (hover)',
        text: 'Body text',
        border: 'Border',
        code_bg: 'Code background',
        table_stripe: 'Table stripe',
        footer_text: 'Footer text',
        white: 'White',
        black: 'Black'
      },
      fonts: {
        google: 'Google Fonts (+ separated)',
        body: 'Body font',
        heading: 'Heading font',
        mono: 'Monospace font'
      },
      spacing: {
        header_padding: 'Header padding',
        heading_padding: 'Heading padding',
        sect_border_radius: 'Section radius',
        toc_title_size: 'TOC title size',
        body_margin_x: 'Horizontal margin',
        body_font_size: 'Body font size',
        line_height: 'Line height',
        content_max_width: 'Max content width'
      }
    },
    kinds: {
      'document-title': 'Document header',
      section: 'Section heading',
      paragraph: 'Paragraph',
      literal: 'Literal paragraph',
      listing: 'Source code',
      image: 'Image',
      table: 'Table',
      quote: 'Quote',
      example: 'Example',
      sidebar: 'Sidebar',
      admonition: 'Admonition',
      olist: 'Ordered list',
      ulist: 'Unordered list',
      dlist: 'Description list',
      hdlist: 'Horizontal list',
      colist: 'Callout list',
      verse: 'Verse',
      open: 'Open block',
      pass: 'Passthrough',
      stem: 'STEM',
      thematic_break: 'Thematic break',
      page_break: 'Page break',
      floating_title: 'Floating title',
      video: 'Video',
      audio: 'Audio'
    },
    compile: {
      titleAvailable: 'Compile theme YAML with Sass and download CSS',
      titleUnavailable: 'Run bundle exec rake editor:open to start the local server',
      downloadAlert: 'Run bundle exec rake editor:open to download CSS.',
      failed: 'Failed to generate CSS.\n\n{message}'
    },
    cssVars: {
      copied: 'CSS variable block copied to the clipboard.'
    },
    init: {
      failed: 'Failed to initialize Skin Maker.\n\nbundle exec rake editor:prepare\nbundle exec rake editor:open\n\n{error}'
    }
  },
  ja: {
    app: {
      title: 'Asciidoctor Skin Maker'
    },
    header: {
      subtitle: 'レイアウトを選び、色とフォントを調整して YAML を書き出します。',
      language: '言語',
      reset: 'リセット',
      exportYaml: 'YAML をダウンロード',
      exportCss: 'CSS をダウンロード',
      exportCssVars: 'CSS 変数をコピー'
    },
    banner: {
      fileProtocolTitle: 'file:// ではライブプレビューが使えません。',
      fileProtocolHtml: 'ターミナルで <code>bundle exec rake editor:open</code> を実行するか、<code>bundle exec rake editor:serve</code> 後に <a href="{serveUrl}">{serveUrl}</a> を開いてください。色の編集と YAML 書き出しはこのまま利用できます。',
      compileApiTitle: 'CSS ダウンロードはローカルサーバーでのみ利用できます。',
      compileApiHtml: 'GitHub Pages では YAML のダウンロードと CSS 変数のコピーが可能です。完成 CSS が必要な場合は <code>bundle exec rake editor:open</code> を実行してください。'
    },
    groups: {
      skin: 'スキン',
      fonts: 'フォント',
      body: '本文',
      headings: '見出し',
      sidebar: 'サイドバー / TOC',
      'header-footer': 'ヘッダー / フッター',
      links: 'リンク',
      'tables-code': '表 / コード',
      misc: 'その他'
    },
    skin: {
      name: 'スキン名',
      layout: 'レイアウト'
    },
    build: {
      summary: 'ビルド手順',
      afterSave: '# themes/{name}.yml を保存後:',
      generate: 'bundle exec ruby skin-maker/bin/skin-maker generate themes/{name}.yml',
      build: 'bundle exec rake skins:build[{name}]',
      orDownloadCss: '# またはエディタの「CSS をダウンロード」を使用',
      orDownloadCssHint: '# ローカルサーバー起動時は「CSS をダウンロード」も利用可能',
      asciidoc: '# AsciiDoc で利用:',
      stylesheet: ':stylesheet: {name}.css'
    },
    preview: {
      document: 'プレビュー文書',
      sourceInspect: 'ソース Inspect',
      file: 'ファイル:',
      openTab: '新しいタブで開く',
      frameTitle: 'スキンプレビュー',
      unavailable: 'ライブプレビューには HTTP サーバーが必要です。<br><code>bundle exec rake editor:open</code>',
      unavailableAlert: 'bundle exec rake editor:open を実行してからプレビューしてください。'
    },
    previewDoc: {
      en: 'English (index2.html)',
      ja: '日本語 (index2-ja.html)'
    },
    source: {
      element: '要素',
      openAdoc: '.adoc を開く',
      copy: 'コピー',
      copyDone: 'コピー済み',
      noSource: '(ソースなし)',
      line: '行 {line}'
    },
    layout: {
      material: {
        description: '見出し帯とサイドバー TOC 付きレイアウト。'
      },
      plain: {
        description: 'タイポグラフィ中心のミニマルレイアウト。'
      },
      bootswatch: {
        description: '水平ナビバー TOC とドキュメント余白。'
      },
      tufte: {
        description: 'セリフ体と広い余白の Tufte 風レイアウト。'
      }
    },
    fields: {
      colors: {
        main: '背景',
        primary: 'プライマリ',
        secondary: 'セカンダリ',
        tertiary: '第三色',
        sidebar: 'サイドバー背景',
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
    },
    kinds: {
      'document-title': 'ドキュメントヘッダー',
      section: 'セクション見出し',
      paragraph: '段落',
      literal: 'リテラル段落',
      listing: 'ソースコード',
      image: '画像',
      table: '表',
      quote: '引用',
      example: '例',
      sidebar: 'サイドバー',
      admonition: 'アドモニション',
      olist: '番号付きリスト',
      ulist: '箇条書き',
      dlist: '説明リスト',
      hdlist: '横並びリスト',
      colist: '番号付きコメント',
      verse: '詩',
      open: 'オープンブロック',
      pass: 'パススルー',
      stem: '数式',
      thematic_break: '区切り線',
      page_break: '改ページ',
      floating_title: '独立見出し',
      video: '動画',
      audio: '音声'
    },
    compile: {
      titleAvailable: 'テーマ YAML を Sass コンパイルして CSS をダウンロードします',
      titleUnavailable: 'bundle exec rake editor:open でローカルサーバーを起動してください',
      downloadAlert: 'CSS ダウンロードには bundle exec rake editor:open でローカルサーバーを起動してください。',
      failed: 'CSS の生成に失敗しました。\n\n{message}'
    },
    cssVars: {
      copied: 'CSS 変数ブロックをクリップボードにコピーしました。'
    },
    init: {
      failed: 'Skin Maker の初期化に失敗しました。\n\nbundle exec rake editor:prepare\nbundle exec rake editor:open\n\n{error}'
    }
  }
};

let currentLocale = resolveInitialLocale();

function resolveInitialLocale() {
  const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
  if (saved && SUPPORTED_LOCALES.includes(saved)) {
    return saved;
  }

  return 'en';
}

function getLocale() {
  return currentLocale;
}

function setLocale(locale) {
  if (!SUPPORTED_LOCALES.includes(locale)) return;
  currentLocale = locale;
  localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  document.documentElement.lang = locale;
}

function lookupMessage(locale, key) {
  return key.split('.').reduce((node, part) => node?.[part], MESSAGES[locale]);
}

function formatMessage(template, params = {}) {
  return template.replace(/\{(\w+)\}/g, (_, name) => String(params[name] ?? ''));
}

function t(key, params = {}) {
  const message = lookupMessage(currentLocale, key) ?? lookupMessage('en', key);
  if (message === undefined) return key;
  return formatMessage(message, params);
}
