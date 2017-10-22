const tos = {
    
    method: 'GET',

    path: '/tos',

    config: {
        description: "terms of service",
        tags: ['zenodeo'],
        validate: {},
        notes: [
            'root',
        ]
    },

    handler: function(request, reply) {
        reply.view('tos');
    }
};
    
module.exports = tos;