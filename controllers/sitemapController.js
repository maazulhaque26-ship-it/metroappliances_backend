'use strict';

const Product  = require('../models/Product');
const Blog     = require('../models/Blog');
const Category = require('../models/Category');

const BASE_URL = process.env.CLIENT_URL || 'https://frontend-zeta-sandy-56.vercel.app';

const xmlEscape = (str) =>
  String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const urlEntry = (loc, lastmod, changefreq, priority) => `
  <url>
    <loc>${xmlEscape(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;

exports.getSitemap = async (req, res) => {
  try {
    const now = new Date().toISOString().split('T')[0];

    // Static pages
    const staticPages = [
      { path: '/',        changefreq: 'daily',   priority: '1.0' },
      { path: '/shop',    changefreq: 'daily',   priority: '0.9' },
      { path: '/deals',   changefreq: 'daily',   priority: '0.8' },
      { path: '/about',   changefreq: 'monthly', priority: '0.5' },
      { path: '/contact', changefreq: 'monthly', priority: '0.5' },
    ];

    // Dynamic: active products (slug + updatedAt)
    const products = await Product
      .find({ isActive: true }, 'slug updatedAt')
      .lean()
      .limit(5000);

    // Dynamic: active blog posts
    const blogs = await Blog
      .find({ isActive: true }, 'slug updatedAt')
      .lean()
      .limit(1000);

    // Dynamic: categories
    const categories = await Category
      .find({}, 'slug updatedAt')
      .lean()
      .limit(200);

    const staticUrls = staticPages.map(p =>
      urlEntry(`${BASE_URL}${p.path}`, now, p.changefreq, p.priority)
    ).join('');

    const productUrls = products.map(p =>
      urlEntry(
        `${BASE_URL}/products/${p.slug}`,
        p.updatedAt ? new Date(p.updatedAt).toISOString().split('T')[0] : now,
        'weekly',
        '0.8',
      )
    ).join('');

    const blogUrls = blogs.map(b =>
      urlEntry(
        `${BASE_URL}/blog/${b.slug}`,
        b.updatedAt ? new Date(b.updatedAt).toISOString().split('T')[0] : now,
        'monthly',
        '0.6',
      )
    ).join('');

    const categoryUrls = categories.map(c =>
      urlEntry(
        `${BASE_URL}/shop?category=${c.slug}`,
        c.updatedAt ? new Date(c.updatedAt).toISOString().split('T')[0] : now,
        'weekly',
        '0.7',
      )
    ).join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${staticUrls}${productUrls}${blogUrls}${categoryUrls}
</urlset>`;

    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=3600'); // 1 hour cache
    res.send(xml.trim());

  } catch (err) {
    console.error('[Sitemap] generation error:', err.message);
    res.status(500).json({ message: 'Sitemap generation failed' });
  }
};
