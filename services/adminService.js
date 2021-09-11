const { User, Tweet, Like, Reply, sequelize } = require('../models');
const Sequelize = require('sequelize');

const adminService = {
  getUsers: async () => {
    return await User.findAll({
      raw: true,
      where: { role: 'user' },
      include: [
        {
          model: User,
          as: 'Followings',
          attributes: [],
          through: { attributes: [] }
        },
        {
          model: User,
          as: 'Followers',
          attributes: [],
          through: { attributes: [] }
        },
        { model: Like, attributes: [] },
        { model: Tweet, attributes: [] }
      ],
      group: ['user.id'],
      order: [
        [Sequelize.literal('tweetsCount'), 'DESC'],
        ['createdAt', 'DESC']
      ],
      attributes: [
        'id',
        'name',
        [Sequelize.fn('concat', '@', Sequelize.col('User.account')), 'account'],
        'avatar',
        'cover',
        [
          Sequelize.literal(
            '(SELECT COUNT(*) FROM Tweets WHERE Tweets.userId = User.id)'
          ),
          'tweetsCount'
        ],
        [
          Sequelize.literal(
            '(SELECT COUNT(*) FROM Likes WHERE Likes.userId = User.id)'
          ),
          'likesCount'
        ],
        [
          Sequelize.literal(
            '(SELECT COUNT(*) FROM Followships WHERE Followships.followingId = User.id)'
          ),
          'followersCount'
        ],
        [
          Sequelize.literal(
            '(SELECT COUNT(*) FROM Followships WHERE Followships.followerId = User.id)'
          ),
          'followingsCount'
        ]
      ]
    });
  }
};

module.exports = adminService;
