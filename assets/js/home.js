$(function() {
    $('#login').on('submit', e => {
        e.preventDefault();

        if ($('#login')[0].checkValidity() === false) {
            $('#login').addClass('was-validated');
            return;
        }

        var username = $('#username').val();
        var password = $('#password').val();
        var check = $('#check').is(":checked");

        $.post('/login',{
            username: username,
            password: password,
            save: check
        })
        .done(function(msg){ 
            window.open(msg, "_self");
         })
        .fail(function(xhr) {
            $('#error').text(`Erreur ${xhr.status} : ${xhr.responseText}`);
            $('#error').fadeIn(500);
            setTimeout(() => {$('#error').fadeOut(500)}, 4000);
        });
    });
});