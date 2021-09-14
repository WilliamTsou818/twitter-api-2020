const adminService = require('../services/adminService')
const userService = require('../services/userService')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const adminController = {
  getUsers: async (req, res) => {
    const users = await adminService.getUsers()

    // Check whether users exists
    if (!users) {
      return res
        .status(401)
        .json({ status: 'error', message: 'No users found' })
    }

    return res.status(200).json(users)
  },

  getTweets: async (req, res) => {
    const tweets = await adminService.getTweets()

    // Check whether tweets exists
    if (!tweets.length) {
      return res
        .status(401)
        .json({ status: 'error', message: 'No tweets found' })
    }

    return res.status(200).json(tweets)
  },

  deleteTweet: async (req, res) => {
    const data = await adminService.deleteTweet(req.params.id)

    // Check data status
    if (data['status'] === 'error') {
      return res.status(401).json(data)
    }

    return res.status(200).json(data)
  },

  SignIn: async (req, res) => {
    const { account, password } = req.body
    // Check required data
    if (!account || !password) {
      return res.status(400).json({
        status: 'error',
        message: "Required fields didn't exist"
      })
    }

    // Check whether the user exists by email
    const admin = await userService.signIn(account, 'admin')

    if (!admin) {
      return res
        .status(401)
        .json({ status: 'error', message: 'No such admin found' })
    }
    // Check if the user password is correct
    if (!bcrypt.compareSync(password, user.password)) {
      return res
        .status(400)
        .json({ status: 'error', message: 'Incorrect password' })
    }
    // sign user token
    const payload = { id: user.id }
    const token = jwt.sign(payload, process.env.JWT_SECRET)

    return res.status(200).json({
      status: 'success',
      message: 'Success to login',
      token: token,
      user: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    })
  }
}

module.exports = adminController
