const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const userService = require('../services/userService')
const helpers = require('../_helpers')
const { joiMessageHandler, userInfoSchema } = require('../utils/validator')
const booleanTranslation = require('../utils/booleanTranslation')
const imgur = require('imgur')
const IMGUR_CLIENT_ID = process.env.IMGUR_CLIENT_ID
const ApiError = require('../utils/customError')

const userController = {
  signIn: async (req, res, next) => {
    try {
      const { email, password } = req.body

      // Check request body data format with Joi schema
      const { error } = userInfoSchema.validate(req.body, { abortEarly: false })

      if (error) {
        throw new ApiError(
          'UserSingInFormatError',
          400,
          joiMessageHandler(error.details)
        )
      }

      // Check whether the user exists by email
      const user = await userService.signIn(email)

      if (!user) {
        throw new ApiError('UserSingInError', 401, 'No such user found')
      }

      // Check user role by baseUrl
      if (!req.baseUrl.split('/')[2].includes(user.role)) {
        throw new ApiError('UserSingInRoleError', 403, 'Permission denied')
      }

      // Check whether the user password is correct
      if (!bcrypt.compareSync(password, user.password)) {
        throw new ApiError('UserSingInPasswordError', 400, 'Incorrect password')
      }
      // sign user token
      const payload = { id: user.id }
      const token = jwt.sign(payload, process.env.JWT_SECRET)

      return res.status(200).json({
        status: 'success',
        message: 'Success to login',
        token: token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      })
    } catch (error) {
      next(error)
    }
  },

  getCurrentUser: async (req, res, next) => {
    try {
      const currentUser = await userService.getCurrentUser(
        helpers.getUser(req).id
      )

      // Check whether the current user exists by user id
      if (!currentUser) {
        throw new ApiError('GetCurrentUserError', 401, 'No such user found')
      }

      return res.status(200).json(currentUser)
    } catch (error) {
      next(error)
    }
  },

  postUser: async (req, res, next) => {
    try {
      // Check the user registration format
      const { error } = userInfoSchema.validate(req.body, {
        abortEarly: false
      })

      if (error) {
        throw new ApiError(
          'UserSingnUpError',
          400,
          joiMessageHandler(error.details)
        )
      }

      // Call userService to create account
      const data = await userService.postUser(req.body)

      // Delete password attributes in response data
      delete data.dataValues.password

      const responseData = {
        status: 'success',
        message: 'Registration success',
        user: data.dataValues
      }
      return res.status(200).json(responseData)
    } catch (error) {
      return next(error)
    }
  },

  getUser: async (req, res, next) => {
    try {
      const [targetUserId, currentUserId] = [
        req.params.id,
        helpers.getUser(req).id
      ]

      let user = await userService.getUser(targetUserId, currentUserId)

      // Check whether the user exists
      if (!user) {
        throw new ApiError('GetUserError', 401, 'No such user found')
      }

      // translate to boolean in isFollowed attribute
      user.dataValues.isFollowed = booleanTranslation(
        user.dataValues.isFollowed
      )

      return res.status(200).json(user)
    } catch (error) {
      next(error)
    }
  },

  getUserTweets: async (req, res, next) => {
    try {
      const [targetUserId, currentUserId] = [
        req.params.id,
        helpers.getUser(req).id
      ]

      let tweets = await userService.getUserTweets(targetUserId, currentUserId)

      // translate to boolean in isFollowed attribute
      if (tweets.length) {
        tweets.forEach((tweet) => {
          tweet.dataValues.isLike = booleanTranslation(tweet.dataValues.isLike)
        })
      }

      return res.status(200).json(tweets)
    } catch (error) {
      next(error)
    }
  },

  getUserRepliedTweets: async (req, res, next) => {
    try {
      const tweets = await userService.getUserRepliedTweets(req.params.id)

      return res.status(200).json(tweets)
    } catch (error) {
      next(error)
    }
  },

  getUserLikedTweets: async (req, res, next) => {
    try {
      const [targetUserId, currentUserId] = [
        req.params.id,
        helpers.getUser(req).id
      ]

      let tweets = await userService.getUserLikedTweets(
        targetUserId,
        currentUserId
      )

      // translate to boolean in isFollowed attribute
      if (tweets.length) {
        tweets.forEach((tweet) => {
          tweet.isLike = booleanTranslation(tweet.isLike)
        })
      }

      return res.status(200).json(tweets)
    } catch (error) {
      next(error)
    }
  },

  getUserFollowings: async (req, res, next) => {
    try {
      const [targetUserId, currentUserId] = [
        req.params.id,
        helpers.getUser(req).id
      ]

      let users = await userService.getUserFollowings(
        targetUserId,
        currentUserId
      )

      // translate to boolean in isFollowed attribute
      if (users.length) {
        users.forEach((user) => {
          user.isFollowed = booleanTranslation(user.isFollowed)
        })
      }

      return res.status(200).json(users)
    } catch (error) {
      next(error)
    }
  },

  getUserFollowers: async (req, res, next) => {
    try {
      const [targetUserId, currentUserId] = [
        req.params.id,
        helpers.getUser(req).id
      ]

      let users = await userService.getUserFollowers(
        targetUserId,
        currentUserId
      )

      // translate to boolean in isFollowed attribute
      if (users.length) {
        users.forEach((user) => {
          user.isFollowed = booleanTranslation(user.isFollowed)
        })
      }

      return res.status(200).json(users)
    } catch (error) {
      next(error)
    }
  },

  putUser: async (req, res, next) => {
    try {
      // Check if the user is current user
      if (helpers.getUser(req).id !== Number(req.params.id)) {
        throw new ApiError(
          'PutUserPermissionError',
          403,
          "Should not edit the other user's profile"
        )
      }

      // Check request body data format with Joi schema
      const { error } = userInfoSchema.validate(req.body, { abortEarly: false })

      if (error) {
        throw new ApiError(
          'PutUserFormatError',
          400,
          joiMessageHandler(error.details)
        )
      }

      // handle image upload
      const { files } = req

      if (files) {
        try {
          imgur.setClientId(IMGUR_CLIENT_ID)
          if (files.avatar) {
            const avatarData = await imgur.uploadFile(files.avatar[0].path)
            req.body.avatar = avatarData.link
          }
          if (files.cover) {
            const coverData = await imgur.uploadFile(files.cover[0].path)
            req.body.cover = coverData.link
          }
        } catch (error) {
          next(new ApiError('UploadImageError', 400, 'Upload image failed'))
        }
      }

      // Update user data
      const user = await userService.putUser(req.params.id, req.body)

      // delete password attributes
      if (user.dataValues.password) {
        delete user.dataValues.password
      }

      const responseData = {
        status: 'success',
        message: 'Account info has updated',
        user: user.dataValues
      }

      return res.status(200).json(responseData)
    } catch (error) {
      next(error)
    }
  },

  getTopUsers: async (req, res, next) => {
    try {
      const users = await userService.getTopUsers(helpers.getUser(req).id)

      // Check whether the users exist
      if (!users.length) {
        throw new ApiError('GetTopUsersError', 401, 'No users found')
      }

      // translate to boolean in isFollowed attribute
      users.forEach((user) => {
        user.dataValues.isFollowed = booleanTranslation(
          user.dataValues.isFollowed
        )
      })

      return res.status(200).json(users)
    } catch (error) {
      next(error)
    }
  }
}

module.exports = userController
