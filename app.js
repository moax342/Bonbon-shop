require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const MongoClient = require('mongodb').MongoClient;
const nodemailer = require('nodemailer');

const app = express();
//login variable
var isMariaLogedIn = false;
const date = new Date();
const year = date.getFullYear();
//the setting area
//************************************************************************
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

//multer configeration
//******************************************************************************
const storage = multer.diskStorage({
  destination: function(req, res, cb) {
    cb(null, "uploads");
  },
  filename: function(req, res, cb) {
    cb(null, "ItemImage" + Date.now());
  }
});

//multer upload image enshlization
var upload = multer({
  storage: storage
});

//the database variable
var db;
//db config
const url = 'mongodb://localhost:27017';
// Create a new MongoClient
const client = new MongoClient(url, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Use connect method to connect to the Server
client.connect(function(err) {
  if (err) return console.log(err);
  console.log("Connected successfully to server");
  db = client.db('mariadb');
});
//******************************************************************************
//the mail transporter
var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.DB_USER,
    pass: process.env.DB_PASS
  }
});
//the amil opiton wehere te email is comming from

//****************************************************************************
//*************************** the get area ********************************
// the main route show the main page
app.get("/", function(req, res) {
  res.render('first');
});
// the home route where to show all the avialbel product
app.get("/home", function(req, res) {
  //reading the data in the foods table
  client.connect(function(err) {
    if (err) return console.log(err);
    console.log("Connected successfully to server");
    db = client.db('mariadb');
    //the read method from the database
    const collection = db.collection('Foods');
    collection.find({}).toArray(function(err, foods) {

      //loging the value in the food array
      res.render('home', {
        foodItems: foods,
        isLogedIn: isMariaLogedIn
      });
    });
  });
});
//the adding route where to add the food
app.get("/add", function(req, res) {
  res.render('add');
});
//to render the logout page
app.get("/logout", (req, res) => {
  isMariaLogedIn = false;
  res.redirect("home");
});
// the order route where i invoke the find methods to read the database
app.get("/order", function(req, res) {
  res.render('order');
  // sending email to the admin

});
//the variable for the date to be shown in the login footer
app.get("/login", function(req, res) {
  res.render('login', {
    date: year
  });
});

///****************************************************************************
//*************************** the post area ********************************
// to access the add page route
app.post("/log", (req, res) => {
  const email = req.body.Memail;
  const pass = req.body.Mpas;
  //basic outh
  if (email === process.env.ADMIN_USER && pass === process.env.ADMIN_PAS) {
    res.redirect("/add");
    isMariaLogedIn = true;
  }

});
//removeing from the database
app.post("/Delete", (req, res) => {
  const title = req.body.deleteOne;
  client.connect(function(err) {
    if (err) return console.log(err);
    db = client.db('mariadb');
    //the read method from the database
    const collection = db.collection('Foods');
    // Remove a single document
    collection.deleteOne({
      title: title
    }, function(err, r) {
      res.redirect('home');
    });
  });
});
//to send the food order email to the ADMIN
app.post("/orDone", (req, res) => {
  // the felds for the adding
  titel = req.body.orderTitle;
  phone = req.body.orederPhone;
  massage = req.body.orderMassage;
  quantity = req.body.orderQuan;

  const mailOptions = {
    from: process.env.DB_USER, // sender address
    to: process.env.ADMIN_EMAIL, // list of receivers
    subject: titel, // Subject line
    html: " <div style='text-align:center line-spacing:1.5'> <h1> " + massage + "</h1>" + "<br> " + " <h1> الكمية المطلوبة </h1>" + quantity + "<br>" + "<h1>  رقم التلفون </h1>" + phone + "</div>" // plain text body
  };
  //the transporter for the mail
  transporter.sendMail(mailOptions, function(err, info) {
    if (err)
      console.log(err);
    else {
      res.redirect("/home");
    }
  });
});
// the upload method from the form
app.post("/upload", upload.single('foodImage'), (req, res) => {
  //the path for the file to pot it into the finalImg
  var img = fs.readFileSync(req.file.path);

  //the coded image
  var encode_img = img.toString('base64');

  // the objet for the image
  //you can add all the failds you need in the finalImg as bellow
  //****************************************************
  //the image variable
  var finalImg = {
    contentType: req.file.mimetype,
    path: req.file.path,
    image: new Buffer.from(encode_img, 'base64'),
    title: req.body.foodTitle,
    price: req.body.foodPrice,
    content: req.body.foodContent
  };
  //******************************************************

  // insertOne to the database
  db.collection('Foods').insertOne(finalImg, (err, result) => {
    if (err) return console.log(err);
    console.log("saved to the database");
    res.redirect("/add");
  });
});



app.listen(3000, function() {
  console.log("Server started on port 3000");
});
