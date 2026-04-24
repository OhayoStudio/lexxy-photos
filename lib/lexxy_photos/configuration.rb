module LexxyPhotos
  class Configuration
    # Required: proc(record_id) → ActiveRecord record with has_many_attached photo candidates.
    # Example: ->(id) { Article.friendly.find(id) }
    attr_accessor :record_finder

    # Active Storage attachment name on the record (default: :photo_candidates).
    attr_accessor :attachment_name

    # Thumbnail resize dimensions [w, h] passed to Active Storage variant (default: [96, 96]).
    attr_accessor :thumbnail_size

    # Array of LexxyPhotos::Sources::Base instances for external photo imports.
    attr_accessor :sources

    def initialize
      @attachment_name = :photo_candidates
      @thumbnail_size  = [ 96, 96 ]
      @sources         = []
      @before_actions  = []
    end

    def before_action(method_name = nil, &block)
      @before_actions << (method_name || block)
    end

    def before_actions
      @before_actions.dup.freeze
    end
  end
end
