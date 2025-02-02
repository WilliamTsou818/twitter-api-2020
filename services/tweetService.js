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
            `EXISTS(SELECT 1 FROM Likes WHERE UserId = ${id} AND TweetId = Tweet.id)`
          ),
          'isLike'
        ],
        [
          Sequelize.literal(
            '(SELECT COUNT(*) FROM Likes WHERE Likes.TweetId = Tweet.id)'
          ),
          'LikesCount'
        ],
        [
          Sequelize.literal(
            '(SELECT COUNT(*) FROM Replies WHERE Replies.TweetId = Tweet.id)'
          ),
          'RepliesCount'
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
            `EXISTS(SELECT 1 FROM Likes WHERE UserId = ${id} AND TweetId = Tweet.id)`
          ),
          'isLike'
        ],
        [
          Sequelize.literal(
            '(SELECT COUNT(*) FROM Likes WHERE Likes.TweetId = Tweet.id)'
          ),
          'LikesCount'
        ],
        [
          Sequelize.literal(
            '(SELECT COUNT(*) FROM Replies WHERE Replies.TweetId = Tweet.id)'
          ),
          'RepliesCount'
        ],
        'description',
        'createdAt',
        'updatedAt'
      ],
      group: 'Replies.id',
      order: [['Replies', 'createdAt', 'DESC']]
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
    return { status: 'success', message: 'Liked successfully' }
  },
  postUnlikeTweet: async (UserId, TweetId) => {
    await Like.destroy({ where: { UserId, TweetId } })
    return { status: 'success', message: 'Unliked successfully' }
  },

  getTweetAllReplies: async (TweetId) => {
    return await Tweet.findByPk(TweetId, {
      attributes: [],
      include: [
        {
          model: Reply,
          attributes: ['id', 'comment', 'createdAt'],
          include: [
            {
              model: User,
              nest: true,
              attributes: ['id', 'name', 'account', 'avatar']
            }
          ]
        }
      ],
      order: [['Replies', 'createdAt', 'DESC']]
    })
  },
  postReply: async (UserId, TweetId, comment) => {
    await Reply.create({ UserId, TweetId, comment })
    return { status: 'success', message: 'A reply has successfully left' }
  }
}

module.exports = tweetService
