//test filegenerator

let error_messages = [
    "env1 error1",
    "env2 error2",
    "env1 error3",
    "env3 error4"
]

//generate the weird timestamp format

function generate_error(){

    let now = new Date;
    let date_part = now.getFullYear() + "-" + now.getMonth() + "-" + now.getDate();
    let time_part = now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds();
    let random_error = error_messages[Math.floor(Math.random()*error_messages.length)];

    return date_part + " " + time_part + " " + random_error;
    
}

//save a new line to a file randomly 
var gen_func = function writeErrorToFile(){    
    var fs = require('fs');
    let error = generate_error();
    fs.appendFile("test.txt", error + "\r\n", function(err) {
        if(err) {
            return console.log(err);
        }

        console.log("Generated error: " + error);
    }); 
    setTimeout(gen_func, Math.random()* 10 * 1000);
}

console.log("started Gen");
setTimeout(gen_func, Math.random()* 10 * 1000 );
