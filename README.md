# lexxy-photos

Photo candidate panel for [Lexxy](https://github.com/OhayoStudio/lexxy) rich-text editors.

- Upload photos to a panel, then drag or click to insert them into the editor
- Drag files directly onto the panel to upload
- Delete individual photos
- Pluggable source protocol — add Google Photos, Flickr, or any external source as a separate gem

## Requirements

- Rails 7.0+ with Active Storage configured
- [Lexxy](https://github.com/OhayoStudio/lexxy) (peer dependency)
- Importmap Rails + Stimulus (standard in Rails 7+)

## Installation

```ruby
gem "lexxy-photos"
```

```bash
bundle install
```

## Setup

### 1. Add `has_many_attached` to your model

```ruby
class Article < ApplicationRecord
  has_many_attached :photo_candidates
end
```

If you use a different attachment name, configure it (see below).

### 2. Mount the engine

```ruby
# config/routes.rb
mount LexxyPhotos::Engine, at: "/lexxy_photos"
```

### 3. Configure

```ruby
# config/initializers/lexxy_photos.rb
LexxyPhotos.configure do |c|
  # Required: how to find the record that owns the photos
  c.record_finder = ->(id) { Article.friendly.find(id) }

  # Optional
  c.attachment_name = :photo_candidates  # default
  c.thumbnail_size  = [ 96, 96 ]         # default

  # Protect the upload/delete endpoints
  c.before_action :authenticate_admin!

  # Add external photo import sources (see Sources below)
  # c.sources = [ MyGooglePhotosSource.new ]
end
```

### 4. Pin the Stimulus controller

```ruby
# config/importmap.rb
pin "lexxy_photos_controller", to: "lexxy_photos_controller.js"
```

Register it:

```js
// app/javascript/controllers/index.js
import LexxyPhotosController from "lexxy_photos_controller"
application.register("lexxy-photos", LexxyPhotosController)
```

### 5. Add the panel to your form

```erb
<div data-controller="lexxy-photos"
     data-lexxy-photos-upload-url-value="<%= lexxy_photos.upload_photo_path(@article.id) %>"
     data-lexxy-photos-destroy-url-value="<%= lexxy_photos.destroy_photo_path(@article.id, '__ID__') %>">

  <%# File input for direct upload %>
  <input type="file" accept="image/*" multiple
         data-lexxy-photos-target="input"
         data-action="change->lexxy-photos#uploadFiles" />

  <%# Thumbnails render here %>
  <div data-lexxy-photos-target="previews" class="flex flex-wrap"></div>

  <%# Drag-drop zone on the whole panel (optional) %>
  <%# data-action="dragover->lexxy-photos#zoneDragover dragleave->lexxy-photos#zoneDragleave drop->lexxy-photos#zoneDrop" %>
</div>
```

#### Rendering existing photos on page load

When editing an existing record, render its current photo candidates as thumbnails on load by calling `addThumbnail` from your Stimulus controller or by rendering them server-side. Example with a `data-photos` attribute:

```erb
<%# Pass existing photos as JSON for the controller to render on connect %>
<div data-controller="lexxy-photos"
     data-lexxy-photos-upload-url-value="..."
     data-lexxy-photos-destroy-url-value="..."
     data-lexxy-photos-existing-photos-value="<%= @article.photo_candidates.map { |a|
       { id: a.id, url: url_for(a.blob.variant(resize_to_limit: [96,96])), original_url: rails_blob_path(a.blob, disposition: 'inline') }
     }.to_json %>">
```

Then in a subclass of the controller, call `addThumbnail` for each existing photo in `connect()`.

## Pluggable import sources

Implement `LexxyPhotos::Sources::Base` to add an external photo source:

```ruby
class MyFlickrSource < LexxyPhotos::Sources::Base
  def name = "Flickr"
  def icon_svg = "<svg>…</svg>"

  def fetch_albums(context)
    FlickrService.albums_for(context.current_user)
      .map { |a| { id: a.id, title: a.title, thumb: a.cover_url } }
  end

  def fetch_photos(album_id, context)
    FlickrService.photos_in(album_id)
      .map { |p| { url: p.url, thumb: p.thumb_url, filename: p.filename } }
  end
end

LexxyPhotos.configure { |c| c.sources << MyFlickrSource.new }
```

The UI for rendering source buttons and handling album/photo selection is left to the host app — the gem defines the protocol, not the UI chrome.

## License

MIT
