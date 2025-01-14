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
     * Retourne l'utilisateur dans la base de données avec ses permissions
     * @param {String} email
     * @returns {Promise<[]>}
     */
    // renvoit user dans la bd avec ses permissions
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

    // req user -> appartient list user -> vers compte et sinon vers login
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
    // cookies: map -> supprimer le cookie de l'user
    app.get('/logout', (req, res) => {
        cookies.delete(req.cookies.user);
        // modifie le cookie user en vide, durée : créé puis suppr
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
                        // ce qui est envoyé au pug
                        let renderData = {
                            user: data,
                            page: 'compte' // page selectionnée à gauche dans le panneau
                        }
                        pgsql.query(`SELECT * FROM (
                                            SELECT M.ID_MATIERE AS ID_MATIERE,
                                            NOM_MATIERE,
                                            COUNT(EMAIL) AS NOMBRE
                                        FROM
                                            (SELECT ID_MATIERE,
                                                    EMAIL
                                                FROM EST_COMPRIS_DANS E
                                                NATURAL JOIN EST_RELIE ES
                                                UNION SELECT ID_MATIERE,
                                                    EMAIL
                                                FROM APPARTENIR A) T
                                        NATURAL JOIN MATIERE M
                                        GROUP BY M.ID_MATIERE,
                                            M.NOM_MATIERE
                                        ORDER BY M.NOM_MATIERE) R
                                        WHERE id_matiere IN (
                                            SELECT ID_MATIERE
                                                FROM EST_COMPRIS_DANS E
                                                NATURAL JOIN EST_RELIE ES
                                                UNION SELECT ID_MATIERE
                                                FROM APPARTENIR A
												WHERE EMAIL ='${cookies.get(req.cookies.user)}')
										ORDER BY nom_matiere `)
                            .then(data => {
                                renderData.matieres = data.rows
                            })
                        pgsql.query(`SELECT * FROM (
                                SELECT G.id_groupe AS id_groupe, nom_groupe, COUNT(email) AS nombre FROM est_relie E
                                NATURAL JOIN groupe G
                                GROUP BY G.id_groupe, G.nom_groupe
                                ORDER BY G.nom_groupe ) R
                            WHERE id_groupe IN (
                                SELECT id_groupe
                                FROM est_relie
                                WHERE email='${cookies.get(req.cookies.user)}')`)
                            .then(data => {
                                renderData['groupes'] = data.rows
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
                                            SELECT M.ID_MATIERE AS ID_MATIERE,
                                            NOM_MATIERE,
                                            T2.NB_SCHEMAS,
                                            COUNT(EMAIL) AS NOMBRE
                                        FROM
                                            (SELECT ID_MATIERE,
                                                    EMAIL
                                                FROM EST_COMPRIS_DANS E
                                                NATURAL JOIN EST_RELIE ES
                                                UNION SELECT ID_MATIERE,
                                                    EMAIL
                                                FROM APPARTENIR A) T
                                        NATURAL JOIN MATIERE M
                                        NATURAL JOIN
                                            (SELECT M.ID_MATIERE,
                                                    COUNT(ID_SCHEMA) AS NB_SCHEMAS
                                                FROM MATIERE M NATURAL
                                                LEFT JOIN SCHEMA S
                                                GROUP BY M.ID_MATIERE,
                                                    M.NOM_MATIERE
                                                ORDER BY M.NOM_MATIERE) T2
                                        GROUP BY M.ID_MATIERE,
                                            M.NOM_MATIERE,
                                            T2.NB_SCHEMAS
                                        ORDER BY M.NOM_MATIERE) R
                                        WHERE id_matiere IN (
                                            SELECT ID_MATIERE
                                                FROM EST_COMPRIS_DANS E
                                                NATURAL JOIN EST_RELIE ES
                                                UNION SELECT ID_MATIERE
                                                FROM APPARTENIR A
												WHERE EMAIL ='${cookies.get(req.cookies.user)}')
										ORDER BY nom_matiere `)
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
    app.get('/groupes', (req, res) => {
        if (req.cookies.user && cookies.has(req.cookies.user)) {
            resolveUser(cookies.get(req.cookies.user))
                .then(data => {
                    if (data) {
                        let renderData = {
                            user: data,
                            page: 'groupes'
                        }
                        pgsql.query(`SELECT * FROM (
                            SELECT G.id_groupe AS id_groupe, nom_groupe, COUNT(email) AS nombre FROM est_relie E
                            NATURAL JOIN groupe G
                            GROUP BY G.id_groupe, G.nom_groupe
                            ORDER BY G.nom_groupe ) R
                        WHERE id_groupe IN (
                            SELECT id_groupe
                            FROM est_relie
                            WHERE email='${cookies.get(req.cookies.user)}')`)
                            .then(data => {
                                renderData['groupes'] = data.rows
                                res.render('groupes', renderData);
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
                                            FROM schema S
                                            NATURAL JOIN (
                                                SELECT ID_MATIERE, nom_matiere
                                            FROM
                                                (SELECT M.ID_MATIERE AS ID_MATIERE,
                                                        NOM_MATIERE
                                                    FROM
                                                        (SELECT ID_MATIERE,EMAIL
                                                            FROM EST_COMPRIS_DANS E
                                                            NATURAL JOIN EST_RELIE ES
                                                            UNION SELECT ID_MATIERE,EMAIL
                                                            FROM APPARTENIR A) T
                                                    NATURAL JOIN MATIERE M
                                                    NATURAL JOIN
                                                        (SELECT M.ID_MATIERE,
                                                                COUNT(ID_SCHEMA) AS NB_SCHEMAS
                                                            FROM MATIERE M NATURAL
                                                            LEFT JOIN SCHEMA S
                                                            GROUP BY M.ID_MATIERE,
                                                                M.NOM_MATIERE
                                                            ORDER BY M.NOM_MATIERE) T2
                                                    GROUP BY M.ID_MATIERE,
                                                        M.NOM_MATIERE) R
                                            WHERE ID_MATIERE IN
                                                    (SELECT ID_MATIERE
                                                        FROM EST_COMPRIS_DANS E
                                                        NATURAL JOIN EST_RELIE ES
                                                        UNION SELECT ID_MATIERE
                                                        FROM APPARTENIR A
                                                        WHERE EMAIL = '${renderData.user.email}')) M
                                            JOIN appartenir A ON A.id_matiere=M.id_matiere
                                            WHERE (S.email='${renderData.user.email}' OR schema_public=true)
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


    app.get('/schema_eval', (req, res) => {
        if (req.cookies.user && cookies.has(req.cookies.user)) {
            resolveUser(cookies.get(req.cookies.user))
                .then(data => {
                    if (data) {
                        let renderData = {
                            user: data,
                            page: 'schema_eval'
                        }
                        pgsql.query(`SELECT *, CASE WHEN ID_EVAL IN 
                                            (SELECT
                                            ID_EVAL 
                                            FROM NOTE N
                                            WHERE N.ID_EVAL = ${req.query.id_eval} AND N.id_schema = R.id_schema AND N.email = '${renderData.user.email}') THEN true ELSE false END as fini
                                            FROM (SELECT 
                                            ID_EVAL,
                                            ID_SCHEMA,
                                            COEFFICIENT,
                                            NOM_SCHEMA
                                            FROM LISTE_SCHEMAS
                                            NATURAL JOIN SCHEMA S
                                            WHERE ID_EVAL =  ${req.query.id_eval}) R
                                            NATURAL JOIN EVALUATION E`)
                            .then(data => {
                                renderData['schema_eval'] = data.rows
                                res.render('schema_eval', renderData);
                                console.log(renderData)
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

    app.get('/evaluations', (req, res) => {
        if (req.cookies.user && cookies.has(req.cookies.user)) {
            resolveUser(cookies.get(req.cookies.user))
                .then(data => {
                    if (data) {
                        let renderData = {
                            user: data,
                            page: 'evaluations'
                        }
                        pgsql.query(`
                            SELECT NOM_EVAL,
                            ID_EVAL,
                            NOM_MATIERE,
                            CASE WHEN (EXTRACT(EPOCH FROM (DATE(date_end) -  NOW()))) > 0 then false else true END as Expire,
                            to_char(date_start, 'DD/MM/YYYY hh24:mi') as date_start,
                            to_char(date_end, 'DD/MM/YYYY hh24:mi') as date_end,
                            nb_schemas
                        FROM EVALUATION E
                        NATURAL JOIN SITUE S
                        NATURAL LEFT JOIN MATIERE M
                        WHERE M.ID_MATIERE IN
                                (SELECT ID_MATIERE
                                    FROM EST_COMPRIS_DANS E
                                    NATURAL JOIN EST_RELIE ES
                                    UNION SELECT ID_MATIERE
                                    FROM APPARTENIR A
                                    WHERE EMAIL = '${cookies.get(req.cookies.user)}')
                        GROUP BY E.NOM_EVAL,
                            ID_EVAL,
                            NOM_MATIERE,
                            date_start,
                            date_end`)
                            .then(data => {
                                renderData['evaluations'] = data.rows
                                res.render('evaluations', renderData);
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

    app.get('/notes_eval', (req, res) => {
        if (req.cookies.user && cookies.has(req.cookies.user)) {
            resolveUser(cookies.get(req.cookies.user))
                .then(data => {
                    if (data) {
                        let renderData = {
                            user: data,
                            page: 'notes_eval'
                        }
                            pgsql.query(`
                                        SELECT
                                        E.ID_EVAL,
                                        N.NOTE_EVAL,
                                        NOM_EVAL,
                                        S.ID_SCHEMA,
                                        NOM_SCHEMA,
                                        coefficient
                                        FROM NOTE N
                                        NATURAL JOIN EVALUATION E
                                        NATURAL JOIN Liste_schemas L 
                                        LEFT JOIN SCHEMA S ON S.id_schema = L.id_schema
                                        WHERE E.ID_EVAL = ${req.query.id_eval} AND N.email = '${cookies.get(req.cookies.user)}'`)
                            .then(data => {
                                renderData['notes_eval'] = data.rows
                                res.render('notes_eval', renderData);
                                console.log(renderData)
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
}