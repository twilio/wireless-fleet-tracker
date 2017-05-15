# Fleet Tracker
### Connected Fleet Monitoring


## Getting Started
### Installation
In order to get your custom backend up and running you will need a few things installed on your computer:
* [NodeJS](https://nodejs.org/en/)
* [Localtunnel](https://localtunnel.github.io/www/)

****

### Setup

**Configuration**: The Fleet Tracker server talks to the twilio API and our SQLite database. We need to set the correct values for each in our config/config.js file.

The sqlite3 config value should only need to be changed if you want to change the location of your saved database file.

Updated the Twilio config values with your Account SID and Auth Token found in the [Twilio Console](https://www.twilio.com/console).

    "twilio": {
      "account_sid": "xxxx",
      "auth_token": "xxxx"
     }

**NPM Packages**: To install all the needed node packages change directory to the bean counter node directory and install.

    npm install

****

### Running the Server

Now that all setup is complete it's time to run the server. Make sure that you are in the node directory, and run:

  npm start

This will start the server on your computer on port 8000. http://localhost:8000

****

### Connecting the Fleet Tracker to the server

Now that your server is running you'll need to make sure that the Fleet Tracker can connect and send it's data.

**Adding the Fleet Tracker**: First we'll need to add the device to your database. This can be done from the web interface.

1. Go to [your server](http://localhost:8000)
* Click the "Vehicles" link at the top.
* Click the "Add New Vehicle" button to show the device form.
* Enter a name and Twilio SID and click submit.

**Note**: Twilio SID is your sim card SID and can be found in the [Twilio Console](https://www.twilio.com/console).

**Start localtunnel and add the URL to electron**: In order to get the bean counter to talk to your local server we need to install and start localtunnel which will open up your server for requests.

1. Install localtunnel
2. Start localtunnel on port 8000
3. Copy URL generated for use in the next step

        npm install -g localtunnel
        lt --port 8000
          your url is: http://xxxx.localtunnel.me

**Add server info to your Dragonfly code** 
After creating the vehicle on the server you will see a new entry on the "vehicles" page. You will need to add the id and token to your [dragonfly code](../dragonfly/main.cpp). The id and token can be entered on lines 11 and 12 respectively.

    #define DEVICE_ID 0
    #define TOKEN "xxxx"

Add the URL generated from localtunnel in the previous step into your dragonfly code at line 10.

    #define SERVER_URL "http://xxxx.localtunnel.me"


After installing the code changes onto the dragonfly you should seeing data come through on the front page of [your server](http://localhost:8000) when a drive is in progress.

****

### Custom Backend Features

**Dashboard Page**: Lists all vehicles that are currently on a drive and live updates the drive data on the page.

**Single Device Page**: Contains list of past vehicle trips that can be drilled into and the editable vehicle data.

**Add vehicle page**: Allows the user to add new vehicles and shows a table of all the vehicles in the system and their information.
