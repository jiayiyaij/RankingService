var express = require('express');
var mongo = require('../modules/core_processor.js');
var router = express.Router();


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
  mongo.Calculate();
});

module.exports = router;
