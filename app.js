const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const app = express();
// let items =[];
// let workItems = [];

app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');
app.use(express.static("public"));

const url = `mongodb+srv://akshat0008:620123Ak@cluster0.h8zwpnt.mongodb.net/todolistDB`;

const connectionParams={
    useNewUrlParser: true,
    // useCreateIndex: true,
    useUnifiedTopology: true 
}
mongoose.connect(url,connectionParams)
    .then( () => {
        console.log('Connected to the database ')
    })
    .catch( (err) => {
        console.error(`Error connecting to the database. n${err}`);
    })

const itemsSchema = new mongoose.Schema({
    name: String
});

const Item = mongoose.model("Item",itemsSchema);

const item1 = new Item({
    name: "Click on the Checkbox to delete:"
});

const defaultItems = [item1];

const listSchema = new mongoose.Schema({
    name: String,
    items: [itemsSchema]
})

const List = mongoose.model("List" , listSchema);



app.get("/" , function(req,res){

    Item.find({},function(err,foundItems){

        if(foundItems.length === 0){
            Item.insertMany(defaultItems , function(err){
                if(err){
                    console.log(err);
                }
                else{
                    console.log("Successfully saved default items to DB");
                }
            })
            res.redirect("/");
        }
        else{
            res.render("list" , {listTitle: "Today" , newItems: foundItems});
        }
    })
})

app.get("/:customListName" , function(req,res){
    const customListName = _.capitalize(req.params.customListName);
    List.findOne({name:customListName} , function(err,results){
        if(err){
            console.log(err);
        }
        else{
            if(!results){
                const list = new List({
                    name: customListName,
                    items: defaultItems
                })
                list.save();
                res.redirect("/"+customListName);
            }
            else{
                res.render("list", {listTitle: results.name , newItems: results.items})
            }
        }
    })
})  

app.post("/" , function(req ,res){
    const item = req.body.item;
    const listName = req.body.list;
    const newItem = new Item({
        name: item
    });
    if(listName==="Today"){
        newItem.save();
        res.redirect("/");
    }
    else{
        List.findOne({name:listName}, function(err,foundList){
            foundList.items.push(newItem);
            foundList.save();
            res.redirect("/"+listName);
        })
    }
})

app.post("/delete" , function(req,res){
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if(listName==="Today"){
        Item.findByIdAndRemove(checkedItemId , function(err){
            if(err){
                console.log(err);
            }
            else{
                console.log("Successfully deleted!")
                res.redirect("/");
            }
        })    
    }
    else{
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err , foundList){
            if(!err){
                res.redirect("/"+listName);
            }
        })
    }

})


app.get("/about" , function(req,res){
    res.render("about");
})


let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function(){
    console.log("Server has started successfully");
})