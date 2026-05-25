# frozen_string_literal: true

require 'asciidoctor'
require 'json'

module SkinMaker
  class Preview
    def self.render!(adoc_path, html_path:, stylesheet:)
      new(adoc_path, html_path: html_path, stylesheet: stylesheet).render!
    end

    def initialize(adoc_path, html_path:, stylesheet:)
      @adoc_path = File.expand_path(adoc_path)
      @html_path = File.expand_path(html_path)
      @stylesheet = stylesheet
      @file_lines = File.readlines(@adoc_path, chomp: true)
      @entries = []
      @dom_id_index = {}
    end

    def render!
      preview = self
      registry = Asciidoctor::Extensions.create
      registry.treeprocessor do
        process do |document|
          preview.annotate!(document)
          nil
        end
      end

      html = Asciidoctor.convert(
        File.read(@adoc_path),
        safe: :safe,
        standalone: true,
        sourcemap: true,
        attributes: {
          'stylesheet' => @stylesheet,
          'linkcss' => '',
          'copycss' => '',
          'icons' => 'font',
          'stem' => 'latexmath',
          'experimental' => '',
          'source-highlighter' => 'rouge'
        },
        extension_registry: registry
      )

      html = html.sub(
        '<div id="header">',
        %(<div id="header" data-sm-id="#{@entries.first['id']}">)
      )

      map = build_map
      File.write(@html_path, html)
      write_map!(map)
      map
    end

    def annotate!(document)
      record_document_title!(document)

      preamble = document.blocks.find { |block| block.context == :preamble }
      preamble&.blocks&.each { |block| record_block!(block, section_id: '_preamble') }

      document.sections.each { |section| annotate_section!(section) }
    end

    private

    def build_map
      RawSource.apply!(@file_lines, @entries)
      {
        'sourceFile' => "/#{File.basename(@adoc_path)}",
        'entries' => @entries,
        'entryIndex' => @entries.to_h { |entry| [entry['id'], entry] },
        'sectionIndex' => @entries
          .select { |entry| entry['kind'] == 'section' }
          .to_h { |entry| [entry['sectionId'], entry] },
        'domIdIndex' => @dom_id_index
      }
    end

    def write_map!(map)
      FileUtils.mkdir_p(SourceMap::SOURCE_MAPS_DIR)
      path = File.join(SourceMap::SOURCE_MAPS_DIR, "#{File.basename(@adoc_path, '.adoc')}.json")
      File.write(path, JSON.pretty_generate(map))
    end

    def annotate_section!(section)
      record_section!(section)

      section.blocks.each do |block|
        next if block.context == :section

        record_block!(block, section_id: section.id)
      end

      section.sections.each { |child| annotate_section!(child) }
    end

    def record_document_title!(document)
      @entries << {
        'id' => entry_id,
        'kind' => 'document-title',
        'title' => document.doctitle,
        'lineno' => document.source_location&.lineno || 1
      }
    end

    def record_section!(section)
      @entries << {
        'id' => entry_id,
        'kind' => 'section',
        'sectionId' => section.id,
        'title' => section.title,
        'level' => section.level,
        'lineno' => section.source_location&.lineno
      }
    end

    def record_block!(block, section_id:)
      entry = {
        'id' => entry_id,
        'kind' => block.context.to_s,
        'sectionId' => section_id,
        'lineno' => block.source_location&.lineno
      }
      entry['style'] = block.style if block.respond_to?(:style) && block.style
      @dom_id_index[block.id] = entry['id'] if block.id && !block.id.empty?
      assign_block_id!(block, entry['id'])
      @entries << entry
    end

    def entry_id
      "sm-#{@entries.size}"
    end

    def assign_block_id!(node, entry_id)
      if node.id.nil? || node.id.empty?
        node.id = entry_id
      else
        node.set_attr('sm-ref', entry_id)
      end
    end
  end
end
