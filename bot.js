const { RtmClient, CLIENT_EVENTS, WebClient } = require('@slack/client');
const Tail = require('tail').Tail;
var program = require('commander');

var warning_buckets = {};

program
    .version('1.0.0')
    .option('-h, --threshold <n>','REQUIRED: Warning threshold',parseInt)
    .option('-f, --filename <path>','REQUIRED: Logfile to be followed')
    .option('-s, --string <string>','REQUIRED: string that is looked for in file')
    .option('-t, --time <n>','time window for threshold in minutes, default 30', parseInt, 30)
    .option('-c, --channel <string>','channel to post in slack, otherwise posts to where bot is invited' )
    .parse(process.argv);
//check required parameters
if(!program.threshold || !program.filename || !program.string){
    console.log("threshold, filename and string required");
    process.exit();
}
console.log(program.channel);
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
    console.log("RTM connection opened");
  });

// Start the connecting process
rtm.start();



//setup tailing of logfile
console.log("Following log file: " + program.filename);
let tail = new Tail(program.filename);

let warningQue = [];
let timeLimitInS = program.time * 60 * 1000;
let lastMessage = null;
let spamLimit = 300; //in seconds
let warningTypes = [];

tail.on("line", function(data) {
    parseLine(data);
    
});
  
tail.on("error", function(error) {
console.log('ERROR: ', error);
});

//todo, separate bucket state handling and parsing from here
function parseLine(data){

    //split timestamp and identifying part
    let fields = data.split(' ', 3);
    //todo get good timestamp test data, this just slightly skews the data, and as this is reporting and already somehow centralized this probably does not hurt too much
    let now = (new Date).getTime();
    let warning_msg = fields[2];
    //split the different errors into different buckets.
    
    console.log(fields);
    //error/env not yet logged, add bucket

    if(!(warning_buckets.hasOwnProperty(warning_msg)) ){

        if(warning_buckets[warning_msg] = [])

        warning_buckets[warning_msg].push(now);
    }
    else
    {
        warning_buckets[warning_msg].push(now);
    }

    if(warning_buckets[warning_msg].length >= program.threshold ){
        

        //naive time comparing
        let bucket_length = warning_buckets[warning_msg].length;
        let bucket = warning_buckets[warning_msg];

        if((bucket[bucket_length-1] - bucket[bucket_length-program.threshold]) < (timeLimitInS) ){

            if(warning_msg.includes(program.string)){
                //send message
                //TODO implement spam block
                sendMessage(warning_msg);
                
            }
            bucket.splice(0,1);
        }
        //clean bucket, delete objects that are not needed anymore 
        else{
            //delete all objects from the past that are over the threshold as they do not affect calculations anymore
            console.log(bucket_length-program.threshold)
            if((bucket_length-program.threshold) > 0){
                bucket.splice(0,(bucket_length-program.threshold));
            }
        }
    }

}

function sendMessage(warning__msg){
    // Wait for the channels list response
    channelListPromise.then((res) => {
  
      // Take any channel for which the bot is a member
      //const channel = res.channels.find(c => c.is_member);
      //
      let noChannel = true;
      for (let channel of res.channels) {

        if (channel.is_member){
            if(program.channel){
                if(channel.name == program.channel){
                noChannel = false; 
                console.log("posting only to specified channel")
                rtm.sendMessage(warning__msg, channel.id)
                // Returns a promise that resolves when the message is sent
                .then(() => console.log(`Message sent to channel ${channel.name}`))
                .catch(console.error);
                }
            }   
            else{
                noChannel = false;
                rtm.sendMessage(warning__msg, channel.id)
                // Returns a promise that resolves when the message is sent
                .then(() => console.log(`Message sent to channel ${channel.name}`))
                .catch(console.error);
            }   

        }
      }
      if(noChannel){
          console.log('This bot does not belong to any channels, invite it to at least one and try again');
      }
        
      
    });
}