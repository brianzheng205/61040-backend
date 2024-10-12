import { ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface PostOptions {
  backgroundColor?: string;
}

export interface PostDoc extends BaseDoc {
  author: ObjectId;
  content: string;
  options?: PostOptions;
}

interface FormattedPost {
  author: string;
  content: string;
  options?: PostOptions;
  _id: ObjectId;
  dateCreated: Date;
  dateUpdated: Date;
}

/**
 * concept: Posting [Author]
 */
export default class PostingConcept {
  public readonly posts: DocCollection<PostDoc>;

  /**
   * Make an instance of Posting.
   */
  constructor(collectionName: string) {
    this.posts = new DocCollection<PostDoc>(collectionName);
  }

  async create(author: ObjectId, content: string, options?: PostOptions) {
    const _id = await this.posts.createOne({ author, content, options });
    const post = await this.posts.readOne({ _id });
    if (!post) throw new NotFoundError(`Post ${_id} does not exist!`);
    return { msg: "Post successfully created!", post };
  }

  async getPosts() {
    // Returns all posts! You might want to page for better client performance
    return await this.posts.readMany({}, { sort: { _id: -1 } });
  }

  async getByAuthor(author: ObjectId) {
    return await this.posts.readMany({ author });
  }

  async update(_id: ObjectId, content?: string, options?: PostOptions) {
    const update: Partial<PostDoc> = {};
    if (content) update.content = content;
    if (options) update.options = options;
    await this.posts.partialUpdateOne({ _id }, update);
    return { msg: "Post successfully updated!" };
  }

  async delete(_id: ObjectId) {
    await this.posts.deleteOne({ _id });
    return { msg: "Post deleted successfully!" };
  }

  redactAuthor(post: FormattedPost) {
    // eslint-disable-next-line
    const { author, ...rest } = post;
    return rest;
  }

  async assertUserIsAuthor(_id: ObjectId, user: ObjectId) {
    const post = await this.posts.readOne({ _id });
    if (!post) throw new NotFoundError(`Post ${_id} does not exist!`);
    if (!user.equals(post.author)) throw new PostAuthorNotMatchError(user, _id);
  }

  async assertPostExists(_id: ObjectId) {
    if (!(await this.posts.readOne({ _id }))) throw new NotFoundError(`Post ${_id} does not exist!`);
  }
}

export class PostAuthorNotMatchError extends NotAllowedError {
  constructor(
    public readonly author: ObjectId,
    public readonly _id: ObjectId,
  ) {
    super("{0} is not the author of post {1}!", author, _id);
  }
}
