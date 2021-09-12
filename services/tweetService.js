const { Tweet, Reply, Like, User, Sequelize } = require('../models')

const tweetService = {
  getTweets: async (id) => {
    return await Tweet.findAll({
      raw: true,
      nest: true,
      include: [
        { model: Like, attributes: [] },
        { model: Reply, attributes: [] },
        { model: User, attributes: ['id', 'name', 'account', 'avatar'] }
      ],
      attributes: [
        ['id', 'TweetId'],
        [
          Sequelize.literal(
            `exists(select 1 from Likes where UserId = ${id} and TweetId = Tweet.id)`
          ),
          'isLike'
        ],
        [
          Sequelize.literal(
            '(SELECT COUNT(*) FROM Likes WHERE Likes.TweetId = Tweet.id)'
          ),
          'likesCount'
        ],
        [
          Sequelize.literal(
            '(SELECT COUNT(*) FROM Replies WHERE Replies.TweetId = Tweet.id)'
          ),
          'repliesCount'
        ],
        'description',
        'createdAt',
        'updatedAt'
      ],
      group: ['TweetId'],
      order: [['createdAt', 'DESC']]
    })
  },
  getTweet: async (id, tweetId) => {
    return await Tweet.findByPk(tweetId, {
      include: [
        { model: Like, attributes: [] },
        {
          model: Reply,
          attributes: ['id', 'comment', 'createdAt'],
          include: {
            model: User,
            attributes: ['id', 'name', 'avatar', 'account']
          }
        },
        { model: User, attributes: ['id', 'name', 'account', 'avatar'] }
      ],
      attributes: [
        'id',
        [
          Sequelize.literal(
            `exists(select 1 from Likes where UserId = ${id} and TweetId = Tweet.id)`
          ),
          'isLike'
        ],
        [
          Sequelize.literal(
            '(SELECT COUNT(*) FROM Likes WHERE Likes.TweetId = Tweet.id)'
          ),
          'likesCount'
        ],
        [
          Sequelize.literal(
            '(SELECT COUNT(*) FROM Replies WHERE Replies.TweetId = Tweet.id)'
          ),
          'repliesCount'
        ],
        'description',
        'createdAt',
        'updatedAt'
      ],
      group: 'Replies.id'
    })
  },
  postTweet: async (UserId, description) => {
    await Tweet.create({
      UserId,
      description
    })
    return { status: 'success', message: 'A tweet has created' }
  },
  postLikeTweet: async (UserId, TweetId) => {
    await Like.create({ UserId, TweetId })
    return { status: 'success', message: 'A like has created' }
  },
  postUnlikeTweet: async (UserId, TweetId) => {
    await Like.destroy({ where: { UserId, TweetId } })
    return { status: 'success', message: 'A like has deleted' }
  }
}

module.exports = tweetService
