$(function () {
    let tbody = $('tbody').first();
    let nombre = tbody.children().length;
    let affichage = parseInt($('#affichage option:selected').val());
    let pages = Math.ceil(nombre / affichage);
    let pageEnCours = 1;

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

    $('li.page-item')

    $('#affichage').on('change', e => {
        //alert("Not Implemented Yet");
        affichage = parseInt($('#affichage option:selected').val());
        pages = parseInt(Math.ceil(nombre / affichage));
        pageEnCours = 1;
        initialisation()
    });

    function moyenne_ponderee(arrValues, arrWeights) {

        var result = arrValues.map(function (value, i) {

            var weight = arrWeights[i];
            var sum = value * weight;

            return [sum, weight];
        }).reduce(function (p, c) {

            return [p[0] + c[0], p[1] + c[1]];
        }, [0, 0]);

        return Math.round(result[0] / result[1] * 100) / 100
    }

    var notes = [];
    var coef = [];
    $("#dataTable tbody tr").each(function () {
        coef.push(parseInt($(this).find('td').eq(1).text()));
        notes.push(parseInt($(this).find('td').eq(2).text()));
    });
    coef.pop(),notes.pop();
    var total = moyenne_ponderee(notes, coef);
    console.log(total)
    $('.total').text(total);


});