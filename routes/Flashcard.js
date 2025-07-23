const express = require('express');
const router = express.Router();
const userAuth =require('../middleware/userAuth');
const Deck = require('../models/deck');
const Flashcard = require('../models/flashcard');

router.get('/getAll/:deckId', userAuth, async (req, res) => {
    try {
      const userId = req.user._id;
      const deckId = req.params.deckId;
  
      const deck = await Deck.findOne({ _id: deckId, owner: userId });
      if (!deck) return res.status(404).json({ message: 'Deck not found' });
  
      const cards = await Flashcard.find({ deck: deckId });
      res.status(200).json({ message: 'Fetched all flashcards', data: cards });
    } catch (err) {
      res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.post('/new/:deckId', userAuth, async (req, res) => {
    try {
      const userId = req.user._id;
      const deckId = req.params.deckId;
      const { front, back, media = {}, tags = [] } = req.body;
  
      const deck = await Deck.findOne({ _id: deckId, owner: userId });
      if (!deck) return res.status(404).json({ message: 'Deck not found' });
  
      const card = await Flashcard.create({ deck: deckId, front, back, media, tags });
      res.status(201).json({ message: 'Created new flashcard', data: card });
    } catch (err) {
      res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.patch('/update/:id', userAuth, async (req, res) => {
    try {
      const cardId = req.params.id;
      const userId = req.user._id;
      const { front, back, media, tags } = req.body;
  
      const card = await Flashcard.findById(cardId).populate('deck');
      if (!card || card.deck.owner.toString() !== userId.toString()) {
        return res.status(404).json({ message: 'Flashcard not found' });
      }
  
      card.front = front ?? card.front;
      card.back  = back  ?? card.back;
      card.media = media ?? card.media;
      card.tags  = tags  ?? card.tags;
      await card.save();
  
      res.status(200).json({ message: 'Updated flashcard', data: card });
    } catch (err) {
      res.status(500).json({ message: 'Internal Server Error In Updating Flashcard' });
    }
});

router.delete('/delete/:id', userAuth, async (req, res) => {
    try {
      const cardId = req.params.id;
      const userId = req.user._id;
      const card = await Flashcard.findById(cardId).populate('deck');
      if (!card || card.deck.owner.toString() !== userId.toString()) {
        return res.status(404).json({ message: 'Flashcard not found' });
      }
  
      await card.remove();
      res.status(200).json({ message: 'Deleted flashcard', data: card });
    } catch (err) {
      res.status(500).json({ message: 'Internal Server Error In Deleting Flashcard' });
    }
});

module.exports=router;