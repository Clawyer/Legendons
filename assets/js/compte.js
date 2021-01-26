$(function () {
    $('#editData').on('submit', e => {
        e.preventDefault();
        $.post('/updateUser', {
            nom: $('#nom').val(),
            prenom: $('#prenom').val(),
            mail: $('#mail').val(),
            username: $('#username').val()
        })
        .done(msg => {
            var ok = $('<i>').addClass('fas fa-check').css('color: green');
            $('#save').append(ok);
        })
        .fail(xhr => {
            console.error(xhr);
        })
    })
})