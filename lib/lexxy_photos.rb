require "lexxy_photos/version"
require "lexxy_photos/configuration"
require "lexxy_photos/sources/base"
require "lexxy_photos/engine"

module LexxyPhotos
  class << self
    def config
      @config ||= Configuration.new
    end

    def configure
      yield config
    end

    def reset!
      @config = nil
    end
  end
end
