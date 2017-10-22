const Wreck = require('wreck');
const Cache = require('memory-cache');
const Schema = require('../schema.js');
const Config = require('../../../config.js');
const ResponseMessages = require('../../response-messages');

const records = {
    method: 'GET',

    path: "/records",

    config: {
        description: "records",
        tags: ['record', 'api'],
        plugins: {
            'hapi-swagger': {
                order: 3,
                responseMessages: ResponseMessages
            }
        },
        validate: {
            query: Schema.record
        },
        notes: [
            'This is the main route for fetching records matching the provided query parameters.',
        ]
    },

    handler: function(request, reply) {
        let uri = Config.uri + 'records/?communities=biosyslit';
        
        // construct the 'uri' based on the query params
        [
            'q', 
            'file_type', 
            'type', 
            'image_subtype', 
            'publication_subtype', 
            'access_right', 
            'keywords'
        ].forEach(function(param) {
            if (request.query[param]) {
                uri += `&${param}=${encodeURIComponent(request.query[param])}`;
            }
        });

        // now that the 'uri' has been constructed, let's get either 
        // a summary or images or complete details
        let cacheKey = uri;
        if (request.query.summary) {
            cacheKey = uri + request.query.summary;
            const responseExists = Cache.get(cacheKey);
            if (responseExists) {
                reply(responseExists);
            }
            else {
                const getSummaryOfRecords = async function (uri) {
                    
                    const { res, payload } = await Wreck.get(uri);
                    const summary = JSON.parse(payload.toString())
                        .hits
                        .hits
                        .map(function(element) {
                            return element.links.self;
                        });
                
                    Cache.put(cacheKey, summary);                    
                    reply(summary).headers = res.headers;
                };

                try {
                    getSummaryOfRecords(uri);
                }
                catch (error) {
                    console.error(error);
                }
            }
        }
        else if (request.query.images) {
            cacheKey = uri + request.query.images;
            const responseExists = Cache.get(cacheKey);
            if (responseExists) {
                reply(responseExists);
            }
            else {
                try {
                    const getImages = async function(uri) {
                        
                        // get all the records for the query
                        try {
                            const { res, payload } = await Wreck.get(uri);
                            
                            // extract all the links for the records
                            const records = JSON.parse(payload.toString())
                                .hits
                                .hits
                                .map(function(element) {
                                    return element.links.self;
                                });
        
                            //reply(records).headers = res.headers;
                            // get images for each record
                            let imagesOfRecords = {};
                            for (let record of records) {
                    
                                // get images of one record
                                
                                // first get the bucket for one record
                                try {
                                    const { res, payload } = await Wreck.get(record);
                                    const bucket = JSON.parse(payload.toString()).links.bucket;
        
                                    try {
                                        // now get the images for the bucket
                                        const { res, payload } = await Wreck.get(bucket);
                                        const contents = JSON.parse(payload.toString()).contents;
                                        const images = contents.map(function(el) { return el.links.self; });
                                        imagesOfRecords[record] = images;
                                    }
                                    catch (error) {
                                        console.log(error);
                                    }
                                }
                                catch (error) {
                                    console.log(error);
                                }
                            };
        
                            Cache.put(cacheKey, imagesOfRecords);
                            reply(imagesOfRecords).headers = res.headers;
                        }
                        catch (error) {
                            console.log(error);
                        } 
                    };
        
                    getImages(uri);
                }
                catch (error) {
                    console.error(error);
                }
            }
        }
    
        // return the all the details of all the records
        else {
            const responseExists = Cache.get(cacheKey);
            if (responseExists) {
                reply(responseExists);
            }
            else {
                try {
                    const getRecords = async function (uri) {
                        
                        const { res, payload } = await Wreck.get(uri);
                        const result = payload.toString();
                        Cache.put(cacheKey, result);
                        reply(JSON.parse(result)).headers = res.headers;
                    };
                    
                    try {
                        getRecords(uri);
                    }
                    catch (error) {
                        console.error(error);
                    }
                }
                catch (error) {
                    console.error(error);
                }
            }
        }
    }
};

module.exports = records;