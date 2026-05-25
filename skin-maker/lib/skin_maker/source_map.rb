# frozen_string_literal: true

require 'json'
require 'asciidoctor'

module SkinMaker
  class SourceMap
    SOURCE_MAPS_DIR = File.join(SkinMaker::EDITOR_DIR, 'source-maps').freeze

    def self.build(adoc_path)
      new(adoc_path).build
    end

    def self.write!(adoc_path)
      map = build(adoc_path)
      FileUtils.mkdir_p(SOURCE_MAPS_DIR)
      basename = File.basename(adoc_path, '.adoc')
      path = File.join(SOURCE_MAPS_DIR, "#{basename}.json")
      File.write(path, JSON.pretty_generate(map))
      path
    end

    def initialize(adoc_path)
      @adoc_path = File.expand_path(adoc_path)
      @file_lines = File.readlines(@adoc_path, chomp: true)
    end

    def build
      doc = Asciidoctor.load_file(@adoc_path)
      entries = []
      dom_id_index = {}

      entries << document_title_entry(doc, entries.size)
      preamble = doc.blocks.find { |block| block.context == :preamble }
      preamble&.blocks&.each do |block|
        entries << block_entry(block, section_id: '_preamble', index: entries.size, dom_id_index: dom_id_index)
      end

      doc.sections.each { |section| walk_section(section, entries, dom_id_index) }
      attach_line_numbers!(entries)

      {
        'sourceFile' => "/#{File.basename(@adoc_path)}",
        'entries' => entries,
        'entryIndex' => entries.to_h { |entry| [entry['id'], entry] },
        'sectionIndex' => entries
          .select { |entry| entry['kind'] == 'section' }
          .to_h { |entry| [entry['sectionId'], entry] },
        'domIdIndex' => dom_id_index
      }
    end

    private

    def walk_section(section, entries, dom_id_index)
      entries << section_entry(section, entries.size)
      section.blocks.each do |block|
        next if block.context == :section

        entries << block_entry(block, section_id: section.id, index: entries.size, dom_id_index: dom_id_index)
      end
      section.sections.each { |child| walk_section(child, entries, dom_id_index) }
    end

    def document_title_entry(doc, index)
      {
        'id' => entry_id(index),
        'kind' => 'document-title',
        'title' => doc.doctitle,
        'source' => header_source
      }
    end

    def section_entry(section, index)
      {
        'id' => entry_id(index),
        'kind' => 'section',
        'sectionId' => section.id,
        'title' => section.title,
        'level' => section.level,
        'source' => section_header_source(section)
      }
    end

    def block_entry(block, section_id:, index:, dom_id_index:)
      entry = {
        'id' => entry_id(index),
        'kind' => block.context.to_s,
        'sectionId' => section_id,
        'source' => block_source(block)
      }
      entry['style'] = block.style if block.respond_to?(:style) && block.style
      dom_id_index[block.id] = entry['id'] if block.id && !block.id.empty?
      entry
    end

    def entry_id(index)
      "sm-#{index}"
    end

    def header_source
      lines = []
      @file_lines.each do |line|
        break if line.strip.empty? && lines.any?

        lines << line
      end
      lines.join("\n")
    end

    def section_header_source(section)
      lines = []
      anchor = section.id
      if anchor && !anchor.start_with?('_')
        file_line = @file_lines.find { |line| line.strip == "[##{anchor}]" }
        lines << "[##{anchor}]" if file_line
      end
      lines << "#{'=' * (section.level + 1)} #{section.title}"
      lines.join("\n")
    end

    def block_source(block)
      return block.source if block.respond_to?(:source) && block.source && !block.source.empty?

      case block.context
      when :image
        target = block.attr('target')
        alt = block.attr('alt')
        role = block.attr('role')
        width = block.attr('width')
        attrs = [alt, role, width].compact
        opts = attrs.empty? ? '' : "[#{attrs.join(', ')}]"
        block.style == 'block' ? "image::#{target}#{opts}" : "image:#{target}#{opts}"
      when :thematic_break
        block.style == 'page' ? '<<<' : "'#{block.style == 'pass' ? '' : ''}'".sub("''", "'''")
      when :page_break
        '<<<'
      when :floating_title
        block.title ? "[.float-group-title]\n#{block.title}" : block.title
      when :video
        target = block.attr('target')
        attrs = []
        attrs << "poster=#{block.attr('poster')}" if block.attr('poster')
        opts = attrs.empty? ? '' : "[#{attrs.join(', ')}]"
        "video::#{target}#{opts}"
      when :audio
        "audio::#{block.attr('target')}[]"
      else
        block.title || block.caption
      end
    end

    def attach_line_numbers!(entries)
      used_lines = {}

      entries.each do |entry|
        source = entry['source']
        next if source.nil? || source.empty?

        needle = source.lines.first&.strip
        next if needle.nil? || needle.empty?

        line = find_line(needle, used_lines)
        entry['line'] = line if line
      end
    end

    def find_line(needle, used_lines)
      @file_lines.each_with_index do |line, index|
        lineno = index + 1
        next if used_lines[lineno]
        next unless line.include?(needle) || line.strip == needle

        used_lines[lineno] = true
        return lineno
      end

      nil
    end
  end
end
