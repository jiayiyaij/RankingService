/**
 * Created by jiayi on 17/03/2018.
 */
var mongo_client = require('mongodb').MongoClient;
var math = require("mathjs");
var _ = require("underscore");
var stem = require('stem-porter');
var sw = require('stopword');
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

    m.CalculateOnceADay = function() {
        connectDB(parseWord);
    };

    var connectDB = function(finalCB) {
        mongo_client.connect(mongoURL, function(err, db) {
            if (err) {console.log(err); return; }
            db = db.db("csc575");
            finalCB(db);
        });
    };

    var finalMatrix = null;
    var queryWords = null; // init once, set values everytime when a query comes in
    var similarity = null; // final similarity array
    var articleIndexToDocId = null;

    // key: word,
    // value: {index, tf * idf}
    var wordsMap = {};

    m.Query = function(query) {

        query = query.toLowerCase();

        // fill the word vector with 0
        queryWords.fill(0);

        // change to array
        var queryArray = query.split(/(\s+)/);

        // remove stop words
        queryArray = sw.removeStopwords(queryArray);
        queryArray.sort();

        // stemming & build the query vector
        var lastWord = stem(queryArray[0]);

        var lastCount = 1;
        for (var i = 1; i < queryArray.length; ++i) {
            queryArray[i] = stem(queryArray[i]);
            if (queryArray[i] == ' '){ continue; }
            if (lastWord == queryArray[i]) {lastCount++; continue; }

            if (wordsMap[lastWord] != null)
            { queryWords[wordsMap[lastWord].index] = wordsMap[lastWord].idf * lastCount; }

            lastCount = 1;
            lastWord = queryArray[i];
        }

        // calculate similarity
        cosineSimilar(queryWords, finalMatrix);

        // sort similarity by value
        similarity.sort(function(a,b){
            return b.value - a.value;
        });

        return similarity;
    };

    var simpleSimilar = function(queryVector, docMatrix)
    {
        for (var i = 0; i < similarity.length; ++i) {
            similarity[i] = {};
            similarity[i].doc_id = articleIndexToDocId[i];
            var docVector = docMatrix._data[i];
            similarity[i].value = math.dot(docVector, queryVector);
        }
        return similarity;
    };

    var cosineSimilar = function(queryVector, docMatrix)
    {
        var test0 = [0,0,1,0,0,0];
        var test2 = [1,1,0,1,1,1];
        var testr = math.dot(test0, test2);
        for (var i = 0; i < similarity.length; ++i) {
            similarity[i] = {};
            similarity[i].doc_id = articleIndexToDocId[i];
            var docVector = docMatrix._data[i];

            // dot1,2
            var dot1 = math.dot(docVector, docVector);
            var dot2 = math.dot(queryVector, queryVector);

            similarity[i].value = math.dot(docVector, queryVector);
            similarity[i].value /= Math.sqrt(dot1 * dot2);
        }
        return similarity;
    };

    var parseWord = function(db) {
        db.collection("testwords").find({}).toArray(function(err, result){
            if (err) { console.log(err); return;}

            /// Get all word out of result and construct the final matrix
            finalMatrix = math.zeros(result[0].total_doc_count + 1, result.length);
            similarity = new Array(result[0].total_doc_count + 1);
            articleIndexToDocId = new Array(result[0].total_doc_count + 1);

            // Init query words array
            queryWords = new Array(result.length);

            // Create a map, key is doc_id, value is index of array
            var articleDocIdToIndex = {};

            var articleCount = 0;
            for (var i = 0; i < result.length; ++i){

                // set word info
                wordsMap[result[i].term] = wordsMap[result[i].term] || {};
                wordsMap[result[i].term].idf = result[i].idf;
                wordsMap[result[i].term].index = i;

                // set article map
                _.each(result[i].detail, function(detail){
                    if (articleDocIdToIndex[detail.doc_id] == null) {
                        articleIndexToDocId[articleCount] = detail.doc_id;
                        articleDocIdToIndex[detail.doc_id] = articleCount++;
                    }
                    finalMatrix._data[articleDocIdToIndex[detail.doc_id]][i] = detail.tfidf * detail.count;
//                     if (detail.doc_id == '245') {
//                         console.log(result[i].term, finalMatrix._data[articleDocIdToIndex[detail.doc_id]][i]);
//                     }
                });
            }

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