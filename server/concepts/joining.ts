import { ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

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
    const membership = await this.memberships.readOne({ _id });
    if (!membership) throw new NotFoundError(`Group ${group} does not exist!`);
    return { msg: "Group successfully joined!", membership };
  }

  async leave(user: ObjectId, group: ObjectId) {
    await this.assertUserIsMember(user, group);
    await this.memberships.deleteOne({ user, group });
    return { msg: "Group successfully left!" };
  }

  async getMembers(group: ObjectId) {
    return (await this.memberships.readMany({ group })).map((m) => m.user);
  }

  async getMemberships(group: ObjectId) {
    return await this.memberships.readMany({ group });
  }

  async getUserMemberships(user: ObjectId) {
    return await this.memberships.readMany({ user });
  }

  private async assertUserIsMember(user: ObjectId, group: ObjectId) {
    if (!(await this.memberships.readOne({ user, group }))) throw new UserIsNotMemberError(user, group);
  }

  private async assertUserIsNotMember(user: ObjectId, group: ObjectId) {
    if (await this.memberships.readOne({ user, group })) throw new UserIsAlreadyMemberError(user, group);
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
