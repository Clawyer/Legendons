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


    var liste = [];
    var gliste = []
    var listeTemp = []
    var groupeTemp = [];
    var etudiants = new Set();
    var groupes = new Set();
    var anciensEtudiants = new Set();
    var anciensGroupes = new Set();
    var idEdit;
    var idDelete;
    // json = { data = { list des users}}
    $.get('/listeComptes')
        .done(json => {
            json.data.forEach(user => {
                if (user.email != json.user)
                    liste.push({
                        label: `${user.prenom} ${user.nom}`,
                        value: `${user.email}`
                    });
            });
            $(".listeEtudiants").autocomplete('option', 'source', liste)
            //option: json, list
            listeTemp = Array.from(liste);
        })
        .fail(xhr => {
            console.error(xhr);
        });

    $.get('/listeGroupes')
        .done(json => {
            json.data.forEach(user => {
                if (user.email != json.user)
                    gliste.push({
                        label: `${user.nom_groupe}`,
                        value: `${user.id_groupe}`
                    });
            });
            $(".listeGroupes").autocomplete('option', 'source', liste)
            //option: json, list
            groupeTemp = Array.from(gliste);
        })
        .fail(xhr => {
            console.error(xhr);
        });

    $('.openModalCreate').on('click', e => {
        listeTemp = Array.from(liste);
        groupeTemp = Array.from(gliste);
        $(".listeEtudiants").autocomplete('option', {
            'source': listeTemp
        });
        $(".listeGroupes").autocomplete('option', {
            'source': groupeTemp
        });
        $('#listeEtudiantsOnCreate').html('');
        $('#listeGroupesOnCreate').html('');
        $('#createMatiere input').val('');
        etudiants = new Set();
        groupes = new Set();
    });

    $('.openModalEdit').on('click', function (e) {
        listeTemp = Array.from(liste);
        groupeTemp = Array.from(gliste)
        $(".listeEtudiants").autocomplete('option', {
            'source': listeTemp
        });
        $(".listeGroupes").autocomplete('option', {
            'source': groupeTemp
        });
        $('#listeEtudiantsOnEdit').html('');
        $('#listeGroupesOnEdit').html('');
        $('#editMatiere input').val('');

        $.get('/matiere', {
            matiere: $(this).parent().parent().attr('id_matiere')
        })
            .done(json => {
                console.log(json);
                $('#nomInputEdit').val(json.nom);
                idEdit = json.id
                json.users.forEach(user => {
                    etudiants.add(user.email);
                    anciensEtudiants.add(user.email);
                    var suppr = $('<button>').addClass("btn btn-secondary btn-sm").attr('email', user.email).attr('type', "button").css("padding", "2px 4px").css("margin", "0 2px 2px 0").text(user.prenom + ' ' + user.nom + ' ').append($('<i>').addClass("fa fa-trash-o"));
                    if (json.user == user.email)
                        suppr.addClass('disabled')
                    else {
                        var index = listeTemp.map(val => {
                            return val.value;
                        }).indexOf(user.email);
                        listeTemp.splice(index, 1); // etud deja add
                        suppr.on('click', function (e) {
                            var id = $(this).attr('email')
                            var index = liste.map(val => {
                                return val.value;
                            }).indexOf(id);
                            etudiants.delete(id);
                            listeTemp.push(liste[index]);
                            $(".listeEtudiants").autocomplete('option', { // remet à jour la recherche après del
                                'source': listeTemp
                            });
                            $(this).remove(); //suppr de l'affichage
                        });
                    }
                    $('#listeEtudiantsOnEdit').append(suppr);
                });
                $(".listeEtudiants").autocomplete('option', {
                    'source': listeTemp
                });

            });
        $.get('/matiere_groupe', {
            matiere: $(this).parent().parent().attr('id_matiere')
        })
            .done(json => {
                json.groupes.forEach(groupe => {
                    groupes.add(groupe.id_groupe);
                    anciensGroupes.add(groupe.id_groupe);
                    var suppr_grp = $('<button>').addClass("btn btn-secondary btn-sm").attr('id_groupe', groupe.id_groupe).attr('type', "button").css("padding", "2px 4px").css("margin", "0 2px 2px 0").text(groupe.nom_groupe + ' ').append($('<i>').addClass("fa fa-trash-o"));
                    var index = groupeTemp.map(val => {
                        return val.value;
                    }).indexOf(groupe.id_groupe);
                    groupeTemp.splice(index, 1); // groupe deja add
                    suppr_grp.on('click', function (e) {
                        var id = $(this).attr('id_groupe')
                        var index = gliste.map(val => {
                            return val.value;
                        }).indexOf(parseInt(id));
                        groupes.delete(parseInt(id));
                        groupeTemp.push(gliste[index]);
                        $(".listeGroupes").autocomplete('option', { // remet à jour la recherche après del
                            'source': groupeTemp
                        });
                        $(this).remove(); //suppr de l'affichage
                    });
                    $('#listeGroupesOnEdit').append(suppr_grp);
                });
                $(".listeGroupes").autocomplete('option', {
                    'source': groupeTemp
                });
            });
    });
    // bouton suppr matiere
    $('.openModalDelete').on('click', function (e) {
        console.log('click');
        idDelete = $(this).parent().parent().attr('id_matiere');
    });

    $(".listeEtudiants")
        .autocomplete({
            minLength: 0, // a changer
            source: liste,
            focus: function (event, ui) {
                $(this).val(ui.item.label);
                return false;
            },
            select: function (event, ui) {
                var index = listeTemp.map(val => {
                    return val.value;
                }).indexOf(ui.item.value);
                etudiants.add(ui.item.value);
                $(this).val("");
                var suppr = $('<button>').addClass("btn btn-secondary btn-sm").attr('email', ui.item.value).attr('type', "button").css("padding", "2px 4px").css("margin", "0 2px 2px 0").text(ui.item.label + ' ').append($('<i>').addClass("fa fa-trash-o"));
                suppr.on('click', function (e) {
                    var id = $(this).attr('email')
                    var index = liste.map(val => {
                        return val.value;
                    }).indexOf(id);
                    etudiants.delete(id);
                    listeTemp.push(liste[index]);
                    $(".listeEtudiants").autocomplete('option', {
                        'source': listeTemp
                    });
                    $(this).remove();
                });
                listeTemp.splice(index, 1);
                $(".listeEtudiants").autocomplete('option', {
                    'source': listeTemp
                });
                console.log(suppr);
                $('#listeEtudiantsOnCreate').append(suppr.clone(true));
                $('#listeEtudiantsOnEdit').append(suppr);
                return false;
            }
        });

    $(".listeGroupes")
        .autocomplete({
            minLength: 0, // a changer
            source: gliste,
            focus: function (event, ui) {
                $(this).val(ui.item.label);
                return false;
            },
            select: function (event, ui) {
                var index = groupeTemp.map(val => {
                    return val.value;
                }).indexOf(ui.item.value);
                groupes.add(ui.item.value);
                $(this).val("");
                var suppr = $('<button>').addClass("btn btn-secondary btn-sm").attr('id_groupe', ui.item.value).attr('type', "button").css("padding", "2px 4px").css("margin", "0 2px 2px 0").text(ui.item.label + ' ').append($('<i>').addClass("fa fa-trash-o"));
                suppr.on('click', function (e) {
                    var id = $(this).attr('id_groupe')
                    var index = gliste.map(val => {
                        return val.value;
                    }).indexOf(id);
                    groupes.delete(id);
                    groupeTemp.push(gliste[index]); // Rajout element select de recherche
                    $(".listeGroupes").autocomplete('option', {
                        'source': groupeTemp
                    });
                    $(this).remove();
                });
                groupeTemp.splice(index, 1); // Suppr element selectionné de la recherche
                $(".listeGroupes").autocomplete('option', {
                    'source': groupeTemp
                });
                console.log(suppr);
                $('#listeGroupesOnCreate').append(suppr.clone(true));
                $('#listeGroupesOnEdit').append(suppr);
                return false;
            }
        });


    $('#createMatiere').on('submit', e => {
        e.preventDefault();
        console.log(etudiants);
        $.post('/ajoutMatiere', {
            nom: $('#nomInputCreate').val(),
            liste: Array.from(etudiants),
            gliste: Array.from(groupes)
        })
            .done(msg => {
                window.location.reload();
            })
            .fail(xhr => {
                console.error(xhr);
            })
    })

    $('#editMatiere').on('submit', e => {
        e.preventDefault();
        var supprimer = new Set();
        var ajouter = new Set();
        var supprimer_g = new Set();
        var ajouter_g = new Set();

        etudiants.forEach(etudiant => {
            if (!anciensEtudiants.has(etudiant))
                ajouter.add(etudiant);
        });
        anciensEtudiants.forEach(etudiant => {
            if (!etudiants.has(etudiant))
                supprimer.add(etudiant);
        });
        anciensGroupes.forEach(groupe => {
            if (!groupes.has(groupe))
                supprimer_g.add(groupe);
        });
        groupes.forEach(groupe => {
            if (!anciensGroupes.has(groupe))
                ajouter_g.add(groupe);
        });


        $.post('/editMatiere', {
            nom: $('#nomInputEdit').val(),
            id: idEdit,
            ajouter: Array.from(ajouter),
            supprimer: Array.from(supprimer),
            ajouter_g: Array.from(ajouter_g),
            supprimer_g: Array.from(supprimer_g)
        })
            .done(msg => {
                window.location.reload();
            })
            .fail(xhr => {
                console.error(xhr);
            });
    });
    // suppr def
    $('#deleteMatiere').on('click', e => {
        $.post('/deleteMatiere', {
            matiere: idDelete
        })
            .done(msg => {
                window.location.reload();
            })
            .fail(xhr => {
                console.error(xhr);
            });
    });
});