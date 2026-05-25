# frozen_string_literal: true

module SkinMaker
  class Theme
    attr_reader :data, :path

    def initialize(path)
      @path = path
      @data = YAML.load_file(path)
      validate!
    end

    def name
      data.fetch('name')
    end

    def layout
      data.fetch('layout')
    end

    def fonts
      data.fetch('fonts', {})
    end

    def colors
      data.fetch('colors', {})
    end

    def spacing
      data.fetch('spacing', {})
    end

    private

    def validate!
      raise Error, "Missing name in #{path}" unless data['name']
      raise Error, "Missing layout in #{path}" unless data['layout']
      raise Error, "Unknown layout #{layout} in #{path}" unless LAYOUTS.include?(layout)
    end
  end
end
