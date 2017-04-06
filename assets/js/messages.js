(function(exports){

  exports.myMessages = {
  NEW_EMAIL: 1,
  REG_OK: 2,
  REG_ALREADY: 3,
  properties: {
    1: {msg_string: 'Email address isn\'t registered. Please register your email.'},
    2: {msg_string: 'Registered!'},
    3: {msg_string: 'Email is already registered'}
  }
};
}(typeof exports === 'undefined' ? this.messages = {} : exports));
