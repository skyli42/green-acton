function isValidEmailAddress(emailAddress) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(emailAddress);
}

function isValidPhoneNumber(phoneNumber) {
    var pattern = /^[0-9\s- \+]{8,13}$/;
    return pattern.test(phoneNumber) || phoneNumber == "";
}

function isNotNumber(string) {
    return isNaN(string) || string == "";
}

$('#registration').submit(function(event) {
    console.log("submit")
    var nameInput = $('#nameInput').val();
    var emailAddressInput = $('#emailAddressInput').val();
    var phoneNumberInput = $('#phoneNumberInput').val();
    var groupSizeInput = $('#groupSizeInput').val();
    
    if (nameInput == '') {
        $('#invalidEmail').empty();
        $('#invalidPhoneNumber').empty();
        $('#invalidGroupSize').empty();  
        $('#invalidName').html("please enter your name<br>");
    }
    else if (!isValidEmailAddress(emailAddressInput)) {
        $('#invalidName').empty();
        $('#invalidPhoneNumber').empty();
        $('#invalidGroupSize').empty();   
        $('#invalidEmailAddress').html("invalid email address<br>");
    }
    else if (!isValidPhoneNumber(phoneNumberInput)) {
        $('#invalidName').empty();
        $('#invalidEmail').empty();
        $('#invalidGroupSize').empty();   
        $('#invalidPhoneNumber').html("invalid phone number<br>");
    }
    else if (isNotNumber(groupSizeInput)) {
        $('#invalidName').empty();
        $('#invalidEmail').empty();
        $('#invalidPhoneNumber').empty();
        $('#invalidGroupSize').html("invalid group size<br>");
    }
    else {
        console.log('hi')
        socket.emit('registration', {
            name: nameInput,
            emailAddress: emailAddressInput,
            phoneNumber: phoneNumberInput,
            groupSize: groupSizeInput
        });
        $('#invalidName').empty();
        $('#invalidEmail').empty();
        $('#invalidPhoneNumber').empty();
        $('#invalidGroupSize').empty();
        return false; 
    }
    return false;
});