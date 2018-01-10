/**
 * This file contains all database operations.
 * 
 * @author Melanie Vogel
 * @version 0.9
 */
var mongoose = require("mongoose");

var uristring = 'mongodb://localhost:27017/ESMStudy';

mongoose.connect(uristring, function (err, res) {
  if (err) {
    console.log('ERROR connecting to: ' + uristring + '. ' + err);
  } else {
    console.log('Succeeded connected to: ' + uristring);
  }
});
//Define Schema for each collection
var userSchema = new mongoose.Schema({
  user: {
    chat_id: String,
    age: Number,
    gender: String,
    employment: String,
    register_time: String,
    start_study_time: String,
    start_time: String,
    has_started: Boolean,
    has_finished: { type: Boolean, default: false },
    isValid: { type: Boolean, default: false }
  }
});

var messageSchema = new mongoose.Schema({
  message: {
    chat_id: String,
    msg_id: String,
    schedule_id: String,
    question_id: String,
    question_time: String,
    question_day: String,
    answer: String,
    answer_time: String,
    answer_day: String,
    isValid: Boolean
  }
});

var scheduleSchema = new mongoose.Schema({

  schedule: {
    chat_id: String,
    schedule_start_time: String,
    schedule_time: String,
    schedule_time_utc: Number,
    response_time: String,
    response_time_utc: Number,
    isActive: Boolean,
    isValid: Boolean
  }
});

var tmpActiveQuestionSchema = new mongoose.Schema({
  tmpActiveQuestion: {
    chat_id: String,
    send_msg_id: String,
    rec_msg_id: String,
    sending_time: String,
    question_id: String,
    is_active: { type: Boolean, default: true },
    ask: String,
    has_answered: Boolean
  }
});

var locationAnswerSchema = new mongoose.Schema({
  locationAnswer: {
    chat_id: String,
    answer: String
  }
});
//Add model to corresponding schema
var Message = mongoose.model('Message', messageSchema);
var User = mongoose.model('User', userSchema);
var Schedule = mongoose.model('Schedule', scheduleSchema);
var TmpActiveQuestion = mongoose.model('TmpActiveQuestion', tmpActiveQuestionSchema);
var LocationAnswer = mongoose.model('LocationAnswer', locationAnswerSchema);

module.exports = {
  /**
   * Check if user has finished all schedules
   * @param {String} chat_id 
   * @param {Function} cb callback 
   */
  markUserAsFinished(chat_id, cb) {
    User.findOneAndUpdate({ "user.chat_id": chat_id }, { $set: { "user.has_finished": true } }, { new: false }, function (err, result) {
      if (err) {
        console.log("Error in marking user as finished!");
      } else {
        cb(result);
      }
    });
  },
  /**
   * For checking if user has finished registration process.
   * @param {String} chat_id user identifier
   * @param {Function} cb callback 
   */
  getStartedStatusOfUser(chat_id, cb) {
    User.find({ "user.chat_id": chat_id }, { "user.has_started": 1 }, function (err, result) {
      if (err) {
        console.log("Error finding finished status of user!");
      } else {
        cb(result[0].user.has_started);
      }
    });
  },
  /**
   * For checking if user has finished study
   * @param {String} chat_id 
   * @param {Function} cb callback
   */
  getFinishedStatusOfUser(chat_id, cb) {
    User.find({ "user.chat_id": chat_id }, { "user.has_finished": 1 }, function (err, result) {
      if (err) {
        console.log("Error finding finished status of user!");
      } else {
        if (result.length) {
          cb(result[0].user.has_finished);
        }
      }
    });
  },
  /**
   * All active questions of a active schedule
   * @param {String} chat_id 
   * @param {Function} cb 
   */
  getAllActiveQuestionsToChatId(chat_id, cb) {
    TmpActiveQuestion.find({ "tmpActiveQuestion.chat_id": chat_id }, { "tmpActiveQuestion.rec_msg_id": 1, "tmpActiveQuestion.sending_time": 1 }, function (err, result) {
      if (result.length) {
        cb(err, result);
      }
    });
  },
  /**
   * Store current asked question
   * @param {String} tmpActiveQuestion 
   * @param {Function} cb 
   */
  addTmpActiveQuestion(tmpActiveQuestion, cb) {
    dbtmpActiveQuestion = new TmpActiveQuestion({
      tmpActiveQuestion: tmpActiveQuestion
    }).save(cb);
  },
  /**
   * Set question inactive after 15 minutes
   * @param {String} msg_id 
   * @param {Function} cb 
   */
  setTmpActiveQuestionToInactive(msg_id, cb) {
    TmpActiveQuestion.findOneAndUpdate({ "tmpActiveQuestion.send_msg_id": msg_id }, { $set: { "tmpActiveQuestion.is_active": false } }, function (err, doc) {
      if (err) {
        console.log("Error in setting tmp msg to inactive!");
      } else {
        cb(doc);
      }
    });
  },
  /**
   * 
   * @param {String} chat_id 
   * @param {String} curr_ask 
   * @param {Function} cb 
   */
  getActiveQuestionToChatId(chat_id, curr_ask, cb) {
    TmpActiveQuestion.find({ "tmpActiveQuestion.chat_id": chat_id, "tmpActiveQuestion.ask": curr_ask, "tmpActiveQuestion.has_answered": false }, function (err, result) {
      if (!err) {
        cb(result);
      } else {
        console.log("Error in finding active question!");
      }
    });
  },
  /**
   * 
   * @param {String} global_id 
   * @param {String} rec_msg_id 
   * @param {Function} cb callback
   */
  updActiveQuestionToChatId(global_id, rec_msg_id, cb) {
    TmpActiveQuestion.findOneAndUpdate({ "_id": global_id }, { $set: { "tmpActiveQuestion.has_answered": true, "tmpActiveQuestion.rec_msg_id": rec_msg_id } }, { new: false }, function (err, doc) {
      if (err) {
        console.log("Something went wrong when updating active questions!");
      }
    });
  },
  /**
   * Delete temporary active questions when they are not active anymore (i.e. not answered within 15 min or completely answered)
   * @param {String} chat_id 
   * @param {Function} cb 
   */  
  delActiveQuestionToChatId(chat_id, cb) {
    TmpActiveQuestion.remove({ "tmpActiveQuestion.chat_id": chat_id }, function (err, result) {
      if (!err) {
        cb(result);
      }
    });
  },

  cntActiveQuestionToChatId(chat_id, cb) {
    TmpActiveQuestion.count({ "tmpActiveQuestion.chat_id": chat_id }, function (err, count) {
      if (!err) {
        cb(count > 0);
      } else {
        console.log("Error in counting active question sets!");
      }
    });
  },

  addLocationAnswers(locationAnswer, cb) {
    dbmsg = new LocationAnswer({
      locationAnswer: locationAnswer
    }).save(cb);
  },

  addMessage(message, cb) {
    dbmsg = new Message({
      message: message,
    }).save(cb);
  },

  findMessageAndUpdate(result, schedule_id, cb) {
    Message.findOneAndUpdate({ 'message.msg_id': result.tmpActiveQuestion.rec_msg_id }, { $set: { "message.isValid": true, "message.schedule_id": schedule_id, "message.question_time": result.tmpActiveQuestion.sending_time } }, { multi: true }, function (err, result) {
      if (err) {
        console.log("Error in updating messages after scheduling is complete!");
      } else {
        cb(result);
      }
    });
  },

  countUser(user, cb) {
    User.count({ "user.chat_id": user.chat_id }, function (err, count) {
      cb(err, count > 0);
    });
  },

  getValidStatusOfUser(chat_id, cb) {
    User.find({ "user.chat_id": chat_id }, { "user.isValid": 1 }, function (err, result) {
      if (!err && result.length) {
        cb(result[0].user.isValid);
      }
    });
  },

  delUser(chat_id, cb) {
    User.remove({ "user.chat_id": chat_id }, function (err, doc) {
      if (!err) {
        cb(doc);
      } else {
        console.log("Error in removing user from DB!");
      }
    });
  },

  findUserAndUpdateAsValid(chat_id, cb) {
    User.findOneAndUpdate({ "user.chat_id": chat_id }, { $set: { "user.isValid": true } }, function (err, doc) {
      if (!err) {
        cb(doc);
      } else {
        console.log("Error in setting user as valid!");
      }
    })
  },

  addUserLogs(user, cb) {
    dbmsg = new User({
      user: user,
    }).save(cb);
  },

  findUserAndUpdateAge(user, cb) {
    queryChatId = { "user.chat_id": user.chat_id };
    User.findOneAndUpdate(queryChatId, { $set: { "user.age": user.age } }, { new: false }, function (err, doc) {
      if (err) {
        console.log("Something wrong when updating users age!");
      } else {
        cb(doc);
      }
    });
  },

  findLocationAnswers(chat_id, cb) {
    LocationAnswer.find({ "locationAnswer.chat_id": chat_id }, { "locationAnswer.answer": 1 }, function (err, result) {
      if (err) {
        console.log("Something wrong when querying answers!");
      } else {
        cb(result);
      }
    });
  },

  findUserAndUpdateGender(user, cb) {
    queryChatId = { "user.chat_id": user.chat_id };
    User.findOneAndUpdate(queryChatId, { $set: { "user.gender": user.gender } }, { new: false }, function (err, doc) {
      if (err) {
        console.log("Something wrong when updating users gender!");
      }
    });
  },

  findUserAndUpdateEmployment(user, cb) {
    queryChatId = { "user.chat_id": user.chat_id };
    User.findOneAndUpdate(queryChatId, { $set: { "user.employment": user.employment } }, { new: false }, function (err, doc) {
      if (err) {
        console.log("Something wrong when updating users employment!");
      }
    });
  },

  findUserAndUpdateStartTime(user, cb) {
    queryChatId = { "user.chat_id": user.chat_id };
    User.findOneAndUpdate(queryChatId, { $set: { "user.start_time": user.start_time } }, { new: false }, function (err, doc) {
      if (err) {
        console.log("Something wrong when updating users start_time!");
      } else {
        cb(doc);
      }
    });
  },

  findUserAndUpdateStartStudyTime(user, cb) {
    queryChatId = { "user.chat_id": user.chat_id };
    User.findOneAndUpdate(queryChatId, { $set: { "user.start_study_time": user.start_study_time, "user.has_started": true } }, { new: false }, function (err, doc) {
      if (err) {
        console.log("Something wrong when updating users start_time!");
      }
    });
  },

  cntSchedulesForUser(chat_id, cb) {
    Schedule.count({ "schedule.chat_id": chat_id }, function (err, cnt) {
      if (err) {
        console.log("Error in counting schedules for user!");
      } else {
        cb(cnt);
      }
    });
  },

  cntValidSchedulesForUser(chat_id, cb) {
    Schedule.count({ "schedule.chat_id": chat_id, "schedule.isValid": true }, function (err, cnt) {
      if (err) {
        console.log("Error in counting valid schedules for user!");
      } else {
        cb(cnt);
      }
    });
  },

  cntActiveSchedules(chat_id, cb) {
    Schedule.count({ "schedule.chat_id": chat_id, "schedule.isActive": true, "schedule.isValid": false }, function (err, count) {
      cb(err, count);
    });
  },

  getAllActiveSchedules(chat_id, cb) {
    Schedule.find({ "schedule.chat_id": chat_id, "schedule.isActive": true, "schedule.isValid": false }, function (err, result) {
      cb(err, result);
    });
  },

  setActiveScheduleToInactive(global_id, cb) {
    queryGlobalId = { "_id": global_id };
    Schedule.findOneAndUpdate(queryGlobalId, { $set: { "schedule.isValid": false, "schedule.isActive": false, "schedule.response_time": null } }, { new: false }, function (err, schedule) {
      if (err) {
        console.log("Something went wrong when validating schedule!");
      }
    });
  },

  validateActiveSchedule(global_id, resp_time, resp_time_utc, cb) {
    queryGlobalId = { "_id": global_id };
    Schedule.findOneAndUpdate(queryGlobalId, { $set: { "schedule.isValid": true, "schedule.isActive": false, "schedule.response_time": resp_time, "schedule.response_time_utc": resp_time_utc } }, { new: false }, function (err, schedule) {
      if (err) {
        console.log("Something went wrong when validating schedule!");
      }
    });
  },

  cntStartedStateforUser(chat_id, cb) {
    User.find({ "user.chat_id": chat_id, "user.has_started": true }, function (err, result) {
      cb(err, result.length == 1);
    });
  },

  addScheduleTimes(schedule, cb) {
    dbmsg = new Schedule({
      schedule: schedule
    }).save(cb);
  },

  getAllUsersChatIdAndStartTime(cb) {
    User.find({ "user.has_finished": false, "user.has_started": true }, { "user.chat_id": 1, "user.start_time": 1 }, function (err, result) {
      cb(err, result);
    });
  },

  addLocationIfNotExists(chat_id, location, cb) {
    var that = this;
    LocationAnswer.findOne({ "locationAnswer.chat_id": chat_id, "locationAnswer.answer": location }, function (err, result) {
      if (err) {
        console.log("Something went wrong!")
      } else if (!result) {
        that.addLocationAnswers({
          chat_id: chat_id,
          answer: location
        }, function (err, location, numAffected) {
          if (err) {
            console.log("Error in adding user specific location!");
          }
        });
      } else {
        console.log(location, "is already in DB");
      }
    });
  },
}
