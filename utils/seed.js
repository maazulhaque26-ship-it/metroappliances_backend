const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const slugify = require('slugify');
require('dotenv').config();

const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const { Coupon } = require('../models/index');

// Use empty images array — frontend will show 📦 emoji fallback
const NO_IMAGE = [];

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ MongoDB Connected');

  console.log('🧹 Clearing existing data...');
  await Promise.all([
    User.deleteMany(),
    Category.deleteMany(),
    Product.deleteMany(),
    Coupon.deleteMany(),
  ]);

  // ── Users ──────────────────────────────────────────────────────────────────
  console.log('👤 Seeding users...');
  const hashedAdmin = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@123456', 12);
  const hashedUser  = await bcrypt.hash('User@123456', 12);

  await User.insertMany([
    { name: 'Admin User',    email: process.env.ADMIN_EMAIL || 'admin@homekitchen.com', password: hashedAdmin, role: 'admin', isActive: true },
    { name: 'Rahul Sharma',  email: 'rahul@example.com',  password: hashedUser, role: 'user', isActive: true },
    { name: 'Priya Singh',   email: 'priya@example.com',  password: hashedUser, role: 'user', isActive: true },
  ]);

  // ── Categories ─────────────────────────────────────────────────────────────
  console.log('📁 Seeding categories...');
  const catData = [
    { name: 'Refrigerators',   icon: '🧊' },
    { name: 'Washing Machines', icon: '🫧' },
    { name: 'Microwaves',       icon: '📡' },
    { name: 'Air Conditioners', icon: '❄️' },
    { name: 'Dishwashers',      icon: '🍽️' },
    { name: 'Ovens',            icon: '🔥' },
    { name: 'Vacuum Cleaners',  icon: '🌀' },
    { name: 'Water Purifiers',  icon: '💧' },
  ];

  const categories = await Category.insertMany(
    catData.map(c => ({
      ...c,
      slug: slugify(c.name, { lower: true, strict: true }),
      isActive: true,
    }))
  );

  const catMap = {};
  categories.forEach(c => { catMap[c.name] = c._id; });

  // ── Products ───────────────────────────────────────────────────────────────
  console.log('📦 Seeding products...');

  const makeSlug = (name) =>
    slugify(name, { lower: true, strict: true }) + '-' + Date.now() + Math.floor(Math.random() * 1000);

  const products = [
    {
      name: 'Samsung 253L Double Door Refrigerator',
      brand: 'Samsung', category: catMap['Refrigerators'],
      price: 28999, discountPrice: 24499, stock: 15,
      description: 'Frost-free double door refrigerator with digital inverter technology and large capacity.',
      specs: [{ key: 'Capacity', value: '253 L' }, { key: 'Star Rating', value: '3 Star' }, { key: 'Type', value: 'Double Door' }],
      images: NO_IMAGE, isFeatured: true, isBestSeller: true, isActive: true,
    },
    {
      name: 'LG 7 Kg Front Load Washing Machine',
      brand: 'LG', category: catMap['Washing Machines'],
      price: 45000, discountPrice: 38999, stock: 10,
      description: 'Fully automatic front load washing machine with steam wash and 6 motion technology.',
      specs: [{ key: 'Capacity', value: '7 Kg' }, { key: 'Type', value: 'Front Load' }, { key: 'RPM', value: '1400' }],
      images: NO_IMAGE, isFeatured: true, isNewArrival: true, isActive: true,
    },
    {
      name: 'Bosch 25L Convection Microwave',
      brand: 'Bosch', category: catMap['Microwaves'],
      price: 15999, discountPrice: 12999, stock: 20,
      description: '25L convection microwave with 900W power, 10 power levels and auto cook menus.',
      specs: [{ key: 'Capacity', value: '25 L' }, { key: 'Power', value: '900 W' }, { key: 'Type', value: 'Convection' }],
      images: NO_IMAGE, isDealOfDay: true, isActive: true,
    },
    {
      name: 'Daikin 1.5 Ton 5 Star Split AC',
      brand: 'Daikin', category: catMap['Air Conditioners'],
      price: 42000, discountPrice: 35499, stock: 8,
      description: 'Energy-efficient split AC with PM 2.5 filter, coanda airflow and inverter compressor.',
      specs: [{ key: 'Capacity', value: '1.5 Ton' }, { key: 'Star Rating', value: '5 Star' }, { key: 'Type', value: 'Split' }],
      images: NO_IMAGE, isFeatured: true, isActive: true,
    },
    {
      name: 'Bosch 12 Place Dishwasher',
      brand: 'Bosch', category: catMap['Dishwashers'],
      price: 55000, discountPrice: 46999, stock: 6,
      description: '12 place setting dishwasher with 6 wash programs and half load option.',
      specs: [{ key: 'Place Settings', value: '12' }, { key: 'Programs', value: '6' }, { key: 'Noise', value: '48 dB' }],
      images: NO_IMAGE, isNewArrival: true, isActive: true,
    },
    {
      name: 'IFB 30 L Convection Oven',
      brand: 'IFB', category: catMap['Ovens'],
      price: 18000, discountPrice: 14499, stock: 12,
      description: '30L convection microwave oven with rotisserie and 10 auto-cook menus.',
      specs: [{ key: 'Capacity', value: '30 L' }, { key: 'Power', value: '1400 W' }, { key: 'Functions', value: '7' }],
      images: NO_IMAGE, isDealOfDay: true, isBestSeller: true, isActive: true,
    },
    {
      name: 'Dyson V15 Detect Vacuum Cleaner',
      brand: 'Dyson', category: catMap['Vacuum Cleaners'],
      price: 62000, discountPrice: 54999, stock: 7,
      description: 'Cordless vacuum cleaner with laser dust detection, LCD screen and HEPA filtration.',
      specs: [{ key: 'Type', value: 'Cordless' }, { key: 'Battery', value: '60 min' }, { key: 'Filtration', value: 'HEPA' }],
      images: NO_IMAGE, isFeatured: true, isNewArrival: true, isActive: true,
    },
    {
      name: 'Kent Grand Plus Water Purifier',
      brand: 'Kent', category: catMap['Water Purifiers'],
      price: 16000, discountPrice: 12999, stock: 25,
      description: 'RO+UV+UF water purifier with TDS controller, mineral ROTM technology and 8L storage.',
      specs: [{ key: 'Technology', value: 'RO+UV+UF' }, { key: 'Storage', value: '8 L' }, { key: 'Purification', value: '20 L/hr' }],
      images: NO_IMAGE, isBestSeller: true, isActive: true,
    },
    {
      name: 'Whirlpool 360L French Door Refrigerator',
      brand: 'Whirlpool', category: catMap['Refrigerators'],
      price: 65000, discountPrice: 54999, stock: 5,
      description: 'French door refrigerator with Intellisense inverter and 6th sense technology.',
      specs: [{ key: 'Capacity', value: '360 L' }, { key: 'Type', value: 'French Door' }, { key: 'Star Rating', value: '4 Star' }],
      images: NO_IMAGE, isFeatured: true, isActive: true,
    },
    {
      name: 'Samsung 8 Kg Top Load Washing Machine',
      brand: 'Samsung', category: catMap['Washing Machines'],
      price: 25000, discountPrice: 21499, stock: 18,
      description: 'Fully automatic top load with Digital Inverter and EcoBubble technology.',
      specs: [{ key: 'Capacity', value: '8 Kg' }, { key: 'Type', value: 'Top Load' }, { key: 'RPM', value: '700' }],
      images: NO_IMAGE, isDealOfDay: true, isActive: true,
    },
    {
      name: 'LG 1.5 Ton Dual Inverter Window AC',
      brand: 'LG', category: catMap['Air Conditioners'],
      price: 38000, discountPrice: 31999, stock: 9,
      description: 'Window AC with dual inverter compressor, 4-way swing and tropical compressor.',
      specs: [{ key: 'Capacity', value: '1.5 Ton' }, { key: 'Type', value: 'Window' }, { key: 'Star Rating', value: '5 Star' }],
      images: NO_IMAGE, isBestSeller: true, isActive: true,
    },
    {
      name: 'Eureka Forbes Aquasure RO Purifier',
      brand: 'Eureka Forbes', category: catMap['Water Purifiers'],
      price: 8999, discountPrice: 6999, stock: 30,
      description: 'Compact RO purifier with 6-stage purification and mineral guard technology.',
      specs: [{ key: 'Technology', value: 'RO+UV' }, { key: 'Storage', value: '7 L' }, { key: 'Purification', value: '15 L/hr' }],
      images: NO_IMAGE, isNewArrival: true, isActive: true,
    },
    {
      name: 'Philips 1800W Vacuum Cleaner',
      brand: 'Philips', category: catMap['Vacuum Cleaners'],
      price: 12000, discountPrice: 9499, stock: 14,
      description: 'Powerful bagless vacuum cleaner with HEPA filter and 3L dust container.',
      specs: [{ key: 'Power', value: '1800 W' }, { key: 'Type', value: 'Canister' }, { key: 'Container', value: '3 L' }],
      images: NO_IMAGE, isDealOfDay: true, isActive: true,
    },
  ];

  await Product.insertMany(
    products.map(p => ({ ...p, slug: makeSlug(p.name) }))
  );

  // ── Coupons ────────────────────────────────────────────────────────────────
  console.log('🎟️  Seeding coupons...');
  const future = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  await Coupon.insertMany([
    { code: 'WELCOME10', type: 'percentage', value: 10, minOrderAmount: 1000,  maxDiscount: 500,  expiryDate: future, usageLimit: 1000, isActive: true },
    { code: 'FLAT500',   type: 'flat',       value: 500, minOrderAmount: 5000,  maxDiscount: 500,  expiryDate: future, usageLimit: 500,  isActive: true },
    { code: 'SUMMER20',  type: 'percentage', value: 20, minOrderAmount: 10000, maxDiscount: 3000, expiryDate: future, usageLimit: 200,  isActive: true },
  ]);

  console.log('');
  console.log('✅ Database seeded successfully!');
  console.log('📧 Admin : ' + (process.env.ADMIN_EMAIL || 'admin@homekitchen.com') + ' / ' + (process.env.ADMIN_PASSWORD || 'Admin@123456'));
  console.log('📧 User  : rahul@example.com / User@123456');
  console.log('');
  console.log('💡 Tip: Upload product images via Admin → Products → Edit');
  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });