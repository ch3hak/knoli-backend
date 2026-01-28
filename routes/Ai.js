const express = require('express');
const router = express.Router();
const userAuth = require('../middleware/userAuth');
const Deck = require('../models/deck');
const Flashcard = require('../models/flashcard');
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config(); 
const pdf = require('pdf-extraction');

const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 30 * 1024 * 1024 }
}); 

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
let model = null;

async function initModel() {
    if (!process.env.GEMINI_API_KEY) {
        console.error("ERROR: GEMINI_API_KEY is missing from .env");
        return null;
    }

    const modelNames = [
        "gemini-3-flash-preview",
      ];      
    
    for (const name of modelNames) {
        try {
            console.log(`Attempting to connect to ${name}...`);
            const m = genAI.getGenerativeModel({
                model: name,
                generationConfig: {
                  responseMimeType: "application/json",
                  responseSchema: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        front: { type: "string" },
                        back: { type: "string" }
                      },
                      required: ["front", "back"]
                    }
                  }
                }
            });
                           
            const result = await m.generateContent("ping");
            const response = await result.response;
            
            if (response.text()) {
                console.log(`Gemini Model Ready: ${name}`);
                return m;
            }
        } catch (e) {
            console.error(`Model ${name} failed:`, e.message);
            if (e.message.includes("404") && !name.startsWith("models/")) {
                try {
                    const altName = `models/${name}`;
                    const mAlt = genAI.getGenerativeModel({ model: altName });
                    await mAlt.generateContent("ping");
                    return mAlt;
                } catch (innerError) {
                    console.error(`Prefix attempt failed for ${name}`);
                }
            }
        }
    }
    return null;
}
async function extractFileContent(file) {
    const fileExt = file.originalname.split('.').pop().toLowerCase();
    
    try {
        if (fileExt === 'pdf') {
            const pdfData = await pdf(file.buffer);
            return pdfData.text;
            
        } else if (fileExt === 'txt' || fileExt === 'md') {
            return file.buffer.toString('utf8');
        } else if (fileExt === 'doc' || fileExt === 'docx') {
            throw new Error('Word document parsing requires additional setup. Please use PDF or TXT files for now.');
        } else {
            throw new Error('Unsupported file type. Please upload PDF, TXT, or MD files.');
        }
    } catch (error) {
        console.error('Error extracting file content:', error);
        throw error;
    }
}

function calculateFlashcardCount(contentLength) {
    const baseCount = Math.ceil(contentLength / 300);
    
    if (contentLength < 500) return Math.max(3, Math.min(5, baseCount));
    if (contentLength < 2000) return Math.max(5, Math.min(10, baseCount));
    if (contentLength < 5000) return Math.max(8, Math.min(15, baseCount));
    if (contentLength < 10000) return Math.max(12, Math.min(25, baseCount));
    if (contentLength < 20000) return Math.max(20, Math.min(35, baseCount));
    if (contentLength < 50000) return Math.max(25, Math.min(45, baseCount));
    
    return Math.min(50, Math.max(30, baseCount));
}

function chunkContent(content, maxChunkSize = 25000) {
    if (content.length <= maxChunkSize) {
        return [content];
    }
    
    const chunks = [];
    const paragraphs = content.split(/\n\n+/);
    let currentChunk = '';
    
    for (const paragraph of paragraphs) {
        if ((currentChunk + paragraph).length > maxChunkSize && currentChunk.length > 0) {
            chunks.push(currentChunk.trim());
            currentChunk = paragraph;
        } else {
            currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
        }
    }
    
    if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
    }
    
    return chunks;
}

router.post('/generate-flashcards', userAuth, upload.single('syllabusFile'), async (req, res) => {
    try {
        const userId = req.user._id;
        const { deckId } = req.body; 

        if (!model) {
            model = await initModel();
            if (!model) return res.status(500).json({ message: "Gemini API failure. Check API Key." });
        }

        if (!deckId) {
            return res.status(400).json({ message: 'Deck ID is required to add flashcards.' });
        }

        const targetDeck = await Deck.findOne({ _id: deckId, user: userId });
        if (!targetDeck) {
            return res.status(404).json({ message: 'Deck not found or does not belong to the user.' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded.' });
        }

        let fileContent;
        try {
            fileContent = await extractFileContent(req.file);
        } catch (extractError) {
            return res.status(400).json({ message: extractError.message });
        }

        if (fileContent.length < 50) {
            return res.status(400).json({ message: 'Uploaded material is too short to generate meaningful flashcards.' });
        }

        console.log(`Processing document: ${fileContent.length} characters`);

        const totalFlashcardsNeeded = calculateFlashcardCount(fileContent.length);
        console.log(`Target flashcard count: ${totalFlashcardsNeeded}`);

        const contentChunks = chunkContent(fileContent);
        console.log(`Split into ${contentChunks.length} chunks`);

        const flashcardsPerChunk = Math.ceil(totalFlashcardsNeeded / contentChunks.length);

        let allGeneratedFlashcards = [];

        for (let i = 0; i < contentChunks.length; i++) {
            const chunk = contentChunks[i];
            const cardsForThisChunk = i === contentChunks.length - 1 
                ? totalFlashcardsNeeded - allGeneratedFlashcards.length 
                : flashcardsPerChunk;

            console.log(`Processing chunk ${i + 1}/${contentChunks.length}, generating ${cardsForThisChunk} flashcards`);

            const prompt = `You are an expert in creating comprehensive flashcards for learning.
                Based on the following study material, generate EXACTLY ${cardsForThisChunk} flashcards.

                IMPORTANT INSTRUCTIONS:
                - Generate EXACTLY ${cardsForThisChunk} flashcards, no more, no less
                - Cover the most important concepts, definitions, theories, and key points
                - Questions should be clear and specific
                - Answers should be detailed and comprehensive (2-4 sentences when needed)
                - Include examples or explanations in answers where helpful
                - Make sure answers fully explain the concept, not just one-word responses
                - Format as JSON array with 'front' and 'back' properties
                - Return ONLY the JSON array, no markdown code blocks, no explanations
                - No extra text, no explanations
                
                Example Format:
                [
                {"front": "What is photosynthesis and why is it important?", "back": "Photosynthesis is the process by which green plants and some other organisms use sunlight to synthesize foods from carbon dioxide and water. It's important because it produces oxygen as a byproduct, which is essential for most life on Earth, and it forms the base of most food chains."},
                {"front": "Explain the difference between mitosis and meiosis.", "back": "Mitosis is cell division that produces two identical daughter cells with the same number of chromosomes as the parent cell, used for growth and repair. Meiosis produces four non-identical cells with half the chromosomes, used specifically for creating sex cells (gametes) for sexual reproduction."}
                ]

                Study Material (Part ${i + 1} of ${contentChunks.length}):
                ${chunk}`;

            try {
                const result = await model.generateContent(prompt);
                const response = result.response;
                let text = response.text();

                console.log(`Raw AI response preview: ${text.substring(0, 200)}...`);

                let generatedFlashcards;
                try {                    
                    generatedFlashcards = JSON.parse(response.text());

                    if (!Array.isArray(generatedFlashcards) || generatedFlashcards.some(card => !card.front || !card.back)) {
                        throw new Error('AI response is not in the expected flashcard format.');
                    }

                    allGeneratedFlashcards.push(...generatedFlashcards);
                    console.log(`Chunk ${i + 1} generated ${generatedFlashcards.length} flashcards`);

                } catch (parseError) {
                    console.error(`Failed to parse AI response for chunk ${i + 1}:`, parseError);
                    console.error('Raw AI response:', text);
                    continue;
                }

                if (i < contentChunks.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }

            } catch (aiError) {
                console.error(`AI API error for chunk ${i + 1}:`, aiError);
                console.error('Full error:', JSON.stringify(aiError, null, 2));
                continue;
            }
        }

        if (allGeneratedFlashcards.length === 0) {
            return res.status(400).json({ 
                message: 'Failed to generate flashcards. Please check your Gemini API key and try again.',
                hint: 'Make sure your GEMINI_API_KEY is valid in the .env file'
            });
        }

        console.log(`Total flashcards generated: ${allGeneratedFlashcards.length}`);

        const flashcardDocs = allGeneratedFlashcards.map(card => ({
            deck: targetDeck._id,
            front: card.front,
            back: card.back,
        }));

        await Flashcard.insertMany(flashcardDocs);

        res.status(201).json({
            message: `Successfully generated ${flashcardDocs.length} flashcards and added them to deck "${targetDeck.title}"!`,
            flashcardsCount: flashcardDocs.length,
            deckId: targetDeck._id
        });

    } catch (err) {
        console.error('Error generating flashcards with AI:', err);
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'File size exceeds 30MB limit. Please upload a smaller file.' });
        }
        if (err.response && err.response.status) {
            return res.status(err.response.status).json({ 
                message: `AI API Error: ${err.response.data?.message || 'Unknown AI error.'}` 
            });
        }
        res.status(500).json({ message: 'Internal Server Error during AI flashcard generation. Check server logs.' });
    }
});

module.exports = router;