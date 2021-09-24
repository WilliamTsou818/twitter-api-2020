const messageService = require('../../services/messageService')
module.exports = (io, socket, publicUsers) => {
  const { name, id } = socket.user
  socket.on('joinPublicRoom', async () => {
    try {
      // Check if user is already in public room
      const isUserExists = publicUsers
        .map((user) => user.id)
        .includes(socket.user.id)

      // If user is already exists, joining room without announce
      if (isUserExists) {
        return socket.join('public')
      }

      // If user is not exists, pushing to public user list
      isUserExists ? false : publicUsers.push(socket.user)
      console.log(publicUsers)

      // Join public room
      socket.join('public')
      console.log(socket.rooms)

      // Send announce to other public room users
      socket.to('public').emit('announce', {
        publicUsers,
        message: `${name} joined`
      })

      // Send welcome message to current user
      socket.emit('announce', {
        publicUsers,
        message: `Welcome, ${name}!`
      })
    } catch (error) {
      return socket.emit('error', {
        status: error.name,
        message: error.message
      })
    }
  })

  socket.on('publicMessage', async (msg) => {
    try {
      // Add public room id = 5
      msg.RoomId = 5
      console.log(msg)

      // Save message to database
      const message = await messageService.postMessage(msg).toJSON()
      
      // Handle response data
      const data = {
        userId: socket.user.id,
        content: msg.content,
        avatar: socket.user.avatar,
        createdAt: message.createdAt
      }
      return io.in('public').emit('publicMessage', data)
    } catch (error) {
      return socket.emit('error', {
        status: error.name,
        message: error.message
      })
    }
  })

  socket.on('leavePublicRoom', async () => {
    try {
      // Check if the same user has multiple client connection
      const sameUserCount = await io.sockets.adapter.rooms.get(
        `user-${socket.user.id}`
      )

      if (sameUserCount.size > 1) {
        return socket.leave('public')
      }

      // Remove current user from public user list
      publicUsers.splice(publicUsers.indexOf(socket.user), 1)

      // Leave public room
      socket.leave('public')
      console.log(socket.rooms)

      // Send announce only if the public room still have remained users
      if (publicUsers.length) {
        return socket.to('public').emit('announce', {
          publicUsers,
          message: `${name} leaved`
        })
      }
    } catch (error) {
      return socket.emit('error', {
        status: error.name,
        message: error.message
      })
    }
  })
}
