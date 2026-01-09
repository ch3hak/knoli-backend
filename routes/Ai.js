const express = require('express');
const router = express.Router();
const userAuth = require('../middleware/userAuth');
const Deck = require('../models/deck');
const Flashcard = require('../models/flashcard');
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config(); 

const upload = multer({ storage: multer.memoryStorage() }); 

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

router.post('/generate-flashcards', userAuth, upload.single('syllabusFile'), async (req, res) => {
    try {
        const userId = req.user._id;
        const { deckId } = req.body; 

        if (!deckId) {
            return res.status(400).json({ message: 'Deck ID is required to add flashcards.' });
        }

        const targetDeck = await Deck.findOne({ _id: deckId, userId: userId });
        if (!targetDeck) {
            return res.status(404).json({ message: 'Deck not found or does not belong to the user.' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded.' });
        }

        const fileContent = req.file.buffer.toString('utf8'); // Assuming text file (PDFs/images need OCR)

        if (fileContent.length < 50) {
            return res.status(400).json({ message: 'Uploaded material is too short to generate meaningful flashcards.' });
        }
        if (fileContent.length > 10000) { 
            return res.status(400).json({ message: 'Uploaded material is too large. Please upload smaller chunks.' });
        }

        const prompt = `You are an expert in creating flashcards for learning.
        Based on the following study material, generate 5-10 flashcards.
        Each flashcard should have a clear "front" (question or term) and a concise "back" (answer or definition).
        Format the output as a JSON array of objects, where each object has 'front' and 'back' properties.

        Example Format:
        [
          {"front": "What is the capital of France?", "back": "Paris"},
          {"front": "Define photosynthesis.", "back": "The process by which green plants and some other organisms use sunlight to synthesize foods with the help of chlorophyll."},
          ...
        ]

        Study Material:
        ${fileContent}`;

        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        let generatedFlashcards;
        try {
            const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
            if (jsonMatch && jsonMatch[1]) {
                generatedFlashcards = JSON.parse(jsonMatch[1]);
            } else {
                generatedFlashcards = JSON.parse(text);
            }

            if (!Array.isArray(generatedFlashcards) || generatedFlashcards.some(card => !card.front || !card.back)) {
                throw new Error('AI response is not in the expected flashcard format.');
            }
        } catch (parseError) {
            console.error('Failed to parse AI response:', parseError);
            console.error('Raw AI response:', text);
            return res.status(500).json({ message: 'Failed to parse flashcards from AI response. Please try again or refine your input.', rawResponse: text });
        }

        if (generatedFlashcards.length === 0) {
            return res.status(400).json({ message: 'AI did not generate any flashcards from the provided material.' });
        }

        const flashcardDocs = generatedFlashcards.map(card => ({
            deck: targetDeck._id,
            front: card.front,
            back: card.back,
        }));

        await Flashcard.insertMany(flashcardDocs);

        res.status(201).json({
            message: `Flashcards successfully added to deck "${targetDeck.title}"!`,
            deckId: targetDeck._id,
            flashcardsCount: flashcardDocs.length,
            generatedCards: generatedFlashcards
        });

    } catch (err) {
        console.error('Error generating flashcards with AI:', err);
        if (err.response && err.response.status) {
            return res.status(err.response.status).json({ message: `AI API Error: ${err.response.data.message || 'Unknown AI error.'}` });
        }
        res.status(500).json({ message: 'Internal Server Error during AI flashcard generation.' });
    }
});

module.exports = router;