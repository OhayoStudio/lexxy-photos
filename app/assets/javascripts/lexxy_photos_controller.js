import { Controller } from "@hotwired/stimulus"

const DRAG_TYPE = "application/x-photo-candidate"

export default class extends Controller {
  static targets = [ "input", "previews" ]
  // uploadUrl  — POST endpoint for new photos
  // destroyUrl — DELETE endpoint template; "__ID__" is replaced with the attachment id
  static values  = { uploadUrl: String, destroyUrl: String }

  connect() {
    this._editorEl = this.element.closest("form")?.querySelector("lexxy-editor")
    if (this._editorEl) {
      this._editorEl.addEventListener("dragover", this._onEditorDragOver)
      this._editorEl.addEventListener("drop",     this._onEditorDrop)
    }
  }

  disconnect() {
    if (this._editorEl) {
      this._editorEl.removeEventListener("dragover", this._onEditorDragOver)
      this._editorEl.removeEventListener("drop",     this._onEditorDrop)
    }
  }

  // ── Upload ─────────────────────────────────────────────────────────────────

  uploadFiles(event) {
    const files = event.target.files
    if (!files.length) return
    if (!this._requireUploadUrl()) { event.target.value = ""; return }
    Array.from(files).forEach(file => this._uploadFile(file))
    event.target.value = ""
  }

  _uploadFile(file) {
    if (!this._requireUploadUrl()) return
    const formData = new FormData()
    formData.append("photo_candidate", file)
    fetch(this.uploadUrlValue, {
      method:  "POST",
      headers: { "X-CSRF-Token": document.querySelector("meta[name=csrf-token]").content },
      body:    formData
    })
      .then(r => r.json())
      .then(data => {
        if (data.url) {
          this.addThumbnail(data.url, data.original_url, data.id)
        } else if (data.error) {
          this._showError(data.error)
        }
      })
      .catch(err => this._showError(err.message))
  }

  _requireUploadUrl() {
    if (this.uploadUrlValue) return true
    this._showError("Upload URL not configured (data-lexxy-photos-upload-url-value missing).")
    return false
  }

  // ── Thumbnail ──────────────────────────────────────────────────────────────

  addThumbnail(thumbUrl, originalUrl, attachmentId) {
    const wrapper = document.createElement("div")
    wrapper.className = "relative m-1 group"
    if (attachmentId) wrapper.dataset.attachmentId = attachmentId

    const img = document.createElement("img")
    img.src       = thumbUrl
    img.className = "object-cover w-24 h-24 rounded border bg-white cursor-pointer hover:ring-2 hover:ring-[#704214]"
    img.title     = "Click to insert at cursor · Drag to position"
    if (originalUrl) {
      img.dataset.originalUrl = originalUrl
      img.draggable = true
      img.addEventListener("dragstart", this._onImgDragStart)
      img.addEventListener("click", e => this._onThumbnailClick(e))
    }
    wrapper.appendChild(img)

    if (attachmentId && this.destroyUrlValue) {
      const btn = document.createElement("button")
      btn.type      = "button"
      btn.title     = "Delete photo"
      btn.className = "absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
      btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`
      btn.addEventListener("click", e => this._deletePhoto(e))
      wrapper.appendChild(btn)
    }

    this.previewsTarget.appendChild(wrapper)
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  async _deletePhoto(event) {
    const wrapper      = event.currentTarget.closest("[data-attachment-id]")
    if (!wrapper) return
    const attachmentId = wrapper.dataset.attachmentId
    const url          = this.destroyUrlValue.replace("__ID__", attachmentId)

    const resp = await fetch(url, {
      method:  "DELETE",
      headers: { "X-CSRF-Token": document.querySelector("meta[name=csrf-token]").content }
    })
    if (resp.ok) wrapper.remove()
  }

  // ── Zone drag-drop (onto the panel itself) ─────────────────────────────────

  zoneDragover(event) {
    if (!event.dataTransfer.types.includes("Files")) return
    event.preventDefault()
    event.dataTransfer.dropEffect = "copy"
    this.element.classList.add("ring-2", "ring-[#704214]")
  }

  zoneDragleave() {
    this.element.classList.remove("ring-2", "ring-[#704214]")
  }

  zoneDrop(event) {
    if (!event.dataTransfer.types.includes("Files")) return
    event.preventDefault()
    this.element.classList.remove("ring-2", "ring-[#704214]")
    if (!this._requireUploadUrl()) return
    Array.from(event.dataTransfer.files).forEach(file => this._uploadFile(file))
  }

  // ── Click to insert at cursor ──────────────────────────────────────────────

  async _onThumbnailClick(event) {
    const originalUrl = event.target.closest("img")?.dataset.originalUrl
    if (!originalUrl || !this._editorEl) return

    const ce = this._editorEl.querySelector("[contenteditable]")
    if (ce) ce.focus()

    try {
      const resp     = await fetch(originalUrl)
      const blob     = await resp.blob()
      const filename = originalUrl.split("/").pop().split("?")[0] || "image.jpg"
      const file     = new File([ blob ], filename, { type: blob.type || "image/jpeg" })
      requestAnimationFrame(() => {
        this._editorEl.contents.uploadFiles([ file ], { selectLast: true })
      })
    } catch (err) {
      console.error("[lexxy-photos] click insert failed:", err)
    }
  }

  // ── Drag from panel → editor ───────────────────────────────────────────────

  _onImgDragStart = (event) => {
    const originalUrl = event.target.dataset.originalUrl
    if (!originalUrl) return
    event.dataTransfer.setData(DRAG_TYPE, originalUrl)
    event.dataTransfer.effectAllowed = "copy"
  }

  _onEditorDragOver = (event) => {
    if (!event.dataTransfer.types.includes(DRAG_TYPE)) return
    event.preventDefault()
    event.dataTransfer.dropEffect = "copy"
  }

  _onEditorDrop = async (event) => {
    const originalUrl = event.dataTransfer.getData(DRAG_TYPE)
    if (!originalUrl) return

    try {
      const resp     = await fetch(originalUrl)
      const blob     = await resp.blob()
      const filename = originalUrl.split("/").pop().split("?")[0] || "image.jpg"
      const file     = new File([ blob ], filename, { type: blob.type || "image/jpeg" })
      this._editorEl.contents.uploadFiles([ file ], { selectLast: true })
    } catch (err) {
      console.error("[lexxy-photos] drag insert failed:", err)
    }
  }

  // ── Error display ──────────────────────────────────────────────────────────

  _showError(msg) {
    const existing = this.element.querySelector(".lexxy-photos-error")
    if (existing) { existing.textContent = msg; return }
    const el = document.createElement("p")
    el.className   = "lexxy-photos-error text-xs text-red-500 dark:text-red-400 mt-1"
    el.textContent = msg
    this.inputTarget.insertAdjacentElement("afterend", el)
    setTimeout(() => el.remove(), 4000)
  }
}
