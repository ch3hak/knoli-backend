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
        const deck = await Deck.create({ title, description, isPublic, tags, userId:userId });
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
        { _id: deckId, userId: userId },
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
  
      const deleted = await Deck.findOneAndDelete({ _id: deckId, userId: userId });
      if (!deleted) return res.status(404).json({ message: 'Deck not found' });
  
      await Flashcard.deleteMany({ deck: deckId });
      res.status(200).json({ message: 'Deleted deck', data: deleted });
    } catch (err) {
      res.status(500).json({ message: 'Internal Server Error In Deleting Deck' });
    }
});

module.exports=router;