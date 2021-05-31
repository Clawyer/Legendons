$(function () {
    var tbody = $('tbody').first();
    var nombre = tbody.children().length;
    var affichage = parseInt($('#affichage option:selected').val());
    var pages = parseInt(Math.ceil(nombre / affichage));
    var pageEnCours = 1;

    function changeNavigation(e) {
        if ($(this).hasClass('active') || $(this).hasClass('disabled')) {
            e.preventDefault();
            return;
        }

        $(`#page-${pageEnCours}`).removeClass('active');

        switch ($(this).attr('id')) {
            case 'previous':
                pageEnCours--;
                break;

            case 'next':
                pageEnCours++;
                break;

            default:
                pageEnCours = parseInt($(this).attr('id').split('page-')[1]);
                break;
        }

        // On affiche les tableaux et on masque les anciens
        var first = (pageEnCours - 1) * affichage;
        var last = (pageEnCours * affichage) - 1;
        for (let index = 0; index < nombre; index++) {
            if (first <= index && index <= last)
                $(`#row-${index}`).show();
            else
                $(`#row-${index}`).hide();
        }

        $('#dataTable_info').text(`Affichage de ${first + 1} à ${last + 1} sur ${nombre}`);

        // On met à jour les boutons
        $(`#page-${pageEnCours}`).addClass('active');
        if (pageEnCours == 1)
            $('#previous').addClass('disabled');
        else
            $('#previous').removeClass('disabled');
        if (pageEnCours == pages)
            $('#next').addClass('disabled');
        else
            $('#next').removeClass('disabled');
    }


    function initialisation() {
        // On masque les lignes 11 à infini
        for (let index = affichage; index < nombre; index++) {
            $(`#row-${index}`).hide();
        }

        // On ajoute le nombre de pages en bas
        $('ul.pagination').children().remove();

        $('ul.pagination').first().append($('<li>').addClass('page-item disabled').on('click', changeNavigation).attr('id', 'previous').append($('<button>').addClass('page-link').attr('aria-label', 'Précédent').append($('<span>').attr('aria-hidden', 'true').text('«'))));

        for (let index = 1; index <= pages; index++) {
            var a = $('<button>').addClass('page-link').text(index);
            var li = $('<li>').addClass('page-item').attr('id', 'page-' + index).append(a).on('click', changeNavigation);
            if (index == 1) li.addClass('active');
            $('ul.pagination').first().append(li);
        }

        $('ul.pagination').first().append($('<li>').addClass('page-item').on('click', changeNavigation).attr('id', 'next').append($('<button>').addClass('page-link').attr('aria-label', 'Suivant').append($('<span>').attr('aria-hidden', 'true').text('»'))));
        if (pageEnCours >= pages)
            $('#next').addClass('disabled');

        $('#dataTable_info').text(`Affichage de ${(nombre == 0) ? "0" : "1"} à ${Math.min(nombre, affichage)} sur ${nombre}`);

    }

    initialisation();

    $('li.page-item')

    $('#affichage').on('change', e => {
        //alert("Not Implemented Yet");
        affichage = parseInt($('#affichage option:selected').val());
        pages = parseInt(Math.ceil(nombre / affichage));
        pageEnCours = 1;
        initialisation()
    });


    var liste_mat = [];
    var liste_sch = []
    var listeTemp_M = []
    var listeTemp_S = [];
    var liste_coef = [];
    var listeTemp_C = [];
    var schemas = new Set();
    var matieres = new Set();
    var anciennesMat = new Set();
    var anciensSch = new Set();
    var anciensCoef = [];
    var idEdit;
    var idDelete;

    $.get('/listeMats')
        .done(json => {
            json.data.forEach(user => {
                if (user.email != json.user)
                    liste_mat.push({
                        label: `${user.nom_matiere}`,
                        value: `${user.id_matiere}`
                    });
            });
            $(".listeMats").autocomplete('option', 'source', liste_mat)
            listeTemp_M = Array.from(liste_mat);
        })
        .fail(xhr => {
            console.error(xhr);
        });

    $('.openModalCreate').on('click', e => {
        listeTemp_M = Array.from(liste_mat);
        $(".listeMats").autocomplete('option', {
            'source': listeTemp_M
        });
        $('#dateEvalCreateD').datetimepicker({
            format: 'yyyy/mm/dd hh:ii',
            locale: 'fr',
            language: 'fr'
        });
        $('#dateEvalCreateF').datetimepicker({
            format: 'yyyy/mm/dd hh:ii',
            locale: 'fr',
            language: 'fr'
        });
        // Changer choix année
        $('#listeMatsOnCreate').html('');
        $('#listeSchemasOnCreate').html('');
        $('#createEval input').val('');
        schemas = new Set();
        matieres = new Set();
    });

    $(".listeMats")
        .autocomplete({
            minLength: 0,
            source: liste_mat,
            focus: function (event, ui) {
                $(this).val(ui.item.label);
                return false;
            },
            select: function (event, ui) {
                var index = listeTemp_M.map(val => {
                    return val.value;
                }).indexOf(ui.item.value);
                matieres.add(ui.item.value);
                $(this).val("");
                var suppr = $('<button>').addClass("btn btn-secondary btn-sm").attr('id_matiere', ui.item.value).attr('type', "button").css("padding", "2px 4px").css("margin", "0 2px 2px 0").text(ui.item.label + ' ').append($('<i>').addClass("fa fa-trash-o"));
                suppr.on('click', function (e) {
                    var id = $(this).attr('id_matiere')
                    var index = liste_mat.map(val => {
                        return val.value;
                    }).indexOf(id);
                    matieres.delete(id);
                    listeTemp_M.push(liste_mat[index]);
                    $(".listeMats").autocomplete('option', {
                        'source': listeTemp_M
                    });
                    $(this).remove();
                });
                listeTemp_M.splice(index, 1);
                $(".listeMats").autocomplete('option', {
                    'source': listeTemp_M
                });
                $.get('/listeSchemas', {
                    matiere: suppr.attr('id_matiere')
                }).done(json => {
                    json.data.forEach(schema => {
                        liste_sch.push({
                            label: `${schema.nom_schema}`,
                            value: `${schema.id_schema}`
                        });
                    });
                    listeTemp_S = Array.from(liste_sch);
                    $(".listeSchemas").autocomplete('option', 'source', liste_sch)
                    listeTemp_S = Array.from(liste_sch);
                })
                    .fail(xhr => {
                        console.error(xhr);
                    });
                $('#listeMatsOnCreate').append(suppr.clone(true));
                $('#listeMatsOnEdite').append(suppr);
                return false;
            }
        });


    $(".listeSchemas")
        .autocomplete({
            minLength: 0,
            source: liste_sch,
            focus: function (event, ui) {
                $(this).val(ui.item.label);
                return false;
            },
            select: function (event, ui) {
                var index = listeTemp_S.map(val => {
                    return val.value;
                }).indexOf(ui.item.value);
                schemas.add(ui.item.value);
                $(this).val("");
                var suppr = $('<button>').addClass("btn btn-secondary btn-sm").attr('id_schema', ui.item.value).attr('type', "button").css("padding", "2px 4px").css("margin", "0 2px 2px 0").text(ui.item.label + ' ').append($('<i>').addClass("fa fa-trash-o"));
                var div1 = $('<div>').addClass("form-group row schema" + ui.item.value).appendTo($('#coef'));
                var div2 = $('<div>').addClass("col-4 mb-3 mb-sm-0").appendTo(div1);
                $('<label>').addClass("col-form-label").text("Coefficient " + ui.item.label).appendTo(div2);
                var div3 = $('<div>').addClass("col").appendTo(div1);
                $('<input>').addClass("form-control form-control-user listeCoef").attr("id", "CoefCreate" + ui.item.value).attr('type', "number").attr("placeholder", 1.00).attr("step", 0.01).attr("min", 0).attr("max", 10).attr('required', "required").attr("maxLength", 30).appendTo(div3)
                suppr.on('click', function (e) {
                    var id = $(this).attr('id_schema')
                    $('.schema' + id).remove();
                    var index = liste_sch.map(val => {
                        return val.value;
                    }).indexOf(id);
                    schemas.delete(id);
                    listeTemp_S.push(liste_sch[index]);
                    $(".listeSchemas").autocomplete('option', {
                        'source': listeTemp_S
                    });
                    $(this).remove();
                });
                console.log(liste_sch)
                listeTemp_S.splice(index, 1);
                $(".listeSchemas").autocomplete('option', {
                    'source': listeTemp_S
                });
                $('#listeSchemasOnCreate').append(suppr.clone(true));
                $('#listeSchemasOnEdit').append(suppr);
                return false;
            }
        });

    $('#createEval').on('submit', e => {
        e.preventDefault();
        $("#coef").find("input").each(function () {
            var label = $(this).attr('id').slice(10);
            liste_coef.push({
                label: parseInt(label),
                value: parseInt($(this).val())
            });
        });
        $.post('/ajoutEval', {
            nom: $('#nomInputCreate').val(),
            matiere: parseInt(Array.from(matieres)[0]),
            schemas: Array.from(schemas),
            nb: schemas.size,
            date_deb: $('#dateEvalCreateD').val(),
            date_fin: $('#dateEvalCreateF').val(),
            coef: liste_coef
        }).done(msg => {
            window.location.reload();
        }).fail(xhr => {
            console.error(xhr);
        })
    })
// Problème sur les listes
    $('.openModalEdit').on('click', function (e) {
        listeTemp_M = Array.from(liste_mat);
        listeTemp_S = Array.from(liste_sch);

        $(".listeMats").autocomplete('option', {
            'source': listeTemp_M
        });
        $(".listeSchemas").autocomplete('option', {
            'source': listeTemp_S
        });
        $('#dateEvalEditD').datetimepicker({
            format: 'yyyy/mm/dd hh:ii',
            locale: 'fr',
            language: 'fr'
        });
        $('#dateEvalEditF').datetimepicker({
            format: 'yyyy/mm/dd hh:ii',
            locale: 'fr',
            language: 'fr'
        });
        $('#listeMatsOnEdit').html('');
        $('#listeSchemasOnEdit').html('');
        $('#editEval input').val('');

        $.get('/evaluation', {
            eval: $(this).parent().parent().attr('id_eval')
        }).done(json => {
            $('#nomInputEdit').val(json.nom);
            $('#dateEvalEditF').val(json.fin);
            $('#dateEvalEditD').val(json.deb);

            idEdit = json.id
            matieres.add(json.id_mat)
            anciennesMat.add(json.id_mat)
            var suppr_mat = $('<button>').addClass("btn btn-secondary btn-sm").attr('id_matiere', json.id_mat).attr('type', "button").css("padding", "2px 4px").css("margin", "0 2px 2px 0").text(json.mat + ' ').append($('<i>').addClass("fa fa-trash-o"));
            var index = listeTemp_M.map(val => {
                return val.value;
            }).indexOf(json.id_mat);
            listeTemp_M.splice(index, 1);
            suppr_mat.on('click', function (e) {
                var id = $(this).attr('id_matiere')
                var index = liste_mat.map(val => {
                    return val.value;
                }).indexOf(parseInt(id));
                matieres.delete(parseInt(id));
                listeTemp_M.push(liste_mat[index]);
                $(".listeMats").autocomplete('option', { // remet à jour la recherche après del
                    'source': listeTemp_M
                });
                $(this).remove(); //suppr de l'affichage
            });
            $('#listeMatsOnEdit').append(suppr_mat);
            json.schemas.forEach(schema => {
                anciensCoef.push({
                    label: parseInt(schema.id_schema),
                    value: parseInt(schema.coefficient)
                });
                schemas.add(schema.id_schema);
                anciensSch.add(schema.id_schema);
                var suppr_sch = $('<button>').addClass("btn btn-secondary btn-sm").attr('id_schema', schema.id_schema).attr('type', "button").css("padding", "2px 4px").css("margin", "0 2px 2px 0").text(schema.nom_schema + ' ').append($('<i>').addClass("fa fa-trash-o"));
                var index = listeTemp_S.map(val => {
                    return val.value;
                }).indexOf(schema.id_schema);
                listeTemp_S.splice(index, 1);
                suppr_sch.on('click', function (e) {
                    var id = $(this).attr('id_schema')
                    var index = liste_sch.map(val => {
                        return val.value;
                    }).indexOf(parseInt(id));
                    schemas.delete(parseInt(id));
                    listeTemp_S.push(liste_sch[index]);
                    $(".listeSchemas").autocomplete('option', { // remet à jour la recherche après del
                        'source': listeTemp_S
                    });
                    $(this).remove(); //suppr de l'affichage
                });
                $('#listeSchemasOnEdit').append(suppr_sch);
                var exist = $("#CoefEdit" + schema.id_schema);
                if (!exist.length) {
                    var div1 = $('<div>').addClass("form-group row schema" + schema.id_schema).appendTo($('#coefonEdit'));
                    var div2 = $('<div>').addClass("col-4 mb-3 mb-sm-0").appendTo(div1);
                    $('<label>').addClass("col-form-label").text("Coefficient " + schema.nom_schema).appendTo(div2);
                    var div3 = $('<div>').addClass("col").appendTo(div1);
                    $('<input>').addClass("form-control form-control-user listeCoef").attr("id", "CoefEdit" + schema.id_schema).attr('type', "number").attr("value", schema.coefficient).attr("step", 0.01).attr("min", 0).attr("max", 10).attr('required', "required").attr("maxLength", 30).appendTo(div3)
                } else{
                    // Perte des coefs
                   exist.html()
                }
            });
            $(".listeSchemas").autocomplete('option', {
                'source': listeTemp_S
            });
            $(".listeMats").autocomplete('option', {
                'source': listeTemp_M
            });
        })
            .fail(xhr => {
                console.error(xhr);
            });
    })


    $('#editEval').on('submit', e => {
        e.preventDefault();
        $("#coefonEdit").find("input").each(function () {
            var label = $(this).attr('id').slice(10);
            liste_coef.push({
                label: parseInt(label),
                value: parseInt($(this).val())
            });
        });
        var l;
        var bool;
        var ajouter_coef = [];
        var supprimer_coef = [];
        var supprimer_m = new Set();
        var ajouter_m = new Set();
        var supprimer_s = new Set();
        var ajouter_s = new Set();

        matieres.forEach(mat => {
            if (!anciennesMat.has(mat))
                ajouter_m.add(mat);
        });
        anciennesMat.forEach(mat => {
            if (!matieres.has(mat))
                supprimer_m.add(mat);
        });
        anciensSch.forEach(sch => {
            if (!schemas.has(sch))
                supprimer_s.add(sch);
        });
        schemas.forEach(sch => {
            if (!anciensSch.has(sch))
                ajouter_s.add(sch);
        });
        if (liste_coef.length >= anciensCoef.length)
            l = liste_coef.length,
                bool = true
        else
            l = anciensCoef.length,
                bool = false

        for (var i = 0; i < l; i++)
            if (bool) {
                if (liste_coef[i].label !== anciensCoef[i].label)
                    ajouter_coef.push(liste_coef[i])
                else if (liste_coef[i].value !== anciensCoef[i].value)
                    ajouter_coef.push(liste_coef[i])
            } else {
                if (anciensCoef[i].label !== liste_coef[i].label)
                    supprimer_coef.push(liste_coef[i])
                else if (liste_coef[i].value !== anciensCoef[i].value)
                    ajouter_coef.push(liste_coef[i])
            }
        $.post('/editEval', {
            nom: $('#nomInputEdit').val(),
            deb: $('#dateEvalEditD').val(),
            fin: $('#dateEvalEditF').val(),
            id: idEdit,
            ajouter_m: Array.from(ajouter_m),
            supprimer_m: Array.from(supprimer_m),
            ajouter_s: Array.from(ajouter_s),
            supprimer_s: Array.from(supprimer_s),
            ajouter_coef: ajouter_coef,
            supprimer_coef: supprimer_coef
        })
            .done(msg => {
                window.location.reload();
            })
            .fail(xhr => {
                console.error(xhr);
            });
    });

    $("#dataTable").on('click', function(){
        console.log($(this))
    });
    /*$('#clock').countdown(get15dayFromNow(), function(event) {
        var $this = $(this).html(event.strftime(''
            + '<span class="h1 font-weight-bold">%D</span> Day%!d'
            + '<span class="h1 font-weight-bold">%H</span> Hr'
            + '<span class="h1 font-weight-bold">%M</span> Min'));
    });*/

});




