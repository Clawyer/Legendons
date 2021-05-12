const {
    Application
} = require('express');
const {
    Client
} = require('pg');

/**
 * @param {Application} app Application express
 * @param {Client} pgsql Base de données
 * @param {String} dirname Nom du répertoire du serveur
 * @param {Map} cookies Liste des utilisateurs connectés et leurs cookies
 */

module.exports = function (app, pgsql, dirname, cookies) {

    app.get('/listeComptes', (req, res) => {
        if (req.cookies.user && cookies.has(req.cookies.user)) {
            pgsql.query('SELECT nom, prenom, email FROM utilisateur')
                .then(data => {
                    res.json({
                        data: data.rows,
                        user: cookies.get(req.cookies.user)
                    });
                })
                .catch(err => {
                    console.error(err);
                    res.status(500);
                });
        } else {
            res.status(401);
        }
    });
    app.get('/listeGroupes', (req, res) => {
        if (req.cookies.user && cookies.has(req.cookies.user)) {
            pgsql.query('SELECT id_groupe, nom_groupe FROM groupe')
                .then(data => {
                    res.json({
                        data: data.rows,
                        user: cookies.get(req.cookies.user)
                    });
                })
                .catch(err => {
                    console.error(err);
                    res.status(500);
                });
        } else {
            res.status(401);
        }
    });

    app.get('/matiere', (req, res) => {
        if (req.cookies.user && cookies.has(req.cookies.user)) {
            pgsql.query(`SELECT nom_matiere, M.id_matiere, nom, prenom, U.email FROM matiere M
            NATURAL JOIN appartenir A
            NATURAL JOIN utilisateur U
            WHERE M.id_matiere=${req.query.matiere}`)
                .then(data => {
                    res.json({
                        nom: data.rows[0].nom_matiere,
                        id: data.rows[0].id_matiere,
                        users: data.rows,
                        user: cookies.get(req.cookies.user)
                    });
                })
                .catch(err => {
                    res.status(500);
                    console.error(err);
                });
        } else
            res.status(401)
    });

    app.get('/matiere_groupe', (req, res) => {
        if (req.cookies.user && cookies.has(req.cookies.user)) {
            pgsql.query(`SELECT nom_matiere, M.id_matiere, G.nom_groupe, E.id_groupe FROM matiere M
            NATURAL JOIN est_compris_dans E
            NATURAL JOIN Groupe G
            WHERE M.id_matiere=${req.query.matiere}`)
                .then(data => {
                    res.json({
                        nom_matiere: data.rows[0].nom_matiere,
                        id_matiere: data.rows[0].id_matiere,
                        groupes: data.rows,
                    });
                })
                .catch(err => {
                    res.status(500);
                    console.error(err);
                });
        } else
            res.status(401)
    });

    app.get('/schema', (req, res) => {
        if (req.cookies.user && cookies.has(req.cookies.user)) {
            pgsql.query(`SELECT * FROM schema S
            WHERE id_schema=${req.query.id}`)
                .then(data => {
                    res.json(data.rows[0]);
                })
                .catch(err => {
                    res.status(500);
                    console.error(err);
                });
        } else
            res.status(401)
    });

    app.get('/groupe', (req, res) => {
        if (req.cookies.user && cookies.has(req.cookies.user)) {
            pgsql.query(`SELECT nom_groupe , G.id_groupe , nom, prenom, U.email FROM groupe G
            NATURAL JOIN est_relie E
            NATURAL JOIN utilisateur U
            WHERE G.id_groupe=${req.query.groupe}`)
                .then(data => {
                    res.json({
                        nom: data.rows[0].nom_groupe,
                        id: data.rows[0].id_groupe,
                        users: data.rows,
                        user: cookies.get(req.cookies.user)
                    });
                })
                .catch(err => {
                    res.status(500);
                    console.error(err);
                });
        } else
            res.status(401)
    });



}