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
            NATURAL JOIN role R
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
                            SELECT M.id_matiere AS id_matiere, nom_matiere, COUNT(email) AS nombre FROM appartenir A
                            NATURAL JOIN matiere M
                            GROUP BY M.id_matiere, M.nom_matiere
                            ORDER BY M.nom_matiere ) R
                        WHERE id_matiere IN (
                            SELECT id_matiere
                            FROM appartenir
                            WHERE email='${cookies.get(req.cookies.user)}')`)
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
                            SELECT M.id_matiere AS id_matiere, nom_matiere, COUNT(id_schema) AS nb_schemas, COUNT(email) AS nombre FROM appartenir A
                            NATURAL JOIN matiere M
                            NATURAL LEFT JOIN schema S
                            GROUP BY M.id_matiere, M.nom_matiere
                            ORDER BY M.nom_matiere ) R
                        WHERE id_matiere IN (
                            SELECT id_matiere
                            FROM appartenir
                            WHERE email='${cookies.get(req.cookies.user)}')`)
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

                        pgsql.query(`SELECT DISTINCT id_schema, nom_schema, nom_matiere, schema_public, S.email
                            FROM schema S NATURAL JOIN matiere M
                            JOIN appartenir A ON A.id_matiere=M.id_matiere
                            WHERE (S.email='${renderData.user.email}'
                            OR (A.email='${renderData.user.email}' AND schema_public=true))
                            ${req.query.id_matiere ? "AND S.id_matiere=" + req.query.id_matiere : ""};`)
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
                    if (data && data.permissions.includes('create_schema')) {
                        let renderData = {
                            user: data,
                            page: 'schema_create'
                        }
                        pgsql.query(`SELECT nom_matiere, M.id_matiere FROM matiere M NATURAL JOIN appartenir A
                        WHERE email='${cookies.get(req.cookies.user)}'`)
                            .then(data => {
                                renderData.matieres = data.rows;
                                res.render('schema_create', renderData);
                            }).catch(err => {
                            console.error(err);
                            res.status(500);
                        });
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

    app.get('/play', (req, res) => {
        if (req.cookies.user && cookies.has(req.cookies.user)) {
            resolveUser(cookies.get(req.cookies.user))
                .then(data => {
                    if (data) {
                        let renderData = {
                            user: data,
                            page: 'play'
                        }
                        res.render('play', renderData);
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