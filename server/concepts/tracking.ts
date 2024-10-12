import { ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export enum SortOptions {
  SCORE = "score",
  DATE = "date",
}

export interface DataDoc extends BaseDoc {
  user: ObjectId;
  date: Date;
  score: number;
}

interface FormattedData {
  user: string;
  date: Date;
  score: number;
  _id: ObjectId;
  dateCreated: Date;
  dateUpdated: Date;
}

/**
 * Tracking [User]
 */
export default class TrackingConcept {
  public readonly data: DocCollection<DataDoc>;

  constructor(collectionName: string) {
    this.data = new DocCollection<DataDoc>(collectionName);
  }

  async log(user: ObjectId, date: Date, score: number) {
    await this.data.createOne({ user, date, score });
    const data = await this.data.readOne({ user, date });
    if (data === null) throw new NotFoundError(`Data for user ${user} and date ${date} does not exist!`);
    return { msg: "Data successfully logged!", data };
  }

  /**
   * Get data based on the following filters:
   *   - `username`: A user's username
   *   - `date` or `dateRange`: A date in the format YYYY-MM-DD or a date range in the format YYYY-MM-DD_YYYY-MM-DD
   *
   * and the following sort options:
   *   - `sort`: A field to sort by (score or date)
   */
  async getData(user?: ObjectId, date?: Date, dateRange?: [Date, Date], sort?: SortOptions) {
    const allData = await this.data.readMany({}, { sort: { _id: -1 } });
    const [startDate, endDate] = dateRange || [undefined, undefined];
    const filteredData = allData.filter((data) => !(user && !data.user.equals(user)) && !(date && data.date !== date) && !(startDate && endDate && (data.date < startDate || endDate < data.date)));
    if (!sort) return filteredData;
    return filteredData.sort((a, b) => (sort === SortOptions.SCORE ? b.score - a.score : b.date.getTime() - a.date.getTime()));
  }

  async getByIds(ids: ObjectId[]) {
    return this.data.readMany({ _id: { $in: ids } });
  }

  async getByUser(user: ObjectId) {
    return this.data.readMany({ user });
  }

  redactUser(data: FormattedData) {
    // eslint-disable-next-line
    const { user, ...rest } = data;
    return rest;
  }

  async update(_id: ObjectId, date?: Date, score?: number) {
    await this.data.partialUpdateOne({ _id }, { date, score });
    return { msg: "Data successfully updated!" };
  }

  async delete(_id: ObjectId) {
    await this.data.deleteOne({ _id });
    return { msg: "Data successfully deleted!" };
  }

  async assertUserIsOwner(_id: ObjectId, user: ObjectId) {
    const data = await this.data.readOne({ _id });
    if (data === null) throw new NotFoundError(`Data ${_id} does not exist!`);
    if (data.user.toString() !== user.toString()) throw new DataOwnerNotMatchError(_id, user);
  }
}

export class DataOwnerNotMatchError extends NotAllowedError {
  constructor(
    public readonly _id: ObjectId,
    public readonly user: ObjectId,
  ) {
    super(`Data ${_id} is not owned by user ${user}!`);
  }
}
