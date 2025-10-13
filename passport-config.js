const localStrategy=require('passport-local').Strategy;
const mongoose=require('mongoose');
const passport=require('passport');
const User=require('./models/user_model');

passport.use(new localStrategy({usernameField:'email'},
    function(email, password, done) {
      const user=User.findOne({ email: email }).then((user)=>{
        //if (err) { return done(err); }
        if (!user) { return done(null, false,{message:"Wrong credentials"}); }
        if (password==user.password) { return done(null, user); }
        else return done(null, false,{message:"Wrong pass"});
      });
    }
  ));

  passport.serializeUser((user,done)=>done(null,user.id));
  passport.deserializeUser((id,done)=>{
    User.findById(id)
      .then((user) => {
        done(null, user);
      })
      .catch((err) => done(err));
  });