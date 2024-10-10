import { ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface DataDoc extends BaseDoc {
  user: ObjectId;
  date: Date;
  score: number;
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
    return { msg: "Data successfully logged!", data: await this.data.readOne({ user, date }) };
  }

  async update(_id: ObjectId, date?: Date, score?: number) {
    await this.data.partialUpdateOne({ _id }, { date, score });
    return { msg: "Data successfully updated!" };
  }

  async delete(_id: ObjectId) {
    await this.data.deleteOne({ _id });
    return { msg: "Data successfully deleted!" };
  }

  async getDataByUser(user: ObjectId) {
    return await this.data.readMany({ user });
  }

  async getDataByDate(date: string) {
    return await this.data.readMany({ date: new Date(date) });
  }

  async getDataByUserAndDate(user: ObjectId, date: string) {
    return await this.data.readMany({ user, date: new Date(date) });
  }

  async getDataSortedByScore(_ids: ObjectId[]) {
    const data = await this.data.readMany({ _id: { $in: _ids } });
    return data.sort((a, b) => b.score - a.score);
  }

  async assertDataOwnerIsUser(_id: ObjectId, user: ObjectId) {
    const data = await this.data.readOne({ _id });
    if (data === null) {
      throw new NotFoundError(`Data ${_id} does not exist!`);
    }
    if (data.user.toString() !== user.toString()) {
      throw new DataOwnerNotMatchError(_id, user);
    }
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
