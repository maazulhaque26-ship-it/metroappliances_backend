const mongoose = require('mongoose');

const whyChooseSchema = new mongoose.Schema(
  {
    sectionBadge: { type: String, default: 'THE METRO PROMISE' },
    sectionTitle: { type: String, default: 'Why Choose Metro' },
    sectionDescription: { type: String, default: 'We engineer every product to the highest standards — because your home deserves nothing less.' },
    cards: [
      {
        title: { type: String, required: true },
        description: { type: String, required: true },
        image: {
          publicId: { type: String, required: true },
          url: { type: String, required: true },
          alt: { type: String }
        },
        order: { type: Number, default: 0 },
        isActive: { type: Boolean, default: true },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model('WhyChoose', whyChooseSchema);
