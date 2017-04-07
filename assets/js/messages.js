(function(exports){

  exports.myMessages = {
  NEW_EMAIL: 1,
  REG_OK: 2,
  REG_ALREADY: 3,
  SUBMIT_OK: 4,
  properties: {
    1: {msg_string: 'Email address isn\'t registered. Please register your email.'},
    2: {msg_string: 'Registered!'},
    3: {msg_string: 'Email is already registered'},
    4: {msg_string: "Thanks for updating these streets!"}
  }
};
}(typeof exports === 'undefined' ? this.messages = {} : exports));
