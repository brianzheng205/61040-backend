import { ObjectId } from "mongodb";

import { Router, getExpressRouter } from "./framework/router";

import { Authing, Commenting, Friending, Linking, Posting, Sessioning } from "./app";
import { PostOptions } from "./concepts/posting";
import { SessionDoc } from "./concepts/sessioning";
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

  @Router.get("/posts")
  @Router.validate(z.object({ author: z.string().optional() }))
  async getPosts(session: SessionDoc, author?: string) {
    const user = Sessioning.getUser(session);
    const publicItems = new Set((await Linking.getLinks()).map((link) => link.item));
    const allPosts = await Posting.getPosts();

    if (author !== undefined && (await Authing.getUserByUsername(author))._id.equals(user)) {
      // Return all of author's posts if user is the author
      return allPosts.filter((p) => p.author.equals(user));
    } else if (author !== undefined) {
      // Return all of author's public posts if user is not the author
      const id = (await Authing.getUserByUsername(author))._id;
      const allAuthorPosts = allPosts.filter((p) => p.author.equals(id));
      return allAuthorPosts.filter((p) => publicItems.has(p._id));
    } else {
      // Return all public posts and user's (public and private) posts if author is not specified
      const allPublicPosts = allPosts.filter((p) => publicItems.has(p._id));
      const allPublicPostsSet = new Set(allPublicPosts);
      const allUserPosts = allPosts.filter((p) => p.author.equals(user));
      return allPublicPosts.concat(allUserPosts.filter((p) => !allPublicPostsSet.has(p)));
    }
  }

  @Router.post("/posts")
  async createPost(session: SessionDoc, isLinked: string, content: string, options?: PostOptions) {
    const user = Sessioning.getUser(session);
    const postCreation = await Posting.create(user, content, options);
    if (isLinked === "true") {
      Linking.link(user, postCreation._id);
    }
    return { msg: postCreation.msg, post: await Responses.post(postCreation.post) };
  }

  @Router.patch("/posts/:id")
  async updatePost(session: SessionDoc, id: string, content?: string, options?: PostOptions) {
    const user = Sessioning.getUser(session);
    const oid = new ObjectId(id);
    await Posting.assertAuthorIsUser(oid, user);
    return await Posting.update(oid, content, options);
  }

  @Router.delete("/posts/:id")
  async deletePost(session: SessionDoc, id: string) {
    const user = Sessioning.getUser(session);
    const oid = new ObjectId(id);
    await Posting.assertAuthorIsUser(oid, user);
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

  @Router.get("/comments")
  @Router.validate(z.object({ author: z.string().optional() }))
  async getComments(session: SessionDoc, author?: string) {
    const user = Sessioning.getUser(session);
    const publicItemsSet = new Set((await Linking.getLinks()).map((link) => link.item));

    if (author !== undefined && (await Authing.getUserByUsername(author))._id.equals(user)) {
      // Return all of author's comments if user is the author
      return await Commenting.getByAuthor(user);
    } else if (author !== undefined) {
      // Return all of author's public comments if user is not the author
      const id = (await Authing.getUserByUsername(author))._id;
      const allAuthorComments = await Commenting.getByAuthor(id);
      return allAuthorComments.filter((p) => publicItemsSet.has(p._id));
    } else {
      // Return all public comments and user's (public and private) comments if author is not specified
      const allComments = await Commenting.getComments();
      const allPublicComments = allComments.filter((p) => publicItemsSet.has(p._id));
      const allPublicCommentsSet = new Set(allPublicComments);
      const allUserComments = await Commenting.getByAuthor(user);
      return allPublicComments.concat(allUserComments.filter((p) => !allPublicCommentsSet.has(p)));
    }
  }

  @Router.post("/comments")
  async createComment(session: SessionDoc, isLinked: string, postId: string, content: string) {
    const post = new ObjectId(postId);
    await Posting.assertPostExists(post);
    const user = Sessioning.getUser(session);
    const commentCreation = await Commenting.create(user, post, content);
    if (isLinked === "true") {
      Linking.link(user, commentCreation._id);
    }
    return { msg: commentCreation.msg, comment: await Responses.comment(commentCreation.comment) };
  }

  @Router.patch("/comments/:id")
  async updateComment(session: SessionDoc, id: string, content?: string) {
    const user = Sessioning.getUser(session);
    const oid = new ObjectId(id);
    await Commenting.assertAuthorIsUser(oid, user);
    return await Commenting.update(oid, content);
  }

  @Router.delete("/comments/:id")
  async deleteComment(session: SessionDoc, id: string) {
    const user = Sessioning.getUser(session);
    const oid = new ObjectId(id);
    await Commenting.assertAuthorIsUser(oid, user);
    const commentDeletion = await Commenting.delete(oid);
    const linkDeletion = await Linking.unlink(user, oid);
    return { msg: `${commentDeletion.msg} and ${linkDeletion.msg}` };
  }

  @Router.get("/links")
  @Router.validate(z.object({ user: z.string().optional() }))
  async getLinks(user?: string) {
    if (user !== undefined) {
      const userId = (await Authing.getUserByUsername(user))._id;
      return await Linking.getByUser(userId);
    } else {
      return await Linking.getLinks();
    }
  }

  @Router.get("/links/posts")
  async getUserPostLinks(user?: string) {
    const postIds = new Set((await Posting.getPosts()).map((post) => post._id));
    const links = await Linking.getLinks();

    if (user !== undefined) {
      const userId = (await Authing.getUserByUsername(user))._id;
      return links.filter((link) => link.user.equals(userId) && postIds.has(link.item));
    } else {
      return links.filter((link) => postIds.has(link.item));
    }
  }

  @Router.post("/links/posts")
  async createUserPostLink(session: SessionDoc, postId: string) {
    const user = Sessioning.getUser(session);
    const postOid = new ObjectId(postId);
    await Posting.assertAuthorIsUser(postOid, user);
    return await Linking.link(user, postOid);
  }

  @Router.delete("/links/posts/:id")
  async deleteUserPostLink(session: SessionDoc, postId: string) {
    const user = Sessioning.getUser(session);
    const postOid = new ObjectId(postId);
    return await Linking.unlink(user, postOid);
  }

  @Router.get("/links/posts/:id")
  async getUserPostLink(postId: string) {
    const postOid = new ObjectId(postId);
    // TODO create response for this and all other links
    return await Linking.getByItem(postOid);
  }

  @Router.get("/links/comments")
  async getUserCommentLinks(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    const commentIds = new Set((await Commenting.getComments()).map((comment) => comment._id));
    const links = await Linking.getLinks();
    return links.filter((link) => commentIds.has(link.item) && link.user.equals(user));
  }

  @Router.post("/links/comments")
  async createUserCommentLink(session: SessionDoc, commentId: string) {
    const user = Sessioning.getUser(session);
    const commentOid = new ObjectId(commentId);
    await Commenting.assertAuthorIsUser(commentOid, user);
    return await Linking.link(user, commentOid);
  }

  @Router.delete("/links/comments/:id")
  async deleteUserCommentLink(session: SessionDoc, commentId: string) {
    const user = Sessioning.getUser(session);
    const commentOid = new ObjectId(commentId);
    return await Linking.unlink(user, commentOid);
  }

  @Router.get("/links/comments/:id")
  async getUserCommentLink(commentId: string) {
    const commentOid = new ObjectId(commentId);
    // TODO create response for this and all other links
    return await Linking.getByItem(commentOid);
  }

  // TODO: Add Docs
  /**
   * Get data for a user, on a certain date, within a certain time period, or for the best score.
   * You must specify either:
   *   - `username`: A user's username
   *   - `date`: A date in the format YYYY-MM-DD
   *   - `dateRange`: A date range in the format YYYY-MM-DD-YYYY-MM-DD, e.g. 2021-01-01-2021-02-01
   *   - `sort`: A field to sort by (score or date)
   */
  @Router.get("/data")
  async getData(username?: string, date?: string, dateRange?: string, sort?: string) {}

  // TODO: Add data to any competitions that the user is a part of
  @Router.post("/data")
  async logData(session: SessionDoc, date: Date, score: number) {}

  @Router.patch("/data/:id")
  async updateData(session: SessionDoc, id: string, date?: Date, score?: number) {}

  @Router.delete("/data/:id")
  async deleteData(session: SessionDoc, id: string) {}

  @Router.get("/competitions")
  async getCompetitions(username?: string) {}

  @Router.post("/competitions")
  async createCompetition(session: SessionDoc, name: string) {}

  @Router.patch("/competitions/:competitionName")
  async updateCompetition(session: SessionDoc, competitionName: string, newName?: string, owner?: ObjectId, endDate?: string) {}

  @Router.delete("/competitions/:competitionName")
  async deleteCompetition(session: SessionDoc, competitionName: string) {}

  @Router.get("/competitions/:competitionName/users")
  async getCompetitionMembers(competitionName: string) {}

  @Router.post("/competitions/:competitionName/users")
  async joinCompetition(session: SessionDoc, competitionName: string) {}

  @Router.delete("/competitions/:competitionName/users/:user")
  async leaveCompetition(session: SessionDoc, competitionName: string) {}
}

/** The web app. */
export const app = new Routes();

/** The Express router. */
export const appRouter = getExpressRouter(app);
