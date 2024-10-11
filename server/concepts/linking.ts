import { ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError } from "./errors";

export interface LinkDoc extends BaseDoc {
  user: ObjectId;
  item: ObjectId;
}

/**
 * Linking [User, Item]
 */
export default class LinkingConcept {
  public readonly links: DocCollection<LinkDoc>;

  constructor(collectionName: string) {
    this.links = new DocCollection<LinkDoc>(collectionName);
  }

  async link(user: ObjectId, item: ObjectId) {
    await this.assertUserIsNotLinked(user, item);
    await this.links.createOne({ user, item });
    return { msg: "Item successfully linked with user!", item: await this.links.readOne({ user, item }) };
  }

  async unlink(user: ObjectId, item: ObjectId) {
    await this.assertUserIsLinked(user, item);
    await this.links.deleteOne({ user, item });
    return { msg: "Item successfully unlinked from user!" };
  }

  async getLinks() {
    return await this.links.readMany({}, { sort: { _id: -1 } });
  }

  async getByItem(item: ObjectId) {
    return await this.links.readMany({ item });
  }

  async getByUser(user: ObjectId) {
    return await this.links.readMany({ user });
  }

  private async assertUserIsLinked(user: ObjectId, item: ObjectId) {
    const userItem = await this.links.readOne({ user, item });
    if (!userItem) {
      throw new UserNotLinkedError(user, item);
    }
  }

  private async assertUserIsNotLinked(user: ObjectId, item: ObjectId) {
    const userItem = await this.links.readOne({ user, item });
    if (userItem) {
      throw new UserAlreadyLinkedError(user, item);
    }
  }
}

export class UserNotLinkedError extends NotAllowedError {
  constructor(
    public readonly user: ObjectId,
    public readonly item: ObjectId,
  ) {
    super(`User ${user} is not linked with item ${item}!`);
  }
}

export class UserAlreadyLinkedError extends NotAllowedError {
  constructor(
    public readonly user: ObjectId,
    public readonly item: ObjectId,
  ) {
    super(`User ${user} is already linked with item ${item}!`);
  }
}
