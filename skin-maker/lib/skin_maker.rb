# frozen_string_literal: true

require 'yaml'
require 'fileutils'
require 'sass-embedded'

module SkinMaker
  ROOT = File.expand_path('../..', __dir__)
  SCSS_DIR = File.join(ROOT, 'scss')
  SKINS_DIR = File.join(SCSS_DIR, 'skins')
  THEMES_DIR = File.join(ROOT, 'themes')
  CSS_DIR = File.join(ROOT, 'css')

  LAYOUTS = %w[material plain bootswatch tufte].freeze
  EDITOR_DIR = File.join(ROOT, 'skin-maker', 'editor')
  EDITOR_CSS_DIR = File.join(CSS_DIR, 'editor')
  EDITOR_THEMES_DIR = File.join(THEMES_DIR, 'editor')

  class Error < StandardError; end

  def self.compile_all!
    Compiler.new.compile_all!
  end

  def self.compile!(skin_name)
    Compiler.new.compile!(skin_name)
  end

  def self.generate_from_theme!(theme_path)
    Generator.new.generate!(theme_path)
  end

  def self.scaffold!(name, layout: 'material')
    Generator.new.scaffold!(name, layout: layout)
  end
end

require_relative 'skin_maker/compiler'
require_relative 'skin_maker/generator'
require_relative 'skin_maker/theme'
require_relative 'skin_maker/editor'
