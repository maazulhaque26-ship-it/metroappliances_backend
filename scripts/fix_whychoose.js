const mongoose = require('mongoose');
const WhyChoose = require('./models/WhyChoose');
require('dotenv').config();

async function fixPaths() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');
    const section = await WhyChoose.findOne();
    if (section) {
      let changed = false;
      section.cards.forEach(card => {
        if (card.image && card.image.url) {
           console.log('Found URL:', card.image.url);
           if (card.image.url.includes('projects') || card.image.url.includes('ecommerce-app') || card.image.url.includes('uploads')) {
             const parts = card.image.url.split(/\\|\//);
             const filename = parts[parts.length - 1];
             if (card.image.url !== `/uploads/${filename}`) {
               card.image.url = `/uploads/${filename}`;
               changed = true;
               console.log(`Fixed card: ${card.title} -> /uploads/${filename}`);
             }
           }
        }
      });
      if (changed) {
        await section.save();
        console.log('Successfully saved fixed paths.');
      } else {
        console.log('No broken paths found.');
      }
    }
  } catch (error) {
    console.error('Error fixing DB:', error);
  } finally {
    mongoose.disconnect();
  }
}

fixPaths();
