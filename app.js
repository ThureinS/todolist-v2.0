//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require('lodash');
const { name } = require("ejs");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todoListDB");

const itemSchema = {
  name: String,
};

const Item = mongoose.model("Item", itemSchema);

const itemOne = new Item({
  name: "Do exercise",
});

const itemTwo = new Item({
  name: "Learn Programming",
});

const itemThree = new Item({
  name: "Learn English",
});

const defaultItems = [itemOne, itemTwo, itemThree];

const listSchema = {
  name: String,
  items: [itemSchema],
};

const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {
  Item.find({}).then((foundItem) => {
    if (foundItem.length === 0) {
      Item.insertMany(defaultItems).then(() => console.log("Success"));
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItem });
    }
  });
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({ name: itemName });

  if (listName == "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }).then((foundList) => {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function (req, res) {
  const checkedItem = req.body.checkbox;
  const deleteList = req.body.deleteList;

  if (deleteList == "Today") {
    Item.findByIdAndDelete(checkedItem)
      .then(res.redirect("/"))
      .catch((err) => {
        console.log(err);
      });
  } else {
    List.findOneAndUpdate(
      { name: deleteList },
      { $pull: {items:{ _id: checkedItem } }}
    ).then(res.redirect("/" + deleteList));
  }
});

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName }).then((result) => {
    if (!result) {
      // Create a new list
      const list = new List({
        name: customListName,
        items: defaultItems,
      });

      list.save();

      res.redirect("/" + customListName);
    } else {
      // Show an existing list
      res.render("list", {
        listTitle: customListName,
        newListItems: result.items,
      });
    }
  });
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
