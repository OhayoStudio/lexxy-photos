module LexxyPhotos
  class PhotosController < ApplicationController
    before_action :set_record
    before_action :require_record_finder, only: %i[upload destroy]

    # POST /lexxy_photos/records/:record_id/photos
    def upload
      return render json: { error: "No file uploaded" }, status: :unprocessable_entity unless params[:photo_candidate].present?

      cfg    = LexxyPhotos.config
      upload = params[:photo_candidate]

      blob = ActiveStorage::Blob.create_and_upload!(
        io:           upload.tempfile,
        filename:     upload.original_filename,
        content_type: upload.content_type
      )
      attachment = ActiveStorage::Attachment.create!(
        name:   cfg.attachment_name.to_s,
        record: @record,
        blob:   blob
      )

      render json: {
        id:           attachment.id,
        url:          url_for(blob.variant(resize_to_limit: cfg.thumbnail_size)),
        original_url: rails_blob_path(blob, disposition: "inline")
      }, status: :ok
    rescue => e
      Rails.logger.error "[LexxyPhotos] upload failed for record ##{@record&.id}: #{e.message}"
      render json: { error: "Upload failed: #{e.message}" }, status: :unprocessable_entity
    end

    # DELETE /lexxy_photos/records/:record_id/photos/:id
    def destroy
      cfg        = LexxyPhotos.config
      attachment = @record.public_send(cfg.attachment_name).find(params[:id])
      attachment.purge
      head :no_content
    rescue ActiveRecord::RecordNotFound
      head :not_found
    end

    private

    def set_record
      finder = LexxyPhotos.config.record_finder
      return unless finder
      @record = finder.call(params[:record_id])
    end

    def require_record_finder
      return if LexxyPhotos.config.record_finder
      render json: { error: "LexxyPhotos.config.record_finder is not configured" }, status: :internal_server_error
    end
  end
end
