# frozen_string_literal: true

require 'bundler/setup'
require_relative 'skin-maker/lib/skin_maker'

namespace :editor do
  desc 'Build editor preview CSS, manifest.json, and manifest.js'
  task :build do
    SkinMaker::Editor.new.build!
  end

  desc 'Serve Skin Maker over HTTP (default port 8765)'
  task :serve do
    port = ENV.fetch('PORT', SkinMaker::Server::DEFAULT_PORT).to_i
    SkinMaker::Server.start!(port: port, open_browser: ENV['OPEN'] == '1')
  end

  desc 'Prepare assets, start HTTP server, and open the editor'
  task open: :prepare do
    port = ENV.fetch('PORT', SkinMaker::Server::DEFAULT_PORT).to_i
    SkinMaker::Server.start!(port: port, open_browser: true)
  end
end

namespace :preview do
  desc 'Render index2.html for the visual editor preview'
  task :index2 do
    SkinMaker::Preview.render!(
      File.join(SkinMaker::ROOT, 'index2.adoc'),
      html_path: File.join(SkinMaker::ROOT, 'index2.html'),
      stylesheet: 'css/editor/material.css'
    )
  end

  desc 'Render index2-ja.html for the visual editor preview'
  task :index2_ja do
    SkinMaker::Preview.render!(
      File.join(SkinMaker::ROOT, 'index2-ja.adoc'),
      html_path: File.join(SkinMaker::ROOT, 'index2-ja.html'),
      stylesheet: 'css/editor/material.css'
    )
  end

  desc 'Render all editor preview HTML pages'
  task :pages => %i[index2 index2_ja]
end

desc 'Build editor assets and preview HTML'
task 'editor:prepare' => ['editor:build', 'preview:pages']

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
