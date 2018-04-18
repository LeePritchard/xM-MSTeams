'use strict';

module.exports.setup = function(app) {
    var builder = require('botbuilder');
    var teams = require('botbuilder-teams');
    var config = require('config');
    var xmatters = require('./xmatters');
    var botConfig = config.get('bot');
    var xmattersConfig = config.get('xmatters');
    const async = require('async');
    const Client = require('node-rest-client').Client;

    var inMemoryStorage = new builder.MemoryBotStorage();
    var savedAddress;
    var savedSession;
    var client = new Client();
    var bodyParser = require('body-parser')
    var jsonParser = bodyParser.json()

    // Initialize the xmatters helper
    xmatters.setup(xmattersConfig.url, //client URL
        xmattersConfig.username, //Client username
        xmattersConfig.password); //Client password

    module.exports.xmatters = xmatters;

    // Create a connector to handle the conversations
    var connector = new teams.TeamsChatConnector({
        appId: botConfig.microsoftAppId,
        appPassword: botConfig.microsoftAppPassword
    });

    // parse application/json
    app.use(bodyParser.json());

    // Setup an endpoint on the router for the bot to listen.
    // NOTE: This endpoint cannot be changed and must be api/messages
    app.post('/api/messages', connector.listen());

    // Endpoint for xmatters to send messages to chat
    app.post('/api/response', respond);

    // Receive messages from the user and respond by echoing each message back (prefixed with 'You said:')
    var bot = new builder.UniversalBot(connector, function (session) {

        savedAddress = session.message.address;
        savedSession = session;

        var text = teams.TeamsMessage.getTextWithoutMentions(session.message);

        // session.send('You said: %s', text);

        var command = text.split(" ")[0];
        var extras = text.split(command+" ")[1];

        switch(command){

            case "help":
                help(extras,session);
                break;                
        }
    }).set('storage', inMemoryStorage); // Register in memory storage;



    // Add dialog to handle 'Engage' button click
    bot.dialog('engageButtonClick', [
        function (session, args, next) {

            var utterance = args.intent.matched[0];
            var engageMethod = /(SMS|E-Mail|Any Method)/i.exec(utterance);
            var engageType = /\b(Critical Incident|Invite to chat)\b/i.exec(utterance);
            var recipientType = /\b(Directly)\b/i.exec(utterance);

             var contactType = session.dialogData.contactType = {
                utterance: utterance,
                endpoint: "engage",
                engageMethod: engageMethod ? engageMethod[0].toLowerCase() : null,
                engageType: engageType ? engageType[0].toLowerCase() : null,
                target: utterance.split(" ")[1] ? utterance.split(" ")[1] : null,
                recipientType: recipientType ? recipientType[0].toLowerCase()+" " : "",
            };

            //TODO: ensure group exists

            if(contactType.engageType){
                next();
            }else{
                var msg = new builder.Message(session);
                msg.attachments([
                    new builder.HeroCard(session)
                        .title("Engagement Type")
                        .subtitle("Choose the type of engagement")
                        .buttons([
                            builder.CardAction.imBack(session, "Engage "+contactType.target+" "+contactType.recipientType+"Critical Incident", "Critical Incident"),
                            builder.CardAction.imBack(session, "Engage "+contactType.target+" "+contactType.recipientType+"Invite to chat", "Invite to chat")
                        ])
                ]);
                session.send(msg).endDialog();
            } 
        },
        function (session, args, next) {
            var contactType = session.dialogData.contactType;
            var utterance = contactType.utterance;

            if(contactType.engageType == "critical incident"){

                var engagePriority = /(High|Medium|Low)/i.exec(utterance);
                contactType.engagePriority = engagePriority ? engagePriority[0].toLowerCase() : null
                session.dialogData.contactType = contactType;

                if(contactType.engagePriority){
                    next();
                }else{
                    var msg = new builder.Message(session);
                    msg.attachments([
                        new builder.HeroCard(session)
                            .title("Incident Priority")
                            .subtitle("Choose the priority of incident")
                            .buttons([
                                builder.CardAction.imBack(session, "Engage "+contactType.target+" "+contactType.recipientType+"Critical Incident with High Priority", "High"),
                                builder.CardAction.imBack(session, "Engage "+contactType.target+" "+contactType.recipientType+"Critical Incident with Medium Priority", "Medium"),
                                builder.CardAction.imBack(session, "Engage "+contactType.target+" "+contactType.recipientType+"Critical Incident with Low Priority", "Low")
                            ])
                    ]);
                    session.send(msg).endDialog();
                } 
            }else{
                next();
            }
        },
        function (session, results) {
            var contactType = session.dialogData.contactType;
            contactType.recipientType = contactType.recipientType.trim();

            if(contactType.engageType == "critical incident"){

                var args = {
                    data: contactType,
                    headers: { "Content-Type": "application/json" }
                };

                xmatters.xmattersInstance.post(xmattersConfig.url + "/api/integration/1/functions/"+xmattersConfig.integrationCodes.engage_incident+"/triggers", args, function (data, response) {
                    session.send(contactType.target+" engaged").endDialog();
                });

            }else{
                savedAddress = session.message.address;
                savedSession = session;
                var direct = true;
                if(contactType.recipientType == ""){
                    direct = false;
                }
                
                engage(contactType.target,session,direct);
            }
        }
    ]).triggerAction({ matches: /(Engage)\s(.*).*/i });


    // Add dialog to handle 'oncall message'
    bot.dialog('oncall', [
        function (session, args, next) {

            console.log(session);

            console.log(JSON.stringify(args,null,2));
            var targets = args.intent.matched[2];

            xmatters.groupsExists(targets, session, bot, builder, function(newTargets,invalidGroups){
                // postInvalidGroups(invalidGroups);
                if(newTargets === ""){
                    return;
                }
                xmatters.onCall(newTargets, function(onCallData){
                    next(onCallData.data);
                })
            });
        },
        function (session, results) {
            console.log(JSON.stringify(results,null,2));

            var onCallArray = [];
            for (var i = results.length - 1; i >= 0; i--) {
                var onCallArray = [];

                var groupMessage = "On call users for "+results[i].group.targetName+"\n\nshift:"+results[i].start+" - "+results[i].end;
                for (var j = results[i].members.data.length - 1; j >= 0; j--) {
                    var member = results[i].members.data[j];

                    onCallArray.push(new builder.HeroCard(session)
                        .title(member.member.targetName)
                        .subtitle(member.member.site.name)
                        .buttons([
                            builder.CardAction.imBack(session, "Engage "+member.member.targetName+" Directly", "Engage Directly"),
                            builder.CardAction.imBack(session, "Engage "+results[i].group.targetName+"", "Engage Team"),
                            builder.CardAction.imBack(session, "confCall "+results[i].group.targetName+"", "Team Conference Call")
                        ]));
                }

                var msg = new builder.Message(session);
                msg.attachmentLayout(builder.AttachmentLayout.carousel);
                msg.text(groupMessage);
                msg.attachments(onCallArray);

                session.send(msg).endDialog();
            }

            
        }
    ]).triggerAction({ matches: /(oncall)\s(.*).*/i });



    // Add dialog to handle 'confCall message'
    bot.dialog('conferenceCall', [
        function (session, args) {

            var targets = args.intent.matched[2];

            xmatters.groupsExists(targets,session, bot, builder, function(newTargets,invalidGroups){

                var postDetails = {
                    headers: { "Content-Type": "application/json" },
                    parameters: { text: newTargets}, // this is serialized as URL parameters
                    data: { text: newTargets }
                };

                xmatters.xmattersInstance.post(xmattersConfig.url+"/api/integration/1/functions/"+ xmattersConfig.integrationCodes.confCall +"/triggers", postDetails, function (data, response) {
                    if(!!data.requestId){

                        var msg = new builder.Message(session);
                        msg.text(newTargets + " has been invited to a conference");
                        msg.textLocale('en-US');
                        bot.send(msg);

                    }
                });
            });
        }
    ]).triggerAction({ matches: /(confCall)\s(.*).*/i });

    // generic functions

    function postToChannel(session, text,type){
        var msg = new builder.Message(session);
        msg.text(text);
        if(!!type){
            console.log(type);
            msg.textFormat(type);
        }
        msg.textLocale('en-US');
        console.log(msg);
        bot.send(msg);
    }

    // command functions

    function getEvents(){
        /**
         * This script is configured to work within the xMatters Integration Builder.
         * Configure the "xMatters" endpoint to use a valid username and password.
         */
        var request = http.request({ 
             "endpoint": "xMatters",
             "path": xmattersConfig.url+"/api/xm/1/events",
             "method": "GET"
         });

        var response = request.write();

        if (response.statusCode == 200 ) {
           json = JSON.parse(response.body);
           console.log("Retrieved events: " + json.count);
        }
    }

    function help(targets,session){
        var helpText = "**You can do the following commands:**\n\n";
        helpText += ". \n\n";
        helpText += "**help:** Displays this help\n\n";
        helpText += "**oncall [group]:** Displays who's on call\n\n";
        helpText += "**engage [group]:** Invite people to the chat\n\n";
        helpText += "**confCall:** Creates a conference bridge\n\n";

        postToChannel(session,helpText,"markdown");
    }

    function engage(targets,session,direct){
        console.log("engage");

        if(!direct){
            xmatters.groupsExists(targets, savedSession, bot, builder, function(newTargets,invalidGroups){

                var args = {
                    headers: { "Content-Type": "application/json" },
                    parameters: { text: newTargets}, // this is serialized as URL parameters
                    data: { text: newTargets }
                };
                client.post(xmattersConfig.url+"/api/integration/1/functions/8a347908-ceb4-4a79-a12b-5a34a476823d/triggers", args, function (data, response) {
                    if(!!data.requestId){
                        postToChannel(session,newTargets + " has been invited to the channel");
                    }
                });
            });
        }else{
            var args = {
                headers: { "Content-Type": "application/json" },
                parameters: { text: targets}, // this is serialized as URL parameters
                data: { text: targets }
            };
            client.post(xmattersConfig.url+"/api/integration/1/functions/8a347908-ceb4-4a79-a12b-5a34a476823d/triggers", args, function (data, response) {
                if(!!data.requestId){
                    postToChannel(session,targets + " has been invited to the channel");
                }
            });
        }
    }

    // Inbound functions
    function respond(req, res, next) {
        var msg = new builder.Message().address(savedAddress);
        msg.text(req.body.text);
        msg.textLocale('en-US');
        bot.send(msg);

        next();
    }

    // Export the connector for any downstream integration - e.g. registering a messaging extension
    module.exports.connector = connector;
};
