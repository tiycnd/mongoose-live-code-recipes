const express = require('express');
const Recipe = require("../models/recipe");

const router = express.Router({mergeParams: true});

const getRecipe = function(req, res, next) {
    Recipe.findOne({_id: req.params.id}).then(function(recipe) {
        req.recipe = recipe;
        next();
    })
}

router.use(getRecipe);

router.get('/', function(req, res) {
    const recipe = req.recipe;
    recipe.findRecipesFromSameSource().then(function(otherRecipes) {
        res.render("recipe", {
            recipe: recipe,
            recipesFromSameSource: otherRecipes
        });
    })
})

router.get('/edit/', function(req, res) {
    const recipe = req.recipe;
    addIndexToIngredients(recipe);
    res.render("edit_recipe", {
        recipe: recipe,
        nextIngIndex: recipe.ingredients.length
    });
})

router.post("/edit/", function(req, res) {
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

    if (error) {
        addIndexToIngredients(recipe);
        console.log(error.errors);
        res.render("edit_recipe", {
            recipe: recipe,
            nextIngIndex: recipe.ingredients.length,
            errors: error.errors
        });
    } else {
        recipe.save();
        res.redirect(`/${recipe._id}/`);
    }
})

router.get('/new_ingredient/', function(req, res) {
    res.render("new_ingredient", {recipe: req.recipe});
})

router.post('/new_ingredient/', function(req, res) {
    const recipe = req.recipe;
    recipe.ingredients.push(req.body);
    recipe.save().then(function() {
        res.render("new_ingredient", {recipe: recipe});
    })
})

router.get('/new_step/', function(req, res) {
    res.render("new_step", {recipe: req.recipe});
})

router.post('/new_step/', function(req, res) {
    recipe.steps.push(req.body.step);
    recipe.save().then(function() {
        res.render("new_step", {recipe: recipe});
    })
})

module.exports = router;
