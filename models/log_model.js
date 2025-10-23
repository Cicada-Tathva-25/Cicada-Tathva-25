const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
    email: {
      type: String,
      unique: true
    },
    start: {
        type: Date
    },
    level1: {
        type: Date
    },
    level2: {
        type: Date
    },
    level3: {
        type: Date
    },
    level4: {
        type: Date
    },
    level5: {
        type: Date
    },
    level6: {
        type: Date
    },
    level7: {
        type: Date
    },
    level8: {
        type: Date
    }
});
  
const Log = mongoose.model("log", logSchema);
  
module.exports = Log;