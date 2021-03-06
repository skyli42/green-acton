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

function localMessageHandler(msg) {
    switch (msg) {
        case messages.myMessages.REG_OK:
            $('#errMessages').html('Registered OK. Update the map now with <a href="/map">this link</a>.');
            break;
    }
}

$('#registration').on("submit", function(event) {
    var nameInput = $('#nameInput #icon_prefix').val();
    var emailAddressInput = $('#emailAddressInput #icon_prefix').val();
    var phoneNumberInput = $('#phoneNumberInput #icon_prefix').val();
    var groupSizeInput = $('#groupSizeInput #icon_prefix').val();
    var addressInput = $('#streetAddressInput #icon_prefix').val();
    console.log(addressInput)
    if (nameInput == '') {
        $("#errMessages").html("Please enter your name");
        Materialize.toast("Please enter your name<br>", 4000)
        $("#nameInput #icon_prefix").select();
        event.preventDefault();
    } else if (!isValidEmailAddress(emailAddressInput)) {
        $('#errMessages').html("Invalid email address<br>");
        Materialize.toast("invalid email address<br>", 4000)
        $("#emailAddressInput #icon_prefix").select();
        event.preventDefault();
    } else if (!phoneNumberInput == "" && !isValidPhoneNumber(phoneNumberInput)) {
        $('#errMessages').html("Invalid phone number<br>");
        Materialize.toast("Invalid phone number<br>", 4000)
        $("#phoneNumberInput #icon_prefix").select();
        event.preventDefault();

    } else if (!groupSizeInput == "" && isNotNumber(groupSizeInput)) {
        $('#errMessages').html("Invalid group size<br>");
        Materialize.toast("Invalid group size<br>", 4000)
        $("#groupSizeInput #icon_prefix").select();
        event.preventDefault();
    } else {
        $("#errMessages").empty();
        var send = {
            name: nameInput,
            emailAddress: emailAddressInput,
            address: addressInput,
            phoneNumber: phoneNumberInput,
            groupSize: groupSizeInput
        };
        
        socket.emit('registration', send);
        return false;
    }
});