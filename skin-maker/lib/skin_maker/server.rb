# frozen_string_literal: true

require 'webrick'

module SkinMaker
  class Server
    DEFAULT_PORT = 8765
    COMPILE_API_PATH = '/skin-maker/api/compile'

    def self.start!(root: SkinMaker::ROOT, port: DEFAULT_PORT, open_browser: false)
      url = "http://127.0.0.1:#{port}/skin-maker/editor/index.html"

      server = WEBrick::HTTPServer.new(
        Port: port,
        BindAddress: '127.0.0.1',
        DocumentRoot: root,
        Logger: WEBrick::Log.new($stderr, WEBrick::BasicLog::FATAL),
        AccessLog: []
      )

      server.mount(COMPILE_API_PATH, CompileServlet)

      trap('INT') { server.shutdown }

      if open_browser
        Thread.new do
          sleep 0.3
          system('xdg-open', url) || system('open', url) || system('start', url)
        end
      end

      puts "Skin Maker: #{url}"
      puts "CSS compile API: http://127.0.0.1:#{port}#{COMPILE_API_PATH}"
      puts 'Press Ctrl+C to stop.'
      server.start
    end
  end
end
