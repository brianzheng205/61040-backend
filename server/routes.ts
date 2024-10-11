import { ObjectId } from "mongodb";

import { Router, getExpressRouter } from "./framework/router";

import { Authing, Commenting, Competing, Friending, Joining, Linking, Posting, Sessioning, Tracking } from "./app";
import { LinkDoc } from "./concepts/linking";
import { PostOptions } from "./concepts/posting";
import { SessionDoc } from "./concepts/sessioning";
import { SortOptions } from "./concepts/tracking";
import Responses from "./responses";

import { z } from "zod";

/**
 * Web server routes for the app. Implements synchronizations between concepts.
 */
class Routes {
  // Synchronize the concepts from `app.ts`.

  @Router.get("/session")
  async getSessionUser(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    return await Authing.getUserById(user);
  }

  @Router.get("/users")
  async getUsers() {
    return await Authing.getUsers();
  }

  @Router.get("/users/:username")
  @Router.validate(z.object({ username: z.string().min(1) }))
  async getUser(username: string) {
    return await Authing.getUserByUsername(username);
  }

  @Router.post("/users")
  async createUser(session: SessionDoc, username: string, password: string) {
    Sessioning.isLoggedOut(session);
    return await Authing.create(username, password);
  }

  @Router.patch("/users/username")
  async updateUsername(session: SessionDoc, username: string) {
    const user = Sessioning.getUser(session);
    return await Authing.updateUsername(user, username);
  }

  @Router.patch("/users/password")
  async updatePassword(session: SessionDoc, currentPassword: string, newPassword: string) {
    const user = Sessioning.getUser(session);
    return Authing.updatePassword(user, currentPassword, newPassword);
  }

  @Router.delete("/users")
  async deleteUser(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    Sessioning.end(session);
    return await Authing.delete(user);
  }

  @Router.post("/login")
  async logIn(session: SessionDoc, username: string, password: string) {
    const u = await Authing.authenticate(username, password);
    Sessioning.start(session, u._id);
    return { msg: "Logged in!" };
  }

  @Router.post("/logout")
  async logOut(session: SessionDoc) {
    Sessioning.end(session);
    return { msg: "Logged out!" };
  }

  /**
   * Get all posts from all users, or all posts from a specific user if the `author` parameter is specified.
   * If the `author` parameter is specified, only return posts from that user.
   * Redact all authors that are not the user, unless the post is linked to the user.
   * @param session the session of the user
   * @param author the username of the user to get posts from, or undefined to get all posts
   * @returns An array of posts, filtered and redacted if necessary
   */
  @Router.get("/posts")
  @Router.validate(z.object({ author: z.string().optional() }))
  async getPosts(session: SessionDoc, author?: string) {
    const user = Sessioning.getUser(session);
    const linkedItems = new Set((await Linking.getLinks()).map((link) => link.item));

    if (author) {
      const authorId = (await Authing.getUserByUsername(author))._id;
      const authorPosts = await Posting.getByAuthor(authorId);
      return authorPosts.map((post) => (user.equals(post.author) || linkedItems.has(post._id) ? post : Posting.redactAuthor(post)));
    } else {
      const allPosts = await Posting.getPosts();
      return allPosts.map((post) => (linkedItems.has(post._id) ? post : Posting.redactAuthor(post)));
    }
  }

  @Router.post("/posts")
  async createPost(session: SessionDoc, isLinked: string, content: string, options?: PostOptions) {
    const user = Sessioning.getUser(session);
    const postCreation = await Posting.create(user, content, options);
    if (isLinked === "true") {
      Linking.link(user, postCreation.post._id);
    }
    return { msg: postCreation.msg, post: await Responses.post(postCreation.post) };
  }

  @Router.patch("/posts/:id")
  async updatePost(session: SessionDoc, id: string, content?: string, options?: PostOptions) {
    const user = Sessioning.getUser(session);
    const oid = new ObjectId(id);
    await Posting.assertUserIsAuthor(oid, user);
    return await Posting.update(oid, content, options);
  }

  @Router.delete("/posts/:id")
  async deletePost(session: SessionDoc, id: string) {
    const user = Sessioning.getUser(session);
    const oid = new ObjectId(id);
    await Posting.assertUserIsAuthor(oid, user);
    const postDeletion = await Posting.delete(oid);
    const linkDeletion = await Linking.unlink(user, oid);
    return { msg: `${postDeletion.msg} and ${linkDeletion.msg}` };
  }

  @Router.get("/friends")
  async getFriends(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    return await Authing.idsToUsernames(await Friending.getFriends(user));
  }

  @Router.delete("/friends/:friend")
  async removeFriend(session: SessionDoc, friend: string) {
    const user = Sessioning.getUser(session);
    const friendOid = (await Authing.getUserByUsername(friend))._id;
    return await Friending.removeFriend(user, friendOid);
  }

  @Router.get("/friend/requests")
  async getRequests(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    return await Responses.friendRequests(await Friending.getRequests(user));
  }

  @Router.post("/friend/requests/:to")
  async sendFriendRequest(session: SessionDoc, to: string) {
    const user = Sessioning.getUser(session);
    const toOid = (await Authing.getUserByUsername(to))._id;
    return await Friending.sendRequest(user, toOid);
  }

  @Router.delete("/friend/requests/:to")
  async removeFriendRequest(session: SessionDoc, to: string) {
    const user = Sessioning.getUser(session);
    const toOid = (await Authing.getUserByUsername(to))._id;
    return await Friending.removeRequest(user, toOid);
  }

  @Router.put("/friend/accept/:from")
  async acceptFriendRequest(session: SessionDoc, from: string) {
    const user = Sessioning.getUser(session);
    const fromOid = (await Authing.getUserByUsername(from))._id;
    return await Friending.acceptRequest(fromOid, user);
  }

  @Router.put("/friend/reject/:from")
  async rejectFriendRequest(session: SessionDoc, from: string) {
    const user = Sessioning.getUser(session);
    const fromOid = (await Authing.getUserByUsername(from))._id;
    return await Friending.rejectRequest(fromOid, user);
  }

  /**
   * Get all comments from all users, or all comments from a specific user if the `author` parameter is specified.
   * If the `author` parameter is specified, only return comments from that user.
   * Redact all authors that are not the user, unless the post is linked to the user.
   * @param session the session of the user
   * @param author the username of the user to get comments from, or undefined to get all comments
   * @returns An array of comments, filtered and redacted if necessary
   */
  @Router.get("/comments")
  @Router.validate(z.object({ author: z.string().optional() }))
  async getComments(session: SessionDoc, author?: string) {
    const user = Sessioning.getUser(session);
    const linkedItems = new Set((await Linking.getLinks()).map((link) => link.item));

    if (author) {
      const authorId = (await Authing.getUserByUsername(author))._id;
      const authorComments = await Commenting.getByAuthor(authorId);
      return authorComments.map((comment) => (user.equals(comment.author) || linkedItems.has(comment._id) ? comment : Commenting.redactAuthor(comment)));
    } else {
      const allComments = await Commenting.getComments();
      return allComments.map((comment) => (linkedItems.has(comment._id) ? comment : Commenting.redactAuthor(comment)));
    }
  }

  @Router.post("/comments")
  async createComment(session: SessionDoc, isLinked: string, postId: string, content: string) {
    const post = new ObjectId(postId);
    await Posting.assertPostExists(post);
    const user = Sessioning.getUser(session);
    const commentCreation = await Commenting.create(user, post, content);
    if (isLinked === "true") {
      Linking.link(user, commentCreation.comment._id);
    }
    return { msg: commentCreation.msg, comment: await Responses.comment(commentCreation.comment) };
  }

  @Router.patch("/comments/:id")
  async updateComment(session: SessionDoc, id: string, content?: string) {
    const user = Sessioning.getUser(session);
    const oid = new ObjectId(id);
    await Commenting.assertUserIsAuthor(oid, user);
    return await Commenting.update(oid, content);
  }

  @Router.delete("/comments/:id")
  async deleteComment(session: SessionDoc, id: string) {
    const user = Sessioning.getUser(session);
    const oid = new ObjectId(id);
    await Commenting.assertUserIsAuthor(oid, user);
    const commentDeletion = await Commenting.delete(oid);
    const linkDeletion = await Linking.unlink(user, oid);
    return { msg: `${commentDeletion.msg} and ${linkDeletion.msg}` };
  }

  @Router.get("/links")
  @Router.validate(z.object({ user: z.string().optional() }))
  async getLinks(user?: string) {
    if (user) {
      const userId = (await Authing.getUserByUsername(user))._id;
      return await Linking.getByUser(userId);
    } else {
      return await Linking.getLinks();
    }
  }

  @Router.get("/links/posts")
  @Router.validate(z.object({ user: z.string().optional() }))
  async getUserPostLinks(user?: string) {
    const postIds = new Set((await Posting.getPosts()).map((post) => post._id));
    const links = await Linking.getLinks();

    if (user) {
      const userId = (await Authing.getUserByUsername(user))._id;
      return links.filter((link) => link.user.equals(userId) && postIds.has(link.item));
    } else {
      return links.filter((link) => postIds.has(link.item));
    }
  }

  @Router.post("/links/posts")
  async createUserPostLink(session: SessionDoc, postId: string) {
    const user = Sessioning.getUser(session);
    const oid = new ObjectId(postId);
    await Posting.assertUserIsAuthor(oid, user);
    return await Linking.link(user, oid);
  }

  @Router.delete("/links/posts/:id")
  async deleteUserPostLink(session: SessionDoc, id: string) {
    const user = Sessioning.getUser(session);
    const oid = new ObjectId(id);
    return await Linking.unlink(user, oid);
  }

  @Router.get("/links/posts/:id")
  @Router.validate(z.object({ id: z.string().min(1) }))
  async getUserPostLink(id: string) {
    const oid = new ObjectId(id);
    // TODO create response for this and all other links
    return await Linking.getByItem(oid);
  }

  @Router.get("/links/comments")
  async getUserCommentLinks(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    const commentIds = new Set((await Commenting.getComments()).map((comment) => comment._id));
    const links = await Linking.getLinks();
    return links.filter((link) => commentIds.has(link.item) && link.user.equals(user));
  }

  @Router.post("/links/comments")
  async createUserCommentLink(session: SessionDoc, id: string) {
    const user = Sessioning.getUser(session);
    const oid = new ObjectId(id);
    await Commenting.assertUserIsAuthor(oid, user);
    return await Linking.link(user, oid);
  }

  @Router.delete("/links/comments/:id")
  async deleteUserCommentLink(session: SessionDoc, id: string) {
    const user = Sessioning.getUser(session);
    const oid = new ObjectId(id);
    return await Linking.unlink(user, oid);
  }

  @Router.get("/links/comments/:id")
  @Router.validate(z.object({ id: z.string().min(1) }))
  async getUserCommentLink(id: string) {
    const oid = new ObjectId(id);
    // TODO create response for this and all other links
    return await Linking.getByItem(oid);
  }

  @Router.get("/links/data")
  async getUserDataLinks(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    const ids = new Set((await Tracking.getData()).map((data) => data._id));
    const links = await Linking.getLinks();
    return links.filter((link) => ids.has(link.item) && link.user.equals(user));
  }

  @Router.post("/links/data")
  async createUserDataLink(session: SessionDoc, id: string) {
    const user = Sessioning.getUser(session);
    const oid = new ObjectId(id);
    await Tracking.assertUserIsOwner(oid, user);
    return await Linking.link(user, oid);
  }

  @Router.delete("/links/data/:id")
  async deleteUserDataLink(session: SessionDoc, id: string) {
    const user = Sessioning.getUser(session);
    const oid = new ObjectId(id);
    return await Linking.unlink(user, oid);
  }

  @Router.get("/links/data/:id")
  @Router.validate(z.object({ id: z.string().min(1) }))
  async getUserDataLink(id: string) {
    const oid = new ObjectId(id);
    // TODO create response for this and all other links
    return await Linking.getByItem(oid);
  }

  @Router.get("/links/competitions")
  async getUserCompetitionLinks(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    const ids = new Set((await Competing.getCompetitions()).map((competition) => competition._id));
    const links = await Linking.getLinks();
    return links.filter((link) => ids.has(link.item) && link.user.equals(user));
  }

  @Router.post("/links/competitions")
  async createUserCompetitionLink(session: SessionDoc, id: string) {
    const user = Sessioning.getUser(session);
    const oid = new ObjectId(id);
    await Competing.assertUserIsOwner(oid, user);
    return await Linking.link(user, oid);
  }

  @Router.delete("/links/competitions/:id")
  async deleteUserCompetitionLink(session: SessionDoc, id: string) {
    const user = Sessioning.getUser(session);
    const oid = new ObjectId(id);
    return await Linking.unlink(user, oid);
  }

  @Router.get("/links/competitions/:id")
  @Router.validate(z.object({ id: z.string().min(1) }))
  async getUserCompetitionLink(id: string) {
    const oid = new ObjectId(id);
    // TODO create response for this and all other links
    return await Linking.getByItem(oid);
  }

  @Router.get("/data")
  @Router.validate(z.object({ username: z.string().optional(), date: z.string().optional(), dateRange: z.string().optional(), sort: z.string().optional() }))
  async getData(session: SessionDoc, username?: string, date?: string, dateRange?: string, sort?: string) {
    const user = Sessioning.getUser(session);
    const usernameOid = username ? (await Authing.getUserByUsername(username))._id : undefined;
    const dateObj = date ? new Date(date) : undefined;
    const dateRangeArr = dateRange ? dateRange.split("_") : undefined;
    const dateRangeParsed = dateRangeArr ? ([new Date(dateRangeArr[0]), new Date(dateRangeArr[1])] as [Date, Date]) : undefined;
    const sortParsed = sort === "score" ? SortOptions.SCORE : sort === "date" ? SortOptions.DATE : undefined;
    const data = await Tracking.getData(usernameOid, dateObj, dateRangeParsed, sortParsed);
    const linkedItems = new Set((await Linking.getLinks()).map((link) => link.item));
    return data.map((d) => (linkedItems.has(d._id) || d.user.equals(user) ? d : Tracking.redactUser(d)));
  }

  /**
   * Logs a user's score data and, if the user is part of any competitions, inputs the data into those competitions.
   * If `isLinked === "true"`, then the data is also linked to the user.
   * @param session The session of the user
   * @param isLinked A string indicating whether the data should be linked to the user. If `"true"`, then the data is linked.
   * @param date The date of the data.
   * @param score The user's score.
   * @returns The newly created data, with a message indicating whether the data was successfully logged and whether the data was linked.
   */
  @Router.post("/data")
  async logData(session: SessionDoc, isLinked: string, date: Date, score: number) {
    const user = Sessioning.getUser(session);
    const data = await Tracking.log(user, date, score);
    // Input data to any competitions that the user is a part of
    Joining.getUserMemberships(user).then((memberships) => {
      memberships.forEach((membership) => {
        const competition = new ObjectId(membership.group);
        Competing.inputData(competition, data.data._id);
      });
    });

    if (isLinked === "true") {
      await Linking.link(user, data.data._id);
    }

    return { ...data, msg: `${data}\nAll competition data successfully logged!${isLinked && "\nLinked data to user!"}` };
  }

  @Router.patch("/data/:id")
  async updateData(session: SessionDoc, id: string, date?: Date, score?: number) {
    const user = Sessioning.getUser(session);
    const oid = new ObjectId(id);
    await Tracking.assertUserIsOwner(oid, user);
    return await Tracking.update(oid, date, score);
  }

  @Router.delete("/data/:id")
  async deleteData(session: SessionDoc, id: string) {
    const user = Sessioning.getUser(session);
    const oid = new ObjectId(id);
    await Tracking.assertUserIsOwner(oid, user);
    return await Tracking.delete(oid);
  }

  /**
   * Get all competitions, filtered by username's competitions if username is specified, redacting all non-linked owners that are not the user
   * @param session The session of the user
   * @param username The username of the user to filter by, if specified
   * @returns An array of competitions, filtered and redacted if necessary
   */
  @Router.get("/competitions")
  @Router.validate(z.object({ username: z.string().optional() }))
  async getCompetitions(session: SessionDoc, username?: string) {
    const user = Sessioning.getUser(session);
    const links = new Set(await Linking.getLinks());
    const competitions = await Competing.getCompetitions();

    const usernameOid = username ? (await Authing.getUserByUsername(username))._id : undefined;
    return competitions
      .filter(async (competition) => (usernameOid ? (await Joining.getMembers(competition._id)).includes(usernameOid) : true))
      .map((competition) => {
        const ownerCompetitionLink = { user: competition.owner, item: competition._id } as LinkDoc;
        return user.equals(competition.owner) || links.has(ownerCompetitionLink) ? competition : Competing.redactOwner(competition);
      });
  }

  @Router.post("/competitions")
  async createCompetition(session: SessionDoc, name: string, endDate: string) {
    const user = Sessioning.getUser(session);
    const endDateObj = new Date(endDate);
    const competitionCreation = await Competing.create(user, name, endDateObj);
    const joinCreation = await Joining.join(competitionCreation.competition._id, user);
    // TODO format response
    // return { msg: postCreation.msg, post: await Responses.post(postCreation.post) };
    return { competition: competitionCreation, group: joinCreation.group, msg: `${competitionCreation.msg}\n${joinCreation.msg}` };
  }

  @Router.patch("/competitions/:name")
  async updateCompetition(session: SessionDoc, name: string, newName?: string, owner?: string, endDate?: string) {
    const user = Sessioning.getUser(session);
    const oid = (await Competing.getByName(name))._id;
    await Competing.assertUserIsOwner(oid, user);
    const ownerObj = owner ? new ObjectId(owner) : undefined;
    const endDateObj = endDate ? new Date(endDate) : undefined;
    return await Competing.update(oid, newName, ownerObj, endDateObj);
  }

  @Router.delete("/competitions/:name")
  async deleteCompetition(session: SessionDoc, name: string) {
    const user = Sessioning.getUser(session);
    const oid = (await Competing.getByName(name))._id;
    await Competing.assertUserIsOwner(oid, user);
    const competitionDeletion = await Competing.delete(oid);
    const linkDeletion = await Linking.unlink(user, oid);
    return { msg: `${competitionDeletion.msg}\n${linkDeletion.msg}` };
  }

  @Router.get("/competitions/:name/users")
  @Router.validate(z.object({ name: z.string().min(1) }))
  async getCompetitionMembers(session: SessionDoc, name: string) {
    const user = Sessioning.getUser(session);
    const competition = await Competing.getByName(name);
    const members = await Joining.getMembers(competition._id);
    const links = new Set(await Linking.getLinks());
    return members.filter((member) => user.equals(member) || links.has({ user: member, item: competition._id } as LinkDoc));
  }

  @Router.post("/competitions/:name/users")
  async joinCompetition(session: SessionDoc, name: string) {
    const user = Sessioning.getUser(session);
    const competition = await Competing.getByName(name);
    return await Joining.join(competition._id, user);
  }

  @Router.delete("/competitions/:name/users/:user")
  async leaveCompetition(session: SessionDoc, name: string) {
    const user = Sessioning.getUser(session);
    const competition = await Competing.getByName(name);
    return await Joining.leave(competition._id, user);
  }
}

/** The web app. */
export const app = new Routes();

/** The Express router. */
export const appRouter = getExpressRouter(app);
