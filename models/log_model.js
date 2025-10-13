
const mongoose=require('mongoose');
const logSchema = new mongoose.Schema({
    email: {
      type: String,
      unique: true
    },
    start: {
        type: Date,
        //default:Date.now()
    },
    // level1: {
    //     type: Date,
    //     //default:Date.now()
    // },
    // level2: {
    //     type: Date,
    //     //default:Date.now()
    // },
    // level3: {
    //     type: Date,
    //     //default:Date.now()
    // },
    // level4: {
    //     type: Date,
    //     //default:Date.now()
    // },
    // level5: {
    //     type: Date,
    //     //default:Date.now()
    // },
    // level6: {
    //     type: Date,
    //     //default:Date.now()
    // },
    // level7: {
    //     type: Date,
    //     //default:Date.now()
    // },
    // level8: {
    //     type: Date,
    //     //default:Date.now()
    // }

    

  });
  
  const Log = mongoose.model("log", logSchema);
  
  module.exports = Log;
