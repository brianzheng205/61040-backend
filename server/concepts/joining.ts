import { ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface GroupDoc extends BaseDoc {
  name: string;
  owner: ObjectId;
  members: ObjectId[];
}

export interface UserGroupsDoc extends BaseDoc {
  user: ObjectId;
  groups: ObjectId[];
}

/**
 * Joining [Group, User]
 */
export default class JoiningConcept {
  public readonly groups: DocCollection<GroupDoc>;
  public readonly userGroups: DocCollection<UserGroupsDoc>;

  constructor(collectionName: string) {
    this.groups = new DocCollection<GroupDoc>(collectionName);
    this.userGroups = new DocCollection<UserGroupsDoc>(collectionName + "_userGroups");
  }

  async create(name: string, user: ObjectId) {
    const _id = await this.groups.createOne({ name, owner: user, members: [user] });
    return { msg: "Group successfully created!", group: await this.groups.readOne({ _id }) };
  }

  async update(_id: ObjectId, name: string) {
    await this.groups.collection.updateOne({ id: _id }, { $set: { name } });
    return { msg: "Group successfully updated!", group: await this.groups.readOne({ _id }) };
  }

  async delete(_id: ObjectId) {
    await this.groups.deleteOne({ id: _id });
    await this.userGroups.deleteMany({ groups: _id });
    return { msg: "Group successfully deleted!" };
  }

  async join(user: ObjectId, group: ObjectId) {
    await this.assertUserIsNotInGroup(user, group);
    const _id = await this.groups.collection.updateOne({ id: group }, { $push: { members: user } });
    await this.userGroups.collection.updateOne({ user }, { $push: { groups: group } });
    return { msg: "Group successfully joined!", group: await this.groups.readOne({ _id }) };
  }

  async leave(user: ObjectId, group: ObjectId) {
    await this.assertUserIsInGroup(user, group);
    await this.groups.collection.updateOne({ id: group }, { $pull: { members: user } });
    await this.userGroups.collection.updateOne({ user }, { $pull: { groups: group } });
    return { msg: "Group successfully left!" };
  }

  async getMembers(group: ObjectId) {
    return await this.groups.readOne({ id: group }, { projection: { members: 1 } });
  }

  async getByUser(user: ObjectId) {
    return await this.userGroups.readOne({ user }, { projection: { groups: 1 } });
  }

  async idsToGroupNames(ids: ObjectId[]) {
    const groups = await this.groups.readMany({ _id: { $in: ids } });
    return groups.map((group) => group.name);
  }

  async assertOwnerIsUser(user: ObjectId, group: ObjectId) {
    const groupDoc = await this.groups.readOne({ id: group });
    if (!groupDoc) {
      throw new NotFoundError("Group not found!");
    }
    if (user.toString() !== groupDoc.owner.toString()) {
      throw new GroupOwnerNotMatchError(user, group);
    }
  }

  async assertUserIsNotInGroup(user: ObjectId, group: ObjectId) {
    const groupDoc = await this.groups.readOne({ id: group });
    if (!groupDoc) {
      throw new NotFoundError("Group not found!");
    }
    if (user.toString() in groupDoc.members.map((member) => member.toString())) {
      throw new Error("User is already in group!");
    }
  }

  async assertUserIsInGroup(user: ObjectId, group: ObjectId) {
    const groupDoc = await this.groups.readOne({ id: group });
    if (!groupDoc) {
      throw new NotFoundError("Group not found!");
    }
    if (user.toString() in groupDoc.members.map((member) => member.toString())) {
      throw new NotFoundError("User is not in group!");
    }
  }
}

export class GroupOwnerNotMatchError extends NotAllowedError {
  constructor(
    public readonly owner: ObjectId,
    public readonly _id: ObjectId,
  ) {
    super("{0} is not the owner of group {1}!", owner, _id);
  }
}
