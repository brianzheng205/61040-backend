import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface CommentDoc extends BaseDoc {
  author: ObjectId;
  item: ObjectId;
  content: string;
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
    return { msg: "Comment successfully created!", comment: await this.comments.readOne({ _id }) };
  }

  async getByItem(item: ObjectId): Promise<CommentDoc[]> {
    return this.comments.readMany({ item });
  }

  async delete(_id: ObjectId) {
    await this.comments.deleteOne(_id);
    return { msg: "Comment deleted successfully!" };
  }

  async assertAuthorIsUser(_id: ObjectId, user: ObjectId) {
    const comment = await this.comments.readOne({ _id });
    if (!comment) {
      throw new NotFoundError(`Comment ${_id} does not exist!`);
    }
    if (comment.author.toString() !== user.toString()) {
      throw new Error(`Comment ${_id} does not belong to user ${user}!`);
    }
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
