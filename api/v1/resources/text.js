const path = require('path');
const ResponseMessages = require('../../response-messages');
const Cache = require('memory-cache');
const debug = require('debug')('deuxems:text');
const Joi = require('joi');

const natural = require('natural');
natural.PorterStemmer.attach();
const base_folder = path.join(path.dirname(require.resolve("natural")), "brill_pos_tagger");
const rulesFilename = base_folder + "/data/English/tr_from_posjs.txt";
const lexiconFilename = base_folder + "/data/English/lexicon_from_posjs.json";
const defaultCategory = 'N';
const lexicon = new natural.Lexicon(lexiconFilename, defaultCategory);
const rules = new natural.RuleSet(rulesFilename);
const tagger = new natural.BrillPOSTagger(lexicon, rules);
const NGrams = natural.NGrams;

/* *************************************** */
const async = require('async');
const convexHull = require('monotone-convex-hull-2d');

const dbfile = path.join(__dirname, '..', '..', '..', 'data/geonames/DE/DE.sqlite');
debug(`dbfile: ${dbfile}`);

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(dbfile);

const stmt = `SELECT name, feature_class, feature_code, latitude, longitude  
              FROM geonames 
              WHERE feature_class = 'P' AND Lower(asciiname) = ? 
              ORDER BY name`;
    
const centroid = function(poly) {
    const l = poly.length;
    if (l == 0) {
        return false;
    }
    else if (l == 1) {
        return poly[0];
    }

    return poly.reduce(function(center, p, i) {
        center[0] += p[0];
        center[1] += p[1];

        if(i === l - 1) {
            center[0] /= l;
            center[1] /= l;
        }

        return center;
    }, [0, 0]);
};

const chpoly = function(points) {
    if (points.length < 3) {
        return points;
    }
    
    return convexHull(points).map(function(el) {
        return points[el];
    });
};
/* *************************************** */

const text = {

    method: 'POST',

    path: '/text',

    config: {
        description: "text",
        tags: ['text', 'api'],
        plugins: {
            'hapi-swagger': {
                order: 1,
                responseMessages: ResponseMessages,
                payloadType: 'form'
            }
        },
        validate: {
            payload: {
                input: Joi.string()
                        .description('input text'),
            },
            query: {
                task: Joi.string()
                    .description('NLP task to be performed on the text')
                    .required()
                    .valid(
                        'tokenizeAndStem',
                        'tag',
                        'ngrams',
                        'geoparse'
                    )
            }
        },

        notes: [
            'NLP tasks',
        ]
    },

    handler: function(request, reply) {
            let result;

            if (request.query.task === 'tokenizeAndStem') {
                result = request.payload.input.tokenizeAndStem();
                reply(result);
            }
            else if (request.query.task === 'tag') {
                result = tagger.tag(request.payload.input.tokenizeAndStem());
                reply(result);
            }
            else if (request.query.task === 'ngrams') {
                result = NGrams.bigrams(request.payload.input);
                reply(result);
            }
            else if (request.query.task === 'geoparse') {
                const stemmedTokens = request.payload.input.tokenizeAndStem();
                debug("stemmed tokens: " + stemmedTokens);
            
                const possible_places = tagger.tag(stemmedTokens).map(function(el) {
                    return el[0];
                });
                debug("possible places: " + possible_places);
            
                const found_places = {};
            
                async.each(
                    possible_places, 
            
                    function(possible_place, cb) {
                        
                        db.each(
                            stmt, 
                            possible_place.toLowerCase(), 
                            function(err, row) {
                                if (row.name in found_places) {
                                    found_places[row.name].push(
                                        [row.longitude, row.latitude]
                                    );
                                }
                                else {
                                    found_places[row.name] = [
                                        [row.longitude, row.latitude]
                                    ];
                                }
                            },
                            function(err, count) {
                                cb();
                            }
                        )
                    },
            
                    function(err) {
                        
                        // if any of the file processing produced an error, 
                        // err would equal that error
                        if(err) {
            
                            // One of the iterations produced an error.
                            // All processing will now stop.
                            console.log(err);
                        } 
                        else {
                            debug(found_places);
                            const places = [];
                            for (name in found_places) {
                                const points = found_places[name];
                                const ch = chpoly(points);
                                const center = centroid(ch);
                                if (name === 'Berlin') {
                                    debug(ch);
                                    debug(center);
                                }
                                places.push({
                                    name: name,
                                    longitude: center[0],
                                    latitude: center[1]
                                })
                            }

                            //reply.send(places);
                            reply(places);
                        }
                    }
                );
            }
    }
};

module.exports = text;