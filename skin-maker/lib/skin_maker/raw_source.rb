# frozen_string_literal: true

module SkinMaker
  class RawSource
    BLOCK_ATTR = /^\[[^\]]+\]$/
    BLOCK_TITLE = /^\.(?!\.)[^\s].*/
    SECTION_ANCHOR = /^\[#/
    LIST_ITEM = /^(\*{1,5}|\d+\.|[a-zA-Z]\.|[\-\*\+>]|>|\(\)|\[[ x\*]\])\s/
    DELIMITER_OPEN = /^(-{4,}|={4,}|\*{4,}|_{4,}|\.{4,}|\+{4,}|`{3,}[a-zA-Z0-9_-]*)$/
    TABLE_DELIM = /^\|={3,}$/

    def self.apply!(file_lines, entries)
      new(file_lines, entries).apply!
    end

    def initialize(file_lines, entries)
      @file_lines = file_lines
      @entries = entries
    end

    def apply!
      starts = @entries.map { |entry| start_line_for(entry) }

      @entries.each_with_index do |entry, index|
        start_line = starts[index]
        unless start_line
          entry['source'] = fallback_source(entry)
          next
        end

        stop_line = if index + 1 < starts.size && starts[index + 1]
                      starts[index + 1] - 1
                    else
                      stop_line_for(entry, start_line)
                    end

        stop_line = trim_trailing_blank(stop_line, start_line)
        entry['source'] = slice_lines(start_line, stop_line)
        entry['line'] = start_line
      end
    end

    private

    def start_line_for(entry)
      lineno = entry['lineno']
      return lineno if entry['kind'] == 'document-title' && lineno

      return scan_backward(lineno, entry['kind']) if lineno

      nil
    end

    def scan_backward(lineno, kind)
      start = lineno
      while start > 1
        previous = @file_lines[start - 2]
        break if previous.nil?
        break if previous.strip.empty?
        break unless prefix_line?(previous, kind)

        start -= 1
      end
      start
    end

    def prefix_line?(line, kind)
      return true if line.match?(BLOCK_ATTR)
      return true if line.match?(BLOCK_TITLE)
      return true if line.match?(SECTION_ANCHOR)
      return true if kind == 'listing' && line.match?(/^\[source[,\]]/)

      false
    end

    def stop_line_for(entry, start_line)
      case entry['kind']
      when 'listing', 'example', 'quote', 'sidebar', 'admonition', 'open', 'pass'
        find_delimited_end(start_line)
      when 'table'
        find_table_end(start_line)
      when 'ulist', 'olist', 'dlist', 'colist', 'hdlist'
        find_list_end(start_line)
      when 'literal'
        find_literal_end(start_line)
      when 'thematic_break', 'page_break'
        start_line
      else
        find_paragraph_end(start_line)
      end
    end

    def find_delimited_end(start_line)
      delimiter = nil
      (start_line - 1...@file_lines.size).each do |index|
        line = @file_lines[index]
        if delimiter.nil?
          delimiter = delimiter_for(line)
          next unless delimiter
        elsif closing_delimiter?(line, delimiter)
          return index + 1
        end
      end
      @file_lines.size
    end

    def delimiter_for(line)
      return line if line.match?(DELIMITER_OPEN)
      return '```' if line.match?(/^`{3,}[a-zA-Z0-9_-]*$/)

      nil
    end

    def closing_delimiter?(line, delimiter)
      return line.match?(/^`{3,}\s*$/) if delimiter.start_with?('```')

      line == delimiter
    end

    def find_table_end(start_line)
      (start_line - 1...@file_lines.size).each do |index|
        return index + 1 if @file_lines[index].match?(TABLE_DELIM)
      end
      @file_lines.size
    end

    def find_list_end(start_line)
      index = start_line - 1
      while index < @file_lines.size
        line = @file_lines[index]
        break if index > start_line - 1 && line.strip.empty?

        if line.match?(LIST_ITEM) || line.match?(BLOCK_TITLE) || line.match?(BLOCK_ATTR) || line.match?(/^\s+\S/)
          index += 1
          next
        end
        break
      end
      index
    end

    def find_literal_end(start_line)
      index = start_line - 1
      while index < @file_lines.size
        line = @file_lines[index]
        break if index > start_line - 1 && line.strip.empty? && !line.start_with?(' ')

        if line.start_with?(' ') || (index == start_line - 1)
          index += 1
          next
        end
        break
      end
      index
    end

    def find_paragraph_end(start_line)
      index = start_line - 1
      while index < @file_lines.size
        line = @file_lines[index]
        if index > start_line - 1 && line.strip.empty?
          break
        end
        if index > start_line - 1 && block_start?(line)
          break
        end

        index += 1
      end
      index
    end

    def block_start?(line)
      return true if line.match?(BLOCK_ATTR)
      return true if line.match?(BLOCK_TITLE)
      return true if line.match?(SECTION_ANCHOR)
      return true if line.match?(LIST_ITEM)
      return true if line.match?(DELIMITER_OPEN)
      return true if line.match?(/^={1,6}\s+\S/)
      return true if line.match?(/^(image|audio|video|include)::/)
      return true if line.match?(/^(NOTE|TIP|IMPORTANT|WARNING|CAUTION):/)

      false
    end

    def trim_trailing_blank(stop_line, start_line)
      while stop_line >= start_line && @file_lines[stop_line - 1].strip.empty?
        stop_line -= 1
      end
      [stop_line, start_line].max
    end

    def slice_lines(start_line, stop_line)
      @file_lines[(start_line - 1)...stop_line].join("\n")
    end

    def fallback_source(entry)
      entry['source'].to_s
    end
  end
end
