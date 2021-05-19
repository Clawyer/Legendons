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
    let id = urlParams.get('id');

    const canvas = document.getElementById("canvas");
    const context = canvas.getContext("2d");

    let num = 0;
    let x_debut = [];
    let y_debut = [];
    let x_fin = [];
    let y_fin = [];

    let aleatoire;

    let start = false;

    if (id) {
        $.get('/schema', {id: id})
            .done(json => {
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
                    aleatoire[i] = i+1;
                }

                shuffle(aleatoire);

                console.log(num);
                aleatoire.forEach(i => {
                    let nouveau = $("<div>").attr("class", "ligne").attr("id", i);
                    $("#plateau").append(nouveau);
                    let b = $(`<input type='number' class='reponse_ligne' size='2' min='1' max=${num} id='${i}'>`);
                    nouveau.append(b);
                    console.log(i);
                    if (i <= num) {
                        nouveau.append($("<input type='text' disabled class='ligne_saisie' size='30' id='" + i + "'>").val(legendes[i-1]));
                    } else {
                        nouveau.append($("<input type='text' disabled class='ligne_saisie' size='30' id='" + i + "'>").val(fake[i-num-1]));
                    }
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

    $('#valider').on('submit', (e) => {
        e.preventDefault();
        // reactualiser couleur reponse
        $('.reponse_ligne').css('border-color', '')

        let i = 0;
        let dejaVu = [];
        let correct = [];
        let incorrect = [];
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

        if (fini) {
            incorrect.forEach(el => {
                el.css('border-color', 'red');
            });
            correct.forEach(el => {
                el.css('border-color', 'green');
            });

            if (correct.length == num && incorrect.length == 0) {
                let valid = $('<p style="color: green;">Tout est correct ! Félicitations !</p>');
                valid.insertAfter('#buttonValider');
                setTimeout(() => {
                    valid.remove();
                }, 10000);
            }
        }
    });

});