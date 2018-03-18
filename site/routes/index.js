var express = require('express');
var mongo = require('../modules/core_processor.js');
var router = express.Router();


/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'CSC575' });
});

router.post('/', function(req, res) {
    var docs = mongo.Query(req.body.words);
    res.render('index', { result_items: docs, title: 'CSC575' });
});


module.exports = router;
