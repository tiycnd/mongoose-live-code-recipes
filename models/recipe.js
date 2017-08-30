const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    prepTime: {
      type: Number,
      min: [1, 'Prep time must be greater than 0']
    },
    cookTime: {
      type: Number,
      min: [1, 'Cook time must be greater than 0']
    },
    // cookMethod: {
    //   type: String,
    //   enum: ["oven", "microwave", "stovetop"]
    // },
    ingredients: [{
        amount: { type: Number, required: true, default: 1 },
        measure: { type: String, lowercase: true, trim: true },
        ingredient: { type: String, required: true }
    }],
    steps: [String],
    source: {type: String}
})

recipeSchema.methods.findRecipesFromSameSource = function (callback) {
  return this.model('Recipe').find({
    source: this.source,
    _id: {$ne: this._id}
  }, callback);
}

const Recipe = mongoose.model('Recipe', recipeSchema);

module.exports = Recipe;
