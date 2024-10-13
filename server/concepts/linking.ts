import { ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

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
    await this.assertLinkDoesNotExist(user, item);
    await this.links.createOne({ user, item });
    const link = await this.links.readOne({ user, item });
    if (!link) throw new NotFoundError(`Item ${item} does not exist!`);
    return { msg: "Item successfully linked with user!", link };
  }

  async getLinks() {
    return await this.links.readMany({}, { sort: { _id: -1 } });
  }

  async getByUser(user: ObjectId) {
    return await this.links.readMany({ user });
  }

  async hasLink(user: ObjectId, item: ObjectId) {
    const link = await this.links.readOne({ user, item });
    return link ? true : false;
  }

  async delete(_id: ObjectId) {
    await this.links.deleteOne({ _id });
    return { msg: "Item successfully unlinked from user!" };
  }

  async unlink(user: ObjectId, item: ObjectId) {
    await this.links.deleteOne({ user, item });
    return { msg: "Item successfully unlinked from user!" };
  }

  async assertLinkBelongsToUser(_id: ObjectId, user: ObjectId) {
    if (!(await this.links.readOne({ _id, user }))) throw new UserDoesNotOwnLinkError(user, _id);
  }

  private async assertLinkDoesNotExist(user: ObjectId, item: ObjectId) {
    if (await this.links.readOne({ user, item })) throw new LinkAlreadyExists(user, item);
  }
}

export class LinkAlreadyExists extends NotAllowedError {
  constructor(
    public readonly user: ObjectId,
    public readonly item: ObjectId,
  ) {
    super("{0} is already linked to item {1}!", user, item);
  }
}

export class UserDoesNotOwnLinkError extends NotAllowedError {
  constructor(
    public readonly user: ObjectId,
    public readonly _id: ObjectId,
  ) {
    super("User {0} does not own link {1}!", user, _id);
  }
}
