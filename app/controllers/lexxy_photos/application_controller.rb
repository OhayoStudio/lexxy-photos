module LexxyPhotos
  class ApplicationController < ActionController::Base
    protect_from_forgery with: :exception

    def self.inherited(subclass)
      super
      LexxyPhotos.config.before_actions.each { |a| subclass.before_action(a) }
    end
  end
end
