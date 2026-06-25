const WhyChoose = require('../models/WhyChoose');
const { cloudinary } = require('../config/cloudinary');

// Get the Why Choose section
exports.getWhyChoose = async (req, res) => {
  try {
    let section = await WhyChoose.findOne();
    if (!section) {
      section = await WhyChoose.create({});
    }
    res.json(section);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch Why Choose section' });
  }
};

// Update the Why Choose section settings (badge, title, description)
exports.updateSection = async (req, res) => {
  try {
    const { sectionBadge, sectionTitle, sectionDescription } = req.body;
    let section = await WhyChoose.findOne();
    if (!section) {
      section = await WhyChoose.create({ sectionBadge, sectionTitle, sectionDescription });
    } else {
      section.sectionBadge = sectionBadge || section.sectionBadge;
      section.sectionTitle = sectionTitle || section.sectionTitle;
      section.sectionDescription = sectionDescription || section.sectionDescription;
      await section.save();
    }
    res.json(section);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update section settings' });
  }
};

// Add a new card
exports.addCard = async (req, res) => {
  try {
    const { title, description, isActive, order } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: 'Image is required' });
    }

    const image = {
      publicId: req.file.filename,
      url: req.file.path,
      alt: title
    };

    let section = await WhyChoose.findOne();
    if (!section) {
      section = await WhyChoose.create({});
    }

    section.cards.push({
      title,
      description,
      image,
      isActive: isActive !== undefined ? isActive : true,
      order: order || section.cards.length
    });

    await section.save();
    res.status(201).json(section);
  } catch (error) {
    console.error('Error adding card:', error);
    res.status(500).json({ message: 'Failed to add card' });
  }
};

// Update a card
exports.updateCard = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, isActive, order } = req.body;

    const section = await WhyChoose.findOne();
    if (!section) return res.status(404).json({ message: 'Section not found' });

    const card = section.cards.id(id);
    if (!card) return res.status(404).json({ message: 'Card not found' });

    if (title !== undefined) card.title = title;
    if (description !== undefined) card.description = description;
    if (isActive !== undefined) card.isActive = isActive;
    if (order !== undefined) card.order = order;
    card.updatedAt = Date.now();

    if (req.file) {
      if (card.image?.publicId) cloudinary.uploader.destroy(card.image.publicId).catch(() => {});
      card.image = {
        publicId: req.file.filename,
        url:      req.file.path,
        alt:      title || card.title,
      };
    }

    await section.save();
    res.json(section);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update card' });
  }
};

// Delete a card
exports.deleteCard = async (req, res) => {
  try {
    const { id } = req.params;
    const section = await WhyChoose.findOne();
    if (!section) return res.status(404).json({ message: 'Section not found' });

    const card = section.cards.id(id);
    if (!card) return res.status(404).json({ message: 'Card not found' });

    if (card.image?.publicId) cloudinary.uploader.destroy(card.image.publicId).catch(() => {});

    section.cards.pull(id);
    await section.save();
    res.json({ message: 'Card deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete card' });
  }
};

// Reorder cards
exports.reorderCards = async (req, res) => {
  try {
    const { orderedIds } = req.body;
    const section = await WhyChoose.findOne();
    if (!section) return res.status(404).json({ message: 'Section not found' });

    orderedIds.forEach((id, index) => {
      const card = section.cards.id(id);
      if (card) {
        card.order = index;
      }
    });

    await section.save();
    res.json(section);
  } catch (error) {
    res.status(500).json({ message: 'Failed to reorder cards' });
  }
};
