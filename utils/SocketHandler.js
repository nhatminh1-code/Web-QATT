let { Server } = require('socket.io')
let userSchema = require('../schemas/users');
let jwt = require('jsonwebtoken')

module.exports = {
    SocketServer: function (server) {
        let user1;
        let io = new Server(server)
        io.on('connection', async (socket) => {
            let token = socket.handshake.auth.token;
            let result = jwt.verify(token, 'secret')
            if (result.exp * 1000 > Date.now()) {
                let user = await userSchema.findById(
                    result.id
                )
                user1 = user._id;
                socket.emit('welcome', user.username)
            }
            socket.on('user', data => {
                socket.join(data);
                socket.join(user1);
            })
            socket.on('newMessage', data => {
                console.log(data);
                io.to(data.from).emit('newMessage');
                io.to(data.to).emit('newMessage');
            })

        });
    }
}