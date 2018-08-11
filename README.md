#Telegram Experience Sampling Bot

This bot program conducts a 5-day signal-contigent sampling Experience Sampling Study.
More generally speaking it conducts a survey via Telegram, consisting of questions about your current availability state. This can be open or closed questions.

##Getting Started

First start an instance of mongo db on your machine and then start the bot program. For starting the program, execute the bot.js file via the command node bot.js from the terminal.
Then connect to the bot via Telegram and press start in order to participate in the study. 

##Prerequisites

Node version: v8.9.4
MongoDb version: 2.X

As prefered IDE for nodejs bot development I use Visual Studio Code with integrated terminal.
First, create a new bot token via the botfather in Telegram and paste it into the token variable.
Install the newest verson of mongodb and nodejs. The node module mongoose was used for database operations.

MongoDB must be running before starting bot.js. First start the server *mongod* then *mongo* executable.

##Deployment

The application can be deployed on linux server via *screen* tool. Other possible solutions include platforms such as Heroku or Amazon Web Services.

May be useful for AWS deployment:
https://claudiajs.com/


##License

This project is licensed under the MIT License.

Acknowledgments

Thanks to mullwar for providing the great telebot api: https://github.com/mullwar/telebot/.