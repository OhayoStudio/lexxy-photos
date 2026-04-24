post   "records/:record_id/photos",     to: "photos#upload",  as: :upload_photo
delete "records/:record_id/photos/:id", to: "photos#destroy", as: :destroy_photo
