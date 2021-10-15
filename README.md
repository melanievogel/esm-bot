# Experience Sampling Bot for Telegram Messenger

The **Experience Sampling Method (ESM)** is a research methodology to gather information about participants of a study over time. Participants are asked to report their thoughts, feelings, behaviour on multiple occasions during the day over a longer period of time. This method can be applied in **clinical contexts** e.g., for testing a medication and its effects during the day.

ESM based studies often require additional devices and a lot of paper work for participants as well as researchers. There may also be native applications for mobile devices on the market, but as a consequence participants need to install an additional application which they need only temporarily. Therefore, this project uses **Instant Messaging (IM)** and conducts the study via a messaging service. **Telegram** was choosen for this project because of its open Bot API. 

This Chatbot conducts a 5-day signal-contigent experience sampling study via Telegram and provides open or closed questions, the participants need to answer.

## Getting Started

First start an instance of mongo db on your machine and then start the bot program. For starting the program, execute the bot.js file via the command node bot.js from the terminal.
Then connect to the bot via Telegram and press start in order to participate in the study. 

## Prerequisites

Node version: v8.9.4
MongoDb version: 2.X

As prefered IDE for nodejs bot development I use Visual Studio Code with integrated terminal.
First, create a new bot token via the botfather in Telegram and paste it into the token variable.
Install the newest verson of mongodb and nodejs. The node module mongoose was used for database operations.

MongoDB must be running before starting bot.js. First start the server *mongod* then *mongo* executable.

## Deployment

The application can be deployed on linux server via *screen* tool. Other possible solutions include platforms such as Heroku or Amazon Web Services.

May be useful for AWS deployment:
https://claudiajs.com/


## License

This project is licensed under the MIT License.

## Acknowledgments

Thanks to mullwar for providing the great telebot api: https://github.com/mullwar/telebot/.
