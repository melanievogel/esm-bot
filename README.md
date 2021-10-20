# Experience Sampling Bot for Telegram Messenger

The **Experience Sampling Method (ESM)** is a research methodology to gather information about participants of a study over time. Participants are asked to report their thoughts, feelings, behaviour on multiple occasions during the day over a longer period of time. This method can be applied in **clinical contexts** e.g., for testing a medication and its effects during the day.

ESM based studies often require additional devices and a lot of paper work for participants as well as researchers. There may also be native applications for mobile devices on the market, but as a consequence participants need to install an additional application which they need only temporarily. Therefore, this project uses **Instant Messaging (IM)** and conducts the study via a messaging service. **Telegram** was choosen for this project because of its open Bot API. 

This Chatbot conducts a 5-day signal-contigent experience sampling study via Telegram and provides open or closed questions, the participants need to answer.

## System Overview

![System Overview](diagrams/systemOverview.png)


## Getting Started

First start an instance of `mongo db` on your machine and then start the bot program. For starting the program, execute the `bot.js` file via 
`node bot.js` from the terminal.
Then connect to the bot via Telegram by searching for the bot's name and press **Start** in order to participate in the study. 

## Prerequisites

* Node version: v8.9.4
* MongoDb version: 2.X
* Mongoose
* Valid authorization token from botfather (How do I create a bot: https://core.telegram.org/bots)

As prefered IDE for nodejs bot development I use Visual Studio Code with integrated terminal.
First, create a new bot **token** via the botfather in Telegram and paste it into the token variable.
Install the latest stable version of **mongodb** and **nodejs**. The node module **mongoose** was used for database operations.

MongoDB must be running before starting bot.js. On Windows OS, first start the server *mongod* then *mongo* executable.
On Linux `sudo systemd start mongod`.

## Deployment

The application can be deployed e.g., on a linux server via *screen* tool.

## Context: Availability Study

This project was part of my bachelor thesis where the use case was to conduct a ESM study for the availability of participants during the day. Availability in this context means the availability to consider taking phone calls or answering text messages during the day. By starting the chatbot, a survey consisting of three parts will be conducted:

### 1. Part: Demographical Data
Like in every research study, first the demographical data of the participants are collected and stored in the database.
The quesions include:
* ...
* ...

### 2. Part: The Questions
The main part consists of repeating questions during the day for a period of 5 days. During the day participants will be asked the same questions to different points in time to get their emotions at that point of time.
The repeating questions include:
* ...
* ...
* ...

### 3. Part: Satisfaction Survey
After the study was conducted the particpants got asked about the over satisfaction with the chatbot. 

The same study set up was done for a control group using a native smartphone application.

## Database model

## Session Handling

## License

This project is licensed under the MIT License.

## Acknowledgments

Thanks to mullwar for providing the great telebot api: https://github.com/mullwar/telebot/.
