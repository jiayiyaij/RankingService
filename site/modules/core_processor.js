/**
 * Created by jiayi on 17/03/2018.
 */
var mongo_client = require('mongodb').MongoClient;
var math = require("mathjs");
var _ = require("underscore");
var stem = require('stem-porter');
var sw = require('stopword');
var mongoURL = "mongodb://34.205.33.211:27017/";
var wordTableName = "words"; //testwords


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
    var articleIndexToDoc = null;
    var kWordCount = 0;
    var kDocCount = 0;

    // key: word,
    // value: {index, tf * idf}
    var wordsMap = {};

    m.Query = function(query) {

        query = query.toLowerCase();

        // fill the word vector with 0
        //queryWords.fill(0);
        queryWords = math.zeros(1, kWordCount, 'sparse');

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
            { queryWords.set([0, wordsMap[lastWord].index], wordsMap[lastWord].idf * lastCount); }

            lastCount = 1;
            lastWord = queryArray[i];
        }

        // calculate similarity
        similarity = cosineSimilar(queryWords, finalMatrix);

        // sort similarity by value
        math.sort(similarity, function(a, b) {
            return b.value - a.value;
        });

        return similarity.map(function(v) {return v.doc;});
    };

    var simpleSimilar = function(queryVector, docMatrix)
    {
        for (var i = 0; i < similarity.length; ++i) {
            similarity[i] = {};
            similarity[i].doc = articleIndexToDoc[i];
            var docVector = docMatrix.subset([i]);
            similarity[i].value = math.dot(docVector, queryVector);
        }
        return similarity;
    };

    var cosineSimilar = function(queryVector, docMatrix)
    {
        var transposeDocMatrix = math.transpose(docMatrix);
        var alldot = math.multiply(queryVector, transposeDocMatrix);

        var selfDot1 = math.zeros(1, docMatrix.size()[0], 'sparse');
        docMatrix = math.dotMultiply(docMatrix, docMatrix);

        docMatrix.forEach(function(value, index, m){
            selfDot1.set([0,index[0]], value + selfDot1.get([0, index[0]]));
        }, true);

        var selfDot2 = math.multiply(queryVector, math.transpose(queryVector));
        var selfDotSqrt = selfDot1.map(function(v) {
            return Math.sqrt(v * selfDot2._values[0]);
        }, true);

        alldot = math.dotDivide(alldot, selfDotSqrt);

        // add doc information to it
        var ret = new Array(alldot._data[0].length);
        for (var i = 0; i < alldot._data[0].length; ++i) {
            ret[i] = {};
            ret[i].doc = articleIndexToDoc[i];
            ret[i].value = alldot._data[0][i] || 0;
        }
        return ret;
    };

    var parseWord = function(db) {
        db.collection(wordTableName).find({}).toArray(function(err, result){
            if (err) { console.log(err); return;}

            /// Get all word out of result and construct the final matrix
            finalMatrix = math.zeros(result[0].total_doc_count, result.length, 'sparse');
            similarity = math.zeros(1, result[0].total_doc_count, 'sparse');// new Array(result[0].total_doc_count);
            articleIndexToDoc = new Array(result[0].total_doc_count);

            // Init query words array
            //queryWords = math.zeros(1, result.length, 'sparse');//new Array(result.length);
            kWordCount = result.length;
            kDocCount = result[0].total_doc_count;

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
                        articleIndexToDoc[articleCount] = detail;
                        articleDocIdToIndex[detail.doc_id] = articleCount++;
                    }
                    finalMatrix.set([articleDocIdToIndex[detail.doc_id], i], detail.tfidf * detail.count);
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