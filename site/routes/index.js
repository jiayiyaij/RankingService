var express = require('express');
var mongo = require('../modules/core_processor.js');
var router = express.Router();


/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Express' });
  mongo.CalculateOnceADay();
});

router.post('/', function(req, res) {
    mongo.Query(req.body.words);
    res.render('result', { title: 'Express' });
});


module.exports = router;
