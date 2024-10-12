import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface CommentDoc extends BaseDoc {
  author: ObjectId;
  item: ObjectId;
  content: string;
}

interface FormattedComment {
  author: string;
  item: ObjectId;
  content: string;
  _id: ObjectId;
  dateCreated: Date;
  dateUpdated: Date;
}

/**
 * concept: Commenting [Item, Author]
 */
export default class CommentingConcept {
  public readonly comments: DocCollection<CommentDoc>;

  constructor(collectionName: string) {
    this.comments = new DocCollection<CommentDoc>(collectionName);
  }

  async create(author: ObjectId, item: ObjectId, content: string) {
    const _id = await this.comments.createOne({ author, item, content });
    const comment = await this.comments.readOne({ _id });
    if (!comment) throw new NotFoundError(`Comment ${_id} does not exist!`);
    return { msg: "Comment successfully created!", comment };
  }

  async getComments() {
    return await this.comments.readMany({}, { sort: { _id: -1 } });
  }

  async getByAuthor(author: ObjectId) {
    return await this.comments.readMany({ author });
  }

  async getByItem(item: ObjectId) {
    return await this.comments.readMany({ item });
  }

  async update(_id: ObjectId, content?: string) {
    const update: Partial<CommentDoc> = {};
    if (content) update.content = content;
    await this.comments.partialUpdateOne({ _id }, update);
    return { msg: "Comment successfully updated!" };
  }

  async delete(_id: ObjectId) {
    await this.comments.deleteOne({ _id });
    return { msg: "Comment deleted successfully!" };
  }

  redactAuthor(comment: FormattedComment) {
    // eslint-disable-next-line
    const { author, ...rest } = comment;
    return rest;
  }

  async assertUserIsAuthor(_id: ObjectId, user: ObjectId) {
    const comment = await this.comments.readOne({ _id });
    if (!comment) throw new NotFoundError(`Comment ${_id} does not exist!`);
    if (!user.equals(comment.author)) throw new Error(`Comment ${_id} does not belong to user ${user}!`);
  }
}

export class CommentAuthorNotMatchError extends NotAllowedError {
  constructor(
    public readonly author: ObjectId,
    public readonly _id: ObjectId,
  ) {
    super("{0} is not the author of comment {1}!", author, _id);
  }
}
