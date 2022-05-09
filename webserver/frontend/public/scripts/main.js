// Imports
import TwitterRuleManager from './twitter-rule-manager.js'
import Tweet from './tweet.js';


// Namespace
var tweetstreamer = tweetstreamer || {};

// Base URL for accessing the backend
tweetstreamer.apiUrl = 'http://localhost:3000/api/';
tweetstreamer.BASIC = 0;
tweetstreamer.ADVANCED = 1;


/**
 * Manager
 */
tweetstreamer.DataManager = class {

    constructor() {

        // Rules to be sent in API requests
        this.currentRule = new TwitterRuleManager();
        this.rules = [];
        this.mode = tweetstreamer.BASIC;
        /** @type {Tweet[]} */
        this.latestTweets = [];

    }

    // Adds the rule currently being editted to the manager's array of rules
    addCurrentRule() {
        this.rules.push(this.currentRule.getRule());
        this.currentRule = new TwitterRuleManager();
    }

    getCurrentRule() {
        return this.currentRule.getRule().value;
    }

    getRules() {
        let ruleString = '';
        this.rules.forEach((rule, i) => {
            ruleString = ruleString.concat(`${i + 1}:<br>&nbsp&nbsp&nbsp&nbspValue: ${rule.value}<br>&nbsp&nbsp&nbsp&nbspTag: ${rule.tag}<br>`);
        });
        return {
            ruleString: ruleString,
            list: this.rules
        }
    }

    clearRules() {
        this.rules = [];
        this.currentRule = new TwitterRuleManager();
    }

    changeModes() {
        this.currentRule = new TwitterRuleManager();
        this.mode = (this.mode == tweetstreamer.ADVANCED) ? tweetstreamer.BASIC : tweetstreamer.ADVANCED;
    }

    formatLatestTweets() {

        // Default message
        if (this.latestTweets.length == 0) {
            return 'No Tweets to display yet!<br>If you just started streaming, it may take a few moments for Tweets to start arriving';
        }

        console.log(`Format: ${JSON.stringify(this.latestTweets)}`);

        try {
            let formattedTweets = '';
            this.latestTweets.forEach(tweet => {
                formattedTweets = formattedTweets.concat(`==============================<br>Tweet ID: ${tweet.data.id}<br>&nbsp&nbspText: ${tweet.data.text}`);

                let matchString = 'Rules Matched: ';
                tweet.matching_rules.forEach(rule => {
                    matchString = matchString.concat(`'${rule.tag}', `);
                });
                matchString = matchString.substring(0, matchString.length - 2);
                formattedTweets = formattedTweets.concat(`<br>&nbsp&nbsp${matchString}<br>==============================`);
            });

            return formattedTweets;
        } catch (err) {
            console.log(err);
            return 'error';
        }
    }

    /**
     * Puts the manager's rules into a request body, and then requests the backend to start a stream of tweets
     * @returns {Promise<boolean>}
     */
    async requestStartStream() {
        return new Promise((resolve, reject) => {
            fetch(`${tweetstreamer.apiUrl}stream/`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    rules: this.rules
                })
            }).then(data => {

                // Responses: 200 success, 400 malformed, 502 stream error
                console.log(data);
                if (data.status == 200) {
                    console.log('[Client]: Received success from server');
                    resolve(true);
                    return;
                } else if (data.status == 400) {
                    // TODO: Prompt malformed request
                    console.log('[Client]: Received error 400 from server');
                    resolve(false);
                    return;
                } else if (data.status == 502) {
                    // TODO: Prompt server error
                    console.log('[Client]: Received error 502 from server');
                    resolve(false);
                    return;
                }
                console.log('[Client]: Received error from server');
                resolve(false);

            });
        });

    }

    /**
     * Sends a request to stop the current stream
     * @returns {Promise<boolean>}
     */
    async requestStopStream() {
        return new Promise((resolve, reject) => {
            fetch(`${tweetstreamer.apiUrl}stream/`, {
                method: 'DELETE'
            }).then(data => {
                if (data.status == 200) {
                    console.log('[Client]: Received success from server');
                    resolve(true); // Success
                    return;
                }
                console.log('[Client]: Received error from server');
                resolve(false);
            });
        });
    }

    /**
     * Sends a request to view the current stream
     * @returns {Promise<boolean>}
     */
    async requestViewStream() {
        return new Promise((resolve, reject) => {
            console.log(`[Client]: Requesting Tweets`);
            fetch(`${tweetstreamer.apiUrl}stream/tweets`, {
                method: 'GET'
            }).then(response => response.json())
                .then(data => {
                    console.log(`[Client]: Received Tweets`);
                    this.latestTweets = data;
                    resolve(true);
                    return;
                });
        });
    }



}


/**
 * Page View
 */
tweetstreamer.PageController = class {

    /**
     * Adds listeners to buttons & labels
     */
    constructor() {

        this.manager = new tweetstreamer.DataManager();
        this.stopViewing = false;
        this.setListeners();

    }

    /**
     * Sets all listeners for the page
     */
    setListeners() {

        /** @type {HTMLInputElement} */
        const keywordInput = document.querySelector('#ruleKeywordInput');
        keywordInput.addEventListener('input', () => {

            // If in advanced mode, ignore
            if (this.manager.mode == tweetstreamer.ADVANCED) return;

            // Update rule by setting
            this.manager.currentRule.keywords = keywordInput.value;
            this.updateView(false);

        });

        const advancedRule = document.querySelector('#ruleInput');
        advancedRule.addEventListener('input', () => {

            if (this.manager.mode == tweetstreamer.BASIC) return;

            this.manager.currentRule.keywords = advancedRule.value;
            this.updateView(false);

        });

        const advancedTag = document.querySelector('#tagInput');
        advancedTag.addEventListener('input', () => {

            if (this.manager.mode == tweetstreamer.BASIC) return;

            this.manager.currentRule.tag = advancedTag.value;

        });

        const modalTag = document.querySelector('#tagModalInput');
        modalTag.addEventListener('input', () => {

            if (this.manager.mode == tweetstreamer.ADVANCED) return;

            this.manager.currentRule.tag = modalTag.value;

        });

        /*
          ============================================================================================================================
          Mode Buttons
          ============================================================================================================================
        */

        const basicButton = document.querySelector('#basicMode');
        basicButton.addEventListener('click', () => {
            this.manager.changeModes();

            // Hide advanced, bring out basic bar
            document.querySelector('#basicBar').removeAttribute('style');
            document.querySelector('#currentRule').removeAttribute('style');
            document.querySelector('#advancedBar').setAttribute('style', 'display:none');

            // Add tag modal toggle
            document.querySelector('#addRule').setAttribute('data-toggle', 'modal');
            document.querySelector('#addRule').setAttribute('data-target', '#tagModal');

            this.updateView(false);

        });

        const advancedButton = document.querySelector('#advancedMode');
        advancedButton.addEventListener('click', () => {
            this.manager.changeModes();

            // Hide basic, bring out advanced bar
            document.querySelector('#advancedBar').removeAttribute('style');
            document.querySelector('#basicBar').setAttribute('style', 'display:none');
            document.querySelector('#currentRule').setAttribute('style', 'display:none');

            // Remove tag modal toggle
            document.querySelector('#addRule').removeAttribute('data-toggle');
            document.querySelector('#addRule').removeAttribute('data-target');

            this.updateView(false);

        });

        /*
          ============================================================================================================================
          Toggle Buttons
          ============================================================================================================================
        */
        const mediaToggleButton = document.querySelector('#mediaToggleButton');
        mediaToggleButton.addEventListener('click', () => {

            // Toggle HTML
            let newClass;
            if (mediaToggleButton.getAttribute('class').includes('danger')) {
                newClass = 'btn btn-outline-success';
                this.manager.currentRule.addFlag('has:media');
            } else {
                newClass = 'btn btn-outline-danger';
                this.manager.currentRule.removeFlag('has:media');
            }
            mediaToggleButton.setAttribute('class', newClass);
            this.updateView(false);

        });

        const retweetToggleButton = document.querySelector('#retweetToggleButton');
        retweetToggleButton.addEventListener('click', () => {

            // Toggle HTML
            let newClass;
            if (retweetToggleButton.getAttribute('class').includes('danger')) {
                newClass = 'btn btn-outline-success';
                this.manager.currentRule.addFlag('-is:retweet');
            } else {
                newClass = 'btn btn-outline-danger';
                this.manager.currentRule.removeFlag('-is:retweet');
            }
            retweetToggleButton.setAttribute('class', newClass);
            this.updateView(false);

        });

        const adToggleButton = document.querySelector('#adToggleButton');
        adToggleButton.addEventListener('click', () => {

            // Toggle HTML
            let newClass;
            if (adToggleButton.getAttribute('class').includes('danger')) {
                newClass = 'btn btn-outline-success';
                this.manager.currentRule.addFlag('-is:nullcast');
            } else {
                newClass = 'btn btn-outline-danger';
                this.manager.currentRule.removeFlag('-is:nullcast');
            }
            adToggleButton.setAttribute('class', newClass);
            this.updateView(false);

        });

        const geoToggleButton = document.querySelector('#geoToggleButton');
        geoToggleButton.addEventListener('click', () => {

            // Toggle HTML
            let newClass;
            if (geoToggleButton.getAttribute('class').includes('danger')) {
                newClass = 'btn btn-outline-success';
                this.manager.currentRule.addFlag('has:geo');
            } else {
                newClass = 'btn btn-outline-danger';
                this.manager.currentRule.removeFlag('has:geo');
            }
            geoToggleButton.setAttribute('class', newClass);
            this.updateView(false);

        });

        /*
          ============================================================================================================================
          API Buttons
          ============================================================================================================================
        */

        const addRuleButton = document.querySelector('#addRule');
        addRuleButton.addEventListener('click', () => {

            if (this.manager.mode == tweetstreamer.BASIC) {
                
                // Just open tag modal -> tag modal should do rest

            } else {

                this.manager.addCurrentRule();
                this.updateView(true);

            }
            
        });

        const clearRuleButton = document.querySelector('#clearRule');
        clearRuleButton.addEventListener('click', () => {
            this.manager.clearRules();
            this.updateView(true);
        });

        const startStreamButton = document.querySelector('#startStream');
        startStreamButton.addEventListener('click', async () => {

            let success = await this.manager.requestStartStream();

            if (success) {

                console.log('[Client]: Enabling buttons');
                let stopBtn = document.querySelector('#stopStream');
                let viewBtn = document.querySelector('#viewStream');

                let oldStop = stopBtn.getAttribute('class');
                let oldView = viewBtn.getAttribute('class');

                let newStop = oldStop.replace('secondary', 'primary');
                let newView = oldView.replace('secondary', 'primary');

                stopBtn.removeAttribute('disabled');
                stopBtn.setAttribute('class', newStop);
                viewBtn.removeAttribute('disabled');
                viewBtn.setAttribute('class', newView);

            } else {
                // TODO: Indicate failure
            }
        });

        const stopStreamButton = document.querySelector('#stopStream');
        stopStreamButton.addEventListener('click', async () => {

            let success = await this.manager.requestStopStream();

            if (success) {

                console.log('[Client]: Disabling buttons');

                let stopBtn = document.querySelector('#stopStream');
                let viewBtn = document.querySelector('#viewStream');
                let oldStop = stopBtn.getAttribute('class');
                let oldView = viewBtn.getAttribute('class');
                let newStop = oldStop.replace('primary', 'secondary');
                let newView = oldView.replace('primary', 'secondary');
                stopBtn.setAttribute('class', newStop);
                viewBtn.setAttribute('class', newView);
                stopBtn.setAttribute('disabled', 'true');
                viewBtn.setAttribute('disabled', 'true');

                // Reset rules
                this.manager.rules = [];
                this.updateView(true);

            } else {
                // TODO: Indicate failure
            }
        });

        const viewStreamButton = document.querySelector('#viewStream');
        viewStreamButton.addEventListener('click', async () => {

            this.viewStreamHelper();

        });

        /*
          ============================================================================================================================
          Modal Buttons
          ============================================================================================================================
        */
        const closeTweetModal = document.querySelector('#closeTweetModal');
        const dismissTweetModal = document.querySelector('#dismissTweetModal');

        closeTweetModal.addEventListener('click', () => {

            // Stop request loop
            this.stopViewing = true;

        });

        dismissTweetModal.addEventListener('click', () => {

            // Stop request loop
            this.stopViewing = true;

        });

        const tagModalBtn = document.querySelector('#finishTagModal');
        tagModalBtn.addEventListener('click', () => {

            this.manager.addCurrentRule();
            this.updateView(true);

        });

    }

    async viewStreamHelper() {

        let success = await this.manager.requestViewStream();

        if (success && this.stopViewing == false) {

            this.updateView(false);
            setTimeout(this.viewStreamHelper(), 50000);

        }

        if (this.stopViewing == true) {

            this.stopViewing = false;

        }

    }

    /**
     * Updates the view of the page with the most current data
     * 
     * @param {boolean} adding
     */
    updateView(adding) {

        if (adding) {
            // Update Rule List
            let ruleListElement = document.querySelector('#ruleList');
            let rules = this.manager.getRules();
            ruleListElement.innerHTML = rules.ruleString || '';

            // Reset buttons
            let buttons = [];
            buttons.push(document.querySelector('#mediaToggleButton'));
            buttons.push(document.querySelector('#retweetToggleButton'));
            buttons.push(document.querySelector('#adToggleButton'));
            buttons.push(document.querySelector('#geoToggleButton'));

            // Reset classes to 'toggled off' state
            buttons.forEach(button => {
                button.setAttribute('class', 'btn btn-outline-danger');
            });

            // Reset inputs
            /** @type {HTMLInputElement[]} */
            let inputs = [];
            inputs.push(document.querySelector('#ruleKeywordInput'));

            inputs.forEach(input => {
                input.value = '';
            });
        }

        // Update Current Rule
        document.querySelector('#currentRule').innerHTML = `Current Rule: ${this.manager.getCurrentRule()}`;

        // Update tweet feed
        document.querySelector('#tweetModalBody').innerHTML = this.manager.formatLatestTweets();

    }
}


tweetstreamer.main = () => {

    // Load page
    if (document.querySelector('#twitterStreamerHome')) {
        new tweetstreamer.PageController();
    }

}

// Init
tweetstreamer.main();