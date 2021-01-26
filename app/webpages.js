const {Application} = require('express');
const {Client} = require('pg');

/**
 * @param {Application} app Application express
 * @param {Client} pgsql Base de données
 * @param {String} dirname Nom du répertoire du serveur
 * @param {Map} cookies Liste des utilisateurs connectés et leurs cookies
 */
module.exports = function (app, pgsql, dirname, cookies) {

    /**
     * @param {String} email
     * @returns {Promise<[]>}
     */
    function resolveUser(email) {
        return new Promise((resolve, reject) => {
            pgsql.query(`SELECT * FROM utilisateur U
            JOIN role R ON U.role_utilisateur=R.nom_role
            WHERE email='${email}'`)
                .then(data => {
                    data.rows[0].permissions = data.rows[0].permissions.split(" ")
                    resolve(data.rows[0]);
                })
                .catch(err => {
                    reject(err);
                })
        })
    }

    app.get('/', (req, res) => {
        if (req.cookies.user && cookies.has(req.cookies.user)) {
            res.redirect('/compte');
        } else {
            res.redirect('/login');
        }
    });

    app.get('/login', (req, res) => {
        res.sendFile('/htmls/login.html', {
            root: dirname
        });
    })

    app.get('/register', (req, res) => {
        res.sendFile('/htmls/register.html', {
            root: dirname
        });
    })

    app.get('/forgot_password', (req, res) => {
        res.sendFile('/htmls/forgot_password.html', {
            root: dirname
        });
    })

    app.get('/logout', (req, res) => {
        cookies.delete(req.cookies.user);
        res.cookie('user', '', {
            maxAge: 0
        });
        res.redirect('/');
    })

    app.get('/compte', (req, res) => {
        if (req.cookies.user && cookies.has(req.cookies.user)) {
            resolveUser(cookies.get(req.cookies.user))
                .then(data => {
                    if (data) {
                        let renderData = {
                            user: data,
                            page: 'compte'
                        }
                        pgsql.query(`SELECT * FROM (
                            SELECT id_matiere, nom_matiere, COUNT(id_utilisateur_appartenir) AS nombre FROM appartenir A
                            JOIN matiere M ON A.id_matiere_appartenir = M.id_matiere
                            GROUP BY id_matiere, nom_matiere
                            ORDER BY nom_matiere ) R
                        WHERE id_matiere IN (
                            SELECT id_matiere_appartenir
                            FROM appartenir
                            WHERE id_utilisateur_appartenir='${cookies.get(req.cookies.user)}')`)
                            .then(data => {
                                renderData['matieres'] = data.rows
                                res.render('compte', renderData);
                            })
                            .catch(err => {
                                console.error(err);
                                res.status(500);
                            });
                    } else
                        res.redirect('/');
                })
                .catch(err => {
                    console.error(err);
                    res.status(500);
                });

        } else {
            res.redirect('/');
        }
    });

    app.get('/matieres', (req, res) => {
        if (req.cookies.user && cookies.has(req.cookies.user)) {
            resolveUser(cookies.get(req.cookies.user))
                .then(data => {
                    if (data) {
                        let renderData = {
                            user: data,
                            page: 'matieres'
                        }

                        pgsql.query(`SELECT * FROM (
                            SELECT id_matiere, nom_matiere, COUNT(id_utilisateur_appartenir) AS nombre FROM appartenir A
                            JOIN matiere M ON A.id_matiere_appartenir = M.id_matiere
                            GROUP BY id_matiere, nom_matiere
                            ORDER BY nom_matiere ) R
                        WHERE id_matiere IN (
                            SELECT id_matiere_appartenir
                            FROM appartenir
                            WHERE id_utilisateur_appartenir='${cookies.get(req.cookies.user)}')`)
                            .then(data => {
                                renderData['matieres'] = data.rows
                                res.render('matieres', renderData);
                            })
                            .catch(err => {
                                console.error(err);
                                res.status(500);
                            });
                    } else
                        res.redirect('/');
                })
                .catch(err => {
                    console.error(err);
                    res.status(500);
                });

        } else {
            res.redirect('/');
        }
    });

    app.get('/schemas', (req, res) => {
        if (req.cookies.user && cookies.has(req.cookies.user)) {
            resolveUser(cookies.get(req.cookies.user))
                .then(data => {
                    if (data) {
                        let renderData = {
                            user: data,
                            page: 'schemas'
                        }

                        pgsql.query(`SELECT id_schema, nom_schema FROM schema S
                            WHERE user_schema='${renderData.user.email}'`)
                            .then(data => {
                                renderData['schemas'] = data.rows
                                res.render('schemas', renderData);
                            })
                            .catch(err => {
                                console.error(err);
                                res.status(500);
                            });
                    } else
                        res.redirect('/');
                })
                .catch(err => {
                    console.error(err);
                    res.status(500);
                });

        } else {
            res.redirect('/');
        }
    });

    app.get('/schema_create', (req, res) => {
        if (req.cookies.user && cookies.has(req.cookies.user)) {
            resolveUser(cookies.get(req.cookies.user))
                .then(data => {
                    if (data) {
                        let renderData = {
                            user: data,
                            page: 'schema_create'
                        }
                        res.render('schema_create', renderData);
                    } else
                        res.redirect('/');
                }).catch(err => {
                console.error(err);
                res.status(500);
            });

        } else {
            res.redirect('/');
        }
    });
}