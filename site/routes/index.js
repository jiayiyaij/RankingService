var express = require('express');
var mongo = require('../modules/core_processor.js');
var router = express.Router();


/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'CSC575' });
  mongo.CalculateOnceADay();
});

router.post('/', function(req, res) {
    var docs = mongo.Query(req.body.words);
    res.render('index', { result_items: docs });
});


module.exports = router;
