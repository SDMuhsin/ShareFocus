const express = require('express');
const app = express()
const PORT = process.env.PORT || 3000;
const mongoose = require('mongoose');
var cors = require('cors')

mongoose.connect('mongodb+srv://testuser:testuser@cluster0.spwju.mongodb.net/hackathon?retryWrites=true&w=majority', {useNewUrlParser: true, useUnifiedTopology: true});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  // we're connected!
  console.log("Connection succesful");
});
app.use(express.urlencoded({extended: true}));
app.use(express.json()) // To parse the incoming requests with JSON payloads
app.use(cors());

const statSchema = new mongoose.Schema({
    STR: Number,
    INT: Number,
    DEX: Number,
    WIS: Number
  });
const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    stats: statSchema
});
const User = mongoose.model('User', userSchema, "users_global");

// -- FUNCTIONS -- //
function find (name, query, cb) {
    mongoose.connection.db.collection(name, function (err, collection) {
       collection.find(query).toArray(cb);
   });
}
// -- FUNCTIONS -- //

app.get('/', (req,res) => {
    console.log("[ALIVE CHECK]");
    res.send("Alive");
});

app.post('/signup', (req,res) => {

    console.log("SIGN UP");
    console.log("Body :", req.body);
    var user = new User(req.body);
    console.log("User ", user)
    find('users_global', { username : req.body["username"]}, function (err, docs) {
        console.log("Searched for username");
        if(docs){
            if(docs.length){
                console.log("User exists");
                res.status(400).json({msg:"User exists"})
            }else{
                console.log("User not found, making user...");
                user.save(function (err, u) {
                    if (err) {console.error(err);res.status(500).json({msg:"could not save"})}
                    else{
                        console.log("Succesful : ", u);
                        res.status(200).json(u);

                    }
                });
            }
        }
        else{
            res.status(500).json({msg:"error"})
        }
    });
});

app.post("/login", (req,res)=>{
    
    var user = new User(req.body); 
    console.log("User : ",user);
    
    find(   'users_global', 
            {username:req.body["username"],password:req.body["password"]},
            function(err,u){
            if(err){
                console.log(err);
                res.status(500).json(err);
            }else{
                console.log(u);
                if(u.length){
                    console.log("Found");
                    delete u.password;
                    res.status(200).json(u);
                }else{
                    console.log("Not found", u);
                    res.status(400).json({msg:"user not found"});
                } 
            }
            }
    );
});

app.post('/user/update/:id', (req,res)=>{
    console.log("Update user");
    
    /*
        body:
        {
            STR:,
            INT:,
            ...
        }
    */

    User.findOneAndUpdate( {_id: req.params.id} , {
        stats: req.body
    },{
        new: true
      },
    function( err, docs){
        if(err){
            console.log(err);
            res.status(500).json(err);
        }else{
            console.log('Success ? ',docs);
            res.status(200).end();
            
        }
    }
    );
});

// -- TASK --//
const taskSchema = new mongoose.Schema({
    attribute:String,
    username:String,
    description:String,
    active:Number,
    progress:Number,
    createdAt: { type: Date, expires: '5m', default: Date.now }
});
const Task = mongoose.model('Task', taskSchema, "tasks");
// Get task by attr
app.get('/tasks/:attr', (req,res) =>{
    console.log("[GET TASKS] with attribute ", req.params.attr);
    var filter = {}
    if(req.params.attr != "all"){
        filter = {attribute:req.params.attr}
    }
    find('tasks',filter, (err,doc)=>{
            if(err){console.log(err);res.status(500).json(err)}
            else{
                console.log("Found....",doc);
                res.status(200).json(doc);
            }
    });  
});

//Make task
app.post('/tasks/create', (req,res)=>{
    console.log("[MAKE TASK]", req.body);
    const t = new Task(req.body);
    t.save( (err,doc)=>{
        if(err){console.log(err);res.status(500).json(err)}
        else{
            console.log("succesful... ig", doc);
            res.status(200).json(doc);
        }
    })

});

//Update task
app.post('/tasks/update/:id', (req,res)=>{
    console.log("[UPDATE TASK]");
    /* Body
        active: 0/ 1,
        progress : 0 - 15
    */
    Task.findOneAndUpdate( {_id: req.params.id} , {
        active:req.body["active"],
        progress:req.body["progress"]
    },{
        new: true
        },
    function( err, docs){
        if(err){
            console.log(err);
            res.status(500).json(err);
        }else{
            console.log('Success ? ', docs);
            if(docs){
                console.log("Succesfull...probably");
                res.status(200).json(docs);
            }
            else{
                res.status(400).json({msg:"Couldnt find user (id)"});
            }
        }
    }
    );
});

app.delete('/task/:id', (req,res)=>{
    console.log("[DELETE TASK]");
    Task.deleteOne({_id:req.params.id}, (err,doc) =>{
        if(err){
            console.log(err);
            res.status(500).json(err);
        }
        else{
            console.log("Success..ig");
            res.status(200).json(doc);
        }
    }
    );
} );
// -- TASK --//
app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`)
});