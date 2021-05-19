$(function () {
    var alert = $('<div class="alert alert-danger alert-dismissible fade show" role="alert">Les mots de passe ne correspondent pas<button type="button" class="close" data-dismiss="alert" aria-label="Fermer "><span aria-hidden="true">×</span></button></div>');
    var alreadyExist = $('<div class="alert alert-danger alert-dismissible fade show" role="alert">L\'adresse email existe déjà dans la base<button type="button" class="close" data-dismiss="alert" aria-label="Fermer "><span aria-hidden="true">×</span></button></div>');
    $('#register').on('submit', e => {
        e.preventDefault();
        var isValid = $('#register')[0].checkValidity();
        if ($('#passwordrepeat').val() !== $('#password').val()) {
            $('#alert-location').prepend(alert);
            return;
        }
        $('#register').addClass('was-validated');
        if (isValid) {
            $.post('/register', {
                    firstname: $('#firstname').val(),
                    name: $('#name').val(),
                    email: $('#email').val(),
                    password: $('#password').val()
                })
                .done(msg => {
                    window.open('/', '_self');
                })
                .catch(data => {
                    if (data.status == 409) {
                        $('#alert-location').prepend(alreadyExist);
                    } else {
                        console.log(data);
                    }
                });
        }
    })
});