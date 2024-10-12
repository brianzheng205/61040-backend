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
    const _id = await this.data.createOne({ user, date, score });
    const data = await this.data.readOne({ _id });
    if (!data) throw new NotFoundError(`Data for user ${user} and date ${date} does not exist!`);
    return { msg: "Data successfully logged!", data: data };
  }

  /**
   * Get data based on the following filters:
   *   - `username`: A user's username
   *   - `date` or `dateRange`: A date or a date range
   *
   * and the following sort options:
   *   - `sort`: A field to sort by (score or date)
   */
  async getData(user?: ObjectId, date?: Date, dateRange?: [Date, Date], sort?: SortOptions) {
    const query: Record<string, unknown> = {};
    if (user) query.user = user;
    if (date) query.date = date;
    if (dateRange) query.date = { $gte: dateRange[0], $lte: dateRange[1] };
    return await this.data.readMany(query, { sort: sort === SortOptions.SCORE ? { score: -1 } : sort === SortOptions.DATE ? { date: -1 } : {} });
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
    const update: Partial<DataDoc> = {};
    if (date) update.date = date;
    if (score) update.score = score;
    await this.data.partialUpdateOne({ _id }, update);
    return { msg: "Data successfully updated!" };
  }

  async delete(_id: ObjectId) {
    await this.data.deleteOne({ _id });
    return { msg: "Data successfully deleted!" };
  }

  async assertUserIsOwner(_id: ObjectId, user: ObjectId) {
    const data = await this.data.readOne({ _id });
    if (!data) throw new NotFoundError(`Data ${_id} does not exist!`);
    if (!user.equals(data.user)) throw new DataOwnerNotMatchError(_id, user);
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
