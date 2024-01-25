// Create web server
var express = require('express');
var app = express();
//create server
var server = require('http').createServer(app);
//create socket
var io = require('socket.io')(server);
//create redis client
var redis = require('redis');
var redisClient = redis.createClient();
//subscribe to redis channel
redisClient.subscribe('message');
//create mongoose client
var mongoose = require('mongoose');
var db = mongoose.connect('mongodb://localhost/chat');
var Message = require('./models/message.js');

//create web server
server.listen(3000);
//create route
app.get('/', function(req, res, next){
	res.sendFile(__dirname + '/views/index.html');
});

//create socket connection
io.on('connection', function(socket){
	//get all messages from database
	Message.find().exec(function(err, messages){
		if(err){
			return next(err);
		}
		socket.emit('message', messages);
	});
	//listen to redis channel
	redisClient.on('message', function(channel, message){
		socket.emit('message', message);
	});
	//listen to socket event
	socket.on('message', function(message){
		//save message to database
		var newMessage = new Message({
			message: message
		});
		newMessage.save(function(err){
			if(err){
				return next(err);
			}
			//publish message to redis channel
			redisClient.publish('message', message);
		});
	});
});
