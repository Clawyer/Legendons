const {Application} = require('express');
const {Client} = require('pg');

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

    app.get('/matiere', (req, res) => {
        if (req.cookies.user && cookies.has(req.cookies.user)) {
            pgsql.query(`SELECT nom_matiere, id_matiere, nom, prenom, email FROM matiere M
            JOIN appartenir A ON M.id_matiere = A.id_matiere_appartenir
            JOIN utilisateur U ON A.id_utilisateur_appartenir = U.email
            WHERE id_matiere=${req.query.matiere}`)
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


}