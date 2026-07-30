import React, { useEffect, useState, useRef } from 'react';
import { FruitImageService, FruitImageRecord } from '../../services/fruitImageService';
import { ImagePlus, Trash2, RefreshCw } from 'lucide-react';
import { ConfirmModal } from '../common/ConfirmModal';

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
const MAX_SIZE = 2 * 1024 * 1024;

export const AdminFruitImages: React.FC = () => {
  const [images, setImages] = useState<FruitImageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [fruitName, setFruitName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FruitImageRecord | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fetchImages = async () => {
    setLoading(true);
    try {
      const data = await FruitImageService.getAll();
      setImages(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(null);

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Only PNG, JPG, and WEBP files are accepted.');
      return;
    }

    if (file.size > MAX_SIZE) {
      setError('File must be under 2MB.');
      return;
    }

    setPendingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!fruitName.trim()) {
      setError('Enter an item name.');
      return;
    }
    if (!pendingFile) {
      setError('Select an image file.');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      await FruitImageService.upload(fruitName.trim(), pendingFile);
      setSuccess(`Image for "${fruitName.trim()}" uploaded successfully!`);
      setFruitName('');
      setPendingFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await fetchImages();
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      await FruitImageService.remove(deleteTarget.fruitName);
      setDeleteTarget(null);
      await fetchImages();
    } catch (err: any) {
      setError(err.message || 'Delete failed');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(null);

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Only PNG, JPG, and WEBP files are accepted.');
      return;
    }
    if (file.size > MAX_SIZE) {
      setError('File must be under 2MB.');
      return;
    }

    setPendingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Manage Items</h1>
      <p className="admin-page-desc">Define items with names and images. These appear on the user side when adding inventory.</p>

      {/* Upload Section */}
      <div className="admin-section">
        <div className="admin-upload-area">
          <div
            className="admin-dropzone"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
          >
            {previewUrl ? (
              <img src={previewUrl} alt="Preview" className="admin-upload-preview" />
            ) : (
              <>
                <ImagePlus size={36} className="admin-dropzone-icon" />
                <p className="admin-dropzone-text">Drop image here or click to browse</p>
                <p className="admin-dropzone-hint">PNG, JPG, WEBP — max 2MB</p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".png,.jpg,.jpeg,.webp"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </div>

          <div className="admin-upload-fields">
            <label className="admin-label">Item Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Apple, Banana, Dragon Fruit"
              maxLength={30}
              value={fruitName}
              onChange={e => { setFruitName(e.target.value); setError(null); setSuccess(null); }}
              onKeyDown={e => { if (e.key === 'Enter') handleUpload(); }}
            />

            {error && (
              <div className="admin-upload-msg error">{error}</div>
            )}
            {success && (
              <div className="admin-upload-msg success">{success}</div>
            )}

            <button
              className="btn btn-primary"
              onClick={handleUpload}
              disabled={uploading || !pendingFile || !fruitName.trim()}
              type="button"
            >
              {uploading ? 'Uploading...' : 'Upload Image'}
            </button>
          </div>
        </div>
      </div>

      {/* Existing Images Grid */}
      <div className="admin-section">
        <div className="admin-page-header-row">
          <h2 className="admin-section-title">Uploaded Images ({images.length})</h2>
          <button className="btn btn-secondary" onClick={fetchImages} type="button">
            <RefreshCw size={16} />
            <span>Refresh</span>
          </button>
        </div>

        {loading ? (
          <div className="admin-loading"><div className="spinner" /></div>
        ) : images.length === 0 ? (
          <p className="admin-empty-text">No images uploaded yet.</p>
        ) : (
          <div className="admin-images-grid">
            {images.map(img => (
              <div key={img.id || img.fruitName} className="admin-image-card">
                <img src={img.imageUrl} alt={img.fruitName} className="admin-image-thumb" />
                <div className="admin-image-info">
                  <span className="admin-image-name">{img.fruitName}</span>
                </div>
                <button
                  className="admin-icon-btn danger"
                  onClick={() => setDeleteTarget(img)}
                  type="button"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Image?"
        message={`Remove the image for "${deleteTarget?.fruitName}"? Users will see the emoji fallback.`}
        confirmText="Delete"
        danger
      />
    </div>
  );
};
