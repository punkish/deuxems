const Package = require('./package.json');

const config = {
    uri: '',
    port: 3030,
    info: {
        title: "REST interface to simple NLP tasks",
        version: "1.0.1",
        description: Package.description,
        termsOfService: "/tos",
        contact: {
            name: Package.author,
            url: "http://punkish.org/About",
            email: "punk.kish@gmail.com"
        },
        license: {
            name: "CC0 Public Domain Dedication",
            url: "https://creativecommons.org/publicdomain/zero/1.0/legalcode"
        }
    }
};

module.exports = config;