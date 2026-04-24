module LexxyPhotos
  class Engine < ::Rails::Engine
    isolate_namespace LexxyPhotos

    initializer "lexxy_photos.importmap", before: "importmap" do |app|
      if app.config.respond_to?(:importmap)
        app.config.importmap.paths << root.join("config/importmap.rb")
        app.config.importmap.cache_sweepers << root.join("app/assets/javascripts")
      end
    end

    config.to_prepare do
      LexxyPhotos.config.before_actions.each do |action|
        LexxyPhotos::ApplicationController.before_action(action)
      end
    end
  end
end
