import { ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError } from "./errors";

export interface MembershipDoc extends BaseDoc {
  user: ObjectId;
  group: ObjectId;
}

/**
 * Joining [User, Group]
 */
export default class JoiningConcept {
  public readonly memberships: DocCollection<MembershipDoc>;

  constructor(collectionName: string) {
    this.memberships = new DocCollection<MembershipDoc>(collectionName);
  }

  async join(user: ObjectId, group: ObjectId) {
    await this.assertUserIsNotMember(user, group);
    const _id = await this.memberships.createOne({ user, group });
    return { msg: "Group successfully joined!", group: await this.memberships.readOne({ _id }) };
  }

  async leave(user: ObjectId, group: ObjectId) {
    await this.assertUserIsMember(user, group);
    await this.memberships.deleteOne({ user, group });
    return { msg: "Group successfully left!" };
  }

  async getMembers(group: ObjectId) {
    const groupDoc = await this.memberships.readMany({ id: group });
    return groupDoc.map((membership) => membership.user);
  }

  async getUserMemberships(user: ObjectId) {
    return await this.memberships.readMany({ user });
  }

  private async assertUserIsNotMember(user: ObjectId, group: ObjectId) {
    const membership = await this.memberships.readOne({ user, group });
    if (membership !== null) {
      throw new UserIsAlreadyMemberError(user, group);
    }
  }

  private async assertUserIsMember(user: ObjectId, group: ObjectId) {
    const membership = await this.memberships.readOne({ user, group });
    if (membership === null) {
      throw new UserIsNotMemberError(user, group);
    }
  }
}

export class UserIsAlreadyMemberError extends NotAllowedError {
  constructor(
    public readonly user: ObjectId,
    public readonly group: ObjectId,
  ) {
    super("{0} is already in group {1}!", user, group);
  }
}

export class UserIsNotMemberError extends NotAllowedError {
  constructor(
    public readonly user: ObjectId,
    public readonly group: ObjectId,
  ) {
    super("{0} is not in group {1}!", user, group);
  }
}
