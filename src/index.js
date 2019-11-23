const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const Filter = require('bad-words');//Bed word finder
const { generateMessage, generateLocationMessage } = require('./utils/messages'); // Function create a object with text and time
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users');//get users function

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))


io.on('connection', (socket) => {
  console.log('New web-socket connection');
  

  //Add new user to the chat room
  socket.on('join', (options, callback) => {//option its username, room
    const { error, user } = addUser({ id: socket.id, ...options })
    
    if(error) {
      return callback(error)
    }

    socket.join(user.room)
    
    //Welcome message for new user in a room
    socket.emit('message', generateMessage('Admin','Welcome'));
    socket.broadcast.to(user.room).emit('message', generateMessage('Admin' ,`${user.username} has joined!`));//Showing new user
    
    io.to(user.room).emit('roomData', {
      room: user.room,
      users: getUsersInRoom(user.room)
    })

    callback()

  })
  
  //Send message from user
  socket.on('clientMessage', (message, callback) => {
    const user = getUser(socket.id);
    const filter = new Filter();

    if(filter.isProfane(message)) {
      return callback('Profanity is not allowed!')
    }
    
    io.to(user.room).emit('message', generateMessage(user.username ,message));
    callback();
  })

  //Send user location in chat
  socket.on('sendLocation', (coords, callback) => {
    const user = getUser(socket.id);
    if(!coords) {
      return callback('Cant send the location')
    }

    io.to(user.room).emit('locationMessage', generateLocationMessage(user.username ,coords));
    callback();
  })

  //Show message when user disconnect
  socket.on('disconnect', () => {
    const user = removeUser(socket.id)

    if(user) {
      io.to(user.room).emit('message', generateMessage(`${user.username} has left!`));
      io.to(user.room).emit('roomData', {
        room: user.room,
        users: getUsersInRoom(user.room)
      })
    }
  })
})

//Server start
server.listen(port ,() => {
  console.log(`Server is up on port ${port}`);
}) 