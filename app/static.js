const express = require('express');

/**
 * @param {express.Application} app Application express
 * @param {String} dirname Nom du répertoire du serveur
 */

module.exports = function (app, dirname) {

    app.use('/assets', express.static(dirname + '/assets/'));

    app.use('/packages', express.static(dirname + '/node_modules/'));

    app.use('/images', express.static(dirname + '/images/'));

}