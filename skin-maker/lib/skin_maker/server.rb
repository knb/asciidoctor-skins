# frozen_string_literal: true

require 'webrick'

module SkinMaker
  class Server
    DEFAULT_PORT = 8765

    def self.start!(root: SkinMaker::ROOT, port: DEFAULT_PORT, open_browser: false)
      url = "http://127.0.0.1:#{port}/skin-maker/editor/index.html"

      server = WEBrick::HTTPServer.new(
        Port: port,
        BindAddress: '127.0.0.1',
        DocumentRoot: root,
        Logger: WEBrick::Log.new($stderr, WEBrick::BasicLog::FATAL),
        AccessLog: []
      )

      trap('INT') { server.shutdown }

      if open_browser
        Thread.new do
          sleep 0.3
          system('xdg-open', url) || system('open', url) || system('start', url)
        end
      end

      puts "Skin Maker: #{url}"
      puts 'Press Ctrl+C to stop.'
      server.start
    end
  end
end
