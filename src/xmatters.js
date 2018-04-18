'use strict';


/*******************************************************
*	
*	xMatters Helper
*
*	Includes various functions help to send and receive
*	information from the clients xMatters instance.
*	
*******************************************************/


var xmatters = {
	// Setup function to establish connection with clients instance.
	setup: function(clientURL,restUsername,restPassword){
	    const Client = require('node-rest-client').Client;

	    this.xMattersEndPoint = clientURL;
	    this.xmattersInstance = new Client({
			user: restUsername,
			password: restPassword
		}); 
	},

	/*******************************************************
	*	
	*	xMatters functions
	*	
	*******************************************************/
	

	/*******************************************************
	*	
	*	function groupsExists(groups,callbackFunc)
	*	 - Check if the group exists with the clients xmatters
	*	   instance.
	*
	*	Input:
	*		groups: Comma seperated groups
	*		callbackFunc: Function to run once complete
	*	Returns:
	*		Calls the callback function with a comma 
	*		seperated groups that exist.
	*	
	*******************************************************/
	groupsExists: function(groups, session, bot, builder, callbackFunc){

		const async = require('async');
		var xmatters = this;
		var asyncTasks = [];
	    var validatedGroups = []
	    var invalidGroups = [];

	    async.eachSeries(groups.split(","), function (groupName, eachcallback) {
            xmatters.xmattersInstance.get(xmatters.xMattersEndPoint+"/api/xm/1/groups/"+groupName, function (data, response) {
        	// xmatters.xmattersInstance.get("http://127.0.0.1/response", function (data, response) {	
                console.log(JSON.stringify(data.message,null,2));
                if(data.message){
                    invalidGroups.push(groupName);
                }else{
                	validatedGroups.push(groupName);    
                }
                eachcallback();
            });
	    }, function (err) {
	      if (err) { throw err; }

	      console.log(xmatters.cleanArray(invalidGroups));
	      console.log(xmatters.cleanArray(validatedGroups));

	      invalidGroups = xmatters.cleanArray(invalidGroups);
	      validatedGroups = xmatters.cleanArray(validatedGroups);

	      var groupError = "";

			if(invalidGroups.length == 1){
	            groupError = "The group '"+invalidGroups.join(",")+"' does not exist.";
	        }
	        if(invalidGroups.length > 1){
	            groupError = "The groups '"+invalidGroups.join(",")+"' do not exist.";
	        }

	        if(groupError != ""){
	        	var msg = new builder.Message(session);
		        msg.text(groupError);
		        msg.textLocale('en-US');
		        bot.send(msg);
	        }

	      	if(validatedGroups.length > 0){
	      		callbackFunc(xmatters.cleanArray(validatedGroups).join(","),xmatters.cleanArray(invalidGroups).join(","));
	      	}

	    });
	},



	/*******************************************************
	*	
	*	function getGroups(groupFilter,callbackFunc)
	*	 - Check if the group exists with the clients xmatters
	*	   instance.
	*
	*	Input:
	*		groupFilter: object with filter criteria
	*		callbackFunc: Function to run once complete
	*	Returns:
	*		Calls the callback function with an array 
	*		of groups
	*	
	*******************************************************/
	getGroups: function(groupFilter,callbackFunc){
		var xmatters = this;
		// TODO: enable filter
        xmatters.xmattersInstance.get(xmatters.xMattersEndPoint+"/api/xm/1/groups/", function (data, response) {
            callbackFunc(data);
        });
	},



	/*******************************************************
	*	
	*	function getEvents(eventFilter,callbackFunc)
	*	 - Check if the group exists with the clients xmatters
	*	   instance.
	*
	*	Input:
	*		groupFilter: object with filter criteria
	*		callbackFunc: Function to run once complete
	*	Returns:
	*		Calls the callback function with an array 
	*		of groups
	*	
	*******************************************************/
	getEvents: function(eventFilter,callbackFunc){
		var xmatters = this;
		// TODO: enable filter
        xmatters.xmattersInstance.get(xmatters.xMattersEndPoint+"/api/xm/1/events/", function (data, response) {
            callbackFunc(data);
        });
	},


	/*******************************************************
	*	
	*	function getCalender(group,callbackFunc)
	*	 - Gets the calender for the group.
	*
	*	Input:
	*		group: group name
	*		callbackFunc: Function to run once complete
	*	Returns:
	*		Calls the callback function with the calender 
	*		data.
	*	
	*******************************************************/
	getCalender: function(groupName,callbackFunc){
		var xmatters = this;
		// TODO: enable filter
        xmatters.xmattersInstance.get(xmatters.xMattersEndPoint+"/api/xm/1/groups/"+ groupName + "/calendar", function (data, response) {
            callbackFunc(data);
        });
	},


	onCall: function(groupName,callbackFunc){
		var xmatters = this;
		// TODO: enable filter
        xmatters.xmattersInstance.get(xmatters.xMattersEndPoint+"/api/xm/1/on-call?groups="+ groupName, function (data, response) {
            callbackFunc(data);
        });
	},


	/*******************************************************
	*	
	*	Generic functions
	*	TODO: move into it's own include.
	*	
	*******************************************************/
	cleanArray: function(actual) {
	  var newArray = new Array();
	  for (var i = 0; i < actual.length; i++) {
	    if (actual[i]) {
	      newArray.push(actual[i]);
	    }
	  }
	  return newArray;
	},
	arr_diff: function(a1, a2) {

	    var a = [], diff = [];

	    for (var i = 0; i < a1.length; i++) {
	        a[a1[i]] = true;
	    }

	    for (var i = 0; i < a2.length; i++) {
	        if (a[a2[i]]) {
	            delete a[a2[i]];
	        } else {
	            a[a2[i]] = true;
	        }
	    }

	    for (var k in a) {
	        diff.push(k);
	    }

	    return diff;
	}

};

module.exports = xmatters;
