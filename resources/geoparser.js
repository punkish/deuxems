const files = {

    method: 'GET',

    path: '/geoparser',

    config: {
        description: "geoparser",
        tags: ['geoparser'],
        validate: {},
        notes: [
            'This is just a note',
        ]
    },
    
    handler: function(request, reply) {
        reply.view('geoparser', null, {layout: 'geoparser'});
    }
};

module.exports = files;