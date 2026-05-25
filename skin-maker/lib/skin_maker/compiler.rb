# frozen_string_literal: true

module SkinMaker
  class Compiler
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
