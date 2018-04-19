
# xMatters MSTeams integration
Stand alone MSTeams bot coded in NodeJS

<kbd>
  <img src="https://github.com/xmatters/xMatters-Labs/raw/master/media/disclaimer.png">
</kbd>

# Pre-Requisites
* Microsoft Teams bot appID and password
	* This requires you to sign up for an msbot account here (https://dev.botframework.com)
	* Create a bot by going to here (https://dev.botframework.com/bots/new)
* A place to host a NodeJS application
* xMatters account - If you don't have one, [get one](https://www.xmatters.com)!

# Files
* [ExampleCommPlan.zip](ExampleCommPlan.zip) - This is an example comm plan to help get started. 

# How it works
Once this is setup then you can install the application into MS Teams, when a message gets sent to the bot the message gets processed by the NodeJS application and makes the required calls to xMatters and returns a response message.

# Installation
Details of the installation go here. 

## xMatters set up

1. Import a communication plan (link: http://help.xmatters.com/OnDemand/xmodwelcome/communicationplanbuilder/exportcommplan.htm)

2. Create the "MSTeams" Endpoint and add the url for the hosted bot.

3. Create the "MSTeams path" Constant and add the value "/api/response".


## Bot set up

1. Replace all instances of "********-****-****-****-************" with your microsoftAppId.

```
.env:
line 3

manifest.json:
line 5,
line 42,
line 76

default.json:
line 3

```

2. Replace all instances of "-----------------------" with your microsoftAppPassword.

```
.env:
line 4

/config/default.json:
line 4

```

3. Replace all instances of "https://xmatters-url.com" with your xMatters URL.

```

/config/default.json:
line 7

```

4. Add your xMatters rest username and password to /config/default.json

5. update the integration codes in /config/default.json to match the inbound integrations in your xMatters instance.

```
Example:

https://xmatters-url.com/api/integration/1/functions/d0b41e9a-dc8b-4620-93ec-03e96f5cabf8/triggers

Would be "d0b41e9a-dc8b-4620-93ec-03e96f5cabf8"

```

6. Generate the MSTeams installation file by running "gulp" in the route directory.

7. Host the files in a location and run using the following commands:

```

npm install
npm start

```



## MS Teams set up

1. Install the application produced in the previous step.

2. Done.


# Testing
This integration has had some testing but more is required, to do this follow these steps in windows:

1. download the msteams botframework emulator

	https://github.com/Microsoft/BotFramework-Emulator/releases

2. Download the ngrok executable to your local machine.

	https://ngrok.com/

3. Open the emulator's App Settings dialog, enter the path to ngrok, select whether or not to bypass ngrok for local addresses, and click Save.

4. connect to the url (localhost if testing locally)

	https://hosted-site.com/api/messages

5. type in help to get the list of commands

# Development

To run a dev environment locally run:

```

npm run dev

```

This will automatically restart the app when any files are changed.

# GCloud

To deploy your own version run the following command:

	gcloud app deploy --version <your version name> --no-promote
