import { ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface GroupDoc extends BaseDoc {
  name: string;
  owner: ObjectId;
  members: ObjectId[];
}

export interface UserGroupDoc extends BaseDoc {
  user: ObjectId;
  group: ObjectId;
}

/**
 * Joining [Group, User]
 */
export default class JoiningConcept {
  public readonly groups: DocCollection<GroupDoc>;
  public readonly userGroups: DocCollection<UserGroupDoc>;

  constructor(collectionName: string) {
    this.groups = new DocCollection<GroupDoc>(collectionName);
    this.userGroups = new DocCollection<UserGroupDoc>(collectionName + "_userGroups");
  }

  async join(user: ObjectId, group: ObjectId) {
    await this.assertUserIsNotInGroup(user, group);
    const _id = await this.groups.collection.updateOne({ id: group }, { $push: { members: user } });
    await this.userGroups.createOne({ user, group });
    return { msg: "Group successfully joined!", group: await this.groups.readOne({ _id }) };
  }

  async leave(user: ObjectId, group: ObjectId) {
    await this.assertUserIsInGroup(user, group);
    await this.groups.collection.updateOne({ id: group }, { $pull: { members: user } });
    await this.userGroups.deleteOne({ user, group });
    return { msg: "Group successfully left!" };
  }

  async getMembers(group: ObjectId) {
    return await this.groups.readOne({ id: group }, { projection: { members: 1 } });
  }

  async getByUser(user: ObjectId) {
    return await this.userGroups.readMany({ user });
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
      throw new UserAlreadyInGroupError(user, group);
    }
  }

  async assertUserIsInGroup(user: ObjectId, group: ObjectId) {
    const groupDoc = await this.groups.readOne({ id: group });
    if (!groupDoc) {
      throw new NotFoundError("Group not found!");
    }
    if (user.toString() in groupDoc.members.map((member) => member.toString())) {
      throw new UserNotInGroupError(user, group);
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

export class UserAlreadyInGroupError extends NotAllowedError {
  constructor(
    public readonly user: ObjectId,
    public readonly group: ObjectId,
  ) {
    super("{0} is already in group {1}!", user, group);
  }
}

export class UserNotInGroupError extends NotAllowedError {
  constructor(
    public readonly user: ObjectId,
    public readonly group: ObjectId,
  ) {
    super("{0} is not in group {1}!", user, group);
  }
}
