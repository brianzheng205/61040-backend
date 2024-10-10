import { ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError } from "./errors";

export interface CompetitionDoc extends BaseDoc {
  name: string;
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

  async create(name: string, endDate: Date) {
    await this.assertDateIsInFuture(endDate);
    await this.competition.createOne({ name, endDate, data: [] });
    return { msg: "Competition successfully created!", competition: await this.competition.readOne({ name }) };
  }

  async update(_id: ObjectId, name?: string, endDate?: Date) {
    if (endDate !== undefined) {
      await this.assertDateIsInFuture(endDate);
    }
    await this.competition.partialUpdateOne({ _id }, { name, endDate });
    return { msg: "Data successfully updated!" };
  }

  async inputData(_id: ObjectId, data: ObjectId[]) {
    await this.competition.collection.updateOne({ _id }, { $push: { ...data } });
    return { msg: "Data successfully added!" };
  }

  async delete(_id: ObjectId) {
    await this.competition.deleteOne({ _id });
  }

  async getCompetitionsOrderedByEndDate() {
    return await this.competition.readMany({ endDate: { $gt: new Date() } }, { sort: { endDate: 1 } });
  }

  private async assertDateIsInFuture(date: Date) {
    if (date < new Date()) {
      throw new DateNotInFutureError(date);
    }
  }
}

export class DateNotInFutureError extends NotAllowedError {
  constructor(public readonly date: Date) {
    const dateStr = date.toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" });
    super(`Date ${dateStr} is not in the future!`);
  }
}
