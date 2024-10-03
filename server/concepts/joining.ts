import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";

export interface GroupDoc extends BaseDoc {
  id: ObjectId;
  user: ObjectId;
}

/**
 * Joining [Group, User]
 */
export default class JoiningConcept {
  public readonly groups: DocCollection<GroupDoc>;

  constructor(collectionName: string) {
    this.groups = new DocCollection<GroupDoc>(collectionName);
  }

  async join(id: ObjectId, user: ObjectId) {
    const _id = await this.groups.createOne({ id, user });
    await this.assertUserIsNotInGroup(user, id);
    return { msg: "Group successfully joined!", id: await this.groups.readOne({ _id }) };
  }

  async leave(id: ObjectId, user: ObjectId) {
    await this.groups.deleteOne({ id, user });
    await this.assertUserIsInGroup(user, id);
    return { msg: "Group successfully left!" };
  }

  async getMembers(id: ObjectId) {
    return await this.groups.readOne({ id });
  }

  async getGroups(user: ObjectId) {
    return await this.groups.readMany({ user });
  }

  async assertUserIsNotInGroup(user: ObjectId, group: ObjectId) {
    const groupDoc = await this.groups.readOne({ id: group });
    if (!groupDoc) {
      throw new Error("Group not found!");
    }
    if (groupDoc.user.toString() === user.toString()) {
      throw new Error("User is already in group!");
    }
  }

  async assertUserIsInGroup(user: ObjectId, group: ObjectId) {
    const groupDoc = await this.groups.readOne({ id: group });
    if (!groupDoc) {
      throw new Error("Group not found!");
    }
    if (groupDoc.user.toString() !== user.toString()) {
      throw new Error("User is not in group!");
    }
  }
}
