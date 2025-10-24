require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const passport = require('passport');
const User = require('./models/user_model');
const Log = require('./models/log_model');
const connection = require('./connection');
const methodOverride = require('method-override');
require('./passport-config');

const ejsLayouts = require("express-ejs-layouts");
const session = require('express-session');

const PORT = 3000;

const CONFIG = {
    SESSION_SECRET: process.env.SESSION_SECRET || 'your-super-secret-session-key-12345'
};

const PAGE1_URL = "/1G7mNkXq9VyF3Hd0RJplzTwB64sSnMEg";
const PAGE2_URL = "/2cPz6Df1HtVUXYgZQeaO48m5WrbKsLxE";
const PAGE3_URL = "/3jL08ZVyNC3HwRpd7oFMSleKuIAtT1gX";
const PAGE4_URL = "/4Ex0YVhwqB5FGZndtrb3USpoCkm9MjKi";
const PAGE5_URL = "/5T9DQILHz5yAx3uRbPWSj7g2MfKn0coV";
const PAGE6_URL = "/6kEVdZ7qM5saFbRTHvl9iGtgN4WyP1UO";
const PAGE7_URL = "/7X0W8sZTjmknF1Dy7AgLVQcI4uf3rbJO";
const PAGE8_URL = "/274877906944";

const LEVEL_URLS = {
    1: PAGE1_URL,
    2: PAGE2_URL,
    3: PAGE3_URL,
    4: PAGE4_URL,
    5: PAGE5_URL,
    6: PAGE6_URL,
    7: PAGE7_URL,
    8: PAGE8_URL
};

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

app.get('/', (req, res) => {
    res.render('../views_rem/home', { user: req.user, layout: '../views_rem/home' });
});

app.get('/login', checkNotAuthenticated, (req, res) => {
    res.render('../views_rem/login', { layout: '../views_rem/login' });
});

app.get('/register', checkNotAuthenticated, (req, res) => {
    res.render('../views_rem/register', { layout: '../views_rem/register' });
});

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
            
            for (let i = 1; i <= 8; i++) {
                const levelKey = `level${i}`;
                if (log[levelKey]) {
                    lastTimestamp = log[levelKey];
                    level = i;
                }
            }
            
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
// IMPROVED LEVEL ACCESS MIDDLEWARE
// ============================================

async function getCurrentLevel(email) {
    try {
        const log = await Log.findOne({ email });
        if (!log) return 0;
        
        for (let i = 1; i <= 8; i++) {
            if (!log[`level${i}`]) {
                return i - 1; // Last completed level
            }
        }
        return 8; // All levels completed
    } catch (err) {
        console.error('Error getting current level:', err);
        return 0;
    }
}

function checkLevelAccess(requiredLevel) {
    return async (req, res, next) => {
        try {
            const currentLevel = await getCurrentLevel(req.user.email);
            
            // Allow access only to the next level user should be on
            if (requiredLevel <= currentLevel + 1) {
                return next();
            }
            
            // Redirect to the level they should be on
            const redirectLevel = Math.min(currentLevel + 1, 8);
            res.redirect(LEVEL_URLS[redirectLevel]);
            
        } catch (err) {
            console.error('Level access check error:', err);
            res.redirect(PAGE1_URL);
        }
    };
}

// ============================================
// LEVEL GET ROUTES WITH PROPER PROTECTION
// ============================================

app.get(PAGE1_URL, checkAuthenticated, checkLevelAccess(1), (req, res) => {
    console.log('Level 1 accessed by:', req.user.email);
    res.render('page1', { 
        user: req.user,
        layout: 'layout',
        error: null
    });
});

app.get(PAGE2_URL, checkAuthenticated, checkLevelAccess(2), (req, res) => {
    console.log('Level 2 accessed by:', req.user.email);
    res.render('page2', { 
        user: req.user, 
        layout: 'layout',
        error: null
    });
});

app.get(PAGE3_URL, checkAuthenticated, checkLevelAccess(3), (req, res) => {
    console.log('Level 3 accessed by:', req.user.email);
    res.render('page3', { 
        user: req.user, 
        layout: 'layout',
        error: null
    });
});

app.get(PAGE4_URL, checkAuthenticated, checkLevelAccess(4), (req, res) => {
    console.log('Level 4 accessed by:', req.user.email);
    res.render('page4', { 
        user: req.user,
        layout: 'layout',
        error: null
    });
});

app.get(PAGE5_URL, checkAuthenticated, checkLevelAccess(5), (req, res) => {
    console.log('Level 5 accessed by:', req.user.email);
    res.render('page5', {
        user: req.user,
        layout: 'layout',
        error: null
    });
});

app.get(PAGE6_URL, checkAuthenticated, checkLevelAccess(6), (req, res) => {
    console.log('Level 6 accessed by:', req.user.email);
    res.render('page6', {
        user: req.user,
        layout: 'layout',
        error: null
    });
});

// Level 7 - Special URL manipulation level
app.get(PAGE7_URL, checkAuthenticated, checkLevelAccess(7), (req, res) => {
    console.log('Level 7 accessed by:', req.user.email);
    res.render('page7', {
        user: req.user,
        layout: 'layout',
        error: null
    });
});

// Level 8 - Auto-completes Level 7 when accessed via correct URL
app.get(PAGE8_URL, checkAuthenticated, async (req, res) => {
    try {
        console.log('Level 8 accessed by:', req.user.email);
        
        const currentLevel = await getCurrentLevel(req.user.email);
        
        // If user hasn't completed Level 7 but accessed Level 8 URL,
        // this means they successfully solved Level 7 via URL manipulation
        if (currentLevel === 6) {
            await Log.findOneAndUpdate(
                { email: req.user.email }, 
                { level7: new Date() }, 
                { new: true }
            );
            console.log(`Level 7 completed via URL manipulation by ${req.user.email}`);
        }
        
        // Now check if they should be allowed to access Level 8
        const updatedLevel = await getCurrentLevel(req.user.email);
        if (updatedLevel < 7) {
            // If they still haven't completed Level 7, redirect them back
            return res.redirect(PAGE7_URL);
        }
        
        res.render('page8', {
            user: req.user,
            layout: 'layout',
            error: null
        });
    } catch (err) {
        console.error('Level 8 GET error:', err);
        res.redirect(PAGE1_URL);
    }
});

// ============================================
// LEVEL POST ROUTES
// ============================================

async function handleLevelCompletion(req, res, levelNum, answerField, correctAnswer, currentPage, nextPage, errorMessage) {
    try {
        const userAnswer = req.body[answerField];
        const isCorrect = userAnswer === correctAnswer || 
                         userAnswer?.toLowerCase().trim() === correctAnswer?.toLowerCase().trim();
        
        if (isCorrect) {
            const logfind = await Log.findOne({ email: req.user.email });
            const levelKey = `level${levelNum}`;
            
            // Only update if not already completed
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

app.post(PAGE1_URL, (req, res) => {
    handleLevelCompletion(
        req, res, 1, 'pay', process.env.KEY_1, 
        'page1', PAGE2_URL, 'Payment failed! Try again.'
    );
});

app.post(PAGE2_URL, (req, res) => {
    handleLevelCompletion(
        req, res, 2, 'key2', process.env.KEY_2,
        'page2', PAGE3_URL, 'Wrong answer, try again!'
    );
});

app.post(PAGE3_URL, (req, res) => {
    handleLevelCompletion(
        req, res, 3, 'key3', process.env.KEY_3,
        'page3', PAGE4_URL, 'Wrong answer, try again!'
    );
});

app.post(PAGE4_URL, async (req, res) => {
    try {
        const { hrs, min, sec } = req.body;
        const userHours = parseInt(hrs, 10);
        const userMinutes = parseInt(min, 10);
        const userSeconds = parseInt(sec, 10);
        
        const correctHours = process.env.KEY_4_hr;
        const correctMinutes = process.env.KEY_4_min;
        const correctSeconds = process.env.KEY_4_sec;
        
        if (userHours === parseInt(correctHours, 10) && 
            userMinutes === parseInt(correctMinutes, 10) && 
            userSeconds === parseInt(correctSeconds, 10)) {
            
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

app.post(PAGE5_URL, (req, res) => {
    handleLevelCompletion(
        req, res, 5, 'key5', process.env.KEY_5,
        'page5', PAGE6_URL, 'Wrong answer, try again!'
    );
});

app.post(PAGE6_URL, (req, res) => {
    handleLevelCompletion(
        req, res, 6, 'key6', process.env.KEY_6,
        'page6', PAGE7_URL, 'Incorrect answer, listen carefully again!'
    );
});

// Level 7 POST route - Since Level 7 is solved via URL manipulation, 
// redirect back to Level 7 page if someone tries to POST
app.post(PAGE7_URL, async (req, res) => {
    res.redirect(PAGE7_URL);
});

app.post(PAGE8_URL, (req, res) => {
    handleLevelCompletion(
        req, res, 8, 'key8', process.env.KEY_8,
        'page8', null, 'Wrong answer, try again!'
    );
});

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

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});