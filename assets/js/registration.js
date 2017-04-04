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
$('#registration').on("submit", function(event) {
    var nameInput = $('#nameInput #icon_prefix').val();
    var emailAddressInput = $('#emailAddressInput #icon_prefix').val();
    var phoneNumberInput = $('#phoneNumberInput #icon_prefix').val();
    var groupSizeInput = $('#groupSizeInput #icon_prefix').val();
    var addressInput = $('#streetAddressInput #icon_prefix').val();
    if (nameInput == '') {
        $('#invalidEmail').empty();
        $('#invalidPhoneNumber').empty();
        $('#invalidGroupSize').empty();
        $('#invalidName').html("please enter your name<br>");
        event.preventDefault();

    } else if (addressInput = "") {
        event.preventDefault();
    } else if (!isValidEmailAddress(emailAddressInput)) {
        $('#invalidName').empty();
        $('#invalidPhoneNumber').empty();
        $('#invalidGroupSize').empty();
        $('#invalidEmailAddress').html("invalid email address<br>");
        event.preventDefault();
    } else if (!phoneNumberInput == "" && !isValidPhoneNumber(phoneNumberInput)) {
        $('#invalidName').empty();
        $('#invalidEmail').empty();
        $('#invalidGroupSize').empty();
        $('#invalidPhoneNumber').html("invalid phone number<br>");
        event.preventDefault();

    } else if (!groupSizeInput == "" &&isNotNumber(groupSizeInput)) {
        $('#invalidName').empty();
        $('#invalidEmail').empty();
        $('#invalidPhoneNumber').empty();
        $('#invalidGroupSize').html("invalid group size<br>");
        event.preventDefault();
    } else {
        socket.emit('registration', {
            name: nameInput,
            emailAddress: emailAddressInput,
            address: addressInput,
            phoneNumber: phoneNumberInput,
            groupSize: groupSizeInput
        });
        $('#invalidName').empty();
        $('#invalidEmail').empty();
        $('#invalidPhoneNumber').empty();
        $('#invalidGroupSize').empty();
    }
});