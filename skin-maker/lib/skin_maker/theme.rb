# frozen_string_literal: true

module SkinMaker
  class Theme
    SKIN_NAME_PATTERN = /\A[a-zA-Z][a-zA-Z0-9_-]*\z/.freeze

    attr_reader :data, :path

    def self.from_data(data)
      normalized = data.transform_keys(&:to_s)
      allocate.tap do |theme|
        theme.instance_variable_set(:@path, '(editor)')
        theme.instance_variable_set(:@data, normalized)
        theme.send(:validate!)
      end
    end

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
      raise Error, 'Missing name' unless data['name']
      raise Error, 'Missing layout' unless data['layout']
      raise Error, "Unknown layout #{layout}" unless LAYOUTS.include?(layout)
      raise Error, "Invalid skin name: #{data['name']}" unless data['name'].to_s.match?(SKIN_NAME_PATTERN)
    end
  end
end
