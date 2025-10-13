const express=require('express');
const app=express();
const passport=require('passport');
const User=require('./models/user_model');
const Log=require('./models/log_model');
const connection=require('./connection');
//const logdb=require('./log_dbsetup');
const passportconfig=require('./passport-config');
const methodOverride=require('method-override');
var bodyParser = require('body-parser');
var localStorage = require('web-storage')().localStorage;
require('dotenv').config();

var ejsLayouts = require("express-ejs-layouts");
//const authRoutes=require('./routes/auth-routes_oauth')
app.use(bodyParser.urlencoded({ extended: false }));
const session=require('express-session');
app.use(express.static('public'));

connection();
app.use(express.urlencoded({extended:false}));
app.use(methodOverride('_method'));
app.set('view engine','ejs');
app.use(ejsLayouts);
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false
  }));

app.use(passport.initialize());
app.use(passport.session());


app.get('/admin',async (req,res)=>{
  var sel = await Log.find({},{_id:0,email:1,start:1,level1:1,level2:1,level3:1,level4:1,level5:1,level6:1,level7:1,level8:1},{lean: true});
  let i=0,t_end;
  var res_arr=[];
  while (i < sel.length){
    let one=sel[i],lvl=0;

    for(var el in one){


      console.log("Key:",el);
      console.log("Vlaue:",one[el]);
      t_end=one[el];
      console.log("End:key",el);
      console.log("End:",t_end);
      lvl++;
      // break;
    }
    console.log(i," ",one);
    let t_st=sel[i]["start"].getTime();
    res_arr[i]={mail:one["email"],time:t_end-t_st,level:lvl-2};
    //console.log(t_end-t_st);
    i++;
}
res_arr.sort((a, b) => {
  if (a.level < b.level) {
    return 1;
} else if (a.level > b.level) {
    return -1;
} else {
    if (a.time < b.time) {
        return -1;
    } else if (a.time > b.time) {
        return 1;
    } else {
        return 0;
    }
}
});

console.log(res_arr);
res.render('../views_rem/admin',{res_arr,layout:'../views_rem/admin'});
})

app.get('/',(req,res)=>{
    res.render('../views_rem/home',{user:req.user,layout:'../views_rem/home'});
})
app.get('/login',checkNotAuthenticated,(req,res)=>{
    res.render('../views_rem/login',{layout:'../views_rem/login'});
})
app.get('/register',checkNotAuthenticated,(req,res)=>{
    res.render('../views_rem/register',{layout:'../views_rem/register'});
})

app.get('/profile',checkAuthenticated,(req,res)=>{

  const myDate1= new Date();

  console.log("Login of " + myDate1.toLocaleString(),req.user.email);
    //console.log(req.user);
  res.render('profile',{user:req.user});

})




// Post
app.post('/register',checkNotAuthenticated,(req,res)=>{

    var user=new User({
        name:req.body.name,
        email:req.body.email,
        password:req.body.password
    })
    user.save().then(()=>{
        console.log('User saved');
        res.redirect('/login');
    })
})
app.post('/login',checkNotAuthenticated,passport.authenticate('local',{
    successRedirect: '/profile',
    failureRedirect: '/login'
  }))

app.post('/profile',async (req,res)=>{
  //console.log(req.user);
  var date1=new Date();

  var log=new Log({
    email:req.user.email,
    start:date1
})
let logfind=await Log.findOne({email:req.user.email});
 console.log("Found one",logfind);

 if(!logfind){
 await log.save().then(()=>{
    console.log('Email created');
    res.redirect('/1PVKQGGbqvr66wRT22Yf1NpCqc9kyE');
}).catch((err) => {
  console.log("err here"+err);
  res.send(err.message);
});
}
else{
  console.log(req.user.email,"Exists");
  res.redirect('/1PVKQGGbqvr66wRT22Yf1NpCqc9kyE');
}
});

//Logout
app.delete('/logout', (req, res) => {
    req.logout(function(err) {
        if (err) {
          return next(err);
          }
        res.redirect('/login');
      });
  });

function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next()
    }

    res.redirect('/login')
  }

  function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return res.redirect('/profile')
    }
    next()
  }

app.listen(3000,()=>{
    console.log("Server listening on port 3000");
})


