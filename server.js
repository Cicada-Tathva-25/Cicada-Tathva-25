require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const passport = require('passport');
const User = require('./models/user_model');
const Log = require('./models/log_model');
const connection = require('./connection');
const passportconfig = require('./passport-config');
const methodOverride = require('method-override');

const ejsLayouts = require("express-ejs-layouts");
const session = require('express-session');

const PORT = 3000;

const CONFIG = {
    SESSION_SECRET: process.env.SESSION_SECRET || 'your-super-secret-session-key-12345'
};
// ============================================
// CONFIGURATION
// ============================================


// Hidden URLs
const PAGE1_URL = "/1G7mNkXq9VyF3Hd0RJplzTwB64sSnMEg";
const PAGE2_URL = "/2cPz6Df1HtVUXYgZQeaO48m5WrbKsLxE";
const PAGE3_URL = "/3jL08ZVyNC3HwRpd7oFMSleKuIAtT1gX";
const PAGE4_URL = "/4Ex0YVhwqB5FGZndtrb3USpoCkm9MjKi";
const PAGE5_URL = "/5T9DQILHz5yAx3uRbPWSj7g2MfKn0coV";
const PAGE6_URL = "/6kEVdZ7qM5saFbRTHvl9iGtgN4WyP1UO";
const PAGE7_URL = "/7X0W8sZTjmknF1Dy7AgLVQcI4uf3rbJO";
const PAGE8_URL = "/8oRwYy03KsCbHUKxt8FnMTiq9zISejl5";

// ============================================
// MIDDLEWARE SETUP
// ============================================

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride('_method'));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(ejsLayouts);
app.set('layout', 'layout');

connection();

app.use(session({
    secret: CONFIG.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

// ============================================
// BASIC ROUTES
// ============================================

app.get('/', (req, res) => {
    res.render('../views_rem/home', { user: req.user, layout: '../views_rem/home' });
});

app.get('/login', checkNotAuthenticated, (req, res) => {
    res.render('../views_rem/login', { layout: '../views_rem/login' });
});

app.get('/register', checkNotAuthenticated, (req, res) => {
    res.render('../views_rem/register', { layout: '../views_rem/register' });
});

// ============================================
// ADMIN ROUTE
// ============================================

app.get('/admin', async (req, res) => {
    try {
        const logs = await Log.find(
            {}, 
            { _id: 0, email: 1, start: 1, level1: 1, level2: 1, level3: 1, level4: 1, level5: 1, level6: 1, level7: 1, level8: 1 },
            { lean: true }
        );
        
       const res_arr = logs.map(log => {
    let lastTimestamp = null;
    let level = 0;
    
    // Find the highest completed level and its timestamp
    for (let i = 1; i <= 8; i++) {
        const levelKey = `level${i}`;
        if (log[levelKey]) {
            lastTimestamp = log[levelKey];
            level = i;
        }
    }
    
    // Calculate time taken only if at least one level is completed
    let timeTaken = 0;
    if (lastTimestamp && log.start) {
        timeTaken = new Date(lastTimestamp).getTime() - new Date(log.start).getTime();
    }
    
    return {
        mail: log.email,
        time: timeTaken,
        level: level
    };
});
        res_arr.sort((a, b) => {
            if (a.level !== b.level) {
                return b.level - a.level;
            }
            return a.time - b.time;
        });
        
        res.render('../views_rem/admin', { res_arr, layout: '../views_rem/admin' });
    } catch (err) {
        console.error('Admin route error:', err);
        res.status(500).send('Error loading admin page');
    }
});

// ============================================
// AUTHENTICATION ROUTES
// ============================================

app.post('/register', checkNotAuthenticated, async (req, res) => {
    try {
        const user = new User({
            name: req.body.name,
            email: req.body.email,
            password: req.body.password
        });
        await user.save();
        console.log('User registered:', req.body.email);
        res.redirect('/login');
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).send('Error registering user');
    }
});

app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/profile',
    failureRedirect: '/login'
}));

app.delete('/logout', (req, res, next) => {
    req.logout(function (err) {
        if (err) {
            return next(err);
        }
        res.redirect('/login');
    });
});

// ============================================
// PROFILE ROUTE
// ============================================

app.get('/profile', checkAuthenticated, (req, res) => {
    console.log('Profile accessed by:', req.user.email);
    res.render('profile', { 
        user: req.user,
        layout: 'layout'
    });
});

app.post('/profile', checkAuthenticated, async (req, res) => {
    try {
        let logfind = await Log.findOne({ email: req.user.email });
        
        if (!logfind) {
            const log = new Log({
                email: req.user.email,
                start: new Date()
            });
            await log.save();
            console.log('Log created for:', req.user.email);
        }
        
        res.redirect(PAGE1_URL);
    } catch (err) {
        console.error('Profile POST error:', err);
        res.status(500).send('Error creating log entry');
    }
});

// ============================================
// LEVEL GET ROUTES
// ============================================

// Page 1 - Payment Challenge
app.get(PAGE1_URL, checkAuthenticated, (req, res) => {
    console.log('Level 1 accessed by:', req.user.email);
    res.render('page1', { 
        user: req.user,
        layout: 'layout',
        error: null
    });
});

// Page 2 - Prime Numbers
app.get(PAGE2_URL, checkAuthenticated, (req, res) => {
    console.log('Level 2 accessed by:', req.user.email);
    res.render('page2', { 
        user: req.user, 
        layout: 'layout',
        error: null
    });
});

// Page 3 - ZIP Archive Challenge
app.get(PAGE3_URL, checkAuthenticated, (req, res) => {
    console.log('Level 3 accessed by:', req.user.email);
    res.render('page3', { 
        user: req.user, 
        layout: 'layout',
        error: null
    });
});

// Page 4 - Time/Hash Puzzle
app.get(PAGE4_URL, checkAuthenticated, (req, res) => {
    console.log('Level 4 accessed by:', req.user.email);
    res.render('page4', { 
        user: req.user,
        layout: 'layout',
        error: null
    });
});

// Page 5 - Exposure Challenge
app.get(PAGE5_URL, checkAuthenticated, (req, res) => {
    console.log('Level 5 accessed by:', req.user.email);
    res.render('page5', {
        user: req.user,
        layout: 'layout',
        error: null
    });
});



// Page 6 - Audio Challenge
app.get(PAGE6_URL, checkAuthenticated, (req, res) => {
    console.log('Level 6 accessed by:', req.user.email);
    res.render('page6', {
        user: req.user,
        layout: 'layout',
        error: null
    });
});

// Page 7 - File Download Challenge
app.get(PAGE7_URL, checkAuthenticated, (req, res) => {
    console.log('Level 7 accessed by:', req.user.email);
    res.render('page7', {
        user: req.user,
        layout: 'layout',
        error: null
    });
});

// Page 8 - Final Image Puzzle
app.get(PAGE8_URL, checkAuthenticated, (req, res) => {
    console.log('Level 8 accessed by:', req.user.email);
    res.render('page8', {
        user: req.user,
        layout: 'layout',
        error: null
    });
});

// ============================================
// LEVEL POST ROUTES
// ============================================

// Helper function to handle standard level completion
async function handleLevelCompletion(req, res, levelNum, answerField, correctAnswer, currentPage, nextPage, errorMessage) {
    try {
        const userAnswer = req.body[answerField];
        const isCorrect = userAnswer === correctAnswer || 
                         userAnswer?.toLowerCase().trim() === correctAnswer?.toLowerCase().trim();
        
        if (isCorrect) {
            const logfind = await Log.findOne({ email: req.user.email });
            const levelKey = `level${levelNum}`;
            
            if (!logfind || !logfind[levelKey]) {
                await Log.findOneAndUpdate(
                    { email: req.user.email }, 
                    { [levelKey]: new Date() }, 
                    { new: true }
                );
                console.log(`Level ${levelNum} completed by ${req.user.email}`);
            }
            
            if (levelNum === 8) {
                res.render('profile', { user: req.user, sts: 'Completed', layout: 'layout' });
            } else {
                res.redirect(nextPage);
            }
        } else {
            res.render(currentPage, {
                user: req.user,
                layout: 'layout',
                error: errorMessage
            });
        }
    } catch (err) {
        console.error(`Level ${levelNum} error:`, err);
        res.render(currentPage, {
            user: req.user,
            layout: 'layout',
            error: 'Error updating progress'
        });
    }
}

// Level 1 - Payment Challenge
app.post(PAGE1_URL, (req, res) => {
    handleLevelCompletion(
        req, res, 1, 'pay', process.env.KEY_1, 
        'page1', PAGE2_URL, 'Payment failed! Try again.'
    );
});

// Level 2 - Prime Numbers
app.post(PAGE2_URL, (req, res) => {
    handleLevelCompletion(
        req, res, 2, 'key2',process.env.KEY_2,
        'page2', PAGE3_URL, 'Wrong answer, try again!'
    );
});

// Level 3 - ZIP Archive Challenge
app.post(PAGE3_URL, (req, res) => {
    handleLevelCompletion(
        req, res, 3, 'key3', process.env.KEY_3,
        'page3', PAGE4_URL, 'Wrong answer, try again!'
    );
});

// Level 4 - Time/Hash Puzzle
app.post(PAGE4_URL, async (req, res) => {
    try {
        const { hrs, min, sec } = req.body;
        const userHours = parseInt(hrs, 10);
        const userMinutes = parseInt(min, 10);
        const userSeconds = parseInt(sec, 10);
        
        const correctHours =  process.env.KEY_4_hr;
        const correctMinutes = process.env.KEY_4_min;
        const correctSeconds = process.env.KEY_4_sec;
        if (userHours === parseInt(correctHours, 10) && userMinutes === parseInt(correctMinutes, 10) && userSeconds === parseInt(correctSeconds, 10)) {        
            const logfind = await Log.findOne({ email: req.user.email });
            
            if (!logfind || !logfind.level4) {
                await Log.findOneAndUpdate(
                    { email: req.user.email }, 
                    { level4: new Date() }, 
                    { new: true }
                );
                console.log(`Level 4 completed by ${req.user.email}`);
            }
            
            res.redirect(PAGE5_URL);
        } else {
            res.render('page4', {
                user: req.user,
                layout: 'layout',
                error: 'Incorrect time! Try again.'
            });
        }
    } catch (err) {
        console.error('Level 4 error:', err);
        res.render('page4', {
            user: req.user,
            layout: 'layout',
            error: 'Error updating progress'
        });
    }
});

// Level 5 - Exposure Challenge
app.post(PAGE5_URL, (req, res) => {
    handleLevelCompletion(
        req, res, 5, 'key5', process.env.KEY_5,
        'page5', PAGE6_URL, 'Wrong answer, try again!'
    );
});

// Level 6 - Audio Challenge
app.post(PAGE6_URL, (req, res) => {
    handleLevelCompletion(
        req, res, 6, 'key6', process.env.KEY_6,
        'page6', PAGE7_URL, 'Incorrect answer, listen carefully again!'
    );
});

// Level 7 - File Download Challenge
app.post(PAGE7_URL, (req, res) => {
    handleLevelCompletion(
        req, res, 7, 'key7', process.env.KEY_7,
        'page7', PAGE8_URL, 'Wrong answer, try again!'
    );
});

// Level 8 - Final Image Puzzle
app.post(PAGE8_URL, (req, res) => {
    handleLevelCompletion(
        req, res, 8, 'key8', process.env.KEY_8,
        'page8', null, 'Wrong answer, try again!'
    );
});

// ============================================
// MIDDLEWARE
// ============================================

function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
}

function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect('/profile');
    }
    next();
}

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});