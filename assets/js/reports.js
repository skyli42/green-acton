// validate email 
// populate tables:
// 1. registration table, entirely from mongo.
// 2. segment summary: 1st row: name email needs (span 2) claimed (span 2) cleaned (span 2), totals (span 2)
//                     2nd row             count distance X 4.
//                      3+      name email form mongo, collect features & count them (and distances, using turf)
// 2nd to last row - no name
// last row totals
// Once we collect data, fill div with table data & push into csv, and reveal button to download as csv

function isValidEmail(emailAddress) {
    var regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return regEx.test(emailAddress);
}


$('#reportLogin').submit(function(event) {
    event.preventDefault()
    var emailAddress = $('#emailAddressInput #icon_prefix').val();
    if (isValidEmail(emailAddress)) {
        socket.emit('reportSignin', emailAddress);
    } else {
        Materialize.toast("Invalid email address", 4000)
    }
})

socket.on("reportSigninReturn", function(details) {
   if (details.valid == true)
   {
       $('#reportShow').removeClass('hide')
       $('#reportLogin').addClass('hide')
       
       table = document.getElementById("tableBody");
       
       Totals = [0,0,0];
       
       details.users.forEach(function(user) {
           rowCount = table.rows.length;
           row = table.insertRow(rowCount);  
           row.insertCell(0).innerHTML= user.name;
           row.insertCell(1).innerHTML= user.address;
           row.insertCell(2).innerHTML= user.emailAdd;
           row.insertCell(3).innerHTML= user.phone;
           row.insertCell(4).innerHTML= user.groupSize;
           if (details.segmentSummary[user.emailAdd])
            {
                row.insertCell(5).innerHTML= details.segmentSummary[user.emailAdd][0];
                row.insertCell(6).innerHTML= details.segmentSummary[user.emailAdd][1];
                row.insertCell(7).innerHTML= details.segmentSummary[user.emailAdd][2];
                Totals[0] = Totals[0] + details.segmentSummary[user.emailAdd][0];
                Totals[1] = Totals[1] + details.segmentSummary[user.emailAdd][1];
                Totals[2] = Totals[2] + details.segmentSummary[user.emailAdd][2];
            }
       }); 
       
       rowCount = table.rows.length;
       row = table.insertRow(rowCount);  
       row.insertCell(0).innerHTML= "Totals"
       row.insertCell(1).innerHTML= "&nbsp;";
       row.insertCell(2).innerHTML= "&nbsp;"
       row.insertCell(3).innerHTML= "&nbsp;"
       row.insertCell(4).innerHTML= "&nbsp;"
       
       row.insertCell(5).innerHTML= Totals[0];
       row.insertCell(6).innerHTML= Totals[1];
       row.insertCell(7).innerHTML= Totals[2];
       
   } else {
       Materialize.toast("Invalid email address for Reports", 4000)
   }
})