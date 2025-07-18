const express = require('express');
const app = express();
const {connectDb} = require('./utils.js/database');
const cors = require("cors");
const AuthRouter = require('./routes/Auth');
const FlashcardRouter = require('./routes/Flashcard');
const DeckRouter = require('./routes/Deck');
const CardProgressRouter = require('./routes/CardProgress');
const ProfileRouter = require('./routes/Profile');

app.use(express.json);

app.use('api/auth', AuthRouter)
app.use('api/flashcard', FlashcardRouter)
app.use('api/deck', DeckRouter)
app.use('api/cardprogress', CardProgressRouter)
app.use('api/profile', ProfileRouter)

connectDb().then(()=>{
    console.log("Connected to database")
}).catch(()=>{
    console.log("Error while connecting to database")
})

module.exports=app;

if(require.main===module){
    app.listen(6000,()=>console.log("Server is running on port 6000"))
}