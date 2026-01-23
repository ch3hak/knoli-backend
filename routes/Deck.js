const express = require('express');
const router = express.Router(); 
const userAuth =require('../middleware/userAuth');
const Deck = require('../models/deck');

router.get('/getAll', userAuth, async (req, res) => {
    try {
        const userId=req.user._id
        const deck = await Deck.find({user: userId});
        res.status(200).json({ message: 'Fetched all decks', data: deck });
    }
    catch (err) {
        res.status(500).json({message:'Internal server error'})
    }
})

router.post('/new', userAuth, async(req, res) => {
    try{
        const userId=req.user._id
        const { title, description, isPublic, tags } = req.body;
        const deck = await Deck.create({ title, description, isPublic, tags, user:userId });
        res.status(201).json({ message: 'Created new deck', data: deck });
    }
    catch (err) {
        res.status(500).json({message:'Internal server error'})
    }
})

router.patch('/update/:id', userAuth, async (req, res) => {
    try {
      const deckId = req.params.id;
      const userId = req.user._id;
      const { title, description, isPublic, tags } = req.body;
  
      const updated = await Deck.findOneAndUpdate(
        { _id: deckId, user: userId },
        { $set: { title, description, isPublic, tags } },
        { new: true }
      );
      if (!updated) return res.status(404).json({ message: 'Deck not found' });
  
      res.status(200).json({ message: 'Updated deck', data: updated });
    } catch (err) {
      res.status(500).json({ message: 'Internal Server Error In Updating Deck' });
    }
});

router.delete('/delete/:id', userAuth, async (req, res) => {
    try {
      const deckId = req.params.id;
      const userId = req.user._id;
  
      const deleted = await Deck.findOneAndDelete({ _id: deckId, user: userId });
      if (!deleted) return res.status(404).json({ message: 'Deck not found' });
  
      await Flashcard.deleteMany({ deck: deckId });
      res.status(200).json({ message: 'Deleted deck', data: deleted });
    } catch (err) {
      res.status(500).json({ message: 'Internal Server Error In Deleting Deck' });
    }
});

// GET deck XP
router.get('/xp/:id', userAuth, async (req, res) => {
  try {
      const deckId = req.params.id;
      const userId = req.user._id;
      
      const deck = await Deck.findOne({ _id: deckId, user: userId });
      
      if (!deck) {
          return res.status(404).json({ message: 'Deck not found' });
      }
      
      res.status(200).json({
          data: {
              level: deck.level || 1,
              xp: deck.xp || 0,
              xpToNextLevel: deck.xpToNextLevel || 100
          }
      });
  } catch (err) {
      res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/xp/:id', userAuth, async (req, res) => {
  try {
      const deckId = req.params.id;
      const userId = req.user._id;
      const { xpToAdd } = req.body;
      
      const deck = await Deck.findOne({ _id: deckId, user: userId });
      
      if (!deck) {
          return res.status(404).json({ message: 'Deck not found' });
      }
      
      let currentXP = (deck.xp || 0) + xpToAdd;
      let currentLevel = deck.level || 1;
      let xpToNext = deck.xpToNextLevel || 100;
      let leveledUp = false;
      
      while (currentXP >= xpToNext) {
          currentXP -= xpToNext;
          currentLevel++;
          xpToNext = Math.floor(xpToNext * 1.5);
          leveledUp = true;
      }
      
      deck.level = currentLevel;
      deck.xp = currentXP;
      deck.xpToNextLevel = xpToNext;
      await deck.save();
      
      res.status(200).json({
          data: {
              level: currentLevel,
              xp: currentXP,
              xpToNextLevel: xpToNext,
              leveledUp
          }
      });
  } catch (err) {
      res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;