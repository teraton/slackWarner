const { RtmClient, CLIENT_EVENTS, WebClient } = require('@slack/client');
const Tail = require('tail').Tail;
var program = require('commander');

program
    .version('1.0.0')
    .option('-h, --threshold','REQUIRED: Warning threshold')
    .option('-f, --filename','REQUIRED: Logfile to be followed')
    .option('-s, --string','REQUIRED: string that is looked for in file')
    .option('-t, --time <n>','time window for threshold in minutes, default 30', parseInt, 30)
    .option('-c, --channel','channel to post in slack, otherwise posts to where bot is invited' )
    .parse(process.argv);

if(!program.threshold || !program.filename || !program.string){
    console.log("threshold, filename and string required");
    process.exit();
}

// An access token (from your Slack app or custom integration - usually xoxb)
const token = process.env.SLACK_TOKEN;

// Cache of data
const appData = {};


// Initialize the RTM client with the recommended settings. Using the defaults for these
// settings is deprecated.
const rtm = new RtmClient(token, {
  dataStore: false,
  useRtmConnect: true,
});

// Need a web client to find a channel where the app can post a message
const web = new WebClient(token);

// Load the current channels list asynchrously
let channelListPromise = web.channels.list();

// The client will emit an RTM.AUTHENTICATED event on when the connection data is avaiable
// (before the connection is open)
rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED, (connectData) => {
  // Cache the data necessary for this app in memory
  appData.selfId = connectData.self.id;
  console.log(`Logged in as ${appData.selfId} of team ${connectData.team.id}`);
});

// The client will emit an RTM.RTM_CONNECTION_OPENED the connection is ready for
// sending and recieving messages
rtm.on(CLIENT_EVENTS.RTM.RTM_CONNECTION_OPENED, () => {

    console.log(`Ready2`);
    // Wait for the channels list response
    channelListPromise.then((res) => {
  
      // Take any channel for which the bot is a member
      //const channel = res.channels.find(c => c.is_member);
      //
      let noChannel = true;
      for (let channel of res.channels) {
          console.log(channel)
        console.log(channel.name)
        if (channel.is_member){
            noChannel = false;
            rtm.sendMessage('alert', channel.id)
            // Returns a promise that resolves when the message is sent
            .then(() => console.log(`Message sent to channel ${channel.name}`))
            .catch(console.error);
        }
      }
      if(noChannel){
          console.log('This bot does not belong to any channels, invite it to at least one and try again');
      }
        
      
    });
  });

// Start the connecting process
rtm.start();



//setup tailing of logfile
let tail = new Tail("test.txt");

let warningQue = [];
let timeLimitInS = program.time * 60;
let lastMessage = null;
let spamLimit = 300; //in seconds
let warningTypes = [];

tail.on("line", function(data) {
    parseLine(data);
    checkWarningQue();

});
  
tail.on("error", function(error) {
console.log('ERROR: ', error);
});
function parseLine(data){
    //split timestamp and identifying part
    let fields = data.split(' ', 2);
    let now = (new Date).getTime();
    let warningObj = {};

    if(!warningTypes.indexOf(fields[1])){        
        warningTypes.push(fields[1]);
    }
}
function checkWarningQue(){
    for (let warnType of warningTypes ){
        
    }
}

function addToQue(){
        //push new warning to que and if que has more warnings than the threshold check time
    //TODO clean up que
    warningQue.push({timestamp,data});
    if(warningQue.length > program.threshold)
    {
        //compare the last and the last-threshold to see if more time than the threshold has elapsed

        
    }
}

function sendMessage(){

}