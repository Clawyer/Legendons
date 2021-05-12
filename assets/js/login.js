$(function () {
    var emailError = $('<div class="alert alert-danger alert-dismissible fade show" role="alert">L\'adresse email n\'existe pas dans la base<button type="button" class="close" data-dismiss="alert" aria-label="Fermer "><span aria-hidden="true">×</span></button></div>');
    var passError = $('<div class="alert alert-danger alert-dismissible fade show" role="alert">Mot de passe incorrect<button type="button" class="close" data-dismiss="alert" aria-label="Fermer "><span aria-hidden="true">×</span></button></div>');
    $('#login').on('submit', e => {
        e.preventDefault();
        var isValid = $('#login')[0].checkValidity(); // -> formulaire de co valide 
        $('#login').addClass('was-validated');// icon check
        if (isValid) {
            $.post('/login', {
                    email: $('#email').val(),
                    password: $('#password').val(),
                    save: $('#save').is(':checked')
                })
                .done(msg => {
                    window.open('/', '_self');
                })
                .catch(data => {
                    if (data.status == 400) {
                        $('#alert-location').prepend(emailError);
                    } else if (data.status == 403) {
                        $('#alert-location').prepend(passError);
                    } else {
                        console.log(data);
                    }
                });
        }
    })
});