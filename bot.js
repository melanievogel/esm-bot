/**
 * This file includes the conversation logic.
 * 
 * Supported by Telebot API: https://github.com/mullwar/telebot
 * 
 * @author Melanie Vogel
 * @version 0.9
 */

require('./web.js');

const TeleBot = require('telebot');
const moment = require('moment-timezone');

const testToken = 'your_testToken';
const prodToken = 'your_prodToken';

const bot = new TeleBot({
    token: prodToken,
    //token: testToken,
    usePlugins: ['askUser'],
});

const family_friends = "How available are you at the moment for <b>family/friends</b>? \n \n <i>1 = highly unavailable \n 9 = highly available</i>";
const colleagues_students = "How available are you at the moment for <b>colleagues/fellow students</b>? \n \n <i>1 = highly unavailable \n 9 = highly available</i>";
const other_contacts = "How available are you at the moment for <b>other contacts</b>? \n \n <i>1 = highly unavailable \n 9 = highly available</i>";
const where = "Where are you at the moment?";
const where_other = "Where else are you at the moment?";
const current_task = "Your current task is mostly related...";

var cron = require('node-cron');
var db = require('./db');

var datenow = new Date();
var daynow = datenow.getDay();
var tag = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

/**
 * Every hour at minute 0, the cron job starts. 
 * This is executed from the moment on the application was started from the server. 
 * Loads all users in DB and check for each user if start_time +8 hours is in the range and calculates random time to trigger prompts.
 */
cron.schedule('*/1 * * * *', function () {
 var start_scheduling_time = moment().format('HH:mm:ss');
 console.log("Started scheduling at: ", start_scheduling_time);
   db.getAllUsersChatIdAndStartTime(function(err, result){
     var current_time = moment().format('HH:mm');

     for(var i = 0; i < result.length; i++){
       var start_time = moment.utc(result[i].user.start_time, 'HH:mm').format('HH:mm');
       var end_time = moment.utc(result[i].user.start_time, 'HH:mm').add(prompt_counter,'hour').format('HH:mm');

       needsToBeScheduled(current_time, start_time, end_time, function(needsToBeScheduled){
         if(needsToBeScheduled){
           randomizeAskingInHour(result[i].user.chat_id, start_scheduling_time, function(random_time){
             console.log("Randomized study for ", result[i].user.chat_id , " to", random_time);
           });
         }
       });
     }
   });
});

//Prompts per day. 
const prompt_counter = 4;

/**
 * Checks if user needs to be scheduled based on current time and user specific start time. 
 * End time is 8 hours later than start time.
 * @param {String} current_time actual time.
 * @param {String} start_time user-specific start time each day.
 * @param {String} end_time time of last prompt of the day (in this case 8 hours later than start time).
 * @param {Function} cb callback function.
 */
function needsToBeScheduled(current_time, start_time, end_time, cb){
  var isInRange = false;

  if (end_time < start_time ){
    isInRange = current_time >= start_time || current_time < end_time;
  } else {
    isInRange = current_time >= start_time && current_time < end_time;
  }

  cb(isInRange);
}
//Number of schedules for the study for each user
const max_schedules = 4;
//User has 15 minutes to answer a set of questions
const max_answer_time_in_ms = 30000;

/**
 * Manages the scheduling of prompts per user.
 * @param {Number} chat_id user specific id, equal to user_id
 * @param {String} start_scheduling_time 
 * @param {Function} cb callback function 
 */
function randomizeAskingInHour(chat_id, start_scheduling_time, cb){
  
  //generates random time between 15 and 60 minutes
  //var random = Math.floor(Math.random() * (3600000 - 900000 + 1)) + 900000;
  var random = Math.floor(Math.random() * (60000 - 0 + 1)) + 0;
        setTimeout(function () {
            const replyMarkup = bot.keyboard([
                ['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9']
            ], { resize: true, once: true });

            db.cntActiveQuestionToChatId(chat_id, function(hasAnActiveQuestion){
              // check if there are any temp messages in db, if so user has not successfully finished scheduling
              if(hasAnActiveQuestion){
                db.getAllActiveSchedules(chat_id, function(err, result){
                  // only one active schedule should exist in db
                  if(result.length==1){
                    db.setActiveScheduleToInactive(result[0]._id);
                  }
                });
                //deletes temporary question
                db.delActiveQuestionToChatId(chat_id, result => {
                });
              }

              db.cntSchedulesForUser(chat_id, cnt => {

                if(cnt < max_schedules){
                  return bot.sendMessage(chat_id, `${family_friends}`, { ask: 'colleagues_students' }, {parseMode:'html',replyMarkup }).then(function(sent){
                    db.addTmpActiveQuestion({
                      chat_id: chat_id,
                      send_msg_id: sent.result.message_id,
                      sending_time: sent.result.date,
                      question_id: 'family_friends',
                      ask: 'colleagues_students',
                      has_answered: false
                    }, (err, tmpActiveQuestions, numAffected) => {
                      if(numAffected == 1){
                        setTimeout(function(){
                          console.log("set inactive time to :" + max_answer_time_in_ms);
                          db.setTmpActiveQuestionToInactive(sent.result.message_id, tmpActiveQuestion => {
                          });
                        }, max_answer_time_in_ms);
                      }
                    });

                    db.addScheduleTimes({
                      chat_id: chat_id,
                      schedule_start_time: start_scheduling_time,
                      schedule_time: moment.unix(sent.result.date).toDate(),
		                  schedule_time_utc: sent.result.date,
                      isActive: true,
                      isValid: false
                    });

                    }).catch(function (err) {
                      console.log(err);
                    });
                }else{
                  db.markUserAsFinished(chat_id, function(result){
                    return bot.sendMessage(chat_id, "You successfully finished ESM Study!").then(function(sent){
                      return bot.sendSticker(chat_id, "CAADAgADbAcAAnlc4glBtH79NabspgI").then(function(sent){
                      return bot.sendMessage(chat_id, "Please follow the link to the feedback questionnaire: <your url>");                                          
                      });
                    });
                  });
                }
                  });
            });
        }, random);
      cb(random);
}
//For user validation
bot.on(['/start'], msg => {
    db.countUser({
      chat_id: msg.from.id
    }, (err, userIsAlreadyInDb) => {
      if (userIsAlreadyInDb){
        db.getValidStatusOfUser(msg.from.id, userIsValid => {
          if(userIsValid){
            const replyMarkup = bot.keyboard([
                ['Continue study']
            ], { resize: true, once: true });
            return bot.sendMessage(msg.from.id, `Thank you. Please press the button below to continue Experience Sampling. You will receive randomized prompts from now on. `, { replyMarkup });
          } else {
            db.delUser(msg.from.id, cb => {
              return bot.sendMessage(msg.from.id, "Something went wrong at registration process. Please enter /start to start registration process again!");
            });
          }
        });
      }else{
        db.addUserLogs({
          chat_id: msg.from.id, register_time: new Date()
        });
        return bot.sendMessage(msg.from.id, `<b>Hello and Welcome in this Study!</b>\n\nI need some demographic information from you before the study can start.\n\nSo, how old are you?`, {ask: 'age'},{parseMode:'html'});
      }
    });
});

bot.on('ask.age', msg => {
  if(msg.text != "/start"){
    const age = Number(msg.text);
    const id = msg.from.id;

    const replyMarkup = bot.keyboard([
        ['male'],['female'],['no answer']
    ], { resize: true, once: true });

    if (!age || age > 80 || age < 18) {
        return bot.sendMessage(msg.from.id, 'Incorrect age. Please, try again!', { ask: 'age' });
    } else {
        db.findUserAndUpdateAge({
          chat_id: msg.from.id, age: msg.text
        }, doc => {
          return bot.sendMessage(msg.from.id, `Please state your gender.`, {ask: 'gender'}, {replyMarkup});
        });
    }
  }
});

bot.on('ask.gender', msg => {
  if(msg.text != "/start"){
    const replyMarkup = bot.keyboard([
        ['Student'], ['Pupil'],['Employee'],['Other']
    ], { resize: true, once: true });

    if (msg.text == 'female' || msg.text == 'male' || msg.text == 'no answer') {
        db.findUserAndUpdateGender({
          chat_id: msg.from.id, gender: msg.text
        })

        return bot.sendMessage(msg.from.id, `What is your current occupation?` ,{ ask: 'occupation' }, {replyMarkup});
    }
  }
});

bot.on('ask.occupation', msg => {
  if(msg.text != "/start"){
    if(msg.text == "Other"){
      return bot.sendMessage(msg.from.id, 'What else is your occupation?', {ask: 'occupation'});
    }else{
        db.findUserAndUpdateEmployment({
          chat_id: msg.from.id, employment: msg.text
        })

        return bot.sendMessage(msg.from.id, `When may I ask you the first question of the day?
        \n(<b>HH:MM</b> and <b>24h</b> convention.)
        \nFrom this time forward you will receive the prompts in an randomized order.
        \n<i>It is important that from this time on you are awake for at least 8h!</i> `,{ ask: 'start_time' },{parseMode:'html'});
    }
  }
});

bot.on('ask.start_time', msg => {
    if(msg.text != "/start"){
      const start_time = /([01]\d|2[0-3]):?([0-5]\d)/;

      if (!msg.text.match(start_time)) {
          return bot.sendMessage(msg.from.id, 'Incorrect time, please try again', { ask: 'start_time' });
      } else {
          const replyMarkup = bot.keyboard([
              ['Start study']
          ], { resize: true, once: true , remove: true});

          db.findUserAndUpdateStartTime({
            chat_id: msg.from.id, start_time: msg.text
          }, doc => {
            db.findUserAndUpdateAsValid(msg.from.id, doc =>{
              return bot.sendMessage(msg.from.id, `Thank you. Please press the button below to start Experience Sampling.\n\nYou do not need to do anything else for now.\nI will send you notifications when it is time to participate. `, { replyMarkup });
            });
          });
      }
    }
});

bot.on('*', msg => {
    if (msg.text == 'Start study') {
      db.getFinishedStatusOfUser(msg.from.id, function(hasAlreadyFinished){
        db.getStartedStatusOfUser(msg.from.id, function(hasAlreadyStarted){
          if(!hasAlreadyFinished && hasAlreadyStarted){
                return bot.sendMessage(msg.from.id, "You already started study ! Please wait for the next scheduling!");
          }else if (hasAlreadyFinished && hasAlreadyStarted){
                return bot.sendMessage(msg.from.id, "You already finished ESM Study!").then(function(sent){
                  return bot.sendSticker(msg.from.id, "CAADAgADbAcAAnlc4glBtH79NabspgI");
                });
          }else if(!hasAlreadyFinished && !hasAlreadyStarted){
                db.findUserAndUpdateStartStudyTime({
                  chat_id: msg.from.id, start_study_time: new Date()
                });
                console.log("Start ESM Study for user " + msg.from.id + " at:" + new Date);
          }
        });
      });
    }

    if (msg.text == "Continue study") {
      db.getFinishedStatusOfUser(msg.from.id, function(hasAlreadyFinished){
        if(!hasAlreadyFinished){
          return bot.sendMessage(msg.from.id, "You already started study ! Please wait for the next scheduling!");
        }else{
          return bot.sendMessage(msg.from.id, "You already finished ESM Study! Thank you!");
        }
      });
    }
});

bot.on('/stats', msg =>{
  db.cntSchedulesForUser(msg.from.id, cntSchedules =>{
    if(cntSchedules == 0){

      return bot.sendMessage(msg.from.id, "Sorry, you haven't answered a set of questions yet.").then(function(){
        return bot.sendSticker(msg.from.id, "CAADAgADgwEAAs-71A7p47jMpydhmAI");
      });

    }
      db.cntValidSchedulesForUser(msg.from.id, cntValidSchedules => {
        return bot.sendMessage(msg.from.id, "Your response quote is: " + Math.round((cntValidSchedules/cntSchedules)*100,2) +"%").then(function(){
          if((cntValidSchedules/cntSchedules)*100 > 50){
            return bot.sendMessage(msg.from.id, "Great! Keep it up!").then(function(){
            return bot.sendSticker(msg.from.id, "CAADAgADxQIAAu7EoQoTcYSb4vhhXAI");
          });
        }else{
          return bot.sendMessage(msg.from.id, "Your quote could be higher.").then(function(){
          return bot.sendSticker(msg.from.id, "CAADAgADsAYAAhhC7giXbgl2p0RtoAI");
        });
      }
      });
  });
});
});

/** 
 * After 15 minutes the sended message is set to inactive.
 * @param {Object} sent sended message of bot 
 * @param {Function} cb callback function 
 */
function setTimeoutToSetTmpActiveQuestionInactive(sent, cb){
  setTimeout(function(){
    db.setTmpActiveQuestionToInactive(sent.result.message_id, (tmpActiveQuestion) => {
    });
  }, max_answer_time_in_ms);
}

/**
 * Save user answers
 * @param {String} msg message received from user as answer
 * @param {Number} question_time_unix time of question was asked 
 * @param {String} question_id question identifier
 * @param {Boolean} is_valid if question was answered
 * @param {Function} cb callback function 
 */
function addMessage(msg, question_time_unix, question_id, is_valid, cb){
  db.addMessage({
    chat_id: msg.from.id,
    msg_id: msg.message_id,
    question_id: question_id,
    question_time: moment.unix(question_time_unix).tz('Europe/Berlin').toDate(),
    question_day: moment.unix(question_time_unix).tz('Europe/Berlin').format('dddd'),
    answer: msg.text,
    answer_time: moment.unix(msg.date).tz('Europe/Berlin').toDate(),
    answer_day: moment().format('dddd'),
    isValid: is_valid
  }, (err, addMsg, numAffected) => {
    cb(err, addMsg, numAffected);
  });
}
/**
 * Save temporary question
 * @param {String} msg message send from user
 * @param {String} sent message send from bot
 * @param {String} question_id identifier of question
 * @param {String} ask question that will be asked after this question
 * @param {Boolean} has_answered if question is answered within 15 minutes
 * @param {Function} cb callback function
 */
function addTmpActiveQuestion(msg, sent, question_id, ask, has_answered, cb){
  db.addTmpActiveQuestion({
    chat_id: msg.from.id,
    send_msg_id: sent.result.message_id,
    sending_time: sent.result.date,
    question_id: question_id,
    ask: ask,
    has_answered: has_answered
  }, (err, addTmpQuestion, numAffected) => {
    cb(err, addTmpQuestion, numAffected);
  });
}

bot.on('ask.colleagues_students', msg => {
    //Check if user is answering to correct question
    db.getActiveQuestionToChatId(msg.from.id, "colleagues_students", result => {
      if(result.length == 1){
        var question_time_unix = result[0].tmpActiveQuestion.sending_time;
         // there exists exactly one open question for the user
         if(result[0].tmpActiveQuestion.is_active){
           const answer = Number(msg.text);
           if (!answer || answer < 1 || answer > 9) {
               return bot.sendMessage(msg.from.id, `Please try again and use numbers between 1 and 9 to express your current degree of interruptibility. `, {parseMode:'html'},{ ask: 'colleagues_students' });
           } else {
             db.updActiveQuestionToChatId(result[0]._id, msg.message_id);
               addMessage(msg, question_time_unix, 'family_friends', false, (err, addMsg, numAffected) => {
                 if(numAffected == 1){
                   const replyMarkup = bot.keyboard([
                       ['1', '2', '3'],['4', '5', '6'],['7', '8', '9']
                   ], { resize: true, once: true });

                   return bot.sendMessage(msg.from.id, `${colleagues_students}`, { ask: 'other_contacts' }, {parseMode:'html', replyMarkup }).then( sent => {
                     addTmpActiveQuestion(msg, sent, 'colleagues_students', 'other_contacts', false, (err, tmpActiveQuestion, numAffected) => {
                       if(numAffected == 1){
                         setTimeoutToSetTmpActiveQuestionInactive(sent, (tmpActiveQuestion) => {
                         });
                       }
                     });
                   }).catch(function(err){
                     console.log(err);
                   });
                 }
               });
           }
         }else{
           return bot.sendMessage(msg.from.id, "Sorry, your answer was to late! Wait for the next schedule, please!");
         }
      }else{
      }
    });
});

bot.on('ask.other_contacts', msg => {
  db.getActiveQuestionToChatId(msg.from.id, "other_contacts", result => {
    if(result.length == 1){
      var question_time_unix = result[0].tmpActiveQuestion.sending_time;

      if(result[0].tmpActiveQuestion.is_active){
        const answer = Number(msg.text);

        if (!answer || answer < 1 || answer > 9) {

            return bot.sendMessage(msg.from.id, `Please try again and use numbers between 1 and 9 to express your current degree of interruptibility. `, { ask: 'other_contacts' })

        } else {
            db.updActiveQuestionToChatId(result[0]._id, msg.message_id);
            addMessage(msg, question_time_unix, 'colleagues_students', false, (err, addMsg, numAffected) => {
              if(numAffected == 1){
                const replyMarkup = bot.keyboard([
                    ['1', '2', '3'],['4', '5', '6'],['7', '8', '9']
                ], { resize: true, once: true });

                return bot.sendMessage(msg.from.id, `${other_contacts}`, { ask: 'where' }, {parseMode:'html', replyMarkup }).then( sent => {
                  addTmpActiveQuestion(msg, sent, 'other_contacts', 'where', false, (err, tmpActiveQuestion, numAffected) => {
                    if(numAffected == 1){
                      setTimeoutToSetTmpActiveQuestionInactive(sent, (tmpActiveQuestion) => {
                      });
                    }
                  });
                }).catch(function(err){
                  console.log(err);
                });
              }
            });
        }
      }else{
        return bot.sendMessage(msg.from.id, "Sorry, your answer was to late! Wait for the next schedule, please!");
      }
  }else{
  }
});
});

bot.on('ask.where', msg => {
  db.getActiveQuestionToChatId(msg.from.id, "where", result => {
    if(result.length == 1){
      var question_time_unix = result[0].tmpActiveQuestion.sending_time;
      const answer = Number(msg.text);

      if(result[0].tmpActiveQuestion.is_active){
        if (!answer || answer < 1 || answer > 9) {
            return bot.sendMessage(msg.from.id, `Please try again and use numbers between 1 and 9 to express your current degree of interruptibility. `, { ask: 'where' })
        } else {
          db.updActiveQuestionToChatId(result[0]._id, msg.message_id);

          addMessage(msg, question_time_unix, 'other_contacts', false, (err, addMsg, numAffected) =>{
            if(numAffected == 1){
              const replyMarkup = bot.keyboard([
                  ['At my/family\'s/friend\'s home'], ['At work/university/school'],
                  ['On the go'], ['Somewhere else']
                  //,[bot.button('location', 'Your location')]
                ], { resize: true, once: true });

              return bot.sendMessage(msg.from.id, `${where}`, { ask: 'current_task' },{replyMarkup}).then(sent => {
                addTmpActiveQuestion(msg, sent, 'where', 'current_task', false, (err, tmpActiveQuestions, numAffected)=>{
                  if(numAffected == 1){
                    setTimeoutToSetTmpActiveQuestionInactive(sent, (tmpActiveQuestion) => {
                    });
                  }
                });
              }).catch(function(err){
                  console.log(err);
              });
            }
          });
        }
      }else{
        return bot.sendMessage(msg.from.id, "Sorry, your answer was to late! Wait for the next schedule, please!");
      }
  }else{

  }
});
});

bot.on('ask.current_task', msg => {
  db.getActiveQuestionToChatId(msg.from.id, "current_task", result => {
    if(result.length == 1){
      var question_time_unix = result[0].tmpActiveQuestion.sending_time;

      if(result[0].tmpActiveQuestion.is_active){
        if (msg.text == 'Somewhere else') {
          db.findLocationAnswers(msg.from.id, result => {
            var locationAnswers = [];

            if(result.length){
              for(var i = 0; i < result.length; i++){
                locationAnswers.push(result[i].locationAnswer.answer);
              }
            }

            const replyMarkup = bot.keyboard(
              locationAnswers.map((x, xi) => (
                [x]
              )), { resize: true, once: true});

            return bot.sendMessage(msg.from.id, `${where_other}`, { ask: 'current_task' }, {replyMarkup} );
          });
        } else if(msg.text != "Somewhere else" && msg.text != "At my/family\'s/friend\'s home" && msg.text != "On the go" && msg.text != "At work/university/school"){
            db.addLocationIfNotExists(msg.from.id, msg.text);
            addMessage(msg, question_time_unix, 'where', false, (err, addMsg, numAffected) =>{
              if(numAffected == 1){
                db.updActiveQuestionToChatId(result[0]._id, msg.message_id);

                const replyMarkup = bot.keyboard([
                    ['...to my private and social life.'],[ '...to my work or education.'],
                    ['...to something else.']
                ], { resize: true, once: true });

                return bot.sendMessage(msg.from.id, `${current_task}`, {ask: 'thanks'}, { replyMarkup }).then( sent => {
                  addTmpActiveQuestion(msg, sent, 'current_task', 'thanks', false, (err, tmpActiveQuestions, numAffected) =>{
                    if(numAffected == 1){
                      setTimeoutToSetTmpActiveQuestionInactive(sent, (tmpActiveQuestion) => {
                      });
                    }
                  });
                }).catch(function(err){
                  console.log(err);
                });
              }
            });
        }else{
          addMessage(msg, question_time_unix, 'where', false, (err, addMsg, numAffected) => {
            if(numAffected == 1){
              db.updActiveQuestionToChatId(result[0]._id, msg.message_id);

              const replyMarkup = bot.keyboard([
                  ['...to my private and social life.'],[ '...to my work or education.'],
                  ['...to something else.']
              ], { resize: true, once: true });

              return bot.sendMessage(msg.from.id, `${current_task}`, {ask: 'thanks'}, { replyMarkup }).then(function(sent){
                addTmpActiveQuestion(msg, sent, 'current_task', 'thanks', false, (err, tmpActiveQuestion, numAffected) => {
                  if(numAffected == 1){
                    setTimeoutToSetTmpActiveQuestionInactive(sent, (tmpActiveQuestion) => {
                    });
                  }
                });
              }).catch(function(err){
                console.log(err);
              });
            }
          });
      }
    }else{
      return bot.sendMessage(msg.from.id, "Sorry, your answer was to late! Wait for the next schedule, please!");
    }
  }else{
  }
});
});

bot.on('ask.thanks', msg => {
  db.getActiveQuestionToChatId(msg.from.id, "thanks", result => {
    if(result.length == 1){
      var question_time_unix = result[0].tmpActiveQuestion.sending_time;

      if(result[0].tmpActiveQuestion.is_active){
        if (msg.text == '...to my private and social life.' || msg.text == '...to my work or education.' || msg.text == '...to something else.') {
            db.updActiveQuestionToChatId(result[0]._id, msg.message_id);

            addMessage(msg, question_time_unix, 'current_taks', false, (err, addMsg, numAffected) => {
              if(numAffected == 1){
                return bot.sendMessage(msg.from.id, `Thank you! \nSee /stats for your current response quote!`).then(function(sent){
                  // User has reached the last question, so no answer is needed

                db.getAllActiveSchedules(msg.from.id, function(err, activeSchedules){
                  if (activeSchedules.length == 1){
                    db.validateActiveSchedule(activeSchedules[0]._id, moment.unix(msg.date).toDate(), msg.date);


                    db.getAllActiveQuestionsToChatId(msg.from.id, function(err, result){
                      for(var i = 0;i<result.length;i++){
                        db.findMessageAndUpdate(result[i], activeSchedules[0]._id,  result => {
                        });
                      }
                      db.delActiveQuestionToChatId(msg.from.id, function(err, result){
                        db.cntSchedulesForUser(msg.from.id, cnt => {
                          if(cnt == max_schedules){
                            db.markUserAsFinished(msg.from.id, result =>{
                              return bot.sendMessage(msg.from.id, "You successfully finished ESM Study!").then(function(){
                                return bot.sendSticker(msg.from.id, "CAADAgADbAcAAnlc4glBtH79NabspgI").then(function(sent){
                                return bot.sendMessage(msg.from.id, "Please follow the link to the feedback questionnaire: <your url>");                                          
                                });
                              });
                            });
                          }
                        });
                      });
                    });
                  }
                });
                }).catch(function(err){
                console.log(err);
                });
              }
            });
        }else{
          const replyMarkup = bot.keyboard([
            ['...to my private and social life.'],[ '...to my work or education.'],
            ['...to something else.']
          ], { resize: true, once: true });
          return bot.sendMessage(msg.from.id, "Sorry, please choose a answer from the buttons below", {ask:'thanks'}, {replyMarkup})
        }
      }else{
        return bot.sendMessage(msg.from.id, "Sorry, your answer was to late! Wait for the next schedule, please!");
      }
    }else{
    }
});
});

//End of round
bot.start();