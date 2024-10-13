import { ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface CompetitionDoc extends BaseDoc {
  name: string;
  owner: ObjectId;
  endDate: Date;
  data: ObjectId[];
}

interface FormattedCompetition {
  owner: string;
  data: {
    user: string;
    date: Date;
    score: number;
    _id: ObjectId;
    dateCreated: Date;
    dateUpdated: Date;
  }[];
  name: string;
  endDate: Date;
  _id: ObjectId;
  dateCreated: Date;
  dateUpdated: Date;
}

/**
 * Competing [User]
 */
export default class CompetingConcept {
  public readonly competitions: DocCollection<CompetitionDoc>;

  constructor(collectionName: string) {
    this.competitions = new DocCollection<CompetitionDoc>(collectionName);
  }

  async create(owner: ObjectId, name: string, endDate: Date) {
    await this.assertNameUnique(name);
    await this.assertDateIsInFuture(endDate);
    const _id = await this.competitions.createOne({ name, owner, endDate, data: [] });
    const competition = await this.competitions.readOne({ _id });
    if (!competition) throw new Error("Failed to create competition");
    return { msg: "Competition successfully created!", competition };
  }

  async getCompetitions() {
    return await this.competitions.readMany({ endDate: { $gt: new Date() } }, { sort: { endDate: 1 } });
  }

  async getByOwner(owner: ObjectId) {
    return await this.competitions.readMany({ owner });
  }

  async getById(_id: ObjectId) {
    const competition = await this.competitions.readOne({ _id });
    if (!competition) throw new NotFoundError(`Competition ${_id} does not exist!`);
    return competition;
  }

  async getByName(name: string) {
    const competition = await this.competitions.readOne({ name });
    if (!competition) throw new NotFoundError(`Competition ${name} does not exist!`);
    return competition;
  }

  async update(_id: ObjectId, name?: string, owner?: ObjectId, endDate?: Date) {
    await this.assertCompetitionIsActive(_id);
    await this.assertValidUpdateInfo(_id, name, owner, endDate);
    const update: Partial<CompetitionDoc> = {};
    if (name) update.name = name;
    if (owner) update.owner = owner;
    if (endDate) update.endDate = endDate;
    await this.competitions.partialUpdateOne({ _id }, update);
    return { msg: "Competition successfully updated!" };
  }

  async inputData(_id: ObjectId, data: ObjectId) {
    await this.assertCompetitionIsActive(_id);
    await this.competitions.collection.updateOne({ _id }, { $push: { data } });
    return { msg: "Data successfully added!" };
  }

  async delete(_id: ObjectId) {
    await this.competitions.deleteOne({ _id });
    return { msg: "Competition successfully deleted!" };
  }

  redactOwner(competition: FormattedCompetition) {
    // eslint-disable-next-line
    const { owner, ...rest } = competition;
    return rest;
  }

  async assertUserIsOwner(_id: ObjectId, user: ObjectId) {
    const competitionData = await this.competitions.readOne({ _id });
    if (!competitionData) throw new NotFoundError(`Competition ${_id} does not exist!`);
    if (!user.equals(competitionData.owner)) throw new CompetitionOwnerNotMatchError(user, _id);
  }

  private async assertCompetitionIsActive(_id: ObjectId) {
    const competition = await this.competitions.readOne({ _id });
    if (!competition) throw new NotFoundError(`Competition ${_id} does not exist!`);
    if (competition.endDate < new Date()) throw new NotAllowedError(`Competition ${competition.name} has already ended!`);
  }

  private async assertValidUpdateInfo(_id: ObjectId, name?: string, owner?: ObjectId, endDate?: Date) {
    if (name) await this.assertNameUnique(name);
    if (owner) await this.assertUserIsNotOwner(owner, _id);
    if (endDate) await this.assertDateIsInFuture(endDate);
  }

  private async assertUserIsNotOwner(user: ObjectId, competition: ObjectId) {
    const competitionData = await this.competitions.readOne({ _id: competition });
    if (!competitionData) throw new NotFoundError(`Competition ${competition} does not exist!`);
    if (!user.equals(competitionData.owner)) throw new NotAllowedError(`User ${user} is already the owner of ${competition}!`);
  }

  private async assertNameUnique(name: string) {
    if (await this.competitions.readOne({ name })) throw new NotAllowedError(`Competition with name ${name} already exists!`);
  }

  private async assertDateIsInFuture(date: Date) {
    if (date < new Date()) throw new DateNotInFutureError(date);
  }
}

export class CompetitionOwnerNotMatchError extends NotAllowedError {
  constructor(
    public readonly user: ObjectId,
    public readonly competition: ObjectId,
  ) {
    super(`User {0} is not the owner of {1}!`);
  }
}

export class DateNotInFutureError extends NotAllowedError {
  constructor(public readonly date: Date) {
    const dateStr = date.toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" });
    super(`Date ${dateStr} is not in the future!`);
  }
}
