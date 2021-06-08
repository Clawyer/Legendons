$(function () {

    $('#profile_picture').click(function() {
        $('#input_file').click()
    });
    /*var btnCust = '<button type="button" class="btn btn-secondary" title="Add picture tags" </button>' ;

    $('#input_file').fileinput({
        overwriteInitial: true,
        maxFileSize: 1500,
        showClose: false,
        showCaption: false,
        browseLabel: '',
        removeLabel: '',
        browseIcon: '<i class="glyphicon glyphicon-folder-open"></i>',
        removeIcon: '<i class="glyphicon glyphicon-remove"></i>',
        removeTitle: 'Cancel or reset changes',
        elErrorContainer: '#kv-avatar-errors-1',
        msgErrorClass: 'alert alert-block alert-danger',
        defaultPreviewContent: '<img src="assets/img/dogs/image2.jpeg" alt="Your Avatar">',
        layoutTemplates: {main2: '{preview} ' +  btnCust + ' {remove} {browse}'},
        allowedFileExtensions: ["jpg", "png", "gif"]
    });*/


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