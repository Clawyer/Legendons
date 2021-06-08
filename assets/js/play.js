// https://github.com/Daplie/knuth-shuffle
function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }
    return array;
}


$(function () {
    const urlParams = new URLSearchParams(window.location.search);
    let id_eval;
    let ids = urlParams.get('id').split('?');
    let id_schema = ids[0];
    if (ids[1]) {
        id_eval = ids[1].split('id_eval=')[1]

        $.get('/evaluation', {eval: id_eval})
            .done(json => {
                let deb = json.deb;
                let fin = json.fin;
                fin = new Date(fin).getTime();
                $('#timer').css('float', 'right');
                var x = setInterval(function () {
                    var now = new Date().getTime();
                    var distance = fin - now;
                    // Time calculations for days, hours, minutes and seconds
                    var days = Math.floor(distance / (1000 * 60 * 60 * 24));
                    var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                    var seconds = Math.floor((distance % (1000 * 60)) / 1000);

                    // Display the result in the element with id="demo"
                    $('#time').text(days + "j " + hours + "h "
                        + minutes + "m " + seconds + "s ");

                    // If the count down is finished, write some text
                    if (distance < 0) {
                        clearInterval(x);
                        $('#time').text("Terminé");
                        window.location.href = "/evaluations";
                    }
                }, 1000);
            });
    }


    const canvas = document.getElementById("canvas");
    const context = canvas.getContext("2d");

    let num = 0;
    let x_debut = [];
    let y_debut = [];
    let x_fin = [];
    let y_fin = [];

    let aleatoire;

    let start = false;

    if (id_schema) {
        $.get('/schema', {id: id_schema})
            .done(json => {
                let evals = json.evals
                if (JSON.parse(json.bool) === false && !id_eval )
                    if ( evals )
                        window.location.href = "/";
                let legendes = JSON.parse(json.legendes);
                let fake = JSON.parse(json.fake) || [];
                x_debut = JSON.parse(json.x_debut);
                x_fin = JSON.parse(json.x_fin);
                y_debut = JSON.parse(json.y_debut);
                y_fin = JSON.parse(json.y_fin);
                num = legendes.length;
                showImg().then(retracer);


                aleatoire = new Array(num + fake.length);
                for (let i = 0; i < aleatoire.length; i++) {
                    aleatoire[i] = i + 1;
                }

                shuffle(aleatoire);
                aleatoire.forEach(i => {
                    let nouveau = $("<div>").attr("class", "ligne").attr("id", i);
                    $("#plateau").append(nouveau);
                    let b = $(`<input type='number' class='reponse_ligne' size='2' min='1' max=${num} id='${i}'>`);
                    nouveau.append(b);
                    console.log(i);
                    if (i <= num) {
                        nouveau.append($("<input type='text' disabled class='ligne_saisie' size='30' id='" + i + "'>").val(legendes[i - 1]));
                    } else {
                        nouveau.append($("<input type='text' disabled class='ligne_saisie' size='30' id='" + i + "'>").val(fake[i - num - 1]));
                    }
                })
            });
    }

    function showImg() {
        const url = "/images/" + id_schema + '.jpg';
        $("#img_import").remove();

        $("#canvas").css("background-images", "url(\"" + url + "\")");
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

    function convert(num, den, e) {
        return (num * e) / den;
    }

    $('#valider').on('submit', (e) => {
        e.preventDefault();
        $('.reponse_ligne').css('border-color', '')
        let i = 0;
        let dejaVu = [];
        let correct = [];
        let incorrect = [];
        let note;
        let fini = true;

        $('.reponse_ligne').each(function () {
            let reponse = $(this).val();
            if (dejaVu.includes(reponse)) {
                let error = $('<p style="color: red;">Vous avez entré des valeurs en double ! Merci de rectifier.</p>');
                error.insertAfter('#buttonValider');
                setTimeout(() => {
                    error.remove();
                }, 10000);
                fini = false;
            }
            if (reponse != "") dejaVu.push(reponse);

            if (aleatoire[i] == reponse) {
                correct.push($(this));
            } else {
                if (reponse != "") {
                    incorrect.push($(this));
                }
            }
            i++;
        });
        if (!id_eval) {

            if (fini) {
                incorrect.forEach(el => {
                    el.css('border-color', 'red');
                });
                correct.forEach(el => {
                    el.css('border-color', 'green');
                });
                note = '' + correct.length + '/' + num + '';

                if (correct.length == num && incorrect.length == 0) {
                    let valid = $('<p style="color: green;">Tout est correct ! Félicitations !</p>');
                    valid.insertAfter('#buttonValider');
                    setTimeout(() => {
                        valid.remove();
                    }, 10000);
                }
            }
        } else {
            if (fini) {
                note = convert(correct.length, num, 20);
                console.log(id_schema, id_eval, note, correct.length, num,)
                $.post('/envoi_note', {
                    id_schema: id_schema,
                    id_eval: id_eval,
                    note: note,
                }).done(msg => {
                    window.location.href = "/schema_eval?id_eval=" + id_eval;
                }).fail(xhr => {
                    console.error(xhr);
                });
            }
        }

    });

});