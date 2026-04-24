require_relative "lib/lexxy_photos/version"

Gem::Specification.new do |spec|
  spec.name        = "lexxy-photos"
  spec.version     = LexxyPhotos::VERSION
  spec.authors     = [ "Jérôme Sadou" ]
  spec.email       = [ "jerome@ohayostudio.com" ]
  spec.summary     = "Photo candidate panel for Lexxy rich-text editors"
  spec.description = "A Rails engine that adds a drag-drop photo management panel to Lexxy editors. " \
                     "Upload photos, drag them directly into the editor, or delete them. " \
                     "Pluggable import source protocol for Google Photos, Flickr, and others."
  spec.homepage    = "https://github.com/OhayoStudio/lexxy-photos"
  spec.license     = "MIT"

  spec.required_ruby_version = ">= 3.1"

  spec.files = Dir[
    "app/**/*",
    "config/**/*",
    "lib/**/*",
    "LICENSE",
    "README.md"
  ]

  spec.add_dependency "railties",       ">= 7.0", "< 9"
  spec.add_dependency "activestorage",  ">= 7.0", "< 9"
  spec.add_dependency "activesupport",  ">= 7.0", "< 9"
end
