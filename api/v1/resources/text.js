//const Wreck = require('wreck');
//const Config = require('../../../config.js');
const ResponseMessages = require('../../response-messages');
const Cache = require('memory-cache');
const Joi = require('joi');
const natural = require('natural');
const path = require('path');
natural.PorterStemmer.attach();

const base_folder = path.join(path.dirname(require.resolve("natural")), "brill_pos_tagger");
const rulesFilename = base_folder + "/data/English/tr_from_posjs.txt";
const lexiconFilename = base_folder + "/data/English/lexicon_from_posjs.json";
const defaultCategory = 'N';

const lexicon = new natural.Lexicon(lexiconFilename, defaultCategory);
const rules = new natural.RuleSet(rulesFilename);
const tagger = new natural.BrillPOSTagger(lexicon, rules);

var NGrams = natural.NGrams;

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
                        'ngrams'
                    )
            }
        },

        notes: [
            'Various NLP tasks',
        ]
    },

    handler: function(request, reply) {
            let foo;

            if (request.query.task === 'tokenizeAndStem') {
                foo = request.payload.input.tokenizeAndStem();
            }
            else if (request.query.task === 'tag') {
                foo = tagger.tag(request.payload.input.tokenizeAndStem());
            }
            else if (request.query.task === 'ngrams') {
                foo = NGrams.bigrams(request.payload.input);
            }

            reply(foo);
    }
};

module.exports = text;