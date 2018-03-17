/**
 * Created by jiayi on 17/03/2018.
 */
var mongo_client = require('mongodb').MongoClient;
var math = require("mathjs");
var _ = require("underscore");
var mongoURL = "mongodb://34.205.33.211:27017/";


var core_processor = core_processor || {};
module.exports = (function (m) {

    /**
     * word
     * {
     *      "team": word
     *      "detail":
     *          [
     *              {
     *                  "count":
     *                  "tfidf":
     *                  "doc_desc":
     *                  "doc_url":
     *                  "doc_id":
     *               },
     *               {
     *                  ...
     *               }
     *          ],
     *       "df":
     *       "tf":
     *       "idf":
     *       "total_doc_count":
     * }
     * */

    m.Calculate = function() {
        connectDB(parseWord);
    };

    var connectDB = function(finalCB) {
        mongo_client.connect(mongoURL, function(err, cb) {
            if (err) {console.log(err); return; }
            var db = mongo_client.db("csc575");
            finalCB(db);
        });
    };

    var finalMatrix = null;
    var parseWord = function(db) {
        db.collection("words").find({}).toArray(function(err, result){
            if (err) { console.log(err); return;}

            /// Get all word out of result and construct the final matrix
            finalMatrix = math.zeros(result[0].total_doc_count, result.length);

            // Create a map, key is doc_id, value is index of array
            var articleMap = {};

            var articleCount = 0;
            for (var i = 0; i < result.length; ++i){
                _.each(result[i].detail, function(detail){
                    if (articleMap[detail.doc_id] == null) {
                        articleMap[detail.doc_id] = articleCount++;
                    }
                    finalMatrix.subset(math.index(articleMap[detail.doc_id], i), detail.tfidf * detail.count);
                });
            };

            db.close();
            console.log("Finished");
        });
    };

    ///////////////////////////////////////data structure
    ///////////////////////////////////////public variables
    ///////////////////////////////////////private variables
    ///////////////////////////////////////public functions
    ///////////////////////////////////////private functions
    return m;
})(core_processor);