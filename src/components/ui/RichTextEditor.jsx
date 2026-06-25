import React, { useEffect, useRef, useCallback } from 'react';
import { sanitizeHtml } from '../../utils/sanitizeHtml';

// Toolbar button definitions
const TOOLBAR = [
  { cmd: 'bold',          label: 'B',     title: 'Bold',          style: { fontWeight: 700 } },
  { cmd: 'italic',        label: 'I',     title: 'Italic',        style: { fontStyle: 'italic' } },
  { cmd: 'underline',     label: 'U',     title: 'Underline',     style: { textDecoration: 'underline' } },
  { cmd: 'strikeThrough', label: 'S',     title: 'Strikethrough', style: { textDecoration: 'line-through' } },
  null, // separator
  { cmd: 'formatBlock',   val: 'h2',      label: 'H2',            title: 'Heading 2' },
  { cmd: 'formatBlock',   val: 'h3',      label: 'H3',            title: 'Heading 3' },
  { cmd: 'formatBlock',   val: 'p',       label: '¶',             title: 'Paragraph' },
  null,
  { cmd: 'insertUnorderedList', label: '• List', title: 'Bullet list' },
  { cmd: 'insertOrderedList',   label: '1. List', title: 'Numbered list' },
  null,
  { cmd: 'blockquote_custom', label: '❝', title: 'Blockquote' },
];

function execCmd(cmd, val) {
  // eslint-disable-next-line no-undef
  document.execCommand(cmd, false, val || null);
}

export default function RichTextEditor({ value, onChange, placeholder = 'Write content here…', minHeight = 280 }) {
  const editorRef   = useRef(null);
  const isInternalChange = useRef(false);

  // Sync value → editor on mount or external value change
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    const sanitized = sanitizeHtml(value || '');
    // Only update DOM if content actually differs to avoid cursor jumps
    if (el.innerHTML !== sanitized) {
      isInternalChange.current = true;
      el.innerHTML = sanitized;
      isInternalChange.current = false;
    }
  }, [value]);

  const emitChange = useCallback(() => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    onChange?.(html);
  }, [onChange]);

  const handleInput = useCallback(() => {
    if (!isInternalChange.current) emitChange();
  }, [emitChange]);

  const handleKeyDown = (e) => {
    // Ctrl+B/I/U shortcuts
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b') { e.preventDefault(); execCmd('bold'); }
      if (e.key === 'i') { e.preventDefault(); execCmd('italic'); }
      if (e.key === 'u') { e.preventDefault(); execCmd('underline'); }
    }
  };

  const handleToolbarClick = (btn, e) => {
    e.preventDefault();
    editorRef.current?.focus();
    if (btn.cmd === 'blockquote_custom') {
      execCmd('formatBlock', 'blockquote');
    } else if (btn.val) {
      execCmd(btn.cmd, btn.val);
    } else {
      execCmd(btn.cmd);
    }
    emitChange();
  };

  return (
    <div className="border border-[var(--border)] overflow-hidden" style={{ background: '#fff' }}>
      {/* Toolbar */}
      <div
        className="flex flex-wrap items-center gap-0.5 px-2 py-1.5"
        style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}
        onMouseDown={e => e.preventDefault()}
      >
        {TOOLBAR.map((btn, i) => {
          if (btn === null) {
            return <span key={`sep-${i}`} className="w-px h-5 mx-1" style={{ background: 'var(--border)' }} />;
          }
          return (
            <button
              key={btn.cmd + (btn.val || '')}
              title={btn.title}
              onMouseDown={e => handleToolbarClick(btn, e)}
              className="px-2.5 py-1 text-[12px] rounded transition-colors hover:bg-[var(--border)] text-[var(--text-2)]"
              style={btn.style}
              type="button"
            >
              {btn.label}
            </button>
          );
        })}
      </div>

      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onBlur={emitChange}
        onKeyDown={handleKeyDown}
        data-placeholder={placeholder}
        style={{ minHeight, padding: '14px 16px', outline: 'none', fontSize: '14px', lineHeight: '1.7', color: 'var(--text)', fontFamily: 'var(--font-body)' }}
        className="prose-editor"
      />

      <style>{`
        .prose-editor:empty::before {
          content: attr(data-placeholder);
          color: #aaa;
          pointer-events: none;
          display: block;
        }
        .prose-editor h2 { font-size: 1.4em; font-weight: 700; margin: 0.75em 0 0.25em; }
        .prose-editor h3 { font-size: 1.2em; font-weight: 700; margin: 0.6em 0 0.2em; }
        .prose-editor p  { margin: 0 0 0.6em; }
        .prose-editor ul { list-style: disc; padding-left: 1.5em; margin: 0.5em 0; }
        .prose-editor ol { list-style: decimal; padding-left: 1.5em; margin: 0.5em 0; }
        .prose-editor li { margin: 0.2em 0; }
        .prose-editor blockquote {
          border-left: 3px solid #FF7A00;
          margin: 0.75em 0;
          padding: 0.5em 1em;
          background: #FFF8F3;
          color: #555;
          font-style: italic;
        }
        .prose-editor a { color: #FF7A00; text-decoration: underline; }
      `}</style>
    </div>
  );
}
