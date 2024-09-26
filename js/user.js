class User {
    constructor(id, username, password) {
      this.id = id;
      this.username = username;
      this.password = password;
    }
  
    passwordValid(password) {
      return this.password == password;
    }
  }