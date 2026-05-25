# frozen_string_literal: true

require 'json'
require 'webrick'

module SkinMaker
  class CompileServlet < WEBrick::HTTPServlet::AbstractServlet
    def do_GET(_req, res)
      json_response(res, 200, 'status' => 'ok')
    end

    def do_POST(req, res)
      payload = JSON.parse(req.body)
      css = Compiler.new.compile_theme_data!(payload)
      name = payload.fetch('name').to_s.strip
      json_response(res, 200, 'name' => name, 'css' => css)
    rescue JSON::ParserError
      json_response(res, 400, 'error' => 'Invalid JSON body')
    rescue Error, ArgumentError => e
      json_response(res, 422, 'error' => e.message)
    rescue StandardError => e
      json_response(res, 500, 'error' => e.message)
    end

    private

    def json_response(res, status, body)
      res.status = status
      res['Content-Type'] = 'application/json; charset=utf-8'
      res.body = JSON.generate(body)
    end
  end
end
