(function(exports){
  exports.myMessages = {
  NEW_EMAIL: 1,
  REG_OK: 2,
  REG_ALREADY: 3,
  SUBMIT_OK: 4,
  ALREADY_CLAIMED: 5,
  properties: {
    1: {msg_string: 'Account is not registered'},
    2: {msg_string: 'Registered!'},
    3: {msg_string: 'Email is already registered'},
    4: {msg_string: "Thanks for updating these streets!"},
    5: {msg_string: "Sorry, you have selected segments that are already claimed."}
  }
};
}(typeof exports === 'undefined' ? this.messages = {} : exports));
