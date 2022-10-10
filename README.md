# **CSSE 343 - Twitter Lab**

This repository is meant to serve as guidance for a lab in the class Cybercrime & Digital Forensics at Rose-Hulman Institute of Technology, but is also free to use by anyone who may be interested in having some quick fun with Twitter Developer accounts. When it is entirely finished, the webserver folder should contain both a backend and static frontend web server that can be used to modify and view `FilteredStream` streams from Twitter's API v2.

## **Getting Started**
For the Cybercrime & Digital Forensics lab, guidance will be using Node.js version 16.10.0 and Visual Studio Code. Visual Studio Code can be downloaded from icrosoft for free, and a quick guide to installing Node.js will be provided below.

### **Installing Node.js**
The scripts we will use for this lab are written in Node.js- a popular backend Javascript framework. To get started, we will first want to download and install Node.js, which can be found [here](https://nodejs.org/en/). After Node is installed, open a terminal (on Windows, this can be done by searching 'cmd') and enter the following command: `node -v`. You should see a response that looks something like this: `v16.10.0`. This is just the version of Node you have installed and can be used as a confirmation that Node is installed on your machine.

Once you have verified your Node installation, type `npm -v` into the terminal. This should result in a similar message appearing in response, and verifies that you have Node Package Manager installed on your machine.

### **Starting a Node project**
Now that Node and npm are installed, it's time to start a npm package where our node script will run. First, create a folder that you want this project to live in. Next, navigate to that folder in a terminal with the following: `cd path/to/folder` (if you don't know the path, you can find it in the properties menu when right-clicking on the target folder). Once you are at the folder, you can start a new npm package with `npm init`. This will generate a few new files in your project that for this lab's purposes can be ignored.

Now that you have a node package set up, you will need to install another node package that our project will depend on. This can be installed with the following command in the terminal: `npm install needle`.

Now, it's time to make some files to house your code. In your project folder, make two new files: One named `main.js` and another named `config.json` (the names do not have to be the same, but the extensions at the end must be the same). The `config.json` file only hold your Twitter Developer Bearer Token, and can be set up as follows:
```JS
{
    'BEARER_TOKEN':'your-token-here'
}
```

The `main.js` file will house your script. For now, you can copy this as a starting skeleton for the file:
```JS
const {BEARER_TOKEN} = require('./config.json') // Replace with your JSON file's name if you named differently

// Some preset hardcoded rules to get you started
const rules = [{
    'value': 'dog -is:retweet',
    'tag': 'Dog Pictures'
},
{
    'value': 'cat -grumpy -is:retweet',
    'tag': 'Cat Pictures'
},
];

// The function that the script will run
async function main() {
    console.log('Hello World!');
}

// This calls the function after everything else in the script has been loaded
main();
```

## **Some Starting Code**
Feel free to copy these functions directly into your file. These functions are really all you need to manage a basic filtered stream. If you would like to read more on how this works, feel free to reference the [Twitter API](https://developer.twitter.com/en/docs/twitter-api). You can also find these functions compiled into a script at the [Twitter API sample code GitHub](https://github.com/twitterdev/Twitter-API-v2-sample-code/blob/main/Filtered-Stream/filtered_stream.js) (This lab will be building a similar script, but with some slight modifications to make it more functional)

Gets the current rules from your stream:
```JS
async function getAllRules() {

    const response = await needle('get', rulesUrl, {
        headers: {
            "authorization": `Bearer ${BEARER_TOKEN}`
        }
    })

    if (response.statusCode !== 200) {
        console.log("Error:", response.statusMessage, response.statusCode)
        throw new Error(response.body);
    }

    return (response.body);
}
```

Deletes rules with provided IDs from your stream:
```JS
async function deleteAllRules(rules) {

    if (!Array.isArray(rules.data)) {
        return null;
    }

    const ids = rules.data.map(rule => rule.id);

    const data = {
        "delete": {
            "ids": ids
        }
    }

    const response = await needle('post', rulesUrl, data, {
        headers: {
            "content-type": "application/json",
            "authorization": `Bearer ${BEARER_TOKEN}`
        }
    })

    if (response.statusCode !== 200) {
        throw new Error(response.body);
    }

    return (response.body);

}
```

Adds the provided rules to your stream:
```JS
async function setRules(rules) {

    const data = {
        "add": rules
    }

    const response = await needle('post', rulesUrl, data, {
        headers: {
            "content-type": "application/json",
            "authorization": `Bearer ${BEARER_TOKEN}`
        }
    })

    if (response.statusCode !== 201) {
        throw new Error(response.body);
    }

    return (response.body);

}
```

Connects to your stream: *
```JS
function streamConnect(retryAttempt) {

    const stream = needle.get(streamUrl, {
        headers: {
            "User-Agent": "v2FilterStreamJS",
            "Authorization": `Bearer ${BEARER_TOKEN}`
        },
        timeout: 20000
    });

    stream.on('data', data => {
        try {
            const json = JSON.parse(data);
            console.log(json);
            // A successful connection resets retry count.
            retryAttempt = 0;
        } catch (e) {
            if (data.detail === "This stream is currently at the maximum allowed connection limit.") {
                console.log(data.detail)
                process.exit(1)
            } else {
                // Keep alive signal received. Do nothing.
            }
        }
    }).on('err', error => {
        if (error.code !== 'ECONNRESET') {
            console.log(error.code);
            process.exit(1);
        } else {
            // This reconnection logic will attempt to reconnect when a disconnection is detected.
            // To avoid rate limits, this logic implements exponential backoff, so the wait time
            // will increase if the client cannot reconnect to the stream. 
            setTimeout(() => {
                console.warn("A connection error occurred. Reconnecting...")
                streamConnect(++retryAttempt);
            }, 2 ** retryAttempt)
        }
    });

    return stream;

}
```
**\*** This function should only be called once, after which you should only add or remove rules to change what the stream returns. To avoid rate limits, you can just fetch all of the stream's rules and then delete them from the stream so that it has no rules to return Tweets with.

Anywhere where there is a 'rules' variable, it should be of format:
```JS
const rules = [{
    'value': 'your rule here',
    'tag': 'tag to identify rule'
},
{
    'value': 'another rule here',
    'tag': 'another tag for it'
},
];
```
but with valid Twitter rules in the 'value' field (the API will respond with an error and reject your request if any rules are invalid).

## **Running your first script**
Once you have those functions in, you can make your main function actually do something:

```JS
async function main() {

    let rules = await getAllRules();
    await deleteAllRules(rules);
    await setRules(rules);
    streamConnect(0);

}
```

And poof! You should now have a runnable script! You can try running it with `node main.js` in the terminal (replace main.js with your js file's name).

### **Final Script**
If you've made it this far and do not have a functional script, feel free to copy this directly into a .js file. Bizarre bugs are pretty easy to miss, even for people who have been programming for years, so copy/pasting bits and pieces in assorted places is bound to cause issues sometimes! (I guess that was sort of my bad for laying out the lab that way)
```JS
// Imports
const needle = require('needle');
const { BEARER_TOKEN } = require('./config.json');

// Globals for Twitter connection
const rulesUrl = 'https://api.twitter.com/2/tweets/search/stream/rules';
const streamUrl = 'https://api.twitter.com/2/tweets/search/stream';

// Hardcoded rules
const rules = [{
    'value': 'dog has:images -is:retweet',
    'tag': 'dog pictures'
},
{
    'value': 'cat has:images -grumpy',
    'tag': 'cat pictures'
},
];

async function getAllRules() {

    const response = await needle('get', rulesUrl, {
        headers: {
            "authorization": `Bearer ${BEARER_TOKEN}`
        }
    })

    if (response.statusCode !== 200) {
        console.log("Error:", response.statusMessage, response.statusCode)
        throw new Error(response.body);
    }

    return (response.body);
}

async function deleteAllRules(rules) {

    if (!Array.isArray(rules.data)) {
        return null;
    }

    const ids = rules.data.map(rule => rule.id);

    const data = {
        "delete": {
            "ids": ids
        }
    }

    const response = await needle('post', rulesUrl, data, {
        headers: {
            "content-type": "application/json",
            "authorization": `Bearer ${BEARER_TOKEN}`
        }
    })

    if (response.statusCode !== 200) {
        throw new Error(response.body);
    }

    return (response.body);

}

async function setRules() {

    const data = {
        "add": rules
    }

    const response = await needle('post', rulesUrl, data, {
        headers: {
            "content-type": "application/json",
            "authorization": `Bearer ${BEARER_TOKEN}`
        }
    })

    if (response.statusCode !== 201) {
        throw new Error(response.body);
    }

    return (response.body);

}

function streamConnect(retryAttempt) {

    const stream = needle.get(streamUrl, {
        headers: {
            "User-Agent": "v2FilterStreamJS",
            "Authorization": `Bearer ${BEARER_TOKEN}`
        },
        timeout: 20000
    });

    stream.on('data', data => {
        try {
            const json = JSON.parse(data);
            console.log(json);
            // A successful connection resets retry count.
            retryAttempt = 0;
        } catch (e) {
            if (data.detail === "This stream is currently at the maximum allowed connection limit.") {
                console.log(data.detail)
                process.exit(1)
            } else {
                // Keep alive signal received. Do nothing.
            }
        }
    }).on('err', error => {
        if (error.code !== 'ECONNRESET') {
            console.log(error.code);
            process.exit(1);
        } else {
            // This reconnection logic will attempt to reconnect when a disconnection is detected.
            // To avoid rate limits, this logic implements exponential backoff, so the wait time
            // will increase if the client cannot reconnect to the stream. 
            setTimeout(() => {
                console.warn("A connection error occurred. Reconnecting...")
                streamConnect(++retryAttempt);
            }, 2 ** retryAttempt)
        }
    });

    return stream;

}


(async () => {
    let currentRules = rules;

    try {
        // Gets the complete list of rules currently applied to the stream
        let oldRules = await getAllRules();


        // Delete all rules. Comment the line below if you want to keep your existing rules.
        await deleteAllRules(oldRules);

        // Add rules to the stream. Comment the line below if you don't want to add new rules.
        await setRules(currentRules);

    } catch (e) {
        console.error(e);
        process.exit(1);
    }

    // Listen to the stream.
    console.log('Connecting to stream...');
    streamConnect(0);
})();
```

## **Making Your Own Rules**
Now that you've started streaming Tweets to your console, you might want to modify your stream rules and grab different kinds of Tweets.

### **Keywords**
The simplest type of rule you can add is a keyword rule. These are added by just including the words as plain text in the value string.

Example: `'value':'dog'` Makes a rule with the keyword 'dog'

You can also negate a keyword by prefacing it with a dash: `'value':'-dog'` Makes a rule that excludes Tweets with the keyword 'dog'

### **Flagged Rules**
Another type of rule you can use involves some sort of prefix.

Example: `'value':'-is:retweet has:images'` Makes a rule that excludes Tweets that are retweeted and includes Tweets that contain images.

### **Boolean Logic**
Once you start building rules with multiple different rules, you can also start connecting rules with boolean operators.

Example: `'value':'dog OR cat AND has:media'` Makes a rule that pulls Tweets with either the Dog or Cat keyword AND which has some sort of media attached to it.

### **Explore them all**
You can make fairly complex rules by including and excluding many keywords and flags! Go ahead and explore all of the possible rule types [here](https://developer.twitter.com/en/docs/twitter-api/tweets/filtered-stream/integrate/build-a-rule) and see what kind of filters you can make!



# **Known Issues with Webserver**

Currently there are some issues with the webserver's responsiveness to errors server-side. Due to this, there may be some confusion when stuff doesn't work. Here's a list of the most common issues users might encounter:

* PROBLEM: I logged in and the login was successful, but it won't let me do anything after!
    - This is most likely caused by your stream's connection limit being reached. If you try logging in again in 5-10 minutes, the issue should be resolved
    