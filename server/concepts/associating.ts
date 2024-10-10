import { ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError } from "./errors";

export interface UserItemDoc extends BaseDoc {
  user: ObjectId;
  item: ObjectId;
}

/**
 * Associating [Item, User]
 */
export default class AssociatingConcept {
  public readonly items: DocCollection<UserItemDoc>;

  constructor(collectionName: string) {
    this.items = new DocCollection<UserItemDoc>(collectionName);
  }

  async associate(user: ObjectId, item: ObjectId) {
    await this.items.createOne({ user, item });
    return { msg: "Item successfully associated with user!", item: await this.items.readOne({ user, item }) };
  }

  async disassociate(item: ObjectId) {
    await this.items.deleteOne({ item });
    return { msg: "Item successfully disassociated from user!" };
  }

  async getItemsByUser(user: ObjectId) {
    return await this.items.readMany({ user });
  }

  async assertUserIsAssociated(user: ObjectId, item: ObjectId) {
    const userItem = await this.items.readOne({ user, item });
    if (!userItem) {
      throw new UserNotAssociatedError(user, item);
    }
  }

  async assertUserIsNotAssociated(user: ObjectId, item: ObjectId) {
    const userItem = await this.items.readOne({ user, item });
    if (userItem) {
      throw new UserAlreadyAssociatedError(user, item);
    }
  }
}

export class UserNotAssociatedError extends NotAllowedError {
  constructor(
    public readonly user: ObjectId,
    public readonly item: ObjectId,
  ) {
    super(`User ${user} is not associated with item ${item}!`);
  }
}

export class UserAlreadyAssociatedError extends NotAllowedError {
  constructor(
    public readonly user: ObjectId,
    public readonly item: ObjectId,
  ) {
    super(`User ${user} is already associated with item ${item}!`);
  }
}
