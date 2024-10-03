import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";

export interface ItemDoc extends BaseDoc {
  item: ObjectId;
  author: ObjectId;
}

/**
 * concept: Commenting [Item, Author]
 */
export default class AssociatingConcept {
  public readonly owner: DocCollection<ItemDoc>;

  constructor(collectionName: string) {
    this.owner = new DocCollection<ItemDoc>(collectionName);
  }

  async associate(item: ObjectId, author: ObjectId) {
    const _id = await this.owner.createOne({ item, author });
    return { msg: "Association successfully created!", item: await this.owner.readOne({ _id }) };
  }

  async disassociate(item: ObjectId) {
    await this.owner.deleteOne({ item });
    return { msg: "Association deleted successfully!" };
  }
}
