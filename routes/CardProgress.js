const express = require('express');
const router = express.Router(); 
const userAuth = require('../middleware/userAuth');
const CardProgress = require('../models/cardprogress');

router.get('/getAll', userAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    const filter = { user: userId };

    if (req.query.status != null) filter.status = req.query.status;

    const progress = await CardProgress.find(filter).populate('flashcard');
    res.status(200).json({ message: 'Fetched all progress', data: progress });
  } catch (err) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.post('/new', userAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { flashcardId, answer } = req.body;

    let prog = await CardProgress.findOne({
      user: userId,
      flashcard: flashcardId
    });

    if (!prog) {
      prog = new CardProgress({
        user: userId,
        flashcard: flashcardId
      });
    }

    if (answer === 'red') {
      prog.status = 'red';
      prog.correctStreak = 0;
    }
    
    if (answer === 'yellow') {
      prog.correctStreak = Math.max(prog.correctStreak, 1);
      prog.status = 'yellow';
    }
    
    if (answer === 'green') {
      prog.correctStreak = Math.min(prog.correctStreak + 1, 2);
      prog.status = prog.correctStreak >= 2 ? 'green' : 'yellow';
    }    

    prog.updatedAt = new Date();
    await prog.save();

    res.status(200).json({ message: 'Recorded answer', data: prog });
  } catch (err) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.post('/reset/:flashcardId', userAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    const flashcardId = req.params.flashcardId;

    const prog = await CardProgress.findOneAndUpdate(
      { user: userId, flashcard: flashcardId },
      {
        status: 'red',  
        correctStreak: 0,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!prog) {
      return res.status(404).json({ message: 'Progress not found' });
    }

    res.status(200).json({ message: 'Reset progress', data: prog });
  } catch (err) {
    res.status(500).json({
      message: 'Internal Server Error In Resetting Progress'
    });
  }
});

module.exports = router;
