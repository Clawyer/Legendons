$(function () {
    const urlParams = new URLSearchParams(window.location.search);
    let id = urlParams.get('id');

    const canvas = document.getElementById("canvas");
    const context = canvas.getContext("2d");

    let num = 0;
    let x_debut = [];
    let y_debut = [];
    let x_fin = [];
    let y_fin = [];

    let start = false;

    if (id) {
        $.get('/schema', {id: id})
            .done(json => {
                let legendes = JSON.parse(json.legendes);
                let fake = JSON.parse(json.fake);
                x_debut = JSON.parse(json.x_debut);
                x_fin = JSON.parse(json.x_fin);
                y_debut = JSON.parse(json.y_debut);
                y_fin = JSON.parse(json.y_fin);
                num = JSON.parse(json.legendes).length;
                $(`#matiere option:selected`).attr('selected', 'false');
                $(`#matiere option[value="${json.id_matiere}"]`).attr('selected', 'true');
                $(`#visibilite option:selected`).attr('selected', 'false');
                $(`#visibilite option[value="${json.schema_public}"]`).attr('selected', 'true');
                showImg().then(retracer);
                $('#titre').val(json.nom_schema);
                for (let i = 0; i < num; i++) {
                    let nouveau = $("<div>").attr("class", "ligne").attr("id", i + 1);
                    $("#plateau").append(nouveau);
                    let b = $("<button title='Supprimer' class='bouton_ligne' id='" + (i + 1) + "'>").text((i + 1) + " : ");
                    b.on("click", function () {
                        onClickSupprLegende(this);
                    });
                    nouveau.append(b);
                    nouveau.append($("<input type='text' class='ligne_saisie' size='30' id='" + (i + 1) + "'>").val(legendes[i]));
                }
                if (fake)
                    fake.forEach(text => {
                        let nouveau = $("<div>").attr("class", "ligne");
                        $("#plateau").append(nouveau);
                        let b = $("<button title='Supprimer' class='bouton_ligne'>").text("? :");
                        nouveau.append(b);
                        nouveau.append($("<input type='text' class='fake_ligne_saisie' size='30'>").val(text));
                        b.on("click", function () {
                            $(this).parent().remove();
                        });
                    })
            });
    }

    function showImg() {
        const url = "/image/" + id + '.jpg';

        $("#img_import").remove();

        $("#canvas").css("background-image", "url(\"" + url + "\")");
        const img = new Image();
        img.src = url;

        return new Promise(resolve => {
            img.addEventListener("load", function () {
                let h = 500 * this.naturalHeight / this.naturalWidth;
                $("#canvas").attr("height", h);
                resolve();
            });
        });


    }

    function onClickSupprLegende(button) {
        // on supprime la ligne
        id = parseInt($(button).attr("id"));
        $("#" + id + ".ligne").remove();

        // on renomme les autres lignes
        for (i = id + 1; i <= num; i++) {
            $("#" + i + ".ligne").attr("id", i - 1);
            $("#" + i + ".bouton_ligne").attr("id", i - 1).text(i - 1 + " : ");
            $("#" + i + ".ligne_saisie").attr("id", i - 1);
        }
        // on supprime et aussi l'étiquette du modele
        x_debut.splice(id - 1, 1);
        y_debut.splice(id - 1, 1);
        x_fin.splice(id - 1, 1);
        y_fin.splice(id - 1, 1);
        num--;
        retracer();
    }

    function init() {
        num = 0;
        x_debut = [];
        y_debut = [];
        x_fin = [];
        y_fin = [];
        $(".ligne").remove();

    }

    function retracer() {
        context.clearRect(0, 0, canvas.width, canvas.height);
        // on redessine toutes les lignes et les carrés
        for (let i = 0; i <= num; i++) {
            context.beginPath();
            context.moveTo(x_debut[i], y_debut[i]);
            context.lineTo(x_fin[i], y_fin[i]);
            context.stroke();
            context.closePath();

            context.fillStyle = "rgb(255,255,255)";
            context.fillRect(x_fin[i] - 12, y_fin[i] - 20, 30, 30);
            context.fillStyle = "rgb(0,0,0)";
            context.strokeRect(x_fin[i] - 12, y_fin[i] - 20, 30, 30);
            context.fillText(i + 1, x_fin[i], y_fin[i]);
        }
    }

    $("#canvas").on('mousedown', function (evt) {
        start = true;
        let x0 = evt.clientX - canvas.offsetLeft + document.scrollingElement.scrollLeft;
        let y0 = evt.clientY - canvas.offsetTop + document.scrollingElement.scrollTop;
        x_debut[num] = x0;
        y_debut[num] = y0;
        x_fin[num] = x0;
        y_fin[num] = y0;
    })
        .on('mousemove', function (evt) {
            if (!start) return;
            let x = evt.clientX - canvas.offsetLeft + document.scrollingElement.scrollLeft;
            let y = evt.clientY - canvas.offsetTop + document.scrollingElement.scrollTop;
            x_fin[num] = x;
            y_fin[num] = y;
            retracer();
        })
        .on('mouseup', function (evt) {
            if (start) {
                start = false;
                num++;

                // on créé un carré avec un chiffre dedans
                x = evt.clientX - canvas.offsetLeft + document.scrollingElement.scrollLeft;
                y = evt.clientY - canvas.offsetTop + document.scrollingElement.scrollTop;
                context.fillStyle = "rgb(255,255,255)";
                context.fillRect(x - 12, y - 20, 30, 30);
                context.fillStyle = "rgb(0,0,0)";
                context.strokeRect(x - 12, y - 20, 30, 30);
                context.fillText(num, x, y);

                // on ajoute un textarea
                let nouveau = $("<div>").attr("class", "ligne").attr("id", num);
                console.log(num);
                if ($('#plateau .ligne').length != 0)
                    nouveau.insertAfter(`#${num - 1}.ligne`);
                else
                    $('#plateau').append(nouveau);
                let b = $("<button title='Supprimer' class='bouton_ligne' id='" + num + "'>").text(num + " : ");
                nouveau.append(b);
                nouveau.append($("<input type='text' class='ligne_saisie' size='30' id='" + num + "'>"));
                b.on("click", function () {
                    onClickSupprLegende(this);
                });
            }
        });

    // chargement d'une nouvelle image
    $("#import_image").on('change', function () {
        const fic = this.files[0];

        const formdata = new FormData();
        formdata.append('image', fic);

        $.ajax({
            url: "/upload",
            type: "POST",
            data: formdata,
            processData: false,
            contentType: false,
            success: function (result) {
                id = result;
                showImg().then(init);
            }
        });


    });

    $('#save').on('submit', (e) => {
        e.preventDefault();
        const data = {
            id: id,
            legendes: {},
            fake: {},
            x_debut: x_debut,
            x_fin: x_fin,
            y_debut: y_debut,
            y_fin: y_fin,
            titre: $('#titre').val(),
            id_matiere: $('#matiere option:selected').val(),
            public: $('#visibilite option:selected').val()
        };
        $('.ligne_saisie').each(function () {
            data.legendes[$(this).attr('id')] = $(this).val();
        });
        let i = 0;
        $('.fake_ligne_saisie').each(function () {
            data.fake[i] = $(this).val();
            ++i;
        });

        $.post('/save', data)
            .done(() => {
                let valid = $('<i id="valid" class="fas fa-check">')
                valid.insertAfter('#buttonSave');
                setTimeout(() => {
                    valid.remove();
                }, 10000);
            })
            .fail(() => {
                let valid = $('<i id="invalid" class="fas fa-times">')
                valid.insertAfter('#buttonSave');
                setTimeout(() => {
                    valid.remove();
                }, 10000);
        });
    });


    $('#drawtools button').on('click', function () {
        $('#drawtools button').removeClass('active');
        $(this).addClass('active');
    });

    $('#fakeButton').on('click', () => {
        // on ajoute un textarea
        let nouveau = $("<div>").attr("class", "ligne");
        $("#plateau").append(nouveau);
        let b = $("<button title='Supprimer' class='bouton_ligne'>").text("? :");
        nouveau.append(b);
        nouveau.append($("<input type='text' class='fake_ligne_saisie' size='30'>"));
        b.on("click", function () {
            $(this).parent().remove();
        });
    })

});