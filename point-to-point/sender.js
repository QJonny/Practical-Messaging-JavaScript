#!/usr/bin/env node

var p2pLib =  require("./lib/p2p/");

var done = false;

const p2pChannel = new p2pLib.P2P("practical-messaging-p2p-channel", "amqp://guest:guest@localhost:5672");

console.log("Preparing to send message to consumers");

p2pChannel.afterChannelOpened(function(channel){
    p2pChannel.send(channel,"Hello World", function(){
        console.log("Message sent!");
        done = true;
    })
});


(function wait () {
    if (!done) setTimeout(wait, 1000);
})();

