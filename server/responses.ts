import { Authing, Competing, Tracking } from "./app";
import { CommentAuthorNotMatchError, CommentDoc } from "./concepts/commenting";
import { CompetitionDoc, CompetitionOwnerNotMatchError } from "./concepts/competing";
import { AlreadyFriendsError, FriendNotFoundError, FriendRequestAlreadyExistsError, FriendRequestDoc, FriendRequestNotFoundError } from "./concepts/friending";
import { MembershipDoc, UserIsAlreadyMemberError, UserIsNotMemberError } from "./concepts/joining";
import { LinkAlreadyExists, LinkDoc, UserDoesNotOwnLinkError } from "./concepts/linking";
import { PostAuthorNotMatchError, PostDoc } from "./concepts/posting";
import { DataDoc, DataOwnerNotMatchError } from "./concepts/tracking";
import { Router } from "./framework/router";

/**
 * This class does useful conversions for the frontend.
 * For example, it converts a {@link PostDoc} into a more readable format for the frontend.
 */
export default class Responses {
  /**
   * Convert PostDoc into more readable format for the frontend by converting the author id into a username.
   */
  static async post(post: PostDoc) {
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
  static async comment(comment: CommentDoc) {
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

  /**
   * Convert LinkDoc into more readable format for the frontend
   * by converting the ids into usernames.
   */
  static async link(link: LinkDoc) {
    const user = await Authing.getUserById(link.user);
    return { ...link, user: user.username };
  }

  /**
   * Same as {@link link} but for an array of LinkDoc for improved performance.
   */
  static async links(links: LinkDoc[]) {
    const users = await Authing.idsToUsernames(links.map((link) => link.user));
    return links.map((link, i) => ({ ...link, user: users[i] }));
  }

  /**
   * Convert DataDoc into more readable format for the frontend
   * by converting the owner id into a username.
   */
  static async d(d: DataDoc) {
    const user = await Authing.getUserById(d.user);
    return { ...d, user: user.username };
  }

  /**
   * Same as {@link d} but for an array of DataDoc for improved performance.
   */
  static async data(data: DataDoc[]) {
    const user = await Authing.idsToUsernames(data.map((d) => d.user));
    return data.map((d, i) => ({ ...d, user: user[i] }));
  }

  /**
   * Convert CompetitionDoc into more readable format for the frontend
   * by converting the owner id into a username and each data id into a
   * formatted DataDoc.
   */
  static async competition(competition: CompetitionDoc) {
    const owner = await Authing.getUserById(competition.owner);
    const dataDocs = await Tracking.getByIds(competition.data);
    const dataDocsFormatted = await this.data(dataDocs);
    return { ...competition, owner: owner.username, data: dataDocsFormatted };
  }

  /**
   * Same as {@link competition} but for an array of CompetitionDoc
   * for improved performance.
   */
  static async competitions(competitions: CompetitionDoc[]) {
    const owner = await Authing.idsToUsernames(competitions.map((c) => c.owner));
    const dataDocs = await Promise.all(competitions.map((c) => Tracking.getByIds(c.data)));
    const dataDocsFormatted = await Promise.all(dataDocs.map((d) => this.data(d)));
    return competitions.map((c, i) => ({ ...c, owner: owner[i], data: dataDocsFormatted[i] }));
  }

  /**
   * Convert member into more readable format for the frontend
   * by converting the user id into a username.
   */
  static async membership(membership: MembershipDoc) {
    const user = await Authing.getUserById(membership.user);
    return { ...membership, user: user.username };
  }

  /**
   * Same as {@link membership} but for an array of MembershipDoc
   * for improved performance.
   */
  static async memberships(memberships: MembershipDoc[]) {
    const user = await Authing.idsToUsernames(memberships.map((m) => m.user));
    return memberships.map((m, i) => ({ ...m, user: user[i] }));
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

Router.registerError(LinkAlreadyExists, async (e) => {
  const username = (await Authing.getUserById(e.user)).username;
  return e.formatWith(username, e.item);
});

Router.registerError(UserDoesNotOwnLinkError, async (e) => {
  const username = (await Authing.getUserById(e.user)).username;
  return e.formatWith(username, e._id);
});

Router.registerError(UserIsAlreadyMemberError, async (e) => {
  const username = (await Authing.getUserById(e.user)).username;
  const groupName = (await Competing.getById(e.group)).name;
  return e.formatWith(username, groupName);
});

Router.registerError(UserIsNotMemberError, async (e) => {
  const username = (await Authing.getUserById(e.user)).username;
  const groupName = (await Competing.getById(e.group)).name;
  return e.formatWith(username, groupName);
});

Router.registerError(DataOwnerNotMatchError, async (e) => {
  const username = (await Authing.getUserById(e.user)).username;
  return e.formatWith(e._id, username);
});

Router.registerError(CompetitionOwnerNotMatchError, async (e) => {
  const username = (await Authing.getUserById(e.user)).username;
  const competitionName = (await Competing.getById(e.competition)).name;
  return e.formatWith(username, competitionName);
});
