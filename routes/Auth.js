const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Joi = require('joi');
const { signupValidation, loginValidation } = require('../utils/validation');
const userAuth = require("../middleware/userAuth");


router.post('/signup', async (req, res)=> {
    const {error} = signupValidation(req.body);
    if (error) return res.status(411).json({message: error.details[0].message});

    const {firstName, email, password} = req.body;

    try {
        const existingUser = await User.findOne({email: email});
        if (existingUser) return res.status(403).json({message: 'User already registered'});

        const passwordHash = await bcrypt.hash(password, 10);

        const newUser = new User({
            firstName: firstName,
            email: email,
            password: passwordHash
        });

        await newUser.save();

        const token =await jwt.sign({_id:newUser._id},process.env.JWT_KEY,{expiresIn:'1d'});

        res.cookie("token",token,{
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            path:'/',
            maxAge:3600000*24
        })

        const userObj = newUser.toObject();
        delete userObj.password;

        res.status(201).json({message: 'User created successfully'});
    }
    catch (err) {
        console.error("Signup Error:", err);
        return res.status(500).json({message: 'Internal Server Error'});
    }
})

router.post('/login', async (req,res) => {
    const {error} = loginValidation(req.body);
    if (error) return res.status(411).json({message: error.details[0].message});

    const {email,password} = req.body;
    try{
        const user = await User.findOne({email: email});
        if (!user) return res.status(403).json({message: 'Invalid Credentials'});

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) return res.status(403).json({message: 'Invalid Credentials'})

        const token=jwt.sign({_id:user._id},process.env.JWT_KEY,{expiresIn:'1d'});
        res.cookie("token",token,{
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            path:'/',
            maxAge:3600000*24
        })
        const userObj = user.toObject();
        delete userObj.password;

        res.status(200).json({message: 'User logged in successfully', user: userObj})
    }
    catch (err) {
        console.error("Signup Error:", err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/logout', (req, res) => {
    res.cookie("token", null, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/',
        expires: new Date(Date.now())
    });
    res.status(200).json({ message: 'Logged out successfully' });
});

module.exports = router;