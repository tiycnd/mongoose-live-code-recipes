const fs = require('fs');
const path = require('path');
const express = require('express');
const mustacheExpress = require('mustache-express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const Recipe = require("./models/recipe");
const recipeRouter = require("./routers/recipe");

const DUPLICATE_RECORD_ERROR = 11000;

const mongoURL = 'mongodb://localhost:27017/recipes';
mongoose.connect(mongoURL, {useMongoClient: true});
mongoose.Promise = require('bluebird');

const app = express();

app.use(bodyParser.urlencoded({extended: true}));

app.engine('mustache', mustacheExpress());
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'mustache')
app.set('layout', 'layout');

app.use('/static', express.static('static'));

// put routes here

app.get('/new/', function(req, res) {
    res.render('new_recipe');
});

app.post('/new/', function(req, res) {
    Recipe.create(req.body).then(function(recipe) {
        res.redirect('/');
    }).catch(function(error) {
        let errorMsg;
        if (error.code === DUPLICATE_RECORD_ERROR) {
            // make message about duplicate
            errorMsg = `The recipe name "${req.body.name}" has already been used.`
        } else {
            errorMsg = "You have encountered an unknown error."
        }
        res.render('new_recipe', {errorMsg: errorMsg});
    })
});

app.use('/:id', recipeRouter);

app.get('/', function(req, res) {
    Recipe.find().then(function(recipes) {
        res.render('index', {recipes: recipes});
    })
})

module.exports = app;
