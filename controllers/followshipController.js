const followshipService = require('../services/followshipService')

const followshipController = {
  addFollowing: async (req, res, next) => {
    try {
      const data = await followshipService.addFollowing(req, res)
      return res.status(200).json(data)
    } catch (error) {
      next(error)
    }
  },
  deleteFollowing: async (req, res, next) => {
    try {
      const data = await followshipService.deleteFollowing(req, res)
      return res.status(200).json(data)
    } catch (error) {
      next(error)
    }
  }
}

module.exports = followshipController
