import { ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface CompetitionDoc extends BaseDoc {
  name: string;
  owner: ObjectId;
  endDate: Date;
  data: ObjectId[];
}

/**
 * Competing [User]
 */
export default class CompetingConcept {
  public readonly competition: DocCollection<CompetitionDoc>;

  constructor(collectionName: string) {
    this.competition = new DocCollection<CompetitionDoc>(collectionName);
  }

  async create(name: string, owner: ObjectId, endDate: Date) {
    await this.assertNameUnique(name);
    await this.assertDateIsInFuture(endDate);
    await this.competition.createOne({ name, owner, endDate, data: [] });
    return { msg: "Competition successfully created!", competition: await this.competition.readOne({ name }) };
  }

  async update(_id: ObjectId, name?: string, owner?: ObjectId, endDate?: Date) {
    await this.assertValidUpdateInfo(_id, name, owner, endDate);
    await this.competition.partialUpdateOne({ _id }, { name, owner, endDate });
    return { msg: "Competition successfully updated!" };
  }

  async inputData(_id: ObjectId, data: ObjectId[]) {
    await this.competition.collection.updateOne({ _id }, { $push: { ...data } });
    return { msg: "Data successfully added!" };
  }

  async delete(_id: ObjectId) {
    await this.competition.deleteOne({ _id });
  }

  async getCompetitionById(_id: ObjectId) {
    const competition = await this.competition.readOne({ _id });
    if (competition === null) {
      throw new NotFoundError(`Competition ${_id} does not exist!`);
    }
    return competition;
  }

  async getCompetitionByName(name: string) {
    const competition = await this.competition.readOne({ name });
    if (competition === null) {
      throw new NotFoundError(`Competition ${name} does not exist!`);
    }
    return competition;
  }

  async getCompetitionsOrderedByEndDate() {
    return await this.competition.readMany({ endDate: { $gt: new Date() } }, { sort: { endDate: 1 } });
  }

  async assertUserIsOwner(user: ObjectId, competition: ObjectId) {
    const competitionData = await this.competition.readOne({ _id: competition });
    if (competitionData === null) {
      throw new NotFoundError(`Competition ${competition} does not exist!`);
    }
    if (competitionData.owner.toString() !== user.toString()) {
      throw new CompetitionOwnerNotMatchError(user, competition);
    }
  }

  private async assertValidUpdateInfo(_id: ObjectId, name?: string, owner?: ObjectId, endDate?: Date) {
    if (name !== undefined) {
      await this.assertNameUnique(name);
    }
    if (owner !== undefined) {
      await this.assertUserIsNotOwner(owner, _id);
    }
    if (endDate !== undefined) {
      await this.assertDateIsInFuture(endDate);
    }
  }

  private async assertUserIsNotOwner(user: ObjectId, competition: ObjectId) {
    const competitionData = await this.competition.readOne({ _id: competition });
    if (competitionData === null) {
      throw new NotFoundError(`Competition ${competition} does not exist!`);
    }
    if (competitionData.owner.toString() === user.toString()) {
      throw new NotAllowedError(`User ${user} is already the owner of ${competition}!`);
    }
  }

  private async assertNameUnique(name: string) {
    if (await this.competition.readOne({ name })) {
      throw new NotAllowedError(`Competition with name ${name} already exists!`);
    }
  }

  private async assertDateIsInFuture(date: Date) {
    if (date < new Date()) {
      throw new DateNotInFutureError(date);
    }
  }
}

export class CompetitionOwnerNotMatchError extends NotAllowedError {
  constructor(
    public readonly user: ObjectId,
    public readonly competition: ObjectId,
  ) {
    super(`User ${user} is not the owner of ${competition}!`);
  }
}

export class DateNotInFutureError extends NotAllowedError {
  constructor(public readonly date: Date) {
    const dateStr = date.toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" });
    super(`Date ${dateStr} is not in the future!`);
  }
}
