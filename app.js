const fs = require('fs');
const path = require('path');
const express = require('express');
const mustacheExpress = require('mustache-express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const Recipe = require("./models/recipe");

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

const getRecipe = function(req, res, next) {
    Recipe.findOne({_id: req.params.id}).then(function(recipe) {
        req.recipe = recipe;
        next();
    })
}

app.get('/:id/', getRecipe, function(req, res) {
    const recipe = req.recipe;
    recipe.findRecipesFromSameSource().then(function(otherRecipes) {
        res.render("recipe", {
            recipe: recipe,
            recipesFromSameSource: otherRecipes
        });
    })
})

app.get('/:id/edit/', getRecipe, function(req, res) {
    const recipe = req.recipe;
    addIndexToIngredients(recipe);
    res.render("edit_recipe", {
        recipe: recipe,
        nextIngIndex: recipe.ingredients.length
    });
})

app.post("/:id/edit/", getRecipe, function(req, res) {
    const recipe = req.recipe;
    recipe.name = req.body.name;
    recipe.source = req.body.source;
    recipe.prepTime = req.body.prepTime;
    recipe.cookTime = req.body.cookTime;

    const ingredients = req.body.ingredients.filter(function(ingredient) {
        return (ingredient.amount || ingredient.measure || ingredient.ingredient)
    });

    recipe.ingredients = ingredients;

    const error = recipe.validateSync();

    if (!error) {
        recipe.save();
        res.redirect(`/${recipe._id}/`);
    } else {
        addIndexToIngredients(recipe);
        console.log(error);
        res.render("edit_recipe", {
            recipe: recipe,
            nextIngIndex: recipe.ingredients.length,
            errors: error.errors
        });
    }

})

app.get('/:id/new_ingredient/', function(req, res) {
    Recipe.findOne({_id: req.params.id}).then(function(recipe) {
        res.render("new_ingredient", {recipe: recipe});
    })
})

app.post('/:id/new_ingredient/', function(req, res) {
    Recipe.findOne({_id: req.params.id}).then(function(recipe) {
        recipe.ingredients.push(req.body);
        recipe.save().then(function() {
            res.render("new_ingredient", {recipe: recipe});
        })
    })
})

app.get('/:id/new_step/', function(req, res) {
    Recipe.findOne({_id: req.params.id}).then(function(recipe) {
        res.render("new_step", {recipe: recipe});
    })
})

app.post('/:id/new_step/', function(req, res) {
    Recipe.findOne({_id: req.params.id}).then(function(recipe) {
        recipe.steps.push(req.body.step);
        recipe.save().then(function() {
            res.render("new_step", {recipe: recipe});
        })
    })
})

app.get('/', function(req, res) {
    Recipe.find().then(function(recipes) {
        res.render('index', {recipes: recipes});
    })
})

const addIndexToIngredients = function(recipe) {
    for (let idx = 0; idx < recipe.ingredients.length; idx++) {
        recipe.ingredients[idx].index = idx;
    }
}

module.exports = app;
