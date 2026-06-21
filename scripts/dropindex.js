require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  await mongoose.connection.collection('products').dropIndex('sku_1');
  console.log('✅ sku_1 index dropped!');
  process.exit(0);
}).catch(err => {
  console.log('Index may not exist:', err.message);
  process.exit(0);
});