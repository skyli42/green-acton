$('#registration').submit(function(event) {
    
    var nameInput = $('#nameInput').val();
    var emailInput = $('#emailInput').val();
    var phoneNumberInput = $('#phoneNumberInput').val();
    var groupNumberInput = $('#groupNumberInput').val();

    if (nameInput = '') {
        $('#submitted').empty();
        $('#invalidName').html("enter a name");
    }
    else if (!isValidEmailAddress(emailInput)) {
        $('#submitted').empty();
        $('#invalidEmail').html("invalid email address");
    }
    else if (!isValidPhoneNumber) {
        $('submitted').empty();
        $('#invalidPhoneNumber').html("invalid phone number");
    }
    else if (isNaN(groupNumberInput)) {
        $('submitted').empty();
        $('#invalidGroupNumber').html("invalid group number");
    }
    else {
        socket.emit('registration', {
            name: nameInput
            emailAddress: emailInput
            phoneNumber: phoneNumberInput
            groupNumber: groupNumberInput
        });
        
        $('#invalidName').empty();
        $('#invalidEmail').empty();
        $('#invalidPhoneNumber').empty();
        $('#invalidGroupNumber').empty();
        $('#submitted').html("Thanks for signing up!");
        
    }
    event.preventDefault();
});

function isValidEmailAddress(emailAddress) {
    var regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return regEx.test(emailAddress);
}

function isValidPhoneNumber(phoneNumber) {
  var regEx = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
  return phoneNumber.value.match(phoneNumber);
}