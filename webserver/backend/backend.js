// Third party imports
const express = require('express');
const bodyParser = require('body-parser');
const logger = require('morgan');
const cors = require('cors');
const EventEmitter = require('events');

// Local imports
const { getAllRules, deleteAllRules, setRules, streamConnect } = require('./twitter-funcs.js');
const { User } = require('./user.js');

// SERVER DATA
const MAX_TWEETS = 15;
const USER_TIMEOUT_MILLIS = 600000; // 10 minutes
/** @type {User[]} */
let users = [];

// Set listeners to kill crashed or timed out users
const userKiller = new EventEmitter();
userKiller.on('kill', (token) => {
    users.forEach((user, i) => {
        if (user.token == token) {
            users.splice(i, 1);
        }
    });
}).on('timeout', () => {
    users.forEach((user, i) => {
        if (user.keepAlive == false) {
            users.splice(i, 1);
        } else {
            users[i].keepAlive = false;
        }
    });
});
const app = express();

// Functions

/**
 * 
 * @param {string} token 
 * @returns {User} user with token
 */
function findUser(token) {
    for (let i = 0; i < users.length; i++) {
        if (users[i].token == token) {
            return users[i];
        }
    }
    return null;
}

function userTimeout() {
    setTimeout(() => {
        console.log('[SERVER]: UserTimeout');
        userKiller.emit('timeout');
        userTimeout();
    }, USER_TIMEOUT_MILLIS);
}

// SERVER SETUP
app.use(cors());
app.use(logger('dev'));

app.use('/api/', bodyParser.urlencoded({ extended: true }));
app.use('/api/', bodyParser.json());

/*
====================================================================================================================
API ENDPOINTS
====================================================================================================================
*/

/**
 * Endpoints regarding the content of users' streams
 * 
 * GET - 
 *  1. Locate user sending request
 * 
 *  2. Once found, wait until EACH of subscribed, 
 *     fiveSec, and newData are TRUE.
 * 
 *  3. Respond with body: {
 *      tweets: <user's stream's tweets>
 *  }
 * 
 *  4. Set keepAlive for user
 */
app.get('/api/stream/tweets/', async function (req, res) {

    let token = req.body.token;
    let user = findUser(token);
    user.keepAlive = true;
    if (!user) {
        res.sendStatus(/* TODO: Error */0);
        res.end();
    }
    res.json(user.tweets.getTweets());
    res.end();
});

/**
 * Endpoints regarding the settings of users' streams
 * 
 * 
 * POST - 
 *  1. Locate user sending request
 * 
 *  2. Grab new rules from request
 * 
 *  3. Update stream rules with PUT Twitter request
 * 
 *  4. Respond success
 * 
 *  5. Set keepAlive for user
 * 
 * 
 * DELETE - 
 *  1. Locate user sending request
 * 
 *  2. Send DELETE request to Twitter
 * 
 *  3. Respond success
 * 
 *  *NOTE Do not set keepAlive for this particular request
 */
app.post('/api/stream/', async function (req, res) {

    let token = req.body.token;
    let rules = req.body.rules;
    let user = findUser(token);

    // Failed to find user
    if (!user) {
        res.sendStatus(/* TODO: Error status */0);
        res.end();
    }

    // Set keepalive
    user.keepAlive = true;

    // Set new rules for user's stream
    try {
        let oldRules = await getAllRules(token);
        let success = await deleteAllRules(oldRules, token);

        // Failed to delete rules
        if (success == false) {

            res.sendStatus(/* TODO: Error status */0);
            res.end();
            return;
        }

        // Set new rules
        success = setRules(rules, token);
        if (success == false) {

            res.sendStatus(/* TODO: Error status */0);
            res.end();
            return;
        }

        // Send success and end
        res.sendStatus(200);
        res.end();
        return;
    } catch (err) {

        // Error failure
        res.sendStatus(/* TODO: Error status */0);
        res.end();
        return;
    }
}).delete('/api/stream/', async function (req, res) {

    let token = req.body.token;
    let user = findUser(token);
    if (!user) {
        res.sendStatus(/* TODO: Error status */0);
        res.end();
        return;
    }
    try {

        let oldRules = await getAllRules(token);
        let success = await deleteAllRules(oldRules, token);
        if (success == false) {
            res.sendStatus(/* TODO: Error status */0);
            res.end();
            return;
        }

        res.sendStatus(200);
        res.end();
        return;
    } catch (err) {

        // Error failure
        res.sendStatus(/* TODO: Error status */0);
        res.end();
        return;
    }
});

/**
 * Endpoints regarding logging in a user to their stream
 * 
 * POST - 
 *  1. Authenticates user by sending a quick GET to Twitter
 * 
 *  2. Creates new user object: {
 *      token:      string,
 *      subbed:     boolean,
 *      fiveSec:    boolean,
 *      newData:    boolean,
 *      keepAlive:  boolean
 *  }
 * 
 *  3. Start timeout function that logs out users upon timeout unless keepAlive 
 *     is modified to TRUE. Otherwise, sets keepAlive to false and restarts.
 * 
 * PUT - 
 *  1. Set keepAlive
 * 
 *  2. Respond success
 * 
 * DELETE - 
 *  1. Delete user from server
 */
app.post('/api/login/', async function (req, res) {

    let token = req.body.token;    
    try {
        // Auth
        let rules = await getAllRules(token);
        if (!rules) {
            res.sendStatus(404);
            res.end();
            return;
        }

        // Create user
        let newUser = new User(token, userKiller);
        users.push(newUser);
    } catch (err) {
        console.error(err);
        res.sendStatus(500); // Uncaught error
        res.end();
        return;
    }
}).put('/api/login/', async function (req, res) {

    let token = req.body.token;

    // If user exists, set keepAlive
    let user = findUser(token);

    // Create new user
    user = new User(MAX_TWEETS, token, userKiller);
    users.push(user);

    // Respond success
    res.sendStatus(200);
    res.end();

}).delete('/api/login/', async function (req, res) {

    let token = req.body.token;
    users.forEach((user, i) => {
        if (user.token == token) users.splice(i, 1);
    });
    res.sendStatus(200);
    res.end();
});

app.listen(3000);
userTimeout(); // start timeout loop