var express = require('express');
var mongo = require('../modules/core_processor.js');
var router = express.Router();


/* GET result page. */
router.get('/', function(req, res, next) {
    res.render('result', { title: 'Express' });

});

module.exports = router;
