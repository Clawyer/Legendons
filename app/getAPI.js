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

    app.get('/evaluation' , (req, res) => {
        if (req.cookies.user && cookies.has(req.cookies.user)) {
            pgsql.query(`
                         SELECT NOM_EVAL,
                                ID_EVAL,
                                NOM_MATIERE
                            FROM EVALUATION E
                            NATURAL JOIN SITUE S
                            NATURAL LEFT JOIN MATIERE M
                            WHERE (E.DATE_START < NOW()
                                OR E.DATE_END <= NOW())
                                AND M.ID_MATIERE IN
                                    (SELECT ID_MATIERE
                                        FROM EST_COMPRIS_DANS E
                                        NATURAL JOIN EST_RELIE ES
                                        UNION SELECT ID_MATIERE
                                        FROM APPARTENIR A
                                        WHERE EMAIL = '${cookies.get(req.cookies.user)}')
                            GROUP BY E.NOM_EVAL,
                                ID_EVAL,
                                NOM_MATIERE`)
                .then(data => {
                    res.json({
                        nom: data.rows[0].nom_eval,
                        id: data.rows[0].id_eval,
                        matiere: data.rows[0].id_matiere,
                        eval: data.rows,
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

    app.get('/eval_prof' , (req, res) => {
        if (req.cookies.user && cookies.has(req.cookies.user)) {
            pgsql.query(`
                        SELECT E.ID_EVAL,
                            E.ID_MATIERE,
                            E.NOM_EVAL,
                            COUNT(EMAIL) AS NB_ETUD
                        FROM
                            (SELECT ID_EVAL,
                                    EMAIL,
                                    COUNT(ID_SCHEMA) AS NB
                                FROM NOTE N
                                GROUP BY EMAIL,
                                    ID_EVAL
                                HAVING ID_EVAL = ${req.query.id_eval}) T
                        NATURAL JOIN EVALUATION E
                        WHERE NB in
                                (SELECT COUNT(ID_SCHEMA)
                                    FROM LISTE_SCHEMAS
                                    WHERE ID_EVAL = ${req.query.id_eval})
                        AND ID_MATIERE IN
                                (SELECT ID_MATIERE
                                    FROM EST_COMPRIS_DANS E
                                    NATURAL JOIN EST_RELIE ES
                                    UNION SELECT ID_MATIERE
                                    FROM APPARTENIR A
                                    WHERE EMAIL = '${cookies.get(req.cookies.user)}')
                        GROUP BY E.ID_EVAL`)
                .then(data => {
                    res.json({
                        nom: data.rows[0].nom_eval,
                        id: data.rows[0].id_eval,
                        matiere: data.rows[0].id_matiere,
                        nb: data.rows[0].nb_etud,
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

    app.get('/eval_etud' , (req, res) => {
        if (req.cookies.user && cookies.has(req.cookies.user)) {
            pgsql.query(`
                        SELECT E.NOM_EVAL,
                            ID_EVAL,
                            N.ID_SCHEMA,
                            S.NOM_SCHEMA,
                            NOTE_EVAL,
                            NOM_MATIERE
                        FROM NOTE N
                        NATURAL JOIN EVALUATION E
                        INNER JOIN SCHEMA S ON S.ID_SCHEMA = N.ID_SCHEMA
                        INNER JOIN MATIERE M ON M.ID_MATIERE = S.ID_MATIERE
                        WHERE (N.EMAIL = '${cookies.get(req.cookies.user)}'
                            AND E.DATE_START < NOW()
                            OR E.DATE_END <= NOW())
                            AND M.ID_MATIERE IN
                                (SELECT ID_MATIERE
                                    FROM EST_COMPRIS_DANS E
                                    NATURAL JOIN EST_RELIE ES
                                    UNION SELECT ID_MATIERE
                                    FROM APPARTENIR A
                                    WHERE EMAIL = '${cookies.get(req.cookies.user)}')
                        GROUP BY E.NOM_EVAL,
                            ID_EVAL,
                            NOTE_EVAL,
                            N.ID_SCHEMA,
                            S.NOM_SCHEMA,
                            NOM_MATIERE`)
                .then(data => {
                    res.json({
                        nom: data.rows[0].nom_eval,
                        id: data.rows[0].id_eval,
                        matiere: data.rows[0].nom_matiere,
                        schema: data.rows[0].nom_schema,
                        notes: data.rows,
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

    app.get('/listeMats' , (req, res) => {
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
    app.get('/listeSchemas' , (req, res) => {
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