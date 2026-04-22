const { sequelize } = require('../config/mysql');

const Role = require('./Role');
const User = require('./User');
const Team = require('./Team');
const TeamMember = require('./TeamMember');
const TopicStatus = require('./TopicStatus');
const Topic = require('./Topic');
const TopicReview = require('./TopicReview');
const Technology = require('./Technology');
const TopicTechnology = require('./TopicTechnology');
const Milestone = require('./Milestone');
const Submission = require('./Submission');
const SubmissionVersion = require('./SubmissionVersion');
const Feedback = require('./Feedback');
const AiSummary = require('./AiSummary');
const Notification = require('./Notification');
const Conversation = require('./Conversation');
const ConversationMember = require('./ConversationMember');
const Message = require('./Message');
const SystemLog = require('./SystemLog');
const RiskLevel = require('./RiskLevel');
const RiskFlag = require('./RiskFlag');

// Associations
Role.hasMany(User, { foreignKey: 'role_id' });
User.belongsTo(Role, { foreignKey: 'role_id', as: 'Role' });

Team.hasMany(TeamMember, { foreignKey: 'team_id' });
User.hasOne(TeamMember, { foreignKey: 'user_id' });
TeamMember.belongsTo(Team, { foreignKey: 'team_id' });
TeamMember.belongsTo(User, { foreignKey: 'user_id' });

TopicStatus.hasMany(TopicReview, { foreignKey: 'status_id' });
Topic.hasMany(TopicReview, { foreignKey: 'topic_id' });
TopicReview.belongsTo(Topic, { foreignKey: 'topic_id' });
TopicReview.belongsTo(User, { foreignKey: 'supervisor_id' });
TopicReview.belongsTo(TopicStatus, { foreignKey: 'status_id' });

Topic.belongsTo(Team, { foreignKey: 'team_id' });
Team.hasOne(Topic, { foreignKey: 'team_id' });

Technology.belongsToMany(Topic, { through: TopicTechnology, foreignKey: 'tech_id', otherKey: 'topic_id' });
Topic.belongsToMany(Technology, { through: TopicTechnology, foreignKey: 'topic_id', otherKey: 'tech_id' });

Milestone.hasMany(Submission, { foreignKey: 'milestone_id' });
Team.hasMany(Submission, { foreignKey: 'team_id' });
Submission.belongsTo(Team, { foreignKey: 'team_id' });
Submission.belongsTo(Milestone, { foreignKey: 'milestone_id' });

Submission.hasMany(SubmissionVersion, { foreignKey: 'submission_id' });
SubmissionVersion.belongsTo(Submission, { foreignKey: 'submission_id' });

SubmissionVersion.hasMany(Feedback, { foreignKey: 'submission_version_id' });
Feedback.belongsTo(SubmissionVersion, { foreignKey: 'submission_version_id' });
Feedback.belongsTo(User, { foreignKey: 'supervisor_id' });

User.hasMany(Notification, { foreignKey: 'user_id' });
Notification.belongsTo(User, { foreignKey: 'user_id' });

Conversation.belongsToMany(User, { through: ConversationMember, foreignKey: 'conversation_id', otherKey: 'user_id' });
User.belongsToMany(Conversation, { through: ConversationMember, foreignKey: 'user_id', otherKey: 'conversation_id' });
Conversation.hasMany(Message, { foreignKey: 'conversation_id' });
Message.belongsTo(Conversation, { foreignKey: 'conversation_id' });
Message.belongsTo(User, { foreignKey: 'sender_id' });

User.hasMany(SystemLog, { foreignKey: 'user_id' });
SystemLog.belongsTo(User, { foreignKey: 'user_id' });

Team.hasMany(RiskFlag, { foreignKey: 'team_id' });
RiskLevel.hasMany(RiskFlag, { foreignKey: 'risk_level_id' });
RiskFlag.belongsTo(Team, { foreignKey: 'team_id' });
RiskFlag.belongsTo(RiskLevel, { foreignKey: 'risk_level_id' });

module.exports = {
  sequelize,
  Role,
  User,
  Team,
  TeamMember,
  TopicStatus,
  Topic,
  TopicReview,
  Technology,
  TopicTechnology,
  Milestone,
  Submission,
  SubmissionVersion,
  Feedback,
  AiSummary,
  Notification,
  Conversation,
  ConversationMember,
  Message,
  SystemLog,
  RiskLevel,
  RiskFlag,
};