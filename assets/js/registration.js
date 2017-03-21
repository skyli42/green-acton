function isValidEmailAddress(emailAddress) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(emailAddress);
}

function isValidPhoneNumber(phoneNumber) {
    var pattern = /^[0-9\s- \+]{8,13}$/;
    return(pattern.test(phoneNumber));
}

function isNumber(string) {
    return (isNaN(string));
}

$('#registration').submit(function(event) {

    var nameInput = $('#nameInput').val();
    var emailAddressInput = $('#emailAddressInput').val();
    var phoneNumberInput = $('#phoneNumberInput').val();
    var groupNumberInput = $('#groupNumberInput').val();
    
    if (nameInput == '') {
        $('#invalidEmail').empty();
        $('#invalidPhoneNumber').empty();
        $('#invalidGroupNumber').empty();  
        $('#invalidName').html("please enter a name<br><br>");
    }
    else if (!isValidEmailAddress(emailAddressInput)) {
        $('#invalidName').empty();
        $('#invalidPhoneNumber').empty();
        $('#invalidGroupNumber').empty();   
        $('#invalidEmailAddress').html("invalid email address<br><br>");
    }
    else if (!isValidPhoneNumber(phoneNumberInput)) {
        $('#invalidName').empty();
        $('#invalidEmail').empty();
        $('#invalidGroupNumber').empty();   
        $('#invalidPhoneNumber').html("invalid phone number<br><br>");
    }
    else if (isNumber(groupNumberInput)) {
        $('#invalidName').empty();
        $('#invalidEmail').empty();
        $('#invalidPhoneNumber').empty();
        $('#invalidGroupNumber').html("invalid group number<br><br>");
    }
    else {
        
        socket.emit('registration', {
            name: nameInput,
            emailAddress: emailAddressInput,
            phoneNumber: phoneNumberInput,
            groupNumber: groupNumberInput
        });
        
        $('#invalidName').empty();
        $('#invalidEmail').empty();
        $('#invalidPhoneNumber').empty();
        $('#invalidGroupNumber').empty();   
    }
    event.preventDefault();
});