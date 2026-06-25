import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../services/api';
import { imgSrc, PLACEHOLDER } from '../utils/imageHelper';
import { sanitizeHtml } from '../utils/sanitizeHtml';
import { FiArrowLeft } from 'react-icons/fi';

export default function BlogDetail() {
  const { slug } = useParams();
  const [blog,    setBlog]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    API.get(`/blogs/${slug}`)
      .then(res => setBlog(res.data.blog))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F6F3] pt-32 pb-24 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#111111] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen bg-[#F7F6F3] pt-32 pb-24 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-[#111111] mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Post Not Found
          </h1>
          <p className="text-[#666666] mb-8">This blog post doesn't exist or has been removed.</p>
          <Link to="/about" className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-[#111111] hover:text-[#FF7A00] transition-colors">
            <FiArrowLeft size={16} /> Back to About
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F6F3] pt-32 pb-24">
      {/* Back link */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 mb-10">
        <Link
          to="/about"
          className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#666666] hover:text-[#111111] transition-colors"
        >
          <FiArrowLeft size={14} /> Back to About
        </Link>
      </div>

      {/* Hero image */}
      {blog.image && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 mb-12">
          <div className="w-full aspect-[16/7] overflow-hidden bg-[#E5E5E5]">
            <img
              src={imgSrc(blog.image)}
              alt={blog.title}
              className="w-full h-full object-cover"
              onError={e => { e.target.onerror = null; e.target.src = PLACEHOLDER; }}
            />
          </div>
        </div>
      )}

      {/* Content */}
      <article className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Date */}
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#FF7A00] mb-4">
          {new Date(blog.createdAt).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'long', year: 'numeric',
          })}
        </p>

        {/* Title */}
        <h1
          className="text-4xl md:text-5xl font-extrabold text-[#111111] mb-10 leading-[1.15] tracking-tight"
          style={{ fontFamily: 'Poppins, sans-serif' }}
        >
          {blog.title}
        </h1>

        {/* Body */}
        {blog.content ? (
          <div
            className="prose-blog text-[#444444] leading-relaxed text-lg"
            style={{ fontFamily: 'Inter, sans-serif' }}
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(blog.content) }}
          />
        ) : (
          <div
            className="text-[#444444] leading-relaxed text-lg space-y-4"
            style={{ fontFamily: 'Inter, sans-serif', whiteSpace: 'pre-line' }}
          >
            {blog.description}
          </div>
        )}
        <style>{`
          .prose-blog h2 { font-size:1.5em; font-weight:700; margin:1.2em 0 0.4em; font-family:'Poppins',sans-serif; color:#111; }
          .prose-blog h3 { font-size:1.25em; font-weight:700; margin:1em 0 0.3em; font-family:'Poppins',sans-serif; color:#111; }
          .prose-blog p  { margin:0 0 1em; }
          .prose-blog ul { list-style:disc; padding-left:1.5em; margin:0.75em 0; }
          .prose-blog ol { list-style:decimal; padding-left:1.5em; margin:0.75em 0; }
          .prose-blog li { margin:0.3em 0; }
          .prose-blog blockquote { border-left:4px solid #FF7A00; padding:0.75em 1.25em; margin:1em 0; background:#FFF8F3; color:#555; font-style:italic; }
          .prose-blog a  { color:#FF7A00; text-decoration:underline; }
          .prose-blog strong,.prose-blog b { font-weight:700; }
        `}</style>
      </article>

      {/* Footer CTA */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 mt-16 pt-12 border-t border-[#E5E5E5]">
        <Link
          to="/about"
          className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#111111] hover:text-[#FF7A00] transition-colors"
        >
          <FiArrowLeft size={14} /> Back to About
        </Link>
      </div>
    </div>
  );
}
