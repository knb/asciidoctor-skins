# frozen_string_literal: true

module SkinMaker
  class Compiler
    def self.sanitize_skin_name!(name)
      value = name.to_s.strip
      raise Error, 'Skin name is required' if value.empty?
      raise Error, "Invalid skin name: #{value}" unless value.match?(Theme::SKIN_NAME_PATTERN)

      value
    end

    def compile_all!
      Dir.glob(File.join(SkinMaker::SKINS_DIR, '**', '*.scss')).sort.each do |path|
        next if path.include?('/editor/') || File.basename(path).start_with?('editor-')

        compile_file!(path)
      end
    end

    def compile!(skin_name)
      path = File.join(SkinMaker::SKINS_DIR, "#{skin_name}.scss")
      raise Error, "Skin source not found: #{path}" unless File.exist?(path)

      compile_file!(path)
    end

    def compile_theme_data!(data)
      scss_path = nil
      theme = Theme.from_data(data)
      scss = Generator.new.render_skin(theme)
      temp_name = "_editor_compile_#{Process.pid}"
      scss_path = File.join(SkinMaker::SKINS_DIR, "#{temp_name}.scss")

      File.write(scss_path, scss)
      Sass.compile(
        scss_path,
        load_paths: [SkinMaker::SCSS_DIR],
        style: :expanded
      ).css
    ensure
      File.delete(scss_path) if scss_path && File.exist?(scss_path)
    end

    private

    def compile_file!(path)
      name = File.basename(path, '.scss')
      output = File.join(SkinMaker::CSS_DIR, "#{name}.css")

      css = Sass.compile(
        path,
        load_paths: [SkinMaker::SCSS_DIR],
        style: :expanded
      ).css

      File.write(output, css)
      puts "  wrote css/#{name}.css"
      output
    end
  end
end
