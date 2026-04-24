module LexxyPhotos
  module Sources
    # Implement this protocol to add a photo import source (e.g. Google Photos, Flickr).
    # Register instances via LexxyPhotos.configure { |c| c.sources << MySource.new }.
    class Base
      # Human-readable name shown in the panel button label.
      def name
        raise NotImplementedError
      end

      # SVG string rendered as the panel button icon.
      def icon_svg
        raise NotImplementedError
      end

      # Returns an array of album hashes: [{ id:, title:, thumb: }]
      # `context` is the controller instance (access to current_user, params, etc.)
      def fetch_albums(context)
        raise NotImplementedError
      end

      # Returns an array of photo hashes: [{ url:, thumb:, filename: }]
      def fetch_photos(album_id, context)
        raise NotImplementedError
      end
    end
  end
end
