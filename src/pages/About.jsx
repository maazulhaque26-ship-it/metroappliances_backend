import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import useScrollReveal from '../hooks/useScrollReveal';
import { FiShield, FiArrowRight } from 'react-icons/fi';
import { imgSrc, PLACEHOLDER } from '../utils/imageHelper';
import GalleryLightbox from '../components/ui/GalleryLightbox';

function AnimatedNumber({ target, suffix }) {
  const [count, setCount] = useState(0);
  const ref     = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        let n = 0;
        const step  = Math.max(1, Math.ceil(target / 60));
        const timer = setInterval(() => {
          n += step;
          if (n >= target) { setCount(target); clearInterval(timer); }
          else setCount(n);
        }, 16);
      }
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target]);

  return <span ref={ref}>{count.toLocaleString('en-IN')}{suffix}</span>;
}

export default function About() {
  const [team,             setTeam]             = useState([]);
  const [whyChoose,        setWhyChoose]        = useState(null);
  const [achievements,     setAchievements]     = useState([]);
  const [achievementStats, setAchievementStats] = useState([]);
  const [gallery,          setGallery]          = useState([]);
  const [blogs,            setBlogs]            = useState([]);
  const [lightboxIndex,    setLightboxIndex]    = useState(null);

  useEffect(() => {
    import('../services/api').then(m => {
      const api = m.default;
      api.get('/team').then(res => setTeam(res.data.team)).catch(() => {});
      api.get('/why-choose').then(res => setWhyChoose(res.data)).catch(() => {});
      api.get('/achievements').then(res => setAchievements(res.data.achievements)).catch(() => {});
      api.get('/achievement-stats').then(res => setAchievementStats(res.data.stats)).catch(() => {});
      api.get('/gallery').then(res => setGallery(res.data.images)).catch(() => {});
      api.get('/blogs').then(res => setBlogs(res.data.blogs)).catch(() => {});
    });
  }, []);

  useScrollReveal({}, [team, whyChoose, achievements, achievementStats, gallery, blogs]);

  return (
    <div className="min-h-screen bg-[#F7F6F3] pt-24 md:pt-32 pb-16 md:pb-24">

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 mb-16 md:mb-24 text-center reveal">
        <div className="max-w-4xl mx-auto">
          <span className="block text-sm font-bold tracking-[0.2em] uppercase text-gray-500 mb-6">
            The Metro Story
          </span>
          <h1 className="text-5xl md:text-7xl font-extrabold text-[#111111] mb-8 leading-[1.1] tracking-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Redefining Indian Homes<br />Since 2020
          </h1>
          <p className="text-xl text-[#444444] max-w-2xl mx-auto leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
            Metro Appliances was founded with one conviction: Indian homes deserve world-class appliances — designed with intention, built with precision, and supported with care.
          </p>
        </div>
      </section>

      {/* ── Company Story (Mission & Vision) ─────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 mb-16 md:mb-32">
        <div className="grid md:grid-cols-2 gap-16 stagger-grid">
          <div>
            <span className="block text-xs font-bold tracking-[0.2em] uppercase text-[#FF7A00] mb-4">Our Mission</span>
            <h2 className="text-3xl font-extrabold text-[#111111] mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>Engineering Excellence</h2>
            <p className="text-[#444444] leading-relaxed text-lg">
              To engineer home appliances that earn a permanent place in the homes of discerning customers — products that combine precision technology, sustainable design, and effortless usability.
            </p>
          </div>
          <div>
            <span className="block text-xs font-bold tracking-[0.2em] uppercase text-[#FF7A00] mb-4">Our Vision</span>
            <h2 className="text-3xl font-extrabold text-[#111111] mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>The Defining Brand</h2>
            <p className="text-[#444444] leading-relaxed text-lg">
              To be the defining home appliance brand of the next generation — recognized globally for design integrity, technological leadership, and an unwavering commitment to customer experience.
            </p>
          </div>
        </div>
      </section>

      {/* ── Achievement Counters (dynamic, animated) ──────────────────────────── */}
      {achievementStats.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 mb-16 md:mb-32">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 border-y border-[#E5E5E5] py-16 stagger-grid">
            {achievementStats.map(stat => (
              <div key={stat._id} className="text-center">
                <div className="text-4xl md:text-5xl font-extrabold text-[#FF7A00] mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  <AnimatedNumber target={stat.count} suffix={stat.suffix} />
                </div>
                <p className="text-[#666666] text-sm font-bold uppercase tracking-widest">{stat.title}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Why Choose Metro ──────────────────────────────────────────────────── */}
      {whyChoose && whyChoose.cards && whyChoose.cards.length > 0 && (
        <section className="bg-white py-16 md:py-24 mb-16 md:mb-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-16 reveal">
              {whyChoose.sectionBadge && (
                <span className="block text-sm font-bold tracking-[0.2em] uppercase text-gray-500 mb-4">{whyChoose.sectionBadge}</span>
              )}
              {whyChoose.sectionTitle && (
                <h2 className="text-4xl font-extrabold text-[#111111] mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>{whyChoose.sectionTitle}</h2>
              )}
              {whyChoose.sectionDescription && (
                <p className="text-[#666666] leading-relaxed max-w-2xl mx-auto text-lg">{whyChoose.sectionDescription}</p>
              )}
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-grid">
              {whyChoose.cards
                .filter(card => card.isActive)
                .sort((a, b) => a.order - b.order)
                .map(card => (
                  <div
                    key={card._id}
                    className="overflow-hidden transition-shadow duration-300 bg-white"
                    style={{ border: '1px solid #E5E5E5', borderRadius: '14px' }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                  >
                    {card.image && (
                      <div className="w-full h-[200px] bg-[#F7F6F3]">
                        <img src={imgSrc(card.image)} alt={card.title} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                      </div>
                    )}
                    <div className="p-6 text-left">
                      <h3 className="text-[#111111] font-bold text-base mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>{card.title}</h3>
                      <p className="text-[#666666] text-sm leading-relaxed">{card.description}</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Achievements ──────────────────────────────────────────────────────── */}
      {achievements.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 mb-16 md:mb-32">
          <div className="text-center mb-16 reveal">
            <span className="block text-xs font-bold tracking-[0.2em] uppercase text-[#FF7A00] mb-4">Our Achievements</span>
            <h2 className="text-4xl font-extrabold text-[#111111]" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Milestones We're Proud Of
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 stagger-grid">
            {achievements.map(item => (
              <div key={item._id}
                className="bg-white border border-[#E5E5E5] p-8 flex flex-col hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-300">
                {item.image && (
                  <div className="w-full aspect-[4/3] overflow-hidden mb-6 bg-[#F7F6F3] border border-[#E5E5E5]">
                    <img
                      src={imgSrc(item.image)}
                      alt={item.title}
                      loading="lazy"
                      className="w-full h-full object-cover"
                      onError={e => { e.target.onerror = null; e.target.src = PLACEHOLDER; }}
                    />
                  </div>
                )}
                <h3 className="text-[#111111] font-extrabold text-xl mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {item.title}
                </h3>
                <p className="text-[#666666] leading-relaxed text-sm flex-1">
                  {item.description.length > 150 ? item.description.substring(0, 150) + '…' : item.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Team ──────────────────────────────────────────────────────────────── */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 mb-16 md:mb-32">
        <div className="text-center mb-16 reveal">
          <h2 className="text-4xl md:text-5xl font-extrabold text-[#111111] mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Meet The Team Behind Metro
          </h2>
          <p className="text-lg text-[#666666] max-w-2xl mx-auto">
            The people dedicated to building trusted appliances for modern homes across India.
          </p>
        </div>
        {team.length === 0 ? (
          <div className="text-center py-12 border border-[#E5E5E5] bg-white">
            <p className="text-[#666666] text-lg font-medium">No team members added yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 stagger-grid">
            {team.map(member => (
              <div key={member._id} className="bg-white border border-[#E5E5E5] p-10 text-center group hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-300 flex flex-col items-center">
                <div className="w-[220px] h-[220px] rounded-full mx-auto mb-8 overflow-hidden bg-[#F7F6F3] border border-[#E5E5E5]">
                  {member.photo ? (
                    <img
                      src={imgSrc(member.photo)}
                      alt={member.name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={e => { e.target.onerror = null; e.target.src = PLACEHOLDER; }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#111111] font-extrabold text-5xl" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      {member.name.charAt(0)}
                    </div>
                  )}
                </div>
                <h3 className="text-[#111111] font-bold text-[20px] md:text-[22px] lg:text-[28px] mb-2 leading-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {member.name}
                </h3>
                <p className="text-[#FF7A00] text-sm font-bold tracking-[0.15em] uppercase mb-5">
                  {member.designation}
                </p>
                {member.bio && (
                  <p className="text-[#666666] text-sm leading-relaxed max-w-[280px] mx-auto">
                    {member.bio.length > 120 ? member.bio.substring(0, 120) + '...' : member.bio}
                  </p>
                )}
                {member.linkedin && (
                  <a href={member.linkedin} target="_blank" rel="noreferrer"
                    className="inline-block mt-6 text-[#111111] font-bold text-xs uppercase tracking-widest hover:text-[#FF7A00] transition-colors">
                    LinkedIn
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Gallery (with Lightbox) ───────────────────────────────────────────── */}
      {gallery.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 mb-16 md:mb-32">
          <div className="text-center mb-16 reveal">
            <span className="block text-xs font-bold tracking-[0.2em] uppercase text-[#FF7A00] mb-4">Gallery</span>
            <h2 className="text-4xl font-extrabold text-[#111111]" style={{ fontFamily: 'Poppins, sans-serif' }}>
              A Glimpse of Metro
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 stagger-grid">
            {gallery.map((item, i) => (
              <button
                key={item._id}
                onClick={() => setLightboxIndex(i)}
                className="group relative overflow-hidden bg-[#F7F6F3] aspect-square text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF7A00]"
                aria-label={`View image ${i + 1}`}
              >
                <img
                  src={imgSrc(item.image)}
                  alt=""
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  onError={e => { e.target.onerror = null; e.target.src = PLACEHOLDER; }}
                />
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <GalleryLightbox
          images={gallery}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}

      {/* ── Latest Blog Posts ─────────────────────────────────────────────────── */}
      {blogs.length > 0 && (
        <section className="bg-white py-16 md:py-24 mb-16 md:mb-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-16 reveal">
              <span className="block text-xs font-bold tracking-[0.2em] uppercase text-[#FF7A00] mb-4">Our Blog</span>
              <h2 className="text-4xl font-extrabold text-[#111111]" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Insights & Updates
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 stagger-grid">
              {blogs.slice(0, 6).map(post => (
                <Link
                  key={post._id}
                  to={`/blog/${post.slug}`}
                  className="group bg-[#F7F6F3] border border-[#E5E5E5] flex flex-col hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                >
                  <div className="aspect-[16/9] overflow-hidden bg-[#E5E5E5]">
                    {post.image ? (
                      <img
                        src={imgSrc(post.image)}
                        alt={post.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={e => { e.target.onerror = null; e.target.src = PLACEHOLDER; }}
                      />
                    ) : (
                      <div className="w-full h-full bg-[#E5E5E5]" />
                    )}
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#FF7A00] mb-3">
                      {new Date(post.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    <h3 className="text-[#111111] font-extrabold text-lg leading-snug mb-3 group-hover:text-[#FF7A00] transition-colors" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      {post.title}
                    </h3>
                    <p className="text-[#666666] text-sm leading-relaxed flex-1">
                      {(post.excerpt || post.description).length > 180
                        ? (post.excerpt || post.description).substring(0, 180) + '…'
                        : (post.excerpt || post.description)}
                    </p>
                    <span className="mt-4 text-[11px] font-bold uppercase tracking-widest text-[#111111] group-hover:text-[#FF7A00] transition-colors flex items-center gap-2">
                      Read More <FiArrowRight size={13} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA ───────────────────────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 text-center reveal">
        <div className="bg-white border border-[#E5E5E5] py-16 md:py-24 px-6 md:px-8">
          <h2 className="text-4xl font-extrabold text-[#111111] mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>Experience Metro</h2>
          <p className="text-[#666666] text-lg mb-10 max-w-lg mx-auto">Explore our full range of premium home appliances designed to elevate your living space.</p>
          <Link to="/shop" className="inline-flex items-center gap-3 px-8 py-4 bg-[#111111] text-white font-bold uppercase tracking-widest text-sm hover:bg-[#333333] transition-colors">
            Shop Collection <FiArrowRight size={18} />
          </Link>
        </div>
      </section>

    </div>
  );
}
