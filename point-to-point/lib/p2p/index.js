#!/usr/bin/env node

var amqp = require("amqplib/callback_api");
const watt = require("watt");

const exchangeName = "practical-messaging-p2p"; //we use the default exchange where routing key is key name to emulate a point-to-point channel

//queueName - the name of the queue we want to create, which ia also the routing key in the default exchange
//url - the amqp url for the rabbit broker, must begin with amqp or amqps
function P2P(queueName, url) {
  this.queueName = queueName;
  this.brokerUrl = url;
}

module.exports.P2P = P2P;

const completeChannel = watt(function* (channel, queueName, next) {
  //TODO: declare a non-durable direct exchange via the channel
  yield channel.assertExchange(
    exchangeName,
    "direct",
    { durable: false },
    next
  );

  //TODO: declare a non-durable queue. non-exc;usive, that does not auto-delete. Use _queuename
  yield channel.assertQueue(
    queueName,
    { durable: false, autoDelete: false, exclusive: false },
    next
  );

  //TODO: bind _queuename to _routingKey on the exchange
  yield channel.bindQueue(queueName, exchangeName, queueName, {}, next);
});

//cb - the callback to send or receive
P2P.prototype.afterChannelOpened = function (cb) {
  me = this;
  amqp.connect(me.brokerUrl, function (err, conn) {
    if (err) {
      console.error("[AMQP]", err.message);
      cb(err);
    } else {
      conn.createConfirmChannel(function (err, channel) {
        if (err) {
          console.error("AMDP", err.message);
          cb(err);
        } else {
          completeChannel(channel, me.queueName, (err) => {
            if (err) {
              console.error("AMDP", err.message);
              cb(err);
            } else {
              cb(channel);
            }
          });

          /*setTimeout(function () {
            channel.close();
            conn.close();
          }, 500);*/
        }
      });
    }
  });
};

//channel - the RMQ channel to make requests on
//message - the data to serialize
//cb a callback indicating success or failure
P2P.prototype.send = function (channel, message, cb) {
  channel.publish(
    exchangeName,
    this.queueName,
    Buffer.from(message),
    (err, ok) => {
      if (err) {
        console.err("AMDP", err.message);
        cb(err);
      } else {
        cb();
      }
    }
  );
};

//channel - the RMQ channel to make requests on
//cb a callback indicating success or failure
P2P.prototype.receive = function (channel, cb) {
  channel.get(this.queueName, { noAck: true }, (err, msgOrFalse) => {
    if (err) {
      console.err("AMDP", err.message);
      cb(err);
    } else if (msgOrFalse === false) {
      cb({});
    } else {
      cb(msgOrFalse);
    }
  });
};
