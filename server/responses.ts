import { Authing, Competing } from "./app";
import { CommentAuthorNotMatchError, CommentDoc } from "./concepts/commenting";
import { CompetitionOwnerNotMatchError } from "./concepts/competing";
import { AlreadyFriendsError, FriendNotFoundError, FriendRequestAlreadyExistsError, FriendRequestDoc, FriendRequestNotFoundError } from "./concepts/friending";
import { UserIsAlreadyMemberError, UserIsNotMemberError } from "./concepts/joining";
import { UserAlreadyLinkedError, UserNotLinkedError } from "./concepts/linking";
import { PostAuthorNotMatchError, PostDoc } from "./concepts/posting";
import { DataOwnerNotMatchError } from "./concepts/tracking";
import { Router } from "./framework/router";

/**
 * This class does useful conversions for the frontend.
 * For example, it converts a {@link PostDoc} into a more readable format for the frontend.
 */
export default class Responses {
  /**
   * Convert PostDoc into more readable format for the frontend by converting the author id into a username.
   */
  static async post(post: PostDoc | null) {
    if (!post) {
      return post;
    }
    const author = await Authing.getUserById(post.author);
    return { ...post, author: author.username };
  }

  /**
   * Same as {@link post} but for an array of PostDoc for improved performance.
   */
  static async posts(posts: PostDoc[]) {
    const authors = await Authing.idsToUsernames(posts.map((post) => post.author));
    return posts.map((post, i) => ({ ...post, author: authors[i] }));
  }

  /**
   * Convert FriendRequestDoc into more readable format for the frontend
   * by converting the ids into usernames.
   */
  static async friendRequests(requests: FriendRequestDoc[]) {
    const from = requests.map((request) => request.from);
    const to = requests.map((request) => request.to);
    const usernames = await Authing.idsToUsernames(from.concat(to));
    return requests.map((request, i) => ({ ...request, from: usernames[i], to: usernames[i + requests.length] }));
  }

  /**
   * Convert CommentDoc into more readable format for the frontend
   * by converting the author id into a username.
   */
  static async comment(comment: CommentDoc | null) {
    if (!comment) {
      return comment;
    }
    const author = await Authing.getUserById(comment.author);
    return { ...comment, author: author.username };
  }

  /**
   * Same as {@link comment} but for an array of CommentDoc for improved performance.
   */
  static async comments(comments: CommentDoc[]) {
    const authors = await Authing.idsToUsernames(comments.map((comment) => comment.author));
    return comments.map((comment, i) => ({ ...comment, author: authors[i] }));
  }
}

Router.registerError(PostAuthorNotMatchError, async (e) => {
  const username = (await Authing.getUserById(e.author)).username;
  return e.formatWith(username, e._id);
});

Router.registerError(CommentAuthorNotMatchError, async (e) => {
  const username = (await Authing.getUserById(e.author)).username;
  return e.formatWith(username, e._id);
});

Router.registerError(FriendRequestAlreadyExistsError, async (e) => {
  const [user1, user2] = await Promise.all([Authing.getUserById(e.from), Authing.getUserById(e.to)]);
  return e.formatWith(user1.username, user2.username);
});

Router.registerError(FriendNotFoundError, async (e) => {
  const [user1, user2] = await Promise.all([Authing.getUserById(e.user1), Authing.getUserById(e.user2)]);
  return e.formatWith(user1.username, user2.username);
});

Router.registerError(FriendRequestNotFoundError, async (e) => {
  const [user1, user2] = await Promise.all([Authing.getUserById(e.from), Authing.getUserById(e.to)]);
  return e.formatWith(user1.username, user2.username);
});

Router.registerError(AlreadyFriendsError, async (e) => {
  const [user1, user2] = await Promise.all([Authing.getUserById(e.user1), Authing.getUserById(e.user2)]);
  return e.formatWith(user1.username, user2.username);
});

Router.registerError(UserIsAlreadyMemberError, async (e) => {
  const username = (await Authing.getUserById(e.user)).username;
  const groupName = (await Competing.getCompetitionById(e.group)).name;
  return e.formatWith(username, groupName);
});

Router.registerError(UserIsNotMemberError, async (e) => {
  const username = (await Authing.getUserById(e.user)).username;
  const groupName = (await Competing.getCompetitionById(e.group)).name;
  return e.formatWith(username, groupName);
});

Router.registerError(UserNotLinkedError, async (e) => {
  const username = (await Authing.getUserById(e.user)).username;
  return e.formatWith(username, e.item);
});

Router.registerError(UserAlreadyLinkedError, async (e) => {
  const username = (await Authing.getUserById(e.user)).username;
  return e.formatWith(username, e.item);
});

Router.registerError(DataOwnerNotMatchError, async (e) => {
  const username = (await Authing.getUserById(e.user)).username;
  return e.formatWith(e._id, username);
});

Router.registerError(CompetitionOwnerNotMatchError, async (e) => {
  const username = (await Authing.getUserById(e.user)).username;
  const competitionName = (await Competing.getCompetitionById(e.competition)).name;
  return e.formatWith(competitionName, username);
});
