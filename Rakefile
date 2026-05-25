# frozen_string_literal: true

require 'bundler/setup'
require_relative 'skin-maker/lib/skin_maker'

namespace :editor do
  desc 'Build editor preview CSS and manifest.json'
  task :build do
    SkinMaker::Editor.new.build!
  end
end

namespace :preview do
  desc 'Render index2.html for the visual editor preview'
  task :index2 do
    sh 'bundle exec asciidoctor index2.adoc -o index2.html -a stylesheet=css/editor/material.css'
  end
end

desc 'Build editor assets and preview HTML'
task 'editor:prepare' => ['editor:build', 'preview:index2']

namespace :skins do
  desc 'Compile Sass skins (optional: rake skins:build[name] for one skin)'
  task :build, [:name] do |_t, args|
    if args[:name].to_s.empty?
      puts 'Compiling all skins...'
      SkinMaker.compile_all!
    else
      SkinMaker.compile!(args[:name])
    end
  end

  desc 'Compile a single skin (alias for skins:build[name])'
  task :build_one, [:name] do |_t, args|
    SkinMaker.compile!(args[:name])
  end

  desc 'Generate scss/skins/*.scss from themes/*.yml'
  task :generate do
    Dir.glob(File.join(SkinMaker::THEMES_DIR, '**', '*.yml')).sort.each do |path|
      basename = File.basename(path)
      next if basename.start_with?('_')

      SkinMaker.generate_from_theme!(path)
      puts "  generated #{path.sub(%r{\A.*/themes/}, '')}"
    end
  end

  desc 'Generate and compile all theme-driven skins'
  task rebuild: %i[generate build]
end

desc 'Render index2.adoc with the default skin for a quick preview'
task :preview do
  sh 'bundle exec asciidoctor index2.adoc -a stylesheet=css/material-blue.css'
end
