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
    var anciensSch = new Set();
    var anciensCoef = [];
    var matiere;
    var ancienneMat;
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
            listeTemp_M = Array.from(liste_mat);
        })
        .fail(xhr => {
            console.error(xhr);
        });

    $('.openModalCreate').on('click', e => {
        listeTemp_M = Array.from(liste_mat);
        listeTemp_M.forEach(function (item) {
            $('select.listeMats').append('<option data-tokens="' + item.value + '">' + item.label + '</option>');
        });
        $('.listeMats').selectpicker('refresh');
        $('#dateEvalCreateD').datetimepicker({
            locale: 'fr',
        });
        $('#dateEvalCreateF').datetimepicker({
            locale: 'fr',
        });

        $('#listeSchemasOnCreate').html('');
        $('#coefCreate').html('');
        $('.coef').html('');
        $('#createEval input').val('');
        schemas = new Set();
        matiere = $(".listeMats").find(":selected").data('tokens');

        $.get('/listeSchemas', {
            matiere: matiere
        }).done(json => {
            liste_sch = [];
            json.data.forEach(schema => {
                liste_sch.push({
                    label: `${schema.nom_schema}`,
                    value: `${schema.id_schema}`
                });
            });
            listeTemp_S = Array.from(liste_sch);
            $(".listeSchemas").autocomplete('option', 'source', liste_sch)
        })
    });

    $("select.listeMats").change(function () {
        matiere = $(this).find(":selected").data('tokens');
        $.get('/listeSchemas', {
            matiere: matiere
        }).done(json => {
            liste_sch = [];
            json.data.forEach(schema => {
                liste_sch.push({
                    label: `${schema.nom_schema}`,
                    value: `${schema.id_schema}`
                });
            });
            $(".coef").html('')
            if (matiere !== ancienneMat && ancienneMat !== undefined) {
                $("#coefEdit").html('');
                $('#listeSchemasOnEdit').html('');
            } else {
                $('#listeSchemasOnCreate').html('');
                $("#coefCreate").html('');
            }
            listeTemp_S = Array.from(liste_sch);
            $(".listeSchemas").autocomplete('option', 'source', liste_sch)
        })

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
                var div1 = $('<div>').addClass("form-group row schema" + ui.item.value).appendTo($('.coef'));
                var div2 = $('<div>').addClass("col-4 mb-3 mb-sm-0").appendTo(div1);
                $('<label>').addClass("col-form-label").text("Coefficient " + ui.item.label).appendTo(div2);
                var div3 = $('<div>').addClass("col").appendTo(div1);
                $('<input>').addClass("form-control form-control-user listeCoef").attr("id", "Coef" + ui.item.value).attr('type', "number").attr("placeholder", 1.00).attr("step", 0.01).attr("min", 0).attr("max", 10).attr('required', "required").attr("maxLength", 30).appendTo(div3)
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
                listeTemp_S.splice(index, 1);
                $(".listeSchemas").autocomplete('option', {
                    'source': listeTemp_S
                });
                $('#listeSchemasOnCreate').append(suppr.clone(true));
                $('#listeSchemasOnEdit').append(suppr);
                return false;
            }
        });

    $('.openModalEdit').on('click', function (e) {
        listeTemp_M = Array.from(liste_mat);
        listeTemp_S = Array.from(liste_sch);
        anciensCoef = [];
        listeTemp_M.forEach(function (item) {
            $('select.listeMats').append('<option data-tokens="' + item.value + '">' + item.label + '</option>');
        });
        $('.listeMats').selectpicker('refresh');
        $('#dateEvalEditD').datetimepicker({
            locale: 'fr',
        });
        $('#dateEvalEditF').datetimepicker({
            locale: 'fr',
        });
        $('#listeSchemasOnEdit').html('');
        $('.coef').html('');
        $('#coefEdit').html('');
        $('#editEval input').val('');
        $.get('/evaluation', {
            eval: $(this).parent().parent().attr('id_eval')
        }).done(json => {
            $('#nomInputEdit').val(json.nom);
            $('#dateEvalEditF').val(json.fin);
            $('#dateEvalEditD').val(json.deb);
            $("select#listeMatsEdit option[data-tokens=" + json.id_mat + "]").attr('selected', 'selected').change();
            $.ajaxSetup({async: false});
            $.get('/listeSchemas', {
                matiere: json.id_mat
            }).done(e => {
                liste_sch = [];
                e.data.forEach(schema => {
                    liste_sch.push({
                        label: `${schema.nom_schema}`,
                        value: `${schema.id_schema}`
                    });
                });
                listeTemp_S = Array.from(liste_sch);
            });
            $.ajaxSetup({async: true});

            idEdit = json.id
            console.log(idEdit)
            matiere = json.id_mat
            ancienneMat = json.id_mat
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
                }).indexOf((schema.id_schema).toString());
                listeTemp_S.splice(index, 1);
                $(".listeSchemas").autocomplete('option', {
                    'source': listeTemp_S
                });
                suppr_sch.on('click', function (e) {
                    var id = $(this).attr('id_schema')
                    var index = liste_sch.map(val => {
                        return val.value;
                    }).indexOf(id);
                    schemas.delete(id);
                    listeTemp_S.push(liste_sch[index]);
                    $(".listeSchemas").autocomplete('option', { // remet à jour la recherche après del
                        'source': listeTemp_S
                    });
                    $(this).remove();
                    $('.schema' + id).remove();//suppr de l'affichage

                });
                $('#listeSchemasOnEdit').append(suppr_sch);
                var id_sch = (schema.id_schema).toString()
                var exist = $(".schema" + id_sch);
                if (exist.length === 0) {
                    var div1 = $('<div>').addClass("form-group row schema" + id_sch).appendTo($('#coefEdit'));
                    var div2 = $('<div>').addClass("col-4 mb-3 mb-sm-0").appendTo(div1);
                    $('<label>').addClass("col-form-label").text("Coefficient " + schema.nom_schema).appendTo(div2);
                    var div3 = $('<div>').addClass("col").appendTo(div1);
                    $('<input>').addClass("form-control form-control-user listeCoef").attr("id", "Coef" + id_sch).attr('type', "number").attr("value", schema.coefficient).attr("step", 0.01).attr("min", 0).attr("max", 10).attr('required', "required").attr("maxLength", 30).appendTo(div3)
                }
            });
            $(".listeSchemas").autocomplete('option', {
                'source': listeTemp_S
            });
        })
            .fail(xhr => {
                console.error(xhr);
            });
    })

    $('.openModalDelete').on('click', function (e) {
        idDelete = $(this).parent().parent().attr('id_eval');
    });

    $('#createEval').on('submit', e => {
        e.preventDefault();
        liste_coef = [];
        $("#coefCreate").find("input").each(function () {
            var label = $(this).attr('id').slice(4);
            liste_coef.push({
                label: parseInt(label),
                value: parseInt($(this).val())
            });
        });
        $.post('/ajoutEval', {
            nom: $('#nomInputCreate').val(),
            matiere: parseInt(matiere),
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

    findObject = function findObject(listOfObjects, objectToSearch) {
        let found = false, matchingKeys = 0;
        for (let object of listOfObjects) {
            found = false;
            matchingKeys = 0;
            for (let key of Object.keys(object)) {
                if (object[key] == objectToSearch[key]) matchingKeys++;
            }
            if (matchingKeys == Object.keys(object).length) {
                found = true;
                break;
            }
        }
        return found;
    }

    removed = function (old_array, new_array) {
        let foundList = [];
        for (let object of old_array) {
            if (!this.findObject(new_array, object)) foundList.push(object);
        }
        return foundList;
    };
    added = function (old_array, new_array) {
        let foundList = [];
        for (let object of new_array) {
            if (!this.findObject(old_array, object)) foundList.push(object);
        }
        return foundList;
    };

    $('#editEval').on('submit', e => {
        liste_coef = [];
        e.preventDefault();
        $("#coefEdit").find("input").each(function () {
            var label = $(this).attr('id').slice(4);
            liste_coef.push({
                label: parseInt(label),
                value: parseInt($(this).val())
            });
        });

        var ajouter_coef = [];
        var supprimer_coef = [];
        var supprimer_s = new Set();
        var ajouter_s = new Set();

        anciensSch.forEach(sch => {
            if (!schemas.has(sch))
                supprimer_s.add(sch);
        });
        schemas.forEach(sch => {
            if (!anciensSch.has(sch))
                ajouter_s.add(sch);
        });
        ajouter_coef = added(anciensCoef, liste_coef);
        supprimer_coef = removed(anciensCoef, liste_coef);

        $.post('/editEval', {
            nom: $('#nomInputEdit').val(),
            deb: $('#dateEvalEditD').val(),
            fin: $('#dateEvalEditF').val(),
            id: idEdit,
            ajouter_m: matiere,
            supprimer_m: ancienneMat,
            ajouter_s: Array.from(ajouter_s),
            supprimer_s: Array.from(supprimer_s),
            ajouter_coef: ajouter_coef,
            supprimer_coef: supprimer_coef,
            nb: liste_coef.length
        })
            .done(msg => {
                window.location.reload();
            })
            .fail(xhr => {
                console.error(xhr);
            });
    });

    $('#deleteEval').on('click', e => {
        console.log(idDelete)
        $.post('/deleteEval', {
            eval: idDelete
        })
            .done(msg => {
                window.location.reload();
            })
            .fail(xhr => {
                console.error(xhr);
            });
    });
});




