var express = require('express');
var mongo = require('../self_modules/MongoOperation.js');
var router = express.Router();


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
  //mongo.CalculateMatrix();
});

module.exports = router;
