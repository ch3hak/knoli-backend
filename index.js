const express = require('express');
const app = express();
const {connectDb} = require('./utils/database'); // Assuming utils.js/database exports connectDb
const cors = require("cors");
const cookieParser = require('cookie-parser');
require('dotenv').config(); 

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
}));

app.use(express.json()); 
app.use(cookieParser()); 

const AuthRouter = require('./routes/Auth');
const FlashcardRouter = require('./routes/Flashcard');
const DeckRouter = require('./routes/Deck');
const CardProgressRouter = require('./routes/CardProgress');
const ProfileRouter = require('./routes/Profile');
const AiRouter = require('./routes/Ai'); 

app.use('/api/auth', AuthRouter);
app.use('/api/flashcard', FlashcardRouter);
app.use('/api/deck', DeckRouter);
app.use('/api/cardprogress', CardProgressRouter);
app.use('/api/profile', ProfileRouter);
app.use('/api/ai', AiRouter);

connectDb().then(()=>{
    console.log("Connected to database")
}).catch((error)=>{ 
    console.error("Error while connecting to database:", error) 
})

module.exports=app;

if(require.main===module){
    app.listen(5001,()=>console.log("Server is running on port 5001"))
}