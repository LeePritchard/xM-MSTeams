'use strict';

module.exports.setup = function() {
    var builder = require('botbuilder');
    var teamsBuilder = require('botbuilder-teams');
    var bot = require('./bot');

    bot.connector.onQuery('getEvents', function(event, query, callback) {
        var faker = require('faker');

        // If the user supplied a title via the cardTitle parameter then use it or use a fake title
        var title = query.parameters && query.parameters[0].name === 'eventName'
            ? query.parameters[0].value
            : faker.lorem.sentence();

        // Build the data to send
        var attachments = [];

        // Generate 5 results to send with fake text and fake images
        for (var i = 0; i < 5; i++) {
            attachments.push(
                new builder.ThumbnailCard()
                    .title(title)
                    .text(faker.lorem.paragraph())
                    .images([new builder.CardImage().url(faker.image.image())])
                    .toAttachment());
        }

        // Build the response to be sent
        var response = teamsBuilder.ComposeExtensionResponse
            .result('list')
            .attachments(attachments)
            .toResponse();

        // Send the response to teams
        callback(null, response, 200);
    });

    bot.connector.onQuery('getGroups', function(group, query, callback) {
        var faker = require('faker');
        var xmatters = bot.xmatters;

        // If the user supplied a title via the cardTitle parameter then use it or use a fake title
        var title = query.parameters && query.parameters[0].name === 'groupFilter'
            ? query.parameters[0].value
            : faker.lorem.sentence();


        // Build the data to send
        var attachments = [];

        xmatters.getGroups('',function(groups){

            // console.log(groups);
            console.log(title);
            
            for (var i = groups.data.length - 1; i >= 0; i--) {
                
                if(groups.data[i].targetName.toLowerCase().indexOf(title.toLowerCase()) > -1){
                    attachments.push(
                        new builder.ThumbnailCard()
                        .title(groups.data[i].targetName)
                        .text(groups.data[i].status)
                        // .images([new builder.CardImage().url(faker.image.image())])
                        .toAttachment());
                }


            }

            console.log("groups");

            console.log(attachments);


            var response = teamsBuilder.ComposeExtensionResponse
            .result('list')
            .attachments(attachments)
            .toResponse();

            // Send the response to teams
            callback(null, response, 200);

        })


        // Generate 5 results to send with fake text and fake images
        // for (var i = 0; i < 5; i++) {
        //     attachments.push(
        //         new builder.ThumbnailCard()
        //             .title(title)
        //             .text(faker.lorem.paragraph())
        //             .images([new builder.CardImage().url(faker.image.image())])
        //             .toAttachment());
        // }

        // Build the response to be sent
    });



};
