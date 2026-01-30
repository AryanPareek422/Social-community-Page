const express = require('express');
const User = require('../models/User');

const router = express.Router();

// GET /user/  -> return all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
//Get user by email id
router.get('/:email', async (req,res) => {
  const userEmail=req.params.email;
  try {
    const users=await User.findOne({email:userEmail});
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// create a new user
router.post('/',async(req,res)=>{
    try {
        const data ={
            name:req.body.name,
            email:req.body.email,
            image:req.body.image,
        }
        const userRef=await User.findOneAndUpdate(data,data,{
            new:true,
            upsert:true,
            runValidators:true,
        });
        const userRes =await userRef.save();
        res.status(201).json(userRes);
    } catch (error) {
        res.status(500).json({ message: error.message });
  
        
    }
})

module.exports = router;