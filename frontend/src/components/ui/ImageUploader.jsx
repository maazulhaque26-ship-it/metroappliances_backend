import React, { useRef, useState, useCallback } from 'react';
import { FiUpload, FiX, FiImage } from 'react-icons/fi';
import { imgSrc } from '../../utils/imageHelper';

/**
 * Unified image uploader used across Achievements, Gallery, Blogs, Banners, etc.
 *
 * value  — array of items, each either:
 *            • string  (existing URL stored in DB, e.g. "/uploads/img-123.jpg")
 *            • { file: File, src: string }  (newly selected, not yet saved)
 *
 * onChange(newValue) — called whenever the list changes
 * maxCount           — max number of images (default 1)
 * minCount           — min required (used only for UI hint, default 0)
 * label              — button label when empty (default "Upload Image")
 */
export default function ImageUploader({
  value    = [],
  onChange,
  maxCount = 1,
  minCount = 0,
  label    = 'Upload Image',
  className = '',
}) {
  const inputRef = useRef(null);
  const [dropOver, setDropOver]   = useState(false);
  const [dragIdx,  setDragIdx]    = useState(null);

  // Normalise: string → {src: string}
  const items = value.map(v => (typeof v === 'string' ? { src: v } : v));
  const canAdd = items.length < maxCount;

  const resolvedSrc = (item) =>
    item.file ? item.src : imgSrc(item.src);

  const addFiles = useCallback((files) => {
    const allowed = maxCount - items.length;
    const added = Array.from(files)
      .slice(0, allowed)
      .map(file => ({ file, src: URL.createObjectURL(file) }));
    if (added.length) onChange([...items, ...added]);
  }, [items, maxCount, onChange]);

  const handleInput = (e) => {
    addFiles(e.target.files);
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDropOver(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  };

  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));

  // Drag-to-reorder (HTML5 native)
  const onDragStart = (e, i) => {
    setDragIdx(i);
    e.dataTransfer.effectAllowed = 'move';
  };
  const onDragOver = (e, i) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === i) return;
    const next = [...items];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(i, 0, moved);
    setDragIdx(i);
    onChange(next);
  };
  const onDragEnd = () => setDragIdx(null);

  // ── Single image mode ──────────────────────────────────────────────────────
  if (maxCount === 1) {
    const item = items[0];
    return (
      <div className={className}>
        {item ? (
          <div className="relative w-full aspect-video bg-[var(--bg)] border border-[var(--border)] overflow-hidden group">
            <img
              src={resolvedSrc(item)}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
            <button
              type="button"
              onClick={() => remove(0)}
              className="absolute top-2 right-2 p-1.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
              title="Remove image"
            >
              <FiX size={14} />
            </button>
          </div>
        ) : (
          <div
            className={`w-full aspect-video border-2 border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors ${
              dropOver
                ? 'border-[var(--accent)] bg-orange-50/60'
                : 'border-[var(--border)] bg-[var(--bg)] hover:border-[var(--accent)]'
            }`}
            onDragOver={e => { e.preventDefault(); setDropOver(true); }}
            onDragLeave={() => setDropOver(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
          >
            <FiImage size={40} className="text-[var(--text-4)]" />
            <p className="text-[var(--text-3)] text-sm font-medium select-none">
              {dropOver ? 'Drop to upload' : 'Drop image here or click to browse'}
            </p>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleInput}
        />

        <div className="flex items-center gap-3 mt-3">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 border border-[var(--border)] text-[11px] font-bold uppercase tracking-widest text-[var(--text)] hover:bg-[var(--text)] hover:text-white transition-colors"
          >
            <FiUpload size={13} /> {item ? 'Change Image' : label}
          </button>
          {item && (
            <button
              type="button"
              onClick={() => remove(0)}
              className="text-[11px] text-red-500 hover:text-red-700 font-medium underline"
            >
              Remove
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Multiple image mode ────────────────────────────────────────────────────
  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)]">
          Images — {items.length} / {maxCount}
        </span>
        {minCount > 0 && items.length === 0 && (
          <span className="text-[10px] text-red-500 font-semibold">At least {minCount} image required</span>
        )}
        {items.length > 0 && (
          <span className="text-[10px] text-[var(--text-4)]">Drag to reorder</span>
        )}
      </div>

      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
        {items.map((item, i) => (
          <div
            key={i}
            draggable
            onDragStart={e => onDragStart(e, i)}
            onDragOver={e => onDragOver(e, i)}
            onDragEnd={onDragEnd}
            className={`relative flex-shrink-0 w-44 h-44 border overflow-hidden group cursor-grab active:cursor-grabbing transition-all ${
              dragIdx === i
                ? 'border-[var(--accent)] opacity-60 scale-95'
                : 'border-[var(--border)] hover:border-[var(--accent)]'
            }`}
          >
            <img
              src={resolvedSrc(item)}
              alt={`Image ${i + 1}`}
              className="w-full h-full object-cover"
            />
            {i === 0 && (
              <span className="absolute bottom-1 left-1 text-[9px] font-bold uppercase tracking-widest bg-[var(--accent)] text-white px-2 py-0.5">
                Main
              </span>
            )}
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute top-1.5 right-1.5 p-1 bg-white border border-red-200 text-red-600 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
              title="Remove"
            >
              <FiX size={12} />
            </button>
          </div>
        ))}

        {canAdd && (
          <div
            className={`flex-shrink-0 w-44 h-44 border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${
              dropOver
                ? 'border-[var(--accent)] bg-orange-50/60'
                : 'border-[var(--border)] bg-[var(--bg)] hover:border-[var(--accent)]'
            }`}
            onDragOver={e => { e.preventDefault(); setDropOver(true); }}
            onDragLeave={() => setDropOver(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
          >
            <FiImage size={28} className="text-[var(--text-4)]" />
            <span className="text-[10px] text-[var(--text-3)] font-medium text-center select-none px-2">
              {dropOver ? 'Drop here' : `Add image\n(${items.length}/${maxCount})`}
            </span>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleInput}
      />
    </div>
  );
}
