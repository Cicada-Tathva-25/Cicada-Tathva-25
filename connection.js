const mongoose=require('mongoose');
require('dotenv').config();

module.exports=()=>{
mongoose.connect(process.env.MONGO_URI);
mongoose.connection.once('open',()=>{
    console.log('Connected');
}).on('error',(err)=>console.log(err));
}