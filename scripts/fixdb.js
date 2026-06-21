require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const slugify = require('slugify');

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected');

  // Drop all collections completely
  const collections = await mongoose.connection.db.collections();
  for (const col of collections) {
    await col.drop().catch(() => {});
    console.log('🗑️  Dropped:', col.collectionName);
  }

  // Re-require models fresh
  const User = require('./models/User');
  const Category = require('./models/Category');
  const Product = require('./models/Product');
  const { Coupon } = require('./models/index');

  // Users
  const hashedAdmin = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@123456', 12);
  const hashedUser  = await bcrypt.hash('User@123456', 12);
  await User.insertMany([
    { name: 'Admin User',    email: process.env.ADMIN_EMAIL || 'admin@homekitchen.com', password: hashedAdmin, role: 'admin', isActive: true },
    { name: 'Rahul Sharma',  email: 'rahul@example.com',  password: hashedUser, role: 'user', isActive: true },
    { name: 'Priya Singh',   email: 'priya@example.com',  password: hashedUser, role: 'user', isActive: true },
  ]);
  console.log('👤 Users seeded');

  // Categories
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
    catData.map(c => ({ ...c, slug: slugify(c.name, { lower: true, strict: true }), isActive: true }))
  );
  const cm = {};
  categories.forEach(c => { cm[c.name] = c._id; });
  console.log('📁 Categories seeded');

  // Products — unique slug per product using index
  const mk = (name, i) => slugify(name, { lower: true, strict: true }) + '-' + i;
  const products = [
    { name: 'Samsung 253L Double Door Refrigerator', brand: 'Samsung',       category: cm['Refrigerators'],   price: 28999, discountPrice: 24499, stock: 15, description: 'Frost-free double door refrigerator with digital inverter technology.', specs: [{ key: 'Capacity', value: '253 L' }, { key: 'Star Rating', value: '3 Star' }], images: [{ url: '/uploads/placeholder.jpg', public_id: 'placeholder' }], isFeatured: true,  isBestSeller: true,  isActive: true },
    { name: 'LG 7 Kg Front Load Washing Machine',    brand: 'LG',            category: cm['Washing Machines'],price: 45000, discountPrice: 38999, stock: 10, description: 'Fully automatic front load washing machine with steam wash technology.',  specs: [{ key: 'Capacity', value: '7 Kg' },   { key: 'Type',        value: 'Front Load' }], images: [{ url: '/uploads/placeholder.jpg', public_id: 'placeholder' }], isFeatured: true,  isNewArrival: true,  isActive: true },
    { name: 'Bosch 25L Convection Microwave',        brand: 'Bosch',         category: cm['Microwaves'],      price: 15999, discountPrice: 12999, stock: 20, description: '25L convection microwave with 900W power and 10 power levels.',          specs: [{ key: 'Capacity', value: '25 L' },   { key: 'Power',       value: '900 W' }],        images: [{ url: '/uploads/placeholder.jpg', public_id: 'placeholder' }], isDealOfDay: true,                      isActive: true },
    { name: 'Daikin 1.5 Ton 5 Star Split AC',        brand: 'Daikin',        category: cm['Air Conditioners'],price: 42000, discountPrice: 35499, stock:  8, description: 'Energy-efficient split AC with PM 2.5 filter.',                          specs: [{ key: 'Capacity', value: '1.5 Ton' }, { key: 'Star Rating', value: '5 Star' }],    images: [{ url: '/uploads/placeholder.jpg', public_id: 'placeholder' }], isFeatured: true,                       isActive: true },
    { name: 'Bosch 12 Place Dishwasher',             brand: 'Bosch',         category: cm['Dishwashers'],     price: 55000, discountPrice: 46999, stock:  6, description: '12 place setting dishwasher with 6 programs.',                           specs: [{ key: 'Place Settings', value: '12' }],                                           images: [{ url: '/uploads/placeholder.jpg', public_id: 'placeholder' }], isNewArrival: true,                     isActive: true },
    { name: 'IFB 30 L Convection Oven',              brand: 'IFB',           category: cm['Ovens'],           price: 18000, discountPrice: 14499, stock: 12, description: '30L convection oven with rotisserie.',                                    specs: [{ key: 'Capacity', value: '30 L' }],                                               images: [{ url: '/uploads/placeholder.jpg', public_id: 'placeholder' }], isDealOfDay: true, isBestSeller: true,  isActive: true },
    { name: 'Dyson V15 Detect Vacuum Cleaner',       brand: 'Dyson',         category: cm['Vacuum Cleaners'], price: 62000, discountPrice: 54999, stock:  7, description: 'Cordless vacuum with laser dust detection.',                              specs: [{ key: 'Type', value: 'Cordless' }],                                               images: [{ url: '/uploads/placeholder.jpg', public_id: 'placeholder' }], isFeatured: true,  isNewArrival: true,  isActive: true },
    { name: 'Kent Grand Plus Water Purifier',        brand: 'Kent',          category: cm['Water Purifiers'], price: 16000, discountPrice: 12999, stock: 25, description: 'RO+UV+UF water purifier with TDS controller.',                            specs: [{ key: 'Technology', value: 'RO+UV+UF' }],                                         images: [{ url: '/uploads/placeholder.jpg', public_id: 'placeholder' }],                   isBestSeller: true,  isActive: true },
    { name: 'Whirlpool 360L French Door Refrigerator',brand: 'Whirlpool',    category: cm['Refrigerators'],   price: 65000, discountPrice: 54999, stock:  5, description: 'French door refrigerator with Intellisense inverter.',                    specs: [{ key: 'Capacity', value: '360 L' }],                                              images: [{ url: '/uploads/placeholder.jpg', public_id: 'placeholder' }], isFeatured: true,                       isActive: true },
    { name: 'Samsung 8 Kg Top Load Washing Machine', brand: 'Samsung',       category: cm['Washing Machines'],price: 25000, discountPrice: 21499, stock: 18, description: 'Fully automatic top load with Digital Inverter.',                          specs: [{ key: 'Capacity', value: '8 Kg' },   { key: 'Type',        value: 'Top Load' }],    images: [{ url: '/uploads/placeholder.jpg', public_id: 'placeholder' }], isDealOfDay: true,                      isActive: true },
    { name: 'LG 1.5 Ton Dual Inverter Window AC',    brand: 'LG',            category: cm['Air Conditioners'],price: 38000, discountPrice: 31999, stock:  9, description: 'Window AC with dual inverter compressor.',                                specs: [{ key: 'Capacity', value: '1.5 Ton' }, { key: 'Type',        value: 'Window' }],    images: [{ url: '/uploads/placeholder.jpg', public_id: 'placeholder' }],                   isBestSeller: true,  isActive: true },
    { name: 'Eureka Forbes Aquasure RO Purifier',    brand: 'Eureka Forbes', category: cm['Water Purifiers'], price:  8999, discountPrice:  6999, stock: 30, description: 'Compact RO purifier with 6-stage purification.',                          specs: [{ key: 'Technology', value: 'RO+UV' }],                                            images: [{ url: '/uploads/placeholder.jpg', public_id: 'placeholder' }], isNewArrival: true,                     isActive: true },
    { name: 'Philips 1800W Vacuum Cleaner',          brand: 'Philips',       category: cm['Vacuum Cleaners'], price: 12000, discountPrice:  9499, stock: 14, description: 'Powerful bagless vacuum cleaner with HEPA filter.',                        specs: [{ key: 'Power', value: '1800 W' }],                                                images: [{ url: '/uploads/placeholder.jpg', public_id: 'placeholder' }], isDealOfDay: true,                      isActive: true },
  ];

  await Product.insertMany(products.map((p, i) => ({ ...p, slug: mk(p.name, i + 1) })));
  console.log('📦 Products seeded');

  // Coupons
  const exp = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  await Coupon.insertMany([
    { code: 'WELCOME10', type: 'percentage', value: 10, minOrderAmount: 1000, maxDiscount: 500,  expiryDate: exp, usageLimit: 1000, isActive: true },
    { code: 'FLAT500',   type: 'flat',       value: 500, minOrderAmount: 5000, maxDiscount: 500,  expiryDate: exp, usageLimit: 500,  isActive: true },
    { code: 'SUMMER20',  type: 'percentage', value: 20, minOrderAmount: 10000,maxDiscount: 3000, expiryDate: exp, usageLimit: 200,  isActive: true },
  ]);
  console.log('🎟️  Coupons seeded');

  console.log('\n✅ Database fixed and seeded successfully!');
  console.log('📧 Admin: ' + (process.env.ADMIN_EMAIL || 'admin@homekitchen.com') + ' / ' + (process.env.ADMIN_PASSWORD || 'Admin@123456'));
  console.log('📧 User:  rahul@example.com / User@123456');
  process.exit(0);
};

run().catch(err => { console.error('❌', err.message); process.exit(1); });