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
            pgsql.query(`SELECT G.id_groupe, G.nom_groupe
            FROM groupe G NATURAL JOIN est_relie
            WHERE email = '${cookies.get(req.cookies.user)}'`)
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
                });
        } else
            res.status(401)
    });

    app.get('/schema', (req, res) => {
        if (req.cookies.user && cookies.has(req.cookies.user)) {
            let bool;
            pgsql.query(`SELECT * FROM utilisateur U
            NATURAL JOIN role R
            WHERE email= '${cookies.get(req.cookies.user)}'`, (err, data1) => {
                if (err) {
                    res.status(500);
                    console.error(err);
                }
                if (data1) {
                    data1.rows[0].permissions = data1.rows[0].permissions.split(" ")
                    bool = data1.rows[0].permissions.includes('create_schema');
                    pgsql.query(`SELECT * FROM schema S WHERE id_schema=${req.query.id}`, (err, data2) => {
                        if (err) {
                            res.status(500);
                            console.error(err);
                        }
                        pgsql.query(`SELECT ID_EVAL FROM LISTE_SCHEMAS L NATURAL JOIN EVALUATION E
                                WHERE ID_SCHEMA = ${req.query.id} AND (DATE_START < NOW() AND DATE_END > NOW())`, (err, data3) => {
                            if (err) {
                                res.status(500);
                                console.error(err);
                            }
                            res.json({
                                ...data2.rows[0],
                                evals: data3.rows,
                                bool: bool
                            });
                        });
                    })
                }

            })

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

    app.get('/evaluation', (req, res) => {
        if (req.cookies.user && cookies.has(req.cookies.user)) {
            pgsql.query(`
                        SELECT 
                        NOM_EVAL,
                        ID_EVAL,
                        ID_MATIERE,
                        NOM_MATIERE,
                        to_char(date_start, 'yyyy/mm/dd hh24:mi') as date_start,
                        to_char(date_end, 'yyyy/mm/dd hh24:mi') as date_end,
                        nom_schema,
                        id_schema,
                        coefficient
                        FROM 
                        (SELECT *
                        FROM EVALUATION E
                        NATURAL LEFT JOIN 
                        (SELECT 
                         ID_EVAL,
                        Sc.nom_schema,
                        Sc.id_schema,
                        L.coefficient
                        FROM liste_schemas L
                        LEFT JOIN SCHEMA Sc ON Sc.id_schema = L.id_schema) R
                        NATURAL LEFT JOIN (
                        SELECT
                            ID_EVAL,
                            M.NOM_MATIERE,
                            M.ID_MATIERE
                        FROM SITUE S
                        NATURAL JOIN Matiere M) T
                        WHERE E.ID_EVAL = ${req.query.eval}) T2`)
                .then(data => {
                    res.json({
                        nom: data.rows[0].nom_eval,
                        id: data.rows[0].id_eval,
                        mat: data.rows[0].nom_matiere,
                        id_mat: data.rows[0].id_matiere,
                        deb: data.rows[0].date_start,
                        fin: data.rows[0].date_end,
                        schemas: data.rows,
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


    app.get('/listeMats', (req, res) => {
        if (req.cookies.user && cookies.has(req.cookies.user)) {
            pgsql.query(`
                        SELECT ID_MATIERE,
                        NOM_MATIERE
                        FROM MATIERE M
                        WHERE ID_MATIERE in
                        (SELECT ID_MATIERE
                        FROM EST_COMPRIS_DANS E
                        NATURAL JOIN EST_RELIE ES
                        UNION SELECT ID_MATIERE
                        FROM APPARTENIR A
                        WHERE EMAIL = '${cookies.get(req.cookies.user)}')`)
                .then(data => {
                    console.log(data)
                    res.json({
                        data: data.rows,
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
    app.get('/listeSchemas', (req, res) => {
        if (req.cookies.user && cookies.has(req.cookies.user)) {
            pgsql.query(`
                        SELECT
                        ID_SCHEMA,
                        NOM_SCHEMA,
                        SCHEMA_PUBLIC
                        FROM SCHEMA 
                        WHERE ID_MATIERE ='${req.query.matiere}'`)
                .then(data => {
                    console.log(data)
                    res.json({
                        data: data.rows,
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