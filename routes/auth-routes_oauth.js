const router=require('express').Router();


//auth login
router.get('/login',(req,res)=>{
    res.render('login');
});

//auth google
router.get('/google',(req,res)=>{

    res.send("Logging in with google");
});

//auth logout
router.get('/logout',(req,res)=>{
    res.send("Logging out");
});

module.exports=router;