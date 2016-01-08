/*!
*
* Playstation Network API
* v0.2.0
* ---
* @desc 	A simple example of usage using Express, it returns the Raw object from Sony' servers
* @author 	José A. Sachs (admin@jsachs.net jose@animus.com.ar)
*
*/


var PORT     = process.env.PORT || 5000;
var FRIENDS  = require('./config/friends');
var gumerPSN = require('./lib/psn'); // Gumer Playstation module
var Color    = require('./lib/color');
var express  = require('express');	 // Express
var async 	 = require('async');
var app 		 = express();				     // Express application instance
var idregex  = /[A-Za-z0-9].{2,15}/; // A simple regex for PSN id's // TODO: Make it more accurate and fancy


console.log('Starting gPSN');

gumerPSN.init({	                      // Our PSN Module, we have to start it once. - irkinsander
	debug      : true,	                // Let's set it true, it's still in early development. So, report everything that goes wrong please.
	email      : process.env.PSN_EMAIL, // A valid PSN/SCE account (can be new one) // TODO: Using the user's credentials to do this.
	password   : process.env.PSN_PASS,	// Account's password
	npLanguage : "en",			            // The language the trophy's name and description will shown as
	region     : "it"			            // The server region that will push data
});

// Taken from Express site, this takes /{{id}}/ parameter
app.param(function(name, fn){
	if (fn instanceof RegExp) {
		return function(req, res, next, val){
			var captures;
			if (captures = fn.exec(String(val))) {
				req.params[name] = captures;
				next();
			}
			else {
				next('route');
			}
		}
	}
});

// Gets the ID owner's profile friends list and returns the JSON object.

// Gets the ID owner's trophy (first 100) information and returns the JSON object.
app.get('/friends', function(req, res){

  var onlineFriends = "";

  async.each(FRIENDS, function(friend, callback) {
    gumerPSN.getProfile(friend.onlineId, function(error, profileData) {
      if (!error) {
        friend.online = (profileData.presence.primaryInfo.onlineStatus == "online") ? true : false;
      }
      callback();
    })
  }, function(err){
    if(err){
      console.log(err);
    } else {
      var colors = FRIENDS.map(function(friend){
        return friend.online ? Color.hex_to_int32(friend.color) : 0;
        //return Color.hex_to_int32(friend.color);
      });
      res.send(colors.join(";") + ';');
    }
  })

})

  // Gets the ID owner's trophy (first 100) information and returns the JSON object.
app.get('/PSN/:id/friends', function(req, res){
	gumerPSN.getFriends(req.params.id,function(error, friendData) {
		if (!error) {
			res.send(friendData)
		}
		else {
			if (friendData.error.code == 2105356) {		// User not found code
				res.send({
					error: true, message: "PSN ID not found"
				})
			}
			else {
				res.send({
					error: true, message: "Something went terribly wrong, submit an issue on GitHub please!", response: friendData
				})
			}
		}
	})
})

// Gets the ID owner's profile friends online status and returns the TEXT object.
app.get('/PSN/:id/friends_online_status', function(req, res){
	var onlineFriends = ""

	gumerPSN.getFriends(req.params.id, function(error, friendsData) {
		if (!error) {

			async.each(friendsData.friendList, function(friend, callback) {
				gumerPSN.getProfile(friend.onlineId, function(error, profileData) {
					if (!error) {
            if (profileData.presence.primaryInfo.onlineStatus == "online"){
              console.log('adding ' + friend.onlineId + ' status: ' + profileData.presence.primaryInfo.onlineStatus)
  						onlineFriends += friend.onlineId + ";";
            }
					}
          callback();
				})
			}, function(err){
				if(err){
					console.log(err);
				} else {
					res.send(onlineFriends);
				}
			})
		}
		else {
			if ( (friendsData != undefined) && friendsData.error ) {	// User not found code
        console.log(friendsData.error.message);
        res.send({
					error: true, message: friendsData.error.message
				})
			} else {
        console.log("Something went terribly wrong, submit an issue on GitHub please!");
				res.send({
					error: true, message: "Something went terribly wrong, submit an issue on GitHub please!", response: friendsData
				})
			}
		}
	})
})

// We listen in the port 5000
app.listen(PORT);
