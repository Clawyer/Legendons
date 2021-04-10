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

        $('#dataTable_info').text(`Affichage de ${first+1} à ${last+1} sur ${nombre}`);

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
    var listeTemp = []
    var etudiants = new Set();
    var anciensEtudiants = new Set();
    var idEdit;
    var idDelete;

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
            listeTemp = Array.from(liste);
        })
        .fail(xhr => {
            console.error(xhr);
        });

    $('.openModalCreate').on('click', e => {
        listeTemp = Array.from(liste);
        $(".listeEtudiants").autocomplete('option', {
            'source': listeTemp
        });
        $('#listeEtudiantsOnCreate').html('');
        $('#createMatiere input').val('');
        etudiants = new Set();
    });

    $('.openModalEdit').on('click', function (e) {
        listeTemp = Array.from(liste);
        $(".listeEtudiants").autocomplete('option', {
            'source': listeTemp
        });
        $('#listeEtudiantsOnEdit').html('');
        $('#editMatiere input').val('');
        $.get('/matiere', {
                matiere: $(this).parent().parent().attr('id_matiere')
            })
            .done(json => {
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
                        listeTemp.splice(index, 1);
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
                    }
                    $('#listeEtudiantsOnEdit').append(suppr);
                });
                $(".listeEtudiants").autocomplete('option', {
                    'source': listeTemp
                });
            });
    });

    $('.openModalDelete').on('click', function (e) {
        console.log('click');
        idDelete = $(this).parent().parent().attr('id_matiere');
    });

    $(".listeEtudiants")
        .autocomplete({
            minLength: 0,
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
                $('#listeEtudiantsOnCreate').append(suppr.clone());
                $('#listeEtudiantsOnEdit').append(suppr);
                return false;
            }
        });

    $('#createMatiere').on('submit', e => {
        e.preventDefault();
        console.log(etudiants);
        $.post('/ajoutMatiere', {
                nom: $('#nomInputCreate').val(),
                liste: Array.from(etudiants)
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
        etudiants.forEach(etudiant => {
            if (!anciensEtudiants.has(etudiant))
                ajouter.add(etudiant);

        });
        anciensEtudiants.forEach(etudiant => {
            if (!etudiants.has(etudiant))
                supprimer.add(etudiant);
        });

        $.post('/editMatiere', {
                nom: $('#nomInputEdit').val(),
                id: idEdit,
                ajouter: Array.from(ajouter),
                supprimer: Array.from(supprimer)
            })
            .done(msg => {
                window.location.reload();
            })
            .fail(xhr => {
                console.error(xhr);
            });
    });

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