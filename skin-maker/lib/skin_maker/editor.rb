# frozen_string_literal: true

require 'json'

module SkinMaker
  class Editor
    LAYOUT_META = {
      'material' => {
        'label' => 'Material',
        'description' => 'Filled heading bands and sidebar table of contents.'
      },
      'plain' => {
        'label' => 'Plain',
        'description' => 'Minimal typography-focused layout.'
      },
      'bootswatch' => {
        'label' => 'Bootswatch',
        'description' => 'Horizontal navbar TOC with document margins.'
      },
      'tufte' => {
        'label' => 'Tufte',
        'description' => 'Serif typography with generous side margins.'
      }
    }.freeze

    def build!
      FileUtils.mkdir_p(SkinMaker::EDITOR_CSS_DIR)
      FileUtils.mkdir_p(SkinMaker::EDITOR_THEMES_DIR)

      layouts = {}

      LAYOUTS.each do |layout|
        theme_path = editor_theme_path(layout)
        create_default_editor_theme!(layout) unless File.exist?(theme_path)

        theme = Theme.new(theme_path)
        skin_name = "editor-#{layout}"
        skin_source = Generator.new.skin_path_for(skin_name)
        File.write(
          skin_source,
          Generator.new.render_skin(theme)
        )

        css_path = compile_editor_skin!(skin_name, layout)
        layouts[layout] = manifest_entry(theme, css_path)
      end

      write_manifest!(layouts)
      puts "Editor assets written to skin-maker/editor/manifest.json"
    end

    private

    def editor_theme_path(layout)
      File.join(SkinMaker::EDITOR_THEMES_DIR, "#{layout}.yml")
    end

    def create_default_editor_theme!(layout)
      data = YAML.load_file(File.join(SkinMaker::THEMES_DIR, '_template.yml'))
      data['name'] = "editor-#{layout}"
      data['layout'] = layout
      data['colors'] = default_colors(layout).merge(data['colors'] || {})
      data['fonts'] = default_fonts(layout).merge(data['fonts'] || {})
      data['spacing'] = default_spacing(layout).merge(data['spacing'] || {})
      File.write(editor_theme_path(layout), data.to_yaml)
    end

    def default_colors(layout)
      case layout
      when 'bootswatch'
        {
          'main' => '#ffffff',
          'primary' => '#317eac',
          'secondary' => '#999999',
          'tertiary' => '#dddddd',
          'sidebar' => '#2fa4e7',
          'link' => '#2fa4e7',
          'link_hover' => '#157ab5',
          'text' => '#555555',
          'border' => '#eeeeee',
          'code_bg' => '#f5f5f5',
          'table_stripe' => '#f9f9f9',
          'footer_text' => '#ffffff'
        }
      when 'tufte'
        {
          'main' => '#fffff8',
          'primary' => '#111111',
          'secondary' => '#555555',
          'tertiary' => '#dddddd',
          'sidebar' => '#eeeeee',
          'link' => '#111111',
          'link_hover' => '#555555',
          'text' => '#111111',
          'border' => '#cccccc',
          'code_bg' => '#f4f4ef',
          'table_stripe' => '#fafaf5'
        }
      when 'plain'
        {
          'main' => '#ffffff',
          'primary' => '#000000',
          'secondary' => '#aaaaaa',
          'tertiary' => '#cccccc',
          'sidebar' => '#cacaca',
          'link' => '#0d47a1',
          'link_alt' => '#b71c1c',
          'text' => '#000000'
        }
      else
        {
          'main' => '#ffffff',
          'primary' => '#2196f3',
          'secondary' => '#ba3925',
          'tertiary' => '#186d7a',
          'sidebar' => '#0d47a1',
          'link' => '#90caf9',
          'link_alt' => '#f44336',
          'text' => '#000000'
        }
      end
    end

    def default_fonts(layout)
      case layout
      when 'tufte'
        {
          'google' => 'none',
          'body' => 'et-book, Palatino, Georgia, serif',
          'heading' => 'et-book, Palatino, Georgia, serif',
          'mono' => 'Consolas, monospace'
        }
      when 'bootswatch'
        {
          'google' => 'none',
          'body' => 'Helvetica Neue, Helvetica, Arial, sans-serif',
          'heading' => 'Helvetica Neue, Helvetica, Arial, sans-serif',
          'mono' => 'monospace'
        }
      else
        {
          'google' => 'Noto+Sans',
          'body' => 'Noto Sans, sans-serif',
          'heading' => 'Noto Sans, sans-serif',
          'mono' => 'monospace'
        }
      end
    end

    def default_spacing(layout)
      case layout
      when 'bootswatch'
        {
          'body_margin_x' => '10%',
          'body_font_size' => '14px',
          'line_height' => '1.42857143'
        }
      when 'tufte'
        {
          'body_font_size' => '15px',
          'line_height' => '2',
          'content_max_width' => '1400px',
          'toc_title_size' => '1.1rem'
        }
      else
        {}
      end
    end

    def compile_editor_skin!(skin_name, layout)
      source = File.join(SkinMaker::SKINS_DIR, "#{skin_name}.scss")
      output = File.join(SkinMaker::EDITOR_CSS_DIR, "#{layout}.css")

      css = Sass.compile(
        source,
        load_paths: [SkinMaker::SCSS_DIR],
        style: :expanded
      ).css

      File.write(output, css)
      output
    end

    def manifest_entry(theme, css_path)
      meta = LAYOUT_META.fetch(theme.layout)
      layout_name = File.basename(css_path, '.css')

      {
        'id' => theme.layout,
        'label' => meta['label'],
        'description' => meta['description'],
        'previewCss' => "/css/editor/#{layout_name}.css",
        'defaults' => {
          'name' => theme.name.sub(/\Aeditor-/, ''),
          'layout' => theme.layout,
          'fonts' => theme.fonts,
          'colors' => theme.colors,
          'spacing' => theme.spacing
        }
      }
    end

    def write_manifest!(layouts)
      manifest = {
        'version' => 1,
        'previewPage' => '/index2.html',
        'previewPages' => preview_pages,
        'defaultPreviewPage' => 'en',
        'editorPage' => '/skin-maker/editor/index.html',
        'pagesBasePath' => pages_base_path,
        'tokenMap' => token_map,
        'layouts' => layouts
      }

      editor_dir = SkinMaker::EDITOR_DIR
      json = JSON.pretty_generate(manifest)

      File.write(File.join(editor_dir, 'manifest.json'), json)
      File.write(
        File.join(editor_dir, 'manifest.js'),
        "// Generated by skin-maker — do not edit.\nwindow.__SKIN_MAKER_MANIFEST__ = #{json};\n"
      )
    end

    def preview_pages
      [
        preview_page('en', 'English (index2.html)', '/index2.html', 'index2.adoc'),
        preview_page('ja', '日本語 (index2-ja.html)', '/index2-ja.html', 'index2-ja.adoc')
      ]
    end

    def pages_base_path
      path = ENV.fetch('PAGES_BASE_PATH', '')
      path = "/#{path}" unless path.empty? || path.start_with?('/')
      path.delete_suffix('/')
    end

    def preview_page(id, label, html_path, adoc_file)
      basename = File.basename(adoc_file, '.adoc')
      {
        'id' => id,
        'label' => label,
        'path' => html_path,
        'sourceFile' => "/#{adoc_file}",
        'sourceMap' => "/skin-maker/editor/source-maps/#{basename}.json"
      }
    end

    def token_map
      {
        'colors' => {
          'main' => '--color-main',
          'primary' => '--color-primary',
          'secondary' => '--color-secondary',
          'tertiary' => '--color-tertiary',
          'sidebar' => '--color-sidebar',
          'link' => '--color-link',
          'link_alt' => '--color-link-alt',
          'link_hover' => '--color-link-hover',
          'text' => '--color-text',
          'border' => '--color-border',
          'code_bg' => '--color-code-bg',
          'table_stripe' => '--color-table-stripe',
          'footer_text' => '--color-footer-text',
          'white' => '--color-white',
          'black' => '--color-black'
        },
        'fonts' => {
          'body' => '--font-body',
          'heading' => '--font-heading',
          'mono' => '--font-mono'
        },
        'spacing' => {
          'header_padding' => '--header-padding',
          'heading_padding' => '--heading-padding',
          'sect_border_radius' => '--sect-border-radius',
          'toc_title_size' => '--toc-title-size',
          'body_margin_x' => '--body-margin-x',
          'body_font_size' => '--body-font-size',
          'line_height' => '--line-height',
          'content_max_width' => '--content-max-width'
        }
      }
    end
  end
end
