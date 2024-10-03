import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";

export interface ItemDoc extends BaseDoc {
  author: ObjectId;
  item: ObjectId;
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
    const _id = await this.owner.createOne({ author, item });
    return { msg: "Association successfully created!", item: await this.owner.readOne({ _id }) };
  }

  async disassociate(item: ObjectId) {
    await this.owner.deleteOne({ item });
    return { msg: "Association deleted successfully!" };
  }

  async getByAuthor(author: ObjectId) {
    return this.owner.readMany({ author });
  }

  async getAuthor(item: ObjectId) {
    const itemDoc = await this.owner.readOne({ item });
    return itemDoc ? itemDoc.author : null;
  }
}
